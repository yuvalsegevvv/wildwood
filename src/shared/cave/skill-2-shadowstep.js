//@ Deep Cave skill Shadow Step (floor 2, sazanka's set skill, method E)
/* Agent map. Plan: docs/CAVE.md section 4 (row of sazanka); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS sazanka's mark, never spends it. */
defineCaveSkill({
  id:'shadowstep', name:'Shadow Step', floor:2, method:'E', set:'sazanka', cost:25, el:'dark', range:12, mult:1.2,
  desc:'Blink behind the target. For 2 seconds every hit counts as from behind even if the enemy turns, and the blink leaves a Barb. Slip Behind is a strike; this buys a window to strike in.',
  fx:{dash:{ahead:6, behind:true}, behindWin:2, cvstrike:{r:3.5, mark:{id:'barb', n:1, dur:10, max:5}}}});
