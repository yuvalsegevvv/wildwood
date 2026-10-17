//@ Cave site 'arches': the Sandstone Sea Arches, a sea cliff with a row of five arches, cross passages behind the piers, a hall, a free-standing stack arch and a pitted tide-pool shelf (the Sunscar's west coast, placeholder position)
/* Agent map. Registered through defineCave (shared/caves.js); the picture it follows: a sandstone cliff in warm yellow-orange strata, arches along its foot, a flat pitted rock shelf with tide pools in front, a sandy beach.
   Local frame: origin (x,z) is the cliff's foot at the middle of the row, +u runs inland (east here), +v south. fy: the shelf, 2.0 m above the sea. The cliff's top is the Sunscar's plateau (about 23 m there):
   the rock is flush with it, so the top is walkable from the land. Position is a plain x,z: the re-pointing task moves it. Test: tools/caves-smoke.js. */
defineCave({
  id:'arches', name:'The Sea Arches', x:-976, z:232, yaw:0, fy:2.0, pal:'sand', sea:true, inner:6, strata:{period:3.4,amp:0.32}, rough:0.32, n0:11, dark:0.7,
  rock:[
    {u:[-1,38], v:[-52,52], y:[-3,21], r:5, su:-0.02, bevel:1.6},                // the cliff: a vertical face at its foot, the plateau on top
    {u:[-1,38], v:[48,78],  y:[-3,1.2], r:4, sv:-0.9, su:-0.02, bevel:1.6},      // its ends taper away into the coast
    {u:[-1,38], v:[-78,-48],y:[-3,1.2], r:4, sv:0.9,  su:-0.02, bevel:1.6},
    {u:[-37,-20], v:[-16,12], y:[-3,10.5], r:6, bevel:2.0},                      // a stack standing on the shelf
  ],
  voids:[
    {kind:'arch', a:[-8,-38], b:[26,-38], w:11, h:11, w1:6, h1:6.5},
    {kind:'arch', a:[-8,-15], b:[30,-15], w:16, h:14.5, w1:8, h1:8},
    {kind:'arch', a:[-8,9],   b:[34,9],   w:19, h:16, w1:9, h1:8.5},
    {kind:'arch', a:[-8,32],  b:[28,32],  w:13, h:12, w1:7, h1:7},
    {kind:'arch', a:[-8,48],  b:[22,48],  w:8,  h:8.5, w1:5, h1:5},
    {kind:'tunnel', a:[17,-42], b:[17,50], w:6, h:6.5},                           // the passage behind the piers: every arch is seen through the next
    {kind:'chamber', at:[27,9], ru:10, rv:13, h:15},
    {kind:'arch', a:[-42,-2], b:[-14,-2], w:10, h:8.5, w1:8, h1:7.5},             // the stack's own arch, through it
    {kind:'overhang', at:[0,-27,3], ru:5.5, rv:3.8, ry:3.6},                      // the piers are undercut at their feet
    {kind:'overhang', at:[0,-3,3], ru:5.5, rv:3.8, ry:3.6},
    {kind:'overhang', at:[0,21,3], ru:5.5, rv:3.8, ry:3.6},
    {kind:'overhang', at:[0,41,3], ru:5.5, rv:3.8, ry:3.6},
  ],
  pads:[ {pts:[[-28,-60],[-28,60]], w:44, bank:10} ],                             // the shelf in front, at the floor's height, banked into the sea and the beach
  pits:{u:[-48,-5], v:[-58,58], n:46, rmin:1.4, rmax:4.2, depth:0.55, seed:77, keep:[[-28,-2,9],[-8,-38,7],[-8,-15,9],[-8,9,10],[-8,32,7],[-8,48,5]]},
  walk:{under:[[-50,-2],[-42,-2],[-28,-2],[-14,-2],[-8,-2],[-8,-15],[17,-15],[17,9],[-8,9],[-14,20],[-34,24]], top:[[56,0],[38,0],[20,0],[8,-10],[4,-30]]},   // the test walks these with the real movement code: through the stack's arch, in at arch 2, along the passage, out at arch 3; then over the cliff's top
});
