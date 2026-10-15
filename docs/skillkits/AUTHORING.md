# Adding one skill set (a kit with its theme) as data

> For an agent that writes **one** set. Read `RULES.md`, your kit's file (`kit-<archetype>.md`) and your theme's rows (`THEMES.md`, `ELEMENTS.md`), then this file: it says how to turn them into code, what a piece may use, and how to test it. You add **your files and one line in `src/manifest.json`**; you change no engine file. If the kit needs something the engine lacks, say so and stop: that is a separate change (section 7).

## 1. What is built (the base) and what is not

**Built** (the engine every kit uses; tested by `tools/skillsets-smoke.js`, `reactions-smoke.js`, and a check in `client-smoke.js`): the registry `defineSkillSet` with its checks and expansion into ordinary skills and passives (`shared/skillsets.js`); universal pieces (`cls:'any'`) and slot-1 pieces for every class; wearing a piece for all three classes at once; the 3-set and 5-set bonuses (stat rows, triggered rows, costs); personal **marks** (`mark`, `pop`, `amp`); skill modifiers `vsBoss`, `behind`, `rangeScale`; **triggered** rows (`hit crit kill hurt cast1-3 tick low`); `reflect`; **ally buffs** (`might guard haste crit critdmg regen`), a **party heal**, **shields**; **taunt**; **conditional passives** (`when`) and the richer stats, triggers and effects of section 4b; **elemental auras and reactions** with direct application (`flavor`, `status`; `docs/REACTIONS.md`); the shown pieces in the skills panel (K) and the mark pips and aura marker on the client; the testing tools (`dev set`, and for every player the free `ft` tools of version 2); the power-ladder harness `tools/skillsets-ladder.js`.

**Not built** (none of it is needed to write and test a kit): where a set comes from in play (**M3**: the 10% / 20% drops with their pity; until then a set is only given by the testing tools: `dev set`, and in version 2 the free ones in the settings), the boss-skill changes (**MB**), outfits, gems and the wardrobe (**M4, M5**), the Sets cards in the skills panel (pieces show in the normal grids once owned), a glyph of your own for each piece (the generic burst glyph is used), the grinder's spawn tuning (**MW**), the Reactions chart in the skills panel (**R3**). `docs/SKILL-SETS.md` section 12 has the order.

## 2. The files you add

| File | What |
|---|---|
| `src/shared/skillsets/<id>.js` | one `defineSkillSet({...})` call and **no top-level name**; `<id>` is the theme's first name in lowercase (`THEMES.md`), permanent once shipped (a rename drops every player's pieces) |
| `src/manifest.json` | one line, in the `shared` list **after the last file** (the dungeons' themes must exist first: the set's dungeon is checked when it is defined) |
| `src/game/skillsets/look-<id>.js` + one manifest line in `game`, after `skillsets/looks.js` | the set's look: how its skills are drawn in its outfit's colours (`VISUALS.md`); without one the set is drawn like any generic skill |
| `tools/skillsets-<id>-smoke.js` (or a block in `tools/skillsets-first8-smoke.js`) | your set's checks (section 6) |
| `docs/FILES.md` | `python3 build.py --write-index` (the file starts with a `//@` line saying what it is) |

## 3. The shape (a complete minimal set; every value here is a placeholder)

