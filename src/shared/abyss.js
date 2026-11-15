//@ The Abyss (a solo roguelike mode, behind AB_ON): the flag, the six difficulties, the round level table, the boss rounds and the caps. Pure; loaded by both sides
/* agent map (docs/ABYSS.md; the plan: abyss-plan/PLAN.md)
   exports: AB_ON, abSwitch(on), AB_DIFFS (6 rows {id,name,lo,hi,rounds}: I-V then Infinite; hi / rounds 0 = no end), AB_INF (the index of Infinite, 5), abRoundLv(d,r), abRounds(d),
            abBossRounds(d) (the finite list; for Infinite the first AB_BOSS_SHOWN), abIsBossRound(d,r), AB_ART_MAX (20 artifacts at once), AB_RANK_MAX (5 copies), AB_CURSE_MAX (5),
            AB_ENTRY_LV (40), AB_AS_MAX / AB_LOCK_MAX (save caps of gear.ab.as / .lock), AB_RUN_KEEP_S (a saved run older than this is dropped, B2)
   users: server/abyss.js (the flag, the window, the save); later steps: the run, the artifacts, the client panel
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
