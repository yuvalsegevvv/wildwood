// Headless test of the skill-set base (server straight from src/, no build): the registry and its checks, the expansion into skills and passives, granting, wearing a piece for all three classes,
// counting the worn pieces and the 3- / 5-set bonuses, saves, and what a piece may not do (be bought, upgraded, come free). The sets here are FIXTURES defined inside this file: no kit is in src/.
// Usage: node tools/skillsets-smoke.js        (plan and rules: docs/SKILL-SETS.md; how a set is written: docs/skillkits/AUTHORING.md)
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(pid==='a'&&c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SKILL_IDS','PASSIVE_IDS','ANIM_OF','ACT_SKILL','SS_SETS','SS_ORDER','SS_BAD','SS_PIECE_OF','SS_SOURCES','defineSkillSet','ssCount','ssBonuses','ssBonusSum','ssSetFor','ssLint','ssOwnsBasic',
   'VIL','ssEquipPieceP','ssGrantSetP','partyOf','ssAlliesOf','ssAllyS','allyP','ssShieldS','ssFxUtilS','ssTauntS','ssTauntedBy','ssRegenS','monK','SS_ALLY_CAP','SS_HEAL_CAP','SS_TAUNT_BOSS','DMG_TAKEN_MIN','statusS','resolveFxS','hurtP','killMonsterS','damageMonsterS','ssMarkN','ssMarkS','fxModK','ssTriggerS','healP','abilityOf','abilityCd','canSwap','newSkills','sanitizeSkills','sanitizeGear','psP','recalcP','clsOfP','passiveOpen','passiveSum','PASSIVE_SLOT_LV','getH','ZTIER_MAX']);
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
    pos:{1:{bound:'class',skill:{warrior:E(1,'w',{fx:{cone:{r:4,arc:1.2}}}),archer:E(1,'a',{anim:'shoot',fx:{proj:{kind:'thorn',speed:42,turn:9,life:1.4}}}),mage:E(1,'m',{anim:'cast',fx:{proj:{kind:'thorn',speed:38,turn:9,life:1.4}}})},passive:ST('P1','dmg',[0.04,0])},
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
  ['a name another set has','char',d=>{ d.char.name='name ALPHA'; }],
  ['a skill with no fx','pos',d=>{ delete d.pos[2].skill.any.fx; }],
  ['an fx with no shape','pos',d=>{ d.pos[2].skill.any.fx={vsBoss:0.5}; }],
  ['a bad vsBoss','pos',d=>{ d.pos[2].skill.any.fx.vsBoss=9; }],
  ['a bad rangeScale','pos',d=>{ d.pos[2].skill.any.fx.rangeScale={from:10,to:5,k:2}; }],
  ['a bad mark','pos',d=>{ d.pos[2].skill.any.fx.ring.mark={id:'Bad Id'}; }],
  ['a bad status','pos',d=>{ d.pos[2].skill.any.fx.ring.status={kind:'vuln',v:0.9,dur:5}; }],
  ['a flavor that is no element','pos',d=>{ d.pos[2].skill.any.fx.ring.flavor='lava'; }],
  ['a pop of a mark the set never applies','kit',d=>{ d.pos[3].skill.any.fx.pop={id:'ghost',k:1}; }],
  ['an amp of a mark the set never applies','kit',d=>{ d.pos[1].passive={name:'x',text:'y',amp:{id:'ghost',per:0.1}}; }],
  ['a trigger whose fx is a buff','pos',d=>{ d.pos[1].passive={name:'x',text:'y',on:'kill',fx:{buff:1}}; }],
  ['a stat row that is also a trigger','pos',d=>{ d.pos[1].passive.on='kill'; d.pos[1].passive.heal=0.1; }],
  ['a bad ally buff','pos',d=>{ d.pos[1].passive={name:'x',text:'y',on:'kill',buff:{kind:'wings',v:1,dur:3}}; }]];
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


