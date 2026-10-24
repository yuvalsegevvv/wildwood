//@ Deep Cave skill Landslide (floor 4, tamsin's set skill, method H)
/* Agent map. Plan: docs/CAVE.md section 4 (row of tamsin); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS tamsin's mark, never spends it. */
defineCaveSkill({
  id:'landslide', name:'Landslide', floor:4, method:'H', set:'tamsin', cost:35, el:'earth', range:14, mult:2.0,
  desc:'A 14 m slope of rubble ahead: everything in it is hit and dragged to its end, stunned 1 s and taunted. Each kill within 4 s refunds 3 charge (at most 15 a cast).',
  fx:{slide:{len:14, w:4, stun:1, taunt:4}, refund:{n:3, secs:4, cap:15}}});
