#!/usr/bin/env python3
"""Candidates for dead code. Run from anywhere:  python3 tools/unused.py

  1. top-level names (functions, consts, lets, classes) that nothing uses, not even the other bundle. These are safe to delete
     after a quick grep (a name could still be reached through a string, e.g. window[name] or a dev command).
  2. names the client bundle declares and never uses, split from the ones the server uses: shared files are loaded into both bundles,
     so a name used by only one side is normal; only what neither side uses is dead.
  3. CSS classes and ids that no markup or script mentions (classes built as 'r'+rar, 'role-'+role, 'k-'+kind... show up here: check first),
     and ids a script looks up that no markup defines (ids made by innerHTML show up here too).
Comments are ignored when counting. The counts are word matches, so a name that only appears inside a string counts as used."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import build

SRC = build.SRC


def strip_comments(t):
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    return re.sub(r'(?m)(^|[^:\\\'"`])//.*$', r'\1', t)


def words(files, extra=''):
    counts = {}
    for text in [strip_comments(build.read(p)) for p in files] + [extra]:
        for w in re.findall(r'[A-Za-z_$][\w$]*', text):
            counts[w] = counts.get(w, 0) + 1
    return counts


def declared(files):
    out = []
    for p in files:
        seen = set()
        for n in build.top_level_names(build.read(p)):
            if n not in seen:
                seen.add(n)
                out.append((p, n))
    return out


def main():
    m = json.loads(build.read(os.path.join(SRC, 'manifest.json')))
    shared = [os.path.join(SRC, 'shared', f) for f in m['shared']]
    client = [os.path.join(SRC, 'game', f) for f in m['game'] if f != '@shared']
    server = [os.path.join(SRC, 'server', f) for f in m['server']]
    node = [os.path.join(SRC, 'node', f) for f in m['node']]
    html = build.read(os.path.join(SRC, 'index.html'))
    boot = build.read(os.path.join(SRC, 'boot', 'early.js')) + build.read(os.path.join(SRC, 'boot', 'start.js'))
    rel = lambda p: os.path.relpath(p, SRC).replace(os.sep, '/')

    wc, ws, wn = words(shared + client, html + boot), words(shared + server), words(node)
    dead, client_only = [], []
    for p, n in declared(shared + client):
        if wc.get(n, 0) <= 1:
            (dead if (p not in shared or ws.get(n, 0) <= 1) else client_only).append((p, n))
    for p, n in declared(server):
        if ws.get(n, 0) <= 1:
            dead.append((p, n))
    for p, n in declared(node):
        if wn.get(n, 0) <= 1:
            dead.append((p, n))
    # a shared name that the server declares as unused but the client uses (or the reverse) is fine: only both-unused is dead
    dead = [(p, n) for p, n in dead if not (p in shared and (wc.get(n, 0) > 1 or ws.get(n, 0) > 1))]
    print('== unused everywhere (%d)' % len(dead))
    for p, n in sorted(set(dead)): print('   %-30s %s' % (rel(p), n))
    print('== shared code only the server uses, sitting in the client bundle (%d): fine, but a candidate to move to src/server/ if it grows' % len(client_only))
    print('   ' + ', '.join(sorted(n for _, n in client_only)))

    css = ''.join(build.read(os.path.join(SRC, 'styles', f)) for f in m['styles'])
    sel = re.sub(r'@[^{]*\{', '', re.sub(r'\{[^{}]*\}', '{}', re.sub(r'/\*.*?\*/', '', css, flags=re.S)))
    classes = set(re.findall(r'\.(-?[A-Za-z_][\w-]*)', re.sub(r'\d+\.\d+', '', re.sub(r'\[[^\]]*\]|\([^)]*\)', '', sel))))
    ids = set(re.findall(r'#([A-Za-z_][\w-]*)', re.sub(r'\[[^\]]*\]', '', sel)))
    used = html + '\n' + '\n'.join(strip_comments(build.read(p)) for p in client + shared) + boot
    mentioned = lambda n: re.search(r'(?<![\w-])' + re.escape(n) + r'(?![\w-])', used)
    print('== CSS classes no markup or script mentions:', ', '.join(sorted(c for c in classes if not mentioned(c))) or '-')
    print('== CSS ids no markup or script mentions:', ', '.join(sorted(i for i in ids if not mentioned(i))) or '-')
    html_ids = set(re.findall(r'id="([^"]+)"', html))
    looked_up = set()
    for p in client:
        for a, b in re.findall(r"\$\('#([A-Za-z_][\w-]*)'\)|getElementById\('([^']+)'\)", strip_comments(build.read(p))):
            looked_up.add(a or b)
    print('== ids a script looks up that index.html does not define:', ', '.join(sorted(i for i in looked_up if i not in html_ids)) or '-')


if __name__ == '__main__':
    main()
