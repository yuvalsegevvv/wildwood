//@ The Emberwake Isles' zones e42-e48 (the atlas's zones of land 'isles', one per level) and the zone test ewZoneAt; the volcano's e49-e50 are a later pass. Pure.
/* Agent map. Seven zones for levels 42-48, two monster kinds each (monster-defs.js, zone:'e42'..'e48'). A zone is the atlas's zone of that key (waZone: WA_ZONES, land 'isles'), a circle for camps (zonePoint: x, z, R)
   cut to its cell (ewZoneAt). The walk (docs/EMBERWAKE.md): 42 Black Sand Landing and 43 the Lagoon Shallows on Coralhaven's isle, 44 the Jungle Edge and 45 the Overgrown Plaza (boss Ocelo, W3) on the Jungle Isle,
   46 Cenote Rim and the Drowned Strait (boss Tuila, W3) on the causeway side, 47 the Terrace Slopes and 48 Condor Heights on the Highland Isle. No zone on the shore (20 m) or within 70 m of Coralhaven's hub.
   Exports: EW_ZONE_NAMES, EW_ZONE_OF[42..48] (the ZONES records: key 'e42', flag isles), ewZoneAt(x,z). Used by: zones.js (zoneAt asks inIsles), professions.js, game/world/zone-props.js (zpTheme e42..e48).
   Test: tools/emberwake-smoke.js, tools/zoneprops-smoke.js. Names: ew..., EW_... */
const EW_ZONE_NAMES={42:'Black Sand Landing',43:'The Lagoon Shallows',44:'The Jungle Edge',45:'The Overgrown Plaza',46:'Cenote Rim and the Drowned Strait',47:'The Terrace Slopes',48:'Condor Heights'};
const EW_ZONE_OF={};   // 42..48 -> its ZONES record
for(const k of EW_ZONE_KEYS){ const A=waZoneOfKey('isles',k), zn={key:'e'+k,ring:3,isles:true,x:Math.round(A.x),z:Math.round(A.z),R:Math.round(Math.sqrt(A.area/Math.PI)),name:EW_ZONE_NAMES[k],level:k};
  ZONES.push(zn); EW_ZONE_OF[k]=zn; }
const EW_HUB_R=70;   // the village's own ground has no camps and no zone
function ewZoneAt(x,z){
  if(waCoast(x,z)<20||Math.hypot(x-EW_HUB.x,z-EW_HUB.z)<EW_HUB_R) return null;   // the shore, the sea, and the village
  const Z=waZone(x,z); return Z&&Z.land==='isles'?EW_ZONE_OF[Z.key]||null:null;
}
