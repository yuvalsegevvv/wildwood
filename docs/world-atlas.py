"""The atlas of Eldmere (v5, approved 17 Oct): continent, six equal lands, level zones, lakes, rivers from the high ground merging to
the sea, islands, the Proving Isle, Amber Reach (the seventh land, south of the Sunscar), roads. Deterministic. x east, z south (the game's frame). Metres.

This is the plan, not the terrain: its one-height-per-zone terraces are only a way to draw the map. The game takes from it WHERE things are
(land, zone, water, coast, roads, anchors) and a heavily smoothed target height; the ground itself is made of landforms in
src/shared/world-atlas-ground.js. Run (about 40 s):
  python3 docs/world-atlas.py                       the layout's statistics only
  python3 docs/world-atlas.py --out DIR             also DIR/world.json + DIR/world.npz (the prototype's files, for tools/render.py-style drawings)
  python3 docs/world-atlas.py --js src/shared/world-atlas-data.js   bake the compact grid (8 m) and the anchors the game reads (src/shared/world-atlas.js)
The layout (sections 1-11) is the v5 prototype unchanged (--out writes the same world.json); section 12 is the bake."""
import json, math, heapq, collections, sys, os, base64, argparse
_ap = argparse.ArgumentParser(); _ap.add_argument('--js'); _ap.add_argument('--out'); ARGS = _ap.parse_args()
import numpy as np
from PIL import Image, ImageDraw

ST = 6.0
X0, X1, Z0, Z1 = -1900, 1650, -1120, 1180
NX, NZ = int((X1 - X0) / ST), int((Z1 - Z0) / ST)
xs = X0 + (np.arange(NX) + 0.5) * ST; zs = Z0 + (np.arange(NZ) + 0.5) * ST
GX, GZ = np.meshgrid(xs, zs)
def cell(x, z): return (int(np.clip((z - Z0) / ST, 0, NZ - 1)), int(np.clip((x - X0) / ST, 0, NX - 1)))
def pos(c): return (float(X0 + (c[1] + .5) * ST), float(Z0 + (c[0] + .5) * ST))

# ---------- noise ----------
_GR = {}
def vnoise(x, z, seed):
    """Perlin gradient noise (-1..1), lattice 1 unit, its frame turned by a seeded angle (no grid-aligned features)"""
    if seed not in _GR:
        r = np.random.default_rng(seed); ang = r.random((257, 257)) * 2 * np.pi; _GR[seed] = (np.cos(ang), np.sin(ang), r.random() * np.pi)
    gc, gs, th = _GR[seed]; c, s_ = np.cos(th), np.sin(th)
    x, z = x * c - z * s_ + 37.1, x * s_ + z * c + 91.7
    xi, zi = np.floor(x).astype(int), np.floor(z).astype(int); fx, fz = x - xi, z - zi
    def g(ox, oz):
        i, j = (zi + oz) % 256, (xi + ox) % 256
        return gc[i, j] * (fx - ox) + gs[i, j] * (fz - oz)
    ux = fx ** 3 * (fx * (fx * 6 - 15) + 10); uz = fz ** 3 * (fz * (fz * 6 - 15) + 10)
    v = (g(0, 0) * (1 - ux) + g(1, 0) * ux) * (1 - uz) + (g(0, 1) * (1 - ux) + g(1, 1) * ux) * uz
    return v * 2.0
def fbm(x, z, seed, oct=4):
    v, a, f, s = 0, 1, 1, 0
    for k in range(oct): v = v + a * vnoise(x * f + k * 17.3, z * f - k * 9.1, seed * 13 + k); s += a; a *= 0.5; f *= 2.03
    return v / s
def shift(a, dz, dx, fill):
    out = np.full_like(a, fill); zs_ = slice(max(dz, 0), NZ + min(dz, 0)); zd = slice(max(-dz, 0), NZ + min(-dz, 0))
    xs_ = slice(max(dx, 0), NX + min(dx, 0)); xd = slice(max(-dx, 0), NX + min(-dx, 0)); out[zs_, xs_] = a[zd, xd]; return out
def chamfer(src):
    """distance (m) from every cell to the nearest True cell of src"""
    d = np.where(src, 0.0, 1e9)
    for _ in range(2):
        for i in range(1, NZ): d[i] = np.minimum(d[i], d[i - 1] + ST)
        for i in range(NZ - 2, -1, -1): d[i] = np.minimum(d[i], d[i + 1] + ST)
        for j in range(1, NX): d[:, j] = np.minimum(d[:, j], d[:, j - 1] + ST)
        for j in range(NX - 2, -1, -1): d[:, j] = np.minimum(d[:, j], d[:, j + 1] + ST)
        for i in range(1, NZ):
            d[i, 1:] = np.minimum(d[i, 1:], d[i - 1, :-1] + ST * 1.414); d[i, :-1] = np.minimum(d[i, :-1], d[i - 1, 1:] + ST * 1.414)
        for i in range(NZ - 2, -1, -1):
            d[i, 1:] = np.minimum(d[i, 1:], d[i + 1, :-1] + ST * 1.414); d[i, :-1] = np.minimum(d[i, :-1], d[i + 1, 1:] + ST * 1.414)
    return d
def blur(a, r):
    """box blur repeated 3x (about a gaussian of sigma ~ r cells)"""
    out = a.astype(float)
    for _ in range(3):
        k = 2 * r + 1
        c = np.cumsum(np.pad(out, ((0, 0), (r + 1, r)), mode='edge'), 1); out = (c[:, k:] - c[:, :-k]) / k
        c = np.cumsum(np.pad(out, ((r + 1, r), (0, 0)), mode='edge'), 0); out = (c[k:] - c[:-k]) / k
    return out
def poly_mask(pts):
    img = Image.new('L', (NX, NZ), 0); ImageDraw.Draw(img).polygon([((x - X0) / ST, (z - Z0) / ST) for x, z in pts], fill=255)
    return np.array(img) > 127
def flood(mask, start):
    out = np.zeros_like(mask); q = collections.deque([start]); out[start] = True
    while q:
        iz, ix = q.popleft()
        for dz, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            jz, jx = iz + dz, ix + dx
            if 0 <= jz < NZ and 0 <= jx < NX and mask[jz, jx] and not out[jz, jx]: out[jz, jx] = True; q.append((jz, jx))
    return out
NB8 = [(-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0), (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414)]
def dijkstra(mask, starts, cost, target=None):
    D = np.full(mask.shape, np.inf); P = {}; h = []
    for c in starts: D[c] = 0; h.append((0.0, c))
    heapq.heapify(h)
    while h:
        d, c = heapq.heappop(h)
        if c == target: break
        if d > D[c]: continue
        for dz, dx, w in NB8:
            n = (c[0] + dz, c[1] + dx)
            if 0 <= n[0] < NZ and 0 <= n[1] < NX and mask[n]:
                nd = d + w * ST * cost[n]
                if nd < D[n]: D[n] = nd; P[n] = c; heapq.heappush(h, (nd, n))
    return D, P

# ---------- 1. the continent ----------
OUTLINE = [
    # north coast, west to east: the Gloamhorn's headland, the Greyspine's fjords, the Reach
    (-1300, -860), (-1060, -950), (-800, -900), (-560, -1000), (-320, -950), (-80, -1010), (160, -950), (420, -990),
    (680, -930), (940, -950), (1160, -850), (1290, -670),
    # the east coast (the Reach, the vale)
    (1250, -470), (1330, -290), (1300, -70), (1370, 150), (1290, 370), (1180, 560),
    # the Crownsea: the vale's cape, the bay under Wildwood
    (980, 680), (760, 630), (560, 710), (380, 630), (180, 690), (-20, 650), (-220, 690), (-420, 640),
    # the land link south to Amber Reach: an isthmus running off the map's south edge (AMBER_EXT below widens it into the land)
    (-500, 660), (-400, 820), (-330, 1100), (-1260, 1100), (-1200, 860), (-1090, 720),
    # the Sunscar's fog coast
    (-1020, 620), (-1180, 470), (-1290, 270), (-1230, 70), (-1310, -70),
    # the Greywater Bight between the Sunscar and the Gloamhorn
    (-1140, -130), (-1010, -210), (-1060, -300), (-1220, -330),
    # the Gloamhorn's ragged west: headlands and coves
    (-1390, -300), (-1520, -380), (-1580, -540), (-1510, -700), (-1420, -800),
]
base = poly_mask(OUTLINE)
sd = chamfer(~base) - chamfer(base)
cn = fbm(GX * 0.0035, GZ * 0.0035, 11, 5) * 95 + fbm(GX * 0.012, GZ * 0.012, 12, 3) * 32
# islets: a few authored offshore (plus whatever the coast noise throws off)
MAIN0 = flood((sd + cn) > 0, cell(40, 200))   # the mainland of the six built lands (v5): their partition below is made on THIS, so nothing of the six moves when Amber Reach grows
AMBER0 = MAIN0 & (GZ > 690) & (GX > -1320) & (GX < -300)       # the old link south (the Sunscar's border with it is the straight line z = 690, where the Ashbed Gate stands)
# Amber Reach (docs/SAVANNA.md): the link widened into a land of its own, as big as the others (0.70 km2). The extension is added to the outline (a union, so the six lands' coasts stay as they were):
# west into the sea (the lobe in the north-west is cut off from the Sunscar's fog coast by a bay), the south coast out to z 1130, and the east coast out into the Crownsea (kept 300 m from Wildwood's)
AMBER_EXT = [(-1250, 700), (-1330, 610), (-1420, 520), (-1580, 520), (-1720, 600), (-1800, 760), (-1810, 940), (-1700, 1100), (-1560, 1118), (-1260, 1120), (-1000, 1125), (-700, 1132), (-420, 1125),
             (-300, 1128), (-200, 1080), (-170, 1010), (-190, 910), (-300, 840), (-400, 820), (-500, 780), (-1100, 790), (-1150, 760)]
base = base | poly_mask(AMBER_EXT)
sd = chamfer(~base) - chamfer(base)
MAIN = flood((sd + cn) > 0, cell(40, 200))   # the mainland only: the coast noise's stray specks are dropped
assert not (MAIN0 & ~MAIN).any(), 'the extension must not eat the old coast'
# ---------- 1b. islands, by the kind of coast (real coasts do not scatter dots: islands come in groups shaped by what made them) ----------
#   skerries   the Greyspine's fjord coast (Norway, the Stockholm archipelago): many small rocky islets in a belt 30-220 m out, lined up with the coast
#   outer isles off the Gloamhorn and the Reach (the Hebrides, Svalbard): a few large islands across a sound, long side parallel to the coast
#   barrier    the Crownsea under Wildwood (the Frisian islands, the Outer Banks): long thin sandy islands 70-110 m out, broken by tidal inlets
#   archipelago off the Vale's south-east cape (the Seto Inland Sea): the Warlord Isles, a cluster of hilly islands of mixed size
#   stacks     off the headlands of the Gloamhorn and the Sunscar's fog coast: pillars and rocks within 60 m of a cape
off = chamfer(MAIN)                                  # metres out to sea (0 on land)
sdb = blur(np.clip(sd, -400, 400), 18)               # a smooth signed distance: its gradient is the coast's normal, turned 90 degrees its tangent
gnz, gnx = np.gradient(sdb); th = np.arctan2(gnz, gnx) + np.pi / 2
U = GX * np.cos(th) + GZ * np.sin(th); V = -GX * np.sin(th) + GZ * np.cos(th)   # along the coast, across it
def stretched(fq, ang, k, seed, oct=4):
    a = np.radians(ang); u = GX * np.cos(a) + GZ * np.sin(a); v = -GX * np.sin(a) + GZ * np.cos(a)
    return fbm(u * fq / k, v * fq, seed, oct)
