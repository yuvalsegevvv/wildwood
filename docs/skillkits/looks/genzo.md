# Look: Genzo (tank)

> **Built, not approved** (version 3, the second six of its new themes): the kit is in `src/game/outfits/genzo.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Genzo / `genzo` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | tank, **air**: a bell's note and cloud-white wisps, a white glow on the charm only |
| Theme | a temple gate-keeper and bell-ringer who stands in the doorway and lets the hour pass over him |
| Feel | slow to speak and slower to move; rings the hour on the hour, whoever is waiting |
| Palette | vermilion `0xb8452a`, bronze `0xd2a24a`, cloud white `0xf3ead2`, ink `0x2a2020`, straw `0xc8a860` |
| Silhouette | a broad body in a straight robe, a heavy rope belt with a bell, wide dark trousers over flat sandals, a plain bound head with a knot |
| Reads as | **a doorway that holds**: red robe, bronze and white |
| Face shape (suggestion, never forced) | broad, heavy-browed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `bronzeband` | a white headband with a bronze plate at the brow and two trailing ends tipped with vermilion |
| **Hair** | `gateknot` | a close dark crop with a small knot on top bound with a bronze ring |
| **Face** | `gatescar` (mark), `heavybrow` (eye style) | a pale scar through the left brow; steady dark eyes under very thick brows |
| **Top** | `gaterobe` | a vermilion robe with a white crossed collar and dark seams, white wrist wraps, a thick rope belt with a bronze bell and a tail, domed bronze shoulder guards |
| **Bottom** | `widehakama` | wide dark trousers with faint seam lines and a white ankle band |
| **Shoes** | `strawsandals` | flat straw-soled sandals with vermilion ties over bare feet |
| **Weapon** | `bellrig` | one dressing for any weapon: dark vermilion grips, bronze metal, walnut wood, bronze accents, white stripes, a small bronze bell charm with a pale spark |

## Builder notes

All of it is in `src/game/outfits/genzo.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 0 triangles to 20,000 over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `bronzeband` | head | an `ofRingAt` cloth band, a box plate and two `ofRibbon` ends |
| `gateknot` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and a knot sphere with a ring |
| `gatescar`, `heavybrow` | face mark, eye style | a scar laid with `F.place`; `eyes:{iris:0.95, h:0.85, browThick:1.7, browAngle:0.1}` |
| `gaterobe` | top | `paint` (robe, collar, wrist wraps), `torso()`: an `ofLoft` rope belt, a lathe bell and a tail; `shoulder(sd)`: a bronze dome with a ring |
| `widehakama` | bottom | `paint(thigh)` and a wide `limb` shell in `thigh(sd)` |
| `strawsandals` | shoes | `paint(shin, foot)` and `shin(sd)`: an ankle ring, a flat sole and a tie ring |
| `bellrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-v3b.js`: `dress.shape`).

| Part of the dressing | Genzo |
|---|---|
| Grip and bindings | dark vermilion `0x8a3220` cloth with ink bands |
| Metal | bronze `0xd2a24a` |
| Wood | walnut `0x6a4a2a` |
| Accent | bronze `0xd2a24a` caps and fittings |
| Trim | a white stripe every 8 cm along blades, limbs, rims and shafts |
| Charm | `bronzebell`: a small bronze bell on a vermilion cord |
| Glow | a spark of cloud white `0xf3ead2` beside the bell (air) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.genzo` in `src/game/outfits/genzo.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`genzo`**: The gate-keeper as drawn: short, a deep chest and a narrow waist, heavy-shouldered.

| Slider | Value |
|---|---|
| `height` (Height) | 1 |
| `build` (Build) | 1.05 |
| `chest` (Chest) | 1.25 |
| `shoulders` (Shoulders) | 1.15 |
| `waist` (Waist) | 0.95 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 0.92 |
| `thighs` (Thighs) | 1.2 |
| `arms` (Arms) | 1.25 |
| `neck` (Neck) | 1.1 |
| `hands` (Hands) | 1.1 |
| `feet` (Feet) | 1.05 |
| `jaw` (Jaw width) | 1.2 |
| `chin` (Chin) | 1.15 |
| `cheeks` (Cheeks) | 1 |
| `noseSize` (Nose) | 1.15 |
| `mouthSize` (Mouth width) | 1 |
| `smile` (Expression) | -0.2 |
| `hairLength` (Hair length) | 0.85 |
| `hairVolume` (Hair volume) | 1 |
| `brow` (Brows) | 0.9 |
| `eyeSize` (Eye size) | 0.95 |
| `eyeTilt` (Eye tilt) | -0.1 |
| `lips` (Lips) | 0.9 |
| `earSize` (Ear size) | 1.15 |
| `undertone` (Skin undertone) | 0.3 |
| `hips` (Hips) | 0.95 |
| `head` (Head size) | 1.05 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `build` (Build) | 1 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.35 | 0.6 .. 1.4 |
| `legs` (Leg length) | 0.92 .. 1.08 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.95 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.1 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.7 .. 1.1 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.15 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a temple gate-keeper and bell-ringer. **Deliberately avoids:** a real temple or monk order, any real sacred script, a copy of any existing game's monk class. A person searches the name "Genzo" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/genzo.js` (`CHAR_MODELS.genzo`, the one reference setup and `OUTFITS.genzo`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit genzo [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only genzo`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/genzo.js`, look `src/game/skillsets/look-genzo.js`. No skill file is touched.
