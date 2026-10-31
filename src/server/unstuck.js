//@ Getting unstuck: the chat command /stuck (or the Stuck button) sends a hiker who cannot move to the spawn of the nearest village they may enter
/* Agent map. Message stuck{} (MSG.stuck) and the chat command /stuck (hook in chatP, economy.js). Refused while knocked out, in a dungeon run, on the Proving Isle, within UNSTUCK_IDLE s of a hit,
   or within UNSTUCK_CD s of the last use (the answer is a toast). Only villages the save may enter are candidates (the same gates as wvSpawnOf, players.js); a guest keeps to the guest lands.
   The client is told with a 'tp' like a teleport circle's. Test: tools/unstuck-smoke.js */
const UNSTUCK_CD=60, UNSTUCK_IDLE=5;
function unstuckVillagesP(g){
  return [VIL,g.east>=1&&VIL2,g.north>=1&&VIL3,g.west>=1&&VIL4,(g.river>=1||g.redgate>=1)&&VIL5,g.neck>=1&&VIL6,g.amber>=1&&VIL7,g.isles>=1&&VIL8].filter(Boolean);
}
function unstuckP(p){
  if(p.dead||p.inst||p.pv) { toastTo(p.id,'You cannot use /stuck here','bad'); return; }
  if(S.t-p.lastHit<UNSTUCK_IDLE){ toastTo(p.id,'Wait '+UNSTUCK_IDLE+' seconds out of combat first','bad'); return; }
  const left=Math.ceil(UNSTUCK_CD-(S.t-(p.unstuckT===undefined?-1e9:p.unstuckT)));
  if(left>0){ toastTo(p.id,'/stuck is ready again in '+left+' s','bad'); return; }
  let best=null, bd=Infinity;
  const isl=inIsles(p.x,p.z);   // emberwake: the isles are across the sea: from one only Coralhaven is near, and nobody else is sent over the water to it
  for(const V of unstuckVillagesP(p.gear)){ if(isl?V!==VIL8&&p.gear.isles>=1:V===VIL8) continue; const s=V.spawn||{x:V.x,z:V.z}; if(isGuestP(p)&&!guestLandOk(s.x,s.z)) continue; const d=Math.hypot(s.x-p.x,s.z-p.z); if(d<bd){ bd=d; best=s; } }
  if(!best) return;
  p.unstuckT=S.t; p.x=best.x; p.z=best.z; p.y=getH(best.x,best.z); p.vx=p.vz=0;
  ev('warp',p.id,r1(p.x),r1(p.z),r1(best.x),r1(best.z)); sendTo(p.id,{t:'tp',x:best.x,z:best.z,face:0});
  toastTo(p.id,'You are back at the nearest village','good');
}
MSG.stuck=(p)=>unstuckP(p);
