# The world map of Eldmere (G): navigating between the lands' maps

Area guide. The map panel the N key opens shows **one land** (`ui/map.js`, painted from the terrain). The world map is the hub above it: the docs map (`docs/world-map.svg`, the continent drawn by `docs/world-map.py`) as an in-game panel, with the four built lands clickable and everything else under purple fog. A click on an open land opens that land's own map.

## Where to change what

| Task | Files |
|---|---|
| The art (what the sea, coast, trees, towns look like) | `docs/world-map.py` (edit the data at its top; `--game` is the variant without title, compass, legend, frame and lettering), then `node tools/world-map-bake.js` (needs Playwright; writes `assets/img/world-map.webp` and `src/game/ui/world-map-data.js`). `python3 docs/world-map.py docs/world-map.svg` still draws the full documentation map, byte for byte as before |
| How the page gets the art | `build.py` `image_block()`: every `assets/img/*.webp|png|jpg` becomes `window.WILDWOOD_IMG['<name>']` (a data URI); the page stays one file. The art is ~200 KB; keep new pictures small (the page cap is 16 MB) |
| Regions, towns, banner places | `src/game/ui/world-map-data.js` (**generated**, `WMAP_REG`, `WMAP_ISLES`, `WMAP_TOWNS`, `WMAP_BANNER`; art coordinates, 2000 x 1574): change `docs/world-map.py`, never the file |
| Fog, banners, pin, pointer, opening | `src/game/ui/world-map.js` (names `wmap*`, `WMAP_*`, the state object `WM`) |
| Which lands are open (fog lifts) | `landOpen(id)` in `ui/map.js` (the same test the land map's "next land" button uses: `valeOpen`, `northOpen`, `westOpen` or standing in the Greyspine) |
| The look of the minimap and the land maps (the ground as the world map paints it) | the painter `src/game/ui/map-paint.js` (`mapBuildStep`: terrain rows a few a frame, then the coast line and dashed zone borders cut from `MAP.kind`, then the villages, then `mapPaintIcons` row by row; the palette `MPC` is the docs map's `COL`), the dressing `src/game/ui/map-style.js` (`mapStFrame`, `mapStCompass`, `mapStPin`, `mapStLabel`, `mapStRibbon`; the old light-on-dark label colours that `map.js` and `dungeon/entrances.js` pass are mapped to inks in `MAPST_INK`), the frame in `16-map.css` (`#minimap`, `#mapC`, `.wm-box`) |
| A fifth land | add it to `LANDS` / `landOpen` / `landHere` (`ui/map.js`), to `WMAP_LAND`, `WMAP_TOWN`, `WMAP_TOWN_NAME`, `WMAP_LOCK` and the id lists in `world-map.js`, give its docs region a banner in `docs/world-map.py` (`LABELS`), re-bake; take its village out of the "unbuilt" list (the fog groups in `wmapFogBuild`) |
| The key | `world` in `KB_ACTIONS` (`game/player/keybinds.js`, default G); the "World" button in the land map's header (`#mapWorld`, `index.html`) |

## How it works

- **Art + overlays.** One canvas (`#wmapC`) fills the box; the baked WebP is drawn under a pan/zoom view (`WM.k` canvas pixels per art pixel, `WM.cx/cy` the view's centre in art pixels). Everything else is drawn live: the hover glow, the fog, the town names, the banners, the pin and the hint line.
- **Minimum zoom shows the whole art, the maximum is 3.5 times that** (`wmapSize`); the fog is baked at 0.6 of the art's size (0.45 on `LOW`, 0.33 on `LITE`), so it softens a little at full zoom. Pan is clamped to the art; drag, wheel, pinch and the +/- buttons move it.
- **The fog** is made once (`wmapFogBuild`, on first open): puffs (`wmapPuff`: overlapping domes, outline first, then a dark-to-light fill) scattered by `wmapFogGroup` over polygons and ellipses with a seeded random generator, so every client draws the same clouds. The regions that are not built (Stormhorn, Sunscar, Amber Reach, the Emberwake Isles) and three banks on the open sea form groups that **never lift**; Wildwood has none; the vale, the Reach and the Greyspine each have a group of their own, drawn at `fade[id] * 0.86` so a locked land's shape shows faintly. Each group is a canvas cropped to its own box (the box is the polygon plus 2.8 spacings, because a puff reaches 1.8).
- **Revealing.** `fade[id]` is 1 while a land is locked and goes to 0 over 1.4 s (after a half-second beat) when `landOpen(id)`. An open land you have not yet seen open starts under fog and lifts when the map opens, once: the lands you have seen are in `localStorage['wildwood-wmap']`.
- **What it says about the unbuilt.** "Uncharted: fog hides what lies beyond", nothing else: the docs map names Sunscar, Amber Reach and the rest, and `docs/STORY.md` has hint rules. A locked land says what bars it in the words of the land maps (`WMAP_LOCK`).
- **The pin** (`wmapPin`): the four villages and their drawn towns fit one affine map (`wmapFit`, least squares); the pin is your land's drawn town plus the fitted slopes times your distance from that village, so it is exact in the village, and if it falls outside your land's region (the drawing's coast is not the game's) it is walked back along the line to the town until it is 6 art pixels inside. `client-smoke` sweeps every dry point of the world. No pin in a dungeon, where the world map does not open (`wmapOpen` returns; the "World" button is hidden by `sizeFullMap`).
- **Hit tests** are polygons (`wmapRegionAt`): a land's id, `'unbuilt'` for the other regions, the isles and the fog banks, `null` for open sea. A click is a pointer that moved 5 pixels or less.

## Hooks into other files (grep `// world map:`)

| File | Hook |
|---|---|
| `ui/map.js` | `sizeFullMap` hides the World button in a run; `updateMap` calls `wmapUpdate(dt)` |
| `ui/panels.js` | `'wmap'` in `PANELS` |
| `player/keybinds.js` | the `world` action; the N action is named "Map" |
| `index.html`, `styles/16-map.css` | `#wmap` panel, `#mapWorld` button, `.wm-box`, `.wm-zoom` |
| `build.py` | `image_block()` |

## Pitfalls

- The headless client (`tools/headless.js`) has no `Image` and does not run the `WILDWOOD_IMG` script block: `wmapLoad` checks for both, so a test sees the "Unrolling the map…" text. `client-smoke` reads the art from `dist/wildwood.html` to check it is embedded.
- Do not use `measureText` in the headless-run drawing code (the stub canvas returns nothing): the banner's width is guessed from the letters.
- The docs map is a drawing: its Wildwood is not the game's outline. Do not "correct" the pin's fit by hand; if a land's drawn region and the game's land differ a lot, fix the drawing.
- A fog puff reaches about 1.8 spacings from its centre; a group's canvas must be padded by more or a straight edge shows (it did, at 1.2).
- The painted picture (`MAP.canvas`) covers the whole world (`MAP.k` = 0.64 px a metre on a desktop, 0.45 LOW, 0.36 LITE: 1489 x 1095 px for the 2340 x 1720 m; painted in about 10 s of JS, spread over the first frames) and is the same for every client: the icons come from `mulberry32` seeded by row, never from `rand`. It is **not** the 3D ground's colours (`terrainColor`): a land's look is `mapPaintLand` (lowland, then the Reach's and the Greyspine's grounds blended over the crest by `smoothstep` weights `hf` / `gf`), so a new land or a new ground needs a branch there and, if it has trees or peaks, in `mapPaintIcons`. The Sunscar plateau is drawn flat (no relief shading: `mapPaintLand` returns how much of it to keep). A new label colour in a `label(...)` call falls back to brown ink; add it to `MAPST_INK` if it should be light, italic or water-blue.
