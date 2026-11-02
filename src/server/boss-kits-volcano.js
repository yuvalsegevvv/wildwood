//@ Pyrrhax, the Sinkwarden (level 50, the volcano isle's end boss): a three-part fight (four Guarding Wardens, the crater, the eruption with landing windows), three lives that revive on the spot, and the talisman drop
/* Agent map (design and numbers: docs/VOLCANO.md; data: shared/emberwake-bosses.js SINK_*, shared/talisman.js; the boss contract: boss.js)
   owns:    BOSS_KITS.sinkwarden (init / start / tick / phase), vbPartDownS (damageMonsterS asks it when the boss' pool reaches 0: part 2 ends in the eruption), vbReviveP (the player tick: a knock-out inside the arena
            wakes on the spot while the hiker has lives left), vbRewardP (rewardKill: the talisman), VB_LIVES.
   parts:   B.part 1 = the four Guarding Wardens (the boss is hidden and immune; its bar mirrors the wardens' health), 2 = the crater (the boss itself), 3 = the eruption (berserk: it flies, immune, bombards; it lands for a
            window of VB_WINDOW seconds in which it is stunned and takes x1.5, then fights on the ground a while and takes off again). Each part's pool is SINK_PART_K x a full boss's health (m.hpDiv halves every hit, so the bar reads 100% a part; m.maxHp).
   hooks:   boss.js (parts bosses skip the shared 60% / 30% phases; a fight is not reset while a knocked-out hiker waits to revive), combat.js (damageMonsterS, rewardKill), players.js (hurtP grace, the dead tick).
   test:    tools/volcano-smoke.js */
