# Wildwood: guide for agents

Read this file first. It is written so you can work on the game **without reading the whole codebase**
(about 5,700 lines of JavaScript in 85 files). Open only the files your task touches.

Wildwood is a multiplayer 3D forest RPG in the browser: three.js r128 client, an authoritative world server
that runs in the browser tab (solo / shared room) or in Node (the deployed MMO), procedural 880 m forest,
village with NPCs, 451 monsters in 16 zones, a boss; east of the mountains the Sakura Vale (tunnel opened by the
boss, Japanese village Hanami, 240 monsters of levels 16-25 in 10 zones, bosses at 20 and 25, teleport circles);
3 classes with equippable skills, 210 items (6 tiers) in 5 rarities, a forge, a quest board, weather, chat, server-side saves in a Postgres database (Neon), player
accounts (guest or name + password).

- Repository: https://github.com/yuvalsegevvv/wildwood (Render deploys every push to `main`).
- The owner also playtests a single-file build published as a claude.ai artifact (Claude app on a phone).
- Owner preferences: iterative feature requests; keep token use low (targeted reads, targeted tests);
  **do not commit or push unless asked**; when only one part changes (e.g. the character model), test
  only that part.

## 1. How to find things (do this instead of reading files)

1. `docs/FILES.md` lists every source file with a one-line description (the file's first line).
2. Section 4 below maps common tasks to files.
3. `grep -n "name" -r src/` to find a function; then open only a line range.
4. Every file starts with `//@ one-line description`. Keep that line accurate when you edit.

## 2. Architecture in one screen

```
src/shared/   pure rules and data (no DOM, no three.js): terrain, village layout, zones, balance, monster /
              item / quest / class+skill definitions. Loaded into BOTH the client and the server bundles.
src/server/   the authoritative world server: players, monsters AI, combat, boss, economy, weather, api.
src/node/     Node host: HTTP + zero-dependency WebSocket, save storage (files or Postgres), shutdown.
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
  `buyskill/eqskill{id}`, `unskill{cls,slot}`, `look{look}`, `chat{text}`, `name{name}`, `warp{}`, `dev{cmd,v}`.
- Server → client: `welcome`, `mons{list}` (roster), `you{...}` (private state incl. `gear`), `tp`, `kicked`, `auth{user,token}`, `authfail{text}`,
  `snap{day, pl, mo, b (one entry per boss), w (weather), ev:[events]}` 8-20×/s.
- Events (`ev(...)` on the server, `applyEvent` in `net/client.js`): dmg, kill, imm, mact, aggro, respawn,
  spawn, despawn, proj, pend, tele, tend, roar, area, aend, chain, buff, xp, coins, loot, lvup, hurt, down,
  up, toast, qdone, qturn, pact, pjoin, pleave, pgear, plook, pname, chat, merge, skillslot, skillbuy,
  weather, thunder, lvset, warp, vale.
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
| Skills (all 3 slots, all classes) | `shared/classes.js` (`SKILLS`, `abilityOf`, slot levels) → effects `server/combat.js` (`resolveHitS`, `updateAreasS`, projectiles) → visuals `game/combat/skill-fx.js`, `game/combat/attacks.js` (`attackVisuals`, projectiles), icons `ICONS` in `game/ui/combat-hud.js` |
| Quest board generation / rewards | `shared/quests.js` (`genQuest`, `huntCount`, `questRewardFor`); server actions `server/economy.js`; panel `game/economy/quests.js` |
| Shops / forge / skills panel / inventory | `game/economy/shops.js`, `forge.js`, `skills.js`, `inventory.js` (+ server `economy.js`) |
| Village layout, board, stalls | `shared/village-layout.js` (positions, colliders `V.boxes`), `game/village/buildings.js` (meshes) |
| NPCs (who, where, role, lines, labels) | `game/village/villagers.js` (`VILLAGERS`), `talking.js` (`openRolePanel`), `npc-labels.js` |
| Character body, face, hair, hats | `game/character/model.js` (`buildCharacter`, `muscleLimb`, `sculpt`, `smoothN`; look defaults `LOOK_M`/`LOOK_F`, palettes `HAIRC` (+`HAIRC_NATURAL`), `SKINS`, `CLOTH`...); armour looks `ARMOR_LOOK` in `shared/items.js`; editor rows `EDIT` in `game/ui/character-editor.js` (`fem:true` = female-only row), random looks `randomLook` there and in `village/villagers.js` |
| Animations | `game/character/pose.js` (`poseRig`; skill anims borrow kinds via `ANIM_OF`) |
| World size, lakes, terrain | `shared/terrain.js` (`SIZE`, `LAKES`, `baseHeight`), `shared/zones.js` (`RINGS`, zones, arena) |
| Vegetation / animals | `game/world/plant-models.js`, `generation-*.js`, `game/wildlife/animals.js` |
| Background music (a theme per village, level range and boss; `THEMES`, `musicThemeHere`; recorded tracks `assets/audio/music-<theme>.m4a` override a theme) | `game/audio/music.js`, `game/audio/samples.js` (`musicBuffer`) |
| Time of day / weather | `game/world/time-of-day.js` (`weatherTint` hook), `server/weather.js`, `game/world/weather.js`; rain sound `game/audio/rain.js` (`RAIN_SND` volumes) |
| Map / minimap | `game/ui/map.js` |
| Chat / names / account code | `game/ui/chat.js`, `game/ui/account.js`; server `chatP`, `renameP` in `server/economy.js` |
| Saves, accounts, migration | `server/api.js` (`beginJoin`, `saveP`, `flushAll`), `server/players.js` (`sanitize*`), `node/main.js` (stores, `AUTH` password hashing) |
| Registered accounts (name + password, guest, unique names, gift levels `GIFT_LEVELS`) | `server/accounts.js`, client `game/ui/account.js`; test `node tools/accounts-smoke.js` |
| Testing tools (dev commands) | `server/economy.js` (`devP`), `game/ui/settings-testing.js`, markup in `index.html` (`#tSec`) |
| HUD, action bar, keys | `game/ui/combat-hud.js`, `game/player/input.js`, `game/ui/controls-legend.js` |
| Transports / host election | `game/net/transport.js` |

## 5. Rules and conventions

- Keep files focused (most are under 250 lines). New file → add it to `src/manifest.json` in the right
  place, start it with a `//@` line, update `docs/FILES.md`.
- three.js is **r128**: no `CapsuleGeometry`; `OrbitControls` isn't available. Geometry is merged per
  character/object; colours are vertex colours painted with `pc(geo, fn)` / `paint`.
- The published page is one self-contained HTML file: no external requests (CSP), no remote images,
  no inline `onclick` (bind in script). Only Google Fonts load.
- The server never trusts client numbers it can recompute: sanitize saves (`sanitizeGear`,
  `sanitizeQuest`, `sanitizeSkills`), recompute rewards, clamp counts, clean names/chat.
- Put player-visible text through `textContent` (names and chat are user input).
- Snapshots and events must stay small: a room message is at most 4 KB (`chunkSend` splits larger ones);
  send monsters only when changed (`snapKey`), round numbers (`r1`).
- Comments explain *why* and the numbers a designer would tune; keep them current.
- Saves: new player fields go in `gear` (saved) and must be sanitized with a default for old saves.
- Performance: the phone (low/lite mode: `LOW`, `LITE`, `Q` in `core/setup.js`) matters.
- Character look (`LOOK`) fields: add a default to both `LOOK_M` and `LOOK_F` (old saves and other players'
  looks are merged onto them) and clamp the value inside `buildCharacter`: the server passes looks through
  unsanitized (only a 2 KB size limit), so a remote player's look can hold anything.
- Character shading: `matChar` is a Phong material (per-pixel light). For curved body/cloth surfaces call
  `smoothN(g)` instead of `g.computeVertexNormals()`, so lathe/sphere seams don't show. Shape body features
  (e.g. the bust) by deforming the torso lathe, not by adding spheres.

## 6. Build and test cheaply

```
npm install                      # three@0.128 for the tools, pg for Postgres (optional)
python3 build.py                 # → dist/ (quiet, ~1 s)
python3 build.py --check         # + syntax check of every bundle + duplicate-name check  (always run this)
node tools/server-smoke.js       # 14 headless server checks from src/ (no build), ~5 s, prints PASS/FAIL
node tools/accounts-smoke.js     # 15 checks of accounts (register, login, tokens, unique names), ~1 s
node tools/client-smoke.js       # 9 checks running the built page headless (solo), ~40 s
node tools/model-preview.js out.png [--head] [--looks '[{...}]']   # character model → PNG (numpy+pillow)
node dist/wildwood-server.js --port 8080     # real server; open http://localhost:8080 in several tabs
```

The model preview shades per pixel from the mesh normals (like the game), so seams and facets show in it.
For a close-up of another body part, render once, then re-run the rasterizer on the JSON it leaves in the
OS temp dir: `python3 tools/rast.py <tmp>/model-preview.json out.png 260 300 1.3` (last number = centre
height in metres: 1.3 torso, 1.7 head). On Windows `python3` needs `pip install numpy pillow` first.

Pick the smallest test that covers your change: model/face/hats → `model-preview` only; server rules →
`server-smoke` (or a few lines with `tools/load.js`: `loadServer(io, ['MONS','genQuest'])` gives you the
server API plus any internal names); client UI → `build --check` + `client-smoke`. The headless client
stubs the DOM: element getters return fresh stubs, so read state from game variables, not DOM text.

Publishing the claude.ai playtest artifact (in claude.ai sessions only): copy `dist/wildwood.html` to the
outputs folder and publish it to the same link, https://claude.ai/artifact/VCvNoypJ63mXoU3bgztYtY
(label "Wildwood forest", title "Wildwood — forest simulator", favicon 🌲), with capabilities
`{room:{topics:{c:"interact",s:"interact"}}}` (needed for Shared mode).

## 7. Deploy (Render)

`render.yaml`: build `npm install --omit=dev ... && python3 build.py`, start
`node dist/wildwood-server.js --no-dev` (testing tools off for players), health check `/healthz`.
Live at https://wildwood-wib9.onrender.com (service `wildwood`, free plan: sleeps after 15 min idle, ~30-50 s
to wake). `dist/` is not committed. `GET /status` shows players, monsters, storage kind (`"saves":"postgres"`
when the database is connected) and the number of saved accounts.

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

