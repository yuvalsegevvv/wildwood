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
   Exports: BD_COST, BD_TOP, BD_TIER_ADD, BD_TIER_TOP, BD_STONE_COINS, BD_GUEST_PEN, BD_PASS_LV, BD_ST_MAX, BD_WANDERER, BD_WANDERER_ROWS, BD_ROMAN, bdOwnKey, bdSetOk, bdTierNeed, bdTierOk, bdStonesLeft,
            bdIsBondPassive, bdRowById, bdLvAdj, bdLvAddOf, bdActDone, bdRealOf. Used by: server/bond.js, server/awakening.js, server/skillsets.js, shared/classes.js, shared/skillsets.js. */
const BD_COST=[6,3,3,6,6,9,9], BD_TOP=6, BD_TIER_ADD=[0,0,0,1,1,2,2], BD_TIER_TOP=5;   // Bond 0's tier is none (bdTierNeed); V / VI ask the set's tier + 2 but never above tier V
const BD_STONE_COINS=300;   // a Bondstone beyond Bond VI turns into this many coins (an orb's 1-3 stones are then worth about a mid-level notice)
const BD_GUEST_PEN=2, BD_PASS_LV=1, BD_ST_MAX=999;   // a guest piece's level loss (floor 1); the level a Bond passive works at (it has no tree branch); the most stones of one character held
const BD_WANDERER='wanderer', BD_ROMAN=['0','I','II','III','IV','V','VI'];
// step 18 (the Wanderer's nine paths) fills these: Realization n -> a function (gear, path) returning {p: {passive id: level}, r: [row id]} the Wanderer's Realization I / II / IV / VI give
const BD_WANDERER_ROWS={1:null,2:null,4:null,6:null};
const bdOwnKey=(o,k)=>!!o&&typeof o==='object'&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const bdSetOk=k=>typeof k==='string'&&bdOwnKey(SS_SETS,k)&&!!SS_SETS[k].bonds&&!SS_SETS[k].dev;   // a character a save or a message may name
// the zone tier Bond b asks of its set's land (0: none)
const bdTierNeed=(S,b)=>b<=0?0:Math.min(BD_TIER_TOP,S.tier+BD_TIER_ADD[b]);
const bdTierOk=(gear,S,b)=>zoneTierMax(gear,S.land)>=bdTierNeed(S,b);
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
