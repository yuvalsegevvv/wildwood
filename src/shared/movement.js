//@ Movement skills (the movement slot below the passives): common skills, free, in no skill set: a registry of six, the slot's level, the tuning numbers
/* ---------- movement skills ---------- */
/* agent map: `skills.mov` (the worn id or null) lives in the loadout beside `pass`; it is saved, sanitized (server/players.js sanitizeSkills) and
   part of a preset (`mov`, shared/presets.js). Every movement skill is free and owned by everyone: no shop, no drop, no level of its own, no cost
   but a cooldown. They change only how YOU move (the client owns movement, game/movement/slot.js); the server stores the choice
   (message movequip {id|null}, server/movement.js) and checks the slot's level.
   btn: which button drives it. 'jump' = the Jump key (a second press in the air, or held while falling), 'run' = the existing Dash key (it changes
   that dash), 'mov' = the movement button of its own (key `mov`, default 6; a controller's left stick click; the tile #abMov).
   Numbers are the designer's knobs (seconds, metres per second): see MV_SKILLS rows. Test: tools/movement-smoke.js. Doc: docs/MOVEMENT.md. */
const MV_SLOT_LV=5;
const MV_SKILLS={
  doublejump:{name:'Double Jump',btn:'jump',cd:0,desc:'Press Jump again in the air for a second jump, once until you land.',jump:5.6},
  glide:{name:'Glide',btn:'jump',cd:0,desc:'Hold Jump while falling to slow your fall to a glide.',fall:2.4},
  swiftdash:{name:'Swift Dash',btn:'run',cd:0,desc:'Your Dash (Shift) goes about 40% farther and is ready again sooner.',dashT:0.28,dashV:25,dashCd:0.7},
  sprint:{name:'Sprint',btn:'mov',cd:10,desc:'Run 50% faster for 4 seconds.',dur:4,speedK:1.5},
  leap:{name:'Leap',btn:'mov',cd:4,desc:'Spring high and far along the way you move (on the ground).',up:8.5,fwd:15},
  backflip:{name:'Backflip',btn:'mov',cd:3,desc:'Flip backwards out of trouble, away from where the camera looks.',up:7,back:12},
};
const MV_IDS=Object.keys(MV_SKILLS);
for(const id of MV_IDS) MV_SKILLS[id].id=id;
const mvDef=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(MV_SKILLS,id)?MV_SKILLS[id]:null;
