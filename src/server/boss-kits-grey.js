//@ Boss move sets of the Greyspine: the Gryphon Queen (talon rakes, swoops, the flight with her eaglets, the storm of quills) and the mountain golem (rockfalls that crack his own shell, quakes, rubble)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg; a multiplier is how many hits a move is worth. */

// ---- The Gryphon Queen (level 29, on her peak): she is fast, and the sky is hers ----
// a rake: she turns on the nearest player and her talons sweep a wide arc in front of her
function gryphRakeS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.5,1.0);
  addTeleS(B,m.x,m.z,12,1.2,'rake',Math.round(m.T.dmg*1.8),Math.atan2(-(p.x-m.x),-(p.z-m.z)),0.8);
}
// the straggler: the player farthest from everyone else (a lone player is their own). She culls the herd: swoops go for the straggler first, strafing runs for the straggler alone
function gryphStragglerS(ins){
  let best=ins[0], bd=-1;
  for(const q of ins){ let d=1e9; for(const o of ins) if(o!==q) d=Math.min(d,Math.hypot(o.x-q.x,o.z-q.z)); if(d===1e9) d=0; if(d>bd){ bd=d; best=q; } }
  return best;
}
// culling the herd: every 4 s she circles over the biggest huddle (two or more players within 4.5 m of each other) and drops on its middle (5 m, 1.3 s of warning). Spread out, and the straggler is hers
function gryphCullS(B,m,inside){
  if(inside.length<2) return;
  let best=null, bn=1;
  for(const q of inside){ const near=inside.filter(o=>Math.hypot(o.x-q.x,o.z-q.z)<4.5); if(near.length>bn){ bn=near.length; best=near; } }
  if(!best) return;
  const cx=best.reduce((a,o)=>a+o.x,0)/best.length, cz=best.reduce((a,o)=>a+o.z,0)/best.length;
  const e=addTeleS(B,cx,cz,5,1.3,'swoop',Math.round(m.T.dmg*1.3+bn*0.2*m.T.dmg)); e.hit=p=>{ pfxS(p,'slow',1.2); };   // (the bigger the huddle, the harder it lands)
  if(!B.k.culled){ B.k.culled=true; toastTo(null,'The Gryphon Queen circles the huddle! Spread out.','bad'); }
}
// the hunt: every 16 s she picks a hero as her prey for 10 s (a toast names them). Her swoops and strafing runs go for the prey, and every blow from anyone else hits her 25% harder:
// the prey runs and the others hunt the hunter
const GRYPH_HUNT=10;
function gryphHuntS(B,m,inside){
  const q=randPlayerS(inside); B.k.prey={id:q.id,t:GRYPH_HUNT}; toastTo(null,'The Gryphon Queen hunts '+q.name+'!','bad'); toastTo(q.id,'You are her prey: keep running!','bad'); ev('roar',m.id);
}
const gryphPreyS=(B,ins)=>{ const pr=B.k.prey&&ins.find(q=>q.id===B.k.prey.id); return pr||gryphStragglerS(ins); };
// the strafing run: three passes, GRYPH_STEP s apart. She appears on the rim opposite the straggler, a line (2.2 m either side) through them warns 1.1 s, then she flies it end to end in 0.5 s
// and sheds a trail of feathers along it that land a moment later. If all three passes hit nobody she is spent: stunned 4 s
const GRYPH_PASSES=3, GRYPH_STEP=1.9;
function gryphStrafeS(B,m){
  const A=B.A, R=A.r-3; B.k.hits=0; B.busy=1e3; B.mode=1; m.act=null; clearTeleS(B);
  toastTo(null,'The Gryphon Queen goes for a strafing run!','bad'); ev('roar',m.id);
  for(let i=0;i<GRYPH_PASSES;i++) laterS(B,i*GRYPH_STEP,()=>{
    const ins=playersInArena(A,4); if(!ins.length||m.dead||m.immune) return;   // (m.immune: the flight of phase 2 took over)
    const q=gryphPreyS(B,ins), dx=q.x-A.x, dz=q.z-A.z, d=Math.hypot(dx,dz)||1, ux=dx/d, uz=dz/d;
    const sx=A.x-ux*R, sz=A.z-uz*R, ex=A.x+ux*R, ez=A.z+uz*R, f=Math.atan2(-ux,-uz);
    moveBossS(B,sx,sz,0.3); m.face=m.faceGoal=f;
    addTeleS(B,sx,sz,2*R+4,1.1,'line',Math.round(m.T.dmg*1.7),f,2.2).hit=()=>{ B.k.hits++; };
    for(const eg of B.adds.filter(a=>!a.dead&&!a.remove).slice(0,3)) addTeleS(B,eg.x,eg.z,16,1.1,'line',Math.round(m.T.dmg*0.7),Math.atan2(-(q.x-eg.x),-(q.z-eg.z)),1.0);   // the brood dives with her: every living eaglet streaks at the straggler too
    laterS(B,1.1,()=>{ if(m.dead||m.immune) return; B.mv=null; moveBossS(B,ex,ez,0.5); ev('mact',m.id,1.0);
      for(const o of playersInArena(A,0)){ const rx=o.x-sx, rz=o.z-sz, al=rx*ux+rz*uz, off=-rx*uz+rz*ux; if(al>0&&al<2*R&&Math.abs(off)<7) pfxS(o,'push',0,-uz*Math.sign(off||1)*9,ux*Math.sign(off||1)*9); }   // her wake shoves everyone within 7 m of the path away from it
      for(let j=1;j<=5;j++) laterS(B,j*0.1,()=>addTeleS(B,sx+(ex-sx)*j/6,sz+(ez-sz)*j/6,2.0,1.0,'icefall',Math.round(m.T.dmg*0.6))); });
  });
  laterS(B,GRYPH_PASSES*GRYPH_STEP+0.1,()=>{ if(m.immune) return; B.mode=0; B.busy=0; B.mv=null; m.act=null;
    if(!B.k.hits){ B.stunT=4; toastTo(null,'Three passes and nobody hit: the Gryphon Queen is spent! Strike now!','good'); } });
}
// swoops: rings of her shadow close on players' positions and she drops on each; anyone caught is slowed for a moment
function gryphSwoopS(B,m,inside,n){
  const D=m.T.dmg, pool=inside.slice(), st=gryphPreyS(B,inside);
  if(inside.length>1) pool.splice(pool.indexOf(st),1);   // (the first ring is the straggler's)
  for(let i=0;i<n;i++){ const q=i===0?st:pool.length?pool.splice(Math.floor(Math.random()*pool.length),1)[0]:randPlayerS(inside), a=AR(0,TAU), r=i?AR(0,2.5):0;
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
  start(B){ B.k={rakeT:5,swoopT:9,stormT:99,strafeT:12,cullT:6,huntT:10,prey:null,hits:0}; },
  hit(B,m,p,v){ const pr=B.k.prey; if(pr&&p.id!==pr.id) m.hp-=v*0.25/monK(m,p).hp; },   // (the hunter is open to everyone but her prey)
  phase(B,m,n){
    if(n===2){ B.busy=1e3; B.mode=1; m.immune=true; m.act=null; clearTeleS(B); spawnAddsS(B,2); gryphFlightS(B,m); toastTo(null,'The Gryphon Queen beats her wings and rises into the sky!','bad'); }
    else { B.k.stormT=4; spawnAddsS(B,2); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    if(B.mode===1) return;   // in the air: the flight is a queue of steps
    k.rakeT-=dt; k.swoopT-=dt; k.strafeT-=dt; k.cullT-=dt; k.huntT-=dt; if(k.prey){ k.prey.t-=dt; k.prey.ring=(k.prey.ring||0)-dt; if(k.prey.t<=0) k.prey=null; else if(k.prey.ring<=0){ k.prey.ring=1; const pq=S.players.get(k.prey.id); if(pq&&!pq.dead) addTeleS(B,pq.x,pq.z,2.4,0.9,'swoop',0); } }   // (a ring on the prey every second, so everyone can see who is hunted)
    if(k.huntT<=0&&C.inside.length){ k.huntT=B.enraged?14:18; gryphHuntS(B,m,C.inside); } if(B.phase>=3) k.stormT-=dt;
    if(B.busy>0) return;
    if(k.cullT<=0){ k.cullT=4; gryphCullS(B,m,C.inside); }   // (a quick extra, it does not take the cast)
    if(k.strafeT<=0){ k.strafeT=B.enraged?16:21; gryphStrafeS(B,m); }
    else if(k.stormT<=0){ k.stormT=15; gryphStormS(B,m); }
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
    const heavy=i===0, e=addTeleS(B,x,z,heavy?4.2:2.9,1.6+i*0.12,'rockfall',Math.round(D*1.6)); e.hit=p=>{ pfxS(p,'slow',2); };
    if(heavy) e.done=()=>{ if(B.engaged&&!m.dead&&Math.hypot(m.x-x,m.z-z)<4.2+0.3) golemCrackS(B,m); }; }
}
// a quake: he stamps and everything near him shakes (stay out of the circle)
function golemQuakeS(B,m){ castS(B,m,2.3,2.3); addTeleS(B,m.x,m.z,11,2.2,'quake',Math.round(m.T.dmg*2.1)); ev('roar',m.id); }
// the stone shell: it soaks GOLEM_SHELL_SOAK of every blow (that share is healed straight back). Only his own boulders crack it: the one aimed at the nearest player
// is a heavy one (4.2 m), and if it lands with him inside its ring the shell loses 40%. Three cracks and it breaks: he is stunned 5 s and the shell grows back
const GOLEM_SHELL_SOAK=0.35;
function golemCrackS(B,m){
  const k=B.k; k.shell-=40; B.aux=Math.max(0,Math.round(k.shell));
  if(k.shell<=0){ k.shell=100; B.aux=100; B.stunT=5; m.act=null; toastTo(null,'The shell breaks! The Mountain Golem is stunned.','good'); ev('roar',m.id); }
  else toastTo(null,'His own boulder cracks the shell! ('+Math.ceil(k.shell/40)+' more)','good');
}
// the turning floor: for 5 s the old machinery under the cavern turns, carrying everyone round the hall (a shove every 0.5 s along the turn), while a gear arm sweeps round from the middle
// the same way, one slat of it every 0.8 s. Run with the floor, step between the slats
function golemGrindS(B,m){
  const A=B.A, D=m.T.dmg, a0=AR(0,TAU);
  castS(B,m,1.6,2.3); ev('roar',m.id); toastTo(null,'The floor starts to turn! Step between the gear\'s slats.','bad');
  for(let j=0;j<10;j++) laterS(B,0.8+j*0.5,()=>{ for(const q of playersInArena(A,0)){ const rx=q.x-A.x, rz=q.z-A.z, d=Math.hypot(rx,rz)||1; pfxS(q,'push',0,rz/d*6,-rx/d*6); } });
  for(let i=0;i<7;i++) laterS(B,0.8+i*0.8,()=>addTeleS(B,A.x,A.z,A.r+4,0.9,'line',Math.round(D*1.2),a0+i*0.5,1.5));
}
// a boulder rolls the length of the hall along the nearest player (a lane 6 m wide, no gap in it, 9 m/s after 1.6 s); from phase 2 a second one rolls along another player
function golemRollS(B,m,C){
  const A=B.A, picks=[C.p]; if(B.phase>=2&&C.inside.length>1) picks.push(randPlayerS(C.inside.filter(q=>q!==C.p)));
  castS(B,m,1.4,2.3);
  for(const q of picks){ const a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), wx=-uz, wz=ux, off=(q.x-A.x)*wx+(q.z-A.z)*wz;
    addWallS(B,A.x-ux*(A.r+4)+wx*off,A.z-uz*(A.r+4)+wz*off,a,9,3,0,0,Math.round(m.T.dmg*1.8),1.6); }
  toastTo(null,'The golem sends a boulder rolling down the hall! Leave its lane.','bad');
}
BOSS_KITS.golem={
  start(B){ B.k={fallT:4,quakeT:11,sweepT:99,shell:100,grindT:16,rollT:9,rubbleT:14}; B.aux=100; },
  hit(B,m,p,v){ const k=B.k; if(k.shell>0&&B.stunT<=0) m.hp+=v*GOLEM_SHELL_SOAK/monK(m,p).hp; },
  phase(B,m,n){ if(n===2) spawnAddsS(B,2,B.A.x,B.A.z,9); else { B.k.sweepT=5; spawnAddsS(B,3); } ev('roar',m.id); },
  tick(B,m,dt,C){
    const k=B.k;
    k.fallT-=dt; k.quakeT-=dt; k.grindT-=dt; k.rollT-=dt; k.rubbleT-=dt;
    // rubble that reaches him is taken into the shell (+15%): put it down on the way
    for(const a of B.adds) if(!a.dead&&!a.remove&&Math.hypot(a.x-m.x,a.z-m.z)<m.T.rad+1.5){ removeMonS(a); k.shell=Math.min(100,k.shell+15); B.aux=Math.round(k.shell); if(!k.mended){ k.mended=true; toastTo(null,'The rubble knits back into his shell! Stop it before it reaches him.','bad'); } }
    if(k.rubbleT<=0){ k.rubbleT=B.enraged?16:22; spawnAddsS(B,2,m.x,m.z,10); } if(B.phase>=3) k.sweepT-=dt;
    if(k.fallT<=0){ k.fallT=B.enraged?5:B.phase===2?7:8; golemRockfallS(B,m,C); }
    if(B.busy>0) return;
    if(k.grindT<=0){ k.grindT=B.enraged?18:24; golemGrindS(B,m); }
    else if(k.rollT<=0){ k.rollT=B.enraged?10:14; golemRollS(B,m,C); }
    else if(k.sweepT<=0){ k.sweepT=13; const a0=AR(0,TAU); castS(B,m,2.2,2.3); for(const d of [-8,0,8]) addTeleS(B,m.x+Math.cos(a0)*d,m.z-Math.sin(a0)*d,30,1.6,'line',Math.round(m.T.dmg*1.7),a0,2.2); toastTo(null,'The golem swings his arms: an avalanche!','bad'); }
    else if(k.quakeT<=0&&C.dp<14){ k.quakeT=B.enraged?8:11; golemQuakeS(B,m); }
  }
};
