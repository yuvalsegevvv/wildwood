# Character model, keys and other UI

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Character body, face, hair, hats

**Read `docs/CHARACTER.md` first** (proportions, no "building blocks", the 31 sliders, recommended setups and ranges, the signature-outfit kits). Files: `game/character/model-body.js` (torso with the neck and shoulders in one surface, `limb` arms and legs, hands, `buildFoot`, `charDims`), `model-face.js` (the skull `headSculptFn`, `HEAD_TALL`, eyes / nose / mouth / brows / ears placed on the skull's real surface by `place`), `model-hair.js` (cap + locks, hats), `model-parts.js` (`limb`, `sweepTube`, `loftRings`, `smoothN`, `pc`, `OUTFITS`), `outfit-tools.js` (outfit helpers) and `model.js` (assembly `buildCharacter(look,{q})` → rig + `dims` + `sliders` + `anchors`; `charDetail`; look defaults `LOOK_M` / `LOOK_F`, palettes, `randomLook(rng,{villager,base})`: villagers use a seeded rng, so its draw order must not change). The slider table, `CHAR_MODELS`, `applySetup` and `validateCharModel` are in `shared/character.js`; the editor `EDIT` in `game/ui/character-editor.js`. **Do not rebuild the body from separate rounded parts**: joints must continue each other. See it: `node tools/model-preview.js out.png` (`--setups`, `--bent`, `--outfit id`); tests `node tools/character-smoke.js`, `outfit-smoke.js`, `outfit-looks-check.js`, `start-smoke.js` (editor).

### Signature outfits

One file per character in `game/outfits/<id>.js` (a kit of hooks over the base body, the weapon dressing, one reference setup): `docs/CHARACTER.md` section 9, designs and previews in `docs/skillkits/looks/` (README first), 2D art prompts in `docs/skillkits/looks/IMAGE-PROMPTS.md`.
**The editor has no Class tab** (the class is the weapon you hold, `clsOf`; there is no class row and no "start over" button). Its tabs: Body, Shape, Face, Eyes, Features, Hair, **Signature**, Clothes.
**The Signature tab** is the auto set-up: one tap on a character (`setLook('model', id)`) sets the look to that character's recommended gender (`CHAR_MODELS.<id>.sexes[0]`), recommended sliders (`applySetup` with its reference setup), all seven pieces (`ofWear`) and the colours they were designed in (every tint -1); 'Take the outfit off' puts plain clothes back.
**The editor's rows for the pieces** (`ui/character-editor.js`, `EDIT`): Clothes has Top, Bottoms, Shoes, Hat and *Weapon style*; Hair has Style; Features has *Face marks and eyes*. Each row lists the base choices and then every outfit's item (`ofItems(slot)`, labels from `CHAR_MODELS.<id>.items`, drawn gold with the owner in the tooltip) and writes the look field of that slot (`top`... `faceItem`, `weaponItem`; `OF_FIELD`).
A seg row marked `base:'<slot>'` (facial hair, antenna hair, backpack) is hidden while that slot wears an outfit's piece. **A colour row marked `base:'<slot>'` (top, bottom, shoe, hat, hair, eye colour, and the weapon colour row, `only:true`) recolours the piece while one is worn**: it writes `look.tint<Slot>` (`OF_TINT`) instead of the base colour field and has a *Designed colours* chip (tint -1); the palette is `TINTC` (`model.js`), hair `HAIRC`, eyes `EYEC`. `setLook` calls `ofTidy`: `look.model` goes back to `'base'` once none of that set's pieces is worn. An old save that wore a set only through `model` is given its pieces by `fullLook` (`ofMigrate`).

### Keys: the rebindable actions (`KB_ACTIONS`: id, name, default main + spare key), saving (`wildwood-keys`), swapping, labels (`kbName`, AZERTY via `getLayoutMap`), the `data-kb` hints on HUD buttons, the Controls list in Settings (`#kbSec`). A key handler asks `kbIs(e.code,'<action>')` / `kbHeld('<action>')`, never a literal `KeyX`. **Gamepad** (`game/player/gamepad.js`): sticks drive `joyX`/`joyY` and `look`, buttons (`GP_BTN`, fixed standard layout) send a keydown/keyup with the action's current key, so rebinds and every handler keep working; test `keys-smoke`. A new action = a row in `KB_ACTIONS` + its handler (a new default key must not collide with another action's; `kbLoad` keeps saved keys first)

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

- Character proportions (anime-leaning, see `docs/CHARACTER.md`): about 5.9 heads tall (the skull is 10% taller than a ball: `HEAD_TALL`), 1.9 m (female 1.8 m, the model is scaled 0.95), legs about 53% of the height; head scale 1.40 (female 1.37) on a skull of
  radius 0.105; moderate (not exaggerated) eyes, a rounded chin, a small nose and mouth, a short slender neck, a flat broad male chest; hips at about 0.95 m. 31 sliders (`BODY_SLIDERS`), each editable on a tab of the character editor (Body, Shape, Face, Eyes, Features, Hair);
  named NPCs set looks in `VILLAGERS`, random villagers get small slider offsets from a hash of their look. Default looks have no backpack and start on the base model's reference setup (Hero / Heroine).
  Cost: the hiker about 54k triangles (`charDetail('hero')` 1.1), other players 23k, villagers 16k, phones and light mode 8-11k; a signature outfit adds 15-22k at full detail.
