// Headless world-server test straight from src/ (no build): prints one line per check, exits 1 on failure.
// Usage: node tools/server-smoke.js
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},['MONS','getH','W','BOSSES','COINS_MAX','EXP_MAX']);
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
for(const id of ['constructor','__proto__','toString','hasOwnProperty']) W.receive('a',{t:'buy',id});   // Object.prototype's names used to pass `if(!ITEM[id])` and charge NaN coins
tick(1); ok('a prototype name is never an item id (coins stay a number, nothing is added)',Number.isInteger(p.gear.coins)&&p.gear.coins>=0&&!p.gear.inv.some(id=>typeof id!=='string'||id==='constructor'||id==='toString'),'coins '+p.gear.coins);
W.receive('a',{t:'dev',cmd:'three'}); tick(1); const three=you('a').gear.inv.find(id=>you('a').gear.inv.filter(v=>v===id).length-(Object.values(you('a').gear.eq).includes(id)?1:0)>=3&&!id.includes('-'));   // (a worn copy does not count: the shop check above left three Leather Caps in the bag, one worn, and picking those made this flaky)
W.receive('a',{t:'merge',id:three}); tick(1); ok('forge merges 3 into the next rarity',you('a').gear.inv.includes(three+'-r'),three+' -> '+three+'-r');
W.receive('a',{t:'dev',cmd:'level',v:15}); W.receive('a',{t:'dev',cmd:'giveAll'}); ['sword4','helmet4','top4','bottom4','shoes4'].forEach(id=>W.receive('a',{t:'equip',id})); tick(1);
ok('slots open at 3 and 10 with free abilities',p.gear.skills.eq.warrior.skill==='whirlwind'&&p.gear.skills.eq.warrior.burst==='quake');
// interest management: each player is sent the monsters near them (not everyone's), other players mostly once a second
inbox.c=[]; W.join('c',{name:'Far',look:{cls:'mage'},save:{level:5}});
const mA=x.MONS.find(m=>m.def.id==='slime'), mC=x.MONS.filter(m=>!m.boss&&m.x<430&&m.x>-430&&m.z>-430).sort((p,q)=>Math.hypot(q.x-mA.x,q.z-mA.z)-Math.hypot(p.x-mA.x,p.z-mA.z))[0], byId=new Map(x.MONS.map(m=>[m.id,m]));   // mC: the farthest monster in the home forest (the vale is closed to a new player)
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
// the bosses' state (b, ~170 bytes) is sent when it changes, when a boss comes into range, and with the 3 s full resend, not in every snapshot
{ inbox.bq=[]; W.join('bq',{name:'Bq',look:{cls:'mage'},save:{level:5}}); tick(3); const first=inbox.bq.find(m=>m.t==='snap'); inbox.bq.length=0; tick(100,true);   // (a snapshot every other tick)
  const sn=inbox.bq.filter(m=>m.t==='snap'), withB=sn.filter(m=>m.b);
  ok('boss state: the first snapshot carries b, an idle stream carries it only now and then (the 3 s full resend), and always with the twelve',!!first&&!!first.b&&first.b.length===12&&withB.length>=1&&withB.length<=Math.ceil(sn.length/10)+1&&withB.every(m=>m.b.length===12),withB.length+' of '+sn.length+' snapshots');
  const B0=x.BOSSES?x.BOSSES[0]:null; inbox.bq.length=0; if(B0){ B0.phase=2; tick(3); }
  ok('boss state: a change reaches the player in the next snapshots',!B0||inbox.bq.some(m=>m.b&&m.b.some(r=>r[2]===2)),B0?'phase 2 sent':'(no boss list exposed)'); if(B0) B0.phase=1; tick(2); W.leave('bq'); }
// a look is shown to every client in sight: the server cuts it down to flat primitives (no nested objects, long strings, non-finite numbers, or names of Object.prototype)
W.receive('a',{t:'look',look:{cls:'mage',hair:'short',hat:'ranger',model:'constructor',skin:'__proto__',nested:{a:1},list:[1,2],long:'x'.repeat(60),huge:1e999,height:1.05,ahoge:true}}); tick(3);
{ const L=W.players.get('a').look; ok('a look message is cut down: primitives kept, prototype names / nested / long / non-finite dropped',L.cls==='mage'&&L.hair==='short'&&L.height===1.05&&L.ahoge===true&&!('model' in L)&&!('skin' in L)&&!('nested' in L)&&!('list' in L)&&!('long' in L)&&!('huge' in L),JSON.stringify(L));
  ok('the changed look reaches the others as an event',evs.some(e=>e[0]==='plook'&&e[2]&&e[2].hair==='short')); }
