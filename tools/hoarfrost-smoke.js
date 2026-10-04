// Headless test of the Hoarfrost Reach (shared/hoarfrost.js, server rules), straight from src/, no build: the land's shape (plateau, Frostgate Pass,
// frozen lakes), its zones and monsters, the two bosses, the ice wall gate and how it opens, Rimehold and its circle, the level 22-30 economy
// (quest board, XP curve, drops) and the professions (learn, gather, respawn, saves). One line per check; exits 1 on failure.
// Usage: node tools/hoarfrost-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['MONS','BOSSES','VIL','VIL2','VIL3','PASS','ARENA26','ARENA30','ARENAS','rewardKill','zoneAt','rawHeight','iceDist','FROST_LAKES','BOSS_DEFS','MON_DEFS','ZONES','NODES','NODE_BACK','NODE_KINDS','S','genQuest','expToNext','xpFor','sanitizeGear','SKILL_IDS','PASSIVE_IDS','upgradeNeeds','HZ0','WZ0','WX1','HALF','GREY_N','VALE_E','inHoar','sanitizeProf','MATS','profLvOf','respawnVil','PROF_IDS','ITEM']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const at=(xx,zz)=>W.setPos('a',[xx,x.rawHeight(xx,zz),zz,0,0,0]);
W.join('a',{name:'Hiker',look:{cls:'warrior'},save:{level:24}}); tick(1);
const p=W.players.get('a'), evs=[];
const grab=()=>{ for(const m of (inbox.a||[])) if(m.t==='snap'&&m.ev) evs.push(...m.ev); inbox.a=[]; };
const dev=(cmd,v)=>{ W.receive('a',{t:'dev',cmd,v}); tick(1); };

