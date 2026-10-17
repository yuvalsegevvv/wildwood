//@ Wraithwick, the Gloamhorn's village (VIL6): a fisher-and-wrecker hamlet of stone cottages, cairns and crooked lamps on the heath where the neck pass comes out; its teleport circle; joins VILS and CIRCLES. Pure.
/* Wraithwick follows the home village's plan like Hanami, Rimehold and Highmark (layoutVillage: the same houses, stalls, anchors and colliders, so every NPC role works the same), at the atlas's hub of the Gloamhorn (shared/gloamhorn.js: GLOAM_HUB). The road comes in from the east, out of the pass. Reaching it with gear.neck 1 sets gear.gloam 2 and wakes its circle (CIRCLES, used by
   the server's warpP and the client's travel window). The model is game/village/buildings-gloam.js (buildGloamhorn). Defined right after gloamhorn.js, before anything that walks VILS at load. */
const VIL6=(()=>{
  const x=GLOAM_HUB[0], z=GLOAM_HUB[1], h=baseHeight(x,z);   // the atlas's hub of the Gloamhorn; the road comes in from the Windswept Neck, east
  return layoutVillage({x,z,h},{seed:6161,ent:Math.atan2(GLOAM_GATE.x-x,GLOAM_GATE.z-z)});
})();
VIL6.name='Wraithwick';
VILS.push(VIL6);
CIRCLES.push({id:'wraithwick',name:'Wraithwick',land:'The Gloamhorn',lv:'30-40',V:VIL6,open:g=>g.gloam>=2,hint:'Walk into Wraithwick through the neck pass first'});
