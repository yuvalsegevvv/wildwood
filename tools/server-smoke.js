// Headless world-server test straight from src/ (no build): prints one line per check, exits 1 on failure.
// Usage: node tools/server-smoke.js
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},['MONS','getH','W']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const you=pid=>[...inbox[pid]].reverse().find(m=>m.t==='you');
const tick=(n,keepAlive)=>{ for(let i=0;i<n;i++){ W.tick(0.05); if(keepAlive) for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
ok('world starts',W.monsters.length>400,W.monsters.length+' monsters');
inbox.a=[]; W.join('a',{name:'Tester',look:{cls:'warrior'},save:{level:1}}); tick(1);
ok('join sends welcome, roster, you',['welcome','mons','you'].every(t=>inbox.a.some(m=>m.t===t)));
const p=W.players.get('a'), off=p.gear.q.offers;
ok('quest board has 4 notices',off.length===4,off.map(q=>q.kind+' L'+q.level+' x'+(q.count||'-')).join(', '));
// kill slimes with a slime hunt accepted
p.gear.q.offers[0]=Object.assign({},off[0],{id:'g999',kind:'hunt',type:'kill',target:'slime',count:3,level:1,title:'Test hunt'});
W.receive('a',{t:'accept',id:'g999'});
let kills=0; for(const s of x.MONS.filter(m=>m.def.id==='slime').slice(0,4)){ for(let i=0;i<400&&!s.dead;i++){ W.setPos('a',[s.x+1.5,x.getH(s.x,s.z),s.z,Math.PI/2,0,0]); W.receive('a',{t:'atk',k:'basic',tg:s.id,face:Math.PI/2}); tick(1,true); } if(s.dead) kills++; }
tick(2); const y1=you('a');
ok('combat: kills give XP and coins',kills===4&&y1.exp>0&&y1.gear.coins>0,kills+' kills, '+y1.exp.toFixed(1)+' xp, '+y1.gear.coins+' coins');
ok('quest progress and ready',y1.gear.q.ready.includes('g999'));
W.receive('a',{t:'turnin',id:'g999'}); tick(1); ok('quest hand-in',you('a').gear.q.done===1);
W.receive('a',{t:'dev',cmd:'coins'}); W.receive('a',{t:'buy',id:'helmet1'}); W.receive('a',{t:'buy',id:'helmet1'}); W.receive('a',{t:'equip',id:'helmet1'}); tick(1);
const y2=you('a'); ok('shop, rising price, equip',y2.gear.eq.helmet==='helmet1'&&y2.gear.bought.helmet1===2);
W.receive('a',{t:'dev',cmd:'three'}); tick(1); const three=you('a').gear.inv.find(id=>you('a').gear.inv.filter(v=>v===id).length>=3&&!id.includes('-'));
W.receive('a',{t:'merge',id:three}); tick(1); ok('forge merges 3 into the next rarity',you('a').gear.inv.includes(three+'-r'),three+' -> '+three+'-r');
W.receive('a',{t:'dev',cmd:'level',v:15}); W.receive('a',{t:'dev',cmd:'giveAll'}); ['sword4','helmet4','top4','bottom4','shoes4'].forEach(id=>W.receive('a',{t:'equip',id})); tick(1);
ok('slots open at 3 and 10 with free abilities',p.gear.skills.eq.warrior.skill==='whirlwind'&&p.gear.skills.eq.warrior.burst==='quake');
// interest management: each player is sent the monsters near them (not everyone's), other players mostly once a second
inbox.c=[]; W.join('c',{name:'Far',look:{cls:'mage'},save:{level:5}});
const mA=x.MONS.find(m=>m.def.id==='slime'), mC=x.MONS.filter(m=>!m.boss&&m.x<430).sort((p,q)=>Math.hypot(q.x-mA.x,q.z-mA.z)-Math.hypot(p.x-mA.x,p.z-mA.z))[0], byId=new Map(x.MONS.map(m=>[m.id,m]));   // mC: the farthest monster in the home forest (the vale is closed to a new player)
W.setPos('a',[mA.x,x.getH(mA.x,mA.z),mA.z,0,0,0]); W.setPos('c',[mC.x,x.getH(mC.x,mC.z),mC.z,0,0,0]); tick(3,true); inbox.a.length=0; inbox.c.length=0; tick(40,true);
const snapsOf=pid=>inbox[pid].filter(m=>m.t==='snap'), idsOf=pid=>new Set(snapsOf(pid).flatMap(m=>m.mo.map(e=>e[0])));
const inRange=(pid,px,pz)=>{ const ids=idsOf(pid); return ids.size>0&&[...ids].every(id=>{ const m=byId.get(id); return Math.hypot(m.x-px,m.z-pz)<=(m.boss?190:110)+15; }); };
ok('a player is sent only the monsters near them',inRange('a',mA.x,mA.z)&&inRange('c',mC.x,mC.z),idsOf('a').size+' and '+idsOf('c').size+' monsters');
const withC=snapsOf('a').filter(m=>m.pl.some(e=>e[0]==='c')).length;
ok('a far player is in a few snapshots (once a second) and the head count stays right',withC>0&&withC<snapsOf('a').length/3&&snapsOf('a').every(m=>m.n===2),withC+' of '+snapsOf('a').length+' snapshots');
W.leave('c'); inbox.c=[];
// second player, then the boss
inbox.b=[]; W.join('b',{name:'Two',look:{cls:'mage'},save:{level:15}}); W.receive('b',{t:'dev',cmd:'giveAll'}); ['wand4','helmet4','top4','bottom4','shoes4'].forEach(id=>W.receive('b',{t:'equip',id})); tick(1);
const boss=W.monsters.find(m=>m.boss); let secs=0;
for(let i=0;i<8000&&!boss.dead;i++){
  const near=W.monsters.filter(m=>!m.dead&&!m.remove&&Math.hypot(m.x-boss.x,m.z-boss.z)<30), tg=boss.immune?(near.find(m=>m.def.id==='totem')||boss):(near.find(m=>m.def.id==='thornling')||boss);
  W.setPos('a',[tg.x+tg.T.rad+1.2,10,tg.z,Math.PI/2,0,0]); W.setPos('b',[tg.x+10,10,tg.z+2,Math.PI/2,0,0]);
  for(const [pid,k] of [['a','basic'],['a','skill'],['a','burst'],['b','basic'],['b','skill'],['b','burst']]) W.receive(pid,{t:'atk',k,tg:tg.id,face:Math.PI/2,aim:[-1,0,0]});
  tick(1,true); secs+=0.05;
}
ok('two players beat the boss (shield, totems, adds)',boss.dead,Math.round(secs)+' s');
const snaps=inbox.b.filter(m=>m.t==='snap').map(m=>JSON.stringify(m).length);
ok('snapshots fit the 4 KB room limit',Math.max(...snaps)<3800,'max '+Math.max(...snaps)+' bytes');
W.receive('a',{t:'dev',cmd:'weather',v:'storm'}); tick(20*60); ok('weather: storm with thunder',x.W.kind===2&&evs.some(e=>e[0]==='thunder'));
W.receive('a',{t:'chat',text:'  hello   there '}); tick(3); ok('chat is cleaned and relayed',evs.some(e=>e[0]==='chat'&&e[3]==='hello there'));
W.leave('b'); tick(3); ok('leave is broadcast',evs.some(e=>e[0]==='pleave'&&e[1]==='b'));
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
