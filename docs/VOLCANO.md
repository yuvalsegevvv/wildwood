# Pyrrhax, the Sinkwarden: the volcano isle's end boss and the talisman

**Built.** Level 50 is the game's ending: beating Pyrrhax at level 50 counts as beating the game (a toast says so); anything past it is extra content. Test: `node tools/volcano-smoke.js`.

**Files**: `shared/emberwake-bosses.js` (`SINK_DEF`, `SINK_GUARD_DEF`, `EMBER_DEF`, the row with `parts`), `shared/emberwakezones.js` (zones e49 / e50, arena `eboss50` at the isle's centre), `server/boss-kits-volcano.js` (`BOSS_KITS.sinkwarden`, lives, drop), `shared/talisman.js` + `dungeon-rewards.js` / `dungeon-items.js` (the item), `server/rolls.js`, `game/combat/boss.js` (`partText`), `game/world/zone-props.js` (`e49`, `e50`, `eboss50`).

## The fight (one boss, three parts, each with twice a full boss's health: `SINK_PART_K`)
1. **Guarding Wardens**: four stone wardens (`sinkguard`) share part 1's pool (each has a quarter of 2x). The boss sleeps hidden and immune; its bar mirrors the wardens'. Geysers and a crater-heat donut meanwhile.
2. **The crater**: Pyrrhax rises with a fresh 2x pool: lava geysers, fire-breath cones, leaps, a donut (stand close), ember spawn.
3. **The eruption**: when part 2's pool hits 0 the volcano erupts (rock fall), he goes berserk (`B.enraged`, +25% damage, faster) and flies (`mode 1`, immune) bombarding for 15 s, then dives onto the farthest hiker and is stunned for a **landing window** (7 s, x1.5 damage), fights on the ground 6 s, takes off again. The pool of part 3 ends the fight.

Reading of "twice the hp of a full overworld boss": a part = 2 x the health of one level-50 boss (`SINK_DEF.hp`); the four wardens together make that, not each.

**Three lives**: a knock-out inside the arena wakes on the spot after 3 s (60% health, 2.5 s grace) up to 3 times a hiker a fight; the fourth is the normal respawn. The fight is not reset while a hiker waits to revive. Hooks: `// volcano:` in `boss.js`, `combat.js`, `players.js`.

## Reward: the talisman (new level-40 slot `eq.talisman`)
One fixed bonus, one of five: attack speed, buff duration, charge gain, cooldown reduction, flat attack (added with the weapon's and ring's). Common +0: 5% / 8% / 8% / 5% / +30; x rarity, +10% a tempering step, plus three rolled lines like other level-40 gear. Ids `talisman8-<kind>[-r|e|u|l][+n][~roll]`. Each hiker who hit the boss rolls one: the kind at random, the rarity by the zone tier fought at: **80/15/4/0.8/0.2 at +0, 50/25/15/7/3 at +5**, linear between, tiers above 5 as 5 (`talRarityWeights`).

**One stone for all accessories**: rings, level-40 pendants and talismans roll with `gear.rsr`, now the **Accessory Reroll Stone**; sacrificing a level-30+ ring, pendant or talisman pays it (1/2/4/8/16). Level-40 pendants can now be rolled (they were never rolled before).

## The volcano's common monsters
Zones `e49` The Ashfall Slopes (Ash Crawler, Cinder Wisp, level 49) and `e50` The Caldera Rim (Magma Husk, Caldera Condor, level 50), existing models in ember palettes. The isle's ground is still the atlas's placeholder dome (the arena is flat at its top); a high-polygon volcano model is not built.

## Test server
The `/test` kit now holds every level-40 pendant kind and every talisman kind at Unique +8 (an attack talisman is worn).
