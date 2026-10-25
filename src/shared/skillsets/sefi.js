//@ Sefi's skill set, The Long Run (a risk DPS, air): a cut as she passes, a gust-dash that lands behind the herd, and a dead heat that spends the stride; sand, spotted gold and sky
/* Agent map. Kit: docs/skillkits/kit-risk-dps.md (the finisher that pays in damage taken); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces air);
   outfit and palette: none yet (the Kin outfit is the savanna plan's K2); visuals: none yet, drawn like a generic skill. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3b-smoke.js,
   tools/skillsets-ladder.js --set sefi. Land: the Amber Reach (tier 3). Mark: Stride. The fourth risk DPS and the second courier, so she is built on a different lever from Sazanka (Barbs from behind) and Brynja (Momentum:
   damage while moving): SPEED OF KILLING (crits that shorten her cooldowns). Crits take time off her cooldowns (Crosswind), a fresh target takes her best crits (First Strike), and she pays in damage taken (Bare Run). */
defineSkillSet({
  id:'sefi', name:'The Long Run', land:'amber', needs:{tier:3}, el:'air', outfit:null,
  role:{main:'risk'},
  char:{name:'Sefi', sex:'female', theme:'a cheetah-kin courier who crosses the plain faster than the message, and cuts whatever stands in the way as she passes', ip:{kind:'original', riffs:'the plains courier and runner genre (a light sash, a curved knife, spotted gold fur); no existing character'}},
  pal:{main:0xe0b040, accent:0x3a2a1a, glow:0xbfe6ff},
  emblem:{col:0xf0cc66, glyph:'<path d="M3 15c3-1 4-4 8-5l8-1"/><path d="M6 19c2.5-.6 3.6-2.6 6.5-3.4l6-.6"/><path d="M15 6l4 3-3.6 2.4"/><circle cx="8" cy="9" r=".8"/>'},
  kit:{mark:'stride', name:'Stride', text:'Every cut takes a Stride (up to 5) from its target; Dead Heat spends them all for extra damage, and her critical hits take time off her skills.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Passing Cut', desc:'A quick curved cut with the whole stride behind it: heavy for a basic attack. Leaves a Stride.', cd:1.0, range:3.4, mult:1.5, act:['sefi1w',0.5,0.35], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.1, mark:{id:'stride', n:1, dur:12, max:5}}}, style:'press', hold:{x:{slow:2}}}},
       passive:{name:'First Strike', text:'+{}% critical hit chance against a target above 80% health', stat:'crit', v:[0.08, 0.012], when:{tgtHp:{above:0.8}}}},
    2:{bound:'any',
       skill:{any:{name:'Gust Dash', desc:'Burst up to 10 m past your target on a gust and cut everything round where you land. Leaves a Stride on each.', cd:7, range:10, mult:1.2, act:['sefi2x',0.5,0.3], anim:'slash',
                   fx:{dash:{behind:true, ahead:2}, ring:{r:3.4, mark:{id:'stride', n:1, dur:12, max:5}}}}},
       passive:{name:'Lean Frame', text:'+{}% damage with every attack; you have 10% less maximum health', stat:'dmg', v:[0.06, 0.01], cost:{stat:'hp', v:-0.10}}},
    3:{bound:'any',
       skill:{any:{name:'Dead Heat', desc:'Run the whole length of the plain in a breath: dash up to 12 m through your target and cut everything within 6 m of where you land, spending every Stride on it for extra damage. What is cut is left weakened for 4 seconds.', cd:30, range:12, mult:2.4, act:['sefi3x',0.8,0.5], anim:'slash',
                   fx:{dash:{ahead:4}, ring:{r:6, status:{kind:'weak', v:0.1, dur:4}}, pop:{id:'stride', k:0.8, r:6}}}},
       passive:{name:'Bare Run', text:'+{}% critical hit damage; you take 10% more damage', stat:'critdmg', v:[0.24, 0.035], cost:{stat:'red', v:-0.10}}}},
  bonus:{
    3:{name:'Cold Edge', text:'A hit on a target carrying a Stride (at most every 2 s) cuts again for 120% damage', on:'hit', when:{marked:'stride'}, icd:2, mult:1.2, range:3.4, fx:{cone:{r:3.4, arc:1.2}}},
    5:{name:'Crosswind', text:'A critical hit cuts the enemies within 5 m of the target for 110% damage, leaves a Stride on them, takes 1 s off your skill cooldowns and quickens you by 15% for 4 s (at most every 3 s)', on:'crit', at:'target', icd:3, mult:1.1, range:5, fx:{ring:{r:5, mark:{id:'stride', n:1, dur:12, max:5}}}, cdr:{skill:1}, buff:{kind:'haste', v:0.15, dur:4, r:1}}},
});
