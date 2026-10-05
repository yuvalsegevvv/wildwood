//@ Glasswell's model: the whole city (the Bowl and its gates, the ruin and its statue, 80 homes, the halls, shops and inns, water, palms) as one group, built from GLASSWELL (shared/sunscar.js)
/* buildGlasswell({x,z,h}) returns a THREE.Group with the city's centre at (x,z) and its floor at height h; the caller adds it to the scene. Nothing in the game calls it yet: the Sunscar
   does not exist (no place in the world, no collision, no people: docs/DESERT-CITY.md section 8, docs/NOT-BUILT.md). tools/city-preview.js draws it from any side.
   The parts (sun-*.js) push painted geometry into C: land (the rim and the floor), out (walls and roofs, villageMat), win (windows, windowMat), glass (black glass), leaf (palm leaves), water. */
const gwGlassMat=new THREE.MeshPhongMaterial({vertexColors:true,shininess:110,specular:0x9aa0c0});
const gwWaterMat=new THREE.MeshPhongMaterial({vertexColors:true,transparent:true,opacity:0.88,shininess:120,specular:0xbfe0e8,depthWrite:false});
function buildGlasswell(o){
  const root=new THREE.Group(), C={root,land:[],out:[],win:[],glass:[],leaf:[],water:[]};
  gwRim(C); gwFloor(C); gwWater(C); gwBridges(C); for(const g of gwGateList()) if(!g.weir) gwGate(C,g); gwWeir(C);
  gwCitadel(C); gwStatue(C); gwWell(C); gwCircle(C);
  gwHomes(C); gwWardensHall(C); gwArchive(C); gwPhysician(C); gwReserved(C);
  gwShops(C); gwMarket(C); gwProps(C);
  const add=(list,mat,shadow)=>{ if(!list.length) return; const m=new THREE.Mesh(merge(list),mat); m.castShadow=m.receiveShadow=shadow!==false; root.add(m); };
  add(C.land,villageMat); add(C.out,villageMat); add(C.win,windowMat); add(C.glass,gwGlassMat); add(C.leaf,matBroadD); add(C.water,gwWaterMat,false);
  root.position.set(o.x,o.h,o.z);
  return root;
}
