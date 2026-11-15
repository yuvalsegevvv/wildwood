# Dungeon revamp: plan (D1, D2, D3 built)

Status: **plan, version 2, with Yuval's answers.** Built so far: **D1** (the tier ladder, section 9; see the note under it). The rest is built in the steps of section 9, and each step is merged before the next one starts.

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

Today a run's level is `dgLevel(T,tier)`: the theme's `lv` (30, 40, 45 or 48) plus `ZTIER_STEP` (10) for each zone tier above the land's base. The tier is the leader's zone tier setting (`dgTierOf` / `dgTierFor`, `dgUnlocked`, `dgGateOpen`, `DG_LANDS.base` in `shared/dungeons.js`).

New:
- `DG_TIERS` is 11 rows of `{t, lv, eq:[4 weights], n:[min,max]}` (the table above), in a new file `shared/dungeon-tiers.js` (prefix `dgt…`). `dgLevel(T,t)` becomes `DG_TIERS[t].lv`. The theme's `lv` and `DG_LANDS.base` stop deciding the level. `run.tier` stays a 0-based index (tier I = 0), so `DG_TIERS[run.tier]` is the row. Callers to change: `dgBoardP`, `dgStartP`, `dgAcceptP`, `dgDevP` (`server/dungeons/lobby.js`), the member check in `server/dungeons/runs.js` (line 30), `dgBoardRender` (`game/dungeon/board.js`, it prints `'+'+m.tier` and "Enter from level") and `game/dungeon/entrances.js` (`dgEntSealed`, the sealed toast).
- The Delve board gets a tier picker (I-XI, with arrows) beside the two missions on offer. The leader picks it, and the client sends `dg{a:'start',dungeon,type,tier}` (`dgBoardStart` in `game/dungeon/board.js`; today the message has only `dungeon` and `type`, and `dgStartP` takes the tier from `dgTierFor`). `dgStartP` clamps `tier` to an integer 0-10 and checks it against `gear.dg.top`. The `dgboard` answer (`dgBoardP`) carries `top` so the picker knows what is open.
- **Unlock**: tier I opens with the door (the land gate stays, so you still have to reach the land). Tier N+1 opens when you have cleared tier N **of any dungeon**. That is saved as `gear.dg.top`, the highest tier cleared (1-11, 0 = none; so tier index `t` is open when `t <= top`). It is written in `dgWinS` (`server/dungeons/runs.js`) for every member present and kept by `dgSanitizeSave` (same file; today it returns only `{clear,best}`, so without a line there `top` is dropped on load). Every member of the party needs the tier open and needs hiker level 25 or more (`DG_ENTRY_LV`). There is no level requirement per tier. The check is `dgUnlocked(gear,level,T,tier)`: its `gear.zt[land].max` test becomes the `gear.dg.top` test.
- The Hollow Roots' "+1 difficulty" lock goes (`DG_LANDS.home.base` 1 and its `hint`, and the `dgTierOf(g,T.land)>=L.base` test in both `dgUnlocked` and `dgGateOpen`), and so do the four entry levels: the theme field `entry` of the Sandglass (36), the Gloamvault (38), the Termite Cathedral (42) and the Cenote (45) in `shared/dungeons/themes/<id>.js`, read as `T.entry||DG_ENTRY_LV` in `dgUnlocked`. Every dungeon starts at tier I.
- The zone tier setting no longer touches dungeons. A skill set piece from a dungeon ("a won run at +1 or above", `ssDungeonClearP` in `server/skillsets.js`) now needs tier II or above. `ssDungeonClearP` hands `run.tier` to `ssClearP`, and `ssSetFor(land,tier)` (`shared/skillsets.js`) gives no set at 0 and else the land's highest set with `set.tier <= tier`. With the 0-based index this already means "tier II or above", and tier III reaches a `tier:2` set, as +2 did. Only the toast's "(+N or above)" text in `ssClearP` needs a dungeon wording. The Bond Stirring (`bdStirDungeonP`) is unchanged. Tests that pin the old rule: `skillset-sources-smoke`, `tiers-smoke`, `dungeons-smoke`.

## 3. Monster strength

Run monsters and bosses use the world's `defAt` at the tier's level, unchanged: the late creep above 60, the boss creep, and the level debuff on your damage (floor x0.5). This matches Yuval's playtest: on the test server, unique level-40 gear beats level-80 monsters without trouble. Playtesting tunes the curve later, so this plan adds no dungeon-only curve.

**Target for tier XI (level 110), kept by Yuval**: a party of four level-75 players with support, not a solo hero. The simulation (project files `dungeon-revamp/SIM-110.md`) gives a maxed solo level-75 hero about 2.6-3.7 M damage a second, and it gets the level-110 boss (1,039 M health) to about 46% before dying. In a party of four the boss has x3.6 health (`DG_PARTY.hp`), and four hitters deal x4, so the fight is about 6 minutes of damage without support, and about 4-5 minutes with a support set's buffs. Its hits are split between four players and their healer. Tiers IX-X (level 94-102) stay soloable for a maxed level-75 hero.

XP and coins follow the tier's level, with the usual limit that no kill pays for more than 10 levels above you (`xpLeadK`, `shared/balance.js`).

## 4. Equipment levels 30 / 40 / 50 / 60

