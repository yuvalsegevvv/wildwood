# Dungeons: design and setup plan

**Status: a design plus an inert code setup. No dungeon exists and nothing in the game calls the setup.** What is built: `src/shared/dungeons.js` (map tiles, the
seeded layout generator, the collision grid with line of sight and a flow field, the mission list, the party-size table; pure, loaded into both bundles, never
called) `tools/dungeons-smoke.js` (59 checks, ~2 s; `node tools/dungeons-smoke.js --show defense 7` draws a dungeon), and the data of **three dungeons** (one for each built land), their **three new bosses** and the **hourly offer** of two mission types, with the designs in `docs/DUNGEON-THEMES.md`. Everything else below is a plan.
Marked *(proposed)* = my suggestion, change it freely; the five rules in section 1 and the three changes of the second round (bigger rooms sized to a boss circle,
no Assassination mission, a boss instead of an extraction) are the owner's.

## 1. The five rules and what meets each

| # | The owner's rule | How it is met | Where |
|---|---|---|---|
| 1 | Randomized rooms from map tiles | A dungeon is a grid of hand-authored **tiles** (24 x 24 cells of 2 m = **48 m** a side, doors in the middle of each side; the round hall is the size of a boss arena). A seed picks the tiles, doors and which tile plays which role. The same `{mission, seed, theme}` rebuilds the same dungeon on the server and every client, so no layout is ever sent | section 3; built and tested |
| 2 | Goals like Warframe's defence, survival, sabotage, not "kill, unlock, boss" | Every mission is its own state machine over **objectives** (a ward stone, a lantern, heartroots, altars, a quarry, a captive). **No door is ever locked.** The boss is the **finale**, not the gate: when the objectives are done it appears and killing it clears the mission; there is no extraction. Seven missions are specified, four planned for the first release; a dungeon offers two of them at a time, changing every hour | section 4; the layout needs are built (`DG_MISSIONS`) |
| 3 | Up to 4 players | A **party** (new, generic: also the "group play" of `CLAUDE.md` section 10) of 1-4 starts a run; `DG_MAX_PARTY` = 4. A solo hiker is a party of one, so there is a single code path | section 5; the cap is built |
| 4 | Balanced for one player; harder with more (mob HP) | All numbers are solo numbers. Every monster that spawns, the boss included, gets health x `DG_PARTY.hp[n-1]` = 1 / 2.0 / 2.8 / 3.6. Checked: a party's fight with one monster lasts 1.09 / 1.11 / 1.18 times a solo fight, never shorter | section 5; built and tested (`dgParty`, `dgFightRatio`) |
| 5 | Everyone gets all the loot | One roll per drop (kill, cache, chest, the boss), **copied to every member**: no hitters-within-80-m rule, no splitting, no rolling | section 6; plan |

## 2. How a run goes

```
party (1-4, formed anywhere)  ->  walk to the dungeon's **door in the world** (section 8; `docs/DUNGEON-THEMES.md` section 6): the Delve board (the door's own dungeon, and one of the **two mission types it offers this hour**; its level is shown)
   ->  leader starts; each member accepts within 15 s and is teleported into the run's slot (a "tp" with the seed)
   ->  objectives (nothing locked)  ->  the boss appears in the round boss hall  ->  it dies: mission CLEARED
   ->  20 s results, everybody back at the door. Loot is banked the moment it drops, so leaving early (the portal in the entrance tile) keeps what you had
```
The run lives in the server's memory only. A restart ends all runs; nothing is lost that was not already saved (drops go into the saved gear when they drop).

## 3. Tiles and layouts: the "map tiles" system (built)

**Sizes (why 48 m).** All six boss arenas are **r = 20 m** (`ARENAS`), and the boss kits place their moves with `A.x`, `A.z`, `A.r` (a few reach past it: the Hoarfrost's
blizzard zone is `A.r + 8`). A boss hall is a **round room of exactly that radius** (`DG_BOSS_R` = 20, 40 m across), and a tile is 48 m so it fits with a 4 m rim of wall. The test
compares `DG_BOSS_R` with every arena in `ARENAS`, so if an arena ever changes, it says so. The other rooms follow the same scale: a junction 8 m, a room 24 m, a site 20 m, the
entrance and a cache 16 m. A dungeon is 4 x 4 tiles (192 m) to 6 x 6 (288 m), 8 to 16 tiles used.

