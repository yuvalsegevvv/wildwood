//@ The body moves with the skill: a step into every blow, a recoil after every shot, a hop into a stomp or a spin (your own hiker; real movement, so walls, slopes and monsters still stop it)
/* Agent map. skmMove(dt) runs from updatePlayer (player/movement.js) right after the velocity is applied and before the collisions: it reads the act in CB.act (kind, t, dur, hitAt; sw = the swings of a
   multi-hit skill, combat/skill-vis.js) and nudges P.x / P.z along the facing (forward: a lunge; back: a recoil) or kicks P.vy (a hop). Other players see it as ordinary movement.
   SKM_TUNE holds the numbers a designer would change. The distances are small on purpose: a skill never moves you out of a fight. Test: client-smoke. */
const SKM_TUNE={lunge:0.7, lungeSwing:0.38, lead:0.12, tail:0.03, recoil:0.32, recoilLen:0.12, hopSpin:3.2, hopStomp:4.4, hopNova:3.2, stand:1.7};   // metres, seconds, m/s
const SKM_STOMP={quake:1, inferno:1, meteor:1, bladestorm:0};   // acts that stomp (a hop, then the slam as you land)
let skmDone=null;   // the act that has had its hop already
function skmMove(dt){
  const a=CB.act; if(!a||PL.dead||PFX.root>0||cineOn) return;
  const T=SKM_TUNE, fx=-Math.sin(P.face), fz=-Math.cos(P.face), tg=CB.target&&!CB.target.dead?CB.target:null;
  const near=tg&&Math.hypot(tg.x-P.x,tg.z-P.z)<T.stand;   // (already close: no step, so you never push into the monster)
  let sp=0;   // forward speed this frame (negative: back)
  if(a.kind==='slash'){
    const hits=a.sw?a.sw.n:1, gap=a.sw?a.sw.gap:0, h0=a.sw?a.sw.start:a.dur*a.hitAt, each=(a.sw?T.lungeSwing:T.lunge)/(T.lead+T.tail);
    for(let i=0;i<hits;i++){ const h=h0+i*gap; if(a.t>=h-T.lead&&a.t<h+T.tail) sp=each; }
    if(near) sp=0;
  } else if(a.kind==='shoot'||a.kind==='volley'){
    const h=a.dur*a.hitAt; if(a.t>=h&&a.t<h+T.recoilLen) sp=-T.recoil/T.recoilLen;
  } else if(skmDone!==a&&P.ground&&(a.kind==='spin'||a.kind==='nova')){
    skmDone=a; P.vy=a.kind==='spin'?T.hopSpin:SKM_STOMP[a.sk]?T.hopStomp:T.hopNova; P.ground=false;   // (the stomp lands about when the blow does)
  }
  if(sp){ P.x+=fx*sp*dt; P.z+=fz*sp*dt; }
}
