//@ The Wanderer's path Forager (grind, from Scavenger): far more drops, a sharp eye for what a kill leaves behind, a pack-clearing burst that pulls the camp together
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js, tools/skillsets-ladder.js --wanderer --path forager
   (a grind path: judged on the pack column, about 80% of the grind sets' pack at Bond VI; the drop stat does not show in the ladder). Stats of the Wanderer's tree: the 'grind' table. */
defineWandererPath({
  id:'forager', name:'Forager', role:'grind', kit:'grind', from:'scavenger',
  text:'Turn every camp into a haul: a much better chance of drops, and kills that burst into the next pack.',
  passive:{name:'Keen Nose', text:'+{}% chance of monster drops; you deal 25% less damage', stat:'drop', v:[0.25, 0.05], cost:{stat:'dmg', v:-0.25}},
  ult:{name:'Windfall', desc:'You throw a net of wind and clatter: a field 8 m wide opens on the target, drags the camp in and keeps hitting for 3 seconds, and the stunned cannot scatter.', range:26, mult:1.2, act:['wdforagerult',0.9,0.55], anim:'nova',
       fx:{zone:{r:8, dur:3, first:0.3, every:0.5, kb:-2}},
       boost:[{piece:'a2', secs:14, mod:{size:1.4, cd:0.5}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Sharp Eyes', text:'+{}% chance of monster drops', stat:'drop', v:0.10},
    2:{name:'Rummage', text:'A kill bursts 5 m round it for 80% damage (at most every 2 s)', on:'kill', at:'target', icd:2, mult:0.8, range:5, fx:{ring:{r:5}}},
    4:{name:'Full Pockets', text:'+{}% chance of monster drops', stat:'drop', v:0.10},
    6:{name:'Bountiful', text:'While three or more enemies are within 8 m, every 3 s a shockwave rolls out 8 m for 400% damage and takes 1 s off every cooldown', on:'tick', icd:3, when:{crowd:{n:3, r:8}}, mult:4.0, range:8, cdr:{all:1}, fx:{ring:{r:8}}}},
});