def region(x0, x1, z0, z1, soft=120):
    return np.clip(np.minimum.reduce([GX - x0, x1 - GX, GZ - z0, z1 - GZ]) / soft, 0, 1)
cape = np.clip((blur(MAIN.astype(float), 12) - 0.5) * -4, 0, 1) * 0 + np.clip(-blur(np.clip(sd, -200, 200), 10) / 60, 0, 1)   # (unused)
convex = np.clip((blur(MAIN.astype(float), 14) - blur(MAIN.astype(float), 4)) * -6, 0, 1)   # high just off a headland
P = np.full(MAIN.shape, -9.0); KIND = np.zeros(MAIN.shape, int)
def put(p, k):
    global P, KIND
    better = p > P; P = np.where(better, p, P); KIND = np.where(better, k, KIND)
# skerries (north coast, the Greyspine's stretch; thinning into the Reach)
n = stretched(0.034, 0, 1.6, 101, 3); belt = np.clip(1 - np.abs(off - 80) / 75, 0, 1) * (off > 18)
put((n + 0.12) * 2.4 * belt * region(-1100, 450, -1300, -640) * np.clip(fbm(GX * 0.004, GZ * 0.004, 102, 3) * 3 + 0.4, 0, 1) - 0.55, 1)
# outer isles: the Gloamhorn's west and the Reach's north-east (low frequency, stretched along the coast, a sound of 60 m+ kept open)
belt = np.clip(1 - np.abs(off - 190) / 140, 0, 1) * (off > 60)
put((stretched(0.006, 90, 2.4, 103) + 0.10) * 2.0 * belt * region(-2000, -1250, -1100, 300) - 0.30, 2)      # the Gloamhorn's coast runs north-south
put((stretched(0.006, -40, 2.4, 107) + 0.10) * 2.0 * belt * region(700, 1700, -1300, -500) - 0.30, 2)       # the Reach's runs north-west to south-east
# barrier islands: the Crownsea's shore under Wildwood and the Sunscar's south
inlet = fbm(GX * 0.010, GX * 0 + 4.4, 104, 3)
put((1 - np.abs(off - 90) / 16) * (inlet > -0.15) * region(-120, 520, 560, 800, 40) * 1.0 - 0.15, 3)
# the Warlord Isles: an archipelago off the Vale's south-east cape
n = fbm(GX * 0.010, GZ * 0.010, 105, 4); belt = np.clip(1 - np.abs(off - 170) / 150, 0, 1) * (off > 40)
put((n + 0.12) * 2.4 * belt * region(850, 1600, 380, 1100) - 0.34, 4)
# stacks off the headlands (the Gloamhorn, the Sunscar's fog coast, the Reach's east)
n = fbm(GX * 0.05, GZ * 0.05, 106, 2); belt = np.clip(1 - off / 55, 0, 1) * (off > 12)
put((n + 0.2) * 2.5 * belt * convex * np.maximum.reduce([region(-2000, -1150, -1100, 600), region(1150, 1600, -700, 400)]) - 0.55, 5)
ISLES = (P > 0) & ~MAIN
# the Proving Isle: an island of its own off Wildwood's beach (not in a lake), one plank bridge over a 50 m strait
mc = np.argwhere(MAIN & (np.abs(GX - 40) < 4) & (GZ > 300)); cz_ = max(pos(c)[1] for c in mc)
PVP = {'x': 40.0, 'z': round(cz_ + 50 + 34, 1), 'r': 34, 'bridge': [[40.0, round(cz_, 1)], [40.0, round(cz_ + 52, 1)]]}
pvd = np.hypot(GX - PVP['x'], GZ - PVP['z']) + fbm(GX * 0.03, GZ * 0.03, 120, 3) * 6
ISLES &= ~((np.hypot(GX - PVP['x'], GZ - PVP['z']) < 110) & ~(pvd < PVP['r']))   # clear its strait and sea of other islands
ISLES |= pvd < PVP['r']; P = np.where(pvd < PVP['r'], 1, P); KIND = np.where(pvd < PVP['r'], 6, KIND)
# drop islets under 400 m2 (a single rock is a prop, not an island)
seen = np.zeros_like(ISLES)
for c in map(tuple, np.argwhere(ISLES)):
    if seen[c]: continue
    comp = flood(ISLES & ~seen, c); seen |= comp
    if comp.sum() * ST * ST < 400: ISLES &= ~comp
ISLE_KIND = np.where(ISLES, KIND, 0)
LANDM = MAIN | ISLES


# ---------- 2. six equal lands: a weighted walking-distance partition, read through a domain warp (Amber Reach, the seventh, is not part of it: it is what the partition leaves) ----------
LANDS = [('gloam', 'Gloamhorn', (-1200, -600), 30, 40), ('grey', 'Greyspine', (-280, -720), 26, 32), ('hoar', 'Hoarfrost Reach', (800, -620), 22, 30),
         ('sun', 'Sunscar', (-860, 220), 28, 36), ('home', 'Wildwood', (40, 220), 1, 20), ('vale', 'Sakura Vale', (870, 230), 16, 25),
         ('amber', 'Amber Reach', (-760, 900), 37, 45)]
NP = 6   # the lands of the partition (the first six); Amber Reach is the land the partition leaves
LID = {l[0]: i for i, l in enumerate(LANDS)}
PART = MAIN0 & ~AMBER0
AMBER = MAIN & ~PART
COST = 1 + 0.9 * (fbm(GX * 0.006 + 3, GZ * 0.006 - 7, 23, 4) * 0.5 + 0.5)
GD = np.stack([dijkstra(PART, [cell(sx, sz)], COST)[0] for _, _, (sx, sz), _, _ in LANDS[:NP]])
w = np.zeros(NP); target = PART.sum() / NP
for it in range(3000):
    lab = np.where(PART, (GD - w[:, None, None]).argmin(0), -1)
    cnt = np.array([(lab == i).sum() for i in range(NP)])
    err = (target - cnt) / target
    if np.abs(err).max() < 0.012: break
    w += err * 30
wx = fbm(GX * 0.004 + 9, GZ * 0.004, 31, 4) * 80 + fbm(GX * 0.014, GZ * 0.014 + 5, 32, 3) * 26
wz = fbm(GX * 0.004 - 4, GZ * 0.004 + 7, 33, 4) * 80 + fbm(GX * 0.014 + 2, GZ * 0.014, 34, 3) * 26
jz = np.clip(((GZ + wz - Z0) / ST).astype(int), 0, NZ - 1); jx = np.clip(((GX + wx - X0) / ST).astype(int), 0, NX - 1)
lw = lab[jz, jx]; lab = np.where(PART & (lw >= 0), lw, lab)
for i in range(NP):   # pieces cut off by the warp join the land round them
    m = lab == i; core = flood(m, tuple(np.argwhere(m)[np.argmin(GD[i][m])])); stray = m & ~core
    for _ in range(60):
        if not stray.any(): break
        for dz, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb = shift(lab, dz, dx, -1); fix = stray & (nb != i) & (nb >= 0); lab[fix] = nb[fix]; stray &= ~fix
LL = lab.copy(); LL[AMBER] = 6
LAND_AREA = {LANDS[i][0]: int((LL == i).sum() * ST * ST) for i in range(len(LANDS))}

# ---------- 3. gates ----------
def border(a, b):
    A = LL == LID[a]; B = LL == b if isinstance(b, int) else np.isin(LL, [LID[x] for x in b]); nb = np.zeros_like(A)
    for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): nb |= shift(B, dz, dx, False)
    return np.argwhere(A & nb)
GATES = []
for a, b, name, kind in [('home', ['vale'], 'The Greyfall Bridge', 'bridge'), ('vale', ['hoar'], 'Frostgate Pass', 'pass'), ('hoar', ['grey'], 'The Glacier Valley', 'valley'),
                         ('grey', ['gloam'], 'The Windswept Neck', 'pass'), ('grey', ['sun'], 'The River Pass', 'pass'), ('home', ['sun'], 'Redgate Canyon', 'canyon'),
                         ('sun', 6, 'The Ashbed Gate', 'gate')]:
    c = border(a, b)
    if b == 6: c = c[c[:, 0] >= cell(0, 684)[0]]   # the Ashbed Gate stands on the Sunscar's straight southern border (z 690), where the dry riverbed is, not on the bay's shore beside the lobe
    mid = c.mean(0); k = np.argmin(((c - mid) ** 2).sum(1)); x, z = pos(c[k])
    GATES.append({'a': a, 'b': b if isinstance(b, int) else b[0], 'name': name, 'kind': kind, 'x': x, 'z': z})
GATES[-1]['b'] = 'amber'   # (the gate's far side is a land of the atlas now: the roads below run on both sides of it)

# ---------- 4. zones: organic cells of equal area, levels rising with the walk from the way in ----------
ZONE_KEYS = {'home': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 'shore', 'sunfoot', 'foothills'],
             'vale': [16, 17, 18, 19, 20, 21, 22, 23, 24, 25], 'hoar': [22, 23, 24, 25, 26, 27, 28, 29, 30],
             'grey': [26, 27, 28, 29, 30, 31, 32], 'sun': [28, 29, 30, 31, 32, 33, 34, 35, 36],
             'gloam': [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40], 'amber': [37, 38, 39, 40, 41, 42, 43, 44, 45]}
