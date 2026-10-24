//@ Deep Cave skill Sound the Charge (floor 3, dunstan's set skill, method F)
/* Agent map. Plan: docs/CAVE.md section 4 (row of dunstan); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS dunstan's mark, never spends it. */
defineCaveSkill({
  id:'soundcharge', name:'Sound the Charge', floor:3, method:'F', set:'dunstan', cost:35, el:'fire', range:15, mult:0,
  desc:'The party\'s skill and burst cooldowns drop by 2 seconds at once, +0.5 s for each Fervor near you (up to 4 s in all).',
  fx:{cdrParty:{base:2, perMark:{id:'fervor', v:0.5, max:4, r:12}, cap:4, r:25}}});
