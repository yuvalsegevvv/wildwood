# The Deep Cave

Design and code map of the Deep Cave. The approved plan (v2, all 26 skills designed) is sections 1 to 10; the owner's answers in it win over older docs. Sections 11 to 13 are the code map, the hooks table and the build status, which every build step keeps current. One feature stem: `cave` (`shared/cave.js` + `shared/cave/`, `server/cave.js`, `game/cave/`, `tools/cave-smoke.js`, this file). Router row: `CLAUDE.md` section 4.

## 0. In one screen

A shared zone under the Wildwood, open from level 23, four floors (each a different cave). Its main reward is the new **4th skill slot** and its skills, which you level up by repeating the cave's activities. Not in the cave: villages, dungeons, raids, new characters. Kills pay as anywhere else (XP, coins, resources and gear drop as usual).

Built for eight lands from the start: floors 2-4 pick up sets by `tier = floor - 1` automatically; each floor has 8 method places; a method with no skill pays Echo Shards.

## 1. Getting in and getting down

- **The mouth** is in the Wildwood, close to the mountains, with a **teleport circle** right at the entrance so any land can reach it.
- **The lift** stands next to the entrance and works like a teleport circle between floors: it takes you to any floor you have opened.
- **Opening a floor:** own **2 skills** from the floor above. Floor 1 is open to everyone from level 23.
- **Shared:** one open zone for everyone, like a land, not an instanced run.
- **The slot** opens at level 23 (`CAVE_SLOT_LV`). Until you own a cave skill, its action-bar tile says *Go to the cave*.

## 2. The four floors

Monsters start at level 25 and each floor spans 10 levels. Floors 2 to 4 pay one skill per skill set of the matching difficulty, so every set gets exactly one cave skill.

| Floor | Theme | Monsters | Pays | Today (6 lands) |
|---|---|---|---|---|
| 1 | **Glowworm Grotto**: wet limestone, blue glowworm ceilings, still pools, stalactites | Lv 25-34 | 8 general skills, no set | 8 |
| 2 | **Prism Hollows**: giant geodes, light split into colours, echoing chambers | Lv 35-44 | skills for the **+1** sets | Tansy, Sazanka, Torgeir, Corvin, Sabir, Ottoline |
| 3 | **Drowned Galleries**: flooded old halls, an underground river, waterfalls indoors | Lv 45-54 | skills for the **+2** sets | Ambrose, Marigold, Dunstan, Sorrel, Zahra, Hollis |
| 4 | **Magma Heart**: lava tubes, obsidian, ember vents, heat shimmer | Lv 55-64 | skills for the **+3** sets | Pell, Genzo, Brynja, Tamsin, Nephra, Ogden |

The themes stay clear of the existing dungeons (Hollow Roots' fungus, Jade Spring, Bonefrost Barrow, the Blackseam mine, Sandglass, Gloamvault). With 8 lands, floors 2-4 grow from 6 to 8 skills each with no other change.

## 3. The 4th slot: charge, not cooldown

- **Gaining charge.** Every basic, skill or burst that hits an enemy adds `0.6 x its cooldown` in charge (`CAVE_CHARGE_K`): a basic about 0.5, a 7 s skill about 4, a 38 s burst about 23. Longer cooldown, more charge per use. The cooldown is the ability's base one (`ab.cd`), not the upgraded one.
- **Cap and cost.** The bar holds 100 (`CAVE_CHARGE_MAX`). A 4th-slot skill costs 20 to 40, set per skill (stronger effect, higher cost).
- **Same-set bonus.** A set's cave skill is not part of the 3- or 5-piece bonus. Instead, casts of pieces of the same set give it **double charge**. Rule in code: the equipped cave skill has a `set` and the cast ability's `set` is the same (`caveChargeGain`).
- **Between fights** charge is kept as it is.
- **Boss fights.** Entering a boss fight sets your charge to **50** (`CAVE_BOSS_START`). Leaving the fight before it ends drops it to **0**, so nobody can step in and out to refill.
- **Why 0.6 x cooldown.** Each slot used on cooldown then gives the same rate (about 0.6 a second), so no slot is "the charge button", and steady fighting fills about 1.8 a second.
- A mixed loadout casts a 30-cost skill about every 17 s; with 3 pieces of its set about every 8 s.

Starting numbers to tune in play. The 0.6 is one constant.

**Decisions where the plan was silent (C0):**

- *Once per cast, never per enemy*: a cast starts a record (`p.cave.cur`, `caveCastS`); the first damage the player deals while it is current (`damageMonsterS` -> `caveHitS`) pays its charge and marks it paid. A cast that hits nothing pays nothing. The record stays current for `CAVE_CAST_WINDOW` = 3 s, so a projectile or a zone that lands later still pays; a newer cast replaces an unpaid one. Hits that are not a cast's (a burn tick, a trigger) pay only a current unpaid cast.
- *No charge* below level 23, on the Proving Isle, or from the cave skill's own casts (casting it clears the current record).
- *In a boss fight* = standing inside an **engaged** boss's arena (the boss's own `inside` list, arena + 6 m), checked every tick by `updateBossS` (`caveBossTickS`). Entering sets exactly 50 (also joining mid-fight). Not seen inside for 0.5 s ends the player's fight: if the boss is dead, the fight ended and the charge stays; otherwise (walked out, died, or everyone left and the boss reset) the charge drops to 0. Bosses of dungeon runs and raids count only if their kit runs through `updateBossS`.
- *Casting* needs the slot open (level 23), the skill worn and owned, charge >= cost, 0.8 s since the last cave cast (`CAVE_CAST_CD`). It spends the cost and runs the skill through `p.act` like any skill with `fx`.

