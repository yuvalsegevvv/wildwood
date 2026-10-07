# Skill kits: index (draft plan, nothing is built)

**Six kits** (archetypes: risk DPS, safe DPS, grind, support (buff and debuff are one archetype), healer, tank) and **eight themes** (a first name, a gender, a kit, the element(s) and a one-line idea). A **theme is not a kit**: a theme idea (the stage idol, for example) is named only in a theme's description, never as a kit or a role. An agent works on **one kit file** (about 55 lines) plus `RULES.md` (about 60) and opens nothing else.

## What to open

| You are working on | Open (and nothing else) |
|---|---|
| **One kit's mechanics** (its pieces, bonuses, balance) | `RULES.md`, then `kit-<archetype>.md` |
| **Turning one kit into code** (a set is one data file) | `AUTHORING.md` (what a piece may use, the file, the checks, how to test it) |
| **A theme, a gender, a first name or an element** | `THEMES.md` (one row), and for an element also that character's row in `ELEMENTS.md` |
| **How a character uses its element** (flavour, which pieces, the soul, the wheel, who it reacts with) | `RULES.md`, then `ELEMENTS.md` |
| **A mixed-role set** (two kits in one set) | `RULES.md`, `kit-mixed.md`, and the two kits' files |
| **A look** (an outfit) | none is drafted: write one fresh from the approved theme (`parked/` holds the first drafts as raw material and the model-feature list they needed) |
| **The combat engine** (marks, statuses, taunt, auras and reactions) | `docs/SKILL-SETS.md` sections 6, 6b, 10, 12 |
| **Where a set comes from** (drops, difficulty, pity, boss skills) | `docs/SKILL-SETS.md` sections 7, 7b |
| **The power ladder and its harness** | `docs/SKILL-SETS.md` section 5b |
| **Outfits as a system** (wardrobe, gems, rendering, remote players) | `docs/SKILL-SETS.md` sections 8, 9 |

Every kit file starts with a blockquote saying what to read first. **If a kit file and `RULES.md` disagree, `RULES.md` wins; if it and `docs/SKILL-SETS.md` disagree, that wins.**

## The six kits

| File | Kit | Strength (baseline 100: basic attack + boss skills) | Engine it needs |
|---|---|---|---|
| `kit-safe-dps.md` | **Safe DPS**: steady damage, little risk | damage ladder 110 / 125 / **150** | M2a: marks, `rangeScale` |
| `kit-risk-dps.md` | **Risk DPS**: close, fragile, high damage, high effort | **170 on good play** (125 / 142 / 170); typical play = safe DPS, careless ~0.8x | M2a: marks and `pop`, `behind`, `cost` passives |
| `kit-grind.md` | **Grind**: clears camps; **the first grinder is pure basic and the easiest set to get** | **farms 2x** the best alternative, single target ~50% | M2a: `on:kill` triggers, `vsBoss`; the world's spawn counts and rates |
| `kit-support.md` | **Support**: buffs, debuffs or both (one archetype) | **90 / 90 / 90** (flat; the set bonuses strengthen the role) | M2b: ally buffs / monster statuses; M2c: auras and `flavor` |
| `kit-healer.md` | **Healer** | **90 / 90 / 90**; healing is capped | M2b: the ally heal, `regen`, `shield` |
| `kit-tank.md` | **Tank**: taunt, shield, guard | **90 / 90 / 90** | M2b: taunt, `shield`, `guard` |
| `kit-mixed.md` | **Mixed roles** (how two kits share one set; one of the first eight is mixed) | flexible: between 90 and the main kit's ladder (a guideline: major about 100, mild about 120 to 135) | both halves' needs |

## The eight themes

Details (gender, element(s), the theme line, an alternate) are **one row each in `THEMES.md`**; this table only maps them to the kits and to my suggestions for land and wave.

| First name | Kit | Land (suggestion) | Wave |
|---|---|---|---|
| Tansy | grind (the first grinder, pure basic) | Wildwood: the first land, so it is the easiest to get | first |
| Torgeir | tank | Hoarfrost Reach | first |
| Sazanka | risk DPS (a hybrid, dark + air) | Sakura Vale | first |
| Corvin | support (debuff) | The Greyspine | first |
| Sorrel | safe DPS | not assigned | second |
| Ambrose | healer | not assigned | second |
| Dunstan | support (buff) | not assigned | second |
| Marigold | **mixed**: safe DPS + support (mild); its description names the theme idea | not assigned | second |

