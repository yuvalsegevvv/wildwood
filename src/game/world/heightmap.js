//@ Client heightmap over the whole world (WX0..WX1 x WZ0..WZ1): SEG (by device), HS, getH, grad. The server keeps its own coarser copy.
// SEG cells across the home forest's 880 m; the grid keeps the same cell size across the vale (SEGX x SEGZ cells)
const SEG=LITE?240:(LOW?300:440), CELL=SIZE/SEG, SEGX=Math.round(WW/CELL), SEGZ=Math.round(WD/CELL), NVX=SEGX+1, NVZ=SEGZ+1;
const HS = new Float32Array(NVX*NVZ);
function getH(x,z){
  if(dgInSlots(x)) return DG_FLOOR_Y;   // dungeons: a run's flat floor (the server's getH does the same; shared/dungeon-slots.js)
  const gx=(x-WX0)/CELL, gz=(z-WZ0)/CELL;
  const ix=clamp(Math.floor(gx),0,SEGX-1), iz=clamp(Math.floor(gz),0,SEGZ-1);
  const fx=clamp(gx-ix), fz=clamp(gz-iz);
  const a=HS[iz*NVX+ix], b=HS[iz*NVX+ix+1], c=HS[(iz+1)*NVX+ix], d=HS[(iz+1)*NVX+ix+1];
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function grad(x,z){ const dx=getH(x+1,z)-getH(x-1,z), dz=getH(x,z+1)-getH(x,z-1); return Math.hypot(dx,dz)*0.5; }
