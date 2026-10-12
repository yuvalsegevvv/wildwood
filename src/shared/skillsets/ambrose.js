//@ Ambrose's skill set, The Marsh Remedy (a healer, water): a lash that mends, a ripple that returns the tide, and high water for the whole party; river green, shell white and aqua
/* Agent map. Kit: docs/skillkits/kit-healer.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces water: a slowed pack is a kinder fight; the wheel is rough on water, so Ambrose pays in damage, not in healing);
   outfit and palette: docs/skillkits/looks/ambrose.md, game/outfits/ambrose.js; visuals: game/skillsets/look-ambrose.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-first8-smoke.js,
   tools/skillsets-ladder.js --set ambrose, tools/boss-duel.js --check. Land: Wildwood (tier 2, the second wave). Mark: Ripple. Healing is capped (SS_HEAL_CAP 0.5 of maximum health a cast; ally regen 5% a second).
   What the engine gives him: a heal that goes to the ally with the LEAST health (`heal.lowest`), heal power (Steady Current), an always-on regeneration stat (Marsh Calm), `overflow` (healing that would overheal becomes a shield) and a
   trigger on a dungeon revive (Lifeline: the one he brings back stands up shielded and guarded). The `revive` stat (a faster revive channel) exists but no piece of his uses it. */
defineSkillSet({
  id:'ambrose', name:'The Marsh Remedy', land:'home', needs:{tier:2}, el:'water', outfit:'ambrose',
  role:{main:'heal'},
  char:{name:'Ambrose', sex:'male', theme:'a marsh herbalist and field medic', ip:{kind:'original', riffs:'the marsh herbalist and field-medic trade (reed, linen, shell and glass); no existing character'}},
  pal:{main:0x4f7a6a, accent:0xe6ecea, glow:0x7fd0d8},
  kit:{mark:'ripple', name:'Ripple', text:'Every blow leaves a Ripple (up to 5) on its target; Ebb and Flow returns them all as a wave that hurts the enemy and heals you.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Reed Lash', desc:'Swing the bell-topped mace: a damaging hit that mends whichever of you and your allies within 15 m has the least health, for 2.5% of their maximum health. Leaves a Ripple.', cd:1.0, range:3.2, mult:2.0, act:['ambrose1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.2, arc:1.0, mark:{id:'ripple', n:1, dur:12, max:5}}, heal:{v:0.025, r:15, lowest:true}}},
         archer:{name:'Dew Arrow', desc:'An arrow of dew: a damaging hit that mends you and every ally within 15 m for 1.2% of their maximum health. Leaves a Ripple.', cd:0.9, range:28, mult:1.75, act:['ambrose1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'frost', speed:44, turn:9, life:0.9, mark:{id:'ripple', n:1, dur:12, max:5}}, heal:{v:0.025, r:15, lowest:true}}},
         mage:{name:'Drip Bolt', desc:'A heavy drop of water: a damaging hit that mends you and every ally within 15 m for 1.2% of their maximum health. Leaves a Ripple.', cd:1.1, range:24, mult:2.3, act:['ambrose1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'frost', speed:32, turn:8, life:1.0, mark:{id:'ripple', n:1, dur:12, max:5}}, heal:{v:0.025, r:15, lowest:true}}}},
       passive:{name:'Steady Current', text:'Your heals and the regeneration you give are {}% stronger (still capped)', stat:'heal', v:[0.25, 0.03]}},
    2:{bound:'any',
       skill:{any:{name:'Ebb and Flow', desc:'Call back every Ripple within 10 m: the tide washes over the enemies for damage for each Ripple, and a share of it mends you. The wave also heals you and your allies for 10% of maximum health and shields them for a moment.', cd:12, range:10, mult:1.5, act:['ambrose2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:10}, pop:{id:'ripple', k:0.6, r:10, heal:0.5}, heal:{v:0.10, r:20}, shield:{v:0.08, dur:6, r:20}}}},
       passive:{name:'Marsh Calm', text:'You always regenerate {}% of your maximum health a second', stat:'regen', v:[0.008, 0.001]}},
    3:{bound:'any',
       skill:{any:{name:'High Water', desc:'The marsh rises: you and your allies within 20 m are healed for 30% of maximum health, regenerate 3% a second and are shielded for 15% for 8 seconds. A wave round you hurts the enemies near and slows them.', cd:45, range:9, mult:2.8, act:['ambrose3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:9, kb:4, slow:1.5}, heal:{v:0.30, r:20}, ally:{kind:'regen', v:0.03, dur:8, r:20}, shield:{v:0.15, dur:8, r:20}}}},
       passive:{name:'Waterlogged', text:'{}% less damage taken; you deal 10% less damage', stat:'red', v:[0.08, 0.01], cost:{stat:'dmg', v:-0.10}}}},
  bonus:{
    3:{name:'Overflow', text:'{}% of the healing you give that would overheal becomes a shield (6 s) on the one healed', stat:'overflow', v:0.6},
    5:{name:'Lifeline', text:'When you drop below 35% health, or bring a downed party member back in a dungeon, a rush of water heals you for 25% and shields and guards you and your allies (25% of health, 20% less damage taken, 8 s; at most every 20 s)', on:['low', 'revive'], below:0.35, icd:20, heal:0.25, shield:{v:0.25, dur:8}, buff:{kind:'guard', v:0.2, dur:8, r:25}}},
});
