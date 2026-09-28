//@ Character editor panel and camera: opened from the HUD, or in creating mode right after a new account is registered
/* ---------- character editor ----------
   Two ways in: the HUD button (Done just closes it) and creating mode, right after Register on the start card (it opens on the
   Class tab and its Enter button starts the game). A tab with close:true frames the head (face, hair) instead of the whole body. */
let customizing=false, creating=false, edTab=0;
const edEl=$('#editor'), edTabs=$('#edTabs'), edBody=$('#edBody');
const cam={d:3,h:1.2,l:0.95};
const EDIT=[
  {tab:'Body', rows:[
    {k:'sex',label:'Play as',type:'seg',opts:[['male','Male'],['female','Female']]},
    {k:'height',label:'Height',type:'range',min:0.9,max:1.1,step:0.01,ends:['Shorter','Taller']},
    {k:'build',label:'Build',type:'range',min:0.84,max:1.24,step:0.01,ends:['Slim','Sturdy']},
    {k:'chest',label:'Chest',type:'range',min:0.5,max:1.6,step:0.01,ends:['Smaller','Larger'],fem:true},
    {k:'skin',label:'Skin tone',type:'color',opts:SKINS}
  ]},
  {tab:'Face', close:true, rows:[
    {k:'face',label:'Face shape',type:'seg',opts:[['round','Round'],['oval','Oval'],['angular','Angular']]},
    {k:'eyes',label:'Eye color',type:'color',opts:EYEC},
    {k:'facial',label:'Facial hair',type:'seg',opts:[['none','None'],['stubble','Stubble'],['mustache','Mustache'],['beard','Beard']]}
  ]},
  {tab:'Hair', close:true, rows:[
    {k:'hair',label:'Style',type:'seg',opts:[['bald','Bald'],['buzz','Buzz'],['short','Short'],['curly','Curly'],['bob','Bob'],['long','Long'],['ponytail','Ponytail'],['bun','Bun']]},
    {k:'hairColor',label:'Hair color',type:'color',opts:HAIRC}
  ]},
  {tab:'Class', rows:[
    {k:'cls',label:'Class (by weapon)',type:'seg',opts:[['warrior','Sword: Warrior'],['archer','Bow: Archer'],['mage','Wand: Mage']]},
    {type:'info'}
  ]},
  {tab:'Clothes', rows:[
    {k:'top',label:'Top',type:'seg',opts:[['tshirt','T-shirt'],['flannel','Flannel'],['jacket','Jacket'],['hoodie','Hoodie']]},
    {k:'topColor',label:'',type:'color',opts:CLOTH},
    {k:'bottom',label:'Bottoms',type:'seg',opts:[['trousers','Trousers'],['shorts','Shorts'],['skirt','Skirt']]},
    {k:'bottomColor',label:'',type:'color',opts:CLOTH},
    {k:'shoes',label:'Shoes',type:'seg',opts:[['boots','Boots'],['sneakers','Sneakers']]},
    {k:'shoeColor',label:'',type:'color',opts:SHOEC},
    {k:'armor',label:'Armor',type:'seg',opts:[['show','Show'],['hide','Hide (clothes only)']]},
    {k:'hat',label:'Hat',type:'seg',opts:[['none','None'],['ranger','Ranger'],['beanie','Beanie'],['cap','Cap'],['kasa','Kasa']]},
    {k:'hatColor',label:'',type:'color',opts:HATC},
    {k:'pack',label:'Backpack',type:'seg',opts:[[true,'On'],[false,'Off']]}
  ]}
];
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function setLook(k,v){
  if(k==='cls'){ equipClass(v); return; }   // the server equips your best weapon of that class; applyGear (economy/items.js) redraws this panel
  if(k==='sex' && !LOOK.custom){ LOOK=Object.assign({},v==='female'?LOOK_F:LOOK_M,{height:LOOK.height,build:LOOK.build,chest:LOOK.chest,skin:LOOK.skin,cls:LOOK.cls}); }
  else { LOOK[k]=v; if(k!=='sex') LOOK.custom=true; }
  saveLook(); rebuildHiker();
}
function renderEditor(){
  edTabs.innerHTML='';
  EDIT.forEach((tb,i)=>{
    const b=document.createElement('button'); b.className='ed-tab'; b.textContent=tb.tab; b.setAttribute('aria-selected',i===edTab);
    b.onclick=()=>{ edTab=i; renderEditor(); }; edTabs.append(b);
  });
  edBody.innerHTML='';
  for(const row of EDIT[edTab].rows){
    if(row.fem && LOOK.sex!=='female') continue;
    const wrap=document.createElement('div'); wrap.className='ed-row'+(row.label?'':' ed-sub');
    if(row.label){ const lb=document.createElement('div'); lb.className='ed-label'; lb.textContent=row.label; wrap.append(lb); }
    if(row.type==='seg'){
      const box=document.createElement('div'); box.className='chips';
      for(const [v,txt] of row.opts){
        const b=document.createElement('button'); b.className='chip'; b.textContent=txt; b.setAttribute('aria-pressed',LOOK[row.k]===v);
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
    } else if(row.type==='range'){
      const box=document.createElement('div'); box.className='range';
      const a=document.createElement('span'); a.textContent=row.ends[0];
      const inp=document.createElement('input'); inp.type='range'; inp.min=row.min; inp.max=row.max; inp.step=row.step; inp.value=LOOK[row.k]!=null?LOOK[row.k]:1; inp.setAttribute('aria-label',row.label);
      inp.oninput=()=>setLook(row.k,parseFloat(inp.value));
      const b=document.createElement('span'); b.textContent=row.ends[1];
      box.append(a,inp,b); wrap.append(box);
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
// Chest size in the settings popover too (female hikers only), so it can be tuned in game without the editor.
// Rebuild while dragging; save (and tell the server) once, on release.
const chestIn=$('#setChest');
function syncLookSettings(){ $('#lookSec').hidden=LOOK.sex!=='female'; chestIn.value=LOOK.chest!=null?LOOK.chest:1; }
chestIn.addEventListener('input',()=>{ LOOK.chest=parseFloat(chestIn.value); LOOK.custom=true; rebuildHiker(); });
chestIn.addEventListener('change',()=>{ saveLook(); if(customizing) renderEditor(); });
$('#bSound').addEventListener('click',syncLookSettings);
syncLookSettings();