| Eq level | Id digit | Stats | Rolled lines |
|---|---|---|---|
| 30 | 7 for weapons and armour, **none** for rings and pendants (`ring-fire`, `pendant-xp`), as today; new `talisman7-` | as today | 0 |
| 40 | 8 (as today) | as today (x1.25 on 30) | **1** |
| 50 | 9 (new) | x1.25 on 40 | 2 |
| 60 | 10 (new) | x1.25 on 50 | 3 |

- Ids keep their shape: `sword9-e+3~a57k12`, `ring10-fire-l~a57k12c90`. `dgParse`'s regex (`shared/dungeon-rewards.js`) learns tiers 9 and 10 for every kind, and a roll of 1 to 3 lines. Today it has `([78])`, `ring(8)?-`, `pendant(8)?-`, `talisman8-` and `(~(?:[a-m]\d\d){3})?`: the digit becomes an alternation (`7|8|9|10`, `10` is two characters), and `t` is no longer "8 or 7". The line count **must equal** the level's (`rlParseCode` is given the count), and a level-30 piece takes no roll.
- Three lines are fixed in four places in `shared/rolls.js`: `RL_LINES=3`, `RL_CODE_RE` (`{3}`), the loops of `rlRoll` and `rlParseCode`, and `rlLazyItem` (it tests `RL_CODE_RE` before it calls `dgItem`). `rlRoll` needs the count too; its caller is `rlRollP` (`server/rolls.js`), which also picks the id maker by kind and needs the new kinds and levels.
- `dgItem` branches on `q.t===8` (`t40`) for stats, names, price and `roll0`. It becomes a table by eq level (`DG_ATK` / `DG40_ATK`, `DG_HP`, `DG_DEF`, `RING_ATK` / `DG40_RING_ATK`, `PENDANT_BASE` / `PENDANT40_BASE`, `TAL_BASE`). The same `t===8` choice is in `dgEnhanceNext` (same file), `dgRaisedId` (`shared/dungeon-items.js`, behind the forge's `dgMergedId`) and the id makers `dgGearId40`, `dgRingId40`, `dgPendantId40`, `dgTalismanId`.
- Enhancing (`ENH_MAX` by rarity, +10% a step, the Tempering Stone) works the same at every level.
- Reroll stones: weapons use `rsw`. Armour and **shields** use `rsa`. Rings, pendants, talismans, **capes and gloves** use `rsr`. A reroll replaces all of a piece's lines. The tables are `RL_STONE_KIND` and `RL_KIND_K` (`shared/rolls.js`): each new kind needs a row in both, or `rlLinesOf` returns null and `rlSacrificeP` refuses the piece.
- Sacrifice (`RL_SAC`, by rarity; `rlSacrificeP` in `server/rolls.js`) works for every level-30+ piece. A higher level pays more: x1 / x1.5 / x2 / x3 for eq 30 / 40 / 50 / 60 (today the level does not count).
- A line's range is untouched (it depends on the piece's kind, `RL_KIND_K`, not on rarity). The caps (`RL_CAPS`: cdr 40%, aspd 60%, chg 100%) stay and cover capes too.
- Every new id family needs its `dgAll…` list (so no shop, drop or "all items" list sees it), an icon (`game/ui/item-icons.js`; its ghost slot icon uses fixed ids such as `ITEM['talisman8-atk']`) and a sell-back price (x3 per eq level step, like rarity; today `DG_PRICE` 30000 and `DG40_PRICE` 60000 are x2 apart). The lists are `dgAllIds`, `dgAllIds40`, `dgAllRingIds40`, `dgAllPendantIds40`, `dgAllTalismanIds` (`shared/dungeon-rewards.js`), registered in `shared/dungeon-items.js`. The player shops list kinds by name: add the new kinds to `PSHOP_KINDS` (`server/pshop.js`) and `pshKinds` (`game/economy/pshop.js`), and to `rlUiKindOk` (`game/economy/rolls.js`) and `itemStat` (`shared/items.js`).
- **A new slot** (`eq.cape`, `eq.gloves`, `eq.shield`) touches: the default `eq` of `newGearFor` (`shared/items.js`; `sanitizeGear` keeps only the keys of that default and asks `it.slot===k`, so the item record needs `slot:'cape'` and so on), `BODY_SLOTS` (`game/economy/inventory.js`) and the slot markup. `equipP` / `unequipP` (`server/economy.js`) are generic (`p.gear.eq[it.slot]=id`, level gate `p.level<it.lv`) and need no change. `rlRefreshP` (`server/rolls.js`) already walks every `eq` key. The test world's kit (`server/testworld.js`) and the PvP island (`p.pv`: every worn bonus is off) need the new kinds too.

## 5. The four kinds dungeons 5-8 pay

All four are accessories. Each has one fixed bonus, scaled by rarity x enhancement x eq level, plus the rolled lines of its level.

