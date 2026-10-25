//@ Deep Cave skill Seam-Splitter (floor 3, dessa's set skill, method G)
/* Agent map. Plan: docs/CAVE.md section 4 (row of dessa); engine: server/cave-fx.js (cvstrike) + the generic taunt; test: tools/cave-sets-smoke.js. READS dessa's mark (Temper), never spends it. */
defineCaveSkill({
  id:'seamsplitter', name:'Seam-Splitter', floor:3, method:'G', set:'dessa', cost:35, el:'earth', range:8, mult:1.6,
  desc:'Drive the hammer into the rock: an 8 m shock that stuns for 1.5 seconds and taunts for 3, +8% damage for each Temper on a target (up to 40%). The stun and taunt stop a gem mole in its tunnel.',
  fx:{cvstrike:{r:8, kb:2, stun:1.5, markK:{id:'temper', per:0.08, max:5}}, taunt:{r:8, dur:3}}});
