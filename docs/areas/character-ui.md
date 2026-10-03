# Character model, keys and other UI

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Character body, face, hair, hats

`game/character/model.js` (`buildCharacter`, `muscleLimb`, `sculpt`, `smoothN`; look defaults `LOOK_M`/`LOOK_F`, palettes `HAIRC` (+`HAIRC_NATURAL`), `SKINS`, `CLOTH`...; `randomLook(rng,{villager,base})` serves both "Surprise me" and random villagers: villagers use a seeded rng, so its draw order must not change); armour looks `ARMOR_LOOK` in `shared/items.js`; editor rows `EDIT` in `game/ui/character-editor.js` (`fem:true` = female-only row, `close:true` = the tab frames the head)

### Keys: the rebindable actions (`KB_ACTIONS`: id, name, default main + spare key), saving (`wildwood-keys`), swapping, labels (`kbName`, AZERTY via `getLayoutMap`), the `data-kb` hints on HUD buttons, the Controls list in Settings (`#kbSec`). A key handler asks `kbIs(e.code,'<action>')` / `kbHeld('<action>')`, never a literal `KeyX`. A new action = a row in `KB_ACTIONS` + its handler (a new default key must not collide with another action's; `kbLoad` keeps saved keys first)

`game/player/keybinds.js` (+ the handlers in `input.js`, `combat-hud.js`, `talking.js`, `economy/init.js`, `ui/map.js`, `ui/settings-sound.js`, `ui/chat.js`, `movement.js`); test `node tools/keys-smoke.js`

## Pitfalls

- Rotations: an NPC anchor face `f` looks along `(-sin f, -cos f)`; a character's front is −z; a positive
  `rotateX` tilt on a head shell lifts its front rim (hats). Measure with a quick numeric check before
  guessing signs.
- Character facets: Lambert (per-vertex) lighting, `computeVertexNormals` seams on lathes/spheres, and a
  per-vertex random colour hash all made single triangles visible. Now: Phong, `smoothN`, and a faint
  smooth `noise2` tint in `pc`. Don't reintroduce any of them on characters.
- A new hard-coded villager changes every random villager's look (the seeded rng's draw order): give it `late:true` (spawned after the others, own rng).

## Reference numbers

- Character proportions (style between realistic and anime): about 7.2 heads tall; hips at 0.92 m, head
  centre 0.72 above the hips, head scale 1.18 (female 1.15), eyes ~15-25% larger than real; short neck.
  Female `chest` 0.5-1.6 (default 1): a slider on the character editor's Body tab (`EDIT` in `ui/character-editor.js`,
  `fem:true`; it is not in Settings); named NPCs set it in `VILLAGERS`, random villagers roll
  0.7-1.35 in `randomLook`. Default looks have no backpack.
