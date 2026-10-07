// Headless test of the skill-set base (server straight from src/, no build): the registry and its checks, the expansion into skills and passives, granting, wearing a piece for all three classes,
// counting the worn pieces and the 3- / 5-set bonuses, saves, and what a piece may not do (be bought, upgraded, come free). The sets here are FIXTURES defined inside this file: no kit is in src/.
// Usage: node tools/skillsets-smoke.js        (plan and rules: docs/SKILL-SETS.md; how a set is written: docs/skillkits/AUTHORING.md)
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(pid==='a'&&c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SKILL_IDS','PASSIVE_IDS','ANIM_OF','ACT_SKILL','SS_SETS','SS_ORDER','SS_BAD','SS_PIECE_OF','SS_SOURCES','defineSkillSet','ssCount','ssBonuses','ssBonusSum','ssSetFor','ssLint','ssOwnsBasic',
   'abilityOf','abilityCd','canSwap','newSkills','sanitizeSkills','sanitizeGear','psP','recalcP','clsOfP','passiveOpen','passiveSum','PASSIVE_SLOT_LV','getH','ZTIER_MAX']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const quiet=fn=>{ const w=console.warn; console.warn=()=>{}; try{ return fn(); } finally{ console.warn=w; } };
const J=o=>JSON.parse(JSON.stringify(o));

