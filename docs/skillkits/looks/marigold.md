# Look: Marigold (mixed: safe DPS + support, light)

> **Built, not approved**: the kit is in `src/game/outfits/marigold.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Marigold / `marigold` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | mixed (safe DPS + support, mild), **light**: warm stage light from paper lanterns (the crown, the weapon charm); saturated colours, the most colourful of the cast |
| Theme | a stage idol / magical girl (the genres; everything original): a theme idea, not a kit |
| Feel | twenties, small, bright; radiant on a stage, shy off it, always looks for the first row |
| Palette | marigold `0xe59a2b`, cream `0xfff2d6`, plum `0x5a2a4a`, glow `0xffd36b` |
| Silhouette | a little stage: a ring of small lanterns above the head, high twin tails with ribbons, a short puffed-sleeve jacket over a layered skirt |
| Reads as | **performance**: ribbons, tassels and gold filigree on everything she carries |
| Face shape (suggestion, never forced) | round |

## The seven new items

Built in `src/game/outfits/marigold.js` (triangle counts at full detail, the hiker's `q` = 1.1; the whole outfit is about **+20,000** over the base clothes, the smoke test measures it).

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `lanterncrown` | a thin gold halo ring a hand's breadth above the hair with six paper lanterns hanging from it on gold cords, turning slowly (0.42 rad/s, with a small bob): each lantern is a tall ribbed paper body (warm glow gold in the middle, cream-gold at the ends, eight marigold ribs; unlit `matGlow`, never a light) with a gold top cap, a marigold bottom cap and a plum-and-marigold tassel ending in a gold bead. About 2,900 triangles (1,900 lit, 1,000 glow) |
| **Hair** | `ribbontails` | marigold orange `0xe59a2b` with lighter tips: a straight fringe, side locks and a short back, two high twin tails that rise from a gathered tie, arc out past the cheek, fall and end in a drill curl (a 1.75-turn helix closing in); a plum band with a marigold edge where each curl starts, a gold bead at the tip; a plum bow with marigold rims, a gold bead and two trailing ribbons at each tie; an antenna strand that sways (a separate part, see the builder notes). About 10,600 triangles in all (6,400 are the shared hair tools, 4,200 are the tails, bands, beads and bows) |
| **Face** | `lanternglyph` (mark), `bright` (eye style) | a tiny gold lantern glyph (marigold body, gold caps, a bead) under her left eye; big, glossy hazel eyes `0x8a5a2e`: an iris 1.15 times larger, a soft lash, tilt +0.1, and a lantern-shaped highlight (cream body, gold caps) at the lower right of each iris besides the round one. About 470 triangles |
| **Top** | `curtainjacket` | a short plum bolero, pleated like a curtain (light-plum ridges), open in a V down the front, flaring into a scalloped hem, with marigold piping all round, over a cream bodice laced up the front (marigold laces crossing between two gold rails over a plum tongue) with a gold lantern button; a cream ruffled collar with a plum ribbon band, a marigold scalloped edge, a small plum bow and a gold bell at the throat; plum puffed sleeves with marigold piping and a cream frill with a plum edge; cream wrist frills with a marigold ring and a tiny gold bell; a plum waist sash edged in marigold with a big cream back bow (marigold rims, plum knot) whose two cream-and-plum tails lie on the skirt; a gold lantern badge with two tassels between the shoulder blades. About 7,900 triangles |
| **Bottom** | `footlightskirt` | a bell of three tulle tiers on one flaring cone, cream (longest), plum and marigold (shortest), pleated, each hem ruffled and scalloped in the next colour (plum, marigold, cream); two plum-and-marigold sash streamers at the hips; cream thigh-high stockings with a plum garter band and a scalloped cream frill with a plum edge and a little plum bow with marigold rims on the outer side at the top. About 3,700 triangles (skirt and streamers 2,300, stockings 1,400) |
| **Shoes** | `bellboots` | tall plum lace-up boots: a cream tongue between two gold rails with marigold laces crossing, a marigold band at the ankle, a gold rim at the top with a cream lace frill standing up (marigold edge) and three tiny gold bells on gold cords, a gold toe cap with a marigold back edge, a dark-plum sole. About 3,400 triangles for the pair |
| **Weapon** | `stagetrim` | one dressing for any weapon: plum grips wrapped with marigold, cream lacquer limbs and shafts, pale-gold metal, marigold accents, gold filigree bands, a paper lantern charm with a gold cap, a plum tassel and two plum-and-marigold ribbons (below). About 880 triangles for the charm |

An optional **encore look** (a client-only swap while a long effect lasts: ribbons trailing from the sleeves, the jacket turning cream with marigold trim) is **not specified here**: it belongs to the set's third piece, which is not designed (no skill is touched).

## Builder notes

All geometry is in one file, `src/game/outfits/marigold.js`, inside the `OUTFITS.marigold` factory. The torso's real surface is rebuilt in it (`bodyXZ` / `bodyAt`: the same formulas as `buildTorso`, bust, shoulder blades and glutes included), so the jacket, collar, sash, lacing and badge lie on the body at a fixed distance on every slider setting; cloth is made by `surf` (a grid surface with rows 1 mm apart where a colour edge must be crisp, baked colours), `ruff` (scalloped frills) and `bow`.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `lanterncrown` | head | `extras`: a gold torus (radius 0.15 head units) 0.18 above the skull's top under `rig.head`, six lanterns on gold cords in two meshes: lit (`matChar`: ring, cords, caps, tassels) and glow (`matGlow`, unlit vertex colours, **no light source**); a `rig.anims` function turns the group (0.42 rad/s) and bobs it 4 mm. `head()` itself returns nothing (everything here moves). About 2,900 triangles |
| `ribbontails` | hair | `hair(F, T)`: the shared tools `T.crown`, `T.fringe(8, 1, 0.03)`, `T.sideLocks`, `T.backLocks(8)`, plus two tubes (`sweepTube`, about 1,060 triangles each: tie stalk, arc, fall, a helix curl, radius following Hair volume, length following Hair length, tip lightened in the paint) hung with `T.hang`, a plum ring and a marigold ring where the curl starts, a gold bead at the tip and a `bow` (two lens-shaped loops drawn from both sides, a knot, two ribbons) at each tie, turned out a little; the parts hung on the tails use the head's width factor. The antenna strand is a separate mesh in `extras` (a tapered tube from the front of the crown, about 400 triangles) whose group sways and bounces with the walking speed |
| `lanternglyph` | face mark | `mark(F)`: an ellipsoid, two caps and a bead (about 150 triangles) laid on the skull at x = -0.052, y = -0.047 with `F.place`; the same hook adds the two lantern-shaped highlights (about 320 triangles) at the eyes' own positions and tilt |
| `bright` | eye style | `eyes: {iris: 1.15, hl: 1, tilt: 0.1, lash: 0.85, h: 1.04}`, `eyeColor` 0x8a5a2e; no extra mesh besides the highlights above |
| `curtainjacket` | top | the torso paint is cream; `torso()` adds the jacket (a grid of 15 x 43 over the body, margin 5.5 mm, 14 pleats, scalloped hem; 1,400), its marigold piping (a tube round the V edges and the hem; 560), the collar (440), the sash (440), the lacing and button (1,250), the back bow with two streamers (730), the neck bow with its bell (530) and the badge (600); `shoulder(sd)` the puffed sleeve (a lofted ellipsoid of 1.4 x the arm, gathered at the cuff, with a marigold ring and a cream frill; 670 each); `forearm(sd)` the wrist frill, ring and bell (300 each). The upper arm is painted plum under the sleeve and skin below it. About 7,900 triangles |
| `footlightskirt` | bottom | `hips()`: three `surf` layers on one cone (top = the waist at the sash, hem ring 0.255 or more by the hips and thigh width, so the swinging thighs stay inside it; each layer 1.3 cm outside the one under it, a pleated cone with a scalloped ruffle in the next colour, rows 1 mm apart at the edge colour) and two sash streamers lying on the skirt; `thigh(sd)`: the stocking frill and the small bow; the thigh is painted skin above the stocking top and cream below it with a plum garter band. About 3,700 triangles |
| `bellboots` | shoes | `paint` (plum, marigold ankle band, dark sole, cream above the boot top) and `shin(sd)`: the tongue, rails and laces follow the shin's own cross-section (`mkAt`: the same smooth curve `limb` draws), the top rim, frill and three bells hang from the boot top, the toe cap is a shell made of the shoe's own rings 7% larger. 1,700 each |
| `stagetrim` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Marigold's `stagetrim` |
|---|---|
| Grip and bindings | plum `0x5a2a4a` with marigold stripes wound round it (every 1.6 cm) |
| Metal | pale gold `0xf2dca0` |
| Wood | cream lacquer `0xfff2d6` limbs, shafts and rims |
| Accent | marigold `0xe59a2b` guards, bindings and caps |
| Trim | gold bands every 5 cm along blades, limbs, rims and shafts with a thin marigold line half a step off each |
| Charm | `paperlantern`: a 3 cm ribbed paper lantern on a gold cord with a gold top cap, a marigold bottom cap, a plum-and-marigold tassel and two short plum-and-marigold ribbons, hung from the `grip` point (about 880 triangles) |
| Glow | the lantern's body, warm `0xffd36b` (light), unlit |

## Slider recommendations

<!-- generated from `CHAR_MODELS.marigold` in `src/game/outfits/marigold.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`marigold`**: The idol as drawn: small, big-headed, huge bright eyes.

