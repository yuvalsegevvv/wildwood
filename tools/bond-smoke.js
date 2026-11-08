// Headless test of the Bonds (skills revamp step 12: shared/bond.js, server/bond.js): buying Bond 0-VI in order at their stone costs, the zone-tier gates, the active Bond = min(Bond, pieces worn) less a
// step per guest piece, a Bond I passive working unequipped, the Bond II row, the +1 levels of Bond III / V, a guest piece's -2 levels, Bond passives refused by equip, the Wanderer's Realization from the
// main quest's acts, the smv-3 migration (idempotent), junk ids, and stones beyond Bond VI paid out in coins. The server straight from src/, no build.
// Step 13-14 (appended): the orb stall (price once, junk refused, the pouch rule, the 1 / 2 / 3 roll, excess stones as coins), the hour's Stirrings (a fake clock: one zone a land, no repeats, dungeon and raid
// alternating, events), charge (60 kills = an orb, an elite 3, Pipe and dungeon monsters never, saved), the stirring boss per tier, a dungeon win 2 orbs, a raid clear 3, the interim "a drop gives Bond 0" rule gone.
// Step 18 (appended): the Wanderer's paths: Fury and Bulwark register (passive, rows, burst, stat table), junk path ids refused, a path change is free and keeps the tree and Realization (a worn path
// passive / burst follows), Realization I / II / IV give the active path's rows only while the Wanderer is played, the path passive / burst are his after pa1 / bu1 (never bought), saves keep the path, a bad path file is left out and listed.
// Usage: node tools/bond-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:true,send(to,m){ sent.push([to,m]); }},
  ['SS_SETS','SS_ORDER','SKILLS','PASSIVES','CAVE_SKILLS','CAVE_SKILL_IDS','MQ','BD_COST','BD_TOP','BD_STONE_COINS','BD_GUEST_PEN','bdBuyP','bdAddStonesP','bdGrantP','bdOwns','bdMainOf','bdRealOf','bdTierNeed','bdIsBondPassive',
   'bdStonesLeft','awkGrantP','awkTierP','sanitizeGear','skillLvOf','caveLvOf','psP','recalcP','clsOfP','ssEquipPieceP','ssGrantSetP','SMIG_VER','passiveValue','BD_ORB_PRICE','BD_ORB_MAX','BD_ORB_ROLL','BD_STIR_SECS','BD_STIR_CHARGE','BD_STIR_BOSS','bdRollRow','bdStirPick','bdOrbBuyP','bdPickP','bdOpenOrbP','bdOpenManyP','bdOrbSetOf','bdStirPickS','bdStirTickS','bdStirMsg',
   'bdZonesByLand','BD_ZONE_OF','bdChargeS','bdStirBossP','bdStirDungeonP','bdStirRaidP','bdChargeFlushP','MONS','S','rewardKill','RD_ORDER','RDS','BOSS_DEFS','DG_THEMES','DG_ENTRANCES','ssGrantP','landAt',
   'WD_PATHS','WD_ORDER','WD_BAD','WD_DEFAULT','defineWandererPath','wdPathOf','ULT_SKILLS','ULT_BAD','AWK_PATH_KIT','ultEquippedP','buySkillP','equipSkillP','ssBonuses']);   // (the last row: step 18, the Wanderer's paths)
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info!==undefined?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<(n||3);i++) W.tick(0.05); };
W.join('a',{name:'Bonder',look:{cls:'warrior'},save:{level:60}}); tick();
const p=W.players.get('a'), g=p.gear, sk=g.skills;
const canon=o=>JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));
const near=(a,b)=>Math.abs(a-b)<1e-9;
const actOf=(id,cls)=>{ const P=x.SS_SETS[id].pos; return [1,2,3].map(q=>P[q].bound==='any'?P[q].ids[0]:P[q].ids.find(i=>x.SKILLS[i].cls===(cls||'warrior'))); };
// a real set whose Bond I passive is a plain stat (no trigger, no condition), with a charge skill of its own and a burst
const SET=x.SS_ORDER.map(i=>x.SS_SETS[i]).find(S=>!S.dev&&S.bonds&&actOf(S.id).every(Boolean)&&(()=>{ const P=x.PASSIVES[S.bonds[1]]; return P.stat&&!P.when&&!P.on&&!P.cost; })()&&x.CAVE_SKILL_IDS.some(i=>x.CAVE_SKILLS[i].set===S.id));
const K=SET.id, GUEST=x.SS_ORDER.find(i=>i!==K&&!x.SS_SETS[i].dev&&x.SS_SETS[i].bonds&&actOf(i)[0]);   // (a guest with a warrior basic: some sets' skill 1 is for one class)
ok('a test set with a stat Bond I passive and a charge skill: '+K+' (guest '+GUEST+')',!!SET&&!!GUEST);
const clear=()=>{ for(const c of ['warrior','archer','mage']) sk.eq[c]={basic:null,skill:null,burst:null}; sk.pass=sk.pass.map(()=>null); sk.cave=null; sk.ult=null; x.recalcP(p); };
const wear=ids=>{ for(const id of ids) x.ssEquipPieceP(p,x.SKILLS[id]); x.recalcP(p); };

