// Headless test of the Bonds (skills revamp step 12: shared/bond.js, server/bond.js): buying Bond 0-VI in order at their stone costs, the zone-tier gates, the active Bond = min(Bond, pieces worn) less a
// step per guest piece, a Bond I passive working unequipped, the Bond II row, the +1 levels of Bond III / V, a guest piece's -2 levels, Bond passives refused by equip, the Wanderer's Realization from the
// main quest's acts, the smv-3 migration (idempotent), junk ids, and stones beyond Bond VI paid out in coins. The server straight from src/, no build.
// Usage: node tools/bond-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},
  ['SS_SETS','SS_ORDER','SKILLS','PASSIVES','CAVE_SKILLS','CAVE_SKILL_IDS','MQ','BD_COST','BD_TOP','BD_STONE_COINS','BD_GUEST_PEN','bdBuyP','bdAddStonesP','bdGrantP','bdOwns','bdMainOf','bdRealOf','bdTierNeed','bdIsBondPassive',
   'bdStonesLeft','awkGrantP','awkTierP','sanitizeGear','skillLvOf','caveLvOf','psP','recalcP','clsOfP','ssEquipPieceP','ssGrantSetP','SMIG_VER','passiveValue']);
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

console.log(fails?fails+' check(s) FAILED':'all bond checks passed'); process.exit(fails?1:0);
