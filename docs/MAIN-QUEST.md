# Main quest line: Wildwood, the Sakura Vale, the Hoarfrost Reach and the Greyspine (built, levels 1-32), and the plan for levels 28-50

The first four chapters of the main quest line: **Act I** (Wildwood, levels 1-15), **Act II** (the Sakura Vale, levels 15-20; it
ends at the first vale boss, Akaoni), **Act III** (the Hoarfrost Reach, levels 20-25; it ends at Ymrik the Rimeking) and **Act IV** (the Greyspine, levels 26-32; it ends at the Mountain Golem, section 3c). They follow
`docs/STORY.md` (the story, the spoiler rule, the hints) and `docs/WORLD.md` (the lands), and teach the game's systems as the story needs
them. **Built**: the steps are data in `src/shared/main-quest.js`; section 6 says how the code fits together. **The rest of the story (acts V-VII, the Sunscar onward) is only
planned** (section 7): nothing in it exists in the game yet (`docs/NOT-BUILT.md` comments on this and the other gaps). The vale's second boss (Kyuubi, level 25) is saved for a side story
(section 4), not built yet.

## 1. Goals and pacing

- **About 30 minutes of quest play per land**: walking, talking, the objectives themselves and the boss fight. The time a player
  spends levelling between steps is not counted in it.
- **The main quest is the best path, not enough on its own.** Its rewards give about **30% of the XP** a land requires (Wildwood:
  levels 1 to 15, 29%; the Vale: levels 15 to 20, 31%; the Hoarfrost Reach: levels 20 to 25, 27%). The rest comes from hunting and the
  quest board (Maren, Sayuri, Ragna). Steps have a **level gate**: a step is offered only from its level; until then the giver says to
  hunt and take notices, and the quest log says "From level N".
- **Teach one system at a time, when the story needs it.** A step's `tip` is a one-time toast when it starts.
- **The story comes first in the main quest** (`STORY.md` section 7): a player who follows only it understands the acts built so far.
  Side content (section 5) adds hints and is never required.

### Rewards
A step's XP is `r x expToNext(gate level)`, a share of the level it is gated at, so the rewards keep their meaning if the XP curve is
tuned later; coins are `r x 18 x` a board quest's coins at that level, plus 10 (`mqReward`). W11 also gives three identical items
(for the forge). Steps gated at 20 (V10, V11) give their XP toward level 21.

**What the rest costs (current curve)**: Wildwood's other 71% is about 1,000 kills of the right level, a few hours with board quests.
Levels 15-20 in the vale need about 1,450 kills of one level up beyond the quest (the curve past 15 is steep: `CLAUDE.md` section 10).
From level 25 on `expToNext` is flattened (`shared/balance.js`): a level then costs as many same-level kills as 25 -> 26 does (about
2,100), so the Hoarfrost's levels 26-30 are a long but bounded grind instead of the 7,800 kills a level the old curve would have asked
at level 30.

## 2. Act I: "The Grey Rain" (Wildwood, levels 1-15)

**New people** (`VILLAGERS`, all `late:true` so random villagers keep their looks):
- **Wren**, the player's younger sibling, in a sickbed under an awning by the first house right of the gate (`VIL.bed`). Wren has the
  player's skin and hair colour, greyed by the sickness; asleep (lying) unless a step wants them awake (`wrenAwake`: handing a step in
  to Wren, and the goodbye in W18), then sitting up.
- **Healer Linnea** at the herb garden (she brews potions: role `brew`).
- **Tamsin**, keeper of the home village's Wayfarers' Lodge (`role:'lodge'`, plaza 2): every village has a lodge and a keeper (Isamu in
  Hanami, Gudrun in Rimehold), see section 5b.
- **Odran** the peddler (a watcher, `STORY.md`): his cart stands by the gate from W8 until V8 (`odranHere`); he buys anything,
  sells a little of everything, and shows curiosities he will not sell.

