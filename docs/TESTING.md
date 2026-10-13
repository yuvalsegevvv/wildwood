# Testing and tools

The tests are listed in ONE place, the registry `tools/tests.json` (a row per test: what it proves, what it needs, about how long, which source paths it covers).
`tools/run-tests.js` reads it. A test's own detail (every check it makes) is the comment at the top of its file in `tools/`; the one-line summaries are `node tools/run-tests.js --list`.
`python3 build.py --check` fails for a `tools/*-smoke.js` that is not in the registry, so a test cannot exist without being run.

## Running tests

```
node tools/run-tests.js                 # the tests that cover what you changed (git diff against HEAD + new files), in parallel; says so when nothing covers it
node tools/run-tests.js --list          # every test with its time, what it needs (src = straight from src/, dist = the built page, playwright = Chromium) and what it proves
node tools/run-tests.js --fast          # everything except the [slow] ones
node tools/run-tests.js --all           # everything: `npm test` is `python3 build.py --check && node tools/run-tests.js --all`  (about 4 minutes on 4 cores)
node tools/run-tests.js client-smoke    # by name (several allowed)      --group server|client       --for src/shared/terrain.js    # as if that file had changed
node tools/run-tests.js -v tiers-smoke  # print the whole log of what ran     -j 2  fewer parallel jobs (default: cores - 1, at most 4)
```

Output is one line per test (`PASS name  N checks  secs`, or `FAIL` with its FAIL lines and the tail of its log; the full log stays in `<tmp>/wildwood-tests/<id>.log`) and a summary. The runner builds `dist/` first when a selected test needs the page, so a stale build cannot give a false failure. A row's `flaky` list names FAIL lines that are known to be random: such a test is run once more and reported as flaky if it then passes (none is listed now: the last two, in `skills-smoke` and `server-smoke`, were test bugs and are fixed).

Adding a test: write `tools/<name>-smoke.js` (print `PASS ...` / `FAIL ...`, exit 1 on a failure), add its row to `tools/tests.json` (`covers` = regular expressions on the paths whose change should run it). Other single-purpose commands:

```
python3 build.py --check       # syntax of every bundle, duplicate top-level names, the layout rules, the registry
npm run lint                   # tools/lint-bundles.js: ESLint over each bundle as it runs (ONE scope: client = shared + game, server = shared + server)
npm run fuzz [-- --nodev --seed N --rounds N]   # tools/server-fuzz.js
npm run bench [-- --players 40 --secs 60]       # tools/server-bench.js
python3 tools/unused.py        # dead-code candidates
node tools/gen-docs.js [--check]   # docs/MOBS.md and docs/EQUIPMENT.md from the code
node tools/model-preview.js out.png [--head] [--bent] [--setups] [--outfit id] [--weapon warrior|archer|mage] [--views front|three] [--looks '[{...}]']   # character model or signature outfit → PNG (numpy+pillow)
node tools/monster-preview.js out.png --ids slime,boss [--bosses|--all] [--pose|--act|--head|--stats]   # monster and boss models → PNG (numpy+pillow), or triangle / mesh counts
node tools/city-preview.js out/ --views overview,street   # Glasswell's 3D model → PNGs (playwright + Chromium)
node dist/wildwood-server.js --port 8080     # real server; open http://localhost:8080 in several tabs
```

## Static check: `lint-bundles`

