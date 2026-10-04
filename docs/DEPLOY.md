# Deploy, database, publishing

Moved word for word from `CLAUDE.md` sections 6 and 7; `CLAUDE.md` keeps a short summary.

## Render

`render.yaml`: build `npm install --omit=dev ... && python3 build.py`, start
`node dist/wildwood-server.js --no-dev` (testing tools off for players), health check `/healthz`.
Live at https://wildwood-wib9.onrender.com (service `wildwood`, free plan: sleeps after 15 min idle, ~30-50 s
to wake). `dist/` is not committed. `GET /status` shows players, monsters, storage kind (`"saves":"postgres"`
when the database is connected) and the number of saved accounts.
Traffic: the page is ~350 KB gzipped with an `ETag` (`no-cache` + 304 when unchanged); music is served from `/audio/<name>.<hash>.m4a`
(`dist/audio/`, whitelist of names read at start, `cache-control: public, max-age=31536000, immutable`), so a returning
player downloads nothing but a 304, and a new player downloads only the tracks of the places they visit (~1-1.7 MB each).
`wildwood-server.js` must stay next to its `audio/` folder (or set `AUDIO_DIR`); without it the game plays generated music.
Game traffic, per client (measured on the server's own snapshots, `broadcastSnap`): about 8 KB/s alone, 11-12 KB/s with 10-40 players
spread over the woods (before per-player snapshots: 63-79 KB/s, and the total out of the server grew with the square of the players).
The free plan allows 100 GB a month outbound: 100 players playing 3 hours a day would use about 35 GB.

## Database

**Database (exists, in use).** A free **Neon** Postgres (neon.tech, project `wildwood`, branch `production`,
database `neondb`, free tier: 0.5 GB, no expiry, compute sleeps after 5 min idle and wakes in ~1 s). Render's
env var `DATABASE_URL` holds its connection string (the secret lives only in Render and Neon, never in the
repo or chat). One table, created automatically by `pgStore` in `node/main.js`:
`wildwood_players(id text PRIMARY KEY, data jsonb, updated_at timestamptz)`.
- `id` = sha256 of `'wildwood:'+key` (first 40 hex): key is the guest's browser account code, or
  `'user:'+lowercase name` for a registered account (so a name maps to one row: that is the uniqueness).
- `data` = `{v,name,look,level,exp,gear,updated}`, plus `auth:{user, pass:'salt:scrypt-hash', tokens:[sha256 of
  session tokens, last 5]}` for registered accounts, or `{movedTo:name}` for a guest code that registered.
- Neon's SQL Editor can inspect or fix rows (e.g. a forgotten password: there is no email, so no reset;
  the owner would clear `data->'auth'` tokens or set a new hash by hand).
- The pool is built for a sleeping free database: `'error'` listener (a dropped idle connection must not
  crash the server), 60 s idle close, 15 s connect timeout, table creation retried on the next query.
- Without `DATABASE_URL`, saves go to JSON files in `DATA_DIR` (default `./data`), which Render wipes on
  every deploy/restart. Don't use Render's own free Postgres: it is deleted after 30 days.

## Publishing the claude.ai playtest artifact

Publishing the claude.ai playtest artifact (in claude.ai sessions only): copy `dist/wildwood.html` (about 1.2 MB) to the
outputs folder and publish it to the same link, https://claude.ai/artifact/VCvNoypJ63mXoU3bgztYtY
(label "Wildwood forest", title "Wildwood — forest simulator", favicon 🌲), with capabilities
`{room:{topics:{c:"interact",s:"interact"}}}` (needed for Shared mode). Publish the music as supporting files of the
same artifact: `files` maps `audio/<name>.<hash>.m4a` to each `dist/audio/` file (contentType `audio/mp4`); the page
fetches them by that relative path (the Artifact contract allows `fetch()` of files published alongside the page). Names
hold a content hash, so unchanged tracks keep their URL (cached in the viewer's browser); when a track was re-encoded, publish
the new file and set the old path to `null`. Not yet checked in the real artifact sandbox: if the music there is the old generated
kind, the fetch failed. Fallback: `python3 build.py --inline-audio` embeds everything again (13.6 MB, under the 15 MB cap,
no room to grow). Every music track is downloaded once per client (in-memory bytes + Cache Storage `wildwood-music-v1`, and on the
Node server immutable HTTP caching), so check `read_network_requests` in the browser pane after a change to `samples.js`.
