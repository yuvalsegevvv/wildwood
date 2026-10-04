// Headless test of the four dungeon bosses (Amanita, Gawataro, Haugbui: server/dungeons/boss-kits.js, Garrick: server/dungeons/boss-kits-mine.js, on the primitives of server/boss-fx.js and server/dungeons/boss-fx.js),
// straight from src/, no build. Each boss is made with makeBossS in a real dungeon hall (a theme's layout baked and placed at a spot of the world, its pillars as A.solid) and fought
// through its three phases by two players that cannot die; the test records what it does and checks that every move of its DG_BOSSES entry happens, that it has moves none of the
// other bosses has (the world bosses are fought too), its signature mechanics (puffballs killed in time cancel their burst; a pillar shelters you from the pulse; hits from behind
// spill Gawataro's dish and stun him; his charge stops at a pillar; Haugbui's lamps go dark, are relit by a channel, shelter you from the wail, and two relit end the blackout; Garrick's powder kegs: one popped beside him hurts and stuns him and sets off its neighbours, one left alone burns down and spares him), that
// nothing is left behind when a fight resets or the boss dies, and that its models (and its adds' and props') build on the client's model code. One line per check.
// Usage: node tools/dungeon-boss-smoke.js
global.THREE=require('three');
const fs=require('fs'), path=require('path'), {loadServer,SRC,strip}=require('./load');
const evs=[];   // the events of the snapshots sent to player a (every player in the world is sent the same events: one copy)
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...JSON.parse(JSON.stringify(m.ev))); }},
  ['MONS','BOSSES','BOSS_KITS','DG_BOSS_DEFS','DG_BOSSES','DG_BOSS_NEEDS','DG_HALL_PILLARS','DG_HALL_MOUTHS','DG_HALL_LAMPS','dgVentAt','dgHallArena','dgLayout','dgBake','makeBossS','resetBossS',
   'getH','S','damageMonsterS','arenaDist','vDist','VR','defAt','ZONE_HIT','DG_THRALL_MAX']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.maxHp=1e7; p.hp=1e7; p.dead=false; } } };   // (a player who dies would reset the fight)
W.join('a',{name:'Tanker',look:{cls:'warrior'},save:{level:30}}); W.join('b',{name:'Runner',look:{cls:'archer'},save:{level:30}});
for(const pid of ['a','b']){ W.receive(pid,{t:'dev',cmd:'vale',v:2}); W.receive(pid,{t:'dev',cmd:'north',v:2}); }
tick(2);
const P=id=>W.players.get(id), IDS=['amanita','gawataro','haugbui','garrick'], KIT={amanita:'spore',gawataro:'dish',haugbui:'barrow',garrick:'blast'};

// ---- the data: four rows shaped like BOSS_DEFS, each with its kit ----
ok('four dungeon bosses, each a row like BOSS_DEFS (def, kit, add, short, bar) whose kit is registered with start, tick and phase',IDS.every(id=>{ const r=x.DG_BOSS_DEFS[id], K=r&&x.BOSS_KITS[r.kit];
  return r&&r.def.id===id&&r.def.boss&&r.kit===KIT[id]&&K&&['start','tick','phase'].every(f=>typeof K[f]==='function')&&r.add&&r.add.id===x.DG_BOSSES[id].add.id&&typeof r.short==='string'&&r.bar&&typeof r.bar.stun==='string'; }));
{ const want=x.defAt({hits:70,boss:true},30);
  ok('each is a level-30 boss of 70 hits: '+want.hp+' health, a hit of '+want.dmg+' (the doc: 23,400 and 718); its add has 60% health and is a level lower',IDS.every(id=>{ const r=x.DG_BOSS_DEFS[id];
    return r.def.level===30&&r.def.hp===want.hp&&r.def.dmg===want.dmg&&r.add.level===29&&r.add.hpK===0.6; }),IDS.map(id=>id+' '+x.DG_BOSS_DEFS[id].def.hp).join(', ')); }
