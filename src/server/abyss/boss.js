//@ The Abyss's boss rounds (B9): the draw over the whitelist, abBossS (the run's boss, made as dgBossS makes a dungeon's), the keeper that holds it on its disc, and the end of a run boss (no world reward)
/* agent map (docs/ABYSS.md section 3h; the pool and the whitelist: shared/abyss/boss.js)
   exports: abBossDrawS(avoid) (one id of AB_BOSS_OK, not in `avoid` while another is left; '' with an empty whitelist), abBossS(run), abBossSetupS(run), abBossTickS(run,dt), abBossDownS(m) (the bossDefeatedS hook)
   uses: makeBossS (server/boss.js), dgAdoptS (dungeons/mobs.js: levels it at run.L, plain defAt, S.ctx = the run), dgHallArena (the arena {x,z,r,solid} of the bake's boss circle, r = 20 at the disc's middle)
   A boss round: run.abKind 'boss', run.abBoss = the boss's id, run.B.boss = the disc's circle (abRunNewS), the boss appears at once and engages when the hiker steps into its circle (updateBossS, ticked by the run with its adds: all adopted by the run,
   m.inst = the run id). Its death is the round's win (kit.onBossDead -> abRoundWonS: 3 artifact picks, the finale's run win on a finite difficulty's last round). m.abBoss marks it: bossDefeatedS hands it to abBossDownS (a toast to the hiker, its adds
   and fx cleared); rewardKill never runs for a run's monsters and rewardAllS skips an Abyss run, so no trophy, set roll, tier, quest step, stirring, XP or coin is ever paid.
   test: tools/abyss-smoke.js */
function abBossDrawS(avoid){
  let list=AB_BOSS_OK.filter(id=>!avoid||avoid.indexOf(id)<0); if(!list.length) list=AB_BOSS_OK;
  return list.length?list[Math.floor(Math.random()*list.length)]:'';
}
function abBossS(run){
  if(run.boss||run.endT||!run.B.boss) return run.boss;
  const bd=abBossRowOf(run.abBoss); if(!bd||!BOSS_KITS[bd.kit]) return null;
  const A=dgHallArena(run.B,run.ox,run.oz), c0=S.ctx; S.ctx=run.id;
  const B=makeBossS(bd,A);
  if(B.m.inst!==run.id) dgAdoptS(B.m);
  B.m.abBoss=true;
  const ck=run.abCK; if(ck&&(ck.mhp!==1||ck.mdmg!==1)){ const k=B.m.dgK; B.m.dgK={lv:k.lv,hp:k.hp*ck.mhp,dmg:k.dmg*ck.mdmg,xp:k.xp}; }   // abyss: the curses' monster factors (a copy: dgKOf's answers are cached)
  run.boss=B; run.phase='boss';
  ev('spawn',monRoster(B.m)); ev('dgb',B.m.id,r1(A.x),r1(A.z),A.r,bd.def.id);
  S.ctx=c0; return B;
}
function abBossSetupS(run){ run.k={q:[],kills:0,ti:0,w:0,start:0,size:0,dead:0}; abHudS(run); abBossS(run); }
// every tick of the round: the HUD, and the boss never stands off its disc (a leap, a charge or a knockback past the rim is put back inside; run.abPull counts it for the test)
function abBossTickS(run,dt){
  abHudS(run); const B=run.boss; if(!B||B.m.dead) return;
  const m=B.m, A=B.A;
  if(!isFinite(m.x)||!isFinite(m.z)||dgSolid(run.B,m.x-run.ox,m.z-run.oz)){
    const a=isFinite(m.x)&&isFinite(m.z)?Math.atan2(m.z-A.z,m.x-A.x):0, rr=AB_BOSS_CELLS*DG_CELL-4; m.x=A.x+Math.cos(a)*rr; m.z=A.z+Math.sin(a)*rr; m.vx=m.vz=0; B.mv=null; run.abPull=(run.abPull|0)+1; }
}
// the bossDefeatedS hook: the world's version would reset the arena's respawn timer and toast everyone; here the hiker is told, the adds and the kit's effects go
function abBossDownS(m){
  const B=m.B, run=DG_RUNS.get(m.inst); clearBossFxS(B); [...B.totems,...B.adds].forEach(x=>{ if(!x.dead) removeMonS(x); }); B.totems=[]; B.adds=[];
  B.engaged=false; m.immune=false; B.mode=0; if(run) for(const p of dgPresentS(run)) toastTo(p.id,B.bd.short+' has fallen!','good');
}