## 4. The skills

These rules apply to every cave skill. One skill works for all three classes, like the universal pieces. Costs run from 20 to 40 charge. Each level from 2 to 5 adds **+10% to the skill's effect** (+40% at level 5; `caveLevelK`), and the cost stays the same. Set skills **read** their set's mark but never spend it, so the set's own burst keeps its payoff. The letter is the method that earns the skill on that floor (A-H, section 6).

### Floor 1: Glowworm Grotto: general skills

| Skill | Earned by | Cost | Effect |
|---|---|---|---|
| **Echo** | A Murals | 30 | Repeats your last skill or burst at 60% power, without its cooldown. |
| **Flare** (light) | B Crystals | 25 | A 10 m burst of light. Normal monsters are blinded for 2 s and miss; bosses deal 20% less for 4 s. |
| **Overdrive** | C Echo trial | 25 | Your next 3 basic attacks are sure crits and come 30% faster. |
| **Lantern Ward** | D Lantern | 35 | A shield of 15% of your max health for 6 s; allies within 8 m get half of it. |
| **Burrow** | E Silent chamber | 30 | Sink into the ground for 1.5 s: nothing can hit you, you move up to 6 m, and normal monsters lose track of you. |
| **Cave-in** (earth) | F Collapse run | 35 | Rocks fall on a 6 m circle: heavy damage, normal monsters stunned 1.5 s. |
| **Grapple Line** | G Gem mole | 20 | Pull yourself up to 15 m to a target or a spot; your next hit within 2 s deals +30%. |
| **Second Wind** | H Crafting | 40 | Heal 20% of your max health over 6 s and clear slows. |

### Floor 2: Prism Hollows: the +1 sets

| Set | Skill | Earned by | Cost | Effect and how it fits the kit |
|---|---|---|---|---|
| Tansy (grind) | **Threshing Floor** | H Crafting | 30 | A 10 m ring that drags a little and hits everything, +6% per enemy hit (up to 10). Each kill within 4 s refunds 3 charge (at most 15). She has no mark, so it counts the crowd instead. |
| Sazanka (risk) | **Shadow Step** (dark) | E Silent chamber | 25 | Blink behind the target. For 2 s every hit counts as from behind even if it turns, and it leaves a Barb. This differs from Slip Behind, which is a strike: Shadow Step buys a window to strike in. |
| Torgeir (tank) | **Shield-Wall** (earth) | F Collapse run | 35 | Plant the shield for 6 s: you and allies behind you take 30% less from the front, +3% per Fixation within 10 m (up to +15%), and the taunts refresh. |
| Corvin (debuff) | **Lighthouse** (light) | A Murals | 30 | Set the lantern down for 8 s. Its beam sweeps 10 m and puts a Glare on one enemy a second, so his vulnerability stacks keep running while he fights. |
| Sabir (risk) | **Cut and Run** (fire) | G Gem mole | 30 | A burning cut, +10% per Loot on the target, then a dash 8 m away with 20% less damage taken for 3 s. A kill refunds 10 charge. It covers the finisher's weak spot, the damage taken. |
| Ottoline (support) | **Marionette** (dark) | C Echo trial | 35 | Take over a normal monster for 4 s: it attacks its neighbours. A boss is instead weakened 15% for 4 s. Everything hit gets a String. |

B Crystals and D Lantern have no skill yet on this floor; they pay Echo Shards.

### Floor 3: Drowned Galleries: the +2 sets

| Set | Skill | Earned by | Cost | Effect and how it fits the kit |
|---|---|---|---|---|
| Ambrose (healer) | **Tidepool** (water) | B Crystals | 35 | A 6 m pool for 6 s: allies in it regenerate 2% a second and lose slows. When it ends, the weakest ally heals 2% per Ripple within 15 m. |
| Marigold (mixed) | **Intermission** (light) | C Echo trial | 30 | A 1 s bow. Then every ally within 15 m has their next skill +4% per Applause nearby (up to +20%) and heals 3%. |
| Dunstan (support) | **Sound the Charge** (fire) | F Collapse run | 35 | The party's skill and burst cooldowns drop by 2 s at once, +0.5 s per Fervor nearby (up to 4 s). |
| Sorrel (safe) | **Eagle's Perch** (air) | A Murals | 30 | Ride a gust 4 m up for 5 s: melee can't reach you, your shots count as 10 m farther for range scaling, and +5% per Sight on the target. |
| Zahra (support) | **Stopped Hour** (light) | D Lantern | 40 | For 3 s (+1 s per 3 Grain, up to 5 s) the damage you and allies within 15 m take is held back, and only half of it lands when time runs again. |
| Hollis (healer) | **Lamp in the Window** (dark) | E Silent chamber | 35 | Set the lamp down for 10 s (+1 s per Vigil). An ally who falls under 30% inside it heals 15% once. Enemies inside are weakened, using the shared `weak` status. |

