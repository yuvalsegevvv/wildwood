# Dungeons: design and setup plan

**Status: the server side of parties and runs is built (M1 + M2 server, and the boss finale of M3): `server/party.js`, `server/dungeons/` (slots, isolation, the run lifecycle, the walker AI, loot for all, down / revive, the Purge kit, the boss in the round hall), `shared/dungeon-slots.js`, tested by `tools/party-smoke.js` (22 checks) and `tools/dungeon-runs-smoke.js` (80 checks), entered with the testing tool `dev{cmd:'dg'}` or at a door.** The client side of the **Delve board** is built (`game/dungeon/board.js`, `tools/dungeon-board-client-smoke.js`, 37 checks); the **client of a run and of the party** is built too (`game/dungeon/` run.js, view.js, look.js, collide.js, party.js, hud.js, minimap.js: the dungeon built at its slot, its look, walls and camera, the party frame and invites, the run HUD, objectives, the results, the maps; `tools/dungeon-client-smoke.js`, 44 checks, and a dungeon case in `tools/client-smoke.js`), and the seven mission kits are built (section 4). Also built: `src/shared/dungeons.js` (map tiles, the seeded layout generator, the collision grid with line of sight and a flow field, the mission list, the party-size table; pure, both bundles), `tools/dungeons-smoke.js` (`--show defense 7` draws a dungeon), and the data of **three dungeons** (one for each built land), their **three new bosses** and the **hourly offer** of two mission types, with the designs in `docs/DUNGEON-THEMES.md`.
Marked *(proposed)* = my suggestion, change it freely; the five rules in section 1 and the three changes of the second round (bigger rooms sized to a boss circle,
no Assassination mission, a boss instead of an extraction) are the owner's.

## 1. The five rules and what meets each

| # | The owner's rule | How it is met | Where |
|---|---|---|---|
| 1 | Randomized rooms from map tiles | A dungeon is a grid of hand-authored **tiles** (24 x 24 cells of 2 m = **48 m** a side, doors in the middle of each side; the round hall is the size of a boss arena). A seed picks the tiles, doors and which tile plays which role. The same `{mission, seed, theme}` rebuilds the same dungeon on the server and every client, so no layout is ever sent | section 3; built and tested |
| 2 | Goals like Warframe's defence, survival, sabotage, not "kill, unlock, boss" | Every mission is its own state machine over **objectives** (a ward stone, a lantern, heartroots, altars, a quarry, a captive). **No door is ever locked.** The boss is the **finale**, not the gate: when the objectives are done it appears and killing it clears the mission; there is no extraction. Seven missions are specified, four planned for the first release; a dungeon offers two of them at a time, changing every hour | section 4; the layout needs are built (`DG_MISSIONS`) |
| 3 | Up to 4 players | A **party** (new, generic: also the "group play" of `CLAUDE.md` section 10) of 1-4 starts a run; `DG_MAX_PARTY` = 4. A solo hiker is a party of one, so there is a single code path | section 5; built (`server/party.js`, runs) |
| 4 | Balanced for one player; harder with more (mob HP) | All numbers are solo numbers. Every monster that spawns, the boss included, gets health x `DG_PARTY.hp[n-1]` = 1 / 2.0 / 2.8 / 3.6. Checked: a party's fight with one monster lasts 1.09 / 1.11 / 1.18 times a solo fight, never shorter | section 5; built and tested (`dgParty`, `dgFightRatio`) |
| 5 | Everyone gets all the loot | One roll per drop (kill, cache, chest, the boss), **copied to every member**: no hitters-within-80-m rule, no splitting, no rolling | section 6; built (`rewardAllS`) |

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
for each of Wildwood, the Sakura Vale and the Hoarfrost Reach, level 30 at their land's base difficulty (`DG_LV`; +10 a tier above it), each with its own tile kit and legend (`art:true`; one file each in `shared/dungeons/themes/`, entered through `defineDungeonTheme`: `docs/DUNGEON-THEMES.md` section 3); `bare` itself is the test set, flagged `dev:true`
so a board never lists it. A new dungeon = a tile set + a roster + a palette and music + the boss (section 4). Nothing else. **Walkers and guardians**: the doors are 4 m, so a theme's *walkers*
(radius <= 0.9 m, tested) make the waves and walk the dungeon, and its *guardians* (the big kinds) stay in their room; that is how the 10 kinds over the limit still appear, with the wide-door work postponed.

## 4. Missions *(built: all seven kits in `server/dungeons/kits/`, on the shared moves of `server/dungeons/fx.js`; the themes' hazards `server/dungeons/hazards.js`; the HUD text `shared/dungeon-hud.js`; test `tools/dungeon-missions-smoke.js`)*

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

**Build order inside the set:** Purge (harness) -> Defense -> Survival -> Sabotage -> Siege -> Hunt -> Escort -> the later ones. **All seven are built**; the later ones are not.

