//@ Brynja's skill set, The Rime Run (risk DPS, water): fast cuts while she keeps moving, a skate-dash that chills what it crosses, and a whiteout that spends the frost; ice blue, slate and snow
/* Agent map. Kit: docs/skillkits/kit-risk-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (a hybrid, water + dark: P1 and P3 water (the chill, a slow), P2 dark (the polar night she skates through); only the water pieces get a water soul's x1.5, in exchange her own water then dark hits react with each other); outfit and palette: docs/skillkits/looks/brynja.md,
   game/outfits/brynja.js; visuals: game/skillsets/look-brynja.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js, tools/skillsets-ladder.js --set brynja.
   Land: the Hoarfrost Reach (tier 3). Mark: Rime. Unlike Sazanka (from behind) and Sabir (the wounded) she lives on momentum: Momentum needs a second of movement (`moved`), and she pays in maximum health. */
defineSkillSet({
  id:'brynja', name:'The Rime Run', land:'hoar', needs:{tier:3}, el:['water', 'dark'], outfit:'brynja',
  role:{main:'risk'},
  char:{name:'Brynja', sex:'female', theme:'an ice-skater and frost-hunter who never stops moving across the frozen lake and cuts as she passes', ip:{kind:'original', riffs:'the frost-hunter and ice-skater genre (a fur-trimmed hood, a blade on the boot); no existing character'}},
  pal:{main:0x6fb4e0, accent:0xeaf4fb, glow:0xb8e6ff},
  emblem:{col:0x86cdf2, glyph:'<path d="M12 3v18"/><path d="M4.5 7.5l15 9M19.5 7.5l-15 9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>'},
  kit:{mark:'rime', name:'Rime', text:'Every cut leaves Rime (up to 5); Whiteout spends all of it for extra damage.'},
  pos:{
    1:{bound:'class',
       skill:{
         archer:{name:'Icicle Shot', desc:'A shard of ice loosed fast: heavy for a basic attack. Leaves Rime.', cd:1.0, range:26, mult:2.25, act:['brynja1a',0.5,0.45], anim:'shoot', el:'water',
                 fx:{proj:{kind:'frost', speed:50, turn:7, life:0.8, mark:{id:'rime', n:1, dur:12, max:5}}},style:'press',hold:{x:{slow:3}}}},
       passive:{name:'Momentum', text:'+{}% damage while you have been moving for a second', stat:'dmg', v:[0.12, 0.02], when:{moved:1}}},
    2:{bound:'any',
       skill:{any:{name:'Glide and Cut', desc:'Skate up to 9 m through the polar dark to your target and cut everything round it, chilling it for 4 seconds. Leaves Rime on each.', cd:8, range:9, mult:1.45, act:['brynja2x',0.5,0.3], anim:'slash', el:'dark',
                   fx:{dash:{ahead:2}, ring:{r:3.4, slow:1.5, mark:{id:'rime', n:1, dur:12, max:5}}}}},
       passive:{name:'Thin Ice', text:'+{}% critical hit damage; you take 10% more damage', stat:'critdmg', v:[0.30, 0.04], cost:{stat:'red', v:-0.10}}},
    3:{bound:'any',
       skill:{any:{name:'Whiteout', desc:'Loose a blizzard at your target: it bursts over a 6 m circle and chills what it hits. Spends every Rime on the target and everything within 6 m of it for extra damage.', cd:30, range:24, mult:3.4, act:['brynja3x',0.8,0.6], anim:'cast', el:'water',
                   fx:{proj:{kind:'frost', speed:24, turn:6, life:1.2, splash:{r:6, k:1.0}, slow:2}, pop:{id:'rime', k:0.8, r:6}}}},
       passive:{name:'Light Boots', text:'+{}% damage with every attack; you have 12% less maximum health', stat:'dmg', v:[0.10, 0.015], cost:{stat:'hp', v:-0.12}}}},
  ult:{name:'Avalanche Run', desc:'She skates a full circle around the target (8 m), leaving a wall of frost that then shatters inward.', range:24, mult:5.6, act:['brynjault',1.0,0.7], anim:'cast',
       fx:{zone:{r:8, dur:0.8, once:true, slow:2}},
       boost:[{piece:'a3', secs:10, mod:{mult:2}}, {piece:'cave', secs:12, mod:{mult:2, size:1.3}}]},
  bonus:{
    3:{name:'Cold Edge', text:'A hit on a target carrying Rime (at most every 2 s) cuts again for 130% damage', on:'hit', when:{marked:'rime'}, icd:2, mult:1.3, range:3.4, fx:{cone:{r:3.4, arc:1.2}}},
    5:{name:'Frozen Wake', text:'A kill or a critical hit sends a frost ring 6 m round the target for 120% damage, leaves Rime on what it hits and heals you for 3% of maximum health (at most every 2 s)', on:['kill', 'crit'], at:'target', icd:2, heal:0.03, mult:1.2, range:6, fx:{ring:{r:6, mark:{id:'rime', n:1, dur:12, max:5}}}}},
});
