//@ Target frame, player bars, damage numbers, action bar, attack input
/* combat interface: target frame, health bars, damage numbers, action buttons */
const tframe=$('#tframe'), tName=$('#tName'), tLv=$('#tLv'), tEl=$('#tEl'), tBar=$('#tBar'), tHp=$('#tHp');
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
  const soul=soulNow(); $('#plLv').textContent='Lv '+PL.level+(soul!=='basic'?' · '+ELEMS[soul].name:''); $('#plHpT').textContent=Math.ceil(PL.hp)+' / '+PL.maxHp;
  $('#plHp').style.width=(PL.hp/PL.maxHp*100)+'%'; const need=expToNext(PL.level);
  $('#plXp').style.width=Math.min(100,PL.exp/need*100)+'%'; $('#plXpT').textContent='XP '+Math.floor(PL.exp)+' / '+Math.ceil(need);
  const bossUI=updateBossUI();
  if(T && started && !customizing && !(bossUI&&T===BOSS.m)){ tframe.hidden=false; tName.textContent=T.T.name; const ld=T.T.level-PL.level; tLv.textContent='Lv '+T.T.level+(ld>0?'  (-'+ld*5+'% dmg)':''); tLv.classList.toggle('bad',ld>0);
    const te=elOf(T.T); tEl.textContent=te==='basic'?'':ELEMS[te].name; tEl.style.color=ELEMS[te].col; if(te==='basic') tEl.title=''; else { const tr=foeTraits(te), nm=l=>l.map(e=>ELEMS[e].name).join(' and '); tEl.title=ELEMS[te].name+': weak to '+nm(tr.weak)+', resists '+nm(tr.resist); }
    tBar.style.width=(T.hp/T.maxHp*100)+'%'; tHp.textContent=Math.ceil(T.hp)+' / '+T.maxHp; }
  else tframe.hidden=true;
  const L=GEAR&&GEAR.skills, c=clsOf(), ba=abilityOf(c,'basic',L,PL.level), sk=abilityOf(c,'skill',L,PL.level), bu=abilityOf(c,'burst',L,PL.level);
  abBasic.style.setProperty('--p',ba?CB.cd.basic/(abilityCd(ba,L,PL.level)*(CB.buff?CB.buff.cd:1)):0); abSkill.style.setProperty('--p',sk?CB.cd.skill/abilityCd(sk,L,PL.level):0); abBurst.style.setProperty('--p',bu?CB.cd.burst/abilityCd(bu,L,PL.level):0);
  abSkill.classList.toggle('ready',!!sk&&CB.cd.skill<=0); abBurst.classList.toggle('ready',!!bu&&CB.cd.burst<=0);
  abBasic.classList.toggle('buffed',!!CB.buff);
  const key=c+'|'+(ba?ba.id:'')+'|'+(sk?sk.id:'')+'|'+(bu?bu.id:'')+'|'+Math.min(PL.level,BURST_SLOT_LV); if(key!==abKey){ abKey=key; setActionBar(); }
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
  burst:'<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>',
  'Ice Shard':'<path d="M4 20L15 9l5-5-2 6-9 9z"/><path d="M13 7l4 4"/>',
  'Arcane Missiles':'<circle cx="17" cy="7" r="2.5"/><circle cx="7" cy="9" r="2"/><circle cx="12" cy="17" r="2"/><path d="M3 21l3-3M9 21l2-2M3 15l2-2"/>',
  'Earthshatter':'<path d="M2 20h20"/><path d="M12 20l-2-5 3-3-2-4M7 20l1-3M17 20l-1-4 2-2"/><path d="M9 4l3 2 3-2"/>',
  'Blade Storm':'<circle cx="12" cy="12" r="2"/><path d="M12 10V3l3 3M14 12h7l-3 3M12 14v7l-3-3M10 12H3l3-3"/>',
  'Berserk':'<path d="M4 20l5-9 3 4 3-7 5 12"/><path d="M8 4l2 3M16 3l-1 4M12 2v3"/>',
  'Hail of Arrows':'<path d="M4 3v8M9 3v12M14 3v8M19 3v12M2 9l2 3 2-3M7 13l2 3 2-3M12 9l2 3 2-3M17 13l2 3 2-3"/><path d="M2 21h20"/>',
  'Sniper Shot':'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
  "Hunter's Focus":'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'Blizzard':'<path d="M12 2v20M4 6l16 12M4 18L20 6"/><circle cx="12" cy="12" r="3"/>',
  'Inferno':'<path d="M12 22c-5 0-8-3-8-7 0-4 4-6 4-10 3 2 4 5 4 7 1-2 1-4 0-6 4 2 8 6 8 9 0 4-3 7-8 7z"/>',
  'Arcane Surge':'<path d="M12 2l3 7h7l-6 5 2 8-6-5-6 5 2-8-6-5h7z"/>',
  // boss skills
  'Bramble Snare':'<path d="M4 12c4-6 12-6 16 0M4 12c4 6 12 6 16 0"/><path d="M8 8l-1-3M12 6V3M16 8l1-3M8 16l-1 3M12 18v3M16 16l1 3"/>',
  'Lifesap Frenzy':'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><path d="M12 11v6M9 14h6"/>',
  'Spore Arrow':'<path d="M4 20L16 8M16 8h-4M16 8v4"/><circle cx="18" cy="6" r="2"/><circle cx="21" cy="10" r="1.3"/><circle cx="14" cy="4.5" r="1.3"/>',
  'Black Bloom':'<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C12 5 10 3 8 3c0 3 1 5 4 6.5zM14.5 12C19 12 21 10 21 8c-3 0-5 1-6.5 4zM12 14.5c0 4.5 2 6.5 4 6.5 0-3-1-5-4-6.5zM9.5 12C5 12 3 14 3 16c3 0 5-1 6.5-4z"/>',
  'Thorn Shards':'<path d="M4 20L9 6l3 9zM12 20l3-14 3 11z"/><path d="M20 20l1-6"/>',
  'Heartwood Drain':'<path d="M2 12h8"/><path d="M15 20s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7z"/>',
  'Oni Cleave':'<path d="M4 20L18 4M8 20L20 8"/><path d="M15 3c1 2 3 3 3 5"/>',
  'Kanabo Slam':'<path d="M5 19l9-9"/><path d="M13 5l6 6-3 3-6-6z"/><path d="M3 21h6"/>',
  'Ember Shot':'<path d="M3 21L15 9M15 9h-4M15 9v4"/><path d="M19 3c1 2 3 2 3 5a3 3 0 0 1-6 0c0-1 1-1.5 1-3z"/>',
  'Inferno Volley':'<path d="M3 20L12 11M8 21L17 12M3 14L9 8"/><path d="M17 3c1 2 4 3 4 6a3 3 0 0 1-6 0c0-2 2-3 2-6z"/>',
  'Oni Gale':'<path d="M3 9h12a3 3 0 1 0-3-3M3 14h17a3 3 0 1 1-3 3M3 19h8"/>',
  'Demon Gate':'<path d="M3 6h18M5 6v14M19 6v14M7 11h10M9 6V4M15 6V4"/>',
  'Foxfire Riposte':'<path d="M5 19L17 5M9 20L21 8M4 14L12 5"/><path d="M19 2v3M17.5 3.5h3"/>',
  'Dawn Guard':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><circle cx="12" cy="11" r="2.5"/><path d="M12 5.5v1.5M12 15v1.5M6.5 11H8M16 11h1.5"/>',
  'Radiant Lance':'<path d="M3 21L21 3"/><path d="M15 3h6v6"/><path d="M8 13l3 3M5 16l3 3"/>',
  'Fox Spirit Barrage':'<circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="17" r="2.2"/><circle cx="11" cy="12" r="2.2"/><path d="M3 12h6M3 5l13 1M3 19l13-1"/>',
  'Spirit Chain':'<circle cx="6" cy="6" r="2.5"/><circle cx="12" cy="13" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M7.5 8l3 3M13.5 11l3-3M12 15.5V20"/>',
  Tempest:'<path d="M12 12a2 2 0 1 1 2 2 5 5 0 1 1-5-5 8 8 0 1 1 8 8"/>',
  // passives
  Vitality:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  Ferocity:'<path d="M5 4l5 16M11 3l4 17M17 5l3 14"/>',
  Precision:'<path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>',
  'Iron Will':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M12 8v8"/>',
  Quickhands:'<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>',
  Scavenger:'<path d="M12 3l7 6-7 12L5 9z"/><path d="M5 9h14M9 9l3 12M15 9l-3 12"/>',
  Scholar:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M9 8h6M9 12h6"/>',
  Resonance:'<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/>'
};
const abBasic=$('#abBasic'), abSkill=$('#abSkill'), abBurst=$('#abBurst'); let abKey='';
function burstSlot(){ doAttack('burst'); }
function flashSkillSlot(slot){ abKey=''; const el=slot==='burst'?abBurst:abSkill; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
function setActionBar(){
  const c=clsOf(), L=GEAR&&GEAR.skills;
  // each button: the equipped ability, a lock until the slot's level, or a + when nothing is equipped
  const fill=(el,slot,key)=>{ const a=abilityOf(c,slot,L,PL.level), locked=PL.level<slotLv(slot);
    el.querySelector('svg').innerHTML=ICONS[a?a.name:locked?'lock':'plus']||ICONS.burst;
    el.querySelector('.nm').textContent=a?a.name:locked?'Lv '+slotLv(slot):(slot==='burst'?'Burst':'Skill');
    el.classList.toggle('empty',!a); const ae=a?elOf(a):'basic'; el.classList.toggle('has-el',ae!=='basic'); el.style.setProperty('--el',ELEMS[ae].col);
    el.setAttribute('aria-label',a?a.name+' ('+key+')':locked?(slot==='burst'?'Burst':'Skill')+' slot, opens at level '+slotLv(slot):'Empty '+slot+' slot: choose one'); };
  fill(abBasic,'basic',kbName('basic')); fill(abSkill,'skill',kbName('skill')); fill(abBurst,'burst',kbName('burst'));
}
const press=(el,fn)=>{ el.addEventListener('touchstart',e=>{ e.preventDefault(); fn(); },{passive:false}); el.addEventListener('click',fn); };
press(abBasic,()=>doAttack('basic')); press(abSkill,()=>doAttack('skill')); press(abBurst,burstSlot);
addEventListener('keydown',e=>{
  if(!started||uiOpen()) return;
  if(kbIs(e.code,'basic')) doAttack('basic');
  if(kbIs(e.code,'skill')) doAttack('skill');
  if(kbIs(e.code,'burst')) burstSlot();
  if(kbIs(e.code,'skills') && !e.repeat) toggleSkills();
  if(kbIs(e.code,'target')){ e.preventDefault(); cycleTarget(); }
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
let mDown=null;
canvas.addEventListener('mousedown',e=>{
  if(!started||customizing||altHeld) return;   // Alt held: the mouse is free for the menus, a click on the world does nothing
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
