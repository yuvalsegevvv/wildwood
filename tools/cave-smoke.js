// Headless test of the Deep Cave's 4th slot (server straight from src/, no build): the slot opens at level 23, charge per cast (once, not per enemy), the cap, the set bonus,
// the boss-fight rule (50 on entering, 0 on leaving early, kept when the boss dies), casting spends the cost, the registry's validation and a bad save. The cave skill used here is a fixture defined in this file.
// Usage: node tools/cave-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['caveFloorDef','caveBake','caveGen','CAVE_FLOOR_N','CAVE_FLOOR_BAD','defineCaveFloor','caveFloorAt','caveFloorOrigin','caveGroundY','caveFree','caveSlide','caveLos','caveWallAt','caveLiftOf','caveArrival','caveFloorOpen','caveLiftRefusal','CAVE_MOUTH','CAVE_PORTAL','CAVE_LIFT_SURFACE','CAVE_MOUTH_V','CIRCLES','caveMouthNear','caveMouthPad','landAt','roadDist','arenaDist','coastDist','vDist','waterSurf','dgInSlots','dgSlotAt','CAVE_CELL','CAVE_SIZE','CAVE_WALK_R','DEF_BY_ID','baseHeight','rawHeight','MONS','BOSSES','getH','sanitizeGear','defineCaveSkill','CAVE_BAD','CAVE_SKILLS','SS_ORDER','SS_SETS','SKILLS','caveChargeGain','CAVE_SLOT_LV','CAVE_CHARGE_K','CAVE_COST_MAX','killMonsterS','slotLv','ssGrantSetP','caveSkillDef']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const near=(a,b)=>Math.abs(a-b)<1e-6;
const SET=x.SS_ORDER[0];
// ---- the registry ----
const fixture=x.defineCaveSkill({id:'fixflare',name:'Fixture Flare',floor:1,method:'B',set:null,cost:25,desc:'A test ring.',mult:1,range:10,fx:{ring:{r:8}}});
const fixSet=x.defineCaveSkill({id:'fixset',name:'Fixture Set',floor:2,method:'C',set:SET,cost:30,desc:'A test ring of a set.',mult:1,range:10,fx:{ring:{r:8}}});
ok('a valid skill is registered, with the shape of an ability (cls any, slot cave, cd 0, an attack kind of its own)',fixture&&x.CAVE_SKILLS.fixflare===fixture&&fixture.cls==='any'&&fixture.slot==='cave'&&fixture.cd===0&&fixture.act[0]==='cv_fixflare'&&fixSet&&fixSet.set===SET);
const bads=[{id:'Bad Id'},{id:'fixflare',name:'x',floor:1,method:'A',cost:25,desc:'d',mult:1,range:5,fx:{ring:{r:3}}},{id:'cost1',name:'x',floor:1,method:'A',cost:5,desc:'d',mult:1,range:5,fx:{ring:{r:3}}},
  {id:'floor9',name:'x',floor:9,method:'A',cost:25,desc:'d',mult:1,range:5,fx:{ring:{r:3}}},{id:'meth',name:'x',floor:1,method:'Z',cost:25,desc:'d',mult:1,range:5,fx:{ring:{r:3}}},
  {id:'nofx',name:'x',floor:1,method:'A',cost:25,desc:'d',mult:1,range:5},{id:'badset',name:'x',floor:1,method:'A',set:'constructor',cost:25,desc:'d',mult:1,range:5,fx:{ring:{r:3}}},
  {id:'slash',name:'x',floor:1,method:'A',cost:25,desc:'d',mult:1,range:5,fx:{ring:{r:3}}},null,'x'];
