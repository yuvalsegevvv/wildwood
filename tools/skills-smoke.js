// Headless test of elements (the wheel, basic x1.1), monster drops, skill upgrades, passives and the boss skills (server straight from src/, no build): one line per check.
// Usage: node tools/skills-smoke.js
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','getH','VIL2','VIL','rewardKill','elemHitS','rollDmgS','sanitizeGear','hurtP','ELEMS','MATS','upgradeNeeds','SKILLS','foeMult','foeTraits','ELEM_BASIC_K','ELEM_LIST','SKILL_MAX_LV','newSkills','damageMonsterS','psP','S','passiveSum','passiveOpen','PASSIVE_SLOT_LV','PASSIVE_SLOTS','awkCurve','awkFx','awkRow','AWK_LV_CAP','AWK_SCALE','skillPower','skillCdMult','passiveValue','PASSIVES','caveLevelK','applyBuffS','recalcP','PASSIVE_IDS']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const you=pid=>[...inbox[pid]].reverse().find(m=>m.t==='you');
const tick=(n,keepAlive)=>{ n=Math.max(n,3); for(let i=0;i<n;i++){ // (at least 3 ticks: events reach the log with the next snapshot)
    W.tick(0.05); if(keepAlive) for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const toasts=()=>evs.filter(e=>e[0]==='toast').map(e=>e[2]);
const near=(a,b)=>Math.abs(a-b)<1e-9;

// ---- the rules (shared, pure) ----
ok('basic: an element-less skill deals x1.1 to every monster, whatever its element; the six elements keep the wheel',near(x.ELEM_BASIC_K,1.1)&&x.ELEM_LIST.every(f=>near(x.foeMult('basic',f),1.1))&&near(x.foeMult('basic','basic'),1.1));
ok('foeTraits: basic is neither weak nor resisted anywhere, each of the six elements has exactly one weakness and resists itself',x.ELEM_LIST.every(f=>{ const t=x.foeTraits(f); return !t.weak.includes('basic')&&!t.resist.includes('basic')&&t.weak.length===1&&t.resist.includes(f); })&&x.foeTraits('basic').weak.length===0&&x.foeTraits('basic').resist.length===0);
{ const beats=[['water','fire'],['fire','air'],['air','earth'],['earth','water']];   // the wheel: water beats fire beats air beats earth beats water
  ok('monster wheel: a skill that beats the monster x1.5, one it beats x1/1.5 (water on fire 1.5, fire on water 1/1.5, ...)',beats.every(([a,b])=>near(x.foeMult(a,b),1.5)&&near(x.foeMult(b,a),1/1.5)),beats.map(([a,b])=>a+'>'+b+' '+x.foeMult(a,b).toFixed(2)+'/'+x.foeMult(b,a).toFixed(2)).join(' '));
  ok('monster wheel: two steps apart, a monster with no element, and the same element',x.foeMult('water','air')===1&&x.foeMult('fire','earth')===1&&x.foeMult('basic','fire')===1.1&&x.foeMult('fire','basic')===1&&near(x.foeMult('fire','fire'),1/1.5)&&near(x.foeMult('dark','dark'),1/1.5));
  ok('monster wheel: dark and light beat each other',near(x.foeMult('dark','light'),1.5)&&near(x.foeMult('light','dark'),1.5)&&x.foeMult('dark','fire')===1); }
ok('every monster and skill has a valid element',x.MONS.every(m=>!m.def.el||x.ELEMS[m.def.el])&&Object.values(x.SKILLS).every(s=>!s.el||x.ELEMS[s.el]));
const up=x.upgradeNeeds('whirlwind',2);
ok('upgrade costs coins and a monster drop that exists',up&&up.coins>0&&up.mats.length===1&&x.MATS[up.mats[0].id]&&x.upgradeNeeds('whirlwind',x.SKILL_MAX_LV+1)===null&&x.upgradeNeeds('whirlwind',5).mats.length===2);

// ---- the level curves (skill revamp step 7, shared/awakening.js: AWK_SCALE, awkCurve, awkFx) ----
{ const C=x.awkCurve, KINDS=Object.keys(x.AWK_SCALE);
  ok('a level-1 skill is unchanged: every curve is x1, awkFx returns the fx itself, damage, cooldown and passive values as defined',KINDS.every(k=>C(k,1)===1)&&x.skillPower(1)===1&&x.skillCdMult(1)===1&&x.passiveValue('vitality',1)===x.PASSIVES.vitality.v[0]&&(()=>{ const f={ring:{r:5,stun:1}}; return x.awkFx(f,1)===f; })());
  ok('damage compounds x1.17 a level: level 10 is x4.11 (+/-0.01), level 12 x5.62',Math.abs(C('dmg',10)-4.11)<=0.01&&Math.abs(x.skillPower(10)-4.11)<=0.01&&Math.abs(C('dmg',12)-5.62)<=0.01,C('dmg',10).toFixed(4));
  ok('healing and shields compound x1.10 (level 10 x2.36); buffs +6%, durations +3%, passives +8% a level',Math.abs(C('heal',10)-2.358)<0.001&&near(C('buff',10),1.54)&&near(C('dur',10),1.27)&&near(C('pass',10),1.72));
  ok('cooldowns: -3% a level to level 5 (x0.88), then -1% a level (x0.83 at 10, x0.81 at 12)',near(C('cd',5),0.88)&&near(x.skillCdMult(5),0.88)&&near(C('cd',10),0.83)&&near(C('cd',12),0.81)&&near(C('cd',6),0.87));
  ok('crowd control: +2% a level, never above +20%',near(C('cc',5),1.08)&&near(C('cc',11),1.2)&&C('cc',12)===1.2&&C('cc',99)===1.2);
  ok('the curves stop at AWK_LV_CAP (12)',x.AWK_LV_CAP===12&&C('dmg',13)===C('dmg',12)&&C('dmg',0)===1);
  const f={ring:{r:6,kb:2,stun:1,slow:2},zone:{r:4,dur:5,heal:{v:0.1}},shield:{v:0.2,dur:4},ally:[{kind:'haste',v:0.1,dur:6}],burn:{dur:3,k:0.3},taunt:{r:8,dur:3},status:{kind:'stun',v:1,dur:2}}, g=x.awkFx(f,10);
  ok('awkFx maps each field to its curve: stun / slow / kb / taunt by crowd control, dur by durations, heal and shield v by healing, ally v by buffs; radii and burn k untouched',
    near(g.ring.stun,1*C('cc',10))&&near(g.ring.slow,2*C('cc',10))&&near(g.ring.kb,2*C('cc',10))&&g.ring.r===6&&near(g.zone.dur,5*C('dur',10))&&near(g.zone.heal.v,0.1*C('heal',10))&&near(g.shield.v,0.2*C('heal',10))&&near(g.shield.dur,4*C('dur',10))
    &&near(g.ally[0].v,0.1*C('buff',10))&&near(g.ally[0].dur,6*C('dur',10))&&g.burn.k===0.3&&near(g.burn.dur,3*C('dur',10))&&near(g.taunt.dur,3*C('cc',10))&&near(g.status.dur,2*C('cc',10))&&g.zone.r===4&&f.ring.stun===1&&x.awkFx(f,10)===g,JSON.stringify(g));
  const r=x.awkRow({id:'t',on:'hit',mult:2,heal:0.05,fx:{ring:{r:3,stun:1}}},5);
  ok('a passive\'s proc row at level 5: mult by damage, heal by healing, fx through awkFx',near(r.mult,2*C('dmg',5))&&near(r.heal,0.05*C('heal',5))&&near(r.fx.ring.stun,C('cc',5)));
  ok('passive values: v[0] x (1 + 8% a level)',near(x.passiveValue('ferocity',5),x.PASSIVES.ferocity.v[0]*1.32));
  ok('charge skills read the same curves (caveLevelK, capped at the tree\'s top, 10)',near(x.caveLevelK(5),C('dmg',5))&&near(x.caveLevelK(5,'heal'),C('heal',5))&&near(x.caveLevelK(12),C('dmg',10))); }

// ---- saves are checked ----
const g=x.sanitizeGear({soul:'lava',mats:{slime:-5,nothing:3,boss:99999999,kappa:'7'},skills:{owned:['whirlwind','vitality','nope'],lv:{whirlwind:99,vitality:3,bash:4},pass:['vitality','vitality','ironwill']}},'warrior');
ok('a save is sanitized: an old save\'s soul is dropped, drops, skill levels, passives',g.soul===undefined&&!g.mats.slime&&!g.mats.nothing&&g.mats.boss===999&&g.mats.kappa===7&&g.skills.lv.whirlwind===5&&g.skills.lv.vitality===3&&!g.skills.lv.bash&&g.skills.pass[0]==='vitality'&&g.skills.pass.length===1,JSON.stringify([g.mats,g.skills.lv,g.skills.pass]));

// ---- a hiker at level 15 ----
inbox.a=[]; W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:14}}); tick(1);
const p=W.players.get('a');
W.receive('a',{t:'dev',cmd:'vale',v:2});
W.receive('a',{t:'dev',cmd:'level',v:15}); tick(1);
W.receive('a',{t:'soul',el:'fire'}); tick(1);   // the old message: nothing handles it any more
ok('the soul is gone: the old message changes nothing and no field is saved',you('a').gear.soul===undefined&&!evs.some(e=>e[0]==='soul'));

