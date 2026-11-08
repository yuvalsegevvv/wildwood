# Bonds, orbs, Stirrings and the Wanderer's paths

A **Bond** (0-VI) is how a hiker grows a character (skill set) after the revamp; the old piece drops no longer unlock one. Levels of skills come from the Awakening tree (`docs/AWAKENING.md`). Numbers are read from `shared/bond.js`.

## 1. Rules and numbers

- **Steps** (`BD_COST`): Bond 0..VI cost 6 3 3 6 6 9 9 Bondstones (42). The zone tier asked in the set's land (`BD_TIER_ADD`, `bdTierOk`, `gear.zt[land].max`): 0 for 0-II, +1 for III / IV, +2 for V / VI, never above tier V.
- **What a step gives**: 0 the character is yours (its basic, skill, power); I and IV its two Bond passives work unequipped (at `BD_PASS_LV` = 1); II and VI the old 3- and 5-set rows (`BD_ROW_K` = 1.5 stronger); III and V +1 level to every piece (skill, charge skill, burst).
- **Active Bond** (`bdRefreshP`): min(Bond, pieces of the main character worn) minus one per guest piece worn (another character's piece, `BD_GUEST_PEN` = 2 levels lower). Written to `gear.skills.bdx`; the main character is the one picked with Play in the Bonds panel (`bd{a:'play',set}`, `gear.bd.play`, free at any time), else the worn power piece's set (`bdMainOf`). The Skills, Awakening and Bonds panels each link to the other two.
- **Orbs**: the orb stall sells any character's orb for `BD_ORB_PRICE` = 1 coin (up to `BD_ORB_BUY_MAX` 99 a purchase, `BD_ORB_MAX` 999 held; per-character sources are open, `docs/NOT-BUILT.md`). An orb opens (`bdOpenOrbP`) into 1 / 2 / 3 Bondstones at 60 / 30 / 10% (`BD_ORB_ROLL`); stones beyond what the steps need are coins (`BD_STONE_COINS` = 300). The pouch's pick (`bd{a:'pick'}`) says whose orbs open next.
- **The hour's Stirrings** (`server/bond-stir.js`, `BD_STIR_*`): each UTC hour (`BD_STIR_SECS` 3600) one ordinary zone a land glows, plus a boss, and a dungeon (even hours) or a raid (odd hours). A kill in a stirring zone adds 1 charge (elite 3); `BD_STIR_CHARGE` = 60 opens an orb (with none held the charge waits at the cap). The stirring boss opens 1-3 orbs by tier fought (`BD_STIR_BOSS`), a dungeon win `BD_STIR_DG` = 2, a raid clear `BD_STIR_RD` = 3. Picks are stateless (`bdStirPick`, seeded shuffle). Pipe, dungeon, raid and temp monsters never charge.

## 2. Realization and the Wanderer's nine paths

The Wanderer is the hero with no set worn: general skills plus ONE path's passive and burst. It has no Bond; **Realization** I-VI (`bdRealOf`) comes from the main quest: I / II / III with acts I / II / III done, IV-VI with act IV. III and V give +1 level to every general skill and the path's burst; I, II, IV, VI give the active path's rows (`BD_WANDERER_ROWS`, `wdRealRows`).

Paths (`shared/wanderer/<id>.js`, one `defineWandererPath` each; bad ones in `WD_BAD`): `fury`, `wayfarer` (risk), `keeneye`, `tempo`, `prism` (safe), `bulwark`, `stalwart` (tank), `forager`, `lorekeeper` (grind). The path is changed free at any time (`bd{a:'path',id}`, `wdPathP`, saved in `gear.bd.wanderer.path`); the tree and Realization stay. The path passive `wd_<path>` is owned while the tree's `pa1` is bought, the burst while `bu1` is; both are derived, never trusted from a save (`wdSyncG`). In force only while the Wanderer is the character played (`wdMainOk`).

**One class and one element per path (the Wanderer acts like the other characters).** Every path file has `cls` (warrior / archer / mage) and `el` (an element, or `null` = none, like a basic skill), checked by `defineWandererPath`; its basic / skill / power pieces are registered ONLY for its class (`pieces[cls]`), all taking the path's element (none for `el:null`); the shared burst and charge are unchanged (the burst takes the path's element). The table (a one-line data change each): warrior = fury (none), bulwark (none), stalwart (fire); archer = wayfarer (none), keeneye (air), forager (earth); mage = tempo (water), prism (light), lorekeeper (dark). Picking a path (`wdPathP`) while the Wanderer is played (or nobody is) puts the path's class weapon in hand; playing the Wanderer (`bdPlayP 'wanderer'`) does the same. The hero card and the Path tab chips show class and element.

