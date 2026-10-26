# The Amber Reach (zone 7, stem `savanna`)

The seventh land: a golden savanna of wide skies, waterholes and herds south of the Sunscar, home to the **Kin** (people with animal ears, tails and markings). Levels 37-45, one village, nine zones, eighteen monsters, two world bosses, a dungeon, a raid and three signature characters. It is built as an ordinary land: no main quest (levels 33-50 are decided against, `CLAUDE.md` section 10), only side quests, notices and small talk. The code map is `docs/areas/savanna.md`.

**The name.** The land is `amber` in the atlas (`waLandId` 6, `landAt` = `'amber'`) but every file uses the stem `savanna`, because `amber` already means the gear-upgrade material (`shared/amber.js`, `gear.amb`) and the closed gate flag `gear.amber`. Do not confuse the three.

## What is built

| Piece | Design |
|---|---|
| Way in | The **Ashbed Gate**, a thorn hedge across the dry riverbed on the Sunscar's south border. It opens when the Sand Wyrm falls (`gear.amber` 1, held by `barHold` until then). An old save that already killed the Wyrm gets the flag on its next join. |
| Village | **Tallgrass** (`VIL7`), round the Moot Baobab; teleport circle attuned by walking in (`gear.tall` 2). Nine named people (Warden Oruvi, Elder Tamsa, Kesi, Brindle Hask, Dessa Hornwright, High Watch Ennu, Healer Wiru, Sefi, Old Mudge) and small talk `SMALLTALK7`. The cape pier to the Emberwake Isles is sealed (a locked door for now). |
| Zones | `a37`..`a45`, one level each: Ashbed, Tallgrass Meadows, Seven Pools, Termite Cathedrals, Anvil Rock (boss), Burnt Plain, Baobab Reach, Sedge Delta, Sunstair (boss). Two monsters a level, 18 in all. |
| Seasons | **Greenfall** (wet, green grass, storms) and **Goldfall** (dry, gold grass, heat haze, smoke) alternate every three game days (a two-hour cycle) from the day counter every client already has; only the look and the rain change, never stats or drops. |
| Bosses | **Old Thunder, the Anvilwing** (41; lightning lines, grass fires, gusts, the dive, spark wisps, the eye of calm) and **Oldhorn, the Herd-Mother** (45; calf stampede lanes, tusk sweeps, rings, grey floor patches cleansed by killing the carriers). 12 boss skills (2 per class per boss). Oldhorn's fall opens the zone tier. |
| Zone tier | `amber` joins `ZTIER_LANDS`, opened by Oldhorn; in the symbol as its seventh badge (`ZTIER_SYMBOL_LANDS`, `.zs.amber`); the cap is still +420%. |
| Dungeon | **The Termite Cathedral** (boss Queen Ortha, level 45 at +0, enter from 42, pays level-40 rings with three rolled lines). |
| Raid | **The Broken Moot** (seventh stronghold, material the Moot Bead). |
| Kin | Ears, tails, muzzles, horns, a mane, fur colours and markings are optional features **every player** can pick from the first minute (no races). Some are free, some crafted at a Wayfarers' Lodge, some belong to an outfit set. |
| Signature sets | **Brindle** (hyena, +1, mixed support, fire), **Dessa** (rhino, +2, tank, earth), **Sefi** (cheetah, +3, risk DPS, air). Each also fills one Deep Cave method (floors 2-4). |
| Ring rolling | The Ring Reroll Stone (`gear.rsr`) and rolled level-40 rings, so the Cathedral has something to pay. |
| Side quests | `The Dawn Seat` (Oruvi) and `The Drought Song` (Tamsa and Kesi). |

## Decisions worth remembering

- The Kin have always been here; their legend says their first mothers "wore a second shape" from the Crown's light. This keeps the act VI reveal (`docs/STORY.md`) open and builds nothing of it.
- The Greying turns Kin into **Hollowed** (a monster with a Kin silhouette) and poisons the two great animals. Kin villagers are never enemies; the Dustrunners are the one raider band.
- The upgrade material stays the Tempering Stone; there is no amber resin.
- The Kin are governed by the Moot of Seven Seats (a rotating Dawn Seat), not a monarchy. The design avoids any name, character, scene or plot from a famous film about a pride land; keep it that way when adding names.
- Left out on purpose: a Great Crossing event, amber nodes, a pet or mount, and any main-quest steps.

## What is left

- The sealed cape pier and the Emberwake Isles beyond it.
- The Great Crossing event (an idea; see `docs/NOT-BUILT.md`).
- Still to tune in play: the Tempering Stone drop chance for level 30+ monsters, ear and tail shapes after more previews, and whether the Reach's zones need fewer or more camps.
- Music: `savanna1` (Tallgrass and 37-41) and `savanna2` (42-45) are synthesized themes in `game/audio/music.js`; no recorded `assets/audio/music-savanna*` track exists yet.
