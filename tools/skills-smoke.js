// Headless test of elements, the Soul Hall, monster drops, skill upgrades, passives and the boss skills (server straight from src/, no build): one line per check.
// Usage: node tools/skills-smoke.js
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','getH','VIL2','VIL','rewardKill','elemHitS','sanitizeGear','hurtP','ELEMS','MATS','upgradeNeeds','SKILLS','soulMult','foeMult','SKILL_MAX_LV','BOSS_SKILLS','bossSkillDropP','newSkills','damageMonsterS','psP','S','passiveSum','passiveOpen','PASSIVE_SLOT_LV']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const you=pid=>[...inbox[pid]].reverse().find(m=>m.t==='you');
const tick=(n,keepAlive)=>{ n=Math.max(n,3); for(let i=0;i<n;i++){ // (at least 3 ticks: events reach the log with the next snapshot)
    W.tick(0.05); if(keepAlive) for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const toasts=()=>evs.filter(e=>e[0]==='toast').map(e=>e[2]);
const near=(a,b)=>Math.abs(a-b)<1e-9;

// ---- the rules (shared, pure) ----
ok('soul: own element x1.5, opposite x1/1.5, others and basic x1',near(x.soulMult('fire','fire',0),1.5)&&near(x.soulMult('fire','water',0),1/1.5)&&x.soulMult('fire','earth',0)===1&&x.soulMult('fire','dark',0)===1&&x.soulMult('basic','fire',0)===1&&x.soulMult('fire','basic',0)===1);
ok('every element has exactly one opposite (fire/water, earth/air, dark/light)',['fire','water','earth','air','dark','light'].every(e=>x.soulMult(e,e,0)===1.5)&&near(x.soulMult('earth','air',0),1/1.5)&&near(x.soulMult('light','dark',0),1/1.5)&&x.soulMult('earth','water',0)===1);
{ const beats=[['water','fire'],['fire','air'],['air','earth'],['earth','water']];   // the wheel: water beats fire beats air beats earth beats water
  ok('monster wheel: a skill that beats the monster x1.5, one it beats x1/1.5 (water on fire 1.5, fire on water 1/1.5, ...)',beats.every(([a,b])=>near(x.foeMult(a,b),1.5)&&near(x.foeMult(b,a),1/1.5)),beats.map(([a,b])=>a+'>'+b+' '+x.foeMult(a,b).toFixed(2)+'/'+x.foeMult(b,a).toFixed(2)).join(' '));
  ok('monster wheel: two steps apart, basic, and the same element',x.foeMult('water','air')===1&&x.foeMult('fire','earth')===1&&x.foeMult('basic','fire')===1&&x.foeMult('fire','basic')===1&&near(x.foeMult('fire','fire'),1/1.5)&&near(x.foeMult('dark','dark'),1/1.5));
  ok('monster wheel: dark and light beat each other',near(x.foeMult('dark','light'),1.5)&&near(x.foeMult('light','dark'),1.5)&&x.foeMult('dark','fire')===1);
  ok('the soul still works on the opposite pairs, not the wheel (a fire soul: water x1/1.5, air and earth x1)',near(x.soulMult('fire','water',0),1/1.5)&&x.soulMult('fire','air',0)===1&&x.soulMult('fire','earth',0)===1&&near(x.soulMult('water','fire',0),1/1.5)); }
ok('every monster and skill has a valid element',x.MONS.every(m=>!m.def.el||x.ELEMS[m.def.el])&&Object.values(x.SKILLS).every(s=>!s.el||x.ELEMS[s.el]));
const up=x.upgradeNeeds('whirlwind',2);
ok('upgrade costs coins and a monster drop that exists',up&&up.coins>0&&up.mats.length===1&&x.MATS[up.mats[0].id]&&x.upgradeNeeds('whirlwind',x.SKILL_MAX_LV+1)===null&&x.upgradeNeeds('whirlwind',5).mats.length===2);

// ---- saves are checked ----
const g=x.sanitizeGear({soul:'lava',mats:{slime:-5,nothing:3,boss:99999999,kappa:'7'},skills:{owned:['whirlwind','vitality','nope'],lv:{whirlwind:99,vitality:3,bash:4},pass:['vitality','vitality','ironwill']}},'warrior');
ok('a save is sanitized: soul, drops, skill levels, passives',g.soul==='basic'&&!g.mats.slime&&!g.mats.nothing&&g.mats.boss===999&&g.mats.kappa===7&&g.skills.lv.whirlwind===5&&g.skills.lv.vitality===3&&!g.skills.lv.bash&&g.skills.pass[0]==='vitality'&&g.skills.pass[1]===null&&g.skills.pass[2]===null,JSON.stringify([g.mats,g.skills.lv,g.skills.pass]));

// ---- the Soul Hall in Hanami ----
inbox.a=[]; W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:14}}); tick(1);
const p=W.players.get('a');
W.receive('a',{t:'dev',cmd:'vale',v:2});
const V2=x.VIL2; W.setPos('a',[V2.x,x.getH(V2.x,V2.z),V2.z,0,0,0]);
W.receive('a',{t:'soul',el:'fire'}); tick(1);
ok('soul: refused below level 15',you('a').gear.soul==='basic'&&toasts().some(t=>/level 15/.test(t)));
W.receive('a',{t:'dev',cmd:'level',v:15}); W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); W.receive('a',{t:'soul',el:'fire'}); tick(1);
ok('soul: refused outside Hanami',you('a').gear.soul==='basic'&&toasts().some(t=>/in Hanami/.test(t)));
W.setPos('a',[V2.x,x.getH(V2.x,V2.z),V2.z,0,0,0]); W.receive('a',{t:'soul',el:'fire'}); tick(1);
ok('soul: bound in Hanami at level 15',you('a').gear.soul==='fire'&&evs.some(e=>e[0]==='soul'&&e[2]==='fire'));
W.receive('a',{t:'soul',el:'water'}); W.receive('a',{t:'soul',el:'lava'}); tick(1);
ok('soul: changed freely, unknown elements ignored',you('a').gear.soul==='water');
W.receive('a',{t:'soul',el:'fire'}); tick(1);

