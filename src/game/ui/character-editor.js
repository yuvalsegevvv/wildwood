//@ Character editor panel and camera: four tabs (Presets, Body, Face, Clothes) with sub-tabs, picture tiles for every part, five outfit slots, per-piece armour visibility, opened from the HUD or in creating mode after registering
/* ---------- character editor ----------
   Two ways in: the HUD button (Done just closes it) and creating mode, right after Register on the start card (it opens on the Body tab and its Enter button starts the game).
   There is no class row: the class is the weapon you hold, not a cosmetic choice. A tab or sub-tab with close:true frames the head (face, hair, hats) instead of the whole body.
   EDIT = four tabs, each {tab, subs:[{name, rows}]}; edSub[tab] is the open sub-tab. Row types: slider (from BODY_SLIDERS), grid (picture tiles, see ui/character-thumbs.js),
   color (swatches), seg (text chips: only the few things a picture cannot show), setups, sets, slots (the five saved outfits), armor (show / hide one equipped armour piece).
   A row {slider:'legs'} takes its label, range and ends from BODY_SLIDERS; the character model's recommended range is drawn under the track and the row warns outside it.
   A garment can be None (top / bottom / shoes 'none': the body shows, with underwear where the clothes were: model-body.js UNDER_COL); equipped armour is shown or hidden per piece (look.armorHat / armorTop / armorBottom / armorShoes, items.js effectiveLookOf).
   The five outfit slots live in this browser (localStorage 'wildwood-outfits-v1'): a slot keeps the clothes, hair, cape and aura, never the body. test: tools/editor-smoke.js, start-smoke */
