# Draws docs/world-map.svg (Eldmere, see docs/WORLD.md) from the owner's draft. Run: python3 docs/world-map.py docs/world-map.svg
# Not part of the game build. Edit the data near the top (coast M, borders BRAW, TOWNS, LABELS, RIVERS) and re-run.
import math, random, sys

OUT = sys.argv[1]
# --game DATA.js: the art for the in-game world map (src/game/ui/world-map.js): no lettering but the sea's names, no title, compass, legend or frame (the game draws banners, town names and the
# pin itself, and fogs what is locked or not built), and a JS file with the regions as polygons. tools/world-map-bake.js runs this and bakes the SVG to assets/img/world-map.webp.
GAME = '--game' in sys.argv
GAME_JS = sys.argv[sys.argv.index('--game') + 1] if GAME else None
W, H = 2000, 1574

# ---------- geometry helpers ----------
def wiggle(pts, closed, levels, amp, seed):
    rng = random.Random(seed)
    for _ in range(levels):
        out = []
        n = len(pts)
        edges = n if closed else n - 1
        for i in range(edges):
            a, b = pts[i], pts[(i + 1) % n]
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy) or 1
            nx, ny = -dy / L, dx / L
            d = rng.uniform(-1, 1) * amp * L
            out.append(a)
            out.append(((a[0] + b[0]) / 2 + nx * d, (a[1] + b[1]) / 2 + ny * d))
        if not closed:
            out.append(pts[-1])
        pts = out
    return pts

def pip(pt, poly):
    x, y = pt; inside = False; n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y):
            xi = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            if xi > x: inside = not inside
    return inside

def dseg(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy or 1
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)

def dline(p, pts, closed=False):
    n = len(pts); m = n if closed else n - 1
    return min(dseg(p, pts[i], pts[(i + 1) % n]) for i in range(m))

def path(pts, closed=True):
    s = 'M' + ' L'.join('%.1f %.1f' % q for q in pts)
    return s + (' Z' if closed else '')