// ---- damage with elements ----
const slime=x.MONS.find(m=>m.def.id==='slime'), boar=x.MONS.find(m=>m.def.id==='boar'), magma=x.MONS.find(m=>m.def.id==='magmaslime'), shroom=x.MONS.find(m=>m.def.id==='shroom');
const eh=(el,m)=>x.elemHitS(p,el,m);
ok('damage: fire soul, fire skill on an air shroom = 1.5 (soul) x 1.5 (fire beats air)',near(eh('fire',shroom),2.25),eh('fire',shroom).toFixed(3));
ok('damage: fire soul, fire skill on a water slime = 1.5 (soul) x 1/1.5 (water beats fire) = 1',near(eh('fire',slime),1),eh('fire',slime).toFixed(3));
ok('damage: on a fire monster a fire soul cancels out (1.5 x 1/1.5, water skills 1/1.5 x 1.5)',near(eh('water',magma),1)&&near(eh('fire',magma),1));
ok('damage: basic skills and basic monsters are neutral',eh('basic',boar)===1&&eh('fire',boar)===1.5&&near(eh('water',boar),1/1.5));
// a real cast: the dmg event says the element helped (6th value 1)
evs.length=0;
for(let i=0;i<40&&!evs.some(e=>e[0]==='dmg'&&e[1]===shroom.id);i++){ W.setPos('a',[shroom.x+4,x.getH(shroom.x,shroom.z),shroom.z,Math.PI/2,0,0]); p.cd.basic=0; W.receive('a',{t:'atk',k:'basic',tg:shroom.id,face:Math.PI/2}); tick(30,true); }
const hit=evs.find(e=>e[0]==='dmg'&&e[1]===shroom.id); ok('a hit tells the client the element helped',hit&&hit[5]===1,JSON.stringify(hit));
p.gear.soul='basic'; ok('soul basic = no bonus',eh('fire',boar)===1); p.gear.soul='fire';

