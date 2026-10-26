//@ Server heightmap over the whole world (coarser than the client's): SEG, HS, getH, grad; the grid is baked into the build (dist/wildwood-server.js and the page) as packed heights (heightbake)
/* Agent map. HS is rawHeight on a grid of about 4 m (889 x 576 = 512,000 vertices, in whole centimetres: hbCompute rounds, so a bake and a fresh computation are the same bytes), about a second of the server's start. The build
   (python3 build.py, tools/bake-heights.js) works it out once and puts it into dist/wildwood-server.js and dist/wildwood.html as HB_BAKE: the heights in cm, each as its difference from the plane through the three neighbours
   (left, up, up-left), zigzag + varint bytes, base64 (about 750 KB; the Float32Array itself would be 2 MB). hbLoad unpacks it (an exact length, then 300 vertices worked out again) and falls back to hbCompute when the bake
   is missing or not this code's grid. Tests (loadServer from src/) have no bake and compute. Test: tools/heightbake-smoke.js. */
const SEG=220, CELL=SIZE/SEG, SEGX=Math.round(WW/CELL), SEGZ=Math.round(WD/CELL), NVX=SEGX+1;
var HB_BAKE=null;   // build.py replaces this null in dist/wildwood-server.js (the exact text `var HB_BAKE=null;`)
function hbCompute(){ const a=new Float32Array(NVX*(SEGZ+1)); for(let iz=0;iz<=SEGZ;iz++) for(let ix=0;ix<NVX;ix++) a[iz*NVX+ix]=(Math.round(rawHeight(WX0+ix*CELL,WZ0+iz*CELL)*100)|0)/100; return a; }   // (|0: a rounded -0 would differ from the bake's 0 by a byte)
// the plane through the left, upper and upper-left vertex (the same rule packs it, tools/bake-heights.js)
function hbLoad(){
  if(typeof HB_BAKE!=='string'||!HB_BAKE) return null;
  let s; try{ s=typeof atob==='function'?atob(HB_BAKE):Buffer.from(HB_BAKE,'base64').toString('latin1'); }catch(e){ return null; }
  const n=NVX*(SEGZ+1), q=new Int32Array(n), a=new Float32Array(n); let pos=0;
  for(let i=0;i<n;i++){
    let z=0, sh=0, c;
    do{ if(pos>=s.length||sh>28) return null; c=s.charCodeAt(pos++); z|=(c&127)<<sh; sh+=7; }while(c>=128);
    const ix=i%NVX, l=ix?q[i-1]:(i>=NVX?q[i-NVX]:0), u=i>=NVX?q[i-NVX]:l, ul=(ix&&i>=NVX)?q[i-NVX-1]:u;
    q[i]=l+u-ul+((z>>>1)^-(z&1)); a[i]=q[i]/100;
  }
  if(pos!==s.length) return null;
  for(let k=0;k<300;k++){ const i=Math.floor(n*((k*0.6180339887)%1)), ix=i%NVX, iz=(i-ix)/NVX; if(!(Math.abs(a[i]-rawHeight(WX0+ix*CELL,WZ0+iz*CELL))<0.01)) return null; }
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
