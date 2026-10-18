//@ Boss move sets of the Hoarfrost Reach: Ymrik (icefall, ice prisons that spread, the decree, the frost lane, the closing whiteout, the frost nova) and Vetrmaw (gust and breath, flight and dives, the chill that only Warm Cores hold off, the lunge at a core, the blizzard)
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
  e.done=e2=>{ for(const o of playersInArena(B.A,0)) if(o!==q&&Math.hypot(o.x-e2.x,o.z-e2.z)<3.2) pfxS(o,'root',1.2); };   // the cold spreads to whoever huddles round the frozen
  toastTo(q.id,'Ice is closing round you: move!','bad');
}
// the decree: the king speaks and the hall obeys, for RIME_DECREE s. KNEEL: whoever moves more than 1.2 m from where they stood at the word is struck (once). RISE: whoever has moved less than
// 1.5 m since the last check, 0.8 s ago, is struck. The toast says which word it was
const RIME_DECREE=2.4;
function rimeDecreeS(B,m,inside){
  const k=B.k, kneel=Math.random()<0.5; k.decree={t:RIME_DECREE,kneel,pos:new Map(),hit:new Set(),poll:0.8,grace:0.5};
  for(const q of inside) k.decree.pos.set(q.id,[q.x,q.z]);
  B.mode=6; castS(B,m,RIME_DECREE+0.3,2.3); ev('roar',m.id);
  toastTo(null,kneel?'Ymrik decrees: KNEEL! Do not move.':'Ymrik decrees: RISE! Do not stand still.','bad');
}
function rimeDecreeTickS(B,m,dt){
  const d=B.k.decree; d.t-=dt; d.grace-=dt; d.poll-=dt;
  if(d.grace<=0){
    if(d.kneel){ for(const q of playersInArena(B.A,0)){ const o=d.pos.get(q.id); if(o&&!d.hit.has(q.id)&&Math.hypot(q.x-o[0],q.z-o[1])>1.2){ d.hit.add(q.id); hurtP(q,Math.round(m.T.dmg*1.3),m); pfxS(q,'slow',1.5); } } }
    else if(d.poll<=0){ d.poll=0.8; for(const q of playersInArena(B.A,0)){ const o=d.pos.get(q.id); d.pos.set(q.id,[q.x,q.z]); if(o&&Math.hypot(q.x-o[0],q.z-o[1])<1.5){ hurtP(q,Math.round(m.T.dmg*1.0),m); pfxS(q,'slow',1.5); } } } }
  if(d.t<=0){ B.k.decree=null; B.mode=0;
    if(B.enraged&&!d.second){ const ins=playersInArena(B.A,0); if(ins.length){ rimeDecreeS(B,m,ins); B.k.decree.kneel=!d.kneel; B.k.decree.second=true; toastTo(null,'...and then the opposite!','bad'); } } }   // (enraged, the word is followed at once by its opposite)
}
// the frost lane: a row of icicles across the hall with one gap of 5 m in it; go through the gap (or off the row)
function rimeLaneS(B,m){
  const A=B.A, a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), wx=-uz, wz=ux, off=AR(-6,6), gap=Math.floor(AR(0,8)); castS(B,m,1.2,1.0);
  for(let i=0;i<8;i++){ if(i===gap) continue; const s=(i-3.5)*4.4; addTeleS(B,A.x+wx*s+ux*off,A.z+wz*s+uz*off,2.6,1.7,'icefall',Math.round(m.T.dmg*0.9)); }
  toastTo(null,'A row of icicles: find the gap!','bad');
}
// phase 2: the whiteout, a blizzard that eats the hall from the walls in; the safe circle closes from 19 m to 9 m, and when the cold lets go Ymrik is spent for 4 s
function rimeWhiteoutS(B,m){
  const A=B.A, zn=addZoneS(B,'whiteout',A.x,A.z,19,24,0,9); B.mode=4;
  zn.done=()=>{ B.mode=0; if(!m.dead&&B.engaged){ B.stunT=4; m.act=null; toastTo(null,'Ymrik is spent from the cold! Strike now!','good'); } };
  toastTo(null,'A whiteout sweeps the hall! Stay inside the circle.','bad');
}
BOSS_KITS.rime={
  start(B){ B.k={fallT:5,prisonT:12,novaT:99,decreeT:15,laneT:9,decree:null}; },
  phase(B,m,n){
    if(n===2) rimeWhiteoutS(B,m);
    else { B.k.novaT=6; spawnAddsS(B,3); toastTo(null,'Ymrik roars: his thralls rise from the ice!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    if(k.decree) rimeDecreeTickS(B,m,dt);
    k.fallT-=dt; k.prisonT-=dt; k.decreeT-=dt; k.laneT-=dt; if(B.phase>=3) k.novaT-=dt;
    if(k.fallT<=0){ k.fallT=B.enraged?5.5:B.phase===2?8:6.5; rimeIcefallS(B,m,C.inside); }
    if(k.prisonT<=0){ k.prisonT=B.enraged?9:12; rimePrisonS(B,m,C.inside); }
    if(k.decreeT<=0&&B.busy<=0&&!k.decree&&B.mode!==4){ k.decreeT=B.enraged?16:21; rimeDecreeS(B,m,C.inside); }
    else if(k.laneT<=0&&B.busy<=0&&!k.decree){ k.laneT=B.enraged?12:16; rimeLaneS(B,m); }
    if(k.novaT<=0&&B.busy<=0){ k.novaT=10; castS(B,m,2.6,2.3); addTeleS(B,m.x,m.z,22,2.3,'donut',Math.round(m.T.dmg*1.9),0,7); ev('roar',m.id); }   // the frost nova: only the middle, next to him, is safe
  }
};

// ---- Vetrmaw, the Frost Wyrm (level 30): it wins by air and by cold ----
// a tail sweep round it; a gust that throws everyone back and is followed by a breath of frost along the ground
const wyrmColdestS=(B,ins)=>ins.reduce((a,b)=>(B.k.cold.get(a.id)||0)>=(B.k.cold.get(b.id)||0)?a:b);   // (the hero furthest gone in the cold: its breath finds the ones who strayed from the cores)
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
// the cold: every hero carries a chill (0-100). Further than 7 m from a live Warm Core it climbs 4% a second (6 in the blizzard), beside one it drains 20% a second; at 100 you are frozen (rooted 1.8 s,
// a bite of frost) and it starts again. The bar shows the coldest hero's chill. Two cores stand from the start
const WYRM_CORE_R=7;
const wyrmCoresS=B=>B.adds.filter(a=>a.def.id==='warmcore'&&!a.dead&&!a.remove);
function wyrmColdS(B,m,dt){
  const k=B.k, cores=wyrmCoresS(B); let top=0;
  for(const q of playersInArena(B.A,0)){
    let c=k.cold.get(q.id)||0;
    if(cores.some(a=>Math.hypot(a.x-q.x,a.z-q.z)<WYRM_CORE_R)) c=Math.max(0,c-20*dt); else c+=(B.mode===5?6:4)*dt;
    if(c>=60&&!k.warned.has(q.id)){ k.warned.add(q.id); toastTo(q.id,'You are freezing: get beside a Warm Core!','bad'); }
    if(c<30) k.warned.delete(q.id);
    if(c>=100){ c=0; pfxS(q,'root',1.8); hurtP(q,Math.round(m.T.dmg*0.6),m); toastTo(q.id,'You are frozen!','bad'); }
    k.cold.set(q.id,c); top=Math.max(top,c);
  }
  B.aux=Math.round(top);
}
// the wyrm lunges at the Warm Core nearest a hero (a ring warns 1.4 s), smashes it and drinks the warmth (+1.5% health); another grows 12 s later. Do not shelter where it will land
function wyrmLungeS(B,m,C){
  const cores=wyrmCoresS(B); if(!cores.length) return;
  const q=C.p, a=cores.reduce((x,y)=>Math.hypot(x.x-q.x,x.z-q.z)<Math.hypot(y.x-q.x,y.z-q.z)?x:y), cx=a.x, cz=a.z;
  castS(B,m,2.0,2.3); addTeleS(B,cx,cz,6.5,1.4,'slam',Math.round(m.T.dmg*1.8));
  laterS(B,0.3,()=>{ B.mode=B.mode||0; moveBossS(B,cx,cz,1.0); });
  laterS(B,1.4,()=>{ if(m.dead) return; if(!a.dead&&!a.remove){ removeMonS(a); m.hp=Math.min(m.maxHp,m.hp+m.maxHp*0.015); }
    laterS(B,12,()=>{ if(B.engaged&&!m.dead&&wyrmCoresS(B).length<3){ const [x,z]=inArenaS(B.A,cx,cz,B.A.r-3), pr=spawnMonS(B.bd.prop,x,z,{x,z},true); B.adds.push(pr); } }); });
  toastTo(null,'Vetrmaw lunges at a Warm Core!','bad');
}
BOSS_KITS.wyrm={
  start(B){ B.k={breathT:6,gustT:12,tailT:8,blizT:99,lungeT:18,cold:new Map(),warned:new Set()}; spawnPropsS(B,2,10,AR(0,TAU)); },
  phase(B,m,n){
    if(n===2){
      B.busy=1e3; B.mode=1; m.immune=true; m.act=null; clearTeleS(B); spawnAddsS(B,2); wyrmFlightS(B,m);
      toastTo(null,'Vetrmaw beats its wings and leaves the ground!','bad');
    } else { B.k.blizT=3; spawnAddsS(B,2); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k;
    wyrmColdS(B,m,dt);
    if(B.mode===1) return;   // in the air: the flight is a queue of steps
    k.lungeT-=dt; k.breathT-=dt; k.gustT-=dt; k.tailT-=dt; if(B.phase>=3) k.blizT-=dt;
    if(B.busy>0) return;
    if(k.lungeT<=0){ k.lungeT=B.enraged?14:19; wyrmLungeS(B,m,C); }
    else if(k.blizT<=0){ k.blizT=16; wyrmBlizzardS(B,m); }
    else if(k.gustT<=0){ k.gustT=B.enraged?11:14; wyrmGustS(B,m); }
    else if(k.breathT<=0){ k.breathT=B.enraged?6:8; wyrmBreathS(B,m,C.inside.length>1?wyrmColdestS(B,C.inside):C.p); }
    else if(k.tailT<=0&&C.dp<m.T.rad+6){ k.tailT=9; castS(B,m,1.7,2.3); addTeleS(B,m.x,m.z,m.T.rad+4.5,1.3,'slam',Math.round(m.T.dmg*1.3)); }
  }
};