let customizing=false, creating=false, edTab=0;
const edSub=[0,0,0,0];
const edEl=$('#editor'), edTabs=$('#edTabs'), edSubs=$('#edSubs'), edBody=$('#edBody');
const cam={d:3,h:1.2,l:0.95};
const EDSIZE=k=>({k,label:'',type:'color',opts:TINTC});
// one grid row: a picture tile per choice (v = the value, spec = what to draw, null = a crossed circle, cap = an optional tiny caption)
const edHair=()=>[['bald'],['buzz'],['short'],['messy'],['spiky'],['curly'],['bob'],['long'],['ponytail'],['twintail'],['braid'],['bun']].concat(ofItems('hair'));
const edGrid=(k,kind,ids,o)=>Object.assign({type:'grid',k,kind,ids,colKey:null},o||{});
const EDIT=[
  {tab:'Presets', subs:[
    {name:'Signature', rows:[{type:'sets'}]},
    {name:'My outfits', rows:[{type:'slots'}]}
  ]},
  {tab:'Body', subs:[
    {name:'Gender', rows:[
      {k:'sex',type:'grid',kind:'sex',ids:()=>[['male'],['female']]},
      {k:'skin',label:'Skin tone',type:'color',opts:SKINS}]},
    {name:'Build', rows:[{type:'setups'},{slider:'height'},{slider:'build'},{slider:'chest'}]},
    {name:'Upper body', rows:['shoulders','waist','hips','torso'].map(k=>({slider:k}))},
    {name:'Limbs', rows:['legs','thighs','arms','neck','hands','feet'].map(k=>({slider:k}))}
  ]},
  {tab:'Face', close:true, subs:[
    {name:'Hair', rows:[
      {k:'hair',type:'grid',kind:'hair',ids:edHair},
      {k:'hairColor',label:'',type:'color',opts:HAIRC,base:'hair'}
    ].concat(['hairLength','hairVolume','bangs'].map(k=>({slider:k}))).concat([
      {k:'ahoge',label:'Antenna hair (ahoge)',type:'seg',base:'hair',opts:[[true,'On'],[false,'Off']]}])},
    {name:'Face', rows:[{k:'face',type:'grid',kind:'face',ids:()=>[['round'],['oval'],['angular']]}].concat(['head','jaw','chin','cheeks'].map(k=>({slider:k})))},
    {name:'Eyes', rows:[{k:'eyes',label:'',type:'color',opts:EYEC,base:'face'}].concat(['eyeSize','eyeGap','eyeHeight','eyeTilt','brow'].map(k=>({slider:k})))},
    {name:'Nose & mouth', rows:['noseSize','mouthSize','lips','smile','earSize','earPoint'].map(k=>({slider:k}))},
    {name:'Beard & marks', rows:[
      {k:'facial',type:'grid',kind:'facial',ids:()=>[['none'],['stubble'],['mustache'],['beard']],base:'face'},
      // an outfit's face item: its marks, eye style and eye colour, and its facial hair or glasses (src/game/outfits)
      {k:'faceItem',type:'grid',kind:'faceItem',ids:()=>[['']].concat(ofItems('face'))}]}
  ]},
  {tab:'Clothes', subs:[
    // the signature outfits (src/game/outfits): every piece has its own sub-tab, so the pieces of different sets mix. A colour row marked base:'<slot>' paints the base garment, or, while that slot wears an outfit's piece,
    // recolours the piece (look.tint<Slot>; 'Designed colours' puts the original back).
    {name:'Hat', close:true, rows:[{k:'hat',type:'grid',kind:'hat',col:'hatColor',ids:()=>HT_HATS.map(h=>h.slice()).concat(ofItems('hat'))},{k:'hatColor',label:'',type:'color',base:'hat',opts:TINTC},{type:'armor',slot:'helmet'}]},
    {name:'Top', rows:[{k:'top',type:'grid',kind:'top',col:'topColor',ids:()=>GM_TOPS.map(h=>h.slice()).concat(ofItems('top'))},{k:'topColor',label:'',type:'color',base:'top',opts:TINTC},{type:'armor',slot:'top'}]},
    {name:'Bottom', rows:[{k:'bottom',type:'grid',kind:'bottom',col:'bottomColor',ids:()=>GM_BOTTOMS.map(h=>h.slice()).concat(ofItems('bottom'))},{k:'bottomColor',label:'',type:'color',base:'bottom',opts:TINTC},{type:'armor',slot:'bottom'}]},
    {name:'Shoes', rows:[{k:'shoes',type:'grid',kind:'shoes',col:'shoeColor',ids:()=>GM_SHOES.map(h=>h.slice()).concat(ofItems('shoes'))},{k:'shoeColor',label:'',type:'color',base:'shoes',opts:TINTC},{type:'armor',slot:'shoes'}]},
    // version 3: the parts the professions make (shared/cosmetics.js): only what you own is listed; they are made at a Wayfarers' Lodge from ore, logs and herbs
    {name:'Back & aura', rows:[
      {k:'pack',type:'grid',kind:'pack',ids:()=>[[false],[true]],base:'top'},
      {k:'cape',type:'grid',kind:'cape',ids:()=>[['']].concat(cosOwnedOpts('c')),empty:'Capes are made at a Wayfarers\' Lodge.'},
      {k:'aura',type:'grid',kind:'aura',ids:()=>[['']].concat(cosOwnedOpts('a')),empty:'Auras are made at a Wayfarers\' Lodge.'}]},
    // an outfit's weapon dressing restyles whatever weapon you hold, whatever your class
    // version 3.1: gloves, the eighth piece: six plain ones and the glove of every set that has one (model-gloves.js)
    {name:'Gloves', rows:[{k:'gloves',type:'grid',kind:'gloves',col:'gloveColor',ids:()=>[['none']].concat(Object.keys(GL_BASE).map(id=>[id,GL_BASE[id].name,GL_BASE[id].text]),ofItems('glove'))},{k:'gloveColor',label:'',type:'color',base:'glove',opts:TINTC}]},
    {name:'Weapon', rows:[{k:'weaponItem',type:'grid',kind:'weapon',ids:()=>[['']].concat(ofItems('weapon'))},{k:'tintWeapon',label:'',type:'color',base:'weapon',only:true,opts:TINTC}]},
    {name:'Armor', rows:[{type:'armor',slot:'all'},{type:'armor',slot:'helmet'},{type:'armor',slot:'top'},{type:'armor',slot:'bottom'},{type:'armor',slot:'shoes'}]}
  ]}
];
const ED_NAMES={tshirt:'T-shirt',twintail:'Twin tails',kasa:'Kasa hat',sneakers:'Sneakers',true:'Backpack',false:'No backpack'};
const edCur=()=>EDIT[edTab].subs[edSub[edTab]];
// [id, name, tooltip] of the auras ('a') or capes ('c') you own, in the order they are defined
function cosOwnedOpts(type){ const own=(GEAR&&GEAR.cos)||[], defs=type==='a'?COS_AURAS:COS_CAPES; return defs.filter(d=>own.includes(cosKey(type,d[0]))).map(d=>[d[0],d[1],d[type==='a'?8:6]]); }
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function setLook(k,v){
  if(k==='sex' && !LOOK.custom){ const keep={skin:LOOK.skin,cls:LOOK.cls}; for(const s of SLIDER_KEYS) keep[s]=LOOK[s]; LOOK=Object.assign({},v==='female'?LOOK_F:LOOK_M,keep); }   // the sliders and skin carry over
  else if(k==='model'){ const M=v!=='base'&&CHAR_MODELS[v]; if(M&&M.sexes&&M.sexes.length&&M.sexes[0]!==LOOK.sex) LOOK.sex=M.sexes[0];   // the set-up: the character's recommended gender,
    LOOK=ofWear(LOOK,v); LOOK.custom=true; }   // all seven pieces in their designed colours (and, below, the recommended sliders); every row can then change one piece or colour
  else { LOOK[k]=v; if(k!=='sex') LOOK.custom=true; ofTidy(LOOK); }   // (ofTidy: the model is the base again once none of the set's pieces is worn)
  if(k==='model'&&v!=='base'){ const st=setupsOf(CHAR_MODELS[v],LOOK.sex)[0]; if(st) LOOK=applySetup(LOOK,st); }   // wearing a signature outfit starts on its character's reference body
  saveLook(); rebuildHiker();
}
// a slider being dragged: rebuild at low detail at most every 60 ms (a full-detail build takes about 70 ms); the release rebuilds at full detail
let dragT=0, dragNeed=false;
function dragLook(k,v){
  LOOK[k]=v; LOOK.custom=true; dragNeed=true;
  if(dragT) return; dragT=setTimeout(()=>{ dragT=0; if(dragNeed){ dragNeed=false; rebuildHiker(charDetail('hero')*0.45); } },60);
}
function releaseLook(){ clearTimeout(dragT); dragT=0; dragNeed=false; saveLook(); rebuildHiker(); }
// does the look's slider set equal this recommended setup?
function setupActive(st){ const want=Object.assign({},SLIDER_DEFS,st.v); return SLIDER_KEYS.every(k=>Math.abs(sliderVal(LOOK,k)-want[k])<0.005); }
function pickSetup(st){ LOOK=applySetup(LOOK,st); LOOK.custom=true; saveLook(); rebuildHiker(); renderEditor(); }
// ---- armour visibility: equipped armour is drawn over your clothes unless hidden; per piece, or all at once ----
const ED_EYE='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16C7 9 11.5 6.5 16 6.5S25 9 29 16C25 23 20.5 25.5 16 25.5S7 23 3 16z"/><circle cx="16" cy="16" r="4.6"/></svg>';
const ED_EYE_OFF='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16C7 9 11.5 6.5 16 6.5S25 9 29 16C25 23 20.5 25.5 16 25.5S7 23 3 16z"/><circle cx="16" cy="16" r="4.6"/><path d="M5 27L27 5"/></svg>';
const ED_SAVE='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5h17l4 4v18H6z"/><path d="M10 5v7h11V5M10 27v-8h12v8"/></svg>';
const ED_X='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 8l16 16M24 8L8 24"/></svg>';
const edShown=slot=>LOOK.armor!=='hide'&&LOOK[ARMOR_SHOW[slot]]!=='hide';
function setArmor(slot,show){
  if(LOOK.armor==='hide'){ LOOK.armor='show'; for(const s of ARMOR_SLOTS) LOOK[ARMOR_SHOW[s]]='hide'; }   // the old all-or-nothing switch becomes four per-piece ones
  for(const s of (slot==='all'?ARMOR_SLOTS:[slot])) LOOK[ARMOR_SHOW[s]]=show?'show':'hide';
  LOOK.custom=true; saveLook(); rebuildHiker(); renderEditor();
}
function armorRow(wrap,slot){
  const it=slot!=='all'&&GEAR&&GEAR.eq&&ITEM[GEAR.eq[slot]], box=document.createElement('div'); box.className='armor-row';
  const ico=document.createElement('span'); ico.className='armor-ico'+(it?'':' empty');
  if(slot==='all'){ ico.textContent=''; ico.classList.add('all'); } else ico.innerHTML=it?itemIcon(it):slotIcon(slot);
  if(it) ico.title=it.name;
  box.append(ico);
  const on=slot==='all'?ARMOR_SLOTS.every(edShown):edShown(slot);
  for(const [show,svg,t] of [[true,ED_EYE,'Show armor'],[false,ED_EYE_OFF,'Hide armor (show your clothes)']]){
    const b=document.createElement('button'); b.className='ctile small'; b.title=t; b.setAttribute('aria-label',t); b.setAttribute('aria-pressed',show?on:(slot==='all'?ARMOR_SLOTS.every(s=>!edShown(s)):!on));
    const pic=document.createElement('span'); pic.className='ctile-pic icon'; pic.innerHTML=svg; b.append(pic); b.onclick=()=>setArmor(slot,show); box.append(b); }
  wrap.append(box);
}
// ---- the five outfit slots ----
const OUTFIT_KEYS=['gloves','gloveColor','tintGloves','top','topColor','bottom','bottomColor','shoes','shoeColor','hat','hatColor','pack','weaponItem','tintTop','tintBottom','tintShoes','tintHat','tintHair','tintFace','tintWeapon','hair','hairColor','ahoge','faceItem','facial','model','cape','aura','armor','armorHat','armorTop','armorBottom','armorShoes'];
function outfitSlots(){ try{ const a=JSON.parse(localStorage.getItem('wildwood-outfits-v1')||'[]'); const out=[]; for(let i=0;i<5;i++) out.push(a&&typeof a[i]==='object'?a[i]:null); return out; }catch(_){ return [null,null,null,null,null]; } }
function putOutfitSlots(a){ try{ localStorage.setItem('wildwood-outfits-v1',JSON.stringify(a)); }catch(_){} }
function saveOutfitSlot(i){ const a=outfitSlots(), o={}; for(const k of OUTFIT_KEYS) if(LOOK[k]!==undefined) o[k]=LOOK[k]; a[i]=o; putOutfitSlots(a); renderEditor(); }
function clearOutfitSlot(i){ const a=outfitSlots(); a[i]=null; putOutfitSlots(a); renderEditor(); }
function wearOutfitSlot(i){ const o=outfitSlots()[i]; if(!o) return; const mdl=o.model; LOOK=Object.assign({},LOOK,o); LOOK.custom=true; if(!(mdl in CHAR_MODELS)&&mdl!=='base') LOOK.model='base'; ofTidy(LOOK); saveLook(); rebuildHiker(); renderEditor(); }
const outfitSlotLook=o=>{ const l=Object.assign({},o); delete l.armor; delete l.armorHat; delete l.armorTop; delete l.armorBottom; delete l.armorShoes; return l; };
const sameSlot=o=>OUTFIT_KEYS.every(k=>o[k]===undefined||o[k]===LOOK[k]);
function sliderRow(wrap,row){
  const s=SLIDER_BY_KEY[row.slider], mdl=charModelOf(LOOK), rec=sliderRange(mdl,s.k), cur=sliderVal(LOOK,s.k);
  const lb=document.createElement('div'); lb.className='ed-label ed-slabel'; const nm=document.createElement('span'); nm.textContent=s.label; const val=document.createElement('span'); val.className='ed-val'; lb.append(nm,val); wrap.append(lb);
  const box=document.createElement('div'); box.className='range'; const a=document.createElement('span'); a.textContent=s.ends[0];
  const track=document.createElement('div'); track.className='range-track';
  const inp=document.createElement('input'); inp.type='range'; inp.min=s.min; inp.max=s.max; inp.step=0.01; inp.value=cur; inp.setAttribute('aria-label',s.label);
  const band=document.createElement('i'); band.className='rec'; band.style.left=((rec[0]-s.min)/(s.max-s.min)*100)+'%'; band.style.width=((rec[1]-rec[0])/(s.max-s.min)*100)+'%'; band.title='Recommended range for '+mdl.name;
  track.append(inp,band);
  const b=document.createElement('span'); b.textContent=s.ends[1];
  const warn=document.createElement('div'); warn.className='ed-warn'; warn.textContent='Outside the recommended range: outfits may clip or stretch.';
  const show=v=>{ val.textContent=(Math.round(v*100)/100).toFixed(2); warn.hidden=!(v<rec[0]-1e-6||v>rec[1]+1e-6); };
  show(cur);
  inp.oninput=()=>{ const v=parseFloat(inp.value); show(v); dragLook(s.k,v); };
  inp.onchange=releaseLook;
  box.append(a,track,b); wrap.append(box,warn);
}
function edCaption(txt){ const lb=document.createElement('div'); lb.className='ed-label'; lb.textContent=txt; return lb; }
function renderEditor(){
  const keepKey=edTab+':'+edSub[edTab], keepTop=edBody.scrollTop, same=edBody.dataset.at===keepKey;
  edTabs.innerHTML=''; edSubs.innerHTML='';
  EDIT.forEach((tb,i)=>{
    const b=document.createElement('button'); b.className='ed-tab'; b.textContent=tb.tab; b.setAttribute('aria-selected',i===edTab);
    b.onclick=()=>{ edTab=i; renderEditor(); }; edTabs.append(b);
  });
  const subs=EDIT[edTab].subs; edSub[edTab]=Math.min(edSub[edTab],subs.length-1);
  subs.forEach((sb,i)=>{
    const b=document.createElement('button'); b.className='ed-sub'; b.textContent=sb.name; b.setAttribute('aria-selected',i===edSub[edTab]);
    b.onclick=()=>{ edSub[edTab]=i; renderEditor(); }; edSubs.append(b);
  });
  edBody.innerHTML=''; edBody.dataset.at=edTab+':'+edSub[edTab];
  for(const row of edCur().rows){
    if(row.fem && LOOK.sex!=='female') continue;
    if(row.base && ofPieces(LOOK)[row.base] && row.type!=='color') continue;   // an outfit's piece in that slot has its own look: these rows (facial hair, antenna hair, backpack) do nothing while it is worn
    if(row.only && !ofPieces(LOOK)[row.base]) continue;   // a recolour row of a piece that is not worn
    const wrap=document.createElement('div'); wrap.className='ed-row'+(row.label||row.slider||row.type==='setups'?'':' ed-sub');
    if(row.label){ const lb=document.createElement('div'); lb.className='ed-label'; lb.textContent=row.label; wrap.append(lb); }
    if(row.slider){ sliderRow(wrap,row); }
    else if(row.type==='setups'){
      const mdl=charModelOf(LOOK), list=setupsOf(mdl,LOOK.sex);
      if(!list.length){ const p0=document.createElement('p'); p0.className='ed-info'; p0.textContent='The '+mdl.name+' model has no recommended setups for this body.'; wrap.append(p0); edBody.append(wrap); continue; }
      const box=document.createElement('div'); box.className='tiles'; let active=null;
      for(const st of list){ const on=setupActive(st); if(on) active=st;
        const b=cthTile({kind:'slot',id:'setup:'+st.name,look:Object.assign({},SLIDER_DEFS,st.v)},{on,title:st.name+': '+st.note,cap:st.name}); b.onclick=()=>pickSetup(st); box.append(b); }
      const rs=cthTile(null,{title:'Reset sliders'}); rs.onclick=()=>pickSetup({v:{}}); box.append(rs);
      wrap.append(box);
      const out=lookOutOfRange(LOOK,mdl);
      if(out.length){ const p=document.createElement('p'); p.className='ed-info'; p.textContent='Outside the recommended range for the '+mdl.name+' model: '+out.map(k=>SLIDER_BY_KEY[k].label.toLowerCase()).join(', ')+'.'; wrap.append(p); }
    }
    else if(row.type==='grid'){
      const ids=row.ids(), box=document.createElement('div'); box.className='tiles'+(row.kind==='sex'?' two':'');
      if(row.empty&&ids.length<2){ const p0=document.createElement('p'); p0.className='ed-info'; p0.textContent=row.empty; wrap.append(p0); }
      for(const [v,name,tip] of ids){
        const sig=!!OUTFITS[v], gap=(v===''||v==='none')&&(row.kind==='hat'||row.kind==='gloves'||row.kind==='faceItem'||row.kind==='cape'||row.kind==='aura')||(row.kind==='pack'&&v===false);   // "nothing": a crossed circle
        const spec=gap?null:{kind:row.kind,id:v};
        if(spec&&row.col&&!sig) spec.col=LOOK[row.col];
        if(spec&&row.kind==='sex') spec.sex=v;
        const cur=LOOK[row.k], on=cur===undefined?(v===false||v===''):cur===v;
        const title=name?(tip?name+': '+tip:name):gap?'None':ED_NAMES[v]||String(v).replace(/^./,c=>c.toUpperCase());
        const b=cthTile(spec,{on,sig,title,cap:sig||row.kind==='cape'||row.kind==='aura'?name:''}); b.onclick=()=>{ setLook(row.k,v); renderEditor(); }; box.append(b); }
      wrap.append(box);
    }
    else if(row.type==='armor'){ armorRow(wrap,row.slot); }
    else if(row.type==='seg'){
      const box=document.createElement('div'); box.className='chips';
      for(const [v,txt,title] of (typeof row.opts==='function'?row.opts():row.opts)){
        const b=document.createElement('button'); b.className=title?'chip sig':'chip'; b.textContent=txt; if(title) b.title=title; b.setAttribute('aria-pressed',LOOK[row.k]===undefined?(v===false||v===''):LOOK[row.k]===v);   // a signature piece (tooltip: whose it is) is drawn a little gold
        b.onclick=()=>{ setLook(row.k,v); renderEditor(); }; box.append(b);
      }
      wrap.append(box);
    } else if(row.type==='color'){
      const tinted=row.base&&ofPieces(LOOK)[row.base], key=tinted?OF_TINT[row.base]:row.k;   // a worn outfit piece is recoloured (-1 = the colours it was designed in)
      if(tinted){ const d=document.createElement('button'); d.className='chip'; d.textContent='Designed colours'; d.setAttribute('aria-pressed',!(LOOK[key]>=0)); d.onclick=()=>{ setLook(key,-1); renderEditor(); }; const dw=document.createElement('div'); dw.className='chips'; dw.append(d); wrap.append(dw); }
      const box=document.createElement('div'); box.className='swatches';
      row.opts.forEach((v,i)=>{
        const b=document.createElement('button'); b.className='sw'; b.style.background=hex(v);
        b.setAttribute('aria-label',(row.label||row.k.replace('Color',''))+' color '+(i+1)); b.setAttribute('aria-pressed',LOOK[key]===v);
        b.onclick=()=>{ setLook(key,v); renderEditor(); }; box.append(b);
      });
      wrap.append(box);
    } else if(row.type==='sets'){
      // the signature characters (src/game/outfits): one tap sets up the whole look: the recommended gender, body sliders, all seven pieces and the colours they were designed in; everything stays editable afterwards in the Clothes and Face tabs
      const box=document.createElement('div'); box.className='tiles';
      const off=cthTile(null,{title:'Take the outfit off (plain clothes)',on:false}); off.onclick=()=>{ setLook('model','base'); renderEditor(); }; box.append(off);
      for(const id of Object.keys(OUTFITS)){ const M=CHAR_MODELS[id], on=LOOK.model===id&&Object.keys(ofPieces(LOOK)).length===7, fem=!!(M.sexes&&M.sexes[0]==='female');
        const b=cthTile({kind:'outfit',id},{on,sig:true,cap:M.name,title:M.name+' ('+(fem?'female':'male')+'). '+(M.note||'')}); b.onclick=()=>{ setLook('model',id); renderEditor(); }; box.append(b); }
      wrap.append(box);
    } else if(row.type==='slots'){
      const a=outfitSlots(), box=document.createElement('div'); box.className='tiles slots';
      for(let i=0;i<5;i++){
        const o=a[i], card=document.createElement('div'); card.className='slot-card';
        let t;
        if(o){ t=cthTile({kind:'slot',id:'slot'+i,look:outfitSlotLook(o)},{on:sameSlot(o),title:'Wear outfit '+(i+1)}); t.onclick=()=>wearOutfitSlot(i); }
        else { t=cthTile(null,{title:'Save what you wear in slot '+(i+1)}); t.classList.add('empty'); t.firstChild.classList.add('add'); t.onclick=()=>saveOutfitSlot(i); }
        card.append(t);
        const bar=document.createElement('div'); bar.className='slot-bar';
        const n=document.createElement('span'); n.className='slot-n'; n.textContent=String(i+1); bar.append(n);
        const sv=document.createElement('button'); sv.className='ibtn'; sv.innerHTML=ED_SAVE; sv.title='Save what you wear in slot '+(i+1); sv.setAttribute('aria-label',sv.title); sv.onclick=()=>saveOutfitSlot(i); bar.append(sv);
        if(o){ const cl=document.createElement('button'); cl.className='ibtn'; cl.innerHTML=ED_X; cl.title='Empty slot '+(i+1); cl.setAttribute('aria-label',cl.title); cl.onclick=()=>clearOutfitSlot(i); bar.append(cl); }
        card.append(bar); box.append(card);
      }
      wrap.append(box);
    }
    edBody.append(wrap);
  }
  if(same) edBody.scrollTop=keepTop;
}
function surpriseMe(){
  LOOK=randomLook(Math.random,{base:{custom:true,cls:LOOK.cls}});
  saveLook(); rebuildHiker(); renderEditor();
}
function openEditor(o){
  if(!Stream.terrainDone) return;
  customizing=true; creating=!!(o&&o.create);
  if(creating){ edTab=1; edSub[1]=0; }   // creating starts on Body > Gender
  $('#edTitle').textContent=creating?'Create your hiker':'Your hiker'; $('#edDone').textContent=creating?'Enter the world':'Done';
  releasePointer();
  P.vx=P.vz=0; joyX=joyY=0;
  hiker.g.visible=true;
  $('#start').classList.add('hide');
  document.body.classList.add('editing');
  edEl.hidden=false; renderEditor(); UI_SFX.open();
  const fwd=P.face; cam.d=3; cam.h=1.2; cam.l=0.95; P.editYaw=fwd;
}
function closeEditor(){
  const enter=creating; customizing=creating=false; UI_SFX.close();
  camera.clearViewOffset();
  edEl.hidden=true; document.body.classList.remove('editing');
  hiker.g.visible=thirdPerson||!started;
  if(enter) beginPlay();
}
function editorCamera(dt){
  const sb=edCur(), close=!!(EDIT[edTab].close||sb.close), s=hiker.scale;
  const td=close?(LOW?1.25:1.05):(LOW?3.6:3.1), th=close?1.64:1.15, tl=close?1.6:0.92;
  const k=Math.min(1,dt*4); cam.d+=(td-cam.d)*k; cam.h+=(th-cam.h)*k; cam.l+=(tl-cam.l)*k;
  const fx=-Math.sin(P.face), fz=-Math.cos(P.face);
  const cx=P.x+fx*cam.d, cz=P.z+fz*cam.d;
  camera.position.set(cx,Math.max(P.y+cam.h*s,Math.max(getH(cx,cz),WATER)+0.35),cz);
  camera.lookAt(P.x,P.y+cam.l*s,P.z);
  if(innerWidth>=720) camera.setViewOffset(innerWidth,innerHeight,Math.round(edEl.offsetWidth/2),0,innerWidth,innerHeight);
  else camera.setViewOffset(innerWidth,innerHeight,0,Math.round(edEl.offsetHeight/2),innerWidth,innerHeight);
}
$('#edDone').addEventListener('click',closeEditor);
$('#edRandom').addEventListener('click',surpriseMe);
$('#bLook').addEventListener('click',e=>{ e.currentTarget.blur(); customizing?closeEditor():openEditor(); });
