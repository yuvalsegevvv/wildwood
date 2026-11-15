# The Abyss

A solo roguelike mode: one hiker, one life, rounds of small tiles with choices between them, artifacts that live for the run, paid only in Abyssal Shards. Plan, numbers and decisions: the project's `abyss-plan/PLAN.md` (version 5). Stem `abyss`, prefix `ab` / `AB_`.

**Status: B0-B5 built, behind `AB_ON`** (false until step B12). The server asks `abOnS()` = `AB_ON || io.test || S.dev`, so the test world and dev servers have it, the deploy (`--no-dev`) does not. Built so far: the slot split, the rules tables, the save `gear.ab`, the window message, and (B2) the server run with Fight rounds only: three waves of the Shardmere's glass kinds at the round's level with plain numbers (no `RIFT_HP_K` / `RIFT_DMG_K`), `go` / `next` / `out`, death and leaving end the run, no XP, coins or loot from Abyss kills. B3 (the client shell): the flag reaches the client as `welcome.ab`, the gate stands in Glasswell, the window lists the six difficulties, the `abr` banner, the `abw` event and the between-rounds bar (Next round / Leave); the HUD row `DG_HUD.abyss` and the void look were already there. B4-B5 (artifacts): the registry, twelve stat artifacts, the run's bar in the save, `abP`, an offer after every won round, pick / skip / drop, and the client's pick screen, bar and discard dialog. Still none: combat / wild artifacts and curses (B6), tiles, bosses, shards, a `game/abyss/view.js`.

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
| `tools/abyss-smoke.js` | the test (server side); the client side is the Abyss case of `tools/client-smoke.js` |

## 2. Numbers (`shared/abyss.js`)

| Name | Value |
|---|---|
| `AB_DIFFS` | I 40-60 in 7 rounds, II 50-80 in 10, III 60-100 in 13, IV 70-120 in 16, V 80-140 in 19, Infinite from 90 with no end |
| `abRoundLv(d,r)` | `lo + round((r-1)*10/3)`: I gives 40, 43, 47, 50, 53, 57, 60; V reaches 140 at round 19; Infinite 180 at round 28 |
| boss rounds | 7, 13, 19... (every 6 from 7) and the last round of a finite difficulty (I [7], II [7,10], III [7,13], IV [7,13,16], V [7,13,19]) |
| `AB_ART_MAX`, `AB_RANK_MAX`, `AB_CURSE_MAX` | 20 artifacts at once, 5 copies (ranks), 5 curses |
| `AB_ENTRY_LV` | 40 |
| `AB_AS_MAX`, `AB_LOCK_MAX` | 999,999,999 shards, 9,999 Void Anchors (save caps) |

Save: `gear.ab = {top (0-5), best, clears:[6], as, lock, sh:{d,n:{id:count}}, run:null}`, rebuilt field by field by `abSanitize`; shop ids in `sh.n` are only checked against the shop's rows from B10 (for now: own keys, no prototype names, counts 1-9999, at most 64).

## 3. Hooks (`// abyss:`)

| Place | What |
|---|---|
| `server/players.js` `sanitizeGear` | `abSanitize(g,out)` beside `riftSanitize` |
| `server/rift.js` `riftDefOf(run)` | the one read of a run's rift def (replaces the 14 `RIFT_DEFS[run.rift]` reads), so an Abyss run can supply its own (B2) |

| `server/dungeons/runs.js` `dgSetupS` | no puzzle stones in an Abyss run (`!run.ab`) |
| `server/dungeons/runs.js` `dgDownTickS` | `abDownTickS`: a fall ends the run after `AB_DEATH_S` |
| `server/dungeons/runs.js` `dgCloseS` | `abCloseS`: whoever is online has no run in the save (the empty close of a pulled plug ends here) |
| `server/dungeons/lobby.js` `dgLeaveP` | `abLeaveP`: between rounds it is "out", in a fight a fall |
| `server/dungeons/mobs.js` `rewardAllS` | an Abyss run pays no world rewards |
| `server/economy.js` `devP` | `abyss`: `v` = top difficulty open, `r` = jump to round r of the run you are in (`abDevP`) |
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
| `game/village/talking.js` | the talk key and its prompt (`abHere`, two lines) |
| `game/main/loop.js` | `abUpdate(dt)` |
| `game/ui/panels.js` | `'abyss'` in `PANELS` |
| `game/dungeon/run.js` `dgRunEnter` | the client rebuilds an Abyss run's theme and layout (`abLayout`, `shared/abyss.js`) |

