//@ Target frame, player bars, damage numbers, action bar, attack input
/* combat interface: target frame, health bars, damage numbers, action buttons */
const tframe=$('#tframe'), tName=$('#tName'), tLv=$('#tLv'), tBar=$('#tBar'), tHp=$('#tHp');
const dmgPool=[], barPool=[];
for(let i=0;i<20;i++){ const d=document.createElement('div'); d.className='dmg'; d.hidden=true; document.body.append(d); dmgPool.push({el:d,life:0}); }
for(let i=0;i<10;i++){ const d=document.createElement('div'); d.className='hpb'; d.hidden=true; d.innerHTML='<i></i>'; document.body.append(d); barPool.push(d); }
function popText(x,y,z,txt,cls){
  const d=dmgPool.find(p=>p.life<=0)||dmgPool[0];
  d.life=cls==='xp'?1.4:0.9; d.x=x+AR(-0.3,0.3); d.y=y; d.z=z; d.el.textContent=txt; d.el.className='dmg'+(cls?' '+cls:''); d.el.hidden=false;
}
const _sv=new THREE.Vector3();
function toScreen(x,y,z){ _sv.set(x,y,z).project(camera); if(_sv.z>1) return null; return [(_sv.x*0.5+0.5)*innerWidth,(-_sv.y*0.5+0.5)*innerHeight]; }
function updateCombatUI(dt){
  for(const d of dmgPool){
    if(d.life<=0){ d.el.hidden=true; continue; }
    d.life-=dt; d.y+=dt*1.2;
    const s=toScreen(d.x,d.y,d.z); if(!s){ d.el.hidden=true; continue; }
    d.el.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-50%) scale(${1+Math.max(0,d.life-0.7)*2})`; d.el.style.opacity=Math.min(1,d.life*2.5);
  }
  let bi=0;
  if(started && !customizing){
    const list=MONS.filter(m=>!m.dead&&m.g.visible&&(m.hp<m.maxHp||m.aggro||m===CB.target)&&Math.hypot(m.x-P.x,m.z-P.z)<35);
    for(const m of list){
      if(bi>=barPool.length) break;
      const s=toScreen(m.x,m.y+(m.T.height+0.35)*m.s,m.z); if(!s) continue;
      const b=barPool[bi++]; b.hidden=false; b.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-50%)`;
      b.firstChild.style.width=(m.hp/m.maxHp*100)+'%'; b.classList.toggle('tgt',m===CB.target);
    }
  }
  for(;bi<barPool.length;bi++) barPool[bi].hidden=true;
  const T=CB.target;
  $('#plLv').textContent='Lv '+PL.level; $('#plHpT').textContent=Math.ceil(PL.hp)+' / '+PL.maxHp;
  $('#plHp').style.width=(PL.hp/PL.maxHp*100)+'%'; const need=expToNext(PL.level);
  $('#plXp').style.width=Math.min(100,PL.exp/need*100)+'%'; $('#plXpT').textContent='XP '+Math.floor(PL.exp)+' / '+Math.ceil(need);
  const bossUI=updateBossUI();
  if(T && started && !customizing && !(bossUI&&T===BOSS.m)){ tframe.hidden=false; tName.textContent=T.T.name; const ld=T.T.level-PL.level; tLv.textContent='Lv '+T.T.level+(ld>0?'  (-'+ld*5+'% dmg)':''); tLv.classList.toggle('bad',ld>0); tBar.style.width=(T.hp/T.maxHp*100)+'%'; tHp.textContent=Math.ceil(T.hp)+' / '+T.maxHp; }
  else tframe.hidden=true;
  const c=CLASSES[clsOf()], sk=abilityOf(clsOf(),'skill',GEAR&&GEAR.skills,PL.level);
  abBasic.style.setProperty('--p',CB.cd.basic/c.basic.cd); abSkill.style.setProperty('--p',sk?CB.cd.skill/sk.cd:0);
  abSkill.classList.toggle('ready',!!sk&&CB.cd.skill<=0);
  const key=clsOf()+'|'+(sk?sk.id:'')+'|'+Math.min(PL.level,BURST_SLOT_LV); if(key!==abKey){ abKey=key; setActionBar(); }
}
const ICONS={
  Slash:'<path d="M5 19L17 7l2-4-4 2L3 17z"/><path d="M8 16l-3 3M15 5l4 4"/>',
  Whirlwind:'<path d="M12 12a3 3 0 1 1 3-3M12 12a6 6 0 1 0 6 6M12 12a9 9 0 0 1-9-9"/>',
  Shoot:'<path d="M5 19L19 5M19 5h-5M19 5v5"/><path d="M5 19l2-4M5 19l4-2"/>',
  Volley:'<path d="M4 20L18 6M9 20L20 9M4 15L15 4"/><path d="M18 6v-3M20 9h3M15 4h-3"/>',
  Firebolt:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"/>',
  'Frost Nova':'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9 4l3 2 3-2M9 20l3-2 3 2"/>',
  'Shield Bash':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 10l3 3 3-3"/>',
  'Charge':'<path d="M3 12h11M10 7l5 5-5 5"/><path d="M17 5v14M21 8v8"/>',
  'Piercing Shot':'<path d="M2 12h18M16 8l4 4-4 4"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="12" r="2"/>',
  'Arrow Rain':'<path d="M6 3v10M12 3v14M18 3v10M4 11l2 3 2-3M10 15l2 3 2-3M16 11l2 3 2-3"/><path d="M3 21h18"/>',
  'Chain Lightning':'<path d="M13 2L5 13h6l-2 9 9-12h-6z"/>',
  'Meteor':'<circle cx="15" cy="15" r="5"/><path d="M11 11L3 3M13 9L8 3M9 13L3 8"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  burst:'<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>'
};
const abBasic=$('#abBasic'), abSkill=$('#abSkill'), abBurst=$('#abBurst'); let abKey='';
function burstSlot(){ toast(PL.level<BURST_SLOT_LV?'Your burst slot opens at level '+BURST_SLOT_LV:'Burst skills are coming soon!',''); UI_SFX.click(); }
function flashSkillSlot(){ abKey=''; abSkill.classList.remove('flash'); void abSkill.offsetWidth; abSkill.classList.add('flash'); }
function setActionBar(){
  const c=CLASSES[clsOf()];
  abBasic.querySelector('svg').innerHTML=ICONS[c.basic.name]; abBasic.querySelector('.nm').textContent=c.basic.name;
  // slot 2: your equipped skill, or a lock until level 3, or a + when nothing is equipped
  const sk=abilityOf(clsOf(),'skill',GEAR&&GEAR.skills,PL.level), locked=PL.level<SKILL_SLOT_LV;
  abSkill.querySelector('svg').innerHTML=ICONS[sk?sk.name:locked?'lock':'plus']; abSkill.querySelector('.nm').textContent=sk?sk.name:locked?'Lv '+SKILL_SLOT_LV:'Skill';
  abSkill.classList.toggle('empty',!sk);
  abBasic.setAttribute('aria-label',c.basic.name); abSkill.setAttribute('aria-label',sk?sk.name:locked?'Skill slot, opens at level '+SKILL_SLOT_LV:'Empty skill slot: choose a skill');
  // slot 3: burst skills (coming later)
  const bl=PL.level<BURST_SLOT_LV; abBurst.querySelector('svg').innerHTML=ICONS[bl?'lock':'burst']; abBurst.querySelector('.nm').textContent=bl?'Lv '+BURST_SLOT_LV:'Soon';
  abBurst.setAttribute('aria-label',bl?'Burst slot, opens at level '+BURST_SLOT_LV:'Burst skills are coming soon');
  document.querySelectorAll('[data-cls]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cls===clsOf()));
}
const press=(el,fn)=>{ el.addEventListener('touchstart',e=>{ e.preventDefault(); fn(); },{passive:false}); el.addEventListener('click',fn); };
press(abBasic,()=>doAttack('basic')); press(abSkill,()=>doAttack('skill')); press(abBurst,burstSlot);
document.querySelectorAll('[data-cls]').forEach(b=>b.addEventListener('click',()=>{ equipClass(b.dataset.cls); }));
addEventListener('keydown',e=>{
  if(!started||uiOpen()) return;
  if(e.code==='KeyF'||e.code==='Digit1') doAttack('basic');
  if(e.code==='KeyQ'||e.code==='Digit2') doAttack('skill');
  if(e.code==='KeyR'||e.code==='Digit3') burstSlot();
  if(e.code==='KeyK' && !e.repeat) toggleSkills();
  if(e.code==='Tab'){ e.preventDefault(); cycleTarget(); }
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
let mDown=null;
canvas.addEventListener('mousedown',e=>{
  if(!started||customizing) return;
  const locked=document.pointerLockElement===canvas;
  mDown={x:e.clientX,y:e.clientY,t:performance.now(),locked};
  if(!locked){ if(canvas.dataset.lockTried) canvas.dataset.lockFailed='1'; canvas.dataset.lockTried='1'; }
  if(locked && !uiOpen()) doAttack(e.button===2?'skill':'basic');
});
addEventListener('mouseup',e=>{
  if(!mDown) return; const d=mDown; mDown=null;
  if(d.locked||document.pointerLockElement===canvas) return;
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<5 && performance.now()-d.t<280 && canvas.dataset.lockFailed) doAttack(e.button===2?'skill':'basic');
});
document.addEventListener('pointerlockerror',()=>{ canvas.dataset.lockFailed='1'; });
setActionBar();
attachWeapons();
weaponsReady=true;
