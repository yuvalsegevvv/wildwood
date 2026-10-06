# Look: Tansy (kit: grinder)

> **PARKED** on the owner's request (only themes and genders are planned for now, so a change costs one row; see `../THEMES.md`). Raw material only: written for the first theme draft, **rewrite it from the approved theme instead of editing it**. Do not read it for any other task.

## Persona

| | |
|---|---|
| Name (working) / id | Tansy / `tansy` |
| Sex | female (any character may wear all of it) |
| Feel | late twenties, sturdy, always moving |
| Personality | relentlessly cheerful, hums while she works, hates waste, cannot sit still |
| Palette | straw `0xd8b56e`, moss `0x6f8f3a`, rust `0xa6482a` (canvas cream `0xe8e4dc`) |
| Silhouette | wide hat brim, a broad apron, a long curved blade: a farm-hand, not a soldier |

## The eight parts

| Part | Draft | Existing field or NEW |
|---|---|---|
| Head | a wide straw hat with a green band | **NEW** hat `strawhat` |
| Hair | one thick braid wound round the head, straw gold | **NEW** hair `crownbraid`; colour `0xd8b56e` exists |
| Face and eyes | freckles across the nose; warm amber eyes, round | **NEW** face mark `freckles`; eye colour `0x6b5a2e` exists; eye style default |
| Top | a sleeveless canvas apron over a rolled-sleeve shirt | existing `flannel` + **NEW** extra `apron` |
| Bottom | patched breeches with wrapped shins | existing `trousers` + **NEW** shared extra `wraps` |
| Shoes | sturdy boots, mud-brown | existing `boots`, recoloured |
| Weapon: sword and shield | a curved billhook blade and a round wicker shield | **NEW** skin `billhook` |
| Weapon: bow and quiver | a crooked hazel bow and a seed-pouch quiver | **NEW** skin `hazelbow` |
| Weapon: wand | a besom-handled wand tipped with a wheat bundle | **NEW** skin `besomwand` |

## Body fit

The apron and wraps follow the sliders (chest, height, build); the brim must clear the braid; nothing assumes a skirt or trousers. Works on both bodies.

## IP check

Original. **Riffs on:** the harvest farm-hand and hedgerow-cutter. **Deliberately avoids:** a red hat band and anything pirate (a famous straw hat), a hooded cloak or skull (the reaper), any named scythe-wielder of an existing franchise.

## Files when built

`shared/outfits/tansy.js` (the data), `game/outfits/tansy.js` (the extra meshes: apron, wraps, the three weapon skins, the hat).