`RIFT_SLOT_END` (32, `server/rift.js`) ends the rifts' slot scan; `rift-smoke` checks a rift never takes slot 32 or above.

## 3b. Artifacts (B4-B5)

A run's bar is `gear.ab.run.arts` (ids, at most 20, a repeat id again, at most 5 of one); `abP(p,stat)` is the product of its copies' factors (the sum for a rate stat, capped by `AB_CAPS`) for a hiker in a live Abyss run, 1 (0) otherwise; it is cached on `p.ab` and read where `rlP` is read (hooks above). A copy's factor stacks, so a rank is just more copies. The numbers are a first guess sized for plan section 4's budget (x400-800 damage, x45-80 toughness from a full bar); B6's sim tunes them.

| Id | Name | Rarity | Per copy |
|---|---|---|---|
| `ab_edge` | Honed Edge | common | damage dealt x1.35 |
| `ab_fang` | Ravener's Fang | common | damage dealt x1.5 |
| `ab_dread` | Dread Sigil | rare | damage dealt x1.9 |
| `ab_heart` | Heartwood Knot | common | max health x1.4 |
| `ab_marrow` | Titan's Marrow | rare | max health x1.9 |
| `ab_scale` | Slate Scale | common | damage taken x0.85 |
| `ab_carapace` | Void Carapace | rare | damage taken x0.68 |
| `ab_thread` | Mender's Thread | common | healing received x1.35 |
| `ab_eye` | Keen Eye | common | crit chance +5 points (sum capped at 50) |
| `ab_glass` | Quick Hourglass | common | cooldowns -6 points (capped at 40) |
| `ab_wraps` | Fleet Wraps | common | attack speed +8 points (capped at 60) |
| `ab_leech` | Leech Charm | rare | heal 2% of the damage dealt (capped at 20%) |

Offers: a won round (not the last of a finite difficulty) draws 3 different ids by rarity weight (`AB_RAR_W` common 70, rare 30; an id held 5 times is left out), stores `gear.ab.run.offer = {k:'art',o:[ids]}` and only then sends `abo`. `abyss{a:'open'}` during a run sends the stored offer again. `pick,i` (i an integer 0-2 against the stored offer; a full bar or a 6th copy is refused with a toast), `skip`, `drop,i` (an index into the bar, between rounds only); `next` is refused while an offer is pending. The run's end (out, fall, close) clears the bar and `recalcP` takes the health back. Curses are reserved (`gear.ab.run.curses`, always empty until B6).

Client (B5): the pick screen shows one card per id (icon glyph, name, rarity, text, the copies already held, Pick) and Skip; with a full bar Pick opens the discard dialog (no message is sent), a choice there sends `drop` then the `pick` again; the bar `#abArts` (from `GEAR.ab.run.arts`, so it follows every `you`) shows a tile per artifact with its copy count and `n / 20`, a tap between rounds opens the dialog.

## 4. Messages

`abyss{a:'open'}` → `{t:'abyss',a:'info',on:1,top,best,diffs,lv}`; `go,d`, `next`, `out` (B2; a won last round of a finite difficulty sets `gear.ab.top = max(top, d+1)` and `clears[d]++`; Infinite keeps `top` and records `best`); events `abr [pid, round, of, lv]` and `abw [pid, round]` (`docs/PROTOCOL.md`). B4: `pick,i`, `skip`, `drop,i`; events `abo [pid,'art',ids]` and `aba [pid,id,copies]`. Planned: `shop`, `buy,id,n`, `lock,id,i`. Build order: PLAN.md section 8.
