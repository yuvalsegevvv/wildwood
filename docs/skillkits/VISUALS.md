# The skill sets' looks: how a signature skill is drawn in its outfit's colours

> **Built, not looked at in a real game.** The eight sets (`src/shared/skillsets/<id>.js`) each have a look (`src/game/skillsets/look-<id>.js`) built on one engine (`looks.js`). The tests prove that every piece of every set draws without errors and that everything it makes is gone again (`client-smoke`); **nobody has seen the effects yet**: a preview in headless Chromium was tried and dropped (software WebGL renders the whole game at 0.2 frames a second), so colours, sizes and counts are reasoned guesses to judge in the game. Outfits: `docs/skillkits/looks/`.

## What it does

A skill with generic effects (`fx`) is drawn from its row, in the colour of its element (`skill-fx.js`). A **signature skill** (a row with `set`) is drawn by its set's **look** instead: the palette and the motif of the character's outfit.

| Set | Motif (what flies, what is laid on the ground) | Ground pattern |
|---|---|---|
| Tansy | wheat ears and chaff fall and swirl (Gather In spirals them in, Bumper Crop throws them out), the sweep is a wheat-gold arc, a ring closes like a twine tie | wheat ears round a ring |
| Torgeir | stone chips, bone shards and lichen; a round shield flashes in front of Anchor Strike; every taunt stands a ring of stone slabs up; a shield on a player is a lichen bubble | iron band with bone rivets |
| Sazanka | ink wisps, vermilion cord flicks, crossed white-blue and violet crescents; a delivery tag drops where she lands; Dusk Flurry whirls crescents round her | cords looped round an indigo ring |
| Corvin | lamp-white spikes fan from the lantern shield, brass dust, plumb lines; Open the Shutter sweeps parallel bars of light, Noon raises a column of light and a ring of rays | a brass dial with ticks and a hand |
| Sorrel | barred feathers on the wind, sky-blue wind streaks, a long streak for her shots; Mark the Gap closes a lens on its target and spreads a dashed ring 6 m; the charged shot winds a spiral of wind round the shooter | a lens with a crosshair |
| Ambrose | dewdrops, bubbles, reed blades; ripples go out and come back (Ebb and Flow), High Water raises a column of bubbles; a heal lifts bubbles off the ally, a shield is an aqua bubble | double wave line with shells |
| Dunstan | embers, flame tongues and swallow-tail pennants; a ring is a drum beat in three rings; Banner Down plants a pole and a pennant and beats a ring every second; a buff lifts pennants off the buffed player | three-tongued flame notches |
| Marigold | paper lanterns, ribbons and gold sparkles; Curtain Call is a fountain of lanterns and ribbons; Center Stage turns eight lanterns round the stage | a scalloped gold ring |
| Nephra (v3) | linen ribbons and dust chaff drift in, lapis flecks and gold glints (data only: no override functions) | a gold-and-lapis dial |
| Sabir (v3) | embers, flame tongues, crimson cloth scraps and coin glints rise | three-tongued flame notches |
| Pell (v3) | embers and flame tongues drift up, reed flecks and river-cream glints (data only) | rings of lenses |
| Genzo (v3) | bronze chimes and cloud-white wisps swirl outward, vermilion scraps | a ring of rivets |
| Brynja (v3) | ice shards and snow flurries, pale blue sparks and streaks | wave lines |
| Tamsin (v3) | pebbles and grit tumble, dust motes and rope scraps drift inward | a ring of rivets |
| Zahra (v3) | gold glints and falling sand, lapis flecks, light rays | a gold dial |
| Hollis (v3) | lantern sparks and fog wisps, black crape scraps orbit | wave lines |
| Ogden (v3) | grave-water drops, bubbles, bone shards and mould specks pulled inward | double wave line |
| Ottoline (v3) | black and rose ribbons, violet sparks and thread streaks orbit | cords looped round a ring |

## How it is wired

- **The server says which piece.** A set piece's events carry the piece as their last field: `area`, `proj`, `chain`, `beam`, `ast`, and `fxa [pid, 'heal'|'shield', piece]` (a heal or a shield reached a player) and `cdr [pid, slot, seconds]` (a cooldown refund: the client shortens the bar; it has no look of its own). The piece is a skill id (`tansy_2_any`) or the id of the passive or bonus row that fired (`tansy_b5`); `ssSrc` in `server/skillsets.js`. A boss skill's events carry nothing extra. A swing needs none (the client knows the skill row: `s.set`).
- **The client hooks** (each a line marked `// skillsets`): `fxVisuals`, `onArea`, `onAreaEnd`, `updateZoneFx`, `onChain`, `onBeam`, `updateSkillFx` in `combat/skill-fx.js`; `onProj`, `onProjEnd` and the projectile loop in `combat/attacks.js`; the `fxa` / `ast` / `proj` / `area` / `chain` / `beam` cases in `net/client.js`; `ssOnAlly` in `economy/skillsets.js`. The sounds stay the generic ones.
- **A look** is `ssDefineLook(id, spec)` in `game/skillsets/look-<id>.js`, in the manifest after `looks.js`. The spec is data (`mote`: the particle shapes with colour, size, weight, gravity; `cols`; `decal`; `zone.mode`; `proj`) plus optional functions that replace one part (`cone`, `ring`, `dash`, `muzzle`, `util`, `impact`, `fxa`, `ally`, `zoneStart`, `zoneTick`, `zoneEnd`); the header of `looks.js` lists them. A bad look (an unknown shape) is left out and warned about (`SSL.bad`), and the set falls back to the generic drawing.
- **Particles** share their geometries and materials and fade by shrinking, never by opacity; at most `SSL_MAX` (380, 150 on phones) are alive and the counts halve on phones. The ground pattern is a canvas texture drawn once per set (`SSL_DECALS`). Dark colours need normal blending (ink would vanish when added), glow needs additive: each mote says which (`add`).
- **Colours** come from the outfit docs (`docs/skillkits/looks/<id>.md`) and the set's `pal`; `hot` / `hot2` are the bright versions used for additive rings and arcs.

