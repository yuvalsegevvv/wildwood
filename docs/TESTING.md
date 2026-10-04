# Testing and tools

Moved word for word from `CLAUDE.md` sections 6 and 8; `CLAUDE.md` keeps the short command list and the "smallest test" rule.

## Commands (with what each test checks)

```
npm install                      # three@0.128 for the tools, pg for Postgres (optional)
python3 build.py                 # → dist/ (quiet, ~1 s)
python3 build.py --check         # + syntax check of every bundle + duplicate-name check + layout rules (a header on every file, every source file in the manifest, docs/FILES.md up to date)  (always run this)
python3 build.py --write-index   # rewrite docs/FILES.md from the files' //@ headers (after adding, renaming or re-describing a file)
node tools/server-smoke.js       # 16 headless server checks from src/ (no build), ~5 s, prints PASS/FAIL
node tools/accounts-smoke.js     # 17 checks of accounts (register, login, tokens, unique names, the account's look), ~1 s
node tools/mainquest-smoke.js    # 91 checks of the main quest (talks, herbs, kills, grey monsters, night, lore, old saves and the step migration, the profession steps W6a / W7b / W11b / V7b, and acts II-III to the end: Rimehold, the Lodge, tools, gathering, brewing, the circles, the Rimeking), ~15 s
node tools/boss-smoke.js         # 36 checks of the six bosses' move sets (each fought through three phases; every boss must do its own moves, have moves no other has, and leave nothing behind), server from src/, ~2 s
node tools/hoarfrost-smoke.js    # 37 checks of the Hoarfrost Reach: its shape, zones and monsters, bosses, the ice wall and how it opens, quest board and XP for levels 22-30, mining there with a tool of the right tier (server from src/), ~5 s
node tools/dungeons-smoke.js     # 81 checks of the dungeon setup (shared/dungeons.js and dungeon-rewards.js, no server, ~2 s): the three dungeons (their monsters and zones exist, walkers fit the doors, their level by tier, Wildwood's lock at +0), their three bosses (built from the game's models and primitives, moves declared, each used once), the hourly offer (two types, fair, never the same pair twice running), every map tile in every turn, the boss hall against the arenas' radius, the seeded layouts of the seven missions (connected, doors paired, roles filled, one boss hall each, same seed = same dungeon), the baked grid, walking round walls by the flow field, the party-size table, the three entrances (zone, ground, clearances from water, camps, nodes, villages, a dry walk from the signpost), the rewards (the odds, the pools, the 490 ids and the enhancement caps, the ring's soul rule, the stone's drop rule); `--show <mission> <seed>` draws a dungeon
node tools/party-smoke.js        # 22 checks of parties (invite, /invite, cap, roster and its refresh, lead, kick, leave, disconnect, decline, expiry), server from src/, ~1 s
node tools/dungeon-runs-smoke.js # 81 checks of dungeon runs (slots, isolation, walls, party health, loot for all, down / revive, a Purge won through its boss, a door start), server from src/, ~7 s
node tools/dungeon-missions-smoke.js # 112 checks of the seven mission kits (each won through its boss on two dungeons and lost by its own condition, HUD text, party health, chests, the hazards), server from src/, ~15 s
node tools/entrance-map.js       # draws docs/dungeon-entrances.png (the three doors on the real terrain, zone borders, roads, signposts and routes; pure node, regenerates byte-identically; run it again if an entrance moves)
node tools/dungeon-board-client-smoke.js  # 37 checks of the Delve board panel and the dgi join prompt on the built page (solo, ~25 s): fake dgboard messages (open, sealed, member, soon), the clock, Start, Esc, the real server at the Elder and the Falls Door; runs dist/: build first
node tools/tiers-smoke.js        # 41 checks of the zone tiers (I to V): the rules, saves, choosing a tier in a village, the unlock by a land's second boss, and per-player damage dealt / taken / XP / coins / drops while two players at different tiers share a monster (server from src/), ~2 s
node tools/levels-smoke.js       # 11 checks of the levels: the curve, the soft cap from level 50, saves, the testing tool, and the 10-levels-above XP cap (the same cap inside a run is in dungeon-runs-smoke)
node tools/professions-smoke.js  # 73 checks of the professions: tools and their slots, the nodes of every land and their tiers, gathering and its cast, selling, crafting, brewing and drinking potions (server from src/), ~8 s
node tools/skills-smoke.js       # 58 checks of elements, the soul shrine, monster drops, skill upgrades, passives and the 30 boss skills (server from src/), ~15 s
node tools/dungeon-client-smoke.js  # 44 checks of a dungeon run's client on the built page (solo, ~15 s): props, the run at its slot, the forest off and back, walls, camera, HUD, objectives, party, results, maps, disposal
node tools/client-smoke.js       # 48 checks (the last 9: a dungeon run) running the built page headless (solo), ~60 s (also draws every boss skill, and checks the Hoarfrost's client side: ice wall, music, the Lodge and travel windows, resource nodes and their cast bar, snow, the tool slots, the Craft tab, the Brewing panel and the potion belt). It runs dist/: build first
node tools/start-smoke.js        # 31 checks of the start card + a new account's character editor, against a real server in-process, ~20 s
node tools/keys-smoke.js         # checks of the rebindable keys (defaults, swap, save/load, hints) and of hold-Alt; runs dist/: build first
python3 tools/unused.py          # dead-code candidates (names nothing uses, CSS nobody mentions)
npm test                         # build --check + all of the above
node tools/model-preview.js out.png [--head] [--looks '[{...}]']   # character model → PNG (numpy+pillow)
node tools/monster-preview.js out.png --ids slime,boss [--bosses|--all] [--pose|--act|--head|--stats]   # monster and boss models → PNG (numpy+pillow), or triangle / mesh counts
node dist/wildwood-server.js --port 8080     # real server; open http://localhost:8080 in several tabs
```

