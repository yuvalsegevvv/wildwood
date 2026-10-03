# Dungeons: setup plan

**Status: planned, nothing is built.** This is the setup plan for dungeons as a feature: how an instance works on the server and the client, what to
add and where, in which order, and how to test it. It plans **no dungeon** (no names, themes, layouts or bosses): that comes later, as its own request,
on top of this framework. Choices marked **Recommended** are my proposal and wait for the owner's yes (section 11 collects them).

Symbols and files are named without line numbers (they move); `docs/MOBS.md` and `docs/EQUIPMENT.md` carry the exact `file:line`.

## 1. The two catalogs a dungeon is built from

The owner's requirement: the docs list every mob and every piece of equipment with its stats, and say where each is defined in the code.

| Doc | What it lists | Made by |
|---|---|---|
| `docs/MOBS.md` | all 74 monster definitions: 58 kinds (home rings, home edges, Sakura Vale, Hoarfrost Reach), 6 bosses with their move sets, 8 boss helpers (summons, props), 2 grey-veined monsters; level, element, HP, hits to kill, damage, attack interval, speed, aggro, XP, coins, count, zone, drop material, model, `file:line`; plus the 36 boss skills, the formulas, a level 1-30 table (what `defAt` gives a mob of that level) and the client model of each family | `node tools/gen-docs.js` |
| `docs/EQUIPMENT.md` | all 210 pieces of gear (7 pieces x 6 tiers x 5 rarities: attack, health, defense, level, price, sell price, crafting cost, `file:line`) and the 90 profession tools; the six tiers, the rarity multipliers, drop and merge rules | `node tools/gen-docs.js` |

Both are **generated from the live code** (`loadServer` in `tools/load.js`), so they cannot drift: after changing `monster-defs.js`, `items.js`,
`balance.js`, `drops.js`, a zone or a boss kit, run `node tools/gen-docs.js` (`npm run docs`); `node tools/gen-docs.js --check` exits 1 when a file is
stale. Every `file:line` in them is verified to exist when generated.

What a dungeon designer takes from where:

| Need | Take it from |
|---|---|
| a trash mob (or an elite) | a row of `MOBS.md` sections 4-7 by id; `dungeonMob(id, level, mods)` (section 5) makes it at the dungeon's level |
| a boss | `MOBS.md` section 8 (reuse a move set) or a new boss def + `BOSS_KITS.<kit>`; helpers in section 9 |
| how hard and how rewarding a level is | `MOBS.md` section 11 (player damage / health, mob HP, XP, coins, kills per level) |
| loot | `EQUIPMENT.md` sections 3-5 (tier by level, rarity rules, every id); materials `MATS` (`shared/drops.js`); boss skills `BOSS_SKILLS` |

## 2. Goals, and what is out of scope

- A dungeon is a closed, instanced place entered from the world through an entrance, with rooms of mobs and a boss at the end, left by finishing it, by a
  leave button or by the party falling.
- The framework must make the next dungeon a **data change** (one `DUNGEONS` row + at most a new boss kit), like adding a monster is today.
- It must not disturb the open world: no change to how camps, zones, the quest board, zone tiers or saves behave.
- Out of scope here: any dungeon's content, new gear tiers, new classes or skills, a full party system, levels 26-50 (planned in `docs/MAIN-QUEST.md` section 7).

## 3. What the code is like today, and what that means for dungeons

