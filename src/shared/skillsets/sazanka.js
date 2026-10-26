//@ Sazanka's skill set, The Night Run (risk DPS, dark + air): quick jabs that hit hardest from behind, a slip to the target and a flurry that spends every Barb; ink, cord and moon-grey
/* Agent map. Kit: docs/skillkits/kit-risk-dps.md; theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (a HYBRID: P1 air, P2 and P3 dark; her own air basic then dark skill react into weak + spread); outfit and palette:
   docs/skillkits/looks/sazanka.md, game/outfits/sazanka.js; visuals: game/skillsets/look-sazanka.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set sazanka.
   Land: the Sakura Vale (tier 1). Mark: Barb. Soul to bind: dark (her skill and burst get x1.5).
   What the engine gives her: a Barb that lands only from behind (`mark.behind`), a dash that lands on the far side of the target (`dash.behind`), the `moved` condition (Light Feet), a crit-damage stat, `marked` (Quick Study: more crit
   chance against a barbed target), a trigger on a kill OR a crit (`on:[..]`) and a cooldown refund (`cdr`). Careless play (never behind) earns no Barbs at all: that is the risk. */
defineSkillSet({
  id:'sazanka', name:'The Night Run', land:'vale', needs:{tier:1}, el:['dark', 'air'], outfit:'sazanka',
  role:{main:'risk'},
  char:{name:'Sazanka', sex:'female', theme:'a night courier of lantern-lit streets (the shadow-runner genre)', ip:{kind:'original', riffs:'the night-courier and shadow-runner genre (a hood, a cord sash, a delivery tag); no existing character'}},
  pal:{main:0x2f3f6b, accent:0xc23b2a, glow:0x5a4cc0},
  emblem:{col:0xa89cf0, glyph:'<circle cx="12" cy="5.8" r="3.2"/><circle cx="17.9" cy="10.1" r="3.2"/><circle cx="15.7" cy="17" r="3.2"/><circle cx="8.3" cy="17" r="3.2"/><circle cx="6.1" cy="10.1" r="3.2"/><circle cx="12" cy="12" r="1.3"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col): never the generic star
  kit:{mark:'barb', name:'Barb', text:'Every jab leaves a Barb (up to 5); Dusk Flurry spends them all, and Quick Study makes a barbed target take more from you.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Pinprick', desc:'Two quick jabs at melee range, much stronger from behind the enemy. A hit from behind leaves a Barb.', cd:0.6, range:2.8, mult:0.4, act:['sazanka1w',0.4,0.25], anim:'slash', el:'air',
                  fx:{cone:{r:2.8, arc:0.9, hits:2, mark:{id:'barb', n:1, dur:10, max:5, behind:true}}, behind:1.6},style:'press'}},
       passive:{name:'Light Feet', text:'+{}% damage for 2 s after you moved', stat:'dmg', v:[0.10, 0.01], when:{moved:2}}},
    2:{bound:'any',
       skill:{any:{name:'Slip Behind', desc:'Dash up to 10 m past your target and strike from behind on arrival, much stronger from behind. Leaves a Barb on everything hit.', cd:8, range:10, mult:1.1, act:['sazanka2x',0.5,0.3], anim:'slash', el:'dark',
                   fx:{dash:{ahead:6, behind:true}, ring:{r:3.2, mark:{id:'barb', n:1, dur:10, max:5}}, behind:1.6}}},
       passive:{name:'Brittle Edge', text:'+{}% critical hit damage; you have 10% less maximum health', stat:'critdmg', v:[0.30, 0.04], cost:{stat:'hp', v:-0.10}}},
    3:{bound:'any',
       skill:{any:{name:'Dusk Flurry', desc:'Spend every Barb at once on the target and everything within 4 m of it, then fight in a three-second flurry round you that follows you. Stronger from behind.', cd:32, range:6, mult:0.3, act:['sazanka3x',0.7,0.4], anim:'spin', el:'dark',
                   fx:{zone:{r:3.4, dur:2.5, every:0.25, self:true, follow:true}, pop:{id:'barb', k:1.0, r:4}, behind:1.6}}},
       passive:{name:'Quick Study', text:'+{}% critical hit chance against a target carrying Barbs', stat:'crit', v:[0.12, 0.01], when:{marked:'barb'}}}},
  ult:{name:'New Moon', desc:'She vanishes, comes back behind the target and lands a six-cut flurry; the stunned lose sight of her.', range:4, mult:0.75, act:['sazankault',0.9,0.4], anim:'spin',
       fx:{cone:{r:4, arc:1.2, hits:6}, behind:1.6},
       boost:[{piece:'a2', secs:10, mod:{cd:0.4}}, {piece:'p3', secs:12, mod:{v:2.5}}]},
  bonus:{
    3:{name:'First Cut', text:'The first hit on a target from behind (every 2 s) adds a second Barb and cuts again for 90% damage', on:'hit', when:{behind:true}, icd:2, mark:{id:'barb', n:1, dur:10, max:5}, mult:0.9, range:3.4, fx:{cone:{r:3.4, arc:1.2}, behind:1.6}},
    5:{name:'Open Season', text:'A kill or a critical hit takes 2.5 s off Dusk Flurry\'s cooldown (at most every 1.5 s)', on:['kill', 'crit'], icd:1.5, cdr:{burst:2.5}}},
});