G Gem mole and H Crafting have no skill yet on this floor; they pay Echo Shards.

### Floor 4: Magma Heart: the +3 sets

| Set | Skill | Earned by | Cost | Effect and how it fits the kit |
|---|---|---|---|---|
| Pell (safe) | **Night Line** (fire) | D Lantern | 30 | Float a lantern line at a spot up to 30 m away for 8 s. Every 2 s it Lures everything within 6 m, and you count as having stood still (Steady Hand). It loads his Spear from range. |
| Genzo (tank + heal) | **Bell Echo** (air) | C Echo trial | 40 | The next 3 hits you take ring out (+1 per 2 Toll, up to 6). Each one reflects 50% and heals the party 3%. |
| Brynja (risk) | **Black Ice** (water) | G Gem mole | 30 | A 12 m ice lane ahead for 6 s. On it you move 40% faster and Momentum is always on. Enemies on it are slowed 30% and gain Rime every second. |
| Tamsin (grind + tank) | **Landslide** (earth) | H Crafting | 35 | A 14 m slope of rubble ahead drags everything in it to its end, stuns 1 s and taunts. Each kill within 4 s refunds 3 charge (at most 15). |
| Nephra (healer) | **Embalm** (earth) | A Murals | 40 | Wrap one ally or yourself: for 5 s they can't fall below 1 health, then they heal 10% +2% per Linen nearby. |
| Ogden (grind) | **Night Shift** (water) | F Collapse run | 30 | For 8 s every kill near you raises a grave hand (up to 4) that grabs a nearby enemy, slows it and adds Rot. |

B Crystals and E Silent chamber have no skill yet on this floor; they pay Echo Shards.

An echo trial (C) for a set skill uses that set's feat: Ottoline's, puppet 6 monsters in a fight; Marigold's, keep 5 Applause up for 20 s; Genzo's, hold 4 enemies taunted for 20 s.

## 5. How a cave skill is written (C0 registry)

