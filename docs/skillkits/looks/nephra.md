# Look: Nephra (healer (shields))

> **Built, not approved** (version 3, the first four of its ten new themes): the kit is in `src/game/outfits/nephra.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Nephra / `nephra` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | healer (shields), **earth**: dust and linen, a faint turquoise glow on the weapon charm only |
| Theme | a risen tomb-keeper of the Sunscar who wraps the living in linen that turns blows aside |
| Feel | calm, courteous and a little amused; speaks softly, counts everything twice, is never in a hurry |
| Palette | old linen `0xe3d5b0`, lapis `0x2f55a0`, gold `0xd4a83a`, turquoise `0x3fb0a8`, stain `0x9c8458`, kohl `0x1f1a22` |
| Silhouette | a narrow wrapped column under a tall striped headcloth with two long lappets, a broad collar over the shoulders, a ragged kilt, loose bandage ends trailing from the shoulders and wrists |
| Reads as | **wrappings and gold**: striped linen, lapis and gold bands, a cobra and an ankh |
| Face shape (suggestion, never forced) | long oval |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `nemescowl` | a tall striped headcloth in old linen and lapis with a gold brow band, a gold cobra (turquoise eyes) at the front, two long lappets striped in lapis and ending in a gold hem, and a striped tail down the back |
| **Hair** | `kohlstrips` | a kohl-black bob with a straight fringe and side locks, and four loose bandage strips hanging down the back from the nape |
| **Face** | `kohlwings` (mark), `tombgaze` (eye style) | long kohl wings at the outer corner of each eye and three gold dots under the left eye; turquoise eyes, heavy lashes, tilted, a slightly lidded height |
| **Top** | `woundcollar` | linen wrapped round and round (stained wrap lines), a gold armlet and a gold wrist ring, a broad collar in bands of gold, lapis, turquoise, lapis and gold, loose bandage strips trailing from each shoulder and wrist, lapis and gold rings at the cuffs |
| **Bottom** | `ragkilt` | a gold-and-lapis belt with a turquoise-centred buckle and a hanging sash tail; a front and a back kilt panel hung to above the knee, torn into points at the hem, a stained edge, a gold and a lapis border above it; wrapped thighs |
| **Shoes** | `wrapsandals` | bare feet in gold-soled sandals, linen wrapped up the calf in stained bands, a gold ankle ring with a turquoise bead |
| **Weapon** | `ankhbind` | one dressing for any weapon: linen-wrapped grips, bronze metal, pale acacia wood, lapis accents, gold bands, an ankh charm with a turquoise bead |

## Builder notes

All of it is in `src/game/outfits/nephra.js` (see `docs/CHARACTER.md` section 9 for the hooks). About about 20,000 triangles over the base clothes at full detail.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `nemescowl` | head | an `ofLoft` dome (an ellipse of rings closed at the apex) painted with 18 radial stripes, a gold ring at the brow, two `ofRibbon` lappets, a rear tail, a gold `sweepTube` cobra with an eye pair. About 4,500 triangles |
| `kohlstrips` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and four stain-dyed ribbons from the nape. About 4,000 triangles |
| `kohlwings`, `tombgaze` | face mark, eye style | two thin ellipsoids and three gold spheres laid on the skull with `F.place`; `eyes:{iris:1.1, hl:2, tilt:0.2, lash:1.4, h:0.9}`. About 200 triangles |
| `woundcollar` | top | `paint` (diagonal wrap lines, gold armlets and wrist rings, `cuts`), `torso()`: a banded `ofLoft` collar sized with `torsoSize`; `shoulder(sd)`: three rings and a trailing strip; `forearm(sd)`: two rings and a strip. About 6,000 triangles |
| `ragkilt` | bottom | `hips()`: a belt ring, a buckle, a sash tail and two `ofLoft` panels whose lowest row is displaced into points; `paint(thigh)` wraps. About 3,500 triangles |
| `wrapsandals` | shoes | `paint(shin, foot)` (wraps, a gold ring, gold soles), `shin(sd)`: an ankle ring, a turquoise bead and a sole plate. About 500 triangles |
| `ankhbind` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Nephra |
|---|---|
| Grip and bindings | linen `0xc8b68a` wrapped grips with stain-coloured wire |
| Metal | bronze `0xc79a55` |
| Wood | pale acacia `0x8a6a40` |
| Accent | lapis `0x2f55a0` bindings and caps |
| Trim | a gold band every 5 cm along blades, limbs, rims and shafts |
| Charm | `ankhcharm`: a gold ankh (a ring, a stem and a bar) on a linen cord |
| Glow | a turquoise `0x6fd6c8` bead in the ankh's loop (earth: a cool, quiet glow) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.nephra` in `src/game/outfits/nephra.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`nephra`**: The tomb-keeper as drawn: tall, narrow, long-necked and calm.

| Slider | Value |
|---|---|
| `height` (Height) | 1.08 |
| `build` (Build) | 0.88 |
| `chest` (Chest) | 0.62 |
| `shoulders` (Shoulders) | 1.1 |
| `waist` (Waist) | 0.95 |
| `torso` (Torso length) | 1.06 |
| `legs` (Leg length) | 1.1 |
| `thighs` (Thighs) | 0.86 |
| `arms` (Arms) | 1.2 |
| `neck` (Neck) | 1.15 |
| `hands` (Hands) | 1.18 |
| `feet` (Feet) | 1.1 |
| `head` (Head size) | 0.92 |
| `jaw` (Jaw width) | 0.88 |
| `chin` (Chin) | 0.95 |
| `cheeks` (Cheeks) | 0.82 |
| `eyeSize` (Eye size) | 1.2 |
| `eyeTilt` (Eye tilt) | 0.15 |
| `brow` (Brows) | -0.1 |
| `noseSize` (Nose) | 0.9 |
| `mouthSize` (Mouth width) | 0.85 |
| `lips` (Lips) | 1.2 |
| `smile` (Expression) | 0.1 |
| `hairLength` (Hair length) | 1 |
| `hairVolume` (Hair volume) | 1 |
| `undertone` (Skin undertone) | 0.3 |
| `blush` (Blush) | 0 |
| `earSize` (Ear size) | 0.95 |
| `hips` (Hips) | 0.88 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.96 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.02 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.1 | 0.6 .. 1.4 |
| `waist` (Waist) | 0.82 .. 1.05 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.85 .. 1.12 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `neck` (Neck) | 1 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.9 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.15 | 0.9 .. 1.25 |

## Body fit

The collar follows `torsoSize` (chest, build, shoulders); the kilt panels hang from the belt and clear the hips and the glutes; the headcloth is sized to cover the hair item that goes with it (a hair item worn under another hat may clip a little). Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the embalmer and tomb-keeper genre in general (a striped headcloth, a broad collar, linen wrappings). **Deliberately avoids:** a named pharaoh, a named deity's crown or a real museum piece's pattern, any film mummy's exact bandage layout, any existing game's mummy character. A person searches the name "Nephra" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/nephra.js` (`CHAR_MODELS.nephra`, the one reference setup and `OUTFITS.nephra`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit nephra [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only nephra`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/nephra.js`, look `src/game/skillsets/look-nephra.js`. No skill file is touched.
