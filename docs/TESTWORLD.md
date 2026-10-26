# The public test world

A second, throwaway world on the deployed server, at `https://<host>/test` (the same page; `start-screen.js` sees the path and offers one button). Its sockets use `/ws-test`.

- **Separate**: its own `createWorldServer` instance (`makeWorld` in `src/node/main.js`): monsters, hikers, chat and parties are not shared with the main world. It is made when the first hiker arrives and dropped when the last leaves (so every session of an empty world starts fresh), at most `TEST_MAX` = 40 hikers.
- **Nothing kept**: no store, no auth (accounts off), the hello's save / account code / login are ignored (`beginJoin`), and the client writes nothing to the browser (`NET.test` in `saveGear`, `saveProgress`).
- **No XP** (`gainExpP`), **no ranking** (`frRankP` sends an empty list), **no testing tools** (`dev:false`, `gemtest` refused).
- **The kit** (`testKitP`, `src/server/testworld.js`): level 60; every level-40 weapon, armour piece and ring at Unique +8 and every pendant kind (level 30) at Unique +8, the best worn; 10M coins; 1000 weapon / armour / ring reroll stones; every zone tier symbol at +4; every outfit set; every class skill, passive, signature set, burst and cave skill (cave at its max, the others at skill level 4; boss skills follow the tiers); every circle attuned and gate open.
- Hooks are marked `// testworld:`. Test: `node tools/testworld-smoke.js`.