// ---- damage with elements ----
const slime=x.MONS.find(m=>m.def.id==='slime'), boar=x.MONS.find(m=>m.def.id==='boar'), magma=x.MONS.find(m=>m.def.id==='magmaslime'), shroom=x.MONS.find(m=>m.def.id==='shroom');
const eh=(el,m)=>x.elemHitS(p,el,m);
ok('damage: a fire skill on an air shroom = 1.5 (fire beats air)',near(eh('fire',shroom),1.5),eh('fire',shroom).toFixed(3));
ok('damage: a fire skill on a water slime = 1/1.5 (water beats fire)',near(eh('fire',slime),1/1.5),eh('fire',slime).toFixed(3));
ok('damage: on a fire monster a fire skill is resisted (1/1.5) and a water skill beats it (1.5)',near(eh('water',magma),1.5)&&near(eh('fire',magma),1/1.5));
ok('damage: an element-less skill deals x1.1 to a monster of any element; an element skill on an element-less monster is neutral',near(eh('basic',boar),1.1)&&near(eh('basic',shroom),1.1)&&near(eh('basic',magma),1.1)&&eh('fire',boar)===1&&eh('water',boar)===1);
// a real cast: the dmg event says the element helped (6th value 1)
evs.length=0;
for(let i=0;i<40&&!evs.some(e=>e[0]==='dmg'&&e[1]===shroom.id);i++){ W.setPos('a',[shroom.x+4,x.getH(shroom.x,shroom.z),shroom.z,Math.PI/2,0,0]); p.cd.basic=0; W.receive('a',{t:'atk',k:'basic',tg:shroom.id,face:Math.PI/2}); tick(30,true); }
const hit=evs.find(e=>e[0]==='dmg'&&e[1]===shroom.id); ok('a hit tells the client the element helped',hit&&hit[5]===1,JSON.stringify(hit));
ok('a hit of an element-less skill shows no arrow (fx 0), an element hit does',x.rollDmgS(p,1,boar,'basic').fx===0&&x.rollDmgS(p,1,shroom,'fire').fx===1&&x.rollDmgS(p,1,slime,'fire').fx===-1);