// ---- monster drops ----
p.gear.mats={}; let dropped=0;
for(let i=0;i<200;i++){ const before=p.gear.mats.slime||0; x.rewardKill(p,slime); dropped+=(p.gear.mats.slime||0)-before; }
tick(3); ok('kills drop the monster material (about 35% of kills)',dropped>=40&&dropped<=140&&evs.some(e=>e[0]==='drop'&&e[2]==='slime'),dropped+' in 200 kills');
p.gear.mats={}; x.rewardKill(p,x.MONS.find(m=>m.boss)); ok('a boss always drops its trophy',p.gear.mats.boss===3,JSON.stringify(p.gear.mats));

// ---- upgrading skills ----
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]);
W.receive('a',{t:'dev',cmd:'skills'}); tick(1);
const need=x.upgradeNeeds('chain',2); p.gear.coins=need.coins-1; p.gear.mats={}; W.receive('a',{t:'upskill',id:'chain'}); tick(1);
ok('upgrade: refused without coins',!you('a').gear.skills.lv.chain&&toasts().some(t=>/Not enough coins/.test(t)));
p.gear.coins=need.coins+5; W.receive('a',{t:'upskill',id:'chain'}); tick(1);
ok('upgrade: refused without the drops',!you('a').gear.skills.lv.chain&&toasts().some(t=>/You need \d+ /.test(t)));
p.gear.mats={[need.mats[0].id]:need.mats[0].n+2}; W.receive('a',{t:'upskill',id:'chain'}); tick(1);
const y=you('a'); ok('upgrade: coins and drops are spent, the skill is level 2',y.gear.skills.lv.chain===2&&y.gear.coins===5&&y.gear.mats[need.mats[0].id]===2&&evs.some(e=>e[0]==='skillup'&&e[2]==='chain'&&e[3]===2));
W.setPos('a',[500,x.getH(500,0),0,0,0,0]); p.gear.coins=99999; p.gear.mats={}; for(const m of x.upgradeNeeds('chain',3).mats) p.gear.mats[m.id]=99; W.receive('a',{t:'upskill',id:'chain'}); tick(1);
ok('upgrade: only at a trainer (in a village)',you('a').gear.skills.lv.chain===2);
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]);
for(let to=3;to<=6;to++){ for(const m of x.upgradeNeeds('chain',Math.min(to,5)).mats) p.gear.mats[m.id]=99; W.receive('a',{t:'upskill',id:'chain'}); tick(1); }
ok('upgrade: stops at the top level',you('a').gear.skills.lv.chain===5);
// the upgraded skill hits harder and cools down faster
W.receive('a',{t:'eqskill',id:'chain'}); p.cd.skill=0; p.act=null; W.receive('a',{t:'atk',k:'skill',tg:slime.id,face:0});
ok('an upgraded skill: damage x1.48, cooldown 12% shorter, its element goes along',p.act&&near(p.act.mult,x.SKILLS.chain.mult*1.48)&&near(p.cd.skill,x.SKILLS.chain.cd*0.88)&&p.act.lvl===5&&p.act.el==='air',p.act&&p.act.mult.toFixed(3)+' / cd '+p.cd.skill.toFixed(2));

