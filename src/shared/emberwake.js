//@ The Emberwake Isles, the eighth land (levels 42-50): its four islands on the atlas's southern strip, joined only by plank bridges, the land test's constants and the places the volcano pass plugs into. Pure.
/* Agent map. The plan is /final-zone-plan (project files) and docs/EMBERWAKE.md. The ground is the atlas's strip (docs/world-atlas.py section 13, baked into world-atlas-data.js; waLandId 7), so nothing here
   makes terrain; this file names what stands on it.
   Exports: EW_ISLANDS (the four islands, west to east: the Landing 42-43, Coralhaven's isle 44-45 with the village and the only circle, the east isle 46-48, the volcano's reserved), EW_HUB (Coralhaven's place: VIL8 stands here in a later step), EW_VOLC (the volcano isle's centre: the far-lands smoke and the
   reserved door sit here), EW_ZONE_KEYS (e42..e48; e49 and e50 are the volcano's), EW_BRIDGE_ROADS (the four roads whose causeways are the isles' bridges), EW_TIDEGATE (where the first bridge's barrier stands). Asking: inIsles(x,z) (terrain.js), landAt(x,z) === 'isles' (tiers.js).
   Used by: tiers.js (the land is in ZTIER_LANDS and ZTIER_SYMBOL_LANDS), far-lands.js. Test: tools/emberwake-smoke.js. Names: ew..., EW_... */
const EW_ISLANDS=WA_ISLES.map(I=>({id:I.id,x:I.x,z:I.z,rx:I.rx,rz:I.rz,zones:I.zones}));   // landing | coralhaven (the village) | eastisle | volcano (reserved), west to east; the atlas's own list, baked by docs/world-atlas.py section 13
const EW_HUB={x:WA_HUBS.isles[0],z:WA_HUBS.isles[1]}, EW_VOLC={x:EW_ISLANDS[3].x,z:EW_ISLANDS[3].z}, EW_ZONE_KEYS=[42,43,44,45,46,47,48];
const EW_BRIDGE_ROADS=['The Tide Road','The Reef Road','The Strait Road','The Ember Road'];   // the atlas's four roads that each cross one strait (Amber cape | the Landing | Coralhaven's isle | the east isle | the volcano): roads.js names their plank causeways
// the Tide Bridge's gate: where the Tide Road (the atlas's road 'Tide') first stands in the isles' own land id (waLandId 7), half a step before it: {x, z, rot (a frame's heading along the road)}. barLocked holds the hiker here until gear.isles is 1 (barriers.js)
const EW_TIDEGATE=(()=>{
  const R=WA_ROADS.find(r=>r.name==='Tide'); if(!R) return null;
  for(let i=1;i<R.pts.length;i++){ const a=R.pts[i-1], b=R.pts[i]; if(waLandId(a[0],a[1])!==7&&waLandId(b[0],b[1])===7){ const dx=b[0]-a[0], dz=b[1]-a[1]; return {x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,rot:Math.atan2(dx,dz)}; } }
  return null;
})();
