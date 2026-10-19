//@ Free ways to earn gems: the pay of main and side quest steps, the daily quest set (UTC), the placeholder ad watch, and the achievements list
/* Agent map. Constants and the achievements (data + a pure check on {level, gear}); the server grants in server/gem-sources.js (gear.ach claimed ids, gear.dq the daily set, gear.ad the ads of today),
   the gem shop shows them (game/economy/gems.js), the quest board marks the daily notices (game/economy/quests.js qCard). Today is gsDayOf(ms) = the UTC day number.
   Maths: a perfect day is 4 x GEM_DQ_EACH + GEM_DQ_ALL = 50 gems, so an outfit set (GEM_SET_PRICE 1000) is free after 20 days. Test: tools/gem-sources-smoke.js */
const GEM_MQ_STEP=5, GEM_SQ_STEP=3, GEM_SQ_CHAIN=15, GEM_DQ_EACH=10, GEM_DQ_ALL=10, GEM_DQ_COUNT=4, GEM_AD=15, GEM_AD_DAY=3;
const gsDayOf=ms=>Math.floor(ms/86400000);
const gsSqDone=g=>SQ.filter(C=>g.sq&&g.sq.c&&g.sq.c[C.id]&&g.sq.c[C.id].s>=C.steps.length).length;
const GS_ACH=[   // id, ic (icon key: GS_ICON in game/economy/gems.js), name, what it asks, gems, check({level, gear})
  {id:'lv10',ic:'star',name:'Seasoned hiker',text:'Reach level 10',gems:10,ok:o=>o.level>=10},
  {id:'lv20',ic:'star',name:'Veteran',text:'Reach level 20',gems:20,ok:o=>o.level>=20},
  {id:'lv30',ic:'crown',name:'Mountain legend',text:'Reach level 30',gems:40,ok:o=>o.level>=30},
  {id:'qb10',ic:'scroll',name:'Board regular',text:'Hand in 10 quest board notices',gems:10,ok:o=>(o.gear.q.done||0)>=10},
  {id:'qb50',ic:'scroll',name:'Maren\'s favourite',text:'Hand in 50 quest board notices',gems:25,ok:o=>(o.gear.q.done||0)>=50},
  {id:'qb200',ic:'scroll',name:'The board is empty',text:'Hand in 200 quest board notices',gems:60,ok:o=>(o.gear.q.done||0)>=200},
  {id:'mq10',ic:'book',name:'The story so far',text:'Hand in 10 main quest steps',gems:10,ok:o=>o.gear.mq.s>=10},
  {id:'mq25',ic:'book',name:'Halfway there',text:'Hand in 25 main quest steps',gems:25,ok:o=>o.gear.mq.s>=25},
  {id:'mq49',ic:'book',name:'Act IV is over',text:'Hand in every main quest step',gems:50,ok:o=>o.gear.mq.s>=MQ.length},
  {id:'sq1',ic:'road',name:'A side road',text:'Finish one side quest chain',gems:15,ok:o=>gsSqDone(o.gear)>=1},
  {id:'sq6',ic:'road',name:'Every road',text:'Finish all side quest chains',gems:60,ok:o=>gsSqDone(o.gear)>=SQ.length},
  {id:'sk10',ic:'bolt',name:'Quick study',text:'Learn 10 skills',gems:10,ok:o=>o.gear.skills.owned.length>=10},
  {id:'prof3',ic:'pick',name:'Jack of all trades',text:'Learn all three professions',gems:15,ok:o=>Object.keys(o.gear.prof||{}).length>=3},
  {id:'cos5',ic:'hat',name:'Dressed for it',text:'Make 5 cosmetic pieces',gems:15,ok:o=>(o.gear.cos||[]).length>=5}];
