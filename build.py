#!/usr/bin/env python3
"""Build Wildwood into one self-contained page: dist/wildwood.html

    python3 build.py            build
    python3 build.py --check    build, then syntax-check every script with node (if installed)
    python3 build.py --index    print what each source file contains (from its //@ header)

Why one file: the published page may not download anything from other sites, so the 3D engine,
every script, every stylesheet and every sound file are inlined into the page.

How the sources fit together:
  src/index.html        page shell with {{STYLES}} {{EARLY}} {{AUDIO}} {{GAME}} {{THREE}} {{START}} slots
  src/manifest.json     load order of the styles and game files (order matters, see README.md)
  src/styles/*.css      concatenated in manifest order
  src/game/**/*.js      concatenated in manifest order into ONE function, wildwoodMain(), so they
                        share one scope: a const in one file is visible to every later file
  src/boot/early.js     runs first: error screen, WebGL check
  src/boot/start.js     runs last: starts wildwoodMain()
  src/vendor/           three.js r128 (MIT)
  assets/audio/*        .wav .mp3 .ogg .m4a files, embedded as base64; play with playSample('file-name')

The first line of every source file may be a header: //@ ... in JS, /*@ ... */ in CSS.
Headers document the file and are left out of the built page.
"""
import re, base64, json, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
AUDIO = os.path.join(ROOT, 'assets', 'audio')
OUT = os.path.join(ROOT, 'dist', 'wildwood.html')
SERVER_OUT = os.path.join(ROOT, 'dist', 'wildwood-server.js')
AUDIO_TYPES = ('.wav', '.mp3', '.ogg', '.m4a')
MAX_BYTES = 15 * 1024 * 1024  # the host allows 16 MB per page


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


def audio_block():
    if not os.path.isdir(AUDIO):
        return ''
    files = sorted(f for f in os.listdir(AUDIO) if f.lower().endswith(AUDIO_TYPES))
    if not files:
        return ''
    data = {}
    for f in files:
        with open(os.path.join(AUDIO, f), 'rb') as fh:
            data[os.path.splitext(f)[0]] = base64.b64encode(fh.read()).decode('ascii')
    return '<script>\nwindow.WILDWOOD_AUDIO=' + json.dumps(data, separators=(',', ':')) + ';\n</script>\n'


def build():
    manifest = json.loads(read(os.path.join(SRC, 'manifest.json')))
    styles = ''.join(strip_header(read(os.path.join(SRC, 'styles', f))) for f in manifest['styles'])
    shared = ''.join(strip_header(read(os.path.join(SRC, 'shared', f))) for f in manifest['shared'])
    server = shared + ''.join(strip_header(read(os.path.join(SRC, 'server', f))) for f in manifest['server'])
    game = ''.join(shared if f == '@shared' else strip_header(read(os.path.join(SRC, 'game', f))) for f in manifest['game'])
    slots = {
        '{{STYLES}}': styles,
        '{{EARLY}}': read(os.path.join(SRC, 'boot', 'early.js')),
        '{{AUDIO}}': audio_block(),
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
        sys.exit('page is over 15 MB; shrink or compress the audio files')
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


def index():
    manifest = json.loads(read(os.path.join(SRC, 'manifest.json')))
    for group in ('styles', 'shared', 'server', 'node', 'game'):
        print('\n' + group)
        for f in manifest[group]:
            if f == '@shared':
                print('  %-34s %s' % ('@shared', '(the shared files above are inserted here)'))
                continue
            print('  %-34s %s' % (f, header(read(os.path.join(SRC, group, f)))))


if __name__ == '__main__':
    if '--index' in sys.argv:
        index()
    else:
        page = build()
        if '--check' in sys.argv:
            check(page)
