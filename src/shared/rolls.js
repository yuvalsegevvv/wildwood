//@ Rolled stats of level-40 gear (version 3): the 13 stats, three lines a roll, ranges for weapons and armour, caps, the code a roll adds to an item id, the reroll stones and what sacrificing a level-30+ piece pays. Pure.
/* Agent map (design and numbers: docs/ROLLS.md; the pieces themselves are dungeon-rewards.js / dungeon-items.js)
   owns:    RL_STATS (13 stats: atk hp def exp drop coin crit critdmg cdr buffdur rxk aspd chg), RL_LINES (3), RL_CAPS (cdr 40%, aspd 60%, chg 100%), RL_SAC (stones per rarity: 1 / 2 / 4 / 8 / 16),
            RL_COST (stones a roll costs), RL_STONE_KIND (weapon -> 'rsw', armour -> 'rsa'), rlRoll (a fresh code), rlParseCode, rlLinesOf (the lines of a code for a slot kind), rlText,
            rlSumOf (the capped sum of one stat over a set of worn items), rlLazyItem (ITEM's Proxy asks it for ids that carry a roll).
   uses:    items.js (RAR_MULT is not needed here; ITEM is the Proxy declared there), dungeon-rewards.js (dgItem builds the record of an id with a code).
   used by: dungeon-rewards.js / dungeon-items.js (the ids and records), server/rolls.js (stones, sacrifice, reroll, the effects: rlP), game/economy/rolls.js (the forge tabs, the details panel).
   test:    tools/rolls-smoke.js.
   An id carries its roll: 'sword8-e+3~a57k12c90' is an epic level-40 sword at +3 with three lines: stat a (attack) at quality 57 of 99, stat k at 12, stat c at 90. Quality 00..99 maps
   linearly onto the stat's range for the slot kind; the lines are three DIFFERENT stats. Enhancing keeps the lines and does not scale them (+10% of the piece's own fixed stats a step, dungeon-rewards.js).
   Weapons roll the offensive stats higher (RL_KIND_K.weapon.off = 1.6), armour the defensive ones (1.3); the utility stats are the same for both. */
const RL_LINES=3;
// kind: off (offensive), def (defensive), util. lo / hi: the range of one line on a piece of kind x 1 (a fraction: 0.05 = 5%); u: how the text says it
const RL_STATS=[
  {id:'atk',    k:'a',name:'Attack',               kind:'off', lo:0.04, hi:0.10, text:'% attack'},
  {id:'hp',     k:'b',name:'Health',               kind:'def', lo:0.04, hi:0.10, text:'% health'},
  {id:'def',    k:'c',name:'Defense',              kind:'def', lo:0.04, hi:0.10, text:'% defense'},
  {id:'exp',    k:'d',name:'Experience',           kind:'util',lo:0.03, hi:0.08, text:'% XP from kills'},
  {id:'drop',   k:'e',name:'Drop chance',          kind:'util',lo:0.04, hi:0.10, text:'% chance of monster drops'},
  {id:'coin',   k:'f',name:'Coins',                kind:'util',lo:0.04, hi:0.10, text:'% coins from kills'},
  {id:'crit',   k:'g',name:'Critical chance',      kind:'off', lo:0.01, hi:0.03, text:'% critical hit chance'},
  {id:'critdmg',k:'h',name:'Critical damage',      kind:'off', lo:0.05, hi:0.12, text:' critical multiplier', x:true},
  {id:'cdr',    k:'i',name:'Cooldown reduction',   kind:'util',lo:0.03, hi:0.08, text:'% shorter skill cooldowns'},
  {id:'buffdur',k:'j',name:'Buff duration',        kind:'util',lo:0.04, hi:0.10, text:'% longer buffs'},
  {id:'rxk',    k:'k',name:'Reaction strength',    kind:'off', lo:0.03, hi:0.08, text:'% stronger elemental reactions'},
  {id:'aspd',   k:'l',name:'Attack speed',         kind:'off', lo:0.03, hi:0.08, text:'% attack speed (your skill 1 swings faster, and every skill is cast faster; cooldowns stay)'},
  {id:'chg',    k:'m',name:'Charge gain',          kind:'util',lo:0.05, hi:0.12, text:'% more Deep Cave charge from every cast'}];
