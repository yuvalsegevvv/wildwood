# Wildwood: guide for agents

Read this file first. It is a router: it lets you work on the game **without reading the whole codebase** (about 12,000 lines of JavaScript in 135 files). Open only the files your task touches, and the one area guide it points to (`docs/areas/`).

Wildwood is a multiplayer 3D forest RPG in the browser: three.js r128 client, an authoritative world server that runs in the browser tab (solo / shared room) or in Node (the deployed MMO), and a procedural world of four lands (the home forest, the Sakura Vale east of the mountains, the Hoarfrost Reach north of it, the Greyspine north-west of the forest) with four villages, about 1,200 monsters, eight bosses, a main quest (acts I-IV, levels 1-32), three professions, crafting and brewing, zone tiers, 3 classes with equippable skills and elements, items in 5 rarities, chat, accounts and server-side saves (Postgres on Neon). The full overview is in `docs/areas/README.md`.

- Repository: https://github.com/yuvalsegevvv/wildwood (Render deploys every push to `main`).
- The owner also playtests a build published as a claude.ai artifact (Claude app on a phone): the page plus the music files next to it (`docs/DEPLOY.md`).
- Owner preferences: iterative feature requests; keep token use low (targeted reads, targeted tests);
  **do not commit or push unless asked**; when only one part changes (e.g. the character model), test
  only that part.

## 1. How to find things (do this instead of reading files)