LEVELS = {'shore': '16-17', 'sunfoot': '18', 'foothills': '19-20'}
ENTRY = {'vale': 'The Greyfall Bridge', 'hoar': 'Frostgate Pass', 'grey': 'The Glacier Valley', 'sun': 'The River Pass', 'gloam': 'The Windswept Neck', 'amber': 'The Ashbed Gate'}
# Amber Reach's nine zones are laid out by hand (the loop of docs/SAVANNA.md): the gate zone 37 in the north-centre, the village's meadows 38 beside it, west through the pools (39) and the termite
# cathedrals (40, the north-western lobe) to Anvil Rock (41), back east along the south coast through the burnt plain (42) and the baobabs (43) to the delta (44), and the cape's Sunstair (45) in the east.
# The seeds of the cells (the weights then make them equal in area); the Sunstair (45) touches only the delta (44), so the end of the land is never next to its first zones.
AMBER_SEEDS = {37: (-720, 790), 38: (-1020, 830), 39: (-1300, 800), 40: (-1540, 700), 41: (-1650, 980), 42: (-1360, 1040), 43: (-1050, 1040), 44: (-560, 960), 45: (-300, 980)}
# a stronger, two-scale warp for the zones (cells with wandering, lobed borders instead of polygons)
ZWX = GX + fbm(GX * 0.0045, GZ * 0.0045, 41, 4) * 85 + fbm(GX * 0.016, GZ * 0.016, 42, 3) * 24
ZWZ = GZ + fbm(GX * 0.0045 + 50, GZ * 0.0045 - 30, 43, 4) * 85 + fbm(GX * 0.016 + 8, GZ * 0.016, 44, 3) * 24
ZL = np.full(LL.shape, -1, int); ZONES = []; HUBS = {}
for li, (lid, lname, _, lo, hi) in enumerate(LANDS):
    M = LL == li; keys = ZONE_KEYS[lid]; n = len(keys); cells = np.argwhere(M)
    cz, cx = cells.mean(0)
    if lid == 'home': hub = (cz, cx)
    else:
        g = next(G for G in GATES if G['name'] == ENTRY[lid]); gz, gx = cell(g['x'], g['z'])
        v = np.array([cz - gz, cx - gx]); v /= np.linalg.norm(v); hub = (gz + v[0] * 140 / ST, gx + v[1] * 140 / ST)
    hub = tuple(cells[np.argmin(((cells - np.array(hub)) ** 2).sum(1))])
    HUBS[lid] = pos(hub)
    PW = np.stack([ZWX[M], ZWZ[M]], 1); r = np.random.default_rng(100 + li)
    S = PW[r.choice(len(PW), n, replace=False)].copy(); wts = np.zeros(n); sub = PW[::3]
    if lid == 'amber': S = np.array([[ZWX[cell(*AMBER_SEEDS[kk])], ZWZ[cell(*AMBER_SEEDS[kk])]] for kk in keys])   # (the hand-placed seeds, in key order: seed k is zone keys[k])
    asg = lambda P: (((P[:, None, :] - S[None]) ** 2).sum(2) - wts[None]).argmin(1)
    for it in range(8 if lid != 'amber' else 2):   # a few Lloyd steps only: enough to spread the seeds, not enough to make honeycombs (two for Amber Reach: its seeds are the design)
        lb = asg(sub)
        for k in range(n):
            if (lb == k).any(): S[k] = sub[lb == k].mean(0) if lid != 'amber' else S[k] * 0.5 + sub[lb == k].mean(0) * 0.5
    for it in range(1000):
        lb = asg(sub); c_ = np.bincount(lb, minlength=n).astype(float)
        if np.abs(c_ - c_.mean()).max() < c_.mean() * 0.06: break
        wts += (c_.mean() - c_) / c_.mean() * 700
        if it % 30 == 29:
            for k in range(n):
                if (lb == k).any(): S[k] = S[k] * 0.6 + sub[lb == k].mean(0) * 0.4 if lid != 'amber' else S[k] * 0.8 + sub[lb == k].mean(0) * 0.2
    lb = asg(PW)
    # keep each zone in one piece
    for k in range(n):
        m = np.zeros(LL.shape, bool); m[cells[lb == k, 0], cells[lb == k, 1]] = True
        if not m.any(): continue
        core = flood(m, tuple(np.argwhere(m)[len(np.argwhere(m)) // 2])) if False else None
    D, _ = dijkstra(M, [hub], np.ones(LL.shape))
    cen = np.array([cells[lb == k].mean(0) for k in range(n)])
    dist = np.array([np.median(D[cells[lb == k, 0], cells[lb == k, 1]]) for k in range(n)])
    pins = {}
    if lid == 'home':
        sc = np.argwhere(M & ~shift(MAIN, -4, 0, False)); pins['shore'] = sc[np.argsort(-sc[:, 0])[:60]].mean(0)
        pins['sunfoot'] = border('home', ['sun']).mean(0); pins['foothills'] = border('home', ['grey', 'hoar']).mean(0)
    taken = {}
    for key, p in pins.items():
        k = min((k for k in range(n) if k not in taken.values()), key=lambda k: ((cen[k] - p) ** 2).sum()); taken[key] = k
    free = [k for k in np.argsort(dist) if k not in taken.values()]; order = {}
    for kk, k in zip([kk for kk in keys if kk not in pins], free): order[kk] = k
    order.update(taken)
    if lid == 'amber': order = {kk: i for i, kk in enumerate(keys)}   # (seed i is zone keys[i])
    for kk in keys:
        k = order[kk]; m = lb == k; idx = len(ZONES); ZL[cells[m, 0], cells[m, 1]] = idx
        ZONES.append({'land': lid, 'key': kk, 'level': LEVELS.get(kk, str(kk)), 'area': int(m.sum() * ST * ST),
                      'x': pos(cen[k])[0], 'z': pos(cen[k])[1], 'dist': float(dist[k])})
NZN = len(ZONES)
# Amber Reach's village stands in the meadows (zone 38), where the gate's road first reaches open ground: the interior point (108 m by the 6 m grid's distance, about 100 m true, from every zone border and the sea) nearest the Ashbed Gate
_zb = np.zeros(LL.shape, bool)
for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): _zb |= (shift(ZL, dz, dx, -1) != ZL)
_zin = chamfer(_zb | ~MAIN)
_g = next(G for G in GATES if G['name'] == ENTRY['amber']); _z38 = next(i for i, z in enumerate(ZONES) if z['land'] == 'amber' and z['key'] == 38)
_m = (ZL == _z38) & (_zin > 108)
HUBS['amber'] = pos(tuple(np.argwhere(_m)[np.argmin(np.hypot(GX[_m] - _g['x'], GZ[_m] - _g['z']))]))
assert next(z for z in ZONES if z['land'] == 'amber' and z['key'] == 37)['area'] > 0 and ZL[cell(_g['x'], _g['z'] + 20)] == next(i for i, z in enumerate(ZONES) if z['land'] == 'amber' and z['key'] == 37), 'the Ashbed Gate must stand in zone 37'

# ---------- 5. elevation: one level per zone, cliffs between zones ----------
# land: (lowest zone, highest zone, least step between neighbours, relief inside a zone (m), border ridge height)
ELEV = {'home': (3, 30, 5, 1.6, 26), 'vale': (6, 42, 6, 2.0, 28), 'sun': (26, 58, 6, 1.8, 0), 'hoar': (48, 84, 7, 2.2, 30),
        'grey': (45, 175, 16, 4.5, 0), 'gloam': (14, 70, 8, 2.4, 22), 'amber': (3, 42, 4, 1.5, 0)}
# Amber Reach's zones stand where the land's design puts them (the savanna slopes from the Sunscar's foot at the gate down to the delta; the Anvil and the Sunstair stand up out of it), not by the walk from the coast
AMBER_ELEV = {37: 34, 38: 28, 39: 20, 40: 24, 41: 36, 42: 22, 43: 24, 44: 9, 45: 42}
coast_d = chamfer(~MAIN)
adj = [set() for _ in range(NZN)]
for dz, dx in ((0, 1), (1, 0)):
    a = ZL; b = shift(ZL, dz, dx, -1); m = (a >= 0) & (b >= 0) & (a != b)
    for p, q in set(zip(a[m].tolist(), b[m].tolist())): adj[p].add(q); adj[q].add(p)
grey_d = chamfer(LL == LID['grey'])
E = np.zeros(NZN); GDIST = np.zeros(NZN, int)
for li, (lid, *_ ) in enumerate(LANDS):
    lo, hi, step, rel, rr = ELEV[lid]; ids = [i for i, z in enumerate(ZONES) if z['land'] == lid]; idset = set(ids)
    if lid == 'amber':
        for i in ids: E[i] = AMBER_ELEV[ZONES[i]['key']]
        continue
    # every zone drains: walk the zone graph from the zones on the coast; a zone stands at least a step above the zone it drains into
    coastal = [i for i in ids if (coast_d[ZL == i] < 14).mean() > 0.04]
    g = {i: 0 for i in coastal}; q = collections.deque(coastal)
    while q:
        i = q.popleft()
        for j in adj[i]:
            if j in idset and j not in g: g[j] = g[i] + 1; q.append(j)
    for i in ids: g.setdefault(i, max(g.values()) + 1)
    gmax = max(g.values()) or 1
    for i in sorted(ids, key=lambda i: (g[i], np.random.default_rng(i).random())):
        m = ZL == i; gp = np.clip(1 - np.median(grey_d[m]) / 700, 0, 1)
        e = lo + (hi - lo) * np.clip(0.75 * g[i] / gmax + 0.25 * gp + np.random.default_rng(i + 7).uniform(-0.12, 0.12), 0, 1)
        par = [E[j] for j in adj[i] if j in idset and g.get(j, 99) < g[i]]
        if par: e = max(e, min(par) + step)
        if lid == 'home' and ZONES[i]['key'] == 'shore': e = 2.5
        for _ in range(60):
            bad = [E[j] for j in adj[i] if j in idset and E[j] != 0 and abs(e - E[j]) < step]
            if not bad: break
            e = max(bad) + step
        E[i] = max(e, 1.5); GDIST[i] = g[i]
H0 = np.where(ZL >= 0, E[np.maximum(ZL, 0)], 0.0)
isl_in = chamfer(~ISLES)
for k, (base_, slope_, cap_) in {6: (2.2, 0.08, 4.5), 1: (2.5, 0.35, 14), 2: (3, 0.22, 45), 3: (1.4, 0.10, 3.5), 4: (3, 0.28, 38), 5: (4, 0.6, 20)}.items():
    m = ISLES & (ISLE_KIND == k); H0[m] = np.minimum(base_ + isl_in[m] * slope_, cap_)
H0[~LANDM] = -8
for i, z in enumerate(ZONES): z['elev'] = round(float(E[i]), 1)

# ---------- 6. roads, routed over the zone levels (they climb where the step is least, at the gates' passes) ----------
LB = np.zeros(LL.shape, bool)
for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): LB |= (shift(LL, dz, dx, -9) != LL) & (shift(LL, dz, dx, -9) >= 0)
GATEOK = np.zeros(LL.shape, bool)
for g in GATES:
    gz, gx = cell(g['x'], g['z']); GATEOK[max(0, gz - 6):gz + 7, max(0, gx - 6):gx + 7] = True
stepmag = np.zeros(LL.shape)
for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): stepmag = np.maximum(stepmag, np.abs(shift(H0, dz, dx, 0) - H0) * (shift(ZL, dz, dx, -1) >= 0))
rnoise = 1 + 1.6 * (fbm(GX * 0.012, GZ * 0.012, 51, 4) * 0.5 + 0.5) ** 2
RCOST = rnoise + stepmag * 0.9 + np.where(coast_d < 18, 4, 0) + np.where(LB & ~GATEOK, 1e6, 0)
ROAD = np.zeros(LL.shape, bool); ROADS = []
def add_road(path, kind, name):
    for c in path: ROAD[c] = True
    pts = [pos(c) for c in path]
    for _ in range(3):
        q = [pts[0]]
        for a, b in zip(pts, pts[1:]): q += [(a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25), (a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75)]
        pts = q + [pts[-1]]
    ROADS.append({'kind': kind, 'name': name, 'pts': [[round(p[0], 1), round(p[1], 1)] for p in pts[::4] + [pts[-1]]]})
