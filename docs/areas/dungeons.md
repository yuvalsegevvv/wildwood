# Dungeons (code map)

Area guide. Moved word for word from `CLAUDE.md` section 4 (the row written with the dungeons design); the design itself is `docs/DUNGEONS.md`.

## Where to change what

### Dungeons (**planned, not built**: only the pure setup exists and nothing calls it): the map tiles (24 x 24 cells of 2 m = 48 m; `DG_SET_BARE`, `dgRect`, `dgVariants`; the round hall is a boss arena's circle, `DG_BOSS_R` = 20 m = every `ARENAS` r), the seeded layout generator (`dgLayout`, `DG_MISSIONS`: the roles each mission needs, one boss hall each: every mission ends with a boss, no extraction), the baked grid both sides share (`dgBake`, with `boss` = the hall's circle as an arena `{x,z,r}`; `dgSolid` / `dgFree` / `dgSlide`, `dgLos`, the monsters' flow field `dgFlow` / `dgStep`), party-size scaling (`DG_PARTY`, `dgParty`, `dgFightRatio`)

`shared/dungeons.js`; the design, the instance plan for the server (runs are far-away slots in the same world; every global that must become per-run is listed), the missions, loot for all, the milestones: `docs/DUNGEONS.md`; test `node tools/dungeons-smoke.js` (`--show defense 7` draws one)