// ---- monster drops ----
p.gear.mats={}; let dropped=0;
for(let i=0;i<200;i++){ const before=p.gear.mats.slime||0; x.rewardKill(p,slime); dropped+=(p.gear.mats.slime||0)-before; }
tick(3); ok('kills drop the monster material (about 35% of kills)',dropped>=40&&dropped<=140&&evs.some(e=>e[0]==='drop'&&e[2]==='slime'),dropped+' in 200 kills');
p.gear.mats={}; x.rewardKill(p,x.MONS.find(m=>m.boss)); ok('a boss always drops its trophy',p.gear.mats.boss===3,JSON.stringify(p.gear.mats));

// ---- skill levels come from the Awakening tree (the old upskill path is retired; buying: tools/awakening-server-smoke.js) ----
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]);
W.receive('a',{t:'dev',cmd:'skills'}); tick(1);
p.gear.coins=99999; for(const m of x.upgradeNeeds('chain',2).mats) p.gear.mats[m.id]=99; W.receive('a',{t:'upskill',id:'chain'}); tick(1);
ok('upgrade: the old upskill message is retired (nothing changes, nothing is spent)',!p.gear.skills.lv.chain&&p.gear.coins===99999,JSON.stringify(p.gear.skills.lv)+' '+p.gear.coins);
W.receive('a',{t:'dev',cmd:'awk',v:'wanderer',n:1}); tick(1);
ok('a shop skill takes the Wanderer\'s branch of its slot, capped by the tier (A1: level 5)',you('a').gear.skills.lv.chain===5);
// the upgraded skill hits harder and cools down faster
W.receive('a',{t:'eqskill',id:'chain'}); p.cd.skill=0; p.act=null; W.receive('a',{t:'atk',k:'skill',tg:slime.id,face:0});
ok('an upgraded skill: damage x1.17^4 (x1.87), cooldown 12% shorter, its element goes along',p.act&&near(p.act.mult,x.SKILLS.chain.mult*Math.pow(1.17,4))&&near(p.cd.skill,x.SKILLS.chain.cd*0.88)&&p.act.lvl===5&&p.act.el==='air',p.act&&p.act.mult.toFixed(3)+' / cd '+p.cd.skill.toFixed(2));

