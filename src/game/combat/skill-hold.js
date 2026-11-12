//@ Skill 2's held mode on the client: a skill 2 with an `alt` waits for the release (a tap casts it, a hold of its secs casts the held mode), the fill on the skill button, the slower walk while holding
/* Agent map (rules: shared/skill-hold.js, docs/SKILL-HOLD.md; server: server/skill-hold.js; test: tools/skill-hold-smoke.js)
   owns:    SHC (the hold in progress {t0, h} or null), shDown(repeat) / shUp / shCancel (the key, the right mouse button and the #abSkill button call them: combat-hud.js), shHudTick (the button's fill, combat-hud.js), shMoveK (movement.js).
   ONLY a skill 2 that has a held mode waits for the release; every other skill 2 still fires on key down (shDown calls doAttack at once, key repeats included, as before).
   The server times the hold itself: shDown sends {t:'hold', on:1, k:'skill'}, the release is the ordinary atk (the client only predicts which mode for its own swing and cooldown bar). */
let SHC=null;
function shAltNow(){ if(PVC.on) return null; const ab=abilityOf(clsOf(),'skill',pvSkills(),pvLevel()); return ab?shAltOf(ab.id):null; }   // pvp: the island's fixed loadout has none
const shHeld=()=>SHC?Math.max(0,(performance.now()-SHC.t0)/1000):0;
function shClearHud(){ abSkill.classList.remove('charging','charged'); }
function shDown(repeat){
  if(SHC) return;
  const h=shAltNow();
  if(!h){ doAttack('skill'); return; }
  if(repeat||!started||!NET.ready||uiOpen()||PL.dead||customizing||CB.cd.skill>0.08) return;
  SHC={t0:performance.now(),h}; netSend({t:'hold',on:1,k:'skill'});
}
function shUp(){
  if(!SHC) return; const h=SHC.h, armed=shArmed(shHeld(),h), same=h===shAltNow(); SHC=null; shClearHud();
  if(!doAttack('skill',0,armed&&same?h:null)) netSend({t:'hold',on:0,k:'skill'});
}
function shCancel(){ if(!SHC) return; SHC=null; shClearHud(); netSend({t:'hold',on:0,k:'skill'}); }
// the button glows while held and brightens once the held mode is armed; a weapon swap, a panel or death cancels it
function shHudTick(){
  if(!SHC) return;
  if(uiOpen()||PL.dead||SHC.h!==shAltNow()){ shCancel(); return; }
  const t=shHeld(), f=Math.min(1,t/SHC.h.secs);
  abSkill.classList.toggle('charging',t>=0.12); abSkill.classList.toggle('charged',f>=1);
  if(t>=0.12) abSkill.style.setProperty('--p',1-f);
}
const shMoveK=()=>SHC&&shHeld()>=0.12?0.6:1;
addEventListener('blur',shCancel);
