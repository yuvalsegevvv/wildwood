//@ Cave site 'arches': the Sandstone Sea Arches, a run of four arches with strata, cross passage and a pitted tide-pool shelf on the Sunscar's south-west coast
/* Agent map. Atlas position (-1128,420): a sandstone headland with a sheer face at the sea; clear of the Sunscar's door (-1003,311).  Registered through defineCave (shared/caves.js); the picture it follows: a sandstone cliff in warm yellow-orange strata, arches along its foot, a flat pitted rock shelf with tide pools in front, a sandy beach.
   Local frame: origin (x,z) is the cliff's foot at the middle of the row, +u runs inland (east here), +v south. fy: the shelf, 2.0 m above the sea. The cliff's top is the Sunscar's plateau (about 23 m there):
   the rock is flush with it, so the top is walkable from the land. Position is a plain x,z: the re-pointing task moves it. Test: tools/caves-smoke.js. */
defineCave({
  id:'arches', name:'The Sea Arches', x:-1128, z:420, yaw:0, fy:2.0, pal:'sand', sea:true, inner:6, strata:{period:3.4,amp:0.32}, rough:0.32, n0:11, dark:0.7,
  rock:[ {u:[-1,46], v:[-62,62], y:[-3,18], r:5, su:-0.02, bevel:1.6},                // the cliff: a sheer face at the sea
    {u:[40,60], v:[-62,62], y:[-3,40], r:5, follow:true, lift:0.25} ],                     // a sandstone headland
  voids:[
    {kind:'arch', a:[-8,-40], b:[18,-40], w:11, h:7.5, w1:6, h1:5},
    {kind:'arch', a:[-8,-14], b:[22,-14], w:16, h:10, w1:8, h1:6},
    {kind:'arch', a:[-8,12],  b:[22,12],  w:17, h:11, w1:9, h1:6.5},
    {kind:'arch', a:[-8,38],  b:[18,38],  w:12, h:8, w1:7, h1:5},
    {kind:'tunnel', a:[14,-44], b:[14,44], w:6, h:6.5},                           // the passage behind the piers: every arch is seen through the next
    {kind:'overhang', at:[0,-27,3], ru:5.5, rv:3.8, ry:3.6},                      // the piers are undercut at their feet
    {kind:'overhang', at:[0,-1,3], ru:5.5, rv:3.8, ry:3.6},
    {kind:'overhang', at:[0,25,3], ru:5.5, rv:3.8, ry:3.6},
  ],
  pads:[ {pts:[[-26,-60],[-26,60]], w:40, bank:10} ],                             // the shelf in front, banked into the sea and the beach
  pits:{u:[-44,-5], v:[-56,56], n:46, rmin:1.4, rmax:4.2, depth:0.55, seed:77, keep:[[-26,-2,9],[-8,-40,7],[-8,-14,9],[-8,12,10],[-8,38,7]]},   // tide pools
  walk:{under:[[-40,-14],[-26,-14],[-8,-14],[14,-14],[14,12],[-8,12],[-26,12],[-40,12]], top:[[60,0],[44,0],[30,0],[20,-6],[16,-26]]},
});
