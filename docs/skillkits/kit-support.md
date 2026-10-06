# Kit: Support (buff and debuff are one kit)

> **DRAFT.** Read `RULES.md` (one page) first, then only this file. This file is **theme-neutral**: it names no theme and no person (a theme's first name, gender, kit and element(s) are one row in `THEMES.md`). Piece and mark names are cosmetic working names that carry no mechanics. Do not open other kits.

| Field | Draft |
|---|---|
| Archetype | `support`, focus `buff`, `debuff`, or both (the owner: buff and debuff support are the same archetype) |
| Role, part | support, a **major** part |
| Element(s) | from the theme: **one element** (a hybrid of two is not allowed here: it is for risk DPS, safe DPS and grind only). A **debuff** support's debuffs are the flavour of its element: the debuff draft below is written for light (`vuln`, everyone hits harder); for dark read `weak` (monsters hit softer); fire, water and earth give a burn, a slow and a short stun. A buff support works with any element |
| Kit marks | **Fervor** (buff focus) and **Glare** (debuff focus): on monsters, personal, stack, cosmetic names |
| Budget | damage about **90, flat** (90 / 90 / 90: the set bonuses strengthen the buffs and debuffs, not the damage); its worth is the party uplift (measured with three damage bots, major from +20%; a guideline) |
| Needs (milestones) | M2a: marks and `pop`; M2b: the general ally buffs and their caps, monster statuses `vuln` / `weak`; M2c: auras, reactions, `flavor` (direct application), optional `infuse` |

## Fantasy

Support makes the party better by making the people around it stronger (buffs) or the enemies easier to hit (debuffs). It is not strong itself; everyone near it is. A set picks a focus, or both.

## The buff focus: the six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Rallying Strike** | A damaging hit that adds a Fervor and refreshes a small, short `haste` on the party near you (never on the skill that gives it) | **Loud Voice**: your buffs last longer |
| P2 | skill | `any` | **Cry of Valor** | A party `might` for about 10 s, **stronger with the Fervor it spends** (a cap) | **Warm Hearth**: `regen` for you and allies near you |
| P3 | burst | `any` | **Banner Down** | Plants a banner for about 8 s: allies inside get `crit` and `critdmg` together, and `regen` | **Hoarse**: **cost: longer cooldowns** |

Class versions of P1: warrior, a banner-pole swing; archer, **Signal Arrow**; mage, **Beacon Bolt**. Bonuses: **3, Rousing:** you get the buffs you give at a bonus. **5, Blaze of Glory:** Banner Down gives a third kind of buff, `haste`.

## The debuff focus: the six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Flash Lens** | A damaging hit that leaves its aura and applies **its element's flavour directly** (written for light: a small, short `vuln`); adds one Glare | **Long Wick**: its debuffs last longer |
| P2 | skill | `any` | **Open the Shutter** | The same in an area of about 7 m: a stronger `vuln` for about 6 s, and a Glare on each | **Reflector**: reactions on its auras have a shorter cooldown |
| P3 | burst | `any` | **Noon** | Every enemy in a large radius takes a big `vuln` (capped) for about 8 s, and a light pulse | **Dazzled**: **cost: less crit chance** (a support, not a fighter) |

Class versions of P1: warrior, a lantern-shield bash that flashes; archer, **Glint Arrow**; mage, **Spark Lens**. Bonuses: **3, Second Look:** reactions on a target it exposed are stronger. **5, Afterglow:** when an exposed target dies its debuffs spread to enemies within 6 m.

## Statuses and reactions

- **Buffs** are the general ally buffs only (`might`, `crit`, `critdmg`, `regen`, `haste`, `guard`, `shield`) and **never stack** (the stronger wins): two buff supports give nothing unless they give *different* kinds. Optional `infuse` (an ally's element-less attacks count as an element) would let one make a grinder react.
- **Debuffs** are the showcase of the reaction system: its aura means any ally of another element triggers a reaction on it (two flavours at 0.7 each, 1.4 in all), and its own flavour works **without** a partner (one flavour at 1.0). A reaction and a direct application of the same flavour never add: the stronger wins.

## Balance targets

Damage about 90, flat (major): the harness checks that the uplift to three other hikers is at least +20% (damage and survival). Damage buffs have their own cap (`SS_ALLY_DMG_CAP`) and multiply with potions (`p.potb`); a `vuln` multiplies everyone's damage, so it is capped (`SS_ST_CAP`); a party of damage kits with a support must stay inside the ladder. A set with both focuses must not be the sum of both budgets.

## Acceptance (the smoke test must show)

- A buff reaches only the caster and the party in the same run; it expires; the stronger of two sources wins and never adds; `haste` does not shorten the skill that gives it. Fervor caps at 5, clears on death, and raises the next `might` up to its cap.
- The direct `vuln` applies at 1.0 and a reaction at two flavours of 0.7; a second debuffer's `vuln` does not stack; both players' hits obey it. Glare stacks to 3, clears on death, and raises only its owner's direct `vuln`. A boss ignores a `stun` flavour but takes `vuln`.
- Every active deals damage; P2 and P3 are `any`.

## Watch-outs and open questions

- Should `infuse` exist at all, and give the soul bonus?
- Two debuff supports must not double: the kit is a reason to bring *one*. Solo, a support is a ~90-damage kit: confirm that is playable.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`, `tools/skillsets-ladder.js`.