| # | Step | Gate | Giver → hand in | Objective | Teaches | r |
|---|---|---|---|---|---|---|
| W1 | The grey rain | 1 | (starts) → Linnea | See to Wren; fetch Linnea | moving, talking (E) | .6 |
| W2 | Heartleaf | 1 | Linnea | Pick 5 heartleaf in the Slime Meadow (glowing, E); defeat 5 slimes | picking, fighting, monster levels | 1.2 |
| W3 | A weapon of your own | 2 | Aldric | Try another weapon (class) | classes | 1.2 |
| W4 | Dressed for the woods | 3 | Ilse | Buy something; wear armour | coins, shops, inventory | 1.1 |
| W5 | The first trick | 3 | Aldric | Use your skill; 5 horned beetles | skill slot, cooldowns | .9 |
| W6 | The board | 4 | Maren | Finish and hand in a board notice | the quest board | .9 |
| W6a | Working hands | 5 | Tamsin | Learn Gathering at the Lodge; buy a sickle and wear it; cut 3 herbs | professions, tools (5b) | .5 |
| W7 | Sap of the Heartwood | 5 | Linnea → Wren | 3 heartwood sap (treants, 50%); bring it to Linnea | the map and its markers | .8 |
| W7b | Linnea's kettle | 6 | Linnea | 3 sunpetal; brew a Healing Potion at Linnea's; drink one when hurt (Z) | brewing, potions | .5 |
| W8 | The peddler | 6 | Odran | Sell him 2 things at his cart | selling | .6 |
| W9 | Grey in the bog | 7 | Bram | 3 grey-veined bog slimes (spawned for you in the Bog) | drops, tough monsters | .55 |
| W10 | Sharper | 8 | Aldric | Upgrade a skill | skill upgrades | .5 |
| W11 | Three of a kind | 9 | Greta | Merge the three items she gives you | rarity, the forge | .45 |
| W11b | Made by hand | 9 | Tomas | Learn Mining; buy a pickaxe and wear it; mine 10 ore (copper, inner woods); craft a weapon at Tomas's | crafting, ore | .45 |
| W12 | Everything at once | 10 | Aldric | Use your burst; 3 dire boars | burst slot | .4 |
| W13 | The storyteller | 11 | Oskar | Hear Oskar's tale **after dark**; read the Stone Circle's carvings | day and night | .35 |
| W14 | Shiny things | 12 | Bram | The goblins' hoard (Goblin Chieftain, 35%) | harder zones, playing together | .3 |
| W15 | Beyond the mountains | 13 | Linnea → Bram | Ask Bram about the way east | level gates | .25 |
| W16 | Ready | 14 | Bram | Reach level 15; carry a level-10 weapon or better | preparing for a boss | .22 |
| W17 | The Rootwarden | 15 | Bram | Defeat the Rootwarden (its last words: "The roots... cannot hold... for long.") | boss mechanics | .2 |
| W18 | Goodbye for now | 15 | (starts) → Daisuke | Say goodbye to Wren; Linnea's charm; walk to Hanami | the tunnel | .06 |

Story beats per step (who says what) are in the data (`offer`, `say`, `done`). The hints of act I: grey in the beetles' shells (W5),
Odran's question "who here was born in Wildwood?" (W8), the grey creeping in from the edges and Wildwood always last (W9), the "grey
sleep" tale nobody remembers the end of (W10), the old smiths' steel (W11), ships with no sails (W13), the glass egg "like a lamp with no
flame" that Odran buys at once (W14).

## 3. Act II: "The Blossom and the Blight" (the Sakura Vale, levels 15-20)

Existing people: Daisuke (guard), Sayuri (board), Kenji and Haruka (shops), Tetsuo (forge), Master Ryu (trainer), Grandmother Chiyo
(storyteller), Soul-reader Kaede (Soul Hall); Odran's cart moves to Hanami's gate at V8. New with the professions: **Isamu** (the
Wayfarers' Lodge) and **Herbalist Hinata** (brews potions), both `late:true`.

| # | Step | Gate | Giver → hand in | Objective | Teaches | r |
|---|---|---|---|---|---|---|
| V3 | Hanami | 15 | Daisuke | Meet Sayuri, Kenji, Haruka, Tetsuo | a second hub | .05 |
| V4 | Home in a blink | 15 | Chiyo → Wren | Travel home on the teleport circle | teleport circles | .25 |
| V5 | The soul hall | 16 | Kaede | Bind your soul | the soul, x1.5 | .25 |
| V6 | A light for Wren | 17 | Kaede → Wren | 6 kodama lanterns (50%); bring them to Kaede | monster elements, the wheel | .2 |
| V7 | The friendly foxes | 18 | Chiyo | Ask Master Ryu about passives; 5 grey kitsune (spawned for you in the Fox Hills) | passives | .2 |
| V7b | Lacquer and cherrywood | 18 | Haruka | Learn Woodcutting at Isamu's lodge; buy a Sunstone axe (level 15) and wear it; chop 12 logs in the vale; craft an armour piece at Haruka's | armour crafting, logs | .4 |
| V8 | A lantern with no flame | 19 | Odran (Hanami) | Sell him something | (story) | .2 |
| V9 | The old scrolls | 19 | Kaede | 4 scroll pieces (onibi, jorogumo, 45%) | tier 4 gear (level 20) | .2 |
| V10 | The Demon Gate | 20 | Daisuke → Kaede | Defeat Akaoni; read the Demon Gate's stone | boss skill drops | .2 |
| V11 | Frostbloom | 20 | Kaede → Wren | Tell Chiyo; take the news home | (the act ends) | .12 |

Akaoni's dying words carry the act's key hint (moved here from Kyuubi): *"They made you forget... They are still watching... Ask the ice
what fell from the sky."*, and far to the north the ice wall cracks: **Akaoni's fall opens the ice wall in Frostgate Pass**
(`gear.north` 1, `openNorthP`). The gate's stone gives the Frostbloom ("Where the ice meets the sky the frost flower grows, and the
sleepers wake."). After V11 act III begins by itself.

## 3b. Act III: "The Frost Flower" (the Hoarfrost Reach, levels 20-25)

The Reach is a high frozen plateau north of the vale (`docs/WORLD.md`, `shared/hoarfrost.js`). Frostgate Pass climbs through the vale's
north wall to it; the ice wall that shut the pass is a real wall until Akaoni falls. Rimehold is the third village, with the same jobs
as the others (board, weapon and armour stalls, forge, trainer, a teleport circle) and its **Wayfarers' Lodge** (every village has
one since the professions reached the whole game, section 5b) and Ylva's kettle. Rain is snow here, a storm a blizzard (`game/world/weather.js`).

