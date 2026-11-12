# Dungeon revamp: plan (not built)

Status: **plan, waiting for Yuval's approval.** Nothing below is implemented. Section 9 lists the choices that are Yuval's; each has a recommendation, and the rest of the plan assumes it.

Goal: every one of the eight dungeons stays worth running at every stage. They stop following the land's zone tier and get **11 tiers of their own, level 30 to level 130**, all eight with the same ladder. Each dungeon pays one kind of piece; which **equipment level** (30 / 40 / 50 / 60) the piece is depends on the tier.

## 1. What the owner asked (the fixed rules)

| Rule | Value |
|---|---|
| Tiers | 11 per dungeon: monster level 30, 40, 50 ... 130. Not tied to zone tiers. Level 130 at the top is intentional (more gear slots now, higher skill levels after the skill revamp). |
| Rarity of every piece | 65 / 25 / 7 / 2.5 / 0.5 % (common / rare / epic / unique / legendary), the same at every tier |
| Dungeons 1-4 | keep their drops: Hollow Roots weapons, Jade Springs armour, Bonefrost Barrow rings, Blackseam pendants |
| Dungeon 5, the Sandglass | talismans |
| Dungeon 6, the Gloamvault | capes (new slot) |
| Dungeon 7, the Termite Cathedral | gloves (new slot) |
| Dungeon 8, the Cenote | shields (new slot) |
| Final boss (Pyrrhax) | drop list empty for now (it pays talismans today; those move to dungeon 5). Yuval has another idea for it. |
| Rolled lines | level 40: **1 line** (was 3), level 50: **2 lines** (new), level 60: **3 lines** (new) |
| Old level-40 pieces | keep their first line, the last two are deleted (Yuval, in the thread) |
| Rings | work only with their matching kit (section 6) |
| Pieces per clear | 1 at level 30, rising to 3-5 at level 130 (section 3) |

Equipment level of each piece, by dungeon tier (%, from the owner):

| Tier | Lv | Eq 30 | Eq 40 | Eq 50 | Eq 60 | Pieces |
|---|---|---|---|---|---|---|
| I | 30 | 100 | 0 | 0 | 0 | 1 |
| II | 40 | 50 | 50 | 0 | 0 | 1 |
| III | 50 | 25 | 50 | 25 | 0 | 1-2 |
| IV | 60 | 20 | 30 | 40 | 10 | 1-2 |
| V | 70 | 10 | 30 | 45 | 15 | 2 |
| VI | 80 | 5 | 25 | 50 | 20 | 2-3 |
| VII | 90 | 0 | 20 | 50 | 30 | 2-3 |
| VIII | 100 | 0 | 10 | 50 | 40 | 2-4 |
| IX | 110 | 0 | 5 | 45 | 50 | 3-4 |
| X | 120 | 0 | 0 | 40 | 60 | 3-4 |
| XI | 130 | 0 | 0 | 25 | 75 | 3-5 |

The "Pieces" column is my proposal (the owner gave only the ends, 1 and 3-5): a whole number drawn evenly from the range. Each piece rolls its own equipment level and rarity. Everyone in the party gets the same pieces (the all-loot rule stays).

## 2. Dungeon tiers (decoupled from zone tiers)

Today a run's level is `dgLevel(T,tier)` = theme `lv` + 10 per zone tier above the land's base, and the tier is the player's zone tier setting (`dgTierFor`, `dgUnlocked`, `DG_LANDS.base`, `shared/dungeons.js`).

