//@ Highmark, the Greyspine's village (VIL4): an alpine mining and monastery village on its shelf (GREY_HM), its teleport circle; joins VILS and CIRCLES. Pure.
/* Highmark follows the home village's plan like Hanami and Rimehold (same houses, stalls, anchors and colliders, so every NPC role works the same), on the
   flat bench shared/greyspine.js shapes for it at the North Fork's mouth. The road comes in from the east, from the glacier valley (GLEN). Reaching it
   with gear.west 1 sets gear.west 2 and wakes its circle (CIRCLES, used by the server's warpP and the client's travel window). Defined right after
   hoarfrost.js, before anything that walks VILS at load (roads, the main quest's carts). */
const VIL4=(()=>{
  const H=GREY_HM, h=greyFloor(H.x,H.z)+H.up;
  return layoutVillage({x:H.x,z:H.z,h},{seed:4747,ent:Math.atan2(GLEN.x0+30-H.x,GLEN.z-H.z)});
})();
VIL4.name='Highmark';
VILS.push(VIL4);
CIRCLES.push({id:'highmark',name:'Highmark',land:'The Greyspine',lv:'26-32',V:VIL4,open:g=>g.west>=2,hint:'Walk into Highmark through the glacier valley first'});
