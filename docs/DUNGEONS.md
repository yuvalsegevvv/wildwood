# Dungeons: a setup plan, the first dungeon (boss level 30) and the pendants

**Status: step 1 of section 5, the pendants, is built (`shared/pendants.js`, `tools/pendants-smoke.js`; they have no source yet but the testing tools). The dungeon itself (steps 2-7) is design only.** It was written to be read before any dungeon code is started, the way `docs/WORLD.md` is read before a
region: it says what a dungeon is in this codebase, which existing machinery it reuses, what has to be new, in what order to build it, and which decisions are
still the owner's. Section 7 lists those decisions with the default this plan assumed for each; change a default and only the part it names changes.

What was asked for: a dungeon whose **boss has a base level of 30**, that **gives a pendant**, and pendants of five kinds: **exp increase, drop increase, coin
increase, crit rate increase, crit damage increase**. The plan therefore has three parts: the framework every dungeon shares (section 2), the first dungeon
(section 3) and the pendant system (section 4), then the build order (section 5) and the tests (section 6).

Read first: `CLAUDE.md` (architecture, section 4 map), `docs/WORLD.md` (the Greyspine, the Rootdeep), `docs/STORY.md` Act IV (the lore a dungeon at Highmark must not
contradict; it is spoiler-heavy and has hint rules).

## 1. What the codebase gives a dungeon today (checked against the source)

| Need | What exists | Where |
|---|---|---|
| A boss with its own moves, phases, adds and a reset | Eight bosses, each `BOSS_DEFS` row names a `kit`; engages when anyone enters its arena, resets when nobody alive is left in it, respawns 120 s after it falls and when the arena is empty | `server/boss.js`, `boss-fx.js`, `boss-kits-*.js` |
| Enemies at a harder level | Zone tiers: a land has tiers 0-3, +10 levels each; the **tier is the player's own** and a monster exists once with its health in the def's own units, so two players at different tiers can fight the same monster | `shared/tiers.js`, `server/tiers.js` (`monK(m,p)`), `defAt` in `monster-defs.js` |
| One place to give a reward | `rewardKill(q,m)`: XP, coins (x20 for a boss), item roll (`rollBossRarity`: nothing 36%, common 50%, rare 10%, epic 3%, unique 1%, legendary 0.1%), material drops (`rollDropCount`, `DROP_CHANCE` 0.35 x (1 + bonus), a boss always `BOSS_DROPS` = 3), boss skills (10% each) | `server/combat.js` |
| One place for crits | `rollDmgS`: chance `0.12 + psP('crit') + buff`, multiplier a fixed **1.7** | `server/combat.js` |
| A stat from a worn thing | `psP(p,stat)` for passives (`xp`, `drop`, `crit` ...), read at the choke points above; **no stat comes from an item except hp / attack / defence** | `shared/classes.js` (`PASSIVES`), `server/players.js` (`recalcP`) |
| A new kind of equipment slot | The three tool slots (`eq.pick/axe/sickle`) were added this way: items in `ITEM` but not in `ITEM_LIST` (so shops, drops and "all items" ignore them), `TOOL_SLOTS`, `sanitizeGear` checks the slot of a worn item, `BODY_SLOTS` and `toolIconArt` on the client, merging at the forge works because rarity is the same axis | `shared/items.js`, `server/economy.js` (`equipP`), `game/economy/inventory.js` |
| An enclosed place in the world | The Sakura Vale tunnel (`TUN`, `inTunnelCut`, a lid mesh, `P.inTun`), the Golem's Cavern (`ARENA32`, `buildGolemCavern`) | `shared/vale.js`, `game/village/buildings-grey.js` |
| A gate with a save flag | `gear.east / north / west / river / neck`, `setPos` clamp on the server, `worldBounds` on the client, an `ev(...)` event, dev commands and testing buttons | `server/api.js`, `server/players.js`, `game/player/movement.js` |
| Teleport / respawn points | `CIRCLES`, `respawnVil`, the travel window | `shared/hoarfrost.js`, `server/players.js`, `game/ui/travel.js` |
| A mine to start from | Highmark has a headframe with ore cars on the North Fork side (dressing only) | `buildHighmark` in `game/village/buildings-grey.js` |

What does **not** exist, and decides the shape of the plan:

