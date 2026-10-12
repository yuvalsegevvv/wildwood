> **PARKED** (same reason as the look files here).

# Look features: what the eight drafts need that the model does not have

> For whoever does the **model work** (milestone M5), once looks are drafted again. Derived from the eight parked look files (`<kit>-look.md` in this folder): **if this list and a look file disagree, the look file wins**; update this list when a look changes. Read `../RULES.md` section 5 for what already exists.

## Summary

| Kind | Existing, reused | NEW (count) |
|---|---|---|
| Hair styles | `bob` (Sazanka's base), `bun` (Ambrose), `ponytail` (Dunstan) | **6** |
| Hair colours | 6 of the 15 (straw, grey, black, white-blond, brown, copper) | **1** (`0xe59a2b`) |
| Face marks | `beard`, `stubble`, `mustache` (facial hair) | **6** + 1 accessory |
| Eye styles | the default round | **4** |
| Head pieces | `cap`, `kasa`, `helm` + plume | **2** hats / hoods + **3** extras |
| Tops | `jacket`, `flannel` as bases | **7** + 4 extras |
| Bottoms | `trousers` (+ `plate`, `mail`), `skirt` | 0 + 2 extras |
| Shoes | `boots` | **1** + 2 extras |
| Weapon skins | none | **24** (8 for each class) |

## The new features, and who needs them

| Kind | Feature | Needed by |
|---|---|---|
| Hair | `crownbraid` (a braid wound round the head) | Tansy |
| Hair | `braids` (two thick braids) | Torgeir |
| Hair | `sidelock` (a long side strand with a cord; an extra on `bob`) | Sazanka |
| Hair | `sweptback` | Corvin |
| Hair | `flowing` (long, loose) | Sorrel |
| Hair | `twintails` | Marigold |
| Hair colour | marigold orange `0xe59a2b` | Marigold |
| Face mark | `freckles` | Tansy |
| Face mark | `scar` | Torgeir |
| Face mark | `stripe` (across the nose) | Sazanka |
| Face mark | `streak` (pale cheek streaks) | Sorrel |
| Face mark | `stripes` (war paint under the eyes) | Dunstan |
| Face mark | `glyph` (a small lantern under one eye) | Marigold |
| Face accessory | `spectacles` (round, brass, a glint) | Corvin |
| Eye style | `heavy` (heavy-lidded) | Torgeir |
| Eye style | `slit` (slit pupils) | Sazanka |
| Eye style | `sharp` (narrowed) | Sorrel |
| Eye style | `bright` (big, glossy) | Marigold |
| Head | `strawhat` | Tansy |
| Head | `hood` (shared; with a feather trim for Sorrel) | Sazanka, Sorrel |
| Head extras | `lamp` (a glowing brass lamp on a cap), `goggles`, `lanternwreath` | Corvin, Sorrel, Marigold |
| Top | `apron`, `gambeson`, `longcoat`, `tunic`, `robe`, `tabard`, `stagejacket` | Tansy, Torgeir, Corvin, Sorrel, Ambrose, Dunstan, Marigold |
| Top extras | `furmantle`, `scarf`, `satchel`, `neckscarf` | Torgeir, Sorrel, Ambrose, Sazanka |
| Shared extras | `wraps` (wrapped shins and forearms), `furcuff`, `layers` (skirt layers), `bells` | Tansy, Sazanka, Sorrel (`wraps`); Torgeir; Marigold |
| Shoes | `softboot` (split toe) | Sazanka |
| Transformation | a second, pre-built set of extras swapped in while a burst lasts | Marigold |

## Weapon skins (24)

| Persona | Sword and shield | Bow and quiver | Wand |
|---|---|---|---|
| Tansy | `billhook` | `hazelbow` | `besomwand` |
| Torgeir | `ringshield` | `ironbow` | `wardstaff` |
| Sazanka | `shortblade` | `hipbow` | `cordwand` |
| Corvin | `lanternshield` | `lanternbow` | `lanternpole` |
| Sorrel | `estoc` | `featherbow` | `lenswand` |
| Ambrose | `bellmace` | `herbbow` | `reedwand` |
| Dunstan | `bannershield` | `pennantbow` | `standardstaff` |
| Marigold | `fanshield` | `harpbow` | `lanternwand` |

**To keep 24 skins cheap:** build **three parametric builders** (one for the sword and shield, one for the bow and quiver, one for the wand), each taking a style (blade shape, guard, shield face, limb shape, tip), the way `weaponsOn` already builds the six tiers from one body of code; a skin is then a style record plus at most one extra mesh.

## Suggested order for the model work

1. **Cheapest first**: the colour and field patches of the existing parts (already done by the data), then the **shared extras** (`wraps`, `hood`, `scarf`, `bells`, `furcuff`).
2. **Hair and face** (6 hair styles, 6 face marks, 4 eye styles, the spectacles): they touch `buildCharacter` and its clamps, so do them together, and add every new field's default to `LOOK_M` and `LOOK_F`.
3. **The garments** (7 tops), one persona at a time.
4. **The three weapon builders**, then the 24 styles.
5. **The transformation look**, last.

Every step is checked with `node tools/model-preview.js` on **both bodies and the slider extremes**.
