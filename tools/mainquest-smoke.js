// Headless test of the main quest (shared/main-quest.js + server/main-quest.js), straight from src/: walks a fresh character through
// steps with talks, herbs, kills, grey monsters, the night, a lore spot, old-save flags and the end of act II. Exits 1 on failure.
// Usage: node tools/mainquest-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},['MONS','getH','MQ','MQ_BY_ID','HERBS','LORE_BY_ID','VIL','VIL2','S','mqGreySpot','sanitizeMq','TUN']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const at=(xx,zz)=>W.setPos('a',[xx,x.getH(xx,zz),zz,0,0,0]);
const home=()=>at(x.VIL.x+3,x.VIL.z+3), hanami=()=>at(x.VIL2.x+3,x.VIL2.z+3);
const talk=id=>{ W.receive('a',{t:'mq',a:'talk',id}); tick(1); };
const kill=m=>{ for(let i=0;i<600&&!m.dead;i++){ W.setPos('a',[m.x+1.5,x.getH(m.x,m.z),m.z,Math.PI/2,0,0]); W.receive('a',{t:'atk',k:'basic',tg:m.id,face:Math.PI/2}); tick(1); } return m.dead; };
const dev=(cmd,v)=>{ W.receive('a',{t:'dev',cmd,v}); tick(1); };
W.join('a',{name:'Quester',look:{cls:'warrior'},save:{level:1}}); tick(1);
const p=W.players.get('a'), M=()=>p.gear.mq, id=()=>x.MQ[M().s]&&x.MQ[M().s].id;
ok('a new character starts at W1, already under way',id()==='W1'&&M().st===1);
talk('linnea'); ok('a part that waits for another does not move',M().n[1]===0&&M().st===1);
at(900,0); talk('wren'); ok('talking from outside the village does nothing',M().n[0]===0);
home(); talk('wren'); talk('linnea');
ok('W1 hands in to Linnea, and her next step (W2) starts in the same talk',id()==='W2'&&M().st===1&&p.exp>0,'exp '+p.exp);
for(let i=0;i<x.HERBS.length;i++){ W.receive('a',{t:'mq',a:'pick',i}); } tick(1);
ok('herbs far away cannot be picked',M().n[0]===0);
x.HERBS.forEach(([hx,hz],i)=>{ at(hx,hz); W.receive('a',{t:'mq',a:'pick',i}); W.receive('a',{t:'mq',a:'pick',i}); }); tick(1);
ok('five heartleaf picked, each once',M().n[0]===5&&M().h===31);
let k=0; for(const m of x.MONS.filter(m=>m.def.id==='slime'&&!m.dead).slice(0,5)) if(kill(m)) k++; tick(2);
ok('five slimes: W2 is ready to hand in',k===5&&M().st===2);
home(); talk('linnea'); ok('W2 handed in; W3 waits for Aldric',id()==='W3'&&M().st===0);
dev('level',1); talk('aldric'); ok('W3 is gated at level 2',M().st===0);
dev('level',2); talk('aldric'); W.receive('a',{t:'cls',cls:'archer'}); tick(1);
ok('changing class counts',M().st===2); talk('aldric'); ok('W3 done',id()==='W4');
// the grey monsters of W9
dev('mq','W9'); dev('level',9); talk('bram'); ok('W9 accepted',id()==='W9'&&M().st===1);
const [gx,gz]=x.mqGreySpot(7); at(gx,gz); tick(12);
let grey=x.MONS.filter(m=>m.owner==='a'&&!m.dead&&!m.remove);
ok('grey slimes spawn for you at the Bog',grey.length===3&&grey.every(m=>m.def.id==='greybog'),grey.length+' spawned');
for(const m of grey){ m.hp=Math.min(m.hp,20); kill(m); } tick(2);   // (weakened: this checks the quest, not the fight) ok('three grey slimes: W9 ready',M().st===2);
home(); tick(2); talk('bram'); ok('W9 handed in',id()==='W10');
// the night and a lore spot (W13)
dev('mq','W13'); dev('level',11); x.S.day=0.3; talk('oskar'); talk('oskar');
ok('Oskar\'s tale waits for the night',M().st===1&&M().n[0]===0);
x.S.day=0.7; talk('oskar'); ok('after dark it counts',M().n[0]===1);
const L=x.LORE_BY_ID.carvings; W.receive('a',{t:'mq',a:'read',id:'carvings'}); tick(1); ok('the carvings must be read in person',M().n[1]===0);
at(L.x,L.z); W.receive('a',{t:'mq',a:'read',id:'carvings'}); tick(1); ok('reading the carvings',M().st===2);
home(); talk('oskar'); ok('W13 handed in',id()==='W14');
// an old save that already beat the Rootwarden
dev('mq','W17'); dev('level',15); p.gear.east=1; talk('bram'); tick(12);
ok('W17 finishes at once for a character who already opened the tunnel',M().st===2); talk('bram'); tick(12);
ok('W18 starts by itself after W17',id()==='W18'&&M().st===1);
// the end of act II
dev('mq','V11'); dev('level',20); p.gear.east=2; hanami(); talk('kaede'); talk('chiyo'); ok('V11: Kaede, then Chiyo',M().st===2);
home(); talk('wren'); ok('the story ends after V11 (act II ends at Akaoni)',M().s===x.MQ.length);
// saves
const bad=x.sanitizeMq({s:999,st:7,n:['x',-3],h:'q'}), bad2=x.sanitizeMq({s:x.MQ_BY_ID.W2.i,st:2,n:[1,0]});
ok('a broken save is cleaned',bad.s===x.MQ.length&&bad.st===0&&Array.isArray(bad.n)&&bad2.st===1&&x.sanitizeMq(null).s===0);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
