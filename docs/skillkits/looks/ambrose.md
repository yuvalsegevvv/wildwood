# Look: Ambrose (healer, water)

> **Built, not approved**: the kit is in `src/game/outfits/ambrose.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Ambrose / `ambrose` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | healer, **water** (`slow`): river green and shell white, a faint aqua glow in the vials only; soft, rounded shapes |
| Theme | a marsh herbalist and field medic |
| Feel | thirties, soft-spoken, tired; smells of mint, dislikes fighting and is good at it anyway |
| Palette | river green `0x4f7a6a`, shell white `0xe6ecea`, clay `0xa57b55`, aqua `0x7fd0d8`, reed `0xcdbd8a` |
| Silhouette | a soft triangle: a tall reed cone carried on the back, a knee-length apron-robe that flares, a satchel and a belt of vials at the hip; no hard edges |
| Reads as | **tending**: reed, linen, shell and glass on everything he carries; nothing sharp |
| Face shape (suggestion, never forced) | round |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `marshwrap` | a white linen head-wrap with a green thread along both edges, standing proud of the hair all round and knotted at the **left** temple (a plump knot, two loops and two short tails with green ends) with a sprig of mint tucked in it; and a **tall woven reed cone hat** (a wide brim edged in green, a river-green dyed band, radial ribs and ring stripes, a shell-white knob) **slung on the back** by a cord that runs over the shoulder blades to a ring at the neck, so the hair shows |
| **Hair** | `reedknot` | brown hair with warm streaks: a short fringe that ends above the wrap, loose strands framing each temple (a side lock and two thin strands per side), the rest gathered into a **low knot at the nape** wound with strands and pinned with a **pale reed** (dark nodes along it) that stands out on both sides, two loose ends below the knot |
| **Face** | `claydab` (mark), `soft` (eye style) | a thumb-smear of marsh clay on the left cheekbone (a darker rim, the print of three fingers dragged through it) with two drips; warm green eyes `0x3f6b3a`, gentle: the outer lid drooping a little (a skin-coloured lid with a fine line), a large low highlight in the iris, tilt -0.14, brows lifted at the inner end |
| **Top** | `fordrobe` | a **river-green apron-robe** open at the front (a V that widens to the chest) over a **shell-white shirt** (V neck, shell buttons, a rolled collar, sleeves rolled to the elbow with a green garter on each upper arm and linen wraps on the wrists); shell-white piping, a sewn-on patch with a reed leaf on the left chest; a **skirt of two half-robes** with a shell-white hem and a reed-coloured wave (hung from the thigh bones), a short apron flap in front and behind; a leather belt with a brass-shell buckle and a **belt of five glass vials** that glow faintly aqua; a **herb satchel** on the left hip (canvas, a green scalloped flap, a shell button, herbs sticking out) on a strap across the chest and the back |
| **Bottom** | `waderlegs` | clay-coloured breeches to above the knee, ending in a thick rolled cuff and a leather tie; bare calves with **leather shin guards** (curved plates with a dark edge) held by two straps each with brass-shell buckles |
| **Shoes** | `fordboots` | wide, soft river-green wading boots with soft creases, a pale reed lining **folded over** at the top (a rounded fold and a green edge), a leather ankle strap, a broad thick dark sole with a reed thread, and a pale patch of dried mud on the outer side |
| **Weapon** | `reedtend` | one dressing for any weapon: reed-and-linen wrapped grips, willow wood, shell-brass metal, green thread bindings, a wave trim, the mage's orb a soft aqua, and a charm of a drying herb bundle, a little shell bell and a glowing glass vial (below) |

## Builder notes

All numbers are triangles at the detail of the hiker in the editor (`q` 1.1); the whole outfit adds about 18,800 over the base clothes (`node tools/outfit-smoke.js --only ambrose`). Everything has two or more colours.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `marshwrap` | head hook + a loose mesh on the spine | **the wrap**: a grid band (8 rows across, green edge stripes, a faint linen weave) laid on the skull by `T.fit` at the hairline (higher on the brow, lower at the nape, standing 1.5 cm off the hair at the sides so locks never cover it); the knot, its loops and tails and the mint sprig (a stem and three leaves with a darker vein) sit on the band's surface at the left temple; about 1,700 triangles. **The hat** (`extras`, a double-sided mesh on `rig.spine`): a lathe cone (radius 0.225, height 0.16) with its colour edges on rows of their own (reed body, green band, dark reed rim), a green rim ring, a knob, tilted back 1.15 rad and hung at the shoulder blades with its brim clear of the back; two cords to a ring at the neck (in `torso`); about 1,700 triangles |
| `reedknot` | hair | a cap, six fringe locks that end above the wrap, a side lock and two thin strands each side, 12 back locks running down and in to the nape, the knot (an ellipsoid with a strand pattern, three wound strands, two loose ends) and the reed pin (a tapered tube painted with nodes); length follows **Hair length**, bangs follow **Bangs**; about 10,000 triangles (all the hair) |
| `claydab` | face mark | an ellipse (1.8 x 1.2 cm, clay with a darker rim) on the left cheekbone placed by `place()`, three finger streaks, two drips; about 400 triangles |
| `soft` | eye style | `eyes` `{iris 1.08, h 0.94, w 1.04, lash 0.8, hl 1, tilt -0.14, browAngle -0.2, browThick 0.9}` plus, in `mark`, a drooping outer lid (a skin-coloured ellipsoid with a fine line along its edge) and a large low highlight on each eye, rotated with the eye's tilt; about 1,000 triangles |
| `fordrobe` | torso, shoulder, forearm hooks and `extras` | **robe**: a grid over the torso's real size (`torsoSize`, 8.5 mm off the body) from the hips to the neck, a front opening that widens to a V, a darker yoke band at the neck, soft pleats; the piping is a tube along the opening and the neckline; **badge**: a fine grid (`ofPatch`) with a reed leaf; **shirt**: V neck painted on the torso, five shell buttons, a rolled collar ring; **belt** (a band with dark edges and a buckle on a fine patch); **strap**: two flat bands (front and back) with per-point normals so the flat face always looks outward; **sleeves**: a green garter and a thin reed ring on each upper arm (`shoulder`), a rolled cuff and three linen wraps on each forearm; about 3,900 + 600 + 1,350 triangles. **Skirt** (`extras`): one double-sided cloth shell per thigh, open at the front and at the back centre, flaring 4.6 cm at the hem, hung from the **thigh bones** (`rig.hipL/hipR`) so a swinging leg never pierces it; the hem band, the front-edge piping and the wave are strips of their own (crisp edges); about 900 each. **Flaps**: a short apron panel in front and behind the pelvis on `rig.hips` that half-follows the thighs (front: the more forward thigh, back: the more backward one); about 400 each. **Satchel** (`rig.spine`, swings a little): a rounded extruded bag, a scalloped flap, a shell button, four herb sprigs (leaves with a vein, a yarrow head, a dried clay-coloured spray); about 1,600. **Vials**: five groups hung from the belt (a cork, a shell collar, a cap; the glass is a small `matGlow` ellipsoid, pale aqua, **no light**), each swaying a little; about 1,400 together |
| `waderlegs` | thigh and shin hooks | the leg paint (clay with soft folds to above the knee, skin below), a thick rolled cuff (two tori) and a leather tie on each thigh; two **shin guards** per leg: a curved plate over the front half of the calf (grid on the shin's own sections, dark edge) and two straps (a ring band each) with a brass-shell buckle; about 1,000 + 900 triangles |
| `fordboots` | shin hook | the shin's boot shape is the base `boot:true` one; over it a shaft shell (soft creases, wider than the leg), the folded cuff (a grid flaring out, a rounded fold ring, a green edge ring), an ankle strap, a foot upper that follows the base foot's outline 6 mm wider and a thin dark sole lens with a reed thread (both closed at the heel and the toe); the mud patch is painted on the upper; about 2,200 per foot |
| `reedtend` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Ambrose's `reedtend` |
|---|---|
| Grip and bindings | grips in reed `0xcdbd8a` with a shell-white linen wrap every 1.1 cm |
| Metal | pale shell-brass `0xdfe4d8` |
| Wood | willow `0x8a7a4a` limbs, shafts and rims |
| Accent | river green `0x4f7a6a` thread bindings (bow tips, guards, quiver bands) |
| Trim | a repeating wave band (a `sin` every 4 cm) in river green along blades, limbs and shafts, a reed-coloured trough |
| Charm | `herbvial`: a drying herb bundle (four stems, leaves, a shell-white thread), a tiny scallop-shell bell with a brass rim and a dark clapper, and a 2 cm glass vial (cork, shell collar) on three short cords from the `grip` point; the bell is silent; about 500 triangles |
| Glow | the vial's glass only, aqua `0x7fd0d8` family (unlit, never a light); the mage's orb takes the soft aqua `0x8fd6dc` instead of the tier's colour |

## Slider recommendations

<!-- generated from `CHAR_MODELS.ambrose` in `src/game/outfits/ambrose.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`ambrose`**: The scout as drawn: a slight youth with big hands, big feet and a big head.