ok('Amanita\'s puffballs fall to one hit; Haugbui\'s lamps are props that never attack and pay no XP',(()=>{ const pf=x.DG_BOSS_DEFS.amanita.prop, lp=x.DG_BOSS_DEFS.haugbui.prop;
  return pf.hits===1&&pf.noAttack&&pf.noXp&&pf.speed===0&&lp.model==='totem'&&lp.noAttack&&lp.noXp&&lp.speed===0; })());

// ---- the hall: a theme's dungeon baked and placed at a quiet spot of the world (the ground is cleared of the world's monsters, which would blur who hit whom) ----
const SPOTS=[];   // five quiet spots, one hall each (four bosses, and an open arena for Gawataro's charge), 150 m apart
for(let gx=-380;gx<=380;gx+=40) for(let gz=-380;gz<=380;gz+=40){
  if(SPOTS.length>=5||x.arenaDist(gx,gz)<120||x.vDist(gx,gz)<x.VR+80||SPOTS.some(([sx,sz])=>Math.hypot(sx-gx,sz-gz)<150)) continue;
  if([0,1,2,3,4,5,6,7,8].every(k=>x.getH(gx+(k<8?Math.sin(k*Math.PI/4)*19:0),gz+(k<8?Math.cos(k*Math.PI/4)*19:0))>1.5)) SPOTS.push([gx,gz]);
}
for(const m of x.MONS) if(!m.boss&&SPOTS.some(([sx,sz])=>Math.hypot(m.x-sx,m.z-sz)<160)) m.remove=true;
const hallOf=(theme,[X0,Z0])=>{ const L=x.dgLayout({mission:'purge',seed:3,theme}), B=x.dgBake(L); return x.dgHallArena(B,X0-B.boss.x,Z0-B.boss.z); };
const HALL={amanita:hallOf('hollowroots',SPOTS[0]),gawataro:hallOf('jadesprings',SPOTS[1]),haugbui:hallOf('bonefrostbarrow',SPOTS[2]),garrick:hallOf('blackseam',SPOTS[3])};
ok('the boss hall is a boss arena: centred where it was placed, radius 20, solid at the four pillars and beyond its wall, open in between',SPOTS.length===5&&IDS.every((id,i)=>{ const A=HALL[id];
  return A.x===SPOTS[i][0]&&A.z===SPOTS[i][1]&&A.r===20&&x.DG_HALL_PILLARS.every(([px,pz])=>A.solid(A.x+px,A.z+pz))&&A.solid(A.x+21,A.z)&&!A.solid(A.x,A.z)&&!A.solid(A.x+5,A.z+5)&&x.DG_HALL_LAMPS.every(([lx,lz])=>!A.solid(A.x+lx,A.z+lz)); }),SPOTS.map(q=>q.join(', ')).join(' / '));

