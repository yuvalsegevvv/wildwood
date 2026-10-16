//@ The Hourkeeper's move set (Khet, the Sandglass): a scimitar sweep, glass shards under you, High Noon (a hall-wide pulse only a pillar's shade spares), sand imps, a sun lance, the radiant ring
/* Agent map: exports BOSS_KITS.hour (the kit contract of server/boss.js: start, tick, phase). Uses server/boss-fx.js (addTeleS, castS, faceS, pfxS, randPlayerS, playersInArena, inArenaS) and
   server/dungeons/boss-fx.js + boss-kits.js (dgBossSafeTeleS, dgBossLosS, dgBossMouthAddsS); the def is DG_BOSS_DEFS.khet (shared/dungeons/bosses.js, level 40). Nothing new is registered in DG_BOSS_NEEDS.
   Test: tools/sandglass-dungeon-smoke.js (the kit is registered and a fight tick runs), tools/dungeon-boss-smoke.js. Design and numbers: docs/DUNGEON-THEMES.md section 11.
   THE SIGNATURE, High Noon: he raises the glass and the sun pours down on the whole hall (a pulse with DG_NOON_WARN seconds of warning, 1.6 hits): only whoever stands behind one of the hall's four
   pillars (out of his line of sight) is spared. If the whole party is sheltered the glass cracks and he is stunned DG_NOON_STUN s (a stunned boss takes x1.5). Each Noon is a "turn of the glass" (the bar's number). */
const DG_NOON_WARN=2.6, DG_NOON_STUN=3, DG_IMP_MAX=6;
BOSS_KITS.hour={
  start(B){ B.k={sweepT:7,shardT:5,noonT:11,impT:99,lanceT:99,ringT:99,turns:0}; B.aux=0; },
  phase(B,m,n){
    if(n===2){ B.k.impT=3; B.k.lanceT=8; toastTo(null,'Khet shakes the glass: sand imps pour out of it!','bad'); }
    else { B.k.ringT=4; B.k.noonT=Math.min(B.k.noonT,6); toastTo(null,'Khet burns bright: the hour is almost up!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    k.sweepT-=dt; k.shardT-=dt; k.noonT-=dt; if(B.phase>=2){ k.impT-=dt; k.lanceT-=dt; } if(B.phase>=3) k.ringT-=dt;
    B.aux=k.turns;
    if(k.shardT<=0){ k.shardT=B.enraged?6:8;   // glass shards: three rings, the first two under players, then they shatter
      for(let i=0;i<3;i++){ let x,z; if(i<Math.min(2,C.inside.length)){ x=C.inside[i].x; z=C.inside[i].z; } else [x,z]=arenaPtS(A,A.r-3); addTeleS(B,x,z,3.2,1.5,'icefall',Math.round(D*1.0)); } }
    if(k.impT<=0){ k.impT=22; dgBossMouthAddsS(B,3,DG_IMP_MAX); }
    if(B.busy>0||B.mv) return;
    if(k.noonT<=0){ k.noonT=B.phase>=3?12:16; k.turns++; B.aux=k.turns;
      const mx=m.x, mz=m.z; castS(B,m,DG_NOON_WARN+0.2,2.3); ev('roar',m.id);
      const shade=p=>!dgBossLosS(A,mx,mz,p.x,p.z), e=dgBossSafeTeleS(B,A.x,A.z,A.r+3,DG_NOON_WARN,'pulse',D*1.6,shade), hurt=e.done;
      e.done=()=>{ const open=playersInArena(A,0).filter(p=>!shade(p)).length, any=playersInArena(A,0).length; hurt();
        if(B.engaged&&!m.dead&&any&&!open){ B.stunT=Math.max(B.stunT,DG_NOON_STUN); m.act=null; toastTo(null,'The glass cracks: Khet is stunned! Strike now!','good'); } };
      toastTo(null,'Khet raises the sandglass: get behind a pillar!','bad'); return; }
    if(k.ringT<=0){ k.ringT=B.enraged?9:12; castS(B,m,2.5,2.3); addTeleS(B,m.x,m.z,20,2.3,'donut',Math.round(D*1.9),0,6); ev('roar',m.id); return; }   // the radiant ring: only the middle, next to him, is safe
    if(k.lanceT<=0&&C.inside.length){ k.lanceT=9; const q=randPlayerS(C.inside); faceS(m,q.x,q.z); castS(B,m,1.5,1.0);   // the sun lance: a strip through one player that burns and slows
      addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(D*1.1),m.face,2.2).hit=p=>pfxS(p,'slow',2); return; }
    if(k.sweepT<=0&&C.dp<m.T.rad+3.5){ k.sweepT=B.enraged?5:7; faceS(m,C.p.x,C.p.z); castS(B,m,1.5,1.0);   // the scimitar sweep: a 120 degree arc that shoves you 14 m/s
      const e=addTeleS(B,m.x,m.z,7,1.2,'cleave',Math.round(D*1.2),m.face,Math.PI/3);
      e.hit=p=>{ const dx=p.x-e.x, dz=p.z-e.z, d=Math.hypot(dx,dz)||1; pfxS(p,'push',0,dx/d*14,dz/d*14); }; }
  }
};
