//@ The volcano isle's ground: a real stratovolcano laid over the atlas's low dome (crater floor, inner wall, rim, gullied flanks), so Pyrrhax's crater is the top of a mountain. Pure.
/* Agent map (docs/VOLCANO.md)
   owns:    VG (the centre, the crater floor and rim heights and radii), volcanoCut(x,z,h) (the new height over the atlas's ground h; baseHeight in terrain.js calls it), vgRadius(x,z) (the distance from the crater centre with the rim wobble), vgBare(x,z) (no plants on the mountain).
   uses:    noise2, lerp, smoothstep (noise.js / the shared helpers); nothing at load, so it may load straight after terrain.js. The numbers are the atlas's volcano isle (docs/world-atlas.py: 'volcano', 1030, 1905, 235 x 135).
   used by: terrain.js (baseHeight), emberwakezones.js (the arena's flat height is the crater floor's), game/world/terrain-color-isles.js (ash and lava), game/world/volcano-fx.js, far-lands.js.
   test:    tools/volcano-smoke.js, slope-smoke, emberwake-smoke.
   Profile by distance r from the centre: r < floorR the crater floor (flat, the arena sits on it); floorR..rimR the inner wall rising to the rim (a smooth S, steepest 1.0 m per metre, under the 1.2 slope limit);
   rimR..outR the flank, a straight line from the rim down to the atlas's own ground (about 1.0 m per metre at worst), cut by radial gullies; it is laid only on land (a mask on the distance from the coast that fades the mountain out towards the shore, so the coast stays where the atlas put it and stays walkable. */
const VG={x:1030,z:1905,floor:52,floorR:46,rim:92,rimR:88,outR:128,outEW:230};   // outR: the flank's reach north and south (the isle is only 270 m across that way: a cliff there, the coast stays); outEW: east and west, where the isle is wide and the flank is a long slope
function vgRadius(x,z){
  const dx=x-VG.x, dz=z-VG.z, r=Math.sqrt(dx*dx+dz*dz);
  return r+noise2(dx*0.021+11,dz*0.021)*5*smoothstep(30,80,r);   // a ragged rim and flank, a round floor
}
function volcanoCut(x,z,h){
  const dx=x-VG.x, dz=z-VG.z; if(Math.abs(dx)>VG.outEW+30||Math.abs(dz)>VG.outR+30) return h;
  const r=vgRadius(x,z), ca=dx/(Math.sqrt(dx*dx+dz*dz)||1), outR=VG.outR+(VG.outEW-VG.outR)*Math.pow(Math.abs(ca),1.5); if(r>outR) return h;
  const land=Math.max(smoothstep(0,60,waCoast(x,z)),1-smoothstep(VG.rimR,VG.rimR+8,r))*smoothstep(0.2,2,h); if(land<=0) return h;
  let P;
  if(r<VG.floorR) P=VG.floor+noise2(x*0.08,z*0.08)*0.35;
  else if(r<VG.rimR){ const t=(r-VG.floorR)/(VG.rimR-VG.floorR); P=lerp(VG.floor,VG.rim,0.5*t+0.5*t*t*(3-2*t)); }   // (half linear, half S: the wall climbs 40 m in 42 m, about 1.1 at its steepest)
  else {
    const u=(r-VG.rimR)/(outR-VG.rimR), a=Math.atan2(dz,dx), gully=Math.sin(a*9+noise2(dx*0.02,dz*0.02)*5)*3.2*u*(1-u)*4;   // radial gullies, gone at the rim and at the foot
    P=lerp(VG.rim,h,u)+gully;
  }
  return lerp(h,P,land);
}
// the mountain's own ground grows nothing (the jungle's plants and tufts stop at its foot; generation-chunks.js)
const vgBare=(x,z)=>Math.abs(x-VG.x)<VG.outEW&&Math.abs(z-VG.z)<VG.outR&&vgRadius(x,z)<VG.outR-12;
