//@ The dungeon bosses' move sets: Amanita the Sporemother (spore clouds, puffballs you pop to cancel, sporelings, a pulse a pillar shelters you from, sporefall), Gawataro the Jade Elder (sweep, vent dance, whirlpools, the dish you spill from behind, a sumo charge that stops at a pillar, whelps, spring surge), Haugbui the Barrow Lord (grasping chain, cold breath, thralls, lamps he snuffs and you relight, the wail, the blackout)
/* Agent map: exports BOSS_KITS.spore / BOSS_KITS.dish / BOSS_KITS.barrow (the kit contract of server/boss.js: start, tick, phase; plus `hit` (Gawataro: called by damageMonsterS
   for every hit, the hook in server/combat.js) and `use` (Haugbui: a player pressed the use key in the hall; the run's use message calls B.kit.use(B, B.m, p) when the kit has it)),
   DG_BOSS_NEEDS (each `new:` need of DG_BOSSES -> what implements it). Uses server/boss-fx.js and server/dungeons/boss-fx.js; the defs are DG_BOSS_DEFS (shared/dungeons/bosses.js).
   Test: tools/dungeon-boss-smoke.js. Designs and numbers: docs/DUNGEON-THEMES.md section 4. A boss's hit is m.T.dmg; a multiplier is how many hits a move is worth.
   The hall: the boss reads A.x, A.z, A.r as every kit does, and A.solid when the arena has it (a run's hall, for the pillars); adds rise at DG_HALL_MOUTHS, lamps stand at DG_HALL_LAMPS,
   vents are dgVentAt. Events of their own: 'dglamp' [lamp monster id, 1 lit / 0 dark], 'dgch' / 'dgchx' (the relight channel's cast bar, server/dungeons/boss-fx.js). */

// adds at the hall's monster mouths (all four, or n of them at random)
function dgBossMouthAddsS(B,n,max){
  const A=B.A, mouths=DG_HALL_MOUTHS.slice();
  if(max) n=Math.min(n,Math.max(0,max-B.adds.filter(a=>a.def===B.bd.add&&!a.dead&&!a.remove).length));   // (max: the most of his adds the hall holds at once)
  for(let i=mouths.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [mouths[i],mouths[j]]=[mouths[j],mouths[i]]; }
  for(let i=0;i<n;i++){ const [mx,mz]=mouths[i%mouths.length]; spawnAddsS(B,1,A.x+mx,A.z+mz,1.2); }
}
// a free spot of the hall at least `from` metres from (fx,fz) and clear of walls and pillars
function dgBossFreePtS(B,fx,fz,from){
  const A=B.A; let x=A.x, z=A.z;
  for(let i=0;i<40;i++){ [x,z]=arenaPtS(A,A.r-3); if(Math.hypot(x-fx,z-fz)>=from&&![[0,0],[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]].some(([dx,dz])=>dgBossSolidS(A,x+dx,z+dz))) break; }
  return [x,z];
}