// ---- a fight: what a boss does through its three phases ----
function watch(B,seen,mons0){   // what this tick showed: events, modes, stuns, glides, casts, summons
  for(const e of evs.splice(0)){
    if(e[0]==='tele') seen.add('tele:'+e[2]); else if(e[0]==='zone') seen.add('zone:'+e[2]); else if(e[0]==='wall') seen.add('wall'); else if(e[0]==='proj') seen.add('orb:'+e[2]);
    else if(e[0]==='pfx') seen.add('pfx:'+e[2]); else if(e[0]==='hurt') seen.add('hurt');
  }
  if(B.mode) seen.add('mode:'+B.mode); if(B.stunT>0) seen.add('stun'); if(B.mv) seen.add('move'); if(B.busy>0&&B.busy<100) seen.add('cast');
  for(const q of x.MONS) if(!mons0.has(q.id)&&q.temp) seen.add('summon:'+q.def.id);
  if(B.m.immune&&B.mode===0) seen.add('immune');
}
function fight(B){
  const m=B.m, Ar=B.A, seen=new Set(), mons0=new Set(x.MONS.map(q=>q.id)); evs.length=0;
  const put=()=>{ const py=x.getH(Ar.x,Ar.z); W.setPos('a',[Ar.x+4,py,Ar.z,Math.PI/2,0,0]); W.setPos('b',[Ar.x-9,py,Ar.z+3,Math.PI/2,0,0]); };
  const run=secs=>{ for(let i=0;i<secs*20;i++){ put(); tick(1); watch(B,seen,mons0); } };
  put(); tick(2); run(30);
  const engaged=B.engaged;
  m.hp=m.maxHp*0.55; run(3); const p2=B.phase===2; run(30);
  if(B.bd.kit==='roots'){ for(const t of B.totems) t.dead=true; run(2); }
  for(let i=0;i<40*20&&(m.immune||B.busy>0||B.mv||B.stunT>0);i++) run(0.05);
  m.hp=m.maxHp*0.25; run(3); const p3=B.phase===3&&B.enraged; run(35);
  return {seen,engaged,p2,p3,mons0};
}
const away=()=>{ W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3); };
const clean=B=>!B.engaged&&B.phase===1&&B.mode===0&&!B.zones.length&&!B.walls.length&&!B.orbs.length&&!B.tele.length&&!B.q.length&&!B.adds.length&&!B.m.immune&&B.m.hp===B.m.maxHp&&B.busy===0&&!(B.k.ch&&B.k.ch.size);
const leftovers=mons0=>x.MONS.filter(q=>!mons0.has(q.id)&&q.temp&&!q.remove&&!q.dead).length;
const sigs={};
for(const B of x.BOSSES){ sigs[B.bd.kit]=fight(B).seen; away(); }   // the six world bosses, for "moves no other boss has"
const DB={}, R={};
for(const id of IDS){
  const B=x.makeBossS(x.DG_BOSS_DEFS[id],HALL[id]); DB[id]=B;
  const r=fight(B); R[id]=r; sigs[B.bd.kit]=r.seen;
  ok(id+': engages in its hall, reaches phase 2 and the enraged phase 3',r.engaged&&r.p2&&r.p3);
  ok(id+': it hurts the players',r.seen.has('hurt'));
  away();
  ok(id+': reset when nobody is left in the hall: everything it set up is gone (zones, waves, telegraphs, timed steps, adds and props, channels)',clean(B)&&leftovers(r.mons0)===0,leftovers(r.mons0)+' summons left');
}

