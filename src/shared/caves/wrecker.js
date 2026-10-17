//@ Cave site 'wrecker': Lantern Isle's wrecker's cave, a small sea cave through a rock islet off the Gloamhorn's south cliff, reached by a sand bar from the Sea Caves' shelf
/* Agent map. Registered through defineCave (shared/caves.js). Placeholder position: the islet at (-1530,-702) (flat top at 17 m, 32 m across); the re-pointing task moves it to Lantern Isle. Local frame: origin = the islet's middle,
   yaw 0 (+u east, +v south); fy = 1.2 m above the sea. The rock follows the islet's own ground (so its top is whatever the terrain makes it); a tunnel runs through it north-south with a den off to the side; the bar (a pad) runs
   north-west to the Sea Caves' shelf (site 'seacave'). Test: tools/caves-smoke.js. */
defineCave({
  id:'wrecker', name:"The Wrecker's Cave", x:-1530, z:-702, yaw:0, fy:1.2, pal:'dusk', sea:true, inner:5, strata:{period:3,amp:0.28}, rough:0.3, n0:9, dark:0.85,
  rock:[ {u:[-19,19], v:[-19,19], y:[-3,18], r:18, follow:true, lift:0.25} ],
  voids:[
    {kind:'tunnel', a:[0.5,-24], b:[-0.5,24], w:7, h:5.8, w1:5, h1:4.6},                         // through the islet, mouth to mouth
    {kind:'chamber', at:[-6,3], ru:7, rv:6, h:7.5},                                              // the den: where the wreckers kept their lanterns
    {kind:'tunnel', a:[-1,9], b:[-13,12], w:3.4, h:3.6},                                         // a crawl to a hidden back door
  ],
  pads:[ {pts:[[0,-15,0],[-7,-24,0],[-19,-39,0.4]], w:7, bank:7} ],                              // the sand bar to the Sea Caves' shelf
  walk:{under:[[-19,-39],[-7,-24],[0,-15],[0,-8],[0,0],[-6,3]], top:[]},   // along the bar, into the tunnel, to the den
});