// ---- Amanita, the Sporemother (the Hollow Roots): she poisons the air; her puffballs burst unless you pop them first ----
// three spore clouds (five enraged), the first two under players: a ring warns 1.4 s, then a cloud of 4.5 m that hurts and slows for 10 s
function dgAmaCloudsS(B,m,inside){
  const A=B.A, n=B.enraged?5:3;
  for(let i=0;i<n;i++){
    let x,z; if(i<Math.min(2,inside.length)){ x=inside[i].x; z=inside[i].z; } else [x,z]=dgBossFreePtS(B,m.x,m.z,0);
    const e=addTeleS(B,x,z,4.5,1.4,'spore',0); e.done=()=>{ if(B.engaged&&!m.dead) dgBossSporeS(B,x,z,4.5,10); };
  }
}
// the signature: four puffballs (six enraged) at least 6 m from her, each swelling under a 6 s warning; it bursts (1.7 hits, and a cloud) unless killed first, which cancels the burst
function dgAmaPuffsS(B,m){
  const n=B.enraged?6:4, D=m.T.dmg;
  for(let i=0;i<n;i++){
    const [x,z]=dgBossFreePtS(B,m.x,m.z,6), pb=spawnMonS(B.bd.prop,x,z,{x,z},true); B.adds.push(pb);
    const e=addTeleS(B,x,z,5.5,6,'puff',0);
    e.done=()=>{ if(pb.dead||pb.remove) return; dgBossHurtInS(B,x,z,5.5,D*1.7); removeMonS(pb); if(B.engaged&&!m.dead) dgBossSporeS(B,x,z,4.5,10); };
    B.k.puffs.push({pb,e});
  }
  toastTo(null,'Puffballs swell up round Amanita: pop them before they burst!','bad');
}
BOSS_KITS.spore={
  start(B){ B.k={slamT:3,cloudT:4,puffT:8,lingT:99,pulseT:99,fallT:99,puffs:[],sporeT:0}; },
  phase(B,m,n){
    if(n===2){ B.k.lingT=2; B.k.pulseT=6; toastTo(null,'Amanita shudders: sporelings rise from the roots!','bad'); }
    else { B.k.fallT=3; toastTo(null,'Spores rain from the roof of the cathedral!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    dgBossSporeTickS(B,dt);
    k.puffs=k.puffs.filter(o=>{ if(o.pb.dead){ dgBossCancelTeleS(B,o.e); return false; } return !o.pb.remove&&B.tele.includes(o.e); });   // a puffball killed in time takes its burst with it
    k.slamT-=dt; k.cloudT-=dt; k.puffT-=dt; if(B.phase>=2){ k.lingT-=dt; k.pulseT-=dt; } if(B.phase>=3) k.fallT-=dt;
    if(k.cloudT<=0){ k.cloudT=10; dgAmaCloudsS(B,m,C.inside); }
    if(k.puffT<=0){ k.puffT=15; dgAmaPuffsS(B,m); }
    B.aux=k.puffs.length;
    if(k.lingT<=0){ k.lingT=20; dgBossMouthAddsS(B,4); }
    if(k.fallT<=0){ k.fallT=12;   // sporefall: 14 circles over 6 s, the first three under players, each slowing
      for(let i=0;i<14;i++) laterS(B,i*6/14,()=>{ const ins=playersInArena(A,4); let x,z; if(i<3&&ins.length){ const q=ins[i%ins.length]; x=q.x+AR(-1,1); z=q.z+AR(-1,1); } else [x,z]=arenaPtS(A,A.r-1);
        const e=addTeleS(B,x,z,3,1.2,'icefall',Math.round(D*0.8)); e.hit=p=>pfxS(p,'slow',2); }); }
    if(B.busy>0||B.mv) return;
    if(k.pulseT<=0){ k.pulseT=14;   // the spore pulse: the whole hall, but a pillar between you and her shelters you (decided as it goes off)
      castS(B,m,2.4,2.3); dgBossSafeTeleS(B,A.x,A.z,A.r+3,2.2,'pulse',D*1.2,p=>!dgBossLosS(A,m.x,m.z,p.x,p.z),p=>pfxS(p,'slow',3)); ev('roar',m.id);
      toastTo(null,'Amanita swells: get a pillar between you and her!','bad'); }
    else if(k.slamT<=0&&C.dp<m.T.rad+4){ k.slamT=7; const w=B.enraged?1.0:1.4; castS(B,m,w+0.3,2.3); addTeleS(B,m.x,m.z,6.7,w,'slam',Math.round(D*1.4)); }   // the cap slam
  }
};

// ---- Gawataro, the Jade Elder (Jade Spring Grottoes): sumo, steam and the dish of water on his head ----
const DG_DISH_BACK=70*DEG;   // hits from the 140 degrees at his back spill the dish
const DG_DISH_SPILL=2.5, DG_DISH_SPILL_ENRAGED=4;   // % of the dish a hit from behind spills (more when he is enraged: his anger leaves him open)
// the five vents erupt clockwise one after another from a random one, 0.7 s apart
function dgGawaVentsS(B,m){
  const i0=Math.floor(Math.random()*5), D=m.T.dmg;
  for(let j=0;j<5;j++) laterS(B,j*0.7,()=>{ const [x,z]=dgVentAt(B.A,(i0+j)%5); addTeleS(B,x,z,3.2,0.9,'vent',Math.round(D)); });
}
// the sumo charge: he marks the farthest player, a line warns 1.4 s (3 m either side, as long as the run to the first wall), then he charges it in 0.9 s, throwing players aside,
// and stops at the first wall in his path, a pillar or the hall's wall, stunned 3 s (so stand with a pillar behind you)
function dgGawaChargeS(B,m,ins){
  const q=farPlayerS(m,ins), a=Math.atan2(-(q.x-m.x),-(q.z-m.z)), ray=dgBossRayS(B,a,2*B.A.r), ux=-Math.sin(a), uz=-Math.cos(a);
  faceS(m,q.x,q.z); castS(B,m,2.4,1.0);
  const e=addTeleS(B,m.x,m.z,ray.d+m.T.rad,1.4,'line',Math.round(m.T.dmg*2),a,3);
  e.hit=p=>{ const s=Math.sign(-(p.x-e.x)*uz+(p.z-e.z)*ux)||1; pfxS(p,'push',0,-uz*s*14,ux*s*14); };
  laterS(B,1.4,()=>{ dgBossGlideS(B,a,2*B.A.r,0.9); ev('mact',m.id,1.0);
    laterS(B,0.9,()=>{ B.stunT=3; m.act=null; B.k.charged=(B.k.charged||0)+1; toastTo(null,'Gawataro slams into the stone: strike now!','good'); }); });
  toastTo(q.id,'Gawataro lowers his head at you: put a pillar behind you!','bad');
}
BOSS_KITS.dish={
  start(B){ B.k={sweepT:4,ventT:6,whirlT:10,chargeT:99,whelpT:99,surgeT:99,dish:100,dried:0}; B.aux=100; },
  phase(B,m,n){
    if(n===2){ B.k.chargeT=4; B.k.whelpT=3; toastTo(null,'Gawataro stamps: the sumo begins!','bad'); }
    else { B.k.surgeT=3; toastTo(null,'The springs surge! Gawataro\'s dish sloshes over.','bad'); }
    ev('roar',m.id);
  },
  // the signature: hits from behind spill his dish; at 0 he stands dried and stunned 5 s (a stunned boss takes x1.5, server/combat.js) and the dish refills
  hit(B,m,p){
    const k=B.k; if(!B.engaged||B.stunT>0||typeof k.dish!=='number') return;
    if(Math.abs(angDiff(Math.atan2(-(p.x-m.x),-(p.z-m.z)),m.face))<Math.PI-DG_DISH_BACK) return;
    k.dish=Math.max(0,k.dish-(B.enraged?DG_DISH_SPILL_ENRAGED:DG_DISH_SPILL)); B.aux=Math.round(k.dish);
    if(k.dish<=0){ B.stunT=5; m.act=null; k.dried++; toastTo(null,'Gawataro\'s dish is spilled! He stands dried: strike now!','good'); }
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    if(k.dish<=0) k.dish=100;   // the stun is over (the kit does not tick while he is stunned): the spring fills it again
    B.aux=Math.round(k.dish);
    k.sweepT-=dt; k.ventT-=dt; k.whirlT-=dt; if(B.phase>=2){ k.chargeT-=dt; k.whelpT-=dt; } if(B.phase>=3) k.surgeT-=dt;
    if(k.ventT<=0){ k.ventT=12; dgGawaVentsS(B,m); }
    if(k.whirlT<=0){ k.whirlT=16; for(let i=0;i<2;i++){ const q=randPlayerS(C.inside), [x,z]=inArenaS(A,q.x,q.z,A.r-4); addZoneS(B,'whirl',x,z,5,8); } }
    if(k.whelpT<=0){ k.whelpT=22; dgBossMouthAddsS(B,3); }
    if(k.surgeT<=0){ k.surgeT=15;   // two waves from opposite sides, their gaps at least 8 m apart (p1, p2: where each gap crosses, measured across the first wave; the second wave's own frame is mirrored)
      const a=AR(0,TAU), p1=AR(-10,10), p2=clamp(p1>0?p1-AR(8,14):p1+AR(8,14),-12,12);
      for(const [ang,g] of [[a,p1],[a+Math.PI,-p2]]) addWallS(B,A.x+Math.sin(ang)*26,A.z+Math.cos(ang)*26,ang,B.enraged?10.5:9.5,30,g,3.8,Math.round(D*1.4),1.6);
      castS(B,m,1.0,1.0); }
    if(B.busy>0||B.mv) return;
    if(k.chargeT<=0&&C.inside.length){ k.chargeT=18; dgGawaChargeS(B,m,C.inside); }
    else if(k.sweepT<=0&&C.dp<m.T.rad+3.5){ k.sweepT=B.enraged?5:7;   // the kanabo sweep: a 120 degree arc that shoves you 14 m/s; the cast is your chance to get behind him
      faceS(m,C.p.x,C.p.z); castS(B,m,1.5,1.0); const e=addTeleS(B,m.x,m.z,7,1.2,'cleave',Math.round(D*1.2),m.face,Math.PI/3);
      e.hit=p=>{ const dx=p.x-e.x, dz=p.z-e.z, d=Math.hypot(dx,dz)||1; pfxS(p,'push',0,dx/d*14,dz/d*14); }; }
  }
};

// ---- Haugbui, the Barrow Lord (Bonefrost Barrow): the dead who keep their grave; the clan's lamps are what it fears ----
const DG_THRALL_MAX=8;   // the hall holds at most this many thralls at once: a hero cannot kill them (level 79), so without a cap each wave and each blackout only adds to the pile
const DG_LAMP_SAFE=8, DG_LAMP_REACH=3, DG_LAMP_CHANNEL=2.5;   // the wail spares whoever is within 8 m of a lit lamp; relighting: within 3 m, holding still 2.5 s
const DG_BLACKOUT=8, DG_BLACKOUT_RELIT=2;   // the blackout lasts 8 s, or ends early (and stuns him 4 s) when two lamps are relit
// the grasping chain: a hand-ring under one player that roots, then jumps to the nearest other player within 9 m of it, up to three jumps
function dgHaugChainS(B,m,q,left,done){
  const e=addTeleS(B,q.x,q.z,2.2,left===3?1.3:1.0,'root',Math.round(m.T.dmg*0.9)); e.hit=p=>pfxS(p,'root',1.5);
  e.done=e2=>{
    done.add(q.id); if(left<=0||!B.engaged||m.dead) return;
    let nx=null, nd=9; for(const p of playersInArena(B.A,4)){ if(done.has(p.id)) continue; const d=Math.hypot(p.x-e2.x,p.z-e2.z); if(d<nd){ nd=d; nx=p; } }
    if(nx) dgHaugChainS(B,m,nx,left-1,done);
  };
}
function dgHaugLampsS(B){
  const A=B.A; B.k.lamps=DG_HALL_LAMPS.map(([lx,lz])=>{ const x=A.x+lx, z=A.z+lz, lm=spawnMonS(B.bd.prop,x,z,{x,z},true); lm.immune=true; B.adds.push(lm); return {m:lm,x,z,lit:true}; });
}
const dgHaugLit=B=>(B.k.lamps||[]).filter(L=>L.lit).length;
function dgHaugRelightS(B,L){
  if(L.lit) return; L.lit=true; ev('dglamp',L.m.id,1);
  if(B.k.black) B.k.black.relit++;
}
function dgHaugBlackoutS(B,m){
  B.k.black={t:0,relit:0}; B.mode=2; m.immune=true; B.busy=1e3; m.act=null; m.vx=m.vz=0; clearTeleS(B);
  dgBossMouthAddsS(B,8,DG_THRALL_MAX); ev('roar',m.id);
  toastTo(null,'The lamps fail: Haugbui fades into the dark! Relight the lamps!','bad');
}
function dgHaugBlackoutEndS(B,m,early){
  B.k.black=null; B.mode=0; m.immune=false; B.busy=0; B.k.blackCd=10;
  if(early){ B.stunT=4; m.act=null; B.k.unmoored=(B.k.unmoored||0)+1; toastTo(null,'The light holds Haugbui fast: strike now!','good'); }
}
BOSS_KITS.barrow={
  start(B){ B.k={chainT:5,breathT:8,thrallT:12,snuffT:99,wailT:99,black:null,blackCd:0,ch:new Map()}; dgHaugLampsS(B); B.aux=4; },
  phase(B,m,n){
    if(n===2){ B.k.snuffT=3; B.k.wailT=8; toastTo(null,'Haugbui turns to the lamps!','bad'); ev('roar',m.id); }
    else if(!B.k.black) dgHaugBlackoutS(B,m);
  },
  // a player pressed the use key in the hall: start relighting the nearest dark lamp within reach (true if a channel began)
  use(B,m,p){
    if(!B.engaged||!B.k.lamps) return false;
    let best=null, bd=DG_LAMP_REACH; for(const L of B.k.lamps){ const d=Math.hypot(L.x-p.x,L.z-p.z); if(!L.lit&&d<=bd){ bd=d; best=L; } }
    return !!best&&dgBossChannelS(B,p,DG_LAMP_CHANNEL,'Relighting the lamp',()=>dgHaugRelightS(B,best));
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    dgBossChannelTickS(B); B.aux=dgHaugLit(B);
    k.chainT-=dt; k.thrallT-=dt; k.blackCd-=dt;
    if(k.chainT<=0){ k.chainT=k.black?6:9; dgHaugChainS(B,m,randPlayerS(C.inside),3,new Set()); }
    if(k.black){
      k.black.t+=dt;
      if(k.black.relit>=DG_BLACKOUT_RELIT) dgHaugBlackoutEndS(B,m,true); else if(k.black.t>=DG_BLACKOUT) dgHaugBlackoutEndS(B,m,false);
      return;
    }
    k.breathT-=dt; if(B.phase>=2){ k.snuffT-=dt; k.wailT-=dt; }
    if(k.thrallT<=0){ k.thrallT=24; dgBossMouthAddsS(B,4,DG_THRALL_MAX); }
    if(B.phase>=2&&!dgHaugLit(B)&&k.blackCd<=0){ dgHaugBlackoutS(B,m); return; }   // the last lamp went out
    if(k.snuffT<=0){ k.snuffT=B.enraged?6:7; const lit=k.lamps.filter(L=>L.lit);   // he snuffs a lamp: a ring at it, then it goes dark
      if(lit.length){ const L=lit[Math.floor(Math.random()*lit.length)], e=addTeleS(B,L.x,L.z,3,1.5,'snuff',Math.round(D));
        e.done=()=>{ if(L.lit&&B.engaged){ L.lit=false; ev('dglamp',L.m.id,0); } }; } }
    if(B.busy>0||B.mv) return;
    if(k.wailT<=0){ k.wailT=14;   // the barrow wail: the whole hall, but nobody within 8 m of a lit lamp
      castS(B,m,2.7,2.3); dgBossSafeTeleS(B,A.x,A.z,A.r+3,2.5,'wail',D*1.6,p=>k.lamps.some(L=>L.lit&&Math.hypot(L.x-p.x,L.z-p.z)<DG_LAMP_SAFE)); ev('roar',m.id);
      toastTo(null,'Haugbui draws breath to wail: stand by a lit lamp!','bad'); }
    else if(k.breathT<=0){ k.breathT=11;   // cold breath: a 26 m cone that slows; a pillar between you and him is cover
      faceS(m,C.p.x,C.p.z); castS(B,m,1.8,1.0); const mx=m.x, mz=m.z;
      dgBossSafeTeleS(B,mx,mz,26,1.5,'breath',D*1.8,p=>!dgBossLosS(A,mx,mz,p.x,p.z),p=>pfxS(p,'slow',2),m.face,52*DEG); }
  }
};

/* What implements each new primitive the dungeon bosses need (DG_BOSSES[..].needs; tools/dungeons-smoke.js checks that every need is here and every function exists).
   'client:<function>' marks one done on the client (game/combat/boss-dungeon.js), driven by the def's data (gloom: the mode in which the hall goes dark). */
const DG_BOSS_NEEDS=Object.assign(Object.create(null),{
  'new:zone-spore':dgBossSporeS, 'new:tele-cancel':dgBossCancelTeleS, 'new:tele-safe':dgBossSafeTeleS,
  'new:hit-hook':BOSS_KITS.dish.hit, 'new:stop-at-wall':dgBossGlideS,
  'new:channel':dgBossChannelS, 'new:gloom':'client:dgGloomTint'});
