# Awakening: skill levels, stats and unlocks (the tree)

Since the skill revamp a skill's level is no longer bought at the trainer (`upskill` and `upgradeNeeds` are retired). Each character (a skill set, or the Wanderer) grows a tree in `gear.awk`; the tree gives the levels, the stat nodes and the unlocks. Rules below are read from the code; the numbers live in the files named, change them there.

## 1. Rules and numbers

- **Tiers A0-A5** (`AWK_TIERS`, `shared/awakening.js`): hiker level / skill level cap / what opens: A0 0 / 4 basic, skill, power; A1 10 / 5 passive; A2 20 / 6 charge skill; A3 28 / 7 burst; A4 35 / 8 star 1; A5 45 / 10 star 2. A tier is bought (`awk{a:'tier'}`), nodes need the tier of their limb or level.
- **Six limbs** (`AWK_LIMBS`, `shared/awakening-tree.js`): basic `ba`, skill `sk`, power `po`, passive `pa`, charge `ch`, burst `bu`. `AWK_TOP` = 10. A tree has 116 nodes: 57 upgrade (`po5`), 57 stat (`spo5`, the stat node before that upgrade) and 2 stars. Ids are stable; a save stores ids only. Four tree shapes (`AWK_SHAPE_DEFS`), checked at load (`AWK_BAD`).
- **What a node does**: an upgrade node sets the piece's level (`awkSyncG` writes `gear.skills.lv` and `gear.cave.own`, so `skillLvOf` / `caveLvOf` follow the tree); `pa1` makes the kept passive yours, `ch1` the charge skill, `bu1` makes the burst usable (`awkUltLvP`, Burst needs A3). Stat nodes sum into `gear.skills.aw`, read by `passiveSum`, only for the character played (`bdMainOf`).
- **Level curves** (`AWK_SCALE`, `awkCurve`): damage x1.17 a level (level 10 = x4.11), heals and shields x1.10, buffs +6% of the level-1 value, durations +3%, crowd control +2% (cap +20%), passive stat +8%, cooldown -3% to level 5 then -1% (level 10 = x0.83). The burst's 5 s stun and 60 s cooldown never scale.
- **Prices** (`shared/awakening-cost.js`): per level `AWK_STEP` (coins, drops of ONE monster kind of the character's land (each price its own: `awkDropPick`, the tier's band, the character's element first; the Wanderer any land's), branch material, Essence from level 7), stat rows `AWK_STAT_ROWS`, tier costs `AWK_TIER_COST`. Coins above level 2-5 are a share of `awkR(L)` (3000 x the mean coins of a kill at hiker level L, the one number the balance pass tunes). Materials are ids in `gear.awm`: `echo` (Echo Shards, from the cave methods), `rd_<land>` (raid material, `gear.rd.mat`), `trophy_<boss>` (boss trophies), `ess_<element>` / `ess_prime` (Essence, section 3). A character needs Bond 0 first (`bdOwns`).
- **Trophies** (`shared/boss-trophy.js`): every world boss drops its named trophy, 2^tier of them to every helper with kill credit (`btCount`, `awkTrophyP` from `rewardKill`, not in dungeon instances); at most `BT_MAX` = 999 held. The power branch takes the land's first boss' trophy, the charge branch its second's (`troph` in `AWK_LIMBS`); the Wanderer takes any.
- **Balance re-base** (`shared/balance.js`): `awkHpK(L)` raises monster and boss HP with the damage a levelled skill adds; Bond rows are scaled by `BD_ROW_K` = 1.5 (`shared/bond.js`).
- **Migration** (`server/save-mig.js`, `awkMigrateG`, smv 2): every owned set gets its branches up to the old level, the tier that covers it; only adds, idempotent. Boss skills were refunded in the same pass.

## 2. Code map

| Layer | Files |
|---|---|
| shared | `awakening.js` (tiers, curves), `awakening-tree.js` (limbs, shapes, nodes), `awakening-cost.js` (prices, stat rows, material ids), `boss-trophy.js`, `essence.js` |
| server | `awakening.js` (`MSG.awk`, `awkTierP`, `awkLevelP`, `awkStatP`, `awkSyncG`, `awkStatsP`, `awkTrophyP`, `awkEssenceP`, `awkGrantP`), `save-mig.js`, `cave/methods.js` (`caveShardsP`: a cave method pays Echo Shards, no longer a skill) |
| client | `game/awakening/panel.js` (the tree, key T), `tree.js`, `costs.js`; `game/economy/skills.js` (an Awaken button on each skill) |
| prefixes | `awk…`, `AWK_`, `awc…` (client), `bt…` / `BOSS_TROPHY`, `ess…` |

Hooks (`grep -rn "// awakening:" src`): `server/players.js` (`awkSanitize`, `awkSyncG`, `awkRefreshP`), `server/combat.js` (`awkFx`, buff curves), `server/skillsets.js` (leveled proc rows), `server/ult.js` (`awkUltLvP`), `server/cave/methods.js`, `server/save-mig.js`, `server/economy.js` (dev `awk`), `shared/classes.js` (curves), `shared/cave.js`, `game/net/client.js` (`awk` event), `game/economy/skills.js`, `game/cave/slot.js`, `game/player/keybinds.js` (`awaken`).

## 3. Elemental rifts and Essence

Seven elemental rifts (the Taproot is Wildwood's, Prime Essence; `shared/rift/*.js`, `defineElemRift`, open at level 28) pay Essence into `gear.awm.ess_*` (`RIFT_PAY.essence`, `awkEssenceP`); the deep levels of a branch ask for it. Details: `docs/RIFT.md` section 5. The Pipe lure (`dip{a:'lure'}`, `server/dip.js`, `docs/DIP.md`) lets a hiker pull one kind to farm the drops a price asks for.

## 4. Messages and events (`docs/PROTOCOL.md`)

`awk{a:'tier',set}`, `awk{a:'up',set,id}`, `awk{a:'stat',set,id}` (set = a set id or `'wanderer'`); event `awk [pid,set,'t'|node id,tier]`; the `you` message carries `gear.awk` and `gear.awm`. Each purchase returns null or the reason (toasted). Dev: `dev{cmd:'awk',v,n}`.

## 5. Tests

`node tools/awakening-smoke.js` (data, shapes, costs, curves), `awakening-server-smoke.js` (buying, refusals, migration, levels), `skills-smoke.js` (curve block), `rift-smoke.js` (Essence), `skillsets-ladder.js`. Balance yardstick: `tools/boss-duel.js` (flaky, see `docs/NOT-BUILT.md` section 5c).