**As built** (each kit's file has its full numbers, its `run.k` and its HUD tuple in the agent map; only what the table above leaves open or what differs is here):

| Kit | HUD numbers (`dg[3]...`) | Choices and numbers beyond the table |
|---|---|---|
| Purge | killed, needed | unchanged (the foundation's) |
| Defense | rotation 1-2, wave 1-3, stone %, left in the wave, seconds to the next wave | `6 + 2 x rotation + 2 x wave` counts rotation and wave **from 0** (6 8 10, 8 10 12: 54 a run, inside the doc's 60); a quarter of each wave (at least 1) are breakers; an elite in each rotation's last wave; groups of up to 3 every 1.5 s; breaks 12 s / 8 s / 20 s after a rotation; the stone = 80 swings of the theme's average walker x `DG_PARTY.obj`, 6 m south of the boss's spot, +5% after each wave; it still loses the run in the boss phase |
| Survival | light seconds, marks 0-2 | light capped at 300 s (the doc names no cap); a flask from 10% of kills (every elite), +30 s, picked up by walking within 1.8 m, gone after 40 s; a group of 2 + 1 per 2:30 (at most 5) every max(2.5, 8 - t/100) s, an elite every 60 s; the dark is 4% of max health a second **without armour** (`dgHurtPctS`); at 10:00 the spawning stops too |
| Sabotage | broken, 3, unshielded | a root's pack: 4 walkers and the site's guardian (the Ancient Treant at the Heartwood Knot's post) or an elite walker; breaking = `dg{a:'use'}` once unshielded, a **2 s channel**; packs of 1-2 at 40% of the other mouths, the room guardians |
| Siege | altar 1-3, fill %, someone in the circle | circle 5 m; altars in order of distance from the entrance; empty, the fill **decays at a third of the rate but never below the last quarter reached** (25 / 50 / 75%); once stepped in, 3 walkers (4 for altars 2-3) every 12 s from its room's and the next rooms' mouths, an elite every second wave |
| Hunt | sightings, bolts 0-3, seconds left | the quarry is the dungeon's skin (Shroomling, Karasu Tengu, Barrow Wight) as an elite, set at the free cell farthest from the entrance; a sighting = the middle of a tile within one tile of it (the first at once); it also bolts **when hit**; bolt speed 8 m/s (a hiker runs 9.5), a bolt ends on arrival or after 20 s; winded = back to the walkers' AI at 0.4 speed |
| Escort | state 0 caged / 1 following / 2 at the hall, health %, metres to the hall | **the captive is an objective, not a monster** (players cannot hit it, the AI never sees it; it moves by `dgo` updates every 0.75 m, at most 5 a second); health 20 swings of the average walker x `DG_PARTY.obj`, safe while caged; follows when more than 3 m from the nearest member, 8.5 m/s; each monster near it (18 m, in sight; the boss's adds too) decides once, 30% go for it; the boss wakes when it is within r - 3 of the hall's middle with a member in the circle |

Every kit: walkers from the theme's roster (guardians only at their posts, keeping to their tile), spawned through `dgSpawnS` (the party's health at that moment), `dgBossS` when the objectives are done,
the mission's own loss through `dgLoseS` ("the ward stone was broken.", "the quarry got away.", "the captive died."; Survival's dark and the others lose by the foundation's wipe rule). **Chests**
(Defense's rotations, Survival's marks): `dgChestS` / `dgChestOpenS`, rolled once when a member opens it and the same two items (boss rarity table, the n-th chest at least rarity n - 1)
plus `coinsFor(L)` x 5 for every member present. **Hazards** (`hazards.js`, from the legend's `hz` cells): root spikes (the `root` telegraph under whoever stands on them, 10% and rooted 1.2 s),
steam vents (`geyser` over the patch, 8% and slowed 2.5 s), rime prisons (a `prison` mark on whoever stands on rime: still on it when it closes, 6% and rooted 2.4 s); no theme marks a spore hazard;
the barrow's gloom (client) and Haugbui's blackout (his kit) are not this file's.

**The mission engine** copies the boss idiom (`BOSS_KITS.<kit> = {start, tick, phase}` over primitives, `server/boss-fx.js`): `DG_KITS.<mission> = {setup(run), tick(run,dt),
onKill(run,m), onUse(run,p,obj), onDown(run,p)}` in `server/dungeon-kits.js`, built over primitives in `server/dungeon-fx.js`: `spawnPackS(run, mouth, group)` (a pack at a mouth,
with party-size health), `objS(run, kind, x, z, hp)` (an objective with health and a state, shown to the clients), `channelS(run, p, obj, seconds)` (**reuses the cast
bar of professions**: `p.cast`, `cast` / `castx` events, `updateCastsS`), `timerS`, `wavesS`, and **`bossS(run)`**, the finale that every kit calls when its objectives are done
(makes the theme's boss on `B.boss`, see section 7). A run's phase is `objectives` -> `boss` -> `won` / `lost`. What the client's HUD shows is one compact tuple per snapshot to the
run's members, `dg:[phase, seconds, a, b, c]`, whose meaning each kit documents (like a boss's `aux`); objectives travel as events (`dgo` create / update / remove) and the boss's
appearance as `dgb` (its place, for the marker).
*As built*, the names differ: the registry is `server/dungeons/kits.js` (`dgDefineKit`, one file per kit in `kits/`), the primitives `dgSpawnS`, `dgObjS` / `dgObjSetS` / `dgObjDelS`,
`dgBossS` (section 7b) and the kits' shared moves in `server/dungeons/fx.js` (`dgChannelS` for channels, `dgMouthsS` for where waves come from, `dgWalkS` / `dgSwingS` for monsters a kit drives,
`dgChestS`, `dgPacksS`, `dgGuardiansS`); timers are each kit's own seconds in `run.k`, counted by `dt` (never the wall clock). The tuple is `dg:[phase, seconds, waiting, ...the kit's numbers]`.

## 5. Parties and difficulty

**The party is a new, generic layer** *(built on the server: `server/party.js`, `tools/party-smoke.js`; useful without dungeons: it is "group play" in `CLAUDE.md` section 10; the frame, tapping a name tag and the map are client work)*: `party{a:'invite'|'accept'|'decline'|
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
- **Joining mid-run** *(built)*: a party member may join an open run with a free slot **until the boss has appeared**. A disconnected member's place is held 5 minutes by account
  (`run.members[acct]`) and they re-enter at the entrance.
- **Down and revive** *(built; "all down at once" is read as: a party with nobody standing loses at once, a lone hiker loses when out of respawns)*: at 0 health you are **downed** (the server uses the existing `p.dead`, so you cannot act), for 30 s; a teammate within 2.5 m who channels 3 s
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

## 7. How it fits the server (built)

The server has **one world**: one `S`, one `MONS` list, one event queue flushed to **everyone**, one heightmap, and the main loop calls `updateMonstersS` over all of it.
There is no instance concept. Two designs were weighed:
- **A second `createWorldServer` per run**: clean isolation, but players, saves, accounts, chat and the socket all live inside one, so a player cannot move between the world and a run.
- **A run is a far-away slot inside the same world (chosen)**: each run gets a slot of coordinates **outside the walkable rectangle** (`WX1` = 990, so slots start a few km
  east: constants `DG_X0` = `WX1` + 1500 (`shared/dungeon-slots.js`), one slot per 600 m, 4 across, at most 16 runs `DG_MAX_INST`; 600 m is more than the largest snapshot radius `SNAP_PLAYERS` 250 + a
  dungeon's 288 m (the biggest grid is 6 x 6 tiles), so runs never see each other by distance). Existing combat, projectile, hit-test and AI code work unchanged because they work in x,z.
  The same machinery is what **the Rootdeep** needs (`docs/WORLD.md` section 8: "its own kind of space... a portal... like a separate instance"): build it once.

What became instance-aware (each row was a place that was global). **Every change is one line marked `// dungeons:`**: `grep -rn "// dungeons:" src/server src/shared` lists them (the rewards'
and the dungeon bosses' hooks are listed in `docs/DUNGEON-THEMES.md`). All rows: **built**.

| File | Was | Now | Hook lines |
|---|---|---|---|
| `server/state.js` `ev()` | one `EVQ`, sent to everyone | each event carries `a.inst = S.ctx`, the run that caused it (0 = the world); `dgEvFor` (instances.js) sends a player the events of his own run, `DG_EV_ALL` (chat, pjoin, pleave, pname, plook, pgear, weather, thunder) to everyone, the `DG_EV_SELF` events whose e[1] is his pid (toast, xp, coins, loot, hurt, down, up, ...) wherever caused, and events marked `e.to` (pty, ptyi, dgi, dge) to him alone | `ev` (and `MSG`, the message table) |
| `server/api.js` `receive` / `tick` | one context | `S.ctx` from the sender during a message, back to 0 after; in `tick` back to 0 after the per-entity loops, then `updatePartiesS`, `updateInstsS` | 3 in receive (incl. the `MSG` fallback), the update line of tick |
| `server/api.js` `broadcastSnap` | `b`, `pl`, `ev` for everyone | `dgSnapS(p,msg)`: events filtered, `pl` only the players of your run (or of the world), `b` your run's boss row (else the six), `dg` the HUD tuple; `n` stays the head count | the send line |
| `server/api.js` `join` / `leave` | every `MONS` in the roster | the roster skips `m.inst`; `leave` calls `partyGoneP`, `dgGoneP` | 2 |
| `server/api.js` `setPos` | clamps to `WX0..WX1` | `dgSetPosS`: the run's grid, `dgSlide` (never into a wall), no jump over 12 m; slot coordinates from a hiker in no run and world coordinates from a member are late messages, ignored | 1 |
| `server/world.js` `getH` | the heightmap | `dgInSlots(x)` returns `DG_FLOOR_Y` (10) | 1 |
| `server/monsters.js` | camps, leash, respawn, roster | `ok()` keeps camps 32 m off a door (no camp moved: checked); `makeMon` adopts a monster made under a run's `S.ctx` (`dgAdoptS`: boss adds, kit spawns, the boss); `monRoster` adds `[level, maxHp]` for a run monster; `updateMonstersS` skips `m.inst` (`dgMonTickS` moves them: flow field, line of sight, no leash, no respawn) | 4 |
| `server/combat.js` | distance-only hits, `killMonsterS` pays hitters near | `damageMonsterS` asks `dgHitOkS` (same run, a clear line from where the hit comes; one of your projectiles beside the monster vouches); `killMonsterS` hands a run kill to `dgKilledS` (`rewardAllS`, the kit, the boss = won); charges and dashes go through `dgDashS`; projectiles stop in walls (`dgWallAtS`); `S.ctx` per projectile, area and burn | 8 |
| `server/tiers.js` `monK` | the zone tier of `landAt(m.camp)` (a slot reads as the Vale or the Reach) | `m.dgK ||` first: the run's level and numbers | 1 |
| `server/players.js` | death -> wake in a village after 3 s | `S.ctx` per player; `if(p.dead&&p.inst) dgDownTickS` (30 s down, then a respawn at the entrance or out); `sanitizeGear` keeps `gear.dg` | 3 |
| `server/professions.js` `updateCastsS` | gathering casts | a cast with `rev` is the revive channel: `dgReviveCastS` (the kits' channels need no hook: `end: Infinity`, so it only breaks them; `dgFxTickS` finishes them) | 1 |
| `server/dungeons/mobs.js` `dgMonTickS` (the foundation's own file) | every run monster thinks with the walkers' AI | `if(m.dgOwn) return;` after the death check: a monster a kit drives itself (Defense's breakers, the Hunt's quarry, Escort's captive-takers, guardians) | 1 |
| `server/dungeons/runs.js` `dgRunTickS` (the foundation's own file) | | `dgFxTickS(run,dt)` each tick after the members' check: the kits' channels, guardians and the theme's hazards; after the end, open channels break and live hazard warnings are taken back | 1 |
| `server/economy.js` | | `chatP`: `/invite name`; `devP`: `dg` | 2 |
| `server/boss.js` | six singletons | `makeBossS(bd,A)` (initBossS uses it); nothing else: a run's boss is ticked by its run (dead, it is not ticked: no respawn timer), its toasts carry the run's `S.ctx`, its death goes through `dgKilledS` | (makeBossS) |
| Shared (room) mode | one 4 KB message for everyone | starting a run (door or testing tool) is refused: `DG_TXT_SHARED` | |
| new | | `server/party.js`; `server/dungeons/` `instances.js`, `mobs.js`, `fx.js`, `hazards.js`, `kits.js`, `kits/` (purge, defense, survival, sabotage, siege, hunt, escort), `runs.js`, `lobby.js` (plus the dungeon bosses' `boss-fx.js`, `boss-kits.js`); `shared/dungeon-slots.js` (`DG_X0` = `WX1` + 1500, `DG_SLOT` 600, 4 a row, `DG_MAX_INST` 16, `DG_FLOOR_Y`) | |

### 7b. The run object and the primitives (built: for the mission kits and the client)

A run (full comment in `server/dungeons/instances.js`): `{id, slot, ox, oz` (world coordinates of the bake's north-west corner: world = local + (ox, oz)), `theme` (the `DG_THEMES` entry),
`th, mission, seed, L, tier, B` (the `dgBake`), `phase` `'objectives'|'boss'|'won'|'lost'`, `ready` (false while the start prompt is open: no monsters yet), `t` (seconds since setup),
`endT, members` (Map key -> `{pid, key, name, p, respawns, out, down, gone, left, back, got:{xp,coins,items,mats,kills}}`, key = `p.acct` or `'pid:'+id`), `mons` (Set), `objs, boss`
(null or the fight state B), `k` (the kit's own state), `hud` (the kit's numbers), `party, lead, dev, inv, asked, emptyT, flow}`. A player in a run has `p.inst` = its id; a run's monster
`m.inst` and `m.dgK`.

| Primitive | What |
|---|---|
| `dgWorldS(run,lx,lz)`, `dgLocalS(run,x,z)` -> {x,z} | coordinates (kits work in local metres: `run.B.marks` S / O / C / P / B) |
| `dgSpawnS(run,defId,lx,lz,{elite,role,hunt})` -> m or null | a monster at the run's level with the party's health at that moment; `m.dgRole`; elite x2.5 health, a quarter bigger; hunt: comes for the nearest member at once |
| `dgRemoveS(run,m)` | gone (despawn) |
| `dgMembersS(run)` / `dgPresentS(run)` | living members / everyone present (alive, downed, out) |
| `dgEv(run,kind,...)` | an event to the run's members |
| `dgObjS(run,kind,lx,lz,o)`, `dgObjSetS(run,ob,st,v)`, `dgObjDelS(run,ob)` | objectives (the `dgo` event; `dg{a:'use',id}` calls the kit's `onUse` within `ob.r` + 1.5 m) |
| `dgBossS(run)` | the theme's boss in the round hall (`DG_BOSS_DEFS` row when its kit exists, else a world boss as stand-in), with `dgHallArena` (the circle plus `solid`); phase `'boss'` |
| `dgWinS(run)`, `dgLoseS(run,why)` | the end: `dge` to each member, 20 s later everyone goes back; a win saves `gear.dg` and hands out the clear's piece (`dgClearReward`, `dgGrantItemP`) |
| `rewardAllS(run,m)` | loot for all: one roll (through `dgRollDropP`, so the Tempering Stone rule is the world's), copied to every member present |
| `fx.js`: `dgWalkS(run,m,lx,lz,dt,speed,reach)`, `dgSwingS(m,dt,near)` | a monster the kit drives (`m.dgOwn`): one step by the flow field (stun, knockback, slow), and the AI's swing (0.28 s wind-up, `mact`) |
| `fx.js`: `dgChannelS(run,p,ob,secs,done)` | a channel on the cast bar (`cast [pid, -2, secs, objective id]`; walking 1.5 m off or a down breaks it: `castx`) |
| `fx.js`: `dgObjHpS`, `dgObjHurtS`, `dgObjHealS`, `dgObjHitS`, `dgObjMoveS` | objectives with health (in a monster's hit at the run's level, x `DG_PARTY.obj`) and objectives that move |
| `fx.js`: `dgChestS(run,lx,lz,n)`, `dgChestOpenS(run,ob,p)` | a reward chest: one roll for everyone present |
| `fx.js`: `dgMouthsS(run,tile,dmin,dmax)`, `dgTileDistS`, `dgPacksS`, `dgGuardiansS`, `dgFreeNearS`, `dgFarCellS`, `dgHurtPctS` | where waves come from (mouths by doors from a tile), packs in rooms, guardians at their posts, free spots, the far side of the map, damage as a share of health |
| `dgDefineKit(id,{setup,tick,onKill,onUse,onDown,onBossDead})` | a mission kit: one file in `server/dungeons/kits/` with that single call, listed in the manifest after `kits.js`; a bad one is left out and listed (`DG_KIT_BAD`); the hourly offer deals only from missions that have a kit (`dgPoolS`) |

Timers (`server/dungeons/runs.js`): start prompt 15 s, down 30 s, revive 3 s within 2.5 m at 35%, 2 respawns, a held place 5 minutes, an empty run 60 s, results 20 s; at most 16 runs.

Position is not saved (`recordOf`: name, look, level, exp, gear), so a player who disconnects inside a run comes back at the village spawn: no cleanup needed beyond leaving the run.

**Client** (`game/dungeon/`, new): the run is built **in the same scene at the slot's coordinates** (one `scene`; every monster, remote player and effect already `scene.add`s into
it, so they work unchanged). Entering (`tp` with the run's seed) builds the meshes from `dgBake` (floor, merged wall runs, props from markers: small and few draw calls,
cheaper than the forest on a phone), then switches **sky dome, fog, lights (sun and its shadow off, a few torch lights), weather, ambience and music** to the dungeon's, and stops the
chunk streaming (`Stream`, `genChunk` are skipped while `P.inst`). Also: `worldBounds` and `getH` (client) use `dgSolid` / the floor; **the third-person camera must collide with
walls** (corridors are 4 m wide; `updateCamera` has a wall clamp only inside the tunnel, so a boom test against `dgSolid` is new); the minimap draws the dungeon with explored tiles; a
party frame, the objective HUD (the `dg` tuple), the boss bar (the existing one: the run's boss is a boss to the client too), the results panel. Test: `client-smoke` grows a dungeon case (build, walk, a wall stops you).

**As built** (`game/dungeon/`, after `net/client.js` and `dungeon/board.js` in the manifest; tests `tools/dungeon-client-smoke.js`, 44 checks, and the dungeon case of `tools/client-smoke.js`):
- **The view** (`view.js`): the `tp`'s `dg` rebuilds `dgBake(dgLayout({mission:m, seed, theme:th}))` (the server's call) as a group at `(ox, y, oz)`: one indexed floor grid (open cells, solid props and the walls beside them,
  darker in corners), wall faces wherever a wall meets anything else in three rows (6.5 m, wobbled by a shared noise field in the cave themes so nothing gaps) with caps, the theme's props, the portal at `B.start` (an arch
  facing the entrance tile's door), a rune ring on the boss's circle and dark burrows at the monster mouths. Light props (legend `light`), the portal and the hall are **anchors**: their light is baked into the vertex
  colours of every cell they see. Four meshes (floor; walls and lit props; glowing parts, unlit; see-through parts), 17-90k triangles for the three themes' layouts. Every geometry and material is disposed on leaving.
- **Prop kinds** (`DG_PROP_KINDS`): wall-like `rootwall` (roots down its faces), `stonerim`, `burialniche` (a niche with a skull) are drawn as wall runs in their colour; `rootpillar` (a trunk wrapped in roots), `roottrunk`
  (buttressed), `mushrooms` (two or three, glowing spots), `heartknot` (knotted wood with a glowing seam), `glowfungus` (tiny glowing caps), `sappool` (an amber glowing pool), `seedpods`, `rootspikes`, `guardpost` (a dark ring),
  `jadecolumn` (octagonal, base and capital), `bamboo` (stalks and leaves), `stonelantern` (a toro with glowing panes), `offeringbowl`, `springwater` (a see-through teal sheet), `steam` (soft puffs), `steamvent` (a stone ring),
  `runepillar` (glowing rune strips), `cairn`, `urn` (a lathe), `brazier` (blue flames), `graveslab`, `bones`, `rime` (a pale patch); any other kind draws a rock. A filled block of one solid kind up to 3 x 3 cells is one prop
  (the hall's pillars), else one per cell.
- **Objectives** (`dgo`): a ring of the kind's `r`, a turning crystal and a beam in its colour (`DG_OBJ_KINDS`), a label in the dungeon's own words (`dgObjName`) with a bar when `v` is a share, green and beamless when done,
  moved in place when the same id comes with a new x, z (the ping, the captive); arrows round the middle of the screen point to the active ones (not chests and flasks) and, once the boss is up, to its hall.
- **The look** (`look.js`): sky dome, water, sun shadow, weather (and its sound), aurora, petals and motes off; the camera's far plane 140 m; the theme's fog colour, 42 m of sight (the Barrow 36 m, 16-34 m by how near a
  brazier is: its gloom), its light as hemisphere and a dim sun from above, whatever the hour (`dgLookEnv` overwrites the sky state in `updateEnv`, before Haugbui's blackout); a torch light on you and, on a desktop,
  two point lights moved every quarter second to the nearest anchors (their count never changes in a run); the theme's music (a boss in its hall still plays its own) and ambience (drips, the Barrow's hum,
  water in the grottoes). All given back on leaving.
- **Walking and camera** (`collide.js`): `worldBounds` slides you along the bake (`dgSlide`, as the server's `dgSetPosS`), `getH` is the flat floor; the third-person arm is tested against `dgFree` and
  shortens in front of a wall at once, easing back out in about a third of a second.
- **Party** (`party.js`): the frame under your bars (the others' names, health, level, down, the leader's crown; dimmed when not in your run), the invite prompt (`ptyi`, keys Y / Backspace, also for the board's
  join prompt), the party panel (P, a tap on the frame or on a name tag: invite by name, make leader, remove, leave), party members green on both maps; `dgPartyState` is the `pty` event as it came (the board reads it).
- **HUD** (`hud.js`): `dgHudText(m, dg, th)` (all mission text is `shared/dungeon-hud.js`'s) with its bar and label, the run's clock, a Leave button (tapped twice); the talk key revives a downed teammate within
  2.4 m, uses an objective of a usable kind within its `r` + 1.2 m (`DG_USE_KINDS`: chest, flask, heartroot, captive, until the kinds carry `use`), relights a dark lamp in Haugbui's hall (`dg{a:'use'}`), or leaves by the
  portal (pressed twice); the downed screen shows the bleed-out clock and the respawns left; `dge` opens the results card (time, XP, coins, items by name in their rarity's colour, materials, why, the 20 s to the door).
- **Maps** (`minimap.js`): in a run the minimap and the full map draw the bake one pixel a cell, only the tiles walked into, with the portal, the hall, objectives, the run's monsters and the party.
- Testing tools: a Dungeons row (any theme, the test set too, and the seven missions; Start a run sends `dev{cmd:'dg'}`).

### 7c. Client hooks (every one a single line marked `// dungeons:`; `grep -rn "// dungeons:" src/game src/index.html` lists them)

The handler tables `NETH` / `EVH` / `SNAPH` (`game/net/client.js`) let a feature file add a message, an event or a snapshot field without touching the switches. Rows for the Delve board, then the run's and the party's client (`EVH.pty`, `ptyi`, `dgo`, `dgb`, `dgr`, `dge`, `SNAPH.dg` need no hook):

| File | Hook | What it does |
|---|---|---|
| `game/village/talking.js` | `dgOpenDoor(...)` in `interact()`, `dgEntPrompt(...)` in `updateTalkUI()` | the talk key and prompt at a door (the door's own work: `game/dungeon/entrances.js`); `dgOpenDoor` calls `dgBoardOpen(themeId)` |
| `game/ui/panels.js` | `'dgBoard'` in `PANELS` | the board is a panel like the others: `openPanel('dgBoard')`, Esc / X / `closePanels()` close it, `uiOpen()` counts it |
| `src/index.html` | one block: `#dgBoard` (panel) and `#dgJoin` (the join prompt) | markup; styles `src/styles/25-dungeon-board.css` |
| `src/manifest.json` | `25-dungeon-board.css`, `dungeon/board.js` (after `economy/dungeon-gear.js`, i.e. after `net/client.js` and `ui/panels.js`) | load order: the file fills `NETH.dgboard` and `EVH.dgi` at load, so it must come after `client.js` |
| `game/net/client.js` | `dgOnTp(msg)` at the head of the `tp` case | builds or tears down the run's view before the floor is read (a `tp` without `dg` while down is a respawn) |
| `game/net/client.js` | the `cast` case: `if(e[2]<0) dgCastEv(e)` | the revive (`-1`) and the kits' channels (`-2`) on the cast bar; `onCastEvent` reads `NODES[i]` and threw for them |
| `game/world/heightmap.js` | `getH`: `if(dgInSlots(x)) return DG_FLOOR_Y` | the run's flat floor, as the server's `getH` |
| `game/player/movement.js` | `worldBounds`: `if(dgIn()){ dgBounds(...); return; }` | the run's walls instead of the world's edges |
| `game/player/movement.js` | `updateCamera`: `dgCamBoom(...)` | the camera's arm against the run's walls (third person only) |
| `game/world/time-of-day.js` | `updateEnv`: `dgLookEnv(envCur)` (before `dgGloomTint`) | the run's fog and light, whatever the hour or weather |
| `game/world/streaming.js` | `streamPump`: `if(dgIn()) return` | no chunks grow in a run |
| `game/world/weather.js` | `updateWeather`: `if(dgIn()) WX.inten=0` | no rain, snow or their sound underground (eases back after) |
| `game/audio/music.js` | `musicThemeHere`: `if(dgIn()) return dgMusicTheme()` (after the boss line) | the theme's music |
| `game/audio/driver.js` | `soundTick`: `if(dgIn()){ dgAmbience(T); return; }` | the run's sounds instead of the forest's |
| `game/audio/ambience.js` | `surfaceAt`: `if(dgInSlots(x)) return 'gravel'` | stone underfoot |
| `game/combat/monsters.js` | `addMonView`: `if(r.length>9){ m.dgK=dgMonK(d,r[9]); m.maxHp=... }` | a run monster's level and health (roster fields 9, 10) for the bars |
| `game/economy/tiers.js` | `monTierK`: `m.dgK||` | a run monster's level and health share, like the server's `monK` |
| `game/ui/map.js` | `drawMinimap` / `drawFullMap`: `if(dgIn()){ dgDrawMini / dgDrawFullMap; return; }`; the two player-dot lines: `dgPartyCol(r.id)||` | the run's explored tiles; party members green |
| `game/village/talking.js` | `interact()`: `else if(dgUseNear()) dgUseKey()`; `updateTalkUI()`: `else if(free&&dgUseNear()){ dgUsePrompt(...) }` | the talk key and prompt: revive, use, relight, leave by the portal |
| `game/net/remote.js` | `updateRemotes`: `tag.dataset.pid=String(r.id)` | a tap on a name tag opens the party panel with that name |
| `game/main/loop.js` | `frame`: `dgFrame(dt)` (before the camera) | the run's view, light and HUD, the party's prompts |
| `game/player/keybinds.js` | three rows of `KB_ACTIONS`: `party` (P), `accept` (Y), `decline` (Backspace) | the party panel; answering an invite or the board's join prompt |
| `src/index.html` | `#dgPtyFrame` under the bars; one block `#dgHud`, `#dgArrows`, `#dgResult`, `#dgPtyInv`, `#dgPty` (panel); the Testing row `#tDgTheme` / `#tDgMission` / `#tDgGo` | markup; styles `src/styles/24-dungeon.css` |
| `src/manifest.json` | `24-dungeon.css`; `dungeon/run.js` ... `dungeon/minimap.js` after `dungeon/board.js` | they fill `EVH` / `SNAPH` and `PANELS` (`'dgPty'`, pushed at load) |

The board checks nothing itself: `ok`, `gate`, `why`, `lead`, `offer` and `left` are the server's answer (`dgBoardP`), and Start is only offered to a leader at an open door for a mission that is built (`pool`). It reads (never registers) the party code's roster from a global `dgPartyState` if there is one (`{lead, list|members|roster: [[pid, name, ...] | {pid|id, name}]}`), and closes itself when you step away from the door (a 1 s timer, which also runs the clock).

## 8. Saves and unlocks *(`gear.dg` built: `dgSanitizeSave`; best = the fastest clear in seconds)*

`gear.dg = {clear:{'<theme>:<mission>': n}, best:{'<theme>:<mission>': score}}` (and, from the rewards: `gear.temper`, the stones, 0 to 9,999, and `gear.eq.ring`; the enhancement lives in the item id, `sword7-e+3`), sanitized in `sanitizeGear` like every `gear` field (unknown keys dropped, counts clamped, an old save gets `{}`);
a clear is counted when the boss falls.
Unlocks (`dgUnlocked`, built and tested): a dungeon opens by its land's gate: **Wildwood's only at +1 difficulty or above** (locked while Wildwood is set to +0; the base level 30 is at +1), the Vale's once Hanami is walked into (`gear.east` 2, level 30 at +0), the Reach's once Rimehold is (`gear.north` 2, level 30 at +0: the flags the circles use), and from the dungeon's level less 5 (25 at the base). **Which mission types a dungeon offers rotates every hour** (`dgOffer`: two types of the seven, random but fair, the same for everyone; the leader picks one when starting; `docs/DUNGEON-THEMES.md` section 2). There is no gating by clears (a random offer
cannot unlock a chain). The **Delve board** *(built: `game/dungeon/board.js`; it shows the one dungeon at the door you stand at, not all three at once)* lists the dungeon with its lock, each with the two types on offer, its level at the tier you play and a countdown; the board opens at a **door in the world**, not in a village: three doors (the Hollowed Elder in the Ancient Grove, the Falls Door at Jade Falls, the Barrow Door at the Bonefrost Barrow;
`DG_ENTRANCES`, `docs/DUNGEON-THEMES.md` section 6), each a structure like the teleport circle (`buildCircle`), opened with the talk key within `DG_ENT_TALK` (4.5 m) of it, with a signpost on the nearest road and a marker on the map. Wildwood's door stands visibly sealed while Wildwood is at +0 (`dgGateOpen`).

## 9. Protocol (built on both sides)

In:
- `party{a:'invite'|'accept'|'decline'|'leave'|'kick'|'lead', name}`; the chat line `/invite name` does the same as invite.
- `dg{a:'open'}` (within `DG_ENT_TALK` of a door: answers `dgboard`), `dg{a:'start',dungeon,type}` (the leader at that door; `type` one of the two on offer, else a toast "the offer changed" and a fresh `dgboard`),
  `dg{a:'accept'}` (a prompt, or your party's run in progress until its boss appears), `dg{a:'decline'}`, `dg{a:'leave'}` (the portal; also downed or out), `dg{a:'revive',id:pid}`,
  `dg{a:'use',id?}` (an objective; without id the boss kit's `use` in the hall); testing tools: `dev{cmd:'dg',v:'<theme>:<mission>[:seed]'}`.

Out, messages:
- `dgboard{th, name, door, offer:[two mission ids], pool:[the missions built], left: seconds to the next offer, L, tier, gate 0|1, ok 0|1, why, lead 0|1 (you may start)}`. *Client built: `dgBoardOpen(themeId)` sends `dg{a:'open'}` and opens the panel; `NETH.dgboard` fills and refreshes it (also when a refused Start sends a fresh one); the leader's Start sends `dg{a:'start',dungeon,type}` and closes the panel.*
- `tp{x,z,face,dg:{id,m,seed,th,L,tier,ox,oz,y,ph,t,boss}}` into a run: build `dgBake(dgLayout({mission:m,seed,theme:th}))` with its corner at (ox, oz), floor at y; `tp{...,dg:false}` back
  to the world; a `tp` without `dg` while in a run is a respawn at its entrance.
- on entry `mons{list}` (the run's monsters; later ones come as `spawn` events); a run monster's roster entry has 11 fields `[id, def, campX, campZ, s, x, z, dead, temp, level, maxHp]`
  (maxHp in the def's units, like the snapshot's hp: show `hp x dgKOf(def,level).hp`); on entry also its `dgo`, `dgb` and the boss's telegraphs; on leaving `snap{ev:[['despawn',id],...]}`.

Out, events (e[1] = the player's pid for the ones to one player):
- `pty [pid, leaderPid, [[pid, name, hp, maxHp, level, dead 0|1, run id], ...]]` (leader 0 and [] = no party); pushed on every change, health checked every second.
- `ptyi [pid, fromPid, fromName, seconds]` an invite.  `dgi [pid, run id, 0 starting | 1 under way, theme, mission, level, seconds, leader name]` a run prompt. *Client: `dgJoinShow(e)` in `game/dungeon/board.js` (Join sends `dg{a:'accept'}`, Stay behind `dg{a:'decline'}`); `EVH.dgi` is set there only if no other file has set it.*
- `dge [pid, 1 won | 0 lost, seconds, xp, coins, [item ids], materials, why]` the end (what you got; banked as it dropped).
- to the run: `dgo [id, kind, x, z, st 0 removed | 1 active | 2 done, v]` (the kinds, their names, colours and what `v` is: `shared/dungeon-hud.js`, `DG_OBJ_KINDS`: stone, chest, lantern, flask,
  heartroot, altar, ping, captive; the ping and the captive **move**: a `dgo` with the same id and new x, z), `dgb [boss monster id, x, z, r, def id]`, `dgr [reviver, revived]`; a kit's channel is
  `cast [pid, -2, seconds, objective id]` / `castx [pid]` (Sabotage 2 s, Escort 5 s); the hazards use the bosses' own `tele [id, 'root' | 'geyser' | 'prison', x, z, r, dur, 0, half]` /
  `tend [id, 1 | 0, x, z]` (prison: half = the pid it follows) and `pfx [pid, 'root' | 'slow', seconds, 0, 0]` (no new event kind); the revive channel is `cast [pid, -1, 3, target]` /
  `castx [pid]`; `down` / `up` as in the world.

Snapshot (run members): `dg [phase 0 objectives | 1 boss | 2 won | 3 lost, seconds since setup, members still to answer the start prompt (0 = under way), ...the kit's HUD]` (each mission's numbers: section 4's "As built" table and `shared/dungeon-hud.js`, whose `dgHudText(mission, dg[, theme])`
turns them into a title, lines and a bar for the client: no mission code on the client; at most 8 numbers); `b` only the run's boss row (empty before it appears); `pl` only the run's members (the world's players see no one in a run); `n` the head count online. All small; none passes 4 KB.
Shared (room) mode refuses runs, but parties work there: its one broadcast carries `pty` / `ptyi` to all, and the client keeps those whose e[1] is its own pid.

**What the client works out for itself** (it would rather be told; none is needed for the game to work): the **respawns left** (it starts at 2, `DG_RESPAWNS`, and counts a `tp` without `dg` that comes while you
are down; a reconnect resets the count) and whether you are **out** (no respawns left and the bleed-out clock run down), both for the downed screen: a field in the `dg` tuple or in `pty`'s rows would be exact;
the **down clock** starts at your own `down` event (30 s, `DG_DOWN_S`); **which objective kinds take the use key** and **whose `v` is a share** (`DG_USE_KINDS`, `DG_PCT_KINDS` in `game/dungeon/hud.js`; a `use` / `pct`
field on `DG_OBJ_KINDS` rows would replace them: the client reads those first); an objective's reach is its kind's `r` (the `dgo` event does not carry the server's `ob.r`).

## 10. Testing plan

Built: `tools/dungeons-smoke.js` (tiles, the boss circle against `ARENAS`, layouts, grid, flow, party table; checked by breaking the generator and watching it fail); `tools/party-smoke.js` (22 checks:
invites by name and `/invite`, the cap, one party at a time, the roster and its health refresh, lead, kick, leave, a disconnect, decline, expiry, members-only events); `tools/dungeon-runs-smoke.js`
(80 checks: slots and the floor, the testing tool and the tp payload rebuilding the same grid, two runs and the world apart (events, players, monsters, bosses, the join roster), a walker round a
wall, walls stopping hits and projectiles, setPos, the start prompt, party health x1 / 2.0 / 2.8 / 3.6 and after a leave, joining in progress, every member getting every drop, the zone-tier trap,
a held place and its expiry, no joining once the boss is up, downed / bleed out / revive / a party wipe / a lone hiker out of respawns, a Purge won through its boss with the save, the clear's
piece and the return, a door start with the gate and the offer, leaving to the apron, an empty run closing, the 16-run cap, `gear.dg` sanitizing, the kit registry, a Shared host refusing).
Both were mutation-checked (17 mutations of the code they cover, each caught). `tools/dungeon-missions-smoke.js` (112 checks, ~15 s): every mission won through its boss on two dungeons and lost by its own
condition (the stone broken, the dark with everyone down, the quarry's 10 minutes, the captive dead; Purge by a wipe), the HUD numbers moving and `dgHudText` reading them, party health at spawn
(x2.0 for two) and the stone x `DG_PARTY.obj`, a chest the same for all present (and rising rarity), breakers, flasks, the shield and the channel, the decay floor, bolts and sightings, the
captive following and being picked (30%), the three hazards hurting, rooting / slowing, missing when dodged and stopping with the run; mutation-checked (25 mutations of the kits, fx.js,
hazards.js, the HUD rows and the `dgOwn` hook, each caught). The client: `tools/dungeon-client-smoke.js` (44 checks, `dist/`, solo, ~15 s: every prop kind builds, the run at its slot, the forest off and given back, walls (the server agrees), the camera's arm, monsters, the boss bar, the HUD, objectives (moving ones too), hazard telegraphs, the party frame / invite / panel / colours, the revive and channel bars, the downed screen, the results, both maps, leaving and disposal; mutation-checked: 9 mutations of the hooks and files, each caught) and 9 dungeon checks at the end of `tools/client-smoke.js`.

## 11. Build order

| | Step | Size | Test |
|---|---|---|---|
| M0 | this: design, tiles, round boss hall, generator, grid, flow, party table | done | `dungeons-smoke` |
| M1 | Party (messages, frame, invite): **done** (`server/party.js`; client `game/dungeon/party.js`: frame, invite prompt, panel, name-tag taps, map colours) | S-M | `party-smoke`, `dungeon-client-smoke` |
| M2 | **Done** (`server/dungeons/`, `dungeon-runs-smoke`; client `game/dungeon/`: the view, look, walls, camera, HUD, maps, `dungeon-client-smoke`). Runs: slots, tagged events, per-run snapshots, floor and clamp, flow AI, all-members loot, downed / revive, the client dungeon view and camera; entered from a Testing-tools button (no gate yet); wide doors + clearance flow if the theme needs them | **L** | `dungeon-server-smoke`, `client-smoke` |
| M3 | **Done**: primitives, Purge and the boss finale (`server/dungeons/kits.js`, `kits/purge.js`), Defense and the HUD text (`kits/defense.js`, `shared/dungeon-hud.js`; the client draws it). Mission engine and primitives, Purge, Defense, the objective HUD, **the boss finale** (`bossS`: a boss made on demand in the boss hall, its death = cleared; tested with the six existing bosses) | M-L | mission smoke |
| M4 | **Done**: Survival, Sabotage (`kits/survival.js`, `kits/sabotage.js`) | M | `dungeon-missions-smoke` |
| M5 | **The Delve board is built** (`game/dungeon/board.js`: the hourly offer with its countdown, opened at the three doors; `tools/dungeon-board-client-smoke.js`), the three entrances (door meshes, signposts on the roads, map markers: sites found and tested in `DG_ENTRANCES`), `gear.dg`, rewards (caches, chests, results panel) | M | smoke + client |
| M6 | **The three dungeons**: the tile art of one design at a time (`docs/DUNGEON-THEMES.md` lists the tiles to draw) and its boss kit with the small primitives it needs (`needs` in `DG_BOSSES`) | L each | boss smoke |
| M6r | **Rewards** (`docs/DUNGEON-THEMES.md` section 7): the 490 level-30 ids in `ITEM`, the ring slot and its attack in `recalcP` (a soul change must recalc), the stone in `rewardKill`, the forge's Temper tab, then `dgClearReward` at a clear. All but the last work without a dungeon (the Reach's own level-30 monsters would drop stones the day it ships), so they can be built first | M | `dungeons-smoke` (the rules, built), a rewards smoke on the server |
| M7 | **Siege, Hunt, Escort done** (`kits/siege.js`, `kits/hunt.js`, `kits/escort.js`, the hazards `hazards.js`); later Vault, Interception, Dig; the Rootdeep as the second user | M each | `dungeon-missions-smoke` |

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

## 14. Notes from a second review (agent-first additions)

A second pass over the plan against the code found it sound; it had independently reached the same slot design. These are the additions section 7 does not have. They apply the
layout rules of `CLAUDE.md` section 5 to the dungeons.

- **Mark every hook.** Each change to an existing file in section 7's table is one line ending in `// dungeons: <what>`, so `grep -rn "// dungeons:" src` lists every integration point
  and can be checked against that table.
- **Add messages through a table, not the switch.** `receive()` in `server/api.js` is one `switch`; give it a `default:` that looks the message up in a handler table (`MSG[msg.t]`), so
  `party` and `dg` are added in their own files (`server/party.js`, `server/dungeons.js`) without editing `receive` each time. `netHandle` and `applyEvent` (`game/net/client.js`) get the same `default:`.
- **`respawnVil`** (`server/players.js`, used by the 3 s wake-up in `updatePlayersS`) picks a village from the position (`p.x > HALF`: Hanami or Rimehold). A slot is east of the world, so a
  downed run member would wake in Hanami: the run's down / revive branch must bypass it (section 5).
- **`getH` has 18 call sites on the server and 96 on the client, none in shared code**: one branch in each `getH` (section 7) covers all of them; no call site needs rewriting.
- **Measured**: a second `createWorldServer` per run costs about 0.4 s of CPU and 2-5 MB each (the heightmap and 555 monsters), on Node's one thread, so every player would feel it: one more
  reason for the slot design.
- **Validate themes when they are defined.** When M6 adds `DG_THEMES`, enter each theme through one function (`defineDungeonTheme({...})`): it checks the id, that every tile passes the tile checks,
  that each `mobs` id is in `ALL_MON_DEFS` and the boss kit is in `BOSS_KITS`, `lv`, `music`. A bad theme is **left out, warned about and listed** (`DG_BAD`), so the game still boots, and
  `tools/dungeons-smoke.js` fails naming the theme and the field. A theme is then one file (`shared/dungeons/themes/<id>.js`: a single call, no top-level names) plus one line in `src/manifest.json`.
- **Folder when the files multiply.** The plan names four server files (`dungeons.js`, `dungeon-kits.js`, `dungeon-fx.js`, plus the generic `party.js`) and a client folder: once M2 adds them, keep the
  dungeon ones together in `server/dungeons/` (the manifest takes paths; `CLAUDE.md` section 5, rule 1) so one `ls` shows the feature.
- **Small facts.** float32 at the slots' coordinates (about 2,500-5,000) is accurate to about 0.5 mm. If the client draws props with an `InstancedMesh`, every mesh needs `instanceColor`
  (`docs/areas/render.md`). A `pc(...)` geometry needs normals, and a model that throws while it is built inside a network message aborts the rest of that message
  (`docs/areas/monsters-bosses.md`).
