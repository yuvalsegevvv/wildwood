//@ The Star-Masked's move set (Ahmetl, the Cenote of Hollow Stars): an obsidian blade, falling stars under you, Hollow Stars (a hall-wide pulse that only a lit star's circle spares), star shades, a moon lance, the eclipse ring
/* Agent map: exports BOSS_KITS.stars (the kit contract of server/boss.js: start, tick, phase). Uses server/boss-fx.js (addTeleS, castS, faceS, pfxS, randPlayerS, playersInArena, arenaPtS) and
   server/dungeons/boss-fx.js + boss-kits.js (dgBossSafeTeleS, dgBossMouthAddsS, dgBossFreePtS); the def is DG_BOSS_DEFS.ahmetl (shared/dungeons/bosses.js, level 48). Nothing new is registered in DG_BOSS_NEEDS.
   Test: tools/cenote-dungeon-smoke.js (the kit is registered and a fight tick runs), tools/dungeon-boss-smoke.js. Design and numbers: docs/DUNGEON-THEMES.md section 14.
   THE SIGNATURE, Hollow Stars: the mask goes dark and DG_STARS_N stars (four enraged) light on the floor of the hall, each a circle of DG_STAR_R m (drawn as a harmless ice-blue ring); DG_STARS_WARN seconds later a pulse
   (1.6 hits) sweeps the whole hall and spares only whoever stands inside a lit star. If the whole party is sheltered the mask cracks and he is stunned DG_STARS_STUN s (a stunned boss takes x1.5).
   Each pulse is a "star that fell" (the bar's number). */
const DG_STARS_WARN=3.0, DG_STARS_STUN=3, DG_STARS_N=3, DG_STAR_R=3.2, DG_SHADE_MAX=6;
BOSS_KITS.stars={
  start(B){ B.k={bladeT:7,fallT:5,starsT:11,shadeT:99,lanceT:99,ringT:99,fell:0}; B.aux=0; },
  phase(B,m,n){
    if(n===2){ B.k.shadeT=3; B.k.lanceT=8; toastTo(null,'Ahmetl turns his mask: star shades slip out of the dark!','bad'); }
    else { B.k.ringT=4; B.k.starsT=Math.min(B.k.starsT,6); toastTo(null,'Ahmetl\'s mask is black: the last star is falling!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A, D=m.T.dmg;
    k.bladeT-=dt; k.fallT-=dt; k.starsT-=dt; if(B.phase>=2){ k.shadeT-=dt; k.lanceT-=dt; } if(B.phase>=3) k.ringT-=dt;
    B.aux=k.fell;
    if(k.fallT<=0){ k.fallT=B.enraged?6:8;   // falling stars: three rings, the first two under players, then they land
      for(let i=0;i<3;i++){ let x,z; if(i<Math.min(2,C.inside.length)){ x=C.inside[i].x; z=C.inside[i].z; } else [x,z]=arenaPtS(A,A.r-3); addTeleS(B,x,z,3.2,1.5,'icefall',Math.round(D*1.0)); } }
    if(k.shadeT<=0){ k.shadeT=22; dgBossMouthAddsS(B,3,DG_SHADE_MAX); }
    if(B.busy>0||B.mv) return;
    if(k.starsT<=0){ k.starsT=B.phase>=3?12:16; k.fell++; B.aux=k.fell;
      const n=B.enraged?DG_STARS_N+1:DG_STARS_N, spots=[]; castS(B,m,DG_STARS_WARN+0.2,2.3); ev('roar',m.id);
      for(let i=0;i<n;i++){ const [x,z]=dgBossFreePtS(B,m.x,m.z,4); spots.push([x,z]); addTeleS(B,x,z,DG_STAR_R,DG_STARS_WARN,'icefall',0); }   // (the lit stars: harmless rings)
      const lit=p=>spots.some(s=>Math.hypot(p.x-s[0],p.z-s[1])<DG_STAR_R), e=dgBossSafeTeleS(B,A.x,A.z,A.r+3,DG_STARS_WARN,'pulse',D*1.6,lit), hurt=e.done;
      e.done=()=>{ const open=playersInArena(A,0).filter(p=>!lit(p)).length, any=playersInArena(A,0).length; hurt();
        if(B.engaged&&!m.dead&&any&&!open){ B.stunT=Math.max(B.stunT,DG_STARS_STUN); m.act=null; toastTo(null,'The mask cracks: Ahmetl is stunned! Strike now!','good'); } };
      toastTo(null,'Ahmetl\'s mask goes dark: stand in a lit star!','bad'); return; }
    if(k.ringT<=0){ k.ringT=B.enraged?9:12; castS(B,m,2.5,2.3); addTeleS(B,m.x,m.z,20,2.3,'donut',Math.round(D*1.9),0,6); ev('roar',m.id); return; }   // the eclipse ring: only the middle, next to him, is safe
    if(k.lanceT<=0&&C.inside.length){ k.lanceT=9; const q=randPlayerS(C.inside); faceS(m,q.x,q.z); castS(B,m,1.5,1.0);   // the moon lance: a strip through one player that burns and slows
      addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(D*1.1),m.face,2.2).hit=p=>pfxS(p,'slow',2); return; }
    if(k.bladeT<=0&&C.dp<m.T.rad+3.5){ k.bladeT=B.enraged?5:7; faceS(m,C.p.x,C.p.z); castS(B,m,1.5,1.0);   // the obsidian blade: a 120 degree arc that shoves you 14 m/s
      const e=addTeleS(B,m.x,m.z,7,1.2,'cleave',Math.round(D*1.2),m.face,Math.PI/3);
      e.hit=p=>{ const dx=p.x-e.x, dz=p.z-e.z, d=Math.hypot(dx,dz)||1; pfxS(p,'push',0,dx/d*14,dz/d*14); }; }
  }
};
