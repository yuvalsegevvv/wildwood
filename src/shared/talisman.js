//@ Talismans, the level-40 accessory slot (eq.talisman) the volcano boss pays: five kinds (attack speed, buff duration, charge gain, cooldown reduction, flat attack), base values, names, text, and the boss's drop table by zone tier. Pure.
/* Agent map (docs/VOLCANO.md has the design)
   owns:    TAL_STATS, TAL_BASE (a common +0 talisman's value), TAL_NAMES, TAL_ATK (flat attack, kind 'atk'), talText, talBaseLine (the {stat,v} a talisman adds to the rolled sums), talRarityWeights(tier) (the boss drop table), talRarityOf(x,tier).
   uses:    nothing (a leaf, loaded after pendants.js). Ids and records: dungeon-rewards.js (dgTalismanId, dgParse, dgItem), dungeon-items.js.
   used by: server/rolls.js (rlRefreshP adds the base line to the sums; a talisman rolls and is sacrificed with the shared Accessory Reroll Stone, gear.rsr), server/boss-kits-volcano.js (the drop),
            server/players.js (recalcP: the flat attack), game/economy/* (details), ui/item-icons.js.
   test:    tools/volcano-smoke.js.
   A talisman is a level-40 piece with ONE fixed bonus (like a pendant) plus three rolled lines (like a ring). Ids: talisman8-<kind>[-<rarity key>][+n][~roll]. Rings, pendants and talismans share one stone, gear.rsr. */
const TAL_STATS=['aspd','buffdur','chg','cdr','atk'];
const TAL_BASE={aspd:0.05,buffdur:0.08,chg:0.08,cdr:0.05,atk:30};   // a common +0 talisman; x RAR_MULT x (1 + ENH_STEP n). 'atk' is flat attack added with the weapon's and the ring's
const TAL_NAMES={aspd:'Talisman of Swiftness',buffdur:'Talisman of Lasting',chg:'Talisman of Charging',cdr:'Talisman of Recall',atk:'Talisman of Might'};
const TAL_LV=40;
function talText(it){
  const p=v=>String(Math.round(v*1000)/10);
  return it.stat==='aspd'?'+'+p(it.v)+'% attack speed':it.stat==='buffdur'?'+'+p(it.v)+'% longer buffs':it.stat==='chg'?'+'+p(it.v)+'% more Deep Cave charge':it.stat==='cdr'?'+'+p(it.v)+'% shorter skill cooldowns':'+'+Math.round(it.v)+' attack (flat, with the weapon and ring)';
}
// the line a talisman adds to the capped sums of rolled stats (null for flat attack: recalcP adds that one)
const talBaseLine=it=>it&&it.kind==='talisman'&&it.stat!=='atk'?{stat:it.stat,v:it.v}:null;
// the volcano boss's drop: rarity weights (out of 100, common..legendary) at zone tier 0 and at tier 5; between them linear, beyond 5 the same as 5
const TAL_W0=[80,15,4,0.8,0.2], TAL_W5=[50,25,15,7,3], TAL_TIER_FULL=5;
function talRarityWeights(tier){ const k=Math.max(0,Math.min(TAL_TIER_FULL,tier|0))/TAL_TIER_FULL; return TAL_W0.map((w,i)=>w+(TAL_W5[i]-w)*k); }
function talRarityOf(x,tier){ const W=talRarityWeights(tier); let t=x*100; for(let r=0;r<W.length;r++){ if(t<W[r]) return r; t-=W[r]; } return W.length-1; }
