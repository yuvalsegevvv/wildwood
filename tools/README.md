# Tools

Headless helpers, made so a change can be checked without a browser and without reading the game. Install once: `npm install` (three@0.128 for these tools). The previews also need Python 3 with numpy and pillow; `city-preview.js` and `glasswell-smoke.js` need playwright and a Chromium.

**The tests are listed in one place, `tests.json`** (a row each: id, what it proves, what it needs, about how long, which source paths it covers), and are run by `node tools/run-tests.js` (no arguments: the tests that cover what you changed; `--list`, `--fast`, `--all`, names: see `../docs/TESTING.md`). A test's detail is the comment at the top of its file. This README does not list them, so it cannot drift; `python3 build.py --check` fails for a `*-smoke.js` that is not in `tests.json`.

| Kind | Files |
|---|---|
| Run and register tests | `run-tests.js`, `tests.json` |
| Tests (`*-smoke.js`, and) | `boss-duel.js --check` (balance yardstick), `skillsets-ladder.js --check` (power ladder), `outfit-looks-check.js`, `server-fuzz.js` (garbage at every handler), `dungeon-fuzz.js` (random valid party and run actions), `boss-fuzz.js` (chaos at every boss), `skillset-fuzz.js` (random loadout actions), `lint-bundles.js` (undefined names per bundle) |
| Measure | `server-bench.js` (ms per tick and bytes per snapshot for N players; profile it with `node --cpu-prof`) |
| Look at things | `model-preview.js` + `rast.py` (characters, outfits), `monster-preview.js` + `monster-rast.py` (monsters, bosses), `city-preview.js` (Glasswell), `shot.js` (a screenshot of the built game after a teleport: terrain, colours, lighting), `entrance-map.js` (the four dungeon doors on the terrain) (the in-game world map's art) |
| Generate docs | `gen-docs.js` (`docs/MOBS.md`, `docs/EQUIPMENT.md`), `../docs/world-map.py`, `../docs/glasswell-plan.py` |
| Libraries for your own scripts | `load.js` (`loadServer(io, names)`, `loadShared(names)`), `headless.js` (`bootClient`: the built page in Node with a stub DOM; `{touch:true}` boots it as a phone, `{lite:true}` in light mode), `char-load.js` (the character code outside the game), `host-lib.js` (start the built server as its own process on a free port and talk HTTP / raw WebSocket to it: `startHost`, `get`, `wsOpen`, `send`, `msgs`) |
| Housekeeping | `doctor.js` (is this checkout ready? what to run when not), `unused.py` (dead-code candidates) |

Writing a test: print `PASS ...` / `FAIL ...` lines, exit 1 on a failure, add the row to `tests.json`. For the server start from `server-smoke.js` (`loadServer`, `tick`, `inbox`); for the built page from `client-smoke.js` (`bootClient`, `expose`).
