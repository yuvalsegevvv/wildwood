//@ Deep Cave skill Shield-Wall (floor 2, torgeir's set skill, method F)
/* Agent map. Plan: docs/CAVE.md section 4 (row of torgeir); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS torgeir's mark, never spends it. */
defineCaveSkill({
  id:'shieldwall', name:'Shield-Wall', floor:2, method:'F', set:'torgeir', cost:35, el:'earth', range:10, mult:0,
  desc:'Plant the shield for 6 seconds: you and allies behind you take 30% less from the front, +3% for each Fixation within 10 m (up to +15%), and the taunts refresh while it stands.',
  fx:{taunt:{r:10, dur:3}, wall:{dur:6, red:0.30, perMark:{id:'fixation', v:0.03, max:5, r:10}, r:10, taunt:3}}});
