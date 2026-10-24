//@ Skill 1 on the server: attack speed and charge gain of a player, the hold message and its release (how long the player really held), where a mage's held blast lands
/* Agent map (rules and numbers: shared/basic-hold.js, docs/BASIC-HOLD.md; test: tools/basic-hold-smoke.js)
   owns:    bhSpeedP / bhChargeP (the player's multipliers: the passive stats aspd / chg plus the rolled gear's; charge gain scales the Deep Cave charge a cast earns, caveHitS), MSG.hold {on} (the client started or stopped holding skill 1: the server notes the time),
            bhReleaseP (the held strength 0..1 of a skill-1 attack that is just being made, 0 = a press), bhAimAtS (the centre of a mage's held blast, resolveHitS calls it).
   hooks:   handleAttack (combat.js) and resolveHitS (combat.js), marked `// basic-hold:`; docs/BASIC-HOLD.md lists them.
   The server times the hold itself (the time between the two messages), never a number the client sent, so a client cannot claim a full charge it did not wait for. */
const bhSpeedP=p=>p.pv?1:bhSpeedK(psP(p,'aspd'),rlP(p,'aspd'));   // pvp: nothing rolled or worn counts on the island
const bhChargeP=p=>p.pv?1:bhChargeK(psP(p,'chg'),rlP(p,'chg'));
MSG.hold=(p,msg)=>{ p.holdT0=msg.on===1||msg.on===true?S.t+Math.max(0,p.cd.basic||0):null; };   // (the charge starts when skill 1 is ready again: a hold cannot be filled during the last swing's recovery)
function bhReleaseP(p,cls){ const t0=p.holdT0; p.holdT0=null; return t0==null?0:bhFrac(S.t-t0,cls,bhSpeedP(p)); }
// a held mage blast lands on the target when there is one in reach, otherwise ahead of the mage
function bhAimAtS(p,a,tgt){
  if(!a.holdAt) return;
  if(tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<=a.range+2) a.at={x:tgt.x,z:tgt.z};
  else a.at={x:p.x-Math.sin(p.face)*6,z:p.z-Math.cos(p.face)*6};
}
