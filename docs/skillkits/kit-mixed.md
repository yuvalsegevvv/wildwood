# Kit: Mixed roles (a set that takes two archetypes)

> **DRAFT.** Read `RULES.md` (one page) first, then only this file; for the pieces of each half also open that archetype's `kit-*.md`. This file is **theme-neutral** except for its one example, the idol, which is a **theme idea, not a kit** (its row is in `THEMES.md`). Piece and mark names are cosmetic.

## The rule

- The kits are the six archetypes: **risk DPS, safe DPS, grind, support (buff and debuff), healer, tank**. A **theme** is not a kit. A set may **mix two archetypes**: a `main` and an `also`, declared in the set (`role:{main, also:{role, part}}`).
- **Pieces:** P1 (the class-bound basic) normally comes from the `main`; P2, P3 and the passives may come from either half. Every active still deals damage.
- **Budget (flexible, a guideline):** a mixed set is the flexible case: its damage sits between the support kits' flat 90 and the main DPS kit's ladder, and the designer splits the set bonuses between damage and the second role. Recommendation: **a major second role about 100 flat; a mild second role about 120, rising to 135 with the full set**; the harness measures the uplift to three other hikers to check the declared part (major from +20%, mild up to +10%) and only warns outside a wide band (90 to the main kit's ladder).
- **Of the first eight sets, exactly one is mixed**: Marigold's, whose theme idea is the idol (safe DPS + buff support, a mild part). Every other set is a single archetype.
- **Elements:** a mixed set is **one element or none**: the owner blocked the hybrid of two elements for support, healer, tank and mixed sets (it is for risk DPS, safe DPS and grind). The element need not follow either role.

## The one example: the idol (a theme idea built from two kits)

| Field | Draft |
|---|---|
| Role | `main` **safe DPS**, `also` **support (buff)**, part **mild** |
| Budget | damage about **120**, rising to about **135** with the full set (guideline; the owner: only the idol-themed set is mild, and mixed sets are flexible) |
| Kit mark | **Applause** (on monsters, personal, stacks to 5: lengthens the transformation) |
| Needs (milestones) | M2a: marks; M2b: general ally buffs and the follow zone (exists); M5: a client-only look swap while the burst lasts |

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Spotlight Spark** | (safe DPS half) a ranged sparkle that lights an enemy (small damage), adds an Applause and gives a tiny `regen` pulse to the party | **Crowd Pleaser**: stronger buffs with more allies in your stage |
| P2 | skill | `any` | **Center Stage** | (buff half) a stage zone that **follows you** for about 8 s: allies inside get `might` (or `haste`), you get `regen` | **Encore**: a kill while the stage is up gives back part of this skill's cooldown |
| P3 | burst | `any` | **Curtain Call** | (buff half) the **transformation**: you and your party within a radius get `guard` and `haste` for about 8 s, a light pulse hits the enemies near; Applause lengthens it; your look changes while it lasts | **Stage Fright**: **cost: less maximum health** |

**Class versions of P1:** warrior, **Ribbon Flourish**, a short arc that throws a wave of light; archer, **Harp Shot**; mage, **Lantern Bolt**.

**Bonuses.** 3, **Warm-Up:** the stage also heals a little. 5, **Grand Finale:** the transformation lasts longer and adds `regen`.

## Acceptance (the smoke test must show)

- The damage steps land in the guideline band (about 120 to 135, never far above the main kit's ladder); the declared mild part holds when measured. A warning, not a failure: playtests decide.
- The stage follows the caster and buffs only the caster and party members inside it, in the same run; the transformation look is **client-only** (nothing server-side reads it), is built ahead of the burst (no hitch) and works on both bodies and every slider.
- P2 and P3 are `any`; every active deals damage; the set is single-element (a two-element set is refused for a mixed role).

## Watch-outs and open questions

- **Keep it below the pure DPS kits.** A mixed set that ends above its main DPS kit (150 for safe DPS) in playtests should be lowered: it pays for its second role in damage. The 120 to 135 above is a first guess (decision 47).
- **No hybrid elements here:** a mixed set has one element (`THEMES.md`, `ELEMENTS.md`).
- A mixed set pays for its two roles in the budget (the damage steps above), not in the element.
- IP: the genre (idol, magical girl) is free; **no existing character, mascot, catchphrase or transformation sequence** (`RULES.md` section 6).
- How it could fit the world (a suggestion): a travelling performer with a stage and paper lanterns; the wand is the mage's weapon; the Vale's Shinto references were removed, so no shrine maiden.
- The transformation must work on any body, either gender and every slider, like every outfit; build the transformed model ahead, as `weaponsOn` does.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`, `tools/outfits-client-smoke.js`.
