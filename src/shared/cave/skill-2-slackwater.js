//@ Deep Cave skill Slack Water (floor 2, meleni's set skill, method D)
/* Agent map. Plan: docs/CAVE.md section 4 (row of meleni); engine: server/cave-fx.js (cvstrike) + the generic ally buff; test: tools/cave-sets-smoke.js. READS meleni's mark (Swell), never spends it. */
defineCaveSkill({
  id:'slackwater', name:'Slack Water', floor:2, method:'D', set:'meleni', cost:30, el:'water', range:20, mult:0.8,
  desc:'Let the sea fall slack: a 6 m wave hits the enemies round you and slows them for 3 seconds (+8% damage for each Swell on a target, up to 40%), and you and your allies within 20 m get 15% shorter cooldowns for 6 seconds.',
  fx:{cvstrike:{r:6, slow:3, markK:{id:'swell', per:0.08, max:5}}, ally:{kind:'haste', v:0.15, dur:6, r:20}}});
