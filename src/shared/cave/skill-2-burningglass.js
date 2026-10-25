//@ Deep Cave skill Burning Glass (floor 2, brindle's set skill, method B)
/* Agent map. Plan: docs/CAVE.md section 4 (row of brindle); engine: server/cave-fx.js (cvstrike) + the generic ally buff; test: tools/cave-sets-smoke.js. READS brindle's mark (Glint), never spends it. */
defineCaveSkill({
  id:'burningglass', name:'Burning Glass', floor:2, method:'B', set:'brindle', cost:30, el:'fire', range:14, mult:1.4,
  desc:'Hold the glass up to the geode light: a 6 m burst that sets what it hits ablaze for 3 seconds, +10% damage for each Glint on a target (up to 50%), and you and allies within 15 m land more critical hits for 6 seconds.',
  fx:{cvstrike:{r:6, burn:{dur:3, k:0.3}, markK:{id:'glint', per:0.10, max:5}}, ally:{kind:'crit', v:0.12, dur:6, r:15}}});
