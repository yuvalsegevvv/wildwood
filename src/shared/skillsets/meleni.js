//@ Meleni's skill set, The Tide Chant (a buff support, water): a bolt of sea-spray that quickens the line, a landfall chant that lifts the whole crew, and a tide called up under the party; lagoon turquoise, shell cream and driftwood
/* Agent map. Kit: docs/skillkits/kit-support.md (the buff focus, like Dunstan's Rally in another voice); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces water: her hits leave the aura a partner reacts with);
   outfit: none yet (a later pass); visuals: game/skillsets/look-meleni.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-isles-smoke.js,
   tools/skillsets-ladder.js --set meleni. Land: the Emberwake Isles (tier 1; Ocelo, Tuila and the Cenote of Hollow Stars are its sources). Mark: Swell. Buffs never stack (the stronger wins) and are capped (SS_ALLY_CAP), so a second
   buffer adds only a different KIND. Numbers are Dunstan's on purpose (the owner's ladder, tools/skillsets-ladder.js, holds for them); only the words, the element and the look are hers. */
defineSkillSet({
  id:'meleni', name:'The Tide Chant', land:'isles', needs:{tier:1}, el:'water',
  role:{main:'support', focus:'buff'},
  char:{name:'Meleni', sex:'female', theme:'a wayfinder-singer who chants the crew home across open water', ip:{kind:'original', riffs:'the Pacific wayfinder and chant-leader genre (a shell lei, a woven wrap, a paddle-staff); no existing character'}},
  pal:{main:0x2fb4b0, accent:0xf2e6c8, glow:0x7fe8ff},
  emblem:{col:0x6fe0d4, glyph:'<path d="M3 15c3-3 5-3 9 0s6 3 9 0"/><path d="M3 20c3-3 5-3 9 0s6 3 9 0"/><path d="M12 3v8"/><path d="M9 6l3-3 3 3"/>'},
  kit:{mark:'swell', name:'Swell', text:'Every strike leaves a Swell (up to 5); the Landfall Chant spends them for extra damage.'},
  pos:{
    1:{bound:'class',
       skill:{
         mage:{name:'Spray Bolt', desc:'A bolt of sea-spray: a damaging hit that quickens you and your allies within 18 m (10% shorter cooldowns for 3 seconds). Leaves a Swell.', cd:1.1, range:24, mult:1.5, act:['meleni1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'frost', speed:32, turn:8, life:1.0, mark:{id:'swell', n:1, dur:12, max:5}}, ally:{kind:'haste', v:0.10, dur:3, r:18}}}},
       passive:{name:'Carrying Voice', text:'Your buffs last {}% longer', stat:'buffdur', v:[0.4, 0.05]}},
    2:{bound:'any',
       skill:{any:{name:'Landfall Chant', desc:'A chant that carries over the water: you and your allies within 25 m deal 10% more damage for 10 seconds, and 2% more for each Swell on the enemies near you. A surge of water round you then spends every Swell nearby for extra damage.', cd:14, range:6, mult:1.1, act:['meleni2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:2}, ally:{kind:'might', v:0.10, dur:10, r:25, perMark:{id:'swell', v:0.02, r:8}}, pop:{id:'swell', k:0.5, r:6}}}},
       passive:{name:'Warm Lagoon', text:'While you fight, you and your allies within 20 m regenerate 1% of maximum health a second (refreshed every 3 s)', on:'tick', icd:3, buff:{kind:'regen', v:0.01, dur:4, r:20}}},
    3:{bound:'any',
       skill:{any:{name:'Call the Tide', desc:'Call the tide up round your feet for 8 seconds: you and your allies standing within 9 m get 20% more critical hit chance, 40% more critical damage and 2% health back a second, and the water at its edge batters the enemies there.', cd:45, range:9, mult:0.5, act:['meleni3x',0.9,0.6], anim:'nova',
                   fx:{zone:{r:9, dur:8, every:1, self:true, ally:[{kind:'crit', v:0.20, dur:2.5}, {kind:'critdmg', v:0.40, dur:2.5}, {kind:'regen', v:0.02, dur:2.5}]}}}},
       passive:{name:'Salt Throat', text:'+{}% damage with every attack; your cooldowns are 8% longer', stat:'dmg', v:[0.06, 0.01], cost:{stat:'cd', v:-0.08}}}},
  ult:{name:'The Great Swell', desc:'A wall of green water rises over the target (8 m) and breaks, and the sea stays up round it; the stunned are carried off their feet.', range:24, mult:1.5, act:['meleniult',1.0,0.55], anim:'nova',
       fx:{zone:{r:8, dur:4, first:0.3, every:1}},
       boost:[{piece:'a2', secs:12, mod:{mult:2, util:1.25}}, {piece:'p3', secs:16, mod:{v:2.5}}]},
  bonus:{
    3:{name:'Rising Tide', text:'The buffs you give are {}% stronger (still capped)', stat:'buffpow', v:0.20},
    5:{name:'Full Flood', text:'Call the Tide also quickens you and your allies within 25 m: 20% shorter cooldowns for 8 s', on:'cast3', buff:{kind:'haste', v:0.20, dur:8, r:25}}},
});
