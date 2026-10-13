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


LEAN_PAGE = ''   # the page the Node host serves (build() fills it): dist/wildwood.html without the in-page world server


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
    template = read(os.path.join(SRC, 'index.html'))

    def render(tpl, sl):
        for k, v in sl.items():
            if k not in tpl:
                sys.exit('index.html is missing the ' + k + ' slot')
            tpl = tpl.replace(k, v, 1)
        return tpl
    page = render(template, slots)
    # The Node host serves the page to players who connect to ITS world (the start card hides Play solo there), so the in-page copy of the world server (~770 KB, ~260 KB gzipped,
    # a fifth of the first load) would only be downloaded and parsed for nothing: the page it embeds has a stub in its place. dist/wildwood.html keeps the full server (solo, shared room).
    global LEAN_PAGE
    lean = LEAN_PAGE = render(template, dict(slots, **{'{{SERVER}}': "throw new Error('This page has no world server of its own: it plays on the server that sent it.');\n"}))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(page)
    node = ''.join(strip_header(read(os.path.join(SRC, 'node', f))) for f in manifest['node'])
    with open(SERVER_OUT, 'w', encoding='utf-8') as f:
        f.write('#!/usr/bin/env node\n/* Wildwood world server. Run: node wildwood-server.js [--port 8080] [--no-dev] */\n\'use strict\';\n'
                'const PAGE=' + json.dumps(lean) + ';\n'
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
    # the Node host's copy of the page may differ from dist/wildwood.html in the world server's block and nowhere else
    lean_blocks = [b.split('</script>', 1)[0] for b in LEAN_PAGE.split('<script>')[1:]]
    if len(lean_blocks) != len(blocks) or [i for i, (a, b) in enumerate(zip(blocks, lean_blocks)) if a != b and 'function createWorldServer' not in a]:
        sys.exit('the lean page (embedded in wildwood-server.js) differs from dist/wildwood.html outside the world server block: build() must only swap {{SERVER}}')
    if not any('This page has no world server of its own' in b for b in lean_blocks):
        sys.exit('the lean page does not have the world server stub')
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
    print('layout ok (headers, manifest, docs/FILES.md, test registry, doc pointers)')


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
       3. docs/FILES.md is what `--write-index` would write now
       4. tools/tests.json (the test registry that tools/run-tests.js runs) lists every tools/*-smoke.js, each entry has its file, a description, what it covers and a time"""
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
    problems += lint_tests()
    problems += lint_docs()
    return problems


# docs that describe the game as it is now (the design docs also name files that are planned and not built, so they are not checked)
CURRENT_DOCS = ['CLAUDE.md', 'AGENTS.md', 'README.md', 'tools/README.md', 'docs/TESTING.md', 'docs/DEPLOY.md', 'docs/CHARACTER.md', 'docs/PROTOCOL.md']
DOC_REF = re.compile(r'`([A-Za-z0-9_./\-]+\.(?:js|py|md|json|css|html|svg|png|webp|m4a))(?::\d+)?`')
BUILD_OUTPUTS = ('dist/', 'out.png', 'wildwood-server.js', 'wildwood.html')   # made by a build or a tool, not in the tree


def lint_docs():
    """A file named in backticks in a current-state doc must exist (a bare name such as `movement.js` anywhere under src/, tools/, docs/ or assets/; a path relative to the repo, to
       src/, to the doc, or ending the path of a file). Catches the pointers an agent would follow into nothing after a rename or a delete. Shorthands like `-woods.js`, patterns with * or <>
       and music-* are skipped."""
    names, paths = set(), set()
    for top in ('src', 'tools', 'docs', 'assets'):
        for folder, _, fs in os.walk(os.path.join(ROOT, top)):
            for f in fs:
                names.add(f)
                paths.add(os.path.relpath(os.path.join(folder, f), ROOT).replace(os.sep, '/'))
    for f in os.listdir(ROOT):
        names.add(f)
        paths.add(f)
    docs = CURRENT_DOCS + ['docs/areas/' + f for f in sorted(os.listdir(os.path.join(ROOT, 'docs', 'areas'))) if f.endswith('.md')]
    problems = []
    for d in docs:
        if not os.path.isfile(os.path.join(ROOT, d)):
            continue
        for n, line in enumerate(read(os.path.join(ROOT, d)).split('\n'), 1):
            for m in DOC_REF.finditer(line):
                t = m.group(1)
                if t.startswith('-') or t.startswith('music-') or any(c in t for c in '*<>') or t.startswith(BUILD_OUTPUTS):
                    continue
                if '/' in t:
                    rel = os.path.normpath(os.path.join(os.path.dirname(d), t)).replace(os.sep, '/')
                    ok = any(c in paths for c in (t, 'src/' + t, 'docs/' + t, 'tools/' + t, rel)) or any(p.endswith('/' + t) for p in paths)
                else:
                    ok = t in names
                if not ok:
                    problems.append('%s:%d names `%s`, which does not exist: fix the pointer (renamed? deleted?) or reword it' % (d, n, t))
    return problems


def lint_tests():
    reg_path = os.path.join(ROOT, 'tools', 'tests.json')
    if not os.path.isfile(reg_path):
        return ['tools/tests.json is missing (the test registry tools/run-tests.js runs)']
    problems, seen = [], set()
    for t in json.loads(read(reg_path))['tests']:
        i = t.get('id', '?')
        if i in seen:
            problems.append('tools/tests.json lists %s twice' % i)
        seen.add(i)
        f = t.get('file', i)   # (a row may name the script it runs: one script, several rows, e.g. with other arguments)
        if not os.path.isfile(os.path.join(ROOT, 'tools', f + '.js')):
            problems.append('tools/tests.json lists %s but tools/%s.js does not exist' % (i, f))
        for k in ('desc', 'covers', 'secs', 'needs'):
            if not t.get(k):
                problems.append('tools/tests.json: %s has no "%s"' % (i, k))
        if t.get('needs') not in ('src', 'dist', 'playwright'):
            problems.append('tools/tests.json: %s needs "%s" (src, dist or playwright)' % (i, t.get('needs')))
    for n in sorted(os.listdir(os.path.join(ROOT, 'tools'))):
        if n.endswith('-smoke.js') and n[:-3] not in seen:
            problems.append('tools/%s is a test but is not in tools/tests.json: add a row (id, needs, secs, desc, covers); until then `npm test` never runs it' % n)
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