// ================= M2a: marks, modifiers, triggers, reflect =================
const kitfix=()=>fixture('kitx',d=>{ d.role={main:'risk'}; d.el='basic'; d.char.name='Kit X'; d.kit={mark:'barb',name:'Barb',text:'marks'};
  const mk={id:'barb',n:1,dur:10,max:3};
  d.pos[1].skill.warrior.fx={cone:{r:4,arc:1.5,mark:mk},behind:2};
  d.pos[1].skill.archer.fx={proj:{kind:'thorn',speed:60,turn:0,life:1},rangeScale:{from:5,to:30,k:2}};
  d.pos[1].skill.mage.fx={proj:{kind:'thorn',speed:60,turn:0,life:1},vsBoss:0.5};
  d.pos[1].passive={name:'KP1',text:'marks on hit',on:'hit',icd:1,mark:mk};
  d.pos[2].skill.any.fx={ring:{r:6,mark:mk}};
  d.pos[2].passive={name:'KP2',text:'marked targets take more',amp:{id:'barb',per:0.1}};
  d.pos[3].skill.any.fx={ring:{r:8},pop:{id:'barb',k:1,r:8,heal:0.2}};
  d.pos[3].passive={name:'KP3',text:'heal on kill',on:'kill',heal:0.1};
  d.bonus[3]={name:'KB3',text:'a ring on crit',on:'crit',icd:1,fx:{ring:{r:3}},mult:0.5};
  d.bonus[5]=ST('KB5','dmg',0.10,{cost:{stat:'red',v:-0.10}}); });
const K=x.defineSkillSet(kitfix());
ok('a kit with marks, a pop, an amp, triggers, modifiers and a cost registers (modifiers and marks are checked, not just stored)',!!K&&x.SS_BAD.length===0,JSON.stringify(x.SS_BAD));
send({t:'dev',cmd:'set',v:'kitx'}); p.level=30; send({t:'dev',cmd:'level',v:30});
const wear=()=>{ for(const id of ['kitx_1_archer','kitx_2_any','kitx_3_any']) send({t:'eqskill',id}); send({t:'eqskill',id:'kitx_p1',idx:0}); send({t:'eqskill',id:'kitx_p2',idx:1}); send({t:'eqskill',id:'kitx_p3',idx:2}); };
const norm=x.MONS.filter(mm=>!mm.boss&&!mm.inst), mA=norm[0], mB=norm[1], mC=norm[2], bossM=x.MONS.find(mm=>mm.boss);
const fresh=m=>{ m.dead=false; m.remove=false; m.hp=1e9; m.maxHp=1e9; m.mk=null; m.st=null; m.aura=null; m.rxIcd=null; m.inst=0; m.immune=false; m.burnT=m.slowT=m.stunT=0; return m; };
const place=(m,dx,dz,face)=>{ fresh(m); m.x=p.x+dx; m.z=p.z+dz; if(face!==undefined) m.face=face; return m; };
const still=fn=>{ const R=Math.random; Math.random=()=>0.5; try{ return fn(); } finally{ Math.random=R; } };
const lost=(m,fn)=>{ const h=m.hp; fn(); return h-m.hp; };
const toVillage=()=>{ W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); p.dead=false; };   // (no monster attacks there: health checks over time stay clean)
const act=(f,ex)=>Object.assign({fx:f,mult:1,range:8,el:'basic',aim:[0,0,-1],sid:null},ex);
x.SS_SETS.kitx.bonus[3].on='crit'; W.setPos('a',[mA.x,x.getH(mA.x,mA.z),mA.z,0,0,0]); p.dead=false; p.hp=p.maxHp;

// ---- marks: personal, they stack to a cap, they run out, they die with the monster ----
{ fresh(mA); for(let i=0;i<5;i++) x.statusS(mA,{mark:{id:'barb',n:1,dur:10,max:3}},p,'basic',1); tick(3);
  ok('a mark stacks up to its cap (max 3), and the clients are told (to its owner)',x.ssMarkN(p,mA,'barb')===3&&evs.some(e=>e[0]==='mk'&&e[1]===mA.id&&e[2]==='barb'&&e[3]===3&&e[5]==='a'),'n '+x.ssMarkN(p,mA,'barb'));
  const q=W.players.get('b')||(W.join('b',{name:'Other',look:{cls:'archer'},save:{level:30}}),W.players.get('b'));
  x.ssMarkS(q,mA,{id:'barb',n:2,dur:10,max:3});
  ok('marks are personal: another player\'s marks of the same kind on the same monster are their own',x.ssMarkN(p,mA,'barb')===3&&x.ssMarkN(q,mA,'barb')===2);
  x.S.t+=11; ok('a mark runs out',x.ssMarkN(p,mA,'barb')===0&&x.ssMarkN(q,mA,'barb')===0);
  x.ssMarkS(p,mA,{id:'barb',n:2,dur:10,max:3}); x.killMonsterS(mA,p); ok('marks die with the monster',mA.mk===null); }

