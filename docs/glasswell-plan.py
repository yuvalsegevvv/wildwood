# Draws docs/glasswell-plan.svg (Glasswell, the oasis city of the Sunscar: docs/DESERT-CITY.md). Run: python3 docs/glasswell-plan.py docs/glasswell-plan.svg
# Not part of the game build, but it is the SOURCE of the game's layout: `--js src/shared/sunscar.js` writes the data the model is built from.
# Edit the data (gates, roads, river, lake, BUILDINGS, RESERVED) and re-run; the numbers in DESERT-CITY.md come from here
# (the script prints them). Homes are not listed by hand: they fill the floor on a jittered grid (seeded, so the plan is the same every run).
# Frame: metres, origin = the Old Citadel's centre = the crater's centre, +x east, +z south (north is up, as in the game).
# Bearings follow the game's convention: at(a, r) = (sin a * r, cos a * r), so 0 = south, pi/2 = east, pi = north. A building's `rot` is its
# door's bearing seen from the middle: its front looks along (-sin rot, -cos rot) (CLAUDE.md, "Rotations"), exactly like H.rot in village-layout.js.
import math, os, random, sys, collections

OUT = sys.argv[1]
JS = sys.argv[sys.argv.index('--js') + 1] if '--js' in sys.argv else None   # also write the game's layout data (src/shared/sunscar.js)
S = 3.6                      # pixels per metre
CX, CY = 620, 668            # where the origin lands on the page
W, H = 1760, 1330
PI = math.pi

R_FLOOR, R_CREST, R_FOOT = 80, 110, 140   # the Bowl: walkable floor, rim crest, where the rim's skirt meets the plateau
GATE_W = 14                               # width of a crack through the rim at the floor (>= 4 cells of the server's 4 m grid)

def P(x, z): return (CX + x * S, CY + z * S)
def at(a, r): return (math.sin(a) * r, math.cos(a) * r)
def gpt(a, r, lat=0): return (math.sin(a) * r + math.cos(a) * lat, math.cos(a) * r - math.sin(a) * lat)   # a point on a gate's axis, lat m to the side
def rot_to(x, z, tx, tz): return math.atan2(-(tx - x), -(tz - z))
def rect_pts(x, z, w, d, rot):
    c, s = math.cos(rot), math.sin(rot)
    return [(x + lx * c + lz * s, z - lx * s + lz * c) for lx, lz in ((-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2))]
def seg_d(p, a, b):
    ax, az = a; bx, bz = b; px, pz = p; dx, dz = bx - ax, bz - az; L2 = dx*dx + dz*dz or 1
    t = max(0, min(1, ((px-ax)*dx + (pz-az)*dz) / L2)); return math.hypot(px-ax-t*dx, pz-az-t*dz), (ax+t*dx, az+t*dz)
def line_d(p, pts):
    best = (1e9, None)
    for i in range(len(pts)-1):
        r = seg_d(p, pts[i], pts[i+1])
        if r[0] < best[0]: best = r
    return best
def smooth(pts):
    q = [P(*p) for p in pts]
    s = 'M%.1f %.1f' % q[0]
    for i in range(1, len(q)-1):
        s += ' Q%.1f %.1f %.1f %.1f' % (q[i][0], q[i][1], (q[i][0]+q[i+1][0])/2, (q[i][1]+q[i+1][1])/2)
    return s + ' L%.1f %.1f' % q[-1]
def poly(pts): return ' '.join('%.1f,%.1f' % P(*p) for p in pts)
def esc(t): return t.replace('&', '&amp;').replace('<', '&lt;')

# ---------- the Bowl, its gates, the river and the lake ----------
GATES = [  # id, bearing, name, the road it takes. Each crack faces one of the three roads of docs/WORLD.md section 5
    ('river', PI - 0.30, 'River Gate', 'River Road to the Greyspine'),
    ('red',   PI/2 - 0.12, 'Redgate', 'Redgate Road to Wildwood'),
    ('dune',  -0.45, 'Dune Gate', 'the dry riverbed to Amber Reach')]
AR_, AE_, AD_ = GATES[0][1], GATES[1][1], GATES[2][1]
WEIR = ('weir', -1.20, 'The Weir')   # a water gate (a lock and a grille), not a way in: the river leaves here for the Bight
RIVER = [gpt(AR_, 150, 3.5), gpt(AR_, 110, 3.5), gpt(AR_, 80, 3.5), (12, -64), (-10, -62), (-30, -50), (-44, -32), (-50, -6)]   # enters at the River Gate, ends in the lake
RIVER_OUT = [(-62, 18), (-69, 26), at(WEIR[1], 80), at(WEIR[1], 110), at(WEIR[1], 150)]                                       # leaves by the Weir
LAKE = (-52, 10, 16, 14)                                                                                                     # the Mirror Lake: x, z, rx, rz
def in_lake(p, m=0): return ((p[0]-LAKE[0])/(LAKE[2]+m))**2 + ((p[1]-LAKE[1])/(LAKE[3]+m))**2 < 1
WELL = (-26, 6)
ROADS = {  # name: (width m, points)
    'Bazaar Way': (6, [at(AE_, 80), (62, 14), (46, 22), (30, 32), (12, 38), (-6, 36), (-20, 28), (-24, 16)]),
    'River Road': (5, [gpt(AR_, 150, -3.2), gpt(AR_, 80, -3.2), (25, -60), (18, -48), (6, -36), (-6, -28), (-18, -18), (-24, -4)]),
    'Dune Road': (5, [at(AD_, 150), at(AD_, 74), (-30, 60), (-26, 46), (-22, 34), (-22, 24)]),
    'Lake Walk': (3, [(-30, 14), (-36, 24), (-44, 24)]),
}
BRIDGES = [(-10, -62, 0.0, 14, 3.2), (-37, -41, 0.91, 14, 3.2)]   # x, z, bearing of the span, length, width: footbridges over the river
for bx, bz, ba, bl, bw in BRIDGES: ROADS['Bridge %d' % (len(ROADS) - 3)] = (bw, [(bx - math.sin(ba) * (bl/2 + 5), bz - math.cos(ba) * (bl/2 + 5)), (bx + math.sin(ba) * (bl/2 + 5), bz + math.cos(ba) * (bl/2 + 5))])
STREETS = [(w, pts) for _, (w, pts) in ROADS.items()]

