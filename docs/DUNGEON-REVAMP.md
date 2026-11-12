# Dungeon revamp: plan (not built)

Status: **plan, version 2, with Yuval's answers.** Nothing below is built yet. It is built in the steps of section 9, and each step is merged before the next one starts.

Goal: all eight dungeons stay worth running at every stage. They stop following the land's zone tier and get **11 tiers of their own, monster level 30 to 110, 8 levels apart**. All eight dungeons use the same ladder. Each dungeon pays one kind of piece. The tier decides which **equipment level** (30 / 40 / 50 / 60) a piece is.

## 1. The rules (Yuval's)

| Rule | Value |
|---|---|
| Tiers | 11 per dungeon: monster level 30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110. Not tied to zone tiers. The top is 110 so the top tier fits a maxed character in maxed level-60 gear, with the new pieces and maxed symbols. |
| Unlock | Tier I opens with the door. Tier N+1 opens once you clear tier N (section 2). |
| Monster strength | The world curve (`defAt` at the tier's level), as it is. Playtesting tunes it later. |
| Rarity of every piece | 65 / 25 / 7 / 2.5 / 0.5 % (common / rare / epic / unique / legendary), the same at every tier |
| Dungeons 1-4 | keep their drops: Hollow Roots weapons, Jade Springs armour, Bonefrost Barrow rings, Blackseam pendants |
| Dungeon 5, the Sandglass | talismans |
| Dungeon 6, the Gloamvault | capes (new slot) |
| Dungeon 7, the Termite Cathedral | gloves (new slot) |
| Dungeon 8, the Cenote | shields (new slot) |
| Every kind | exists at equipment level 30, 40, 50 and 60 |
| Final boss (Pyrrhax) | drop list empty for now (it pays talismans today, and those move to dungeon 5) |
| Rolled lines | level 30: none, level 40: **1** (was 3), level 50: **2**, level 60: **3** |
| Old level-40 pieces | keep the first line, the last two are deleted |
| Rings | work only with the matching kit, or with the matching Wanderer path (section 6) |

Equipment level of each piece by tier (%), and pieces per clear:

| Tier | Lv | Eq 30 | Eq 40 | Eq 50 | Eq 60 | Pieces |
|---|---|---|---|---|---|---|
| I | 30 | 100 | 0 | 0 | 0 | 1 |
| II | 38 | 50 | 50 | 0 | 0 | 1 |
| III | 46 | 25 | 50 | 25 | 0 | 1-2 |
| IV | 54 | 20 | 30 | 40 | 10 | 1-2 |
| V | 62 | 10 | 30 | 45 | 15 | 2 |
| VI | 70 | 5 | 25 | 50 | 20 | 2-3 |
| VII | 78 | 0 | 20 | 50 | 30 | 2-3 |
| VIII | 86 | 0 | 10 | 50 | 40 | 2-4 |
| IX | 94 | 0 | 5 | 45 | 50 | 3-4 |
| X | 102 | 0 | 0 | 40 | 60 | 3-4 |
| XI | 110 | 0 | 0 | 25 | 75 | 3-5 |

The piece count is a whole number drawn evenly from the range. Each piece rolls its own equipment level and rarity. Everyone in the party gets the same pieces (the all-loot rule stays).

## 2. Dungeon tiers

Today a run's level is `dgLevel(T,tier)`: the theme's `lv` plus 10 for each zone tier above the land's base. The tier is the player's zone tier setting (`dgTierFor`, `dgUnlocked`, `DG_LANDS.base` in `shared/dungeons.js`).

New:
- `DG_TIERS` is 11 rows of `{t, lv, eq:[4 weights], n:[min,max]}` (the table above), in a new file `shared/dungeon-tiers.js` (prefix `dgt…`). `dgLevel(T,t)` becomes `DG_TIERS[t].lv`. The theme's `lv` and `DG_LANDS.base` stop deciding the level.
- The Delve board gets a tier picker (I-XI, with arrows) beside the two missions on offer. The leader picks it, and the client sends `dg{a:'start',tier}`.
- **Unlock**: tier I opens with the door (the land gate stays, so you still have to reach the land). Tier N+1 opens when you have cleared tier N **of any dungeon**. That is saved as `gear.dg.top`, the highest tier cleared. Every member of the party needs the tier open and needs hiker level 25 or more. There is no level requirement per tier.
- The Hollow Roots' "+1 difficulty" lock goes, and so do the Sandglass's and the Gloamvault's entry levels (36, 38). Every dungeon starts at tier I.
- The zone tier setting no longer touches dungeons. A skill set piece from a dungeon ("a won run at +1 or above", `ssDungeonClearP`) now needs tier II or above. The Bond Stirring is unchanged.

## 3. Monster strength

Run monsters and bosses use the world's `defAt` at the tier's level, unchanged: the late creep above 60, the boss creep, and the level debuff on your damage (floor x0.5). This matches Yuval's playtest: on the test server, unique level-40 gear beats level-80 monsters without trouble. Playtesting tunes the curve later, so this plan adds no dungeon-only curve.

XP and coins follow the tier's level, with the usual limit that no kill pays for more than 10 levels above you (`xpLeadK`).

## 4. Equipment levels 30 / 40 / 50 / 60

| Eq level | Id digit | Stats | Rolled lines |
|---|---|---|---|
| 30 | 7 (as today) | as today | 0 |
| 40 | 8 (as today) | as today (x1.25 on 30) | **1** |
| 50 | 9 (new) | x1.25 on 40 | 2 |
| 60 | 10 (new) | x1.25 on 50 | 3 |

- Ids keep their shape: `sword9-e+3~a57k12`, `ring10-fire-l~a57k12c90`. `dgParse`'s regex learns tiers 9 and 10 for every kind, and a roll of 1 to 3 lines. The line count **must equal** the level's (`rlParseCode` is given the count), and a level-30 piece takes no roll.
- Enhancing (`ENH_MAX` by rarity, +10% a step, the Tempering Stone) works the same at every level.
- Reroll stones: weapons use `rsw`. Armour and **shields** use `rsa`. Rings, pendants, talismans, **capes and gloves** use `rsr`. A reroll replaces all of a piece's lines.
- Sacrifice (`RL_SAC`) works for every level-30+ piece. A higher level pays more: x1 / x1.5 / x2 / x3 for eq 30 / 40 / 50 / 60.
- A line's range per rarity is untouched. The caps (`RL_CAPS`: cdr 40%, aspd 60%, chg 100%) stay and cover capes too.
- Every new id family needs its `dgAll…` list (so no shop, drop or "all items" list sees it), an icon (`item-icons.js`) and a sell-back price (x3 per eq level step, like rarity).

## 5. The four kinds dungeons 5-8 pay

All four are accessories. Each has one fixed bonus, scaled by rarity x enhancement x eq level, plus the rolled lines of its level.

### 5a. Talismans (the Sandglass)
The five existing kinds: attack speed, buff duration, charge gain, cooldown reduction and flat attack (`shared/talisman.js`). New: level-30, 50 and 60 talismans (`talisman7-`, `talisman9-`, `talisman10-`). The slot opens at hiker level 30 instead of 40 (`TAL_LV`). Pyrrhax's talisman drop (`vbRewardP`, `talRarityWeights`) is removed, and his drop list is empty.

### 5b. Capes, "wildcards" (the Gloamvault)
A cape gives a big plus to one stat and a minus to another. Both stats come only from **attack %, crit rate, crit damage, charge gain, attack speed and cooldown reduction**. There are **8 combinations**, and each of the six stats is the plus of at least one:

| Id | Cape | Plus (common +0, eq 30) | Minus (+0) |
|---|---|---|---|
| `as` | Cape of the Brute | +12% attack | -5% attack speed |
| `ai` | Cape of the Reckless | +12% attack | -5% cooldown reduction |
| `sa` | Cape of the Whirlwind | +10% attack speed | -6% attack |
| `gh` | Cape of the Hawk | +6% crit rate | -0.15x crit damage |
| `hg` | Cape of the Headsman | +0.30x crit damage | -3% crit rate |
| `ia` | Cape of the Sage | +10% cooldown reduction | -6% attack |
| `mi` | Cape of the Storm | +25% charge gain | -5% cooldown reduction |
| `ms` | Cape of the Tide | +25% charge gain | -5% attack speed |

- The id is `cape<d>-<combo>[-rarity][+n][~roll]`, for example `cape9-gh-e+4~a57k12`.
- **The plus** grows with rarity (`RAR_MULT`, except that a legendary cape uses x2 instead of x3) x enhancement (+10% a step) x eq level (x1.15 a step; a percent stacks with everything, so it grows more slowly than attack and health).
- **The minus grows with upgrading**: +10% of itself for each tempering step, like the plus, but rarity and eq level do not touch it. A better cape is always a better trade, while pushing it to +10 also deepens its cost (a +10 minus is x2).
- The plus counts inside the existing caps (cdr 40%, aspd 60%, chg 100%, crit's own cap), so a cape cannot break them. The minus is applied after the caps, and it never takes a stat below zero.
- Slot `eq.cape`. The existing cosmetic cape stays the look, and the stat cape has no model of its own.

### 5c. Gloves: crits and attack (the Termite Cathedral)
Opener and Quick Hands are gone (Yuval: Opener cannot be upgraded, and Quick Hands could get too strong). Six kinds:

| Kind | Effect (common +0, eq 30) | What grows |
|---|---|---|
| `crit` Keen | +4% crit rate | the % |
| `critdmg` Brutal | +0.20x crit damage | the multiplier |
| `atk` Heavy | +25 flat attack (with the weapon, ring and talisman) | the attack |
| `streak` Hot Streak | each crit adds +1.5% crit rate for 4 s, up to 5 stacks | the % a stack |
| `over` Overflow | crit rate above the cap turns into crit damage (1% -> 0.03x) | the rate of the conversion |
| `echo` Echo | a crit has a 15% chance to hit again for 40% | the second hit's % (the chance stays) |

Values grow with rarity x enhancement x eq level. The effects run in `rollDmgS` / `resolveHitS` (`server/combat.js`) through one hook line each, marked `// dgrev:`. Slot `eq.gloves`, and the cosmetic gloves stay the look.

### 5d. Shields: survival (the Cenote)

| Kind | Effect (common +0, eq 30) |
|---|---|
| `hp` Bulwark | +8% health |
| `def` Ironwall | +8% defence |
| `block` Parry | 8% chance to block a hit (it does 30% of its damage) |
| `steady` Steady | 30% shorter stuns and slows on you |
| `ward` Last Ward | below 30% health, a shield of 20% of max health (once every 60 s) |
| `leech` Lifeblood | heal 1.5% of the damage you deal |
| `regen` Mending | +0.6% of max health a second out of combat, 0.2% in combat |

All of them respect the floor that a hit always does at least 10% of its damage (`DMG_TAKEN_MIN`). Slot `eq.shield`, for any class: it is a stat slot, and the cosmetic shield in the weak hand stays a look.

## 6. Rings need their kit

Today a ring adds its flat attack whatever its element. New: a ring works (its flat attack **and** its rolled lines) only while what you wear has the ring's element:
- with a skill set worn: the set's element (`set.el`). A `basic` ring needs an element-less set.
- as the Wanderer: the active path's element (`WD_PATHS[id].el`: Forager earth, Keen Eye air, Lorekeeper dark, Prism light, Stalwart fire, Tempo water). The element-less paths (Fury, Bulwark, Wayfarer) take a `basic` ring.

The inventory greys an inactive ring and says "needs a <element> kit or path". Code: `dgRingAtkP` (`server/dungeon-gear.js`), the line sums in `server/rolls.js` (`rlSumOf` is given the wearer's element), and the details text.

## 7. Saves and migration (`gear.dgv`, run once per save in `sanitizeGear`)

- Old level-40 pieces with three lines (`…8…~xxyyzz`): keep the first line and delete the last two. The same id rewrite covers worn pieces, the bag and the player shops (`gear.psh`).
- Old level-40 talismans stay level 40 and get the same rewrite.
- `gear.dg.top` starts at the tier a player's best old clear matches by level (for example, a level-50 run cleared means tier III, level 46, is cleared, so tier IV is open). Nobody loses access.
- New fields with defaults: `eq.cape`, `eq.gloves`, `eq.shield` (empty) and `gear.dg.top` (0).
- `MOBS.md` / `EQUIPMENT.md` are regenerated (`node tools/gen-docs.js`).

## 8. Not in this plan

- Pyrrhax's new drop (Yuval has an idea, later).
- A dungeon-only monster curve. Playtesting decides whether one is needed.
- Models for the stat cape, gloves and shield: the cosmetics stay the look.

## 9. Build order (each step merged before the next; tests in brackets)

| Step | What | Test |
|---|---|---|
| D1 | `shared/dungeon-tiers.js`: `DG_TIERS`, run level = tier level, the board's tier picker, `gear.dg.top`, the unlock rule, zone tiers unhooked, the old entry locks removed | new `dungeon-tiers-smoke`, `dungeon-runs-smoke`, `dungeon-board-client-smoke` |
| D2 | Eq 50 / 60 ids, 1 / 2 / 3 lines, the old level-40 migration, sacrifice, the fixed rarity, the eq table and piece count in `dgWinS` | `rewards-smoke`, `rolls-smoke`, `pendants-smoke`, `server-smoke` |
| D3 | Rings need their kit or path | `rewards-smoke`, `skillsets-smoke`, `bond-smoke` |
| D4 | Talismans at all levels from the Sandglass; Pyrrhax's list emptied; the slot at 30 | `volcano-smoke`, `rewards-smoke` |
| D5 | Capes: slot, the 8 combos, plus and minus growth, caps; the Gloamvault pays them | new `capes-smoke` |
| D6 | Gloves: slot, the 6 kinds, combat hooks; the Termite Cathedral | new `gloves-smoke`, `skills-smoke` |
| D7 | Shields: slot, the 7 kinds, hurt hooks; the Cenote | new `shields-smoke`, `server-smoke` |
| D8 | Client: inventory slots and icons, forge tabs, details text, the board, a results card with several pieces; the docs | `rewards-client-smoke`, `client-smoke`, `phone-layout-smoke` |
| D9 | Full suite, `npm run fuzz`, `economy-fuzz`, `world-soak`, `gen-docs`, merge | `npm test` |

The main files touched: `shared/dungeon-rewards.js`, `dungeon-items.js`, `rolls.js`, `talisman.js`, `dungeons.js`, and new `shared/dungeon-tiers.js`, `capes.js`, `gloves.js`, `shields.js`; `server/dungeon-gear.js`, `rolls.js`, `players.js` (`recalcP`, `hurtP`), `combat.js`, `boss-kits-volcano.js`, `dungeons/runs.js`, `lobby.js`; `game/economy/inventory.js`, `dungeon-gear.js`, `rolls.js`, `game/dungeon/board.js`, `hud.js`, `ui/item-icons.js`; and the docs `ROLLS.md`, `DUNGEON-THEMES.md` section 7, `VOLCANO.md`, `areas/dungeons.md`, `PROTOCOL.md`.
