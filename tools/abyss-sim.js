//@ The Abyss's balance yardstick (B6): a model of the hero "who normally beats level-100 monsters", runs of every difficulty with no artifacts / random picks / greedy picks, clear rates and Infinite's depth
// Usage: node tools/abyss-sim.js [--runs 300] [--seed n] [--inf 40] [--picks 1] [--quick]      --check (about 10 s): the targets below, exit 1 on a miss.   Docs: docs/ABYSS.md section 3e.
/* WHAT IT IS. An analytic fight model (no game boot): the shared rules come from src/ through tools/load.js loadShared (defAt, lvDmgK, the Abyss tables, the artifact and curse rows), the hero is a handful of
   numbers measured once. It is a yardstick like tools/boss-duel.js, not a player: it tunes the artifact numbers (shared/abyss/artifacts-*.js) so the targets of the plan (section 4) hold.
   THE HERO. A maxed level-75 hero (Awakening A5, Bond VI, level-40 legendary +10 gear x1.5625 for level 60, the symbol), measured with /mnt/project-files/dungeon-revamp/sim110.js (item codes fixed to one
   line a piece) against level-100 monsters of the overworld on the real server: 300k health, 87% armour (a guard potion puts it on the 10% floor of hurtP: HERO.taken), 3.0M damage a second to a level-100
   monster, which is 6.0M before the level debuff lvDmgK (x0.5 from 10 levels above), a level-100 mob (33M health) down in 11 s, the level-100 boss (198M health, a 68k hit) in 130-200 s with 4 heal potions when
   the hero dodges 70% of its hits (boss dps is ~0.4 of the mob's: it moves, phases, is out of reach). Those are `HERO` below.
   THE FIGHT. Fight round: AB_WAVES waves of abWaveSize(r,w) of the Shardmere's kinds (their weighted mean health and hit at the round level, plain defAt), killed one after another; up to MELEE of the
   rest hit you every ATK_S seconds for their hit x (1 + 0.05 x level gap, hurtP) x the floor 0.1 x the bar's damage taken (applied after the floor, abP 'def'); potions (POTS a round, 40% health, below half). Boss round: one boss
   (the Rootwarden's row at the round level), BOSS_HITS a second at BOSS_FRAC of its hit, the hero dodges AVOID of them. The bar's rules are the game's: factors multiply, rates add up under AB_CAPS, a curse's own-stat
   factors join; every 5th hit, exec, boss, kill heals, shield, thorns, lifesteal and Last Breath as server/abyss/combat.js does them (crit and speed through the assumptions CRIT0 / ASPD_K / CDR_K).
   THE RUN. Picks after a won round: a boss round 3, any other 0 / 1 / 2 (the plan's ~1.5 a round, 10 by the end of difficulty I, ~29 by V); each pick is one of 3 offered ids drawn like abDrawOfferS (rarity
   weight, nothing at rank 5). Pickers: 'none', 'random' (any of the three; a full bar throws a random copy away), 'greedy' (the card that lowers the damage taken in a reference fight the most, a full bar throws away
   the copy that hurts least; Last Breath is valued by hand). Full health at the start of every round. Not modelled: a real player's moves, elites / trials / events (B8), the boss kits (B9), potions of the world. */
const {loadShared}=require('./load');
const X=loadShared(['AB_KIND_W','AB_KIND_IDS','AB_KIND_PICKS','defAt','ALL_MON_DEFS','BOSS_DEFS','RIFT_DEFS','lvDmgK','AB_DIFFS','AB_INF','abRoundLv','abRounds','abIsBossRound','abWaveSize','AB_WAVES','AB_ARTS','AB_CURSES','AB_ART_BAD','AB_CURSE_BAD','abArtStat','abCurseStat',
  'AB_RANK_MAX','AB_ART_MAX','AB_RAR_W','AB_OFFER_N','AB_NTH','AB_EXEC_HP','AB_DEF_MIN']);
const arg=(k,d)=>{ const i=process.argv.indexOf('--'+k); return i>0?+process.argv[i+1]:d; }, flag=k=>process.argv.includes('--'+k);
const CHECK=flag('check'), RUNS=arg('runs',CHECK?60:300), INF_RUNS=arg('inf',CHECK?30:60);
let SEED=arg('seed',20261115)>>>0; const rnd=()=>{ SEED=(SEED*1664525+1013904223)>>>0; return SEED/4294967296; };
const HERO={level:75,hp:300000,dps0:6.0e6,taken:0.1,bossUp:0.4,avoid:0.6,avoidMob:0.3,pots:3,potK:0.4,
  crit0:0.30,critM:2.2,critCap:0.6,aspdK:0.8,cdrK:0.5};