// ---- the signatures, one boss at a time: the two players stand where each test puts them; the boss's other moves are held off (their timers pushed back) ----
const py=(A)=>x.getH(A.x,A.z), place=(A,a,b)=>{ W.setPos('a',[A.x+a[0],py(A),A.z+a[1],0,0,0]); if(b) W.setPos('b',[A.x+b[0],py(A),A.z+b[1],0,0,0]); };
const hold=B=>{ for(const k in B.k) if(/T$/.test(k)) B.k[k]=99; };
const engage=(B,a,b)=>{ place(B.A,a,b); evs.length=0; tick(3); hold(B); B.m.x=B.A.x; B.m.z=B.A.z; B.m.vx=B.m.vz=0; tick(1); };
const hurtsIn=(fn,n)=>{ const got={a:0,b:0}; evs.length=0; for(let i=0;i<n;i++){ fn&&fn(); tick(1); for(const e of evs.splice(0)) if(e[0]==='hurt'&&got[e[1]]!==undefined) got[e[1]]++; } return got; };
// Amanita: puffballs
{ const B=DB.amanita, m=B.m, seen=sigs.spore; engage(B,[3.5,0],[-14,0]);
  B.k.puffT=0; tick(1); const puffs=B.k.puffs.slice(), n=puffs.length;
  ok('amanita: four puffballs swell up at least 6 m from her, each under its own warning, and the bar counts them',n===4&&B.aux===4&&puffs.every(o=>Math.hypot(o.pb.x-m.x,o.pb.z-m.z)>=6-0.01&&B.tele.includes(o.e)&&o.pb.def.id==='puffball'),'aux '+B.aux);
  const victim=puffs[0], vid=victim.e.id; victim.pb.hp=1; x.damageMonsterS(victim.pb,5,P('a'),victim.pb.x,victim.pb.z,0); evs.length=0; tick(2);
  const cancelled=evs.some(e=>e[0]==='tend'&&e[1]===vid&&e[2]===0)&&!B.tele.includes(victim.e);   // its warning was taken back, unfired
  let fired=new Set(), zones0=B.zones.filter(z=>z.kind==='spore').length;
  for(let i=0;i<7*20;i++){ place(B.A,[3.5,0],[-14,0]); tick(1); for(const e of evs.splice(0)) if(e[0]==='tend'&&e[2]===1) fired.add(e[1]); }
  const burst=puffs.slice(1).every(o=>fired.has(o.e.id)&&o.pb.remove), spores=B.zones.filter(z=>z.kind==='spore').length;
  ok('amanita: a puffball killed in time cancels its burst (its warning is taken back unfired), the others burst and leave spore clouds (the signature)',victim.pb.dead&&!fired.has(vid)&&cancelled&&burst&&spores>=3&&B.aux===0,'fired '+fired.size+', spore clouds '+zones0+' -> '+spores);
  if(victim.pb.dead&&!fired.has(vid)) seen.add('cancel');
  // the pulse: a pillar between her and you shelters you
  B.phase=2; hold(B); B.zones.length=0; m.x=B.A.x; m.z=B.A.z;
  const behind=[13.4,13.4], open=[-5,1]; place(B.A,behind,open); tick(2); hold(B); m.x=B.A.x; m.z=B.A.z; B.busy=0; B.mv=null; B.k.pulseT=0;
  const got=hurtsIn(()=>{ place(B.A,behind,open); m.x=B.A.x; m.z=B.A.z; },3.2*20);
  ok('amanita: the spore pulse hits the whole hall but spares whoever has a pillar between them and her (line of sight on the hall\'s grid)',got.b>0&&got.a===0,'behind the pillar '+got.a+' hits, in the open '+got.b);
  if(got.b>0&&got.a===0) seen.add('safe');
  away(); }
// Gawataro: the dish and the charge
{ const B=DB.gawataro, m=B.m, seen=sigs.dish; engage(B,[3,0],[-3,0]);
  const a=P('a'), b=P('b'), faceA=()=>{ m.x=B.A.x; m.z=B.A.z; m.face=m.faceGoal=Math.atan2(-(a.x-m.x),-(a.z-m.z)); };
  faceA(); const d0=B.k.dish; for(let i=0;i<10;i++){ faceA(); x.damageMonsterS(m,0.01,a,a.x,a.z,0); }
  const front=B.k.dish; for(let i=0;i<10;i++){ faceA(); x.damageMonsterS(m,0.01,b,b.x,b.z,0); }
  ok('gawataro: hits from in front leave his dish full, hits from behind spill it 2.5% each (the bar shows it)',d0===100&&front===100&&B.k.dish===75&&B.aux===75,'front '+front+', after 10 from behind '+B.k.dish);
  for(let i=0;i<40&&B.stunT<=0;i++){ faceA(); x.damageMonsterS(m,0.01,b,b.x,b.z,0); }
  const stunned=B.stunT>4&&B.k.dried===1&&B.k.dish===0, hpA=m.hp; x.damageMonsterS(m,1,a,a.x,a.z,0);
  ok('gawataro: an empty dish leaves him dried and stunned for 5 s (the signature), and it fills again when he recovers',stunned&&(()=>{ for(let i=0;i<6*20;i++){ place(B.A,[3,0],[-3,0]); tick(1); } return B.k.dish===100&&B.stunT<=0; })(),'stun '+B.stunT.toFixed(1));
  if(stunned) seen.add('dish');
  // the charge: aimed at the farthest player, who stands behind a pillar
  hold(B); B.phase=2; m.x=B.A.x; m.z=B.A.z; B.busy=0; B.mv=null; B.stunT=0;
  const behind=[13.4,13.4]; place(B.A,[2.5,-2.5],behind); tick(1); hold(B); m.x=B.A.x; m.z=B.A.z; B.busy=0; B.k.chargeT=0; const c0=B.k.charged||0;
  let pushed=0, minD=1e9; evs.length=0;
  for(let i=0;i<3*20;i++){ place(B.A,[2.5,-2.5],behind); tick(1); for(const e of evs.splice(0)) if(e[0]==='pfx'&&e[2]==='push') pushed++; }
  const dc=Math.hypot(m.x-B.A.x,m.z-B.A.z), past=Math.hypot(m.x-(B.A.x+behind[0]),m.z-(B.A.z+behind[1]));
  ok('gawataro: the sumo charge runs at the farthest player and stops at the pillar in its path (short of it, the player behind it untouched), stunned 3 s',(B.k.charged||0)===c0+1&&B.stunT>0&&dc>3&&dc<12-m.T.rad+0.6&&past>3&&!B.A.solid(m.x,m.z),'stopped '+dc.toFixed(1)+' m out, '+past.toFixed(1)+' m short of the player');
  if((B.k.charged||0)===c0+1) seen.add('wallstop');
  away();
  // in an open arena (a world arena has no grid) it runs to the arena's edge
  const [X0,Z0]=SPOTS[4], O=x.makeBossS(x.DG_BOSS_DEFS.gawataro,{x:X0,z:Z0,r:20}); engage(O,[2,0],[-15,0]); O.phase=2; O.m.x=X0; O.m.z=Z0; O.busy=0; O.k.chargeT=0;
  for(let i=0;i<3*20;i++){ place(O.A,[2,0],[-15,0]); tick(1); }
  ok('gawataro: without a hall\'s grid (an open arena) the charge runs to the arena\'s edge and stops there',(O.k.charged||0)===1&&Math.hypot(O.m.x-X0,O.m.z-Z0)>15,Math.hypot(O.m.x-X0,O.m.z-Z0).toFixed(1)+' m');
  away(); O.m.remove=true; }
