# Combo rework: six kits whose skills should work together (BUILT, except the visual upgrade plans)

> **Status**: the engine additions E1-E5 and the six kits' data, kit text and panel text are built (the owner's section 11 answers: the recommended defaults, every number as written below); the "Visual upgrade plan" parts of sections 3-8 are built too (the `vis` recipes, the looks' `proc` / `fxa` / `ally` hooks, `SSV_SHAPE.vigil` a flame; `docs/skillkits/VISUALS.md`, "Combo and synergy payoffs"). Left out of them: Sorrel's lens over the target at a full-draw shot (the client cannot tell a full draw from a tap; the Sight pip flying in shows it), Sorrel's denser muzzle spiral on an exposed target. Tests: `tools/skillsets-smoke.js` (E1-E3, E5 checks), `skill-hold-smoke.js` (E4), the kits' blocks in `skillsets-v3b-smoke.js`, `skillsets-first8-smoke.js`, `skillsets-isles-smoke.js`; balance `node tools/skillsets-ladder.js --combo`.
>
> For the agent that implemented it: read this file, `AUTHORING.md` (what a piece may use) and only the files named in each step. Every number is a first guess inside the bands of `RULES.md` section 2; section 9 says how to check them. The 3- / 5-set bonuses stay off (`SS_BONUS_ON`), the Burst (`ult`) entries are not touched, piece ids and positions do not change (the `ult.boost` rows keep pointing at the same pieces).

Picked kits: **Brynja, Sefi, Sorrel, Hollis, Tamsin, Meleni**.

| Kit | The combo in one line |
|---|---|
| Brynja (risk, water) | shots build Rime, **Glide and Cut** hits the rimed harder and chills, **Whiteout** shatters the chilled (x1.5). Skill 2 held = a safe frost line that chills from range |
| Sefi (risk, air) | cuts build Stride, **Dead Heat** spends them and each one resets **Gust Dash**, which hits the staggered target x2 ("the second lap") |
| Sorrel (safe, air) | **Mark the Gap** opens a 5 s gap (Sight + exposed), **Long Gale** through the gap x1.2; charged basic shots now build Sight too |
| Hollis (healer, dark) | **The Long Night** fills Vigil on everything, **Dusk Lent** returns it: its party heal now grows with Vigil |
| Tamsin (grinder, earth) | **Pull the Slope** rattles what it gathers; sweeps and **The Mountain Moves** hit the rattled harder, so the two fields are overlapped. Skill 2 held = dug in at her own feet |
| Meleni (buff support, water) | skill 2 is two modes: held **Ebb** pulls and lays Swell, tapped **Landfall** spends it for might and every Swell spent brings **Call the Tide** back sooner; the tide itself lays Swell |

## 1. How synergy was judged

Each of the 24 kits (`src/shared/skillsets/<id>.js`) got 0-2 points on four questions, counting only what a player has at Bond 0 (three actives and the kept passive; Bond rows as a tie-break):

- **Link**: how many of the three actives touch the kit's mark or each other's effect (0 none, 1 two of them, 2 all three).
- **Order**: does casting them in a certain order pay (0 no, 1 only "build then spend", 2 a real order or window).
- **Own**: is the loop the kit's own (0 a copy of another kit's numbers and shape, 2 unique).
- **Text**: does the text say what the data does, and do the passives feed the loop (0 mismatch or an anti-synergy, 2 clean).

| Kit | Role | Link | Order | Own | Text | Sum | Note |
|---|---|---|---|---|---|---|---|
| Sazanka | risk | 2 | 2 | 2 | 2 | 8 | from behind, slip, flurry: the model |
| Brindle | safe + support | 2 | 1 | 2 | 2 | 7 | Glints feed the buff and the pop |
| Corvin | debuff | 2 | 1 | 2 | 2 | 7 | Glare grows every vuln |
| Ottoline | support | 2 | 1 | 2 | 2 | 7 | Strings grow weak and might |
| Torgeir | tank | 2 | 1 | 2 | 2 | 7 | build, Brace reads, Hold the Line spends |
| Genzo | tank + heal | 2 | 1 | 1 | 2 | 6 | Torgeir's shape plus heals |
| Dessa | tank | 2 | 1 | 1 | 2 | 6 | |
| Pell | safe | 1 | 1 | 2 | 2 | 6 | Lure only from skill 2, but Night Eyes reads it |
| Marigold | safe + support | 1 | 1 | 2 | 2 | 6 | Center Stage ignores Applause |
| Atuqa | tank | 2 | 1 | 0 | 2 | 5 | Torgeir's numbers on purpose |
| Ogden | grind | 2 | 1 | 1 | 1 | 5 | |
| Tzaya | grind | 2 | 1 | 0 | 2 | 5 | Ogden's numbers |
| Sabir | risk | 2 | 1 | 1 | 1 | 5 | the plain builder / spender (kept as the baseline risk kit) |
| Dunstan | buff | 1 | 1 | 1 | 2 | 5 | Banner Down ignores Fervor |
| Zahra | buff | 1 | 1 | 1 | 2 | 5 | Dunstan's shape, other buff kinds |
| Ambrose | heal | 1 | 1 | 1 | 2 | 5 | High Water ignores Ripple |
| Nephra | heal | 1 | 1 | 2 | 1 | 5 | Rise Again ignores Linen |
| Tansy | grind | 1 | 1 | 2 | 1 | 5 | no mark; pull then ring is a link by geometry only (left alone: the first, easiest set) |
| **Brynja** | risk | 2 | 1 | 0 | 0 | **3** | Sabir's shape; the header promises Momentum, nothing reads it; the text says "chills for 4 s", the data is 1.5 |
| **Sefi** | risk | 2 | 1 | 0 | 1 | **4** | third copy of dash + pop; her lever (speed of killing) lives only in Bond VI |
| **Sorrel** | safe | 1 | 1 | 1 | 0 | **3** | basic never touches Sight; Mark the Gap does nothing but the mark; Cold Eye (crit at full health) dies after the first hit |
| **Hollis** | heal | 1 | 1 | 0 | 0 | **2** | Ambrose's numbers; `kit.text` and the header say The Long Night returns the Vigil, the data pops it in Dusk Lent; skill 3 ignores the mark |
| **Tamsin** | grind | 0 | 1 | 0 | 1 | **2** | Tansy's numbers, no mark, nothing reads anything |
| **Meleni** | buff | 1 | 1 | 0 | 2 | **4** | Dunstan's numbers on purpose; Call the Tide ignores Swell |

The six lowest are reworked. Atuqa and Tzaya are copies too, but of kits whose loop already works.

**Why the power band is small.** In every kit the basic attack is 65-75% of the damage, so an order between skill 2 and skill 3 moves the total by a few percent. The targets below: **the right order is worth about +4 to +6% over today, no order about -3 to -6%.** The feel comes from the big number on the payoff hit and its badge, not from the average.

## 2. Engine additions (four small ones, each read in one place)

Ask the owner before building (`AUTHORING.md` section 7). Add each to the table in `docs/SKILL-SETS.md` section 10 and to `AUTHORING.md` section 4.

