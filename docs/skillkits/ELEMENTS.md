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
| **Marigold** | mixed: safe DPS + support | light | `vuln` | all six light; P1 leaves the aura (no direct `vuln`: that is the debuffer's job) | light | stage light; single-element because a mixed set cannot be a hybrid |

## 3. The wheel against the monsters (by the `el:` of `shared/monster-defs.js`: water 22, earth 18, air 16, dark 15, fire 10, light 6; counts are rough)

| Element | x1.5 against | x1/1.5 against | Read |
|---|---|---|---|
| earth | water (22) | earth, air (34) | strong against the most common element |
| air | earth (18) | air, fire (26) | solid |
| fire | air (16) | fire, water (32) | rough |
| water | fire (10) | water, earth (40) | **the roughest**: Ambrose pays for it in damage, not in healing |
| light | dark (15) | light (6) | good, and light monsters are rare |
| dark | light (6) | dark (15) | weak by count |

- **A hybrid hedges the wheel**: Sazanka's air hits earth monsters x1.5 and her dark hits are neutral there, her dark hits are fine against air and fire monsters where air is resisted. That is a second advantage on top of the self-reaction; the soul trade-off should keep it fair, and playtests decide (decision 49).
- **Two flags for the owner:** water is the roughest wheel (a healer's damage is the smaller part of its job, so it can bear it); dark has few light monsters to beat. Swapping an element is a one-row change in `THEMES.md` plus the row above.

## 4. Who reacts with whom (a reaction = both flavours at 0.7; names come later as data)

| Pair | Result | Note |
|---|---|---|
| Sazanka with herself (air, then dark) | `spread` + `weak` | the hybrid's self-reaction: a solo player's reaction |
| Torgeir (earth) + Sazanka | `stun` + `weak`, or `stun` + `spread` | the tank holds, the rogue's target hits softer |
| Torgeir + Corvin (light) | `stun` + `vuln` | a stunned enemy takes more |
| Sazanka + Corvin | `weak` + `vuln` (a first-draft override: both at full), or `spread` + `vuln` | the strongest debuff pair of the first four |
| Tansy (none) + anyone | no reaction | never starts one, never disturbs one |
| Dunstan (fire) + Ambrose (water) | `burn` + `slow` (a first-draft override: an amplified burst) | second wave |
| Sorrel (air) + Dunstan (fire) | `spread` + `burn` | second wave |
| Corvin + Marigold (both light) | **none**: the same element shares an aura and `vuln` never stacks | **flag:** two light sets in one party add nothing; say if Marigold should move to another element (fire: stage pyrotechnics; air: a singing wind) |

## 5. Coverage of the eight

Fire 1 (Dunstan), water 1 (Ambrose), earth 1 (Torgeir), air 2 (Sazanka's half, Sorrel), dark 1 (Sazanka's half), light 2 (Corvin, Marigold), none 1 (Tansy). **The first four are disjoint** (none; earth; dark + air; light), so any two of them react when partied.

## 6. How to change something

- **An element:** edit the column in `THEMES.md`, then this character's row, section 3 if it was the only user, and section 4. Keep: a hybrid only on risk DPS, safe DPS or grind, never two soul opposites; the first grinder pure basic; the first four disjoint.
- **A hybrid on another set:** allowed for risk DPS, safe DPS and grind only; pick two elements that are not opposites and split the six pieces (at least two in each).
- **A character's pieces move elements** (for example a special-case piece): a single-element set keeps at least four of six in its element and the piece says why (the registry lint).