The model preview shades per pixel from the mesh normals (like the game), so seams and facets show in it.
For a close-up of another body part, render once, then re-run the rasterizer on the JSON it leaves in the
OS temp dir: `python3 tools/rast.py <tmp>/model-preview.json out.png 260 300 1.3` (last number = centre
height in metres: 1.3 torso, 1.7 head). On Windows `python3` needs `pip install numpy pillow` first.

Pick the smallest test that covers your change: model/face/hats → `model-preview` only; a monster or boss model → `monster-preview` (then `client-smoke`); server rules →
`server-smoke` / `skills-smoke` (or a few lines with `tools/load.js`: `loadServer(io, ['MONS','genQuest'])` gives you the
server API plus any internal names); client UI → `build --check` + `client-smoke`; the start card, accounts or the character editor →
`start-smoke`. The headless client (`tools/headless.js`) stubs the DOM: elements are cached per selector and remember their
listeners and children (`c.el('#stGuest').click()`, `el._kids`, `el._a`), but there is no layout, so read state from game variables
(`expose` names) rather than DOM text where you can. To check that a test can fail, break the code it covers, run it, restore
(this is how `start-smoke` was validated).

## Pitfalls: tests, the browser pane, Windows / OneDrive

- `pkill -f "<text>"` also kills the shell running it if the text is in the command line: kill by PID.
- `npm install` inside the OneDrive folder may fail to install the optional `pg` and strip it from
  `package-lock.json`: restore the lockfile (`git checkout package-lock.json`); for a local Postgres test
  install `pg` in a temp folder and run the server with `NODE_PATH` pointing there.
- The built-in browser pane throttles timers when hidden: the start screen can sit on "Shaping the hills…"
  until it is visible (take a screenshot every few seconds) before the buttons enable. Frames only run around screenshots, so read
  per-frame numbers (draw calls, fps) between two screenshots, not after a `setTimeout`.
- The hidden browser pane pauses frames but a solo/host server keeps simulating (timers): teleporting next to
  monsters and taking screenshots gets you knocked out before a frame renders. Testing tools have "Go to the
  tunnel" (the button's `data-v` can be `in`, `east`, `hanami` or `x,z` with **integers**: `-4.4,8.8` silently goes to the west portal).
- `tools/client-smoke.js` used to count `requestAnimationFrame` calls: the world takes a few thousand frames to stream in, and a stopped
  loop stops `netTick`, so the server never learns the player moved and every attack misses. `headless.js` runs frames until `stop()`.
- `tools/server-smoke.js` "forge merges 3" fails now and then (about 1 run in 15, also on older commits): it depends on a random item from the testing tool. Not a regression.
- `tools/skills-smoke.js` "all boss skills cast and do what their fx says" fails now and then on `pyre` ("no hits": the Inferno Volley's five homing embers have random spread and can all miss): 3 failures in 25 runs on the code before the dungeons, about 1 in 8 now. Rerun it. Not a regression.
- Server tests read events from the snapshots: an `ev(...)` reaches a test's log only with the next snapshot (about 2 ticks), so tick 3 times before checking `evs`.
  `client-smoke` / `start-smoke` run the *built* page: a stale `dist/` gives false failures, run `python3 build.py` first.
- Windows: `shutil.rmtree` on `dist/audio` fails under OneDrive (build.py deletes the files, not the folder); a `cd dist` in one shell
  call stays for the next (use absolute paths); backslashes inside a bash heredoc get lost (write the script to a file instead);
  `git worktree remove` may leave `.git/worktrees/<name>` behind (delete it by hand).
- Replacing text with `str.replace(old,new,1)` after inserting a helper that contains `old` replaces the helper's copy: this made
  `addVillageMeshes` call itself. Run `client-smoke` after moving code.
- The hidden browser pane runs a frame only around a screenshot: a key press (E to talk) or a teleport shows its effect one screenshot later, so take
  a screenshot before and after. The Testing tools' Hoarfrost buttons (`tPass`, `tRime`, `tHall`, `tNest`) plus `data-v="x,z,degrees"` on `tPass`
  (set it from the console, then click) put you anywhere facing any way.
- Looking at the world in the built-in browser pane (a way that worked): serve `dist/` with a static server (solo mode runs the world in the tab: no Node
  server to restart), patch a debug hook into `dist/wildwood.html` after each build (`window.__dbg={P,camera,scene,renderer,getH,...}` inserted before
  `buildGeometries();` at the end of `wildwoodMain`, and a `renderer.render` wrapper that puts the camera at `window.__cam=[x,y,z,tx,ty,tz]`: a photo mode
  that leaves the player where the server keeps them), click `#stSolo` when the status line says Ready (a click while it loads does nothing), set the level to
  50 with `#tLevel` + `#tSetLv` (monsters near a level-1 hiker knock them out mid-shot) and move with `#tPass` (`data-v="x,z,degrees"`; the server
  sends a hiker back who jumps more than a few metres by other means). `renderer.info.render` gives draw calls and triangles.
