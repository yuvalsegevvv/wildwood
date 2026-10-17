//@ Cave site 'mine': an old mine in the Greyspine, a square-cut straight adit with a side drift and a stope chamber (grey rock)
/* Agent map. Atlas position (-308,-736) on a 0.46 slope in the Greyspine.  Registered through defineCave (shared/caves.js). Placeholder position (-686,-546) on a 0.4-0.6 slope in the Greyspine, clear of every zone, arena and node; the re-pointing task may move it near Miners' Scree.
   Local frame: origin = the portal, +u uphill (yaw 73 degrees: toward the south-south-east), +v to the right; fy = 63.6 m (the land at the portal is 70.3 m: the face is 6.7 m tall). The rock follows the hill (its top is the land) so the
   mouth is a cut face and the tunnel runs under the slope. Test: tools/caves-smoke.js. */
defineCave({
  id:'mine', name:'The Old Mine', x:-308, z:-736, yaw:2.03, fy:56.5, pal:'grey', sea:false, inner:6, strata:{period:2.6,amp:0.22}, rough:0.26, n0:3, dark:0.8,
  rock:[ {u:[0,56], v:[-20,20], y:[-3,40], r:3, follow:true, lift:0.25} ],
  voids:[
    {kind:'tunnel', a:[-5,0], b:[30,0], w:3.8, h:3.4, w1:3.8, h1:3.4},                           // the adit: straight and square-cut (narrow, even)
    {kind:'tunnel', a:[14,0], b:[22,-12], w:3.4, h:3.2},                                         // a drift off to the side
    {kind:'chamber', at:[34,2], ru:9, rv:7.5, h:7},                                               // the stope at the end
  ],
  pads:[ {pts:[[-9,-8],[-9,8]], w:10, bank:6} ],                                                 // the platform in front of the portal
  walk:{under:[[-22,0],[-9,0],[0,0],[14,0],[30,0],[34,2]], top:[[62,0],[44,0],[30,0],[14,0],[4,0]]},
});
