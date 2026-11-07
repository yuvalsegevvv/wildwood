//@ Client heightmap over the whole world (WX0..WX1 x WZ0..WZ1): SEG (by device), HS, getH, grad. The server keeps its own coarser copy.
// SEG cells across the home forest's 880 m; the grid keeps the same cell size across the vale (SEGX x SEGZ cells)
const SEG=LITE?240:(LOW?300:440), CELL=SIZE/SEG, SEGX=Math.round(WW/CELL), SEGZ=Math.round(WD/CELL), NVX=SEGX+1, NVZ=SEGZ+1;
const HS = new Float32Array(NVX*NVZ);
/* HS_OK[iz] is 1 once row iz of HS is filled (by a height worker, height-workers.js, or by this thread, hsEnsure). The grid no longer has to be complete before the game is ready (a bigger
   world must not make the start longer): getH over a row that is not in yet works out the four grid points itself with the same rawHeight (and Math.fround, as HS stores them), so the
   answer is the one the grid will give. */
const HS_OK = new Uint8Array(NVZ);
function hsSlow(ix,iz,fx,fz){
  const a=Math.fround(rawHeight(WX0+ix*CELL,WZ0+iz*CELL)), b=Math.fround(rawHeight(WX0+(ix+1)*CELL,WZ0+iz*CELL)), c=Math.fround(rawHeight(WX0+ix*CELL,WZ0+(iz+1)*CELL)), d=Math.fround(rawHeight(WX0+(ix+1)*CELL,WZ0+(iz+1)*CELL));
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function getH(x,z){
  if(dgInSlots(x)) return caveGroundY(x,z);   // cave: a floor's baked ground, else the dungeons' flat floor (shared/cave-map.js)   // dungeons: a run's flat floor (the server's getH does the same; shared/dungeon-slots.js)
  const gx=(x-WX0)/CELL, gz=(z-WZ0)/CELL;
  const ix=clamp(Math.floor(gx),0,SEGX-1), iz=clamp(Math.floor(gz),0,SEGZ-1);
  const fx=clamp(gx-ix), fz=clamp(gz-iz);
  if(!HS_OK[iz]||!HS_OK[iz+1]) return hsSlow(ix,iz,fx,fz);
  const a=HS[iz*NVX+ix], b=HS[iz*NVX+ix+1], c=HS[(iz+1)*NVX+ix], d=HS[(iz+1)*NVX+ix+1];
  return lerp(lerp(a,b,fx), lerp(c,d,fx), fz);
}
function grad(x,z){ const dx=getH(x+1,z)-getH(x-1,z), dz=getH(x,z+1)-getH(x,z-1); return Math.hypot(dx,dz)*0.5; }
