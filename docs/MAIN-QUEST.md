# Main quest line: Wildwood and the Sakura Vale (plan)

The plan for the first two chapters of the main quest line: Act I (Wildwood, levels 1-15) and Act II (the Sakura Vale, 15-25).
It follows `docs/STORY.md` (the story, the spoiler rule, the hints) and `docs/WORLD.md` (the lands), and it teaches the game's
systems as the story needs them. **Nothing here is built yet**; section 5 says how to build it.

## 1. Goals and pacing

- **About 30 minutes of quest play per land**: walking, talking, the objectives themselves and the two boss fights. The time a player
  spends levelling between steps is not counted in it.
- **The main quest is the best path, not enough on its own.** Its rewards give about **30% of the XP** a land requires (Wildwood: levels
  1 to 15; the Vale: 15 to 25). The rest comes from hunting and from the quest board (Maren, Sayuri). Steps have a **level gate**: a step
  is offered only from its level, and the NPC tells the player where to hunt and to take board notices until then.
- **Teach one system at a time, when the story needs it.** Each step names the system it teaches (column *Teaches*). Tutorial text is
  short, shown once, in the step's objective and a toast; the controls legend already explains the keys.
- **The story comes first in the main quest** (`STORY.md` section 7): a player who follows only it understands the whole of acts I and II.
  Side content (section 4) adds hints and depth and is never required.

### Rewards
A step's XP is `r x expToNext(gate level)`: a share of the level it is gated at, so the rewards keep their meaning if the XP curve is
tuned later. With the r values below, the main quest gives 29% of the XP for levels 1-15 and 31% for 15-25 (measured on the current
curve in `shared/balance.js`). Coins, items and skills are named per step.

**What the rest costs (current curve)**: Wildwood's other 71% is about 1,250 kills of the right level, a few hours with board quests.
The Vale's other 69% is about 7,400 kills, far too many: the curve past 15 is known to need tuning (`CLAUDE.md` section 10). Tune it
before building act II so that the Vale takes roughly as long as Wildwood; the r values stay as they are.

## 2. Act I: "The Grey Rain" (Wildwood, levels 1-15)

**New NPCs** (Wildwood village, `late:true` so random villagers keep their looks):
- **Wren**, the player's younger sibling, on a sickbed under the awning of the family house (no house interiors exist).
  Wren's look follows the player's (same skin and hair colour, younger, smaller). Grey vein lines on the arms while sick.
- **Healer Linnea**, the village healer, at the herb garden; she treats Wren and gives the cure steps.
- **Odran**, the travelling peddler (a watcher, `STORY.md`): a cart near the gate from step W6, trades curiosities; asks odd questions.

Existing NPCs in the chain: Bram (hunter), Aldric (trainer), Tomas and Ilse (shops), Maren (quest board), Greta (forge), Oskar (storyteller).

