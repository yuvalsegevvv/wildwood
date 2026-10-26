//@ Server heightmap over the whole world (coarser than the client's): SEG, HS, getH, grad; the grid is baked into dist/wildwood-server.js by the build (heightbake)
/* Agent map. HS is rawHeight on a grid of about 6.8 m (177,000 vertices, 0.8 s of the server's 1.7 s start). The build (python3 build.py, tools/bake-heights.js) works it out once and puts it into dist/wildwood-server.js as
   HB_BAKE (base64 of the Float32Array), so the deployed server wakes up faster; hbLoad checks it (the length, then 300 vertices worked out again) and falls back to hbCompute when it is missing or not this code's grid.
   Tests (loadServer from src/) and the page's own server have no bake and compute. Test: tools/heightbake-smoke.js. */
const SEG=220, CELL=SIZE/SEG, SEGX=Math.round(WW/CELL), SEGZ=Math.round(WD/CELL), NVX=SEGX+1;
var HB_BAKE=null;   // build.py replaces this null in dist/wildwood-server.js (the exact text `var HB_BAKE=null;`)
function hbCompute(){ const a=new Float32Array(NVX*(SEGZ+1)); for(let iz=0;iz<=SEGZ;iz++) for(let ix=0;ix<NVX;ix++) a[iz*NVX+ix]=rawHeight(WX0+ix*CELL,WZ0+iz*CELL); return a; }
function hbLoad(){
  if(typeof HB_BAKE!=='string'||!HB_BAKE||typeof Buffer==='undefined') return null;
  const b=Buffer.from(HB_BAKE,'base64'); if(b.length!==NVX*(SEGZ+1)*4) return null;
  const a=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));
  for(let k=0;k<300;k++){ const i=Math.floor(a.length*((k*0.6180339887)%1)), ix=i%NVX, iz=(i-ix)/NVX; if(!(Math.abs(a[i]-rawHeight(WX0+ix*CELL,WZ0+iz*CELL))<0.01)) return null; }
  return a;
}
const HS=hbLoad()||hbCompute();
function getH(x,z){
  if(dgInSlots(x)) return caveGroundY(x,z);   // dungeons: a run's flat floor (the run slots lie east of the world)   // cave: the Deep Cave's floors lie beyond the slots and are not flat (shared/cave-map.js)
  const gx=(x-WX0)/CELL, gz=(z-WZ0)/CELL;
  const ix=clamp(Math.floor(gx),0,SEGX-1), iz=clamp(Math.floor(gz),0,SEGZ-1);
  const fx=clamp(gx-ix), fz=clamp(gz-iz);
  const a=HS[iz*NVX+ix], b=HS[iz*NVX+ix+1], c=HS[(iz+1)*NVX+ix], d=HS[(iz+1)*NVX+ix+1];
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function grad(x,z){ const dx=getH(x+1,z)-getH(x-1,z), dz=getH(x,z+1)-getH(x,z-1); return Math.hypot(dx,dz)*0.5; }