// --pow x: every product factor of every artifact raised to x (an experiment: what scale of the numbers the targets want; the shipped rows are x = 1)
{ const pw=arg('pow',1); if(pw!==1) for(const a of Object.values(X.AB_ARTS)) for(const k of ['atk','hp','def','heal','boss','exec','nth']) if(a.k[k]) a.k[k]=Math.pow(a.k[k],pw); }
const CAP=60, MELEE=3, ATK_S=2.0, BOSS_HITS=1.3, BOSS_FRAC=0.25, SUB=0.5;
const byId=id=>X.ALL_MON_DEFS.find(d=>d.id===id), KINDS=X.RIFT_DEFS.shardmere.kinds.map(k=>({d:byId(k.id),w:k.w})), KW=KINDS.reduce((s,k)=>s+k.w,0);
const mobAt=L=>{ let hp=0,dmg=0; for(const k of KINDS){ const a=X.defAt(k.d,L); hp+=a.hp*k.w/KW; dmg+=a.dmg*k.w/KW; } return {hp,dmg}; };
const bossAt=L=>X.defAt(X.BOSS_DEFS[0].def,L);
const MOB_CACHE={}, BOSS_CACHE={}, mob=L=>MOB_CACHE[L]||(MOB_CACHE[L]=mobAt(L)), boss=L=>BOSS_CACHE[L]||(BOSS_CACHE[L]=bossAt(L));
// what a bar and its curses come to
function stats(bar,cur){
  const s=id=>X.abArtStat(bar,id), c=id=>X.abCurseStat(cur,id);
  const crit=Math.min(HERO.critCap,HERO.crit0+s('crit')), critK=(1+crit*(HERO.critM-1))/(1+HERO.crit0*(HERO.critM-1)), cdr=s('cdr');
  const nth=(X.AB_NTH-1+s('nth'))/X.AB_NTH, ex=1/(1-X.AB_EXEC_HP+X.AB_EXEC_HP/s('exec'));   // average damage factor of "every 5th hit x" and of "under 20% health x" (a fifth of the work done there)
  return {atk:s('atk')*c('atk')*critK*(1+HERO.aspdK*s('aspd'))*(1+HERO.cdrK*cdr/(1-cdr))*nth*ex,boss:s('boss'),hp:s('hp')*c('hp'),def:Math.max(X.AB_DEF_MIN,s('def')*c('def')),heal:s('heal')*c('heal'),ls:s('lifesteal'),kh:s('killheal'),sh:s('shield'),th:s('thorns'),
    last:bar.findIndex(id=>X.AB_ARTS[id].k.last>0),mhp:c('mhp'),mdmg:c('mdmg'),offer:c('offer')};
}
/* one round at level L: returns {won, hit (damage taken / max health), t, bar (Last Breath removes a copy)}. */
function fight(bar,cur,d,r,L,isBoss){
  bar=bar.slice(); const f=stats(bar,cur), H=HERO.hp*f.hp, ld=Math.max(0,L-HERO.level), lk=X.lvDmgK(ld), takenK=(1+0.05*ld)*HERO.taken*f.def;
  let hp=H, sh=f.sh*H, pots=HERO.pots, took=0, t=0, won=true;
  const heal=v=>{ hp=Math.min(H,hp+v*f.heal); }, hurt=v=>{ took+=v; const a=Math.min(sh,v); sh-=a; hp-=v-a; };
  const stepKill=(mobHp,perSecIn,thornHit,dpsK)=>{   // kill one target of mobHp health: time, damage in, heals out; false if the hero fell
    const dps=HERO.dps0*lk*f.atk*dpsK*(isBoss?f.boss*HERO.bossUp:1), thr=f.th*(isBoss?0.1:1)*mobHp*thornHit;
    let left=mobHp, guard=0; const dtMax=Math.max(SUB,mobHp/(dps+thr)/8); while(left>0){ if(++guard>5000){ console.error('LOOP',{mobHp,dps,thr,left,dtMax,hp,H,f:JSON.stringify(f),bar:bar.join()}); process.exit(2); } const need=left/(dps+thr), dt=Math.min(dtMax,need); left=need<=dtMax?0:left-(dps+thr)*dt; t+=dt;
      hurt(perSecIn*dt); if(f.ls>0) heal(f.ls*dps*dt);
      if(hp<H*0.5&&pots>0){ pots--; heal(H*HERO.potK); }
      if(hp<=0){ if(f.last>=0){ const id=bar.splice(f.last,1)[0]; hp=H*X.AB_ARTS[id].k.last; Object.assign(f,stats(bar,cur),{}); f.sh=0; sh=0; } else return false; }
      if(t>1800) return false; }   // (a time limit: the fight is lost; the step grows with the fight so a hopeless one costs ten steps)
    return true; };
  if(isBoss){
    const b=boss(L), hit=b.dmg*f.mdmg*takenK*BOSS_FRAC*(1-HERO.avoid);
    won=stepKill(b.hp*f.mhp,hit*BOSS_HITS,BOSS_HITS,1);
  } else {
    const m=mob(L), mhp=m.hp*f.mhp, hit=m.dmg*f.mdmg*takenK*(1-HERO.avoidMob);
    outer: for(let w=1;w<=X.AB_WAVES;w++){ const n=X.abWaveSize(r,w);
      for(let i=0;i<n;i++){ const att=Math.min(MELEE,n-i), rate=att/ATK_S;
        if(!stepKill(mhp,hit*rate,rate,1)){ won=false; break outer; }
        if(f.kh>0) heal(H*f.kh); } }
  }
  return {won,hit:took/H,t,bar};
}
// ---- a run ---------------------------------------------------------------------------------------
function offer(bar,n){
  const held={}; for(const id of bar) held[id]=(held[id]||0)+1;
  const pool=Object.keys(X.AB_ARTS).filter(id=>(held[id]||0)<X.AB_RANK_MAX), out=[];
  while(out.length<n&&pool.length){ let tw=0; for(const id of pool) tw+=X.AB_RAR_W[X.AB_ARTS[id].rar]||1; let r=rnd()*tw, i=0; for(;i<pool.length-1;i++){ r-=X.AB_RAR_W[X.AB_ARTS[pool[i]].rar]||1; if(r<=0) break; } out.push(pool.splice(i,1)[0]); }
  return out;
}
// greedy: how bad a bar is = the damage taken (as a share of max health) in a reference mob round and a boss round, ten levels on, minus a hand value of Last Breath
function badness(bar,cur,d,r,L){
  const Lr=L+10, a=fight(bar,cur,d,Math.max(r,4),Lr,false), b=fight(bar,cur,d,Math.max(r,4),Lr,true);
  const lb=bar.filter(id=>X.AB_ARTS[id].k.last>0).length;
  return Math.log(Math.max(1e-4,a.hit))+Math.log(Math.max(1e-4,b.hit))-(lb?0.5+0.15*(lb-1):0);
}
function pick(kind,bar,cur,cards,d,r,L){
  if(kind==='random'){ const c=cards[Math.floor(rnd()*cards.length)]; if(bar.length>=X.AB_ART_MAX) bar.splice(Math.floor(rnd()*bar.length),1); bar.push(c); return; }
  let best=null, bs=Infinity;   // greedy
  const base=bar.length>=X.AB_ART_MAX?null:badness(bar,cur,d,r,L);
  for(const c of cards){
    if(base!==null){ const s=badness(bar.concat(c),cur,d,r,L); if(s<bs){ bs=s; best={c,rm:-1}; } }
    else for(const id of new Set(bar)){ const j=bar.indexOf(id), nb=bar.slice(); nb.splice(j,1); nb.push(c); const s=badness(nb,cur,d,r,L); if(s<bs){ bs=s; best={c,rm:j}; } }
  }
  if(!best) return; if(base!==null&&bs>base+0.02) return;   // nothing helps: skip
  if(base===null){ const cur0=badness(bar,cur,d,r,L); if(bs>cur0) return; bar.splice(best.rm,1); }
  bar.push(best.c);
}
const PICKS=arg('picks',-1), picksAfter=(d,r)=>X.abIsBossRound(d,r)?3:PICKS>=0?PICKS:abKindPicks();   // --picks n: n a plain round instead of the real mix (B12: the kinds' own pay)
// B12: the picks the code really gives: a Fight 1, an Elite / Trial 2, a Boss 3 (AB_KIND_PICKS); an Event 0 or 1 (half of its choices hand an artifact, the curses it also deals are not modelled: a little generous), a Shrine 0.
// The kind is drawn with AB_KIND_W as the next-tile offer does (one card of three, so the draw is the weights); the forced boss rounds pay 3 as above
function abKindPicks(){ const W=X.AB_KIND_W, ids=X.AB_KIND_IDS; let t=0; for(const k of ids) t+=W[k]; let u=rnd()*t, k=ids[0]; for(const id of ids){ if((u-=W[id])<0){ k=id; break; } }
  return k==='event'?(rnd()<0.5?1:0):X.AB_KIND_PICKS[k]|0; }
