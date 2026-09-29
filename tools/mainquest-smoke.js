// Headless test of the main quest (shared/main-quest.js + server/main-quest.js), straight from src/: walks a fresh character through
// steps with talks, herbs, kills, grey monsters, the night, a lore spot, old-save flags, and acts II and III to the end (the Hoarfrost Reach: Rimehold, the Wayfarers' Lodge, frostbloom, the circle home, the Rimeking). Exits 1 on failure.
// Usage: node tools/mainquest-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},['MONS','getH','MQ','MQ_BY_ID','MQ_VER','HERBS','LORE_BY_ID','VIL','VIL2','VIL3','S','mqGreySpot','sanitizeMq','TUN','NODES','rewardKill','PASS','ITEM']);
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
// W6a, W7b, W11b: the Wayfarers' Lodge, the healer's kettle, crafting (professions, tools, herbs, ore, potions)
const gather=(kinds,n,slot,tool)=>{ let got=0; for(let r=0;r<12&&got<n;r++){ for(const nd of x.NODES.filter(nd=>kinds.includes(nd.kind)&&nd.need<=tool)){ if(got>=n) break; at(nd.x,nd.z); W.receive('a',{t:'gather',i:nd.i}); tick(30); got+=1; } x.S.t+=200; tick(25); } };
dev('mq','W6a'); dev('level',4); p.gear.coins=1000; talk('tamsin'); ok('W6a is gated at level 5',M().st===0); dev('level',5); talk('tamsin'); ok('W6a: Tamsin offers Working hands',id()==='W6a'&&M().st===1);
at(x.VIL.x+150,x.VIL.z+150); W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('the lodge only teaches in a village',!p.gear.prof.gathering);
home(); W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('learning Gathering (60 coins) counts for W6a',p.gear.prof.gathering&&p.gear.coins===940&&M().n[0]===1);
{ const nd=x.NODES.find(n=>n.kind==='sunpetal'&&n.need===0); at(nd.x,nd.z); W.receive('a',{t:'gather',i:nd.i}); tick(1); ok('a herb cannot be cut without a sickle',!p.gear.res.sunpetal);
  home(); W.receive('a',{t:'buy',id:'sickle1'}); tick(1); W.receive('a',{t:'equip',id:'sickle1'}); tick(1); ok('buying a sickle does not count as a purchase; wearing it counts for W6a',p.gear.eq.sickle==='sickle1'&&M().n[1]===1); }
