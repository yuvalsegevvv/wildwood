//@ The Abyss's Trial rounds (B8): one of the rift modes (heart, gale, beacons, thaw, lanterns, quarry, gauntlet) on its rift's platforms, the tile's monsters at the round's level, plain numbers; a win ends the ROUND, not a rift run
/* agent map (docs/ABYSS.md section 3g; the modes: server/rift/<mode>.js through DG_KITS.rift and RIFT_MODE_KITS, the platforms: shared/rift/<rift>.js via AB_TRIAL_MODES)
   exports: abTrialDefS(run,rift,tile) (sets run.rdef: the mode's rift def with the tile's kinds, its last kind as the Herald, reward 'abyss'), abTrialSetupS / abTrialTickS / abTrialKillS / abTrialUseS / abTrialHudS (DG_KITS.abyss delegates to them),
            abTrialSpawnS(run,m,k,herald) (riftSpawnS hook: plain numbers, the curses' factors), abTrialWonS(run) (riftWonS hook: the round is won), RIFT_PAY.abyss (pays nothing)
   hooks marked `// abyss:` (docs/ABYSS.md section 3): rift.js riftDefOf (run.rdef), riftSpawnS, riftWonS
   test: tools/abyss-smoke.js (each mode is won headless and ends the round; gear.rift is untouched).
   A Trial's rift def (run.rdef) is a copy of the mode's own rift (so the platforms, the look and RIFT_MODES[mode] hold) with kinds from the tile's pool (the first four from stage 1, then one more every stage or two) and `reward:'abyss'`,
   which RIFT_PAY.abyss answers with no XP, coins or Essence and no save: nothing is paid but the round's own picks. A lost trial (the heart broken, the gauntlet's clock, a fall) ends the run the dungeons' way. */
const AB_TRIAL_HERALD_K=0.5;   // the Herald of a Trial has the rift's x8 health at the round's plain numbers: halved, x4 like a champion
RIFT_PAY.abyss={kill(){},clear(){}};
function abTrialDefS(run,rift,tile){
  const pool=tile?tile.pool:rift.kinds.map(c=>c.id);
  run.rdef=Object.assign({},rift,{reward:'abyss',kinds:pool.map((id,i)=>({id,from:i<4?1:i<6?3:5,w:Math.max(1,4-(i>>1))})),herald:pool[pool.length-1]});
}
function abTrialSetupS(run){ DG_KITS.rift.setup(run); abTrialHudS(run); }
function abTrialTickS(run,dt){ DG_KITS.rift.tick(run,dt); if(!run.abWon&&!run.endT) abTrialHudS(run); }
function abTrialKillS(run,m){ DG_KITS.rift.onKill(run,m); }
function abTrialUseS(run,p,ob){ DG_KITS.rift.onUse(run,p,ob); }
// the mode's tuple (riftHudS) with the marker, the round and the rounds after it (shared/abyss.js DG_HUD.abyss)
function abTrialHudS(run){ DG_KITS.rift.hud(run); if(run.hud&&run.hud.length===8) run.hud.push(1,run.abR,abRounds(run.abD)); }
// a monster of a Trial (after riftSpawnS's brittle numbers): the plain level numbers with the curses of the run, no x RIFT_HP_K; the Herald's health halved
function abTrialSpawnS(run,m,k,herald){
  const ck=run.abCK||{mhp:1,mdmg:1}; m.dgK={lv:k.lv,hp:k.hp*ck.mhp,dmg:k.dmg*ck.mdmg,xp:k.xp};
  m.maxHp=m.hp=Math.max(1,m.maxHp/RIFT_HP_K*(herald?AB_TRIAL_HERALD_K:1));
}
// the mode called riftWonS: the round is won (picks, the next tiles); what is left of the monsters goes
function abTrialWonS(run){
  if(run.abWon||run.endT) return;
  const c0=S.ctx; S.ctx=run.id; for(const m of [...run.mons]) dgRemoveS(run,m); S.ctx=c0;
  abRoundWonS(run);
}
