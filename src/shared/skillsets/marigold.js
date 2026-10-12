//@ Marigold's skill set, The Encore (a mixed set: safe DPS with a mild buff support, light): sparkles from afar, a stage that follows you, and the curtain call; marigold, cream, plum and paper lanterns
/* Agent map. Kit: docs/skillkits/kit-mixed.md (main safe DPS, also support (buff), mild; a mixed set has ONE element, never a hybrid); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces light);
   outfit and palette: docs/skillkits/looks/marigold.md, game/outfits/marigold.js; visuals: game/skillsets/look-marigold.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md.
   Test: tools/skillsets-first8-smoke.js, tools/skillsets-ladder.js --set marigold (a mixed set sits between a support's 90 and its main kit's ladder: about 120 to 135, never above 150). Land: the Sakura Vale (tier 2). Mark: Applause.
   What the engine gives her: buff power that depends on the company (`when:{allies}`), `perMark` on a buff's DURATION (each Applause lengthens Curtain Call by a second before it is spent), a cooldown refund (Encore), and on the client a
   transformation (looks.js sslWear: a halo of lanterns and ribbon wings worn while Curtain Call lasts; it is an overlay on the avatar, not a swapped model). */
defineSkillSet({
  id:'marigold', name:'The Encore', land:'vale', needs:{tier:2}, el:'light', outfit:'marigold',
  role:{main:'safe', also:{role:'support', part:'mild'}},
  char:{name:'Marigold', sex:'female', theme:'a stage idol / magical girl (the genres; everything original): paper lanterns, ribbons, a stage of her own', ip:{kind:'original', riffs:'the stage-idol and magical-girl genres (lanterns, ribbons, a transformation); no existing character, mascot, catchphrase or sequence'}},
  pal:{main:0xe59a2b, accent:0x5a2a4a, glow:0xffd36b},
  kit:{mark:'applause', name:'Applause', text:'Every sparkle earns Applause (up to 5) from its target; Curtain Call spends it all in a flash of light.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Ribbon Flourish', desc:'A short arc of the blade that throws a wave of light 6 m long. Leaves Applause and lets a little regeneration drift over you and your allies.', cd:0.9, range:6, mult:1.25, act:['marigold1w',0.5,0.35], anim:'slash',
                  fx:{cone:{r:6, arc:0.7, mark:{id:'applause', n:1, dur:12, max:5}}, ally:{kind:'regen', v:0.005, dur:3, r:18}}},
         archer:{name:'Harp Shot', desc:'An arrow that sings: a ranged sparkle on its target. Leaves Applause and lets a little regeneration drift over you and your allies.', cd:0.85, range:32, mult:1.5, act:['marigold1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'spirit', speed:44, turn:9, life:1.0, mark:{id:'applause', n:1, dur:12, max:5}}, ally:{kind:'regen', v:0.005, dur:3, r:18}}},
         mage:{name:'Lantern Bolt', desc:'A little paper lantern that floats to its target and bursts into light. Leaves Applause and lets a little regeneration drift over you and your allies.', cd:1.0, range:26, mult:1.9, act:['marigold1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spirit', speed:30, turn:8, life:1.1, mark:{id:'applause', n:1, dur:12, max:5}}, ally:{kind:'regen', v:0.005, dur:3, r:18}}}},
       passive:{name:'Crowd Pleaser', text:'With an ally within 9 m, the buffs you give are {}% stronger (still capped)', stat:'buffpow', v:[0.20, 0.03], when:{allies:{n:1, r:9}}}},
    2:{bound:'any',
       skill:{any:{name:'Center Stage', desc:'A stage of light follows you for 8 seconds: you and your allies standing in it (7 m) deal 12% more damage and regenerate 1.5% of health a second, and the light burns the enemies in it.', cd:16, range:7, mult:0.14, act:['marigold2x',0.7,0.45], anim:'nova',
                   fx:{zone:{r:7, dur:8, every:1, self:true, follow:true, ally:[{kind:'might', v:0.12, dur:2}, {kind:'regen', v:0.015, dur:2}]}}}},
       passive:{name:'Encore', text:'A kill takes 3 s off Center Stage\'s cooldown (at most every 3 s)', on:'kill', icd:3, cdr:{skill:3}}},
    3:{bound:'any',
       skill:{any:{name:'Curtain Call', desc:'The transformation: a pulse of light 9 m round you hurts the enemies there (and spends your Applause for extra damage), while you and your allies within 25 m take 20% less damage and are 20% quicker (shorter cooldowns) for 8 seconds, and a second longer for each Applause. You change for as long as it lasts: a halo of lanterns and ribbon wings.', cd:42, range:9, mult:1.2, act:['marigold3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:9, kb:3}, ally:[{kind:'guard', v:0.20, dur:8, r:25, perMark:{id:'applause', dur:1, r:9}}, {kind:'haste', v:0.20, dur:8, r:25, perMark:{id:'applause', dur:1, r:9}}], pop:{id:'applause', k:0.5, r:9}}}},
       passive:{name:'Stage Fright', text:'+{}% damage with every attack; you have 8% less maximum health', stat:'dmg', v:[0.07, 0.01], cost:{stat:'hp', v:-0.08}}}},
  bonus:{
    3:{name:'Warm-Up', text:'While you fight, you and your allies within 20 m regenerate 1.2% of maximum health a second (refreshed every 3 s)', on:'tick', icd:3, buff:{kind:'regen', v:0.012, dur:4, r:20}},
    5:{name:'Grand Finale', text:'Curtain Call also lets you and your allies within 25 m regenerate 3% of maximum health a second for 10 s', on:'cast3', buff:{kind:'regen', v:0.03, dur:10, r:25}}},
});
