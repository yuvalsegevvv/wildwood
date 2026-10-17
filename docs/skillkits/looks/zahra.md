# Look: Zahra (buff support)

> **Built, not approved** (version 3, the second six of its new themes): the kit is in `src/game/outfits/zahra.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Zahra / `zahra` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | buff support, **light**: reflected sun and falling sand, a pale gold glow on the charm only |
| Theme | a glass-bearer of the desert noon who turns the sun with a polished mirror and counts the hour in falling sand |
| Feel | composed and exact; always knows the hour and says so |
| Palette | gold `0xe8c050`, lapis `0x2b6aa8`, white `0xf4efe0`, sand `0xd6b87a`, bronze `0xb08a3a` |
| Silhouette | a crowned veiled head, a short robe with wide sleeves over a long split skirt, a gold chain at the waist |
| Reads as | **noon on glass**: lapis, white and gold |
| Face shape (suggestion, never forced) | long, high-cheeked |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `beadcirclet` | a lapis headcloth with gold seams, a gold band with a white drop at the brow and a veil of nine gold bead strands |
| **Hair** | `goldbraid` | a long dark braid down the back strung with gold rings and a lapis end ring |
| **Face** | `golddots` (mark), `noongaze` (eye style) | gold dots at the brow and the cheeks; large amber eyes with long lashes |
| **Top** | `widesleeve` | a lapis cropped robe with a gold band under the bust and diamond stitching, wide flared sleeves with gold cuffs, a gold collar with a white inlay, a gold waist chain with a white drop |
| **Bottom** | `noonskirt` | a long split white skirt with a gold waistband and gold hem, sand seam lines |
| **Shoes** | `goldsandals` | bare feet in thin gold sandals with a gold ankle ring and a lapis bead |
| **Weapon** | `mirrorrig` | one dressing for any weapon: dark lapis grips with gold bands, white metal, bronze wood, gold accents, lapis stripes, a small sandglass charm with a pale gold spark |

## Builder notes

All of it is in `src/game/outfits/zahra.js` (see `docs/CHARACTER.md` section 9 for the hooks). About 0 triangles to 20,000 over the base clothes at full detail (the preview prints the exact figure).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `beadcirclet` | head | an `ofLoft` dome, a ring band, an octahedron drop and nine `sweepTube` bead strands with spheres |
| `goldbraid` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and one `sweepTube` braid with four rings |
| `golddots`, `noongaze` | face mark, eye style | small spheres laid with `F.place`; `eyes:{iris:1.1, hl:2, tilt:0.18, lash:1.3}` |
| `widesleeve` | top | `paint` (robe, bands, stitching), `torso()`: an `ofLoft` collar, a waist chain ring and a drop; `shoulder(sd)`: a flared sleeve loft |
| `noonskirt` | bottom | `hips()`: two split `ofLoft` skirt panels with border paint |
| `goldsandals` | shoes | `paint(shin, foot)` and `shin(sd)`: an ankle ring, a bead and a thin sole |
| `mirrorrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-v3b.js`: `dress.shape`).

| Part of the dressing | Zahra |
|---|---|
| Grip and bindings | dark lapis `0x1d4a78` cloth with gold bands |
| Metal | white glass `0xf4efe0` |
| Wood | bronze wood `0x6a4a28` |
| Accent | gold `0xe8c050` caps and fittings |
| Trim | a lapis stripe every 6 cm along blades, limbs, rims and shafts |
| Charm | `goldglass`: a small sandglass on a gold cord |
| Glow | a spark of pale gold `0xfff0b0` between the bulbs (light) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.zahra` in `src/game/outfits/zahra.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`zahra`**: The glass-bearer as drawn: tall, poised and long-necked.

| Slider | Value |
|---|---|
| `height` (Height) | 1.05 |
| `build` (Build) | 0.94 |
| `chest` (Chest) | 0.95 |
| `shoulders` (Shoulders) | 0.98 |
| `waist` (Waist) | 0.9 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 1.08 |
| `thighs` (Thighs) | 0.96 |
| `arms` (Arms) | 0.95 |
| `neck` (Neck) | 1.12 |
| `hands` (Hands) | 0.95 |
| `feet` (Feet) | 0.96 |
| `jaw` (Jaw width) | 0.95 |
| `chin` (Chin) | 1 |
| `cheeks` (Cheeks) | 1 |
| `noseSize` (Nose) | 1 |
| `mouthSize` (Mouth width) | 0.98 |
| `smile` (Expression) | 0.35 |
| `hairLength` (Hair length) | 1.25 |
| `hairVolume` (Hair volume) | 1.05 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.98 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.05 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.7 .. 1.2 | 0.6 .. 1.4 |
| `waist` (Waist) | 0.82 .. 1.02 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.85 .. 1.1 | 0.82 .. 1.25 |
| `neck` (Neck) | 1 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a glass-bearer of the desert noon. **Deliberately avoids:** a real religion's symbols, a rayed sun or crescent emblem, a copy of any existing game's priest class. A person searches the name "Zahra" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/zahra.js` (`CHAR_MODELS.zahra`, the one reference setup and `OUTFITS.zahra`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit zahra [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only zahra`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/zahra.js`, look `src/game/skillsets/look-zahra.js`. No skill file is touched.
