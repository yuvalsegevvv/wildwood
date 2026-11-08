//@ The Wanderer's path Prism (safe DPS, the element wheel): hits that beat their target's element on the wheel (x1.5) hit harder, crit more and split again; the old Resonance passive reborn
/* Agent map. Registry and format: shared/wanderer.js (defineWandererPath); the worked example: shared/wanderer/fury.js. Test: tools/bond-smoke.js (the paths block, the adv check), tools/skillsets-ladder.js --wanderer --path prism
   (a safe damage path: about 80% of the damage sets' average at Bond VI). The wheel and its numbers: shared/elements.js (foeMult). Every row here asks the `adv` condition (skillsets: a hit whose element beats
   the target's; the element-less x1.1 is not one): it is read where the hit is rolled (server/combat.js rollDmgS, ssCondP) and from the hit that fires a trigger (ssWhen). NOT built: PLAN section 6's "your skills
   take the element of the monster last hit with an advantage" (an element switch); an open question for the owner. No soul, no soul stat, no reactions. Stats of the Wanderer's tree: the 'safe' table. */
defineWandererPath({
  id:'prism', name:'Prism', cls:'mage', el:'light', role:'safe', kit:'safe', from:null,
  text:'Play the wheel: attacks whose element beats the enemy\'s hit harder, crit more often and split into a second blow.',
  passive:{name:'Prism Lens', text:'+{}% damage with an attack whose element beats the target\'s', stat:'dmg', v:[0.30, 0.03], when:{adv:true}},
  ult:{name:'Spectrum', desc:'You split a beam of white light into a wide fan: a 9 m burst of light round the target that hits everything there, and the stunned cannot look away.', range:28, mult:1.5, act:['wdprismult',0.9,0.55], anim:'nova',
       fx:{zone:{r:9, dur:2, first:0.2, every:0.5}},
       boost:[{piece:'a2', secs:12, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Clear Facet', text:'+{}% critical hit damage', stat:'critdmg', v:0.12},
    2:{name:'Refraction', text:'A hit that beats its target\'s element splits again: 100% damage to everything within 4 m (at most every 3 s)', on:'hit', at:'target', icd:3, when:{adv:true}, mult:1.0, range:4, fx:{ring:{r:4}}},
    4:{name:'Bright Edge', text:'+{}% critical hit chance against a target whose element your attack beats', stat:'crit', v:0.10, when:{adv:true}},
    6:{name:'Full Spectrum', text:'A critical hit that beats its target\'s element bursts 5 m round it for 150% damage and heals you for 1.5% of your maximum health (at most every 3 s)', on:'crit', at:'target', icd:3, when:{adv:true}, mult:1.5, range:5, heal:0.015, fx:{ring:{r:5}}}},
});