# ---------- the named buildings ----------
# cat: shop, inn, civic, story (people the main quest uses), res (reserved: ground held for later content that WORLD.md names). face: where the door looks.
BUILDINGS = []
SPECIAL = {'Old Citadel (ruin)': (0, -18.5), 'Circle Court': (0, 27), 'Great Well': WELL, 'Broken statue': (0, 0)}   # drawn by hand; the key's number goes here
def B(name, cat, x, z, w, d, face, sub='', id=''): BUILDINGS.append(dict(n=len(BUILDINGS) + 1, id=id, name=name, cat=cat, x=x, z=z, w=w, d=d, rot=rot_to(x, z, *face), face=face, sub=sub))
def along(pts, s):
    for i in range(len(pts)-1):
        L = math.hypot(pts[i+1][0]-pts[i][0], pts[i+1][1]-pts[i][1])
        if s <= L or i == len(pts)-2:
            t = min(1, s / L); x = pts[i][0] + (pts[i+1][0]-pts[i][0])*t; z = pts[i][1] + (pts[i+1][1]-pts[i][1])*t
            return (x, z), ((pts[i+1][0]-pts[i][0])/L, (pts[i+1][1]-pts[i][1])/L)
        s -= L
def beside(road, s, side, off, name, cat, w, d, sub=''):
    (px, pz), (tx, tz) = along(ROADS[road][1], s); nx, nz = -tz, tx
    B(name, cat, px + side*off*nx, pz + side*off*nz, w, d, (px, pz), sub)

B('Old Citadel (ruin)', 'civic', 0, 0, 0, 0, (0, 30), 'half-fallen, one face glazed black')
B('Great Well', 'civic', WELL[0], WELL[1], 0, 0, (0, 0), 'the spring that names the city')
B('Archive of the Silent Years', 'story', 17, -4, 9, 16, (0, -4), 'in the citadel\'s surviving east wing')
B("Wardens' Hall (the palace)", 'story', 6, -48, 24, 14, (6, -34), 'Steward Nabil')
B("Physician's Court", 'story', 42, -34, 14, 12, (30, -30), 'Anselm Rook')
B('Circle Court', 'civic', 0, 27, 0, 0, (0, 10), 'teleport circle')
beside('Bazaar Way', 12, +1, 7, 'Quest board square', 'shop', 6, 5, 'Zahra')
beside('Bazaar Way', 36, +1, 9, 'Weaponsmith', 'shop', 9, 8, 'Idris')
beside('Bazaar Way', 36, -1, 9, 'Armourer', 'shop', 9, 8, 'Layla')
beside('Bazaar Way', 54, +1, 9.5, 'Forge', 'shop', 10, 9, 'Karim: merges items')
beside('Bazaar Way', 54, -1, 10, "Trainers' yard", 'shop', 11, 10, 'Master Yusuf')
beside('Bazaar Way', 70, +1, 9, "Alchemist's", 'shop', 9, 8, 'Farid: potions')
beside('Bazaar Way', 70, -1, 11, 'Exchange Hall (shuttered)', 'res', 14, 10, 'reserved: trading between players')
B("Wayfarers' Lodge", 'shop', -44, 31, 14, 10, (-46, 19), 'Amina')
B("Harbour master's office", 'story', -35, -14, 10, 8, (-40, -4), 'Dalia')
B('Fish market', 'shop', -29, 26, 9, 6, (-30, 18), 'stalls on the shore')
B('Riverfoot Caravanserai', 'inn', 36, -52, 20, 14, (26, -52), 'inn with a courtyard')
B('River Gate stables', 'inn', 52, -38, 14, 7, (14, -42), 'pack-animal yard')
B('River Gate guardhouse', 'civic', 4, -70, 8, 6, at(AR_, 80), 'Captain Basma')
B('Redgate Caravanserai', 'inn', 62, -8, 22, 16, (62, 10), 'inn with a courtyard')
B('Redgate stables', 'inn', 58, 34, 18, 8, (58, 18), 'pack-animal yard')
B('Redgate guardhouse', 'civic', 70, 21, 7, 6, at(AE_, 80), 'gate watch')
B('Last Cup Caravanserai', 'inn', -6, 56, 22, 16, (-26, 56), 'inn with a courtyard')
B("Caravan-master's house", 'story', -8, 72, 10, 8, (-26, 70), 'Tahir')
B('Dune Gate stables and camel yard', 'inn', -48, 46, 18, 8, (-34, 46), 'pack-animal yard')
B("Odran's cart", 'story', -27, 70, 3, 2, (-30, 66), 'the peddler')
B('Dune Gate guardhouse', 'civic', -21, 68, 8, 6, at(AD_, 80), 'gate watch')
B('Sandring (reserved)', 'res', 44, 48, 16, 16, (30, 40), 'reserved: arena')
B('Guildhall (reserved)', 'res', -56, -34, 14, 12, (-44, -24), 'reserved: guild')
B('Broken statue', 'civic', 0, 0, 0, 0, (0, 30), "in the Citadel's court: the city's centre")

