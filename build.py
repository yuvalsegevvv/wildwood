#!/usr/bin/env python3
"""Build Wildwood into one self-contained page: dist/wildwood.html

    python3 build.py            build
    python3 build.py --check    build, then syntax-check every script with node (if installed), look for duplicate top-level names and check the
                                layout rules: a header on every file, every source file in the manifest, docs/FILES.md up to date
    python3 build.py --inline-audio   also embed the music in the page (one ~14 MB file that works offline / from file://)
    python3 build.py --index    print what each source file contains (from its //@ header)
    python3 build.py --write-index   rewrite docs/FILES.md from those headers (run it after adding, renaming or re-describing a file)

Why (nearly) one file: the published page may not download anything from other sites, so the 3D engine,
every script and every stylesheet are inlined into the page. The background music is the exception: it is
9 MB, and the page has a size cap (16 MB) and is downloaded by every visitor, so music files are NOT in the
page. They are copied to dist/audio/ under a content-hashed name (music-village.3fa9c1d2.m4a) and the page only
carries the name -> URL map (window.WILDWOOD_AUDIO_URL). The client fetches a track when its theme first plays and
keeps it (immutable HTTP caching on the Node server, Cache Storage as a second layer), so each client downloads
each track once. Publish dist/audio/* next to the page (Node server: served from /audio/, artifact: `files`).

How the sources fit together:
  src/index.html        page shell with {{STYLES}} {{EARLY}} {{AUDIO}} {{GAME}} {{THREE}} {{START}} slots
  src/manifest.json     load order of the styles and game files (order matters, see README.md)
  src/styles/*.css      concatenated in manifest order
  src/game/**/*.js      concatenated in manifest order into ONE function, wildwoodMain(), so they
                        share one scope: a const in one file is visible to every later file
  src/boot/early.js     runs first: error screen, WebGL check
  src/boot/start.js     runs last: starts wildwoodMain()
  src/vendor/           three.js r128 (MIT)
  assets/audio/music-*  background music: copied to dist/audio/ (hashed names), fetched lazily by the client
  assets/audio/*        every other .wav .mp3 .ogg .m4a file: small sounds, embedded as base64; playSample('file-name')
  assets/img/*          .webp .png .jpg pictures, embedded as data URIs in window.WILDWOOD_IMG['file-name'] (the world map's art: tools/world-map-bake.js)

The first line of every source file may be a header: //@ ... in JS, /*@ ... */ in CSS.
Headers document the file and are left out of the built page.
"""
import re, base64, hashlib, json, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
AUDIO = os.path.join(ROOT, 'assets', 'audio')
OUT = os.path.join(ROOT, 'dist', 'wildwood.html')
SERVER_OUT = os.path.join(ROOT, 'dist', 'wildwood-server.js')
AUDIO_TYPES = ('.wav', '.mp3', '.ogg', '.m4a')
MAX_BYTES = 15 * 1024 * 1024  # the host allows 16 MB per page (a page with embedded music must stay under this)
MAX_FILE_BYTES = 15 * 1024 * 1024  # ... and 15 MB per published binary file
AUDIO_OUT = os.path.join(ROOT, 'dist', 'audio')
IMG = os.path.join(ROOT, 'assets', 'img')
IMG_TYPES = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg'}


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def strip_header(text):
    first, _, rest = text.partition('\n')
    return rest if first.startswith('//@') or first.startswith('/*@') else text



def top_level_names(text):
    """Names declared at the top level of a bundle: function x, class x, and every name in
    const/let/var x=..., y=... (commas inside brackets or strings are ignored)."""
    names = []
    for line in text.split('\n'):
        m = re.match(r'(?:async\s+)?(?:function\*?|class)\s+([A-Za-z_$][\w$]*)', line)
        if m:
            names.append(m.group(1)); continue
        m = re.match(r'(?:const|let|var)\s+(.*)', line)
        if not m:
            continue
        body, depth, q, cur, out = m.group(1), 0, None, '', []
        for ch in body:
            if q:
                if ch == q: q = None
            elif ch in '\'"`': q = ch
            elif ch in '([{': depth += 1
            elif ch in ')]}': depth -= 1
            elif ch == ',' and depth == 0:
                out.append(cur); cur = ''; continue
            elif ch == ';' and depth == 0:
                break
            cur += ch
        out.append(cur)
        for part in out:
            n = re.match(r'\s*([A-Za-z_$][\w$]*)\s*=', part)
            if n: names.append(n.group(1))
    return names


def check_duplicates(label, files):
    """Files in one bundle share one scope: a second 'function x' silently replaces the first,
    and a second 'const x' is a syntax error at load. Report both before they bite."""
    seen, dup = {}, []
    for path in files:
        for n in top_level_names(read(path)):
            if n in seen and seen[n] != path:
                dup.append('%s: %s (in %s and %s)' % (label, n, os.path.relpath(seen[n], SRC), os.path.relpath(path, SRC)))
            seen.setdefault(n, path)
    return dup


