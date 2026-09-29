# Main quest line: Wildwood and the Sakura Vale

The first two chapters of the main quest line: **Act I** (Wildwood, levels 1-15) and **Act II** (the Sakura Vale, levels 15-20; it
ends at the first vale boss, Akaoni). They follow `docs/STORY.md` (the story, the spoiler rule, the hints) and `docs/WORLD.md` (the
lands), and teach the game's systems as the story needs them. **Built**: the steps are data in `src/shared/main-quest.js`; section 6
says how the code fits together. The vale's second boss (Kyuubi, level 25) is saved for a side story (section 4), not built yet.

## 1. Goals and pacing

- **About 30 minutes of quest play per land**: walking, talking, the objectives themselves and the boss fight. The time a player
  spends levelling between steps is not counted in it.
- **The main quest is the best path, not enough on its own.** Its rewards give about **30% of the XP** a land requires (Wildwood:
  levels 1 to 15, 29%; the Vale: levels 15 to 20, 31%). The rest comes from hunting and the quest board (Maren, Sayuri). Steps have a
  **level gate**: a step is offered only from its level; until then the giver says to hunt and take notices, and the quest log says
  "From level N".
- **Teach one system at a time, when the story needs it.** A step's `tip` is a one-time toast when it starts.
- **The story comes first in the main quest** (`STORY.md` section 7): a player who follows only it understands acts I and II.
  Side content (section 5) adds hints and is never required.

### Rewards
A step's XP is `r x expToNext(gate level)`, a share of the level it is gated at, so the rewards keep their meaning if the XP curve is
tuned later; coins are `r x 18 x` a board quest's coins at that level, plus 10 (`mqReward`). W11 also gives three identical items
(for the forge). Steps gated at 20 (V10, V11) give their XP toward level 21.

**What the rest costs (current curve)**: Wildwood's other 71% is about 1,000 kills of the right level, a few hours with board quests.
Levels 15-20 in the vale need about 1,450 kills of one level up beyond the quest (the curve past 15 is steep: `CLAUDE.md` section 10).

## 2. Act I: "The Grey Rain" (Wildwood, levels 1-15)

**New people** (`VILLAGERS`, all `late:true` so random villagers keep their looks):
- **Wren**, the player's younger sibling, in a sickbed under an awning by the first house right of the gate (`VIL.bed`). Wren has the
  player's skin and hair colour, greyed by the sickness; asleep (lying) unless a step wants them awake (`wrenAwake`: handing a step in
  to Wren, and the goodbye in W18), then sitting up.
- **Healer Linnea** at the herb garden.
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
| W7 | Sap of the Heartwood | 5 | Linnea → Wren | 3 heartwood sap (treants, 50%); bring it to Linnea | the map and its markers | .8 |
| W8 | The peddler | 6 | Odran | Sell him 2 things at his cart | selling | .6 |
| W9 | Grey in the bog | 7 | Bram | 3 grey-veined bog slimes (spawned for you in the Bog) | drops, tough monsters | .55 |
| W10 | Sharper | 8 | Aldric | Upgrade a skill | skill upgrades | .5 |
| W11 | Three of a kind | 9 | Greta | Merge the three items she gives you | rarity, the forge | .45 |
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
(storyteller), Shrine Maiden Kaede (soul shrine); Odran's cart moves to Hanami's gate at V8.

| # | Step | Gate | Giver → hand in | Objective | Teaches | r |
|---|---|---|---|---|---|---|
| V3 | Hanami | 15 | Daisuke | Meet Sayuri, Kenji, Haruka, Tetsuo | a second hub | .05 |
| V4 | Home in a blink | 15 | Chiyo → Wren | Travel home on the teleport circle | teleport circles | .25 |
| V5 | The soul shrine | 16 | Kaede | Bind your soul | the soul, x1.5 | .25 |
| V6 | A light for Wren | 17 | Kaede → Wren | 6 kodama lanterns (50%); bring them to Kaede | monster elements, the wheel | .2 |
| V7 | The friendly foxes | 18 | Chiyo | Ask Master Ryu about passives; 5 grey kitsune (spawned for you in the Inari Hills) | passives | .2 |
| V8 | A lantern with no flame | 19 | Odran (Hanami) | Sell him something | (story) | .2 |
| V9 | The old scrolls | 19 | Kaede | 4 scroll pieces (onibi, jorogumo, 45%) | tier 4 gear (level 20) | .2 |
| V10 | The Demon Gate | 20 | Daisuke → Kaede | Defeat Akaoni; read the Demon Gate's stone | boss skill drops | .2 |
| V11 | Frostbloom | 20 | Kaede → Wren | Tell Chiyo; take the news home | (the act ends) | .12 |

