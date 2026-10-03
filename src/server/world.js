//@ Server heightmap over the whole world (coarser than the client's): SEG, HS, getH, grad
const SEG=220, CELL=SIZE/SEG, SEGX=Math.round(WW/CELL), SEGZ=Math.round(WD/CELL), NVX=SEGX+1, HS=new Float32Array(NVX*(SEGZ+1));
for(let iz=0;iz<=SEGZ;iz++) for(let ix=0;ix<NVX;ix++) HS[iz*NVX+ix]=rawHeight(WX0+ix*CELL,WZ0+iz*CELL);
function getH(x,z){
  if(dgInSlots(x)) return DG_FLOOR_Y;   // dungeons: a run's flat floor (the run slots lie east of the world)
  const gx=(x-WX0)/CELL, gz=(z-WZ0)/CELL;
  const ix=clamp(Math.floor(gx),0,SEGX-1), iz=clamp(Math.floor(gz),0,SEGZ-1);
  const fx=clamp(gx-ix), fz=clamp(gz-iz);
  const a=HS[iz*NVX+ix], b=HS[iz*NVX+ix+1], c=HS[(iz+1)*NVX+ix], d=HS[(iz+1)*NVX+ix+1];
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function grad(x,z){ const dx=getH(x+1,z)-getH(x-1,z), dz=getH(x,z+1)-getH(x,z-1); return Math.hypot(dx,dz)*0.5; }
