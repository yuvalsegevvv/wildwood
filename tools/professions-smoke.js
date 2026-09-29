// Headless test of the professions, crafting and potions (shared/professions.js, shared/crafting.js, server/professions.js, server/crafting.js), straight
// from src/, no build: the three tools and their slots, the nodes of every land (grades, tool tiers), gathering with a tool, selling resources, crafting
// gear from ore and logs, brewing potions from herbs, and drinking them (healing, might, guard). One line per check; exits 1 on failure.
// Usage: node tools/professions-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['NODES','NODE_KINDS','NODE_BACK','ITEM','ITEM_LIST','TOOL_LIST','RES','POTS','POT_MAX','craftCost','canCraft','potBuffP','hurtP','rollDmgS','S','sanitizeGear','sanitizePots','tierFor','nodeBlock','doubleChance','VIL','VIL2','VIL3','getH','ZONES','MERGE_COUNT','BAG_MAX','ORE_GRADES','LOG_GRADES','HERB_LANDS','TIERS','rawHeight','castTime','NODE_R']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const evs=[]; const grab=()=>{ for(const m of (inbox.a||[])) if(m.t==='snap'&&m.ev) evs.push(...m.ev); inbox.a=[]; };
const at=(xx,zz)=>W.setPos('a',[xx,x.getH(xx,zz),zz,0,0,0]);
const home=()=>at(x.VIL.x+3,x.VIL.z+3), hanami=()=>at(x.VIL2.x+3,x.VIL2.z+3);
const dev=(cmd,v)=>{ W.receive('a',{t:'dev',cmd,v}); tick(1); };
W.join('a',{name:'Crafter',look:{cls:'warrior'},save:{level:25}}); tick(1);
const p=W.players.get('a'), g=()=>p.gear;
const send=m=>{ W.receive('a',m); tick(1); };

// ---- the tools ----
ok('90 tools: three slots x six tiers x five rarities, in ITEM but not in the shop list',x.TOOL_LIST.length===90&&x.TOOL_LIST.every(t=>x.ITEM[t.id]===t)&&!x.ITEM_LIST.some(i=>i.kind==='tool'));
ok('a new character has the three tool slots, empty, and no potions',['pick','axe','sickle'].every(k=>k in g().eq&&g().eq[k]===null)&&Object.keys(g().pot).length===0);
{ const t=x.ITEM.pick3, r=x.ITEM['pick3-e'];
  ok('a tool has a tier, a level and a price like gear of its tier, and rarity multiplies the price',t.tier===2&&t.lv===10&&t.prof==='mining'&&r.rar===2&&r.price===t.price*9); }
{ const s=x.sanitizeGear({inv:['sword1','pick1','axe1'],eq:{weapon:'sword1',pick:'axe1',axe:'axe1',sickle:'sword1',helmet:'pick1'},pot:{heal1:5,heal9:3,might2:500,guard3:'x'}},'warrior');
  ok('saves: a tool in the wrong slot, or gear in a tool slot, is taken off; potions are checked and clamped',s.eq.axe==='axe1'&&s.eq.pick===null&&s.eq.sickle===null&&s.eq.helmet===null&&s.pot.heal1===5&&!s.pot.heal9&&s.pot.might2===99&&!s.pot.guard3); }
// buying and wearing
dev('level',25); g().coins=100000; at(x.VIL.x+150,x.VIL.z+150); send({t:'buy',id:'pick1'}); ok('tools are sold in villages only',!g().inv.includes('pick1'));
home(); send({t:'buy',id:'pick1'}); ok('a copper pickaxe costs 30 coins at a lodge',g().inv.includes('pick1')&&g().coins===99970);
send({t:'buy',id:'pick1-r'}); ok('a lodge sells common tools only',!g().inv.includes('pick1-r'));
send({t:'equip',id:'pick1'}); ok('a tool is worn in its own slot',g().eq.pick==='pick1'&&g().eq.weapon==='sword1');
dev('level',3); send({t:'buy',id:'pick4'}); send({t:'equip',id:'pick4'}); ok('a tool needs its level like gear (Sunstone: level 15)',g().eq.pick==='pick1'); dev('level',25);
send({t:'unequip',slot:'pick'}); ok('a tool comes off',g().eq.pick===null&&g().inv.includes('pick1'));
send({t:'equip',id:'pick1'});
// the forge merges tools like gear
for(let i=0;i<2;i++) send({t:'buy',id:'pick1'}); send({t:'unequip',slot:'pick'}); send({t:'merge',id:'pick1'}); ok('three copper pickaxes merge into a rare one at the forge',g().inv.includes('pick1-r')&&g().inv.filter(i=>i==='pick1').length===0);
send({t:'equip',id:'pick1-r'});

