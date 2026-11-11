# Look: Morrow (healer)

> **Built, not approved** (the Wildwood story, zone one): the kit is in `src/game/outfits/morrow.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). Morrow is also the witch of the story's Act I, so she wears this look as a villager (`docs/WILDWOOD-STORY.md`). The slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Morrow / `morrow` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | healer, **nature**: herbs and moss, a soft green glow on the charm only |
| Theme | a hedge-witch who was the village's healer once and now lives out of sight with a kettle and a bundle of herbs |
| Feel | dry, tired and kinder than she lets on; never explains herself twice |
| Palette | lichen `0x6b7a5c`, ink `0x2a2a34`, plum `0x5a3a52`, ember `0xc9763a`, bone `0xe0d8c0`, brass `0xb09040` |
| Silhouette | a tall hat bent back at the tip over a narrow figure, a patched mantle, a layered ragged skirt, a belt hung with pouches and herbs |
| Reads as | **a witch who works with plants**: ink, lichen and a bundle of herbs |
| Face shape (suggestion, never forced) | long, sharp-boned |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `bentwitchhat` | a tall ink cone bent back at the tip with a wide drooping brim, a plum band with a brass buckle, a sprig of herbs tucked under the band |
| **Hair** | `greystreakplait` | a part in the middle, a long loose fall and a plait over one shoulder tied with an ember cord, a grey streak |
| **Face** | `sharptired` (mark), `amberwatch` (eye style) | shadows under the eyes and a thin scar through one brow; amber eyes that miss nothing |
| **Top** | `patchedmantle` | a lichen bodice laced with bone cord under a banded shoulder mantle with an ember trim, a basket of cuttings on the back, a string of bone beads |
| **Bottom** | `layeredskirt` | two layers of ragged skirt (ink over lichen) hung from a pouch belt, ink leggings below |
| **Shoes** | `lacedboots` | dark boots laced with bone cord and a plum cuff and sole |
| **Weapon** | `herbsickle` | one dressing for any weapon: bone grips with plum bands, grey metal, dark wood, moss accents and stripes, a dried-herb-bundle charm with a pale green spark |

## Builder notes

All of it is in `src/game/outfits/morrow.js` (see `docs/CHARACTER.md` section 9 for the hooks). The triangle count is about +11,000 over the base clothes (the smoke test prints it).

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `bentwitchhat` | head | an `ofLoft` cone whose rings drift back (`zc`) into a bent tip, a brim, a plum band ring, a brass buckle and moss sprigs |
| `greystreakplait` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and a `sweepTube` plait with an ember tie; the grey streak is `hairGrad` |
| `sharptired`, `amberwatch` | face mark, eye style | decals laid with `F.place`; `eyes:{iris:1.05, tilt:0.18, lash:0.4}` and amber `eyeColor` |
| `patchedmantle` | top | `paint` (bodice, sleeves), `torso()`: `oxMantle`, a bone clasp, `oxBeads` and `oxPack`; `shoulder` and `forearm` rings |
| `layeredskirt` | bottom | `hips()`: a pouch belt and two `oxSkirt` layers; `paint(thigh)` |
| `lacedboots` | shoes | `paint(shin, foot)` and `shin(sd)`: a plum cuff, a bone ring and a sole plate |
| `herbsickle` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-wild.js`: `herbknife`, `herbbundle`) beside the shared `branch` bow.

| Part of the dressing | Morrow |
|---|---|
| Grip and bindings | bone `0xe0d8c0` with plum bands |
| Metal | pale grey `0xb4b8b0` |
| Wood | dark wood `0x4a3a2e` |
| Accent | moss `0x8fa66a` fittings |
| Trim | a moss stripe every 7 cm along blades, limbs, rims and shafts |
| Charm | `herbbundle`: three dried stalks tied with an ember thread on a bone cord |
| Glow | a pale green spark `0xd8f0b0` beside the bundle (nature) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.morrow` in `src/game/outfits/morrow.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`morrow`**: The hedge-witch as drawn: tall, wiry and a little stooped.

| Slider | Value |
|---|---|
| `height` (Height) | 1.04 |
| `build` (Build) | 0.92 |
| `chest` (Chest) | 0.91 |
| `shoulders` (Shoulders) | 0.98 |
| `waist` (Waist) | 0.9 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 1.06 |
| `thighs` (Thighs) | 0.92 |
| `arms` (Arms) | 1 |
| `neck` (Neck) | 1.08 |
| `hands` (Hands) | 1.1 |
| `feet` (Feet) | 1 |
| `jaw` (Jaw width) | 0.94 |
| `chin` (Chin) | 1.04 |
| `cheeks` (Cheeks) | 0.86 |
| `noseSize` (Nose) | 1.12 |
| `mouthSize` (Mouth width) | 0.92 |
| `smile` (Expression) | 0.12 |
| `hairLength` (Hair length) | 1.2 |
| `hairVolume` (Hair volume) | 1.05 |
| `muscle` (Muscle) | -0.4 |
| `brow` (Brows) | 0.45 |
| `eyeSize` (Eye size) | 1 |
| `lips` (Lips) | 0.8 |
| `undertone` (Skin undertone) | 0.3 |
| `blush` (Blush) | 0.2 |
| `earSize` (Ear size) | 1.1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.98 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.02 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.1 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.82 .. 1.02 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.88 .. 1.1 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.98 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.9 .. 1.1 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `head` (Head size) | 0.95 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.9 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.2 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a hedge-witch and herbalist. **Deliberately avoids:** a copy of any famous fictional witch's look (no striped stockings, no green skin, no red hair), any real brand. A person searches the name "Morrow" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/morrow.js` (`CHAR_MODELS.morrow`, the one reference setup and `OUTFITS.morrow`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit morrow [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only morrow`, `node tools/outfit-looks-check.js`. No skill set yet and no skill file is touched.