| Slider | Value |
|---|---|
| `build` (Build) | 0.88 |
| `shoulders` (Shoulders) | 0.92 |
| `waist` (Waist) | 0.9 |
| `hips` (Hips) | 0.95 |
| `torso` (Torso length) | 0.98 |
| `arms` (Arms) | 0.95 |
| `hands` (Hands) | 1.15 |
| `head` (Head size) | 1.1 |
| `jaw` (Jaw width) | 0.95 |
| `chin` (Chin) | 0.95 |
| `cheeks` (Cheeks) | 1.15 |
| `eyeSize` (Eye size) | 1.18 |
| `eyeGap` (Eye spacing) | 1.02 |
| `eyeTilt` (Eye tilt) | -0.25 |
| `brow` (Brows) | -0.6 |
| `lips` (Lips) | 1.1 |
| `smile` (Expression) | 0.5 |
| `hairLength` (Hair length) | 1.1 |
| `bangs` (Fringe length) | 0.8 |
| `blush` (Blush) | 0.55 |
| `undertone` (Skin undertone) | -0.2 |
| `noseSize` (Nose) | 0.9 |
| `earSize` (Ear size) | 1.28 |
| `height` (Height) | 0.93 |
| `chest` (Chest) | 0.9 |
| `legs` (Leg length) | 1 |
| `feet` (Feet) | 1.15 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `build` (Build) | 0.88 .. 1.15 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.7 .. 1.3 | 0.6 .. 1.9 |
| `shoulders` (Shoulders) | 0.88 .. 1.1 | 0.88 .. 1.18 |
| `waist` (Waist) | 0.85 .. 1.15 | 0.82 .. 1.15 |
| `hands` (Hands) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.12 | 0.9 .. 1.12 |
| `eyeTilt` (Eye tilt) | -0.5 .. 0.2 | -0.7 .. 0.7 |
| `brow` (Brows) | -0.65 .. 0.2 | -0.7 .. 0.7 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |

## Body fit

The robe's skirt is two shells that hang from the thigh bones, so a swinging leg never pierces it (the apron flaps in front and behind half-follow the thighs); the satchel sits at the left hip on its own swinging group, its strap routes over the right shoulder at any `shoulders` in range; the reed cone hangs on the spine with its brim clear of the back and the nape knot. The robe, belt, strap and flaps read the body through `torsoSize`, so they follow `build`, `waist`, `hips`, `chest` and `shoulders`. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme (checked by the smoke test).

## IP check

Original. **Riffs on:** a marsh herbalist and field medic. **Deliberately avoids:** the snake-and-staff medical symbols (no serpent, no winged staff), a red-cross or any cross emblem, a named healer character's robe, staff or hat, a hospital-style cap, a swirl-shaped mark. A person searches the name "Ambrose" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/ambrose.js` (`CHAR_MODELS.ambrose`, the one reference setup and `OUTFITS.ambrose`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit ambrose [--weapon warrior|archer|mage] [--bent]`; pictures in `img/ambrose.png` and `img/ambrose-head.png`. Checks: `node tools/outfit-smoke.js --only ambrose`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
