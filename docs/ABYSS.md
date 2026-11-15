# The Abyss

A solo roguelike mode: one hiker, one life, rounds of small tiles with choices between them, artifacts that live for the run, paid only in Abyssal Shards. Plan, numbers and decisions: the project's `abyss-plan/PLAN.md` (version 5). Stem `abyss`, prefix `ab` / `AB_`.

**Status: B0 and B1 built, behind `AB_ON`** (false until step B12). The server asks `abOnS()` = `AB_ON || io.test || S.dev`, so the test world and dev servers have it, the deploy (`--no-dev`) does not. Built so far: the slot split, the rules tables, the save `gear.ab`, the window message. No run, no gate, no client yet (B2 on).

## 1. Files

| File | What it holds |
|---|---|
| `shared/abyss.js` | `AB_ON` / `abSwitch`, `AB_DIFFS` (I-V and Infinite), `abRoundLv`, `abRounds`, `abBossRounds`, `abIsBossRound`, the caps |
| `server/abyss.js` | `abSanitize` (`gear.ab`), `abOnS`, `MSG.abyss` (`a:'open'` only for now) |
| `shared/dungeon-slots.js` | `DG_MAX_INST` 48 and `AB_SLOT0` 32: slots 0-15 dungeons, 16-31 rifts, 32-47 the Abyss |
| `tools/abyss-smoke.js` | the test |

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

`RIFT_SLOT_END` (32, `server/rift.js`) ends the rifts' slot scan; `rift-smoke` checks a rift never takes slot 32 or above.

## 4. Messages

`abyss{a:'open'}` → `{t:'abyss',a:'info',on:1,top,best,diffs,lv}` (`docs/PROTOCOL.md`). Planned: `go,d`, `next,i`, `pick,i`, `drop,i`, `out`, `shop`, `buy,id,n`, `lock,id,i`; events `abr`, `abo`, `aba`. Build order: PLAN.md section 8.
