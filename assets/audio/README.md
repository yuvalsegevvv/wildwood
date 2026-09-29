# Sound files

Put `.wav`, `.mp3`, `.ogg` or `.m4a` files here and run `python3 build.py`. A file's name without the extension is its key.
Where a file ends up depends on its name:

| Name | Where it goes | When the client gets it |
|---|---|---|
| `music-*` (background music, several MB) | copied to `dist/audio/<name>.<hash>.m4a`; the page only lists the URL (`window.WILDWOOD_AUDIO_URL`) | fetched when its theme first plays, once per client |
| anything else (short sounds) | embedded in the page as base64 (`window.WILDWOOD_AUDIO`) | with the page, decoded when audio starts |

    assets/audio/sword-hit.ogg  ->  playSample('sword-hit', {bus:'ui', vol:0.8})

`playSample` returns `false` when the file is missing, so code can fall back to the synthesised
sound: `if(!playSample('sword-hit')) cSfx.hit(m)`.

Buses (volume sliders): `music`, `ui` (interface and game sounds), `ambient` (nature), `voice`.
Why music is not in the page: the claude.ai artifact caps a page at 16 MB (the build refuses over 15 MB), and every visitor
of the Node server would download all of it on every visit. Embedded sounds count against that cap, so keep them short, mono,
compressed (.ogg/.mp3). Long sounds that are not music (ambience loops, voice lines) need the same treatment as music: make
`audio_block` in build.py put their name prefix in `dist/audio/` and load them through `audioBytes` (`src/game/audio/samples.js`).

How the files are delivered and downloaded only once:
- The name carries a hash of the content, so a re-encoded track gets a new URL and an unchanged one never changes.
- Node server (Render): serves `/audio/<name>` from `dist/audio/` with `cache-control: public, max-age=31536000, immutable`.
- claude.ai artifact: publish each `dist/audio/` file next to the page with the same relative path (`files` of the Artifact tool).
- The client keeps each file's bytes in memory and in Cache Storage (`wildwood-music-v1`, old hashes are deleted), on top of the browser's HTTP cache.
- If a track can't be fetched (offline, file:// page, missing folder) the theme's generated music plays; a failed track is retried after 30 s.
- `python3 build.py --inline-audio` embeds the music in the page after all (one ~14 MB file for offline / file:// use).

## Background music

`music-<theme>.m4a` replaces that theme's generated music (themes: `THEMES` in `src/game/audio/music.js`:
village, wild1-3, boss15, hanami, vale1-2, boss20, boss25, rimehold, hoar1-2, boss26, boss30). Several themes can share one file through
`MUSIC_FILE_OF` (`music-wild` plays for wild1-3, `music-vale` for vale1-2, `music-hoar` for hoar1-2); `MUSIC_LOOP_FROM` makes later passes restart mid-track
(a boss track plays its build-up once, then loops its loud part: boss15 from 65.8 s, boss20 from 63.5 s, boss25 from 48.85 s, boss26 from 44.5 s, boss30 from 79.0 s;
chosen by comparing the spectrum and the beat pattern of the last 5-8 s with every candidate start). It loops with a 5 s crossfade from its end back to its start,
so cut off a long fade-out; at night the village track is lowpassed (darker). Music files are downloaded when their theme first plays and decoded only while
it plays. Encode tracks as AAC 64 kbps (~1.3 MB for 2.5 min; each track is a separate download, so its size is what a new player pays):

    ffmpeg -i in.m4a -t 158 -c:a aac -b:a 64k -movflags +faststart music-village.m4a

(no ffmpeg installed? `npm i ffmpeg-static` in a temp folder gives one.)
The seven tracks for the home forest and the Sakura Vale were made with Suno (free plan: non-commercial use only); the four for the Hoarfrost Reach
(`music-rimehold`, `music-hoar`, `music-boss26`, `music-boss30`) with Google's Flow Music (free plan; its terms for commercial use are unclear and the output carries a SynthID watermark).
Before Wildwood earns money, check the licence of every track or replace them.