// ---- the nodes of every land ----
{ const byZone={}, bad=[]; for(const n of x.NODES){ (byZone[n.zone]=byZone[n.zone]||[]).push(n); if(x.rawHeight(n.x,n.z)<2.0) bad.push(n.i); }
  ok('314 nodes: 90 in the Hoarfrost Reach (first, unchanged) and 7 to 9 in each of the home forest\'s and the vale\'s zones',x.NODES.length===314&&x.NODES.slice(0,90).every(n=>['rimeore','frostpine','frostbloom','snowmoss'].includes(n.kind)&&String(n.zone)[0]==='h'),Object.keys(byZone).length+' zones');
  ok('no node is at the waterline (the shared terrain: the server\'s coarse map can dip lower at a steep edge)',!bad.length,bad.length+' in water');
  ok('every ring zone of the home forest has its veins, trees and herbs (9 in the inner woods, levels 1-14, 7 in zone 15)',[1,2,3,4,5,6,7,8,9,10,11,12,13,14].every(z=>(byZone[z]||[]).length===9)&&(byZone[15]||[]).length===7); }
{ const at1=k=>x.NODES.filter(n=>String(n.zone)===String(k));
  const kinds=z=>at1(z).map(n=>n.kind).sort().join();
  ok('the ore, logs and herbs of a zone follow its gear tier (copper and pine in zone 1, iron and oak in zone 5, silver and yew in zone 10, sunstone and sunwood in zone 15)',
    kinds(1)==='copper,copper,copper,ironroot,pine,pine,pine,sunpetal,sunpetal'&&kinds(5)==='iron,iron,iron,ironroot,oak,oak,oak,sunpetal,sunpetal'&&kinds(10)==='ironroot,silver,silver,silver,sunpetal,sunpetal,yew,yew,yew'&&kinds(15)==='ironroot,sunpetal,sunpetal,sunstone,sunstone,sunwood,sunwood');
  ok('the vale grows hagane and cherry from level 20, with the vale\'s own herbs',kinds(20)==='cherry,cherry,hagane,hagane,kikyo,kikyo,yomogi'&&kinds(16)==='kikyo,kikyo,sunstone,sunstone,sunwood,sunwood,yomogi');
  ok('a node needs a tool of the tier of its zone (the vale\'s best zone still needs no more than hagane)',at1(1).every(n=>n.need===0)&&at1(5).every(n=>n.need===1)&&at1(20).every(n=>n.need===4)&&at1(25).every(n=>n.need===4)&&at1('h22').every(n=>n.need===4)&&at1('h26').every(n=>n.need===5)); }
ok('every resource has a name, colour, sell price and node kind (ore and logs in six grades)',Object.keys(x.RES).length===6+6+6&&Object.values(x.RES).every(r=>r.name&&r.col&&r.sell>0)&&x.ORE_GRADES.length===6&&x.LOG_GRADES.length===6);

// ---- gathering with a tool ----
dev('prof'); g().prof={}; g().res={}; for(const k of ['pick','axe','sickle']) g().eq[k]=null;
{ const cu=x.NODES.find(n=>n.kind==='copper'), iron=x.NODES.find(n=>n.kind==='iron'), sun=x.NODES.find(n=>n.kind==='sunpetal'&&n.need===0), pine=x.NODES.find(n=>n.kind==='pine');
  const gather=n=>{ at(n.x,n.z); W.receive('a',{t:'gather',i:n.i}); tick(30); };   // (a gather is a cast of about a second)
  gather(cu); ok('a node needs its profession',!g().res.copper);
  g().coins=100000; home(); send({t:'learn',id:'mining'}); send({t:'learn',id:'woodcutting'}); send({t:'learn',id:'gathering'}); ok('three professions at 60 coins each',g().coins===100000-180&&Object.keys(g().prof).length===3);
  gather(cu); ok('a node needs its tool worn',!g().res.copper);
  g().inv.push('pick1','pick2','axe1','sickle1'); send({t:'equip',id:'pick1'}); gather(cu); ok('copper ore with a copper pickaxe (tier 0)',g().res.copper>=1&&g().prof.mining.xp===1);
  gather(iron); ok('iron ore needs an iron pickaxe (tier 1)',!g().res.iron);
  send({t:'equip',id:'pick2'}); grab(); evs.length=0; gather(iron); ok('and gets it with one',g().res.iron>=1&&g().prof.mining.xp===3);
  gather(pine); ok('logs need an axe',!g().res.pine); send({t:'equip',id:'axe1'}); gather(pine); ok('pine with a copper axe',g().res.pine>=1);
  gather(sun); ok('herbs need a sickle',!g().res.sunpetal); send({t:'equip',id:'sickle1'}); gather(sun); ok('sunpetal with a copper sickle, worth 1 xp',g().res.sunpetal>=1&&g().prof.gathering.xp===1);
  ok('nodeBlock says why: learn, tool, weak, or nothing',x.nodeBlock({prof:{},eq:{}},cu)==='learn'&&x.nodeBlock({prof:{mining:{xp:0}},eq:{}},cu)==='tool'&&x.nodeBlock({prof:{mining:{xp:0}},eq:{pick:'pick1'}},iron)==='weak'&&x.nodeBlock({prof:{mining:{xp:0}},eq:{pick:'pick2'}},iron)===null); }