// ---- buying: order, costs, gates ----
ok('a fresh hiker does not own the character (Bond -1), and Awakening refuses it',!x.bdOwns(p,K)&&typeof x.awkTierP(p,K)==='string');
ok('Bond 0 refused without stones',typeof x.bdBuyP(p,K)==='string'&&!x.bdOwns(p,K));
x.bdAddStonesP(p,K,6);
ok('Bond 0 for 6 stones: the character is yours, its actives (every class version) owned, the stones spent',x.bdBuyP(p,K)===null&&g.bd[K].b===0&&g.bd[K].st===0&&[1,2,3].every(q=>SET.pos[q].ids.every(i=>sk.owned.includes(i))));
ok('...the Bond passives are not granted',!sk.owned.includes(SET.bonds[1])&&!sk.owned.includes(SET.bonds[4]));
ok('...and Awakening is allowed (A1 bought for the price, no "unlock first")',(()=>{ g.coins=1e9; const r=x.awkTierP(p,K); return r===null||!/Unlock/.test(r); })());
g.zt[SET.land].max=0;
x.bdAddStonesP(p,K,3);
ok('Bond I refused below the set\'s zone tier ('+SET.tier+' in '+SET.land+'), stones kept',typeof x.bdBuyP(p,K)==='string'&&g.bd[K].b===0&&g.bd[K].st===3);
g.zt[SET.land].max=SET.tier;
ok('Bond I at the set\'s tier for 3 stones',x.bdBuyP(p,K)===null&&g.bd[K].b===1&&g.bd[K].st===0);
x.bdAddStonesP(p,K,3); ok('Bond II for 3 more',x.bdBuyP(p,K)===null&&g.bd[K].b===2);
x.bdAddStonesP(p,K,6);
ok('Bond III refused at the set\'s tier: it asks tier +1 ('+x.bdTierNeed(SET,3)+')',x.bdTierNeed(SET,3)===SET.tier+1&&typeof x.bdBuyP(p,K)==='string'&&g.bd[K].b===2);
g.zt[SET.land].max=SET.tier+1;
ok('Bond III (6 stones) and IV (6) at tier +1',x.bdBuyP(p,K)===null&&(x.bdAddStonesP(p,K,6),x.bdBuyP(p,K)===null)&&g.bd[K].b===4&&g.bd[K].st===0);
x.bdAddStonesP(p,K,9);
ok('Bond V refused at tier +1: it asks tier +2, at most V ('+x.bdTierNeed(SET,5)+')',x.bdTierNeed(SET,5)===Math.min(5,SET.tier+2)&&typeof x.bdBuyP(p,K)==='string');
g.zt[SET.land].max=5;
ok('Bond V (9) and VI (9)',x.bdBuyP(p,K)===null&&(x.bdAddStonesP(p,K,9),x.bdBuyP(p,K)===null)&&g.bd[K].b===6);
ok('the costs are 6 3 3 6 6 9 9 (42 in all)',x.BD_COST.join()==='6,3,3,6,6,9,9'&&x.bdStonesLeft(-1)===42);
ok('nothing above Bond VI',typeof x.bdBuyP(p,K)==='string'&&g.bd[K].b===6);
// ---- stones beyond Bond VI ----
{ const c0=g.coins; const r=x.bdAddStonesP(p,K,4); ok('stones beyond Bond VI are coins ('+x.BD_STONE_COINS+' each)',r.st===0&&r.coins===4*x.BD_STONE_COINS&&g.coins===Math.min(c0+4*x.BD_STONE_COINS,1e12)&&g.bd[K].st===0,JSON.stringify(r)); }
{ const e=g.bd[K], b=e.b; e.b=4; e.st=0; const c0=g.coins, r=x.bdAddStonesP(p,K,20); ok('...and only the stones the steps left still need are kept (Bond IV: 18 kept of 20, 2 paid)',r.st===18&&e.st===18&&g.coins-c0===2*x.BD_STONE_COINS,JSON.stringify(r)); e.b=b; e.st=0; }

// ---- the active Bond ----
const A=actOf(K), bondP=x.PASSIVES[SET.bonds[1]], stat=bondP.stat;
clear(); x.awkGrantP(p,K,2); x.recalcP(p);
const base=A.map(i=>x.skillLvOf(sk,i));
clear(); wear([A[0]]);
ok('one piece worn at Bond VI: the active Bond is 1 (min of Bond and pieces worn)',sk.bdx.main===K&&sk.bdx.act===1,sk.bdx.act);
const ps1=x.psP(p,stat);
ok('...the Bond I passive works unequipped (its stat '+stat+' is in psP, not in the passive slot)',!!sk.bdx.p[SET.bonds[1]]&&!sk.pass.includes(SET.bonds[1])&&ps1>0);
ok('...no Bond II row with one piece',!p.ss.bonus.some(b=>b.row.id===SET.bonds[2]));
wear([A[1]]);
ok('two pieces: Bond II, the 3-set row in force (fed by the Bond, not by the count)',sk.bdx.act===2&&p.ss.bonus.some(b=>b.row.id===SET.bonds[2]),sk.bdx.r.join());
ok('...no +1 level yet',x.skillLvOf(sk,A[0])===base[0]);
wear([A[2]]);
ok('three pieces: Bond III, +1 level to the character\'s pieces (above the tier cap)',sk.bdx.act===3&&x.skillLvOf(sk,A[0])===base[0]+1&&x.skillLvOf(sk,A[2])===base[2]+1,x.skillLvOf(sk,A[0])+' vs '+base[0]);
{ const kp=SET.keptPassive; if(!sk.owned.includes(kp)) sk.owned.push(kp); sk.pass[0]=kp; x.recalcP(p);
  const cid=x.CAVE_SKILL_IDS.find(i=>x.CAVE_SKILLS[i].set===K); g.cave.own[cid]=3; sk.cave=cid; x.recalcP(p); const cb=g.cave.own[cid];   // (the tree writes its level)
  ok('five places worn (the actives, the kept passive, the charge skill): Bond V, +2 levels, the charge skill too',sk.bdx.act===5&&x.skillLvOf(sk,A[0])===base[0]+2&&x.caveLvOf(p,cid)===Math.min(12,cb+2),sk.bdx.act+' '+x.skillLvOf(sk,A[0])+' '+x.caveLvOf(p,cid));
  ok('...the Bond IV passive and no 5-set row yet',!!sk.bdx.p[SET.bonds[4]]&&!sk.bdx.r.includes(SET.bonds[6])); }