// ---- passives ----
W.receive('a',{t:'dev',cmd:'reset'}); tick(1);
W.receive('a',{t:'dev',cmd:'level',v:17}); tick(1);
ok('passives: locked before level 18',you('a').gear.skills.pass.every(v=>v===null)&&!you('a').gear.skills.owned.includes('vitality'));
W.receive('a',{t:'dev',cmd:'level',v:18}); tick(1);
const y18=you('a'); ok('passives: level 18 opens the slots with a free Vitality',y18.gear.skills.pass[0]==='vitality'&&y18.gear.skills.owned.includes('vitality')&&evs.some(e=>e[0]==='skillslot'&&e[2]==='passive'));
const base18=Math.round(20*(18+Math.pow(13/12,18))); ok('Vitality raises maximum health by 6%',y18.maxHp===Math.round(base18*1.06),y18.maxHp+' vs '+base18);
const PASS=()=>JSON.stringify(you('a').gear.skills.pass);
W.receive('a',{t:'dev',cmd:'skills'}); evs.length=0; W.receive('a',{t:'eqskill',id:'ferocity',idx:1}); W.receive('a',{t:'eqskill',id:'ferocity',idx:2}); tick(1);
ok('passives: the slots open at levels 18, 24 and 30',JSON.stringify(x.PASSIVE_SLOT_LV)==='[18,24,30]'&&[17,18,23,24,29,30,50].map(x.passiveOpen).join()==='0,1,1,2,2,3,3');
ok('passives: at level 18 only slot 1 is open: slots 2 and 3 refuse, and say when they open',PASS()==='["vitality",null,null]'&&toasts().some(t=>/slot 2 opens at level 24/.test(t))&&toasts().some(t=>/slot 3 opens at level 30/.test(t)));
evs.length=0; W.receive('a',{t:'dev',cmd:'level',v:24}); tick(1); const base24=Math.round(20*(24+Math.pow(13/12,24)));
ok('passives: level 24 opens slot 2 (a toast and a skillslot event), not slot 3',toasts().some(t=>/Passive slot 2 unlocked/.test(t))&&!toasts().some(t=>/slot 3 unlocked/.test(t))&&evs.some(e=>e[0]==='skillslot'&&e[2]==='passive'));
evs.length=0; W.receive('a',{t:'eqskill',id:'ferocity',idx:1}); W.receive('a',{t:'eqskill',id:'ironwill',idx:2}); tick(1);
ok('passives: at level 24 slot 2 takes one and slot 3 is still locked',PASS()==='["vitality","ferocity",null]'&&toasts().some(t=>/slot 3 opens at level 30/.test(t)));
evs.length=0; W.receive('a',{t:'eqskill',id:'ironwill'}); tick(1); ok('passives: both open slots are full, so another one without a slot is refused',PASS()==='["vitality","ferocity",null]'&&toasts().some(t=>/slots are full/.test(t)));
W.receive('a',{t:'eqskill',id:'precision',idx:0}); tick(1); ok('passives: dropping onto a full slot replaces what is in it',PASS()==='["precision","ferocity",null]'&&you('a').maxHp===base24);
W.receive('a',{t:'eqskill',id:'ferocity',idx:0}); tick(1); ok('passives: dropping one that is worn in another slot swaps the two',PASS()==='["ferocity","precision",null]');
W.receive('a',{t:'unskill',slot:'pass',idx:0}); tick(1); ok('passives: take one off',you('a').gear.skills.pass[0]===null&&PASS()==='[null,"precision",null]');
W.receive('a',{t:'eqskill',id:'ferocity'}); tick(1); ok('passives: with no slot given it takes the first free open one',PASS()==='["ferocity","precision",null]');
{ const g=x.sanitizeGear({skills:{owned:['vitality','ferocity','ironwill'],pass:[null,'ferocity','vitality']}},'warrior');
  ok('a save keeps its passives in their slots, once each',JSON.stringify(g.skills.pass)==='[null,"ferocity","vitality"]'&&JSON.stringify(x.sanitizeGear({skills:{owned:['vitality'],pass:['vitality','vitality','vitality']}},'warrior').skills.pass)==='["vitality",null,null]');
  const hp=(pass,lv)=>x.passiveSum({owned:['vitality'],pass,lv:{}},lv,'hp');
  ok('passives in a slot the level has not opened do nothing',hp([null,'vitality',null],20)===0&&hp([null,'vitality',null],24)>0&&hp(['vitality',null,null],20)>0&&hp([null,null,'vitality'],29)===0&&hp([null,null,'vitality'],30)>0); }
{ inbox.e=[]; W.join('e',{name:'Slots',look:{cls:'warrior'},save:{level:20,exp:0,gear:{skills:{owned:['vitality','ferocity'],v:2,pass:[null,'ferocity','vitality']}}}}); tick(1);
  ok('a save at level 20 with passives in slots 2 and 3 gets them back in the bag, and the free Vitality in slot 1',JSON.stringify(you('e').gear.skills.pass)==='["vitality",null,null]'&&you('e').gear.skills.owned.includes('ferocity'),JSON.stringify(you('e').gear.skills.pass));
  inbox.f=[]; W.join('f',{name:'Slots30',look:{cls:'warrior'},save:{level:30,exp:0,gear:{skills:{owned:['vitality','ferocity'],v:2,pgiven:true,pass:[null,'ferocity','vitality']}}}}); tick(1);
  ok('a save at level 30 keeps passives in all three slots',JSON.stringify(you('f').gear.skills.pass)==='[null,"ferocity","vitality"]',JSON.stringify(you('f').gear.skills.pass)); }
