# Version 3: the professions' new purpose, and cosmetics

Gear comes from the dungeons, so the three professions (mining, woodcutting, gathering) pay in other ways. Tests: `node tools/revamp-smoke.js`.

## Your home
A private plot (`HOME_YARD`, a clearing near the home village found by `shared/professions.js`, radius `HOME_PLOT_R`). You enter with `home{a:'enter'}` (the *Go home* button of any Lodge panel; `homeP`, `server/professions.js`) and leave with `home{a:'leave'}` (the bench's Lodge panel); the position you left from is `p.homeFrom`. While `homeAt(x,z)` you are alone: `homeSnapS` (hook in `broadcastSnap`) cuts other players out of your snapshots and you out of theirs, `nearestFighter` skips you, and the props (workbench, fence) and the nodes are drawn only to someone at home. The bench (talk key) opens the Lodge panel: cosmetics are made and resources sold there too. 18 nodes: a vein of each of the six ore grades, a tree of each log grade, each of the six herbs; the tool tier you wear decides how far up you can work. They are the **last** 18 entries of `NODES` (`home:true`), so older node numbers do not move.
The nodes are **per player**: `p.hback` (not saved) holds when each comes back (`HOME_RESPAWN`, 60 s) and node events carry `e.to`, so nobody else sees it taken. Server: `gatherOkP`, `finishGatherP`, `homeRewardP`, `updateNodesS` (`server/professions.js`).
Rewards of a gather there besides the material, small on purpose: exp (`HOME_XP` of the level's exp times the grade), coins (`HOME_COIN` of a kill's), and rarely (`HOME_UPG` times the grade) an upgrade item: a Tempering Stone from level 30, a skill-upgrade material below.

## Tools' small bonus
A tool worn in its slot of tier 3 or better (Silverstone) adds attack (pickaxe), health (axe) or defence (sickle): `TOOL_BONUS_*`, `toolBonusOf` in `shared/professions.js`, read in `recalcP`. At most 2% each (rarity adds a little), 6% in all.

## Potions
`regen` (Mossblood Draught: heals a share of your health every second for 20 s), `scholar` (+exp, 5 min), `fortune` (+coins and drop chances, 5 min), each in three strengths, keys `pot4`..`pot6` (T, U, O). `POT_KINDS`, `potVal`, `potDur` (`shared/crafting.js`), `updatePotionsS` (`server/crafting.js`), `rewardKill` reads `scholar` and `fortune`.

## Auras and capes
`shared/cosmetics.js` (7 auras, 7 capes, costs in ore or logs + a herb + coins, `gear.cos`), `server/cosmetics.js` (`cosmake`), `cosCleanLook` (in `newPlayer` and the `look` message: no unowned aura or cape), the model `game/character/cosmetics.js` (`cosDress`, called at the end of `buildCharacter`; loose meshes moved by `rig.anims`), the lodge's Cosmetics list `game/economy/cosmetics.js`, the editor's Cosmetics tab. Look fields `aura` and `cape` (default `''`). See one: `node tools/model-preview.js out.png --looks '[{"cape":"regal","aura":"stellar"}]'`.

## Version 3.2: the general pieces, crafting and try-on
Seven slots hold pieces that belong to no set: hat, top, bottom, shoes, gloves, cape, aura (`CP_SLOTS` in `shared/cospieces.js`, the letters h/t/b/s/g/c/a are the first letter of a `gear.cos` key such as `'h:catphones'`). Every base garment from before is **free**; new pieces (`CP_PIECES`) and most capes and auras are **crafted** at a Wayfarers' Lodge from profession resources (`gear.res`) and/or monster drops (`gear.mats`) plus coins (`CP_RECIPE`, the materials fit the piece: ore for metal, logs for wood, herbs for cloth, a matching monster's drop for hide, scales and the like). Free capes: Backpack (the old `pack` switch is now `cape:'pack'`, migrated in `fullLook`), Wayfarer's, Mossback; free auras: Firefly, Dewfall.
- Server: `cosMakeP` (`server/cosmetics.js`) refuses free pieces and takes materials; `cosCleanLook` strips any crafted piece you do not own, in every slot.
- Colours: `look.capeColor` / `capeTrim` / `auraColor` / `auraColor2` (-1 = as designed), read through `cosTint` (`game/character/cosmetics.js`).
- Eyes: `look.pupil` (`FACE_PUPILS`), `look.eyes2` (second eye colour), `EYEC_MORE`. Chest slider max 2.2, in the Shape group, widened ribs through `chestEff` / `chestRibs`.
- Bold garments (crop, halter, harness, loincloth, short shorts...) draw underwear where skin would otherwise show (`gmxBare*`, `model-garments-more.js`); the new hats are in `model-hats-more.js`, the new gloves in `GL_BASE`.
- **Try-on**: the editor lists locked pieces with a padlock and their recipe and lets you wear them; while a locked piece is worn (`edTrying`) the look is neither saved nor sent (`saveLook`, `lookForNet(LOOK_SAVED)`) and the Done button is blocked until every worn part is owned or you go back (`edRevert`).
Test: `node tools/cospieces-smoke.js`.

### Decorations (slot `d`)
Small details worn **up to three at once**, in any of `look.deco1`, `deco2`, `deco3` (a decoration does not belong to a place: the same piece may sit in any field), each with its own colour `decoColor1..3` (-1 = as designed). All 19 are crafted (none is free): `CP_PIECES` rows with slot `d` and recipes `'d:<id>'` in `shared/cospieces.js`. `DECOS` (`game/character/model-decos.js`, `decoReg(id, anchor, builder)`) draws each as a small merged mesh on a rig anchor (`headTop`, `face`, `neck`, `chest`, `back`, `waist`, `shoulderR`, `wristL`, `ankleL`), a few with a motion in `rig.anims` (halo and moth bob, the tail sways). A new decoration is one `decoReg`, a `DECO_COL` colour, a `CP_PIECES` row and a recipe. The editor's Decor tab has three rows with a colour picker each; `cosLocked` returns the `field` of each locked decoration so `cosCleanLook` strips exactly that field.

### Multi-colour crafted tops and bottoms
Like a set's piece, every crafted top and bottom (`GMX_TOPS` / `GMX_BOTTOMS`) has up to four colours: the main one (`topColor` / `bottomColor`) and `tintTop2..4` / `tintBottom2..4` (-1 = as designed). `GMX_PAL` (`model-garments-more.js`) lists each piece's design colours; `gmxPalAt(L, slot)` resolves them for the builders and `gmxPalDef` feeds the editor's "Second / Third / Fourth colour" pickers. Free base garments stay single-colour. Test: `cospieces-smoke`.
