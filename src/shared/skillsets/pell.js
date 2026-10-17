//@ Pell's skill set, The Lantern Spear (safe DPS, fire): a torchlit dart from a safe distance, a lure that draws the quarry into the light, and one thrown spear that spends the lure; tar black, torch orange and river cream
/* Agent map. Kit: docs/skillkits/kit-safe-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces fire: the lure shot leaves the aura a partner reacts with); outfit and palette: docs/skillkits/looks/pell.md,
   game/outfits/pell.js; visuals: game/skillsets/look-pell.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js, tools/skillsets-ladder.js --set pell.
   Land: Wildwood (tier 3, the third set of every land). Mark: Lure. Unlike Sorrel (the other safe set: the farther the better) he is a patient one: the `still` condition (Steady Hand needs two seconds without moving)
   and the lure; Spear of the Night Pool spends the Lure. Slot 3 is class-bound too: a spear, an arrow, a flare. */
defineSkillSet({
  id:'pell', name:'The Lantern Spear', land:'home', needs:{tier:3}, el:'fire', outfit:'pell',
  role:{main:'safe'},
  char:{name:'Pell', sex:'male', theme:'a night-fisher who spears eels by torchlight and never stands closer than he must', ip:{kind:'original', riffs:'the night-fisher and torch-spear trade (a lantern pole, a net, a reed hat); no existing character'}},
  pal:{main:0xe0762a, accent:0xe9dfc4, glow:0xffb45a},
  emblem:{col:0xf29a48, glyph:'<path d="M12 2v20"/><path d="M8 5l4-3 4 3"/><path d="M6 9v4a6 6 0 0 0 12 0V9"/><path d="M9 21h6"/>'},
  kit:{mark:'lure', name:'Lure', text:'Dim the Lamp puts a Lure (up to 3) on its target; the Night Pool spear spends every Lure for extra damage, and Eel-Light makes a lured target take more from you.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Eel Spear', desc:'Throw a barbed spear at up to 24 m: a clean, heavy cast for a basic attack.', cd:1.1, range:24, mult:2.5, act:['pell1w',0.55,0.45], anim:'slash',
                  fx:{proj:{kind:'thorn', speed:46, turn:6, life:0.7}, rangeScale:{from:6, to:24, k:1.4}}},
         archer:{name:'Torch Arrow', desc:'A burning arrow from far away: a precise, heavy shot for a basic attack.', cd:0.9, range:34, mult:2.4, act:['pell1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'ember', speed:54, turn:6, life:0.9}, rangeScale:{from:6, to:30, k:1.4}}},
         mage:{name:'Spark Dart', desc:'A dart of torch fire flicked at up to 26 m: a clean, heavy cast for a basic attack.', cd:1.0, range:26, mult:2.4, act:['pell1m',0.55,0.5], anim:'cast',
               fx:{proj:{kind:'ember', speed:44, turn:6, life:0.9}, rangeScale:{from:6, to:26, k:1.4}}}},
       passive:{name:'Steady Hand', text:'+{}% damage while you have stood still for 2 seconds', stat:'dmg', v:[0.16, 0.02], when:{still:2}}},
    2:{bound:'any',
       skill:{any:{name:'Dim the Lamp', desc:'Swing the lantern low and loose a spotting flare at up to 34 m: it puts a Lure on the target and spreads the flame round it, so the enemies within 6 m carry its element too and your partners\' hits react on all of them.', cd:8, range:34, mult:1.6, act:['pell2x',0.6,0.5], anim:'shoot',
                   fx:{proj:{kind:'ember', speed:58, turn:10, life:0.8, flavor:'fire', mark:{id:'lure', n:1, dur:12, max:3}}}}},
       passive:{name:'Night Eyes', text:'+{}% critical hit chance against a target that carries a Lure', stat:'crit', v:[0.08, 0.01], when:{marked:'lure'}}},
    3:{bound:'class',
       skill:{
         warrior:{name:'Spear of the Night Pool', desc:'Wind up and hurl one great spear: it lands harder the farther it flies, up to 2.2 times at 28 m. Spends every Lure on the target.', cd:28, range:30, mult:6.0, act:['pell3w',1.3,1.1], anim:'slash',
                  fx:{proj:{kind:'thorn', speed:54, turn:12, life:0.8}, rangeScale:{from:5, to:28, k:2.2}, pop:{id:'lure', k:0.8}}},
         archer:{name:'Pitch Arrow', desc:'Draw and loose one arrow wrapped in burning pitch: up to 2.2 times as hard at 38 m. Spends every Lure on the target.', cd:28, range:42, mult:6.2, act:['pell3a',1.3,1.1], anim:'shoot',
                 fx:{proj:{kind:'snipe', speed:68, turn:12, life:1.0}, rangeScale:{from:5, to:38, k:2.2}, pop:{id:'lure', k:0.8}}},
         mage:{name:'Flare of the Pool', desc:'Gather the torch fire and loose one flare: up to 2.2 times as hard at 34 m. Spends every Lure on the target.', cd:28, range:34, mult:6.0, act:['pell3m',1.3,1.1], anim:'cast',
               fx:{proj:{kind:'ember', speed:62, turn:12, life:0.9}, rangeScale:{from:5, to:34, k:2.2}, pop:{id:'lure', k:0.8}}}},
       passive:{name:'Far Bank', text:'+{}% damage with every attack; you deal 20% less to a target within 6 m', stat:'dmg', v:[0.12, 0.02], cost:{stat:'dmg', v:-0.20, when:{dist:{to:6}}}}}},
  bonus:{
    3:{name:'Eel-Light', text:'a target carrying your Lure takes 10% more from you for each Lure', amp:{id:'lure', per:0.10}},
    5:{name:'The Pool Burns', text:'Your third-slot attack sets everything in a 6 m circle round the target ablaze for 120% damage', on:'cast3', at:'target', mult:1.2, range:6, fx:{ring:{r:6, burn:{dur:4, k:0.3}}}}},
});