gather(['sunpetal','ironroot'],3,'sickle',0); ok('cutting three herbs finishes W6a',M().st===2,'n '+M().n); home(); talk('tamsin'); ok('W6a handed in',id()==='W7'&&M().st===0);
dev('mq','W7b'); dev('level',6); talk('linnea'); ok('W7b: Linnea offers the kettle',id()==='W7b'&&M().st===1);
gather(['sunpetal'],3,'sickle',0); ok('three sunpetal gathered',M().n[0]===3&&p.gear.res.sunpetal>=3);
home(); W.receive('a',{t:'brew',id:'heal1',n:1}); tick(1); ok('brewing a healing potion (3 sunpetal and a few coins) counts',p.gear.pot.heal1===1&&M().n[1]===1);
p.hp=1; W.receive('a',{t:'potion',k:'heal'}); ok('drinking it heals and counts',p.hp>p.maxHp*0.3&&!p.gear.pot.heal1&&M().n[2]===1&&M().st===2); tick(1); home(); talk('linnea'); ok('W7b handed in',id()==='W8');
dev('mq','W11b'); dev('level',9); talk('tomas'); ok('W11b: Tomas offers Made by hand',id()==='W11b'&&M().st===1);
home(); W.receive('a',{t:'learn',id:'mining'}); W.receive('a',{t:'buy',id:'pick1'}); tick(1); W.receive('a',{t:'equip',id:'pick1'}); tick(1); ok('mining learned and a pickaxe worn (W11b)',M().n[0]===1&&M().n[1]===1);
gather(['copper'],10,'pick',0); ok('ten ore mined',M().n[2]===10&&p.gear.res.copper>=10,'copper '+p.gear.res.copper);
home(); W.receive('a',{t:'craft',slot:'sword',tier:0,rar:0}); tick(1); ok('crafting a copper sword at the weaponsmith\'s finishes W11b',p.gear.inv.includes('sword1')&&M().st===2); home(); talk('tomas'); ok('W11b handed in',id()==='W12');
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
// V7b: woodcutting in the vale, and armour from its logs
dev('mq','V7b'); dev('level',18); p.gear.east=2; p.gear.coins=20000; hanami(); talk('haruka'); ok('V7b: Haruka offers Lacquer and cherrywood',id()==='V7b'&&M().st===1);
W.receive('a',{t:'learn',id:'woodcutting'}); W.receive('a',{t:'buy',id:'axe2'}); tick(1); W.receive('a',{t:'equip',id:'axe2'}); tick(1); ok('woodcutting learned; an iron axe (tier 2) is not enough for the part that asks for level 15',M().n[0]===1&&M().n[1]===0);
W.receive('a',{t:'buy',id:'axe4'}); tick(1); W.receive('a',{t:'equip',id:'axe4'}); tick(1); ok('a Sunstone axe (level 15) counts',M().n[1]===1);
gather(['sunwood'],12,'axe',3); ok('twelve logs chopped in the vale (sunwood needs a tier-4 axe)',M().n[2]===12&&p.gear.res.sunwood>=12,'sunwood '+p.gear.res.sunwood);
hanami(); W.receive('a',{t:'craft',slot:'helmet',tier:3,rar:0}); tick(1); ok('crafting a Sunforged helm at Haruka\'s finishes V7b',p.gear.inv.includes('helmet4')&&M().st===2); talk('haruka'); ok('V7b handed in',id()==='V8');
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
// the Wayfarers' Lodge: learning costs coins and needs a village; F4 also wants a sickle of tier 5 (Hagane, level 20)
p.gear.prof={}; p.gear.eq.sickle=null; M().n[0]=0; M().n[1]=0;
p.gear.coins=10; W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('a profession costs coins',!p.gear.prof.gathering&&M().st===1);
p.gear.coins=5000; at(x.VIL.x+150,x.VIL.z+150); W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('the lodge is in a village',!p.gear.prof.gathering);
rime(); W.receive('a',{t:'learn',id:'potions'}); tick(1); ok('potion use is not a profession (brewing is done at the healers)',!p.gear.prof.potions);
W.receive('a',{t:'learn',id:'gathering'}); tick(1); ok('gathering learned for 60 coins; F4 still wants the sickle',p.gear.prof.gathering&&p.gear.coins===4940&&M().st===1&&M().n[0]===1&&M().n[1]===0);
W.receive('a',{t:'buy',id:'sickle1'}); W.receive('a',{t:'equip',id:'sickle1'}); tick(1); ok('a copper sickle is not enough for F4',M().n[1]===0);
W.receive('a',{t:'buy',id:'sickle5'}); tick(1); W.receive('a',{t:'equip',id:'sickle5'}); tick(1); ok('a Hagane sickle (level 20): F4 is ready to hand in',p.gear.eq.sickle==='sickle5'&&M().st===2);
talk('gudrun'); ok('F4 handed in to Gudrun; F5 starts in the same talk',id()==='F5'&&M().st===1);
// F5: frostbloom is gathered from nodes (profession, distance, once until it grows back), snow boars are hunted
{ const bl=x.NODES.filter(n=>n.kind==='frostbloom'&&n.zone==='h22'); W.receive('a',{t:'gather',i:bl[0].i}); tick(1); ok('a node too far away gives nothing',M().n[0]===0);
  let got=0; for(const n of bl.slice(0,3)){ at(n.x,n.z+1); W.receive('a',{t:'gather',i:n.i}); tick(30); if(p.gear.res.frostbloom>got) got=p.gear.res.frostbloom; }
  ok('three frostbloom gathered: they are kept in gear.res and count for F5',M().n[0]===3&&p.gear.res.frostbloom>=3&&p.gear.prof.gathering.xp>=6);
  at(bl[0].x,bl[0].z+1); W.receive('a',{t:'gather',i:bl[0].i}); tick(1); ok('a node that was taken gives nothing until it grows back',p.gear.res.frostbloom===got); }
{ let k5=0; for(const m of x.MONS.filter(m=>m.def.id==='snowboar'&&!m.dead).slice(0,5)){ m.hp=Math.min(m.hp,20); if(kill(m)) k5++; } tick(2); ok('five snow boars: F5 is ready to hand in',k5===5&&M().st===2); }
rime(); talk('sigrun'); ok('F5 handed in; F6 waits for level 23',id()==='F6'&&M().st===0); dev('level',23); talk('sigrun'); ok('F6 offered',M().st===1);
p.gear.coins=500; W.receive('a',{t:'brew',id:'heal3',n:1}); tick(1); ok('F6: brewing the frostbloom tea (a Greater Healing Potion) at Ylva\'s, then the way home waits',p.gear.pot.heal3===1&&M().n[0]===1&&M().st===1);
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
{ const old=(id,st)=>{ const o=x.sanitizeMq({s:OLD_INDEX[id],st:st||1,n:[0,0,0,0]}); return x.MQ[o.s].id; }, OLD_INDEX={W6:5,W7:6,W11:10,W12:11,V7:22,V8:23,F4:30};
  ok('saves from before the profession steps keep their place (the step index moves up by the steps inserted before it)',old('W6')==='W6'&&old('W7')==='W7'&&old('W12')==='W12'&&old('V8')==='V8'&&old('F4')==='F4');
  ok('a save that already has a version is not moved',x.sanitizeMq({s:x.MQ_BY_ID.V8.i,st:1,n:[0],ver:x.MQ_VER}).s===x.MQ_BY_ID.V8.i&&x.sanitizeMq({s:36,st:0,ver:1}).s===x.MQ.length); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
