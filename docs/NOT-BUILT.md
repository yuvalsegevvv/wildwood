# What is not built yet (with comments)

An honest list of what the Hoarfrost Reach update left out, and of the older gaps it touches, with a comment on each: why it is missing, what it
would take and where to start. Nothing here is a bug; it is the edge of what exists. Ask the owner before starting any of it (`CLAUDE.md` section 10
keeps the short list of ideas; the story for levels 26-50 is planned step by step in `docs/MAIN-QUEST.md` section 7).

## 1. Professions, tools, crafting and potions (`shared/professions.js`, `shared/crafting.js`; built, see `docs/MAIN-QUEST.md` section 5b)

What is built: three professions each with a **tool slot** (a node needs a tool of the tier of its zone), 314 nodes in every land, ore / logs in six grades and
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

Only planned, in `docs/MAIN-QUEST.md` section 7: the Greyspine (Highmark), the Sunscar (Glasswell, Rook, the medicine that wakes Wren), Amber Reach (the song and
the reveal), the Emberwake Isles (the Sink and the ending), and the Stormhorn and Rootdeep side branches. The main quest ends at F9 with "the road to Highmark is
not open yet" (`MQ_END`). Levels 26-30 in the Hoarfrost are walkable side content without quest steps. The story's payoffs for the iron bird, the plate and
Ymrik's last words wait for the reveal at the end of Amber Reach (`docs/STORY.md`): no NPC explains them yet, by design.

- **The west glacier valley** that "has just split" (F8's boss line, F9) is not built: nothing at the Reach's west wall leads to the Greyspine. The rectangle
  north-west of Wildwood is a cheap unwalkable massif (`greyspineHeight`, `shared/terrain.js`). Building the Greyspine means replacing it with real terrain and
  a gate in the Reach's west wall (`WORLD.md` section 5: the gate is opened by Ymrik).
- **The Nine Tails** (Kyuubi's side story, vale levels 21-25) is still only hinted (`docs/MAIN-QUEST.md` section 4).
- **More Hoarfrost side content**: Sigrun's other sagas, the hunters' hunts, ice-fishing on Frostmere, a story reason to go to the wyrm's nest (the iron bird can be
  read there, but no step asks for it).

## 3. The Hoarfrost Reach itself

- **Weather is regional only on the client.** The server still has one weather for the whole world; the client turns rain into snowfall and a storm into a
  blizzard when the camera is in the Reach. So everyone hears the same "it is starting to rain" schedule, thunder in the Reach is a thundersnow, and there is no
  weather that only exists in the Reach (a snowfall without a storm, or clear cold nights with ground blizzards). Real regional weather (sandstorms, gales, tropical
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

## 4. Music (done)

The four Hoarfrost songs exist (`music-rimehold`, `music-hoar`, `music-boss26`, `music-boss30`, made with Google's Flow Music; see `assets/audio/README.md`). What is left: the licence
of the free-plan tracks (all eleven) if the game ever earns money, and, if wanted, the darker night mix for Rimehold and Hanami (today only the home village has it).

## 5. Systems the next lands need (not started)

- **XP curve and gear past 25/tier 5**: the curve is flattened to 2,100 same-level kills a level from 25 (a stopgap so 26-30 are playable), gear stays at tier 5, `MAX_ZONE_LV` is 30
  and skill upgrades still ask for drops of at most level 25 (`VALE_TOP_LV`). Levels up to 50 need a real curve, more gear tiers (items, icons, looks) and a decision about upgrades.
- **The world rectangle** must grow again (north-west, west, south-west) and the Rootdeep needs an enclosed instance (`docs/WORLD.md` section 8).
- **Group play, trading between players, party quests** (`CLAUDE.md` section 10). Group play (a party of up to 4) is **planned as the first step of the dungeons**, `docs/DUNGEONS.md` sections 5 and 11 (milestone M1); trading and party quests are not.
- **Dungeons** (randomized tile dungeons, Warframe-style missions, up to 4 players): designed in `docs/DUNGEONS.md`, with an inert setup in `shared/dungeons.js`; nothing in the game uses it yet, no dungeon theme exists, and the server has no instances today (the doc's section 7 lists every global that has to change).
- **Real passives** (the eight in `PASSIVES` are a placeholder set; only one slot is open).
- **Server-side anti-cheat for movement**, and synced villagers.
