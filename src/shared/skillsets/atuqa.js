//@ Atuqa's skill set, The Terrace Wall (a tank, light): a sling stone that pins its target, a terrace raised under the party, and a wall of sun that holds the line; woven red, gold thread and terrace stone
/* Agent map. Kit: docs/skillkits/kit-tank.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces light: Torgeir's kit in another voice); outfit: game/outfits/atuqa.js, docs/skillkits/looks/atuqa.md;
   visuals: game/skillsets/look-atuqa.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-isles-smoke.js, tools/skillsets-ladder.js --set atuqa.
   Land: the Emberwake Isles (tier 3). Mark: Knot, spent by Hold the Wall (a quipu: every knot is a promise she keeps). Numbers are Torgeir's on purpose (the ladder holds for them); only the words, the element and the look are his. */
defineSkillSet({
  id:'atuqa', name:'The Terrace Wall', land:'isles', needs:{tier:3}, el:'light', outfit:'atuqa',
  role:{main:'tank'},
  char:{name:'Atuqa', sex:'male', theme:'a highland keeper of knotted cords who holds a terrace wall for the ones behind it', ip:{kind:'original', riffs:'the Andean terrace-keeper and quipu-reader genre (a woven poncho, a knotted cord, a sling); no existing character'}},
  pal:{main:0xb83a2a, accent:0xe8c860, glow:0xfff0b0},
  emblem:{col:0xd8a64a, glyph:'<path d="M3 20h18"/><path d="M5 20v-4h14v4"/><path d="M8 16v-4h8v4"/><path d="M10.5 12V8h3v4"/><circle cx="12" cy="5" r="1.4"/>'},
  kit:{mark:'knot', name:'Knot', text:'Every shot leaves a Knot (up to 5) on what it hit; Hold the Wall spends them all for a heavier blow that heals you.'},
  pos:{
    1:{bound:'class',
       skill:{
         archer:{name:'Sling Stone', desc:'A heavy stone at up to 20 m that pins its target in place and makes it come for you for 3 seconds. Leaves a Knot.', cd:1.0, range:20, mult:0.85, act:['atuqa1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'snipe', speed:44, turn:9, life:0.55, taunt:{dur:3}, mark:{id:'knot', n:1, dur:12, max:5}}}}},
       passive:{name:'Woven Cloak', text:'{}% less damage taken while you hold an enemy (one you taunted)', stat:'red', v:[0.10, 0.01], when:{taunting:true}}},
    2:{bound:'any',
       skill:{any:{name:'Raise the Terrace', desc:'Plant your feet and raise a stone terrace: a wide taunt (4 seconds, 12 m), 20% less damage taken for you and your party for 6 seconds and a shield worth 8% of your health, and 3% more for each Knot on the enemies near you. What is close is shoved back.', cd:16, range:6, mult:0.75, act:['atuqa2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:3, mark:{id:'knot', n:1, dur:12, max:5}}, taunt:{dur:4, r:12}, ally:{kind:'guard', v:0.2, dur:6, r:15}, shield:{v:0.08, dur:6, r:15, perMark:{id:'knot', v:0.03, r:10}}}}},
       passive:{name:'Mirror Return', text:'{}% of the damage you take is thrown back at the attacker', stat:'reflect', v:[0.15, 0.02]}},
    3:{bound:'any',
       skill:{any:{name:'Hold the Wall', desc:'Stamp the ground and hold: a taunt for 6 seconds (a boss\'s melee for half of that), 30% less damage taken and a shield worth 14% of health (and 3% more for each Knot nearby) for you and your party for 8 seconds. Then it spends every Knot nearby for extra damage, and a share of it heals you.', cd:40, range:8, mult:1.25, act:['atuqa3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:8, kb:6}, taunt:{dur:6, r:16}, ally:{kind:'guard', v:0.3, dur:8, r:20}, shield:{v:0.14, dur:8, r:20, perMark:{id:'knot', v:0.03, r:10}}, pop:{id:'knot', k:0.6, r:8, heal:0.4}}}},
       passive:{name:'Weight of Stone', text:'+{}% maximum health; you deal 10% less damage', stat:'hp', v:[0.10, 0.02], cost:{stat:'dmg', v:-0.10}}}},
  ult:{name:'Wall of the Sun', desc:'A ghost terrace of gold light slams down in an 8 m cone in front of him and holds everything it stuns; what it hits comes for him.', range:10, mult:1.9, act:['atuqault',1.0,0.55], anim:'nova',
       fx:{cone:{r:8, arc:0.8, kb:5, taunt:{dur:4}}},
       boost:[{piece:'a2', secs:12, mod:{util:2}}, {piece:'p2', secs:16, mod:{v:2.5}}]},
  bonus:{
    3:{name:'First Knot', text:'The first taunt of a fight raises a shield worth 10% of your maximum health for 6 s (at most every 12 s)', on:'taunt', icd:12, shield:{v:0.10, dur:6}},
    5:{name:'Sunburst', text:'When a shield of yours breaks or runs out, the sun answers: a burst 6 m round you that throws enemies back (at most every 5 s)', on:'shield', icd:5, mult:0.9, range:6, fx:{ring:{r:6, kb:8}}}},
});
