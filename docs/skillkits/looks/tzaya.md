# Look: Tzaya (grinder)

> **Built, not approved** (the Emberwake Isles' three sets): the kit is in `src/game/outfits/tzaya.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Tzaya / `tzaya` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | grinder, **fire**: copal smoke and embers, an ember glow on the charm |
| Theme | a calendar-priest of the jungle city who keeps the count by what he burns |
| Feel | grave, exact and a little amused; speaks in numbers and never hurries a ceremony |
| Palette | jade `0x2f8a5a`, calendar gold `0xd8b040`, cinder red `0xb83a28`, ember `0xff7a3a`, cotton `0xe8dcc0` |
| Silhouette | a bare-chested figure under a tall back-swept feather fan, a broad jade collar at the shoulders, a gold wheel on the back and two long flaps at the hips |
| Reads as | **a count in jade and gold**: green feathers, a gold wheel, one red sash |
| Face shape (suggestion, never forced) | angular, long-nosed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `featherfan` | a gold headband with a jade disc over the brow and a fan of nine green and teal feathers tipped red rising back and up |
| **Hair** | `priestcrop` | close-cropped black hair with a short tail at the nape and a jade ear spool with a gold centre in each ear |
| **Face** | `glyphmarks` (mark), `emberstare` (eye style) | a red bar under each eye, a ring of four red dots with a gold centre on the right cheek and a gold line over each brow; narrow amber eyes with a low lid |
| **Top** | `jadecollar` | a bare chest under a wide banded collar of jade, teal, gold and red, a red sash with a gold edge at the belly with a knotted end, a gold wheel with ten rays on the back, gold shoulder rings |
| **Bottom** | `flapwrap` | a cotton loin-wrap with a red band on each thigh and a long front flap and back flap hemmed in red |
| **Shoes** | `jadesandals` | dark-corded sandals with a jade and gold ankle ring |
| **Weapon** | `obsidianrig` | one dressing for any weapon: red cord grips, obsidian metal, dark wood, jade accents, gold glyph stripes, a small copal burner charm with a live ember |

## Builder notes

All of it is in `src/game/outfits/tzaya.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 20,000 triangles over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `featherfan` | head | `ofRingAt` bands, a jade disc, and nine feather ellipsoids spread with `rotateZ` and tilted back |
| `priestcrop` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and two ear-spool cylinders |
| `glyphmarks`, `emberstare` | face mark, eye style | decals laid with `F.place`; `eyes:{iris:0.9, h:0.8, tilt:-0.15, browAngle:-0.2}` |
| `jadecollar` | top | `paint` (belt band), `torso()`: `oxMantle` flat collar, a sash knot with two `ofRibbon` ends, a belt ring and an `oxDisc` wheel; `shoulder` and `forearm` rings |
| `flapwrap` | bottom | `hips()`: `oxTabard` front and back flaps; `paint(thigh)` the red hip band |
| `jadesandals` | shoes | `shin(sd)`: a jade and a gold ring and a dark sole plate; `paint(foot)` cords |
| `obsidianrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-isles.js`: `dress.shape`, a sword, a bow and a staff). It uses the stock weapon models (no `dress.shape`).

| Part of the dressing | Tzaya |
|---|---|
| Grip and bindings | cinder red `0xb83a28` cord |
| Metal | obsidian `0x1a1820` |
| Wood | dark wood `0x3a2a22` |
| Accent | jade `0x2f8a5a` fittings |
| Trim | a gold glyph stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `copalburner`: a small gold bowl with a jade rim on a red cord |
| Glow | an ember `0xff7a3a` in the bowl (fire: a live coal) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.tzaya` in `src/game/outfits/tzaya.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`tzaya`**: The priest as drawn: tall, lean and straight-backed.

| Slider | Value |
|---|---|
| `height` (Height) | 1.06 |
| `build` (Build) | 1 |
| `chest` (Chest) | 1 |
| `shoulders` (Shoulders) | 1.02 |
| `waist` (Waist) | 0.88 |
| `torso` (Torso length) | 1.04 |
| `legs` (Leg length) | 1.06 |
| `thighs` (Thighs) | 0.96 |
| `arms` (Arms) | 1.06 |
| `neck` (Neck) | 1.1 |
| `hands` (Hands) | 1.04 |
| `feet` (Feet) | 1 |
| `jaw` (Jaw width) | 1.08 |
| `chin` (Chin) | 1.05 |
| `cheeks` (Cheeks) | 0.9 |
| `noseSize` (Nose) | 1.15 |
| `mouthSize` (Mouth width) | 0.95 |
| `smile` (Expression) | 0 |
| `hairLength` (Hair length) | 0.9 |
| `hairVolume` (Hair volume) | 0.95 |
| `eyeSize` (Eye size) | 0.9 |
| `brow` (Brows) | 0.8 |
| `lips` (Lips) | 0.8 |
| `undertone` (Skin undertone) | 0.3 |
| `blush` (Blush) | 0 |
| `earSize` (Ear size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 1 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.95 .. 1.1 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.8 .. 1.2 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.82 .. 1 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.1 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.95 .. 1.15 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.05 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.1 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.1 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the Mesoamerican calendar-priest genre (a feathered headdress, a jade collar, an obsidian blade). **Deliberately avoids:** any real king or codex figure, a skull or heart emblem, sacrifice imagery. A person searches the name "Tzaya" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/tzaya.js` (`CHAR_MODELS.tzaya`, the one reference setup and `OUTFITS.tzaya`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit tzaya [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only tzaya`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/tzaya.js`, look `src/game/skillsets/look-tzaya.js`. No skill file is touched.
