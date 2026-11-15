//@ The dungeon ladder: DG_TIERS, 11 tiers of monster level 30..110 shared by all dungeons, plus the unlock rule (gear.dg.top) and a run's level
/* Dungeon revamp step D1 (docs/DUNGEON-REVAMP.md sections 1, 2, 7).
   DG_TIERS[t] = {t, lv (monster level), eq:[% of equipment level 30,40,50,60] and n:[min,max] pieces per clear: DATA ONLY here, step D2 reads them}. t is 0-based (tier I = 0).
   gear.dg.top = the number of tiers cleared in a row, 0 = none, max 11 (the highest cleared tier index + 1). Tier index t is open when t <= top (tier I is always open).
   Clearing tier N of ANY dungeon (dgtWinS, from dgWinS) raises top to N+1. The zone tier setting plays no part.
   exports: DG_TIERS, DG_TIER_MAX (10), dgtClamp(t), dgtLevel(t), dgtOpen(gear,t), dgtTop(gear), dgtOldLevel(T,zmax) (the retired formula, for the save migration only)
   users: shared/dungeons.js (dgLevel, dgUnlocked), server/dungeons/{lobby,runs}.js, game/dungeon/board.js. Test: tools/dungeon-tiers-smoke.js. */
const DG_TIERS=[
  {t:0, lv:30, eq:[100,0,0,0],  n:[1,1]},
  {t:1, lv:38, eq:[50,50,0,0],  n:[1,1]},
  {t:2, lv:46, eq:[25,50,25,0], n:[1,2]},
  {t:3, lv:54, eq:[20,30,40,10],n:[1,2]},
  {t:4, lv:62, eq:[10,30,45,15],n:[2,2]},
  {t:5, lv:70, eq:[5,25,50,20], n:[2,3]},
  {t:6, lv:78, eq:[0,20,50,30], n:[2,3]},
  {t:7, lv:86, eq:[0,10,50,40], n:[2,4]},
  {t:8, lv:94, eq:[0,5,45,50],  n:[3,4]},
  {t:9, lv:102,eq:[0,0,40,60],  n:[3,4]},
  {t:10,lv:110,eq:[0,0,25,75],  n:[3,5]}];
const DG_TIER_MAX=DG_TIERS.length-1;
const dgtClamp=t=>{ t=Math.floor(+t); return isFinite(t)?Math.max(0,Math.min(DG_TIER_MAX,t)):0; };
const dgtLevel=t=>DG_TIERS[dgtClamp(t)].lv;
const dgtTop=gear=>{ const d=gear&&gear.dg; const n=d?Math.floor(+d.top):0; return isFinite(n)?Math.max(0,Math.min(DG_TIERS.length,n)):0; };   // tiers cleared (0 = none)
const dgtOpen=(gear,t)=>Number.isInteger(t)&&t>=0&&t<=DG_TIER_MAX&&t<=dgtTop(gear);
// the retired level formula (theme lv + 10 per zone tier above the land's base; Wildwood's base was 1), kept only so an old save's clears can set gear.dg.top
const dgtOldLevel=(T,zmax)=>(T.lv||DG_LV)+ZTIER_STEP*Math.max(0,(zmax|0)-(T.land==='home'?1:0));
