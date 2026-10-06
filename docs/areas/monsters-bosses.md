# Monsters and bosses

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### How a monster or boss looks (models, animation, look flags)

one file per family in `game/combat/monster-*.js`, each filling `MODELS.<def's model>={geo,build,anim}` (registry and helpers in `monster-parts.js`: `moLoft` / `moLoftZ` lofted bodies, `moTube` curved tubes, `moHorn`, `moCone`, `moEll`, `moPatch`, `moLump`, `moBone`, `moMerge`; all take a colour number or a paint function). `geo` builds the merged geometry of one kind once (`MON_GEO`), `build` makes one monster's meshes and pivots on first sight (`P0` holds what `anim` moves), `anim` poses it each frame. Families: `monster-blobs.js` (slime: `pal.deco` moss / crust / shell / petal / crystal / shard; shroom, kodama `pal.spirit`), `-bugs.js` (beetle: `pal.kind` iron / scarab / kabuto / ice; `pal.spider`, `pal.lady` the Jorogumo; `pal.crab`, Carapax), `-beasts.js` (boar `pal.ram` / `spiky` / `shaggy`; fox `pal.tails`, `wolf`, `cat`, `flame`, `mane`), `-wyrm.js`, `-woods.js` (treant `pal.kind` dead / moss / snow / blossom / bamboo / rock / ice / thorn; the Rootwarden; totems), `-spirits.js` (wisp; ghosts by id), and the goblin family (`monster-folk.js` rig and body plans `FOLKS`, chosen by `pal.form` goblin / hob / oni / kappa / tengu / undead / yeti / troll / viking; `-heads.js`, `-gear.js`: weapons, helms, hats, horns; `pal.embers` glowing cracks). The bosses' own trimmings: `monster-boss.js` (Akaoni, Ymrik, Kyuubi) and the `d.boss` / `d.id` branches in `-woods.js`, `-bugs.js`, `-wyrm.js`. **See them**: `node tools/monster-preview.js out.png --ids oni,boss` (or `--bosses`, `--pose`, `--act`, `--head`, `--stats`)

### Boss mechanics / visuals (six bosses)

Boss mechanics / visuals (all six bosses: `BOSS_DEFS` in `shared/monster-defs.js`, each names its `kit`). The shared part (engage, melee cleave, phases at 60% / 30%, reset) is `server/boss.js`; the moves are primitives in `server/boss-fx.js` (telegraph kinds circle / cone / line / donut / mark, zones, walls, orbs, `pfxS`, timed steps `laterS`, casts `castS`, `moveBossS`) and each boss's own set is `BOSS_KITS.<kit>` in `server/boss-kits-home.js` (Rootwarden, Carapax), `-vale.js` (Akaoni, Kyuubi), `-north.js` (Ymrik, Vetrmaw): `start`, `tick`, `phase`. `B.mode` (0 normal, 1 airborne, 2 hidden, 3 shielded, 4 whiteout, 5 blizzard) and `B.aux` go to the client in the snapshot; `bar` in the def is the boss-bar text per mode. Client: `game/combat/boss.js` (telegraph shapes and endings, boss bar, `bossVisual`: lift / hide), `boss-fx.js` (zones, waves, `pfxStep`: frozen / slowed / shoved / whirlpool pull, called by `updatePlayer`); orbs are `proj` events of kind `foxfire` (attacks.js); test `node tools/boss-smoke.js`. A new boss move = a kit function (+ a tele kind in `addTele`/`endTele` if it needs a new look)

### Carapax, the Tide King (level 20, the south beach)

Carapax, the Tide King (level 20, the beach): arena `ARENA_TIDE` (`shared/beach.js`, found by `beachSpot`; its zone is picked by `edgeZoneAt`), crab model (`pal.crab` on the beetle model, `game/combat/monster-bugs.js`), the beach dressing `game/village/buildings-beach.js`, def `CARAPAX_DEF` (`music:'boss15'`, the Rootwarden's theme, as a placeholder), six skills `drop:'carapax'` in `classes.js`, quest in `BOSS_QUESTS`

## Elements of new monsters (a guideline)

The wheel (`shared/elements.js`) gives every element the same shape, but the roster's mix decides how often each one meets its good and its bad matchups: a hit is resisted by a monster of its own element and by the element that beats it (so **water is resisted by water and earth**), and beats one element. **The existing roster is not changed** (the owner's decision); this steers the monsters still to come.

- **Where it stands** (non-boss monsters in the world, 1,060 elemental plus 119 element-less; the mean per element is about 177): water 237, earth 222, air 195, dark 192, fire 153, light 61. By kind (72): water 15, earth 15, air 14, dark 12, fire 8, light 4, none 4.
- **For each release** (a land, a zone or a dungeon's mobs): count first (the command below), then give the new kinds to the elements furthest **below** the mean, so the tallies converge over the releases. Today that means **light first, then fire**, then dark and air; water and earth wait. Aim for each element within about 25% of the mean over the whole game, counted by monsters in the world (what a player meets). **A guideline, not a gate**: do not hand-tune counts, and do not leave a land with a single element (three or four per land keeps every soul useful everywhere).
- **A few element-less kinds** (props, helpers, an odd boss) are fine: nothing beats them and they resist nothing.
- **Skill sets** (`docs/skillkits/ELEMENTS.md`): when a set's element is chosen, glance at the tally too; the roster's balance is what keeps no element a better pick than another.
- **The count:** from the repository root, `node -e "const {loadServer}=require('./tools/load');const {x:W}=loadServer({send(){},broadcast(){}},['MONS']);const t={};for(const m of W.MONS)if(!m.def.boss){const e=m.def.el||'none';t[e]=(t[e]||0)+1}console.log(t)"` (the kinds and their elements are also in the `El` column of `docs/MOBS.md`).

## Pitfalls

- Monster models (the rework taught these): **never mirror geometry with `scale(-1,1,1)`** (it turns the faces inside out and back-face culling hides them: build the left and right sides separately, as the wyrm's wings and the folk's hands do, or draw both windings). `poseRig` overwrites `spine`, `head` and the limbs' rotation every frame, so a hunch or a head tilt is baked into a fixed group (`tilt`, `headTilt`) under them. A monster's meshes are built the first time it is within view (`updateMonsters`), so `m.parts` is `null` before that and a roster of 1,000 costs nothing until the player gets near. Every `pc(...)` geometry needs normals: build spheres and lofts through the helpers, or `merge` throws. A model's bounding size decides nothing on the server (`rad` / `height` in the def do), so keep a new model near the family's `height` at scale 1. To judge a model in the game's own lighting, serve `dist/` (`preview_start` `wildwood-static`), patch a debug hook into a copy of the page (`window.__dbg={VIL,P,camera,getH,addMonView,DEF_BY_ID,...}` before `buildGeometries();`, a `renderer.render` wrapper for a photo camera), start solo, set level 50 and put client-only views on the village plaza with `addMonView([9000001,'oni',x,z,1,x,z,0,0])` (the forest is too dense, and the monsters there fight back); the headless `tools/monster-preview.js` is the quick loop.

## Reference numbers

- Monsters: 40 of each level-1 kind down to 26 of each level-11 kind, levels 12-15 a quarter more (30 down to 25: their zones reach the land's edge), the
  five edge kinds (levels 16-20) their own `count` (10-20); respawn 35 s; think within 110 m.
