//@ Cave site 'foothill': a mossy walk-through tunnel with two chambers in the home forest's northern foothills
/* Agent map. Atlas position (100,-81) on the foothills' gentle slope (zone 'foothills' at (42,-131)).  Registered through defineCave (shared/caves.js). Placeholder position (332,-342) on the smooth 0.55 slope north-west of the Greyfall river's bend. Local frame: origin = the middle, +u along the contour (yaw -26
   degrees), +v down the slope; fy = 31.5 m (the land at the origin is 33.2 m). A knoll (a block 8 m tall at the floor) stands on the slope, with its uphill side following the land, and the tunnel goes through it from end to end.
   Test: tools/caves-smoke.js. */
defineCave({
  id:'foothill', name:'The Hollow Knoll', x:100, z:-81, yaw:-0.69, fy:39.4, pal:'forest', sea:false, inner:5, strata:{period:2.4,amp:0.2}, rough:0.28, n0:7, dark:0.7,
  rock:[
    {u:[-30,30], v:[-10,16], y:[-3,5.8], r:6, bevel:2.6},                                          // the mossy knoll
    {u:[-32,32], v:[-18,4], y:[-3,16], r:5, follow:true, lift:0.25},                             // its uphill side is the hill
  ],
  voids:[
    {kind:'tunnel', a:[-36,5], b:[0,-1], w:4.6, h:3.6, w1:4.6, h1:3.6},                              // a bent walk-through tunnel: in, ...
    {kind:'tunnel', a:[0,-1], b:[36,3], w:4.6, h:3.6, w1:4.6, h1:3.6},                               // ... and out
    {kind:'chamber', at:[-12,2], ru:5.5, rv:4.5, h:4.6},                                         // first room
    {kind:'chamber', at:[13,1], ru:6.5, rv:5, h:5.2},                                            // second room
  ],
  pads:[ {pts:[[-35,5]], w:9, bank:4}, {pts:[[35,3]], w:9, bank:4} ],
  walk:{under:[[-44,5],[-35,5],[-22,3],[-12,2],[0,-1],[13,1],[24,2],[35,3],[44,3]], top:[[0,-24],[0,-14],[0,-6],[0,0],[0,4]]},
});
