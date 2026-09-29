//@ Boss move sets of the Sakura Vale: Akaoni (demon leaps and fire pools, fire ripples, burning brands) and Kyuubi (foxfire volleys, blinking strikes, spoke beams, spirit foxes)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg; a multiplier is how many hits a move is worth. */

// ---- Akaoni, the Gate Demon (level 20): it does not walk to you, it jumps ----
// a leap onto a player: a circle warns where it lands, it comes down there and leaves a pool of fire
function oniLeapS(B,m,inside){
  const A=B.A, q=inside.length>1&&Math.random()<0.7?farPlayerS(m,inside):randPlayerS(inside), [x,z]=inArenaS(A,q.x,q.z,A.r-4);
  addTeleS(B,x,z,5.2,1.6,'slam',Math.round(m.T.dmg*1.8));
  castS(B,m,1.9,2.3);
  laterS(B,0.4,()=>{ B.mode=1; moveBossS(B,x,z,1.2); });
  laterS(B,1.62,()=>{ B.mode=0; addZoneS(B,'ember',x,z,3.4,9); });
}
// fire ripples out from the boss: first the ground at 5.5-10.5 m and 15.5-22 m burns (safe: hugging it, or 10.5-15.5), then 0-6 m and 11-16 m (safe: 6-11, or beyond 16)
function oniRipplesS(B,m){
  const x=m.x, z=m.z, dmg=Math.round(m.T.dmg*1.3);
  castS(B,m,4.3,2.3);
  addTeleS(B,x,z,10.5,2.0,'donut',dmg,0,5.5); addTeleS(B,x,z,22,2.0,'donut',dmg,0,15.5);
  laterS(B,2.4,()=>{ addTeleS(B,x,z,6,1.8,'slam',dmg); addTeleS(B,x,z,16,1.8,'donut',dmg,0,11); });
}
// brands: two players (three enraged) glow; in 3.4 s a burst goes off where each one stands, hurting everyone near (the branded one half as hard), and leaves a fire pool
function oniBrandS(B,m,inside){
  const picks=[...inside].sort(()=>Math.random()-0.5).slice(0,B.enraged?3:2);
  for(const q of picks){ const e=addTeleS(B,q.x,q.z,5,3.4,'mark',Math.round(m.T.dmg*1.7),0,q.id); e.done=()=>addZoneS(B,'ember',e.x,e.z,3.4,7); }
  toastTo(null,'Akaoni brands '+picks.map(q=>q.name).join(' and ')+'! Get away from each other!','bad'); ev('roar',m.id);
}
BOSS_KITS.oni={
  start(B){ B.k={leapT:6,rippleT:99,brandT:99}; },
  phase(B,m,n){
    if(n===2){ B.k.rippleT=4; toastTo(null,'The Demon Gate flares! The ground ripples with fire.','bad'); }
    else { B.k.brandT=5; spawnAddsS(B,2); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    k.leapT-=dt; if(B.phase>=2) k.rippleT-=dt; if(B.phase>=3) k.brandT-=dt;
    if(B.busy>0||B.mv) return;
    if(k.brandT<=0){ k.brandT=13; oniBrandS(B,m,C.inside); }
    else if(k.rippleT<=0){ k.rippleT=B.enraged?10:13; oniRipplesS(B,m); }
    else if(k.leapT<=0){ k.leapT=B.enraged?7:B.phase===2?8.5:10; oniLeapS(B,m,C.inside); }
  }
};

// ---- Kyuubi, the Nine-Tailed (level 25): a trickster of light that is never where you looked last ----
// a volley of foxfire orbs at a player: a fan of 5 (7 in phase 2); enraged, a full ring of 12 and then a fan
function foxVolleyS(B,m,p){
  const D=m.T.dmg, x=m.x, z=m.z, a=Math.atan2(-(p.x-x),-(p.z-z));
  castS(B,m,1.1,1.0); faceS(m,p.x,p.z);
  const fan=(n,sp)=>{ for(let i=0;i<n;i++) fireOrbS(B,'foxfire',x,z,a+(i-(n-1)/2)*sp,13,Math.round(D*0.9)); };
  laterS(B,0.55,()=>{
    if(B.enraged){ for(let i=0;i<12;i++) fireOrbS(B,'foxfire',x,z,i/12*TAU,11,Math.round(D*0.8)); laterS(B,0.9,()=>fan(5,0.2)); }
    else fan(B.phase>=2?7:5,0.2);
  });
}
// it vanishes and comes down behind a player; a circle marks the spot for 1.3 s
function foxBlinkS(B,m,inside){
  const A=B.A, q=inside.length>1?farPlayerS(m,inside):inside[0], d=Math.hypot(q.x-m.x,q.z-m.z)||1;
  const [x,z]=inArenaS(A,q.x+(q.x-m.x)/d*2.4,q.z+(q.z-m.z)/d*2.4,A.r-2);
  castS(B,m,1.4,0); B.mode=2; m.immune=true; B.mv=null;
  addTeleS(B,x,z,4.2,1.3,'slam',Math.round(m.T.dmg*1.5));
  laterS(B,1.3,()=>{ m.x=x; m.z=z; faceS(m,q.x,q.z); B.mode=0; m.immune=false; m.atkT=0.3; ev('roar',m.id); });
}
// three beams of light from the boss (five enraged), turning 22 degrees between three rounds
function foxBeamsS(B,m,p){
  const D=m.T.dmg, x=m.x, z=m.z, a0=Math.atan2(-(p.x-x),-(p.z-z)), n=B.enraged?5:3;
  castS(B,m,4.4,2.3);
  for(let r=0;r<3;r++) laterS(B,r*1.15,()=>{ for(let j=0;j<n;j++) addTeleS(B,x,z,26,1.5,'line',Math.round(D*1.3),a0+r*0.38+j*TAU/n,1.3); });
}
BOSS_KITS.kitsune={
  start(B){ B.k={volT:4,blinkT:10,beamT:99}; },
  phase(B,m,n){
    if(n===2){ B.k.beamT=5; toastTo(null,'Kyuubi\'s tails spread into beams of light!','bad'); }
    else { B.k.blinkT=4; spawnAddsS(B,3); toastTo(null,'Fox spirits pour out of the shrine!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    k.volT-=dt; k.blinkT-=dt; if(B.phase>=2) k.beamT-=dt;
    if(B.busy>0||B.mv) return;
    if(k.beamT<=0){ k.beamT=B.enraged?10:13; foxBeamsS(B,m,C.p); }
    else if(k.blinkT<=0){ k.blinkT=B.enraged?8:11; foxBlinkS(B,m,C.inside); }
    else if(k.volT<=0){ k.volT=B.enraged?4.5:B.phase===2?5.5:6.5; foxVolleyS(B,m,C.p); }
  }
};
