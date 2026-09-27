//@ World map: a map image painted from the terrain, the corner minimap, and the full map (N) with zones, quests and players
/* The map image is painted once, a few rows per frame after the ground is ready: terrain colours with hill shading,
   forests darker, water blue, zone borders, village houses and the stone circle. The minimap shows the 90 m around
   you (north up, 10 times a second). The full map (N key, map button, or tap the minimap) shows the whole world. */
const MAP={size:LITE?320:(LOW?400:560),canvas:null,ctx:null,img:null,zone:null,row:0,done:false,mmT:0,fullT:0};
const MM_R=90, DPR=Math.min(2,devicePixelRatio||1);
const mapX=x=>(x+HALF)/SIZE*MAP.size;
function mapInit(){
  const c=document.createElement('canvas'); c.width=c.height=MAP.size;
  MAP.canvas=c; MAP.ctx=c.getContext('2d'); MAP.img=MAP.ctx.createImageData(MAP.size,MAP.size); MAP.zone=new Uint8Array(MAP.size*MAP.size);
}
const _mc=new THREE.Color();
function mapBuildStep(rows){
  if(MAP.done) return; if(!MAP.canvas) mapInit();
  const N=MAP.size, d=MAP.img.data, cell=SIZE/N;
  for(let r=0;r<rows&&MAP.row<N;r++,MAP.row++){
    const iz=MAP.row, z=-HALF+(iz+0.5)*cell;
    for(let ix=0;ix<N;ix++){
      const x=-HALF+(ix+0.5)*cell, h=getH(x,z), i=(iz*N+ix)*4;
      const dhx=getH(x+cell,z)-getH(x-cell,z), dhz=getH(x,z+cell)-getH(x,z-cell), g=Math.hypot(dhx,dhz)/(2*cell)*2;
      let R,G,B;
      if(h<-0.35){ const k=clamp(-h/2.6); R=lerp(0.44,0.18,k); G=lerp(0.66,0.37,k); B=lerp(0.74,0.49,k); }
      else {
        terrainColor(x,z,h,g,_mc);
        let f=1-0.22*smoothstep(0.45,0.85,forestDensity(x,z))*(1-smoothstep(1.5,3,g))*(vDist(x,z)>VIL.r+6?1:0);
        const sh=clamp(1-(dhx+dhz)*0.9/cell*0.35,0.62,1.35);
        R=_mc.r*f*sh; G=_mc.g*f*sh; B=_mc.b*f*sh;
      }
      const zn=zoneAt(x,z); MAP.zone[iz*N+ix]=zn?ZONES.indexOf(zn)+1:0;
      d[i]=clamp(R)*255; d[i+1]=clamp(G)*255; d[i+2]=clamp(B)*255; d[i+3]=255;
    }
  }
  if(MAP.row<N) return;
  // zone borders
  for(let iz=0;iz<N-1;iz++) for(let ix=0;ix<N-1;ix++){ const k=iz*N+ix, a=MAP.zone[k]; if(a!==MAP.zone[k+1]||a!==MAP.zone[k+N]){ const i=k*4; d[i]*=0.55; d[i+1]*=0.55; d[i+2]*=0.5; } }
  const x=MAP.ctx; x.putImageData(MAP.img,0,0);
  const s=MAP.size/SIZE;
  for(const H of VIL.houses){ x.save(); x.translate(mapX(H.x),mapX(H.z)); x.rotate(-H.rot); x.fillStyle=colHex(H.roof); x.strokeStyle='rgba(0,0,0,.6)'; x.lineWidth=0.8; x.fillRect(-H.w/2*s,-H.d/2*s,H.w*s,H.d*s); x.strokeRect(-H.w/2*s,-H.d/2*s,H.w*s,H.d*s); x.restore(); }
  x.fillStyle='#d8cfb8'; for(const st of VIL.stalls){ x.beginPath(); x.arc(mapX(st.x),mapX(st.z),Math.max(1.2,1.6*s),0,TAU); x.fill(); }
  x.strokeStyle='#cfc6b4'; x.lineWidth=Math.max(1,1.2*s); x.setLineDash([2,2]); x.beginPath(); x.arc(mapX(ARENA.x),mapX(ARENA.z),ARENA.r*s,0,TAU); x.stroke(); x.setLineDash([]);
  MAP.done=true;
}
/* ---- markers ---- */
function questTargets(){
  const out=[], D=(GEAR.q&&GEAR.q.defs)||{};
  for(const qid in GEAR.q.active){
    const q=D[qid]; if(!q) continue;
    if(GEAR.q.ready.includes(qid)){ const B=VIL.board; out.push({x:B.x,z:B.z,label:q.title+': return to the quest board',ready:true}); continue; }
    const T=questTarget(q); if(T) out.push({x:T.x,z:T.z,label:q.title});
  }
  return out;
}
function drawArrow(x,cx,cy,ang,size,fill){
  x.save(); x.translate(cx,cy); x.rotate(ang); x.beginPath(); x.moveTo(0,-size); x.lineTo(size*0.7,size*0.75); x.lineTo(0,size*0.35); x.lineTo(-size*0.7,size*0.75); x.closePath();
  x.fillStyle=fill; x.strokeStyle='#15120e'; x.lineWidth=Math.max(1.5,size*0.18); x.stroke(); x.fill(); x.restore();
}
function drawDiamond(x,cx,cy,r,fill){ x.beginPath(); x.moveTo(cx,cy-r); x.lineTo(cx+r,cy); x.lineTo(cx,cy+r); x.lineTo(cx-r,cy); x.closePath(); x.fillStyle=fill; x.strokeStyle='#15120e'; x.lineWidth=Math.max(1.2,r*0.3); x.stroke(); x.fill(); }
function dot(x,cx,cy,r,fill){ x.beginPath(); x.arc(cx,cy,r,0,TAU); x.fillStyle=fill; x.fill(); x.strokeStyle='rgba(0,0,0,.7)'; x.lineWidth=Math.max(1,r*0.4); x.stroke(); }
/* ---- minimap ---- */
const mmC=$('#mmC'), mmX=mmC.getContext('2d');
function drawMinimap(){
  const W=mmC.width, x=mmX; x.clearRect(0,0,W,W);
  x.fillStyle='#2a3a4a'; x.fillRect(0,0,W,W);
  if(!MAP.done){ x.fillStyle='rgba(238,240,226,.6)'; x.font=`${12*DPR}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.fillText('Mapping…',W/2,W/2); return; }
  const s=MAP.size/SIZE; x.imageSmoothingEnabled=true;
  x.drawImage(MAP.canvas,mapX(P.x)-MM_R*s,mapX(P.z)-MM_R*s,2*MM_R*s,2*MM_R*s,0,0,W,W);
  const k=W/(2*MM_R), at=(wx,wz)=>[(wx-P.x)*k+W/2,(wz-P.z)*k+W/2], inside=(wx,wz)=>Math.abs(wx-P.x)<MM_R&&Math.abs(wz-P.z)<MM_R;
  for(const m of MONS){ if(m.dead||!inside(m.x,m.z)) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,(m.boss?4.5:m.aggro?2.8:2.1)*DPR,m.boss?'#c86bff':m.aggro?'#ff4a3a':'#e8904a'); }
  for(const r of REMOTES.values()){ if(r.tx===null||!inside(r.x,r.z)) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,3.2*DPR,'#6fb8ff'); }
  for(const q of questTargets()){
    if(q.ring) continue;
    if(inside(q.x,q.z)){ const [a,b]=at(q.x,q.z); drawDiamond(x,a,b,5*DPR,q.ready?'#9fe08a':'#f2cf5a'); }
    else { const ang=Math.atan2(q.x-P.x,-(q.z-P.z)), rr=W/2-9*DPR; x.save(); x.translate(W/2+Math.sin(ang)*rr,W/2-Math.cos(ang)*rr); drawDiamond(x,0,0,4*DPR,q.ready?'#9fe08a':'#f2cf5a'); x.restore(); }
  }
  // your view cone and arrow
  x.save(); x.translate(W/2,W/2); x.rotate(-P.yaw); const g=x.createRadialGradient(0,0,0,0,0,W*0.32); g.addColorStop(0,'rgba(255,255,255,.28)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.beginPath(); x.moveTo(0,0); x.arc(0,0,W*0.32,-Math.PI/2-0.6,-Math.PI/2+0.6); x.closePath(); x.fill(); x.restore();
  drawArrow(x,W/2,W/2,-P.face,6.5*DPR,'#fff4d0');
  x.fillStyle='#fff'; x.font=`600 ${10*DPR}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='top'; x.fillText('N',W/2,3*DPR);
}
/* ---- full map ---- */
const mapC=$('#mapC'), mapCX=mapC.getContext('2d'), mapTip=$('#mapTip');
let mapView={size:0};
function sizeFullMap(){
  const box=$('#mapBox'), r=box.getBoundingClientRect(), sz=Math.max(200,Math.floor(Math.min(r.width,r.height)));
  mapC.style.width=mapC.style.height=sz+'px'; mapC.width=mapC.height=Math.round(sz*DPR); mapView.size=sz;
}
function drawFullMap(){
  const W=mapC.width, x=mapCX, k=W/SIZE, at=(wx,wz)=>[(wx+HALF)*k,(wz+HALF)*k];
  x.clearRect(0,0,W,W);
  if(!MAP.done){ x.fillStyle='rgba(238,240,226,.7)'; x.font=`${14*DPR}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.fillText('Still mapping the forest…',W/2,W/2); return; }
  x.imageSmoothingEnabled=true; x.drawImage(MAP.canvas,0,0,W,W);
  const fs=Math.max(9,Math.min(13,W/DPR/48))*DPR;
  x.textAlign='center'; x.textBaseline='middle';
  const label=(t,cx,cy,size,col,bold)=>{ x.font=`${bold?'600 ':''}${size}px Inter, system-ui, sans-serif`; x.lineWidth=3*DPR; x.strokeStyle='rgba(10,12,10,.75)'; x.strokeText(t,cx,cy); x.fillStyle=col; x.fillText(t,cx,cy); };
  for(const zn of ZONES){ if(zn.key==='boss') continue; const [cx,cy]=at(...zonePoint(zn,0,0.5)); label(zn.name,cx,cy-fs*0.55,fs,'#f2f0e4',true); label('Level '+zn.level,cx,cy+fs*0.6,fs*0.85,'#ffcf8a'); }
  { const [cx,cy]=at(ARENA.x,ARENA.z); dot(x,cx,cy,5*DPR,'#c86bff'); label('The Rootwarden',cx,cy-fs*1.3,fs,'#e8b8ff',true); label('Level 15 boss',cx,cy+fs*1.25,fs*0.85,'#ffcf8a'); }
  { const [cx,cy]=at(VIL.x,VIL.z); label('Village',cx,cy-VIL.r*k-fs*0.2,fs*1.05,'#fff4d0',true); }
  for(const L of LAKES){ const [cx,cy]=at(L.x,L.z); label(L.name,cx,cy,fs*0.85,'#cfe8f6'); }
  // quests
  for(const q of questTargets()){
    if(q.ring){ x.save(); x.setLineDash([5*DPR,5*DPR]); x.strokeStyle='rgba(242,207,90,.8)'; x.lineWidth=1.5*DPR; x.beginPath(); const [cx,cy]=at(VIL.x,VIL.z); x.arc(cx,cy,q.ring*k,0,TAU); x.stroke(); x.restore(); continue; }
    const [cx,cy]=at(q.x,q.z); drawDiamond(x,cx,cy,6*DPR,q.ready?'#9fe08a':'#f2cf5a');
  }
  for(const m of MONS){ if(m.dead||!m.aggro) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,2.4*DPR,'#ff4a3a'); }
  for(const r of REMOTES.values()){ if(r.tx===null) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,4*DPR,'#6fb8ff'); label(r.name,a,b-fs*1.1,fs*0.85,'#cfe6ff'); }
  { const [a,b]=at(P.x,P.z); drawArrow(x,a,b,-P.face,8*DPR,'#fff4d0'); }
  const zn=zoneAt(P.x,P.z);
  $('#mapHere').textContent=vDist(P.x,P.z)<VIL.r+12?'You are in the village':zn?(zn.key==='boss'?'You are near the stone circle':'You are in '+zn.name+' (level '+zn.level+')'):'You are near the village';
}
function placeName(wx,wz){
  if(vDist(wx,wz)<VIL.r+8) return 'Village';
  for(const L of LAKES) if(Math.hypot(wx-L.x,wz-L.z)<L.r*0.8) return L.name;
  if(Math.hypot(wx-ARENA.x,wz-ARENA.z)<ARENA.r+6) return 'Stone circle: The Rootwarden, level 15 boss';
  const zn=zoneAt(wx,wz); if(zn) return zn.key==='boss'?'Rootwarden Barrens':zn.name+': level '+zn.level+' ('+MON_DEFS.find(d=>d.level===zn.key).name+')';
  return Math.max(Math.abs(wx),Math.abs(wz))>HALF-60?'Border mountains':'Village meadows';
}
function mapPointer(e){
  const r=mapC.getBoundingClientRect(), wx=(e.clientX-r.left)/r.width*SIZE-HALF, wz=(e.clientY-r.top)/r.height*SIZE-HALF;
  if(wx<-HALF||wx>HALF||wz<-HALF||wz>HALF){ mapTip.hidden=true; return; }
  mapTip.hidden=false; mapTip.textContent=placeName(wx,wz)+' · '+Math.round(Math.hypot(wx-P.x,wz-P.z))+' m '+dirWord(wx-P.x,wz-P.z);
  const br=$('#mapBox').getBoundingClientRect(); mapTip.style.left=(e.clientX-br.left)+'px'; mapTip.style.top=(e.clientY-br.top)+'px';
}
mapC.addEventListener('pointermove',mapPointer); mapC.addEventListener('pointerdown',mapPointer); mapC.addEventListener('pointerleave',()=>{ mapTip.hidden=true; });
function toggleMap(){
  if($('#map').hidden){ openPanel('map'); sizeFullMap(); drawFullMap(); MAP.fullT=0; }
  else closePanels();
}
$('#bMap').addEventListener('click',e=>{ e.currentTarget.blur(); toggleMap(); });
$('#minimap').addEventListener('click',e=>{ e.currentTarget.blur(); toggleMap(); });
addEventListener('keydown',e=>{ if(e.code==='KeyN' && started && !customizing && !e.repeat) toggleMap(); });
addEventListener('resize',()=>{ if(!$('#map').hidden){ sizeFullMap(); drawFullMap(); } });
{ const sz=Math.round((isTouch?104:150)*DPR); mmC.width=mmC.height=sz; }
function updateMap(dt){
  if(Stream.terrainDone && !MAP.done) mapBuildStep(started?(LOW?4:8):(LOW?16:40));
  if(!started) return;
  MAP.mmT-=dt; if(MAP.mmT<=0){ MAP.mmT=0.1; drawMinimap(); }
  if(!$('#map').hidden){ MAP.fullT-=dt; if(MAP.fullT<=0){ MAP.fullT=0.15; drawFullMap(); } }
}
