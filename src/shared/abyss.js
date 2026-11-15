//@ The Abyss (a solo roguelike mode, behind AB_ON): the flag, the six difficulties, the round level table, the boss rounds and the caps. Pure; loaded by both sides
/* agent map (docs/ABYSS.md; the plan: abyss-plan/PLAN.md)
   exports: AB_ON, abSwitch(on), AB_DIFFS (6 rows {id,name,lo,hi,rounds}: I-V then Infinite; hi / rounds 0 = no end), AB_INF (the index of Infinite, 5), abRoundLv(d,r), abRounds(d),
            abBossRounds(d) (the finite list; for Infinite the first AB_BOSS_SHOWN), abIsBossRound(d,r), AB_ART_MAX (20 artifacts at once), AB_RANK_MAX (5 copies), AB_CURSE_MAX (5),
            AB_ENTRY_LV (40), AB_AS_MAX / AB_LOCK_MAX (save caps of gear.ab.as / .lock), AB_RUN_KEEP_S (a saved run older than this is dropped), AB_THEME (the rift def a run borrows its look and kinds from for now), AB_WAVES / AB_COUNT_S / AB_WAVE_S / AB_RELEASE_S / AB_ALIVE_MAX / AB_NEXT_PCT / AB_DEATH_S, abWaveSize(r,w), abLayout(seed), DG_HUD.abyss (the run's HUD row)
   users: server/abyss.js (the flag, the window, the save), server/abyss/rounds.js (the run), game/dungeon/run.js (abLayout); later steps: the run, the artifacts, the client panel
   test: tools/abyss-smoke.js
   Round levels: every finite difficulty climbs 10 levels every 3 rounds, so ONE formula, abRoundLv(d,r) = lo + round((r-1)*10/3): difficulty I (lo 40) gives 40, 43, 47, 50, 53, 57, 60 (the
   last digit cycles 0, 3, 7), V reaches 140 at round 19, Infinite (lo 90, no end) reaches 180 at round 28. Boss rounds: 7, 13, 19... (every 6 from 7) and the last round of a finite difficulty. */
let AB_ON=false;   // the mode's switch: false on the deploy until step B12; the server also opens it in the test world and with the dev tools (abOnS, server/abyss.js)
function abSwitch(on){ AB_ON=!!on; }
const AB_DIFFS=[
  {id:'I',name:'Difficulty I',lo:40,hi:60,rounds:7},
  {id:'II',name:'Difficulty II',lo:50,hi:80,rounds:10},
  {id:'III',name:'Difficulty III',lo:60,hi:100,rounds:13},
  {id:'IV',name:'Difficulty IV',lo:70,hi:120,rounds:16},
  {id:'V',name:'Difficulty V',lo:80,hi:140,rounds:19},
  {id:'INF',name:'Infinite',lo:90,hi:0,rounds:0}];
const AB_INF=5, AB_ART_MAX=20, AB_RANK_MAX=5, AB_CURSE_MAX=5, AB_ENTRY_LV=40, AB_BOSS_SHOWN=8, AB_AS_MAX=999999999, AB_LOCK_MAX=9999, AB_RUN_KEEP_S=1800;
const abRoundLv=(d,r)=>AB_DIFFS[d].lo+Math.round((Math.max(1,r|0)-1)*10/3);   // d: the index in AB_DIFFS, r: the round from 1
const abRounds=d=>AB_DIFFS[d].rounds|0;   // 0 = Infinite
function abIsBossRound(d,r){ r=r|0; if(r<7) return false; const n=abRounds(d); if(n&&r>n) return false; return (r-7)%6===0||r===n; }
function abBossRounds(d){ const n=abRounds(d), out=[]; for(let r=7;n?r<=n:out.length<AB_BOSS_SHOWN;r+=6) out.push(r); if(n&&out[out.length-1]!==n) out.push(n); return out; }
/* A FIGHT ROUND (B2): AB_WAVES waves through the void's tears, the first after AB_COUNT_S, the next at AB_NEXT_PCT of this one dead or AB_WAVE_S after it began, a wave pours in over AB_RELEASE_S,
   at most AB_ALIVE_MAX alive; the round is won when the last wave is dead. The look and the monster kinds are the Shardmere's for now (B7 brings the tiles). */
const AB_THEME='shardmere', AB_WAVES=3, AB_COUNT_S=3, AB_WAVE_S=30, AB_RELEASE_S=6, AB_ALIVE_MAX=30, AB_NEXT_PCT=0.75, AB_DEATH_S=3;
const abWaveSize=(r,w)=>6+2*(w|0)+Math.floor(Math.max(1,r|0)/2);   // round 1 wave 1: 8, wave 3: 12
// the run's layout, rebuilt by the client from the seed (game/dungeon/run.js): for now the Shardmere's plus; the seed is for the tiles of B7
const abLayout=seed=>riftLayout(RIFT_DEFS[AB_THEME]);
// the snapshot's numbers (run.hud): [round, rounds (0 = Infinite), monsters alive or on their way, wave, waves, seconds to the next wave]  (dg[3]...dg[8])
DG_HUD.abyss=dg=>{ const r=dg[3]|0, n=dg[4]|0, left=dg[5]|0, w=dg[6]|0, ws=Math.max(1,dg[7]|0), clk=dg[8]|0;
  return {title:'The Abyss',lines:['Round '+r+(n?' / '+n:''),w?'Wave '+w+' / '+ws+(clk>0&&w<ws?' · next in '+clk+' s':''):'The tears open in '+clk+' s','Monsters: '+left],
    bar:{v:w,max:ws,col:'#9a5cff',label:'Wave '+w+' / '+ws},warn:false}; };
