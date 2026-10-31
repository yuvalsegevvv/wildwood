//@ Deep Cave skill Ember Count (floor 3, tzaya's set skill, method H)
/* Agent map. Plan: docs/CAVE.md section 4 (row of tzaya); engine: server/cave-fx.js (cvstrike, its crowd and markK keys); test: tools/cave-sets-smoke.js. READS tzaya's mark (Tally), only ADDS stacks to it, never spends it. */
defineCaveSkill({
  id:'embercount', name:'Ember Count', floor:3, method:'H', set:'tzaya', cost:35, el:'fire', range:7, mult:0.9,
  desc:'A ring of fire 7 m round you burns for 3 seconds. It hits harder for every enemy in it (+8% each, up to 40%) and for every Tally on a target (+6% each, up to 30%), and leaves a Tally on each enemy it hits.',
  fx:{cvstrike:{r:7, burn:{dur:3, k:0.3}, crowd:{per:0.08, max:5}, markK:{id:'tally', per:0.06, max:5}, mark:{id:'tally', n:1, dur:12, max:5}}}});
