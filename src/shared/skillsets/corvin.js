//@ Corvin's skill set, The Lamplight (a debuff support, light): a flash that exposes, a shutter that opens on a whole group, and noon over the field; brass, lamp white and verdigris
/* Agent map. Kit: docs/skillkits/kit-support.md (the debuff focus); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces light: his flavour is `vuln`, everyone hits harder); outfit and palette:
   docs/skillkits/looks/corvin.md, game/outfits/corvin.js; visuals: game/skillsets/look-corvin.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set corvin.
   Land: the Greyspine (tier 1). Mark: Glare. A vuln never stacks (the stronger wins) and is capped (RX_ST_CAP 0.30): a second debuffer adds nothing.
   What the engine gives him: a debuff-duration stat (Long Wick), a status that grows with his own mark (`status.perMark`: each Glare adds to the vuln he applies, still capped), the `exposed` condition (Second Look strengthens
   reactions on a target he exposed; Afterglow fires when one dies) and `at:'target'` (the exposure spreads from where it died). */
defineSkillSet({
  id:'corvin', name:'The Lamplight', land:'grey', needs:{tier:1}, el:'light', outfit:'corvin',
  role:{main:'support', focus:'debuff'},
  char:{name:'Corvin', sex:'male', theme:'a lamplighter and mine surveyor: light that shows where a thing is weak', ip:{kind:'original', riffs:'the lamplighter and mine-surveyor trade (a cap lamp, a plumb bob, brass fittings); no existing character'}},
  pal:{main:0xc9a13a, accent:0x5f8f7f, glow:0xfff1c9},
  kit:{mark:'glare', name:'Glare', text:'Every flash leaves a Glare (up to 3) on what it lit; a target carrying Glare takes more from you (the Second Look bonus).'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Flash Lens', desc:'Bash with the lantern shield: a hit that flashes, and what it lit takes 5% more damage from everyone for 3 seconds, and 3% more for each Glare it carries. Leaves a Glare.', cd:1.0, range:3.2, mult:1.05, act:['corvin1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.2, arc:0.9, status:{kind:'vuln', v:0.05, dur:3, perMark:{id:'glare', v:0.03}}, mark:{id:'glare', n:1, dur:10, max:3}}}},
         archer:{name:'Glint Arrow', desc:'An arrow with a lens for a head: it flashes where it lands, and the target takes 5% more damage from everyone for 3 seconds (3% more for each Glare). Leaves a Glare.', cd:0.9, range:28, mult:1.0, act:['corvin1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'thorn', speed:46, turn:9, life:0.8, status:{kind:'vuln', v:0.05, dur:3, perMark:{id:'glare', v:0.03}}, mark:{id:'glare', n:1, dur:10, max:3}}}},
         mage:{name:'Spark Lens', desc:'A spark focused through a lens: it flashes on the target, which takes 5% more damage from everyone for 3 seconds (3% more for each Glare). Leaves a Glare.', cd:1.1, range:24, mult:1.2, act:['corvin1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spirit', speed:34, turn:8, life:0.9, status:{kind:'vuln', v:0.05, dur:3, perMark:{id:'glare', v:0.03}}, mark:{id:'glare', n:1, dur:10, max:3}}}}},
       passive:{name:'Long Wick', text:'Your debuffs last {}% longer', stat:'debuffdur', v:[0.6, 0.1]}},
    2:{bound:'any',
       skill:{any:{name:'Open the Shutter', desc:'Throw the hood of the lantern open over your target\'s area (7 m): for 1.2 seconds it burns on everything inside, which then takes 12% more damage from everyone for 6 seconds (3% more for each Glare). Leaves a Glare on each.', cd:9, range:24, mult:0.72, act:['corvin2x',0.7,0.45], anim:'nova',
                   fx:{zone:{r:7, dur:1.2, every:0.4, status:{kind:'vuln', v:0.12, dur:6, perMark:{id:'glare', v:0.03}}, mark:{id:'glare', n:1, dur:10, max:3}}}}},
       passive:{name:'Reflector', text:'reactions you trigger come back {}% sooner', stat:'rxicd', v:[0.25, 0.03]}},
    3:{bound:'any',
       skill:{any:{name:'Noon', desc:'Open the shutter all the way: a flash of full noon in a ring 14 m round you. Every enemy in it takes 22% more damage from everyone for 8 seconds (2% more for each Glare; the cap is 30%).', cd:40, range:14, mult:1.9, act:['corvin3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:14, status:{kind:'vuln', v:0.22, dur:8, perMark:{id:'glare', v:0.02}}, mark:{id:'glare', n:1, dur:10, max:3}}}}},
       passive:{name:'Dazzled', text:'reactions you trigger are {}% stronger; you have 5% less critical hit chance', stat:'rxk', v:[0.20, 0.03], cost:{stat:'crit', v:-0.05}}}},
  bonus:{
    3:{name:'Second Look', text:'Reactions you trigger on a target you exposed are {}% stronger', stat:'rxk', v:0.30, when:{exposed:true}},
    5:{name:'Afterglow', text:'When a target you exposed dies, everything within 6 m of where it fell is exposed: 15% more damage taken for 5 s (at most every 3 s)', on:'kill', at:'target', when:{exposed:true}, icd:3, mult:0.3, range:6, fx:{ring:{r:6, status:{kind:'vuln', v:0.15, dur:5}}}}},
});