p.gear.mats={}; p.gear.coins=99999; W.receive('a',{t:'upskill',id:'ferocity'}); tick(1); ok('passives: upgrades need the drops too',!you('a').gear.skills.lv.ferocity);
for(const m of x.upgradeNeeds('ferocity',2).mats) p.gear.mats[m.id]=50; W.receive('a',{t:'upskill',id:'ferocity'}); tick(1);
ok('passives: upgraded',you('a').gear.skills.lv.ferocity===2);
// Iron Will takes some of every hit
W.receive('a',{t:'unskill',slot:'pass',idx:2}); W.receive('a',{t:'eqskill',id:'ironwill',idx:0}); tick(1);
const hp0=p.hp; p.lastHit=-99; x.hurtP(p,100,null); const lost=hp0-p.hp; ok('Iron Will: 5% less damage taken',lost===Math.max(1,Math.round(100*(1-p.red)*0.95)),'lost '+lost);
// level 30 opens the last slot (then back to 24 for the rest of the tests)
evs.length=0; W.receive('a',{t:'dev',cmd:'level',v:30}); tick(1); const t30=toasts(); W.receive('a',{t:'eqskill',id:'scholar',idx:2}); tick(1);
ok('passives: level 30 opens slot 3, and a passive in it works',t30.some(t=>/Passive slot 3 unlocked/.test(t))&&you('a').gear.skills.pass[2]==='scholar'&&x.psP(p,'xp')>0);
W.receive('a',{t:'unskill',slot:'pass',idx:2}); W.receive('a',{t:'dev',cmd:'level',v:24}); tick(1);
// a saved level 20 hiker who never had passives gets the free one on join
inbox.d=[]; W.join('d',{name:'Old',look:{cls:'warrior'},save:{level:20,exp:0,gear:{skills:{owned:[],v:2}}}}); tick(1);
ok('an old save at level 20 gets Vitality on join',you('d').gear.skills.pass[0]==='vitality');
// ---- boss skills: not sold, dropped by their boss at 10% each, 2 per class per boss, generic effects ----
const CLS=['warrior','archer','mage'], BOSSES={boss:15,akaoni:20,kyuubi:25}, BS=x.BOSS_SKILLS;
ok('three bosses drop 6 skills each: a skill and a burst for every class, at the boss level',Object.keys(BOSSES).every(b=>(BS[b]||[]).length===6&&CLS.every(c=>['skill','burst'].every(sl=>BS[b].filter(id=>x.SKILLS[id].cls===c&&x.SKILLS[id].slot===sl).length===1))&&BS[b].every(id=>x.SKILLS[id].lv===BOSSES[b])),Object.keys(BS).map(b=>b+':'+BS[b].length).join(' '));
ok('boss skills are not free and not sold',Object.values(x.SKILLS).filter(s=>s.drop).every(s=>!x.newSkills().owned.includes(s.id)&&x.upgradeNeeds(s.id,2)===null));
const elCount=(ids)=>{ const c={}; for(const id of ids){ const e=x.SKILLS[id].el; if(e) c[e]=(c[e]||0)+1; } return c; };
const newIds=Object.keys(BOSSES).flatMap(b=>BS[b]), oldIds=Object.keys(x.SKILLS).filter(id=>!x.SKILLS[id].drop), cNew=elCount(newIds), cOld=elCount(oldIds), six=['fire','water','earth','air','dark','light'];
ok('the new skills are mostly the elements used least so far (light, then fire / earth / air / dark, and only one water)',cOld.light===Math.min(...six.map(e=>cOld[e]))&&cNew.light===Math.max(...six.map(e=>cNew[e]||0))&&cNew.water===1&&six.every(e=>cNew[e]>=1),'before '+JSON.stringify(cOld)+' new '+JSON.stringify(cNew));
// the Hoarfrost Reach's two bosses (Ymrik, level 26; Vetrmaw, level 30) drop 6 skills each too, in the region's elements (water, air, dark)
{ const H={ymrik:26,vetrmaw:30};
  ok('the two Hoarfrost bosses drop 6 skills each: a skill and a burst for every class, at the boss level, in water / air / dark',Object.keys(H).every(b=>(BS[b]||[]).length===6&&CLS.every(c=>['skill','burst'].every(sl=>BS[b].filter(id=>x.SKILLS[id].cls===c&&x.SKILLS[id].slot===sl).length===1))&&BS[b].every(id=>x.SKILLS[id].lv===H[b]&&['water','air','dark'].includes(x.SKILLS[id].el))),Object.keys(H).map(b=>b+':'+(BS[b]||[]).length).join(' ')); }
