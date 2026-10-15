# PvP: the Proving Isle

Asked for by a player. **PvP is not balanced on purpose**: the owner balances the game for PvE only, so every number below is a plain default, not a tuned one. What the mode promises is that
everyone fights with the same numbers and that nothing is won or lost. Code map: `CLAUDE.md` section 4 (row "PvP"), the hooks `grep -rn "// pvp:" src`, the test `node tools/pvp-smoke.js`.

## Where

A round island in a round lake in the home forest's south-west, south of Slime Meadow (zone 1) and west of the Shore Road: centre (-190, 300) (`PVP_ISLE` in `shared/terrain.js`: island r 33,
lake r 62; the fighting ground `PVP.r` is 35). A spur of the Shore Road, **The Proving Road**, leaves it at (-102, 282) and ends on the island; where it runs under the lake's water the road code
makes a 45 m plank causeway by itself, **The Proving Bridge** (`BRIDGES`, `shared/roads.js`). The gate stands on the bridge where it meets the island (`PVP.gate`, about (-157, 288)).
The lake is a wall like the sea and the river (wade to the knees, no deeper: `pvWall`, `game/pvp/state.js`), so the bridge is the way in. No monster camp lives within 96 m of the island
(`ok()` in `server/monsters.js`) and no tree grows on it (`arenaDist` counts the island as an arena). The game's testing tools can put you there: `tPass` with `data-v="-121,284,90"`.

## The rules

| Rule | Where | Value |
|---|---|---|
| Who is "on the island" | `inPvp(x,z)` (`shared/pvp.js`), `pvpTickP` (`server/pvp.js`) | inside the circle `PVP.r`, alive or waiting to wake there |
| One level for everyone | `PVP.level` | `PASSIVE_LV` (13 when this was written; the fixed level follows it): all three attack slots and the first passive are open |
| One set of gear | `pvpGearOf` | the common set of the tier of that level (`tierFor(PVP.level)`: the level-10 set at level 13), whatever you wear: no rarity, ring, pendant or potions (`potion` is refused) |
| No symbol bonus | `pvpRecalcP` | the zone tiers' symbol is not read |
| Health | `PVP.hpK` | x2, so a fight lasts a while (plain `20 f(level) + armour`, with the passive's share; about 1,230 health and 73 damage at level 13) |
| Skills | `pvpSkillsOf` | your own equipped attacks of the class in hand at **level 1**, boss skills included; a slot you have not opened or left empty gets the class's free skill; skill-set pieces and set bonuses are left out |
| Passives | `pvpSkillsOf` | below `PASSIVE_LV` you get the default (Vitality); from it up what you wear in your first slot (Vitality instead of a skill-set passive); all at level 1, one slot |
| Elements | `elemHitS` (`server/combat.js`), `PVP.elemBoost` | **your soul is your element when you are hit.** Advantage x1.15, disadvantage /1.15 (the wheel against the other's soul, and your own soul's match / opposite with your skill); against monsters it stays 1.5 |
| Who can hit whom | `foesS(p)` | everybody on the island hits everybody on the island, except their own **party** (`server/party.js`, `/invite name`); nothing crosses the water's edge in either direction |
| Rewards | none | no XP, coins, drops, quest or main-quest credit; your save is never touched (`p.pv` is a view on top of it) |
| Regeneration | `PVP_REGEN_*` (`server/pvp.js`) | 4% of health a second after 6 s without being hit (3 s and 8% outside) |
| Stun | `pvpCcP` | a root cannot be renewed for 4 s after it ends |
| Knock-out | `pvpDownS`, `pvpReviveP` | 3 s down, then you wake at a random spot on the lake's mainland bank (`PVP.shore`) at full health, not in a village |
| The gate | `PVP.lockS` | shut for 10 s after you wake: the client holds you at the bridge (`pvWall`), the server puts you back if you get in anyway (`pvpPushOutP`) |

Monsters ignore a fighter (`nearestFighter`), and a fighter's attacks only look for other fighters (never a monster), so the island cannot be used to farm.

## How it works

`combat.js` loops over `foesS(p)` instead of `MONS`: for a fighter on the island that is every other living fighter, each as a **proxy** (`pvpFoeOf`) that looks like a monster to those loops.
`damageMonsterS` and `statusS` see `m.pl` first and hand over to `pvpHitS` / `pvpStatusS`; the damage roll is the attacker's (`rollDmgS`), the target takes the hit through `hurtP`
(their own armour, passive and buffs; the damage number is the usual `hurt` event). A stun or slow set on a proxy becomes a `pfx` root / slow on that player. Events: `pvp [pid,1|0]` (stepped on / off),
`pvlock [pid,seconds]` (the gate is shut); `you.pv` is 1 on the island, and the snapshot shows everyone there at level `PVP.level`. Client: `game/pvp/state.js` (the loadout the action bar uses, picking a
target with the usual keys / Tab among the other fighters, the badge, the walls), `game/village/buildings-pvp.js` (the gate and the banner poles).

## Knobs and open choices

`PVP.level`, `PVP.hpK`, `PVP.lockS`, `PVP.elemBoost`, `PVP.r` (`shared/pvp.js`); `PVP_REGEN_*` (`server/pvp.js`); the island and lake in `PVP_ISLE` (moving it moves the road's end: edit both).
Decisions made without asking, easy to change: boss skills are allowed (they are earned, and equal in size to the bought ones); a soul counts as an element and its match bonus applies (at 1.15);
the 4-second stun immunity; the shore spots lie in an arc facing the bridge, so a knocked-out fighter walks at most ~70 m back to the gate.
Not built: a kill feed or scoreboard, spectating, duels outside the island, any PvP tuning of single skills (several were designed against monsters and are strong or weak against players).