## Visuals that follow the text (recipes, props, waves, swings)

A skill's drawing has to show what its description says: "spawn a wave" shows a travelling wave, "spawn a doll" a doll, "swing 4 times" four swings. The engine is `combat/skill-vis.js` (waves, extra swings, the recipe runner), `combat/skill-props.js` (the prop models) and, for the generic skills, `combat/skill-vis-gen.js`.

- **A recipe** is the `vis` key of a look (`look-<id>.js`): `vis:{'1':{...}, '2':{...}, '3':{...}, ult:{...}, '<exact skill id>':{...}}`. Each value has up to four phases, `cast` (the swing), `zone` (the field starts), `end` (the field ends) and `hit` (a projectile lands), each a list of steps. A step is one verb with options and an optional `at` (seconds to wait): `swing` (n arcs one after another), `wave` (a travelling crest: `shape` ring or arc, `r`, `style`, `inward`), `prop` (a model, see below), `burst`, `ring`, `shaft`, `rays`, `slabs`, `decal`, `shake`, `dust`, `rise`, `flash`. A recipe with an unknown verb or prop kind is dropped at `ssDefineLook` and listed in `SKV.bad` (client-smoke fails on it). `where` ('self', 'front', 'target') and `r` / `rk` (a share of the zone's radius) place a step.
- **Props** (`SKP_BUILD`, 23 kinds: doll, bell, anvil, sandglass, keg, lantern, shield, terrace, sarcophagus, lens, spear, hand, sheaf, geyser, banner, spotlight, sun, moon, mirror, icewall, fissure, gate, cloud) are low-poly groups built from three colours (`cols`, indices into the look's palette or raw colours). They `rise`, `drop`, `plant`, `hover`, `waltz` or `collapse` for `life` seconds. A new kind is one entry in `SKP_BUILD`; the smoke test builds, places and removes every kind.
- **Swings.** A cone with `hits` of 2 or more (`skvPlan`) makes the body swing that many times: `skvActInit` lengthens the act (`act.sw = {n, gap, start}`), `poseRig` (`character/pose.js`, `case 'slash'`) repeats wind-up and strike, `skvSwings` draws one arc per swing, and the damage numbers of your own hits are held back to the swing they belong to (`skvDmgDelay`, `onMonDmg`). The first hit still lands at the server's moment.
- **Waves.** Any ring or cone with a knockback or a pull grows a crest that travels out (or in) instead of only a flat ring (`skvWave`); a recipe can add more.
- **Generic skills** (the shop's and the bosses'; no look): `skvRunRecipe` runs `SKG_BY_ID` (a few recipes by skill id: Demon Gate's gate, Thunderhead's cloud, Nightfall's moon, Glass Storm's mirrors, Avalanche's rocks...), `skgZone` gives a zone with a pull (kb < 0) inward waves, a shove outward waves and every tick a pulse, a beam with `hits` flares once per hit, and Arrow Rain / Hail of Arrows / Blizzard fall in 5 / 8 / 10 waves (`SKG_WAVES`).
- **Class flair** (`combat/skill-flair.js`, `skfCast`): the warrior's casts throw steel sparks and dust and a heavy blow cracks the ground; the archer's leave wind streaks and drifting feathers; the mage's spiral up as motes in the skill's element colour.
- **Body movement** (`combat/skill-move.js`, `skmMove`, called from `updatePlayer`): a blow steps forward (a flurry once per swing, never into a monster already close), a shot recoils, a stomp or a spin hops. Real movement, so walls, slopes and monsters still stop it; the numbers are in `SKM_TUNE`.
- **Stacks** (`skillsets/marks.js`): each kit's mark has its own shape (`SSV_SHAPE`: Rime a shard, Toll a bell, Loot a coin, Twine a knot...), a new stack flies in from the body, a full stack ("up to N" in the kit's text) pulses and wears a halo, a spent stack bursts into its shapes, and the target frame lists your stacks as dots (`#tStacks`).
- **Procs** (`skillsets/procs.js`): the server sends `proc [pid, rowId, monId]` when a triggered bonus or passive with a chance, a cooldown or a streak fires; your own show a badge with its name over the action bar, everybody's show a ring at the wearer and a streak of motes to the target (a look may draw its own with `L.proc`). A cooldown refund (`cdr`) flashes the slot's tile.

## Known gaps

- Never seen in a real browser (above): sizes, counts, brightness against the forest, the look of a pattern at an angle.
- Ally buffs show as one ring and a few motes on the buffed player; a shield has no bar; the party frame shows nothing.
- No sounds of their own (Dunstan's drum, Torgeir's shield, Sazanka's slip would each want one).
- Marigold's Curtain Call dresses the hiker in a halo of six lanterns and ribbon wings while its buff lasts (`sslWear` in `looks.js`, the look's `ally` hook): an overlay on the character, not an outfit swap, so it works with any outfit. A real look swap with its own meshes is M5.
- Monsters' side: a taunted or exposed monster shows nothing yet beyond the damage numbers (the vuln / weak notes of `docs/REACTIONS.md` pop as before).

## Test

`node tools/client-smoke.js` (draws all 42 pieces and the passive and bonus rows through the real client, then checks that everything is gone; runs every recipe of every set and generic skill, builds every prop, checks the stack shapes, the proc badge, the class flair and the body movement); `node tools/skillsets-first8-smoke.js` (the server side, including that the events name their piece).
