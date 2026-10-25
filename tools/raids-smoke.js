// Headless test of the raids (shared/raids.js + the seven data files, server/raids.js and its hooks), straight from src/, no build: the registry and the sites, level 40..110 and 2^tier pay,
// the garrison and the structures, the boss pool, the tier lock on the first hit (a +0 friend cannot carry a tier VII player), wards waking the boss, spawners, the clear and its pay,
// the thirty-minute rebuild and the abandon reset, signature skills levelling with raid material, saves. Randomness is pinned where a number is compared. One line per check.
// Usage: node tools/raids-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['MONS','BOSSES','RDS','RD_ORDER','RD_BAD','RD_STATE','RD_LAYOUT','RD_UP','RD_MOB_HP','dgKOf','RD_RESET','RD_ABANDON','RD_BASE_LV','RD_FOOT','ARENAS','SS_SOURCES','SS_SETS','SKILLS','landAt','getH','waIsSea','waCoast','vDist','VR','arenaDist','rdLevel','rdMatFor','rdUpNeeds','rdMatsOf','rdSanitizeSave','rdCapTier','upgradeNeeds','MATS',
  'damageMonsterS','monK','zoneTierOn','sanitizeGear','newGearFor','bossState','DEF_BY_ID','killMonsterS','upgradeSkillP','skillLvOf','UP_COUNT','UP_COINS','BOSS_UP','SKILL_MAX_LV','PASSIVES','dgEntranceNear','ZTIER_MAX','VIL']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const zt=(home,vale)=>({home:{on:home[0],max:home[1]},vale:{on:vale[0],max:vale[1]},hoar:{on:0,max:0},grey:{on:0,max:0},sun:{on:0,max:0},gloam:{on:0,max:0}});
const LANDS=['home','vale','hoar','grey','sun','gloam','amber'];

// ---- the registry ----
ok('seven raids, one a land, none left out',x.RD_ORDER.length===7&&x.RD_BAD.length===0&&LANDS.every(l=>x.RD_ORDER.filter(i=>x.RDS[i].land===l).length===1),JSON.stringify(x.RD_BAD));
ok('each raid\'s boss pool is its land\'s two world bosses (the sets\' first two sources), no new boss',x.RD_ORDER.every(i=>{ const R=x.RDS[i]; return R.bosses.join()===x.SS_SOURCES[R.land].slice(0,2).join(); }));
ok('level 40 at +0 and ten more for each tier up to level 110 at tier VII; 1, 2, 4 ... 128 raid material',[0,1,2,3,4,5,6,7].map(x.rdLevel).join()==='40,50,60,70,80,90,100,110'&&[0,1,2,3,4,5,6,7].map(x.rdMatFor).join()==='1,2,4,8,16,32,64,128');
ok('every raid has 28 garrison monsters in 6 packs and 6 elites, 3 wards, 2 spawners, 4 barricades',x.RD_ORDER.every(i=>{ const R=x.RDS[i], n=R.packs.reduce((a,p)=>a+p.n,0); return R.packs.length===6&&n===22&&R.elites.length===6&&R.wards.length===3&&R.spawners.length===2&&R.barricades.length===4; }));
ok('the sites are dry land of their land, off the coast, clear of every village, door and world-boss arena',x.RD_ORDER.every(i=>{ const R=x.RDS[i]; return x.landAt(R.x,R.z)===R.land&&!x.waIsSea(R.x,R.z)&&x.waCoast(R.x,R.z)>60&&x.vDist(R.x,R.z)>x.VR+150&&!x.dgEntranceNear(R.x,R.z,120)&&x.ARENAS.every(A=>A.raid===i||Math.hypot(A.x-R.x,A.z-R.z)>A.r+60); }));
ok('the court and the yard are arenas (pads that flatten the ground and keep camps, plants and nodes away), the court the size of a boss arena',x.RD_ORDER.every(i=>{ const R=x.RDS[i]; return x.ARENAS.includes(R.court)&&x.ARENAS.includes(R.yard)&&R.court.r===20&&Number.isFinite(R.court.h); }));