// ---- the skill modifiers: vsBoss, behind, rangeScale ----
{ const base=still(()=>lost(place(mA,2,0,0),()=>x.resolveFxS(p,act({ring:{r:40}}),null)));
  const bhd=still(()=>lost(place(mA,0,-3,0),()=>x.resolveFxS(p,act({ring:{r:40},behind:2}),null)));   // a monster with face 0 looks along -z: one 3 m toward -z of the player has its back to them
  const fnt=still(()=>lost(place(mA,0,3,0),()=>x.resolveFxS(p,act({ring:{r:40},behind:2}),null)));
  ok('behind: x2 from behind a monster, x1 from its front',base>0&&near(bhd/base,2,0.05)&&near(fnt/base,1,0.05),'behind x'+(bhd/base).toFixed(2)+' front x'+(fnt/base).toFixed(2)); }
{ const near5=still(()=>lost(place(mA,5,0,0),()=>x.resolveFxS(p,act({ring:{r:60},rangeScale:{from:5,to:30,k:2}}),null)));
  const far30=still(()=>lost(place(mA,30,0,0),()=>x.resolveFxS(p,act({ring:{r:60},rangeScale:{from:5,to:30,k:2}}),null)));
  const mid=still(()=>lost(place(mA,17.5,0,0),()=>x.resolveFxS(p,act({ring:{r:60},rangeScale:{from:5,to:30,k:2}}),null)));
  ok('rangeScale: x1 at 5 m, x2 at 30 m, x1.5 halfway',far30>0&&near(far30/near5,2,0.06)&&near(mid/near5,1.5,0.06),(far30/near5).toFixed(2)+' '+(mid/near5).toFixed(2)); }
{ const plain=still(()=>lost(place(mA,2,0,0),()=>x.resolveFxS(p,act({ring:{r:60},vsBoss:0.5}),null)));
  const noMod=still(()=>lost(place(mA,2,0,0),()=>x.resolveFxS(p,act({ring:{r:60}}),null)));
  place(bossM,2,0,0); bossM.immune=false; const hb=bossM.hp; still(()=>x.resolveFxS(p,act({ring:{r:60},vsBoss:0.5}),null)); const onBoss=hb-bossM.hp;
  const hb2=bossM.hp; still(()=>x.resolveFxS(p,act({ring:{r:60}}),null)); const onBoss2=hb2-bossM.hp;
  ok('vsBoss: a normal monster takes the full hit, a boss takes the share (x0.5)',near(plain,noMod,noMod*0.02)&&onBoss2>0&&near(onBoss/onBoss2,0.5,0.06),(onBoss/onBoss2).toFixed(2)); }