def route(t, allowed, lid):
    # grown from this land's own network (its village and the roads already joined to it), never from a neighbour's road that ends at a gate
    D, P = dijkstra(allowed, [tuple(c) for c in np.argwhere(ROAD & (LL == LID[lid]) & allowed)], np.where(ROAD, 0.3, RCOST), tuple(t))
    path = [tuple(t)]
    while path[-1] in P: path.append(P[path[-1]])
    return path[::-1]
for lid in HUBS: ROAD[cell(*HUBS[lid])] = True
for g in GATES:
    sides = [g['a']] + ([g['b']] if isinstance(g['b'], str) else [])
    for s in sides: add_road(route(cell(g['x'], g['z']), (LL == LID[s]) | GATEOK, s), 'main', g['name'])

# ---------- 7. spots (subzones' places), bosses and doors ----------
BOSSES = {('home', 15): 'The Stone Circle', ('home', 'shore'): "Carapax's Beach (20)", ('vale', 20): 'Demon Gate', ('vale', 25): 'Foxfire Hollow',
          ('hoar', 26): "The Rimeking's Hall", ('hoar', 30): "The Wyrm's Nest", ('grey', 29): "The Gryphon Queen's Peak", ('grey', 32): "The Golem's Cavern",
          ('sun', 32): "The Guardian's Court", ('sun', 36): "The Wyrm's Pit", ('gloam', 35): 'The Sea Caves', ('gloam', 40): 'The Gloam Light',
          ('amber', 41): 'Anvil Rock', ('amber', 45): 'The Sunstair'}
DOORS = {'home': 6, 'vale': 22, 'hoar': 29, 'grey': 28, 'sun': 34, 'gloam': 38, 'amber': 40}
POIS = []; SPOTS = []
ZB = np.zeros(LL.shape, bool)
for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): ZB |= (shift(ZL, dz, dx, -1) != ZL)
ZIN = chamfer(ZB | ~MAIN)   # distance to the zone's edge
for i, z in enumerate(ZONES):
    m = ZL == i; cells = np.argwhere(m); idd = ZIN[m]; hx, hz = HUBS[z['land']]
    far = np.hypot(*(cells - np.array(cell(hx, hz))).T) * ST
    if (z['land'], z['key']) in BOSSES:
        bi = 90 if z['land'] == 'amber' else 34   # (Amber Reach's arenas stand well inland: the savanna's coast is a long beach ramp)
        sc = np.where(idd > bi, far, -1e9) if (idd > bi).any() else idd
        x, zz = pos(cells[np.argmax(sc)]); POIS.append({'kind': 'boss', 'name': BOSSES[(z['land'], z['key'])], 'land': z['land'], 'zone': z['key'], 'x': x, 'z': zz})
    if DOORS[z['land']] == z['key']:
        di = 80 if z['land'] == 'amber' else 40
        sc = np.where(idd > 26, -np.abs(idd - di), -1e9); x, zz = pos(cells[np.argmax(sc)])
        POIS.append({'kind': 'door', 'name': z['land'] + ' door', 'land': z['land'], 'zone': z['key'], 'x': x, 'z': zz})
    k = 2 if z['land'] == 'home' else 3; inner = cells[idd > 20] if (idd > 20).sum() > 10 else cells
    pick = [inner[np.argmax(ZIN[tuple(inner.T)])]]
    for _ in range(k - 1):
        dmin = np.min([np.hypot(*(inner - p).T) for p in pick], 0); pick.append(inner[np.argmax(dmin)])
    for j, c in enumerate(pick):
        x, zz = pos(c); SPOTS.append({'land': z['land'], 'zone': z['key'], 'n': j, 'x': x, 'z': zz, 'heart': j == 0})
# Amber Reach's two other places that stand on the atlas: the Broken Moot (the ruined council hall, the seventh stronghold of the raids) in the baobab groves, at the deepest point of zone 43,
# and the cape pier (the sealed landing for the boats to the Emberwake Isles) on the south coast of the Sunstair, 36-46 m inland of the water, the southernmost such point 120 m or more from the boss's arena
_zi = {z['key']: i for i, z in enumerate(ZONES) if z['land'] == 'amber'}
_m = ZL == _zi[43]; _x, _zz = pos(np.unravel_index(np.argmax(np.where(_m, ZIN, -1)), ZIN.shape))
POIS.append({'kind': 'raid', 'name': 'The Broken Moot', 'land': 'amber', 'zone': 43, 'x': _x, 'z': _zz})
_b = next(q for q in POIS if q['land'] == 'amber' and q['kind'] == 'boss' and q['zone'] == 45)
_m = (ZL == _zi[45]) & (coast_d > 36) & (coast_d < 46) & (np.hypot(GX - _b['x'], GZ - _b['z']) > 120)
_c = np.unravel_index(np.argmax(np.where(_m, GZ + GX * 1e-3, -1e9)), GZ.shape); _x, _zz = pos(_c)
POIS.append({'kind': 'pier', 'name': 'The Cape Pier', 'land': 'amber', 'zone': 45, 'x': _x, 'z': _zz})
for lid in HUBS:
    allowed = (LL == LID[lid]) | GATEOK
    for p in POIS:
        if p['land'] == lid: add_road(route(cell(p['x'], p['z']), allowed, lid), 'road', p['name'])
    for s in SPOTS:
        if s['land'] == lid and s['heart']: add_road(route(cell(s['x'], s['z']), allowed, lid), 'trail', str(s['zone']))

# zone entrances: each zone's way in is where the road from its village first crosses into it (a ramp through the cliff, a signpost)
ENTR = []
ZB8 = ZB.copy()
for dz, dx in ((1, 1), (1, -1), (-1, 1), (-1, -1)): ZB8 |= (shift(ZL, dz, dx, -1) != ZL)
for lid, (hx, hz) in HUBS.items():
    Dr, _ = dijkstra(ROAD & ((LL == LID[lid]) | GATEOK), [cell(hx, hz)], np.ones(LL.shape))
    for i, z in enumerate(ZONES):
        if z['land'] != lid: continue
        m = ZL == i; edge = m & ZB8 & ROAD & np.isfinite(Dr)
        if (m & (np.hypot(GX - hx, GZ - hz) < 12)).any(): z['entrance'] = 'the village'; continue
        if not edge.any(): z['entrance'] = None; continue
        c = tuple(np.argwhere(edge)[np.argmin(Dr[edge])]); x, zz = pos(c)
        z['entrance'] = [round(x, 1), round(zz, 1)]; z['road_from_village_m'] = int(Dr[c]); ENTR.append({'land': lid, 'zone': z['key'], 'x': x, 'z': zz})
print('zones without an entrance:', [ (z['land'], z['key']) for z in ZONES if z.get('entrance') is None])

# ---------- 8. the ground: cliffs between zones, ramps where a road crosses, relief inside, border ridges, the Greyfall River ----------
lid_of = np.array([LID[z['land']] for z in ZONES])
REL = np.zeros(LL.shape); RID = np.zeros(LL.shape)
for lid, (lo, hi, step, rel, rr) in ELEV.items():
    m = LL == LID[lid]; REL[m] = rel; RID[m] = rr
cliff = H0.astype(float)                             # in the game a cliff face is 2-4 m wide: any step of 5 m+ is too steep to walk (SLOPE_MAX 1.2)
ramp = blur(H0, 6)                                   # a step over ~60 m: a road's ramp
rc = blur((ROAD & (ZB | LB)).astype(float), 5); rampk = np.clip(rc * 14, 0, 1)
H = cliff * (1 - rampk) + ramp * rampk
relief = fbm(GX * 0.012, GZ * 0.012, 61, 4) * REL + fbm(GX * 0.04, GZ * 0.04, 62, 2) * REL * 0.25
H = H + np.where(MAIN, relief, 0)
# the Greyspine: crags inside its zones too (it is the extreme land)
rid = 1 - np.abs(fbm(GX * 0.008 + 5, GZ * 0.008 - 3, 63, 4)); H += np.where(LL == LID['grey'], (rid ** 3) * 26, 0)
# ridges along the borders between lands (not where a river or a gate is): mountains, highest next to the Greyspine
lbd = chamfer(LB); crest = (0.6 + 0.4 * (fbm(GX * 0.01, GZ * 0.01, 64, 3) * 0.5 + 0.5))
nearG = np.clip(1 - chamfer(LL == LID['grey']) / 300, 0, 1)
ridge = np.exp(-(lbd / 28) ** 2) * (RID + 30 * nearG) * crest
gated = np.clip(1 - chamfer(GATEOK) / 60, 0, 1); ridge *= 1 - gated
H += np.where(MAIN, ridge, 0)
# the Greyfall River runs along the Wildwood | Vale border (the old border river), the bridge crosses it
hv = np.zeros(LL.shape, bool)
for c in border('home', ['vale']): hv[tuple(c)] = True
hvd = chamfer(hv); H = np.where(hvd < 70, np.minimum(H, np.maximum(-1.5, 2 + (hvd - 14) * 0.25) + (H - 0) * np.clip((hvd - 14) / 56, 0, 1)), H)
H = np.where((hvd < 14) & MAIN, np.minimum(H, -1.2), H)
# the sea, and the shore easing down to it
coast_all = chamfer(~LANDM); ek = np.where(ISLES, np.clip(coast_all / 12, 0.3, 1), np.clip(coast_d / 30, 0.15, 1))
H = np.where(LANDM, np.maximum(H, 0.6) * ek + 0.6 * (1 - ek), -8 + np.clip(-sd / 40, 0, 1) * -10)

# ---------- 9. lakes: chosen basins (a low zone ringed by higher ones gets a lake at its heart), plus the Proving Isle ----------
LAKES = []
LAKE_ZONES = {'home': [2, 10], 'vale': [20, 22], 'hoar': [24, 28], 'gloam': [33]}
for i, z in enumerate(ZONES):
    if z['key'] in LAKE_ZONES.get(z['land'], []):
        s_ = next(s_ for s_ in SPOTS if s_['land'] == z['land'] and s_['zone'] == z['key'] and s_['n'] == 1)
        r = 22 + 0.12 * math.sqrt(z['area']); LAKES.append({'x': s_['x'], 'z': s_['z'], 'r': round(r), 'zone': z['key'], 'land': z['land']})
# the home village stays dry: no lake within 160 m of it, and the river keeps 120 m off (cost below)
hx_, hz_ = HUBS['home']
LAKES[:] = [L for L in LAKES if np.hypot(L['x'] - hx_, L['z'] - hz_) > 160 + L['r']]
# Amber Reach's Seven Pools (zone 39): waterholes of 22-34 m, as far from each other as the zone allows (the first at its deepest point), each 55 m or more from the zone's border and 110 m from the sea
_cand = np.argwhere((ZL == _zi[39]) & (ZIN > 55) & (coast_d > 110)); _pts = [_cand[np.argmax(ZIN[tuple(_cand.T)])]]
while len(_pts) < 7: _pts.append(_cand[np.argmax(np.min([np.hypot(*(_cand - p_).T) for p_ in _pts], 0))])
for p_, r_ in zip(_pts, (30, 24, 34, 26, 28, 22, 32)):
    x_, z_ = pos(p_); LAKES.append({'x': x_, 'z': z_, 'r': r_, 'zone': 39, 'land': 'amber'})