// the gate below Bond I: the same piece at Bond 0
{ const e=g.bd[K]; e.b=0; clear(); wear([A[0]]); const ps0=x.psP(p,stat);
  ok('at Bond 0 the Bond I passive does nothing, worn pieces or not',sk.bdx.act===0&&!sk.bdx.p[SET.bonds[1]]&&near(ps1-ps0,x.passiveValue(SET.bonds[1],1)),ps1+' '+ps0);
  wear([A[1],A[2]]); ok('...and no row and no level with three worn',!p.ss.bonus.length&&x.skillLvOf(sk,A[0])===base[0]); e.b=6; }
// ---- guests ----
{ x.ssGrantSetP(p,GUEST,true); x.awkGrantP(p,GUEST,5); clear(); wear(A); const ga=actOf(GUEST)[0], gb=x.skillLvOf(sk,ga);
  clear(); wear([A[1],A[2],ga]);   // the main's skill and power, the guest's basic
  ok('the main character is the power piece\'s set',x.bdMainOf(p)===K&&sk.bdx.main===K);
  ok('a guest piece costs the main one Bond step (2 own pieces, 1 guest: active Bond 1)',sk.bdx.g===1&&sk.bdx.act===1,sk.bdx.act);
  ok('...and is '+x.BD_GUEST_PEN+' levels lower, with none of its own Bond levels',x.skillLvOf(sk,ga)===Math.max(1,gb-x.BD_GUEST_PEN),gb+' -> '+x.skillLvOf(sk,ga)); }
// ---- equip refuses the Bond passives ----
{ clear(); const bp=SET.bonds[1]; if(!sk.owned.includes(bp)) sk.owned.push(bp);
  ok('a Bond passive is one',x.bdIsBondPassive(bp)&&!x.bdIsBondPassive(SET.keptPassive));
  W.receive('a',{t:'eqskill',id:bp}); ok('equip refuses a Bond passive',!sk.pass.includes(bp),sk.pass.join());
  const s2=x.sanitizeGear({skills:{owned:[bp,'vitality'],pass:[bp,'vitality']},smv:3},'warrior');
  ok('a save wearing one has the next passive in the slot (or none)',s2.skills.pass[0]==='vitality',s2.skills.pass.join()); }
// ---- Realization ----
{ const M=x.MQ, last=L=>{ let i=-1; M.forEach((s,k)=>{ if(s.id[0]===L) i=k; }); return i; };
  const R=s=>x.bdRealOf({mq:{s}});
  ok('Realization from the acts: 0, I after act I, II, III, then VI after act IV',R(0)===0&&R(last('W')+1)===1&&R(last('V')+1)===2&&R(last('F')+1)===3&&R(last('G')+1)===6&&R(last('G'))===3,[0,last('W')+1,last('V')+1,last('F')+1,last('G')+1].map(R).join());
  clear(); const gen=sk.owned.find(i=>x.SKILLS[i]&&!x.SKILLS[i].set&&x.SKILLS[i].cls==='warrior'&&x.SKILLS[i].slot==='skill'); sk.eq.warrior.skill=gen;
  g.mq.s=last('F')+1; x.recalcP(p); const l3=x.skillLvOf(sk,gen);
  g.mq.s=last('V')+1; x.recalcP(p); const l2=x.skillLvOf(sk,gen);
  g.mq.s=last('G')+1; x.recalcP(p); const l6=x.skillLvOf(sk,gen);
  ok('the Wanderer (no set piece worn) at Realization III has +1 level on a general skill, +2 at VI',sk.bdx.main==='wanderer'&&l3===l2+1&&l6===l2+2&&g.bd.wanderer.r===6,l2+' '+l3+' '+l6); }
// ---- migration ----
{ const raw={smv:2,bdMig:[K],skills:{owned:[actOf(GUEST)[0]]},bd:{[x.SS_ORDER.find(i=>i!==K&&i!==GUEST&&!x.SS_SETS[i].dev)]:{b:3,st:2}}};
  const m1=x.sanitizeGear(raw,'warrior'), m2=x.sanitizeGear(JSON.parse(JSON.stringify(m1)),'warrior');
  ok('smv '+x.SMIG_VER+': a set in bdMig and a set with a piece owned get Bond 0; a higher Bond stays',x.SMIG_VER===3&&m1.smv===3&&m1.bd[K].b===0&&m1.bd[GUEST].b===0&&Object.values(m1.bd).some(e=>e.b===3&&e.st===2),JSON.stringify(m1.bd));
  ok('...idempotent (a second load changes nothing)',canon(m2.bd)===canon(m1.bd)&&canon(m2.awk)===canon(m1.awk)&&m2.skills.owned.join()===m1.skills.owned.join(),JSON.stringify(m2.bd));
  ok('...nobody loses a skill they had',m1.skills.owned.includes(actOf(GUEST)[0])); }
// ---- junk ----
{ let threw=false; try{ for(const v of ['constructor','__proto__','toString','nope',null,5,{}]){ W.receive('a',{t:'bd',a:'buy',set:v}); x.bdBuyP(p,v); x.bdAddStonesP(p,v,5); } W.receive('a',{t:'bd',a:'x'}); }catch(e){ threw=e; }
  ok('junk set ids are refused without a throw',!threw&&x.bdBuyP(p,'constructor')==='unknown character'&&!Object.prototype.hasOwnProperty.call(g.bd,'constructor'),threw&&threw.message);
  const s=x.sanitizeGear({bd:{constructor:{b:6,st:9},toString:{b:6},nope:{b:3},[K]:{b:99,st:-5},[GUEST]:{b:'x',st:1e9}},smv:3},'warrior');
  ok('a save\'s gear.bd keeps known sets only, numbers clamped',!Object.prototype.hasOwnProperty.call(s.bd,'constructor')&&!Object.prototype.hasOwnProperty.call(s.bd,'toString')&&!s.bd.nope&&s.bd[K].b===6&&s.bd[K].st===0&&s.bd[GUEST].b===-1&&s.bd[GUEST].st===999,JSON.stringify(s.bd)); }

