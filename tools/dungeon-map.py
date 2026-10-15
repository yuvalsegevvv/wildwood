#!/usr/bin/env python3
"""Draws the dungeon map preview from the JSON tools/dungeon-map.js dumps. Usage: dungeon-map.py job.json out.png (numpy not needed, pillow is)."""
import json, sys
from PIL import Image, ImageDraw, ImageFont

job = json.load(open(sys.argv[1]))
S = 4                       # pixels per cell (a cell is 2 m)
PAD, GAP, HEAD, FOOT = 18, 26, 80, 92
def font(size, bold=False):
    for name in (['DejaVuSans-Bold.ttf'] if bold else []) + ['DejaVuSans.ttf', 'Arial.ttf']:
        try: return ImageFont.truetype(name, size)
        except OSError: pass
    return ImageFont.load_default()
F, FS, FB = font(12), font(10), font(15, True)

def hexc(n, k=1.0):
    return tuple(max(0, min(255, int(((n >> sh) & 255) * k))) for sh in (16, 8, 0))

pal = job['pal']
FLOOR, WALL, WALLC = hexc(pal['floor'], 2.3), (14, 11, 8), hexc(pal['wall'], 1.5)
ROLE = {'start': 'entrance', 'hall': 'boss hall', 'site': 'objective room', 'cache': 'cache', 'room': '', 'pass': ''}
MARK = {'S': ((226, 84, 60), 'monster mouth'), 'O': ((244, 200, 60), 'objective'), 'C': ((90, 200, 230), 'cache chest'), 'P': ((120, 230, 120), 'entrance portal'), 'B': ((200, 90, 230), 'boss spot')}

panels = job['panels']
sizes = [(p['w'] * S, p['h'] * S) for p in panels]
W = PAD * 2 + sum(w for w, h in sizes) + GAP * (len(panels) - 1)
H = HEAD + max(h for w, h in sizes) + FOOT + PAD
img = Image.new('RGB', (W, H), (27, 22, 16))
d = ImageDraw.Draw(img)
d.text((PAD, 14), job['title'], font=font(20, True), fill=(236, 224, 190))
d.text((PAD, 40), 'One cell = 2 m, one tile = 24 x 24 cells (48 m). Walls are dark; the same mission and seed rebuild the same dungeon in the game.', font=F, fill=(180, 168, 140))

x0 = PAD
for p, (pw, ph) in zip(panels, sizes):
    ox, oy = x0, HEAD
    d.text((ox, oy - 16), '%s  (seed %d, %d x %d tiles)' % (p['name'], p['seed'], p['gw'], p['gh']), font=FB, fill=(240, 232, 205))
    d.rectangle([ox - 1, oy - 1, ox + pw, oy + ph], fill=WALL)
    cells = p['cells']; w = p['w']
    for z in range(p['h']):
        for x in range(w):
            if cells[z * w + x]:
                tx, tz = x // job['tc'], z // job['tc']
                k = 0.92 + 0.1 * (((tx * 7 + tz * 13) % 3) / 2.0)
                c = tuple(int(v * k) for v in FLOOR)
                d.rectangle([ox + x * S, oy + z * S, ox + x * S + S - 1, oy + z * S + S - 1], fill=c)
    # walls: the rim of every floor cell facing a wall gets the wall colour (so the shape reads)
    for z in range(p['h']):
        for x in range(w):
            if not cells[z * w + x]:
                if any(0 <= x + dx < w and 0 <= z + dz < p['h'] and cells[(z + dz) * w + x + dx] for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    d.rectangle([ox + x * S, oy + z * S, ox + x * S + S - 1, oy + z * S + S - 1], fill=WALLC)
    # props: solid ones (roots, trunks, pillars) darker green-brown; hazards red dots; the rest (fungus, sap, pods) small lit dots
    for q in p['props']:
        cx, cz = int(q['x'] / job['cell'] * S) + ox, int(q['z'] / job['cell'] * S) + oy
        if q['hz']:
            d.ellipse([cx - 2, cz - 2, cx + 2, cz + 2], outline=(220, 70, 50))
        elif p['solid'].get(q['k']):
            d.rectangle([cx - S // 2, cz - S // 2, cx + S // 2 - 1, cz + S // 2 - 1], fill=(40, 52, 30))
        else:
            d.point([cx, cz], fill=(190, 230, 120))
    # tile frames and roles
    tc = job['tc'] * S
    for t in p['tiles']:
        d.rectangle([ox + t['x'] * tc, oy + t['z'] * tc, ox + t['x'] * tc + tc - 1, oy + t['z'] * tc + tc - 1], outline=(70, 58, 42))
        lab = ROLE.get(t['role'], t['role'])
        if lab: d.text((ox + t['x'] * tc + 4, oy + t['z'] * tc + 3), lab, font=FS, fill=(255, 248, 220))
    # the round boss hall's circle
    if p['boss']:
        b = p['boss']; cx, cz, r = ox + b['x'] / job['cell'] * S, oy + b['z'] / job['cell'] * S, b['r'] / job['cell'] * S
        d.ellipse([cx - r, cz - r, cx + r, cz + r], outline=(200, 90, 230))
    for ch, items in p['marks'].items():
        col = MARK[ch][0]
        for m in items:
            cx, cz = int(m['x'] / job['cell'] * S) + ox, int(m['z'] / job['cell'] * S) + oy
            if ch == 'B': d.ellipse([cx - 6, cz - 6, cx + 6, cz + 6], outline=col, width=2)
            elif ch == 'P': d.polygon([(cx, cz - 7), (cx + 7, cz + 5), (cx - 7, cz + 5)], fill=col, outline=(20, 60, 20))
            elif ch == 'O': d.ellipse([cx - 5, cz - 5, cx + 5, cz + 5], fill=col, outline=(60, 40, 0))
            elif ch == 'C': d.rectangle([cx - 4, cz - 4, cx + 4, cz + 4], fill=col, outline=(10, 50, 70))
            else: d.rectangle([cx - 3, cz - 3, cx + 3, cz + 3], fill=col)
    x0 += pw + GAP

# legend
ly = HEAD + max(h for w, h in sizes) + 22
lx = PAD
for ch in 'PSOCB':
    col, name = MARK[ch]
    d.rectangle([lx, ly, lx + 12, ly + 12], fill=col)
    d.text((lx + 18, ly - 1), name, font=F, fill=(225, 214, 185)); lx += 28 + int(d.textlength(name, font=F)) + 18
d.text((PAD, ly + 26), 'Dark green squares: root walls and pillars in the floor. Red rings: hazards (root spikes). Purple circle: the 40 m round boss hall (Amanita). Lit dots: fungus, sap and seed pods.', font=F, fill=(180, 168, 140))
d.text((PAD, ly + 46), 'Every mission type is always open in the Trial Roots; it plays like the Hollow Roots at level 5 and pays nothing.', font=F, fill=(180, 168, 140))
img.save(sys.argv[2])
print('wrote', sys.argv[2], img.size)
