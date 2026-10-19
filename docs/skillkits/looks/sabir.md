# Look: Sabir (risk DPS)

> **Built, not approved** (version 3, the first four of its ten new themes): the kit is in `src/game/outfits/sabir.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Sabir / `sabir` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | risk DPS, **fire**: lamp oil and powder, an ember glow on the weapon charm only |
| Theme | a dune raider who hits a caravan hard, takes what he can carry and is gone before the guards form up |
| Feel | lean, quick and a little vain; jokes while he works, counts coin by sound |
| Palette | crimson `0xa8322a`, sand `0xd2b27a`, indigo `0x23233a`, leather `0x5a3a24`, brass `0xc89a3c` |
| Silhouette | a wide wrapped head, a lean torso under crossed leather straps, baggy shorts over tall boots, a fringed sash and a curved sheath at the hip |
| Reads as | **a raid in motion**: sand cloth, crimson sash tails, brass and leather |
| Face shape (suggestion, never forced) | long, sharp-jawed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `duneturban` | a wide wrapped dome in sand with wrap lines and three bands, a crimson lower band, a brass coin at the brow, and a long crimson-and-sand tail hanging down the back |
| **Hair** | `ropebraid` | a dark crop with one long rope braid over the left shoulder, a crimson tie at the top, a brass ring in the middle and a crimson one at the end |
| **Face** | `raiderkohl` (mark), `narrowsight` (eye style), `dustveil` (facial) | a dark kohl smear across each eye and a pale scar through the left brow; narrow amber eyes with thick brows; an indigo veil over the nose and mouth with a crimson hem and a brass pin |
| **Top** | `raiderharness` | a sand shirt under a leather vest with stitched edges, two crossed leather bandoliers (one with brass cartridges, one with a buckle), an indigo neck scarf with a crimson edge and a long striped tail down the back, a leather pauldron with brass studs on the right shoulder, a crimson wrap on the left, leather bracers with brass buckles |
| **Bottom** | `sashsarwal` | baggy sand shorts with a crimson outer-seam stripe and an indigo knee band, a wide crimson sash with a brass buckle and two fringed brass-tipped tails at the left hip, and a curved leather scabbard with brass fittings at the right |
| **Shoes** | `buckleboots` | tall leather boots with an indigo and crimson top, three brass buckle rings, a brass toe cap and a dark sole |
| **Weapon** | `raiderrig` | one dressing for any weapon: crimson cloth grips with brass wire, steel metal, dark wood, brass accents, crimson stripes, a coin-purse charm with an ember spark |

## Builder notes

All of it is in `src/game/outfits/sabir.js` (see `docs/CHARACTER.md` section 9 for the hooks). About about 21,000 triangles over the base clothes at full detail.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `duneturban` | head | an `ofLoft` dome (rings closed at the apex) painted with wrap lines, three `ofRingAt` bands, a brass coin and an `ofRibbon` tail. About 3,500 triangles |
| `ropebraid` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and one `sweepTube` rope with three rings. About 4,500 triangles |
| `raiderkohl`, `narrowsight`, `dustveil` | face mark, eye style, facial hair | kohl smears and a scar laid with `F.place`; `eyes:{iris:0.95, h:0.82, tilt:-0.15, browThick:1.3}`; a curved-edged `ofPatch` laid on the face surface with `F.zAt` and a brass pin. About 700 triangles |
| `raiderharness` | top | `paint` (vest, shirt, stitch lines, cuts), `torso()`: two crossed `ofRibbon` bandoliers front and back, cartridge cylinders, an `ofLoft` scarf and its tail; `shoulder(sd)`: a studded dome on the right, a ring on the left; `forearm(sd)`: bracer rings. About 7,000 triangles |
| `sashsarwal` | bottom | `hips()`: an `ofLoft` sash band, a buckle, two fringed tails and a `sweepTube` scabbard; `thigh(sd)`: a baggy `limb` shell. About 4,000 triangles |
| `buckleboots` | shoes | `paint(shin, foot)` and `shin(sd)`: three brass rings and a sole plate. About 800 triangles |
| `raiderrig` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Sabir |
|---|---|
| Grip and bindings | crimson `0xa8322a` cloth grips with brass wire |
| Metal | bright steel `0xc9ccd4` |
| Wood | dark walnut `0x4a3020` |
| Accent | brass `0xc89a3c` caps and fittings |
| Trim | a crimson stripe every 6 cm along blades, limbs, rims and shafts |
| Charm | `coinpurse`: a leather purse with a crimson neck on a cord, a brass coin beside it |
| Glow | a spark of ember `0xff8a3a` beside the purse (fire) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.sabir` in `src/game/outfits/sabir.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`sabir`**: The dune raider as drawn: a wiry inverted triangle on long legs.

| Slider | Value |
|---|---|
| `height` (Height) | 1 |
| `build` (Build) | 0.9 |
| `chest` (Chest) | 1 |
| `shoulders` (Shoulders) | 1.15 |
| `waist` (Waist) | 0.82 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 1.14 |
| `thighs` (Thighs) | 0.95 |
| `arms` (Arms) | 1.1 |
| `neck` (Neck) | 1.1 |
| `hands` (Hands) | 1.05 |
| `feet` (Feet) | 1 |
| `jaw` (Jaw width) | 0.95 |
| `chin` (Chin) | 1.1 |
| `cheeks` (Cheeks) | 0.95 |
| `noseSize` (Nose) | 1.2 |
| `mouthSize` (Mouth width) | 0.95 |
| `smile` (Expression) | 0.35 |
| `hairLength` (Hair length) | 1 |
| `hairVolume` (Hair volume) | 1 |
| `brow` (Brows) | 0.75 |
| `eyeSize` (Eye size) | 1.12 |
| `eyeHeight` (Eye height) | 0.3 |
| `eyeTilt` (Eye tilt) | 0.4 |
| `undertone` (Skin undertone) | 0.85 |
| `blush` (Blush) | 0 |
| `lips` (Lips) | 0.9 |
| `head` (Head size) | 0.98 |
| `earSize` (Ear size) | 1.1 |
| `hips` (Hips) | 0.88 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.95 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.08 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.8 .. 1.15 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.82 .. 1.05 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.85 .. 1.1 | 0.85 .. 1.2 |
| `legs` (Leg length) | 1 .. 1.14 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.95 .. 1.2 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.93 .. 1.08 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 0.9 .. 1.15 | 0.9 .. 1.25 |

## Body fit

The harness straps follow `torsoSize`; the sash rides the hips and its tails hang clear of the thigh; the sheath hangs from `D.hx`. The turban is sized to cover the braid item's crown. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the desert raider and caravan-bandit genre (a veil, a sash, a curved sheath, bandoliers). **Deliberately avoids:** a rayed sun or crescent emblem, any real culture's flag or sacred script, a famous outlaw, a copy of any existing game's bandit class. A person searches the name "Sabir" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/sabir.js` (`CHAR_MODELS.sabir`, the one reference setup and `OUTFITS.sabir`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit sabir [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only sabir`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/sabir.js`, look `src/game/skillsets/look-sabir.js`. No skill file is touched.