// ---- a fixture: a valid set definition (every piece a data-only skill), to be bent by each check below ----
const ST=(name,stat,v,extra)=>Object.assign({name,text:'+{}% '+stat,stat,v},extra);
function fixture(id,over){
  const E=(pos,k,extra)=>Object.assign({name:id+' '+pos+k,desc:'A test piece.',cd:5+pos,range:5,mult:1,act:[id+pos+k,0.6,0.4],anim:'slash'},extra);
  const d={id,name:'Test set '+id,land:'home',needs:{tier:1},dev:true,el:'fire',role:{main:'safe'},
    char:{name:'Name '+id,sex:'female',theme:'a test',ip:{kind:'original',riffs:'a genre'}},pal:{main:0xff0000,accent:0x00ff00,glow:0x0000ff},kit:{name:'Test',text:'A test kit.'},
    pos:{1:{bound:'class',skill:{warrior:E(1,'w',{fx:{cone:{r:4,arc:1.2}}}),archer:E(1,'a',{anim:'shoot'}),mage:E(1,'m',{anim:'cast'})},passive:ST('P1','dmg',[0.04,0])},
         2:{bound:'any',skill:{any:E(2,'x',{anim:'nova',fx:{ring:{r:5}}})},passive:ST('P2','crit',[0.03,0])},
         3:{bound:'any',skill:{any:E(3,'x',{anim:'nova',fx:{ring:{r:6}}})},passive:ST('P3','hp',[0.05,0])}},
    bonus:{3:ST('B3','dmg',0.10),5:ST('B5','crit',0.10)}};
  return over?over(d)||d:d;
}
const count=()=>({sets:x.SS_ORDER.length,skills:x.SKILL_IDS.length,passives:x.PASSIVE_IDS.length,acts:Object.keys(x.ACT_SKILL).length});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// ---- the registry: a valid set is expanded, a bad one is left out and listed ----
const c0=count();
const A=x.defineSkillSet(fixture('alpha'));
ok('a valid set registers',!!A&&x.SS_SETS.alpha===A&&x.SS_ORDER.includes('alpha')&&x.SS_BAD.length===0,JSON.stringify(x.SS_BAD));
ok('it is expanded into ordinary rows: 3 + 1 + 1 skills and 3 passives, ids <set>_<pos>_<class|any> and <set>_p<pos>',['alpha_1_warrior','alpha_1_archer','alpha_1_mage','alpha_2_any','alpha_3_any'].every(i=>x.SKILLS[i]&&x.SKILL_IDS.includes(i))&&['alpha_p1','alpha_p2','alpha_p3'].every(i=>x.PASSIVES[i]&&x.PASSIVE_IDS.includes(i)));
ok('the rows have their slot, class, set and position; cls "any" for a universal piece; the passives are class-less',x.SKILLS.alpha_1_mage.slot==='basic'&&x.SKILLS.alpha_1_mage.cls==='mage'&&x.SKILLS.alpha_2_any.cls==='any'&&x.SKILLS.alpha_2_any.slot==='skill'&&x.SKILLS.alpha_3_any.slot==='burst'&&x.SKILLS.alpha_3_any.pos===3&&x.SKILLS.alpha_2_any.set==='alpha'&&x.PASSIVES.alpha_p2.cls===null&&x.PASSIVES.alpha_p2.slot==='passive'&&x.PASSIVES.alpha_p2.set==='alpha');
ok('the level of a piece is its source\'s: boss 1 (15), boss 2 (20), the dungeon (30)',x.SKILLS.alpha_1_warrior.lv===15&&x.SKILLS.alpha_2_any.lv===20&&x.SKILLS.alpha_3_any.lv===30&&x.PASSIVES.alpha_p2.lv===20,[15,20,30].join());
ok('the element is the set\'s, a passive follows its position, nothing is for sale or free',Object.values(x.SKILLS).filter(s=>s.set==='alpha').every(s=>s.el==='fire'&&s.price===0&&!s.drop)&&x.PASSIVES.alpha_p1.el==='fire');
ok('the shared tables know the new attack kinds (the client draws from them)',x.ACT_SKILL.alpha1w===x.SKILLS.alpha_1_warrior&&x.ANIM_OF.alpha1a==='shoot'&&x.ANIM_OF.alpha2x==='nova');
ok('a passive row has a value array and its text; a bonus row is a number made an array, with its set and tier',same(x.PASSIVES.alpha_p1.v,[0.04,0])&&x.SS_SETS.alpha.bonus[3].v[0]===0.10&&x.SS_SETS.alpha.bonus[5].tier===5&&x.SS_SETS.alpha.bonus[3].set==='alpha');
ok('where a piece comes from is the land\'s: boss 1, boss 2, the dungeon',x.SS_SETS.alpha.pos[1].from.id==='boss'&&x.SS_SETS.alpha.pos[2].from.id==='carapax'&&x.SS_SETS.alpha.pos[3].from.id==='hollowroots'&&x.SS_SETS.alpha.pos[3].from.kind==='dungeon');
ok('piece ids map back to their set and position',x.SS_PIECE_OF.alpha_2_any.set==='alpha'&&x.SS_PIECE_OF.alpha_2_any.pos===2&&x.SS_PIECE_OF.alpha_p3.kind==='passive');

