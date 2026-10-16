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
| Ogden (v3) | grave-water drops, bubbles, bone shards and mould specks pulled inward | double wave line |
| Ottoline (v3) | black and rose ribbons, violet sparks and thread streaks orbit | cords looped round a ring |

## How it is wired

- **The server says which piece.** A set piece's events carry the piece as their last field: `area`, `proj`, `chain`, `beam`, `ast`, and `fxa [pid, 'heal'|'shield', piece]` (a heal or a shield reached a player) and `cdr [pid, slot, seconds]` (a cooldown refund: the client shortens the bar; it has no look of its own). The piece is a skill id (`tansy_2_any`) or the id of the passive or bonus row that fired (`tansy_b5`); `ssSrc` in `server/skillsets.js`. A boss skill's events carry nothing extra. A swing needs none (the client knows the skill row: `s.set`).
- **The client hooks** (each a line marked `// skillsets`): `fxVisuals`, `onArea`, `onAreaEnd`, `updateZoneFx`, `onChain`, `onBeam`, `updateSkillFx` in `combat/skill-fx.js`; `onProj`, `onProjEnd` and the projectile loop in `combat/attacks.js`; the `fxa` / `ast` / `proj` / `area` / `chain` / `beam` cases in `net/client.js`; `ssOnAlly` in `economy/skillsets.js`. The sounds stay the generic ones.
- **A look** is `ssDefineLook(id, spec)` in `game/skillsets/look-<id>.js`, in the manifest after `looks.js`. The spec is data (`mote`: the particle shapes with colour, size, weight, gravity; `cols`; `decal`; `zone.mode`; `proj`) plus optional functions that replace one part (`cone`, `ring`, `dash`, `muzzle`, `util`, `impact`, `fxa`, `ally`, `zoneStart`, `zoneTick`, `zoneEnd`); the header of `looks.js` lists them. A bad look (an unknown shape) is left out and warned about (`SSL.bad`), and the set falls back to the generic drawing.
- **Particles** share their geometries and materials and fade by shrinking, never by opacity; at most `SSL_MAX` (380, 150 on phones) are alive and the counts halve on phones. The ground pattern is a canvas texture drawn once per set (`SSL_DECALS`). Dark colours need normal blending (ink would vanish when added), glow needs additive: each mote says which (`add`).
- **Colours** come from the outfit docs (`docs/skillkits/looks/<id>.md`) and the set's `pal`; `hot` / `hot2` are the bright versions used for additive rings and arcs.

## Known gaps

- Never seen in a real browser (above): sizes, counts, brightness against the forest, the look of a pattern at an angle.
- Ally buffs show as one ring and a few motes on the buffed player; a shield has no bar; the party frame shows nothing.
- No sounds of their own (Dunstan's drum, Torgeir's shield, Sazanka's slip would each want one).
- Marigold's Curtain Call dresses the hiker in a halo of six lanterns and ribbon wings while its buff lasts (`sslWear` in `looks.js`, the look's `ally` hook): an overlay on the character, not an outfit swap, so it works with any outfit. A real look swap with its own meshes is M5.
- Monsters' side: a taunted or exposed monster shows nothing yet beyond the damage numbers (the vuln / weak notes of `docs/REACTIONS.md` pop as before).

## Test

`node tools/client-smoke.js` (draws all 42 pieces and the passive and bonus rows through the real client, then checks that everything is gone); `node tools/skillsets-first8-smoke.js` (the server side, including that the events name their piece).
