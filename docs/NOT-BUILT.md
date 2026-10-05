# What is not built yet (with comments)

An honest list of what the Hoarfrost Reach update (and the Greyspine, section 3b) left out, and of the older gaps it touches, with a comment on each: why it is missing, what it
would take and where to start. Nothing here is a bug; it is the edge of what exists. Ask the owner before starting any of it (`CLAUDE.md` section 10
keeps the short list of ideas; the story for levels 26-50 is planned step by step in `docs/MAIN-QUEST.md` section 7).

## 1. Professions, tools, crafting and potions (`shared/professions.js`, `shared/crafting.js`; built, see `docs/MAIN-QUEST.md` section 5b)

What is built: three professions each with a **tool slot** (a node needs a tool of the tier of its zone), 367 nodes in every land (the Greyspine's included), ore / logs in six grades and
three lands' herbs, a Wayfarers' Lodge in every village (learn, buy tools, sell resources), a **cast** of about a second for every gather (a bar, no animation),
**crafting** at the weaponsmiths' (ore) and armourers' (logs), **brewing** at the healers' (herbs) and three potions drunk with Z / X / C.

**Decided against (the owner's call, do not build unless asked again):**
- **No gathering animation.** A gather is a cast with a progress bar and nothing else: no swing or kneel pose, no tool in the hand.
- **No tool durability.** Tools never wear out or break, and there are no repairs: a broken-tool system was judged annoying and unwanted.

**What is left, with comments:**

- **The numbers are first guesses, not balance-tested by play**: the resource counts of a recipe (`CRAFT_BASE`, `CRAFT_RAR`), the fees, the tool prices
  (`TOOL_PRICE`), how many nodes there are and how fast they respawn, the potions' strengths and cooldowns, the xp per gather, and the cast time (`GATHER_CAST`
  1.2 s, less 0.1 s per tool tier and 0.04 s per rarity, never under `GATHER_CAST_MIN` 0.6 s: meant to feel like a beat, not a wait). Crafting an epic piece of the
  top tier asks for about 100 logs and 13,000 coins on purpose (it should be an investment), but nobody has played it through yet.
- **A cast breaks only when you walk more than 1.5 m away or are knocked out**; a hit does not break it (it is short, and monsters roam near the nodes).
  Two players may cast on the same node: the first to finish takes it and the other gets "Someone has already taken this one".
- **Potions only heal, strengthen and guard**: the three kinds are healing, might and guard (`POT_KINDS`). Status-cleansing potions (antidotes, a potion that clears
  a boss's freeze, slow or root: `pfxStep`), regeneration over time, potions with a level requirement and buff icons on the HUD beyond the belt's timer are **not
  built**. There is no alchemy beyond the three recipes and no way to make a potion better than the land's herbs allow. To add a kind: a row in `POT_KINDS` (id,
  herbs, cooldown, key `potN` in `KB_ACTIONS`), its effect in `drinkP` (`server/crafting.js`), and a button in the belt (`game/ui/potions.js` builds one for each kind).
- **Tools are not crafted**: they are only bought at a Lodge (common) and merged at a forge. A Craft tab for tools at the smiths would give ore and logs another use.
- **Resources are only sold to lodge keepers** (`sellResP`, a fixed price by grade in `RES_SELL` / `HERB_SELL`); Odran and the stalls still buy items only, and
  there is no trading between players (`docs/MAIN-QUEST.md` section 7, S2).
- **The quest board has no gathering or crafting notices** (only the main quest asks for them: W6a, W7b, W11b, V7b, F4-F6). **Planned, to implement later** (the board
  code is `shared/quests.js` for the notices and rewards, `server/economy.js` for accepting, counting and handing in, `server/players.js` `sanitizeQuest` for saves,
  `game/economy/quests.js` for the panel):
  - Two new kinds next to hunt, bounty, scout and boss: **`gather`** ("Bring me N ore / logs / herbs": `type:'gather'`, `target` a resource id of the notice's level, `count`) and
    **`craft`** (`type:'craft'`, "make one piece of tier T" with `kind:'weapon'|'armor'`, or "brew N potions" with a potion kind). Only offered to players who
    know the profession (`gear.prof`) and, for craft, only for a tier they could make (`craftCost`); otherwise `genQuest` draws another kind.
  - **The resource of a gather notice comes from the zone of the notice's level** (`tierFor(L)`: the grade is `ORE_GRADES[t]`, `LOG_GRADES[t]`, or the land's herbs), so a
    level-8 notice asks for iron ore and never for something the player cannot mine. Counts follow `huntCount` scaled down (a gather takes longer than a kill: about 8-16 at level 1).
  - **Counting**: a hook in `finishGatherP` (`server/professions.js`) next to `mqGatherP`, like `questKillP`, that adds the haul to every active `gather` notice for that resource
    (the double yield counts twice); `craftP` and `brewP` call a `questCraftP` the same way. Progress lives in `Q.active[id]`, and the resources are **not** taken from the bag
    (the notice counts what you gather, so it does not fight the smiths and healers for the same materials); a variant "hand in the goods" that takes them from `gear.res` is the
    other option and needs a Deliver button in the panel.
  - **Rewards** in `questRewardFor`: XP and coins like a hunt of the same count (`n * xpFor(L) * 1.2`, coins `* 1.5`), with a chance of an item like a hunt; a craft notice
    could pay a rare tool. `sanitizeQuest` must accept the new kinds (it returns null for unknown ones, which is what protects old saves) and clamp `target` to `RES` / `POTS`.
  - **Panel and map**: `quests.js` needs the text and a marker (a gather notice has none: it can point at the nearest node of the resource, like `mqPartTarget` does).
  - **Test**: `tools/professions-smoke.js` (gather and craft with a notice active) and `tools/server-smoke.js` (the board still offers only valid notices).
- **Nodes stand where the rng puts them**: 7 to 9 in a zone, spaced 9 m apart, and they can overlap a tree (the plants are placed on the client only), so a vein may
  sit half inside a trunk. The Reach has 90 in its nine zones (10 a zone), the home zones 7 to 9. Higher-tier nodes cannot be worked before the level of their tool (level 25 for the
  Reach's top zones), so a lower-level player sees them only as locked (they are left off the map).
- **Profession levels stop at 5** (`PROF_XP`) and a profession has no ranks, trainers per level or specialities; the level only adds to the double-yield chance
  (`NODE_KINDS.lv` is 1 for all).
- **The next lands** need a grade of ore and logs, two herbs, a node plan and a tool tier each (`ORE_GRADES`, `LOG_GRADES`, `HERB_LANDS`, `TOOL_MAT`): the tiers
  are six now because gear has six.

## 2. The rest of the story (levels 26-50)

Only planned, in `docs/MAIN-QUEST.md` section 7: the Sunscar (Glasswell, Rook, the medicine that wakes Wren), Amber Reach (the song and
the reveal), the Emberwake Isles (the Sink and the ending), and the Stormhorn and Rootdeep side branches. The main quest ends at G9 with Odran's tip about Glasswell's physician (`MQ_END`; the Greyspine's act IV is built, section 3b). Levels 26-30 in the Hoarfrost are walkable side content without quest steps. The story's payoffs for the iron bird, the plate and
Ymrik's last words wait for the reveal at the end of Amber Reach (`docs/STORY.md`): no NPC explains them yet, by design.

- **The west glacier valley** is built (section 3b), and so is the story around it: F9 hands over to **Act IV, G1-G9** (`docs/MAIN-QUEST.md` section 3c: Highmark, the black stone, Odran's coins, the night shift, the Gryphon Queen, the shaft, the golem's frame, the Mountain Golem). What is left is acts V-VII and the hooks that wait for the reveal.
- **The Nine Tails** (Kyuubi's side story, vale levels 21-25) is still only hinted (`docs/MAIN-QUEST.md` section 4).
- **More Hoarfrost side content**: Sigrun's other sagas, the hunters' hunts, ice-fishing on Frostmere, a story reason to go to the wyrm's nest (the iron bird can be
  read there, but no step asks for it).

## 3. The Hoarfrost Reach itself

- **Weather is regional only on the client.** The server still has one weather for the whole world; the client turns rain into snowfall and a storm into a
  blizzard when the camera is in the Reach. So everyone hears the same "it is starting to rain" schedule, thunder in the Reach is a thundersnow, and there is no
  weather that only exists in the Reach (a snowfall without a storm, or clear cold nights with ground blizzards). The Greyspine does the same by the ground's height (`greySnowAmt`). Real regional weather (sandstorms, gales, tropical
  storms are needed by later lands too) means a per-region schedule in `server/weather.js` and a region in the snapshot's weather field.
- **The ice wall is opened per player.** The server lets each player through once `gear.north` is 1 and moves them back otherwise, and each client sinks the wall when its
  own save says so, so two players can see different things at the wall. That matches the tunnel's door and is fine for a shared world, but it is not a world event.
  Movement itself is only clamped (no real anti-cheat, like everywhere: `CLAUDE.md` section 10).
- **Rimehold is not walled** (`WORLD.md` calls it a walled town of hunters and ice-fishers): it has a gate with shields and rune stones but no palisade, no chimney smoke
  (the home village has it), no watchtower and no ice-fishing huts. Its NPCs follow the same day-and-night schedule as the other villages.
- **The Hoarfrost monsters have no mechanics of their own.** The 18 kinds are recolours or variants of existing models (a wolf variant of the fox, a fur mantle and axes for the
  goblin family, a new wyrm model); monsters' elements still do not change the damage they deal. The bosses are different: since the boss rework each of the six has its own
  move set (`server/boss-kits-*.js`, see CLAUDE.md), but no boss has a unique drop beyond materials and skills, and the moves' numbers are first guesses, **not balance-tested
  by play** (Ymrik's ice prison, Vetrmaw's dives and Carapax's waves hit hard on purpose: they are telegraphed).
- **The 12 new boss skills** reuse the generic effects (`fx`) with new icons and one new projectile look (frost shards); their numbers were copied from the analogous
  skills of the older bosses and are **not balance-tested by play**. The skill icons are simple placeholders.
- **The iron bird** is scenery plus one readable spot; there is no interior, loot or quest on it. Its emblem (a sun in a ring) is the story's continuity mark.
- **The teleport window lists villages only**: no cost, no cooldown beyond 2 s, no other kinds of waypoints (camps, the Rootdeep's circles will need them). It opens by
  itself when you step onto an attuned circle and only there.
- **The aurora** is a small shader (two strips), off on the lightest device setting; it does not react to the moon or to snow beyond fading under cloud.
- **Performance was not measured on a phone.** The heightmap grew from 716 x 441 to 716 x 741 cells and the terrain is drawn in tiles culled in both directions; the desktop cost
  of world generation went from about 1.1 s to about 1.8 s of JS, a phone will pay more. The far-lands placeholder north of the Reach is unchanged and has no LOD.

## 3b. The Greyspine, fourth land (levels 26-32; `shared/greyspine.js`, `highmark.js`, `greyzones.js`; design in `docs/WORLD.md` sections 3 and 8)

**Built** (`CLAUDE.md` section 4 has the file map; test `node tools/greyspine-smoke.js`):

- the ground (valleys, ridged mountains, walls, colours, treeline) and a zone label;
- **the map and the minimap** (`game/ui/map.js`): the painted world map covers the Greyspine (peaks, snow, tarns, river and fjord read `waterSurf`), the corner minimap works there like anywhere, and the full map (N) has it as its fourth land (`LANDS.grey`): it opens from the other lands once the glacier valley's ice fall is open (`westOpen`, `gear.west` 1) or while you stand in it (`landOpen`), the "next land" button includes it, and it names the zones with their levels, Highmark, the two bosses, the three tarns and the fjord, the Blackseam's door (the Old Adit), the two rock falls in the west wall (grey while shut, light blue once open), the 53 resource nodes you can work (as in the Reach), and carries the zone-tier row; test `client-smoke`;
- **the way in**: the glacier valley `GLEN` cut through the Vale Wall at the Reach's west edge, shut by an ice fall until Ymrik falls (`gear.west`), with the Glacier Road from Rimehold to Highmark;
- **Highmark** (`VIL4`, shelf `GREY_HM`, ~100 m up): nine named NPCs and fillers, a Wayfarers' Lodge, a teleport circle (the travel window now lists four villages), a respawn point once you have walked in (`gear.west` 2);
- **seven zones and 14 monster kinds** (two per level 26-32, 12 of each, earth and air; a new gryphon model family, a golem, crystals, a rock troll...), their materials with names, `MAX_ZONE_LV` 32;
- **two bosses**: the Gryphon Queen (29; her peak, a flat nest on a cone-shaped mountain; kit `gryphon`) and the Mountain Golem (32; a cavern; kit `golem`), 12 boss skills, two board quests;
- **water**: three tarns, a river that leaves the range to the west, and a fjord on the south-west coast, with wading, banks, plants, camps and the map all reading one `waterSurf`;
- **the two rock falls** in the west wall (the river road, opened by the Gryphon Queen: `gear.river`; the neck pass, by the Golem: `gear.neck`): canyons through the wall to the world's edge;
- **the main quest, act IV** (`docs/MAIN-QUEST.md` section 3c): G1-G9, Odran's cart at Highmark, the black stone veins, a night guard against grey-veined granite slimes, the deepest shaft and the golem's broken stone as lore spots;
- **zone tiers** (`ZTIER_LANDS` has `grey`: the picker, the Mountain Golem opening them) and **its dungeon, the Blackseam**, a mine under Highmark Pastures with the boss Garrick (`docs/DUNGEON-THEMES.md` section 9), whose clear pays a **pendant** (`docs/PENDANTS.md`);
- **weather by height** (client only): rain in the valleys and on Highmark's shelf, a sleet band on the slopes (rain and flakes together), snow on the peaks, the line `greySnowAmt` (`shared/greyspine.js`) following the ground's own snowline (colder in the far north, like a Minecraft biome's temperature by height); `WX.snow` is driven by the ground's height under the camera (`updateWeather`, `game/world/weather.js`), so the sky tint and the wind sound follow too;
- **wildlife**: the **chamois**, small harmless herds of mountain goats on the high slopes (`game/wildlife/chamois.js`, built the first time you stand in the Greyspine; they graze, look up and bolt from you; not synced, like the deer);
- testing tools: `dev tunnel` `glen` / `glenw` / `highmark` / `grey` / `queen` / `cavern` / `riverfall` / `neckfall`, `dev west`, `dev gate`, and the buttons in the Testing section (the Old Adit's door button included).

**Not built**, in about this order:

- **The lands beyond the gates.** The two canyons end at the world's edge: nothing lies behind them (the Sunscar behind the river road, the Stormhorn behind the neck pass). When they are built
  the rectangle must grow west (section 5) and each canyon becomes a real road; until then opening a gate only changes a toast and a mesh.
- **The Rootdeep and the story's loose ends in the Greyspine**: G7 (the deepest shaft) is a hook only (a lore spot you read): the mine below has no home, and the optional bits of act IV are not built (the abbey's cut page, Konrad's and the other NPCs' own lines about the black stone, a reason to read the Queen's nest). Highmark's fillers say a few things about the coins and the humming (`SMALLTALK4`) and nothing more.
- **The Greyspine's own grades of ore, logs and herbs, and a tool tier 6**: the Greyspine has nodes now (53: 6 in each of its seven zones of the Reach's rime ore, frostpines and snowmoss, plus 11 veins of **black stone**, `RES.blackstone`, `NODE_KINDS.blackstone`; the Lodge buys it, nothing is forged from it), but no grade of its own: `ORE_GRADES`, `LOG_GRADES` and `HERB_LANDS` stop at the Reach, so the best weapons and armour still come from rime ore and frostwood, and potions have no Greyspine herb (Aurel's "gentian and edelweiss" are only words). A new grade means gear tier 6 (below).
- **Gear tier 6 and the economy past 25** (a decision, not a gap in the Greyspine's content: the level-30 dungeon gear fills the level above tier 5, and its ids end in 7): gear stays at tier 5, drops and the shop do not follow the levels 26-32 (`tierFor`), `VALE_TOP_LV` is still 25, and the XP curve is the stopgap of
  section 5.
- **The Greyspine's zone-tier symbol is a placeholder** (to replace later): its tier points now count toward the symbol and it has a fourth badge (`ZTIER_SYMBOL_LANDS`, `.zs.grey` in `22-tiers.css`: a slate-silver stand-in colour), but the **symbol stops at +150%** (`ZTIER_SYMBOL_CAP` in `shared/tiers.js`). Why: the balance yardstick `tools/boss-duel.js` (docs/areas/tiers.md) was tuned with three lands' fifteen points (+150%); with the Greyspine's five on top (+200%) the maxed level-60 hero beat the tier V Vetrmaw standing still (3 of 3 won), which the owner's targets forbid. So today a hero with the three older lands maxed gains nothing from the Greyspine's points. To replace: the cap (raise or remove it and re-tune the bosses' creep, `BOSS_CREEP_*`, or give the Greyspine a smaller value per point), the badge's look, and the Greyspine's tier numbers themselves (tiers I-V of its monsters and Garrick are unchecked).
- **A use for coins at level 30 and above: not implemented yet.** Past the last shop tier (gear stays at tier 5, `tierFor`), level-30 gear is only paid by dungeons and tempered with stones (no coins), so the coins a level 30+ hiker earns (`coinsFor`, x20 from bosses, +pendants of Fortune) have nowhere to go but potions and brewing. Ideas, none chosen: a coin cost on tempering or merging, a coin price on Tempering Stones, a Highmark shop, buying a dungeon's key. Recorded here only; it is not part of the Greyspine work.
- **Music**: the Blackseam plays the Reach's `hoar1` track; Highmark and the zones play the Rimehold and Reach tracks and the two boss fights the Reach's boss songs (`boss26` for the Queen, `boss30` for the Golem) as placeholders (`THEMES`, `musicThemeHere`); no recorded track exists
  for the Greyspine, and no night mix for Highmark.
- **Weather and sound**: (rain below the peaks and snow on them is built, see above) sudden mist, thunderstorms on the peaks, avalanches as a boss move, an alpine wind of its own (the Greyspine uses the home forest's ambience, apart from the Reach's wind that `rainSoundTick` already blends in with `WX.snow` when it snows; only the footsteps on water follow `waterSurf`). Regional weather is still client-side only (section 3): everyone gets the same "it is starting to rain" schedule, and a clear sky is clear on the peaks too. What the height rule leaves out, so a later pass can pick it up:
  the snowline numbers (rain below the white ground's line minus 16 m, snow 34 m above it, `greySnowAmt`) are my first guesses and nobody has played with them; the rule reads the ground's height under the camera, so a camera high on a cliff edge or a jump does not change it, but there is no real temperature (no day / night difference, no cold at the Reach's border, no wind pushing the snow line);
  nothing remembers the weather on the ground (rain does not wet the slopes, snow does not settle on the valley floors, the white ground stays as painted); a thunderstorm on the peaks is a blizzard with the lightning of the forest (thunder is a thundersnow, as in the Reach) and a storm in a valley is the forest's; the toast
  names what falls where you stand when it starts only, not when you climb into the snow; the sleet is a mix of the two layers, with no sound or look of its own (`rainSoundTick` blends the rain and the wind by `WX.snow`); and the seam where the Greyspine's height rule meets the Reach's z rule (the glacier valley, the shared crest at x = HALF) was not walked: `WX.snow` eases over ~0.5 s, so a hard step there would show as a short blend.
- **More wildlife**: only the chamois exist; marmots on the meadows, eagles or a lammergeier over the peaks, and a bird or two at the tarns are not made (animals in the Vale and the Reach are not either). The chamois themselves are plain dressing: no call or hoof sound, no sleeping at night (they graze all night),
  no use in quests or the map, nothing to hunt or drop, and they are not synced (every player sees their own herds, `CHAM_HERDS` is 2 in lite mode and 3 otherwise, 3-5 goats each, the numbers are guesses); they stay on slopes 88-205 m high and keep away from Highmark, the two boss arenas and the glacier valley, so the valley floors have none; the model (about 700 triangles) was checked in the model preview but not
  measured on a phone; and they are not drawn in a dungeon run (the Blackseam is under Highmark Pastures, a different place).
- **Dressing of the village and the land**: Highmark has no palisade, no rope bridges on the troughs' flanks and no shrines (the doc's dressing); no waterfalls in the Greyspine itself (the tarns, river and fjord are
  surfaces without falls, foam or sound beyond the shared water; the one waterfall of the world, the Greyfall, is on the home forest's rim: `docs/areas/regions.md`); no **wonder** (a floating rock, `WORLD.md` rule 9) and no mine entrance.
- **The monsters' mechanics**: the 14 kinds are new models (the gryphon family, crystals, the troll) but share the ordinary AI; no kind uses terrain (rock fall from cliffs, wind gusts), and the
  bosses' moves and numbers are first guesses, **not balance-tested by play** (the Queen's swoop and the Golem's quake are telegraphed on purpose).
- **The far lands**: the placeholder mountains beyond the north and west edges still use `farHeight` ('grey' region, `game/world/far-lands.js`): its edge vertices take the real
  height (`getH`), so they meet, but the shapes behind the walls are not related to the real range, and the canyons open onto them.
- **Map** (built, see above; what is left): the river has no name on the map (it is the unnamed outflow of the Mirrortarn), the two canyons past the rock falls are painted only up to the world's edge (nothing lies behind them yet, section 5), and there are no marks for the monsters' camps or for the lore spots of act IV (the quest marker of the story step is the only pointer).
- **Balance of the ground**: 26% of the inner country is steeper than 0.95 (the home forest 9%, the Reach 13%); that is how the mountains read, and camps keep to ground under 0.55
  (54% of the inner country). If the zones turn out cramped, widen the troughs (`in` / `out` in `GREY_VALLEYS`) first.
- **Performance was not measured on a phone** with the Greyspine's extra meshes (Highmark, the nest, the cavern, the water surfaces, the rock falls); the terrain tiles are the same.

## 3c. The borders between the lands, the Greyfall River and the Greyfall (`shared/terrain.js`; guide `docs/areas/regions.md`)

**Built** (tests `node tools/greyfall-smoke.js`, `coasts-smoke.js`, `slope-smoke.js` and `client-smoke`): the four lands' borders are curves that wander instead of the rectangle's straight sides (`borderX(z)`, `borderZ(x)`, pinned straight at the bridge, the glacier valley, Frostgate Pass and the junction, each in bends of 115-350 m: the river and the vale | Reach wall are 1.35 times longer than their chord, the other two lines 1.1-1.2), the
mountain range between lands varies (broad massifs and necks, a ramp or a steep wall, foothills running out into the land); **the Vale Wall south of the junction is a river** (the Greyfall River, 32-60 m wide, all the way, no mountain spur), crossed by **one stone bridge** at z -100 (deck, parapets, piers, a gatehouse barred until the Rootwarden falls, a torii; `TUN` / `buildBridge`), born at **the Greyfall**, a
waterfall of about 125 m off the home forest's north rim (a tarn on the rim, a slot cut through the crest, a plunge pool, a streaked sheet with foam, spray and a roar); every rule that asked "which land" asks both coordinates now. **The sea is the edge of the world and the continent is no rectangle**: the Reach's glacier wall and east cliffs and the Greyspine's north crest are gone; the coast is a drawn outline (`CS_BASE` in `shared/coasts.js`: an L with capes, bays and islets, shingle and sand beaches, bluffs), with the Queen's cone as a headland and the vale's boss arena held back from the water. **The Reach is a landmass as big as the others** (about 495,000 m2 of land, was 244,000: the world rectangle grew to 1710 x 1680 m, the plateau runs on east and north past the vale's and the Greyspine's edges). **Free movement**: the border clamps act only while the land beyond is locked; once open, the ground, the water and a **slope limit** (a climb steeper than 1.2 is turned along the face or dropped; `slopeBlock`) are the only walls. The map no longer shows a grey band between lands.

**Not built**:

- **Only the bridge crosses the river.** No ford, ferry or boat (the river is deeper than a hiker may wade, and the bridge's gate is a story gate); the story texts say "the bridge" now but several docs still say "the tunnel through the border mountains" (`docs/STORY.md`, `docs/MAIN-QUEST.md`); the names `TUN`, `inTun`, `findTunnel`, `inTunnelCut` and the dev command `tunnel` stay from the tunnel. The bridge has no sound of water under it and nothing but the gatehouse's lanterns for night light.
- **The river has no life of its own**: no sound (only the Greyfall's roar, from 420 m), no fish, reeds, stepping stones or banks dressed differently from the meadow, no mist over the pool; the sheet is a texture on a ribbon (no foam at the lip, no inflow stream above the tarn, no rainbow), and nothing measured its cost on a phone (a ribbon of 38 rows, 150 spray points on a desktop, 90 / 50 on low / lite).
- **Other kinds of natural barrier**: the walls between lands are still mountain ranges (only their profile varies); cliff bands, gorges, lakes or another river are not built. The Greyspine's north is a high bluff coast (the spine lowers toward the sea, but it is still 60-120 m of cliff in places, not a beach), and the Reach's plain coast is a bluff too: a beach is long and gentle only inside a bay.
- **How far the lines bend is my numbers** (`borderX` / `borderZ`: the river up to 210 m west of x = HALF and 40 m east, the north wall 100 m south, the Reach's wall 115 m north of z = HZ0 and 45 m south, the Greyspine | Reach wall up to 105 m east): limited by where zones, camps, Highmark and the Sink stand. Moving that content would allow more; the strip the river gives the vale (up to 210 m wide, west of x = 440) has trees but no zone and no monsters. The home forest's north wall bends least (1.1 times its chord): its north zone's camps are close behind it. The coasts are limited by the vale's content (nodes and zones 50-130 m from its east and south shores, the boss arena held by `CS_HOLD`), the Reach and the Greyspine's north coast have room.
- **The Reach's new land is empty.** The snow land east of x = 990 and north of z = -1040 (about 290,000 m2) has terrain, a coast and snow, but no monsters (the zones' camps stand within 75 m of their seeds, which did not move), no resource nodes (they come from the zones), no village, dungeon door or story: decide what lives there (more zones, levels 22-30 spread wider, a new dungeon, a hot-spring village, the quest line's next act) before filling it. Its coast is a cape and bay outline over a plateau 50 m up, so most of it is bluffs; the long gentle beaches are inside the bays.
- **The Warlord Isles are a first try**: zone 24 (Warlord Ruins, its 24 monsters and 7 nodes) lives on the big island and is reached by one plain plank causeway (83 m: The Isle Road, `shared/roads.js`; no arched bridge, no boat, no lighthouse), the two small islands beside it are land only and unreachable, and no villager, sign or story line says why the Warlord Ruins stand on an island (the zone keeps its name and level; nothing in the code refers to its old place). The island's ground is the vale's hills lifted to a beach at least: it has no lakes, no rocks of its own and the vale's vegetation as is. The vale's dungeon door Iron Gate Keep (named for the Warlord Ruins) is still at (826, 82) on the mainland.
- **The continent's west and south are still straight**: Wildwood's south shore (`coastDist`'s own formula; the Tide King's beach and the shore zone are found by scanning it) and the west edge (the Sunwall along x = -388, the Greyspine's west wall) are the old lines; the Sunscar and the other lands beyond them are not built, so the west edge is a wall by design. Giving the south shore bays and capes means moving `ARENA_TIDE` and the shore zone with them (`docs/areas/world.md`).
- **Things that still assume the rectangle**: the continent's overview map `docs/world-map.svg` (drawn by `docs/world-map.py`), the far-lands placeholders (`game/world/far-lands.js`) and a few sizes in the map's crops (`LANDS`, widened by hand) were not redrawn; the dungeon entrances' map `docs/dungeon-entrances.png` is drawn from the real terrain and was regenerated.
- **The world map of Eldmere shows the planned continent, not the built one** (`docs/areas/world-map.md`): it is the docs drawing (`docs/world-map.py`), so Wildwood's and the vale's outlines are the draft's, not the game's L-shaped coast with its bays and the Warlord Isles; the pin is fitted to the four villages (exact in each, a few percent off elsewhere) and kept inside its own land's region. Stormhorn, Sunscar, Amber Reach and the Emberwake Isles are fogged for good and named nowhere (the docs keep their names back); when one is built, take it out of the fog groups in `wmapFogBuild` and give it a land id in `ui/map.js` and `world-map.js` (the recipe is in the guide). Nothing about quests, bosses or dungeon doors is drawn on it yet: the land maps carry those.
- **The sub-zones' own borders** (the Greyspine's seven zones are still nearest-seed cells with a small warp; they cut across the valleys as straight-ish lines, and the zone map shows it): not reworked, that was not what was asked. A terrain-following version (a walking-cost partition, borders on ridges and at necks) and gentler slopes in the Greyspine (18% of its inner country is steeper than 1.2, the slope limit: still all reachable, `slope-smoke`, but 66% of the northern coast band is a cliff) are the next candidates.
- **The slope limit is one number and one rule**: 1.2 for everyone, up only (no stamina, no sliding down, no climbing hands), only on the ground (a jump clears nothing), not inside dungeons; the server does not know it (`setPos` trusts the client's position, as it does for every other wall), and a monster ignores it (their camps need `grad < 0.55`, but a chasing monster may walk up a face you cannot). Nothing tells the player why they stopped: no sound or cue at a cliff.

## 4. Music (done)

The four Hoarfrost songs exist (`music-rimehold`, `music-hoar`, `music-boss26`, `music-boss30`, made with Google's Flow Music; see `assets/audio/README.md`). What is left: the licence
of the free-plan tracks (all eleven) if the game ever earns money, and, if wanted, the darker night mix for Rimehold and Hanami (today only the home village has it).

## 5. Systems the next lands need (not started)

- **XP curve and gear past 25/tier 5**: the curve is flattened to 2,100 same-level kills a level from 25 (a stopgap so 26-30 are playable), gear stays at tier 5, `MAX_ZONE_LV` is 32
  and skill upgrades still ask for drops of at most level 25 (`VALE_TOP_LV`). Levels up to 50 need a real curve, more gear tiers (items, icons, looks) and a decision about upgrades.
- **The world rectangle** must grow again (west, south-west; the Greyspine fits inside it, but the lands behind its two gates do not) and the Rootdeep needs an enclosed instance (`docs/WORLD.md` section 8).
- **Group play, trading between players, party quests** (`CLAUDE.md` section 10). Group play (a party of up to 4) is **planned as the first step of the dungeons**, `docs/DUNGEONS.md` sections 5 and 11 (milestone M1); trading and party quests are not.
- **Dungeons** (randomized tile dungeons, Warframe-style missions, up to 4 players): **built** (parties, runs in far-away slots, the seven missions, the three dungeons with their bosses, the doors and the Delve board, the level-30 rewards: `docs/DUNGEONS.md`, `docs/DUNGEON-THEMES.md`, code map `docs/areas/dungeons.md`) and tested headless, but **never looked at in a real browser** (colours, brightness and the doors' look are reasoned guesses). Not built, each a small job: the cache chests in the dead ends (the `C` marks: nothing draws or fills them; Defense and Survival give their own chests); an overflow stash for a full bag (the clear's piece is lost when the bag is full); the later missions Vault, Interception and Dig; big monsters in the corridors (walkers only: the treants and other kinds over 0.9 m stay as guardians in their rooms; a wide-door variant and a clearance-aware flow field are the work); the barrow's gloom hazard and any spore hazard (only spikes, steam and the rime prison exist); bosses collide with pillars only for the Jade Elder's charge (nothing stops them walking through the others); real music for the three dungeons and their bosses (existing tracks stand in); a ceiling and room lights for phones (they get the player's own torch); a visible Party button outside a party (key P, a name tag or `/invite`); exact respawns-left and `use` / percentage fields on objective kinds (the client works them out); dungeons in Shared (room) mode, which refuses runs (its one 4 KB broadcast cannot isolate them); the door's apron stands 7 m out, beyond the 4.5 m talk range, so after a run you step closer to open the board again.
- **Real passives** (the eight in `PASSIVES` are a placeholder set; only one slot is open).
- **Server-side anti-cheat for movement**, and synced villagers.
