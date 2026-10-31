//@ Boss move sets of the Emberwake Isles: Ocelo the Sun-Jaguar (pounces, rakes, obsidian volleys that leave embers, rolling sun-disc lanes, stalking from the shadows) and Tuila the Tide-Caller (flood waves, whirlpools, the ebb's undertow and crush)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg. Phase 2 starts at 60% and phase 3 (enraged) at 30% (boss.js). Data: shared/emberwake-bosses.js. Test: node tools/boss-smoke.js isles. */

// ---- Ocelo, the Sun-Jaguar (level 45, the Jaguar Court) ----
// the pounce: he picks the nearest player and drops on that spot 1.2 s later, flying there in the last 0.8 s; whoever it hits is slowed
function jagPounceS(B,m,p){
  const x=p.x, z=p.z; castS(B,m,2.0,1.0); B.mode=1;
  addTeleS(B,x,z,5,1.3,'slam',Math.round(m.T.dmg*1.9)).hit=q=>{ pfxS(q,'slow',1.5); };
  laterS(B,0.5,()=>{ if(!m.dead&&B.mode===1) moveBossS(B,x,z,0.8); });
  laterS(B,1.5,()=>{ if(B.mode===1) B.mode=0; });
}
// two rakes, the second swung the other way 0.7 s after the first: step out of the first and into the gap before the second
function jagRakeS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.8,1.0);
  const a=Math.atan2(-(p.x-m.x),-(p.z-m.z));
  addTeleS(B,m.x,m.z,12,1.0,'rake',Math.round(m.T.dmg*1.6),a-0.5,0.9);
  laterS(B,0.8,()=>{ if(!m.dead) addTeleS(B,m.x,m.z,12,0.9,'rake',Math.round(m.T.dmg*1.6),a+0.5,0.9); });
}
// obsidian volley: shards come down on n players (the first on the nearest) and each leaves an ember pool where it landed
function jagVolleyS(B,m,C){
  const n=B.enraged?4:B.phase>=2?3:2;
  castS(B,m,1.4,1.0);
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i?AR(2,6):0, [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r-2);
    addTeleS(B,x,z,3.4,1.3+i*0.2,'geyser',Math.round(m.T.dmg*1.2)).done=e=>{ if(B.engaged&&!m.dead&&B.zones.length<10) addZoneS(B,'ember',e.x,e.z,2.6,6); }; }
}
// the sun-disc: a stone disc rolls across the court in 5 m wide lanes, one a 0.9 s after the other, each through a player's line, at a new angle every time
function jagDiscS(B,m,C){
  const A=B.A, R=A.r, n=B.enraged?4:3;
  castS(B,m,1.6,1.0);
  for(let i=0;i<n;i++) laterS(B,i*0.9,()=>{ if(m.dead) return; const q=i===0?C.p:randPlayerS(C.inside)||C.p, a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), px=uz, pz=-ux, off=(q.x-A.x)*px+(q.z-A.z)*pz;
    addTeleS(B,A.x+px*off-ux*R,A.z+pz*off-uz*R,2*R,1.1,'line',Math.round(m.T.dmg*1.5),a,2.5); });
  toastTo(null,'The sun-disc rolls! Watch the lanes.','bad');
}
// stalking (phase 2 on): he vanishes into the court's shadows (hidden, immune) and comes up under a player, then another, then another
function jagStalkS(B,m,C){
  const n=B.enraged?4:3;
  B.mode=2; m.immune=true; B.busy=1e3; clearTeleS(B); ev('mact',m.id,2.3);
  for(let i=0;i<n;i++) laterS(B,1.0+i*1.6,()=>{ if(m.dead) return; const q=i===0?C.p:randPlayerS(C.inside)||C.p, [x,z]=inArenaS(B.A,q.x,q.z,B.A.r-2);
    moveBossS(B,x,z,0.5); addTeleS(B,x,z,5.5,0.9,'slam',Math.round(m.T.dmg*1.7)).hit=p=>{ pfxS(p,'slow',1.2); }; });
  laterS(B,1.0+n*1.6+0.6,()=>{ if(m.dead) return; B.mode=0; m.immune=false; B.busy=0; B.mv=null; m.act=null; spawnAddsS(B,1); ev('roar',m.id); });
  toastTo(null,'Ocelo melts into the shadows!','bad');
}
BOSS_KITS.jaguar={
  start(B){ B.k={pounceT:5,rakeT:3,volleyT:8,discT:12,stalkT:99}; },
  phase(B,m,n){ if(n===2){ B.k.stalkT=4; spawnAddsS(B,2); } else { B.k.discT=3; B.k.stalkT=Math.min(B.k.stalkT,8); spawnAddsS(B,3); } ev('roar',m.id); },
  tick(B,m,dt,C){
    const k=B.k; k.pounceT-=dt; k.rakeT-=dt; k.volleyT-=dt; k.discT-=dt; k.stalkT-=dt;
    if(B.busy>0||B.mode===1||B.mode===2) return;
    if(k.stalkT<=0&&C.inside.length){ k.stalkT=B.enraged?22:30; jagStalkS(B,m,C); }
    else if(k.discT<=0){ k.discT=B.enraged?10:15; jagDiscS(B,m,C); }
    else if(k.pounceT<=0){ k.pounceT=B.enraged?8:12; jagPounceS(B,m,C.p); }
    else if(k.volleyT<=0){ k.volleyT=B.enraged?7:10; jagVolleyS(B,m,C); }
    else if(k.rakeT<=0&&C.dp<14){ k.rakeT=B.enraged?4.5:6.5; jagRakeS(B,m,C.p); }
  }
};

