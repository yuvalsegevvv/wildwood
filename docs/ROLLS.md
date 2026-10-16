# Rolled level-40 gear (version 3)

Level-40 weapons (the Sunscar's dungeon, `sandglass`) and armour (the Gloamhorn's dungeon, `gloamvault`) are the level-30 dungeon family one step on (`DG40_*` in `shared/dungeon-rewards.js`, ids end in `8`, tier index 7, x1.25 on the level-30 numbers) and may carry **three rolled lines** on top of their fixed stats. Tempering (+n by rarity, `ENH_MAX`) works exactly as for level-30 pieces and keeps the lines; rolled lines are not scaled by it. There are no level-35 pieces.

**Files**: `shared/rolls.js` (stats, ranges, caps, code), `shared/dungeon-rewards.js` / `dungeon-items.js` (ids, records), `server/rolls.js` (effects, stones, messages), `game/economy/rolls.js` (forge tabs), test `node tools/rolls-smoke.js`.

**Id**: `sword8-e+3~a57k12c90` = epic level-40 sword at +3, lines: stat `a` quality 57, `k` 12, `c` 90 (quality 00-99 maps onto the stat's range). `ITEM` is a Proxy that makes such a record on first use (`rlLazyItem`); a malformed code is simply not an item.

**The 13 stats** (`RL_STATS`; range of one line before the slot factor): attack 4-10%, health 4-10%, defense 4-10%, XP 3-8%, drop chance 4-10%, coins 4-10%, crit chance 1-3 points, crit multiplier +0.05-0.12, cooldown reduction 3-8%, buff duration 4-10%, reaction strength 3-8%, accuracy 3-8%, resistance 3-8%. Three different stats a roll. **Weapons** roll offensive stats (attack, crit chance, crit damage, reaction strength, accuracy) x1.6, **armour** rolls defensive stats (health, defense, resistance) x1.3; the rest are equal.

**Caps** (summed over the worn set, `RL_CAPS`): cooldown reduction from gear 40% (passives add to it inside the old 60% overall cap, `abilityCd`'s `extra`), accuracy and resistance 60%. Crit chance and multiplier stay under `CRIT_CAP` / `CRIT_MULT_CAP`; reaction strength under the reaction cap 1.5. A piece counts only at its level (40).

**Stones**: `gear.rsw` (Weapon Reroll Stone) and `gear.rsa` (Armor Reroll Stone). No other source: **sacrifice** an unworn level-30 or level-40 weapon (weapon stones) or armour piece (armour stones) for 1 / 2 / 4 / 8 / 16 by rarity (`sac{id}`; rings and pendants cannot be sacrificed). A roll or reroll costs 1 stone of the piece's kind (`reroll{id[,worn]}`) and replaces all three lines. Rolled pieces do not merge.

**Accuracy and resistance**: resistance is a chance, on each hit, to **halve the damage** and **negate the debuff / reaction** that hit would cause; the attacker's accuracy is subtracted from that chance (`rlResists`). Players get both from gear; monsters carry `res` / `acc` on their defs (`m.T.res`, `m.T.acc`), the Sunscar's and the Gloamhorn's do. A resisted hit on a monster sends fx 2 on the damage event.

**Hooks** (`// rolls:`): `recalcP` / `hurtP` / `sanitizeGear` (players.js), `rollDmgS` / `damageMonsterS` / `statusS` / `applyBuffS` / `handleAttack` / `rewardKill` (combat.js), `rxHitS` (reactions.js), `drinkP` (crafting.js), `ssAllyS` (skillsets.js), `abilityCd` (classes.js), the Proxy in items.js.