ok('invalid entries are left out and listed in CAVE_BAD (never thrown)',bads.every(b=>x.defineCaveSkill(b)===null)&&x.CAVE_BAD.length===bads.length&&!x.caveSkillDef('constructor')&&!x.caveSkillDef('__proto__'),x.CAVE_BAD.map(b=>b.id+': '+b.why).join(' | '));
ok('a cave skill id never collides with the class skills',!x.SKILLS.fixflare);
// ---- a player below level 23 ----
W.join('lo',{name:'Lowe',look:{cls:'warrior'},save:{level:22}}); W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:23}}); tick(3);
const lo=W.players.get('lo'), p=W.players.get('a');
ok('the slot opens at level 23',x.CAVE_SLOT_LV===23&&x.slotLv('cave')===23);
lo.gear.cave.own.fixflare=1; W.receive('lo',{t:'cavequip',id:'fixflare'}); tick(1);
ok('below level 23 a cave skill cannot be worn',lo.gear.skills.cave===null);
const pile=(pl,n)=>{ // n awake monsters standing on the player
  const ms=x.MONS.filter(m=>!m.boss&&!m.dead&&!m.inst).slice(0,n); const y=x.getH(pl.x,pl.z);
  for(const m of ms){ m.x=pl.x+(Math.random()-0.5); m.z=pl.z+(Math.random()-0.5); m.y=y; m.maxHp=m.hp=1e9; m.dead=false; m.immune=false; m.awake=true; }
  return ms; };
const cast=(id,k,tg)=>{ const pl=W.players.get(id); pl.cd.basic=pl.cd.skill=pl.cd.burst=pl.cd.cave=0; W.receive(id,{t:'atk',k:k||'skill',tg:tg||null,face:0,aim:[0,0,-1]}); tick(30); };
{ const near3=pile(lo,3); lo.cave.charge=0; cast('lo','skill'); ok('below level 23 nothing is charged',lo.cave.charge===0&&near3.length===3); }
// ---- charge per cast ----
const wh=x.SKILLS.whirlwind;
{ p.cave.charge=0; const ms=pile(p,4); cast('a','skill');
  ok('a spin that hits four enemies charges 0.6 x its cooldown ONCE (not per enemy)',near(p.cave.charge,x.CAVE_CHARGE_K*wh.cd),p.cave.charge+' vs '+x.CAVE_CHARGE_K*wh.cd+' ('+ms.length+' monsters)');
  p.cave.charge=0; for(const m of x.MONS) if(!m.boss){ m.x=p.x+300; m.z=p.z+300; } cast('a','skill');
  ok('a cast that hits nothing charges nothing',p.cave.charge===0,String(p.cave.charge));
  pile(p,2); p.cave.charge=0; cast('a','basic');
  ok('a basic attack charges by its own cooldown (0.6 x 0.7)',p.cave.charge>0&&near(p.cave.charge,x.CAVE_CHARGE_K*x.SKILLS.slash.cd),String(p.cave.charge)); }
{ p.cave.charge=99; pile(p,2); cast('a','skill'); ok('the bar is capped at 100',p.cave.charge===100,String(p.cave.charge)); }
ok('the client is told the charge (a cave message with the rounded value)',(inbox.a||[]).filter(m=>m.t==='cave').pop().c===100);
// ---- the set bonus (pure rule + a real cast) ----
{ const piece=Object.values(x.SKILLS).find(s=>s.set===SET&&s.slot==='skill'), other=x.SKILLS.whirlwind;
  ok('a cast of a piece of the cave skill\'s set earns double; any other cast, or a skill with no set, earns the normal amount',
    piece&&near(x.caveChargeGain(piece,fixSet),2*x.CAVE_CHARGE_K*piece.cd)&&near(x.caveChargeGain(piece,fixture),x.CAVE_CHARGE_K*piece.cd)&&near(x.caveChargeGain(other,fixSet),x.CAVE_CHARGE_K*other.cd)&&near(x.caveChargeGain(piece,null),x.CAVE_CHARGE_K*piece.cd));
  x.ssGrantSetP(p,SET); p.gear.cave.own.fixset=1; p.gear.skills.cave='fixset'; W.receive('a',{t:'eqskill',id:piece.id}); tick(2);
  ok('the piece is worn (so the integration cast below is a set cast)',p.gear.skills.owned.includes(piece.id));
  const ab=x.SKILLS[piece.id]; let worn=false; for(const c of ['warrior','archer','mage']) if(p.gear.skills.eq[c].skill===piece.id) worn=true;
  if(worn){ p.cave.charge=0; const sm=pile(p,3); cast('a','skill',sm[0].id); ok('the worn set piece, cast with its set\'s cave skill equipped, charges double',p.cave.charge>0&&near(p.cave.charge,2*x.CAVE_CHARGE_K*ab.cd),p.cave.charge+' vs '+2*x.CAVE_CHARGE_K*ab.cd); }
  else ok('(the set piece is not wearable by a warrior: only the pure rule is checked)',true); }
