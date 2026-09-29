# Wildwood

A multiplayer 3D forest RPG in the browser (three.js r128): an 880 m streamed procedural forest with a river and
three lakes, a village with villagers and shops, 16 monster zones with 451 monsters (40 of each level-1 kind down
to 20 of each level-15 kind), three classes, equipment in 5 rarities with a drag-and-drop inventory and a merge forge, quests, a boss, a minimap
and world map (N), a soundtrack of AI-generated songs (one per area and boss), and synthesised sound effects.

**Developing with an AI agent?** Start with [CLAUDE.md](CLAUDE.md) (guide) and [docs/FILES.md](docs/FILES.md) (file map);
headless tests and a model preview are in [tools/](tools/README.md).

## Three ways to play

| Mode | Who hosts the world server | How |
|---|---|---|
| **This server** | a Node process (`dist/wildwood-server.js`) | `node dist/wildwood-server.js`, open `http://localhost:8080`: the start card offers **Log in**, **Register** and **Play as guest** |
| **Solo** | your own browser tab | a page that is not served by the Node server (the claude.ai artifact, a local file) offers **Play solo** |
| **Shared** | one player's tab, elected automatically | open the published page in claude.ai with others, pick **Play in the shared world** |

**Start card (this server).** *Play as guest* goes straight in; your progress is kept under a secret code in this browser.
*Register* asks for an account name and a password (twice), creates the account on the server (a guest's progress moves to it),
and opens the character editor: pick a class and a look, then *Enter the world*. *Log in* takes the name and password; the
browser then remembers the session and the card shows *Continue as <name>*. An account's look and progress follow it to any device.

Every mode runs the **same authoritative server code**; only the transport differs.

**Shared (claude.ai room):** everyone with the page open joins the live room `wildwood-world`. The page that has been
open longest hosts. Clients send requests on topic `c`, the host answers on topic `s` (split into chunks under the
room's 4 KB limit), and player positions travel in presence 10 times a second. If the host closes the tab, another
player takes over within a few seconds and everyone rejoins with their own save (monsters reset). The host's tab
should stay visible: browsers slow down timers in background tabs. Sending on the room needs Contributor access or
above to the artifact; Viewers can still play Solo.

**Node server:** `node dist/wildwood-server.js [--port 8080] [--host 0.0.0.0] [--no-dev]` (or `npm start`). It serves the page and
runs the world over WebSocket, with no npm packages. Open the address in several tabs or on other devices on
your network. `--no-dev` turns the testing tools off. `GET /status` returns player and monster counts.

**Saves:** on the Node server, each player's progress (level, XP, gear, coins, quests, skills, name, look) is
kept on the server under their account code: a secret the browser makes once and keeps (settings > Account shows
it, copies it, and lets you continue on another device). The first time the server sees an account, it takes over
that browser's existing save, so players from before server saves keep their progress. Browsers keep a copy of
each update, so if the server ever loses a record it is rebuilt from the player's copy the next time they join.
The server writes changes every 5 seconds, when a player leaves, and on shutdown (SIGTERM). Opening the same
account twice disconnects the older window. In Solo and Shared (claude.ai) the browser's own save is used.

## Deploy to Render

The repository is ready for [Render](https://render.com) as a Node web service; no npm packages are needed.

1. Push this folder to a GitHub repository (see below).
2. On render.com: **New > Blueprint**, connect GitHub, pick the repository. Render reads `render.yaml` and
   creates the `wildwood` web service. (Or **New > Web Service** by hand: runtime Node, build command
   `(command -v python3 >/dev/null && python3 build.py) || true`, start command `node dist/wildwood-server.js`,
   health check path `/healthz`.)
3. Open the `https://wildwood-xxxx.onrender.com` address Render gives you. The page connects to the world over
   `wss://` on the same address, and "This server" is picked automatically. Share the link to play together.

**Keeping saves on Render.** The service's own disk is wiped on every deploy and restart. Pick one:
- **Postgres** (works on the free web plan): create a database (Render Postgres, or a free one at Neon or
  Supabase), then set `DATABASE_URL` on the service to its connection string. The server creates its table
  (`wildwood_players`) itself. `npm install` (in the build command) installs the `pg` package.
- **A persistent disk** (paid instance): uncomment the `disk` block and `DATA_DIR` in `render.yaml`.
Without either, players still don't lose progress (it's rebuilt from their browser's copy), but a player who
cleared their browser would. `GET /status` shows which storage is in use and how many accounts it holds.

Notes: `dist/` is not committed; Render builds it with `python3 build.py` on every deploy (run the same locally). The server listens on `$PORT`, serves the page gzip-compressed (about
a quarter of its size), and pings connections every 25 s. Testing tools are on (`WILDWOOD_DEV=1` in `render.yaml`);
set it to `0` in the Render dashboard for a public server. The free plan sleeps after about 15 minutes without
visitors and takes up to a minute to wake; the world (monsters, clock) restarts then, but players keep their
progress because saves live in each player's browser.

## Put it on GitHub

    git init -b main              # skip if the folder already has .git
    git add -A && git commit -m "Wildwood"
    git remote add origin https://github.com/yuvalsegevvv/wildwood.git
    git push -u origin main

(Create the empty `wildwood` repository on github.com first, without a README.)

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
    assets/audio/   sound files: music-* are copied to dist/audio/ and fetched when played; small sounds are embedded and played with playSample().

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
(a quest you can take) or a green ? (one to hand in). Maren stands in front of the quest board by the road in. Villagers with a job stay at their posts day and night;
only ordinary villagers go home after dark.

Greta's forge (the third market stall) merges 3 identical items from your bag into 1 of the next rarity,
same level needed. Numbers live in `src/shared/items.js` (`RAR_MULT`, `rollMonsterRarity`, `rollBossRarity`,
`MERGE_COUNT`) and `src/shared/quests.js` (`RARE_QUESTS`).

## Weather

The server runs one weather for the whole world: rain for 5-7 minutes every 40-60 minutes (the first 40-60
minutes after the server starts), and 30% of those are thunderstorms with lightning strikes near players every 6-20
seconds. Clients draw rain streaks around the camera, grey the sky, shorten the view, play a soft rain sound, and
flash for lightning with thunder delayed by distance. Testing tools have Rain / Thunderstorm / Clear sky buttons.
Timing lives in `src/server/weather.js`, visuals in `src/game/world/weather.js`, the rain sound (a quiet low wash,
a slowly swelling patter and scattered droplets; volumes in `RAIN_SND`) in `src/game/audio/rain.js`.

## Music

Every area has its own song, made with Suno (free plan: non-commercial use only) and crossfaded as you move:

| Where | File (`assets/audio/`) |
|---|---|
| Home village (muffled and softer at night) | `music-village.m4a` |
| Home forest, levels 1-15 | `music-wild.m4a` |
| Rootwarden (level 15 boss) | `music-boss15.m4a` |
| Hanami | `music-hanami.m4a` |
| Sakura Vale, levels 16-25 | `music-vale.m4a` |
| Akaoni (level 20 boss) | `music-boss20.m4a` |
| Kyuubi (level 25 boss) | `music-boss25.m4a` |

Songs loop with a 5 s crossfade; the boss songs play their build-up once and then loop their loud part
(`MUSIC_LOOP_FROM`). They are not in the page (9 MB): the build copies them to `dist/audio/` under content-hashed names, the client fetches a track the first
time its theme plays, keeps it (immutable HTTP caching, Cache Storage) so it is downloaded once per client, and decodes it only while it plays.
A theme without a file falls back to the old generative music. How to add or replace a song, and how to encode it:
[assets/audio/README.md](assets/audio/README.md). Code: `src/game/audio/music.js`.

## Chat and names

Press Enter (or the chat button by the log) to talk to everyone in the world; Enter sends, Escape closes. Messages
appear in the log and as a bubble over the speaker's head for 6 seconds; joins, leaves and renames are logged too.
The server cleans messages (160 characters, one every 0.7 s per player). A guest changes their name in settings ("Your name") or with
`/name New Name` in chat (1-16 characters, shown to everyone); a registered account's name is fixed.

## Skills

Three slots per class: basic attack (always open), skill (level 3) and burst (level 10). Only an equipped
ability can be used. The first ability of each slot is free and equipped automatically when the slot opens; the
others are taught by Aldric, the trainer at the well. Only the mage can change its basic attack. Loadouts are kept
per class, and each slot has one cooldown, so swapping doesn't skip it. Open the panel with K, the Skills button in
the inventory, or by tapping an empty slot button. Default keys: F basic, Q skill, R burst (every key can be changed in Settings > Controls; hold Alt to free the mouse for the menus).
The panel has the active slots and the passive slots on top (drop targets) and a tab below for each kind: 1 basic, 2 skill,
3 burst and Passive. Drag a skill you own from the grid onto its slot to use it, drag it out of the slot to take it off (or
tap it and use the Equip / Take off button); tap any skill for its details and its upgrade.

| Class | Basic | Skill (level 3 / 3 / 6) | Burst (level 10 / 12 / 14) |
|---|---|---|---|
| Warrior | Slash | Whirlwind, Shield Bash (2 s stun), Charge (14 m dash) | Earthshatter (7 m, stun), Blade Storm (4 s, 10 hits, you can move), Berserk (10 s: +50% damage, basic 40% faster) |
| Archer | Shoot | Volley, Piercing Shot, Arrow Rain | Hail of Arrows (8 waves, 7 m), Sniper Shot (650%, 45 m), Hunter's Focus (10 s: shoot twice as fast, +35% crits) |
| Mage | Firebolt, Ice Shard (level 4, fast, slows), Arcane Missiles (level 8, 3 homing) | Frost Nova, Chain Lightning, Meteor | Blizzard (10 waves, 8 m, slows), Inferno (7 m ring of fire), Arcane Surge (skill ready again, 10 s: +40% damage, 30% faster casts) |

Prices: skills 180 / 650 coins, bursts 2000 / 4000, mage basics 250 / 900. Because bursts raise damage a lot,
level 10-15 monsters (and the boss) have 1.5x health and give 1.5x XP and coins (`highMult` in
`src/shared/balance.js`); the level curve still uses the old XP, so level 15 -> 16 now takes about 333 kills.
Definitions are `SKILLS` in `src/shared/classes.js`, effects in `src/server/combat.js`, visuals in
`src/game/combat/skill-fx.js`.

### Elements and your soul

Every skill has an element (`el` on its row in `SKILLS`; Slash, Shoot and the three buffs have none = basic), and so does every
monster (`el` in `src/shared/monster-defs.js`). Two rules use them: your soul works on pairs of opposites (**fire / water, earth / air,
dark / light**), and monsters work on the wheel **water beats fire beats air beats earth beats water**, with dark and light beating each other.

| Class | Skills by element |
|---|---|
| Warrior | air: Whirlwind · light: Shield Bash · fire: Charge · earth: Earthshatter · dark: Blade Storm |
| Archer | air: Volley · earth: Piercing Shot · water: Arrow Rain · dark: Hail of Arrows · light: Sniper Shot |
| Mage | fire: Firebolt, Inferno · water: Ice Shard, Frost Nova, Blizzard · dark: Arcane Missiles · air: Chain Lightning · earth: Meteor |

- **Your soul.** From level 15, the shrine maiden Kaede at Hanami's raked garden binds your soul to an element. It is free and
  you can change it as often as you like (a soul is `basic` until you do). Your skills of that element deal **x1.5**, skills of
  its opposite deal **x1/1.5**, everything else is unchanged. The panel is `src/game/economy/soul.js`, the server rule is
  `bindSoulP` (it checks the level and that you stand in Hanami).
- **Monsters (the wheel).** A skill whose element beats the monster's element deals **x1.5** (water on a fire monster, fire on air, air on
  earth, earth on water, dark on light, light on dark). A skill whose element the monster's element beats, or the monster's own element,
  deals **x1/1.5** (fire on a water monster, water on an earth monster...). Anything else is unchanged. Soul and wheel stack. Your own
  damage numbers get an arrow (up: the element helped, down: it hurt), and the target frame shows the monster's element with what it is
  weak to and what it resists.
- Change `ELEM_BOOST` (or the two functions `soulMult` / `foeMult`) in `src/shared/elements.js` to retune all of it.

### Boss skills

Each boss has its own set of skills that it drops (not sold, no upgrades yet): **every kill gives everyone who helped a 10% chance
for each of its skills they do not own yet** (`BOSS_SKILL_CHANCE` in `src/shared/drops.js`). Each set has a skill (slot 2) and a burst
(slot 3) for every class, and needs the boss's level. A drop shows a banner and appears in the Skills panel (tiles say "Boss" until you
own them). They are the least used elements so far: light gets five, fire, earth, air and dark three each, water one, so every class
now has all six elements.

| Boss | Warrior | Archer | Mage |
|---|---|---|---|
| The Rootwarden (level 15) | Bramble Snare (earth, slot 2): pulls everything within 7 m to you and roots it. Lifesap Frenzy (water, 3): 10 s, +20% damage, basic 25% faster, heals you for 20% of your damage, element-less attacks count as water | Spore Arrow (air, 2): the arrow bursts into a slowing, hurting spore cloud. Black Bloom (dark, 3): 4.5 s of thorns that pull enemies into the middle | Thorn Shards (earth, 2): 5 shards in a fan. Heartwood Drain (dark, 3): a 22 m beam, 3 hits, heals you for 35% of the damage |
| Akaoni (level 20) | Oni Cleave (fire, 2): a double swing that sets enemies on fire. Kanabo Slam (earth, 3): leap 12 m, slam, knock back and stun | Ember Shot (fire, 2): an exploding, burning arrow. Inferno Volley (fire, 3): 5 exploding arrows | Oni Gale (air, 2): a wide gust that blows enemies back and slows them. Demon Gate (dark, 3): after 1.6 s a huge hit and a stun over 8 m |
| Kyuubi (level 25) | Foxfire Riposte (light, 2): 3 quick strikes. Dawn Guard (light, 3): 8 s, 40% less damage taken, heals 3% a second, element-less attacks count as light | Radiant Lance (light, 2): a 40 m beam through everything. Fox Spirit Barrage (light, 3): 7 homing spirits | Spirit Chain (light, 2): jumps to 6 more enemies. Tempest (air, 3): a storm that follows you for 6 s |

Each of them is one row of `SKILLS` in `src/shared/classes.js` with `drop:'<boss id>'` and an `fx` entry that says what it does (ring, cone,
beam, chain, proj, zone, dash, buff: the list is in the comment above `resolveFxS` in `src/server/combat.js`); the client draws from the same
entry (`fxVisuals` in `src/game/combat/skill-fx.js`, in the colour of the element). New statuses: burning (a share of the hit again every
second, orange glow on the monster), pulling (negative knockback), and the buffs' `red` / `steal` / `regen` / `el`.

### Upgrading skills and monster drops

Every monster kind drops its own material (Slime Goo, Boar Tusk, ...; `MATS` in `src/shared/drops.js`) with a 35% chance per kill
(sometimes two); a boss always drops 3 of its trophy. They are kept in `gear.mats` (up to 999 each), listed in the inventory, and
used for nothing else. A skill or passive has 5 levels. Each level adds 12% damage (a buff's bonus grows the same way and lasts
0.5 s longer) and shortens the cooldown by 3%. Going up a level costs coins and drops, at Aldric or Master Ryu:

| To level | Coins (skill / burst) | Drops |
|---|---|---|
| 2 / 3 / 4 / 5 | 240 / 780 / 1550 / 2530 (burst: 600 / 1950 / 3880 / 6330) | 4 / 6 / 9 / 14 of a monster kind at level `skill level + 2 x (steps)`; level 5 also 2 boss trophies |

`upgradeNeeds()` in `src/shared/drops.js` works the numbers out (a skill can list its own prices with `up:`); the server action is
`upgradeSkillP`. Higher levels send you deeper: bursts and passives need the Sakura Vale's monsters and bosses.

### Passive skills (level 18)

One loadout of 3 passive slots that every class shares, opened at level 18 with Vitality (free) in the first slot. **Only the first slot
can be used for now: slots 2 and 3 are shown locked ("Unlocks later")** and unlock later (`PASSIVE_OPEN` in `src/shared/classes.js`; a save
that had passives in a locked slot keeps the first one, moved up). The other passives are taught by the trainers (1500-4500 coins) and
upgraded like any skill. This is a first set to be replaced or extended: `PASSIVES` in
`src/shared/classes.js`, one row each, and the server reads them with `passiveSum()`.

| Passive | Level | Effect at level 1 (+ per level) |
|---|---|---|
| Vitality | 18 | +6% maximum health (+2%) |
| Ferocity | 18 | +5% damage (+2%) |
| Precision | 19 | +4% critical hit chance (+1.5%) |
| Iron Will | 20 | 5% less damage taken (+1.5%) |
| Quickhands | 21 | 6% shorter cooldowns (+2%) |
| Scavenger | 22 | +15% chance of monster drops (+5%) |
| Scholar | 23 | +5% XP from kills (+2%) |
| Resonance | 24 | soul element skills deal +5% more damage (+3%) |

## The quest board

Maren's board always shows 4 notices, generated per player by `genQuest` in `src/shared/quests.js`. A notice's
level is drawn from 4 below to 2 above yours, weighted toward your own (at level 5: about half are level 5, a fifth
level 4, a tenth level 6). Kinds: hunt (10-20 kills at level 1, rising evenly to 30-50 at level 15; XP, coins, 50%
item), bounty (1.5x a hunt; more XP and coins, always an item, 25% rare), scout (walk to a zone or lake; XP, coins), and from level 13
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

Every source file with a one-line description: [docs/FILES.md](docs/FILES.md) (made by `python3 build.py --index`).

## Saved data (localStorage, per browser)

`wildwood-account` (account code), `wildwood-look-v1` (character), `wildwood-progress-v1` (level, XP), `wildwood-gear-v1` (items, coins, quests, skills),
`wildwood-audio-v1` (volumes, voice mode), `wildwood-name` (player name), `wildwood-lite` (light graphics mode).