// each bad variant must be left out (nothing of it registered) and listed with its field
const BAD=[
  ['an unknown land','land',d=>{ d.land='moon'; }],
  ['tier 0','needs',d=>{ d.needs.tier=0; }],
  ['a tier above the last','needs',d=>{ d.needs.tier=x.ZTIER_MAX+1; }],
  ['a name that is not a word','id',d=>{ d.id='Bad Id'; }],
  ['no name','name',d=>{ d.name=''; }],
  ['an unknown element','el',d=>{ d.el='lava'; }],
  ['a bad role','role',d=>{ d.role.main='paladin'; }],
  ['support without a focus','role',d=>{ d.role={main:'support'}; }],
  ['a focus on a non-support','role',d=>{ d.role={main:'risk',focus:'buff'}; }],
  ['a second role of the same kind','role',d=>{ d.role={main:'safe',also:{role:'safe',part:'mild'}}; }],
  ['a hybrid support set','el',d=>{ d.role={main:'support',focus:'buff'}; d.el=['fire','earth']; }],
  ['a hybrid mixed set','el',d=>{ d.el=['fire','earth']; d.role={main:'safe',also:{role:'support',part:'mild'}}; }],
  ['a hybrid of one element repeated','el',d=>{ d.el=['fire','fire']; }],
  ['a basic set with a fire piece','el',d=>{ d.el='basic'; d.pos[2].skill.any.el='fire'; }],
  ['a single-element set with fewer than 4 of 6 pieces in it','el',d=>{ d.pos[2].skill.any.el='water'; d.pos[3].skill.any.el='water'; }],
  ['a sex that is neither','char',d=>{ d.char.sex='robot'; }],
  ['an ip that says nothing','char',d=>{ d.char.ip={kind:'original'}; }],
  ['a licensed ip without its licence','char',d=>{ d.char.ip={kind:'licensed',work:'x'}; }],
  ['colours that are not numbers','pal',d=>{ d.pal.main='red'; }],
  ['position 1 bound to any','pos',d=>{ d.pos[1].bound='any'; d.pos[1].skill={any:d.pos[1].skill.warrior}; }],
  ['a missing class version','pos',d=>{ delete d.pos[1].skill.mage; }],
  ['a position that is missing','pos',d=>{ delete d.pos[3]; }],
  ['an unknown fx key','pos',d=>{ d.pos[2].skill.any.fx={lasso:{r:3}}; }],
  ['a buff without fx:{buff:1}','pos',d=>{ d.pos[2].skill.any.buff={dur:5,dmg:1.2,cd:1,crit:0}; }],
  ['an attack kind another skill has','pos',d=>{ d.pos[2].skill.any.act=['spin',0.6,0.4]; }],
  ['the same attack kind twice inside the set','pos',d=>{ d.pos[3].skill.any.act=d.pos[2].skill.any.act.slice(); }],
  ['an animation nobody has','pos',d=>{ d.pos[2].skill.any.anim='backflip'; }],
  ['an unknown skill key','pos',d=>{ d.pos[2].skill.any.dmg=9; }],
  ['a cooldown of 0','pos',d=>{ d.pos[2].skill.any.cd=0; }],
  ['a passive that is neither a stat nor a trigger','pos',d=>{ d.pos[1].passive={name:'x',text:'y'}; }],
  ['a trigger without its icd','pos',d=>{ d.pos[1].passive={name:'x',text:'y',on:'hit',heal:0.02}; }],
  ['a trigger without an effect','pos',d=>{ d.pos[1].passive={name:'x',text:'y',on:'kill'}; }],
  ['a cost that is not negative','pos',d=>{ d.pos[1].passive.cost={stat:'hp',v:0.1}; }],
  ['a bonus missing','bonus',d=>{ delete d.bonus[5]; }],
  ['odds of 150%','pos',d=>{ d.pos[1].from={chance:1.5}; }],
  ['a name another set has','char',d=>{ d.char.name='name ALPHA'; }]];
const before=count();
{ x.SS_BAD.length=0; const results=[];
  quiet(()=>{ BAD.forEach(([what,field,f],i)=>{ const d=fixture('bad'+i); f(d); const n0=x.SS_BAD.length, r=x.defineSkillSet(d); results.push([what,field,r,x.SS_BAD.slice(n0)]); }); });
  const fine=results.filter(([w,f,r,b])=>r===null&&b.length===1&&b[0].field===f);
  ok('every bad set ('+BAD.length+' kinds) is left out and listed with its field',fine.length===BAD.length,results.filter(([w,f,r,b])=>!(r===null&&b.length===1&&b[0].field===f)).map(([w,f,r,b])=>w+' -> '+(r?'REGISTERED':JSON.stringify(b))).join(' | '));
  ok('a bad set registers nothing: no id, no skill, no passive, no attack kind',same(count(),before),JSON.stringify(count())+' vs '+JSON.stringify(before));
  ok('SS_BAD says what is wrong (id, field, why)',x.SS_BAD.length===BAD.length&&x.SS_BAD.every(b=>b.id&&b.field&&b.why),x.SS_BAD[3]&&JSON.stringify(x.SS_BAD[3]));
  x.SS_BAD.length=0; }
