//@ Talismans, the accessory slot (eq.talisman, wearable from level 30) the Sandglass pays: five kinds (attack speed, buff duration, charge gain, cooldown reduction, flat attack), base values, names, text. Pure.
/* Agent map (docs/VOLCANO.md has the design)
   owns:    TAL_STATS, TAL_BASE (a common +0 talisman's value), TAL_NAMES, TAL_ATK (flat attack, kind 'atk'), talText, talBaseLine (the {stat,v} a talisman adds to the rolled sums), 
   uses:    nothing (a leaf, loaded after pendants.js). Ids and records: dungeon-rewards.js (dgTalismanId, dgParse, dgItem), dungeon-items.js.
   used by: server/rolls.js (rlRefreshP adds the base line to the sums; a talisman rolls and is sacrificed with the shared Accessory Reroll Stone, gear.rsr), server/boss-kits-volcano.js (the ending toast),
            server/players.js (recalcP: the flat attack), game/economy/* (details), ui/item-icons.js.
   test:    tools/volcano-smoke.js.
   A talisman exists at level 30 / 40 / 50 / 60 (D4): ONE fixed bonus (x1.25 per level step on the level-40 value, level 30 = level 40 / 1.25) plus 0 / 1 / 2 / 3 rolled lines. The Sandglass pays them; the slot opens at the item's own lv (30). Ids: talisman<7|8|9|10>-<kind>[-<rarity key>][+n][~roll]. Rings, pendants and talismans share one stone, gear.rsr. */
const TAL_STATS=['aspd','buffdur','chg','cdr','atk'];
const TAL_BASE={aspd:0.05,buffdur:0.08,chg:0.08,cdr:0.05,atk:30};   // a common +0 talisman; x RAR_MULT x (1 + ENH_STEP n). 'atk' is flat attack added with the weapon's and the ring's
const TAL_NAMES={aspd:'Talisman of Swiftness',buffdur:'Talisman of Lasting',chg:'Talisman of Charging',cdr:'Talisman of Recall',atk:'Talisman of Might'};
function talText(it){
  const p=v=>String(Math.round(v*1000)/10);
  return it.stat==='aspd'?'+'+p(it.v)+'% attack speed':it.stat==='buffdur'?'+'+p(it.v)+'% longer buffs':it.stat==='chg'?'+'+p(it.v)+'% more Deep Cave charge':it.stat==='cdr'?'+'+p(it.v)+'% shorter skill cooldowns':'+'+Math.round(it.v)+' attack (flat, with the weapon and ring)';
}
// the line a talisman adds to the capped sums of rolled stats (null for flat attack: recalcP adds that one)
const talBaseLine=it=>it&&it.kind==='talisman'&&it.stat!=='atk'?{stat:it.stat,v:it.v}:null;
