//@ The Drowned Abbess's move set (Abbess Morrow, the Gloamvault): the wreckers' chain that hauls you in, brine pools, the Drowning Toll (a bell rung twice: stay close, then get out), drowned acolytes, a crypt quake, the requiem
/* Agent map: exports BOSS_KITS.toll (the kit contract of server/boss.js: start, tick, phase). Uses server/boss-fx.js (addTeleS, addZoneS, castS, faceS, pfxS, laterS, randPlayerS, playersInArena, arenaPtS, inArenaS) and
   server/dungeons/boss-fx.js + boss-kits.js (dgBossSafeTeleS, dgBossMouthAddsS, dgBossFreePtS); the def is DG_BOSS_DEFS.abbess (shared/dungeons/bosses.js, level 40). Nothing new is registered in DG_BOSS_NEEDS.
   Test: tools/gloamvault-dungeon-smoke.js (the kit is registered and a fight tick runs, the Toll hurts those outside and then those inside), tools/dungeon-boss-smoke.js. Design and numbers: docs/DUNGEON-THEMES.md section 12.
   THE SIGNATURE, the Drowning Toll: she rings the drowned bell. The first toll is a donut over the whole hall (DG_TOLL_WARN s of warning, 1.6 hits): only whoever stands within DG_TOLL_INNER m of her is spared.
   The second, DG_TOLL_GAP s after the first has gone off, is a burst of DG_TOLL_BURST m round her (1.4 hits): the spared must now get out. If neither toll hurt anyone the bell cracks and she is stunned
   DG_TOLL_STUN s (a stunned boss takes x1.5). Each pair of tolls is a "toll of the bell" (the bar's number). */
const DG_TOLL_WARN=2.6, DG_TOLL_GAP=1.5, DG_TOLL_INNER=6.5, DG_TOLL_BURST=8, DG_TOLL_STUN=3, DG_ACOLYTE_MAX=6;
BOSS_KITS.toll={
  start(B){ B.k={chainT:6,brineT:4,tollT:11,acolyteT:99,quakeT:99,requiemT:99,tolls:0,hurt:0}; B.aux=0; },
  phase(B,m,n){
    if(n===2){ B.k.acolyteT=3; B.k.quakeT=9; toastTo(null,'Morrow lifts her crozier: the drowned climb out of the water!','bad'); }
    else { B.k.requiemT=5; B.k.tollT=Math.min(B.k.tollT,6); toastTo(null,'Every bell in the vault begins to ring!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    k.chainT-=dt; k.brineT-=dt; k.tollT-=dt; if(B.phase>=2){ k.acolyteT-=dt; k.quakeT-=dt; } if(B.phase>=3) k.requiemT-=dt;
    B.aux=k.tolls;
    if(k.brineT<=0){ k.brineT=B.enraged?7:9;   // brine pools: three rings (the first two under players), then black water wells up and stays
      for(let i=0;i<3;i++){ let x,z; if(i<Math.min(2,C.inside.length)){ x=C.inside[i].x; z=C.inside[i].z; } else [x,z]=dgBossFreePtS(B,m.x,m.z,0);
        const e=addTeleS(B,x,z,3.4,1.4,'icefall',0); e.done=()=>{ if(B.engaged&&!m.dead) addZoneS(B,'gloom',x,z,3.6,8,0,0); }; } }
    if(k.acolyteT<=0){ k.acolyteT=22; dgBossMouthAddsS(B,3,DG_ACOLYTE_MAX); }
    if(k.quakeT<=0){ k.quakeT=13;   // the crypt quake: eight stones fall over 4 s, the first two near players
      for(let i=0;i<8;i++) laterS(B,i*0.5,()=>{ if(m.dead) return; const ins=playersInArena(A,4); let x,z; if(i<2&&ins.length){ const q=ins[i%ins.length]; x=q.x+AR(-1,1); z=q.z+AR(-1,1); } else [x,z]=arenaPtS(A,A.r-1);
        addTeleS(B,x,z,3,1.2,'rockfall',Math.round(D*0.8)); }); }
    if(B.busy>0||B.mv) return;
    if(k.tollT<=0){ k.tollT=B.phase>=3?12:16; k.tolls++; k.hurt=0; B.aux=k.tolls;
      const cx=m.x, cz=m.z, hit=()=>{ k.hurt++; };
      castS(B,m,DG_TOLL_WARN+DG_TOLL_GAP+0.4,2.3); ev('roar',m.id);
      const e1=dgBossSafeTeleS(B,cx,cz,A.r+3,DG_TOLL_WARN,'donut',Math.round(D*1.6),p=>Math.hypot(p.x-cx,p.z-cz)<DG_TOLL_INNER,hit,0,DG_TOLL_INNER), hurt1=e1.done;
      e1.done=()=>{ hurt1(); if(!B.engaged||m.dead) return;
        toastTo(null,'The second toll: get out!','bad');
        const e2=dgBossSafeTeleS(B,cx,cz,DG_TOLL_BURST,DG_TOLL_GAP,'icefall',Math.round(D*1.4),null,hit), hurt2=e2.done;
        e2.done=()=>{ const any=playersInArena(A,0).length; hurt2();
          if(B.engaged&&!m.dead&&any&&!k.hurt){ B.stunT=Math.max(B.stunT,DG_TOLL_STUN); m.act=null; toastTo(null,'The bell cracks: Morrow is stunned! Strike now!','good'); } }; };
      toastTo(null,'Morrow tolls the drowned bell: stay close to her!','bad'); return; }
    if(k.requiemT<=0){ k.requiemT=B.enraged?10:13; castS(B,m,2.0,2.3); ev('roar',m.id);   // the requiem: eight bursts of water round the hall's rim, one after the other
      const a0=AR(0,TAU);
      for(let i=0;i<8;i++) laterS(B,i*0.35,()=>{ if(m.dead) return; const a=a0+i*TAU/8; addTeleS(B,A.x+Math.sin(a)*(A.r-8),A.z+Math.cos(a)*(A.r-8),4,1.4,'icefall',Math.round(D*1.0)); });
      return; }
    if(k.chainT<=0&&C.inside.length){ k.chainT=B.enraged?7:10; const q=randPlayerS(C.inside); faceS(m,q.x,q.z); castS(B,m,1.3,1.0);   // the wreckers' chain: a strip through one player that hauls them in
      const e=addTeleS(B,m.x,m.z,24,1.2,'line',Math.round(D*1.1),m.face,2.0);
      e.hit=p=>{ const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz)||1; pfxS(p,'push',0,dx/d*13,dz/d*13); }; }
  }
};