- **No instancing.** One global `MONS` list, one `BOSSES` entry per boss with a fixed arena, `ev()` goes to every client, `playersInArena` scans every player.
- **No party system** (`CLAUDE.md` section 10). A dungeon cannot assume groups.
- **No stat on gear beyond hp / attack / defence**, no necklace slot, no crit-damage stat (the 1.7 is a constant).
- **Gear stops at tier 5** and the Greyspine has no gear tier 6 (`docs/NOT-BUILT.md` section 3b); pendants do not need one (section 4).

## 2. The framework: how any dungeon works

### 2.1 Anatomy: one data row per dungeon

A new `shared/dungeons.js` (pure, in the manifest after `greyzones.js`) holds `DUNGEONS`, one row each, the way `BOSS_DEFS` and `GREY_GATES` are rows:

```
{ id:'blackseam', name:'The Blackseam', land:'grey',
  entrance:{x,z,face}, interior:{x0,z0,x1,z1,floor},   // where the door is and the carved block that holds the rooms
  minLevel:28, unlock:'west2',                          // gear.west >= 2: you have walked into Highmark
  baseLevel:30, tiers:3,                                // the boss is 30 at tier 0 and 40 / 50 / 60 at tiers I / II / III (+10 per tier, ZTIER_STEP)
  rooms:[ {id,rect,kind:'pack'|'hazard'|'mini'|'boss', mons:[{def,n}], opens:'id'} ... ],
  boss:'seamforeman', loot:{pendant:true, mats:'seamshard', ...} }
```

`baseLevel` is the level of the boss at the lowest tier; everything else (trash, health, damage, XP, coins, the gear tier of drops, the level debuffs) follows
from `defAt` exactly as in the zone tiers. A later dungeon is another row with its own `baseLevel` (a ladder like 30, 40, 50 is natural; none is planned yet).

### 2.2 Entering, leaving, who is in a run

- The door is a place with an NPC or a prompt (the talk key, like a teleport circle): "Enter The Blackseam (tier I)". It shows the tier picker (section 2.4) and the
  level requirement; `unlock` is a flag test, not a quest, so the dungeon works before the Greyspine's main-quest steps G1-G9 exist.
- **No party needed.** A run is formed at the door: everyone within 15 m when the first player presses Enter goes in together (maximum 4); anyone arriving after
  the run has started waits or opens their own. When the party system arrives, it replaces this rule and nothing else changes.
- Leaving: walk out the door (always possible outside a boss fight), a "leave" button, or being knocked out (you wake at the door's circle, section 2.5).
- Messages (`receive()` in `server/api.js`, handled in `applyEvent` / `netHandle`): `dg{a:'enter'|'leave'|'tier',id,n}` from the client; events `dgin`, `dgout`,
  `dgclear [pid, id, tier, seconds]`, `dgfail`, `dgtime` to the client; the run timer is shown on the HUD.
- Saves: `gear.dg = {blackseam:{max:0..3, clears:n, best:seconds}}`, sanitized with a default for old saves (`sanitizeDg`, like `sanitizeZt`).

### 2.3 Instancing: two milestones, not one big step

The honest cost is in the server, so the plan splits it:

**Milestone A: a shared dungeon (no engine change).** The interior is a carved block in the world with its rooms; trash are camp monsters (`MON_DEFS` rows with a
`dungeon` flag, spawned by `initMonstersS` into room rectangles instead of zone cells); the boss is an ordinary `BOSS_DEFS` row with an arena in the last room
and its own kit. Everything the bosses already do holds: it engages when someone steps in, resets when the arena empties, respawns after 120 s. Tiers use the
existing per-player machinery (`monK`): a tier-III player and a tier-I player can fight the same foreman. The cost is **contention**: one boss for everybody,
so two groups block each other and a farmer waits 2 minutes after each kill. Fine for the first weeks and for validating the content.

**Milestone B: runs layered at the same coordinates (the real instancing).** Several runs share the one physical interior but cannot see or hit each other:

- a run object `{id, dungeon, tier, players, mons, boss, evq, t0, state}`; players and monsters carry `run` (null in the open world);
- `ev()` writes into `CTX ? CTX.evq : EVQ` where `CTX` is the run being ticked; `broadcastSnap` sends `EVQ` plus the player's own run's queue, and filters `mo`, `pl`
  and `b` by `run` (today it filters by distance only);
- `playersInArena`, `anyPlayerNear`, `toastTo(null, ...)` and the boss's "everyone" lists take the run as scope; a boss exists once **per run** (built from the
  same `BOSS_DEFS` row, destroyed with the run), and the run's tier replaces the per-player tier (a run is one tier, chosen at the door);
