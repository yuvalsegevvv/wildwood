# Objective guide (waypoint)

Added after a blind playtest (11/2026): a new player could not find the first villager, and on a cave floor nothing said where the next method was. Client only: nothing synced or saved.

## The marker (`src/game/ui/waypoint.js`, prefix `wp`)

- A gold diamond with the target's name and distance (`#wpMark`, styles at the end of `02-hud.css`). On screen it sits over the spot; off screen it rides the screen's edge with an arrow (behind you: the bottom edge).
- The target: `wpTarget()`: on a cave floor the cave guide's (`cvwTarget`), in a dungeon run none, otherwise the main quest's (`mqTarget`, `economy/main-quest.js`: the next villager, monster zone or place; null while the step waits for a level).
- Hidden before play, in the editor, while knocked out, while a panel or a scene is open (`uiOpen`), and within `WP_NEAR` (6 m) of the spot.
- `updateWaypoint(dt)` runs every frame from `main/loop.js`; the target and text are refreshed four times a second.

## The cave guide (`src/game/cave/waypoint.js`, prefix `cvw`)

- `cvwPick()`: a method in progress points at its next spot (the altar while carrying the glow crystal, the shrine in the silent chamber, the open vault, a running gem mole, the nearest missing mural piece or the wall, an uncracked geode, a vein / herb / the anvil for crafting). Otherwise the nearest method place that is not resting and still teaches a skill you do not own (a place that only pays Echo Shards counts three times as far). G (the mole) has no fixed place.
- The HUD line `#cvMethod`: the server's sentence (`caveMHudP`) if it has one, else "Next: <method> (teaches <skill>). <how>"; either way followed by the distance and direction (`cvwHud`, refreshed twice a second by `cvwFrame`).
- The cave maps: a letter on each method's place (gold: teaches a skill you do not own, with its name on the full map; grey: Echo Shards only), a ring round the guide's pick (`cvwMapMarks`).

## Travel from anywhere

- The land map's **Travel** chip (`#mapTravel`, shown once a circle other than the home village's is awake) opens the travel window with `openTravel(true)` (`TR_ANY`); a destination sends `warp{to, any:1}`.
- The server (`warpP`, `server/players.js`) refuses it in a dungeon run, on the Proving Isle, on a cave floor and within `WARP_IDLE` (5 s) of a hit; the destination must be an awake circle, as from a circle.

## Hooks

| File | Hook |
|---|---|
| `src/game/main/loop.js` | `updateWaypoint(dt)` (`// waypoint:`) |
| `src/game/cave/methods.js` | `cvwHud()` in `NETH.cm`, `cvwFrame(dt)` in `caveMethodsFrame` (`// caveguide:`) |
| `src/game/cave/minimap.js` | `cvwMapMarks(...)` in `caveMapMarks` (`// caveguide:`) |
| `src/game/ui/map.js` | the Travel chip's visibility (`// waypoint:`) |
| `src/game/village/talking.js` | the travel window stays open off a circle when opened from the map |
| `src/server/players.js`, `src/server/api.js` | `warpP(p,to,any)`, `msg.any===1` |

Test: `tools/client-smoke.js` (the marker on a main quest target, the cave guide's line on every floor), `tools/unstuck-smoke.js` (travel from anywhere).
