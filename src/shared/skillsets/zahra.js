//@ Zahra's skill set, The Hour of Glass (a buff support, light): a mirror strike that quickens the line, a blessing of the long noon, and a sandglass planted for the whole fight; gold, glass and lapis
/* Agent map. Kit: docs/skillkits/kit-support.md (the buff focus) + kit-mixed.md (also safe DPS, mild: her strikes and flashes hit harder); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces light: her hits leave the aura a partner reacts with; she debuffs nothing herself);
   outfit and palette: docs/skillkits/looks/zahra.md, game/outfits/zahra.js; visuals: game/skillsets/look-zahra.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js,
   tools/skillsets-ladder.js --set zahra. Land: the Sunscar (tier 2). Mark: Grain. Buffs never stack (the stronger wins) and are capped (SS_ALLY_CAP), so beside Dunstan she adds a different KIND: guard and critical damage first. */
defineSkillSet({
  id:'zahra', name:'The Hour of Glass', land:'sun', needs:{tier:2}, el:'light', outfit:'zahra',
  role:{main:'support', focus:'buff', also:{role:'safe', part:'mild'}},
  char:{name:'Zahra', sex:'female', theme:'a glass-bearer of the desert noon who turns the sun with a polished mirror and counts the hour in falling sand', ip:{kind:'original', riffs:'the desert mirror-bearer and hourglass-keeper genre (a polished disc, a sandglass at the hip, a veil of beads); no existing character'}},
  pal:{main:0xe8c050, accent:0x2b6aa8, glow:0xfff0b0},
  emblem:{col:0xf0d070, glyph:'<path d="M7 3h10M7 21h10"/><path d="M8 3c0 5 8 5 8 9s-8 4-8 9"/><path d="M16 3c0 5-8 5-8 9s8 4 8 9"/>'},
  kit:{mark:'grain', name:'Grain', text:'Every strike leaves a Grain (up to 5); Long Noon spends them for extra damage.'},
  pos:{
    1:{bound:'class',
       skill:{
         mage:{name:'Sunlit Bolt', desc:'A bolt of reflected light: a damaging hit that shields you and your allies within 18 m for a moment (10% less damage taken for 3 seconds). Leaves a Grain.', cd:1.1, range:24, mult:1.7, act:['zahra1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'frost', speed:32, turn:8, life:1.0, mark:{id:'grain', n:1, dur:12, max:5}}, ally:{kind:'guard', v:0.10, dur:3, r:18}}}},
       passive:{name:'Patient Sand', text:'Your buffs last {}% longer', stat:'buffdur', v:[0.4, 0.05]}},
    2:{bound:'any',
       skill:{any:{name:'Long Noon', desc:'Turn the mirror on your friends: you and your allies within 25 m deal 30% more critical damage for 10 seconds, and 3% more for each Grain on the enemies near you. A flash round you then spends every Grain nearby for extra damage.', cd:14, range:6, mult:1.3, act:['zahra2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:2}, ally:{kind:'critdmg', v:0.30, dur:10, r:25, perMark:{id:'grain', v:0.03, r:8}}, pop:{id:'grain', k:0.5, r:6}}}},
       passive:{name:'Cool Shade', text:'While you fight, you and your allies within 20 m regenerate 1% of maximum health a second (refreshed every 3 s)', on:'tick', icd:3, buff:{kind:'regen', v:0.01, dur:4, r:20}}},
    3:{bound:'any',
       skill:{any:{name:'The Sandglass', desc:'Plant the sandglass at your feet for 8 seconds: you and your allies standing within 9 m take 15% less damage, hit 15% more often critically and heal 2% of health a second, and the light at its foot burns the enemies there.', cd:45, range:9, mult:0.7, act:['zahra3x',0.9,0.6], anim:'nova',
                   fx:{zone:{r:9, dur:8, every:1, self:true, ally:[{kind:'guard', v:0.15, dur:2.5}, {kind:'crit', v:0.15, dur:2.5}, {kind:'regen', v:0.02, dur:2.5}]}}}},
       passive:{name:'Running Late', text:'+{}% damage with every attack; your cooldowns are 8% longer', stat:'dmg', v:[0.06, 0.01], cost:{stat:'cd', v:-0.08}}}},
  ult:{name:'Shattered Hour', desc:'A giant sandglass breaks over the target and rains glass (9 m); time stops for what it hits.', range:24, mult:1.4, act:['zahrault',1.0,0.55], anim:'nova',
       fx:{zone:{r:9, dur:3, first:0.3, every:0.5}},
       boost:[{piece:'a2', secs:12, mod:{mult:2, util:1.25}}, {piece:'p3', secs:16, mod:{v:2.5}}]},
  bonus:{
    3:{name:'Polished Glass', text:'The buffs you give are {}% stronger (still capped)', stat:'buffpow', v:0.20},
    5:{name:'Turn the Hour', text:'The Sandglass also quickens you and your allies within 25 m: 20% shorter cooldowns for 8 s', on:'cast3', buff:{kind:'haste', v:0.20, dur:8, r:25}}},
});
