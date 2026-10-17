//@ Tamsin's skill set, The Rockbreaker (a grinder, earth): a hammer sweep, a quake that pulls a camp into a heap, and one landslide to finish it; granite, dust and rope
/* Agent map. Kit: docs/skillkits/kit-grind.md + kit-mixed.md (main grind, also tank, mild: Pull the Slope taunts, the Mountain's shield); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces earth); outfit and palette: docs/skillkits/looks/tamsin.md, game/outfits/tamsin.js;
   visuals: game/skillsets/look-tamsin.js. Registry and what a piece may use: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js, tools/skillsets-ladder.js --set tamsin.
   Land: the Greyspine (tier 3). Unlike Tansy (pure basic, a scythe's wide arc) she is elemental (earth) and heavy: slower swings that stagger a crowd, and the `crowd` condition again (Loose Scree, The Mountain Moves).
   What the engine gives her: the `area` stat (Wide Stance widens every ring, cone and zone), a kill `streak` and `cdr`; Wide Stance's price is less damage against bosses (the "bad for bossing" lever). */
defineSkillSet({
  id:'tamsin', name:'The Rockbreaker', land:'grey', needs:{tier:3}, el:'earth', outfit:'tamsin',
  role:{main:'grind', also:{role:'tank', part:'mild'}},
  char:{name:'Tamsin', sex:'female', theme:'a quarry-hand who breaks a whole slope at once: a sledge, a rope, a heap of loosened scree', ip:{kind:'original', riffs:'the quarry-hand and stone-breaker trade (a sledge, a rope harness, a dust scarf); no existing character'}},
  pal:{main:0x8a8f96, accent:0xd2b48a, glow:0xe8d9b8},
  emblem:{col:0xb9bec6, glyph:'<path d="M3 20l5-9 3 4 3-7 7 12z"/><path d="M12 3l-1.4 3 2.2 1.4-1.2 2.6"/>'},
  pos:{
    1:{bound:'class', from:{chance:0.15, pity:14},
       skill:{
         warrior:{name:'Sledge Sweep', desc:'Swing the sledge in a wide low arc: everything in front of you takes a light blow and is knocked back a little.', cd:0.9, range:3.6, mult:0.4, act:['tamsin1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.8, arc:2.2, kb:1}}},
         archer:{name:'Gravel Fan', desc:'Seven shards of rock in a fan, each bursting a little where it lands: light on one enemy, a great deal on a crowd.', cd:0.9, range:16, mult:0.2, act:['tamsin1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'thorn', n:7, spread:0.3, speed:40, turn:0, life:0.42, splash:{r:1.8, k:0.5}}}},
         mage:{name:'Rockfall Bolt', desc:'A bolt of stone that bursts wide on impact and scatters grit over a whole crowd.', cd:1.1, range:22, mult:0.3, act:['tamsin1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spore', speed:30, turn:8, life:1.1, splash:{r:6, k:0.9}}}}},
       passive:{name:'Loose Scree', text:'A kill in a crowd (three or more enemies within 8 m) heals you for 2% of your maximum health (at most every 2 s)', on:'kill', icd:2, heal:0.02, when:{crowd:{n:3, r:8}}}},
    2:{bound:'any', from:{chance:0.15, pity:14},
       skill:{any:{name:'Pull the Slope', desc:'A wide tremor at your target\'s feet: for 3 seconds everything in it is dragged to the middle, rattled and turns on you. Wide enough to take in the next camp.', cd:10, range:16, mult:0.5, act:['tamsin2x',0.7,0.5], anim:'nova',
                   fx:{zone:{r:9.5, dur:3, every:0.5, kb:-4}, taunt:{dur:4, r:9.5}}}},
       passive:{name:'Wide Stance', text:'Every ring, cone and field of yours is {}% wider; you deal 25% less damage to bosses', stat:'area', v:[0.25, 0.03], cost:{stat:'dmg', v:-0.25, when:{boss:true}}}},
    3:{bound:'any', from:{chance:0.30, pity:7},
       skill:{any:{name:'The Mountain Moves', desc:'The widest ring of any skill goes out around you, then a slide of rubble lingers for 2.5 seconds: it finishes what you gathered, and you stand in it behind a shield worth 12% of your health with 15% less damage taken.', cd:36, range:11, mult:0.9, act:['tamsin3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:11, kb:3}, zone:{r:8, dur:2.5, every:0.5, self:true}, shield:{v:0.12, dur:6, r:11}, ally:{kind:'guard', v:0.15, dur:6, r:11}}}},
       passive:{name:'Second Load', text:'A multi-kill (four enemies within 2 s) takes 4 s off Pull the Slope\'s cooldown (at most every 6 s)', on:'kill', icd:6, streak:{n:4, secs:2}, cdr:{skill:4}}}},
  bonus:{
    3:{name:'Cleared Ground', text:'A kill takes 1 s off every cooldown (at most every 2 s)', on:'kill', icd:2, cdr:{all:1}},
    5:{name:'Aftershock', text:'While three or more enemies are within 8 m, every 4 s a tremor rolls out 8 m for 80% damage', on:'tick', icd:4, when:{crowd:{n:3, r:8}}, mult:0.8, range:8, fx:{ring:{r:8, kb:2}}}},
});
