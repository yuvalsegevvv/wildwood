// Headless test of the 5th skill slot, the set burst (server straight from src/, no build): the registry and its checks, the 3-of-7 ownership rule, wearing, the fixed 60 / 30 s cooldown that nothing reduces,
// refused below level 35 and on the Proving Isle, the 5 s stun with its 50 s per-enemy lock (bosses too, with no x1.5 and a queue behind a kit's own stun), and the burst never counting toward a set.
// Usage: node tools/ult-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...JSON.parse(JSON.stringify(m.ev))); }},
  ['S','ULT_SKILLS','ULT_BAD','ULT_CD','ULT_CD_GRIND','ULT_LV','ULT_STUN','ULT_STUN_LOCK','ultDef','ultDefine','ultOwned','ultPieceCount','ultCdOf','ultStunS','ultCheckP','ssGrantP','ssCount','ssCdrS','SS_SETS','SS_ORDER','CAVE_SKILLS','BOSSES','resetBossS','MONS','getH','SKILLS','slotLv','sanitizeGear','SS_BAD','psP','ultWornP','ultRowK','ultIcdK','ultOnP','ultTickP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
// ---- the registry ----
ok('the shipped bursts are registered and none is bad',Object.keys(x.ULT_SKILLS).length>=2&&x.ULT_BAD.length===0&&x.SS_BAD.length===0,JSON.stringify(x.ULT_BAD));
{ const u=x.ULT_SKILLS.tansy;
  ok('a burst is an ability row of slot ult, cls any, cd 0, level 35, outside SKILLS',u&&u.slot==='ult'&&u.cls==='any'&&u.cd===0&&u.lv===35&&u.id==='tansyU'&&!x.SKILLS.tansyU&&x.slotLv('ult')===35);
  ok('the stun is switched on by the engine in a copy of the fx, the data stays plain',u.fxU.ring.ult===true&&u.fx.ring.ult===undefined); }
const base=(o)=>Object.assign({name:'Test Burst',desc:'d',range:10,mult:1.5,act:['fixultk'+Math.random().toString(36).slice(2,6),1,0.5],fx:{ring:{r:8}},boost:[{piece:'a1',secs:10},{piece:'p1',secs:10,mod:{v:2}}]},o);
const before=x.ULT_BAD.length;
const bads=[null,'x',base({name:''}),base({fx:{ring:{r:8,stun:3}}}),base({fx:{ring:{r:8,status:{kind:'stun',dur:2}}}}),base({fx:{beam:{len:10,w:1}}}),base({fx:{vsBoss:1}}),base({boost:[{piece:'a1',secs:10}]}),
  base({boost:[{piece:'a1',secs:10},{piece:'a1',secs:10}]}),base({boost:[{piece:'p1',secs:10,mod:{v:2}},{piece:'p2',secs:10,mod:{v:2}}]}),base({boost:[{piece:'a1',secs:5},{piece:'p1',secs:10,mod:{v:2}}]}),
  base({boost:[{piece:'a1',secs:10,mod:{v:2}},{piece:'p1',secs:10,mod:{v:2}}]}),base({boost:[{piece:'a1',secs:10,mod:{mult:9}},{piece:'p1',secs:10,mod:{v:2}}]}),base({boost:[{piece:'a1',secs:10},{piece:'p1',secs:10}]}),
  base({boost:[{piece:'a9',secs:10},{piece:'p1',secs:10,mod:{v:2}}]}),base({mult:99}),base({act:['tansyult',1,0.5]})];
ok('invalid bursts are left out and listed in ULT_BAD, never thrown',bads.every(b=>x.ultDefine('torgeir',b,'earth')===null)&&x.ULT_BAD.length-before===bads.length&&x.ULT_SKILLS.torgeir.name==='Unbroken Line',x.ULT_BAD.slice(before).map(b=>b.why).join(' | '));
ok('a good one registers (cave piece, util and cdr mods allowed)',!!x.ultDefine('fixset',base({boost:[{piece:'cave',secs:12,mod:{mult:2,size:1.3}},{piece:'p3',secs:12,mod:{cdr:{skill:4}}}]}),'basic')&&x.ultDef('fixset')!==null&&x.ultDef('constructor')===null&&x.ultDef('__proto__')===null);
delete x.ULT_SKILLS.fixset;
// ---- ownership: any 3 of the 7 ----
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:40}}); W.join('lo',{name:'Lowe',look:{cls:'warrior'},save:{level:34}}); tick(3);
const p=W.players.get('a'), lo=W.players.get('lo'), T='torgeir';
const own=(pl,set,pos)=>x.ssGrantP(pl,set,pos,true);
ok('nothing owned: no burst',!x.ultOwned(p.gear.skills,p.gear.cave,T)&&x.ultPieceCount(p.gear.skills,p.gear.cave,T)===0);
own(p,T,1); ok('one drop (an active and its passive) is 2 of 7: not enough',x.ultPieceCount(p.gear.skills,p.gear.cave,T)===2&&!x.ultOwned(p.gear.skills,p.gear.cave,T));
{ const cv=Object.values(x.CAVE_SKILLS).find(c=>c.set===T);
  ok('the set has a cave skill (the seventh piece)',!!cv);
  p.gear.cave.own[cv.id]=1; ok('one drop + the cave skill is 3 of 7: owned',x.ultOwned(p.gear.skills,p.gear.cave,T)); delete p.gear.cave.own[cv.id]; }
