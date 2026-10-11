# Look: Torgeir (tank, earth)

> **Built look, not yet approved by the owner**; no skill touched. Scope, from the owner: **one outfit** for the character's own sex; a **cosmetic set no class touches** (one class-neutral weapon item, not three class skins); **every item newly designed** (no existing hat, top, bottom, shoes or hair style, not even recoloured), every part in two or more colours. The outfit is built in `src/game/outfits/torgeir.js`; the numbers in the tables are checked by `node tools/outfit-looks-check.js`. The shared vocabulary (anchors, builders, the weapon dressing) is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Torgeir / `torgeir` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | tank, **earth** (a short stun): stone, moss, iron; no glow except one dull ochre bead on the weapon charm |
| Theme | a northern shield-wall veteran: round shield, heavy mantle, unhurried |
| Feel | fifties, broad, slow to speak, slower to move |
| Palette | slate `0x3f5668`, bone `0xe3dccb`, iron `0x5d6168`, lichen `0x7d8c5a`, fur grey `0x8f8a80` |
| Silhouette | the widest of the eight: a heavy fur mantle on one shoulder, shin plates and a cap-helm make a wall; the head is small on top of it |
| Reads as | **a thing that holds**: iron bands, bone caps and nicks on everything he carries |
| Face shape (suggestion, never forced) | angular |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `wardcap` | an iron spangen cap-helm: a dark iron dome in four panels, two riveted iron bands over it (front to back, ear to ear) meeting under a bone knob, a brow band with nine bone rivets, a flat nasal bar from the band down the nose with a bone tip, two curved cheek plates hung in front of the ears (three bone rivets each, a leather hinge strap), and a fur rim: a thick roll of grey fur and a skirt of fur ending in points, a short edge over the brow and long locks over the nape; no plume, no horns on the helm |
| **Hair** | `pairedbraids` | iron-grey hair: two heavy three-strand braids from behind the ears over the collar and down the chest (the right one over the fur), each with bone rings (one under the ear, one midway, a big one at the tip over an iron band) and a bone bead at the end; a cap of hair under the helm and a short forelock of four locks under the brow band |
| **Face** | `browscar` (mark), `heavy` (eye style), `braidbeard` (facial hair) | a pale scar through the left brow (the brow only, clear of the eye); pale slate-blue eyes `0x7a9ab0` under heavy lids: a skin-coloured fold over the top of each eye with a dark lash line, low thick brows; a short grey beard with pale streaks that fades into the skin at its edge, a full moustache, and one three-strand braid from the chin ending in a bone bead |
| **Top** | `holdcoat` | a quilted slate coat to mid-thigh: puffed quilting boxes with darker seams, a bone-grey placket with five bone toggles on leather tabs, a rolled slate collar with bone piping, a leather belt with four iron rings and an iron buckle with a bone tongue, the coat's two tails (a quilted slate skirt on each thigh with a lichen-green hem band and bone piping); sleeves quilted in rows with a bone cord, leather bracers with iron bands and a bone-white cuff; **a heavy grey fur mantle over the right shoulder** (a pelt over chest and back ending in points of fur, a dome of fur round the arm) pinned by an iron ring brooch with a bone pin; on the left shoulder a **banded iron spaulder** (four overlapping lames with bone rivets over a leather cap with a bone knob) |
| **Bottom** | `stonegreaves` | wool trousers in lichen olive, bound at the thigh with leather and bone cords, and over each shin a strapped iron greave (a ridged plate with three leather straps and bone studs) under a rounded iron knee guard with a bone boss and five rivets |
| **Shoes** | `fellboots` | leather boots with a thick dark sole, a turned-down cuff of grey fur (a roll and a skirt of points) at the top, an iron ankle strap with a bone stud and an iron toe cap |
| **Weapon** | `lichenwrap` | one dressing for any weapon: leather grips with an iron collar and lichen below, dull iron fittings, ash wood, bone caps (guard, pommel, boss, rim, tips), lichen-green paint (bow limbs in rings, the wand's head, the shield's heart), a bone-and-iron block rim on the shield, and a charm of three bone rings, a tiny iron shield disc and one dull ochre bead (below) |

Beside the seven items the outfit carries a **drinking horn** on the belt behind the left hip (bone with iron bands, a leather strap), which sways with the left thigh: a loose part in `extras`, part of the silhouette from behind.

## Builder notes