def smooth(pts, closed=False):
    # quadratic smoothing through midpoints (for rivers and roads)
    if len(pts) < 3: return path(pts, False)
    s = 'M%.1f %.1f' % pts[0]
    for i in range(1, len(pts) - 1):
        mx, my = (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2
        s += ' Q%.1f %.1f %.1f %.1f' % (pts[i][0], pts[i][1], mx, my)
    s += ' L%.1f %.1f' % pts[-1]
    return s

# ---------- the draft ----------
M = [(268,282),(270,320),(300,360),(360,400),(420,440),(470,460),(580,465),(620,430),(700,400),(810,352),(955,330),
     (1050,310),(1130,300),(1210,325),(1300,385),(1390,470),(1470,545),(1540,620),(1585,700),(1600,780),(1590,820),
     (1550,850),(1450,890),(1210,885),(1130,857),(1050,845),(990,840),(930,848),(860,880),(800,940),(760,1000),
     (720,1030),(675,1060),(650,1120),(610,1200),(580,1280),(490,1282),(440,1265),(410,1225),(395,1160),(398,1060),
     (412,970),(450,905),(505,858),(545,825),(580,770),(585,700),(570,640),(530,610),(475,580),(430,550),(370,528),
     (320,505),(270,465),(235,410),(222,340),(240,300)]
CL = 4; STEP = 2 ** CL
COAST = wiggle(M, True, CL, 0.17, 11)
NC = len(COAST)
def coast(a, b):
    i, j = a * STEP, b * STEP
    if j < i: j += NC
    return [COAST[k % NC] for k in range(i, j + 1)]

J1, J2, J3 = (945,585), (870,578), (1175,640)
BRAW = {
 'h':  [M[5], (445,500), M[50]],
 'gf': [M[10], (962,380), (940,440), J1],
 'gw': [J1, J2],
 'gs': [J2, (810,572), (740,590), (680,620), M[47]],
 'fw': [J1, (1020,595), (1100,610), J3],
 'fv': [J3, (1260,590), (1350,565), (1440,545), M[16]],
 'wv': [J3, (1185,700), (1200,780), M[23]],
 'ws': [J2, (840,620), (800,710), (800,790), (830,850), M[28]],
 'sa': [M[43], (560,900), (640,950), (690,1010), M[31]],
}
B = {k: wiggle(v, False, 3, 0.13, sum(map(ord, k)) + 5) for k, v in BRAW.items()}
def fw(k): return B[k]
def rv(k): return B[k][::-1]

REG = {
 'horn':  coast(50, 5) + fw('h'),
 'grey':  coast(5, 10) + fw('gf') + fw('gw') + fw('gs') + coast(47, 50) + rv('h'),
 'frost': coast(10, 16) + rv('fv') + rv('fw') + rv('gf'),
 'vale':  coast(16, 23) + rv('wv') + fw('fv'),
 'wild':  coast(23, 28) + rv('ws') + rv('gw') + fw('fw') + fw('wv'),
 'sun':   coast(28, 31) + rv('sa') + coast(43, 47) + rv('gs') + fw('ws'),
 'amber': coast(31, 43) + fw('sa'),
}
COL = {'horn':'#9fb294','grey':'#aaa08c','frost':'#eaf1f6','vale':'#e7bcc6','wild':'#5c9343','sun':'#e8c67c','amber':'#cdbd62'}

ISLES_RAW = [
 [(610,1325),(660,1335),(700,1390),(705,1415),(650,1432),(610,1410),(582,1370)],
 [(748,1225),(780,1222),(803,1260),(790,1280),(752,1277),(742,1250)],
 [(898,1245),(935,1260),(968,1300),(960,1325),(920,1320),(893,1285)],
 [(803,1360),(850,1365),(885,1410),(860,1445),(815,1440),(795,1400)],
 [(1015,1340),(1065,1335),(1095,1375),(1098,1398),(1040,1413),(997,1410),(1000,1380)],
 [(1180,1415),(1215,1408),(1260,1430),(1298,1448),(1240,1454),(1180,1452)],
]
ISLES = [wiggle(p, True, 3, 0.11, 40 + i) for i, p in enumerate(ISLES_RAW)]

RIVERS = [
 (wiggle([(1015,600),(995,650),(1000,700),(985,745),(995,800),(990,846)], False, 2, .12, 71), False),
 (wiggle([(1330,520),(1300,590),(1280,640),(1295,690),(1285,735),(1320,800),(1345,888)], False, 2, .12, 72), False),
 (wiggle([(740,560),(735,598),(718,650),(712,700),(690,745),(640,790),(538,824)], False, 2, .12, 73), False),
 (wiggle([(630,948),(595,1005),(575,1060),(545,1120),(520,1190),(505,1284)], False, 2, .12, 74), True),
]
LAKES = [((1092,792),24,13,'#5fb0da'), ((1300,462),42,17,'#cfe6f2'), ((770,488),15,9,'#5fb0da')]

TOWNS = {  # name: (x, y, symbol, label dx, label dy, anchor)
 'Gullrest':   (406,482,'vil', 0, 30,'middle'),
 'Highmark':   (873,470,'castle', 0, 32,'middle'),
 'Rimehold':   (1162,532,'vilsnow', 0, 30,'middle'),
 'Glasswell':  (695,760,'city', 0, 36,'middle'),
 'the village':(1000,717,'vil', 0, 30,'middle'),
 'Hanami':     (1259,739,'pagoda', 0, 30,'middle'),
 'Tallgrass':  (422,1108,'huts', 0, 30,'middle'),
 'Coralhaven': (672,1366,'stilts', 36, 26,'start'),
}

# labels: (text, x, y, size, angle, kind)
LABELS = [
 ('STORMHORN', 318, 408, 30, 40, 'reg'), ('Levels 30–40', 300, 442, 20, 40, 'lv'),
 ('THE GREYSPINE', 650, 566, 32, -13, 'reg'), ('Levels 26–32', 662, 596, 20, -13, 'lv'),
 ('HOARFROST REACH', 1165, 402, 32, 0, 'reg'), ('Levels 22–30', 1165, 432, 20, 0, 'lv'),
 ('WILDWOOD', 1000, 628, 34, 0, 'reg'), ('Levels 1–15', 1000, 656, 20, 0, 'lv'),
 ('SAKURA VALE', 1415, 662, 32, 0, 'reg'), ('Levels 16–25', 1415, 692, 20, 0, 'lv'),
 ('SUNSCAR', 700, 652, 32, 0, 'reg'), ('Levels 28–36', 700, 680, 20, 0, 'lv'),
 ('AMBER REACH', 545, 1000, 32, 0, 'reg'), ('Levels 35–45', 545, 1030, 20, 0, 'lv'),
]
def in_label(p, pad=14):
    for t, x, y, s, a, k in LABELS:
        w = len(t) * s * (0.78 if k == 'reg' else 0.55) / 2 + pad
        h = s * 0.6 + pad
        c, sn = math.cos(-math.radians(a)), math.sin(-math.radians(a))
        dx, dy = p[0] - x, p[1] - (y - s * 0.35)
        rx, ry = dx * c - dy * sn, dx * sn + dy * c
        if abs(rx) < w and abs(ry) < h: return True
    for n, (x, y, *_r) in TOWNS.items():
        r = 62 if n == 'Glasswell' else 44
        if math.hypot(p[0] - x, p[1] - y + 10) < r: return True
        if abs(p[0] - x) < len(n) * 6 + 10 and 0 < p[1] - y < 44: return True
    return False

# ---------- scatter terrain icons ----------
rng = random.Random(7)
ICONS = []
def near_river(p, d):
    return any(dline(p, r) < d for r, _ in RIVERS)
def near_lake(p, d):
    return any(((p[0]-c[0])/(rx+d))**2 + ((p[1]-c[1])/(ry+d))**2 < 1 for c, rx, ry, _ in LAKES)
def ok(p, reg, edge=16, border=12):
    if not pip(p, REG[reg]): return False
    if dline(p, COAST, True) < edge: return False
    for k, b in B.items():
        if dline(p, b) < border: return False
    if near_lake(p, 8) or in_label(p): return False
    return True

def scatter(reg, step, pick, edge=16, border=12, river=14):
    xs = [q[0] for q in REG[reg]]; ys = [q[1] for q in REG[reg]]
    y = min(ys)
    while y < max(ys) + step:
        x = min(xs)
        while x < max(xs) + step:
            p = (x + rng.uniform(-.42, .42) * step, y + rng.uniform(-.42, .42) * step)
            if ok(p, reg, edge, border) and not near_river(p, river):
                s = pick(p)
                if s: ICONS.append((p[0], p[1]) + tuple(s) if isinstance(s, tuple) else (p[0], p[1], s, 1.0))
            x += step
        y += step * 0.86

def r(): return rng.random()
scatter('wild', 29, lambda p: ('pine', .95 + r() * .2) if p[1] < 655 and r() < .6 else ('tree', .9 + r() * .3))
scatter('vale', 31, lambda p: None if dline(p, B['wv']) < 34 else
        (('sakura', .95 + r() * .25) if r() < .55 else ('tree', .9 + r() * .2) if r() < .6 else ('pine', 1.0)))
scatter('frost', 44, lambda p: ('snowpine', 1.0) if dline(p, B['fw'] + B['fv']) < 55 and r() < .8 else
        ('mtn', .8 + r() * .3) if p[0] < 1010 and r() < .7 else ('icehill', .8 + r() * .5) if r() < .65 else None, edge=24)
scatter('grey', 40, lambda p: ('pine', 1.0) if dline(p, B['gs'] + B['gw']) < 32 else ('mtn', .8 + r() * .55), edge=26, border=16)
scatter('horn', 27, lambda p: ('crag', .9 + r() * .4) if r() < .45 else ('heather', 1.0), edge=16, border=12)
scatter('sun', 42, lambda p: ('palm', .9) if near_river(p, 34) else ('mesa', .8 + r() * .4) if dline(p, B['ws']) < 60 and r() < .7
        else ('dune', .8 + r() * .5) if r() < .8 else None, river=12, edge=20)
scatter('amber', 36, lambda p: ('tree', .9) if near_river(p, 30) else ('acacia', .9 + r() * .3) if r() < .38 else
        ('baobab', 1.0) if r() < .12 else ('grass', 1.0), river=12)
for i, isle in enumerate(ISLES):
    xs = [q[0] for q in isle]; ys = [q[1] for q in isle]
    for k in range(60):
        p = (rng.uniform(min(xs), max(xs)), rng.uniform(min(ys), max(ys)))
        if pip(p, isle) and dline(p, isle, True) > 10 and not in_label(p) and math.hypot(p[0]-622, p[1]-1392) > 30 \
           and all(math.hypot(p[0]-q[0], p[1]-q[1]) > 17 for q in ICONS[-12:]):
            ICONS.append((p[0], p[1], 'palm', .8 + r() * .3))
ICONS.append((620, 1402, 'volcano', .85))
# the Vale Wall: the spur the tunnel goes through
for t in (0.12, 0.3, 0.52, 0.72, 0.9):
    q = B['wv'][int(t * (len(B['wv']) - 1))]
    if abs(q[1] - 740) > 18: ICONS.append((q[0] + 4, q[1] + 14, 'mtn', .62))
ICONS.sort(key=lambda q: q[1])

# ---------- sea decorations ----------
WAVES = []
for k in range(900):
    p = (rng.uniform(60, W - 60), rng.uniform(60, H - 60))
    if len(WAVES) > 70: break
    if pip(p, COAST) or any(pip(p, i) for i in ISLES): continue
    if dline(p, COAST, True) < 70 or any(dline(p, i, True) < 45 for i in ISLES): continue
    if (1440 < p[0] and p[1] > 1090) or (620 < p[0] < 1380 and p[1] < 200) or (1660 < p[0] and p[1] < 380): continue
    if (820 < p[0] < 1320 and 1120 < p[1] < 1220) or (1700 < p[0] and 480 < p[1] < 780) or (300 < p[0] < 560 and 660 < p[1] < 760): continue
    if any(math.hypot(p[0] - w[0], p[1] - w[1]) < 110 for w in WAVES): continue
    WAVES.append(p)

# ---------- write ----------
o = []
A = o.append
A('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 %d %d" width="1200" height="944" font-family="Georgia, \'Palatino Linotype\', \'Book Antiqua\', serif">' % (W, H))
A('<!-- Eldmere, the home continent of Wildwood: generated from the owner\'s draft (same coordinates). See docs/WORLD.md. -->')
A('<defs>')
A('<radialGradient id="sea" cx="52%" cy="62%" r="75%"><stop offset="0" stop-color="#3da9c9"/><stop offset=".55" stop-color="#23779f"/><stop offset="1" stop-color="#123f63"/></radialGradient>')
A('<radialGradient id="warm"><stop offset="0" stop-color="#6fd6d2" stop-opacity=".85"/><stop offset=".7" stop-color="#4cc0cc" stop-opacity=".5"/><stop offset="1" stop-color="#4cc0cc" stop-opacity="0"/></radialGradient>')
A('<radialGradient id="cold"><stop offset="0" stop-color="#6d8fa6" stop-opacity=".75"/><stop offset="1" stop-color="#6d8fa6" stop-opacity="0"/></radialGradient>')
A('<radialGradient id="parch" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fbf4e1"/><stop offset="1" stop-color="#e9d8ae"/></radialGradient>')
A('<filter id="blur12" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="12"/></filter>')
A('<filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>')
A('<filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>')
A('<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="5" seed="4"/>'
  '<feColorMatrix values="0 0 0 0 .32  0 0 0 0 .24  0 0 0 0 .12  1.5 0 0 0 -.55"/></filter>')
A('<filter id="seagrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006 .02" numOctaves="3" seed="9"/>'
  '<feColorMatrix values="0 0 0 0 .85  0 0 0 0 .95  0 0 0 0 1  1.2 0 0 0 -.5"/></filter>')
A('<filter id="shadow" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="4" dy="6" stdDeviation="6" flood-color="#0a2233" flood-opacity=".45"/></filter>')
A('<g id="land"><path d="%s"/>%s</g>' % (path(COAST), ''.join('<path d="%s"/>' % path(i) for i in ISLES)))
A('<clipPath id="landClip"><path d="%s"/>%s</clipPath>' % (path(COAST), ''.join('<path d="%s"/>' % path(i) for i in ISLES)))
for i, (w1, w2) in enumerate([(60, 52), (104, 98)]):
    A('<mask id="ring%d"><rect width="%d" height="%d" fill="#000"/><use href="#land" fill="none" stroke="#fff" stroke-width="%d" stroke-linejoin="round"/>'
      '<use href="#land" fill="#000" stroke="#000" stroke-width="%d" stroke-linejoin="round"/></mask>' % (i, W, H, w1, w2))
# terrain symbols (origin: foot of the icon)
A('''<g id="tree"><ellipse cx="3" cy="0" rx="12" ry="4" fill="#15250d" opacity=".28"/><rect x="-2" y="-9" width="4" height="9" fill="#5a3b1f"/><circle cy="-19" r="12" fill="#3b752a" stroke="#1f3f15" stroke-width="1.6"/><circle cx="-4" cy="-23" r="6.5" fill="#67a547"/><circle cx="4" cy="-14" r="4" fill="#2d5f20"/></g>
<g id="pine"><ellipse cx="3" cy="0" rx="9" ry="3" fill="#15250d" opacity=".28"/><rect x="-1.5" y="-6" width="3" height="6" fill="#5a3b1f"/><path d="M0 -36 L-11 -6 L11 -6 Z" fill="#2f6a3c" stroke="#163822" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -36 L0 -6 L11 -6 Z" fill="#1f4a2b"/></g>
<g id="snowpine"><ellipse cx="3" cy="0" rx="9" ry="3" fill="#33485a" opacity=".25"/><rect x="-1.5" y="-6" width="3" height="6" fill="#5a3b1f"/><path d="M0 -36 L-11 -6 L11 -6 Z" fill="#2f5a4a" stroke="#163a30" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -36 L0 -6 L11 -6 Z" fill="#20443a"/><path d="M0 -36 L-5 -22 L0 -25 L5 -22 Z M-7 -15 L0 -19 L7 -15 L0 -17 Z" fill="#fff"/></g>
<g id="sakura"><ellipse cx="3" cy="0" rx="12" ry="4" fill="#3a1a22" opacity=".25"/><path d="M0 0 L0 -12 L-4 -17 M0 -12 L4 -18" stroke="#4a2c22" stroke-width="2.4" fill="none"/><circle cy="-21" r="12" fill="#ee94b3" stroke="#a45672" stroke-width="1.6"/><circle cx="-4" cy="-25" r="6.5" fill="#ffd2e2"/><circle cx="5" cy="-16" r="4" fill="#d9759a"/></g>
<g id="mtn"><path d="M-38 0 L-7 -56 L7 -42 L14 -48 L40 0 Z" fill="#a39988" stroke="#3e352c" stroke-width="2.4" stroke-linejoin="round"/><path d="M-7 -56 L7 -42 L14 -48 L40 0 L3 0 L-2 -22 Z" fill="#6d6356"/><path d="M-7 -56 L-17 -38 L-10 -40 L-5 -33 L0 -41 L7 -42 Z" fill="#fdfeff" stroke="#3e352c" stroke-width="1"/><path d="M14 -48 L8 -40 L13 -41 L18 -37 L21 -35 Z" fill="#dfe8f0"/><path d="M-20 -10 L-12 -18 M-26 -4 L-20 -10" stroke="#7d7466" stroke-width="1.6"/></g>
<g id="icehill"><ellipse cx="3" cy="0" rx="24" ry="4" fill="#58738a" opacity=".2"/><path d="M-26 0 Q-20 -25 0 -27 Q20 -25 26 0 Z" fill="#f6fafd" stroke="#7896ab" stroke-width="2"/><path d="M0 -27 Q20 -25 26 0 L6 0 Q11 -14 0 -27Z" fill="#c4d8e6"/><path d="M-14 -12 Q-8 -18 -2 -16" stroke="#9fb9cb" stroke-width="1.6" fill="none"/></g>
<g id="crag"><path d="M-15 0 L-11 -15 L-3 -19 L4 -13 L12 -17 L17 0 Z" fill="#8f8e84" stroke="#3a3832" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 -13 L12 -17 L17 0 L5 0Z" fill="#62615a"/></g>
<g id="heather"><path d="M-8 0 Q-6 -8 -3 -10 M0 0 Q0 -9 1 -12 M7 0 Q6 -8 4 -10" stroke="#5f6a44" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="-3" cy="-10" r="2.6" fill="#a07fb5"/><circle cx="1" cy="-12" r="2.6" fill="#b894cc"/><circle cx="4" cy="-10" r="2.6" fill="#9a78ae"/></g>
<g id="dune"><path d="M-34 0 Q-14 -20 6 -14 Q22 -9 34 0 Z" fill="#e2bb6e"/><path d="M6 -14 Q22 -9 34 0 L4 0 Q10 -6 6 -14Z" fill="#c4974a"/><path d="M-34 0 Q-14 -20 6 -14 Q22 -9 34 0" fill="none" stroke="#9a6f33" stroke-width="2"/></g>
<g id="mesa"><path d="M-26 0 L-20 -24 L18 -24 L26 0 Z" fill="#c9764a" stroke="#6b3a20" stroke-width="2" stroke-linejoin="round"/><path d="M-20 -24 L18 -24 L15 -18 L-17 -18 Z" fill="#e3a676"/><path d="M4 -18 L15 -18 L26 0 L8 0Z" fill="#a55a34"/><path d="M-14 -10 L-2 -10 M-8 -4 L6 -4" stroke="#a55a34" stroke-width="1.5"/></g>
<g id="grass"><path d="M-9 0 L-11 -10 M-4 0 L-4 -13 M1 0 L3 -12 M6 0 L10 -9" stroke="#8a8328" stroke-width="2.2" stroke-linecap="round"/></g>
<g id="acacia"><ellipse cx="3" cy="0" rx="14" ry="3.5" fill="#3a3010" opacity=".25"/><path d="M0 0 L0 -16 L-6 -22 M0 -16 L6 -23" stroke="#5a3b1f" stroke-width="2.5" fill="none"/><path d="M-21 -21 Q-16 -32 0 -32 Q16 -32 21 -21 Z" fill="#6f8a2e" stroke="#3b4a16" stroke-width="1.6"/><path d="M-14 -27 Q-4 -31 6 -29" stroke="#93ad48" stroke-width="3" fill="none"/></g>
<g id="baobab"><ellipse cx="3" cy="0" rx="12" ry="3.5" fill="#3a3010" opacity=".25"/><path d="M-8 0 Q-10 -14 -5 -27 L5 -27 Q10 -14 8 0 Z" fill="#8f6d4a" stroke="#4a3624" stroke-width="1.6"/><path d="M-5 -27 L-12 -35 M0 -27 L0 -37 M5 -27 L12 -34" stroke="#4a3624" stroke-width="2.6"/><circle cx="-12" cy="-36" r="5.5" fill="#6f8a2e"/><circle cx="0" cy="-39" r="6.5" fill="#7d9a35"/><circle cx="12" cy="-35" r="5.5" fill="#6f8a2e"/></g>
<g id="palm"><ellipse cx="3" cy="0" rx="8" ry="2.5" fill="#15250d" opacity=".25"/><path d="M0 0 Q-2 -12 3 -24" stroke="#7a5530" stroke-width="3.2" fill="none"/><path d="M3 -24 Q-8 -30 -15 -20 M3 -24 Q14 -31 19 -20 M3 -24 Q-2 -34 -10 -34 M3 -24 Q10 -35 16 -33" stroke="#2c7a33" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>
<g id="volcano"><path d="M-40 0 L-11 -44 L11 -44 L40 0 Z" fill="#5a4638" stroke="#2a1e17" stroke-width="2.4" stroke-linejoin="round"/><path d="M11 -44 L40 0 L10 0 L4 -30Z" fill="#3e3027"/><path d="M-11 -44 L11 -44 L7 -36 L-7 -36Z" fill="#ff7a2a"/><path d="M-2 -38 L-7 -18 L-2 -22 L-5 -2" stroke="#ff6a1a" stroke-width="3.4" fill="none" stroke-linejoin="round"/><path d="M0 -48 Q-10 -60 2 -70 Q14 -80 4 -94" stroke="#d6d2cc" stroke-width="9" fill="none" opacity=".8" stroke-linecap="round"/></g>
<g id="vil" stroke="#3a2a1a" stroke-width="1.6" stroke-linejoin="round"><ellipse cx="0" cy="1" rx="28" ry="6" fill="#1a1208" opacity=".25" stroke="none"/><rect x="-22" y="-11" width="14" height="11" fill="#f1e5c8"/><path d="M-24 -11 L-15 -21 L-6 -11 Z" fill="#b0492e"/><rect x="-3" y="-15" width="17" height="15" fill="#f1e5c8"/><path d="M-5 -15 L5.5 -28 L16 -15 Z" fill="#c2533a"/><rect x="12" y="-9" width="12" height="9" fill="#f1e5c8"/><path d="M10 -9 L18 -18 L26 -9Z" fill="#9a3f28"/><rect x="3" y="-8" width="5" height="8" fill="#5a3b1f"/></g>
<g id="vilsnow" stroke="#2f3a44" stroke-width="1.6" stroke-linejoin="round"><ellipse cx="0" cy="1" rx="28" ry="6" fill="#1a1208" opacity=".2" stroke="none"/><rect x="-24" y="-10" width="22" height="10" fill="#8a6440"/><path d="M-27 -10 L-13 -21 L1 -10 Z" fill="#f4f8fb"/><rect x="2" y="-12" width="22" height="12" fill="#7a5636"/><path d="M-1 -12 L13 -25 L27 -12 Z" fill="#f4f8fb"/><rect x="10" y="-7" width="5" height="7" fill="#ffcf6a"/></g>
<g id="pagoda" stroke="#3a1a1a" stroke-width="1.6" stroke-linejoin="round"><ellipse cx="0" cy="1" rx="26" ry="6" fill="#1a1208" opacity=".25" stroke="none"/><rect x="-9" y="-13" width="18" height="13" fill="#f3e6cf"/><path d="M-21 -13 Q0 -8 21 -13 L12 -21 L-12 -21 Z" fill="#b2332a"/><rect x="-7" y="-30" width="14" height="9" fill="#f3e6cf"/><path d="M-17 -30 Q0 -25 17 -30 L9 -37 L-9 -37Z" fill="#b2332a"/><rect x="-5" y="-44" width="10" height="7" fill="#f3e6cf"/><path d="M-13 -44 Q0 -40 13 -44 L6 -50 L-6 -50Z" fill="#b2332a"/><path d="M0 -50 L0 -58"/><rect x="-3" y="-8" width="6" height="8" fill="#3a1a1a"/></g>
<g id="castle" stroke="#2f2a24" stroke-width="1.6" stroke-linejoin="round"><path d="M-30 2 L-22 -10 L22 -10 L30 2Z" fill="#7d7468"/><rect x="-16" y="-30" width="32" height="20" fill="#d3cab6"/><rect x="-23" y="-42" width="11" height="32" fill="#c1b7a3"/><rect x="12" y="-42" width="11" height="32" fill="#c1b7a3"/><path d="M-25 -42 L-17.5 -54 L-10 -42Z M10 -42 L17.5 -54 L25 -42Z" fill="#4f6588"/><path d="M-6 -30 L0 -40 L6 -30Z" fill="#4f6588"/><rect x="-4" y="-22" width="8" height="12" fill="#3a2a1a"/><path d="M-17.5 -54 L-17.5 -62 L-11 -59 L-17.5 -57" fill="#c9372c"/></g>
<g id="city" stroke="#4a3219" stroke-width="1.8" stroke-linejoin="round"><ellipse cx="0" cy="2" rx="58" ry="10" fill="#1a1208" opacity=".25" stroke="none"/><rect x="-30" y="-34" width="24" height="16" fill="#efe0bb"/><rect x="10" y="-32" width="22" height="14" fill="#e9d6aa"/><path d="M-30 -34 a12 12 0 0 1 24 0Z" fill="#f7f4ea"/><path d="M-13 -34 L-13 -52" stroke-width="1.4"/><rect x="-10" y="-40" width="22" height="22" fill="#f1e4c2"/><path d="M-12 -40 a13 15 0 0 1 26 0Z" fill="#3aa3a0"/><path d="M1 -55 L1 -62"/><rect x="30" y="-56" width="7" height="38" fill="#efe0bb"/><path d="M29 -56 L33.5 -64 L38 -56Z" fill="#3aa3a0"/><path d="M-48 0 L-48 -20 L48 -20 L48 0 Z" fill="#dcbf86"/><path d="M-48 -20 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5 m6 0 l0 -5 l6 0 l0 5" fill="#dcbf86"/><rect x="-56" y="-30" width="12" height="30" fill="#cfae72"/><rect x="44" y="-30" width="12" height="30" fill="#cfae72"/><path d="M-57 -30 L-50 -38 L-43 -30Z M43 -30 L50 -38 L57 -30Z" fill="#b0492e"/><path d="M-7 0 L-7 -10 a7 7 0 0 1 14 0 L7 0Z" fill="#3a2410"/></g>
<g id="huts" stroke="#4a3219" stroke-width="1.6" stroke-linejoin="round"><ellipse cx="0" cy="1" rx="28" ry="6" fill="#1a1208" opacity=".25" stroke="none"/><path d="M-26 -8 L-16 -22 L-6 -8Z" fill="#c9a24e"/><rect x="-23" y="-8" width="14" height="8" fill="#b5703e"/><path d="M-6 -12 L6 -28 L18 -12Z" fill="#d6ae58"/><rect x="-3" y="-12" width="18" height="12" fill="#b5703e"/><path d="M14 -6 L22 -17 L30 -6Z" fill="#c9a24e"/><rect x="16" y="-6" width="12" height="6" fill="#a8663a"/><rect x="4" y="-7" width="5" height="7" fill="#3a2410"/></g>
<g id="stilts" stroke="#4a3219" stroke-width="1.6" stroke-linejoin="round"><path d="M-18 0 L-18 -8 M-8 0 L-8 -8 M8 0 L8 -8 M18 0 L18 -8" stroke-width="2"/><rect x="-22" y="-10" width="44" height="3" fill="#8a5a30"/><rect x="-18" y="-20" width="14" height="10" fill="#e3c78e"/><path d="M-22 -20 L-11 -31 L0 -20Z" fill="#c9a24e"/><rect x="3" y="-19" width="15" height="9" fill="#e3c78e"/><path d="M0 -19 L10.5 -29 L21 -19Z" fill="#d6ae58"/></g>
<g id="lighthouse" stroke="#2a2a2a" stroke-width="1.6" stroke-linejoin="round"><path d="M-16 2 L-10 -6 L10 -6 L16 2Z" fill="#6f6d66"/><path d="M-8 -6 L-5 -46 L5 -46 L8 -6Z" fill="#f4f1ea"/><path d="M-7.4 -18 L7.4 -18 L7 -12 L-7 -12Z M-5.9 -34 L5.9 -34 L5.6 -28 L-5.6 -28Z" fill="#b53a2a"/><rect x="-6" y="-54" width="12" height="8" fill="#5d6166"/><path d="M-8 -54 L0 -62 L8 -54Z" fill="#3a3a3a"/></g>
<g id="ship" stroke="#2e1c0e" stroke-width="1.6" stroke-linejoin="round"><path d="M-26 -4 L26 -4 L18 7 L-18 7 Z" fill="#6b4424"/><path d="M0 -4 L0 -44" stroke-width="2.2"/><path d="M1 -42 Q20 -26 1 -8 Z" fill="#f4ecd8"/><path d="M-1 -38 Q-16 -24 -1 -10Z" fill="#e9dfc6"/><path d="M0 -44 L10 -41 L0 -38" fill="#c9372c"/><path d="M-30 10 q8 -5 16 0 q8 -5 16 0 q8 -5 16 0 q8 -5 16 0" fill="none" stroke="#e6f6ff" stroke-width="2"/></g>
<g id="serpent" stroke="#0f3a30" stroke-width="2.2" stroke-linejoin="round"><path d="M-62 0 Q-51 -28 -40 0 Z" fill="#2f7a66"/><path d="M-27 0 Q-14 -34 -1 0Z" fill="#2f7a66"/><path d="M12 0 Q22 -24 32 0Z" fill="#2f7a66"/><path d="M44 0 Q48 -16 56 -28 Q66 -38 76 -30 L72 -22 Q62 -26 58 -12 L56 0Z" fill="#2f7a66"/><circle cx="68" cy="-30" r="2" fill="#ffd34d" stroke="none"/><path d="M-70 5 q8 -5 16 0 q8 -5 16 0 m14 0 q8 -5 16 0 q8 -5 16 0 m14 0 q8 -5 16 0 q8 -5 16 0" fill="none" stroke="#e6f6ff" stroke-width="2" opacity=".8"/></g>
<path id="wave" d="M-16 0 q8 -7 16 0 q8 -7 16 0" fill="none" stroke="#e6f6ff" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>''')
A('<path id="crownArc" d="M810 1178 Q1060 1112 1330 1182"/>')
A('<path id="deepArc" d="M1700 1060 Q1830 800 1760 470"/>')
A('<path id="bightArc" d="M240 800 Q400 716 548 772"/>')
A('</defs>')

# sea
A('<rect width="%d" height="%d" fill="url(#sea)"/>' % (W, H))
A('<ellipse cx="1030" cy="1130" rx="700" ry="400" fill="url(#warm)"/>')
A('<ellipse cx="440" cy="730" rx="230" ry="300" fill="url(#cold)"/>')
A('<rect width="%d" height="%d" filter="url(#seagrain)" opacity=".35"/>' % (W, H))
# shallows and coast rings
A('<use href="#land" fill="none" stroke="#9ce6e6" stroke-width="80" stroke-linejoin="round" opacity=".35" filter="url(#blur12)"/>')
A('<use href="#land" fill="none" stroke="#b8f0ea" stroke-width="34" stroke-linejoin="round" opacity=".45" filter="url(#blur6)"/>')
A('<rect width="%d" height="%d" fill="#e9fbff" opacity=".45" mask="url(#ring0)"/>' % (W, H))
A('<rect width="%d" height="%d" fill="#e9fbff" opacity=".22" mask="url(#ring1)"/>' % (W, H))
# currents
A('<g fill="none" stroke-width="5" stroke-linecap="round" opacity=".7">'
  '<path d="M150 150 C100 370 190 560 360 640 C440 690 440 800 400 900 C330 1060 300 1220 330 1420" stroke="#d6f1ff" stroke-dasharray="4 14"/>'
  '<path d="M1360 1330 C1520 1180 1540 1000 1380 972 C1200 945 990 965 870 1050 C790 1110 770 1230 840 1300" stroke="#ffd29a" stroke-dasharray="4 14"/></g>')
A('<g fill="#d6f1ff" opacity=".8"><path d="M322 1420 l8 22 l8 -22z"/></g><g fill="#ffd29a" opacity=".85"><path d="M828 1290 l20 18 l-2 -24z"/></g>')
for p in WAVES: A('<use href="#wave" x="%.0f" y="%.0f"/>' % p)

# land: soft painted regions, grain, darker rim
A('<g clip-path="url(#landClip)" filter="url(#shadow)"><use href="#land" fill="#c4b387"/></g>')
A('<g clip-path="url(#landClip)">')
A('<g filter="url(#blur12)">')
for k, poly in REG.items(): A('<path d="%s" fill="%s"/>' % (path(poly), COL[k]))
A('</g>')
for i in ISLES: A('<path d="%s" fill="#62a84c"/>' % path(i))
# snow on the high Greyspine and a cold wash over the Hoarfrost
A('<path d="%s" fill="#ffffff" opacity=".25" filter="url(#blur12)"/>' % path(coast(6, 10) + [(930, 420), (760, 470), (600, 520)]))
A('<rect width="%d" height="%d" filter="url(#grain)" opacity=".32"/>' % (W, H))
# beaches on the warm coasts
for ch in (coast(16, 28), coast(31, 36)):
    A('<path d="%s" fill="none" stroke="#efdca3" stroke-width="16" stroke-linejoin="round" opacity=".9" filter="url(#blur3)"/>' % path(ch, False))
for i in ISLES:
    A('<path d="%s" fill="none" stroke="#f2e2b0" stroke-width="12" stroke-linejoin="round" filter="url(#blur3)"/>' % path(i))
A('<use href="#land" fill="none" stroke="#2c2012" stroke-width="16" opacity=".22" filter="url(#blur6)"/>')
A('</g>')

# sea cliffs: hatch strokes on the Stormhorn and the Greyspine coasts
ticks = []
for ch in (coast(47, 10),):
    for k in range(0, len(ch) - 1, 2):
        a, b = ch[k], ch[k + 1]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        if pip((a[0] + nx * 6, a[1] + ny * 6), COAST): nx, ny = -nx, -ny
        ticks.append('M%.1f %.1f l%.1f %.1f' % (a[0], a[1], nx * 11, ny * 11))
A('<path d="%s" stroke="#3a2f26" stroke-width="2.2" opacity=".75"/>' % ' '.join(ticks))
# coastline
A('<use href="#land" fill="none" stroke="#2c2317" stroke-width="3.2" stroke-linejoin="round"/>')

# lakes and rivers
for c, rx, ry, col in LAKES:
    A('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" stroke="#2c5f80" stroke-width="2.4"/>' % (c[0], c[1], rx, ry, col))
for pts, dry in RIVERS:
    d = smooth(pts)
    dash = ' stroke-dasharray="14 8"' if dry else ''
    A('<path d="%s" fill="none" stroke="#2c5f80" stroke-width="8" stroke-linecap="round"%s/>' % (d, dash))
    A('<path d="%s" fill="none" stroke="#6fbfe6" stroke-width="4.6" stroke-linecap="round"%s/>' % (d, dash))

# region borders (soft dashed) and the Sunwall escarpment
A('<g fill="none" stroke-linecap="round" stroke-linejoin="round">')
for k, b in B.items():
    if k == 'ws': continue
    A('<path d="%s" stroke="#f6ecd0" stroke-width="7" opacity=".35"/><path d="%s" stroke="#4a3a26" stroke-width="2.6" stroke-dasharray="10 9" opacity=".6"/>' % (path(b, False), path(b, False)))
A('</g>')
sw = B['ws']; wt = []
for k in range(0, len(sw) - 1):
    a, b = sw[k], sw[k + 1]
    if abs(a[1] - 745) < 16: continue
    for t in (0, .5):
        x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
        wt.append('M%.1f %.1f l-13 3' % (x, y))
A('<path d="%s" fill="none" stroke="#7a3b18" stroke-width="5" stroke-linejoin="round"/>' % path(sw, False))
A('<path d="%s" stroke="#9c4f25" stroke-width="3"/>' % ' '.join(wt))

# roads and sea lanes
ROADS = [
 [(1000,717),(1080,736),(1150,742),(1215,745),(1259,739)],
 [(1259,739),(1240,660),(1205,600),(1162,540)],
 [(1162,532),(1080,520),(990,505),(900,478)],
 [(873,470),(790,520),(690,520),(600,545),(510,525),(430,490)],
 [(406,482),(360,440),(310,380),(275,318)],
 [(873,470),(820,540),(760,580),(728,650),(708,720)],
 [(695,760),(640,860),(560,940),(480,1030),(430,1090)],
 [(422,1108),(450,1180),(500,1245),(540,1272)],
]
for rd in ROADS:
    d = smooth(rd)
    A('<path d="%s" fill="none" stroke="#f6ecd0" stroke-width="7" stroke-linecap="round" opacity=".55"/>' % d)
    A('<path d="%s" fill="none" stroke="#6b4423" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="2 9"/>' % d)
A('<path d="%s" fill="none" stroke="#8a2f1e" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="2 9"/>' % smooth([(740,760),(800,748),(860,735),(930,725),(975,720)]))
A('<g stroke="#8a2f1e" stroke-width="4.5" stroke-linecap="round"><path d="M794 736 l14 18 M808 736 l-14 18"/></g>')
SEA = [
 [(545,1282),(580,1330),(640,1360)],
 [(680,1340),(740,1290),(772,1262)], [(800,1255),(860,1250),(920,1283)], [(700,1395),(760,1405),(820,1405)],
 [(880,1405),(950,1395),(1020,1380)], [(1095,1390),(1160,1410),(1215,1428)],
 [(262,296),(200,230),(120,170),(40,130)],
]
for s in SEA: A('<path d="%s" fill="none" stroke="#f6fbff" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 10" opacity=".85"/>' % smooth(s))

# terrain icons, back to front
for x, y, s, k in ICONS:
    if abs(k - 1) < 1e-6: A('<use href="#%s" x="%.0f" y="%.0f"/>' % (s, x, y))
    else: A('<use href="#%s" transform="translate(%.0f %.0f) scale(%.2f)"/>' % (s, x, y, k))

# settlements
for n, (x, y, s, dx, dy, anc) in TOWNS.items():
    sc = 1.3 if s == 'city' else 1.1
    A('<use href="#%s" transform="translate(%d %d) scale(%.2f)"/>' % (s, x, y + 12, sc))
A('<use href="#lighthouse" transform="translate(258 312) scale(1.1)"/>')
# sea life
A('<use href="#ship" transform="translate(588 1332) scale(.9)"/>')
A('<use href="#ship" transform="translate(130 520) scale(.8)"/>')
A('<use href="#serpent" transform="translate(1560 300) scale(1.1)"/>')

# ---------- lettering ----------
HALO = 'paint-order="stroke" stroke="#f7eed6" stroke-linejoin="round"'
if GAME: A = lambda _s: None   # (the game map draws these itself; only the sea's names below stay in the art)
for t, x, y, s, a, k in LABELS:
    tr = ' transform="rotate(%d %d %d)"' % (a, x, y) if a else ''
    if k == 'reg':
        A('<text x="%d" y="%d" font-size="%d" font-weight="bold" letter-spacing="%d" text-anchor="middle" fill="#2a1d10" %s stroke-width="7"%s>%s</text>' % (x, y, s, s // 6, HALO, tr, t))
    else:
        A('<text x="%d" y="%d" font-size="%d" font-style="italic" text-anchor="middle" fill="#5a3a1c" %s stroke-width="6"%s>%s</text>' % (x, y, s, HALO, tr, t))
for n, (x, y, s, dx, dy, anc) in TOWNS.items():
    A('<text x="%d" y="%d" font-size="%d" text-anchor="%s" fill="#3a2410" %s stroke-width="5">%s</text>' % (x + dx, y + dy, 22 if n == 'Glasswell' else 19, anc, HALO, n))
A('<text x="300" y="286" font-size="17" font-style="italic" fill="#3a2410" %s stroke-width="5">the dark lighthouse</text>' % HALO)
A('<text x="822" y="770" font-size="17" font-style="italic" fill="#6a2410" %s stroke-width="5">Redgate (sealed)</text>' % HALO)
A('<text x="1130" y="778" font-size="16" font-style="italic" fill="#3a2410" %s stroke-width="5">tunnel</text>' % HALO)
A('<text x="712" y="866" font-size="18" font-style="italic" fill="#6a3a14" %s stroke-width="5" transform="rotate(-62 712 866)">the Sunwall</text>' % HALO)
# isles label sits in the sea
A('<text x="900" y="1510" font-size="32" font-weight="bold" letter-spacing="5" text-anchor="middle" fill="#fff6dc" stroke="#1d3a4a" stroke-width="6" paint-order="stroke">EMBERWAKE ISLES</text>')
A('<text x="900" y="1540" font-size="20" font-style="italic" text-anchor="middle" fill="#fff6dc" stroke="#1d3a4a" stroke-width="5" paint-order="stroke">Levels 40–50</text>')
A = o.append
SEAT = 'fill="#eaf8ff" font-style="italic" opacity=".92"'
A('<text font-size="44" letter-spacing="12" %s><textPath href="#crownArc" startOffset="50%%" text-anchor="middle">The Crownsea</textPath></text>' % SEAT)
A('<text font-size="40" letter-spacing="14" %s><textPath href="#deepArc" startOffset="50%%" text-anchor="middle">The Outer Deep</textPath></text>' % SEAT)
A('<text font-size="24" letter-spacing="4" %s><textPath href="#bightArc" startOffset="50%%" text-anchor="middle">Greywater Bight</textPath></text>' % SEAT)
A('<text x="40" y="112" font-size="17" %s>to distant lands</text>' % SEAT)
A('<text x="96" y="760" font-size="17" %s transform="rotate(-78 96 760)">cold current</text>' % SEAT)
A('<text x="1480" y="1010" font-size="17" %s>warm gyre</text>' % SEAT)

# title banner
if GAME: A = lambda _s: None   # (no title, compass, legend or frame in the game's art)
A('''<g transform="translate(1000 118)" filter="url(#shadow)">
<path d="M-330 -34 L-390 -34 L-360 4 L-390 42 L-300 42 Z" fill="#b99a5c" stroke="#4a3219" stroke-width="3" stroke-linejoin="round"/>
<path d="M330 -34 L390 -34 L360 4 L390 42 L300 42 Z" fill="#b99a5c" stroke="#4a3219" stroke-width="3" stroke-linejoin="round"/>
<path d="M-330 -56 Q0 -76 330 -56 L330 34 Q0 54 -330 34 Z" fill="url(#parch)" stroke="#4a3219" stroke-width="3.5"/>
<path d="M-316 -46 Q0 -65 316 -46 M-316 24 Q0 43 316 24" fill="none" stroke="#b08a4a" stroke-width="2"/>
<text x="0" y="-4" font-size="58" font-weight="bold" letter-spacing="22" text-anchor="middle" fill="#2a1d10">ELDMERE</text>
<text x="0" y="22" font-size="21" font-style="italic" letter-spacing="3" text-anchor="middle" fill="#5a3a1c">the lands around the Crownsea</text>
</g>''')
# compass rose
cr = ['<g transform="translate(1818 214)" filter="url(#shadow)">',
      '<circle r="96" fill="#f3e6c4" fill-opacity=".25" stroke="#f3e6c4" stroke-width="3"/><circle r="84" fill="none" stroke="#f3e6c4" stroke-width="1.5"/>']
for ang, L, w in [(45, 60, 13), (135, 60, 13), (225, 60, 13), (315, 60, 13), (0, 104, 19), (90, 104, 19), (180, 104, 19), (270, 104, 19)]:
    cr.append('<g transform="rotate(%d)"><path d="M0 %d L%d 0 L0 0Z" fill="#f7eed6" stroke="#3a2a1a" stroke-width="1.6"/><path d="M0 %d L-%d 0 L0 0Z" fill="#8a6a3a" stroke="#3a2a1a" stroke-width="1.6"/></g>' % (ang, -L, w, -L, w))
cr.append('<circle r="9" fill="#c9372c" stroke="#3a2a1a" stroke-width="2"/>')
cr.append('<text x="0" y="-112" font-size="30" font-weight="bold" text-anchor="middle" fill="#f7eed6" stroke="#1d3a4a" stroke-width="5" paint-order="stroke">N</text></g>')
A(''.join(cr))

# legend
A('<g transform="translate(1470 1110)" filter="url(#shadow)"><rect width="490" height="430" rx="10" fill="url(#parch)" stroke="#4a3219" stroke-width="3.5"/>'
  '<rect x="10" y="10" width="470" height="410" rx="6" fill="none" stroke="#b08a4a" stroke-width="1.6"/></g>')
L = ['<g transform="translate(1470 1110)" font-size="19" fill="#2a1d10">',
     '<text x="245" y="46" font-size="25" font-weight="bold" letter-spacing="5" text-anchor="middle">LEGEND</text>',
     '<use href="#vil" x="48" y="100"/><text x="95" y="96">village</text>',
     '<use href="#city" transform="translate(292 102) scale(.7)"/><text x="340" y="96">oasis city</text>',
     '<path d="M24 138 L76 138" stroke="#6b4423" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="2 9"/><text x="95" y="145">road</text>',
     '<path d="M262 138 L318 138" stroke="#8a2f1e" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="2 9"/><path d="M283 130 l12 16 M295 130 l-12 16" stroke="#8a2f1e" stroke-width="4"/><text x="340" y="145">sealed pass</text>',
     '<path d="M24 184 L76 184" stroke="#2c5f80" stroke-width="8" stroke-linecap="round"/><path d="M24 184 L76 184" stroke="#6fbfe6" stroke-width="4.6" stroke-linecap="round"/><text x="95" y="191">river</text>',
     '<path d="M262 184 L318 184" stroke="#4a8fbf" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 10"/><text x="340" y="191">sea lane</text>',
     '<path d="M24 230 L76 230" stroke="#4a3a26" stroke-width="2.6" stroke-dasharray="10 9"/><text x="95" y="237">region border</text>',
     '<path d="M262 226 L318 226" stroke="#7a3b18" stroke-width="5"/><path d="M270 226 l-9 6 M284 226 l-9 6 M298 226 l-9 6 M312 226 l-9 6" stroke="#9c4f25" stroke-width="3"/><text x="340" y="237">escarpment</text>',
     '<path d="M24 276 L76 276" stroke="#6d8fa6" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round"/><text x="95" y="283">cold current</text>',
     '<path d="M262 276 L318 276" stroke="#e0a45c" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round"/><text x="340" y="283">warm gyre</text>',
     '<use href="#mtn" transform="translate(50 336) scale(.6)"/><text x="95" y="333">mountains</text>',
     '<use href="#volcano" transform="translate(290 338) scale(.5)"/><text x="340" y="333">volcano</text>',
     '<text x="245" y="385" font-size="17" font-style="italic" text-anchor="middle" fill="#5a3a1c">Levels: the recommended range of each land.</text>',
     '<text x="245" y="408" font-size="17" font-style="italic" text-anchor="middle" fill="#5a3a1c">Wildwood and the Sakura Vale exist in the game.</text>',
     '</g>']
A(''.join(L))

# frame
A('<rect x="10" y="10" width="%d" height="%d" fill="none" stroke="#2a1d10" stroke-width="20"/>' % (W - 20, H - 20))
A('<rect x="26" y="26" width="%d" height="%d" fill="none" stroke="#c9a860" stroke-width="4"/>' % (W - 52, H - 52))
A('<rect x="34" y="34" width="%d" height="%d" fill="none" stroke="#c9a860" stroke-width="1.5" opacity=".7"/>' % (W - 68, H - 68))
for cx, cy in ((26, 26), (W - 26, 26), (26, H - 26), (W - 26, H - 26)):
    A('<path d="M%d %d l16 -16 l16 16 l-16 16 z" fill="#c9a860" stroke="#2a1d10" stroke-width="2.5"/>' % (cx - 16, cy))
A = o.append
A('</svg>')
open(OUT, 'w', encoding='utf-8').write('\n'.join(o))
print('icons', len(ICONS), 'waves', len(WAVES), 'bytes', sum(len(x) for x in o))

# ---------- the game's data file ----------
if GAME:
    def dp(pts, tol):   # Douglas-Peucker: the polygons are only for clicking, fogging and clamping a pin, so a few points a region do
        if len(pts) < 3: return list(pts)
        a, b = pts[0], pts[-1]; dm, di = -1, 0
        for i in range(1, len(pts) - 1):
            d = dseg(pts[i], a, b)
            if d > dm: dm, di = d, i
        if dm <= tol: return [a, b]
        return dp(pts[:di + 1], tol)[:-1] + dp(pts[di:], tol)
    def poly(pts): return '[' + ','.join('[%d,%d]' % (round(x), round(y)) for x, y in dp(list(pts) + [pts[0]], 2.2)[:-1]) + ']'
    names = {'wild': 'Wildwood', 'vale': 'Sakura Vale', 'frost': 'Hoarfrost Reach', 'grey': 'The Greyspine'}
    lv = {t: (x, y, a) for t, x, y, s_, a, k in LABELS if k == 'reg'}
    js = ['//@ The in-game world map\'s data, generated by docs/world-map.py --game (do not edit): the docs map\'s regions as polygons, the towns, the banners\' places',
          '/* Agent map: used by game/ui/world-map.js; the art itself is assets/img/world-map.webp (built by tools/world-map-bake.js, embedded by build.py as window.WILDWOOD_IMG). Coordinates are the art\'s own (2000 x 1574). */',
          'const WMAP_W=%d, WMAP_H=%d;' % (W, H),
          'const WMAP_REG={' + ','.join('%s:%s' % (k, poly(v)) for k, v in REG.items()) + '};   // wild = the home forest, vale, frost = the Hoarfrost Reach, grey = the Greyspine; horn, sun and amber are not built',
          'const WMAP_ISLES=[' + ','.join(poly(i) for i in ISLES) + '];   // the Emberwake Isles (not built)',
          'const WMAP_TOWNS={village:[%d,%d],hanami:[%d,%d],rimehold:[%d,%d],highmark:[%d,%d]};' % (TOWNS['the village'][:2] + TOWNS['Hanami'][:2] + TOWNS['Rimehold'][:2] + TOWNS['Highmark'][:2]),
          'const WMAP_BANNER={' + ','.join("%s:{name:'%s',x:%d,y:%d,levels:'%s'}" % (k, names[k], lv[n.upper()][0], lv[n.upper()][1], l) for k, n, l in (('wild', 'Wildwood', '1–15'), ('vale', 'Sakura Vale', '16–25'), ('frost', 'Hoarfrost Reach', '22–30'), ('grey', 'The Greyspine', '26–32'))) + '};']
    open(GAME_JS, 'w', encoding='utf-8').write('\n'.join(js) + '\n')
    print('game data', GAME_JS)