// ---- the world holds them ----
ok('the world server builds all seven, ready, level 40, a boss asleep (immune) in each court; BOSSES is still the fourteen world fights',x.RD_STATE.length===7&&x.RD_STATE.every(s=>s.state==='ready'&&s.L===40&&s.boss&&s.boss.m.immune&&!s.bossLive&&s.garrison.length===28&&s.wards.length===3&&s.spawners.length===2)&&x.BOSSES.length===14);
ok('their monsters carry the raid and its numbers (monK is the raid level, not the zone tier); the boss rows reach the snapshot',x.RD_STATE.every(s=>s.all.every(m=>m.rd===s&&m.dgK&&m.dgK.lv===40))&&x.bossState().length===21);
ok('garrison health is cut to RD_MOB_HP of the ordinary numbers while the boss and the destructibles keep theirs, so a pack never outweighs the boss',x.RD_STATE.every(s=>s.garrison.every(m=>Math.abs(m.dgK.hp-x.dgKOf(m.def,s.L).hp*x.RD_MOB_HP)<1e-9)&&s.boss.m.dgK.hp===x.dgKOf(s.boss.m.def,s.L).hp&&[...s.wards,...s.spawners,...s.barricades].every(m=>m.dgK.hp===x.dgKOf(m.def,s.L).hp)&&s.garrison.reduce((a,m)=>a+m.def.hp*m.dgK.hp*(m.elite?2:1),0)<s.boss.m.def.hp*s.boss.m.dgK.hp*6));
ok('a world monster never sits on a pad: no camp inside any raid',x.MONS.every(m=>m.rd||x.RD_ORDER.every(i=>Math.hypot(m.x-x.RDS[i].x,m.z-x.RDS[i].z)>50)));

// ---- a fight ----
W.join('a',{name:'Tier3',look:{cls:'warrior'},save:{level:70,gear:{zt:zt([3,3],[0,0])}}}); W.join('b',{name:'Plain',look:{cls:'warrior'},save:{level:70,gear:{zt:zt([0,0],[0,0])}}}); tick(2);
const A=W.players.get('a'), B=W.players.get('b'), st=x.RD_STATE[x.RD_ORDER.indexOf('thornwall')], R=st.R;
const put=(p,lx,lz)=>W.setPos(p.id,[R.x+lx,x.getH(R.x+lx,R.z+lz),R.z+lz,0,0,0]);
put(A,0,-30); put(B,2,-30); tick(2);
const mob=st.garrison[0], hit=(p,m,mult)=>x.damageMonsterS(m,mult||0.001,p,m.x+1,m.z,0);
hit(B,mob);
ok('the first hit locks the raid to the ATTACKER\'S tier: a +0 hiker locks it at level 40',st.state==='engaged'&&st.tier===0&&st.L===40&&st.all.every(m=>m.dgK.lv===40));
hit(A,mob);
ok('a tier III hiker joining afterwards fights the same level-40 raid, and is paid at the raid\'s tier, not their own',st.tier===0&&x.monK(mob,A).lv===40&&x.rdCapTier(A.gear,'home',st.tier)===0);
ok('a raid cannot be carried the other way either: the credited tier is capped by the hiker\'s own unlocked tier',x.rdCapTier(B.gear,'home',5)===0&&x.rdCapTier(A.gear,'home',5)===3&&x.rdCapTier(A.gear,'home',2)===2);
{ // a fresh raid locked by the tier III hiker
  const st2=x.RD_STATE[x.RD_ORDER.indexOf('kurohana')]; A.gear.zt=zt([3,3],[2,2]); const m2=st2.garrison[0]; put(A,0,-30); // (a hiker stands anywhere: the lock reads the setting, not the position)
  W.setPos('a',[st2.R.x,x.getH(st2.R.x,st2.R.z),st2.R.z-30,0,0,0]); hit(A,m2);
  ok('locked by a vale tier II hiker: level 60 for everyone, the boss and the structures too, one event for the clients',st2.tier===2&&st2.L===60&&st2.all.every(m=>m.dgK.lv===60)); }
