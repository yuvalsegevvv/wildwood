# Look: Marigold (kit: idol / magical girl)

> **PARKED** on the owner's request (only themes and genders are planned for now, so a change costs one row; see `../THEMES.md`). Raw material only: written for the first theme draft, **rewrite it from the approved theme instead of editing it**. Do not read it for any other task.

## Persona

| | |
|---|---|
| Name (working) / id | Marigold / `marigold` |
| Sex | female (any character may wear all of it) |
| Feel | twenties, small, bright |
| Personality | radiant on a stage, ordinary and shy off it; practises alone; always looks for the first row |
| Palette | marigold `0xe59a2b`, cream `0xfff2d6`, plum `0x5a2a4a` |
| Silhouette | high twin-tails, a short jacket, a layered skirt, a lantern wreath: a small stage |

## The eight parts

| Part | Draft | Existing field or NEW |
|---|---|---|
| Head | a wreath of small paper lanterns | **NEW** extra `lanternwreath` (small, glowing) |
| Hair | high twin-tails with ribbons, marigold orange | **NEW** hair `twintails`; **NEW** hair colour `0xe59a2b` (not in the palette) |
| Face and eyes | a tiny lantern glyph under the left eye; big, glossy hazel eyes | **NEW** face mark `glyph`; eye colour `0x6b5a2e` exists; **NEW** eye style `bright` |
| Top | a short stage jacket with puffed sleeves | **NEW** top `stagejacket` |
| Bottom | a layered skirt with sash ribbons | existing `skirt` + **NEW** extra `layers` |
| Shoes | tall lace-up boots with tiny bells (silent) | existing `boots` + **NEW** extra `bells` |
| Weapon: sword and shield | a fine blade with a lantern-shaped pommel and a round shield shaped like a paper fan | **NEW** skin `fanshield` |
| Weapon: bow and quiver | a bow shaped like a small harp, its string glowing | **NEW** skin `harpbow` |
| Weapon: wand | a wand topped with a glowing paper-lantern orb | **NEW** skin `lanternwand` |

**The transformation look** (client-only, while Curtain Call lasts): ribbon trails from the sleeves, a halo of lanterns, the jacket turns cream with marigold trim. It is a second set of extra meshes, **built ahead** so the swap does not hitch, and it must fit both bodies like everything else.

## Body fit

The twin-tails, ribbons and the skirt layers follow the sliders; the lantern wreath sits on any head; works on both bodies.

## IP check

Original. **Riffs on:** the stage-idol and magical-girl *genres*. **Deliberately avoids:** sailor collars and sailor-style uniforms, crescent-moon or winged-star-staff motifs, a talking animal mascot, colour-coded team members, any transformation phrase or sequence from a show, any real idol group's costume.

## Files when built

`shared/outfits/marigold.js`, `game/outfits/marigold.js` (wreath, jacket, skirt layers, bells, three skins, the transformation set).