x.ultCheckP(p); evs.length=0; own(p,T,2); tick(4);
ok('two drops are 4 of 7: owned, and the player is told once (event ultget)',x.ultOwned(p.gear.skills,p.gear.cave,T)&&evs.some(e=>e[0]==='ultget'&&e[2]===T),JSON.stringify(evs.slice(0,3)));
// ---- wearing ----
W.receive('a',{t:'ultequip',id:'constructor'}); W.receive('a',{t:'ultequip',id:'tansy'}); W.receive('a',{t:'ultequip',id:7}); tick(1);
ok('a bad id, a burst that is not owned and a non-string change nothing',p.gear.skills.ult===null);
W.receive('a',{t:'ultequip',id:T}); tick(1); ok('an owned burst can be worn at level 40',p.gear.skills.ult===T);
{ own(lo,T,1); own(lo,T,2); lo.level=34; W.receive('lo',{t:'ultequip',id:T}); tick(1); ok('below level 35 it cannot be worn',lo.gear.skills.ult===null); }
{ const g=JSON.parse(JSON.stringify(p.gear)); g.skills.ult='tansy'; ok('a save wearing a burst it does not own is cleaned',x.sanitizeGear(g,'warrior').skills.ult===null);
  g.skills.ult='constructor'; ok('a prototype name in a save is cleaned',x.sanitizeGear(g,'warrior').skills.ult===null);
  g.skills.ult=T; ok('an owned burst survives a save',x.sanitizeGear(g,'warrior').skills.ult===T); }
// ---- the cast and its cooldown ----
const pile=(pl,n,heavy)=>{ const ms=x.MONS.filter(m=>!m.boss&&!m.dead&&!m.inst&&(!heavy||m.T.heavy)).slice(0,n); const y=x.getH(pl.x,pl.z);
  for(const m of ms){ m.x=pl.x+(Math.random()-0.5)*0.4; m.z=pl.z-0.6-Math.random()*0.3; m.y=y; m.maxHp=m.hp=1e9; m.dead=false; m.immune=false; m.awake=true; m.stunT=0; m.ultLock=0; }
  return ms; };
