# Look: Sazanka (risk DPS, dark + air)

> **Built, not approved**: the kit is in `src/game/outfits/sazanka.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Sazanka / `sazanka` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | risk DPS, **dark + air** (a hybrid: `weak` and `spread`): ink and indigo for the dark, a pale moon-grey for the air; the glow is dark violet with white wisps |
| Theme | a night courier of lantern-lit streets (the shadow-runner genre) |
| Feel | twenties, lean, quick; wry, never explains herself |
| Palette | ink `0x1b1f2a`, indigo `0x2f3f6b`, vermilion `0xc23b2a` (cords and trim only, never a large area), moon-grey `0xc9ccd6` |
| Silhouette | the narrowest and lowest of the eight: a peaked hood with a tall collar, one long side lock, a cord sash with two trailing tails, bound limbs: a runner caught mid-stride |
| Reads as | **fast and fragile**: matte black and indigo with thin lines of cord, light colours only at the sash tails and the tassels |
| Face shape (suggestion, never forced) | oval |

## The seven new items

Built in `game/outfits/sazanka.js` (`OUTFITS.sazanka`); every part is two or more colours, vermilion is only ever a thin cord, and the only light colours are the sash tails and the tassels (moon-grey). The small glow (dark violet + white-blue wisps) is on the hood's peak and on the weapon's tag.

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `duskhood` | a close ink hood pushed back off the face: a dome (front panel a shade lighter, a deep-indigo hem band, an indigo lining) whose rim sits on the brow with a small dip, arches over the ears and falls to a V at the nape; a **peak** that curls up and back from the dome and droops at its tip, tied with a vermilion cord, a vermilion bead and a moon-grey tassel hanging from it, and a **violet glow bead with two white-blue wisps circling** it; a thin vermilion cord round the rim and a seam cord over the crown; on the right one drawstring with a vermilion bead and a moon-grey tassel. The **tall stand collar** that goes with it is part of the top (below) so that it stays on the shoulders when the head turns: an ink tube with an indigo band and lining at its edge, a vermilion cord on the edge and a vermilion frog knot at the front, low in front (below the chin) and rising to the jaw at the sides and the back |
| **Hair** | `cordlock` | blue-black (`0x1b1c27`) with an indigo sheen band across the crown and a glossy streak: a short crop under the hood, a long jagged fringe of eight pointed locks of different lengths coming out under the hood's rim, a short jagged lock in front of the right ear, and **one long lock on the left** from under the hood over the collarbone to the chest, tied with three vermilion cords (the first with two cord ends); its length follows **Hair length** |
| **Face** | `tally` (mark), `slit` (eye style) | three short ink tally ticks under the right eye; violet-grey eyes (`0x8a86a8`) with **narrow vertical slit pupils** (an ink slit with a lighter ring, drawn as a fine patch over each iris and over the base eye's round pupil), a narrower, wider, upturned almond with a long sharp lash and one highlight |
| **Top** | `runnerwrap` | a deep-indigo **crossover wrap** with ink flanks and ink sleeves: two lapel bands (light indigo, a vermilion cord edge each side) that cross on the chest, the stand collar, a thin vermilion ring on each upper arm, **cord-wound bracers** on both forearms (an indigo shell with ink ends and a six-turn vermilion spiral), a low **cord sash** (indigo band with ink edges and two vermilion cords) with a knot at the left hip from which **two moon-grey tails** hang, each edged in vermilion cord, with a five-petal camellia (vermilion, a darker outline, a gold centre) embroidered near the end; they hang from the left thigh's bone, swing, and trail back when she runs; and a flat **message pouch** on the right hip (ink leather, an indigo flap with a vermilion hem and toggle, two cords to the sash) |
| **Bottom** | `taperwraps` | deep-indigo leggings (a little lighter on the front of the leg), a vermilion seam cord down the outside of each leg, a **loose thigh-flap** on the front-outer side of each leg (ink edges and a deep-indigo face, a light-indigo lining that shows as it flares, a notched hem edged in vermilion), and **cord wraps from the ankle to just below the knee**: an ink shell with diagonal indigo bands and an eight-turn vermilion spiral, tighter round the ankle |
| **Shoes** | `softstalks` | soft low shoes: an ink upper with an indigo toe box, a thin grey-blue sole, a **split toe** (a dark groove between the big toe and the others), the ankle cord of the wraps knotted with a vermilion bead on the outside |
| **Weapon** | `cordsheath` | one dressing for any weapon: black lacquer, vermilion cord spirals on every grip, an indigo inlay band every 6 cm with a tiny vermilion dot, dark steel, and a wooden courier's tag as the charm (below) |

## Builder notes

Triangle counts are measured at full detail (q 1.1) and are the whole hook; the build adds about 20,100 over the base clothes (the smoke test's measure: the base hair it replaces accounts for the difference from the 29,500 below).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `duskhood` | head | a grid dome over the skull (polar rows by azimuth: the rim's polar angle is a function of the azimuth, so it rises over the ears and falls at the nape; radius 0.127, up to 0.143 at the back with a swell toward the peak) run through `T.fit` (sculpt + face scale) and drawn twice (outer, and an inward-offset lining with flipped winding: `lining`); colours baked per vertex by `finish`; the peak is a `sweepTube` cone (`PK`); the rim and seam cords are tubes fitted the same way; tassels are `tuft`s of thin tubes; the drawstring is a tube from the rim at the right temple. In `extras` the **violet bead** (a `matGlow` sphere) and two **wisps** (tapering helix tubes, white-blue fading to violet, `matGlow`) hang at the peak's tip in the head's frame and turn and bob. About 4,300 triangles (+500 for the glow) |
| `cordlock` | hair | the crop (a thin fitted shell), the fringe (`T.scalpLock` ribbons, 8 of them, starting just under the hood's rim so that they come out of it), the short right lock, and the long left lock (a `sweepTube` from under the hood to the chest, `hang`ed so the sculpt does not squeeze it) with three `ofRingAt` cords; everything is painted with `paint` using the normals for the glossy streak (`hp2`). About 4,700 triangles |
| `tally` | face mark | three thin ink ellipsoids laid with `F.place` under the right eye; part of `mark`, with the slit patches (about 100 triangles) |
| `slit` | eye style | `eyes:{iris 0.92, h 0.9, w 1.1, lash 1.6, hl 1, tilt 0.12}` for the base eye builder, plus, in `mark`, a fine `ofPatch` over each iris that lies half a millimetre in front of the iris and of the round pupil (a surface that follows the front-most of the two), painted with the iris colours, an ink slit and a lighter ring, turned with the eye's tilt and placed with `F.place`. About 1,400 triangles |
| `runnerwrap` | top | `paint` (torso: deep indigo with ink flanks; sleeves ink to `WRIST`); `torso()`: the stand collar (a grid whose topline depends on the angle, `collarTop`, offset from the real neck surface), its lining and edge cord, the frog knot, two lapel bands that lie on the real body surface (`surfZ` repeats the torso's own formulas, bust, hips and neck lean included, for either sex), the sash band and cords (`ringAt`) and the knot; `shoulder()` the arm rings; `forearm()` the bracers (`FA` is the forearm's section curve; the spiral is a tube); `extras`: the two tails (flat `ofRibbon`s facing out and forward so they read from the front, edge cords, a camellia on a fine patch) parented to `rig.hipL` (the left thigh's bone, so the thigh cannot swing through them; the knot sits on the thigh's axis, so it does not move) and animated (they trail back with speed and flutter), and the pouch (rounded extruded shapes) on `rig.hipR`. About 5,800 (torso) + 600 (shoulders) + 2,500 (bracers) + 2,600 (tails and pouch) triangles |
| `taperwraps` | bottom | `paint` (thigh and shin indigo); `thigh()`: the flap is a grid hung in the thigh's own frame (so it swings with the thigh), 0.6 rad from the front toward the outside, flaring away from the leg, with a lining and a hem cord, and the seam cord down the outer side (`TH` is the thigh's section curve); `shin()`: the wrap shell (`SH`, the shin's section curve, 2 mm off it), diagonal paint, the spiral cord and the ankle knot. About 1,900 (flaps and seams) + 5,100 (wraps) triangles |
| `softstalks` | shoes | `boot:false` (the low shoe) and the `foot` paint: ink upper, indigo toe box, sole, the split groove; the cord at the ankle belongs to the wraps. No extra triangles |
| `cordsheath` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Sazanka's `cordsheath` |
|---|---|
| Grip and bindings | black lacquer `0x1e1c22` grips wound in a vermilion `0xc23b2a` cord spiral (alternating 4 mm bands) |
| Metal | dark steel `0x4a5260` |
| Wood | black lacquer limbs, shafts and shield rims |
| Accent | indigo `0x2f3f6b` |
| Trim | an indigo inlay band every 6 cm along blades, limbs and shafts, with a tiny vermilion dot between the bands |
| Charm | `courierstag`: a wooden delivery tag (about 4 cm, with a notch, a hole and three ink tally ticks: her mark) on a vermilion cord, a moon-grey tassel beside it |
| Glow | a faint dark-violet `0x5a4cc0` edge round the tag and two thin white-blue `0xdfe8ff` wisps below it (dark and air), unlit |

## Slider recommendations

<!-- generated from `CHAR_MODELS.sazanka` in `src/game/outfits/sazanka.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`sazanka`**: The courier as drawn: small, long-legged, narrow-eyed.