`defineCaveSkill({id, name, floor 1-4, method 'A'-'H', set: skill-set id | null, cost 20-40, desc, mult, range, fx, el?, act?, anim?, icon?, feat?})` in `shared/cave.js`. A skill is one data file `shared/cave/skill-<floor>-<id>.js` (floor 1's, C2/C3: the same stem) added to `src/manifest.json` after the sets (`skillsets/*.js`), because `set` is checked against `SS_SETS` when it is defined. An invalid entry is left out, warned about and listed in `CAVE_BAD` (`{id, why}`); the smoke test names it.

- `fx` is the generic effect object of `resolveFxS` (ring, cone, beam, chain, proj, zone, dash, buff... see `docs/areas/skills-items.md`, `server/combat.js`), so most skills need no server or client code. A skill with a new kind of effect adds an entry in `resolveFxS`.
- The ability is registered like a `SKILLS` row (`cls:'any'`, `slot:'cave'`, `cd:0`) and its attack kind (default `cv_<id>`) in `ACT_SKILL` / `ANIM_OF`, so the client draws it with `fxVisuals`. Its power is `mult x caveLevelK(level)`.
- Ownership: `gear.cave.own = {id: level 1-5}` (saved, sanitized by `caveSanitizeSave`); the worn skill is `gear.skills.cave` (saved with the skills loadout, cleared when not owned). Charge is not saved.
- Later steps add `defineCaveMethod` (the eight methods), `defineCaveFloor` (theme, level band, monsters) in the same style (`shared/cave/`).

## 6. Ways to earn the skills

**Eight methods, on every floor.** Each floor runs all eight, dressed in its own theme, and every floor has eight skill places, so each method is tied to exactly one skill on that floor. You complete a skill's method **once** to own it at level 1. On floors 2-4 only six sets exist today, so **two of the eight methods have no skill yet and pay Echo Shards right away**. When the seventh and eighth lands add their sets, those two methods get their skills, with no other change. After that, any method on any floor pays Echo Shards for upgrades. Players always know where a skill comes from, because the locked tile in the skills panel and a board beside the lift name the method and the floor (for example *Mural fragments, Glowworm Grotto*).

- **A. Mural fragments** (every floor, small-medium). Each skill is painted on a cave wall, broken into 5 pieces hidden in dark side tunnels. The pieces show only in torch or glowworm light. Find all five and the mural teaches the skill. Pure exploration.
- **B. Resonance crystals** (every floor, small-medium). Sealed geodes crack only to the right element or reaction chain (water then fire for steam, and so on). Uses the elements and reactions systems we already have; the skill sits inside the geode.
- **C. Echo trials** (every floor, medium). A stone echo of the set's kit sets a feat played its way: Pell's, 15 kills from over 24 m; Genzo's, hold 4 enemies taunted for 20 s; Brynja's, never stop moving for a minute of fighting. It teaches how the set plays. On floor 1 the feat is a general one (for example, win a fight without being hit).
- **D. Carry the lantern** (every floor, medium). Take a glow crystal from the deepest gallery up to the floor's altar. It dims when you are hit and goes out under water, so you choose a route, fight carefully, or bring friends to guard you.
- **E. The silent chamber** (every floor, medium-large). A sleeping cave guardian lies across a shrine. Running, fighting and skills make noise; cross without waking it. If it wakes, you are thrown out of the chamber and try again.
- **F. Collapse run** (every floor, medium). Every so often a tremor opens a sealed vault for 90 seconds before the tunnel caves in. Everyone on the floor races for it, which makes a shared moment in a zone with no village.
- **G. The gem mole** (every floor, medium). A rare mole grabs a skill shard and burrows towards an exit. Catch it with slows, roots or stuns before it digs out. A chase that rewards control skills over raw damage.
- **H. Cave crafting** (every floor, small). Glow veins and cave herbs need the professions' tools. Gather them and carve the skill tablet at a stone anvil inside the cave. Gives miners and gatherers a reason to go down.

Idea I ("awakening" a dormant skill) is dropped: skill levels do that job.

## 7. Levelling the skills: Echo Shards

- **Repeat to level.** Finishing a method whose skill you already own gives **Echo Shards** in place of a duplicate. So do the two skill-less methods on floors 2-4, from the first time.
- **Deeper pays more.** Shards from one completion: floor 1 = 1, floor 2 = 2, floor 3 = 4, floor 4 = 8.
- **Universal.** Shards level *any* cave skill, so players repeat whichever of the eight methods they like best, on the deepest floor they have opened.
- **Cap at level 5**, like every other skill in the game. Ways past 5 come later.
- **Starting costs** (to tune): level 2 = 10, 3 = 25, 4 = 50, 5 = 100 shards.
- **10-minute cooldown per method**, per player, so players rotate between methods instead of farming one easy method.

## 8. Balance and kit changes to know about

- **Charge per cast, never per enemy.** A cast that hits anything gives its charge once. If it paid per enemy, Tansy's, Tamsin's and Ogden's wide basics would charge ten times faster.
- **Kill refunds are capped** at 15 charge a cast (Threshing Floor, Landslide). Tamsin's *Cleared Ground* already cuts cooldowns on kills, which means more casts and more charge, so without the cap she could chain Landslides.
- **Cooldown cuts speed up charge for the whole party.** Dunstan's quickening, Zahra's *Turn the Hour* and Sound the Charge all mean more casts and so more charge. That is fine alone; to test is Dunstan and Zahra in one party. If it runs hot, limit charge to about 4 a second.
- **Ladder harness.** `tools/skillsets-ladder.js` needs a slot-4 column. Target: a damage set's own cave skill adds about +8% to its full-set number at level 1 and +12% at level 5, so the order of the sets stays the same.
- **Already flagged high: Nephra, Hollis, Brynja.** Nephra's and Hollis's cave skills add no damage on purpose. Brynja's Black Ice adds Rime, which feeds Whiteout. *Possible kit change:* if her ladder goes over about 165, lower Whiteout's per-Rime damage by about 10%.
- **Shared weaken.** Lamp in the Window and Marionette's boss effect use the shared non-stacking `weak`, so Hollis and Ottoline in one party don't stack. That is intended, the same rule as today.
- **Pell and Sorrel overlap** (both are long-range spotters with a long-shot finisher). Their cave skills pull them apart: Pell lays a field and stays still, Sorrel goes up and gains range. No kit change is needed, but it is the closest pair.
- **Marks are only read.** No cave skill spends a mark, so Powder Keg, Whiteout, Dusk Lent, Feeding Frenzy and the long shots keep their full value.
- **The boss rule** (charge set to 50 on entering) means every kit can open a boss fight with one cave skill, even the 40-cost ones.

## 9. Build order

Each step can ship and be tested alone, sized for one agent.

| Step | What | Test |
|---|---|---|
| C0 | The 4th slot opens at level 23 and its key is added. Charge, the bar on the action bar, the boss 50 / 0 rule, the slot-4 row in the skills panel, and one fixture skill. | `cave-smoke`, `keys-smoke`, `client-smoke` |
| C1 | The cave mouth in the Wildwood near the mountains, its teleport circle, the lift, and floor 1's ground, theme and monsters (Lv 25-34). Shared zone, normal loot. | `cave-smoke`, `server-smoke` |
| C2 | The 8 methods as data-driven kinds, the 10-minute cooldown, the board beside the lift, and floor 1's 8 general skills. | `cave-smoke` |
| C3 | Echo Shards, skill levels 2-5, the 2-skills floor gate, and the slot-4 column in the ladder. | `cave-smoke`, `skillsets-ladder` |
| C4-C6 | Floors 2, 3 and 4, one per step: theme, monsters, 6 set skills, and their echo-trial feats. | `cave-smoke`, `skillsets-ladder --check` |

## 10. Built for eight lands from the start

- Each cave skill is one data file added through a registry (`defineCaveSkill`). Floor N picks up every set with `tier = N - 1` automatically, so a new land's sets need only their cave skill files.
- Floors are rows of data (theme, level band, monster list), so floors 5+ later are additions, not rewrites.
- Saved as `gear.cave`: owned skills and their levels, shards, method progress and opened floors. Charge is not saved.
- The 4th slot needs a key in `KB_ACTIONS` (`cave`, default `4`: the letter keys are all taken), a tile and a charge bar on the action bar, and a fourth row in the skills panel.

No open questions. Tune in play: the 0.6 charge constant, skill costs of 20-40, shard amounts and level costs, and the exact spot of the cave mouth near the mountains.

## 11. Code map

| Piece | File | Owns |
|---|---|---|
| Rules and registry | `src/shared/cave.js` | `CAVE_*` constants, `defineCaveSkill`, `CAVE_SKILLS` / `CAVE_SKILL_IDS` / `CAVE_BAD`, `caveSkillDef`, `caveLevelK`, `caveChargeGain` |
| Server | `src/server/cave.js` | `caveNewState`, `caveSanitizeSave`, `caveEquippedP`, `caveCastS` / `caveHitS` / `caveAddP` (charge), `caveBossTickS` / `caveTickP` (boss rule, sending the charge), `caveCastP`, `caveEquipP`, `MSG.cavequip` |
| Client | `src/game/cave/slot.js` | `CAVE_UI`, `NETH.cave`, the action-bar tile (`caveFillTile`, `caveHudUpdate`, `caveDoAttack`), the skills panel's cave row, Cave tab and details (`caveSlotHtml`, `caveGridHtml`, `caveInfoHtml`, `caveBindPanel`) |
| Styles | `src/styles/09-combat-hud.css` | `.ab-cave`, `.cv-bar` |
| Markup | `src/index.html` | `#abCave` in `#actionbar` |
| Server: the set skills | `src/server/cave-fx.js` | `caveFxS` (the 15 extra fx keys of floors 2-4), `caveZoneTickS` / `caveZoneEndS`, `caveHurtS`, `caveKillS`, `caveNextK`, `caveSightK` / `caveRangeAdd`, `caveFxTickP`; keys, state (`p.cave.fx`) and events (`cvfx`, `cvhand`) in its header |
| Set skills | `src/shared/cave/skill-<floor>-<id>.js` | the 18 skills of floors 2-4, one `defineCaveSkill` each |
| Floor registry, places, queries | `src/shared/cave-map.js` | `defineCaveFloor` (validation, `CAVE_FLOOR_BAD`), `CAVE_FLOOR_N`, where each floor lies (`caveFloorOrigin`, `caveFloorAt`), `caveBake`, `caveGroundY`, `caveFree` / `caveSlide` / `caveLos` / `caveWallAt`, `caveLiftOf`, `caveArrival`, `caveFloorOpen`, `caveLiftRefusal`, `caveMobDef` |
| Map generator | `src/shared/cave-gen.js` | `caveGen(floorRow)` -> the bake `B` (cells, heights, water, lava, anchors, camps), `caveHash`, `caveVn` |
| Floor rows | `src/shared/cave/floor-<n>-<id>.js` | one `defineCaveFloor` each: generator options, look (colours, light, fx), monsters (the ten kinds of its band, `caveMobDef` lines at the top) and `look.music` |
| The mouth | `src/shared/cave-mouth.js` | `CAVE_MOUTH`, the pad `caveMouthPad` (rawHeight), `CAVE_MOUTH_V` (joins `CIRCLES`), `CAVE_LIFT_SURFACE`, `caveMouthNear` |
| Server: the zone | `src/server/cave-zone.js` | camps (`caveInitS`), walls (`caveSetPosS`, `caveDashS`, `caveWallAtS`, `caveMonStepS`, `caveSteerS`), the lift (`caveLiftP`, `MSG.lift`), `caveReviveP`, `caveDevTp` |
| Client: the zone | `src/game/cave/zone.js`, `view.js`, `view-themes.js`, `look.js`, `collide.js`, `minimap.js`, `mouth.js`, `lift.js` | `CAVE_RUN` / `caveIn()`, the floor's meshes and four themes, fog / light / sound, walls and camera, the maps, the surface mouth and lift cage, the lift window |
| Test | `tools/cave-smoke.js` | the slot lock, charge, cap, set double, boss 50 / 0, spend, registry validation, a bad save (the cave skills in it are fixtures defined in the test) |
| Protocol | `docs/PROTOCOL.md` | `atk{k:'cave'}`, `cavequip{id}`, `cave{c}` |

## 12. Hooks into existing files (`grep -rn "// cave:" src`)

| File | Hook |
|---|---|
| `shared/classes.js` | `slotLv('cave')` is `CAVE_SLOT_LV`; `newSkills()` has `cave:null` (`SLOTS` itself is unchanged on purpose) |
| `shared/items.js` | `newGearFor` has `cave:{own:{}}` |
| `server/players.js` | `newPlayer`: `cd.cave` and `p.cave`; `sanitizeGear`: `gear.cave` and the worn skill must be owned; `sanitizeSkills`: `cave` id; `updatePlayersS`: `caveTickP(p)` |
| `server/combat.js` (C4) | `resolveFxS` ends with `caveFxS`; `updateAreasS`: `noHit` zones hit nobody, `caveZoneTickS` / `caveZoneEndS`; `killMonsterS`: `caveKillS`; `handleAttack`: `caveNextK` on the skill's mult |
| `server/players.js` (C4) | `hurtP`: `v=caveHurtS(p,v,m)` before the shield |
| `server/skillsets.js` (C4) | `fxModK`: `caveSightK`, `caveRangeAdd`; `ssBehind`: Shadow Step's window; `ssWhen`: Night Line's `still` and Black Ice's `moved` windows |
| `server/combat.js` | `handleAttack`: `k:'cave'` goes to `caveCastP`, `caveCastS` starts a cast's charge record; `damageMonsterS`: `caveHitS(p)` |
| `server/boss.js` | `updateBossS`: `caveBossTickS(B,inside)` while engaged |
| `game/combat/classes.js` | `CB.cd.cave` |
| `game/combat/attacks.js` | `doAttack('cave')` calls `caveDoAttack` |
| `game/player/keybinds.js` | `KB_ACTIONS` `cave` (default `Digit4`) |
| `game/ui/combat-hud.js` | the key and button, `caveFillTile()` in `setActionBar`, `caveHudUpdate()` per frame, `caveBarKey()` in the redraw key |
| `game/economy/skills.js` | `KIND_TITLE.cave`, the cave row in `skSlotsHtml`, the Cave tab, `caveBindPanel` |
| `index.html`, `styles/09-combat-hud.css` | `#abCave`, `.ab-cave` |
| `manifest.json` | `cave.js` (shared and server), `cave/slot.js` (client, after `net/client.js`); C1: `cave-mouth.js` (before `terrain-height.js`), `cave-gen.js`, `cave-map.js`, `cave/floor-*.js`, `server/cave-zone.js`, `game/cave/*.js` |
| `shared/terrain-height.js` | `rawHeight`: `caveMouthPad` lays the flat pad under the mouth |
| `shared/tiers.js` | `monTierOf`: a cave monster has tier 0 (the cave is no land) |
| `server/world.js` | `getH`: `caveGroundY` inside the dungeon strip |
| `server/api.js` | `caveInitS()` at start; `setPos` goes to `caveSetPosS` on a floor |
| `server/monsters.js` | camps keep 40 m from the mouth; a cave monster respawns on floor (`caveFixS`), needs a line of sight to aggro, steers round corners (`caveSteerS`), slides along walls (`caveMonStepS`) |
| `server/combat.js` | a hit needs a line of sight (`caveHitOkS`); charge / dash stop at walls (`caveDashS`); projectiles stop at rock (`caveWallAtS`) |
| `server/players.js` | a knocked-out hiker on a floor wakes at its lift (`caveReviveP`) |
| `server/economy.js` | dev `tunnel` with `cave:...` (`caveDevTp`) |
| `game/net/client.js` | `tp`: `caveOnTp(msg)` builds / tears down the floor's view |
| `game/world/heightmap.js` | `getH`: `caveGroundY` in the strip |
| `game/world/streaming.js`, `weather.js`, `caves.js`, `zone-fire.js`; `game/wildlife/fish.js`, `dragonflies.js`; `game/ui/world-map.js` | `|| caveIn()` beside every `dgIn()` that means "under the ground" |
| `game/world/time-of-day.js` | `caveLookEnv(envCur)` and the zone label |
| `game/ui/map.js` | the minimap and the full map draw the floor (`caveDrawMini`, `caveDrawFullMap`) |
| `game/player/movement.js` | `caveBounds` (walls), `caveCamBoom` (camera arm), no cave slope / rock tests on a floor |
| `game/audio/driver.js`, `music.js` | `caveAmbience`, `caveMusicTheme` |
| `game/village/talking.js` | `nearCircle` knows the mouth's circle; the talk key and prompt for the lift |
| `game/ui/panels.js`, `index.html`, `styles/20-professions.css` | the `#cvLift` window |
| `game/world/generation-setup.js` | `caveMouthBuild()` |
| `game/dungeon/entrances.js` | `dgEntClear`: no plants within 18 m of the mouth |
| `game/main/loop.js` | `caveFrame(dt)` |
| `game/ui/settings-testing.js`, `index.html` | testing buttons to the mouth and each floor |

## 13. Build status

- **C0 (done):** the 4th slot (level 23, key 4, action-bar tile with charge bar, "Go to the cave" until a cave skill is owned, skills panel row and Cave tab), the server charge and boss rule, `defineCaveSkill` with validation and `CAVE_BAD`, `gear.cave.own` and `gear.skills.cave` saved and sanitized, protocol documented. No cave skill ships; `cave-smoke` defines fixtures. Tests: `cave-smoke`, `keys-smoke`, `client-smoke`.
- **C1 (done):** the cave exists as a place: one shared zone (section 14), four deterministic floors with named anchors for the eight methods and monster camps, four themes, the mouth in the Wildwood with its circle and lift, walls for hikers and monsters, the maps. Floor 1 has its ten monsters (Lv 25-34, a pack at each of 32 camps, normal loot). No method or cave skill is placed yet (C2/C3 use the anchors). Tests: `cave-smoke`, `client-smoke`, `server-smoke`.
- **C1b (done):** the monsters of floors 2-4, ten kinds each (Prism Hollows Lv 35-44: light x6, earth x2, air x2; Drowned Galleries Lv 45-54: water x4, dark x3, air x2, light x1; Magma Heart Lv 55-64: fire x5, earth x3, dark x2), each a `caveMobDef` line at the top of its floor file (a recoloured copy of an existing family: slime, beetle, wisp, treant, bat, goblin, scorpion, fox, wyrm, djinn, sandworm), stats from `defAt` (Lv 60+ already creep tougher: floor 4's top kinds reach about 60k HP and 1.8k damage, no break in the ramp), normal loot, XP and coins. Cave monsters are not in `MON_DEFS`, so the quest board, `MAX_ZONE_LV` (40, clamps quests and a quest's level in saves) and `questTop` never see levels above it. Each floor's `look.music` names an existing theme (grotto `wild2`, prism `rimehold`, drowned `gloam1`, magma `gloam2`). `tools/monster-preview.js` now loads the cave kinds (`--ids glowslime,...`). Tests: `cave-smoke` (each floor's camps, bands, kinds, 40 models build).
- **C4 (done):** the 18 set skills of floors 2-4 (six a floor, one per set), each `shared/cave/skill-<floor>-<id>.js`, with `set`, `floor`, `cost`, `el`, `method`, `desc` and, for the three echo-trial skills, `feat` (`{kind:'puppet', n:6}`, `{kind:'mark', id:'applause', n:5, secs:20}`, `{kind:'taunt', n:4, secs:20}`; validated loosely by `defineCaveSkill`, read by the method engine). Engine: `server/cave-fx.js` adds the keys `cvstrike`, `refund`, `behindWin`, `retreat`, `wall`, `cvzone`, `next`, `cdrParty`, `perch`, `hold`, `bell`, `slide`, `embalm`, `shift`, `puppet` (their meaning is in the file header). Rules kept: a set skill only reads its mark (counts it; some add stacks), kill refunds stop at `CAVE_REFUND_CAP` = 15 a cast (Sabir's at 10), heals go through `ssHealAllS` under `SS_HEAL_CAP`, weaken is the shared `weak`, a boss is weakened and never puppeted or dragged, level 2-5 scales the effect by `caveLevelK`. Test: `node tools/cave-sets-smoke.js` (registry, then every skill cast on a scripted fight). Placeholder events for the effects step: `cvfx` kinds (`wall`, `next`, `perch`, `hold`, `hold-end`, `bell`, `embalm`, `embalm-end`, `cleanse`, `lane` with a speed, `weak`, `retreat`, `slide`, `puppet`, `lamp`) and `cvhand`; zones are ordinary `area` events.
  Decisions where the plan was silent: *Tansy* `el` none (her set is basic). *Shield-Wall*: "behind you" = within 10 m of the planting spot, at or behind its line, with the attacker in front of the victim; the +3% per Fixation counts the stacks on the enemies near you, up to 5 (+15%), read once at the cast. *Lighthouse* also burns (35% of its power a second). *Tidepool* sits 3 m ahead; "loses slows" is the `cvfx` `cleanse` event (players have no server-side slow yet). *Intermission*: the +% rides on the next skill or burst (a basic does not use it), 10 s. *Eagle's Perch*: "melee" = a non-boss monster within 6 m; the lift is not simulated (event `perch`); range scaling and Sight apply to fx skills. *Stopped Hour*: the late half never knocks out (floors at 1 hp); Grain counts up to 10 stacks, +1 s per 3, at most 5 s. *Lamp*: its Vigil lengthening counts up to 5 s. *Night Line* is placed on the target in range, else 20 m ahead. *Black Ice*: the lane is a 6.5 m circle 6 m ahead (about 12 m long), the +40% speed is the `lane` event for the client (the server does not own movement). *Bell Echo*: lasts 20 s, +1 hit per 2 Toll up to 6 in all. *Embalm* picks the party member (or you) with the least health; its end heal and Tidepool's end heal use the caster's heal stat. *Marionette* freezes the puppet with a stun (it fights only through the caster's hits on its neighbours, 0.8 s apart); `p.cave.fx.puppets` counts them for the feat. *Landslide* leaves a monster where it is when the end is rock. *Night Shift*'s hand takes the nearest living enemy within 8 m of the dead one and hits at 0.8 x the cast's power. Slot-4 column of `tools/skillsets-ladder.js`: not done, left for C3 (the ladder bot would have to wear and cast a cave skill).

