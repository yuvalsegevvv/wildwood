# Kit: Risk DPS

> **DRAFT.** Read `RULES.md` (one page) first, then only this file. This file is **theme-neutral**: it names no theme and no person (a theme's first name, gender, kit and element(s) are one row in `THEMES.md`). Piece and mark names are cosmetic working names that carry no mechanics. Do not open other kits.

| Field | Draft |
|---|---|
| Archetype | `risk` |
| Role, part | a damage kit with a high skill ceiling: high effort, high reward |
| Element(s) | from the theme: **one element, or a hybrid of two** (risk DPS, safe DPS and grind only; never two soul opposites: the trade-off is that only the pieces of the soul's element get the soul's x1.5, in exchange for being able to react with itself, which mostly helps a solo player); dark (`weak`) fits a fragile kit best, any element works |
| Kit mark | **Barb** (on monsters, personal, stacks to 5) |
| Budget | **170 with the full set on good gameplay** (the ladder 125 / 142 / 170); typical play equals safe DPS (110 / 125 / 150), careless play about 0.8x of that (88 / 100 / 120): the owner's 170 is the only number given, the other two are my reading |
| Needs (milestones) | M2a: marks and `pop`, `behind`, `cost` passives, the two-bot mode of the harness |

## Fantasy

Fast, close, behind the target. The rogue lives in the second after it gets behind an enemy, and pays for it with a thin skin.

## The six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Pinprick** | A quick melee jab, **much stronger from behind**; a hit from behind adds one **Barb** | **Light Feet**: more damage for two seconds after you moved |
| P2 | skill | `any` | **Slip Behind** | A dash that lands behind the target with a strike and a Barb | **Brittle Edge**: more crit damage; **cost: less maximum health** |
| P3 | burst | `any` | **Dusk Flurry** | A three-second flurry on one target that **pops every Barb** for heavy damage | **Quick Study**: more crit chance against targets carrying Barbs |

**Class versions of P1** (all at a very short range, which is a design question for the set): warrior, a twin short-blade flurry; archer, **Point-Blank Snap**, a bow fired from a few metres, strong up close; mage, **Briar Slash**, a short channelled slash.

## Bonuses

- **3, First Cut:** the first hit on a target from behind adds a second Barb.
- **5, Open Season:** a kill or a crit gives back part of P3's cooldown.

## Statuses and reactions

Barb marks (the kit's own; the name is cosmetic). Its hits leave an aura of its element(s): any ally of another element reacts with it. Dark (`weak`) is the best fit, since weakened monsters hit a fragile rogue softer; any element works.

## Balance targets

**Good play: 170 at the full set** (125 / 142 / 170 at 3 actives / 3-set / 5-set). The harness runs two bots (never behind, always behind): the always-behind bot should land near the good-play ladder (a guideline), the never-behind bot about 0.8x of the safe-DPS ladder (120 at the full set), and typical play equals safe DPS (150).

## Acceptance (the smoke test must show)

- "Behind" is a cone of about 120 degrees at the monster's rear (`m.face`); the bonus applies only inside it and never for a monster that is turning to face you at the moment of the hit by more than the grace window.
- Barbs cap at 5, clear when the monster dies, and P3 pops them for damage per stack; the `cost` passive is really paid (less health).
- P2 and P3 are `any` and class-neutral in animation; ids and `act` kinds are unique.

## Watch-outs and open questions

- On a phone (low mode, touch controls) "behind" is hard: decide a forgiving cone or an aim helper.
- An archer or mage at a few metres is odd: are those versions ranged-with-a-penalty or truly short-range?
- Positions arrive 10 times a second; monster facing is smoothed (`faceGoal`): define the grace window.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`, `tools/skillsets-ladder.js`.
