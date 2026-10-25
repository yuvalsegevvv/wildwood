//@ The Brood Queen's move set (Queen Ortha, the Termite Cathedral): resin pools, burrow strikes out of the wall, clutches of eggs that hatch unless you pop them all, broodlings, spirefall, the brood thrum
/* Agent map: exports BOSS_KITS.brood (the kit contract of server/boss.js: start, tick, phase). Uses server/boss-fx.js (addTeleS, addZoneS, castS, faceS, pfxS, laterS, randPlayerS, playersInArena, arenaPtS,
   spawnMonS, removeMonS) and server/dungeons/boss-fx.js + boss-kits.js (dgBossHurtInS, dgBossCancelTeleS, dgBossMouthAddsS, dgBossFreePtS); the def is DG_BOSS_DEFS.ortha (shared/dungeons/bosses.js, level 45).
   Nothing new is registered in DG_BOSS_NEEDS (the egg's cancelled warning is 'new:tele-cancel', Amanita's). Test: tools/termite-dungeon-smoke.js, tools/dungeon-boss-smoke.js. Design and numbers: docs/DUNGEON-THEMES.md section 13.
   THE SIGNATURE, the Egg Clusters: she lays clutches of DG_EGG_PER eggs (3 clutches, 4 enraged), each clutch a knot of eggs 2.5 m across, at least 6 m from her, every egg under a DG_EGG_WARN second warning. An egg
   left standing hatches: it hurts everyone within DG_EGG_R (1.2 hits) and a broodling climbs out. An egg you pop (kill) takes its hatching with it. If a clutch is popped whole (every egg of it, none hatched) the
   Queen is stunned DG_EGG_STUN s (a stunned boss takes x1.5): the party splits to reach every clutch in time. */
