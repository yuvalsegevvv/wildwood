# The Abyss

A solo roguelike mode: one hiker, one life, rounds of small tiles with choices between them, artifacts that live for the run, paid only in Abyssal Shards. Plan, numbers and decisions: the project's `abyss-plan/PLAN.md` (version 5). Stem `abyss`, prefix `ab` / `AB_`.

**Status: B0-B9 built, behind `AB_ON`** (false until step B12). The server asks `abOnS()` = `AB_ON || io.test || S.dev`, so the test world and dev servers have it, the deploy (`--no-dev`) does not. Built so far: the slot split, the rules tables, the save `gear.ab`, the window message, and (B2) the server run with Fight rounds only: three waves of the Shardmere's glass kinds at the round's level with plain numbers (no `RIFT_HP_K` / `RIFT_DMG_K`), `go` / `next` / `out`, death and leaving end the run, no XP, coins or loot from Abyss kills. B3 (the client shell): the flag reaches the client as `welcome.ab`, the gate stands in Glasswell, the window lists the six difficulties, the `abr` banner, the `abw` event and the between-rounds bar (Next round / Leave); the HUD row `DG_HUD.abyss` and the void look were already there. B4-B5 (artifacts): the registry, twelve stat artifacts, the run's bar in the save, `abP`, an offer after every won round, pick / skip / drop, and the client's pick screen, bar and discard dialog. B6: ten combat artifacts, eight wildcards, ten curses (the engine, a dev way to give one) and the balance yardstick `tools/abyss-sim.js`, sections 3c-3e. B7: the tiles (section 3f): every Fight round is a land patch or cave chunk floating in the rift's void, and the next tile is chosen from three. Still none: bosses, shards, Elite / Trial / Event / Shrine rounds (B8-B9), the Events that hand out curses (B8). B8 (round kinds, section 3g): the offer's cards have kinds (Fight, Elite, Trial, Event, Shrine; Boss comes in B9), an Elite and a Trial pay 2 picks, a Trial plays one of the seven rift modes, Events (8) and Shrines are cards with no fight.

## 1. Files

