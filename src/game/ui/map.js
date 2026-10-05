//@ Map: a map image painted from the terrain, the corner minimap, and the full map (N) of each land (home forest, Sakura Vale, Hoarfrost Reach, Greyspine) with zones, quests, resource nodes and players
/* The map image covers the whole world (all four lands, the Greyspine's peaks and tarns included) and is painted once, a few rows per frame after the ground is ready:
   terrain colours with hill shading, forests darker, water blue, zone borders, village houses and the boss arenas.
   The minimap shows the 90 m around you (north up, 10 times a second) wherever you are, the Greyspine too. The full map (N key, map button, or tap the
   minimap) shows one land at a time (its "World" button opens the world map of Eldmere, G: ui/world-map.js, which opens any of these): the one you are in, or the next one with the button in its header (once the bridge is open; the Hoarfrost Reach once its ice wall is;
   the Greyspine once the glacier valley's ice fall is, `westOpen`, or while you stand in it: `landOpen`). The Greyspine's map names its zones, bosses, Highmark, tarns and
   fjord, the Blackseam's door and the two rock falls in the west wall, and carries the zone-tier row like the other lands. Test: tools/client-smoke.js. */
const MAP={size:LITE?320:(LOW?400:560),canvas:null,ctx:null,img:null,zone:null,row:0,done:false,mmT:0,fullT:0,kind:null,ink:false,ic:0,icz:0};   // kind / ink / ic / icz: the painter's masks and stages (ui/map-paint.js)
MAP.k=MAP.size/SIZE; MAP.w=Math.round(WW*MAP.k); MAP.h=Math.round(WD*MAP.k);   // pixels per metre, image size
const MM_R=90, DPR=Math.min(2,devicePixelRatio||1);
const mapX=x=>(x-WX0)*MAP.k, mapZ=z=>(z-WZ0)*MAP.k;
// the three lands as the full map shows them (the vale's crop ends at its north crest, the Hoarfrost Reach's begins just south of it)
// (the borders wander: the river bulges the vale 210 m west of x = HALF and the north walls move up to 120 m either side of z = HZ0, so the crops are wider than the old rectangles; the Reach lies over the forest's east half too, from the Glacier Wall, GXJ, to the vale's east edge, but its built part, the zones, Rimehold and the pass, is x 100-640 (docs/WORLD.md section 8): the map crops to x 0-720 so the labels have room; the empty land beyond is on the world map only)
const LANDS={home:{x0:-HALF,x1:HALF+40,z0:HZ0,z1:HALF,name:'The home forest'},vale:{x0:HALF-230,x1:VALE_E+90,z0:HZ0-125,z1:HALF,name:'The Sakura Vale'},hoar:{x0:0,x1:720,z0:WZ0,z1:HZ0+110,name:'The Hoarfrost Reach'},grey:{x0:WX0,x1:GXJ+115,z0:WZ0,z1:HZ0+105,name:'The Greyspine'}};
let mapLand=null;   // null: the land you are in
const landHere=()=>inHoar(P.x,P.z)?'hoar':inVale(P.x,P.z)?'vale':inGrey(P.x,P.z)?'grey':'home';
const landOpen=id=>id==='home'||(id==='vale'&&valeOpen())||(id==='hoar'&&northOpen())||(id==='grey'&&(westOpen()||inGrey(P.x,P.z)));
const landOfZone=zn=>zn.grey?'grey':zn.hoar?'hoar':zn.vale?'vale':'home';
const nextLand=cur=>{ const order=['home','vale','hoar','grey'].filter(landOpen), i=order.indexOf(cur); return order[(i+1)%order.length]; };
function mapInit(){
  const c=document.createElement('canvas'); c.width=MAP.w; c.height=MAP.h;
  MAP.canvas=c; MAP.ctx=c.getContext('2d'); MAP.img=MAP.ctx.createImageData(MAP.w,MAP.h); MAP.zone=new Uint8Array(MAP.w*MAP.h);
}
// the map's outline: the world fades out along a wavy line 6-36 m inside its edge, so it is not drawn as a rectangle (the lands' borders are not outlined)
function mapEdgeAlpha(x,z){
  const e=Math.min(x-WX0,z-WZ0,WZ1-z,WX1-x);   // (only the world's own edge fades, over the sea: the border between two lands is painted like the rest, no grey band between them)
  const t=6+(noise2(x*0.011+3,z*0.011-5)*0.5+0.5)*26+noise2(x*0.05,z*0.05)*4;
  return clamp((e-t)/6)*255;
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
  if(dgIn()){ dgDrawMini(mmC,mmX,DPR); return; }   // dungeons: the run's explored tiles instead of the world (dungeon/minimap.js)
  const W=mmC.width, x=mmX; x.clearRect(0,0,W,W);
  x.fillStyle='#16486c'; x.fillRect(0,0,W,W);   // (the deep sea of the world map, where the picture ends)
  if(!MAP.done){ x.fillStyle='rgba(247,238,214,.8)'; x.font=`italic ${12*DPR}px Georgia, serif`; x.textAlign='center'; x.fillText('Mapping…',W/2,W/2); mapStFrame(x,W,W,DPR); return; }
  const s=MAP.k; x.imageSmoothingEnabled=true;
  x.drawImage(MAP.canvas,mapX(P.x)-MM_R*s,mapZ(P.z)-MM_R*s,2*MM_R*s,2*MM_R*s,0,0,W,W);
  const k=W/(2*MM_R), at=(wx,wz)=>[(wx-P.x)*k+W/2,(wz-P.z)*k+W/2], inside=(wx,wz)=>Math.abs(wx-P.x)<MM_R&&Math.abs(wz-P.z)<MM_R;
  for(const m of MONS){ if(m.dead||!inside(m.x,m.z)) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,(m.boss?4.5:m.aggro?2.8:2.1)*DPR,m.boss?'#c86bff':m.aggro?'#ff4a3a':'#e8904a'); }
  for(const r of REMOTES.values()){ if(r.tx===null||!inside(r.x,r.z)) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,3.2*DPR,dgPartyCol(r.id)||'#6fb8ff'); }   // dungeons: party members in their colour (dungeon/party.js)
  if(GEAR.prof) for(const n of NODES){ if(NODE_TAKEN.has(n.i)||nodeBlock(GEAR,n)||!inside(n.x,n.z)) continue; const [a,b]=at(n.x,n.z); dot(x,a,b,2.4*DPR,RES[NODE_KINDS[n.kind].res].col); }   // the nodes of the professions you know
  dgEntMiniMarks(x,at,inside,DPR);   // dungeons: a door in range
  for(const q of questTargets()){
    if(q.ring) continue;
    const col=q.main?'#c89bff':q.ready?'#9fe08a':'#f2cf5a';
    if(inside(q.x,q.z)){ const [a,b]=at(q.x,q.z); drawDiamond(x,a,b,(q.main?6:5)*DPR,col); }
    else { const ang=Math.atan2(q.x-P.x,-(q.z-P.z)), rr=W/2-9*DPR; x.save(); x.translate(W/2+Math.sin(ang)*rr,W/2-Math.cos(ang)*rr); drawDiamond(x,0,0,(q.main?5:4)*DPR,col); x.restore(); }
  }
  // your view cone and the red pin (the world map's), then the compass rose and the frame
  x.save(); x.translate(W/2,W/2); x.rotate(-P.yaw); const g=x.createRadialGradient(0,0,0,0,0,W*0.32); g.addColorStop(0,'rgba(255,248,214,.4)'); g.addColorStop(1,'rgba(255,248,214,0)');
  x.fillStyle=g; x.beginPath(); x.moveTo(0,0); x.arc(0,0,W*0.32,-Math.PI/2-0.6,-Math.PI/2+0.6); x.closePath(); x.fill(); x.restore();
  mapStPin(x,W/2,W/2,4.6*DPR,-P.face);
  mapStCompass(x,W-17*DPR,24*DPR,8*DPR);
  mapStFrame(x,W,W,DPR);
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
  $('#mapWorld').hidden=dgIn();   // world map: Eldmere's map is for the world, not a run (ui/world-map.js)
}
function drawFullMap(){
  if(dgIn()){ dgDrawFullMap(mapC,mapCX,DPR); return; }   // dungeons: the run's explored tiles instead of a land (dungeon/minimap.js)
  renderTierRow(mapLand||landHere());
  const L=viewLand(), W=mapC.width, H=mapC.height, x=mapCX, k=W/(L.x1-L.x0), at=(wx,wz)=>[(wx-L.x0)*k,(wz-L.z0)*k];
  x.fillStyle='#16486c'; x.fillRect(0,0,W,H);
  if(!MAP.done){ x.fillStyle='rgba(247,238,214,.85)'; x.font=`italic ${14*DPR}px Georgia, serif`; x.textAlign='center'; x.fillText('Still mapping the forest…',W/2,H/2); mapStFrame(x,W,H,DPR); return; }
  x.imageSmoothingEnabled=true; x.drawImage(MAP.canvas,mapX(L.x0),mapZ(L.z0),(L.x1-L.x0)*MAP.k,(L.z1-L.z0)*MAP.k,0,0,W,H);
  const fs=Math.max(9,Math.min(13,W/DPR/48))*DPR, land=L===LANDS.hoar?'hoar':L===LANDS.vale?'vale':L===LANDS.grey?'grey':'home', vale=land==='vale'||land==='hoar', mine=zn=>landOfZone(zn)===land;
  x.textAlign='center'; x.textBaseline='middle';
  const label=(t,cx,cy,size,col,bold)=>mapStLabel(x,t,cx,cy,size,col,bold,DPR);   // (serif, dark ink on a pale halo: ui/map-style.js)
  for(const zn of ZONES){ if(zn.boss||!mine(zn)) continue; const [cx,cy]=at(...(zn.label||zonePoint(zn,0,0.5))); label(zn.name,cx,cy-fs*0.55,fs,'#f2f0e4',true); label('Level '+zoneLvText(zn),cx,cy+fs*0.6,fs*0.85,'#ffcf8a'); }
  for(const bd of BOSS_DEFS){ const A=ARENAS.find(a=>a.key===bd.arena); if((A.grey?'grey':A.hoar?'hoar':inVale(A.x,A.z)?'vale':'home')!==land) continue; const [cx,cy]=at(A.x,A.z); dot(x,cx,cy,5*DPR,'#c86bff'); label(bd.short,cx,cy-fs*1.3,fs,'#e8b8ff',true); label('Level '+bossLvIn(bd.def,land)+' boss',cx,cy+fs*1.25,fs*0.85,'#ffcf8a'); }
  { const V=land==='grey'?VIL4:land==='hoar'?VIL3:land==='vale'?VIL2:VIL, [cx,cy]=at(V.x,V.z); label(land==='grey'?'Highmark':land==='hoar'?'Rimehold':land==='vale'?'Hanami':'Village',cx,cy-V.r*k-fs*0.2,fs*1.05,'#fff4d0',true); }
  dgEntMapMarks(x,at,land,fs,label,DPR);   // dungeons: the three doors, the Elder greyed while sealed
  if(land!=='hoar'&&land!=='grey'){ const [cx,cy]=at(vale?TUN.p1:TUN.p0,TUN.z); dot(x,cx,cy,3.5*DPR,valeOpen()?'#9fe0ff':'#8a8078'); label(valeOpen()?'Bridge':'Bridge (barred)',cx+(vale?1:-1)*fs*2.6,cy,fs*0.85,'#e8e0d0'); }
  if(land==='vale'){ const [cx,cy]=at(PASS.x,PASS.ice); dot(x,cx,cy,3.5*DPR,northOpen()?'#9fe0ff':'#8a8078'); label(northOpen()?'Frostgate Pass':'Frostgate Pass (ice wall)',cx-fs*4.6,cy,fs*0.85,'#e8e0d0'); }
  if(land==='hoar'){ const [cx,cy]=at(PASS.x,PASS.z1+50); label('Frostgate Pass',cx-fs*3.6,cy,fs*0.85,'#e8e0d0'); for(const Lk of FROST_LAKES){ const [lx,ly]=at(Lk.x,Lk.z); label(Lk.name,lx,ly,fs*0.85,'#cfe8f6'); }
  }
  if((land==='hoar'||land==='grey')&&GEAR.prof) for(const n of NODES){ if(NODE_TAKEN.has(n.i)||nodeBlock(GEAR,n)||landAt(n.x,n.z)!==land) continue; const [a,b]=at(n.x,n.z); dot(x,a,b,2.6*DPR,RES[NODE_KINDS[n.kind].res].col); }   // the nodes of the professions you know (the Reach's and the Greyspine's)
  if(land==='grey'){   // the tarns and the fjord by name, the two rock falls in the west wall (a grey dot while shut, light blue once a boss has opened them)
    for(const T of GREY_TARNS){ const [cx,cy]=at(T.x,T.z); label(T.name,cx,cy,fs*0.85,'#cfe8f6'); }
    { const f=GREY_FJORD.pts[1], [cx,cy]=at(f[0],f[1]); label('The fjord',cx+fs*2.4,cy+fs*1.1,fs*0.85,'#cfe8f6'); }
    for(const G of GREY_GATES){ const [cx,cy]=at(G.x,G.z), op=gateOpen(G); dot(x,cx,cy,3.5*DPR,op?'#9fe0ff':'#8a8078'); label(G.name,cx+fs*3.4,cy,fs*0.72,op?'#e8e0d0':'#b4aea4'); }   // (the dot says whether it is open; the name is short, the map is small on a phone)
  }
  for(const Lk of LAKES){ if(!!Lk.vale!==(land==='vale')||land==='hoar'||land==='grey') continue; const [cx,cy]=at(Lk.x,Lk.z); label(Lk.name,cx,cy,fs*0.85,'#cfe8f6'); }
  for(const B of BRIDGES){ if(B.kind!=='causeway'||B.name[0]!=='T'||inVale(B.x,B.z)!==vale||land==='hoar'||land==='grey') continue; const [cx,cy]=at(B.x,B.z); label(B.name,cx,cy+fs*1.1,fs*0.8,'#cfe8f6'); }   // the named causeways
  // quests
  for(const q of questTargets()){
    if(q.ring){ x.save(); x.setLineDash([5*DPR,5*DPR]); x.strokeStyle='rgba(242,207,90,.8)'; x.lineWidth=1.5*DPR; x.beginPath(); const [cx,cy]=at(VIL.x,VIL.z); x.arc(cx,cy,q.ring*k,0,TAU); x.stroke(); x.restore(); continue; }
    const [cx,cy]=at(q.x,q.z); drawDiamond(x,cx,cy,(q.main?7.5:6)*DPR,q.main?'#c89bff':q.ready?'#9fe08a':'#f2cf5a');
  }
  for(const m of MONS){ if(m.dead||!m.aggro) continue; const [a,b]=at(m.x,m.z); dot(x,a,b,2.4*DPR,'#ff4a3a'); }
  for(const r of REMOTES.values()){ if(r.tx===null) continue; const [a,b]=at(r.x,r.z); dot(x,a,b,4*DPR,dgPartyCol(r.id)||'#6fb8ff'); label(r.name,a,b-fs*1.1,fs*0.85,'#cfe6ff'); }   // dungeons: party members in their colour (dungeon/party.js)
  { const [a,b]=at(P.x,P.z); mapStPin(x,a,b,6.4*DPR,-P.face); }
  { const nm=LANDS[land].name, B=WMAP_BANNER[WMAP_LAND[land]]; mapStRibbon(x,DPR,W,nm,'Levels '+B.levels); mapStCompass(x,W-30*DPR,H-30*DPR,13*DPR); mapStFrame(x,W,H,DPR); }   // the land's name on the scroll, the rose, the frame
  const zn=zoneAt(P.x,P.z), V=vilAt(P.x,P.z);
  const vn=V===VIL4?'Highmark':V===VIL3?'Rimehold':V===VIL2?'Hanami':'the village';
  $('#mapHere').textContent=vDist(P.x,P.z)<VR+12?'You are in '+vn:P.inTun?'You are on the Greyfall bridge':zn?(zn.boss?'You are near '+zn.name:'You are in '+zn.name+' (level '+zoneLvText(zn)+')'):inPass(P.x,P.z)?'You are in Frostgate Pass':inGrey(P.x,P.z)?'You are in the Greyspine':'You are near '+vn;
}
function placeName(wx,wz){
  { const dn=dgEntName(wx,wz); if(dn) return dn; }   // dungeons: the door's name under the pointer
  if(vDist(wx,wz)<VR+8) return vilAt(wx,wz)===VIL4?'Highmark':vilAt(wx,wz)===VIL3?'Rimehold':vilAt(wx,wz)===VIL2?'Hanami':'Village';
  for(const L of FROST_LAKES) if(inHoar(wx,wz)&&Math.hypot(wx-L.x,wz-L.z)<L.r*0.8) return L.name+' (frozen)';
  for(const L of LAKES) if(Math.hypot(wx-L.x,wz-L.z)<L.r*0.8) return L.name;
  for(const bd of BOSS_DEFS){ const A=ARENAS.find(a=>a.key===bd.arena); if(Math.hypot(wx-A.x,wz-A.z)<A.r+6) return A.name+': '+bd.def.name+', level '+bossLvIn(bd.def,landAt(A.x,A.z))+' boss'; }
  if(inPass(wx,wz)&&Math.abs(wz-PASS.ice)<6) return northOpen()?'Frostgate Pass (the ice wall has fallen)':'Frostgate Pass: the ice wall (shut until Akaoni falls)';
  if(inPass(wx,wz)&&wz<HZ0+60) return 'Frostgate Pass';
  if(inTunnelCut(wx,wz)&&wx>TUN.p0-4&&wx<TUN.p1+4) return valeOpen()?'The Greyfall bridge':'The Greyfall bridge (barred until the Rootwarden falls)';
  const B=bridgeAt(wx,wz,2); if(B) return B.road+' ('+B.name+')';
  const rd=roadAt(wx,wz,3); if(rd) return rd.name;
  const zn=zoneAt(wx,wz); if(zn) return zn.key==='boss'?'Rootwarden Barrens':zn.boss?zn.name:zn.name+': level '+zoneLvText(zn)+' ('+MON_DEFS.filter(d=>defZone(d)===zn).map(d=>d.name).join(', ')+')';
  return edgeName(wx,wz)||(inHoar(wx,wz)?'The snowfields':inGrey(wx,wz)?'The Greyspine':inVale(wx,wz)?'Hanami meadows':'Village meadows');
}
// the lands' edges by their names in docs/WORLD.md (shaped in shared/terrain.js)
function edgeName(x,z){
  if(coastDist(x,z)<40) return inHoar(x,z)||inGrey(x,z)?'The Outer Deep shore':'The Crownsea shore';   // (the north of the Reach and the Greyspine looks on the open ocean)
  const bx=borderX(z), bn=borderXN(z), bz=borderZ(x), wx=lerp(wallW(z,1),56,riverK(z)), wn=wallW(z,1), wz=wallW(x,3);   // (the walls' bodies are as wide as the terrain makes them there)
  if(inGrey(x,z)){
    if(x-WX0<62) return 'The west wall';
    if(bn-x<wn) return 'The Glacier Wall';   // (the Greyspine | Reach wall)
    if(z>bz-wz) return 'The Greyspine foothills';
  } else if(inSun(x,z)) return 'The Sunscar plateau';   // (not built: the Sunwall's top goes on west of the forest)
  else if(!inVale(x,z)){
    if(Math.abs(z-REDGATE_Z)<16&&x-HX0<REDGATE_CL+45) return 'Redgate Canyon (sealed by a rock fall)';
    if(x-HX0<sunwallLine(z)+18) return 'The Sunwall';
    if(z-bz<wz) return x<GXJ?'The Greyspine foothills':'The Frostwall';   // (the forest's north rim: the Greyspine's foothills west of its wall, the Reach's south wall east of it)
    if(bx-x<wx) return riverK(z)>0.5?'The Greyfall River':'The Vale Wall';
  } else if(inHoar(x,z)){
    if(x-bn<wn) return 'The Glacier Wall';
    if(z>bz-wz) return 'The Frostwall';
  } else {
    if(x-bx<wx) return riverK(z)>0.5?'The Greyfall River':'The Vale Wall';
    if(z-bz<wz) return 'The slopes of the Hoarfrost Reach';
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
{ const sz=Math.round((isTouch?98:144)*DPR); mmC.width=mmC.height=sz; }   // (the frame's border takes 3 px each side)
function updateMap(dt){
  if(Stream.terrainDone && !MAP.done) mapBuildStep(started?(LOW?4:8):(LOW?16:40));
  if(!started) return;
  MAP.mmT-=dt; if(MAP.mmT<=0){ MAP.mmT=0.1; drawMinimap(); }
  if(!$('#map').hidden){ MAP.fullT-=dt; if(MAP.fullT<=0){ MAP.fullT=0.15; drawFullMap(); } }
  wmapUpdate(dt);   // world map: its frame (ui/world-map.js)
}