All of it is in `src/game/outfits/torgeir.js` (every kit hook of `docs/CHARACTER.md` section 9 except `hips`). About +17,900 triangles over the base clothes at full detail (the hiker, q 1.1); about 14,000 in the kit at the detail of other players (q 0.5). Fur is built as **grids with a ragged lower edge** (`furGrid`: a long lock every third column, short ones between), painted with three-tone noise and light streaks, not as hundreds of tufts: it reads as a pelt at a fraction of the cost.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `wardcap` | head | `head(F,T)`: a `shell` dome (radius 0.12 head units, tilted 0.24 so the rim rises over the brow, lifted 8 mm) painted in four panels; two `sweepTube` bands over it and a torus brow band with nine bone rivet spheres; a fur roll (torus) and a fur skirt (`furGrid` hugging the skull below the rim: short in front, long at the back); everything built round the sphere's centre, then `T.fit` (the head's sculpt) so it follows the skull and the head sliders. Two cheek plates: an `ofLoft` arc built on a 0.109 sphere and sculpted onto the cheek, rivets and a hinge strap. A nasal bar: an `ofRibbon` laid over the nose with `F.zAt` (the nose pushes it forward). About 3,900 triangles |
| `pairedbraids` | hair | `hair(F,T)`: a hair cap and a four-lock forelock under the helm (kept inside it: `hairVolume` is clamped to 1.03 so a fluffy look cannot poke through); each braid is a Catmull-Rom path from behind the ear over the collar to the chest (the points come from `torsoSize` and `rig.dims`, the right one stands 2.6 cm clear of the fur) and three phase-shifted `sweepTube` strands round it; bone rings and a bead by `ofRingAt`. The end follows **Hair length** (design height 0.40 at 1.0 down to 0.30 at 1.35). About 5,100 triangles |
| `browscar` | face mark | `mark(F)`: two thin tubes (a pale ridge and a darker line beside it) across the left brow on `F.zAt`, ending above the eye. About 300 triangles |
| `heavy` | eye style | `eyes:{iris:0.97, h:0.7, lash:1.25, hl:1, tilt:-0.1, browLift:-0.004, browThick:1.25, browAngle:0.1}` plus, in `mark(F)`, a flattened ellipsoid of skin colour laid over the top of each eye with `F.place` and a dark lash tube along its edge (the eye builder alone only shrinks the eye). About 750 triangles |
| `braidbeard` | facial hair | `facial(F)`: the base beard's shell shape (a partial sphere sunk into the skull at its edge) but **painted before it is sculpted**, so the colour fades into the skin where the shell sinks; a moustache of three ellipsoids; a three-strand braid of `sweepTube`s from the chin with a bone bead. About 2,000 triangles |
| `holdcoat` | top | `paint` (belt line, quilted sleeves with a bone cord, leather bracers and a bone cuff, `cuts` for crisp edges); `torso()`: the **coat** is an `ofLoft` shell round the torso (sized with `torsoSize`, 5 mm clear) whose vertices are pushed out by a quilting function (boxes of seams and rows), a belt (loft), four iron rings (`ofRingAt`), a buckle, five toggles, a collar roll, the **mantle**: a `furGrid` pelt over the chest and back from the collar to the waist at the back and the chest at the front, and the brooch; `shoulder(+1)`: the fur dome round the right arm (a `furGrid` over a profile table, leaning with the arm); `shoulder(-1)`: the spaulder (a leather cap and four `LatheGeometry` lames); `forearm(sd)`: two iron bands with bone studs; `thigh(sd)`: the coat's tails (a `loftRings` skirt on each thigh with quilted channels, a lichen hem band, bone piping), so they swing with the legs. About 11,000 triangles together |
| `stonegreaves` | bottom | `paint('thigh'/'shin')` (wool with darker noise, leather binding between cuts); `thigh(sd)`: two binding rings; `shin(sd)`: an `ofLoft` plate on the front of the shin (read from the limb's own stations, 6 mm clear), three leather strap rings with bone studs, a flattened-sphere knee guard with five rivets and a boss. About 3,800 triangles |
| `fellboots` | shoes | `paint('shin'/'foot')` (leather, a dark sole, an iron toe); `shin(sd)`: a fur roll and a `furGrid` skirt at the boot top, an iron ankle ring with a stud, an iron toe cap (an ellipsoid fitted to the foot's toe, 2 mm proud). About 1,400 triangles |
| `lichenwrap` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`; it carries colours, a vertex-colour `trim` and a charm, so a weapon's shape and its notches are not touched.

| Part of the dressing | Torgeir's `lichenwrap` |
|---|---|
| Grip and bindings | dark leather `0x4a3a2c`; the trim puts lichen below and a dulled-iron collar above on a sword's grip |
| Metal | grey iron `0x8a9098`, dulled |
| Wood | ash `0x6a5a48` (the shield's face, the bow's limbs, the wand's shaft) |
| Accent | bone `0xe3dccb` caps on the guard, pommel, shield rim and boss, bow tips |
| Trim | lichen-green `0x7d8c5a` paint: rings along a bow's limb every 6.6 cm, the head of a wand (iron at the grip end), the heart of a shield's face; a shield's rim in alternating blocks of bone and dark iron; a quiver's upper half |
| Charm | `bonering`: a leather cord hung a hand's width beside the grip (so the hand does not hide it) with three bone rings, a tiny iron shield disc with a lichen face and a bone boss, and a short thread below it |
| Glow | one faint ochre `0xb59a4a` bead below the charm's disc (earth), nothing else; the mage's orb takes the dull ochre `0x9a8440` instead of its tier colour |

## Slider recommendations

<!-- generated from `CHAR_MODELS.torgeir` in `src/game/outfits/torgeir.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`torgeir`**: The veteran as drawn: wide, tall, a plain stern face.

| Slider | Value |
|---|---|
| `height` (Height) | 1.04 |
| `build` (Build) | 1.16 |
| `chest` (Chest) | 1.05 |
| `shoulders` (Shoulders) | 1.14 |
| `waist` (Waist) | 1.04 |
| `hips` (Hips) | 0.98 |
| `torso` (Torso length) | 1.04 |
| `legs` (Leg length) | 0.98 |
| `thighs` (Thighs) | 1.22 |
| `arms` (Arms) | 1.2 |
| `neck` (Neck) | 1.15 |
| `hands` (Hands) | 1.15 |
| `feet` (Feet) | 1.1 |
| `jaw` (Jaw width) | 1.1 |
| `chin` (Chin) | 1.08 |
| `cheeks` (Cheeks) | 0.95 |
| `eyeSize` (Eye size) | 0.95 |
| `eyeHeight` (Eye height) | -0.1 |
| `eyeTilt` (Eye tilt) | -0.1 |
| `brow` (Brows) | 0.15 |
| `noseSize` (Nose) | 1.1 |
| `lips` (Lips) | 0.85 |
| `hairLength` (Hair length) | 1.25 |
| `bangs` (Fringe length) | 0.5 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.96 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 1 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.25 | 0.6 .. 1.4 |
| `shoulders` (Shoulders) | 1 .. 1.18 | 0.88 .. 1.18 |
| `legs` (Leg length) | 0.92 .. 1.06 | 0.92 .. 1.14 |
| `thighs` (Thighs) | 0.95 .. 1.25 | 0.85 .. 1.25 |
| `arms` (Arms) | 0.95 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.1 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.15 | 0.9 .. 1.25 |

## Body fit

The coat shell, the mantle and the belt are cut from `torsoSize` (belly, glutes and shoulder width included), so they follow `chest`, `shoulders`, `waist`, `hips` and `build`; the braids' path is computed from the same sizes and from `rig.dims` (neck, head scale); the dome and the spaulder scale with the arm's radius; the tails and the greaves read the thigh's and the shin's own stations (`tw`, `cw`, `KR`), so they follow `thighs`, `legs`; the helm is fitted through the head's sculpt, so it follows the jaw and head sliders; hair volume is clamped under it. The shield (any dressed weapon) and the mantle never share a shoulder. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme (the smoke test builds each slider at both ends on both bodies).

## IP check

Original. **Riffs on:** a northern shield-wall veteran. **Deliberately avoids:** horned or winged helmets, a star or a famous emblem on a shield, a one-eyed hooded wanderer or any eye covering, a scar over an eyeball, a named hammer, axe or shield of an existing franchise. A person searches the name "Torgeir" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/torgeir.js` (`CHAR_MODELS.torgeir`, the one reference setup and `OUTFITS.torgeir`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit torgeir [--weapon warrior|archer|mage] [--bent]`; pictures in `img/torgeir.png` and `img/torgeir-head.png`. Checks: `node tools/outfit-smoke.js --only torgeir`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
