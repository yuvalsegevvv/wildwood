//@ World map: a map image painted from the terrain, the corner minimap, and the full map (N) of each land (home forest, Sakura Vale, Hoarfrost Reach, Greyspine) with zones, quests, resource nodes and players
/* The map image covers the whole world (both lands) and is painted once, a few rows per frame after the ground is ready:
   terrain colours with hill shading, forests darker, water blue, zone borders, village houses and the boss arenas.
   The minimap shows the 90 m around you (north up, 10 times a second). The full map (N key, map button, or tap the
   minimap) shows one land at a time: the one you are in, or the next one with the button in its header (once the tunnel is open; the Hoarfrost Reach once its ice wall is). */
const MAP={size:LITE?320:(LOW?400:560),canvas:null,ctx:null,img:null,zone:null,row:0,done:false,mmT:0,fullT:0};
MAP.k=MAP.size/SIZE; MAP.w=Math.round(WW*MAP.k); MAP.h=Math.round(WD*MAP.k);   // pixels per metre, image size
const MM_R=90, DPR=Math.min(2,devicePixelRatio||1);
const mapX=x=>(x-WX0)*MAP.k, mapZ=z=>(z-WZ0)*MAP.k;
// the three lands as the full map shows them (the vale's crop ends at its north crest, the Hoarfrost Reach's begins just south of it)
const LANDS={home:{x0:-HALF,x1:HALF,z0:HZ0,z1:HALF,name:'The home forest'},vale:{x0:HALF-40,x1:WX1,z0:HZ0,z1:HALF,name:'The Sakura Vale'},hoar:{x0:HALF+10,x1:WX1,z0:WZ0,z1:HZ0+30,name:'The Hoarfrost Reach'},grey:{x0:WX0,x1:HALF,z0:WZ0,z1:HZ0+30,name:'The Greyspine'}};
let mapLand=null;   // null: the land you are in
const landHere=()=>inHoar(P.x,P.z)?'hoar':inVale(P.x)?'vale':inGrey(P.x,P.z)?'grey':'home';
const landOpen=id=>id==='home'||(id==='vale'&&valeOpen())||(id==='hoar'&&northOpen())||(id==='grey'&&(westOpen()||inGrey(P.x,P.z)));
const landOfZone=zn=>zn.grey?'grey':zn.hoar?'hoar':zn.vale?'vale':'home';
const nextLand=cur=>{ const order=['home','vale','hoar','grey'].filter(landOpen), i=order.indexOf(cur); return order[(i+1)%order.length]; };
function mapInit(){
  const c=document.createElement('canvas'); c.width=MAP.w; c.height=MAP.h;
  MAP.canvas=c; MAP.ctx=c.getContext('2d'); MAP.img=MAP.ctx.createImageData(MAP.w,MAP.h); MAP.zone=new Uint8Array(MAP.w*MAP.h);
}
const _mc=new THREE.Color();
// the map's outline: each land fades out along a wavy line 6-36 m inside its borders, so neither land is drawn as a rectangle
function mapEdgeAlpha(x,z){
  const e=x<HALF?(z<HZ0?Math.min(x-WX0,z-WZ0,HZ0-z,HALF-x):Math.min(x-WX0,z-HZ0,WZ1-z,HALF-x)):Math.min(x-HALF,z-WZ0,WZ1-z,WX1-x);
  const t=6+(noise2(x*0.011+3,z*0.011-5)*0.5+0.5)*26+noise2(x*0.05,z*0.05)*4;
  return clamp((e-t)/6)*255;
}
function mapBuildStep(rows){
  if(MAP.done) return; if(!MAP.canvas) mapInit();
  const N=MAP.w, NZ=MAP.h, d=MAP.img.data, cell=1/MAP.k;
  for(let r=0;r<rows&&MAP.row<NZ;r++,MAP.row++){
    const iz=MAP.row, z=WZ0+(iz+0.5)*cell;
    for(let ix=0;ix<N;ix++){
      const x=WX0+(ix+0.5)*cell, h=getH(x,z), i=(iz*N+ix)*4;
      const dhx=getH(x+cell,z)-getH(x-cell,z), dhz=getH(x,z+cell)-getH(x,z-cell), g=Math.hypot(dhx,dhz)/(2*cell)*2;
      let R,G,B;
      const ws=waterSurf(x,z);
      if(h<ws-0.35){ const k=clamp((ws-h)/(ws>1?1.6:2.6)); R=lerp(0.44,0.18,k); G=lerp(0.66,0.37,k); B=lerp(0.74,0.49,k); }
      else {
        terrainColor(x,z,h,g,_mc);
        let f=1-0.22*smoothstep(0.45,0.85,forestDensity(x,z))*(1-smoothstep(1.5,3,g))*(vDist(x,z)>VR+6?1:0);
        const sh=clamp(1-(dhx+dhz)*0.9/cell*0.35,0.62,1.35);
        R=_mc.r*f*sh; G=_mc.g*f*sh; B=_mc.b*f*sh;
      }
      const zn=zoneAt(x,z); MAP.zone[iz*N+ix]=zn?ZONES.indexOf(zn)+1:0;
      d[i]=clamp(R)*255; d[i+1]=clamp(G)*255; d[i+2]=clamp(B)*255; d[i+3]=mapEdgeAlpha(x,z);
    }
  }
  if(MAP.row<NZ) return;
  // zone borders
  for(let iz=0;iz<NZ-1;iz++) for(let ix=0;ix<N-1;ix++){ const k=iz*N+ix, a=MAP.zone[k]; if(a!==MAP.zone[k+1]||a!==MAP.zone[k+N]){ const i=k*4; d[i]*=0.55; d[i+1]*=0.55; d[i+2]*=0.5; } }
  const x=MAP.ctx; x.putImageData(MAP.img,0,0);
  const s=MAP.k;
  for(const V of VILS){
    for(const H of V.houses){ x.save(); x.translate(mapX(H.x),mapZ(H.z)); x.rotate(-H.rot); x.fillStyle=V===VIL2?'#3e4650':V===VIL3?'#4a3a2a':V===VIL4?'#4a4c52':colHex(H.roof); x.strokeStyle='rgba(0,0,0,.6)'; x.lineWidth=0.8; x.fillRect(-H.w/2*s,-H.d/2*s,H.w*s,H.d*s); x.strokeRect(-H.w/2*s,-H.d/2*s,H.w*s,H.d*s); x.restore(); }
    x.fillStyle='#d8cfb8'; for(const st of V.stalls){ x.beginPath(); x.arc(mapX(st.x),mapZ(st.z),Math.max(1.2,1.6*s),0,TAU); x.fill(); }
    x.strokeStyle='#9fe0ff'; x.lineWidth=Math.max(1,1.2*s); x.beginPath(); x.arc(mapX(V.tele.x),mapZ(V.tele.z),Math.max(2,V.tele.r*s),0,TAU); x.stroke();
  }
  x.strokeStyle='#cfc6b4'; x.lineWidth=Math.max(1,1.2*s); x.setLineDash([2,2]);
  for(const A of ARENAS){ x.beginPath(); x.arc(mapX(A.x),mapZ(A.z),A.r*s,0,TAU); x.stroke(); }
  x.setLineDash([]);
  MAP.done=true;
}
/* ---- markers ---- */
function questTargets(){
  const out=[], D=(GEAR.q&&GEAR.q.defs)||{}, mq=mqTarget(), ms=mqCur();
  if(mq) out.push({x:mq.x,z:mq.z,label:ms.title+' (main quest)',main:true});
  for(const qid in GEAR.q.active){
    const q=D[qid]; if(!q) continue;
    if(GEAR.q.ready.includes(qid)){ const B=vilAt(P.x,P.z).board; out.push({x:B.x,z:B.z,label:q.title+': return to the quest board',ready:true}); continue; }
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
  const s=MAP.k; x.imageSmoothingEnabled=true;
  x.drawImage(MAP.canvas,mapX(P.x)-MM_R*s,mapZ(P.z)-MM_R*s,2*MM_R*s,2*MM_R*s,0,0,W,W);
  const k=W/(2*MM_R), at=(wx,wz)=>[(wx-P.x)*k+W/2,(wz-P.z)*k+W/2], inside=(wx,wz)=>Math.abs(wx-P.x)<MM_R&&Math.abs(wz-P.z)<MM_R;
  for(const m of MONS){ if(m.dead||!inside(m.x,m.z)) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,(m.boss?4.5:m.aggro?2.8:2.1)*DPR,m.boss?'#c86bff':m.aggro?'#ff4a3a':'#e8904a'); }
  for(const r of REMOTES.values()){ if(r.tx===null||!inside(r.x,r.z)) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,3.2*DPR,'#6fb8ff'); }
  if(GEAR.prof) for(const n of NODES){ if(NODE_TAKEN.has(n.i)||nodeBlock(GEAR,n)||!inside(n.x,n.z)) continue; const [a,b]=at(n.x,n.z); dot(x,a,b,2.4*DPR,RES[NODE_KINDS[n.kind].res].col); }   // the nodes of the professions you know
  for(const q of questTargets()){
    if(q.ring) continue;
    const col=q.main?'#c89bff':q.ready?'#9fe08a':'#f2cf5a';
    if(inside(q.x,q.z)){ const [a,b]=at(q.x,q.z); drawDiamond(x,a,b,(q.main?6:5)*DPR,col); }
    else { const ang=Math.atan2(q.x-P.x,-(q.z-P.z)), rr=W/2-9*DPR; x.save(); x.translate(W/2+Math.sin(ang)*rr,W/2-Math.cos(ang)*rr); drawDiamond(x,0,0,(q.main?5:4)*DPR,col); x.restore(); }
  }
  // your view cone and arrow
  x.save(); x.translate(W/2,W/2); x.rotate(-P.yaw); const g=x.createRadialGradient(0,0,0,0,0,W*0.32); g.addColorStop(0,'rgba(255,255,255,.28)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.beginPath(); x.moveTo(0,0); x.arc(0,0,W*0.32,-Math.PI/2-0.6,-Math.PI/2+0.6); x.closePath(); x.fill(); x.restore();
  drawArrow(x,W/2,W/2,-P.face,6.5*DPR,'#fff4d0');
  x.fillStyle='#fff'; x.font=`600 ${10*DPR}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='top'; x.fillText('N',W/2,3*DPR);
}
/* ---- full map ---- */
const mapC=$('#mapC'), mapCX=mapC.getContext('2d'), mapTip=$('#mapTip'), mapLandBtn=$('#mapLand');
let mapView={w:0,h:0};
const viewLand=()=>LANDS[mapLand||landHere()];
function sizeFullMap(){
  renderTierRow(mapLand||landHere());   // (its height is part of the room the map is fitted to)
  const L=viewLand(), ar=(L.x1-L.x0)/(L.z1-L.z0), box=$('#mapBox'), r=box.getBoundingClientRect();
  let w=Math.max(160,Math.floor(r.width)), h=Math.floor(w/ar); if(h>r.height){ h=Math.max(160,Math.floor(r.height)); w=Math.floor(h*ar); }
  mapC.style.width=w+'px'; mapC.style.height=h+'px'; mapC.width=Math.round(w*DPR); mapC.height=Math.round(h*DPR); mapView.w=w; mapView.h=h;
  const here=landHere(), cur=mapLand||here, nx=nextLand(cur);
  mapLandBtn.hidden=!valeOpen()||nx===cur; mapLandBtn.textContent=nx===here?'Where I am':LANDS[nx].name;
}
function drawFullMap(){
  renderTierRow(mapLand||landHere());
  const L=viewLand(), W=mapC.width, H=mapC.height, x=mapCX, k=W/(L.x1-L.x0), at=(wx,wz)=>[(wx-L.x0)*k,(wz-L.z0)*k];
  x.clearRect(0,0,W,H);
  if(!MAP.done){ x.fillStyle='rgba(238,240,226,.7)'; x.font=`${14*DPR}px Inter, system-ui, sans-serif`; x.textAlign='center'; x.fillText('Still mapping the forest…',W/2,H/2); return; }
  x.imageSmoothingEnabled=true; x.drawImage(MAP.canvas,mapX(L.x0),mapZ(L.z0),(L.x1-L.x0)*MAP.k,(L.z1-L.z0)*MAP.k,0,0,W,H);
  const fs=Math.max(9,Math.min(13,W/DPR/48))*DPR, land=L===LANDS.hoar?'hoar':L===LANDS.vale?'vale':L===LANDS.grey?'grey':'home', vale=land==='vale'||land==='hoar', mine=zn=>landOfZone(zn)===land;
  x.textAlign='center'; x.textBaseline='middle';
  const label=(t,cx,cy,size,col,bold)=>{ x.font=`${bold?'600 ':''}${size}px Inter, system-ui, sans-serif`; x.lineWidth=3*DPR; x.strokeStyle='rgba(10,12,10,.75)'; x.strokeText(t,cx,cy); x.fillStyle=col; x.fillText(t,cx,cy); };
  for(const zn of ZONES){ if(zn.boss||!mine(zn)) continue; const [cx,cy]=at(...(zn.label||zonePoint(zn,0,0.5))); label(zn.name,cx,cy-fs*0.55,fs,'#f2f0e4',true); label('Level '+zoneLvText(zn),cx,cy+fs*0.6,fs*0.85,'#ffcf8a'); }
  for(const bd of BOSS_DEFS){ const A=ARENAS.find(a=>a.key===bd.arena); if((A.grey?'grey':A.hoar?'hoar':inVale(A.x)?'vale':'home')!==land) continue; const [cx,cy]=at(A.x,A.z); dot(x,cx,cy,5*DPR,'#c86bff'); label(bd.short,cx,cy-fs*1.3,fs,'#e8b8ff',true); label('Level '+bossLvIn(bd.def,land)+' boss',cx,cy+fs*1.25,fs*0.85,'#ffcf8a'); }
  { const V=land==='grey'?VIL4:land==='hoar'?VIL3:land==='vale'?VIL2:VIL, [cx,cy]=at(V.x,V.z); label(land==='grey'?'Highmark':land==='hoar'?'Rimehold':land==='vale'?'Hanami':'Village',cx,cy-V.r*k-fs*0.2,fs*1.05,'#fff4d0',true); }
  if(land!=='hoar'&&land!=='grey'){ const [cx,cy]=at(vale?TUN.p1:TUN.p0,TUN.z); dot(x,cx,cy,3.5*DPR,valeOpen()?'#9fe0ff':'#8a8078'); label(valeOpen()?'Tunnel':'Tunnel (sealed)',cx+(vale?1:-1)*fs*2.6,cy,fs*0.85,'#e8e0d0'); }
  if(land==='vale'){ const [cx,cy]=at(PASS.x,PASS.ice); dot(x,cx,cy,3.5*DPR,northOpen()?'#9fe0ff':'#8a8078'); label(northOpen()?'Frostgate Pass':'Frostgate Pass (ice wall)',cx-fs*4.6,cy,fs*0.85,'#e8e0d0'); }
  if(land==='hoar'){ const [cx,cy]=at(PASS.x,PASS.z1+50); label('Frostgate Pass',cx-fs*3.6,cy,fs*0.85,'#e8e0d0'); for(const Lk of FROST_LAKES){ const [lx,ly]=at(Lk.x,Lk.z); label(Lk.name,lx,ly,fs*0.85,'#cfe8f6'); }
    if(GEAR.prof) for(const n of NODES){ if(NODE_TAKEN.has(n.i)||nodeBlock(GEAR,n)) continue; const [a,b]=at(n.x,n.z); dot(x,a,b,2.6*DPR,RES[NODE_KINDS[n.kind].res].col); } }   // the nodes of the professions you know
  for(const Lk of LAKES){ if(!!Lk.vale!==(land==='vale')||land==='hoar'||land==='grey') continue; const [cx,cy]=at(Lk.x,Lk.z); label(Lk.name,cx,cy,fs*0.85,'#cfe8f6'); }
  for(const B of BRIDGES){ if(B.kind!=='causeway'||B.name[0]!=='T'||inVale(B.x)!==vale||land==='hoar'||land==='grey') continue; const [cx,cy]=at(B.x,B.z); label(B.name,cx,cy+fs*1.1,fs*0.8,'#cfe8f6'); }   // the named causeways
  // quests
  for(const q of questTargets()){
    if(q.ring){ x.save(); x.setLineDash([5*DPR,5*DPR]); x.strokeStyle='rgba(242,207,90,.8)'; x.lineWidth=1.5*DPR; x.beginPath(); const [cx,cy]=at(VIL.x,VIL.z); x.arc(cx,cy,q.ring*k,0,TAU); x.stroke(); x.restore(); continue; }
    const [cx,cy]=at(q.x,q.z); drawDiamond(x,cx,cy,(q.main?7.5:6)*DPR,q.main?'#c89bff':q.ready?'#9fe08a':'#f2cf5a');
  }
  for(const m of MONS){ if(m.dead||!m.aggro) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,2.4*DPR,'#ff4a3a'); }
  for(const r of REMOTES.values()){ if(r.tx===null) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,4*DPR,'#6fb8ff'); label(r.name,a,b-fs*1.1,fs*0.85,'#cfe6ff'); }
  { const [a,b]=at(P.x,P.z); drawArrow(x,a,b,-P.face,8*DPR,'#fff4d0'); }
  const zn=zoneAt(P.x,P.z), V=vilAt(P.x,P.z);
  const vn=V===VIL4?'Highmark':V===VIL3?'Rimehold':V===VIL2?'Hanami':'the village';
  $('#mapHere').textContent=vDist(P.x,P.z)<VR+12?'You are in '+vn:P.inTun?'You are in the mountain tunnel':zn?(zn.boss?'You are near '+zn.name:'You are in '+zn.name+' (level '+zoneLvText(zn)+')'):inPass(P.x,P.z)?'You are in Frostgate Pass':inGrey(P.x,P.z)?'You are in the Greyspine':'You are near '+vn;
}
function placeName(wx,wz){
  if(vDist(wx,wz)<VR+8) return vilAt(wx,wz)===VIL4?'Highmark':vilAt(wx,wz)===VIL3?'Rimehold':vilAt(wx,wz)===VIL2?'Hanami':'Village';
  for(const L of FROST_LAKES) if(inHoar(wx,wz)&&Math.hypot(wx-L.x,wz-L.z)<L.r*0.8) return L.name+' (frozen)';
  for(const L of LAKES) if(Math.hypot(wx-L.x,wz-L.z)<L.r*0.8) return L.name;
  for(const bd of BOSS_DEFS){ const A=ARENAS.find(a=>a.key===bd.arena); if(Math.hypot(wx-A.x,wz-A.z)<A.r+6) return A.name+': '+bd.def.name+', level '+bossLvIn(bd.def,landAt(A.x,A.z))+' boss'; }
  if(inPass(wx,wz)&&Math.abs(wz-PASS.ice)<6) return northOpen()?'Frostgate Pass (the ice wall has fallen)':'Frostgate Pass: the ice wall (shut until Akaoni falls)';
  if(inPass(wx,wz)&&wz<HZ0+60) return 'Frostgate Pass';
  if(inTunnelCut(wx,wz)&&wx>TUN.p0-4&&wx<TUN.p1+4) return valeOpen()?'The mountain tunnel':'The mountain tunnel (sealed until the Rootwarden falls)';
  const B=bridgeAt(wx,wz,2); if(B) return B.road+' ('+B.name+')';
  const rd=roadAt(wx,wz,3); if(rd) return rd.name;
  const zn=zoneAt(wx,wz); if(zn) return zn.key==='boss'?'Rootwarden Barrens':zn.boss?zn.name:zn.name+': level '+zoneLvText(zn)+' ('+MON_DEFS.filter(d=>defZone(d)===zn).map(d=>d.name).join(', ')+')';
  return edgeName(wx,wz)||(inHoar(wx,wz)?'The snowfields':inGrey(wx,wz)?'The Greyspine':inVale(wx)?'Hanami meadows':'Village meadows');
}
// the lands' edges by their names in docs/WORLD.md (shaped in shared/terrain.js)
function edgeName(x,z){
  if(coastDist(x,z)<40) return 'The Crownsea shore';
  if(inGrey(x,z)){
    if(z-WZ0<62) return 'The spine';
    if(x-WX0<62) return 'The west wall';
    if(HALF-x<62) return 'The Vale Wall';
    if(z>HZ0-62) return 'The Greyspine foothills';
  } else if(!inVale(x)){
    if(Math.abs(z-REDGATE_Z)<16&&x-WX0<REDGATE_CL+45) return 'Redgate Canyon (sealed by a rock fall)';
    if(x-WX0<sunwallLine(z)+18) return 'The Sunwall';
    if(z-HZ0<62) return 'The Greyspine foothills';
    if(HALF-x<60) return 'The Vale Wall';
  } else if(inHoar(x,z)){
    if(x-HALF<60) return 'The Vale Wall';
    if(z-WZ0<62) return 'The glacier wall';
    if(WX1-x<40) return 'The ice cliffs';
    if(z>HZ0-62) return 'The Frostwall';
  } else {
    if(x-HALF<60) return 'The Vale Wall';
    if(z-HZ0<62) return 'The slopes of the Hoarfrost Reach';
  }
  return null;
}
function mapPointer(e){
  const L=viewLand(), r=mapC.getBoundingClientRect(), wx=L.x0+(e.clientX-r.left)/r.width*(L.x1-L.x0), wz=L.z0+(e.clientY-r.top)/r.height*(L.z1-L.z0);
  if(wx<L.x0||wx>L.x1||wz<L.z0||wz>L.z1){ mapTip.hidden=true; return; }
  mapTip.hidden=false; mapTip.textContent=placeName(wx,wz)+' · '+Math.round(Math.hypot(wx-P.x,wz-P.z))+' m '+dirWord(wx-P.x,wz-P.z);
  const br=$('#mapBox').getBoundingClientRect(); mapTip.style.left=(e.clientX-br.left)+'px'; mapTip.style.top=(e.clientY-br.top)+'px';
}
mapC.addEventListener('pointermove',mapPointer); mapC.addEventListener('pointerdown',mapPointer); mapC.addEventListener('pointerleave',()=>{ mapTip.hidden=true; });
mapLandBtn.addEventListener('click',()=>{ const here=landHere(), nx=nextLand(mapLand||here); mapLand=nx===here?null:nx; sizeFullMap(); drawFullMap(); });
function toggleMap(){
  if($('#map').hidden){ mapLand=null; openPanel('map'); sizeFullMap(); drawFullMap(); MAP.fullT=0; }
  else closePanels();
}
$('#bMap').addEventListener('click',e=>{ e.currentTarget.blur(); toggleMap(); });
$('#minimap').addEventListener('click',e=>{ e.currentTarget.blur(); toggleMap(); });
addEventListener('keydown',e=>{ if(kbIs(e.code,'map') && started && !customizing && !e.repeat) toggleMap(); });
addEventListener('resize',()=>{ if(!$('#map').hidden){ sizeFullMap(); drawFullMap(); } });
{ const sz=Math.round((isTouch?104:150)*DPR); mmC.width=mmC.height=sz; }
function updateMap(dt){
  if(Stream.terrainDone && !MAP.done) mapBuildStep(started?(LOW?4:8):(LOW?16:40));
  if(!started) return;
  MAP.mmT-=dt; if(MAP.mmT<=0){ MAP.mmT=0.1; drawMinimap(); }
  if(!$('#map').hidden){ MAP.fullT-=dt; if(MAP.fullT<=0){ MAP.fullT=0.15; drawFullMap(); } }
}
