//@ The Wanderer's path Tempo (safe DPS, from Quickhands): shorter cooldowns, a basic attack that hurries the other skills along, and a burst that doubles the passive's pace
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js, tools/skillsets-ladder.js --wanderer --path tempo
   (a safe damage path: about 80% of the damage sets' average at Bond VI). The cd stat is capped at 60% in all (abilityCd): the passive, Realization I and the Awakening branch stack under that cap.
   Stats of the Wanderer's tree: the 'safe' table. */
defineWandererPath({
  id:'tempo', name:'Tempo', cls:'mage', el:'water', role:'safe', kit:'safe', from:'quickhands',
  text:'Keep every skill spinning: shorter cooldowns, and your basic attacks hurry the others back.',
  passive:{name:'Quick Pace', text:'{}% shorter cooldowns', stat:'cd', v:[0.10, 0.02]},
  ult:{name:'Time Slip', desc:'You step out of the moment: a shock 8 m round you hits everything there, and the stunned stand still while you go on.', range:8, mult:1.4, act:['wdtempoult',0.9,0.55], anim:'nova',
       fx:{ring:{r:8, kb:2}},
       boost:[{piece:'a2', secs:12, mod:{cd:0.5}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Rhythm', text:'{}% shorter cooldowns', stat:'cd', v:0.04},
    2:{name:'Quick Return', text:'Your basic attack takes 1.5 s off the cooldowns of your skill and your power (at most every 4 s)', on:'cast1', icd:4, cdr:{skill:1.5, burst:1.5}},
    4:{name:'Habit', text:'+{}% damage with every attack', stat:'dmg', v:0.12},
    6:{name:'Overclock', text:'Your skill takes 3 s off your power\'s cooldown and 1 s off your basic attack\'s (at most every 6 s)', on:'cast2', icd:6, cdr:{burst:3, basic:1}}},
});