| # | Step | Gate | Giver | Objective | Teaches | Story | r | min |
|---|---|---|---|---|---|---|---|---|
| W1 | The grey rain | 1 | (start) | Wake at the village in grey rain; go to Wren; fetch Healer Linnea | moving, camera, talking (E) | Wren won't wake; grey veins. Linnea: "I have never seen this in Wildwood." | .6 | 3 |
| W2 | Heartleaf | 1 | Linnea | Pick 5 heartleaf herbs at the meadow's edge; kill the slimes that guard them (5) | attacking, targeting, health and XP bars, monster levels | Slimes near the village are bolder since the rain (Bram) | 1.2 | 3 |
| W3 | A weapon of your own | 2 | Aldric | Try the three weapons at the well; choose a class | classes, basic attacks, you can change class later | Aldric: "Your sibling needs someone who can walk the far woods." | 1.2 | 2 |
| W4 | Dressed for the woods | 3 | Ilse, Tomas | Buy and wear a piece of armour; open the inventory | coins, shops, inventory, equipping | Tomas gives a discount "for Wren" | 1.1 | 2 |
| W5 | The first trick | 3 | Aldric | Learn a skill and use it on 5 beetles in Beetle Thicket | skills panel, skill slot (key 2), cooldowns | Grey-veined beetles among the others (first hint) | .9 | 2 |
| W6 | The board | 4 | Maren | Take a notice from the quest board and finish it | the quest board: the grind path between main steps | Maren: "The forest remembers everything. Some of it is waking up." (her existing line) | .9 | 2 |
| W7 | Sap of the Heartwood | 5 | Linnea | Bring 3 heartwood sap from the Treant Grove's treants (quest drop) | the map (N) and quest markers, the minimap | Sap wakes Wren for a moment; Wren asks for the player, then sleeps | .8 | 3 |
| W8 | The peddler | 6 | Odran | Trade: sell him 2 items, look at his curiosities | selling | Odran arrived the week of the rain; asks "Who here was born in Wildwood?" (hint) | .6 | 2 |
| W9 | Grey in the bog | 7 | Bram | Kill 3 grey-veined elites in the Bog (temporary monsters) | monster drops (materials), elites | The grey is spreading from the edge of the world inwards (hint) | .55 | 2 |
| W10 | Sharper | 8 | Aldric | Upgrade a skill to level 2 with coins and drops | skill upgrades | Aldric remembers a "grey sleep" story, can't say where from | .5 | 1 |
| W11 | Three of a kind | 9 | Greta | Merge three identical items at the forge (Greta gives one copy) | rarity, the forge | Greta's steel "sings"; small talk that humanises the village | .45 | 2 |
| W12 | Everything at once | 10 | Aldric | Learn the burst; use it in the Dire Wallows | burst slot (key 3) | Aldric: "Save it for the worst moment." | .4 | 2 |
| W13 | The storyteller | 11 | Oskar | Sit with Oskar at the campfire **at night**; hear the tale; visit the Stone Circle's carvings at the edge of the forest (don't wake the guardian) | the day/night clock, sitting | The grey sleep "beyond the mountains", the circle that carried his grandfather, carvings of **ships with no sails** (hint); the Rootwarden asleep, half grey | .35 | 3 |
| W14 | Shiny things | 12 | Bram | Raid Chieftain's Hold, recover the goblins' hoard (drop from the Goblin Chieftain) | a harder zone; group play (chat, other players) | In the hoard, a **smooth glass ball** "like a lamp with no flame"; Odran buys it at once, pays too well (hint) | .3 | 3 |
| W15 | Beyond the mountains | 13 | Linnea | The sap no longer helps; ask the village; learn about the sealed tunnel and the Rootwarden | reading the level gates | Linnea: Hanami's shrine knows every sickness of the soul. Bram: "Nobody has crossed since the guardian woke." | .25 | 1 |
| W16 | Ready | 14 | Bram | Reach level 15; gather gear of tier 3 (the shops or the forge) | preparing for a boss: gear tiers, elements of skills | (grind step: board notices recommended) | .22 | 1 |
| W17 | The Rootwarden | 15 | Bram | Defeat the Rootwarden at the Stone Circle | boss mechanics (telegraphs, totems, adds), shared boss rewards, boss skill drops | Half grey, maddened. Its last words: "The roots... cannot hold... for long." The tunnel opens (`gear.east` 1) | (V1) | 5 |
| W18 | Goodbye for now | 15 | Wren | Say goodbye to Wren (awake for a moment); take Linnea's charm; walk the tunnel to Hanami | the tunnel, walking between lands (`gear.east` 2) | Wren: "Bring back something pretty." A warm, short scene | (V2) | 3 |

About 42 minutes of quest play including the boss; W16 is almost all levelling. Steps W17 and W18 give their XP at level 15, so it
counts toward the Vale's 15-25 (rows V1 and V2).

## 3. Act II: "The Blossom and the Blight" (the Sakura Vale, levels 15-25)

**New NPC**: Odran's cart moves to Hanami's gate (from V7). Existing NPCs: Daisuke (guard), Sayuri (board), Kenji and Haruka (shops),
Tetsuo (forge), Master Ryu (trainer), Grandmother Chiyo (storyteller), Shrine Maiden Kaede (soul shrine).