quiet(()=>{ x.defineSkillSet(fixture('alpha')); });
ok('a set defined twice is refused',x.SS_BAD.length===1&&x.SS_BAD[0].field==='id'&&x.SS_ORDER.filter(i=>i==='alpha').length===1); x.SS_BAD.length=0;
{ const real1=x.defineSkillSet(fixture('real1',d=>{ d.dev=false; d.char.name='Real One'; }));
  quiet(()=>{ x.defineSkillSet(fixture('real2',d=>{ d.dev=false; d.char.name='Real Two'; })); });
  ok('only one released set for each land and tier (dev sets are exempt)',!!real1&&x.SS_BAD.length===1&&x.SS_BAD[0].field==='needs'&&!x.SS_SETS.real2); x.SS_BAD.length=0; }
ok('a hybrid of two elements is allowed for a risk set, each piece takes one of them',(()=>{ const h=x.defineSkillSet(fixture('hyb',d=>{ d.role={main:'risk'}; d.el=['dark','air']; d.char.name='Hyb'; d.pos[1].skill.warrior.el='air'; d.pos[1].skill.archer.el='air'; d.pos[1].skill.mage.el='air'; d.pos[2].skill.any.el='dark'; d.pos[3].skill.any.el='dark'; })); return !!h&&h.pos[1].el==='air'&&x.SKILLS.hyb_2_any.el==='dark'&&x.PASSIVES.hyb_p1.el==='air'; })(),JSON.stringify(x.SS_BAD));
ok('a grind set may be a hybrid too',!!x.defineSkillSet(fixture('hyb2',d=>{ d.role={main:'grind'}; d.el=['earth','fire']; d.char.name='Hyb Two'; d.pos[1].skill.warrior.el='earth'; d.pos[1].skill.archer.el='earth'; d.pos[1].skill.mage.el='earth'; d.pos[2].skill.any.el='fire'; d.pos[3].skill.any.el='fire'; })),JSON.stringify(x.SS_BAD));
ok('a hybrid of soul opposites is allowed but linted; the first grinder not being basic is linted',(()=>{ x.defineSkillSet(fixture('hyb3',d=>{ d.role={main:'safe'}; d.el=['fire','water']; d.char.name='Hyb Three'; d.pos[1].skill.warrior.el='fire'; d.pos[1].skill.archer.el='fire'; d.pos[1].skill.mage.el='fire'; d.pos[2].skill.any.el='water'; d.pos[3].skill.any.el='water'; }));
  const L=x.ssLint(); return L.some(l=>l.set==='hyb3'&&/opposites/.test(l.why)); })());
{ quiet(()=>{ x.defineSkillSet(fixture('grinder',d=>{ d.dev=false; d.land='vale'; d.role={main:'grind'}; d.char.name='Grinder'; })); });
  ok('the first grinder that is not pure basic is linted (the owner\'s one requirement)',x.ssLint().some(l=>l.set==='grinder'&&/pure basic/.test(l.why)),JSON.stringify(x.ssLint())); }
ok('a position in another element than its single-element set needs a why',(()=>{ x.defineSkillSet(fixture('odd',d=>{ d.char.name='Odd'; d.pos[2].skill.any.el='water'; })); return x.ssLint().some(l=>l.set==='odd'&&/no why/.test(l.why)); })());
{ const s0=x.ssSetFor('home',0), s1=x.ssSetFor('home',1), s4=x.ssSetFor('home',4), v1=x.ssSetFor('vale',2);
  ok('which set a clear rewards: none at +0, the land\'s highest released set at or below the tier, never a dev set',s0===null&&s1.id==='real1'&&s4.id==='real1'&&v1.id==='grinder'&&x.ssSetFor('grey',3)===null); }

