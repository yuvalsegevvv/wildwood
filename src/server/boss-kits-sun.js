//@ Boss move sets of the Sunscar: the Glass Guardian (shard lines, glassfall, the radiant ring, the mirror stance that throws your blows back, the prism wheel) and the Sand Wyrm (tail sweeps, the burrow, sand walls, the sandstorm, whelps)
/* See boss.js for the kit contract and boss-fx.js for the moves. The wyrm's death opens Redgate (combat.js). Numbers: a boss's hit is m.T.dmg. */

// ---- The Glass Guardian (level 32, on the black glass fields) ----
// shards: a fan of three glass lines thrown at the nearest player. The middle one (all three from phase 2) strikes the glass of the hall's rim and relays: 0.5 s later a second
// line leaves the point it hit, turned as a mirror turns it. Read the first line, then the bounce.
function glassRelayS(B,m,a,len){
  const A=B.A, R=A.r-1, ux=-Math.sin(a), uz=-Math.cos(a), ox=m.x-A.x, oz=m.z-A.z, bq=ox*ux+oz*uz, c=ox*ox+oz*oz-R*R, t=-bq+Math.sqrt(Math.max(0,bq*bq-c));   // where the line leaves the hall
  const px=m.x+ux*t, pz=m.z+uz*t, nx=(px-A.x)/R, nz=(pz-A.z)/R, dn=ux*nx+uz*nz, rx=ux-2*dn*nx, rz=uz-2*dn*nz;
  laterS(B,t/22+0.4,()=>{ if(B.engaged&&!m.dead) addTeleS(B,px,pz,len,1.2,'line',Math.round(m.T.dmg*1.3),Math.atan2(-rx,-rz),1.3); });   // (t/22: about when the player would have seen the first end)
}
// two black mirrors stand in the hall as prisms: a line that passes within 2.5 m of a living one splits there into two more, turned 0.6 radians either way. Break a prism (it falls
// to a few blows) to make the room simpler, or use one to throw a beam where you want it
function glassPrismsS(B,m){
  const A=B.A, a0=AR(0,TAU);
  for(let i=0;i<2;i++){ const a=a0+i*Math.PI, x=A.x+Math.sin(a)*10, z=A.z+Math.cos(a)*10, pr=spawnMonS(B.bd.totem,x,z,{x,z},true); B.adds.push(pr); B.k.prisms.push(pr); }
  toastTo(null,'Black mirrors rise in the hall: beams split on them.','bad');
}
function glassSplitS(B,m,a){
  const ux=-Math.sin(a), uz=-Math.cos(a);
  for(const pr of B.k.prisms){ if(pr.dead||pr.remove) continue;
    const dx=pr.x-m.x, dz=pr.z-m.z, al=dx*ux+dz*uz, off=Math.abs(-dx*uz+dz*ux);
    if(al>3&&al<26&&off<2.5) laterS(B,al/22+0.3,()=>{ if(!B.engaged||m.dead||pr.dead||pr.remove) return; for(const d of [-0.6,0.6]) addTeleS(B,pr.x,pr.z,20,1.2,'line',Math.round(m.T.dmg*1.2),a+d,1.3); }); }
}
function glassShardsS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.6,1.0);
  const a0=Math.atan2(-(p.x-m.x),-(p.z-m.z));
  for(const d of [-0.28,0,0.28]){ addTeleS(B,m.x,m.z,24,1.3,'line',Math.round(m.T.dmg*1.5),a0+d,1.4); if(d===0||B.phase>=2) glassRelayS(B,m,a0+d,22); glassSplitS(B,m,a0+d); }
}
// glassfall: panes drop where players stand and a little beside them
function glassFallS(B,m,C){
  const n=B.enraged?6:B.phase>=2?4:3;
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i<2?AR(0,1.2):AR(2,7);
    const [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r+1);
    const e=addTeleS(B,x,z,3.0,1.5+i*0.12,'rockfall',Math.round(m.T.dmg*1.5)); e.hit=p=>{ pfxS(p,'slow',1.6); }; }
}
// the mirror stance: for GLASS_STANCE s it stands still and every blow lands on the glass and is thrown back at whoever struck it (a quarter of its hit, three times a second at most
// from each player). Hold your attacks and step back: if nobody struck it the glass clouds over and it is stunned; if they did, the mirror shatters outward in a donut
const GLASS_STANCE=4.2, GLASS_BURST=0.07;
function glassStanceS(B,m){
  const k=B.k; k.stance=GLASS_STANCE; k.acc=0; k.stanceCd=B.enraged?9:12; k.stanceT=26; k.refl=0; k.rl=new Map(); B.mode=6; castS(B,m,GLASS_STANCE,2.3); ev('roar',m.id);
  toastTo(null,'The Glass Guardian turns to mirror! Blows are thrown back: hold your attacks.','bad');
}
function glassStanceEndS(B,m){
  const k=B.k; k.stance=0; B.mode=0;
  if(!k.refl){ B.stunT=3; m.act=null; toastTo(null,'Nothing to reflect: the glass clouds over. Strike now!','good'); }
  else { castS(B,m,1.2,2.3); addTeleS(B,m.x,m.z,16,1.2,'donut',Math.round(m.T.dmg*1.2),0,5); toastTo(null,'The mirror shatters outward! Get in close or get clear.','bad'); }
}
BOSS_KITS.glass={
  start(B){ B.k={shardT:4,fallT:7,ringT:11,wheelT:99,stanceT:26,stanceCd:8,acc:0,prisms:[],stance:0,refl:0,rl:new Map()}; },
  hit(B,m,p,v){   // (server/combat.js calls it for every blow that lands)
    const k=B.k; if(!(k.stance>0)){ k.acc+=v/monK(m,p).hp/m.maxHp; return; }   // (outside the stance the damage dealt is counted: GLASS_BURST of its health in one go raises the mirror)
    const t=k.rl.has(p.id)?k.rl.get(p.id):-9; if(S.t-t<0.33) return; k.rl.set(p.id,S.t); k.refl++; hurtP(p,Math.round(m.T.dmg*0.25),m);
  },
  phase(B,m,n){ if(n===2){ spawnAddsS(B,2); glassPrismsS(B,m); } else { B.k.wheelT=4; spawnAddsS(B,3); } ev('roar',m.id); },
  tick(B,m,dt,C){
    const k=B.k;
    if(k.stance>0){ k.stance-=dt; if(k.stance<=0) glassStanceEndS(B,m); }
    k.fallT-=dt; k.shardT-=dt; k.ringT-=dt; k.stanceT-=dt; k.stanceCd-=dt; if(B.phase>=3) k.wheelT-=dt;
    if(k.fallT<=0&&!(k.stance>0)){ k.fallT=B.enraged?5:7; glassFallS(B,m,C); }
    if(B.busy>0) return;
    if(k.stanceT<=0||(k.acc>=GLASS_BURST&&k.stanceCd<=0)) glassStanceS(B,m);   // (it also rises by itself if nobody has pressed it for 26 s)
    else if(k.wheelT<=0){ k.wheelT=14; const a0=AR(0,TAU); castS(B,m,2.4,2.3); for(let f=0;f<2;f++) laterS(B,f*1.2,()=>{ for(let i=0;i<6;i++) addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(m.T.dmg*1.6),a0+f*TAU/12+i*TAU/6,1.5); }); toastTo(null,'The prism throws a wheel of light! Stand between the beams.','bad'); }
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
// tremorsense: it coils on the sand (it can be hit) and listens for WYRM_LISTEN s: whoever stands still, less than 1.4 m from where they stood 0.6 s ago, has a strike land on that spot
// 0.9 s later (once every 1.5 s at most per player). Keep moving; it then surfaces under the nearest player
const WYRM_LISTEN=7;
function wyrmListenS(B,m,C){
  const k=B.k; k.listen=WYRM_LISTEN; k.struck=0; k.lPoll=0.6; k.lPos=new Map(); k.lCool=new Map(); B.mode=7; castS(B,m,WYRM_LISTEN+0.2,2.3); ev('roar',m.id);
  toastTo(null,'The Sand Wyrm listens to the dunes! Keep moving: anyone standing still is struck.','bad');
  laterS(B,3.6,()=>{ if(B.engaged&&!m.dead&&B.k.listen>0) wyrmWallS(B,m); });   // (and the dunes shift: a wave of sand to cross while you keep moving)
}
function wyrmListenTickS(B,m,dt){
  const k=B.k, D=m.T.dmg; k.listen-=dt; k.lPoll-=dt;
  if(k.lPoll<=0){ k.lPoll=0.6;
    for(const q of playersInArena(B.A,0)){
      const o=k.lPos.get(q.id); k.lPos.set(q.id,[q.x,q.z]);
      if(o&&Math.hypot(q.x-o[0],q.z-o[1])<1.4&&S.t-(k.lCool.get(q.id)||-9)>1.5){ k.lCool.set(q.id,S.t); k.struck=(k.struck||0)+1; addTeleS(B,q.x,q.z,3.2,0.9,'slam',Math.round(D*1.5)); }
    } }
  if(k.listen<=0){
    k.listen=0; B.mode=0;
    const ins=playersInArena(B.A,4);
    if(!k.struck){ B.stunT=4; m.act=null; B.busy=0; toastTo(null,'It heard nothing and lies stranded on the sand! Strike now!','good'); }   // everyone kept moving
    else if(ins.length){ const q=ins.reduce((a,b)=>Math.hypot(a.x-m.x,a.z-m.z)<Math.hypot(b.x-m.x,b.z-m.z)?a:b), [x,z]=inArenaS(B.A,q.x,q.z,B.A.r-2);
      addTeleS(B,x,z,6,1.3,'slam',Math.round(D*1.8)); moveBossS(B,x,z,1.1); castS(B,m,1.4,2.3); }
  }
}
// the sandslide: the dune round it gives way and everyone slides toward its maw for WYRM_SLIDE s (a pull every 0.4 s, a little under a run: only the ones who run are not dragged in); the maw snaps shut on whoever is still near it
const WYRM_SLIDE=4.4;
function wyrmSlideS(B,m){
  const k=B.k; k.slide=WYRM_SLIDE; k.slideP=0.4; B.mode=8; castS(B,m,WYRM_SLIDE+1.4,2.3); ev('roar',m.id);
  toastTo(null,'The dune gives way! Run from the Sand Wyrm\'s maw.','bad');
}
function wyrmSlideTickS(B,m,dt){
  const k=B.k; k.slide-=dt; k.slideP-=dt;
  if(k.slideP<=0){ k.slideP=0.4; for(const q of playersInArena(B.A,0)){ const dx=m.x-q.x, dz=m.z-q.z, d=Math.hypot(dx,dz)||1; if(d>2.5) pfxS(q,'push',0,dx/d*16,dz/d*16); } }
  if(k.slide<=0){ k.slide=0; B.mode=0; addTeleS(B,m.x,m.z,7.5,1.0,'slam',Math.round(m.T.dmg*2.2)); }
}
BOSS_KITS.sandwyrm={
  start(B){ B.k={sweepT:4,burrowT:99,wallT:99,stormT:99,listenT:14,listen:0,struck:0,slideT:99,slide:0}; },
  phase(B,m,n){
    if(n===2){ B.k.burrowT=5; B.k.wallT=11; B.k.slideT=9; spawnAddsS(B,2); }
    else { B.k.stormT=6; spawnAddsS(B,3); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    if(B.mode===2) return;   // under the sand: the burrow is a queue of steps
    if(k.listen>0){ wyrmListenTickS(B,m,dt); return; }
    if(k.slide>0) wyrmSlideTickS(B,m,dt);
    k.sweepT-=dt; k.burrowT-=dt; k.wallT-=dt; k.stormT-=dt; k.listenT-=dt; k.slideT-=dt;
    if(B.busy>0) return;
    if(k.slideT<=0&&B.mode!==4&&!(k.slide>0)){ k.slideT=B.enraged?17:22; wyrmSlideS(B,m); }
    else if(k.listenT<=0&&B.mode!==4){ k.listenT=B.enraged?16:20; wyrmListenS(B,m,C); }
    else if(k.stormT<=0&&B.mode!==4){ k.stormT=B.enraged?16:20; wyrmStormS(B,m); }
    else if(k.burrowT<=0){ k.burrowT=B.enraged?9:13; wyrmBurrowS(B,m,C); }
    else if(k.wallT<=0){ k.wallT=B.enraged?10:14; wyrmWallS(B,m); }
    else if(k.sweepT<=0&&C.dp<15){ k.sweepT=B.enraged?4:6; wyrmSweepS(B,m,C.p); }
  }
};
