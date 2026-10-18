# Look: Dunstan (support, buff, fire)

> **Built, not approved**: the kit is in `src/game/outfits/dunstan.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Dunstan / `dunstan` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | support (buff), **fire** (`burn` by reaction): ember red and gold, a faint ember glow at the pennant's edge only |
| Theme | a standard-bearer and drummer who rallies the line |
| Feel | forties, big, warm; booming, sentimental, remembers everyone's name |
| Palette | ember red `0xb8432a`, gold `0xd4a83a`, soot `0x2e2a2a`, drum cream `0xeee2c0`, copper `0xc47a45` |
| Silhouette | a tall plumed cap, a drum at the hip, a barrel chest, tall marching boots: a rallying column, the tallest top of the cast |
| Reads as | **a flag and a beat**: red and gold bindings, a pennant and a tiny drum on everything he carries |
| Face shape (suggestion, never forced) | round |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `drumshako` | a tall flared drum-major cap in ember red: a gold braid band with a red thread in it, a gold top rim, a front badge (a gold three-tongued flame inside a gold ring), a black visor with a gold edge, a gold chin cord looped under the chin with a button at each side, and a plume of eight white feathers with ember tips on a gold socket |
| **Hair** | `goldqueue` | copper hair under the cap: a short fringe and side locks below the rim, and a thick three-strand braided queue down the back bound with three gold cord rings and a gold bead at the tip |
| **Face** | `beatstripes` (mark), `hearty` (eye style), `handlebar` (facial hair) | three ember-red finger stripes on one cheek like drumbeat tallies; warm brown eyes `0x4a2e1c`, a wide bright iris, brows lifted and thick; a waxed copper-dark handlebar moustache with tips curled up |
| **Top** | `rallytabard` | a soot jerkin with a gold-edged stand collar and rank stripes (a red band between two gold lines) on the upper arms and gold cuffs; over it an ember-red tabard front and back, edged in gold, with a gold flame emblem on the chest, a gold hem and a gold seam down the back, flaring to the thigh; a leather belt with a gold-and-red buckle; gold epaulets with red edges and a fringe of gold and red tubes; two leather sling straps crossing chest and back; and **a snare drum at the left hip** (cream head and shell, red hoops, eight brass rods, two sticks) that half-follows the thigh |
| **Bottom** | `stripebreeches` | soot parade breeches flared over the thigh, a gold stripe down each outer seam and a gold knee band |
| **Shoes** | `marchboots` | tall soot marching boots, a gold top rim and a thick gold ring at the cuff, riveted gold studs up the front, a gold toe cap, a brass heel plate, a dark sole |
| **Weapon** | `bannerbind` | one dressing for any weapon: ember-red grips with gold wire, bright steel, dark ash wood, gold flame-notch trim, a swallow-tail pennant and a tiny drum as the charm (below) |

## Builder notes

All of it is in `src/game/outfits/dunstan.js` (the worked example of every kit hook, `docs/CHARACTER.md` section 9). About +20,800 triangles over the base clothes at full detail.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `drumshako` | head | a flared cylinder (radius 0.104 at the top, 0.134 at the brim, 0.16 tall) wide enough that the hair lies under it, painted red with a gold braid band and top rim; the badge is an `ofPatch` (a fine grid, so the flame's edge is crisp) 1.5 mm off the cap; a half-disc visor tilted down; a swept tube for the chin cord (it follows the skull's surface through `F.zAt`); eight `ofRibbon` feathers fanned on a gold socket (their flat faces turn to the front). About 3,000 triangles |
| `goldqueue` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` from the hair tools, then three phase-shifted `sweepTube` strands braided down the back, gold rings (`ofRingAt`) at 14, 50 and 86 percent and a bead at the tip. Length follows Hair length. About 5,000 triangles |
| `beatstripes` | face mark | three thin ellipsoids laid on the left cheek with `F.place`. About 100 triangles |
| `hearty` | eye style | `eyes:{iris:1.05, hl:2, browLift:0.003, browThick:1.2}`. No extra mesh |
| `handlebar` | facial hair | two tapered, curled `sweepTube`s following the skull's surface, waxed copper. About 400 triangles |
| `rallytabard` | top | `paint` (soot jerkin, belt, collar, rank stripes, cuffs, `cuts` for crisp edges); `torso()`: two `ofLoft` panels (front and back, sized with `torsoSize` so the belly and glutes do not poke through) painted red with gold borders, an `ofPatch` carrying the flame emblem, the buckle, two `ofRibbon` sling straps; `shoulder(sd)`: a gold epaulet dome and nine fringe tubes; `forearm(sd)`: two rings at the cuff; `extras`: the snare drum (cylinder, hoops, rods, sticks) on the hips bone, its tilt following the left thigh by half in `rig.anims`. About 11,000 triangles |
| `stripebreeches` | bottom | `paint('thigh'/'shin')` (a gold stripe from the angle round the leg, a knee band) and `thigh(sd)`: a flared `limb` shell. About 2,900 triangles |
| `marchboots` | shoes | `paint('shin'/'foot')` (soot, a gold rim, riveted studs, a gold toe cap, a dark sole), `shin(sd)`: a heel plate and a thick gold ring at the cuff. About 600 triangles |
| `bannerbind` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Dunstan's `bannerbind` |
|---|---|
| Grip and bindings | ember-red `0xb8432a` leather grips with gold wire `0xd4a83a` wound at the ends |
| Metal | bright steel `0xd9e2ea` with gold fittings |
| Wood | dark ash `0x4a3a2c` limbs, shafts and shield rims |
| Accent | ember red bindings and gold caps |
| Trim | a repeating three-tongued flame notch every 4 cm in gold along blades, limbs, rims and shafts |
| Charm | `pennantdrum`: a 4 cm swallow-tail pennant (ember and gold) and a 2 cm drum on a cord hung from the `grip` point |
| Glow | a faint ember `0xff7a3a` along the pennant's lower edge (fire) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.dunstan` in `src/game/outfits/dunstan.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`dunstan`**: The standard-bearer as drawn: tall, a barrel of a body, a big smile.

