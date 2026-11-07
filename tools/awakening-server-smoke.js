// Headless test of Awakening on the server (skills revamp step 9; server straight from src/, no build): MSG.awk buying tiers, upgrade nodes and stat nodes in order, the refusals (out of order,
// under level, unpaid, an unknown material, junk ids), costs taken exactly once, a skill's combat level following its branch (and the tier cap), the stat nodes in gear.skills.aw, the burst needing bu1,
// Echo Shards moved to gear.awm, the smv-2 migration (old levels become branches, idempotent) and the dev tool.
// Usage: node tools/awakening-server-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},
  ['S','SS_SETS','SS_ORDER','SKILLS','MATS','MAT_IDS','CAVE_SKILLS','CAVE_SKILL_IDS','AWK_TIERS','awkShapeOf','awkNode','awkNodeCost','awkTierCost','awkStatOf','awkDropKinds','awkBranchLv','awkUltLvP',
   'awkLevelP','awkStatP','awkTierP','awkMigrateG','awkGrantP','awkSyncG','sanitizeGear','skillLvOf','caveLvOf','ssGrantP','ssGrantSetP','ultEquippedP','psP','rdMatsOf','SMIG_VER','getH']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const K='tansy', T=x.SS_SETS[K];   // a pine tree (the basic attack is the trunk): its first limb needs no trophy
W.join('a',{name:'Ayla',look:{cls:'archer'},save:{level:45}}); tick(2);
const p=W.players.get('a'), g=p.gear, send=m=>{ W.receive('a',Object.assign({t:'awk'},m)); tick(1); };
const fund=()=>{ g.coins=1e9; for(const id of x.MAT_IDS) g.mats[id]=999; g.awm.echo=9999; const rm=x.rdMatsOf(p); for(const l of ['home','vale','hoar','grey','sun','gloam','amber','isles']) rm[l]=999; };
const snap=()=>JSON.stringify({c:g.coins,m:g.mats,e:g.awm,r:g.rd,a:g.awk});
ok('the set has a pine tree, every set has a shape',x.awkShapeOf(K)&&x.awkShapeOf(K).id==='pine'&&x.SS_ORDER.every(id=>x.SS_SETS[id].dev||x.awkShapeOf(id)));
// ---- owning the character ----
fund(); send({a:'stat',set:K,id:'sba2'});
ok('a character with no piece owned cannot be awakened',!g.awk[K]&&x.awkStatP(p,K,'sba2')!==null);
x.ssGrantSetP(p,K,true); tick(1);
// ---- buying in order, costs taken once ----
{ const c=x.awkNodeCost(K,'sba2'), before=JSON.parse(snap()); send({a:'stat',set:K,id:'sba2'});
  const spent=before.c-g.coins, drops=Object.keys(before.m).reduce((s,id)=>s+(before.m[id]-(g.mats[id]|0)),0);
  ok('a stat node is bought: exactly its coins and its drops are taken, nothing else',g.awk[K]&&g.awk[K].n.sba2===1&&spent===c.coins&&drops===c.drops&&g.awm.echo===before.e.echo,'spent '+spent+'/'+c.coins+', drops '+drops+'/'+c.drops);
  const s2=snap(); send({a:'stat',set:K,id:'sba2'}); ok('the same node twice: refused, nothing taken',snap()===s2); }
{ const s0=snap(); send({a:'up',set:K,id:'ba3'}); ok('out of order (ba3 before ba2): refused, nothing taken',snap()===s0&&!g.awk[K].n.ba3);
  send({a:'stat',set:K,id:'ba2'}); ok('the wrong message kind (stat for an upgrade node): refused',!g.awk[K].n.ba2&&snap()===s0); }
{ const c=x.awkNodeCost(K,'ba2'), e0=g.awm.echo, c0=g.coins; send({a:'up',set:K,id:'ba2'});
  ok('an upgrade node is bought: coins, drops and Echo Shards taken once',g.awk[K].n.ba2===1&&c0-g.coins===c.coins&&e0-g.awm.echo===c.mats.echo,JSON.stringify(c.mats)); }