| # | Step | Gate | Giver | Objective | Teaches | Story | r | min |
|---|---|---|---|---|---|---|---|---|
| V1 | (W17) The Rootwarden | 15 | Bram | see W17 | | | .2 | |
| V2 | (W18) Goodbye for now | 15 | Wren | see W18 | | | .06 | |
| V3 | Hanami | 15 | Daisuke | Enter Hanami; talk to Sayuri, Kenji, Haruka, Tetsuo | a second hub; the same jobs in a new place | Daisuke: "You came through the tunnel? Then the Rootwarden is dead." (existing line) | .05 | 2 |
| V4 | Home in a blink | 15 | Chiyo | Step on the teleport circle to Wildwood and back; tell Wren you found the shrine | teleport circles | Chiyo: the circle "hums for anyone who has walked here on their own feet" (existing) | .25 | 2 |
| V5 | The soul shrine | 16 | Kaede | Bind your soul to an element | the soul, elements, soul match x1.5 | Kaede reads your soul and falls silent: it burns brighter than any she has seen (hint) | .25 | 3 |
| V6 | A light for Wren | 17 | Kaede | Bring 6 kodama lanterns from Kodama Wood; Kaede makes a talisman of your soul; take it home to Wren | monster elements (the wheel), the target frame's element, using a skill that beats it | Wren wakes for longer when it is near; your light matters (hint) | .2 | 4 |
| V7 | The friendly foxes | 18 | Chiyo | Hear Chiyo at the campfire; clear the grey kitsune from the Inari Hills (5) | passives (level 18) from Master Ryu | Chiyo: "When I was a girl the kitsune were our friends. Then one of them grew nine tails." (existing) | .2 | 3 |
| V8 | A lantern with no flame | 19 | Odran | Odran is in Hanami; trade with him | (story step) | He shows a lantern that lights with no flame, then quickly takes it back (hint) | .2 | 1 |
| V9 | The old scrolls | 20 | Kaede | Recover scroll pieces from the Ghostlight Marsh (onibi and yurei drops) | tier 4 gear (level 20) at Kenji and Haruka | The scrolls name the grey sleep: "it comes from the sea"; a Hanami fisher falls grey | .2 | 3 |
| V10 | The Demon Gate | 20 | Daisuke | Defeat Akaoni at the Demon Gate | a second boss; boss skill drops (10% each) | The gate is older than Hanami, of stone no one can cut (hint). Its fall breaks the ice wall north of Hanami (the road to the Hoarfrost, `WORLD.md` section 5; a placeholder land until it is built) | .2 | 5 |
| V11 | Cold water | 21 | Sayuri | Follow the river up to Jade Falls; bring a flask of glacier water | reading the land: rivers come from the north | The Vale's water comes from glaciers beyond the ice wall | .16 | 2 |
| V12 | Crows on the peaks | 22 | Master Ryu | Take the last scroll piece from the Karasu Tengu of the Tengu Peaks | skill level 3+ (upgrades with Vale drops) | The tengu say "the sky went quiet" long ago (hint) | .16 | 3 |
| V13 | The warlord's wall | 23 | Chiyo | Find the mural in the Warlord Ruins (a place to reach) | exploring for side content | A worn mural: ships with no sails, like the Stone Circle's carvings (hint) | .15 | 2 |
| V14 | Thunder before the shrine | 24 | Kaede | Clear the path through the Thunder Grove to the Foxfire Shrine | preparing: gear, soul, skills, a group | Kaede: the fox was the Vale's oldest friend | .15 | 2 |
| V15 | The nine tails | 25 | Kaede | Defeat Kyuubi at the Foxfire Shrine | the hardest boss so far | Kyuubi's dying words: "They made you forget. They are still watching. Ask the ice what fell from the sky." (the act's key hint) | .2 | 5 |
| V16 | Frostbloom | 25 | Kaede | Bring the scrolls to Kaede; take the news home to Wren | (story step) | The Frostbloom halts the grey sleep; it grows only under the Hoarfrost glaciers, north past the broken ice wall. Wren, awake for a moment: "Go." The act ends | .08 | 3 |

About 44 minutes of quest play including two bosses (V3-V16).

## 4. Side content in these two lands (optional)

Scattered in the world, never required, obeys the spoiler rule:
- **Wildwood**: the carvings on the Stone Circle's stones (readable); a weathered sign at the tunnel with an older script; Oskar's other
  tales at night; a grey-veined deer seen near the Stone Circle; Odran's curiosities (a "coin with a sun on it", taken back).
- **Sakura Vale**: the Demon Gate's inscriptions; offerings at small shrines that tell of the "quiet sky"; Grandmother Chiyo's tales of
  the kitsune; a hermit tengu who talks in riddles; the fisher who fell grey (visit them for a small side quest).

## 5. How to build it (for the agent who implements this)

Follow the recipes in `CLAUDE.md` section 5 (a server message, a panel). A proposed shape:
- **Data**: `shared/main-quest.js` (pure): `MAIN_QUEST`, the list of steps above: `id`, `gate` level, `giver` (villager id), `obj`
  (`talk`, `kill {kind, n, zone}`, `collect {item, n, from}` for quest drops, `reach {x, z, r}`, `boss`, `act` (a system use: `class`,
  `equip`, `buy`, `buyskill`, `upskill`, `merge`, `soul`, `tele`, `night`), `r` (reward share), text (short, in the spoiler rule's voice).
- **Save**: `gear.mq = {step, n}` (the current step and its progress), sanitized with a default of step 0 for old saves. Old characters
  above a step's level start at the first step whose gate is above their level... or better, at W1 with the early steps auto-completing
  (ask the owner).
- **Server** (`server/economy.js` + hooks): progress on the events the server already sees (kills, equip, buy, buyskill, upskill, merge,
  soul, positions for `reach`, boss kills); reward on hand-in; never trust the client's progress.
- **Client**: a "Main" section at the top of the quest log (`economy/quests.js`), a marker on the map and the minimap, the `!` / `?`
  markers over the giver (`village/npc-labels.js`), the step's lines when talking to the giver (`village/talking.js`), a one-time
  tutorial toast per system.
- **Wren's state** follows `gear.mq`: grey lines and asleep, briefly awake after W7, V6 and V16.
- **Odran** shows only for players whose step is past W8 (villagers are drawn per player, not synced, so this is easy).
- **Temporary monsters** (grey-veined elites in W9, the grey kitsune in V7): the server already spawns temporary monsters.
- **Tests**: a `tools/` smoke test that walks a fresh character through the steps with dev commands.
