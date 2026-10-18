//@ Character editor panel and camera: four tabs (Presets, Body, Face, Clothes) with sub-tabs, picture tiles for every part, five outfit slots, per-piece armour visibility, opened from the HUD or in creating mode after registering
/* ---------- character editor ----------
   Two ways in: the HUD button (Done just closes it) and creating mode, right after Register on the start card (it opens on the Body tab and its Enter button starts the game).
   There is no class row: the class is the weapon you hold, not a cosmetic choice. A tab or sub-tab with close:true frames the head (face, hair, hats) instead of the whole body.
   EDIT = four tabs, each {tab, subs:[{name, rows}]}; edSub[tab] is the open sub-tab. Row types: slider (from BODY_SLIDERS), grid (picture tiles, see ui/character-thumbs.js),
   color (swatches), seg (text chips: only the few things a picture cannot show), setups, sets, slots (the five saved outfits), armor (show / hide one equipped armour piece).
   A row {slider:'legs'} takes its label, range and ends from BODY_SLIDERS; the character model's recommended range is drawn under the track and the row warns outside it.
   A garment can be None (top / bottom / shoes 'none': the body shows, with underwear where the clothes were: model-body.js UNDER_COL); equipped armour is shown or hidden per piece (look.armorHat / armorTop / armorBottom / armorShoes, items.js effectiveLookOf).
   Version 3.2, the general pieces (shared/cospieces.js): every grid row of a slot with crafted pieces carries slot:'<letter>'; a piece that is crafted and not yet made is drawn locked (a padlock and its recipe in the tooltip) but can still be tried on.
   A look that wears a locked piece is a try-on: it is not saved or sent (saveLook, model.js), the bar at the top of the editor lists what is missing, and Done will not close until the piece is made or the saved look is back (edTrying, edRevert).
   The five outfit slots live in this browser (localStorage 'wildwood-outfits-v1'): a slot keeps the clothes, hair, cape and aura, never the body. test: tools/editor-smoke.js, start-smoke */
