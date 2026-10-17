//@ Cave site 'seacave': The Sea Caves, a big sea cave in the Gloamhorn's south cliff (Captain Dredge's hold): a mouth at the cliff foot, a hall under the arena's plateau with a skylight and side alcoves, a tide-pool shelf and a ramp down the cliff
/* Agent map. Registered through defineCave (shared/caves.js). Placeholder position: the middle one of the hold's three painted cave mouths (GLOAM_HOLD.caves[1], shared/gloamhorn.js: (-1543,-757)); the hall's middle is the
   arena's (ARENA_M35: (-1530,-795), r 24): the boss arena becomes the cave. Local frame: origin = the mouth at the cliff foot, +u inland (north-north-east, yaw -1.25), +v along the coast (east-south-east); fy = the floor 1.6 m above the
   sea. Rock: a headland block flat at the plateau's height (35.7 m) over the mouth and the hall's front, and a block that follows the land over the rest. The hold's other dressing (buildings-gloam.js buildGloamHold stands at ARENA_M35.h) and the
   arena's own flat (zones.js arena flatten to ARENA_M35.h) are left as they are: the carve overrides them inside this site; the re-pointing task decides what the arena looks like. The ramp (a pad) climbs the cliff east of the mouth to the plateau.
   Test: tools/caves-smoke.js. */
defineCave({
  id:'seacave', name:'The Sea Caves', x:-1543, z:-757, yaw:-1.25, fy:1.6, pal:'dusk', sea:true, inner:6, strata:{period:3.8,amp:0.3}, rough:0.34, n0:5, dark:0.85,
  rock:[
    {u:[-2,46], v:[-42,42], y:[-3,34.1], r:8, bevel:2.2},                                       // the headland: a sheer face at the sea, flat on top at the plateau's height
    {u:[44,78], v:[-48,48], y:[-3,50], r:6, follow:true, lift:0.25},                            // inland of it the top is the land itself
  ],
  voids:[
    {kind:'arch', a:[-10,0], b:[20,0], w:19, h:13, w1:15, h1:12},                               // the mouth and the passage into the hall
    {kind:'chamber', at:[40,0], ru:26, rv:26, h:17},                                            // the hall: the arena's size
    {kind:'chamber', at:[24,-28], ru:8, rv:8, h:9},                                             // alcoves
    {kind:'chamber', at:[58,26], ru:9, rv:8, h:9.5},
    {kind:'overhang', at:[44,-13,16], ru:4.5, rv:4.5, ry:24},                                   // a skylight shaft through the roof
    {kind:'overhang', at:[-1,-11,2.5], ru:5, rv:3.4, ry:3.2},                                   // the mouth's piers are undercut
    {kind:'overhang', at:[-1,11,2.5], ru:5, rv:3.4, ry:3.2},
  ],
  pads:[
    {pts:[[-18,-26],[-18,26]], w:30, bank:9},                                                   // the shelf in front of the mouth
    {pts:[[30,-14,-3.4]], w:12, bank:4}, {pts:[[52,15,-3.4]], w:10, bank:4},                    // two flooded basins in the hall (the sea comes in)
    {pts:[[-8,10,0],[-6,24,6],[-4,36,13],[0,46,21],[4,54,28],[8,60,34.1]], w:9, bank:7},        // the way up: a ramp along the cliff foot to the plateau (slope 0.64)
  ],
  pits:{u:[-31,-4], v:[-24,24], n:24, rmin:1.4, rmax:3.6, depth:0.5, seed:35, keep:[[-10,0,11],[-8,10,8],[-6,24,8]]},
  walk:{under:[[14,64],[8,60],[4,54],[0,46],[-4,36],[-6,24],[-8,10],[-10,0],[10,0],[28,0],[40,0]], top:[[80,0],[60,0],[44,0],[30,0],[14,0],[4,0]]},   // down the ramp, in at the mouth, into the hall; over the roof
});
