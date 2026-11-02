//@ Sitting: a hiker sits on a bench or on the ground (looks only, nothing changes); p.sit is 0, 1 (ground) or 2 (bench) and goes out in the player rows
/* Agent map. Message sit{s:0|1|2} (MSG.sit). The flag is kept in p.sit and drawn by every client (net/remote.js, poseRig); setPos stands a hiker up who has moved off the spot
   (sitStandMoveP, hook in api.js; the player rows send 0 to a knocked-out hiker). The client side: game/world/sitting.js. Test: tools/sitting-smoke.js */
const SIT_MOVE=1.5;
function sitStandMoveP(p){ if(p.sit&&Math.hypot(p.x-p.sitX,p.z-p.sitZ)>SIT_MOVE) p.sit=0; }
MSG.sit=(p,msg)=>{
  const s=msg.s===2?2:msg.s===1?1:0;
  if(p.dead||p.inst||p.pv){ p.sit=0; return; }
  p.sit=s; p.sitX=p.x; p.sitZ=p.z;
};