| Slider | Value |
|---|---|
| `height` (Height) | 0.97 |
| `build` (Build) | 0.92 |
| `chest` (Chest) | 1.15 |
| `shoulders` (Shoulders) | 0.95 |
| `waist` (Waist) | 0.85 |
| `torso` (Torso length) | 0.97 |
| `legs` (Leg length) | 1.12 |
| `thighs` (Thighs) | 1 |
| `arms` (Arms) | 0.95 |
| `neck` (Neck) | 1.05 |
| `hands` (Hands) | 1 |
| `feet` (Feet) | 1 |
| `head` (Head size) | 1 |
| `jaw` (Jaw width) | 0.9 |
| `chin` (Chin) | 0.88 |
| `cheeks` (Cheeks) | 1.2 |
| `eyeSize` (Eye size) | 1.2 |
| `eyeGap` (Eye spacing) | 1.04 |
| `eyeHeight` (Eye height) | -0.2 |
| `eyeTilt` (Eye tilt) | 0.1 |
| `brow` (Brows) | -0.1 |
| `noseSize` (Nose) | 0.75 |
| `mouthSize` (Mouth width) | 0.9 |
| `lips` (Lips) | 1.1 |
| `smile` (Expression) | 0.6 |
| `hairLength` (Hair length) | 1.2 |
| `hairVolume` (Hair volume) | 1.15 |
| `blush` (Blush) | 0.85 |
| `undertone` (Skin undertone) | 0.4 |
| `earSize` (Ear size) | 0.9 |
| `hips` (Hips) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.92 .. 1.07 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.15 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.25 | 0.6 .. 1.4 |
| `shoulders` (Shoulders) | 0.88 .. 1.05 | 0.88 .. 1.18 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `arms` (Arms) | 0.82 .. 1.15 | 0.82 .. 1.25 |
| `head` (Head size) | 0.95 .. 1.12 | 0.9 .. 1.12 |
| `eyeSize` (Eye size) | 1.05 .. 1.3 | 0.9 .. 1.3 |
| `noseSize` (Nose) | 0.7 .. 1.1 | 0.7 .. 1.25 |
| `smile` (Expression) | 0.2 .. 0.9 | -0.6 .. 0.9 |
| `hairLength` (Hair length) | 1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.25 | 0.9 .. 1.25 |

## Body fit

The puffed sleeves scale with `arms` and `shoulders`; the skirt layers follow `hips` and `legs` (the hem is a fixed distance above the boot tops); the crown and the ribbons follow the head and the tail anchors; the cropped jacket follows `torso`. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the stage-idol and magical-girl *genres*. **Deliberately avoids:** sailor collars and sailor-style uniforms, crescent-moon or winged-star staffs, a talking animal mascot, colour-coded team members, any transformation phrase or sequence from a show, any real idol group's costume, a rayed sunburst or sun-disc motif. A person searches the name "Marigold" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/marigold.js` (`CHAR_MODELS.marigold`, the one reference setup and `OUTFITS.marigold`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit marigold [--weapon warrior|archer|mage] [--bent]`; pictures in `img/marigold.png` and `img/marigold-head.png`. Checks: `node tools/outfit-smoke.js --only marigold`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
