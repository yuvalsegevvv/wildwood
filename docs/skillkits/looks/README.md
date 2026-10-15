# The eight outfits (looks)

> **Built, not approved.** These are the *outfits* of the eight signature characters of the skill-set plan (`docs/SKILL-SETS.md`, `docs/skillkits/THEMES.md` on the branch `claude/skill-sets-plan-lp2c72`),
> built as real 3D kits in `src/game/outfits/<id>.js`. The skills and their rules are not touched. Nothing grants an outfit in the game yet: the character editor's Clothes, Hair and Features tabs let anyone wear any piece (a preview; unlocking is the wardrobe's job).
> Each `<id>.md` is the design (persona, the seven items, what is built, the one recommended slider setup); `IMAGE-PROMPTS.md` has prompts for 2D pictures.

## What was asked (the scope, from the owner)

1. **One outfit per character**, drawn for the character's own sex (as in THEMES.md): four women and four men. Nothing is designed or recommended for the other body, though every outfit still builds on it.
2. **A cosmetic set**: the warrior, the archer and the mage have nothing to do with it. So the weapon is **one class-neutral dressing** that restyles whatever weapon is held, not three class skins.
3. **Every item is newly designed**: no existing hat, hair style, top, bottom or shoes, not even recoloured. Each outfit is **seven new items**: head, hair, face, top, bottom, shoes, weapon.
4. **Unique, multi-coloured** clothes (the owner's review: "entire new designs", "more than a single colour"), plus **one** recommended slider setup per character (not five).

## The cast

| Character | Sex | Role, element | Reads as | Silhouette | Hair / eye style | Triangles over the base clothes |
|---|---|---|---|---|---|---|
| [Tansy](tansy.md) | F | grind, none | reach and bundles | a bell, widest at a coil-straw sun hat; a bibbed smock; a wheat sheaf | `sheafcrown` / `sunny` | +20,900 |
| [Torgeir](torgeir.md) | M | tank, earth | a thing that holds | the widest: an iron cap-helm, a fur mantle on one shoulder, an iron spaulder, greaves | `pairedbraids` / `heavy` | +17,900 |
| [Sazanka](sazanka.md) | F | risk DPS, dark + air | fast and fragile | the narrowest and lowest: a peaked hood, a cord sash with two tails, bound limbs | `cordlock` / `slit` | +20,100 |
| [Corvin](corvin.md) | M | support (debuff), light | light that points | a tall narrow column: a long coat, a cap lamp, round spectacles | `silverwave` / `keen` | +14,900 |
| [Sorrel](sorrel.md) | F | safe DPS, air | distance and wind | the tallest and lightest line: streaming hair, goggles, a very long scarf | `galelong` / `sharp` | +22,000 |
| [Ambrose](ambrose.md) | M | healer, water | tending | a soft triangle: a reed cone hat on the back, a flared apron-robe, a vial belt | `reedknot` / `soft` | +18,800 |
| [Dunstan](dunstan.md) | M | support (buff), fire | a flag and a beat | a rallying column: a plumed shako, a flame tabard, a drum at the hip | `goldqueue` / `hearty` | +20,800 |
| [Marigold](marigold.md) | F | mixed (safe DPS + support), light | performance | a little stage: a ring of lanterns, twin tails, a puffed bolero, a tulle skirt | `ribbontails` / `bright` | +20,000 |

The hiker is about 54,000 triangles; an outfit adds 15,000-22,000 at full detail (`charDetail('hero')`), proportionally fewer for other players and villagers (every segment count goes through `sg(n)`).

Pictures, rendered by the preview tool (`node tools/model-preview.js`, the game's own geometry shaded like its lighting): [`img/cast.png`](img/cast.png) (all eight, front), [`img/weapons.png`](img/weapons.png) (the weapon dressing on the warrior's sword and shield),
[`img/mix.png`](img/mix.png) (eight mixes of pieces from different outfits and base clothes, to judge how they sit together), and per outfit `img/<id>.png` (front, side, back) and `img/<id>-head.png` (the head from three sides). The preview does not draw unlit glow materials or run the outfits' animations (swaying scarves, turning lanterns, a drum that follows the thigh): in the game they move.

## How an outfit is built

A kit of hooks over the base body: each outfit paints the body (`paint`) and adds geometry on the torso, shoulders, forearms, hips, thighs, shins and head, with its own hair, eye style, face marks, loose animated parts (`extras`) and a weapon dressing (`dress`: palette, trim, a charm; applied by `weaponsOn` to the sword and shield, the bow and quiver, or the wand).
The hooks, the helpers (`torsoSize`, `ofRibbon`, `ofLoft`, `ofRingAt`, `ofPatch`) and the rules (two or more colours per part, clear the body, no pierced skirts, the triangle budget, original designs) are in **`docs/CHARACTER.md` section 9**. Dunstan is the worked example.

## Slider recommendations

Each outfit ships **one** recommended setup (the reference: the body it was fitted for) and the sliders whose recommended range is narrower than the base model's, in `CHAR_MODELS.<id>` (`signature:true`, `sexes:[...]`).
Each doc's "Slider recommendations" section is **generated from that code** (`node tools/outfit-looks-check.js --write`), so the two cannot disagree. The male setups keep the chest modest (the base model's male chest is now flat and broad, no longer bust-like).

