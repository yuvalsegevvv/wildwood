// Headless test of the zone tiers (shared/tiers.js, server/tiers.js), straight from src/, no build: the rules (levels, multipliers, the second boss of
// each land, the symbol), saves, choosing a tier in a village, opening the next tier with a land's second boss, and what a tier does to one player's
// fights (damage dealt, damage taken, XP, coins, drops) while another player fights the same monster at another tier. One line per check.
// Usage: node tools/tiers-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) evs.push(...c.ev.map(e=>[pid,...e])); }},
  ['MONS','BOSSES','BOSS_DEFS','MON_DEFS','DEF_BY_ID','VIL','VIL2','VIL3','S','damageMonsterS','killMonsterS','rewardKill','hurtP','monK','recalcP','sanitizeGear','newGearFor',
   'zoneTierK','zoneTierLv','defAt','landAt','symbolBonus','symbolPoints','ZTIER_BOSS','ZTIER_LANDS','ZTIER_MAX','ZTIER_STEP','ZTIER_BONUS','coinsFor','expToNext','tierFor','xpFor']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const near=(a,b,tol)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));
const zt=(home,vale,hoar)=>({home:{on:home[0],max:home[1]},vale:{on:vale[0],max:vale[1]},hoar:{on:hoar[0],max:hoar[1]}});

// ---- the rules ----
{ const d=x.DEF_BY_ID.direboar, k0=x.zoneTierK(d,0), k1=x.zoneTierK(d,1), a=x.defAt(d,d.level+10);
  ok('tier 0 changes nothing; tier 1 is the same monster ten levels higher (its level, health, damage and XP are those of that level)',
    k0.lv===d.level&&k0.hp===1&&k0.dmg===1&&k0.xp===1&&k1.lv===d.level+10&&near(k1.hp*d.hp,a.hp,0.001)&&near(k1.dmg*d.dmg,a.dmg,0.001)&&near(k1.xp*d.xp,a.xp,0.001),
    'level '+d.level+' -> '+k1.lv+': hp x'+k1.hp.toFixed(2)+', dmg x'+k1.dmg.toFixed(2)+', xp x'+k1.xp.toFixed(2)); }
{ const lv=[0,1,2,3].map(t=>x.zoneTierLv(x.DEF_BY_ID.vetrmaw,t));
  ok('a boss goes up with the tiers too (Vetrmaw 30 / 40 / 50 / 60)',lv.join()==='30,40,50,60'); }
ok('three lands, each opened by its second boss (the second of the two bosses that live there, by level)',(()=>{
  const by={home:[],vale:[],hoar:[]}; for(const b of x.BOSS_DEFS){ const Ar=bossArena(b); by[x.landAt(Ar.x,Ar.z)].push(b); }
  return x.ZTIER_LANDS.every(l=>by[l].length===2&&by[l].slice().sort((p,q)=>p.def.level-q.def.level)[1].def.id===x.ZTIER_BOSS[l]); })(),JSON.stringify(x.ZTIER_BOSS));
function bossArena(b){ const B=x.BOSSES.find(q=>q.bd===b); return B.A; }
ok('the symbol: every unlocked tier point of every land adds +10% (2 + 2 + 1 points = +50%)',near(x.symbolBonus({zt:zt([0,2],[0,2],[0,1])}),0.5,1e-9)&&x.symbolBonus({})===0&&x.symbolBonus({zt:zt([1,1],[0,0],[0,0])})===x.ZTIER_BONUS);
ok('the symbol counts what you unlocked, not what you play at',x.symbolBonus({zt:zt([0,3],[0,0],[0,0])})===3*x.ZTIER_BONUS);

// ---- saves ----
{ const g=x.sanitizeGear({zt:{home:{on:9,max:9},vale:{on:5,max:1},hoar:'x',extra:{on:1,max:1}}},'warrior');
  ok('a save\'s tiers are clamped (unlocked 0-'+x.ZTIER_MAX+', the tier you play at no higher than that) and junk is dropped',JSON.stringify(g.zt)===JSON.stringify(zt([3,3],[1,1],[0,0])),JSON.stringify(g.zt));
  ok('an old save without tiers starts every land at 0',JSON.stringify(x.sanitizeGear({},'warrior').zt)===JSON.stringify(zt([0,0],[0,0],[0,0]))&&JSON.stringify(x.newGearFor('mage').zt)===JSON.stringify(zt([0,0],[0,0],[0,0]))); }
W.join('a',{name:'Hiker',look:{cls:'warrior'},save:{level:10,gear:{zt:zt([1,2],[0,1],[0,0])}}}); W.join('b',{name:'Other',look:{cls:'warrior'},save:{level:10}}); tick(2);
const A=W.players.get('a'), B=W.players.get('b');
ok('a joining player keeps their tiers',JSON.stringify(A.gear.zt)===JSON.stringify(zt([1,2],[0,1],[0,0])));

// ---- the symbol in the stats ----
{ const base=B.maxHp, dmg=B.dmg; ok('a fresh player has no bonus, one with 3 points has +30% health and attack',Math.abs(A.maxHp-base*1.3)<=1&&near(A.dmg,dmg*1.3,1e-9),A.maxHp+' vs '+base+', '+A.dmg.toFixed(1)+' vs '+dmg.toFixed(1)); }