// Haugbui: the lamps
{ const B=DB.haugbui, m=B.m, seen=sigs.barrow, L=()=>B.k.lamps; engage(B,[3,0],[-3,0]);
  ok('haugbui: four lamps stand lit at the pillars when he wakes, and they cannot be broken',L().length===4&&L().every(l=>l.lit&&l.m.def.id==='barrowlamp'&&l.m.immune)&&B.aux===4&&x.damageMonsterS(L()[0].m,50,P('a'),L()[0].x,L()[0].z,0)===0);
  B.phase=2; hold(B); B.k.snuffT=0; let dark=0; evs.length=0;
  for(let i=0;i<2.5*20;i++){ place(B.A,[3,0],[-3,0]); tick(1); for(const e of evs.splice(0)) if(e[0]==='dglamp'&&e[2]===0) dark++; }
  hold(B);
  ok('haugbui: he snuffs a lamp (a ring at it, then it goes dark: the bar counts 3 lit)',dark===1&&B.aux===3&&L().filter(l=>!l.lit).length===1,'dark events '+dark);
  const lamp=L().find(l=>!l.lit), at=[lamp.x-B.A.x+0.8,lamp.z-B.A.z];
  place(B.A,at,[-3,0]); tick(1); const began=B.kit.use(B,m,P('a')); tick(10); W.setPos('a',[lamp.x+4,py(B.A),lamp.z,0,0,0]); tick(2);
  const broke=lamp.lit===false&&!(B.k.ch&&B.k.ch.size);
  place(B.A,at,[-3,0]); tick(1); const again=B.kit.use(B,m,P('a')); let relit=0; evs.length=0;
  for(let i=0;i<3*20;i++){ place(B.A,at,[-3,0]); tick(1); for(const e of evs.splice(0)) if(e[0]==='dglamp'&&e[2]===1) relit++; }
  ok('haugbui: a dark lamp is relit by holding still beside it for 2.5 s (a channel: walking off breaks it)',began&&broke&&again&&lamp.lit&&relit===1&&B.aux===4);
  if(lamp.lit&&relit===1) seen.add('channel');
  // the wail: nobody within 8 m of a lit lamp is hurt
  for(const l of L()) if(l!==L()[0]){ l.lit=false; }
  const safeAt=[L()[0].x-B.A.x-1.5,L()[0].z-B.A.z+1.5], farAt=[-L()[0].x+B.A.x+1.5,-L()[0].z+B.A.z];
  place(B.A,safeAt,farAt); tick(1); hold(B); B.busy=0; B.mv=null; B.k.wailT=0;
  const got=hurtsIn(()=>place(B.A,safeAt,farAt),3.2*20);
  ok('haugbui: the barrow wail hits the whole hall except whoever stands within 8 m of a lit lamp',got.a===0&&got.b>0,'by the lit lamp '+got.a+' hits, by a dark one '+got.b);
  if(got.a===0&&got.b>0) seen.add('safe');
  // the blackout: the last lamp out, he vanishes (immune) and the hall goes dark; two lamps relit end it early and he is stunned 4 s
  hold(B); B.k.blackCd=0; L()[0].lit=false; place(B.A,[3,0],[-3,0]); tick(2);
  const black=B.mode===2&&m.immune&&!!B.k.black;
  for(const l of L().slice(0,2)){ const sp=[l.x-B.A.x+0.8,l.z-B.A.z]; place(B.A,sp,[-3,0]); tick(1); B.kit.use(B,m,P('a')); for(let i=0;i<2.7*20;i++){ place(B.A,sp,[-3,0]); tick(1); } }
  tick(1);
  ok('haugbui: when the last lamp goes out he vanishes and cannot be hit (mode 2: the client darkens the hall), and two lamps relit end it early with a 4 s stun',black&&B.mode===0&&!m.immune&&B.stunT>0&&B.k.unmoored===1&&x.DG_BOSS_DEFS.haugbui.gloom===2,'stun '+B.stunT.toFixed(1));
  if(black&&B.k.unmoored===1){ seen.add('stun'); seen.add('gloom'); }
  // the thrall cap: waves and blackouts add Grave Wisps only up to DG_THRALL_MAX alive (at +V a hero cannot kill them, so without a cap they only piled up)
  const alive=()=>B.adds.filter(a=>a.def===B.bd.add&&!a.dead&&!a.remove).length;
  for(const l of L()) l.lit=true; hold(B); B.busy=0; B.mv=null; B.k.black=null; B.mode=0; m.immune=false; B.stunT=0; let most=0;
  for(let i=0;i<14;i++){ B.k.thrallT=0; B.busy=0; B.mv=null; place(B.A,[3,0],[-3,0]); tick(2); most=Math.max(most,alive()); }
  ok('haugbui: his waves stop at '+x.DG_THRALL_MAX+' thralls alive (more rise as they fall)',x.DG_THRALL_MAX===8&&most===8&&alive()===8,'most alive '+most);
  for(const a of B.adds) if(a.def===B.bd.add) a.remove=true;
  away(); }

