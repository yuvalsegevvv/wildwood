# The Test Room

A pad outside the home village's gate (37 m from its centre, on the bearing of the old Trial Gate, `TROOM` in `shared/testroom.js`), in **every** world: the live game with your own kit, and the public test world (`docs/TESTWORLD.md`) with its level-60 kit. It replaced the Trial Roots practice dungeon.

- **The Training Scarecrow** (`SCARECROW_DEF`, a `totem`-model prop with `pal.style:'scarecrow'`, level 1) cannot be killed: `troomHitS` puts its health back after every hit. Its numbers are the plain tier-0 ones for everyone (`m.trK` in `monK`), so a hit is never cut by a level or a zone tier.
- **The counter** is per hiker (`p.trc`): total damage, hits, biggest hit, and damage per second from the first hit to the last. It is sent at most 5 times a second (`troomc`) and shown on the screen while you stand on the pad and in the panel (talk key on the pad). A reset clears it.
- **The buttons** (message `troom{a}`, only on the pad): `reset` (counter), `cd` (every cooldown of yours including the burst, and the scarecrow's burst stun lock; the client zeroes `CB.cd` on `troomcd`), `charge` (cave charge to 100, from the cave slot's level).
- **Soul and skills**: `bindSoulP` works on the pad (no trip to Hanami; level 15 still needed); skills are equipped from the skills panel as anywhere (the panel has a button for each).
- **Hooks** are marked `// testroom:` (combat.js, skillsets.js, tiers.js, economy.js, api.js, players.js, entrances.js). Dressing: `game/village/buildings-testroom.js`; the panel: `game/ui/testroom.js`, `styles/32-testroom.css`.
- Test: `node tools/testroom-smoke.js`.