ok('every class can now use all six elements',CLS.every(c=>six.every(e=>Object.values(x.SKILLS).some(s=>s.cls===c&&s.el===e))));
// the drop chance: every unowned skill of that boss rolls 10% for each player who helped
{ const N=4000; let got=0, other=0, dup=0; for(let i=0;i<N;i++){ const q={id:'t'+i,gear:{skills:x.newSkills()}}; x.bossSkillDropP(q,'boss'); if(q.gear.skills.owned.includes('snare')) got++; if(q.gear.skills.owned.some(id=>x.SKILLS[id].drop&&x.SKILLS[id].drop!=='boss')) other++; }
  const q2={id:'z',gear:{skills:x.newSkills()}}; q2.gear.skills.owned.push('snare'); let again=0; for(let i=0;i<500;i++){ const before=q2.gear.skills.owned.length; x.bossSkillDropP(q2,'kyuubi'); if(q2.gear.skills.owned.filter(id=>id==='snare').length>1) dup++; again+=q2.gear.skills.owned.length-before; }
  ok('each boss skill drops with a 10% chance per kill, only from its own boss, never twice',got/N>0.085&&got/N<0.115&&!other&&!dup&&again>0,(got/N*100).toFixed(1)+'% of '+N+' kills'); }
// a real boss kill (the reward path) hands them out
{ const bm=x.MONS.find(m=>m.def.id==='akaoni'); const q=W.players.get('a'); q.gear.skills.owned=q.gear.skills.owned.filter(id=>!x.SKILLS[id]||!x.SKILLS[id].drop); evs.length=0; let k=0; for(;k<300&&!BS.akaoni.every(id=>q.gear.skills.owned.includes(id));k++) x.rewardKill(q,bm); tick(3);
  ok('killing a boss gives its skills to whoever helped, with a banner event and a toast',BS.akaoni.every(id=>q.gear.skills.owned.includes(id))&&!BS.boss.some(id=>q.gear.skills.owned.includes(id))&&new Set(evs.filter(e=>e[0]==='skilldrop'&&e[1]==='a').map(e=>e[2])).size===6&&toasts().some(t=>/dropped!/.test(t)),k+' kills for all six'); }
