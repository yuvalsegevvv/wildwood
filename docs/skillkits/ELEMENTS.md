# Skill kits: the elemental design of the eight characters

> **DRAFT.** Read `RULES.md` first, then only this file. It designs **how each character uses its element(s)**: the flavour it brings, which pieces are in which element, the soul it wants, how the wheel treats it and who it reacts with. **The element column of `THEMES.md` is the source of truth**: change an element there, then that character's row here. Every number is a guideline (`RULES.md` section 2).

## 1. The rules this design uses (from `docs/SKILL-SETS.md` sections 4 and 6b)

- **Flavours** (a hit's aura gives one by reaction at 0.7 strength; a skill with `flavor` gives it directly at 1.0): fire `burn`, water `slow`, earth short `stun` (not on bosses), air **spread** the aura, dark `weak` (the target deals less), light `vuln` (the target takes more). Only the **debuff support** applies its flavour directly; every other kit's hits just leave their aura.
- **Soul** (bound at level 15, `soulMult`): your soul's element x1.5, its opposite x1/1.5 (**fire / water, earth / air, dark / light**), anything else x1. **Wheel** (`foeMult`) against a monster's element: water beats fire beats air beats earth beats water; dark and light beat each other; a hit that beats the monster's element x1.5, one it is beaten by or that shares it x1/1.5.
- **Pieces.** A set has 6 pieces (3 actives + 3 passives); **each passive follows its position's element**. A single-element set has all six (at least four) in its element; a hybrid has each piece in one of its two elements, at least two in each.
- **Hybrid** (two elements): allowed for **risk DPS, safe DPS and grind**; blocked for support, healer, tank and a mixed set. Trade-off: only the soul's pieces get x1.5, in exchange it reacts with itself. **A hybrid never pairs soul opposites** (fire + water, earth + air, dark + light): a soul on one would put x1/1.5 on the other (a lint warning when built).
- The first grinder (Tansy) is **pure basic**; a later grinder may be one element or a hybrid.

## 2. The eight characters

| First name | Kit | Element(s) | Flavour | Pieces (each passive follows its position) | Soul to bind | Why this element |
|---|---|---|---|---|---|---|
| **Tansy** | grind | **none** | none | all six pieces and both bonuses element-less: no aura, no reaction | any (never helped, never hurt) | the owner's requirement: never an elemental disadvantage; it never disturbs a party's auras |
| **Torgeir** | tank | earth | short `stun` | all six earth; P1, P2 and P3 leave the earth aura | earth | a short stun on a held pack fits a shield wall; reactions come from partners |
| **Sazanka** | risk DPS | **dark + air** | `weak` + `spread` | P1 **air**; P2 and P3 **dark**: 2 air pieces (P1 + its passive), 4 dark | dark (the skill and the burst get x1.5) | a fragile melee wants the target to hit softer: air basic then dark skill reacts itself into `weak` + `spread` |
| **Corvin** | support (debuff) | light | `vuln` | all six light; P1, P2 and P3 apply `vuln` directly (small, area, capped) | light | `vuln` is every damage dealer's gain; it hits the dark monsters (15) at x1.5 |
| **Sorrel** | safe DPS | air | `spread` | all six air; P2 leaves the aura that spreads to enemies within 6 m | air | a reaction enabler: one marked target becomes several that carry the aura |
| **Ambrose** | healer | water | `slow` | all six water; P2 and P3 leave the aura | water | the marsh healer; a slowed pack is a kinder fight (see the wheel note) |
| **Dunstan** | support (buff) | fire | `burn` | all six fire; P1 leaves the aura | fire | fire is the rallying element; `burn` comes through reactions, a buffer does not debuff |
| **Nephra** | healer (shields) | earth | short `stun` (the Curse Bites bonus exposes: `vuln`) | all six earth; the blows leave Linen | earth | tomb-dust and the desert's earth; a shield healer is the opposite of Torgeir's taunting tank: she keeps the party alive by shields, not by holding the line |
| **Sabir** | risk DPS | fire | `burn` | all six fire; Smash and Grab and Powder Keg set targets ablaze directly | fire | lamp oil and powder; the finisher's burn adds to a wounded target |
| **Ogden** | grind | water | `slow` | all six water; Open Grave slows what it pulls | water | grave damp and the flooded crypt; a slowed pack is a kinder grind |
| **Ottoline** | support (buff and debuff) | dark | `weak` | all six dark; every blow applies `weak` directly | dark | the perma-twilight; `weak` is dark's flavour, her buffs are the general ally buffs |
| **Marigold** | mixed: safe DPS + support | light | `vuln` | all six light; P1 leaves the aura (no direct `vuln`: that is the debuffer's job) | light | stage light; single-element because a mixed set cannot be a hybrid |
| **Pell** | safe DPS | fire | `burn` | all six fire; Dim the Lamp leaves the aura (`flavor:'fire'`) that spreads to enemies within 6 m, and The Pool Burns sets a circle ablaze | fire | torch fire and tar; a lured target is the one a partner's hit reacts on |
| **Genzo** | tank + healer | air | `spread` (taunted packs hold the aura) | all six air; the blows leave Toll and the pack that holds on him carries the aura | air | the bell's note; a held pack lets a partner's hit react on all of it |
| **Brynja** | risk DPS (hybrid) | water + dark | `slow` | P1 and P3 water (the chill), P2 dark (Glide and Cut through the polar night); only the water pieces get a water soul's x1.5, in exchange her own water then dark hits react with each other | water | ice and snow; a slowed target is easier to keep behind |
| **Tamsin** | grind + tank | earth | short `stun` through reactions | all six earth; rings and fields stagger a crowd | earth | grit and scree; the earth soul adds its x1.5 to every piece |
| **Zahra** | support (buff) + safe DPS | light | `vuln` through reactions | all six light; her hits leave the aura a partner reacts with; she debuffs nothing herself | light | reflected noon; a buffer, never a debuffer |
| **Hollis** | healer + debuff support | dark | `weak` through reactions | all six dark; the blows leave Vigil | dark | the dusk he borrows; a weakened pack is a kinder fight |

## 3. The wheel against the monsters (non-boss monsters in the world by `el`: water 237, earth 222, air 195, dark 192, fire 153, light 61, none 119)

| Element | x1.5 against | x1/1.5 against | Read |
|---|---|---|---|
| earth | water (237) | earth, air (417) | strong against the most common element |
| air | earth (222) | air, fire (348) | solid |
| fire | air (195) | fire, water (390) | rough |
| water | fire (153) | water, earth (459) | **the roughest**: Ambrose pays for it in damage, not in healing |
| light | dark (192) | light (61) | good, and light monsters are rare |
| dark | light (61) | dark (192) | weak by count |

- **A hybrid hedges the wheel**: Sazanka's air hits earth monsters x1.5 and her dark hits are neutral there; her dark hits are fine against air and fire monsters where air is resisted. That is a second advantage on top of the self-reaction; the soul trade-off should keep it fair, and playtests decide (decision 49).
- **Decided by the owner:** the existing monsters stay as they are, water's rough wheel included (a healer's damage is the smaller part of its job). Instead a **guideline for future monster releases** evens the element counts out: give new kinds to the elements furthest below the mean, light first (`docs/areas/monsters-bosses.md`, "Elements of new monsters"). Swapping a character's element is a one-row change in `THEMES.md` plus the row above.

## 4. Who reacts with whom (a reaction = both flavours at 0.7; the names are the placeholders of `src/shared/reactions-chart.js`, the engine is built: `docs/REACTIONS.md`)

| Pair | Result | Note |
|---|---|---|
| Sazanka with herself (air, then dark) | `spread` + `weak` | the hybrid's self-reaction: a solo player's reaction |
| Torgeir (earth) + Sazanka | `stun` + `weak`, or `stun` + `spread` | the tank holds, the rogue's target hits softer |
| Torgeir + Corvin (light) | `stun` + `vuln` | a stunned enemy takes more |
| Sazanka + Corvin | `weak` + `vuln` (a first-draft override: both at full), or `spread` + `vuln` | the strongest debuff pair of the first four |
| Tansy (none) + anyone | no reaction | never starts one, never disturbs one |
| Dunstan (fire) + Ambrose (water) | `burn` + `slow` (a first-draft override: an amplified burst) | second wave |
| Sorrel (air) + Dunstan (fire) | `spread` + `burn` | second wave |
| Corvin + Marigold (both light) | **none**: the same element shares an aura and `vuln` never stacks | accepted by the owner: these are only the first eight, and later kits use other elements |

## 5. Coverage of the first eighteen (version 3 adds Nephra earth, Sabir fire, Ogden water, Ottoline dark, then Pell fire, Genzo air, Brynja water + dark (the one hybrid of the six), Tamsin earth, Zahra light, Hollis dark; Genzo, Tamsin, Zahra and Hollis are mixed sets, so single-element)

Fire 1 (Dunstan), water 1 (Ambrose), earth 1 (Torgeir), air 2 (Sazanka's half, Sorrel), dark 1 (Sazanka's half), light 2 (Corvin, Marigold), none 1 (Tansy). **The first four are disjoint** (none; earth; dark + air; light), so any two of them react when partied.

## 6. How to change something

- **An element:** edit the column in `THEMES.md`, then this character's row, section 3 if it was the only user, and section 4. Keep: a hybrid only on risk DPS, safe DPS or grind, never two soul opposites; the first grinder pure basic; the first four disjoint.
- **A hybrid on another set:** allowed for risk DPS, safe DPS and grind only; pick two elements that are not opposites and split the six pieces (at least two in each).
- **A character's pieces move elements** (for example a special-case piece): a single-element set keeps at least four of six in its element and the piece says why (the registry lint).
