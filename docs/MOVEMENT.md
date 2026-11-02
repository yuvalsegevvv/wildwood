# Movement slot

A sixth loadout slot below the passives (level 5, `MV_SLOT_LV`), holding one of six **free, common** movement skills that belong to no skill set. Saved as `gear.skills.mov`, part of presets (`mov`).

| Skill | Button | What it does |
|---|---|---|
| Double Jump | Jump | second jump in the air, once until you land |
| Glide | Jump (hold) | caps the fall speed while held |
| Swift Dash | Dash (Shift) | the existing dash goes farther and recharges sooner |
| Sprint | movement button | +50% speed for 4 s, 10 s cooldown |
| Leap | movement button | high, far jump along your move direction, 4 s |
| Backflip | movement button | flip away from where the camera looks, 3 s |

The movement button is the `mov` key action (default 6), a controller's left stick click (button 10; the camera-view toggle moved to button 16) and the action-bar tile `#abMov` (shown only when the worn skill uses it).

Files: `shared/movement.js` (registry `MV_SKILLS`, numbers), `server/movement.js` (message `movequip {id|null}`), `game/movement/slot.js` (effects, tile, skills panel tab), `styles/35-movement.css`; hooks marked `// movement:` in `player/movement.js`, `economy/skills.js`, `ui/combat-hud.js`, `server/players.js`, `server/presets.js`. Movement is client-owned, so the server stores only the choice. Test: `node tools/movement-smoke.js`. Add a skill: one row in `MV_SKILLS`, an icon in `MV_ICON`, and its effect in `slot.js`.