def header(text):
    first = text.split('\n', 1)[0]
    return first[3:].rstrip(' */').strip() if first[:3] in ('//@', '/*@') else ''


def audio_block(inline):
    """Small sounds are embedded as base64 (window.WILDWOOD_AUDIO); music-* files are copied to dist/audio/
    with a content hash in the name (window.WILDWOOD_AUDIO_URL maps each key to that relative URL), so a
    changed track gets a new URL and an unchanged one can be cached forever. inline=True embeds everything."""
    if os.path.isdir(AUDIO_OUT):   # drop files of earlier builds (old hashes); the folder stays, OneDrive may hold it open
        for old in os.listdir(AUDIO_OUT):
            os.unlink(os.path.join(AUDIO_OUT, old))
    files = sorted(f for f in os.listdir(AUDIO) if f.lower().endswith(AUDIO_TYPES)) if os.path.isdir(AUDIO) else []
    embedded, urls, music_bytes = {}, {}, 0
    for f in files:
        key, ext = os.path.splitext(f)
        with open(os.path.join(AUDIO, f), 'rb') as fh:
            raw = fh.read()
        if inline or not key.startswith('music-'):
            embedded[key] = base64.b64encode(raw).decode('ascii')
            continue
        if len(raw) > MAX_FILE_BYTES:
            sys.exit('%s is over 15 MB; encode it smaller' % f)
        name = '%s.%s%s' % (key, hashlib.sha256(raw).hexdigest()[:8], ext.lower())
        os.makedirs(AUDIO_OUT, exist_ok=True)
        with open(os.path.join(AUDIO_OUT, name), 'wb') as dst:
            dst.write(raw)
        urls[key] = 'audio/' + name
        music_bytes += len(raw)
    code = ''
    if embedded:
        code += 'window.WILDWOOD_AUDIO=' + json.dumps(embedded, separators=(',', ':')) + ';\n'
    if urls:
        code += 'window.WILDWOOD_AUDIO_URL=' + json.dumps(urls, separators=(',', ':')) + ';\n'
        print('music: %d files, %.1f MB in %s (fetched by the client, not in the page)' % (len(urls), music_bytes / 1048576, os.path.relpath(AUDIO_OUT, ROOT)))
    return '<script>\n' + code + '</script>\n' if code else ''


def image_block():
    """assets/img/*: pictures embedded in the page as data URIs, window.WILDWOOD_IMG['file-name'] (keep them small: the page is capped at 16 MB)."""
    files = sorted(f for f in os.listdir(IMG) if os.path.splitext(f)[1].lower() in IMG_TYPES) if os.path.isdir(IMG) else []
    imgs = {}
    for f in files:
        key, ext = os.path.splitext(f)
        with open(os.path.join(IMG, f), 'rb') as fh:
            imgs[key] = 'data:%s;base64,%s' % (IMG_TYPES[ext.lower()], base64.b64encode(fh.read()).decode('ascii'))
    return '<script>\nwindow.WILDWOOD_IMG=' + json.dumps(imgs, separators=(',', ':')) + ';\n</script>\n' if imgs else ''