**Accounts** (`server/accounts.js`, client `game/ui/account.js`, only in "This server" mode):
- Guest = progress under the browser's secret account code (every player from before accounts is a guest
  with their old progress). Log in = name + password; the browser then keeps a session token
  (`wildwood-session`) and logs in with it next time. Guests register in Settings → Account; their progress
  moves to the account and the guest record becomes `{movedTo}` (can't be replayed as a second copy).
- Names are unique (case-insensitive): registered names can't be taken or renamed; a guest whose name is
  taken (registered or online) gets a number added. Registered names are loaded at start (`store.users()`).
- Passwords: scrypt in `AUTH` (`node/main.js`), 6-100 chars; 5 wrong tries lock that account for 1 minute.
- `GIFT_LEVELS` in `accounts.js`: restores a level on register/login (`hayru: 9`, a friend who lost progress).
- While logged in, the client does not write its local save (`saveGear`/`saveProgress`), so a guest on
  the same browser can't inherit the account's progress.
- Test: `node tools/accounts-smoke.js` (in-memory store, 15 checks).

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
  until it is visible (take a screenshot) before `#go` enables.
- The hidden browser pane pauses frames but a solo/host server keeps simulating (timers): teleporting next to
  monsters and taking screenshots gets you knocked out before a frame renders. Testing tools have "Go to the
  tunnel" (the button's `data-v` can be `in`, `east`, `hanami` or `x,z`).
- The Shared (room) mode is only testable against the mock in `tools/`-style harnesses; the host tab
  must stay visible (browser timers throttle in background tabs).

## 9. Reference numbers

- Stats: `f(L)=L+(13/12)^L`; HP `20f+armor`; damage `3f+weapon`; defence cut `def/(def+60)`;
  ±5% per level difference; crits 12% ×1.7.
- XP to next `10(L²+(7/6)^L)·K15^((L-5)/10)`; level 10-15 monsters 1.5× HP/XP/coins (`highMult`).
- Monsters: 40 of each level-1 kind down to 20 of each level-15 kind; respawn 35 s; think within 110 m.
- Drops: monsters 2% common, 0.5% rare, 0.1% epic; boss 50/10/3/1/0.1% (common…legendary).
- World: the home forest is -HALF..HALF; the whole world is `WX0..WX1` x `WZ0..WZ1` (the vale is x > HALF, 550 m wide).
  Use those bounds (not ±HALF) for clamps. The heightmap is rectangular (`NVX` x `NVZ`), the terrain is drawn in
  x-strips culled beyond the fog, and plant chunks more than 320 m away are only grown when you come closer.
- Vale progress: `gear.east` 0 sealed, 1 tunnel open (anyone rewarded for a Rootwarden kill), 2 walked into Hanami
  (teleport circles work). Vale monsters: 2 kinds per level, 12 of each; gear tiers 4-5 at levels 20 and 25.
- Rarity stat multipliers 1 / 1.3 / 1.7 / 2.2 / 3; 3 identical → next rarity at Greta's forge.
- Shop: unlimited, +20% of base per copy bought, reset at sunrise (server day wraps).
- Quests: 4 notices, level −4…+2 weighted to yours; hunts 10-20 (L1) → 30-50 (L15), bounties 1.5×.
- Slots: skill at level 3, burst at 10; prices 180/650, bursts 2000/4000, mage basics 250/900.
- Day 20 min; rain 5-7 min every 40-60 min, 30% storms.
- Character proportions (style between realistic and anime): about 7.2 heads tall; hips at 0.92 m, head
  centre 0.72 above the hips, head scale 1.18 (female 1.15), eyes ~15-25% larger than real; short neck.
  Female `chest` 0.5-1.6 (default 1): editor Body tab and a slider in the Settings popover (`#lookSec`,
  `syncLookSettings` in `ui/character-editor.js`); named NPCs set it in `VILLAGERS`, random villagers roll
  0.7-1.35 in `makeLook`. Default looks have no backpack.

## 10. Ideas not done yet (ask the owner before starting)

Special quests from Bram and other NPCs; group/party system; the XP curve past 15 (levels 16-25 need 400-2100 kills
each: tune `expToNext` / `xpFor` in `shared/balance.js`); animals in the vale; trading between players; more zones or a
second boss; server-side anti-cheat for movement; villagers synced between players; mobile UI polish
seen on a real device.
