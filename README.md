# Wildwood

A multiplayer 3D forest RPG in the browser (three.js r128): an 880 m streamed procedural forest with a river and
three lakes, a village with villagers and shops, 16 monster zones with 451 monsters (40 of each level-1 kind down
to 20 of each level-15 kind), three classes, equipment in 5 rarities with a drag-and-drop inventory and a merge forge, quests, a boss, a minimap
and world map (N), and synthesised audio.

## Three ways to play

| Mode | Who hosts the world server | How |
|---|---|---|
| **Solo** | your own browser tab | open the page, pick **Solo** (default) |
| **Shared** | one player's tab, elected automatically | open the published page in claude.ai with others, pick **Shared** |
| **This server** | a Node process (`dist/wildwood-server.js`) | `node dist/wildwood-server.js`, open `http://localhost:8080` |

Every mode runs the **same authoritative server code**; only the transport differs.

**Shared (claude.ai room):** everyone with the page open joins the live room `wildwood-world`. The page that has been
open longest hosts. Clients send requests on topic `c`, the host answers on topic `s` (split into chunks under the
room's 4 KB limit), and player positions travel in presence 10 times a second. If the host closes the tab, another
player takes over within a few seconds and everyone rejoins with their own save (monsters reset). The host's tab
should stay visible: browsers slow down timers in background tabs. Sending on the room needs Contributor access or
above to the artifact; Viewers can still play Solo.

**Node server:** `node dist/wildwood-server.js [--port 8080] [--host 0.0.0.0] [--no-dev]`. It serves the page and
runs the world over WebSocket, with no npm packages. Open the address in several tabs or on other devices on
your network. `--no-dev` turns the testing tools off. `GET /status` returns player and monster counts.

**Saves:** each player's level, XP, gear, coins and quests are stored in their own browser and sent to whichever
server they join. The server sends back an update whenever they change. (There is no anti-cheat: a playtest build.)

## Build

    python3 build.py            # dist/wildwood.html (the page) and dist/wildwood-server.js (the Node server)
    python3 build.py --check    # also syntax-checks everything with node, if installed
    python3 build.py --index    # lists every source file and what it contains

Only Python 3 is needed to build. The page is one self-contained HTML file (the published page can't load
anything from other sites); the Node server embeds the page and serves it.

## Layout

    src/shared/     pure game rules and data, no page and no three.js: terrain, village layout, zones,
                    balance formulas, monster / item / quest / class definitions. Loaded by client AND server.
    src/server/     the authoritative world server: players, monsters, combat, boss, economy, clock, snapshots.
                    Wrapped as createWorldServer(io) with io = {send(pid,msg), broadcast(msg), dev, snapDt}.
    src/node/       Node host: HTTP + a minimal WebSocket server around createWorldServer.
    src/game/       the client: rendering, input, audio, UI, views of server state, and net/ (transports + protocol).
    src/styles/     CSS, in cascade order.
    src/index.html  page shell with all HUD / panel markup and the slots the build fills.
    src/manifest.json   load order for every group; "@shared" marks where the shared files go in the client.
    assets/audio/   sound files; embedded by the build, played with playSample().

Files in a group are concatenated in manifest order into one function, so they share one scope. The client is
`wildwoodMain()` = client files + shared files; the server is `createWorldServer(io)` = shared files + server
files. The two scopes never see each other; they only exchange JSON messages.

## Who owns what

| Server (authoritative) | Client |
|---|---|
| monster AI, positions, health, respawns | monster models and animation (smoothed toward snapshots) |
| the boss fight, telegraphs, totems, adds | telegraph / spike / shock-wave / shield visuals |
| attack resolution, projectiles, damage, crits, level debuff | swing animations, projectile visuals, damage numbers |
| player health, regeneration, knock-out, respawn | your movement (sent 10x per second), hurt / level-up effects |
| XP, levels, coins, loot, inventory, equipment | inventory / shop / quest panels (they send requests) |
| quests (accept, progress, travel checks, rewards) | quest log |
| the day / night clock (and the skip button) | sky, light, music, ambience |
| testing tools (dev commands) | settings panel |
| | trees, grass, animals, villagers (identical per player, not shared) |

## Protocol

Client to server: `hello{name,look,save}`, `pos{p:[x,y,z,face,vx,vz]}`, `atk{k,tg,face,aim}`, `equip{id}`,
`unequip{slot}`, `cls{cls}`, `buy{id}`, `sell{id}`, `accept{id}`, `turnin{id}`, `look{look}`, `dev{cmd,v}`.

Server to client: `welcome{pid,day,dev,players}`, `mons{list}` (monster roster), `you{...}` (your private state),
`tp{x,z,face}`, and `snap{day,pl,mo,b,ev}` 8 to 20 times a second. `ev` carries events such as `dmg`, `kill`, `proj`,
`pend`, `tele`, `tend`, `xp`, `coins`, `loot`, `lvup`, `hurt`, `down`, `up`, `toast`, `pact`, `pjoin`, `pleave`, `pgear`.
See `src/server/api.js` and `src/game/net/client.js`.

## Items, rarity and the forge

Every piece (sword, bow, wand, helmet, top, bottom, shoes) comes in 4 level tiers (level 1, 5, 10, 15) and
5 rarities: Common, Rare (x1.3 stats), Epic (x1.7), Unique (x2.2), Legendary (x3). Ids: `sword2` is common,
`sword2-r` / `-e` / `-u` / `-l` the rarer versions. Shops sell only common items.

Drops (rarity first, then one of the 7 pieces with equal chance, at the monster's level tier):
monsters 2% common, 0.5% rare, 0.1% epic; the boss 50% common, 10% rare, 3% epic, 1% unique, 0.1% legendary.
Quests come from Maren's quest board, generated endlessly (see below); their item rewards are of the quest's level.
Epic and better drops play a light beam, a banner and a jingle (other players nearby see the beam).

Shops have unlimited stock; each one of an item you buy adds 20% of its base price for you (`SHOP_STEP`),
and the counts reset at sunrise (the server clock passing dawn).

The special villagers (`title` in `VILLAGERS`) wear a name and profession label; quest givers also show a gold !
(a quest you can take) or a green ? (one to hand in). Maren stands in front of the quest board by the road in.

Greta's forge (the third market stall) merges 3 identical items from your bag into 1 of the next rarity,
same level needed. Numbers live in `src/shared/items.js` (`RAR_MULT`, `rollMonsterRarity`, `rollBossRarity`,
`MERGE_COUNT`) and `src/shared/quests.js` (`RARE_QUESTS`).

## Skills

Three slots per class: 1 the basic attack (always there), 2 a skill (opens at level 3), 3 a burst skill (opens at
level 10; not implemented yet, the button says "coming soon"). Only an equipped skill can be used. Each class has 3
skills; the first is free and equipped automatically at level 3, the other two are taught by Aldric, the trainer
at the well (level 3 / 180 coins and level 6 / 650 coins). Loadouts are kept per class; the skill slot has one
cooldown, so swapping skills doesn't skip it. Open the panel with K, the Skills button in the inventory, or by
tapping the empty skill button.

| Class | Free | Level 3 | Level 6 |
|---|---|---|---|
| Warrior | Whirlwind: spin, hit all around | Shield Bash: heavy frontal hit, 2 s stun | Charge: dash 14 m to the target, hit and knock back where you land |
| Archer | Volley: 3 homing arrows | Piercing Shot: an arrow through every enemy in a line | Arrow Rain: 5 waves on an area over 2.5 s |
| Mage | Frost Nova: blast and slow all around | Chain Lightning: target + 4 jumps, 15% weaker each | Meteor: lands on an area after 1.2 s, big hit and knockback |

Definitions (cooldown, damage multiplier, price, level, timing) are `SKILLS` in `src/shared/classes.js`; the effects
are in `resolveHitS` / `updateAreasS` (`src/server/combat.js`) and the visuals in `src/game/combat/skill-fx.js`.

## The quest board

Maren's board always shows 4 notices, generated per player by `genQuest` in `src/shared/quests.js`. A notice's
level is drawn from 4 below to 2 above yours, weighted toward your own (at level 5: about half are level 5, a fifth
level 4, a tenth level 6). Kinds: hunt (5-8 kills, 3-4 treants; XP, coins, 50% item), bounty (12-15 kills, 6-8
treants; more XP and coins, always an item, 25% rare), scout (walk to a zone or lake; XP, coins), and from level 13
the Rootwarden (a rare item, 20% epic). Notices refresh when you level up and at sunrise; an accepted one is replaced
at once, and the board avoids repeating a monster or place. You carry up to 5 quests and can abandon them.
Quests are stored in the player's save; the server re-checks them and recomputes rewards (`questRewardFor`).

## Tuning the world

- Map size: `SIZE` in `src/shared/terrain.js` (zone rings `RINGS` in `src/shared/zones.js` should grow with it).
- Lakes: `LAKES` in `src/shared/terrain.js` (also labelled on the world map).
- Monsters per kind: `MON_COUNT` in `src/server/monsters.js`; pack size is the family's `per` + 2.
- Ground detail: client `SEG` in `src/game/world/heightmap.js`, server `SEG` in `src/server/world.js`.

## Adding features

- Rules or data both sides need (a new monster, item, quest, formula): `src/shared/`.
- Anything that changes game state (damage, rewards, spawning): `src/server/`, and emit an event with `ev(...)`.
- How it looks or sounds: `src/game/`, and handle the event in `net/client.js` (`applyEvent`).

## File index

```
styles
  01-base.css                        Colour tokens, light/dark theme, page, canvas
  02-hud.css                         Top bar: brand box, icon buttons, hint pill
  03-touch-controls.css              Joystick and round touch buttons
  04-start-screen.css                Start card, controls legend, loading bar
  05-chips.css                       Shared chip buttons and start-card pickers
  06-character-editor.css            Character editor side panel / bottom sheet
  07-talk.css                        Talk button, speech bubble, "press E" prompt
  08-settings.css                    Settings (sound) popover
  09-combat-hud.css                  Target frame, damage numbers, enemy health bars, action bar
  10-player-status.css               Player health / XP bars, hurt flash, level-up banner, knocked-out screen
  11-quests-toasts-boss.css          Coins, testing tools, quest log, toasts, boss bar
  12-panels.css                      Inventory / shop / quest panels
  13-motion.css                      Reduced-motion overrides
  14-multiplayer.css                 Multiplayer: world picker, name field, player name tags, online count
  15-inventory.css                   Inventory: body slots, bag grid, item tiles and icons, drag and drop, item details
  16-map.css                         Minimap and world map
  17-forge.css                       Rarity colours (tiles, rows, toasts), the forge panel, the lucky-drop banner
  18-skills.css                      Skills panel, the burst button, the skill slot's states

shared
  math.js                            Shared math: TAU, DEG, AR (random range), APick, angDiff, angLerp. Pure: runs in the browser and on the server.
  noise.js                           Seeded RNG (rand, R, pick), simplex noise2, fbm, clamp, lerp, smoothstep, h3 hash. Pure.
  terrain.js                         Map size (SIZE, HALF, WATER), river (riverX), baseHeight, forestDensity, autumnAmt. Pure.
  village-layout.js                  Village placement and layout (VIL): houses, stalls, anchors, paths, colliders. Pure.
  zones.js                           Monster zones (ZONES, zoneAt, zonePoint), dividing ridges (zoneRidge), boss arena (ARENA). Pure.
  village-helpers.js                 vDist, nearPath, pathAmt, plazaAmt, inBox, pushOutBoxes. Pure.
  terrain-height.js                  rawHeight: base terrain + zone ridges + village and arena flattening. Pure.
  balance.js                         Level formulas: fLv, gear tiers, expected gear, XP curve, coins. Pure.
  monster-defs.js                    Monster families (FAM), the 15 monsters (MON_DEFS), prepDef, boss / totem / thornling defs. Pure.
  classes.js                         Classes (CLASSES), basic attacks (ACTS), equippable skills (SKILLS, abilityOf). Pure.
  items.js                           Items (ITEM, ITEM_LIST): 7 pieces x 4 level tiers x 5 rarities, prices, drop tables, merging, armour looks, gear helpers. Pure.
  quests.js                          Quest board: endless random quests (hunt, bounty, scout, boss) scaled to your level, and their rewards. Pure.

server
  state.js                           Server state (S), the per-tick event queue (ev), messaging helpers
  world.js                           Server heightmap (coarser than the client's): SEG, HS, getH, grad
  players.js                         Players on the server: records, stats, XP and levels, damage taken, knock-out and respawn, private state ("you")
  monsters.js                        Monsters on the server: camps in their zones, AI (aggro, chase, attack, leash), respawns, temporary monsters
  combat.js                          Combat on the server: attacks, projectiles, damage (level debuff, crits), kills, shared rewards, loot
  boss.js                            The Rootwarden on the server: engagement, cleave / root / slam telegraphs, shield + totems, enrage + adds, reset
  economy.js                         Economy on the server: equip, shops (buy / sell), loot, quests (accept, progress, hand in), testing commands
  api.js                             Server API: join, leave, receive (message routing), setPos, tick (simulation, private updates, snapshots)

node
  main.js                            Node host: serves the game page over HTTP and runs the world server over WebSocket (no npm packages needed)

game
  core/setup.js                      Page helpers ($), device flags (isTouch, LOW, LITE, Q), TAU/DEG
  @shared                            (the shared files above are inserted here)
  world/heightmap.js                 Client heightmap: SEG (by device), HS, getH, grad. The server keeps its own coarser copy.
  world/terrain-color.js             Terrain colours (COL, terrainColor)
  ui/controls-legend.js              Fills the controls list on the start card
  engine/renderer.js                 WebGL renderer, scene, camera, lights, sun shadow, timeU
  engine/sky.js                      Sky dome shader (gradient, sun/moon, stars, clouds)
  engine/materials.js                Plant materials with wind sway (plantMat) and shared materials
  world/plant-models.js              Geometry helpers (paint, merge, mkGeo, cyl, blob) and plant models (trees, grass, ferns...)
  world/instancing.js                Chunked instanced meshes, distance culling, tree collision grid (addCol, nearCols)
  player/state.js                    Player state P and spawn point
  world/generation-setup.js          Palettes, shared geometries (buildGeometries), terrain + water + village build (genTerrain)
  world/generation-chunks.js         Per-chunk vegetation placement (genChunk)
  world/streaming.js                 Streaming scheduler (Stream, streamPump): terrain first, nearest chunks next
  character/model.js                 Look presets, save/load, buildCharacter (all outfits and armour looks), hiker, rebuildHiker
  character/pose.js                  poseRig (walk, run, sit, talk, attacks) and animateHiker
  world/motes.js                     Floating pollen by day, fireflies by night
  wildlife/animals.js                Deer, foxes, rabbits, ducks, birds/bats, butterflies
  world/time-of-day.js               20-minute day/night cycle, sky keyframes, clock, zone label
  player/input.js                    Keyboard, mouse look, touch joystick, HUD buttons
  ui/character-editor.js             Character editor panel and camera
  village/buildings.js               Houses, stalls, well, campfire, lamps, garden, arena stones, chimney smoke
  village/villagers.js               VILLAGERS (hard-coded NPCs), random villagers, NPC behaviour (updateNPCs)
  village/talking.js                 Talking to villagers: bubble, prompt, E key, opening shop/quest panels
  village/npc-labels.js              Name and profession labels above the special villagers, with ! / ? quest markers over quest givers
  audio/engine.js                    Web Audio setup (SND, buses, reverb, echo, noise), tone(), noiseHit(), spatial()
  audio/samples.js                   Sound files from assets/audio (embedded by build.py as window.WILDWOOD_AUDIO): loadSamples, playSample
  audio/ui-sounds.js                 Interface / game sounds (UI_SFX) and hover/click hooks
  audio/music.js                     Generative background music
  audio/ambience.js                  Footsteps, birds, crickets, owls, frogs, ducks, crackle, hooves
  audio/voices.js                    Villager voices: text-to-speech voice picking and babble
  audio/driver.js                    Per-frame sound driver (soundTick): beds, random events, NPC steps
  ui/settings-sound.js               Sound part of the settings popover
  combat/monsters.js                 Monster families and 15 monsters (MON_DEFS), models, camps, AI, animation
  player/progression.js              Your health, level and XP as told by the server, the save kept in this browser, hurt / level-up / knocked-out effects
  combat/classes.js                  Classes and their abilities (CLASSES), combat state (CB), effect materials
  combat/weapons.js                  Weapon models in the hiker's hands (attachWeapons), aim helpers
  combat/attacks.js                  Targeting and attacks (sent to the server), plus the visuals for server combat events: damage, kills, projectiles
  combat/lucky.js                    Lucky drops and forging: light beam, sparkles, banner and a bright jingle for epic, unique and legendary items
  combat/sounds.js                   Combat sounds (cSfx) and monster voices (monSound)
  ui/combat-hud.js                   Target frame, player bars, damage numbers, action bar, attack input
  economy/items.js                   Your gear as told by the server (GEAR), saved in this browser; equip / unequip requests
  ui/toasts.js                       Toast messages
  ui/item-icons.js                   Item icons: an SVG for every piece of equipment, coloured like the item looks on your character
  ui/panels.js                       Panel open/close helpers (openPanel, closePanels, uiOpen)
  economy/inventory.js               Inventory panel: equipment worn on a body outline, the bag as a grid of icons, drag and drop between them
  economy/shops.js                   Weapon and armour shops
  economy/forge.js                   Greta's forge: merge three identical items into one of the next rarity (common > rare > epic > unique > legendary)
  economy/skills.js                  Skills panel: each class's loadout (basic attack, skill, burst) and Aldric's lessons (learn, equip, take off)
  economy/quests.js                  The quest board panel (Maren) and the quest log: notices, quests in progress, hand-ins (all generated by the server)
  ui/settings-testing.js             Testing tools in the settings popover (sent to the server as dev commands): set level, all items, coins, reset
  economy/init.js                    Inventory key and first-time gear setup
  combat/boss.js                     The Rootwarden, client side: telegraph visuals, root spikes, slam waves, shield bubble, roars, boss bar
  combat/skill-fx.js                 Visuals and sounds for the equippable skills: Arrow Rain, Meteor, Chain Lightning, Piercing Shot, Shield Bash, Charge
  player/movement.js                 Player movement, collisions, camera
  ui/map.js                          World map: a map image painted from the terrain, the corner minimap, and the full map (N) with zones, quests and players
  net/transport.js                   Connections to the world server: solo (server in this tab), shared room (one player's tab hosts), WebSocket (node server)
  net/client.js                      Client side of the protocol: hello, welcome, snapshots, events -> views, effects and UI; position updates
  net/remote.js                      Other players: avatars built from their look and gear, smoothed movement, attack animations, name tags
  main/loop.js                       Main loop (frame), loading progress, start button, boot
```

## Saved data (localStorage, per browser)

`wildwood-look-v1` (character), `wildwood-progress-v1` (level, XP), `wildwood-gear-v1` (items, coins, quests),
`wildwood-audio-v1` (volumes, voice mode), `wildwood-name` (player name), `wildwood-lite` (light graphics mode).
