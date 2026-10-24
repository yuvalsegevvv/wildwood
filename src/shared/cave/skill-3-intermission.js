//@ Deep Cave skill Intermission (floor 3, marigold's set skill, method C)
/* Agent map. Plan: docs/CAVE.md section 4 (row of marigold); engine: server/cave-fx.js (its fx keys); test: tools/cave-sets-smoke.js. READS marigold's mark, never spends it. */
defineCaveSkill({
  id:'intermission', name:'Intermission', floor:3, method:'C', set:'marigold', cost:30, el:'light', range:15, mult:0, act:['cv_intermission', 1.0, 0.9], feat:{kind:'holdMark', mark:'applause', n:5, secs:20, time:90, r:15},
  desc:'A 1 second bow. Then every ally within 15 m has their next skill +4% for each Applause near you (up to +20%) and heals 3%.',
  fx:{next:{perMark:{id:'applause', v:0.04, max:5, r:15}, cap:0.2, r:15, dur:10, heal:0.03}}});
