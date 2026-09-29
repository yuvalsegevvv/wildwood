# Wildwood: guide for agents

Read this file first. It is written so you can work on the game **without reading the whole codebase**
(about 7,500 lines of JavaScript in 96 files). Open only the files your task touches.

Wildwood is a multiplayer 3D forest RPG in the browser: three.js r128 client, an authoritative world server
that runs in the browser tab (solo / shared room) or in Node (the deployed MMO), procedural 880 m forest,
village with NPCs, 556 monsters in 19 zones (three rings round the village plus the shore, the Sunwall's foot and the Greyspine foothills), roads and a river bridge, a boss; east of the mountains the Sakura Vale (tunnel opened by the
boss, Japanese village Hanami, 240 monsters of levels 16-25 in 10 zones, bosses at 20 and 25, teleport circles);
3 classes with equippable skills (5 levels each, upgraded with coins and monster drops), an element system (soul bound at level 15 in Hanami, elements on skills and monsters), class-universal passives from level 18, 210 items (6 tiers) in 5 rarities, a forge, a quest board, weather, chat, server-side saves in a Postgres database (Neon), player
accounts (guest or name + password; the start card offers Log in, Register, Play as guest).

- Repository: https://github.com/yuvalsegevvv/wildwood (Render deploys every push to `main`).
- The owner also playtests a build published as a claude.ai artifact (Claude app on a phone): the page plus the
  music files next to it (section 6).
- Owner preferences: iterative feature requests; keep token use low (targeted reads, targeted tests);
  **do not commit or push unless asked**; when only one part changes (e.g. the character model), test
  only that part.

## 1. How to find things (do this instead of reading files)