## The Hoarfrost songs (made, cut and looped)

| File | Song | Plays where | Cut and loop |
|---|---|---|---|
| `music-rimehold.m4a` | Nordic Hearth | Rimehold (theme `rimehold`) | cut at 151 s (the song's own fade-out starts there); it fades in softly, so the loop is seamless |
| `music-hoar.m4a` | Frozen Tundra Drift | the whole plateau: `hoar1` (levels 22-26) and `hoar2` (27-30) share it | cut at 132 s: the song ends there and the last 47 s are a near-silent tail that would sound like the music died |
| `music-boss26.m4a` | Wrath of the Jotunn | Ymrik (level 26) | cut at 176 s, `MUSIC_LOOP_FROM` 44.5 s (loops 131 s of the loud part) |
| `music-boss30.m4a` | Awakening of the Ice Dragon | Vetrmaw (level 30) | cut at 168 s, `MUSIC_LOOP_FROM` 79.0 s (loops 89 s) |

Loop points are chosen by comparing the last 5 s (spectrum) and 8 s (onset pattern) with every candidate start and keeping the best match; the sources are 48 kHz 128 kbps
MP3s of about 3 minutes, re-encoded as AAC 64 kbps (1.1-1.4 MB each).

Old briefs (kept for regenerating a song):

| File | Plays where | Feel and instruments | Prompt to start from |
|---|---|---|---|
| `music-rimehold.m4a` | Rimehold, the Hoarfrost village (theme `rimehold`, `musicThemeHere`) | The warm hall in the long night: slow, about 75 BPM, A minor / Aeolian. A plucked lyre or kantele over a low drone, a distant flute, one soft frame drum. Sparse, safe, a little sad. | `instrumental, nordic folk, slow, kantele and lyre, low drone, distant wooden flute, soft frame drum, warm firelit hall, snow outside, gentle, melancholic, no vocals` |
| `music-hoar.m4a` | Every part of the Reach outside the village: levels 22-26 (theme `hoar1`) and 27-30 (`hoar2`) share it | Cold and wide: about 80 BPM, A minor drifting to E phrygian. Bells over a slow pad, a flute in the wind, a low drone that grows heavier in the second half, sparse hand drum. It must loop without a clear beginning (it plays for the whole plateau). | `instrumental, ambient nordic, frozen tundra, glacier, sparse bells, wind, breathy flute, low drone, slow evolving pad, cold, vast, tension slowly rising, no vocals` |
| `music-boss26.m4a` | Ymrik, the Rimeking (level 26, the ice hall; theme `boss26`) | A frost giant's march: about 140 BPM, D minor. A quiet build-up of about 60 s (drone, single frame drum, distant horn), then a heavy loop: low brass or horn stabs on the beat, marching bass, frame drums and snare, icy bells on top. | `instrumental, epic nordic battle, frost giant boss, war horns, low brass stabs, marching frame drums, heavy bass, icy bells, dark, driving, build-up then full battle, no vocals` |
| `music-boss30.m4a` | Vetrmaw, the frost wyrm (level 30, the wyrm's nest; theme `boss30`) | The fiercest of the Reach: about 160 BPM, A minor. A build-up of about 60 s (wind, cracking ice, a slow drum), then taiko and kick, a roaring saw bass, fast bell arpeggios and a sweeping choir-like pad. It should sound bigger than boss26. | `instrumental, epic boss battle, ice dragon wyrm, thundering taiko, roaring bass, fast crystalline bell arpeggios, sweeping pads, cold and huge, build-up then relentless, no vocals` |

`music-rimehold` could also get the village's darker night version (the lowpass in `musicFileTick` only applies to the theme `village` today: extend the test to
`rimehold` and `hanami` if the night mix is wanted there). Publish the new files with the artifact like the others (`files` of the Artifact tool,
`audio/<name>.<hash>.m4a`, see the top of this file).
