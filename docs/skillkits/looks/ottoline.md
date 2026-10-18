# Look: Ottoline (support (buff and debuff))

> **Built, not approved** (version 3, the first four of its ten new themes): the kit is in `src/game/outfits/ottoline.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Ottoline / `ottoline` |
| Sex | female (the outfit is designed for this body) |
| Kit, element | support (buff and debuff), **dark**: the perma-twilight, a violet spark on the weapon charm only |
| Theme | a porcelain doll who pulls strings: the enemy dances weaker and her friends dance stronger |
| Feel | small, composed and polite to a fault; never blinks first |
| Palette | black `0x1c1822`, porcelain `0xf3eee8`, blood rose `0x8a1f3d`, silver `0xb9b6c4`, violet `0xb06ad8` |
| Silhouette | a little bell: a lace-crowned head with long ringlets, a tiny waist, big puffed sleeves and a wide tiered skirt over striped stockings |
| Reads as | **a doll in mourning dress**: black, white lace and one red rose |
| Face shape (suggestion, never forced) | small heart-shaped |

## The seven new items

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `lacedress` | a black satin headband with silver edges under a standing scalloped lace frill, a black bow with a blood rose at the right and two leaves |
| **Hair** | `himeringlets` | black hair with a straight hime fringe, long side locks and two long ringlets (spirals) down the front, tied with rose ribbon |
| **Face** | `dollseams` (mark), `glassgaze` (eye style) | round rosy cheek spots, a hairline seam from each mouth corner down the chin and a tiny beauty mark; huge glassy violet eyes with three highlights and heavy lashes |
| **Top** | `corsetblouse` | a white blouse with big puffed sleeves (black bands, rose ring, a black-and-rose bow), a black corset with silver boning and a rose lacing, a rose bow on the chest, a black choker with a cameo, a lace neck ruff, lace cuffs |
| **Bottom** | `tierskirt` | a black bell skirt with a silver band, a lace petticoat frill below its hem, a rose waist sash with a big back bow; black-and-white striped stockings with a rose garter and a small bow |
| **Shoes** | `strapshoes` | black strap shoes with a silver ankle strap and buckle, a white lace sock frill, silver soles |
| **Weapon** | `keydoll` | one dressing for any weapon: black grips with porcelain wire, silver metal, black wood, rose accents, a rose diamond every 5 cm, a tiny porcelain doll and a silver key as the charm, a violet spark |

## Builder notes

All of it is in `src/game/outfits/ottoline.js` (see `docs/CHARACTER.md` section 9 for the hooks). About about 25,000 triangles over the base clothes at full detail.

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `lacedress` | head | an `ofLoft` band, a scalloped `ofLoft` frill with a displaced edge, `ofRibbon` bow loops, three spheres for the rose. About 3,500 triangles |
| `himeringlets` | hair | `T.crown`, `T.fringe`, `T.sideLocks`, `T.backLocks` and two helical `sweepTube` ringlets with `ofRingAt` ties. About 7,000 triangles |
| `dollseams`, `glassgaze` | face mark, eye style | ellipsoids laid with `F.place`; `eyes:{iris:1.3, hl:3, lash:1.3, h:1.12}`. About 300 triangles |
| `corsetblouse` | top | `paint` (blouse, corset, boning, choker), `torso()`: an `ofPatch` lacing, a neck frill, a cameo, a bow; `shoulder(sd)`: a puff sphere, a ring and a bow; `forearm(sd)`: a lace frill and a ring. About 6,000 triangles |
| `tierskirt` | bottom | `hips()`: an `ofLoft` bell with a petticoat frill, a rose sash and a back bow; `thigh(sd)`: a garter ring and bow; `paint(thigh)` stripes. About 5,000 triangles |
| `strapshoes` | shoes | `paint(shin, foot)` and `shin(sd)`: a sock frill, an ankle ring, a buckle and a sole plate. About 700 triangles |
| `keydoll` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`.

