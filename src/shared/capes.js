//@ Capes, the "wildcards" the Gloamvault pays (eq.cape, wearable at the piece's own level): eight combos of one big plus and one smaller minus over attack %, crit, crit damage, attack speed, cooldown reduction and charge gain; base values, names, growth, texts. Pure.
/* Agent map (design: docs/DUNGEON-REVAMP.md section 5b; the ids and records are dungeon-rewards.js)
   owns:    CAPE_COMBOS (the 8: id, name, plus {stat,v}, minus {stat,v}), CAPE_BY_ID, CAPE_IDS, CAPE_LEG_K, CAPE_LV_STEP, capePlusK(rar), capeVals(combo,rar,n,t) -> {plus,minus},
            capeText(it), capePlusLine(it) / capeMinusLine(it) (the {stat,v} a worn cape adds to / takes from the rolled sums), capeNet(sum,minus,avail) (the minus after the caps, never below zero).
   uses:    nothing at load; RAR_MULT (items.js), enhMult (dungeon-rewards.js) and RL_STATS letters (rolls.js) at call time. Loaded after talisman.js.
   used by: shared/dungeon-rewards.js (dgParse, dgItem, dgCapeId, DG_REWARDS.gloamvault), shared/rolls.js (rlSumOf, rlMinusOf), server/rolls.js (rlRefreshP), game/economy/rolls.js (rlUiSum), inventory / item details.
   test:    tools/capes-smoke.js.
   Ids: cape<7|8|9|10>-<combo>[-<rarity key>][+n][~roll]. The combo's two letters are the plus stat then the minus stat, in the rolled-stat letters of rolls.js (a atk, g crit, h critdmg, i cdr, l aspd, m chg).
   The plus = base x rarity (RAR_MULT, a legendary x2 not x3) x tempering (+10% a step) x CAPE_LV_STEP per equipment level step above 30. The minus = base x tempering only. */
const CAPE_LV_STEP=1.15, CAPE_LEG_K=2;   // the plus grows x1.15 per equipment level step above 30; a legendary cape's rarity factor is 2 (RAR_MULT would say 3)
const CAPE_COMBOS=[
  {id:'al',name:'Cape of the Brute',     plus:{stat:'atk',v:0.12},    minus:{stat:'aspd',v:0.05}},
  {id:'ai',name:'Cape of the Reckless',  plus:{stat:'atk',v:0.12},    minus:{stat:'cdr',v:0.05}},
  {id:'la',name:'Cape of the Whirlwind', plus:{stat:'aspd',v:0.10},   minus:{stat:'atk',v:0.06}},
  {id:'gh',name:'Cape of the Hawk',      plus:{stat:'crit',v:0.06},   minus:{stat:'critdmg',v:0.15}},
  {id:'hg',name:'Cape of the Headsman',  plus:{stat:'critdmg',v:0.30},minus:{stat:'crit',v:0.03}},
  {id:'ia',name:'Cape of the Sage',      plus:{stat:'cdr',v:0.10},    minus:{stat:'atk',v:0.06}},
  {id:'mi',name:'Cape of the Storm',     plus:{stat:'chg',v:0.25},    minus:{stat:'cdr',v:0.05}},
  {id:'ml',name:'Cape of the Tide',      plus:{stat:'chg',v:0.25},    minus:{stat:'aspd',v:0.05}}];
const CAPE_BY_ID={}; for(const c of CAPE_COMBOS) CAPE_BY_ID[c.id]=c;
const CAPE_IDS=CAPE_COMBOS.map(c=>c.id);
const capePlusK=rar=>rar>=4?CAPE_LEG_K:RAR_MULT[rar];
// the plus and the minus of a cape: combo id, rarity 0-4, tempering n, level digit t (7 / 8 / 9 / 10); fractions (critdmg: added to the multiplier)
function capeVals(combo,rar,n,t){
  const c=CAPE_BY_ID[combo], k=enhMult(n);
  return {plus:{stat:c.plus.stat,v:Math.round(c.plus.v*capePlusK(rar)*k*Math.pow(CAPE_LV_STEP,Math.max(0,t-7))*10000)/10000},minus:{stat:c.minus.stat,v:Math.round(c.minus.v*k*10000)/10000}};
}
const CAPE_WORD={atk:'% attack',aspd:'% attack speed',crit:'% critical hit chance',critdmg:' critical multiplier',cdr:'% shorter skill cooldowns',chg:'% more Deep Cave charge'};
function capeStatText(l,sign){ const s=l.stat==='critdmg'?(Math.round(l.v*100)/100).toFixed(2):String(Math.round(l.v*1000)/10); return sign+s+(l.stat==='cdr'&&sign==='-'?'% cooldown reduction':CAPE_WORD[l.stat]); }
const capeText=it=>capeStatText(it.plus,'+')+', '+capeStatText(it.minus,'-');
const capePlusLine=it=>it&&it.kind==='cape'?it.plus:null;
const capeMinusLine=it=>it&&it.kind==='cape'?it.minus:null;
// the minus after the caps: sum = the capped plus and lines of a stat, avail = what the wearer has of that stat from everything else (a stat's total never goes below zero)
const capeNet=(sum,minus,avail)=>minus>0?Math.max(sum-minus,-Math.max(0,avail||0)):sum;
