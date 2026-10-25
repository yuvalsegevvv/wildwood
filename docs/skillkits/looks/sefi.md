# Look: Sefi (risk DPS)

> **Built, not approved** (version 3, the Kin outfits of the Amber Reach plan, task K2): the kit is in `src/game/outfits/sefi.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`. What is special about this set is its **Kin parts**: see "Kin parts" below.

## Persona

| | |
|---|---|
| Name / id | Sefi / `sefi` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | risk DPS, air: sand gold and sky blue, a pale blue glow on the pennant and feather only |
| Theme | a cheetah-kin courier who crosses the plain faster than the message, and cuts whatever stands in the way as she passes |
| Feel | restless, bright and impatient; already at the next place |
| Palette | sand gold `0xe0b040`, dark leather `0x3a2a1a`, sky `0xbfe6ff`, deep sky `0x5aa0d0`, cream `0xf2e6c8`, brass `0xc9a24a` |
| Silhouette | the slimmest, longest figure of the Kin: bare midriff and legs, a streaming ponytail and headband tails, a tube across the back, a tail as long as the legs |
| Reads as | **a streak of gold on the grass** |
| Face shape (suggestion, never forced) | narrow, fine-chinned |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `windband` | a sky headband with a gold stripe, a knot on one side and two long tails streaming back |
| **Hair** | `windtail` | swept back from a high point with the fringe blown sideways, one long ponytail streaming behind with pale tips |
| **Face** | `skyliner` (mark), `longgaze` (eye style) | a swept deep-sky line from each eye corner and three dark spots on each cheek; large pale gold-green eyes, tilted up, long lashes |
| **Top** | `courierwrap` | a gold crop top with a dark hem and a sky neck scarf over a bare midriff, a sky sash across the chest with a brass clasp, a brass-capped message tube across the back |
| **Bottom** | `wrapskirt` | a short gold wrap skirt with a dark side stripe, two sky sash tails of different lengths at the hips, bare thighs |
| **Shoes** | `thongwraps` | cream-and-dark wraps from the ankle to below the knee over thong sandals with a dark sole |
| **Weapon** | `runnerrig` | one dressing for any weapon: dark grip with gold bands, pale steel, sky stripes; a curved running knife for a sword, a long swept wind bow, a pennant staff |

## Kin parts

Sefi's ears, tail and muzzle are **set parts** (`kinDefineSet`, `src/shared/kin.js`): not free and not crafted, they come with the outfit set and follow its gate (the tile in the editor's Body > Kin rows shows a lock until the set is owned, and a look that wears them unowned is only a try-on). Wearing the whole set (`CHAR_MODELS.sefi.kin`, written by `ofWear`) also sets the fur colour, the second colour and the marking (golden `0xe0a830` with dark spots `0x2a1c14`); taking the set off, or wearing another set, removes only what it put there, and the Kin rows still change any of it afterwards. The hat lets the ears poke through (`KIN_HAT_EARS.sefi`).

| Part | Id | What it is |
|---|---|---|
| Ears | `e:sefi` | small round ears with a black back and a white inside |
| Tail | `k:sefi` | a long slim tail, spotted, ringed in black near the tip and ending in white |
| Muzzle | `m:sefi` | a short fine snout with a black nose and the two black tear lines from the eyes (the lines are part of the muzzle) |

## Builder notes

All of it is in `src/game/outfits/sefi.js` (see `docs/CHARACTER.md` section 9 for the hooks); the weapon models are in `src/game/combat/weapon-shapes-kin.js`.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `windband` | head | two `ofRingAt` rings (sky and gold), a knot sphere and two `ofRibbon` tails |
| `windtail` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and a `sweepTube` ponytail through `T.add`, a ring tie |
| `skyliner`, `longgaze` | face mark, eye style | stretched ellipses and spots laid with `F.place`; `eyes:{iris:1.15, tilt:0.3, lash:0.9}` |
| `courierwrap` | top | `paint` (crop top, hem, scarf, bare midriff, wrist wraps), `torso()`: an `ofRibbon` sash with a clasp and an `oxTube` message tube |
| `wrapskirt` | bottom | `paint(thigh)` for the gold band, `hips()`: an `oxSkirt` and two `oxSash` tails |
| `thongwraps` | shoes | `paint(shin, foot)`: spiral wraps and straps; `shin(sd)`: a dark ring and a heel plate |
| `runnerrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-kin.js`: `dress.shape`).

| Part of the dressing | Sefi |
|---|---|
| Grip and bindings | dark leather `0x3a2a1a` with gold bands |
| Metal | pale steel `0xdfe8ee` |
| Wood | warm brown `0x8a6a3a` |
| Accent | deep sky `0x5aa0d0` |
| Trim | a sky stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `tubefeather`: a small brass message tube and a sky feather on a cord |
| Glow | the pennant and the feather in sky `0xbfe6ff` (air: a wind you can see) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.sefi` in `src/game/outfits/sefi.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`sefi`**: The courier as drawn: tall, light-boned and all leg.

| Slider | Value |
|---|---|
| `height` (Height) | 1.06 |
| `build` (Build) | 0.88 |
| `chest` (Chest) | 0.8 |
| `shoulders` (Shoulders) | 0.94 |
| `waist` (Waist) | 0.86 |
| `torso` (Torso length) | 0.96 |
| `legs` (Leg length) | 1.14 |
| `thighs` (Thighs) | 0.9 |
| `arms` (Arms) | 1.04 |
| `neck` (Neck) | 1.1 |
| `hands` (Hands) | 0.92 |
| `feet` (Feet) | 1.1 |
| `jaw` (Jaw width) | 0.85 |
| `chin` (Chin) | 0.85 |
| `cheeks` (Cheeks) | 0.85 |
| `noseSize` (Nose) | 0.85 |
| `mouthSize` (Mouth width) | 0.9 |
| `smile` (Expression) | 0.5 |
| `hairLength` (Hair length) | 1.25 |
| `hairVolume` (Hair volume) | 1 |
| `eyeSize` (Eye size) | 1.2 |
| `lips` (Lips) | 0.9 |
| `undertone` (Skin undertone) | 0.1 |
| `blush` (Blush) | 0.2 |
| `earSize` (Ear size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 1 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.82 .. 1 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.85 .. 1.05 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1.06 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.9 .. 1.1 | 0.82 .. 1.25 |
| `neck` (Neck) | 1 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.92 .. 1.05 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 1.1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.1 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the plains courier and runner genre (a light sash, a curved knife, spotted gold fur). **Deliberately avoids:** a famous racing character, a winged-shoe emblem, any existing cheetah character. A person searches the name "Sefi" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/sefi.js` (`CHAR_MODELS.sefi`, the one reference setup and the Kin set, `OUTFITS.sefi`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit sefi [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only sefi`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/sefi.js`. No skill file is touched.
