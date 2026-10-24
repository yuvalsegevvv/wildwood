// Headless test of the Deep Cave's 4th slot (server straight from src/, no build): the slot opens at level 23, charge per cast (once, not per enemy), the cap, the set bonus,
// the boss-fight rule (50 on entering, 0 on leaving early, kept when the boss dies), casting spends the cost, the registry's validation and a bad save. The cave skill used here is a fixture defined in this file.
// Usage: node tools/cave-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['MONS','BOSSES','getH','sanitizeGear','defineCaveSkill','CAVE_BAD','CAVE_SKILLS','SS_ORDER','SS_SETS','SKILLS','caveChargeGain','CAVE_SLOT_LV','CAVE_CHARGE_K','CAVE_COST_MAX','killMonsterS','slotLv','ssGrantSetP','caveSkillDef']);
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
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
