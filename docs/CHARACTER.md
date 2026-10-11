# Character model: proportions, sliders, recommended setups

The hiker (every player, every villager) is built procedurally in `src/game/character/model*.js`. This file is the reference for anyone who changes the body
or adds a **character model** (the body an outfit is drawn for: the base hiker today, each signature skill outfit later).

## 1. Proportions (anime, not realistic)

About **5.9 heads tall** (6.3 before the owner asked for the head to be 10% taller, `HEAD_TALL` in `model-face.js`: a longer forehead and lower face, features keep their size and move with it): a head scale of 1.40 (male) / 1.37 (female) on a skull of radius 0.105 (width unchanged, height x1.1), a body 1.9 m / 1.8 m tall (the female model is scaled 0.95),
legs about 53% of the height, a short slender neck, narrow shoulders, a small waist, slim limbs, small hands and feet. The face is anime-leaning but restrained (the owner found the first version exaggerated):
moderate eyes (about three quarters of the first size, set a little closer) with a light iris, a pupil and two highlights, an upper lash with a flick, a small nose and mouth, brows
close above the eyes, a flat front and a **rounded** chin and jaw (no point), a faint blush. Keep it that way: new sliders, setups and outfits must not push the face back toward big eyes or a sharp chin.
`tools/character-smoke.js` fails a body that is not 5.2-7 heads tall with legs 46-60% of the height.

## 2. No "building blocks"

The old model was a stack of separate rounded parts. Rules that keep the new one one body (do not undo them):

* The torso lathe is **one surface from the pelvis through the chest, the shoulders and the neck**; the collarbones are tubes into the arm's ball joint.
* Every limb is `limb(stations, ...)` (model-parts.js): a surface whose cross-section (x and z half-width) changes smoothly along its length, closed by a **ball cap**.
  The neighbour on the other side of a joint starts with the **same cross-section** (`D.ER` at the elbow, `D.KR` at the knee), so a bent joint stays round and a straight one
  has no step. The elbow / knee check in the smoke test measures exactly this.
* The caps are 0.7 mm **smaller** than the end section and their rings sit almost on the joint plane (quadratic spacing). Two surfaces that touch with the same radius and
  slope z-fight along the ring (a ragged line at every joint) and shade differently across it. Do not "simplify" this.
* The **hand is the end of the forearm** (the palm flattens out of the wrist; the fingers are tubes rooted in it), and the shin runs into a **lofted foot** (heel to toe).
* Colour edges (a hem, a cuff, a boot top, the belt line) get **cut rings** (`limb(..., {cuts:[t]})`, extra profile points in the torso) so they are crisp; `pc(g, fn, oy)`
  takes the part's offset down the body so the tint noise continues across a joint.
* Look at joints in a **bent pose**: `node tools/model-preview.js out.png --bent --at 0.5` (knees) / `--at 1.2` (shoulders).

## 3. Sliders

`BODY_SLIDERS` in `src/shared/character.js` is the one table: key, group, label, absolute range, default, the two end labels. The editor, `buildCharacter`, `randomLook` and the tests read it.
`1` is the neutral body for the size sliders, `0` for the +/- ones (tilt, brow, smile, eye height). Every slider is clamped by `sliderVal` wherever it is read (a remote look is not sanitized).
A look field that is not a slider (hair style, colours, face shape) still follows the recipe in CLAUDE.md section 5.

