//@ The maps in a run: the minimap and the full map draw the dungeon's tiles instead of the world, only the tiles you have walked into (explored), with the objectives, the portal, the boss's hall, the run's monsters and your party
/* agent map
   exports: dgMiniEnter(R) / dgMiniLeave() (run.js), dgMiniSeen() (run.js: a tile was walked into), dgDrawMini(c, x, dpr) (ui/map.js drawMinimap, in a run), dgDrawFullMap(c, x, dpr) (ui/map.js
            drawFullMap, in a run), DG_MINI
   users: ui/map.js (two marked lines); reads DG_RUN (seen tiles), DG_OBJ_KINDS, dgPartyCol (party.js), MM_R and the dot / diamond / arrow helpers of ui/map.js
   test: tools/dungeon-client-smoke.js (the explored canvas grows as tiles are walked into; both maps draw in a run)
   The bake is painted once into a canvas, one pixel a cell (floor by its light, walls dark); the explored canvas copies a tile from it when it is first walked into (R.seen, run.js), and the
   maps draw that, north up like the world's. */
const DG_MINI={full:null,seen:null,n:0};
function dgMiniEnter(R){
  const B=R.B; DG_MINI.n=0; if(!B) return;
  const mk=()=>{ const c=document.createElement('canvas'); c.width=B.w; c.height=B.h; return c; };
  DG_MINI.full=mk(); DG_MINI.seen=mk();
  const x=DG_MINI.full.getContext('2d'); if(!x) return;
  const img=x.createImageData(B.w,B.h), d=img.data, pal=dgPalOf(R.T), fl=new THREE.Color(pal.floor).multiplyScalar(3.2), wl=new THREE.Color(pal.wall).multiplyScalar(1.3);
  for(let i=0;i<B.w*B.h;i++){ const open=!!B.cells[i], c=open?fl:wl; d[i*4]=clamp(c.r)*255; d[i*4+1]=clamp(c.g)*255; d[i*4+2]=clamp(c.b)*255; d[i*4+3]=open?255:200; }
  for(const pr of B.props) if(pr.hz){ const i=Math.floor(pr.z/DG_CELL)*B.w+Math.floor(pr.x/DG_CELL); d[i*4]=170; d[i*4+1]=70; d[i*4+2]=50; }   // hazard spots, reddish
  x.putImageData(img,0,0);
  dgMiniSeen();
}
function dgMiniLeave(){ DG_MINI.full=DG_MINI.seen=null; DG_MINI.n=0; }
function dgMiniSeen(){
  const R=DG_RUN; if(!R||!R.lay||!DG_MINI.seen) return;
  const x=DG_MINI.seen.getContext('2d'); if(!x) return; let n=0;
  x.clearRect(0,0,DG_MINI.seen.width,DG_MINI.seen.height);
  for(let tz=0;tz<R.lay.gh;tz++) for(let tx=0;tx<R.lay.gw;tx++) if(R.seen[tz*R.lay.gw+tx]){ n++; x.drawImage(DG_MINI.full,tx*DG_TC,tz*DG_TC,DG_TC,DG_TC,tx*DG_TC,tz*DG_TC,DG_TC,DG_TC); }
  DG_MINI.n=n;
}
// the marks both maps share. at(wx, wz) -> [px, py] on the canvas; s: pixels per metre; inside(wx, wz): on the canvas
function dgMapMarks(x,at,inside,s,dpr,labels){
  const R=DG_RUN, B=R.B, seenAt=(wx,wz)=>{ const tx=Math.floor((wx-R.ox)/DG_TILE), tz=Math.floor((wz-R.oz)/DG_TILE); return R.lay&&tx>=0&&tz>=0&&tx<R.lay.gw&&tz<R.lay.gh&&!!R.seen[tz*R.lay.gw+tx]; };
  if(B&&B.start){ const wx=R.ox+B.start.x, wz=R.oz+B.start.z; if(inside(wx,wz)){ const [a,b]=at(wx,wz); x.beginPath(); x.arc(a,b,Math.max(3*dpr,2*s),0,TAU); x.strokeStyle='#9fe0ff'; x.lineWidth=2*dpr; x.stroke(); if(labels) labels('Portal',a,b-9*dpr,'#cfefff'); } }
  if(R.boss||(B&&B.boss&&seenAt(R.ox+B.boss.x,R.oz+B.boss.z))){ const wx=R.boss?R.boss.x:R.ox+B.boss.x, wz=R.boss?R.boss.z:R.oz+B.boss.z;
    if(inside(wx,wz)){ const [a,b]=at(wx,wz); x.save(); x.setLineDash([3*dpr,3*dpr]); x.beginPath(); x.arc(a,b,Math.max(5*dpr,DG_BOSS_R*s),0,TAU); x.strokeStyle='#c86bff'; x.lineWidth=1.6*dpr; x.stroke(); x.restore(); if(labels) labels(R.boss?'The boss':'The round hall',a,b,'#e8b8ff'); } }
  for(const o of R.objs.values()){ if(!inside(o.x,o.z)) continue; const [a,b]=at(o.x,o.z), K=DG_OBJ_KINDS[o.kind]||{}; drawDiamond(x,a,b,5*dpr,o.st===2?'#9fe08a':K.col||'#ffd27a'); if(labels) labels(dgObjName(o.kind,R.th),a,b-11*dpr,'#fff4d0'); }
  for(const m of MONS){ if(m.dead||!inside(m.x,m.z)||!seenAt(m.x,m.z)) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,(m.boss?4.5:m.aggro?2.8:2.1)*dpr,m.boss?'#c86bff':m.aggro?'#ff4a3a':'#e8904a'); }
  for(const r of REMOTES.values()){ if(r.tx===null||!inside(r.x,r.z)) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,3.4*dpr,dgPartyCol(r.id)||'#6fb8ff'); if(labels) labels(r.name,a,b-10*dpr,'#cfe6ff'); }
}
function dgDrawMini(c,x,dpr){
  const W=c.width, R=DG_RUN; x.clearRect(0,0,W,W); x.fillStyle='#0b0a09'; x.fillRect(0,0,W,W);
  const k=W/(2*MM_R), at=(wx,wz)=>[(wx-P.x)*k+W/2,(wz-P.z)*k+W/2], inside=(wx,wz)=>Math.abs(wx-P.x)<MM_R&&Math.abs(wz-P.z)<MM_R;
  if(DG_MINI.seen){ x.imageSmoothingEnabled=false; const lx=(P.x-R.ox-MM_R)/DG_CELL, lz=(P.z-R.oz-MM_R)/DG_CELL, n=2*MM_R/DG_CELL; x.drawImage(DG_MINI.seen,lx,lz,n,n,0,0,W,W); }
  dgMapMarks(x,at,inside,k,dpr,null);
  drawArrow(x,W/2,W/2,-P.face,6.5*dpr,'#fff4d0');
  x.fillStyle='#fff'; x.font=`600 ${10*dpr}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='top'; x.fillText('N',W/2,3*dpr);
}
function dgDrawFullMap(c,x,dpr){
  const W=c.width, H=c.height, R=DG_RUN, B=R.B; x.clearRect(0,0,W,H); x.fillStyle='#0b0a09'; x.fillRect(0,0,W,H);
  const sw=B?B.size[0]:288, sh=B?B.size[1]:288, s=Math.min(W/sw,H/sh)*0.94, ox=(W-sw*s)/2, oz=(H-sh*s)/2;
  const at=(wx,wz)=>[ox+(wx-R.ox)*s,oz+(wz-R.oz)*s], inside=(wx,wz)=>wx>=R.ox&&wz>=R.oz&&wx<=R.ox+sw&&wz<=R.oz+sh, fs=Math.max(9,Math.min(13,W/dpr/48))*dpr;
  const label=(txt,a,b,col)=>{ x.font=`600 ${fs}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=3*dpr; x.strokeStyle='rgba(10,12,10,.75)'; x.strokeText(txt,a,b); x.fillStyle=col; x.fillText(txt,a,b); };
  if(DG_MINI.seen){ x.imageSmoothingEnabled=false; x.drawImage(DG_MINI.seen,0,0,B.w,B.h,ox,oz,sw*s,sh*s); }
  dgMapMarks(x,at,inside,s,dpr,label);
  { const [a,b]=at(P.x,P.z); drawArrow(x,a,b,-P.face,8*dpr,'#fff4d0'); }
  const T=R.T, Mi=DG_MISSIONS[R.m]; $('#mapHere').textContent='You are in '+(T?T.name:'a dungeon')+(Mi?' ('+Mi.name+', level '+R.L+')':'')+' · '+DG_MINI.n+' of '+(R.lay?R.lay.cells.length:0)+' rooms explored';
}
