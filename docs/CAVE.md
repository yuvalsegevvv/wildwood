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

`defineCaveSkill({id, name, floor 1-4, method 'A'-'H', set: skill-set id | null, cost 20-40, desc, mult, range, fx, el?, act?, anim?, icon?})` in `shared/cave.js`. A skill is one data file `shared/cave/<floor>-<id>.js` added to `src/manifest.json` after the sets (`skillsets/*.js`), because `set` is checked against `SS_SETS` when it is defined. An invalid entry is left out, warned about and listed in `CAVE_BAD` (`{id, why}`); the smoke test names it.

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
| Test | `tools/cave-smoke.js` | the slot lock, charge, cap, set double, boss 50 / 0, spend, registry validation, a bad save (the cave skills in it are fixtures defined in the test) |
| Protocol | `docs/PROTOCOL.md` | `atk{k:'cave'}`, `cavequip{id}`, `cave{c}` |

## 12. Hooks into existing files (`grep -rn "// cave:" src`)

| File | Hook |
|---|---|
| `shared/classes.js` | `slotLv('cave')` is `CAVE_SLOT_LV`; `newSkills()` has `cave:null` (`SLOTS` itself is unchanged on purpose) |
| `shared/items.js` | `newGearFor` has `cave:{own:{}}` |
| `server/players.js` | `newPlayer`: `cd.cave` and `p.cave`; `sanitizeGear`: `gear.cave` and the worn skill must be owned; `sanitizeSkills`: `cave` id; `updatePlayersS`: `caveTickP(p)` |
| `server/combat.js` | `handleAttack`: `k:'cave'` goes to `caveCastP`, `caveCastS` starts a cast's charge record; `damageMonsterS`: `caveHitS(p)` |
| `server/boss.js` | `updateBossS`: `caveBossTickS(B,inside)` while engaged |
| `game/combat/classes.js` | `CB.cd.cave` |
| `game/combat/attacks.js` | `doAttack('cave')` calls `caveDoAttack` |
| `game/player/keybinds.js` | `KB_ACTIONS` `cave` (default `Digit4`) |
| `game/ui/combat-hud.js` | the key and button, `caveFillTile()` in `setActionBar`, `caveHudUpdate()` per frame, `caveBarKey()` in the redraw key |
| `game/economy/skills.js` | `KIND_TITLE.cave`, the cave row in `skSlotsHtml`, the Cave tab, `caveBindPanel` |
| `index.html`, `styles/09-combat-hud.css` | `#abCave`, `.ab-cave` |
| `manifest.json` | `cave.js` (shared and server), `cave/slot.js` (client, after `net/client.js`) |

## 13. Build status

- **C0 (done):** the 4th slot (level 23, key 4, action-bar tile with charge bar, "Go to the cave" until a cave skill is owned, skills panel row and Cave tab), the server charge and boss rule, `defineCaveSkill` with validation and `CAVE_BAD`, `gear.cave.own` and `gear.skills.cave` saved and sanitized, protocol documented. No cave skill ships; `cave-smoke` defines fixtures. Tests: `cave-smoke`, `keys-smoke`, `client-smoke`.
