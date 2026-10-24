# Skill 1: attack speed, press and hold

Skill 1 (the basic slot) has no cooldown. Its pace is **attack speed**, and it has two modes. Code: `shared/basic-hold.js` (rules, pure), `server/basic-hold.js`, `game/combat/basic-hold.js` (input, charge on the button); test `node tools/basic-hold-smoke.js`.

- **Attack speed** (`aspd`: rolled gear line, passive stat, capped +60%; it also fills a hold faster, `bhFrac`): the pause between two swings is the row's old `cd` divided by it (`bhInterval`), and the swing / cast time of **every** slot is divided by it (`bhActDur`). Cooldowns of skill 2 and burst are unchanged. Buffs' basic-cooldown x still stack as before.
- **Charge gain** (`chg`, capped +100%): multiplies the Deep Cave charge a cast earns (`caveHitS`, server/cave.js).
- **Press** (a tap under `BH_TAP` = 0.25 s): the skill as it is (times its set's `style`).
- **Hold**: the server times it (`MSG.hold` then the `atk`; the charge starts when skill 1 is ready again), the attack fires on release, strength f 0.2..1 (`BH_FULL`: warrior 0.9 s, archer 1.0, mage 1.1). The release is `bhHoldAb(ab, cls, f)`, a copy of the row with new fx:
  - warrior: wider and heavier cone / ring / beam, knockback, the swing ends 35% slower, you walk at 60% while charging; **full**: stuns (not bosses).
  - archer: aimed arrow (no homing, 1.5x speed), much stronger; **full**: bursts where it lands.
  - mage: the bolt becomes an explosion on the target (radius 2.2 to 6.5 m, `a.holdAt`), **full**: foes take 12% more for 6 s.
  - The set's own marks, statuses and allies carry over; a recovery of +40% x f follows a held release.
- **Sets**: a set's skill 1 is for ONE class (`pos[1].skill` has one key; 7 warrior, 6 archer, 5 mage), with optional `style:'press'|'hold'` (press x1.15 / hold x0.9, or the opposite) and `hold:{x:{...}}` (keys merged into the main shape at a full charge). Skills 2 and 3 are unchanged.
- **Removed**: accuracy / resistance (rolled stats `l` and `m` are now attack speed and charge gain, the same codes), the monsters' `res` / `acc`, the "Resisted" damage text.

Hooks (`// basic-hold:`): `handleAttack`, `resolveHitS` (combat.js), `doAttack` (attacks.js), the inputs in combat-hud.js, `speed` in movement.js.