// a save is JSON the client controls: an own '__proto__' key (JSON.parse makes one) must not become a map's prototype, an own 'toString' must not make the sanitizers throw
{ inbox.px=[]; let thrown=null; try{ W.receive('px',JSON.parse('{"t":"hello","name":"Proto","look":{"cls":"warrior"},"save":{"level":5,"gear":{"coins":{"toString":1},"bought":{"__proto__":{"helmet1":-1000},"toString":3,"helmet1":1},"inv":[{"toString":1},"sword1"],"skills":{"owned":[{"valueOf":1}]}}}}')); }catch(e){ thrown=e.message; } tick(2);
  const q=W.players.get('px'); ok('a hello whose save has own __proto__ / toString keys still joins, and no map inherits from it',!!q&&Object.getPrototypeOf(q.gear.bought)===Object.prototype&&!(Object.keys(q.gear.bought).length>0&&q.gear.bought.helmet1<0)&&q.gear.inv.every(id=>typeof id==='string')&&Number.isInteger(q.gear.coins),thrown?'threw: '+thrown:q?JSON.stringify(q.gear.bought):'did not join'); if(q) W.leave('px'); }
// numbers a client reports go out again in everyone's snapshot, rounded (x10, x100): a huge but finite y, face or speed (1e308) became Infinity there, and JSON turned it into null for every other player
{ inbox.pz=[]; inbox.qz=[]; W.join('pz',{name:'Huge',look:{cls:'warrior'},save:{level:3}}); W.join('qz',{name:'Watcher',look:{cls:'warrior'},save:{level:3}}); tick(2);
  W.setPos('pz',[10,-1e308,10,1e308,1e308,-1e308]); W.receive('pz',{t:'atk',k:'basic',face:-1e308}); tick(4);
  const row=[...inbox.qz].reverse().filter(m=>m.t==='snap').map(m=>(m.pl||[]).find(r=>r[0]==='pz')).find(Boolean), pacts=evs.filter(e=>e[0]==='pact'&&e[1]==='pz');
  ok('a huge y, face or speed from a client is bounded: the others get a row of numbers (not null)',!!row&&row.slice(1).every(v=>typeof v==='number'),JSON.stringify(row));
  ok('...and the attack event carries a number too',pacts.length>0&&pacts.every(e=>typeof e[3]==='number'),JSON.stringify(pacts[0]));
  W.leave('pz'); W.leave('qz'); }
// a save is the client's word: coins and exp are capped (an Infinity turns into null on the next save), and an id list holds strings only (an array ["sword1"] is the key 'sword1' to a plain object)
{ inbox.hz=[]; W.receive('hz',JSON.parse('{"t":"hello","name":"Forged","look":{"cls":"warrior"},"save":{"level":3,"exp":1e999,"gear":{"coins":1e999,"inv":[["sword1"],"sword1",{"toString":1},7],"skills":{"owned":[["whirlwind"],"whirlwind"]},"q":{"ready":[["g1"]]}}}}'));
  const h=W.players.get('hz'), g=h&&h.gear;
  ok('a forged save: coins and exp are capped, not Infinity',!!h&&g.coins===x.COINS_MAX&&h.exp===x.EXP_MAX,h&&('coins '+g.coins+', exp '+h.exp));
  ok('...and the inventory and the owned skills hold strings only',!!h&&g.inv.every(v=>typeof v==='string')&&g.skills.owned.every(v=>typeof v==='string')&&g.q.ready.every(v=>typeof v==='string'),h&&JSON.stringify([g.inv.slice(0,4),g.skills.owned.slice(0,4)]));
  W.leave('hz'); }
{ W.join('iv',{name:'Zed\u200b\u202e',look:{cls:'warrior'},save:{level:1}}); const q=W.players.get('iv'); tick(1); W.receive('iv',{t:'chat',text:'a\u202eb\u200bc'}); tick(3);
  ok('zero-width and bidirectional characters are dropped from a name and a chat line (no look-alike of another player, no backwards text)',q.name==='Zed'&&evs.some(e=>e[0]==='chat'&&e[1]==='iv'&&e[3]==='abc'),JSON.stringify(q.name)); W.leave('iv'); }
W.receive('a',{t:'chat',text:'  hello   there '}); tick(3); ok('chat is cleaned and relayed',evs.some(e=>e[0]==='chat'&&e[3]==='hello there'));
W.leave('b'); tick(3); ok('leave is broadcast',evs.some(e=>e[0]==='pleave'&&e[1]==='b'));
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
