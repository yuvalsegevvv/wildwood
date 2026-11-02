# Look: Pip (ranger)

> **Built, not approved** (the Wildwood story, zone one): the kit is in `src/game/outfits/pip.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). Pip is also the lost child of the story's Act I, so the boy wears this look as a villager (`docs/WILDWOOD-STORY.md`). The slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Pip / `pip` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | ranger, **nature**: ferns and new leaves, a pale green glow on the charm only |
| Theme | a small lost child who talks to the grove and from whom ferns grow back |
| Feel | earnest, quick and wide-eyed; says the true thing and is surprised when people flinch |
| Palette | fern `0x4f8a4a`, moss `0x7fb060`, bark `0x8a6a48`, sack `0xc9b48a`, rust `0xb8603a`, mud `0x3a2e24` |
| Silhouette | a small figure in clothes a size too big, a crown of fern fronds, bare feet and a bright grass ribbon at the wrist |
| Reads as | **a child of the grove**: sack cloth, ferns and bare feet |
| Face shape (suggestion, never forced) | round, big-eyed |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `ferncrown` | a ring of woven fern with seven fronds leaning out and one curled frond over the brow |
| **Hair** | `leafymop` | a short tousled mop with a cowlick standing up and a leaf caught behind the ear |
| **Face** | `freckleandmud` (mark), `widegaze` (eye style) | freckles over the nose and a smear of mud on one cheek; big round green eyes |
| **Top** | `sacktunic` | an oversized sack tunic with seams and a rust patch, a bark collar, a rag scarf, a grass-ribbon wrist band |
| **Bottom** | `rolledtrousers` | bark-brown trousers rolled at the knee with a rope belt and a pebble pouch |
| **Shoes** | `barefeetribbon` | bare feet with muddy soles and a moss ribbon tied round each ankle |
| **Weapon** | `whittledstick` | one dressing for any weapon: rope grips with rust bands, pale metal, brown wood, moss accents and stripes, a curled-fern charm with a pale spark |

## Builder notes

All of it is in `src/game/outfits/pip.js` (see `docs/CHARACTER.md` section 9 for the hooks). The triangle count is below the base clothes (bare legs and feet); the smoke test prints it.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `ferncrown` | head | a ring, seven `sweepTube` stalks with leaf blobs, one curled frond |
| `leafymop` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks`, a cowlick cone and a leaf |
| `freckleandmud`, `widegaze` | face mark, eye style | decals laid with `F.place`; `eyes:{iris:1.2, tilt:-0.05, lash:0.15}` and green `eyeColor` |
| `sacktunic` | top | `paint` (tunic, sleeves, patch), `oxScarf`; `shoulder` and `forearm` (grass ribbon and tail) |
| `rolledtrousers` | bottom | `paint(thigh)`, `hips()`: a rope belt, a pouch and an `oxSash` |
| `barefeetribbon` | shoes | `paint(shin, foot)` leaves the skin; `shin(sd)`: a sack cuff and a moss ankle ribbon |
| `whittledstick` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. Its weapon models are its own (`src/game/combat/weapon-shapes-wild.js`: `whittle`, `fernstaff`) beside the shared `branch` bow.

| Part of the dressing | Pip |
|---|---|
| Grip and bindings | rope `0x9a8458` with rust bands |
| Metal | pale tin `0xb8a888` |
| Wood | brown wood `0x6a4e30` |
| Accent | moss `0x7fb060` fittings |
| Trim | a moss stripe every 6 cm along blades, limbs, rims and shafts |
| Charm | `frondcurl`: a curled fern frond on a grass loop beside a speckled pebble |
| Glow | a pale green spark `0xd8f6a8` beside the frond (nature) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.pip` in `src/game/outfits/pip.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`pip`**: The lost child as drawn: small, big-headed and a little thin.

| Slider | Value |
|---|---|
| `height` (Height) | 0.93 |
| `build` (Build) | 0.9 |
| `chest` (Chest) | 0.82 |
| `shoulders` (Shoulders) | 0.94 |
| `waist` (Waist) | 0.95 |
| `torso` (Torso length) | 0.96 |
| `legs` (Leg length) | 0.94 |
| `thighs` (Thighs) | 0.92 |
| `arms` (Arms) | 0.92 |
| `neck` (Neck) | 0.95 |
| `hands` (Hands) | 1.05 |
| `feet` (Feet) | 1.12 |
| `jaw` (Jaw width) | 0.9 |
| `chin` (Chin) | 0.92 |
| `cheeks` (Cheeks) | 1.1 |
| `noseSize` (Nose) | 0.9 |
| `mouthSize` (Mouth width) | 0.95 |
| `smile` (Expression) | 0.3 |
| `hairLength` (Hair length) | 1 |
| `hairVolume` (Hair volume) | 1.15 |
| `head` (Head size) | 1.08 |
| `brow` (Brows) | 0.1 |
| `eyeSize` (Eye size) | 1.2 |
| `lips` (Lips) | 0.9 |
| `undertone` (Skin undertone) | 0.5 |
| `blush` (Blush) | 0.6 |
| `earSize` (Ear size) | 1.2 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.92 .. 0.98 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 0.96 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.7 .. 1 | 0.6 .. 1.9 |
| `waist` (Waist) | 0.85 .. 1.05 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.88 .. 1.05 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.85 .. 1 | 0.82 .. 1.25 |
| `neck` (Neck) | 0.9 .. 1.1 | 0.85 .. 1.2 |
| `head` (Head size) | 1.03 .. 1.12 | 0.9 .. 1.12 |
| `hairLength` (Hair length) | 0.8 .. 1.2 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.25 | 0.9 .. 1.25 |

## Body fit

The straps, belts and skirts follow `torsoSize`; hanging parts clear the thigh. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** a lost forest child. **Deliberately avoids:** a copy of any famous forest-boy character (no pointed cap, no green tunic), any real brand. A person searches the name "Pip" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/pip.js` (`CHAR_MODELS.pip`, the one reference setup and `OUTFITS.pip`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit pip [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only pip`, `node tools/outfit-looks-check.js`. No skill set yet and no skill file is touched.
