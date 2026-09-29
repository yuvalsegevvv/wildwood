//@ Boss move sets of the Hoarfrost Reach: Ymrik (icefall, ice prisons, the closing whiteout, the frost nova) and Vetrmaw (gust and breath, flight and dives, the blizzard with its warm cores)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg; a multiplier is how many hits a move is worth. */

// ---- Ymrik, the Rimeking (level 26): the cold itself is his weapon ----
// icicles fall all over the hall (the first two under players, the rest at random)
function rimeIcefallS(B,m,inside){
  const A=B.A, D=m.T.dmg, n=B.enraged?9:7;
  for(let i=0;i<n;i++){
    let x,z;
    if(i<Math.min(2,inside.length)){ const q=inside[(i+Math.floor(Math.random()*inside.length))%inside.length]; x=q.x+AR(-1.5,1.5); z=q.z+AR(-1.5,1.5); } else [x,z]=arenaPtS(A,A.r-1);
    [x,z]=inArenaS(A,x,z,A.r+2);
    addTeleS(B,x,z,2.7,1.5+i*0.1,'icefall',Math.round(D*0.9));
  }
}
// ice closes round one player and holds them still for 2.4 s (a ring follows them for 1.7 s first)
function rimePrisonS(B,m,inside){
  const q=randPlayerS(inside), e=addTeleS(B,q.x,q.z,2.1,1.7,'prison',Math.round(m.T.dmg*0.6),0,q.id);
  e.hit=p=>{ pfxS(p,'root',2.4); };
  toastTo(q.id,'Ice is closing round you: move!','bad');
}
// phase 2: the whiteout, a blizzard that eats the hall from the walls in; the safe circle closes from 19 m to 9 m, and when the cold lets go Ymrik is spent for 4 s
function rimeWhiteoutS(B,m){
  const A=B.A, zn=addZoneS(B,'whiteout',A.x,A.z,19,24,0,9); B.mode=4;
  zn.done=()=>{ B.mode=0; if(!m.dead&&B.engaged){ B.stunT=4; m.act=null; toastTo(null,'Ymrik is spent from the cold! Strike now!','good'); } };
  toastTo(null,'A whiteout sweeps the hall! Stay inside the circle.','bad');
}
BOSS_KITS.rime={
  start(B){ B.k={fallT:5,prisonT:12,novaT:99}; },
  phase(B,m,n){
    if(n===2) rimeWhiteoutS(B,m);
    else { B.k.novaT=6; spawnAddsS(B,3); toastTo(null,'Ymrik roars: his thralls rise from the ice!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    k.fallT-=dt; k.prisonT-=dt; if(B.phase>=3) k.novaT-=dt;
    if(k.fallT<=0){ k.fallT=B.enraged?5.5:B.phase===2?8:6.5; rimeIcefallS(B,m,C.inside); }
    if(k.prisonT<=0){ k.prisonT=B.enraged?9:12; rimePrisonS(B,m,C.inside); }
    if(k.novaT<=0&&B.busy<=0){ k.novaT=10; castS(B,m,2.6,2.3); addTeleS(B,m.x,m.z,22,2.3,'donut',Math.round(m.T.dmg*1.9),0,7); ev('roar',m.id); }   // the frost nova: only the middle, next to him, is safe
  }
};

// ---- Vetrmaw, the Frost Wyrm (level 30): it wins by air and by cold ----
// a tail sweep round it; a gust that throws everyone back and is followed by a breath of frost along the ground
function wyrmBreathS(B,m,p){
  const D=m.T.dmg, x=m.x, z=m.z, a=Math.atan2(-(p.x-x),-(p.z-z)), n=B.enraged?3:1;
  faceS(m,p.x,p.z); castS(B,m,1.5+n*0.7,1.0);
  for(let j=0;j<n;j++) laterS(B,j*0.7,()=>addTeleS(B,x,z,28,1.6,'breath',Math.round(D*2),a+(j-(n-1)/2)*0.55,0.42));
}
function wyrmGustS(B,m){
  castS(B,m,1.5,2.3);
  const e=addTeleS(B,m.x,m.z,15,1.3,'gust',Math.round(m.T.dmg*0.5));
  e.hit=q=>{ const dx=q.x-m.x, dz=q.z-m.z, d=Math.hypot(dx,dz)||1; pfxS(q,'push',0,dx/d*20,dz/d*20); };
  laterS(B,1.45,()=>{ const ins=playersInArena(B.A,6); if(ins.length&&!m.dead) wyrmBreathS(B,m,farPlayerS(m,ins)); });
}
// phase 2: it takes off (immune) and dives at players from the far side of the hall, three times, with wyrmlings on the ground; then it crashes and lies stunned for 6 s
function wyrmFlightS(B,m){
  const A=B.A, D=m.T.dmg, N=3, step=4.2;
  for(let i=0;i<N;i++) laterS(B,1.2+i*step,()=>{
    const ins=playersInArena(A,4); if(!ins.length) return;
    const q=randPlayerS(ins); let ux=q.x-A.x, uz=q.z-A.z; const ul=Math.hypot(ux,uz);
    if(ul<2){ const a=AR(0,TAU); ux=Math.sin(a); uz=Math.cos(a); } else { ux/=ul; uz/=ul; }
    const sx=A.x-ux*16, sz=A.z-uz*16;   // the far side of the hall from the target
    moveBossS(B,sx,sz,0.9);
    laterS(B,0.9,()=>{
      const t2=playersInArena(A,4), tg=t2.includes(q)?q:(t2[0]||q), a=Math.atan2(-(tg.x-sx),-(tg.z-sz));
      faceS(m,tg.x,tg.z); addTeleS(B,sx,sz,36,1.3,'line',Math.round(D*2.2),a,2.4);
      laterS(B,1.3,()=>{ moveBossS(B,sx-Math.sin(a)*34,sz-Math.cos(a)*34,0.4); ev('mact',m.id,1.0); });
    });
  });
  laterS(B,1.2+N*step,()=>{
    B.mode=0; m.immune=false; B.busy=0; B.mv=null; B.stunT=6; m.act=null;
    addTeleS(B,m.x,m.z,7,0.9,'slam',Math.round(D*1.4)); ev('roar',m.id);
    toastTo(null,'Vetrmaw crashes to the ground! Strike now!','good');
  });
}
// phase 3: a blizzard every 16 s that hurts anyone not standing next to a warm core (the cores can be broken, and come back with the next blizzard)
function wyrmBlizzardS(B,m){
  const A=B.A, alive=B.adds.filter(a=>a.def.id==='warmcore'&&!a.dead&&!a.remove).length;
  if(alive<3) spawnPropsS(B,3-alive,11,AR(0,TAU));
  const zn=addZoneS(B,'blizzard',A.x,A.z,A.r+8,9.5,2.5,0); B.mode=5;
  zn.done=()=>{ if(B.mode===5) B.mode=0; };
  toastTo(null,'A blizzard is rolling in! Shelter next to a Warm Core.','bad');
}
BOSS_KITS.wyrm={
  start(B){ B.k={breathT:6,gustT:12,tailT:8,blizT:99}; },
  phase(B,m,n){
    if(n===2){
      B.busy=1e3; B.mode=1; m.immune=true; m.act=null; clearTeleS(B); spawnAddsS(B,2); wyrmFlightS(B,m);
      toastTo(null,'Vetrmaw beats its wings and leaves the ground!','bad');
    } else { B.k.blizT=3; spawnAddsS(B,2); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    if(B.mode===1) return;   // in the air: the flight is a queue of steps
    k.breathT-=dt; k.gustT-=dt; k.tailT-=dt; if(B.phase>=3) k.blizT-=dt;
    if(B.busy>0) return;
    if(k.blizT<=0){ k.blizT=16; wyrmBlizzardS(B,m); }
    else if(k.gustT<=0){ k.gustT=B.enraged?11:14; wyrmGustS(B,m); }
    else if(k.breathT<=0){ k.breathT=B.enraged?6:8; wyrmBreathS(B,m,C.p); }
    else if(k.tailT<=0&&C.dp<m.T.rad+6){ k.tailT=9; castS(B,m,1.7,2.3); addTeleS(B,m.x,m.z,m.T.rad+4.5,1.3,'slam',Math.round(m.T.dmg*1.3)); }
  }
};
