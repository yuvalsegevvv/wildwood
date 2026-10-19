# Look: Sorrel (safe DPS, air)

> **Built, not approved**: the kit is in `src/game/outfits/sorrel.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Sorrel / `sorrel` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | safe DPS, **air** (`spread`): pale sky and cream, long loose lines; the only glow is a pale sky glint in a lens |
| Theme | a mountain lookout who waits for one clean shot |
| Feel | twenties, tall, very still; counts her breaths, talks to birds |
| Palette | sky `0x8fb8d8`, cream `0xf1ead8`, slate `0x4a5560`, snow `0xf4f6f8`, feather grey `0xb7c0c9` |
| Silhouette | the tallest and lightest line: loose pale hair and a very long scarf both streaming one way, feathers at the ear and the grip |
| Reads as | **distance and wind**: cream, sky and feathers on everything she carries |
| Face shape (suggestion, never forced) | oval |

## The seven new items

Built in `game/outfits/sorrel.js` (`OUTFITS.sorrel`); every part is two or more colours. Cream, sky and snow carry the light areas, slate and leather the dark ones (the yoke, the belt, the trousers, the knee pads and the boots), so the pale outfit still reads at a distance. The only glow is a small pale-sky glint in one lens of the goggles and one in the weapon's lens (air).

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `ridgeband` | a leather **browband** (slate-brown with cream piping at both edges and brass rivets) that lies on the skin of the forehead and on the hair at the sides and back, and a pair of **brass snow goggles pushed up into the hair** above it: slate cups, brass rims, sky-blue glass with a pale highlight, a brass bridge, tilted up; in the left lens a small unlit pale-sky glint. Behind the right ear: **one long grey-white feather** (snow base, grey vane barred in slate, a sky-grey tip) and a short sky-tipped one behind it, loose, so they sway |
| **Hair** | `galelong` | white-blond `0xece6d4` that fades to pale sky at the ends: a lifted crown with six strands laid over the dome, a fringe parted in the middle and swept out over the temples (so the goggles sit on a clear parting), a short wisp in front of each ear, **two thin plaited braids** at the temples tied with sky thread and ending in a small barred feather, and a **long back curtain with a ridge for every strand** that is blown to the left and back as it falls, ending in nine long bowed locks (separate blades that sway a little and stream further as she moves), down to the waist and hips |
| **Face** | `windstreaks` (mark), `sharp` (eye style) | two faint **windburn streaks** on each cheek, toward the ear (a rose line with a paler line over it); pale sky-grey eyes `0x9fb4c4`, **narrowed and upturned** (lower, wider almond, a smaller iris, a long lash flick, one highlight) |
| **Top** | `lookoutlayers` | a layered tunic: a **cream** body under a **slate yoke** edged in sky piping, a sky centre placket with five cream toggles, slate princess seams, a **leather chest strap** with a brass slide and a carabiner ring on a sky cord, a leather belt with cream piping, a brass buckle and a knotted cord with sky-tipped ends; sleeves with a slate shoulder cap, a sky band between slate lines on the upper arm, **cream bell cuffs lined in sky** that show a sky under-sleeve and a slate wrist band; a sky under-layer collar; and the **very long scarf**: two cream-and-sky striped loops wound (crossing) round the neck, a striped knot at the back left and two **tails, 1.3 m and 1.05 m, streaming back and to the left** with a slate end band and a fringe |
| **Bottom** | `cragtrousers` | slate climbing trousers; a **tunic skirt in two halves that follow the thighs** (cream outside with a snow hem line, sky lining, a slate side panel edged in sky, a sky under-layer showing below the hem, a slate hem cord; longer at the front and back than at the sides); a sky seam cord down the outside of each leg; **leather knee pads** (two pieces, stitched in cream) and a **rope coil** (three turns, cream and leather, with a brass clip) on the front of each hip; the trousers bloused over the boots |
| **Shoes** | `ledgeboots` | climbing boots to mid-calf: a leather upper with a **snow fleece top** (two rings with grey flecks), cream lace rungs over the instep, a pale-leather toe rand and heel cap, a **rope wrapped twice round each ankle** (two twisted strands, cream and dark leather), and a flat welted sole (pale midsole, dark tread, a few leather ribs) a little wider than the shoe |
| **Weapon** | `featherflight` | one dressing for any weapon: cream wax-wrapped grips with sky thread bands, silver-white metal, cream ash wood, sky fittings, slate feather-vein lines every 3 cm along blades, limbs and shafts, and a **wind lens** as the charm (below) |

## Builder notes

Triangle counts are measured at full detail (q 1.1) and are the whole hook plus its loose parts; the build adds about 22,000 over the base clothes (the smoke test's measure: the base hair it replaces accounts for the difference from the sum below). At the detail of other players (q 0.65) the whole character is about 40,600 triangles and at phone detail (q 0.38) about 25,000.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `ridgeband` | head | the band is a three-row grid on the head's sphere (`T.sp`) whose radius depends on the azimuth (skin at the front, hair at the sides and back), run through `T.fit` and painted per vertex, with two cream piping tubes, ten brass rivets and the slate/leather stripe; the goggles are built facing -z (a slate cup, a brass torus rim, a flattened glass ellipsoid painted with a highlight and a darker edge, a brass bridge) and laid on the hair with `F.place` (pushed out by the hair volume so they rest on it, tilted 0.42 rad up); the glint is a flat ellipsoid kept in `glintGeo` and drawn unlit (`matGlow`) in `extras`. The ear feathers are `lockBlade` vanes (bowed, barred, with a quill) on a pivot group at the right ear and sway in `rig.anims`. About 2,700 triangles in the hook and 350 in `extras` |
| `galelong` | hair | the crown (`shell`, tilted 0.5 rad so the forehead is clear), six `lockBlade` strands over it, six `T.scalpLock` fringe locks (none in the middle), two wisps, two plaits (`plait`: three twisted `sweepTube` strands, `ofRingAt` ties, a `feather`), and the back curtain (`loftRings` with a ridge for every strand, `CK` = 16, bent aside by `drift` as it falls). The nine tail blades are `lockBlade`s in `extras` on a pivot group at the curtain's lower end (`rig.head`), so they swing; the colour fades to pale sky with height (`hairFn`). `hairLength` sets the length (`Lh`) and `hairVolume` the width. About 9,900 triangles in the hook and 1,200 in `extras` |
| `windstreaks` | face mark | two tapered streaks on each cheek, each a rose `sweepTube` with a paler one over it (2 mm wide), laid on the skull's front surface with `F.zAt` so they follow the cheek; about 640 triangles |
| `sharp` | eye style | `eyes:{iris 0.82, h 0.7, w 1.1, lash 1.9, hl 1, tilt 0.24}` for the base eye builder (narrower and wider, a smaller iris, a longer lash, upturned), `eyeColor` 0x9fb4c4; no extra mesh |
| `lookoutlayers` | top | `paint` (torso: slate / leather belt / cream / slate yoke / sky collar by design height with cut rings; sleeves cream with the slate cap and the sky band; forearm cream, sky, slate, skin); `torso()`: `surfZ` repeats the torso's own formulas (bust, belly and neck lean included), so the belt (`loftRings` through the front and back), the sky yoke piping, the placket (`ofPatch`), the toggles, the seams, the strap (`ofRibbon`) and the scarf loops (`sweepTube` along `ringAt`) all lie on the real body; `shoulder()`: a slate dome and a sky edge ring; `forearm()`: the bell (a two-sided grid, cream outside and sky inside, flaring from the forearm's own section curve `FA`) with a slate hem ring. The scarf tails are `strip` ribbons (a flat face that turns along the length) with a fringe in `extras`, on the spine at the knot; they stream at rest and stream more when she moves. About 4,350 in the torso hook, 800 in the shoulders, 1,450 in the forearms, 1,100 for the tails |
| `cragtrousers` | bottom | `paint` (thigh slate); `thigh()`: the skirt is a two-sided grid hung in the thigh's own frame (`skirtP`: a ring round the thigh section `TH`, flaring, clear of the glutes and the belly through `torsoSize`-like formulas, 5 rad of arc on the outside, a longer hem at the front and back), so it follows the thigh and cannot be pierced; the under-layer strip, the hem cord, the slate side panel, the seam cord, the rope coil (`ofRingAt` rings) and the upper knee pad. `shin()`: the lower knee pad, the sky seam cord and the bloused ring. About 3,750 for both thighs and 850 for the shin parts |
| `ledgeboots` | shoes | `boot:true` and the `foot` paint (leather upper, pale toe rand and heel cap, lace rungs, dark sole); `shin()`: the fleece rings (two flecked tori scaled to the boot's section `SH`), the two-strand ankle rope (`sweepTube`s along the boot's section curve), the welted sole (a cylinder scaled to the foot's footprint, three height bands: pale midsole, dark tread). About 1,800 triangles for both feet |
| `featherflight` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Sorrel's `featherflight` |
|---|---|
| Grip and bindings | pale wax-wrapped grips `0xf1ead8` with sky `0x8fb8d8` thread bands every 1.4 cm |
| Metal | silver-white `0xd9e2ea` |
| Wood | cream ash `0xe8e0c8` limbs, shafts and rims |
| Accent | sky `0x8fb8d8` thread bindings; white feather tufts at every tip and pommel |
| Trim | a thin slate `0x4a5560` feather-vein line every 3 cm along blades, limbs, shafts and rims, with a sky-blue line halfway between the slate ones |
| Charm | `windlens`: a 2.5 cm glass lens (sky glass with a pale highlight) in a thin silver ring on a cream thread, and a tuft of three barred snow feathers with a sky thread binding beside it, hung from the `grip` point (about 1,700 triangles) |
| Glow | a small pale-sky `0xbfe3ff` glint on the lens only (air), unlit; the goggles carry a second one |

## Slider recommendations

<!-- generated from `CHAR_MODELS.sorrel` in `src/game/outfits/sorrel.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`sorrel`**: The lookout as drawn: tall, slim, long-legged, a cool narrow stare.