def lake_d(L):
    """distance-like field for a lake: stretched along a seeded direction, warped twice, lobed (no circles)"""
    r_ = np.random.default_rng(int(abs(L['x'] * 7 + L['z'])))
    a_ = r_.random() * np.pi; k_ = 1.3 + r_.random() * 0.9
    dx = GX - L['x'] + fbm(GX * 0.012 + L['x'], GZ * 0.012, 71, 3) * L['r'] * 0.9
    dz = GZ - L['z'] + fbm(GX * 0.012, GZ * 0.012 + L['z'], 72, 3) * L['r'] * 0.9
    u = dx * np.cos(a_) + dz * np.sin(a_); v = -dx * np.sin(a_) + dz * np.cos(a_)
    return np.hypot(u / k_, v * k_ ** 0.5) + fbm(GX * 0.04, GZ * 0.04 + L['x'], 73, 2) * L['r'] * 0.3
for L in LAKES:
    d = lake_d(L)
    lvl = float(np.median(H[d < L['r'] * 0.5])) - 2.2; L['level'] = round(lvl, 1); L['frozen'] = L['land'] == 'hoar'
    H = np.where(d < L['r'] * 1.4, np.minimum(H, lvl - 1.8 + np.clip((d - L['r']) / (L['r'] * 0.4), 0, 1) * 3.4), H)
LAKEW = np.full(H.shape, np.nan); LKID = np.full(H.shape, -1, int)
for li_, L in enumerate(LAKES):
    d = lake_d(L); mk_ = (d < L['r'] * 1.4) & (H < L['level']); LAKEW = np.where(mk_, L['level'], LAKEW); LKID = np.where(mk_, li_, LKID)

# ---------- 9b. the main rivers (docs/WORLD.md): born high, through a gate, down to the sea; they cut gorges where the zones step ----------
def gate_cell(name): g = next(G for G in GATES if G['name'] == name); return cell(g['x'], g['z'])
def high_near(lid, c, r):
    m = (LL == LID[lid]) & (np.hypot(GX - pos(c)[0], GZ - pos(c)[1]) < r); i = np.argmax(np.where(m, H, -1e9)); return np.unravel_index(i, H.shape)
fh = np.zeros(LL.shape, bool)
for c in border('home', ['grey', 'hoar']): fh[tuple(c)] = True
fz = next(z for z in ZONES if z['key'] == 'foothills')
sg = np.zeros(LL.shape, bool)
for c in border('sun', ['gloam']): sg[tuple(c)] = True
for c in border('gloam', ['sun']): sg[tuple(c)] = True
sgd = chamfer(sg); sgc = np.argwhere(sg)
jn = sgc[np.argmin(np.hypot(*(sgc - np.array(cell(*[np.mean([g['x'] for g in GATES if g['name'] in ('The River Pass', 'The Windswept Neck')]), np.mean([g['z'] for g in GATES if g['name'] in ('The River Pass', 'The Windswept Neck')])]))).T))]
fg = gate_cell('Frostgate Pass')
_asrc = cell(-690, 850)   # the seasonal river: the Ashbed above this spring is a dry riverbed (the gate's gravel, no water), from here it runs through the gate zone's south end and the delta to the south coast
MAINR = [('The Glass River (the Sunscar | Gloamhorn border)', high_near('grey', tuple(jn), 200), ['grey', 'sun', 'gloam'], {}),
         ('The Jade River (from the Reach\'s meltwater springs)', tuple(np.argwhere(LL == LID['vale'])[np.argmin(np.hypot(*(np.argwhere(LL == LID['vale']) - np.array(fg)).T))]), ['vale'], {'east': True}),
         ('The Wildwood River (from the Rootdeep springs, around the village to the sea)', cell(fz['x'], fz['z']), ['home'], {}),
         ('The Wet River (the seasonal river of Amber Reach, from the Ashbed to the Sedge Delta)', _asrc, ['amber'], {'via': [(-610, 990)], 'mouth': (-600, 1130)})]
RIVMAIN = np.zeros(LL.shape, bool); RIVERS = []
coastal_cell = LANDM & (coast_d < 9)
ZBD = chamfer(ZB8)   # rivers keep to the zones' borders (water runs at the foot of the cliffs between zones: a border you cannot just walk over)
for name, src, lands, opt in MAINR:
    allowed = np.isin(LL, [LID[l] for l in lands]) | (coastal_cell & np.isin(LL, [LID[l] for l in lands]))
    border_river = 'Gloamhorn border' in name
    rc = 1 + np.clip(H, 0, 300) / 60 + (sgd / 4 if border_river else np.where(LB & ~GATEOK, 1e6, 0) + np.where(lbd < 60, 3, 0) + ZBD / 5) + 1.0 * (fbm(GX * 0.009, GZ * 0.009, 81, 3) * 0.5 + 0.5) ** 2 + np.where(np.hypot(GX - hx_, GZ - hz_) < 120, 1e4, 0)
    legs = [tuple(src)] + [cell(*w) for w in opt.get('via', [])]
    path = []
    for p0, p1 in zip(legs, legs[1:]):
        D, P = dijkstra(allowed, [p0], rc, p1); seg_ = [p1]
        while seg_[-1] in P: seg_.append(P[seg_[-1]])
        path += seg_[::-1][:-1] if path else seg_[::-1]
    D, P = dijkstra(allowed, [legs[-1]], rc)
    ok = coastal_cell & allowed & np.isfinite(D)
    # the mouth: the far coast in the river's own direction (east for the Vale's), else the one across the land
    score = -np.hypot(GX - opt['mouth'][0], GZ - opt['mouth'][1]) if 'mouth' in opt else (GX - pos(legs[-1])[0]) * 3 - D * 0.15 if opt.get('east') else np.hypot(GX - pos(legs[0])[0], GZ - pos(legs[0])[1]) - D * 0.25
    t = np.unravel_index(np.argmax(np.where(ok, score, -1e9)), H.shape)
    seg_ = [tuple(t)]
    while seg_[-1] in P: seg_.append(P[seg_[-1]])
    path += seg_[::-1][1:] if path else seg_[::-1]
    pts = [pos(c) for c in path]
    for _ in range(4):   # Chaikin: a meandering bed, not grid steps
        q = [pts[0]]
        for p0, p1 in zip(pts, pts[1:]): q += [(p0[0] * .75 + p1[0] * .25, p0[1] * .75 + p1[1] * .25), (p0[0] * .25 + p1[0] * .75, p0[1] * .25 + p1[1] * .75)]
        pts = q + [pts[-1]]
    # meanders: push the bed sideways by a slow noise along its length (none at the source, the gate or the mouth)
    P_ = np.array(pts); seg = np.r_[0, np.cumsum(np.hypot(*np.diff(P_, axis=0).T))]; tan = np.gradient(P_, axis=0); tan /= np.linalg.norm(tan, axis=1)[:, None] + 1e-9
    nrm = np.stack([-tan[:, 1], tan[:, 0]], 1); amp = 34 * np.clip(seg / 80, 0, 1) * np.clip((seg[-1] - seg) / 80, 0, 1)
    gk = [np.hypot(*(P_ - np.array(pos(gate_cell(G['name'])))).T) for G in GATES]; amp *= np.clip(np.min(gk, 0) / 90, 0, 1)
    amp *= 0.3   # it follows a border (the lands' or the zones'): it may wander, not leave it
    off = (vnoise(seg * 0.011, seg * 0 + 3.3, 91) + 0.5 * vnoise(seg * 0.03, seg * 0 + 7.1, 92)) * amp
    pts = [tuple(p) for p in P_ + nrm * off[:, None]]
    bed = 1e9; n = len(pts)
    for k, (x, z) in enumerate(pts[::2]):
        c = cell(x, z); bed = max(-2.5, min(bed, H[c] - 1.2) - 0.01); wdt = 3 + 7 * (2 * k) / n; r = int((wdt + 10) / ST) + 1
        sl = (slice(max(0, c[0] - r), c[0] + r + 1), slice(max(0, c[1] - r), c[1] + r + 1))
        dd = np.hypot(GX[sl] - x, GZ[sl] - z)
        H[sl] = np.where(dd < wdt + 10, np.minimum(H[sl], bed + np.clip((dd - wdt) / 10, 0, 1) * 4), H[sl])
        RIVMAIN[sl] |= dd < wdt
    RIVERS.append({'pts': [[round(float(a), 1), round(float(b), 1)] for a, b in pts[::3]], 'name': name, 'len': int(seg[-1]), 'from': [round(v, 1) for v in pos(path[0])], 'to': [round(v, 1) for v in pos(path[-1])],
                   'drop': round(float(Hpre0[path[0]] - Hpre0[path[-1]]), 1) if False else None})
# the Greyfall River on the Wildwood | Vale border is water too
RIVMAIN |= (hvd < 12) & MAIN

# ---------- 10. rivers: rain grows with height (snow on the Greyspine), the flow drains down to the sea through a depression fill ----------
Hf = H.copy(); done = np.zeros(H.shape, bool); h = []
sea = ~LANDM
for c in map(tuple, np.argwhere(sea)): done[c] = True
edge = LANDM & (shift(sea, 1, 0, False) | shift(sea, -1, 0, False) | shift(sea, 0, 1, False) | shift(sea, 0, -1, False))
for c in map(tuple, np.argwhere(edge)): heapq.heappush(h, (Hf[c], c)); done[c] = True
down = np.full(H.shape + (2,), -1, int); EPS = 1e-5; POP = []
while h:
    e, c = heapq.heappop(h); POP.append(c)
    for dz, dx, w_ in NB8:
        n = (c[0] + dz, c[1] + dx)
        if 0 <= n[0] < NZ and 0 <= n[1] < NX and not done[n]:
            done[n] = True; Hf[n] = max(Hf[n], e + EPS); down[n] = c; heapq.heappush(h, (Hf[n], n))
# breach instead of fill: a hollow drains through a cut in its rim (a gorge, a stream through a cliff), only authored lakes hold water
Hpre = H.copy(); Hsrc = np.where(np.isnan(LAKEW), H, LAKEW)
order = np.argsort(-Hf, axis=None); Hb = Hsrc.ravel().copy(); dz_ = down[..., 0].ravel(); dx_ = down[..., 1].ravel()
for idx in order:
    tz = dz_[idx]
    if tz >= 0:
        t = tz * NX + dx_[idx]
        if Hb[idx] < Hb[t]: Hb[t] = Hb[idx]
Hb = Hb.reshape(H.shape); H = np.where(LANDM & np.isnan(LAKEW), np.minimum(H, Hb), H)
rain = (1 + (np.clip(H, 0, 200) / 45) ** 2 + 3 * (LL == LID['grey'])) * ~np.isin(LL, [LID['hoar'], LID['sun']])
rain[~LANDM] = 0
acc = rain.copy()
order = np.argsort(-Hf, axis=None)
dz_ = down[..., 0].ravel(); dx_ = down[..., 1].ravel(); accf = acc.ravel()
for idx in order:
    tz = dz_[idx]
    if tz >= 0: accf[tz * NX + dx_[idx]] += accf[idx]