**A tile** is an ASCII picture: 24 strings of 24 characters, one character a 2 m cell. `#` wall, `.` floor, and markers that are floor too: `S` a monster mouth (where waves
and packs appear), `O` an objective, `C` a cache, `P` the portal / entrance, `B` the middle of a boss hall (where the boss appears). A theme may add more characters
(torches, props: the client builder reads them, the server ignores them; extend the allowed set in the smoke test when you do). This is the generated `hall-cross`; an author
writes any picture:

```
###########..###########     doors: N E S W bits 1 2 4 8 (a tile's `doors` mask). A door is always the middle two cells
###########..###########     of a side (4 m wide); every other rim cell is wall, so any two tiles with matching doors fit.
#########......#########     The test checks every tile in every turn: the art's openings equal the mask.
#######..........#######     Rotation is free: dgVariants makes all four quarter turns (identical ones kept once).
#####..............#####     {id, doors, tags:['hall'], w: weight, art}
####.S............S.####
####................####     The circle is the boss arena: open floor out to 20 m except four pillars for cover
###....##.......##...###     (16 cells), S = where waves come in, B = where the boss appears.
###....##.......##...###
##....................##
##....................##
........................
............B...........
##....................##
##....................##
###..................###
###....##.......##...###
####...##.......##..####
####.S............S.####
#####..............#####
#######..........#######
#########......#########
###########..###########
###########..###########
```

**Roles** are tile tags: `start` (a dead end with the portal), `hall` (the round boss hall: in a mission it is the **boss hall**, role `boss`, and exactly one exists per dungeon;
in Defense and Survival it is also where the stone / lantern stands), `site` (a room with an objective, any door shape), `cache` (a dead end with chests), `room` and `pass`
(fillers). A mission names the roles it needs (`DG_MISSIONS.<m>.roles`, `as` is the name the cell goes by).

**The generator** (`dgLayout({mission, seed, set})`, deterministic): 1) the entrance cell on the rim of a `grid`, with exactly one door; 2) grow a tree from it (60%
extend the newest tile, 40% branch from any), until the mission's tile count; 3) add loops between neighbouring tiles (a share `loops`: loops give Survival and Hunt
room to run); 4) place roles on the cells that suit them (`pick`: `far` = furthest from the entrance, `hub` = best connected, `spread` = far from each other, `min` =
never closer than that many tiles to the entrance or to another cell of the same role); 5) fill the rest with plain tiles whose doors match, dead ends becoming caches by
chance. If a role finds no cell whose doors fit a tile of that tag, the try is thrown away (80 tries, then `null`: the caller takes the next seed; on 300 seeds of every
mission none failed, and the hardest, sabotage and siege, took 2.4 tries on average). A sabotage dungeon (`--show sabotage 4`; S entrance, B boss hall, o site, c cache, r room, + pass):

```
[B]-[o]-[r]-[+] [c]
             |   |
            [r] [o]-[r]
             |       |
        [o]-[+]-[+]-[r]
                     |
                    [+]
                     |
                    [S]
```

**The bake** (`dgBake`) turns a layout into one cell grid (`B.cells`, 1 = floor) in metres from the grid's north-west corner, with every marker's position, and **`B.boss`**:
the boss hall's circle as `{x, z, r}`, shaped exactly like an arena so the existing boss code can take it as `A`. Both sides use the same four functions: `dgSolid` / `dgFree` /
`dgSlide` (collision: a wall or anything outside is solid, a walker of radius r is free where its four corners are, sliding tries the whole move then each axis), `dgLos` (line
of sight, for aggro, melee through walls, projectiles), and the monsters' way round walls:

**Walking round walls.** World monsters walk in a straight line (`server/monsters.js`: chase `p.x,p.z`; the only obstacle tests are the water line, the village and the tunnel), which a wall defeats.
`dgFlow(B,x,z)` is a breadth-first field of steps to a target from every floor cell (8 ways, no corner cutting), made once per target when the target changes
cell (at most 4 per run; **0.44 ms** on the biggest dungeon, 6 x 6 tiles); `dgStep` reads it. Monsters use it when they have no line of sight and walk straight when they do.
Tested: walkers from 900 random starts in 30 dungeons all arrive.

**Known limit: big monsters.** A walker steers by cell centres, so in 4 m doors it is good up to radius ~0.9 m. By the defs, **48 of the 58 monster kinds fit; 10 do
not** (the treants 1.0-1.7 m, goldkabuto, crawler, alphawolf) and **all 6 bosses are 1.0-2.1 m**. Bosses are no problem: they stay in their hall, which is their own arena. For a theme with big monsters: a per-set **door width** (4 or 6 cells; every tile of a set shares it) and a clearance-aware `dgFlow(B,x,z,radius)` that
only crosses cells with that much room. It is a small change but it is **not built**; do it when the first theme with treants is chosen (milestone M2).

