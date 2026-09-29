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
(a boss track plays its build-up once, then loops its loud part: boss15 from 65.8 s, boss20 from 63.5 s, boss25 from 48.85 s;
chosen by comparing the spectrum of the last 5 s with every candidate start). It loops with a 5 s crossfade from its end back to its start,
so cut off a long fade-out; at night the village track is lowpassed (darker). Music files are downloaded when their theme first plays and decoded only while
it plays. Encode tracks as AAC 64 kbps (~1.3 MB for 2.5 min; each track is a separate download, so its size is what a new player pays):

    ffmpeg -i in.m4a -t 158 -c:a aac -b:a 64k -movflags +faststart music-village.m4a

(no ffmpeg installed? `npm i ffmpeg-static` in a temp folder gives one.)
Current tracks were made with Suno (free plan: non-commercial use only).

## Songs still to make (the Hoarfrost Reach): 4 files

The Hoarfrost Reach is built but has **no recorded music yet**: its themes (`rimehold`, `hoar1`, `hoar2`, `boss26`, `boss30` in `THEMES`) play the
generated fallback until these four files exist. Drop them here under exactly these names and run `python3 build.py`; nothing else needs to change
(the two ranges already share `music-hoar` through `MUSIC_FILE_OF`). Same recipe as the others: instrumental, AAC 64 kbps, about 2.5 minutes, the end cut
before any fade-out (the 5 s crossfade loops it). Style hints are for Suno (free plan: non-commercial use only) or any other tool; keep the family sound of
the existing tracks (a soft pad, a plucked instrument, a breathy flute, few drums).

| File | Plays where | Feel and instruments | Suno prompt to start from |
|---|---|---|---|
| `music-rimehold.m4a` | Rimehold, the Hoarfrost village (theme `rimehold`, `musicThemeHere`) | The warm hall in the long night: slow, about 75 BPM, A minor / Aeolian. A plucked lyre or kantele over a low drone, a distant flute, one soft frame drum. Sparse, safe, a little sad. | `instrumental, nordic folk, slow, kantele and lyre, low drone, distant wooden flute, soft frame drum, warm firelit hall, snow outside, gentle, melancholic, no vocals` |
| `music-hoar.m4a` | Every part of the Reach outside the village: levels 22-26 (theme `hoar1`) and 27-30 (`hoar2`) share it | Cold and wide: about 80 BPM, A minor drifting to E phrygian. Bells over a slow pad, a flute in the wind, a low drone that grows heavier in the second half, sparse hand drum. It must loop without a clear beginning (it plays for the whole plateau). | `instrumental, ambient nordic, frozen tundra, glacier, sparse bells, wind, breathy flute, low drone, slow evolving pad, cold, vast, tension slowly rising, no vocals` |
| `music-boss26.m4a` | Ymrik, the Rimeking (level 26, the ice hall; theme `boss26`) | A frost giant's march: about 140 BPM, D minor. A quiet build-up of about 60 s (drone, single frame drum, distant horn), then a heavy loop: low brass or horn stabs on the beat, marching bass, frame drums and snare, icy bells on top. | `instrumental, epic nordic battle, frost giant boss, war horns, low brass stabs, marching frame drums, heavy bass, icy bells, dark, driving, build-up then full battle, no vocals` |
| `music-boss30.m4a` | Vetrmaw, the frost wyrm (level 30, the wyrm's nest; theme `boss30`) | The fiercest of the Reach: about 160 BPM, A minor. A build-up of about 60 s (wind, cracking ice, a slow drum), then taiko and kick, a roaring saw bass, fast bell arpeggios and a sweeping choir-like pad. It should sound bigger than boss26. | `instrumental, epic boss battle, ice dragon wyrm, thundering taiko, roaring bass, fast crystalline bell arpeggios, sweeping pads, cold and huge, build-up then relentless, no vocals` |

After the boss songs exist, find each one's loop point (where the loud part starts, chosen like the others by comparing the spectrum of the last 5 s with every
candidate start) and add it to `MUSIC_LOOP_FROM` in `src/game/audio/music.js` as `boss26:<seconds>` and `boss30:<seconds>`; without an entry a boss song
loops from its very start. `music-rimehold` could also get the village's darker night version (the lowpass in `musicFileTick` only applies to the theme `village`
today: extend the test to `rimehold` and `hanami` if the night mix is wanted there). Publish the new files with the artifact like the others (`files` of the Artifact
tool, `audio/<name>.<hash>.m4a`, see the top of this file).
