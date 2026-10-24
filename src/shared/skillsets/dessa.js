//@ Dessa's skill set, The Anvil in the Road (a tank, earth): a hammer that makes them turn, an anvil set down for the herd to break on, and a stand that spends the Temper; slate, forge orange and iron
/* Agent map. Kit: docs/skillkits/kit-tank.md (the main tank, nothing else: her anvil is a place to stand); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces earth: a held pack carries the aura a partner reacts with);
   outfit and palette: none yet (the Kin outfit is the savanna plan's K2); visuals: none yet, drawn like a generic skill. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js,
   tools/skillsets-ladder.js --set dessa. Land: the Amber Reach (tier 2). Mark: Temper. The third tank (Torgeir: one big wall; Genzo: a bell that heals): Dessa is a PLACE, not a moment. Anvil Down plants a zone (guard and a shield
   for the allies standing in it, a slow and a taunt for what enters), and she hardens with the crowd round her (damage reduction with enemies near), so she wants the herd to come to her. */
defineSkillSet({
  id:'dessa', name:'The Anvil in the Road', land:'amber', needs:{tier:2}, el:'earth', outfit:null,
  role:{main:'tank'},
  char:{name:'Dessa', sex:'female', theme:'a rhino-kin smith who sets her anvil in the road and lets the herd break on it', ip:{kind:'original', riffs:'the roadside blacksmith and wall-builder genre (a leather apron, a long-handled hammer, an anvil on a chain); no existing character'}},
  pal:{main:0x6b6f78, accent:0xd9742a, glow:0xffb36b},
  emblem:{col:0xe0883f, glyph:'<path d="M4 9h13c1.5 0 3 1 3 2.5H12.5L11 14H7l-1.2-2.5C4.8 11 4 10.2 4 9z"/><path d="M8 14v4M15 14v4M6 18h11"/>'},
  kit:{mark:'temper', name:'Temper', text:'Every blow leaves Temper (up to 5) on what it hit; Break the Herd spends it all for a heavier blow that heals you, and Break the Herd\'s shield grows with it.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Hammer Fall', desc:'Bring the long hammer down: a heavy blow, and everything it hits turns on you for 3 seconds. Leaves Temper.', cd:1.0, range:3.4, mult:0.9, act:['dessa1w',0.55,0.4], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.0, kb:2, taunt:{dur:3}, mark:{id:'temper', n:1, dur:12, max:5}}}}},
       passive:{name:'Hide Like a Wall', text:'{}% less damage taken while 3 enemies are within 6 m of you', stat:'red', v:[0.10, 0.01], when:{crowd:{n:3, r:6}}}},
    2:{bound:'any',
       skill:{any:{name:'Anvil Down', desc:'Set the anvil in the road for 8 seconds: a 6 m circle that holds the enemies in it (slowed, and they come for you), while you and your allies standing in it take 25% less damage and carry a shield worth 6% of health, refreshed every second. What is close is shoved back.', cd:18, range:6, mult:0.6, act:['dessa2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:3, mark:{id:'temper', n:1, dur:12, max:5}}, taunt:{dur:4, r:12}, zone:{r:6, dur:8, every:1, self:true, slow:0.4, ally:{kind:'guard', v:0.25, dur:2}, shield:{v:0.06, dur:3}}}}},
       passive:{name:'Shrug It Off', text:'{}% of the damage you take is thrown back at the attacker', stat:'reflect', v:[0.15, 0.02]}},
    3:{bound:'any',
       skill:{any:{name:'Break the Herd', desc:'Stand in the road and let the stampede break: a taunt for 6 seconds (a boss\'s melee for half of that), 30% less damage taken and a shield worth 12% of health for you and your party for 8 seconds, then the ground heaves, spending every Temper nearby for extra damage, and a share of it heals you.', cd:40, range:8, mult:1.2, act:['dessa3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:8, kb:6, stun:1}, taunt:{dur:6, r:16}, ally:{kind:'guard', v:0.3, dur:8, r:20}, shield:{v:0.12, dur:8, r:20, perMark:{id:'temper', v:0.03, r:10}}, pop:{id:'temper', k:0.6, r:8, heal:0.4}}}},
       passive:{name:'Slow and Heavy', text:'+{}% maximum health; your cooldowns are 8% longer', stat:'hp', v:[0.10, 0.02], cost:{stat:'cd', v:-0.08}}}},
  bonus:{
    3:{name:'Hot Iron', text:'When you are hit, sparks leap 4 m round you for 50% damage and leave Temper (at most every 4 s)', on:'hurt', icd:4, mult:0.5, range:4, fx:{ring:{r:4, mark:{id:'temper', n:1, dur:12, max:5}}}},
    5:{name:'The Anvil Holds', text:'When you drop below 35% health, the anvil rings: you heal 15% and you and your allies within 20 m take 20% less damage and carry a shield worth 10% of health for 8 s (at most every 25 s)', on:'low', below:0.35, icd:25, heal:0.15, shield:{v:0.10, dur:8}, buff:{kind:'guard', v:0.2, dur:8, r:20}}},
});