const VB_LIVES=3, VB_REVIVE_AFTER=3, VB_GRACE=2.5, VB_WINDOW=7, VB_AIR=15, VB_GROUND=6;
const vbBossS=()=>BOSSES.find(B=>B.bd.parts&&B.bd.def.id==='sinkwarden');
const vbWardens=B=>B.adds.filter(a=>a.def.id==='sinkguard'&&!a.dead&&!a.remove);
const vbDmg=(B,m,k)=>Math.round(m.T.dmg*k*(B.part===3?1.25:1));   // berserk: part 3 hits a quarter harder
// the boss' health bar mirrors the wardens' in part 1: their combined health as a share of the pool
function vbMirrorS(B,m){ const w=B.adds.filter(a=>a.def.id==='sinkguard'); let hp=0, mx=0; for(const a of w){ mx+=a.maxHp; hp+=a.dead||a.remove?0:Math.max(0,a.hp); } m.hp=mx>0?m.maxHp*hp/mx:m.maxHp; }
function vbSetPartS(B,m,n){
  B.part=n; B.phase=n; m.maxHp=m.hp=m.T.hp; m.hpDiv=SINK_PART_K;   // (the bar is 100% a part: the pool is twice a boss because every hit counts 1 / SINK_PART_K, damageMonsterS)
  B.aux=n===1?SINK_WARDENS:0;
}
function vbWardensS(B,m){
  const A=B.A, T=SINK_WARDENS;
  for(let i=0;i<T;i++){ const a=i/T*TAU+0.4, x=A.x+Math.sin(a)*(A.r*0.55), z=A.z+Math.cos(a)*(A.r*0.55), w=spawnMonS(SINK_GUARD_DEF,x,z,{x:A.x,z:A.z},true); w.aggro=true; w.leash=1e4; const p=nearestFighter(x,z,80); w.tgt=p?p.id:null; B.adds.push(w); }
}
// part 2: the boss comes up out of the crater
function vbCraterS(B,m){
  vbSetPartS(B,m,2); B.mode=0; m.immune=false; B.busy=0; B.k.lavaT=3; B.k.breathT=6; B.k.leapT=9; B.k.ringT=13; B.k.spawnT=20; m.x=B.A.x; m.z=B.A.z; ev('roar',m.id);
  toastTo(null,'The wardens are down: Pyrrhax rises out of the crater!','bad');
}
// the eruption: part 3 begins. The ground shakes (a ring of falling rock), then it takes off
function vbEruptS(B,m){
  vbSetPartS(B,m,3); B.enraged=true; m.immune=true; B.k.air=false; B.k.fire=0; clearTeleS(B); B.busy=1e3; B.mode=0; ev('roar',m.id); ev('mact',m.id,2.6);
  toastTo(null,'The volcano erupts! Pyrrhax goes berserk!','bad');
  const A=B.A;
  for(let i=0;i<10;i++) laterS(B,0.3+i*0.35,()=>{ if(m.dead) return; const [x,z]=arenaPtS(A,A.r-3); addTeleS(B,x,z,4,1.0,'rockfall',vbDmg(B,m,1.2)); });
  laterS(B,4.2,()=>{ if(!m.dead) vbTakeoffS(B,m); });
}
function vbTakeoffS(B,m){
  B.k.air=true; B.k.airT=VB_AIR; B.mode=1; m.immune=true; B.busy=1e3; B.stunT=0; B.k.fireT=1.5; B.k.rainT=5; B.k.sweepT=8; ev('roar',m.id);
  moveBossS(B,B.A.x,B.A.z,1.5);
  toastTo(null,'Pyrrhax takes to the air!','bad');
}
// the dive: it picks the farthest hiker's spot, lands there after 1.6 s and is stunned for a landing window
function vbLandS(B,m,C){
  const q=farPlayerS(m,C.inside)||C.p, [x,z]=inArenaS(B.A,q.x,q.z,B.A.r-5);
  B.k.air=false; B.k.diving=true; clearTeleS(B);
  addTeleS(B,x,z,9,1.7,'slam',vbDmg(B,m,2.2)).hit=p=>{ pfxS(p,'slow',2); };
  moveBossS(B,x,z,1.5);
  laterS(B,1.8,()=>{ if(m.dead) return; B.k.diving=false; B.mode=0; m.immune=false; B.mv=null; B.busy=0; B.stunT=VB_WINDOW; ev('mact',m.id,2.4); ev('roar',m.id); toastTo(null,'Pyrrhax has landed: hit him now!','good');
    laterS(B,VB_WINDOW,()=>{ B.k.groundT=VB_GROUND; B.k.breathT=1.5; B.k.lavaT=3; }); });
}
function vbLavaS(B,m,C){
  const n=B.part===3?4:3; castS(B,m,1.3,1.0);
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside)||C.p, [x,z]=inArenaS(B.A,q.x+AR(-3,3),q.z+AR(-3,3),B.A.r-2);
    addTeleS(B,x,z,3.6,1.3+i*0.2,'geyser',vbDmg(B,m,1.2)).done=e=>{ if(B.engaged&&!m.dead&&B.zones.length<10) addZoneS(B,'ember',e.x,e.z,2.8,6); }; }
}
function vbBreathS(B,m,C){
  faceS(m,C.p.x,C.p.z); castS(B,m,2.0,1.0); const a=Math.atan2(-(C.p.x-m.x),-(C.p.z-m.z));
  addTeleS(B,m.x,m.z,24,1.4,'breath',vbDmg(B,m,1.8),a,0.45);
  laterS(B,1.0,()=>{ if(!m.dead) addTeleS(B,m.x,m.z,24,1.2,'breath',vbDmg(B,m,1.8),a+0.9,0.45); });
}
function vbLeapS(B,m,C){
  const q=C.p, x=q.x, z=q.z; castS(B,m,2.0,1.0);
  addTeleS(B,x,z,6,1.3,'slam',vbDmg(B,m,1.9)).hit=p=>{ pfxS(p,'slow',1.5); };
  laterS(B,0.5,()=>{ if(!m.dead&&!B.k.air) moveBossS(B,x,z,0.8); });
}
function vbRingS(B,m){
  castS(B,m,1.8,1.0); addTeleS(B,m.x,m.z,B.A.r,1.6,'donut',vbDmg(B,m,1.6),0,7);   // stand close to him: the safe middle
}
// in the air: it circles the crater and bombards
function vbAirTickS(B,m,dt,C){
  const k=B.k; k.airT-=dt; k.fireT-=dt; k.rainT-=dt; k.sweepT-=dt;
  if(!B.mv){ const a=S.t*0.5, [x,z]=[B.A.x+Math.sin(a)*14,B.A.z+Math.cos(a)*14]; moveBossS(B,x,z,1.2); }
  if(k.fireT<=0){ k.fireT=B.enraged?2.2:3; const n=Math.min(C.inside.length+1,4); for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside)||C.p; addTeleS(B,q.x,q.z,3.4,1.2+i*0.15,'circle',vbDmg(B,m,1.3)).done=e=>{ if(B.engaged&&!m.dead&&B.zones.length<10) addZoneS(B,'ember',e.x,e.z,2.4,5); }; } }
  if(k.rainT<=0){ k.rainT=9; for(let i=0;i<8;i++) laterS(B,i*0.25,()=>{ if(m.dead) return; const [x,z]=arenaPtS(B.A,B.A.r-3); addTeleS(B,x,z,4,1.0,'rockfall',vbDmg(B,m,1.2)); }); }
  if(k.sweepT<=0){ k.sweepT=11; const A=B.A, a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), px=uz, pz=-ux;
    for(let i=0;i<3;i++) laterS(B,i*0.8,()=>{ if(m.dead) return; const q=randPlayerS(C.inside)||C.p, off=(q.x-A.x)*px+(q.z-A.z)*pz; addTeleS(B,A.x+px*off-ux*A.r,A.z+pz*off-uz*A.r,2*A.r,1.1,'line',vbDmg(B,m,1.5),a,2.5); }); }
  if(k.airT<=0&&!k.diving) vbLandS(B,m,C);
}
BOSS_KITS.sinkwarden={
  init(B,m){ m.maxHp=m.hp=m.T.hp; m.hpDiv=SINK_PART_K; },   // (the bar of the sleeping boss is part 1's pool)
  start(B,m){
    B.k={}; B.lives=new Map(); B.enraged=false; vbSetPartS(B,m,1); m.immune=true; B.mode=2; B.busy=1e3; B.k.lavaT=6; B.k.pulseT=14;
    vbWardensS(B,m); toastTo(null,'Three lives each: you wake on the spot until they are spent.','good');
  },
  phase(){},   // (the shared 60% / 30% phases are off for a parts boss)
  tick(B,m,dt,C){
    const k=B.k;
    if(B.part===1){
      vbMirrorS(B,m); const w=vbWardens(B); B.aux=w.length;
      for(const a of w){ const d=Math.hypot(a.x-B.A.x,a.z-B.A.z), lim=B.A.r-4; if(d>lim){ a.x=B.A.x+(a.x-B.A.x)/d*lim; a.z=B.A.z+(a.z-B.A.z)/d*lim; }   // the wardens never leave the pit
        if(!a.aggro||!S.players.get(a.tgt)||S.players.get(a.tgt).dead){ a.aggro=true; a.tgt=C.p.id; a.state='chase'; } }
      k.lavaT-=dt; k.pulseT-=dt;
      if(k.lavaT<=0&&C.inside.length){ k.lavaT=9; for(let i=0;i<2;i++){ const q=i===0?C.p:randPlayerS(C.inside)||C.p; addTeleS(B,q.x,q.z,3.4,1.3,'geyser',vbDmg(B,m,1.0)); } }
      if(k.pulseT<=0&&w.length){ k.pulseT=16; addTeleS(B,B.A.x,B.A.z,B.A.r,2.0,'donut',vbDmg(B,m,1.3),0,6); }   // the crater's heat: the middle is safe
      if(!w.length){ vbCraterS(B,m); }
      return;
    }
    if(B.part===3&&k.air){ vbAirTickS(B,m,dt,C); return; }
    if(B.part===3){
      if(k.diving||B.busy>0) return;
      k.groundT=(k.groundT===undefined?VB_GROUND:k.groundT)-dt; k.breathT=(k.breathT||0)-dt; k.lavaT=(k.lavaT||0)-dt;
      if(k.groundT<=0){ vbTakeoffS(B,m); return; }
      if(k.breathT<=0){ k.breathT=5; vbBreathS(B,m,C); } else if(k.lavaT<=0){ k.lavaT=6; vbLavaS(B,m,C); }
      return;
    }
    // part 2
    k.lavaT-=dt; k.breathT-=dt; k.leapT-=dt; k.ringT-=dt; k.spawnT-=dt;
    if(B.busy>0||B.mv) return;
    if(k.ringT<=0){ k.ringT=15; vbRingS(B,m); }
    else if(k.spawnT<=0){ k.spawnT=26; spawnAddsS(B,2); ev('roar',m.id); }
    else if(k.leapT<=0){ k.leapT=11; vbLeapS(B,m,C); }
    else if(k.breathT<=0){ k.breathT=8; vbBreathS(B,m,C); }
    else if(k.lavaT<=0){ k.lavaT=7; vbLavaS(B,m,C); }
  }
};
// damageMonsterS: the boss' pool reached 0. In part 2 that is the eruption, not a death (returns true); in part 3 it is the end
function vbPartDownS(m){
  const B=m.B; if(!B||!B.bd.parts||B.part!==2) return false;
  m.hp=m.maxHp; vbEruptS(B,m); return true;
}
// the player tick: a knock-out inside the engaged arena wakes on the spot after VB_REVIVE_AFTER seconds while lives are left (3 a hiker a fight)
function vbReviveP(p){
  const B=vbBossS(); if(!B||!B.engaged||B.m.dead||p.pv||p.inst) return false;
  if(Math.hypot(p.x-B.A.x,p.z-B.A.z)>B.A.r+6) return false;
  const used=B.lives.get(p.id)||0; if(used>=VB_LIVES) return false;
  if(p.deadT<VB_REVIVE_AFTER) return null;
  B.lives.set(p.id,used+1); p.dead=false; p.hp=Math.round(p.maxHp*0.6); p.lastHit=S.t; p.vbGrace=S.t+VB_GRACE; p.dirty=true; ev('up',p.id);
  toastTo(p.id,'Revived on the spot: '+(VB_LIVES-used-1)+' '+(VB_LIVES-used-1===1?'life':'lives')+' left','good');
  return true;
}
// a knock-out the arena will revive keeps the fight going (boss.js asks): somebody dead inside with lives left
function vbWaitingS(B){
  for(const p of S.players.values()) if(p.dead&&!p.pv&&Math.hypot(p.x-B.A.x,p.z-B.A.z)<B.A.r+6&&(B.lives.get(p.id)||0)<VB_LIVES) return true;
  return false;
}
// rewardKill: each hiker who hit the boss rolls one talisman: the kind at random, the rarity by the zone tier fought at (80/15/4/0.8/0.2 at +0 to 50/25/15/7/3 at +5)
function vbRewardP(q,m){
  const t=monTierOf(q.gear,m), rar=talRarityOf(Math.random(),t), stat=TAL_STATS[Math.floor(Math.random()*TAL_STATS.length)];
  dgGrantItemP(q,dgTalismanId(stat,rar,0));
  toastTo(q.id,'Pyrrhax has fallen: you have beaten Wildwood!','good');
}