const cast=(id,tg)=>{ const pl=W.players.get(id); pl.cd.basic=pl.cd.skill=pl.cd.burst=pl.cd.cave=0; W.receive(id,{t:'atk',k:'ult',tg:tg||null,face:0,aim:[0,0,-1]}); tick(30); };
for(const m of x.MONS) if(!m.boss){ m.x=p.x+400; m.z=p.z+400; }
{ p.level=34; const ms=pile(p,2); cast('a'); ok('below level 35 a cast does nothing',p.cd.ult===0&&ms.every(m=>!(m.stunT>0))); p.level=40; }
{ p.pv={sk:p.gear.skills,pre:1}; const ms=pile(p,2); cast('a'); ok('on the Proving Isle it is refused',p.cd.ult===0&&ms.every(m=>!(m.stunT>0))); p.pv=null; }
{ p.gear.skills.ult=null; const ms=pile(p,2); cast('a'); ok('nothing worn: nothing happens',p.cd.ult===0); p.gear.skills.ult=T; }
{ const ms=pile(p,3); p.cd.ult=0; const t0=x.S.t; evs.length=0; cast('a'); tick(2);
  ok('a cast starts exactly the 60 s cooldown',Math.abs(p.cd.ult-(x.ULT_CD-1.5-0.1))<0.3,String(p.cd.ult));
  ok('the burst deals damage and stuns what it hits (5 s)',ms.every(m=>m.hp<m.maxHp)&&ms.every(m=>m.stunT>0&&m.stunT<=x.ULT_STUN),ms.map(m=>m.stunT.toFixed(2)).join(','));
  ok('the client is told (event ult with the set and the cooldown)',evs.some(e=>e[0]==='ult'&&e[2]===T&&e[3]===60),JSON.stringify(evs.filter(e=>e[0]==='ult')));
  ok('every enemy it hit is locked for 50 s',ms.every(m=>m.ultLock>t0+x.ULT_STUN_LOCK-1));
  // nothing reduces the timer
  const c0=p.cd.ult; x.ssCdrS(p,{all:99,burst:99,skill:99,basic:99}); ok('a cooldown refund (cdr all) does not touch it',p.cd.ult===c0);
  p.cd.skill=p.cd.burst=0; p.cd.ult=30; W.receive('a',{t:'atk',k:'ult',face:0,aim:[0,0,-1]}); tick(2); ok('a second cast while it runs is ignored',p.cd.ult>28&&p.cd.ult<=30); }
// ---- the stun lock: a second caster, the 50 s ----
{ const ms=pile(p,3); p.cd.ult=0; for(const m of ms) m.ultLock=x.S.t+30; cast('a'); ok('a locked enemy is hurt but not stunned again',ms.filter(m=>m.hp<m.maxHp).length>=2&&ms.every(m=>!(m.stunT>0)));
  pile(p,3); for(const m of ms) m.ultLock=x.S.t-1; p.cd.ult=0; cast('a'); ok('the lock over, the next burst stuns again (even a different caster would be locked the same: it lives on the monster)',ms.every(m=>m.ultLock>x.S.t+40)); }
{ const hv=x.MONS.find(m=>!m.boss&&!m.dead&&m.T.heavy);
  if(hv){ hv.stunT=0; hv.ultLock=0; hv.immune=false; x.ultStunS(hv); ok('a heavy enemy is stunned too (the burst ignores the heavy exclusion)',hv.stunT===x.ULT_STUN); } else ok('(no heavy monster in this world to test)',true);
  const m0=x.MONS.find(m=>!m.boss&&!m.dead); m0.stunT=0; m0.ultLock=0; m0.immune=true; x.ultStunS(m0); ok('an immune enemy is not stunned and its lock is not spent',!(m0.stunT>0)&&!(m0.ultLock>0)); m0.immune=false; }