// ---- Tuila, the Tide-Caller (level 46, the strait's tidepool) ----
// the flood: waves roll across the strait one after the other, from a new side each time, each with a gap in it
function tuilaFloodS(B,m){
  const A=B.A, n=B.enraged?3:2, a0=AR(0,TAU), hw=A.r;
  castS(B,m,2.0,2.3);
  for(let i=0;i<n;i++) laterS(B,i*2.6,()=>{ if(m.dead) return; const a=a0+i*Math.PI*0.6, ux=-Math.sin(a), uz=-Math.cos(a);
    addWallS(B,A.x-ux*(A.r+4),A.z-uz*(A.r+4),a,9,hw,AR(-hw*0.5,hw*0.5),3.6,Math.round(m.T.dmg*1.6),1.4); });
  toastTo(null,'The tide floods the strait! Find the gap in each wave.','bad');
}
// whirlpools: they open under the nearest player and the one farthest from her (more when enraged); the client drags you toward the middle of each
function tuilaWhirlS(B,m,C){
  castS(B,m,1.6,1.0);
  const set=[C.p, farPlayerS(m,C.inside)||C.p]; if(B.enraged) set.push(randPlayerS(C.inside)||C.p);
  for(const q of set){ const [x,z]=inArenaS(B.A,q.x,q.z,B.A.r-3); if(B.zones.length<8) addZoneS(B,'whirl',x,z,4.5,9); }
}
// the ebb: for TUILA_EBB s the water is drawn back toward her and drags everyone in the arena with it; at the end the sea falls back on the spot where she stands: a ring of 8 m. Run against the pull
const TUILA_EBB=3.6;
function tuilaEbbS(B,m){
  castS(B,m,TUILA_EBB+0.4,2.3); B.mode=6; ev('roar',m.id); B.k.pull=0;
  addTeleS(B,m.x,m.z,8.5,TUILA_EBB,'quake',Math.round(m.T.dmg*2.3));
  laterS(B,TUILA_EBB+0.2,()=>{ if(B.mode===6) B.mode=0; });
  toastTo(null,'The water is drawn back! Run from the middle.','bad');
}
function tuilaPullS(B,m,dt){
  const k=B.k; k.pull-=dt; if(k.pull>0) return; k.pull=0.3;
  for(const p of S.players.values()){ if(p.dead) continue; const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz); if(d<B.A.r+4&&d>2) pfxS(p,'push',0,dx/d*8,dz/d*8); }
}
BOSS_KITS.tidecaller={
  start(B){ B.k={floodT:6,whirlT:9,ebbT:14,spiritT:99,pull:0}; },
  phase(B,m,n){ if(n===2){ B.k.spiritT=3; B.k.ebbT=Math.min(B.k.ebbT,6); spawnAddsS(B,2); } else { B.k.whirlT=3; spawnAddsS(B,3); } ev('roar',m.id); },
  tick(B,m,dt,C){
    const k=B.k; k.floodT-=dt; k.whirlT-=dt; k.ebbT-=dt; k.spiritT-=dt;
    if(B.mode===6) tuilaPullS(B,m,dt);
    if(B.busy>0) return;
    if(k.spiritT<=0){ k.spiritT=B.enraged?14:20; spawnAddsS(B,B.enraged?3:2); }
    else if(k.ebbT<=0&&C.inside.length){ k.ebbT=B.enraged?16:24; tuilaEbbS(B,m); }
    else if(k.floodT<=0){ k.floodT=B.enraged?11:15; tuilaFloodS(B,m); }
    else if(k.whirlT<=0){ k.whirlT=B.enraged?10:14; tuilaWhirlS(B,m,C); }
  }
};