| Fact | Where | Consequence |
|---|---|---|
| One global world: `S` (players), `MONS`, `BOSSES`; no concept of an instance | `server/state.js`, `monsters.js`, `boss.js` | an instance is a **region of the same world** plus a tag, not a second server |
| Snapshots are per player and range-filtered (monsters 110 m, bosses 190 m, players 250 m, the rest once a second) | `server/api.js` `broadcastSnap` | places far apart are already isolated from each other for free: monsters, players and projectiles only see what is near |
| Events (`ev`) go to **every** client | `server/state.js`, `broadcastSnap` | instance events must reach only the instance's players (section 5.5); the same filter can later be extended by distance, which is the known gap in CLAUDE.md section 10 |
| A monster thinks when a player is within 110 m; `nearestFighter` / `anyPlayerNear` are distance based | `server/monsters.js` | no change needed for isolation; instances sit hundreds of metres apart |
| Monsters only avoid water (`getH < 0.4`) and the village; they walk through trees and would walk through dungeon walls | `server/monsters.js` `updateMonstersS` | needs a shared walk test (`dungeonWalk`) for monsters, players and aggro |
| `setPos` clamps the player to the world box (`WX0..WX1`, `WZ0..WZ1`) | `server/api.js` | the instance region needs an exemption, only while the player is in an instance |
| `getH` is the world's heightmap and **clamps to its edge** outside it | `server/world.js`, client `world/heightmap.js` | a floor override for the instance region on both sides, or the player falls / floats |
| One `B` (boss fight state) per `BOSS_DEFS` row, built once at start from `ARENAS`; a boss is a circle `{x,z,r}`; `bossState()` goes to everyone; a dead boss respawns after 120 s | `server/boss.js` `initBossS`, `updateBossS` | a dungeon boss needs its own `B` made on demand (extract `makeBossB(bd, A)`), no respawn, and its state sent only to the instance's players. The kits (`BOSS_KITS`) and `boss-fx.js` are reusable as they are |
| A monster's zone tier comes from `landAt(camp)`: x > `HALF` is the vale or the Reach | `shared/tiers.js` `landAt`, `monTierOf` | dungeon mobs would silently get the player's vale / Reach tier: `landAt` must return `'dungeon'` first. `zoneTierOn` already returns 0 for an unknown land |
| `rewardKill` rolls an item of tier `tierFor(level)` (the top gear tier, T6, from level 25 on) and the monster's own material | `server/combat.js` | dungeon loot needs its own table (section 5.6); dungeon-only mobs must stay **out of** `MON_DEFS` (it feeds camps, `genQuest`, `MATS` and `upgradeNeeds`): follow `GREY_DEFS` |
| Position is not saved: a new session spawns in the village; one account = one live session | `server/players.js` `newPlayer`, `api.js` `beginJoin` | instance membership is transient: leaving, disconnecting or a crash just ends it. Only progress (`gear.dg`) is saved |
| No party system; `hello` / accounts are per player | `server/api.js` | phase 1 is solo; groups come later and stay small (section 4, D4) |
| The Shared (room) mode sends **one** snapshot for everyone (4 KB) | `server/api.js` `io.broadcastSnaps` | dungeons are not available in Shared mode (Solo and the Node server only); the entrance explains it |
| The client streams terrain and plant chunks around `P.x, P.z`, draws sky, weather, far lands and music for the open world | `world/streaming.js`, `time-of-day.js`, `weather.js`, `far-lands.js`, `audio/music.js` | inside an instance the client switches to an "indoor" mode: no streaming, no terrain, weather, far lands or day sky; fixed lighting; the dungeon's own music |

## 4. Design decisions

**D1. Instance model: slots in a reserved region.** *Recommended.* East of the world box (`x > WX1 + 300`) the server reserves `DG_SLOTS` square slots
(proposal: 16 slots, 400 m apart). An instance takes a free slot; its layout is built around the slot's origin; players are moved there. Isolation
comes from distance, which the snapshot and AI code already honour.
*Alternatives:* (b) every instance on the same coordinates, with an `inst` tag filtered in AI, snapshots, projectiles, areas and events (about 60 call sites over
`S.players` / `MONS`, high risk of a leak); (c) a second `createWorldServer` per instance (the page and the Node host assume one; doubles the tick).

**D2. Layout: a pure, seeded function in `shared/`.** *Recommended.* `dungeonLayout(def, seed)` returns rooms, corridors, a walk grid and spawn points; client
and server call it with the same seed (the server sends the seed, like a village layout is shared today). A dungeon is authored as **room templates** the
seed assembles (a fixed number of rooms, fixed boss room), so a dungeon is neither fully hand-placed nor fully random. The format is in section 6.

**D3. Entrances: portals in the open world.** *Recommended.* A fixed outdoor spot per dungeon, drawn like a teleport circle, used with the talk key
(`useCircle` / `circlePrompt` in `game/village/talking.js` show the pattern) and gated by level and, if the designer wants, a quest or a boss kill
(`gear.east` / `gear.north` are the precedent). Inside, an exit portal in the start room. No entrance in the villages.

