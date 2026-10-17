//@ The Gloamhorn's zones m30-m40 (the atlas's zones of land 'gloam', one per level) and its two boss arenas (the Drowned Captain's hold, the lighthouse's forecourt). Pure.
/* Eleven zones for levels 30-40, one or two monster kinds each (docs/areas/gloamhorn.md; the levels climb along the horn, 30 at the neck to 40 at the tip). Each is a cell round one seed on the spine
   (GLOAM_PTS, gloamSpine(t)); the nearest seed wins and the border wobbles with noise, so a zone is a slice across the horn; a zone is a circle for camps (zonePoint: x, z, R) cut to its cell
   (gloamZoneAt). No zone on the cliff's last 10 m, in the lighthouse's keep or at the reserved door. */
const GLOAM_ZONE_NAMES={30:'Wraithwick Heath',31:"Wreckers' Reach",32:'The Cairn Fields',33:'Drowned Meadow',34:'Siren Cliffs',35:'Gallows Down',36:'The Mourning Stones',37:'Banshee Tor',38:'Vault Heath',39:'Gargoyle Crag',40:'Lanternfall',mboss35:'The Sea Caves',mboss40:'The Gloam Light'};
const GLOAM_ZONE_OF={};   // 30..40 -> its ZONES record
for(let k=30;k<=40;k++){ const Z=waZoneOfKey('gloam',k), zn={key:'m'+k,ring:3,vale:true,gloam:true,x:Math.round(Z.x),z:Math.round(Z.z),R:Math.round(Math.sqrt(Z.area/Math.PI)),name:GLOAM_ZONE_NAMES[k],level:k};
  ZONES.push(zn); GLOAM_ZONE_OF[k]=zn; }
function gloamZoneAt(x,z){
  if(waCoast(x,z)<10) return null;   // the shore, the sea
  for(const A of ARENAS) if(A.gloam&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  if(Math.hypot(x-GLOAM_LIGHT.x,z-GLOAM_LIGHT.z)<GLOAM_LIGHT.r+8) return null;
  const Z=waZone(x,z); return Z&&Z.land==='gloam'?GLOAM_ZONE_OF[Z.key]||null:null;
}
/* ---- boss arenas at the atlas's bosses (terrain-height.js flattens an arena to its h): ARENA_M35 the Drowned Captain's hold (the Sea Caves, GLOAM_HOLD), ARENA_M40 the forecourt of the lighthouse (the Gloam Light) ---- */
const ARENA_M35={x:GLOAM_HOLD.x,z:GLOAM_HOLD.z,h:baseHeight(GLOAM_HOLD.x,GLOAM_HOLD.z),r:24,key:'mboss35',name:GLOAM_ZONE_NAMES.mboss35,gloam:true};
const ARENA_M40={x:gloamPoi(40).x,z:gloamPoi(40).z,h:baseHeight(gloamPoi(40).x,gloamPoi(40).z),r:24,key:'mboss40',name:GLOAM_ZONE_NAMES.mboss40,gloam:true};
for(const A of [ARENA_M35,ARENA_M40]){ A.zone={key:A.key,ring:3,vale:true,gloam:true,x:A.x,z:A.z,R:A.r,name:A.name,level:A===ARENA_M35?35:40,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
