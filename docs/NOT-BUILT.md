# What is not built yet (with comments)

An honest list of what the Hoarfrost Reach update (and the Greyspine, section 3b) left out, and of the older gaps it touches, with a comment on each: why it is missing, what it
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

- **The west glacier valley** is built (section 3b): the ice fall opens when Ymrik falls and leads to Highmark. What is not built is the story around it: no NPC mentions it,
  F8's boss line and F9 ("the road to Highmark is not open yet", `MQ_END`) still read as before, and the steps G1-G9 (`docs/MAIN-QUEST.md` section 7) do not exist.
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

## 3b. The Greyspine, fourth land (levels 26-32; `shared/greyspine.js`, `highmark.js`, `greyzones.js`; design in `docs/WORLD.md` sections 3 and 8)

**Built** (`CLAUDE.md` section 4 has the file map; test `node tools/greyspine-smoke.js`):

- the ground (valleys, ridged mountains, walls, colours, treeline) and a zone label, a map view while you stand in it;
- **the way in**: the glacier valley `GLEN` cut through the Vale Wall at the Reach's west edge, shut by an ice fall until Ymrik falls (`gear.west`), with the Glacier Road from Rimehold to Highmark;
- **Highmark** (`VIL4`, shelf `GREY_HM`, ~100 m up): nine named NPCs and fillers, a Wayfarers' Lodge, a teleport circle (the travel window now lists four villages), a respawn point once you have walked in (`gear.west` 2);
- **seven zones and 14 monster kinds** (two per level 26-32, 12 of each, earth and air; a new gryphon model family, a golem, crystals, a rock troll...), their materials with names, `MAX_ZONE_LV` 32;
- **two bosses**: the Gryphon Queen (29; her peak, a flat nest on a cone-shaped mountain; kit `gryphon`) and the Mountain Golem (32; a cavern; kit `golem`), 12 boss skills, two board quests;
- **water**: three tarns, a river that leaves the range to the west, and a fjord on the south-west coast, with wading, banks, plants, camps and the map all reading one `waterSurf`;
- **the two rock falls** in the west wall (the river road, opened by the Gryphon Queen: `gear.river`; the neck pass, by the Golem: `gear.neck`): canyons through the wall to the world's edge;
- **zone tiers** (`ZTIER_LANDS` has `grey`: the picker, the Mountain Golem opening them) and **its dungeon, the Blackseam**, a mine under Highmark Pastures with the boss Garrick (`docs/DUNGEON-THEMES.md` section 9), whose clear pays a **pendant** (`docs/PENDANTS.md`);
- testing tools: `dev tunnel` `glen` / `glenw` / `highmark` / `grey` / `queen` / `cavern` / `riverfall` / `neckfall`, `dev west`, `dev gate`, and the buttons in the Testing section (the Old Adit's door button included).

**Not built**, in about this order:

- **The lands beyond the gates.** The two canyons end at the world's edge: nothing lies behind them (the Sunscar behind the river road, the Stormhorn behind the neck pass). When they are built
  the rectangle must grow west (section 5) and each canyon becomes a real road; until then opening a gate only changes a toast and a mesh.
- **The main quest in the Greyspine** (`docs/MAIN-QUEST.md` section 7, steps G1-G9): no step asks you to go there, ore veins (G3) and the Rootdeep's mine have no home. Highmark's NPCs are
  ambient (lines and labels, no quests beyond the board) and the two bosses' quests are board notices.
- **Resource nodes and the professions' tier**: `NODES` has none in the Greyspine (the planner skips `zn.grey`), so mining, woodcutting and gathering have nothing to do there; the Lodge buys
  and sells but a node needs a grade of ore, log and herb that does not exist yet (`ORE_GRADES`, `LOG_GRADES`, `HERB_LANDS`, a tool tier 6).
- **Gear tier 6 and the economy past 25**: gear stays at tier 5, drops and the shop do not follow the levels 26-32 (`tierFor`), `VALE_TOP_LV` is still 25, and the XP curve is the stopgap of
  section 5.
- **The Greyspine's zone-tier symbol is a placeholder** (to replace later): its tier points now count toward the symbol and it has a fourth badge (`ZTIER_SYMBOL_LANDS`, `.zs.grey` in `22-tiers.css`: a slate-silver stand-in colour), but the **symbol stops at +150%** (`ZTIER_SYMBOL_CAP` in `shared/tiers.js`). Why: the balance yardstick `tools/boss-duel.js` (docs/areas/tiers.md) was tuned with three lands' fifteen points (+150%); with the Greyspine's five on top (+200%) the maxed level-60 hero beat the tier V Vetrmaw standing still (3 of 3 won), which the owner's targets forbid. So today a hero with the three older lands maxed gains nothing from the Greyspine's points. To replace: the cap (raise or remove it and re-tune the bosses' creep, `BOSS_CREEP_*`, or give the Greyspine a smaller value per point), the badge's look, and the Greyspine's tier numbers themselves (tiers I-V of its monsters and Garrick are unchecked).
- **Rings' elements have no use** (placeholder): the ring is now additive, a share of the weapon's attack on any soul (`ringAtk`, `docs/DUNGEON-THEMES.md` section 7), so its seven types (no element, six elements) are only a name and a look. To decide: give the element a use (for example a bonus on top when it matches the soul, or the element's damage on basic attacks) or collapse the Barrow's pool to one ring.
- **A use for coins at level 30 and above: not implemented yet.** Past the last shop tier (gear stays at tier 5, `tierFor`), level-30 gear is only paid by dungeons and tempered with stones (no coins), so the coins a level 30+ hiker earns (`coinsFor`, x20 from bosses, +pendants of Fortune) have nowhere to go but potions and brewing. Ideas, none chosen: a coin cost on tempering or merging, a coin price on Tempering Stones, a Highmark shop, buying a dungeon's key. Recorded here only; it is not part of the Greyspine work.
- **Music**: the Blackseam plays the Reach's `hoar1` track; Highmark and the zones play the Rimehold and Reach tracks and the two boss fights the Reach's boss songs (`boss26` for the Queen, `boss30` for the Golem) as placeholders (`THEMES`, `musicThemeHere`); no recorded track exists
  for the Greyspine, and no night mix for Highmark.
- **Weather and sound**: sudden mist, thunderstorms on the peaks, avalanches as a boss move, an alpine wind of its own (the Greyspine uses the home forest's ambience; only the footsteps on water follow `waterSurf`). Regional weather is still client-side only (section 3).
- **Dressing of the village and the land**: Highmark has no palisade, no rope bridges on the troughs' flanks and no shrines (the doc's dressing); no waterfalls (the tarns, river and fjord are
  surfaces without falls, foam or sound beyond the shared water); no **wonder** (a floating rock, `WORLD.md` rule 9) and no mine entrance.
- **The monsters' mechanics**: the 14 kinds are new models (the gryphon family, crystals, the troll) but share the ordinary AI; no kind uses terrain (rock fall from cliffs, wind gusts), and the
  bosses' moves and numbers are first guesses, **not balance-tested by play** (the Queen's swoop and the Golem's quake are telegraphed on purpose).
- **The far lands**: the placeholder mountains beyond the north and west edges still use `farHeight` ('grey' region, `game/world/far-lands.js`): its edge vertices take the real
  height (`getH`), so they meet, but the shapes behind the walls are not related to the real range, and the canyons open onto them.
- **Map**: the full map (N) shows the Greyspine only while you stand in it (`LANDS.grey`, `landOpen`); it names Highmark, the zones and the water, but not the gates' canyons, and has no zone tier row.
- **Balance of the ground**: 26% of the inner country is steeper than 0.95 (the home forest 9%, the Reach 13%); that is how the mountains read, and camps keep to ground under 0.55
  (54% of the inner country). If the zones turn out cramped, widen the troughs (`in` / `out` in `GREY_VALLEYS`) first.
- **Performance was not measured on a phone** with the Greyspine's extra meshes (Highmark, the nest, the cavern, the water surfaces, the rock falls); the terrain tiles are the same.

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
