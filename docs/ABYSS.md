# The Abyss

A solo roguelike mode: one hiker, one life, rounds of small tiles with choices between them, artifacts that live for the run, paid only in Abyssal Shards. Plan, numbers and decisions: the project's `abyss-plan/PLAN.md` (version 5). Stem `abyss`, prefix `ab` / `AB_`.

**Status: B0, B1, B2 and B3 built, behind `AB_ON`** (false until step B12). The server asks `abOnS()` = `AB_ON || io.test || S.dev`, so the test world and dev servers have it, the deploy (`--no-dev`) does not. Built so far: the slot split, the rules tables, the save `gear.ab`, the window message, and (B2) the server run with Fight rounds only: three waves of the Shardmere's glass kinds at the round's level with plain numbers (no `RIFT_HP_K` / `RIFT_DMG_K`), `go` / `next` / `out`, death and leaving end the run, no XP, coins or loot from Abyss kills. B3 (the client shell): the flag reaches the client as `welcome.ab`, the gate stands in Glasswell, the window lists the six difficulties, the `abr` banner, the `abw` event and the between-rounds bar (Next round / Leave); the HUD row `DG_HUD.abyss` and the void look were already there. Still none: artifacts, tiles, bosses, shards, a `game/abyss/view.js` (B4 on).

## 1. Files

| File | What it holds |
|---|---|
| `shared/abyss.js` | `AB_ON` / `abSwitch`, `AB_DIFFS` (I-V and Infinite), `abRoundLv`, `abRounds`, `abBossRounds`, `abIsBossRound`, the caps |
| `server/abyss.js` | `abSanitize` (`gear.ab`, with `abRunSanitize` for `run`), `abOnS`, `MSG.abyss` (`open`, `go`, `next`, `out`) |
| `shared/dungeon-slots.js` | `DG_MAX_INST` 48 and `AB_SLOT0` 32: slots 0-15 dungeons, 16-31 rifts, 32-47 the Abyss |
| `server/abyss/rounds.js` | the run: `abRunNewS`, `abGoP` / `abNextP` / `abOutP`, `abSpawnS`, `abWaveStepS`, `abRoundWonS`, `DG_KITS.abyss`, the fall and leave rules, `abDevP` |
| `game/abyss/abyss.js` | (B3) the gate (`abBuildGate`, a black-violet tear at the Guildhall's door, `VIL5.anchors['place:guild']`), the talk key (`abHere` / `abPrompt` / `abOpenNear`), the window (`#abyss`), `EVH.abr`, `EVH.abw`, the bar `#abBar`, `abUpdate(dt)` |
| `styles/42-abyss.css` | the window and the bar |
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
| `game/village/talking.js` | the talk key and its prompt (`abHere`, two lines) |
| `game/main/loop.js` | `abUpdate(dt)` |
| `game/ui/panels.js` | `'abyss'` in `PANELS` |
| `game/dungeon/run.js` `dgRunEnter` | the client rebuilds an Abyss run's theme and layout (`abLayout`, `shared/abyss.js`) |

`RIFT_SLOT_END` (32, `server/rift.js`) ends the rifts' slot scan; `rift-smoke` checks a rift never takes slot 32 or above.

## 4. Messages

`abyss{a:'open'}` → `{t:'abyss',a:'info',on:1,top,best,diffs,lv}`; `go,d`, `next`, `out` (B2; a won last round of a finite difficulty sets `gear.ab.top = max(top, d+1)` and `clears[d]++`; Infinite keeps `top` and records `best`); events `abr [pid, round, of, lv]` and `abw [pid, round]` (`docs/PROTOCOL.md`). Planned: `pick,i`, `drop,i`, `out`, `shop`, `buy,id,n`, `lock,id,i`; events `abr`, `abo`, `aba`. Build order: PLAN.md section 8.
