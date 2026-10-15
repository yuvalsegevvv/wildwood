//@ The Proving Isle (PvP): the fighting ground, the fixed level, gear and loadout everyone fights with there, the gate on the bridge, where a knocked-out fighter wakes (a shore spot), the entry lock. Pure.
/* agent map
   What: a round island in a lake south of Slime Meadow (the terrain is PVP_ISLE in terrain.js, the bridge is the causeway of 'The Proving Road' in roads.js). Everyone who stands on it fights
   with the same numbers, whatever they wear or have learned, and nothing is won or lost there. Design and the numbers: docs/PVP.md.
   Exports: PVP (x, z, r: the fighting ground, level: the one level everyone fights at, lockS: seconds the gate stays shut after a knock-out, hpK: health x, gate / gateOut / bridge: the way in,
            shore: the spots a knocked-out fighter wakes at), inPvp(x,z), pvpGearOf(cls), pvpStatsOf(cls), pvpSkillsOf(skills,level), pvpShoreSpot().
   Users: server/pvp.js (and the hooks marked `// pvp:` in players / combat / monsters / economy / crafting), game/pvp/*.js, game/player/movement.js (the lake and the gate).
   Test: tools/pvp-smoke.js. */
const PVP={x:PVP_ISLE.x,z:PVP_ISLE.z,r:35,   // r: the island down to where the water gets too deep to wade (the client's knee-deep rule stops you there)
  level:PASSIVE_LV,   // the one level everyone fights at: the level the first passive opens, so a level-10 hiker (all three attack slots) with the default passive is on a par with a level 60
  lockS:10,           // the gate stays shut this long after you wake from a knock-out
  hpK:2,              // health x: fights last twice as long as the plain numbers would make them
  elemBoost:1.15,     // element advantage / disadvantage between fighters (the soul's match and opposite, the wheel against the other's soul): x1.15 and /1.15 instead of ELEM_BOOST's 1.5 against monsters
  bridge:null,gate:null,gateOut:null,shore:[]};
const inPvp=(x,z)=>Math.hypot(x-PVP.x,z-PVP.z)<PVP.r;
// the way in: the causeway's centre line runs mainland -> island; the gate is where it crosses into the ground, gateOut a few metres back on the planks (a locked-out hiker is held there)
{ const B=BRIDGES.find(b=>b.road==='The Proving Road');
  if(B){
    PVP.bridge=B; let u=-B.len/2;
    for(;u<B.len/2;u+=0.25) if(Math.hypot(B.x+B.dx*u-PVP.x,B.z+B.dz*u-PVP.z)<=PVP.r) break;
    PVP.gate={x:B.x+B.dx*u,z:B.z+B.dz*u,face:Math.atan2(-B.dx,-B.dz)};   // face: looking along the bridge toward the island (a character's front is -z)
    PVP.gateOut={x:B.x+B.dx*(u-3),z:B.z+B.dz*(u-3),face:PVP.gate.face};
    // the shore a fallen fighter wakes on: the lake's mainland bank on the bridge's side, 4-10 m from the water's edge, never in the water
    const st=[B.x-B.dx*B.len/2,B.z-B.dz*B.len/2], a0=Math.atan2(st[0]-PVP.x,st[1]-PVP.z);   // st: the bridge's mainland end
    for(let k=-12;k<=12;k++) for(const dr of [4,7,10]){
      const a=a0+k*0.1, R=PVP_ISLE.lakeR+dr, x=PVP.x+Math.sin(a)*R, z=PVP.z+Math.cos(a)*R;
      if(rawHeight(x,z)>1.2&&!bridgeAt(x,z,2)) PVP.shore.push({x,z,face:Math.atan2(PVP.x-x,PVP.z-z)+Math.PI});
    }
  } }
// a random shore spot (rnd: 0..1 from the caller's random); the gate's outside if the bank has none
function pvpShoreSpot(rnd){ const L=PVP.shore; return L.length?L[Math.min(L.length-1,Math.floor((rnd==null?Math.random():rnd)*L.length))]:PVP.gateOut; }
/* fixed gear: the common set of the tier of PVP.level for the class in hand (weapon, helmet, top, bottom, shoes), nothing else counts (no ring, no pendant, no rarity) */
const PVP_TIER=tierFor(PVP.level);
function pvpGearOf(cls){ const t=PVP_TIER+1; return {weapon:(WEAPON_OF[cls]||'sword')+t,helmet:'helmet'+t,top:'top'+t,bottom:'bottom'+t,shoes:'shoes'+t}; }
const pvpStatsOf=cls=>gearStatsOf({eq:pvpGearOf(cls)});   // {hp, atk, def}
/* the loadout everyone fights with: your own equipped attacks of the class in hand (all three slots are open for everybody: a slot you have not opened, or left empty, gets the class's free
   ability) at skill level 1, a boss skill included; a skill-set piece is left out (its bonuses are progress, not fixed numbers). Passives: one slot (what PVP.level opens), all at level 1.
   Underleveled (below PASSIVE_LV, so you have none yet): the default, Vitality. Otherwise what you wear in your first slot (Vitality instead of a skill-set passive; an empty slot stays empty).
   Returns a skills object the shared helpers read like a save's (abilityOf with any level, passiveSum with PVP.level); level: the fighter's real level, which decides what they have earned. */
function pvpSkillsOf(skills,level){
  const out={owned:[],eq:{},lv:{},pass:new Array(PASSIVE_SLOTS).fill(null),pgiven:true,v:2};
  const add=id=>{ if(id&&!out.owned.includes(id)) out.owned.push(id); };
  for(const c in CLASSES){
    out.eq[c]={};
    for(const slot of SLOTS){
      const a=abilityOf(c,slot,skills,level), id=a&&!a.set?a.id:DEFAULT_OF[c][slot];
      out.eq[c][slot]=id; add(id);
    }
  }
  const own=skills&&Array.isArray(skills.owned)?skills.owned:[], P=skills&&Array.isArray(skills.pass)?PASSIVES[skills.pass[0]]:null;
  let pid=null; if(level<PASSIVE_LV) pid='vitality'; else if(P) pid=!P.set&&own.includes(P.id)?P.id:'vitality';
  out.pass[0]=pid; add(pid);
  return out;
}
