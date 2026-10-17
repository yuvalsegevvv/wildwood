# Look: Brynja (risk DPS)

> **Built, not approved** (version 3, the second six of its new themes): the kit is in `src/game/outfits/brynja.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Brynja / `brynja` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | risk DPS, **water**: ice and snow, a pale blue glow on the charm only |
| Theme | an ice-skater and frost-hunter who never stops moving across the frozen lake and cuts as she passes |
| Feel | bright, fast and impatient with anything standing still |
| Palette | ice `0x6fb4e0`, snow `0xeaf4fb`, slate `0x3c4a5a`, fur `0xb8a890`, steel `0xc9d4dc` |
| Silhouette | a hooded head with two long braids, a fitted jacket, a short flared skirt, long slim legs ending in skate blades |
| Reads as | **a blade on the ice**: slate, ice blue and white fur |
| Face shape (suggestion, never forced) | narrow, pointed chin |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `rimehood` | a slate hood with ice stitching, a thick fur rim framing the face and a pointed tail at the back |
| **Hair** | `frostbraids` | two long white braids over the shoulders, tied with ice-blue ribbons |
| **Face** | `frostfreckle` (mark), `icegaze` (eye style) | pale ice-blue freckles across the nose; large light-blue eyes with long lashes |
| **Top** | `quiltjacket` | a slate quilted jacket with diamond stitching, snow cuffs and an ice hem stripe, a thick fur collar |
| **Bottom** | `pleatskirt` | a short flared pleated skirt in slate with an ice waistband, a fur hem, over slate leggings with an ice stripe |
| **Shoes** | `skateboots` | slate and white boots with a fur cuff and a steel blade with two stanchions under each sole |
| **Weapon** | `skaterig` | one dressing for any weapon: dark slate grips with ice bands, steel metal, blue-grey wood, ice accents, snow stripes, an ice-crystal charm with a pale glow |

## Builder notes

All of it is in `src/game/outfits/brynja.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 0 triangles to 20,000 over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `rimehood` | head | an `ofLoft` dome, a torus fur rim and a cone tail |
| `frostbraids` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and two `sweepTube` braids with ribbon rings |
| `frostfreckle`, `icegaze` | face mark, eye style | small spheres laid with `F.place`; `eyes:{iris:1.1, hl:2, tilt:0.15, lash:1.1}` |
| `quiltjacket` | top | `paint` (diamond quilting, cuffs), `torso()`: an `ofLoft` fur collar; `shoulder` and `forearm` rings |
| `pleatskirt` | bottom | `hips()`: an `ofLoft` flared skirt with pleat paint and a fur hem; `paint(thigh)` leggings |
| `skateboots` | shoes | `paint(shin, foot)` and `shin(sd)`: a fur ring, a sole plate and a steel blade with stanchions |
| `skaterig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-v3b.js`: `dress.shape`).

| Part of the dressing | Brynja |
|---|---|
| Grip and bindings | dark slate `0x2a3440` cloth with ice bands |
| Metal | bright steel `0xc9d4dc` |
| Wood | blue-grey `0x5a6a7a` |
| Accent | ice blue `0x6fb4e0` caps and fittings |
| Trim | a snow stripe every 6 cm along blades, limbs, rims and shafts |
| Charm | `icecrystal`: an ice crystal on a fur-tied cord |
| Glow | a spark of pale ice `0xb8e6ff` inside the crystal (water) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.brynja` in `src/game/outfits/brynja.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`brynja`**: The skater as drawn: tall, light and long in the leg.

| Slider | Value |
|---|---|
| `height` (Height) | 1.05 |
| `build` (Build) | 0.92 |
| `chest` (Chest) | 0.92 |
| `shoulders` (Shoulders) | 0.96 |
| `waist` (Waist) | 0.88 |
| `torso` (Torso length) | 0.98 |
| `legs` (Leg length) | 1.1 |
| `thighs` (Thighs) | 0.94 |
| `arms` (Arms) | 0.95 |
| `neck` (Neck) | 1.05 |
| `hands` (Hands) | 0.95 |
| `feet` (Feet) | 0.95 |
| `jaw` (Jaw width) | 0.95 |
| `chin` (Chin) | 0.98 |
| `cheeks` (Cheeks) | 1 |
| `noseSize` (Nose) | 0.95 |
| `mouthSize` (Mouth width) | 1 |
| `smile` (Expression) | 0.4 |
| `hairLength` (Hair length) | 1.2 |
| `hairVolume` (Hair volume) | 1.05 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.98 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.02 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.7 .. 1.2 | 0.6 .. 1.4 |
| `waist` (Waist) | 0.82 .. 1 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1.02 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.85 .. 1.1 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** an ice-skater and frost-hunter. **Deliberately avoids:** a real figure skater, any real winter-sports brand, a snowflake copied from any existing logo. A person searches the name "Brynja" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/brynja.js` (`CHAR_MODELS.brynja`, the one reference setup and `OUTFITS.brynja`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit brynja [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only brynja`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/brynja.js`, look `src/game/skillsets/look-brynja.js`. No skill file is touched.
