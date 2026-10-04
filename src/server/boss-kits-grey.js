//@ Boss move sets of the Greyspine: the Gryphon Queen (talon rakes, swoops, the flight with her eaglets, the storm of quills) and the mountain golem (rockfalls, quakes, the iron-joint shield, rubble)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg; a multiplier is how many hits a move is worth. */

// ---- The Gryphon Queen (level 29, on her peak): she is fast, and the sky is hers ----
// a rake: she turns on the nearest player and her talons sweep a wide arc in front of her
function gryphRakeS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.5,1.0);
  addTeleS(B,m.x,m.z,12,1.2,'rake',Math.round(m.T.dmg*1.8),Math.atan2(-(p.x-m.x),-(p.z-m.z)),0.8);
}
// swoops: rings of her shadow close on players' positions and she drops on each; anyone caught is slowed for a moment
function gryphSwoopS(B,m,inside,n){
  const D=m.T.dmg, pool=inside.slice();
  for(let i=0;i<n;i++){ const q=pool.length?pool.splice(Math.floor(Math.random()*pool.length),1)[0]:randPlayerS(inside), a=AR(0,TAU), r=i?AR(0,2.5):0;
    const e=addTeleS(B,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,3.6,1.5+i*0.15,'swoop',Math.round(D*1.5)); e.hit=p=>{ pfxS(p,'slow',1.6); }; }
}
// phase 2: she takes off (immune, in the air) and drops on players in four waves, with eaglets on the ground; then she crashes down and lies stunned for 5 s
function gryphFlightS(B,m){
  const A=B.A, N=4, step=3.6;
  for(let i=0;i<N;i++) laterS(B,1.0+i*step,()=>{ const ins=playersInArena(A,4); if(!ins.length||m.dead) return; ev('mact',m.id,1.0); gryphSwoopS(B,m,ins,Math.min(3,1+ins.length)); });
  laterS(B,1.0+N*step,()=>{
    B.mode=0; m.immune=false; B.busy=0; B.mv=null; B.stunT=5; m.act=null;
    addTeleS(B,m.x,m.z,8,0.9,'slam',Math.round(m.T.dmg*1.2)); ev('roar',m.id);
    toastTo(null,'The Gryphon Queen crashes to the ground! Strike now!','good');
  });
}
// phase 3: a storm of quills fanned out from her like the spokes of a wheel (the gaps between them are the safe places), a second fan turned half a spoke after it
function gryphStormS(B,m){
  const D=m.T.dmg, n=6, a0=AR(0,TAU);
  castS(B,m,2.4,2.3);
  for(let f=0;f<2;f++) laterS(B,f*1.3,()=>{ for(let i=0;i<n;i++) addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(D*1.6),a0+f*TAU/n/2+i*TAU/n,1.5); });
  toastTo(null,'The Gryphon Queen shakes out her quills! Stand between the lines.','bad');
}
BOSS_KITS.gryphon={
  start(B){ B.k={rakeT:5,swoopT:9,stormT:99}; },
  phase(B,m,n){
    if(n===2){ B.busy=1e3; B.mode=1; m.immune=true; m.act=null; clearTeleS(B); spawnAddsS(B,2); gryphFlightS(B,m); toastTo(null,'The Gryphon Queen beats her wings and rises into the sky!','bad'); }
    else { B.k.stormT=4; spawnAddsS(B,2); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    if(B.mode===1) return;   // in the air: the flight is a queue of steps
    k.rakeT-=dt; k.swoopT-=dt; if(B.phase>=3) k.stormT-=dt;
    if(B.busy>0) return;
    if(k.stormT<=0){ k.stormT=15; gryphStormS(B,m); }
    else if(k.swoopT<=0){ k.swoopT=B.enraged?7:9.5; gryphSwoopS(B,m,C.inside,Math.min(B.enraged?3:2,Math.max(1,C.inside.length))); }
    else if(k.rakeT<=0&&C.dp<14){ k.rakeT=B.enraged?5:7; gryphRakeS(B,m,C.p); }
  }
};

// ---- The mountain golem (level 32, in his cavern): a stone shell round a jointed metal frame, an old machine woken by the dark ----
// boulders drop where players stand (the first on the nearest) and where they are about to be; they slow whoever they hit
function golemRockfallS(B,m,C){
  const D=m.T.dmg, n=B.enraged?6:B.phase===2?4:3;
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i<2?AR(0,1.5):AR(2,7);
    const [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r+1);
    const e=addTeleS(B,x,z,2.9,1.6+i*0.12,'rockfall',Math.round(D*1.6)); e.hit=p=>{ pfxS(p,'slow',2); }; }
}
// a quake: he stamps and everything near him shakes (stay out of the circle)
function golemQuakeS(B,m){ castS(B,m,2.3,2.3); addTeleS(B,m.x,m.z,11,2.2,'quake',Math.round(m.T.dmg*2.1)); ev('roar',m.id); }
// phase 2: his stone shell holds, shielded behind three iron joints in the ring of the cavern (break them to crack the shell: he is stunned for 5 s), rubble crawls out of the walls
function golemShellS(B,m){
  const A=B.A; m.immune=true; B.mode=3; B.aux=3; B.totems=[]; spawnAddsS(B,2,A.x,A.z,9);
  for(let i=0;i<3;i++){ const a=m.face+i/3*TAU+0.5, x=A.x+Math.sin(a)*12, z=A.z+Math.cos(a)*12; B.totems.push(spawnMonS(B.bd.totem,x,z,{x,z},true)); }
  toastTo(null,'The golem\'s shell hardens! Break the '+B.bd.totems+'.','bad'); ev('roar',m.id);
}
BOSS_KITS.golem={
  start(B){ B.k={fallT:4,quakeT:11,sweepT:99}; },
  phase(B,m,n){ if(n===2) golemShellS(B,m); else { B.k.sweepT=5; spawnAddsS(B,3); ev('roar',m.id); } },
  tick(B,m,dt,C){
    const k=B.k;
    if(m.immune){
      B.totems=B.totems.filter(x=>!x.dead&&!x.remove); B.aux=B.totems.length;
      if(!B.totems.length){ m.immune=false; B.mode=0; B.stunT=5; m.act=null; clearTeleS(B); toastTo(null,'The shell cracks! '+B.bd.short+' is stunned.','good'); return; }
      m.hp=Math.min(m.maxHp*0.6,m.hp+m.maxHp*0.004*dt);
    }
    k.fallT-=dt; k.quakeT-=dt; if(B.phase>=3) k.sweepT-=dt;
    if(k.fallT<=0){ k.fallT=B.enraged?5:B.phase===2?7:8; golemRockfallS(B,m,C); }
    if(B.busy>0||m.immune) return;
    if(k.sweepT<=0){ k.sweepT=13; const a0=AR(0,TAU); castS(B,m,2.2,2.3); for(const d of [-8,0,8]) addTeleS(B,m.x+Math.cos(a0)*d,m.z-Math.sin(a0)*d,30,1.6,'line',Math.round(m.T.dmg*1.7),a0,2.2); toastTo(null,'The golem swings his arms: an avalanche!','bad'); }   // three strips side by side along one direction
    else if(k.quakeT<=0&&C.dp<14){ k.quakeT=B.enraged?8:11; golemQuakeS(B,m); }
  }
};
