// Headless test of the free gem sources (server/gem-sources.js): main and side quest steps, the UTC daily quest set (4 notices, +10 each, +10 for all), achievements, the capped placeholder ad watch.
// Usage: node tools/gem-sources-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({send(){}},['S','GEM_DQ_EACH','GEM_DQ_ALL','GEM_AD','GEM_AD_DAY','GS_ACH','gsDayOf','gsGemP','sanitizeGear','gsDailyP','genQuest','turnInP','refreshOffersP','mqCompleteP','mqOf']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.5); };
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:12}}); tick(2);
const p=W.players.get('a'), G=p.gear;
ok('a new day gives four daily notices on the board',G.dq.d===x.gsDayOf(Date.now())&&G.dq.ids.length===4&&G.q.offers.map(o=>o.id).join()===G.dq.ids.join());
x.refreshOffersP(p);
ok('the sunrise refresh keeps the daily notices',G.dq.ids.every(id=>G.q.offers.some(o=>o.id===id)));
let g0=G.gem;
for(let i=0;i<4;i++){ const id=G.dq.ids[i], q=G.q.offers.find(o=>o.id===id); G.q.defs[id]=q; G.q.active[id]=q.count||1; G.q.ready.push(id); x.turnInP(p,id); }
ok('four handed-in dailies pay 4 x 10 gems and 10 more for all',G.gem-g0===4*x.GEM_DQ_EACH+x.GEM_DQ_ALL,String(G.gem-g0));
const q=x.genQuest(12,'g9000'); G.q.defs[q.id]=q; G.q.active[q.id]=1; G.q.ready.push(q.id); g0=G.gem; x.turnInP(p,q.id);
ok('an ordinary board notice pays no gems',G.gem===g0);
G.dq.d-=1; tick(12);
ok('the next UTC day resets the set (new ids, nothing handed in)',G.dq.got.length===0&&G.dq.ids.length===4);
g0=G.gem; for(let i=0;i<5;i++) W.receive('a',{t:'adwatch'}); tick(1);
ok('the ad gives 15 gems, three times a day at most',G.gem-g0===x.GEM_AD*x.GEM_AD_DAY,String(G.gem-g0));
G.ad.d-=1; W.receive('a',{t:'adwatch'}); ok('...and comes back the next day',G.ad.n===1);
ok('the level 10 achievement was paid once',G.ach.includes('lv10')&&!G.ach.includes('lv20'));
g0=G.gem; p.level=22; tick(12);
ok('level 20 pays its achievement once',G.ach.includes('lv20')&&G.gem-g0===x.GS_ACH.find(a=>a.id==='lv20').gems);
g0=G.gem; x.gsGemP(p,5,'x'); ok('a main quest style grant adds gems',G.gem===g0+5);
const c=x.sanitizeGear({ach:['lv10','lv10','nope','__proto__'],dq:{d:5,ids:['g1','x','g1'],got:['g2']},ad:{d:3,n:99}},'warrior');
ok('saves are cleaned',c.ach.length===1&&c.dq.ids.length===1&&c.ad.n===x.GEM_AD_DAY);
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