## Where this differs from `docs/SKILL-SETS.md` (to approve or reject)

- SKILL-SETS section 8 describes **a weapon skin per class** (three) and "eight parts". With the owner's answer this is **one class-neutral dressing** and **seven items**. If class skins are wanted later, they are an add-on to the dressing, not a rewrite.
- The **parked look drafts** on the skill-sets branch (`docs/skillkits/parked/*-look.md`) were used only as a format model; these files supersede them for the eight characters. That branch is not touched here.
- The **encore look** (a client-only swap during a long effect) and any outfit effect tied to a skill are **not specified**: they depend on the set's skills.
- Hybrids are not special-cased: Sazanka (dark + air) and Marigold (support + DPS) get one outfit like the rest.

## Open questions and known gaps

1. **Mixing outfits is built.** Any gender may wear any outfit (SKILL-SETS rule), and the seven items mix: the editor's Top / Bottoms / Shoes / Hat rows (Clothes), Style (Hair), Face marks and eyes (Features) and Weapon style (Clothes) list every outfit's item next to the base ones in gold, and "Signature set" puts a whole outfit on. Mixes are checked for NaN, ground contact and a look, not for taste: a long coat over a skirt clips, a hair item under another set's hat may poke through. The editor's recommended ranges follow the set last put on whole. The **Signature** tab sets up a whole character in one tap (its gender, sliders, all seven pieces, designed colours), and every worn piece can be **recoloured** (`tint<Slot>` fields, `docs/CHARACTER.md` section 9, "Recolouring"; each kit declares `main` colours for it).
2. **Nothing unlocks an outfit.** The skill-set system that would grant them is not built; the picker in the character editor is a preview, labelled so.
3. **The weapon is a dressing, not a model.** It recolours the stock sword and shield, bow and quiver, or wand and hangs a charm; fine trim shows only as tints on those coarse meshes. A **held model that can be any object in the hand** (one prop per character, the same for every class) is designed in `docs/NOT-BUILT.md` section 9 and not built.
4. **Some elements' glow is minimal on purpose** (Tansy none; Torgeir one bead; Ambrose only the vials, though his mage orb is tinted aqua; Sazanka a small violet bead). Judge them in the game, not the preview.
5. **Contrast.** Sazanka and Corvin are deliberately dark; a lighter coat for Corvin would read better at distance.
6. **Searching the names.** Each IP check says to search the character name and genre *outside this repository* before final art. That has not been done.
7. **Where these files live.** They are on the branch `ccr-c8a5c7a2-rs6xm8` with the model work; the skill-sets documents are on `claude/skill-sets-plan-lp2c72`.

## How these files are checked

```
node tools/outfit-smoke.js [--only <id>]   # per outfit: builds on its body, every slider at both ends on both bodies, the triangle budget, a weapon dressing on all three classes; without --only also the mix: every pair of outfits slot by slot, each slot alone, base items with outfit items, loose parts per slot, nonsense names, old saves
node tools/outfit-looks-check.js           # the docs against the code: seven new item ids (none an existing one), builder notes, the dressing rows, one reference setup, the generated slider section
node tools/outfit-looks-check.js --write   # regenerate the slider section of every doc from CHAR_MODELS (and drop the old stand-in section)
node tools/model-preview.js out.png --outfit tansy,torgeir [--weapon warrior|archer|mage] [--bent] [--views front] [--size W H] [--at Y]
```

## Files

`<id>.md` for each character, `IMAGE-PROMPTS.md` (prompts for 2D concept art: a turnaround, a portrait, a costume breakdown and the weapons for each, plus a cast lineup), `img/` (previews).
Code: `src/game/outfits/<id>.js` (the kit and `CHAR_MODELS.<id>`), `src/game/character/outfit-tools.js` (helpers), hooks in `model.js`, `model-body.js`, `model-face.js`, `model-hair.js`, `pose.js` and `game/combat/weapons.js`.
