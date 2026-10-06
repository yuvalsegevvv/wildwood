# Kit: Grind

> **DRAFT.** Read `RULES.md` (one page) first, then only this file. This file is **theme-neutral**: it names no theme and no person (a theme's first name, gender, kit and element(s) are one row in `THEMES.md`). Piece and mark names are cosmetic working names that carry no mechanics. Do not open other kits.

| Field | Draft |
|---|---|
| Archetype | `grind` |
| Role, part | grind: clears camps, a major part |
| Element(s) | **the first grinder is pure `basic`** (every piece element-less: no aura, no reaction, no soul bonus, **never an elemental disadvantage**: the owner's one requirement); a later grinder may be **one element or a hybrid of two** (grind is allowed hybrids; never two soul opposites) |
| Kit mark | none: the kit runs on kills, not on marks |
| Budget | **farms at twice the kills per minute of the best alternative; single-target damage about 50%** |
| Easiest to get | **yes, on purpose** (it boosts progression): the first land (the lowest-level bosses and the easiest dungeon); optionally **friendlier odds** through a per-source override (first guess: bosses 15% with a sure drop on the 14th clear, dungeon 30% with a sure drop on the 7th); the owner decides (`docs/SKILL-SETS.md` decision 37) |
| Needs (milestones) | M2a: `on:kill` triggers, `cost` passives, `vsBoss` (optional); the harness' farming route |

## Fantasy

This kit clears enemies the way a field is cleared, not one by one: a wide sweep, drag everything into a pile, one huge swing to finish. It is about **rate**: how many kills a minute.

## The six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Windrow Sweep** | A wide arc or fan hitting everything near the target for low damage each; usable while walking between camps | **Steady Hands**: a small heal when a hit of this kit kills in a crowd |
| P2 | skill | `any` | **Gather In** | A big ground zone at the target that pulls enemies to its centre (negative knockback) and nicks them; **its radius is larger than the gap between neighbouring camps**, so it gathers two | **Wide Berth**: more radius on every skill; **cost: less single-target damage** (the "bad for bossing" lever) |
| P3 | burst | `any` | **Bumper Crop** | The largest ring in the game's skills around the caster plus a short lingering zone, finishing what was gathered | **Second Basket**: a multi-kill (four or more in two seconds) gives back part of P2's cooldown |

**Class versions of P1:** warrior, a scythe-like arc of about 180 degrees at melee range; archer, **Chaff Fan**, seven short arrows in a fan with a small splash; mage, **Chaff Burst**, a bolt that bursts wide. All low per target.

## Bonuses

- **3, Windrow:** a kill inside any of the kit's areas gives back a small slice of every cooldown (trigger `kill`, with an `icd`).
- **5, Full Basket:** while three or more enemies are within 8 m, every fourth second a shockwave pulses (trigger `tick`, an `fx` ring).

## Statuses and reactions

None of its own. Element-less hits neither leave nor trigger an aura, so the grinder never disturbs a party's reactions. A buffer's `infuse` could make it react: undecided (see watch-outs).

## Note for later: buff the spawns (the owner's note)

Twice the farming speed is not reachable with today's world. A camp is only **2 to 6 monsters** (`per` + 2), each takes **35 s to respawn**, and `MON_COUNT` sets how many of a kind exist, so one camp cannot feed an area-damage kit faster than the respawn allows, and a kit that clears a camp in seconds then stands and waits. **To make this build viable, buff the spawn count and the spawn rate**:

- **More monsters a camp and more camps** (`per` in `shared/monster-defs.js`, `MON_COUNT` in `server/monsters.js`), so an area skill has something to hit.
- **A shorter respawn** (`m.respawnT = 35` in `server/combat.js`).
- **How much** comes from the farming route in `tools/skillsets-ladder.js --farm` (it prints kills a minute against the respawn cap), not from a guess.
- These changes touch **every build and every player** (XP and coins an hour, the density of a camp, the monster roster sent to clients), so they are made **before** the grinder is tuned, with `server-smoke`, `client-smoke` and the XP checks (`levels-smoke`, `tiers-smoke`), and camps must still feel like camps.
- It is also listed in `docs/NOT-BUILT.md` so an agent working on spawns finds it.

## Balance targets and the harness scenario

- **Farming ratio = 2.0** (accepted 1.8 to 2.2) at every ladder step: kills per minute of this kit over the same route as the best alternative (the best damage set at the same piece count, or a non-set maxed build).
- **The route** (`tools/skillsets-ladder.js --farm`): a fixed list of real camps in one zone, walked at run speed. A camp is **2 to 6 monsters (`per` + 2) within about 5 m of its centre, camps 9 to 18 m apart, each monster respawns 35 s after it dies** (`server/monsters.js`, `combat.js`). One camp alone cannot beat the respawn, so **the 2x comes from clearing a camp in seconds (travel dominates) and from reaching the neighbour with P2**.
- **Single target about 50%** of a damage set; the harness reports the pack and the single-target numbers separately, and **XP and coins per hour** (twice the alternatives: the owner's decision).
- Element-less compensation `SS_NOEL_K` comes from the harness, not from a guess.

## Acceptance (the smoke test must show)

- The farming ratio is within 1.8 to 2.2 at 0, 3 and 5 pieces; boss-dummy damage is within 40 to 60% of a damage set.
- Every piece is `basic`; every active deals damage; P2 and P3 are `any`; P1 has three class versions; ids and `act` kinds are unique.
- A dungeon Defense mission is still a mission (objectives, timers) with this kit, not a free win.

## Watch-outs and open questions

- Twice the farming speed is twice the XP and coins an hour for this kit on every land: the owner chose it; the ladder prints it so it stays a conscious number.
- Pulling two camps at once also wakes both (aggro): check the leash and the danger at higher tiers.
- Should a buffer's `infuse` give it an element (and the soul bonus)? Today a self buff does.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`, `tools/skillsets-ladder.js --farm`.
