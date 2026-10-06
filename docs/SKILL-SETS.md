# Skill sets (plan: nothing is built)

The last big feature of version2. **Status: a plan, no code, and no set is designed yet** (the owner will start the four sets' design as a separate step: section 13). Written on `version2` at `90373c2` (dungeons, tiers I-V, the Greyspine and the pendants exist), revised after the owner's answers and extra rules (section 11 says which are answered, which are my readings and which are still my assumptions).

**The kits (six archetypes: risk DPS, safe DPS, grind, support (buff and debuff), healer, tank) and eight themes (a first name, a gender, a kit, the element(s) and a one-line idea; a theme idea such as the stage idol is named only in a theme's description, never as a kit or a role) are planned and drafted in the modular folder `docs/skillkits/`** (start at its `README.md`): an agent working on one kit opens only that kit's file and the one-page rules, not this document.

**Words.** A **signature skill** is a set piece (an active or a passive of a set); the **set** is a character's signature skills plus their outfit; **normal skills** are the shop ones, **boss skills** the 48 dropped by the eight world bosses. Names in code: the feature's stem is `skillsets`, the prefix of every top-level name is `ss` / `SS_` (grep found none in use), the currency's and outfits' prefix is `fit` / `FIT_` / `gem` / `GEM_` (checked: `gem` appears only as ring-icon art and village decor).

## 0. Where to read (so nobody loads more than needed)

| You are working on | Read |
|---|---|
| **One kit** | `docs/skillkits/README.md`, then `RULES.md` and that kit's `kit-<archetype>.md`: **nothing in this file** |
| **A theme, a gender, a first name or an element** | `docs/skillkits/THEMES.md` (one row), and for an element also its row in `docs/skillkits/ELEMENTS.md` (the per-character element design) |
| **A look** | none is drafted yet (only themes and genders are); the first drafts are parked in `docs/skillkits/parked/` |
| The model work for looks (hair, face, eyes, garments, weapon skins) | `docs/skillkits/LOOK-FEATURES.md` |
| The power ladder and its harness | section 5b |
| The combat engine (marks, statuses, taunt, auras, reactions) | sections 6, 6b, the hook table in 10, the milestones in 12 |
| Where a set comes from (drops, difficulty, pity, boss skills) | sections 7, 7b |
| Outfits as a system (wardrobe, gems, rendering, remote players) | sections 8, 9 |
| Loadout rules, counting, the data format | sections 3, 4, 5 |
| Build order and tests | section 12 |
| Decisions and open questions | section 11 |
| Pitfalls | section 14 |

## 1. The brief, and how I read it

| The owner said | Read as |
|---|---|
| A set holds 6 skills (3 active, one for each slot) and 3 passives | **6 pieces: 3 + 3** (confirmed by the owner): 3 actives (slot 1 basic, slot 2 skill, slot 3 burst) + 3 passives. The loadout has exactly 6 places (3 active + 3 passive: `PASSIVE_SLOTS` = 3), which is what makes "3-set / 5-set / 3+3" meaningful. **No new slots are added.** |
| The skills of a set share a theme and synergize, kit included | One **theme** (colours, element, a mark mechanic) per set, written once in the set's data and used by the skills, the passives, the bonuses and the outfit (section 4) |
| Each set comes with an outfit set: all clothes, a weapon skin (new), hair, face / eyes | An outfit = 8 parts: helmet, top, bottom, shoes, hair, face / eyes, and a weapon skin for each of the 3 classes (section 8) |
| 3-set and 5-set bonuses unlock special passives; allows an off-set skill or a 3+3 mix | Count the equipped pieces of each set across the 6 places; >= 3 gives bonus 3, >= 5 gives bonus 5; two sets at 3 each both get bonus 3 (section 5) |
| Slot 1 always bound to the class archetype; slots 2 and 3 sometimes; passives never | `bound:'class'` = three variants (warrior / archer / mage), `bound:'any'` = one skill every class can equip. Slot 1 is always `class`, a passive is never class-bound |
| Mostly one element per set, some special cases; some passives deal damage | Set-level `el`: **one element, or none**; **a hybrid of two for risk DPS, safe DPS and grind only** (a trade-off; blocked for support, healer, tank and mixed sets: decision 44); a piece names one of them (a single-element set may have a special-case piece that says why); **the first grinder is pure basic** (decision 40); passives and bonuses may be triggered effects that deal damage (sections 4, 6) |
| Clear a certain difficulty of an area, +0 gives nothing; the drop is 10% (overworld bosses) / 20% (dungeon) with a pity of 20 / 10 | The set's `needs:{tier}` >= 1, checked against the tier the player fought at (`monTierOf`, dungeons: the run's tier); a roll per qualifying clear with a pity counter (section 7) |
| First boss: slot 1 + a passive; second boss: slot 2 + a passive; dungeon: slot 3 + a passive | Every land already has exactly two bosses and one dungeon: that is **one set per land** (section 7) |
| Outfit parts bought with a new currency exchanged from gold, later p2w but only for outfits | `gems`: coins -> gems one way, spent only on outfit parts, with a hard rule that nothing else can ever take them (section 9) |
| Only a set kit's own marks stack, and they are personal; general statuses never stack and affect everyone; a debuff system inspired by elemental reactions, with direct application for single-element debuffers; general buffs only; taunt; support reaches the caster and the party | Two status layers with opposite rules: personal stacking **marks**, shared non-stacking **statuses** (monsters and party allies), **auras and reactions** with direct application, a taunt for tanks (sections 6 and 6b)
| Damage sets: the pieces +10% without the set effect, the 3-set an additional +15%, the 5-set an additional +25% (**safe DPS is 150% of the baseline**, the basic attack and the boss skills; **risk DPS is 170% on good gameplay**); tank / support / heal **90 / 90 / 90** (flat: their set effects enhance the role, not the damage), a mixed set flexible; **all these numbers are light recommendations, balanced mostly in playtest**; **the grinder farms twice as fast as the alternatives** and is weak on bosses | The **power ladder** with a harness (section 5b)
| Boss skills upgrade with boss materials; a boss kill grants everything | Section 7b (the upgrade is independent and can ship first; a kill grants every boss skill of that boss)
| Signature skills and outfit are tied to a character name and look; equal gender ratio; every skill and outfit usable by any gender | Each set is a **persona** (`char`); no `sex` gate anywhere; outfits authored for both bodies (sections 4, 8) |
| The kit archetypes are risk DPS, safe DPS, grind, support (buff and debuff are one), healer, tank; a theme idea (the idol) is named only in a theme's description, not a role; a set may mix two roles; an element or none per theme, a hybrid of two for DPS and grind roles only (a trade-off), and the first grinder is pure basic; plan the kits and draft the themes, modular; the combat changes first; never copy an IP directly unless the licence makes it legal, and then say so | `docs/skillkits/` (the six kits, the eight themes, the mixed roles); the combat changes first in section 12; the IP rule in section 13

## 2. What exists today (checked in the code)

- **Skills.** `SKILLS` (`shared/classes.js`) rows: `cls`, `slot` (`basic` / `skill` / `burst`), `el`, `cd`, `range`, `mult`, `act`, `anim`, `fx`, `buff`, `drop`. Three slots, loadout `gear.skills = {owned, eq:{cls:{basic,skill,burst}}, lv, pass, pgiven}`. `abilityOf` resolves a slot; `sanitizeSkills` (`server/players.js`) cleans a save; `equipSkillP` / `unequipSkillP` / `upgradeSkillP` (`server/economy.js`). Only the mage may swap its basic (`canSwap`).
- **Data-only skills.** A row with `fx` (ring, cone, beam, chain, proj, zone, dash, buff; statuses stun / slow / burn) needs no server or client code (`resolveFxS`, `statusS` in `server/combat.js`; drawn from the same row by `skill-fx.js`). The 48 boss skills (`drop:'<boss id>'`, 10% a kill, `bossSkillDropP`) are made this way. **This is the engine the sets reuse.**
- **Passives.** 8 placeholder rows (`PASSIVES`: `stat`, `v`, `text`); `passiveSum` / `psP` read them; on `version2` only `PASSIVE_OPEN` = 1 of 3 slots is usable. The branch `origin/passive-slots-24-30` (2 commits, not in version2) replaces that with `PASSIVE_SLOT_LV` = 18 / 24 / 30 and `passiveOpen(level)`; **the owner decided to fold it in** (section 12, M1 step 0, with the two problems a trial merge found).
- **Difficulty.** `gear.zt[land] = {on, max}`; `monTierOf(gear, m)`; a land's second boss (`ZTIER_BOSS`: carapax, kyuubi, vetrmaw, mountaingolem) opens the next tier. A dungeon's difficulty is the same setting (`run.tier`, the leader's, `dgUnlocked`); Wildwood's dungeon is locked at +0 already.
- **Bosses and dungeons by land** (`ZTIER_LANDS`):

  | Land | Boss 1 | Boss 2 | Dungeon (boss) |
  |---|---|---|---|
  | home (Wildwood) | The Rootwarden `boss` (15) | Carapax `carapax` (20) | Hollow Roots (Amanita) |
  | vale | Akaoni `akaoni` (20) | Kyuubi `kyuubi` (25) | Jade Spring Grottoes (Gawataro) |
  | hoar | Ymrik `ymrik` (26) | Vetrmaw `vetrmaw` (30) | Bonefrost Barrow (Haugbui) |
  | grey | Gryphon Queen `gryphonqueen` (29) | Mountain Golem `mountaingolem` (32) | The Blackseam (Garrick) |

- **Where a clear is seen.** A world boss: `rewardKill` calls `bossSkillDropP(q, m.def.id)` once per helper. A dungeon kill never reaches `rewardKill` (`killMonster` returns into `dgKilledS`); a **clear** is `dgWinS` (`server/dungeons/runs.js`), which loops over the members present and already hands out the level-30 piece (`dgGrantItemP`).
- **Look.** `LOOK` (client-owned, passed through unsanitized, 2 KB) + the worn gear -> `effectiveLookOf(look, gear)` (`shared/items.js`, a patch of `hat`, `top`, `bottom`, `shoes` and their colours per armour tier) -> `buildCharacter(L)` (`game/character/model.js`). Weapons: `weaponsOn(rig, weaponId, build)` (`game/combat/weapons.js`), picked by class and tier. Other players: `pubInfo` -> `remoteAdd` / `remoteBuild`, changes by the events `plook` / `pgear`. Hair has 8 styles, the face 3 shapes and an eye *colour* only: **new hair, face and eye features need new code in `buildCharacter`.**
- **Coins.** `gear.coins`. CLAUDE.md section 10 lists "a use for coins at level 30+" as not implemented: the gem exchange is that sink.

## 3. Anatomy of a set

```
set  = 3 actives + 3 passives                         (6 pieces, the unit of "3-set" and "5-set")
piece position 1,2,3 -> slot basic, skill, burst      (an active)    each position also has a passive: P1, P2, P3
variants of an active: bound:'class' -> warrior, archer, mage (3 SKILLS rows)    bound:'any' -> 1 row, cls:'any'
sources: P1 <- boss 1,  P2 <- boss 2,  P3 <- the land's dungeon;  each gives the active of that position + its passive
```

- **Owning a piece = owning all its variants.** Granting position 2 pushes its 3 (or 1) skill ids and its passive id into `gear.skills.owned`. Everything that already works on ids (equip, levels, saves, the panel) keeps working; a piece is just ids that the registry says belong together.
- **Slot 1 replaces the basic attack.** An equipped slot-1 piece takes the `basic` slot; empty means the class default again (`abilityOf` already falls back). `canSwap` opens `basic` to every class that owns a set slot-1 piece.
- **`cls:'any'`** (a universal slot 2 or 3): `abilityOf` and `sanitizeSkills` accept `cls === 'any'`; the loadout stays per class (`eq[cls][slot]`), so the same id may sit in all three. Its `act` animation must be class-neutral (nova, cast, slam: not "slash with a sword"), and every skill keeps its **own** `act` kind (`ACT_SKILL` / `ANIM_OF` need one each).
- **One UI action equips a piece for all three classes** (bound pieces: each class's own variant). Without it, swapping weapon silently drops the set count, since loadouts are per class.
- **A drop, not a guarantee** (the owner's rule): a qualifying clear rolls for the source's **pair** (the position's active with all its variants, and its passive, together); chances and pity are in section 7. A clear below the needed tier rolls nothing and does not count toward the pity. `gear.ss.cl['<set>:<pos>']` remembers the best tier cleared (cheap now; lets later milestones reward higher clears without a migration).
- **Levels.** A piece's `lv` is its boss's base level (15-32); the tier requirement already forces the harder fight. A passive is also limited by the slot it sits in (`passiveOpen(level)`: slots open at 18 / 24 / 30). **Signature pieces are not upgradeable in v1** (the owner will think about an upgrade system later; `gear.ss.cl` is kept so one can be added without a migration). Boss skills **are** upgradeable (7b).

## 4. The data: `defineSkillSet` (one file per set)

Agent-first rules 4 and 5 (`CLAUDE.md` section 5): a set is `shared/skillsets/<id>.js` holding one `defineSkillSet({...})` call and no top-level names, plus a line in `src/manifest.json`. The
registry (`shared/skillsets.js`, loaded after `classes.js` and before `drops.js`) checks the set, **expands it into ordinary `SKILLS` / `PASSIVES` rows**, and leaves a bad set out, `console.warn`s and lists it in `SS_BAD {id, field, why}`; `tools/skillsets-smoke.js` fails naming it.

Shape (every name and value is a placeholder: **no set is designed**, this only fixes the fields):

```js
defineSkillSet({
  id:'<id>', name:'<name>', land:'home'|'vale'|'hoar'|'grey', needs:{tier:1}, el:'<element>'|'basic'|['<a>','<b>' /* a hybrid: only role.main 'risk', 'safe' or 'grind', with no also */],
  role:{main:'risk'|'safe'|'grind'|'support'|'heal'|'tank', focus:'buff'|'debuff'|'both' /* support */, also:{role:'<archetype>', part:'major'|'mild'} /* a mixed set */},
  char:{name:'<first name>', sex:'female'|'male', theme:'<one line>',
         ip:{kind:'original', riffs:'<genre only>'} | {kind:'licensed', work:'', license:'', source:'', credit:''}},   // the set is a character
  pal:{main:0x......, accent:0x......, glow:0x......},            // ONE palette: skill fx, icons, the set card, the outfit
  kit:{mark:'<mark id>', name:'<mark name>', text:'<one line: what slot 1, slot 2, slot 3 do with the mark>'},
  pos:{
    1:{from:{boss:'<boss 1>' /*, chance, pity: optional per-source odds, section 7 */},    bound:'class', skill:{warrior:{...}, archer:{...}, mage:{...}}, passive:{...}},
    2:{from:{boss:'<boss 2>'},    bound:'class'|'any', skill:{...}, passive:{...}},     // 'any': one skill, skill:{any:{...}}
    3:{from:{dungeon:'<theme>'},  bound:'class'|'any', skill:{...}, passive:{...}}},
  bonus:{3:{...passive row...}, 5:{...passive row...}},
  outfit:'<outfit id>'})
```

- A skill entry is a normal `SKILLS` row minus what the registry fills in (`cls`, `slot`, `id`, `lv`, `drop`, `set`, `pos`, a unique `act` kind, `el` from the set unless given, colours from `pal`). Same fields, so `resolveFxS`, the client fx and the icons need nothing special.
- **Validation** (the smoke test and `defineSkillSet`): exactly 3 positions with one passive each; position 1 is `bound:'class'` with all three classes; a passive has no `cls`; `from.boss` is in `BOSS_DEFS` and is of the set's `land`; `from.dungeon` is a `DG_THEMES` id of that land; `needs.tier` is 1..`ZTIER_MAX`; **at most one set for each (land, `needs.tier`)** (the reward rule of section 7 needs it); every `fx` key is known; every `act` kind is unique; **element rule**: a set is **one element or none** (`basic`), and **a hybrid of two is allowed only when `role.main` is `risk`, `safe` or `grind` and there is no `role.also`** (decision 44), and its two elements are not soul opposites (fire / water, earth / air, dark / light: a lint warning, decision 49): a single-element set has at least 4 of its 6 pieces in it (any other says `why`: a lint listing, not a hard fail), a two-element set has each piece in one of the two and at least two pieces in each, and **the first grinder is pure `basic` on every piece** (the owner's one requirement: never an elemental disadvantage); `role.main` is one of the six archetypes (section 5b), `focus` is given for `support`, and only a mixed set has `role.also`; a row's status `v` is within `SS_ST_CAP`; a `cost` is paid by the same row that has the benefit.
- **The persona** (`char`): `name` unique among sets, `sex` `'female'` or `'male'`, a one-line `theme`, and an `ip` entry in one of two forms: **original** (what it riffs on, in genre terms only) or **licensed** (the work, the licence, the source address and the credit line): the rule of section 13. `part` says whether the kit's role is a `major` or a `mild` part of it (5b). `sex` is **only** flavour and a count: no skill, outfit part or loadout rule reads it, so any character can use any set (decision 11). The smoke test prints the gender ratio of the released sets and warns when it drifts from half and half.
- The element matters: a soul of the set's element makes the whole set x1.5 (`soulMult`), the ring adds flat attack for the same soul. A set is an incentive to bind that soul: intended, and a reason to keep the special cases few. An element-less set gets neither the soul bonus nor the wheel's advantage or weakness (`foeMult` returns 1 for `basic`): its versatility is paid for in power, see 5b. In a **two-element** set (risk DPS, safe DPS or grind only; per-character design: `docs/skillkits/ELEMENTS.md`) only the pieces of the soul's element get the x1.5, and its own two elements can react with each other: the owner's trade-off (decision 44), a way for a solo player to react.

## 5. Counting and bonuses

- `ssCount(skills, cls, level)` counts the equipped pieces per set over the class's three active places and the shared passive places **that the level has opened** (`passiveOpen(level)`: the same rule `passiveSum` uses, so a passive in a closed slot counts for nothing, not even for a set). A bonus tier is active at `>= 3` and `>= 5` (5 includes 3; six pieces add nothing more unless the owner wants a 6-set bonus: section 11). Consequence worth knowing: the wearable pieces are 3 actives + the open passive slots (1 from level 18, 2 from 24, 3 from 30), so the 5-set bonus needs level 24 and a full six-piece set level 30; the 3-set bonus can come from three actives alone.
- 3+3: two sets at 3 each, both get bonus 3. 5+1: bonus 3 and 5 of the one set, the sixth place is free ("offset skill").
- A bonus is a **passive row that occupies no slot** (same schema as a passive, section 6). It is computed in `recalcP` and cached as `p.ss` (`recalcP` must now also run when an active is equipped: `equipSkillP` today only sets `p.dirty`), then read by `psP` (a class argument is added: bonuses depend on the current class's loadout, passives do not).
- The panel shows each owned set as a card: the persona's name and one line, six tiles (owned / locked with "Carapax at +I"), the count, both bonuses greyed until active.

### 5b. The power ladder (how strong a signature skill may be)

The owner's rules and numbers. **Baseline = 100**: the same player with maxed boss skills and normal skills and no set. "A damage set" below means the average of the released damage sets at the same piece count. **Every number in this section is a guideline, a light recommendation for a first pass** (the owner): balancing happens mostly in playtests, so the harness reports a sanity band and nobody should spend effort tuning to the point (decision 48).

**The six kits (archetypes)** are the owner's: **risk DPS, safe DPS, grind, support (buffs and debuffs are one archetype), healer, tank**. A *theme* (the stage idol, for instance) is not a kit and is not a role; a set may **mix two kits** (below). The `role` field names the archetype (`risk`, `safe`, `grind`, `support` with a `focus` of `buff`, `debuff` or `both`, `heal`, `tank`).

| Kit | Strength |
|---|---|
| **Safe DPS** | the damage ladder below: **150 at the full set** (the owner: safe DPS is 150% of the baseline); steady, no skill ceiling |
| **Risk DPS** | **170 at the full set on good gameplay** (the owner); the ladder 125 / 142 / 170; typical play equals safe DPS, careless play about 0.8x of that |
| **Grind** | farms at twice the kills per minute of the best alternative; single target about 50% |
| **Support** (buff, debuff or both) | **90 / 90 / 90** (flat; the set bonuses strengthen the role) |
| **Healer** | **90 / 90 / 90**; healing is capped |
| **Tank** | **90 / 90 / 90**; taunt, shield and guard |

**The damage ladder** (safe DPS; risk DPS has its own, below):

| Equipped | Effective power | Where it comes from |
|---|---|---|
| The 3 signature actives, **without any set effect** | about **110** | the pieces' own edge: +10% over the best boss skill L5 of each slot (`SS_EDGE` = 1.10). Signature passives are likewise about 10% better than a normal passive of the same job |
| + the 3-set bonus | about **125** | bonus 3 adds **an additional +15%** (`SS_B3` = 0.15) |
| + the 5-set bonus | about **150** | bonus 5 adds **an additional +25%** (`SS_B5` = 0.25), bonus 3 stays on: **safe DPS is 150% of the baseline** (the owner), the basic attack and the boss skills being the 100 |

- **Reading (decision 20)**: "additional" is cumulative, so **3+3** (two sets' bonus 3, for example one set's actives and another's passives) is about **140** and **5+1** about **150** with a free place for any off-set skill: both are real builds, the full commitment a notch ahead. If you meant the 5-set bonus to be +25% *in place of* the 3-set's +15% (150 becomes 135), it is one constant, but then 3+3 (140) would beat 5+1: say so.
- **Not by a lot**: the pieces alone (110) are a small step so any build stays viable; the bonuses (+15%, +25% more) are the main advantage, as the owner wanted.

**Support, healer and tank** (decision 46): their damage is about **90 at every step** (`SS_ROLE_FLAT` = 90, **flat**): the 3-set and 5-set bonuses of these kits **strengthen the role's own effect** (bigger and longer buffs and debuffs, stronger heals and shields, a tougher taunt) and add no damage. The role's part is **declared** (`part`) and **measured** by the harness (the uplift it gives three other hikers, damage or survival): a declared `major` under +20% is a warning (decision 22). Because their damage is ~90, **every active piece of such a kit also deals damage**: the utility rides on a damaging skill. (A flat 90 is below the baseline's 100: for these kits the 'a signature piece beats a boss skill' check is about the piece as a whole, utility included, not damage alone.)

**Mixed roles** (decisions 39, 47): a set may take **two kits**: `role:{main, also:{role, part}}`. **They are the flexible case**: the damage sits between the support kits' flat 90 and the main DPS kit's ladder, and the designer splits the set bonuses between damage and the second role. Recommendation, not a rule: **a major second role about 100 flat; a mild second role about 120, rising to 135 with the full set** (`SS_MIX_MAJOR` = 100, `SS_MIX_MILD` = 120). **Of the first eight sets one is mixed** (Marigold): safe DPS + a mild support. *If a mixed set ends above its main DPS kit in playtests, lower it (it pays for its second role in damage).*

- **The grinder** (the owner's number, decision 21): it **farms twice as fast as the alternatives** and is **bad for bossing**, so it is *not* held to the flat-90 rule: it has two targets instead. **Farming ratio = 2.0** (accepted 1.8 to 2.2) at every step: kills per minute on **a route of real camps, walking between them at run speed**, against the best alternative (the best damage set at the same piece count, or a non-set maxed build). **Single-target damage about 50%** of a damage set. A camp is **2 to 6 monsters within about 5 m of its centre, camps are 9 to 18 m apart, and each monster respawns 35 s after it dies** (`server/monsters.js`, `combat.js`), so one camp alone cannot beat the respawn: the 2x has to come from **clearing a camp in seconds** (travel then dominates) and from **reaching the neighbouring camp** with a pull. The harness prints the pack and single-target numbers and the **XP and coins an hour** (twice the alternatives: the owner's decision, kept visible on purpose).
- **The risk DPS** ("high effort, high reward"): **170 at the full set on good gameplay** is the owner's number (the ladder 125 / 142 / 170 at 3 actives / 3-set / 5-set, the safe ladder times 1.13). The other two points are my reading: **typical play equals the safe DPS ladder** (110 / 125 / 150) and **careless play is about 0.8x of that** (88 / 100 / 120). The harness runs two bots: *always behind, no damage taken* must reach the good-play ladder, *never behind* about 0.8x of the safe ladder.
- **Element-less and mixed elements** (decision 40): an element-less set (**the first grinder is pure basic**, the owner's one requirement: never an elemental disadvantage) never gets the soul's x1.5 that a matching-element set gets once its owner binds that soul, and has no wheel advantage or weakness: its base numbers carry a compensation (`SS_NOEL_K`, set from the harness; decision 24). A **two-element** set (a hybrid: **risk DPS, safe DPS and grind only**, decisions 44, 49) gets the soul's x1.5 only on the pieces of the soul's element, and **can react with itself** (its own earth hit then its own water hit): the owner's trade-off (not fully using the soul bonus for the option to self-react, which mostly helps a player on their own, so only the roles that fight on their own get it: DPS and grind; support, healer, tank and mixed sets do not); the harness measures that the hybrid ends within the same ladder as a single-element set.
- **Metrics by kit** (what "damage" is measured as): damage kits, damage a second on one target; grind, the farming route above and a single target; tank, damage taken over a fixed fight (and the damage it still deals); support (buff and debuff) and the healer, the damage it deals plus its uplift to three other hikers.
- **`tools/skillsets-ladder.js`** (built on the bot hero of `tools/boss-duel.js`) prints the table for every set at 0, 3, 3+3, 5 and 6 pieces. **`--check` fails only on the owner's orderings**: a signature piece beats a boss skill L5, which beats a normal skill L5 (for the support, healer and tank kits the piece as a whole, utility included); the 5-set total beats the 3-set total, which beats none (for a support, healer or tank the bonus is the role's strength, not damage). **The numbers are a sanity band, reported as warnings, not a verdict** (decision 48): a safe DPS's steps near 110 / 125 / 150, a risk DPS's near 125 / 142 / 170 on its good-play bot, support, healer and tank near 90 flat, a mixed set inside its guideline band, the grinder's farming ratio near 2 (1.5 to 2.5), all within about 25%. Everything else (the grinder's boss damage and the XP an hour, the risk DPS's modes, the declared parts, a mixed set's self-reactions) is reported as a warning too.

## 6. Synergy, statuses and the effect engine (the part that needs new code)

A "kit" must be more than a theme: pieces have to interact. And there are **two kinds of status with opposite rules**, both the owner's design:

| | Set marks | General statuses |
|---|---|---|
| Who owns them | the player who applied them (`by`) | nobody: they belong to the target |
| Stacking | stack up to a cap (`max`) | **never stack**: one value per kind; a second source keeps the stronger, or only refreshes the time when equal |
| Who benefits | only the owner (only the owner's `pop` and `amp` read them) | **everyone** who hits that monster or stands near that buffer: this is what makes support roles |
| Why | otherwise power would add up with the head count and the set count, and balance would be lost | a debuffer or buffer is worth bringing to a party, but two of them are not worth twice; **only a set kit's own marks stack, and they are personal** (the owner's rule) |

1. **Marks** (per monster, per player). `m.mk = {<markId>:{n, t, by}}`. New keys on an `fx` entry, applied where statuses already are (`statusS`): `mark:{id, n, dur, max}` adds stacks. A new `fx` key `pop:{id, k, r, heal}` consumes them: `k x mult` damage per stack (to the target, or in radius `r`), optional heal. A passive `amp:{id, per}` makes the owner's marked targets take more. Everything damages through `damageMonsterS`, so **zone tiers and dungeon scaling (`monK`) stay correct**. Cleared when the monster dies (beside the line that resets `burnT` in `killMonster`).
2. **General statuses on monsters** (shared, no stacking). `m.st = {<kind>:{v, until, by}}`, set by one function (built for `vuln` and `weak` as `rxStatusS`, `server/reactions.js`): no entry -> set; a larger `v` replaces it; an equal `v` only extends `until`; a smaller `v` is ignored. The existing `stunT`, `slowT` and `burnT` already follow this rule (one slot each, whoever applied it); new kinds follow it too and are **read at the one place the number is used**, so every player's damage obeys them: `vuln` (the monster takes +v% damage: `damageMonsterS`), `weak` (it deals -v% damage: `hurtP(p, v, m)`), `taunt` (item 4). A new kind is a row and a read point. A row's `v` is capped (`SS_ST_CAP`) so a debuffer's reach is bounded.
3. **General statuses on allies** (buffs and heals from other players). `p.ally = {<kind>:{v, until, by}}`, the same no-stacking rule, read the way potion buffs are (`p.potb` and `potBuffP` are the precedent, read by `rollDmgS` and `hurtP`): `might` (+damage), `guard` (-damage taken), `haste` (shorter cooldowns), `crit`, `critdmg`, `regen` (health a second) and a `shield` pool: **general ones only** (the owner has no creative buffs); optionally `infuse` (6b.7). **Allies are the caster and the members of their party within `SS_ALLY_R` metres** (`p.party`, `PARTIES`, `pa.mem` in `server/party.js`) **in the same run** (`p.inst`: a buff must not cross between the world and a dungeon); a heal calls `healP` on each (it is self-only today). **The owner confirmed caster + party** (the party is already built for the dungeons).
   - Safety: an ally `guard` is one more factor inside the `Math.max(DMG_TAKEN_MIN, ...)` of `hurtP`, so the 10% floor still holds; damage buffs get their own cap (`SS_ALLY_DMG_CAP`), since `rollDmgS` has none; the worst-case stack check of `tools/rewards-smoke.js` gets the ally buffs added.
   - **Every support piece also works for the caster alone** (a healer heals itself, a buffer buffs itself): a solo player never carries a dead skill; the allies are a bonus.
4. **Taunt** (the tank). A monster targets the **nearest** player (`nearestFighter`; a boss the nearest inside its arena) and there is no threat table, so a tank has nothing to hold today. `taunt` is a general status of its own: `m.taunt = {by, until}`; while it runs `server/monsters.js` keeps `m.tgt` on the taunter (alive and within the leash) and `server/boss.js` points the boss's **melee** at them; its telegraphed moves and marks choose by their own kit rules and are left alone. A boss gets a shorter taunt (`SS_TAUNT_BOSS` x the time), none in a phase change or an enrage (decision 25; the owner approved the taunt). It is the only feature that touches monster AI: `tools/boss-smoke.js` gets a check.
5. **Triggered passives and bonuses.** A row is either `stat` + `v` (today's) or `on` + effect:
   - `on`: `hit`, `crit`, `kill`, `hurt`, `cast1` / `cast2` / `cast3`, `tick` (every N s while fighting), `low` (below x% health).
   - effect: `fx` (the whole `resolveFxS` vocabulary: ring, cone, proj, zone, chain: this is how a passive **deals damage**), `heal`, `buff`, `mark`, `status`, `shield`; plus `chance`, `icd` (seconds, per player and row), `mult`, `el`.
   - **Trade-offs**: a row may carry a `cost:{stat, v}` (less maximum health, more damage taken, longer cooldowns): this is how a squishy, high-reward kit is made. The registry checks benefit against cost and budget (section 5b).
   - One function `ssTriggerS(p, kind, ctx)` in `server/skillsets.js`, called from the hooks of section 10. **Guards**: damage a passive deals never fires `hit` / `crit` triggers again (a depth flag) and every trigger has an `icd`; it returns at once for a player with no triggered rows (no cost for everyone else); a passive's `fx` runs with a synthetic action `{fx, mult, el, range, aim}` like a skill's.
6. **Skill keys for the archetypes**, added only when a set needs one (a few lines each in `resolveFxS` / `damageMonsterS`): `vsBoss` (damage x against bosses: the "bad for bossing" grinder made explicit instead of hoping low numbers do it), `behind` (damage x when hitting from behind: monsters have a facing, `m.face`), `rangeScale` (damage grows with distance: the sniper), `shield` (an absorb pool), `reflect`.
7. **Client**: mark pips and status icons over a monster you fight and on the party frame, as events on a change, never in the snapshot: `mk [monId, markId, n, dur]`, `st [monId, kind, v, dur]`, `ast [pid, kind, v, dur]`; trigger flashes from the existing `fxVisuals`; icons tinted by `pal`. New icons: one glyph per class and kind, tinted, not a hand-drawn SVG for each of ~30 pieces a set.
8. **Not built, on purpose**: marks shared between players; set effects on monsters' elements; anything that changes `hurtP` beyond reflect, shield and `weak`; **cleansing** statuses off players (a player's root / slow / push is still the client-applied `pfx`, and status-cleansing potions are an open item in `docs/NOT-BUILT.md`: a healer's cleanse waits for them).

### 6b. Elemental auras and reactions (the debuff system)

**The detailed plan, and the engine, are in `docs/REACTIONS.md` (built: R0 to R2, the shared data, the server and the client's display; no kit uses it yet); where the two differ, that file wins.** What follows is the summary the plan grew from.

Inspired by the elemental reactions of Genshin Impact, adapted to this game's six elements (fire, water, earth, air, dark, light) and to the fact that **most sets are single-element, debuffers included**, so a debuffer cannot rely on a second element of its own: it gets **direct application** (below). (The mechanic of two elements combining into an effect is a general game idea; the names, chart and numbers here are this game's own.)

1. **Auras.** A direct hit of element E (not `basic`) from any player's skill leaves an **aura** on the monster: `m.aura = {el, until, by}`, one at a time, refreshed by the same element, lasting `SS_AURA_DUR` (first guess 6 s). An aura is **shared** (anyone's hit may react with anyone's aura) and **never stacks**. Only direct hits leave one: burn ticks, reaction effects and a passive's triggered damage do not (a flag at the call), or reactions would chain forever.
2. **Reactions.** A hit of element F on a monster carrying aura E (E != F) **triggers the reaction of the pair**: the aura is consumed, F is not applied (as in the game that inspired it), and the reaction's effect happens. A per-(monster, reaction) internal cooldown `SS_REACT_ICD` (first guess 3 s) stops a ticking zone from firing it every tick. The effect is **general statuses from the shared registry (6.2)**, so a reaction's debuff is shared, never stacks and helps every player: **a party of different single-element sets reacts without anyone planning it**.
3. **One rule makes the whole chart: flavours.** Each element has one flavour, so a player learns six things, not fifteen reactions:

   | Element | Flavour (a general status) |
   |---|---|
   | fire | `burn` (damage over time; the existing burn) |
   | water | `slow` |
   | earth | a short `stun` (as stuns are: not on bosses or heavy enemies) |
   | air | **spread**: the consumed aura is copied onto enemies within `SS_SPREAD_R` (a chain reaction enabler) |
   | dark | `weak` (the monster deals less damage) |
   | light | `vuln` (the monster takes more damage) |

   A reaction between E and F applies **both flavours at `SS_REACT_K` of their direct strength** (first guess 0.7 each). 15 pairs fall out of 6 rows (fire + dark is "burn and weak", water + light is "slow and vuln"): each pair gets a name as data (`defineReaction`), and a pair may override the rule (a first draft: fire + water an amplified burst, dark + light both flavours at full strength). **The chart is a first draft; it will be balanced when built** (decision 32).
4. **Direct application** (the debuffer's way, and any skill's): a skill entry may carry **`flavor:'<element>'`**, which applies that element's flavour **at full strength** (`SS_DIRECT_K` = 1.0) to what it hits, **and** leaves that element's aura like any hit. So a single-element debuffer needs no partner, and a partner of another element still reacts with its aura for two flavours at 0.7 (1.4 in all): **a reaction is worth more than a direct application, so coordination pays**. A skill may also apply any general status directly (`status:{kind, v, dur}`, 6.5).
5. **Guards.** Statuses from a reaction and from a direct application are the same kinds, so they obey 6.2: the stronger wins, the time refreshes, never added; every magnitude is capped (`SS_ST_CAP`) so the incidental reactions of a damage-only party stay well under what a debuffer applies on purpose (which is why a debuffer's role is real). A boss shrugs off the `stun` flavour like any stun. Dungeon monsters (`m.inst`) follow the same rules in their run's context.
6. **Client.** The monster's frame shows its aura (an icon in the element's colour) and a reaction pops its name; events `aura [monId, el, dur]` and `react [monId, pairId]`, only on a change; the statuses are the `st` events of 6.7. A small "reactions" chart in the skills panel (six flavours, the fifteen pairs) is how a player learns it.
7. **Buffs stay general** (the owner has no creative buffs): `might`, `guard`, `haste`, `crit`, `critdmg`, `regen`, `shield` (6.3). One optional extra with a precedent in the code: `infuse` (a buff already makes element-less attacks count as an element for the caster, `buff.el`), here for allies, so a buffer can make an element-less set react. Optional: decision 23.

## 7. Getting a set (sources and difficulty)

**Which set a clear rewards** (the owner's rules): the first release is **4 sets, one for each land, at difficulty +1** (`needs.tier` 1); later zone tiers and zones bring more. A difficulty with no released set of its own **rewards the highest released one**: `ssSetFor(land, tier)` = the set of that land with the greatest `needs.tier <= tier`, or none at +0. Today every clear from +1 to +5 rolls for the land's +1 set; the day a +3 set exists, +1 and +2 still roll the +1 set and +3 to +5 roll the +3 set. No fallback to a lower set: the player lowers the land's tier in a village to farm an earlier one (that is already possible). A player who owns the source's pair has nothing left to roll there.

**The roll** (constants in `shared/skillsets.js`, one place to tune):

| | Chance per qualifying clear | Pity |
|---|---|---|
| World boss (boss 1, boss 2) | `SS_CHANCE_BOSS` = 10% | the 20th qualifying kill without a drop is a sure drop (`SS_PITY_BOSS` = 20) |
| Dungeon | `SS_CHANCE_DUNGEON` = 20% | the 10th qualifying **won run** without a drop is a sure drop (`SS_PITY_DUNGEON` = 10) |

- **A set may override the odds per source** (`from:{boss, chance, pity}`; the table above is the default). This is how the **grinder can be the easiest set to get** (decision 33, 37); every other set uses the defaults unless told otherwise.
- **One roll gives the pair** (the position's active, all its variants, and its passive), as the brief says "first boss gives slot 1 + a passive". Each source is its own roll and its own pity counter (`gear.ss.pity['<set>:<pos>']` = clears since the last drop, reset at a drop, saved, sanitized to 0..pity).
- **A qualifying clear** is a kill (a won run) with `monTierOf(q.gear, m)` (the run's tier) `>=` the set's `needs.tier` of the set `ssSetFor` picked: a +4 kill counts toward the +1 set's pity, a +0 kill counts for nothing.
- **Per player, independent rolls** for everyone who helped (as `bossSkillDropP` already rolls per helper) and for every member present at a dungeon's win: the all-loot rule of the dungeons applies to the clear's item, not to a chance roll, and a shared roll would make one counter serve four people. Two players at different tiers may share a monster, so each is checked at their own tier.
- **World boss**: `ssBossClearP(q, m)` in `rewardKill` beside `bossSkillDropP` (one line). **Dungeon**: `ssDungeonClearP(p, run)` in `dgWinS`'s member loop (a dungeon kill never reaches `rewardKill`); `run.theme.id`, `run.tier` (the leader's; members need it unlocked: `dgUnlocked` already enforced entry).
- **Randomness is injectable**: the roll reads one function (`ssRand`, default `Math.random`) so `tools/skillsets-smoke.js` can force a miss, a hit and the pity without luck (the existing drop code calls `Math.random` directly: a test may also replace it).
- **The natural loop** (nothing new to build): kill boss 2 at +0, which opens +I (`zoneTierKillP`); play the land at +I; farm boss 1, boss 2 and the dungeon at +I or above. Wildwood's dungeon is locked at +0 anyway.
- Feedback: a toast and an event `ssget [pid, setId, pos]` on a grant; every locked tile says what it needs and how far the pity is ("Carapax at +I or above: 10% a kill, 7 of 20 to a sure drop"); the dungeon board could show the same line later.
- **The 48 boss skills**: they stay for their owners and stop dropping at random; they become guaranteed and upgradeable (7b).

### 7b. Boss skills: guaranteed and upgradeable

The owner dropped the idea of higher-tier boss skills (a boss at a higher tier dropping higher-level skills) in favour of signature skills, and decided:

- **Boss skills become upgradeable with boss materials**: levels 1-5 like the normal skills (`skillPower` +12% damage and `skillCdMult` -3% cooldown a level; a buff lasts 0.5 s longer a level). Cost: coins on the usual curve (`UP_COINS[slot] x (n-1)^1.7`) and the boss's **own trophy** (`MATS[bossId]`: all eight exist, e.g. Rootwarden Heart, Tide King's Claw, Queen's Plume; a boss kill already always drops `BOSS_DROPS` = 3 of them, at any tier). First guess for the trophies of level 2 / 3 / 4 / 5: **3 / 5 / 8 / 12** (28 is about 10 kills, which is also the expected number of kills for a 10% signature drop: the same grind pays both). Done at a trainer like every upgrade (`inVillage`). No tier variants of a boss skill.
- **Four guards say "cannot be upgraded yet" and must change**: `upgradeNeeds` (`shared/drops.js`: `s.drop` returns null), `upgradeSkillP` (`server/economy.js`), `sanitizeSkills` (`server/players.js`: a boss skill's level is forced to 1) and the panel's texts (`skInfoHtml`, `game/economy/skills.js`: "It cannot be upgraded yet", "Dropped by ...: 10% per kill"); `tools/skills-smoke.js` tests the refusal and changes with it. A save needs no migration (the `lv` field exists, it was only ignored for boss skills).
- **A boss kill grants everything** (the owner's decision): the first kill of a world boss, for each helper, grants **all six** boss skills of that boss they do not own yet (the skill and burst of every class), so the random 10% roll is gone and nobody grinds luck for them; the signature roll (section 7) is separate, on the same kill. `bossSkillDropP` becomes a grant-all (`BOSS_SKILL_CHANCE` goes). Owners keep what they own; a repeat kill grants nothing new (its 3 trophies still drop and feed the upgrades above). No tier gate: any kill pays, as the old roll did. Dungeon bosses have no boss skills.
- The 8 placeholder passives stay as they are (the owner will define the real ones; each set brings its own passives).
- **The upgrade half is independent of the sets** and can ship first (milestone MB). The grant ships with the sources (M3), because it lives in the same hook.

## 8. Outfits (cosmetic only)

An outfit is a registered cosmetic: `game/outfits/<id>.js` calling `defineOutfit({...})` (same registry rules as sets; a bad one is left out and listed in `FIT_BAD`).

| Part | What it changes | New work |
|---|---|---|
| `head` | `hat`, `hatColor`, `plume`, optional extra mesh (horns, a crown of leaves) | extra-mesh builder |
| `top`, `bottom`, `shoes` | the same fields + colours, optional extra mesh (pauldrons, a skirt of vines, cuffs) | new garment styles in `buildCharacter` where a colour patch is not enough |
| `hair` | `hair` style + `hairColor` | **new styles** (topknot, braids, mohawk, flowing...) in `buildCharacter`, clamped there |
| `face` | face marks (war paint, scars, runes), **eye style** (slit, glowing, ringed), beyond the eye colour | **new look fields**: defaults in `LOOK_M` / `LOOK_F`, clamp and drawing in `buildCharacter`; the outfit is the only way to set them (no editor row) |
| `weapon` x3 | a skin for the sword and shield, the bow and quiver, the wand | `weaponsOn(..., skin)`: an optional builder per class replaces the meshes |

- **Layering**: base `LOOK` -> armour look (`effectiveLookOf`) -> **outfit patch on top** (one hook line, `// skillsets:`). It wins over "Armor: Hide" too (you chose to wear it). It never touches `ITEM`, `recalcP`, `rollDmgS`, `psP`: a smoke test greps the server's combat and stat files for `gear.outfit` and fails if it is read there.
- **Ownership is per part**, bought one by one, mixable across outfits (a wardrobe). **An outfit never needs its set** (the owner's decision): cosmetics are sold on their own.
- **Personas and bodies.** An outfit is the persona's look (`char` of its set): its hair, face marks and eye style are the persona's. **Every part must fit both bodies** and every body slider (`LOOK.sex`, `chest` 0.5-1.6, `height` 0.9-1.1, `build` 0.84-1.24), and **nothing is gated by sex**, even where a combination makes no sense (the owner wants the flexibility): an extra-mesh builder takes the look as its argument, as `buildCharacter` does, instead of assuming a body. The face *shape* stays the player's own (an outfit adds marks and an eye style, it does not change the head), so a player is still recognisable. `tools/outfits-client-smoke.js` builds every part of every outfit on `LOOK_M`, `LOOK_F` and the slider extremes (no throw, within the triangle budget), and `model-preview` close-ups show the owner both bodies.
- **Server-owned, client-drawn**: `gear.outfit = {own:{partId:1}, on:{slot:partId}}`, sanitized (unknown ids dropped, `on` must be owned). The worn ids (<= 10 short strings) go to everyone as an event `pfit [pid, fit]` and in `pubInfo` (`fit`); `remoteBuild` merges them with the other player's gear. The client's own `LOOK` stays the base and is never rewritten by an outfit (taking it off restores the look exactly). `DG_EV_ALL` in `server/dungeons/instances.js` gets `pfit` (a run must still see everyone's look).
- **Try before you buy**: a client-only preview patch applied to your own hiker while the wardrobe is open (the editor camera exists: `cam`).
- **Optional**: "match my set" (the outfit follows the set of your equipped pieces at 3+).
- **Budget**: a character is already the heaviest model in a crowd (the player's rig was 14,000 triangles before the monster rework). Set a triangle budget for an outfit's extra meshes at M5 from a measurement, remember a remote player multiplies it, and build extras the way `weaponsOn` does (merged, vertex-coloured, `matChar`, `smoothN` on curves, **never `scale(-1,1,1)`**).
- Look fields must be clamped inside `buildCharacter` (the server passes `look` through; an outfit patch is trusted data but is clamped the same). `randomLook`'s draw order and the villager pools do not change (new hair styles are outfit-only).

## 9. The currency (gems) and the p2w rules

- `gear.gems` (integer, >= 0, capped, default 0 in old saves), displayed beside the coins. **`gem{n}`**: the server takes `n x GEM_RATE` coins and adds `n` gems (a toast). Sinks and sources are two functions only, `grantGemsP(p, n, why)` and `spendGemsP(p, n, why)`; **`spendGemsP` is called from exactly one place**, `buyOutfitP`. A later payment provider calls `grantGemsP` and nothing else changes.
- **One-way and cosmetic-only is a rule, not a convention**: gems -> coins does not exist; no shop, forge, trainer, tier, stone or skill piece accepts gems; outfit parts have no stat. `tools/outfits-smoke.js` enforces it (it reads `spendGemsP`'s callers and the stat files).
- Price and rate: **to be tuned from measured income, not guessed**: the coins a level-30+ hero earns per hour at tiers I-V are already in `levels-smoke` / `tiers-smoke` data (a tier V Vetrmaw pays about 8 million). Method: a full outfit (8 parts) should cost roughly 10 hours of play at the land's own tier; `GEM_RATE` and the part prices are two constants. A daily exchange cap is optional (useful once gems are sold: it stops the exchange being an exploit both ways).
- Name: the currency's player-facing name is the owner's (`gems` is the internal id).
- The wardrobe panel `#wardrobe` (in `PANELS`, key in `KB_ACTIONS`, a button in the character editor and the HUD) is reachable anywhere, so a cash shop later needs no new place; a tailor NPC in each village is optional flavour (`late:true`, the seeded-rng pitfall).

## 10. Files, hooks and protocol

**New files** (stem `skillsets`, prefix `ss` / `SS_`; outfits `fit` / `FIT_`; every file starts with `//@` and an agent map; `docs/FILES.md` regenerated with `python3 build.py --write-index`):

| Layer | Files |
|---|---|
| shared | `shared/skillsets.js` (registry, `ssCount`, `ssBonuses`, `SS_BAD`), `shared/skillsets/<id>.js` x4, `shared/outfits.js` (registry, `GEM_RATE`, price table, `FIT_BAD`), `shared/outfits/<id>.js` x4 |
| server | `server/skillsets.js` (grants, `p.ss` cache, marks, `ssTriggerS`), `server/outfits.js` (`gem`, `fit` messages, `grantGemsP`, `spendGemsP`, `buyOutfitP`) |
| client | `game/skillsets/panel.js` (the Sets cards in the skills panel), `game/skillsets/marks.js` (pips), `game/outfits/wardrobe.js` (panel, try-on), `game/outfits/apply.js` (the look patch, weapon skins, remote fit), `game/outfits/<id>.js` x4 (extra meshes) |
| styles | `26-skillsets.css`, `27-wardrobe.css` |
| tests | `tools/skillsets-smoke.js`, `tools/outfits-smoke.js`, `tools/skillsets-client-smoke.js`, `tools/outfits-client-smoke.js`; a `--set` mode for `tools/boss-duel.js` |
| docs | this file, `docs/areas/skillsets.md` (the area guide), one short row in CLAUDE.md section 4, `tools/gen-docs.js` extended with a set sheet |

**Hooks into existing files**, each one line marked `// skillsets: <what>` (the table below is the list to check with `grep -rn "// skillsets:" src`):

| Hook | File |
|---|---|
| `canSwap` (slot 1 for classes with a piece), `abilityOf` / `sanitizeSkills` (`cls:'any'`), `passiveSum` (set bonuses, class argument; reads `passiveOpen(level)` after the fold-in) | `shared/classes.js`, `server/players.js` |
| `sanitizeGear` (`gems`, `outfit`, `ss`), `sanitizeSkills` (levels on boss skills: MB), `recalcP` (cache `p.ss`), `pubInfo` (`fit`), `updatePlayersS` (`tick`, expire `p.ally`, ally `regen`), `hurtP` (`hurt`, `weak`, ally `guard`, `shield`) | `server/players.js` |
| `equipSkillP` / `unequipSkillP` (recalc, equip a piece across classes), `upgradeSkillP` (boss skills: MB), `devP` (give a set, add gems) | `server/economy.js` |
| `damageMonsterS` (marks amplify, `vuln`, `vsBoss`, `behind`, `ssAuraS`: auras and reactions, after-hit triggers), `rollDmgS` (ally `might`, `crit`), `statusS` (`mark`, `status`, `flavor`), `resolveFxS` (`pop`, `heal`, `rangeScale`), `rewardKill` (`ssBossClearP`, the guaranteed boss skill, `kill`), `killMonster` (clear marks and `m.st`), `bossSkillDropP` (guaranteed grant: M3) | `server/combat.js` |
| `upgradeNeeds` (boss skills: MB), `abilityCd` (ally `haste`) | `shared/drops.js`, `shared/classes.js` |
| the target line (`taunt`) | `server/monsters.js`, `server/boss.js` |
| `dgWinS` (`ssDungeonClearP`), `DG_EV_ALL` (`pfit`) | `server/dungeons/runs.js`, `instances.js` |
| `receive()`: `gem`, `fit` | `server/api.js` |
| the outfit layer in `effectiveLookOf` | `shared/items.js` |
| `weaponsOn(..., skin)` | `game/combat/weapons.js` |
| `remoteAdd` / `remoteBuild` (fit), events `pfit`, `ssget`, `mk` | `game/net/remote.js`, `game/net/client.js` |
| new look fields (defaults, clamp, drawing), the outfit extras hook | `game/character/model.js` |
| the Sets cards, "equip piece" | `game/economy/skills.js` |
| set icons, the action bar tint | `game/ui/combat-hud.js` (`ICONS`) |
| `#wardrobe` markup, `PANELS`, the editor button, testing buttons | `index.html`, `game/ui/panels.js`, `character-editor.js`, `settings-testing.js` |

**Protocol additions** (to go into CLAUDE.md section 3 when built): client -> server `gem{n}`, `fit{a:'buy'|'on'|'off', id|slot}`; server -> client events `pfit [pid, fit]`, `ssget [pid, setId, pos]`, `mk [monId, markId, n, dur]`, `st [monId, kind, v, dur]`, `ast [pid, kind, v, dur]`, `aura [monId, el, dur]`, `react [monId, pairId]`; `you.gear` carries `gems`, `outfit`, `ss`. Equipping reuses `eqskill` / `unskill` (a piece id is a skill id).

**Saves** (all in `gear`, sanitized, old saves get defaults): `gear.skills.owned` gets the set ids (no new format); `gear.ss` = `{cl:{'<set>:<pos>': bestTier}, pity:{'<set>:<pos>': clears since the last drop}}`; `gear.gems`; `gear.outfit`; boss skills may now carry a level in the existing `gear.skills.lv`. Statuses (`m.st`, `p.ally`, marks) are **not saved**: they are seconds long and live in memory. A set removed or renamed later: its ids are dropped by `sanitizeSkills` (a piece becomes unowned): so **set ids and piece ids are permanent once shipped**.

## 11. Decisions

**Answered by the owner**

1. **3 + 3**: 3 actives + 3 passives, no more slots (section 1).
2. **Four sets to start, one for each of the first four lands, at difficulty +1.** More skills come with more zone tiers and zones. **A difficulty with no released set rewards the highest released one** (section 7). **No set is designed yet.**
3. **The drop is a chance**: 10% for overworld bosses, 20% for a dungeon, **pity 20 / 10** (section 7).
4. **Fold `passive-slots-24-30` in** (section 12, M1 step 0).
5. **Signature pieces are not upgradeable in v1** (an upgrade system is for later). **Boss skills are upgradeable with boss materials** (7b: reviewed, "alright").
6. **Old boss skills stay for their owners and stop dropping at random; a boss kill grants everything**: all of that boss's skills the helper does not own yet, at once (7b).
7. **An outfit can be bought without owning its set.**
8. **Statuses.** Only a set kit's own marks stack, and they are personal. General statuses never stack and affect everyone (section 6). The debuff system is inspired by elemental reactions with **direct application** for single-element debuffers (6b). **Buffs are general ones only** (6.3).
9. **No 6-set bonus**: flexible builds with off-set skills that still get the full bonus (section 5).
10. **Power ladder**: damage sets 110 for the pieces without any set effect, bonus 3 an additional +15%, bonus 5 an additional +25%: **safe DPS 150** at the full set (150% of the baseline, the basic attack and the boss skills), **risk DPS 170 on good gameplay**; tank / support / heal **90 / 90 / 90** (flat: their set effects enhance the role, not the damage), a mixed set flexible (about 100 to 135); **all numbers are light recommendations**, balanced by playtest (decisions 46 to 48); **the grinder farms twice as fast as the alternatives** and is bad for bossing (5b).
11. **A set is a character (a name and a look)**: an equal gender ratio over the sets; every skill and every outfit usable by any character gender, even where the combination makes no sense (sections 4, 8).
12. **IP**: never copy one directly, unless the licence makes it legal; then state it directly (section 13).
13. **The kits** are six archetypes: **risk DPS, safe DPS, grind, support (buff and debuff), healer, tank** (decisions 38, 41, 42), **planned and drafted** in `docs/skillkits/` (each in `kit-<archetype>.md`; the eight themes, with a first name, a gender, a kit and the element(s), in `THEMES.md`; looks not drafted).
14. **Build order: the combat changes first** (section 12: all of M2 before any set content).
15. **Support reaches the caster and their party** (the party is already built for dungeons; 6.3).
16. **Taunt** is approved (6.4).

**My readings of the owner's words (correct any that is wrong)**

17. "pity of 20/10 runs" = **20 for the overworld bosses, 10 for the dungeons**; the Nth qualifying attempt without a drop always drops (it fits: twice the expected 10 and 5 attempts); per source; won dungeon runs only; any clear at or above the set's tier counts.
18. **One roll gives the pair** (the position's active + its passive), per source, per player.
19. "Rewards the highest granted" = the highest released set at or below the cleared difficulty, no fallback to a lower set.
20. **"Additional" is cumulative** (5b): 110, 125 and 150 at 3 actives, 3-set and 5-set; 3+3 about 140.
21. **"Twice as fast" for the grinder** = kills per minute on a route of real camps including walking, against the best alternative at the same piece count (5b); its single-target damage about 50%. This replaces my earlier reading (an average of a pack and a single target making 90%).
22. **A role's part is declared** (`part:'major'|'mild'`) and **checked by measuring** the uplift it gives three other hikers (major from +20%, mild up to +10%). **Only Marigold's secondary role is mild** (decisions 35, 39); every other set is a single kit.
23. "Direct implications" = **direct applications**: a skill applies a flavour (or any general status) without needing a second element (6b.4); optional `infuse` buff (6b.7).
24. "No element kit" = every piece of the grinder **element-less** (no soul bonus, no wheel advantage or weakness), which needs a power compensation (5b); "bad for bossing" comes from the numbers, with an optional `vsBoss` key to make it explicit.
25. A taunt holds a boss's **melee** target for a shorter time, never its telegraphed moves, and not in a phase change or an enrage (6.4); it is ignored by the run's kit-driven monsters (`m.dgOwn`).

**Still my assumptions (not answered; I keep them unless told otherwise)**

26. **Slot 1 set pieces replace the basic attack for every class** (today only the mage swaps).
27. The gem **name, exchange rate, price table and daily cap**; the wardrobe's place (a panel anywhere vs a tailor NPC too).
28. **Optional extras**, not planned unless asked: "match my set" outfits, the persona as an NPC, a set aura effect, a transformation look for the idol theme's burst, upgrades for signature pieces.

**Raised by the fold-in (needs a choice when M1 starts)**

29. **`KeyG` is taken twice**: the branch's second commit makes gathering a rebindable action on `KeyG`, and `version2` already binds `KeyG` to the World map. `kbLoad` keeps saved keys first and leaves a default that is already used **empty**, so with both on `KeyG` whichever action comes later in `KB_ACTIONS` would start unbound for a new player. Pick another default for one of them (no saved binding moves).
30. Passive slots open at levels 18 / 24 / 30, so the most pieces you can wear is 3 actives + 1 passive = 4 below level 24, 5 from level 24 and **6 only from level 30**: the 3-set bonus needs no passive slot at all (three actives of one set), the **5-set bonus is a level-24 thing, a full set a level-30 thing**. That follows from the branch as written; say if the set content should be tuned for it or the levels changed.

**For the owner to choose next**

31. **Which four themes go first and on which land.** With the engine built first, the choice is about design value, not engineering cost: my suggestion (Tansy grind, Torgeir tank, Sazanka risk DPS, Corvin debuff support: two women and two men, disjoint elements, one for each land) is in `docs/skillkits/README.md`.
32. **The reaction chart** (6b): the flavour rule and the first-draft overrides; **built as data** (`src/shared/reactions-chart.js`: first guesses, placeholder names); approve or rework it (plan and numbers: `docs/REACTIONS.md`).

**Added after the third review (the owner's)**

33. **The grinder is the easiest set to get** (it boosts progression): it takes the first land (the lowest-level bosses, the easiest dungeon), and a set may carry its own `chance` and `pity` per source (section 7).
34. **Note: buff the spawn count and the spawn rates** so the grinder is viable: more monsters a camp and more camps, a shorter respawn (section 12, milestone MW; `docs/skillkits/kit-grind.md`; `docs/NOT-BUILT.md`).
35. **One set is mixed** of the first eight, with a mild second role (damage about 120 to 135), Marigold's (safe DPS + support); the rest are single kits: risk and safe DPS (the damage ladder), support, healer and tank (90 flat), grind (2x farming). Its theme idea (a stage idol) is named only in the theme's description.
36. **Themes and genders are planned for the other seven** (first names only), with their kit and element(s): `docs/skillkits/THEMES.md`, one row each so a change costs one row; the look drafts are parked.
37. **Open: friendlier odds for the grinder?** First guess: bosses 15% with a sure drop on the 14th clear, the dungeon 30% on the 7th (one and a half times the chance, 70% of the pity). Or none: the first land alone makes it the easiest.

**Added after the fourth review (the owner's)**

38. **The kit archetypes are six: risk DPS, safe DPS, grind, support, healer, tank** (the owner added the tank: decision 41). A theme idea, such as the idol, is **not a kit and not a role**: it appears only in a theme's description column.
39. **A set may mix two roles**: Marigold's is safe DPS + support, **the only mixed set of the first eight** (`docs/skillkits/kit-mixed.md`).
40. **Elements**: a theme is one element or none; **a hybrid of two is for risk DPS, safe DPS and grind only** (decision 44); **the first grinder is pure basic** (never an elemental disadvantage); a later grinder may be elemental or a hybrid. The element(s) are a column of `THEMES.md`.

**More readings of mine (correct any that is wrong)**

41. **The tank is its own kit** (the owner forgot it from the list of five and added it): archetype `tank`, **90 / 90 / 90**, taunt, shield and guard (`docs/skillkits/kit-tank.md`). It is no longer a flavour of support.
42. **Buff and debuff support are one archetype**, `support` (`focus`: `buff`, `debuff` or `both`), one file `kit-support.md`.
43. **A mixed set's damage is flexible** (the owner: "for mixed you are more flexible"): about 100 flat for a major second role, about 120 rising to 135 for a mild one, a guideline; this replaces my earlier 90% / 120% of the safe ladder, which put a mild mixed set at 180, above both pure DPS kits (decision 47).
44. **A hybrid of two elements is a trade-off, for risk DPS, safe DPS and grind** (the owner: "enable grinders to have dual element, block only for support, tank, heal and role-mixed"): only the pieces of the soul's element get the soul's x1.5, so it never fully uses the soul bonus; in exchange it can react with itself, which mainly helps a player on their own. **Support, healer, tank and mixed sets are one element or none** (`docs/skillkits/THEMES.md`, `ELEMENTS.md`). The first grinder is still pure basic.
45. **The ladder numbers** (the owner): **safe DPS is 150% of the baseline** (the basic attack and the boss skills), **risk DPS 170% on good gameplay**. My reading of the rest of risk DPS: typical play equals the safe DPS ladder, careless play about 0.8x of it (5b).
**Added after the fifth review (the owner's; 46 and 47 are my readings of the words)**

46. **Support, healer and tank are 90 / 90 / 90** (the owner: "for support roles its 90/90/90 as the set effect probably enhancing support"). My reading: an absolute 90 at every step, damage flat, with the 3-set and 5-set bonuses strengthening the role's own effect instead of the damage. If 90% of the safe ladder at each step (99 / 112 / 135) was meant, it is one constant (`SS_ROLE_FLAT`).
47. **Mixed sets are flexible** (the owner): a guideline of about 100 flat (major second role) or 120 to 135 (mild), lowered if playtests show it above its main DPS kit.
48. **All the numbers are light recommendations** (the owner: "those numbers are guidelines for balancing and don't have to be super accurate... balancing will happen more with playtest"): the harness gives a sanity band as warnings and fails only on the owner's orderings (signature beats boss skill beats normal; 5-set beats 3-set beats none); no one tunes to the point.
49. **The elemental design of the eight characters** is `docs/skillkits/ELEMENTS.md` (flavour, which pieces are in which element, the soul to bind, the wheel against the monsters, who reacts with whom). Rules it adds: **a hybrid never pairs soul opposites** (fire / water, earth / air, dark / light: with the soul on one, the other pays x1/1.5; a lint warning) and each passive follows its position's element. The owner's answers to the two flags raised: two light sets (Corvin, Marigold) are fine, the first eight are only the start and later kits use other elements; and water's rough wheel stays (decision 50).
50. **Future monsters balance the elements; the existing roster stays** (the owner: "dont change existing enemy distribution but make a guideline to roughly balance the enemy count on future enemy releases"): new monster kinds go to the elements furthest below the mean, light first (by monsters in the world: water 237, earth 222, air 195, dark 192, fire 153, light 61), within about 25% of the mean as a guideline, not a gate (`docs/areas/monsters-bosses.md`, "Elements of new monsters").
51. **Elemental reactions are planned in their own file and built** (`docs/REACTIONS.md`; the owner: "make a plan for elemental reactions as the debuffer kit depends on it, then implement none of the kits, just the setup code"): the shared data, the server engine and the client's display exist; **no kit uses them yet**. They are **on by default** for every elemental skill (`RX_ON`), because a hybrid's self-reaction and a party of single-element sets reacting need that; one constant switches them off. The debuffer kit will only need data: `flavor` / `status` keys on its entries and the passive stats `rxk` / `rxicd`.

## 12. Build order (each milestone is shippable and tested alone)

**The combat changes come first** (the owner's order): MB, then M0 to M2c, the whole combat engine, with every kit's needs at once, before the sources, the wardrobe or any set content. The first four kits can then be chosen by design value alone.

| | What | Test |
|---|---|---|
| **MB** | **Boss skills upgradeable** (7b), independent of everything below, can ship first: the four guards lifted, the boss-trophy cost, the panel's texts | `skills-smoke` (a boss skill upgrades with coins + its trophy, is refused without them, its level survives a save, `skillPower` applies), `client-smoke` |
| **M0** | **Inert setup**: `shared/skillsets.js` registry + validation (`role`, `part`, `char`, the element rule, the gender-ratio report) + `SS_BAD`, expansion into `SKILLS` / `PASSIVES`; one **dev-only test set** (not obtainable). No gameplay change, like the dungeons' M0 | `skillsets-smoke` (registry, validation, a deliberately bad set is listed, ids unique, `build --check`) |
| **M1** | **Step 0: fold in `passive-slots-24-30`** (below). Then the **loadout rules**: `cls:'any'`, slot 1 for all classes, `p.ss` cache, `ssCount` (passives in open slots only), bonuses of the **stat** kind, the Sets cards and "equip piece" in the skills panel, a testing tool to give a set | `skillsets-smoke` (3 / 5 / 3+3, saves, old save loads), `skills-smoke` (its numbers change with the branch), `keys-smoke`, `client-smoke` |
| **M2a** | **Marks, triggered passives and bonuses, trade-offs, the skill keys** (`vsBoss`, `behind`, `rangeScale`, `shield`, `reflect`), mark pips on the client, a first real kit on the test set; **the ladder harness** `tools/skillsets-ladder.js` (5b) | `skillsets-smoke` (no recursion, `icd`, tiers and dungeons scale, marks die with the monster, costs are paid), `skillsets-ladder --check` |
| **M2b** | **Shared statuses, ally effects, taunt** (6.2 to 6.4): monster statuses `vuln` / `weak` (**built** with the reactions: `docs/REACTIONS.md`), taunt, the general ally buffs and the ally heal | `skillsets-smoke` (a second source never stacks and the stronger wins, both players' hits obey a `vuln`, a buff stays in its party and its run, the `DMG_TAKEN_MIN` floor holds with every guard on, a boss's telegraphs ignore taunt, a run's `m.dgOwn` monsters ignore it), `boss-smoke`, `boss-duel --check` with a healer in the party |
| **M2c** | **BUILT (R0 to R2 of `docs/REACTIONS.md`; the skills panel's chart, R3, is still to do).** **Auras, reactions and direct application** (6b): the flavour table, the chart as data, `flavor`, the aura and reaction events, the chart in the skills panel | `skillsets-smoke` (a direct hit leaves an aura, a burn tick, a reaction and a passive's damage do not; a reaction consumes it and fires once per ICD; two players of different elements react; a reaction and a direct application of the same flavour never add; direct = 1.0, reaction = two flavours at 0.7; air spreads; a boss ignores the stun flavour; a run's monsters behave the same), `client-smoke` |
| **MW** | **World tuning for the grinder** (the owner's note): more monsters a camp and more camps (`per`, `MON_COUNT`), a shorter respawn (`respawnT`), tuned with the farming route and made **before the grinder is tuned**; it affects every player's farming | `server-smoke`, `client-smoke`, `levels-smoke`, `tiers-smoke`, the ladder's farming route |
| **M3** | **Sources**: the boss and dungeon hooks, `ssSetFor`, the 10% / 20% roll with pity 20 / 10, the tier gate, **boss kills granting every boss skill** (7b), toasts, the locked tiles' hints with the pity count, `gear.ss`; the old random boss-skill drops stop | `skillsets-smoke` (with a forced `ssRand`: +0 rolls nothing and counts nothing, a miss counts, the 20th boss kill / 10th won run is sure, a drop resets and owned stops rolling, a +4 clear rolls the +1 set until a +3 set exists, party members each roll alone and at their own tier, a member who cannot follow gets none; the first kill of a boss grants all six of its skills, a second grants nothing new), `dungeon-runs-smoke` |
| **M4** | **Gems and the wardrobe pipe**: `gear.gems`, `gem` / `fit`, `gear.outfit`, `pfit`, the `effectiveLookOf` layer, the panel with one outfit made of **existing look fields only** (colours, existing hats): proves the whole path cheaply, remote players included | `outfits-smoke` (one-way, single sink, no stats), `outfits-client-smoke`, `start-smoke` |
| **M5** | **Outfit technology**: new hair styles, face marks and eye styles, weapon skins, the extra-mesh builders that take the look as an argument, the triangle budget, try-on | `model-preview` (every new field on both bodies, close-ups), `outfits-client-smoke` (every part on `LOOK_M`, `LOOK_F` and the slider extremes) |
| **M6** | **Content: the four sets (one for each land, +1), designed only when the owner starts it**, each from its **theme row in `docs/skillkits/THEMES.md` and its kit file** (the mechanics are drafted; designing a set means the owner approving that draft and turning it into names, numbers and art), with its IP entry approved by the owner and the gender ratio two and two. Vertical slice first: one land's set complete (6 pieces with variants, 2 bonuses, icons, fx, outfit, 8 parts), play it, tune it with the ladder; then the other three, one at a time | all of the above + `gen-docs` set sheet |
| **M7** | **Close-out**: balance pass at tiers I-V, docs (`docs/areas/skillsets.md`, CLAUDE.md rows and protocol, `FILES.md`, `NOT-BUILT.md`), `npm test` green | `npm test` |

MB and M0-M3 are engineering; M4-M5 are engineering plus art; **M6 is where the cost is** (about 30 skill rows and ~10 icons, 2 bonuses, 8 outfit parts and their meshes **for each of the four sets**, and a theme that holds together). M0-M5 need no set content: the dev-only test set carries them, so the engine, the sources and the wardrobe can all be built and tested before a single real set exists.

**M1 step 0: folding in `origin/passive-slots-24-30`** (checked with a trial merge, nothing was changed in the tree). Two commits on top of `main`'s `6ded1b7`: `134641c` passive slots open at levels 18 / 24 / 30 (`PASSIVE_SLOT_LV`, `passiveOpen(level)` replace `PASSIVE_OPEN`; `sanitizeSkills` keeps a passive's slot, `newPlayer` empties slots a level has not opened, `unlockPassivesP(p, was)` toasts each new slot; `passiveSum` reads `passiveOpen`; the skills panel, `balance.js` comments and `tools/skills-smoke.js` follow), and `e0f63a3` gathering gets its own rebindable key. Merged into `version2` it conflicts in **4 files**: `CLAUDE.md` and `docs/NOT-BUILT.md` (text), `src/game/ui/controls-legend.js` (one line of the legend), and `src/server/economy.js` (the testing tool's level setter: keep `version2`'s `PLAYER_MAX_LV` bound **and** the branch's `passiveOpen` unlock line: the branch still says `clampInt(lv,1,50,1)`, from before the soft cap, which would silently undo the level-99 ceiling). Besides the conflicts: `KeyG` is bound twice (decision 29), and the branch predates the soft cap and tiers IV-V, so after the merge run `skills-smoke`, `levels-smoke`, `keys-smoke` and `client-smoke`. Do it as its own commit, before any skill-set code, so the sets' diff stays readable.

## 13. The kits, and the rules for designing a set (nothing is designed)

**The kits are planned and drafted in `docs/skillkits/`**: `README.md` (the index and the cross-kit tables), `RULES.md` (one page of rules), **`THEMES.md`** (the eight themes: a first name, a gender, a kit, the element(s) and a one-line theme, with an alternate: **the only place to change them**), **`ELEMENTS.md`** (how each character uses its element(s)), and one file per kit, **`kit-<archetype>.md`** (risk DPS, safe DPS, grind, support, healer, tank, and `kit-mixed.md` for mixed roles): the mechanics, pieces, bonuses, balance and acceptance of each, **theme-neutral**. **Looks are not drafted**: the owner wants themes and genders first, so that a change costs one row; the first look drafts are parked in `docs/skillkits/parked/`. The files are split so that **an agent works on one kit and opens about 110 lines**. A draft is a blueprint: **a set is a kit plus a theme, element(s), names, numbers and art, and the owner has not approved any.**

What is fixed already about the four sets:

| Land (`ZTIER_LANDS`) | `needs.tier` | Position 1 from | Position 2 from | Position 3 from (dungeon theme) |
|---|---|---|---|---|
| home (Wildwood) | 1 | The Rootwarden (`boss`, level 15) | Carapax (`carapax`, 20) | Hollow Roots (`hollowroots`) |
| vale (Sakura Vale) | 1 | Akaoni (`akaoni`, 20) | Kyuubi (`kyuubi`, 25) | Jade Spring Grottoes (`jadesprings`) |
| hoar (Hoarfrost Reach) | 1 | Ymrik (`ymrik`, 26) | Vetrmaw (`vetrmaw`, 30) | Bonefrost Barrow (`bonefrostbarrow`) |
| grey (Greyspine) | 1 | The Gryphon Queen (`gryphonqueen`, 29) | The Mountain Golem (`mountaingolem`, 32) | The Blackseam (`blackseam`) |

**The rules for every set** (the owner's):

- **A set is a character.** A first name, a gender and a theme (`char`; the look is drafted later): the signature skills are that character's moves, the outfit is that character's look. **Equal gender ratio** over the released sets (the first four: two and two); the smoke test reports it.
- **Any skill and any outfit can be used by any character gender**, even when the combination makes no sense: nothing is gated by sex (sections 4 and 8).
- **Never copy an IP directly.** No existing character, name, catchphrase, signature-move name, costume or transformation sequence that identifies a franchise. **The one exception: a licence that clearly makes it legal** (public domain, CC0, or an open licence that allows adaptation in a commercial game), and then it is **stated directly**: the set's entry names the work, the licence, the source address and the credit line (`char.ip = {kind:'licensed', work, license, source, credit}`), and the game's credits show it. Everything else is `{kind:'original', riffs:'<the genre only>'}`: genres and tropes (idol, magical girl, ninja, sniper, paladin) are free, the names, designs and silhouettes must be original. The registry requires one of the two forms. **I do not give legal advice and cannot verify a licence**: the licence text is quoted in the design entry and **the owner approves before art starts** (M6); when there is any doubt, the answer is "original".
- **One element or none; a hybrid of two for risk DPS, safe DPS and grind only, blocked for support, healer, tank and mixed sets** (each piece takes one of them, never two soul opposites; a trade-off: only the soul's pieces get x1.5, in exchange it can react with itself); **the first grinder is pure basic**; a single-element set's special cases say why. **Strength by role**, on the ladder of 5b.

What a set's designer supplies (the checklist the registry validates, section 4): a name, a persona and a palette; the mark and what the three actives do with it; the 6 pieces (slot 1 in three class variants, slots 2 and 3 as class variants or one universal skill, 3 passives, each with an icon and an `act`); the element of each piece (mostly one, special cases say why); the two bonuses (3 and 5, passive rows, damage allowed, 5 stronger than 3); the outfit (8 parts, both bodies: section 8). The boss and dungeon fights are the **sources**, not the theme: a set's theme is free to differ from its bosses'.

## 14. Risks and pitfalls to remember (from the code)

- **`damageMonsterS` is the one door to a monster's health** (zone tiers): marks, triggers and passive damage must go through it, never write `m.hp`. Damage to a player only through `hurtP(p, v, m)` with the monster.
- Dungeon monsters (`m.inst`) and a run's `S.ctx`: a trigger or a mark inside a run must use the run's context (the burn code does: `S.ctx = m.inst|0`).
- Snapshots and events stay small (4 KB room message): marks and `pfit` are events on change, not snapshot fields.
- Top-level names are global per bundle: `ss` / `SS_` / `fit` / `FIT_` / `gem` / `GEM_` prefixes, no dynamic function names (agent-first rule 7), the registry files declare **no** top-level names.
- Every skill needs its own `act` kind; a `cls:'any'` skill needs a class-neutral animation.
- Old saves: every new `gear` field has a default and a sanitizer; shipped ids are permanent.
- Character work: Phong + `smoothN`, no mirrored geometry, clamp look fields in `buildCharacter`, never change `randomLook`'s draw order, a new hard-coded villager is `late:true`.
- The headless client has no layout: read state, not DOM text (`docs/TESTING.md`). `client-smoke` and the new client smokes run `dist/`: build first.
- `skills-smoke` counts boss skills (the 30 / 48 checks): retiring the drops changes its numbers on purpose; update the test with the change, not around it.
- A drop chance with a pity is the easiest thing here to get subtly wrong: the pity counter must be saved per player and per source, reset **only** on a drop, advance **only** on a qualifying clear, and never advance for a piece already owned. Test it with a forced `ssRand`, not with luck (see M3).
- The pity and the roll are server-side and per player; a client only displays the count it is sent (`you.gear.ss`).
- Balance: a 5-piece set must not break the yardstick (`boss-duel --check`: a maxed level-60 hero against level-80 bosses stands and loses, avoiding half wins). Give every set a **power budget** against that table before tuning individual numbers.
- **Reactions never chain by themselves**: a direct hit leaves an aura, a reaction's own effect, a burn tick and a passive's triggered damage do not; a ticking zone is held by the per-reaction internal cooldown. A test fires all four and counts the auras.
- **Reaction and direct application share the statuses**: the same flavour from both never adds (the stronger wins), and every magnitude is capped; a damage-only party's reactions must stay well under a debuffer's direct values.
- **Shared statuses never add.** A second source of a kind keeps the stronger value and only refreshes the time (`ssStatusS`); a row's `v` is capped; every read is at the one place the number is used (`damageMonsterS`, `hurtP`, `rollDmgS`), never in a skill. A test applies the same status from two players and checks it is not doubled.
- **Taunt is a change to monster AI**: only the melee target of a boss, never its kit's telegraphs or marks, not in a phase change or an enrage, and not on a run's kit-driven monsters (`m.dgOwn`); `boss-smoke` must cover it, and a bot that kites a boss must still be able to win.
- **Healing is bounded**: a greater heal potion already out-heals a level-80 boss through 84% armour (`docs/areas/tiers.md`), so a healer's output and the ally `guard`, `regen` and `shield` get a cap (`SS_HEAL_CAP`, `SS_ALLY_DMG_CAP`) and `boss-duel --check` is rerun with a healer, a tank and a buffer in the party.
- **Ally effects stay inside the party and the run** (`p.party`, `p.inst`): a buff or heal must not cross from the world into a dungeon or reach a non-member.
- **Every outfit part on both bodies and every slider**: an extra mesh must take the look as an argument; test the extremes, not just the default.
- **IP**: a person checks each set's names, moves and silhouettes before art starts (the `ip` entry is required, not verified).
- **Boss skill upgrades touch four guards** (7b): changing one without the others leaves a skill that the panel offers to upgrade and the server refuses.