// ---- bosses ----
{ const B=x.BOSSES[0], m=B.m, A=B.A; p.x=A.x; p.z=A.z; p.y=x.getH(p.x,p.z); tick(8);
  ok('the boss is engaged by a player in its arena',B.engaged);
  B.stunT=0; B.ultStunT=0; B.ultStunQ=0; m.ultLock=0; m.immune=false; x.ultStunS(m);
  ok('a burst stuns a boss through ultStunT, never stunT (no x1.5, no kit window)',B.ultStunT===5&&B.stunT===0&&m.ultLock>x.S.t+40);
  const t0=B.ultStunT; tick(10); ok('the boss is frozen for the time (counts down)',B.ultStunT<t0-0.4&&B.ultStunT>0);
  x.ultStunS(m); ok('a second burst on the same boss does nothing for 50 s (the lock)',B.ultStunT<5&&B.ultStunQ===0);
  m.ultLock=0; B.ultStunT=0; B.stunT=1; x.ultStunS(m); ok('during a kit stun the burst stun is queued behind it (the kit keeps its x1.5)',B.ultStunQ===5&&B.ultStunT===0&&B.stunT===1);
  tick(25); ok('when the kit stun ends the burst stun starts, still without the bonus',B.stunT<=0&&B.ultStunQ===0&&B.ultStunT>0&&B.ultStunT<=5);
  m.ultLock=0; x.ultStunS(m); const l1=m.ultLock; x.resetBossS(B); ok('only a boss reset clears the lock (and the queue)',l1>0&&m.ultLock===0&&B.ultStunT===0&&B.ultStunQ===0);
  m.immune=true; m.ultLock=0; x.ultStunS(m); ok('an immune boss is not stunned and its lock is not spent',B.ultStunT===0&&m.ultLock===0); m.immune=false; }
// ---- the grind cooldown ----
const FIGHT=()=>{ p.cave.fightT=x.S.t+5; return {m:{dead:true}}; };   // (a boss fight as caveTickP sees it; fightT in the future keeps it alive a moment)
{ const g='tansy'; own(p,g,1); own(p,g,2); p.gear.skills.ult=g; for(const m of x.MONS) if(!m.boss){ m.x=p.x+400; m.z=p.z+400; } p.x=-200; p.z=-100; p.y=x.getH(p.x,p.z);
  p.cave.fight=null; p.cd.ult=0; cast('a'); tick(1); ok('a grind set outside a boss fight: 30 s',p.cd.ult>28&&p.cd.ult<=30,String(p.cd.ult));
  p.cave.fight=FIGHT(); p.cd.ult=0; cast('a'); tick(1); ok('a grind set inside a boss fight: 60 s',p.cd.ult>58&&p.cd.ult<=60,String(p.cd.ult));
  p.cave.fight=null; p.cd.ult=0; cast('a'); p.cave.fight=FIGHT(); tick(2); ok('walking into a fight does not change a running 30 s timer',p.cd.ult<=29&&p.cd.ult>26,String(p.cd.ult)); p.cave.fight=null;
  ok('a non-grind set always gets 60 s',x.ultCdOf(T,false)===60&&x.ultCdOf(T,true)===60&&x.ultCdOf('tansy',false)===30&&x.ultCdOf('tansy',true)===60); }
