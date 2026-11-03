# Dark Infection Pipes (grind spots)

One pipe in each of the eight lands (`DIP_SITES`, placed once at load by `dipPlaceAll`: the flattest clear square 90-500 m from the land's village, 20 x 20 m, no trees or camps: `dipNear` is asked by `nearPath` and the camp placer). Each land has just one (no room for more): standing at one, the talk key opens a panel.

- **Release dark energy**: costs coins (`dipCost`: 50% of what killing every spawn before each refill tick pays for the whole 10 minutes, mean coins per kill, no coin bonuses), lasts `DIP_SECS` (600). One activation per pipe at a time; anyone nearby can fight there.
- **Level** (yours, saved as `gear.dip[site id]`, 0-5): monsters alive at most `DIP_COUNT` 10, 20, 30, 40, 50, 60; refill every `DIP_INTERVAL` 12, 9.6, 7.4, 5.5, 4, 3 seconds. The refill spawns the missing monsters of every non-boss kind of the whole land as temporary monsters (`m.dip`).
- **Upgrade**: `DIP_UP_N` (8, 15, 25, 40, 60) of EACH of four materials (the land's lowest, two middle and highest kinds). Pipe monsters drop `DIP_MAT_K` (25%) of the usual material chance (`rewardKill`).
- **The home forest**: kinds below level 10 spawn as level 10 (`dgKOf(def, 10)` in `m.dgK`). Everywhere else monsters keep their own level (and your zone tier applies as usual).

| Layer | Files |
|---|---|
| shared | `shared/dip.js` (data, placement, price) |
| server | `server/dip.js` (`MSG.dip` `open` / `up` / `go`, `dipTickS`, `dipTickP`, `dipSanitize`) |
| client | `game/dip/dip.js` (pipe model, glow, panel), `index.html` `#dip`, `styles/34-dip.css` |

Hooks marked `// dip:`: `nearPath` (village-helpers.js), the camp placer (monsters.js), `sanitizeGear` and the player loop (players.js), the tick (api.js), `rewardKill` (combat.js), `talking.js`, `loop.js`, `generation-setup.js`, `panels.js`.
Protocol: in `dip{a:'open'|'up'|'go', id}`; out `{t:'dip',a:'info',id,lv,max,cost,count,every,kinds,needs,act,next}` and `{t:'dipa',a:[[id, seconds left]]}` (every 3 s while any pipe is active, once empty). Test: `node tools/dip-smoke.js`.
Not built: a map marker for the pipes; flattening the ground (a pipe is placed where the ground is flattest, at most 5 m of rise over the square).

Coins (`coinsFor`, `shared/balance.js`) are soft-capped from level 30 (`coinCapK`): a level-60 kill pays x6 a level-30 one, level 120 pays x4 a level-60 one (x24 of level 30), a smooth ramp between; below level 30 nothing changed. Pipe prices follow it, so they are about 25 times lower than first built at the top.
