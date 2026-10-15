//@ Torgeir's skill set, The Shield-Wall (a tank, earth): a taunting strike, a brace that shields the party, and a wall that holds the line; stone, bone and iron
/* Agent map. Kit: docs/skillkits/kit-tank.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces earth: the aura of a held pack lets a partner's hit react); outfit and palette: docs/skillkits/looks/torgeir.md,
   game/outfits/torgeir.js; visuals: game/skillsets/look-torgeir.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set torgeir.
   Land: the Hoarfrost Reach (tier 1). Mark: Fixation, spent by Hold the Line.
   What the engine gives him: a `taunt` inside an entry (the strike, the shot or the bolt taunts what it HITS, from any range), the `taunting` condition (Thick Hide), `perMark` (a shield that grows with the Fixation near him, and Hold the Line
   spends it just after), and the `taunt` and `shield` triggers (the first taunt of a fight raises a shield; a shield that breaks or runs out strikes back). */
defineSkillSet({
  id:'torgeir', name:'The Shield-Wall', land:'hoar', needs:{tier:1}, el:'earth', outfit:'torgeir',
  role:{main:'tank'},
  char:{name:'Torgeir', sex:'male', theme:'a northern shield-wall veteran: round shield, heavy mantle, unhurried', ip:{kind:'original', riffs:'the shield-wall veteran genre (a round shield, a fur mantle); no existing character'}},
  pal:{main:0x7d8c5a, accent:0xe3dccb, glow:0xb59a4a},
  emblem:{col:0xa8bd78, glyph:'<path d="M2 20L9.5 7l4 7 2.5-3.5L22 20z"/><path d="M9.5 7L8.2 10.2l2 1.3 1.2-1.7"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col): never the generic star
  kit:{mark:'fixation', name:'Fixation', text:'Every strike leaves a Fixation (up to 5) on what it hit; Hold the Line spends them all for a heavier blow that heals you.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Anchor Strike', desc:'Slam the shield into the enemy in front of you: a solid blow, and everything it hits turns on you for 3 seconds. Leaves a Fixation on the target.', cd:1.0, range:3.4, mult:0.9, act:['torgeir1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.0, kb:2, taunt:{dur:3}, mark:{id:'fixation', n:1, dur:12, max:5}}}},
         archer:{name:'Pinning Shot', desc:'A heavy shot at up to 20 m that pins its target in place and makes it come for you for 3 seconds. Leaves a Fixation.', cd:1.0, range:20, mult:0.85, act:['torgeir1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'thorn', speed:44, turn:9, life:0.55, taunt:{dur:3}, mark:{id:'fixation', n:1, dur:12, max:5}}}},
         mage:{name:'Ward Bolt', desc:'A bolt of stone that leaves a small ward round you (a shield of 5% of your health for 5 seconds); what it hits turns on you for 3 seconds. Leaves a Fixation.', cd:1.2, range:22, mult:0.95, act:['torgeir1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spore', speed:30, turn:8, life:1.1, taunt:{dur:3}, mark:{id:'fixation', n:1, dur:12, max:5}}, shield:{v:0.05, dur:5, r:0.1}}}},
       passive:{name:'Thick Hide', text:'{}% less damage taken while you hold an enemy (one you taunted)', stat:'red', v:[0.10, 0.01], when:{taunting:true}}},
    2:{bound:'any',
       skill:{any:{name:'Brace', desc:'Plant your feet and raise the shield: a wide taunt (4 seconds, 12 m), 20% less damage taken for you and your party for 6 seconds and a shield worth 8% of your health, and 3% more for each Fixation on the enemies near you. What is close is shoved back.', cd:16, range:6, mult:0.75, act:['torgeir2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:3, mark:{id:'fixation', n:1, dur:12, max:5}}, taunt:{dur:4, r:12}, ally:{kind:'guard', v:0.2, dur:6, r:15}, shield:{v:0.08, dur:6, r:15, perMark:{id:'fixation', v:0.03, r:10}}}}},
       passive:{name:'Iron Return', text:'{}% of the damage you take is thrown back at the attacker', stat:'reflect', v:[0.15, 0.02]}},
    3:{bound:'any',
       skill:{any:{name:'Hold the Line', desc:'Stamp the ground and hold: a taunt for 6 seconds (a boss\'s melee for half of that), 30% less damage taken and a shield worth 14% of health (and 3% more for each Fixation nearby) for you and your party for 8 seconds. Then it spends every Fixation nearby for extra damage, and a share of it heals you.', cd:40, range:8, mult:1.25, act:['torgeir3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:8, kb:6}, taunt:{dur:6, r:16}, ally:{kind:'guard', v:0.3, dur:8, r:20}, shield:{v:0.14, dur:8, r:20, perMark:{id:'fixation', v:0.03, r:10}}, pop:{id:'fixation', k:0.6, r:8, heal:0.4}}}},
       passive:{name:'Heavy Plate', text:'+{}% maximum health; you deal 10% less damage', stat:'hp', v:[0.10, 0.02], cost:{stat:'dmg', v:-0.10}}}},
  bonus:{
    3:{name:'First Contact', text:'The first taunt of a fight raises a shield worth 10% of your maximum health for 6 s (at most every 12 s)', on:'taunt', icd:12, shield:{v:0.10, dur:6}},
    5:{name:'Shattering Return', text:'When a shield of yours breaks or runs out, the earth answers: a burst 6 m round you that throws enemies back (at most every 5 s)', on:'shield', icd:5, mult:0.9, range:6, fx:{ring:{r:6, kb:8}}}},
});