ACC = accf.reshape(H.shape)
RIVER_T = 4500
RIV = (ACC > RIVER_T) & LANDM
# carve: a channel whose width grows with the flow; lakes stay lakes (a filled depression deeper than 1.2 m and larger than 2,000 m2 is kept)
width = np.where(RIV, 2 + np.sqrt(ACC / RIVER_T) * 1.6, 0)
riv_d = chamfer(RIV)
wd = blur(width, 2) * 3
H = np.where(LANDM & (riv_d < wd + 8), np.minimum(H, Hb - np.clip((wd + 8 - riv_d) / 8, 0, 1) * 1.8), H)
lk = ~np.isnan(LAKEW) & LANDM
WATER = lk | RIVMAIN | (LANDM & (riv_d < blur(width, 1) * 1.0 + 0.5) & RIV)

# ---------- 10b. island content: the bigger islands get a reason to sail or wade there (docs: optional, out of the level path) ----------
ISLAND_CONTENT = {   # kind: [(title, what), ...] handed out largest island first
    2: [('Lantern Isle', 'a drowned lighthouse and a wrecker\'s cave; rare ore'), ('Seal Rock', 'a walrus colony and a hunters\' summer camp'),
        ('The Long Holm', 'a crofter\'s ruin, a standing stone, fishing'), ('Whale Holm', 'a beached whale skeleton, a hermit\'s hut')],
    4: [("Warlord's Keep", 'the ruined island fortress: a named elite and a chest'), ('Shrine Isle', 'a torii in the shallows, a wandering monk'),
        ('Pearl Isle', 'pearl diving spots, a smugglers\' cove')],
    1: [('Gull Skerries', 'seabird nests, eggs to gather'), ('Black Skerry', 'a seal haul-out and a wreck')],
    3: [('The Long Sandbar', 'a beached ship, crabs, driftwood')]}
ISLAND_SPOTS = []
seen = np.zeros(LL.shape, bool); comps = []
for c in map(tuple, np.argwhere(ISLES & (ISLE_KIND != 6))):
    if seen[c]: continue
    comp = flood(ISLES & ~seen, c); seen |= comp; comps.append((int(comp.sum()), int(np.bincount(ISLE_KIND[comp]).argmax()), comp))
comps.sort(key=lambda t: -t[0])
for k, lst in ISLAND_CONTENT.items():
    big = [t for t in comps if t[1] == k][:len(lst)]
    for (n_, _, comp), (title, what) in zip(big, lst):
        ii = chamfer(~comp); c = np.unravel_index(np.argmax(np.where(comp, ii, -1)), comp.shape); x, z = pos(c)
        ISLAND_SPOTS.append({'name': title, 'what': what, 'kind': k, 'area': n_ * ST * ST, 'x': x, 'z': z})

# ---------- 11. stats ----------
gz_ = np.gradient(H, ST); slope = np.hypot(*gz_)
walk = slope < 1.2
stats = {'land_km2': {k: round(v / 1e6, 3) for k, v in LAND_AREA.items()}, 'river_cells': int(RIV.sum()), 'lakes': len(LAKES)}
for lid in HUBS:
    m = (LL == LID[lid]); zin = m & (ZIN > 12); zb = m & ZB
    stats[lid] = {'walkable_inside_zones_%': round(100 * float(walk[zin].mean()), 1), 'zone_edges_cliff_%': round(100 * float(np.mean([max(abs(H[c[0], c[1]] - H[min(c[0] + 1, NZ - 1), c[1]]), abs(H[c[0], c[1]] - H[c[0], min(c[1] + 1, NX - 1)])) >= 4 for c in np.argwhere(zb & ~LB)])), 1),
                  'elev': [round(float(np.percentile(H[m], p)), 0) for p in (5, 50, 95)]}
print(json.dumps(stats, indent=1))
if ARGS.out:
    os.makedirs(ARGS.out, exist_ok=True)
    np.savez_compressed(os.path.join(ARGS.out, 'world.npz'), IK=ISLE_KIND, H=H.astype(np.float32), LL=LL, ZL=ZL, RIV=RIV, ACC=ACC.astype(np.float32), LANDM=LANDM, ISLES=ISLES, AMBER=AMBER, ROAD=ROAD, lake=lk, WATER=WATER, ICE=lk & (LL == LID['hoar']))
    json.dump({'grid': [X0, X1, Z0, Z1, ST], 'lands': [l[0] for l in LANDS], 'gates': GATES, 'hubs': HUBS, 'zones': ZONES, 'pois': POIS, 'spots': SPOTS,
               'roads': ROADS, 'entrances': ENTR, 'lakes': LAKES, 'rivers': [{k: v for k, v in r.items() if k != 'pts'} for r in RIVERS], 'pvp': PVP, 'islands': ISLAND_SPOTS, 'stats': stats}, open(os.path.join(ARGS.out, 'world.json'), 'w'), indent=1)

# ---------- 12. the bake: what the game reads (src/shared/world-atlas.js) ----------
# A grid of nodes every 8 m over the canvas (the game interpolates between nodes); the smooth fields (target height, water level) every 16 m.
# Layers are delta-coded against the cell above, zig-zag varints, zero-runs: see wa_enc and decodeLayer in src/shared/world-atlas.js.
LAND_IDS = ['home', 'vale', 'hoar', 'grey', 'sun', 'gloam', 'amber', 'isles']
PROTO_TO_ID = {LID[k]: LAND_IDS.index(k) for k in LID}; PROTO_TO_ID[6] = 6
def edt(src, cap=500.0):
    """exact Euclidean distance (m) from every cell centre to the nearest True cell of src, capped (the layout's chamfer is octagonal: its isolines show as straight diagonals in the ground)"""
    R = int(cap / ST) + 1; big = float(R + 2)
    g = np.where(src, 0.0, big)
    for i in range(1, NZ): g[i] = np.minimum(g[i], g[i - 1] + 1)
    for i in range(NZ - 2, -1, -1): g[i] = np.minimum(g[i], g[i + 1] + 1)
    g2 = np.minimum(g, big) ** 2; d2 = g2.copy()
    for dx in range(1, R + 1):
        sh = np.full_like(g2, big * big); sh[:, dx:] = g2[:, :-dx]; d2 = np.minimum(d2, sh + dx * dx)   # (the column dx to the left ...
        sh = np.full_like(g2, big * big); sh[:, :-dx] = g2[:, dx:]; d2 = np.minimum(d2, sh + dx * dx)   # ... and to the right)
    return np.minimum(np.sqrt(d2) * ST, cap)
def smask_blur(a, m, r):
    """blur of a over the cells where m holds only (normalised, so the sea does not pull the land down)"""
    num = blur(np.where(m, a, 0.0), r); den = blur(m.astype(float), r)
    return np.where(den > 0.02, num / np.maximum(den, 1e-6), np.nan)
def fill_nearest(a, rounds):
    """NaN cells take the mean of their finite neighbours, round after round (a nearest-value spread)"""
    a = a.copy()
    for _ in range(rounds):
        nanm = np.isnan(a)
        if not nanm.any(): break
        acc = np.zeros(a.shape); cnt = np.zeros(a.shape)
        for dz, dx, _w in NB8:
            nb = shift(a, dz, dx, np.nan); ok = ~np.isnan(nb); acc += np.where(ok, nb, 0); cnt += ok
        fill = nanm & (cnt > 0); a[fill] = acc[fill] / cnt[fill]
    return a

# an entrance that the lakes (placed after the roads) drowned steps to the nearest dry cell, at most 60 m away (a road may still cross a lake: the ground makes it a ford)
for e in ENTR:
    c = cell(e['x'], e['z'])
    if lk[c]:
        best = None
        for dz in range(-10, 11):
            for dx in range(-10, 11):
                n = (c[0] + dz, c[1] + dx)
                if 0 <= n[0] < NZ and 0 <= n[1] < NX and LANDM[n] and not lk[n] and not WATER[n] and LL[n] == LL[c] and (best is None or dz * dz + dx * dx < best[0]): best = (dz * dz + dx * dx, n)
        if best: e['x'], e['z'] = pos(best[1])
# land id everywhere (the sea and the islands take the nearest land: the game's inVale / landAt are total functions)
LIDG = np.vectorize(lambda v: PROTO_TO_ID.get(int(v), -1))(LL); LIDG = np.where(LL >= 0, LIDG, -1)
LIDG[AMBER] = 6
for _ in range(700):
    if not (LIDG < 0).any(): break
    for dz, dx, _w in NB8[:4]:
        nb = shift(LIDG, dz, dx, -1); fix = (LIDG < 0) & (nb >= 0); LIDG[fix] = nb[fix]
LIDG = np.maximum(LIDG, 0)
# target height: the zone levels (H0) smoothed over ~100 m, over land only
LANDALL = LANDM
T6 = smask_blur(H0, LANDALL, 16)
T6 = np.where(np.isnan(T6), np.nan, T6)
T6 = fill_nearest(T6, 80); T6 = np.where(np.isnan(T6), 0.0, T6)
CD0 = blur(np.where(LANDM, edt(~LANDM, 400) - ST / 2, -(edt(LANDM, 400) - ST / 2)), 1)
_W6 = np.where(np.isin(LIDG, [3, 5]), 75.0, 100.0) + 1.1 * np.maximum(T6 - 25, 0); _c6 = np.maximum(CD0, 0)   # the ground as the shore will shape it (src/shared/world-atlas-ground.js): lakes and rivers are levelled against THIS, not the raw target
def _ss(a, b_, x): t = np.clip((x - a) / (b_ - a), 0, 1); return t * t * (3 - 2 * t)
TC6 = np.where(CD0 > 0, 0.35 + 2.4 * _ss(0, 60, _c6) + (T6 - (0.35 + 2.4 * _ss(0, 60, _c6))) * _ss(0, _W6, _c6), 0.35)
# the coast: signed distance (m, inland positive), smoothed
CD6 = blur(np.where(LANDM, edt(~LANDM, 400) - ST / 2, -(edt(LANDM, 400) - ST / 2)), 1)
# distance to the zones' borders (both sides), to the lands' borders and to the roads
ZBALL = np.zeros(LL.shape, bool)
for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
    nb = shift(ZL, dz, dx, -1); ZBALL |= (nb != ZL) & (nb >= 0) & (ZL >= 0)
BD6 = edt(ZBALL); LD6 = edt(LB)
RD_IMG = Image.new('L', (NX, NZ), 0); _dr = ImageDraw.Draw(RD_IMG)
for rd in ROADS: _dr.line([((x - X0) / ST, (z - Z0) / ST) for x, z in rd['pts']], fill=255, width=1)
RD6 = edt(np.array(RD_IMG) > 0)
AMASK = np.zeros(LL.shape, bool)   # every anchor: the ground keeps clear of landform round it (gentle clearings in the extreme lands)
for _p in list(HUBS.values()) + [(g['x'], g['z']) for g in GATES] + [(p['x'], p['z']) for p in POIS] + [(e['x'], e['z']) for e in ENTR] + [(q['x'], q['z']) for q in SPOTS] + [(q['x'], q['z']) for q in ISLAND_SPOTS] + [(PVP['x'], PVP['z'])]:
    AMASK[cell(*_p)] = True
