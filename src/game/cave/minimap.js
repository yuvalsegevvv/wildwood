//@ The maps on a cave floor: the minimap and the full map draw the floor's layout instead of the world, only the cells you have been near (explored), with the lift, the floor's monsters you can see and your party
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (both maps draw on a floor), tools/cave-smoke.js.
   exports: caveMiniEnter(R) / caveMiniLeave() (zone.js), caveMiniMark(i) (zone.js caveSeeAround: cell i was seen), caveMiniFlush() (the explored canvas is rewritten from the marks), caveDrawMini(c, x, dpr) (ui/map.js drawMinimap,
            on a floor), caveDrawFullMap(c, x, dpr) (ui/map.js drawFullMap, on a floor), CAVE_MINI
   users: ui/map.js (two marked lines); reads CAVE_RUN, CAVE_VIEW.L (the baked light: the floor's tone), MM_R and the dot / arrow helpers of ui/map.js
   The floor is painted once into a canvas, one pixel a cell (the floor's tone lit by the baked light, water blue, lava orange, the rock's rim a pale outline); the explored image copies a pixel when its cell is first
   seen (zone.js: 12 m, a clear line), and the maps draw that smoothed, north up like the world's. */
const CAVE_MINI={full:null,seen:null,fullImg:null,seenImg:null,dirty:false};
function caveMiniEnter(R){
  const B=R.B, W=B.w, H=B.h, K=R.K, mk=()=>{ const c=document.createElement('canvas'); c.width=W; c.height=H; return c; };
  CAVE_MINI.full=mk(); CAVE_MINI.seen=mk(); CAVE_MINI.dirty=false;
  const x=CAVE_MINI.full.getContext('2d'), y=CAVE_MINI.seen.getContext('2d'); if(!x||!y) return;
  const img=x.createImageData(W,H), d=img.data, fl=new THREE.Color(K.floor).multiplyScalar(3.6), wl=new THREE.Color(K.wall).multiplyScalar(2.2), L=CAVE_VIEW.L, wat=new THREE.Color(K.water===undefined?0x3a7a9a:K.water).multiplyScalar(1.5), lav=new THREE.Color(K.lava===undefined?0xe0521a:K.lava);
  const openAt=(i,j)=>i<0||j<0||i>=W||j>=H?0:B.open[j*W+i];
  const put=(i,c,a)=>{ d[i*4]=Math.min(1,c.r)*255; d[i*4+1]=Math.min(1,c.g)*255; d[i*4+2]=Math.min(1,c.b)*255; d[i*4+3]=a; };
  const tmp=new THREE.Color();
  for(let j=0;j<H;j++) for(let i=0;i<W;i++){ const k=j*W+i;
    if(B.open[k]){ if(B.lava[k]) put(k,lav,255); else if(B.water[k]) put(k,tmp.copy(wat).multiplyScalar(0.7+(L?Math.min(0.5,L[k*3+2]):0)),255);
      else { tmp.copy(fl); if(L){ tmp.r+=Math.min(0.6,L[k*3]*0.5); tmp.g+=Math.min(0.6,L[k*3+1]*0.5); tmp.b+=Math.min(0.6,L[k*3+2]*0.5); } put(k,tmp,255); } }
    else if(openAt(i+1,j)||openAt(i-1,j)||openAt(i,j+1)||openAt(i,j-1)) put(k,wl,235);
  }
  x.putImageData(img,0,0); CAVE_MINI.fullImg=img; CAVE_MINI.seenImg=y.createImageData(W,H);
}
function caveMiniLeave(){ CAVE_MINI.full=CAVE_MINI.seen=CAVE_MINI.fullImg=CAVE_MINI.seenImg=null; CAVE_MINI.dirty=false; }
function caveMiniMark(i){
  const R=CAVE_RUN, M=CAVE_MINI; if(!R||!M.seenImg) return; const W=R.B.w, s=M.seenImg.data, f=M.fullImg.data, cp=k=>{ if(k<0||k>=W*R.B.h) return; for(let c=0;c<4;c++) s[k*4+c]=f[k*4+c]; };
  cp(i); for(const o of [1,-1,W,-W]) if(!R.B.open[i+o]) cp(i+o);   // (and the rim of rock beside it)
  M.dirty=true;
}
function caveMiniFlush(){ const M=CAVE_MINI; if(!M.dirty||!M.seen) return; const y=M.seen.getContext('2d'); if(y) y.putImageData(M.seenImg,0,0); M.dirty=false; }
// the marks both maps share. at(wx, wz) -> [px, py] on the canvas; s: pixels per metre; inside(wx, wz): on the canvas
function caveMapMarks(x,at,inside,s,dpr,labels){
  const R=CAVE_RUN, B=R.B, seenAt=(wx,wz)=>{ const gx=Math.floor((wx-R.ox)/CAVE_CELL), gz=Math.floor((wz-R.oz)/CAVE_CELL); return gx>=0&&gz>=0&&gx<B.w&&gz<B.h&&!!R.seen[gz*B.w+gx]; };
  { const wx=R.ox+B.lift.x, wz=R.oz+B.lift.z; if(inside(wx,wz)){ const [a,b]=at(wx,wz); x.beginPath(); x.arc(a,b,Math.max(3.4*dpr,2.2*s),0,TAU); x.strokeStyle='#ffd27a'; x.lineWidth=2*dpr; x.stroke(); x.fillStyle='#ffd27a'; x.fillRect(a-1.2*dpr,b-1.2*dpr,2.4*dpr,2.4*dpr); if(labels) labels('Lift',a,b-9*dpr,'#fff0c8'); } }
  for(const m of MONS){ if(m.dead||!inside(m.x,m.z)||!seenAt(m.x,m.z)) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,(m.boss?4.5:m.aggro?2.8:2.1)*dpr,m.boss?'#c86bff':m.aggro?'#ff4a3a':'#e8904a'); }
  for(const r of REMOTES.values()){ if(r.tx===null||!inside(r.x,r.z)) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,3.4*dpr,dgPartyCol(r.id)||'#6fb8ff'); if(labels) labels(r.name,a,b-10*dpr,'#cfe6ff'); }
}
function caveDrawMini(c,x,dpr){
  const W=c.width, R=CAVE_RUN; x.clearRect(0,0,W,W); x.fillStyle='#0b0a09'; x.fillRect(0,0,W,W);
  const k=W/(2*MM_R), at=(wx,wz)=>[(wx-P.x)*k+W/2,(wz-P.z)*k+W/2], inside=(wx,wz)=>Math.abs(wx-P.x)<MM_R&&Math.abs(wz-P.z)<MM_R;
  if(CAVE_MINI.seen){ x.imageSmoothingEnabled=true; const lx=(P.x-R.ox-MM_R)/CAVE_CELL, lz=(P.z-R.oz-MM_R)/CAVE_CELL, n=2*MM_R/CAVE_CELL; x.drawImage(CAVE_MINI.seen,lx,lz,n,n,0,0,W,W); }
  caveMapMarks(x,at,inside,k,dpr,null);
  drawArrow(x,W/2,W/2,-P.face,6.5*dpr,'#fff4d0');
  x.fillStyle='#fff'; x.font=`600 ${10*dpr}px "Alegreya Sans", system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='top'; x.fillText('N',W/2,3*dpr);
}
function caveDrawFullMap(c,x,dpr){
  const W=c.width, H=c.height, R=CAVE_RUN, B=R.B; x.clearRect(0,0,W,H); x.fillStyle='#0b0a09'; x.fillRect(0,0,W,H);
  const sw=B.size[0], sh=B.size[1], s=Math.min(W/sw,H/sh)*0.94, ox=(W-sw*s)/2, oz=(H-sh*s)/2;
  const at=(wx,wz)=>[ox+(wx-R.ox)*s,oz+(wz-R.oz)*s], inside=(wx,wz)=>wx>=R.ox&&wz>=R.oz&&wx<=R.ox+sw&&wz<=R.oz+sh, fs=Math.max(9,Math.min(13,W/dpr/48))*dpr;
  const label=(txt,a,b,col)=>{ x.font=`600 ${fs}px "Alegreya Sans", system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=3*dpr; x.strokeStyle='rgba(10,12,10,.75)'; x.strokeText(txt,a,b); x.fillStyle=col; x.fillText(txt,a,b); };
  if(CAVE_MINI.seen){ x.imageSmoothingEnabled=true; x.drawImage(CAVE_MINI.seen,0,0,B.w,B.h,ox,oz,sw*s,sh*s); }
  caveMapMarks(x,at,inside,s,dpr,label);
  { const [a,b]=at(P.x,P.z); drawArrow(x,a,b,-P.face,8*dpr,'#fff4d0'); }
  let open=0; for(let i=0;i<B.open.length;i++) open+=B.open[i];
  $('#mapHere').textContent='You are on floor '+R.n+', '+R.F.name+' (Lv '+R.F.lv[0]+'-'+R.F.lv[1]+') · '+Math.round(R.seenN/Math.max(1,open)*100)+'% explored';
}
