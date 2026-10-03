# Wildwood: guide for agents

Read this file first. It is a router: it lets you work on the game **without reading the whole codebase** (about 12,000 lines of JavaScript in 135 files). Open only the files your task touches, and the one area guide it points to (`docs/areas/`).

Wildwood is a multiplayer 3D forest RPG in the browser: three.js r128 client, an authoritative world server that runs in the browser tab (solo / shared room) or in Node (the deployed MMO), and a procedural world of three lands (the home forest, the Sakura Vale east of the mountains, the Hoarfrost Reach north of it) with three villages, about 1,000 monsters, six bosses, a main quest (acts I-III, levels 1-25), three professions, crafting and brewing, zone tiers, 3 classes with equippable skills and elements, items in 5 rarities, chat, accounts and server-side saves (Postgres on Neon). The full overview is in `docs/areas/README.md`.

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
5. New regions, villages, bosses or lore: read `docs/WORLD.md` first (the continent's geography, planned regions, level ranges and their rules; map `docs/world-map.svg`, drawn by `docs/world-map.py`); story, quests, NPC lines or lore: also `docs/STORY.md` (spoilers; mind its hint rules); the main quest plan: `docs/MAIN-QUEST.md`; what is **not built yet**, with comments on each gap (gathering's animation, the balance of crafting and potions, the levels 26-50 story, regional weather, the tracks' licences...): `docs/NOT-BUILT.md`; professions, tools, crafting and potions: `docs/MAIN-QUEST.md` section 5b; dungeons (planned: the design, the five rules, the build order, what exists): `docs/DUNGEONS.md`; the three dungeons (one a land, level 30), the hourly offer of two mission types, their bosses, the three entrances in the world (map `docs/dungeon-entrances.png`, drawn by `tools/entrance-map.js`) and the rewards (level-30 gear, the ring, enhancing, the Tempering Stone): `docs/DUNGEON-THEMES.md`.
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
  `look{look}`, `chat{text}`, `name{name}`, `warp{to:'home'|'hanami'|'rimehold'}` (from a teleport circle; the client's travel window), `mq{a:'talk'|'pick'|'read',id|i}` (the main quest), `learn{id}`, `gather{i}` (starts a cast) and `sellres{id,n}` (professions), `craft{slot,tier,rar}`, `brew{id,n}` and `potion{k}` (crafting, brewing, drinking), `zt{land:'home'|'vale'|'hoar',n}` (play a land at zone tier n: in a village only), `dev{cmd,v}`.
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
  weather, thunder, lvset, warp, vale, north (`[pid,1 ice wall open|2 walked into Rimehold]`), node (`[i,1 taken|0 back]`, a resource node), cast (`[pid,i,seconds]`: your gather cast began) / castx (`[pid]`: it broke), gather (`[pid,i,resource,n]`: the cast ended), drop (`[pid,mat,n,monId]`), skillup, soul, mq (`[pid,stepId,1 started|2 handed in]`).
- To add a feature that changes state: handle a message in `receive()` (server/api.js), mutate state,
  call `ev('name', ...)` and/or set `p.dirty=true` (→ a `you` update + save), then handle the event in
  `applyEvent` on the client.

## 4. Where to change what

Short rows: the files that matter. A row ending in `→ docs/areas/<x>.md` has the long detail there (index: `docs/areas/README.md`).

| Task | Files |
|---|---|
| Balance formulas (HP, damage, XP curve, coins, 1.5× for level 10-15) | `shared/balance.js` |
| Monster stats / new monster | `shared/monster-defs.js` (data; the look flags in `pal` are in `docs/areas/monsters-bosses.md`), `game/combat/monsters.js` (the views: `addMonView`, `updateMonsters`, `animateMonster`), `server/monsters.js` (spawn counts `MON_COUNT`, AI) |
| How a monster or boss looks (models, animation, look flags) | `game/combat/monster-*.js`: one file per family, each fills `MODELS.<model>={geo,build,anim}`; helpers in `monster-parts.js`. **See them**: `node tools/monster-preview.js out.png --ids oni,boss` → `docs/areas/monsters-bosses.md` |
| Boss mechanics / visuals (six bosses) | `BOSS_DEFS` (`shared/monster-defs.js`) → server `boss.js` (the shared part), `boss-fx.js` (move primitives), `boss-kits-*.js` (`BOSS_KITS.<kit>`) → client `game/combat/boss.js`, `boss-fx.js`; test `node tools/boss-smoke.js` → `docs/areas/monsters-bosses.md` |
| Carapax, the Tide King (level 20, the south beach) | `shared/beach.js` (`ARENA_TIDE`), `CARAPAX_DEF`, `game/village/buildings-beach.js` → `docs/areas/monsters-bosses.md` |
| Hoarfrost Reach (levels 22-30): the plateau, Frostgate Pass and its ice wall, Rimehold `VIL3`, zones `h22`-`h30`, two boss arenas | `shared/hoarfrost.js` (pass, village, zones, arenas, `CIRCLES`), `hoarHeight` in `shared/terrain.js`; the gate: `frostWall` (`movement.js`) + `setPos` (`api.js`), saved as `gear.north`; meshes `game/village/buildings-hoar.js` → `docs/areas/regions.md` |
| Snow instead of rain in the Reach; the aurora | `WX.snow` in `game/world/weather.js`, `game/world/aurora.js`, wind in `game/audio/rain.js` and `driver.js` → `docs/areas/regions.md` |
| Professions (mining, woodcutting, gathering): the Wayfarers' Lodge, resource nodes, resources | `shared/professions.js` (`NODES`, `RES`, `PROFS`, `nodeBlock`, `castTime`), `server/professions.js` (`gatherP`; `gear.prof`, `gear.res`), `game/economy/professions.js`; test `node tools/professions-smoke.js` → `docs/areas/professions.md` |
| Zone tiers (a harder setting per land, opened by its second boss) | `shared/tiers.js` (`zoneTierK`, `landAt`), `server/tiers.js`, `game/economy/tiers.js`. The tier is per player and a monster exists once: always go through `monK(m,p)` (`damageMonsterS`, `hurtP`, `rewardKill`); test `node tools/tiers-smoke.js` → `docs/areas/tiers.md` |
| Tools (pickaxe, axe, sickle: slots `eq.pick`, `eq.axe`, `eq.sickle`) | `TOOL_*` in `shared/items.js`; `equipP` / `buyP` / `sanitizeGear`; `BODY_SLOTS` in `game/economy/inventory.js` → `docs/areas/professions.md` |
| Crafting (weapons from ore, armour from logs) and brewing (potions from herbs) | `shared/crafting.js`, `server/crafting.js` (`craftP`, `brewP`), `game/economy/crafting.js`, `21-crafting.css` → `docs/areas/professions.md` |
| Potions (drinking, buffs, the belt, keys Z / X / C) | `drinkP` (`server/crafting.js`), `game/ui/potions.js`; counts in `gear.pot` → `docs/areas/professions.md` |
| Teleport circles and their travel window | `CIRCLES` (`shared/hoarfrost.js`), `warpP` (`server/players.js`), `game/village/talking.js`, `game/ui/travel.js` → `docs/areas/regions.md` |
| Sakura Vale: tunnel `TUN`, Hanami `VIL2`, zones, arenas, `vilAt` | `shared/vale.js`, `game/village/buildings-vale.js`, tunnel collision `worldBounds` (`movement.js`), unlock / `warpP` (`server/players.js`) → `docs/areas/regions.md` |
| Items, rarity, prices, drop rates, merge | `shared/items.js` (`RARITY`, `RAR_MULT`, `rollMonsterRarity`, `rollBossRarity`, `shopPrice`) |
| Item icons | `game/ui/item-icons.js` |
| Skills (all 3 slots, all classes) | `shared/classes.js` (`SKILLS`, `abilityOf`) → `server/combat.js` (`resolveHitS`) → `game/combat/skill-fx.js`, `attacks.js`. A new attack path must hand its element to `damageMonsterS` → `docs/areas/skills-items.md` |
| Boss skills (36, dropped by bosses at 10% each) and generic skill effects (`fx`) | rows with `drop:'<boss id>'` in `SKILLS`, `BOSS_SKILLS` (`shared/drops.js`), `resolveFxS` (`server/combat.js`), `skill-fx.js`; a skill with `fx` needs no server or client code → `docs/areas/skills-items.md` |
| Elements (`el` on skills and monsters, the soul bound at level 15, the x1.5 rules) | `shared/elements.js`, `elemHitS` / `rollDmgS` (`server/combat.js`), `bindSoulP`, `game/economy/soul.js` → `docs/areas/skills-items.md` |
| Skill levels / upgrades and monster drops | `shared/drops.js` (`upgradeNeeds`), `shared/classes.js` (`skillPower`), `upgradeSkillP`, `addMatP` → `docs/areas/skills-items.md` |
| Passive skills (class-universal, level 18) | `PASSIVES`, `PASSIVE_OPEN` (`shared/classes.js`), `psP(p,stat)` on the server → `docs/areas/skills-items.md` |
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
| The main quest line (acts I-III) | `shared/main-quest.js` (`MQ`; **a step inserted in the middle shifts saves: bump `MQ_VER`, add it to `MQ_INSERTED`**), `server/main-quest.js`, `game/economy/main-quest.js`; test `node tools/mainquest-smoke.js`; design `docs/MAIN-QUEST.md`, story `docs/STORY.md` → `docs/areas/main-quest.md` |
| Vegetation / animals | `game/world/plant-models*.js`, `grass-models.js`, `generation-*.js`, `instancing.js` (`addInstanced`, levels of detail), `game/wildlife/animals.js`; a new plant draws from its own `mrng(seed)`, never the global `rand` → `docs/areas/render.md` |
| Background music (a theme per village, level range and boss; `THEMES`, `musicThemeHere`; recorded tracks `assets/audio/music-<theme>.m4a` override a theme) | `game/audio/music.js`, `game/audio/samples.js` (`musicBuffer`) |
| Time of day / weather | `game/world/time-of-day.js` (`weatherTint` hook, the zone label), `server/weather.js`, `game/world/weather.js` (rain, and snow / blizzard in the Reach); rain and wind sound `game/audio/rain.js` (`RAIN_SND` volumes) |
| Map / minimap | `game/ui/map.js` |
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
| Dungeons (**planned, not built**: only the pure setup exists and nothing calls it) | `shared/dungeons.js` (map tiles, `dgLayout`, `DG_MISSIONS`, `dgBake`, `dgSolid` / `dgLos` / `dgFlow`, `DG_PARTY`, the three dungeons `DG_THEMES` and bosses `DG_BOSSES`, the hourly offer `dgOffer`, entry rules `dgUnlocked`, the doors `DG_ENTRANCES`) and `shared/dungeon-rewards.js` (`DG_REWARDS`, `dgClearReward`, the level-30 gear, the ring, enhancing, the Tempering Stone); the design, the instance plan for the server, missions, loot, milestones: `docs/DUNGEONS.md` (read it first); the three dungeons, entrances and rewards: `docs/DUNGEON-THEMES.md`; test `node tools/dungeons-smoke.js` → `docs/areas/dungeons.md` |

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
node tools/mainquest-smoke.js    # 91 checks: the main quest, acts I-III, ~15 s
node tools/boss-smoke.js         # 36 checks: the six bosses' move sets, ~2 s
node tools/hoarfrost-smoke.js    # 37 checks: the Hoarfrost Reach, ~5 s
node tools/dungeons-smoke.js     # 81 checks: map tiles, the boss hall vs the arenas, seeded mission layouts, grid, flow field, party table, the three dungeons and bosses, the hourly offer, the entrances, the rewards, ~2 s
node tools/entrance-map.js       # draws docs/dungeon-entrances.png (the three doors on the real terrain); regenerates byte-identically
node tools/tiers-smoke.js        # 34 checks: zone tiers, ~2 s
node tools/professions-smoke.js  # 73 checks: tools, nodes, gathering, crafting, brewing, potions, ~8 s
node tools/skills-smoke.js       # 58 checks: elements, soul, drops, upgrades, passives, boss skills, ~15 s
node tools/client-smoke.js       # 39 checks, the built page headless (solo), ~60 s; runs dist/: build first
node tools/start-smoke.js        # 31 checks: the start card + a new account's editor, ~20 s; runs dist/
node tools/keys-smoke.js         # rebindable keys and hold-Alt; runs dist/
python3 tools/unused.py          # dead-code candidates (names nothing uses, CSS nobody mentions)
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
- **Every instanced mesh must have `instanceColor`.** r128 picks a material's shader program once, from whichever instanced mesh draws first, so a material shared by meshes with and without colours crashes the render loop ("Cannot read properties of null (reading 'isInterleavedBufferAttribute')") in some runs. `addInstanced` and `animMesh` add colours; a new `InstancedMesh` made any other way must too (`client-smoke` checks). Full story: `docs/areas/render.md`.
- Where the rest is: monster models (never mirror with `scale(-1,1,1)`, `poseRig` overwrites the limbs, every `pc(...)` geometry needs normals) → `monsters-bosses.md`; zone tiers (go through `monK`) → `tiers.md`; adding a region (`WZ0` / `HZ0`, constants at load) → `regions.md`; changing the terrain moves things found by scanning (tunnel, Hanami, arenas, the village entrance) → `world.md`; skill cooldowns, the skills panel's drag and drop, fast projectiles → `skills-items.md`; rotations, character facets, a new villager's seeded rng → `character-ui.md`; the dead-server Reconnect page, the class chip, testing the Shared mode → `accounts-net.md`; the browser pane, Windows / OneDrive, flaky tests, reading events in server tests → `docs/TESTING.md`.

## 9. Reference numbers

- Stats: `f(L)=L+(13/12)^L`; HP `20f+armor`; damage `3f+weapon`; defence cut `def/(def+60)`;
  ±5% per level difference; crits 12% ×1.7.
- XP to next `10(L²+(7/6)^L)·K15^((L-5)/10)` up to level 25; from 25 on a level costs as many same-level kills as 25 → 26 (about 2,100: `expToNext` in `shared/balance.js`, so 26-30 are a long but bounded grind); level 10-15 monsters 1.5× HP/XP/coins (`highMult`). `MAX_ZONE_LV` is 30 (quest board, sanitizing); `VALE_TOP_LV` (25) caps the level of the drops skill upgrades ask for; gear stays at tier 5 for levels 25-30.
- Drops: monsters 2% common, 0.5% rare, 0.1% epic; boss 50/10/3/1/0.1% (common…legendary).
- World: the home forest is -HALF..HALF; the whole world is `WX0..WX1` x `WZ0..WZ1` (the vale is x > HALF, 550 m wide; the Hoarfrost Reach is x > HALF
  and z < `HZ0` = -440, down to `WZ0` = -1040: `inHoar(x,z)`; north of the home forest is unwalkable mountains). Use those bounds (not ±HALF) for clamps
  (the home forest's north edge is `HZ0`, not `WZ0`). The heightmap is rectangular (`NVX` x `NVZ`), the terrain is drawn in
  tiles (64 x 128 cells) culled beyond the fog in both directions, and plant chunks more than 320 m away are only grown when you come closer.
- Rarity stat multipliers 1 / 1.3 / 1.7 / 2.2 / 3; 3 identical → next rarity at Greta's forge.
- Shop: unlimited, +20% of base per copy bought, reset at sunrise (server day wraps).
- Quests: 4 notices, level −4…+2 weighted to yours; hunts 10-20 (L1) → 30-50 (L15), bounties 1.5×.
- Slots: skill at level 3, burst at 10; prices 180/650, bursts 2000/4000, mage basics 250/900.
- Day 20 min; rain 5-7 min every 40-60 min, 30% storms.
- Per-area numbers (monster counts, the vale's and the Hoarfrost's progress, zone tiers, elements, measured costs and triangle budgets, character proportions) are in the area guides, under "Reference numbers".

## 10. Ideas not done yet (ask the owner before starting)

(Each gap is commented in `docs/NOT-BUILT.md`.) Professions' next steps (quest-board notices for gathering and crafting, planned in `docs/NOT-BUILT.md` section 1; status-cleansing potions; resources for the lands to come). Zone tiers' next steps (none decided): quest-board notices and their rewards by tier (the board still scales by base level), tier-only loot or a gear tier above 5, a cap or damping on the XP a tier pays, a look for the symbol on the character, a tier picker at the teleport circles. **Dungeons**: designed in `docs/DUNGEONS.md` (milestones M0-M7; M0, the inert setup in `shared/dungeons.js`, is done; its section 13 lists the owner's decisions); no dungeon theme exists. **Agent docs**: CLAUDE.md is a router (rule 8 above): section-4 rows are short and the detail lives in `docs/areas/`; keep it that way. **Decided against**: a gathering animation and tool durability; levels 26-50 (acts IV-VII, planned step by step in `docs/MAIN-QUEST.md` section 7); regional weather on the server; the Hoarfrost's west glacier valley to the Greyspine; the licences of the free-plan music tracks (Suno and Google Flow Music: non-commercial) before the game earns money.
The owner will define the real passive skills (the eight in `PASSIVES` are a placeholder set); monsters' elements do not change the damage they deal to you
yet (a `hurtP` hook, same functions as `foeMult`); Special quests from Bram and other NPCs; group/party system (planned with the dungeons: `docs/DUNGEONS.md` section 5); the XP curve past 15 (levels 16-25 need 400-2100 kills
each: tune `expToNext` / `xpFor` in `shared/balance.js`); animals in the vale; trading between players; more zones or a
second boss; server-side anti-cheat for movement; villagers synced between players; mobile UI polish
seen on a real device.

Performance ideas that would change how the forest looks, so they need the owner's yes (numbers: `docs/areas/render.md`): draw only a share of
the trees in far chunks (`InstancedMesh.count` set in `cullChunks` from the distance, with the instances shuffled once; about -25%
triangles), a low-poly variant of each tree for chunks beyond ~120 m, and rendering the sun's shadow map every few frames (character
shadows would stutter). Also: events (`ev`) still go to everyone, and could be filtered by distance like monsters are.
