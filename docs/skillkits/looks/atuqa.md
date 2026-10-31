# Look: Atuqa (tank)

> **Built, not approved** (the Emberwake Isles' three sets): the kit is in `src/game/outfits/atuqa.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Atuqa / `atuqa` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | tank, **light**: a sun-pale glow on the charm |
| Theme | a highland keeper of knotted cords who holds a terrace wall for the ones behind it |
| Feel | steady, slow to speak and slower to give ground; counts promises on his fingers |
| Palette | woven red `0xb83a2a`, gold thread `0xe8c860`, terrace stone `0x8e887a`, wool cream `0xe8dcc0`, indigo `0x2a3a6a` |
| Silhouette | a broad square figure: a pointed flap cap, a red tunic to the thigh with a stone-grey shield disc on the back, two long braids, a fall of knotted cords at the hip |
| Reads as | **a woven wall**: red wool, gold bands, grey stone |
| Face shape (suggestion, never forced) | square-jawed, heavy-browed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `flapcap` | a woven red dome cap with a gold and indigo zigzag band, a gold pompom and two ear flaps with braided cords and red tassels |
| **Hair** | `twinbraids` | hair drawn back under the cap with two long braids over the shoulders, each tied with gold thread and a red tassel |
| **Face** | `sunstripes` (mark), `steadygaze` (eye style) | two stripes across each cheekbone, gold above and cream below; small, level eyes under a heavy brow |
| **Top** | `wovenunku` | a sleeveless red woven tunic with a gold and indigo zigzag chest band, a gold hem with an indigo zigzag, a square skirt front and back, a quipu of seven knotted cords at the belt, a stone terrace shield on the back |
| **Bottom** | `woolleggings` | indigo leggings to the knee with a cream side stripe and a cream cuff |
| **Shoes** | `wrappedsandals` | leather sandals with wool wraps in cream and red up the calf and three gold and red cord rings |
| **Weapon** | `slingrig` | one dressing for any weapon: red cord grips, stone-grey metal, brown wood, gold accents, gold and indigo band stripes, a small quipu charm with three knots |

## Builder notes

All of it is in `src/game/outfits/atuqa.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 20,000 triangles over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `flapcap` | head | a `SphereGeometry` dome painted in bands, a pompom, and two `ofRibbon` flaps with `sweepTube` cords |
| `twinbraids` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and two `sweepTube` braids with gold ties |
| `sunstripes`, `steadygaze` | face mark, eye style | decals laid with `F.place`; `eyes:{iris:0.85, h:0.7, browThick:1.2}` |
| `wovenunku` | top | `paint` (tunic, bands), `oxTabard` skirt (this top owns the `hips` hook: `own:{hips:'top'}`), `torso()`: a quipu on a belt ring and an `oxDisc` shield; `shoulder` rings |
| `woolleggings` | bottom | `paint(thigh, shin)`: indigo with cream stripes and cuffs |
| `wrappedsandals` | shoes | `paint(shin, foot)` wool wraps and `shin(sd)`: three cord rings and a leather sole |
| `slingrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-isles.js`: `dress.shape`, a sword, a bow and a staff). It uses the stock weapon models (no `dress.shape`).

| Part of the dressing | Atuqa |
|---|---|
| Grip and bindings | woven red `0xb83a2a` cord |
| Metal | terrace stone `0x8e887a` |
| Wood | brown wood `0x4a3624` |
| Accent | gold thread `0xe8c860` |
| Trim | alternating gold and indigo bands every 6 cm along blades, limbs, rims and shafts |
| Charm | `quipucharm`: a short cord with three hanging strings, each with a gold knot |
| Glow | a sun-pale `0xfff0b0` point under the knots (light: a lamp on the wall) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.atuqa` in `src/game/outfits/atuqa.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`atuqa`**: The keeper as drawn: broad, solid and a head shorter than the priests.

| Slider | Value |
|---|---|
| `height` (Height) | 0.98 |
| `build` (Build) | 1.1 |
| `chest` (Chest) | 1.15 |
| `shoulders` (Shoulders) | 1.1 |
| `waist` (Waist) | 1.02 |
| `torso` (Torso length) | 0.97 |
| `legs` (Leg length) | 0.98 |
| `thighs` (Thighs) | 1.1 |
| `arms` (Arms) | 1.14 |
| `neck` (Neck) | 1.06 |
| `hands` (Hands) | 1.12 |
| `feet` (Feet) | 1.04 |
| `jaw` (Jaw width) | 1.1 |
| `chin` (Chin) | 1.1 |
| `cheeks` (Cheeks) | 1 |
| `noseSize` (Nose) | 1.1 |
| `mouthSize` (Mouth width) | 1 |
| `smile` (Expression) | 0.1 |
| `hairLength` (Hair length) | 1.1 |
| `hairVolume` (Hair volume) | 1.05 |
| `eyeSize` (Eye size) | 0.85 |
| `brow` (Brows) | 0.9 |
| `lips` (Lips) | 0.9 |
| `undertone` (Skin undertone) | 0.2 |
| `blush` (Blush) | 0.1 |
| `earSize` (Ear size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.95 .. 1.05 | 0.92 .. 1.08 |
| `build` (Build) | 1 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.4 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.9 .. 1.15 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1.06 | 0.92 .. 1.14 |
| `arms` (Arms) | 1 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.1 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.9 .. 1.3 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.95 .. 1.25 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the Andean terrace-keeper and quipu-reader genre (a woven poncho, a knotted cord, a sling). **Deliberately avoids:** any real Inca ruler, the Sapa Inca's fringe, a sun-face emblem, a llama emblem. A person searches the name "Atuqa" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/atuqa.js` (`CHAR_MODELS.atuqa`, the one reference setup and `OUTFITS.atuqa`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit atuqa [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only atuqa`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/atuqa.js`, look `src/game/skillsets/look-atuqa.js`. No skill file is touched.