## 14. Where the cave lives and how its floors are made (C1)

**Placement: one shared open zone, not an instanced run.** The four floors are fixed squares of the same world, east of the dungeon run slots: floor `n` starts at `x = CAVE_X0` (`DG_X0 + 4 * DG_SLOT + 300`), `z = CAVE_Z0 + (n - 1) * 600`, each `CAVE_SIZE` = 336 m. Everything that already works for a place in the world works for a floor with no new channel: monsters are ordinary `MONS` (`m.cave = floor`), snapshots are by distance (floors are 600 m apart, more than the 250 m snapshot reach, and a run slot is further still), combat, drops, chat and parties are unchanged, and the minimap and the 4 KB message limit are not a problem. The squares lie inside `dgInSlots(x)`, so the code that says "under the ground, not the forest" (no ambience of the forest, no fish, the flat-floor `getH`) keeps working; `dgSlotAt` is -1 on a floor so no run is ever put on one. A floor 5 is a new row (`defineCaveFloor`) and a file in the manifest, nothing else; up to 9 fit.

**Entering.** There is no enter message. The lift (`lift{to}`) moves a hiker to the arrival point of another lift; the `tp` lands on a floor; the client sees which floor it is (`caveFloorAt`) and builds its view (`game/cave/zone.js`). Knocked out on a floor you wake at its lift. `caveFloorOpen(p, n)` is `n === 1 || owned-from-floor-above >= 2`; below level 23 the lift refuses with a message. The circle at the mouth is in `CIRCLES` (the travel window lists it; opens like the home circle, `gear.east >= 2`); anybody may stand at the mouth, only the lift checks the level.

