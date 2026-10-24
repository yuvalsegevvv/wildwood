//@ Deep Cave skill Bell Echo (floor 4, genzo's set skill, method C)
/* Agent map. Plan: docs/CAVE.md section 4 (row of genzo); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS genzo's mark, never spends it. */
defineCaveSkill({
  id:'bellecho', name:'Bell Echo', floor:4, method:'C', set:'genzo', cost:40, el:'air', range:10, mult:0, feat:{kind:'taunt', n:4, secs:20},
  desc:'The next 3 hits you take ring out (+1 for every 2 Toll, up to 6). Each one reflects 50% of its damage and heals the party 3%.',
  fx:{bell:{n:3, perMark:{id:'toll', per:2, max:3, r:12}, reflect:0.5, heal:0.03, dur:20}}});
