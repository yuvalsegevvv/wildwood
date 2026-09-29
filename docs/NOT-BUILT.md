# What is not built yet (with comments)

An honest list of what the Hoarfrost Reach update left out, and of the older gaps it touches, with a comment on each: why it is missing, what it
would take and where to start. Nothing here is a bug; it is the edge of what exists. Ask the owner before starting any of it (`CLAUDE.md` section 10
keeps the short list of ideas; the story for levels 26-50 is planned step by step in `docs/MAIN-QUEST.md` section 7).

## 1. Professions (the Wayfarers' Lodge, `shared/professions.js`)

- **Potion use** is only a greyed-out row at the Lodge ("Coming later"). It is meant to be a fourth profession, taught by an alchemist (Gudrun says her chair
  is empty), whose recipes turn herbs and frostbloom into healing, cures and short buffs. It needs an alchemist NPC (the plan puts her in Glasswell, act V-a),
  a potion item kind in the bag and on a hotkey, a server effect (`hurtP`/`healP`/buff hooks already exist for skills), cooldowns and a recipe list. Best built
  together with crafting, since both eat resources.
- **Crafting** does not exist: mined ore, chopped logs, frostbloom and snowmoss have **no use**. The idea is crafting at the forges (Ulfhild's, Greta's...):
  ore and wood into weapons and armour of the land's tier, ore into upgrade material. It needs recipes, a crafting panel (the forge panel is the model), and a
  decision on how it fits with drops and the shops. Until then the resources just pile up (capped at 999 each) and show in the inventory.
- **Selling resources**: the peddler and the stalls only buy items (`sellP`); Odran's "he buys anything" does not include resources yet. A price per resource
  in `RES` and a Resources tab in the shop would do.
- **Gathering has no animation and no cast time**: pressing the talk key at a node takes it at once (1.2 s cooldown), with a sound, a toast and a few sparks. A
  swing or kneel pose (`poseRig`), a short progress bar and a tool in the hand would make it feel like work; tools that make gathering faster or unlock
  richer nodes are part of the same idea.
- **Nodes exist only in the Hoarfrost Reach** (90 of them: rime ore, frostpine, frostbloom, snowmoss). The home forest and the vale have no nodes, so a player
  cannot level a profession anywhere else, and a profession's level only gives a double-yield chance (there are no level-locked nodes in use: `NODE_KINDS.lv` is
  1 for all). Every later land should get its own resource kinds (`docs/MAIN-QUEST.md` section 5b).
- **Profession levels stop at 5** (`PROF_XP`) and a profession has no ranks, trainers per level or specialities.

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
- **Monsters and bosses use the shared fight.** The 18 kinds are recolours or variants of existing models (a wolf variant of the fox, a fur mantle and axes for the goblin
  family, a new wyrm model), with no mechanics of their own; monsters' elements still do not change the damage they deal. Ymrik and Vetrmaw fight exactly like the other
  bosses (cleave, roots, slam, shield with totems, adds): Ymrik's Rime Pillars and Vetrmaw's Warm Cores are the totems, Frost Thralls and Wyrmlings the adds. The wyrm does not
  fly or breathe, and neither boss has a unique drop beyond materials and skills.
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
- **Group play, trading between players, party quests** (`CLAUDE.md` section 10).
- **Real passives** (the eight in `PASSIVES` are a placeholder set; only one slot is open).
- **Server-side anti-cheat for movement**, and synced villagers.