| Part of the dressing | Ottoline |
|---|---|
| Grip and bindings | black `0x2e2638` grips wound with porcelain wire |
| Metal | silver `0xb9b6c4` |
| Wood | black `0x2e2638` |
| Accent | blood rose `0x8a1f3d` |
| Trim | a rose diamond every 5 cm along blades, limbs, rims and shafts |
| Charm | `dollkey`: a tiny porcelain doll in a black dress on a rose ribbon, a silver key beside it |
| Glow | a violet `0xb06ad8` spark beside the doll (dark) |

## Slider recommendations

<!-- generated from `CHAR_MODELS.ottoline` in `src/game/outfits/ottoline.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, female), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, female)

**`ottoline`**: The doll as drawn: small, a tiny waist, huge glassy eyes, a still face.

| Slider | Value |
|---|---|
| `height` (Height) | 0.92 |
| `build` (Build) | 0.88 |
| `chest` (Chest) | 0.75 |
| `shoulders` (Shoulders) | 0.92 |
| `waist` (Waist) | 0.82 |
| `torso` (Torso length) | 0.96 |
| `legs` (Leg length) | 0.93 |
| `thighs` (Thighs) | 0.9 |
| `arms` (Arms) | 0.85 |
| `neck` (Neck) | 0.9 |
| `hands` (Hands) | 0.85 |
| `feet` (Feet) | 0.85 |
| `head` (Head size) | 1.12 |
| `jaw` (Jaw width) | 0.88 |
| `chin` (Chin) | 0.85 |
| `cheeks` (Cheeks) | 1.1 |
| `eyeSize` (Eye size) | 1.3 |
| `eyeGap` (Eye spacing) | 1.05 |
| `eyeHeight` (Eye height) | -0.15 |
| `eyeTilt` (Eye tilt) | 0.05 |
| `brow` (Brows) | 0 |
| `noseSize` (Nose) | 0.7 |
| `mouthSize` (Mouth width) | 0.8 |
| `lips` (Lips) | 1 |
| `smile` (Expression) | 0.1 |
| `hairLength` (Hair length) | 1.3 |
| `hairVolume` (Hair volume) | 1.1 |
| `hips` (Hips) | 0.95 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.92 .. 1.02 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.02 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.15 | 0.6 .. 1.4 |
| `shoulders` (Shoulders) | 0.88 .. 1.05 | 0.88 .. 1.18 |
| `waist` (Waist) | 0.82 .. 1 | 0.82 .. 1.15 |
| `hips` (Hips) | 0.9 .. 1.15 | 0.85 .. 1.2 |
| `legs` (Leg length) | 0.92 .. 1.12 | 0.92 .. 1.14 |
| `arms` (Arms) | 0.82 .. 1.05 | 0.82 .. 1.25 |
| `head` (Head size) | 1 .. 1.12 | 0.9 .. 1.12 |
| `eyeSize` (Eye size) | 1.1 .. 1.3 | 0.9 .. 1.3 |
| `hairLength` (Hair length) | 1 .. 1.35 | 0.7 .. 1.35 |
| `hairVolume` (Hair volume) | 1 .. 1.25 | 0.9 .. 1.25 |

## Body fit

The corset and the lacing follow `torsoSize` (chest, waist, build); the skirt is wider than the hips and clear of the thighs; the headdress sits on the hair item's crown. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme.

## IP check

Original. **Riffs on:** the porcelain-doll and gothic-fashion genre (a bonnet, ringlets, a corset, lace). **Deliberately avoids:** any existing character, doll brand or horror-film doll, a copied costume of a named idol or game heroine, any cross or religious symbol. A person searches the name "Ottoline" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/ottoline.js` (`CHAR_MODELS.ottoline`, the one reference setup and `OUTFITS.ottoline`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit ottoline [--weapon warrior|archer|mage] [--bent]`. Checks: `node tools/outfit-smoke.js --only ottoline`, `node tools/outfit-looks-check.js`. The skill set: `src/shared/skillsets/ottoline.js`, look `src/game/skillsets/look-ottoline.js`. No skill file is touched.
