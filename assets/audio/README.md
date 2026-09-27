# Sound files

Put `.wav`, `.mp3`, `.ogg` or `.m4a` files here and run `python3 build.py`.
Each file is embedded into the page (the published page can't download files from elsewhere),
and its name without the extension becomes its key:

    assets/audio/sword-hit.ogg  ->  playSample('sword-hit', {bus:'ui', vol:0.8})

`playSample` returns `false` when the file is missing, so code can fall back to the synthesised
sound: `if(!playSample('sword-hit')) cSfx.hit(m)`.

Buses (volume sliders): `music`, `ui` (interface and game sounds), `ambient` (nature), `voice`.
Keep the total small: the whole page must stay under 15 MB, so prefer short, mono, compressed files (.ogg/.mp3).
