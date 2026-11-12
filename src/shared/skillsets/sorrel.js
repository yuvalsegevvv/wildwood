//@ Sorrel's skill set, The Lookout (safe DPS, air): a clean long line, a spotting shot that marks the target, and one charged gale that grows with the distance; sky, cream and feathers
/* Agent map. Kit: docs/skillkits/kit-safe-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces air; the Mark the Gap shot used to spread an air aura, a reaction flavor with no equivalent: it only marks now);
   outfit and palette: docs/skillkits/looks/sorrel.md, game/outfits/sorrel.js; visuals: game/skillsets/look-sorrel.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md.
   Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set sorrel. Land: the Greyspine (tier 2, the second wave). Mark: Sight. Slot 3 is class-bound too ("it needs a weapon"): a javelin, an arrow, a ray.
   What the engine gives her: conditional passives (Far Sight needs the target at 14 m or more, Cold Eye an exposed target, Dead Zone costs damage inside 6 m: the `when` conditions `dist` and `exposed`; `still` and `moved` exist too).
   The combo (docs/skillkits/COMBO-REWORK.md section 5): Mark the Gap opens a 5 s gap (Sight and a 5% vuln), Long Gale through it hits twice as hard (vs: Through the Gap; x1.3 more within 2.5 s of Mark the Gap: vs.tight); a full-drawn Clean Line lays Sight too. */
defineSkillSet({
  id:'sorrel', name:'The Lookout', land:'grey', needs:{tier:2}, el:'air', outfit:'sorrel',
  role:{main:'safe'},
  char:{name:'Sorrel', sex:'female', theme:'a mountain lookout who waits for one clean shot', ip:{kind:'original', riffs:'the mountain-lookout and marksman genre (a long scarf, goggles, feathers); no existing character'}},
  pal:{main:0x8fb8d8, accent:0xf1ead8, glow:0xbfe3ff},
  emblem:{col:0x8fc7ec, glyph:'<path d="M3 8h10.5a2.7 2.7 0 1 0-2.7-2.7"/><path d="M3 12.5h15.5a2.7 2.7 0 1 1-2.7 2.7"/><path d="M3 17h6.5a2.2 2.2 0 1 1-2.2 2.2"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col): never the generic star
  kit:{mark:'sight', name:'Sight', text:'Mark the Gap and a fully drawn Clean Line put Sight (up to 3) on the target; Long Gale spends it all, and hits harder still through an open gap.',
       combo:{order:['skill','burst'], win:5, text:'Mark the Gap, then loose Long Gale within five seconds: the sooner, the harder.'}},
  pos:{
    1:{bound:'class',
       skill:{
         archer:{name:'Clean Line', desc:'A precise arrow from far away: the farther the target, the harder it lands. A full draw also leaves Sight.', cd:0.9, range:36, mult:1.6, act:['sorrel1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'frost', speed:56, turn:6, life:0.9}, rangeScale:{from:6, to:30, k:1.6}},hold:{x:{status:{kind:'vuln',v:0.1,dur:5}, mark:{id:'sight', n:1, dur:12, max:3}}}}},
       passive:{name:'Far Sight', text:'+{}% damage against a target 14 m or more away', stat:'dmg', v:[0.10, 0.02], when:{dist:{from:14}}}},
    2:{bound:'any',
       skill:{any:{name:'Mark the Gap', desc:'A spotting shot at up to 36 m: it puts Sight on the target and opens a gap: the target takes 5% more from everyone for 5 seconds.', cd:8, range:36, mult:1.5, act:['sorrel2x',0.6,0.5], anim:'shoot',
                   fx:{proj:{kind:'frost', speed:60, turn:10, life:0.8, mark:{id:'sight', n:1, dur:12, max:3}, status:{kind:'vuln', v:0.05, dur:5}}}}},
       passive:{name:'Cold Eye', text:'+{}% critical hit chance against an exposed target', stat:'crit', v:[0.06, 0.008], when:{exposed:true}}},
    3:{bound:'class',
       skill:{
         archer:{name:'Long Gale', desc:'Draw, hold your breath and loose one arrow that lands harder the farther it goes: up to 2.4 times at 40 m. Spends every Sight on the target. Twice as hard against an exposed target, and 30% more again within 2.5 seconds of Mark the Gap.', cd:28, range:45, mult:3.2, act:['sorrel3a',1.3,0.85], anim:'shoot',
                 fx:{proj:{kind:'snipe', speed:70, turn:12, life:1.0}, rangeScale:{from:5, to:40, k:2.4}, pop:{id:'sight', k:0.7}, vs:{when:{exposed:true}, k:2.0, name:'Through the Gap', tight:{after:'skill', secs:2.5, k:1.3}}}},
         warrior:{name:'Gale Javelin', desc:'Wind up and throw one javelin that lands harder the farther it goes: up to 2.4 times at 30 m. Spends every Sight on the target. Twice as hard against an exposed target, and 30% more again within 2.5 seconds of Mark the Gap.', cd:28, range:30, mult:3.2, act:['sorrel3w',1.3,0.85], anim:'slash',
                  fx:{proj:{kind:'thorn', speed:56, turn:12, life:0.8}, rangeScale:{from:5, to:30, k:2.4}, pop:{id:'sight', k:0.7}, vs:{when:{exposed:true}, k:2.0, name:'Through the Gap', tight:{after:'skill', secs:2.5, k:1.3}}}},
         mage:{name:'Prism Gale', desc:'Gather the light and loose one ray that lands harder the farther it goes: up to 2.4 times at 36 m. Spends every Sight on the target. Twice as hard against an exposed target, and 30% more again within 2.5 seconds of Mark the Gap.', cd:28, range:36, mult:3.1, act:['sorrel3m',1.3,0.85], anim:'cast',
               fx:{proj:{kind:'frost', speed:64, turn:12, life:0.9}, rangeScale:{from:5, to:36, k:2.4}, pop:{id:'sight', k:0.7}, vs:{when:{exposed:true}, k:2.0, name:'Through the Gap', tight:{after:'skill', secs:2.5, k:1.3}}}}},
       passive:{name:'Dead Zone', text:'+{}% damage with every attack; you deal 20% less to a target within 6 m', stat:'dmg', v:[0.12, 0.02], cost:{stat:'dmg', v:-0.20, when:{dist:{to:6}}}}}},
  ult:{name:'Eye of the Storm', desc:'A downdraft falls from the sky on a far target (7 m), harder the further it is from her.', range:45, mult:9.2, act:['sorrelult',1.3,0.85], anim:'shoot',
       fx:{proj:{kind:'snipe', speed:70, turn:12, life:1, splash:{r:7, k:1}}, rangeScale:{from:5, to:40, k:2.4}},
       boost:[{piece:'a1', secs:14, mod:{mult:2, n:1}}, {piece:'p1', secs:14, mod:{v:2.5}}]},
  tree:'pine', stone:'Ridge Bondstone',
  bonds:{   // Bond I and IV: the two passives that are no longer equippable; II and VI: the old 3- and 5-set rows (the Bond engine reads them in step 12)
    1:'sorrel_p2',
    2:{name:'Steady Breath', text:'a target carrying your Sight takes 10% more from you for each Sight', amp:{id:'sight', per:0.10}},
    4:'sorrel_p3',
    6:{name:'Through the Gale', text:'Your third-slot attack sends a gale through everything in a 40 m line for 150% damage', on:'cast3', mult:1.5, range:40, fx:{beam:{len:40, w:1.2, hits:1}}}},
});
