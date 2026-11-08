//@ The Wanderer's path Wayfarer (risk DPS, from Fleetfoot): faster on the move, hits that slow what they touch, and damage that lives on the run; standing still costs
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js, tools/skillsets-ladder.js --wanderer --path wayfarer
   (a damage path: about 80% of the damage sets' average at Bond VI). The `move` stat is SS_STATS' newest word (Fleetfoot's own stat, read by the client's updatePlayer through passiveSum). The ladder's hero is
   always on the move, so the `moved` rows are measured and the `dist` and `still` conditions are not. Stats of the Wanderer's tree: the 'risk' table. */
defineWandererPath({
  id:'wayfarer', name:'Wayfarer', cls:'archer', el:null, role:'risk', kit:'risk', from:'fleetfoot',
  text:'Never stop moving: far faster on your feet, hits that slow the enemy, and a hard price for standing still.',
  passive:{name:'Long Stride', text:'+{}% movement speed; you deal 15% less damage after standing still for 1.5 s', stat:'move', v:[0.14, 0.02], cost:{stat:'dmg', v:-0.15, when:{still:1.5}}},
  ult:{name:'Windrush', desc:'You burst into a run: everything within 8 m is struck and slowed for 3 seconds and the stunned stay put, while you and your party move 30% faster for 8 seconds.', range:8, mult:1.3, act:['wdwayfarerult',0.9,0.55], anim:'nova',
       fx:{ring:{r:8, kb:3, slow:3}, ally:{kind:'haste', v:0.30, dur:8, r:25}},
       boost:[{piece:'a2', secs:12, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Light Step', text:'+{}% movement speed', stat:'move', v:0.06},
    2:{name:'Moving Target', text:'While you are on the move, a hit lashes out round its target: 110% damage to everything within 3 m, and it is slowed for 2 s (at most every 3 s)', on:'hit', at:'target', icd:3, when:{moved:2}, mult:1.1, range:3, fx:{ring:{r:3, slow:2}}},
    4:{name:'Running Fire', text:'+{}% damage while you have moved within the last second', stat:'dmg', v:0.14, when:{moved:1}},
    6:{name:'Long Shadow', text:'A hit from 8 m or farther bursts 4 m round its target for 130% damage and slows it for 3 s (at most every 2.5 s)', on:'hit', at:'target', icd:2.5, when:{dist:{from:8}}, mult:1.3, range:4, fx:{ring:{r:4, slow:3}}}},
});
