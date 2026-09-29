//@ rawHeight: base terrain + zone ridges (cut away where a road crosses) + village, arena and tunnel flattening. Pure.
function rawHeight(x,z){
  const zr=zoneRidge(x,z);
  let h=baseHeight(x,z)+(zr>0?zr*smoothstep(ROAD_W+1,ROAD_W+7,roadDist(x,z)):0);
  const V=vilAt(x,z), d=Math.hypot(x-V.x,z-V.z); if(d<V.r+24){ h=lerp(h,V.h,smoothstep(V.r+24,V.r+3,d)); }
  for(const A of ARENAS){ const da=Math.hypot(x-A.x,z-A.z); if(da<A.r+22){ h=lerp(h,A.h,smoothstep(A.r+22,A.r+2,da)); } }
  return tunnelCarve(x,z,h);
}