// ---- step 13: orbs ----
W.join('b',{name:'Orber',look:{cls:'warrior'},save:{level:60}}); tick();
const pb=W.players.get('b'), gb=pb.gear, K2=x.SS_ORDER.filter(i=>!x.SS_SETS[i].dev&&x.SS_SETS[i].bonds)[1], K3=x.SS_ORDER.filter(i=>!x.SS_SETS[i].dev&&x.SS_SETS[i].bonds)[2];
const evsOf=(name,from)=>{ const out=[]; for(const [to,m] of sent.slice(from||0)) if(to==='a'&&m&&m.t==='snap'&&m.ev) for(const e of m.ev) if(e[0]===name) out.push(e); return out; };
ok('no character is called pick / chg / wanderer (gear.bd keys)',!['pick','chg','wanderer'].some(k=>Object.prototype.hasOwnProperty.call(x.SS_SETS,k)));
gb.coins=1000;
ok('an orb costs '+x.BD_ORB_PRICE+' coin',x.BD_ORB_PRICE===1);
ok('buying 5 orbs charges 5 coins once and holds 5',x.bdOrbBuyP(pb,K2,5)===null&&gb.coins===995&&gb.bd[K2].o===5,gb.coins+' '+JSON.stringify(gb.bd[K2]));
ok('n is clamped to 1..99 (a huge n buys 99, junk and zero buy 1)',(x.bdOrbBuyP(pb,K3,1e9),gb.bd[K3].o===99&&gb.coins===896)&&(x.bdOrbBuyP(pb,K3,'x'),gb.bd[K3].o===100)&&(x.bdOrbBuyP(pb,K3,-4),gb.bd[K3].o===101),gb.bd[K3].o+' '+gb.coins);
{ const c0=gb.coins; for(const v of ['constructor','__proto__','toString','nope',null,5,{},'pick','chg','wanderer']){ W.receive('b',{t:'bd',a:'orb',set:v,n:3}); W.receive('b',{t:'bd',a:'pick',set:v}); x.bdOrbBuyP(pb,v,3); }
  ok('junk set ids buy nothing and charge nothing',gb.coins===c0&&!Object.prototype.hasOwnProperty.call(gb.bd,'constructor')&&!Object.prototype.hasOwnProperty.call(gb.bd,'nope')&&gb.bd.chg===undefined,String(gb.coins)); }
{ const c0=gb.coins; gb.coins=2; ok('too few coins: refused, nothing taken',typeof x.bdOrbBuyP(pb,K2,5)==='string'&&gb.coins===2&&gb.bd[K2].o===5); gb.coins=c0; }
{ gb.bd[K2].o=x.BD_ORB_MAX; const c0=gb.coins; ok('a full pouch of one character refuses more',typeof x.bdOrbBuyP(pb,K2,5)==='string'&&gb.coins===c0&&gb.bd[K2].o===x.BD_ORB_MAX); gb.bd[K2].o=5; }
// the pouch rule
ok('no pick: the set with the most orbs opens ('+K3+' 101 against '+K2+' 5)',x.bdOrbSetOf(pb)===K3);
ok('pick a set with orbs held: it opens first',x.bdPickP(pb,K2)===null&&gb.bd.pick===K2&&x.bdOrbSetOf(pb)===K2);
{ gb.bd[K2].o=0; ok('pick a set with none held: the most-held set opens instead',x.bdOrbSetOf(pb)===K3); gb.bd[K2].o=5; }
ok('a pick of junk is refused and keeps the old pick',typeof x.bdPickP(pb,'constructor')==='string'&&gb.bd.pick===K2&&x.bdPickP(pb,null)===null&&gb.bd.pick===undefined);
ok('the pick is sanitized on load (known set only) and survives the round trip',(()=>{ const s1=x.sanitizeGear({smv:3,bd:{pick:K2,chg:30,[K2]:{b:-1,st:0,o:7},[K3]:{o:1e9}}},'warrior'), s2=x.sanitizeGear({smv:3,bd:{pick:'constructor',chg:1e9,[K2]:{o:-3}}},'warrior');
  return s1.bd.pick===K2&&s1.bd.chg===30&&s1.bd[K2].o===7&&s1.bd[K3].o===x.BD_ORB_MAX&&s2.bd.pick===undefined&&s2.bd.chg===x.BD_STIR_CHARGE&&!s2.bd[K2]; })());
// opening
{ const n0=gb.bd[K2].o, st0=gb.bd[K2].st, from=sent.length; x.bdPickP(pb,K2); const r=x.bdOpenOrbP(pb); tick();
  const e=evsOf('orb',from).filter(v=>v[1]==='b');   // (the events reach every hiker: read them as 'a')
  ok('opening one orb takes one, gives 1-3 stones and sends event orb [pid, set, stones, coins]',r&&r.set===K2&&gb.bd[K2].o===n0-1&&gb.bd[K2].st===st0+r.n&&r.n>=1&&r.n<=3&&e.length===1&&e[0][2]===K2&&e[0][3]===r.n&&e[0][4]===0,JSON.stringify(e)); }
{ const a=[0,0,0,0]; let seed=12345; const keep=Math.random; Math.random=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  for(let i=0;i<6000;i++) a[x.bdRollRow(x.BD_ORB_ROLL,Math.random())]++; Math.random=keep;
  ok('the roll is 1 / 2 / 3 stones at 60 / 30 / 10 % (6000 rolls, 3 points of slack)',Math.abs(a[1]/60-60)<3&&Math.abs(a[2]/60-30)<3&&Math.abs(a[3]/60-10)<3&&x.BD_ORB_ROLL.join()==='60,30,10',a.join()); }
{ gb.bd[K3].st=0; gb.bd[K3].o=3000; gb.bd[K3].b=-1; x.bdPickP(pb,K3); const c0=gb.coins, cnt=[0,0,0,0], keep=Math.random; let seed=99; Math.random=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  let stones=0; for(let i=0;i<3000;i++){ const r=x.bdOpenOrbP(pb); cnt[r.n]++; stones+=r.n; } Math.random=keep;
  ok('3000 real opens: the 1 / 2 / 3 split holds, the orbs are used up',Math.abs(cnt[1]/30-60)<3&&Math.abs(cnt[2]/30-30)<3&&Math.abs(cnt[3]/30-10)<3&&gb.bd[K3].o===undefined,cnt.join());
  ok('...only the 42 stones the steps need are kept, the rest paid as coins ('+x.BD_STONE_COINS+' each)',gb.bd[K3].st===42&&gb.coins-c0===(stones-42)*x.BD_STONE_COINS,gb.bd[K3].st+' '+(gb.coins-c0)+' '+stones); }
{ gb.bd[K2].o=0; gb.bd[K3].o=0; delete gb.bd.pick; ok('no orbs anywhere: bdOpenOrbP returns null, bdOpenManyP opens 0',x.bdOpenOrbP(pb)===null&&x.bdOpenManyP(pb,3)===0); }