// ---- pop and amp ----
wear();
ok('the kit is worn: marks need the cone / ring, amp the second passive (level 30 opens all three slots)',p.ss.n.kitx===6&&p.ss.amp.length===1&&p.ss.amp[0].id==='barb');
{ place(mA,3,0); const noMarks=still(()=>lost(mA,()=>x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic')));
  place(mA,3,0); x.ssMarkS(p,mA,{id:'barb',n:3,dur:10,max:3}); const marked=still(()=>lost(mA,()=>x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic')));
  ok('amp: a target carrying 3 marks of the owner takes 3 x 10% more from them (x1.3), not from someone else',near(marked/noMarks,1.3,0.04)&&(()=>{ const q=W.players.get('b'); q.dead=false; place(mA,3,0); x.ssMarkS(p,mA,{id:'barb',n:3,dur:10,max:3}); const h=mA.hp; still(()=>x.damageMonsterS(mA,1,q,q.x,q.z,0,'basic')); const byQ=h-mA.hp; place(mA,3,0); const h2=mA.hp; still(()=>x.damageMonsterS(mA,1,q,q.x,q.z,0,'basic')); return near(byQ,h2-mA.hp,2); })(),(marked/noMarks).toFixed(3)); }
{ place(mA,3,0); place(mB,5,0); place(mC,40,0);   // marks on two monsters in reach and one far away
  for(const m of [mA,mB,mC]) x.ssMarkS(p,m,{id:'barb',n:3,dur:10,max:3});
  p.hp=Math.round(p.maxHp*0.5); const hp0=p.hp;
  const hA=mA.hp, hB=mB.hp, hC=mC.hp; still(()=>x.resolveFxS(p,act({ring:{r:8},pop:{id:'barb',k:1,r:8,heal:0.2}}),mA));
  ok('pop: the burst spends the marks on the target and on everything within r of it (not the one 40 m away) for k x damage a stack, and heals a share of what it dealt',x.ssMarkN(p,mA,'barb')===0&&x.ssMarkN(p,mB,'barb')===0&&x.ssMarkN(p,mC,'barb')===3&&(hA-mA.hp)>3*(hC-mC.hp+1)&&p.hp>hp0,'dealt '+Math.round(hA-mA.hp)+' on the target, healed '+(p.hp-hp0)); }
{ place(mA,3,0); place(mB,4,0); mB.inst=7; x.ssMarkS(p,mA,{id:'barb',n:2,dur:10,max:3}); x.ssMarkS(p,mB,{id:'barb',n:2,dur:10,max:3}); still(()=>x.resolveFxS(p,act({ring:{r:8},pop:{id:'barb',k:1,r:8}}),mA)); const kept=x.ssMarkN(p,mB,'barb'); mB.inst=0;
  ok('pop never reaches a monster of another run (a dungeon\'s) however close it is',x.ssMarkN(p,mA,'barb')===0&&kept===2,'kept '+kept); }
{ place(mA,3,0); x.ssMarkS(p,mA,{id:'barb',n:3,dur:10,max:3}); const ring=still(()=>lost(mA,()=>x.resolveFxS(p,act({ring:{r:8}}),mA)));
  place(mA,3,0); x.ssMarkS(p,mA,{id:'barb',n:3,dur:10,max:3}); const withPop=still(()=>lost(mA,()=>x.resolveFxS(p,act({ring:{r:8},pop:{id:'barb',k:1}}),mA)));
  ok('pop deals k x the skill\'s damage for each stack on top of the hit (3 marks: hit + 3x = about x4 once amp is counted in both)',withPop>ring*3.2&&withPop<ring*4.8,(withPop/ring).toFixed(2)); }

// ---- triggers ----
x.SS_SETS.kitx.bonus[3].on='crit';
{ place(mA,3,0); p.ssIcd={}; tick(3); const n0=evs.filter(e=>e[0]==='dmg'&&e[1]===mA.id).length, R=Math.random; Math.random=()=>0;   // every hit crits, every chance passes (tick first: the events of the earlier checks are still on their way)
  x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic'); const n1=(tick(3),evs.filter(e=>e[0]==='dmg'&&e[1]===mA.id).length); Math.random=R;
  ok('a crit trigger that deals damage runs once and its damage fires no trigger (the hit, then the 3 m ring: 2 damage events, not a chain)',n1-n0===2,(n1-n0)+' damage events'); }
{ place(mA,3,0); p.ssIcd={}; fresh(mA); const R=Math.random; Math.random=()=>0.5;
  x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic'); x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic'); const n1=x.ssMarkN(p,mA,'barb'); x.S.t+=1.1; x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic'); const n2=x.ssMarkN(p,mA,'barb'); Math.random=R;
  ok('a trigger\'s icd holds: two hits in the same moment give one mark, a hit after the icd another',n1===1&&n2===2,n1+' then '+n2); }
{ place(mA,3,0); p.ssIcd={}; const R=Math.random; fresh(mA);
  Math.random=()=>0.9; x.SS_SETS.kitx.bonus[3]=Object.assign({},x.SS_SETS.kitx.bonus[3],{on:'hit',icd:0.2,chance:0.5,fx:undefined,mark:{id:'barb',n:1,dur:10,max:3}}); x.recalcP(p);
  x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic'); const miss=x.ssMarkN(p,mA,'barb'); p.ssIcd={}; Math.random=()=>0.1; x.damageMonsterS(mA,1,p,p.x,p.z,0,'basic'); const hit=x.ssMarkN(p,mA,'barb'); Math.random=R;
  ok('chance: a row with chance 0.5 does not fire on a roll of 0.9 and fires on 0.1 (the passive\'s own mark adds one each time it is free)',hit>miss,miss+' then '+hit); }
{ const row=(over)=>{ x.SS_SETS.kitx.bonus[3]={id:'kitx_b3',set:'kitx',tier:3,slot:'bonus',name:'t',text:'t',v:[0,0],el:'basic',...over}; x.recalcP(p); p.ssIcd={}; };
  // kill
  row({on:'kill',heal:0.5,icd:0}); delete x.SS_SETS.kitx.bonus[3].icd; p.hp=Math.round(p.maxHp*0.2); place(mB,3,0); mB.hp=1; const k0=p.hp; x.damageMonsterS(mB,50,p,p.x,p.z,0,'basic');
  ok('kill: a row that heals on a kill heals (half of maximum health here)',p.hp>k0+p.maxHp*0.3&&mB.dead,k0+' -> '+p.hp);
  // a trigger's own kills fire no trigger: heal + a ring that kills what is near, once
  row({on:'kill',heal:0.1,fx:{ring:{r:9}},mult:99,range:9}); p.hp=Math.round(p.maxHp*0.2); const f0=p.hp;
  place(mB,2,0); place(mC,3,0); place(mA,4,0); for(const m of [mA,mB,mC]) m.hp=1; x.damageMonsterS(mA,50,p,p.x,p.z,0,'basic');
  ok('a trigger\'s own kills fire no trigger: the row that heals and kills what is near heals once (with the worn kill passive: 20% in all), not once for each monster it killed',mA.dead&&mB.dead&&mC.dead&&near((p.hp-f0)/p.maxHp,0.2,0.02),'healed '+((p.hp-f0)/p.maxHp*100).toFixed(1)+'% (the kit\'s own kill passive adds its 10% once, the row its 10% once)');
  // hurt
  row({on:'hurt',icd:1,heal:0.4}); p.hp=Math.round(p.maxHp*0.9); fresh(mA); const h0=p.hp; x.hurtP(p,10,mA); ok('hurt: a row that heals when a monster hurts you',p.hp>h0-10+p.maxHp*0.05,h0+' -> '+p.hp);
  // low
  row({on:'low',below:0.5,icd:5,heal:0.3}); p.hp=Math.round(p.maxHp*0.6); x.hurtP(p,Math.round(p.maxHp*0.15),mA); const low1=p.hp; p.hp=Math.round(p.maxHp*0.9); const l2=p.hp; x.hurtP(p,5,mA);
  ok('low: below its share of health it fires (icd 5), above it does not',low1>p.maxHp*0.45+1&&p.hp<l2+1,Math.round(low1)+' '+Math.round(p.hp));
  // cast
  row({on:'cast1',icd:0}); x.SS_SETS.kitx.bonus[3].mark={id:'barb',n:1,dur:10,max:3}; delete x.SS_SETS.kitx.bonus[3].icd; x.recalcP(p); fresh(mA); place(mA,3,0); p.cd.basic=0; p.act=null; p.dead=false; send({t:'atk',k:'basic',tg:mA.id,face:0,aim:[0,0,-1]});
  ok('cast1: a row that marks on casting slot 1 marks the target the cast was aimed at',x.ssMarkN(p,mA,'barb')>=1,String(x.ssMarkN(p,mA,'barb')));
  // tick
  row({on:'tick',icd:1,fx:{ring:{r:30}},mult:1,range:30}); place(mA,3,0); mA.hp=1e9; const t0=mA.hp; for(let i=0;i<50;i++){ p.lastDealt=x.S.t; W.tick(0.05); }
  ok('tick: while you are in a fight the row fires every icd seconds (here a ring: 2.5 s of fighting hurt the monster beside you)',mA.hp<t0,String(Math.round(t0-mA.hp)));
  mA.hp=1e9; const t1=mA.hp; p.lastDealt=x.S.t-100; for(let i=0;i<60;i++) W.tick(0.05); ok('...idle (no damage dealt for a while): the row does not fire',mA.hp===t1,String(Math.round(t1-mA.hp)));
  // reflect: a passive stat read in hurtP
  row({stat:'reflect',v:[0.5,0]}); delete x.SS_SETS.kitx.bonus[3].on; x.SS_SETS.kitx.bonus[3].stat='reflect'; x.recalcP(p); place(mA,3,0); p.hp=p.maxHp; const hm=mA.hp; x.hurtP(p,200,mA);
  ok('reflect: half of the damage a monster does to you is dealt back to it',hm-mA.hp>30,'dealt back '+Math.round(hm-mA.hp));
}
// a bonus that costs: row kitx_b5 has +10% damage and -10% damage-taken reduction (a cost): both read
{ x.SS_SETS.kitx.bonus[3]=Object.assign({},K.bonus[3]); x.recalcP(p);
  ok('a cost is paid by the same bonus that has the benefit (the 5-set bonus: +10% damage, and 10% less damage reduction)',near(x.psP(p,'dmg'),0.10,0.001)&&near(x.psP(p,'red'),-0.10,0.001),x.psP(p,'dmg')+' / red '+x.psP(p,'red')); }


// ================= M2b: ally buffs, party heal, shield, taunt =================
const pb=W.players.get('b'); W.join('c',{name:'Third',look:{cls:'mage'},save:{level:30}}); tick(3); const pc=W.players.get('c');
W.receive('a',{t:'party',a:'invite',name:'Other'}); tick(3); W.receive('b',{t:'party',a:'accept'}); tick(3);
const standNear=(q,dx,dz)=>{ W.setPos(q.id,[p.x+dx,x.getH(p.x+dx,p.z+dz),p.z+dz,0,0,0]); q.dead=false; q.hp=q.maxHp; };
standNear(pb,3,0); standNear(pc,0,3); p.dead=false; p.hp=p.maxHp; p.act=null;
ok('the base: a and b are one party, c is not',x.partyOf(p)&&x.partyOf(p)===x.partyOf(pb)&&!x.partyOf(pc));
ok('allies are the caster and the party members within range, in the same run: not the outsider, not a far member, not one in a dungeon run',(()=>{
  const ids=()=>x.ssAlliesOf(p).map(q=>q.id).sort().join(); const near=ids();
  standNear(pb,80,0); const far=ids(); standNear(pb,3,0);
  pb.inst=5; const other=ids(); pb.inst=0;
  return near==='a,b'&&far==='a'&&other==='a'; })());
// ally effects through a skill's fx: might for the party
x.resolveFxS(p,act({ring:{r:2},ally:{kind:'might',v:0.3,dur:10}}),null); tick(3);
ok('a skill\'s ally buff reaches the caster and the party member in range, not the outsider, and the clients are told (ast)',x.allyP(p,'might')===0.3&&x.allyP(pb,'might')===0.3&&x.allyP(pc,'might')===0&&evs.some(e=>e[0]==='ast'&&e[1]==='a'&&e[2]==='might'&&e[3]===0.3&&e[4]===10));
{ place(mA,3,0); pb.dead=false; const dB0=still(()=>lost(mA,()=>x.damageMonsterS(mA,1,pb,pb.x,pb.z,0,'basic'))); pb.ally=null; place(mA,3,0); const dB1=still(()=>lost(mA,()=>x.damageMonsterS(mA,1,pb,pb.x,pb.z,0,'basic')));
  ok('might raises the damage the buffed player deals (+30%), a party member too',dB1>0&&near(dB0/dB1,1.3,0.04),(dB0/dB1).toFixed(3)); }
for(const q of [p,pb,pc]) q.ally=null;
{ x.ssAllyS(p,'might',0.2,10,'a'); const u=p.ally.might.until; x.ssAllyS(p,'might',0.1,10,'b'); const smaller=p.ally.might.v===0.2&&p.ally.might.until===u&&p.ally.might.by==='a';
  x.S.t+=2; x.ssAllyS(p,'might',0.2,10,'b'); const equal=p.ally.might.v===0.2&&p.ally.might.until>u;
  x.ssAllyS(p,'might',0.35,10,'b'); const larger=p.ally.might.v===0.35&&p.ally.might.by==='b'; x.ssAllyS(p,'might',9,10,'b');
  ok('buffs never stack: a smaller one is ignored, an equal one refreshes the time (two sources never add), a larger one replaces it, and it is capped',smaller&&equal&&larger&&p.ally.might.v===x.SS_ALLY_CAP.might); }
p.ally=null;
// guard, with the 10% floor
{ const loss=(m,pl)=>{ pl.hp=pl.maxHp; pl.dead=false; pl.shield=null; x.hurtP(pl,1000,m); return pl.maxHp-pl.hp; };
  fresh(mA); const redKeep=p.red; p.red=0.3; const base=loss(mA,p); x.ssAllyS(p,'guard',0.5,10,'a'); const guarded=loss(mA,p);
  p.ally=null; p.red=0.95; x.ssAllyS(p,'guard',0.5,10,'a'); const floor=loss(mA,p); const K=x.monK(mA,p), want=Math.round(1000*K.dmg*(1+0.05*Math.max(0,K.lv-p.level))*x.DMG_TAKEN_MIN); p.red=redKeep; p.ally=null;
  ok('guard takes half off what a hit does, and stacked with a 95% armour the 10% floor still holds',near(guarded/base,0.5,0.06)&&Math.abs(floor-want)<=2,'x'+(guarded/base).toFixed(2)+', floor '+floor+' vs '+want); }
// haste, regen
{ p.cd.skill=0; p.act=null; p.dead=false; W.receive('a',{t:'atk',k:'skill',tg:mA.id,face:0,aim:[0,0,-1]}); const plain=p.cd.skill;
  p.cd.skill=0; p.act=null; x.ssAllyS(p,'haste',0.4,10,'a'); W.receive('a',{t:'atk',k:'skill',tg:mA.id,face:0,aim:[0,0,-1]}); const fast=p.cd.skill; p.ally=null;
  ok('haste: a quarter-second after the cast the cooldown is 40% shorter',plain>0&&near(fast/plain,0.6,0.03),fast.toFixed(2)+' vs '+plain.toFixed(2)); }
{ toVillage(); p.hp=Math.round(p.maxHp*0.5); const h0=p.hp; for(let i=0;i<20;i++) W.tick(0.05); const natural=p.hp-h0;   // (what you heal anyway in a village)
  p.hp=Math.round(p.maxHp*0.5); x.ssAllyS(p,'regen',0.02,10,'a'); const h1=p.hp; for(let i=0;i<20;i++) W.tick(0.05); const withBuff=p.hp-h1; p.ally=null;
  ok('regen: 2% of maximum health a second on top of what you heal anyway (1 s: about +2%)',near((withBuff-natural)/p.maxHp,0.02,0.006),((withBuff-natural)/p.maxHp*100).toFixed(2)+'%'); }
// shield
{ p.dead=false; p.hp=p.maxHp; p.shield=null; x.ssShieldS(p,0.5,10); const pool=p.shield.v; x.hurtP(p,60,mA); const soaked=p.hp===p.maxHp&&p.shield.v<pool;
  const left=p.shield.v; x.hurtP(p,Math.round(left/Math.max(0.01,x.monK(mA,p).dmg*(1-p.red)))+500,mA); const gone=p.shield.v===0&&p.hp<p.maxHp;
  x.ssShieldS(p,0.5,10); const big=p.shield.v; x.ssShieldS(p,0.2,10); const keep=p.shield.v===big; x.S.t+=11; p.hp=p.maxHp; x.hurtP(p,60,mA); const ended=p.hp<p.maxHp; p.shield=null;
  ok('a shield soaks hits until its pool is gone, the larger pool wins (never added), and it runs out',near(pool,p.maxHp*0.5,0.5)&&soaked&&gone&&keep&&ended,'pool '+Math.round(pool)); }
// party heal
{ standNear(pb,3,0); standNear(pc,0,3); for(const q of [p,pb,pc]){ q.hp=Math.round(q.maxHp*0.5); q.dead=false; } x.resolveFxS(p,act({ring:{r:2},heal:{v:0.3}}),null);
  ok('a party heal heals the caster and the party member in range by 30% of maximum health, not the outsider',near((p.hp-Math.round(p.maxHp*0.5))/p.maxHp,0.3,0.01)&&near((pb.hp-Math.round(pb.maxHp*0.5))/pb.maxHp,0.3,0.01)&&pc.hp===Math.round(pc.maxHp*0.5)); }
{ for(const q of [p,pb]){ q.hp=Math.round(q.maxHp*0.1); } x.ssFxUtilS(p,{heal:{v:0.9}});
  ok('a heal is capped (a cast heals at most '+x.SS_HEAL_CAP*100+'% of maximum health)',near((p.hp-Math.round(p.maxHp*0.1))/p.maxHp,x.SS_HEAL_CAP,0.01)); }
{ for(const q of [p,pb]){ q.shield=null; } x.ssFxUtilS(p,{shield:{v:0.25,dur:8}});
  ok('a skill\'s shield is given to the caster and the party in range, each a pool of their own maximum health',near(p.shield.v,p.maxHp*0.25,0.5)&&near(pb.shield.v,pb.maxHp*0.25,0.5)&&!pc.shield); p.shield=pb.shield=null; }
{ x.SS_SETS.kitx.bonus[3]={id:'kitx_b3',set:'kitx',tier:3,slot:'bonus',name:'t',text:'t',v:[0,0],el:'basic',on:'kill',buff:{kind:'might',v:0.2,dur:5},shield:{v:0.1,dur:5}}; x.recalcP(p); p.ally=null; pb.ally=null; p.shield=null;
  place(mB,3,0); mB.hp=1; x.damageMonsterS(mB,50,p,p.x,p.z,0,'basic');
  ok('a triggered row can give an ally buff and a shield (on kill: might to the party, a shield)',mB.dead&&x.allyP(p,'might')===0.2&&x.allyP(pb,'might')===0.2&&p.shield&&p.shield.v>0); p.ally=null; pb.ally=null; p.shield=null; x.SS_SETS.kitx.bonus[3]=Object.assign({},K.bonus[3]); x.recalcP(p); }
// taunt
{ const T=fresh(mC); standNear(p,5,0); standNear(pb,2,0); W.setPos('a',[T.x+5,x.getH(T.x+5,T.z),T.z,0,0,0]); W.setPos('b',[T.x+2,x.getH(T.x+2,T.z),T.z,0,0,0]); T.camp={x:T.x,z:T.z}; T.hp=1e9; T.aggro=true; T.tgt='b'; T.state='chase'; pb.dead=false; p.dead=false;
  tick(3); const before=T.tgt;
  x.ssTauntS(p,T,5); tick(3); const during=T.tgt;
  x.S.t+=6; tick(3); T.tgt='b'; tick(3); const after=T.tgt;
  ok('taunt: a monster fighting the nearer player turns on the taunter while it lasts and does not once it is over',before==='b'&&during==='a'&&after==='b',before+' '+during+' '+after); }
{ const B=bossM; B.B.enraged=false; B.immune=false; B.taunt=null; x.ssTauntS(p,B,10); const shorter=B.taunt&&near(B.taunt.until-x.S.t,10*x.SS_TAUNT_BOSS,0.2); B.taunt=null; B.B.enraged=true; x.ssTauntS(p,B,10); const none=B.taunt===null; B.B.enraged=false; B.immune=true; x.ssTauntS(p,B,10); const noneImm=B.taunt===null; B.immune=false;
  const o=fresh(mA); o.dgOwn=true; x.ssTauntS(p,o,5); const own=o.taunt===undefined||o.taunt===null; o.dgOwn=false;
  ok('a boss takes half of a taunt\'s time, none while it is enraged or shielded, and a run\'s kit-driven monster ignores it',shorter&&none&&noneImm&&own); }
{ const T=fresh(mA); x.ssTauntS(p,T,5); const before=!!x.ssTauntedBy(T); p.dead=true; const dead=x.ssTauntedBy(T); p.dead=false; T.taunt={by:'a',until:x.S.t-1}; const old=x.ssTauntedBy(T);
  ok('a taunt ends with its time or when the taunter is down, and is dropped then',before&&dead===null&&old===null&&T.taunt===null); }


// ================= the ladder harness (tools/skillsets-ladder.js) on the fixture kit =================
{ const L=require('./skillsets-ladder'); const t0=Date.now();
  const list=quiet(()=>L.ladder({W,x,pid:'a'},{secs:20,set:'kitx',classes:['mage']})); const r=list[0], S=r&&r.summary, J=r&&L.judge(r);
  ok('the ladder harness measures a set: pieces, 3-set, 5-set and all six, on one target and on a pack, as a percent of the best non-set loadout',!!r&&r.id==='kitx'&&[S.pieces,S.three,S.five,S.six,S.piecesPack,S.fivePack].every(v=>Number.isFinite(v)&&v>0),r&&JSON.stringify(S)+' in '+((Date.now()-t0)/1000).toFixed(1)+' s');
  ok('...a ring on a pack hits more than one target: the pack numbers are above the single-target ones for an area kit',S&&S.fivePack>=S.five,S&&S.fivePack+' vs '+S.five);
  ok('...and it judges: warnings for a row outside its band, failures only for the damage kits\' orderings',!!J&&Array.isArray(J.warn)&&Array.isArray(J.fail),J&&JSON.stringify(J)); }

ok('the world still ticks',(()=>{ try{ tick(20); return true; }catch(e){ console.log(e); return false; } })());
console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