**The mouth** (`shared/cave-mouth.js`) is at (184, -156) in the home forest: the foot of the northern foothills, 125 m from the Stone Circle and 120 m from the Hollow Roots' door, off roads, arenas and the coast. `rawHeight` lays a flat pad (mean height of the ring, flat inside 11 m, blended out to 28 m) so the circle and the lift stand level; the camps keep 40 m away and plants 18 m. In its own frame (`caveMouthAt(u, v)`, +v out of the mouth): the doorway at v = -9.5, the circle at (-4.6, 3.4), the lift cage at (6.4, -1.2), a signboard at v = 7.

**The grid.** A floor is 168 x 168 cells of 2 m (`CAVE_CELL`, the dungeons' cell, so `dgFree` / `dgSlide` / `dgLos` / `dgFlow` work on it unchanged). `caveGen(row)` (`shared/cave-gen.js`) is deterministic from `row.seed` and uses only integer hash noise and `+ - * /`, `sqrt`, `floor` (no trig), so client and server rebuild the same floor; a fresh bake takes about 30 ms. Pipeline: chambers spread by best-of-40 candidate (the start and the deepest fixed by fractions), a minimum spanning tree plus a few loops, tunnels bent by 1D noise, side tunnels grown into rock (they end in dead-end pockets), an edge flip and two majority smooths, only the start's region kept, then by theme pools / flooded halls with a river / lava (never cutting the cave in two), a sealed vault pocket, heights (water and lava sink the floor), anchors and camps. Style per floor: `cavern`, `geode` (big round chambers), `hall` (rectangular, pillars), `tube` (narrow, long winding).

**The bake `B`:** `cells` (1 = standable), `open` (cave air, lava included), `water`, `lava`, `hgt` (corner heights), `dw` (cells to the nearest rock), `dist` (walking distance from the start, decimetres), `start`, `lift`, `chambers`, `dead`, `pillars`, `pools`, `river`, `sealed` (the rock cells that hold the vault shut), `anchors`, `camps`.

**Anchors** (floor-local metres, all reachable by walking from the start; the vault once `sealed` is opened; `tools/cave-smoke.js` flood-fills them): `start`, `lift`, `deep`; method A `wall` (a wall point with `nx, nz`) and `pieces[5]` (dead ends, spread out); B `geodes[3]` (wall points); C `plinth {x, z, r}` (a mid-depth chamber with room); D `crystal` (the deepest chamber), `altar` (beside the start); E `entry`, `shrine`, `guard`, `exit` (the silent chamber, a leaf room); F `vault` (a sealed pocket) and `seal` (the middle of the rock that closes it); G `burrows[3]`, `holes[6]`; H `veins[8]` (wall points), `herbs[6]`, `anvil` (beside the start). `camps[{x, z, lv, r}]`: 20 or more per floor, spread over the cave, the level rising with the walk from the start so each level of the band gets its share; the server puts a pack of the floor's kind for that level (`floor.mobs[lv - floor.lv[0]]`) at each.

**Walls on the server** (`server/cave-zone.js`): `getH` is the baked ground; `setPos` slides a hiker along the walls (`CAVE_WALK_R` = 0.45 m, the client's too) and refuses a jump of more than 14 m or a late message from another floor; charges and dashes stop at rock; projectiles stop at rock; a hit needs a line of sight; a monster slides along walls, and with no clear line to where it wants to go follows a breadth-first path from the goal (limited to 40 cells, refreshed every 0.35 s per monster) so it does not stick behind a corner.

**The look** (`game/cave/view.js`, `view-themes.js`, `look.js`). The rock is the grid's contour, not its cells: rim corners are smoothed along the contour and pushed into the rock by noise, walls are strips of rows that bulge, the ceiling is a dome rising from a low lip (`look.h0`, `hk`, `hmax`). Light is baked into vertex colours from the theme's emitters (with a line of sight) and washes, so a floor is a few merged meshes per 32 m chunk; one lantern on you and (desktop) two lamp lights follow. Phones: Lambert instead of Phong, no soft layers, fewer points. Themes: Grotto (limestone strata, blue glowworm points and hanging threads, stalactites / stalagmites / columns, dark pools), Prism (geodes on chamber walls in five hues, coloured light shafts that also light the floor, sparkle), Drowned (laid-stone courses, flooded floor with ripples, the river as a scrolling ribbon, waterfalls with mist, moss), Magma (obsidian, scrolling lava, rising embers, vents with plumes, black shards). Camera far plane 140 m, fog 40-52 m, no sky, sun, weather or wildlife.

**Maps:** the minimap and the full map (key M) draw the explored cells of the floor (cells within 12 m and in sight), the rim of rock as an outline, water blue, lava orange, the lift, monsters you have seen and your party.

**Testing:** the testing panel has buttons for the mouth and each floor's lift; `shot.js --at cave:2,x,z,deg` (floor-local metres) takes a picture there.