// Garrick: the powder kegs
{ const B=DB.garrick, m=B.m, seen=sigs.blast; engage(B,[3,0],[-14,0]);
  B.k.kegT=0; tick(1); hold(B); const kegs=B.k.kegs.slice();
  ok('garrick: four powder kegs roll out at least 6 m from him, each under its own warning, and the bar counts them',kegs.length===4&&B.aux===4&&kegs.every(o=>Math.hypot(o.pb.x-m.x,o.pb.z-m.z)>=6-0.01&&B.tele.includes(o.e)&&o.pb.def.id==='powderkeg'),'kegs '+kegs.length+', aux '+B.aux);
  // one popped beside him (within 3.5 m): he takes 4% and is stunned; a keg within 6 m of it follows 0.4 s later; one farther off waits for its own fuse
  const k0=kegs[0], k1=kegs[1], k2=kegs[2], sp=(o,dx,dz)=>{ o.x=m.x+dx; o.z=m.z+dz; o.pb.x=o.x; o.pb.z=o.z; };
  sp(k0,2,0); sp(k1,2,4); sp(k2,-15,0); const hp0=m.hp, kh0=B.k.kegHits||0; k0.pb.hp=1; x.damageMonsterS(k0.pb,5,P('a'),k0.pb.x,k0.pb.z,0);
  let fired=new Set(); evs.length=0;
  for(let i=0;i<2*20;i++){ place(B.A,[3,0],[-14,0]); tick(1); for(const e of evs.splice(0)) if(e[0]==='tend'&&e[2]===1) fired.add(e[1]); }
  const lost=(hp0-m.hp)/m.maxHp;
  ok('garrick: a keg popped beside him hurts him 4% and stuns him (the signature), and sets off the keg within 6 m of it while one farther away keeps its fuse',k0.gone&&k1.gone&&!k2.gone&&lost>=0.04-1e-6&&lost<=0.08+1e-6&&B.stunT>0&&(B.k.kegHits||0)>kh0,'lost '+(lost*100).toFixed(1)+'%, stun '+B.stunT.toFixed(1)+', hits '+((B.k.kegHits||0)-kh0));
  if(k0.gone&&B.stunT>0) seen.add('keg');
  // left alone, a keg burns down by itself (a warning that goes off, hurting whoever stands in it) and does him no harm
  for(const o of B.k.kegs) if(!o.gone) o.pb.remove=true;
  B.stunT=0; B.k.kegs.length=0; B.k.kegT=0; tick(1); hold(B); const alone=B.k.kegs.slice(); const hp1=m.hp; fired=new Set();
  for(let i=0;i<8*20;i++){ place(B.A,[3,0],[-14,0]); tick(1); for(const e of evs.splice(0)) if(e[0]==='tend'&&e[2]===1) fired.add(e[1]); }
  ok('garrick: kegs left alone all go off by themselves when the fuse runs out (none left standing, a blast for each; he is hurt only if a chain reaches him)',alone.length===4&&alone.every(o=>o.gone)&&fired.size>=4&&B.aux===0&&m.hp>=hp1-m.maxHp*0.16,'fired '+fired.size+', his health '+((m.hp-hp1)/m.maxHp*100).toFixed(1)+'%');
  for(const a of B.adds) a.remove=true;
  away(); }

