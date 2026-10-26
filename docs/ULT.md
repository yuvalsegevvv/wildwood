# The 5th skill slot: the set burst ("Burst")

Rules (Yuval's decisions, 2026-10-26). The full plan with the client and the buff vocabulary is `/mnt/project-files/burst-skill-plan/PLAN.md`; one idea per set: `IDEAS.md` beside it. Stem `ult` (slot 3 is shown as "Power" but its code id stays `burst`: never name anything `burst*` for this slot).

## 1. Rules

- One burst skill per skill set (`ult:{}` in the set's own file), worn in a 5th slot, key `ult` (Digit5), level 35, off on the Proving Isle. Works with any class and without the set worn (then it buffs nothing).
- **Fixed cooldown 60 s.** Nothing reduces it (not the `cd` passive, rolls, ally haste, `ssCdrS`, the cave Echo, a boost). A grind set (`role.main:'grind'`) gets 30 s when cast outside a boss fight (`p.cave.fight`), 60 s inside; fixed at the cast.
- Damage about x1.5 the set's slot-3 skill (an ordinary `fx` shape: ring, cone, proj or zone). **Stun 5 s** on what it hits, bosses and heavy enemies included, **no x1.5** on a boss. One burst stun per enemy per 50 s, whoever casts it (`m.ultLock`, on the monster); only `resetBossS` clears it.
- Boss: the freeze is `B.ultStunT`, never `B.stunT` (the x1.5 and the kits' "strike now" windows read that one). A burst during a kit's stun is queued (`B.ultStunQ`) and starts when it ends.
- Buffs 2 of the set's 7 pieces (3 actives, the cave skill, 3 passives) for 8-20 s, at least one an active (U2; the data is validated now).
- Never counts toward the 3- / 5-set bonuses (it is in neither the active slots nor the passive slots `ssCount` walks).
- **Getting it (temporary):** any 3 of the set's 7 pieces owned (`ultOwned`, derived, never saved). The worn burst is `gear.skills.ult` (a set id).

## 2. Files

`shared/ult.js` (constants, `ULT_SKILLS`, `ultDefine`, `ultOwned`, `ultCdOf`), `server/ult.js` (`ultCastP`, `ultEquipP`, `ultCheckP`, `ultStunS`), `tools/ult-smoke.js`. Messages: `atk{k:'ult'}`, `ultequip{id|null}`. Events: `ult [pid, setId, cd]`, `ultget [pid, setId]`. Testing tool: `dev ult` (positions 1 and 2 of every set, clears the cooldown and the locks).

## 3. Hooks (`grep -rn "// ult:" src`)

| File | Hook |
|---|---|
| `shared/skillsets.js` `defineSkillSet` | registers the set's `ult` entry (`ultDefine`) |
| `shared/classes.js` | `slotLv('ult')`, `newSkills().ult` |
| `server/combat.js` | `handleAttack` dispatches `k:'ult'`; `statusS` runs `ultStunS` for a shape with `ult:true` |
| `server/boss.js` | `makeBossS` / `resetBossS` / `updateBossS` / `bossState` (`ultStunT`, the queue, the lock) |
| `server/dungeons/instances.js` | the run's boss row shows the freeze as stunned |
| `server/players.js` | `sanitizeSkills`, `sanitizeGear` (the worn burst must be owned), `newPlayer` (`ultInitP`, `cd.ult`) |
| `server/skillsets.js`, `server/cave/methods.js` | `ultCheckP` after a piece or a cave skill is earned |
| `server/economy.js` | `devP 'ult'`, `ultCheckP` after the "learn every skill" tool |

Client (U3): `game/ult/slot.js` (the 5th tile, `#abUlt`, key `ult` = Digit5, cooldown ring, boost glow `ultb` on the boosted pieces' tiles, the skills panel's Burst row and tab: equip / take off with buttons, no drag), `game/ult/popup.js` + `styles/32-ult.css` (the cast card: the set's emblem behind the gem-shop portrait, `#ultPopup`), buffed looks (`SSL.ub` in `game/skillsets/looks.js`: a third more motes, glowing, bigger; own casts read `ULT_UI.boost`, other players' swings the 5th field of the `pact` event). Events handled through `EVH.ult` / `EVH.ubo` / `EVH.ultget`, message `ubo {ids}` when a boost ends. Slot 3 is shown as "Power" (labels only).

Built in steps (PLAN.md section 5): U1 the slot and the cast, U2 the buff, U3 the client, U4 the content of the 21 sets (done: each set's `ult:{}` entry; boosts per IDEAS.md, mults about 1.5-1.65x the slot-3 skill, balanced with `node tools/skillsets-ladder.js --ult`).
