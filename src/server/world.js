//@ Server heightmap (coarser than the client's): SEG, HS, getH, grad
const SEG=220, NV=SEG+1, CELL=SIZE/SEG, HS=new Float32Array(NV*NV);
for(let iz=0;iz<NV;iz++) for(let ix=0;ix<NV;ix++) HS[iz*NV+ix]=rawHeight(-HALF+ix*CELL,-HALF+iz*CELL);
function getH(x,z){
  const gx=(x+HALF)/CELL, gz=(z+HALF)/CELL;
  const ix=clamp(Math.floor(gx),0,SEG-1), iz=clamp(Math.floor(gz),0,SEG-1);
  const fx=clamp(gx-ix), fz=clamp(gz-iz);
  const a=HS[iz*NV+ix], b=HS[iz*NV+ix+1], c=HS[(iz+1)*NV+ix], d=HS[(iz+1)*NV+ix+1];
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function grad(x,z){ const dx=getH(x+1,z)-getH(x-1,z), dz=getH(x,z+1)-getH(x,z-1); return Math.hypot(dx,dz)*0.5; }
