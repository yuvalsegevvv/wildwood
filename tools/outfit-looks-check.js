// Checks the outfit documents (docs/skillkits/looks/<id>.md) against the built outfits (src/game/outfits/<id>.js): prints PASS/FAIL. The code is the truth for the numbers; the docs are the design.
// Usage: node tools/outfit-looks-check.js           (needs `npm install` for three; no build; about 10 s)
//        node tools/outfit-looks-check.js --write   regenerate the "Slider recommendations" section of every doc from CHAR_MODELS.<id> (and drop the old stand-in section)
// The owner's scope: ONE outfit per character, designed for the character's own sex; a cosmetic set no class touches (one class-neutral weapon dressing, not three class skins);
// every item NEWLY designed (no existing hat, top, bottom, shoes or hair style, not even recoloured); one recommended slider setup per character (the reference), not several.
// Per outfit: the persona rows; exactly seven items, each with new ids that no existing model value uses; a builder note for every item; the weapon dressing rows; the outfit is BUILT
// (CHAR_MODELS.<id> with one reference setup for the persona's sex, OUTFITS.<id>, a dressing); the generated slider section is current. Across the twelve: four and four genders, every item id
// distinct, distinct charms, palettes, eye styles, hair colours and reference bodies.
const fs=require('fs'), path=require('path');
const C=require('./char-load')();
const DIR=process.env.LOOKS_DIR||path.join(__dirname,'..','docs','skillkits','looks'), SRC=path.join(__dirname,'..','src');
const WRITE=process.argv.includes('--write');
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };

/* ---- what the base model already has (read from the editor's rows and the armour looks, so this follows the code): a new item may not reuse one of these ids ---- */
const ed=fs.readFileSync(path.join(SRC,'game/ui/character-editor.js'),'utf8');
const opts=k=>{ const m=ed.match(new RegExp("k:'"+k+"'[^\\n]*?opts:\\[(\\[.*?\\])\\]\\}")); return m?[...m[1].matchAll(/\['?(\w+)'?,/g)].map(x=>x[1]):[]; };
const ENUM={hair:opts('hair'),top:opts('top'),bottom:opts('bottom'),shoes:opts('shoes'),hat:opts('hat'),facial:opts('facial')};
const items=fs.readFileSync(path.join(SRC,'shared/items.js'),'utf8'), armor=items.slice(items.indexOf('const ARMOR_LOOK'),items.indexOf('// east:'));
for(const k of ['hat','top','bottom','shoes']) for(const m of armor.matchAll(new RegExp(k+":'(\\w+)'",'g'))) if(!ENUM[k].includes(m[1])) ENUM[k].push(m[1]);
const EXISTING=new Set([].concat(ENUM.hair,ENUM.top,ENUM.bottom,ENUM.shoes,ENUM.hat,ENUM.facial,['round','default','none','outfit']));
const BASE=C.CHAR_MODELS.base;
const PARTS=['Head','Hair','Face','Top','Bottom','Shoes','Weapon'], DRESS=['Grip and bindings','Metal','Wood','Accent','Trim','Charm','Glow'];

/* ---- parsing ---- */
const heading=(md,h)=>{ const i=md.indexOf('\n'+h); if(i<0) return ''; const rest=md.slice(i+1+h.length), lv=h.match(/^#+/)[0].length, j=rest.search(new RegExp('\\n#{1,'+lv+'} ')); return j<0?rest:rest.slice(0,j); };
const rows=text=>text.split('\n').filter(l=>l.startsWith('|')).map(l=>l.slice(1,l.lastIndexOf('|')).split('|').map(c=>c.trim())).filter((r,i)=>i>=2);
const ticks=s=>[...(s||'').matchAll(/`([^`]+)`/g)].map(m=>m[1]);
const tick=s=>ticks(s)[0]||null;
const hexes=s=>[...s.matchAll(/0x([0-9a-fA-F]{6})/g)].map(m=>parseInt(m[1],16));

/* ---- the generated slider section: from the code, so it cannot disagree with it ---- */
function sliderSection(model){
  const sex=model.sexes[0], st=C.setupsOf(model,sex)[0], lab=k=>C.SLIDER_BY_KEY[k].label, fmt=n=>String(+n.toFixed(3));
  const L=[]; L.push('## Slider recommendations','',
    '<!-- generated from `CHAR_MODELS.'+model.id+'` in `src/game/outfits/'+model.id+'.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->','',
    'One recommended setup (the reference: the body this outfit was fitted for, '+sex+'), and the sliders whose recommended range is narrower than the base model\'s. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).','',
    '### Recommended setup (reference, '+sex+')','','**`'+st.id+'`**: '+(st.note||model.note||''),'','| Slider | Value |','|---|---|');
  for(const k of Object.keys(st.v)) L.push('| `'+k+'` ('+lab(k)+') | '+fmt(st.v[k])+' |');
  L.push('','Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).','','### Recommended ranges (only where narrower than the base model\'s)','','| Slider | Range | Base model |','|---|---|---|');
  for(const s of C.BODY_SLIDERS){ const r=model.ranges&&model.ranges[s.k]; if(!r) continue; const b=C.sliderRange(BASE,s.k); if(r[0]>b[0]+1e-9||r[1]<b[1]-1e-9) L.push('| `'+s.k+'` ('+s.label+') | '+fmt(r[0])+' .. '+fmt(r[1])+' | '+fmt(b[0])+' .. '+fmt(b[1])+' |'); }
  return L.join('\n')+'\n';
}
const sectionRange=(md,h)=>{ const i=md.indexOf('\n'+h+'\n'); if(i<0) return null; const rest=md.slice(i+1+h.length), j=rest.search(/\n## /); return [i+1,j<0?md.length:i+1+h.length+j+1]; };

const docs=fs.readdirSync(DIR).filter(f=>/^[a-z]+\.md$/.test(f)&&f!=='README.md').sort();
const O=[];
for(const f of docs){
  const id=f.slice(0,-3); let md=fs.readFileSync(path.join(DIR,f),'utf8'); const o={id,file:f,problems:[]}, bad=m=>o.problems.push(m);
  const model=C.CHAR_MODELS[id], factory=C.OUTFITS[id];
  if(!model||!factory) bad('the outfit is not built: CHAR_MODELS.'+id+' / OUTFITS.'+id+' (src/game/outfits/'+id+'.js)');
  if(model&&WRITE){   // regenerate the slider section and drop the old stand-in section
    const sr=sectionRange(md,'## Slider recommendations'), gen=sliderSection(model);
    if(sr) md=md.slice(0,sr[0])+gen+'\n'+md.slice(sr[1]); else bad('no "## Slider recommendations" section to regenerate');
    const st=sectionRange(md,'## The stand-in patch (preview only: existing fields, never the design)'); if(st) md=md.slice(0,st[0])+md.slice(st[1]);
    fs.writeFileSync(path.join(DIR,f),md);
  }
  const persona=Object.fromEntries(rows(heading(md,'## Persona')).map(r=>[r[0],r[1]]));
  o.sex=/^(male|female)/.exec(persona['Sex']||'')?.[1]; o.name=(persona['Name / id']||'').split('/')[0].trim(); o.pid=tick(persona['Name / id']||'');
  o.palette=hexes(persona['Palette']||''); o.kit=persona['Kit, element']||'';
  if(o.pid!==id) bad('the persona id '+o.pid+' is not the file name');
  if(!o.sex) bad('no sex'); if(o.palette.length<4) bad('the palette needs 4 or more colours'); if(!o.kit) bad('no kit / element row');
  for(const k of ['Theme','Feel','Silhouette','Reads as']) if(!persona[k]) bad('no "'+k+'" row');
  // the seven new items
  const parts=rows(heading(md,'## The seven new items')); o.parts={}; for(const r of parts) o.parts[r[0].replace(/\*/g,'')]=ticks(r[1]);
  if(parts.length!==7||!PARTS.every(p=>o.parts[p]&&o.parts[p].length>=1)) bad('the seven new items table needs exactly the parts '+PARTS.join(', ')+', each with an item id');
  o.itemIds=PARTS.flatMap(p=>o.parts[p]||[]);
  for(const x of o.itemIds){ if(!/^[a-z]+$/.test(x)) bad('item id '+x+' is not lower-case letters'); if(EXISTING.has(x)) bad('item id '+x+' is an existing model value: every item must be newly designed'); }
  o.hairFinal=(o.parts['Hair']||[])[0];
  // a builder note for every item, and the dressing rows
  const notes=rows(heading(md,'## Builder notes')).map(r=>({ids:ticks(r[0]),kind:r[1],what:r[2]}));
  for(const x of o.itemIds) if(!notes.some(n=>n.ids.includes(x)&&n.what&&(n.what.length>20||(o.parts['Weapon']||[])[0]===x))) bad('no builder note for item '+x);   // the weapon's note may just point at the dressing table
  const dress=Object.fromEntries(rows(heading(md,'## The weapon dressing')).map(r=>[r[0],r[1]])); o.dress=dress;
  for(const k of DRESS) if(!dress[k]) bad('the weapon dressing has no "'+k+'" row');
  o.charm=tick(dress['Charm']); if(!o.charm) bad('the dressing needs a named charm');
  for(const sec of ['## Body fit','## IP check','## Files']) if(!heading(md,sec).trim()) bad('the section "'+sec+'" is missing');
  // the code: one signature model for the persona's sex, one reference setup, inside its ranges; the generated section is current
  if(model){
    if(!model.signature) bad('the model is not marked signature:true');
    if(!(model.sexes&&model.sexes.length===1&&model.sexes[0]===o.sex)) bad('sexes must be exactly ['+o.sex+'] (the persona\'s sex)');
    const bd=C.validateCharModel(model); for(const p of bd) bad(p);
    if((model.setups||[]).length!==1) bad('a signature outfit ships exactly one recommended setup (has '+(model.setups||[]).length+')');
    for(const k in (model.ranges||{})){ const b=C.sliderRange(BASE,k), n=model.ranges[k]; if(n[0]<b[0]-1e-9||n[1]>b[1]+1e-9) bad('range of '+k+' ('+n.join('..')+') is not inside the base model\'s '+b.join('..')); }
    const st=C.setupsOf(model,model.sexes[0])[0];
    if(st){ const L=C.applySetup(C.fullLook({sex:st.sex}),st), out=C.lookOutOfRange(L,model); if(out.length) bad('the setup leaves '+out.join(', ')+' outside the outfit\'s recommended range (list it in the setup, or widen the range)'); }
    const sr=sectionRange(md,'## Slider recommendations'); if(!sr||md.slice(sr[0],sr[1]).trimEnd()!==sliderSection(model).trimEnd()) bad('the "Slider recommendations" section is out of date: run node tools/outfit-looks-check.js --write');
    if(sectionRange(md,'## The stand-in patch (preview only: existing fields, never the design)')) bad('the old stand-in section is still in the doc (run --write)');
    o.model=model; o.setup=st;
    try{ const L=C.ofWear(C.applySetup(Object.assign({},model.sexes[0]==='female'?C.LOOK_F:C.LOOK_M),st),id), rig=C.buildCharacter(L,{q:0.5}); o.eyes=JSON.stringify(rig.kit.sl.face.eyes||{}); o.hairColor=rig.kit.sl.hair.hairColor; o.dressOk=!!rig.dress; }catch(e){ bad('does not build: '+e.message); }
  }
  O.push(o);
}

for(const o of O) ok('outfit '+o.id+': persona, seven new items with builder notes, one weapon dressing, built with one reference setup, slider section current',o.problems.length===0,o.problems.slice(0,3).join(' | '));
ok('there are twenty-one outfits: the eight characters of THEMES.md, version 3\'s first four (Nephra, Sabir, Ogden, Ottoline), its second six (Pell, Genzo, Brynja, Tamsin, Zahra, Hollis) and the three Kin (Brindle, Dessa, Sefi)',O.length===21&&['tansy','torgeir','sazanka','corvin','sorrel','ambrose','dunstan','marigold','nephra','sabir','ogden','ottoline','pell','genzo','brynja','tamsin','zahra','hollis','brindle','dessa','sefi'].every(n=>O.some(o=>o.id===n)),O.map(o=>o.id).join(','));
ok('gender ratio: eleven female and ten male (the Kin add Brindle as a man, Dessa and Sefi as women)',O.filter(o=>o.sex==='female').length===11&&O.filter(o=>o.sex==='male').length===10);
ok('each outfit ships exactly one recommended setup, the reference, for its own sex',O.every(o=>o.model&&o.model.setups.length===1&&o.model.setups[0].def&&o.model.setups[0].sex===o.sex));
{ const all=O.flatMap(o=>o.itemIds); ok('every item id is new and distinct: '+all.length+' ids, '+new Set(all).size+' different, none an existing model value',all.length>=147&&new Set(all).size===all.length); }
ok('each outfit has its own hair item, none shared',new Set(O.map(o=>o.hairFinal)).size===O.length,O.map(o=>o.id+':'+o.hairFinal).join(' '));
ok('each outfit has its own weapon dressing with its own charm (all distinct)',O.every(o=>(o.parts['Weapon']||[]).length)&&new Set(O.map(o=>(o.parts['Weapon']||[])[0])).size===O.length&&new Set(O.map(o=>o.charm)).size===O.length,O.map(o=>o.charm).join(' '));
ok('the main colour of each palette is different (no two outfits share a first colour)',new Set(O.map(o=>o.palette[0])).size===O.length);
ok('each outfit has its own eye style and its own hair colour',new Set(O.map(o=>o.eyes)).size===O.length&&new Set(O.map(o=>o.hairColor)).size===O.length,O.map(o=>o.id+':'+(o.hairColor||0).toString(16)).join(' '));
{ const bodies=O.map(o=>{ const s=o.setup; return s?Object.keys(s.v).sort().map(k=>k+s.v[k]).join(','):''; }); ok('the reference bodies are all different',new Set(bodies).size===O.length); }
ok('every Face row names two or more new ids (a mark and an eye style, at least)',O.every(o=>(o.parts['Face']||[]).length>=2));
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