**New people** (all `late:true`; ids in `MQ_NPC_VIL`, village 3): **Hallvard** the hunter-captain (the gate), **Old Sigrun** the seer (the
campfire), **Ragna** (board), **Bjorn** (weapons), **Dagny** (armour), **Ulfhild** (forge), **Thorvald** (skill trainer), **Gudrun** (the
Lodge), **Alchemist Ylva** (brews potions: she has taken her mother's chair, the one Gudrun said was empty), **Odran** (`odran3`: his
cart stands at Rimehold's gate from F7, `odranHere(3)`).

| # | Step | Gate | Giver → hand in | Objective | Teaches | r |
|---|---|---|---|---|---|---|
| F1 | Beyond the wall | 20 | (starts) → Hallvard | Walk up Frostgate Pass into Rimehold (attunes its circle) | snow, the third village | .08 |
| F2 | The hearth-folk | 21 | Hallvard | Meet Ragna, Bjorn, Ulfhild, Thorvald | a third hub | .06 |
| F3 | The winter after the burning sky | 21 | Sigrun | Sit with Sigrun **after dark**; read the rune stones at the gate | day and night, reading | .12 |
| F4 | Skilled hands | 22 | Sigrun → Gudrun | Learn Gathering (60 coins; done already if you learned it in the south); wear a Hagane sickle (tier 5, level 20), which Gudrun sells | tools of the tier of the zone | .1 |
| F5 | Frostbloom | 22 | Gudrun → Sigrun | Gather 3 frostbloom in the Rimewood Edge; 5 snow boars | resource nodes, the map's node marks | .18 |
| F6 | A flower for Wren | 23 | Sigrun → Wren | Brew the frostbloom tea at Ylva's (a Greater Healing Potion: 3 frostbloom); travel home on the circle | brewing with the north's herbs, choosing a destination in the travel window | .2 |
| F7 | Iron in the ice | 24 | Hallvard → Odran | Read the grey plate at Frostmere Shore; 2 plates from the Frost Reavers (45%) | rare drops | .18 |
| F8 | The Rimeking | 25 | Hallvard → Sigrun | Defeat Ymrik in his ice hall (level 26 boss; last words below) | pillars, boss skill drops | .25 |
| F9 | Where the earth's heat runs black | 25 | Sigrun → Hallvard | Hear Sigrun's last verse | (the act ends) | .1 |

Story beats: the Frostbloom halts the grey where the sap only slowed it (F6: Wren's arms are "only lines" for once, but they do not
wake); Sigrun's saga of "the winter after the burning sky" and the rune stones' upper rows, "straight as ruled lines" (the same old
hand as the tunnel's letters and the Demon Gate); the hint *objects*: **the grey plate** ("a dragon's scale": smooth, does not rust,
studs in even rows, a ring with a small sun painted on it, `hullplate`) and Odran's slip: "Dragons do not come in sheets, and the edges
are cut clean. Someone made this."; the hint *person*: Odran pays for the plate and wraps it up quickly; the hint *place*: **the iron
bird**, the wreck at the frost wyrm's nest (`ironbird`, a boss zone the main quest does not reach; a player who does read it). Ymrik,
dying: *"The iron bird... still sings under the ice. And someone... sings back. From a far light on the sea."* (the Stormhorn's lighthouse
relay, `STORY.md` act V-b: no answers before the reveal). F9 ends the act: the sickness "has a root, where the earth's heat runs black,
under the mountains" (Highmark's miners, act IV), and the west glacier valley has split (**not built**: the road west is the Greyspine's
gate, `MQ_END`).

**Systems introduced**: the third village and its circle (`CIRCLES` in `shared/hoarfrost.js`, the travel window `ui/travel.js`); snow
weather; the gate on the vale's north wall; the north's tier of **professions** (section 5b: the Reach's ore, pines and herbs need a Hagane
tool or better, and Ylva brews the frostbloom tea). **Not built in the Reach**: the Greyspine gate (the west valley), regional weather on the server.

## 3c. Act IV: "The Black Stone" (the Greyspine, levels 26-32)

The Greyspine is the fourth land (`docs/WORLD.md`, `docs/NOT-BUILT.md` section 3b, `docs/areas/greyspine.md`). Highmark, its village, is an alpine mining and monastery village on a shelf at the mouth of the North Fork, with the same
jobs as the others (board, stalls, forge, trainer, the Wayfarers' Lodge, Aurel's kettle, a teleport circle). The glacier valley that Ymrik's fall opens leads to it.