**D4. Groups: solo first, then up to 4.** *Recommended.* Phase 1 gives every player their own instance. Groups come later as "enter together": whoever stands
at the entrance when one member presses enter (or is invited by name) joins the same instance, up to `DG_PARTY_MAX`. A full party system (chat, UI,
shared quests) stays a separate feature. Scaling with group size is decided when groups are built (open question 2).

**D5. Difficulty is the dungeon's own, not the zone tier's.** *Recommended.* A dungeon has a level band; its mobs are made at a level with `defAt` and
run through the unchanged combat paths. Zone tiers do not apply inside (`landAt` returns `'dungeon'`). The level debuffs (-5% damage dealt / +5% taken per
level above you) already punish going in too low.

**D6. Rewards: the dungeon's table, the world's items.** *Recommended.* Kills inside still pay XP and coins (same formulas, from the mob's level) and the material
of the mob's kind if it has one. Item rolls come from the dungeon's loot table (`DUNGEONS[...].loot`): trash as in the world, elites better, the boss
`rollBossRarity` and a final chest. No new gear tier and no dungeon-only items in the first version (open question 4); the checklist for adding a tier is in
section 9.

**D7. Death and leaving.** *Recommended.* A knocked-out player respawns in the start room (the existing 3 s timer, `updatePlayersS`), with a limited number of
revives per run (`DG_REVIVES`, proposal 3); out of revives, or on leaving, the player returns to the entrance. When the last member is gone the instance
closes after a short grace (`DG_GRACE`, 30 s, so a disconnect can come back) and its mobs are removed.

**D8. No lockouts at first.** *Recommended.* Repeatable at will. Progress is recorded (first clear, best time, clears) so a lockout, a daily bonus (`sunrise()`
already resets the shops) or a keys system can be added without a save change.

**One framework, two uses (the Rootdeep).** `docs/WORLD.md` section 8 already says the Rootdeep (levels 30-47) "cannot be made from the heightmap" and needs
"its own kind of space: enclosed cave meshes, reached through a portal ... with its own lighting (no sun, no sky, no weather)". That is the enclosed-space half of
this plan: a region outside the heightmap with its own floor and walls (`getH` override, `dungeonWalk`), an indoor client mode and portal entrances. Build it once.
The difference is only how long a space lives: a dungeon is a **private instance** that is made on entry and torn down when empty; the Rootdeep is **one shared,
permanent space** with camps that respawn. The slot system can host it later as a fixed slot that is never torn down, with the normal camp AI (`m.inst` set, respawn on).

## 5. How an instance works

### 5.1 State and slots (new `server/dungeons.js`)

`DG={slots:[...], inst:new Map()}`; an instance is `{id, def, seed, slot, ox, oz, layout, members:Set(pid), mons:[...], boss:B|null, rooms:[state], revives,
t0, state:'open'|'cleared'|'closing', closeT}`. `updateDungeonsS(dt)` runs in `tick` (api.js) after the monsters: room triggers, clear detection, grace timers,
teardown (`removeMonS` for every instance monster, free the slot). `DG_MAX_INST` equals the slot count; a full server answers "all dungeons are busy".

### 5.2 Entering and leaving (message `dg`)

`dg{a:'enter', id}` -> `enterDungeonP(p,id)`: in range of that entrance, level in the band, unlocked, not already inside, alive, not in Shared mode -> take a slot,
build the layout, spawn the mobs (`spawnMonS` with the instance tag), move the player the way `warpP` does (`p.x,p.z`, `sendTo tp`, `ev warp`), send
`dgin`. `dg{a:'leave'}` and the exit portal call `leaveDungeonP(p,reason)`; `leave(pid)` in api.js calls it too. `setPos` accepts a position in the instance
region **only** if `p.inst` is set and `dungeonWalk(layout, x, z)` allows it (otherwise the player is put back, like the ice wall in `setPos`).

### 5.3 Mobs

`dungeonMob(baseId, level, mods)` in `shared/dungeons.js` returns a def copy at that level: `Object.assign({}, DEF_BY_ID[baseId], {id, zone:undefined, count:undefined}, mods)`
then `prepDef`, exactly what `greyDef` does today (and `zoneTierK` shows `defAt` takes any level). `mods` are `hpK`, `dmgPct`, `scale`, `aggro`, `glow`: an elite
is `hpK x2-3`. The result is added to `ALL_MON_DEFS` / `DEF_BY_ID` (not `MON_DEFS`), so `makeMon`, snapshots and the client's `addMonView` work unchanged (its
`pal` / model come from the base). Instance mobs have `m.inst`, `camp` inside their room, `temp:false` and **no respawn** (`updateMonstersS` skips
`respawnMonS` when `m.inst` is set). Walls: the walk test replaces the water check for them.

