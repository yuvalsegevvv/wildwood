# Kit: Safe DPS

> **DRAFT.** Read `RULES.md` (one page) first, then only this file. This file is **theme-neutral**: it names no theme and no person (a theme's first name, gender, kit and element(s) are one row in `THEMES.md`). Piece and mark names are cosmetic working names that carry no mechanics. Do not open other kits.

| Field | Draft |
|---|---|
| Archetype | `safe` |
| Role, part | a damage kit, steady: **150 with the full set** (110 / 125 / 150), best on one target |
| Element(s) | from the theme: **one element, or a hybrid of two** (risk DPS, safe DPS and grind only; never two soul opposites: the trade-off is that only the pieces of the soul's element get the soul's x1.5, in exchange for being able to react with itself, which mostly helps a solo player); **air (the `spread` flavour) makes it a reaction enabler**, any element works |
| Kit mark | **Sight** (on monsters, personal, stacks to 3) |
| Budget | the damage ladder **110 / 125 / 150** (the owner: safe DPS is 150% of the baseline, the basic attack and the boss skills); strong on one target, weak when mobbed |
| Needs (milestones) | M2a: marks and `pop`, `rangeScale`; a long cast (exists) |

## Fantasy

The sniper finds the gap in a fight and waits for it: one clean line, from far away, that lands.

## The six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Clean Line** | A precise long-range hit | **Far Sight**: more damage the farther the target |
| P2 | skill | `any` | **Mark the Gap** | A spotting shot: adds Sight and leaves its aura (an **air** aura **spreads** to enemies within 6 m, so allies' hits react there) | **Cold Eye**: more crit chance on a target at full health |
| P3 | burst | class | **Long Gale** | A **charged** shot (a long cast, about 1.3 s) whose damage grows with distance; pops every Sight | **Dead Zone**: **cost: less damage inside 6 m** |

**Class versions of P1:** archer, an aimed arrow; warrior, **Long Throw**, a thrown javelin at about 25 m; mage, **Lens Ray**, a focused ray. **P3** has three versions too (it needs a weapon).

## Bonuses

- **3, Steady Breath:** a target carrying Sight takes more from your next shot.
- **5, Through the Gale:** Long Gale pierces everything in its line.

## Statuses and reactions

Sight marks (the kit's own). Its hits leave an aura of its element(s); with an **air** element the **spread** flavour makes it a reaction enabler for a party: one marked target becomes several that carry the aura.

## Balance targets

The damage ladder 110 / 125 / 150 (**150 with the full set**), measured on one target. On a pack of enemies it should be clearly *behind* the grinder and any damage kit with area skills.

## Acceptance (the smoke test must show)

- `rangeScale` grows with distance and is capped; the charged shot's cast time is respected; Sight caps at 3, clears on death, and is popped by P3.
- Sniper Shot (the existing burst) is clearly worse than Long Gale at the same level.
- P2 is `any` and class-neutral; ids and `act` kinds are unique.

## Watch-outs and open questions

- A cast has no interruption in the game today: is a long charge too safe?
- The warrior and mage versions need a believable ranged look.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`.