- `welcome` / `mons{list}` and `spawn` / `despawn` events for run monsters go only to the run's members.

That is about 300 lines on the server (state.js, api.js, boss.js, monsters.js), about 150 on the client (boss list built from the snapshot instead of a fixed
`BOSS_DEFS` order: **to verify**, `applySnap`'s `b` handling), and it is the largest engine change since per-player snapshots: build it only when players actually
queue for the boss. Terrain does not change between the milestones (the interior stays where it is), so no content is redone.

### 2.4 Difficulty tiers

Each dungeon has up to three tiers above its base: the boss and every enemy in it are `baseLevel + 10 x tier`. For the Blackseam: **30 / 40 / 50 / 60**, with
Vetrmaw (also level 30) as the yardstick: at tier I / II / III his health is x1.3 / 1.9 / 2.9 and damage x1.2 / 1.6 / 2.4 against his own (`zoneTierK`, from `CLAUDE.md` section 9).

- Milestone A reuses the zone tiers outright: a land key `'mine'` for the interior's rectangle (`landAt`), `ZTIER_LANDS` gains it, `ZTIER_BOSS.mine = 'seamforeman'`
  (the unlock rule "kill the land's second boss at your highest unlocked tier" becomes "its boss", since the dungeon has one), the picker is the one under the map
  but placed at the door too. **Decision (section 7): do dungeon tier points also add to the symbol (+10% attack and health each)? Default: no**, so a dungeon
  does not feed the combat power of the whole game; the pendants are its reward.
- Milestone B: the tier belongs to the run (picked at the door by the party leader, capped by the lowest `max` in the party).
- The level debuffs already punish going in too early (-5% damage dealt, +5% taken per level above you): level 28 is the entry minimum, 30 recommended.

### 2.5 Death, wipes, time

- Knocked out in a dungeon: you wake at the door's teleport circle (a new `respawnVil`-style rule: a dungeon's `respawn` point), keep your loot, and may walk back in.
- Wipe (nobody alive in the boss room): the boss resets (existing behaviour); in B the run stays open for 10 minutes, then it closes and you are sent out.
- A run has a soft timer (target 8-12 minutes for a clear at the recommended level), shown on the HUD and stored as `best`; nothing is lost when it runs over.

### 2.6 What a dungeon touches (so no file is a surprise)