**People** (all `late:true`, village 4; ids in `MQ_NPC_VIL`): **Foreman Brenna** (`brenna`: the mine and the board), **Abbot Ansgar** (`ansgar`: the abbey's records, the cut page), **Gerhard** (weaponsmith), **Brother Matthias** (trainer), and **Odran**
(`odran4`: his cart stands outside Highmark's gate from G4, and no longer at Rimehold's: `odranHere(3)` is F7-G3, `odranHere(4)` from G4).

| # | Step | Gate | Giver → hand in | Objective | Teaches | r |
|---|---|---|---|---|---|---|
| G1 | The glacier valley | 26 | (starts) → Brenna | Walk the valley west into Highmark (`act:'highmark'`: attunes its circle, now linking all four villages) | the fourth village | .08 |
| G2 | The hearth of Highmark | 26 | Brenna | Meet Ansgar, Gerhard and Matthias | a fourth hub | .06 |
| G3 | Black stone | 27 | Brenna | Six lumps of black stone: **dig them** from the black veins (best-tier pickaxe) **or take them** from the granite and quartz slimes (30%): one part counts both | the first ore the story asks for | .15 |
| G4 | Too perfect | 28 | Brenna | Sell Odran anything at his cart, then show Brenna the coins | the hint *person*: coins "all alike" | .12 |
| G5 | The grey shift | 29 | Brenna | **After dark**, defeat 12 grey-veined granite slimes at the shaft head in the Miners' Scree (three at a time; nothing comes by day) | night parts; the hint *object*: stone that calls monsters | .2 |
| G6 | The gryphon queen | 29 | Brenna | Defeat the Gryphon Queen (boss 29: opens the river road) | boss, skills | .25 |
| G7 | What the miners dug into | 30 | Brenna | Read the mouth of the deepest shaft (`deepshaft`, Miners' Scree): black metal ribs "like the roots of a tree" | the Rootdeep hook | .1 |
| G8 | The old giant | 31 | Ansgar | Read the golem's broken stone at its cavern's edge (`golemframe`, the Sink): a jointed grey frame with the ring and the small sun | the hint *place* | .12 |
| G9 | The mountain wakes | 32 | Ansgar → Brenna | Defeat the Mountain Golem (boss 32: opens the neck pass); Brenna passes on Odran's tip, Glasswell's physician | the road on (`MQ_END`) | .25 |

The spoiler rule holds (`docs/STORY.md` section 0): no "machine" (the golem is "a giant of stone", under it "metal, jointed like a man", "somebody made it"), and the emblem (the ring with a small sun) is shown, not explained. **Systems introduced**: the black
stone (`RES.blackstone`, `NODE_KINDS.blackstone`: 11 veins in the Ledgeway, the Scree and the Sink; the Lodge buys it at 100; nothing is forged from it), a part that counts two sources (`collect` with `gather`), a night-only guard part (`grey` with `night:true`), the
`act:'highmark'` part, and `GREY_DEFS` gets the Greyspine's `greystone`. The Greyspine's other nodes (rime ore, frostpines and snowmoss, 6 in each zone) are the Reach's own grades. **Not built**: grades of ore, logs and herbs of the Greyspine's own and a tool tier 6 (gear stays at tier 5; level-30 gear comes from the dungeons), and the steps after G9.

## 4. Side story, planned (not built): "The Nine Tails"

Kyuubi (level 25, the Foxfire Hollow) is no longer on the main path. The pieces are already hinted: Chiyo's "then one of them grew nine
tails" (V7), the grey kitsune, Master Ryu's "the fox of the hollow has nine tails and nine tricks". A later side chain for levels 21-25
can reuse the old plan: Jade Falls' glacier water (the vale's water comes from the north), the tengu's "the sky went quiet", the mural of
ships with no sails in the Warlord Ruins, the Thunder Grove, and Kyuubi herself, grey, the vale's oldest friend. Her last words should add
to the story, not repeat Akaoni's (spoiler rule: still no answers before the end of Amber Reach).

## 5. Side content (built, optional)

Readable lore spots (`LORE` in `shared/main-quest.js`; walk up and press the talk key): the Stone Circle's carvings; the old letters by
the tunnel; **the drowned roads** (below); a grey fishing boat on the Crownsea shore where nothing grows; the Demon Gate's stone; a
roadside wish-post hung with paper wishes in the vale ("for a quiet sky to speak again"); **the ice wall** in Frostgate Pass (it reads differently
once open: `textOpen`, with a lantern that glows with no flame in the meltwater); the rune stones at Rimehold's gate; the grey plate in
the ice at Frostmere; the iron bird. Oskar's, Chiyo's, Sigrun's and Odran's lines; Odran's curiosities (a coin with a sun inside a ring,
the lantern with no flame, a warm glass bulb).

**The drowned roads.** Where the roads dip under still water (the Redgate Road west of the village, the Shore Road's valley, a pond
on the East Road, and a few spots in the vale), plank causeways on posts carry them across (`BRIDGES` kind `causeway`). Below the planks
the old paving runs on under the water, fitted closer than anyone in Eldmere can cut stone; Oskar says the water came up "the year the
sky went quiet", and nobody else remembers such a year (the Quiet, `STORY.md`). A drowned milestone shows a ring with a small sun
inside. Names: the Drowned Road, the Long Planks, the Heron Steps.

**The forest's edges** (the Crownsea Shore, the Sunwall's Foot, the Greyspine Foothills) hold monsters of levels 16-20: not part of the
main quest, ground for players who come back from the vale.

