//@ rawHeight: the atlas's ground (baseHeight) + the flattening round a village and a boss arena standing on it. Pure.
const WA_PAD_OK=new Map();   // a pad (village or arena) -> whether it sits on the ground it was made for
function waPadOk(P){ let v=WA_PAD_OK.get(P); if(v===undefined){ v=Math.abs(P.h-baseHeight(P.x,P.z))<10; WA_PAD_OK.set(P,v); } return v; }
function rawHeight(x,z){
  let h=baseHeight(x,z);
  /* A village's and an arena's flat pad is only laid where the ground under its centre is within 10 m of its height (waPadOk, decided once per pad): the content modules are still placed in the OLD
     frame, and a pad that landed on other ground would be a mesa. When a land is re-pointed to the atlas's anchors its pads sit right again. (The old zone ridges, Frostgate Pass and the glacier
     valley cuts are gone: the borders are the atlas's, world-atlas-ground.js.) */
  for(const V of VILS){ const dx=x-V.x, dz=z-V.z, r=V.r+24; if(dx*dx+dz*dz<r*r&&!V.bowl&&waPadOk(V)){ h=lerp(h,V.h,smoothstep(r,V.r+3,Math.hypot(dx,dz))); } }   // (every village, not the point's land's: a pad must not stop at a land border; V.bowl: Glasswell's ground is the Bowl itself, sunHook)
  for(const A of ARENAS){ const dx=x-A.x, dz=z-A.z, r=A.r+22; if(dx*dx+dz*dz<r*r&&waPadOk(A)){ h=lerp(h,A.h,smoothstep(r,A.r+2,Math.hypot(dx,dz))); } }
  h=sunBowlHook(x,z,h);   // sunscar: Glasswell's Bowl is carried by the heightmap (shared/sunland.js), laid over the atlas's ground at the Sunscar hub
  return cvFloorCarve(x,z,h);   // caves: floor (the sites' walking floors; shared/caves.js)
}
