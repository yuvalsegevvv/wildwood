//@ Deep Cave skill Stopped Hour (floor 3, zahra's set skill, method D)
/* Agent map. Plan: docs/CAVE.md section 4 (row of zahra); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS zahra's mark, never spends it. */
defineCaveSkill({
  id:'stoppedhour', name:'Stopped Hour', floor:3, method:'D', set:'zahra', cost:40, el:'light', range:15, mult:0,
  desc:'For 3 seconds (+1 s for each 3 Grain, up to 5) the damage you and allies within 15 m take is held back; when time runs again only half of it lands, and never enough to knock anyone out.',
  fx:{hold:{dur:3, perN:{id:'grain', n:3, add:1}, max:5, r:15, land:0.5}}});