**The act ends at Akaoni.** Its dying words carry the act's key hint (moved here from Kyuubi): *"They made you forget... They are
still watching... Ask the ice what fell from the sky."*, and far to the north the ice wall cracks. The gate's stone gives the
Frostbloom ("Where the ice meets the sky the frost flower grows, and the sleepers wake."). After V11 the quest log says the road north
to the Hoarfrost Reach is not open yet (`MQ_END`).

## 4. Side story, planned (not built): "The Nine Tails"

Kyuubi (level 25, the Foxfire Shrine) is no longer on the main path. The pieces are already hinted: Chiyo's "then one of them grew nine
tails" (V7), the grey kitsune, Master Ryu's "the fox of the shrine has nine tails and nine tricks". A later side chain for levels 21-25
can reuse the old plan: Jade Falls' glacier water (the vale's water comes from the north), the tengu's "the sky went quiet", the mural of
ships with no sails in the Warlord Ruins, the Thunder Grove, and Kyuubi herself, grey, the vale's oldest friend. Her last words should add
to the story, not repeat Akaoni's (spoiler rule: still no answers before the end of Amber Reach).

## 5. Side content (built, optional)

Readable lore spots (`LORE` in `shared/main-quest.js`; walk up and press the talk key): the Stone Circle's carvings; the old letters by
the tunnel; **the drowned roads** (below); a grey fishing boat on the Crownsea shore where nothing grows; the Demon Gate's stone; a
roadside shrine of paper prayers in the vale ("for a quiet sky to speak again"); the ice wall at the end of the North Road. Oskar's,
Chiyo's and Odran's lines; Odran's curiosities (a coin with a sun inside a ring, the lantern with no flame).

**The drowned roads.** Where the roads dip under still water (the Redgate Road west of the village, the Shore Road's valley, a pond
on the East Road, and a few spots in the vale), plank causeways on posts carry them across (`BRIDGES` kind `causeway`). Below the planks
the old paving runs on under the water, fitted closer than anyone in Eldmere can cut stone; Oskar says the water came up "the year the
sky went quiet", and nobody else remembers such a year (the Quiet, `STORY.md`). A drowned milestone shows a ring with a small sun
inside. Names: the Drowned Road, the Long Planks, the Heron Steps.

**The forest's edges** (the Crownsea Shore, the Sunwall's Foot, the Greyspine Foothills) hold monsters of levels 16-20: not part of the
main quest, ground for players who come back from the vale.

## 6. How it is built

- **Data** (`src/shared/main-quest.js`, pure): `MQ`, the steps (fields described at the top of the file), `mqTalk` (what a talk does
  and says: used by the server to apply it and by the client to show it, so the two always agree), `mqObjective`, `mqReward`, the
  places (`HERBS`, `mqGreySpot`, `VIL.bed`, `V.cart`) and `LORE`.
- **Save**: `gear.mq = {s, st, n, h}` (step index; 0 offered, 1 in progress, 2 ready to hand in; progress per part; heartleaf picked),
  sanitized by `sanitizeMq`. Old characters start at W1 and walk the early steps quickly; parts that are about what they already have
  (level, weapon tier, soul, the tunnel open, Hanami reached) finish at once.
- **Server** (`src/server/main-quest.js`): the only message is `mq{a:'talk'|'pick'|'read'}`, each checked (in the village, next to the
  herb or the spot, the part open). Kills (`rewardKill` → `mqKillP`), system uses (`mqActP` from buy, sell, equip, class, merge, upskill,
  soul, the quest board, skill and burst use, the teleport circle, reaching Hanami) and a half-second check (`mqTickP`: auto parts, the grey
  monsters spawned for you: `GREY_DEFS` in `monster-defs.js`) move it on. Testing: `dev{cmd:'mq',v:'W9'}` (the Settings' testing tools).
- **Client** (`src/game/economy/main-quest.js`): the lines (`mqLinesFor`, shown by `village/talking.js` before a villager's panel), the
  violet ! / ? over villagers (`mqMark`, `npc-labels.js`), the main quest's row at the top of the quest log (`mqLogRow`), its violet
  marker on the maps (`mqTarget`). Props: `game/world/lore-props.js` (sickbed, carts, lore props, heartleaf).
- **Test**: `node tools/mainquest-smoke.js`.
