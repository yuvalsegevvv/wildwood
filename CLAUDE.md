# Wildwood: guide for agents

Read this file first. It is a router: it lets you work on the game **without reading the whole codebase** (about 24,000 lines of JavaScript in 245 files). Open only the files your task touches, and the one area guide it points to (`docs/areas/`).

Wildwood is a multiplayer 3D forest RPG in the browser: three.js r128 client, an authoritative world server that runs in the browser tab (solo / shared room) or in Node (the deployed MMO), and a procedural world of four lands (the home forest, the Sakura Vale east of the mountains, the Hoarfrost Reach north of it, the Greyspine north-west of the forest) with four villages, about 1,200 monsters, eight bosses, a main quest (acts I-IV, levels 1-32), three professions, crafting and brewing, zone tiers, 3 classes with equippable skills and elements, items in 5 rarities, chat, accounts and server-side saves (Postgres on Neon). The full overview is in `docs/areas/README.md`.

- Repository: https://github.com/yuvalsegevvv/wildwood (Render deploys every push to `main`).
- The owner also playtests a build published as a claude.ai artifact (Claude app on a phone): the page plus the music files next to it (`docs/DEPLOY.md`).
- Owner preferences: iterative feature requests; keep token use low (targeted reads, targeted tests);
  **do not commit or push unless asked**; when only one part changes (e.g. the character model), test
  only that part.

**The work loop** (each step is one command, sections 1 and 6 say more): `node tools/doctor.js` once per checkout (is it ready? it names the fix for anything missing) → find the files (section 4, `docs/FILES.md`, `grep -n`) → edit → `python3 build.py --check` (syntax, duplicate names, layout rules, the test registry, doc pointers) → `node tools/run-tests.js` (the tests that cover your diff, in parallel; `--fast` / `--all` before a commit) → for what numbers cannot judge (colours, models, a panel) look at it: `tools/shot.js`, `tools/model-preview.js`, `tools/monster-preview.js`. Server code: `npm run fuzz` and `npm run bench` show what a change did to robustness and to the tick.

## 1. How to find things (do this instead of reading files)

