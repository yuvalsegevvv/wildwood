//@ The atlas of Eldmere in the game: land, zone, coast, borders, roads, water and the smoothed target height from the baked grid (world-atlas-data.js), and the anchors (hubs, gates, bosses, doors, spots...). Pure lookups.
/* Agent map. The plan is docs/world-atlas.py (v5, approved 17 Oct); it bakes src/shared/world-atlas-data.js (`python3 docs/world-atlas.py --js src/shared/world-atlas-data.js`, 40 s).
   Lookups (array reads, no noise; all take x east, z south in metres):
     waLandId(x,z) 0 home 1 vale 2 hoar 3 grey 4 sun 5 gloam 6 amber  (TOTAL: the sea and the islands take the nearest land), waLand(x,z) its name, or null at sea,
     waZoneId(x,z) / waZone(x,z) the zone record {id,land,key,level,x,z,elev,area,entrance} or null (sea, islands),
     waTarget(x,z) the smoothed target height (zone levels blurred over ~100 m; bilinear), waCoast(x,z) metres inland of the coast (negative at sea),
     waBorderDist / waLandBorderDist / waRoadDist / waAnchorDist(x,z) metres to the nearest zone border / land border / road / anchor (cap 500),
     waWaterDist(x,z) signed metres to the nearest lake or river bank (negative inside), waWaterSurf(x,z) its surface height, waWater(x,z) WA_SEA | WA_LAKE | WA_RIVER | WA_ICE | 0.
   Anchors (plain data, as baked): WA_HUBS {land:[x,z]}, WA_GATES, WA_ZONES, WA_POIS, WA_ENTRANCES, WA_SPOTS, WA_ISLANDS, WA_PVP, WA_LAKES, WA_RIVERS, WA_ROADS, WA_ISLES.
   Used by: shared/terrain.js (frame, landAt / inVale / inHoar / inGrey / inSun / inGloam / vilAt / coastDist), shared/world-atlas-ground.js (the ground), tools/atlas-*.js.
   Test: tools/atlas-smoke.js. See it: node tools/atlas-preview.js out.png. Names: wa..., WA_... */
const WA_SEA=1, WA_LAKE=2, WA_RIVER=3, WA_ICE=4;
const WA_LAND_NAMES=WA_ANCHORS.lands;   // ['home','vale','hoar','grey','sun','gloam','amber']
const WA_HUBS=WA_ANCHORS.hubs, WA_GATES=WA_ANCHORS.gates, WA_ZONES=WA_ANCHORS.zones, WA_POIS=WA_ANCHORS.pois, WA_ENTRANCES=WA_ANCHORS.entrances, WA_SPOTS=WA_ANCHORS.spots,
  WA_ISLANDS=WA_ANCHORS.islands, WA_PVP=WA_ANCHORS.pvp, WA_LAKES=WA_ANCHORS.lakes, WA_RIVERS=WA_ANCHORS.rivers, WA_ROADS=WA_ANCHORS.roads, WA_ISLES=WA_ANCHORS.isleislands;   // WA_ISLES: the Emberwake Isles' four islands {id, x, z, rx, rz, zones}
// a layer is delta-coded against the cell above (the first row: against the cell on its left), zig-zag varints, a zero run is 0 + its length
function waDecode(b64,n,Type){
  const s=atob(b64), out=new Type(n); let p=0, i=0;
  const vint=()=>{ let v=0, sh=0, b; do{ b=s.charCodeAt(p++); v+=(b&127)*Math.pow(2,sh); sh+=7; }while(b&128); return v; };
  while(p<s.length&&i<n){ const v=vint(); if(v===0){ let c=vint(); while(c-->0&&i<n) out[i++]=0; } else out[i++]=(v&1)?-((v+1)/2):v/2; }
  return out;
}
function waGridOf(b64,nx,nz,Type){
  const d=waDecode(b64,nx*nz,Type);
  for(let i=1;i<nx;i++) d[i]+=d[i-1];
  for(let i=nx;i<nx*nz;i++) d[i]+=d[i-nx];
  return d;
}
const WA_OWN=waGridOf(WA_LAYERS.own,WA_META.nx,WA_META.nz,Uint8Array), WA_FLAGS=waGridOf(WA_LAYERS.flags,WA_META.nx,WA_META.nz,Uint8Array),
  WA_ZONE=waGridOf(WA_LAYERS.zone,WA_META.nx,WA_META.nz,Uint8Array), WA_WDIST=waGridOf(WA_LAYERS.wdist,WA_META.nx,WA_META.nz,Int16Array),
  WA_CDIST=waGridOf(WA_LAYERS.cdist,WA_META.nx16,WA_META.nz16,Int16Array), WA_BDIST=waGridOf(WA_LAYERS.bdist,WA_META.nx16,WA_META.nz16,Int16Array),
  WA_ADIST=waGridOf(WA_LAYERS.adist,WA_META.nx16,WA_META.nz16,Int16Array), WA_LDIST=waGridOf(WA_LAYERS.ldist,WA_META.nx16,WA_META.nz16,Int16Array), WA_RDIST=waGridOf(WA_LAYERS.rdist,WA_META.nx16,WA_META.nz16,Int16Array),
  WA_TARGET=waGridOf(WA_LAYERS.target,WA_META.nx16,WA_META.nz16,Int16Array), WA_WSURF=waGridOf(WA_LAYERS.wsurf,WA_META.nx16,WA_META.nz16,Int16Array);
