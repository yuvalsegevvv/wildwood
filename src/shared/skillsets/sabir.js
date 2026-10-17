//@ Sabir's skill set, The Caravan Raid (risk DPS, fire): smash-and-grab dashes, a powder keg that spends the plunder, and a bonus for finishing the wounded; sand cloth, indigo and crimson
/* Agent map. Kit: docs/skillkits/kit-risk-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (version 3, the Sunscar's pair: all six pieces fire, the lamp-oil and powder of a raider); outfit and palette:
   docs/skillkits/looks/sabir.md, game/outfits/sabir.js; visuals: game/skillsets/look-sabir.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3-smoke.js.
   LAND: the Sunscar's set at +1 (moved down from +4 when every land got a set at +1, +2 and +3: see nephra.js). Mark: Loot (every strike takes some; Powder Keg spends it all). Unlike Sazanka (the other risk set: from behind) he is
   a finisher: he wants wounded targets (Finish the Wounded, tgtHp below 35%), a kill streak (Fence the Goods), and he pays for it in damage taken. */
defineSkillSet({
  id:'sabir', name:'The Caravan Raid', land:'sun', needs:{tier:1}, el:'fire', outfit:'sabir',
  role:{main:'risk'},
  char:{name:'Sabir', sex:'male', theme:'a dune raider who hits a caravan hard, takes what he can carry and is gone before the guards form up', ip:{kind:'original', riffs:'the desert raider and caravan-bandit genre (a veil, a sash, a curved blade, a powder horn); no existing character'}},
  pal:{main:0xa8322a, accent:0xd2b27a, glow:0xff8a3a},
  emblem:{col:0xf08a4a, glyph:'<path d="M5 20c1.4-6 6.4-10 14-14"/><path d="M19 6c-.6 2.6-2 4.4-4.4 5.6"/><path d="M8 20h8"/><path d="M13 3.5c1.4 1 1.7 2.2 1 3.6-1.5-.4-2.2-1.5-1-3.6z"/>'},
  kit:{mark:'loot', name:'Loot', text:'Every strike takes some Loot (up to 5); Powder Keg spends all of it for extra damage.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Scimitar Slash', desc:'A hard curved cut across the front: heavy for a basic attack. Leaves Loot.', cd:1.1, range:3.4, mult:2.1, act:['sabir1w',0.5,0.35], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.4, mark:{id:'loot', n:1, dur:12, max:5}}}},
         archer:{name:'Raider Shot', desc:'A short recurve bow loosed fast: heavy for a basic attack. Leaves Loot.', cd:1.0, range:26, mult:2.0, act:['sabir1a',0.5,0.45], anim:'shoot',
                 fx:{proj:{kind:'ember', speed:50, turn:7, life:0.8, mark:{id:'loot', n:1, dur:12, max:5}}}},
         mage:{name:'Lamp-Oil Flick', desc:'Flick burning oil from a lamp: heavy for a basic attack. Leaves Loot.', cd:1.1, range:22, mult:2.3, act:['sabir1m',0.55,0.5], anim:'cast',
               fx:{proj:{kind:'ember', speed:34, turn:8, life:0.9, mark:{id:'loot', n:1, dur:12, max:5}}}}},
       passive:{name:'Finish the Wounded', text:'+{}% damage against a target below 35% health', stat:'dmg', v:[0.12, 0.02], when:{tgtHp:{below:0.35}}}},
    2:{bound:'any',
       skill:{any:{name:'Smash and Grab', desc:'Dash up to 9 m to your target and hit everything round it, setting it ablaze for 4 seconds. Leaves Loot on each.', cd:8, range:9, mult:1.5, act:['sabir2x',0.5,0.3], anim:'slash',
                   fx:{dash:{ahead:2}, ring:{r:3.4, burn:{dur:4, k:0.3}, mark:{id:'loot', n:1, dur:12, max:5}}}}},
       passive:{name:'Reckless', text:'+{}% critical hit damage; you take 10% more damage', stat:'critdmg', v:[0.30, 0.04], cost:{stat:'red', v:-0.10}}},
    3:{bound:'any',
       skill:{any:{name:'Powder Keg', desc:'Hurl a keg of black powder at your target: it bursts over a 6 m circle and sets it ablaze. Spends every Loot on the target and everything within 6 m of it for extra damage.', cd:30, range:24, mult:3.2, act:['sabir3x',0.8,0.6], anim:'cast',
                   fx:{proj:{kind:'ember', speed:24, turn:6, life:1.2, splash:{r:6, k:1.0}, burn:{dur:5, k:0.35}}, pop:{id:'loot', k:0.8, r:6}}}},
       passive:{name:'Burning Bridges', text:'+{}% damage with every attack; you have 12% less maximum health', stat:'dmg', v:[0.10, 0.015], cost:{stat:'hp', v:-0.12}}}},
  bonus:{
    3:{name:'Quick Fingers', text:'A hit on a target carrying Loot (at most every 2 s) cuts again for 130% damage', on:'hit', when:{marked:'loot'}, icd:2, mult:1.3, range:3.4, fx:{cone:{r:3.4, arc:1.2}}},
    5:{name:'Fence the Goods', text:'A kill or a critical hit hits the enemies within 6 m for 120% damage, leaves Loot on them and heals you for 3% of maximum health (at most every 2 s)', on:['kill', 'crit'], at:'target', icd:2, heal:0.03, mult:1.2, range:6, fx:{ring:{r:6, mark:{id:'loot', n:1, dur:12, max:5}}}}},
});
