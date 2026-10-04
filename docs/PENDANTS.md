# Pendants: the necklace with one bonus

**Status: built and tested** (`tools/pendants-smoke.js`, 32 checks; the shared parts also by `tools/dungeons-smoke.js` and `tools/rewards-smoke.js`). Pendants are the owner's idea (exp, drop, coin, crit rate and crit damage increase);
the owner then asked for **both a ring slot and a pendant slot** and for pendants to keep **the Tempering Stone enhancement like other armour pieces**. So a pendant is a level-30 dungeon piece in the same scheme as the ring
(`docs/DUNGEON-THEMES.md` section 7): its rarity multiplies it and `+1 ... +N` tempering steps (Tempering Stones, `temper{id}`) add 10% of its value each. Enhancing, not a tier, carries the power.

## 1. The five kinds (one bonus each)

| Kind | Name | A common +0 pendant gives | Where it is read |
|---|---|---|---|
| `xp` | Pendant of Learning | **+6%** XP from every kill | `rewardKill` (`server/combat.js`), added to the Scholar passive |
| `drop` | Pendant of Plenty | **+10%** chance of a monster's material drop | `rollDropCount` call in `rewardKill`, added to the Scavenger passive |
| `coin` | Pendant of Fortune | **+10%** coins from every kill | `rewardKill` |
| `crit` | Pendant of Precision | **+2 points** of crit chance (12% -> 14%) | `rollDmgS`, with the Precision passive and potions |
| `critdmg` | Pendant of Ruin | **+0.10** to the crit multiplier (x1.7 -> x1.8) | `rollDmgS` |

The numbers are `PENDANT_BASE` in `src/shared/pendants.js`; the value of a piece is `PENDANT_BASE x RAR_MULT[rarity] x (1 + ENH_STEP x n)` with `RAR_MULT` 1 / 1.3 / 1.7 / 2.2 / 3 and `ENH_STEP` 0.10.
The best piece, a **legendary at +10**, is x6 a common +0: **+36% XP, +60% drops, +60% coins, +12 crit points, +0.60 crit multiplier**.

Caps, so that passives, potions and a pendant cannot run away: crit chance **60%** (`CRIT_CAP`) and crit multiplier **x2.5** (`CRIT_MULT_CAP`). The numbers `rollDmgS` used to hold as literals are `CRIT_BASE` (0.12) and `CRIT_MULT` (1.7), also in `pendants.js`.
Rewards from an XP pendant never beat `xpLeadK` (a kill pays for at most 10 levels above you), since the bonus is added to the multiplier, not to the level.

## 2. Where they come from, how they are worn

- **Source**: the **Blackseam**, the Greyspine's dungeon (`DG_REWARDS.blackseam = {kind:'pendant', pool: PENDANT_STATS}`): a clear pays one pendant, the kind at random with equal chance, the rarity from the dungeon table
  70 / 25 / 4 / 0.8 / 0.2% (`dgClearReward`, `dgGrantItemP`). Nothing else makes or sells one (`buyP` refuses every `dg` piece).
- **Slot**: `eq.pendant`, next to `eq.ring` (`SLOT_LABEL`, `BODY_SLOTS` in `game/economy/inventory.js`, the inventory grid in `styles/15-inventory.css`). **Level 30** to wear (`it.lv`; `pendP` checks `p.level >= it.lv`).
- **Ids** (what the save stores; the server reads the worn id and recomputes the value, never a number from the client): `pendant-<kind>[-<rarity key>][+n]`, e.g. `pendant-xp`, `pendant-critdmg-l+10`. Rarity keys are the ring's
  (`r e u l`); the limits are 2 / 4 / 6 / 8 / 10 steps by rarity (`ENH_MAX`). 175 pendant ids (5 kinds x 35 (rarity, step) pairs) of the 665 level-30 ids (`dgAllIds`); `dgParse` accepts exactly those.
- **Enhancing, merging, selling**: the same rules as the other level-30 pieces. Temper at Greta's forge with Tempering Stones (`dgEnhanceNext`, cost n stones for the step to +n, always works, no coins); merging three identical pieces
  into the next rarity takes only +0 pieces (`dgMergedId`); the sell-back price is `dgItem`'s `price` (`DG_PRICE x DG_PENDANT_PRICE x 3^rarity`).
- **Look**: `pendantIconArt` in `game/ui/item-icons.js` (a chain and a gem, the metal by rarity, the gem by kind, the tempered sparkle); the details panel text is `pendantText` (`shared/pendants.js`) and `dgStatChange` / `statDiff`.

## 3. Testing tools

Testing tab: **Give all level-30 gear** (`rwdev dgall`) and **three of each** (`dgthree`) include the five pendants; the Blackseam's door has a button (`#tDoorMine`) that opens the way and walks you to it.

## 4. Hooks and files

| What | File |
|---|---|
| the kinds, base values, names, text, crit constants and caps | `src/shared/pendants.js` |
| ids (`dgPendantId`), parse, the item record, the clear's reward, the enhancement step | `src/shared/dungeon-rewards.js`, `dungeon-items.js` |
| slot label, `mergedId`, `itemStat` (pendant text) | `src/shared/items.js` |
| `pendP(p, stat)` (the one reader), `sanitizeGear` accepts `eq.pendant` | `src/server/players.js` |
| the effects: XP, coins, drops, crit chance and multiplier | `src/server/combat.js` (`rewardKill`, `rollDmgS`) |
| `rwdev dgall` / `dgthree` | `src/server/dungeon-gear.js` |
| the slot, details and the tooltip diff | `src/game/economy/inventory.js`, `dungeon-gear.js`; the armourer's shop only *buys* them: `shops.js` |
| the icon | `src/game/ui/item-icons.js` |

## 5. Decisions (what I assumed)

1. A pendant has **one** bonus, not a list (the owner's five types, one each). Mixed pendants could come later (a second bonus at higher rarity).
2. The base values (6 / 10 / 10 / 2 points / 0.10) are my numbers; the best piece's x6 is what the owner's "enhancing carries the power" rule gives. They are one table to retune.
3. The Blackseam pays pendants and nothing else of this kind; the pool is "all five kinds" like the ring's "all seven".
4. The Greyspine's **zone tiers** are on, but the symbol (the zone-tier balance yardstick) still counts only the home forest, the Vale and the Reach, so the level-80 calibration of `boss-duel` is unchanged (`ZTIER_SYMBOL_LANDS`).
