//@ The Greyspine's zones 26-32 (the atlas's zones of the Greyspine) and its two boss arenas (the Gryphon Queen's peak, the golem's cavern). Pure.
/* Seven zones for levels 26-32, two monster kinds each (docs/WORLD.md: the Greyspine is a short range, mostly a crossroads). Each is the atlas's zone of the same level in the land 'grey' (WA_ZONES): a zone is a circle for
   camps (zonePoint: x, z, R) round the atlas's heart spot of the zone (WA_SPOTS, heart), cut to the atlas's own cell by greyZoneAt. The route climbs from Highmark (zone 26 is its own, the village's) through the ledges and
   the cirque to the Sink: the mid boss (29, the Gryphon Queen) has her peak and the last one (32, the mountain golem) his cavern at the atlas's two bosses of the land. */
const GREY_ZONE_NAMES={26:'Highmark Pastures',27:'The Ledgeway',28:"Miners' Scree",29:'Gryphon Cirque',30:'Stone Meadow',31:'The Windswept Neck',32:'The Sink',boss29:"The Gryphon Queen's Peak",boss32:"The Golem's Cavern"};
const GREY_ZN=new Map();   // the atlas's zone id -> its ZONES entry
for(let k=26;k<=32;k++){
  const Z=waZoneOfKey('grey',k), H=WA_SPOTS.find(s=>s.land==='grey'&&s.zone===k&&s.heart)||Z;
  const zn={key:'g'+k,ring:3,vale:true,grey:true,x:Math.round(H.x),z:Math.round(H.z),R:Math.round(Math.sqrt(Z.area/Math.PI)*0.8),name:GREY_ZONE_NAMES[k],level:k};
  ZONES.push(zn); GREY_ZN.set(Z.id,zn);
}
function greyZoneAt(x,z){
  for(const A of ARENAS) if(A.grey&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  return GREY_ZN.get(waZoneId(x,z))||null;
}
/* ---- boss arenas at the atlas's bosses (northArena, hoarfrost.js: the pad stands on the best spot within 70 m of the anchor): ARENA29 the Gryphon Queen's peak, ARENA32 the golem's cavern.
   GREY_QUEEN (greyspine.js) is moved onto ARENA29 so its users (the dev teleports, the nest's mesh) see the arena. ---- */
const ARENA29=northArena("The Gryphon Queen's Peak",'boss29',GREY_ZONE_NAMES.boss29,29,'grey');
const ARENA32=northArena("The Golem's Cavern",'boss32',GREY_ZONE_NAMES.boss32,32,'grey');
GREY_QUEEN.x=ARENA29.x; GREY_QUEEN.z=ARENA29.z; GREY_QUEEN.h=ARENA29.h;