AD6 = edt(AMASK, 300)
# water: lakes (flat surface), rivers (a surface that only ever falls downstream), their signed distance
LAKE_LEVEL = {}
for li_, L in enumerate(LAKES):
    m_ = LKID == li_; ring_ = edt(m_, 40) < 30   # the lake stands below the lowest ground round it (so its bank holds all the way round)
    LAKE_LEVEL[li_] = float(np.percentile(TC6[ring_], 4)) - 1.0 if m_.any() else 0.0
    L['level'] = round(LAKE_LEVEL[li_], 1)
RIVCELL = (RIV | RIVMAIN) & LANDM & np.isnan(LAKEW)
hw = np.where(RIVMAIN, 5.0, np.where(RIV, np.minimum(2.2 + 1.0 * np.sqrt(np.maximum(ACC, 0) / RIVER_T), 9.0), 0.0))
for _ in range(2):   # the half-width spreads to the cells beside the river
    hw = np.maximum(hw, np.maximum.reduce([shift(hw, dz, dx, 0.0) for dz, dx, _w in NB8]) * 0.95)
dc = edt(RIVCELL, 300); SDR = dc - hw
LAKEM = (LKID >= 0) & LANDM
SDL = np.where(LAKEM, -(edt(~LAKEM, 300) - ST / 2), edt(LAKEM, 300) - ST / 2)
WD6 = np.where(LANDM, np.minimum(SDR, SDL), 400.0)
WD6 = np.clip(WD6, -60, 400)
S0 = np.maximum(TC6 - 1.5, 0.3); S0 = np.minimum(S0, 0.3 + 0.35 * np.maximum(CD6, 0))   # (a river falls to the sea over its last few hundred metres at most this steeply)
SR = S0.copy(); dzf = down[..., 0]; dxf = down[..., 1]
for c in POP:
    t_ = (dzf[c], dxf[c])
    if t_[0] >= 0 and SR[c] < SR[t_]: SR[c] = SR[t_]
WS6 = np.full(H.shape, np.nan)
WS6[RIVCELL] = np.clip(np.minimum(SR, TC6 - 1.5), 0.3, None)[RIVCELL]   # (never perched above the ground it runs through)
for li_ in LAKE_LEVEL: WS6[LKID == li_] = LAKE_LEVEL[li_]
WS6 = fill_nearest(WS6, 45); WS6 = np.where(np.isnan(WS6), 0.0, WS6)
WS6 = np.where(LANDM, blur(WS6, 2), 0.0)
WTYPE6 = np.where(LAKEM, np.where(LL == LID['hoar'], 3, 1), np.where(RIVCELL, 2, 0))

def bilin(a, xs_, zs_):
    """a sampled at the world points (xs_ across, zs_ down) by bilinear interpolation (a: cell centres of the 6 m grid)"""
    fx = np.clip((xs_ - X0) / ST - 0.5, 0, NX - 1.001); fz = np.clip((zs_ - Z0) / ST - 0.5, 0, NZ - 1.001)
    ix, iz = fx.astype(int), fz.astype(int); tx, tz = fx - ix, fz - iz
    return (a[iz, ix] * (1 - tx) + a[iz, ix + 1] * tx) * (1 - tz) + (a[iz + 1, ix] * (1 - tx) + a[iz + 1, ix + 1] * tx) * tz
def near(a, xs_, zs_):
    iz = np.clip(((zs_ - Z0) / ST).astype(int), 0, NZ - 1); ix = np.clip(((xs_ - X0) / ST).astype(int), 0, NX - 1); return a[iz, ix]
BS = 8; BNX = int(math.ceil((X1 - X0) / BS)) + 1; BNZ = int(math.ceil((Z1 - Z0) / BS)) + 1
def nodes(step):
    nx_, nz_ = int(math.ceil((X1 - X0) / step)) + 1, int(math.ceil((Z1 - Z0) / step)) + 1
    return np.meshgrid(X0 + np.arange(nx_) * step, Z0 + np.arange(nz_) * step)
def zz(v): return (v << 1) if v >= 0 else ((-v << 1) - 1)
def wa_enc(a):
    """int array -> base64: row-major, each value minus the one above it (the first row: minus the one on its left), zig-zag varints, a zero run is 0 + varint count"""
    a = np.asarray(a, dtype=np.int64); d = a.copy(); d[1:] = a[1:] - a[:-1]; d[0, 1:] = a[0, 1:] - a[0, :-1]
    out = bytearray(); flat = d.ravel().tolist(); i = 0; n = len(flat)
    def put(v):
        while v >= 128: out.append((v & 127) | 128); v >>= 7
        out.append(v)
    while i < n:
        v = flat[i]
        if v == 0:
            j = i
            while j < n and flat[j] == 0: j += 1
            out.append(0); put(j - i); i = j
        else: put(zz(v)); i += 1
    return base64.b64encode(bytes(out)).decode()
X8, Z8 = nodes(8); X16, Z16 = nodes(16)
RAW = {   # (the grid's step, the integer array): encoded after the Emberwake Isles' strip is appended (section 13)
    'own':   (8, near(LIDG, X8, Z8)),
    'flags': (8, (~near(LANDM, X8, Z8)).astype(int) + 2 * near(ISLE_KIND, X8, Z8) + 16 * near(WTYPE6, X8, Z8)),
    'zone':  (8, near(ZL, X8, Z8) + 1),
    'cdist': (16, np.round(bilin(CD6, X16, Z16) * 2)),
    'bdist': (16, np.round(np.minimum(bilin(BD6, X16, Z16), 500) / 2)),
    'ldist': (16, np.round(np.minimum(bilin(LD6, X16, Z16), 500) / 2)),
    'adist': (16, np.round(np.minimum(bilin(AD6, X16, Z16), 500) / 2)),
    'rdist': (16, np.round(np.minimum(bilin(RD6, X16, Z16), 500) / 2)),
    'wdist': (8, np.round(bilin(WD6, X8, Z8) * 2)),
    'target': (16, np.round(bilin(T6, X16, Z16) * 16)),
    'wsurf': (16, np.round(bilin(WS6, X16, Z16) * 16)),
}
OLD_LANDM8 = near(LANDM, X8, Z8)   # (the old canvas's land at the 8 m nodes: the strip's distances see the Amber Reach's south coast)

# ---------- 13. the Emberwake Isles (docs/EMBERWAKE.md; the eighth land): a strip of sea and islands APPENDED south of the old canvas ----------
# The six lands' layout above is untouched (the canvas Z1 stays 1180 for it); the bake adds rows below it, so every old node keeps its value and the strip is new data only.
ISL_Z1 = 2100.0                      # the world's new south edge (WZ1)
ISL_ROWS8 = 405                      # 8 m node rows (z up to Z0 + 404 * 8 = 2112); 203 rows every 16 m
ISL_ID = 7
ISL_ISLANDS = [   # name, centre x, z, radii, turn (rad): west to east, by the boats from the Amber Reach's southern cape
    ('coralhaven', -1100, 1590, 215, 190, 0.3), ('jungle', -560, 1650, 235, 200, -0.2), ('highland', -20, 1620, 225, 205, 0.1),
    ('volcano', 650, 1700, 255, 245, 0.0)]   # the volcano isle is a separate island with no way on foot yet (the boats, a later pass); its interior is reserved
ISL_BARS = [((-905, 1600), (-790, 1640)), ((-335, 1650), (-235, 1630))]   # the reef causeway Coralhaven | Jungle and the isthmus Jungle | Highland (40 m wide, walkable)
ISL_ZONE_SEEDS = [(42, 'coralhaven', -1140, 1625, 3.0), (43, 'coralhaven', -1010, 1655, 4.0), (44, 'jungle', -670, 1670, 12.0), (45, 'jungle', -560, 1560, 18.0),
                  (46, 'jungle', -430, 1715, 9.0), (47, 'highland', -70, 1650, 34.0), (48, 'highland', 70, 1590, 50.0)]   # key, island, x, z, elevation (m)
ISL_HUB = (-1105.0, 1530.0)          # Coralhaven, on the northern shore of the first island (the boats land here)
def _ex_edt(src, step, cap):
    """exact Euclidean distance (m) to the nearest True cell, on a grid of `step` m (edt() above, for any shape)"""
    R = int(cap / step) + 1; big = float(R + 2); g = np.where(src, 0.0, big)
    for i in range(1, g.shape[0]): g[i] = np.minimum(g[i], g[i - 1] + 1)
    for i in range(g.shape[0] - 2, -1, -1): g[i] = np.minimum(g[i], g[i + 1] + 1)
    g2 = np.minimum(g, big) ** 2; d2 = g2.copy()
    for dx in range(1, R + 1):
        sh = np.full_like(g2, big * big); sh[:, dx:] = g2[:, :-dx]; d2 = np.minimum(d2, sh + dx * dx)
        sh = np.full_like(g2, big * big); sh[:, :-dx] = g2[:, dx:]; d2 = np.minimum(d2, sh + dx * dx)
    return np.minimum(np.sqrt(d2) * step, cap)
NX8N, NZ8N = X8.shape[1], ISL_ROWS8
XN8, ZN8 = np.meshgrid(X0 + np.arange(NX8N) * 8.0, Z0 + np.arange(NZ8N) * 8.0)
OLDR = X8.shape[0]                   # the old canvas's rows
def _isl_field(i):
    nm, cx, cz, rx, rz, th = ISL_ISLANDS[i]; c, s_ = math.cos(th), math.sin(th)
    u = ((XN8 - cx) * c + (ZN8 - cz) * s_) / rx; v = (-(XN8 - cx) * s_ + (ZN8 - cz) * c) / rz
    return 1 - np.hypot(u, v) + fbm(XN8 * 0.015 + i * 7, ZN8 * 0.015 - i * 3, 70 + i, 4) * 0.36 + fbm(XN8 * 0.045, ZN8 * 0.045 + i, 80 + i, 2) * 0.06
ISL_F = [_isl_field(i) for i in range(len(ISL_ISLANDS))]
ISL_OWN = np.full(XN8.shape, -1, int)
for i, f in enumerate(ISL_F): ISL_OWN = np.where((f > 0) & (ISL_OWN < 0), i, ISL_OWN)
ISL_LAND = ISL_OWN >= 0
def _capsule(a, b, hw):
    ax, az = a; bx, bz = b; dx, dz = bx - ax, bz - az; L2 = dx * dx + dz * dz
    t = np.clip(((XN8 - ax) * dx + (ZN8 - az) * dz) / L2, 0, 1); d = np.hypot(XN8 - (ax + t * dx), ZN8 - (az + t * dz))
    return d - (hw + fbm(XN8 * 0.05, ZN8 * 0.05, 90, 2) * 3)
