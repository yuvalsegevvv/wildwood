//@ The Wanderer's path Bulwark (tank, from Vitality): a deep well of health, shields when the blows land, a challenge that pulls the enemies in, and a slam that holds them
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js, tools/skillsets-ladder.js --wanderer --path bulwark
   (a tank: judged by the tank band, about 90 of the baseline's damage). Stats of the Wanderer's tree: the 'tank' table. */
defineWandererPath({
  id:'bulwark', name:'Bulwark', role:'tank', kit:'tank', from:'vitality',
  text:'Stand in front and stay standing: more health than any shop can teach, shields when you are struck, and the enemies come to you.',
  passive:{name:'Bastion', text:'+{}% maximum health; you deal 12% less damage', stat:'hp', v:[0.15, 0.02], cost:{stat:'dmg', v:-0.12}},
  ult:{name:'Iron Bastion', desc:'You slam your weight into the ground: everything within 7 m is hit, thrown back and comes for you for 4 seconds, and the stunned cannot answer.', range:7, mult:1.2, act:['wdbulwarkult',0.9,0.55], anim:'nova',
       fx:{ring:{r:7, kb:4, taunt:{dur:4}}},
       boost:[{piece:'a3', secs:10, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Hold the Line', text:'A blow that lands on you may raise a shield worth 8% of your maximum health for 5 s (a third of them, at most every 6 s)', on:'hurt', chance:0.33, icd:6, shield:{v:0.08, dur:5}},
    2:{name:'Challenge', text:'Your skill rings out a challenge: the enemies within 6 m take 40% damage and come for you for 3 s (at most every 8 s)', on:'cast2', icd:8, mult:0.4, range:6, fx:{ring:{r:6, taunt:{dur:3}}}},
    4:{name:'Deep Roots', text:'{}% less damage taken; you deal 8% less damage', stat:'red', v:0.08, cost:{stat:'dmg', v:-0.08}},
    6:{name:'Unbroken', text:'When your health falls below 35%, a shield worth 25% of your maximum health holds for 6 s and you heal 10% (at most every 30 s)', on:'low', below:0.35, icd:30, heal:0.1, shield:{v:0.25, dur:6}}},
});