1. `docs/FILES.md` lists every source file with a one-line description (the file's first line). It is generated: after adding, renaming or re-describing a file run `python3 build.py --write-index` (`--check` fails when it is stale).
2. Section 4 below maps common tasks to files.
3. `grep -n "name" -r src/` to find a function; then open only a line range.
4. Every file starts with `//@ one-line description` (`--check` fails without it). Keep that line accurate when you edit.
5. New regions, villages, bosses or lore: read `docs/WORLD.md` first (the continent's geography, planned regions, level ranges and their rules; map `docs/world-map.svg`, drawn by `docs/world-map.py`); story, quests, NPC lines or lore: also `docs/STORY.md` (spoilers; mind its hint rules); the main quest plan: `docs/MAIN-QUEST.md`; what is **not built yet**, with comments on each gap (gathering's animation, the balance of crafting and potions, the levels 26-50 story, regional weather, the tracks' licences...): `docs/NOT-BUILT.md`; professions, tools, crafting and potions: `docs/MAIN-QUEST.md` section 5b; the Sunscar's city Glasswell (designed, its 3D model built but not placed in the world; plan `docs/glasswell-plan.svg`, drawn by `docs/glasswell-plan.py`): `docs/DESERT-CITY.md`; dungeons (the design, the five rules, the build order, what is built): `docs/DUNGEONS.md`; the four dungeons (one a land, level 30; the Greyspine's, the Blackseam, is section 9), the hourly offer of two mission types, their bosses, the four entrances in the world (map `docs/dungeon-entrances.png`, drawn by `tools/entrance-map.js`) and the rewards (level-30 gear, the ring, the pendants, enhancing, the Tempering Stone): `docs/DUNGEON-THEMES.md`, `docs/PENDANTS.md`; **skill sets** (signature skills, outfits, a currency for outfits, six kit archetypes (risk DPS, safe DPS, grind, support, healer, tank) and eight themes; **the engine for kits is built, no set exists yet**): `docs/SKILL-SETS.md` (its section 0 says which part to read), for one kit or one theme only `docs/skillkits/README.md`, and to write one set as data `docs/skillkits/AUTHORING.md`; **every monster and every piece of gear with its stats and the `file:line` it is defined at**: `docs/MOBS.md` and `docs/EQUIPMENT.md` (generated from the code by `node tools/gen-docs.js`: run it after changing monsters, items, balance, drops, zones, boss kits or the dungeons' bosses and gear).
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

## 3. Protocol (details: `src/server/api.js` top comment, `src/game/net/client.js`)

- Client → server: `hello{acct,name,look,save[,user,pass|token]}`, `register{user,pass}`, `logout{token}`, `pos{p:[x,y,z,face,vx,vz]}`, `atk{k:'basic'|'skill'|'burst',tg,face,aim}`,
  `equip{id}`, `unequip{slot}`, `cls{cls}`, `buy/sell{id}`, `merge{id}`, `accept/turnin/abandon{id}`,
  `buyskill{id}`, `eqskill{id[,idx]}` (idx: the passive slot), `unskill{cls,slot[,idx]}` (slot `'pass'` + idx for a passive), `upskill{id}`, `soul{el}`,
  `look{look}`, `chat{text}`, `name{name}`, `warp{to:'home'|'hanami'|'rimehold'|'highmark'}` (from a teleport circle; the client's travel window), `mq{a:'talk'|'pick'|'read',id|i}` (the main quest), `learn{id}`, `gather{i}` (starts a cast) and `sellres{id,n}` (professions), `craft{slot,tier,rar}`, `brew{id,n}` and `potion{k}` (crafting, brewing, drinking), `zt{land:'home'|'vale'|'hoar',n}` (play a land at zone tier n: in a village only), `dev{cmd,v}`.
- Server → client: `welcome{...,look?}` (`look` only for a logged-in account: its own look replaces the browser's), `mons{list}` (roster), `you{...}` (private
  state incl. `gear`), `tp`, `kicked`, `auth{user,token}`, `authfail{text}`,
  `snap{day, n, pl, mo, b (one entry per boss), w (weather), ev:[events]}` 8-20×/s, **made per player**: `mo` holds only the monsters
  you can see (within 110 m, bosses 190 m: the client draws 95 / 170 m) and only when changed since the last time they were sent to
  you (those within 40 m every snapshot, farther ones every second), `pl` yourself and the players within 250 m (the rest once a
  second), `n` the head count. Constants `SNAP_*` and the reasoning are in `server/api.js` (`broadcastSnap`). The claude.ai room
  host keeps one message for everyone (`io.broadcastSnaps`), since its channel is one shared 4 KB topic.
- Events (`ev(...)` on the server, `applyEvent` in `net/client.js`): dmg (`[id,v,crit,by[,fx]]`: fx 1 / -1 = the element helped / hurt), kill, imm, mact, aggro, respawn,
  spawn, despawn, proj, pend, tele (`[id,kind,x,z,r,dur,face,half]`), tend (`[id,fired,x,z]`), zone / zend, wall / wend, pfx (`[pid,kind,dur,vx,vz]`: root, slow, push; the client applies it to itself), roar, area, aend, chain, buff, xp, coins, loot, lvup, hurt, down,
  up, toast, qdone, qturn, pact, pjoin, pleave, pgear, plook, pname, chat, merge, skillslot, skillbuy,
  weather, thunder, lvset, warp, vale, north (`[pid,1 ice wall open|2 walked into Rimehold]`), west (`[pid,1 the Greyspine's ice fall open|2 walked into Highmark]`), gate (`[pid,'river'|'neck']`: a rock fall in the Greyspine's west wall gave way), node (`[i,1 taken|0 back]`, a resource node), cast (`[pid,i,seconds]`: your gather cast began) / castx (`[pid]`: it broke), gather (`[pid,i,resource,n]`: the cast ended), drop (`[pid,mat,n,monId]`), skillup, soul, mq (`[pid,stepId,1 started|2 handed in]`). Elemental reactions and skill sets: aura (`[monId,el|0,dur]`: an element's aura on a monster, 0 = gone), react (`[monId,pairKey]`), st (`[monId,kind,v,dur,by]`: `vuln` / `weak`), mk (`[monId,markId,n,dur,ownerId]`: a kit's mark, drawn only for its owner, n 0 = spent), ast (`[pid,kind,v,dur]`: an ally buff), ssget (`[pid,setId,pos]`: a piece earned); `dev{cmd:'set',v:'<set id>'}` gives a whole set.
- To add a feature that changes state: handle a message in `receive()` (server/api.js), mutate state,
  call `ev('name', ...)` and/or set `p.dirty=true` (→ a `you` update + save), then handle the event in
  `applyEvent` on the client.

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
| The continent's coast (an L-shaped outline with capes, bays and islets; no mountain wall on the north or east edge; the Reach's size: `NORTH_D`, `EAST_W`, `VALE_E`, `GREY_N`; the Warlord Isles in the vale's old south-east corner, with zone 24 on them) | `shared/coasts.js` (`CS_BASE` is the designed outline, `CS_ISLANDS`, `CS_HOLD`, `CS_ISLES`, `csOuter`), `VALE_SEEDS` (`vale.js`), The Isle Road (`roads.js`), `coastDist` / `shore` in `shared/terrain.js`, `terrain-color.js` (shingle); keep arenas and doors off the edge (`CS_HOLD`); test `node tools/coasts-smoke.js       # 15 checks: sea on the north and east edges, the Reach as big as the others, big bays and capes (an L), the south-east corner gone with zone 24 on the Warlord Isles and a causeway to them, every zone keeps its ground, islets, arenas and doors, a flat sea, ~5 s
| Movement limits: the slope limit (`SLOPE_MAX`, a step climbing more than 1.2 m a metre is turned along the face or dropped), the border clamps that act only while a land is locked, the bridge's gate | `slopeBlock`, `worldBounds`, `glenWall`, `frostWall`, `greyWall` in `game/player/movement.js`; test `node tools/slope-smoke.js` (everything stays reachable), `client-smoke` → `docs/areas/regions.md` |
| Sakura Vale: the Greyfall bridge `TUN` (once a tunnel), Hanami `VIL2`, zones, arenas, `vilAt` | `shared/vale.js`, `game/village/buildings-vale.js` (`buildBridge`), the bridge's gate and parapets in `worldBounds` (`movement.js`), unlock / `warpP` (`server/players.js`) → `docs/areas/regions.md` |
| Glasswell, the Sunscar's desert city (**only its 3D model exists, it is not placed in the world**; the layout is generated by `docs/glasswell-plan.py --js src/shared/sunscar.js`: change the script, not `shared/sunscar.js`) | `shared/sunscar.js`, `sunscar-shape.js` (`gwRimH`), `game/village/sun-*.js` + `buildings-sun.js` (`buildGlasswell`); see it with `node tools/city-preview.js out/`; test `node tools/glasswell-smoke.js`; design `docs/DESERT-CITY.md`, what is missing `docs/NOT-BUILT.md` section 2 → `docs/areas/regions.md` |
| Items, rarity, prices, drop rates, merge | `shared/items.js` (`RARITY`, `RAR_MULT`, `rollMonsterRarity`, `rollBossRarity`, `shopPrice`) |
| Item icons | `game/ui/item-icons.js` |
| Skills (all 3 slots, all classes) | `shared/classes.js` (`SKILLS`, `abilityOf`) → `server/combat.js` (`resolveHitS`) → `game/combat/skill-fx.js`, `attacks.js`. A new attack path must hand its element to `damageMonsterS` → `docs/areas/skills-items.md` |
| Boss skills (48, dropped by bosses at 10% each) and generic skill effects (`fx`) | rows with `drop:'<boss id>'` in `SKILLS`, `BOSS_SKILLS` (`shared/drops.js`), `resolveFxS` (`server/combat.js`), `skill-fx.js`; a skill with `fx` needs no server or client code → `docs/areas/skills-items.md` |
| Elements (`el` on skills and monsters, the soul bound at level 15, the x1.5 rules) | `shared/elements.js`, `elemHitS` / `rollDmgS` (`server/combat.js`), `bindSoulP`, `game/economy/soul.js` → `docs/areas/skills-items.md` |
| Elemental reactions (a hit of an element leaves an aura, two elements react into two flavour statuses, a skill's `flavor` / `status` keys apply one directly, shared non-stacking `vuln` / `weak` on monsters; **built**, no kit uses it yet; `RX_ON` switches it off) | `shared/reactions.js` + `reactions-chart.js` (data), `server/reactions.js` (engine; its hooks are marked `// reactions:`), `game/combat/reactions.js` (the aura marker, names); test `node tools/reactions-smoke.js` → `docs/REACTIONS.md` |
| Skill sets, the base (**built**; no set exists: a set is one data file, `docs/skillkits/AUTHORING.md`): the registry and its checks, universal and slot-1 pieces worn for every class, the 3- / 5-set bonuses, personal marks (`mark` / `pop` / `amp`), triggered rows, ally buffs, party heals, shields, taunt, the power-ladder harness | `shared/skillsets.js` (registry, `ssCount`, `ssBonuses`), `shared/skillsets/<id>.js` (one per set, last in `shared`), `server/skillsets.js` (grants, wearing, marks, triggers, allies, taunt; hooks marked `// skillsets:`), `game/economy/skillsets.js`, `game/skillsets/marks.js`; tests `node tools/skillsets-smoke.js`, `node tools/skillsets-ladder.js` → `docs/SKILL-SETS.md` |
| Skill levels / upgrades and monster drops | `shared/drops.js` (`upgradeNeeds`), `shared/classes.js` (`skillPower`), `upgradeSkillP`, `addMatP` → `docs/areas/skills-items.md` |
| Passive skills (class-universal; its three slots open at levels 18 / 24 / 30) | `PASSIVES`, `PASSIVE_SLOT_LV` / `passiveOpen(level)` (`shared/classes.js`), `psP(p,stat)` on the server → `docs/areas/skills-items.md` |
| The skills panel (tabs, drag and drop onto slots) | `game/economy/skills.js` (`skTile`, `skInfoHtml`, `SKD` drag state; styles `18-skills.css`); test `client-smoke` |
| Quest board generation / rewards | `shared/quests.js` (`genQuest`, `huntCount`, `questRewardFor`); server actions `server/economy.js`; panel `game/economy/quests.js` |
| Shops / forge / skills panel / inventory | `game/economy/shops.js`, `forge.js`, `skills.js`, `inventory.js` (+ server `economy.js`) |
| Village layout, board, stalls | `shared/village-layout.js` (positions, colliders `V.boxes`), `game/village/buildings.js` (meshes) |
| NPCs (who, where, role, lines, labels) | `game/village/villagers.js` (`VILLAGERS`), `talking.js` (`openRolePanel`), `npc-labels.js` |
| Character body, face, hair, hats | `game/character/model.js` (`buildCharacter`, `randomLook`, `LOOK_M` / `LOOK_F`), `ARMOR_LOOK` (`shared/items.js`), `EDIT` in `game/ui/character-editor.js`; see it: `node tools/model-preview.js out.png` → `docs/areas/character-ui.md` |
| Start card: Log in / Register / Play as guest, loading, `beginPlay` | `game/ui/start-screen.js` (`enterWorld`), `#start` in `index.html`, `game/ui/account.js`; test `node tools/start-smoke.js` → `docs/areas/accounts-net.md` |
| Animations | `game/character/pose.js` (`poseRig`; skill anims borrow kinds via `ANIM_OF`) |
| World size, lakes, terrain | `shared/terrain.js` (`SIZE`, `LAKES`, `hillShape`), `noise.js`, `zones.js`; the server samples height on a 4 m grid, so nothing finer than 8-16 m → `docs/areas/world.md` |
| The ground you see (colours, per-pixel detail) and the far lands | `terrainMaterial`, `groundShade` (`game/world/generation-setup.js`), `terrain-color.js`, `far-lands.js` → `docs/areas/world.md` |
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
- Snapshots and events must stay small: a room message is at most 4 KB (`chunkSend` splits larger ones);
  send monsters only when changed and only to players who can see them (`p.mk` in `broadcastSnap`), round numbers (`r1`).
- Comments explain *why* and the numbers a designer would tune; keep them current.
- Saves: new player fields go in `gear` (saved) and must be sanitized with a default for old saves.
- Performance: the phone (low/lite mode: `LOW`, `LITE`, `Q` in `core/setup.js`) matters.
- Character look (`LOOK`) fields: add a default to both `LOOK_M` and `LOOK_F` (old saves and other players'
  looks are merged onto them) and clamp the value inside `buildCharacter`: the server passes looks through
  unsanitized (only a 2 KB size limit), so a remote player's look can hold anything.
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
npm install                      # three@0.128 for the tools (pg is optional)
python3 build.py                 # → dist/ (~1 s)
python3 build.py --check         # + syntax, duplicate names, layout rules (a header on every file, every source file in the manifest, docs/FILES.md up to date)  (always run this)
python3 build.py --write-index   # rewrite docs/FILES.md from the //@ headers (after adding, renaming or re-describing a file)
node tools/server-smoke.js       # 16 checks, server from src/ (no build), ~5 s
node tools/accounts-smoke.js     # 17 checks: register, login, tokens, unique names, ~1 s
node tools/mainquest-smoke.js    # 128 checks: the main quest, acts I-IV, ~15 s
node tools/boss-smoke.js         # 46 checks: the eight world bosses' move sets, ~2 s
node tools/hoarfrost-smoke.js    # 37 checks: the Hoarfrost Reach, ~5 s
node tools/greyfall-smoke.js     # 19 checks: the four lands' wandering borders and their pins, one land per point, the Greyfall River (depth, width, banks, no spur, the bridge's deck), the Greyfall (path, tarn, pool), ~2 s
node tools/coasts-smoke.js       # 15 checks: sea on the north and east edges, the Reach as big as the others, the coasts wander (an L with capes and bays), the islets are islands, arenas and doors keep their ground, a flat sea, ~4 s
node tools/slope-smoke.js        # 7 checks: with the slope limit every village, arena, zone, node and door is still reachable on foot, ~10 s
node tools/greyspine-smoke.js    # 50 checks: the Greyspine's ground, glacier valley and ice fall, Highmark, zones and monsters, the two bosses, water, the two rock falls, ~3 s
node tools/pendants-smoke.js     # 44 checks: the pendants, level-30 pieces (see docs/PENDANTS.md), ~2 s
node tools/dungeons-smoke.js     # 98 checks: the pure setup: tiles of every theme, boss hall vs arenas, layouts, grid, flow field, party table, the four dungeons and bosses, offer, entrances, reward rules, ~3 s
node tools/party-smoke.js        # 22 checks: invites, /invite, the cap, lead, kick, leave, expiry, ~2 s
node tools/dungeon-runs-smoke.js # 84 checks: runs isolated from the world and each other, walls, party health, loot for all, down / revive / lost, a Purge won with the save and the clear's piece (also the Blackseam's pendant), ~10 s
node tools/dungeon-boss-smoke.js # 46 checks: the four dungeon bosses in a real hall (Haugbui's thrall cap, Garrick's powder kegs), ~5 s
node tools/dungeon-missions-smoke.js # 114 checks: the seven mission kits won and lost, HUD, chests, hazards, ~15 s
node tools/rewards-smoke.js      # 67 checks: level-30 gear, defence soft cap and the worst-case stack, the ring and the soul, the Tempering Stone, temper, merge, saves, ~5 s
node tools/rewards-client-smoke.js     # 23 checks: ring slot, Temper tab (runs dist/: build first)
node tools/entrances-client-smoke.js   # 32 checks: the four doors' client dressing (runs dist/)
node tools/dungeon-board-client-smoke.js # 37 checks: the Delve board and the join prompt (runs dist/)
node tools/dungeon-client-smoke.js     # 44 checks: a run's client: view, walls, camera, party frame, HUD, results (runs dist/)
node tools/entrance-map.js       # draws docs/dungeon-entrances.png (the four doors on the real terrain); regenerates byte-identically
node tools/skillsets-smoke.js     # 93 checks: the registry (48 kinds of bad set left out and listed), expansion, granting, wearing a piece for all three classes, 3- / 5- / 3+3 bonuses, saves, marks, modifiers, triggers, reflect, ally buffs, heals, shields, taunt, the ladder on a fixture set (fixture sets only: no kit is in src/), ~8 s
node tools/skillsets-ladder.js   # the power ladder of every registered set (% of the best non-set loadout): pieces, 3-set, 5-set, all six, one target and a pack; warnings outside the band; --check: the damage kits' orderings
node tools/reactions-smoke.js     # 47 checks: the 15-pair chart, auras, reactions, direct application, vuln / weak (shared, never stacking), the guards (cooldown, spread in a run, bosses), ~2 s
node tools/tiers-smoke.js        # 48 checks: zone tiers I-V, what a kill pays, the creeps above level 60, the x0.5 floor of the level debuff, ~2 s
node tools/boss-duel.js --check  # 18 checks: a maxed level-60 hero vs the level-80 bosses (standing loses, avoiding half wins) and the ramp below them, ~10 s; without --check a table (--boss|--camp --tier --level --class --avoid)
node tools/levels-smoke.js       # 11 checks: the XP curve, the soft cap from level 50, saves and the testing tool, a kill never pays for more than 10 levels above you, ~2 s
node tools/professions-smoke.js  # 74 checks: tools, nodes, gathering, crafting, brewing, potions, ~8 s
node tools/skills-smoke.js       # 58 checks: elements, soul, drops, upgrades, passives, boss skills, ~15 s
node tools/client-smoke.js       # 121 checks, the built page headless (solo), ~60 s; runs dist/: build first
node tools/start-smoke.js        # 31 checks: the start card + a new account's editor, ~20 s; runs dist/
node tools/keys-smoke.js         # rebindable keys and hold-Alt; runs dist/
node tools/glasswell-smoke.js    # 13 checks of Glasswell's layout (80 homes and 30 places on the floor, no overlaps, off roads and water, the rim's height function) and that its model builds in a real browser (skipped without playwright), ~15 s
node tools/city-preview.js out/ --views overview,street,statue   # Glasswell's 3D model → PNGs from several cameras (headless Chromium, real WebGL; prints triangles and build time)
python3 tools/unused.py          # dead-code candidates (names nothing uses, CSS nobody mentions)
node tools/gen-docs.js           # rewrites docs/MOBS.md and docs/EQUIPMENT.md from the code (every mob and item, stats, file:line); --check: exit 1 if the data is stale (moved line numbers only warn; --strict fails on those too)
npm test                         # build --check + all of the above
node tools/model-preview.js out.png [--head]                 # character model → PNG (numpy + pillow)
node tools/monster-preview.js out.png --ids slime,boss       # monster and boss models → PNG, or --stats
node dist/wildwood-server.js --port 8080                     # real server; open http://localhost:8080 in several tabs
```

Pick the smallest test that covers your change: model/face/hats → `model-preview` only; a monster or boss model → `monster-preview` (then `client-smoke`); server rules →
`server-smoke` / `skills-smoke` (or a few lines with `tools/load.js`: `loadServer(io, ['MONS','genQuest'])` gives you the
server API plus any internal names); client UI → `build --check` + `client-smoke`; the start card, accounts or the character editor →
`start-smoke`. The headless client (`tools/headless.js`) stubs the DOM: elements are cached per selector and remember their
listeners and children (`c.el('#stGuest').click()`, `el._kids`, `el._a`), but there is no layout, so read state from game variables
(`expose` names) rather than DOM text where you can. To check that a test can fail, break the code it covers, run it, restore
(this is how `start-smoke` was validated).

What each test checks, the model preview's close-ups, and the browser-pane workflow: `docs/TESTING.md`.

## 7. Deploy (Render)

`render.yaml`: build `npm install --omit=dev ... && python3 build.py`, start `node dist/wildwood-server.js --no-dev` (testing tools off for players), health check `/healthz`.
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
- World: the home forest is about -HALF..HALF; the whole world is `WX0..WX1` x `WZ0..WZ1` (the vale is east of the Vale Wall's line `x > borderX(z)`, about x > HALF, 550 m wide, with a river
  for a border that bulges up to 215 m west of it; the Hoarfrost Reach is `inHoar(x,z)`: north of the north wall's line `z < borderZ(x)` (about z < `HZ0` = -440) and east of the Greyspine | Reach wall `x > borderXN(z)` (about x > `GXJ` = -140, over the forest's middle), up to `WZ0` = -1280; the world is 2340 x 1720 m: `WX0` = -1020, `WX1` = 1320 (`EAST_W` 880, `NORTH_D` 840; `VALE_E` and `GREY_N` stay where they were);
  north of the home forest, west of that wall, is the Greyspine, `inGrey(x,z)` (it was built over x -440..440 and moved `GDX` = 580 m west as one piece, so docs and tests from before speak the old frame; the Reach's places moved `RDX` = 390 m; west of the forest, south of the Greyspine, is the unbuilt Sunscar plateau, `inSun`)). The north and east edges of the vale, the Reach and the Greyspine are coasts with bays and islets, not walls (`shared/coasts.js`): `coastDist(x,z)` is the distance to the sea there too. `HALF` and `HZ0` are the lines' mean and the junction, not the borders: ask the border functions. Use `WX0..WX1` / `WZ0..WZ1` for clamps
  (the home forest's north edge is `borderZ(x)`, not `WZ0`). The heightmap is rectangular (`NVX` x `NVZ`), the terrain is drawn in
  tiles (64 x 128 cells) culled beyond the fog in both directions, and plant chunks more than 320 m away are only grown when you come closer.
- Rarity stat multipliers 1 / 1.3 / 1.7 / 2.2 / 3; 3 identical → next rarity at Greta's forge.
- Shop: unlimited, +20% of base per copy bought, reset at sunrise (server day wraps).
- Above level 60 monsters creep tougher (`defAt`): health x base^(level-60) for all but props (bosses 13/12: x2.2 at 70, x4.95 at 80; normal monsters 1.065: x1.9 / x3.5), bosses also +1.25% health and +5% damage a level (x1.25 / x2 at 80). The ramp for a maxed level-60 hero standing in melee with potions: level 65 bosses 4-8 s, 70 about 35 s, 75 about a minute, level 80 loses standing and wins in 1.5-3 minutes when half the damage is avoided (`tools/boss-duel.js`).
- Quests: 4 notices, level −4…+2 weighted to yours; hunts 10-20 (L1) → 30-50 (L15), bounties 1.5×.
- Slots: skill at level 3, burst at 10; prices 180/650, bursts 2000/4000, mage basics 250/900.
- Day 20 min; rain 5-7 min every 40-60 min, 30% storms.
- Per-area numbers (monster counts, the vale's and the Hoarfrost's progress, zone tiers, elements, measured costs and triangle budgets, character proportions) are in the area guides, under "Reference numbers".

## 10. Ideas not done yet (ask the owner before starting)

(Each gap is commented in `docs/NOT-BUILT.md`.) **Placeholders to replace later** (section 3b there): the Greyspine's zone-tier symbol (its badge and the +150% cap). **Not implemented yet**: a use for coins at level 30+. Professions' next steps (quest-board notices for gathering and crafting, planned in `docs/NOT-BUILT.md` section 1; status-cleansing potions; resources for the lands to come). Zone tiers' next steps (none decided): quest-board notices and their rewards by tier (the board still scales by base level), tier-only loot or a gear tier above 5, a cap or damping on the XP a tier pays, a look for the symbol on the character, a tier picker at the teleport circles. **Dungeons**: designed in `docs/DUNGEONS.md` (milestones M0-M7; M0, the inert setup in `shared/dungeons.js`, is done; its section 13 lists the owner's decisions); no dungeon theme exists. **Agent docs**: CLAUDE.md is a router (rule 8 above): section-4 rows are short and the detail lives in `docs/areas/`; keep it that way. **Decided against**: a gathering animation and tool durability; levels 33-50 (acts V-VII, planned step by step in `docs/MAIN-QUEST.md` section 7; act IV, the Greyspine's, is built); regional weather on the server; the Hoarfrost's west glacier valley to the Greyspine; the licences of the free-plan music tracks (Suno and Google Flow Music: non-commercial) before the game earns money.
The owner will define the real passive skills (the eight in `PASSIVES` are a placeholder set); monsters' elements do not change the damage they deal to you
yet (a `hurtP` hook, same functions as `foeMult`); Special quests from Bram and other NPCs; party quests (the party itself is built with the dungeons: `docs/DUNGEONS.md` section 5); the XP curve past 15 (levels 16-25 need 400-2100 kills
each: tune `expToNext` / `xpFor` in `shared/balance.js`); animals in the vale; trading between players; more zones or a
second boss; server-side anti-cheat for movement; villagers synced between players; mobile UI polish
seen on a real device.

Performance ideas that would change how the forest looks, so they need the owner's yes (numbers: `docs/areas/render.md`): draw only a share of
the trees in far chunks (`InstancedMesh.count` set in `cullChunks` from the distance, with the instances shuffled once; about -25%
triangles), a low-poly variant of each tree for chunks beyond ~120 m, and rendering the sun's shadow map every few frames (character
shadows would stutter). Also: events (`ev`) still go to everyone, and could be filtered by distance like monsters are.