// ---- step 14: the hour's Stirrings, with a fake clock ----
const H=x.BD_STIR_SECS*1000, h0=Math.floor(Date.now()/H);
const realNow=Date.now; let fake=h0*H+1000; Date.now=()=>fake;
{ x.S.bdStir=null; tick(); const s0=x.S.bdStir, from=sent.length;
  ok('picks exist and the welcome message carries them',!!s0&&s0.h===h0&&x.bdStirMsg().h===h0&&x.bdStirMsg().b===s0.boss);
  const lands=[...new Set(Object.keys(x.bdZonesByLand()))];
  ok('one ordinary zone in every land ('+lands.length+' lands)',lands.length>=8&&lands.every(l=>s0.zones[l]!==undefined&&x.bdZonesByLand()[l].includes(s0.zones[l])),JSON.stringify(s0.zones));
  tick(5); ok('same hour, same picks, no stir event',x.S.bdStir===s0&&evsOf('stir',from).length===0);
  fake+=H; tick(4); const s1=x.S.bdStir, e=evsOf('stir',from);
  ok('the hour turns: new picks and one stir event {h, z, b, k, id}',s1!==s0&&s1.h===h0+1&&e.length===1&&e[0][1].h===h0+1&&e[0][1].b===s1.boss&&e[0][1].z.home===s1.zones.home,JSON.stringify(e).slice(0,120)); }
{ let bad='', dgn=0, rdn=0, prev=null; const N=400;
  for(let i=0;i<N;i++){ const s=x.bdStirPickS((h0+2+i)*H);
    if(prev){ for(const l of Object.keys(s.zones)) if(s.zones[l]===prev.zones[l]) bad+=' zone '+l+'@'+i; if(s.boss===prev.boss) bad+=' boss@'+i; if(s.kind===prev.kind) bad+=' kind@'+i; if(s.id===prev.id) bad+=' id@'+i; }
    if(s.kind==='dg'){ dgn++; if(!x.DG_THEMES[s.id]||s.h%2!==0) bad+=' dg@'+i; } else { rdn++; if(!x.RDS[s.id]||s.h%2!==1) bad+=' rd@'+i; }
    prev=s; }
  ok('400 hours: no zone, boss or dungeon / raid repeats two hours running, and dungeons and raids alternate',bad===''&&dgn===N/2&&rdn===N/2,bad); }
{ const seen=new Set(); const lists=x.bdZonesByLand().home, N=lists.length; for(let i=0;i<N;i++) seen.add(x.bdStirPickS((h0*0+Math.floor(h0/N)*N+i)*H).zones.home);
  ok('a land\'s zones each come once before any returns (a cycle of '+N+')',seen.size===N,seen.size); }
ok('the pick is the same on every call for one hour (no state)',JSON.stringify(x.bdStirPickS(h0*H).zones)===JSON.stringify(x.bdStirPickS(h0*H+5).zones));
// helpers: put a wanted pick in force
const forceHour=f=>{ for(let i=0;i<5000;i++){ const s=x.bdStirPickS((h0+10+i)*H); if(f(s)) return s; } return null; };
// charge
const zoneKind=key=>x.MONS.find(m=>x.BD_ZONE_OF[m.def.id]===key&&!m.dead&&!m.temp&&!m.def.boss);
const sz=forceHour(s=>true), zkey=sz.zones.home, mon=zoneKind(zkey);
ok('a monster of the stirring zone exists to test with ('+zkey+')',!!mon);
gb.bd={wanderer:{r:0}}; gb.bd[K2]={b:-1,st:0,o:5}; const clone=o=>Object.assign(Object.create(mon),o);
{ for(let i=0;i<59;i++) x.bdChargeS(pb,mon); ok('59 kills: charge 59, no orb opened',gb.bd.chg===59&&gb.bd[K2].o===5);
  x.bdChargeS(pb,mon); ok('the 60th kill opens one orb: charge 0, one orb used, stones in',gb.bd.chg===undefined&&gb.bd[K2].o===4&&gb.bd[K2].st>=1,JSON.stringify(gb.bd[K2])); }
{ const o0=gb.bd[K2].o; for(let i=0;i<20;i++) x.bdChargeS(pb,clone({elite:true})); ok('an elite counts 3 (20 elites = 60: one orb)',gb.bd[K2].o===o0-1&&gb.bd.chg===undefined,JSON.stringify(gb.bd)); }
{ const o0=gb.bd[K2].o, c0=gb.bd.chg|0; for(let i=0;i<100;i++){ x.bdChargeS(pb,clone({dip:true})); x.bdChargeS(pb,clone({inst:1})); x.bdChargeS(pb,clone({rd:{}})); x.bdChargeS(pb,clone({temp:true})); }
  ok('Pipe, dungeon, raid and temporary monsters never charge',(gb.bd.chg|0)===c0&&gb.bd[K2].o===o0); }
{ const other=forceHour(s=>true), outside=x.MONS.find(m=>x.BD_ZONE_OF[m.def.id]&&!x.S.bdStir.zs[x.BD_ZONE_OF[m.def.id]]&&!m.dead&&!m.temp), c0=gb.bd.chg|0; x.bdChargeS(pb,outside);
  const boss=x.MONS.find(m=>m.def.boss); x.bdChargeS(pb,boss);
  ok('a monster outside the stirring zones, and a boss, charge nothing',(gb.bd.chg|0)===c0); x.bdStirPickS((h0+10)*H); }
{ x.S.bdStir=null; const s=forceHour(t=>true), m2=zoneKind(s.zones.home); gb.bd[K2].o=0; delete gb.bd.chg; for(let i=0;i<200;i++) x.bdChargeS(pb,m2);
  ok('with no orb held the charge waits at the cap (60), nothing is lost or opened',gb.bd.chg===x.BD_STIR_CHARGE&&!gb.bd[K2].o);
  gb.coins=100; const st0=gb.bd[K2].st; x.bdOrbBuyP(pb,K2,2);
  ok('...an orb arriving is opened by the waiting charge: charge 0, one orb left, stones in',gb.bd.chg===undefined&&gb.bd[K2].o===1&&gb.bd[K2].st>st0,JSON.stringify(gb.bd[K2])+' chg '+gb.bd.chg); }
{ x.S.bdStir=null; const s=forceHour(t=>true), m2=zoneKind(s.zones.vale); const c0=gb.bd.chg|0; x.rewardKill(pb,m2);
  ok('rewardKill itself charges (one real kill in the stirring zone adds 1)',(gb.bd.chg|0)===c0+1,String(gb.bd.chg)); }