// ---- a player: granting, wearing, counting ----
inbox.a=[]; W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:30}}); tick(1);
const p=W.players.get('a'), own=id=>p.gear.skills.owned.includes(id);
const send=m=>{ W.receive('a',m); tick(3); };
const toasts=()=>evs.filter(e=>e[0]==='toast').map(e=>e[2]);
ok('a new player owns no piece of any set (they are earned, never free)',x.newSkills().owned.every(i=>!x.SKILLS[i].set)&&!x.SS_ORDER.some(s=>own(x.SS_SETS[s].pos[1].ids[0])));
send({t:'buyskill',id:'alpha_2_any'});
ok('a piece cannot be bought',!own('alpha_2_any')&&toasts().some(t=>/not for sale/.test(t)));
send({t:'dev',cmd:'set',v:'nope'}); ok('the testing tool refuses an unknown set and names the known ones',toasts().some(t=>/No skill set called "nope"/.test(t)));
send({t:'dev',cmd:'set',v:'alpha'});
ok('the testing tool gives a whole set: every class version, the universal pieces and the three passives',['alpha_1_warrior','alpha_1_archer','alpha_1_mage','alpha_2_any','alpha_3_any','alpha_p1','alpha_p2','alpha_p3'].every(own)&&evs.some(e=>e[0]==='ssget'&&e[2]==='alpha'),'');
ok('...and it is asked for once, not twice (nothing is added a second time)',(()=>{ const n=p.gear.skills.owned.length; send({t:'dev',cmd:'set',v:'alpha'}); return p.gear.skills.owned.length===n; })());

send({t:'eqskill',id:'alpha_2_any'});
ok('wearing a universal piece wears it for all three classes at once',['warrior','archer','mage'].every(c=>p.gear.skills.eq[c].skill==='alpha_2_any'));
ok('abilityOf resolves cls "any" for every class (and the slot\'s old skill is replaced)',['warrior','archer','mage'].every(c=>(x.abilityOf(c,'skill',p.gear.skills,p.level)||{}).id==='alpha_2_any'));
ok('a warrior may not change its basic attack, until it owns a slot-1 piece',x.canSwap('warrior','basic',x.newSkills())===false&&x.canSwap('warrior','basic',p.gear.skills)===true&&x.canSwap('mage','basic',x.newSkills())===true&&x.canSwap('warrior','skill',x.newSkills())===true);
send({t:'eqskill',id:'alpha_1_archer'});
ok('wearing a slot-1 piece wears each class\'s own version (the archer\'s id picks all three)',p.gear.skills.eq.warrior.basic==='alpha_1_warrior'&&p.gear.skills.eq.archer.basic==='alpha_1_archer'&&p.gear.skills.eq.mage.basic==='alpha_1_mage'&&x.abilityOf('warrior','basic',p.gear.skills,p.level).id==='alpha_1_warrior');
send({t:'eqskill',id:'alpha_3_any'});
{ const sk=p.gear.skills, cl=x.clsOfP(p);
  ok('three actives of one set are 3 pieces: its bonus 3 is in force, not bonus 5',x.ssCount(sk,cl,p.level).alpha===3&&x.ssBonuses(sk,cl,p.level).map(b=>b.tier).join()==='3');
  ok('p.ss caches it (recalcP): the count and the bonus rows',p.ss&&p.ss.n.alpha===3&&p.ss.bonus.length===1&&p.ss.bonus[0].row.id==='alpha_b3'); }