IDS = {'Old Citadel (ruin)': 'citadel', 'Great Well': 'well', 'Archive of the Silent Years': 'archive', "Wardens' Hall (the palace)": 'hall', "Physician's Court": 'physician', 'Circle Court': 'circle', 'Quest board square': 'board',
       'Weaponsmith': 'weapons', 'Armourer': 'armour', 'Forge': 'forge', "Trainers' yard": 'trainers', "Alchemist's": 'alchemist', 'Exchange Hall (shuttered)': 'exchange', "Wayfarers' Lodge": 'lodge',
       "Harbour master's office": 'harbour', 'Fish market': 'fish', 'Riverfoot Caravanserai': 'inn_river', 'River Gate stables': 'stables_river', 'River Gate guardhouse': 'guard_river',
       'Redgate Caravanserai': 'inn_red', 'Redgate stables': 'stables_red', 'Redgate guardhouse': 'guard_red', 'Last Cup Caravanserai': 'inn_dune', "Caravan-master's house": 'caravan',
       'Dune Gate stables and camel yard': 'stables_dune', "Odran's cart": 'cart', 'Dune Gate guardhouse': 'guard_dune', 'Sandring (reserved)': 'sandring', 'Guildhall (reserved)': 'guild', 'Broken statue': 'statue'}
for b in BUILDINGS: b['id'] = IDS[b['name']]

# ---------- the homes: a jittered grid over the whole floor, kept off roads, water and the named buildings ----------
QUARTER_AT = [('Willow Bank', (-28, -40)), ("Weavers' Terrace", (-62, -17)), ('Lakeshore Rows', (-55, 46)), ('Salt Row', (-16, 54)),
              ("Dyers' and Potters' Lane", (38, 58)), ('Hill Terraces', (52, -22)), ('Sunward Terraces', (42, 8))]
# ---------- footprints: every place and home is a real rectangle, standing on the floor, off the roads and the water, clear of the others (tools/glasswell-smoke.js checks the data) ----------
def sat_hit(A, B, gap=0.0):   # do two rectangles come closer than `gap`? (separating axes)
    ax = lambda P: [(-(P[(i+1) % 4][1] - P[i][1]), P[(i+1) % 4][0] - P[i][0]) for i in range(4)]
    for nx, nz in ax(A) + ax(B):
        l = math.hypot(nx, nz) or 1; pa = [p[0]*nx + p[1]*nz for p in A]; pb = [p[0]*nx + p[1]*nz for p in B]
        if max(pa) + gap*l < min(pb) or max(pb) + gap*l < min(pa): return False
    return True
def rect_circle(P, cx, cz, r):   # does the rectangle come within r of a point?
    inside = all(((P[(i+1) % 4][0]-P[i][0]) * (cz-P[i][1]) - (P[(i+1) % 4][1]-P[i][1]) * (cx-P[i][0])) >= 0 for i in range(4)) or all(((P[(i+1) % 4][0]-P[i][0]) * (cz-P[i][1]) - (P[(i+1) % 4][1]-P[i][1]) * (cx-P[i][0])) <= 0 for i in range(4))
    return inside or any(seg_d((cx, cz), P[i], P[(i+1) % 4])[0] < r for i in range(4))
SPECIAL_C = [(0, 0, 23), (0, 27, 7.5), (WELL[0], WELL[1], 11), (-19, 13, 3)]   # the Citadel's ring and court, the Circle Court, the Well Court, the arrival point: kept clear
def pts9(P): return P + [((P[i][0] + P[(i+1) % 4][0]) / 2, (P[i][1] + P[(i+1) % 4][1]) / 2) for i in range(4)] + [(sum(q[0] for q in P) / 4, sum(q[1] for q in P) / 4)]
WHY = ['']   # why the last fits() said no (for GW_DEBUG=1)
SPECIAL_H = [(0, 0, 22), (0, 27, 7), (WELL[0], WELL[1], 10.5), (-19, 13, 2.5)]   # the same keep-clear circles, a little tighter for the homes
def fits(P, others, gap=0.5, road_gap=0.0, skip_c=(), courts=None):
    if any(math.hypot(*q) > R_FLOOR - 2.5 for q in P): WHY[0] = 'rim'; return False
    for q in pts9(P):
        if in_lake(q, 1.5) or line_d(q, RIVER)[0] < 3.3 or line_d(q, RIVER_OUT[:3])[0] < 3.3: WHY[0] = 'water'; return False
        if any(line_d(q, pts)[0] < wd/2 + road_gap - 0.2 for wd, pts in STREETS): WHY[0] = 'road'; return False
    if any(rect_circle(P, cx, cz, r) for k, (cx, cz, r) in enumerate(courts or SPECIAL_C) if k not in skip_c): WHY[0] = 'court'; return False
    if any(sat_hit(P, O, gap) for O in others): WHY[0] = 'other'; return False
    return True
