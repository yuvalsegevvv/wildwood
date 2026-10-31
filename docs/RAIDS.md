# Raids: eight ruined strongholds

Built (version 3). One stronghold per land, each a ruin in an empty part of its land: 28 garrison monsters of the land's own kinds, destructibles, and one of the land's two **existing** world bosses (no new boss), rolled at random each time the raid is rebuilt. A clear pays a land-specific raid material that signature (skill set) skills need to level up. A cleared raid rebuilds 30 minutes later. The plan this was built from (with the reasoning and the open questions) is `raids-plan/PLAN.md` in the project files.

Stem `raids`, prefix `rd` / `RD_`. Test: `node tools/raids-smoke.js`.

## 1. The eight

| Land | Raid | Site (x, z) | Boss pool | Material |
|---|---|---|---|---|
| home | Thornwall Keep | 0, 580 | Rootwarden, Carapax | Thornwall Seal |
| vale | Kurohana Castle | 940, 140 | Akaoni, Kyuubi | Kurohana Crest |
| hoar | Jarnhall | 540, -240 | Ymrik, Vetrmaw | Jarnhall Rune |
| grey | Stonewatch | -160, -360 | Gryphon Queen, Mountain Golem | Stonewatch Ingot |
| sun | The Sunken Citadel | -780, 440 | Glass Guardian, Sand Wyrm | Citadel Sunstone |
| gloam | Wrackmoor Fort | -740, -240 | Captain Dredge, Gloam Warden | Wrack Glass |
| amber | The Broken Moot | -1027, 1025 (`SAV_MOOT`) | Old Thunder, Oldhorn | Moot Bead |
| isles | The Seven Gates | `EW_GATES` (zone 48, the Terrace Slopes) | Ocelo, Tuila | Gate Tally |

