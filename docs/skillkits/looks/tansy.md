# Look: Tansy (grind, no element)

> **Built, not approved**: the kit is in `src/game/outfits/tansy.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Tansy / `tansy` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | grind, **none (pure basic)**: nothing in this outfit glows or hints at an element, on purpose |
| Theme | a farm-hand who harvests a whole field at once: sweeping blades, bundled wheat |
| Feel | late twenties, sturdy, never still; hums while she works |
| Palette | wheat `0xe0b95a`, field green `0x7a9a3c`, clay red `0xb5532f`, oat cream `0xece3c8`, leather `0x7a5a3a` |
| Silhouette | a wide round hat brim, a smock with a bib, a bundled sheaf at the hand: a bell, widest at the hat |
| Reads as | **reach and bundles**: the dressing turns every weapon into a farm tool, wrapped in twine and tied with a sheaf |
| Face shape (suggestion, never forced) | round |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `sunbrim` | a wide coil-straw sun hat with a high round crown (rings of wheat and darker straw), a field-green band between two cream threads, a brim that dips at the front and turns up at the back, bound at the edge in clay red and lined underneath in field green; three wheat sprigs (gold ears with awns, a green blade each) tucked in the band at the right front, swaying as she moves |
| **Hair** | `sheafcrown` | wheat-gold hair gathered under the brim, a thick three-strand braid (three golds) wound one and a half to two turns round the head above the ears with a clay thread woven through it and its end tucked in, a short side-swept fringe, twelve tapering locks of three shades down the back to the nape, and two straw wisps at the temples |
| **Face** | `freckles` (mark), `sunny` (eye style) | freckles over the nose bridge and the cheeks in three browns; warm amber eyes `0xb8862f`, round and wide open, one big highlight, a light lash with no flick, thick friendly brows |
| **Top** | `harvestsmock` | a loose oat-cream smock: a field-green yoke over the shoulders with a wheat seam and green yoke caps piped in wheat, a green laced bib (cream eyelets, a leather criss-cross cord, two wheat seams, wheat buttons, clay piping), a clay neckerchief with a cream border under a ruffled cream collar, sleeves rolled to the mid-forearm in a thick cream cuff between a green and a clay cord, clay and green elbow patches, a wheat sash with clay and cream edges knotted at the back with two trailing tails, an A-line skirt to mid-thigh with a scalloped clay hem between cream threads, two big clay patch pockets (a darker flap, a leather button) and patches behind, and a wheat-ear sheaf (green stalks, a clay tie) appliquéd on the back |
| **Bottom** | `stookbreeches` | baggy khaki canvas breeches to the knee with a leather side seam studded with wheat buttons, patchwork squares in clay, field green, oat and dark clay each with a cream or leather stitched border, and a clay hem band with a cream thread; below the knee a leather strap with a wheat buckle over bare shins bound in green cloth wraps wound in a spiral |
| **Shoes** | `furrowboots` | short, round-toed leather work boots: a clay-brown toe cap, a dark heel counter, cream laces crossed over the instep, a tan welt on a dark sole with five deep lugs, a turned wheat cuff with a clay thread at the ankle |
| **Weapon** | `sheafwrap` | one dressing for any weapon: ash grips, hazel limbs and shafts, dull steel, clay-red guards, rims and bow tips, a wheat-ear notch trim, a tied sheaf (seven gold ears, a clay cord and cream twine) hung beside the grip |

## Builder notes

All of it is in `src/game/outfits/tansy.js`. About +20,900 triangles over the base clothes at full detail (the outfit itself is about 28,000: the base hair and clothes it replaces are about 7,500). Nothing glows and nothing uses `matGlow`. Whole colour bands are cut rows (`rowLoft`: two rings a millimetre apart), patches and appliqué are `wrapPatch` grids and tubes laid on the real body section (`torsoSize` and the limbs' own stations), so nothing blurs and nothing pokes through at any build, hips or thigh setting.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `sunbrim` | head | one lofted shell (`rowLoft`: a profile of 34 rings, each its own colour) in head units: a round dome (a 0.14 crown radius, 0.1 high) over the hair, the band between cream threads, a coiled brim (8 rings alternating two straws) bound in clay, a green lining under it; the whole brim is warped (down 12 mm in front, up 20 mm behind) and the crown radius follows **Hair volume**. Three sprigs (stalk tube, ear, two awns, a leaf `ofRibbon`) are loose groups on the head bone, swayed in `rig.anims`. About 3,200 triangles |
| `sheafcrown` | hair | `T.crown`, `T.fringe(5)`, a lower shell band for the hair behind the braid, twelve of her own tapering locks (`sweepTube` on the scalp sphere, three shades), two `scalpLock` wisps, and the braid: three phase-shifted `sweepTube` strands twisted six times a turn round a tilted ring (high at the brow, low at the nape) that follows **Hair length** (1.35 to 1.85 turns), plus a thin clay thread twisted round it; the second turn sits above the first and the end sinks into the hair. About 8,400 triangles |
| `freckles` | face mark | 18 flat ellipsoids from a fixed seed over the nose bridge and cheeks, laid with `F.place` on the skull's real surface so the face sliders cannot bury them. About 860 triangles |
| `sunny` | eye style | `eyes:{iris:1.05, h:1.06, lash:0.4, hl:1, tilt:0, browThick:1.3, browLift:0.003}` and `eyeColor 0xb8862f`. No extra mesh |
| `harvestsmock` | top | `paint` (oat below the yoke, green yoke with a wheat seam, `cuts` for the seams and the sleeve roll); `torso()`: a bulging blouse and the sash (two `rowLoft`s sized with `torsoSize` plus a margin that bulges over the bust), the bib (a `wrapPatch` over the blouse with a clay piping tube, wheat seams, eyelets, a leather cord and buttons), the neckerchief (a V of two `wrapPatch` layers), the collar rings, the back emblem (five stalk tubes, five ear ellipsoids, a clay tie) and the sash knot; `shoulder(sd)`: a green yoke cap with a wheat torus and an elbow patch; `forearm(sd)`: three rings; `extras`: the skirt as a **front and a back panel** (each reaches 0.35 rad past the side seams) hung from the sash, with the pockets and patches, swung out in `rig.anims` by half of the leading thigh's swing (front) and 0.4 of the trailing one (back), so a run, a jump or sitting never pushes a thigh through it; and the two sash tails (`ofRibbon`) that trail with her speed. The skirt is as wide as the breeches' thighs need at any build. About 10,300 triangles |
| `stookbreeches` | bottom | `paint('thigh'/'shin')` (canvas, a clay hem, green under the wraps) and `thigh(sd)`: a baggy `limb` shell with `cuts`, five `clothPatch`es (each a stitched border under a cloth, left and right differ), a leather seam tube with wheat buttons and a cream thread; `shin(sd)`: a leather strap ring with a buckle patch and the leg wrap, a ribbon wound in a spiral (8 turns, edges low and dark, a raised lighter centre, neighbouring turns meeting edge to edge). About 4,400 triangles |
| `furrowboots` | shoes | `paint('foot')` (leather, a clay-brown toe cap, a dark heel counter, a tan welt, a dark sole) on the base foot loft, and in `shin(sd)`: a flared wheat cuff (`rowLoft`, ribbed, a clay thread at the rim) at the top of the boot, five lug blocks under the sole turned with the foot, and three cream lace crossings placed from the foot's own rings. About 1,200 triangles |
| `sheafwrap` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds** (sword and shield, bow and quiver, wand): class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Tansy's `sheafwrap` |
|---|---|
| Grip and bindings | ash `0x9a7a4a` grips and hafts, wrapped in pale twine `0xe8dcc0` with a clay cord every 4.5 cm (the trim paints it per vertex, so on the game's plain grip it shows as a soft banding) |
| Metal | dull steel `0xb9bcc0`, unpolished |
| Wood | hazel `0x8a6a3a` limbs, shafts and shield faces |
| Accent | clay red `0xb5532f` guards, pommels, shield rims and bow tips |
| Trim | a wheat-ear notch every 2 cm along blades, limbs, rims and shafts in `0xa8803a`, with a wheat `0xe0b95a` line between |
| Charm | `sheafcharm`: a tied mini sheaf (seven gold ears with awns, a clay cord and cream twine round the waist, about 6 cm) on a clay cord hung from the weapon's `grip` point, a hand's breadth to the side |
| Glow | **none** (basic: no element, no glow, no `matGlow`). `glow` is set to a dull straw `0xa88a4a` only because the mage's orb is drawn unlit by `weapons.js` in whatever colour it is given, and the tier's own colour would shine |

## Slider recommendations

<!-- generated from `CHAR_MODELS.tansy` in `src/game/outfits/tansy.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`tansy`**: The farm-hand as drawn: a pear shape with wide hips and short legs, round-cheeked.

