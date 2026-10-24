//@ Deep Cave skill Night Line (floor 4, pell's set skill, method D)
/* Agent map. Plan: docs/CAVE.md section 4 (row of pell); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS pell's mark, never spends it. */
defineCaveSkill({
  id:'nightline', name:'Night Line', floor:4, method:'D', set:'pell', cost:30, el:'fire', range:30, mult:0,
  desc:'Float a lantern line at a spot up to 30 m away for 8 seconds. Every 2 s it Lures everything within 6 m, and you count as having stood still (Steady Hand).',
  fx:{cvzone:{r:6, dur:8, every:2, dflt:20, noHit:true, mark:{id:'lure', n:1, dur:12, max:3}, cv:{still:true}}}});
