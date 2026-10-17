//@ Hollis's skill set, The Wake Lantern (a healer, dark): a lantern swing that mends, a vigil that returns borrowed dusk, and a long night that carries the party through; lamp amber, mourning black and fog grey
/* Agent map. Kit: docs/skillkits/kit-healer.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces dark: a weakened pack is a kinder fight); outfit and palette: docs/skillkits/looks/hollis.md,
   game/outfits/hollis.js; visuals: game/skillsets/look-hollis.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js, tools/skillsets-ladder.js --set hollis, tools/boss-duel.js --check.
   Land: the Gloamhorn (tier 2). Mark: Vigil. Healing is capped (SS_HEAL_CAP 0.5 of maximum health a cast; ally regen 5% a second). Unlike Ambrose (a tide) and Nephra (shields) he heals what he has watched:
   the Vigil he keeps on the enemy is returned to the living by The Long Night's pop, and Dusk Lent makes a light heal when he is hurt. */
defineSkillSet({
  id:'hollis', name:'The Wake Lantern', land:'gloam', needs:{tier:2}, el:'dark', outfit:'hollis',
  role:{main:'heal'},
  char:{name:'Hollis', sex:'male', theme:'an undertaker\'s lamp-bearer who keeps the long vigil over the living and borrows the dusk to mend them', ip:{kind:'original', riffs:'the undertaker and lamp-bearer genre (a tall hat, a crape band, a hooded lantern); no existing character'}},
  pal:{main:0x3a3548, accent:0xe8a84a, glow:0xffcf7a},
  emblem:{col:0xd89a48, glyph:'<path d="M12 2v3"/><path d="M8 8h8l1.5 3.5v6L16 21H8l-1.5-3.5v-6z"/><path d="M12 11v6"/><path d="M9.5 8V5.5h5V8"/>'},
  kit:{mark:'vigil', name:'Vigil', text:'Every blow leaves a Vigil (up to 5) on its target; The Long Night returns them all as a wave that hurts the enemy and heals you.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Lantern Swing', desc:'Swing the hooked lantern: a damaging hit that mends whichever of you and your allies within 15 m has the least health, for 2.5% of their maximum health. Leaves a Vigil.', cd:1.0, range:3.2, mult:2.0, act:['hollis1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.2, arc:1.0, mark:{id:'vigil', n:1, dur:12, max:5}}, heal:{v:0.025, r:15, lowest:true}}},
         archer:{name:'Mourning Arrow', desc:'An arrow fletched in black crape: a damaging hit that mends you and every ally within 15 m for 2.5% of the weakest one\'s maximum health. Leaves a Vigil.', cd:0.9, range:28, mult:1.75, act:['hollis1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'spore', speed:44, turn:9, life:0.9, mark:{id:'vigil', n:1, dur:12, max:5}}, heal:{v:0.025, r:15, lowest:true}}},
         mage:{name:'Candle Bolt', desc:'A heavy drop of dark candle-flame: a damaging hit that mends the one of you with the least health for 2.5% of their maximum. Leaves a Vigil.', cd:1.1, range:24, mult:2.3, act:['hollis1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spore', speed:32, turn:8, life:1.0, mark:{id:'vigil', n:1, dur:12, max:5}}, heal:{v:0.025, r:15, lowest:true}}}},
       passive:{name:'Steady Flame', text:'Your heals and the regeneration you give are {}% stronger (still capped)', stat:'heal', v:[0.25, 0.03]}},
    2:{bound:'any',
       skill:{any:{name:'Dusk Lent', desc:'Call back every Vigil within 10 m: the dusk rolls over the enemies for damage for each Vigil, and a share of it mends you. The wave also heals you and your allies for 10% of maximum health and shields them for a moment.', cd:12, range:10, mult:1.5, act:['hollis2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:10}, pop:{id:'vigil', k:0.6, r:10, heal:0.5}, heal:{v:0.10, r:20}, shield:{v:0.08, dur:6, r:20}}}},
       passive:{name:'Quiet Vigil', text:'You always regenerate {}% of your maximum health a second', stat:'regen', v:[0.008, 0.001]}},
    3:{bound:'any',
       skill:{any:{name:'The Long Night', desc:'The lanterns are lit all at once: you and your allies within 20 m are healed for 30% of maximum health, regenerate 3% a second and are shielded for 15% for 8 seconds. A wave of dusk round you hurts the enemies near and weakens their blows.', cd:45, range:9, mult:2.8, act:['hollis3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:9, kb:4, slow:1.5}, heal:{v:0.30, r:20}, ally:{kind:'regen', v:0.03, dur:8, r:20}, shield:{v:0.15, dur:8, r:20}}}},
       passive:{name:'Crape Band', text:'{}% less damage taken; you deal 10% less damage', stat:'red', v:[0.08, 0.01], cost:{stat:'dmg', v:-0.10}}}},
  bonus:{
    3:{name:'Spill', text:'{}% of the healing you give that would overheal becomes a shield (6 s) on the one healed', stat:'overflow', v:0.6},
    5:{name:'Last Light', text:'When you drop below 35% health, or bring a downed party member back in a dungeon, the lanterns flare and heal you for 25% and shield and guard you and your allies (25% of health, 20% less damage taken, 8 s; at most every 20 s)', on:['low', 'revive'], below:0.35, icd:20, heal:0.25, shield:{v:0.25, dur:8}, buff:{kind:'guard', v:0.2, dur:8, r:25}}},
});