const DG_EGG_WARN=9, DG_EGG_R=3.5, DG_EGG_PER=3, DG_EGG_STUN=4, DG_BROOD_MAX=6;
// one egg hatches: a burst round it and a broodling out of it, unless the hall already holds DG_BROOD_MAX
function dgEggHatchS(B,m,o){
  if(o.pb.dead||o.pb.remove||!B.engaged||m.dead) return;
  dgBossHurtInS(B,o.x,o.z,DG_EGG_R,m.T.dmg*1.2);
  o.clutch.hatched=true; removeMonS(o.pb);
  if(B.adds.filter(a=>a.def===B.bd.add&&!a.dead&&!a.remove).length<DG_BROOD_MAX) spawnAddsS(B,1,o.x,o.z,0.5);
}
// n clutches of DG_EGG_PER eggs each; the toast says what to do
function dgEggsOutS(B,m,n){
  const K=B.k;
  for(let c=0;c<n;c++){
    const [cx,cz]=dgBossFreePtS(B,m.x,m.z,6), clutch={left:DG_EGG_PER,hatched:false,done:false};
    for(let i=0;i<DG_EGG_PER;i++){
      const a=i*TAU/DG_EGG_PER+AR(0,1), x=cx+Math.sin(a)*1.25, z=cz+Math.cos(a)*1.25, pb=spawnMonS(B.bd.prop,x,z,{x,z},true); B.adds.push(pb);
      const o={pb,x,z,clutch,e:null};
      o.e=addTeleS(B,x,z,DG_EGG_R,DG_EGG_WARN,'puff',0); o.e.done=()=>dgEggHatchS(B,m,o);
      K.eggs.push(o);
    }
  }
  toastTo(null,'Ortha lays clutches of eggs: pop every egg of a clutch before they hatch!','bad');
}
BOSS_KITS.brood={
  start(B){ B.k={resinT:6,burrowT:4,eggT:9,broodT:99,fallT:99,thrumT:99,eggs:[],lost:0}; B.aux=0; },
  phase(B,m,n){
    if(n===2){ B.k.broodT=3; B.k.fallT=9; toastTo(null,'Ortha thrums: broodlings pour out of the galleries!','bad'); }
    else { B.k.thrumT=5; B.k.eggT=Math.min(B.k.eggT,6); toastTo(null,'The whole spire begins to thrum!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    k.eggs=k.eggs.filter(o=>{   // an egg popped in time takes its hatching with it; a clutch popped whole stuns her
      if(o.pb.dead&&!o.pb.remove&&!o.gone){ o.gone=true; dgBossCancelTeleS(B,o.e); if(--o.clutch.left<=0&&!o.clutch.hatched&&!o.clutch.done){ o.clutch.done=true; k.lost++; B.stunT=Math.max(B.stunT,DG_EGG_STUN); m.act=null; toastTo(null,'A whole clutch is lost: Ortha reels! Strike now!','good'); } }
      return !o.gone&&!o.pb.remove&&B.tele.includes(o.e); });
    B.aux=k.eggs.length;
    k.resinT-=dt; k.burrowT-=dt; k.eggT-=dt; if(B.phase>=2){ k.broodT-=dt; k.fallT-=dt; } if(B.phase>=3) k.thrumT-=dt;
    if(k.resinT<=0){ k.resinT=B.enraged?7:9;   // resin pools: three rings (the first two under players), then the resin pools and stays
      for(let i=0;i<3;i++){ let x,z; if(i<Math.min(2,C.inside.length)){ x=C.inside[i].x; z=C.inside[i].z; } else [x,z]=dgBossFreePtS(B,m.x,m.z,0);
        const e=addTeleS(B,x,z,3.4,1.4,'icefall',0); e.done=()=>{ if(B.engaged&&!m.dead) addZoneS(B,'gloom',x,z,3.6,8,0,0); }; } }
    if(k.burrowT<=0&&C.inside.length){ k.burrowT=B.enraged?6:8;   // burrow strikes: a strip out of the wall through a player (two players from phase 2, three enraged)
      const n=Math.min(C.inside.length,B.enraged?3:B.phase>=2?2:1), ins=C.inside.slice();
      for(let i=0;i<n;i++){ const q=ins.splice(Math.floor(Math.random()*ins.length),1)[0], a=Math.atan2(q.x-A.x,q.z-A.z), rx=A.x+Math.sin(a)*(A.r-1), rz=A.z+Math.cos(a)*(A.r-1), face=Math.atan2(-(q.x-rx),-(q.z-rz));
        addTeleS(B,rx,rz,Math.hypot(q.x-rx,q.z-rz)+6,1.5,'line',Math.round(D*1.1),face,1.9); } }
    if(k.broodT<=0){ k.broodT=22; dgBossMouthAddsS(B,3,DG_BROOD_MAX); }
    if(k.fallT<=0){ k.fallT=13;   // spirefall: eight lumps of clay over 4 s, the first two near players
      for(let i=0;i<8;i++) laterS(B,i*0.5,()=>{ if(m.dead) return; const ins=playersInArena(A,4); let x,z; if(i<2&&ins.length){ const q=ins[i%ins.length]; x=q.x+AR(-1,1); z=q.z+AR(-1,1); } else [x,z]=arenaPtS(A,A.r-1);
        addTeleS(B,x,z,3,1.2,'rockfall',Math.round(D*0.8)); }); }
    if(B.busy>0||B.mv) return;
    if(k.eggT<=0&&k.eggs.length===0){ k.eggT=B.phase>=3?20:24; castS(B,m,1.6,2.3); ev('roar',m.id); dgEggsOutS(B,m,B.enraged?4:3); return; }
    if(k.thrumT<=0){ k.thrumT=B.enraged?10:13; castS(B,m,2.0,2.3); ev('roar',m.id);   // the brood thrum: eight bursts round the rim, one after the other, each slowing
      const a0=AR(0,TAU);
      for(let i=0;i<8;i++) laterS(B,i*0.35,()=>{ if(m.dead) return; const a=a0+i*TAU/8, e=addTeleS(B,A.x+Math.sin(a)*(A.r-8),A.z+Math.cos(a)*(A.r-8),4,1.4,'icefall',Math.round(D*1.0)); e.hit=p=>pfxS(p,'slow',2); }); }
  }
};