// returns {rounds won, cleared}
function run(d,kind,opts){
  opts=opts||{}; const bar=[], cur=opts.curses||[], n=X.abRounds(d)||CAP; let won=0;
  for(let r=1;r<=n;r++){
    const L=X.abRoundLv(d,r), res=fight(bar,cur,d,r,L,X.abIsBossRound(d,r)); bar.length=0; bar.push(...res.bar);
    if(!res.won) return {rounds:won,cleared:false,bar};
    won=r; if(r===X.abRounds(d)) return {rounds:won,cleared:true,bar};
    if(kind!=='none'){ const k=opts.picks!==undefined?opts.picks:picksAfter(d,r); for(let i=0;i<k;i++){ const cards=offer(bar,Math.max(1,X.AB_OFFER_N-Math.round(X.abCurseStat(cur,'offer')))); if(cards.length) pick(kind,bar,cur,cards,d,r,L); } }
  }
  return {rounds:won,cleared:false,bar};
}
module.exports={HERO,fight,run,stats,mob,boss};
if(require.main===module){
  if(X.AB_ART_BAD.length||X.AB_CURSE_BAD.length){ console.log('bad rows',JSON.stringify(X.AB_ART_BAD),JSON.stringify(X.AB_CURSE_BAD)); process.exit(1); }
  // the hero against the overworld: level-100 monsters and the level-100 boss with no artifacts
  { const a=fight([],[],5,1,100,false), m=mob(100), b=fight([],[],5,7,100,true);
    console.log('hero check (no artifacts, level 100): a mob has '+(m.hp/1e6).toFixed(0)+'M health and dies in '+(m.hp/(HERO.dps0*X.lvDmgK(25))).toFixed(0)+' s; the boss '+(boss(100).hp/1e6).toFixed(0)+'M: '+(b.won?'won':'LOST')+' in '+b.t.toFixed(0)+' s taking '+(b.hit*100).toFixed(0)+'% of max health; a whole fight round '+(a.won?'won':'LOST')+' taking '+(a.hit*100).toFixed(0)+'%'); }
  const res={}, rows=[];
  for(const kind of ['none','random','greedy']){ res[kind]=[];
    for(let d=0;d<5;d++){ let c=0, rs=0, picks=0; for(let i=0;i<RUNS;i++){ const o=run(d,kind); if(o.cleared) c++; rs+=o.rounds; picks+=o.bar.length; } res[kind][d]={clear:c/RUNS,rounds:rs/RUNS}; }
    const depths=[]; for(let i=0;i<INF_RUNS;i++) depths.push(run(5,kind).rounds); depths.sort((a,b)=>a-b);
    res[kind].inf={med:depths[depths.length>>1],max:depths[depths.length-1],lv:X.abRoundLv(5,depths[depths.length-1]||1),p180:depths.filter(r=>r>=28).length/depths.length}; }
  const pct=v=>(v*100).toFixed(0).padStart(4)+'%';
  console.log('\nclear rate ('+RUNS+' runs each; Infinite '+INF_RUNS+')   rounds won on average in brackets');
  console.log('picker   '+X.AB_DIFFS.slice(0,5).map(d=>d.id.padStart(10)).join('')+'   Infinite (median / deepest round, its level)');
  for(const kind of ['none','random','greedy']) console.log(kind.padEnd(9)+res[kind].slice(0,5).map(q=>(pct(q.clear)+' ('+q.rounds.toFixed(1)+')').padStart(10)).join('')+'   '+res[kind].inf.med+' / '+res[kind].inf.max+' (level '+res[kind].inf.lv+'), '+(res[kind].inf.p180*100).toFixed(1)+'% reach level 180 (round 28)');
  // targets (Yuval, 15 Nov): a good bar clears V, no artifacts fail III, Infinite level 180 (round 28) only for a very lucky run
  const T=[['no artifacts fail difficulty III',res.none[2].clear===0],['no artifacts clear difficulty I at least sometimes or reach round 5',res.none[0].rounds>=4],['greedy clears difficulty V (>= 60%)',res.greedy[4].clear>=0.6],
    ['random (an average bar) clears difficulty I and II (>= 90%)',res.random[0].clear>=0.9&&res.random[1].clear>=0.9],['greedy does not run away: Infinite deepest below round 40 (level 180 = round 28 is for the very lucky)',res.greedy.inf.max<40&&res.greedy.inf.max>=19]];
  console.log(''); let bad=0; for(const [n,ok] of T){ console.log((ok?'PASS ':'FAIL ')+n); if(!ok) bad++; }
  if(CHECK&&bad) process.exit(1);
}
