//@ The first-steps guide: a trail of gold motes along the ground and a rising pillar of sparkles that lead a new hiker to the villager the main quest sends them to
/* Agent map. updateQuestGuide(dt) (main/loop.js) runs while the main quest is on its first step (gear.mq.s === 0: Wren, then Healer Linnea; mqTarget, economy/main-quest.js, says
   where) and the hiker is in the home village's land. Twice a second it drops short-lived gold motes every QG_GAP metres on the line from the hiker towards the target (at most QG_REACH
   metres ahead, so a far target is a direction, not a wall) and a column of sparkles over the target; both go through the shared particle pool (combat/fx-pool.js, fxpAdd). The guide
   stops by itself when the first step is done. Client only: nothing synced or saved; phones get fewer motes (fxpN). Test: client-smoke (the loop runs it). */
const QG_GAP=3, QG_REACH=36, QG_COL=0xffd25a, QG={t:0};
function updateQuestGuide(dt){
  if(!started||customizing||PL.dead||dgIn()||caveIn()) return;   // cave:
  QG.t-=dt; if(QG.t>0) return; QG.t=0.5;
  const M=mqG(); if(!M||M.s!==0) return;
  const T=mqTarget(); if(!T) return;
  const dx=T.x-P.x, dz=T.z-P.z, d=Math.hypot(dx,dz); if(d<2.5) return;
  const ux=dx/d, uz=dz/d, far=Math.min(d-1.5,QG_REACH);
  for(let r=QG_GAP;r<=far;r+=QG_GAP){
    const x=P.x+ux*r, z=P.z+uz*r;
    fxpAdd(x,getH(x,z)+0.35,z,0,0.25,0,QG_COL,0.34,0.95,{white:0.4,a:0.9});
  }
  const n=fxpN(6), gy=getH(T.x,T.z);   // the column over the villager: seen from the far end of the street
  for(let k=0;k<n;k++){ const h=AR(0,1); fxpAdd(T.x+AR(-0.25,0.25),gy+2.3+h*7,T.z+AR(-0.25,0.25),0,AR(0.4,1),0,QG_COL,0.5-0.2*h,0.9,{white:0.5,a:0.95}); }
}
