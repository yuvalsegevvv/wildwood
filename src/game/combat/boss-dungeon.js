//@ The dungeon bosses on the client: their defs in the roster lookup, what the boss bar's number means for each (dish, puffballs, lamps), Haugbui's lamps going dark and lit again, the relight channel's cast bar, and the gloom of his blackout
/* Agent map: registers the boss, add and prop defs of DG_BOSS_DEFS (shared/dungeons/bosses.js) in DEF_BY_ID (combat/monsters.js), so the client can make their views; fills EVH.dglamp,
   EVH.dgch, EVH.dgchx (net/client.js's handler table: this file loads after it, see src/manifest.json); dgBossBarText (called by updateBossUI, combat/boss.js); dgGloomTint (called by
   updateEnv, world/time-of-day.js). The telegraph looks (spore puff pulse vent wail snuff) are in combat/boss.js, the spore cloud in combat/boss-fx.js, Haugbui's model in
   combat/monster-spirits.js. Server side: server/dungeons/boss-kits.js; tests: tools/dungeon-boss-smoke.js (fights and models), tools/client-smoke.js (the page boots with this file). */
for(const id in DG_BOSS_DEFS){ const r=DG_BOSS_DEFS[id]; for(const d of [r.def,r.add,r.prop]) if(d) DEF_BY_ID[d.id]=d; }
// the boss bar for a dungeon boss in no mode of its own: its number as its row says it ("Dish: 64%", "Puffballs swelling: 3", "Lamps lit: 2 of 4"); '' = the usual text
function dgBossBarText(bd,bar){
  if(!bd||!bd.auxBar||BOSS.stunned||BOSS.mode===3||bar[BOSS.mode]) return '';
  return bd.auxBar.replace('{n}',BOSS.aux)+(BOSS.enraged?' · Enraged':'');
}
// Haugbui's lamps (props, server/dungeons/boss-kits.js): 'dglamp' [lamp monster id, 1 lit / 0 dark]; a dark lamp loses its glow
const DG_LAMP_GLOW=DG_BOSS_DEFS.haugbui.prop.glow;
EVH.dglamp=e=>{ const m=MON_BY_ID.get(e[1]); if(m) m.mat.userData.glow.setHex(e[2]?DG_LAMP_GLOW:0x000000); };
// a channel on a boss's prop (relighting a lamp): 'dgch' [pid, seconds, label] shows the professions' cast bar (economy/professions.js), 'dgchx' [pid] takes it down (walking off breaks it)
EVH.dgch=e=>{ if(e[1]!==NET.pid) return; Object.assign(CAST,{on:true,t0:t,dur:Math.max(0.1,e[2]),x:P.x,z:P.z}); cbName.textContent=e[3]||'Channelling'; cbFill.style.width='0%'; castBar.hidden=false; };
EVH.dgchx=e=>{ if(e[1]===NET.pid) hideCast(); };
/* the gloom: while the boss you fight is in its row's `gloom` mode (Haugbui's blackout, mode 2) and you are in its hall, your sight shrinks to about 10 m and the light dies;
   eased in and out over about half a second. s: the sky state updateEnv is about to apply (the fog's near end is the scene's own, given back when the gloom lifts). */
const DG_GLOOM={k:0,near0:null,far:12,near:2}, dgGloomCol=new THREE.Color(0x05070c);
function dgGloomTint(s,dt){
  const m=BOSS.m, bd=m&&bossInfo(m), A=m&&arenaOf(m);
  const want=bd&&bd.gloom!==undefined&&BOSS.engaged&&!m.dead&&BOSS.mode===bd.gloom&&Math.hypot(P.x-A.x,P.z-A.z)<A.r+12?1:0;
  DG_GLOOM.k+=(want-DG_GLOOM.k)*Math.min(1,(dt||0.016)*2.5); if(!want&&DG_GLOOM.k<0.002) DG_GLOOM.k=0;
  const k=DG_GLOOM.k;
  if(!k){ if(DG_GLOOM.near0!==null){ scene.fog.near=DG_GLOOM.near0; DG_GLOOM.near0=null; } return; }
  if(DG_GLOOM.near0===null) DG_GLOOM.near0=scene.fog.near;
  scene.fog.near=lerp(DG_GLOOM.near0,DG_GLOOM.near,k); s.far=lerp(s.far,DG_GLOOM.far,k);
  s.fog.lerp(dgGloomCol,k*0.85); s.sky.lerp(dgGloomCol,k*0.85); s.hor.lerp(dgGloomCol,k*0.85); s.sunI*=1-0.85*k; s.hi*=1-0.6*k;
}