The Seven Gates (`shared/raids/sevengates.js`, look `gates`: seven fitted-stone gate frames in a row, each more finished than the last, the seventh without a lintel; the isles' level 47-48 kinds as garrison) is the eighth. The volcano's long boss is a later raid and not part of this one.

The Broken Moot (`shared/raids/moot.js`, look `moot`: seven toppled seats ring the court) is built before its bosses are wired in: `rdBossRow(id)` finds a raid boss in `BOSS_DEFS` or, until the wire-up task pushes them, in `SAV_BOSS_ROWS`. Zone tier II+ of the Reach does not exist yet, so it pays at tier 0 until then.

The boss pool is `SS_SOURCES[land].slice(0,2)`. Sites were found by scanning each land for flat dry ground away from every anchor, door, village and arena; the data is `shared/raids/<id>.js`, one `defineRaid({...})` each (a bad entry is left out and listed in `RD_BAD`).

## 2. The fight

Every raid has one layout (`RD_LAYOUT`, metres from the site, gate to the north): a gate (2 packs of 4), a yard (2 packs of 4, two **War Banners**, four **Barricades**), an inner wall with an opening and three **Warding Stones** in front of it, and the **inner court** (the boss arena, radius 20) with 2 packs of 3 on its walls. Six elites (x2 health, x1.25 size) guard the stones. That is 28 garrison monsters.

- **Tier lock.** A fresh raid is *ready* at level 40. The first player hit locks it to that player's tier setting for the land (`rdLockS`): level `40 + 10 x tier` for everyone, boss and structures included; one `rdlv` event re-levels the clients' views. Tiers are personal but a monster exists once, so without the lock a +0 friend could carry a tier VII player.
- **Wards.** The boss is asleep (immune, not ticked) until all three Warding Stones are broken; a hit on it before that does nothing and says why.
- **Banners** call a reinforcement every 40 s each (at most 4 alive per banner) while the raid is engaged and someone is inside.
- **Barricades** are cover and dressing.
- **The boss** is built by `makeBossS(bd, R.court)` with its own kit at the raid's level; what its kit spawns belongs to the raid (`rdCtx` adoption in `makeMon`). It is a raid copy: it pays XP, coins and trophies like any boss kill but opens no zone tier, rolls no skill set, drops no boss skill, advances no quest (`rewardKill` returns early for `m.rd`).
- **Clear** = the boss is dead and every stone and banner is broken. The surviving garrison flees (is removed).
- **Pay** = `2^tier` of the land's raid material (1, 2, 4 ... 128) to each player who hit anything in the raid and is within `RD_FOOT` (62 m) when it clears, at `min(raid tier, their own highest unlocked tier in that land)` (`rdCapTier`). Kept in `gear.rd.mat[land]` (cap 99,999).
- **Reset.** A cleared raid is rebuilt `RD_RESET` = 1800 s after the clear (fresh garrison, boss rolled again). An engaged raid nobody has been inside for `RD_ABANDON` = 600 s is rebuilt too. Raid state is not saved: a server restart rebuilds all six.

## 3. Signature skills level with raid material

Signature pieces (3 actives, 3 passives per set) could not be upgraded before. They now level 2..5 on the usual curve (actives `skillPower` / `skillCdMult`, passives their own per-level step), at a trainer, for the usual coins, `UP_COUNT` of the land's monster material (`R.up`, one kind for each of levels 2..5), at level 5 `BOSS_UP` trophies of the land's second boss, **and** raid material of the set's land: `RD_UP` = 4 / 8 / 16 / 32 (60 a piece, 360 a set). `rdUpNeeds` (`shared/raids.js`) is called by `upgradeNeeds`; `upgradeSkillP` checks and spends `need.rd`. A set's land is `SS_SETS[s.set].land`.

## 4. Code map and hooks

| Layer | File |
|---|---|
| shared | `shared/raids.js` (registry, layout, constants, `rdLevel`, `rdMatFor`, `rdUpNeeds`, `rdCapTier`, `rdCourtAt`), `shared/raids/<id>.js` x6, `RD_WARD_DEF` / `RD_SPAWNER_DEF` / `RD_BARRICADE_DEF` in `shared/monster-defs.js` |
| server | `server/raids.js` (build, lock, wards, banners, clear, pay, reset, the boss's sleep) |
| client | `game/raids/structure.js` (the six ruins: `buildRaids`, `RD_LOOKS`) and `structure-extras.js` (props and each land's dressing: `rdProps`, `rdExtras`), `game/raids/hud.js` (events, strip, map marks, bag rows), `moTotemWard` / `Banner` / `Barricade` in `game/combat/monster-totems.js`, `styles/30-raids.css`, `#rdStrip` in `index.html` |

Hooks into existing files (`grep -rn "raids:" src`):

| File | Hook |
|---|---|
| `server/monsters.js` | `makeMon` adopts what is made while `rdCtx` is set; `monRoster` sends level and health for `m.rd` (like a dungeon run's); `updateMonstersS` ticks a raid boss with `rdBossTickS` |
| `server/combat.js` | `damageMonsterS` asks `rdHitS`; `killMonsterS` calls `rdKilledS`; `rewardKill` returns early for `m.rd` |
| `server/boss.js` | `bossDefeatedS` -> `rdBossDownS`; `bossState` adds the raid bosses' rows (they are not in `BOSSES`) |
| `server/api.js` | `initRaidsS`, `rdTickS`, the `rdst` events on join, the raid bosses' telegraphs for a joiner |
| `server/players.js`, `server/economy.js` | `gear.rd` sanitized; `upgradeSkillP` takes raid material |
| `shared/drops.js` | `upgradeNeeds` -> `rdUpNeeds` for a signature piece |
| `game/net/client.js` | events `rdst`, `rdlv` |
| `game/combat/boss.js` | `arenaOf` -> the raid's court |
| `game/economy/skills.js`, `inventory.js`, `ui/map.js`, `main/loop.js`, `world/generation-setup.js` | price line, bag row, map marks and tooltip, strip, `buildRaids` |

Events (docs/PROTOCOL.md): `rdst` `[index, state 0 ready / 1 engaged / 2 cleared, tier, boss slot, stones left, banners left, garrison left, seconds to the rebuild, boss awake]` on every change and for each raid on join; `rdlv` `[level, ids]` when the tier locks.

## 5. Not done / to tune

- The meshes are first-pass blocks (walls, towers, braziers, banners and one extra per land); judge them with `tools/shot.js` at the sites. Barricades are cover only.
- `RD_UP`, the elite size, the reinforcement rate and the garrison kinds are untuned; nothing here is balanced by a playtest. Tiers VI and VII are untuned everywhere.
- Raid bosses use the world kits unchanged; a kit that reads an arena other than `B.A` has not been seen (the smoke test fights one raid boss).
