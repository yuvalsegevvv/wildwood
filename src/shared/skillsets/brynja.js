//@ Brynja's skill set, The Rime Run (risk DPS, water): fast cuts while she keeps moving, a skate-dash that chills what it crosses, and a whiteout that spends the frost; ice blue, slate and snow
/* Agent map. Kit: docs/skillkits/kit-risk-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (one element, water: the chill, a slow, and the polar night she skates through); outfit and palette: docs/skillkits/looks/brynja.md,
   game/outfits/brynja.js; visuals: game/skillsets/look-brynja.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js, tools/skillsets-ladder.js --set brynja.
   Land: the Hoarfrost Reach (tier 3). Mark: Rime. Unlike Sazanka (from behind) and Sabir (the wounded) she lives on the chill: shots build Rime, Glide and Cut hits a rimed target 40% harder and chills
   it for 4 s (vs: Cold Read), Whiteout cast into the chill shatters it for x1.5, its pop included (vs `slowed`: Shatter); held, skill 2 is Frost Line, a safe frost line that chills and rimes from range
   (alt, shared/skill-hold.js). She pays in maximum health and damage taken. The combo: docs/skillkits/COMBO-REWORK.md section 3. */
defineSkillSet({
  id:'brynja', name:'The Rime Run', land:'hoar', needs:{tier:3}, el:'water', outfit:'brynja',
  role:{main:'risk'},
  char:{name:'Brynja', sex:'female', theme:'an ice-skater and frost-hunter who never stops moving across the frozen lake and cuts as she passes', ip:{kind:'original', riffs:'the frost-hunter and ice-skater genre (a fur-trimmed hood, a blade on the boot); no existing character'}},
  pal:{main:0x6fb4e0, accent:0xeaf4fb, glow:0xb8e6ff},
  emblem:{col:0x86cdf2, glyph:'<path d="M12 3v18"/><path d="M4.5 7.5l15 9M19.5 7.5l-15 9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>'},
  kit:{mark:'rime', name:'Rime', text:'Every cut leaves Rime (up to 5). Glide and Cut hits a rimed target harder and chills it; Whiteout shatters the chilled for half again as much and spends the Rime.',
       combo:{order:['skill','burst'], win:4, text:'Shoot to five Rime, glide in, then loose Whiteout while the target is still chilled.'}},
  pos:{
    1:{bound:'class',
       skill:{
         archer:{name:'Icicle Shot', desc:'A shard of ice loosed fast: heavy for a basic attack. Leaves Rime.', cd:1.0, range:26, mult:2.35, act:['brynja1a',0.5,0.45], anim:'shoot', el:'water',
                 fx:{proj:{kind:'frost', speed:50, turn:7, life:0.8, mark:{id:'rime', n:1, dur:12, max:5}}},style:'press',hold:{x:{slow:3}}}},
       passive:{name:'Skate Mark', text:'Casting Glide and Cut leaves a patch of black ice where you set off: for 4 seconds it chills and hurts what stands in it (at most every 6 s)', on:'cast2', icd:6, mult:0.5, range:3.5, fx:{zone:{r:3.5, dur:4, every:0.5, slow:2}}}},
    2:{bound:'any',
       skill:{any:{name:'Glide and Cut', desc:'Skate up to 9 m to your target and cut everything round it: 40% harder against a target carrying Rime. Chills what it hits for 4 seconds and leaves Rime on each. Hold: Frost Line.', cd:8, range:9, mult:1.2, act:['brynja2x',0.5,0.3], anim:'slash', el:'water',
                   fx:{dash:{ahead:2}, ring:{r:3.4, slow:4, mark:{id:'rime', n:1, dur:12, max:5}}, vs:{when:{marked:'rime'}, k:1.4, name:'Cold Read'}},   // (the ring marks after its damage: its own Rime never switches Cold Read on)
                   alt:{name:'Frost Line', secs:0.5, desc:'Stay where you are and send a line of frost 12 m ahead: light damage, 4 seconds of chill and Rime on everything in it.', mult:0.7, range:12, act:['brynja2xh',0.6,0.4], anim:'cast',
                        fx:{cone:{r:12, arc:0.22, slow:4, mark:{id:'rime', n:1, dur:12, max:5}}}}}},   // (a narrow cone, because a beam applies no status)
       passive:{name:'Thin Ice', text:'+{}% critical hit damage; you take 10% more damage', stat:'critdmg', v:[0.30, 0.04], cost:{stat:'red', v:-0.10}}},
    3:{bound:'any',
       skill:{any:{name:'Whiteout', desc:'Loose a blizzard at your target: it bursts over a 6 m circle. Spends every Rime there for extra damage. Shatter: everything that is already chilled when you loose it takes half again as much.', cd:30, range:24, mult:2.9, act:['brynja3x',0.8,0.6], anim:'cast', el:'water',
                   fx:{proj:{kind:'frost', speed:24, turn:6, life:1.2, splash:{r:6, k:1.0}, slow:2}, pop:{id:'rime', k:0.7, r:6}, vs:{when:{slowed:true}, k:1.5, name:'Shatter'}}}},   // (its own slow lands after the damage, and the pop is rolled at the cast: it never enables itself)
       passive:{name:'Light Boots', text:'+{}% damage with every attack; you have 12% less maximum health', stat:'dmg', v:[0.10, 0.015], cost:{stat:'hp', v:-0.12}}}},
  ult:{name:'Avalanche Run', desc:'She skates a full circle around the target (8 m), leaving a wall of frost that then shatters inward.', range:24, mult:5.6, act:['brynjault',1.0,0.7], anim:'cast',
       fx:{zone:{r:8, dur:0.8, once:true, slow:2}},
       boost:[{piece:'a3', secs:10, mod:{mult:2}}, {piece:'cave', secs:12, mod:{mult:2, size:1.3}}]},
  tree:'willow', stone:'Frost Bondstone',
  bonds:{   // Bond I and IV: the two passives that are no longer equippable; II and VI: the old 3- and 5-set rows (the Bond engine reads them in step 12)
    1:'brynja_p2',
    2:{name:'Cold Edge', text:'A hit on a target carrying Rime (at most every 2 s) cuts again for 130% damage', on:'hit', when:{marked:'rime'}, icd:2, mult:1.3, range:3.4, fx:{cone:{r:3.4, arc:1.2}}},
    4:'brynja_p3',
    6:{name:'Frozen Wake', text:'A kill or a critical hit sends a frost ring 6 m round the target for 120% damage, leaves Rime on what it hits and heals you for 3% of maximum health (at most every 2 s)', on:['kill', 'crit'], at:'target', icd:2, heal:0.03, mult:1.2, range:6, fx:{ring:{r:6, mark:{id:'rime', n:1, dur:12, max:5}}}}},
});
