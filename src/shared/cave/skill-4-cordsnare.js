//@ Deep Cave skill Cord Snare (floor 4, atuqa's set skill, method B)
/* Agent map. Plan: docs/CAVE.md section 4 (row of atuqa); engine: server/cave-fx.js (cvstrike) + the generic taunt and ally buff; test: tools/cave-sets-smoke.js. READS atuqa's mark (Knot), never spends it. */
defineCaveSkill({
  id:'cordsnare', name:'Cord Snare', floor:4, method:'B', set:'atuqa', cost:35, el:'light', range:12, mult:0.5,
  desc:'Cast the knotted cord round everything within 9 m: they take a hit (+8% for each Knot on a target, up to 40%), are slowed for 4 seconds and come for you for 3. You and your allies within 12 m take 15% less damage for 5 seconds.',
  fx:{cvstrike:{r:9, slow:4, markK:{id:'knot', per:0.08, max:5}}, taunt:{r:9, dur:3}, ally:{kind:'guard', v:0.15, dur:5, r:12}}});
