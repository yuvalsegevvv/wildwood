//@ Deep Cave skill Tailwind (floor 4, sefi's set skill, method E)
/* Agent map. Plan: docs/CAVE.md section 4 (row of sefi); engine: server/cave-fx.js (cvstrike, cdrParty) + the generic dash; test: tools/cave-sets-smoke.js. READS sefi's mark (Stride), never spends it. */
defineCaveSkill({
  id:'tailwind', name:'Tailwind', floor:4, method:'E', set:'sefi', cost:30, el:'air', range:12, mult:0.6,
  desc:'Run 8 m ahead on a gust and cut everything where you land (+6% for each Stride on a target, up to 30%). Your skill and burst cooldowns drop 1.5 seconds, +0.5 s for each Stride near you (up to 3 s in all).',
  fx:{dash:{ahead:8}, cvstrike:{r:3.5, markK:{id:'stride', per:0.06, max:5}}, cdrParty:{base:1.5, perMark:{id:'stride', v:0.5, max:3, r:12}, cap:3, r:2}}});