```js
//@ Tansy's skill set (a grinder: sweeping blades, a pulled field): <one line of what the set is>
defineSkillSet({
  id:'tansy', name:'The Harvest', land:'home', needs:{tier:1}, el:'basic',
  role:{main:'grind'},                                   // risk | safe | grind | support (+ focus buff|debuff|both) | heal | tank; a mixed set adds also:{role, part:'major'|'mild'}
  char:{name:'Tansy', sex:'female', theme:'a farm-hand who harvests a whole field at once', ip:{kind:'original', riffs:'farming'}},
  pal:{main:0xd8c070, accent:0x9a7a30, glow:0xfff0b0},
  emblem:{col:0xe6c35f, glyph:'<path d="M12 22V10"/>...'},   // the set's own symbol on its skills and passives (the panel and the action bar): up to 900 characters of path / circle / ellipse / rect / line shapes drawn as strokes in a 24 x 24 box, and the colour to draw them in; one symbol and one colour per set, never the generic star
  kit:{mark:'chaff', name:'Chaff', text:'what the three actives do with the mark'},             // optional; a mark is only needed if a piece applies one
  pos:{
    1:{bound:'class', skill:{                            // slot 1 (the basic attack): all three classes, always
         warrior:{name:'Windrow Sweep', desc:'...', cd:0.9, range:3.4, mult:0.5, act:['windrow',0.5,0.35], anim:'slash', fx:{cone:{r:3.6, arc:2.2}}},
         archer:{ ... }, mage:{ ... }},
       passive:{name:'Steady Hands', text:'+{}% maximum health', stat:'hp', v:0.05}},
    2:{bound:'any', skill:{any:{name:'Gather In', desc:'...', cd:9, range:12, mult:0.6, act:['gatherin',0.7,0.5], anim:'nova', fx:{zone:{r:7, dur:3, every:0.5, kb:-4}}}},
       passive:{name:'...', text:'...', on:'kill', icd:2, heal:0.02}},
    3:{bound:'any', skill:{any:{ ... fx:{ring:{r:9, kb:5}, ally:{kind:'might', v:0.1, dur:8}} }},
       passive:{ ... }}},
  bonus:{3:{name:'...', text:'...', stat:'dmg', v:0.1}, 5:{name:'...', text:'...', on:'crit', icd:1, fx:{ring:{r:4}}, mult:0.4}},
});
```

A skill entry is a skills-table row minus what the registry fills in: `name`, `desc`, `cd`, `range`, `mult`, `act:[kind, seconds, when it lands]` (**the kind is unique among all skills**: use `<set><pos><class>`), `fx` (**required: a signature skill is data-only, what it does is its fx**, with at least one shape), and optionally `anim` (a body animation another skill already borrows: `slash shoot cast nova spin volley`), `el` (a piece's own element: a hybrid names it on every piece; a single-element set only says it for a special case, with a `why`), `buff`, `why`. The registry fills `id`, `cls`, `slot`, `lv` (its source's level), `price:0`, `set`, `pos`.

## 4. What a piece may use

**A skill's `fx`** (resolved by `resolveFxS`, `server/combat.js`; drawn from the same data by `skill-fx.js`, no client code):