// the boss sleeps until the wards are broken
const bossM=st.boss.m, hp0=bossM.hp;
put(A,0,22); tick(5); const dmg0=hit(A,bossM,50);
ok('the boss behind its wards takes no hit and does not wake',dmg0===0&&bossM.hp===hp0&&!st.bossLive&&!st.boss.engaged);
for(const w of st.wards.slice(0,2)){ w.hp=0; x.killMonsterS(w,A); }
ok('two of three wards down: still asleep',!st.bossLive&&bossM.immune);
x.killMonsterS(st.wards[2],A);
ok('the last ward wakes the boss',st.bossLive&&!bossM.immune);
tick(10);
ok('the boss fights now (engaged with a player in the court), and its kit runs',st.boss.engaged&&bossM.aggro);
// reinforcements
st.reinfT=[0.01,0.01]; const before=x.MONS.filter(m=>m.rd===st&&m.rdSp!==undefined).length; tick(3);
const after=x.MONS.filter(m=>m.rd===st&&m.rdSp!==undefined&&!m.dead).length;
ok('while a war banner stands it calls reinforcements (a few at a time, raid monsters at the raid\'s level)',after>before&&x.MONS.filter(m=>m.rd===st&&m.rdSp!==undefined).every(m=>m.dgK.lv===st.L));
// the clear
A.hp=A.maxHp=1e9; B.hp=B.maxHp=1e9; const matA0=x.rdMatsOf(A).home|0, matB0=x.rdMatsOf(B).home|0, aliveG=st.garrison.filter(m=>!m.dead).length;
bossM.hp=0; x.killMonsterS(bossM,A);
ok('the boss down but a banner standing is not a clear',st.state==='engaged'&&st.bossDead);
for(const s of st.spawners){ s.hp=0; x.killMonsterS(s,A); }
ok('boss dead and every ward and banner broken: cleared, survivors flee (removed), the half hour starts',st.state==='cleared'&&st.clearT===x.RD_RESET&&st.garrison.every(m=>m.dead||m.remove)&&aliveG>0);
ok('paid 2^tier of the land\'s material to each hiker who fought here: 1 each at tier +0 (tier III A is capped to the raid\'s tier)',(x.rdMatsOf(A).home|0)===matA0+1&&(x.rdMatsOf(B).home|0)===matB0+1,'A '+x.rdMatsOf(A).home+' B '+x.rdMatsOf(B).home);
{ // the same clear at tier V pays 32
  const C={gear:{zt:{home:{on:0,max:0},vale:{on:0,max:0},hoar:{on:5,max:7},grey:{on:0,max:0},sun:{on:0,max:0},gloam:{on:0,max:0}}}};
  ok('a tier V clear pays 32; a hiker whose own best tier in the land is II is paid 4',x.rdMatFor(x.rdCapTier(C.gear,'hoar',5))===32&&x.rdMatFor(x.rdCapTier({zt:{hoar:{on:2,max:2}}},'hoar',5))===4&&x.rdCapTier(C.gear,'hoar',7)===7&&x.rdCapTier({},'hoar',5)===0); }
// the rebuild
st.clearT=0.02; tick(2);
ok('half an hour after the clear the raid is rebuilt: ready, level 40, a fresh garrison and structures, the boss rolled again and asleep',st.state==='ready'&&st.L===40&&st.garrison.length===28&&st.garrison.every(m=>!m.dead)&&st.wards.length===3&&st.boss&&st.boss.m.immune&&!st.bossLive&&x.RD_RESET===1800);
{ const st4=x.RD_STATE[x.RD_ORDER.indexOf('stonewatch')]; put(A,0,0); W.setPos('a',[st4.R.x,x.getH(st4.R.x,st4.R.z),st4.R.z-30,0,0,0]); hit(A,st4.garrison[0]); const pre=st4.garrison[0].id;
  W.setPos('a',[0,x.getH(0,0),0,0,0,0]); st4.emptyT=x.RD_ABANDON-0.05; tick(3);
  ok('an engaged raid nobody has been inside for ten minutes resets in full (no half-broken raid is held for ever)',st4.state==='ready'&&st4.garrison[0].id!==pre&&st4.garrison.every(m=>!m.dead)); }