const RL_BY_ID={}, RL_BY_KEY={}; for(const s of RL_STATS){ RL_BY_ID[s.id]=s; RL_BY_KEY[s.k]=s; }
const RL_KIND_K={weapon:{off:1.6,def:1,util:1},armor:{off:1,def:1.3,util:1}};   // the range of a stat x this, by the piece's kind: weapons roll higher offence, armour higher defence
// totals over the whole worn set (weapon + 4 armour pieces, 5 x 3 lines): cooldown reduction from gear stops at 40% (and passives add up to the old 60% overall cap in abilityCd);
// attack speed (x1.6 at most) and charge gain (twice as fast at most) are also capped over the whole set
const RL_CAPS={cdr:0.40,aspd:0.60,chg:1.00};
const RL_SAC=[1,2,4,8,16];   // reroll stones from sacrificing a level-30+ weapon / armour piece, by rarity (common..legendary)
const RL_COST=1;             // stones one roll (the first or a reroll) costs: of the kind of the piece (weapon pieces use weapon stones)
const RL_STONE_KIND={weapon:'rsw',armor:'rsa'}, RL_STONE_NAME={rsw:'Weapon Reroll Stone',rsa:'Armor Reroll Stone'}, RL_STONE_MAX=9999;
const RL_CODE_RE=/^~(?:[a-m]\d\d){3}$/;
// one roll: three different stats, each a quality 0..99 (rnd returns [0,1), Math.random on the server)
function rlRoll(rnd){
  rnd=rnd||Math.random; const keys=RL_STATS.map(s=>s.k); let out='~';
  for(let i=0;i<RL_LINES;i++){ const j=Math.min(keys.length-1,Math.floor(rnd()*keys.length)), k=keys.splice(j,1)[0], q=Math.min(99,Math.floor(rnd()*100)); out+=k+(q<10?'0':'')+q; }
  return out;
}
// '~a57k12c90' -> [{s: stat record, q: 57}, ...], or null when the code is not three different stats
function rlParseCode(code){
  if(typeof code!=='string'||!RL_CODE_RE.test(code)) return null;
  const out=[]; for(let i=0;i<RL_LINES;i++){ const s=RL_BY_KEY[code[1+i*3]], q=+code.slice(2+i*3,4+i*3); if(!s||out.some(l=>l.s===s)) return null; out.push({s,q}); }
  return out;
}
// the lines of a code on a piece of kind 'weapon' | 'armor': [{stat, q, v}] with v the value as a fraction (critdmg: added to the multiplier)
function rlLinesOf(code,kind){
  const L=rlParseCode(code), K=RL_KIND_K[kind]; if(!L||!K) return null;
  return L.map(({s,q})=>({stat:s.id,q,v:Math.round((s.lo+(s.hi-s.lo)*q/99)*K[s.kind]*10000)/10000}));
}
const rlPct=v=>String(Math.round(v*1000)/10);
function rlText(line){ const s=RL_BY_ID[line.stat]; return '+'+(s.x?(Math.round(line.v*100)/100).toFixed(2):rlPct(line.v))+s.text; }
// the capped sum of one stat over items (records with .roll = [{stat, v}]); level: the wearer's level, a piece above it counts for nothing
function rlSumOf(items,stat,level){
  let t=0; for(const it of items){ if(!it||!it.roll||(level!=null&&level<it.lv)) continue; for(const l of it.roll) if(l.stat===stat) t+=l.v; }
  const cap=RL_CAPS[stat]; return cap!==undefined?Math.min(cap,t):t;
}
// ITEM is a Proxy (items.js): an id that carries a roll is made on first use and kept, up to RL_MEMO records (then the made ones are dropped and rebuilt when asked again)
const RL_MEMO=4000; let rlMade=0;
function rlLazyItem(target,id){
  const base=id.slice(0,id.indexOf('~')), b=target[base]; if(!b||!b.roll0||!RL_CODE_RE.test(id.slice(base.length))) return undefined;
  const it=dgItem(id); if(!it) return undefined;
  if(rlMade>=RL_MEMO){ for(const k of Object.keys(target)) if(k.indexOf('~')>0) delete target[k]; rlMade=0; }
  target[id]=it; rlMade++; return it;
}
// version 3: the world bosses (not the dungeons') drop Reroll Stones, more the further up the zone tiers you fight them. At tier t you get one stone of a random kind
// with chance RL_BOSS_BASE + RL_BOSS_PER_TIER x t (tier 0: 25%, tier 7: 95%), and every RL_BOSS_EXTRA_EVERY tiers adds one more stone to a drop (tier 0-2: 1, 3-5: 2, 6-7: 3). The numbers to tune.
const RL_BOSS_BASE=0.25, RL_BOSS_PER_TIER=0.10, RL_BOSS_EXTRA_EVERY=3;
const rlBossStoneChance=t=>Math.min(1,RL_BOSS_BASE+RL_BOSS_PER_TIER*Math.max(0,t|0)), rlBossStoneCount=t=>1+Math.floor(Math.max(0,t|0)/RL_BOSS_EXTRA_EVERY);
