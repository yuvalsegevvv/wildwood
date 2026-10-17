//@ The Sunscar placed in the game: Glasswell's model on the Bowl the heightmap carries, its colliders (no water outside the Bowl)
/* Agent map: buildSunscar() is called by generation-setup.js after buildGreyspine. It builds Glasswell (buildGlasswell, buildings-sun.js; noLand: the Bowl's rim and floor are the terrain's own,
   shared/sunland.js + terrain-color-sun.js) at SUN_CITY, registers the circles of VIL5 as colliders (its houses and halls are boxes, which the movement code finds through vilAt), and lays no water:
   no water outside it (the Sunscar has none of its own). Inside the Bowl the water is the model's.
   Test: client-smoke (it builds the world). */
const SUNS={city:null,door:null};
function buildSunscar(){
  const C=SUN_CITY;
  SUNS.city=buildGlasswell({x:C.x,z:C.z,h:C.h,noLand:true}); scene.add(SUNS.city);
  for(const c of VIL5.circles) addCol(c[0],c[1],c[2]);
  // (the Sandglass's door, SUN_DG_DOOR, is built with the other dungeon doors: dgEntSand in buildings-dungeon.js)
}
