//@ PvP on the Proving Isle, client side: whether you stand on it (server events pvp / pvlock), the fixed loadout your action bar and attacks use there, picking another fighter as the target, the badge and the shut-gate countdown
/* agent map
   What: the server decides everything (server/pvp.js); this file only knows what to show. PVC.on: you stand on the island (event pvp [pid, 1|0]); PVC.lockUntil: when the gate opens again
   (event pvlock [pid, seconds], sent when you wake after a knock-out); PVC.tg: the fighter you have picked (a REMOTES entry; CB.target stays a monster and is empty on the island).
   Exports: PVC, pvSkills() / pvLevel() (the loadout and level abilityOf is asked with: the fixed ones on the island, your own elsewhere), pvPick(range), pvTarget(range), pvCycle(), pvUpdate(dt),
   pvHostile(r) (a remote on the island who is not in your party), pvWall(o,ox,oz) (the lake's depth and the shut gate, called by worldBounds in player/movement.js).
   Hooks into other files are marked `// pvp:` (attacks.js, combat-hud.js, movement.js, remote.js, map.js, time-of-day.js, buildings generation). Test: tools/client-smoke.js (the page loads), tools/pvp-smoke.js (the rules). */
var PVC={on:false,lockUntil:0,tg:null,sk:null,skT:0};   // (var: setActionBar asks pvSkills() when combat-hud.js loads, before this file has run; the two helpers below allow for that)
const PVC_T={rad:0.5,height:1.8,heavy:false};   // (a remote avatar given the fields startCharge and the target ring read of a monster)
EVH.pvp=e=>{ if(e[1]!==NET.pid) return; PVC.on=!!e[2]; PVC.tg=null; PVC.sk=null; CB.target=null; abKey=''; };
EVH.pvlock=e=>{ if(e[1]!==NET.pid) return; PVC.lockUntil=performance.now()+e[2]*1000; };
// the skills object and level abilityOf is asked with: on the island the fixed loadout (every slot open, skills at level 1), cached for a second
function pvSkills(){
  if(!PVC||!PVC.on||!GEAR||!GEAR.skills) return GEAR&&GEAR.skills;
  const now=performance.now(); if(!PVC.sk||now-PVC.skT>1000){ PVC.sk=pvpSkillsOf(GEAR.skills,PL.level); PVC.skT=now; }
  return PVC.sk;
}
function pvLevel(){ return PVC&&PVC.on?999:PL.level; }   // (function declarations, not consts: setActionBar calls these while combat-hud.js loads)
function pvHostile(r){ return !r.dead&&r.tx!==null&&r.g.visible&&inPvp(r.x,r.z)&&!dgPartyCol(r.id); }
// the nearest hostile fighter in front of you within range (the same rule as pickTarget's)
function pvPick(range){
  const fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw); let best=null, bs=1e9;
  for(const r of REMOTES.values()){
    if(!pvHostile(r)) continue;
    const dx=r.x-P.x, dz=r.z-P.z, d=Math.hypot(dx,dz); if(d>range) continue;
    const ang=Math.acos(clamp((dx*fx+dz*fz)/(d||1),-1,1)); if(ang>1.25&&d>3.5) continue;
    const s=d+ang*7; if(s<bs){ bs=s; best=r; }
  }
  return best;
}
// the fighter an attack aims at: the one you picked while they are in reach, else the best one in front
function pvTarget(range){
  let t=PVC.tg;
  if(!t||!pvHostile(t)||Math.hypot(t.x-P.x,t.z-P.z)>range+3){ t=pvPick(Math.max(range+2,8)); PVC.tg=t; }
  if(t) t.T=PVC_T, t.s=1;
  return t;
}
function pvCycle(){
  const list=[...REMOTES.values()].filter(r=>pvHostile(r)&&Math.hypot(r.x-P.x,r.z-P.z)<45).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));
  PVC.tg=list.length?list[(list.indexOf(PVC.tg)+1)%list.length]:null;
}
const pvBadge=$('#pvBadge');
function pvUpdate(dt){
  const lock=PVC.lockUntil-performance.now();
  const txt=lock>0?'Proving Isle gate shut: '+Math.ceil(lock/1000)+' s':PVC.on?'Proving Isle · PvP · same stats for all':'';
  if(pvBadge){ pvBadge.hidden=!txt||!started; if(pvBadge.textContent!==txt) pvBadge.textContent=txt; pvBadge.classList.toggle('shut',lock>0); }
  if(!PVC.on){ PVC.tg=null; return; }
  const t=PVC.tg;
  if(t&&!pvHostile(t)) PVC.tg=null;
  else if(t){
    targetRing.visible=true; targetRing.position.set(t.x,t.y+0.06,t.z); targetRing.scale.setScalar(1.3); targetRing.rotation.y+=dt;
    if(CB.act&&CB.act.kind!=='spin') P.face=angLerp(P.face,Math.atan2(-(t.x-P.x),-(t.z-P.z)),1-Math.exp(-14*dt));
  }
}
// worldBounds: the lake is a wall (wade to the knees, no deeper, like the sea and the river) so the bridge is the way in; and while the gate is shut a step onto the island is undone
function pvWall(o,ox,oz){
  if(oz===undefined||!PVP.gate) return;
  if(Math.hypot(o.x-PVP.x,o.z-PVP.z)<PVP_ISLE.lakeR+3&&bridgeDeck(o.x,o.z)<WATER){ const h=getH(o.x,o.z); if(h<WATER-0.8&&h<getH(ox,oz)){ o.x=ox; o.z=oz; return; } }
  if(performance.now()<PVC.lockUntil&&inPvp(o.x,o.z)&&!inPvp(ox,oz)){ o.x=ox; o.z=oz; }
}
