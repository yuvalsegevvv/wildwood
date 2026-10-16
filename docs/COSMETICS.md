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
