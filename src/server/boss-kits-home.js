//@ Boss move sets of the home forest: the Rootwarden (root spikes, ground slam, the totem shield, and the four seasons of the grove) and Carapax, the Tide King (geyser trails, tidal waves with an undertow, the molt, the claw clamp, burrow strikes, the hunting whirlpool)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg; a multiplier is how many hits a move is worth. */

// ---- The Rootwarden (level 15): spikes burst under players, a slam around it, and at 60% it shields itself behind three totems (break them to stun it) ----
function startShieldS(B){
  const m=B.m, A=B.A; m.immune=true; B.mode=3; B.aux=3; B.totems=[];
  for(let i=0;i<3;i++){ const a=m.face+i/3*TAU+0.5, x=A.x+Math.sin(a)*12, z=A.z+Math.cos(a)*12; B.totems.push(spawnMonS(B.bd.totem,x,z,{x,z},true)); }
  toastTo(null,B.bd.short+' shields itself! Break the '+B.bd.totems+'.','bad'); ev('roar',m.id);
}
// the seasons of the grove: every ROOTS_SEASON s the Warden turns to the next one and the forest around it changes what it throws at you
//   spring (mode 6): a thornling sprouts every 6 s (at most 3 at once)   summer (7): the sun scorches the ground under two players
//   autumn (8): leaves fall like blades all over the grove               winter (9): the bark is frozen, blows glance off (a third of each is healed back) and the cold slows everyone now and then
const ROOTS_SEASON=15, ROOTS_NAMES=['Spring: thornlings sprout!','Summer: the ground scorches!','Autumn: leaves fall like blades!','Winter: the bark is frozen, blows glance off!'];
function rootsSeasonS(B,m,C,dt){
  const k=B.k; if(m.immune) return;   // (the seasons wait while the totems shield it)
  k.seasonT-=dt; k.sT-=dt;
  if(k.seasonT<=0){ k.seasonT=ROOTS_SEASON; k.season=(k.season+1)%4; k.sT=2; toastTo(null,ROOTS_NAMES[k.season],'bad'); ev('roar',m.id);
    castS(B,m,1.5,2.3); addTeleS(B,m.x,m.z,20,1.6,'donut',Math.round(m.T.dmg*1.0),0,6); }   // the turn of the season: a ring of cold wind, safe only at his feet
  B.mode=6+k.season;
  if(k.bloom&&k.bloom.dead&&!k.bloom.cut){ k.bloom.cut=true; B.stunT=Math.max(B.stunT,2.5); m.act=null; toastTo(null,'The bloom is cut down: the Warden reels! Strike now!','good'); }
  if(k.sT>0) return;
  const D=m.T.dmg;
  if(k.bloom&&k.season!==0){   // the bloom of spring is over: if it still stands, the Warden drinks it (a twentieth of his health)
    if(!k.bloom.dead&&!k.bloom.remove){ removeMonS(k.bloom); m.hp=Math.min(m.maxHp,m.hp+m.maxHp*0.05); toastTo(null,'The Warden drinks the bloom and mends!','bad'); }
    k.bloom=null; }
  if(k.season===0){ k.sT=6; if(!k.bloom){ const [x,z]=arenaPtS(B.A,B.A.r-6); k.bloom=spawnMonS(B.bd.totem,x,z,{x,z},true); B.adds.push(k.bloom); toastTo(null,'A heartwood bloom opens: cut it down before spring ends!','bad'); } if(B.adds.filter(a=>!a.dead&&!a.remove).length<3) spawnAddsS(B,1,m.x,m.z,6); }
  else if(k.season===1){ k.sT=5; for(let i=0;i<2;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), z1=addZoneS(B,'ember',q.x,q.z,3,5);   // the wildfire: when a pool burns out, a smaller one catches 4 m away
      z1.done=zn=>{ if(B.engaged&&!m.dead&&B.mode===7) addZoneS(B,'ember',zn.x+Math.sin(a)*4,zn.z+Math.cos(a)*4,2.4,4); }; } }
  else if(k.season===2){ k.sT=3.5; if(!k.gale||S.t-k.gale>9){ k.gale=S.t; const a=AR(0,TAU); toastTo(null,'A gale rises from the trees!','bad'); for(let j=0;j<6;j++) laterS(B,j*0.4,()=>{ for(const q of playersInArena(B.A,0)) pfxS(q,'push',0,-Math.sin(a)*5,-Math.cos(a)*5); }); }   // (the gale shoves everyone one way for 2.4 s)
     for(let i=0;i<5;i++){ const q=i===0?C.p:null, [x,z]=q?[q.x,q.z]:arenaPtS(B.A,B.A.r-2); addTeleS(B,x,z,2.4,1.4+i*0.1,'icefall',Math.round(D*0.7)); } }
  else { k.sT=4; for(const q of C.inside) pfxS(q,'slow',1.5); }
}
BOSS_KITS.roots={
  start(B){ B.k={rootT:4,slamT:10,season:0,seasonT:ROOTS_SEASON,sT:3,gale:0,bloom:null}; },
  hit(B,m,p,v){ if(B.k.season===3&&!m.immune&&B.mode===9) m.hp+=v*0.33/monK(m,p).hp; },
  phase(B,m,n){ if(n===2) startShieldS(B); else spawnAddsS(B,2); },
  tick(B,m,dt,C){
    const {p,inside,dp}=C, k=B.k;
    if(m.immune){
      B.totems=B.totems.filter(x=>!x.dead&&!x.remove); B.aux=B.totems.length;
      if(!B.totems.length){ m.immune=false; B.mode=0; B.stunT=5; m.act=null; clearTeleS(B); toastTo(null,'The shield shatters! '+B.bd.short+' is stunned.','good'); return; }
      m.hp=Math.min(m.maxHp*0.6,m.hp+m.maxHp*0.004*dt);
    }
    rootsSeasonS(B,m,C,dt);
    k.rootT-=dt;
    if(k.rootT<=0){ k.rootT=B.enraged?4.5:(B.phase===2?6:7.5); const n=B.enraged?5:3;
      for(let i=0;i<n;i++){ const q=i===0?p:inside[Math.floor(Math.random()*inside.length)], a=AR(0,TAU), r=i===0?0:AR(3,6.5); addTeleS(B,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,2.4,1.6,'root',Math.round(m.T.dmg*1.5)); } }
    k.slamT-=dt;
    if(k.slamT<=0 && dp<15 && B.busy<=0 && !m.immune){ k.slamT=B.enraged?9:12.5; castS(B,m,2.3,2.3); addTeleS(B,m.x,m.z,9,2.2,'slam',Math.round(m.T.dmg*2.2)); ev('roar',m.id); }
  }
};