| Part | Files |
|---|---|
| Data, tiers, the interior block, entrance | new `shared/dungeons.js`; `shared/terrain-height.js` (a carve like `glenCarve` / the tunnel); `shared/tiers.js` (`landAt`, `ZTIER_LANDS`, `ZTIER_BOSS`) |
| Rooms, monsters, the boss | `shared/monster-defs.js` (the boss def, trash as `dungeon` clones of Greyspine kinds), `server/monsters.js` (`ok()` and the room spawner), new `server/boss-kits-mine.js`, a `BOSS_DEFS` row, `BOSS_QUESTS` row |
| Run logic, messages, saves | new `server/dungeons.js` (`enterDgP`, `leaveDgP`, `dgTickS`, the clear and the loot), `server/api.js` (`dg` case, `setPos` clamp), `server/players.js` (`sanitizeDg`, `respawnVil`), `server/combat.js` (a hook in `rewardKill`) |
| Look and UI | new `game/village/buildings-mine.js` (the adit, the lid, lamps, rails, the rooms' dressing), the door panel (`game/ui/dungeon.js`, markup in `index.html`, `styles/23-dungeon.css`), the HUD timer, `game/combat/boss.js` (new telegraph kinds), `game/ui/map.js` (a marker), `game/net/client.js` |
| Tests, docs | `tools/dungeon-smoke.js`, additions to `boss-smoke.js` and `client-smoke.js`, `docs/FILES.md`, `CLAUDE.md` rows |

## 3. The first dungeon: The Blackseam (all names are placeholders)

### 3.1 Place, lore, door

- **Where**: Highmark's old workings. The mine's headframe already stands on the North Fork side of the shelf (`buildHighmark`); the adit is cut into the mountain
  beside it and the rooms are a carved block with a lid, like the Vale tunnel (find the block by scanning for a thick massif, then **pin its coordinates** in the data:
  the terrain-scan pitfall in `CLAUDE.md` section 8). It is **not** the Rootdeep: the deepest shaft that "broke into something vast" (STORY Act IV) is the golem's
  gate and stays for the main quest; this dungeon is the old upper workings the miners sealed after a cave-in.
- **Lore fit** (to confirm against `docs/STORY.md`'s hint rules before writing any line of text): the miners dug the black stone that hums and are "falling grey";
  the dungeon's trash are miners' tools and rock given crude life by it, its boss the **Seam Foreman**, a hulk of timber, chain and black stone that still runs the shift.
  It gives the object-hint of Act IV a place to be seen without explaining it.
- **Door**: the adit. Needs `gear.west >= 2` (you have walked into Highmark) and level 28. A door NPC (the foreman Brenna of the story, if she is in the village; else a new
  one) sells nothing and says one line; the panel does the work.

### 3.2 Rooms (a linear run of about 10 minutes, one optional branch)

| # | Room | Content | Opens |
|---|---|---|---|
| 0 | The adit | safe, the circle, the door panel | always |
| 1 | The lamp gallery | 3 packs of 3 (level 28), a long straight, lamps along the walls | when the packs are dead |
| 2 | The flooded winch | a pit with water (uses the Greyspine's `waterSurf`: wading slows), 2 packs, a swinging ore car as a hazard (a telegraphed line, `addTeleS` `'line'`) | when the packs are dead |
| 3 | The foreman's office | **mini-boss** (level 29, an elite: one of the Greyspine kinds scaled up with two moves) who drops the door key | when he is dead |
| 3b | The side drift | optional dead end with a chest (a rare pendant chance bonus or a material stack) | always |
| 4 | The heart seam | the boss's round hall (arena `r` about 24 m) | the key |

Rooms hold monsters in **rectangles** (not zone cells) with `n` per pack; a room opens (its door mesh sinks, as the rock falls do) when its rule is satisfied. The
rooms' rules live in the data row, so a second dungeon is data plus a boss kit plus meshes.

### 3.3 Monsters

No new models needed for a first version: `MON_DEFS` clones with `dungeon:true` of the Greyspine's kinds (`minegoblin` 28, `crystalbeetle` 27, `slatecrawler` 31,
`granitslime` 26, `rocktroll` 31) set to levels 28-30 and recoloured a darker grey (`pal`), plus one new family later if wanted ("lamp bats", a possessed
mine cart). Elements: earth and dark.

### 3.4 The boss: the Seam Foreman (base level 30)

- Def: `bossDef` row, level **30**, element dark, health about the Golem's (24,660 at level 32) and the Queen's (22,844 at 29), so about 23-24 k at tier 0; model a
  new family `monster-foreman.js` (a stooped hulk of timber and iron bands with a lantern on a chain; start by reusing the golem's frame with a different `pal`
  to see the fight before spending days on a model, as `monster-woods.js` golem shows).
- Kit `BOSS_KITS.foreman` in a new `server/boss-kits-mine.js`, using primitives that exist (`addTeleS`, zones, `laterS`, `castS`, `moveBossS`, `pfxS`, adds). A boss
  needs **moves no other boss has** (`boss-smoke` counts signature kinds), so new telegraph kinds: `swing` (a pick arc, a wide cone), `chainpull` (a pull toward the
  boss, `pfxS` with negative push), `blackout` (the hall goes dark: only lamp circles on the floor are safe from the tick of dark damage, a zone kind), `slag` (adds).
  - Phase 1 (100-60%): swing, chain pull, a ring of falling rock from the ceiling.
  - Phase 2 (60-30%): `blackout` begins, the Foreman summons 2 slag adds per cycle (they carry a lamp: killing one relights a circle).
  - Phase 3 (below 30%, enraged by the shared rule): shorter blackouts, chain pull then swing as a combo.
  Every move telegraphed, as the others are; numbers are first guesses and **not balance-tested by play**, like the other bosses'.
- Rewards: coins x20 (every boss), 3 materials of a named material `seamshard` (`MATS`), the boss quest, 6 boss skills? **No in the first version** (the Greyspine's
  bosses already have 12; the pendants are this dungeon's loot). A guaranteed pendant (section 4.4).

## 4. The pendants

### 4.1 The five kinds

One slot, `eq.pendant`; a pendant has **one** bonus. Built names: *Pendant of Learning* (exp), *of Plenty* (drop), *of Fortune* (coin), *of Precision* (crit rate), *of Ruin* (crit damage), with the chain's metal by dungeon tier (Slate, Silver, Gilt, Obsidian) and the rarity in front ("Rare Silver Pendant of Fortune").

| Kind | What it does exactly | Where it hooks in | Common | Rare | Epic | Unique | Legendary |
|---|---|---|---|---|---|---|---|
| exp increase | XP from kills x (1 + passives + pendant) | `rewardKill` (`gainExpP` argument) | +6% | +8% | +10% | +13% | +18% |
| drop increase | the chance of a material drop x (1 + passives + pendant), the same stat the Scavenger passive uses | `rollDropCount(def, psP + pendant)` | +10% | +13% | +17% | +22% | +30% |
| coin increase | coins from kills x (1 + pendant) | `rewardKill` (`c`) | +10% | +13% | +17% | +22% | +30% |
| crit rate increase | percentage points added to the crit chance (12% base) | `rollDmgS` | +2 | +2.6 | +3.4 | +4.4 | +6 |
| crit damage increase | added to the crit multiplier (1.7) | `rollDmgS` (`crit?1.7+pendant:1`) | +0.10 | +0.13 | +0.17 | +0.22 | +0.30 |

Numbers are `base x RAR_MULT` (1 / 1.3 / 1.7 / 2.2 / 3, the table every item uses), rounded for display. **Tier scaling**: a pendant from a dungeon played at tier t (0, I, II, III: boss level 30 / 40 / 50 / 60) is
multiplied by `1 + 0.25 t` (tier I x1.25, II x1.5, III x1.75), so a tier-III legendary exp pendant is +31.5%, and a tier-III legendary crit pendant +10.5 points of crit
chance or +0.525 of crit multiplier. Every pendant needs level 30 to wear, whatever its tier (a pendant from a level-60 boss could never be worn otherwise: the highest level is 50).
They are chosen to sit beside the passives, not above them: Scholar is +5% (+2% a level), Scavenger +15% (+5% a level), Precision +4% (+1.5% a level).

**Caps** (stacking worst case, written into `shared/items.js` as constants so a designer can tune them): total crit chance at most **60%**, crit multiplier at most
**2.5**, exp / coin / drop bonuses are additive with the passives and the potion buffs and have no cap (the worst case, a level-5 Scholar and a tier-III legendary,
is about +45%). The zone tiers' huge XP multipliers (x290 for Vetrmaw at tier III) dwarf any pendant, so the pendants do not change that problem.

### 4.2 Data and slot

- `shared/pendants.js` (or a block in `items.js`): `PENDANT_STATS = ['xp','drop','coin','crit','critdmg']`, base values, names; items generated like tools: for each stat,
  each dungeon tier (0-3) and each rarity (0-4): id `pd-<stat><tier+1>[-<rarity key>]` (for example `pd-xp1-e`), `slot:'pendant'`, `kind:'pendant'`, `lv:30` (the
  boss's base level: you cannot wear it below 30), `price` for selling, the numbers precomputed in `it.stat` / `it.v`. They are in `ITEM` and **not** in `ITEM_LIST`
  (as the tools are), so shops, random drops and "all items" never produce them. 5 stats x 4 tiers x 5 rarities = 100 ids, well inside `BAG_MAX`.
- `eq.pendant` in `newGearFor` (`null`), checked by `sanitizeGear` (the item must be in the bag and a pendant; anything else becomes `null`: an old save and a tampered one
  both load safely), `SLOT_LABEL.pendant = 'Pendant'`, equipped and unequipped by the existing `equipP` / `unequipP` (a pendant can be taken off, unlike the weapon).
- Server numbers only: `pendP(p, stat)` reads the worn item's id from the save, never a number from the client (`CLAUDE.md` section 5), caches nothing a re-equip cannot refresh
  (`gearChangedP` already calls `recalcP`).
- Client: `BODY_SLOTS` gets `['pendant','neck']` and a spot on the paper doll; `item-icons.js` gets pendant art (one gem colour per kind, the frame colour is the rarity as for all
  items); the tooltip prints "+10% XP from kills"; other players see the worn items through `pgear` already (no look change; a necklace on the model is optional, later).
- Merging: Greta's forge (`mergeP`) takes three copies of one id (all in the bag, none worn) and gives the id of the next rarity (`mergedId`); pendant ids follow the same
  scheme as the tools', so three common Fortune's pendants of one tier become a rare one of that tier. This is the sink for duplicates.

### 4.3 Effects in the code (the only places to touch)

| Effect | Change |
|---|---|
| exp | `gainExpP(q, m.T.xp*K.xp*(1+psP(q,'xp')+pendP(q,'xp')), m.id)` in `rewardKill` |
| coins | `const c = Math.round(coinsFor(K.lv)*(m.def.boss?20:1)*(1+pendP(q,'coin')))` |
| drop | `rollDropCount(m.def, psP(q,'drop') + pendP(q,'drop'))` |
| crit rate | `crit = Math.random() < Math.min(CRIT_CAP, 0.12 + psP(p,'crit') + pendP(p,'crit') + (b?b.crit:0))` |
| crit damage | `(crit ? Math.min(CRIT_MULT_CAP, 1.7 + pendP(p,'critdmg')) : 1)` |

Decisions in section 7: whether "drop" should also lift the item-rarity roll (`rollMonsterRarity`) and whether "coin" also applies to quest rewards (default: no to both,
so the pendants stay exactly as the passives are).

### 4.4 How you get them

- **Every clear gives exactly one pendant**, and a pendant is the dungeon's signature loot (the boss's normal item roll and 3 materials stay as for every boss).
  Kind: random of the five; **the first clear of each tier lets you choose the kind** (a one-time pick from a small panel), so nobody starts with the wrong build.
  Rarity: rolled from a table that moves up with the tier:

  | Tier played | Common | Rare | Epic | Unique | Legendary |
  |---|---|---|---|---|---|
  | 0 (boss 30) | 60% | 28% | 9% | 2.7% | 0.3% |
  | I (boss 40) | 45% | 32% | 16% | 6% | 1% |
  | II (boss 50) | 30% | 33% | 25% | 10% | 2% |
  | III (boss 60) | 20% | 30% | 29% | 17% | 4% |

  These are deliberately kinder than the boss item roll
  (a legendary 0.1%): the pendant is the whole point of the run, and merging at the forge (3 -> 1) gives the second route to the top.
- **Seam shards** (a named material every clear drops, 3 to 5): at the dungeon's NPC, 40 shards buy a Common pendant **of the kind you choose**, for the player who wants a
  specific one and has bad luck. A coin sink is optional (`UP_COINS` style).
- Not tradable (there is no trading between players yet), sellable to a shop for coins like any item.

### 4.5 Why it is balanced this way

One slot makes the choice real: farming (exp, drop, coin) against boss speed (crit rate, crit damage). The values equal a mid-level passive per Common and a maximum-level
passive for an Epic, so a first clear is a visible but modest step and the top rarities and higher tiers are the long-term goal. The risk to watch is **exp x tier**: if the
owner later lets tier-III XP pay what Vetrmaw's does, an exp pendant multiplies a very large number; the cap is then to apply the pendant to the monster's *base*-level XP.
The numbers are first guesses, to be tuned by play.

## 5. Build order

Each step ends in a green `npm test` and is shippable alone. Sizes: S about half a day, M about a day, L several days.

| # | Step | Size | Needs | Result |
|---|---|---|---|---|
| 1 | **Pendants (built)**: item data, slot, `sanitizeGear`, the five effects, forge merge, inventory slot and icons, a dev command "give pendants", `tools/pendants-smoke.js` | M | nothing | the pendants work and can be worn and tested before any dungeon exists |
| 2 | **Dungeon data and the shared interior (milestone A)**: `shared/dungeons.js`, the carve and lid, the adit and rooms as meshes, the entrance clamp (`setPos`, `worldBounds`), trash in rooms, room doors | L | nothing | you can walk in and clear the rooms |
| 3 | **The Seam Foreman**: the def, the kit with its four new telegraph kinds, the model, the arena, the arena meshes, `boss-smoke` additions | L | 2 | the boss fight at tier 0 |
| 4 | **Rewards and unlock**: the guaranteed pendant (`pendP`'s source), first-clear choice, seam shards and the NPC, `gear.dg`, the quest | M | 1, 3 | the whole loop |
| 5 | **Tiers**: land `'mine'` in `shared/tiers.js`, the tier picker at the door, the rarity table by tier and the x1.25 steps of section 4.1 | M | 4 | tiers I-III |
| 6 | **Runs (milestone B)**: instancing as in section 2.3, the door's group rule, the HUD timer, wipe and leave rules | L | 4 | private runs |
| 7 | **Polish**: music (placeholder: the Reach's, as the Greyspine does), ambience (drips, creaks), a necklace on the model, a map marker, balance by play | M | | |

Suggested start: **step 1** (small, independent, and the owner can see and feel pendants straight away through the testing tools), then 2-4 in order.

## 6. Tests

- `tools/pendants-smoke.js` (server from `src/`, about 2 s): the 75 items exist and are not in `ITEM_LIST`; equip needs level 30 and the bag, unequip works, a tampered save
  clears the slot; each effect over many rolls (exp, coin and drop exact on a fixed monster, crit rate within a statistical band, crit damage by `rollDmgS` on forced crits);
  the caps; the forge merges three pendants; an old save without `eq.pendant` loads.
- `tools/dungeon-smoke.js`: the data row is sane (rooms inside the block, a path from the adit to the boss room, the boss's base level 30 and +10 per tier), the unlock
  rule, tier unlock by a clear at the highest unlocked tier, one pendant per clear, the first-clear choice, shards and the shop; in milestone B: two runs at the same
  coordinates do not see each other's monsters, players or events, and a wipe resets only its run.
- `boss-smoke.js` grows a ninth boss (its own moves, none shared); `client-smoke.js` checks the door panel, the inventory's pendant slot, the HUD timer and the
  lid mesh. To check the pendant effects can fail: break one hook, run, restore (the `start-smoke` method in `CLAUDE.md` section 6).

## 7. Open decisions for the owner (the default is what this plan assumed)

1. **"Base level 30"**: read as *the boss is level 30 at the lowest tier and +10 per tier above*, as the zone tiers work. If you meant *a level-30 dungeon with no tiers*, drop
   section 2.4, step 5 and the tier rows of section 4.4; the rest stands.
2. **Where**: Highmark's old workings in the Greyspine (level range 26-32 fits a level-30 boss). The alternative is the Rootdeep's first layer (30-35), which needs the golem
   to fall first and the world rectangle to grow; the framework is the same.
3. **Shared first, instanced later** (milestones A and B). If you want private runs from the start, step 6 moves before step 3 and the schedule grows by about a week.
4. **One pendant slot, one bonus per pendant.** Two slots (or a bonus plus a smaller second one) would let builds stack exp and crit, at the cost of every number above.
5. **A pendant per clear, kind random with a first-clear choice**, plus shards for a chosen kind. The alternative is to choose the kind at the door (no luck at all).
6. **Do dungeon tier points add to the symbol's +10% attack and health?** Default no.
7. **Does the drop pendant also raise the item-rarity roll, and does the coin pendant also raise quest coins?** Default no to both.
8. **Entry limits**: none (a clear takes 10 minutes and the loot is one pendant). A daily limit or a cost would make the dungeon a chore; add only if farming shows a problem.
9. **Group rule without a party system**: whoever stands at the door goes in together, up to 4. If you would rather build the party system first, it replaces section 2.2's rule.
10. **Lore**: the Blackseam is a placeholder name and the Foreman a placeholder boss; read `docs/STORY.md` Act IV before a single line of text is written.

## 8. Risks

- **Instancing is the real cost** (section 2.3): everything else is data, a boss kit and meshes the project has done before.
- **Interior terrain**: the heightmap is one surface (no overhangs), so a "cave" is a carved pit with a lid mesh; keep rooms to simple shapes, check the camera inside it and
  re-print its coordinates after any terrain change (the Greyspine's own history shows scans move).
- **Telegraph kinds for a ninth boss**: each needs an `addTele` and `endTele` look on the client (`game/combat/boss.js`) and a unique signature for `boss-smoke`.
- **Balance**: boss numbers, pendant numbers and the clear time are guesses until played.
- **Phone cost**: a carved interior with a lid and lamps must stay inside the budget in `CLAUDE.md` section 9 (a few hundred draw calls); build it from merged geometry.