def build(inline_audio=False):
    manifest = json.loads(read(os.path.join(SRC, 'manifest.json')))
    styles = ''.join(strip_header(read(os.path.join(SRC, 'styles', f))) for f in manifest['styles'])
    shared = ''.join(strip_header(read(os.path.join(SRC, 'shared', f))) for f in manifest['shared'])
    server = shared + ''.join(strip_header(read(os.path.join(SRC, 'server', f))) for f in manifest['server'])
    game = ''.join(shared if f == '@shared' else strip_header(read(os.path.join(SRC, 'game', f))) for f in manifest['game'])
    slots = {
        '{{STYLES}}': styles,
        '{{EARLY}}': read(os.path.join(SRC, 'boot', 'early.js')),
        '{{AUDIO}}': audio_block(inline_audio) + image_block(),
        '{{SERVER}}': server,
        '{{GAME}}': game,
        '{{THREE}}': read(os.path.join(SRC, 'vendor', 'three.r128.min.js')),
        '{{START}}': read(os.path.join(SRC, 'boot', 'start.js')),
    }
    page = read(os.path.join(SRC, 'index.html'))
    for k, v in slots.items():
        if k not in page:
            sys.exit('index.html is missing the ' + k + ' slot')
        page = page.replace(k, v, 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(page)
    node = ''.join(strip_header(read(os.path.join(SRC, 'node', f))) for f in manifest['node'])
    with open(SERVER_OUT, 'w', encoding='utf-8') as f:
        f.write('#!/usr/bin/env node\n/* Wildwood world server. Run: node wildwood-server.js [--port 8080] [--no-dev] */\n\'use strict\';\n'
                'const PAGE=' + json.dumps(page) + ';\n'
                'function createWorldServer(io){\n' + server + '}\n' + node)
    print('built %s (%.0f KB)' % (os.path.relpath(SERVER_OUT, ROOT), os.path.getsize(SERVER_OUT) / 1024))
    size = os.path.getsize(OUT)
    print('built %s (%.0f KB, %d game files, %d stylesheets)' % (os.path.relpath(OUT, ROOT), size / 1024, len(manifest['game']), len(manifest['styles'])))
    if size > MAX_BYTES:
        sys.exit('page is over 15 MB; move sounds out of the page (music-* files are not embedded) or compress them')
    return page


def check(page):
    if not shutil.which('node'):
        print('node not found, skipping the syntax check')
        return
    blocks = [b.split('</script>', 1)[0] for b in page.split('<script>')[1:]]
    for i, b in enumerate(blocks):
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
            t.write(b)
        r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
        os.unlink(t.name)
        if r.returncode:
            sys.exit('script block %d has a syntax error:\n%s' % (i, r.stderr))
    manifest = json.loads(read(os.path.join(SRC, 'manifest.json')))
    shared_f = [os.path.join(SRC, 'shared', f) for f in manifest['shared']]
    client_f = [os.path.join(SRC, 'game', f) for f in manifest['game'] if f != '@shared']
    server_f = [os.path.join(SRC, 'server', f) for f in manifest['server']]
    dups = check_duplicates('client', shared_f + client_f) + check_duplicates('server', shared_f + server_f)
    if dups:
        sys.exit('duplicate top-level names (files in a bundle share one scope):\n  ' + '\n  '.join(dups))
    r = subprocess.run(['node', '--check', SERVER_OUT], capture_output=True, text=True)
    if r.returncode:
        sys.exit('wildwood-server.js has a syntax error:\n' + r.stderr)
    print('syntax ok (%d script blocks + server)' % len(blocks))
    problems = lint_layout()
    if problems:
        sys.exit('layout rules broken (CLAUDE.md section 5):\n  ' + '\n  '.join(problems))
    print('layout ok (headers, manifest, docs/FILES.md)')


FILES_MD = os.path.join(ROOT, 'docs', 'FILES.md')
FILES_HEAD = ('# File map\n\n'
              'Generated by `python3 build.py --write-index` from the first line (the `//@` header) of every source file. '
              '`python3 build.py --check` fails when this file is out of date:\n'
              'run `--write-index` after adding, renaming or re-describing a file. Do not edit it by hand.\n\n```\n')
GROUP_EXT = {'styles': '.css', 'shared': '.js', 'server': '.js', 'node': '.js', 'game': '.js'}   # what each manifest group holds


def index_text():
    manifest = json.loads(read(os.path.join(SRC, 'manifest.json')))
    lines = []
    for group in GROUP_EXT:
        lines.append('\n' + group)
        for f in manifest[group]:
            if f == '@shared':
                lines.append('  %-34s %s' % ('@shared', '(the shared files above are inserted here)'))
                continue
            lines.append('  %-34s %s' % (f, header(read(os.path.join(SRC, group, f)))))
    return '\n'.join(lines) + '\n'


def files_md():
    return FILES_HEAD + index_text() + '```\n'


def lint_layout():
    """Rules that keep the tree navigable for agents (CLAUDE.md section 5, "Agent-first layout rules"). Each message says how to fix it.
       1. every file in the manifest starts with a header line (//@ in JS, /*@ in CSS): it is what docs/FILES.md shows
       2. every source file under src/<group>/ is in the manifest, and no file is listed twice (an unlisted file is never built)
       3. docs/FILES.md is what `--write-index` would write now"""
    manifest = json.loads(read(os.path.join(SRC, 'manifest.json')))
    problems = []
    for group, ext in GROUP_EXT.items():
        listed = [f for f in manifest[group] if f != '@shared']
        for f in sorted(set(listed)):
            if listed.count(f) > 1:
                problems.append('%s/%s is listed twice in src/manifest.json' % (group, f))
            if not header(read(os.path.join(SRC, group, f))):
                problems.append('%s/%s has no header: its first line must be //@ one-line description (/*@ ... */ in CSS)' % (group, f))
        on_disk = set()
        for folder, _, names in os.walk(os.path.join(SRC, group)):
            for n in names:
                if n.endswith(ext):
                    on_disk.add(os.path.relpath(os.path.join(folder, n), os.path.join(SRC, group)).replace(os.sep, '/'))
        for f in sorted(on_disk - set(listed)):
            problems.append('src/%s/%s is not in src/manifest.json: add it in the right place (an unlisted file is never built)' % (group, f))
    norm = lambda t: [l.rstrip() for l in t.rstrip('\n').split('\n')]
    on_file = read(FILES_MD) if os.path.isfile(FILES_MD) else ''
    if norm(on_file) != norm(files_md()):
        problems.append('docs/FILES.md is out of date: run  python3 build.py --write-index')
    return problems


def index():
    sys.stdout.write(index_text())


if __name__ == '__main__':
    if '--index' in sys.argv:
        index()
    elif '--write-index' in sys.argv:
        with open(FILES_MD, 'w', encoding='utf-8', newline='\n') as f:
            f.write(files_md())
        print('wrote ' + os.path.relpath(FILES_MD, ROOT))
    else:
        page = build('--inline-audio' in sys.argv)
        if '--check' in sys.argv:
            check(page)