// ---- casting spends the cost ----
{ p.gear.cave.own.fixflare=1; W.receive('a',{t:'cavequip',id:'fixflare'}); tick(1);
  ok('an owned cave skill can be worn at level 23',p.gear.skills.cave==='fixflare');
  W.receive('a',{t:'cavequip',id:'constructor'}); W.receive('a',{t:'cavequip',id:'nope'}); W.receive('a',{t:'cavequip',id:7}); tick(1);
  ok('a bad or unowned id changes nothing',p.gear.skills.cave==='fixflare');
  p.cave.charge=24; p.cd.cave=0; p.act=null; W.receive('a',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tick(2);
  ok('with less charge than the cost (25) the cast is refused and nothing is spent',near(p.cave.charge,24)&&!p.act);
  p.cave.charge=60; pile(p,2); p.cd.cave=0; W.receive('a',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tick(1);
  ok('with enough charge a cast spends exactly the cost (25) and starts the skill',near(p.cave.charge,35)&&p.act&&p.act.sid==='fixflare'&&p.act.cave,String(p.cave.charge));
  tick(12); const after=p.cave.charge;
  ok('the cave skill\'s own hit earns no charge',near(after,35),String(after));
  W.receive('a',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tick(1);
  ok('a second cast within the cave cooldown is refused',near(p.cave.charge,35)||p.cd.cave>0);
  p.gear.skills.cave='fixflare'; p.cave.charge=100; p.pv=1; p.cd.cave=0; p.act=null; W.receive('a',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tick(1); p.pv=null;
  ok('on the Proving Isle the cave skill is off',p.cave.charge===100); }
// ---- the boss-fight rule ----
{ const B=x.BOSSES[0], A=B.A; p.cd.cave=0; p.act=null; p.cave.charge=80;
  const put=(dx)=>{ W.setPos('a',[A.x+dx,x.getH(A.x+dx,A.z),A.z,0,0,0]); };
  put(2); tick(6);
  ok('the test player really stands in the arena and the boss is engaged',Math.hypot(p.x-A.x,p.z-A.z)<A.r&&B.engaged,Math.round(Math.hypot(p.x-A.x,p.z-A.z))+' of '+A.r);
  ok('entering a boss fight sets the charge to exactly 50 (it was 80)',near(p.cave.charge,50),String(p.cave.charge));
  p.cave.charge=65; tick(10); ok('inside the fight it is not reset again',near(p.cave.charge,65),String(p.cave.charge));
  W.setPos('a',[A.x+A.r+60,x.getH(A.x+A.r+60,A.z),A.z,0,0,0]); tick(30);
  ok('leaving the fight before the boss dies drops the charge to 0',p.cave.charge===0&&p.cave.fight===null,String(p.cave.charge));
  p.cave.charge=90; tick(10); ok('and ordinary fights keep it as it is',near(p.cave.charge,90));
  put(2); tick(6); ok('stepping back in sets 50 again',near(p.cave.charge,50));
  x.killMonsterS(B.m,p); tick(1); p.cave.charge=70; tick(2);
  W.setPos('a',[A.x+A.r+60,x.getH(A.x+A.r+60,A.z),A.z,0,0,0]); tick(30);
  ok('when the boss dies the fight ended: walking away keeps the charge',near(p.cave.charge,70),String(p.cave.charge)); }
// ---- saves ----
{ const g=x.sanitizeGear({cave:{own:{fixflare:99,fixset:-4,nope:3,constructor:2,__proto__:{a:1},toString:1}},skills:{cave:'fixflare'}},'warrior');
  ok('a save is cleaned: unknown ids dropped, levels clamped to 1-5',g.cave.own.fixflare===5&&g.cave.own.fixset===1&&Object.keys(g.cave.own).length===2,JSON.stringify(g.cave));
  ok('...and the worn cave skill survives only when it is owned',g.skills.cave==='fixflare');
  const g2=x.sanitizeGear({cave:{own:{fixset:2}},skills:{cave:'fixflare'}},'warrior'); ok('a worn skill that is not owned is taken off',g2.skills.cave===null);
  for(const bad of ['x',7,null,[],{own:'x'},{own:[1,2]},{own:null}]){ const h=x.sanitizeGear({cave:bad,skills:{cave:{a:1}}},'warrior'); if(!h.cave||typeof h.cave.own!=='object'||Object.keys(h.cave.own).length||h.skills.cave!==null){ ok('garbage cave data is cleaned',false,JSON.stringify(bad)); break; } }
  ok('garbage cave data is cleaned (non-objects, arrays, a worn id that is not a string)',true);
  const g3=x.sanitizeGear({},'mage'); ok('an old save has an empty cave and nothing worn',Object.keys(g3.cave.own).length===0&&g3.skills.cave===null); }

// ======== C1: the floors' maps, the way in ========
const FL=x.CAVE_FLOOR_N;
ok('four floors are defined in order and none was left out',FL.join()==='1,2,3,4'&&x.CAVE_FLOOR_BAD.length===0,FL.join()+' bad '+JSON.stringify(x.CAVE_FLOOR_BAD));
{ const bad=[null,{id:'x'},{id:'ok1',n:1,name:'Dup',theme:'grotto',lv:[1,2],seed:1,gen:{},look:{}},{id:'ok2',n:5,name:'N',theme:'plasma',lv:[1,2],seed:1,gen:{},look:{}},{id:'ok3',n:5,name:'N',theme:'grotto',lv:[3,2],seed:1,gen:{},look:{}},
    {id:'ok4',n:5,name:'N',theme:'grotto',lv:[1,2],seed:1.5,gen:{},look:{}},{id:'ok5',n:5,name:'N',theme:'grotto',lv:[1,2],seed:1,look:{}}];
  const n0=x.CAVE_FLOOR_BAD.length; ok('invalid floor rows (a duplicate floor, a theme that does not exist, a bad level range or seed, no generator options) are left out and listed, never thrown',bad.every(b=>x.defineCaveFloor(b)===null)&&x.CAVE_FLOOR_BAD.length===n0+bad.length&&x.CAVE_FLOOR_N.join()==='1,2,3,4');
  x.CAVE_FLOOR_BAD.length=n0; }
const hashB=B=>{ let h=2166136261>>>0; for(const a of [B.open,B.cells,B.water,B.lava,B.dw]) for(let i=0;i<a.length;i++){ h^=a[i]*1000|0; h=Math.imul(h,16777619)>>>0; } for(let i=0;i<B.hgt.length;i+=7){ h^=Math.round(B.hgt[i]*1000); h=Math.imul(h,16777619)>>>0; } return h+':'+JSON.stringify([B.anchors,B.camps,B.chambers,B.lift,B.start]).length; };
const hashes={};
for(const n of FL){ const F=x.caveFloorDef(n), a=x.caveGen(F), b=x.caveGen(F); hashes[n]=hashB(a);
  ok('floor '+n+' ('+F.name+'): the same seed gives the very same map twice, anchors included',hashB(a)===hashB(b)&&JSON.stringify(a.anchors)===JSON.stringify(b.anchors)&&JSON.stringify(a.camps)===JSON.stringify(b.camps)); }
ok('the four floors are four different maps',new Set(Object.values(hashes)).size===4);
{ const F=x.caveFloorDef(1), B1=x.caveGen(F), B2=x.caveGen(Object.assign({},F,{seed:F.seed+1})); ok('and another seed gives another map (the seed is what makes it)',hashB(B1)!==hashB(B2)); }
// every anchor reachable from the floor's start by walking (the vault once its seal is opened), standing on a walkable cell
for(const n of FL){
  const B=x.caveBake(n), W=B.w, H=B.h, M=x.CAVE_CELL, cellOf=(px,pz)=>Math.floor(pz/M)*W+Math.floor(px/M);
  const cells=Uint8Array.from(B.cells); for(const k of B.sealed) cells[k]=1;   // the seal opened
  const seen=new Uint8Array(W*H), q=[cellOf(B.start.x,B.start.z)]; seen[q[0]]=1;
  while(q.length){ const c=q.pop(), cx=c%W, cz=(c-cx)/W; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, nz=cz+dz; if(nx<0||nz<0||nx>=W||nz>=H) continue; const ni=nz*W+nx; if(cells[ni]&&!seen[ni]){ seen[ni]=1; q.push(ni); } } }
  const A=B.anchors, pts=[['lift',A.lift],['deep',A.deep],['A wall',A.A.wall],...A.A.pieces.map((p,i)=>['A piece '+i,p]),...A.B.geodes.map((p,i)=>['B geode '+i,p]),['C plinth',A.C.plinth],['D crystal',A.D.crystal],['D altar',A.D.altar],
    ['E entry',A.E.entry],['E shrine',A.E.shrine],['E guard',A.E.guard],['E exit',A.E.exit],['F vault',A.F.vault],...A.G.burrows.map((p,i)=>['G burrow '+i,p]),...A.G.holes.map((p,i)=>['G hole '+i,p]),
    ...A.H.veins.map((p,i)=>['H vein '+i,p]),...A.H.herbs.map((p,i)=>['H herb '+i,p]),['H anvil',A.H.anvil],...B.camps.map((p,i)=>['camp '+i,p])];
  const lost=pts.filter(([nm,p])=>!p||!isFinite(p.x)||!isFinite(p.z)||!seen[cellOf(p.x,p.z)]).map(q=>q[0]);
  ok('floor '+n+': all '+pts.length+' anchors and camps (eight methods\' places, the lift, the camps) can be walked to from the start',lost.length===0,lost.slice(0,6).join(', '));
  ok('floor '+n+': counts are what the methods need (5 mural pieces, 3 geodes, 3 burrows, 6 holes, 8 veins, 6 herbs, camps in every level of the band)',A.A.pieces.length===5&&A.B.geodes.length===3&&A.G.burrows.length===3&&A.G.holes.length===6&&A.H.veins.length===8&&A.H.herbs.length===6&&B.camps.length>=20,
    [A.A.pieces.length,A.B.geodes.length,A.G.burrows.length,A.G.holes.length,A.H.veins.length,A.H.herbs.length,B.camps.length].join('/'));
  ok('floor '+n+': the vault is shut until its seal is opened (not reachable before), and the start is on open ground',!(()=>{ const s2=new Uint8Array(W*H), q2=[cellOf(B.start.x,B.start.z)]; s2[q2[0]]=1; while(q2.length){ const c=q2.pop(), cx=c%W, cz=(c-cx)/W; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, nz=cz+dz, ni=nz*W+nx; if(nx>=0&&nz>=0&&nx<W&&nz<H&&B.cells[ni]&&!s2[ni]){ s2[ni]=1; q2.push(ni); } } } return s2[cellOf(A.F.vault.x,A.F.vault.z)]; })()&&B.cells[cellOf(B.start.x,B.start.z)]===1);
  const bad=B.camps.filter(c=>!x.caveFree(x.caveFloorOrigin(n).x+c.x,x.caveFloorOrigin(n).z+c.z,0.9)); ok('floor '+n+': every camp has room for its pack to stand (caveFree)',bad.length===0,bad.length+' camps');
  const O=x.caveFloorOrigin(n); ok('floor '+n+': the floor lies inside the dungeon slots\' strip (underground), clear of every run slot, and its ground height is known there',x.dgInSlots(O.x)&&x.dgSlotAt(O.x+40,O.z+40)===-1&&x.caveFloorAt(O.x+B.start.x,O.z+B.start.z)===n&&Math.abs(x.caveGroundY(O.x+B.start.x,O.z+B.start.z)-10)<1.2);
}
ok('the floors are far apart (no floor within a snapshot\'s reach of another)',FL.every((n,i)=>i===0||x.caveFloorOrigin(n).z-x.caveFloorOrigin(FL[i-1]).z-x.CAVE_SIZE>250));
// the baked ground is the server's ground
{ const n=1, B=x.caveBake(n), O=x.caveFloorOrigin(n); ok('the server\'s getH is the baked floor on a floor (and the dungeons\' flat 10 m in the strip elsewhere)',Math.abs(x.getH(O.x+B.start.x,O.z+B.start.z)-x.caveGroundY(O.x+B.start.x,O.z+B.start.z))<1e-9&&x.getH(O.x+B.start.x,O.z+B.start.z+300)===10); }
// ---- the mouth ----
{ const M=x.CAVE_MOUTH, land=x.landAt(M.x,M.z);
  ok('the mouth stands in the home forest, on dry land, off every road, arena and the coast',land===x.landAt(0,0)&&x.roadDist(M.x,M.z)>14&&x.arenaDist(M.x,M.z)>40&&x.coastDist(M.x,M.z)>80&&x.vDist(M.x,M.z)>60&&x.getH(M.x,M.z)>x.waterSurf(M.x,M.z)+1,
    [land,Math.round(x.roadDist(M.x,M.z)),Math.round(x.arenaDist(M.x,M.z)),Math.round(x.coastDist(M.x,M.z)),Math.round(x.vDist(M.x,M.z))].join(' '));
  const C=x.CIRCLES.find(c=>c.id==='cavemouth'); ok('its teleport circle is in CIRCLES (the travel window lists it) and the lift stands beside it',!!C&&C.V===x.CAVE_MOUTH_V&&Math.hypot(C.V.tele.x-x.CAVE_LIFT_SURFACE.x,C.V.tele.z-x.CAVE_LIFT_SURFACE.z)<14&&Math.hypot(x.CAVE_LIFT_SURFACE.x-M.x,x.CAVE_LIFT_SURFACE.z-M.z)<12);
  ok('the ground under the circle and the lift is level (the pad)',[x.CAVE_MOUTH_V.tele,x.CAVE_LIFT_SURFACE].every(q=>Math.abs(x.getH(q.x,q.z)-M.h)<0.05)&&x.caveMouthNear(M.x+3,M.z,8)&&!x.caveMouthNear(M.x+60,M.z,8)); }
// ---- the lift's rules ----
{ const hi={level:40,gear:{cave:{own:{}}}}, lo2={level:22,gear:{cave:{own:{}}}};
  ok('the lift refuses a hiker below level 23 (with the message), takes anyone of 23 to floor 1, and always takes you up',x.caveLiftRefusal(lo2,1).includes('level 23')&&x.caveLiftRefusal({level:23,gear:{cave:{own:{}}}},1)===''&&x.caveLiftRefusal(lo2,0)==='');
  ok('floor 2 stays shut until two skills of floor 1 are owned (caveFloorOpen), floor 1 is open to all',x.caveFloorOpen(hi,1)&&!x.caveFloorOpen(hi,2)&&!x.caveFloorOpen(hi,9)&&x.caveLiftRefusal(hi,2).includes('Floor 2 is still shut')&&!x.caveFloorOpen(hi,0)); }
// ---- the lift, the walls and the monsters on a fresh server (the older checks above move every monster about) ----
{ const inbox2={}, S2=loadServer({dev:true,send(pid,m){ (inbox2[pid]=inbox2[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},['MONS','DEF_BY_ID','MON_DEFS','ALL_MON_DEFS','caveFloorDef','caveBake','getH','caveFree','caveWallAt','caveFloorAt','caveFloorOrigin','caveArrival','CAVE_LIFT_SURFACE']), W=S2.api, x=S2.x;
  const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } }, told=(id,txt)=>(inbox2[id]||[]).some(m=>JSON.stringify(m).includes(txt));
  const L0=x.CAVE_LIFT_SURFACE, join=(id,lvl,x0,z0)=>{ W.join(id,{name:id,look:{cls:'warrior'},save:{level:lvl}}); tick(2); const pl=W.players.get(id); pl.x=x0; pl.z=z0; pl.y=x.getH(x0,z0); return pl; };
  const pa=join('lf1',40,L0.x,L0.z), pb=join('lf2',22,L0.x,L0.z), pc=join('lf3',40,L0.x+30,L0.z); tick(45);
  W.receive('lf1',{t:'lift',to:1}); tick(2);
  ok('standing on the surface lift, floor 1 takes you down to the floor\'s lift (a tp message, you stand on floor 1)',x.caveFloorAt(pa.x,pa.z)===1&&(inbox2.lf1||[]).some(m=>m.t==='tp'&&x.caveFloorAt(m.x,m.z)===1),pa.x+','+pa.z);
  tick(45); W.receive('lf1',{t:'lift',to:2}); tick(2);
  ok('floor 2 is refused while it is shut (you stay, and are told)',x.caveFloorAt(pa.x,pa.z)===1&&told('lf1','still shut'));
  W.receive('lf2',{t:'lift',to:1}); tick(2);
  ok('a hiker of level 22 is refused: still on the surface, and told why',x.caveFloorAt(pb.x,pb.z)===-1&&told('lf2','level 23'));
  W.receive('lf3',{t:'lift',to:1}); tick(2);
  ok('standing away from the lift does nothing (and says so)',x.caveFloorAt(pc.x,pc.z)===-1&&told('lf3','Stand on the lift'));
  tick(45); for(const to of ['constructor','__proto__',-3,1e9,NaN,null,{}]) W.receive('lf1',{t:'lift',to}); tick(2);
  ok('garbage as the target is ignored (you stay on floor 1)',x.caveFloorAt(pa.x,pa.z)===1);
  W.receive('lf1',{t:'lift',to:0}); tick(2);
  ok('the lift takes you back up to the surface lift',x.caveFloorAt(pa.x,pa.z)===-1&&Math.hypot(pa.x-L0.x,pa.z-L0.z)<6);
  // walls: a hiker is held inside the tunnels
  tick(45); W.receive('lf1',{t:'lift',to:1}); tick(2);
  { const n=1, A=x.caveArrival(n), pl=pa; let outside=0;
    for(let k=0;k<400;k++){ const a=k*0.97, nx=pl.x+Math.sin(a)*1.2, nz=pl.z+Math.cos(a)*1.2; W.setPos('lf1',[nx,x.getH(nx,nz),nz,a,0,0]); if(!x.caveFree(pl.x,pl.z,0.2)) outside++; }
    ok('walking in every direction for 400 steps never puts the hiker in the rock',outside===0&&x.caveFloorAt(pl.x,pl.z)===1,String(outside));
    const before=[pl.x,pl.z]; W.setPos('lf1',[pl.x+300,10,pl.z,0,0,0]); ok('a jump of 300 m is not a move',pl.x===before[0]&&pl.z===before[1]);
    pl.x=A.x; pl.z=A.z; let wx=null; for(let d=1;d<150;d+=1) if(x.caveWallAt(A.x+d,A.z)){ wx=A.x+d; break; }
    if(wx!==null){ for(let k=0;k<100;k++) W.setPos('lf1',[Math.min(pl.x+1.5,wx+30),10,pl.z,0,0,0]); ok('pushing 120 m east into a wall stops at the wall',pl.x<wx&&!x.caveWallAt(pl.x,pl.z),String(pl.x-wx)); } else ok('(no wall within 150 m east of the lift: skipped)',true); }
  // monsters
  { const ms=x.MONS.filter(m=>m.cave===1);
    ok('floor 1 has its monsters (a pack at every camp, levels 25-34 all present), every one standing on floor',ms.length>=60&&ms.every(m=>x.caveFree(m.x,m.z,0.1))&&new Set(ms.map(m=>m.def.level)).size===10,ms.length+' monsters, '+new Set(ms.map(m=>m.def.level)).size+' levels');
    // every floor's camps: a pack of the kind of the camp's level, the level inside the floor's band, the kind defined for that floor in order (floor.mobs[lv - lv0]) with the floor's own element mix
    for(const n of FL){ const F=x.caveFloorDef(n), B=x.caveBake(n), mm=x.MONS.filter(m=>m.cave===n);
      ok('floor '+n+': ten kinds, one per level of the band ('+F.lv[0]+'-'+F.lv[1]+'), each defined as a cave monster with an element',F.mobs.length===10&&F.mobs.every((id,i)=>{ const d=x.DEF_BY_ID[id]; return d&&d.cave&&d.level===F.lv[0]+i&&d.el&&d.hp>0&&d.xp>0&&d.dmg>0; }),F.mobs.join());
      ok('floor '+n+': every camp has its pack (levels inside the band, the kind of the camp\'s level, all ten levels present, on walkable ground)',mm.length>=B.camps.length&&mm.every(m=>m.def.level>=F.lv[0]&&m.def.level<=F.lv[1]&&m.def.id===F.mobs[m.def.level-F.lv[0]]&&x.caveFree(m.x,m.z,0.1))&&new Set(mm.map(m=>m.def.level)).size===10,mm.length+' monsters, '+B.camps.length+' camps');
      ok('floor '+n+': kills pay (hp, damage, xp finite and rising with the band) and the floor plays its own music theme',F.mobs.every(id=>isFinite(x.DEF_BY_ID[id].xp))&&x.DEF_BY_ID[F.mobs[9]].xp>x.DEF_BY_ID[F.mobs[0]].xp&&typeof F.look.music==='string'); }
    ok('the quest board and the zone levels ignore cave monsters (they are not in MON_DEFS)',x.MON_DEFS.every(d=>!d.cave)&&x.ALL_MON_DEFS.some(d=>d.cave));
    const pl=pa, m0=ms[0]; pl.x=m0.x+6; pl.z=m0.z; pl.y=x.getH(pl.x,pl.z); let bad=null;
    for(let i=0;i<200&&!bad;i++){ tick(1); bad=ms.find(m=>!x.caveFree(m.x,m.z,0.05)); }
    ok('200 ticks with a hiker beside a camp: every monster still on walkable ground',!bad,bad&&bad.def.id+' '+bad.x+','+bad.z); } }
// every cave kind has a model that builds (the client's own builder, headless)
try{ const {bootClient}=require('./headless'); const c=bootClient({expose:['ALL_MON_DEFS','buildMonster','monMat']}); const G=c.G(); const names=[]; let bad=null;
  for(const d of G.ALL_MON_DEFS.filter(d=>d.cave)){ names.push(d.id); try{ const g=new (require('three').Group)(); const parts=G.buildMonster(d,G.monMat(d.glow),g); let tris=0; g.traverse(o=>{ if(o.isMesh){ tris+=o.geometry.attributes.position.count; if(!o.geometry.attributes.normal) bad=bad||d.id+' has no normals'; } }); if(!tris) bad=bad||d.id+' is empty'; }catch(e){ bad=bad||d.id+': '+e.message; } }
  ok('every cave kind ('+names.length+') has a model that builds, with normals',names.length===40&&!bad,bad||''); }catch(e){ ok('model build check ran',false,e.message); }
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
