//@ The Wanderer's path Fury (risk DPS, from Ferocity): more damage for less safety, crits that feed the rage, a red ruin of a burst; the worked example of a path file
/* Agent map. Registry and the entry's format: shared/wanderer.js (defineWandererPath); design: PLAN section 7; the card for the other paths: skills-revamp-plan/wanderer-card.md.
   Test: tools/bond-smoke.js (the paths block), tools/skillsets-ladder.js --wanderer (target: about 80% of the average damage set at Bond VI; measured numbers in the step 18 report).
   The shape every path follows: a passive built from its shop passive (stronger, with a twist that fits the role: here a cost, you take more damage), Realization I and IV passive-style rows,
   II and VI rows like a set's 3- and 5-set rows, and a burst whose two boosts buff a class active worn (a1-a3) and / or the path passive (p1). Stats of the Wanderer's tree: the 'risk' table. */
defineWandererPath({
  id:'fury', name:'Fury', cls:'warrior', el:null, role:'risk', kit:'risk', from:'ferocity',
  text:'Hit harder than anyone and pay for it: more damage, more taken, and critical hits that stoke the rage.',
  passive:{name:'Red Temper', text:'+{}% damage with every attack; you take 8% more damage', stat:'dmg', v:[0.09, 0.02], cost:{stat:'red', v:-0.08}},
  ult:{name:'Red Ruin', desc:'You hurl a blood-red shock onto the target: 8 m of torn ground that keeps bursting for 2 seconds, and the stunned reel.', range:26, mult:1.5, act:['wdfuryult',0.9,0.55], anim:'nova',
       fx:{zone:{r:8, dur:2, first:0.2, every:0.5}},
       boost:[{piece:'a2', secs:12, mod:{mult:2}}, {piece:'p1', secs:16, mod:{v:2}}]},
  real:{
    1:{name:'Bloodrush', text:'A critical hit stokes you: 10% more damage for 4 s (at most every 3 s)', on:'crit', icd:3, buff:{kind:'might', v:0.10, dur:4}},
    2:{name:'Rending Blow', text:'A hit tears again round its target (at most every 2.5 s): 70% damage to everything within 3 m', on:'hit', at:'target', icd:2.5, mult:0.7, range:3, fx:{ring:{r:3}}},
    4:{name:'Blood Price', text:'+{}% critical hit damage; you have 8% less maximum health', stat:'critdmg', v:0.15, cost:{stat:'hp', v:-0.08}},
    6:{name:'Rampant', text:'A critical hit or a kill sets off a burst 5 m round the target for 80% damage and heals you for 2% of maximum health (at most every 2 s)', on:['kill','crit'], at:'target', icd:2, heal:0.02, mult:0.8, range:5, fx:{ring:{r:5}}}},
});