| Key | Group | Label | Range | Default | Recommended (base) | Ends |
|---|---|---|---|---|---|---|
| `height` | Body | Height | 0.9 .. 1.1 | 1 | 0.92 .. 1.08 | Shorter / Taller |
| `build` | Body | Build | 0.84 .. 1.24 | 1 | 0.88 .. 1.18 | Slim / Sturdy |
| `chest` | Body | Chest | 0.5 .. 1.6 | 1 | 0.6 .. 1.4 | Smaller / Larger |
| `shoulders` | Shape | Shoulders | 0.8 .. 1.25 | 1 | 0.88 .. 1.18 | Narrow / Broad |
| `waist` | Shape | Waist | 0.75 .. 1.3 | 1 | 0.82 .. 1.15 | Cinched / Full |
| `hips` | Shape | Hips | 0.8 .. 1.3 | 1 | 0.85 .. 1.2 | Narrow / Wide |
| `torso` | Shape | Torso length | 0.88 .. 1.15 | 1 | 0.94 .. 1.08 | Short / Long |
| `legs` | Shape | Leg length | 0.85 .. 1.2 | 1 | 0.92 .. 1.14 | Short / Long |
| `thighs` | Shape | Thighs | 0.8 .. 1.35 | 1 | 0.85 .. 1.25 | Slender / Full |
| `arms` | Shape | Arms | 0.75 .. 1.35 | 1 | 0.82 .. 1.25 | Slender / Strong |
| `neck` | Shape | Neck | 0.75 .. 1.35 | 1 | 0.85 .. 1.2 | Slim / Thick |
| `hands` | Shape | Hands | 0.8 .. 1.3 | 1 | 0.85 .. 1.2 | Small / Large |
| `feet` | Shape | Feet | 0.8 .. 1.3 | 1 | 0.85 .. 1.2 | Small / Large |
| `head` | Face | Head size | 0.85 .. 1.2 | 1 | 0.9 .. 1.12 | Smaller / Larger |
| `jaw` | Face | Jaw width | 0.75 .. 1.25 | 1 | 0.85 .. 1.15 | Narrow / Wide |
| `chin` | Face | Chin | 0.7 .. 1.4 | 1 | 0.8 .. 1.25 | Short / Long |
| `cheeks` | Face | Cheeks | 0.7 .. 1.4 | 1 | 0.8 .. 1.25 | Hollow / Full |
| `eyeSize` | Eyes | Eye size | 0.8 .. 1.4 | 1 | 0.9 .. 1.3 | Small / Large |
| `eyeGap` | Eyes | Eye spacing | 0.85 .. 1.2 | 1 | 0.92 .. 1.12 | Close / Apart |
| `eyeHeight` | Eyes | Eye height | -1 .. 1 | 0 | -0.6 .. 0.6 | Lower / Higher |
| `eyeTilt` | Eyes | Eye tilt | -1 .. 1 | 0 | -0.7 .. 0.7 | Droopy / Upturned |
| `brow` | Eyes | Brows | -1 .. 1 | 0 | -0.7 .. 0.7 | Gentle / Stern |
| `noseSize` | Features | Nose | 0.6 .. 1.4 | 1 | 0.7 .. 1.25 | Tiny / Larger |
| `mouthSize` | Features | Mouth width | 0.7 .. 1.4 | 1 | 0.8 .. 1.25 | Small / Wide |
| `lips` | Features | Lips | 0.6 .. 1.6 | 1 | 0.7 .. 1.4 | Thin / Full |
| `smile` | Features | Expression | -1 .. 1 | 0 | -0.6 .. 0.9 | Serious / Smiling |
| `earSize` | Features | Ear size | 0.7 .. 1.5 | 1 | 0.8 .. 1.3 | Small / Large |
| `earPoint` | Features | Pointed ears | 0 .. 1 | 0 | 0 .. 1 | Round / Elf |
| `hairLength` | Hair | Hair length | 0.6 .. 1.5 | 1 | 0.7 .. 1.35 | Shorter / Longer |
| `hairVolume` | Hair | Hair volume | 0.85 .. 1.35 | 1 | 0.9 .. 1.25 | Sleek / Fluffy |
| `bangs` | Hair | Fringe length | 0 .. 1.5 | 1 | 0.3 .. 1.4 | None / Long |

**Adding a slider:** a row in `BODY_SLIDERS`; read `S.<key>` (the clamped value) in `model-body.js` / `model-face.js` / `model-hair.js`; add its recommended range to every character model's `ranges`
(a missing one means "the whole range", which an outfit will not like); add a row `{slider:'<key>'}` to a tab in `EDIT` (ui/character-editor.js); add it to the "sliders really change the body"
check in `tools/character-smoke.js` if it moves something measurable. Old saves and other players' looks have no value for it: they get the neutral one (`fullLook`).

## 4. Recommended slider setups (a requirement for every character model)

Sliders let a player make any body; an outfit is drawn and fitted for a **range** of bodies. So every character model declares

* `ranges`: the **recommended range** of each slider it was fitted for. The editor draws it as a band under the slider and warns outside it ("outfits may clip or stretch");
  `lookOutOfRange(look, model)` lists the sliders outside it.
