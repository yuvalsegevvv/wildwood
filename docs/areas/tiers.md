# Zone tiers

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Zone tiers (a harder setting per land: enemies +10 levels per tier, the symbol's +10% attack and health per unlocked tier point; opened by a land's second boss: Carapax, Kyuubi, Vetrmaw)

rules in `shared/tiers.js` (`ZTIER_STEP` / `ZTIER_MAX` / `ZTIER_BONUS`, `ZTIER_BOSS`, `zoneTierK`: a def's level and health / damage / XP multipliers at a tier, built on `defAt` in `monster-defs.js`, which `prepDef` also uses; `landAt`, `symbolBonus`); the tier is the **player's own** (`gear.zt[land] = {on, max}`, sanitized by `sanitizeZt`) and a monster exists once, its health in the def's own units, so the server scales per player at the three chokepoints: `damageMonsterS` (a hit takes off `damage / K.hp`; `rollDmgS` takes the level debuff from `K.lv`), `hurtP` (`K.dmg`, `K.lv`) and `rewardKill` (XP, coins and the gear tier of level `K.lv`), where `K = monK(m,p)`; `recalcP` applies the symbol; `setZoneTierP` (`zt` message, village only) and `zoneTierKillP` (the unlock: killing the second boss at your highest unlocked tier) in `server/tiers.js`. Client: `game/economy/tiers.js` (`monTierK`, `zoneLvText`, the symbol `#plSym`, the picker `#mapTier` under the map), the target frame (`combat-hud.js`), boss bar, map and zone label show the tiered level, and a monster's health in your own units; styles `22-tiers.css`; testing tool "Unlock zone tiers" (`dev{cmd:'zt'}`); test `node tools/tiers-smoke.js`

## Pitfalls

- Zone tiers (the feature taught these): the tier is per player but a monster exists once, so **its health pool is in the def's own units** and every
  path that touches it must go through `monK(m,p)`: damage to a monster only through `damageMonsterS` (it divides by `K.hp`: a new attack path that writes
  `m.hp` directly would ignore tiers), damage to a player only through `hurtP(p,v,m)` **with the monster passed** (without `m` there is no tier and no level
  debuff), rewards only in `rewardKill`. A monster's land is where its camp is (`landAt`; a boss's camp is its arena), so a boss's add is in the boss's land.
  `zoneTierK` is measured against `defAt(d,d.level)`, not `d.hp` / `d.xp`, because a def may be tuned after `prepDef` (the grey monsters' XP x3). Tier is a
  word the code already uses for gear (`tierFor`, `TIER_ATK`, `tier` in recipes and the shop): the zone tiers are `zoneTier*` / `ZTIER_*` / `gear.zt`.
  The client shows a monster's health in the *viewer's* units (`T.hp * K.hp`): the snapshot's hp is the same for everyone.

## Reference numbers

- Zone tiers: 5 tiers per land (`ZTIER_MAX`; IV and V were added for the power the level-30 dungeon gear and its enhancing bring), +10 levels each (`ZTIER_STEP`), the symbol +10% attack and health per unlocked point (`ZTIER_BONUS`, multiplied
  with gear and the Vitality passive: 2 + 2 + 1 points = x1.5, all fifteen = x2.5), all three lands' points count wherever you are. Opened by the second boss of each land (Carapax,
  Kyuubi, Vetrmaw) killed at your highest unlocked tier; changed in a village (`zoneTierVillage`: the whole village area, spawn included). What a tier
  multiplies (`zoneTierK`, from the level formulas, so it depends on the monster's level): Vetrmaw (30) at tier I / II / III / IV / V is level 40 / 50 / 60 / 70 / 80 with health
  x1.3 / 1.9 / 2.9 / 5.7 / 12.1, damage x1.2 / 1.6 / 2.4 / 6.1 / 15.0 (tiers IV and V include the boss creep, below), XP x6.4 / 42 / 290 / 590 / 1,170; the Ancient Treant (15) is level 25 / 35 / 45 / 55 / 65 with health x2.8 / 4.7 / 7.8 / 14 / 26; a level-1 slime is
  level 11 / 21 / 31 / 41 / 51 with health x19 / 66 / 134 / 222 / 380. XP used to grow so steeply with level that punching above your weight paid a lot; it no longer does past +10 levels (`xpLeadK`, below): the level debuffs (-5% damage dealt, +5% damage taken per level above you), the coins and the drops are what higher tiers add.
  Gear does not follow (`tierFor` stops at 5 from level 25), so the tiers add levels, XP, coins and a harder fight, not new gear yet.
  **What a kill pays is damped above level 60** (`PAY_LV`, `payMult`, `xpFor` / `coinsFor` in `shared/balance.js`): up to level 60 (a level-30 boss at tier III) nothing changed, above it the pay keeps
  its level-60 rate and doubles every 10 levels (x2 at 70, x4 at 80). Without that a tier V Vetrmaw would pay 915 million XP (six levels at once) and 62 million coins; it pays 59 million and 8 million. For XP the damping only matters to hikers above level 50 (the cap below keeps everyone else at or under level 60); the coins use it always. The dungeons use the same tiers (`dgLevel`: a dungeon is level 30 at its base and +10 a tier, so up to level 70 / 80);
  the way in is level 25 at every difficulty (`DG_ENTRY_LV`), not the dungeon's level less 5, which at +III in the Vale or the Reach would have asked for 55.
  **Boss creep above level 60** (`BOSS_CREEP_LV` / `BOSS_CREEP_HP` / `BOSS_CREEP_DMG`, `bossCreep`, inside `defAt` in `shared/monster-defs.js`, so zone tiers, dungeons and `prepDef` all get it): a boss gets +1.25% health and
  +5% damage for every level over 60 (level 65 x1.06 / x1.25, 70 x1.125 / x1.5, 75 x1.19 / x1.75, 80 x1.25 / x2.0); ordinary monsters, props, adds and every boss up to level 60 (zone tiers up to III, dungeons up to +III) are untouched.
  Why: measured with `node tools/boss-duel.js` (a maxed level-60 hero: level-30 gear at +10, the ring, an earth soul, the symbol at 15 points, potions) standing in melee and drinking, the tier V Vetrmaw (level 80) was beaten by
  all three classes every time (9/9; it took 94-116k damage = 3 to 3.7 x their health, in 104-115 s) because a greater heal potion (70% of max health per 15 s, about 1,440 health a second) out-heals what a level-80 boss deals
  through 84% armour (870-1,040 a second). With the creep the same hero loses (0/9) and needs to avoid about 30% of the damage to win at all and 50% to win comfortably (1.5-3 minutes, 2-5 potions); at 70% avoided it hardly
  needs potions. The dungeon bosses at +V: Gawataro (level 80) now needs the archer to avoid 50% and the mage 70%; the warrior still beats him standing (its slash knocks his whelps back: crowd control, not a number),
  Haugbui (level 80) took a hero 1-10 million damage to beat before the thrall cap (`DG_THRALL_MAX`, eight alive: a level-79 thrall takes the hero about 30 s of damage, so the waves and blackouts piled up to 48; the bot never relights his lamps, so it also sat in permanent blackout); with the cap the warrior needs to avoid 50% and the archer and mage 70% (the mage's kill takes 7 minutes in the bot's hands), judge him by playing; Amanita (run level 70) falls in 9-12 s.
  **Known gap, not changed:** every boss up to level 76 still falls to that hero in seconds (Carapax and Akaoni at tier V, level 70: 7-10 s; Vetrmaw at tier IV, 21 s; Kyuubi and Ymrik at tier V, levels 75 and 76: 33-45 s;
  Amanita +V 9 s), because the level debuff on damage dealt (-5% a level, at least 10%) is x0.5 at ten levels above you but x0.1 from eighteen: a creep cannot close a five-fold jump. A smoother debuff or bosses'
  own growth by level would; that is a design decision (`docs/NOT-BUILT.md`).
  **Levels** (`shared/balance.js`): level 50 is a soft cap (`LV_SOFT`), not a wall. Up to 49 the curve is unchanged (about 2,100 same-level kills a level from 26); from 50 each level costs `LV_SOFT_GROWTH` = x1.5 the one before,
  so with the best XP a kill can pay (a monster 10 levels above you) 49 -> 50 takes about 301 kills, 50 -> 51 about 450, 55 -> 56 about 6,300 and 60 -> 61 about 91,000. `PLAYER_MAX_LV` (99) is only the ceiling saves and the
  testing tool are clamped to. **A kill never pays for more than 10 levels above you** (`XP_LEAD`, `xpLeadK`; applied in `rewardKill` and the dungeons' `rewardAllS`, per player): the XP is that of a monster of level
  min(its level, yours + 10), whatever zone tier or dungeon difficulty made it stronger; a boss's x25 and a grey monster's x3 stay. A level-80 monster (a tier V level-30 kind, or a +V dungeon in the Vale or the Reach) pays a
  level-49 hiker what a level-59 one does. Tests: `node tools/levels-smoke.js`, and the dungeon side in `tools/dungeon-runs-smoke.js`.