| Slider | Value |
|---|---|
| `height` (Height) | 0.97 |
| `build` (Build) | 1.05 |
| `shoulders` (Shoulders) | 0.9 |
| `hips` (Hips) | 1.2 |
| `thighs` (Thighs) | 1.25 |
| `arms` (Arms) | 0.95 |
| `hands` (Hands) | 1.1 |
| `feet` (Feet) | 1.05 |
| `jaw` (Jaw width) | 0.9 |
| `chin` (Chin) | 0.9 |
| `cheeks` (Cheeks) | 1.2 |
| `eyeSize` (Eye size) | 1.2 |
| `noseSize` (Nose) | 0.85 |
| `mouthSize` (Mouth width) | 1.1 |
| `smile` (Expression) | 0.7 |
| `hairVolume` (Hair volume) | 1.1 |
| `bangs` (Fringe length) | 0.8 |
| `blush` (Blush) | 0.7 |
| `lips` (Lips) | 1.1 |
| `undertone` (Skin undertone) | 0.3 |
| `chest` (Chest) | 1.1 |
| `waist` (Waist) | 0.95 |
| `legs` (Leg length) | 0.92 |
| `head` (Head size) | 1.1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `chest` (Chest) | 0.7 .. 1.3 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.88 .. 1.15 | 0.82 .. 1.15 |
| `legs` (Leg length) | 0.92 .. 1.1 | 0.92 .. 1.14 |
| `thighs` (Thighs) | 0.95 .. 1.25 | 0.85 .. 1.25 |
| `arms` (Arms) | 0.9 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.9 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.94 .. 1.12 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.9 .. 1.25 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The smock, sash and breeches follow `chest`, `waist`, `hips`, `thighs`; the brim clears the braid at any `head` and `hairLength`; the boots follow `feet`. Every item takes the look as an argument, so it also builds on the other body (the owner's rule that any character may wear any outfit), but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the harvest farm-hand and the hedgerow cutter. **Deliberately avoids:** a red hat band on a straw hat (a famous pirate), a hooded cloak, a skull or a long snath scythe (the reaper), overalls with a cap and moustache, any named scythe-wielder of an existing franchise. A person searches the name "Tansy" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/tansy.js` (`CHAR_MODELS.tansy`, the one reference setup and `OUTFITS.tansy`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit tansy [--weapon warrior|archer|mage] [--bent]`; pictures in `img/tansy.png` and `img/tansy-head.png`. Checks: `node tools/outfit-smoke.js --only tansy`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
