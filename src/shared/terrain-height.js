//@ rawHeight: base terrain + zone ridges + village and arena flattening. Pure.
function rawHeight(x,z){ let h=baseHeight(x,z)+zoneRidge(x,z); const d=vDist(x,z); if(d<VIL.r+24){ h=lerp(h,VIL.h,smoothstep(VIL.r+24,VIL.r+3,d)); } const da=Math.hypot(x-ARENA.x,z-ARENA.z); if(da<ARENA.r+22){ h=lerp(h,ARENA.h,smoothstep(ARENA.r+22,ARENA.r+2,da)); } return h; }
