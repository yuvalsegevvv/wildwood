# Look: Tamsin (grind)

> **Built, not approved** (version 3, the second six of its new themes): the kit is in `src/game/outfits/tamsin.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Tamsin / `tamsin` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | grind, **earth**: grit and dust, a pale dust glow on the charm only |
| Theme | a quarry-hand who breaks a whole slope at once: a sledge, a rope, a heap of loosened scree |
| Feel | blunt, cheerful and covered in dust; whistles while the rock falls |
| Palette | granite `0x8a8f96`, dust `0xd2b48a`, rope `0x9a7a4a`, ochre `0xc2823a`, canvas `0x6a5a44` |
| Silhouette | a wrapped head with a knot, strong bare arms, a rope harness across the chest, thick knees over heavy boots |
| Reads as | **a slope coming down**: granite, rope and ochre |
| Face shape (suggestion, never forced) | round, strong-jawed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `dustwrap` | an ochre scarf wound over the crown with dust bands, a knot at the back and two short tails |
| **Hair** | `pinnedbraids` | two braids pinned up into the wrap, a few loose temple strands |
| **Face** | `dustsmudge` (mark), `grittygaze` (eye style) | dust smears on the cheeks; steady green eyes under strong brows |
| **Top** | `ropeharness` | a sleeveless granite shirt with dust streaks, ochre arm wraps, two crossed rope straps with a steel ring, a belt with a tool pouch |
| **Bottom** | `kneepatch` | heavy canvas trousers with seam lines, granite knee patches and a dark band at the thigh |
| **Shoes** | `steeltoes` | dark boots with an ochre band, a steel toe cap and a dark sole |
| **Weapon** | `sledgerig` | one dressing for any weapon: rope grips with dark bands, granite metal, dark wood, ochre accents and stripes, a pebble-and-chisel charm with a pale spark |

## Builder notes

All of it is in `src/game/outfits/tamsin.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 0 triangles to 20,000 over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `dustwrap` | head | an `ofLoft` dome with wrap paint, a ring band, a knot sphere and two `ofRibbon` tails |
| `pinnedbraids` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and two `sweepTube` braid loops |
| `dustsmudge`, `grittygaze` | face mark, eye style | smears laid with `F.place`; `eyes:{iris:1.0, tilt:0, lash:0.7, browThick:1.3}` |
| `ropeharness` | top | `paint` (shirt, wraps), `torso()`: two `ofRibbon` rope straps, a steel ring, an `ofLoft` belt and a pouch; `shoulder` and `forearm` rings |
| `kneepatch` | bottom | `paint(thigh)` and a `limb` shell in `thigh(sd)` |
| `steeltoes` | shoes | `paint(shin, foot)` and `shin(sd)`: a knee patch, an ochre ring and a sole plate |
| `sledgerig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-v3b.js`: `dress.shape`).

| Part of the dressing | Tamsin |
|---|---|
| Grip and bindings | rope `0x9a7a4a` with dark bands |
| Metal | granite `0x8a8f96` |
| Wood | dark wood `0x5a4632` |
| Accent | ochre `0xc2823a` caps and fittings |
| Trim | an ochre stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `chiselstone`: a polished pebble on a rope loop with a steel chisel tip |
| Glow | a spark of pale dust `0xe8d9b8` beside the pebble (earth) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.tamsin` in `src/game/outfits/tamsin.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`tamsin`**: The quarry-hand as drawn: a powerful inverted triangle, short in the stride.

| Slider | Value |
|---|---|
| `height` (Height) | 0.97 |
| `build` (Build) | 1.18 |
| `chest` (Chest) | 1.2 |
| `shoulders` (Shoulders) | 1.18 |
| `waist` (Waist) | 1.05 |
| `torso` (Torso length) | 0.98 |
| `legs` (Leg length) | 0.98 |
| `thighs` (Thighs) | 1.25 |
| `arms` (Arms) | 1.25 |
| `neck` (Neck) | 1.05 |
| `hands` (Hands) | 1.18 |
| `feet` (Feet) | 1.05 |
| `jaw` (Jaw width) | 1.12 |
| `chin` (Chin) | 1.05 |
| `cheeks` (Cheeks) | 1.12 |
| `noseSize` (Nose) | 1.05 |
| `mouthSize` (Mouth width) | 1 |
| `smile` (Expression) | 0.2 |
| `hairLength` (Hair length) | 1 |
| `hairVolume` (Hair volume) | 1.1 |
| `brow` (Brows) | 0.45 |
| `eyeSize` (Eye size) | 1.02 |
| `lips` (Lips) | 1.1 |
| `undertone` (Skin undertone) | 0.5 |
| `blush` (Blush) | 0.45 |
| `earSize` (Ear size) | 1.05 |
| `hips` (Hips) | 1 |
| `head` (Head size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.92 .. 1.04 | 0.92 .. 1.08 |
| `build` (Build) | 1 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.4 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.9 .. 1.15 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1.06 | 0.92 .. 1.14 |
| `arms` (Arms) | 1 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.1 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a quarry-hand. **Deliberately avoids:** a real mining company or union mark, any famous strongwoman, a copy of any existing game's miner class. A person searches the name "Tamsin" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/tamsin.js` (`CHAR_MODELS.tamsin`, the one reference setup and `OUTFITS.tamsin`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit tamsin [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only tamsin`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/tamsin.js`, look `src/game/skillsets/look-tamsin.js`. No skill file is touched.
