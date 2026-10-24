//@ Deep Cave skill Tidepool (floor 3, ambrose's set skill, method B)
/* Agent map. Plan: docs/CAVE.md section 4 (row of ambrose); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS ambrose's mark, never spends it. */
defineCaveSkill({
  id:'tidepool', name:'Tidepool', floor:3, method:'B', set:'ambrose', cost:35, el:'water', range:12, mult:0,
  desc:'A 6 m pool for 6 seconds: allies in it regenerate 2% a second and lose slows. When it ends, the weakest ally heals 2% for each Ripple within 15 m.',
  fx:{cvzone:{r:6, dur:6, every:1, ahead:3, noHit:true, heal:{v:0.02}, cv:{cleanse:true, endHeal:{per:0.02, markId:'ripple', r:15, maxStacks:10}}}}});
