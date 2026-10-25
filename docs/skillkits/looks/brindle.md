# Look: Brindle (mixed safe DPS + support)

> **Built, not approved** (version 3, the Kin outfits of the Amber Reach plan, task K2): the kit is in `src/game/outfits/brindle.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`. What is special about this set is its **Kin parts**: see "Kin parts" below.

## Persona

| | |
|---|---|
| Name / id | Brindle / `brindle` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | mixed (safe DPS + support), fire: sun-glass amber, with a glow on the vials only |
| Theme | a loud-laughing hyena-kin caravan tinker with a belt of sun-glass charges, who sells you the lens and lights the fuse himself |
| Feel | cheerful, quick and a little reckless; laughs first and explains later |
| Palette | amber `0xd98a2b`, rust `0x7a3b1c`, cream `0xefe0bd`, leather `0x5a3a22`, brass `0xc9a24a`, sun-glass `0xffd27a` |
| Silhouette | short, wide and cheerful: fat round ears under a flat cap, a vest hung with glass, baggy legs, a thick bushy tail |
| Reads as | **a lens catching the sun** |
| Face shape (suggestion, never forced) | broad, round-cheeked |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `lenscap` | a flat rust cap with a dark band and short brim, a leather strap and a pair of brass goggles pushed up on the front |
| **Hair** | `naperidge` | short messy hair over the brow and a ridge of dark spikes with amber tips from the crown down the nape |
| **Face** | `sootgrin` (mark), `laughgaze` (eye style) | two smudges of soot on the cheeks and a laugh line each side; small brown eyes under thick brows, a low tilt like a grin |
| **Top** | `tinkervest` | an amber vest over a cream shirt with rolled sleeves, a leather bandolier of six sun-glass vials in brass caps, a ruff of fur at the neck |
| **Bottom** | `patchbaggies` | baggy sand-cloth trousers with a rust patch, a wide leather tool belt with three pouches and two fat side pouches |
| **Shoes** | `dustboots` | short leather boots with a brass buckle strap and a dark sole |
| **Weapon** | `tinkerrig` | one dressing for any weapon: leather grip with rust bands, brass metal, amber stripes; a wrench for a sword, a glass-bellied bow, a lens staff |

## Kin parts

Brindle's ears, tail and muzzle are **set parts** (`kinDefineSet`, `src/shared/kin.js`): not free and not crafted, they come with the outfit set and follow its gate (the tile in the editor's Body > Kin rows shows a lock until the set is owned, and a look that wears them unowned is only a try-on). Wearing the whole set (`CHAR_MODELS.brindle.kin`, written by `ofWear`) also sets the fur colour, the second colour and the marking (sandy `0xc8a064` with dark brown spots `0x3a2414`); taking the set off, or wearing another set, removes only what it put there, and the Kin rows still change any of it afterwards. The hat lets the ears poke through (`KIN_HAT_EARS.brindle`).

| Part | Id | What it is |
|---|---|---|
| Ears | `e:brindle` | big round ears with a dark rim and a pale inside, set high (`kinEar`) |
| Tail | `k:brindle` | a short thick drooping tail with a dark tip (`KIN_TAILS.brindle`) |
| Muzzle | `m:brindle` | a broad blunt snout, dark at the front, a big black nose (`KIN_MUZZLES.brindle`) |

## Builder notes

All of it is in `src/game/outfits/brindle.js` (see `docs/CHARACTER.md` section 9 for the hooks); the weapon models are in `src/game/combat/weapon-shapes-kin.js`.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `lenscap` | head | `ofLoft` dome and a half-disc brim, an `ofRingAt` strap, two torus rings with glass discs for the goggles |
| `naperidge` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and seven cones along the midline rotated to follow the skull |
| `sootgrin`, `laughgaze` | face mark, eye style | smears and creases laid with `F.place`; `eyes:{iris:0.95, tilt:-0.15, browThick:1.2}` |
| `tinkervest` | top | `paint` (vest, shirt, hem), `torso()`: an `ofRibbon` bandolier with vial cylinders and brass caps, an `oxRuff`; a leather ring at each forearm |
| `patchbaggies` | bottom | `paint(thigh, shin)` with the patch, a puffed ellipsoid in `thigh(sd)`, an `ofLoft` belt with pouches in `hips()` and an `oxPannier` |
| `dustboots` | shoes | `paint(shin, foot)` with a brass top band and `shin(sd)`: a leather ring, a buckle and a heel plate |
| `tinkerrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-kin.js`: `dress.shape`).

| Part of the dressing | Brindle |
|---|---|
| Grip and bindings | leather `0x5a3a22` with rust bands |
| Metal | brass `0xc9a24a` |
| Wood | dark brown `0x5a3a22` |
| Accent | amber `0xd98a2b` |
| Trim | an amber stripe every 8 cm along blades, limbs, rims and shafts |
| Charm | `sunvial`: a small sun-glass vial in brass on a leather cord |
| Glow | the vial and the staff lens in sun-glass `0xffd27a` (a glass that holds the day) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.brindle` in `src/game/outfits/brindle.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`brindle`**: The tinker as drawn: short, wide and loud, all chest and cheek.

| Slider | Value |
|---|---|
| `height` (Height) | 0.94 |
| `build` (Build) | 1.12 |
| `chest` (Chest) | 1.2 |
| `shoulders` (Shoulders) | 1.06 |
| `waist` (Waist) | 1.08 |
| `torso` (Torso length) | 0.96 |
| `legs` (Leg length) | 0.94 |
| `thighs` (Thighs) | 1.15 |
| `arms` (Arms) | 1.1 |
| `neck` (Neck) | 0.92 |
| `hands` (Hands) | 1.12 |
| `feet` (Feet) | 1.1 |
| `jaw` (Jaw width) | 1.1 |
| `chin` (Chin) | 0.9 |
| `cheeks` (Cheeks) | 1.12 |
| `noseSize` (Nose) | 1.2 |
| `mouthSize` (Mouth width) | 1.2 |
| `smile` (Expression) | 0.85 |
| `hairLength` (Hair length) | 0.9 |
| `hairVolume` (Hair volume) | 1.15 |
| `eyeSize` (Eye size) | 1.15 |
| `lips` (Lips) | 1.2 |
| `undertone` (Skin undertone) | 0.2 |
| `blush` (Blush) | 0.3 |
| `earSize` (Ear size) | 1 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.92 .. 1 | 0.92 .. 1.08 |
| `build` (Build) | 1 .. 1.18 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.9 .. 1.5 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.9 .. 1.15 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.95 .. 1.2 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1.02 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.95 .. 1.2 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.85 .. 1.05 | 0.85 .. 1.2 |
| `head` (Head size) | 1 .. 1.12 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.7 .. 1.1 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.25 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the caravan-tinker and lens-grinder genre (a belt of glass charges, a goggled cap, a hyena-kin laugh). **Deliberately avoids:** a famous goggled inventor, any existing hyena character, a sun disc emblem. A person searches the name "Brindle" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/brindle.js` (`CHAR_MODELS.brindle`, the one reference setup and the Kin set, `OUTFITS.brindle`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit brindle [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only brindle`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/brindle.js`. No skill file is touched.
