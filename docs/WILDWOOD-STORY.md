# The Wildwood story (the prologue and the zone-one revamp)

The approved dialogue script lives with the owner (scenes 1-38). This file is the code map of what is built so far. **Built: the prologue P1-P6 and the new W1 (scenes 1-7).** Next: the witch, the north road and the cure (scenes 8-17), the training arc, the Rootwarden.

## What the prologue is
Six steps before W1, all led by Tansy, who runs ahead: P1 the morning at the well (Wren healthy), P2 the road to her farm (three markers), P3 slimes (a cold ripple crosses the screen), P4 the farm (the crown in the loft, try a weapon), P5 the road back (shrooms, the first skill, the ash sky), P6 Wren (the grey; the sick Wren lies in the bed). W1 is now "Who knows a cure?" (Linnea, then Dunstan, then armour).

## Code map
| What | Where |
|---|---|
| The steps | `MQ` in `shared/main-quest.js` (ids `P1`-`P6`, `W1`) |
| Places, Tansy's position, the sick Wren rule | `MQ_FARM`, `MQ_PLACES`, `mqStoryAt`, `mqWrenSick` (`shared/main-quest.js`) |
| New part kinds | `visit` (walk to a place, `say` shows in the bubble), `spawn` (a few ordinary monsters for you), `fx` (a dark moment), step `intro` (said after the previous step's last talk) |
| Server | `mqVisitP`, the spawn branch of `mqTickP`, `fx` in `mqProgressP`, the story-villager rule in `mqTalkP` (`server/main-quest.js`) |
| Client | `mqPartTarget` (`economy/main-quest.js`), `mqDarkFx` (`economy/main-quest-fx.js`, event `mqfx`), the farm and log (`world/farm-props.js`), Tansy/Wren moving (`atFn` in `village/villagers.js`, `villagers-outfits.js`), the gold guide trail on P1-W1 |
| Skill slot 2 | `SKILL_SLOT_LV` is 2 (`shared/classes.js`): P5 teaches it at level 2 |
| Saves | `MQ_VER` 3, `MQ_INSERTED` entries are `[after, n, version]` (`mqMigrate(s, ver)`): an older save moves up by the steps inserted since its version |

## Events
`mqfx [pid, 'ripple'|'ash'|'grey']` (server -> client). Visit scenes reuse `sqsay [pid, title, lines]`.

## Notes
- Healthy Wren is a second villager (`wren0`) so the sick one (`wren`) keeps its id for the later steps; `wren0` is shown until `mqWrenSick`.
- P6 puts the visit at the bed, not the well: the sick Wren is already in the bed when you arrive (a change from the script, which carries them there).
- Test: `node tools/mainquest-smoke.js`.