- **Wave** and **land** are my suggestions (the choice is the owner's, `docs/SKILL-SETS.md` decision 31). "First" = the recommended first four, one for each land at difficulty +1; "second" = the sets for the next zones and tiers.
- **Gender ratio: four and four**, two and two in the first four. **Elements:** one or none; **a hybrid of two for risk DPS, safe DPS and grind only** (a trade-off: only the soul's pieces get x1.5, in exchange it can react with itself; never two soul opposites; blocked for support, healer, tank and mixed sets; the design of each: `ELEMENTS.md`); **the first grinder is pure basic**; the first four use disjoint element sets, so any two react when partied.
- **The first grinder is the easiest set to get** (it boosts progression): the first land, and optionally friendlier odds; and **the world's spawn counts and rates need a buff** to make the build viable (a note in `kit-grind.md`, and in `docs/NOT-BUILT.md`).

## The combat engine the kits need, in build order

The owner's order: **the combat changes first**, all of them, before any set content (`docs/SKILL-SETS.md` section 12).

| Milestone | Feature | State |
|---|---|---|
| MB | boss skills upgradeable with boss materials | not built (independent of the sets) |
| M0, M1 | the registry, `cls:'any'`, slot 1 for every class, counting, the 3- / 5-set bonuses, the passive slots at 18 / 24 / 30 | **built** |
| M2a | marks, `pop`, `amp`; triggers (`hit` `crit` `kill` `hurt` `cast1-3` `tick` `low`); trade-offs (`cost`); `vsBoss`, `behind`, `rangeScale`, `reflect`; the ladder harness | **built** |
| M2b | monster statuses `vuln` / `weak`; taunt; ally buffs, the party heal, shields | **built** |
| M2c | auras, reactions (flavours), direct application (`flavor`) | **built** (`docs/REACTIONS.md`); the chart in the skills panel and `infuse` are not |
| (world) | **more monsters a camp and a shorter respawn**, tuned with the farming route | not built (the grinder's note) |
| M3 | where a set comes from: the boss and dungeon drops, their pity | not built (until then a set is only given by `dev set`) |
| M4, M5 | gems, the wardrobe, the look features and weapon skins | not built |

Everything a kit needs from the engine is in the built rows: `AUTHORING.md` lists what a piece may use.

## What the kits give each other

| Combination | What happens |
|---|---|
| Debuff support + any damage kit | `vuln` raises everyone's damage; the debuffer's aura lets the others react |
| Two sets with different elements | a reaction without planning (two flavours at 0.7 each); a **hybrid set (DPS or grind) can react with itself** (a solo player's way to react) |
| Tank + risk DPS | the boss's melee stays on the tank, so "behind" is easy |
| Healer + tank | shield, `guard` and `regen`, held in check by the damage floor and the heal cap |
| Buff support + a crit-heavy DPS | `crit` and `critdmg` buffs feed the kits that live on crits |
| Grind + debuff support | the grinder gathers the pack, the debuffer's area `vuln` covers all of it |

## The first four (a suggestion; the choice is the owner's)

**Tansy (grind), Torgeir (tank), Sazanka (risk DPS), Corvin (support, debuff)**: one of each pillar, two women and two men, **disjoint elements** (none; earth; dark + air; light), one for each land. The grinder goes to the first land because it should be easiest to get. The safe DPS, the healer, the buffer and the mixed set follow with the next zones and tiers.

## Open questions

- **All the numbers are light recommendations** (the owner): balancing by playtest, so none of the open items below blocks building.
- **Support, healer and tank at a flat 90 / 90 / 90:** my reading is an absolute 90 at every step (the owner: "90/90/90 as the set effect probably enhancing support"). If 90% of the safe ladder at each step (99 / 112 / 135) was meant, it is one constant.
- **Risk DPS:** only the 170 is the owner's number; "typical play equals safe DPS" and "careless about 0.8x" are my reading.
- The reaction chart (a first draft in `docs/SKILL-SETS.md` 6b): the flavours, the strengths (0.7 / 1.0), the per-reaction cooldown.
- The grinder: friendlier odds (decision 37), the farming route, what counts as "the best alternative", and **how much to buff the spawns**.
- Risk and safe DPS: how do the archer and mage versions work at a very short or a very long range?
- Should `infuse` exist, and give the soul bonus? Which theme goes to which land, and the second wave's lands?

## How to add a kit or a theme

A **theme**: add a row to `THEMES.md` (and a line to the table above). A **kit**: copy a `kit-*.md` (fields table, fantasy, six pieces, class versions, bonuses, statuses, balance, acceptance, watch-outs, files), keep it **theme-neutral**, and add it to the table above. Keep each file around 60 lines and **self-contained given `RULES.md`**.
