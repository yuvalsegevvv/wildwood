//@ Deep Cave skill Black Ice (floor 4, brynja's set skill, method G)
/* Agent map. Plan: docs/CAVE.md section 4 (row of brynja); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS brynja's mark, never spends it. */
defineCaveSkill({
  id:'blackice', name:'Black Ice', floor:4, method:'G', set:'brynja', cost:30, el:'water', range:14, mult:0,
  desc:'A 12 m ice lane ahead for 6 seconds. On it you move 40% faster and Momentum is always on. Enemies on it are slowed and gain Rime every second.',
  fx:{cvzone:{r:6.5, dur:6, every:1, ahead:6, noHit:true, slow:1.5, mark:{id:'rime', n:1, dur:12, max:5}, cv:{lane:{speed:0.4}, momentum:true}}}});
