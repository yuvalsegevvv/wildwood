# Sound files

Put `.wav`, `.mp3`, `.ogg` or `.m4a` files here and run `python3 build.py`.
Each file is embedded into the page (the published page can't download files from elsewhere),
and its name without the extension becomes its key:

    assets/audio/sword-hit.ogg  ->  playSample('sword-hit', {bus:'ui', vol:0.8})

`playSample` returns `false` when the file is missing, so code can fall back to the synthesised
sound: `if(!playSample('sword-hit')) cSfx.hit(m)`.

Buses (volume sliders): `music`, `ui` (interface and game sounds), `ambient` (nature), `voice`.
Keep the total small: the whole page must stay under 15 MB, so prefer short, mono, compressed files (.ogg/.mp3).

## Background music

`music-<theme>.m4a` replaces that theme's generated music (themes: `THEMES` in `src/game/audio/music.js`:
village, wild1-3, boss15, hanami, vale1-2, boss20, boss25). Several themes can share one file through
`MUSIC_FILE_OF` (`music-wild` plays for wild1-3, `music-vale` for vale1-2); `MUSIC_LOOP_FROM` makes later passes restart mid-track
(a boss track plays its build-up once, then loops its loud part: boss15 from 65.8 s, boss20 from 63.5 s, boss25 from 48.85 s;
chosen by comparing the spectrum of the last 5 s with every candidate start). It loops with a 5 s crossfade from its end back to its start,
so cut off a long fade-out; at night the village track is lowpassed (darker). Music files are decoded only while
their theme plays. Encode tracks as AAC 64 kbps (~1.3 MB for 2.5 min, so about 7 fit in the page):

    ffmpeg -i in.m4a -t 158 -c:a aac -b:a 64k -movflags +faststart music-village.m4a

(no ffmpeg installed? `npm i ffmpeg-static` in a temp folder gives one.)
Current tracks were made with Suno (free plan: non-commercial use only).
