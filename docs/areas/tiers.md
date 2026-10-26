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
  with gear and the Vitality passive: 2 + 2 + 1 points = x1.5; the cap is +150% = x2.5, `ZTIER_SYMBOL_CAP`, a placeholder: the Greyspine's fourth badge counts, 20 points would be +200% but stop at the cap), all four lands' points count wherever you are. Opened by the second boss of each land (Carapax,
  Kyuubi, Vetrmaw) killed at your highest unlocked tier; changed in a village (`zoneTierVillage`: the whole village area, spawn included). What a tier
  multiplies (`zoneTierK`, from the level formulas, so it depends on the monster's level): Vetrmaw (30) at tier I / II / III / IV / V is level 40 / 50 / 60 / 70 / 80 with health
  x1.3 / 1.9 / 2.9 / 12.6 / 59.8, damage x1.2 / 1.6 / 2.4 / 6.1 / 15.0 (tiers IV and V include the creeps, below), XP x6.4 / 42 / 290 / 590 / 1,170; the Ancient Treant (15) is level 25 / 35 / 45 / 55 / 65 with health x2.8 / 4.7 / 7.8 / 14 / 36; a level-1 slime is
  level 11 / 21 / 31 / 41 / 51 with health x19 / 66 / 134 / 222 / 380. XP used to grow so steeply with level that punching above your weight paid a lot; it no longer does past +10 levels (`xpLeadK`, below): the level debuffs (-5% damage dealt, at most -50%, and +5% damage taken per level above you), the coins and the drops are what higher tiers add.
  Gear does not follow (`tierFor` stops at 5 from level 25), so the tiers add levels, XP, coins and a harder fight, not new gear yet.
  **What a kill pays is damped above level 60** (`PAY_LV`, `payMult`, `xpFor` / `coinsFor` in `shared/balance.js`): up to level 60 (a level-30 boss at tier III) nothing changed, above it the pay keeps
  its level-60 rate and doubles every 10 levels (x2 at 70, x4 at 80). Without that a tier V Vetrmaw would pay 915 million XP (six levels at once) and 62 million coins; it pays 59 million and 8 million. For XP the damping only matters to hikers above level 50 (the cap below keeps everyone else at or under level 60); the coins use it always. The dungeons use the same tiers (`dgLevel`: a dungeon is level 30 at its base and +10 a tier, so up to level 70 / 80);
  the way in is level 25 at every difficulty (`DG_ENTRY_LV`), not the dungeon's level less 5, which at +III in the Vale or the Reach would have asked for 55.
  **The level debuff stops at x0.5** (`LV_DMG_MIN`, `lvDmgK` in `shared/balance.js`, used by `rollDmgS`): the damage you deal falls 5% for every level the monster is above you (its tiered level), but never below half, which
  is reached at 10 levels above you; 18, 30 or 60 levels above cost no more. It used to go on to x0.1 at 18 levels, so tier V (level 80) was a wall for anyone under level 62 and the fights between 10 and 18 levels up got
  steadily worse. What you TAKE still grows 5% a level (`hurtP`, unbounded). XP is capped at 10 levels above you too (`xpLeadK`), so the level gap now stops mattering past 10 levels in both directions, and what keeps a high
  tier hard is the monster's own numbers (`defAt`). Players at the level a tier is meant for (the monster less than 10 levels above) feel no change; the ones who play above it (a maxed level-30 hero at tier III: a level-60
  Vetrmaw fell in 44 s, now 20 s; Kyuubi III 38 s, now 5 s) do, and so does tier V for everyone.
  **Above level 60 monsters creep tougher** (inside `defAt` in `shared/monster-defs.js`, so zone tiers, dungeons and `prepDef` all get it; nothing at or below level 60 changes; the tests are in `tools/tiers-smoke.js`):
  - *Late creep* (`LATE_CREEP_LV` 60, `LATE_CREEP_BOSS` 13/12, `LATE_CREEP_MOB` 1.065, `lateCreep`): every monster except a prop gets health x base^(level - 60). A boss's (and its adds') base is 13/12, the growth of `f(L)` itself (x1.5 at level 65,
    x2.2 at 70, x3.3 at 75, x4.95 at 80); a normal monster's is the gentler 1.065 (x1.4 / 1.9 / 2.6 / 3.5), so normal enemies are "a bit easier to kill" than the first cut (fights 10-40% shorter: a pack of level 70-72 kinds
    30 s -> 17-22 s, 73-77 52 s -> 37-41 s; 78-80 stays about a minute, their danger is burst damage, not health). A boss's own adds (`bossAdd`) keep the boss's base: they are part of the boss fight, and
    with a weaker wyrmling the warrior's slash alone beat Vetrmaw V standing. Props (the totems and lamps: `hits` without `boss`) keep the hits of their design. Without it the new floor made the whole of tier V fall in seconds (a level-80 Vetrmaw in 34 s, a pack of four Frostfang Alphas in 13 s).
  - *Boss creep* (`BOSS_CREEP_LV` 60, `BOSS_CREEP_HP`, `BOSS_CREEP_DMG`, `bossCreep`): a boss also gets +1.25% health and +5% damage for every level over 60 (70: x1.125 / x1.5, 80: x1.25 / x2.0). It came first: with the old
    floor a maxed level-60 hero (level-30 gear at +10, the ring, an earth soul, the symbol at its +150% cap, potions) standing in melee and drinking beat the tier V Vetrmaw 9 times out of 9 (94-116k damage taken = 3 to 3.7 x
    their health, in 104-115 s), because a greater heal potion (70% of max health per 15 s, about 1,440 a second) out-heals what a level-80 boss deals through 84% armour (870-1,040 a second).
  - What the two give a vetrmaw (level 30): tier I / II / III x1.3 / 1.9 / 2.9 health, tier IV x12.6 and tier V x59.8; damage x1.2 / 1.6 / 2.4 / 6.1 / 15.0. A boss's health at level 60 / 70 / 80 is 67,800 / 295,500 / 1,400,000
    (a hit 1,740 / 4,344 / 10,763).
  **How it plays** (`node tools/boss-duel.js`: the maxed level-60 hero standing in melee with potions; `avoid` refunds a share of every hit, which stands for dodging telegraphs and taking cover; `--camp` fights a whole pack):
  the ramp is the point. Level 65 bosses fall in 4-8 s (the hero outlevels them), level 70 in 20-40 s without a potion (Carapax and Akaoni at tier V 20-30 s, Vetrmaw at tier IV 33-37 s), level 75-76 in 50-75 s with up to 4 potions (Kyuubi
  and Ymrik at tier V), level 80 is the wall: Vetrmaw V loses standing 0 of 20, needs about 30-50% of the damage avoided to win, and at 50% wins in 1.5-3 minutes with 2-5 potions; at 70% it hardly needs potions. A level-50
  hero is not shut out, only a step behind (Vetrmaw V: the warrior wins at 50% avoided in 144 s, the archer and mage at 70% in 140-160 s, 3-6 potions). Packs follow the same ramp, gentler (a whole camp, standing; averages by level): up to 69 about 11 s and no potion; 70-72
  about 20 s and 0-1 potions; 73-77 about 40 s and 1-2 potions; 78-80 about 60-70 s and 3-4 potions, and the hardest packs (Frostfang Alpha x4, Frost Troll x4, Rime Revenant x4) kill a standing hero in 20-35 s and a
  slow one (Glacier Golem x3) takes 80-170 s: those need kiting, which the bot cannot do.
  The dungeon bosses at +V use the same numbers (the run's level is their level): Gawataro (level 80) needs the archer to avoid 50% and the mage 70%, and the warrior still beats him standing (its slash knocks his whelps
  back: crowd control, not a number); Haugbui (level 80) needs the warrior 50% and the archer and mage 70% (his thralls are capped at eight alive, `DG_THRALL_MAX`: at +V a thrall has 384,000 health, about a minute of the
  hero's damage, so the waves and blackouts piled up to 48 and the bot, which never relights his lamps, sat in permanent blackout); Amanita (run level 70) takes 25-35 s, Gawataro and Haugbui +IV (70) 20-55 s.
  **Not changed:** the coins a kill pays still follow the monster's level without the 10-level cap XP has (`coinsFor`), so a hero farming far above their level earns more than one at the right level; with the floor
  that is a little easier than before, and `rewardKill` / `rewardAllS` are the place to cap it if it shows.
  **Levels** (`shared/balance.js`): there is no level cap. Up to 40 the curve is unchanged (about 2,100 same-level kills a level from 26); 40 -> 50 adds 5% of that (about 105) a level (3,150 at 50); from 50 the kills a level cost double every `LV_DOUBLE` = 5 levels (`killsK`). `PLAYER_MAX_LV` (1000) and `EXP_MAX` (1e300) are only sanity bounds for forged saves and the testing tool. **A kill never pays for more than 10 levels above you** (`XP_LEAD`, `xpLeadK`; applied in `rewardKill` and the dungeons' `rewardAllS`, per player): the XP is that of a monster of level
  min(its level, yours + 10), whatever zone tier or dungeon difficulty made it stronger; a boss's x25 and a grey monster's x3 stay. A level-80 monster (a tier V level-30 kind, or a +V dungeon in the Vale or the Reach) pays a
  level-49 hiker what a level-59 one does. Tests: `node tools/levels-smoke.js`, and the dungeon side in `tools/dungeon-runs-smoke.js`.

## Version 3: tiers VI and VII, the six-land symbol, boss skills, stones

- **Seven tiers** (`ZTIER_MAX` 7, `ZTIER_ROMAN` to VII): +10 levels each, so a level-30 boss is 100 at tier VII and a level-40 one 110; the level-40 gear (`docs/ROLLS.md`) is what these tiers are for. Dungeons follow (`dgLevel`: +VI and +VII, up to level 110 for the Sandglass and the Gloamvault). The creep and pay damping above level 60 (`defAt`, `payMult`) simply keep going; **tiers VI and VII are not balance-tuned yet** (`tools/boss-duel.js` is still the level-60 hero with the +150% symbol, 3 lands' fifteen points, and says nothing about them).
- **The symbol counts all six lands** (`ZTIER_SYMBOL_LANDS`): 6 lands x 7 tiers = 42 points x 10% = **+420%** ("x4.2 stats from symbols, for now"). `ZTIER_SYMBOL_CAP` is 4.2, the whole sum: the one number to tune (the old +150% cap is gone). Badges `.zs.sun` / `.zs.gloam` in `22-tiers.css` are placeholder colours.
- **The Amber Reach is the symbol's seventh badge** (`ZTIER_SYMBOL_LANDS` has `amber`, `.zs.amber` is a burnt-orange placeholder): its seven tiers add 7 points, so a hero with every tier of every land has 49 points, past `ZTIER_SYMBOL_CAP` (4.2, unchanged: the symbol stops at +420% and `symbolCapped` is true). The cap is the owner's number to raise (4.9 would be the whole sum). `#plSym` wraps its bonus text under the badges and the phone's badges shrink (`22-tiers.css`).
- **Boss skills level with the tiers** (`bossSkillLvOf`, `ztBossLand`, `BOSS_SKILL_MAX_LV` in `shared/tiers.js`; `bsRefreshP` in `server/tiers.js`, called by `recalcP` and the drop): a skill a world boss dropped is level 1 + the tiers you defeated in that boss's land (up to 8), on the usual `skillPower` / `skillCdMult` curve. It is not an upgrade: coins and materials still cannot raise it.
- **World bosses drop Reroll Stones** (`rlBossStonesP`, `server/rolls.js`; `rlBossStoneChance` / `rlBossStoneCount`, `shared/rolls.js`): at the tier you fought at, 25% + 10% per tier (95% at VII) for one stone of a random kind, +1 stone every 3 tiers. Guests and dungeon bosses get none.
- **Dungeon clears roll luckier** (`dgRewardWeights`, `DG_REWARD_LUCK` 0.15, `shared/dungeon-rewards.js`; `dgWinS` passes the steps above the land's base): each step multiplies the weight of rarity r by 1 + 0.15 r, Common takes the rest (five steps: Rare x1.75 ... Legendary x4).
