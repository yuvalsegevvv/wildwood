//@ Deep Cave skill Lighthouse (floor 2, corvin's set skill, method A)
/* Agent map. Plan: docs/CAVE.md section 4 (row of corvin); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS corvin's mark, never spends it. */
defineCaveSkill({
  id:'lighthouse', name:'Lighthouse', floor:2, method:'A', set:'corvin', cost:30, el:'light', range:12, mult:1.0,
  desc:'Set the lantern down for 8 seconds. Its beam sweeps 10 m, burns what it crosses and puts a Glare on one enemy a second, so your vulnerability stacks keep running while you fight.',
  fx:{cvzone:{r:10, dur:8, every:1, self:true, k:0.35, cv:{markOne:{id:'glare', n:1, dur:10, max:3}}}}});