const piece=T.pos[1].ids.find(id=>x.SKILLS[id].cls==='archer');
ok('the basic piece is level 2 now (its branch)',x.skillLvOf(g.skills,piece)===2&&x.awkBranchLv(g,K,'ba')===2);
send({a:'stat',set:K,id:'sba3'}); send({a:'up',set:K,id:'ba3'}); send({a:'stat',set:K,id:'sba4'}); send({a:'up',set:K,id:'ba4'});
ok('levels 3 and 4 in order: the piece follows the tree',x.skillLvOf(g.skills,piece)===4);
{ const s0=snap(); send({a:'stat',set:K,id:'sba5'}); ok('the tier gates: a level-5 node needs A1 (cap 4 at A0)',!g.awk[K].n.sba5&&snap()===s0); }
// ---- the combat level ----
W.receive('a',{t:'eqskill',id:piece}); tick(1); p.cd.basic=0; p.act=null;
W.receive('a',{t:'atk',k:'basic',face:0});
ok('a basic attack is cast at the branch level',p.act&&p.act.sid===piece&&p.act.lvl===4,p.act?p.act.sid+' lvl '+p.act.lvl:'no act');
tick(40);
// ---- stat nodes reach the stat pipeline ----
{ const st=x.awkStatOf(K,'sba2'), key={cd:'cd',red:'red',eff:'buffpow'}[st.stat]||st.stat;
  ok('the played character\'s stat nodes are summed into gear.skills.aw',p.awMain===K&&g.skills.aw[key]>0,JSON.stringify(g.skills.aw)+' main '+p.awMain); }
// ---- tiers ----
{ W.join('lo',{name:'Lowe',look:{cls:'warrior'},save:{level:5}}); tick(1); const q=W.players.get('lo'); x.ssGrantSetP(q,K,true); q.gear.coins=1e9; for(const id of x.MAT_IDS) q.gear.mats[id]=999;
  const s0=JSON.stringify(q.gear.awk)+q.gear.coins; W.receive('lo',{t:'awk',a:'tier',set:K}); tick(1);
  ok('under level: A1 is refused at hiker level 4-9, nothing taken',JSON.stringify(q.gear.awk)+q.gear.coins===s0); W.leave('lo'); }
{ const c=x.awkTierCost(K,1), c0=g.coins; send({a:'tier',set:K}); ok('a tier is bought: A1, exactly its coins',g.awk[K].t===1&&c0-g.coins===c.coins);
  g.coins=0; const s0=snap(); send({a:'tier',set:K}); ok('unpaid: A2 without the coins is refused, nothing taken',g.awk[K].t===1&&snap()===s0); fund(); }
send({a:'tier',set:K}); send({a:'tier',set:K});
{ ok('A2 and A3 bought',g.awk[K].t===3);
  const c4=x.awkTierCost(K,4), s0=snap(), why=x.awkTierP(p,K);
  ok('A4 asks Prime Essence, which cannot be earned yet: refused with a reason, nothing taken, no throw',!!c4.mats.ess_prime&&typeof why==='string'&&/cannot be earned yet/.test(why)&&snap()===s0&&g.awk[K].t===3,why); }
{ const sh=x.awkShapeOf('pell'), po=x.awkNodeCost('pell','po2'); x.ssGrantSetP(p,'pell',true); fund(); x.awkStatP(p,'pell','spo2');
  const s0=snap(), why=x.awkLevelP(p,'pell','po2');
  ok('a power level asks the boss trophy (step 10): refused cleanly, nothing taken',sh.id==='oak'&&Object.keys(po.mats).some(m=>m.startsWith('trophy_'))&&typeof why==='string'&&snap()===s0&&!g.awk.pell.n.po2,why); }
// ---- junk ----
{ const s0=snap(); let threw=false;
  try{ for(const set of ['__proto__','constructor','toString',7,{},[],null,'nope']) for(const id of ['__proto__','constructor','hasOwnProperty',5,{},[],'sba2x',null]) for(const a of ['tier','up','stat','x',null]) W.receive('a',{t:'awk',a,set,id});
       W.receive('a',{t:'awk'}); W.receive('a',{t:'awk',a:'up',set:K,id:{toString:()=>'ba5'}}); tick(1);
       for(const id of ['__proto__','constructor','valueOf']) if(x.awkLevelP(p,K,id)===null||x.awkStatP(p,K,id)===null) threw=true; }catch(e){ threw=e.message; }
  ok('junk set and node ids (__proto__, constructor, numbers, objects) are refused, nothing changes, nothing throws',!threw&&snap()===s0&&!Object.prototype.hasOwnProperty.call(g.awk,'__proto__'),String(threw)); }
// ---- the burst needs bu1 (A3) ----
{ const ultSet=x.SS_ORDER.find(id=>!x.SS_SETS[id].dev&&x.awkShapeOf(id)&&id!==K&&id!=='pell');
  x.ssGrantSetP(p,ultSet,true); g.skills.ult=ultSet; tick(1);
  ok('an owned burst without its bu1 cannot be cast',x.awkUltLvP(p,ultSet)===0&&x.ultEquippedP(p)===null);
  x.awkGrantP(p,ultSet,3); x.awkSyncG(g); ok('the dev grant to A3 opens it at the cap of A3 (level 7)',x.awkUltLvP(p,ultSet)===7&&!!x.ultEquippedP(p)); }
