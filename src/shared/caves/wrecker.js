//@ Cave site 'wrecker': Lantern Isle's wrecker's cave, a low narrow crawl through the isle's hump with a small den and a squeeze
/* Agent map. Atlas position (-1741,-373) on Lantern Isle (WA_SPOTS); low, narrow, dark.  Registered through defineCave (shared/caves.js). Placeholder position: the islet at (-1530,-702) (flat top at 17 m, 32 m across); the re-pointing task moves it to Lantern Isle. Local frame: origin = the islet's middle,
   yaw 0 (+u east, +v south); fy = 1.2 m above the sea. The rock follows the islet's own ground (so its top is whatever the terrain makes it); a tunnel runs through it north-south with a den off to the side; the bar (a pad) runs
   north-west to the Sea Caves' shelf (site 'seacave'). Test: tools/caves-smoke.js. */
defineCave({
  id:'wrecker', name:"The Wrecker's Cave", x:-1741, z:-373, yaw:0, fy:0.9, pal:'dusk', sea:true, inner:5, strata:{period:3,amp:0.28}, rough:0.3, n0:9, dark:0.85,
  rock:[ {u:[-16,16], v:[-34,34], y:[-3,14], r:10, follow:true, lift:0.25} ],
  voids:[
    {kind:'tunnel', a:[0,-42], b:[0,40], w:5, h:3.8, w1:4.4, h1:3.6},                            // a low, narrow crawl through the islet
    {kind:'chamber', at:[4,4], ru:5, rv:4, h:4},                                                  // the den: where the wreckers kept their lanterns
    {kind:'tunnel', a:[0,10], b:[9,18], w:3.6, h:3.4},                                            // a squeeze to a hidden back door
  ],
  pads:[ {pts:[[0,-44]], w:8, bank:5}, {pts:[[0,42]], w:8, bank:5} ],                             // a landing at each mouth
  walk:{under:[[0,-50],[0,-38],[0,-16],[0,-4],[0,4],[4,4]], top:[]},
});