const dmg0=x.psP(p,'dmg');
ok('a stat bonus is read like a passive: +10% damage from the 3-set bonus',near(dmg0,0.10),dmg0);
// the passives: slot i opens at PASSIVE_SLOT_LV[i]
p.level=30; send({t:'dev',cmd:'level',v:30});
send({t:'eqskill',id:'alpha_p1',idx:0}); send({t:'eqskill',id:'alpha_p2',idx:1});
{ const sk=p.gear.skills, cl=x.clsOfP(p), n=x.ssCount(sk,cl,30);
  ok('5 pieces (3 actives + 2 passives at level 30): both bonuses in force',n.alpha===5&&x.ssBonuses(sk,cl,30).map(b=>b.tier).join()==='3,5',JSON.stringify(n));
  ok('...and the passives and both bonuses add up: damage +4% +10%, crit +3% +10%',near(x.psP(p,'dmg'),0.14)&&near(x.psP(p,'crit'),0.13),x.psP(p,'dmg')+' '+x.psP(p,'crit'));
  ok('a piece the level cannot use counts for nothing: at level 20 the burst (needs 30) and the second passive slot (opens at 24) do not; at 24 the second passive does',x.passiveOpen(20)===1&&x.ssCount(sk,cl,20).alpha===3&&x.passiveOpen(24)===2&&x.ssCount(sk,cl,24).alpha===4,x.ssCount(sk,cl,20).alpha+' '+x.ssCount(sk,cl,24).alpha); }
send({t:'eqskill',id:'alpha_p3',idx:2});
{ const sk=p.gear.skills, cl=x.clsOfP(p);
  ok('all six pieces: still just the two bonuses (there is no 6-set bonus)',x.ssCount(sk,cl,30).alpha===6&&x.ssBonuses(sk,cl,30).length===2); }
// the piece is worn for the class in hand: switching class keeps the count
{ const hpA=p.maxHp; send({t:'cls',cls:'archer'}); const cl=x.clsOfP(p);
  ok('a class change keeps the set count (the loadout is per class, a piece is worn for all three)',cl==='archer'&&p.ss.n.alpha===6,cl+' '+JSON.stringify(p.ss&&p.ss.n)); }
// an unworn piece does not count; taking one off lowers the count
send({t:'unskill',cls:x.clsOfP(p),slot:'burst'});
ok('taking a piece off lowers the count (and the 5-set bonus goes at 4)',p.ss.n.alpha===5&&p.ss.bonus.length===2);
send({t:'unskill',cls:x.clsOfP(p),slot:'skill'});
ok('...and the 3-set bonus goes at 2 actives + 3 passives only when under 3: 4 pieces keep bonus 3',p.ss.n.alpha===4&&p.ss.bonus.map(b=>b.tier).join()==='3');
send({t:'unskill',cls:x.clsOfP(p),slot:'basic'});
ok('a slot-1 piece can be taken off: the class basic attack returns',x.abilityOf(x.clsOfP(p),'basic',p.gear.skills,p.level).set===undefined&&p.ss.n.alpha===3);

// 3+3: one set's actives and another's passives each reach 3
send({t:'dev',cmd:'set',v:'real1'});
{ const sk=p.gear.skills, cl=x.clsOfP(p);
  send({t:'eqskill',id:'alpha_2_any'}); send({t:'eqskill',id:'alpha_3_any'}); send({t:'eqskill',id:'alpha_1_archer'});
  send({t:'eqskill',id:'real1_p1',idx:0}); send({t:'eqskill',id:'real1_p2',idx:1}); send({t:'eqskill',id:'real1_p3',idx:2});
  const n=x.ssCount(sk,cl,30);
  ok('3 + 3: two sets at 3 pieces each both have their bonus 3',n.alpha===3&&n.real1===3&&x.ssBonuses(sk,cl,30).map(b=>b.set+b.tier).sort().join()==='alpha3,real13',JSON.stringify(n)); }
// a cost is paid by the row that has the benefit
{ const base=p.maxHp; x.PASSIVES.real1_p3.cost={stat:'hp',v:-0.20}; x.recalcP(p); const lower=p.maxHp; delete x.PASSIVES.real1_p3.cost; x.recalcP(p);
  ok('a passive\'s cost is paid: -20% maximum health while it is worn (its own +5% included)',lower<base&&near(lower/p.maxHp,(1+0.05-0.20)/(1+0.05),0.03),lower+' vs '+p.maxHp); }