| File | What it holds |
|---|---|
| `shared/abyss.js` | `AB_ON` / `abSwitch`, `AB_DIFFS` (I-V and Infinite), `abRoundLv`, `abRounds`, `abBossRounds`, `abIsBossRound`, the caps |
| `server/abyss.js` | `abSanitize` (`gear.ab`, with `abRunSanitize` for `run`, `arts`, `curses`, `offer`), `abOnS`, `MSG.abyss` (`open`, `go`, `next`, `out`, `pick`, `skip`, `drop`) |
| `shared/dungeon-slots.js` | `DG_MAX_INST` 48 and `AB_SLOT0` 32: slots 0-15 dungeons, 16-31 rifts, 32-47 the Abyss |
| `server/abyss/rounds.js` | the run: `abRunNewS`, `abGoP` / `abNextP` / `abOutP`, `abSpawnS`, `abWaveStepS`, `abRoundWonS`, `DG_KITS.abyss`, the fall and leave rules, `abDevP` |
| `game/abyss/abyss.js` | (B3) the gate (`abBuildGate`, a black-violet tear at the Guildhall's door, `VIL5.anchors['place:guild']`), the talk key (`abHere` / `abPrompt` / `abOpenNear`), the window (`#abyss`), `EVH.abr`, `EVH.abw`, the bar `#abBar`, `abUpdate(dt)` |
| `shared/abyss/artifacts-stat.js` | (B4) the twelve stat artifacts, one `defineAbArt` row each (the registry `AB_ARTS` / `AB_ART_BAD`, `abArtStat` and the caps are in `shared/abyss.js`) |
| `server/abyss/arts.js` | (B4) `abP(p,stat)`, the offer after a won round (`abOfferP`, stored in `gear.ab.run.offer` before `abo` is sent), `abPickP` / `abSkipP` / `abDropP` |
| `game/abyss/choice.js` | (B5) the pick screen (`#abPick`), the artifact bar (`#abArts`), the discard dialog (`#abDrop`), `EVH.abo`, `EVH.aba` |
| `styles/42-abyss.css` | the window, the bar, the pick screen, the artifact bar and the discard dialog |
| `shared/abyss/artifacts-combat.js`, `artifacts-wild.js`, `curses.js` | (B6) ten combat rows, eight wildcards (with their `minus` text), ten curses (`defineAbCurse`) |
| `server/abyss/combat.js` | (B6) the rules: `abHitS` (every 5th hit, boss, execute), `abKillP`, `abThornsS`, `abLastS` (Last Breath), `abShieldS`, `abCurseKS` / `abCurseAddP`, `abGiveArtP` (dev) |
| `shared/abyss/tiles.js` | (B7) `defineAbTile`, `AB_TILES` / `AB_TILE_IDS` / `AB_TILE_BAD`, `abTileOf`, `abTileLayout` (the island), the 14 rows |
| `server/abyss/tiles.js` | (B7) the next-tile offer: `abDrawTilesS`, `abRandTileS`, `abTileOfferP`, `abTilePickP` |
| `game/abyss/view.js` | (B7) `abTileViewBuild` (the island, props, tears, rift sky), `abTileLookTune`, `AB_PROP_DRAW` |
| `shared/abyss/events.js` | (B8) eight Events, one `defineAbEvent` row each (the registry `AB_EVENTS` / `AB_EVENT_BAD`, the kinds `AB_KIND_*`, `AB_TRIAL_MODES`, `abEncWindow` are in `shared/abyss.js`) |
| `server/abyss/events.js` | (B8) Event and Shrine rounds: `abEncounterS`, `abEventPickP`, `abShrinePickP`, `abShrineOfferS`, `abEventFlagsP` |
| `server/abyss/trial.js` | (B8) Trial rounds: `abTrialDefS`, the kit delegates, `abTrialSpawnS`, `abTrialWonS`, `RIFT_PAY.abyss` |
| `game/abyss/encounter.js` | (B8) the Event and Shrine cards on the pick screen, `abKindChip` (a tile card's colour, name and line) |
| `shared/abyss/boss.js` | (B9) the pool `AB_BOSS_ALL` (24), the whitelist `AB_BOSS_OK` / `AB_BOSS_OUT`, each boss's land look `AB_BOSS_LAND`, `abBossOk`, `abBossRowOf`, `abBossTileOf` |
| `server/abyss/boss.js` | (B9) `abBossDrawS`, `abBossS` (the run's boss, `dgBossS`'s way), `abBossSetupS` / `abBossTickS` (the disc keeper), `abBossDownS` (the `bossDefeatedS` hook) |
| `shared/abyss/shop.js` | (B10) `abShardsOf(d,r,kind)`, `abClearBonus(d)`, `AB_SHOP` rows (`abShopRow`), `abShopPrice`, `AB_SPECIAL_GROWTH`, `AB_ROUND_S` (a rough round time) |
| `server/abyss/pay.js` | (B10) `abPayRoundP` (shards when a round is won), `abShopP` / `abBuyP`, `abGiveS`, `abDayS` (the UTC day) |
| `game/abyss/shop.js` | (B10) the Shop tab of the Abyss window (`abTabsAdd`, `abShopRender`), `EVH.abs`; the balance also shows in the inventory header (`#invShards`) |
| `tools/abyss-sim.js` | (B6) the balance yardstick (section 3e); `--check` is the test row `abyss-sim` |
| `tools/abyss-smoke.js` | the test (server side); the client side is the Abyss case of `tools/client-smoke.js` |

## 2. Numbers (`shared/abyss.js`)

| Name | Value |
|---|---|
| `AB_DIFFS` | I 40-60 in 7 rounds, II 50-80 in 10, III 60-100 in 13, IV 70-120 in 16, V 80-140 in 19, Infinite from 90 with no end |
| `abRoundLv(d,r)` | `lo + round((r-1)*10/3)`: I gives 40, 43, 47, 50, 53, 57, 60; V reaches 140 at round 19; Infinite 180 at round 28 |
| boss rounds | 7, 13, 19... (every 6 from 7) and the last round of a finite difficulty (I [7], II [7,10], III [7,13], IV [7,13,16], V [7,13,19]) |
| `AB_ART_MAX`, `AB_RANK_MAX`, `AB_CURSE_MAX` | 20 artifacts at once, 5 copies (ranks), 5 curses |
| `AB_ENTRY_LV` | 40 |
| `AB_AS_MAX`, `AB_LOCK_MAX`, `AB_PRISM_MAX`, `AB_HEART_MAX` | 999,999,999 shards, 9,999 Void Anchors, Ascendant Prisms and Abyss Hearts (save caps; the Heart is `gear.awm.abyss`, capped by `awkSanitize`) |

Save: `gear.ab = {top (0-5), best, clears:[6], as, lock, sh:{d,n:{id:count}}, run:null}`, rebuilt field by field by `abSanitize`; shop ids in `sh.n` are only checked against the shop's rows from B10 (for now: own keys, no prototype names, counts 1-9999, at most 64).

## 3. Hooks (`// abyss:`)

| Place | What |
|---|---|
| `server/players.js` `sanitizeGear` | `abSanitize(g,out)` beside `riftSanitize` |
| `shared/rolls.js`, `shared/dungeon-rewards.js` (`dgParse`, `dgItem`), `server/rolls.js` `rlRollP`, `game/economy/rolls.js` | B11: the roll code's `!` / `*` markers (`RL_CODE_RE`, `rlParseFull`, `rlRoll(rnd,n,keep,g)`, a reroll keeps both, the Roll tab's badge, lock icon and buttons) |
| `server/abyss.js` `abMsgP` | B11: `case 'prism'` / `'lock'` -> `abItemP` (`server/abyss/items.js`) |
| `server/rift.js` `riftDefOf(run)` | the one read of a run's rift def (replaces the 14 `RIFT_DEFS[run.rift]` reads), so an Abyss run can supply its own (B2) |

| `server/dungeons/runs.js` `dgSetupS` | no puzzle stones in an Abyss run (`!run.ab`) |
| `server/dungeons/runs.js` `dgDownTickS` | `abDownTickS`: a fall ends the run after `AB_DEATH_S` |
| `server/dungeons/runs.js` `dgCloseS` | `abCloseS`: whoever is online has no run in the save (the empty close of a pulled plug ends here) |
| `server/dungeons/lobby.js` `dgLeaveP` | `abLeaveP`: between rounds it is "out", in a fight a fall |
| `server/dungeons/mobs.js` `rewardAllS` | an Abyss run pays no world rewards |
| `server/economy.js` `devP` | `abyss`: `v` = top difficulty open, `r` = jump to round r of the run you are in (`abDevP`) |
| `server/abyss/rounds.js` `abRoundWonS` | `abPayRoundP(p,run,last)`: the round's Abyssal Shards (B10) |
| `server/awakening.js` `AWK_STORE_IDS` | `'abyss'`: `gear.awm.abyss`, the Abyss Heart, is sanitized like Echo Shards (B10) |
| `server/api.js` welcome | `ab:1` when `abOnS()`: the client's one flag field (`NET.ab`, `game/net/client.js` `onWelcome`) |
| `server/abyss/rounds.js` `abRoundWonS` | `abw` event for a won round that is not the last of a finite difficulty |
| `server/combat.js` `rollDmgS` | `abP(p,'atk')` multiplies the hit, `abP(p,'crit')` adds crit chance |
| `server/combat.js` cooldown line (`p.cd[k]=`) | `abP(p,'cdr')` beside `rlP(p,'cdr')` |
| `server/combat.js` `damageMonsterS` | lifesteal: `healP(p, damage x abP(p,'lifesteal'))` |
| `server/players.js` `hurtP` | `abP(p,'def')` inside the 10% floor of the damage taken |
| `server/players.js` `recalcP` | `abP(p,'hp')` multiplies the maximum health (recalcP runs when the bar or the run changes) |
| `server/players.js` `healP` | healing x `abP(p,'heal')` |
| `server/basic-hold.js` `bhSpeedP` | `abP(p,'aspd')` beside `rlP(p,'aspd')` |
| `server/abyss/rounds.js` `abRoundWonS`, `abNextP` | `abOfferP` after a won round; `next` refused while an offer is pending |
| `server/combat.js` `damageMonsterS` | (B6) `abHitS`: every 5th hit, boss and execute damage of the bar |
| `server/combat.js` `killMonsterS` | (B6) `abKillP`: kills heal |
| `server/players.js` `hurtP` | (B6) `abThornsS` after a monster's hit; `abLastS` when the hit would kill (Last Breath); and `abP(p,'def')` now multiplies AFTER the 10% floor (see 3e) |
| `server/abyss/rounds.js` `abStartRoundS`, `abSpawnS`, `abDevP` | (B6) the curses' monster factors (`run.abCK`) and the round-start shield; `devP abyss` `art` / `curse` |
| `game/village/talking.js` | the talk key and its prompt (`abHere`, two lines) |
| `server/dungeons/instances.js` `dgInfoS` | (B7) `tile:run.abTile`: the tp tells the client which tile a round is on |
| `game/dungeon/view.js` `dgViewBuild` | (B7) `if(R.tile) return abTileViewBuild(R)` before the rift's branch |
| `game/dungeon/look.js` `dgLookEnter` | (B7) `abTileLookTune(L,R)` after `riftLookTune` |
| `server/rift.js` `riftDefOf(run)` | (B8) `run.rdef||RIFT_DEFS[run.rift]`: a Trial's rift def |
| `server/rift.js` `riftSpawnS` | (B8) `if(run.ab) abTrialSpawnS(...)`: a Trial's monsters have the plain numbers of the round (no `RIFT_HP_K` / `RIFT_DMG_K`), the curses' factors, the Herald's health halved |
| `server/rift.js` `riftWonS` | (B8) `if(run.ab) return abTrialWonS(run)`: a Trial's win ends the round, not a rift run (no `gear.rift`, no XP, no `dge`) |
| `server/abyss/arts.js` `abPickP`, `abSkipP` | (B8) an Event / Shrine offer goes to `abEventPickP` / `abShrinePickP`; every resolved pick ends in `abAfterPickP` (the round's second pick, else the tiles) |
| `server/boss.js` `bossDefeatedS` | (B9) `if(m.abBoss){ abBossDownS(m); return; }`: a run's boss toasts only the hiker and clears its adds and fx |
| `game/main/loop.js` | `abUpdate(dt)` |
| `game/ui/panels.js` | `'abyss'` in `PANELS` |
| `game/dungeon/run.js` `dgRunEnter` | the client rebuilds an Abyss run's theme and layout (`abLayout(tile,seed)`, `shared/abyss.js`; `DG_RUN.tile`) |

`RIFT_SLOT_END` (32, `server/rift.js`) ends the rifts' slot scan; `rift-smoke` checks a rift never takes slot 32 or above.

## 3b. Artifacts (B4-B5)

A run's bar is `gear.ab.run.arts` (ids, at most 20, a repeat id again, at most 5 of one); `abP(p,stat)` is the product of its copies' factors (the sum for a rate stat, capped by `AB_CAPS`) for a hiker in a live Abyss run, 1 (0) otherwise; it is cached on `p.ab` and read where `rlP` is read (hooks above). A copy's factor stacks, so a rank is just more copies. The numbers below were tuned by B6's sim (section 3e).

| Id | Name | Rarity | Per copy |
|---|---|---|---|
| `ab_edge` | Honed Edge | common | damage dealt x1.75 |
| `ab_fang` | Ravener's Fang | common | damage dealt x2.2 |
| `ab_dread` | Dread Sigil | rare | damage dealt x3.6 |
| `ab_heart` | Heartwood Knot | common | max health x1.9 |
| `ab_marrow` | Titan's Marrow | rare | max health x3.2 |
| `ab_scale` | Slate Scale | common | damage taken x0.74 |
| `ab_carapace` | Void Carapace | rare | damage taken x0.5 |
| `ab_thread` | Mender's Thread | common | healing received x1.7 |
| `ab_eye` | Keen Eye | common | crit chance +5 points (sum capped at 50) |
| `ab_glass` | Quick Hourglass | common | cooldowns -6 points (capped at 40) |
| `ab_wraps` | Fleet Wraps | common | attack speed +8 points (capped at 60) |
| `ab_leech` | Leech Charm | rare | heal 0.04% of the damage dealt (capped at 1%: the hiker deals 10 to 300 times its health a second, so a percent of damage is a flood) |

Offers: a won round (not the last of a finite difficulty) draws 3 different ids by rarity weight (`AB_RAR_W` common 70, rare 30; an id held 5 times is left out), stores `gear.ab.run.offer = {k:'art',o:[ids]}` and only then sends `abo`. `abyss{a:'open'}` during a run sends the stored offer again. `pick,i` (i an integer 0-2 against the stored offer; a full bar or a 6th copy is refused with a toast), `skip`, `drop,i` (an index into the bar, between rounds only); `next` is refused while an offer is pending. The run's end (out, fall, close) clears the bar and `recalcP` takes the health back. Curses (B6) sit on `gear.ab.run.curses`, outside the 20.

Client (B5): the pick screen shows one card per id (icon glyph, name, rarity, text, the copies already held, Pick) and Skip; with a full bar Pick opens the discard dialog (no message is sent), a choice there sends `drop` then the `pick` again; the bar `#abArts` (from `GEAR.ab.run.arts`, so it follows every `you`) shows a tile per artifact with its copy count and `n / 20`, a tap between rounds opens the dialog.

## 3c. Combat artifacts (B6, `shared/abyss/artifacts-combat.js`, rules in `server/abyss/combat.js`)

New stats in `abArtStat` (`shared/abyss.js`): products `boss`, `exec`, `nth`; amounts that add up under `AB_CAPS` `killheal` (0.3), `shield` (3), `thorns` (0.2), `last` (0.3). Constants `AB_NTH` 5 (every 5th hit), `AB_EXEC_HP` 0.2, `AB_DEF_MIN` 0.1.

| Id | Name | Rarity | Per copy |
|---|---|---|---|
| `ab_bloodletter` | Bloodletter | common | every kill heals 3% of max health |
| `ab_echo` | Echoing Strike | common | every 5th hit x2.5 |
| `ab_bane` | Titanbane | common | damage to bosses x1.7 |
| `ab_ward` | Round Ward | common | a shield of 12% max health at each round's start (`p.shield`, `done:true`) |
| `ab_thorn` | Thornmail | common | a monster that hits you loses 0.4% of ITS max health (a boss a tenth); percent of damage taken would be nothing against 100x-health monsters |
| `ab_exec` | Executioner | common | hits on a monster under 20% health x1.55 |
| `ab_last` | Last Breath | rare | **death prevention**: a hit that would kill leaves you at 30% (1.5 s grace); that copy is used up and leaves the bar (`aba` with the copies left); one use a copy |
| `ab_vampedge` | Vampiric Edge | rare | kills heal 5%, heal 0.06% of damage dealt |
| `ab_bastion` | Bastion Sigil | rare | round-start shield 40% |
| `ab_warbrand` | Warbrand | rare | every 5th hit x5 |

## 3d. Wildcards and curses (B6)

**Wildcards** (`artifacts-wild.js`, `fam:'wild'`, a row needs a `minus` text; a factor below 1 on damage / health / healing, or damage taken above 1, is the minus; shown in red on the card and the bar tile; thrown away between rounds like any artifact):

| Id | Name | Rarity | Plus | Minus |
|---|---|---|---|---|
| `ab_w_glass` | Glass Cannon | rare | damage x2.9 | damage taken x1.75 |
| `ab_w_colossus` | Colossus Heart | rare | max health x2.6 | damage x0.5 |
| `ab_w_pact` | Bloodless Pact | rare | crit +15 points | healing x0.05 |
| `ab_w_berserk` | Berserker Mask | rare | damage x2.2 | max health x0.5 |
| `ab_w_turtle` | Turtle Shell | common | damage taken x0.4 | damage x0.62 |
| `ab_w_haste` | Hummingbird Charm | common | attack speed +24, cooldowns -12 points | max health x0.68 |
| `ab_w_bargain` | Devil's Bargain | rare | damage x4 | max health x0.74, healing x0.4 |
| `ab_w_thirst` | Thirsting Blade | common | heal 0.1% of damage dealt | damage taken x1.45 |

**Curses** (`curses.js`, `defineAbCurse`, registry `AB_CURSES` / `AB_CURSE_BAD`, ids `ab_c_...`): on `gear.ab.run.curses`, at most 5 (`AB_CURSE_MAX`), a repeat stacks, they do NOT use the 20 places. The hiker's own factors (`atk`, `hp`, `def`, `heal`) multiply into `abP`; `mhp` / `mdmg` multiply every monster of the run (`run.abCK`, read at a round's start and by `abCurseAddP`, applied in `abSpawnS` to a COPY of the cached `dgKOf` answer); `offer` takes cards off an offer (at least 1 stays). `abSanitize` keeps own-property curse ids only, at most 5. B6 has no source: `devP abyss` `curse:id` (and `art:id`) on a dev server; Events (B8) hand them out and a Shrine removes one.

| Id | Name | Effect |
|---|---|---|
| `ab_c_hides` / `ab_c_horde` | Thick Hides / Swollen Horde | monsters +25% / +50% health |
| `ab_c_claws` / `ab_c_frenzy` | Whetted Claws / Frenzy | monsters +25% / +50% damage |
| `ab_c_ruin` | Creeping Ruin | monsters +10% health and damage |
| `ab_c_famine` | Famine | healing x0.7 |
| `ab_c_narrow` | Narrow Offers | one card fewer in every offer |
| `ab_c_frail` | Frail Frame | max health x0.85 |
| `ab_c_dull` | Dull Blades | damage x0.85 |
| `ab_c_hollow` | Hollow Ward | damage taken x1.2 |

## 3e. The sim (`tools/abyss-sim.js`) and the tuned numbers

`node tools/abyss-sim.js [--runs 300] [--inf 60] [--picks n] [--pow x] [--seed n]`; `--check` (3 s, the test row `abyss-sim`) asserts the targets. A model, not the game: the shared rules come from `src/` through `loadShared` (`defAt`, `lvDmgK`, the tables, the rows), the hero is `HERO` at the top of the file. **The hero** (sim110's maxed level-75 hero, rerun here with its item codes fixed to the one roll line a level-40 piece takes): 300k health, 87% armour (a guard potion = the 10% floor), 3.0M damage a second to a level-100 monster (6.0M before the x0.5 level debuff), a level-100 mob (34M health) down in 11 s, the level-100 boss (198M) beaten in 165 s with 3 potions while dodging 60% of its hits (a no-artifact hero takes about 110% of its health doing it: it is on the edge, which is the definition). A fight round at level 100 (36 monsters) takes 221% of its health: lost. Assumptions that are mine, not measured: boss damage uptime 0.4, a boss strike is 0.25 of its `defAt` hit at 1.3 a second, mobs hit every 2 s with 3 at a time and the hero dodges 30% of them, crit 30% x2.2, attack speed counts 0.8 and cooldowns 0.5; potions are three heals of 40% a round.

Results (500 runs a cell, Infinite 1500; picks as the plan: a boss round 3, any other 0 / 1 / 2, about 1.5 a round; "random" takes any of the 3 cards, "greedy" the card that lowers the damage taken in a reference fight ten levels on most and throws away the copy that hurts least):

| Picker | I | II | III | IV | V | Infinite: median / deepest round, share reaching level 180 (round 28) |
|---|---|---|---|---|---|---|
| none | 100% | 100% | **0%** (dies in round 12) | 0% | 0% | 3 / 3, 0% |
| random | 100% | 100% | 100% | 63% | 9% | 5 / 23, 0% |
| greedy | 100% | 100% | 100% | 98% | **79%** | 7 / 30, 1% |

With exactly one pick a plain round (what the code gives until B8): greedy V 64%, IV 99%, random V 8%, Infinite deepest 26. Targets met: no artifacts fail III, a good bar clears V (level 140), level 180 is a 1-in-100 run. Infinite starts at level 90 with an empty bar, so its median (round 7, level 113) is below what V's 19 rounds reach: that is the plan's shape (B12 tunes Infinite). The factors were found with `--pow` (every product factor to one power): x1.35 on the first-guess numbers of B4; rates (leech, thorns, kill heal, shield) were sized by their order of magnitude against the hero's numbers.

**Two findings for the owner.** (1) The hero is already at hurtP's 10% damage-taken floor, so the B4 rule "the bar's damage taken sits inside the floor" would have made every defence artifact dead. The bar's `def` now multiplies AFTER the floor (`hurtP`, one hook line), never below `AB_DEF_MIN` x0.1 for the bar, so the lowest possible hit is 1% (plan section 4 had no number for this). (2) Percent-of-damage effects (lifesteal, thorns) scale with the hero's damage, which is 10 to 300 times its health a second here, so their per-copy numbers are tiny (0.04%, 0.4% of the monster's own health).

## 3f. Tiles (B7, `shared/abyss/tiles.js`)

A Fight round is played on a **tile**: one land's look and monster kinds, or one cave floor's, on a solid island floating in the rift's void (the rift sky and shards around it; no rift glass look: the monsters are the real kinds at normal speed, re-levelled to the round with `dgKOf`). A tile is a registry row, `defineAbTile({id, kind:'land'|'cave', land | floor, name, pool, tint:{ground, ground2, rim, fog, chip}, props, shape:{r, wob, pillars}})` (`AB_TILES`, `AB_TILE_IDS`, a bad row is left out and listed in `AB_TILE_BAD`: id, kind, land / floor, name, pool of 4-10 non-boss ids of `ALL_MON_DEFS`, tint, 2-5 `AB_PROP_KINDS`, shape). A land tile's pool is eight varied kinds of that land's zones (an id that a cave copy shares, like `icebeetle`, is avoided: `DEF_BY_ID` would give the cave's); a cave tile's pool is its floor's ten.

| Tile | Kind | Pool |
|---|---|---|
| `forest` Home Forest | land | slime, shroom, beetle, boar, goblin, treant, deathcap, direboar |
| `vale` Sakura Vale | land | sakuraslime, kappa, kodama, kabuto, kitsune, ashigaru, onibi, oni |
| `hoar` Hoarfrost Reach | land | frostslime, snowboar, lynx, wolf, reaver, rimewisp, yeti, draugr |
| `grey` Greyspine | land | granitslime, cliffboar, crystalbeetle, minegoblin, snowleopard, mistwraith, rocktroll, galedrake |
| `sun` Sunscar | land | sandslime, gildedscarab, warthog, dunescorpion, raider, cactustreant, mummy, efreet |
| `gloam` Gloamhorn | land | brineslime, gloomcrab, seaboar, drownedsailor, banshee, ghoul, gargoyle, hollowknight |
| `amber` Amber Reach | land | dustrunner, thornboar, grassstalker, mudcroc, moundsoldier, anvilhawk, cinderbuffalo, deltahippo |
| `isles` Emberwake Isles | land | crabbrute, reefraider, coralbeetle, lagoonray, junglehog, stonejaguar, ropespinner, highlandcondor |
| `cave_grotto` ... `cave_umbral` | cave | floors 1-6 (`shared/cave/floor-*.js`): grotto, prism, drowned, magma, frost, umbral: each floor's ten monsters |

**The island.** `abLayout(tile,seed)` (pure, both sides) = `abTileLayout`: 2 x 2 map tiles (48 x 48 cells of 2 m), a blob whose rim at angle a is `r (1 + wob (0.6 sin(2a+p) + 0.4 sin(3a+q)))` cells out (radius 30-42 m), all open ground, `pillars` solid rocks between 7 cells from the middle and 6 inside the rim, `P` (the landing) in the middle, six tears `S` just inside the rim; one connected island, so `dgFlow` and `dgBake` work as everywhere. No tile (`''`): the Shardmere's plain platforms, which B8's Event and Shrine rounds keep.

**The look** (`game/abyss/view.js`): ground quads blended between `ground` and `ground2`, a rock face under every edge over the void, hanging rock, a rock stack on each pillar, 12 (phone) / 22 props of the tile's `props` scattered 8 m from the landing and 3 m from the rim (decoration: the server never sees them), the tears, the landing, then the rift's own sky and shards (`riftSkyBuild`, `riftShardsBuild`) and its light, leaned toward the tile's `fog` and `ground` (`abTileLookTune`). Two merged vertex-coloured meshes: no `InstancedMesh`, so nothing to lack `instanceColor`.

**The next-tile choice** (`server/abyss/tiles.js`). Round 1 is a random tile. After a won round (not the last of a finite difficulty) and once its artifact offer is resolved (pick, or skip; at once when there was no offer) the server draws 3 different tiles (not the one just played), stores `gear.ab.run.offer = {k:'tile', o:[{tile, kind:'fight'}]}` and sends `abo [pid,'tile',[[tile,kind]...]]` (again on `open`); `abyss{a:'next',i}` (i an integer index into the stored offer) plays that tile; a bad or missing i and a pending artifact offer are refused; `skip` never clears a tile offer; with no offer pending (the dev jump) `next` plays a random tile. For now every offered kind is `fight` (B8 adds the other kinds, B9 bosses). Client: the same screen as the artifact pick shows a card per tile (name, land / cave, kind, a colour chip, four of its monsters) with Later; the bar's Next brings the cards back.

## 3g. Round kinds (B8): Elite, Trial, Event, Shrine

After a won round the offer holds 3 cards, each a **tile and a kind**, drawn by `abDrawKindsS(d, r, es, n)` (`server/abyss/tiles.js`; `r` = the round the offer is for, `es` = `gear.ab.run.es`, the round of the last Event / Shrine played). Weights `AB_KIND_W`: **fight 45, elite 15, trial 10, event 15, shrine 10, boss 0** (boss comes in B9). Round 1 is always a Fight (`abGoP`). **Guarantee:** in rounds 4-6, 10-12, 16-18... (`abEncWindow(r)` = the window's first round) while no Event / Shrine was played inside the window (`es` below it) the offer holds at least one Event or Shrine card, and in the window's third round every card is one. The last round of a finite difficulty is never an Event or a Shrine (it wins the run). An Event / Shrine card has no tile (`tile:''`); a Trial card carries a `mode`. The kind is stored with the offer (`{tile, kind, mode?}`), cleaned by `abOfferSanitize`, shown on the tile cards (colour, icon, name, what it pays: `abKindChip`). `abKindDev = {force, mode}` pins every drawn kind (the smoke test; `devP abyss` `kind` / `mode`).

| Kind | The round | Pays |
|---|---|---|
| Fight | 3 waves of the tile's monsters (B2) | 1 artifact pick (as since B4) |
| Elite | the Fight's waves at half the size (`AB_ELITE_K`): half of the monsters elites (x2 health, scale 1.15), one champion in wave 2 and a second in wave 3 half of the time (x4 health, scale 1.5); `m.abTier` `'e'` / `'c'` | 2 picks, one after another |
| Trial | a rift mode on its rift's platforms (below), the tile's monsters, plain numbers at the round level | 2 picks |
| Event | plain rift platforms (the Shardmere's), no monsters; won at once; an encounter card | the card's own reward (curses come only from here) |
| Shrine | plain platforms, no monsters; won at once; a shrine card | one of: heal to full, lift one curse (choose which), copy one artifact held (needs a free place of the 20 and rank under 5) |

**Picks.** `AB_KIND_PICKS`; the first offer comes from `abOfferP` in `abRoundWonS`, the rest is owed in `gear.ab.run.pk`; `abAfterPickP` (after a pick, a skip, an Event or a Shrine) offers the next pick or, when none is owed, the tiles. An Event / Shrine round stores its card as the offer (`abEncounterS`, from the kit's setup) and is "won" from the start, so `pick` / `drop` / `next` / `out` work as between rounds; `skip` does nothing to it, and `next` is refused until it is answered.

**Trials.** `AB_TRIAL_MODES` gives each mode the rift whose platforms it was designed for: heart on the Taproot, gale the Petal, beacons the Sunlit, thaw the Rime, lanterns the Long-night, quarry the Stone, gauntlet the Forge. The run's theme is that rift (the client builds its look; `abLayout('rift:<id>', seed)` is its layout), its `run.rdef` (`abTrialDefS`) a copy of the rift with `reward:'abyss'`, the tile's pool as kinds (the first four from stage 1, then one more every stage or two) and the pool's last kind as the Herald (x4 health after the halving). `DG_KITS.abyss` hands setup, tick, `onKill`, `onUse` and the HUD to `DG_KITS.rift` and the mode's `RIFT_MODE_KITS` entry unchanged, so the modes' own rules (breakers, gusts, beacons, frost, cores, pylons, champions and vents) all hold. `RIFT_PAY.abyss` pays nothing (no XP, coins or Essence, no `riftStageS` payment); `riftWonS` ends the ROUND (`abTrialWonS`: the left-over monsters go, `abRoundWonS`). A lost Trial (the heart broken, the gauntlet's clock) ends the run the dungeons' way (`dgLoseS`, then the close). **All seven modes work** (the smoke test wins each headless with the rift smoke's bot). Their `riftStageS` call needs no hook (nothing is paid per stage). The Trial HUD is the rift mode's tuple (`run.hud[0..7]`) with `1`, the round and the rounds after it; `DG_HUD.abyss` draws it with `DG_HUD.rift` minus the XP line, titled "Trial: <mode>".

**Events** (`shared/abyss/events.js`, `defineAbEvent`; ops in `shared/abyss.js`: `art {rar, fam, n}`, `lose {n}`, `curse {n}`, `uncurse`, `heal`, `gamble {p, win, lose}`):

| Event | Choices |
|---|---|
| The Whispering Altar | a rare artifact and a curse / heal to full / walk on |
| The Void Peddler | lose one, gain two commons / a rare and a curse / walk on |
| The Coin of Two Faces | 50%: a rare, else a curse / 34%: a wildcard, else two curses / walk on |
| The Bargain Shard | a wildcard / a common / walk on |
| The Fountain of Scars | heal to full and a curse / lift a curse / walk on |
| The Broken Forge | lose one, gain a rare / lose two, gain a wildcard / walk on |
| The Hungry Mirror | 60%: two commons, else lose one / a common and a curse / walk on |
| The Tithe Collector | a common, heal and a curse / lose one, lift a curse / walk on |

`abEventFlagsP` says which choices can be taken now (sent with the card; the client greys the rest): a choice is refused (toast, the offer stays) when it would lose what you do not hold, take the bar past 20, or the curses past `AB_CURSE_MAX` (a gamble counts its worse branch). Curses sit outside the 20. The Shrine's card is built when the round starts (`abShrineOfferS`: heal, a removal per distinct curse held, a copy of up to 4 distinct artifacts held while a place is free) and every use is checked again at the pick.

## 3h. Bosses (B9, `shared/abyss/boss.js`, `server/abyss/boss.js`)

**Boss rounds.** Forced on `abBossRounds(d)` (7, 13, 19... and a finite difficulty's last round): `abDrawKindsS` then offers **three boss cards**, each a different boss (the player picks which one, with its name and land on the card). Offered at random between them: the kind table's boss slot, weight 5 (`AB_KIND_W`), never for round 1 (`r < 2`: round 1 is made by `go`, not offered) and never right after a boss round (`prev`, the kind of the round just won: the 5th parameter of `abDrawKindsS`). A boss round pays 3 artifact picks (`AB_KIND_PICKS.boss`, owed in `gear.ab.run.pk` like the Elite's); on the last round of a finite difficulty the boss's death wins the run instead (no picks, as for every last round). The stored card is `{tile: the boss's land tile id, kind:'boss', boss: id}` (`abOfferSanitize` drops a boss card whose id is not in `AB_BOSS_OK`); `abo` sends it as `[tile,'boss','',bossId]`.

**The pool.** The 16 world bosses of `BOSS_DEFS` but Pyrrhax (`sinkwarden`) and the 8 dungeon bosses of `DG_BOSS_DEFS` (their rows, as `dgBossDefOf` takes them): 24, `AB_BOSS_ALL`. The draw is uniform over `AB_BOSS_OK` (the whitelist: the pool minus `AB_BOSS_OUT`, `{id: reason}`).

**The boss tile.** Tile string `'boss:<land tile>'` (`abLayout` strips the prefix: `abTileBase`): a solid disc of `AB_BOSS_CELLS` = 15 cells = 30 m radius (no wobble, no pillars, no tears; the plan's minimum is 24 m, the rift hub is 16 m), the land's tint and props (`AB_BOSS_LAND`: the arena's land, or the dungeon's: Amanita forest, Gawataro vale, Haugbui hoar, Garrick grey, Khet sun, the Abbess gloam, Ortha amber, Ahmetl isles). The landing `P` is 13 cells south of the middle (outside the boss's circle), `run.B.boss = {x,z,r:20}` at the middle (set by `abRunNewS`: `dgBake` only knows the dungeons' boss tile). `run.abKind = 'boss'`, `run.abBoss` the id, `run.tile` the land's row, `run.abTile` the prefixed string (what the client rebuilds from and `abr` carries). The client view takes the same disc (`abTileBase` in `game/abyss/view.js`).

**The fight.** `abBossS(run)` is `dgBossS` with the boss chosen by the draw: `makeBossS(row, dgHallArena(run.B,...))` with `S.ctx = run.id`, so `dgAdoptS` levels it at the round level (plain `defAt`, `run.L`; the curses' monster factors are applied) and every add it makes joins the run; it spawns at the kit's setup, engages when the hiker steps into the r = 20 circle (`updateBossS`) and resets when nobody is in it. It sends what `dgBossS` sends: `spawn`, `dgb`, the snapshot's `b` row and the telegraphs (`tele`), so the client's boss bar and kit effects are the dungeons'. `abBossTickS` puts the boss back inside the disc if a leap, charge or knockback leaves it (`run.abPull` counts it; none happened in the headless check). The kit's `onBossDead` is `abRoundWonS`.

**No world reward.** A run's monster dies through `killMonsterS` -> `dgKilledS`, never `rewardKill` (no trophy, set roll, zone tier, quest step, stirring or achievement), and `rewardAllS` skips an Abyss run (no XP, coins or loot); `bossDefeatedS` is the one hook (`m.abBoss`: no "has fallen" toast to the whole server, no world respawn timer). The smoke test compares the whole save (but `gear.ab`) before and after a kill.

**The whitelist.** Every boss of the pool passed the headless check at levels 60, 100 and 140 (`node tools/abyss-smoke.js --deep`; the default run checks 100): spawn on the disc, engage, 30 s of the kit with the hiker standing at it (health refilled each tick), no throw, no NaN health or position, never off the disc, every add in the run and no world monster in the slot, then a kill that wins the round. `AB_BOSS_OUT` is empty. The check stands still next to the boss: it proves the kits run without error on an open disc at any level, not that a fight is balanced or that every move reaches a moving hiker. A boss that later fails goes into `AB_BOSS_OUT` with a one-line reason and leaves the draw.

## 4. Messages

`abyss{a:'open'}` → `{t:'abyss',a:'info',on:1,top,best,diffs,lv}`; `go,d`, `next`, `out` (B2; a won last round of a finite difficulty sets `gear.ab.top = max(top, d+1)` and `clears[d]++`; Infinite keeps `top` and records `best`); events `abr [pid, round, of, lv]` and `abw [pid, round]` (`docs/PROTOCOL.md`). B4: `pick,i`, `skip`, `drop,i`; events `abo [pid,'art',ids]` and `aba [pid,id,copies]`. B7: `next,i` (a tile of the stored offer), `abo [pid,'tile',[[tile,kind]...]]`, `abr [pid,round,of,lv,tile]`, the tp's `dg.tile`. B10: `shop` → `{t:'abyss',a:'shop',as,top,d,rows:[{id,name,kind,price,left,open,ok}]}`, `buy,id,n` (n an integer 1-99, charged first on the server, answers with a toast and a fresh `shop`), event `abs [pid,round,shards,bonus,balance]`. B11: `prism,id` / `lock,id,i` (section 5b). Build order: PLAN.md section 8.

## 5. Shards and the shop (B10: `shared/abyss/shop.js`, `server/abyss/pay.js`)

**The pay.** A won Fight / Elite / Trial / Boss round credits its shards at once (`abPayRoundP`, called from `abRoundWonS`), so a fall keeps everything already earned; the last round of a finite difficulty adds the clear bonus (the last three rounds' pay again, `abClearBonus`). An Event or a Shrine pays nothing (no fight). A guest (`isGuestP`) earns no shards (it also cannot reach level 40). The Abyss pays no XP, coins or loot.

`round pay = AB_SH_BASE (10) x AB_SH_DIFF[d] (1, 1.6, 2.6, 4.2, 7, 9 for I-V and Infinite) x 1.2^(round-1) x the kind` (Fight 1, Elite and Trial 1.5, Boss 2.5; the exponent stops at round 60). A round's time grows by a few seconds a round (`AB_ROUND_S`, a model: 45 s + 3 s a round, x1.5 for an Elite or Trial, x2.5 for a boss), shards grow x1.2, so the marginal shards a minute and the average of a run to round R both rise at every round of every difficulty: **pushing on always pays more a minute than restarting** (`abyss-smoke` checks both for all six difficulties).

| Difficulty | Rounds | Round 1 pays | Last round pays | A whole run (rounds + clear bonus) |
|---|---|---|---|---|
| I | 7 | 10 | 75 | 250 |
| II | 10 | 16 | 206 | 819 |
| III | 13 | 26 | 580 | 2,311 |
| IV | 16 | 42 | 1,618 | 7,028 |
| V | 19 | 70 | 4,659 | 19,587 |
| Infinite | no end | 90 | grows without limit, no clear bonus | per round only |

(The last round is a boss round, x2.5; the run totals are printed by `node tools/abyss-smoke.js`.)

**The shop** (`AB_SHOP`; the Shop tab of the Abyss window at the gate, key and window as the difficulties):

| Item | Price | Stock a day | Goes to |
|---|---|---|---|
| Weapon / Armor Reroll Stone | 60 | 5 each | `gear.rsw` / `gear.rsa` |
| Accessory Reroll Stone | 80 | 5 | `gear.rsr` |
| Tempering Stone | 20 | 25 | `gear.temper` |
| Echo Shard | 25 | 10 | `gear.awm.echo` |
| 50,000 coins | 20 | 10 | `gear.coins` |
| Fire / Water / Air / Earth / Light / Dark Essence | 40 | 5 each | `gear.awm.ess_<element>` |
| Prime Essence | 120 | 2 | `gear.awm.ess_prime` |
| **Abyss Heart** (opens after Difficulty III) | 20,000 | none | `gear.awm.abyss` |
| **Void Anchor** (after IV) | 20,000 | none | `gear.ab.lock` |
| **Ascendant Prism** (after V) | 60,000 | none | `gear.ab.prism` |

A common row has a daily stock; a special has none but each one bought today costs `AB_SPECIAL_GROWTH` (1.5) times the one before (`abShopPrice`: the 2nd Prism 90,000, the 3rd 135,000...), back to the base price the next UTC day (`gsDayOf`, the daily quest set's reset). Prices were tuned with the table above: one Difficulty V clear (about 19,600 shards) buys one Void Anchor or one Abyss Heart, a Prism costs about three clears, a reroll stone about four first-difficulty rounds; the whole common stock of a day costs about 3,400 shards. Today's purchases are `gear.ab.sh = {d, n:{id:count}}` (`abSanitize` keeps own `AB_SHOP` ids only, a new day empties it). `abBuyP` checks everything before it charges (an own row, n an integer 1-99, opened by `gear.ab.top`, stock left, shards, room under the item's cap, not inside a run, level 40), then charges, then grants; `economy-fuzz` covers it. The Void Anchor and Prism have no use until B11; the Abyss Heart none until Awakening A6. The shop works in Shared mode too (it needs no run), but shards can only be earned where a run can start.

## 5b. The Void Anchor and the Ascendant Prism (B11: `shared/abyss-items.js`, `server/abyss/items.js`, markers in `shared/rolls.js`)

Both are bought in the shop (section 5, `gear.ab.lock` / `gear.ab.prism`) and used on a rolled piece in the forge's Roll tab; the effect lives **inside the piece's roll code** (`docs/ROLLS.md`, last section), so every path that carries an id carries it: `~!*a57k12c90` = prism, line `a` locked.

- **Ascendant Prism** (`abyss{a:'prism',id}`): one per piece, for good. Every existing line's grade +10 (stored 00-99, capped 99) and every later roll of that piece uses `q = min(99, floor(rnd*100)+10)`: the top grade comes up 11 times as often as any other, grades under 10 never appear. Refused: no Prism, the piece not in the bag, no lines (unrolled), a prism already on. The details show it as "Prism"; grades read `q/99` there.
- **Void Anchor** (`abyss{a:'lock',id,i}`): line i of a 2-3 line piece (level 50 / 60) stays locked: every reroll keeps its stat, grade and position and rolls the others (never its stat) for the normal stone. Another Anchor on a different line moves the lock (and costs one more). Refused: a 1-line piece, i not an integer below the line count, that line already locked.
- A worn piece: the bag copy is used unless `worn:true` or no spare exists (as `reroll`). Both items work inside a run too; sacrifice, tempering, player shops and saves treat a marked piece like any other. Test: `node tools/abyss-items-smoke.js`.