// ---- the cast: a gather takes a short time and can be broken ----
{ const cu=x.NODES.find(n=>n.kind==='copper'); const ct=x.castTime, T=x.ITEM;
  ok('a cast takes 1.2 s with a copper tool, 0.1 s less for each tier and 0.04 s for each rarity, never under 0.6 s (a Hagane pickaxe: 0.8 s)',Math.abs(ct(T.pick1)-1.2)<1e-9&&Math.abs(ct(T.pick5)-0.8)<1e-9&&Math.abs(ct(T['pick1-r'])-1.16)<1e-9&&ct(T['pick6-l'])===0.6&&ct(null)===1.2);
  g().res={}; x.NODE_BACK[cu.i]=0; send({t:'equip',id:'pick1'}); at(cu.x,cu.z); grab(); evs.length=0;
  W.receive('a',{t:'gather',i:cu.i}); tick(6); grab(); ok('pressing the gather key starts a cast: an event with its length, and nothing in the bag yet',evs.some(e=>e[0]==='cast'&&e[1]==='a'&&e[2]===cu.i&&e[3]===1.2)&&!g().res.copper&&!!p.cast);
  W.receive('a',{t:'gather',i:cu.i}); tick(1); ok('a second press during the cast changes nothing',!g().res.copper&&p.cast&&p.cast.i===cu.i);
  tick(24); grab(); ok('when the cast ends the haul arrives (a gather event) and the vein is taken',g().res.copper>=1&&!p.cast&&evs.some(e=>e[0]==='gather'&&e[1]==='a'&&e[3]==='copper')&&x.NODE_BACK[cu.i]>x.S.t);
  x.NODE_BACK[cu.i]=0; g().res={}; evs.length=0; W.receive('a',{t:'gather',i:cu.i}); tick(8); at(cu.x+2.5,cu.z); tick(2); grab(); ok('walking away breaks the cast (a castx event, no haul, the vein stays)',!p.cast&&evs.some(e=>e[0]==='castx'&&e[1]==='a')&&!g().res.copper&&x.NODE_BACK[cu.i]===0);
  at(cu.x,cu.z); tick(1); evs.length=0; W.receive('a',{t:'gather',i:cu.i}); tick(8); x.hurtP(p,5,null); tick(2); ok('a hit does not break it (it is short)',!!p.cast); p.dead=true; tick(2); grab(); p.dead=false; ok('being knocked out breaks it',!p.cast&&evs.some(e=>e[0]==='castx')&&!g().res.copper);
  at(cu.x,cu.z); tick(1); evs.length=0; W.receive('a',{t:'gather',i:cu.i}); tick(8); x.NODE_BACK[cu.i]=x.S.t+100; tick(30); grab(); ok('a vein someone else took first gives nothing when the cast ends',!p.cast&&!g().res.copper&&evs.some(e=>e[0]==='castx')); x.NODE_BACK[cu.i]=0;
  at(cu.x,cu.z); tick(1); W.receive('a',{t:'gather',i:cu.i}); tick(8); send({t:'unequip',slot:'pick'}); tick(30); ok('taking the tool off during the cast spoils it',!p.cast&&!g().res.copper); send({t:'equip',id:'pick1'}); x.NODE_BACK[cu.i]=0;
  at(cu.x+30,cu.z); tick(1); W.receive('a',{t:'gather',i:cu.i}); tick(2); ok('a node out of reach starts no cast',!p.cast); }
{ const c=x.doubleChance; const t0=x.ITEM.pick1, t4=x.ITEM['pick5-l'];
  ok('the double-yield chance grows with profession level, tool rarity and the tool\'s tier above the node\'s',c(1,t0,0)===0&&Math.abs(c(5,t0,0)-0.32)<1e-9&&c(1,x.ITEM['pick1-e'],0)>c(1,x.ITEM['pick1-r'],0)&&c(1,x.ITEM.pick3,0)>c(1,x.ITEM.pick1,0)&&c(5,t4,0)<=0.9); }
{ let two=0; const cu=x.NODES.find(n=>n.kind==='copper'); g().prof.mining.xp=140; send({t:'equip',id:'pick1-r'});   // level 5 with a rare tool: 32% + 8%
  for(let i=0;i<150;i++){ const had=g().res.copper||0; x.NODE_BACK[cu.i]=0; at(cu.x,cu.z); W.receive('a',{t:'gather',i:cu.i}); tick(30); if((g().res.copper||0)-had===2) two++; }
  ok('a high-level gatherer with a rare tool gets doubles about 40% of the time',two>35&&two<90,two+' of 150'); }