| Slider | Value |
|---|---|
| `height` (Height) | 1 |
| `build` (Build) | 1.08 |
| `chest` (Chest) | 0.95 |
| `shoulders` (Shoulders) | 1.15 |
| `waist` (Waist) | 0.95 |
| `hips` (Hips) | 1.08 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 1.05 |
| `thighs` (Thighs) | 1.2 |
| `arms` (Arms) | 1.1 |
| `neck` (Neck) | 1 |
| `jaw` (Jaw width) | 0.9 |
| `chin` (Chin) | 0.95 |
| `cheeks` (Cheeks) | 0.9 |
| `eyeSize` (Eye size) | 0.95 |
| `eyeGap` (Eye spacing) | 1.02 |
| `eyeTilt` (Eye tilt) | 0.12 |
| `brow` (Brows) | 0.25 |
| `noseSize` (Nose) | 0.9 |
| `mouthSize` (Mouth width) | 0.9 |
| `lips` (Lips) | 0.9 |
| `hairLength` (Hair length) | 1.3 |
| `hairVolume` (Hair volume) | 1.15 |
| `bangs` (Fringe length) | 0.7 |
| `undertone` (Skin undertone) | -0.2 |
| `blush` (Blush) | 0.3 |
| `smile` (Expression) | 0.15 |
| `earSize` (Ear size) | 1 |
| `head` (Head size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.95 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.13 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.2 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.85 .. 1.05 | 0.82 .. 1.15 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.82 .. 1.15 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.92 .. 1.08 | 0.9 .. 1.12 |
| `eyeSize` (Eye size) | 0.9 .. 1.15 | 0.9 .. 1.3 |
| `eyeTilt` (Eye tilt) | 0.05 .. 0.7 | -0.7 .. 0.7 |
| `hairLength` (Hair length) | 1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.25 | 0.9 .. 1.25 |

## Body fit

The scarf tails and the tunic skirt follow `neck`, `shoulders`, `chest`, `hips`; the tails sit on the outer back so an arm or a quiver never intersects them at any `arms` or `build` in range. The goggles' band and the feather follow the head scale. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a mountain lookout and marksman. **Deliberately avoids:** the signature cloak, hood or mask of any existing archer character, a hawk or other bird companion as a design element (she only "talks to birds"), goggles of a famous pilot or inventor, a single trailing scarf of a famous hero (the scarf is cream and sky striped, wound twice, and very long). A person searches the name "Sorrel" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/sorrel.js` (`CHAR_MODELS.sorrel`, the one reference setup and `OUTFITS.sorrel`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit sorrel [--weapon warrior|archer|mage] [--bent]`; pictures in `img/sorrel.png` and `img/sorrel-head.png`. Checks: `node tools/outfit-smoke.js --only sorrel`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
