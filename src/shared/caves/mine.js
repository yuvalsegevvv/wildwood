//@ Cave site 'mine': an old mine mouth in the Greyspine's southern slope: a platform cut into the hill, a timbered-looking adit, a branching gallery and a deep chamber (grey rock)
/* Agent map. Registered through defineCave (shared/caves.js). Placeholder position (-686,-546) on a 0.4-0.6 slope in the Greyspine, clear of every zone, arena and node; the re-pointing task may move it near Miners' Scree.
   Local frame: origin = the portal, +u uphill (yaw 73 degrees: toward the south-south-east), +v to the right; fy = 63.6 m (the land at the portal is 70.3 m: the face is 6.7 m tall). The rock follows the hill (its top is the land) so the
   mouth is a cut face and the tunnel runs under the slope. Test: tools/caves-smoke.js. */
defineCave({
  id:'mine', name:'The Old Mine', x:-686, z:-546, yaw:1.274, fy:63.6, pal:'grey', sea:false, inner:6, strata:{period:2.6,amp:0.22}, rough:0.26, n0:3, dark:0.8,
  rock:[ {u:[0,54], v:[-18,18], y:[-3,34], r:5, follow:true, lift:0.25} ],
  voids:[
    {kind:'tunnel', a:[-5,0], b:[30,0], w:4.8, h:4.2, w1:4.2, h1:3.9},                           // the adit
    {kind:'tunnel', a:[14,0], b:[22,-12], w:3.8, h:3.6},                                         // a branch gallery
    {kind:'chamber', at:[32,2], ru:9, rv:7.5, h:7},                                               // the stope at the end
  ],
  pads:[ {pts:[[-9,-8],[-9,8]], w:10, bank:6} ],                                                 // the platform in front of the portal, cut into the slope
  walk:{under:[[-22,0],[-9,0],[0,0],[14,0],[30,0],[32,2]], top:[[62,0],[44,0],[30,0],[14,0],[4,0]]},   // up to the portal, along the adit, into the stope; over the hill
});
