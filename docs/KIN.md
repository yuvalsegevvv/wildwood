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

## Rules
- Fur is vertex colour on the skin: `kinFur` sets `X.skin` before the body is built; `kinMarks` repaints only vertices that still carry the skin colour (clothes, eyes, hair keep theirs).
- A hat sets the ears' mode: poke (beanie, cap, bandana, circlet, laurel, none), hide (hood, helm, catphones) or flat (everything else, including outfit hats).
- Budget: the heaviest ear + tail + muzzle together add under 600 triangles at hero detail (`cospieces-smoke` checks it). Parts never use fur shells or extra bones; the tail swings through `rig.anims`.
- Look fields are untrusted: no bare keys, colours are range-checked, markings looked up with an own-property check.
- K2 (the three Kin signature outfits) sets these fields as part of an outfit's pieces; the mixing rows keep working because they are ordinary look fields.
