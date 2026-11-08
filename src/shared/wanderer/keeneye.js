//@ The Wanderer's path Keen Eye (safe DPS, from Precision): a sharper eye than any shop can sell, every critical hit pays twice, a long clean shot of a burst
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js (the paths block), tools/skillsets-ladder.js --wanderer --path keeneye
   (a safe damage path: about 80% of the damage sets' average at Bond VI). Compare the safe sets Pell and Sorrel (distance and standing still); this one lives on critical hits and asks nothing of where you stand.
   Stats of the Wanderer's tree: the 'safe' table. */
defineWandererPath({
  id:'keeneye', name:'Keen Eye', role:'safe', kit:'safe', from:'precision',
  text:'Win with the critical hit: a better eye than the shop sells, bigger crits, and every crit sharpens the next.',
  passive:{name:'Hawk Sight', text:'+{}% critical hit chance', stat:'crit', v:[0.09, 0.015]},
  ult:{name:'Dead Center', desc:'You take a long breath and loose one perfect shot at up to 40 m: a heavy hit on the target, and the stunned cannot dodge it.', range:40, mult:3.2, act:['wdkeeneyeult',1.2,0.85], anim:'shoot',
       fx:{proj:{kind:'snipe', speed:70, turn:12, life:1.0}},
       boost:[{piece:'a1', secs:12, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Steady Breath', text:'+{}% critical hit damage', stat:'critdmg', v:0.12},
    2:{name:'Lead the Shot', text:'A critical hit sharpens your aim: +10% critical hit chance for 5 s (at most every 4 s)', on:'crit', icd:4, buff:{kind:'crit', v:0.10, dur:5}},
    4:{name:'Clear Sight', text:'+{}% critical hit chance', stat:'crit', v:0.04},
    6:{name:'Second Shot', text:'A critical hit follows through: 120% damage to everything within 4 m and 1 s off your skill\'s cooldown (at most every 3 s)', on:'crit', at:'target', icd:3, mult:1.2, range:4, cdr:{skill:1}, fx:{ring:{r:4}}}},
});