// ---- passives (ONE slot, opens at level 10) ----
W.receive('a',{t:'dev',cmd:'reset'}); tick(1);
W.receive('a',{t:'dev',cmd:'level',v:9}); tick(1);
ok('passives: locked before level 10',you('a').gear.skills.pass.every(v=>v===null)&&!you('a').gear.skills.owned.includes('vitality'));
W.receive('a',{t:'dev',cmd:'level',v:10}); tick(1);
const y18=you('a'); ok('passives: level 10 opens the slot with a free Vitality',y18.gear.skills.pass[0]==='vitality'&&y18.gear.skills.owned.includes('vitality')&&evs.some(e=>e[0]==='skillslot'&&e[2]==='passive'));
const base18=Math.round(20*(10+Math.pow(13/12,10))); ok('Vitality raises maximum health by 6%',Math.abs(y18.maxHp-Math.round(base18*1.06))<=1,y18.maxHp+' vs '+base18);
const PASS=()=>JSON.stringify(you('a').gear.skills.pass);
W.receive('a',{t:'dev',cmd:'skills'}); evs.length=0; tick(1);
ok('passives: there is one slot, open from level 10',JSON.stringify(x.PASSIVE_SLOT_LV)==='[10]'&&x.PASSIVE_SLOTS===1&&[9,10,15,20,50].map(x.passiveOpen).join()==='0,1,1,1,1'&&PASS()==='["vitality"]');
W.receive('a',{t:'eqskill',id:'ferocity'}); tick(1);
ok('passives: the slot is full, so a passive without a slot is refused',PASS()==='["vitality"]'&&toasts().some(t=>/slot is full/.test(t)));
W.receive('a',{t:'eqskill',id:'precision',idx:0}); tick(1); ok('passives: dropping onto the full slot replaces what is in it',PASS()==='["precision"]'&&you('a').maxHp===base18);
W.receive('a',{t:'unskill',slot:'pass',idx:0}); tick(1); ok('passives: take it off',you('a').gear.skills.pass[0]===null&&PASS()==='[null]');
W.receive('a',{t:'eqskill',id:'ferocity'}); tick(1); ok('passives: with no slot given it takes the free one',PASS()==='["ferocity"]');
{ const g=x.sanitizeGear({skills:{owned:['vitality','ferocity','ironwill'],pass:[null,'ferocity','vitality']}},'warrior');
  ok('an old save with three passives keeps the first worn one in the slot and drops the rest from the loadout (they stay owned)',JSON.stringify(g.skills.pass)==='["ferocity"]'&&g.skills.owned.includes('vitality')&&g.skills.owned.includes('ironwill')&&JSON.stringify(x.sanitizeGear({skills:{owned:['vitality'],pass:['vitality','vitality','vitality']}},'warrior').skills.pass)==='["vitality"]');
  const hp=(pass,lv)=>x.passiveSum({owned:['vitality'],pass,lv:{}},lv,'hp');
  ok('a passive before the level that opens the slot does nothing',hp(['vitality'],9)===0&&hp(['vitality'],10)>0); }
{ inbox.e=[]; W.join('e',{name:'Slots',look:{cls:'warrior'},save:{level:14,exp:0,gear:{skills:{owned:['vitality','ferocity'],v:2,pass:[null,'ferocity','vitality']}}}}); tick(1);
  ok('a save at level 14 with passives in slots 2 and 3 keeps the first one in the one slot (both stay owned)',JSON.stringify(you('e').gear.skills.pass)==='["ferocity"]'&&you('e').gear.skills.owned.includes('ferocity')&&you('e').gear.skills.owned.includes('vitality'),JSON.stringify(you('e').gear.skills.pass)); }