### 5.4 Bosses

Extract the body of `initBossS` into `makeBossB(bd, A)` and call it for each `BOSS_DEFS` row as today. An instance boss calls it with the boss room's
`{x,z,r}`. `bossDefeatedS` branches on `m.inst`: no 120 s respawn, the instance becomes `'cleared'`, the chest opens. `bossState()` takes the player
(`bossStateFor(p)`): world bosses for everyone, an instance boss only for its members. New boss defs follow `bossDef()` and a `BOSS_KITS.<kit>` in a new
`server/boss-kits-*.js`; the six existing kits can be reused with another def.

### 5.5 Events and snapshots

`ev(...)` stays for the world and still goes to everyone (chat, weather, toasts, joins). A new `evTo(inst, ...)` stores the instance with the event, and
`broadcastSnap` sends it only to the members of that instance (and no instance event reaches the open world). `pl` (the players list) shows each player their own
side, instance or world. In the room (Shared) mode there is one message for everyone, so entrances are disabled there.

### 5.6 Rewards and saves

`rewardKill(q,m)`: when `m.inst`, XP, coins and the material are as today (`monK` returns the identity because the land is `'dungeon'`) and the **item roll**
uses `instanceLoot(m)` instead of `rollMonsterRarity` / `rollBossRarity` and `tierFor(K.lv)`. A cleared instance gives each member the chest once (`dgdone`
event with the result). `gear.dg = {v:1, done:{id:n}, best:{id:seconds}, first:{id:1}}` is sanitized by `sanitizeDg` (new, in `server/dungeons.js`, called from
`sanitizeGear`) with a default in `newGearFor`; old saves get `{}`. A dungeon's own materials (if wanted) need `MATS` extended past `MON_DEFS` + bosses
(`shared/drops.js`).

### 5.7 The client

- `dgin [pid,id,seed,slot,ox,oz]` -> `enterDungeonView`: build the layout meshes at the slot (`game/world/dungeon-build.js`: merged geometry with vertex colours,
  `pc` / `paint`; any `InstancedMesh` must carry `instanceColor`), hide terrain, plants, far lands and weather, fixed lighting and fog, the dungeon's music
  theme (`musicThemeHere`), no map (or a room map), stop `streamPump`. `dgout` undoes it and returns to the world view.
- `getH` and `worldBounds` (`game/player/movement.js`) return the floor and the walls of the layout while inside.
- HUD (`game/ui/dungeon-ui.js`, `styles/23-dungeons.css`): the room or progress, revives left, leave button, the result panel. The entrance prompt is in `talking.js`.
- Everything per-instance is torn down on `dgout` / `kicked` / `netReset`.

## 6. The data a dungeon is (the schema, with placeholder values)

A future row of `DUNGEONS` in `shared/dungeons.js`. Illustrative: this is the **shape**, not a dungeon.

```js
{ id:'example', name:'<name>', land:'home'|'vale'|'hoar',            // where the entrance stands (ties it to a map)
  entrance:{x,z},                                                    // the portal in the world (found like the arenas: a flat spot near x,z)
  band:[lo,hi],                                                      // level range: the mobs' level is picked in it; the gate is `lo`
  party:1,                                                           // players allowed (1 until groups exist)
  unlock:null,                                                       // null | {boss:'akaoni'} | {quest:'..'} | {level:n}
  theme:{music:'<theme>',light:0x..,fog:[near,far]},
  rooms:[                                                            // templates, assembled by dungeonLayout(def, seed)
    {kind:'start'}, {kind:'fight', size:[w,d], mobs:[{id:'<MON_DEFS id>',n:6,lv:'band'}]},
    {kind:'elite', mobs:[{id:'..',n:1,lv:'band+1',mods:{hpK:2.5}}]},
    {kind:'boss', boss:{def:'<BOSS_DEFS def id>',lv:..}} ],
  loot:{trash:'world', elite:{rarityBoost:1}, boss:'boss', chest:{rolls:2}},   // names a rule, not new items
  rewards:{first:{coins:..}} }
```