FACE = {}   # where each place's door looks, to turn it when it moves
for b in BUILDINGS: FACE[b['id']] = b.pop('face', None)
placed = []
for b in BUILDINGS:   # the plan's spot first, else the nearest spot that fits (a big building by a gate would poke into the rim)
    if not b['w']: continue
    skip = (0,) if b['id'] == 'archive' else ()
    for ring in range(0, 42):
        n = max(1, ring * 6); got = None
        for k in range(n):
            a = 2*PI*k/n; x, z = b['x'] + math.sin(a)*ring, b['z'] + math.cos(a)*ring; rot = rot_to(x, z, *FACE[b['id']]) if FACE[b['id']] else b['rot']
            if fits(rect_pts(x, z, b['w'], b['d'], rot), placed, skip_c=skip): got = (x, z, rot); break
            if ring == 0: WHY0 = WHY[0]
        if got: break
    if not got: raise SystemExit('no spot for ' + b['name'])
    if os.environ.get('GW_DEBUG') and ring: print('  (plan spot refused:', b['name'], WHY0, ')')
    if ring: print('moved %-34s %2d m' % (b['name'], ring))
    b['x'], b['z'], b['rot'] = got; b['P'] = rect_pts(*got[:2], b['w'], b['d'], got[2]); placed.append(b['P'])
    if os.environ.get('GW_DEBUG'): print('   %-34s (%6.1f,%6.1f) %2dx%2d rot %.2f' % (b['name'], b['x'], b['z'], b['w'], b['d'], b['rot']))
named_c = [(b['x'], b['z'], max(b['w'], b['d'])/2 + 1.5) for b in BUILDINGS if b['w']] + SPECIAL_C
rng = random.Random(1202)
HOMES = []
HOME_MAX = 80   # how many homes fill the floor (the owner chose 80; the rest of the ground stays lanes, courtyards and palms)
for _ in range(80000):
    if len(HOMES) >= HOME_MAX: break
    x = rng.uniform(-76, 76); z = rng.uniform(-76, 76); w = rng.uniform(4.8, 6.8); d = rng.uniform(4.8, 6.6)
    if not 24 < math.hypot(x, z) < 73: continue
    dist, nearest = min((line_d((x, z), pts) for _, pts in STREETS), key=lambda r: r[0]); rot = rot_to(x, z, *nearest); FP = rect_pts(x, z, w, d, rot)   # (not P: that is the page transform)
    if not fits(FP, placed + [h['P'] for h in HOMES], gap=0.6, road_gap=0.8, courts=SPECIAL_H): continue
    HOMES.append(dict(x=x, z=z, w=w, d=d, rot=rot, P=FP, q=min(QUARTER_AT, key=lambda q: math.hypot(x-q[1][0], z-q[1][1]))[0], path=nearest if dist < 17 else None))

assert len(HOMES) == HOME_MAX, 'only %d homes fit' % len(HOMES)

# ---------- drawing ----------
HALO = 'paint-order="stroke" stroke="#f6ecd0" stroke-linejoin="round" stroke-width="4"'
COL = dict(shop='#d9a032', inn='#c4693c', civic='#8a3a3a', story='#2c8c86', res='none', home='#efe3c4', sand='#e9d3a1', floor='#f1e2b8',
           rim='#b46c42', rimdk='#8b4b2d', water='#5db4d8', palm='#4b8a3a')
