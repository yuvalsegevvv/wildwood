//@ Ogden's skill set, The Grave Shift (a grinder, water): wide shoves of grave-water, a mire that drags a whole crowd in, and a feeding frenzy that mends him from the rot; moss green, drowned teal and old bone
/* Agent map. Kit: docs/skillkits/kit-grind.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (version 3, the Gloamhorn's first pair: all six pieces water, the grave-damp and the flooded crypt); outfit and palette:
   docs/skillkits/looks/ogden.md, game/outfits/ogden.js; visuals: game/skillsets/look-ogden.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3-smoke.js.
   LAND: the Gloamhorn's set at +3 (Captain Dredge, the Gloam Warden, the Gloamvault; Ottoline at +1 and Hollis at +2 are the Gloamhorn's other two; +4 and +5 roll Ogden; SS_SOURCES.gloam). Mark: Rot (the shoves leave it, Feeding Frenzy spends it and mends him). Unlike Tansy (the farmer: pure basic, a pulled field) he is
   a survivor-grinder: he heals from kills, finds more drops, and pays in damage taken. Friendlier odds like every grinder (`from`). */
defineSkillSet({
  id:'ogden', name:'The Grave Shift', land:'gloam', needs:{tier:3}, el:'water', outfit:'ogden',
  role:{main:'grind'},
  char:{name:'Ogden', sex:'male', theme:'a drowned gravedigger who got up to finish the shift and feeds on the crowds that follow him', ip:{kind:'original', riffs:'the shambling groundskeeper and gravedigger genre (a flat cap, a spade, a toe tag); no existing character'}},
  pal:{main:0x6f8f6b, accent:0xcfc7a8, glow:0x4fd0c0},
  emblem:{col:0x7fcf9c, glyph:'<path d="M12 3v11"/><path d="M8 14h8l-1 6h-6z"/><path d="M5 20.5c2.3-1.4 4.6-1.4 7 0s4.7 1.4 7 0"/><path d="M10 6h4"/>'},
  kit:{mark:'rot', name:'Rot', text:'Every shove leaves Rot (up to 5); Feeding Frenzy spends it, hurts the crowd and mends you.'},
  pos:{
    1:{bound:'class', from:{chance:0.15, pity:14},
       skill:{
         warrior:{name:'Spade Sweep', desc:'Swing the spade low and wide: everything in front of you takes a light chop. Leaves Rot.', cd:0.8, range:3.8, mult:0.34, act:['ogden1w',0.5,0.35], anim:'slash',
                  fx:{cone:{r:3.8, arc:2.2, mark:{id:'rot', n:1, dur:12, max:5}}}},
         archer:{name:'Bone Spray', desc:'Six rib-bones flung in a fan, each splashing a little where it lands: light on one enemy, heavy on a crowd. Leaves Rot.', cd:0.9, range:16, mult:0.2, act:['ogden1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'thorn', n:6, spread:0.34, speed:38, turn:0, life:0.42, splash:{r:1.8, k:0.5}, mark:{id:'rot', n:1, dur:12, max:5}}}},
         mage:{name:'Grave Splash', desc:'A bucket of grave-water thrown wide: it bursts over a crowd. Leaves Rot.', cd:1.1, range:20, mult:0.3, act:['ogden1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'frost', speed:28, turn:8, life:1.1, splash:{r:6, k:0.9}, mark:{id:'rot', n:1, dur:12, max:5}}}}},
       passive:{name:'Hungry', text:'A kill heals you for 1.5% of your maximum health (at most every 1.5 s)', on:'kill', icd:1.5, heal:0.015}},
    2:{bound:'any', from:{chance:0.15, pity:14},
       skill:{any:{name:'Open Grave', desc:'A sinking pit at your target: for 4 seconds everything in it is dragged to the middle, slowed and nicked. Wide enough to take in the next camp. Leaves Rot.', cd:11, range:16, mult:0.45, act:['ogden2x',0.7,0.5], anim:'nova',
                   fx:{zone:{r:9, dur:4, every:0.5, kb:-3.5, slow:1.5, mark:{id:'rot', n:1, dur:12, max:5}}}}},
       passive:{name:'Rotten Luck', text:'+{}% drop chance; you take 5% more damage', stat:'drop', v:[0.10, 0.015], cost:{stat:'red', v:-0.05}}},
    3:{bound:'any', from:{chance:0.30, pity:7},
       skill:{any:{name:'Feeding Frenzy', desc:'A wave of grave-water goes out round you, spends every Rot within 10 m for extra damage and mends you for half of it; then a lingering swell follows you for 5 seconds and keeps mending you.', cd:38, range:10, mult:0.9, act:['ogden3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:10, kb:2}, pop:{id:'rot', k:0.5, r:10, heal:0.5}, zone:{r:5, dur:5, every:0.5, self:true, follow:true, heal:{v:0.01, r:6}}}}},
       passive:{name:'Shambling', text:'You always regenerate {}% of your maximum health a second; your cooldowns are 10% longer', stat:'regen', v:[0.004, 0.0006], cost:{stat:'cd', v:-0.10}}}},
  bonus:{
    3:{name:'Overtime', text:'You gain {}% more experience from kills', stat:'xp', v:0.15},
    5:{name:'Dead Weight', text:'A kill makes the ground heave where it fell: the enemies within 5 m take 60% damage, are thrown back and are left with Rot (at most every 1.5 s)', on:'kill', at:'target', icd:1.5, mult:0.6, range:5, fx:{ring:{r:5, kb:2, mark:{id:'rot', n:1, dur:12, max:5}}}}},
});
