# Look: Hollis (healer)

> **Built, not approved** (version 3, the second six of its new themes): the kit is in `src/game/outfits/hollis.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Hollis / `hollis` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | healer, **dark**: lamp-flame and fog, an amber glow on the charm only |
| Theme | an undertaker's lamp-bearer who keeps the long vigil over the living and borrows the dusk to mend them |
| Feel | gentle, tired and exact; speaks softly, never looks away |
| Palette | crape `0x2a2630`, plum `0x3a3548`, lamp amber `0xe8a84a`, fog `0x9c9aa6`, white `0xe8e4dc` |
| Silhouette | a tall flat hat over a narrow body, a long coat with tails to the knee, a hooked lantern in the hand |
| Reads as | **a lamp in the dark**: black, plum and one warm light |
| Face shape (suggestion, never forced) | gaunt, long-jawed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `crapehat` | a tall black top hat with a plum crown edge and a narrow brim, an amber band with a brass buckle and a crape ribbon trailing down the back |
| **Hair** | `slickback` | slicked-back black hair long over the collar, with two loose locks at the temples |
| **Face** | `tiredmarks` (mark), `vigilgaze` (eye style) | faint shadowed hollows under the eyes and a thin line at the chin; small pale-grey eyes with a low lid |
| **Top** | `frockcoat` | a long black frock coat with split tails, plum arm bands, amber buttons, a white shirt front and stock with a black bow, amber piping at the cuffs |
| **Bottom** | `stripetrousers` | plum trousers with a fog-grey side stripe |
| **Shoes** | `amberboots` | polished black boots with an amber top band, a brass buckle and a dark sole |
| **Weapon** | `vigilrig` | one dressing for any weapon: crape grips with fog bands, brass metal, dark wood, amber accents and stripes, a hooded lantern charm with an amber flame |

## Builder notes

All of it is in `src/game/outfits/hollis.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 0 triangles to 20,000 over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `crapehat` | head | cylinders for crown and brim, an `ofRingAt` band, a buckle and an `ofRibbon` tail |
| `slickback` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and two `sweepTube` locks |
| `tiredmarks`, `vigilgaze` | face mark, eye style | smears laid with `F.place`; `eyes:{iris:0.8, h:0.78, tilt:-0.2, browAngle:-0.1}` |
| `frockcoat` | top | `paint` (coat, shirt front, bands), `torso()`: two split `ofLoft` coat tails, amber button spheres and a bow; `shoulder` and `forearm` rings |
| `stripetrousers` | bottom | `paint(thigh)`: plum cloth with a fog stripe |
| `amberboots` | shoes | `paint(shin, foot)` and `shin(sd)`: an amber ring, a buckle and a sole plate |
| `vigilrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-v3b.js`: `dress.shape`).

| Part of the dressing | Hollis |
|---|---|
| Grip and bindings | crape `0x2a2630` cloth with fog bands |
| Metal | brass `0xb08a3a` |
| Wood | dark wood `0x3a2a22` |
| Accent | lamp amber `0xe8a84a` caps and fittings |
| Trim | an amber stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `wakelamp`: a small hooded lantern on a black cord |
| Glow | a flame of amber `0xffcf7a` in the lantern (dark: a lamp-flame is a light kept in the dark) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.hollis` in `src/game/outfits/hollis.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`hollis`**: The lamp-bearer as drawn: tall, gaunt and long-necked.

| Slider | Value |
|---|---|
| `height` (Height) | 1.08 |
| `build` (Build) | 0.88 |
| `chest` (Chest) | 0.62 |
| `shoulders` (Shoulders) | 0.9 |
| `waist` (Waist) | 0.84 |
| `torso` (Torso length) | 1.07 |
| `legs` (Leg length) | 1.12 |
| `thighs` (Thighs) | 0.86 |
| `arms` (Arms) | 1.22 |
| `neck` (Neck) | 1.2 |
| `hands` (Hands) | 1.2 |
| `feet` (Feet) | 1.1 |
| `jaw` (Jaw width) | 1 |
| `chin` (Chin) | 1 |
| `cheeks` (Cheeks) | 0.72 |
| `noseSize` (Nose) | 1.1 |
| `mouthSize` (Mouth width) | 0.9 |
| `smile` (Expression) | 0 |
| `hairLength` (Hair length) | 1 |
| `hairVolume` (Hair volume) | 0.95 |
| `eyeSize` (Eye size) | 0.92 |
| `brow` (Brows) | 0.3 |
| `lips` (Lips) | 0.75 |
| `undertone` (Skin undertone) | -0.3 |
| `blush` (Blush) | 0 |
| `earSize` (Ear size) | 1.1 |
| `head` (Head size) | 0.92 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 1 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.05 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.82 .. 1 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.88 .. 1.05 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.9 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 1 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.9 .. 1.05 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.1 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** an undertaker's lamp-bearer. **Deliberately avoids:** a real undertaker's firm, a famous gothic character, a skull or coffin emblem. A person searches the name "Hollis" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/hollis.js` (`CHAR_MODELS.hollis`, the one reference setup and `OUTFITS.hollis`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit hollis [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only hollis`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/hollis.js`, look `src/game/skillsets/look-hollis.js`. No skill file is touched.