| Slider | Value |
|---|---|
| `height` (Height) | 1.04 |
| `build` (Build) | 1.12 |
| `chest` (Chest) | 1.05 |
| `shoulders` (Shoulders) | 1.1 |
| `waist` (Waist) | 1.08 |
| `torso` (Torso length) | 1.02 |
| `legs` (Leg length) | 0.97 |
| `thighs` (Thighs) | 1.08 |
| `arms` (Arms) | 1.12 |
| `neck` (Neck) | 1.12 |
| `hands` (Hands) | 1.1 |
| `feet` (Feet) | 1.05 |
| `jaw` (Jaw width) | 1.15 |
| `chin` (Chin) | 1.12 |
| `cheeks` (Cheeks) | 1 |
| `noseSize` (Nose) | 1.1 |
| `mouthSize` (Mouth width) | 1.15 |
| `smile` (Expression) | 0.35 |
| `hairVolume` (Hair volume) | 1.1 |
| `bangs` (Fringe length) | 0.8 |
| `brow` (Brows) | 0.3 |
| `lips` (Lips) | 0.9 |
| `undertone` (Skin undertone) | 0.5 |
| `blush` (Blush) | 0.3 |
| `earSize` (Ear size) | 1.1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.98 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 1.02 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.2 | 0.6 .. 1.4 |
| `waist` (Waist) | 0.95 .. 1.15 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1.06 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.95 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 1 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.1 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.9 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The tabard and the drum sling follow `chest`, `build`, `waist`; the drum hangs from `anchors.hipL` and half-follows the thigh; the pennant charm hangs from the grip and never covers the hands. The shako's chin cord follows `jaw` and `chin`. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a standard-bearer and drummer, a village drum-major. **Deliberately avoids:** a rising-sun emblem or any rayed disc on red (the emblem is a flame), any real nation's flag, crest or regiment colours, a heraldic lion or eagle from a franchise, a famous banner-bearing captain or boss, a toy-soldier or a royal guard's bearskin as a copied costume. A person searches the name "Dunstan" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/dunstan.js` (`CHAR_MODELS.dunstan`, the one reference setup and `OUTFITS.dunstan`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit dunstan [--weapon warrior|archer|mage] [--bent]`; pictures in `img/dunstan.png` and `img/dunstan-head.png`. Checks: `node tools/outfit-smoke.js --only dunstan`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
