//@ Cave site 'foothill': a small walk-through cave in the home forest's northern foothills, a mossy rock knoll on the slope with one tunnel through it and a chamber in the middle
/* Agent map. Registered through defineCave (shared/caves.js). Placeholder position (332,-342) on the smooth 0.55 slope north-west of the Greyfall river's bend. Local frame: origin = the middle, +u along the contour (yaw -26
   degrees), +v down the slope; fy = 31.5 m (the land at the origin is 33.2 m). A knoll (a block 8 m tall at the floor) stands on the slope, with its uphill side following the land, and the tunnel goes through it from end to end.
   Test: tools/caves-smoke.js. */
defineCave({
  id:'foothill', name:'The Hollow Knoll', x:332, z:-342, yaw:-0.454, fy:31.5, pal:'forest', sea:false, inner:5, strata:{period:2.4,amp:0.2}, rough:0.28, n0:7, dark:0.7,
  rock:[
    {u:[-14,14], v:[-9,9], y:[-3,8], r:6, bevel:2.6},                                            // the knoll
    {u:[-15,15], v:[-16,2], y:[-3,14], r:5, follow:true, lift:0.25},                              // its uphill side is the hill
  ],
  voids:[
    {kind:'tunnel', a:[-20,0], b:[20,0], w:5, h:4.3, w1:5, h1:4.3},                              // through, end to end
    {kind:'chamber', at:[0,-1], ru:6, rv:5.2, h:6.2},                                             // the room in the middle
  ],
  pads:[ {pts:[[-19,0]], w:9, bank:4}, {pts:[[19,0]], w:9, bank:4} ],                              // a landing at each mouth
  walk:{under:[[-28,0],[-19,0],[-8,0],[0,0],[8,0],[19,0],[28,0]], top:[[0,-24],[0,-14],[0,-6],[0,0],[0,4]]},   // through, end to end; over the knoll
});
