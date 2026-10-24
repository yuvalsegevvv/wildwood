//@ Deep Cave skill Cut and Run (floor 2, sabir's set skill, method G)
/* Agent map. Plan: docs/CAVE.md section 4 (row of sabir); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS sabir's mark, never spends it. */
defineCaveSkill({
  id:'cutandrun', name:'Cut and Run', floor:2, method:'G', set:'sabir', cost:30, el:'fire', range:5, mult:2.4,
  desc:'A burning cut, +10% for each Loot on the target, then a dash 8 m away with 20% less damage taken for 3 seconds. A kill within 4 s refunds 10 charge.',
  fx:{cvstrike:{r:4, arc:1.2, burn:{dur:3, k:0.3}, markK:{id:'loot', per:0.10, max:5}}, retreat:{dist:8}, ally:{kind:'guard', v:0.2, dur:3, r:0.5}, refund:{n:10, secs:4, cap:10}}});
