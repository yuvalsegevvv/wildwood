//@ Bonds (rules, pure): Bond 0-VI per character (costs in Bondstones, the zone-tier gates, what each step gives), Realization for the Wanderer (from the main quest's acts), reading the active Bond the server writes
/* Agent map (skills revamp step 12; design: PLAN section 0, 3, 7 and 9; the server half: server/bond.js; test: tools/bond-smoke.js).
   SAVED (server/bond.js bdSanitize): gear.bd = {<set id>: {b: the Bond unlocked, -1 (locked) .. 6, st: Bondstones held}, wanderer: {r: Realization 0..6}}.
   STEPS: BD_COST[b] Bondstones for Bond b (6 3 3 6 6 9 9 = 42); BD_TIER_ADD[b]: the zone tier asked is the set's needs.tier + that (Bond 0: none; III / IV: +1; V / VI: +2, at most BD_TIER_TOP), in the set's land,
          reached = gear.zt[land].max (bdTierNeed, bdTierOk). Bond 0 = the character is yours (its basic, skill and power pieces); I / IV = its two Bond passives (set.bonds[1] / [4]) work unequipped;
          II / VI = the old 3- / 5-set rows (set.bonds[2] / [6]); III / V = +1 level each to all its pieces (skill, charge skill, burst; above the tier's cap, up to AWK_LV_CAP).
   ACTIVE BOND (server/bond.js bdRefreshP): min(Bond unlocked, the main character's pieces worn) - 1 for each guest piece worn (a piece of another character); a guest piece is BD_GUEST_PEN levels lower.
          What it gives is written into gear.skills.bdx = {main, act, g: guests, p: {Bond passive id: level}, r: [row id], lv: {skill / cave skill id | 'u:<set>' (the burst): level change}}:
          passiveSum (classes.js) adds bdx.p, ssBonuses (skillsets.js) reads bdx.r, skillLvOf adds bdx.lv (bdLvAdj); the client reads the same field from its gear mirror.
   REALIZATION (the Wanderer, bdRealOf): I / II / III with main-quest acts I / II / III done, IV V VI all with act IV. Only III / V's +1 level is wired; the rows of I / II / IV / VI are BD_WANDERER_ROWS (step 18: the paths).
   ORBS (step 13; server/bond-orbs.js): gear.bd.<set>.o = orbs held, gear.bd.pick = the set whose orbs open next, gear.bd.chg = the Stirrings' charge (0..BD_STIR_CHARGE). STIRRINGS (step 14; server/bond-stir.js): see there.
   Exports: BD_ORB_PRICE, BD_ORB_MAX, BD_ORB_BUY_MAX, BD_ORB_ROLL, BD_STIR_SECS, BD_STIR_CHARGE, BD_STIR_ELITE, BD_STIR_DG, BD_STIR_RD, BD_STIR_BOSS, bdRollRow, bdStirPick, BD_COST, BD_TOP, BD_TIER_ADD, BD_TIER_TOP, BD_STONE_COINS, BD_GUEST_PEN, BD_PASS_LV, BD_ST_MAX, BD_WANDERER, BD_WANDERER_ROWS, BD_ROMAN, bdOwnKey, bdSetOk, bdTierNeed, bdTierOk, bdStonesLeft,
            bdIsBondPassive, bdRowById, bdLvAdj, bdLvAddOf, bdActDone, bdRealOf. Used by: server/bond.js, server/awakening.js, server/skillsets.js, shared/classes.js, shared/skillsets.js. */