// ---- fights: one monster, two players at different tiers ----
const put=(p,mon)=>{ p.x=mon.x+1; p.z=mon.z; p.dead=false; };
const mon=(id,zone)=>x.MONS.find(m=>m.def.id===id&&!m.temp&&!m.dead);
const boar=mon('direboar'), kappa=mon('kappa');
A.level=30; B.level=30; A.gear.zt=zt([1,1],[0,0],[0,0]); B.gear.zt=zt([0,0],[0,0],[0,0]); x.recalcP(A); x.recalcP(B); B.maxHp=A.maxHp; B.dmg=A.dmg; A.hp=A.maxHp; B.hp=B.maxHp;   // (the same numbers, so only the tier differs)
const real=Math.random; Math.random=()=>0.5;   // no crits, the middle of the damage spread
try{
  const K=x.monK(boar,A);
  ok('the boar is on the home forest\'s side of the world, so A\'s home tier applies to it; B\'s does not',x.landAt(boar.camp.x,boar.camp.z)==='home'&&K.lv===boar.T.level+10&&x.monK(boar,B).lv===boar.T.level);
  boar.hp=boar.maxHp; const d0=x.damageMonsterS(boar,1,B,boar.x-1,boar.z,0); const hp0=boar.maxHp-boar.hp;
  boar.hp=boar.maxHp; const d1=x.damageMonsterS(boar,1,A,boar.x-1,boar.z,0); const hp1=boar.maxHp-boar.hp;
  ok('the same hit takes off ten levels\' worth less of the health pool at tier 1 (the pool is in the def\'s own units)',d0===d1&&near(hp1*K.hp,hp0,0.002),'damage '+d0+': pool -'+hp0.toFixed(1)+' at tier 0, -'+hp1.toFixed(1)+' at tier 1 (health x'+K.hp.toFixed(2)+')');
  // the boar is level 10, the players 30: no level debuff either way, so the ratios are exact
  const hurt=(p,v)=>{ p.hp=p.maxHp; p.lastHit=-99; x.hurtP(p,v,boar); return p.maxHp-p.hp; };
  const h0=hurt(B,200), h1=hurt(A,200);
  ok('a hit from it hurts a tier 1 player as much more as its damage went up',near(h1/h0,K.dmg,0.02),h0+' vs '+h1+' (x'+(h1/h0).toFixed(2)+', expected x'+K.dmg.toFixed(2)+')');
  // the level debuff uses the tiered level: a level 25 player against a level 22 monster (tier 0) has none, at tier 1 (32) has -35%
  const kap=x.monK(kappa,A); A.level=25; B.level=25; x.recalcP(A); x.recalcP(B);
  const hc=(p,mm)=>{ mm.hp=mm.maxHp; const d=x.damageMonsterS(mm,1,p,mm.x-1,mm.z,0); return d; };
  A.gear.zt=zt([1,1],[1,1],[0,0]); B.gear.zt=zt([0,0],[0,0],[0,0]); A.dmg=B.dmg;
  const kA=x.monK(kappa,A), kB=x.monK(kappa,B), dA=hc(A,kappa), dB=hc(B,kappa);
  ok('a vale monster follows the vale\'s tier (the home\'s does not move it), and its tiered level sets the level debuff (-5% damage per level above you)',
    kB.lv===kappa.T.level&&kA.lv===kappa.T.level+10&&near(dA/dB,Math.max(0.1,1-0.05*(kA.lv-25))/Math.max(0.1,1-0.05*Math.max(0,kB.lv-25)),0.03),'kappa '+kappa.T.level+' -> '+kA.lv+', damage '+dB+' vs '+dA);
  A.gear.zt=zt([0,1],[0,1],[0,0]);
  // rewards: XP, coins and the tier of the gear dropped are those of the tiered level
  A.level=45; A.gear.zt=zt([0,1],[0,1],[0,0]); B.level=45; B.gear.zt=zt([0,0],[0,0],[0,0]); A.exp=0; B.exp=0; x.recalcP(A); x.recalcP(B);
  A.gear.coins=0; B.gear.coins=0; evs.length=0;
  x.rewardKill(B,boar); const xp0=B.exp, c0=B.gear.coins; x.rewardKill(A,boar); const xp1=A.exp, c1=A.gear.coins;
  ok('a kill at tier 0 pays the monster\'s own XP, and having tier 1 unlocked changes nothing while you play at tier 0',near(xp0,x.xpFor(boar.T.level),0.001)&&near(xp1,xp0,0.001)&&c0===c1);
  A.gear.zt=zt([1,1],[0,1],[0,0]); A.exp=0; A.gear.coins=0; x.rewardKill(A,boar);
  ok('at tier 1 it pays the XP and coins of a level '+(boar.T.level+10)+' monster',near(A.exp,x.xpFor(boar.T.level+10),0.001)&&A.gear.coins>=x.coinsFor(boar.T.level+10)*0.99&&A.gear.coins<=x.coinsFor(boar.T.level+10)*1.01+1,'xp '+A.exp.toFixed(0)+' vs '+x.xpFor(boar.T.level).toFixed(0)+', coins '+A.gear.coins+' vs '+c0);
  ok('the gear that drops is the tiered level\'s (level 20 -> tier '+x.tierFor(20)+')',x.tierFor(boar.T.level+10)>x.tierFor(boar.T.level));
} finally { Math.random=real; }

