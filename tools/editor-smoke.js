// Headless test of the character editor's version 3 revamp, straight from src/: a garment taken off (None) leaves the body with underwear where the clothes were,
// equipped armour is shown or hidden per piece, and the editor's tab tree is complete (4 tabs, sub-tabs, the five outfit slots, every grid row lists real values).
// Usage: node tools/editor-smoke.js
const fs=require('fs'), path=require('path'), {loadServer,SRC}=require('./load');
const C=require('./char-load')();
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const {x}=loadServer({send(){}},['effectiveLookOf','ITEM','ARMOR_SHOW','ARMOR_SLOTS','newGearFor']);
const UNDER=[0xe9/255,0xe3/255,0xd6/255], near=(a,b)=>Math.abs(a-b)<0.02;
// how many vertices wear the underwear cream (the band is a darker tone, so only the cream counts)
const cream=rig=>{ const t=C.tris(rig); let n=0; for(let i=0;i<t.length;i+=9) if(near(t[i+3],UNDER[0])&&near(t[i+4],UNDER[1])&&near(t[i+5],UNDER[2])) n++; return n; };
for(const sex of ['male','female']){
  const base=Object.assign({},sex==='male'?C.LOOK_M:C.LOOK_F,{hat:'none',armor:'hide',top:'tshirt',bottom:'trousers',shoes:'boots'}), mk=o=>C.buildCharacter(Object.assign({},base,o),{q:0.4});
  const dressed=cream(mk({})), noTop=mk({top:'none'}), noBot=mk({bottom:'none'}), noShoes=mk({shoes:'none'}), all=mk({top:'none',bottom:'none',shoes:'none'});
  ok(sex+': a dressed hiker shows no underwear',dressed===0);
  ok(sex+': each garment can be None and the model still builds (finite, no NaN)',[noTop,noBot,noShoes,all].every(r=>C.stats(r).bad===0));
  ok(sex+': bottoms None show underwear (briefs)',cream(noBot)>40,cream(noBot)+' vertices');
  ok(sex+': top None shows underwear only on a woman (a band top); a man\'s chest is bare',sex==='female'?cream(noTop)>40:cream(noTop)===0,cream(noTop)+' vertices');
  ok(sex+': shoes None leave bare feet (no boot colour on the feet)',(()=>{ const t=C.tris(noShoes); const sh=new (require('three').Color)(C.SHOEC[0]); let n=0; for(let i=0;i<t.length;i+=9) if(t[i+1]<0.06&&near(t[i+3],sh.r)&&near(t[i+4],sh.g)&&near(t[i+5],sh.b)) n++; return n===0; })());
}
// armour: shown unless hidden, per piece
const gear=x.newGearFor('warrior'); gear.eq.helmet='helmet2'; gear.eq.top='top2'; gear.eq.bottom='bottom2'; gear.eq.shoes='shoes2';
const have=Object.keys(x.ARMOR_SHOW).every(s=>x.ITEM[gear.eq[s]]);
ok('test armour ids exist',have);
if(have){
  const L={hat:'ranger',top:'jacket',bottom:'trousers',shoes:'boots',armor:'show'};
  const e0=x.effectiveLookOf(L,gear), e1=x.effectiveLookOf(Object.assign({},L,{armorTop:'hide'}),gear), e2=x.effectiveLookOf(Object.assign({},L,{armor:'hide'}),gear);
  ok('armour shown by default changes the look (a helm)',e0.hat==='helm');
  ok('hiding one piece shows your own clothes only there',e1.top==='jacket'&&e1.hat==='helm'&&e1.bottomColor!==L.bottomColor);
  ok('the old all-or-nothing switch still hides everything',e2.hat==='ranger'&&e2.top==='jacket'&&e2.bottom==='trousers'&&e2.shoes==='boots');
}
// weapon shapes: every outfit has its own sword, bow and staff model, and they all build (finite geometry) for all three classes
{ const names=Object.keys(C.OUTFITS||{}), seen={sword:new Set(),bow:new Set(),staff:new Set()}; let bad=[];
  for(const id of names){ const M=C.CHAR_MODELS[id]; const L=C.ofWear(Object.assign({},M.sexes&&M.sexes[0]==='female'?C.LOOK_F:C.LOOK_M),id);
    const rig=C.buildCharacter(L,{q:0.4}), sh=rig.dress&&rig.dress.shape;
    if(!sh){ bad.push(id+': no shape'); continue; }
    for(const [kind,cls] of [['sword','warrior'],['bow','archer'],['staff','mage']]){ seen[kind].add(sh[kind]);
      try{ const r=C.buildCharacter(L,{q:0.4}); const res=C.weaponsOn(r,cls,1); if(!res.objs.length||C.stats(r).bad) bad.push(id+' '+kind+': empty or NaN'); if(!C.WPN_SHAPES[kind][sh[kind]]) bad.push(id+' '+kind+': unknown shape '+sh[kind]); }catch(e){ bad.push(id+' '+kind+': '+e.message); } } }
  ok('every outfit has its own sword, bow and staff shape and all of them build',names.length>=18&&!bad.length,bad.slice(0,4).join('; '));
  ok('the swords and the staves are all different (twelve each)',seen.sword.size===names.length&&seen.staff.size===names.length,seen.sword.size+' / '+seen.staff.size); }
// the editor's tree
const ed=fs.readFileSync(path.join(SRC,'game/ui/character-editor.js'),'utf8');
const tabs=[...ed.matchAll(/^  \{tab:'(\w+)'/gm)].map(m=>m[1]);
ok('four main tabs: Presets, Body, Face, Clothes',tabs.join()==='Presets,Body,Face,Clothes',tabs.join());
ok('the Presets tab has the signature sets and five outfit slots',/type:'sets'/.test(ed)&&/type:'slots'/.test(ed)&&/i<5;i\+\+/.test(ed));
ok('every clothes piece has a None tile, armour rows and a colour row',['hat','top','bottom','shoes'].every(k=>new RegExp("k:'"+k+"',type:'grid'[^\\n]*(\\['none'\\]|HT_HATS|GM_TOPS|GM_BOTTOMS|GM_SHOES)").test(ed))&&(ed.match(/type:'armor',slot:/g)||[]).length>=8);
const cs=fs.readFileSync(path.join(SRC,'game/ui/character-thumbs.js'),'utf8');
ok('every grid kind the editor uses has a thumbnail view',[...new Set([...ed.matchAll(/kind:'(\w+)'/g)].map(m=>m[1]))].every(k=>new RegExp("case '"+k+"'").test(cs)||k==='outfit'||k==='slot'));
// a look with the new fields passes the server's cleaning and fits the field limit
ok('the look stays under 80 flat fields (the server cuts a look at 80)',Object.keys(C.LOOK_M).length<80,Object.keys(C.LOOK_M).length+' fields');
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
