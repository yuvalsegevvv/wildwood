//@ The world map of Eldmere (G): the atlas painted as a map, purple fog over what is locked or not built, a scroll banner on each open land and your pin; drag, wheel or pinch to move and zoom, click a land to open its map
/* Agent map. What it owns: the #wmap panel (a canvas that fills it), the fog, the banners, the pin and the pointer handling.
   Art: the atlas itself, painted once by wmapPaint (world-map-data.js, which also holds the art's frame: 1 art pixel = 2 m, wmapArt / wmapWorld). All six lands are built; each sits under fog until `landOpen` says so (that map's own
   locks: map.js). The Amber Reach and the sea's corners (the Emberwake Isles in the south) are not built: fog always, and nothing but "uncharted" is said about them.
   A click on an open land opens that land's full map (`wmapGo`, the same panel the N key opens); a click on fog says what bars the way. The pin: `wmapPin` (exact: the atlas is the map).
   Used by: map.js (the "World" button, `sizeFullMap` hides it in a dungeon, `updateMap` calls `wmapUpdate`), panels.js (PANELS), keybinds.js (the `world` key). Test: tools/client-smoke.js. */
const WMAP_IDS=['home','vale','hoar','grey','sun','gloam','amber'], WMAP_FADE=['vale','hoar','grey','sun','gloam','amber'];
const WMAP_TOWN_NAME={home:'the village',vale:'Hanami',hoar:'Rimehold',grey:'Highmark',sun:'Glasswell',gloam:'Wraithwick',amber:'Tallgrass'};
// what stops you, by the same words the land maps use (`placeName`, map.js)
const WMAP_LOCK={vale:'The Sakura Vale: the Greyfall bridge is barred until the Rootwarden falls',hoar:'The Hoarfrost Reach: Frostgate Pass is walled with ice until Akaoni falls',grey:'The Greyspine: the glacier valley\'s ice fall holds the way until Ymrik falls',sun:'The Sunscar: the River Pass and Redgate Canyon are shut until the Gryphon Queen falls',gloam:'The Gloamhorn: the Windswept Neck is shut until the Mountain Golem falls',amber:'Amber Reach: the Ashbed Gate is shut until the Sand Wyrm falls'};
const WMAP_FOG_MAX={vale:.86,hoar:.86,grey:.86,sun:.86,gloam:.86,amber:.86};   // a locked land's fog lets its shape show a little; the unbuilt regions' fog is solid
const wmapEl=$('#wmap'), wmapC=$('#wmapC'), wmapX=wmapC.getContext('2d'), wmapTip=$('#wmapTip'), wmapBox=$('#wmapBox');
const WM={k:.5,min:.3,max:1.5,cx:WMAP_W/2,cy:WMAP_H/2,w:300,h:300,img:null,fog:null,hot:null,ptr:new Map(),moved:0,pinch:0,t:0,acc:0,delay:0,fade:{vale:1,hoar:1,grey:1,sun:1,gloam:1,amber:1},seen:null,art:null,mask:{}};
const wmapSx=ax=>(ax-WM.cx)*WM.k+WM.w/2, wmapSy=ay=>(ay-WM.cy)*WM.k+WM.h/2;
const wmapAx=sx=>(sx-WM.w/2)/WM.k+WM.cx, wmapAy=sy=>(sy-WM.h/2)/WM.k+WM.cy;
function wmapRng(s){ return ()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
// what is under a point of the art: a land's id ('home'...), 'unbuilt' (a fog bank that does not exist yet), or null (open sea)
function wmapRegionAt(x,y){
  const w=wmapWorld(x,y), l=waLand(w[0],w[1]);
  if(l) return l;
  for(const B of WMAP_BANKS) if(((x-B[0])/B[2])**2+((y-B[1])/B[3])**2<1) return 'unbuilt';
  return null;
}
/* ---- where you are on the art ---- */
function wmapPin(){
  if(dgIn()||caveIn()) return null;   // cave:
   // (a run is far from the map)
  return wmapArt(clamp(P.x,WX0,WX1),clamp(P.z,WZ0,WZ1));
}
/* ---- the fog ---- */
// one cloud: a lump of overlapping domes. The dark outlines of all of them go down first, then the fills over them, so only the lump's outside keeps an outline
function wmapPuff(x,cx,cy,r,rnd){
  const n=4+Math.floor(rnd()*3), dome=[[0,0,1]];
  for(let i=0;i<n;i++){ const a=-Math.PI*(0.08+0.84*(i+rnd()*0.6)/n); dome.push([Math.cos(a)*r*0.8,Math.sin(a)*r*0.46,0.52+rnd()*0.26]); }
  const g=x.createLinearGradient(0,cy-r*1.2,0,cy+r*0.8); g.addColorStop(0,'#8e56bd'); g.addColorStop(0.5,'#5b2d87'); g.addColorStop(1,'#26113c');
  x.lineWidth=Math.max(2,r*0.13); x.strokeStyle='#160a26';
  for(const d of dome){ x.beginPath(); x.arc(cx+d[0],cy+d[1],r*d[2],0,TAU); x.stroke(); }
  x.fillStyle=g; for(const d of dome){ x.beginPath(); x.arc(cx+d[0],cy+d[1],r*d[2],0,TAU); x.fill(); }
  x.strokeStyle='rgba(205,160,245,.5)'; x.lineWidth=Math.max(1.5,r*0.09); x.beginPath(); x.arc(cx,cy,r*0.84,Math.PI*1.12,Math.PI*1.62); x.stroke();
}
// a fog group: puffs where test(artX, artY, spacing) says the ground is near what the group hides, drawn once into a canvas of its own at `scale` of the art and cropped to the box [x0,y0,x1,y1] (art pixels)
function wmapFogGroup(test,box,spacing,seed,scale){
  const rnd=wmapRng(seed), pad=spacing*2.8;   // (a puff reaches about 1.8 spacings: the box must not cut one)
  const x0=Math.floor(box[0]-pad), y0=Math.floor(box[1]-pad), x1=Math.ceil(box[2]+pad), y1=Math.ceil(box[3]+pad);
  const puffs=[]; for(let py=y0;py<y1;py+=spacing*0.8) for(let px=x0;px<x1;px+=spacing){ const jx=px+(rnd()-0.5)*spacing*0.8+((Math.round((py-y0)/(spacing*0.8))&1)?spacing*0.5:0), jy=py+(rnd()-0.5)*spacing*0.6; if(test(jx,jy,spacing)) puffs.push([jx,jy,spacing*(0.72+rnd()*0.42)]); }
  puffs.sort((a,b)=>a[1]-b[1]);
  const cv=document.createElement('canvas'); cv.width=Math.ceil((x1-x0)*scale); cv.height=Math.ceil((y1-y0)*scale); const x=cv.getContext('2d'); x.scale(scale,scale); x.translate(-x0,-y0);
  for(const p of puffs){ const h=x.createRadialGradient(p[0],p[1],0,p[0],p[1],p[2]*2.3); h.addColorStop(0,'rgba(80,40,120,.34)'); h.addColorStop(1,'rgba(80,40,120,0)'); x.fillStyle=h; x.beginPath(); x.arc(p[0],p[1],p[2]*2.3,0,TAU); x.fill(); }   // (a haze under them, so the fringe is soft)
  for(const p of puffs) wmapPuff(x,p[0],p[1],p[2],rnd);
  return {cv,x0,y0,scale,n:puffs.length};
}
// near a land: the point, or one 0.55 spacings (2 m an art pixel) away, is on it
const wmapNearLand=(l,px,py,sp)=>[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(d=>{ const w=wmapWorld(px+d[0]*sp*0.55,py+d[1]*sp*0.55); return waLand(w[0],w[1])===l; });
function wmapLandBox(l){ const R=LANDS[l], a=wmapArt(R.x0,R.z0), b=wmapArt(R.x1,R.z1); return [a[0],a[1],b[0],b[1]]; }
function wmapFogBuild(){
  if(WM.fog) return;
  const sc=LITE?0.33:LOW?0.45:0.6;
  WM.fog={base:[   // the banks of the open sea: never lift
      ...WMAP_BANKS.map((b,i)=>wmapFogGroup((px,py,sp)=>((px-b[0])/(b[2]+sp*0.4))**2+((py-b[1])/(b[3]+sp*0.4))**2<1,[b[0]-b[2],b[1]-b[3],b[0]+b[2],b[1]+b[3]],22,14+i,sc))]};
  WMAP_FADE.forEach((l,i)=>{ WM.fog[l]=wmapFogGroup((px,py,sp)=>wmapNearLand(l,px,py,sp),wmapLandBox(l),24,21+10*i,sc); });   // these lift as their lands open (a group a cluster keeps the canvases small)
}
/* ---- state of the fog: which lands you have already seen open (so a new one is revealed once) ---- */
function wmapSeen(){ if(!WM.seen){ try{ WM.seen=JSON.parse(localStorage.getItem('wildwood-wmap'))||[]; }catch(_){ WM.seen=[]; } if(!Array.isArray(WM.seen)) WM.seen=[]; } return WM.seen; }
function wmapSeenAdd(id){ const s=wmapSeen(); if(!s.includes(id)){ s.push(id); try{ localStorage.setItem('wildwood-wmap',JSON.stringify(s)); }catch(_){} } }
function wmapFogReset(){
  for(const id of WMAP_FADE) WM.fade[id]=landOpen(id)&&wmapSeen().includes(id)?0:1;   // an open land you have not seen open yet starts under fog and the fog lifts when the map opens
  WM.delay=0.5;
}
/* ---- view ---- */
function wmapClamp(){
  const hw=WM.w/WM.k/2, hh=WM.h/WM.k/2;
  WM.cx=WMAP_W*WM.k<=WM.w?WMAP_W/2:clamp(WM.cx,hw,WMAP_W-hw);
  WM.cy=WMAP_H*WM.k<=WM.h?WMAP_H/2:clamp(WM.cy,hh,WMAP_H-hh);
}
function wmapSize(){
  const r=wmapBox.getBoundingClientRect(); WM.w=Math.max(200,Math.floor(r.width)); WM.h=Math.max(200,Math.floor(r.height));
  wmapC.style.width=WM.w+'px'; wmapC.style.height=WM.h+'px'; wmapC.width=Math.round(WM.w*DPR); wmapC.height=Math.round(WM.h*DPR);
  WM.min=Math.min(WM.w/WMAP_W,WM.h/WMAP_H); WM.max=WM.min*3.5;   // all of the sea in view, to three and a half times that (the fog is drawn at about half the art's size)
  WM.k=clamp(WM.k,WM.min,WM.max); wmapClamp();
}
function wmapZoom(f,sx,sy){ const ax=wmapAx(sx), ay=wmapAy(sy); WM.k=clamp(WM.k*f,WM.min,WM.max); WM.cx=ax-(sx-WM.w/2)/WM.k; WM.cy=ay-(sy-WM.h/2)/WM.k; wmapClamp(); }
function wmapHome(){   // the whole atlas fills the view, centred
  WM.k=clamp(Math.min(WM.w/WMAP_W,WM.h/WMAP_H)*1.05,WM.min,WM.max); WM.cx=WMAP_W/2; WM.cy=WMAP_H/2; wmapClamp();
}
/* ---- drawing ---- */
// a land's silhouette as a canvas (drawn once, for the glow under the pointer): its ground in a pale fill, on the art's 12 m grid
function wmapMask(l){
  if(WM.mask[l]) return WM.mask[l];
  const res=12, R=LANDS[l], w=Math.ceil((R.x1-R.x0)/res), h=Math.ceil((R.z1-R.z0)/res), cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const cx=cv.getContext('2d'), im=cx.createImageData(w,h); for(let j=0;j<h;j++) for(let i=0;i<w;i++) if(waLand(R.x0+(i+.5)*res,R.z0+(j+.5)*res)===l){ const k=(j*w+i)*4; im.data[k]=255; im.data[k+1]=244; im.data[k+2]=200; im.data[k+3]=255; }
  cx.putImageData(im,0,0); return WM.mask[l]={cv,res};
}
// a scroll with rolled ends, like the reference's labels; its width is guessed from the letters (measureText is not worth its cost here)
const wmapBannerW=name=>Math.round(name.length*8.6+44);
function wmapBanner(x,cx,cy,name,sub,hot,sc){   // sc: a scale for a small canvas (the land maps' title, ui/map-style.js)
  const w=wmapBannerW(name), h=sub?38:27, s=(hot?1.07:1)*(sc||1);
  x.save(); x.translate(cx,cy); x.scale(s,s);
  x.shadowColor='rgba(0,0,0,.45)'; x.shadowBlur=7; x.shadowOffsetY=2;
  const g=x.createLinearGradient(0,-h/2,0,h/2); g.addColorStop(0,hot?'#fff6d8':'#f6ebc9'); g.addColorStop(1,hot?'#ecd9a4':'#dcc794');
  x.fillStyle=g; x.fillRect(-w/2,-h/2,w,h); x.shadowColor='transparent';
  x.strokeStyle='#5a3d1e'; x.lineWidth=1.4; x.strokeRect(-w/2,-h/2,w,h);
  for(const sx of [-w/2,w/2]){ const rg=x.createLinearGradient(sx-6,0,sx+6,0); rg.addColorStop(0,'#b08848'); rg.addColorStop(0.45,'#f3e4ba'); rg.addColorStop(1,'#a3793a');
    x.fillStyle=rg; x.beginPath(); x.rect(sx-6,-h/2-4,12,h+8); x.fill(); x.stroke(); }
  x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#3a2410';
  x.font='bold 13.5px Georgia, "Palatino Linotype", serif'; x.fillText(name,0,sub?-6:0);
  if(sub){ x.font='italic 10.5px Georgia, serif'; x.fillStyle='#6a4a28'; x.fillText(sub,0,9.5); }
  x.restore();
}
function wmapPinDraw(x,sx,sy,t){
  const r=8.5, h=27, y=sy-Math.abs(Math.sin(t*2.6))*2.5, hy=y-h+r, a=Math.acos(r/(h-r));
  x.fillStyle='rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(sx,sy,6,2.4,0,0,TAU); x.fill();
  x.beginPath(); x.arc(sx,hy,r,Math.PI/2+a,Math.PI*2.5-a); x.lineTo(sx,y); x.closePath();
  x.fillStyle='#d8382c'; x.strokeStyle='#5a120d'; x.lineWidth=1.6; x.fill(); x.stroke();
  x.fillStyle='#fff'; x.beginPath(); x.arc(sx,hy,r*0.42,0,TAU); x.fill();
  x.strokeStyle='rgba(255,200,190,.7)'; x.lineWidth=1.4; x.beginPath(); x.arc(sx,hy,r*0.72,Math.PI*1.15,Math.PI*1.5); x.stroke();
}
function wmapFogDraw(x,g,alpha,bob){
  if(alpha<=0.01) return; const s=WM.k/g.scale; x.globalAlpha=alpha;
  x.drawImage(g.cv,wmapSx(g.x0),wmapSy(g.y0)+bob*WM.k,g.cv.width*s,g.cv.height*s); x.globalAlpha=1;
}
function wmapDraw(){
  const x=wmapX, W=WM.w, H=WM.h, t=WM.t; x.setTransform(DPR,0,0,DPR,0,0);
  x.fillStyle='#16486c'; x.fillRect(0,0,W,H);
  if(!WM.art) WM.art=wmapPaint(LITE||LOW?12:6);
  { const a=wmapArt(WX0,WZ0), s=WM.k*WM.art.res/2; x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(WM.art.cv,wmapSx(a[0]),wmapSy(a[1]),WM.art.cv.width*s,WM.art.cv.height*s); }
  wmapFogBuild();
  WM.fog.base.forEach((g,i)=>wmapFogDraw(x,g,1,Math.sin(t*0.7+i)*3));
  for(const id of WMAP_FADE) wmapFogDraw(x,WM.fog[id],WM.fade[id]*WMAP_FOG_MAX[id],Math.sin(t*0.7+id.length+id.charCodeAt(0))*3);
  if(WM.hot&&WM.hot!=='unbuilt'&&landOpen(WM.hot)){   // the land under the pointer glows (over the fog: its neighbours' clouds cover its edge)
    const M=wmapMask(WM.hot), R=LANDS[WM.hot], a=wmapArt(R.x0,R.z0), s=WM.k*M.res/2;
    x.save(); x.globalAlpha=0.16; x.shadowColor='rgba(255,222,120,.9)'; x.shadowBlur=14; x.drawImage(M.cv,wmapSx(a[0]),wmapSy(a[1]),M.cv.width*s,M.cv.height*s); x.restore();
  }
  x.textAlign='center'; x.textBaseline='middle';
  for(const id of WMAP_IDS){
    const a=id==='home'?1:1-clamp(WM.fade[id]*1.6); if(a<=0.02||!landOpen(id)) continue;
    x.globalAlpha=a;
    const T=wmapArt(WMAP_TOWNS[id].x,WMAP_TOWNS[id].z); x.font='italic 12px Georgia, serif'; x.lineWidth=3.6; x.lineJoin='round'; x.strokeStyle='rgba(247,238,214,.92)'; x.fillStyle='#3a2410';
    const tx=wmapSx(T[0]), ty=wmapSy(T[1])+Math.max(17,36*WM.k); x.fillStyle='#3a2410'; x.beginPath(); x.arc(tx,wmapSy(T[1]),3,0,TAU); x.fill(); x.strokeText(WMAP_TOWN_NAME[id],tx,ty); x.fillText(WMAP_TOWN_NAME[id],tx,ty);
    const B=WMAP_BANNER[id]; wmapBanner(x,wmapSx(B.x),wmapSy(B.y),B.name,'Levels '+B.levels,WM.hot===id,clamp(WM.w/760,0.72,1));   // (smaller scrolls on a phone)
    x.globalAlpha=1;
  }
  { const p=wmapPin(); if(p) wmapPinDraw(x,wmapSx(p[0]),wmapSy(p[1]),t); }
  x.font='600 12px "Alegreya Sans", system-ui, sans-serif'; x.textAlign='right'; x.textBaseline='alphabetic'; x.shadowColor='rgba(0,0,0,.9)'; x.shadowBlur=4; x.fillStyle='#fff';
  x.fillText(isTouch?'Tap a land · drag to pan · pinch to zoom':'Click a land · drag to pan · scroll to zoom',W-14,H-12); x.shadowColor='transparent'; x.shadowBlur=0;
}
function wmapUpdate(dt){
  if(wmapEl.hidden) return;
  WM.acc+=dt; if(WM.acc<(LOW?0.05:0.033)) return; dt=WM.acc; WM.acc=0;   // (30 frames a second are plenty for a map; 20 on a weak phone)
  WM.t+=dt; WM.delay-=dt;
  for(const id of WMAP_FADE){
    const want=landOpen(id)?0:1;
    if(want===0&&WM.fade[id]>0&&WM.delay>0) continue;   // (a short beat before the fog lifts)
    WM.fade[id]=clamp(WM.fade[id]+(want?1:-1)*Math.min(dt,0.1)/1.4);
    if(want===0&&WM.fade[id]<=0) wmapSeenAdd(id);
  }
  wmapDraw();
}
/* ---- pointer ---- */
function wmapSay(sx,sy,text){
  if(!text){ wmapTip.hidden=true; return; }
  wmapTip.textContent=text; wmapTip.hidden=false; wmapTip.style.left=clamp(sx,70,Math.max(80,WM.w-70))+'px'; wmapTip.style.top=sy+'px';
}
function wmapWhat(id){
  if(id==='unbuilt') return 'Uncharted: fog hides what lies beyond';
  if(!id) return '';
  const B=WMAP_BANNER[id];
  if(!landOpen(id)) return WMAP_LOCK[id];
  return B.name+' · levels '+B.levels+(landHere()===id?' · you are here':' · click to open its map');
}
// the banner of an open land counts as the land (it is drawn over the neighbours' edges)
function wmapBannerAt(sx,sy){
  for(const id of WMAP_IDS){ if(!landOpen(id)||(id!=='home'&&WM.fade[id]>0.6)) continue;
    const B=WMAP_BANNER[id]; if(Math.abs(sx-wmapSx(B.x))<=wmapBannerW(B.name)/2+6&&Math.abs(sy-wmapSy(B.y))<=23) return id; }
  return null;
}
function wmapHover(sx,sy){
  const id=wmapBannerAt(sx,sy)||wmapRegionAt(wmapAx(sx),wmapAy(sy)); WM.hot=id;
  wmapC.style.cursor=id&&id!=='unbuilt'&&landOpen(id)?'pointer':WM.ptr.size?'grabbing':'grab';
  wmapSay(sx,sy,wmapWhat(id));
}
function wmapGo(land){   // that land's full map (the one N opens), from here
  if(!LANDS[land]||!landOpen(land)) return;
  mapLand=land===landHere()?null:land; openPanel('map'); sizeFullMap(); drawFullMap(); MAP.fullT=0;
}
function wmapClick(sx,sy){
  const id=wmapBannerAt(sx,sy)||wmapRegionAt(wmapAx(sx),wmapAy(sy)); if(!id) return;
  if(id==='unbuilt'||!landOpen(id)) toast(wmapWhat(id)); else wmapGo(id);
}
const wmapPos=e=>{ const r=wmapC.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; };
wmapC.addEventListener('pointerdown',e=>{
  const p=wmapPos(e); WM.ptr.set(e.pointerId,p); if(WM.ptr.size===1) WM.moved=0; if(WM.ptr.size===2){ const q=[...WM.ptr.values()]; WM.pinch=Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1])||1; WM.moved=99; }
  if(wmapC.setPointerCapture) try{ wmapC.setPointerCapture(e.pointerId); }catch(_){}
  wmapC.style.cursor='grabbing'; wmapTip.hidden=true;
});
wmapC.addEventListener('pointermove',e=>{
  const p=wmapPos(e);
  if(!WM.ptr.has(e.pointerId)){ wmapHover(p[0],p[1]); return; }
  const o=WM.ptr.get(e.pointerId); WM.ptr.set(e.pointerId,p);
  if(WM.ptr.size===1){ WM.moved+=Math.abs(p[0]-o[0])+Math.abs(p[1]-o[1]); if(WM.moved>5){ WM.cx-=(p[0]-o[0])/WM.k; WM.cy-=(p[1]-o[1])/WM.k; wmapClamp(); WM.hot=null; } return; }
  if(WM.ptr.size===2){ const q=[...WM.ptr.values()], d=Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1])||1; wmapZoom(d/WM.pinch,(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2); WM.pinch=d; }
});
function wmapRelease(e,click){
  const p=wmapPos(e), was=WM.ptr.size; WM.ptr.delete(e.pointerId);
  if(click&&was===1&&WM.moved<=5) wmapClick(p[0],p[1]);
  if(!WM.ptr.size) wmapHover(p[0],p[1]);
}
wmapC.addEventListener('pointerup',e=>wmapRelease(e,true));
wmapC.addEventListener('pointercancel',e=>wmapRelease(e,false));
wmapC.addEventListener('pointerleave',e=>{ if(!WM.ptr.size){ WM.hot=null; wmapTip.hidden=true; } });
wmapC.addEventListener('wheel',e=>{ e.preventDefault(); const p=wmapPos(e); wmapZoom(Math.pow(1.0017,-e.deltaY*(e.deltaMode===1?33:1)),p[0],p[1]); },{passive:false});
$('#wmapIn').addEventListener('click',()=>wmapZoom(1.5,WM.w/2,WM.h/2));
$('#wmapOut').addEventListener('click',()=>wmapZoom(1/1.5,WM.w/2,WM.h/2));
/* ---- opening ---- */
function wmapOpen(){
  if(dgIn()||caveIn()) return;   // cave:
  // (a run has its own map)
  openPanel('wmap'); wmapSize(); wmapHome(); wmapFogReset(); WM.ptr.clear(); WM.hot=null; wmapTip.hidden=true; wmapDraw();
  $('#wmapHere').textContent='You are in '+LANDS[landHere()].name.replace(/^The /,'the ');
}
function wmapToggle(){ if(wmapEl.hidden) wmapOpen(); else closePanels(); }
$('#mapWorld').addEventListener('click',wmapOpen);
addEventListener('keydown',e=>{ if(kbIs(e.code,'world') && started && !customizing && !e.repeat) wmapToggle(); });
addEventListener('resize',()=>{ if(!wmapEl.hidden){ wmapSize(); wmapDraw(); } });
