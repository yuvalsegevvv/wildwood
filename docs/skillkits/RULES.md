# Skill kits: the rules (read this first, then only your kit's file)

**Status: DRAFT plan, nothing is built.** A one-page extract for whoever writes or changes a kit. The source of truth for the engine, the sources and the milestones is `docs/SKILL-SETS.md`; **if the two disagree, that file wins and this one is wrong: fix it.** You should not need to open it to work on a kit.

## 1. What a set is

- A set = **3 actives + 3 passives** = 6 pieces, plus a **3-set bonus** and a **5-set bonus** (passive-like rows that fill no slot). The loadout has 6 places (3 active, 3 passive; passive places open at levels 18 / 24 / 30). 3+3 mixes and a 5+1 with an off-set piece are meant to work.
- Positions: **P1** = slot 1 (the basic attack's place), **always class-bound** (a warrior, an archer and a mage version). **P2** = slot 2, **P3** = slot 3 (the burst): each class-bound (three versions) or universal (`any`). **Passives are never class-bound.** Each position comes with one passive.
- Sources (per land, `docs/SKILL-SETS.md` section 2): P1 + its passive from the land's **boss 1**, P2 + its passive from **boss 2**, P3 + its passive from the land's **dungeon**. One roll gives the pair: 10% for a world boss, 20% for a dungeon, a sure drop on the 20th / 10th qualifying clear without one; qualifying = difficulty +1 or above. A boss kill also grants every boss skill of that boss. **The first grinder is meant to be the easiest set to get** (it boosts progression): the first land, and a source may carry friendlier odds (`chance` / `pity`).

## 2. The six kits (archetypes) and how strong each is (baseline = 100: the basic attack and the boss skills, no set)

**These numbers are guidelines, light recommendations for a first pass.** Balancing happens mostly in playtests; the harness gives a sanity band, never a verdict, and nobody should spend effort tuning them to the point.

| Kit (archetype) | What it is | Strength (actives only / 3-set / 5-set) |
|---|---|---|
| **Safe DPS** (`safe`) | steady damage with little risk (range, distance) | **110 / 125 / 150** (150 at the full set: the owner's "safe DPS is 150%"), no skill ceiling |
| **Risk DPS** (`risk`) | close, fragile, high damage, high effort | **170 at the full set on good gameplay** (125 / 142 / 170); typical play equals safe DPS, careless play about 0.8x of that |
| **Grind** (`grind`) | clears camps | **farms at twice the kills per minute** of the best alternative on a route of real camps (walking included); **single target about 50%** |
| **Support** (`support`, focus `buff` / `debuff` / both) | makes the party stronger (buffs) or the enemy weaker (debuffs): **one archetype** | **90 / 90 / 90**: damage stays flat, the set bonuses strengthen the role's own effect |
| **Healer** (`heal`) | keeps the party alive | **90 / 90 / 90**; the set bonuses strengthen the healing and shields (capped) |
| **Tank** (`tank`) | holds the enemy's attention and shields the party | **90 / 90 / 90**; the set bonuses strengthen the taunt, shield and guard |

- The DPS ladder's steps: the 3 signature actives alone about 110, the 3-set bonus an additional +15%, the 5-set bonus an additional +25% (cumulative: 110 / 125 / 150). Every active of a support, healer or tank kit **also deals damage**: the utility rides on a damaging skill. A trade-off (a passive's `cost`) is how a kit pays for strength.
- An element-less set has no soul x1.5 and no wheel advantage, so its numbers carry a compensation (`SS_NOEL_K`, a first guess).

## 3. Mixed roles

A set may mix two kits (`main` + `also`). **Mixed sets are the flexible case**: the damage sits between the support's flat 90 and the main DPS kit's ladder, and the designer splits the set bonuses between damage and the second role. Recommendation, not a rule: **a major second role about 100 flat; a mild second role about 120, rising to 135 with the full set**. If a mixed set ends above its main DPS kit in playtests, lower it. **Of the first eight sets one is mixed** (safe DPS + support, mild). A **theme is not a kit**: a mixed set is two kits, whatever its theme idea (`THEMES.md`); its pieces are in `kit-mixed.md`.

## 4. Elements

A set is **one element or none** (`basic`). **A hybrid of two elements is allowed for risk DPS, safe DPS and grind** (no second role); in a hybrid each piece takes one of the two elements and the two are **not soul opposites** (fire / water, earth / air, dark / light). **A hybrid is a trade-off** (the owner's design): only the pieces of the soul's element get the soul's x1.5, so it never fully uses the soul bonus, in exchange it can react with itself, which mainly helps a player on their own. **Support, healer, tank and mixed sets are one element or none**: they are there for the party, where reactions already come from other players. **The first grinder is pure basic** (never an elemental disadvantage); a later grinder may be one element or a hybrid. How each of the eight uses its element: `ELEMENTS.md`.

## 5. Statuses

- **Marks**: a kit's own, **personal** (only the player who applied them reads them), they **stack** (a cap), cleared when the monster dies. Only kit marks stack.
- **General statuses** are **shared and never stack** (the stronger wins, the time refreshes): on monsters `vuln` (takes more damage), `weak` (deals less), `slow`, `stun` (short; not on bosses), `burn`, `taunt`; on allies the general buffs `might`, `guard`, `haste`, `crit`, `critdmg`, `regen`, `shield` (+ optional `infuse`). Buffs are **general, not creative**. Allies = **the caster and their party** (same run). **Every support piece also works on the caster alone.** A boss's taunt holds its melee only.
- **Auras and reactions** (inspired by elemental reactions, with this game's own chart): a direct hit of an element leaves a shared aura; a hit of another element on it reacts and applies **both elements' flavours** at 0.7 strength. Flavours: fire `burn`, water `slow`, earth short `stun`, air **spread** the aura, dark `weak`, light `vuln`. A skill can apply its element's flavour **directly at full strength** (`flavor`): this is how a single-element debuffer works. Element-less hits leave no aura.
- Skill keys a piece may use (when built): the `fx` vocabulary (`ring`, `cone`, `beam`, `chain`, `proj`, `zone`, `dash`, `buff`), plus `mark`, `pop`, `status`, `flavor`, `vsBoss`, `behind`, `rangeScale`, `shield`, `reflect`; triggered passives `on: hit | crit | kill | hurt | cast1-3 | tick | low` with `chance` and `icd`.
- Healing and ally guards are **capped** (a potion already out-heals a level-80 boss).

## 6. Theme, persona and IP

- A set carries a **theme**: for now only a **first name, a gender, a kit, the element(s) and a one-line theme** are planned (`THEMES.md`, one row each, so a change costs one row). **Equal gender ratio** over the sets (the eight are four and four). **Any skill and any outfit can be used by any character gender**, even where it makes no sense: no rule reads `sex`.
- **Never copy an IP directly.** No existing character, name, catchphrase, signature move, costume or transformation sequence. The one exception is a licence that clearly makes it legal (public domain, CC0, an open licence that allows adaptation in a commercial game), and then it is **stated directly** (work, licence, source, credit). A theme is a genre or a trade; names, designs and silhouettes must be original. Names are **working first names**, searched only against this repository: before art starts a person searches each name with its genre in the outside world and renames on a hit. I cannot give legal advice or verify a licence: the owner approves.

## 7. Looks (the outfit; **not drafted yet**, the first drafts are parked in `parked/`)

- An outfit = **8 parts**: head, top, bottom, shoes, hair, face (marks and an **eye style**), and a **weapon skin for each class**. Parts are bought one by one; an outfit never needs its set. **Every part fits both bodies and every slider**; the face shape stays the player's own. Existing look fields are reused where possible (`parked/` shows how), new features are listed per draft.

## 8. Names and files when built

- One theme = one **id** (its first name, lowercase) used everywhere: `shared/skillsets/<id>.js` (`defineSkillSet`), `game/outfits/<id>.js` (`defineOutfit`), `shared/outfits/<id>.js`. Prefixes `ss` / `SS_`, `fit` / `FIT_`.
- Docs: this folder. **`kit-<archetype>.md`** = one kit's mechanics (theme-neutral: `kit-risk-dps`, `kit-safe-dps`, `kit-grind`, `kit-support` (buff and debuff), `kit-healer`, `kit-tank`; `kit-mixed.md` explains how two kits share one set). **`THEMES.md`** = the themes (one row each); **`ELEMENTS.md`** = how each theme uses its element(s). **Work in one kit's file only**; the cross-kit tables are in `README.md`.

## 9. Life of a kit

`DRAFT` (a `kit-*.md`: the mechanics, no numbers; **the state of all of them now**) -> `DESIGNED` (the owner approved; real names, numbers from the harness) -> `BUILT` (the tests pass). A theme has its own life in `THEMES.md`.
