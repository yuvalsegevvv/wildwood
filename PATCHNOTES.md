# Wildwood patch notes

Newest version first. **Version 1** is what the released game (the `main` branch) contains; **Version 2** is everything new on top of it. Both lists are also in the game: the stacked-layers button left of the map.

---

## Version 2 (in testing)

The biggest update so far: a fourth land, dungeons you can run with friends, a way to fight other players, new looks and skills, and a lot of polish under the hood.

### New places
- **The Greyspine**, a fourth land north-west of the forest, with its own village, **Highmark**, monsters for levels 26-32 and two bosses. Rain falls below the peaks and snow on them; chamois graze on the slopes. Its own storyline, **Act IV of the main quest**, begins at Highmark.
- **The world map of Eldmere** (key **G**): the whole continent, with fog over places you have not visited. Click a land to open its map.
- The coastlines and borders between lands are curved, with bays and islets. The old tunnel to the Sakura Vale is now a **bridge over the Greyfall River**, and you can walk freely once a land is open.
- The Hoarfrost Reach is bigger.
- **The Proving Isle**, an island in a lake on the south beach, reached by a plank bridge from the Shore Road.

### Dungeons
- Play dungeon runs alone or in a **party of up to 4** (key **P**, or `/invite name` in chat). Rooms are put together differently every time, and no door is locked.
- Seven kinds of mission: Purge, Defense, Survival, Sabotage, Siege, Hunt and Escort. Every mission ends with a boss in a round hall.
- Monsters get tougher with each extra player, but **everyone gets all the loot**.
- Four dungeons, one in each land, each with its own boss: the Hollowed Elder, the Falls Door, the Barrow Door and the Old Adit (the Greyspine's mine).
- **The Trial Roots**: an easy first dungeon behind the Trial Gate in your home village, open from level 5 and free to try.
- Dungeons drop **level-30 rings and pendants** and **Tempering Stones** that make your gear stronger step by step.

### PvP
- The **Proving Isle**: fight other players on equal terms. Everyone has the same level, gear and double health. You fight with **your own favourite skills** (whatever you have equipped in the skills window, all three slots open), but at skill level 1, so only your choices matter. Nothing is won or lost: no XP, coins or drops. Your party members are safe from you.

### Characters, skills and gear
- **A reworked character model** and **signature outfits**, with a Signature tab in the character editor and outfit pieces that can be mixed.
- **Skill sets**: the first eight sets, each with its own skills, set bonuses and a symbol. In this version you can unlock any of them from Settings to try them out.
- **Elemental reactions**: a hit of one element leaves an aura; a different element on it reacts, and the two elements' effects land on the monster. All fifteen pairs are listed in the Guide.
- **Pendants**: a new necklace slot with five kinds of bonus (more XP, more drops, more coins, better critical chance, stronger critical hits).
- **Passive skills** open in three slots, at levels 13, 16 and 20.
- Enhancing gear carries more of its power, and armour has a soft cap on how much damage it can stop.
- Zone tiers go up to **IV and V**. Levels past 50 get harder to gain instead of stopping at a wall, and no kill pays for more than 10 levels above you.
- Bosses and monsters beyond level 60 are retuned so a fully powered hero still has a fight. Bosses show their health as a percentage.

### Screens and settings
- The sun button is replaced by the **Guide** (key **J**): controls, combat, skills, upgrades, dungeons, elemental reactions and the PvP island. Its button blinks until you open it for the first time.
- A **Versions** button (left of the map) lists what version 1 has and what version 2 adds.
- **Graphics** in Settings: Light, Medium, Standard (the default, as before) and High. The page reloads to apply it.
- XP and other big numbers are written with thousands separators (107,996,475,162).
- A new minimap and land maps in the style of the world map.
- The character editor's tabs wrap onto two rows so none is hidden.

### Fixes
- **Sunset**: the sun sinks below the horizon and the moon rises on the other side, instead of the sun stopping low and sliding east. The light fades gently as it changes over, and the same happens at dawn.
- A saved signature outfit no longer stops the game from starting.
- PvP no longer swaps your skills for the class defaults.
- Fixed a coin exploit and a bug that could crash the game for other players.
- Fixed problems with joining a shared world.
- Names and chat lines no longer accept invisible control characters.

### Under the hood
- The first load is **about 47% faster**, and the server does the same work much faster.
- The game server and its saves are sturdier against bad data, floods and crashes.

---

## Version 1 (released, `main`)

- **World**: the home forest (about 555 monsters in 19 zones, levels 1-20) with its village, roads, river, lakes and beach; the **Sakura Vale** (levels 16-25, village Hanami, reached by a tunnel the Rootwarden's fall opens); the **Hoarfrost Reach** (levels 22-30, Frostgate Pass, village Rimehold, snow, teleport circles). Day and night, rain and storms, music for every village and boss.
- **Story**: a main quest in three acts (levels 1-25) and a board of daily notices.
- **Bosses**: the Rootwarden, Carapax the Tide King, Akaoni, Kyuubi, Ymrik and Vetrmaw, each with its own moves.
- **Heroes**: warrior, archer and mage; a basic attack, a skill (level 3) and a burst (level 10); skills upgrade five levels; 48 boss skills; elements and the soul bound at level 15; passive skills; 210 items in 6 tiers and 5 rarities; a forge that merges three into the next rarity; zone tiers I-III.
- **Trades**: mining, woodcutting and gathering; ore makes weapons, logs make armour, herbs make potions.
- **Together**: chat, guest or name-and-password accounts, server-side saves, solo, shared or online play.
