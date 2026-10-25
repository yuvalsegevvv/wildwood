//@ Boss move sets of the Amber Reach: Old Thunder (walking lightning lines, spreading grass fires, wing gusts, the dive, spark wisps, the eye of calm) and Oldhorn the Herd-Mother (calf stampede lanes, tusk sweeps, ground rings, grey-stone carriers that foul the floor)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg. Phase 2 starts at 60% and phase 3 (enraged) at 30% (boss.js). Data: shared/savanna-bosses.js. */

// ---- Old Thunder (level 41, on Anvil Rock) ----
// lightning lines walk across the arena: n parallel strips, 4.5 m apart, the first on the nearest player's line, each struck 0.45 s after the one before. Read the first, then step into the gap
function thunderBoltsS(B,m,C){
  const A=B.A, R=A.r, n=B.enraged?5:B.phase>=2?4:3, a=Math.atan2(-(C.p.x-m.x),-(C.p.z-m.z)), ux=-Math.sin(a), uz=-Math.cos(a), px=uz, pz=-ux, side=Math.random()<0.5?1:-1;
  const off0=(C.p.x-A.x)*px+(C.p.z-A.z)*pz;
  castS(B,m,1.6,1.0);
  for(let i=0;i<n;i++) laterS(B,i*0.45,()=>{ if(m.dead) return; const off=off0+side*i*4.5;
    addTeleS(B,A.x+px*off-ux*R,A.z+pz*off-uz*R,2*R,1.1,'line',Math.round(m.T.dmg*1.5),a,1.4); });
  toastTo(null,'Lightning walks across Anvil Rock!','bad');
}
// grass fire: patches catch under players and where they stand next; each one, as it burns out, throws a smaller one 5 m on (two generations at most, never more than THUNDER_FIRES at once)
const THUNDER_FIRES=14;
function thunderFireS(B,m,x,z,gen){
  if(B.zones.length>=THUNDER_FIRES) return;
  const zn=addZoneS(B,'grassfire',x,z,gen?2.6:3.4,gen?5:8);
  if(gen<2) zn.done=z0=>{ if(!B.engaged||m.dead) return; const a=AR(0,TAU); const [nx,nz]=inArenaS(B.A,z0.x+Math.sin(a)*5,z0.z+Math.cos(a)*5,B.A.r-2); thunderFireS(B,m,nx,nz,gen+1); };
}
function thunderSparkS(B,m,C){
  const n=B.enraged?4:B.phase>=2?3:2;
  castS(B,m,1.4,1.0);
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i?AR(2,6):0, [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r-2);
    addTeleS(B,x,z,3.4,1.3+i*0.2,'geyser',Math.round(m.T.dmg*1.2)).done=e=>{ if(B.engaged&&!m.dead) thunderFireS(B,m,e.x,e.z,0); }; }
}
// a wing gust: a ring round him that hurts a little and shoves everyone in it away from him
function thunderGustS(B,m){
  castS(B,m,1.8,2.3); ev('roar',m.id);
  const e=addTeleS(B,m.x,m.z,15,1.5,'gust',Math.round(m.T.dmg*0.9));
  e.hit=p=>{ const dx=p.x-e.x, dz=p.z-e.z, d=Math.hypot(dx,dz)||1; pfxS(p,'push',0,dx/d*18,dz/d*18); };
}
// the dive: he rises, picks the nearest player and drops on that spot 1.3 s later, flying there in the last 0.9 s
function thunderDiveS(B,m,p){
  const x=p.x, z=p.z; castS(B,m,2.4,1.0); B.mode=1;
  addTeleS(B,x,z,5.5,1.4,'slam',Math.round(m.T.dmg*1.9)).hit=q=>{ pfxS(q,'slow',1.5); };
  laterS(B,0.5,()=>{ if(!m.dead&&B.mode===1) moveBossS(B,x,z,0.9); });
  laterS(B,1.5,()=>{ if(B.mode===1) B.mode=0; });
}
// the eye of calm: for THUNDER_EYE s a circle of still air closes from 20 m to 5 m round the middle of the arena; whoever stands outside it is struck every 0.8 s (the whiteout zone)
const THUNDER_EYE=11;
function thunderEyeS(B,m){
  const A=B.A; B.mode=4; addZoneS(B,'whiteout',A.x,A.z,20,THUNDER_EYE,0,5); ev('roar',m.id);
  toastTo(null,'The storm closes in! Get inside the eye of calm.','bad');
  laterS(B,THUNDER_EYE+0.2,()=>{ if(B.mode===4){ B.mode=0; B.k.eyes=(B.k.eyes||0)+1; } });
}
BOSS_KITS.thunder={
  start(B){ B.k={boltT:4,fireT:7,gustT:11,diveT:99,wispT:99,eyeT:99,eyes:0}; },
  phase(B,m,n){
    if(n===2){ B.k.diveT=6; B.k.wispT=4; B.k.eyeT=3; }
    else { B.k.eyeT=Math.min(B.k.eyeT,6); }
    spawnAddsS(B,n===2?2:3); ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k; k.boltT-=dt; k.fireT-=dt; k.gustT-=dt; k.diveT-=dt; k.wispT-=dt; k.eyeT-=dt;
    if(B.mode===4&&B.busy<=0&&k.boltT<=0){ k.boltT=5; thunderBoltsS(B,m,C); return; }   // (the lines keep walking in the eye)
    if(B.busy>0||B.mode===1) return;
    if(B.mode===0&&k.eyeT<=0&&C.inside.length){ k.eyeT=B.enraged?26:36; thunderEyeS(B,m); }
    else if(k.wispT<=0){ k.wispT=B.enraged?14:20; spawnAddsS(B,B.enraged?3:2); }
    else if(k.diveT<=0){ k.diveT=B.enraged?9:13; thunderDiveS(B,m,C.p); }
    else if(k.gustT<=0&&C.dp<18){ k.gustT=B.enraged?8:12; thunderGustS(B,m); }
    else if(k.fireT<=0){ k.fireT=B.enraged?7:10; thunderSparkS(B,m,C); }
    else if(k.boltT<=0){ k.boltT=B.enraged?5:7.5; thunderBoltsS(B,m,C); }
  }
};