### 5a. Talismans (the Sandglass)
The five existing kinds: attack speed, buff duration, charge gain, cooldown reduction and flat attack (`shared/talisman.js`). New: level-30, 50 and 60 talismans (`talisman7-`, `talisman9-`, `talisman10-`). The slot opens at hiker level 30 instead of 40: the gate is the item's own `lv` (`equipP`, `talAtkP`, `rlSumOf`), so a `talisman7-` record with `lv:30` is enough; `TAL_LV` (`shared/talisman.js`) is read by no code, set it to 30 for the record. `talisman8-` is hard-coded in `dgParse` and `dgTalismanId`, and `dgItem` prices every talisman with `DG40_PRICE`. Pyrrhax's talisman drop is removed (the `dgGrantItemP` line of `vbRewardP`, `server/boss-kits-volcano.js`; keep its ending toast), with `talRarityWeights` / `talRarityOf` / `TAL_W0` / `TAL_W5` (`shared/talisman.js`) and their checks in `volcano-smoke`. His drop list is empty.

### 5b. Capes, "wildcards" (the Gloamvault)
A cape gives a big plus to one stat and a minus to another. Both stats come only from **attack %, crit rate, crit damage, charge gain, attack speed and cooldown reduction**. There are **8 combinations**, and each of the six stats is the plus of at least one:

| Id | Cape | Plus (common +0, eq 30) | Minus (+0) |
|---|---|---|---|
| `al` | Cape of the Brute | +12% attack | -5% attack speed |
| `ai` | Cape of the Reckless | +12% attack | -5% cooldown reduction |
| `la` | Cape of the Whirlwind | +10% attack speed | -6% attack |
| `gh` | Cape of the Hawk | +6% crit rate | -0.15x crit damage |
| `hg` | Cape of the Headsman | +0.30x crit damage | -3% crit rate |
| `ia` | Cape of the Sage | +10% cooldown reduction | -6% attack |
| `mi` | Cape of the Storm | +25% charge gain | -5% cooldown reduction |
| `ml` | Cape of the Tide | +25% charge gain | -5% attack speed |

- The id is `cape<d>-<combo>[-rarity][+n][~roll]`, for example `cape9-gh-e+4~a57k12`.
- **The plus** grows with rarity (`RAR_MULT`, except that a legendary cape uses x2 instead of x3) x enhancement (+10% a step) x eq level (x1.15 a step; a percent stacks with everything, so it grows more slowly than attack and health).
- **The minus grows with upgrading**: +10% of itself for each tempering step, like the plus, but rarity and eq level do not touch it. A better cape is always a better trade, while pushing it to +10 also deepens its cost (a +10 minus is x2).
- The plus counts inside the existing caps (`RL_CAPS`: cdr 40%, aspd 60%, chg 100%, summed by `rlSumOf`, which today adds only rolled lines and a talisman's `talBaseLine`; crit's own caps `CRIT_CAP` 0.6 and `CRIT_MULT_CAP` 2.5 in `shared/pendants.js`, applied in `rollDmgS`), so a cape cannot break them. Attack % goes with `rlP(p,'atk')` in `recalcP`. The minus is applied after the caps, and it never takes a stat below zero.
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

Values grow with rarity x enhancement x eq level. The effects run in `rollDmgS` (crit chance and multiplier, beside `pendP(p,'crit')` / `pendP(p,'critdmg')`; Overflow reads the sum before `Math.min(CRIT_CAP,...)`), `damageMonsterS` (it calls `rollDmgS` and knows the crit: Hot Streak, Echo) and `resolveHitS` (`server/combat.js`) through one hook line each, marked `// dgrev:`. Heavy's flat attack is added in `recalcP` beside `dgRingAtkP(p)+talAtkP(p)` (`server/players.js`). Slot `eq.gloves`, and the cosmetic gloves stay the look.

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

All of them respect the floor that a hit always does at least 10% of its damage (`DMG_TAKEN_MIN`, `shared/balance.js`). Health and defence go in `recalcP`, block / ward / the floor in `hurtP`, regen in the regen line of the player tick (all `server/players.js`), leech where `damageMonsterS` returns the damage (`server/combat.js`). Slot `eq.shield`, for any class: it is a stat slot, and the cosmetic shield in the weak hand stays a look.

## 6. Rings need their kit

Today a ring adds its flat attack whatever its element. New: a ring works (its flat attack **and** its rolled lines) only while what you wear has the ring's element:
- with a skill set worn: the set's element (`SS_SETS[id].el`, one of the six or `'basic'`). A `basic` ring needs an element-less set.
- as the Wanderer: the active path's element (`WD_PATHS[id].el`, the path from `wdPathOf(gear)`: Forager earth, Keen Eye air, Lorekeeper dark, Prism light, Stalwart fire, Tempo water). The element-less paths (Fury, Bulwark, Wayfarer) take a `basic` ring: their data files say `el:null`, but the registry stores `'basic'`, so compare with `'basic'`.

