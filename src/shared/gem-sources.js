//@ Free ways to earn gems: the pay of main and side quest steps, the daily quest set (UTC), the placeholder ad watch, and the achievements list
/* Agent map. Constants and the achievements (data + a pure check on {level, gear}); the server grants in server/gem-sources.js (gear.ach claimed ids, gear.dq the daily set, gear.ad the ads of today),
   the gem shop shows them (game/economy/gems.js), the quest board marks the daily notices (game/economy/quests.js qCard). Today is gsDayOf(ms) = the UTC day number.
   Maths: a perfect day is 4 x GEM_DQ_EACH + GEM_DQ_ALL = 50 gems, so an outfit set (GEM_SET_PRICE 1000) is free after 20 days. Test: tools/gem-sources-smoke.js */
const GEM_MQ_STEP=5, GEM_SQ_STEP=3, GEM_SQ_CHAIN=15, GEM_DQ_EACH=10, GEM_DQ_ALL=10, GEM_DQ_COUNT=4, GEM_AD=15, GEM_AD_DAY=3;
const gsDayOf=ms=>Math.floor(ms/86400000);
const gsSqDone=g=>SQ.filter(C=>g.sq&&g.sq.c&&g.sq.c[C.id]&&g.sq.c[C.id].s>=C.steps.length).length;
const GS_STATS=['kill','boss','die','chat','drink'];   // gear.st: counters kept by gsStatP (server/gem-sources.js); the silly achievements count deaths, chat lines and potions
const gsSt=(g,k)=>(g.st&&g.st[k])||0;
const gsSumOf=o=>{ let n=0; for(const k in o) n+=o[k]||0; return n; };
// a tier family: one entry per [need, gems] step (ids id1, id2, ...; '#' in the text becomes the need); every entry pays GEM_ACH_MIN..GEM_ACH_MAX
function gsTiers(id,ic,name,text,stat,steps){ return steps.map(([n,gems],i)=>({id:id+(i+1),ic,name,tier:i+1,text:text.replace('#',n),gems,ok:o=>stat(o)>=n})); }
const GS_ACH=[].concat(   // id, ic (icon key: GS_ICON in game/economy/gems.js), name, tier (1.. or absent), what it asks, gems, ok({level, gear})
  gsTiers('level','star','Climbing','Reach level #',o=>o.level,[[5,5],[10,5],[15,8],[20,10],[25,12],[30,15],[40,18],[50,20]]),
  gsTiers('kills','sword','Monster masher','Defeat # monsters',o=>gsSt(o.gear,'kill'),[[100,5],[1000,8],[5000,12],[20000,16],[100000,20]]),
  gsTiers('boss','crown','Giant killer','Defeat # bosses',o=>gsSt(o.gear,'boss'),[[1,5],[10,8],[50,12],[200,16]]),
  gsTiers('die','skull','Face-plant','Get knocked out # times',o=>gsSt(o.gear,'die'),[[1,5],[10,5],[50,8],[250,10]]),
  gsTiers('board','scroll','Board regular','Hand in # quest board notices',o=>o.gear.q.done||0,[[10,5],[50,8],[200,12],[500,16]]),
  gsTiers('mq','book','The story so far','Hand in # main quest steps',o=>o.gear.mq.s,[[10,5],[25,10]]),
  gsTiers('sq','road','Side roads','Finish # side quest chains',o=>gsSqDone(o.gear),[[1,5],[3,10]]),
  gsTiers('skills','bolt','Quick study','Learn # skills',o=>o.gear.skills.owned.length,[[5,5],[10,8],[20,12],[40,16]]),
  gsTiers('drink','flask','Sip sip','Drink # potions',o=>gsSt(o.gear,'drink'),[[1,5],[25,5],[200,10],[1000,15]]),
  gsTiers('chat','chat','Chatterbox','Send # chat lines',o=>gsSt(o.gear,'chat'),[[1,5],[50,5],[500,10]]),
  gsTiers('friend','heart','Not alone','Have # friends on your list',o=>(o.gear.fr||[]).length,[[1,5],[5,8],[15,12]]),
  gsTiers('cos','hat','Dressed for it','Make # cosmetic pieces',o=>(o.gear.cos||[]).length,[[1,5],[5,8],[15,12]]),
  gsTiers('outfit','shirt','Walking wardrobe','Own # outfit sets',o=>(o.gear.os||[]).length,[[1,8],[4,12],[8,20]]),
  gsTiers('delve','door','Delver','Win # dungeon runs',o=>gsSumOf(o.gear.dg&&o.gear.dg.clear),[[1,5],[10,10],[50,16]]),
  gsTiers('coins','coin','Moneybags','Hold # coins at once',o=>o.gear.coins,[[1000,5],[10000,5],[100000,10],[1000000,15]]),
  gsTiers('prof','pick','Jack of all trades','Learn # professions',o=>Object.keys(o.gear.prof||{}).length,[[1,5],[3,10]]),
  [{id:'mqall',ic:'book',name:'Act IV is over',text:'Hand in every main quest step',gems:20,ok:o=>o.gear.mq.s>=MQ.length},
   {id:'sqall',ic:'road',name:'Every road',text:'Finish every side quest chain',gems:20,ok:o=>gsSqDone(o.gear)>=SQ.length},
   {id:'vale',ic:'flag',name:'Across the river',text:'Open the way to the Sakura Vale',gems:8,ok:o=>o.gear.east>=1},
   {id:'reach',ic:'flag',name:'Cold front',text:'Open the ice wall to the Hoarfrost Reach',gems:10,ok:o=>o.gear.north>=1},
   {id:'spine',ic:'flag',name:'Up the spine',text:'Open the ice fall to the Greyspine',gems:12,ok:o=>o.gear.west>=1},
   {id:'sunscar',ic:'flag',name:'Sun and glass',text:'Walk into Glasswell, the Sunscar\'s city',gems:15,ok:o=>o.gear.sun>=2},
   {id:'gloam',ic:'flag',name:'Perpetual dusk',text:'Walk into Wraithwick in the Gloamhorn',gems:18,ok:o=>o.gear.gloam>=2},
   {id:'tier',ic:'layers',name:'Turn it up',text:'Unlock a zone tier in any land',gems:10,ok:o=>Object.values(o.gear.zt||{}).some(z=>z&&z.max>=1)},
   {id:'soul',ic:'ghost',name:'Soul bound',text:'Bind your soul to an element',gems:8,ok:o=>o.gear.soul&&o.gear.soul!=='basic'},
   {id:'jewel',ic:'ring',name:'Jewellery box',text:'Wear a ring and a pendant together',gems:8,ok:o=>!!(o.gear.eq.ring&&o.gear.eq.pendant)},
   {id:'stones',ic:'gem',name:'Stone cold',text:'Hold 20 Tempering Stones',gems:8,ok:o=>(o.gear.temper||0)>=20},
   {id:'broke',ic:'wallet',name:'Broke and proud',text:'Be level 15 with exactly 0 coins',gems:5,ok:o=>o.level>=15&&o.gear.coins===0},
   {id:'naked',ic:'shirt',name:'Brave or foolish',text:'Be level 10 and wear no armour at all',gems:5,ok:o=>o.level>=10&&!o.gear.eq.helmet&&!o.gear.eq.top&&!o.gear.eq.bottom&&!o.gear.eq.shoes},
   {id:'bag',ic:'bag',name:'Hoarder',text:'Fill your bag to the brim (80 items)',gems:5,ok:o=>o.gear.inv.length>=80},
   {id:'shop',ic:'bag',name:'Shopaholic',text:'Buy 50 things from shops',gems:5,ok:o=>gsSumOf(o.gear.bought)>=50},
   {id:'dragon',ic:'gem',name:'Dragon on a pile',text:'Hold 1000 gems at once',gems:5,ok:o=>(o.gear.gem||0)>=1000},
   {id:'fossil',ic:'gem',name:'Fossil collector',text:'Hold 1000 amber at once',gems:5,ok:o=>(o.gear.amb||0)>=1000}]);
const GEM_ACH_MIN=5, GEM_ACH_MAX=20;
const GS_ROMAN=['','I','II','III','IV','V','VI','VII','VIII'];