let customizing=false, creating=false, edTab=0;
const edSub=[0,0,0,0];
const edEl=$('#editor'), edTabs=$('#edTabs'), edSubs=$('#edSubs'), edBody=$('#edBody');
const cam={d:3,h:1.2,l:0.95};
const ED_PAL_NAMES=['Main colour','Second colour','Third colour','Fourth colour'];
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
      {k:'skin',label:'Skin tone',type:'color',opts:SKINS.concat(SKINS_ODD)},{slider:'undertone'}]},
    {name:'Build', rows:[{type:'setups'},{slider:'height'},{slider:'build'}]},
    {name:'Upper body', rows:['chest','shoulders','waist','hips','torso'].map(k=>({slider:k}))},
    {name:'Limbs', rows:['legs','thighs','calves','arms','neck','hands','feet'].map(k=>({slider:k}))}
  ]},
  {tab:'Face', close:true, subs:[
    {name:'Hair', rows:[
      {k:'hair',type:'grid',kind:'hair',ids:edHair},
      {k:'hairColor',label:'',type:'color',opts:HAIRC,base:'hair'},{type:'palette',slot:'hair'},
      {k:'hairGrad',label:'Gradient',type:'seg',base:'hair',opts:HG_MODES.map(m=>m.slice())},
      {k:'hairColor2',label:'',type:'color',opts:HAIRC,base:'hair'},
      {k:'hairThird',label:'Third colour',type:'seg',base:'hair',opts:[[true,'On'],[false,'Off']]},
      {k:'hairColor3',label:'',type:'color',opts:HAIRC,base:'hair'}
    ].concat(['hairLength','hairVolume','bangs'].map(k=>({slider:k}))).concat([
      {k:'ahoge',label:'Antenna hair (ahoge)',type:'seg',base:'hair',opts:[[true,'On'],[false,'Off']]}])},
    {name:'Face', rows:[{k:'face',type:'grid',kind:'face',ids:()=>[['round'],['oval'],['angular']]}].concat(['head','jaw','chin','cheeks'].map(k=>({slider:k})))},
    {name:'Eyes', rows:[{k:'eyes',label:'',type:'color',opts:EYEC.concat(EYEC_MORE),base:'face'},{k:'eyes2',label:'Second eye colour',type:'dcolor',opts:EYEC.concat(EYEC_MORE),none:'Same'},{k:'pupil',type:'grid',kind:'pupil',ids:()=>FACE_PUPILS.map(p=>p.slice())}].concat(['eyeSize','eyeGap','eyeHeight','eyeTilt','brow'].map(k=>({slider:k})))},
    {name:'Nose & mouth', rows:['noseSize','mouthSize','mouthHeight','lips','blush','smile','earSize','earPoint'].map(k=>({slider:k})).concat([{k:'lipColor',label:'Lip colour',type:'color',opts:[0xb04a52,0xd26a78,0x8a3040,0xc98a7a,0x5a2a4a,0x2a2a36,0xe8b0b8,0xa83a2a],base:'face'}])},
    {name:'Beard & marks', rows:[
      {k:'facial',type:'grid',kind:'facial',ids:()=>[['none'],['stubble'],['mustache'],['beard']],base:'face'},
      // an outfit's face item: its marks, eye style and eye colour, and its facial hair or glasses (src/game/outfits)
      {k:'faceItem',type:'grid',kind:'faceItem',ids:()=>[['']].concat(ofItems('face'))}]}
  ]},
  {tab:'Clothes', subs:[
    // the signature outfits (src/game/outfits): every piece has its own sub-tab, so the pieces of different sets mix. A colour row marked base:'<slot>' paints the base garment, or, while that slot wears an outfit's piece,
    // recolours the piece (look.tint<Slot>; 'Designed colours' puts the original back).
    {name:'Hat', close:true, rows:[{k:'hat',type:'grid',kind:'hat',slot:'h',col:'hatColor',ids:()=>HT_HATS.map(h=>h.slice()).concat(HTX_HATS.map(h=>h.slice()),ofItems('hat'))},{k:'hatColor',label:'',type:'color',base:'hat',opts:TINTC},{type:'palette',slot:'hat'},{type:'armor',slot:'helmet'}]},
    {name:'Top', rows:[{k:'top',type:'grid',kind:'top',slot:'t',col:'topColor',ids:()=>GM_TOPS.map(h=>h.slice()).concat(GMX_TOPS.map(h=>h.slice()),ofItems('top'))},{k:'topColor',label:'',type:'color',base:'top',opts:TINTC},{type:'palette',slot:'top'},{type:'armor',slot:'top'}]},
    {name:'Bottom', rows:[{k:'bottom',type:'grid',kind:'bottom',slot:'b',col:'bottomColor',ids:()=>GM_BOTTOMS.map(h=>h.slice()).concat(GMX_BOTTOMS.map(h=>h.slice()),ofItems('bottom'))},{k:'bottomColor',label:'',type:'color',base:'bottom',opts:TINTC},{type:'palette',slot:'bottom'},{type:'armor',slot:'bottom'}]},
    {name:'Shoes', rows:[{k:'shoes',type:'grid',kind:'shoes',slot:'s',col:'shoeColor',ids:()=>GM_SHOES.map(h=>h.slice()).concat(GMX_SHOES.map(h=>h.slice()),ofItems('shoes'))},{k:'shoeColor',label:'',type:'color',base:'shoes',opts:TINTC},{type:'palette',slot:'shoes'},{type:'armor',slot:'shoes'}]},
    // version 3.2: the cape (the backpack is the free one) and the aura, each with its own colours; crafted ones are made at a Wayfarers' Lodge (shared/cospieces.js), and every one can be tried on
    {name:'Cape', rows:[
      {k:'cape',type:'grid',kind:'cape',slot:'c',ids:()=>[['']].concat(COS_CAPES.map(d=>[d[0],d[1],d[6]]))},
      {type:'dcolor',k:'capeColor',label:'Cloth colour',need:'cape',opts:TINTC},{type:'dcolor',k:'capeTrim',label:'Trim colour',need:'cape',opts:TINTC}]},
    {name:'Aura', rows:[
      {k:'aura',type:'grid',kind:'aura',slot:'a',ids:()=>[['']].concat(COS_AURAS.map(d=>[d[0],d[1],d[8]]))},
      {type:'dcolor',k:'auraColor',label:'Main colour',need:'aura',opts:TINTC},{type:'dcolor',k:'auraColor2',label:'Second colour',need:'aura',opts:TINTC}]},
    // version 3.2: up to three decorations, all crafted, any in any field, each with its own colour
    {name:'Decor', rows:[1,2,3].flatMap(n=>[{k:'deco'+n,label:'Decoration '+n,type:'grid',kind:'deco',slot:'d',col:'decoColor'+n,ids:()=>[['']].concat(CP_PIECES.filter(r=>r[0]==='d').map(r=>[r[1],r[2],r[4]]))},
      {type:'dcolor',k:'decoColor'+n,label:'Colour',need:'deco'+n,opts:TINTC}])},
    // an outfit's weapon dressing restyles whatever weapon you hold, whatever your class
    // version 3.1: gloves, the eighth piece: six plain ones and the glove of every set that has one (model-gloves.js)
    {name:'Gloves', rows:[{k:'gloves',type:'grid',kind:'gloves',slot:'g',col:'gloveColor',ids:()=>[['none']].concat(Object.keys(GL_BASE).map(id=>[id,GL_BASE[id].name,GL_BASE[id].text]),ofItems('glove'))},{k:'gloveColor',label:'',type:'color',base:'glove',opts:TINTC},{type:'palette',slot:'glove'}]},
    {name:'Weapon', rows:[{k:'weaponItem',type:'grid',kind:'weapon',ids:()=>[['']].concat(ofItems('weapon'))},{k:'tintWeapon',label:'',type:'color',base:'weapon',only:true,opts:TINTC}]},
    {name:'Armor', rows:[{type:'armor',slot:'all'},{type:'armor',slot:'helmet'},{type:'armor',slot:'top'},{type:'armor',slot:'bottom'},{type:'armor',slot:'shoes'}]}
  ]}
];
const ED_NAMES={tshirt:'T-shirt',twintail:'Twin tails',kasa:'Kasa hat',sneakers:'Sneakers',true:'Backpack',false:'No backpack'};
const edCur=()=>EDIT[edTab].subs[edSub[edTab]];
// ---- crafted pieces: locked, owned, and the try-on gate ----
const edOwned=()=>(typeof GEAR!=='undefined'&&GEAR&&GEAR.cos)||[];
const edLocks=()=>cosLocked(LOOK,edOwned());
// true while the look on the hiker wears a crafted piece that has not been made (saveLook: nothing is saved or sent then)
function edTrying(){ return customizing&&edLocks().length>0; }
function edRevert(){ LOOK=Object.assign({},LOOK_SAVED); rebuildHiker(); renderEditor(); }
function edFlashTry(){ const el=edBody.querySelector('.ed-try'); edBody.scrollTop=0; if(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } UI_SFX.click(); }
// the try-on bar: what the look is missing, how to make it, and the way back
function edTryBar(){
  const L=edLocks(); if(!L.length) return null;
  const bar=document.createElement('div'); bar.className='ed-try'; bar.setAttribute('role','status');
  const h=document.createElement('b'); h.textContent='Trying on: not saved yet'; bar.append(h);
  const p=document.createElement('p'); p.textContent='Only you see this look. Make every piece below at a Wayfarers\' Lodge to keep it.'; bar.append(p);
  for(const l of L){ const r=document.createElement('div'); r.className='ed-try-row'; const n=document.createElement('span'); n.textContent=CP_SLOTS[l.slot][2]+': '+l.name; const m=document.createElement('small'); m.textContent=cosRecipeText(l.slot,l.id); r.append(n,m); bar.append(r); }
  const b=document.createElement('button'); b.className='chip'; b.textContent='Back to my saved look'; b.onclick=edRevert; bar.append(b);
  return bar;
}
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
const OUTFIT_KEYS=['tintTop2','tintTop3','tintTop4','tintBottom2','tintBottom3','tintBottom4','tintShoes2','tintShoes3','tintShoes4','tintHat2','tintHat3','tintHat4','tintHair2','tintHair3','tintHair4','tintGloves2','tintGloves3','tintGloves4','hairGrad','hairColor2','hairThird','hairColor3','gloves','gloveColor','tintGloves','top','topColor','bottom','bottomColor','shoes','shoeColor','hat','hatColor','pack','weaponItem','tintTop','tintBottom','tintShoes','tintHat','tintHair','tintFace','tintWeapon','hair','hairColor','ahoge','faceItem','facial','model','cape','aura','capeColor','capeTrim','auraColor','auraColor2','pupil','eyes2','armor','armorHat','armorTop','armorBottom','armorShoes'];
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
  { const tb=edTryBar(); if(tb) edBody.append(tb); $('#edDone').classList.toggle('blocked',!!tb); $('#edDone').title=tb?'Make the pieces you are trying on, or go back to your saved look':''; }
  for(const row of edCur().rows){
    if(row.fem && LOOK.sex!=='female') continue;
    if(row.base && ofPieces(LOOK)[row.base] && row.type!=='color') continue;   // an outfit's piece in that slot has its own look: these rows (facial hair, antenna hair, backpack) do nothing while it is worn
    if(row.only && !ofPieces(LOOK)[row.base]) continue;
    if(row.need&&!LOOK[row.need]) continue;   // a colour row of a cape or an aura that is not worn   // a recolour row of a piece that is not worn
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
        const sig=!!OUTFITS[v], gap=(v===''||v==='none')&&(row.kind==='hat'||row.kind==='gloves'||row.kind==='faceItem'||row.kind==='cape'||row.kind==='aura'||row.kind==='deco')||(row.kind==='pack'&&v===false);   // "nothing": a crossed circle
        const spec=gap?null:{kind:row.kind,id:v};
        if(spec&&row.col&&!sig) spec.col=LOOK[row.col];
        if(spec&&row.kind==='sex') spec.sex=v;
        const cur=LOOK[row.k], on=cur===undefined?(v===false||v===''):cur===v;
        const D=row.slot&&!gap?cpDef(row.slot,v):null, made=!!D&&!D.free&&edOwned().includes(cpKey(row.slot,v)), locked=!!D&&!D.free&&!made;
        const title=(name?(tip?name+': '+tip:name):gap?'None':ED_NAMES[v]||String(v).replace(/^./,c=>c.toUpperCase()))+(locked?' (locked: '+cosRecipeText(row.slot,v)+'. Tap to try it on.)':made?' (made)':'');
        const b=cthTile(spec,{on,sig,title,cap:sig||row.kind==='cape'||row.kind==='aura'||row.kind==='deco'||row.kind==='pupil'||(D&&!D.free)?name:''}); b.onclick=()=>{ setLook(row.k,v); renderEditor(); };
        if(locked){ b.classList.add('locked'); const k=document.createElement('span'); k.className='ctile-lock'; k.textContent='\u{1F512}'; b.append(k); } else if(made){ b.classList.add('made'); }
        box.append(b); }
      wrap.append(box);
    }
    else if(row.type==='dcolor'){
      // a colour that may be left as designed (-1): the cape's cloth and trim, the aura's two colours, the second eye
      const key=row.k, dw=document.createElement('div'); dw.className='chips'; const d=document.createElement('button'); d.className='chip'; d.textContent=row.none||'As designed'; d.setAttribute('aria-pressed',!(LOOK[key]>=0)); d.onclick=()=>{ setLook(key,-1); renderEditor(); }; dw.append(d); wrap.append(dw);
      const box=document.createElement('div'); box.className='swatches';
      row.opts.forEach((v,i)=>{ const b=document.createElement('button'); b.className='sw'; b.style.background=hex(v); b.setAttribute('aria-label',row.label+' '+(i+1)); b.setAttribute('aria-pressed',LOOK[key]===v); b.onclick=()=>{ setLook(key,v); renderEditor(); }; box.append(b); });
      wrap.append(box);
    }
    else if(row.type==='palette'){
      // more colours of a worn outfit piece (OF_PAL): one picker for each further colour the piece is drawn in; 'Designed' puts that colour back
      const id=ofPieces(LOOK)[row.slot], P=id?ofPalOf(id,row.slot):[];
      if(P.length<2){ continue; }
      for(let i=1;i<P.length;i++){
        const key=OF_TINTX[row.slot][i-1], cap=document.createElement('div'); cap.className='ed-info'; cap.textContent=ED_PAL_NAMES[i]; wrap.append(cap);
        const d=document.createElement('button'); d.className='chip'; d.textContent='Designed'; d.style.borderLeft='10px solid '+hex(P[i]); d.setAttribute('aria-pressed',!(LOOK[key]>=0)); d.onclick=()=>{ setLook(key,-1); renderEditor(); };
        const dw=document.createElement('div'); dw.className='chips'; dw.append(d); wrap.append(dw);
        const box=document.createElement('div'); box.className='swatches';
        TINTC.forEach((v,j)=>{ const b=document.createElement('button'); b.className='sw'; b.style.background=hex(v); b.setAttribute('aria-label',ED_PAL_NAMES[i]+' color '+(j+1)); b.setAttribute('aria-pressed',LOOK[key]===v); b.onclick=()=>{ setLook(key,v); renderEditor(); }; box.append(b); });
        wrap.append(box); }
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
  LOOK=randomLook(Math.random,{base:{custom:true,cls:LOOK.cls}}); if(LOOK.pack){ LOOK.pack=false; LOOK.cape='pack'; }   // (the backpack is the free cape 'pack')
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
  if(edTrying()){ edFlashTry(); return; }   // a try-on cannot be kept: make the pieces or go back (edTryBar)
  saveLook();
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
