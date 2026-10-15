//@ Character editor panel and camera: tabs generated from the slider table (shared/character.js), recommended setups, opened from the HUD or in creating mode after registering
/* ---------- character editor ----------
   Two ways in: the HUD button (Done just closes it) and creating mode, right after Register on the start card (it opens on the
   Class tab and its Enter button starts the game). A tab with close:true frames the head (face, hair) instead of the whole body.
   A row {slider:'legs'} takes its label, range and ends from BODY_SLIDERS; the character model's recommended range is drawn under the track and the row warns outside it.
   The Body tab starts with the model's recommended setups (named presets of the sliders: shared/character.js, docs/CHARACTER.md). */
let customizing=false, creating=false, edTab=0;
const edEl=$('#editor'), edTabs=$('#edTabs'), edBody=$('#edBody');
const cam={d:3,h:1.2,l:0.95};
const EDIT=[
  {tab:'Body', rows:[
    {k:'sex',label:'Play as',type:'seg',opts:[['male','Male'],['female','Female']]},
    {type:'setups'},
    {slider:'height'},{slider:'build'},{slider:'chest'},
    {k:'skin',label:'Skin tone',type:'color',opts:SKINS}
  ]},
  {tab:'Shape', rows:['shoulders','waist','hips','torso','legs','thighs','arms','neck','hands','feet'].map(k=>({slider:k}))},
  {tab:'Face', close:true, rows:[
    {k:'face',label:'Face shape',type:'seg',opts:[['round','Round'],['oval','Oval'],['angular','Angular']]}
  ].concat(['head','jaw','chin','cheeks'].map(k=>({slider:k})))},
  {tab:'Eyes', close:true, rows:[
    {k:'eyes',label:'Eye color',type:'color',opts:EYEC,base:'face'}
  ].concat(['eyeSize','eyeGap','eyeHeight','eyeTilt','brow'].map(k=>({slider:k})))},
  {tab:'Features', close:true, rows:['noseSize','mouthSize','lips','smile','earSize','earPoint'].map(k=>({slider:k})).concat([
    {k:'facial',label:'Facial hair',type:'seg',base:'face',opts:[['none','None'],['stubble','Stubble'],['mustache','Mustache'],['beard','Beard']]},
    // an outfit's face item: its marks, eye style and eye colour, and its facial hair or glasses (src/game/outfits)
    {k:'faceItem',label:'Face marks and eyes (signature)',type:'seg',opts:[['','None']].concat(ofItems('face'))}
  ])},
  {tab:'Hair', close:true, rows:[
    {k:'hair',label:'Style',type:'seg',opts:[['bald','Bald'],['buzz','Buzz'],['short','Short'],['messy','Messy'],['spiky','Spiky'],['curly','Curly'],['bob','Bob'],['long','Long'],['ponytail','Ponytail'],['twintail','Twin tails'],['braid','Braid'],['bun','Bun']].concat(ofItems('hair'))},
    {k:'hairColor',label:'Hair color',type:'color',opts:HAIRC,base:'hair'}
  ].concat(['hairLength','hairVolume','bangs'].map(k=>({slider:k}))).concat([
    {k:'ahoge',label:'Antenna hair (ahoge)',type:'seg',base:'hair',opts:[[true,'On'],[false,'Off']]}
  ])},
  {tab:'Class', rows:[
    {k:'cls',label:'Class (by weapon)',type:'seg',opts:[['warrior','Sword: Warrior'],['archer','Bow: Archer'],['mage','Wand: Mage']]},
    {type:'info'}
  ]},
  {tab:'Clothes', rows:[
    // the signature outfits (src/game/outfits): the first row puts a whole set on (all seven pieces, on its character's reference body); every piece also has its own row, here and in the Hair and Features tabs,
    // so the pieces of different sets mix. A row marked base:'<slot>' (a colour, hair colour...) is hidden while that slot wears an outfit's piece, which has its own colours.
    {k:'model',label:'Signature set (all seven pieces)',type:'seg',opts:[['base','None']].concat(Object.keys(OUTFITS).map(id=>[id,CHAR_MODELS[id].name]))},
    {k:'top',label:'Top',type:'seg',opts:[['tshirt','T-shirt'],['flannel','Flannel'],['jacket','Jacket'],['hoodie','Hoodie']].concat(ofItems('top'))},
    {k:'topColor',label:'',type:'color',base:'top',opts:CLOTH},
    {k:'bottom',label:'Bottoms',type:'seg',opts:[['trousers','Trousers'],['shorts','Shorts'],['skirt','Skirt']].concat(ofItems('bottom'))},
    {k:'bottomColor',label:'',type:'color',base:'bottom',opts:CLOTH},
    {k:'shoes',label:'Shoes',type:'seg',opts:[['boots','Boots'],['sneakers','Sneakers']].concat(ofItems('shoes'))},
    {k:'shoeColor',label:'',type:'color',base:'shoes',opts:SHOEC},
    {k:'armor',label:'Armor',type:'seg',opts:[['show','Show'],['hide','Hide (clothes only)']]},
    {k:'hat',label:'Hat',type:'seg',opts:[['none','None'],['ranger','Ranger'],['beanie','Beanie'],['cap','Cap'],['kasa','Kasa']].concat(ofItems('hat'))},
    {k:'hatColor',label:'',type:'color',base:'hat',opts:HATC},
    {k:'pack',label:'Backpack',type:'seg',base:'top',opts:[[true,'On'],[false,'Off']]},
    // an outfit's weapon dressing restyles whatever weapon you hold, whatever your class
    {k:'weaponItem',label:'Weapon style (signature)',type:'seg',opts:[['','Plain']].concat(ofItems('weapon'))}
  ]}
];
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function setLook(k,v){
  if(k==='cls'){ equipClass(v); return; }   // the server equips your best weapon of that class; applyGear (economy/items.js) redraws this panel
  if(k==='sex' && !LOOK.custom){ const keep={skin:LOOK.skin,cls:LOOK.cls}; for(const s of SLIDER_KEYS) keep[s]=LOOK[s]; LOOK=Object.assign({},v==='female'?LOOK_F:LOOK_M,keep); }   // the sliders and skin carry over
  else if(k==='model'){ LOOK=ofWear(LOOK,v); LOOK.custom=true; }   // a whole set on (or off: 'base'); every piece row below it can then change one piece
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
function renderEditor(){
  edTabs.innerHTML='';
  EDIT.forEach((tb,i)=>{
    const b=document.createElement('button'); b.className='ed-tab'; b.textContent=tb.tab; b.setAttribute('aria-selected',i===edTab);
    b.onclick=()=>{ edTab=i; renderEditor(); }; edTabs.append(b);
  });
  const sel=edTabs.children[edTab]; if(sel&&sel.scrollIntoView) try{ sel.scrollIntoView({block:'nearest',inline:'nearest'}); }catch(_){}
  edBody.innerHTML='';
  for(const row of EDIT[edTab].rows){
    if(row.fem && LOOK.sex!=='female') continue;
    if(row.base && ofPieces(LOOK)[row.base]) continue;   // an outfit's piece in that slot brings its own colours: these rows do nothing while it is worn
    const wrap=document.createElement('div'); wrap.className='ed-row'+(row.label||row.slider||row.type==='setups'?'':' ed-sub');
    if(row.label){ const lb=document.createElement('div'); lb.className='ed-label'; lb.textContent=row.label; wrap.append(lb); }
    if(row.slider){ sliderRow(wrap,row); }
    else if(row.type==='setups'){
      const mdl=charModelOf(LOOK), list=setupsOf(mdl,LOOK.sex), lb=document.createElement('div'); lb.className='ed-label'; lb.textContent='Recommended setups'; wrap.append(lb);
      const box=document.createElement('div'); box.className='chips'; let active=null;
      if(!list.length){ const p0=document.createElement('p'); p0.className='ed-info'; p0.textContent='The '+mdl.name+' model has no recommended setups for this body.'; wrap.append(p0); edBody.append(wrap); continue; }
      for(const st of list){ const b=document.createElement('button'); b.className='chip'; b.textContent=st.name; b.title=st.note; const on=setupActive(st); b.setAttribute('aria-pressed',on); if(on) active=st; b.onclick=()=>pickSetup(st); box.append(b); }
      const rs=document.createElement('button'); rs.className='chip'; rs.textContent='Reset sliders'; rs.onclick=()=>pickSetup({v:{}}); box.append(rs);
      wrap.append(box);
      const out=lookOutOfRange(LOOK,mdl), p=document.createElement('p'); p.className='ed-info';
      p.textContent=(active?active.note+' ':'')+'Sliders fitted for the '+mdl.name+' model; the band under each slider is its recommended range.'+(out.length?' Outside it now: '+out.map(k=>SLIDER_BY_KEY[k].label.toLowerCase()).join(', ')+'.':''); wrap.append(p);
    }
    else if(row.type==='seg'){
      const box=document.createElement('div'); box.className='chips';
      for(const [v,txt,title] of row.opts){
        const b=document.createElement('button'); b.className=title?'chip sig':'chip'; b.textContent=txt; if(title) b.title=title; b.setAttribute('aria-pressed',LOOK[row.k]===undefined?(v===false||v===''):LOOK[row.k]===v);   // a signature piece (tooltip: whose it is) is drawn a little gold
        b.onclick=()=>{ setLook(row.k,v); renderEditor(); }; box.append(b);
      }
      wrap.append(box);
    } else if(row.type==='color'){
      const box=document.createElement('div'); box.className='swatches';
      row.opts.forEach((v,i)=>{
        const b=document.createElement('button'); b.className='sw'; b.style.background=hex(v);
        b.setAttribute('aria-label',(row.label||row.k.replace('Color',''))+' color '+(i+1)); b.setAttribute('aria-pressed',LOOK[row.k]===v);
        b.onclick=()=>{ setLook(row.k,v); renderEditor(); }; box.append(b);
      });
      wrap.append(box);
    } else if(row.type==='info'){
      const c=CLASSES[clsOf()], p=document.createElement('p'); p.className='ed-info';
      p.textContent='Your class follows the weapon you hold (sword, bow or wand); picking one here equips the best one you own. '+c.desc; wrap.append(p);
      const ul=document.createElement('p'); ul.className='ed-info'; const sk=abilityOf(clsOf(),'skill',GEAR&&GEAR.skills,PL.level); const ba=abilityOf(clsOf(),'basic',GEAR&&GEAR.skills,PL.level); ul.innerHTML='<b>'+(ba?ba.name:c.basic.name)+'</b> basic attack &nbsp; '+(sk?'<b>'+sk.name+'</b> skill':PL.level<SKILL_SLOT_LV?'skill slot opens at level '+SKILL_SLOT_LV:'no skill equipped'); wrap.append(ul);
      const pr=document.createElement('p'); pr.className='ed-info'; pr.innerHTML='<b>Level '+PL.level+'</b> &nbsp; '+Math.floor(PL.exp)+' / '+Math.ceil(expToNext(PL.level))+' XP &nbsp; '+PL.maxHp+' health &nbsp; '+Math.round(PL.dmg)+' base damage'; wrap.append(pr);
      if(PL.level>1){ const rb=document.createElement('button'); rb.className='chip'; rb.style.marginTop='12px'; rb.textContent='Start over at level 1';
        rb.onclick=()=>{ if(!rb.dataset.sure){ rb.dataset.sure='1'; rb.textContent='Tap again to reset your level'; return; } netSend({t:'dev',cmd:'level',v:1}); };
        wrap.append(rb); }
    }
    edBody.append(wrap);
  }
}
function surpriseMe(){
  LOOK=randomLook(Math.random,{base:{custom:true,cls:LOOK.cls}});
  saveLook(); rebuildHiker(); renderEditor();
}
function openEditor(o){
  if(!Stream.terrainDone) return;
  customizing=true; creating=!!(o&&o.create);
  if(creating) edTab=Math.max(0,EDIT.findIndex(tb=>tb.tab==='Class'));
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
  const close=!!EDIT[edTab].close, s=hiker.scale;
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
