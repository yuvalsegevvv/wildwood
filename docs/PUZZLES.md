# Puzzles (build thread 1: engine, Rootlines, Ice slide)

Plan: project files `puzzles-plan/PLAN.md`. Everything is behind `PZ_ON` (`shared/puzzles.js`, `false` until the story revamp ships): no stone works or shows, the track tab says "next update". The admin Puzzles section (devP `pz`) and the puzzle lab work regardless.

## Code map
| Layer | Files |
|---|---|
| shared | `puzzles.js` (registry `definePuzzleKind`, `PZ_DIFF`, `PZ_CHEST`, track constants, `pzSeed`, `pzBoard`), `puzzles/rootlines.js`, `puzzles/ice.js` (generator + checker per kind), `puzzle-sites.js` (`PZ_SITES`: only the tutorial stone so far) |
| server | `puzzles.js`: `MSG.pz` (`open` / `solve` / `close`), `MSG.scroll`, `pzChestP`, `pzTrackP`, `pzDevP`, `pzSanitize`. Saved: `gear.pz`, `gear.sig`, `gear.sigPaid`, `gear.scr` |
| client | `game/puzzles/panel.js` (frame, clock, resume, chest window, admin section wiring), `rootlines.js`, `ice.js` (views, `PZV.<kind>`), `scrolls.js` (forge Scrolls tab, Sigil track tab), `game/village/buildings-puzzle.js` (stones), `styles/33-puzzles.css` |
| tools | `tools/puzzles-smoke.js` (test), `tools/puzzle-lab.js` (builds the lab page: `node tools/puzzle-lab.js out/puzzle-lab.html`) |

Hooks into old files: `players.js` (`sanitizeGear` calls `pzSanitize`), `economy.js` (`devP` 'pz'), `talking.js` (talk key + prompt), `loop.js` (`pzUpdate`), `generation-setup.js` (`pzBuild`), `forge.js` (Scrolls tab), `gems.js` (Track tab), `panels.js` (`puzzle`), `index.html` (`#puzzle`, `#tSec` Puzzles section).

## Protocol
Client to server: `pz{a:'open',site}`, `pz{a:'solve',ans}`, `pz{a:'close'}`, `scroll{id,to:'e'|'u'}`, `dev{cmd:'pz',v}` (`v`: `{kind,diff,seed}` | `{chest:diff,first,lv}` | `{sig:n}` | `{reset:1}`).
Server to client: `{t:'pz',a:'open',site,kind,diff,seed,lv,first,src,floor}` (the client generates the board from the seed), `{t:'pz',a:'no',why}`, `{t:'pz',a:'done',ok,diff,site,first,src,gems?,sig?,track?,chest?}`.
Answers: Rootlines = k paths (cell lists from `ends[i][0]` to `ends[i][1]`); Ice slide = the move string (`U D L R`), replayed by the server.

## Kinds and difficulties as built
- **Rootlines** (Flow Free). A random Hamiltonian path is cut into paths; a rule-propagating edge solver counts solutions; paths are cut where two answers differ until exactly one colouring remains, then seeds are merged away while it stays unique. Sizes 4x4, 5x5, 7x7, 9x9, 12x12. **No root bridges yet** (the plan's extreme).
- **Ice slide**. Stops on rock or edge; stone must rest on the rune. 1: 5x5 (2-3 moves), 2: 7x7 (4-6), 3: 9x9 with two switches (7-10), 4: 12x12 twin stones (9-14), 5: 12x12 twin stones, one switch, five cracking tiles (13-20). **No pushable blocks yet.**

## Measured generation times (this machine)
Rootlines: d1-2 about 1 ms, d3 about 10 ms, d4 about 100-300 ms, d5 3-7 s. Ice slide: d1-4 under 5 ms, d5 about 60 ms. The plan's 5 ms for trivial-normal is met except Rootlines normal; see the thread report.

## Not in this thread
3D chests in the world (the chest is drawn in the panel for now), dungeon / raid / cave hooks and party sharing, the 40 track cosmetics (`PZ_TRACK_COS` is empty), the 328 stones, the other seven kinds.