ISL_BAR = np.zeros(XN8.shape, bool)
for a_, b_ in ISL_BARS: ISL_BAR |= _capsule(a_, b_, 20.0) < 0
ISL_LAND = ISL_LAND | ISL_BAR
ISL_LAND[:OLDR + 2] = False          # (nothing of the strip within 16 m of the old canvas: the seam is sea)
FULL_LAND = np.concatenate([OLD_LANDM8, np.zeros((NZ8N - OLDR, NX8N), bool)], 0) | ISL_LAND   # the whole canvas: the old land and the isles
# the zones: the nearest seed on the same island (the bars belong to the nearer island's zone)
ISL_ZL = np.full(XN8.shape, -1, int)
_WX = XN8 + fbm(XN8 * 0.011 + 50, ZN8 * 0.011 - 30, 143, 3) * 42 + fbm(XN8 * 0.03, ZN8 * 0.03 + 8, 144, 2) * 14   # (the zone borders wander, as the other lands' do)
_WZ = ZN8 + fbm(XN8 * 0.011 - 20, ZN8 * 0.011 + 60, 145, 3) * 42 + fbm(XN8 * 0.03 + 5, ZN8 * 0.03, 146, 2) * 14
_dd = np.stack([np.hypot(_WX - sx, _WZ - sz) for _, _, sx, sz, _ in ISL_ZONE_SEEDS], 0)
_isl_of = np.array([[n[0] for n in ISL_ISLANDS].index(isl) for _, isl, _, _, _ in ISL_ZONE_SEEDS])
_cand = np.where(ISL_OWN[None] == _isl_of[:, None, None], _dd, 1e9)
_zk = np.argmin(_cand, 0); _ok = np.min(_cand, 0) < 1e8
_bar_only = ISL_BAR & ~(ISL_OWN >= 0); _zk_bar = np.argmin(_dd, 0)
ISL_ZL = np.where(_ok, _zk, np.where(_bar_only, _zk_bar, -1))
ISL_ZL = np.where(ISL_LAND, ISL_ZL, -1)
ISL_ELEV = np.array([z[4] for z in ISL_ZONE_SEEDS])
_vol = ISL_OWN == [n[0] for n in ISL_ISLANDS].index('volcano')
# the target height: each zone's elevation blurred over the land only; the volcano isle a low placeholder dome (reserved)
_E = np.where(ISL_ZL >= 0, ISL_ELEV[np.maximum(ISL_ZL, 0)], np.nan)
_E = np.where(_vol, 30.0, _E)
_Em = np.where(ISL_LAND & ~np.isnan(_E), _E, 0.0)
_num = blur(_Em, 8); _den = blur((ISL_LAND & ~np.isnan(_E)).astype(float), 8)
ISL_T = np.where(_den > 0.02, _num / np.maximum(_den, 1e-6), 0.0)
ISL_T = np.where(ISL_LAND, ISL_T, 0.0)
_cd8 = blur(np.where(FULL_LAND, _ex_edt(~FULL_LAND, 8.0, 400) - 4.0, -(_ex_edt(FULL_LAND, 8.0, 400) - 4.0)), 1)
# anchors: Coralhaven's hub, each zone's entrance (towards the hub / the previous zone), the boats' landing
ISL_ANCH = [ISL_HUB]
def _ix(x, z): return int(round((z - Z0) / 8.0)), int(round((x - X0) / 8.0))
_amask = np.zeros(XN8.shape, bool)
for _p in ISL_ANCH + [(z[2], z[3]) for z in ISL_ZONE_SEEDS]: _amask[_ix(*_p)] = True
_ad8 = _ex_edt(_amask, 8.0, 300)
_zb8 = np.zeros(XN8.shape, bool)
for dz, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
    _nb = np.full(XN8.shape, -2); _nb[max(dz, 0):XN8.shape[0] + min(dz, 0), max(dx, 0):XN8.shape[1] + min(dx, 0)] = ISL_ZL[max(-dz, 0):XN8.shape[0] + min(-dz, 0), max(-dx, 0):XN8.shape[1] + min(-dx, 0)]
    _zb8 |= (_nb != ISL_ZL) & (_nb >= 0) & (ISL_ZL >= 0)
_bd8 = _ex_edt(_zb8, 8.0, 500)
ISL_ZONES = []
for k, (key, isl, sx, sz, el) in enumerate(ISL_ZONE_SEEDS):
    m = ISL_ZL == k; cells = np.argwhere(m)
    zi, xi = cells.mean(0); cx_, cz_ = X0 + xi * 8.0, Z0 + zi * 8.0
    j = np.argmin(((cells - np.array([zi, xi])) ** 2).sum(1)); cz_, cx_ = Z0 + cells[j][0] * 8.0, X0 + cells[j][1] * 8.0   # (a centre that is inside the zone)
    ISL_ZONES.append({'land': 'isles', 'key': key, 'level': str(key), 'area': int(m.sum() * 64), 'x': float(cx_), 'z': float(cz_), 'elev': float(el), 'entrance': None})
for z in ISL_ZONES: z['entrance'] = [z['x'], z['z']]
ISL_ENTR = [{'land': 'isles', 'zone': z['key'], 'x': z['x'], 'z': z['z']} for z in ISL_ZONES]
assert all(z['area'] > 20000 for z in ISL_ZONES), [z['area'] for z in ISL_ZONES]
# the Isles' places (W3): the two world bosses' arenas (Ocelo in the Overgrown Plaza, Tuila on the Drowned Strait's shore), the Cenote's dungeon door in the Jungle Edge and the Seven Gates stronghold on Condor Heights.
# Pinned by hand: each is the flattest ground (a 46 m ring varies under 6 m) at least 70 m from the shore in its zone, and the four stand 120 m or more apart (checked by tools/emberwake-smoke.js).
POIS += [{'kind': 'boss', 'name': "Ocelo's Plaza", 'land': 'isles', 'zone': 45, 'x': -564.0, 'z': 1570.0},
         {'kind': 'boss', 'name': "The Drowned Strait", 'land': 'isles', 'zone': 46, 'x': -516.0, 'z': 1690.0},
         {'kind': 'door', 'name': 'isles door', 'land': 'isles', 'zone': 44, 'x': -648.0, 'z': 1702.0},
         {'kind': 'raid', 'name': 'The Seven Gates', 'land': 'isles', 'zone': 48, 'x': 48.0, 'z': 1642.0}]
def _strip(arr8, old, step):
    """the old rows (kept as they are) + the strip's rows, sampled every `step` m from the 8 m field"""
    s_ = step // 8; new = arr8[::s_, ::s_]; nr = (ISL_ROWS8 - 1) // s_ + 1; new = new[:nr]
    return np.concatenate([old, new[old.shape[0]:]], 0)
RAW['own'] = (8, np.concatenate([RAW['own'][1], np.full((NZ8N - OLDR, NX8N), ISL_ID)], 0))
RAW['flags'] = (8, np.concatenate([RAW['flags'][1], (~ISL_LAND[OLDR:]).astype(int)], 0))
RAW['zone'] = (8, np.concatenate([RAW['zone'][1], np.where(ISL_ZL[OLDR:] >= 0, ISL_ZL[OLDR:] + NZN + 1, 0)], 0))
RAW['wdist'] = (8, np.concatenate([RAW['wdist'][1], np.full((NZ8N - OLDR, NX8N), 800)], 0))
RAW['cdist'] = (16, _strip(np.round(_cd8 * 2), RAW['cdist'][1], 16))
RAW['bdist'] = (16, _strip(np.round(np.minimum(_bd8, 500) / 2), RAW['bdist'][1], 16))
RAW['ldist'] = (16, _strip(np.full(XN8.shape, 250.0), RAW['ldist'][1], 16))
RAW['adist'] = (16, _strip(np.round(np.minimum(_ad8, 500) / 2), RAW['adist'][1], 16))
RAW['rdist'] = (16, _strip(np.full(XN8.shape, 250.0), RAW['rdist'][1], 16))
RAW['target'] = (16, _strip(np.round(ISL_T * 16), RAW['target'][1], 16))
RAW['wsurf'] = (16, _strip(np.zeros(XN8.shape), RAW['wsurf'][1], 16))
ZONES_ALL = ZONES + ISL_ZONES
print('isles:', {z['key']: z['area'] // 10000 for z in ISL_ZONES}, 'ha;', 'land', int(ISL_LAND.sum() * 64 / 10000), 'ha')
LAYERS = {k: (v[1].shape, wa_enc(v[1])) for k, v in RAW.items()}
R1 = lambda v: round(float(v), 1)
ANCH = {
    'lands': LAND_IDS,
    'lis': {k: LAND_IDS.index(k) for k in list(LID) + ['isles']},
    'hubs': {k: [R1(v[0]), R1(v[1])] for k, v in {**HUBS, 'isles': ISL_HUB}.items()},
    'gates': [{'a': g['a'], 'b': g['b'] if isinstance(g['b'], str) else 'amber', 'name': g['name'], 'kind': g['kind'], 'x': R1(g['x']), 'z': R1(g['z'])} for g in GATES],
    'zones': [{'id': i, 'land': z['land'], 'key': z['key'], 'level': z['level'], 'x': R1(z['x']), 'z': R1(z['z']), 'elev': z['elev'], 'area': z['area'],
               'entrance': z.get('entrance') if not isinstance(z.get('entrance'), list) else [R1(z['entrance'][0]), R1(z['entrance'][1])]} for i, z in enumerate(ZONES_ALL)],
    'pois': [{'kind': p['kind'], 'name': p['name'], 'land': p['land'], 'zone': p['zone'], 'x': R1(p['x']), 'z': R1(p['z'])} for p in POIS],
    'entrances': [{'land': e['land'], 'zone': e['zone'], 'x': R1(e['x']), 'z': R1(e['z'])} for e in ENTR + ISL_ENTR],
    'spots': [{'land': s['land'], 'zone': s['zone'], 'n': s['n'], 'x': R1(s['x']), 'z': R1(s['z']), 'heart': bool(s['heart'])} for s in SPOTS],
    'islands': [{'name': s['name'], 'what': s['what'], 'kind': s['kind'], 'x': R1(s['x']), 'z': R1(s['z']), 'area': int(s['area'])} for s in ISLAND_SPOTS],
    'pvp': PVP,
    'lakes': [{'x': L['x'], 'z': L['z'], 'r': L['r'], 'land': L['land'], 'zone': L['zone'], 'level': L['level'], 'frozen': bool(L['frozen'])} for L in LAKES],
    'rivers': [{'name': r['name'], 'len': r['len'], 'pts': [[round(a), round(b)] for a, b in r['pts']]} for r in RIVERS],
    'roads': [{'kind': r['kind'], 'name': r['name'], 'pts': [[round(a), round(b)] for a, b in r['pts']]} for r in ROADS],
}
if ARGS.js:
    meta = {'x0': X0, 'x1': X1, 'z0': Z0, 'z1': ISL_Z1, 'step': BS, 'nx': int(X8.shape[1]), 'nz': NZ8N, 'nx16': int(X16.shape[1]), 'nz16': (NZ8N - 1) // 2 + 1}
    L_ = {k: v[1] for k, v in LAYERS.items()}
    body = 'const WA_META=' + json.dumps(meta) + ';\nconst WA_ANCHORS=' + json.dumps(ANCH, separators=(',', ':')) + ';\nconst WA_LAYERS=' + json.dumps(L_, separators=(',', ':')) + ';\n'
    open(ARGS.js, 'w').write('//@ Baked atlas of Eldmere (generated by docs/world-atlas.py --js: do not edit): the 8 m grid of land, zone, coast, borders, roads, water and target height, and the anchors.\n' + body)
    print('wrote', ARGS.js, len(body) // 1024, 'KB;', {k: len(v) // 1024 for k, v in L_.items()}, 'anchors', len(json.dumps(ANCH)) // 1024)
