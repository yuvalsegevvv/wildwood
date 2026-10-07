# Professions, tools, crafting, brewing, potions

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Professions (mining, woodcutting, gathering): the Wayfarers' Lodge in every village, resource nodes, resources, the double-yield rule

rules, `NODES` (367: the Reach's plan first, then each home and vale zone, then the Greyspine's 53, last so older nodes keep their numbers; `blackstone`, the Greyspine's quest ore, is a resource outside the six gear grades), `RES`, `NODE_KINDS`, `PROFS`, `ORE_GRADES` / `LOG_GRADES` / `HERB_LANDS`, `nodeBlock` (why you cannot work a node), `doubleChance`, `castTime` (a gather is a cast of about a second), `nearLodge` in `shared/professions.js`; `learnProfP` / `gatherP` (starts the cast) / `finishGatherP` / `updateCastsS` / `sellResP` / node respawn in `server/professions.js` (`gear.prof`, `gear.res`, sanitized by `sanitizeProf`); the Lodge panel (keepers Tamsin, Isamu, Gudrun, role `lodge`: learn, buy tools, sell resources), node meshes (`oreGeo`, `treeParts`, `herbGeo`: geometry shared per kind), gathering with the gather key (`gather` in `KB_ACTIONS`, default H because G is the world map's; handled next to `gatherNode`; the talk key still gathers when no villager, heartleaf or lore spot is in reach) and its cast bar (`CAST`, `onCastEvent`) `game/economy/professions.js`; styles `20-professions.css`. A node needs a tool of the gear tier of its zone (`n.need`, `tierFor`), so a new land = a grade of ore and logs, two herbs, a node plan and a tool tier

### Tools (pickaxe, axe, sickle): three equipment slots (`eq.pick`, `eq.axe`, `eq.sickle`), the same 6 tiers and 5 rarities as gear, bought at a Lodge, merged at the forge

`TOOL_LIST`, `TOOL_SLOTS`, `TOOL_MAT`, `TOOL_PRICE`, `TOOL_EXTRA` (in `shared/items.js`: tools are in `ITEM` but not in `ITEM_LIST`, so shops, drops and "all items" leave them alone); `equipP` / `buyP` / `sanitizeGear` (checks the slot of a worn item); the inventory's tool row `BODY_SLOTS` (`game/economy/inventory.js`), icons `toolIconArt` (`game/ui/item-icons.js`)

### Crafting (weapons from ore at Tomas / Kenji / Bjorn, armour from logs at Ilse / Haruka / Dagny) and brewing (Linnea, Hinata, Ylva: role `brew`)

recipes `craftCost`, `CRAFT_BASE`, `CRAFT_RAR`, `POTS`, `POT_KINDS` in `shared/crafting.js`; `craftP` / `brewP` in `server/crafting.js`; the Craft tab (`craftHtml`, in the shop panel) and the Brewing panel `game/economy/crafting.js`; styles `21-crafting.css`. Neither is a profession: the NPCs do them, the professions supply the materials

### Potions: drinking (`potion{k}`), the buffs (`p.potb`, read by `potBuffP` in `rollDmgS` and `hurtP`), cooldowns, the potion belt and keys Z / X / C (`pot1..3` in `KB_ACTIONS`)

`drinkP` in `server/crafting.js`; `game/ui/potions.js` (belt, `onPotionEvent`, icons); potions are counts in `gear.pot` (sanitized by `sanitizePots`), not items
