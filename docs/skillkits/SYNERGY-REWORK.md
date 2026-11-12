# Synergy rework: eight kits whose skills should reinforce each other in any order (built, the visual plans not)

> **Status: built** (the data of the eight kits, their kit texts and test blocks, the ladder's `--orders`, the `mk` refresh quiet period `SS_MK_QUIET` of section 7, the `twine` pip shape); the "Visual upgrade plan" parts are not. What the checks of section 2 found and what differs from the rows below:
> - a ring's `mark` lands **before** the same cast's `pop` (`resolveFxS`: shapes, then `ssFxUtilS`, then the pop), so Atuqa's Hold the Wall takes the fallback: no re-tie (section 10). For the same reason a ring's `perMark` shield counts the marks its own ring just laid (High Water and Rise Again with no prior marks give 14.4% / 15.2%, not 12%).
> - a zone's `status.perMark` is accepted (Zahra keeps the climbing dazzle); a smaller shield never replaces a larger one in force (`ssShieldS`); a trigger's `cdr` is not scaled by an ult boost's `eff`, so Tzaya's boost is `{icd:0.33}`; Ogden's swell already hit with the skill's mult before this pass (a zone without `noHit` always hits), so the mark adds no damage of its own.
> - `ssMarkS` sent an `mk` on every refresh: a refresh of a mark already at its max now sends nothing within 2 s of the last one (the pips may end up to 2 s early).
> - tuned on the ladder: Tzaya's Obsidian Sweep 0.68 -> **0.62** and Fire Pit's `vs` 1.3 -> **1.15** (with the doc's numbers his `pieces` rose about 11 instead of 2).
> - **open**: Dunstan's banner and Zahra's sandglass lay their mark on every enemy in them, and Cry of Valor / Long Noon pop every stack within 6 m, so their pack damage rose a lot (`pack at 5-set`, burst first: Dunstan 177 -> 233, Zahra 225 -> 298; Dunstan with the burst held 164 -> 405). Single target held. The press-order spreads (`--orders`) before / after are in section 11.
>
> The original plan follows.
>
> **Plan status (as written)**: a plan. Nothing here is built. It follows `COMBO-REWORK.md` (the six combo kits Brynja, Sefi, Sorrel, Hollis, Tamsin, Meleni: built, do not touch them) and uses only what that plan added to the engine (`fx.vs`, `slowed`, `pop.cdr`) plus what was there before (`mark` on a shape, `perMark`, a trigger's `mark` / `cdr`). **No new engine key, no `kit.combo`, no `alt`.**
>
> For the agent that implements it: read this file, `AUTHORING.md` sections 4 and 4b, and only the files named in each section. Piece ids, positions, `ult` and `bonds` entries do not change unless a row says so. The 3- / 5-set bonuses stay off (`SS_BONUS_ON`). Every number is a first guess; section 11 says how to check it.

Picked kits: **Dunstan, Zahra, Ambrose, Nephra, Tansy, Ogden, Tzaya, Atuqa**.

| Kit | The shared mechanic in one line |
|---|---|
| Dunstan (buff, fire) | **Fervor is fuel**: the banner lays it and burns hotter on it, every bolt quickens the line more for each Fervor near, the cry spends it |
| Zahra (buff, light) | **Grain is glare**: the sandglass lays it and dazzles more for each Grain, every bolt guards more for each Grain near, being hit lays one |
| Ambrose (heal, water) | **Ripple is depth**: the lash mends more and High Water shields more for each Ripple near; High Water leaves Ripples of its own |
| Nephra (shield heal, earth) | **Linen is thickness**: every shield of hers (bolt, salve, rite) is thicker for each Linen near; the rite leaves Linen |
| Tansy (grind, none) | **Twine**: everything she does binds what it touches, and everything she does hits the bound harder |
| Ogden (grind, water) | **Rot feeds him**: every sweep mends him for the Rot near, and the Frenzy's swell re-seeds the Rot it spent |
| Tzaya (grind, fire) | **The count turns the wheel**: the pit burns the counted harder, Tallies spent bring the pit back, kills bring the Reckoning back |
| Atuqa (tank, light) | **Knots are promises**: shots hit the knotted harder and raise a small shield for each Knot near; Hold the Wall re-ties what it spends |

## 1. Which kits, and why these

The table of `COMBO-REWORK.md` section 1 scored all 24 kits. After its six, nine kits sit at the next-lowest sum (5): Atuqa, Ogden, Tzaya, Sabir, Dunstan, Zahra, Ambrose, Nephra, Tansy. Eight are taken here (the cap). **Sabir is left out**: the combo plan keeps him as the plain builder / spender baseline of the risk kits, and his loop is the one every other risk kit is measured against. The kits at 6 and above (Genzo, Dessa, Pell, Marigold and the five at 7-8) are not weak and are not touched.

What "weak" means for each of the eight, in the old table's words:

| Kit | Sum | The gap this plan closes |
|---|---|---|
| Dunstan | 5 | Banner Down ignores Fervor (Link 1) |
| Zahra | 5 | The Sandglass ignores Grain; Dunstan's shape (Link 1, Own 1) |
| Ambrose | 5 | High Water ignores Ripple (Link 1) |
| Nephra | 5 | Rise Again ignores Linen (Link 1) |
| Tansy | 5 | no mark at all; the link is geometry only (Link 1) |
| Ogden | 5 | linked, but only as "build then spend"; dead time after the spend |
| Tzaya | 5 | Ogden's numbers (Own 0) |
| Atuqa | 5 | Torgeir's numbers (Own 0); the basic only feeds |

## 2. The rule of this pass: no order

The combo kits pay for a **sequence**. These eight must feel connected **whatever is pressed first**. Four design rules follow, and every change below obeys them:

1. **Every active feeds or reads the kit's mark, and at least one does both.** A skill that only spends is allowed only if something refills quickly without an order (rule 3).
2. **Reads are counted, not spent** (`perMark`, `vs:{when:{marked}}`, a `status.perMark`). A counted read works before, during and after any other skill.
3. **The spender never leaves a hole.** Where a kit keeps its `pop`, the same cast (or a field that lasts) lays marks again, or the basic refills in a few swings on a pack (`perMark` counts all enemies near, up to `max`).
4. **No `vs` on a window another skill opens** (`slowed`, `exposed`): that is the combo kits' tool. Here a `vs` reads only the kit's own long-lived mark (10-12 s), so it is a ramp ("the fight warms up"), never a sequence.

**Power band.** The basic is 65-80% of every kit's damage, so these changes move totals by a few percent. Target for each kit: **any press order lands within the ladder's noise (4 points) of any other**, and within +-5 of today's `pieces` column (section 11), except Atuqa (deliberately up, section 10).

**Engine facts this plan leans on** (checked in the code; the ones marked *verify* were not run):

- A shape (`ring cone proj zone`) may carry `mark`; a zone applies it on every tick (Meleni's Call the Tide does).
- `perMark` works inside a skill's own `ally`, `heal`, `shield` entry (`server/skillsets.js` line 247), **not inside a zone's** (`ssFxProblem` rejects it there). So a planted field cannot scale its ally buff with marks; this plan never asks for that.
- A shape's `status` may carry `perMark` (the stacks on the target itself; `server/mon-status.js` line 31). *Verify* that the registry accepts it on a `zone` (Zahra, section 4).
- A shape applies its mark and statuses **after** its damage. A zone's second tick therefore sees the mark its first tick laid: here that is wanted (the field warms up).
- `vs` multiplies a skill's pop too, and sends the `proc` event at most every 0.5 s per piece.
- *Verify* the order of a ring's `mark` and the same cast's `pop` (Atuqa, section 10): either order is acceptable, the test must pin which one it is.
- *Verify* a small shield does not replace a larger one in force (Nephra's Dust Bolt already gives 3% beside Salve's 10%, so the engine must already keep the larger; Atuqa's new shot shield relies on the same).

## 3. Dunstan, The Rally: Fervor is fuel

File `src/shared/skillsets/dunstan.js`. Look `src/game/skillsets/look-dunstan.js`. Test block in `tools/skillsets-first8-smoke.js`. Cave skill Sound the Charge (reads Fervor: unchanged, and worth more now that the banner keeps Fervor up).

**Now.** Beacon Bolt (1.5, haste 10% for 3 s, Fervor) / Cry of Valor (ring 6 m 1.1, might 10% + 2% per Fervor, pops Fervor k 0.5, cd 14) / Banner Down (zone 9 m, 8 s: crit 20%, crit damage 40%, regen 2%; burns 0.5 a second; cd 45). **Problem**: the banner, the kit's centrepiece, neither lays nor reads Fervor; the bolt only feeds.

**New**: all three feed or read, none needs another first.

| Piece | Change |
|---|---|
| `kit.text` | `'Every strike and the planted banner leave Fervor (up to 5). Fervor near you makes every bolt quicken the line more, makes Cry of Valor stronger and feeds the banner\'s flame.'` |
| pos 1 `mage` Beacon Bolt | `ally:{kind:'haste', v:0.10, ...}` -> `ally:{kind:'haste', v:0.08, dur:3, r:18, perMark:{id:'fervor', v:0.01, r:8}}` (8% with no Fervor near, 13% with five). Desc: `'A beacon of flame: a damaging hit that quickens you and your allies within 18 m (8% shorter cooldowns for 3 seconds, and 1% more for each Fervor on the enemies near you). Leaves a Fervor.'` |
| pos 2 `any` Cry of Valor | `mult:1.1` -> `1.0` (pays for the banner's flame). Everything else unchanged |
| pos 3 `any` Banner Down | the zone adds `mark:{id:'fervor', n:1, dur:12, max:5}` (a Fervor a second on every enemy in it); the `fx` adds `vs:{when:{marked:'fervor'}, k:1.5, name:'Fanned Flame'}`. Desc: `'Plant the banner at your feet for 8 seconds: you and your allies standing within 9 m get 20% more critical hit chance, 40% more critical damage and 2% health back a second. The flame at its foot burns the enemies there, leaves a Fervor on each every second and burns half again as hard on anything that carries Fervor.'` |
| header comment | add: the banner lays Fervor and its flame reads it; the bolt's haste reads it |
| passives, `bonds`, `ult` | unchanged |

**Why it is order-free.** Cry inside the banner: the banner re-lays what the cry spent within a second. Cry before the banner: the bolts have laid the Fervor. Banner with no Fervor anywhere: its first tick lays it and the second already burns hot. The bolt's haste simply follows how much Fervor is around.

**Payoff.** Banner flame over 8 ticks: 4.0 today; 5.75 new on a clean target (first tick cold), 6.0 on a marked one. Cry at 5 Fervor: 3.85 -> 3.5 (three casts per banner: -1.05). Net about +0.7 per 45 s against about 61 of bolts: +1%. Haste: 10% flat today; new 8% to 13%, 13% most of the time in a pack and inside the banner.

**Different from Meleni** (who was his number-copy and is now a tap / hold kit): no refund, no pull, no second mode. Dunstan is the buffer who stands still by his banner and the whole kit gets better around it.

**Tests.** first8 block: a bolt with 0 Fervor near gives `allyP(q,'haste')` = 0.08, with 5 = 0.13; a banner tick leaves `ssMarkN`=1 on a monster inside and none outside; with `still()` a marked monster takes 1.5x a banner tick; a clean monster's first tick is 1x and its second 1.5x; Cry then banner tick: the monster has Fervor again one tick later; `proc` names `dunstan_3_any`. `ult-smoke` (boost of `a2`).

### Visual upgrade plan

**Now** (`look-dunstan.js`): the cry = one fire wave and the drum's three rings; the banner = a pole and pennant with a ring beaten every second; buffs lift pennants off allies. Fervor pips are flames. Nothing shows the banner feeding on Fervor.

- **Banner Down** (`'3'`, new recipe; keep `zoneStart`): `zone:[{decal:{rk:1,life:8}}, {wave:{style:'fire',col:2,h:0.5,life:0.8}}, {prop:{kind:'banner',n:1,anim:'plant',size:1.2,life:8,cols:[0,1]}}]` only if the hand-built pole is retired; otherwise add just the decal and the wave. The flame notch decal lying for the 8 s is the "stand here" sign.
- **Fanned Flame** (the look's `proc` hook, the same hook the combo plan's visual pass adds): a short flame column on the monster (`sh:'flame'`, `cols[1]`, 6 motes rising) and no ring; it fires every second on a pack, so keep it small.
- **Beacon Bolt at five Fervor**: in the look's `ally` hook, when the haste value received is above 0.10, add two more pennants and a `spawnRingAt` in gold: the line sees the stronger quickening.
- Fervor pips flying in on every monster in the banner each second is the main new read and costs nothing (`marks.js`).

## 4. Zahra, The Hour of Glass: Grain is glare

File `src/shared/skillsets/zahra.js`. Look `look-zahra.js`. Test block in `tools/skillsets-v3b-smoke.js`. Cave skill Stopped Hour (unchanged).

**Now.** Sunlit Bolt (1.7, guard 10% for 3 s, Grain) / Long Noon (ring 6 m 1.3, crit damage 30% + 3% per Grain, pops Grain k 0.5, cd 14) / The Sandglass (zone 9 m, 8 s: guard 15%, crit 15%, regen 2%; burns 0.7 a second; cd 45). **Problem**: Dunstan's shape with other buff kinds; the sandglass ignores Grain; Heat Haze (dazzle on being hit) is her own idea and stands apart from the mark.

**New**: her own voice is **defence by glare**: Grain on an enemy makes it hit softer inside the glass, and guards the party more.

| Piece | Change |
|---|---|
| `kit.text` | `'Every strike, the planted sandglass and every blow you take leave Grain (up to 5). Grain near you makes every bolt guard the line more, makes Long Noon stronger and dazzles the enemies in the glass.'` |
| pos 1 `mage` Sunlit Bolt | `ally:{kind:'guard', v:0.08, dur:3, r:18, perMark:{id:'grain', v:0.01, r:8}}` (8% to 13%). Desc: `'A bolt of reflected light: a damaging hit that shields you and your allies within 18 m for a moment (8% less damage taken for 3 seconds, and 1% more for each Grain on the enemies near you). Leaves a Grain.'` |
| pos 2 `any` Long Noon | unchanged |
| pos 2 passive Heat Haze (`zahra_p2`, Bond IV) | add `mark:{id:'grain', n:1, dur:12, max:5}` beside the `status`. Text: `'When something hits you, the glare dazzles it: it deals 15% less for 4 seconds and is left with a Grain (at most every 6 s)'` |
| pos 3 `any` The Sandglass | the zone adds `mark:{id:'grain', n:1, dur:12, max:5}` and `status:{kind:'weak', v:0.04, dur:2.5, perMark:{id:'grain', v:0.012}}` (an enemy in the glass deals 4% less, 10% less at five Grain); the zone's guard `v:0.15` -> `0.12` (pays for the dazzle). Desc: `'Plant the sandglass at your feet for 8 seconds: you and your allies standing within 9 m take 12% less damage, hit 15% more often critically and heal 2% of health a second. The light at its foot burns the enemies there, leaves a Grain on each every second and dazzles them: they deal 4% less, and 1.2% less for each Grain they carry.'` |
| header comment | "she debuffs nothing herself" is no longer true (it was not: Heat Haze): say the glass dazzles |
| passives 1 and 3, `bonds`, `ult` | unchanged |

**Why it is order-free.** The glass lays its own Grain, so its dazzle climbs from 4% to 10% over five seconds wherever Long Noon was cast. Long Noon inside the glass spends and the glass refills. The bolt's guard follows the Grain around her.

**Payoff.** No damage number moves. Party damage taken inside the glass: today x0.85 (guard 15%); new x0.88 x 0.96 = 0.845 at once, x0.88 x 0.90 = 0.79 after five seconds. `weak` never stacks (the stronger wins): beside Corvin or Ottoline her dazzle adds nothing, which is the shared-status rule, and Heat Haze's own 15% still wins on the one that hit her.

**Tests.** v3b block: a bolt's guard 0.08 / 0.13 at 0 / 5 Grain; a glass tick leaves a Grain and `mstWeakK` (or the kit's reader for `weak`) = 0.04 on a clean monster, 0.10 on one with five; Heat Haze leaves a Grain on the attacker; the registry accepts the zone's `status.perMark` (if it does not, move the dazzle to a flat `status:{kind:'weak', v:0.08, dur:2.5}` and say so in the desc). Ladder `--set zahra`: unchanged within noise.

### Visual upgrade plan

**Now**: Long Noon raises a mirror and throws nine rays; The Sandglass is one prop rising; motes are glints and falling sand. Grain pips are seeds. Nothing shows the glare on the enemies.

- **The Sandglass** (`'3'`): `zone:[{prop:{kind:'sandglass',anim:'rise',size:1.4,cols:[3,0]}}, {decal:{rk:1,life:8}}, {rays:{n:6,arc:6.28,len:9,col:4,at:0.2}}, {rays:{n:6,arc:6.28,len:9,col:4,at:4}}]`: the dial decal lies for the 8 s and the glass flashes all round twice. `zone.mode` stays `'out'`.
- **The dazzle**: a weakened monster shows nothing today (`VISUALS.md`, known gaps; the combo plan's Sefi has the same gap). Smallest fix inside this kit: the look's `zoneTick` hook (or the tick's default burst) throws two `sh:'glint'` motes at each monster's head height in `cols[0]`, additive: a glare in its eyes each second.
- **Sunlit Bolt**: in the `ally` hook, a guard above 0.10 draws a second, wider ring in lapis (`pal.accent`) round the ally: the thicker guard is visible.
- **Heat Haze** already shows as a proc badge; its new Grain flies in as a seed pip with no client work.

## 5. Ambrose, The Marsh Remedy: Ripple is depth

File `src/shared/skillsets/ambrose.js`. Look `look-ambrose.js`. Test `tools/skillsets-first8-smoke.js`, `tools/boss-duel.js --check`. Cave skill Tidepool (unchanged).

**Now.** Reed Lash (2.0, heals the lowest 2.5%, Ripple) / Ebb and Flow (ring 10 m 1.5, pops Ripple k 0.6 with half healing him, party heal 10%, shield 8%, cd 12) / High Water (ring 9 m 2.8, slow, heal 30%, regen 3%, shield 15%, cd 45). **Problem**: High Water ignores Ripple; the lash only feeds. (Hollis, his old number-copy, became the "fill then return" combo. Ambrose stays the steady healer: nothing of his depends on a sequence.)

| Piece | Change |
|---|---|
| `kit.text` | `'Every blow leaves a Ripple (up to 5) on its target, and High Water leaves two. Ripples near you deepen every mend of the lash and the shield of High Water; Ebb and Flow returns them all as a wave.'` |
| pos 1 `warrior` Reed Lash | `heal:{v:0.025, r:15, lowest:true}` -> `heal:{v:0.02, r:15, lowest:true, perMark:{id:'ripple', v:0.002, r:10}}` (2% with no Ripple near, 3% with five). Desc: `'Swing the bell-topped mace: a damaging hit that mends whichever of you and your allies within 15 m has the least health, for 2% of their maximum health and 0.2% more for each Ripple on the enemies near you. Leaves a Ripple.'` |
| pos 2 `any` Ebb and Flow | unchanged (its flat 10% heal is the reliable one: that is what separates him from Hollis's 6% to 12%) |
| pos 3 `any` High Water | the ring adds `mark:{id:'ripple', n:2, dur:12, max:5}`; `shield:{v:0.15, dur:8, r:20}` -> `shield:{v:0.12, dur:8, r:20, perMark:{id:'ripple', v:0.012, r:10}}` (12% to 18%). Desc adds: `' The shield is 1.2% thicker for each Ripple near you, and the wave leaves two Ripples on everything it touches.'` (and the 15% in the text becomes 12%) |
| passives, `bonds`, `ult` | unchanged |

**Why it is order-free.** The lash's cone lays a Ripple on everything in front of him each second and `perMark` counts all enemies near up to five, so on a pack the count is full after one or two swings whatever was just spent. High Water after Ebb and Flow: a 12% shield and it re-lays two Ripples at once, so the next lashes are already at 2.4%. Ebb and Flow after High Water: it has two Ripples per enemy to return. No case is a mistake; the best case (High Water at five Ripples) is +3 points of shield.

**Payoff.** Lash healing per second: 2.5% today; new 2% to 3% (on one target he is at five Ripples for about 7 of every 12 s: average 2.6%). High Water's shield 12% to 18% (was 15%). His damage does not move (ladder 86 / 84 / 104).

**Tests.** first8 block: a lash with 0 / 5 Ripples near heals the lowest ally 2% / 3% (x heal power, under `SS_HEAL_CAP`); High Water leaves `ssMarkN`=2 on every monster within 9 m and gives a shield of 12% / 18%; Ebb and Flow right after High Water pops two stacks per monster. `boss-duel --check` (the 2% floor of the lash is the risk: it must still pass).

### Visual upgrade plan

**Now**: the best-matched of the eight: Ebb and Flow is a wave out and a wave back, High Water two rising waves and a bubble column; ripples are rings. Missing: any sign that the lash's mend is deeper, and that High Water left Ripples.

- **Reed Lash**: in the look's heal-on-ally hook (`fxa`), scale the number of bubbles lifted off the healed ally with the heal's size: 3 bubbles at 2%, 7 at 3% (`sslN` of `3 + 400*(v-0.02)`), so a deep mend looks deeper.
- **High Water** (`'3'`): add `{decal:{r:9,life:8}}` (the double wave line lies for the shield's 8 s) and `{rise:{n:14,r:9,at:0.4}}`; the n:2 mark makes two ring pips fly in on every monster at once.
- **The shield**: an aqua bubble exists. For a shield above 15% draw it with a second shell (`cols[1]`, `op:0.3`, 1.15x the size).
- Ebb and Flow: no change.

## 6. Nephra, The Linen Rite: Linen is thickness

File `src/shared/skillsets/nephra.js`. Look `look-nephra.js`. Test block in `tools/skillsets-v3-smoke.js`. Cave skill Embalm (reads Linen: unchanged).

**Now.** Dust Bolt (2.0, shield 3% for 4 s within 12 m, Linen) / Salve for Sand (ring 8 m 1.4, pops Linen k 0.5 with half healing her, shield 10%, guard 12% + 2% per Linen, cd 12) / Rise Again (ring 9 m 2.4, heal 25%, shield 15%, regen 3%, cd 55). **Problem**: Rise Again ignores Linen; the bolt only feeds; her kept passive (Many Layers, more health) is a flat number.

**New**: one sentence the player can hold: **the more Linen on the enemy, the thicker every wrapping**.

| Piece | Change |
|---|---|
| `kit.text` | `'Every blow leaves Linen (up to 5) on its target, and Rise Again leaves two. Every shield you give is thicker for each Linen near you; Salve for Sand pulls it tight for damage and a mend.'` |
| pos 1 `mage` Dust Bolt | `shield:{v:0.03, dur:4, r:12}` -> `shield:{v:0.025, dur:4, r:12, perMark:{id:'linen', v:0.004, r:10}}` (2.5% to 4.5%). Desc: `'A fist of tomb-dust: a damaging hit that wraps you and the allies within 12 m in a thin shield (2.5% of maximum health for 4 seconds, 0.4% more for each Linen on the enemies near you). Leaves Linen.'` |
| pos 1 passive Many Layers (`nephra_p1`, the kept one) | unchanged in data; text `'+{}% maximum health (and so every shield of yours, which is a share of it)'`: the passive already scales all three skills, the text now says so |
| pos 2 `any` Salve for Sand | `shield:{v:0.10, dur:8, r:20}` -> `shield:{v:0.08, dur:8, r:20, perMark:{id:'linen', v:0.008, r:8}}` (8% to 12%; the utility is counted before the pop, as Hollis's Dusk Lent relies on). Desc: the 10% becomes `'8% of maximum health, 0.8% more for each Linen'` |
| pos 3 `any` Rise Again | the ring adds `mark:{id:'linen', n:2, dur:12, max:5}`; `shield:{v:0.15, dur:8, r:20}` -> `shield:{v:0.12, dur:8, r:20, perMark:{id:'linen', v:0.016, r:10}}` (12% to 20%). Desc adds: `' The shield is 1.6% thicker for each Linen near you, and the dust leaves two Linen on everything it touches.'` |
| `bonds`, `ult` | unchanged (Bond VI The Curse Bites fires when a shield of hers breaks: thicker shields break later, so it fires a little less often on one target and as often on a pack: watch it in the test, do not retune) |

**Why it is order-free.** As Ambrose: the bolt lays Linen every 1.1 s, the rite re-lays two, the salve's shield is counted before its own pop. Rise Again on a clean field is still 12% + 25% heal; nothing punishes pressing it first.

**Payoff.** Shields at 0 / 5 Linen: bolt 2.5 / 4.5% (was 3), salve 8 / 12% (was 10), rite 12 / 20% (was 15). On one target she is at five Linen for about 7 of every 12 s. Her damage does not move (ladder 276 / 284 / 371; far over the healer's band already, a matter for the owner, not for this pass).

**Tests.** v3 block: each of the three shields at 0 and 5 Linen (`p.shield` or the kit's reader, x Many Layers' health); Rise Again leaves 2 Linen within 9 m; a bolt's 2.5% does not replace a Salve shield in force; Salve at 5 Linen gives the 12% shield and then pops (the count is read first).

### Visual upgrade plan

**Now**: data only: Salve pulls one dust wave inward, Rise Again throws one out, the ult drops a sarcophagus; motes are linen ribbons. Linen pips are bars. A shield on an ally is the generic ring.

- **A linen shield** (the look's `ally` / shield hook, new for her): ribbons (`sh:'ribbon'`, `cols[0]`) wind **round** the shielded player (orbiting motes, 4 for a thin shield, 9 above 10%) instead of the generic ring: the thickness is the count of ribbons.
- **Salve for Sand** (`'2'`): keep the inward wave; add `{prop:{kind:'wrap',...}}` only if a wrap prop exists (it does not among the 23: use `{swing:{n:5,gap:0.05,r:8,turn:6.28,col:0}}`, five ribbon arcs closing) and `{rise:{at:0.5}}`.
- **Rise Again** (`'3'`): `cast:[{wave:{r:10,style:'dust',col:4,h:1.2,life:0.9}}, {prop:{kind:'sarcophagus',n:1,anim:'rise',size:1.2,life:1.6,cols:[0,2,1]}}, {rays:{n:8,arc:6.28,len:9,col:2,at:0.4}}, {decal:{r:9,life:8}}]`: a lid rises behind her and lapis light goes out; the dial decal lies for the shield's 8 s.
- Linen pips: `SSV_SHAPE.linen` stays `'bar'` (Hollis's Vigil is moving to `'flame'`, so the bar becomes hers alone).

## 7. Tansy, The Harvest: twine

File `src/shared/skillsets/tansy.js`. Look `look-tansy.js`. Test block in `tools/skillsets-first8-smoke.js`. Cave skill Threshing (unchanged).

**Now.** Chaff Fan (seven arrows, 0.4 each, splash) / Gather In (zone 9.5 m, 3 s, pulls, 1.0 a tick, cd 10) / Bumper Crop (ring 11 m 1.8, then a zone 8 m for 2.5 s, cd 36). **Problem**: no mark; the only link is that pulled monsters stand in the ring. The combo plan left her alone as the first, easiest set; the owner now asks for a connection **without an order**, which suits the easiest set: it must stay a kit with nothing to learn.

**New**: a mark with one stack, **Twine**. Everything she does binds what it touches for 10 s, and everything she does hits what is bound a little harder. There is no spender and so no order: the kit warms up on a camp in its first second and stays warm.

| Piece | Change |
|---|---|
| `kit` (new) | `kit:{mark:'twine', name:'Twine', text:'Everything you do binds what it touches in Twine for 10 seconds. Bound enemies take more from all three of your skills.'}` |
| pos 1 `archer` Chaff Fan | `mult:0.4` -> `0.37`; the `proj` adds `mark:{id:'twine', n:1, dur:10, max:1}`; the `fx` adds `vs:{when:{marked:'twine'}, k:1.15, name:'Bound'}`. Desc adds: `' Binds what it hits; bound enemies take 15% more from it.'` |
| pos 2 `any` Gather In | `mult:1` -> `0.88`; the zone adds `mark:{id:'twine', n:1, dur:10, max:1}`; the `fx` adds `vs:{when:{marked:'twine'}, k:1.2, name:'Bound'}`. Desc: `'A wide field of pull at your target\'s feet: for 3 seconds everything in it is dragged to the middle, bound in Twine and nicked, a fifth harder once it is bound. Wide enough to take in the next camp.'` |
| pos 3 `any` Bumper Crop | `mult:1.8` -> `1.6`; the ring and the zone each add `mark:{id:'twine', n:1, dur:10, max:1}`; the `fx` adds `vs:{when:{marked:'twine'}, k:1.2, name:'Bound'}`. Desc adds: `' Binds what it touches; bound enemies take a fifth more from all of it.'` |
| passives, `bonds`, `ult` | unchanged (Wide Berth widens what binds; Bond VI Full Basket's shockwave is a trigger and neither binds nor reads: by design, a trigger's damage carries no `vs`) |
| `SS_PURE_BASIC` lint | she stays pure basic (`el:'basic'`): a mark is not an element |

**Why it is order-free.** A camp she has not touched takes the cold numbers for one arrow volley or one field tick, and the bound numbers from then on, whichever skill touched it first. The arrows' first volley binds (a projectile's mark lands after its damage), so the second volley, 0.9 s later, is already bound.

**Payoff.** Bound: fan 0.4255 (+6%), field 1.056 a tick (+6%), crop ring and ticks 1.92 (+7%). Cold: fan 0.37 (-8%), field 0.88 (-12%), crop 1.6 (-11%). In steady farming she is bound nearly always: about +5% on a pack she is working, about -3% on the first second of each new camp. The ladder's single target is bound after the first volley: expect `pieces` 126 -> about 131 (inside the hold of section 11; if over, lower the fan to 0.36).

**Honest limit.** This is a ramp, not a decision: after the first second it is close to a flat number. That is on purpose for the first set a new player gets. What the player feels is the **pips**: a whole pulled camp wearing twine, and the badge. It is not Tamsin's kit in other words: Tamsin has a 3-second window to hit and a held mode; Tansy has nothing to time.

**Tests.** first8 block: each of the three skills leaves `ssMarkN(p,m,'twine')`=1 and never 2; with `still()` a bound monster takes 1.15x a fan arrow, 1.2x a field tick, 1.2x the crop's ring and its ticks; a clean monster takes 1x on the first field tick and 1.2x on the second; `vsBoss` still halves all of it; Full Basket's shockwave is 1x on a bound monster. `ssLint()` raises no new warning. `dip-smoke` (60 monsters each carrying a mark: the `mk` events must stay inside the snapshot budget; a mark that is already at its max and only refreshed should send no event: *verify* in `ssMarkS`, and if it does send one, give the refresh a 2 s quiet period before this kit ships).

### Visual upgrade plan

**Now**: Gather In pulls a dust wave in and ties a sheaf at its end; Bumper Crop is a dust wave and thrown chaff; the arrows are wheat ears. No mark, so nothing on the monsters.

- **Twine pips**: `SSV_SHAPE.twine:'knot'` (the shape exists, used by Atuqa's Knot) in `game/skillsets/marks.js`, coloured by the set (`pal.accent`, the rust red): one knot over each bound head. With `max:1` the full-stack halo would show on every monster: check `marks.js` and switch the halo off for a mark whose max is 1 (one condition).
- **Gather In** (`'2'`): keep the wave and the sheaf; add `{decal:{rk:1,life:3}}` (the wheat-ear ring lies for the field's 3 s) and a second inward wave `at:1.5`.
- **Bumper Crop** (`'3'`): add `{swing:{n:3,gap:0.08,r:8,turn:6.28,col:'hot'}}` (the scythe's full turn, as the ult has nine) and `{prop:{kind:'sheaf',n:4,arr:'ring',r:6,anim:'rise',stagger:0.08,at:0.4,size:1,life:2.5,cols:[0,1]}}` for the lingering swathe.
- **Bound** (the `proc`): no ring, no streak: it would fire on every volley. Badge only, once per fight if the proc UI can throttle by name; otherwise the 0.5 s throttle of `vs` and a mote-free hook (`proc:()=>{}` for `'Bound'`).

## 8. Ogden, The Grave Shift: the Rot feeds him

File `src/shared/skillsets/ogden.js`. Look `look-ogden.js`. Test block in `tools/skillsets-v3-smoke.js`. Cave skill Night Shift (unchanged).

**Now.** Spade Sweep (wide cone, 0.68, Rot) / Open Grave (zone 9 m, 4 s, pulls, slows, 0.9 a tick, Rot, cd 11) / Feeding Frenzy (ring 10 m 1.8, pops Rot k 0.5 with half healing him, then a swell that follows him 5 s and mends 1% a tick, cd 38). **Problem**: already linked, but as "build, then spend once every 38 s", and after the Frenzy the field is bare. The survivor theme (he heals from what he does) lives only in passives.

**New**: Rot is his food all the time, not only at the Frenzy; and the Frenzy re-seeds.

| Piece | Change |
|---|---|
| `kit.text` | `'Every shove and the open grave leave Rot (up to 5). Each sweep mends you a little for the Rot near you; Feeding Frenzy spends it for damage and a big mend, and its swell leaves fresh Rot behind.'` |
| pos 1 `warrior` Spade Sweep | add `heal:{v:0.002, r:1, perMark:{id:'rot', v:0.0008, r:6}}` (0.2% of maximum health a sweep with no Rot near, 0.6% with five; `r:1` = himself). Desc: `'Swing the spade low and wide: everything in front of you takes a light chop and is left with Rot. Each swing mends you a little, more for each Rot on the enemies within 6 m.'` |
| pos 2 `any` Open Grave | unchanged (it feeds: Rot every tick on everything in it) |
| pos 3 `any` Feeding Frenzy | the following zone adds `mark:{id:'rot', n:1, dur:12, max:5}` (a Rot each 0.5 s tick on every enemy within 5 m of him for 5 s). Desc: `'A wave of grave-water goes out round you, spends every Rot within 10 m for extra damage and mends you for half of it; then a lingering swell follows you for 5 seconds, keeps mending you and leaves fresh Rot on everything near.'` |
| pos 3 passive Shambling (`ogden_p3`, Bond IV) | `v:[0.004, 0.0006]` -> `[0.003, 0.0005]` (pays for the sweep's mend: with both he would out-heal every grinder) |
| passive 1 (Hungry, the kept one), `bonds`, `ult` | unchanged |

**Why it is order-free.** The Frenzy at any moment: it spends what is there and its own swell has every enemy near him back at five Rot within 2.5 s, so the sweep's mend never drops for long and the next Open Grave is not needed to rebuild. Open Grave first or last: it only adds.

**Payoff.** Sweep mend at 0.8 s: 0.25% to 0.75% of maximum health a second (five Rot near is the usual state on a pack). With Shambling lowered by 0.1% a second the net is about +0.5% a second while he is swinging at a rotted pack, nothing while he runs. Damage: unchanged (ladder 84 / 87 / 112, pack 450). The zone's ticks deal no damage of their own beyond today's (the swell has no `mult` of its own: *verify* that adding a `mark` to a heal-only zone does not make it a damaging one; if a zone with a shape key always hits, give the fx `vs` nothing and accept the swell's damage in the ladder check).

**Tests.** v3 block: a sweep with 0 / 5 Rot within 6 m heals him 0.2% / 0.6%; after a Frenzy that popped everything, a monster inside the swell has Rot again after one tick and five after 2.5 s; a monster 6 m away has none; the mend never exceeds `SS_HEAL_CAP`; `world-soak` unchanged (a heal on every basic swing: watch the tick, `ssMarkSum` scans `MONS` once a cast, as Dunstan's bolt already does).

### Visual upgrade plan

**Now**: Open Grave = one inward dust wave; Feeding Frenzy = one water wave; motes are drops, bubbles, bone. Rot pips are blobs. The swell that follows him is the generic zone, and nothing shows that a sweep fed him.

- **The sweep's mend**: in the look's self-heal hook, two `sh:'bubble'` motes (`cols[4]`) drift **from the nearest rotted monster to him** per swing (a `sslStreak` with `n:2`), up to five at full Rot: he is visibly drinking from them.
- **Feeding Frenzy** (`'3'`): `cast:[{wave:{r:10,style:'water',col:2,h:1.1,life:0.9}}, {wave:{r:10,style:'water',col:2,h:0.6,inward:true,life:0.8,at:0.4}}, {prop:{kind:'hand',n:5,arr:'scatter',r:5,anim:'rise',stagger:0.08,at:0.5,size:0.9,life:5,cols:[3]}}]`: out, back to him (the mend), then a few hands in the mud that stay for the swell's 5 s (the prop the ult uses, smaller).
- **The swell**: `zone:[{decal:{rk:1,life:5}}]` on the following zone so the double wave line travels with him; `zone.mode` `'in'` stays.
- **Open Grave** (`'2'`): add `{decal:{rk:1,life:4}}` and a second inward wave `at:2`.

## 9. Tzaya, The Long Count: the count turns the wheel

File `src/shared/skillsets/tzaya.js`. Look `look-tzaya.js`. Test block in `tools/skillsets-isles-smoke.js`. Cave skill Ember Count (unchanged).

**Now.** Ogden's numbers on purpose (the file says so): Obsidian Sweep (0.68, Tally) / Fire Pit (zone 9 m, 4 s, pulls, slows, 0.9 a tick, Tally, cd 11) / The Reckoning (ring 10 m 1.8, pops Tally k 0.5 with half healing him, a following heat that mends, cd 38). His one own piece is Cinder Count (a critical hit adds a Tally). **Problem**: Own 0.

**New**: where Ogden's mark is food, Tzaya's is **time**: a calendar-priest's count brings his rites round again. Kills and spent Tallies shorten cooldowns; the pit burns the counted harder. With this pass Ogden and Tzaya stop being number-copies (as the combo plan did for Tamsin / Tansy and Meleni / Dunstan: its open question 5 applies here too).

| Piece | Change |
|---|---|
| `kit.text` | `'Every sweep and the fire pit leave a Tally (up to 5). The pit burns the counted harder; the Reckoning spends the count and brings the pit back sooner, and every kill brings the Reckoning back sooner.'` |
| header comment | remove "Numbers are Ogden's on purpose"; say: Tally is time (cooldowns), Rot is food (healing) |
| pos 1 `warrior` Obsidian Sweep | unchanged |
| pos 1 passive Ember Hunger (`tzaya_p1`, the kept one) | from a heal to `{name:'Day Count', text:'A kill takes half a second off The Reckoning (at most every 1.5 s)', on:'kill', icd:1.5, cdr:{burst:0.5}}` (the name changes with the effect; the piece id stays) |
| pos 2 `any` Fire Pit | `mult:0.9` -> `0.8`; the `fx` adds `vs:{when:{marked:'tally'}, k:1.3, name:'Counted'}`. Desc: `'A pit of coals at your target: for 4 seconds everything in it is dragged to the middle, slowed and singed, and left with a Tally. What already carries a Tally burns a third harder. Wide enough to take in the next camp.'` |
| pos 3 `any` The Reckoning | `pop:{id:'tally', k:0.5, r:10, heal:0.5, cdr:{skill:1.2}, cdrMax:5}`; the following zone's `heal:{v:0.01, r:6}` -> `{v:0.006, r:6}` (he keeps a mend, a smaller one: the sustain is Ogden's lever now). Desc: `'A wave of fire goes out round you, spends every Tally within 10 m for extra damage and mends you for half of it. Each Tally spent (up to five) takes 1.2 seconds off Fire Pit. A lingering heat then follows you for 5 seconds and mends you a little.'` |
| `ult.boost` | the row `{piece:'p1', secs:16, mod:{eff:3, icd:0.5}}` now boosts a refund: 1.5 s a kill every 0.75 s for 16 s. *Verify* `eff` scales a trigger's `cdr` (it scales `heal`); if it does not, change the mod to `{icd:0.33}` |
| passives 2 and 3, `bonds` | unchanged (Cinder Count, Bond IV, adds Tallies on crits: with the pit reading Tally it now matters between pits; Bond VI Sunfall lays Tally on kills: the same) |

**Why it is order-free.** The pit's `vs` reads a 12 s mark that the sweeps lay every 0.8 s and its own first tick lays: it is hot from its second tick at the latest. The Reckoning's refund helps whenever it is cast (a pit on cooldown comes back up to 6 s sooner; a ready pit loses nothing). Kills bring the Reckoning whatever killed. Nothing asks for A before B.

**Payoff.** Fire Pit over 8 ticks: 7.2 today; 8.32 on a counted camp (+16%), 8.08 on a fresh one. The Reckoning in a camp that dies steadily (a kill each 1.5 s): 38 s -> about 28.5 s; on one target: 38 s (no kills), and one pit in three comes 6 s early. Ladder single target: sweeps are about 80% of it, so about +2 (82 -> 84); pack: about +8% (465 -> about 500), still well under Tansy's 685. Sustain: he loses the kill heal (1.5% a kill) and 40% of the heat's mend; with Gold Luck's +5% damage taken he is now the greedy grinder who must kill fast, Ogden the one who outlasts.

**Tests.** isles block: a kill takes 0.5 s off `p.cd.burst` and not again within 1.5 s; a Reckoning with 5 Tallies takes 6 s off `p.cd.skill` (2.4 s with 2; 0 when the pit is ready; never below 0); a counted monster takes 1.3x a pit tick, a clean one 1x on the first tick and 1.3x on the second; the heat mends 0.6% a tick; `ult-smoke` (the boosted Day Count). `economy`-free, but run `world-soak` (a `cdr` event on kills: `ssCdrS` already throttles nothing, the `icd` does).

### Visual upgrade plan

**Now**: the thinnest look of the eight: Fire Pit has one inward fire wave, The Reckoning has **no recipe at all**, the ult borrows Ogden's geysers and hands. Tally pips are bars.

- **The Reckoning** (`'3'`, new): `cast:[{wave:{r:10,style:'fire',col:'hot',h:1.2,life:0.9}}, {rays:{n:20,arc:6.28,len:10,col:1,at:0.1}}, {prop:{kind:'sundial',...}}]`: there is no sundial among the 23 props; use `{decal:{r:10,life:1.2}}` (his emblem is the day-sign wheel: the decal kind of the set) spinning (`spin:1.5`) and `{shake:{v:0.35}}`. Twenty rays = the count of days: his own image instead of Ogden's water.
- **The refund**: the `cdr` event already flashes the skill tile (`sspFlashSlot('skill')`); add in the look, on the pop, one gold `sh:'glint'` streak from each monster that paid Tallies to him (the spent-stack burst of `marks.js` gives the positions).
- **Fire Pit** (`'2'`): `zone:[{wave:{style:'fire',col:'hot',h:0.5,inward:true,life:0.9}}, {decal:{rk:1,life:4}}, {prop:{kind:'geyser',n:4,arr:'ring',rk:0.6,anim:'rise',stagger:0.5,life:1,cols:[3],h3:1.5}}]`: small flame spouts round the pit, one each half second, for its 4 s.
- **Counted** (the `proc`): jade-and-gold (`pal.main`, `pal.accent`) flare on the monster, no ring (it fires every tick on a pack: badge plus the 0.5 s throttle).
- **Day Count** is a proc row (it has an `icd`): the badge and the Power tile's flash come for free.
- `SSV_SHAPE.tally` stays `'bar'` (tally strokes); Nephra's Linen is also a bar: recolour only, they are never on the same player's target as the same owner.

## 10. Atuqa, The Terrace Wall: knots are promises

File `src/shared/skillsets/atuqa.js`. Look `look-atuqa.js`. Test block in `tools/skillsets-isles-smoke.js`. Cave skill Cord Snare (unchanged).

**Now.** Torgeir's numbers on purpose: Sling Stone (0.85, taunts 3 s, Knot) / Raise the Terrace (ring 6 m 0.75, Knot, taunt, guard 20%, shield 8% + 3% per Knot, cd 16) / Hold the Wall (ring 8 m 1.25, taunt, guard 30%, shield 14% + 3% per Knot, pops Knot k 0.6 with 40% healing him, cd 40). **Problem**: Own 0; the basic only feeds; Hold the Wall spends what both shields read, so pressing it first thins the Terrace that follows.

**New**: the quipu-keeper's own line is the **shot**: an archer tank whose every stone is worth more against what he has knotted, and who holds a thin shield as long as he keeps shooting into Knots. And the Wall re-ties two Knots on what it struck, so no press thins the next one.

| Piece | Change |
|---|---|
| `kit.text` | `'Every shot, the terrace and every blow you take leave a Knot (up to 5). Shots hit the knotted harder and raise a thin shield for each Knot near you; both walls are thicker for each Knot. Hold the Wall spends them for a heavier blow and ties two again.'` |
| header comment | remove "Numbers are Torgeir's on purpose"; say what is his own: the shot reads Knots |
| pos 1 `archer` Sling Stone | the `fx` adds `vs:{when:{marked:'knot'}, k:1.2, name:'Kept Promise'}` and `shield:{v:0.005, dur:4, r:1, perMark:{id:'knot', v:0.002, r:10}}` (0.5% of maximum health a shot, 1.5% with five Knots near; `r:1` = himself). `mult:0.85` stays. Desc: `'A heavy stone at up to 20 m that pins its target in place and makes it come for you for 3 seconds. A fifth harder against a target that carries a Knot. Each shot raises a thin shield, thicker for each Knot near you. Leaves a Knot.'` |
| pos 2 `any` Raise the Terrace | unchanged |
| pos 3 `any` Hold the Wall | the ring adds `mark:{id:'knot', n:2, dur:12, max:5}`. Desc: the last sentence becomes `'Then it spends every Knot nearby for extra damage, a share of it heals you, and what it struck is left with two fresh Knots.'` |
| passives, `bonds`, `ult` | unchanged (Knotted Ground, the kept passive, already feeds on being hit; Bond VI Sunburst fires when a shield breaks: the shot's thin shield breaks often, and Sunburst's own `icd:5` bounds it) |

**Why it is order-free.** Wall first: 14% shield with whatever Knots are there, then two Knots are back on everything within 8 m, so a Terrace right after it still has +6% of shield from two Knots on one enemy (and the full +15% on a pack of three). Terrace first: it lays a Knot itself, the Wall reads them. The shot's bonus holds on anything knotted, which after the first stone is everything he is fighting.

**The ring's mark and the pop** (*verify*, section 2): if the ring's mark lands before the pop, the pop spends up to two more stacks (at most +1.5 of damage) and no Knots remain. In that case there is no data-only way to re-tie in the same cast: drop the ring's mark and the desc's last clause, and rely on what already re-ties without an order (the Wall's 6 s taunt brings everything onto him, and Knotted Ground, the kept passive, ties a Knot on whatever strikes him). The test pins which case holds.

**Payoff.** Shot: 0.85 -> 1.02 on a knotted target (+20% of the basic, his main damage). Ladder `pieces` 48 -> about 56 (**deliberately up**: the tank's band is a flat 90 and he sits at half of it; Torgeir's own column is the yardstick: he must stay within 10 of Torgeir at `pieces`, so run both). Survival: a shot shield of 0.5% to 1.5% refreshed each second absorbs at most 1.5% of maximum health a second, and only while the larger wall shields are down (a shield in force is not replaced by a thinner one: *verify*, section 2). `boss-duel` must show his time-to-die up by no more than 10%; if more, halve `perMark.v`.

**Tests.** isles block: a stone on a knotted dummy = 1.2x a stone on a clean one (the first stone is 1x: a projectile's mark lands after its damage); a shot with 0 / 5 Knots near raises a shield of 0.5% / 1.5%; a shot during Hold the Wall's 14% shield leaves the 14% in force; after Hold the Wall with 5 Knots every monster within 8 m carries the pinned number of Knots (2, or 0 in the fallback); Sunburst fires at most once per 5 s under a stream of broken shot shields; `proc` names `atuqa_1_archer`. `skillsets-ladder.js --set atuqa` and `--set torgeir` side by side.

### Visual upgrade plan

**Now**: a spear planted where a stone lands, three terrace blocks in an arc for the Terrace, six in a ring for the Wall; Knot pips are knots. The cord, the kit's whole image, is drawn nowhere but the pips.

- **Kept Promise** (the `proc`): a red cord (`sh:'streak'`, `cols[0]`, not additive) snaps taut from the monster to him for 0.25 s, and the monster's knot pips pulse once. One streak, no ring: it fires on most shots (the 0.5 s throttle halves it).
- **The shot shield**: a faint gold weave (`sh:'glint'`, `cols[3]`, 3 motes orbiting at chest height for the 4 s) rather than a ring; denser (6) at five Knots.
- **Hold the Wall** (`'3'`): keep the terrace ring and the shake; add `{rays:{n:6,arc:6.28,len:8,col:0,at:0.35}}` in cord red out to the struck (the cords thrown) and `{decal:{r:8,life:8}}` for the shield's 8 s. The n:2 mark flies two knots onto every monster at the same beat: the "ties two again" of the text.
- **Raise the Terrace** (`'2'`): add `{decal:{r:6,life:6}}` (the guard's 6 s) so the party sees where the wall stands.

## 11. Balance check (what to run, what to hold)

Baselines measured before any change (`node tools/skillsets-ladder.js --set <id>`, 60 s, single target, % of the best non-set loadout; as in the combo plan the columns are far outside the old role bands for most sets since the skill revamp, so **the yardstick is the kit's own value today**):

| Set | role | pieces | 3-set | 5-set | pack at 5-set | expected `pieces` after |
|---|---|---|---|---|---|---|
| dunstan | support | 138 | 169 | 263 | 168 | 139 |
| zahra | support + safe | 189 | 208 | 339 | 233 | 189 |
| ambrose | heal | 86 | 84 | 104 | 111 | 86 |
| nephra | heal | 276 | 284 | 371 | 204 | 276 |
| tansy | grind | 126 | 125 | 194 | 685 | 131 |
| ogden | grind | 84 | 87 | 112 | 450 | 84 |
| tzaya | grind | 82 | 89 | 123 | 465 | 84 (pack about 500) |
| atuqa | tank | 48 | 50 | 62 | 119 | 56 (wanted) |

- **Hold**: each kit's `pieces` within +-5 of its baseline (Atuqa: 52 to 60 and within 10 of Torgeir). If outside, move the basic's `mult` first, then the `vs.k`. A seeded run varies by about 4 points (`LADDER_NOISE`): do not tune inside that. `--check`'s orderings must still pass.
- **The order-free check (new, tools only)**: `tools/skillsets-ladder.js` gets a flag `--orders`: it plays each set three times, the bot preferring burst > skill > basic (today's bot), skill > burst > basic, and "hold the burst until the skill was cast in the last 4 s". **For these eight the three columns must lie within the noise (4) of each other**; a kit that fails is not order-free and its numbers are wrong. (For the six combo kits the same flag should show a spread: a free cross-check of that plan.) One row for the flag in `docs/TESTING.md`.
- Healing, shields and buffs are not on the ladder: assert the 0-mark and 5-mark values in each kit's test block (sections 3-10) and run `tools/boss-duel.js --check` for Ambrose, Nephra, Atuqa and Ogden.
- The tick: Ogden and Atuqa now run `ssMarkSum` (a scan of `MONS`) on every basic cast, as Dunstan, Zahra, Ambrose and Nephra's basics do in this plan too. It is once per cast per player, not per hit, and Dunstan's Cry already does it; still run `npm run bench` before and after (the tick must not move by more than its own noise) and `node tools/world-soak.js`.

**Measured** (`node tools/skillsets-ladder.js --orders --set <id>`, pieces / pack at 5-set for burst first, skill first, burst held; spread pieces / pack):

| Set | before | after |
|---|---|---|
| dunstan | 155/177, 144/167, 136/164; 19 / 13 | 158/233, 150/224, 167/405; 17 / 181 |
| zahra | 186/225, 197/220, 203/241; 17 / 21 | 191/298, 194/275, 210/263; 19 / 35 |
| ambrose | 89/107, 83/110, 88/111; 6 / 4 | 84/117, 86/122, 83/117; 3 / 5 |
| nephra | 303/201, 270/188, 277/193; 33 / 13 | 294/220, 282/201, 291/212; 12 / 19 |
| tansy | 131/685, 126/690, 141/902; 15 / 217 | 131/726, 140/912, 142/753; 11 / 186 |
| ogden | 88/414, 85/448, 85/443; 3 / 34 | 82/416, 86/433, 85/419; 4 / 17 |
| tzaya | 77/474, 85/492, 84/468; 8 / 24 | 81/444, 90/466, 87/474; 9 / 30 (after the tuning) |
| atuqa (torgeir 66/140, 72/143, 68/140) | 47/113, 46/97, 44/93; 3 / 20 | 54/101, 49/98, 51/106; 5 / 8 |

The spreads were already above the noise before this pass (cooldown alignment alone moves a set: a pulled camp under a ring), so the target "within 4 of each other" is not met by most kits; the change of the spread is the useful number.

## 12. Build order and the tests of each step

No engine step. Each kit is one data file, one test block, later one look file; they are independent and can ship one at a time.

1. **Ladder `--orders`** (`tools/skillsets-ladder.js`), run on today's data to record the spread before any change.
2. **Dunstan, Ambrose, Tansy** (`tools/skillsets-first8-smoke.js`). Tansy first needs the `ssMarkS` refresh check of section 7 and `SSV_SHAPE.twine`.
3. **Nephra, Ogden** (`tools/skillsets-v3-smoke.js`), **Zahra** (`tools/skillsets-v3b-smoke.js`; the registry check of the zone's `status.perMark` first).
4. **Tzaya, Atuqa** (`tools/skillsets-isles-smoke.js`; the pop / ring-mark order first).
5. After each kit: `python3 build.py --check`, `node tools/run-tests.js`, `node tools/skillsets-ladder.js --set <id> --orders`, `node tools/ult-smoke.js`, `node tools/cave-sets-smoke.js`, `node tools/skillsets-passives-smoke.js` (Tzaya's and Zahra's changed passives), `node tools/client-smoke.js` (the panel reads the new texts).
6. **Looks**: the `vis` recipes and hooks of each "Visual upgrade plan", after the combo plan's visual pass has added the look `proc` hook (they share it). `client-smoke` fails on a bad recipe (`SKV.bad`). Look at each near the Training Scarecrow with `node tools/shot.js` (`docs/TESTROOM.md`) or ask the owner to playtest.
7. **Docs**: the kits' rows in `docs/skillkits/kit-support.md`, `kit-healer.md`, `kit-grind.md`, `kit-tank.md`, `kit-mixed.md` (Zahra); `VISUALS.md` (the eight rows, the new `twine` shape); `docs/SKILL-SETS.md` if it lists marks (Twine); the status line at the top of this file.

## 13. Open questions for the owner

1. **Tansy gets a mark** (Twine, one stack, no spender). The combo plan left her alone as the first, easiest set. This keeps her with nothing to time, but she is no longer "no mark at all". Wanted, or leave her as she is and take Sabir as the eighth instead?
2. **Ogden / Tzaya and Atuqa / Torgeir stop being number-copies** (the files say the copies were on purpose so the ladder holds). Same question as the combo plan's number 5.
3. **Tzaya loses his kill heal** (it becomes the Reckoning's refund) and part of the heat's mend. He becomes the fast, greedy grinder and Ogden the durable one. Fine?
4. **Zahra's sandglass weakens enemies** (4% to 10%, the shared `weak` status). The file says she debuffs nothing herself, but Heat Haze already does. A buff support with a small party-wide debuff: acceptable, or keep it to her own guard numbers?
5. **Atuqa's damage goes up about 15%** on purpose (48 is half the tank band). If tanks are meant to sit that low, drop the shot's `vs` and keep only the shield and the re-tie.
6. **Lower floors**: Ambrose's lash heals 2% (was 2.5%) and Nephra's shields start 2-3 points lower when no mark is near, to pay for the higher tops. As with Hollis in the combo plan, that is a small nerf to play that never builds the mark. Fine for healers?