* `sexes` (optional, default both): the bodies the model is designed for. A **signature outfit is designed for its character's own sex** (one outfit, one sex: `docs/skillkits/looks/`); every part must still *build* on the other body (the owner's rule that any character may wear any outfit), but no setups are designed for it.
* `setups`: **named presets** of the sliders that look right in that model: the base model has at least **3 per designed sex** (a setup with `sex:'any'` counts for each); a **signature outfit (`signature:true`) ships just one**, its reference. Exactly one per designed sex has `def:true`
  (the **reference fit**: the body the outfit was modelled on; a new hiker starts on it), each inside the model's `ranges`. A setup lists only the sliders that move; `applySetup` resets the rest to neutral.

`validateCharModel(model)` returns the list of problems; `tools/character-smoke.js` runs it on every model in `CHAR_MODELS`, **so a model without setups fails the tests**.
A look names its model in `look.model` (default `'base'`; an unknown id falls back to `'base'`).

Base model (`CHAR_MODELS.base`, "Wayfarer"):

| Setup | Sex | Note |
|---|---|---|
| Hero | male (reference) | The reference fit: long legs, a clean V of shoulders and waist. |
| Lithe | male | Quick and slight: slim limbs, long legs, upturned eyes. |
| Bruiser | male | Broad and heavy: wide shoulders, strong arms, a squarer jaw. |
| Scholar | male | Tall and gentle: a long torso, soft brows, large eyes. |
| Rogue | male | Short, light on the feet, with a sly upturned eye. |
| Youth | male | A younger look: big head and eyes, short chin, small hands. |
| Heroine | female (reference) | The reference fit: a cinched waist, long legs and big bright eyes. |
| Sprite | female | Petite with a big head and bigger eyes. |
| Valkyrie | female | Tall and strong: broad shoulders, strong legs, a sharp eye. |
| Dancer | female | Slim and long-limbed with the narrowest waist. |
| Sage | female | Elegant and tall, with a long neck and soft eyes. |
| Guardian | female | Sturdy and broad in the hip and thigh, a steady brow. |
| Elf | any | Slender with long pointed ears and slanted eyes. |

Look at them all: `node tools/model-preview.js out.png --setups` (and `--setups <model id>` for another model, `--sliders` for every slider at its extremes).

### Adding a signature outfit model

A signature outfit is a **kit** (section 9): `src/game/outfits/<id>.js` registers its `CHAR_MODELS.<id>` (with `signature:true`, one reference setup, its `ranges`) and its builder `OUTFITS.<id>`. Fit it at the reference setup
first, then at the ends of every recommended range and on the other body (it must still build there, though nothing is recommended for it). `node tools/character-smoke.js` checks every outfit; look at it with
`node tools/model-preview.js out.png --outfit <id>`. The eight characters' designs are in `docs/skillkits/looks/` (start with its `README.md`).

## 5. What an outfit can read: `rig.dims`, `rig.sliders`, `rig.anchors`

`buildCharacter(look, {q})` returns the rig `poseRig` animates (`hips, spine, head, shL/elL, shR/elR, hipL/kneeL, hipR/kneeR`, `hipY`) and:

* `rig.sliders`: the clamped slider values the body was built with.
* `rig.dims`: the measurements (metres at Height 1): `hipY` (ground to hip joint), `headY` (hip to head centre), `hs` (head scale), `shX` / `shY` (shoulder joint), `hx` (hip joint), `thigh` / `shin`,
  `upper` / `fore` / `wrist` (arm), `neckR`, `TK` (torso length factor), `B` (build), `ER` / `KR` (elbow / knee radius), `aw` / `tw` / `cw` (arm, thigh, calf thickness), `faceScale`.
* `rig.anchors`: empty nodes named `headTop, face, neck, chest, back, waist, hipL, hipR, shoulderL, shoulderR, wristL, wristR, ankleL, ankleR`, parented to the bone they follow
  (add outfit meshes under them; they move with the body and the pose).

## 6. Detail and cost

`buildCharacter(look, {q})`: `q` scales every segment count (`sg(n)`). `charDetail(kind)`: the hiker 1.1 (about 54k triangles, seen close in the editor), other players 0.65 (about 23k),
villagers 0.5 (about 16k, what a villager cost before), phones 0.38-0.62 and light mode 0.3-0.4 (8-11k). The old hiker was about 15.5k. A full-detail build takes about 70 ms, so the editor rebuilds at
low detail while a slider is dragged (`dragLook`) and at full detail on release. Fingers are skipped below q 0.5.

