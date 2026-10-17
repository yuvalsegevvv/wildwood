//@ Cave site 'seacave': The Sea Caves, ONE big vaulted chamber with a flooded sea entrance, under the Gloamhorn's south plateau (Sea Caves POI)
/* Agent map. Atlas position (-1177,-378): the south coast below the Sea Caves POI (-1147,-457); a widening throat from the shelf runs into a single large vault with a skylight; the rock follows the land.  Registered through defineCave (shared/caves.js). Placeholder position: the middle one of the hold's three painted cave mouths (GLOAM_HOLD.caves[1], shared/gloamhorn.js: (-1543,-757)); the hall's middle is the
   arena's (ARENA_M35: (-1530,-795), r 24): the boss arena becomes the cave. Local frame: origin = the mouth at the cliff foot, +u inland (north-north-east, yaw -1.25), +v along the coast (east-south-east); fy = the floor 1.6 m above the
   sea. Rock: a headland block flat at the plateau's height (35.7 m) over the mouth and the hall's front, and a block that follows the land over the rest. The hold's other dressing (buildings-gloam.js buildGloamHold stands at ARENA_M35.h) and the
   arena's own flat (zones.js arena flatten to ARENA_M35.h) are left as they are: the carve overrides them inside this site; the re-pointing task decides what the arena looks like. The ramp (a pad) climbs the cliff east of the mouth to the plateau.
   Test: tools/caves-smoke.js. */
defineCave({
  id:'seacave', name:'The Sea Caves', x:-1177, z:-378, yaw:-1.5708, fy:1.0, pal:'dusk', sea:true, inner:6, strata:{period:3.8,amp:0.3}, rough:0.34, n0:5, dark:0.85,
  rock:[ {u:[-2,76], v:[-50,50], y:[-3,50], r:8, follow:true, lift:0.25} ],                     // a headland: the land itself over the mouth and the hall
  voids:[
    {kind:'arch', a:[-8,0], b:[24,0], w:20, h:9, w1:16, h1:11},                      // the sea entrance: a flooded, widening throat
    {kind:'chamber', at:[40,0], ru:24, rv:22, h:14},                                      // ONE big vaulted chamber (the arena's hall)
    {kind:'overhang', at:[40,-10,18], ru:4.5, rv:4.5, ry:12},                                    // a skylight shaft through the vault
  ],
  pads:[ {pts:[[-18,-26],[-18,26]], w:26, bank:9} ],                                              // the shelf in front of the mouth
  pits:{u:[-31,-4], v:[-24,24], n:14, rmin:1.4, rmax:3.2, depth:0.5, seed:35, keep:[[-10,0,11]]},
  walk:{under:[[-14,0],[0,0],[14,0],[28,0],[40,0]], top:[[72,0],[60,0],[48,0],[40,0],[30,0]]},   // in at the sea mouth and up into the hall; over the roof
});
