# Look: Meleni (support)

> **Built, not approved** (the Emberwake Isles' three sets): the kit is in `src/game/outfits/meleni.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Meleni / `meleni` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | support (buff), **water**: spray and tide, a turquoise glow on the charm |
| Theme | a wayfinder-singer of the Emberwake Isles who chants the crew home across open water |
| Feel | warm, unhurried and sure of the sea; sings under her breath and counts swells |
| Palette | lagoon turquoise `0x2fb4b0`, shell cream `0xf2e6c8`, deep sea `0x16607a`, driftwood `0x8a6a48`, hibiscus coral `0xe86a5a` |
| Silhouette | a bare-shouldered figure in a long flared wrap skirt, a crown of leaves and shells, hair to the hip with one braid over the shoulder, bare feet |
| Reads as | **a wave and a shell**: turquoise, cream and one flower of coral |
| Face shape (suggestion, never forced) | broad-cheeked, bright-eyed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `shellcrown` | a woven turquoise leaf band with seven white shells across the front, a coral hibiscus over the left ear and two tapa ribbons trailing down the back |
| **Hair** | `tidebraid` | long dark hair worn loose to the hip with one braid over the left shoulder, tied with a cream shell |
| **Face** | `wavemarks` (mark), `farsight` (eye style) | three deep-blue dots along each cheekbone and a short row of turquoise dots on the chin; wide, bright eyes with a slight upward tilt |
| **Top** | `tapabandeau` | a cream tapa bandeau with turquoise bands and a zigzag edge, two shell-and-flower leis, a turquoise armband on each arm, a woven belt cord with a shell clasp |
| **Bottom** | `wavepareu` | a deep-blue flared wrap skirt with a cream wave line and a turquoise hem, two tapa ties at the hips |
| **Shoes** | `shellanklets` | bare feet with a cream cord anklet strung with shells and turquoise beads |
| **Weapon** | `paddlerig` | one dressing for any weapon: cream cord grips, shell-white metal, driftwood wood, turquoise accents and stripes, a small conch-shell charm with a turquoise spark |

## Builder notes

All of it is in `src/game/outfits/meleni.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 20,000 triangles over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `shellcrown` | head | `ofRingAt` bands, seven scaled shell spheres, five petal spheres for the hibiscus and two `ofRibbon` tails |
| `tidebraid` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and one `sweepTube` braid with a shell tie |
| `wavemarks`, `farsight` | face mark, eye style | dots laid with `F.place`; `eyes:{iris:1.12, h:1.0, tilt:0.18}` |
| `tapabandeau` | top | `paint` (bandeau, bands, armbands), `torso()`: a back knot, a belt ring and shell, two `oxBeads` leis; `shoulder` and `forearm` rings |
| `wavepareu` | bottom | `hips()`: an `ofLoft` skirt painted with a sine wave line, a hem ring; `paint(thigh)` the waistband |
| `shellanklets` | shoes | `shin(sd)`: a ring and seven shell and bead spheres at the ankle; bare feet |
| `paddlerig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-isles.js`: `dress.shape`, a sword, a bow and a staff). It uses the stock weapon models (no `dress.shape`).

| Part of the dressing | Meleni |
|---|---|
| Grip and bindings | cream `0xf2e6c8` cord with deep-blue bands |
| Metal | shell white `0xe8f0ec` |
| Wood | driftwood `0x8a6a48` |
| Accent | lagoon turquoise `0x2fb4b0` fittings |
| Trim | a turquoise stripe every 8 cm along blades, limbs, rims and shafts |
| Charm | `conchcharm`: a small conch shell with a coral lip on a driftwood cord |
| Glow | a turquoise `0x7fe8ff` spark by the shell (water: a light on the sea) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.meleni` in `src/game/outfits/meleni.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`meleni`**: The wayfinder as drawn: tall, strong-shouldered and long-haired.

| Slider | Value |
|---|---|
| `height` (Height) | 1.05 |
| `build` (Build) | 1 |
| `chest` (Chest) | 0.95 |
| `shoulders` (Shoulders) | 1.08 |
| `waist` (Waist) | 0.9 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 1.08 |
| `thighs` (Thighs) | 1 |
| `arms` (Arms) | 1.08 |
| `neck` (Neck) | 1.04 |
| `hands` (Hands) | 1 |
| `feet` (Feet) | 1 |
| `jaw` (Jaw width) | 0.95 |
| `chin` (Chin) | 0.95 |
| `cheeks` (Cheeks) | 1.05 |
| `noseSize` (Nose) | 1 |
| `mouthSize` (Mouth width) | 1.05 |
| `smile` (Expression) | 0.55 |
| `hairLength` (Hair length) | 1.3 |
| `hairVolume` (Hair volume) | 1.1 |
| `eyeSize` (Eye size) | 1.1 |
| `lips` (Lips) | 1 |
| `undertone` (Skin undertone) | 0.2 |
| `blush` (Blush) | 0.25 |
| `earSize` (Ear size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 1 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.92 .. 1.08 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.7 .. 1.2 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.82 .. 1 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.95 .. 1.15 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.05 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 1.1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.95 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the Pacific wayfinder and chant-leader genre (a shell lei, a woven wrap, a paddle-staff). **Deliberately avoids:** any real navigator, a real tattoo design, a boat or anchor emblem. A person searches the name "Meleni" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/meleni.js` (`CHAR_MODELS.meleni`, the one reference setup and `OUTFITS.meleni`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit meleni [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only meleni`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/meleni.js`, look `src/game/skillsets/look-meleni.js`. No skill file is touched.