W.receive('a',{t:'buyskill',id:'kanabo'}); W.receive('a',{t:'dev',cmd:'reset'}); tick(3);
{ const q=W.players.get('a'); q.gear.skills.owned.push('snare'); q.gear.coins=99999; W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); q.gear.mats={}; for(const id of x.MATS?Object.keys(x.MATS):[]) q.gear.mats[id]=99; evs.length=0;
  W.receive('a',{t:'buyskill',id:'kanabo'}); W.receive('a',{t:'upskill',id:'snare'}); tick(3);
  ok('a boss skill cannot be bought or upgraded yet',!q.gear.skills.owned.includes('kanabo')&&!q.gear.skills.lv.snare&&toasts().some(t=>/not for sale/.test(t))&&toasts().some(t=>/cannot be upgraded/.test(t))); }
const sg=x.sanitizeGear({skills:{owned:['snare','lifesap'],lv:{snare:5,lifesap:3},eq:{warrior:{skill:'snare',burst:'lifesap'}}}},'warrior');
ok('a save keeps the boss skills you own, equipped, but not any upgrade level',sg.skills.owned.includes('snare')&&sg.skills.eq.warrior.skill==='snare'&&sg.skills.eq.warrior.burst==='lifesap'&&!sg.skills.lv.snare&&!sg.skills.lv.lifesap);

// ---- every boss skill works: cast each one at a group of monsters ----
const target=x.MONS.find(m=>m.def.id==='slime');
let grp=[], gids=new Set();   // the monsters around the target, made unkillable before every cast (so nothing else is rewarded)
const gather=()=>{ if(target.dead){ target.dead=false; target.deadT=0; }   // (an earlier check may have killed it)
  grp=x.MONS.filter(m=>!m.dead&&!m.remove&&Math.hypot(m.x-target.x,m.z-target.z)<16); for(const m of grp){ m.hp=m.maxHp=1e9; m.stunT=0; m.burnT=0; } gids=new Set(grp.map(m=>m.id)); };
const dmgTo=(ids,from)=>evs.slice(from).filter(e=>e[0]==='dmg'&&ids.has(e[1])).length;
const castOne=(id,pid,ticks)=>{
  const s=x.SKILLS[id], cls=s.cls, lv=s.lv; inbox[pid]=[]; W.join(pid,{name:'C'+pid,look:{cls},save:{level:lv}}); tick(1);
  const q=W.players.get(pid); q.gear.skills.owned.push(id); W.receive(pid,{t:'eqskill',id}); tick(1);
  gather(); const dx=s.fx.dash?9:Math.min(4,Math.max(2,s.range-1.2)), face=Math.PI/2, px=target.x+dx;
  W.setPos(pid,[px,x.getH(px,target.z),target.z,face,0,0]);   // (on the ground under their own feet: on a slope the target's height would bury the hand and every shot would end in the ground)
  q.cd.skill=q.cd.burst=0; const from=evs.length; W.receive(pid,{t:'atk',k:s.slot,tg:target.id,face,aim:[-1,0,0]}); tick(ticks||60,true);
  return {q,s,from};
};
const shown=[]; let castFails=[];
for(const id of newIds){
  const {q,s,from}=castOne(id,'c_'+id), f=s.fx, got=evs.slice(from), hits=dmgTo(gids,from);
  const fine=f.buff?(q.buff&&q.buff.id===id&&got.some(e=>e[0]==='buff'&&e[2]===id)):hits>0;
  const extra=(f.beam?got.some(e=>e[0]==='beam'):true)&&(f.chain?got.some(e=>e[0]==='chain'&&e[1].length>=3):true)&&(f.zone?got.some(e=>e[0]==='area'&&e[2]==='zone'&&e[8]===s.el):true)&&(f.proj?got.some(e=>e[0]==='proj')&&got.some(e=>e[0]==='pend'):true)&&(f.dash?Math.hypot(q.x-target.x,q.z-target.z)<4.5:true);
  if(!(fine&&extra)) castFails.push(id+'('+(fine?'':'no hits ')+(extra?'':'no fx event')+')'); shown.push(id+':'+(f.buff?'buff':hits));
  W.leave('c_'+id);
}
ok('all boss skills cast and do what their fx says (hits, buff, beam, chain, zone, projectile, dash)',!castFails.length,castFails.length?'failed: '+castFails.join(', '):shown.join(' '));
// what the statuses do
{   let r=castOne('cleave','c_cl'); const onTarget=evs.slice(r.from).filter(e=>e[0]==='dmg'&&e[1]===target.id).length;
  ok('Oni Cleave sets enemies on fire and the fire keeps hurting (2 hits, then a tick every second)',target.burnT>0&&onTarget>=4,'burning '+target.burnT.toFixed(1)+' s left, '+onTarget+' hits on the target'); W.leave('c_cl');
  r=castOne('snare','c_sn',12); ok('Bramble Snare roots what it pulls in (stunned, pulled next to you)',target.stunT>0&&Math.hypot(target.x-(target.x+4),0)>=0); W.leave('c_sn');
  r=castOne('gate','c_ga'); ok('Demon Gate: nothing for 1.6 s, then one hit and a stun',dmgTo(gids,r.from)>0&&new Set(evs.slice(r.from).filter(e=>e[0]==='area'&&e[9]===1).map(e=>e[1])).size===1&&grp.some(m=>m.stunT>0)); W.leave('c_ga'); }
