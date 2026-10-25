# Kin features (version 3)

Racial features for every player, from the first minute: no race, just optional parts like the elf-ear slider and the zombie skin tone. The land that gives them a people (the Amber Reach, `docs/SAVANNA.md` when it lands) is a separate task; these parts work without it.

## What a player can pick
Editor, Body > **Kin**: ears (`look.kinEars`), muzzle (`kinMuzzle`), tail (`kinTail`), fur colour (`furColor`, -1 = the skin tone), second colour (`furColor2`: ear and tail tips, markings, whiskers, tusks, beak; -1 = each part's own) and marking (`furMark`: stripes, spots, patches, mask, socks, belly). Clothes > **Decor**: Lyre Horns, Nose Horn and the Great Mane (three more decorations; a mane replaces the hair row).

| Slot letter | Look field | Free | Crafted (Wayfarers' Lodge, `gear.cos` key `e:fox`) |
|---|---|---|---|
| `e` ears | `kinEars` | cat, round | fox, hare, antelope, rhino, crest |
| `k` tail | `kinTail` | thin, puff | bushy, tufted, spotted, striped, plume |
| `m` muzzle | `kinMuzzle` | nose, whiskers | snout, tusks, beak |
| `d` decoration | `deco1..3` | none | lyrehorns, rhinohorn, mane |

Crafted parts use the same lock / try-on / server stripping as every other piece (`cosLocked`, `cosCleanLook`, `edTrying`); free parts are base parts and never stored.

## Set parts: the three Kin outfits (K2)
Brindle (hyena), Dessa (rhino) and Sefi (cheetah) each bring their own ears, tail and muzzle (`e:brindle`, `k:dessa`, `m:sefi`...) as **set parts**: `kinDefineSet` in `shared/kin.js`, drawn with the helpers of `model-kin.js` from the outfit's own file (`game/outfits/<id>.js`, which also registers `KIN_HAT_EARS.<id>='poke'`). They are not free and not crafted: no Lodge recipe, never in `CP_PIECES`, not in `kinList` (so the counts in `cospieces-smoke` hold); `kinSetList(slot)` lists them and `kinSetsOf(look)` names the sets a look wears. The part id is the set id, so the editor's Kin rows show the tile like an outfit piece (a lock until the set is owned, a try-on bar from `osLocks` when worn unowned).
`CHAR_MODELS.<id>.kin = {ears, tail, muzzle, fur, fur2, mark}` is written onto the look by `ofWear` (`ofKinSwap`, `outfit-tools.js`) when the whole set is worn; going back to base or to another set removes only what the old set had set, and the rows stay editable. The nose horn (Dessa) and the tear lines (Sefi) are drawn inside the muzzle, so they follow it wherever it is worn.

## Code map
- `shared/kin.js`: the registry (`kinDefine`, `KIN_PARTS`, `KIN_BAD`), `kinPart` (own-property lookup), the markings and fur lists, `KIN_HAT_EARS` / `kinHatMode`, `KIN_LOOK` (the defaults). Loads before `shared/cospieces.js`, which appends the crafted parts to `CP_PIECES` / `CP_RECIPE`.
- `game/character/model-kin.js`: the ears / tails / muzzles (`KIN_EARS`, `KIN_TAILS`, `KIN_MUZZLES`), the three decorations (`decoReg`), `kinFur`, `kinMarks`, `kinLook`, `kinDress`.
- Editor: the Kin sub-tab in `ui/character-editor.js`; tiles in `ui/character-thumbs.js` (kinds `kinEars`, `kinMuzzle`, `kinTail`, view `hips`); the Lodge list in `economy/cosmetics.js`.
- See it: `node tools/model-preview.js out.png --kin ears|tails|muzzles|decos|marks|all`. Test: `node tools/cospieces-smoke.js`.

## Hooks into existing files (`// kin:`)
| File | Hook |
|---|---|
| `shared/cospieces.js` | `CP_SLOTS` / `CP_LETTERS` gain e, k, m; the loop that adds `KIN_PARTS` to the catalog |
| `game/character/model.js` | `kinLook` at the top of `buildCharacter`, `kinFur` after the outfit kit, `kinDress` before the shield; the six look defaults |
| `game/ui/character-editor.js` | the Kin sub-tab, tile captions, the six fields in `OUTFIT_KEYS` |
| `game/economy/cosmetics.js` | the Lodge lists slots e, k, m |
| `game/character/outfit-tools.js` | `ofWear` calls `ofKinSwap` (a set's `kin` written onto the look, removed on the way out) |
| `game/ui/character-editor.js` | the Kin rows list `kinSetList`; `osLocks` counts `kinSetsOf(LOOK)` |

## Rules
- Fur is vertex colour on the skin: `kinFur` sets `X.skin` before the body is built; `kinMarks` repaints only vertices that still carry the skin colour (clothes, eyes, hair keep theirs).
- A hat sets the ears' mode: poke (beanie, cap, bandana, circlet, laurel, none), hide (hood, helm, catphones) or flat (everything else, including outfit hats).
- Budget: the heaviest ear + tail + muzzle together add under 600 triangles at hero detail (`cospieces-smoke` checks it). Parts never use fur shells or extra bones; the tail swings through `rig.anims`.
- Look fields are untrusted: no bare keys, colours are range-checked, markings looked up with an own-property check.
- K2 (the three Kin signature outfits, above) sets these fields through `CHAR_MODELS.<id>.kin`; the mixing rows keep working because they are ordinary look fields.