**Three weapons at once** (`shared/wpn.js`, `server/wpn.js`). `gear.eq.wpn = {warrior, archer, mage}` (item id or null, sanitized with own-property checks: owned, a weapon of that class; an old save has none, so its weapon in hand fills its class's slot). `gear.eq.weapon` stays THE active weapon every stat reads and is kept equal to `eq.wpn[active class]` by `wpnSyncG` (sanitizeGear, `recalcP`). The ACTIVE CLASS is the played character's (`gear.bd.play`: a set's class, or the Wanderer's active path's class); with no Play pick it is the class of `eq.weapon` as before, and equipping a weapon of another class then changes class as it always did. With a character played, `equipP` of another class's weapon only fills that slot (a toast says so); `bdPlayP` / a path change put `eq.wpn[class]` in hand (empty: the best owned weapon of the class, else the basic one) and fire the main quest's `class` act when the class changed. Carried weapons not in use count as worn (`unwornCount`, `sellP`), follow an upgrade (`wpnSwapG`), and show greyed with "inactive" in the inventory. `equipClassP` ('cls') is refused while a character of another class is played. The test world fills all three. Hooks: `grep -rn "wpn" src/server`. Test: `tools/bond-smoke.js` (the last block).

## 3. Code map

| Layer | Files |
|---|---|
| shared | `bond.js` (rules, constants), `wanderer.js` + `wanderer/*.js`, `skillsets.js` (`defineSkillSet` takes the Bond rows, tree and Bondstone) |
| server | `bond.js` (`MSG.bd`, `bdBuyP`, `bdRefreshP`, `bdMigrateG`, `bdGrantP`), `bond-orbs.js` (`bdOrbBuyP`, `bdOpenOrbP`), `bond-stir.js` (`bdStirTickS`, `bdChargeS`, `bdStirBossP`), `wanderer.js` (`wdPathP`, `wdSyncG`) |
| client | `game/bond/panel.js` (Bonds panel), `orbs.js` (stall), `popup.js`, `stir.js` (map glows, tags), `tags.js` (level marks) |
| prefixes | `bd…`, `BD_`, `bdc…` (client), `wd…`, `WD_` |

Hooks (`grep -rn "// bond:" src`): `server/players.js` (`bdSanitize`, `bdRefreshP`), `server/save-mig.js` (smv 3), `server/combat.js` (`bdChargeS`, `bdStirBossP`), `server/api.js` (`bdStirTickS`), `server/dungeons/runs.js`, `server/raids.js`, `server/awakening.js` (`bdOwns`, `bdMainOf`), `server/economy.js` (dev `bd`, Bond passives), `server/testworld.js`, `game/net/client.js`, `game/ui/map.js`, `world-map.js`, `combat-hud.js`, `dungeon/board.js`, `raids/hud.js`.

## 4. Messages and events (`docs/PROTOCOL.md`)

`bd{a:'buy',set}`, `bd{a:'orb',set,n}`, `bd{a:'pick',set}`, `bd{a:'path',id}`; events `bd [pid,set,bond]`, `orb [pid,set,stones,coins]`, `stir [msg]` (also `welcome.stir`, `{h,z,b,k,id}`). Saved: `gear.bd`. Dev: `dev{cmd:'bd'}`.

## 5. Tests

`node tools/bond-smoke.js` (steps, gates, active Bond, orbs, Stirrings, paths), `skillsets-ladder.js --wanderer`, `awakening-server-smoke.js` (Bond 0 required), `skillset-sources-smoke.js`.
