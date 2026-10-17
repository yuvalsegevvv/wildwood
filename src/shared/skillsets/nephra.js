//@ Nephra's skill set, The Linen Rite (a shield healer, earth): wrappings that become shields, a salve that spends the linen it left on the enemy, and a shield that bites back when it breaks; sand gold, lapis and old linen
/* Agent map. Kit: docs/skillkits/kit-healer.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (version 3, the Sunscar's first pair: all six pieces earth, the dry tomb-dust of the desert); outfit and palette:
   docs/skillkits/looks/nephra.md, game/outfits/nephra.js; visuals: game/skillsets/look-nephra.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3-smoke.js.
   LAND: the Sunscar's pair, from the Glass Guardian, the Sand Wyrm and the Sandglass at +3 (Sabir at +1 and Zahra at +2 are the Sunscar's other two; +4 and +5 roll Nephra; SS_SOURCES.sun); the free
   testing tools (server/skillsets-free.js) still give it to anyone. Mark: Linen (left on enemies by the blows, spent by Salve for Sand).
   What makes her unlike Ambrose (the water healer): she heals by SHIELDS (blows shield the party, a salve shields and guards), not by lowest-health heals, and a broken shield strikes back (the `shield` trigger). */
defineSkillSet({
  id:'nephra', name:'The Linen Rite', land:'sun', needs:{tier:3}, el:'earth', outfit:'nephra',
  role:{main:'heal'},
  char:{name:'Nephra', sex:'female', theme:'a risen tomb-keeper of the Sunscar who wraps the living in linen that turns blows aside', ip:{kind:'original', riffs:'the embalmer and tomb-keeper genre (linen wrappings, lapis, gold collars); no existing character'}},
  pal:{main:0xd9c79a, accent:0x2f55a0, glow:0x6fd6c8},
  emblem:{col:0xe6d3a0, glyph:'<path d="M12 3c3.4 2.2 3.4 6.4 0 8.6C8.6 9.4 8.6 5.2 12 3z"/><path d="M12 11.6V21"/><path d="M7 16h10"/><path d="M8.5 19.5h7"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col)
  kit:{mark:'linen', name:'Linen', text:'Every blow leaves Linen (up to 5) on its target; Salve for Sand spends it for extra damage and a mend.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Binding Lash', desc:'Lash with a length of linen: a damaging hit that wraps you and the allies within 12 m in a thin shield (3% of maximum health, 4 seconds). Leaves Linen.', cd:1.0, range:3.4, mult:1.7, act:['nephra1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.1, mark:{id:'linen', n:1, dur:12, max:5}}, shield:{v:0.03, dur:4, r:12}}},
         archer:{name:'Wrapped Arrow', desc:'An arrow trailing linen: a damaging hit that wraps you and the allies within 12 m in a thin shield (3% of maximum health, 4 seconds). Leaves Linen.', cd:0.9, range:28, mult:1.6, act:['nephra1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'thorn', speed:44, turn:9, life:0.9, mark:{id:'linen', n:1, dur:12, max:5}}, shield:{v:0.03, dur:4, r:12}}},
         mage:{name:'Dust Bolt', desc:'A fist of tomb-dust: a damaging hit that wraps you and the allies within 12 m in a thin shield (3% of maximum health, 4 seconds). Leaves Linen.', cd:1.1, range:24, mult:2.0, act:['nephra1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spore', speed:32, turn:8, life:1.0, mark:{id:'linen', n:1, dur:12, max:5}}, shield:{v:0.03, dur:4, r:12}}}},
       passive:{name:'Many Layers', text:'+{}% maximum health', stat:'hp', v:[0.06, 0.01]}},
    2:{bound:'any',
       skill:{any:{name:'Salve for Sand', desc:'Pull every Linen within 8 m tight: the enemies take damage for each, and a share of it mends you. You and your allies within 20 m are shielded for 10% of maximum health for 8 seconds and take 12% less damage, 2% less for each Linen.', cd:12, range:8, mult:1.4, act:['nephra2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:8}, pop:{id:'linen', k:0.5, r:8, heal:0.5}, shield:{v:0.10, dur:8, r:20}, ally:{kind:'guard', v:0.12, dur:8, r:20, perMark:{id:'linen', v:0.02, r:8}}}}},
       passive:{name:'Sand in the Seams', text:'When you are hurt, a shield of 4% of maximum health forms round you for 4 seconds (at most every 6 s)', on:'hurt', icd:6, shield:{v:0.04, dur:4}}},
    3:{bound:'any',
       skill:{any:{name:'Rise Again', desc:'The rite of the dead: you and your allies within 20 m are mended for 25% of maximum health, shielded for 15% and regenerate 3% a second for 8 seconds. A wave of dust round you hurts the enemies near and throws them back.', cd:55, range:9, mult:2.4, act:['nephra3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:9, kb:4}, heal:{v:0.25, r:20}, shield:{v:0.15, dur:8, r:20}, ally:{kind:'regen', v:0.03, dur:8, r:20}}}},
       passive:{name:'Heavy with Gold', text:'{}% less damage taken; you deal 15% less damage', stat:'red', v:[0.08, 0.01], cost:{stat:'dmg', v:-0.15}}}},
  bonus:{
    3:{name:'Bound to Return', text:'A party member you bring back in a dungeon stands up with {}% of their health', stat:'revive', v:0.4},
    5:{name:'The Curse Bites', text:'When a shield of yours breaks or runs out, a curse of dust goes out 8 m: 120% damage and the enemies in it take 12% more damage from everyone for 5 seconds (at most every 6 s)', on:'shield', icd:6, mult:1.2, range:8, fx:{ring:{r:8, status:{kind:'vuln', v:0.12, dur:5}}}}},
});
