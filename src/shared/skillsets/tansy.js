//@ Tansy's skill set, The Harvest (a grinder, no element): a scythe sweep, a field that pulls a camp together, one huge swing to finish it; wheat and straw
/* Agent map. Kit: docs/skillkits/kit-grind.md (the first grinder: PURE BASIC, never an elemental disadvantage); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md; outfit and palette: docs/skillkits/looks/tansy.md,
   game/outfits/tansy.js; visuals: game/skillsets/look-tansy.js. Registry and what a piece may use: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set tansy.
   Land: Wildwood (the first land, tier 1), so it is the easiest set to get: `from` carries friendlier odds on every position (the owner decides, docs/SKILL-SETS.md decision 37).
   What the engine gives her: the `area` stat (Wide Berth widens every ring, cone and zone), a `crowd` condition (Steady Hands and Full Basket need three or more enemies near), a kill `streak` (a multi-kill) and `cdr`
   (a cooldown refund); Wide Berth's price is a condition too: less damage against bosses (the "bad for bossing" lever). */
defineSkillSet({
  id:'tansy', name:'The Harvest', land:'home', needs:{tier:1}, el:'basic', outfit:'tansy',
  role:{main:'grind'},
  char:{name:'Tansy', sex:'female', theme:'a farm-hand who harvests a whole field at once: sweeping blades, bundled wheat', ip:{kind:'original', riffs:'the farm-hand and harvest genre (a hat, a smock, a sheaf); no existing character'}},
  pal:{main:0xe0b95a, accent:0xb5532f, glow:0xece3c8},
  emblem:{col:0xe6c35f, glyph:'<path d="M12 22V10"/><path d="M12 10c-2.8 0-3.8-2.2-3.8-4.2 2.6 0 3.8 1.8 3.8 4.2zM12 10c2.8 0 3.8-2.2 3.8-4.2-2.6 0-3.8 1.8-3.8 4.2z"/><path d="M12 15c-2.8 0-3.8-2.2-3.8-4.2M12 15c2.8 0 3.8-2.2 3.8-4.2M12 19.5c-2.4 0-3.4-1.8-3.4-3.6M12 19.5c2.4 0 3.4-1.8 3.4-3.6"/><path d="M12 2.5V6"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col): never the generic star
  pos:{
    1:{bound:'class', from:{chance:0.15, pity:14},
       skill:{
         archer:{name:'Chaff Fan', desc:'Seven short arrows in a fan, each bursting a little where it lands: light on one enemy, a great deal on a crowd.', cd:0.9, range:16, mult:0.4, act:['tansy1a',0.55,0.5], anim:'shoot',
                 fx:{vsBoss:0.5, proj:{kind:'thorn', n:7, spread:0.3, speed:40, turn:0, life:0.42, splash:{r:1.8, k:0.5}}},style:'press',hold:{x:{splash:{r:3.2,k:0.6}}}}},
       passive:{name:'Steady Hands', text:'A kill in a crowd (three or more enemies within 8 m) heals you for 2% of your maximum health (at most every 2 s)', on:'kill', icd:2, heal:0.02, when:{crowd:{n:3, r:8}}}},
    2:{bound:'any', from:{chance:0.15, pity:14},
       skill:{any:{name:'Gather In', desc:'A wide field of pull at your target\'s feet: for 3 seconds everything in it is dragged to the middle and nicked. Wide enough to take in the next camp.', cd:10, range:16, mult:1, act:['tansy2x',0.7,0.5], anim:'nova',
                   fx:{vsBoss:0.5, zone:{r:9.5, dur:3, every:0.5, kb:-4}}}},
       passive:{name:'Wide Berth', text:'Every ring, cone and field of yours is {}% wider; you deal 25% less damage to bosses', stat:'area', v:[0.25, 0.03], cost:{stat:'dmg', v:-0.25, when:{boss:true}}}},
    3:{bound:'any', from:{chance:0.30, pity:7},
       skill:{any:{name:'Bumper Crop', desc:'The widest ring of any skill goes out around you, then a swathe lingers for 2.5 seconds: it finishes what you gathered.', cd:36, range:11, mult:1.8, act:['tansy3x',0.9,0.6], anim:'nova',
                   fx:{vsBoss:0.5, ring:{r:11, kb:3}, zone:{r:8, dur:2.5, every:0.5, self:true}}}},
       passive:{name:'Second Basket', text:'A multi-kill (four enemies within 2 s) takes 4 s off Gather In\'s cooldown (at most every 6 s)', on:'kill', icd:6, streak:{n:4, secs:2}, cdr:{skill:4}}}},
  ult:{name:'Harvest Moon', desc:'A full turn of the scythe under a rising moon: a 12 m ring drags every enemy to her and a sheaf of straw binds them.', range:12, mult:2.7, act:['tansyult',1.1,0.6], anim:'nova',
       fx:{ring:{r:12, kb:-4}},
       boost:[{piece:'a2', secs:14, mod:{size:1.4, cd:0.5}}, {piece:'p2', secs:14, mod:{v:2}}]},   // placeholder until the content batch (docs/ULT.md)
  bonus:{
    3:{name:'Windrow', text:'A kill takes 1 s off every cooldown (at most every 2 s)', on:'kill', icd:2, cdr:{all:1}},
    5:{name:'Full Basket', text:'While three or more enemies are within 8 m, every 4 s a shockwave rolls out 8 m for 80% damage', on:'tick', icd:4, when:{crowd:{n:3, r:8}}, mult:1.6, range:8, fx:{vsBoss:0.5, ring:{r:8, kb:2}}}},
});
