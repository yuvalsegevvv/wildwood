# The world map of Eldmere (G): navigating between the lands' maps

Area guide. The map panel the N key opens shows **one land** (`ui/map.js`, painted from the terrain). The world map is the hub above it: the **atlas painted as a map** (no baked picture any more: `wmapPaint` in `world-map-data.js` colours each land, the shallows, lakes, beaches and borders from `shared/world-atlas.js`), with the six lands clickable and the Amber Reach and the sea's corners under purple fog. A click on an open land opens that land's own map.

## Where to change what

| Task | Files |
|---|---|
| The art (a land's colour, shallows, borders) | `wmapPaint`, `WMAP_LAND_COL` in `src/game/ui/world-map-data.js` (hand written; drawn once when the map first opens, 6 m a pixel, 12 m on `LOW` / `LITE`). `docs/world-map.svg` / `world-map.py` remain the docs' drawing of the continent as first planned; the game no longer reads them |
| The frame, banners, towns, fog banks | `world-map-data.js`: 1 art pixel = 2 m (`wmapArt(x,z)`, `wmapWorld(ax,ay)`, margin `WMAP_M`), `WMAP_BANNER` (at each land's hub, `WA_HUBS`), `WMAP_TOWNS` (the villages), `WMAP_BANKS`, `WMAP_AMBER` |
| Fog, banners, pin, pointer, opening | `src/game/ui/world-map.js` (names `wmap*`, `WMAP_*`, the state object `WM`) |
| Which lands are open (fog lifts) | `landOpen(id)` in `ui/map.js` (the same test the land map's "next land" button uses) |
| The look of the minimap and the land maps | the painter `src/game/ui/map-paint.js` (`mapBuildStep`, `mapPaintOne`; the palette `MPC`), the dressing `src/game/ui/map-style.js`; the lands' boxes (`LANDS`) are computed from the atlas |
| A seventh land | `LANDS` / `landOpen` / `landHere` (`ui/map.js`), `WMAP_IDS`, `WMAP_FADE`, `WMAP_TOWN_NAME`, `WMAP_LOCK` (`world-map.js`), `WMAP_NAMES`, `WMAP_LEVELS`, `WMAP_LAND_COL`, `WMAP_TOWNS` (`world-map-data.js`); take it out of the Amber fog group if it is the Amber Reach |
| The key | `world` in `KB_ACTIONS` (`game/player/keybinds.js`, default G); the "World" button in the land map's header (`#mapWorld`, `index.html`) |

## How it works

- **Art + overlays.** One canvas (`#wmapC`) fills the box; the painted atlas is drawn under a pan/zoom view (`WM.k` canvas pixels per art pixel, `WM.cx/cy` the view's centre in art pixels). Everything else is drawn live: the hover glow (`wmapMask`, a land's silhouette), the fog, the town names, the banners, the pin and the hint line.
- **Minimum zoom shows the whole atlas, the maximum is 3.5 times that** (`wmapSize`). Pan is clamped; drag, wheel, pinch and the +/- buttons move it.
- **The fog** is made once (`wmapFogBuild`, on first open): puffs (`wmapPuff`) scattered by `wmapFogGroup` wherever a test says the ground is near a land (`wmapNearLand`, the atlas) or inside a bank's ellipse, with a seeded generator, so every client draws the same clouds. The Amber Reach and three banks on the open sea (the corners and the Emberwake Isles in the south) **never lift**; Wildwood has none; the other five lands each have a group that lifts when `landOpen(id)`.
- **Revealing.** `fade[id]` is 1 while a land is locked and goes to 0 over 1.4 s (after a half-second beat) when `landOpen(id)`. An open land you have not yet seen open starts under fog and lifts when the map opens, once: the lands you have seen are in `localStorage['wildwood-wmap']`.
- **What it says about the unbuilt.** "Uncharted: fog hides what lies beyond", nothing else. A locked land says what bars it in the words of the land maps (`WMAP_LOCK`).
- **The pin** (`wmapPin`) is exact: the art is the atlas, so the pin is `wmapArt(P.x,P.z)`. No pin in a dungeon, where the world map does not open. `client-smoke` sweeps every dry point of the world.
- **Hit tests** (`wmapRegionAt`) ask the atlas: a land's id, `'unbuilt'` for the Amber Reach and the fog banks, `null` for open sea. A click is a pointer that moved 5 pixels or less.

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
