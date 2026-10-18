//@ Boss move sets of the Sakura Vale: Akaoni (demon leaps and fire pools, stampede hops, the torii gate, fire ripples, burning brands, the embers he feeds on) and Kyuubi (foxfire volleys that widen as her tails burn, blinking strikes through the spirits, the fox trail, spoke beams)
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
// a stampede of leaps: three hops (four enraged) at whoever is nearest, each quicker than the one before (1.3 s, 1.0, 0.8 of warning), an ember pool where each lands
function oniHopsS(B,m){
  const A=B.A, durs=B.enraged?[1.2,0.95,0.8,0.65]:[1.3,1.0,0.8]; let t=0;
  castS(B,m,durs.reduce((a,b)=>a+b+0.1,0)+0.4,2.3); toastTo(null,'Akaoni goes on the stampede!','bad');
  for(const dur of durs){ const t0=t;
    laterS(B,t0,()=>{ const ins=playersInArena(A,4); if(!ins.length||m.dead) return;
      const q=ins.reduce((a,b)=>Math.hypot(a.x-m.x,a.z-m.z)<Math.hypot(b.x-m.x,b.z-m.z)?a:b), [x,z]=inArenaS(A,q.x,q.z,A.r-4);
      addTeleS(B,x,z,4.2,dur,'slam',Math.round(m.T.dmg*1.5));
      laterS(B,dur-0.65,()=>{ B.mode=1; moveBossS(B,x,z,0.6); });
      laterS(B,dur,()=>{ B.mode=0; addZoneS(B,'ember',x,z,2.8,8); }); });
    t+=dur+0.1; }
}
// the torii: two pillars of fire stand 11 m apart with a player between them (each 20 m long, 2.4 m either side, 1.5 s of warning) and, 0.7 s later, the lintel falls across the
// gap through where that player stood. The middle looks safe and is the worst place to be: leave the gate along its length, or out past a pillar
function oniToriiS(B,m,p){
  const D=m.T.dmg, a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), wx=-uz, wz=ux; castS(B,m,1.6,2.3);
  for(const s of [-5.5,5.5]) addTeleS(B,p.x+wx*s-ux*10,p.z+wz*s-uz*10,20,1.5,'line',Math.round(D*1.4),a,2.4);
  laterS(B,0.7,()=>addTeleS(B,p.x-wx*9,p.z-wz*9,18,0.9,'line',Math.round(D*1.6),a+Math.PI/2,2.4));
  toastTo(null,'Akaoni raises a torii of fire! Do not stand in the gate.','bad');
}
// he feeds on his own fire: standing in an ember pool he mends 0.8% of his health a second, and an imp that dies leaves a pool where it fell. Pull him out of the fire and put the imps down far from him
function oniEmbersS(B,m,dt){
  for(const zn of B.zones) if(zn.kind==='ember'&&Math.hypot(zn.x-m.x,zn.z-m.z)<zn.r+m.T.rad*0.5){
    m.hp=Math.min(m.maxHp,m.hp+m.maxHp*0.008*dt);
    if(!B.k.fed){ B.k.fed=true; toastTo(null,'Akaoni feeds on the embers! Pull him out of the fire.','bad'); } }
  for(const a of B.adds) if(a.dead&&!a.flared){ a.flared=true; addZoneS(B,'ember',a.x,a.z,2.4,6); }
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
  for(const q of picks){ const e=addTeleS(B,q.x,q.z,5,3.4,'mark',Math.round(m.T.dmg*1.7),0,q.id); e.done=()=>addZoneS(B,'ember',e.x,e.z,3.4,7);
    for(let t=0.8;t<3.4;t+=0.8) laterS(B,t,()=>{ if(!B.engaged||m.dead||q.dead) return; addZoneS(B,'ember',q.x,q.z,1.8,5); }); }   // the branded smoulder: they leave a fire behind them wherever they run
  toastTo(null,'Akaoni brands '+picks.map(q=>q.name).join(' and ')+'! Get away from each other!','bad'); ev('roar',m.id);
}
BOSS_KITS.oni={
  start(B){ B.k={leapT:6,rippleT:99,brandT:99,hopT:14,toriiT:9,fed:false}; },
  phase(B,m,n){
    if(n===2){ B.k.rippleT=4; toastTo(null,'The Demon Gate flares! The ground ripples with fire.','bad'); }
    else { B.k.brandT=5; spawnAddsS(B,2); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    k.leapT-=dt; k.hopT-=dt; k.toriiT-=dt; if(B.phase>=2) k.rippleT-=dt; if(B.phase>=3) k.brandT-=dt;
    oniEmbersS(B,m,dt);
    if(B.busy>0||B.mv) return;
    if(k.hopT<=0){ k.hopT=B.enraged?15:20; oniHopsS(B,m); }
    else if(k.toriiT<=0){ k.toriiT=B.enraged?11:15; oniToriiS(B,m,C.p); }
    else if(k.brandT<=0){ k.brandT=13; oniBrandS(B,m,C.inside); }
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
    else fan((B.phase>=2?7:5)+Math.floor((9-B.k.tails)/3),0.2);   // (one more orb for every third of her tails gone)
  });
}
// it vanishes and comes down behind a player; a circle marks the spot for 1.3 s
function foxBlinkS(B,m,inside){
  const A=B.A, q=inside.length>1?farPlayerS(m,inside):inside[0], d=Math.hypot(q.x-m.x,q.z-m.z)||1;
  let [x,z]=inArenaS(A,q.x+(q.x-m.x)/d*2.4,q.z+(q.z-m.z)/d*2.4,A.r-2);
  const sp=B.adds.filter(a=>!a.dead&&!a.remove).sort((a,b)=>Math.hypot(a.x-q.x,a.z-q.z)-Math.hypot(b.x-q.x,b.z-q.z))[0];   // she steps out of the fox spirit nearest her prey, and it is spent
  if(sp){ x=sp.x; z=sp.z; removeMonS(sp); }
  castS(B,m,1.4,0); B.mode=2; m.immune=true; B.mv=null;
  addTeleS(B,x,z,4.2,1.3,'slam',Math.round(m.T.dmg*1.5));
  for(let i=0;i<2;i++){ const q2=randPlayerS(inside), a=AR(0,TAU); const [dx,dz]=inArenaS(A,q2.x+Math.sin(a)*AR(2,6),q2.z+Math.cos(a)*AR(2,6),A.r-2); addTeleS(B,dx,dz,4.2,0.6,'slam',0); }   // two illusions: rings that fizzle out after 0.6 s. The one that stays is where she lands
  laterS(B,1.3,()=>{ m.x=x; m.z=z; faceS(m,q.x,q.z); B.mode=0; m.immune=false; m.atkT=0.3; ev('roar',m.id); });
}
// the fox trail: she follows your scent. The last 3.2 s of one player's footsteps light up one after another, oldest first, so the circles chase you from behind
// (keep going forward) and punish any step back over your own path or a stop. Enraged, she follows two players
function foxTrailS(B,m,p){
  const tr=B.k.trail.get(p.id)||[]; if(tr.length<3) return;
  castS(B,m,1.0,1.0);
  const pts=[]; for(const t of tr) if(!pts.length||Math.hypot(t[0]-pts[pts.length-1][0],t[1]-pts[pts.length-1][1])>2.2) pts.push(t);   // (a circle only where you moved on: standing still is one circle, not eight)
  pts.forEach(([x,z],i)=>laterS(B,0.3+i*0.2,()=>{ if(B.engaged&&!m.dead) addTeleS(B,x,z,2.4,0.9,'slam',Math.round(m.T.dmg*0.5)); }));
  toastTo(p.id,'Kyuubi follows your scent!','bad');
}
function foxTrackS(B,dt){
  const k=B.k; k.trackT-=dt; if(k.trackT>0) return; k.trackT=0.4;
  for(const q of playersInArena(B.A,0)){ let tr=k.trail.get(q.id); if(!tr){ tr=[]; k.trail.set(q.id,tr); } tr.push([q.x,q.z]); if(tr.length>8) tr.shift(); }
}
// nine tails: one burns away for every ninth of her health she loses, and a fox spirit leaps out of the flame (at most 2 at once, each lasting 14 s)
function foxTailsS(B,m){
  const k=B.k, tails=Math.max(1,Math.min(9,Math.ceil(9*m.hp/m.maxHp))); B.aux=tails;
  for(const a of B.adds) if(!a.dead&&!a.remove&&S.t-a.born>14) removeMonS(a);   // (a spirit burns out after 14 s)
  if(tails<k.tails){ k.tails=tails; if(B.adds.filter(a=>!a.dead&&!a.remove).length<2){ spawnAddsS(B,1); B.adds[B.adds.length-1].born=S.t; toastTo(null,'A tail burns away: a fox spirit leaps out of the flame!','bad'); } }
}
// three beams of light from the boss (five enraged), turning 22 degrees between three rounds
function foxBeamsS(B,m,p){
  const D=m.T.dmg, x=m.x, z=m.z, a0=Math.atan2(-(p.x-x),-(p.z-z)), n=B.enraged?5:3;
  castS(B,m,4.4,2.3);
  for(const sp of B.adds.filter(a=>!a.dead&&!a.remove).slice(0,2)) addTeleS(B,sp.x,sp.z,22,1.5,'line',Math.round(D*0.5),Math.atan2(-(p.x-sp.x),-(p.z-sp.z)),1.0);   // every living fox spirit echoes the beams with one of its own, at the player she is looking at
  for(let r=0;r<3;r++) laterS(B,r*1.15,()=>{ for(let j=0;j<n;j++) addTeleS(B,x,z,26,1.5,'line',Math.round(D*1.3),a0+r*0.38+j*TAU/n,1.3); });
}
BOSS_KITS.kitsune={
  start(B){ B.k={volT:4,blinkT:10,beamT:99,trailT:9,trackT:0,trail:new Map(),tails:9}; B.aux=9; },
  phase(B,m,n){
    if(n===2){ B.k.beamT=5; toastTo(null,'Kyuubi\'s tails spread into beams of light!','bad'); }
    else { B.k.blinkT=4; spawnAddsS(B,3); toastTo(null,'Fox spirits pour out of the hollow!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    k.volT-=dt; k.blinkT-=dt; k.trailT-=dt; if(B.phase>=2) k.beamT-=dt;
    foxTrackS(B,dt); foxTailsS(B,m);
    if(B.busy>0||B.mv) return;
    if(k.trailT<=0){ k.trailT=B.enraged?12:16; foxTrailS(B,m,C.p); if(B.enraged&&C.inside.length>1) foxTrailS(B,m,farPlayerS(m,C.inside)); }
    else if(k.beamT<=0){ k.beamT=B.enraged?10:13; foxBeamsS(B,m,C.p); }
    else if(k.blinkT<=0){ k.blinkT=B.enraged?8:11; foxBlinkS(B,m,C.inside); }
    else if(k.volT<=0){ k.volT=B.enraged?4.5:B.phase===2?5.5:6.5; foxVolleyS(B,m,C.p); }
  }
};