| Slider | Value |
|---|---|
| `height` (Height) | 0.95 |
| `build` (Build) | 0.9 |
| `chest` (Chest) | 0.85 |
| `shoulders` (Shoulders) | 0.93 |
| `waist` (Waist) | 0.88 |
| `torso` (Torso length) | 0.97 |
| `legs` (Leg length) | 1.12 |
| `thighs` (Thighs) | 0.95 |
| `arms` (Arms) | 0.9 |
| `neck` (Neck) | 0.95 |
| `hands` (Hands) | 0.95 |
| `feet` (Feet) | 0.95 |
| `jaw` (Jaw width) | 0.92 |
| `chin` (Chin) | 0.95 |
| `cheeks` (Cheeks) | 0.95 |
| `eyeSize` (Eye size) | 1.1 |
| `eyeHeight` (Eye height) | 0.05 |
| `eyeTilt` (Eye tilt) | 0.5 |
| `brow` (Brows) | 0.3 |
| `noseSize` (Nose) | 0.9 |
| `mouthSize` (Mouth width) | 0.9 |
| `lips` (Lips) | 1 |
| `smile` (Expression) | 0.35 |
| `hairLength` (Hair length) | 0.9 |
| `bangs` (Fringe length) | 1.1 |
| `blush` (Blush) | 0.4 |
| `earSize` (Ear size) | 1.15 |
| `undertone` (Skin undertone) | 0.2 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.92 .. 1.04 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.05 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.1 | 0.6 .. 1.4 |
| `shoulders` (Shoulders) | 0.88 .. 1.05 | 0.88 .. 1.18 |
| `thighs` (Thighs) | 0.85 .. 1.1 | 0.85 .. 1.25 |
| `arms` (Arms) | 0.82 .. 1.1 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.85 .. 1.1 | 0.85 .. 1.2 |
| `hands` (Hands) | 0.85 .. 1.1 | 0.85 .. 1.2 |
| `head` (Head size) | 0.92 .. 1.06 | 0.9 .. 1.12 |
| `eyeTilt` (Eye tilt) | 0.1 .. 0.7 | -0.7 .. 0.7 |
| `hairLength` (Hair length) | 0.7 .. 1.05 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.1 | 0.9 .. 1.25 |

## Body fit

The hood, sash and pouch follow `chest`, `waist`, `hips`; the hood must clear the long lock (it leaves through the rim's left cut); the bracers and wraps follow `fore` and `shin`; the shoes follow `feet`. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a night courier and rooftop runner (the shadow-runner *genre*). **Deliberately avoids:** a metal village-crest forehead protector, an orange jumpsuit, a red-on-black cloud pattern, whisker or fang marks on the cheeks, a face mask over one eye, a hooked or spiral eye pattern, a named clan crest. A person searches the name "Sazanka" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/sazanka.js` (`CHAR_MODELS.sazanka`, the one reference setup and `OUTFITS.sazanka`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit sazanka [--weapon warrior|archer|mage] [--bent]`; pictures in `img/sazanka.png` and `img/sazanka-head.png`. Checks: `node tools/outfit-smoke.js --only sazanka`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