| Key | What it does |
|---|---|
| `ring:{r,kb,stun,slow,burn:{dur,k}}` | everything within r of you takes the hit (kb < 0 pulls it in) |
| `cone:{r,arc,hits,kb,...}` | everything in front within r, arc radians wide, hits times |
| `beam:{len,w,hits,steal}`, `chain:{n,fall,range}`, `dash:{ahead,behind}` | a line (steal: a share of the damage heals you), a lightning that jumps, a jump to the target (`behind:true`: land on the far side of it, `ahead` metres past) |
| `proj:{kind,n,spread,seek,speed,turn,life,splash:{r,k},zone:{...}}` | projectiles (kinds `ember frost spirit spore thorn`), their splash and the zone they leave |
| `zone:{r,dur,every,once,follow,self,kb,slow,stun}` | a ground area at the target (or on you, `self`; `follow`: it goes with you) |
| `buff:1` (+ the entry's `buff:{dur,dmg,cd,crit,red,steal,regen,el}`) | your own timed boost |
| on a `ring`, `cone`, `proj` or `zone`: `mark:{id,n,dur,max}`, `flavor:'<element>'`, `status:{kind,v,dur}` | a mark of the kit (personal, stacks to `max`); the element's flavour at full strength (burn slow stun spread weak vuln); a general status by name (`vuln` / `weak` up to 0.5, `slow`, `stun`) |
| `vsBoss:k`, `behind:k`, `rangeScale:{from,to,k}` | this skill's damage x k against a boss / from behind a monster / growing with the distance |
| `pop:{id,k,r,heal}` | spend your marks of `id` on the target and everything within r of it: k x the damage per stack, a share of it heals you |
| `ally:{kind,v,dur,r}` (or a list) | the caster and the party within r (default 25 m) in the same run get the buff: `might guard haste crit critdmg regen`, never stacking (the stronger wins), capped |
| `heal:{v,r,lowest}`, `shield:{v,dur,r}`, `taunt:{dur,r}` | a share of maximum health back (at most 50% a cast) for the party (`lowest:true`: only the ally with the least health); a damage-absorbing pool; monsters near you come for you (a boss for half the time, none while enraged) |

A **zone** may also carry `ally`, `heal`, `shield` (applied to the allies standing in it each tick).

**A passive or a bonus row** has `name`, `text` and **one** of: `stat` + `v` (`hp dmg crit red cd drop xp soul reflect rxk rxicd critdmg heal buffpow buffdur debuffdur area regen overflow revive`, section 4b; `v` a number or `[level 1, per level]`; the text has `{}` for the percent), or `on` + an effect, or `amp:{id,per}`. Triggers: `on` is `hit crit kill hurt cast1 cast2 cast3 tick low` (`low` also `below`), with `chance`, `icd` (**required** for `hit crit hurt tick low`; for `tick` it is the interval) and one or more effects: `fx` (damage through a skill's shapes, `mult`, `range`, `el`; it leaves no aura and fires no trigger), `heal` (a share of your maximum health), `mark`, `status`, `buff:{kind,v,dur,r}` (the ally buffs), `shield:{v,dur}`. `cost:{stat,v}` (v negative) is what the same row pays (less maximum health, less damage reduction, longer cooldowns). `rxk` makes the reactions you trigger stronger and `rxicd` shortens their cooldown (`docs/REACTIONS.md`).

## 4b. The richer vocabulary (conditions, more stats, more triggers and effects)

Everything here is checked by the registry (a bad key leaves the set out, section 5) and tested in `tools/skillsets-smoke.js` and `skillsets-first8-smoke.js`.

**`when`: a condition on a stat row, a `cost`, or a triggered row.** A stat row with a `when` adds its number only while the condition holds, read where the fight is known (`ssCondP(p, stat, monster)`); a trigger with a `when` fires only then. All keys of one `when` must hold. A `when` is allowed on the stats `dmg crit critdmg red rxk rxicd heal buffpow buffdur debuffdur area regen`.

| Key | Holds while |
|---|---|
| `moved:s` / `still:s` | you moved within the last s seconds / have stood still for s seconds |
| `dist:{from,to}` | the target is at least `from` and at most `to` metres away (either alone is fine) |
| `tgtHp:{above,below}`, `hp:{above,below}` | the target's / your health share is above and / or below |
| `taunting:true` | the target was taunted by you |
| `marked:'<mark>'` | the target carries your mark |
| `behind:true` | you are within 60 degrees of straight behind the target |
| `boss:true` | the target is a boss (a `cost` with this one is the "bad for bossing" lever) |
| `crowd:{n,r}` | at least n enemies within r metres of you |
| `allies:{n,r}` | at least n party members (you not counted) within r metres |
| `exposed:true` | the target carries a `vuln` or `weak` status |
| `combat:true` | you were in a fight in the last few seconds |
| `shield:true` | you hold a shield |

**More stats** (`stat` + `v`): `critdmg` (+critical damage), `heal` (your heals and heal-over-time stronger), `buffpow` (the strength of the ally buffs you give), `buffdur` (their length), `debuffdur` (the length of the statuses you put on monsters), `area` (rings, cones and zones wider), `regen` (a share of maximum health a second, always), `overflow` (a share of the part of a heal that would overheal turns into a shield on the one healed), `revive` (a share of health a party member you bring back stands up with).

**More triggers** (`on:`): a list works (`on:['kill','crit']`); new kinds `taunt` (you taunted a monster), `shield` (a shield of yours broke or ran out), `revive` (you brought a downed party member back in a run; the ctx has him as `q`); `streak:{n,secs}` on a kill trigger: the n-th kill within secs seconds; `at:'target'`: the effect is centred on the monster the trigger is about (a kill: where it died) instead of on you. **More effects**: `cdr:{basic|skill|burst|all: seconds}` takes seconds off those cooldowns (event `cdr`), `shield:{v,dur}` and `heal` on a trigger.

**Scaling with marks** (`perMark:{id,v,dur,r,max}` inside an `ally`, `heal` or `shield` entry; `v` a share and / or `dur` seconds added for each stack of YOUR mark `id` on the enemies within r of you, counted up to `max` (default 5) over all of them together; and inside a `status` of a shape: a share added for each stack on the target). **A mark that lands only from behind**: `mark:{..., behind:true}`. **A taunt inside an entry** (`cone`, `ring`, `proj`... `taunt:{dur}`): what that entry hits comes for you, from any range.

**Numbers** are guidelines (`RULES.md` section 2): safe DPS 110 / 125 / 150 of the baseline, risk DPS 125 / 142 / 170 on good play, support, healer and tank a flat 90, a mixed set about 120 to 135, a grinder about 50% on one target and about twice the farming. Caps in `shared/skillsets.js` (`SS_ALLY_CAP`, `SS_HEAL_CAP`) and `shared/reactions.js` (`RX_ST_CAP`).

## 5. What the registry rejects (your set is then left out, warned about and listed in `SS_BAD` with the field)

An id that is not a lowercase word or is taken; a land or tier that does not exist, or a second released set for the same land and tier (`dev:true` sets are exempt and are never rewarded); a bad role (a focus on a non-support, a support without one, a second role of the same kind); **a hybrid element on a support, healer, tank or mixed set**; a basic set with an elemental piece; fewer than 4 of 6 pieces in a single element; a missing class version, a position-1 piece not bound to the class, a missing position or bonus; an unknown skill key, fx key, element or animation; a skill without an `fx` shape; an attack kind used twice; a trigger without its `icd` or effect; a cost that is not negative; a `pop` or `amp` of a mark the set never applies; a gender that is neither, an IP entry that says nothing, a name another set has. **Lint** (`ssLint()`, a warning, not a rejection): the first grinder is not pure basic, a hybrid of soul opposites, a piece in another element without a `why`, the gender ratio.

## 6. How to try it, and what your test checks

- Play it (version 2): the settings popover has **Skill sets and outfits**, free for every player on every server (`ft` messages, `server/skillsets-free.js`: unlock the set, unlock and put it on, wear its outfit; no level is given: the pieces ask for levels 29 to 32, so reach them by play or with the `dev level` tool); it goes away when the real sources land. Or `dev` messages (solo game and a `--dev` server): `NET.send({t:'dev',cmd:'level',v:30})` (all three passive slots and every burst open), then `NET.send({t:'dev',cmd:'set',v:'<id>'})` gives all six pieces; open the skills panel (K): a piece shows once it is yours, drag it onto its slot (or Equip): **one action wears it for all three classes**. Reactions need two elements: bring a second player or a hybrid.
- The power ladder: `node tools/skillsets-ladder.js --set <id>` prints your set's damage at 3 actives, the 3-set, the 5-set and all six as a percent of the best non-set loadout, on one target and on a pack, with warnings outside the band; `--check` fails only on the damage kits' orderings.
- Your smoke test (copy the pattern of `tools/skillsets-smoke.js`): load the server with `loadServer(io, [...names])`; assert the set registered (`SS_SETS.<id>` exists and `SS_BAD` has no row for it), that each piece does what its kit file says (give the set with `ssGrantSetP`, wear it with `ssEquipPieceP`, hit a monster with `resolveFxS` / `damageMonsterS`, read marks with `ssMarkN`, statuses with `allyP` and `rxVulnK`), that the bonuses are in force at 3 and 5 pieces, and the ladder's orderings. Use `Math.random` stubbed (`still()` in the smoke test) for exact damage ratios.

## 7. If you need more than this

A new `fx` key, trigger kind, buff kind or stat is an engine change: add it to the lists in `shared/skillsets.js` (`SS_FX_KEYS`, `SS_ON`, `SS_BUFF_KINDS`...), read it in **one** place in the server, mark the hook line `// skillsets: <what>`, add it to the table in `docs/SKILL-SETS.md` section 10 and a check to `tools/skillsets-smoke.js`. Ask the owner first for anything that changes how existing play feels.

## 8. Pitfalls

Piece and set ids are permanent. Every `act` kind must be new (a clash rejects the whole set). A support, healer or tank piece must still deal damage. A kit's marks are personal and its statuses shared: do not rely on another player's marks. A trigger's own damage fires no trigger and leaves no aura (by design: no chains). `behind` means within 60 degrees of straight behind the monster. A heal is capped at 50% of maximum health a cast. Slot 1 replaces the class's basic attack: its `cd` and `mult` should be a basic's (0.5 to 1.5 s). The set's dungeon theme must exist when the file loads (it does if the line is last in `shared`).