// ---- the charge skill follows the ch branch ----
{ const cv=x.CAVE_SKILL_IDS.find(id=>x.CAVE_SKILLS[id].set===K); fund();
  const sh=x.awkShapeOf(K), path=[]; const need=id=>{ const n=sh.byId[id]; if(g.awk[K].n[id]===1||path.includes(id)) return; for(const r of n.req) need(r); path.push(id); }; need('ch1');
  for(const id of path) (sh.byId[id].kind==='stat'?x.awkStatP:x.awkLevelP)(p,K,id); x.awkSyncG(g);
  const own=Object.prototype.hasOwnProperty.call(g.cave.own,cv);
  const lv1=own&&x.caveLvOf(p,cv); g.awk[K].n.ch2=1; x.awkSyncG(g);   // (ch2 itself asks boss 2's trophy, step 10: given here)
  ok('ch1 makes the set\'s charge skill yours at level 1; with ch2 it is level 2 (caveLvOf)',!cv||(own&&lv1===1&&x.caveLvOf(p,cv)===2),cv+' '+own+' lv '+lv1+' path '+path.length); }
// ---- Echo Shards moved, and the smv-2 migration ----
{ const old={smv:1,coins:10,cave:{own:{},sh:40},skills:{owned:[...T.pos[1].ids,T.pos[1].passive,...T.pos[2].ids,T.pos[2].passive,...T.pos[3].ids,T.pos[3].passive],lv:{[piece]:3,[T.pos[2].ids[0]]:5}}};
  if(T.keptPassive) old.skills.lv[T.keptPassive]=2;
  const cv=x.CAVE_SKILL_IDS.find(id=>x.CAVE_SKILLS[id].set===K); if(cv) old.cave.own[cv]=3;
  const m=x.sanitizeGear(JSON.parse(JSON.stringify(old)),'warrior'), A=m.awk[K];
  ok('migration: smv '+x.SMIG_VER+', the old Echo Shards are in gear.awm',m.smv===2&&m.awm.echo===40&&m.cave.sh===undefined);
  ok('migration: a level-3 set piece gives branch level 3 (ba2, ba3 and the stat nodes below them)',A&&A.n.ba2===1&&A.n.ba3===1&&A.n.sba2===1&&A.n.sba3===1&&!A.n.ba4&&x.skillLvOf(m.skills,piece)===3&&x.awkBranchLv(m,K,'ba')===3,JSON.stringify(A));
  ok('migration: a level-5 piece raises the tier to cover it (A1, cap 5), the passive and the charge skill keep their levels (A2)',A.t>=2&&x.awkBranchLv(m,K,'sk')===5&&x.skillLvOf(m.skills,T.pos[2].ids[0])===5
    &&(!T.keptPassive||x.skillLvOf(m.skills,T.keptPassive)===2)&&(!cv||m.cave.own[cv]===3),'t '+A.t);
  const again=JSON.parse(JSON.stringify(m)); x.awkMigrateG(again); x.awkSyncG(again);
  ok('migration run twice changes nothing',JSON.stringify(again.awk)===JSON.stringify(m.awk)&&JSON.stringify(again.skills.lv)===JSON.stringify(m.skills.lv));
  const re=x.sanitizeGear(JSON.parse(JSON.stringify(m)),'warrior');
  const canon=A=>JSON.stringify(Object.keys(A).sort().map(k=>[k,A[k].t,Object.keys(A[k].n).sort()]));
  ok('a migrated save loads again unchanged (no second migration, shards not doubled)',canon(re.awk)===canon(m.awk)&&re.awm.echo===40&&JSON.stringify(re.skills.lv)===JSON.stringify(m.skills.lv));
  const forged=x.sanitizeGear({smv:2,awk:{__proto__:{t:5},constructor:{t:5},nope:{t:5},[K]:{t:9,n:{sba2:1,ba2:1,ba9:1,constructor:1,zz:1,sba4:1}},wanderer:{t:-3,n:'x'}},awm:{echo:-5,__proto__:9}},'warrior');
  ok('a forged save: unknown characters and nodes dropped, the tier clamped, a node above the tier and a gap in a limb dropped',Object.keys(forged.awk).sort().join()===[K,'wanderer'].sort().join()&&forged.awk[K].t===5&&forged.awk[K].n.ba2===1&&forged.awk[K].n.sba2===1&&!forged.awk[K].n.ba9&&!forged.awk[K].n.sba4&&forged.awk.wanderer.t===0&&!forged.awm.echo,JSON.stringify(forged.awk)); }
// ---- the dev tool and the testing world ----
{ W.receive('a',{t:'dev',cmd:'awk',v:'wanderer',n:5}); tick(1);
  ok('dev awk: the whole Wanderer tree at A5',g.awk.wanderer&&g.awk.wanderer.t===5&&Object.keys(g.awk.wanderer.n).length===x.awkShapeOf('wanderer').nodes.length&&x.skillLvOf(g.skills,'whirlwind')>=1); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