p.gear.awk.wanderer={t:1,n:{spa1:1,pa1:1,spa2:1,pa2:1}}; x.recalcP(p); p.dirty=true; tick(1);
ok('passives: a shop passive takes the Wanderer\'s passive branch (pa2: level 2)',you('a').gear.skills.lv.ferocity===2);
delete p.gear.awk.wanderer; for(const id of x.PASSIVE_IDS) delete p.gear.skills.lv[id]; x.recalcP(p); p.dirty=true; tick(1);
// Iron Will takes some of every hit
W.receive('a',{t:'eqskill',id:'ironwill',idx:0}); tick(1);
const hp0=p.hp; p.lastHit=-99; x.hurtP(p,100,null); const lost=hp0-p.hp; ok('Iron Will: 5% less damage taken',lost===Math.max(1,Math.round(100*(1-p.red)*0.95)),'lost '+lost);
W.receive('a',{t:'dev',cmd:'level',v:24}); tick(1);
// a saved level 20 hiker who never had passives gets the free one on join
inbox.d=[]; W.join('d',{name:'Old',look:{cls:'warrior'},save:{level:20,exp:0,gear:{skills:{owned:[],v:2}}}}); tick(1);
ok('an old save at level 20 gets Vitality on join',you('d').gear.skills.pass[0]==='vitality');
// ---- boss skills are gone (skill revamp step 6): no row drops from a boss, and an old save's are dropped (the refund: server-smoke, 'save migration') ----
ok('no skill is a boss drop any more',!Object.values(x.SKILLS).some(s=>s.drop));
W.receive('a',{t:'dev',cmd:'reset'}); tick(3);
{ const q=W.players.get('a'); q.level=40; q.gear.coins=99999; const sk=Object.values(x.SKILLS).find(s=>!s.set&&s.price>0&&s.lv<=40&&!q.gear.skills.owned.includes(s.id)&&s.slot!=='passive');
  W.setPos('a',[x.VIL.x+150,x.getH(x.VIL.x+150,x.VIL.z),x.VIL.z,0,0,0]); tick(1); W.receive('a',{t:'buyskill',id:sk.id}); tick(2);
  ok('a skill cannot be bought out in the field (the trainer is in a village)',!q.gear.skills.owned.includes(sk.id)&&q.gear.coins===99999,sk.id);
  W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); tick(1); W.receive('a',{t:'buyskill',id:sk.id}); tick(2);
  ok('...and can be bought at the trainer',q.gear.skills.owned.includes(sk.id)&&q.gear.coins===99999-sk.price,sk.id); }
const sg=x.sanitizeGear({skills:{owned:['snare','lifesap'],lv:{snare:5,lifesap:3},eq:{warrior:{skill:'snare',burst:'lifesap'}}}},'warrior');
ok('a save loses the retired boss skills: not owned, not equipped, no level',!sg.skills.owned.includes('snare')&&sg.skills.eq.warrior.skill!=='snare'&&sg.skills.eq.warrior.burst!=='lifesap'&&!sg.skills.lv.snare&&!sg.skills.lv.lifesap);

// buffs: a buff that steals, one that cuts damage taken and heals; both give element-less attacks an element (set on the player directly: the engine, not a row)
{ const q=W.players.get('a'); W.receive('a',{t:'dev',cmd:'level',v:25}); tick(3); const magma=x.MONS.find(m=>m.def.id==='magmaslime'), slime2=x.MONS.find(m=>m.def.id==='slime');
  q.buff=null; const base=x.elemHitS(q,'basic',magma); q.buff={id:'lifesap',until:(x.S.t+10),dmg:1.2,cd:0.75,crit:0,red:0,steal:0.2,regen:0,el:'water'};
  ok('Lifesap Frenzy: element-less attacks count as Water (x1.5 on a fire monster instead of the basic x1.1)',near(base,1.1)&&near(x.elemHitS(q,'basic',magma),1.5)&&near(x.elemHitS(q,'fire',magma),1/1.5),base+' -> '+x.elemHitS(q,'basic',magma));
  q.hp=Math.round(q.maxHp/2); const h0=q.hp; slime2.hp=slime2.maxHp=1e9; const dealt=x.damageMonsterS(slime2,1,q,q.x,q.z,0,'basic'); ok('Lifesap Frenzy: you heal for 20% of the damage you deal',dealt>0&&Math.abs(q.hp-(h0+dealt*0.2))<1.01,'dealt '+dealt+', healed '+(q.hp-h0).toFixed(1));
  q.buff={id:'dawn',until:(x.S.t+10),dmg:1.15,cd:0.85,crit:0,red:0.4,steal:0,regen:0.03,el:'light'}; q.red=0; q.hp=q.maxHp; q.lastHit=-99; const before=q.hp; x.hurtP(q,100,null); const lost=before-q.hp;
  ok('Dawn Guard: 40% less damage taken',lost===Math.max(1,Math.round(100*(1-q.red)*(1-x.psP(q,'red'))*0.6)),'lost '+lost);
  q.hp=Math.round(q.maxHp*0.5); q.lastHit=x.S.t; const a0=q.hp; tick(20); ok('Dawn Guard: 3% of your health back every second',q.hp>a0+q.maxHp*0.03*0.9,'+'+(q.hp-a0).toFixed(1)+' in 1 s'); q.buff=null; }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