ok('the charge is saved: sanitizeGear keeps gear.bd.chg and the orbs',(()=>{ gb.bd.chg=37; const s=x.sanitizeGear(JSON.parse(JSON.stringify(gb)),'warrior'); return s.bd.chg===37&&s.bd[K2].o===gb.bd[K2].o; })());
// the stirring boss
{ const s=forceHour(t=>true), boss=x.MONS.find(m=>m.def.boss&&m.def.id===s.boss)||x.MONS.find(m=>m.def.boss), other=x.MONS.find(m=>m.def.boss&&m.def.id!==s.boss);
  const bm=Object.assign(Object.create(boss),{def:Object.assign(Object.create(boss.def),{id:s.boss})});
  ok('the boss table is 100 / 70-30 / 50-50 / 30-70 / 20-60-20 / 10-50-40 and averages 1.0 1.3 1.5 1.7 2.0 2.3',x.BD_STIR_BOSS.map(r=>r.reduce((a,v,i)=>a+v*(i+1),0)/100).map(v=>v.toFixed(1)).join()==='1.0,1.3,1.5,1.7,2.0,2.3'&&x.BD_STIR_BOSS.every(r=>r.reduce((a,v)=>a+v,0)===100));
  const keep=Math.random; let seed=7; Math.random=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const stat={}; for(let t=0;t<=5;t++){ const cnt=[0,0,0,0]; gb.bd[K2].o=0; for(let i=0;i<2000;i++){ gb.bd[K2].o=3; const o0=3; x.bdStirBossP(pb,bm,t); cnt[o0-(gb.bd[K2].o|0)]++; } stat[t]=cnt; }
  Math.random=keep;
  const near=(c,tbl)=>tbl.every((p,i)=>Math.abs(c[i+1]/20-p)<4)&&c.slice(tbl.length+1).every(v=>v===0)&&c[0]===0;
  ok('per tier the stirring boss opens orbs by the table (2000 kills each, 4 points of slack)',x.BD_STIR_BOSS.every((tbl,t)=>near(stat[t],tbl)),JSON.stringify(stat));
  gb.bd[K2].o=5; x.bdStirBossP(pb,Object.assign(Object.create(other),{}),5); ok('a boss that is not the stirring one opens nothing',gb.bd[K2].o===5);
  x.bdStirBossP(pb,Object.assign(Object.create(bm),{rd:{}}),5); x.bdStirBossP(pb,Object.assign(Object.create(bm),{inst:1}),5); ok('...and neither does a raid copy or a dungeon boss',gb.bd[K2].o===5);
  gb.bd[K2].o=1; const e0=gb.bd[K2].o; Math.random=()=>0.99; x.bdStirBossP(pb,bm,5); Math.random=keep; ok('fewer orbs held than the roll opens only those held (1 held, a roll of 3: 1 opened, none banked)',gb.bd[K2].o===undefined||gb.bd[K2].o===0); }
// dungeon and raid
{ const sd=forceHour(t=>t.kind==='dg'), run={theme:{id:sd.id}}, wrong={theme:{id:x.DG_THEMES[sd.id]?Object.keys(x.DG_THEMES).find(k=>k!==sd.id&&!x.DG_THEMES[k].dev):'x'}};
  gb.bd[K2].o=5; x.bdStirDungeonP(pb,wrong); ok('a win of another dungeon opens nothing',gb.bd[K2].o===5);
  x.bdStirDungeonP(pb,run); ok('a win of the stirring dungeon opens 2 orbs',gb.bd[K2].o===3,String(gb.bd[K2].o));
  const sr=forceHour(t=>t.kind==='rd'), R=x.RDS[sr.id]; gb.bd[K2].o=5; x.bdStirRaidP(pb,x.RDS[x.RD_ORDER.find(i=>i!==sr.id)]); ok('a clear of another raid opens nothing',gb.bd[K2].o===5);
  x.bdStirRaidP(pb,R); ok('a clear of the stirring raid opens 3 orbs',gb.bd[K2].o===2,String(gb.bd[K2].o));
  x.bdStirDungeonP(pb,{theme:{id:sd.id}}); ok('...and in a raid hour a dungeon win opens nothing (dungeon and raid alternate)',gb.bd[K2].o===2); }