## 7. Random looks

`randomLook(rng, {villager, base})`: the **draw order of the existing lines must not change** (villagers use a seeded rng, so every player sees the same people; the smoke test holds 36 recorded looks).
New randomness goes after them. A villager's slider values come from a hash of the look (no rng draws), inside the recommended ranges; "Surprise me" picks a recommended setup for the sex and jitters it.

## 8. Network and saves

`lookForNet(look)` leaves neutral sliders out of the `hello` / `look` messages (the server keeps a look under 2 KB; the room's 4 KB message limit applies to the `plook` event). Whoever receives a look merges it with
`fullLook` (sex defaults, then the neutral sliders, then the look), so an absent slider is the neutral body. Old saves therefore get the neutral body; a new hiker gets the reference setup.

## 9. Signature outfits: the kit hooks

An outfit is **new geometry and new paint, not a recolour of the base clothes**: its own hat, hair, face marks, top, bottom, shoes and a weapon dressing, each in two or more colours with a silhouette of its own.
`look.model = '<id>'` selects it; `buildCharacter` then ignores the look's `hat`, `hair`, `facial`, `top`, `bottom`, `shoes`, `pack` and `ahoge` (it sets them to neutral values) and asks the outfit's **kit** instead.
The player's skin, face shape, body sliders and the head / body proportions stay the player's.

**The file.** `src/game/outfits/<id>.js` (listed in `src/manifest.json` before `character/model.js`; `tools/char-load.js` loads every file of the folder). It fills `CHAR_MODELS.<id>` (data, section 4) and `OUTFITS.<id>=(function(){ ...; return function(X,D){ return kit; }; })()`:
keep every helper inside the IIFE (top-level names must be unique in the bundle). `X` = `{L, S (clamped sliders), fem, sg (segment count scaled by the detail factor q), q, skin, skinPaint, hairCol, D}`, `D` = `rig.dims` (section 5).
The kit is built once per character, so colours and sizes that depend on the body are computed there.

**The kit's hooks** (all optional except `paint`; geometries must be painted (`pc` / `solid`) and have normals; every list is an array of geometries that is merged into one mesh per bone):

| Hook | Called by | Frame of the geometry it returns |
|---|---|---|
| `paint(part, c, x, y, z, sd)` **required** | the body surfaces, per vertex: `part` = `'torso'` (y = design height 0..0.6, 0 = the belt line; the neck above `skinFrom` stays skin), `'upperArm'`, `'foreArm'`, `'thigh'`, `'shin'`, `'foot'`; `sd` = -1 left / +1 right; set the colour `c` (use `X.skinPaint(c)` for bare skin) | the body part's own frame (`y` runs down a limb) |
| `cuts` `{torso:[design y], upperArm:[t], foreArm:[t], thigh:[t], shin:[t]}` | rings where the paint changes colour (the surface gets two rings 1 mm apart there, so the edge is crisp, not a gradient) | |
| `skinFrom` (number) | the torso's design height where the neck's skin starts (default 0.555; a high collar painted on the body raises it) | |
| `boot` (false = a bare-ankle low shoe) | the shin's shape | |
| `torso()` | collars, tabards, sashes, belts, straps, buckles | the spine's frame: origin at the hips, y up in metres (design y x `D.TK`), the front is -z |
| `shoulder(sd)` | puffed sleeves, epaulets, pauldrons | the shoulder joint's frame: origin at the joint, y down the arm |
| `forearm(sd)` | cuffs, bracers | the elbow's frame: y down the forearm (wrist at -`D.wrist`) |
| `hips()` | skirts, sashes below the belt | the hips' frame: origin at the hip centre, y up |
| `thigh(sd)` / `shin(sd)` | breeches' flares, greaves, boot tops, bells, heel plates | the hip's / the knee's frame: y down the leg (`shin(sd)`: the ankle is y = -`D.shin`) |
| `head(F, T)` | the hat or head piece | head-local: origin at the head's centre, units of the skull (radius 0.105), the face looks along -z, the head's top is `0.105 * F.fs[1]` |
| `hair(F, T)` | replaces the hair style: compose `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks`, `T.scalpLock`, `T.blade` and your own tubes (`T.add(geo, paintFn)` collects them; `T.hp` is the default hair paint, `T.hl` / `T.hv` / `T.bg` the length, volume and bangs sliders) | head-local |
| `hairColor`, `eyeColor` (hex) | the hair's and the irises' colour (brows and lashes follow the hair) | |
| `eyes` `{iris, h, w, lash, hl, tilt, browLift, browThick, browAngle}` | the eye style: iris size, eye height and width (multipliers), lash weight, highlights (1-3), tilt and brow angle (slider units), brow lift (metres) and thickness | |
| `mark(F)` / `facial(F)` | face marks (a scar, stripes, a smear, a glyph) and facial hair | head-local; `F.place(geo, x, y, push)` lays a feature built around the origin (facing -z) on the skull's surface, `F.zAt(x, y)` is the skull's front surface, `F.el` / `F.col` shape helpers |
| `extras(rig, X)` | loose parts and motion the merged meshes cannot carry: add `Object3D`s to any bone of `rig` and push per-frame functions `(t, dt, speed)` to `rig.anims` (a ring that turns, a drum that half-follows the thigh, a charm that swings) | any |
| `dress` (the weapon dressing) | `weaponsOn` (game/combat/weapons.js) for the hiker and for other players | see below |

**Weapon dressing** (`kit.dress`): one record that restyles whatever weapon the class carries: `grip`, `metal`, `wood`, `accent` (hex colours that replace the tier's), optionally `glow`; `trim(c, u, part)` (lay a pattern on the vertex colour `c`; `u` = metres along the blade / limb / shaft / grip,
`part` = `'blade'`, `'limb'`, `'shaft'`, `'grip'`, `'rim'`, `'face'`, `'quiver'`); `charm()` returns `{lit:[geos], glow:[geos]}` hung from the grip (y down, origin at the grip; `glow` is drawn unlit, `matGlow`: never a light source).
The dressing is cosmetic: it touches no stat, no skill and no server code.

**Helpers** (`character/outfit-tools.js`, plus everything in `model-parts.js`): `torsoSize(X, D, yd)` (half-width `rx`, front `rz` and back `rzBack` of the torso at a design height, belly, bust and glutes included: cloth must clear them), `ofRibbon(pts, width, {up, th, seg})` (a flat two-sided strip: sashes, pennants, feathers, ribbons),
`ofLoft(rings, seg, a0, a1)` (a panel round part of the body: a tabard, a cape), `ofRingAt(point, axis, R, r, seg)` (a cord, band or ring round a curve), `ofPatch(x0, x1, y0, y1, nx, ny, surf, front)` (a fine grid on a surface for an emblem or buckle whose edge must be crisp),
`ofCol(hex)` (a cached colour for paint functions); and `limb`, `loftRings`, `sweepTube`, `pc`, `solid`, `smoothN`, `csph`, `merge`, `vbox`, `cyl` as in the base model.

**Rules.**
* **Colour**: every part has at least two colours (trim, piping, stripes, a lining, a pattern from a paint function); a flat single-colour garment is not a design. Paint patterns that are smaller than the mesh's cells (an emblem, a buckle) on an `ofPatch`, not on the coarse body mesh (vertex colours blur over a cell).
* **Fit**: read `X.S`, `D` and `torsoSize`, never a fixed measurement; clear the body (belly, bust, shoulder blades, glutes: `torsoSize`); build on every body in the model's ranges and still on the extremes of the sliders and on the other sex. Attached shells need a margin of 1-2 mm over the body (z-fighting).
* **Joints**: parts that hang from a joint (a skirt, a drum, a cape) must not swing a limb through them: attach them to the bone that moves with them or half-follow it in `extras`; judge in a bent pose (`--bent`).
* **Cost**: every segment count goes through `sg(n)` (so other players, villagers and phones get fewer); an outfit adds at most about 20,000 triangles at full detail (the hiker is 54,000; `tools/character-smoke.js` fails an outfit above 35,000 extra).
* **Light**: glowing parts are `matGlow` meshes (unlit vertex colours) added in `extras`, never a light.
* **Identity**: first names only, original designs (the IP check in each look file).

**See it**: `node tools/model-preview.js out.png --outfit dunstan` (front, side, back; `--weapon warrior|archer|mage` puts a weapon in the hands, `--bent`, `--size W H`, `--at Y` zooms on a height, `--views front`; `--looks '[{"model":"dunstan","build":1.2}]'` for any slider).
Dunstan (`game/outfits/dunstan.js`) is the worked example of every hook.