New:
- `DG_TIERS` = 11 rows `{t, lv, eq:[4 weights], n:[min,max]}` (the table above), in a new file `shared/dungeon-tiers.js` (stem `dgt…`). `dgLevel(T,t)` becomes `DG_TIERS[t].lv`; theme `lv` and `DG_LANDS.base` stop mattering for the level.
- The Delve board gets a tier picker (I-XI, arrows), next to the two missions on offer. The leader picks; `dg{a:'start',tier}`.
- **Who may pick a tier** (recommendation, section 9 Q1): tier I is open once the door is open (the land gate stays: you still have to reach the land). Tier N+1 opens when you have cleared tier N **of any dungeon** (saved as `gear.dg.top`, the highest tier cleared). The whole party needs it open, and needs hiker level ≥ 25 (today's entry). No level requirement per tier: the level debuff already makes high tiers hard.
- The Hollow Roots' "+1 difficulty" lock and the Sandglass / Gloamvault entry levels (36, 38) go: every dungeon starts at tier I.
- The zone tier setting no longer touches dungeons. Where other code asks for a run's "steps above base" it is re-pointed: the skill set drop ("a won run at +1 or above", `ssDungeonClearP`) becomes "tier II or above"; the Bond Stirring is unchanged.

## 3. Monster strength from 30 to 130 (the main risk)

The world curve cannot be used as it is. `fLv(L) = L + (13/12)^L`: 41 at 30, 182 at 60, 684 at 80, 3,094 at 100, **33,173 at 130**. A level-130 monster built by `defAt` would have ~180x the health and damage of a level-60 one, plus the late creep and the level debuff. No gear closes that.

Proposal: a dungeon monster's **level** is the tier's (shown, used for XP and the level debuff on your damage), but its **stats** come from a gentle dungeon curve:
- `dgtStat(t)`: health and damage multipliers on the level-60 `defAt` numbers, calibrated so that the expected gear of that tier (section 8) clears it in about the same time and with the same danger as a tier I run with level-30 gear. First guess, to be tuned: health x1.35 and damage x1.25 per tier above IV; tiers I-IV keep `defAt` at their own level.
- The level debuff on damage you deal (`lvDmgK`, floor x0.5) stays: a level-60 hiker deals half damage from tier VI up, which is the "hardest dungeon" feeling the owner wants. The growing damage you take (+5% a level) is capped inside runs at the same 10 levels, otherwise tier XI is a one-hit kill whatever the gear.
- Bosses: the dungeon boss uses the same `dgtStat`; the boss-only creep (`BOSS_CREEP_*`, `LATE_CREEP_BOSS`) is skipped in runs.
- Calibration tool: extend `tools/boss-duel.js` with `--dungeon <theme> --tier N --gear <expected>` and a ladder over all 11 tiers; the numbers go in `docs/DUNGEON-REVAMP.md` once measured. This is step D2, before any loot work ships.

XP and coins in a run follow the tier's level with the usual `xpLeadK` limit (no kill pays for more than 10 levels above you).

## 4. Equipment levels 30 / 40 / 50 / 60

| Eq level | Id digit | Stats | Rolled lines |
|---|---|---|---|
| 30 | 7 (as today) | as today | 0 |
| 40 | 8 (as today) | as today (x1.25 on 30) | **1** |
| 50 | 9 (new) | x1.25 on 40 | 2 |
| 60 | 10 (new) | x1.25 on 50 | 3 |

- Ids keep their shape: `sword9-e+3~a57k12`, `ring10-fire-l~a57k12c90`. `dgParse`'s regex learns tiers 9 and 10 for every kind and a roll of 1-3 lines whose count **must equal** the level's (`rlParseCode` takes the count). A level-30 piece takes no roll.
- Enhancing (`ENH_MAX` by rarity, +10% a step, the Tempering Stone) is the same for every level.
- Reroll stones: weapons `rsw`, armour and **shields** `rsa`, rings, pendants, talismans, **capes and gloves** `rsr`. A reroll replaces all the piece's lines.
- Sacrifice (`RL_SAC`) works for every level 30+ piece; higher levels give more: x1 / x1.5 / x2 / x3 for eq 30 / 40 / 50 / 60 (proposal).
- Rarity of a line's range is untouched; caps (`RL_CAPS`: cdr 40%, aspd 60%, chg 100%) stay and also cover capes (section 5).
- Every new id family needs its `dgAll…` list (no shop, drop or "all items" sees them), its icon (`item-icons.js`) and its sell-back price (x3 per eq level step, as rarity).

## 5. The four kinds dungeons 5-8 pay

Each kind exists at all four equipment levels (recommendation, section 9 Q2), so the table in section 1 works for all eight dungeons. All four are accessories: one fixed bonus (scaled by rarity x enhancement x eq level) plus the rolled lines of their level.

### 5a. Talismans (the Sandglass)
The five existing kinds (attack speed, buff duration, charge gain, cooldown reduction, flat attack; `shared/talisman.js`). New: level-30 / 50 / 60 talismans (`talisman7-`, `talisman9-`, `talisman10-`); the slot opens at hiker level 30 instead of 40 (`TAL_LV`). Pyrrhax's talisman drop (`vbRewardP`, `talRarityWeights`) is removed; its drop list is empty.

### 5b. Capes, "wildcards" (the Gloamvault)
A cape is one big plus on one stat and a smaller minus on another, both from **attack %, crit rate, crit damage, charge gain, attack speed, cooldown reduction** and nothing else. 6 x 5 = 30 kinds, id `cape<d>-<plus><minus>` with one letter per stat (`cape9-ac-e+2~…` = plus attack, minus crit rate).

| Stat | Plus (common, eq 30) | Minus (fixed) |
|---|---|---|
| Attack | +12% | -6% |
| Crit rate | +6% | -3% |
| Crit damage | +0.30x | -0.15x |
| Charge gain | +25% | -12% |
| Attack speed | +10% | -5% |
| Cooldown reduction | +10% | -5% |

- The plus grows with rarity x enhancement, and x1.15 per eq level step (not the x1.25 of attack and health: a percent compounds with everything else; to be checked in D2's ladder). The **minus does not grow**, so a better cape is always a better trade. A legendary +10 level-60 attack cape: +12% x 3 x 2 x 1.52 = about +110% attack for -6% crit rate... too strong, so the legendary column of capes uses x2 instead of `RAR_MULT`'s x3 (proposal).
- The plus counts inside the existing caps (cdr 40%, aspd 60%, chg 100%, crit's own cap), so a cape cannot break them; the minus is taken after the caps, and a stat cannot go below zero from it.
- Model: the existing cosmetic cape stays the look; the stat cape has no model of its own (a slot, `eq.cape`, like the ring).

### 5c. Gloves, crits and attack (the Termite Cathedral)
Kinds (Yuval may cut or add; proposal, 8 kinds):

| Kind | Effect (common, eq 30) |
|---|---|
| `crit` Keen | +4% crit rate |
| `critdmg` Brutal | +0.20x crit damage |
| `atk` Heavy | +25 flat attack (with weapon, ring, talisman) |
| `streak` Hot Streak | each crit adds +1.5% crit rate for 4 s, up to 5 stacks |
| `first` Opener | the first hit on an enemy you have not hit yet is always a crit |
| `over` Overflow | crit rate above the cap becomes crit damage (1% -> 0.03x) |
| `echo` Echo | a crit has a 15% chance to hit again for 40% |
| `recall` Quick Hands | a crit cuts your skill cooldowns by 0.3 s (once every 1 s) |

Numbers grow with rarity x enhancement x eq level. The effects run in `rollDmgS` / `resolveHitS` (`server/combat.js`) through one hook each, marked `// dgrev:`. Slot `eq.gloves`; the cosmetic gloves stay the look.

### 5d. Shields, survival (the Cenote)
Kinds (proposal, 7):

| Kind | Effect (common, eq 30) |
|---|---|
| `hp` Bulwark | +8% health |
| `def` Ironwall | +8% defence |
| `block` Parry | 8% chance to block a hit (it does 30% of its damage) |
| `steady` Steady | 30% shorter stuns and slows on you |
| `ward` Last Ward | below 30% health, a shield of 20% max health (once every 60 s) |
| `leech` Lifeblood | heal 1.5% of damage dealt |
| `regen` Mending | +0.6% max health a second out of combat, 0.2% in it |

All of them obey the 90% total negation floor (`DMG_TAKEN_MIN`). Slot `eq.shield`, any class (it is a stat slot; the cosmetic shield in the weak hand stays a look).

## 6. Rings require their kit

Today a ring adds its flat attack whatever its element (the soul that gated it is gone). New: a ring works (flat attack **and** its rolled lines) only while the skill set you wear has the ring's element (`set.el`); a `basic` ring needs an element-less set. With no set worn (the Wanderer) only a basic ring works (proposal; section 9 Q4). The inventory shows an inactive ring greyed with "needs a <element> kit". Code: `dgRingAtkP` (`server/dungeon-gear.js`), the line sums in `server/rolls.js` (`rlSumOf` gets the wearer's set element), the details text.

## 7. Saves and migration (`gear.dgv`, run once per save in `sanitizeGear`)

- Old level-40 pieces with three lines (`…8…~xxyyzz`): keep the first line, delete the last two. Worn, in the bag, in player shops (`gear.psh`) and in mail all go through the same id rewrite.
- Old level-40 talismans stay level 40 (they get 1 line too). Pyrrhax stops paying them.
- `gear.dg.top` starts at the tier a player's highest clear would have been under the old rule (a level-50 run cleared -> tier III), so nobody loses access.
- New fields with defaults: `eq.cape`, `eq.gloves`, `eq.shield` (empty), `gear.dg.top` (0).
- `MOBS.md` / `EQUIPMENT.md` regenerate (`node tools/gen-docs.js`).

## 8. Expected gear per tier (the target D2 tunes to)

| Tier | A geared run looks like |
|---|---|
| I-II | level-30 / 40 pieces, rare +4, no cape, gloves or shield |
| III-IV | mostly eq 40-50, epic +6, two of the new slots |
| V-VII | eq 50-60, epic-unique +6..8, every slot filled |
| VIII-XI | eq 60, unique-legendary +8..10, good lines, full Awakening |

## 9. Choices for Yuval (recommendation first)

1. **Tier unlock**: clearing tier N of any dungeon opens N+1 everywhere (recommended), or per dungeon, or open from the start.
2. **Talismans, capes, gloves, shields at equipment level 30 too** so the drop table works for all eight (recommended), or only 40 / 50 / 60 with the level-30 share moved to 40.
3. **Monster stats**: the gentle dungeon curve of section 3 (recommended; level 130 is otherwise unwinnable), or the world curve.
4. **Rings without a set**: only a basic ring works (recommended), or every ring works for the Wanderer.
5. **Pieces per clear** in the middle tiers: the column in section 1 (recommended), or a straight line from 1 to 3-5.
6. **Glove and shield kinds**: the lists above are a menu; strike what you do not want.

## 10. Build order (each step merged before the next; tests in brackets)

| Step | What | Test |
|---|---|---|
| D1 | `shared/dungeon-tiers.js`: `DG_TIERS`, the board's tier picker, `gear.dg.top`, unlock rule, zone tiers unhooked | new `dungeon-tiers-smoke`, `dungeon-runs-smoke`, `dungeon-board-client-smoke` |
| D2 | Monster curve `dgtStat`, the in-run damage-taken cap, the duel ladder, numbers written here | `boss-duel --dungeon`, `dungeon-missions-smoke` |
| D3 | Eq 50 / 60 ids, 1 / 2 / 3 lines, the old-40 migration, sacrifice, the fixed rarity, the eq table and piece count in `dgWinS` | `rewards-smoke`, `rolls-smoke`, `pendants-smoke`, `server-smoke` |
| D4 | Rings need their kit | `rewards-smoke`, `skillsets-smoke` |
| D5 | Talismans at all levels from the Sandglass; Pyrrhax's list emptied | `volcano-smoke`, `rewards-smoke` |
| D6 | Capes (slot, ids, the trade, caps), the Gloamvault pays them | new `capes-smoke` |
| D7 | Gloves (slot, kinds, combat hooks), the Termite Cathedral | new `gloves-smoke`, `skills-smoke` |
| D8 | Shields (slot, kinds, hurt hooks), the Cenote | new `shields-smoke`, `server-smoke` |
| D9 | Client: inventory slots and icons, forge tabs, details text, board, the results card with several pieces; docs | `rewards-client-smoke`, `client-smoke`, `phone-layout-smoke` |
| D10 | Full suite, `npm run fuzz`, `economy-fuzz`, `gen-docs`, merge | `npm test` |

Files touched (main ones): `shared/dungeon-rewards.js`, `dungeon-items.js`, `rolls.js`, `talisman.js`, `dungeons.js`, new `shared/dungeon-tiers.js`, `capes.js`, `gloves.js`, `shields.js`; `server/dungeon-gear.js`, `rolls.js`, `players.js` (`recalcP`, `hurtP`), `combat.js`, `boss-kits-volcano.js`, `dungeons/runs.js`, `lobby.js`, `mobs.js`; `game/economy/inventory.js`, `dungeon-gear.js`, `rolls.js`, `game/dungeon/board.js`, `hud.js`, `ui/item-icons.js`; `docs/ROLLS.md`, `DUNGEON-THEMES.md` section 7, `VOLCANO.md`, `areas/dungeons.md`, `PROTOCOL.md`.