// ---- Oldhorn, the Herd-Mother (level 45, at the top of the Sunstair) ----
// the stampede: calves cross the arena in telegraphed lanes, three lanes a set (two sets enraged), a second apart; the lanes of a set are a gap of 7 m apart so there is always room between
function hornStampedeS(B,m,C){
  const A=B.A, R=A.r, sets=B.enraged?2:1, a0=AR(0,TAU);
  castS(B,m,1.4,1.0);
  for(let s=0;s<sets;s++){ const a=a0+s*Math.PI/2, ux=-Math.sin(a), uz=-Math.cos(a), px=uz, pz=-ux, o0=AR(-5,5);
    for(let i=-1;i<=1;i++) laterS(B,s*1.8+(i+1)*0.35,()=>{ if(m.dead) return; const off=o0+i*7;
      addTeleS(B,A.x+px*off-ux*R,A.z+pz*off-uz*R,2*R,1.2,'line',Math.round(m.T.dmg*1.5),a,1.8); }); }
  toastTo(null,'The calves stampede! Watch the lanes.','bad');
}
// tusk sweep: a wide arc swung at the nearest player; whoever it hits is slowed
function hornSweepS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.5,1.0);
  addTeleS(B,m.x,m.z,13,1.2,'rake',Math.round(m.T.dmg*1.8),Math.atan2(-(p.x-m.x),-(p.z-m.z)),1.0).hit=q=>{ pfxS(q,'slow',1.5); };
}
// a ground ring: she rears and brings her forefeet down: everything within 9 m, and a wider ring after it from phase 2
function hornStompS(B,m){
  castS(B,m,2.3,2.3); ev('roar',m.id);
  addTeleS(B,m.x,m.z,9,1.8,'quake',Math.round(m.T.dmg*2.0));
  if(B.phase>=2) addTeleS(B,m.x,m.z,17,2.6,'donut',Math.round(m.T.dmg*1.6),0,9.5);
}
// grey stones: from phase 2 a carrier walks in every HORN_STONE_T s with a grey stone, and the floor where it appeared turns grey (a zone that hurts whoever stands in it and lasts until that carrier falls).
// At most HORN_STONES at once; the bar counts them. Killing the carrier cleanses its patch
const HORN_STONES=5;
function hornStoneS(B,m){
  const k=B.k; k.stones=k.stones.filter(s=>!s.c.dead&&!s.c.remove); if(k.stones.length>=HORN_STONES) return;
  const [x,z]=arenaPtS(B.A,B.A.r-5); spawnAddsS(B,1,x,z,0); const c=B.adds[B.adds.length-1];
  k.stones.push({c,z:addZoneS(B,'greyfloor',x,z,5,600)});
  if(!k.toldStone){ k.toldStone=true; toastTo(null,'Hollowed carriers bring grey stones! Cleanse the floor: kill them.','bad'); }
}
function hornStonesTickS(B,m){
  const k=B.k; let live=0;
  for(const s of k.stones){ if(s.c.dead||s.c.remove){ if(s.z.t<s.z.dur-0.5) s.z.t=s.z.dur-0.1; } else live++; }   // (a patch stays where it was laid: it ends the moment its carrier falls)
  if(live!==B.aux) B.aux=live;
  if(live>=3&&B.mode===0) B.mode=6; else if(live<3&&B.mode===6) B.mode=0;
}
BOSS_KITS.herdmother={
  start(B){ B.k={stampedeT:5,sweepT:7,stompT:11,stoneT:99,stones:[]}; B.aux=0; },
  phase(B,m,n){ if(n===2){ B.k.stoneT=3; spawnAddsS(B,2); } else { B.k.stampedeT=3; spawnAddsS(B,2); } ev('roar',m.id); },
  tick(B,m,dt,C){
    const k=B.k; k.stampedeT-=dt; k.sweepT-=dt; k.stompT-=dt; k.stoneT-=dt;
    if(B.phase>=2) hornStonesTickS(B,m);
    if(B.busy>0) return;
    if(k.stoneT<=0){ k.stoneT=B.enraged?9:12; hornStoneS(B,m); }
    if(k.stampedeT<=0){ k.stampedeT=B.enraged?11:16; hornStampedeS(B,m,C); }
    else if(k.stompT<=0&&C.dp<12){ k.stompT=B.enraged?8:12; hornStompS(B,m); }
    else if(k.sweepT<=0&&C.dp<14){ k.sweepT=B.enraged?4.5:6.5; hornSweepS(B,m,C.p); }
  }
};