// ---- every move of each boss's design happened, and each has moves no other boss has ----
const OBS=(row,tok)=>tok==='adds'?'summon:'+row.add.id:tok==='props'?'summon:'+row.prop.id:tok==='mode:hidden'?'mode:2':tok==='new:zone-spore'?'zone:spore':tok==='new:tele-cancel'?'cancel':
  tok==='new:tele-safe'?'safe':tok==='new:hit-hook'?'dish':tok==='new:stop-at-wall'?'wallstop':tok==='new:channel'?'channel':tok==='new:gloom'?'gloom':tok==='new:keg-blast'?'keg':tok;
for(const id of IDS){
  const row=x.DG_BOSS_DEFS[id], s=sigs[row.kit], want=[...new Set(x.DG_BOSSES[id].moves.flatMap(mv=>mv.does).map(t=>OBS(row,t)))], miss=want.filter(t=>!s.has(t));
  ok(id+': every move of its design happens (each primitive its DG_BOSSES moves name, the new ones included)',!miss.length,miss.length?'missing '+miss.join(', '):want.join(' '));
}
const ONLY={spore:['tele:spore','tele:puff','tele:pulse','zone:spore','summon:puffball','summon:sporeling'],dish:['tele:vent','summon:kappawhelp'],barrow:['tele:wail','tele:snuff','summon:barrowlamp','summon:gravewisp'],blast:['tele:blast','summon:powderkeg','summon:slagling']};
for(const kit of Object.keys(ONLY)){
  const others=Object.keys(sigs).filter(k=>k!==kit), mine=ONLY[kit].filter(k=>sigs[kit].has(k)&&!others.some(o=>sigs[o].has(k)));
  ok(kit+': moves none of the other bosses has ('+ONLY[kit].length+')',mine.length===ONLY[kit].length,mine.join(' '));
}
ok('the six world bosses are untouched: their fights still show their own moves',['roots','tide','oni','kitsune','rime','wyrm'].every(k=>sigs[k]&&sigs[k].has('hurt')));

