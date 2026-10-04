//@ rawHeight: base terrain + zone ridges (cut away where a road crosses) + village, arena, Frostgate Pass and glacier valley flattening. Pure.
function rawHeight(x,z){
  const zr=zoneRidge(x,z);
  const b=baseHeight(x,z);
  let h=b+(zr>0?zr*smoothstep(ROAD_W+1,ROAD_W+7,roadDist(x,z))*smoothstep(-3,1.5,b):0);   // (no zone ridge stands in the sea: the zones' walls end at the shore)
  const V=vilAt(x,z), d=Math.hypot(x-V.x,z-V.z); if(d<V.r+24){ h=lerp(h,V.h,smoothstep(V.r+24,V.r+3,d)); }
  for(const A of ARENAS){ const da=Math.hypot(x-A.x,z-A.z); if(da<A.r+22){ h=lerp(h,A.h,smoothstep(A.r+22,A.r+2,da)); } }
  return glenCarve(x,z,passCarve(x,z,h));
}