1. `docs/FILES.md` lists every source file with a one-line description (the file's first line). It is generated: after adding, renaming or re-describing a file run `python3 build.py --write-index` (`--check` fails when it is stale).
2. Section 4 below maps common tasks to files.
3. `grep -n "name" -r src/` to find a function; then open only a line range.
4. Every file starts with `//@ one-line description` (`--check` fails without it). Keep that line accurate when you edit.
5. **Design and reference docs** (what is planned, spoilers, the numbers of every mob and item): the table at the end of `docs/areas/README.md`. The ones you will need most: `docs/WORLD.md` before a new region, village or boss; `docs/NOT-BUILT.md` for what is not built yet (and the ideas list: ask the owner before starting one); `docs/MOBS.md` / `docs/EQUIPMENT.md` for every monster's and item's stats and the `file:line` it is defined at (generated: `node tools/gen-docs.js` after changing monsters, items, balance, drops, zones, boss kits or the dungeons' bosses and gear).
6. **Area guides**: `docs/areas/README.md` says which guide to open (the long detail of each section-4 row, the pitfalls and reference numbers of that area). Tests and the browser-pane workflow: `docs/TESTING.md`. Deploy, the database and publishing the playtest artifact: `docs/DEPLOY.md`.

## 2. Architecture in one screen

```
src/shared/   pure rules and data (no DOM, no three.js): terrain, village layout, zones, balance, monster /
              item / quest / class+skill definitions. Loaded into BOTH the client and the server bundles.
src/server/   the authoritative world server: players, monsters AI, combat, boss, economy, weather, api.
src/node/     Node host: HTTP (page, music files) + zero-dependency WebSocket, save storage (files or Postgres), shutdown.
src/game/     the client: rendering, input, audio, UI panels, views of server state, net/ transports.
src/styles/   CSS in cascade order.     src/index.html  page shell + all HUD/panel markup.
src/manifest.json   load order of every group ("@shared" marks where shared files go in the client).
build.py      concatenates everything → dist/wildwood.html (the page) and dist/wildwood-server.js (Node).
tools/        headless tests and a model preview renderer (section 6).
```

**Bundles share one scope.** Files in a group are concatenated into one function, in manifest order:

- client: `function wildwoodMain(){ core/setup, @shared..., the rest of game/ }`
- server: `function createWorldServer(io){ shared..., server... ; return api }`

The two scopes never see each other; they talk only through JSON messages. Consequences:

- **Every top-level name must be unique within its bundle.** A second `function x` silently replaces
  the first (this caused real bugs: `shade`, `tone`, `hex`, `boltMat`). `python3 build.py --check`
  now fails on duplicates, including names declared in one line (`const a=1, b=2`).
- Order matters only for top-level code that runs at load. Functions can be called across files at
  runtime. A top-level `const` used before its file runs throws (TDZ): use `var` (see `NET`) or guard.
- No imports/modules. Globals like `THREE`, `$`, `scene`, `camera`, `P` (player state), `PL` (stats
  mirror), `GEAR` (items/quests/skills mirror), `MONS`, `NET` are just top-level names.

**Three ways the same server runs** (`src/game/net/transport.js`):

| Mode | Server runs in | Saves |
|---|---|---|
| Solo | the player's own tab (`createWorldServer` in the page) | browser localStorage |
| Shared | one elected player's tab (claude.ai `room` capability, topics `c`/`s`, 4 KB messages) | browser |
| This server | Node (`dist/wildwood-server.js`), the Render deploy | server: Postgres (Neon) in production, files locally |

**Who owns what**: the server owns monsters, combat results, HP, XP, levels, coins, items, quests,
skills loadout, the clock and the weather. The client owns rendering, its own movement (sent 10×/s),
animations, sounds, UI, villagers/animals/vegetation (identical per player, not synced).

## 3. Protocol (every message, field and event: `docs/PROTOCOL.md`; the code: `src/server/api.js` top comment, `src/game/net/client.js`)

- Client → server: JSON messages `{t:'<type>',...}` handled by the `receive()` switch in `server/api.js` (plus the types feature files register in `MSG`): `hello`, `pos`, `atk`, `equip`, `buy`, `chat`, `dev`, `party`, `dg`... Server → client: `welcome`, `mons` (roster), `you` (private state incl. `gear`), `tp`, `auth`, and `snap{day,n,pl,mo,b,w,ev}` 8-20×/s, **made per player**: `mo` holds only the monsters you can see and only when changed (ranges and rates: `SNAP_*` in `server/api.js`, `broadcastSnap`), `ev` is the event list, applied by `applyEvent` in `net/client.js` (the events and their fields are in `docs/PROTOCOL.md`).
- To add a feature that changes state: handle a message in `receive()` (server/api.js) or register `MSG.<type>`, mutate state, call `ev('name', ...)` and/or set `p.dirty=true` (→ a `you` update + save), then handle the event in `applyEvent` on the client, and add the message and event to `docs/PROTOCOL.md`.

## 4. Where to change what

Short rows: the files that matter. A row ending in `→ docs/areas/<x>.md` has the long detail there (index: `docs/areas/README.md`).

| Task | Files |
|---|---|
| Look up a monster's or an item's numbers, or where it is defined | `docs/MOBS.md`, `docs/EQUIPMENT.md` (generated: `node tools/gen-docs.js`; `--check` says whether they are current) |
| Balance formulas (HP, damage, XP curve, coins, 1.5× for level 10-15) | `shared/balance.js` |
| Monster stats / new monster | `shared/monster-defs.js` (data; the look flags in `pal` and the guideline for a new monster's element are in `docs/areas/monsters-bosses.md`), `game/combat/monsters.js` (the views: `addMonView`, `updateMonsters`, `animateMonster`), `server/monsters.js` (spawn counts `MON_COUNT`, AI) |
| How a monster or boss looks (models, animation, look flags) | `game/combat/monster-*.js`: one file per family, each fills `MODELS.<model>={geo,build,anim}`; helpers in `monster-parts.js`. **See them**: `node tools/monster-preview.js out.png --ids oni,boss` → `docs/areas/monsters-bosses.md` |
| Boss mechanics / visuals (eight bosses: the Greyspine's two have kits in `boss-kits-grey.js`) | `BOSS_DEFS` (`shared/monster-defs.js`) → server `boss.js` (the shared part), `boss-fx.js` (move primitives), `boss-kits-*.js` (`BOSS_KITS.<kit>`) → client `game/combat/boss.js`, `boss-fx.js`; test `node tools/boss-smoke.js` → `docs/areas/monsters-bosses.md` |
| Carapax, the Tide King (level 20, the south beach) | `shared/beach.js` (`ARENA_TIDE`), `CARAPAX_DEF`, `game/village/buildings-beach.js` → `docs/areas/monsters-bosses.md` |
| Hoarfrost Reach (levels 22-30): the plateau, Frostgate Pass and its ice wall, Rimehold `VIL3`, zones `h22`-`h30`, two boss arenas | `shared/hoarfrost.js` (pass, village, zones, arenas, `CIRCLES`), `hoarHeight` in `shared/terrain.js`; the gate: `frostWall` (`movement.js`) + `setPos` (`api.js`), saved as `gear.north`; meshes `game/village/buildings-hoar.js` → `docs/areas/regions.md` |
| The Greyspine (4th land, levels 26-32): the ground and its walls, the glacier valley and its ice fall (`gear.west`), Highmark `VIL4`, zones `g26`-`g32`, 14 monsters, the Gryphon Queen and the Mountain Golem, tarns / river / fjord, the two rock falls (`gear.river`, `gear.neck`), zone tiers (not in the symbol), its dungeon the Blackseam (a mine, boss Garrick; `docs/DUNGEON-THEMES.md` section 9) | `shared/greyspine.js`, `highmark.js`, `greyzones.js`; `server/boss-kits-grey.js`; `game/village/buildings-grey.js`, `game/combat/monster-gryphon.js`; test `node tools/greyspine-smoke.js` → `docs/areas/greyspine.md` |
| Snow instead of rain in the Reach, and on the Greyspine's peaks (by the ground's height: rain in its valleys, sleet on the slopes); the aurora | `WX.snow` in `game/world/weather.js` (`greySnowAmt`, `shared/greyspine.js`), `game/world/aurora.js`, wind in `game/audio/rain.js` and `driver.js` → `docs/areas/regions.md` |
| Professions (mining, woodcutting, gathering): the Wayfarers' Lodge, resource nodes, resources | `shared/professions.js` (`NODES`, `RES`, `PROFS`, `nodeBlock`, `castTime`), `server/professions.js` (`gatherP`; `gear.prof`, `gear.res`), `game/economy/professions.js`; test `node tools/professions-smoke.js` → `docs/areas/professions.md` |
| Zone tiers (a harder setting per land, tiers I-V, opened by its second boss) | `shared/tiers.js` (`zoneTierK`, `landAt`), `server/tiers.js`, `game/economy/tiers.js`. The tier is per player and a monster exists once: always go through `monK(m,p)` (`damageMonsterS`, `hurtP`, `rewardKill`); above level 60 monsters creep tougher and bosses stronger (`LATE_CREEP_*`, `BOSS_CREEP_*` in `defAt`), and the level debuff on your damage stops at x0.5 (`lvDmgK`, `balance.js`); test `node tools/tiers-smoke.js`, balance yardstick `node tools/boss-duel.js` → `docs/areas/tiers.md` |
| Tools (pickaxe, axe, sickle: slots `eq.pick`, `eq.axe`, `eq.sickle`) | `TOOL_*` in `shared/items.js`; `equipP` / `buyP` / `sanitizeGear`; `BODY_SLOTS` in `game/economy/inventory.js` → `docs/areas/professions.md` |
| Crafting (weapons from ore, armour from logs) and brewing (potions from herbs) | `shared/crafting.js`, `server/crafting.js` (`craftP`, `brewP`), `game/economy/crafting.js`, `21-crafting.css` → `docs/areas/professions.md` |
| Potions (drinking, buffs, the belt, keys Z / X / C) | `drinkP` (`server/crafting.js`), `game/ui/potions.js`; counts in `gear.pot` → `docs/areas/professions.md` |
| Teleport circles and their travel window | `CIRCLES` (`shared/hoarfrost.js`), `warpP` (`server/players.js`), `game/village/talking.js`, `game/ui/travel.js` → `docs/areas/regions.md` |
| The lands' borders (curves, not the rectangle's sides: `borderX(z)`, `borderZ(x)`, pinned at the gates), the Greyfall River (the Vale Wall south of the junction, crossed by one bridge) and the Greyfall waterfall; **land tests take both coordinates**: `inVale(x,z)`, `landAt(x,z)` | `shared/terrain.js` (`borderX`, `borderZ`, `wallAdd`, `riverK`, `riverCut`, `FALL`, `fallCut`), `game/village/buildings-greyfall.js`, the clamps in `game/player/movement.js`; test `node tools/greyfall-smoke.js` → `docs/areas/regions.md` |
| The continent's coast (an L-shaped outline with capes, bays and islets; no mountain wall on the north or east edge; the Reach's size: `NORTH_D`, `EAST_W`, `VALE_E`, `GREY_N`; the Warlord Isles in the vale's old south-east corner, with zone 24 on them) | `shared/coasts.js` (`CS_BASE` is the designed outline, `CS_ISLANDS`, `CS_HOLD`, `CS_ISLES`, `csOuter`), `VALE_SEEDS` (`vale.js`), The Isle Road (`roads.js`), `coastDist` / `shore` in `shared/terrain.js`, `terrain-color.js` (shingle); keep arenas and doors off the edge (`CS_HOLD`); test `node tools/coasts-smoke.js` → `docs/areas/regions.md` |
| Movement limits: the slope limit (`SLOPE_MAX`, a step climbing more than 1.2 m a metre is turned along the face or dropped), the border clamps that act only while a land is locked, the bridge's gate | `slopeBlock`, `worldBounds`, `glenWall`, `frostWall`, `greyWall` in `game/player/movement.js`; test `node tools/slope-smoke.js` (everything stays reachable), `client-smoke` → `docs/areas/regions.md` |
| Sakura Vale: the Greyfall bridge `TUN` (once a tunnel), Hanami `VIL2`, zones, arenas, `vilAt` | `shared/vale.js`, `game/village/buildings-vale.js` (`buildBridge`), the bridge's gate and parapets in `worldBounds` (`movement.js`), unlock / `warpP` (`server/players.js`) → `docs/areas/regions.md` |
| Glasswell, the Sunscar's desert city (**only its 3D model exists, it is not placed in the world**; the layout is generated by `docs/glasswell-plan.py --js src/shared/sunscar.js`: change the script, not `shared/sunscar.js`) | `shared/sunscar.js`, `sunscar-shape.js` (`gwRimH`), `game/village/sun-*.js` + `buildings-sun.js` (`buildGlasswell`); see it with `node tools/city-preview.js out/`; test `node tools/glasswell-smoke.js`; design `docs/DESERT-CITY.md`, what is missing `docs/NOT-BUILT.md` section 2 → `docs/areas/regions.md` |
| Items, rarity, prices, drop rates, merge | `shared/items.js` (`RARITY`, `RAR_MULT`, `rollMonsterRarity`, `rollBossRarity`, `shopPrice`) |
| Item icons | `game/ui/item-icons.js` |
| Skills (all 3 slots, all classes) | `shared/classes.js` (`SKILLS`, `abilityOf`) → `server/combat.js` (`resolveHitS`) → `game/combat/skill-fx.js`, `attacks.js`. A new attack path must hand its element to `damageMonsterS` → `docs/areas/skills-items.md` |
| Boss skills (48, dropped by bosses at 10% each) and generic skill effects (`fx`) | rows with `drop:'<boss id>'` in `SKILLS`, `BOSS_SKILLS` (`shared/drops.js`), `resolveFxS` (`server/combat.js`), `skill-fx.js`; a skill with `fx` needs no server or client code → `docs/areas/skills-items.md` |
| Elements (`el` on skills and monsters, the soul bound at level 15, the x1.5 rules) | `shared/elements.js`, `elemHitS` / `rollDmgS` (`server/combat.js`), `bindSoulP`, `game/economy/soul.js` → `docs/areas/skills-items.md` |
| Elemental reactions (a hit of an element leaves an aura, two elements react into two flavour statuses, a skill's `flavor` / `status` keys apply one directly, shared non-stacking `vuln` / `weak` on monsters; **built**, no kit uses it yet; `RX_ON` switches it off) | `shared/reactions.js` + `reactions-chart.js` (data), `server/reactions.js` (engine; its hooks are marked `// reactions:`), `game/combat/reactions.js` (the aura marker, names); test `node tools/reactions-smoke.js` → `docs/REACTIONS.md` |
| Skill sets (**built**: the engine and the first eight sets, each one data file; version 2 only: every player may unlock any set and wear any outfit, `ft` message, `#tFree`: remove when M3 / M4 land, list in `server/skillsets-free.js`'s header) | `shared/skillsets.js` (registry), `shared/skillsets/<id>.js` (one per set), `server/skillsets.js` (grants, wearing, marks, conditions, triggers; hooks marked `// skillsets:`), `game/skillsets/` (panel: each set's `emblem` symbol and the set-effect cards; marks, looks), `game/economy/skillsets.js`; tests `node tools/skillsets-smoke.js`, `skillsets-first8-smoke.js`, `skillsets-ladder.js` → `docs/SKILL-SETS.md` (section 0, and its last section is the full code map), `docs/skillkits/AUTHORING.md`, `docs/skillkits/VISUALS.md` |
| Skill levels / upgrades and monster drops | `shared/drops.js` (`upgradeNeeds`), `shared/classes.js` (`skillPower`), `upgradeSkillP`, `addMatP` → `docs/areas/skills-items.md` |
| **Where a skill set comes from** (a world boss kill or a won dungeon run at +1 or above: 10% / 20% with a sure drop at the 20th / 10th qualifying clear; the free testing tools stay) | `SS_CHANCE_*` / `SS_PITY_*`, `ssSourceOf`, `ssOddsOf`, `ssSetFor` (`shared/skillsets.js`); `ssClearP` / `ssBossClearP` / `ssDungeonClearP` / `ssSanitizeSave` (`server/skillsets.js`), hooks in `rewardKill` and `dgWinS`; saved as `gear.ss.pity`; test `node tools/skillset-sources-smoke.js` → `docs/SKILL-SETS.md` section 7 |
| **The Trial Roots** (version 2: the Hollow Roots at level 5, every mission type always open, open to anyone, pays nothing; entered at the Trial Gate in the home village) | `defineDungeonVariant` + `DG_TRIAL_GATE` + the `trial` rules (`dgLevel`, `dgUnlocked`, `dgGateOpen`, `dgTierFor`, `dgOffer`) in `shared/dungeons.js`; the theme `shared/dungeons/themes/trial.js`; no pay: `theme.trial` checks in `server/dungeons/` (`mobs.js` kills, `fx.js` chests, `runs.js` records); the gate mesh `dgTrialGate` in `game/village/buildings-dungeon.js`, the board text in `game/dungeon/board.js`; test `node tools/trial-dungeon-smoke.js` → `docs/DUNGEON-THEMES.md` section 10 |
| Passive skills (class-universal; its three slots open at levels 13 / 16 / 20) | `PASSIVES`, `PASSIVE_SLOT_LV` / `passiveOpen(level)` (`shared/classes.js`), `psP(p,stat)` on the server → `docs/areas/skills-items.md` |
| The skills panel (tabs, drag and drop onto slots) | `game/economy/skills.js` (`skTile`, `skInfoHtml`, `SKD` drag state; styles `18-skills.css`); test `client-smoke` |
| Quest board generation / rewards | `shared/quests.js` (`genQuest`, `huntCount`, `questRewardFor`); server actions `server/economy.js`; panel `game/economy/quests.js` |
| Shops / forge / skills panel / inventory | `game/economy/shops.js`, `forge.js`, `skills.js`, `inventory.js` (+ server `economy.js`) |
| Village layout, board, stalls | `shared/village-layout.js` (positions, colliders `V.boxes`), `game/village/buildings.js` (meshes) |
| NPCs (who, where, role, lines, labels; Rimehold's and Highmark's people are built in the background after the loading screen: `NPC_DEFER`) | `game/village/villagers.js` (`VILLAGERS`), `talking.js` (`openRolePanel`), `npc-labels.js` |
| Character body, face, hair, hats (anime proportions, 31 sliders, recommended setups per character model; **read `docs/CHARACTER.md` first**) | `game/character/model-body.js` / `model-face.js` / `model-hair.js` / `model-parts.js`, assembled by `model.js` (`buildCharacter(look,{q})`, `randomLook`, `LOOK_M` / `LOOK_F`); the slider table and `CHAR_MODELS` in `shared/character.js`; `ARMOR_LOOK` (`shared/items.js`); `EDIT` in `game/ui/character-editor.js`; tests `character-smoke`; see it: `node tools/model-preview.js out.png` → `docs/CHARACTER.md`, `docs/areas/character-ui.md` |
| **Signature outfits** (the eight characters of `docs/skillkits/`; cosmetic, no skill touched; its seven pieces mix: the look's `top`/`bottom`/`shoes`/`hat`/`hair`/`faceItem`/`weaponItem` each hold a base value or an outfit id, `look.model='<id>'` puts a whole set on; the editor's rows list every piece; the Signature tab sets a character up in one tap; `tint<Slot>` recolours a worn piece, a kit declares `main` colours; **the editor has no class row: class is the weapon you hold**) | `game/outfits/<id>.js`: `CHAR_MODELS.<id>` (one reference setup) + `OUTFITS.<id>` (a kit of hooks: `paint`, `torso`, `shoulder`, `hips`, `thigh`, `shin`, `head`, `hair`, `mark`, `extras(rig,X,has)`, `dress` the weapon dressing applied by `weaponsOn`; `bootTop` / `shinCut` / `own` say which slot owns what); helpers and the mixing `character/outfit-tools.js` (`ofPieces`, `ofWear`); hooks and rules **`docs/CHARACTER.md` section 9** (`dunstan.js` is the worked example); designs `docs/skillkits/looks/`; tests `node tools/outfit-smoke.js [--only id]`, `outfit-looks-check.js`; see it `node tools/model-preview.js out.png --outfit id [--weapon warrior]` |
| Start card: Log in / Register / Play as guest, loading, `beginPlay` | `game/ui/start-screen.js` (`enterWorld`), `#start` in `index.html`, `game/ui/account.js`; test `node tools/start-smoke.js` → `docs/areas/accounts-net.md` |
| Animations | `game/character/pose.js` (`poseRig`; skill anims borrow kinds via `ANIM_OF`) |
| World size, lakes, terrain | `shared/terrain.js` (`SIZE`, `LAKES`, `hillShape`), `noise.js`, `zones.js`; the server samples height on a 4 m grid, so nothing finer than 8-16 m → `docs/areas/world.md` |
| The ground you see (colours, per-pixel detail) and the far lands (tiles far from the spawn are coloured when you near them: `terrainTileColors`, stream job 'k', and are not drawn until `ready`) | `terrainMaterial`, `groundShade`, `terrainTileColors` (`game/world/generation-setup.js`), `terrain-color.js`, `far-lands.js`, the scheduler `game/world/streaming.js` → `docs/areas/world.md`, `render.md` |
| The lands' edges (shore, Sunwall, Redgate, snowy rims), the edge zones and their monsters | `shared/terrain.js` (`coastDist`, `shore`, `sunwall`), `shared/zones.js` (`EDGE_ZONES`, `edgeZoneAt`), `worldBounds` (`movement.js`) → `docs/areas/world.md` |
| Roads, the river bridge, the plank causeways | `shared/roads.js` (`ROADS`, `BRIDGES`), `game/world/bridges.js` → `docs/areas/world.md` |
| The main quest line (acts I-IV) | `shared/main-quest.js` (`MQ`; **a step inserted in the middle shifts saves: bump `MQ_VER`, add it to `MQ_INSERTED`**), `server/main-quest.js`, `game/economy/main-quest.js`; test `node tools/mainquest-smoke.js`; design `docs/MAIN-QUEST.md`, story `docs/STORY.md` → `docs/areas/main-quest.md` |
| Vegetation / animals | `game/world/plant-models*.js`, `grass-models.js`, `generation-*.js`, `instancing.js` (`addInstanced`, levels of detail), `game/wildlife/animals.js` (the home forest's), `chamois.js` (the Greyspine's goats); a new plant draws from its own `mrng(seed)`, never the global `rand` → `docs/areas/render.md` |
| Background music (a theme per village, level range and boss; `THEMES`, `musicThemeHere`; recorded tracks `assets/audio/music-<theme>.m4a` override a theme) | `game/audio/music.js`, `game/audio/samples.js` (`musicBuffer`) |
| Time of day / weather | `game/world/time-of-day.js` (`weatherTint` hook, the zone label), `server/weather.js`, `game/world/weather.js` (rain, and snow / blizzard in the Reach); rain and wind sound `game/audio/rain.js` (`RAIN_SND` volumes) |
| Map / minimap (all four lands, in the look of the world map: painted ground with shallows, a coast line, little trees and peaks; a gold-lined frame, compass rose, red pin, serif labels; the Greyspine's full map opens with its ice fall, `landOpen`) | `game/ui/map.js` (`LANDS`, `drawFullMap`, `drawMinimap`), the painter `map-paint.js` (`mapBuildStep`, `MPC`), the dressing `map-style.js` (`mapSt…`); test `client-smoke` |
| **World map of Eldmere** (G; the "World" button in the land map's header): the docs map's art, fog over what is locked or not built, banners, your pin, pan / zoom, a click opens that land's map | `game/ui/world-map.js` (`wmap*`), `world-map-data.js` (generated by `docs/world-map.py --game`), the art `assets/img/world-map.webp` (`node tools/world-map-bake.js`; `build.py` embeds `assets/img/*`); test `client-smoke` → `docs/areas/world-map.md` |
| Chat / names / account code | `game/ui/chat.js`, `game/ui/account.js`; server `chatP`, `renameP` in `server/economy.js` |
| Saves, accounts, migration | `server/api.js` (`beginJoin`, `saveP`, `flushAll`), `server/players.js` (`sanitize*`), `node/main.js` (stores, `AUTH` password hashing) |
| Registered accounts (name + password, guest, unique names, gift levels `GIFT_LEVELS`) | `server/accounts.js`, client `game/ui/account.js` (settings, session) and `start-screen.js`; tests `node tools/accounts-smoke.js`, `start-smoke.js` |
| What each client is sent (snapshot ranges and rates, `SNAP_*`) | `server/api.js` (`broadcastSnap`); client `applySnap` in `game/net/client.js` |
| Testing tools (dev commands) | `server/economy.js` (`devP`), `game/ui/settings-testing.js`, markup in `index.html` (`#tSec`) |
| HUD, action bar | `game/ui/combat-hud.js`, `game/player/input.js`, `game/ui/controls-legend.js` |
| Keys (rebindable actions, `KB_ACTIONS`): a key handler asks `kbIs(e.code,'<action>')`, never a literal `KeyX` | `game/player/keybinds.js` + the handlers in `input.js`, `combat-hud.js`, `talking.js`...; test `node tools/keys-smoke.js` → `docs/areas/character-ui.md` |
| The AI disclosure (bottom-left note: everything, assets and music included, is made with AI; keep it visible and keep the chat above it) | `#aiNote` in `index.html`, `styles/02-hud.css` (the desktop chat is lifted above it in `19-chat.css`) |
| Hold Alt = free mouse (releases pointer lock, locks again on release; a canvas click does nothing meanwhile) | `altDown` / `altUp` / `altHeld` in `game/player/input.js`; the `mousedown` guard in `game/ui/combat-hud.js` |
| Transports / host election | `game/net/transport.js` |
| Dungeons (**built**: parties, runs in far-away slots, seven missions, four dungeons with their bosses, the doors and the Delve board, level-30 rewards; Wildwood's needs +1 difficulty) | server `party.js`, `dungeon-gear.js`, `dungeons/` (instances, mobs, kits/, fx, hazards, runs, lobby, boss-kits, boss-kits-mine); shared `dungeons.js`, `dungeons/` (themes, bosses), `dungeon-rewards.js`, `dungeon-items.js`, `dungeon-slots.js`, `dungeon-hud.js`; client `game/dungeon/` (run, view, view-mine, look, collide, party, hud, minimap, board, entrances), `village/buildings-dungeon.js`, `economy/dungeon-gear.js`; the design `docs/DUNGEONS.md` (read it first), `docs/DUNGEON-THEMES.md`; tests: the `dungeon*` / `party` / `rewards*` / `entrances*` smokes in section 6 → `docs/areas/dungeons.md` |
| Pendants (the necklace slot `eq.pendant` beside the ring: exp / drop / coin / crit rate / crit damage, a level-30 piece the Blackseam pays, rarity and Tempering Stone steps like the ring) | `shared/pendants.js` (kinds, base values, caps), ids and the clear's reward `shared/dungeon-rewards.js`, `dungeon-items.js`; the effects `pendP` (`server/players.js`), `rewardKill` / `rollDmgS` (`server/combat.js`); `game/ui/item-icons.js`; test `node tools/pendants-smoke.js` → `docs/PENDANTS.md` |
| PvP: the Proving Isle (an island in a lake on the south beach, one plank bridge; everyone on it fights at one level (`PASSIVE_LV`) with the same gear, skills at level 1, no rewards, parties spared; your soul is your element when hit; **balanced for nothing on purpose**) | `shared/pvp.js` (`PVP`, `pvpSkillsOf`), `PVP_ISLE` (`shared/terrain.js`), 'The Proving Road' (`shared/roads.js`), `server/pvp.js` (`foesS`, `pvpHitS`; the hooks are marked `// pvp:`), `game/pvp/state.js`, `game/village/buildings-pvp.js`; test `node tools/pvp-smoke.js` → `docs/PVP.md` |

## 5. Rules and conventions

- Keep files focused (most are under 250 lines). New file → add it to `src/manifest.json` in the right
  place, start it with a `//@` line, update `docs/FILES.md`.
- three.js is **r128**: no `CapsuleGeometry`; `OrbitControls` isn't available. Geometry is merged per
  character/object; colours are vertex colours painted with `pc(geo, fn)` / `paint`.
- The published page is one self-contained HTML file: no external requests (CSP), no remote images,
  no inline `onclick` (bind in script). Only Google Fonts load. The one exception is the background music
  (`assets/audio/music-*`, 14 MB): it is not in the page (the artifact caps a page at 16 MB and every visitor downloads it),
  the build copies it to `dist/audio/<name>.<hash>.m4a` and the client fetches a track when its theme first plays
  (same-origin, relative URL). Keep new big sounds out of the page the same way; only small sounds are embedded.
- The server never trusts client numbers it can recompute: sanitize saves (`sanitizeGear`,
  `sanitizeQuest`, `sanitizeSkills`), recompute rewards, clamp counts, clean names/chat.
- Put player-visible text through `textContent` (names and chat are user input).
- **A string from a client is never a key.** `ITEM[id]`, `SKILLS[id]` and the other registries are plain objects, so an id of `'constructor'` or `'__proto__'` finds a member of `Object.prototype` (that once made `buy` charge `NaN` coins, after which nothing was ever too expensive). `receive()` drops a message with such a name in any id-like field (`PROTO_KEY`, `server/api.js`); a string that reaches a handler another way (inside a save, a nested field) needs an own-property check or a `Map`. `npm run fuzz` throws garbage at every handler and checks the state afterwards.
- Snapshots and events must stay small: a room message is at most 4 KB (`chunkSend` splits larger ones);
  send monsters only when changed and only to players who can see them (`p.mk` in `broadcastSnap`), round numbers (`r1`).
- Comments explain *why* and the numbers a designer would tune; keep them current.
- Saves: new player fields go in `gear` (saved) and must be sanitized with a default for old saves.
- Performance: the phone (low/lite mode: `LOW`, `LITE`, `Q` in `core/setup.js`) matters.
- Performance of the server's tick: the monster AI runs for every awake monster x every player each tick (profile it: `npm run bench`, docs/TESTING.md). Test the cheap squared distance first, then the expensive question; ask `vNear(x,z,r)` and not `vDist(x,z)<r` (the land tests `vilAt` / `inVale` / `borderZ` cost several `noise2` calls each: `nearestFighter` used to ask `inVillage` of every player and it was 28% of the whole tick). The three border functions keep their last answer, so a terrain sample's repeated questions are nearly free: keep them pure.
- Character look (`LOOK`) fields: add a default to both `LOOK_M` and `LOOK_F` (old saves and other players'
  looks are merged onto them with `fullLook`) and clamp the value inside `buildCharacter`: the server cuts every look down to flat primitives
  (`cleanLookS`, `server/players.js`: strings of up to 24 characters, finite numbers, booleans, at most 80 fields, no name of `Object.prototype`, nothing nested), so a new look field must be one of those; but a remote look is still another player's data, so never use a look field as a bare key (`OUTFITS` has no prototype, `charModelOf` checks own properties; `look.model='constructor'` once made `buildCharacter` throw for everyone in sight). A **slider** is a row of `BODY_SLIDERS` (`shared/character.js`): read it through `S.<key>`, never `L.<key>`.
- **Every character model must ship recommended slider setups**: `CHAR_MODELS.<id> = {id, name, sexes, ranges, setups}`; the base model has 3+ per sex, a signature outfit (`signature:true`) just its one reference setup and `items:{hat,hair,face,top,bottom,shoes,weapon}`, the labels of its pieces in the editor; `validateCharModel`, `character-smoke` and `outfit-smoke` fail without them (`docs/CHARACTER.md` sections 4 and 9).
- Character joints (the owner's "lego" complaint): build limbs with `limb(...)` and let the part across a joint start with the SAME cross-section (`D.ER`, `D.KR`); keep the 0.7 mm cap margin; put colour edges on cut rings (`cuts`); judge joints in a bent pose (`model-preview.js --bent`).
- Recipes. **A look field**: defaults in `LOOK_M`/`LOOK_F`, a row in `EDIT` (character-editor.js), the clamp and the drawing in `buildCharacter`,
  the pools in `randomLook` (model.js; append to a villager pool only if you accept every random villager changing). **A server message**:
  a `case` in `receive()` (server/api.js) → mutate → `ev(...)` / `p.dirty=true` → handle it in `applyEvent` / `netHandle`, plus a check
  in `tools/server-smoke.js`. **A panel**: markup `class="panel"` in index.html, its id in `PANELS` (ui/panels.js), a key in its file's
  `keydown`, CSS in `12-panels.css` or a new file in the manifest. **A way into the world**: `enterWorld({mode,name,login,register})`
  in ui/start-screen.js. **Dead code**: `python3 tools/unused.py` lists names and CSS nobody uses.
- Character shading: `matChar` is a Phong material (per-pixel light). For curved body/cloth surfaces call
  `smoothN(g)` instead of `g.computeVertexNormals()`, so lathe/sphere seams don't show. Shape body features
  (e.g. the bust) by deforming the torso lathe, not by adding spheres.
- **Agent-first layout rules** (for new code and new docs; where agent and human readability conflict, the agent wins; existing code is not
  reorganized unless the owner asks; the dungeons plan applies them, `docs/DUNGEONS.md` section 14). `python3 build.py --check` enforces the mechanical part: a header on every file (rule 2), every source file in the manifest, `docs/FILES.md` up to date.
  1. **One feature, one stem.** `shared/<stem>.js`, `server/<stem>.js`, `game/<area>/<stem>.js`, `tools/<stem>-smoke.js`, `docs/<STEM>.md`: grepping the stem finds everything. A feature with more than
     three files in a layer gets a folder named for the stem (`server/dungeons/` for the dungeons' server files, when they exist).
  2. **The header is the contract.** Line 1 `//@ ...` says what the file owns (that is what `docs/FILES.md` shows); a second comment block, the *agent map*, lists its exports, who uses it and which test covers it.
  3. **Prefix every top-level name of a feature** (`dg…`, `DG_…`): names are global in a bundle, and `grep -rnE "dg[A-Z]|DG_" src` then lists the feature.
  4. **Entries are data, one file each, added through a registry** (`defineX({...})`): a new entry edits no file but `src/manifest.json`, declares no top-level name, and is validated when it is defined.
  5. **A bad entry never stops the game booting**: it is left out, warned about and listed (a `<PREFIX>_BAD` list); the feature's smoke test fails naming the id and the field.
  6. **A hook into an existing file is one line marked `// <feature>: <what>`**, and the feature's doc lists them all in a table (`docs/DUNGEONS.md` section 7 for the dungeons), so `grep -rn "// dungeons:" src` can be checked against it.
  7. **Explicit beats clever**: spell out repeated lines rather than build identifiers from strings, no aliases or re-exports, no dynamic property names for functions (they cannot be grepped).
  8. **Docs: short rows, details in `docs/<STEM>.md`.** A section-4 row names the files, the doc and the test, nothing more; long detail, pitfalls and numbers go in `docs/areas/<area>.md` or the feature's own doc, where an agent opens them only when it needs them.

## 6. Build and test cheaply

```
npm install                      # three@0.128 for the tools (pg is optional); `node tools/doctor.js` checks the whole setup and names the fix for anything missing
python3 build.py                 # → dist/ (~1 s)
python3 build.py --check         # + syntax, duplicate names, layout rules (a header on every file, every source file in the manifest, docs/FILES.md current, every tools/*-smoke.js in tools/tests.json)  (always run this)
python3 build.py --write-index   # rewrite docs/FILES.md from the //@ headers (after adding, renaming or re-describing a file)

node tools/run-tests.js          # THE test command: runs the tests that cover what you changed (git diff + new files), in parallel, one line each and a summary
node tools/run-tests.js --list   # every test: time, what it needs, what it proves. The registry is tools/tests.json: a new test = one row there (--check fails without it)
node tools/run-tests.js --fast   # everything but the slow ones           --all: everything (`npm test` = build --check + this, about 4 minutes on 4 cores)
node tools/run-tests.js server-smoke party-smoke      # by name           --for src/server/economy.js ...   # as if those files had changed
                                 # (tests that need the built page get a fresh `python3 build.py` from the runner: a stale dist/ cannot give a false failure)

npm run lint                     # tools/lint-bundles.js: undefined names and impossible code across each bundle's ONE shared scope (needs eslint: npm i --no-save eslint)
npm run fuzz                     # tools/server-fuzz.js: garbage messages and mutated saves at every handler; `-- --nodev` is the deployed setting
node tools/net-client-smoke.js     # the deployed path for real: the built server as its own process + the built page over a real WebSocket (also host-smoke, host-accounts-smoke; helpers tools/host-lib.js; docs/DEPLOY.md)
npm run bench                    # tools/server-bench.js: N players walking and fighting; ms per tick, bytes per snapshot (`-- --players 40 --secs 60`; profiling: docs/TESTING.md)
python3 tools/unused.py          # dead-code candidates (names nothing uses, CSS nobody mentions)
node tools/gen-docs.js           # rewrites docs/MOBS.md and docs/EQUIPMENT.md from the code (every mob and item, stats, file:line); --check: exit 1 if the data is stale
node tools/model-preview.js out.png [--head] [--outfit id] [--weapon warrior] [--bent]   # character model or a signature outfit → PNG (numpy + pillow)
node tools/monster-preview.js out.png --ids slime,boss       # monster and boss models → PNG, or --stats
node tools/city-preview.js out/ --views overview,street,statue   # Glasswell's 3D model → PNGs (headless Chromium, real WebGL)
node tools/shot.js out.png --at 120,-300,90      # the built game in headless Chromium: solo, level 60, teleported (x,z,degrees or --go tRime), a PNG to look at; 3-8 min (software GL: run it in the background)
node tools/entrance-map.js       # draws docs/dungeon-entrances.png (the four doors on the real terrain)
node dist/wildwood-server.js --port 8080                     # real server; open http://localhost:8080 in several tabs
```

`run-tests.js` with no arguments is the "smallest matching test" rule done for you: each registry row lists the paths it `covers`. When nothing matches (a docs-only change) it says so. By hand, the same choice: character model/face/hair/sliders → `character-smoke` (then `start-smoke` if the editor changed); a signature outfit → `outfit-smoke --only id`; a monster or boss model → `monster-preview` (then `client-smoke`); server rules → `server-smoke` / `skills-smoke` (or a few lines with `tools/load.js`: `loadServer(io, ['MONS','genQuest'])` gives you the server API plus any internal names); client UI → `client-smoke`; the start card, accounts or the editor → `start-smoke`. The headless client (`tools/headless.js`) stubs the DOM: elements are cached per selector and remember their listeners and children (`c.el('#stGuest').click()`, `el._kids`, `el._a`), but there is no layout, so read state from game variables (`expose` names) rather than DOM text where you can. To check that a test can fail, break the code it covers, run it, restore (this is how `start-smoke` and the prototype-name check in `server-smoke` were validated).

What each test checks: `node tools/run-tests.js --list` (one line each) and the comment at the top of its file. The model preview's close-ups, profiling, fuzzing and the browser-pane workflow: `docs/TESTING.md`.

## 7. Deploy (Render)

`render.yaml`: build `npm install --omit=dev ... && python3 build.py`, start `node dist/wildwood-server.js --no-dev` (testing tools off for players), health check `/healthz`.
The Node host (`src/node/main.js`) outlives bad input and bad code paths: a throw in `tick()` or in a message handler is logged by `logErr` (the first time and every 1000th) and the server goes on; 100 failing ticks in a row (5 s) save everyone and exit so Render restarts it; unhandled rejections and stray exceptions are logged, not fatal. One socket may send `MSG_RATE` = 120 messages a second (a burst of `MSG_BURST` = 240; the rest are dropped, 3000 dropped in a row end the connection), a message in fragments at most 1 MB.
Live at https://wildwood-wib9.onrender.com (free plan: sleeps after 15 min idle, ~30-50 s to wake). `dist/` is not committed; `GET /status` shows players, monsters, the storage kind and the saved accounts.
Saves: a free Neon Postgres through Render's `DATABASE_URL` (the secret lives only in Render and Neon, never in the repo or chat); without it, JSON files in `DATA_DIR`, which Render wipes on every deploy.
Accounts: guest (the browser's account code) or name + password (`server/accounts.js`). Traffic is about 8-12 KB/s per client. Details (traffic numbers, the table and its ids, publishing the claude.ai playtest artifact): `docs/DEPLOY.md`; account rules: `docs/areas/accounts-net.md`.

## 8. Pitfalls already hit (don't repeat them)

The universal ones are here. An area's own pitfalls are in its guide (`docs/areas/`), the testing and browser-pane ones in `docs/TESTING.md`.

- Duplicate top-level names across files (now caught by `--check`).
- Using state before it exists at load: `GEAR` is null until economy loads (guard `GEAR&&GEAR.skills`),
  `NET` is `var` on purpose.
- A second login of the same account must take the live in-memory state, not the (older) saved record.
- three r128 has no `BufferGeometry.applyQuaternion` (use `applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q))`). An exception while a monster
  model is built inside the `mons` message aborts the rest of the roster (monsters silently missing): run `client-smoke` after touching model builders.
  `paint(geo,fn)` calls `fn(x,y,z,nx,ny,nz,c)`, `pc(geo,fn)` calls `fn(x,y,z,c)` (or `fn(c)`): a `pc`-style function given to `paint` throws "c.set is not a function".
- **A point's land needs both coordinates.** The borders between the lands wander (`borderX(z)`, `borderZ(x)`, `shared/terrain.js`): never write `x > HALF` or `z < HZ0` to mean "the vale" or "the north", ask `inVale(x,z)` / `inHoar(x,z)` / `inGrey(x,z)` / `landAt(x,z)`; a gate on a border needs a pin there first (`docs/areas/regions.md`).
- **Every instanced mesh must have `instanceColor`.** r128 picks a material's shader program once, from whichever instanced mesh draws first, so a material shared by meshes with and without colours crashes the render loop ("Cannot read properties of null (reading 'isInterleavedBufferAttribute')") in some runs. `addInstanced` and `animMesh` add colours; a new `InstancedMesh` made any other way must too (`client-smoke` checks). Full story: `docs/areas/render.md`.
- Where the rest is: monster models (never mirror with `scale(-1,1,1)`, `poseRig` overwrites the limbs, every `pc(...)` geometry needs normals) → `monsters-bosses.md`; zone tiers (go through `monK`) → `tiers.md`; adding a region (`WZ0` / `HZ0`, constants at load) → `regions.md`; changing the terrain moves things found by scanning (tunnel, Hanami, arenas, the village entrance) → `world.md`; skill cooldowns, the skills panel's drag and drop, fast projectiles → `skills-items.md`; rotations, character facets, a new villager's seeded rng → `character-ui.md`; the dead-server Reconnect page, the class chip, testing the Shared mode → `accounts-net.md`; the browser pane, Windows / OneDrive, flaky tests, reading events in server tests → `docs/TESTING.md`.

## 9. Reference numbers

- Stats: `f(L)=L+(13/12)^L`; HP `20f+armor`; damage `3f+weapon`; defence cut `def/(def+60)` up to 60% (defense 90), then soft-capped toward 90%
  (`defRed` in `shared/balance.js`; with armour, passives, buffs and potions together a hit still does at least 10%, `DMG_TAKEN_MIN`; the worst case, the best set + Iron Will + the best buff and potion, is exactly that 90%, `docs/EQUIPMENT.md` section 2); ±5% per level difference (the damage you deal never falls below ×0.5, reached 10 levels above you: `LV_DMG_MIN`; the damage you take keeps growing); crits 12% ×1.7.
- XP to next `10(L²+(7/6)^L)·K15^((L-5)/10)` up to level 25; from 25 on a level costs as many same-level kills as 25 → 26 (about 2,100: `expToNext` in `shared/balance.js`, so 26-30 are a long but bounded grind); **level 50 is a soft cap**: from 50 every level costs ×1.5 the one before (`LV_SOFT_GROWTH`; the ceiling is 99, `PLAYER_MAX_LV`); **a kill never pays for more than 10 levels above you** (`xpLeadK`); level 10-15 monsters 1.5× HP/XP/coins (`highMult`). `MAX_ZONE_LV` is 32 (quest board, sanitizing); `VALE_TOP_LV` (25) caps the level of the drops skill upgrades ask for; gear stays at tier 5 for levels 25-30.
- Drops: monsters 2% common, 0.5% rare, 0.1% epic; boss 50/10/3/1/0.1% (common…legendary).
- World: `WX0..WX1` x `WZ0..WZ1` (2340 x 1720 m) holds four lands whose borders wander: ask `inVale(x,z)` / `inHoar` / `inGrey` / `landAt`, never `x > HALF`; clamp with `WX0..WX1` / `WZ0..WZ1`. The geometry, the coasts and the shifted frames: `docs/areas/world.md` (Reference numbers).
- Rarity stat multipliers 1 / 1.3 / 1.7 / 2.2 / 3; 3 identical → next rarity at Greta's forge.
- Shop: unlimited, +20% of base per copy bought, reset at sunrise (server day wraps).
- Above level 60 monsters creep tougher (`defAt`; bosses also gain damage): the numbers and the ramp a maxed hero meets are in `docs/areas/tiers.md`.
- Quests: 4 notices, level −4…+2 weighted to yours; hunts 10-20 (L1) → 30-50 (L15), bounties 1.5×.
- Slots: skill at level 3, burst at 10; prices 180/650, bursts 2000/4000, mage basics 250/900.
- Day 20 min; rain 5-7 min every 40-60 min, 30% storms.
- Per-area numbers (monster counts, the vale's and the Hoarfrost's progress, zone tiers, elements, measured costs and triangle budgets, character proportions) are in the area guides, under "Reference numbers".

## 10. Ideas not done yet (ask the owner before starting)

Everything that is not built, with a comment on each gap, is in `docs/NOT-BUILT.md` (its section 7 is the ideas list: the real passive skills, special quests, party quests, trading, movement anti-cheat, the XP curve past 15, animals in the vale, mobile UI polish, performance ideas that would change how the forest looks...). **Decided against**: a gathering animation and tool durability; levels 33-50 (acts V-VII, planned step by step in `docs/MAIN-QUEST.md` section 7; act IV, the Greyspine's, is built); regional weather on the server; the Hoarfrost's west glacier valley to the Greyspine; the licences of the free-plan music tracks (Suno and Google Flow Music: non-commercial) before the game earns money. **Agent docs**: CLAUDE.md is a router (rule 8 above): section-4 rows are short and the detail lives in `docs/areas/` and the docs it points to; keep it that way.
