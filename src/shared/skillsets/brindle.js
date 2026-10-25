//@ Brindle's skill set, The Sun-Glass Belt (a mixed safe DPS + support, fire): a flung spark-pebble, a burst of focused sunlight that sharpens the party's aim, and a noon charge that spends the glints; amber, copper and laughing red
/* Agent map. Kit: docs/skillkits/kit-mixed.md (main safe DPS, also support, mild: the sun-glass makes the party hit harder and crit more); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces fire: his hits leave the aura a partner reacts with);
   outfit: game/outfits/brindle.js, docs/skillkits/looks/brindle.md; visuals: none yet, drawn like a generic skill. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js,
   tools/skillsets-ladder.js --set brindle. Land: the Amber Reach (tier 1; Old Thunder, Oldhorn and the Termite Cathedral are its sources, a late-bound id until the savanna bosses and dungeon exist). Mark: Glint.
   Unlike Marigold (the other safe + support: regeneration and a stage) he lends CRITICAL strikes: Sun-Glass Burst gives the party crit chance, Noon Charge crit damage and might, and both grow with the Glints he has on the enemies near him. */
defineSkillSet({
  id:'brindle', name:'The Sun-Glass Belt', land:'amber', needs:{tier:1}, el:'fire', outfit:'brindle',
  role:{main:'safe', also:{role:'support', part:'mild'}},
  char:{name:'Brindle', sex:'male', theme:'a loud-laughing hyena caravan tinker with a belt of sun-glass charges, who sells you the lens and lights the fuse himself', ip:{kind:'original', riffs:'the caravan-tinker and lens-grinder genre (a belt of glass charges, a goggled cap, a hyena-kin laugh); no existing character'}},
  pal:{main:0xd98a2b, accent:0x7a3b1c, glow:0xffd27a},
  emblem:{col:0xf2a64a, glyph:'<circle cx="12" cy="12" r="3.6"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'},
  kit:{mark:'glint', name:'Glint', text:'Every flung pebble leaves a Glint (up to 5) on its target; Noon Charge spends them all for extra damage, and the party buffs he gives grow with the Glints near him.'},
  pos:{
    1:{bound:'class',
       skill:{
         mage:{name:'Spark Pebble', desc:'Fling a pebble packed with sun-glass that flares on the target: a quick bolt of fire. Leaves a Glint.', cd:1.0, range:22, mult:1.3, act:['brindle1m',0.5,0.4], anim:'cast',
               fx:{proj:{kind:'ember', speed:46, turn:7, life:0.7, mark:{id:'glint', n:1, dur:12, max:5}}}}},
       passive:{name:'Loud Laugh', text:'With an ally within 12 m, the buffs you give are {}% stronger (still capped)', stat:'buffpow', v:[0.20, 0.03], when:{allies:{n:1, r:12}}}},
    2:{bound:'any',
       skill:{any:{name:'Sun-Glass Burst', desc:'Crack a glass charge at your target: a 5 m burst of focused light that sets what it hits ablaze for 3 seconds and leaves a Glint on each. You and your party within 15 m aim better (more critical hits) for 8 seconds, and the aim sharpens with each Glint near you.', cd:12, range:14, mult:1.2, act:['brindle2x',0.6,0.4], anim:'nova',
                   fx:{ring:{r:5, burn:{dur:3, k:0.3}, mark:{id:'glint', n:1, dur:12, max:5}}, ally:{kind:'crit', v:0.12, dur:8, r:15, perMark:{id:'glint', v:0.02, r:10}}}}},
       passive:{name:'Tinker\'s Eye', text:'+{}% critical hit chance', stat:'crit', v:[0.04, 0.006]}},
    3:{bound:'any',
       skill:{any:{name:'Noon Charge', desc:'Throw the whole belt: a charge of sun-glass bursts over a 6 m circle and sets it ablaze. It spends every Glint on the target and everything within 6 m of it for extra damage, and you and your party within 20 m deal 15% more damage and hit harder on a critical for 8 seconds.', cd:34, range:22, mult:2.4, act:['brindle3x',0.8,0.55], anim:'cast',
                   fx:{proj:{kind:'ember', speed:26, turn:6, life:1.1, splash:{r:6, k:1.0}, burn:{dur:4, k:0.3}}, pop:{id:'glint', k:0.7, r:6}, ally:[{kind:'might', v:0.15, dur:8, r:20}, {kind:'critdmg', v:0.25, dur:8, r:20}]}}},
       passive:{name:'Every Coin Counts', text:'+{}% damage with every attack; your cooldowns are 8% longer', stat:'dmg', v:[0.06, 0.01], cost:{stat:'cd', v:-0.08}}}},
  bonus:{
    3:{name:'Warm Lenses', text:'While you fight, you and your allies within 20 m deal 4% more damage (refreshed every 3 s)', on:'tick', icd:3, buff:{kind:'might', v:0.04, dur:4, r:20}},
    5:{name:'Fuse Lit', text:'A critical hit on a target carrying a Glint sets the enemies within 5 m of it ablaze with a burst for 90% damage (at most every 3 s)', on:'crit', when:{marked:'glint'}, at:'target', icd:3, mult:0.9, range:5, fx:{ring:{r:5, burn:{dur:3, k:0.3}}}}},
});
