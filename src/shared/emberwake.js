//@ The Emberwake Isles, the eighth land (levels 42-50): its four islands on the atlas's southern strip, the land test's constants and the places the volcano pass plugs into. Pure.
/* Agent map. The plan is /final-zone-plan (project files) and docs/EMBERWAKE.md. The ground is the atlas's strip (docs/world-atlas.py section 13, baked into world-atlas-data.js; waLandId 7), so nothing here
   makes terrain; this file names what stands on it.
   Exports: EW_ISLANDS (the four islands: centre, radii, zones; the volcano's is reserved), EW_HUB (Coralhaven's place: VIL8 stands here in a later step), EW_VOLC (the volcano isle's centre: the far-lands smoke and the
   reserved door sit here), EW_ZONE_KEYS (e42..e48; e49 and e50 are the volcano's). Asking: inIsles(x,z) (terrain.js), landAt(x,z) === 'isles' (tiers.js).
   Used by: tiers.js (the land is in ZTIER_LANDS and ZTIER_SYMBOL_LANDS), far-lands.js. Test: tools/emberwake-smoke.js. Names: ew..., EW_... */
const EW_ISLANDS=[{id:'coralhaven',x:-1100,z:1590,rx:215,rz:190,zones:[42,43]},{id:'jungle',x:-560,z:1650,rx:235,rz:200,zones:[44,45,46]},
  {id:'highland',x:-20,z:1620,rx:225,rz:205,zones:[47,48]},{id:'volcano',x:650,z:1700,rx:255,rz:245,zones:[]}];   // (the volcano isle: separate, no way on foot yet; reserved for the volcano pass)
const EW_HUB={x:WA_HUBS.isles[0],z:WA_HUBS.isles[1]}, EW_VOLC={x:650,z:1700}, EW_ZONE_KEYS=[42,43,44,45,46,47,48];