// buffs: Lifesap steals, Dawn Guard takes less and heals, both give element-less attacks an element
{ const q=W.players.get('a'); W.receive('a',{t:'dev',cmd:'level',v:25}); tick(3); q.gear.soul='water'; const magma=x.MONS.find(m=>m.def.id==='magmaslime'), slime2=x.MONS.find(m=>m.def.id==='slime');
  q.buff=null; const base=x.elemHitS(q,'basic',magma); q.buff={id:'lifesap',until:(x.S.t+10),dmg:1.2,cd:0.75,crit:0,red:0,steal:0.2,regen:0,el:'water'};
  ok('Lifesap Frenzy: element-less attacks count as your soul element (water soul x1.5, and a fire monster is weak to water x1.5)',near(base,1)&&near(x.elemHitS(q,'basic',magma),2.25)&&near(x.elemHitS(q,'fire',magma),1/1.5*1/1.5),base+' -> '+x.elemHitS(q,'basic',magma));
  q.hp=Math.round(q.maxHp/2); const h0=q.hp; slime2.hp=slime2.maxHp=1e9; const dealt=x.damageMonsterS(slime2,1,q,q.x,q.z,0,'basic'); ok('Lifesap Frenzy: you heal for 20% of the damage you deal',dealt>0&&Math.abs(q.hp-(h0+dealt*0.2))<1.01,'dealt '+dealt+', healed '+(q.hp-h0).toFixed(1));
  q.buff={id:'dawn',until:(x.S.t+10),dmg:1.15,cd:0.85,crit:0,red:0.4,steal:0,regen:0.03,el:'light'}; q.red=0; q.hp=q.maxHp; q.lastHit=-99; const before=q.hp; x.hurtP(q,100,null); const lost=before-q.hp;
  ok('Dawn Guard: 40% less damage taken',lost===Math.max(1,Math.round(100*(1-q.red)*(1-x.psP(q,'red'))*0.6)),'lost '+lost);
  q.hp=Math.round(q.maxHp*0.5); q.lastHit=x.S.t; const a0=q.hp; tick(20); ok('Dawn Guard: 3% of your health back every second',q.hp>a0+q.maxHp*0.03*0.9,'+'+(q.hp-a0).toFixed(1)+' in 1 s'); q.buff=null; q.gear.soul='fire'; }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
