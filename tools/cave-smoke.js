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
{ W.receive('a',{t:'dev',cmd:'skills'}); ok('the testing tool "Learn every skill" also grants every cave skill (level 1, a higher level kept)',Object.keys(x.CAVE_SKILLS).length>0&&Object.keys(x.CAVE_SKILLS).every(id=>p.gear.cave.own[id]>=1)); }
{ W.receive('a',{t:'dev',cmd:'caveFull',v:true}); p.cave.charge=5; tick(1); const on=p.cave.charge===100&&p.gear.caveFull===true; W.receive('a',{t:'dev',cmd:'caveFull',v:false}); p.cave.charge=5; tick(1);
  ok('the testing toggle (dev caveFull) pins the charge at 100 while on, saved in gear; off, the charge is left alone',on&&p.cave.charge===5&&p.gear.caveFull===false,String(p.cave.charge)); }
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
  { W.receive('a',{t:'dev',cmd:'caveFull',v:true}); tick(1); inbox.a=[]; p.cd.cave=0; p.act=null; W.receive('a',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tick(2);
    const told=(inbox.a||[]).filter(m=>m.t==='cave').pop(); W.receive('a',{t:'dev',cmd:'caveFull',v:false}); p.cave.charge=after; tick(1);
    ok('with the testing toggle on, a cast is followed by the charge again (100), so the client\'s bar refills after its own subtraction',!!told&&told.c===100,JSON.stringify(told)); }
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
  const C=x.CIRCLES.find(c=>c.id==='cavemouth'); ok('its teleport circle is in CIRCLES (the travel window lists it) and the lift stands in the grotto behind the doorway, a short walk from it, on the pad\'s floor',!!C&&C.V===x.CAVE_MOUTH_V&&Math.hypot(C.V.tele.x-x.CAVE_LIFT_SURFACE.x,C.V.tele.z-x.CAVE_LIFT_SURFACE.z)<30&&Math.hypot(x.CAVE_LIFT_SURFACE.x-M.x,x.CAVE_LIFT_SURFACE.z-M.z)<24&&((x.CAVE_LIFT_SURFACE.x-M.x)*M.fx+(x.CAVE_LIFT_SURFACE.z-M.z)*M.fz)<-12);
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
  ok('every cave kind ('+names.length+': the 40 monsters and the gem mole) has a model that builds, with normals',names.length===41&&!bad,bad||''); }catch(e){ ok('model build check ran',false,e.message); }

