//@ Tzaya's skill set, The Long Count (a grinder, fire): an obsidian sweep, a fire pit that drags a camp together, and a reckoning that pays the whole count back; jade, gold and cinder red
/* Agent map. Kit: docs/skillkits/kit-grind.md (the grinder whose big move spends a mark: like Ogden's Rot in another voice); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces fire);
   outfit: game/outfits/tzaya.js, docs/skillkits/looks/tzaya.md; visuals: game/skillsets/look-tzaya.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-isles-smoke.js,
   tools/skillsets-ladder.js --set tzaya. Land: the Emberwake Isles (tier 2). Mark: Tally. Tally is time (cooldowns), Ogden's Rot is food (healing): the pit burns the counted harder (vs Counted), the Reckoning's spent Tallies bring the pit back
   (pop.cdr), kills bring the Reckoning back (Day Count). Synergy: docs/skillkits/SYNERGY-REWORK.md section 9 (order-free). */
defineSkillSet({
  id:'tzaya', name:'The Long Count', land:'isles', needs:{tier:2}, el:'fire', outfit:'tzaya',
  role:{main:'grind'},
  char:{name:'Tzaya', sex:'male', theme:'a calendar-priest who keeps the count by what he burns, and feeds on the crowds that gather to be counted', ip:{kind:'original', riffs:'the Mesoamerican calendar-priest genre (a feathered headdress, a jade collar, an obsidian blade); no existing character'}},
  pal:{main:0x2f8a5a, accent:0xd8b040, glow:0xff7a3a},
  emblem:{col:0xe8b44a, glyph:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'},
  kit:{mark:'tally', name:'Tally', text:'Every sweep and the fire pit leave a Tally (up to 5). The pit burns the counted harder; the Reckoning spends the count and brings the pit back sooner, and every kill brings the Reckoning back sooner.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Obsidian Sweep', desc:'Swing the obsidian blade low and wide: everything in front of you takes a light cut. Leaves a Tally.', cd:0.8, range:3.8, mult:0.62, act:['tzaya1w',0.5,0.35], anim:'slash',
                  fx:{vsBoss:0.5, cone:{r:3.8, arc:2.2, mark:{id:'tally', n:1, dur:12, max:5}}},style:'press'}},
       passive:{name:'Day Count', text:'A kill takes half a second off The Reckoning (at most every 1.5 s)', on:'kill', icd:1.5, cdr:{burst:0.5}}},
    2:{bound:'any',
       skill:{any:{name:'Fire Pit', desc:'A pit of coals at your target: for 4 seconds everything in it is dragged to the middle, slowed and singed, and left with a Tally. What already carries a Tally burns 15% harder. Wide enough to take in the next camp.', cd:11, range:16, mult:0.8, act:['tzaya2x',0.7,0.5], anim:'nova',
                   fx:{vsBoss:0.5, zone:{r:9, dur:4, every:0.5, kb:-3.5, slow:1.5, mark:{id:'tally', n:1, dur:12, max:5}}, vs:{when:{marked:'tally'}, k:1.15, name:'Counted'}}}},
       passive:{name:'Gold Luck', text:'+{}% drop chance; you take 5% more damage', stat:'drop', v:[0.10, 0.015], cost:{stat:'red', v:-0.05}}},
    3:{bound:'any',
       skill:{any:{name:'The Reckoning', desc:'A wave of fire goes out round you, spends every Tally within 10 m for extra damage and mends you for half of it. Each Tally spent (up to five) takes 1.2 seconds off Fire Pit. A lingering heat then follows you for 5 seconds and mends you a little.', cd:38, range:10, mult:1.8, act:['tzaya3x',0.9,0.6], anim:'nova',
                   fx:{vsBoss:0.5, ring:{r:10, kb:2}, pop:{id:'tally', k:0.5, r:10, heal:0.5, cdr:{skill:1.2}, cdrMax:5}, zone:{r:5, dur:5, every:0.5, self:true, follow:true, heal:{v:0.006, r:6}}}}},
       passive:{name:'Cinder Count', text:'A critical hit adds a Tally to what it hit (at most every 2 s)', on:'crit', icd:2, mark:{id:'tally', n:1, dur:12, max:5}}}},
  ult:{name:'The Fifth Sun', desc:'The ground opens in a 10 m ring and fire geysers burst up; hands of ash reach out of the ground and hold what they catch.', range:10, mult:2.95, act:['tzayault',1.0,0.6], anim:'nova',
       fx:{ring:{r:10, kb:3}},
       boost:[{piece:'a3', secs:10, mod:{mult:2, util:2}}, {piece:'p1', secs:16, mod:{icd:0.33}}]},   // (eff scales a trigger's heal, mult, shield and buff, not its cdr: Day Count is boosted by a shorter wait)
  tree:'banyan', stone:'Sunclock Bondstone',
  bonds:{   // Bond I and IV: the two passives that are no longer equippable; II and VI: the old 3- and 5-set rows (the Bond engine reads them in step 12)
    1:'tzaya_p2',
    2:{name:'Long Count', text:'You gain {}% more experience from kills', stat:'xp', v:0.15},
    4:'tzaya_p3',
    6:{name:'Sunfall', text:'A kill makes the ground flare where it fell: the enemies within 5 m take 60% damage, are thrown back and are left with a Tally (at most every 1.5 s)', on:'kill', at:'target', icd:1.5, mult:1.2, range:5, fx:{vsBoss:0.5, ring:{r:5, kb:2, mark:{id:'tally', n:1, dur:12, max:5}}}}},
});