// bilinear read of a layer of nodes every 16 m (nx16 x nz16) or 8 m (nx x nz), times k. (Constants in locals-by-name: this runs several times in every height sample.)
const WA_X0=WA_META.x0, WA_Z0=WA_META.z0, WA_NX8=WA_META.nx, WA_NZ8=WA_META.nz, WA_NX16=WA_META.nx16, WA_NZ16=WA_META.nz16, WA_MX16=WA_NX16-1.001, WA_MZ16=WA_NZ16-1.001, WA_MX8=WA_NX8-1.001, WA_MZ8=WA_NZ8-1.001;
function waBil16(A,x,z,k){
  let fx=(x-WA_X0)*0.0625, fz=(z-WA_Z0)*0.0625;
  fx=fx>0?(fx>WA_MX16?WA_MX16:fx):0; fz=fz>0?(fz>WA_MZ16?WA_MZ16:fz):0;   // (clamped to the canvas; a NaN reads the corner)
  const ix=fx|0, iz=fz|0, tx=fx-ix, tz=fz-iz, i=iz*WA_NX16+ix, a=A[i], c=A[i+WA_NX16];
  return (a+(A[i+1]-a)*tx+((c+(A[i+WA_NX16+1]-c)*tx)-(a+(A[i+1]-a)*tx))*tz)*k;
}
function waBil8(A,x,z,k){
  let fx=(x-WA_X0)*0.125, fz=(z-WA_Z0)*0.125;
  fx=fx>0?(fx>WA_MX8?WA_MX8:fx):0; fz=fz>0?(fz>WA_MZ8?WA_MZ8:fz):0;
  const ix=fx|0, iz=fz|0, tx=fx-ix, tz=fz-iz, i=iz*WA_NX8+ix, a=A[i], c=A[i+WA_NX8];
  return (a+(A[i+1]-a)*tx+((c+(A[i+WA_NX8+1]-c)*tx)-(a+(A[i+1]-a)*tx))*tz)*k;
}
const waTarget=(x,z)=>waBil16(WA_TARGET,x,z,0.0625);
const waCoast=(x,z)=>waBil16(WA_CDIST,x,z,0.5);
const waBorderDist=(x,z)=>waBil16(WA_BDIST,x,z,2);
const waLandBorderDist=(x,z)=>waBil16(WA_LDIST,x,z,2);
const waAnchorDist=(x,z)=>waBil16(WA_ADIST,x,z,2);   // metres to the nearest anchor (a hub, gate, boss, door, entrance or spot; cap 500)
const waRoadDist=(x,z)=>waBil16(WA_RDIST,x,z,2);
const waWaterSurf=(x,z)=>waBil16(WA_WSURF,x,z,0.0625);
const waWaterDist=(x,z)=>waBil8(WA_WDIST,x,z,0.5);
function waNode(x,z){   // the nearest 8 m node
  let ix=Math.round((x-WA_X0)*0.125)||0, iz=Math.round((z-WA_Z0)*0.125)||0;
  ix=ix<0?0:ix>=WA_NX8?WA_NX8-1:ix; iz=iz<0?0:iz>=WA_NZ8?WA_NZ8-1:iz; return iz*WA_NX8+ix;
}
const waLandId=(x,z)=>WA_OWN[waNode(x,z)];
const waIsSea=(x,z)=>(WA_FLAGS[waNode(x,z)]&1)===1;
const waLand=(x,z)=>{ const k=waNode(x,z); return (WA_FLAGS[k]&1)?null:WA_LAND_NAMES[WA_OWN[k]]; };
const waIsleKind=(x,z)=>(WA_FLAGS[waNode(x,z)]>>1)&7;   // 0 mainland, 1 skerry, 2 outer isle, 3 barrier island, 4 archipelago, 5 stack, 6 the Proving Isle
const waZoneId=(x,z)=>WA_ZONE[waNode(x,z)]-1;
const waZone=(x,z)=>{ const i=WA_ZONE[waNode(x,z)]-1; return i<0?null:WA_ZONES[i]; };
function waWater(x,z){
  const k=waNode(x,z); if(WA_FLAGS[k]&1) return WA_SEA;
  if(waWaterDist(x,z)>0) return 0;
  const t=WA_FLAGS[k]>>4; if(t) return t===1?WA_LAKE:t===2?WA_RIVER:WA_ICE;
  const nx=WA_NX8; return Math.max(WA_FLAGS[k+1]>>4,WA_FLAGS[k-1]>>4,WA_FLAGS[k+nx]>>4,WA_FLAGS[k-nx]>>4)===3?WA_ICE:WA_RIVER;   // (a bank cell: the water beside it)
}
const waZoneOfKey=(land,key)=>WA_ZONES.find(z=>z.land===land&&String(z.key)===String(key))||null;
