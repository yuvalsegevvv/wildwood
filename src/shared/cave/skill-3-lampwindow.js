//@ Deep Cave skill Lamp in the Window (floor 3, hollis's set skill, method E)
/* Agent map. Plan: docs/CAVE.md section 4 (row of hollis); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS hollis's mark, never spends it. */
defineCaveSkill({
  id:'lampwindow', name:'Lamp in the Window', floor:3, method:'E', set:'hollis', cost:35, el:'dark', range:12, mult:0,
  desc:'Set the lamp down for 10 seconds (+1 s for each Vigil). An ally who falls under 30% inside it heals 15% once. Enemies inside are weakened (the shared weak status).',
  fx:{cvzone:{r:7, dur:10, every:1, self:true, noHit:true, durMark:{id:'vigil', v:1, max:5, r:12}, status:{kind:'weak', v:0.10, dur:2.5}, cv:{lamp:{below:0.3, heal:0.15}}}}});