Other limits to know: no height (the floor is flat, `y` 0; stairs would be a second layer later); walls are drawn from the grid by the client (merged runs of wall cells, one mesh), props from markers.

**Themes** (built as data, `DG_THEMES.<id>`): `{name, land, at, lv, mobs:{walkers, guardians}, boss, music, pal:{wall,floor,fog,light}, tiles, art}`. Three exist (`docs/DUNGEON-THEMES.md`): one
for each of Wildwood, the Sakura Vale and the Hoarfrost Reach, level 30 at their land's base difficulty (`DG_LV`; +10 a tier above it), with the bare tile set until the art is drawn (`art:false`); `bare` itself is the test set, flagged `dev:true`
so a board never lists it. A new dungeon = a tile set + a roster + a palette and music + the boss (section 4). Nothing else. **Walkers and guardians**: the doors are 4 m, so a theme's *walkers*
(radius <= 0.9 m, tested) make the waves and walk the dungeon, and its *guardians* (the big kinds) stay in their room; that is how the 10 kinds over the limit still appear, with the wide-door work postponed.

## 4. Missions *(proposed; the roles each needs are built)*

Warframe's missions lean on movement and stealth; Wildwood has three classes, no parkour and monsters with simple aggro. So the missions keep Warframe's *shapes*
(hold a point, run a clock, destroy things, chase a target, escort) and drop its stealth and traversal. **No door is locked in any of them**; the whole dungeon is open
from the first second and the map itself (loops, dead ends, rooms) is the terrain you fight on.

**Every mission ends the same way: the boss.** There is no extraction step. When a mission's objectives are done, **the boss appears in the boss hall** (a roar, a marker on the
map, a toast to the run) and **killing it clears the mission**. Details:
- The boss hall is in every dungeon from the start, **empty until then** (not locked: you can walk in). In Defense and Survival the hub hall *is* the boss hall, so the last stand is
  where you have been fighting; in the others it is the farthest tile from the entrance (the test checks it).
- **Which boss**: each dungeon has its own, designed (`docs/DUNGEON-THEMES.md` section 4: Amanita, Gawataro, Haugbui; the type of mission changes the road to the boss, not the boss). They are built from the same pieces as the six
  world bosses and the hall is the same circle (r = 20 m), so their kits use `A.x`, `A.z`, `A.r` as the old ones do, and `defAt(def, L)` levels them (the zone tiers do the same at +10 / +20 / +30); the six world bosses would
  also work in a hall unchanged. It engages when a player steps into the circle, uses the same engage / phases (60% / 30%) / reset as the world bosses, and its health is x `DG_PARTY.hp[n-1]` like every monster.
- Lose = the mission's own lose condition below, or everyone down. **Leaving early** (the portal in the entrance tile, any time) is not an ending: you keep the loot you have, there is no clear.

