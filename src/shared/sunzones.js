//@ The Sunscar's zones s28-s36 (the atlas's zones of land 'sun', one per level) and its two boss arenas at the atlas's bosses (the Glass Guardian's court, the sand wyrm's pit). Pure.
/* Nine zones for levels 28-36, two monster kinds each (docs/areas/sunscar.md). A zone is the atlas's zone of that level (waZone: WA_ZONES, land 'sun', key 28..36), a circle for camps (zonePoint: x, z, R: the
   record's centre and the radius of its area) cut to its cell (sunZoneAt). The route goes from Glasswell (28 round it, the Springhead Flats) round the land: 29 the Weeping Pan in the west, 30 the Anvil Cliffs
   south-east of the city, 31 the Lantern Wash in the south, 32 the Glass Fields (boss: the Glass Guardian, in the north-west by the Glass River), 33 the Twin Buttes in the far south, 34 the Whitefloor (the
   Sandglass's door), 35 Bellrock and the Cinder Glass in the south-west, 36 the Singing Dunes on the west coast (boss: the sand wyrm, whose fall opens Redgate Canyon). No zone within the city's apron, within
   44 m of the coast or on the Amber link (land 6). */
const SUN_ZONE_NAMES={28:'Springhead Flats',29:'The Weeping Pan',30:'Anvil Cliffs',31:'Lantern Wash',32:'The Glass Fields',33:'Twin Buttes',34:'The Whitefloor',35:'Bellrock',36:'The Singing Dunes',sboss32:"The Guardian's Court",sboss36:"The Wyrm's Pit"};
const SUN_ZONE_OF={};   // 28..36 -> its ZONES record
for(const k of [28,29,30,31,32,33,34,35,36]){ const Z=sunZoneRec(k), zn={key:'s'+k,ring:3,vale:true,sun:true,x:Math.round(Z.x),z:Math.round(Z.z),R:Math.round(Math.sqrt(Z.area/Math.PI))+(k===28?SUN_CITY.r+90:0),name:SUN_ZONE_NAMES[k],level:k};   // (zone 28 is the city's own: its camps lie on the ring beyond the apron, so its circle reaches that far)
  ZONES.push(zn); SUN_ZONE_OF[k]=zn; }
function sunZoneAt(x,z){
  if(waCoast(x,z)<44||Math.hypot(x-SUN_CITY.x,z-SUN_CITY.z)<SUN_CITY.r+90) return null;   // the shore, and the city with its apron
  for(const A of ARENAS) if(A.sun&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  const Z=waZone(x,z); return Z&&Z.land==='sun'?SUN_ZONE_OF[Z.key]||null:null;
}
/* ---- boss arenas: flat clearings at the atlas's bosses (terrain-height.js flattens an arena to its h). ARENA_S32 the Glass Guardian's court (zone 32), ARENA_S36 the sand wyrm's pit (zone 36, by the west coast) ---- */
const SUN_BOSS_POI=z=>WA_POIS.find(q=>q.land==='sun'&&q.kind==='boss'&&q.zone===z);
const ARENA_S32={x:SUN_BOSS_POI(32).x,z:SUN_BOSS_POI(32).z,h:baseHeight(SUN_BOSS_POI(32).x,SUN_BOSS_POI(32).z),r:22,key:'sboss32',name:SUN_ZONE_NAMES.sboss32,sun:true};
const ARENA_S36={x:SUN_BOSS_POI(36).x,z:SUN_BOSS_POI(36).z,h:baseHeight(SUN_BOSS_POI(36).x,SUN_BOSS_POI(36).z),r:24,key:'sboss36',name:SUN_ZONE_NAMES.sboss36,sun:true};
for(const A of [ARENA_S32,ARENA_S36]){ A.zone={key:A.key,ring:3,vale:true,sun:true,x:A.x,z:A.z,R:A.r,name:A.name,level:A===ARENA_S32?32:36,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
