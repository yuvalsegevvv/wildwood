//@ Awakening: the tiers A0-A5 (hiker level, skill level cap, what each opens) and how a skill's level scales each of its numbers (AWK_SCALE curves, awkCurve, awkFx / awkRow scaled copies)
/* Agent map (skills revamp steps 7 and 8; step 8's tree shapes are in awakening-tree.js and the prices in awakening-cost.js; design: PLAN section 4).
   exports: AWK_LV_CAP, AWK_SCALE (kind -> {per, how, cap}), awkCurve(kind, L), AWK_FIELD (field name -> kind), AWK_CTX (object key -> the kind its v takes),
            awkFx(fx, L) (a level-L copy of a skill's fx, memoised; level 1 returns fx itself), awkRow(row, L) (a passive's trigger row at level L),
            AWK_TIERS (A0-A5: hiker level, skill level cap, what it opens), awkTierForLevel(L) (the lowest tier whose cap allows skill level L).
   uses:    nothing (pure data). Read by: shared/classes.js (skillPower, skillCdMult, passiveValue), shared/cave.js (caveLevelK), server/combat.js
            (handleAttack, applyBuffS), server/cave.js + cave/skills.js + cave-fx.js (charge skills), server/skillsets.js (ssRefreshP: leveled trigger rows),
            game/economy/skills.js (the panel's numbers). Test: tools/skills-smoke.js (the curve block).
   THE ONE PLACE a skill level reaches a number. Level 1 is x1 for every kind. The level here is capped at AWK_LV_CAP (12) for the curves only:
   the gameplay cap is SKILL_MAX_LV (classes.js) / CAVE_LEVEL_MAX, both 10 (the tree's top) since step 9; the level itself is the tree's (server/awakening.js).
   Damage compounds (x1.17 a level: level 10 = x4.11); healing and shields compound slower (x1.10) because health and damage taken come from
   the hiker's level and gear, so a x4 heal would make healers immortal. The burst's 5 s stun (ULT_STUN) and 60 s cooldown are not skill
   levels and never pass through here. */
const AWK_LV_CAP=12;
const AWK_SCALE={
  dmg:  {how:'pow', per:1.17},              // hits, damage over time (a.mult carries it, so burn k is not scaled again), a passive's damage proc
  heal: {how:'pow', per:1.10},              // heals and shields
  buff: {how:'add', per:0.06},              // a buff's or debuff's strength (a % stat): +6% of the level-1 value a level
  dur:  {how:'add', per:0.03},              // durations of buffs, debuffs, zones, marks
  cc:   {how:'add', per:0.02, cap:0.20},    // stun, slow, knockback, blind, taunt: +2% a level, at most +20% (bosses' own limits unchanged)
  pass: {how:'add', per:0.08},              // a passive's stat value: +8% of the level-1 value a level
  cd:   {how:'cd',  per:0.03, per2:0.01, knee:5}   // cooldowns: -3% a level to level 5, then -1% a level (level 10 = x0.83, 12 = x0.81)
};
function awkCurve(kind,L){
  const s=AWK_SCALE[kind]; if(!s) return 1;
  const n=Math.max(1,Math.min(AWK_LV_CAP,Math.floor(+L)||1))-1;
  if(s.how==='pow') return Math.pow(s.per,n);
  if(s.how==='cd') return 1-s.per*Math.min(n,s.knee-1)-s.per2*Math.max(0,n-(s.knee-1));
  return 1+Math.min(s.cap===undefined?Infinity:s.cap,s.per*n);
}
// a number field of a skill's fx (or a trigger row) -> its curve. `v` and `dur` depend on the object they sit in (AWK_CTX).
const AWK_FIELD={dur:'dur', stun:'cc', slow:'cc', kb:'cc', blind:'cc', heal:'heal'};
// an object key -> the kind of its `v` (and, for cc, of its `dur` too); everything else inside keeps its parent's context
const AWK_CTX={heal:'heal', shield:'heal', ward:'heal', ally:'buff', buff:'buff', status:'buff', taunt:'cc'};
function awkScale(o,L,ctx){
  if(Array.isArray(o)) return o.map(e=>e&&typeof e==='object'?awkScale(e,L,ctx):e);
  const out={}, cc=ctx==='cc'||(ctx==='buff'&&(o.kind==='stun'||o.kind==='slow'));   // a status that stuns or slows lasts by the cc curve
  for(const k of Object.keys(o)){ const v=o[k];
    if(typeof v==='number'){
      const kind=k==='v'?(ctx==='heal'||ctx==='buff'?ctx:null):k==='dur'?(cc?'cc':'dur'):AWK_FIELD[k]||null;
      out[k]=kind?v*awkCurve(kind,L):v;
    } else if(v&&typeof v==='object') out[k]=awkScale(v,L,Object.prototype.hasOwnProperty.call(AWK_CTX,k)?AWK_CTX[k]:ctx);
    else out[k]=v; }
  return out;
}
const AWK_MEMO=new WeakMap();
// the fx of a skill at level L (a fresh object, made once per fx and level; level 1 is the definition itself)
function awkFx(fx,L){
  const n=Math.max(1,Math.min(AWK_LV_CAP,Math.floor(+L)||1)); if(!fx||typeof fx!=='object'||n===1) return fx;
  let m=AWK_MEMO.get(fx); if(!m){ m=[]; AWK_MEMO.set(fx,m); }
  return m[n]||(m[n]=awkScale(fx,n,null));
}
// a passive's triggered row at level L: its proc's mult by damage, its heal / buff / shield / fx by their curves (the stat `v:[a,b]` is passiveValue's)
function awkRow(r,L){
  if(!(L>1)||!r) return r;
  const out=Object.assign({},r);
  if(typeof r.mult==='number') out.mult=r.mult*awkCurve('dmg',L);
  if(typeof r.heal==='number') out.heal=r.heal*awkCurve('heal',L);
  for(const k of ['buff','shield','status','mark','taunt']) if(r[k]&&typeof r[k]==='object') out[k]=awkScale(r[k],L,AWK_CTX[k]||null);
  if(r.fx) out.fx=awkFx(r.fx,L);
  return out;
}

/* The tiers (PLAN 4a). A tier is bought per character (its price: awakening-cost.js, awkTierCost). `lv` is the hiker level it needs, `cap` the highest
   skill level it allows, `opens` what it makes buyable: A1 the passive, A2 the charge skill, A3 the burst (damage and stun), A4 the burst's first buff
   (special node star1), A5 its second buff (star2). The level-1 skills (basic, skill, power) are open from A0. */
const AWK_TIERS=[
  {t:0, lv:0,  cap:4,  opens:'basic skill power'},
  {t:1, lv:10, cap:5,  opens:'passive'},
  {t:2, lv:20, cap:6,  opens:'charge'},
  {t:3, lv:28, cap:7,  opens:'burst'},
  {t:4, lv:35, cap:8,  opens:'star1'},
  {t:5, lv:45, cap:10, opens:'star2'}
];
function awkTierForLevel(L){ L=Math.floor(+L)||1; for(const T of AWK_TIERS) if(T.cap>=L) return T.t; return AWK_TIERS.length-1; }
