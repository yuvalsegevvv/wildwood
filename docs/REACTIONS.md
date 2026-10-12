# Elemental reactions (plan, and what is built)

**Status:** planned here; **R0 to R2 built** (the shared data, the server engine, the client's display; section 9). No kit, no skill set uses it yet: the debuffer kit (`docs/skillkits/kit-support.md`, the debuff focus) is the first that will. Master plan and decisions: `docs/SKILL-SETS.md` section 6b (this file is its detail and wins on the engine). Test: `node tools/reactions-smoke.js`.

**All numbers here are first guesses** (the owner: guidelines, balanced mostly in playtests). Every one is a named constant in `src/shared/reactions.js`.

## 1. What it is, in one screen

- A **direct hit** of an element (not `basic`) leaves an **aura** on the monster (6 s). A hit of a **different** element on a live aura **reacts**: the aura is consumed and **both elements' flavours** are applied to the monster at 0.7 of their strength. Same element: the aura is only refreshed.
- A **flavour** is one general status per element: fire `burn`, water `slow`, earth a short `stun`, air **spread** (the consumed aura is copied to enemies within 6 m), dark `weak` (the monster deals less), light `vuln` (the monster takes more). Six rows make the whole 15-pair chart.
- **Direct application** (`flavor:'<element>'` on a skill entry) applies one flavour at full strength to what the skill hits, with no partner needed: this is how a **single-element debuffer works**. A reaction (two flavours at 0.7 = 1.4 in all) is worth more than a direct application, so coordinating pays.
- Everything lands on the **monster** as **general (shared) statuses that never stack**: the stronger wins, the time refreshes, so a debuffer helps the whole party and two debuffers are not worth twice one. Only a kit's own marks stack, and those are not part of this (`SKILL-SETS.md` 6.1).
- The owner's rules this implements: a debuff system **inspired by elemental reactions** (the names, chart and numbers are this game's own), **direct application** because most sets are one element, **general statuses never stack and affect everyone**, a hybrid of two elements can **react with itself** (a solo player's way to react). `basic` (the first grinder) neither starts nor disturbs a reaction.

## 2. The rules in detail

1. **What leaves an aura:** every `damageMonsterS` call from a player with an effective element (a skill's `el`; an enchanting buff gives element-less attacks its element, as `elemHitS` does). **What does not:** burn ticks and a reaction's own burst (a quiet flag, `rxQuiet`), so nothing chains forever; later, a passive's triggered damage.
2. **One aura per monster**, shared by everyone (`m.aura = {el, until, by}`). A hit of the same element refreshes it. A hit of another element while it is live **reacts**; if that pair is in its internal cooldown (3 s per monster and pair) nothing happens (the aura stays).
3. **A reaction** consumes the aura (the triggering hit leaves none), applies the flavour of **each** of the two elements at the strength `k` (0.7; a chart row may override it), runs the row's optional **burst** (bonus damage, a share of the triggering hit), and tells the clients. **Spread** copies the consumed aura onto monsters within 6 m (same run, no live aura of another element): it never triggers a reaction there, so it cannot chain.
4. **Direct application** (`flavor`) is applied in `statusS` (where `stun` / `slow` / `burn` already are) and works on the entries that call it: a skill's `ring`, `cone`, `proj` (and its splash) and `zone`. A `flavor:'air'` spreads the aura its own hit left. A general status can also be applied by name: `status:{kind:'vuln'|'weak'|'slow'|'stun', v, dur}`.
5. **Strength** scales the *magnitude* of `vuln`, `weak` and `burn` (their `v` / `k`) and the *time* of `slow` and `stun`. Caps: `vuln` and `weak` at 0.30 (`RX_ST_CAP`), so a debuffer's reach is bounded and a party of damage-only sets reacting by accident stays below what a debuffer applies on purpose.
6. **No stacking:** a status of the same kind with a smaller value is ignored, an equal one only refreshes the time, a larger one replaces it. `burn` follows the same rule through its existing fields; `slow` and `stun` keep the longer time.
7. **Who is affected:** every monster, bosses included, except that `stun` never lands on a boss or a heavy enemy (as today). Dungeon monsters follow the same rules inside their run (events are tagged with the run; spread stays in the run).
8. **Where the numbers are read** (the only two places): `vuln` in `damageMonsterS` (the hit's damage times 1 + v, so zone tiers and `monK` still scale it and burn ticks feel it); `weak` in `hurtP` (the monster's hit times 1 - v, **before** the 10% floor on what a player takes, which still holds).
9. **Modifiers a kit can add** without touching the engine: a passive stat `rxk` (reactions you trigger are that much stronger) and `rxicd` (their cooldown is that much shorter), read with `psP`. They exist for the debuffer's passives (`Second Look`, `Reflector`) and cost nothing for anyone without them.

## 3. The flavours and the chart (first guesses; names are placeholders)

| Element | Flavour | At strength 1.0 (direct) |
|---|---|---|
| fire | `burn` | 25% of the hit's damage every second for 4 s (the existing burn) |
| water | `slow` | slowed for 3 s (the existing slow) |
| earth | `stun` | stunned for 1 s (not bosses or heavy enemies) |
| air | **spread** | the aura is copied onto enemies within 6 m |
| dark | `weak` | the monster deals 25% less for 6 s |
| light | `vuln` | the monster takes 20% more for 6 s |

A reaction applies both rows at `k` = 0.7 (so light + fire is burn 17.5% a second and `vuln` +14%). Fifteen pairs, each a one-line `defineReaction` in `src/shared/reactions-chart.js` (a closed set: six elements make exactly fifteen, so one file, not fifteen):

| Pair | Name (placeholder) | Effect |
|---|---|---|
| fire + water | Steam | burn + slow, and a **burst** of 60% of the hit |
| fire + earth | Cinder | burn + stun |
| fire + air | Wildfire | burn + spread |
| fire + dark | Smoulder | burn + weak |
| fire + light | Flare | burn + vuln |
| water + earth | Mire | slow + stun |
| water + air | Squall | slow + spread |
| water + dark | Murk | slow + weak |
| water + light | Prism | slow + vuln |
| earth + air | Dust | stun + spread |
| earth + dark | Barrow | stun + weak |
| earth + light | Flint | stun + vuln |
| air + dark | Dusk | spread + weak |
| air + light | Halo | spread + vuln |
| dark + light | Eclipse | weak + vuln, both at **full** strength (`k` 1.0) |

The two overrides (Steam's burst, Eclipse's full strength) are the first draft's; any row may carry `k` or `burst`.

## 4. Files (stem `rx`)

| Layer | File | Owns |
|---|---|---|
| shared | `src/shared/reactions.js` | the constants `RX_*`, the six flavours, `defineReaction` (validation, `RX_BAD`), `RX_CHART`, `rxPairKey`, `rxChartOf` |
| shared | `src/shared/reactions-chart.js` | the fifteen `defineReaction` rows |
| server | `src/server/reactions.js` | `rxHitS` (aura and reaction), `rxFlavorS`, `rxStatusS`, `rxDirectS`, `rxVulnK`, `rxWeakK`, `rxClearS`, `rxQuiet` |
| client | `src/game/combat/reactions.js` | the aura marker over a monster, the reaction's name, the status pops (`rxOn*`, `rxView*`) |
| test | `tools/reactions-smoke.js` | the checks of section 8 |

## 5. Hooks into existing files (each is one line marked `reactions:` in a comment; `grep -rn "reactions:" src` must match this table)

| File | Place | What |
|---|---|---|
| `server/combat.js` | `elemHitS` | `elemEffS(p,el)`: the effective element (an enchanting buff), shared with the aura |
| `server/combat.js` | `damageMonsterS` | `vuln` raises the hit; after the kill check `rxHitS` leaves the aura or reacts |
| `server/combat.js` | `killMonsterS` | `rxClearS(m)` clears aura, statuses and cooldowns |
| `server/combat.js` | `statusS` | the `flavor` and `status` keys |
| `server/combat.js` | `updateBurnS` | burn ticks are quiet (`rxQuiet`) |
| `server/players.js` | `hurtP` | `weak` lowers what the monster deals |
| `shared/` (manifest) | after `elements.js` | `reactions.js`, `reactions-chart.js` |
| `game/net/client.js` | `applyEvent` | the cases `aura`, `react`, `st` (three lines) |
| `game/combat/monsters.js` | `updateMonsters`, `removeMonView` | the marker follows the monster and goes with it |
| `styles/09-combat-hud.css` | next to `.dmg.crit` | `.dmg.react` (a reaction's name) and `.dmg.rxst` (vulnerable / weakened) |
| `package.json`, `CLAUDE.md` | the test lists | `tools/reactions-smoke.js` |

## 6. Protocol (events only, never in the snapshot; tagged with the run like every event)

| Event | Fields | When |
|---|---|---|
| `aura` | `[monId, el, dur]` (`el` 0 = gone) | a new or changed aura, a consumed one, and a refresh only when under half of its time is left (so a ticking zone sends about one every 3 s) |
| `react` | `[monId, pairKey]` | a reaction fired (`'fire\|water'`) |
| `st` | `[monId, kind, v, dur, by]` | `vuln` or `weak` set or replaced, a refresh under half time |

`slow`, `stun` and `burn` keep using the snapshot's flag bits and their effects as today.

## 7. What the debuffer kit asks of this (so the kit is data later)

- Direct `flavor:'light'` on its three actives (`vuln`: small on one target, stronger in an area, a big capped one for the burst): `status` / `flavor` keys on `ring`, `cone`, `proj`, `zone` entries.
- Its auras and reactions with partners: `rxHitS`, nothing else.
- Its passives and bonuses: `rxk` (reactions it exposed are stronger), `rxicd` (a shorter cooldown) through `psP`.
- Its marks (Glare) are `SKILL-SETS.md` 6.1 (M2a), not this file.
- A party of two debuffers must not double: the no-stacking rule does it.

## 8. Tests (`tools/reactions-smoke.js`)

The chart (15 pairs, none missing, a bad row listed in `RX_BAD` and left out); an element-less hit leaves no aura; a hit leaves one and refreshes it; two elements react once, consume the aura and apply both flavours at 0.7; the cooldown holds; burn ticks and a reaction's burst leave no aura; `vuln` raises damage for every player and burn ticks; `weak` lowers a monster's hit and the 10% floor holds; no stacking (smaller ignored, equal refreshes, larger replaces; two sources never add); caps; `stun` does not land on a boss; `flavor` and `status` on a skill's fx; spread stays inside a dungeon run and cannot chain; death clears everything; `rxk` / `rxicd` passives change a reaction; events are few; a hybrid hits itself into a reaction. `tools/client-smoke.js` has one check for the display (a marker per monster that changes element and goes with its aura, the notes pop without error).

## 9. Milestones

| | What | State |
|---|---|---|
| **R0** | the shared data: constants, flavours, registry, the fifteen rows | built |
| **R1** | the server engine and its hooks (section 5) | built |
| **R2** | the client: the aura marker, the reaction's name, the status pops | built |
| R3 | a "Reactions" chart in the skills panel (six flavours, fifteen pairs), the target frame's status icons | later |
| R4 | optional `infuse` (an ally buff that makes element-less attacks react: `SKILL-SETS.md` decision 23) | later, if wanted |
| R5 | the kits' use: `flavor` / `status` / `rxk` / `rxicd` in the debuffer kit | with that kit |

## 10. Decisions and open questions

- **On by default** (`RX_ON`): reactions work for every elemental skill today, boss skills and all, because a hybrid's self-reaction and "a party of single-element sets reacts without planning" need them to; set `RX_ON` to false to switch the whole thing off. (The owner asked for the combat changes first; revisit if the playtest says otherwise.)
- **A smaller status never refreshes a larger one** (my reading of `SKILL-SETS.md` 6.2), so a weak source cannot keep a debuffer's status alive.
- **Bosses are affected** by `vuln` and `weak` (that is what makes a debuffer worth bringing to a boss), not by `stun`.
- **Monsters' own element does not change their flavours or auras** (it does not change the damage they deal either: `docs/NOT-BUILT.md`): a fire monster burns as readily as any.
- Open: whether burn should stack-replace or strictly follow the no-stacking rule everywhere (it does now); the numbers of section 3; the names; whether `infuse` is wanted.