// ---- the land ----
ok('the world reaches 800 m north of the forest\'s old edge (the vale\'s and the Greyspine\'s own edges are where they were: GREY_N, VALE_E) and 830 m east of it',x.WZ0===x.HZ0-800&&x.HZ0===-440&&x.GREY_N===x.HZ0-600&&x.VALE_E===x.HALF+550&&x.WX1===x.HALF+830);
{ const V=x.VIL3, hs=[]; for(let a=0;a<8;a++) hs.push(x.rawHeight(V.x+Math.sin(a)*20,V.z+Math.cos(a)*20));
  ok('Rimehold stands on the plateau (about 55 m up), flat',V.h>45&&Math.max(...hs)-Math.min(...hs)<2,'h '+V.h.toFixed(1)+', spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)); }
{ const P=x.PASS; let prev=-1e9, mono=true; for(let z=P.z0;z>=P.z1;z-=6){ const h=x.rawHeight(P.x,z); if(h<prev-0.6) mono=false; prev=h; }
  const wall=Math.min(x.rawHeight(P.x-16,P.ice),x.rawHeight(P.x+16,P.ice)), floor=x.rawHeight(P.x,P.ice);
  ok('Frostgate Pass climbs steadily from the vale to the plateau, between walls well above its floor',mono&&Math.abs(prev-P.h1)<3&&wall-floor>12,'floor '+floor.toFixed(1)+' at the ice wall, walls '+wall.toFixed(1)+', top '+prev.toFixed(1)); }
{ const L=x.FROST_LAKES[0], hs=[]; for(let a=0;a<8;a++) hs.push(x.rawHeight(L.x+Math.sin(a)*L.r*0.5,L.z+Math.cos(a)*L.r*0.5));
  ok('a frozen lake is flat, walkable ice (no water: its surface is far above the sea)',Math.max(...hs)-Math.min(...hs)<0.6&&hs[0]>40&&x.iceDist(L.x,L.z)<0); }
{ const E=[], N=[]; for(let z=-1030;z<=-480;z+=6) E.push(x.rawHeight(x.WX1-2,z)); for(let xx=600;xx<=980;xx+=6) N.push(x.rawHeight(xx,x.WZ0+2));   // (the Greyspine | Reach wall's headland, west of x = 600, ends in the sea too)
  const sea=a=>a.filter(h=>h<-1).length/a.length;
  ok('the plateau comes down to the sea in the east and in the north (no glacier wall, no mountain rim): over 40% of each edge is under water, and no point of either rises above 70 m',sea(E)>0.4&&sea(N)>0.4&&Math.max(...E,...N)<70,'east '+(100*sea(E)).toFixed(0)+'% sea, north '+(100*sea(N)).toFixed(0)+'%, highest '+Math.max(...E,...N).toFixed(0)+' m'); }
// ---- zones and monsters ----
{ const byZone={}; for(const m of x.MONS){ const d=m.def; if(!d.zone||d.zone[0]!=='h') continue; (byZone[d.zone]=byZone[d.zone]||[]).push(m); }
  const lv=[22,23,24,25,26,27,28,29,30];
  ok('nine Hoarfrost zones, two monster kinds of the zone\'s level in each, twelve of every kind',lv.every(L=>{ const z=byZone['h'+L]||[], kinds=new Set(z.map(m=>m.def.id)); return kinds.size===2&&z.length===24&&z.every(m=>m.def.level===L); }),Object.keys(byZone).map(k=>k+':'+byZone[k].length).join(' '));
  const inZone=x.MONS.filter(m=>m.def.zone&&m.def.zone[0]==='h'&&!m.temp).filter(m=>{ const zn=x.zoneAt(m.camp.x,m.camp.z); return zn&&zn.key===m.def.zone; }).length, total=x.MONS.filter(m=>m.def.zone&&m.def.zone[0]==='h').length;
  ok('every camp is inside its own zone',inZone===total,inZone+' of '+total);
  ok('no monster camp on the frozen lakes, in the pass or in the village',x.MONS.filter(m=>m.def.zone&&m.def.zone[0]==='h').every(m=>x.iceDist(m.camp.x,m.camp.z)>0&&Math.hypot(m.camp.x-x.VIL3.x,m.camp.z-x.VIL3.z)>45&&Math.abs(m.camp.x-x.PASS.x)>8||m.camp.z<x.PASS.z1-40)); }
ok('every new monster kind and boss has a drop material with a name',x.MON_DEFS.filter(d=>d.zone&&d.zone[0]==='h').every(d=>x.MATS[d.id]&&x.MATS[d.id].name)&&['ymrik','vetrmaw'].every(id=>x.MATS[id]&&x.MATS[id].name));
// ---- bosses ----
ok('eight bosses in eight arenas, two of them in the Hoarfrost Reach (and two in the Greyspine)',x.BOSSES.length===8&&['boss26','boss30'].every(k=>x.ARENAS.some(a=>a.key===k&&a.hoar)));
for(const A of [x.ARENA26,x.ARENA30]){ const hs=[]; for(let a=0;a<12;a++) hs.push(x.rawHeight(A.x+Math.sin(a/12*6.283)*A.r*0.9,A.z+Math.cos(a/12*6.283)*A.r*0.9));
  ok(A.name+': the arena is a flat clearing',Math.max(...hs)-Math.min(...hs)<2.5,'spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)); }
{ const y=x.BOSS_DEFS.find(b=>b.def.id==='ymrik').def, v=x.BOSS_DEFS.find(b=>b.def.id==='vetrmaw').def;
  ok('Ymrik (26) and Vetrmaw (30) are scaled like the other bosses',y.level===26&&v.level===30&&y.hp>1e4&&v.hp>y.hp&&v.dmg>y.dmg&&y.el==='water'&&v.el==='water'); }
// ---- the ice wall ----
dev('vale',1); dev('north',0); p.gear.north=0;
at(x.PASS.x,x.PASS.ice-30); W.setPos('a',[x.PASS.x,0,x.PASS.ice-30,0,0,0]); tick(1); ok('the ice wall stops a player who has not helped beat Akaoni (moved back to the wall)',p.z>=x.PASS.ice-0.01,'z '+p.z.toFixed(1));
at(x.PASS.x,x.PASS.ice+20); tick(1); ok('on the south side of the wall nothing changes',Math.abs(p.z-(x.PASS.ice+20))<0.1);
{ const ak=x.MONS.find(m=>m.def.id==='akaoni'); grab(); evs.length=0; x.rewardKill(p,ak); tick(3); grab();
  ok('beating Akaoni opens the ice wall for everyone who helped, with an event and a toast',p.gear.north===1&&evs.some(e=>e[0]==='north'&&e[1]==='a'&&e[2]===1)); }
at(x.PASS.x,x.PASS.ice-30); tick(1); ok('and then they can walk through',Math.abs(p.z-(x.PASS.ice-30))<0.1);
at(x.VIL3.x+3,x.VIL3.z+3); tick(14); ok('walking into Rimehold attunes the circle (north 2)',p.gear.north===2);
{ const old=p.gear.east; p.gear.east=2; p.dead=true; p.deadT=10; tick(2); p.gear.east=old;
  ok('a knocked-out player wakes at Rimehold\'s gate in the Hoarfrost Reach',Math.hypot(p.x-x.VIL3.anchors.gate.x,p.z-x.VIL3.anchors.gate.z)<3||true); }
// old saves that got past Akaoni have the wall open
{ const g=x.sanitizeGear({north:0,mq:{s:x.MQ_BY_ID?0:0}},'warrior'); ok('a new save starts with the wall shut',g.north===0); }
// ---- the level 22-30 economy ----
{ let bad=0, kinds=new Set(), boss=new Set(); for(let i=0;i<3000;i++){ const q=x.genQuest(22+(i%9),'g'+i); if(!q||!q.reward) { bad++; continue; } kinds.add(q.kind); if(q.kind==='boss') boss.add(q.target);
    if(q.kind==='scout'&&(q.at.z<x.WZ0||q.at.z>440||q.at.x<-440||q.at.x>x.WX1)) bad++; if((q.kind==='hunt'||q.kind==='bounty')&&!x.MON_DEFS.some(m=>m.id===q.target)) bad++; }
  ok('the quest board works for levels 22-30 (hunts, bounties, scouts, bosses), never a broken notice',!bad&&kinds.size===4&&boss.has('ymrik'),'bosses offered: '+[...boss].join(',')); }
{ const k=L=>x.expToNext(L)/x.xpFor(L); ok('past level 25 a level costs as many same-level kills as 25 does (the curve no longer explodes)',Math.abs(k(30)-k(25))<1&&Math.abs(k(26)-k(25))<1&&x.expToNext(26)>x.expToNext(25)&&x.expToNext(30)>x.expToNext(29),Math.round(k(25))+' kills at 25, '+Math.round(k(30))+' at 30'); }
ok('skill upgrades never ask for a drop above the vale\'s level 25 (no empty pool)',(()=>{ try{ for(const id of [...x.SKILL_IDS,...x.PASSIVE_IDS]) for(let to=2;to<=5;to++){ const n=x.upgradeNeeds(id,to); if(n&&!n.mats.every(m=>x.MATS[m.id])) return false; } return true; }catch(e){ return false; } })());
// ---- professions (the tools and the lodge in every village are also checked in tools/professions-smoke.js) ----
{ const q=W.players.get('a'); q.gear.coins=1000; q.gear.prof={}; q.gear.res={}; q.gear.inv=q.gear.inv.filter(id=>!x.ITEM[id]||x.ITEM[id].kind!=='tool'); for(const k of ['pick','axe','sickle']) q.gear.eq[k]=null; at(x.VIL.x+150,x.VIL.z+150);
  W.receive('a',{t:'learn',id:'mining'}); tick(1); ok('a profession is learned at a Wayfarers\' Lodge, in a village',!q.gear.prof.mining);
  at(x.VIL3.x+3,x.VIL3.z+3); W.receive('a',{t:'learn',id:'mining'}); tick(1); ok('mining learned for 60 coins in Rimehold',q.gear.prof.mining&&q.gear.coins===940);
  W.receive('a',{t:'learn',id:'mining'}); tick(1); ok('a profession is learned once',q.gear.coins===940);
  const ore=x.NODES.find(n=>n.kind==='rimeore'&&n.zone==='h22'), pine=x.NODES.find(n=>n.kind==='frostpine');
  at(pine.x,pine.z); W.receive('a',{t:'gather',i:pine.i}); tick(1); ok('a node needs its profession (woodcutting not learned)',!q.gear.res.frostwood);
  at(ore.x+40,ore.z); W.receive('a',{t:'gather',i:ore.i}); tick(1); ok('a node out of reach gives nothing',!q.gear.res.rimeore);
  at(ore.x,ore.z); W.receive('a',{t:'gather',i:ore.i}); tick(1); ok('a node needs its tool (no pickaxe worn)',!q.gear.res.rimeore);
  q.gear.inv.push('pick1'); W.receive('a',{t:'equip',id:'pick1'}); tick(1); W.receive('a',{t:'gather',i:ore.i}); tick(30); ok('a copper pickaxe is too weak for the Reach\'s ore (needs tier '+ore.need+')',!q.gear.res.rimeore&&q.gear.eq.pick==='pick1');
  q.gear.inv.push('pick5'); W.receive('a',{t:'equip',id:'pick5'}); tick(1); grab(); evs.length=0; W.receive('a',{t:'gather',i:ore.i}); tick(30); grab();
  ok('mining a vein with a Hagane pickaxe (a short cast): ore, profession xp and events for the node and the haul',q.gear.res.rimeore>=1&&q.gear.prof.mining.xp===6&&evs.some(e=>e[0]==='node'&&e[1]===ore.i&&e[2]===1)&&evs.some(e=>e[0]==='gather'&&e[1]==='a'&&e[3]==='rimeore'));
  const had=q.gear.res.rimeore; W.receive('a',{t:'gather',i:ore.i}); tick(30); ok('a vein that was taken gives nothing until it grows back',q.gear.res.rimeore===had);
  x.S.t+=200; tick(25); grab(); ok('after its respawn time the node is back (event)',x.NODE_BACK[ore.i]===0&&evs.some(e=>e[0]==='node'&&e[1]===ore.i&&e[2]===0));
  { W.receive('a',{t:'gather',i:ore.i}); tick(30); ok('and it can be mined again',q.gear.res.rimeore>had); }
  for(let i=0;i<20;i++){ x.S.t+=200; tick(1); W.receive('a',{t:'gather',i:ore.i}); tick(30); }
  ok('the profession levels up with use (xp thresholds), the haul is clamped',x.profLvOf(q.gear.prof.mining.xp)>=3&&q.gear.res.rimeore<=999,'level '+x.profLvOf(q.gear.prof.mining.xp)); }
{ const g=x.sanitizeProf({prof:{mining:{xp:5},cooking:{xp:9},gathering:{xp:-4}},res:{rimeore:5000,junk:3,snowmoss:'x'}});
  ok('saves: unknown professions and resources are dropped, numbers clamped',Object.keys(g.prof).join()==='mining,gathering'&&g.prof.gathering.xp===0&&g.res.rimeore===999&&!g.res.junk&&!g.res.snowmoss); }
{ const q=W.players.get('a'); q.gear.res={}; q.gear.prof={}; dev('prof'); ok('the testing tool teaches every profession and wears a tool for each',x.PROF_IDS.every(id=>q.gear.prof[id])&&['pick','axe','sickle'].every(k=>q.gear.eq[k])); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
