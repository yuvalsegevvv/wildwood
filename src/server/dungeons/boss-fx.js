//@ New boss primitives for the three dungeon bosses: a run's hall walls and line of sight, cancelling a telegraph, a telegraph with an exemption (cover behind a pillar, a lit lamp), the spore zone that slows, a glide that stops at the first wall, a channel on a prop (the cast bar)
/* Agent map: exports dgBossSolidS, dgBossLosS, dgBossCancelTeleS, dgBossHurtInS, dgBossSafeTeleS, dgBossSporeS, dgBossSporeTickS, dgBossRayS, dgBossGlideS, dgBossChannelS,
   dgBossChannelTickS; used by server/dungeons/boss-kits.js (BOSS_KITS.spore / dish / barrow; DG_BOSS_NEEDS there maps each `new:` need of DG_BOSSES to its function here).
   Test: tools/dungeon-boss-smoke.js. Built on server/boss-fx.js (addTeleS, addZoneS, moveBossS, pfxS...), which is not edited: the zone kind `spore` is registered in its ZONE_HIT below.
   The arena A is {x,z,r} like every boss arena, plus an optional A.solid(x,z): true in a wall or a pillar of a run's hall (dgHallArena in shared/dungeons/bosses.js). Without it (an open
   arena, as the world bosses have) the only wall is the arena's edge (A.r - 2, where boss.js stops the boss) and nothing gives cover. */

// is (x,z) inside a wall of the boss's hall? (open arena: beyond its edge)
const dgBossSolidS=(A,x,z)=>A.solid?A.solid(x,z):Math.hypot(x-A.x,z-A.z)>A.r-2;
// can (x0,z0) see (x1,z1) across the hall? sampled every half metre; in an open arena nothing blocks the view
function dgBossLosS(A,x0,z0,x1,z1){
  if(!A.solid) return true;
  const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/0.5);
  for(let i=1;i<n;i++){ const t=i/n; if(A.solid(x0+(x1-x0)*t,z0+(z1-z0)*t)) return false; }
  return true;
}
// take a telegraph back before it goes off (the client sees an unfired 'tend' and its warning fades): Amanita's puffball killed in time
function dgBossCancelTeleS(B,e){ const i=B.tele.indexOf(e); if(i<0) return false; B.tele.splice(i,1); ev('tend',e.id,0); return true; }
/* hurt every live player inside a shape that is not exempt: a circle of r round (x,z), or with half > 0 a cone (r long, half radians either side of the direction face,
   a direction being (-sin face, -cos face), as server/boss-fx.js measures cones). safe(p): true = exempt; hit(p): an extra effect on each player hurt */
function dgBossHurtInS(B,x,z,r,dmg,safe,hit,face,half){
  for(const p of S.players.values()){
    if(p.dead) continue;
    const dx=p.x-x, dz=p.z-z, d=Math.hypot(dx,dz);
    const inside=half>0?d<r+0.3&&(d<1.2||Math.abs(angDiff(Math.atan2(-dx,-dz),face))<half):d<r+0.3;
    if(!inside||(safe&&safe(p))) continue;
    if(dmg>0) hurtP(p,Math.round(dmg*AR(0.9,1.1)),B.m);
    if(hit) hit(p);
  }
}
/* a telegraph with an exemption (the doc's e.safe(p)): it warns like any other (kind: how the client draws it; a cone kind with face and half), but when it goes off
   it spares whoever safe(p) says, decided at that moment: behind a pillar from the boss (dgBossLosS), within reach of a lit lamp. Returns the telegraph. */
function dgBossSafeTeleS(B,x,z,r,dur,kind,dmg,safe,hit,face,half){
  const e=addTeleS(B,x,z,r,dur,kind,0,face,half);   // 0: boss-fx.js hurts nobody, the done step below does
  e.safe=safe; e.done=()=>dgBossHurtInS(B,x,z,r,dmg,safe,hit,face||0,half||0);
  return e;
}
/* the spore zone: a cloud that hurts like an ember pool (ZONE_HIT, ticked by boss-fx.js) and slows whoever stands in it (dgBossSporeTickS, from the kit's tick).
   The client tints it green (game/combat/boss-fx.js). */
ZONE_HIT.spore=[0.6,0.18];   // seconds between hits, share of the boss's hit each does (0.18 a tick, docs/DUNGEON-THEMES.md 4.1)
const DG_SPORE_SLOW=0.9;   // seconds of slow each tick in a cloud renews
const dgBossSporeS=(B,x,z,r,dur)=>addZoneS(B,'spore',x,z,r,dur);
function dgBossSporeTickS(B,dt){
  B.k.sporeT=(B.k.sporeT||0)-dt; if(B.k.sporeT>0) return; B.k.sporeT=ZONE_HIT.spore[0];
  for(const zn of B.zones) if(zn.kind==='spore') for(const p of S.players.values()) if(!p.dead&&Math.hypot(p.x-zn.x,p.z-zn.z)<zn.r+0.3) pfxS(p,'slow',DG_SPORE_SLOW);
}
/* how far the boss can go from where it stands along the direction ang (a direction is (-sin ang, -cos ang)) before its front meets a wall or a pillar, at most maxD:
   {d, x, z, wall} (wall: it stopped at one rather than at maxD). Its front is its radius ahead, and a little to either side, so it stops with its face at the stone. */
function dgBossRayS(B,ang,maxD){
  const m=B.m, A=B.A, ux=-Math.sin(ang), uz=-Math.cos(ang), R=m.T.rad, sx=-uz*R*0.6, sz=ux*R*0.6;
  let d=0;
  for(;d+0.5<=maxD;d+=0.5){ const fx=m.x+ux*(d+0.5+R), fz=m.z+uz*(d+0.5+R); if(dgBossSolidS(A,fx,fz)||dgBossSolidS(A,fx+sx,fz+sz)||dgBossSolidS(A,fx-sx,fz-sz)) return {d,x:m.x+ux*d,z:m.z+uz*d,wall:true}; }
  return {d,x:m.x+ux*d,z:m.z+uz*d,wall:false};
}
// a glide that stops at the first wall in its path (Gawataro's charge): moveBossS to where dgBossRayS stops, in dur seconds; returns the ray
function dgBossGlideS(B,ang,maxD,dur){ const R=dgBossRayS(B,ang,maxD); moveBossS(B,R.x,R.z,dur); return R; }
/* a channel: player p holds still for secs seconds (the cast bar: 'dgch' [pid, seconds, label] when it starts, 'dgchx' [pid] when it breaks), then done(p). It breaks if p walks more
   than 1.5 m from where they began, is knocked out, or leaves; one channel at a time for each player. Kept in B.k.ch, so a boss's reset or death drops every channel with it. */
const DG_CHANNEL_MOVE=1.5;
function dgBossChannelS(B,p,secs,label,done){
  const ch=B.k.ch||(B.k.ch=new Map()); if(ch.has(p.id)||p.dead) return false;
  ch.set(p.id,{p,end:S.t+secs,x:p.x,z:p.z,done}); ev('dgch',p.id,secs,label);
  return true;
}
function dgBossChannelTickS(B){
  const ch=B.k.ch; if(!ch) return;
  for(const [pid,c] of ch){
    const p=c.p;
    if(p.dead||S.players.get(pid)!==p||Math.hypot(p.x-c.x,p.z-c.z)>DG_CHANNEL_MOVE){ ch.delete(pid); ev('dgchx',pid); continue; }
    if(S.t>=c.end){ ch.delete(pid); c.done(p); }
  }
}
