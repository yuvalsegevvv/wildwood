//@ Deep Cave skill Threshing Floor (floor 2, tansy's set skill, method H)
/* Agent map. Plan: docs/CAVE.md section 4 (row of tansy); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS tansy's mark, never spends it. */
defineCaveSkill({
  id:'threshing', name:'Threshing Floor', floor:2, method:'H', set:'tansy', cost:30, range:10, mult:1.4,
  desc:'A 10 m ring drags every enemy in a little and hits them all, +6% for each enemy hit (up to 10). Each kill within 4 s refunds 3 charge (at most 15 a cast). Tansy has no mark, so it counts the crowd.',
  fx:{cvstrike:{r:10, kb:-3, crowd:{per:0.06, max:10}}, refund:{n:3, secs:4, cap:15}}});