// ---- Carapax, the Tide King (level 20, the beach): the sea fights for it ----
// geysers erupt one after the other along a line from the boss to a player, so standing still (or running straight away) is what gets you hit
function tideGeysersS(B,m,C){
  const A=B.A, D=m.T.dmg, x=m.x, z=m.z, targets=[C.p];
  if(B.phase>=2&&C.inside.length>1) targets.push(randPlayerS(C.inside.filter(q=>q!==C.p)));
  castS(B,m,1.0,1.0);
  for(const q of targets){ const a=Math.atan2(-(q.x-x),-(q.z-z));
    for(let i=0;i<6;i++) laterS(B,i*0.26,()=>{ const gx=x-Math.sin(a)*(3+i*3.4), gz=z-Math.cos(a)*(3+i*3.4); if(Math.hypot(gx-A.x,gz-A.z)<A.r+2) addTeleS(B,gx,gz,2.6,1.1,'geyser',Math.round(D)); }); }
}
// a wave from the sea: it rolls across the beach and only the gap in it is safe (the wall telegraphs itself: it stands at the water's edge for a moment first)
function tideWaveS(B,m){
  const A=B.A, a=AR(-0.55,0.55), ox=A.x+Math.sin(a)*26, oz=A.z+Math.cos(a)*26;
  castS(B,m,2.0,1.0);
  const hatch=B.adds.filter(q=>!q.dead&&!q.remove).length;   // every living hatchling calls the tide: the wave runs 0.8 m/s faster and hits 10% harder
  addWallS(B,ox,oz,a,(B.enraged?11:9.5)+0.8*hatch,30,AR(-10,10),3.8,Math.round(m.T.dmg*1.5*(1+0.1*hatch)),2.4);
  if(hatch>=2) toastTo(null,'The hatchlings call the tide: the wave comes faster!','bad');
  for(let j=0;j<5;j++) laterS(B,0.2+j*0.4,()=>{ for(const q of playersInArena(A,0)){ const dx=ox-q.x, dz=oz-q.z, d=Math.hypot(dx,dz)||1; pfxS(q,'push',0,dx/d*10,dz/d*10); } });   // the undertow: the sea draws everyone toward the wave before it breaks
  if(!B.k.warned){ B.k.warned=true; toastTo(null,'A great wave rises out of the sea! Find the gap in it.','bad'); }
}
// it goes under the sand and comes up beneath a player (twice, three times enraged), leaving hatchlings, then sits stuck for a moment
function tideBurrowS(B,m){
  const A=B.A, D=m.T.dmg, n=B.enraged?3:2, gap=2.4;
  castS(B,m,(n-1)*gap+1.65,0);
  for(let i=0;i<n;i++) laterS(B,i*gap,()=>{
    const ins=playersInArena(A,4); if(!ins.length) return;
    const q=randPlayerS(ins), [x,z]=inArenaS(A,q.x,q.z,A.r-3);
    B.mode=2; m.immune=true; B.mv=null;
    addTeleS(B,x,z,4.6,1.5,'slam',Math.round(D*1.8));
    moveBossS(B,x,z,1.4);
    laterS(B,1.5,()=>{ B.mode=0; m.immune=false; spawnAddsS(B,1,x,z,2.5); ev('roar',m.id); });
  });
  laterS(B,(n-1)*gap+1.55,()=>{ B.stunT=2.5; m.act=null; toastTo(null,'Carapax is stuck in the sand! Hit it now!','good'); });
}
// the molt: at 75%, 50% and 25% of its health it sheds its shell (rocks rain round it) and for CARAPAX_SOFT s is soft: it takes 40% more from every blow, and its geysers and waves come 60% quicker
const CARAPAX_SOFT=7;
function tideMoltS(B,m){
  const k=B.k; k.soft=CARAPAX_SOFT; B.mode=6; castS(B,m,1.6,2.3); ev('roar',m.id);
  for(let i=0;i<6;i++){ const a=i/6*TAU+AR(0,1), r=AR(5,10); addTeleS(B,m.x+Math.sin(a)*r,m.z+Math.cos(a)*r,2.8,1.2+i*0.12,'rockfall',Math.round(m.T.dmg*0.9)); }
  spawnAddsS(B,2); toastTo(null,'Carapax molts! Its shell is soft and hatchlings crawl out of it.','good');
}
// the claw: it clamps the nearest player in its pincer (rooted, a ring on them for 2.6 s) and bites down for 2.4 hits unless the claw is pried open: 3.5% of its health in blows from anyone
const CARAPAX_PRY=0.035;
function tideClampS(B,m,C){
  const k=B.k, q=C.p; faceS(m,q.x,q.z); castS(B,m,1.2,1.0);
  const e=addTeleS(B,q.x,q.z,2.2,2.6,'prison',Math.round(m.T.dmg*2.4),0,q.id); e.hit=p=>{ pfxS(p,'root',0.6); };
  pfxS(q,'root',2.6); k.clamp={e,acc:0}; e.done=()=>{ k.clamp=null; };
  toastTo(null,'Carapax clamps '+q.name+' in its claw! Pry it open.','bad');
}
BOSS_KITS.tide={
  start(B){ B.k={waveT:6,geyT:9,burrowT:99,whirlT:99,clampT:13,soft:0,molts:0,clamp:null}; },
  hit(B,m,p,v){   // (server/combat.js calls it for every blow that lands)
    const k=B.k; if(k.soft>0) m.hp-=v*0.4/monK(m,p).hp;
    if(k.clamp){ k.clamp.acc+=v/monK(m,p).hp/m.maxHp; if(k.clamp.acc>=CARAPAX_PRY){ dgBossCancelTeleS(B,k.clamp.e); k.clamp=null; pfxS(p,'root',0.01); for(const q of playersInArena(B.A,0)) pfxS(q,'root',0.01); B.stunT=Math.max(B.stunT,1.5); m.act=null; toastTo(null,'The claw is pried open! Carapax reels.','good'); } }
  },
  phase(B,m,n){
    if(n===2){ B.k.burrowT=5; toastTo(null,'Carapax digs into the sand!','bad'); }
    else { B.k.whirlT=4; toastTo(null,'The tide turns! Carapax calls up a whirlpool!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, f=m.hp/m.maxHp;
    if(k.molts<3&&f<0.75-k.molts*0.25){ k.molts++; tideMoltS(B,m); }
    if(k.soft>0){ k.soft-=dt; if(k.soft<=0&&B.mode===6) B.mode=0; }
    const sp=k.soft>0?1.6:1;
    k.waveT-=dt*sp; k.geyT-=dt*sp; k.clampT-=dt; if(B.phase>=2) k.burrowT-=dt; if(B.phase>=3) k.whirlT-=dt;
    if(B.busy>0||B.mv) return;
    if(k.clampT<=0&&!k.clamp){ k.clampT=B.enraged?14:19; tideClampS(B,m,C); }
    else if(k.burrowT<=0){ k.burrowT=B.enraged?11:14; tideBurrowS(B,m); }
    else if(k.whirlT<=0){ k.whirlT=17; castS(B,m,1.2,2.3); ev('roar',m.id);   // the whirlpool hunts: one every 2 s where the player nearest to it stands, four in a row
      for(let i=0;i<4;i++) laterS(B,i*2,()=>{ const ins=playersInArena(B.A,4); if(!ins.length||m.dead) return; const q=ins.reduce((a,b)=>Math.hypot(a.x-m.x,a.z-m.z)<Math.hypot(b.x-m.x,b.z-m.z)?a:b); addZoneS(B,'whirl',q.x,q.z,6,3.5); }); toastTo(null,'The whirlpool hunts you!','bad'); }
    else if(k.waveT<=0){ k.waveT=B.enraged?8:B.phase===2?9.5:11; tideWaveS(B,m); }
    else if(k.geyT<=0){ k.geyT=B.enraged?7:9; tideGeysersS(B,m,C); }
  }
};
