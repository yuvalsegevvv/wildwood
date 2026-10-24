//@ Deep Cave skill Night Shift (floor 4, ogden's set skill, method F)
/* Agent map. Plan: docs/CAVE.md section 4 (row of ogden); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS ogden's mark, never spends it. */
defineCaveSkill({
  id:'nightshift', name:'Night Shift', floor:4, method:'F', set:'ogden', cost:30, el:'water', range:12, mult:1.0,
  desc:'For 8 seconds every kill near you raises a grave hand (up to 4) that grabs a nearby enemy, hits it, slows it and adds Rot.',
  fx:{shift:{dur:8, max:4, r:12, k:0.8, slow:3, grab:8}}});
