//@ The Wanderer's path Stalwart (tank, from Iron Will): less damage taken, a steady recovery, and a second wind once the blows land; lives through attrition where Bulwark takes the front
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js; the other tank: bulwark.js (health and taunts). Test: tools/bond-smoke.js,
   tools/skillsets-ladder.js --wanderer --path stalwart (a tank: judged by the tank band, about 90 of the baseline's damage). The ladder cannot see what makes it a tank (the `red` stat, the `tick` / `hurt` heals).
   Stats of the Wanderer's tree: the 'tank' table. */
defineWandererPath({
  id:'stalwart', name:'Stalwart', role:'tank', kit:'tank', from:'ironwill',
  text:'Outlast everything: far less damage taken and a steady recovery in the fight, for a lighter hand.',
  passive:{name:'Thick Hide', text:'{}% less damage taken; you deal 14% less damage', stat:'red', v:[0.09, 0.015], cost:{stat:'dmg', v:-0.14}},
  ult:{name:'Last Stand', desc:'You plant your feet and the ground answers: everything within 6 m is hit and shoved back, and a shield worth 20% of your maximum health holds for 6 seconds.', range:6, mult:1.2, act:['wdstalwartult',0.9,0.55], anim:'nova',
       fx:{ring:{r:6, kb:3}, shield:{v:0.20, dur:6}},
       boost:[{piece:'a3', secs:10, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Second Wind', text:'You recover {}% of your maximum health every second', stat:'regen', v:0.004},
    2:{name:'Slow Burn', text:'Every 3 s of a fight you recover 1.5% of your maximum health', on:'tick', icd:3, heal:0.015},
    4:{name:'Weathered', text:'{}% less damage taken; you deal 8% less damage', stat:'red', v:0.06, cost:{stat:'dmg', v:-0.08}},
    6:{name:'Dig In', text:'While you are below half health, a blow that lands heals you for 4% of your maximum health and raises a shield worth 6% for 5 s (at most every 5 s)', on:'hurt', icd:5, when:{hp:{below:0.5}}, heal:0.04, shield:{v:0.06, dur:5}}},
});
