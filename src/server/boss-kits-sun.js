//@ Boss move sets of the Sunscar: the Glass Guardian (shard lines, glassfall, the radiant ring, the black-mirror shield, the prism wheel) and the Sand Wyrm (tail sweeps, the burrow, sand walls, the sandstorm, whelps)
/* See boss.js for the kit contract and boss-fx.js for the moves. The wyrm's death opens Redgate (combat.js). Numbers: a boss's hit is m.T.dmg. */

// ---- The Glass Guardian (level 32, on the black glass fields) ----
// shards: a fan of three glass lines thrown at the nearest player
function glassShardsS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.6,1.0);
  const a0=Math.atan2(p.x-m.x,p.z-m.z);
  for(const d of [-0.28,0,0.28]) addTeleS(B,m.x,m.z,24,1.3,'line',Math.round(m.T.dmg*1.5),a0+d,1.4);
}
// glassfall: panes drop where players stand and a little beside them
function glassFallS(B,m,C){
  const n=B.enraged?6:B.phase>=2?4:3;
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i<2?AR(0,1.2):AR(2,7);
    const [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r+1);
    const e=addTeleS(B,x,z,3.0,1.5+i*0.12,'rockfall',Math.round(m.T.dmg*1.5)); e.hit=p=>{ pfxS(p,'slow',1.6); }; }
}
// phase 2: a black-mirror shield; three mirrors ring the arena, break them to crack the glass (stunned for 5 s)
function glassShieldS(B,m){
  const A=B.A; m.immune=true; B.mode=3; B.aux=3; B.totems=[]; spawnAddsS(B,2,A.x,A.z,9);
  for(let i=0;i<3;i++){ const a=m.face+i/3*TAU+0.5, x=A.x+Math.sin(a)*12, z=A.z+Math.cos(a)*12; B.totems.push(spawnMonS(B.bd.totem,x,z,{x,z},true)); }
  toastTo(null,'The Glass Guardian goes dark! Break the '+B.bd.totems+'.','bad'); ev('roar',m.id);
}
BOSS_KITS.glass={
  start(B){ B.k={shardT:4,fallT:7,ringT:11,wheelT:99}; },
  phase(B,m,n){ if(n===2) glassShieldS(B,m); else { B.k.wheelT=4; spawnAddsS(B,3); ev('roar',m.id); } },
  tick(B,m,dt,C){
    const k=B.k;
    if(m.immune){
      B.totems=B.totems.filter(x=>!x.dead&&!x.remove); B.aux=B.totems.length;
      if(!B.totems.length){ m.immune=false; B.mode=0; B.stunT=5; m.act=null; clearTeleS(B); toastTo(null,'The glass cracks! '+B.bd.short+' is stunned.','good'); return; }
      m.hp=Math.min(m.maxHp*0.6,m.hp+m.maxHp*0.004*dt);
    }
    k.fallT-=dt; k.shardT-=dt; k.ringT-=dt; if(B.phase>=3) k.wheelT-=dt;
    if(k.fallT<=0){ k.fallT=B.enraged?5:7; glassFallS(B,m,C); }
    if(B.busy>0||m.immune) return;
    if(k.wheelT<=0){ k.wheelT=14; const a0=AR(0,TAU); castS(B,m,2.4,2.3); for(let f=0;f<2;f++) laterS(B,f*1.2,()=>{ for(let i=0;i<6;i++) addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(m.T.dmg*1.6),a0+f*TAU/12+i*TAU/6,1.5); }); toastTo(null,'The prism throws a wheel of light! Stand between the beams.','bad'); }
    else if(k.ringT<=0&&C.dp<16){ k.ringT=B.enraged?8:11; castS(B,m,2.5,2.3); addTeleS(B,m.x,m.z,20,2.3,'donut',Math.round(m.T.dmg*1.9),0,6); ev('roar',m.id); }   // the radiant ring: only the middle is safe
    else if(k.shardT<=0){ k.shardT=B.enraged?5:7; glassShardsS(B,m,C.p); }
  }
};

// ---- The Sand Wyrm (level 36, in the dune sea before Redgate) ----
// a tail sweep: a wide arc in front of it
function wyrmSweepS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.6,1.0);
  addTeleS(B,m.x,m.z,13,1.2,'rake',Math.round(m.T.dmg*1.8),Math.atan2(-(p.x-m.x),-(p.z-m.z)),0.8);
}
// the burrow (phase 2): it goes under the sand (immune) and comes up under a player 3 s later; the ground ring shows where
function wyrmBurrowS(B,m,C){
  const q=C.p; B.mode=2; m.immune=true; B.busy=1e3; clearTeleS(B);
  const [x,z]=inArenaS(B.A,q.x,q.z,B.A.r-2);
  ev('mact',m.id,2.3); moveBossS(B,x,z,2.6);
  laterS(B,2.0,()=>{ if(!m.dead) addTeleS(B,x,z,7,1.0,'slam',Math.round(m.T.dmg*2.0)); });
  laterS(B,3.2,()=>{ if(m.dead) return; B.mode=0; m.immune=false; B.busy=0; B.mv=null; m.act=null; spawnAddsS(B,1); ev('roar',m.id); });
}
// a wall of sand rolling across the arena with a gap in it
function wyrmWallS(B,m){
  const A=B.A, a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), hw=A.r;
  castS(B,m,2.0,2.3);
  addWallS(B,A.x-ux*(A.r+4),A.z-uz*(A.r+4),a,9,hw,AR(-hw*0.5,hw*0.5),3.6,Math.round(m.T.dmg*1.6),1.6);
  toastTo(null,'A wall of sand rolls across the dunes! Find the gap.','bad');
}
// phase 3: the sandstorm closes in on a safe circle; stay inside it
function wyrmStormS(B,m){
  const A=B.A, [x,z]=arenaPtS(A,A.r*0.4);
  castS(B,m,2.2,2.3); B.mode=4;
  addZoneS(B,'sandstorm',x,z,A.r-2,9,0,6);
  laterS(B,9.5,()=>{ if(B.mode===4) B.mode=0; });
  toastTo(null,'The Sand Wyrm raises a sandstorm! Stay inside the circle.','bad');
}
BOSS_KITS.sandwyrm={
  start(B){ B.k={sweepT:4,burrowT:99,wallT:99,stormT:99}; },
  phase(B,m,n){
    if(n===2){ B.k.burrowT=5; B.k.wallT=11; spawnAddsS(B,2); }
    else { B.k.stormT=6; spawnAddsS(B,3); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    if(B.mode===2) return;   // under the sand: the burrow is a queue of steps
    k.sweepT-=dt; k.burrowT-=dt; k.wallT-=dt; k.stormT-=dt;
    if(B.busy>0) return;
    if(k.stormT<=0&&B.mode!==4){ k.stormT=B.enraged?16:20; wyrmStormS(B,m); }
    else if(k.burrowT<=0){ k.burrowT=B.enraged?9:13; wyrmBurrowS(B,m,C); }
    else if(k.wallT<=0){ k.wallT=B.enraged?10:14; wyrmWallS(B,m); }
    else if(k.sweepT<=0&&C.dp<15){ k.sweepT=B.enraged?4:6; wyrmSweepS(B,m,C.p); }
  }
};