`validateDungeon(row)` (run by the smoke test) checks every `id` exists in `ALL_MON_DEFS` / `BOSS_DEFS`, every level is inside `band`, the room graph
connects start to boss, and the totals (section 8) are inside the budget.

## 7. Files

**New:** `src/shared/dungeons.js` (the `DUNGEONS` registry, `dungeonMob`, `validateDungeon`, `DG_*` constants, `landAt` helper `inDungeonSpace`),
`src/shared/dungeon-layout.js` (pure `dungeonLayout`, `dungeonWalk`, `dungeonRoomAt`), `src/server/dungeons.js` (slots, instances, enter / leave,
spawn, clear, loot, `sanitizeDg`), `src/game/world/dungeon-build.js` (meshes), `src/game/ui/dungeon-ui.js` + `src/styles/23-dungeons.css`,
`tools/dungeons-smoke.js`. Add each to `src/manifest.json` (the shared files load into both bundles, `dungeons.js` after `monster-defs.js`, `tiers.js` and `items.js`), start each with a
`//@` line and update `docs/FILES.md` (`python3 build.py --index`). Names: prefix `dungeon*` / `DG_*` (unique per bundle: `python3 build.py --check`).

**Touched:**

| File | Change |
|---|---|
| `server/api.js` | `case 'dg'` in `receive`; `leave` and `setPos` (instance exemption); `updateDungeonsS` in `tick`; `broadcastSnap`: event / player / boss filtering per instance |
| `server/state.js` | `evTo(inst,...)` next to `ev` |
| `server/monsters.js` | `m.inst`; skip respawn for instance mobs; the walk test instead of the water check |
| `server/boss.js` | `makeBossB`, `bossStateFor(p)`, `bossDefeatedS` branch on `m.inst` |
| `server/combat.js` | `rewardKill`: the instance's item roll; `killMonsterS`: tell the instance (clear tracking) |
| `server/players.js` | `sanitizeGear` calls `sanitizeDg`; death inside an instance respawns in the start room (`updatePlayersS`) |
| `shared/tiers.js` | `landAt` returns `'dungeon'` for the instance region |
| `shared/items.js` | `newGearFor`: `dg:{}` |
| `server/world.js`, `game/world/heightmap.js` | `getH` floor override in the instance region (floor height at least 1.5: monsters treat `getH < 0.4` as water) |
| `game/player/movement.js` | `worldBounds` and ground from the layout while inside |
| `game/net/client.js` | `applyEvent` cases `dgin`, `dgout`, `dgroom`, `dgdone`; boss state per instance |
| `game/village/talking.js` | the entrance prompt, like `circlePrompt` |
| `game/world/streaming.js`, `time-of-day.js`, `weather.js`, `far-lands.js`, `audio/music.js`, `ui/map.js` | the indoor mode |
| `server/economy.js` (`devP`), `ui/settings-testing.js` | testing tools: "enter dungeon", "clear room" (never in a production build: `--no-dev`) |
| `shared/drops.js` | only if dungeon-only materials are wanted: `MATS` beyond `MON_DEFS` |
| `CLAUDE.md`, `docs/FILES.md`, `tools/README.md` | one row each |

## 8. Balance rules for the first dungeons (to be confirmed by the owner)

Use `MOBS.md` section 11. A run should pay about what the same time in the world pays, plus the chest:

- **Mob level** inside `band`; an elite +1 level or `hpK x2-3` (the grey monsters are `hpK x2.2-2.6`, XP x3); a boss uses the boss formulas (70 hits, 16% damage, XP x25, coins x20).
- **Budget** (checked by `validateDungeon` and printed by the smoke test): total mob HP / (player damage at `lo`) = hits to clear; total XP and coins of a full clear; room count. Target proposals: 5-8 rooms, 8-12 mobs a room, a clear in 15-25 minutes alone, total XP of a clear about 150-250 same-level kills, coins in proportion.
- **Loot**: the world's rates for trash (2% / 0.5% / 0.1%); elites one rarity step better; the boss `rollBossRarity`; the chest two boss rolls. Tier is `tierFor(level)`: nothing beyond T6 until the owner decides (question 4).
- **Pacing**: mobs aggro as in the world (`aggro` by family) and a room's mobs only wake when a player enters the room, so a clear is a series of fights and not one big pull.

