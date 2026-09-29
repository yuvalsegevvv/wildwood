// Headless test of the main quest (shared/main-quest.js + server/main-quest.js), straight from src/: walks a fresh character through
// steps with talks, herbs, kills, grey monsters, the night, a lore spot, old-save flags, and acts II and III to the end (the Hoarfrost Reach: Rimehold, the Wayfarers' Lodge, frostbloom, the circle home, the Rimeking). Exits 1 on failure.
// Usage: node tools/mainquest-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},['MONS','getH','MQ','MQ_BY_ID','HERBS','LORE_BY_ID','VIL','VIL2','VIL3','S','mqGreySpot','sanitizeMq','TUN','NODES','rewardKill','PASS']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const at=(xx,zz)=>W.setPos('a',[xx,x.getH(xx,zz),zz,0,0,0]);
const home=()=>at(x.VIL.x+3,x.VIL.z+3), hanami=()=>at(x.VIL2.x+3,x.VIL2.z+3), rime=()=>at(x.VIL3.x+3,x.VIL3.z+3);
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
// act II ends where act III begins: V11 handed in to Wren, and F1 (walk to Rimehold) starts by itself
home(); talk('wren'); ok('V11 handed in: F1 (the Hoarfrost Reach) starts by itself',id()==='F1'&&M().st===1);
// act III: the Hoarfrost Reach. The ice wall is open for anyone who got past Akaoni; the walk into Rimehold attunes its circle
p.gear.north=0; rime(); talk('hallvard'); ok('F1 cannot be handed in before you have walked into Rimehold',M().st===1);
p.gear.north=1; at(x.VIL3.x+3,x.VIL3.z+3); tick(12);
ok('walking into Rimehold attunes its circle (gear.north 2) and finishes F1',p.gear.north===2&&M().st===2); talk('hallvard');
ok('F1 handed in to Hallvard; F2 waits for level 21',id()==='F2'&&M().st===0); dev('level',21); talk('hallvard'); ok('F2 offered',M().st===1);
for(const n of ['ragna','bjorn','ulfhild','thorvald']) talk(n); ok('F2: the four hearth-folk met',M().st===2); talk('hallvard'); ok('F2 done: F3 waits for Sigrun',id()==='F3'&&M().st===0);
x.S.day=0.3; talk('sigrun'); talk('sigrun'); ok('Sigrun\'s saga waits for the night',M().st===1&&M().n[0]===0);
x.S.day=0.7; talk('sigrun'); ok('after dark it counts',M().n[0]===1);
{ const R=x.LORE_BY_ID.runes; W.receive('a',{t:'mq',a:'read',id:'runes'}); tick(1); ok('the rune stones must be read in person',M().n[1]===0); at(R.x,R.z); W.receive('a',{t:'mq',a:'read',id:'runes'}); tick(1); ok('reading the rune stones',M().st===2); }
rime(); talk('sigrun'); ok('F3 handed in; F4 waits for level 22',id()==='F4'&&M().st===0); dev('level',22); talk('sigrun'); ok('F4 offered',M().st===1);
// the Wayfarers' Lodge: learning costs coins, and only in Rimehold
p.gear.coins=10; W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('a profession costs coins',!p.gear.prof.gathering&&M().st===1);
p.gear.coins=500; at(x.VIL.x+3,x.VIL.z+3); W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('the Lodge is only in Rimehold',!p.gear.prof.gathering);
rime(); W.receive('a',{t:'learn',id:'potions'}); tick(1); ok('potion use cannot be learned yet',!p.gear.prof.potions);
W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('gathering learned for 150 coins: F4 is ready to hand in',p.gear.prof.gathering&&p.gear.coins===350&&M().st===2);
talk('gudrun'); ok('F4 handed in to Gudrun; F5 starts in the same talk',id()==='F5'&&M().st===1);
// F5: frostbloom is gathered from nodes (profession, distance, once until it grows back), snow boars are hunted
{ const bl=x.NODES.filter(n=>n.kind==='frostbloom'&&n.zone==='h22'); W.receive('a',{t:'gather',i:bl[0].i}); tick(1); ok('a node too far away gives nothing',M().n[0]===0);
  let got=0; for(const n of bl.slice(0,3)){ at(n.x,n.z+1); W.receive('a',{t:'gather',i:n.i}); tick(30); if(p.gear.res.frostbloom>got) got=p.gear.res.frostbloom; }
  ok('three frostbloom gathered: they are kept in gear.res and count for F5',M().n[0]===3&&p.gear.res.frostbloom>=3&&p.gear.prof.gathering.xp>=6);
  at(bl[0].x,bl[0].z+1); W.receive('a',{t:'gather',i:bl[0].i}); tick(1); ok('a node that was taken gives nothing until it grows back',p.gear.res.frostbloom===got); }
{ let k5=0; for(const m of x.MONS.filter(m=>m.def.id==='snowboar'&&!m.dead).slice(0,5)){ m.hp=Math.min(m.hp,20); if(kill(m)) k5++; } tick(2); ok('five snow boars: F5 is ready to hand in',k5===5&&M().st===2); }
rime(); talk('sigrun'); ok('F5 handed in; F6 waits for level 23',id()==='F6'&&M().st===0); dev('level',23); talk('sigrun'); ok('F6 offered',M().st===1);
talk('sigrun'); ok('F6: Sigrun gives the tea, then the way home waits',M().n[0]===1&&M().st===1);
// the teleport circle: a destination is chosen (warp{to}); each village's circle wakes when you have walked into it
p.gear.east=2; at(x.VIL3.tele.x,x.VIL3.tele.z); W.receive('a',{t:'warp',to:'rimehold'}); tick(3); ok('choosing the circle you stand on does nothing',Math.hypot(p.x-x.VIL3.tele.x,p.z-x.VIL3.tele.z)<3.5);
W.receive('a',{t:'warp',to:'nowhere'}); tick(3); ok('the default destination of Rimehold\'s circle is home',Math.hypot(p.x-x.VIL.x,p.z-x.VIL.z)<x.VIL.r&&M().n[1]===1);
talk('wren'); ok('F6 handed in to Wren: F7 waits for level 24',id()==='F7'&&M().st===0);
at(x.VIL.tele.x,x.VIL.tele.z); p.warpT=-99; W.receive('a',{t:'warp',to:'hanami'}); tick(3); ok('from home the circle can choose Hanami',Math.hypot(p.x-x.VIL2.x,p.z-x.VIL2.z)<x.VIL2.r);
p.warpT=-99; at(x.VIL2.tele.x,x.VIL2.tele.z); p.gear.north=1; W.receive('a',{t:'warp',to:'rimehold'}); tick(3); ok('a circle you have not walked into (north 1) will not take you there',Math.hypot(p.x-x.VIL2.tele.x,p.z-x.VIL2.tele.z)<3); p.gear.north=2;
p.warpT=-99; W.receive('a',{t:'warp',to:'rimehold'}); tick(3); ok('and once you have, it does',Math.hypot(p.x-x.VIL3.x,p.z-x.VIL3.z)<x.VIL3.r);
// F7: a plate in the ice, plates from reavers, Odran at Rimehold
dev('level',24); talk('hallvard'); ok('F7 offered',M().st===1);
{ const L7=x.LORE_BY_ID.hullplate; at(L7.x,L7.z); W.receive('a',{t:'mq',a:'read',id:'hullplate'}); tick(1); ok('F7: the grey plate read',M().n[0]===1);
  let tries=0; for(const m of x.MONS.filter(m=>m.def.id==='reaver'&&!m.dead)){ if(M().st===2||tries++>40) break; m.hp=Math.min(m.hp,20); kill(m); } tick(2);
  ok('F7: two plates from the Frost Reavers (a 45% drop)',M().st===2,'after '+tries+' reavers'); }
rime(); talk('odran3'); ok('F7 handed in to Odran at Rimehold; F8 waits for level 25',id()==='F8'&&M().st===0);
// F8: the Rimeking
dev('level',25); talk('hallvard'); ok('F8 offered',M().st===1);
{ const ym=x.MONS.find(m=>m.def.id==='ymrik'); x.rewardKill(p,ym); tick(2); ok('F8: killing Ymrik counts for the boss part',M().st===2); }
talk('sigrun'); ok('F8 handed in to Sigrun; F9 starts in the same talk',id()==='F9'&&M().st===1);
talk('sigrun'); ok('F9: the last verse',M().st===2); talk('hallvard'); ok('the story ends after F9 (act III ends at the Rimeking)',M().s===x.MQ.length);
// saves
const bad=x.sanitizeMq({s:999,st:7,n:['x',-3],h:'q'}), bad2=x.sanitizeMq({s:x.MQ_BY_ID.W2.i,st:2,n:[1,0]});
ok('a broken save is cleaned',bad.s===x.MQ.length&&bad.st===0&&Array.isArray(bad.n)&&bad2.st===1&&x.sanitizeMq(null).s===0);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
