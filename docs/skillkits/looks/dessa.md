# Look: Dessa (tank)

> **Built, not approved** (version 3, the Kin outfits of the Amber Reach plan, task K2): the kit is in `src/game/outfits/dessa.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`. What is special about this set is its **Kin parts**: see "Kin parts" below.

## Persona

| | |
|---|---|
| Name / id | Dessa / `dessa` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | tank, earth: slate and forge-orange, an orange glow on the anvil charm only |
| Theme | a rhino-kin smith who sets her anvil in the road and lets the herd break on it |
| Feel | slow to speak, slower to move, impossible to push; the calmest person at any fire |
| Palette | slate `0x6b6f78`, forge orange `0xd9742a`, iron `0x3a3d44`, leather `0x6a4a30`, ash cloth `0xb8b0a0`, soot `0x24262b` |
| Silhouette | the biggest figure in the game: broad shoulders under iron plates, a long apron to the knee, a heavy horned snout under a knotted wrap |
| Reads as | **a smithy in the road** |
| Face shape (suggestion, never forced) | broad, square-jawed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `smithwrap` | an ash-grey headwrap over the crown with an orange band, four iron studs, and a knot with two tails at the back |
| **Hair** | `shortbraid` | cropped short under the wrap, one thick braid down the back tied with an iron and an orange ring |
| **Face** | `sootstreak` (mark), `heavygaze` (eye style) | a streak of soot across the bridge of the nose and a pale scar through the left brow; small dark eyes under heavy brows |
| **Top** | `smithapron` | a slate tunic with an ash collar and cap sleeves over bare arms, a long leather bib apron with an iron-edged pocket and orange stitching, iron-and-orange bracers, iron pauldrons |
| **Bottom** | `ironknees` | dark iron-grey work trousers with a leather tool belt, a hammer on a loop, an apron skirt to the knee, and an iron knee guard with two orange rivets |
| **Shoes** | `toecapboots` | tall black boots with an orange lace stripe, an iron cuff, an iron toe and a heel plate |
| **Weapon** | `anvilrig` | one dressing for any weapon: dark leather grip, iron metal, orange stripes; a cross-peen hammer for a sword, a horn-and-iron bow, a tongs staff holding a glowing ingot |

## Kin parts

Dessa's ears, tail and muzzle are **set parts** (`kinDefineSet`, `src/shared/kin.js`): not free and not crafted, they come with the outfit set and follow its gate (the tile in the editor's Body > Kin rows shows a lock until the set is owned, and a look that wears them unowned is only a try-on). Wearing the whole set (`CHAR_MODELS.dessa.kin`, written by `ofWear`) also sets the fur colour, the second colour and the marking (grey `0x8d9097` with dark `0x3a3a3f` tips); taking the set off, or wearing another set, removes only what it put there, and the Kin rows still change any of it afterwards. The hat lets the ears poke through (`KIN_HAT_EARS.dessa`).

| Part | Id | What it is |
|---|---|---|
| Ears | `e:dessa` | small thick rounded ears with a dark fringe and a forge-orange ring through each |
| Tail | `k:dessa` | a short rope of a tail ending in a dark bristle brush |
| Muzzle | `m:dessa` | a broad square-lipped snout with a thick horn on the bridge and a small one behind it (the horn is part of the muzzle, so it follows it wherever it is worn) |

## Builder notes

All of it is in `src/game/outfits/dessa.js` (see `docs/CHARACTER.md` section 9 for the hooks); the weapon models are in `src/game/combat/weapon-shapes-kin.js`.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `smithwrap` | head | `ofLoft` dome, two iron stud pairs, a sphere knot and two `ofRibbon` tails |
| `shortbraid` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and a `sweepTube` braid added through `T.add`, two `ofRingAt` ties |
| `sootstreak`, `heavygaze` | face mark, eye style | a soot ellipse and a scar placed with `F.place`; `eyes:{iris:1.0, h:0.8, browThick:1.5}` |
| `smithapron` | top | `paint` (tunic, collar, cap sleeves, bare arms), `torso()`: an `ofRibbon` bib with a pocket and two shoulder straps; `forearm` iron and orange rings; an `oxPauldron` on each shoulder |
| `ironknees` | bottom | `paint(thigh)`, `hips()`: a belt `ofLoft`, a hammer from boxes and `oxApron`; `shin(sd)`: the knee guard and rivets |
| `toecapboots` | shoes | `paint(shin, foot)` with the orange lace stripe and the iron toe; `shin(sd)`: an iron ring and a heel plate |
| `anvilrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-kin.js`: `dress.shape`).

| Part of the dressing | Dessa |
|---|---|
| Grip and bindings | dark leather `0x4a3220` with iron bands |
| Metal | iron `0x3a3d44` |
| Wood | dark ash `0x5a4030` |
| Accent | forge orange `0xd9742a` |
| Trim | an orange stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `anvilchain`: a small iron anvil on a chain |
| Glow | the ingot in the tongs and a spark on the charm in `0xffb36b` (earth: heat held in iron) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.dessa` in `src/game/outfits/dessa.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`dessa`**: The smith as drawn: tall, broad in the shoulder and strong in the arm.

| Slider | Value |
|---|---|
| `height` (Height) | 1.07 |
| `build` (Build) | 1.18 |
| `chest` (Chest) | 1.3 |
| `shoulders` (Shoulders) | 1.15 |
| `waist` (Waist) | 1.1 |
| `torso` (Torso length) | 1.04 |
| `legs` (Leg length) | 1 |
| `thighs` (Thighs) | 1.2 |
| `arms` (Arms) | 1.2 |
| `neck` (Neck) | 1.1 |
| `hands` (Hands) | 1.18 |
| `feet` (Feet) | 1.15 |
| `jaw` (Jaw width) | 1.2 |
| `chin` (Chin) | 1.2 |
| `cheeks` (Cheeks) | 0.9 |
| `noseSize` (Nose) | 1.15 |
| `mouthSize` (Mouth width) | 1.2 |
| `smile` (Expression) | 0 |
| `hairLength` (Hair length) | 0.8 |
| `hairVolume` (Hair volume) | 0.95 |
| `eyeSize` (Eye size) | 0.95 |
| `lips` (Lips) | 1.1 |
| `undertone` (Skin undertone) | -0.2 |
| `blush` (Blush) | 0.1 |
| `earSize` (Ear size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 1 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 1.05 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.9 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.95 .. 1.15 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.95 .. 1.1 | 0.92 .. 1.14 |
| `arms` (Arms) | 1.05 .. 1.25 | 0.82 .. 1.25 |
| `neck` (Neck) | 1 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.92 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.7 .. 0.95 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.1 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the roadside blacksmith and wall-builder genre (a leather apron, a long-handled hammer, an anvil on a chain, a rhino-kin build). **Deliberately avoids:** a famous fantasy smith, any existing rhino character, a guild emblem. A person searches the name "Dessa" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/dessa.js` (`CHAR_MODELS.dessa`, the one reference setup and the Kin set, `OUTFITS.dessa`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit dessa [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only dessa`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/dessa.js`. No skill file is touched.