## 9. Adding a gear tier (only if dungeons are to drop gear above T6)

The checklist, from `EQUIPMENT.md`: `TIER_LV`, `SLOT_NAMES` (7 arrays), `PRICE`, `ARMOR_LOOK` (4 arrays) in `shared/items.js`; `TIER_ATK`, `ARMOR_HP`, `ARMOR_DEF`,
`tierFor`, the `expDmg` / `expHP` curves in `shared/balance.js`; `TOOL_MAT`, `TOOL_PRICE` (items.js), `ORE_GRADES`, `LOG_GRADES`, the node plan and `HERB_LANDS` in
`shared/professions.js`; `CRAFT_BASE` in `shared/crafting.js`; icons in `game/ui/item-icons.js`; the looks in `game/character/model.js` if a new `hat` / `top` style is wanted.
The generated docs then show the new tier by themselves.

## 10. Tests and phases (each phase small, testable and reviewable on its own)

| Phase | Delivers | Checks (`tools/dungeons-smoke.js`, server from `src/`) |
|---|---|---|
| 0 (done) | `docs/MOBS.md`, `docs/EQUIPMENT.md`, `tools/gen-docs.js`, this plan | `node tools/gen-docs.js --check` |
| 1 Empty instance | slots, region, `getH` floor, `enterDungeonP` / `leaveDungeonP`, `evTo`, per-player filtering; a testing-tool "enter dungeon" with one flat room | enter and leave; two players in two instances see nothing of each other (snapshots, events, projectiles); a world monster never reaches an instance; saves and positions unchanged; all existing smoke tests (`npm test`) still pass |
| 2 Rooms and mobs | `dungeonLayout`, walk test (server and client), meshes, `dungeonMob`, room wake-up, clear tracking | same seed = same layout on both sides; mobs stay in their room and inside walls; no respawn; XP and coins as in the world; `monK` identity (no vale tier leaks) |
| 3 Boss room | `makeBossB`, `bossStateFor`, instance boss, completion | a boss fights through its three phases inside an instance (as `tools/boss-smoke.js` does for the world); the world's six bosses unchanged |
| 4 Rewards and saves | `instanceLoot`, chest, `gear.dg`, `sanitizeDg` | loot rarity rates; old saves; first clear once; chest once |
| 5 Entrances and UI | world portals, gates, HUD, indoor mode, music | `client-smoke` additions (enter, the HUD, back out), no streaming inside, no bare `InstancedMesh` |
| 6 Groups | enter together, scaling, shared clear | two players one instance; one leaves; both die |
| 7 First dungeon | content, as a separate request | `validateDungeon` and the budget print |

## 11. Questions for the owner (my recommendation first)

1. **Instance model**: slots in a reserved region (D1). OK?
2. **Groups**: solo first, then up to 4; how should mobs scale with group size (more HP only, or more mobs)?
3. **Zone tiers inside dungeons**: none, the dungeon has its own difficulty (D5). Or should a dungeon also have I / II / III settings?
4. **Loot**: no new gear tier and no dungeon-only items at first (D6). Do you want exclusive items or materials, and gear above T6?
5. **Death**: respawn in the dungeon with 3 revives (D7), or out at once?
6. **Lockouts**: none at first (D8)?
7. **Entrances**: portals in the open world, gated by level and a quest or boss kill (D3)?
8. **Shared (room) mode**: no dungeons there (the room channel is one shared 4 KB topic).
9. **Level bands**: the world runs to level 30 (`MAX_ZONE_LV`); levels 26-50 are planned but unbuilt. Should the first dungeons sit inside 1-30?
10. **Layout**: authored room templates assembled by a seed (D2), or fully fixed layouts?

## 12. Risks (lessons already in CLAUDE.md section 8)

Duplicate top-level names (prefix everything); `monK` / `landAt` leaking the vale or Reach tier into the region; the instance region being treated as water
(`getH < 0.4`) or as the vale by the many `inVale(x)` checks (the client's indoor mode must come first); snapshot size (instances are small, but filter events
before sending); a bare `InstancedMesh` crashing the render loop; a boss `B` left behind on teardown (`clearBossFxS`, `removeMonS`); new save fields must be
sanitized with a default; constants used at load (`DG_*`) must be defined before their first use (the files are concatenated: a top-level `const` used too early throws); the headless client has no layout, so test the client part by reading game variables.
