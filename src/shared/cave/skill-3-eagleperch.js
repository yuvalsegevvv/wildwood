//@ Deep Cave skill Eagle's Perch (floor 3, sorrel's set skill, method A)
/* Agent map. Plan: docs/CAVE.md section 4 (row of sorrel); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS sorrel's mark, never spends it. */
defineCaveSkill({
  id:'eagleperch', name:'Eagle\'s Perch', floor:3, method:'A', set:'sorrel', cost:30, el:'air', range:15, mult:0,
  desc:'Ride a gust 4 m up for 5 seconds: melee cannot reach you, your skill shots count as 10 m farther for range scaling, and they hit +5% harder for each Sight on the target.',
  fx:{perch:{dur:5, melee:6, rangeAdd:10, sightK:0.05}}});