### E1. `fx.vs`: a skill's own conditional multiplier (used by Brynja, Sefi, Sorrel, Tamsin)

`vs:{when:{...}, k, name}`: this skill's damage x `k` on a target for which the `when` holds. It reuses the existing condition table (`ssWhen`), so no new condition logic.

- `src/shared/skillsets.js`: add `'vs'` to `SS_FX_MODS`; in `ssFxProblem`: `vs` is `{when (checked by ssWhenProblem), k (above 1, at most 3), name (1 to 24 characters)}`; **reject the `when` keys `crowd`, `allies` and `taunting` inside a `vs`** (they scan `MONS`, and `fxModK` runs once per hit: the tick's cost rule in CLAUDE.md section 5). When a set is expanded, stamp `fx.vs.sid = <the piece id>` on the built row.
- `src/server/skillsets.js`, `fxModK(f,p,m)`: the early return also tests `f.vs`; then `if(f.vs&&ssWhen(p,m,f.vs.when)){ k*=f.vs.k; ssVsProcS(p,f.vs,m); }` marked `// skillsets: a skill's own conditional multiplier (vs)`. `ssVsProcS` sends `ev('proc',p.id,vs.sid,m.id)` at most once every 0.5 s per piece (`p.ssIcd['vs:'+vs.sid]`). `fxModK` is already called for ring, cone, beam, chain, projectile impact, zone ticks and pop damage, so nothing else changes. **A pop's damage is multiplied too** (as `behind` already is): the numbers below count on it.
- `src/game/skillsets/procs.js`, `sspRow`: accept an active piece id (`SS_PIECE_OF[rowId].kind==='active'` and the `SKILLS` row has `fx.vs`) and return `{set, row:{name: fx.vs.name}}`, so the existing badge, ring and streak show the combo's name.
- `shared/awakening.js` `awkFx`: check it copies an unknown key unchanged (`vs.k` must not scale with the skill level).
- `docs/PROTOCOL.md`: the `proc` event's row id may be an active piece id.

### E2. A `when` key `slowed:true` (used by Brynja, Tamsin)

Holds while the target is slowed (`m.slowT>0`). `SS_WHEN_KEYS` and the `true` list in `ssWhenProblem` (`shared/skillsets.js`); one line in `ssWhen` (`server/skillsets.js`): `if(w.slowed&&!(m&&m.slowT>0)) return false;`. A fighter on the Proving Isle (`m.pl`) has no `slowT`: it simply never holds there. A slow reaches a boss (`statusS` has no boss exception), so the combos work on bosses.

### E3. `pop.cdr`: spent marks take time off a cooldown (used by Sefi, Meleni)

`pop:{id, k, r, heal, cdr:{basic|skill|burst: seconds per stack}, cdrMax}`. In `ssPopS` count the stacks spent over all targets; after the loop `if(P.cdr&&spent) ssCdrS(p, each value x Math.min(spent, P.cdrMax||5))`. Validation in the `pop` check of `ssFxProblem` (reuse `ssCdrProblem`; `cdrMax` 1 to 10). `ssCdrS` already sends the `cdr` event, so the slot's tile flashes with no client work. The slot being cast has its cooldown set before the pop runs, so a pop may also shorten its own slot: do not use that.

### E4. Skill 2 with two modes: tap and hold (stem `skill-hold`, prefix `sh` / `SH_`; used by Brynja, Tamsin, Meleni)

**Today**: only skill 1 has a hold. `bhDown` sends `{t:'hold',on:1}`, the release is the ordinary `atk`, and the server times the hold itself (`MSG.hold`, `bhReleaseP`, `server/basic-hold.js`). Skill 2 fires at once on key down, right mouse down or a tap on `#abSkill` (`game/ui/combat-hud.js` lines 131, 136, 149: `doAttack('skill')`), and `handleAttack` (`server/combat.js` line 13) reads a hold only for `k==='basic'`.

**Design: binary, not a charge.** A skill-2 entry may carry `alt:{name, desc, secs, mult, range, fx, act:[kind, seconds, lands], anim, cd}`. A press shorter than `secs` (0.3 to 1.2; default 0.5) casts the entry as today; holding at least `secs` and releasing casts `alt`. One slot, one cooldown (`alt.cd` may give the held mode its own length). `alt.mult` and `alt.fx` are complete (not merged into the tap's).

| Where | What |
|---|---|
| `src/shared/skill-hold.js` (new, in `shared` before the set files) | `SH_TAP_MAX`, `SH_ALT` (piece id -> the alt's row: `{id:'<piece id>_h', base:'<piece id>', set, pos:2, slot:'skill', ...alt}`), `shAltOf(skillId)` (own-property check), `shArmed(heldSeconds, alt)` |
| `src/shared/skillsets.js` | `'alt'` in `SS_ENTRY_KEYS`, accepted on position 2 only; checked like an entry (`ssFxProblem`, a unique `act` kind, a known `anim`); registers `SH_ALT` and the alt's kind in `ACT_SKILL` / `ANIM_OF`. A bad `alt` leaves the set in and only the alt out, listed in `SH_BAD` (rule 5) |
| `src/server/skill-hold.js` (new) | extends the hold message: `{t:'hold',on:1,k:'skill'}` sets `p.holdT2=S.t` (only when `p.cd.skill<=0.08`); `shReleaseP(p, ab0)` returns the alt row when `S.t-p.holdT2 >= alt.secs`, and clears it. The client never sends a duration |
| `src/server/combat.js` `handleAttack` | one line `// skill-hold:`: for `k==='skill'`, `ab = shReleaseP(p,ab0) || ab0`; `p.act.sid` stays the **base piece id** (skill level, `ultCdK`, `ultBoostActS`, `ssTriggerS('cast2')` all keep working) and `p.act.src = ab0.id+'_h'` so events name the held mode |
| `src/game/combat/skill-hold.js` (new) | `shDown` / `shUp` / `shCancel`, the fill on `#abSkill`, `bhMoveK`-style slower walk while holding. **Only a skill that has an alt waits for the release**; every other skill 2 still fires on key down (no added delay) |
| `src/game/ui/combat-hud.js` | the three skill inputs call `shDown` on down and `shUp` on up (key through `kbIs(e.code,'skill')`, right mouse button, `touchstart` / `touchend` on `#abSkill`) |
| `src/game/combat/skill-vis.js` line 89, `game/skillsets/looks.js` | where a piece id is turned into a skill row for the look, an id ending `_h` resolves through `SH_ALT`; its recipe is the vis key `'<piece id>_h'` (the exact-id key already exists) |
| `src/game/economy/skills.js` (`skInfoHtml`) | the skill's details show both modes: "Tap: ..." and "Hold: ..." |
| `docs/SKILL-HOLD.md`, `docs/PROTOCOL.md` (`hold.k`), `tools/skill-hold-smoke.js` + a row in `tools/tests.json`, `src/manifest.json`, `python3 build.py --write-index` | |

Test (`skill-hold-smoke`): a tap casts the base; a hold of `secs` casts the alt; a hold message with no wait casts the base (the server's clock decides); the cooldown and the skill level are the base piece's; an `atk` during the cooldown clears `holdT2`; a bad `alt` is listed in `SH_BAD` and the set still registers; the Proving Isle's fixed loadout ignores it.

### E5. `kit.combo` (data only: the text the player reads, and the order the ladder bot plays)

`kit:{..., combo:{order:['skill','burst'], win:4, text:'...'}}`: `order` = cast the second slot within `win` seconds after the first; `text` = one sentence shown under the kit's text. Check it in `defineSkillSet` (slots from `SLOTS`, `win` 1 to 12, text up to 160 characters). Show it in the set's card (`game/skillsets/panel.js`, where `kit.text` is drawn). `tools/skillsets-ladder.js`: a flag `--combo` makes the bot hold `order[1]` until `order[0]` was cast within `win` (and, when `order[0]` is `'burst'`, until the target carries the kit's full mark stack); print both columns.

## 3. Brynja, The Rime Run: build, chill, shatter

(Sections 3 to 8 are the first pass. The second pass, which made the combo worth about 20%, changed the multipliers listed in section 9b: read those numbers there.)

File `src/shared/skillsets/brynja.js`. Look `src/game/skillsets/look-brynja.js`. Test block in `tools/skillsets-v3b-smoke.js`. Cave skill `shared/cave/skill-4-blackice.js` (unchanged: its lane slows and lays Rime every second, so it is a second way to set up the shatter).

**Now.** Icicle Shot (2.25, Rime; a full hold chills 3 s) / Glide and Cut (dash, ring 3.4 m, 1.45, `slow:1.5`, Rime, cd 8) / Whiteout (projectile, splash 6 m, 3.4, pops Rime k 0.8, cd 30). **Problem**: Sabir's kit in blue. The chill does nothing for her; the text promises 4 s of chill and gives 1.5; nothing rewards an order.

**New order**: shots (Rime) -> Glide and Cut (x1.4 on a rimed target, chills 4 s) -> Whiteout inside the chill (x1.5, pop included).

| Piece | Change |
|---|---|
| `kit.text` | `'Every cut leaves Rime (up to 5). Glide and Cut hits a rimed target harder and chills it; Whiteout shatters the chilled for half again as much and spends the Rime.'` |
| `kit.combo` | `{order:['skill','burst'], win:4, text:'Shoot to five Rime, glide in, then loose Whiteout while the target is still chilled.'}` |
| pos 1 `archer` Icicle Shot | unchanged (its full hold's `slow:3` is the ranged way to chill) |
| pos 2 `any` Glide and Cut | `mult:1.45` -> `1.2`; ring `slow:1.5` -> `slow:4`; add `vs:{when:{marked:'rime'}, k:1.4, name:'Cold Read'}`. Desc: `'Skate up to 9 m to your target and cut everything round it: 40% harder against a target carrying Rime. Chills what it hits for 4 seconds and leaves Rime on each. Hold: Frost Line.'` (The ring applies its mark after its damage, so its own Rime never switches the bonus on.) |
| pos 2 `alt` (E4) | `alt:{name:'Frost Line', secs:0.5, desc:'Stay where you are and send a line of frost 12 m ahead: light damage, 4 seconds of chill and Rime on everything in it.', mult:0.7, range:12, act:['brynja2xh',0.6,0.4], anim:'cast', fx:{cone:{r:12, arc:0.22, slow:4, mark:{id:'rime', n:1, dur:12, max:5}}}}` (a narrow cone, because a `beam` applies no status) |
| pos 3 `any` Whiteout | `mult:3.4` -> `2.9`; `pop.k:0.8` -> `0.7`; add `vs:{when:{slowed:true}, k:1.5, name:'Shatter'}`. Desc: `'Loose a blizzard at your target: it bursts over a 6 m circle. Spends every Rime there for extra damage. Shatter: everything that is already chilled when you loose it takes half again as much.'` The projectile's own `slow:2` stays (it lands after the damage, so it cannot enable itself; the pop is rolled at the cast). |
| passives, `bonds`, `ult` | unchanged. The header comment: replace the Momentum sentence with the order above |

**Payoff.** Whiteout at 5 Rime: today 3.4 + 13.6 = 17.0; new 13.05 unchilled (-23%), 19.6 shattered (+15%). Glide and Cut: 1.2 cold, 1.68 on Rime (+16%). The held Frost Line is the careful route (no dash into melee, no Cold Read) and the tap the risky one: that is the risk kit's choice.

**Tests.** v3b block: Glide on a monster with Rime deals 1.4x a Glide on a clean one (`still()` stub); a slowed monster takes 1.5x from Whiteout's impact and from its pop; Whiteout's own slow does not raise its own hit; the alt lays Rime and `slowT`>=4; `proc` events name `brynja_2_any` and `brynja_3_any`. `ult-smoke` (New boost of `a3`), `cave-sets-smoke` (Black Ice then Whiteout shatters).

### Visual upgrade plan

**Now** (`look-brynja.js`): only slot 3 and the ult have recipes. Whiteout's hit = one wind wave and six small ice walls; Glide and Cut and the shots fall back to the look's generic motes (shards, snow chaff); the Rime pips are shards (`SSV_SHAPE.rime`).

- **Glide and Cut** (`'2'`): `cast:[{wave:{shape:'arc',arc:0.3,r:9,style:'water',col:2,h:0.4,life:0.45}}, {prop:{kind:'icewall',n:5,arr:'ring',r:3.4,anim:'rise',size:0.5,life:4,cols:[2]}}, {decal:{r:3.4,life:4}}]`: a skate trail, then a low ring of ice that **stays for the 4 s of the chill**, so the player sees the window he has to hit.
- **Frost Line** (`'brynja_2_any_h'`): `cast:[{wave:{shape:'arc',arc:0.22,r:12,style:'water',col:2,h:0.5,life:0.6}}, {slabs:{where:'front',d:4,r:1,n:3,col:2}}, {slabs:{where:'front',d:8,r:1,n:3,col:2,at:0.1}}, {slabs:{where:'front',d:11,r:1,n:3,col:2,at:0.2}}]`.
- **Whiteout** (`'3'`): keep the hit; raise the walls to `n:8, size:1.0` and add `{flash:{}}`; `anim:'collapse'` instead of `'rise'` reads as breaking.
- **Shatter** (the proc): a look hook `proc:(L,o,row,mon)` in the look: when `row.name==='Shatter'`, `sslBurst` of shards at the monster with `fxpFlare`, a `skvWaveAt` 3 m inward, and `shake`; `'Cold Read'` only the default streak. The badge text comes from E1.
- **Rime at 5**: `marks.js` already pulses and haloes a full stack; no change.
- `skill-move.js`: check `SKM_TUNE` gives the alt's `cast` no step forward (it is the standing mode).

## 4. Sefi, The Long Run: spend, then run the second lap

File `src/shared/skillsets/sefi.js`. Look `look-sefi.js`. Test `tools/skillsets-v3b-smoke.js`. Cave skill Tailwind (reads Stride and refunds cooldowns: cast it **before** Dead Heat; unchanged).

**Now.** Passing Cut (1.5, Stride) / Gust Dash (dash past the target, ring 3.4 m, 1.2, Stride, cd 7) / Dead Heat (dash, ring 6 m, 2.4, `weak` 10% for 4 s, pops Stride k 0.8, cd 30). **Problem**: the third dash-and-pop kit; her own idea (cooldowns that fall) is only in the Bond VI row; Dead Heat's weakening leads nowhere.

**New order**: cuts to 5 Stride -> Dead Heat (spends them: each takes 1.4 s off Gust Dash, five reset it) -> Gust Dash at once, x2 on the weakened target, landing behind it with a fresh Stride. The finisher starts the next lap instead of ending the fight's rhythm.

| Piece | Change |
|---|---|
| `kit.text` | `'Every cut takes a Stride (up to 5). Dead Heat spends them all and each one brings Gust Dash back sooner; a Gust Dash into a weakened target hits twice as hard.'` |
| `kit.combo` | `{order:['burst','skill'], win:4, text:'At five Strides run Dead Heat, then Gust Dash straight through the staggered target.'}` |
| pos 1 `warrior` Passing Cut | `mult:1.5` -> `1.45` (pays for the payoff) |
| pos 2 `any` Gust Dash | `mult:1.2` -> `1.1`; add `vs:{when:{exposed:true}, k:2.0, name:'Second Lap'}`. Desc: `'Burst up to 10 m past your target on a gust and cut everything round where you land. Leaves a Stride on each. Second Lap: twice the damage against a weakened or exposed target.'` |
| pos 3 `any` Dead Heat | `pop:{id:'stride', k:1.0, r:6, cdr:{skill:1.4}, cdrMax:5}` (k 0.8 -> 1.0). Desc: `'Dash up to 12 m through your target and cut everything within 6 m of where you land, spending every Stride for extra damage. Each Stride spent takes 1.4 seconds off Gust Dash (five bring it straight back). What is cut is weakened for 4 seconds.'` |
| passives, `bonds`, `ult` | unchanged (Bond VI Crosswind's `cdr:{skill:1}` now stacks onto the same loop: intended) |

**Payoff.** Dead Heat at 5: 12.0 -> 14.4. Gust Dash: 1.1, or 2.2 on the second lap. Over 30 s, right order about +4%; Dead Heat at two Strides and no follow-up about -2%.

**Known side effect, to decide with the owner**: `exposed` is the shared status, so beside Corvin, Ottoline or Hollis every Gust Dash is a Second Lap (about +4% for her). I read that as party synergy; if it is not wanted, lower `k` to 1.6.

**Tests.** v3b block: Dead Heat with 5 Strides takes 7 s off `p.cd.skill` (and 2.8 s with 2); the `cdr` event is sent; Gust Dash on a `weak` monster deals 2x; `proc` names `sefi_2_any`. `ult-smoke` (boost of `a2`: `cd:0.4` and the refund together must not make the cooldown negative: `ssCdrS` clamps at 0, assert it).

### Visual upgrade plan

**Now**: slots 2 and 3 each draw one arc-shaped wind wave along the dash; the cut ring and the landing are generic; nothing shows the refund or the weakened window. Stride pips are thorns.

- **Gust Dash** (`'2'`): keep the arc; add `{dust:{}}` at the start, `{burst:{n:10,spd:5,at:0.25}}` and `{ring:{r:3.4,col:'hot',at:0.25}}` where she lands, and a `{swing:{n:1}}` so the cut reads as a blade, not a puff.
- **Dead Heat** (`'3'`): three staggered arcs like the ult's but along one line (`wave` with `arc:0.15`, `at:0, 0.08, 0.16`), then at the landing `{wave:{r:6,style:'wind',col:1,h:0.9,life:0.6,at:0.3}}`, `{rays:{at:0.3}}`, `{shake:{v:0.3,at:0.3}}`.
- **The refund**: `sspFlashSlot('skill')` already flashes the tile on the `cdr` event. Add in the look's `proc` hook for `'Second Lap'`: a gold streak (`cols[0]`) from her to the target, `fxpFlare` on it, and feathers (`sh:'feather'`) left along the path.
- **The window**: a weakened monster shows nothing today (`VISUALS.md`, known gaps). Smallest fix inside this kit: Dead Heat's cast lays `{decal:{r:6,life:4}}` (the scallop decal) for the 4 s of the window.
- Class flair (`skfCast`) stays the warrior's sparks; `skill-move.js` already steps into each blow.

## 5. Sorrel, The Lookout: spot the gap, shoot through it

File `src/shared/skillsets/sorrel.js`. Look `look-sorrel.js`. Test `tools/skillsets-first8-smoke.js`. Cave skill Eagle's Perch (+5% per Sight: unchanged, and now worth more because Sight comes faster).

**Now.** Clean Line (2.1, grows with range; a full hold exposes 10% for 5 s) / Mark the Gap (1.7, one Sight, cd 8) / Long Gale (5.6, range x2.4, pops Sight k 0.8, cd 28). **Problem**: Sight comes only from one cast every 8 s; the basic never touches it; Mark the Gap is a mark and nothing else; Cold Eye works on the first hit only. A safe kit has "no skill ceiling" (`RULES.md`), so the order here is short and forgiving.

**New order**: Mark the Gap (Sight, and the target is exposed for 5 s) -> Long Gale inside those 5 s (x1.2). Charged basic shots now lay Sight, so the basic is part of the build.

| Piece | Change |
|---|---|
| `kit.text` | `'Mark the Gap and a fully drawn Clean Line put Sight (up to 3) on the target; Long Gale spends it all, and hits harder still through an open gap.'` |
| `kit.combo` | `{order:['skill','burst'], win:5, text:'Mark the Gap, then loose Long Gale within five seconds.'}` |
| pos 1 `archer` Clean Line | `hold:{x:{status:{kind:'vuln',v:0.1,dur:5}, mark:{id:'sight', n:1, dur:12, max:3}}}` (`mark` is in `SS_HOLD_X`). Desc adds: `' A full draw also leaves Sight.'` |
| pos 2 `any` Mark the Gap | `mult:1.7` -> `1.5`; the projectile adds `status:{kind:'vuln', v:0.05, dur:5}`. Desc: `'A spotting shot at up to 36 m: it puts Sight on the target and opens a gap: the target takes 5% more from everyone for 5 seconds.'` |
| pos 2 passive Cold Eye (`sorrel_p2`, Bond I) | `when:{tgtHp:{above:0.95}}` -> `when:{exposed:true}`; `v:[0.10,0.01]` -> `[0.06,0.008]`; text `'+{}% critical hit chance against an exposed target'` |
| pos 3 all three classes (Long Gale, Gale Javelin, Prism Gale) | `pop.k:0.8` -> `0.7`; add `vs:{when:{exposed:true}, k:1.2, name:'Through the Gap'}`; each desc adds `' 20% harder against an exposed target.'` |
| `bonds`, `ult` | unchanged (Bond II Steady Breath, +10% per Sight, now meets a target that has Sight most of the time: watch the ladder's 3-set column) |

**Payoff.** Long Gale at 3 Sight before range scaling: today 19.0; new 17.4 outside the gap (-9%), 20.8 through it (+10%). The 5% vuln is hers alone when solo (about +3% at its uptime), paid for by Mark the Gap's lower hit. In a party with Corvin the stronger vuln wins and hers adds nothing: fine.

**Tests.** first8 block: a full-hold Clean Line leaves 1 Sight; Mark the Gap leaves `mstVulnK(m)` = 0.05; Long Gale on an exposed dummy = 1.2x (all three class versions); Cold Eye adds crit only while exposed. Ladder from 16 m (`--set sorrel`).

### Visual upgrade plan

**Now**: the best-drawn of the six: streak shots with feather trails, the lens closing on Mark the Gap's target with a 6 m dashed ring, a spiral of streaks on the charged Gale. Missing: the gap as a **window** (the lens vanishes after 1.1 s), and any sign that the Gale went through it.

- **Mark the Gap** (`impact`, the `sorrel_2_any` branch): lengthen the closing lens decal to `life:5` with `spin:0.3` and a low `op:0.5`, so the lens sits on the target for exactly the gap's 5 s; keep the 6 m ring as the first beat only.
- **Through the Gap** (the look's `proc` hook): on the target, `{shaft}`-like column in `hot2` plus `sslDecal` of the lens shrinking to nothing (`inward:true, life:0.3`), 12 feathers thrown along the shot's direction. The muzzle spiral for a pop already exists; give it `sslN(30)` when the target is exposed (the client can read the vuln note it already gets for the damage numbers; if not available, key it off the `proc`).
- **Full-draw Clean Line**: at release, when `hold` is 1, a `prop:{kind:'lens',n:1,where:'target',anim:'hover',life:0.8,size:0.6}` over the target: "a Sight was placed".
- Sight pips are rings: fine. The prop kind `lens` exists and is unused by her look: use it instead of adding anything.

## 6. Hollis, The Wake Lantern: the night keeps the vigil, the dusk returns it

File `src/shared/skillsets/hollis.js`. Look `look-hollis.js`. Test `tools/skillsets-v3b-smoke.js`, `tools/boss-duel.js --check`. Cave skill Lamp in the Window (+1 s per Vigil: cast it before Dusk Lent; unchanged).

**Now.** Candle Bolt (2.3, heals the lowest 2.5%, Vigil) / Dusk Lent (ring 10 m, 1.5, pops Vigil k 0.6 with half healing him, party heal 10%, shield 8%, cd 12) / The Long Night (ring 9 m, 2.8, vuln 8%, heal 30%, regen, shield 15%, cd 45). **Problem**: Ambrose's numbers; `kit.text` and the file header say The Long Night returns the Vigil, but Dusk Lent pops it; the party heal does not care about Vigil at all, so the healer's own loop has no reason to build.

**New order**: Candle Bolts keep Vigil -> (every 45 s) The Long Night fills Vigil to 5 on everything it touches -> Dusk Lent returns it: the pop, and **a party heal that grows with the Vigil kept**. No engine addition.

| Piece | Change |
|---|---|
| `kit.text` | `'Every blow leaves a Vigil (up to 5) on its target and The Long Night fills it; Dusk Lent returns every Vigil as a wave that hurts the enemy and heals the party more for each one.'` |
| `kit.combo` | `{order:['burst','skill'], win:8, text:'Light The Long Night first, then call Dusk Lent while the Vigil is full.'}` |
| header comment | say that Dusk Lent pops and The Long Night fills |
| pos 1 `mage` Candle Bolt | unchanged |
| pos 2 `any` Dusk Lent | `heal:{v:0.10, r:20}` -> `heal:{v:0.06, r:20, perMark:{id:'vigil', v:0.012, r:10, max:5}}` (6% with no Vigil, 12% with five; the utility is counted before the pop, so it reads the stacks it is about to spend). Desc: `'Call back every Vigil within 10 m: the dusk rolls over the enemies for damage for each Vigil, and a share of it mends you. The wave heals you and your allies for 6% of maximum health, and 1.2% more for each Vigil (up to five), and shields them for a moment.'` |
| pos 3 `any` The Long Night | `mult:2.8` -> `2.6`; the ring adds `mark:{id:'vigil', n:5, dur:12, max:5}`. Desc adds: `' Everything the dusk touches is left with a full Vigil.'` |
| passives, `bonds`, `ult` | unchanged |

**Payoff.** Dusk Lent on cooldown with no Vigil heals 6% (was 10%); kept to five it heals 12%, and after The Long Night it also pops five stacks on the whole pack (5 x 0.6 x 1.5 = 4.5 per enemy, half of it back to him). Damage stays in the healer's flat band: the bolt is 80% of it.

**Tests.** v3b block: Dusk Lent with 0 Vigil heals an ally 6% (x heal power), with 5 Vigil 12%, never above `SS_HEAL_CAP`; The Long Night leaves `ssMarkN`=5 on every monster within 9 m; Long Night then Dusk Lent pops them all. `boss-duel --check` (the healer's survival yardstick: the 6% floor is the risk).

**Optional later (E4)**: a held Dusk Lent, "Lend": does not spend, heals only the ally with the least health for 14% (`heal:{v:0.14, r:20, lowest:true}`), `mult:0.8`. Left out of the first pass: one two-mode healer skill should be playtested after the three below.

### Visual upgrade plan

**Now**: Dusk Lent = one dark wave 10 m out; The Long Night = ten lanterns rising in a ring and a dark wave; Vigil pips are bars. Nothing travels **back**, though the whole kit is about returning.

- **Dusk Lent** (`'2'`): make it two beats: `cast:[{wave:{r:10,style:'dark',col:0,h:1,life:0.7}}, {wave:{r:10,style:'dark',col:3,h:0.6,inward:true,life:0.7,at:0.45}}, {rise:{at:0.9}}]`: the dusk goes out dark and comes home amber (col 3), then motes lift off him. The spent-stack burst (`marks.js`) already fires on each monster at the same moment: colour-match by keeping `pal.accent` amber.
- **The Long Night** (`'3'`): keep the lantern ring; add `{prop:{kind:'moon',n:1,anim:'hover',size:1.2,life:2.4,cols:[2,0,3]}}` overhead and `{decal:{r:9,life:6}}` (the vuln's 6 s). The n:5 mark makes every monster's pips fly in at once (five bars each, the full-stack halo): that is the "lanterns lit all at once" moment for free.
- **Heal on allies** (`fxa`): the look's `fxa` hook: a small lantern (`sh:'lantern'` mote, amber, additive) drifts down onto each healed ally instead of the generic ring; a shield draws a ring of fog wisps (`sh:'wisp'`, col 2).
- **Vigil shape**: `SSV_SHAPE.vigil` from `'bar'` to `'flame'` (a candle flame; the shape exists, used by Temper and Fervor) so it reads as a kept light. One word in `game/skillsets/marks.js`.

## 7. Tamsin, The Rockbreaker: rattle the slope, then bring it down

File `src/shared/skillsets/tamsin.js`. Look `look-tamsin.js`. Test `tools/skillsets-v3b-smoke.js`. Cave skill Landslide (unchanged).

**Now.** Sledge Sweep (wide cone, 0.5) / Pull the Slope (zone 9.5 m, 3 s, pulls, 0.8 a tick, taunt, cd 10) / The Mountain Moves (ring 11 m 1.8, then a zone 8 m for 2.5 s, shield 12%, guard 15%, cd 36). **Problem**: Tansy's numbers with a taunt; no mark; the only link is that pulled monsters happen to stand in the ring. A mark-and-pop would make her Ogden's copy, so her link is a **state**: rattled ground.

**New order**: Pull the Slope (everything in it is rattled: slowed) -> sweeps hit the rattled harder -> The Mountain Moves **while the slope is still pulling**, so the ring and all five ticks of the slide land on rattled monsters (x1.35). The slide's knockback fights the pull and the pull wins: the heap stays in the slide.

| Piece | Change |
|---|---|
| `kit` (new; no mark) | `kit:{name:'Loose Ground', text:'Pull the Slope rattles everything it drags. Rattled enemies take more from your sweeps and far more from The Mountain Moves.', combo:{order:['skill','burst'], win:3, text:'Pull the Slope, then move the mountain while it is still pulling.'}}` |
| pos 1 `warrior` Sledge Sweep | `mult:0.5` -> `0.46`; add `vs:{when:{slowed:true}, k:1.25, name:'Loose Footing'}`. Desc adds `' A quarter harder against rattled (slowed) enemies.'` |
| pos 2 `any` Pull the Slope | the zone adds `slow:1.5` (applied every 0.5 s tick, so the rattle lasts until 1.5 s after the last tick). Desc: `'... everything in it is dragged to the middle, rattled (slowed) and turns on you. Hold: Dig In.'` |
| pos 2 `alt` (E4) | `alt:{name:'Dig In', secs:0.5, desc:'Plant the sledge at your own feet: for 3 seconds everything within 7 m is dragged to you, rattled and turns on you, and you stand behind a shield worth 8% of your health.', mult:0.8, range:7, act:['tamsin2xh',0.7,0.5], anim:'nova', fx:{vsBoss:0.5, zone:{r:7, dur:3, every:0.5, self:true, kb:-3, slow:1.5}, taunt:{dur:4, r:7}, shield:{v:0.08, dur:5, r:1}}}`: the mild-tank mode, for when the camp is already on her; the tap stays the 16 m gather |
| pos 3 `any` The Mountain Moves | `mult:1.8` -> `1.6`; add `vs:{when:{slowed:true}, k:1.35, name:'Rockslide'}`. **Its own ring and zone must never carry a slow** (a zone tick applies statuses after its damage, so its second tick would enable itself). Desc: `'The widest ring of any skill goes out around you, then a slide of rubble lingers for 2.5 seconds. Rattled enemies take a third more from all of it. You stand in it behind a shield worth 12% of your health with 15% less damage taken.'` |
| passives, `bonds`, `ult` | unchanged (Second Load and Cleared Ground refund Pull the Slope on kills: the window comes back faster the better she kills in it) |

**Payoff.** The Mountain Moves, ring plus five ticks: today 10.8; new 9.6 with no rattle (-11%), 12.96 fully overlapped (+20%), about today's value when cast just after the pull ends. Sweeps: 0.46, or 0.575 in the window (about 45% of the time when Pull the Slope is used on cooldown: +2% on average).

**Tests.** v3b block: Pull the Slope's tick sets `slowT`; a slowed dummy takes 1.35x from the ring and from a slide tick, a clean one 1x for all five ticks (the self-enable guard); the alt taunts and shields; `vsBoss` still halves all of it. Ladder pack column (`--set tamsin`), `dip-smoke` if the tick cost moved (it should not: `slowed` is one field read).

### Visual upgrade plan

**Now**: Pull the Slope = one inward dust wave when the zone starts; The Mountain Moves = a dust wave and ten slabs; motes are pebbles and grit. Nothing shows which monsters are rattled, and the pull is one beat for a three-second field.

- **Pull the Slope** (`'2'`): `zone:[{wave:{style:'dust',col:1,h:0.6,inward:true,life:0.9}}, {wave:{style:'dust',col:1,h:0.4,inward:true,life:0.9,at:1.0}}, {wave:{style:'dust',col:1,h:0.4,inward:true,life:0.9,at:2.0}}, {decal:{rk:1,life:4.5}}, {shake:{v:0.15}}]`: a wave a second, and the rivet decal lies for the whole rattled window (3 s + 1.5 s). `end:[{dust:{}}]`.
- **Dig In** (`'tamsin_2_any_h'`): `cast:[{slabs:{r:2,n:6,col:0}}, {prop:{kind:'fissure',n:3,arr:'ring',r:3,anim:'rise',len:4,life:3,cols:[3]}}]`, `zone:[{wave:{style:'dust',col:1,h:0.5,inward:true,life:0.8}}]`.
- **The Mountain Moves** (`'3'`): the ring as now, then make the slide visible for its 2.5 s: `{slabs:{r:8,n:14,col:0,at:0.3}}`, `{slabs:{r:5,n:8,col:4,at:1.1}}`, `{dust:{at:0.3}}`, `{shake:{v:0.45}}`; `zone.mode` stays `'in'`.
- **Rockslide / Loose Footing** (the look's `proc` hook): Rockslide = pebbles (`sh:'pebble'`) thrown up from the monster and a `fxpFlare` in rust (`cols[3]`); Loose Footing = no ring at all (it fires on every sweep in the window: only the badge once, then the 0.5 s throttle of E1 keeps it quiet; if it still spams, give `vs` a flag `quiet:true` and skip the event).
- Warrior class flair already cracks the ground on a heavy blow (`skill-flair.js`): The Mountain Moves should count as heavy; check `skfCast`'s threshold with `mult` now 1.6.

## 8. Meleni, The Tide Chant: ebb, then flow

File `src/shared/skillsets/meleni.js`. Look `look-meleni.js`. Test `tools/skillsets-isles-smoke.js`. Cave skill Slack Water (+8% per Swell on a target: cast before Landfall; unchanged).

**Now.** Spray Bolt (1.5, haste 10% for 3 s, Swell) / Landfall Chant (ring 6 m 1.1, might 10% +2% per Swell for 10 s, pops Swell k 0.5, cd 14) / Call the Tide (zone 9 m for 8 s: crit 20%, crit damage 40%, regen 2%; cd 45). **Problem**: Dunstan's numbers on purpose (the file says so), and Call the Tide ignores Swell. The owner's ladder "holds for them": this rework keeps every buff value and changes only how they are reached.

**New loop**: the chant has two modes. Held = **Ebb** (the water draws back: pulls enemies in, lays 2 Swell on each, guards the party). Tapped = **Landfall** (the water comes in: might, the pop, and each Swell spent takes 1.5 s off Call the Tide). The tide itself lays Swell on what stands in it. So: Ebb -> bolts -> Landfall at five Swell -> the tide is back sooner -> Call the Tide -> Landfall inside it (might, crit and crit damage together).

| Piece | Change |
|---|---|
| `kit.text` | `'Every strike leaves a Swell (up to 5), and so do the Ebb and the risen tide. Landfall spends them: more might for the party, and each Swell spent brings Call the Tide back sooner.'` |
| `kit.combo` | `{order:['burst','skill'], win:6, text:'Ebb to gather the water, Landfall at five Swell; when the tide is up, chant Landfall inside it.'}` |
| pos 1 `mage` Spray Bolt | unchanged |
| pos 2 `any` Landfall Chant (the tap) | `pop:{id:'swell', k:0.5, r:6, cdr:{burst:1.5}, cdrMax:5}`. Desc: `'Tap: Landfall. You and your allies within 25 m deal 10% more damage for 10 seconds, and 2% more for each Swell near you. A surge round you then spends every Swell nearby for extra damage, and each one (up to five) takes 1.5 seconds off Call the Tide. Hold: Ebb.'` |
| pos 2 `alt` (E4) | `alt:{name:'Ebb', secs:0.6, cd:9, desc:'Draw the water back: everything within 8 m is dragged toward you and left with 2 Swell, and you and your allies within 25 m take 12% less damage for 6 seconds.', mult:0.7, range:8, act:['meleni2xh',0.8,0.5], anim:'nova', fx:{ring:{r:8, kb:-3, mark:{id:'swell', n:2, dur:12, max:5}}, ally:{kind:'guard', v:0.12, dur:6, r:25}}}` |
| pos 3 `any` Call the Tide | zone `dur:8` -> `6`; the zone adds `kb:-1` and `mark:{id:'swell', n:1, dur:12, max:5}` (a Swell a second on every enemy in it). Desc: `'Call the tide up round your feet for 6 seconds: you and your allies standing within 9 m get 20% more critical hit chance, 40% more critical damage and 2% health back a second. The undertow holds the enemies in it and leaves a Swell on each every second.'` |
| passives, `bonds`, `ult` | unchanged (Bond VI Full Flood fires on every Call the Tide: it comes more often now, watch its uptime) |

**Payoff.** Call the Tide's cooldown: 45 s, less 7.5 s for each Landfall at five Swell. Three full Landfalls per cycle bring it to about 27 s. Uptime of the crit zone: today 8 / 45 = 18%; new 6 / 45 = 13% for a chant on cooldown with no Swell, 6 / 27 = 22% for the full loop. Landfall straight after Ebb is not possible (one cooldown): Ebb (9 s) -> three bolts -> Landfall is the beat. Ebb gives the buff support a defensive answer Dunstan does not have (guard), which is a different **kind** of buff, so the two no longer overlap in a party.

**Tests.** isles block: a Landfall with 5 Swell takes 7.5 s off `p.cd.burst` (0 when the tide is ready); the tide's tick lays a Swell on a monster inside and none outside; Ebb (held) lays 2 Swell, pulls (the monster ends nearer), gives `allyP(q,'guard')` = 0.12 and sets the cooldown to 9 s; might with 5 Swell is still 20% and under `SS_ALLY_CAP`. `skill-hold-smoke`, `ult-smoke` (boost of `a2`: `util:1.25` must apply to the alt's guard too, since `p.act.sid` is the base piece).

### Visual upgrade plan

**Now**: Landfall = one water wave 8 m out; Call the Tide = one water wave when the zone starts, then orbiting drops; Swell pips are rings. The tide does not look like water standing for its whole life, and nothing distinguishes in from out.

- **Ebb** (`'meleni_2_any_h'`): `cast:[{wave:{r:8,style:'water',col:3,h:0.7,inward:true,life:0.8}}, {dust:{}}, {ring:{r:8,col:3}}]`: the dark teal (`cols[3]`), drawn **inward**, low. The engine's own crest for a pull (`skvWave`, kb < 0) runs inward too: check they do not double; if they do, drop the recipe's wave and keep the ring.
- **Landfall** (`'2'`): `cast:[{wave:{r:8,style:'water',col:1,h:1.3,life:0.8}}, {prop:{kind:'geyser',n:5,arr:'ring',r:4,anim:'rise',stagger:0.05,life:1.2,cols:[1,0,2]}}, {rise:{}}]`: bright (`cols[1]`), outward, tall: the opposite of Ebb at a glance.
- **Call the Tide** (`'3'`): `zone:[{wave:{style:'water',col:0,h:0.9,life:1}}, {decal:{rk:1,life:6}}, {wave:{style:'water',col:0,h:0.35,inward:true,life:1,at:2}}, {wave:{style:'water',col:0,h:0.35,inward:true,life:1,at:4}}]`, `end:[{wave:{style:'water',col:3,h:0.5,inward:true,life:0.7}}]`: the wave-line decal lies for the 6 s, the undertow pulses inward every two seconds, and the water drains at the end. `zone.mode` from `'orbit'` to `'rise'` (bubbles lifting reads as standing water).
- **The refund**: the `cdr` event already flashes the Power tile (`sspFlashSlot('burst')`). In `ssOnCdr` (`game/economy/skillsets.js`) nothing more is needed.
- **Allies**: the look's `ally` hook: might = shell-cream glints rising (`cols[2]`), guard (from Ebb) = a low ring of drops round the feet; today both are the generic ring.

## 9. Balance check (what to run, what to hold)

Baselines measured before any change (`node tools/skillsets-ladder.js --set <id>`, 60 s, single target, % of the best non-set loadout; the columns are far outside the old bands for every set since the skill revamp, so **the yardstick is the kit's own value today, not the band**):

| Set | pieces | 3-set | 5-set | pack at 5-set | second run |
|---|---|---|---|---|---|
| brynja | 105 | 133 | 241 | 711 | always behind: 106 / 124 / 241 |
| sefi | 122 | 162 | 222 | 350 | always behind: 132 / 149 / 246 |
| sorrel | 126 | 180 | 280 | 283 | from 16 m: 113 / 173 / 249 |
| hollis | 257 | 253 | 319 | 242 | |
| tamsin | 124 | 118 | 186 | 855 | |
| meleni | 145 | 171 | 267 | 169 | |

- The bot casts burst, then skill, then basic, each as soon as it is ready. That is the wrong order for Brynja, Sorrel and Tamsin and the right one for Sefi, Hollis and Meleni, so run both: plain (a careless player) and `--combo` (E5). **Hold**: plain within -6 and `--combo` within +6 of the baseline's `pieces` column; if a kit is outside, move the basic's `mult` first (it is most of the damage), then the `vs.k`. The orderings of `--check` must still pass (noise 4).
- A seeded run varies by about 4 points (`LADDER_NOISE`): do not tune inside that.
- Healing and buffs: `tools/boss-duel.js --check` (Hollis), and for Meleni assert the uptime numbers of section 8 in her test rather than reading them off the ladder.

### 9b. The combo spread (second pass: playing the combo right is worth about 20%)

The owner's target, against each kit's **ladder value** (its plain `pieces` on main 023bc12, mean of 3 seeds: `COMBO_REF` in `tools/skillsets-ladder.js`): played wrong about **-10%**, played right and clean about **+10%**, sloppy but in order between. `node tools/skillsets-ladder.js --combo --runs 5 [--set id]` plays each kit four ways (pieces alone, Bond 0):

- **wrong**: the payoff first; the set-up only after it, and the payoff never within 1.5 x `win` of the set-up;
- **plain**: whatever is ready (burst, skill, basic): the careless player. It is the right order by accident for the burst-first kits (Sefi, Hollis, Meleni) and for Sorrel (skill cd 8 lines up with the burst's 28);
- **order**: in order but late (the payoff only after 0.6 x `win`), no wait for a full stack;
- **best**: the payoff straight after the set-up; a pop waits for the full stack.

What rewards the clean play (engine, AUTHORING.md section 4): `vs.tight:{after, secs, k}` (x k more when the set-up slot was cast within secs: `p.ssCastT`, set in `handleAttack`) and the `when` key `cast:{slot: secs}` (a payoff that needs its set-up but no status: Hollis, Meleni); the full stack is rewarded by the pops (`pop.k` per stack, Meleni's might per Swell).

| Kit | changed | wrong / plain / order / best, % of the ladder value (pieces; Tamsin: pack) |
|---|---|---|
| Brynja (116; behind 111) | Icicle Shot 2.35 -> 2.25; Shatter x1.5 -> x1.7, tight x1.3 within 2 s of Glide and Cut | -12 / -7 / +2 / +9; behind -6 / -2 / +9 / +14 |
| Sefi (120; behind 119) | Passing Cut 1.4 -> 1.27; Gust Dash 1.1 -> 1.2, Second Lap x2 -> x3, tight x1.6 within 2 s of Dead Heat; Dead Heat's weak 4 -> 6 s, combo `win` 4 -> 6 | -7 / +6 / -6 / +10; behind -7 / +5 / -6 / +9 |
| Sorrel (117) | Clean Line 2.0 -> 1.6; Long Gale 5.6 / 5.6 / 5.4 -> 3.2 / 3.2 / 3.1 (its hit share fixed, below); Through the Gap x1.2 -> x2, tight x1.3 within 2.5 s of Mark the Gap | -11 / +10 / -3 / +5; 16 m -11 / +8 / +2 / +9 |
| Hollis (237) | Candle Bolt 2.3 -> 2.12; Dusk Lent 1.5 -> 1.35, pop k 0.6 -> 0.55, Lantern Lit x3 within 8 s of The Long Night (`cast`), tight x1.3 within 2 s | -16 / +5 / +1 / +8 |
| Tamsin (pack 474) | Sledge Sweep 0.46 -> 0.37; Pull the Slope 0.8 -> 0.73; The Mountain Moves 1.6 -> 1.32, Rockslide x1.35 -> x2.4, tight x1.3 within 1.5 s of Pull the Slope | pack -9 / -2 / +5 / +9 (pieces -8 / -2 / +0 / +7) |
| Meleni (150) | Spray Bolt 1.5 -> 1.3; Landfall 1.1 -> 1.0, pop k 0.5 -> 0.7, High Water x2 within 6 s of Call the Tide (`cast`) | -11 / -5 / +2 / +11 |

Before this pass the four plays sat within about 8 points of each other for every kit (Sorrel's were flat). One seeded run of a kit varies by up to 10 points, so judge only means of 5.

**A bug found on the way**: an `act`'s third number is a share of its seconds (the server resolves the hit at seconds x share), but Sorrel's three Long Gales, her burst Eye of the Storm and Pell's three long throws had `[.., 1.3, 1.1]`: the act ended before its hit, so they never dealt damage. Now `1.3, 0.85` (it lands at 1.1 s), and `defineSkillSet`, `ult.js` and `skill-hold.js` reject a share above 1 (`skillsets-first8-smoke` checks every skill). Pell's long throws were then trimmed (6.0 / 6.2 / 6.0 -> 2.9 / 3.0 / 2.9, pop k 0.8 -> 0.55) to keep its ladder: `--orders` 105 / 106 / 112 before (the throws missing), 103 / 108 / 105 after.

## 10. Build order and the tests of each step

1. **E1 + E2 + E3** (`shared/skillsets.js`, `server/skillsets.js`, `procs.js`), with fixture checks in `tools/skillsets-smoke.js`: a `vs` multiplies ring, cone, projectile impact, zone tick and pop; a `vs` with `crowd` is rejected into `SS_BAD`; `slowed` holds only while `slowT`>0; `pop.cdr` refunds per stack up to `cdrMax`; the `proc` event names the active. Then `python3 build.py --check`, `node tools/run-tests.js`, `npm run fuzz`, `npm run bench` (the tick must not move).
2. **Hollis** (no engine addition: can ship before step 1), then **Sorrel, Sefi** (E1, E3), each with its test block, `node tools/skillsets-ladder.js --set <id>`, `node tools/client-smoke.js`, `node tools/ult-smoke.js`, `node tools/cave-sets-smoke.js`.
3. **E5** (`kit.combo`, the panel line, the ladder's `--combo`).
4. **E4** (skill-hold) with `tools/skill-hold-smoke.js`, `keys-smoke`, `phone-layout-smoke` (the hold on a touch button), `basic-hold-smoke` (the shared `hold` message), `net-client-smoke`.
5. **Brynja, Tamsin, Meleni** (E1, E2, E3, E4).
6. **Looks**: the `vis` recipes and `proc` hooks of sections 3-8, one look file each; `node tools/client-smoke.js` fails on a bad recipe (`SKV.bad`) or anything left in the scene. Nobody has seen these effects in a browser (`VISUALS.md`): look at each with `node tools/shot.js` near the Training Scarecrow (`docs/TESTROOM.md`) or ask the owner to playtest.
7. **Docs**: `docs/skillkits/kit-risk-dps.md`, `kit-safe-dps.md`, `kit-healer.md`, `kit-grind.md`, `kit-support.md` (the reworked kits' rows), `AUTHORING.md` sections 4 and 4b (`vs`, `slowed`, `pop.cdr`, `alt`, `kit.combo`), `docs/SKILL-SETS.md` section 10, `VISUALS.md` (the table rows of the six), `docs/PROTOCOL.md`, `node tools/gen-docs.js` if it lists skill numbers, `python3 build.py --write-index`.

## 11. Open questions for the owner

1. Sefi's Second Lap reads the **shared** `exposed` status, so a debuff support in the party switches it on all the time (section 4). Keep as party synergy, or lower it?
2. Sorrel gains a small shared vuln (5%) as a safe DPS. It never stacks with a support's, but it is a debuff on a damage kit: acceptable?
3. Hollis's Dusk Lent heals 6% instead of 10% when cast with no Vigil. That is the point of the rework and also a real nerf to careless play: fine for a healer?
4. Skill-hold (E4) makes skill 2 fire on **release** for the three kits that have a held mode (a tap costs up to one key-up of delay, as skill 1 already does). Fine, or should the tap fire on key down and the hold be a second, separate cast?
5. Meleni and Tamsin stop being number-copies of Dunstan and Tansy. The files say the copies were made on purpose so the ladder holds: confirm the split is wanted.