// ---- a real kill: each boss falls, and leaves nothing behind ----
for(const id of IDS){
  const B=DB[id], m=B.m, Ar=B.A, mons0=new Set(x.MONS.map(q=>q.id)); place(Ar,[4,0],[-9,3]); tick(3);
  if(B.k.black) B.k.black.relit=2; tick(2); m.immune=false;
  for(let i=0;i<400&&!m.dead;i++){ m.hp=1; m.immune=false; W.setPos('a',[m.x+m.T.rad+1.2,py(Ar),m.z,Math.PI/2,0,0]); W.receive('a',{t:'atk',k:'basic',tg:m.id,face:Math.PI/2}); tick(1); }
  tick(3);
  ok(id+': can be killed, and leaves nothing behind (zones, waves, telegraphs, steps, adds, props)',m.dead&&!B.zones.length&&!B.walls.length&&!B.orbs.length&&!B.tele.length&&!B.q.length&&!B.adds.length&&leftovers(mons0)===0&&B.mode===0);
}

// ---- the models: each boss, add and prop builds on the client's model code (an exception in a builder inside a network message drops the rest of the roster) ----
{ const rd=f=>strip(fs.readFileSync(path.join(SRC,f),'utf8')), pm=rd('game/world/plant-models.js'), bl=rd('game/village/buildings.js');
  const helpers='const vbox=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x||0,y||0,z||0);\n'+pm.slice(pm.indexOf('const _c'),pm.indexOf('\n',pm.indexOf('const cyl'))+1)+bl.slice(bl.indexOf('function stoneC'),bl.indexOf('\n',bl.indexOf('function trisGeo'))+1);
  const game=JSON.parse(fs.readFileSync(path.join(SRC,'manifest.json'),'utf8')).game, monFiles=game.filter(f=>/^combat\/monster/.test(f));
  const code=['shared/math.js','shared/noise.js','shared/balance.js','shared/monster-defs.js'].map(rd).join('')+helpers+
    'const LITE=false,LOW=false;const localStorage={getItem(){return null},setItem(){}};const scene=new THREE.Scene();const matFlat=new THREE.MeshLambertMaterial();let t=0;const GAIT=[0,Math.PI,Math.PI,0];const getH=()=>0,BOSS={list:[]},CB={target:null};\n'+
    rd('game/world/plant-models-hi.js')+rd('game/character/model.js').split('const hiker=')[0]+';\n'+rd('game/character/pose.js')+monFiles.map(f=>rd('game/'+f)).join('')+'\nreturn {buildMonster,monMat,AM:animateMonster};';
  const M=new Function(code)(), bad=[], stats=[];
  for(const id of IDS){ const r=x.DG_BOSS_DEFS[id];
    for(const d of [r.def,r.add,r.prop].filter(Boolean)){
      try{ const g=new THREE.Group(), parts=M.buildMonster(d,M.monMat(d.glow),g), v={def:d,T:d,model:d.model,parts,g,s:1,gs:d.scale,ph:1,lunge:0,spawnT:0,face:0,x:0,y:0,z:0,aggro:true,act:null,boss:!!d.boss};
        for(let i=0;i<5;i++) M.AM(v,0.05,i%2?3:0);
        let tris=0, meshes=0, okGeo=true; g.traverse(o=>{ if(!o.isMesh) return; meshes++; const ga=o.geometry.attributes; tris+=ga.position.count/3; if(!ga.normal||!ga.color||[...ga.position.array].some(n=>!isFinite(n))) okGeo=false; });
        if(!meshes||!okGeo||tris<50) bad.push(d.id); stats.push(d.id+' '+tris);
      }catch(e){ bad.push(d.id+': '+e.message); } } }
  ok('the models of the four bosses, their adds and props build (meshes with normals and colours) and animate',!bad.length,bad.length?bad.join('; '):stats.join(', '));
}
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