1. `docs/FILES.md` lists every source file with a one-line description (the file's first line).
2. Section 4 below maps common tasks to files.
3. `grep -n "name" -r src/` to find a function; then open only a line range.
4. Every file starts with `//@ one-line description`. Keep that line accurate when you edit.
5. New regions, villages, bosses or lore: read `docs/WORLD.md` first (the continent's geography, planned regions, level ranges and their rules; map `docs/world-map.svg`, drawn by `docs/world-map.py`); story, quests, NPC lines or lore: also `docs/STORY.md` (spoilers; mind its hint rules); the main quest plan: `docs/MAIN-QUEST.md`.

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
  `look{look}`, `chat{text}`, `name{name}`, `warp{}`, `dev{cmd,v}`.
- Server → client: `welcome{...,look?}` (`look` only for a logged-in account: its own look replaces the browser's), `mons{list}` (roster), `you{...}` (private
  state incl. `gear`), `tp`, `kicked`, `auth{user,token}`, `authfail{text}`,
  `snap{day, n, pl, mo, b (one entry per boss), w (weather), ev:[events]}` 8-20×/s, **made per player**: `mo` holds only the monsters
  you can see (within 110 m, bosses 190 m: the client draws 95 / 170 m) and only when changed since the last time they were sent to
  you (those within 40 m every snapshot, farther ones every second), `pl` yourself and the players within 250 m (the rest once a
  second), `n` the head count. Constants `SNAP_*` and the reasoning are in `server/api.js` (`broadcastSnap`). The claude.ai room
  host keeps one message for everyone (`io.broadcastSnaps`), since its channel is one shared 4 KB topic.
- Events (`ev(...)` on the server, `applyEvent` in `net/client.js`): dmg (`[id,v,crit,by[,fx]]`: fx 1 / -1 = the element helped / hurt), kill, imm, mact, aggro, respawn,
  spawn, despawn, proj, pend, tele, tend, roar, area, aend, chain, buff, xp, coins, loot, lvup, hurt, down,
  up, toast, qdone, qturn, pact, pjoin, pleave, pgear, plook, pname, chat, merge, skillslot, skillbuy,
  weather, thunder, lvset, warp, vale, drop (`[pid,mat,n,monId]`), skillup, soul.
- To add a feature that changes state: handle a message in `receive()` (server/api.js), mutate state,
  call `ev('name', ...)` and/or set `p.dirty=true` (→ a `you` update + save), then handle the event in
  `applyEvent` on the client.

## 4. Where to change what

| Task | Files |
|---|---|
| Balance formulas (HP, damage, XP curve, coins, 1.5× for level 10-15) | `shared/balance.js` |
| Monster stats / new monster | `shared/monster-defs.js` (data), `game/combat/monsters.js` (model builders, `animateMonster`), `server/monsters.js` (spawn counts `MON_COUNT`, AI) |
| Boss mechanics / visuals (all three bosses: `BOSS_DEFS` in `shared/monster-defs.js`) | `server/boss.js` / `game/combat/boss.js` |
| Sakura Vale: tunnel `TUN`, Hanami `VIL2`, vale zones/ridges, arenas `ARENAS`, `vilAt` | `shared/vale.js`; meshes `game/village/buildings-vale.js`; tunnel collision `worldBounds` in `game/player/movement.js`; unlock / attune / `warpP` in `server/players.js`; Hanami NPCs (`vil:2`) in `game/village/villagers.js` |
| Items, rarity, prices, drop rates, merge | `shared/items.js` (`RARITY`, `RAR_MULT`, `rollMonsterRarity`, `rollBossRarity`, `shopPrice`) |
| Item icons | `game/ui/item-icons.js` |
| Skills (all 3 slots, all classes) | `shared/classes.js` (`SKILLS`, `abilityOf`, slot levels) → effects `server/combat.js` (`resolveHitS`, `updateAreasS`, projectiles) → visuals `game/combat/skill-fx.js`, `game/combat/attacks.js` (`attackVisuals`, projectiles), icons `ICONS` in `game/ui/combat-hud.js` (also the passives'). A new attack path must hand the skill's element (`a.el` / `pr.el` / `A.el`) to `damageMonsterS`, or the soul bonus silently does not apply |
| Boss skills (dropped by a boss at 10% per skill, 6 per boss: a skill and a burst for each class; not sold, no upgrades yet) and generic skill effects (`fx`) | rows with `drop:'<boss id>'` at the end of `SKILLS` (`shared/classes.js`), `BOSS_SKILLS` / `BOSS_SKILL_CHANCE` in `shared/drops.js`; effects `resolveFxS` / `impactFxS` / `applyBuffS` / `statusS` / `updateBurnS` and the drop roll `bossSkillDropP` in `server/combat.js`; visuals `fxVisuals`, `onBeam`, zones (`updateZoneFx`) in `game/combat/skill-fx.js`, projectiles `GEN_PROJ` in `game/combat/attacks.js`; the panel's Boss tiles in `game/economy/skills.js`. Adding a skill with `fx` needs no server or client code: a row, an icon in `ICONS` and (for a new kind of effect) an entry in `resolveFxS` |
| Elements: which skill / monster has which (`el` field), the soul (bind at level 15 in Hanami), the x1.5 rules | `shared/elements.js` (`ELEMS`, `soulMult`, `foeMult`, `ELEM_BOOST`); server `elemHitS` / `rollDmgS` in `server/combat.js`, `bindSoulP` in `server/economy.js`; panel + chips `game/economy/soul.js`; the shrine maiden Kaede in `VILLAGERS` (`role:'soul'`, `late:true`); target frame `#tEl`, `onMonDmg` arrows |
| Skill levels / upgrades and monster drops (materials) | `shared/drops.js` (`MATS`, `DROP_CHANCE`, `upgradeNeeds`, `UP_COINS`, `UP_COUNT`), `shared/classes.js` (`skillPower`, `skillCdMult`, `abilityCd`); server `upgradeSkillP`, `addMatP`, `rewardKill`; UI `game/economy/skills.js` (details + Upgrade), materials list in `game/economy/inventory.js` |
| Passive skills (class-universal, level 18) | `PASSIVES` in `shared/classes.js` (`stat`, `v`, `text`) read with `passiveSum` (`psP(p,stat)` on the server: hp in `recalcP`, dmg / crit in `rollDmgS`, red in `hurtP`, cd in `abilityCd`, drop / xp in `rewardKill`, soul in `elemHitS`); slots + unlock `autoEquipPassiveP` / `equipPassiveP` in `server/players.js` / `economy.js`; `PASSIVE_OPEN` (in `classes.js`) is how many of the 3 slots are usable: slots after it are locked in the panel, refused by the server, ignored by `passiveSum` and cleared from saves |
| The skills panel (tabs, drag and drop onto slots) | `game/economy/skills.js` (`skTile`, `skInfoHtml`, `SKD` drag state; styles `18-skills.css`); test `client-smoke` |
| Quest board generation / rewards | `shared/quests.js` (`genQuest`, `huntCount`, `questRewardFor`); server actions `server/economy.js`; panel `game/economy/quests.js` |
| Shops / forge / skills panel / inventory | `game/economy/shops.js`, `forge.js`, `skills.js`, `inventory.js` (+ server `economy.js`) |
| Village layout, board, stalls | `shared/village-layout.js` (positions, colliders `V.boxes`), `game/village/buildings.js` (meshes) |
| NPCs (who, where, role, lines, labels) | `game/village/villagers.js` (`VILLAGERS`), `talking.js` (`openRolePanel`), `npc-labels.js` |
| Character body, face, hair, hats | `game/character/model.js` (`buildCharacter`, `muscleLimb`, `sculpt`, `smoothN`; look defaults `LOOK_M`/`LOOK_F`, palettes `HAIRC` (+`HAIRC_NATURAL`), `SKINS`, `CLOTH`...; `randomLook(rng,{villager,base})` serves both "Surprise me" and random villagers: villagers use a seeded rng, so its draw order must not change); armour looks `ARMOR_LOOK` in `shared/items.js`; editor rows `EDIT` in `game/ui/character-editor.js` (`fem:true` = female-only row, `close:true` = the tab frames the head) |
| Start card: Log in / Register / Play as guest (Solo / Shared without a server), loading state, connecting, `beginPlay`; the first steps of a new account (character editor in creating mode, `openEditor({create:true})`) | `game/ui/start-screen.js` (`enterWorld`, `showStart`), markup `#start` in `index.html`, `styles/04-start-screen.css`; session token and the server's auth answers `game/ui/account.js`; `netReset` in `game/net/transport.js`; test `node tools/start-smoke.js` |
| Animations | `game/character/pose.js` (`poseRig`; skill anims borrow kinds via `ANIM_OF`) |
| World size, lakes, terrain | `shared/terrain.js` (`SIZE`, `LAKES`, `baseHeight`), `shared/zones.js` (`RINGS`, zones, arena) |
| The lands' edges (Crownsea shore, the Sunwall and Redgate Canyon, snowy northern rims, all curved by noise) and the placeholder lands beyond; the edge zones and their monsters (`EDGE_ZONES`, `edgeZoneAt`, `defZone` in `shared/zones.js`; rows with `zone:` in `MON_DEFS`) | `shared/terrain.js` (`coastDist`, `shore`, `sunwall`, `bareGround`), colours `game/world/terrain-color.js`, the sea limit in `worldBounds` (`game/player/movement.js`), names `edgeName` (`game/ui/map.js`); placeholders `game/world/far-lands.js` (`FAR_COAST`, `FAR_ISLES`, `farHeight`); design `docs/WORLD.md` |
| Roads and the river bridge | `shared/roads.js` (`ROADS` waypoints, `roadDist`, `nearRoad`, `BRIDGES`, `bridgeDeck`); the bridge's model `game/world/bridges.js`; walking on it `updatePlayer` (movement.js); road names on the map (`placeName`); the map's wavy outline `mapEdgeAlpha` (map.js) |
| The main quest line (plan, not built yet) | `docs/MAIN-QUEST.md` (steps, levels, rewards, how to build it); story `docs/STORY.md` |
| Vegetation / animals | `game/world/plant-models.js`, `generation-*.js`, `game/wildlife/animals.js` |
| Background music (a theme per village, level range and boss; `THEMES`, `musicThemeHere`; recorded tracks `assets/audio/music-<theme>.m4a` override a theme) | `game/audio/music.js`, `game/audio/samples.js` (`musicBuffer`) |
| Time of day / weather | `game/world/time-of-day.js` (`weatherTint` hook), `server/weather.js`, `game/world/weather.js`; rain sound `game/audio/rain.js` (`RAIN_SND` volumes) |
| Map / minimap | `game/ui/map.js` |
| Chat / names / account code | `game/ui/chat.js`, `game/ui/account.js`; server `chatP`, `renameP` in `server/economy.js` |
| Saves, accounts, migration | `server/api.js` (`beginJoin`, `saveP`, `flushAll`), `server/players.js` (`sanitize*`), `node/main.js` (stores, `AUTH` password hashing) |
| Registered accounts (name + password, guest, unique names, gift levels `GIFT_LEVELS`) | `server/accounts.js`, client `game/ui/account.js` (settings, session) and `start-screen.js`; tests `node tools/accounts-smoke.js`, `start-smoke.js` |
| What each client is sent (snapshot ranges and rates, `SNAP_*`) | `server/api.js` (`broadcastSnap`); client `applySnap` in `game/net/client.js` |
| Testing tools (dev commands) | `server/economy.js` (`devP`), `game/ui/settings-testing.js`, markup in `index.html` (`#tSec`) |
| HUD, action bar | `game/ui/combat-hud.js`, `game/player/input.js`, `game/ui/controls-legend.js` |
| Keys: the rebindable actions (`KB_ACTIONS`: id, name, default main + spare key), saving (`wildwood-keys`), swapping, labels (`kbName`, AZERTY via `getLayoutMap`), the `data-kb` hints on HUD buttons, the Controls list in Settings (`#kbSec`). A key handler asks `kbIs(e.code,'<action>')` / `kbHeld('<action>')`, never a literal `KeyX`. A new action = a row in `KB_ACTIONS` + its handler (a new default key must not collide with another action's; `kbLoad` keeps saved keys first) | `game/player/keybinds.js` (+ the handlers in `input.js`, `combat-hud.js`, `talking.js`, `economy/init.js`, `ui/map.js`, `ui/settings-sound.js`, `ui/chat.js`, `movement.js`); test `node tools/keys-smoke.js` |
| The AI disclosure (bottom-left note: everything, assets and music included, is made with AI; keep it visible and keep the chat above it) | `#aiNote` in `index.html`, `styles/02-hud.css` (the desktop chat is lifted above it in `19-chat.css`) |
| Hold Alt = free mouse (releases pointer lock, locks again on release; a canvas click does nothing meanwhile) | `altDown` / `altUp` / `altHeld` in `game/player/input.js`; the `mousedown` guard in `game/ui/combat-hud.js` |
| Transports / host election | `game/net/transport.js` |

## 5. Rules and conventions

- Keep files focused (most are under 250 lines). New file → add it to `src/manifest.json` in the right
  place, start it with a `//@` line, update `docs/FILES.md`.
- three.js is **r128**: no `CapsuleGeometry`; `OrbitControls` isn't available. Geometry is merged per
  character/object; colours are vertex colours painted with `pc(geo, fn)` / `paint`.
- The published page is one self-contained HTML file: no external requests (CSP), no remote images,
  no inline `onclick` (bind in script). Only Google Fonts load. The one exception is the background music
  (`assets/audio/music-*`, 9 MB): it is not in the page (the artifact caps a page at 16 MB and every visitor downloads it),
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

## 6. Build and test cheaply

```
npm install                      # three@0.128 for the tools, pg for Postgres (optional)
python3 build.py                 # → dist/ (quiet, ~1 s)
python3 build.py --check         # + syntax check of every bundle + duplicate-name check  (always run this)
node tools/server-smoke.js       # 16 headless server checks from src/ (no build), ~5 s, prints PASS/FAIL
node tools/accounts-smoke.js     # 17 checks of accounts (register, login, tokens, unique names, the account's look), ~1 s
node tools/skills-smoke.js       # 51 checks of elements, the soul shrine, monster drops, skill upgrades, passives and the 18 boss skills (server from src/), ~15 s
node tools/client-smoke.js       # 17 checks running the built page headless (solo), ~45 s (also draws every boss skill). It runs dist/: build first
node tools/start-smoke.js        # 27 checks of the start card + a new account's character editor, against a real server in-process, ~20 s
node tools/keys-smoke.js         # checks of the rebindable keys (defaults, swap, save/load, hints) and of hold-Alt; runs dist/: build first
python3 tools/unused.py          # dead-code candidates (names nothing uses, CSS nobody mentions)
npm test                         # build --check + all of the above
node tools/model-preview.js out.png [--head] [--looks '[{...}]']   # character model → PNG (numpy+pillow)
node dist/wildwood-server.js --port 8080     # real server; open http://localhost:8080 in several tabs
```

The model preview shades per pixel from the mesh normals (like the game), so seams and facets show in it.
For a close-up of another body part, render once, then re-run the rasterizer on the JSON it leaves in the
OS temp dir: `python3 tools/rast.py <tmp>/model-preview.json out.png 260 300 1.3` (last number = centre
height in metres: 1.3 torso, 1.7 head). On Windows `python3` needs `pip install numpy pillow` first.

Pick the smallest test that covers your change: model/face/hats → `model-preview` only; server rules →
`server-smoke` / `skills-smoke` (or a few lines with `tools/load.js`: `loadServer(io, ['MONS','genQuest'])` gives you the
server API plus any internal names); client UI → `build --check` + `client-smoke`; the start card, accounts or the character editor →
`start-smoke`. The headless client (`tools/headless.js`) stubs the DOM: elements are cached per selector and remember their
listeners and children (`c.el('#stGuest').click()`, `el._kids`, `el._a`), but there is no layout, so read state from game variables
(`expose` names) rather than DOM text where you can. To check that a test can fail, break the code it covers, run it, restore
(this is how `start-smoke` was validated).

Publishing the claude.ai playtest artifact (in claude.ai sessions only): copy `dist/wildwood.html` (about 1.2 MB) to the
outputs folder and publish it to the same link, https://claude.ai/artifact/VCvNoypJ63mXoU3bgztYtY
(label "Wildwood forest", title "Wildwood — forest simulator", favicon 🌲), with capabilities
`{room:{topics:{c:"interact",s:"interact"}}}` (needed for Shared mode). Publish the music as supporting files of the
same artifact: `files` maps `audio/<name>.<hash>.m4a` to each `dist/audio/` file (contentType `audio/mp4`); the page
fetches them by that relative path (the Artifact contract allows `fetch()` of files published alongside the page). Names
hold a content hash, so unchanged tracks keep their URL (cached in the viewer's browser); when a track was re-encoded, publish
the new file and set the old path to `null`. Not yet checked in the real artifact sandbox: if the music there is the old generated
kind, the fetch failed. Fallback: `python3 build.py --inline-audio` embeds everything again (13.6 MB, under the 15 MB cap,
no room to grow). Every music track is downloaded once per client (in-memory bytes + Cache Storage `wildwood-music-v1`, and on the
Node server immutable HTTP caching), so check `read_network_requests` in the browser pane after a change to `samples.js`.

## 7. Deploy (Render)

`render.yaml`: build `npm install --omit=dev ... && python3 build.py`, start
`node dist/wildwood-server.js --no-dev` (testing tools off for players), health check `/healthz`.
Live at https://wildwood-wib9.onrender.com (service `wildwood`, free plan: sleeps after 15 min idle, ~30-50 s
to wake). `dist/` is not committed. `GET /status` shows players, monsters, storage kind (`"saves":"postgres"`
when the database is connected) and the number of saved accounts.
Traffic: the page is ~350 KB gzipped with an `ETag` (`no-cache` + 304 when unchanged); music is served from `/audio/<name>.<hash>.m4a`
(`dist/audio/`, whitelist of names read at start, `cache-control: public, max-age=31536000, immutable`), so a returning
player downloads nothing but a 304, and a new player downloads only the tracks of the places they visit (~1-1.7 MB each).
`wildwood-server.js` must stay next to its `audio/` folder (or set `AUDIO_DIR`); without it the game plays generated music.
Game traffic, per client (measured on the server's own snapshots, `broadcastSnap`): about 8 KB/s alone, 11-12 KB/s with 10-40 players
spread over the woods (before per-player snapshots: 63-79 KB/s, and the total out of the server grew with the square of the players).
The free plan allows 100 GB a month outbound: 100 players playing 3 hours a day would use about 35 GB.

**Database (exists, in use).** A free **Neon** Postgres (neon.tech, project `wildwood`, branch `production`,
database `neondb`, free tier: 0.5 GB, no expiry, compute sleeps after 5 min idle and wakes in ~1 s). Render's
env var `DATABASE_URL` holds its connection string (the secret lives only in Render and Neon, never in the
repo or chat). One table, created automatically by `pgStore` in `node/main.js`:
`wildwood_players(id text PRIMARY KEY, data jsonb, updated_at timestamptz)`.
- `id` = sha256 of `'wildwood:'+key` (first 40 hex): key is the guest's browser account code, or
  `'user:'+lowercase name` for a registered account (so a name maps to one row: that is the uniqueness).
- `data` = `{v,name,look,level,exp,gear,updated}`, plus `auth:{user, pass:'salt:scrypt-hash', tokens:[sha256 of
  session tokens, last 5]}` for registered accounts, or `{movedTo:name}` for a guest code that registered.
- Neon's SQL Editor can inspect or fix rows (e.g. a forgotten password: there is no email, so no reset;
  the owner would clear `data->'auth'` tokens or set a new hash by hand).
- The pool is built for a sleeping free database: `'error'` listener (a dropped idle connection must not
  crash the server), 60 s idle close, 15 s connect timeout, table creation retried on the next query.
- Without `DATABASE_URL`, saves go to JSON files in `DATA_DIR` (default `./data`), which Render wipes on
  every deploy/restart. Don't use Render's own free Postgres: it is deleted after 30 days.

**Accounts** (`server/accounts.js`, client `game/ui/start-screen.js` + `account.js`, only in "This server" mode):
- Guest = progress under the browser's secret account code (every player from before accounts is a guest
  with their old progress). Log in = name + password; the browser then keeps a session token
  (`wildwood-session`) and the start card then offers "Continue as <name>". The start card's **Register** connects as a guest,
  registers (the guest's progress moves to the account) and opens the character editor in creating mode; guests can also register in
  Settings → Account. The guest record becomes `{movedTo}` (can't be replayed as a second copy).
- An account's look is kept in its record and comes back in `welcome` when logging in, so a new device shows the same hiker.
- Names are unique (case-insensitive): registered names can't be taken or renamed; a guest whose name is
  taken (registered or online) gets a number added. Registered names are loaded at start (`store.users()`).
- Passwords: scrypt in `AUTH` (`node/main.js`), 6-100 chars; 5 wrong tries lock that account for 1 minute.
- `GIFT_LEVELS` in `accounts.js`: restores a level on register/login (`hayru: 9`, a friend who lost progress).
- While logged in, the client does not write its local save (`saveGear`/`saveProgress`), so a guest on
  the same browser can't inherit the account's progress.
- Tests: `node tools/accounts-smoke.js` (server, in-memory store), `node tools/start-smoke.js` (the start card and editor on top of it).

## 8. Pitfalls already hit (don't repeat them)

- Duplicate top-level names across files (now caught by `--check`).
- Using state before it exists at load: `GEAR` is null until economy loads (guard `GEAR&&GEAR.skills`),
  `NET` is `var` on purpose.
- Fast projectiles tunnel through small monsters: hits test the segment flown each tick (`near()` in
  `updateProjS`). Piercing arrows skim the terrain and test in 2D.
- A second login of the same account must take the live in-memory state, not the (older) saved record.
- Rotations: an NPC anchor face `f` looks along `(-sin f, -cos f)`; a character's front is −z; a positive
  `rotateX` tilt on a head shell lifts its front rim (hats). Measure with a quick numeric check before
  guessing signs.
- `pkill -f "<text>"` also kills the shell running it if the text is in the command line: kill by PID.
- Character facets: Lambert (per-vertex) lighting, `computeVertexNormals` seams on lathes/spheres, and a
  per-vertex random colour hash all made single triangles visible. Now: Phong, `smoothN`, and a faint
  smooth `noise2` tint in `pc`. Don't reintroduce any of them on characters.
- Skill cooldowns are per slot on the server, so swapping skills doesn't reset them (tests must reset
  `p.cd` directly).
- `npm install` inside the OneDrive folder may fail to install the optional `pg` and strip it from
  `package-lock.json`: restore the lockfile (`git checkout package-lock.json`); for a local Postgres test
  install `pg` in a temp folder and run the server with `NODE_PATH` pointing there.
- The built-in browser pane throttles timers when hidden: the start screen can sit on "Shaping the hills…"
  until it is visible (take a screenshot every few seconds) before the buttons enable. Frames only run around screenshots, so read
  per-frame numbers (draw calls, fps) between two screenshots, not after a `setTimeout`.
- The hidden browser pane pauses frames but a solo/host server keeps simulating (timers): teleporting next to
  monsters and taking screenshots gets you knocked out before a frame renders. Testing tools have "Go to the
  tunnel" (the button's `data-v` can be `in`, `east`, `hanami` or `x,z` with **integers**: `-4.4,8.8` silently goes to the west portal).
- A class chip that "did nothing": `equipClass` only sends a message, so it can't work before a connection exists, and the editor
  did not redraw when the server confirmed the new weapon. The start card no longer offers class or sex before connecting; the editor
  redraws in `applyGear`. Anything on the start card that needs the server must wait for `NET.ready`.
- `tools/client-smoke.js` used to count `requestAnimationFrame` calls: the world takes a few thousand frames to stream in, and a stopped
  loop stops `netTick`, so the server never learns the player moved and every attack misses. `headless.js` runs frames until `stop()`.
- `tools/server-smoke.js` "forge merges 3" fails now and then (about 1 run in 15, also on older commits): it depends on a random item from the testing tool. Not a regression.
- A page whose server was stopped (or restarted) used to look alive but ignore everything (equip, attack, buy: the message went to a closed socket, the clock froze). It now shows a Reconnect message (`netDown` in `net/transport.js`: on a closed socket, a send to a closed socket, or no message for `NET_STALL_MS` while playing on the Node server). Remember it when testing: stopping the dev server under an open tab is what triggers it, and a recording of "nothing works" with a frozen clock is a dead connection, not a UI bug.
- Skills panel drag and drop: every tile can be dragged (so a refused drop always says why); the panel is not redrawn while a tile is held (the server's `you` updates would remove the element under the finger: `SKD.pending`); `pointerup` outside the window is caught by pointer capture. Don't reintroduce a silent `data-drag="0"`.
- Server tests read events from the snapshots: an `ev(...)` reaches a test's log only with the next snapshot (about 2 ticks), so tick 3 times before checking `evs`.
  `client-smoke` / `start-smoke` run the *built* page: a stale `dist/` gives false failures, run `python3 build.py` first.
- A new hard-coded villager changes every random villager's look (the seeded rng's draw order): give it `late:true` (spawned after the others, own rng).
- Windows: `shutil.rmtree` on `dist/audio` fails under OneDrive (build.py deletes the files, not the folder); a `cd dist` in one shell
  call stays for the next (use absolute paths); backslashes inside a bash heredoc get lost (write the script to a file instead);
  `git worktree remove` may leave `.git/worktrees/<name>` behind (delete it by hand).
- Replacing text with `str.replace(old,new,1)` after inserting a helper that contains `old` replaces the helper's copy: this made
  `addVillageMeshes` call itself. Run `client-smoke` after moving code.
- The Shared (room) mode is only testable against the mock in `tools/`-style harnesses; the host tab
  must stay visible (browser timers throttle in background tabs).

## 9. Reference numbers

- Stats: `f(L)=L+(13/12)^L`; HP `20f+armor`; damage `3f+weapon`; defence cut `def/(def+60)`;
  ±5% per level difference; crits 12% ×1.7.
- XP to next `10(L²+(7/6)^L)·K15^((L-5)/10)`; level 10-15 monsters 1.5× HP/XP/coins (`highMult`).
- Monsters: 40 of each level-1 kind down to 26 of each level-11 kind, levels 12-15 a quarter more (30 down to 25: their zones reach the land's edge), the
  four edge kinds their own `count` (16-28); respawn 35 s; think within 110 m.
- Drops: monsters 2% common, 0.5% rare, 0.1% epic; boss 50/10/3/1/0.1% (common…legendary).
- World: the home forest is -HALF..HALF; the whole world is `WX0..WX1` x `WZ0..WZ1` (the vale is x > HALF, 550 m wide).
  Use those bounds (not ±HALF) for clamps. The heightmap is rectangular (`NVX` x `NVZ`), the terrain is drawn in
  x-strips culled beyond the fog, and plant chunks more than 320 m away are only grown when you come closer.
- Vale progress: `gear.east` 0 sealed, 1 tunnel open (anyone rewarded for a Rootwarden kill), 2 walked into Hanami
  (teleport circles work). Vale monsters: 2 kinds per level, 12 of each; gear tiers 4-5 at levels 20 and 25.
- Measured costs (desktop, village): the client's JS is about 0.2 ms per frame (headless, no GPU); the GPU draws about 750 calls and
  5.5 M triangles per frame, of which about 3.7 M are instanced trees (chunks are 110 m, fog ends at 230 m; 42% of the triangles are
  120 m or farther); the world takes about 1.1 s of JS to generate (17% is `noise2`). The server ticks in under 5 ms with 40 players
  spread over the woods (about 4% of a core).
- Elements: soul match x1.5, soul opposite x1/1.5 (pairs fire/water, earth/air, dark/light: `ELEM_OPP`); against monsters the wheel water > fire > air > earth > water plus dark <> light (`ELEM_BEATS`): a skill that beats the monster's element x1.5, one it beats or its own element x1/1.5 (`ELEM_BOOST`, soul and wheel stack).
  Soul unlocks at level `SOUL_LV` 15 (Hanami's Kaede), passives at `PASSIVE_LV` 18 (3 slots exist, only `PASSIVE_OPEN` = 1 is usable, the others are locked for now). Skill level 1-5: +12% damage and -3% cooldown per level.
  Boss skills: each of the boss's 6 skills has a 10% chance per kill, per player who helped. Burn: a share (k) of the hit's damage every second. Pull = negative knockback.
  Drops: 35% per kill (a boss always 3), upgrade to level n needs `UP_COUNT` 4 / 6 / 9 / 14 drops + coins (`UP_COINS` x (n-1)^1.7) and, at level 5, 2 boss trophies.
- Rarity stat multipliers 1 / 1.3 / 1.7 / 2.2 / 3; 3 identical → next rarity at Greta's forge.
- Shop: unlimited, +20% of base per copy bought, reset at sunrise (server day wraps).
- Quests: 4 notices, level −4…+2 weighted to yours; hunts 10-20 (L1) → 30-50 (L15), bounties 1.5×.
- Slots: skill at level 3, burst at 10; prices 180/650, bursts 2000/4000, mage basics 250/900.
- Day 20 min; rain 5-7 min every 40-60 min, 30% storms.
- Character proportions (style between realistic and anime): about 7.2 heads tall; hips at 0.92 m, head
  centre 0.72 above the hips, head scale 1.18 (female 1.15), eyes ~15-25% larger than real; short neck.
  Female `chest` 0.5-1.6 (default 1): a slider on the character editor's Body tab (`EDIT` in `ui/character-editor.js`,
  `fem:true`; it is not in Settings); named NPCs set it in `VILLAGERS`, random villagers roll
  0.7-1.35 in `randomLook`. Default looks have no backpack.

## 10. Ideas not done yet (ask the owner before starting)

The owner will define the real passive skills (the eight in `PASSIVES` are a placeholder set); monsters' elements do not change the damage they deal to you
yet (a `hurtP` hook, same functions as `foeMult`); Special quests from Bram and other NPCs; group/party system; the XP curve past 15 (levels 16-25 need 400-2100 kills
each: tune `expToNext` / `xpFor` in `shared/balance.js`); animals in the vale; trading between players; more zones or a
second boss; server-side anti-cheat for movement; villagers synced between players; mobile UI polish
seen on a real device.

Performance ideas that would change how the forest looks, so they need the owner's yes (numbers in section 9): draw only a share of
the trees in far chunks (`InstancedMesh.count` set in `cullChunks` from the distance, with the instances shuffled once; about -25%
triangles), a low-poly variant of each tree for chunks beyond ~120 m, and rendering the sun's shadow map every few frames (character
shadows would stutter). Also: events (`ev`) still go to everyone, and could be filtered by distance like monsters are.
