//@ Sorrel's skill set, The Lookout (safe DPS, air): a clean long line, a spotting shot that spreads the wind, and one charged gale that grows with the distance; sky, cream and feathers
/* Agent map. Kit: docs/skillkits/kit-safe-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces air: the Mark the Gap shot spreads its aura to enemies within 6 m, so a partner's hit reacts on all of them);
   outfit and palette: docs/skillkits/looks/sorrel.md, game/outfits/sorrel.js; visuals: game/skillsets/look-sorrel.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md.
   Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set sorrel. Land: the Greyspine (tier 2, the second wave). Mark: Sight. Slot 3 is class-bound too ("it needs a weapon"): a javelin, an arrow, a ray.
   What the engine gives her: conditional passives (Far Sight needs the target at 14 m or more, Cold Eye a target at full health, Dead Zone costs damage inside 6 m: the `when` conditions `dist` and `tgtHp`; `still` and `moved` exist too). */
defineSkillSet({
  id:'sorrel', name:'The Lookout', land:'grey', needs:{tier:2}, el:'air', outfit:'sorrel',
  role:{main:'safe'},
  char:{name:'Sorrel', sex:'female', theme:'a mountain lookout who waits for one clean shot', ip:{kind:'original', riffs:'the mountain-lookout and marksman genre (a long scarf, goggles, feathers); no existing character'}},
  pal:{main:0x8fb8d8, accent:0xf1ead8, glow:0xbfe3ff},
  emblem:{col:0x8fc7ec, glyph:'<path d="M3 8h10.5a2.7 2.7 0 1 0-2.7-2.7"/><path d="M3 12.5h15.5a2.7 2.7 0 1 1-2.7 2.7"/><path d="M3 17h6.5a2.2 2.2 0 1 1-2.2 2.2"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col): never the generic star
  kit:{mark:'sight', name:'Sight', text:'Mark the Gap puts Sight (up to 3) on its target; Long Gale spends it all, and Steady Breath makes a sighted target take more from you.'},
  pos:{
    1:{bound:'class',
       skill:{
         archer:{name:'Clean Line', desc:'A precise arrow from far away: the farther the target, the harder it lands.', cd:0.9, range:36, mult:1.8, act:['sorrel1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'frost', speed:56, turn:6, life:0.9}, rangeScale:{from:6, to:30, k:1.6}},hold:{x:{status:{kind:'vuln',v:0.1,dur:5}}}}},
       passive:{name:'Far Sight', text:'+{}% damage against a target 14 m or more away', stat:'dmg', v:[0.10, 0.02], when:{dist:{from:14}}}},
    2:{bound:'any',
       skill:{any:{name:'Mark the Gap', desc:'A spotting shot at up to 36 m: it puts Sight on the target and spreads the wind round it, so the enemies within 6 m carry its element too and your partners\' hits react on all of them.', cd:8, range:36, mult:1.7, act:['sorrel2x',0.6,0.5], anim:'shoot',
                   fx:{proj:{kind:'frost', speed:60, turn:10, life:0.8, flavor:'air', mark:{id:'sight', n:1, dur:12, max:3}}}}},
       passive:{name:'Cold Eye', text:'+{}% critical hit chance against a target at full health', stat:'crit', v:[0.10, 0.01], when:{tgtHp:{above:0.95}}}},
    3:{bound:'class',
       skill:{
         archer:{name:'Long Gale', desc:'Draw, hold your breath and loose one arrow that lands harder the farther it goes: up to 2.4 times at 40 m. Spends every Sight on the target.', cd:28, range:45, mult:5.6, act:['sorrel3a',1.3,1.1], anim:'shoot',
                 fx:{proj:{kind:'snipe', speed:70, turn:12, life:1.0}, rangeScale:{from:5, to:40, k:2.4}, pop:{id:'sight', k:0.8}}},
         warrior:{name:'Gale Javelin', desc:'Wind up and throw one javelin that lands harder the farther it goes: up to 2.4 times at 30 m. Spends every Sight on the target.', cd:28, range:30, mult:5.6, act:['sorrel3w',1.3,1.1], anim:'slash',
                  fx:{proj:{kind:'thorn', speed:56, turn:12, life:0.8}, rangeScale:{from:5, to:30, k:2.4}, pop:{id:'sight', k:0.8}}},
         mage:{name:'Prism Gale', desc:'Gather the light and loose one ray that lands harder the farther it goes: up to 2.4 times at 36 m. Spends every Sight on the target.', cd:28, range:36, mult:5.4, act:['sorrel3m',1.3,1.1], anim:'cast',
               fx:{proj:{kind:'frost', speed:64, turn:12, life:0.9}, rangeScale:{from:5, to:36, k:2.4}, pop:{id:'sight', k:0.8}}}},
       passive:{name:'Dead Zone', text:'+{}% damage with every attack; you deal 20% less to a target within 6 m', stat:'dmg', v:[0.12, 0.02], cost:{stat:'dmg', v:-0.20, when:{dist:{to:6}}}}}},
  bonus:{
    3:{name:'Steady Breath', text:'a target carrying your Sight takes 10% more from you for each Sight', amp:{id:'sight', per:0.10}},
    5:{name:'Through the Gale', text:'Your third-slot attack sends a gale through everything in a 40 m line for 150% damage', on:'cast3', mult:1.5, range:40, fx:{beam:{len:40, w:1.2, hits:1}}}},
});