| Mission (Warframe's) | Objectives (the boss appears when they are done) | Lose | Layout it asks for | What makes it its own |
|---|---|---|---|---|
| **Purge** (Exterminate) | kill N (scales with tiles) | all down | the boss hall, far | every room starts with a pack; a patrol; the baseline and the test bed: **build first** |
| **Defense** ("Hold the Ward Stone") | survive 2 rotations of 3 waves; a reward chest at the end of each | the stone's health reaches 0, or all down | the boss hall as the **hub** (3-4 doors) with the stone in it | waves come from mouths in the rooms 2 tiles out and walk in through the doors; some mobs ("breakers") ignore you and go for the stone; the stone heals a little between waves; the boss comes into the same hall, the stone still stands |
| **Survival** ("The Long Night") | stay alive to the 5:00 and 10:00 marks, a reward chest at each | the dark: at 0 light everyone takes 4% max health a second until it is relit; all down | the boss hall as the hub, many **loops** | a lantern's light is the clock (starts 120 s, drains 1 s/s); every kill feeds it (+2 s, elites +10), flasks drop (+30 s); spawns thicken with time; at 10:00 the lantern is topped up and stops draining |
| **Sabotage** ("The Heartroots") | destroy 3 heartroots | all down | 3 `site` rooms **>= 3 tiles apart** (and from the entrance), the boss hall far | each root is shielded until its warden pack is dead; the boss is the one that guarded them |
| **Siege** (Mobile Defense) | channel 3 altars, one after another, 60 s each | all down | 3 spread sites, the boss hall far | the altar fills only while someone stands in its circle; waves hit that room; the next altar is revealed on the map; the last one wakes the boss |
| **Hunt** (Capture) | kill the quarry | all down, or 10 minutes for the quarry | **loops** (it must be able to circle) and dead ends (to corner it), the boss hall far | an elusive elite: pings on the map every 30 s (+-1 tile), bolts to the far side of the map when a player gets within 18 m in sight; after 3 bolts it is winded and slow; its death calls the boss |
| **Escort** (Rescue) | free the captive (5 s channel, six jailers) and **lead them to the boss hall** | the captive dies | a far `site`, the boss hall far from it | the captive follows the nearest player along the flow field at 90% speed; monsters pick the captive 30% of the time; stepping into the circle with them wakes the boss, and it must not kill them |
| later: **Vault** (Spy: rune puzzles in side rooms), **Interception** (hold 4 points), **Dig** (channel rich ore / log / herb nodes; ties in the professions) |

**Build order inside the set:** Purge (harness) -> Defense -> Survival -> Sabotage -> Siege -> Hunt -> Escort -> the later ones.

**The mission engine** copies the boss idiom (`BOSS_KITS.<kit> = {start, tick, phase}` over primitives, `server/boss-fx.js`): `DG_KITS.<mission> = {setup(run), tick(run,dt),
onKill(run,m), onUse(run,p,obj), onDown(run,p)}` in `server/dungeon-kits.js`, built over primitives in `server/dungeon-fx.js`: `spawnPackS(run, mouth, group)` (a pack at a mouth,
with party-size health), `objS(run, kind, x, z, hp)` (an objective with health and a state, shown to the clients), `channelS(run, p, obj, seconds)` (**reuses the cast
bar of professions**: `p.cast`, `cast` / `castx` events, `updateCastsS`), `timerS`, `wavesS`, and **`bossS(run)`**, the finale that every kit calls when its objectives are done
(makes the theme's boss on `B.boss`, see section 7). A run's phase is `objectives` -> `boss` -> `won` / `lost`. What the client's HUD shows is one compact tuple per snapshot to the
run's members, `dg:[phase, seconds, a, b, c]`, whose meaning each kit documents (like a boss's `aux`); objectives travel as events (`dgo` create / update / remove) and the boss's
appearance as `dgb` (its place, for the marker).

## 5. Parties and difficulty

**The party is a new, generic layer** *(proposed, milestone M1, useful without dungeons: it is "group play" in `CLAUDE.md` section 10)*: `party{a:'invite'|'accept'|'decline'|
'leave'|'kick'|'lead', name}`, at most 4, a leader, in memory only (not saved), the roster pushed as a `pty` event; a party frame under your bars with the others'
health, invite from chat (`/invite name`) or by tapping a name tag, party members drawn on the map. A run starts from a party (a solo hiker is one).

**Health with the head count** (`DG_PARTY`, `dgParty(n)`): the numbers of a mission are solo numbers; at the moment a monster spawns (the boss too) its health is multiplied by the head
count then: **x1 / x2.0 / x2.8 / x3.6**. Why those: assume each extra player loses 8% of their damage to overkill, being out of reach and downed time (`DG_TEAM_LOSS`);
the team's damage is then n x (1 - 0.08 (n-1)) = 1 / 1.84 / 2.52 / 3.04 solos, so a fight with one monster lasts 2.0/1.84 = **1.09**, 1.11, **1.18** times a solo fight. The
rule the test enforces: **between 1.0 and 1.3**: never faster than one hiker (a party is *harder*, as asked), never a slog. Each player's XP per minute is about 1/ratio of a
solo's (92% / 90% / 85%): parties are for company, safety (revives) and the all-loot rule, not for faster levelling.
- Scaled at **spawn** by the head count in the run *then*: if someone leaves, new spawns get easier, those already out keep their health. Damage a monster deals is **not** scaled.
- Two more knobs exist in the table, **off or mild by default**: `count` (bigger packs; all 1: "health only", as asked; if 4 hiker waves feel empty set 1 / 1.2 / 1.4 / 1.6, but
  that makes a 4-party wave fight ~1.9x a solo wave, so lower `hp` with it) and `obj` (a defence stone's health 1 / 1.1 / 1.2 / 1.3: fights last longer, so it takes longer hits).
- Timers (survival, siege channels, the hunt's limit) are **not** scaled: they are time, not numbers.
- Level: a node has a level L, **30 at its land's base difficulty for all three for now** (`DG_LV`), +10 a tier above the base (`dgLevel`); monsters and the boss are the defs at L (`defAt(d, L)`, the same function the zone tiers use), your symbol bonus applies as everywhere. Entry needs
  level >= L - 5 (`DG_ENTRY_GAP`), i.e. 25 at the base. **The difficulty is the land's own zone-tier setting** (`gear.zt[land].on`, +N, picked in a village): Wildwood's base is +1 (its dungeons are locked at +0), the Vale's and the Reach's +0. A party plays at the **leader's** tier for the land; members need that tier unlocked (`max`) and the level. Missions have fixed lengths (no endless mode), so the level never rises inside a run and the steep XP-for-level curve (`CLAUDE.md` section 9) is not in play.
- **Joining mid-run** *(proposed)*: a party member may join an open run with a free slot **until the boss has appeared**. A disconnected member's place is held 5 minutes by account
  (`run.members[acct]`) and they re-enter at the entrance.
- **Down and revive** *(proposed)*: at 0 health you are **downed** (the server uses the existing `p.dead`, so you cannot act), for 30 s; a teammate within 2.5 m who channels 3 s
  (the same cast bar) revives you at 35%. Bleed out and you use one of your **2 respawns** a run and return at the entrance. No respawns and nobody to revive: you are out
  (what you looted stays). All down at once, or the lone hiker out of respawns: the run is lost. The world's "wake in the village after 3 s" (`updatePlayersS`) does not apply.

## 6. Loot: everyone gets all of it

One **drop event** (a kill, a cache, a chest, the boss) is **rolled once** and granted to **every member of the run** through the same functions the
world uses (`addItemP`, `addMatP`, coins, `gainExpP`), so the toasts and saves are unchanged. It is the opposite of the world's rule, where `killMonsterS` pays only those who
hit the monster within the last 30 s and 80 m, and `rewardKill` gives each of them their **own** roll (`rollMonsterRarity()` per player). In a run it is: **all members, alive,
downed or far away**, the item the same for all. Per-player modifiers still apply per player (their Fortune passive's count, their XP passive).
- *The alternative reading is independent rolls for each player (everybody gets the same amount, not the same items). The same roll is simpler, avoids envy and is what "all the
  loot" says; it is a one-line switch.*
- **Sources** *(proposed)*: kills (as the world, at the run's level); **caches** (1-2 chests in each `cache` dead end: an item of the level's gear tier with the rarity table shifted one
  step up, coins x5, 3 x the theme's materials); **chests at Defense's rotation ends and Survival's marks** (two items on the boss rarity table, rising each time); **the boss**,
  which ends the mission: the boss rarity table (`rollBossRarity`), `coinsFor(L) x 20` like any boss, and its skill drops if it is one of the six (the 10% per skill rule).
  **The clear's own reward** is designed (`docs/DUNGEON-THEMES.md` section 7, `shared/dungeon-rewards.js`): one random level-30 item for the whole run, **weapons** from Wildwood's dungeon, **armour** from the Vale's, a **ring** from the Reach's, rarity 70 / 25 / 4 / 0.8 / 0.2%, rolled once by `dgClearReward` when the boss falls
  and handed to every member present at the kill. Those pieces can be enhanced with the **Tempering Stone**, which normal monsters of level 30 and above drop instead of equipment (`rewardKill`: `dgDropKind`), so the dungeons' own kills feed it.
- **Costs to know**: the same item reaches 4 bags, so a 4-party makes **4 times the gear** for the same objective (there is no trading yet, so it does not touch an economy, but
  it feeds the forge: three identical items merge up a rarity); and **a full bag loses the item** (`addItemP`: "Your bag is full", 240 slots): a run drops many, so a
  *proposed* fix is an overflow "run stash" that holds items until the player is next in a village.
- Counting kills toward quests and the main quest: *(proposed: dungeon kills count for quest-board hunts of the same monster, never for the main quest)*; owner's call.

## 7. How it fits the server (the hard part)

The server has **one world**: one `S`, one `MONS` list, one event queue flushed to **everyone**, one heightmap, and the main loop calls `updateMonstersS` over all of it.
There is no instance concept. Two designs were weighed:
- **A second `createWorldServer` per run**: clean isolation, but players, saves, accounts, chat and the socket all live inside one, so a player cannot move between the world and a run.
- **A run is a far-away slot inside the same world (chosen)**: each run gets a slot of coordinates **outside the walkable rectangle** (`WX1` = 990, so slots start a few km
  east: planned constants `DG_X0` = `WX1` + 1500, one slot per 600 m, 4 across, at most 16 runs `DG_MAX_INST`; 600 m is more than the largest snapshot radius `SNAP_PLAYERS` 250 + a
  dungeon's 288 m (the biggest grid is 6 x 6 tiles), so runs never see each other by distance). Existing combat, projectile, hit-test and AI code work unchanged because they work in x,z.
  The same machinery is what **the Rootdeep** needs (`docs/WORLD.md` section 8: "its own kind of space... a portal... like a separate instance"): build it once.

What has to become instance-aware (each row is a place that is global today):

| File | Today | Change |
|---|---|---|
| `server/state.js` `ev()` | one `EVQ`, sent to everyone by `broadcastSnap` | tag each event with the run of whoever caused it (`S.ctx`, set by `receive` from `p.inst` and by the run's own update); a player is sent only events of his own run (0 = the world) |
| `server/api.js` `broadcastSnap` | `b` (all bosses), `pl` (all players every 10th snapshot), `n`, `ev` for everyone | `b`, `pl`, `ev` per run; `n` stays the head count |
| `server/api.js` `join` | sends the roster of **every** `MONS` | skip `m.inst`; a run's monsters reach its members by `spawn` events and one `mons` message on entry |
| `server/api.js` `setPos` | clamps x,z to `WX0..WX1`, tunnel and ice-wall rules | in a run: clamp to the run's grid and refuse a position inside a wall (`dgSolid`) |
| `server/world.js` `getH` | the world heightmap, clamped at its edges | `x >= DG_X0 - 100` returns the run's floor |
| `server/monsters.js` camp placement | the seeded camp loop | a camp keeps 32 m off every door (`dgEntranceNear`; a no-op for today's camps, so nothing moves, but a new camp cannot be placed on a door) |
| `server/monsters.js` `updateMonstersS` | camp leash (32 m), straight chase, respawn timers, `getH < 0.4` as the only obstacle | skip `m.inst` here; a run's monsters use `dgStep` / `dgLos`, no leash, no respawn (`temp` already removes them 1.2 s after death) |
| `server/combat.js` | melee and area hits test distance only; projectile segments pass walls; `killMonsterS` pays hitters near | `dgLos` on hits and projectile segments inside a run; `m.inst` kills call `rewardAllS(run, ...)` (section 6) |
| `server/tiers.js` `monK` | `monTierOf` -> `landAt(m.camp)`: **`inVale` is just `x > HALF`, so a slot east of the world reads as the Sakura Vale (or the Reach, by z) and would apply the player's *zone tier* of that land to dungeon monsters** | `monK` returns the run's own multipliers when `m.inst`: its level, and party health folded into `m.maxHp` |
| `server/players.js` `hurtP`, `updatePlayersS` | death -> wake at a village gate after 3 s | in a run: downed / revive / respawns (section 5) |
| `server/boss.js` | `BOSSES` are singletons made at start, one in each fixed arena; `bossState()` goes to all | the run's boss is made **on demand** (`bossS`) by the same code as `initBossS`, with `A = B.boss` from the bake: `{x,z,r}` with r = 20 like every arena, so the six existing kits work unchanged (they only read `A.x`, `A.z`, `A.r`; a move that reaches past the circle, like the blizzard's `A.r + 8`, is cut by the walls); its death ends the run as won (`bossDefeatedS`); `bossState` per run; `toastTo(null,...)` ("X awakens!") scoped to the run |
| `server/economy.js` `sanitizeGear` | no dungeon field | `gear.dg` (section 8) |
| Shared (room) mode | `io.broadcastSnaps`: **one 4 KB message for everyone** | runs cannot be isolated: **dungeons are Solo and Node server only** (a Shared host refuses to start one) |
| new | | `server/party.js`, `server/dungeons.js` (slots, lifecycle, lobby, the per-tick update), `server/dungeon-kits.js`, `server/dungeon-fx.js`; `updateInstsS(dt)` in `tick` |

Position is not saved (`recordOf`: name, look, level, exp, gear), so a player who disconnects inside a run comes back at the village spawn: no cleanup needed beyond leaving the run.

**Client** (`game/dungeon/`, new): the run is built **in the same scene at the slot's coordinates** (one `scene`; every monster, remote player and effect already `scene.add`s into
it, so they work unchanged). Entering (`tp` with the run's seed) builds the meshes from `dgBake` (floor, merged wall runs, props from markers: small and few draw calls,
cheaper than the forest on a phone), then switches **sky dome, fog, lights (sun and its shadow off, a few torch lights), weather, ambience and music** to the dungeon's, and stops the
chunk streaming (`Stream`, `genChunk` are skipped while `P.inst`). Also: `worldBounds` and `getH` (client) use `dgSolid` / the floor; **the third-person camera must collide with
walls** (corridors are 4 m wide; `updateCamera` has a wall clamp only inside the tunnel, so a boom test against `dgSolid` is new); the minimap draws the dungeon with explored tiles; a
party frame, the objective HUD (the `dg` tuple), the boss bar (the existing one: the run's boss is a boss to the client too), the results panel. Test: `client-smoke` grows a dungeon case (build, walk, a wall stops you).

## 8. Saves and unlocks *(proposed)*

`gear.dg = {clear:{'<theme>:<mission>': n}, best:{'<theme>:<mission>': score}}` (and, from the rewards: `gear.temper`, the stones, 0 to 9,999, and `gear.eq.ring`; the enhancement lives in the item id, `sword7-e+3`), sanitized in `sanitizeGear` like every `gear` field (unknown keys dropped, counts clamped, an old save gets `{}`);
a clear is counted when the boss falls.
Unlocks (`dgUnlocked`, built and tested): a dungeon opens by its land's gate: **Wildwood's only at +1 difficulty or above** (locked while Wildwood is set to +0; the base level 30 is at +1), the Vale's once Hanami is walked into (`gear.east` 2, level 30 at +0), the Reach's once Rimehold is (`gear.north` 2, level 30 at +0: the flags the circles use), and from the dungeon's level less 5 (25 at the base). **Which mission types a dungeon offers rotates every hour** (`dgOffer`: two types of the seven, random but fair, the same for everyone; the leader picks one when starting; `docs/DUNGEON-THEMES.md` section 2). There is no gating by clears (a random offer
cannot unlock a chain). The **Delve board** lists the three dungeons with their locks, each with the two types on offer, its level at the tier you play and a countdown; the board opens at a **door in the world**, not in a village: three doors (the Hollowed Elder in the Ancient Grove, the Falls Door at Jade Falls, the Barrow Door at the Bonefrost Barrow;
`DG_ENTRANCES`, `docs/DUNGEON-THEMES.md` section 6), each a structure like the teleport circle (`buildCircle`), opened with the talk key within `DG_ENT_TALK` (4.5 m) of it, with a signpost on the nearest road and a marker on the map. Wildwood's door stands visibly sealed while Wildwood is at +0 (`dgGateOpen`).

## 9. Protocol additions *(proposed)*

In: `party{a,name}`, `dg{a:'open'|'start'|'accept'|'leave'|'use'|'revive', dungeon?, type?, id?}` (`open` only works within `DG_ENT_TALK` of a door, and opens that door's dungeon: `dgEntranceNear`; `type` must be one of the two on offer this hour, else the server answers that the offer changed). Out: events `pty` (roster, leader), `dgi` (invite / join prompt), `dgo` (an objective:
create, update, remove), `dgb` (the boss has appeared: its place), `dge` (the end: cleared or lost, and what you got); the snapshot field `dg` (the mission's HUD tuple, to the run's members only);
`tp` carries `{dg:{m,seed,th,L,ox,oz}}`. All small; none passes a 4 KB message.

## 10. Testing plan

Built: `tools/dungeons-smoke.js` (tiles, the boss circle against `ARENAS`, layouts, grid, flow, party table; checked by breaking the generator and watching it fail). To come, each with its milestone: `party-smoke`
(invite, accept, leave, caps); `dungeon-server-smoke` (two runs isolated: events and snapshots of one never reach the other; a monster reaches a player round a wall; every member
gets every drop; party health at spawn; downed and revive; the zone-tier trap above; a Shared host refuses), the mission kits (`boss-smoke` style: each mission won, through its
boss, and lost, headlessly), and `client-smoke` (build, collide, camera).

## 11. Build order

| | Step | Size | Test |
|---|---|---|---|
| M0 | this: design, tiles, round boss hall, generator, grid, flow, party table | done | `dungeons-smoke` |
| M1 | Party (messages, frame, invite) | S-M | `party-smoke` |
| M2 | Runs: slots, tagged events, per-run snapshots, floor and clamp, flow AI, all-members loot, downed / revive, the client dungeon view and camera; entered from a Testing-tools button (no gate yet); wide doors + clearance flow if the theme needs them | **L** | `dungeon-server-smoke`, `client-smoke` |
| M3 | Mission engine and primitives, Purge, Defense, the objective HUD, **the boss finale** (`bossS`: a boss made on demand in the boss hall, its death = cleared; tested with the six existing bosses) | M-L | mission smoke |
| M4 | Survival, Sabotage | M | mission smoke |
| M5 | Delve board (the hourly offer with its countdown, opened at the three doors), the three entrances (door meshes, signposts on the roads, map markers: sites found and tested in `DG_ENTRANCES`), `gear.dg`, rewards (caches, chests, results panel) | M | smoke + client |
| M6 | **The three dungeons**: the tile art of one design at a time (`docs/DUNGEON-THEMES.md` lists the tiles to draw) and its boss kit with the small primitives it needs (`needs` in `DG_BOSSES`) | L each | boss smoke |
| M6r | **Rewards** (`docs/DUNGEON-THEMES.md` section 7): the 490 level-30 ids in `ITEM`, the ring slot and its attack in `recalcP` (a soul change must recalc), the stone in `rewardKill`, the forge's Temper tab, then `dgClearReward` at a clear. All but the last work without a dungeon (the Reach's own level-30 monsters would drop stones the day it ships), so they can be built first | M | `dungeons-smoke` (the rules, built), a rewards smoke on the server |
| M7 | Siege, Hunt, Escort; later Vault, Interception, Dig; the Rootdeep as the second user | M each | |

## 12. First-guess numbers (not playtested)

Party health 1 / 2.0 / 2.8 / 3.6, team loss 8%; counts 1; stone health x1.1 per extra hiker; down 30 s, revive 3 s at 35%, 2 respawns; survival: marks at 5:00 and 10:00, 120 s start, +2 s a kill,
+10 elite, +30 flask, 4% a second in the dark; Defense: 3 waves a rotation, 2 rotations, `6 + 2 x rotation + 2 x wave` monsters a wave, at most 40 alive (60 a run); siege channel 60 s; hunt:
ping 30 s, bolt at 18 m, 3 bolts, 10 minutes; escort: 5 s free, 90% speed; max runs 16, an empty run closes after 60 s, a left party member's place held 5 minutes; entry level L - 5.
Sizes: tile 48 m, boss hall r = 20 m (the arenas'), junction 8 m, room 24 m, site 20 m, entrance and cache 16 m, doors 4 m; grids 4 x 4 (purge, defense, survival, hunt, escort: 8-12 tiles)
and 6 x 6 (sabotage, siege: 12-16 tiles).

## 13. Decisions for the owner (what I assumed)

1. **Loot**: the same roll copied to everyone *(assumed)* vs independent rolls. Overflow stash for full bags *(assumed yes)*.
2. **Death**: downed + teammate revive + 2 respawns *(assumed)* vs. plain "wake at the entrance".
3. **Party health table** 1 / 2.0 / 2.8 / 3.6, and whether monster *counts* may also grow *(assumed no)*.
4. **Shared (room) mode**: no dungeons *(assumed, forced by its single shared message)*.
5. **Quest credit** for dungeon kills *(assumed: hunts yes, main quest no)*.
6. **Entry**: through the dungeon's own door in the world (not a village gate) and level >= L - 5 *(assumed)*; unlocks as in section 8.
7. **Leaving early** through the entrance portal stays possible and keeps the loot, without a clear *(assumed; a disconnect or a restart needs it anyway)*. Joining in progress until the boss has appeared, and reconnecting, as in section 5 *(assumed)*.
8. **Bosses**: each theme names its boss; the six existing ones fit the hall and level with `defAt` *(assumed)*, a new boss is a new def + kit. Whether the boss may also be a *wave* boss in Defense *(assumed no: one boss, at the end)*.
9. **The three dungeons and their bosses** are designed (`docs/DUNGEON-THEMES.md`): which dungeon for each land (my picks, six spares), the hourly offer (all seven types, a 21-hour cycle, UTC), the three bosses (names, looks, moves), whether big monsters should roam (then the wide-door work comes first) and the rewards (not designed: kills pay the world's rewards at the dungeon's level until then).
10. **Difficulty** (clarified by the owner): Wildwood's dungeons are locked at +0 and level 30 at +1, the other lands' are level 30 at +0; above the base I assumed +10 levels a tier, and entry at the dungeon's level less 5.
11. **Entrances** (asked by the owner): one door per dungeon, in its land, found on the real terrain (`DG_ENTRANCES`, `docs/dungeon-entrances.png`, `docs/DUNGEON-THEMES.md` section 6); no village gate, no terrain change, no new road, a camp keeps 32 m off a door; Wildwood's door is shown sealed at +0 *(assumed)*.
12. **Rewards** (the owner's rules, my numbers): see `docs/DUNGEON-THEMES.md` section 8, decisions 8-10: the same item for the whole party, +5% a step and n stones for the step to +n, one ring slot, the stone dropping at the level you fight at (zone tiers farm it), bosses unchanged, merging only +0 pieces.
