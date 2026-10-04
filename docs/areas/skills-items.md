# Skills, elements, drops, passives

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Skills (all 3 slots, all classes)

`shared/classes.js` (`SKILLS`, `abilityOf`, slot levels) → effects `server/combat.js` (`resolveHitS`, `updateAreasS`, projectiles) → visuals `game/combat/skill-fx.js`, `game/combat/attacks.js` (`attackVisuals`, projectiles), icons `ICONS` in `game/ui/combat-hud.js` (also the passives'). A new attack path must hand the skill's element (`a.el` / `pr.el` / `A.el`) to `damageMonsterS`, or the soul bonus silently does not apply

### Boss skills (dropped by a boss at 10% per skill, 6 per boss (six bosses, 36 skills): a skill and a burst for each class; not sold, no upgrades yet) and generic skill effects (`fx`)

rows with `drop:'<boss id>'` at the end of `SKILLS` (`shared/classes.js`), `BOSS_SKILLS` / `BOSS_SKILL_CHANCE` in `shared/drops.js`; effects `resolveFxS` / `impactFxS` / `applyBuffS` / `statusS` / `updateBurnS` and the drop roll `bossSkillDropP` in `server/combat.js`; visuals `fxVisuals`, `onBeam`, zones (`updateZoneFx`) in `game/combat/skill-fx.js`, projectiles `GEN_PROJ` in `game/combat/attacks.js`; the panel's Boss tiles in `game/economy/skills.js`. Adding a skill with `fx` needs no server or client code: a row, an icon in `ICONS` and (for a new kind of effect) an entry in `resolveFxS`

### Elements: which skill / monster has which (`el` field), the soul (bind at level 15 in Hanami), the x1.5 rules

`shared/elements.js` (`ELEMS`, `soulMult`, `foeMult`, `ELEM_BOOST`); server `elemHitS` / `rollDmgS` in `server/combat.js`, `bindSoulP` in `server/economy.js`; panel + chips `game/economy/soul.js`; the shrine maiden Kaede in `VILLAGERS` (`role:'soul'`, `late:true`); target frame `#tEl`, `onMonDmg` arrows

### Skill levels / upgrades and monster drops (materials)

`shared/drops.js` (`MATS`, `DROP_CHANCE`, `upgradeNeeds`, `UP_COINS`, `UP_COUNT`), `shared/classes.js` (`skillPower`, `skillCdMult`, `abilityCd`); server `upgradeSkillP`, `addMatP`, `rewardKill`; UI `game/economy/skills.js` (details + Upgrade), materials list in `game/economy/inventory.js`

### Passive skills (class-universal, level 18)

`PASSIVES` in `shared/classes.js` (`stat`, `v`, `text`) read with `passiveSum` (`psP(p,stat)` on the server: hp in `recalcP`, dmg / crit in `rollDmgS`, red in `hurtP`, cd in `abilityCd`, drop / xp in `rewardKill`, soul in `elemHitS`); slots + unlock `autoEquipPassiveP` / `equipPassiveP` in `server/players.js` / `economy.js`; `PASSIVE_OPEN` (in `classes.js`) is how many of the 3 slots are usable: slots after it are locked in the panel, refused by the server, ignored by `passiveSum` and cleared from saves

## Pitfalls

- Fast projectiles tunnel through small monsters: hits test the segment flown each tick (`near()` in
  `updateProjS`). Piercing arrows skim the terrain and test in 2D.
- Skill cooldowns are per slot on the server, so swapping skills doesn't reset them (tests must reset
  `p.cd` directly).
- Skills panel drag and drop: every tile can be dragged (so a refused drop always says why); the panel is not redrawn while a tile is held (the server's `you` updates would remove the element under the finger: `SKD.pending`); `pointerup` outside the window is caught by pointer capture. Don't reintroduce a silent `data-drag="0"`.

## Reference numbers

- Elements: soul match x1.5, soul opposite x1/1.5 (pairs fire/water, earth/air, dark/light: `ELEM_OPP`); against monsters the wheel water > fire > air > earth > water plus dark <> light (`ELEM_BEATS`): a skill that beats the monster's element x1.5, one it beats or its own element x1/1.5 (`ELEM_BOOST`, soul and wheel stack).
  Soul unlocks at level `SOUL_LV` 15 (Hanami's Kaede), passives at `PASSIVE_LV` 18 (3 slots exist, only `PASSIVE_OPEN` = 1 is usable, the others are locked for now). Skill level 1-5: +12% damage and -3% cooldown per level.
  Boss skills: each of the boss's 6 skills has a 10% chance per kill, per player who helped. Burn: a share (k) of the hit's damage every second. Pull = negative knockback.
  Drops: 35% per kill (a boss always 3), upgrade to level n needs `UP_COUNT` 4 / 6 / 9 / 14 drops + coins (`UP_COINS` x (n-1)^1.7) and, at level 5, 2 boss trophies.