**The Hoarfrost Reach beyond the main quest**: levels 26-30 (four zones, two kinds each, and the wyrm's nest), the two bosses' skills
(12), the resource nodes (90) and Odran's plate trade are side content for players who carry on after F9.

### 5b. Professions, tools, crafting and potions (built)

**Three professions, three tools.** A Wayfarers' Lodge stands in every village (Tamsin at home, Isamu in Hanami, Gudrun in Rimehold;
role `lodge`, panel `game/economy/professions.js`). It teaches **mining** (pickaxe), **woodcutting** (axe) and **gathering** (sickle) for
60 coins each (`PROFS` in `shared/professions.js`), sells the tools, and buys resources. To work a node you need the profession **and the
tool worn in its slot**: the inventory has three tool slots (`pick`, `axe`, `sickle`) under the body. Tools are items (`TOOL_LIST` in
`shared/items.js`): the same six tiers and five rarities as gear (Copper, Iron, Silverstone, Sunstone, Hagane, Rimesteel; they need the
tier's level to wear), no stats, and the forge merges three into the next rarity. A common tool costs 30 / 90 / 270 / 700 / 1500 / 3200
coins by tier. The tier decides **which nodes it can work** and the rarity **how often a node gives double**.

**Nodes** (`NODES`, 367, the same on client and server from seeded rngs; the Greyspine's 53 are last: rime ore, frostpines and snowmoss in each of its zones, and 11 veins of black stone for act IV, section 3c): every ring zone of the home forest, the three edge zones and
every zone of the vale has 2 ore veins, 2 trees (3 of each in the home zones of levels 1-14, which are only 4-5 zones per grade), two of its land's healing herb and one
strengthening herb; the Hoarfrost Reach keeps its own plan of 90. A node
needs a tool of the **gear tier of its zone** (`tierFor(zone level)`: levels 1-4 tier 1, 5-9 tier 2, 10-14 tier 3, 15-19 tier 4, 20-24
tier 5, 25+ tier 6; the vale's best zones still need tier 5 and give hagane). What a gather gives: **ore** and **logs** in six grades,
one for each gear tier (copper / iron / silverstone / sunstone / hagane / rime ore; pine / oak / yew / sunwood / cherry / frostpine),
found in the zones of that tier, and **herbs**, two in each land (sunpetal and ironroot in the home forest, kikyo and yomogi in the vale,
frostbloom and snowmoss in the Reach). Profession xp per gather is the grade (herbs 1 / 3 / 5); levels 1-5 (`PROF_XP`), +8% double-yield
chance per level above 1, the tool's rarity (+0/8/16/26/40%) and +5% per tier the tool is above the node's need. Nodes grow back after
75-120 s; the map shows the nodes you can work now.

**Crafting** is not a profession; it is done at NPCs: the weaponsmiths' shops (Tomas, Kenji, Bjorn) have a **Craft** tab that makes
weapons from **ore**, and the armourers' (Ilse, Haruka, Dagny) make armour from **logs** (`shared/crafting.js`). A common piece of tier t
costs `CRAFT_BASE[t]` x the piece's weight (a weapon 1.3, a helmet 0.8...) resources of grade t plus a fee of a tenth of its price;
a rare one costs 2.5 times as much, an epic one 6 times. Unique and legendary come only from drops and merging. All the numbers are
first guesses, not balance-tested by play.

**Brewing and potions** are done at the healers' (Linnea, Hinata, Ylva: role `brew`, the Brewing panel). Herbs and a few coins make
three potions in three strengths (the strength follows the land of the herbs): **healing** (restores 35 / 50 / 70% of your health, 15 s
cooldown), **might** (+20 / 30 / 40% damage for 90 s) and **guard** (-20 / 30 / 40% damage taken for 90 s). Drink them with **Z / X / C**
(rebindable) or the potion belt above the action bar; the strongest one you carry is used (`gear.pot`).

**In the quests**: W6a (learn Gathering, wear a sickle), W7b (brew and drink), W11b (mining, a pickaxe, craft a weapon), V7b (woodcutting,
an axe, craft armour) and, in the Reach, F4 (a Hagane sickle), F5 (frostbloom) and F6 (Ylva brews the frostbloom tea: a Greater Healing
Potion).

**Gathering is a cast**: pressing the gather key (G, or the talk key) at a node starts a bar that fills for `castTime` (1.2 s with a copper tool, 0.1 s less for each tier of the tool and
0.04 s for each rarity, never under 0.6 s); walking more than 1.5 m away or being knocked out breaks it, and the haul arrives when it ends. There is no gathering
animation and tools never wear out, both on purpose. **Not built** (`docs/NOT-BUILT.md`, with a plan for the first): quest-board notices for gathering and crafting, potions
that cleanse a boss's freeze or slow, resources for the lands to come.

## 6. How it is built

- **Data** (`src/shared/main-quest.js`, pure): `MQ`, the steps (fields described at the top of the file), `mqTalk` (what a talk does
  and says: used by the server to apply it and by the client to show it, so the two always agree), `mqObjective`, `mqReward`, the
  places (`HERBS`, `mqGreySpot`, `VIL.bed`, `V.cart`) and `LORE`. Part kinds: `talk`, `kill`, `grey`, `pick`, `collect`, `gather` (a node kind or a
  profession), `read`, `act` (`learn` with `prof`, `tool` with `tool` and `tier`, `craft` and `brew` and `potion` with `kind`), `level`, `tier`, `boss`.
- **Save**: `gear.mq = {s, st, n, h, ver}` (step index; 0 offered, 1 in progress, 2 ready to hand in; progress per part; heartleaf picked;
  `ver` = `MQ_VER`), sanitized by `sanitizeMq`. **Steps inserted in the middle of `MQ` shift the index of every later step**, so a save without
  the current `ver` is moved up by the steps inserted before it (`MQ_INSERTED`: each entry is the old index the new step follows). When you
  insert a step, bump `MQ_VER` and add it to `MQ_INSERTED`. Old characters start at W1 and walk the early steps quickly; parts that are about what they already have
  (level, weapon tier, soul, the tunnel open, Hanami reached, Rimehold reached, gathering learned) finish at once. A save that is already
  past V10 gets `gear.north` 1 (the ice wall open).
- **Server** (`src/server/main-quest.js`): the only message is `mq{a:'talk'|'pick'|'read'}`, each checked (in the village of that
  villager, next to the herb or the spot, the part open). Kills (`rewardKill` → `mqKillP`), system uses (`mqActP` from buy, sell, equip,
  class, merge, upskill, soul, the quest board, skill and burst use, the teleport circle, reaching Hanami and Rimehold, learning a
  profession, wearing a tool, crafting, brewing, drinking), gathering (`mqGatherP` from `server/professions.js`) and a half-second check (`mqTickP`: auto parts, the grey monsters
  spawned for you: `GREY_DEFS` in `monster-defs.js`) move it on. Testing: `dev{cmd:'mq',v:'F5'}` (the Settings' testing tools).
- **Client** (`src/game/economy/main-quest.js`): the lines (`mqLinesFor`, shown by `village/talking.js` before a villager's panel), the
  violet ! / ? over villagers (`mqMark`, `npc-labels.js`), the main quest's row at the top of the quest log (`mqLogRow`), its violet
  marker on the maps (`mqTarget`: people, kill zones, lore spots, resource nodes, the pass). Props: `game/world/lore-props.js` (sickbed,
  carts, lore props, heartleaf), `game/village/buildings-hoar.js` (the ice wall, the rune stones, the iron bird).
- **Tests**: `node tools/mainquest-smoke.js` (walks a character through acts I-IV to the end, the profession steps and the save migration
  included), `node tools/hoarfrost-smoke.js`, `node tools/professions-smoke.js`.
- **To add a step**: a row in `MQ` (and its people in `MQ_NPC_VIL` / `MQ_NAMES`, `VILLAGERS`), a lore spot in `LORE` if it reads something,
  a test line; a new kind of part needs a hook in `server/main-quest.js` and a marker in `mqPartTarget` (client).

## 7. Planned, not built: the rest of the story (act IV, the Greyspine, is built: section 3c)

**Nothing in this section exists in the game, except act IV (7.2), which is section 3c's.** It turns `docs/STORY.md` (the acts, the hidden truth, the spoiler rule) and
`docs/WORLD.md` (the lands, their level ranges and gates) into main quest steps, level by level, so the next chapters can be built one
land at a time. The spoiler rule (`STORY.md` section 0) is unchanged: no answers before the end of the Amber Reach storyline (act VI);
every hint keeps an innocent reading. Step ids continue the built ones: **G** the Greyspine, **S** the Sunscar, **A** Amber Reach,
**E** the Emberwake Isles, plus the side branches **T** (Stormhorn) and **R** (Rootdeep). Rewards follow section 1 (about 30% of the
XP a land needs, `r x expToNext(gate)`), 3-4 hub steps and one boss per land, gates rising with the levels below.

### 7.1 The road, level by level

```
level   25     30     35     40     45     50
Hoarfrost  (built to 25 by the main quest; 22-30 walkable)
Greyspine    G1----------G9 (26-32)
Sunscar          S1---------------S10 (28-36)
Amber Reach                  A1-----------A10 (35-45)   <- the reveal
Emberwake                          E1------------E10 (40-50)   <- the ending
side: Stormhorn T1..T6 (30-40), Rootdeep R1..R9 (30-47)
```

A player follows the main line **Hoarfrost → Greyspine → Sunscar → Amber Reach → Emberwake**. The main line's gates never send you to a
land more than about 2 levels above you; the overlap means that from 28 on the player chooses the order of the side branches.
The Sunscar and Amber Reach each give a real cure beat for Wren (act V-a: the medicine that wakes them; act VI: none, the truth).

### 7.2 Act IV: "The Black Stone" (the Greyspine, levels 26-32): built as section 3c (this is the plan it followed)

Hub: **Highmark**, an alpine mining and monastery village built into the rock (rope bridges, shrines on the passes). Cast: **Foreman
Brenna** (the mine; notices the too-perfect coins), **Abbot Ansgar** (the monastery's archive: a page of the Silent Years is cut out),
Odran's cart. Gate in: the Hoarfrost's west glacier valley (opened by Ymrik, F8/F9).

| # | Step | Gate | Objective | Hint / teaches |
|---|---|---|---|---|
| G1 | The glacier valley | 26 | Walk the split valley west to Highmark | the road, cold nights |
| G2 | The hearth of Highmark | 26 | Meet Brenna, the abbot, the smith, the trainer | a fourth hub (`CIRCLES` + a circle) |
| G3 | Black stone | 27 | Bring Brenna 6 lumps of black stone (mine them: **mining** in the Greyspine's veins, or take them from stone slimes) | **object**: cold stone that hums and calls monsters. Teaches: gathering matters (the first *required* mining node) |
| G4 | Too perfect | 28 | Take a miners' pay to Odran: he pays in coins that are all alike; Brenna weighs them | **person**: the buyer's coins |
| G5 | The grey shift | 29 | Guard the night shift: 12 monsters that came for the black stone | the grey sleep among miners |
| G6 | The gryphon queen | 29 | Defeat the gryphon queen on her peak (**boss 29**) | opens the river road south (Sunscar) |
| G7 | What the miners dug into | 30 | See the deepest shaft that broke into something vast (read; a cave mouth: the Rootdeep) | the Rootdeep hook (side branch R) |
| G8 | The old machine | 31 | Reach the mountain golem's cavern; read its jointed frame | **place**: a stone shell around a jointed metal frame, "an old war machine of our own, woken by the dark" |
| G9 | The mountain wakes | 32 | Defeat the mountain golem (**boss 32**) | opens the neck pass west (Stormhorn) and the deep mine (Rootdeep); the road on: Glasswell's physician |

Engine needs: the Greyspine is built as a place (`shared/greyspine.js`, `highmark.js`, `greyzones.js`: the way in through the Reach's west glacier valley, Highmark, seven zones, the Gryphon Queen
and the Mountain Golem with six skills each, tarns, a river, a fjord, and the two gates in its west wall; `docs/NOT-BUILT.md` section 3b), but not as a story: the steps G1-G9 below need
their talks, props and hooks in `shared/main-quest.js` (`MQ`: bump `MQ_VER` and use `MQ_INSERTED` if a step goes in the middle), ore veins for G3 (resource nodes of a Greyspine grade: `ORE_GRADES`,
`LOG_GRADES`, `HERB_LANDS`, a tool tier 6), gear tier 6 (levels 30-34, `tierFor`, `TIER_ATK`, `ARMOR_*`, items and icons), a `VALE_TOP_LV` review (skill upgrades ask for drops of levels up to it)
and a zone tier for the land (`ZTIER_LANDS`). `MAX_ZONE_LV` is already 32.

### 7.3 Act V-a: "The Physician" (the Sunscar, levels 28-36; the main road)

Hub: **Glasswell**, the oasis city (`WORLD.md`: districts, bazaar, palace, harbour; bigger than a village). Cast: **Physician Anselm Rook**
(a watcher: helpful, odd, never a villain on screen), **the archivist Mirela** (the Silent Years: 60 pages cut out cleanly), **Caravan-master
Tahir**, an alchemist (brews potions of the desert's herbs: the professions and potions are built, section 5b), Odran. Gate in: the river road from the Greyspine (the gryphon queen).

| # | Step | Gate | Objective | Hint / teaches |
|---|---|---|---|---|
| S1 | The river road | 28 | Follow the river south to Glasswell's gate | hot days, cold nights, sandstorms (server weather per region) |
| S2 | The oasis city | 29 | Meet the bazaar, the palace steward, the harbour master, a trainer | the first city; **trading between players** (a bazaar) |
| S3 | The physician's cup | 30 | Show Rook Wren's sickness: bring him a lock of grey (from a grey-veined monster) and a page of Old Sigrun's saga | **object**: identical glass vials with printed labels, a "cold cupboard" that hums |
| S4 | A favour, for his studies | 30 | Rook asks a vial of your blood: give it (a choice with no penalty, remembered later) | the trap the player cannot see yet |
| S5 | The archive | 31 | Read three shelves of the chronicle with the archivist: pages cut out | **place**: the Silent Years |
| S6 | The desert's herbs | 32 | The alchemist wants the oasis herbs (a new gathering grade: `HERB_LANDS`) and the desert's ore and logs for gear of the land; brew and craft with them | new resource grades, tools of the next tier (`TOOL_MAT`) |
| S7 | The medicine | 33 | Fetch Rook's ingredients from the glass fields' edge (guardian of the glass, **boss 32**) | **place**: black glass in a perfect circle, "where the sun wept" |
| S8 | Wren wakes | 34 | Carry the medicine home by the circle (a warm scene in the village: Wren awake for the first time in the whole game) | the payoff of two acts; it needs repeating |
| S9 | The sand wyrm | 36 | Defeat the sand wyrm under the dunes (**boss 36**) | reopens **Redgate Canyon**, the road home |
| S10 | South, for the herb | 36 | Rook sends you to the herders of Amber Reach for the herb that stops the relapse (he wants you away while he studies the blood) | the hook to act VI |

### 7.4 Act VI: "The Song" (Amber Reach, levels 35-45) and the reveal

Hub: **Tallgrass**, a herders' and traders' settlement on the west coast (a pier; a landing on the southern cape for the boats). Cast:
**Elder Tamsa** (keeps the nonsense war song), **Kesi** (a young herder, the player's guide), Odran (now the one who follows the player), Rook's
agents (grey coats, polite, in the background from A4).

| # | Step | Gate | Objective | Hint / teaches |
|---|---|---|---|---|
| A1 | Grass and gold | 35 | Cross the dry riverbed into Amber Reach | wet and dry seasons, grass fires |
| A2 | Tallgrass | 36 | Meet the elder, the pier, the smith, the trainer | hub |
| A3 | The song at the fire | 37 | Sit at the herders' fire after dark: hear the old song | **object**: words that sound like nonsense |
| A4 | The herb | 38 | Gather the herb for the relapse (**gathering**; guarded) | the cure part of the road |
| A5 | Grey coats | 39 | Someone follows you: lose them (or fight) | Rook's agents |
| A6 | The storm bird | 40 | Defeat the storm bird (**boss 40**) | thunder season |
| A7 | Kesi's herds | 41 | Help the herds through the fire season | side content hooks |
| A8 | The great beast | 45 | Defeat the great beast of the herds (**boss 45**) | opens the boats south |
| A9 | Odran at the fire | 45 | **The reveal**: Odran stops the agents and tells the truth at the herders' fire (the Lumen Concord, the Crown War, the Quiet, the Black Line, the Sink, the watchers, Wildwood and the Heartwood: `STORY.md` section 4, act VI); a photograph and a radio | the whole story; Tamsa's song finally makes sense |
| A10 | The way south | 45 | Take the boat to the Emberwake Isles | the hook to act VII |

Everything before A9 must read differently after it: Odran's lines, Rook's favour, the plate, the black stone, the sun-in-a-ring, the
lantern with no flame. There is **no cure** but one after the reveal: close the Sink.

### 7.5 Act VII: "The Sink" (the Emberwake Isles, levels 40-50) and the ending

Hub: **Coralhaven** (stilt houses, outriggers, carved totems). Cast: **Chief Makoa**, **Lani** (pilot), Rook (exposed, defending the
Sink), Odran (changed sides). Travel between the islands: boats and teleport circles.

| # | Step | Gate | Objective | Hint / teaches |
|---|---|---|---|---|
| E1 | Black smoke | 40 | Land at Coralhaven | hot storms, ash falls |
| E2 | The stilt village | 41 | Meet the chief, the pilot, the smith, the trainer | hub |
| E3 | The breathing mountain | 43 | Reach the volcano's foot: the black conduit in the sea | the Black Line, a fact now |
| E4 | Island by island | 44 | Cross three islands by boat and circle | travel |
| E5 | The sea dragon | 45 | Defeat the sea dragon (**boss 45**) | a guardian drowned in dark |
| E6 | The station | 47 | Reach the Sink's door: concrete, steel, humming conduits, signs in a foreign script | hints become facts |
| E7 | Rook's last stand | 48 | Defeat Rook's guards (a fight, not a boss) | the antagonist |
| E8 | The warden | 50 | Defeat **the Sink's warden** (**boss 50**), the volcano's fire spirit fused with the machine | the Wildwood light against it |
| E9 | The dark stops | 50 | Close the Sink | the ending |
| E10 | Green again | 50 | Go home: the Heartwood's roots green, **Wren wakes for good**; the Quiet thins (NPC lines change); the Stormhorn's lamp room opens, the first Concord ship on the horizon | the epilogue and the hook for the next continent |

### 7.6 Side branches (optional, `STORY.md` section 7)

- **The Stormhorn** (levels 30-40, `T1-T6`): Gullrest's fishers and Keeper Maelis (the lamp room with the lock that has no keyhole, the
  tower at the same hour every night, steel-hulled wrecks with tins and a camera, the drowned captain in a uniform with the sun-in-a-ring,
  **boss 35**, the kraken **boss 40**). Ymrik's dying words point here.
- **The Rootdeep** (levels 30-47, `R1-R9`, three layers: the Rootways 30-35, the Glimmer Halls 36-41, the Emberdeep 42-47): the Heartwood's
  withering roots (*why Wren fell sick*), murals with the invaders' faces chiselled away, black iron roots along the lava tubes; camps with
  teleport circles instead of a village, **bosses 35, 41, 47**. It needs its own enclosed space (`WORLD.md` section 8).
- **The Nine Tails** (vale, levels 21-25, section 4) and more Hoarfrost side chains (Sigrun's sagas, the wyrm at the iron bird).

### 7.7 What the engine needs, in order

1. **XP curve and gear to 50**: `expToNext` past 25 is a flat 2,100 same-level kills (`shared/balance.js`): tune it for 30-50; more gear tiers
   (`tierFor`, `TIER_ATK`, `ARMOR_HP`, `ARMOR_DEF`, `shared/items.js`, icons, looks), `MAX_ZONE_LV` 50, `VALE_TOP_LV` and `upgradeNeeds`.
2. **The world rectangle** grows north-west (the Greyspine), west (the Sunscar behind the Sunwall), south-west (Amber Reach) with real terrain,
   edges and far-lands replacing their placeholders; the isles need water around them and boats; the Rootdeep an enclosed instance.
3. **Regional weather on the server** (sandstorms, gales, tropical storms; today the server has one weather and the client turns rain into
   snow in the Reach), regional music themes, ambience.
4. **Professions' next steps**: resource grades, herbs, node zones and a tool tier for each new land (section 5b: `ORE_GRADES`, `LOG_GRADES`, `HERB_LANDS`,
   `TOOL_MAT`, the node plan in `shared/professions.js`), gathering animations and cast times, tool durability.
5. **Per land**: a village or city (`layoutVillage` or a bigger plan), its NPCs, a zone grid with two monster kinds per level, two bosses (12 boss
   skills each), gates as real things in the land (`WORLD.md` section 5), lore spots, a music theme, a teleport circle in `CIRCLES`, tests.
6. **Group play**: parties, trading between players (Glasswell's bazaar) and other ideas in `CLAUDE.md` section 10.