// the real boss is untouched by a raid copy: killing one opens no tier and rolls nothing
{ const st5=x.RD_STATE[x.RD_ORDER.indexOf('kurohana')]; const ms=st5.boss.m, ak=A; ak.gear.zt=zt([3,3],[0,0]); st5.bossLive=true; ms.immune=false; ms.hp=0; const z0=JSON.stringify(ak.gear.zt); W.setPos('a',[st5.R.x,x.getH(st5.R.x,st5.R.z),st5.R.z+22,0,0,0]); ms.hitters.set(ak.id,0);
  x.killMonsterS(ms,ak);
  ok('a raid copy of a world boss opens no zone tier (the tiers stay what they were)',JSON.stringify(ak.gear.zt)===z0); }

// ---- signature skills level with raid material ----
const pieces=Object.keys(x.SKILLS).filter(id=>x.SKILLS[id].set&&x.SKILLS[id].slot==='skill');
const pc=pieces.find(id=>x.SS_SETS[x.SKILLS[id].set].land==='home'), sk=x.SKILLS[pc], P=A, S=P.gear.skills;
const need=x.upgradeNeeds(pc,2);
ok('a signature piece\'s level 2 costs coins, 3x the usual monster material (RD_MOB_K) and one raid material; level 5 also two trophies of the land\'s second boss; 1 / 2 / 4 / 8 and 15 a piece',
  need&&need.rd&&need.rd.land==='home'&&need.rd.n===1&&need.mats.length===1&&need.mats[0].n===x.UP_COUNT[2]*3&&x.upgradeNeeds(pc,5).mats.length===2&&x.upgradeNeeds(pc,5).mats[1].id==='carapax'&&x.upgradeNeeds(pc,5).rd.n===8&&Object.values(x.RD_UP).reduce((a,b)=>a+b,0)===15);
S.owned.push(pc); P.gear.coins=1e6; P.gear.mats={}; x.rdMatsOf(P).home=0;
W.setPos('a',[0,x.getH(0,0),0,0,0,0]);   // not in a village
W.receive('a',{t:'upskill',id:pc}); ok('refused outside a village',x.skillLvOf(S,pc)===1);
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z+4,0,0,0]); tick(1);
W.receive('a',{t:'upskill',id:pc}); ok('refused without the monster material and the raid material',x.skillLvOf(S,pc)===1);
P.gear.mats[need.mats[0].id]=need.mats[0].n;
W.receive('a',{t:'upskill',id:pc}); ok('refused with the monster material but no raid material (the raid material is required on top)',x.skillLvOf(S,pc)===1&&P.gear.mats[need.mats[0].id]===need.mats[0].n);
x.rdMatsOf(P).home=need.rd.n+1; const c0=P.gear.coins;
W.receive('a',{t:'upskill',id:pc});
ok('with all three it levels: coins, the monster material and exactly 4 raid material are spent (1 left over)',x.skillLvOf(S,pc)===2&&P.gear.coins===c0-need.coins&&!P.gear.mats[need.mats[0].id]&&x.rdMatsOf(P).home===1);
{ const q=x.sanitizeGear(JSON.parse(JSON.stringify(P.gear)),'warrior'); ok('the level and the raid material survive a save',q.skills.lv[pc]===2&&q.rd.mat.home===1); }
{ const r=x.rdSanitizeSave(JSON.parse('{"mat":{"home":5,"__proto__":9,"constructor":4,"vale":-3,"hoar":"x","grey":1e12,"extra":7}}'));
  ok('a save\'s raid material is clamped, junk and prototype names are dropped',JSON.stringify(r)==='{"mat":{"home":5,"grey":99999}}'&&JSON.stringify(x.rdSanitizeSave(null))==='{"mat":{}}',JSON.stringify(r)); }
{ const bp=pieces.find(id=>x.SS_SETS[x.SKILLS[id].set].land==='gloam'); ok('every land\'s sets ask for that land\'s own material and nothing else ',pieces.filter(id=>x.RD_ORDER.some(r=>x.RDS[r].land===x.SS_SETS[x.SKILLS[id].set].land)).every(id=>{ const n=x.upgradeNeeds(id,3); return n&&n.rd.land===x.SS_SETS[x.SKILLS[id].set].land; })&&x.upgradeNeeds(bp,2).rd.land==='gloam'); }
console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
