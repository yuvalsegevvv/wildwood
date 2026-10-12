# Kit: Healer

> **DRAFT.** Read `RULES.md` (one page) first, then only this file. This file is **theme-neutral**: it names no theme and no person (a theme's first name, gender, kit and element(s) are one row in `THEMES.md`). Piece and mark names are cosmetic working names that carry no mechanics. Do not open other kits.

| Field | Draft |
|---|---|
| Archetype | `heal` |
| Role, part | healer, a **major** part |
| Element(s) | from the theme: **one element** (a hybrid of two is not allowed here: it is for risk DPS, safe DPS and grind only); water (`slow`) or light (`vuln`) suit a healer, any element works |
| Kit mark | **Ripple** (on monsters, personal, stacks to 5) |
| Budget | damage about **90, flat** (90 / 90 / 90: the set bonuses strengthen the healing and the shields, not the damage), every active also deals damage; healing is capped |
| Needs (milestones) | M2a: marks and `pop`; M2b: the ally heal, `regen`, `shield`; later: a revive hook in dungeons |

## Fantasy

The healer does not stop the fight to heal. Its blows heal the one who needs it most, and the marks it leaves do the rest.

## The six pieces

| Pos | Slot | Bound | Draft name | What it does (mechanics, no numbers) | Its passive |
|---|---|---|---|---|---|
| P1 | basic | class | **Reed Lash** | A damaging hit that **heals the lowest-health ally in range** (you included) for a share of the damage, and adds a Ripple | **Steady Current**: more healing |
| P2 | skill | `any` | **Ebb and Flow** | Pops the Ripples on enemies within about 10 m: **heals the party** per stack and nicks the enemies; leaves its aura | **Marsh Calm**: `regen` on yourself, always |
| P3 | burst | `any` | **High Water** | A big party heal with `regen` and a `shield` for about 8 s, and a wave that hurts the enemies near | **Waterlogged**: **cost: less damage dealt** |

**Class versions of P1:** warrior, a bell-topped mace swing; archer, **Dew Arrow**; mage, **Drip Bolt**.

## Bonuses

- **3, Overflow:** healing that would overheal becomes a shield.
- **5, Lifeline:** a downed party member in a dungeon is revived faster and comes back with a shield (needs a hook into the run's revive channel, later).

## Statuses and reactions

Ripple marks (the kit's own; the name is cosmetic); ally `regen` and `shield`. Its hits leave an aura of its element(s): partners react with it.

## Balance targets

Damage about 90, flat (major). **Healing is capped** (`SS_HEAL_CAP`): a greater heal potion already out-heals a level-80 boss, so `boss-duel --check` is rerun with a healer, a tank and a buffer in the party.

## Acceptance (the smoke test must show)

- A heal reaches only the caster and their party members in the same run; a solo player heals only themself.
- The cap holds with every guard on; the damage-taken floor holds; Ripple is capped and clears on death.
- Every active deals damage; P2 and P3 are `any`.

## Watch-outs and open questions

- There is no cleansing of players' root, slow or push (they are client-applied): a cleanse waits for the status-cleansing potions in `docs/NOT-BUILT.md`.
- The revive bonus is a dungeon-only hook: keep it optional until the run code is open.

## Files when built

`shared/skillsets/<id>.js`, `shared/outfits/<id>.js`, `game/outfits/<id>.js` (the id is the theme's first name in lowercase, `THEMES.md`); tests `tools/skillsets-smoke.js`, `tools/boss-duel.js --check`.