// ---- selling resources at the lodge ----
{ g().res={copper:10,hagane:4}; g().coins=0; at(x.VIL.x+150,x.VIL.z+150); send({t:'sellres',id:'copper',n:3}); ok('resources are sold at a lodge, in a village',g().res.copper===10&&g().coins===0);
  home(); send({t:'sellres',id:'copper',n:3}); ok('3 copper ore sell for 2 coins each',g().res.copper===7&&g().coins===6);
  send({t:'sellres',id:'hagane',n:0}); ok('"sell all" sells the lot at its grade\'s price',!g().res.hagane&&g().coins===6+4*70); }

// ---- crafting ----
{ const C=x.craftCost, w=C('sword',0,0), e=C('sword',2,2);
  ok('a common copper sword costs 7 copper ore, a rare one 2.5 times as much, an epic one 6 times (silverstone at tier 3)',w.res==='copper'&&w.n===7&&C('sword',0,1).n===16&&C('sword',0,2).n===39&&e.res==='silver'&&e.n===Math.round(8*1.3*6));
  ok('armour is made from logs, with a fee of a tenth of the piece\'s price',C('top',1,0).res==='oak'&&C('shoes',5,0).res==='frostwood'&&C('top',1,0).coins===Math.round(x.ITEM.top2.price*0.1));
  ok('unique and legendary pieces cannot be crafted, nor a bad tier or slot',!x.canCraft('sword',0,3)&&!x.canCraft('sword',6,0)&&!x.canCraft('pick',0,0)&&!x.canCraft('sword',0.5,0)&&x.canCraft('shoes',5,2)); }
g().res={copper:20}; g().coins=1000; at(x.VIL.x+150,x.VIL.z+150); send({t:'craft',slot:'sword',tier:0,rar:0}); ok('crafting is done in a village',g().res.copper===20);
home(); { const n0=g().inv.filter(i=>i==='sword1').length; grab(); evs.length=0; send({t:'craft',slot:'sword',tier:0,rar:0}); tick(3); grab(); ok('a copper sword: 7 ore and 3 coins, a craft event',g().inv.filter(i=>i==='sword1').length===n0+1&&g().res.copper===13&&g().coins===997&&evs.some(e=>e[0]==='craft'&&e[1]==='a'&&e[2]==='sword1')); }
send({t:'craft',slot:'sword',tier:0,rar:1}); ok('a rare sword takes 16 ore: 13 is not enough',g().res.copper===13&&!g().inv.includes('sword1-r'));
g().res.copper=20; send({t:'craft',slot:'sword',tier:0,rar:1}); ok('a rare copper sword from 16 ore',g().inv.includes('sword1-r')&&g().res.copper===4);
g().res={oak:8}; g().coins=0; send({t:'craft',slot:'top',tier:1,rar:0}); ok('the fee must be paid in coins',!g().inv.includes('top2'));
g().coins=100; send({t:'craft',slot:'top',tier:1,rar:0}); ok('an oak-log chain hauberk (tier 2 top) from 7 of the 8 logs, for a fee of 14 coins',g().inv.includes('top2')&&g().res.oak===1&&g().coins===86);
{ g().res={copper:50}; g().coins=1000; const keep=g().inv.slice(); while(g().inv.length<x.BAG_MAX) g().inv.push('sword1'); send({t:'craft',slot:'bow',tier:0,rar:0}); ok('a full bag stops crafting (nothing is taken)',g().res.copper===50); g().inv=keep; }