The inventory greys an inactive ring and says "needs a <element> kit or path". Code: `dgRingAtkP` (`server/dungeon-gear.js`; it only wraps `dgRingAtkOf(gear)` in `shared/dungeon-items.js`, which the client uses too), the line sums in `rlRefreshP` (`server/rolls.js`; it calls `rlSumOf(items,stat,level)` in `shared/rolls.js`, which is given the wearer's element, or `rlRefreshP` leaves the ring out of `items`), and the details text. A change of set or path must call `recalcP` again, as a gear change does (`gearChangedP`).

## 7. Saves and migration (`gear.dgv`, run once per save in `sanitizeGear`)

- Old level-40 pieces with three lines (`…8…~xxyyzz`): keep the first line and delete the last two. The same id rewrite covers worn pieces, the bag and the player shops (`gear.psh`).
- Old level-40 talismans stay level 40 and get the same rewrite.
- `gear.dg.top` starts at the tier a player's best old clear matches by level (for example, a level-50 run cleared means tier III, level 46, is cleared, so tier IV is open). Nobody loses access. The save does not hold the tier of a clear: `gear.dg.clear` counts clears per `'<theme>:<mission>'`. The nearest it can give: for each theme with a clear, the old `dgLevel` at `gear.zt[<land>].max` (the highest zone tier unlocked there), then the highest of those. Compute it before the old `dgLevel` formula goes.
- New fields with defaults: `eq.cape`, `eq.gloves`, `eq.shield` (null, in `newGearFor`'s `eq`, `shared/items.js`), `gear.dg.top` (0, in `dgSanitizeSave`) and `gear.dgv` itself.
- Where it runs: `sanitizeGear` filters `inv` with `ITEM[id]` on its first line, so a three-line level-40 id that `dgParse` no longer accepts is **dropped** there. The id rewrite must come before that filter (and before `pshopSanitize(g.psh)` and the `eq.wpn` check), on the raw `g`. `server/save-mig.js` (`smigSanitize`, hook `// savemig:`) is the pattern to copy.
- `MOBS.md` / `EQUIPMENT.md` are regenerated (`node tools/gen-docs.js`).

## 7b. The Dungeon Rewards menu

A panel, **"Delves"**, that shows clearly what every dungeon pays at every tier. It opens from three places: the Delve board (a "Rewards" tab), the teleport circle's travel window (section 7c), and a button in the inventory header beside Shops.

- **Left: the eight dungeons** as cards. Each card has the dungeon's name, land, boss portrait (`mpPic`), the kind it pays with its icon (sword / armour / ring / pendant / talisman / cape / gloves / shield), and a lock if its door is not open yet ("Reach Glasswell first").
- **Top: the tier strip** I-XI with each tier's monster level. A cleared tier gets a tick, the highest open one glows gold, and a locked one shows a padlock with "Clear tier N first".
- **Centre: the reward card** for the chosen dungeon and tier:
  - pieces per clear ("2-3 pieces"), shown as that many item tiles;
  - the equipment-level split as one stacked bar (eq 30 / 40 / 50 / 60 in four shades, the % on each part) and the rolled lines each level carries (0 / 1 / 2 / 3);
  - the rarity line, 65 / 25 / 7 / 2.5 / 0.5 %, in the rarity colours;
  - the pool: every kind the dungeon can pay (the 3 weapons, the 8 capes, the 6 gloves...: `DG_REWARDS[theme].pool`), each tile showing its fixed bonus at common +0 for the most likely eq level of that tier; a tap shows the full details card (`skInfoHtml`-style).
- **Bottom: "Compare tiers"**, a small table of all 11 tiers for the chosen dungeon (level, pieces, the eq split), so you can see at a glance where level-60 pieces start.
- Style: the panel look of the game (gold-lined frame, serif titles, `12-panels.css`), a new `styles/41-delves.css` (39 and 40 are taken) added to `src/manifest.json`; on a portrait phone the dungeon list becomes a row of icons above the card (`phone-layout-smoke`).
- Data: everything comes from `DG_TIERS` and `DG_REWARDS` (shared), so the menu never disagrees with what a clear pays. The only thing the server sends is your `gear.dg.top` and which doors are open (already in `you`).
- Files: `game/dungeon/rewards-menu.js` (`dgrm…`), markup `#dgRewards` in `index.html`, `'dgRewards'` in `PANELS` (`game/ui/panels.js`); the header button goes beside `#invShops` in `index.html`.

## 7c. Enter a dungeon from a teleport circle

The travel window (`game/ui/travel.js`: `openTravel`, `renderTravel`, it has no tabs today) gets a second tab, **"Dungeons"**, beside the villages:
- the eight dungeons, each with its kind's icon, your highest open tier, and its lock state (a dungeon whose door you have never opened is locked here too: the land gate still counts);
- a tap on a dungeon opens its Delve board right there (the same panel as at the door: the two missions on offer, the tier picker, the party, the leader's Start). "Rewards" opens the menu of 7b on that dungeon.
- Start from a circle sends the party into the run directly. When the run ends, everyone returns to the circle they left from, not to the door (`run.back` = the circle's spot; today `dgStartP` passes `back:dgApron(E)` to `dgLaunchS`, and each member's `mb.back` copies `run.back` in `server/dungeons/instances.js`).
- A "Go to the door" button warps you to the dungeon's door instead (to walk in or meet the party there).
- Server: `dg{a:'open',dungeon,via:'circle'}` and `dg{a:'start',dungeon,type,tier,via:'circle'}` (the theme id travels as `dungeon`, as in today's `start`) are accepted when the sender stands on a circle (the same check `warpP` makes in `server/players.js`: `CIRCLES.find(...)` within `tele.r+1.5`, and `from.open(p.gear)`), or when they use the map's travel-from-anywhere (`any:1`, with the same rules: not in a run `p.inst`, not on the Proving Isle `p.pv`, not on a cave floor `caveFloorAt`, and `WARP_IDLE` seconds out of a fight). Today `dgBoardP` and `dgStartP` find the door with `dgEntranceNear(p.x,p.z)` and refuse without one: `via` replaces only that test. Every other check of the door (gate, tier, party, levels) is unchanged. The party's other members are asked as today (`dgi`), wherever they stand.
- Files: `game/ui/travel.js` (the tab), `game/dungeon/board.js` (opened without a door), `server/dungeons/lobby.js` (`via`), `docs/PROTOCOL.md`.

## 8. Not in this plan

- Pyrrhax's new drop (Yuval has an idea, later).
- A dungeon-only monster curve. Playtesting decides whether one is needed.
- Models for the stat cape, gloves and shield: the cosmetics stay the look.

## 9. Build order (each step merged before the next; tests in brackets)

| Step | What | Test |
|---|---|---|
| D1 **(built)** | `shared/dungeon-tiers.js`: `DG_TIERS`, run level = tier level, the board's tier picker, `gear.dg.top`, the unlock rule, zone tiers unhooked, the old entry locks removed | new `dungeon-tiers-smoke`, `dungeon-runs-smoke`, `dungeon-board-client-smoke`, `dungeons-smoke`, `tiers-smoke`, `skillset-sources-smoke`, `entrances-client-smoke`, the four `<name>-dungeon-smoke` |
| D2 **(built)** | Eq 50 / 60 ids, 1 / 2 / 3 lines, the old level-40 migration, sacrifice, the fixed rarity, the eq table and piece count in `dgWinS` (it calls `dgClearReward(theme,rnd,steps)` once and grants the one id with `dgGrantItemP`; the fixed rarity replaces `DG_REWARD_W` 70 / 25 / 4 / 0.8 / 0.2 and the per-step luck `DG_REWARD_LUCK` / `dgRewardWeights`) | `rewards-smoke`, `rolls-smoke`, `rolls-client-smoke`, `pendants-smoke`, `server-smoke`, the four `<name>-dungeon-smoke` (`sandglass`, `gloamvault`, `termite`, `cenote`: they pin `DG_REWARDS`) |
| D3 **(built)** | Rings need their kit or path | `rewards-smoke`, `skillsets-smoke`, `bond-smoke`, `testworld-smoke` (its kit wears a plain ring) |
| D4 (built) | Talismans at all levels from the Sandglass; Pyrrhax's list emptied; the slot at 30 | `volcano-smoke`, `rewards-smoke`, `sandglass-dungeon-smoke`, `testworld-smoke` |
| D5 **(built)** | Capes: slot, the 8 combos, plus and minus growth, caps; the Gloamvault pays them | new `capes-smoke` |
| D6 **(built)** | Gloves: slot, the 6 kinds, combat hooks; the Termite Cathedral | new `gloves-smoke`, `skills-smoke` |
| D7 **(built)** | Shields: slot, the 7 kinds, hurt hooks; the Cenote | new `shields-smoke`, `server-smoke` |
| D8 **(built)** | Client: inventory slots and icons, forge tabs, details text, the board, a results card with several pieces; the docs | `rewards-client-smoke`, `client-smoke`, `phone-layout-smoke` |
| D8b | The Delves rewards menu (7b) | new `dungeon-rewards-menu-smoke`, `phone-layout-smoke` |
| D8c | Dungeons from the teleport circle (7c) | `dungeon-runs-smoke`, `dungeon-board-client-smoke`, `client-smoke` |
| D9 | Full suite (every new `tools/*-smoke.js` needs its row in `tools/tests.json`, and every new source file its line in `src/manifest.json` and `python3 build.py --write-index`, or `build.py --check` fails), `npm run fuzz`, `economy-fuzz`, `world-soak`, `gen-docs`, merge | `npm test` |

The main files touched: `shared/dungeon-rewards.js`, `dungeon-items.js`, `rolls.js`, `talisman.js`, `dungeons.js`, and new `shared/dungeon-tiers.js`, `capes.js`, `gloves.js`, `shields.js`; `server/dungeon-gear.js`, `rolls.js`, `players.js` (`sanitizeGear`, `recalcP`, `hurtP`), `combat.js`, `skillsets.js`, `pshop.js`, `testworld.js`, `boss-kits-volcano.js`, `dungeons/runs.js`, `lobby.js`, `instances.js`; `shared/items.js` (`newGearFor`), `shared/dungeons/themes/*.js` (`entry`); `game/economy/inventory.js`, `dungeon-gear.js`, `rolls.js`, `game/dungeon/board.js`, `hud.js`, `ui/item-icons.js`; and the docs `ROLLS.md`, `DUNGEON-THEMES.md` section 7, `VOLCANO.md`, `areas/dungeons.md`, `PROTOCOL.md`.

### D1 as built (decisions)

- `gear.dg.top` = number of tiers cleared in a row, 0 = none, max 11; tier index `t` is open when `t <= top` (plan section 2). Written in `dgWinS` (`top = max(top, run.tier+1)`, not for the testing runs); `dgSanitizeSave(g, rawGear)` keeps it (0-11) and migrates an old save once (a save with no `top`): for each theme with a clear, the retired level `theme.lv + 10 * max(0, zt[land].max - base)` (Wildwood's base was 1) via `dgtOldLevel`, the highest of those, then `top` = the number of `DG_TIERS` rows with `lv <=` it (a level-50 clear = tier III cleared = `top` 3, tier IV open).
- `dgLevel(T,t)` = `DG_TIERS[t].lv`. `dgUnlocked(gear,level,T,tier)`: tier default 0; checks tier range, `dgtOpen`, the land gate, hiker level `DG_ENTRY_LV` (25). `dgGateOpen` is only the land gate. `DG_LANDS.base`, `dgTierOf`, `dgTierFor` and the theme field `entry` are removed. Ground rules: hooks marked `// dgrev:`.
- Protocol: `dg{a:'start',dungeon,type,tier}` (tier clamped 0-10, refused with a toast when not open for the leader; every member is checked again when asked to follow); `dgboard` carries `tier` (the highest open one, the picker's starting point) and `top`, and `L` is tier I's level. The testing tool is `dev{cmd:'dg',v:'<theme>:<mission>[:seed[:tier]]'}` (tier 0-10, ignores the unlock).
- `D2` still reads `DG_TIERS[t].eq` / `.n`; until then `dgClearReward` gets `min(5, run.tier)` as its luck steps. Boss levels follow `run.L` (`dgAdoptS`), the monster strength is unchanged (section 3).
- `ssDungeonClearP` is unchanged: it passes `run.tier`, so a skill set piece needs tier II or above; its toast text still says "+N" (not reworded in D1).

### D2 as built (decisions)

- **Levels**: `dgParse` takes the level digit `7 | 8 | 9 | 10` (`t` of the record; `dgEqLv(t)` = 30 / 40 / 50 / 60, `dgEqK(t)` = 1.25 per step above 40) for weapons, armour, rings and pendants. Talismans stay `talisman8-` only (D4). Level 50 / 60 names get a ` Lv50` / ` Lv60` suffix; sell-back price x3 per step above 40; `tier` (look) stays the level-40 one. One id maker per kind with an optional last parameter `t` (`dgGearId40(slot,r,n,roll,t)`, `dgRingId40`, `dgPendantId40`), `dgIdOfQ(q,r,n,roll)` and `dgPieceId(kind,pick,t,r,n)` replace the `t===8` branches (`dgEnhanceNext`, `dgRaisedId`, `rlRollP`). `dgAllIds40(t)`, `dgAllRingIds40(t)`, `dgAllPendantIds40(t)` take the digit (default 8); `dungeon-items.js` registers 8, 9 and 10.
- **Lines**: `rlLinesFor(t)` = 0 / 1 / 2 / 3. `rlRoll(rnd,n)`, `rlParseCode(code,n)`, `rlLinesOf(code,kind,n)` take the count; `dgParse` refuses a code whose count differs from its level's. `RL_LINES` became `RL_LINES_MAX`; `RL_CODE_RE` takes 1-3 lines. A reroll builds the id with the piece's own count.
- **Sacrifice**: `rlSacFor(it)` = `RL_SAC[rar]` x `RL_SAC_LV` (1 / 1.5 / 2 / 3), rounded (a common level-40 piece pays 2).
- **Migration** (`gear.dgv` = 1, `dgvMigrate` in `server/dungeon-gear.js`, called first in `sanitizeGear`, before `inv` is filtered through `ITEM`): walks the whole raw save and cuts every id that ends in a three-line code to its first line (bag, worn, carried weapons, `gear.psh`). A save that already has `dgv` is never walked again (a level-60 piece has three lines).
- **Clears**: `DG_REWARD_W` = 650 / 250 / 70 / 25 / 5; `DG_REWARD_LUCK` and `dgRewardWeights` are gone; `dgClearReward(theme,rnd,eq)` makes one piece (eq index 0-3, default the theme's `t`), `dgClearRewards(theme,rnd,tier)` the whole clear; `dgWinS` grants every piece to every member present (`dgGrantItemP`, a full bag loses the piece with a toast). The results card already lists several ids (`dge` carries the last 40), so the client is unchanged. Dungeons 5-8 pay their current kinds at the rolled level.
- Not done (later steps): talisman levels (D4, now built), capes / gloves / shields.

### D4 as built (decisions)

- `dgParse` takes `talisman(7|8|9|10)-<kind>`; `dgTalismanId(stat,r,n,roll,t)` (t default 8, so every old `talisman8-` id and call is unchanged), `dgAllTalismanIds(t)`, `dgPieceId('talisman',stat,t,r,n)`; `dungeon-items.js` registers 7-10 (175 each). Value = `TAL_BASE` x `dgEqK(t)` (level 30: / 1.25, so atk is 24 / 30 / 37.5 / 46.9); price x3 per step above 40; name suffix ` Lv50` / ` Lv60`; look tier stays 40's. Lines 0 / 1 / 2 / 3 as every kind.
- `DG_REWARDS.sandglass` = `{kind:'talisman',pool:TAL_STATS,t:8}`: one of the five kinds, the rolled level, unrolled. The slot's gate is the item's own `lv` (a level-30 talisman is wearable from 30); `TAL_LV` was read by nothing and is deleted.
- Pyrrhax: `vbRewardP` keeps the ending toast only; `talRarityWeights` / `talRarityOf` / `TAL_W0` / `TAL_W5` are deleted. Rerolls and sacrifice are unchanged (`gear.rsr`, per level as D2). Tests: `rolls-smoke` (levels, values, old ids), `sandglass-dungeon-smoke`, `volcano-smoke`.

### D5 as built (decisions)

- `shared/capes.js` (`CAPE_COMBOS`, `capeVals`, `capeText`, `capeNet`). **The id letters follow the rolled-stat letters** (`RL_STATS`: a atk, g crit, h critdmg, i cdr, l aspd, m chg), so the plan's `as` / `sa` / `ms` are `al` / `la` / `ml` (table above fixed). Ids `cape<7|8|9|10>-<combo>[-rarity][+n][~roll]` (`dgCapeId`, `dgAllCapeIds(t)` = 280 a level, `dgParse` returns `combo`); records have `kind:'cape'`, `slot:'cape'`, `plus` / `minus` `{stat,v}`, lines 0 / 1 / 2 / 3, price like a talisman. `RL_STONE_KIND` / `RL_KIND_K` have a `cape` row (stone `rsr`).
- Values: plus = base x rarity (`RAR_MULT`, legendary x2) x (1 + 0.1 n) x 1.15^(level step above 30); minus = base x (1 + 0.1 n).
- Server: `rlSumOf` adds a cape's plus beside the lines (inside `RL_CAPS`; crit and crit damage go through `rlP('crit' / 'critdmg')`, so `CRIT_CAP` / `CRIT_MULT_CAP` in `rollDmgS` still cap them; attack % is `rlP('atk')` in `recalcP`). The minus (`rlMinusOf`) is taken off in `rlRefreshP` after the caps with `capeNet(sum,minus)`: **a real cost**, the bonus total may go negative (`p.rl[stat]<0`), so -5% attack speed makes a bare hero x0.95. The resulting stat is floored at its consumer: attack speed and charge gain x0.5 (`bhSpeedK` / `bhChargeK`), attack x0.5 (`recalcP`, `CAPE_FLOOR_K`), the cooldown rate x0.5 (`abilityCd`'s clamp at -1: cooldowns at most doubled), crit chance 0 and crit multiplier 1.0 (`rollDmgS`). A cape above your level counts for nothing; the Proving Isle ignores it like every rolled line. Hooks marked `// dgrev:`.
- Client minimum: `BODY_SLOTS` + the doll's grid area `cape`, `capeIconArt`, details / tempering text, `rlUiSum` mirrors the minus, `rlUiKindOk` and `pshKinds` list capes (`PSHOP_KINDS` too). Forge tabs and full polish stay D8. The test world's kit holds all eight and wears the Headsman.
- `gloamvault` pays capes (the tests of D2 / D3 were updated: `dungeons-smoke`, `rolls-smoke`, `gloamvault-dungeon-smoke`); `tools/capes-smoke.js` is new.

### D6 as built (decisions)

- `shared/gloves.js` (`GLV_KINDS`, `glvVal`, `glvText`). Ids `gloves<7|8|9|10>-<crit|critdmg|atk|streak|over|echo>[-rarity][+n][~roll]` (`dgGlovesId`, `dgAllGlovesIds(t)` = 210 a level, `dgParse` returns `stat` = the kind); records `kind:'gloves'`, `slot:'gloves'`, `stat`, `v`, lines 0 / 1 / 2 / 3, price like a talisman. `RL_STONE_KIND` / `RL_KIND_K` have a `gloves` row (stone `rsr`). The test world's kit holds all six and wears Keen.
- `v` = base (0.04, 0.20, 25, 0.015, 0.03, 0.40) x `RAR_MULT` (a legendary x3, no cape exception) x (1 + 0.1 n) x 1.15^(level step above 30). Echo's chance is the constant `GLV_ECHO_CHANCE` (15%); Hot Streak's `v` is the crit chance of one stack.
- Server (`server/dungeon-gear.js`, hooks marked `// dgrev:`): `rollDmgS` builds the raw crit chance `cr0` (with `glvP(p,'crit')` and `glvStreakP`), caps it at `CRIT_CAP`, and adds `glvP(p,'critdmg')` and `glvOverP(p,cr0)` (`(cr0 - CRIT_CAP) x 100 x v`, only above the cap) to the multiplier before `CRIT_MULT_CAP`; `recalcP` adds `glvAtkP` beside the talisman's flat attack; `damageMonsterS` calls `glvHitS` after a crit's event: Hot Streak (`p.glvS`, one expiry time per stack, 4 s, at most 5, not saved, cleared on death and gone with the player) and Echo (15%: a second hit of `v` x the crit's damage straight off the monster's health; it is no roll, so it cannot crit, echo or stack). Nothing counts on the Proving Isle (`p.pv`, like the pendant) and a glove above your level counts for nothing. The hit on another fighter (`pvpHitS`) never reaches `damageMonsterS`.
- Client minimum: `BODY_SLOTS` + the doll's grid area `gloves` (left of the feet), `glovesIconArt`, details / tempering text, `rlUiKindOk` and `pshKinds` (`PSHOP_KINDS`) list gloves. Forge tabs and polish stay D8.
- `termitecathedral` pays gloves (`dungeons-smoke`, `termite-dungeon-smoke` updated); `tools/gloves-smoke.js` is new.

### D7 as built (decisions)

- `shared/shields.js` (`SHD_KINDS`, `shdVal`, `shdText`; the prefix is `shd` / `SHD_` because "shield" already means a skill's absorb pool and the cosmetic shield). Ids `shield<7|8|9|10>-<hp|def|block|steady|ward|leech|regen>[-rarity][+n][~roll]` (`dgShieldId`, `dgAllShieldIds(t)` = 245 a level, `dgParse` returns `stat` = the kind); records `kind:'shield'`, `slot:'shield'`, `stat`, `v`, lines 0 / 1 / 2 / 3, price like a talisman. `RL_STONE_KIND.shield` = `rsa` (the Armor Reroll Stone, sacrifice pays armour stones), `RL_KIND_K.shield` = armour's weights. The test world's kit holds all seven and wears Bulwark.
- `v` = base (0.08, 0.08, 0.08, 0.30, 0.20, 0.015, 0.006) x `RAR_MULT` (a legendary x3) x (1 + 0.1 n) x 1.15^(level step above 30). Caps at the consumers: block chance 50%, Steady 75% (a stun is never shorter than a quarter), Last Ward 60% of max health. Block's 30% let-through, the ward's 30% threshold and 60 s cooldown (and its 8 s duration) never grow.
- Server (`server/dungeon-gear.js`, hooks marked `// dgrev D7`): health % and defence % in `recalcP` (`shdP`, after the rolled lines, then `defRed` again); **Parry sits inside the `DMG_TAKEN_MIN` floor** in `hurtP`'s multiplier (`Math.max(DMG_TAKEN_MIN, shdBlockK(p) * ...)`), so armour, buffs and a block together still leave a hit at least 10%; Last Ward (`shdWardS`, after the hit, alive and below 30%) raises the existing skill shield `p.shield` through `ssShieldS` (the larger pool wins; `p.shdWardT` is the cooldown, not saved); Steady shortens a `root` or `slow` in `pfxS` (`boss-fx.js`; a knock-back is not shortened); Lifeblood (`shdLeechS`) heals a share of `damageMonsterS`'s damage; Mending (`shdRegenP`, in `updatePlayersS`) adds to the ordinary regen, out of combat (3 s since the last hit taken or dealt) at v, in combat at a third of v. Nothing counts on the Proving Isle (`p.pv`) and a shield above your level counts for nothing.
- Client minimum: `BODY_SLOTS` + the doll's grid area `shield` (left of the legs), `shieldIconArt`, details / tempering text, `rlUiKindOk` and `pshKinds` (`PSHOP_KINDS`) list shields. Forge tabs and polish stay D8.
- `cenote` pays shields (`dungeons-smoke`, `cenote-dungeon-smoke` updated); `tools/shields-smoke.js` is new.

### D3 as built (decisions)

- One decider: `bdMainOf(p)` (`server/bond.js`: the character played). `dgKitEl(gear,main)` (`shared/dungeon-items.js`) turns it into an element: `SS_SETS[main].el`, or as the Wanderer `WD_PATHS[wdPathOf(gear)].el`; both registries store `'basic'` for no element, so a basic ring matches an element-less set or path (fury, bulwark, wayfarer). `dgRingOn(ring,kitEl)` compares it with the ring's `el`; `dgRingAtkOf(gear,kitEl)` returns 0 when it differs. Levels 30, 40, 50 and 60 all follow the rule.
- Server: `dgKitElP(p)` and `dgRingAtkP` (`server/dungeon-gear.js`); `recalcP` now adds the ring's attack after `bdRefreshP` (it used to sit with the weapon's, before the Bond step) and `rlRefreshP` leaves an inactive ring out of its sums. Every way to change set or path (`bdPlayP`, `wdPathP`, `equipSkillP`, `unequipSkillP`, `ssEquipAllP`, a ring swap) already ends in `recalcP`, so nothing else was needed. Proving Isle: unchanged (`pvpRecalcP`; rolled lines already count for nothing there).
- Client: `dgRingUiOn(it)` (`game/economy/dungeon-gear.js`) reads `GEAR.skills.bdx.main` (unknown = active); an inactive worn ring's slot is greyed (`inventory.js`), its details line says "inactive: Needs a <element> kit or path" (`dgRingNeedText`), and `rlUiSum` skips it. Tests: `rewards-smoke` (set match / mismatch, basic ring with an element-less set, Wanderer paths incl. element-less).

### D8 as built (decisions)

- Inventory: the doll's 14 slots were already a 3 x 5 grid with labels and ghost icons (`slotIcon`); a worn piece above your level already shows the red locked tile (not greyed: `client-smoke` pins the slot's style). Item details: `dgStatHtml` shows a cape's plus in green and minus in red; `dgInfoTail` adds "Inactive: needs level N" for rings, pendants, talismans, capes, gloves and shields above your level (the ring-kit reason stays).
- Forge: the Temper, Roll and Sacrifice rows show `Lv N`, the stat (`dgStatHtml`) and the stone count (Tempering Stones / Weapon / Armor / Accessory); the intro texts and the stone chip tooltips name every kind (shields use Armor stones, capes and gloves Accessory stones) and levels 30-60.
- The Delve board's tier picker says the gear levels and piece count of the picked tier (`DG_TIERS[t].eq` / `.n`) and wraps on a phone (`.dgb-tier`). The results card lists each piece with its icon, rarity border, name and level (`dgResultShow`, `.dgr-it`). Player shop rows carry the bonus text as a hover / long-press title.
- Not checked with a real browser screenshot; headless tests only.
