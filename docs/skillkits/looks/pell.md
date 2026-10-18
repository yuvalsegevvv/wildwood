# Look: Pell (safe DPS)

> **Built, not approved** (version 3, the second six of its new themes): the kit is in `src/game/outfits/pell.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Pell / `pell` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | safe DPS, **fire**: torch fire and tar, an orange glow on the charm only |
| Theme | a night-fisher who spears eels by torchlight and never stands closer than he must |
| Feel | patient and dry; talks to the water, never in a hurry |
| Palette | tar `0x2a2420`, torch orange `0xe0762a`, cream `0xe9dfc4`, reed `0x8a7a44`, rope `0x9a8a5c` |
| Silhouette | a wide reed cone hat over a narrow body, a net hanging from one shoulder, a lantern at the hip, tall dark boots |
| Reads as | **a long patient night**: tar, cream and a spot of flame |
| Face shape (suggestion, never forced) | long, squinting |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `reedcone` | a wide woven reed cone with rope lines, a cream band, an orange feather and two chin cords |
| **Hair** | `taillock` | a dark crop with a short tail tied at the nape with an orange cord |
| **Face** | `soothmarks` (mark), `squintgaze` (eye style) | soot smudges under the eyes and a dark stubble patch; narrow, low-lidded brown eyes with thick brows |
| **Top** | `oilskinnet` | a cream shirt under a tar oilskin vest with stitch lines, orange cuffs, a rope net with cork floats draped from the right shoulder across the chest |
| **Bottom** | `rolledwaders` | cream trousers with rolled seams and a tar lower leg, a tar belt with a rope trim and a brass hip lantern with a lit pane |
| **Shoes** | `tarboots` | tall tarred boots with a cream cuff, an orange band and a dark sole |
| **Weapon** | `torchspear` | one dressing for any weapon: rope-bound grips, steel metal, dark wood, orange accents and stripes, a cork float and fish-hook charm with a torch spark |

## Builder notes

All of it is in `src/game/outfits/pell.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 0 triangles to 20,000 over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `reedcone` | head | an `ofLoft` cone with woven paint, a ring band, an `ofRibbon` feather and two cords |
| `taillock` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and one `sweepTube` tail with a tie ring |
| `soothmarks`, `squintgaze` | face mark, eye style | soot smears laid with `F.place`; `eyes:{iris:0.9, h:0.7, tilt:-0.1, browThick:1.15}` |
| `oilskinnet` | top | `paint` (shirt, vest, stitching), `torso()`: two `ofRibbon` net strips with a grid paint and cork spheres; `shoulder` and `forearm` rings |
| `rolledwaders` | bottom | `paint(thigh)` and `hips()`: an `ofLoft` belt and a lantern from a cylinder, a lit pane and a brass cap |
| `tarboots` | shoes | `paint(shin, foot)` and `shin(sd)`: two rings and a sole plate |
| `torchspear` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-v3b.js`: `dress.shape`).

| Part of the dressing | Pell |
|---|---|
| Grip and bindings | rope `0x9a8a5c` with cream bands |
| Metal | steel `0xbfc4c8` |
| Wood | dark wood `0x4a3a28` |
| Accent | torch orange `0xe0762a` caps and fittings |
| Trim | an orange stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `floathook`: a cork float on a cord with a steel fish hook |
| Glow | a spark of torch light `0xffb45a` beside the float (fire) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.pell` in `src/game/outfits/pell.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`pell`**: The night-fisher as drawn: lean, long-armed and squinting.

| Slider | Value |
|---|---|
| `height` (Height) | 1.03 |
| `build` (Build) | 0.94 |
| `chest` (Chest) | 0.9 |
| `shoulders` (Shoulders) | 0.98 |
| `waist` (Waist) | 0.92 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 1.06 |
| `thighs` (Thighs) | 0.94 |
| `arms` (Arms) | 1.08 |
| `neck` (Neck) | 1.05 |
| `hands` (Hands) | 1.08 |
| `feet` (Feet) | 1 |
| `jaw` (Jaw width) | 1.12 |
| `chin` (Chin) | 1.15 |
| `cheeks` (Cheeks) | 0.8 |
| `noseSize` (Nose) | 1.12 |
| `mouthSize` (Mouth width) | 0.95 |
| `smile` (Expression) | 0 |
| `hairLength` (Hair length) | 1 |
| `hairVolume` (Hair volume) | 1 |
| `brow` (Brows) | 0.5 |
| `eyeSize` (Eye size) | 0.95 |
| `lips` (Lips) | 0.7 |
| `undertone` (Skin undertone) | 0.4 |
| `blush` (Blush) | 0.5 |
| `earSize` (Ear size) | 1.15 |
| `eyeTilt` (Eye tilt) | -0.2 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.96 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.05 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.7 .. 1.15 | 0.6 .. 1.4 |
| `waist` (Waist) | 0.82 .. 1.05 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.88 .. 1.1 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.98 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.9 .. 1.15 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.15 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a night-fisher. **Deliberately avoids:** a famous fisherman, any real fishing-brand mark, a copy of any existing game's fisher class. A person searches the name "Pell" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/pell.js` (`CHAR_MODELS.pell`, the one reference setup and `OUTFITS.pell`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit pell [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only pell`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/pell.js`, look `src/game/skillsets/look-pell.js`. No skill file is touched.
