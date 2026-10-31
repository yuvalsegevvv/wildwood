//@ The Emberwake Isles' zones e42-e48 (the atlas's zones of land 'isles', one per level) and the zone test ewZoneAt; the volcano's e49-e50 are a later pass. Pure.
/* Agent map. Seven zones for levels 42-48, two monster kinds each (monster-defs.js, zone:'e42'..'e48'). A zone is the atlas's zone of that key (waZone: WA_ZONES, land 'isles'), a circle for camps (zonePoint: x, z, R)
   cut to its cell (ewZoneAt). The walk (docs/EMBERWAKE.md): 42 Black Sand Landing and 43 the Lagoon Shallows on Coralhaven's isle, 44 the Jungle Edge and 45 the Overgrown Plaza (boss Ocelo, W3) on the Jungle Isle,
   46 Cenote Rim and the Drowned Strait (boss Tuila, W3) on the causeway side, 47 the Terrace Slopes and 48 Condor Heights on the Highland Isle. No zone on the shore (20 m) or within 70 m of Coralhaven's hub.
   Exports: EW_ZONE_NAMES, EW_ZONE_OF[42..48] (the ZONES records: key 'e42', flag isles), ewZoneAt(x,z). Used by: zones.js (zoneAt asks inIsles), professions.js, game/world/zone-props.js (zpTheme e42..e48).
   Test: tools/emberwake-smoke.js, tools/zoneprops-smoke.js. Names: ew..., EW_... */
const EW_ZONE_NAMES={42:'Black Sand Landing',43:'The Lagoon Shallows',44:'The Jungle Edge',45:'The Overgrown Plaza',46:'Cenote Rim and the Drowned Strait',47:'The Terrace Slopes',48:'Condor Heights',eboss45:"The Jaguar Court",eboss46:"Tuila's Tidepool"};
const EW_ZONE_OF={};   // 42..48 -> its ZONES record
for(const k of EW_ZONE_KEYS){ const A=waZoneOfKey('isles',k), zn={key:'e'+k,ring:3,isles:true,x:Math.round(A.x),z:Math.round(A.z),R:Math.round(Math.sqrt(A.area/Math.PI)),name:EW_ZONE_NAMES[k],level:k};
  ZONES.push(zn); EW_ZONE_OF[k]=zn; }
const EW_HUB_R=70;   // the village's own ground has no camps and no zone
function ewZoneAt(x,z){
  if(waCoast(x,z)<20||Math.hypot(x-EW_HUB.x,z-EW_HUB.z)<EW_HUB_R||ewWayNear(x,z,30)) return null;   // the shore, the sea, the village and the waystations
  for(const A of ARENAS) if(A.isles&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;   // a boss arena and the ring round it
  const Z=waZone(x,z); return Z&&Z.land==='isles'?EW_ZONE_OF[Z.key]||null:null;
}

/* ---- the Isles' places on the atlas (docs/world-atlas.py section 13, WA_POIS of land 'isles') and the two boss arenas: flat clearings (terrain-height.js flattens an arena to its h).
   ARENA_E45 the Jaguar Court (Ocelo, zone 45: the old plaza's ball court), ARENA_E46 Tuila's tidepool (zone 46, on the strait's shore). EW_DOOR is the Cenote's dungeon door (zone 44), EW_GATES the Seven Gates raid (zone 48). ---- */
const EW_POI=k=>WA_POIS.find(q=>q.land==='isles'&&q.kind===k[0]&&q.zone===k[1]);
const EW_BOSS_POI={45:EW_POI(['boss',45]),46:EW_POI(['boss',46])}, EW_DOOR=EW_POI(['door',44]), EW_GATES=EW_POI(['raid',48]);
const ARENA_E45={x:EW_BOSS_POI[45].x,z:EW_BOSS_POI[45].z,h:baseHeight(EW_BOSS_POI[45].x,EW_BOSS_POI[45].z),r:24,key:'eboss45',name:EW_ZONE_NAMES.eboss45,isles:true};
const ARENA_E46={x:EW_BOSS_POI[46].x,z:EW_BOSS_POI[46].z,h:baseHeight(EW_BOSS_POI[46].x,EW_BOSS_POI[46].z),r:24,key:'eboss46',name:EW_ZONE_NAMES.eboss46,isles:true};
for(const A of [ARENA_E45,ARENA_E46]){ A.zone={key:A.key,ring:3,isles:true,x:A.x,z:A.z,R:A.r,name:A.name,level:A===ARENA_E45?45:46,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
// where nothing is placed at random (camps, resource nodes, plants, props): the village, the waystations, the dungeon's door, the raid and the arenas, with m metres of margin
const EW_KEEP=[[EW_HUB.x,EW_HUB.z,64],[EW_DOOR.x,EW_DOOR.z,24],[EW_GATES.x,EW_GATES.z,46]];
function ewKeepOut(x,z,m){
  if(!inIsles(x,z)) return false;
  for(const k of EW_KEEP){ const r=k[2]+m; if((x-k[0])*(x-k[0])+(z-k[1])*(z-k[1])<r*r) return true; }
  if(ewWayNear(x,z,16+m)) return true;
  for(const A of ARENAS) if(A.isles&&Math.hypot(x-A.x,z-A.z)<A.r+6+m) return true;
  return false;
}