// ---- not a set piece ----
{ const sk=p.gear.skills, cls='warrior', lv=40; sk.ult=null; const n0=JSON.stringify(x.ssCount(sk,cls,lv)); sk.ult=T; ok('the burst does not count toward a set (the count is the same with it worn)',JSON.stringify(x.ssCount(sk,cls,lv))===n0,n0); }
// ---- the buff (U2) ----
{ const g='tansy', sk=p.gear.skills; sk.eq.warrior.skill='tansy_2_any'; sk.pass[0]='tansy_p2'; sk.ult=g; p.ultB=null; p.cd.ult=0; p.cd.skill=0;
  const base=x.psP(p,'area'); const W_=x.ultWornP(p,g);
  ok('the worn pieces of the set are found (an active in the loadout, a passive in an open slot)',W_.a2==='tansy_2_any'&&W_.p2==='tansy_p2'&&!W_.a1&&!W_.cave,JSON.stringify(W_));
  for(const m of x.MONS) if(!m.boss){ m.x=p.x+400; m.z=p.z+400; }
  evs.length=0; cast('a'); tick(4);
  ok('a cast boosts the two worn pieces and tells the client (event ubo)',p.ultB&&p.ultB.tansy_2_any&&p.ultB.tansy_p2&&evs.some(e=>e[0]==='ubo'&&e[2].length===2),JSON.stringify(p.ultB&&Object.keys(p.ultB)));
  ok('a passive boost doubles its value (Wide Berth v x2) and nothing else',Math.abs(x.psP(p,'area')-2*base)<1e-9,x.psP(p,'area')+' vs '+base);
  p.cd.skill=0; p.cd.basic=p.cd.burst=0; W.receive('a',{t:'atk',k:'skill',face:0,aim:[0,0,-1]}); tick(1);
  ok('the boosted active casts with a wider area (size x1.4) and half its cooldown (cd x0.5)',p.act&&p.act.sizeK===1.4&&p.act.ub===1&&p.cd.skill<=x.SKILLS.tansy_2_any.cd*0.5+0.01,String(p.cd.skill)); tick(20);
  p.cd.ult=0; p.cd.skill=0; p.ultB=null; p.ultV=null; sk.pass[0]=null; sk.eq.warrior.skill=null; cast('a');
  ok('a piece that is not worn gets nothing (the burst still works)',!p.ultB||(!p.ultB.tansy_p2&&!p.ultB.tansy_2_any)); }
{ const id='tansy_2_any', sk=p.gear.skills; sk.eq.warrior.skill=id; p.ultB={}; p.ultB[id]={piece:'a2',mod:{mult:2,n:2,size:1.3,util:2},until:x.S.t+30};
  p.cd.skill=0; p.cd.basic=p.cd.burst=0; W.receive('a',{t:'atk',k:'skill',face:0,aim:[0,0,-1]});
  ok('a boosted active: damage x2, extra hits, size, util, and the look flag',p.act&&Math.abs(p.act.mult-2*x.SKILLS[id].mult)<1e-9&&p.act.sizeK===1.3&&p.act.utilK===2&&p.act.ub===1,JSON.stringify(p.act&&[p.act.mult,p.act.sizeK,p.act.utilK]));
  p.ultB[id].until=x.S.t+0.2; tick(30); ok('a boost ends on time',!p.ultB&&!p.ultV);
  p.ultB={}; p.ultB[id]={piece:'a2',mod:{mult:2},until:x.S.t+30}; sk.eq.warrior.skill=null; tick(2); ok('a piece taken off ends its boost',!p.ultB);
  sk.eq.warrior.skill=id; p.ultB={}; p.ultB[id]={piece:'a2',mod:{mult:2},until:x.S.t+30}; p.dead=true; x.ultTickP(p); p.dead=false; ok('death ends the boosts',!p.ultB); }
{ const pid='tansy_p2', row={id:pid,heal:0.02,mult:1,shield:{v:0.1,dur:5},buff:{kind:'might',v:0.1}}; p.ultB={}; p.ultB[pid]={piece:'p2',mod:{eff:2,icd:0.5},until:x.S.t+30};
  const r2=x.ultRowK(p,row); ok('eff x2 doubles a trigger row\'s heal, damage, shield and buff; icd x0.5 halves its wait',r2.heal===0.04&&r2.mult===2&&Math.abs(r2.shield.v-0.2)<1e-9&&Math.abs(r2.buff.v-0.2)<1e-9&&x.ultIcdK(p,pid)===0.5&&row.heal===0.02);
  p.ultB=null; }
{ p.cd.skill=20; p.cd.burst=20; p.cd.ult=45; p.ultB=null; p.cd.ult=45; const u=p.cd.ult; x.ssCdrS(p,{skill:8,burst:8}); ok('a cdr boost takes seconds off skill and burst, never the burst slot\'s timer',p.cd.skill===12&&p.cd.burst===12&&p.cd.ult===u); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
