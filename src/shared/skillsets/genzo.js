//@ Genzo's skill set, The Gate Bell (a tank, air): a taunting toll, a held note that wards the party, and the great bell that answers a broken ward; bronze, lacquer red and cloud white
/* Agent map. Kit: docs/skillkits/kit-tank.md + kit-mixed.md (main tank, also healer, mild: the bell mends the party); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces air: a held pack carries the aura a partner reacts with); outfit and palette: docs/skillkits/looks/genzo.md,
   game/outfits/genzo.js; visuals: game/skillsets/look-genzo.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js, tools/skillsets-ladder.js --set genzo.
   Land: the Sakura Vale (tier 3). Mark: Toll. Unlike Torgeir (the other tank: Fixation, spent by one big wall) he rings: every strike tolls once, Hold the Hour spends the tolls for a heal, and his bonus answers a broken shield. */
defineSkillSet({
  id:'genzo', name:'The Gate Bell', land:'vale', needs:{tier:3}, el:'air', outfit:'genzo',
  role:{main:'tank', also:{role:'heal', part:'mild'}},
  char:{name:'Genzo', sex:'male', theme:'a temple gate-keeper and bell-ringer who stands in the doorway and lets the hour pass over him', ip:{kind:'original', riffs:'the temple gate-keeper and bell-ringer trade (a bronze bell, a ringed staff, a rope belt); no existing character'}},
  pal:{main:0xb8452a, accent:0xd2a24a, glow:0xf3ead2},
  emblem:{col:0xe08a52, glyph:'<path d="M12 3v2.5"/><path d="M6 17c0-6 2-9.5 6-9.5s6 3.5 6 9.5z"/><path d="M4.5 17h15"/><circle cx="12" cy="20" r="1.4"/>'},
  kit:{mark:'toll', name:'Toll', text:'Every strike leaves a Toll (up to 5) on what it hit; Hold the Hour spends them all for a heavier blow that heals you.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Bell Mallet', desc:'Strike with the bronze mallet: a solid blow, and everything it hits turns on you for 3 seconds. Leaves a Toll on the target.', cd:1.0, range:3.4, mult:0.9, act:['genzo1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.0, kb:2, taunt:{dur:3}, mark:{id:'toll', n:1, dur:12, max:5}}}}},
       passive:{name:'Bronze Skin', text:'{}% less damage taken while you hold an enemy (one you taunted)', stat:'red', v:[0.10, 0.01], when:{taunting:true}}},
    2:{bound:'any',
       skill:{any:{name:'Ring the Hour', desc:'Strike the bell: a wide taunt (4 seconds, 12 m), 20% less damage taken for you and your party for 6 seconds and a shield worth 8% of your health, and 3% more for each Toll on the enemies near you. The note also mends you and your allies for 6% of maximum health. What is close is shoved back.', cd:16, range:6, mult:0.75, act:['genzo2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:3, mark:{id:'toll', n:1, dur:12, max:5}}, taunt:{dur:4, r:12}, ally:{kind:'guard', v:0.2, dur:6, r:15}, shield:{v:0.08, dur:6, r:15, perMark:{id:'toll', v:0.03, r:10}}, heal:{v:0.06, r:15}}}},
       passive:{name:'Resonance', text:'{}% of the damage you take is thrown back at the attacker', stat:'reflect', v:[0.15, 0.02]}},
    3:{bound:'any',
       skill:{any:{name:'Hold the Hour', desc:'Stand in the gate and let the great bell sound: a taunt for 6 seconds (a boss\'s melee for half of that), 30% less damage taken and a shield worth 14% of health (and 3% more for each Toll nearby) for you and your party for 8 seconds. The great note mends you and your allies for 18% of maximum health, then it spends every Toll nearby for extra damage, and a share of it heals you.', cd:40, range:8, mult:1.25, act:['genzo3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:8, kb:6}, taunt:{dur:6, r:16}, ally:{kind:'guard', v:0.3, dur:8, r:20}, shield:{v:0.14, dur:8, r:20, perMark:{id:'toll', v:0.03, r:10}}, pop:{id:'toll', k:0.6, r:8, heal:0.4}, heal:{v:0.18, r:20}}}},
       passive:{name:'Temple Robes', text:'+{}% maximum health; you deal 10% less damage', stat:'hp', v:[0.10, 0.02], cost:{stat:'dmg', v:-0.10}}}},
  bonus:{
    3:{name:'First Toll', text:'The first taunt of a fight raises a shield worth 10% of your maximum health for 6 s (at most every 12 s)', on:'taunt', icd:12, shield:{v:0.10, dur:6}},
    5:{name:'The Bell Answers', text:'When a shield of yours breaks or runs out, the bell answers: a gust 6 m round you that throws enemies back (at most every 5 s)', on:'shield', icd:5, mult:0.9, range:6, fx:{ring:{r:6, kb:8}}}},
});
