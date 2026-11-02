//@ Movement slot, client side: the six movement skills at work (double jump, glide, swift dash, sprint, leap, backflip), the action-bar tile #abMov, the skills panel's slot below the passives and its tab
/* Agent map. Data and rules: shared/movement.js (MV_SKILLS); the server only stores the choice: server/movement.js (movequip). Doc: docs/MOVEMENT.md. Test: tools/movement-smoke.js.
   MV_UI = {cd (seconds until the movement button works again), cdMax, sprint (seconds of Sprint left), jumped (the double jump is used until you land), sel (the skill picked in the panel)}.
   Buttons: Jump-key skills (double jump, glide) and the Dash-key skill (swift dash) work through the hooks in player/movement.js (mvAirJump, mvFall, mvDashT/mvDashV/mvDashCd);
   the movement button (key `mov`, B; tile #abMov; a controller's left stick click) calls mvPress. Hooks marked `// movement:`.
   Exports: mvWorn, mvTick, mvSpeedK, mvAirJump, mvFall, mvDashT, mvDashV, mvDashCd, mvPress, mvFillTile, mvHudUpdate, mvBarKey, mvSlotHtml, mvGridHtml, mvInfoHtml, mvBindPanel. */
var MV_UI={cd:0,cdMax:1,sprint:0,jumped:false,sel:null,touchJump:false};
const MV_ICON={
  doublejump:'<path d="M12 20V9M8 13l4-4 4 4"/><path d="M8 7l4-4 4 4"/>',
  glide:'<path d="M2 9c6 2 14 2 20 0-2 4-6 7-10 7S4 13 2 9z"/><path d="M12 16v4"/>',
  swiftdash:'<path d="M3 12h13M12 7l5 5-5 5"/><path d="M3 7h6M3 17h6"/>',
  sprint:'<path d="M13 3l-7 11h5l-2 7 8-11h-5z"/>',
  leap:'<path d="M4 19c3-9 8-12 16-12M16 3l4 4-4 4"/>',
  backflip:'<path d="M18 14a6 6 0 1 0-6 6"/><path d="M18 8v6h-6"/>',
};
const MV_BTN_NAME={jump:'Jump',run:'Dash',mov:'Movement button'};
const mvIco=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${MV_ICON[id]||''}</svg>`;
// the worn movement skill you can use now (slot open, not on the Proving Isle where everyone moves alike), else null
function mvWorn(){
  if(!GEAR||!GEAR.skills||PL.level<MV_SLOT_LV||(typeof PVC!=='undefined'&&PVC.on)) return null;
  return mvDef(GEAR.skills.mov);
}
const mvIs=(id)=>{ const d=mvWorn(); return !!d&&d.id===id; };
function mvTick(dt){   // once a frame from updatePlayer
  if(MV_UI.cd>0) MV_UI.cd=Math.max(0,MV_UI.cd-dt);
  if(MV_UI.sprint>0) MV_UI.sprint=Math.max(0,MV_UI.sprint-dt);
  if(P.ground) MV_UI.jumped=false;
}
const mvSpeedK=()=>MV_UI.sprint>0&&mvIs('sprint')?MV_SKILLS.sprint.speedK:1;
// a second press of Jump in the air (true when it was spent on the double jump)
function mvAirJump(inWater){
  if(!jumpReq||P.ground||inWater||MV_UI.jumped||PL.dead||PFX.root>0||!mvIs('doublejump')) return false;
  P.vy=MV_SKILLS.doublejump.jump; MV_UI.jumped=true; jumpReq=false; return true;
}
// glide: while Jump is held and you are falling, the fall speed is capped
function mvFall(vy,inWater){
  if(vy>=0||inWater||P.ground||!mvIs('glide')) return vy;
  if(!(kbHeld('jump')||MV_UI.touchJump)) return vy;
  return Math.max(vy,-MV_SKILLS.glide.fall);
}
const mvDashT=t=>mvIs('swiftdash')?MV_SKILLS.swiftdash.dashT:t;
const mvDashV=v=>mvIs('swiftdash')?MV_SKILLS.swiftdash.dashV:v;
const mvDashCd=c=>mvIs('swiftdash')?MV_SKILLS.swiftdash.dashCd:c;
// the movement button (key, controller, tile)
function mvPress(){
  if(!started||!NET.ready||uiOpen()||PL.dead) return;
  const d=mvWorn();
  if(!d){ if(PL.level<MV_SLOT_LV) toast('The movement slot opens at level '+MV_SLOT_LV,'bad'); else toast('Pick a movement skill in the skills panel (K)','bad'); UI_SFX.error(); return; }
  if(d.btn!=='mov'){ toast(d.name+' works with the '+MV_BTN_NAME[d.btn]+' key','bad'); UI_SFX.error(); return; }
  if(MV_UI.cd>0||PFX.root>0) return;
  const sy=Math.sin(P.yaw), cy=Math.cos(P.yaw), sp=Math.hypot(P.vx,P.vz);
  const dx=sp>0.5?P.vx/sp:-sy, dz=sp>0.5?P.vz/sp:-cy;
  if(d.id==='sprint') MV_UI.sprint=d.dur;
  else if(d.id==='leap'){ if(!P.ground){ UI_SFX.error(); return; } P.vy=d.up; P.ground=false; P.vx=dx*d.fwd; P.vz=dz*d.fwd; }
  else if(d.id==='backflip'){ if(!P.ground){ UI_SFX.error(); return; } P.vy=d.up; P.ground=false; P.vx=sy*d.back; P.vz=cy*d.back; }
  MV_UI.cd=MV_UI.cdMax=d.cd; UI_SFX.click();
}
addEventListener('keydown',e=>{ if(e.repeat||!started||typeof kbIs!=='function') return; if(kbIs(e.code,'mov')) mvPress(); });
{ const bj=$('#bJump'); if(bj){ bj.addEventListener('touchstart',()=>{ MV_UI.touchJump=true; },{passive:true}); for(const ev of ['touchend','touchcancel']) bj.addEventListener(ev,()=>{ MV_UI.touchJump=false; },{passive:true}); } }
/* ---- the action-bar tile: shown when the worn skill uses the movement button ---- */
function mvFillTile(){
  const el=$('#abMov'); if(!el||!GEAR) return;
  const d=mvWorn(), on=!!d&&d.btn==='mov';
  el.style.display=on?'':'none'; if(!on) return;
  el.querySelector('svg').innerHTML=MV_ICON[d.id]||'';
  el.querySelector('.nm').textContent=d.name; el.querySelector('.key').textContent=kbName('mov');
  el.setAttribute('aria-label',d.name+' (movement skill, '+d.cd+' s cooldown, '+kbName('mov')+')');
}
function mvHudUpdate(){
  const el=$('#abMov'); if(!el) return;
  const d=mvWorn(); if(!d||d.btn!=='mov') return;
  el.style.setProperty('--p',MV_UI.cd>0?MV_UI.cd/MV_UI.cdMax:0);
  el.classList.toggle('ready',MV_UI.cd<=0); el.classList.toggle('buffed',MV_UI.sprint>0);
}
const mvBarKey=()=>'|'+(GEAR&&GEAR.skills?GEAR.skills.mov:'')+'|'+Math.min(PL.level,MV_SLOT_LV)+'|'+kbName('mov');
/* ---- the skills panel ---- */
function mvTile(d,from,extra){ return `<button class="sk-tile${extra||''}" data-mv="${d.id}" data-from="${from}" aria-label="${d.name}">${mvIco(d.id)}<span class="lv">${MV_BTN_NAME[d.btn]}</span></button>`; }
function mvSlotHtml(C){
  const locked=C.lv<MV_SLOT_LV, d=!locked&&mvDef(C.S.mov);
  const tile=d?mvTile(d,'slot:mov'):`<div class="sk-tile empty">${skIcon(locked?'lock':'plus')}</div>`;
  return `<div class="sk-pslot${d?' on':''}${locked?' locked':''}" data-mvslot="1"><span class="sk-n">Movement</span>${tile}<b>${d?d.name:locked?'Level '+MV_SLOT_LV:'Empty'}</b><small>${d?MV_BTN_NAME[d.btn]+(d.cd?' · '+d.cd+' s':''):locked?'':'Pick one in the Movement tab'}</small></div>`;
}
function mvGridHtml(){
  const worn=GEAR&&GEAR.skills?GEAR.skills.mov:null;
  return MV_IDS.map(id=>{ const d=MV_SKILLS[id]; return `<div class="sk-cell">${mvTile(d,'grid',(MV_UI.sel===id?' sel':'')+(worn===id?' worn':''))}<span class="nm">${d.name}</span></div>`; }).join('');
}
function mvInfoHtml(){
  const d=mvDef(MV_UI.sel);
  if(!d) return `<p class="muted">${isTouch?'Tap':'Click'} a movement skill for details. They are free, belong to no skill set and change only how you move. Some use the Jump or Dash key, others the movement button (${kbName('mov')}).</p>`;
  const worn=GEAR.skills.mov===d.id, low=PL.level<MV_SLOT_LV;
  const act=worn?`<button class="chip" data-mvoff="1">Take off</button>`:`<button class="chip" data-mvon="${d.id}" ${low?'disabled':''}>${low?'Level '+MV_SLOT_LV:'Equip'}</button>`;
  return `<div class="sk-ii"><div class="sk-ii-h"><div class="sk-ico">${mvIco(d.id)}</div><div class="sk-ii-main"><b>${d.name}</b><div class="sk-tags"><span class="sk-tag">Movement · ${MV_BTN_NAME[d.btn]}${d.btn==='mov'?' ('+kbName('mov')+')':d.btn==='run'?' ('+kbName('run')+')':''}</span></div></div></div><p>${d.desc}</p>${d.cd?`<p class="muted">${d.cd} s cooldown</p>`:''}<div class="sk-acts">${act}</div></div>`;
}
function mvBindPanel(on){   // on(selector, fn) of renderSkills
  on('[data-mvslot]',()=>{ skKind='mov'; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-mv]',b=>{ MV_UI.sel=b.dataset.mv; UI_SFX.click(); skKind='mov'; renderSkills(); });
  on('[data-mvon]',b=>{ netSend({t:'movequip',id:b.dataset.mvon}); UI_SFX.click(); });
  on('[data-mvoff]',()=>{ netSend({t:'movequip',id:null}); UI_SFX.click(); });
}