Date.now=realNow;
// ---- the interim rule is gone ----
{ const pc=W.players.get('b'); const G=x.SS_ORDER.find(i=>!x.SS_SETS[i].dev&&x.SS_SETS[i].bonds&&i!==K&&i!==K2&&i!==K3); delete pc.gear.bd[G]; x.ssGrantP(pc,G,1,true);
  ok('a piece earned the old way (a drop source: ssGrantP) no longer unlocks the character (no Bond 0, Awakening refused)',!x.bdOwns(pc,G)&&typeof x.awkTierP(pc,G)==='string');
  x.ssGrantSetP(pc,G,true); ok('...a whole-set grant (testing tools, gem shop) still does',x.bdOwns(pc,G)); }

// ---- step 18: the Wanderer's paths ----
{ const last=L=>{ let i=-1; x.MQ.forEach((q,k)=>{ if(q.id[0]===L) i=k; }); return i; };
  const F=x.WD_PATHS.fury, B=x.WD_PATHS.bulwark;
  ok('the paths register: Fury and Bulwark, nothing left out, each a passive, Realization I / IV rows, II / VI rows, a burst and a stat table',x.WD_ORDER.includes('fury')&&x.WD_ORDER.includes('bulwark')&&!x.WD_BAD.length&&!x.ULT_BAD.length
    &&[F,B].every(P=>x.PASSIVES[P.passive]&&x.PASSIVES[P.passive].wd===P.id&&x.PASSIVES[P.real[1]].wdRow===1&&x.PASSIVES[P.real[4]].wdRow===4&&P.rows[2]&&P.rows[6]&&x.ULT_SKILLS[P.ult]&&x.ULT_SKILLS[P.ult].wd===P.id&&x.AWK_PATH_KIT[P.id]===P.kit)
    &&F.kit==='risk'&&B.kit==='tank'&&x.WD_DEFAULT==='fury',JSON.stringify(x.WD_BAD));
  ok('...each passive beats its shop passive (Fury > Ferocity, Bulwark > Vitality), the Realization I / IV rows are never worn',x.PASSIVES.wd_fury.v[0]>x.PASSIVES.ferocity.v[0]&&x.PASSIVES.wd_bulwark.v[0]>x.PASSIVES.vitality.v[0]&&x.bdIsBondPassive('wd_fury_r1')&&x.bdIsBondPassive('wd_bulwark_r4')&&!x.bdIsBondPassive('wd_fury'));
  W.join('w',{name:'Walker',look:{cls:'warrior'},save:{level:60}}); tick();
  const pw=W.players.get('w'), gw=pw.gear, sw=gw.skills;
  ok('a fresh Wanderer walks Fury (the default), owns no path passive or burst before his tree',x.wdPathOf(gw)==='fury'&&gw.bd.wanderer.path==='fury'&&!sw.owned.includes('wd_fury')&&!sw.wdu);
  for(const v of ['constructor','__proto__','toString','nope','',null,5,{},['fury']]) W.receive('w',{t:'bd',a:'path',id:v});
  ok('junk path ids are refused (the path stays Fury)',gw.bd.wanderer.path==='fury');
  ok('...and a save with a junk path loads as Fury',x.sanitizeGear({bd:{wanderer:{path:'constructor'}}},'warrior').bd.wanderer.path==='fury'&&x.sanitizeGear({bd:{wanderer:{path:'bulwark'}}},'warrior').bd.wanderer.path==='bulwark');
  // before pa1 / bu1: nothing to wear; never bought
  gw.coins=1e9; x.buySkillP(pw,'wd_fury'); W.receive('w',{t:'eqskill',id:'wd_fury',idx:0}); W.receive('w',{t:'ultequip',id:'wd_fury'});
  ok('before pa1 / bu1 the path passive cannot be bought or worn, nor the burst',!sw.owned.includes('wd_fury')&&!sw.pass.includes('wd_fury')&&sw.ult!=='wd_fury'&&gw.coins===1e9);
  x.awkGrantP(pw,'wanderer',1); x.recalcP(pw);
  const d0=x.psP(pw,'dmg'); W.receive('w',{t:'eqskill',id:'wd_fury',idx:0}); const d1=x.psP(pw,'dmg'); W.receive('w',{t:'ultequip',id:'wd_fury'});
  ok('after pa1 (A1) the path passive is his and can be worn (its damage counts), the burst not yet',sw.owned.includes('wd_fury')&&sw.pass[0]==='wd_fury'&&d1>d0+0.1&&sw.ult!=='wd_fury',d0+' -> '+d1);
  x.awkGrantP(pw,'wanderer',3); x.recalcP(pw); W.receive('w',{t:'ultequip',id:'wd_fury'});
  ok('after bu1 (A3) the path burst can be worn and cast',sw.wdu==='wd_fury'&&sw.ult==='wd_fury'&&!!x.ultEquippedP(pw)&&x.ultEquippedP(pw).id==='wd_furyU');
  ok('...the other path\'s passive is not his (only the active path\'s)',!sw.owned.includes('wd_bulwark'));
  // Realization: the active path's rows, only while the Wanderer is played
  gw.mq.s=last('V')+1; x.recalcP(pw);
  ok('Realization II as the Wanderer: the path\'s I passive and II row are in force',sw.bdx.main==='wanderer'&&gw.bd.wanderer.r===2&&sw.bdx.p.wd_fury_r1===1&&sw.bdx.r.includes('wd_fury_r2')&&x.ssBonuses(sw,'warrior',60).some(b=>b.row.id==='wd_fury_r2')&&(pw.ss.trig.hit||[]).some(r=>r.id==='wd_fury_r2'),JSON.stringify(sw.bdx));
  { const before=x.psP(pw,'critdmg'); gw.mq.s=last('G')+1; x.recalcP(pw);
    ok('Realization VI: the IV row (critical damage) and the VI row too',x.psP(pw,'critdmg')>before+0.1&&sw.bdx.r.includes('wd_fury_r6')&&sw.bdx.p.wd_fury_r4===1); }
  { const lu=sw.bdx.lv['u:wd_fury']; ok('...III and V raise the path burst too (+2)',lu===2,lu); }
  // a set played: no Realization rows, no path passive, no path burst
  x.ssGrantSetP(pw,K,true); x.bdGrantP(pw,K,0); const a3=actOf(K)[2]; x.ssEquipPieceP(pw,x.SKILLS[a3]); x.recalcP(pw);
  ok('with a set\'s power piece worn ('+K+' is played) the path rows, passive and burst are out of force',sw.bdx.main===K&&!sw.bdx.r.some(r=>/^wd_/.test(r))&&!Object.keys(sw.bdx.p).some(k=>/^wd_/.test(k))&&x.psP(pw,'dmg')<d1-0.1&&!x.ultEquippedP(pw),JSON.stringify(sw.bdx));
  for(const c of ['warrior','archer','mage']) sw.eq[c].burst=null; x.recalcP(pw);
  // changing the path: free, the tree and the Realization kept, the worn passive and burst follow
  const coins=gw.coins, tree=JSON.stringify(gw.awk.wanderer), r0=gw.bd.wanderer.r, n0=sent.length;
  W.receive('w',{t:'bd',a:'path',id:'bulwark'}); tick(1);
  ok('a path change is free and keeps the tree and the Realization',gw.bd.wanderer.path==='bulwark'&&gw.coins===coins&&JSON.stringify(gw.awk.wanderer)===tree&&gw.bd.wanderer.r===r0);
  ok('...the worn passive and burst become the new path\'s, the old passive is no longer his',sw.pass[0]==='wd_bulwark'&&sw.ult==='wd_bulwark'&&sw.wdu==='wd_bulwark'&&!sw.owned.includes('wd_fury')&&sw.owned.includes('wd_bulwark'));
  ok('...and the Realization rows are Bulwark\'s now',sw.bdx.r.includes('wd_bulwark_r2')&&sw.bdx.r.includes('wd_bulwark_r6')&&!sw.bdx.r.includes('wd_fury_r2')&&sw.bdx.p.wd_bulwark_r1===1&&(pw.ss.trig.cast2||[]).some(r=>r.id==='wd_bulwark_r2'));
  ok('...a you update went out',sent.slice(n0).some(([to,m])=>to==='w'&&m&&m.t==='you'));
  { const G2=x.sanitizeGear(JSON.parse(JSON.stringify(gw)),'warrior'); ok('a save keeps the path and its worn passive and burst',G2.bd.wanderer.path==='bulwark'&&G2.skills.pass[0]==='wd_bulwark'&&G2.skills.ult==='wd_bulwark'&&G2.skills.wdu==='wd_bulwark'); }
  { const G3=x.sanitizeGear(Object.assign(JSON.parse(JSON.stringify(gw)),{awk:{}}),'warrior'); ok('...a save without the tree loses them (never trusted)',!G3.skills.owned.includes('wd_bulwark')&&G3.skills.pass[0]!=='wd_bulwark'&&G3.skills.ult!=='wd_bulwark'); }
  // a bad path file
  const n=x.WD_BAD.length, ub=x.ULT_BAD.length, base={id:'zzt',name:'Test',role:'risk',from:'ferocity',text:'A test path.',passive:{name:'P',text:'+{}% damage',stat:'dmg',v:0.2},
    ult:{name:'U',desc:'A test burst.',range:10,mult:1.5,act:['zztult',0.9,0.5],fx:{ring:{r:5}},boost:[{piece:'a2',secs:10,mod:{mult:2}},{piece:'p1',secs:12,mod:{v:2}}]},
    real:{1:{name:'A',text:'+{}% damage',stat:'dmg',v:0.05},2:{name:'B',text:'+{}% damage',stat:'dmg',v:0.05},4:{name:'C',text:'+{}% damage',stat:'dmg',v:0.05},6:{name:'D',text:'+{}% damage',stat:'dmg',v:0.05}}};
  const mk=o=>Object.assign(JSON.parse(JSON.stringify(base)),o);
  const bads=[mk({passive:{name:'P',text:'+{}% damage',stat:'dmg',v:0.03}}), mk({id:'zzb',ult:Object.assign({},base.ult,{act:['zzbult',0.9,0.5],boost:[{piece:'cave',secs:10,mod:{mult:2}},{piece:'p1',secs:12,mod:{v:2}}]})}), mk({id:'zzc',real:{1:base.real[1],2:base.real[2],4:base.real[4]}}),
    mk({id:'zzd',kit:'bard'}), mk({id:'zze',from:'constructor'}), mk({id:'fury'}), mk({id:'zzf',real:Object.assign({},base.real,{2:{name:'B',text:'pop',on:'hit',icd:2,mult:1,range:3,fx:{ring:{r:3},pop:{id:'ghost',k:1}}}})})];
  const got=bads.map(D=>x.defineWandererPath(D));
  ok('a bad path file is left out and listed (weaker than its source, a boost on the charge skill, a missing row, an unknown stat table or source, a second fury, a mark nothing makes)',got.every(r=>r===null)&&x.WD_BAD.length===n+bads.length&&x.WD_BAD.slice(n).every(b=>b.id&&b.field&&b.why)&&!x.WD_PATHS.zzt&&!x.PASSIVES.wd_zzt&&!x.ULT_SKILLS.wd_zzb&&x.ULT_BAD.length===ub&&x.WD_ORDER.length===2,JSON.stringify(x.WD_BAD.slice(n).map(b=>b.id+':'+b.field)));
  ok('...and a good one registers',!!x.defineWandererPath(base)&&!!x.WD_PATHS.zzt&&!!x.ULT_SKILLS.wd_zzt);
  x.WD_BAD.length=n; }

console.log(fails?fails+' check(s) FAILED':'all bond checks passed'); process.exit(fails?1:0);