o = []
A = o.append
A('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" font-family="Georgia, \'Times New Roman\', serif">' % (W, H, W, H))
A('<rect width="%d" height="%d" fill="#f4e7c3"/>' % (W, H))
A('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (CX, CY, (R_FOOT + 40) * S, COL['sand']))
for k in range(26):   # a few dune ripples on the plateau
    a0 = rng.uniform(0, 2*PI); r = rng.uniform(R_FOOT + 4, R_FOOT + 36); da = rng.uniform(0.15, 0.4)
    p0, p1 = P(*at(a0, r)), P(*at(a0 + da, r)); A('<path d="M%.1f %.1f A%.1f %.1f 0 0 1 %.1f %.1f" fill="none" stroke="#d9bd84" stroke-width="1.4" opacity=".8"/>' % (p0[0], p0[1], r*S, r*S, p1[0], p1[1]))
RIM = {'foot': (R_FLOOR + 1, .012, (0.9, 2.1, 4.0)), 'crest': (R_CREST, .04, (1.3, 3.6, 5.2)), 'skirt': (R_FOOT, .05, (2.4, 0.7, 3.3))}   # radius, wobble, phases (src/game/village/sun-rim.js repeats the formula)
def rim_r(a, k): r, amp, ph = RIM[k]; return r * (1 + amp * (math.sin(3*a + ph[0]) * .5 + math.sin(7*a + ph[1]) * .3 + math.sin(13*a + ph[2]) * .2))
def wob(k, n=120): return [at(2*PI*i/n, rim_r(2*PI*i/n, k)) for i in range(n)]
skirt, crest, foot = wob('skirt'), wob('crest'), wob('foot')
A('<polygon points="%s" fill="#c98a5c"/>' % poly(skirt))
A('<polygon points="%s" fill="%s"/>' % (poly(crest), COL['rim']))
A('<polygon points="%s" fill="%s"/>' % (poly(foot), COL['floor']))
for k in range(260):   # cliff hatching between the foot and the crest
    a = rng.uniform(0, 2*PI)
    if any(abs(math.atan2(math.sin(a - g[1]), math.cos(a - g[1]))) < 0.11 for g in GATES + [WEIR]): continue
    r0 = R_FLOOR + 2 + rng.uniform(0, 4); r1 = r0 + rng.uniform(10, 26); p0, p1 = P(*at(a, r0)), P(*at(a, r1))
    A('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.2" opacity=".55"/>' % (p0[0], p0[1], p1[0], p1[1], COL['rimdk']))
A('<polygon points="%s" fill="none" stroke="%s" stroke-width="2.2"/>' % (poly(crest), COL['rimdk']))
A('<polygon points="%s" fill="none" stroke="%s" stroke-width="1.6"/>' % (poly(foot), COL['rimdk']))
for gid, a, name, road in GATES + [WEIR + ('',)]:   # the cracks: a channel through skirt, crest and cliff that pinches at the crest
    hw = GATE_W / 2 if gid != 'weir' else 4
    L = [gpt(a, R_FLOOR - 4, hw), gpt(a, R_CREST, hw - 1.5), gpt(a, R_FOOT + 8, hw + 4)]; Rr = [gpt(a, R_FLOOR - 4, -hw), gpt(a, R_CREST, -(hw - 1.5)), gpt(a, R_FOOT + 8, -(hw + 4))]
    A('<polygon points="%s" fill="%s"/>' % (poly(L + Rr[::-1]), COL['sand'] if gid != 'weir' else COL['rim']))
    A('<polyline points="%s" fill="none" stroke="%s" stroke-width="1.8"/><polyline points="%s" fill="none" stroke="%s" stroke-width="1.8"/>' % (poly(L), COL['rimdk'], poly(Rr), COL['rimdk']))
    ux, uz = math.sin(a), math.cos(a)
    if gid != 'weir':   # the road outside, and the gate arch across the crack
        e0, e1 = P(*gpt(a, R_FLOOR, -3.2 if gid == 'river' else 0)), P(*gpt(a, R_FOOT + 38, -3.2 if gid == 'river' else 0))
        A('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#f1e2b8" stroke-width="%.1f" stroke-linecap="round"/>' % (e0[0], e0[1], e1[0], e1[1], 5*S))
        A('<polygon points="%s" fill="#7a4a2a" stroke="#4a2a14" stroke-width="1.5"/>' % poly(rect_pts(*gpt(a, R_FLOOR + 8), GATE_W + 7, 4.5, rot_to(0, 0, ux, uz))))
        lp = P(*gpt(a, R_FOOT + 34)); A('<text x="%.1f" y="%.1f" font-size="17" font-weight="bold" text-anchor="middle" letter-spacing="2" fill="#4a2a14" %s>%s</text>' % (lp[0], lp[1]-4, HALO, name.upper()))
        A('<text x="%.1f" y="%.1f" font-size="12.5" font-style="italic" text-anchor="middle" fill="#5a3a1c" %s>%s</text>' % (lp[0], lp[1]+12, HALO, esc(road)))
    else:
        lp = P(*at(a, R_FOOT + 22)); A('<text x="%.1f" y="%.1f" font-size="15" font-weight="bold" text-anchor="middle" letter-spacing="2" fill="#4a2a14" %s>THE WEIR</text>' % (lp[0], lp[1], HALO))
        A('<text x="%.1f" y="%.1f" font-size="12.5" font-style="italic" text-anchor="middle" fill="#5a3a1c" %s>the river leaves for the Bight</text>' % (lp[0], lp[1]+15, HALO))
A('<path d="%s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>' % (smooth(RIVER), COL['water'], 5*S))
A('<path d="%s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>' % (smooth(RIVER_OUT), COL['water'], 4*S))
lx, lz = P(LAKE[0], LAKE[1]); A('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" stroke="#3d8fb5" stroke-width="2"/>' % (lx, lz, LAKE[2]*S, LAKE[3]*S, COL['water']))
for k in range(3):   # jetties and boats
    z = 2 + k*8; p0, p1 = P(LAKE[0]+LAKE[2]-3, z), P(LAKE[0]+LAKE[2]-12, z)
    A('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#8a6a3c" stroke-width="%.1f"/>' % (p0[0], p0[1], p1[0], p1[1], 1.6*S))
    bx, bz = P(LAKE[0]+LAKE[2]-16, z+3.5); A('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#f4e7c3" stroke="#7a5a2c" stroke-width="1.2"/>' % (bx, bz, 2.6*S, 1.0*S))
for bx, bz, ba, bl, bw in BRIDGES: A('<polygon points="%s" fill="#8a6a3c" stroke="#4a3418" stroke-width="1.3"/>' % poly(rect_pts(bx, bz, bw + 1.2, bl, ba + PI)))   # (under the roads, which draw next: only the deck's rails show)
for name, (w, pts) in ROADS.items(): A('<path id="road-%s" d="%s" fill="none" stroke="#f6e9c4" stroke-width="%.1f" stroke-linecap="round" stroke-linejoin="round"/>' % (name.replace(' ', ''), smooth(pts), w*S))
for h in HOMES:   # door paths: the narrow lanes of the quarters
    if h['path']: p0, p1 = P(h['x'], h['z']), P(*h['path']); A('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#f3e6c0" stroke-width="%.1f" stroke-linecap="round"/>' % (p0[0], p0[1], p1[0], p1[1], 2.2*S))
wx, wz = P(*WELL); A('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#f6e9c4" stroke="#caa86a" stroke-width="1.5"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="#5db4d8" stroke="#6b5a3c" stroke-width="3"/>' % (wx, wz, 10*S, wx, wz, 3.1*S))
# the Old Citadel: a broken ring wall, fallen towers, and the glazed face
cx0, cz0 = P(0, 0); A('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#e6cf98"/>' % (cx0, cz0, 19*S))
def arc(a0, a1, r, col, wdt):
    p0, p1 = P(*at(a0, r)), P(*at(a1, r)); return '<path d="M%.1f %.1f A%.1f %.1f 0 %d 1 %.1f %.1f" fill="none" stroke="%s" stroke-width="%.1f"/>' % (p0[0], p0[1], r*S, r*S, 1 if (a1-a0) > PI else 0, p1[0], p1[1], col, wdt)
for a0, a1 in [(0.1, 0.9), (1.1, 1.9), (2.15, 2.7), (3.1, 4.0), (4.5, 5.0), (5.35, 6.1)]: A(arc(a0, a1, 18.5, '#b88a3a', 3.2*S))
A(arc(4.05, 4.45, 18.5, '#1b1b22', 3.2*S))
for a in (0.0, 1.0, 2.0, 2.9, 3.6, 4.7, 5.6): p = P(*at(a, 11)); A('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#c9a45a" opacity=".75" transform="rotate(%d %.1f %.1f)"/>' % (p[0]-1.6*S, p[1]-1.6*S, 3.2*S, 3.2*S, int(a*57), p[0], p[1]))
tx, tz = P(0, 27); A('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#f6e9c4" stroke="#caa86a"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#6b4f9a" stroke-width="2.4"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#6b4f9a" stroke-width="1.2" stroke-dasharray="3 3"/>' % (tx, tz, 6*S, tx, tz, 2.4*S, tx, tz, 4.2*S))
def draw_rect(pts, fill, stroke, dash=False): A('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.3"%s/>' % (poly(pts), fill, stroke, ' stroke-dasharray="5 3"' if dash else ''))
def door(x, z, d, rot, r=2.2, fill='#6b4a22'): c, s = math.cos(rot), math.sin(rot); q = P(x - d/2*s, z - d/2*c); A('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (q[0], q[1], r, fill))
for h in HOMES: draw_rect(rect_pts(h['x'], h['z'], h['w'], h['d'], h['rot']), COL['home'], '#8a6a3c'); door(h['x'], h['z'], h['d'], h['rot'], 1.6)
for b in BUILDINGS:
    if not b['w']: continue
    pts = rect_pts(b['x'], b['z'], b['w'], b['d'], b['rot'])
    if b['cat'] == 'res': draw_rect(pts, '#fbf3dc', '#a02a2a', True)
    else: draw_rect(pts, COL[b['cat']], '#3a2410'); door(b['x'], b['z'], b['d'], b['rot'], 2.4, '#fff')
for k in range(11):   # market awnings along the Bazaar Way
    (px, pz), (tx_, tz_) = along(ROADS['Bazaar Way'][1], 22 + k * 7.2); sd = 1 if k % 2 else -1; nx, nz = -tz_, tx_
    x, z = px + sd * 4.4 * nx, pz + sd * 4.4 * nz; draw_rect(rect_pts(x, z, 3.2, 1.5, rot_to(x, z, px, pz)), '#efc064', '#8a5a12')
for k in range(4): draw_rect(rect_pts(-36 + k*3.4, 21 + (k % 2)*0.2, 2.6, 1.4, 0), '#efc064', '#8a5a12')   # the fish market's stalls
def palm(x, z, r=1.7):
    p = P(x, z); A('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="#2f5a24" stroke-width="1"/><circle cx="%.1f" cy="%.1f" r="1.3" fill="#2f5a24"/>' % (p[0], p[1], r*S, COL['palm'], p[0], p[1]))
for k in range(26):
    a = k / 26 * 2*PI + 0.2; x, z = LAKE[0] + math.cos(a) * (LAKE[2] + 4), LAKE[1] + math.sin(a) * (LAKE[3] + 4)
    if math.hypot(x, z) < 76 and not (x > -38 and -2 < z < 20): palm(x, z)
for a in range(6): palm(WELL[0] + math.cos(a) * 12.5, WELL[1] + math.sin(a) * 12.5, 1.5)
for b in BUILDINGS:
    if b['cat'] == 'inn' and b['w'] > 15 and 'stables' not in b['name']: palm(b['x'] - 3, b['z'], 1.3); palm(b['x'] + 3, b['z'], 1.3)
free = 0
for _ in range(900):   # palms and courtyard trees in the gaps between the houses
    if free >= 34: break
    x, z = rng.uniform(-72, 72), rng.uniform(-72, 72)
    if not 26 < math.hypot(x, z) < 72 or in_lake((x, z), 8) or line_d((x, z), RIVER)[0] < 7: continue
    if any(line_d((x, z), pts)[0] < wd/2 + 2.5 for wd, pts in STREETS): continue
    if any(math.hypot(x-cx, z-cz) < r + 2.2 for cx, cz, r in named_c + [(h['x'], h['z'], max(h['w'], h['d'])/2 + 0.8) for h in HOMES]): continue
    palm(x, z, 1.3); free += 1
sx, sz = P(-19, 13); A('<polygon points="%s" fill="#e8c533" stroke="#6b4a00" stroke-width="1.2"/>' % ' '.join('%.1f,%.1f' % (sx + math.sin(k*PI/5) * (10 if k % 2 == 0 else 4.5), sz - math.cos(k*PI/5) * (10 if k % 2 == 0 else 4.5)) for k in range(10)))   # arrival and respawn
for b in BUILDINGS:   # the key's numbers
    x, z = SPECIAL.get(b['name'], (b['x'], b['z'])); p = P(x, z)
    if b['name'] == "Odran's cart": p = (p[0] + 13, p[1] - 11)
    A('<circle cx="%.1f" cy="%.1f" r="9" fill="#fffdf4" stroke="#3a2410" stroke-width="1.3"/><text x="%.1f" y="%.1f" font-size="11" font-weight="bold" text-anchor="middle" fill="#3a2410">%d</text>' % (p[0], p[1], p[0], p[1] + 4, b['n']))
def lab(text, x, z, size=13, col='#4a2a14', rot=0, it=False, ls=2):
    p = P(x, z); A('<text x="%.1f" y="%.1f" font-size="%d" text-anchor="middle" letter-spacing="%d" fill="%s" %s%s transform="rotate(%d %.1f %.1f)">%s</text>' % (p[0], p[1], size, ls, col, HALO, ' font-style="italic"' if it else '', rot, p[0], p[1], esc(text)))
lab('THE OLD CITADEL', 0, -24.5, 13); lab('MIRROR LAKE', -57, 12, 10, '#16506e', 0, True, 1)
A('<path id="road-BazaarWayRev" d="%s" fill="none"/>' % smooth(ROADS['Bazaar Way'][1][::-1]))
for rid, off in (('BazaarWayRev', '56%'), ('RiverRoad', '30%'), ('DuneRoad', '14%')):
    A('<text font-size="11" font-style="italic" letter-spacing="1.5" fill="#6a4a10" %s><textPath href="#road-%s" startOffset="%s">%s</textPath></text>' % (HALO, rid, off, {'BazaarWayRev': 'Bazaar Way', 'RiverRoad': 'River Road', 'DuneRoad': 'Dune Road'}[rid]))
for q in sorted({h['q'] for h in HOMES}):   # each quarter's name at the middle of its homes
    hs = [h for h in HOMES if h['q'] == q]
    if len(hs) >= 3: lab(q, sum(h['x'] for h in hs) / len(hs), sum(h['z'] for h in hs) / len(hs), 10.5, '#6b4a22', 0, True, 0)
# title, key, legend, scale, compass
kx = 1330
A('<text x="%d" y="64" font-size="44" font-weight="bold" fill="#3a2410" letter-spacing="4">GLASSWELL</text>' % kx)
A('<text x="%d" y="92" font-size="17" font-style="italic" fill="#5a3a1c">the oasis city of the Sunscar: a plan of the Bowl</text>' % kx)
A('<text x="%d" y="114" font-size="12" fill="#7a5a30">The layout that the 3D model is built from. Metres and places are starting values.</text>' % kx)
y = 152
for b in BUILDINGS:
    A('<rect x="%d" y="%d" width="15" height="15" fill="%s" stroke="%s" stroke-width="1.4"%s/>' % (kx, y - 12, '#fbf3dc' if b['cat'] == 'res' else COL[b['cat']], '#a02a2a' if b['cat'] == 'res' else '#3a2410', ' stroke-dasharray="3 2"' if b['cat'] == 'res' else ''))
    A('<text x="%d" y="%d" font-size="13" font-weight="bold" fill="#3a2410">%d</text>' % (kx + 22, y, b['n']))
    A('<text x="%d" y="%d" font-size="13.5" fill="#2a1808">%s</text>' % (kx + 44, y, esc(b['name'])))
    if b['sub']: A('<text x="%d" y="%d" font-size="11" fill="#7a5a30">%s</text>' % (kx + 44, y + 12, esc(b['sub'])))
    y += 27 if b['sub'] else 17
y += 12
for lbl, fill, st in [('shops and services', COL['shop'], '#3a2410'), ('inns and stables', COL['inn'], '#3a2410'), ('civic and gate watch', COL['civic'], '#3a2410'), ('places the main quest uses', COL['story'], '#3a2410'), ('homes', COL['home'], '#8a6a3c'), ('reserved ground (built later)', '#fbf3dc', '#a02a2a')]:
    A('<rect x="%d" y="%d" width="15" height="15" fill="%s" stroke="%s" stroke-width="1.4"%s/><text x="%d" y="%d" font-size="13" fill="#2a1808">%s</text>' % (kx, y - 12, fill, st, ' stroke-dasharray="3 2"' if 'reserved' in lbl else '', kx + 24, y, lbl)); y += 21
A('<circle cx="%d" cy="%d" r="7" fill="#e8c533" stroke="#6b4a00"/><text x="%d" y="%d" font-size="13" fill="#2a1808">arrival and respawn (the Well Court)</text>' % (kx + 7, y - 5, kx + 24, y)); y += 21
A('<circle cx="%d" cy="%d" r="7" fill="#fff" stroke="#6b4f9a" stroke-width="2.2"/><text x="%d" y="%d" font-size="13" fill="#2a1808">teleport circle</text>' % (kx + 7, y - 5, kx + 24, y)); y += 21
A('<circle cx="%d" cy="%d" r="6" fill="%s" stroke="#2f5a24"/><text x="%d" y="%d" font-size="13" fill="#2a1808">palm</text>' % (kx + 7, y - 5, COL['palm'], kx + 24, y))
A('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#3a2410" stroke-width="3"/><text x="%d" y="%d" font-size="13" fill="#3a2410">20 m</text>' % (kx, H - 62, kx + 20*S, H - 62, kx + 20*S + 8, H - 58))
A('<text x="%d" y="%d" font-size="11.5" font-style="italic" fill="#7a5a30">Rim: floor radius %d m, crest %d m, skirt to %d m. Gates %d m wide.</text>' % (kx, H - 30, R_FLOOR, R_CREST, R_FOOT, GATE_W))
A('<g transform="translate(70 76)"><circle r="30" fill="none" stroke="#3a2410" stroke-width="1.4"/><path d="M0 -34 L7 0 L0 34 L-7 0 Z" fill="#3a2410" opacity=".85"/><path d="M-34 0 L0 -5 L34 0 L0 5 Z" fill="#3a2410" opacity=".45"/><text y="-40" font-size="15" font-weight="bold" text-anchor="middle" fill="#3a2410">N</text></g>')
A('</svg>')
open(OUT, 'w').write('\n'.join(o))

# what the numbers in DESERT-CITY.md come from
cnt = collections.Counter(b['cat'] for b in BUILDINGS if b['w'])
print('named buildings with a footprint:', sum(cnt.values()), dict(cnt), '(+ the ruin, the well and the circle court, drawn by hand)')
print('homes:', len(HOMES), dict(collections.Counter(h['q'] for h in HOMES)), '(at most %d)' % HOME_MAX)
print('building footprints in all:', sum(cnt.values()) + len(HOMES))
print('floor area %.0f m2 = %.1f village discs (r 30 m)' % (PI*R_FLOOR**2, (R_FLOOR/30)**2))

# ---------- the game's layout data (src/shared/sunscar.js) ----------
if JS:
    def n(v, d=2):
        t = '%.*f' % (d, v)
        if '.' in t: t = t.rstrip('0').rstrip('.')
        return '0' if t in ('-0', '') else t
    pts = lambda L: '[' + ','.join('[%s,%s]' % (n(x), n(z)) for x, z in L) + ']'
    import json
    L = ['//@ Glasswell, the oasis city of the Sunscar: the Bowl, its gates, river, lake, roads, places and 80 homes as plain data in the city\'s own frame (docs/DESERT-CITY.md). Pure.',
         '/* GENERATED by `python3 docs/glasswell-plan.py docs/glasswell-plan.svg --js src/shared/sunscar.js`: change the script, not this file (it also draws docs/glasswell-plan.svg).',
         '   Frame: metres, origin = the Old Citadel\'s centre = the Bowl\'s centre, +x east, +z south, bearings as at(a,r) = (sin a * r, cos a * r). A place\'s `rot` is the bearing of its door, like H.rot in',
         '   village-layout.js. Nothing in the game uses this yet but the model (game/village/sun-*.js): the Sunscar itself is not built, so the city has no place in the world. */',
         'const GLASSWELL={',
         '  r:%d, crest:%d, foot:%d, gateW:%d, crestH:26, skirtH:8,   // the floor\'s radius, the rim\'s crest and where its skirt meets the plateau (metres from the centre); the crest stands crestH above the floor, the plateau skirtH' % (R_FLOOR, R_CREST, R_FOOT, GATE_W),
         '  rim:{' + ','.join("%s:[%s,%s,[%s]]" % (k, n(v[0]), n(v[1], 3), ','.join(n(q, 1) for q in v[2])) for k, v in RIM.items()) + '},   // [radius, wobble, phases]: r(a) = radius * (1 + wobble * (sin(3a + p0) * .5 + sin(7a + p1) * .3 + sin(13a + p2) * .2))',
         '  gates:[' + ','.join('{id:%s,a:%s,name:%s,road:%s}' % (json.dumps(g[0]), n(g[1], 4), json.dumps(g[2]), json.dumps(g[3])) for g in GATES) + '],',
         '  weir:{a:%s},' % n(WEIR[1], 4),
         '  river:' + pts(RIVER) + ',', '  riverOut:' + pts(RIVER_OUT) + ',',
         '  lake:{x:%s,z:%s,rx:%s,rz:%s},   // the Mirror Lake' % tuple(n(v) for v in LAKE),
         '  well:[%s,%s],' % (n(WELL[0]), n(WELL[1])), '  spawn:[-19,13], tele:{x:0,z:27,r:2.4},',
         '  roads:[' + ','.join('{name:%s,w:%s,pts:%s}' % (json.dumps(k), n(v[0]), pts(v[1])) for k, v in ROADS.items() if not k.startswith('Bridge')) + '],',
         '  bridges:[' + ','.join('[%s,%s,%s,%s,%s]' % tuple(n(v, 3 if i == 2 else 2) for i, v in enumerate(b)) for b in BRIDGES) + '],   // x, z, bearing of the span, length, width',
         '  places:[   // n: the number in docs/glasswell-plan.svg; cat: shop, inn, civic, story or res (ground held for later content: dressed, shut)']
    for b in BUILDINGS:
        L.append('    {n:%d,id:%s,cat:%s,x:%s,z:%s,w:%s,d:%s,rot:%s,name:%s,note:%s},' % (b['n'], json.dumps(b['id']), json.dumps(b['cat']), n(b['x']), n(b['z']), n(b['w']), n(b['d']), n(b['rot'], 3), json.dumps(b['name']), json.dumps(b['sub'])))
    L += ['  ],', '  homes:[   // x, z, width, depth, rot (the plan packs them at random but with a fixed seed: always the same 80)']
    L += ['    ' + ','.join('[%s,%s,%s,%s,%s]' % (n(h['x']), n(h['z']), n(h['w'], 1), n(h['d'], 1), n(h['rot'], 3)) for h in HOMES[i:i+4]) + ',' for i in range(0, len(HOMES), 4)]
    L += ['  ]', '};']
    open(JS, 'w').write('\n'.join(L) + '\n')
    print('wrote', JS, '(%d places, %d homes)' % (len(BUILDINGS), len(HOMES)))
