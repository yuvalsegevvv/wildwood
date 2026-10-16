# Look: Ogden (grinder)

> **Built, not approved** (version 3, the first four of its ten new themes): the kit is in `src/game/outfits/ogden.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Ogden / `ogden` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | grinder, **water**: grave damp and a flooded crypt, a drowned-teal drip on the weapon charm only |
| Theme | a drowned gravedigger who got up to finish the shift |
| Feel | heavy, patient and gloomily cheerful; talks to the dead and apologises to the living |
| Palette | moss `0x6f8f6b`, burgundy `0x6a2c2c`, bone `0xe5e0c8`, mud `0x5a4632`, drowned teal `0x4fd0c0` |
| Silhouette | a slouch: a low flat cap with a weed in it, a long torn waistcoat, ragged breeches over bare green shins, a rope and a tag at the neck |
| Reads as | **a shift that never ended**: mud, moss, a rope, a bell |
| Face shape (suggestion, never forced) | broad, heavy-jawed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `diggercap` | a low flat cap in mud brown with a black band, a black brim, a moss patch and a moth-hole, and a weed with a tiny white flower growing out of the top |
| **Hair** | `rotstraggle` | thin grey hair: a short crown, side locks, a few back locks and five long straggles hanging down the back |
| **Face** | `stitchmarks` (mark), `deadgaze` (eye style) | a long pale scar down the left cheek with dark cross-stitches, a moss-green blotch on the right cheek and dark rings under the eyes; small pale-yellow eyes with thin brows |
| **Top** | `gravevest` | a dirty linen shirt with stains and a torn hole showing green skin and ribs, rotten green arms with rope bindings, a burgundy waistcoat in two front panels and a back panel with a ragged hem and bone buttons, a torn collar, a rope with a toe tag at the neck, shredded sleeve on the left, a mossy shoulder strap on the right |
| **Bottom** | `tornbreeches` | black patched breeches torn off above the knee in a ragged line, green skin below it, a mud-brown belt with a rust buckle, a pouch and two torn cloth tails |
| **Shoes** | `splitboots` | mud-brown boots with a rope top and a rust ring, the right one split at the toe so green toes show, a moss patch, black soles |
| **Weapon** | `gravespade` | one dressing for any weapon: rope-wound grips, rusted metal, dark earth-stained wood, moss accents, mud splotches, a rusted grave bell with a drowned-teal drip |

## Builder notes

All of it is in `src/game/outfits/ogden.js` (see `docs/CHARACTER.md` section 9 for the hooks). About about 14,000 triangles over the base clothes at full detail.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `diggercap` | head | an `ofLoft` flat dome painted with a band, a patch and a hole, a half-disc brim, three thin `sweepTube` stems and a flower. About 3,000 triangles |
| `rotstraggle` | hair | `T.crown`, `T.sideLocks`, `T.backLocks` and five tapered `sweepTube` straggles. About 3,500 triangles |
| `stitchmarks`, `deadgaze` | face mark, eye style | a scar and five stitches, a blotch and eye rings laid with `F.place`; `eyes:{iris:0.78, lash:0.2, browThick:0.8}`. About 300 triangles |
| `gravevest` | top | `paint` (shirt, stains, the rib hole, rotten arms, ropes), `torso()`: three `ofLoft` panels with a displaced hem, buttons, a neck rope, a tag, a torn collar; `shoulder(sd)` shreds; `forearm(sd)` rings. About 5,500 triangles |
| `tornbreeches` | bottom | `paint(thigh)` with an angle-dependent tear line; `hips()`: a belt, a buckle, a pouch, two cloth tails. About 1,200 triangles |
| `splitboots` | shoes | `paint(shin, foot)` and `shin(sd)`: a rope ring, a rust ring, a moss patch and a sole plate. About 800 triangles |
| `gravespade` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Ogden |
|---|---|
| Grip and bindings | rope `0x8a7048` wound grips |
| Metal | rusted iron `0x7d6a58` |
| Wood | earth-dark `0x5a4632` |
| Accent | moss `0x6f8f6b` |
| Trim | mud splotches every 7 cm along blades, limbs, rims and shafts |
| Charm | `gravebell`: a rusted bell on a rope cord with a clapper |
| Glow | a drowned-teal `0x4fd0c0` drip hanging from the clapper (water) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.ogden` in `src/game/outfits/ogden.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`ogden`**: The gravedigger as drawn: big, stooped, long-armed, a heavy jaw.

| Slider | Value |
|---|---|
| `height` (Height) | 1.04 |
| `build` (Build) | 1.1 |
| `chest` (Chest) | 1 |
| `shoulders` (Shoulders) | 1.05 |
| `waist` (Waist) | 1.1 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 0.96 |
| `thighs` (Thighs) | 1.05 |
| `arms` (Arms) | 1.15 |
| `neck` (Neck) | 1 |
| `hands` (Hands) | 1.15 |
| `feet` (Feet) | 1.1 |
| `jaw` (Jaw width) | 1.15 |
| `chin` (Chin) | 1.1 |
| `cheeks` (Cheeks) | 0.85 |
| `noseSize` (Nose) | 1.1 |
| `mouthSize` (Mouth width) | 1.05 |
| `smile` (Expression) | 0 |
| `hairLength` (Hair length) | 0.9 |
| `hairVolume` (Hair volume) | 0.92 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.98 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 1 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.2 | 0.6 .. 1.4 |
| `waist` (Waist) | 0.95 .. 1.15 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1.06 | 0.92 .. 1.14 |
| `arms` (Arms) | 1 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.1 | 0.9 .. 1.25 |

## Body fit

The waistcoat follows `torsoSize`; the arms and shins are painted rot-green on the body surface so they follow every limb slider; the cap covers the straggle item's crown. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the shambling groundskeeper and gravedigger genre (a flat cap, a spade, a toe tag, a torn waistcoat). **Deliberately avoids:** any existing game's or film's zombie character, a named undead, a biohazard or outbreak emblem. A person searches the name "Ogden" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/ogden.js` (`CHAR_MODELS.ogden`, the one reference setup and `OUTFITS.ogden`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit ogden [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only ogden`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/ogden.js`, look `src/game/skillsets/look-ogden.js`. No skill file is touched.
