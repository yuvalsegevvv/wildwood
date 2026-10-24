//@ Deep Cave skill Embalm (floor 4, nephra's set skill, method A)
/* Agent map. Plan: docs/CAVE.md section 4 (row of nephra); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS nephra's mark, never spends it. */
defineCaveSkill({
  id:'embalm', name:'Embalm', floor:4, method:'A', set:'nephra', cost:40, el:'earth', range:12, mult:0,
  desc:'Wrap the ally who needs it most, or yourself: for 5 seconds they cannot fall below 1 health, then they heal 10%, +2% for each Linen near you.',
  fx:{embalm:{dur:5, heal:0.10, perMark:{id:'linen', v:0.02, max:5, r:12}, r:12}}});
