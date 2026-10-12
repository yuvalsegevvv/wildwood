# Kit: Tank

> **DRAFT.** Read `RULES.md` (one page) first, then only this file. This file is **theme-neutral**: it names no theme and no person (a theme's first name, gender, kit and element(s) are one row in `THEMES.md`). Piece and mark names are cosmetic working names that carry no mechanics. Do not open other kits.

| Field | Draft |
|---|---|
| Archetype | `tank` (the owner forgot it in the first list; it is its own kit) |
| Role, part | tank, a **major** part |
| Element(s) | from the theme: **one element** (a hybrid of two is not allowed here: it is for risk DPS, safe DPS and grind only); earth (a short `stun`) or water (`slow`) help hold enemies, any element works |
| Kit mark | **Fixation** (on monsters, personal, stacks to 5) |
| Budget | damage about **90, flat** (90 / 90 / 90: the set bonuses strengthen the taunt, the shield and the guard, not the damage) |
| Needs (milestones) | M2a: marks, `hurt` trigger, `reflect`, `shield`; M2b: **taunt**, ally `guard` and `shield` |

## Fantasy

The tank stands where the enemy has to hit it. It does not out-damage anyone; it decides *who* gets hit, and makes the hits count for less.

## The six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Anchor Strike** | A damaging hit that **taunts** the target for a short time and adds one **Fixation** | **Thick Hide**: less damage taken while you have a taunted enemy |
| P2 | skill | `any` | **Brace** | A self shield that grows with the Fixation on enemies near you, and a wide short taunt; adds `guard` | **Iron Return**: a share of the damage you take is reflected (a `hurt` trigger, with an `icd`) |
| P3 | burst | `any` | **Hold the Line** | A big taunt (a boss's melee only) and a `guard` plus a `shield` for you **and your party** for about 8 s; spends all Fixation for extra shield | **Heavy Plate**: more maximum health; **cost: less damage dealt** |

**Class versions of P1:** warrior, a shield bash; archer, **Pinning Shot**, a taunting shot at a short range (about 20 m); mage, **Ward Bolt**, a taunting bolt that leaves a small ward on you.

## Bonuses

- **3, First Contact:** the first taunt of a fight also gives a shield.
- **5, Shattering Return:** when a shield breaks or runs out full, a burst of its element with a knockback around you.

## Statuses and reactions

Applies **taunt** (general status). Its hits leave an aura of its element(s): an ally of another element reacts with it (the flavour of earth is a short stun, of water a slow; not on bosses). Benefits from a debuffer's `weak` on what it holds.

## Balance targets

Damage about 90, flat (major); measured by **damage taken over a fixed fight** against a non-set build (the part is "major" only if the party's survival rises by 20% or more) and by what it still deals. The 10% damage-taken floor holds with every guard on.

## Acceptance (the smoke test must show)

- A taunted normal monster keeps `m.tgt` on the tank for the duration and ignores a nearer player; a boss's **melee** follows, its telegraphed moves and marks do not; not in a phase change or an enrage; **a run's kit-driven monsters (`m.dgOwn`) ignore it**.
- Shield and `guard` caps hold; with a healer and a buffer in the party `boss-duel --check` still passes.
- Every active deals damage; P2 and P3 are `any`; Fixation is capped and cleared when the monster dies.

## Watch-outs and open questions

- Each class needs a believable way to taunt (a pinning shot, a ward bolt): confirm the three P1 versions read as a tank.
- In escort and siege missions the kit's own targeting rules may matter more than taunt.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`, `tools/boss-smoke.js`.
