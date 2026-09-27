//@ Client heightmap: SEG (by device), HS, getH, grad. The server keeps its own coarser copy.
const SEG=LITE?240:(LOW?300:440), NV=SEG+1, CELL=SIZE/SEG;
const HS = new Float32Array(NV*NV);
function getH(x,z){
  const gx=(x+HALF)/CELL, gz=(z+HALF)/CELL;
  const ix=clamp(Math.floor(gx),0,SEG-1), iz=clamp(Math.floor(gz),0,SEG-1);
  const fx=clamp(gx-ix), fz=clamp(gz-iz);
  const a=HS[iz*NV+ix], b=HS[iz*NV+ix+1], c=HS[(iz+1)*NV+ix], d=HS[(iz+1)*NV+ix+1];
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function grad(x,z){ const dx=getH(x+1,z)-getH(x-1,z), dz=getH(x,z+1)-getH(x,z-1); return Math.hypot(dx,dz)*0.5; }