// ---- the rules about what a piece is not ----
{ const lv0=p.gear.skills.lv.alpha_2_any; send({t:'upskill',id:'alpha_2_any'}); ok('a piece cannot be upgraded in v1',p.gear.skills.lv.alpha_2_any===lv0&&toasts().some(t=>/cannot be upgraded/.test(t))); }
// saves: ownership and the worn pieces survive, levels on pieces do not, a removed set's ids vanish
{ const g=J(p.gear); g.skills.lv.alpha_2_any=4; g.skills.owned.push('ghostset_1_any'); g.skills.eq.mage.skill='ghostset_1_any';
  const out=x.sanitizeGear(g,'mage').skills;
  ok('a save keeps the set pieces and where they are worn, drops ids that no longer exist, and forces a piece to level 1',out.owned.includes('alpha_2_any')&&out.eq.mage.skill!=='ghostset_1_any'&&out.eq.warrior.skill==='alpha_2_any'&&!out.lv.alpha_2_any&&out.eq.warrior.basic==='alpha_1_warrior'&&!out.owned.includes('ghostset_1_any')); }
{ const g=J(p.gear); g.skills.owned=g.skills.owned.filter(i=>!/^alpha_1_/.test(i)); const out=x.sanitizeGear(g,'warrior').skills;
  ok('a worn piece that is no longer owned is not worn (and the warrior is back to its class basic)',out.eq.warrior.basic===null&&x.abilityOf('warrior','basic',out,30).set===undefined); }
{ const out=x.sanitizeGear(J({skills:{owned:['alpha_1_warrior'],eq:{warrior:{basic:'alpha_1_warrior'}}}}),'warrior').skills; const bare=x.sanitizeGear(J({skills:{eq:{warrior:{basic:'alpha_1_warrior'}}}}),'warrior').skills;
  ok('owning the slot-1 piece lets a warrior wear it; without owning it, no',out.eq.warrior.basic==='alpha_1_warrior'&&bare.eq.warrior.basic===null); }
// a piece in a data-only skill works in combat: the universal ring hits what is near
{ const m=x.MONS.find(mm=>!mm.boss&&!mm.inst&&mm.def.id==='slime'); m.dead=false; m.hp=1e9; W.setPos('a',[m.x,x.getH(m.x,m.z),m.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null; p.cd.skill=0; p.level=30;
  p.gear.skills.eq.archer.skill='alpha_2_any'; const hp0=m.hp; send({t:'atk',k:'skill',tg:m.id,face:0,aim:[0,0,-1]}); tick(25);
  ok('a universal piece is used like any skill: its ring hits the monster beside the player and starts its cooldown',m.hp<hp0&&p.cd.skill>0&&evs.some(e=>e[0]==='pact'&&e[2]==='alpha2x'),(hp0-m.hp)+' hp, cd '+p.cd.skill.toFixed(1)); }
{ const ab=x.abilityOf('archer','skill',p.gear.skills,30), cd=x.abilityCd(ab,p.gear.skills,30,'archer');
  ok('cooldown reads the class\'s bonuses (a "cd" bonus row shortens it, a cost lengthens it)',(()=>{ x.SS_SETS.alpha.bonus[3].stat='cd'; x.SS_SETS.alpha.bonus[3].v=[0.2,0]; const c2=x.abilityCd(ab,p.gear.skills,30,'archer'); x.SS_SETS.alpha.bonus[3].stat='dmg'; x.SS_SETS.alpha.bonus[3].v=[0.10,0]; return c2<cd-0.1; })(),cd.toFixed(2)); }

ok('the world still ticks',(()=>{ try{ tick(20); return true; }catch(e){ console.log(e); return false; } })());
console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
