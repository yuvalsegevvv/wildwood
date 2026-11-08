//@ The Wanderer's path Lorekeeper (grind, from Scholar): more XP from every kill, a burst that leaves a whole camp vulnerable, and just enough hit to farm it
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js, tools/skillsets-ladder.js --wanderer --path lorekeeper
   (a grind path: judged on the pack column, about 80% of the grind sets' pack at Bond VI; the xp stat does not show in the ladder). Stats of the Wanderer's tree: the 'grind' table. */
defineWandererPath({
  id:'lorekeeper', name:'Lorekeeper', role:'grind', kit:'grind', from:'scholar',
  text:'Learn from every fight: a great deal more XP from each kill, and the camp you study takes more from you.',
  passive:{name:'Field Notes', text:'+{}% XP from kills; you deal 20% less damage', stat:'xp', v:[0.12, 0.02], cost:{stat:'dmg', v:-0.20}},
  ult:{name:'Open Book', desc:'You open the book on everything within 9 m: it is hit, shoved back and stays exposed for 8 seconds, taking 20% more from everyone, and the stunned cannot turn the page.', range:9, mult:1.3, act:['wdlorekeeperult',0.9,0.55], anim:'nova',
       fx:{ring:{r:9, kb:2, status:{kind:'vuln', v:0.2, dur:8}}},
       boost:[{piece:'a2', secs:14, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Margin Notes', text:'+{}% XP from kills', stat:'xp', v:0.05},
    2:{name:'Footnote', text:'A kill bursts 4 m round it for 70% damage (at most every 2 s)', on:'kill', at:'target', icd:2, mult:0.7, range:4, fx:{ring:{r:4}}},
    4:{name:'Well Read', text:'+{}% damage with every attack', stat:'dmg', v:0.06},
    6:{name:'Turn the Page', text:'While three or more enemies are within 8 m, every 4 s a page turns 8 m round you for 320% damage and leaves them exposed: 10% more damage taken for 5 s', on:'tick', icd:4, when:{crowd:{n:3, r:8}}, mult:3.2, range:8, fx:{ring:{r:8, status:{kind:'vuln', v:0.10, dur:5}}}}},
});
