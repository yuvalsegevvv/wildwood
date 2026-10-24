//@ Deep Cave skill Marionette (floor 2, ottoline's set skill, method C)
/* Agent map. Plan: docs/CAVE.md section 4 (row of ottoline); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS ottoline's mark, never spends it. */
defineCaveSkill({
  id:'marionette', name:'Marionette', floor:2, method:'C', set:'ottoline', cost:35, el:'dark', range:14, mult:1.0, feat:{kind:'holdMark', mark:'string', n:6, secs:10, time:90, r:14},
  desc:'Take over a normal monster for 4 seconds: it fights its neighbours. A boss cannot be puppeted and is weakened 15% for 4 seconds instead. Everything hit gets a String.',
  fx:{puppet:{dur:4, r:8, every:0.8, k:1.0, bossWeak:0.15, mark:{id:'string', n:1, dur:12, max:3}}}});