Every file of a group is concatenated into ONE function scope (client: `wildwoodMain`, server: `createWorldServer`), so a misspelled or never-defined top-level name is legal JavaScript that only throws when the line runs. `npm run lint` runs ESLint over the two bundles as they are assembled (same order as `build.py`) and reports the source file and line: undefined names, impossible code (unreachable statements, duplicate keys, assignment to a const...). `--unused` adds names that are declared and never read (shared files appear in both bundles: a name unused in only one of them is not dead). It needs ESLint (`npm i --no-save eslint`, or a global install) and skips itself without it. A browser global the list in the tool lacks is added there, not worked around in the game. The tree was clean when it was added (the one hit, `createWorldServer`, is a real global: the server bundle's own `<script>` block).

## Fuzzing: `server-fuzz`

Sends thousands of garbage messages of every type (JSON-shaped nulls, huge and negative numbers, `1e999`, strings like `constructor` and `__proto__`, deep objects, arrays) mixed with real ids (items, skills, nodes, monsters, lands) to a few players while the world ticks, then joins players with randomly corrupted saves. It fails on a throw in a handler or in `tick()` (the Node host swallows the first and, before the guard in `node/main.js`, crashed on the second), a non-finite number in a player or monster, a negative or fractional coin count, a non-string item, a broken serialization or a polluted `Object.prototype`, and names the message that broke the coins. It found `buy {id:'constructor'}` charging `NaN` coins. Run it with `--nodev` for the deployed server's setting (the dev commands refuse there) and with a few `--seed`s after touching a handler or `sanitizeGear`.

## Fuzzing parties and dungeon runs: `dungeon-fuzz`

The scripted dungeon tests walk the happy paths; `tools/dungeon-fuzz.js` walks the transitions between them. Five level-30 players take random but valid actions (party invite / accept / decline / leave / kick / lead, a run started with the testing tool in every built theme and mission, leaving, reviving, walking, attacking, dying inside a run, disconnecting and coming back) while the world ticks, and every 100 steps the registries are checked against each other (a run and its slot, a party and its members' `p.party`, a run's members and their `p.inst`, finite numbers). Then everyone leaves, 10 simulated minutes pass, and nothing may remain: no run, party, run monster or held slot. `--steps N --seed N --players N --verbose` (the failing message is printed). Mutation-checked: leaking a slot or leaving `p.party` set after a party ends fails it. Note that `updatePartiesS` sweeps vanished members once a second on its own, so removing only the disconnect hook is not a bug it can see.

## Chaos at the bosses: `boss-fuzz`

`tools/boss-fuzz.js` fights each of the eight world bosses with four level-60 players who, at random, die in one hit, run out of the arena, step back in, disconnect and rejoin; then everyone leaves, eight seconds pass, and the boss must have reset completely (not engaged, full health, phase 1, no zones, telegraphs, walls, orbs, adds or totems; a boss that was killed must respawn). `--seed N --rounds N --steps N`. Mutation-checked: skipping `clearBossFxS` in `resetBossS` fails it. `boss-smoke` is the clean version of the same fights.

## Measuring and profiling the server

`tools/server-bench.js` puts N players on random camps, walks them and has them attack, ticks the real server at 20 Hz without a clock and prints the milliseconds per tick (all ticks, and the snapshot ticks alone, which also serialize) and the bytes a snapshot weighs. The numbers depend on the machine; compare before and after on the same one. For a profile:

```
node --cpu-prof --cpu-prof-dir=out tools/server-bench.js --players 40 --secs 30     # then read out/*.cpuprofile: self time per function, inclusive time per function
node --no-turbo-inlining --cpu-prof ...       # attributes time to the real callees instead of the function they were inlined into
```

A `.cpuprofile` is JSON (`nodes` with `callFrame` and `children`, `samples`, `timeDeltas`): a 20-line script sums self and inclusive microseconds per function name (the line numbers are those of the concatenated server code plus 2). How the numbers moved: a tick of 40 fighting players cost 15.1 ms on average before the monster AI stopped asking `inVillage` of every player for every monster (28% of the tick; `nearestFighter`, `anyPlayerNear`, `vNear`) and 3.9-5.6 ms after (`updateMonstersS` 6.3 s -> 0.8 s per 30 s of play); the headless client's world is ready in 17 s instead of 21 s since the three border functions keep their last answer. Heap after 30 simulated minutes and 1,473 joins stayed at 9.5 MB (no leak).

The model preview shades per pixel from the mesh normals (like the game), so seams and facets show in it.
For a close-up of another body part, render once, then re-run the rasterizer on the JSON it leaves in the
OS temp dir (the path model-preview prints): `python3 tools/rast.py <that json> out.png 260 300 1.3` (last number = centre
height in metres: 1.3 torso, 1.7 head). On Windows `python3` needs `pip install numpy pillow` first.

Pick the smallest test that covers your change: character model/face/hair/sliders → `model-preview` + `character-smoke` (then `start-smoke` if the editor changed); a signature outfit → `model-preview --outfit id` + `outfit-smoke --only id`; a monster or boss model → `monster-preview` (then `client-smoke`); server rules →
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
  bridge" (the button's `data-v` can be `in`, `east`, `hanami` or `x,z` with **integers**: `-4.4,8.8` silently goes to the west gate; the dev command is still called `tunnel`).
- Seeing a coast or a far corner in a real browser: teleport with the dev tools first (`vale 2`, `north 2`, `west 2` open the clamps) and give the streaming 20-30 s (`Growing distant areas` counts down); at a low level monsters knock you out first, so set a high level. A shaded relief of `rawHeight` (a few lines with `loadShared(['rawHeight'])`, written to a PPM) shows a whole coast in a second.
- `tools/client-smoke.js` used to count `requestAnimationFrame` calls: the world takes a few thousand frames to stream in, and a stopped
  loop stops `netTick`, so the server never learns the player moved and every attack misses. `headless.js` runs frames until `stop()`.
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