const BD_COST=[6,3,3,6,6,9,9], BD_TOP=6, BD_TIER_ADD=[0,0,0,1,1,2,2], BD_TIER_TOP=5;   // Bond 0's tier is none (bdTierNeed); V / VI ask the set's tier + 2 but never above tier V
const BD_STONE_COINS=300;   // a Bondstone beyond Bond VI turns into this many coins (an orb's 1-3 stones are then worth about a mid-level notice)
const BD_GUEST_PEN=2, BD_PASS_LV=1, BD_ST_MAX=999;   // a guest piece's level loss (floor 1); the level a Bond passive works at (it has no tree branch); the most stones of one character held
const BD_ORB_PRICE=1, BD_ORB_MAX=999, BD_ORB_BUY_MAX=99;   // step 13: the stall sells every character's orb for 1 coin, unlimited; held at most 999 of a character; at most 99 a purchase
const BD_ORB_ROLL=[60,30,10];   // an opened orb gives 1 / 2 / 3 Bondstones at these percentages (average 1.5: about 28 orbs from Bond 0 to VI)
// step 14, the hour's Stirrings (PLAN 3b)
const BD_STIR_SECS=3600, BD_STIR_CHARGE=60, BD_STIR_ELITE=3, BD_STIR_DG=2, BD_STIR_RD=3;   // a pick lasts an hour (UTC); 60 charge open an orb (a kill 1, an elite 3); a dungeon win opens 2, a raid clear 3
const BD_STIR_BOSS=[[100],[70,30],[50,50],[30,70],[20,60,20],[10,50,40]];   // the stirring boss: percent chance of 1 / 2 / 3 orbs a kill, by the tier fought (+0 .. +V)
const BD_WANDERER='wanderer', BD_ROMAN=['0','I','II','III','IV','V','VI'];
// step 18 (the Wanderer's nine paths) fills these: Realization n -> a function (gear, path) returning {p: {passive id: level}, r: [row id]} the Wanderer's Realization I / II / IV / VI give
const BD_WANDERER_ROWS={1:null,2:null,4:null,6:null};
const bdOwnKey=(o,k)=>!!o&&typeof o==='object'&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const bdSetOk=k=>typeof k==='string'&&bdOwnKey(SS_SETS,k)&&!!SS_SETS[k].bonds&&!SS_SETS[k].dev;   // a character a save or a message may name
// the zone tier Bond b asks of its set's land (0: none)
const bdTierNeed=(S,b)=>b<=0?0:Math.min(BD_TIER_TOP,S.tier+BD_TIER_ADD[b]);
const bdTierOk=(gear,S,b)=>zoneTierMax(gear,S.land)>=bdTierNeed(S,b);
// a percentage table [p1, p2, ...] and r in [0,1) -> 1, 2, ... (the number of the row r falls in)
const bdRollRow=(tbl,r)=>{ let a=0; for(let i=0;i<tbl.length;i++){ a+=tbl[i]; if(r*100<a) return i+1; } return tbl.length; };
/* the hour's pick from a list, the same everywhere with no state (a seeded shuffle per cycle of the list, like the dungeons' offer): every entry once before any comes again, and the last of one cycle
   is never the first of the next, so nothing comes back two hours running (a list of one or two just alternates). key: the list's own name, h: the hour number (floor(ms / 3600000)). */
function bdStirPick(key,list,h){
  const N=list.length; if(!N) return null; const i=((h%N)+N)%N; if(N<3) return list[i];
  const c=Math.floor(h/N), order=c2=>{ const a=list.slice(), r=mulberry32(dgHash(key)^Math.imul(c2+1,0x9e3779b1)); for(let k=N-1;k>0;k--){ const j=Math.floor(r()*(k+1)); const t=a[k]; a[k]=a[j]; a[j]=t; } return a; };
  const a=order(c); if(c>0&&a[0]===order(c-1)[N-1]){ const t=a[0]; a[0]=a[1]; a[1]=t; }
  return a[i];
}
// the stones still to spend from Bond b (unlocked) up to Bond VI
const bdStonesLeft=b=>{ let n=0; for(let i=Math.max(0,b+1);i<=BD_TOP;i++) n+=BD_COST[i]; return n; };
// a Bond I / IV passive: never worn, never granted as a piece
const bdIsBondPassive=id=>{ const pc=typeof id==='string'?SS_PIECE_OF[id]:null; if(!pc||pc.kind!=='passive') return false; const S=SS_SETS[pc.set]; return !!(S&&S.pos[pc.pos]&&S.pos[pc.pos].bond); };
// a row id of bdx.r ('<set>_b3' / '<set>_b5') -> {set, tier, row}, or null
function bdRowById(id){
  const m=typeof id==='string'?/^([a-z0-9]+)_b([35])$/.exec(id):null, S=m&&bdOwnKey(SS_SETS,m[1])?SS_SETS[m[1]]:null;
  return S&&S.bonus[m[2]]?{set:S.id,tier:+m[2],row:S.bonus[m[2]]}:null;
}
// the level change the active Bond gives skill id (0 when none); bdLvAdj: a level with it (1 .. AWK_LV_CAP)
const bdLvAddOf=(skills,id)=>{ const X=skills&&skills.bdx, L=X&&X.lv; return bdOwnKey(L,id)&&Number.isFinite(L[id])?L[id]:0; };
const bdLvAdj=(skills,id,L)=>{ const d=bdLvAddOf(skills,id); return d?Math.max(1,Math.min(AWK_LV_CAP,L+d)):L; };
// main-quest act a (1 = I .. 4 = IV: the step ids W, V, F, G) is done: the step index has passed its last step
const BD_ACT_LETTER=[null,'W','V','F','G'];
function bdActDone(gear,a){
  const s=gear&&gear.mq?gear.mq.s|0:0, L=BD_ACT_LETTER[a]; let last=-1;
  for(let i=0;i<MQ.length;i++) if(MQ[i].id[0]===L) last=i;
  return last>=0&&s>last;
}
// the Wanderer's Realization 0..6: acts I, II, III give I, II, III; act IV gives IV, V and VI
const bdRealOf=gear=>bdActDone(gear,4)?6:bdActDone(gear,3)?3:bdActDone(gear,2)?2:bdActDone(gear,1)?1:0;