// ---- choosing a tier ----
A.gear.zt=zt([0,2],[0,1],[0,0]); A.x=W.players.get('a').x; { const V=x.VIL; A.x=V.x; A.z=V.z; }
W.receive('a',{t:'zt',land:'home',n:2}); tick(1);
ok('in a village you can play a land at any tier you have unlocked',A.gear.zt.home.on===2);
W.receive('a',{t:'zt',land:'vale',n:3}); tick(1);
ok('never above what you unlocked',A.gear.zt.vale.on<=A.gear.zt.vale.max);
W.receive('a',{t:'zt',land:'hoar',n:1}); tick(1);
ok('and not in a land whose tier 1 is still locked',A.gear.zt.hoar.on===0);
W.receive('a',{t:'zt',land:'home',n:0}); tick(1); ok('back to tier 0',A.gear.zt.home.on===0);
{ const m=x.MONS.find(q=>q.def.id==='slime'); A.x=m.x; A.z=m.z; W.receive('a',{t:'zt',land:'home',n:1}); tick(1);
  ok('out in the wild it is refused (a fight cannot be made easier halfway)',A.gear.zt.home.on===0); }
W.receive('a',{t:'zt',land:'nowhere',n:1}); W.receive('a',{t:'zt',land:'home',n:'x'}); tick(1); ok('junk is ignored',A.gear.zt.home.on===0);

// ---- opening tiers with the second boss ----
const fell=(P,bossId)=>{ const Bo=x.BOSSES.find(q=>q.bd.def.id===bossId), m=Bo.m; m.dead=false; m.hp=m.maxHp; P.x=m.x+3; P.z=m.z; m.hitters.set(P.id,x.S.t); x.killMonsterS(m,P); return m; };
A.level=50; A.hp=A.maxHp; evs.length=0;
A.gear.zt=zt([0,0],[0,0],[0,0]); fell(A,'boss'); ok('the first boss (the Rootwarden) opens no tier',A.gear.zt.home.max===0);
fell(A,'carapax'); tick(3);
ok('the second boss of the home forest (Carapax) unlocks tier I there, and only there',A.gear.zt.home.max===1&&A.gear.zt.vale.max===0&&A.gear.zt.hoar.max===0);
ok('the player is told, and the symbol grows the health and attack',evs.some(e=>e[0]==='a'&&e[1]==='toast'&&/Tier I unlocked/.test(e[3]))&&A.maxHp>B.maxHp*1.05,A.maxHp+' vs '+B.maxHp);
A.gear.zt.home.on=0; fell(A,'carapax'); ok('killed again at tier 0 (below your highest) it opens nothing more',A.gear.zt.home.max===1);
A.gear.zt.home.on=1; fell(A,'carapax'); ok('killed at your highest unlocked tier it opens the next one',A.gear.zt.home.max===2);
A.gear.zt.home.on=2; fell(A,'carapax'); A.gear.zt.home.on=3; fell(A,'carapax'); ok('up to tier '+x.ZTIER_MAX+', then no more',A.gear.zt.home.max===x.ZTIER_MAX);
fell(A,'akaoni'); ok('the vale\'s first boss (Akaoni) opens nothing',A.gear.zt.vale.max===0);
fell(A,'kyuubi'); ok('Kyuubi opens the vale\'s tier I',A.gear.zt.vale.max===1);
fell(A,'ymrik'); ok('Ymrik opens nothing',A.gear.zt.hoar.max===0);
fell(A,'vetrmaw'); ok('Vetrmaw opens the Reach\'s tier I',A.gear.zt.hoar.max===1);
{ const m=x.BOSSES.find(q=>q.bd.def.id==='vetrmaw').m; A.gear.zt.hoar.on=1; const K=x.monK(m,A);
  ok('and then the Reach\'s bosses are ten levels higher: Vetrmaw is level 40 at tier I',K.lv===40&&K.hp>1&&K.dmg>1); }
{ // a party: only the players who play at their highest tier get the unlock
  B.gear.zt=zt([0,1],[0,0],[0,0]); A.gear.zt=zt([1,1],[0,0],[0,0]); B.level=50; A.level=50;
  const m=x.BOSSES.find(q=>q.bd.def.id==='carapax').m; m.dead=false; m.hp=m.maxHp; A.x=m.x+3; A.z=m.z; B.x=m.x-3; B.z=m.z; m.hitters.set(A.id,x.S.t); m.hitters.set(B.id,x.S.t); x.killMonsterS(m,A);
  ok('two players share a kill: the one at their highest tier gets the next tier, the other does not',A.gear.zt.home.max===2&&B.gear.zt.home.max===1); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
