# Look: Corvin (support, debuff, light)

> **Built, not approved**: the kit is in `src/game/outfits/corvin.js` (a cosmetic set no class touches; one outfit for the character's own sex; every item newly designed; no skill touched). The design tables below describe what the file builds; the slider section is generated from the code by `node tools/outfit-looks-check.js --write`. The shared vocabulary is in `README.md`.

## Persona

| | |
|---|---|
| Name / id | Corvin / `corvin` |
| Sex | male (the outfit is designed for this body) |
| Kit, element | support (debuff), **light** (`vuln`): the only parts that glow are the cap lamp and the weapon's lantern charm, warm white; everything else is metal, wax and leather |
| Theme | a lamplighter and mine surveyor: light that shows where a thing is weak |
| Feel | forties, narrow, precise; measures everything twice and talks to his lamp |
| Palette | brass `0xc9a13a`, charcoal `0x2b2b2e`, lamp white `0xfff1c9`, verdigris `0x5f8f7f` (patina on a few brass parts), leather `0x3a3228` |
| Silhouette | a tall narrow column: a long coat to mid-calf, one bright point on the cap, round lenses on the face |
| Reads as | **light that points**: brass fittings, engraved measuring ticks and a hooded lantern on everything he carries |
| Face shape (suggestion, never forced) | angular |

## The seven new items

Built in `src/game/outfits/corvin.js` (the numbers are triangles at full detail, the hiker's `q` 1.1: about 27,500 for the whole outfit, 14,900 more than the base clothes it replaces; other players and phones get a third to a half of that).

| Part | Item id(s) | Design |
|---|---|---|
| **Head** | `lampcap` | a surveyor's leather cap: six gores in two shades of leather sewn with brass welts, a brass crown button on a verdigris disc; a verdigris-green band engraved with a brass tick every few millimetres (a taller one every fifth) and piped in brass; a stiff short brim with a brass edge; two rolled ear flaps tied with verdigris straps and brass buttons; on the front a hooded brass lamp (louvred hood, a patinated mounting plate, a hinge for the flip-down lens ring) whose glass and a small star of rays are the one bright point |
| **Hair** | `silverwave` | silver-grey hair combed back in soft waves (a light streak over a darker base): a skirt over the back of the head whose edge runs high over the ears, drops to the nape and is cut into teeth, two swept locks over each temple, and a short neat three-lock tail bound with a leather cord and a brass ring; no fringe |
| **Face** | `lampsoot` (mark), `keen` (eye style), `brasspecs` (accessory) | a soot smudge on the right cheekbone and two pressure marks on the nose from the spectacles; pale silver eyes `0xaab4bd`, slightly narrowed, each with a thin light ring at the iris edge; round brass-rimmed spectacles with temple bars to the ears, a bridge arc and a bright glint on each lens |
| **Top** | `plumbcoat` | a long waxed charcoal coat to mid-calf: a double row of brass buttons (three with verdigris faces), a brass closing line, a standing collar opening in a wide V over a lamp-white linen cravat with a brass pin, a breast pocket with a brass pencil and two hip pocket flaps, leather shoulder caps and cuffs with brass tick bands and a linen edge at the wrist, a leather belt with a brass ruler strip and buckle, a tape-measure case with white ticked tape and a plumb bob on the belt; below the belt each coat-tail is a flap that rides on its own leg, down to a leather knee band with a brass buckle and a verdigris hem facing between brass lines, with the buttons going on down the front |
| **Bottom** | `surveylegs` | close dark leather leggings with two brass-buckled leather straps on each shin and chalk-dust scuffs, seen between the coat's hem and the boots |
| **Shoes** | `nailboots` | heavy lace-up boots: a rolled leather cuff with a brass tick band and buckle, laced with brass eyelets, a brass toe cap, a wide leather welt sole with twelve brass hobnails, a stirrup-shaped brass heel plate with a tab up the back |
| **Weapon** | `brassbind` | one dressing for any weapon: leather grips with brass bands, brushed steel, walnut with brass and verdigris bands, and the `hoodlamp` charm: a hooded lantern, a plumb bob and an engraved tally tag on chains (below) |

## Builder notes

| Item | Kind | What it is, where it attaches |
|---|---|---|
| `lampcap` | head | `head(F,T)`: the crown is a `shell` (radius 0.127, tilted 0.14, lifted 1.1 cm) painted gore by gore (six sectors, alternate 0.92 / 1.12 leather) before it is tilted and fitted with `T.fit`; six 4-sided brass welt rods along the meridians; the band is a second thin shell strip (72 columns, 2 rows, painted verdigris with brass ticks every 3 columns and a taller one every 15) with a brass rim rod; the brim is a half-ellipse cylinder drooping 0.1 rad with a brass edge rod; two ear flaps (a leather roll, three end discs, a verdigris strap ring, a brass button); the lamp is built in its own frame (`lampParts`: plate patch with rivets and patina, neck, body cylinder, hood half-cylinder with three louvre slots, lens ring, hinge pin), aimed 0.1 rad up and moved to the crown's front. The lens glass and an 8-ray star are the only glow: they are one `matGlow` mesh added to `rig.head` in `extras` (no light source). The cap does not follow `hairVolume`. About 4,150 triangles (400 of them glow) |
| `silverwave` | hair | `hair(F,T)`: a small crown under the cap, a back skirt (`shell` with a front gap, its vertices remapped so the lower edge sits at 0.585 pi over the ears and 0.745 pi at the nape, cut into 18 teeth and thickened 7% toward the edge so it clears the cheek), four temple locks (`sweepTube` swept back along the scalp), three tail locks bound by two rings; the paint is `T.hp` with a sinusoidal light streak, darker under 0.03. The radius follows `hairVolume`. About 2,550 triangles |
| `lampsoot` | face mark | `mark(F)`: two overlapping flat ellipses (`0x6a5f55`, `0x58504a`) on the right cheekbone, two skin-darker ovals beside the nose bridge, and for each eye a thin pale ring tube on the iris edge (placed with `F.place`, turned with the eye's tilt); about 800 triangles |
| `keen` | eye style | `eyes:{iris:0.92,h:0.84,w:1.05,lash:0.9,hl:2,tilt:-0.05,browLift:0.002,browThick:0.95,browAngle:0.2}` and `eyeColor:0xaab4bd`: narrowed, a small bright iris, thin lashes; no extra mesh |
| `brasspecs` | face accessory | `facial(F)`: per eye a torus (radius 0.0335, wire 1.8 mm) 1.65 cm off the skull at the eye builder's own position (`eyeGap`, `eyeHeight`, read from `S` and `F.fs`), a white glint arc (`ofRibbon`), a 4-sided temple bar through four points just outside the skull (`0.1062 * fs[0]`) to the top of the ear (`F.earX`), and one bridge arc over the nose; about 800 triangles |
| `plumbcoat` | top | `torso()` (about 5,650): the coat is one grid surface on the torso's own section (`torsoSize` and the neck's lathe, so bust, belly and glutes are cleared) with 7.5 mm of cloth, 14 mm round the collar, from the collar's top (dipping into a wide V in front) to a hem 8 cm below the hip that flares and goes squarer, painted charcoal wax with a lighter chest; a leather hem welt, the collar lining (verdigris-dark) and its brass rim rod, the brass closing line, 12 buttons (a short disc shaded toward its face colour), the cravat (a folded grid of lamp-white linen, a brass pin with a verdigris stone), three pocket flaps (`ofPatch` on the coat's own front), a brass pencil, the belt (a grid 5.7 mm over the coat), two ruler strips (`ofPatch`, a tick every 3 columns = 1 cm, a long one every fifth), the buckle (five boxes), the tape-measure (a brass disc with a verdigris hub, a strap, white ribbon with black ticks), and the back (centre and yoke seams, two belt buttons, a D-ring). `shoulder(sd)` a leather dome with a brass tick band and button (430 each); `forearm(sd)` a leather cone cuff with a brass tick band, a buckle and a linen ring (455 each). **The tails**: `thigh(sd)` is the upper tail (about 1,100 each) and `shin(sd)` the lower (about 1,480 each); each is an open "D" section (a clipped squircle, flat front and back, round outer side, open on the inside) at a fixed margin outside the leg's own stations (the same smooth curve `limb` draws), so it can never be pierced by its own leg; the upper hangs in the hip's frame (4 to 21 mm of margin), the lower in the knee's (29 to 56 mm, so it laps over the upper's hem), and the two inner edges part toward the hem by 0.38 `hx` (a V of verdigris lining). A coarse inner lining face, brass front piping, leather back piping, brass hem rods, a leather knee band with a buckle and a verdigris facing between two brass lines. The two flaps of a pair are disjoint in x and every hip and knee turns about x only, so they never cross each other. `extras`: the plumb bob (a loop, a cord, a brass cone with a verdigris cap) swings from the belt with the right thigh. Reads `rig.dims` (`hx`, `thigh`, `shin`, `tw`, `cw`, `KR`, `TK`, `B`) and `S`. About 12,900 triangles in all |
| `surveylegs` | bottom | the leg paint replaced (dark leather; chalk dust from a noise of `x`, `y` on the front of the shin, `cuts` at the boot top), two leather straps (flat ellipse bands at the shin's own section) with brass buckles on each shin below the hem; the thighs are under the tails. About 800 triangles for the straps |
| `nailboots` | shoes | `shin(sd)` and the `foot` paint: boot top painted from `BOOT` (0.72 of the shin) down; a rolled leather cuff ring (a flattened torus) with a brass tick band and a buckle; three laced crossings (`ofRibbon`) with six brass eyelets; the welt (an extruded plan from the base foot's own table, 11.5 mm thick, a lighter stitched top edge, wider than the upper); twelve brass hobnails; the stirrup plate (a 4-sided brass-dark U round the heel and a tab up the back with a verdigris tip); the toe cap (a `loftRings` shell 1.6 mm over the foot's toe, brass with a dark rim). Fits `feet` (`wf`, `hf`, `sf`). About 2,900 triangles each |
| `brassbind` | weapon dressing | see the next table |

## The weapon dressing (one item, any weapon)

A dressing restyles **whatever weapon the player holds**: class has nothing to do with it. The mechanism is in `README.md`. The weapon meshes are coarse (a blade is one box, a shaft two rings), so `trim` can only colour their few vertices: the brass shows as a root, bands and a gradient; the engraved ticks live on the charm's tally tag and on every brass band of the outfit.

| Part of the dressing | Corvin's `brassbind` |
|---|---|
| Grip and bindings | dark leather `0x3a3228` grips with brass bands `0xc9a13a` (trim every 1.6 cm of the grip) |
| Metal | brushed steel `0xaab4bd`; the blade's root is warmed toward brass |
| Wood | dark walnut `0x4a3a2c` limbs, shafts and rims; the bow's limbs and the shield's rim take a bright brass band every 5 cm with a verdigris line |
| Accent | brass `0xc9a13a` on the guard, the rims and the bow's tips |
| Trim | brass bands, ends and a verdigris line (the `trim` function: blade root, limb / shaft / rim every 5 cm, grip every 1.6 cm) |
| Charm | `hoodlamp`: a hexagonal brass lantern with a louvred hood (patinated), a plumb bob with a verdigris cap and three engraved rings, and a small tally tag with engraved ticks, on short brass chain links from a ring at the grip |
| Glow | warm white `0xfff1c9` (light): the lantern's glass (unlit `matGlow`, no light source) and, on the staff, the orb's own colour; nothing else on the weapon |

## Slider recommendations

<!-- generated from `CHAR_MODELS.corvin` in `src/game/outfits/corvin.js` by `node tools/outfit-looks-check.js --write`: change the code, not this section -->

One recommended setup (the reference: the body this outfit was fitted for, male), and the sliders whose recommended range is narrower than the base model's. Outside a range the outfit may clip or stretch (the editor shows the band and a warning).

### Recommended setup (reference, male)

**`corvin`**: The surveyor as drawn: round-bellied and bespectacled, a big head on a short stride.

| Slider | Value |
|---|---|
| `height` (Height) | 1 |
| `build` (Build) | 1.1 |
| `chest` (Chest) | 1 |
| `shoulders` (Shoulders) | 0.95 |
| `waist` (Waist) | 1.15 |
| `hips` (Hips) | 1.1 |
| `torso` (Torso length) | 1 |
| `legs` (Leg length) | 0.94 |
| `thighs` (Thighs) | 1 |
| `arms` (Arms) | 0.9 |
| `hands` (Hands) | 1.05 |
| `jaw` (Jaw width) | 1 |
| `chin` (Chin) | 0.95 |
| `cheeks` (Cheeks) | 0.82 |
| `eyeGap` (Eye spacing) | 1.04 |
| `brow` (Brows) | -0.2 |
| `noseSize` (Nose) | 1.18 |
| `lips` (Lips) | 0.85 |
| `hairVolume` (Hair volume) | 0.9 |
| `bangs` (Fringe length) | 0.3 |
| `eyeSize` (Eye size) | 0.9 |
| `undertone` (Skin undertone) | 0.2 |
| `blush` (Blush) | 0.1 |
| `earSize` (Ear size) | 1.1 |
| `neck` (Neck) | 0.95 |
| `head` (Head size) | 1.08 |

Every slider not listed rests at its neutral value (1, or 0 for the +/- sliders).

### Recommended ranges (only where narrower than the base model's)

| Slider | Range | Base model |
|---|---|---|
| `height` (Height) | 0.95 .. 1.08 | 0.92 .. 1.08 |
| `build` (Build) | 0.88 .. 1.15 | 0.88 .. 1.18 |
| `chest` (Chest) | 0.6 .. 1.15 | 0.6 .. 1.4 |
| `shoulders` (Shoulders) | 0.88 .. 1.08 | 0.88 .. 1.18 |
| `waist` (Waist) | 0.88 .. 1.15 | 0.82 .. 1.15 |
| `thighs` (Thighs) | 0.85 .. 1.1 | 0.85 .. 1.25 |
| `neck` (Neck) | 0.85 .. 1.15 | 0.85 .. 1.2 |
| `head` (Head size) | 0.92 .. 1.12 | 0.9 .. 1.12 |
| `eyeGap` (Eye spacing) | 0.96 .. 1.1 | 0.92 .. 1.12 |
| `noseSize` (Nose) | 0.85 .. 1.23 | 0.7 .. 1.25 |
| `earSize` (Ear size) | 0.8 .. 1.15 | 0.8 .. 1.3 |
| `hairVolume` (Hair volume) | 0.9 .. 1.05 | 0.9 .. 1.25 |
| `bangs` (Fringe length) | 0.3 .. 1 | 0.3 .. 1.4 |

## Body fit

The coat follows `chest`, `waist` and `hips` (it is the torso's own section plus 7.5 mm, built from `torsoSize`). Each coat-tail is a flap whose section is the leg's own (the same stations the body is drawn from) plus a margin, riding rigidly on its own thigh (the upper tail) and shin (the lower), so no stride, knee bend or `thighs` value can push a leg through it; the margin follows `rig.dims.tw` and `cw`, so a fuller thigh or calf only widens the tail. The shell's hem is wide enough to cover the tails' tops up to the sliders' recommended ranges (the tails' two inner edges never cross: they are in separate halves and every hip and knee turns about x only). The lamp stays on the cap whatever the head size; the spectacles take the eye builder's own positions. Every item takes the look as an argument, so it also builds on the other body, but nothing is designed or recommended for it. Works at every slider extreme (`node tools/outfit-smoke.js --only corvin`).

## IP check

Original. **Riffs on:** a lamplighter and a mine surveyor. **Deliberately avoids:** a round-spectacled boy wizard (no lightning-shaped mark, no owl, no wand), lantern-bearing characters of existing franchises, a lamp-headed creature, a spiral or swirl lens motif (hypnosis), a glowing eye. A person searches the name "Corvin" with its genre outside this repository before art starts.

## Files

Built: `src/game/outfits/corvin.js` (`CHAR_MODELS.corvin`, the one reference setup and `OUTFITS.corvin`, the kit and its weapon dressing; the hooks are in `docs/CHARACTER.md` section 9). Preview: `node tools/model-preview.js out.png --outfit corvin [--weapon warrior|archer|mage] [--bent]`; pictures in `img/corvin.png` and `img/corvin-head.png`. Checks: `node tools/outfit-smoke.js --only corvin`, `node tools/outfit-looks-check.js`. 2D art prompts: `IMAGE-PROMPTS.md`. No skill file is touched.
