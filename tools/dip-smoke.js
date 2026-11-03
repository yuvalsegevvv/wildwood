// The Dark Infection Pipes (shared/dip.js, server/dip.js), straight from src/, no build: one pipe in each of the eight lands on a clear square, upgrades with the zone's materials, the release (coins, 10 minutes,
// refills at the level's rate up to its count of every non-boss kind, the forest's low kinds at level 10, fewer drops), the price, the save cleaning, the junk-id guard.
// Usage: node tools/dip-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,send(to,m){ sent.push([to,m]); }},['DIP_SITES','DIP_BY_ID','DIP_BAD','DIP_ACT','landAt','DIP_COUNT','DIP_INTERVAL','DIP_MAX','DIP_SECS','DIP_SIDE','dipCost','dipNear','dipUpNeeds','dipKindLv','MON_DEFS','getH','MONS','monK','nearPath','PZ_SITES','sanitizeGear']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tick=(n,dt)=>{ for(let i=0;i<n;i++) W.tick(dt||0.05); };
const msgs=(to,t)=>sent.filter(s=>s[0]===to&&s[1].t===t).map(s=>s[1]);
const D=x.DIP_SITES;
const LANDS=['home','vale','hoar','grey','sun','gloam','amber','isles'];
ok('exactly one pipe in each of the eight lands, each standing in its own land',D.length===8&&x.DIP_BAD.length===0&&LANDS.every(l=>D.filter(s=>s.land===l).length===1&&x.landAt(D.find(s=>s.land===l).x,D.find(s=>s.land===l).z)===l),D.map(s=>s.id)+' bad '+x.DIP_BAD);
ok('ids are unique and the lookup finds each',new Set(D.map(s=>s.id)).size===D.length&&D.every(s=>x.DIP_BY_ID[s.id]===s));
ok('every pipe lists all the non-boss kinds of its land and four upgrade materials among them',D.every(s=>s.kinds.length>=14&&s.mats.length===4&&s.mats.every(id=>s.kinds.includes(id))&&s.kinds.every(id=>x.MON_DEFS.find(d=>d.id===id&&!d.boss))));
ok('no two pipes closer than 100 m, none within 18 m of a puzzle station',D.every((s,i)=>D.every((t,j)=>i===j||Math.hypot(s.x-t.x,s.z-t.z)>=100))&&D.every(s=>x.PZ_SITES.every(p=>Math.hypot(s.x-p.x,s.z-p.z)>=18)));
ok('the square is kept free of trees and camps (dipNear / nearPath)',D.every(s=>x.dipNear(s.x,s.z,0)&&x.dipNear(s.x+9,s.z-9,0)&&!x.dipNear(s.x+40,s.z,0)&&x.nearPath(s.x+5,s.z,0)));
ok('no wild camp stands on a pipe\'s square',D.every(s=>x.MONS.every(m=>m.temp||Math.abs(m.camp.x-s.x)>12||Math.abs(m.camp.z-s.z)>12)));
ok('counts rise 10 to 60, refills fall 12 to 3 s',x.DIP_COUNT[0]===10&&x.DIP_COUNT[5]===60&&x.DIP_INTERVAL[0]===12&&x.DIP_INTERVAL[5]===3&&x.DIP_COUNT.every((c,i,a)=>!i||c>a[i-1])&&x.DIP_INTERVAL.every((c,i,a)=>!i||c<a[i-1]));
const home=D.find(s=>s.id==='dip-home'), vale=D.find(s=>s.id==='dip-vale');
ok('the forest\'s kinds below 10 spawn at 10, the vale\'s keep their level',home.defs.every(d=>x.dipKindLv(home,d)===Math.max(10,d.level))&&vale.defs.every(d=>x.dipKindLv(vale,d)===d.level));
ok('the price grows with the level and with the zone',x.dipCost(home,0)<x.dipCost(home,5)&&x.dipCost(home,0)<x.dipCost(vale,0)&&x.dipCost(home,0)===x.dipCost(home,0));
W.join('a',{name:'Alice',look:{cls:'warrior'},save:{level:60}}); tick(2);
const A=W.players.get('a'), S0=home, put=(p,s)=>{ p.x=s.x; p.z=s.z; p.y=x.getH(s.x,s.z); };
ok('a save keeps a pipe level and cleans junk',(()=>{ const g=x.sanitizeGear({dip:{'dip-home':3,'dip-vale':99,'constructor':5,'__proto__':2,zzz:1}},'warrior'); return g.dip['dip-home']===3&&g.dip['dip-vale']===x.DIP_MAX&&!g.dip.zzz&&Object.keys(g.dip).length===2; })());
// far away: refused
put(A,{x:S0.x+200,z:S0.z}); A.gear.coins=1e9; W.receive('a',{t:'dip',a:'go',id:S0.id});
ok('too far away: nothing happens',!x.DIP_ACT.has(S0.id)&&A.gear.coins===1e9);
put(A,S0); W.receive('a',{t:'dip',a:'open',id:'constructor'}); W.receive('a',{t:'dip',a:'open',id:S0.id});
const inf=msgs('a','dip').pop();
ok('open answers with the level, price, count and the upgrade needs',inf&&inf.lv===0&&inf.cost===x.dipCost(S0,0)&&inf.count===10&&inf.every===12&&inf.needs.length===4);
// upgrade needs the materials
W.receive('a',{t:'dip',a:'up',id:S0.id}); ok('no materials: no upgrade',(A.gear.dip[S0.id]|0)===0);
for(const [id,n] of inf.needs) A.gear.mats[id]=n+3; W.receive('a',{t:'dip',a:'up',id:S0.id});
ok('with the materials the pipe is level 1 and they are spent',A.gear.dip[S0.id]===1&&inf.needs.every(([id,n])=>A.gear.mats[id]===3));
// release
A.gear.coins=10; W.receive('a',{t:'dip',a:'go',id:S0.id}); ok('too few coins: no release',!x.DIP_ACT.has(S0.id));
const cost=x.dipCost(S0,1); A.gear.coins=cost+7; W.receive('a',{t:'dip',a:'go',id:S0.id});
ok('release takes the price and starts it',x.DIP_ACT.has(S0.id)&&A.gear.coins===7);
const before=x.MONS.length; tick(2);
const st=x.DIP_ACT.get(S0.id), alive=()=>st.mons.filter(m=>!m.dead&&!m.remove);
ok('the first refill fills the pipe to its count with temporary monsters of the zone',alive().length===x.DIP_COUNT[1]&&alive().every(m=>m.temp&&m.dip===st&&S0.kinds.includes(m.def.id)),alive().length);
ok('the monsters are of several kinds from across the land',new Set(alive().map(m=>m.def.id)).size>=5);
ok('they stand inside the square and carry the level-10 numbers',alive().every(m=>Math.abs(m.x-S0.x)<=x.DIP_SIDE/2+0.01&&Math.abs(m.z-S0.z)<=x.DIP_SIDE/2+0.01&&(m.def.level>=10||(m.dgK&&m.dgK.lv===10))));
W.receive('a',{t:'dip',a:'go',id:S0.id}); ok('it cannot be started twice',A.gear.coins===7);
for(const m of alive().slice(0,5)){ m.dead=true; m.deadT=2; }
tick(Math.ceil(x.DIP_INTERVAL[1]/0.05)+10);
ok('the next refill tops it up again',alive().length===x.DIP_COUNT[1]);
tick(40); const lst=msgs('a','dipa').pop(); ok('the hiker is told which pipes are active',lst&&lst.a.length===1&&lst.a[0][0]===S0.id&&lst.a[0][1]<=x.DIP_SECS);
st.until=0; tick(2);   // (ten minutes of play, jumped to)
ok('after ten minutes it ends and its monsters are gone',!x.DIP_ACT.has(S0.id)&&st.mons.every(m=>m.dead||m.remove));
tick(80); ok('the list goes empty once none is active',msgs('a','dipa').pop().a.length===0);
// a lower level can be released, cheaper, even when the pipe is upgraded; a higher one than yours cannot
put(A,S0); A.dead=false; A.hp=A.maxHp; A.gear.dip[S0.id]=3; A.gear.coins=1e9; W.receive('a',{t:'dip',a:'go',id:S0.id,lv:1});
const st2=x.DIP_ACT.get(S0.id); tick(2);
ok('releasing at level 1 with a level-3 pipe pays the level-1 price and fills to the level-1 count',!!st2&&st2.L===1&&A.gear.coins===1e9-x.dipCost(S0,1)&&st2.mons.filter(m=>!m.dead&&!m.remove).length===x.DIP_COUNT[1]);
st2.until=0; tick(2); A.gear.dip[S0.id]=1; W.receive('a',{t:'dip',a:'go',id:S0.id,lv:5});
ok('asking for more than your own level gives your own',x.DIP_ACT.get(S0.id)&&x.DIP_ACT.get(S0.id).L===1);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