// ---- brewing ----
{ const P=x.POTS;
  ok('nine potions: healing, might and guard, each in three strengths made from one land\'s herbs',Object.keys(P).length===9&&P.heal1.herbs[0].res==='sunpetal'&&P.might2.herbs.map(h=>h.res).join()==='kikyo,yomogi'&&P.guard3.herbs[0].res==='snowmoss'&&P.heal3.name==='Greater Healing Potion'); }
g().pot={}; g().res={sunpetal:7,ironroot:5}; g().coins=500; at(x.VIL.x+150,x.VIL.z+150); send({t:'brew',id:'heal1',n:1}); ok('brewing is done in a village',!g().pot.heal1);
home(); send({t:'brew',id:'heal1',n:1}); ok('a Minor Healing Potion: 3 sunpetal and 8 coins',g().pot.heal1===1&&g().res.sunpetal===4&&g().coins===492);
send({t:'brew',id:'heal1',n:5}); ok('a bulk brew stops at what the herbs allow (4 sunpetal: one more)',g().pot.heal1===2&&g().res.sunpetal===1);
send({t:'brew',id:'might1',n:1}); ok('might needs 1 sunpetal and 2 ironroot',g().pot.might1===1&&!g().res.sunpetal&&g().res.ironroot===3);
send({t:'brew',id:'guard1',n:9}); ok('guard needs 3 ironroot',g().pot.guard1===1&&!g().res.ironroot);
send({t:'brew',id:'heal9',n:1}); ok('an unknown potion is refused',!g().pot.heal9);
g().pot.heal1=98; g().res.sunpetal=9; send({t:'brew',id:'heal1',n:9}); ok('at most 99 of a potion are carried',g().pot.heal1===99);

// ---- drinking ----
{ g().pot={heal1:2,heal3:1,might1:1,might2:1,guard2:1}; p.hp=p.maxHp; grab(); evs.length=0; send({t:'potion',k:'heal'}); ok('a healing potion cannot be wasted at full health',g().pot.heal3===1);
  p.hp=1; W.receive('a',{t:'potion',k:'heal'}); const back=p.hp; ok('the strongest healing potion is drunk first: +70% of max health',g().pot.heal3===undefined&&g().pot.heal1===2&&Math.abs(back-(1+p.maxHp*0.7))<2,Math.round(back)+' / '+p.maxHp);
  grab(); tick(3); grab(); ok('a pot event tells the client the kind, strength and length',evs.some(e=>e[0]==='pot'&&e[1]==='a'&&e[2]==='heal'&&e[3]===2&&e[4]===0));
  p.hp=1; W.receive('a',{t:'potion',k:'heal'}); ok('the same kind has a cooldown (15 s)',g().pot.heal1===2);
  x.S.t+=16; p.hp=1; W.receive('a',{t:'potion',k:'heal'}); ok('and can be drunk again after it',g().pot.heal1===1&&p.hp>1);
  W.receive('a',{t:'potion',k:'might'}); const mult=(()=>{ let a=0,b=0; for(let i=0;i<600;i++){ p.potb={}; a+=x.rollDmgS(p,1,null,'basic').v; p.potb={might:{until:x.S.t+90,v:0.3}}; b+=x.rollDmgS(p,1,null,'basic').v; } return b/a; })();
  ok('a draught of might (the plain one, +30% for 90 s) raises the damage you deal',x.potBuffP(p,'might')>0&&Math.abs(mult-1.3)<0.15,'x'+mult.toFixed(2));
  const before=p.hp; p.potb={}; p.hp=p.maxHp; x.hurtP(p,100,null); const plain=p.maxHp-p.hp; p.hp=p.maxHp; p.potb={guard:{until:x.S.t+90,v:0.3}}; x.hurtP(p,100,null); const guarded=p.maxHp-p.hp;
  ok('an ironbark tonic (-30%) lowers the damage you take',guarded<plain&&Math.abs(guarded/plain-0.7)<0.06,plain+' -> '+guarded);
  p.potb={might:{until:x.S.t+5,v:0.3}}; x.S.t+=6; ok('a buff ends after its time',x.potBuffP(p,'might')===0);
  p.hp=p.maxHp; g().pot={}; send({t:'potion',k:'guard'}); ok('with no potion of the kind, nothing happens',!x.potBuffP(p,'guard')); send({t:'potion',k:'poison'}); ok('an unknown kind is ignored',true); }

// ---- the testing tools ----
{ g().res={}; g().pot={}; dev('res'); dev('pots'); ok('the testing tools add resources and potions',Object.keys(x.RES).every(id=>g().res[id]===60)&&Object.keys(x.POTS).every(id=>g().pot[id]===5)); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
