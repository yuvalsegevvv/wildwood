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

- Zone tiers: 3 tiers per land (`ZTIER_MAX`), +10 levels each (`ZTIER_STEP`), the symbol +10% attack and health per unlocked point (`ZTIER_BONUS`, multiplied
  with gear and the Vitality passive: 2 + 2 + 1 points = x1.5), all three lands' points count wherever you are. Opened by the second boss of each land (Carapax,
  Kyuubi, Vetrmaw) killed at your highest unlocked tier; changed in a village (`zoneTierVillage`: the whole village area, spawn included). What a tier
  multiplies (`zoneTierK`, from the level formulas, so it depends on the monster's level): Vetrmaw (30) at tier I / II / III is level 40 / 50 / 60 with health
  x1.3 / 1.9 / 2.9, damage x1.2 / 1.6 / 2.4, XP x6.4 / 42 / 290; the Ancient Treant (15) is level 25 / 35 / 45 with health x2.8 / 4.7 / 7.8; a level-1 slime is
  level 11 / 21 / 31 with health x19 / 66 / 134. XP grows so steeply with level that punching above your weight pays a lot (a level-30 player needs 2,100 kills
  of a level-30 monster for a level, 330 of a tier-I one): the level debuffs (-5% damage dealt, +5% damage taken per level above you) are what pays for it.
  Gear does not follow (`tierFor` stops at 5 from level 25), so the tiers add levels, XP, coins and a harder fight, not new gear yet.
