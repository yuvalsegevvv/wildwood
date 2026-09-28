//@ rawHeight: base terrain + zone ridges + village, arena and tunnel flattening. Pure.
function rawHeight(x,z){
  let h=baseHeight(x,z)+zoneRidge(x,z);
  const V=vilAt(x,z), d=Math.hypot(x-V.x,z-V.z); if(d<V.r+24){ h=lerp(h,V.h,smoothstep(V.r+24,V.r+3,d)); }
  for(const A of ARENAS){ const da=Math.hypot(x-A.x,z-A.z); if(da<A.r+22){ h=lerp(h,A.h,smoothstep(A.r+22,A.r+2,da)); } }
  return tunnelCarve(x,z,h);
}
