# Skill 2 with two modes: tap and hold (stem `skill-hold`, prefix `sh` / `SH_`)

A skill-2 entry of a skill set may carry `alt`, a **held mode**. A press shorter than `alt.secs` casts the skill as before; holding at least `alt.secs` and releasing casts the held mode. Binary, not a charge. Built for the combo rework (`docs/skillkits/COMBO-REWORK.md` section 2, E4): Brynja's Frost Line, Tamsin's Dig In, Meleni's Ebb.

## Rules

- `alt:{name, desc, secs, mult, range, act:[kind, seconds, lands], anim, fx, cd}`: `secs` 0.3 to 1.2 (default `SH_TAP_MAX` 0.5); `mult`, `range` and `fx` are complete (never merged into the tap's); `act[0]` is a new attack kind; `anim` one another skill borrows; `cd` optional (the tap's otherwise); `fx` has a shape and is no buff.
- Position 2 only (on 1 or 3 the set is left out). A bad `alt` leaves the set in and only the held mode out, listed in `SH_BAD` `{id, why}`.
- **One slot, one cooldown.** The held cast is made under the base piece's id (`shCastAb`): its skill level, `ultCdK`, the burst's boost (`ultBoostActS`), `cast2` triggers and the cooldown passives are the piece's; `alt.cd` only changes the cooldown's base length.
- The held row lives in `SH_ALT[<piece id>]` = `{id:'<piece>_h', base, set, pos:2, slot:'skill', cls, el, lv, ...}`. It is **not** in `SKILLS` (shops, drops, loadouts iterate it); its act kind is in `ACT_SKILL` / `ANIM_OF`. `shSkillRow(id)` finds a `SKILLS` row or a held row by its `_h` id.
- **The server times the hold.** `{t:'hold', on:1, k:'skill'}` sets `p.holdT2 = S.t`, only while skill 2 is ready (`p.cd.skill <= 0.08`) and never on the Proving Isle; the release is the ordinary `atk`; `shReleaseP` returns the held row when `S.t - holdT2 >= secs` and always clears it. `on:0` cancels; an `atk` during the cooldown clears it. The client never sends a duration.
- A held cast's events (`area`, `proj`, `beam`, `chain`) carry `<piece>_h` as their piece (`p.act.src`), so the look draws it with its own recipe key `'<piece>_h'` (`skvRecipeOf` never falls back to the tap's position recipe for it).
- **The client** (`game/combat/skill-hold.js`): only a skill 2 with an `alt` waits for the release; every other skill 2 still fires on key down (key repeats included). The key (`kbIs(e.code,'skill')`), the right mouse button and `#abSkill` (touch and mouse) call `shDown` / `shUp`; the button glows while held and brightens once armed (`shHudTick`); the walk is slower while holding (`shMoveK`, 0.6). A weapon swap, a panel or death cancels the hold.

## Files and hooks

| File | What |
|---|---|
| `src/shared/skill-hold.js` | `SH_TAP_MAX`, `SH_SECS`, `SH_ALT`, `SH_BAD`, `shAltProblem`, `shDefine`, `shAltOf`, `shArmed`, `shCastAb`, `shSkillRow` |
| `src/shared/skillsets.js` | `'alt'` in `SS_ENTRY_KEYS`; `defineSkillSet` rejects it off position 2 and calls `shDefine` (`// skill-hold:`) |
| `src/server/skill-hold.js` | `shHoldP`, `shReleaseP` |
| `src/server/basic-hold.js` | `MSG.hold`: `k:'skill'` goes to `shHoldP` (`// skill-hold:`) |
| `src/server/combat.js` `handleAttack` | the cooldown early return clears `holdT2`; `alt = shReleaseP(...)`, `ab = shCastAb(ab0, alt)`; `p.act.src = alt.id` (three lines, `// skill-hold:`) |
| `src/game/combat/skill-hold.js` | `SHC`, `shDown` / `shUp` / `shCancel`, `shHudTick`, `shMoveK` |
| `src/game/ui/combat-hud.js` | the three inputs and `shHudTick` |
| `src/game/combat/attacks.js` | `doAttack(kind, hold, alt)`: the held row for the client's own swing and cooldown bar |
| `src/game/player/movement.js` | `shMoveK` |
| `src/game/combat/skill-vis.js`, `game/skillsets/looks.js`, `procs.js` | `_h` ids resolve through `shSkillRow` |
| `src/game/economy/skills.js` | `skHoldDescHtml`: "Tap: ..." and "Hold <secs> s: <name>. ..." |

Test: `node tools/skill-hold-smoke.js`. Protocol: `hold{on, k?}` in `docs/PROTOCOL.md`.

## Pitfalls

- The basic hold's send (`bhDown`) had slipped into a comment, so the server never timed a skill-1 hold online; it is sent again (found while building this).
- A held mode with a `vs` stamps `vs.sid = '<piece>_h'`: its proc badge resolves through `shSkillRow`.