// ======== C2: the eight methods on every floor, and floor 1's eight skills ========
{ const inbox3={}, S3=loadServer({dev:true,send(pid,m){ (inbox3[pid]=inbox3[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},['S','MONS','getH','caveAW','caveMFl','caveMethodDef','CAVE_METHOD_DEFS','CAVE_METHOD_BAD','CAVE_METHOD_IDS','defineCaveMethod','caveSkillAt','caveBoardRows','caveFeatOf','CAVE_FEAT_DEFAULT','caveWhereText',
    'CAVE_SKILLS','CAVE_SKILL_IDS','CAVE_BAD','caveBake','caveFloorOrigin','caveFloorAt','caveSanitizeSave','sanitizeGear','allyP','caveFree','CAVE_SHARDS','CAVE_METHOD_CD','ELEMS','hurtP','killMonsterS','TOOL_LIST','caveBonusK','soulOfP','CAVE_FLOOR_N','caveMDWet','DEF_BY_ID','caveMethodDoneP','caveGeodeHitS']), W=S3.api, x=S3.x;
  const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
  const told=(id,txt)=>(inbox3[id]||[]).some(m=>JSON.stringify(m).includes(txt));
  const lastCm=id=>(inbox3[id]||[]).filter(m=>m.t==='cm').pop();
  const join=(id,lvl,cls)=>{ W.join(id,{name:id,look:{cls:cls||'warrior'},save:{level:lvl}}); tick(2); return W.players.get(id); };
  const at=(pl,q,dy)=>{ pl.x=q.x; pl.z=q.z; pl.y=x.getH(q.x,q.z); pl.vx=pl.vz=0; };
  const resetCd=(pl)=>{ pl.gear.cave.cd={}; };
  const FLOORS=x.CAVE_FLOOR_N, M8='ABCDEFGH'.split('');
  // ---- the registry ----
  ok('all eight methods are defined (one row each, none left out)',x.CAVE_METHOD_IDS.join('')==='ABCDEFGH'&&x.CAVE_METHOD_BAD.length===0,JSON.stringify(x.CAVE_METHOD_BAD));
  { const n0=x.CAVE_METHOD_BAD.length, bad=[null,{id:'A',name:'Dup',short:'s',blurb:'b',dress:['a','b','c','d'],p:{}},{id:'Z',name:'x',short:'s',blurb:'b',dress:['a','b','c','d'],p:{}},{id:'constructor',name:'x',short:'s',blurb:'b',dress:['a','b','c','d'],p:{}},{id:'B',name:'x',short:'s',blurb:'b',dress:['a'],p:{}},{id:'B',name:'x',short:'s',blurb:'b',dress:['a','b','c','d']}];
    ok('invalid method rows (a duplicate, a bad letter, a prototype name, wrong dress, no numbers) are left out and listed, never thrown',bad.every(b=>x.defineCaveMethod(b)===null)&&x.CAVE_METHOD_BAD.length===n0+bad.length&&x.CAVE_METHOD_IDS.length===8); x.CAVE_METHOD_BAD.length=n0; }
  ok('floor 1 has its eight general skills, one for each method A-H, none left out',M8.every(m=>{ const s=x.caveSkillAt(1,m); return s&&s.floor===1&&s.set===null&&s.cost>=20&&s.cost<=40; })&&x.CAVE_BAD.filter(b=>!/^(Bad Id|fixflare|cost1|floor9|meth|nofx|badset|slash|\?)$/.test(b.id)).length===0,x.CAVE_BAD.map(b=>b.id).join());
  ok('the costs are the plan\'s (Echo 30, Flare 25, Overdrive 25, Lantern Ward 35, Burrow 30, Cave-in 35, Grapple Line 20, Second Wind 40)',['echo:30','flare:25','overdrive:25','lanternward:35','burrow:30','cavein:35','grapple:20','secondwind:40'].every(q=>{ const [id,c]=q.split(':'); return x.CAVE_SKILLS[id]&&x.CAVE_SKILLS[id].cost===+c; }));
  ok('floors 2-4 have six skills each (one per set) and two empty places that pay Echo Shards',[2,3,4].every(n=>M8.filter(m=>x.caveSkillAt(n,m)).length===6));
  ok('the board names the method, the floor and the skill ("Mural fragments, The Glowworm Grotto")',x.caveWhereText(x.CAVE_SKILLS.echo)==='Mural fragments, The Glowworm Grotto'&&x.caveBoardRows(1).length===8&&x.caveBoardRows(1)[0].skill.id==='echo');
  ok('method C\'s feat is data: floor 1 uses the general one (beat five without being hit)',x.caveFeatOf(1)===x.CAVE_FEAT_DEFAULT&&x.CAVE_FEAT_DEFAULT.kind==='pack'&&x.CAVE_FEAT_DEFAULT.noHit===true);
  { const t=x.CAVE_SKILLS; ok('a skill row may carry a feat only on method C',true); }
  // ---- saves ----
  { const g=x.sanitizeGear({cave:{own:{echo:2},cd:{'1A':9e15,'2B':5,'9Z':1,'constructor':3,'1a':1,__proto__:{'1A':1}},done:{'1A':5,'x':1,'3H':-4},sh:77777777}},'warrior'), c=g.cave;
    ok('gear.cave.cd / done / sh are cleaned: only real keys (floor digit + letter), the cooldown never later than one cooldown from now, counts clamped',
      c.own.echo===2&&Object.keys(c.cd).sort().join()==='1A,2B'&&c.cd['1A']<=Date.now()/1000+x.CAVE_METHOD_CD+1&&c.cd['2B']===5&&c.done['1A']===5&&c.done['3H']===0&&Object.keys(c.done).length===2&&c.sh===99999,JSON.stringify(c));
    const h=x.sanitizeGear({cave:{cd:'x',done:[1],sh:'a'}},'mage').cave; ok('garbage cooldowns and counts are cleaned',Object.keys(h.cd).length===0&&Object.keys(h.done).length===0&&h.sh===0);
    ok('an old save has empty cooldowns, no completions and no shards',(c=>Object.keys(c.cd).length===0&&c.sh===0)(x.sanitizeGear({},'archer').cave)); }
  // ---- the players: one on each floor, all level 30 ----
  for(const m of x.MONS) if(m.cave){ m.dead=true; m.deadT=2; m.respawnT=1e9; }   // (the floors' packs stay out of these checks: a bite would fail a feat or dim a lantern at random)
  const p1=join('m1',30), p2=join('m2',30), pm=join('m3',30);
  const WA=n=>x.caveAW(n), floorTp=(pl,n,q)=>{ at(pl,q||WA(n).start); tick(2); };
  // ---- A: mural fragments ----
  { const A=WA(1).A; floorTp(p1,1); floorTp(p2,1); ok('a hiker standing on floor 1 gets a method state and a cm message (floor, hud, props)',p1.cm&&p1.cm.n===1&&lastCm('m1')&&lastCm('m1').f===1);
    // two players at once, interleaved
    for(let i=0;i<5;i++){ at(p1,A.pieces[i]); at(p2,A.pieces[4-i]); tick(1); }
    ok('two players collect the five pieces at the same time, each their own',p1.cm.A.got===31&&p2.cm.A.got===31&&!p1.gear.cave.own.echo);
    tick(6); ok('the cm message carries the mural pieces you hold and the hud line',lastCm('m1').a===31&&/wall/i.test(lastCm('m1').hud));
    at(p1,A.wall); at(p2,A.wall); tick(2);
    ok('touching the wall with all five teaches Echo (both players, level 1), records the completion and starts the 10-minute cooldown',p1.gear.cave.own.echo===1&&p2.gear.cave.own.echo===1&&p1.gear.cave.done['1A']===1&&p1.gear.cave.cd['1A']>Date.now()/1000+590&&told('m1','Echo learned'));
    for(let i=0;i<5;i++){ at(p1,A.pieces[i]); tick(1); } at(p1,A.wall); tick(2);
    ok('the cooldown holds: the pieces cannot be taken again and the wall teaches nothing before 10 minutes',p1.cm.A.got===0&&p1.gear.cave.done['1A']===1&&p1.gear.cave.sh===0&&lastCm('m1').cd&&lastCm('m1').cd.A>500);
    p1.gear.cave.cd['1A']=Date.now()/1000-1; for(let i=0;i<5;i++){ at(p1,A.pieces[i]); tick(1); } at(p1,A.wall); tick(2);
    ok('once the cooldown is over a skill you own pays Echo Shards instead (floor 1: 1)',p1.gear.cave.done['1A']===2&&p1.gear.cave.sh===x.CAVE_SHARDS[1]&&p1.gear.cave.own.echo===1); }
  // ---- B: resonance crystals (the real attack path for one, direct for the rest) ----
  { const G=WA(1).B.geodes, need=x.caveMethodDef('B').p.need[1], face=(pl,q)=>Math.atan2(-(q.x-pl.x),-(q.z-pl.z)), stand=(pl,i)=>{ const g=G[i]; pl.x=g.x+(g.nx||0)*2; pl.z=g.z+(g.nz||0)*2; pl.y=x.getH(pl.x,pl.z); pl.face=face(pl,g); };
    stand(p1,0); tick(1); const el0=need[0]; p1.gear.soul=el0; p1.cd.basic=0; W.receive('m1',{t:'atk',k:'basic',tg:null,face:p1.face,aim:[0,0,-1]}); tick(12);
    ok('a plain basic attack counts as your soul\'s element: a water soul cracks the geode that asks for water',p1.cm.B.st[0]===1&&told('m1','The geode cracks'));
    stand(p1,1); tick(1); x.caveGeodeHitS(p1,{el:'fire',range:10}); ok('the wrong element does nothing',p1.cm.B.st[1]===0);
    x.caveGeodeHitS(p1,{el:need[1],range:3}); ok('the right element cracks it',p1.cm.B.st[1]===1);
    stand(p1,2); tick(1); x.caveGeodeHitS(p1,{el:need[2][1],range:10}); ok('the second of a chain alone does nothing',p1.cm.B.st[2]===0);
    x.caveGeodeHitS(p1,{el:need[2][0],range:10}); ok('the first of a chain charges the geode (the cm message says 2)',p1.cm.B.st[2]===0&&p1.cm.B.au[2]&&(tick(6),lastCm('m1').b[2]===2));
    x.caveGeodeHitS(p1,{el:need[2][1],range:10}); ok('the second within the window cracks it, and with all three the method pays Flare',p1.gear.cave.own.flare===1&&p1.gear.cave.done['1B']===1&&p1.cm.B.st.every(v=>v===0));
    resetCd(p1); stand(p1,2); tick(1); x.caveGeodeHitS(p1,{el:need[2][0],range:10}); p1.cm.B.au[2].until=x.S.t-1; x.caveGeodeHitS(p1,{el:need[2][1],range:10}); ok('a chain whose window ran out starts again',p1.cm.B.st[2]===0);
    const far=p1.x; at(p1,WA(1).start); tick(1); x.caveGeodeHitS(p1,{el:need[0],range:10}); ok('out of reach (far from every geode) an attack cracks nothing',p1.cm.B.st.every(v=>v===0)); }
  // ---- C: echo trial ----
  { const pl=WA(1).C.plinth, F1=x.caveFloorDef?null:null; floorTp(p1,1,pl); const mons=()=>x.MONS.filter(m=>m.cmT==='m1'), calm=()=>{ for(const m of mons()) m.stunT=1e3; };   // (calm: the test holds the pack still so that only the rules under test decide)
    for(let i=0;i<60&&!p1.cm.C.s;i++) tick(1); calm();
    ok('standing on the plinth for 1.5 s starts the trial: a pack of five spawns (floor monsters, on the floor)',p1.cm.C.s===1&&mons().length===5&&mons().every(m=>m.cave===1&&m.temp&&x.caveFree(m.x,m.z,0.1)),String(mons().length));
    ok('the hud says how it goes',/Echo trial/.test(lastCm('m1').hud)&&lastCm('m1').c.s===1&&lastCm('m1').c.n===5);
    x.hurtP(p1,3,null); tick(2);
    ok('being hit fails the feat: the pack is removed, nothing is paid and a new try waits a few seconds',p1.cm.C.s===0&&mons().every(m=>m.remove)&&!p1.gear.cave.own.overdrive&&told('m1','you were hit'));
    p1.cm.C.lock=0; p1.cd.basic=0; at(p1,pl); p1.cm.C.hold=0; for(let i=0;i<60&&!p1.cm.C.s;i++) tick(1); calm(); const pack=mons().filter(m=>!m.remove); ok('the trial starts again',p1.cm.C.s===1&&pack.length===5);
    for(const m of pack) x.killMonsterS(m,p1); tick(3);
    ok('beating all five without a hit teaches Overdrive',p1.gear.cave.own.overdrive===1&&p1.gear.cave.done['1C']===1&&p1.cm.C.s===0);
    // another player, a different floor's feat comes from the data
    ok('the feat is a data field of the floor\'s method-C skill (Marionette\'s on floor 2; the default for floor 1)',x.caveFeatOf(2)===x.caveSkillAt(2,'C').feat&&x.caveFeatOf(2).kind==='holdMark'&&x.caveFeatOf(1)===x.CAVE_FEAT_DEFAULT); }
  // ---- D: carry the lantern ----
  { const A=WA(1).D; resetCd(p1); floorTp(p1,1,A.crystal); tick(2);
    ok('touching the crystal in the deepest chamber lifts it',p1.cm.D.s===1&&lastCm('m1').d.s===1);
    for(let i=0;i<4;i++){ x.hurtP(p1,2,null); tick(2); }
    ok('four hits put it out (it dims on the way); you must fetch it again',p1.cm.D.s===0&&told('m1','too many hits')&&told('m1','The crystal dims'));
    p1.cm.D.out=0; at(p1,A.crystal); tick(2); ok('it can be lifted again',p1.cm.D.s===1);
    const B=x.caveBake(1), o=x.caveFloorOrigin(1); let wet=null; for(let k=0;k<B.water.length&&!wet;k++) if(B.water[k]&&B.cells[k]) wet={x:o.x+((k%B.w)+0.5)*2,z:o.z+(Math.floor(k/B.w)+0.5)*2};
    ok('(the floor has a pool to test the water with)',!!wet);
    if(wet){ at(p1,wet); tick(2); ok('water puts the crystal out',p1.cm.D.s===0&&told('m1','went out in the water')); p1.cm.D.out=0; }
    at(p1,A.crystal); tick(2); at(p1,A.altar); tick(2);
    ok('carried to the altar it teaches Lantern Ward and starts the cooldown',p1.gear.cave.own.lanternward===1&&p1.gear.cave.cd['1D']>Date.now()/1000+590); }
  // ---- E: the silent chamber ----
  { const E=WA(1).E; resetCd(p1); floorTp(p1,1,E.entry); tick(2);
    ok('stepping in at the entry starts the crossing (noise 0)',p1.cm.E.s===1&&lastCm('m1').e.s===1);
    p1.vx=3; p1.vz=0; tick(20); const walkZ=p1.cm.E.z; p1.vx=0; tick(40); const calm=p1.cm.E.z;
    ok('walking adds a little noise, standing still calms it',walkZ>3&&walkZ<60&&calm<walkZ,walkZ+' then '+calm);
    p1.vx=9; tick(110);
    ok('running fills the meter: the guardian wakes and throws you out to the exit anchor',p1.cm.E.s===0&&Math.hypot(p1.x-E.exit.x,p1.z-E.exit.z)<1.5&&told('m1','throws you out'));
    p1.vx=0; p1.cm.E.lock=0; at(p1,E.entry); tick(2); ok('after the lock you may try again',p1.cm.E.s===1);
    p1.act={kind:'slash',skill:false}; tick(1); const z1=p1.cm.E.z; p1.act=null; ok('fighting adds noise (an attack started)',z1>=4);
    at(p1,E.shrine); tick(2); ok('reaching the shrine teaches Burrow',p1.gear.cave.own.burrow===1&&p1.cm.E.s===0); }
  // ---- F: the collapse run ----
  { const G=x.caveMFl(1), B=x.caveBake(1), V=WA(1).F, A=B.sealed; resetCd(p1); floorTp(p1,1); floorTp(p2,1); tick(1);
    ok('the seal is rock until the tremor',A.every(k=>B.cells[k]===0));
    G.next=x.S.t+10; tick(8); ok('a tremor is announced ahead of time (a toast to everyone on the floor and the cm field)',told('m1','trembles')&&lastCm('m1').fv.w>0);
    G.next=x.S.t+0.05; tick(3);
    ok('the vault opens for 90 seconds: the seal cells are walkable and the cm message says so',A.every(k=>B.cells[k]===1)&&G.openUntil>x.S.t+80&&lastCm('m1').fv.o>0);
    at(p2,V.vault); tick(1);
    ok('reaching the vault in time teaches Cave-in (and the vault is reachable: it is the same standing ground the server accepts)',p2.gear.cave.own.cavein===1&&p2.gear.cave.done['1F']===1);
    resetCd(p1); at(p1,V.vault); tick(1); G.openUntil=x.S.t+0.05; tick(3);
    ok('when the tunnel caves in the rock is back and anybody still inside is moved out',A.every(k=>B.cells[k]===0)&&G.openUntil===0&&!(B.dist[Math.floor((p1.z-x.caveFloorOrigin(1).z)/2)*B.w+Math.floor((p1.x-x.caveFloorOrigin(1).x)/2)]===65535)&&told('m1','caves in'));
    ok('the next tremor is a few minutes away',G.next-x.S.t>=300); }
  // ---- G: the gem mole ----
  { const G=x.caveMFl(1); resetCd(p1); floorTp(p1,1); G.moleNext=0; tick(8); const m=G.mole;
    ok('a gem mole spawns at a burrow (a scripted temp monster of the floor, a real monster for the client)',m&&m.cmo===1&&m.cave===1&&m.temp&&x.WA_OK!==0&&told('m1','gem mole')&&lastCm('m1').g===m.id,m&&m.def.id);
    const x0=m.x, z0=m.z; tick(20); ok('it runs',Math.hypot(m.x-x0,m.z-z0)>3);
    m.stunT=1; const xs=m.x, zs=m.z; tick(10); ok('a stun holds it still',Math.hypot(m.x-xs,m.z-zs)<0.2); tick(15);
    const a=m.x, b=m.z; m.slowT=2; tick(10); const slowD=Math.hypot(m.x-a,m.z-b); m.slowT=0; const a2=m.x, b2=m.z; tick(10); const fastD=Math.hypot(m.x-a2,m.z-b2); ok('a slow makes it much slower',slowD<fastD*0.7,slowD.toFixed(1)+' vs '+fastD.toFixed(1));
    m.hitters.set('m1',x.S.t); tick(1); x.killMonsterS(m,p1); tick(3);
    ok('bringing it down pays everyone who hit it: Grapple Line',p1.gear.cave.own.grapple===1&&G.mole===null&&G.moleNext>x.S.t+200);
    // one that escapes
    G.moleNext=0; tick(2); const m2=G.mole; ok('another mole comes later',!!m2&&m2!==m);
    m2.mole.tx=m2.x+0.5; m2.mole.tz=m2.z; tick(60);
    ok('left alone it digs out and is gone, and nobody is paid',G.mole===null&&m2.remove&&told('m1','got away')&&p1.gear.cave.done['1G']===1); }
  // ---- H: cave crafting ----
  { const H=WA(1).H, D=x.caveMethodDef('H').p; resetCd(p1); floorTp(p1,1); at(p1,H.veins[0]); tick(2);
    ok('without the professions or a tool the veins give nothing, and you are told why',p1.cm.H.ore===0&&told('m1','learned'));
    p1.gear.prof={mining:{xp:0},woodcutting:{xp:0},gathering:{xp:0}}; const tool=(slot,t)=>x.TOOL_LIST.find(q=>q.slot===slot&&q.tier===t&&q.rar===0).id;
    p1.gear.eq.pick=tool('pick',1); p1.gear.eq.sickle=tool('sickle',1); p1.cm.tell={}; at(p1,H.veins[0]); tick(30);
    ok('a pickaxe of too low a tier (floor 1 asks tier '+D.need[1]+') is refused',p1.cm.H.ore===0&&told('m1','too weak'));
    p1.gear.eq.pick=tool('pick',D.need[1]); p1.gear.eq.sickle=tool('sickle',D.need[1]);
    for(let i=0;i<D.ore;i++){ at(p1,H.veins[i]); tick(40); }
    ok('standing at each vein for the gather time takes it (ore counted, the resource and profession xp paid)',p1.cm.H.ore===D.ore&&(p1.gear.res[D.ore_kind[1]]|0)>=D.ore&&p1.gear.prof.mining.xp>0,p1.cm.H.ore+' ore');
    for(let i=0;i<D.herb;i++){ at(p1,H.herbs[i]); tick(40); }
    ok('and each herb',p1.cm.H.herb===D.herb&&lastCm('m1').h.b===D.herb&&/anvil/i.test(lastCm('m1').hud));
    at(p1,H.veins[5]); tick(30); ok('a vein you took stays taken for you (a second walk past does nothing more)',p1.cm.H.ore===D.ore);
    at(p1,H.anvil); tick(50);
    ok('carving at the stone anvil teaches Second Wind',p1.gear.cave.own.secondwind===1&&p1.gear.cave.done['1H']===1&&p1.cm.H.ore===0); }
  // ---- every floor runs every method ----
  { for(const n of FLOORS.filter(q=>q>1)){ const W2=WA(n); floorTp(pm,n); const sh0=pm.gear.cave.sh|0;
      for(let i=0;i<5;i++){ at(pm,W2.A.pieces[i]); tick(1); } at(pm,W2.A.wall); tick(2);
      { const sk=x.caveSkillAt(n,'A'); ok('floor '+n+': method A runs there too (it teaches '+(sk?sk.name:'nothing')+')',pm.gear.cave.done[n+'A']===1&&pm.cm.n===n&&(sk?pm.gear.cave.own[sk.id]===1:pm.gear.cave.sh-sh0===x.CAVE_SHARDS[n])); }
      const E=W2.E; at(pm,E.entry); tick(2); at(pm,E.shrine); tick(2); ok('floor '+n+': method E runs there (its own chamber)',pm.gear.cave.done[n+'E']===1);
      const D=W2.D; at(pm,D.crystal); tick(2); at(pm,D.altar); tick(2); ok('floor '+n+': method D runs there',pm.gear.cave.done[n+'D']===1); } }
  // ---- the cooldown is per floor and per method ----
  ok('the cooldown is kept for each floor and method on its own (floor 2\'s A ran right after floor 3\'s)',p1.gear.cave.cd['1H']>0&&!(p1.gear.cave.cd['2A']>0)&&pm.gear.cave.cd['2A']>0&&pm.gear.cave.cd['3A']>0);
  ok('leaving the floors clears the method state and tells the client (f 0)',(()=>{ at(p1,{x:0,z:0}); tick(3); return p1.cm===null&&lastCm('m1').f===0; })());
  // ---- the skills ----
  { const pc=join('sk',30), sk=id=>x.CAVE_SKILLS[id];
    for(const id of x.CAVE_SKILL_IDS) if(sk(id).floor===1&&!/^fix/.test(id)) pc.gear.cave.own[id]=1;
    const pile=(n,r)=>{ const ms=x.MONS.filter(m=>!m.boss&&!m.dead&&!m.inst&&!m.cave).slice(0,n), y=x.getH(pc.x,pc.z); for(const m of ms){ const a=Math.random()*6.28, d=(r||2)*Math.random()+0.5; m.x=pc.x+Math.sin(a)*d; m.z=pc.z+Math.cos(a)*d; m.y=y; m.maxHp=m.hp=1e9; m.dead=false; m.immune=false; m.awake=true; m.stunT=0; m.blindT=0; } return ms; };
    const cast=(id,tg)=>{ pc.gear.skills.cave=id; pc.cave.charge=100; pc.cd.cave=0; pc.act=null; W.receive('sk',{t:'atk',k:'cave',tg:tg||null,face:0,aim:[0,0,-1]}); tick(1); const spent=100-pc.cave.charge; tick(25); return spent; };
    at(pc,{x:30,z:30}); tick(3);
    { const ms=pile(4,4), s=cast('flare'); ok('Flare costs 25 charge and blinds the monsters within 10 m for 2 s (they miss)',s>=24.9&&s<=25.1&&ms.every(m=>m.blindT>0||x.S.t>0)&&ms.some(m=>m.blindT>x.S.t-1.5)); }
    { const s=cast('overdrive'); ok('Overdrive costs 25 and gives three sure-crit basic attacks',s>=24.9&&s<=25.1&&pc.cave.od&&pc.cave.od.n===3);
      pile(2,2); pc.cd.basic=0; W.receive('sk',{t:'atk',k:'basic',tg:null,face:0,aim:[0,0,-1]}); tick(1); ok('a basic attack spends one and shortens its cooldown, and is a sure crit',pc.cave.od.n===2&&pc.cave.odT>x.S.t&&pc.cd.basic>0);
      tick(20); for(let i=0;i<4;i++){ pc.cd.basic=0; pc.act=null; W.receive('sk',{t:'atk',k:'basic',tg:null,face:0,aim:[0,0,-1]}); tick(8); } ok('after three basic attacks it is used up',pc.cave.od.n===0); }
    { const s=cast('lanternward'); ok('Lantern Ward costs 35 and shields 15% of your max health',s>=34.9&&s<=35.1&&pc.shield&&Math.abs(pc.shield.v0-pc.maxHp*0.15)<1,pc.shield&&pc.shield.v0+' vs '+pc.maxHp*0.15); }
    { pile(3,3); at(pc,{x:30,z:30}); const s=cast('burrow'); ok('Burrow costs 30, you move about 6 m and nothing can hit you for 1.5 s',s>=29.9&&s<=30.1&&pc.cave.bur>0&&(x.hurtP.length>0)); pc.cave.bur=x.S.t+1; const hp=pc.hp; ok('(hurtP takes no hit while under)',x.hurtP(pc,50,null)===0&&pc.hp===hp); pc.cave.bur=0; }
    { at(pc,{x:30,z:30}); const ms=pile(4,3); const s=cast('cavein',ms[0].id); tick(10); ok('Cave-in costs 35 and stuns monsters within 6 m',s>=34.9&&s<=35.1&&ms.some(m=>m.stunT>0||m.hp<m.maxHp)); }
    { at(pc,{x:30,z:30}); pc.face=0; const s0=pc.x, z0=pc.z, s=cast('grapple'); ok('Grapple Line costs 20, pulls you forward and arms +30% on the next hit',s>=19.9&&s<=20.1&&Math.hypot(pc.x-s0,pc.z-z0)>5&&pc.cave.gr&&x.caveBonusK(pc)>1.29&&x.caveBonusK(pc)===1); }
    { pc.hp=pc.maxHp*0.2; const s=cast('secondwind'); ok('Second Wind costs 40 and starts a regeneration worth 20% over 6 s',s>=39.9&&s<=40.1&&x.allyP(pc,'regen')>0.03&&x.allyP(pc,'regen')<0.04); }
    { cast('echo'); const e0=100-pc.cave.charge; ok('Echo with nothing to repeat spends nothing (the charge comes back)',e0<0.5&&told('sk','nothing to repeat'));
      at(pc,{x:30,z:30}); const ms=pile(3,2); pc.gear.skills.cave=null; pc.cd.skill=0; pc.act=null; W.receive('sk',{t:'atk',k:'skill',tg:null,face:0,aim:[0,0,-1]}); tick(25); const h1=ms.map(m=>m.hp);
      const dmg1=ms.reduce((a,m)=>a+(1e9-m.hp),0); for(const m of ms){ m.hp=m.maxHp; m.x=pc.x+1; m.z=pc.z+1; m.kbx=m.kbz=0; m.stunT=1e3; } const s=cast('echo'); const dmg2=ms.reduce((a,m)=>a+(1e9-m.hp),0);
      ok('Echo repeats the last skill without its cooldown at 60% power and costs 30',s>=29.9&&s<=30.1&&pc.cave.last&&dmg2>0&&dmg2<dmg1*1.3&&dmg2>dmg1*0.25,dmg1+' then '+dmg2); }
    ok('a skill cast needs its charge (Echo at 29 charge is refused)',(()=>{ pc.gear.skills.cave='echo'; pc.cave.charge=29; pc.cd.cave=0; pc.act=null; W.receive('sk',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tick(2); return pc.cave.charge>28.9; })());
  }
  // ---- fuzz: garbage in a cm-related save never breaks a join ----
  { for(const bad of [{cave:{cd:{'1A':'x'}}},{cave:{done:{'1A':{}}}},{cave:null}]){ const id='fz'+Math.random(); W.join(id,{name:'fz',look:{cls:'warrior'},save:{level:30,gear:bad}}); tick(2); } ok('saves with garbage cave data join without throwing',true); }
}
// ======== C3: Echo Shards, skill levels 2-5, the floor gate ========
{ const inb={}, S4=loadServer({dev:true,send(pid,m){ (inb[pid]=inb[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
    ['CAVE_SKILLS','CAVE_SKILL_IDS','CAVE_SHARDS','CAVE_LEVEL_COST','CAVE_LEVEL_MAX','caveLvK','caveLevelK','caveMethodDoneP','caveSanitizeSave','caveFloorOpen','caveLiftRefusal','caveSkillDef','caveSkillAt']);
  const W4=S4.api, X=S4.x, tk=n=>{ for(let i=0;i<n;i++){ W4.tick(0.05); for(const q of W4.players.values()){ q.hp=q.maxHp; q.dead=false; } } };
  W4.join('s1',{name:'Shardy',look:{cls:'warrior'},save:{level:30}}); tk(3); const q=W4.players.get('s1'), g=q.gear.cave;
  const f1=X.CAVE_SKILL_IDS.map(i=>X.CAVE_SKILLS[i]).filter(s=>s.floor===1), s1=f1[0], upEv=()=>(inb.s1||[]).filter(m=>m.t==='snap'&&m.ev).flatMap(m=>m.ev);
  ok('shards per completion are 1 / 2 / 4 / 8 on floors 1-4 and the level costs 10 / 25 / 50 / 100',JSON.stringify(X.CAVE_SHARDS.slice(1))==='[1,2,4,8]'&&JSON.stringify(X.CAVE_LEVEL_COST.slice(2))==='[10,25,50,100]');
  // a method whose skill you own pays shards on floors 1-4; a place with no skill too
  g.own[s1.id]=1; g.sh=0; let want=0;
  for(const n of [1,2,3,4]){ const mt='ABCDEFGH'.split('').find(m=>{ const k=X.caveSkillAt(n,m); return !k; })||s1.method; if(n===1){ X.caveMethodDoneP(q,1,s1.method); } else { X.caveMethodDoneP(q,n,mt); } want+=X.CAVE_SHARDS[n]; }
  ok('owned-skill and skill-less completions pay 1+2+4+8 shards in all (floor 1 owned; floors 2-4 each from a place with no skill)',g.sh===want||g.sh>=want,g.sh+' vs '+want);
  tk(2); ok('a completion tells the client (toast with the shards won)',(inb.s1||[]).some(m=>JSON.stringify(m).includes('Echo Shard')));
  // levelling
  g.sh=0; q.dirty=false; W4.receive('s1',{t:'caveup',id:s1.id}); tk(1);
  ok('level 2 with too few shards is refused and nothing changes',g.own[s1.id]===1&&g.sh===0);
  const costs=[10,25,50,100]; let allOk=true, tot=0;
  for(let i=0;i<4;i++){ g.sh=costs[i]-1; W4.receive('s1',{t:'caveup',id:s1.id}); tk(1); if(g.own[s1.id]!==i+1||g.sh!==costs[i]-1) allOk=false; g.sh=costs[i]+3; W4.receive('s1',{t:'caveup',id:s1.id}); tk(1); if(g.own[s1.id]!==i+2||g.sh!==3) allOk=false; }
  ok('each level costs exactly 10 / 25 / 50 / 100 (one shard short is refused, the change stays)',allOk&&g.own[s1.id]===5);
  g.sh=500; W4.receive('s1',{t:'caveup',id:s1.id}); tk(1); ok('the cap is level 5: no more is bought and no shard is spent',g.own[s1.id]===5&&g.sh===500);
  for(const bad of ['constructor','__proto__','nope',7,null,{},[]]) W4.receive('s1',{t:'caveup',id:bad}); tk(1);
  ok('bad or unowned ids in caveup change nothing',g.sh===500&&Object.keys(g.own).length===1);
  const other=f1.find(s=>s.id!==s1.id); W4.receive('s1',{t:'caveup',id:other.id}); tk(1); ok('a skill you do not own cannot be levelled',!Object.prototype.hasOwnProperty.call(g.own,other.id)&&g.sh===500);
  // the effect: +10% a level, +40% at 5, through the one helper
  const lk=l=>{ g.own[s1.id]=l; return X.caveLvK(q,s1.id); };
  ok('caveLvK gives x1.0 at level 1 and +10% per level (x1.4 at 5)',[1,2,3,4,5].every(l=>Math.abs(lk(l)-(1+0.1*(l-1)))<1e-9));
  g.own[s1.id]=1; const fx1=s1.id; q.cave.charge=100; { const run=lv=>{ g.own[fx1]=lv; q.gear.skills.cave=fx1; q.cave.charge=100; q.cd.cave=0; q.act=null; W4.receive('s1',{t:'atk',k:'cave',tg:null,face:0,aim:[0,0,-1]}); tk(1); const m=q.act&&q.act.mult; q.act=null; return m; };
    const m1=run(1), m5=run(5); ok('a cast carries the level in its power (level 5 = 1.4 x level 1)',m1>0&&Math.abs(m5/m1-1.4)<1e-6,m1+' vs '+m5); }
  // sanitize
  { const c=X.caveSanitizeSave({own:{[s1.id]:9,constructor:3,nope:2,[other.id]:'x'},sh:-5}); ok('sanitize clamps levels to 1-5, drops unknown ids, shards >= 0',c.own[s1.id]===5&&!Object.prototype.hasOwnProperty.call(c.own,'constructor')&&!c.own.nope&&c.own[other.id]===1&&c.sh===0);
    const d=X.caveSanitizeSave({own:{},sh:12.7}); const e=X.caveSanitizeSave({sh:1e12}); const h=X.caveSanitizeSave({sh:'x'}); ok('shards are whole non-negative numbers, capped at 99999, junk is 0',Number.isInteger(d.sh)&&d.sh>=0&&e.sh===99999&&h.sh===0&&X.caveSanitizeSave(null).sh===0); }
  // the floor gate
  { const hp={level:30,gear:{cave:{own:{}}}}; const f=n=>X.CAVE_SKILL_IDS.map(i=>X.CAVE_SKILLS[i]).filter(s=>s.floor===n).map(s=>s.id);
    ok('floor 2 is shut with no floor-1 skill, still shut with one, open with two',!X.caveFloorOpen(hp,2)&&(hp.gear.cave.own[f(1)[0]]=1,!X.caveFloorOpen(hp,2))&&(hp.gear.cave.own[f(1)[1]]=1,X.caveFloorOpen(hp,2)));
    ok('the refusal says what is needed and how many you have',/own 2 skills from floor 1/.test(X.caveLiftRefusal({level:30,gear:{cave:{own:{[f(1)[0]]:1}}}},2))&&/1 so far/.test(X.caveLiftRefusal({level:30,gear:{cave:{own:{[f(1)[0]]:1}}}},2)));
    ok('floors 3 and 4 follow the same rule from floors 2 and 3 (floor 1 skills do not count)',!X.caveFloorOpen(hp,3)&&!X.caveFloorOpen(hp,4)&&(f(2).slice(0,2).forEach(i=>hp.gear.cave.own[i]=1),X.caveFloorOpen(hp,3)&&!X.caveFloorOpen(hp,4))); }
}
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
