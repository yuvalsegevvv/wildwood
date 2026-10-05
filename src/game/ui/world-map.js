//@ The world map of Eldmere (G): the docs map's art with purple fog over what is locked or not built, a scroll banner on each open land and your pin; drag, wheel or pinch to move and zoom, click a land to open its map
/* Agent map. What it owns: the #wmap panel (a canvas that fills it), the fog, the banners, the pin and the pointer handling.
   Art: assets/img/world-map.webp (window.WILDWOOD_IMG['world-map'], embedded by build.py), drawn from docs/world-map.svg by tools/world-map-bake.js; its regions, towns and banner places are
   world-map-data.js (generated with it: WMAP_*). Coordinates here are "art pixels" (2000 x 1574) unless a name says screen.
   The docs map shows seven regions; four are built (home forest = wild, vale, frost = the Hoarfrost Reach, grey = the Greyspine) and sit under fog until `landOpen` says so (that map's own
   locks: map.js). Stormhorn, Sunscar, Amber Reach and the Emberwake Isles are not built: fog always, and nothing but "uncharted" is said about them (the docs keep their names to themselves).
   A click on an open land opens that land's full map (`wmapGo`, the same panel the N key opens); a click on fog says what bars the way. The pin: `wmapPin`.
   Used by: map.js (the "World" button, `sizeFullMap` hides it in a dungeon, `updateMap` calls `wmapUpdate`), panels.js (PANELS), keybinds.js (the `world` key). Test: tools/client-smoke.js. */
const WMAP_LAND={home:'wild',vale:'vale',hoar:'frost',grey:'grey'};   // the game's lands on the docs map's regions
const WMAP_IDS=['home','vale','hoar','grey'];
const WMAP_TOWN={home:'village',vale:'hanami',hoar:'rimehold',grey:'highmark'}, WMAP_TOWN_NAME={village:'the village',hanami:'Hanami',rimehold:'Rimehold',highmark:'Highmark'};
// what stops you, by the same words the land maps use (`placeName`, map.js)
const WMAP_LOCK={vale:'The Sakura Vale: the Greyfall bridge is barred until the Rootwarden falls',hoar:'The Hoarfrost Reach: Frostgate Pass is walled with ice until Akaoni falls',grey:'The Greyspine: the glacier valley\'s ice fall holds the way until Ymrik falls'};
const WMAP_BANKS=[[1830,170,230,150],[1800,1400,260,150],[40,1050,130,300]];   // fog on the open sea: [x, y, rx, ry] (the corners of the known world)
const WMAP_FOG_MAX={vale:.86,hoar:.86,grey:.86};   // a locked land's fog lets its shape show a little; the unbuilt regions' fog is solid
const wmapEl=$('#wmap'), wmapC=$('#wmapC'), wmapX=wmapC.getContext('2d'), wmapTip=$('#wmapTip'), wmapBox=$('#wmapBox');
const WM={k:.5,min:.3,max:1.5,cx:WMAP_W/2,cy:WMAP_H/2,w:300,h:300,img:null,fog:null,hot:null,ptr:new Map(),moved:0,pinch:0,t:0,acc:0,delay:0,fade:{vale:1,hoar:1,grey:1},seen:null,fit:null};
const wmapSx=ax=>(ax-WM.cx)*WM.k+WM.w/2, wmapSy=ay=>(ay-WM.cy)*WM.k+WM.h/2;
const wmapAx=sx=>(sx-WM.w/2)/WM.k+WM.cx, wmapAy=sy=>(sy-WM.h/2)/WM.k+WM.cy;
function wmapRng(s){ return ()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function wmapPip(p,x,y){ let c=false; for(let i=0,j=p.length-1;i<p.length;j=i++){ const a=p[i], b=p[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; }
function wmapEdgeDist(p,x,y){ let m=1e9; for(let i=0,j=p.length-1;i<p.length;j=i++){ const a=p[j], b=p[i], dx=b[0]-a[0], dy=b[1]-a[1], t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)); m=Math.min(m,Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)); } return m; }
// what is under a point of the art: a land's id ('home'...), 'unbuilt' (a region or fog bank that does not exist yet), or null (open sea)
function wmapRegionAt(x,y){
  for(const id of WMAP_IDS) if(wmapPip(WMAP_REG[WMAP_LAND[id]],x,y)) return id;
  for(const k of ['horn','sun','amber']) if(wmapPip(WMAP_REG[k],x,y)) return 'unbuilt';
  for(const I of WMAP_ISLES) if(wmapPip(I,x,y)) return 'unbuilt';
  for(const B of WMAP_BANKS) if(((x-B[0])/B[2])**2+((y-B[1])/B[3])**2<1) return 'unbuilt';
  return null;
}
/* ---- where you are on the art ---- */
// least squares  art = a x + b z + c  through the four villages and the towns drawn for them; only its slopes are used (the docs map is a drawing, not a survey)
function wmapFit(){
  if(WM.fit) return WM.fit;
  const W=[VIL,VIL2,VIL3,VIL4], T=[WMAP_TOWNS.village,WMAP_TOWNS.hanami,WMAP_TOWNS.rimehold,WMAP_TOWNS.highmark];
  const solve=pick=>{ const M=[[0,0,0],[0,0,0],[0,0,0]], r=[0,0,0];
    W.forEach((w,i)=>{ const a=[w.x,w.z,1]; for(let p=0;p<3;p++){ r[p]+=a[p]*T[i][pick]; for(let q=0;q<3;q++) M[p][q]+=a[p]*a[q]; } });
    for(let i=0;i<3;i++){ let m=i; for(let j=i+1;j<3;j++) if(Math.abs(M[j][i])>Math.abs(M[m][i])) m=j; [M[i],M[m]]=[M[m],M[i]]; [r[i],r[m]]=[r[m],r[i]];
      for(let j=i+1;j<3;j++){ const f=M[j][i]/M[i][i]; for(let k=i;k<3;k++) M[j][k]-=f*M[i][k]; r[j]-=f*r[i]; } }
    const x=[0,0,0]; for(let i=2;i>=0;i--){ let s=r[i]; for(let j=i+1;j<3;j++) s-=M[i][j]*x[j]; x[i]=s/M[i][i]; } return x; };
  return WM.fit={u:solve(0),v:solve(1)};
}
// your pin: from your land's village (exact there) by the fitted slopes, and never outside your land's region (a coast the drawing does not have is walked back to the shore)
function wmapPin(){
  if(dgIn()) return null;   // (a run is far from the map)
  const land=landHere(), V=[VIL,VIL2,VIL3,VIL4][['home','vale','hoar','grey'].indexOf(land)], T=WMAP_TOWNS[WMAP_TOWN[land]], F=wmapFit(), dx=P.x-V.x, dz=P.z-V.z;
  const tx=T[0]+F.u[0]*dx+F.u[1]*dz, ty=T[1]+F.v[0]*dx+F.v[1]*dz, poly=WMAP_REG[WMAP_LAND[land]];
  if(wmapPip(poly,tx,ty)&&wmapEdgeDist(poly,tx,ty)>6) return [tx,ty];
  let lo=0, hi=1; for(let i=0;i<14;i++){ const m=(lo+hi)/2; if(wmapPip(poly,T[0]+(tx-T[0])*m,T[1]+(ty-T[1])*m)&&wmapEdgeDist(poly,T[0]+(tx-T[0])*m,T[1]+(ty-T[1])*m)>6) lo=m; else hi=m; }
  return [T[0]+(tx-T[0])*lo,T[1]+(ty-T[1])*lo];
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
// a fog group: puffs over some polygons / ellipses (a little past their edges), drawn once into a canvas of its own at `scale` of the art and cropped to its box
function wmapFogGroup(polys,ells,spacing,seed,scale){
  const rnd=wmapRng(seed), pad=spacing*2.8;   // (a puff reaches about 1.8 spacings: the box must not cut one)
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const p of polys) for(const q of p){ x0=Math.min(x0,q[0]); y0=Math.min(y0,q[1]); x1=Math.max(x1,q[0]); y1=Math.max(y1,q[1]); }
  for(const e of ells){ x0=Math.min(x0,e[0]-e[2]); y0=Math.min(y0,e[1]-e[3]); x1=Math.max(x1,e[0]+e[2]); y1=Math.max(y1,e[1]+e[3]); }
  x0=Math.floor(x0-pad); y0=Math.floor(y0-pad); x1=Math.ceil(x1+pad); y1=Math.ceil(y1+pad);
  const near=(px,py)=>polys.some(p=>wmapPip(p,px,py)||wmapEdgeDist(p,px,py)<spacing*0.55)||ells.some(e=>((px-e[0])/(e[2]+spacing*0.4))**2+((py-e[1])/(e[3]+spacing*0.4))**2<1);
  const puffs=[]; for(let py=y0;py<y1;py+=spacing*0.8) for(let px=x0;px<x1;px+=spacing){ const jx=px+(rnd()-0.5)*spacing*0.8+((Math.round((py-y0)/(spacing*0.8))&1)?spacing*0.5:0), jy=py+(rnd()-0.5)*spacing*0.6; if(near(jx,jy)) puffs.push([jx,jy,spacing*(0.72+rnd()*0.42)]); }
  puffs.sort((a,b)=>a[1]-b[1]);
  const cv=document.createElement('canvas'); cv.width=Math.ceil((x1-x0)*scale); cv.height=Math.ceil((y1-y0)*scale); const x=cv.getContext('2d'); x.scale(scale,scale); x.translate(-x0,-y0);
  for(const p of puffs){ const h=x.createRadialGradient(p[0],p[1],0,p[0],p[1],p[2]*2.3); h.addColorStop(0,'rgba(80,40,120,.34)'); h.addColorStop(1,'rgba(80,40,120,0)'); x.fillStyle=h; x.beginPath(); x.arc(p[0],p[1],p[2]*2.3,0,TAU); x.fill(); }   // (a haze under them, so the fringe is soft)
  for(const p of puffs) wmapPuff(x,p[0],p[1],p[2],rnd);
  return {cv,x0,y0,scale,n:puffs.length};
}
function wmapFogBuild(){
  if(WM.fog) return;
  const sc=LITE?0.33:LOW?0.45:0.6, R=WMAP_REG;
  WM.fog={base:[wmapFogGroup([R.horn],[],22,11,sc),wmapFogGroup([R.sun,R.amber],[],22,12,sc),wmapFogGroup(WMAP_ISLES,[],22,13,sc),   // the unbuilt regions and the banks of the open sea: never lift
      ...WMAP_BANKS.map((b,i)=>wmapFogGroup([],[b],22,14+i,sc))],
    vale:wmapFogGroup([R.vale],[],24,21,sc),hoar:wmapFogGroup([R.frost],[],24,31,sc),grey:wmapFogGroup([R.grey],[],24,41,sc)};   // these lift as their lands open (a group a cluster keeps the canvases small)
}
/* ---- state of the fog: which lands you have already seen open (so a new one is revealed once) ---- */
function wmapSeen(){ if(!WM.seen){ try{ WM.seen=JSON.parse(localStorage.getItem('wildwood-wmap'))||[]; }catch(_){ WM.seen=[]; } if(!Array.isArray(WM.seen)) WM.seen=[]; } return WM.seen; }
function wmapSeenAdd(id){ const s=wmapSeen(); if(!s.includes(id)){ s.push(id); try{ localStorage.setItem('wildwood-wmap',JSON.stringify(s)); }catch(_){} } }
function wmapFogReset(){
  for(const id of ['vale','hoar','grey']) WM.fade[id]=landOpen(id)&&wmapSeen().includes(id)?0:1;   // an open land you have not seen open yet starts under fog and the fog lifts when the map opens
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
function wmapHome(){   // the land and its isles fill the view (the art has a wide margin of sea), centred
  WM.k=clamp(Math.min(WM.w/1500,WM.h/1300),WM.min,WM.max); WM.cx=935; WM.cy=855; wmapClamp();
}
/* ---- drawing ---- */
function wmapPath(x,poly){ x.beginPath(); poly.forEach((p,i)=>{ const sx=wmapSx(p[0]), sy=wmapSy(p[1]); if(i) x.lineTo(sx,sy); else x.moveTo(sx,sy); }); x.closePath(); }
// a scroll with rolled ends, like the reference's labels; its width is guessed from the letters (measureText is not worth its cost here)
const wmapBannerW=name=>Math.round(name.length*8.6+44);
function wmapBanner(x,cx,cy,name,sub,hot){
  const w=wmapBannerW(name), h=sub?38:27, s=hot?1.07:1;
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
  const ok=WM.img&&WM.img.complete&&WM.img.naturalWidth!==0;
  if(ok){ x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(WM.img,wmapSx(0),wmapSy(0),WMAP_W*WM.k,WMAP_H*WM.k); }
  else { x.fillStyle='rgba(238,240,226,.75)'; x.font='14px Inter, system-ui, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('Unrolling the map…',W/2,H/2); }
  wmapFogBuild();
  WM.fog.base.forEach((g,i)=>wmapFogDraw(x,g,1,Math.sin(t*0.7+i)*3));
  for(const id of ['vale','hoar','grey']) wmapFogDraw(x,WM.fog[id],WM.fade[id]*WMAP_FOG_MAX[id],Math.sin(t*0.7+id.length+id.charCodeAt(0))*3);
  if(WM.hot&&WM.hot!=='unbuilt'&&landOpen(WM.hot)){   // the land under the pointer glows (over the fog: its neighbours' clouds cover its edge)
    wmapPath(x,WMAP_REG[WMAP_LAND[WM.hot]]); x.fillStyle='rgba(255,244,200,.1)'; x.fill();
    x.save(); x.shadowColor='rgba(255,222,120,.8)'; x.shadowBlur=14; x.strokeStyle='rgba(255,240,180,.9)'; x.lineWidth=2.6; x.lineJoin='round'; x.stroke(); x.restore();
  }
  x.textAlign='center'; x.textBaseline='middle';
  for(const id of WMAP_IDS){
    const a=id==='home'?1:1-clamp(WM.fade[id]*1.6); if(a<=0.02||!landOpen(id)) continue;
    x.globalAlpha=a;
    const T=WMAP_TOWNS[WMAP_TOWN[id]]; x.font='italic 12px Georgia, serif'; x.lineWidth=3.6; x.lineJoin='round'; x.strokeStyle='rgba(247,238,214,.92)'; x.fillStyle='#3a2410';
    const tx=wmapSx(T[0]), ty=wmapSy(T[1])+Math.max(17,36*WM.k); x.strokeText(WMAP_TOWN_NAME[WMAP_TOWN[id]],tx,ty); x.fillText(WMAP_TOWN_NAME[WMAP_TOWN[id]],tx,ty);
    const B=WMAP_BANNER[WMAP_LAND[id]]; wmapBanner(x,wmapSx(B.x),wmapSy(B.y),B.name,'Levels '+B.levels,WM.hot===id);
    x.globalAlpha=1;
  }
  { const p=wmapPin(); if(p) wmapPinDraw(x,wmapSx(p[0]),wmapSy(p[1]),t); }
  x.font='600 12px Inter, system-ui, sans-serif'; x.textAlign='right'; x.textBaseline='alphabetic'; x.shadowColor='rgba(0,0,0,.9)'; x.shadowBlur=4; x.fillStyle='#fff';
  x.fillText(isTouch?'Tap a land · drag to pan · pinch to zoom':'Click a land · drag to pan · scroll to zoom',W-14,H-12); x.shadowColor='transparent'; x.shadowBlur=0;
}
function wmapUpdate(dt){
  if(wmapEl.hidden) return;
  WM.acc+=dt; if(WM.acc<(LOW?0.05:0.033)) return; dt=WM.acc; WM.acc=0;   // (30 frames a second are plenty for a map; 20 on a weak phone)
  WM.t+=dt; WM.delay-=dt;
  for(const id of ['vale','hoar','grey']){
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
  const B=WMAP_BANNER[WMAP_LAND[id]];
  if(!landOpen(id)) return WMAP_LOCK[id];
  return B.name+' · levels '+B.levels+(landHere()===id?' · you are here':' · click to open its map');
}
// the banner of an open land counts as the land (it is drawn over the neighbours' edges)
function wmapBannerAt(sx,sy){
  for(const id of WMAP_IDS){ if(!landOpen(id)||(id!=='home'&&WM.fade[id]>0.6)) continue;
    const B=WMAP_BANNER[WMAP_LAND[id]]; if(Math.abs(sx-wmapSx(B.x))<=wmapBannerW(B.name)/2+6&&Math.abs(sy-wmapSy(B.y))<=23) return id; }
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
function wmapLoad(){
  if(WM.img||typeof Image!=='function') return;
  const src=(window.WILDWOOD_IMG||{})['world-map']; if(!src) return;
  WM.img=new Image(); WM.img.src=src;
}
function wmapOpen(){
  if(dgIn()) return;   // (a run has its own map)
  openPanel('wmap'); wmapLoad(); wmapSize(); wmapHome(); wmapFogReset(); WM.ptr.clear(); WM.hot=null; wmapTip.hidden=true; wmapDraw();
  $('#wmapHere').textContent='You are in '+LANDS[landHere()].name.replace(/^The /,'the ');
}
function wmapToggle(){ if(wmapEl.hidden) wmapOpen(); else closePanels(); }
$('#mapWorld').addEventListener('click',wmapOpen);
addEventListener('keydown',e=>{ if(kbIs(e.code,'world') && started && !customizing && !e.repeat) wmapToggle(); });
addEventListener('resize',()=>{ if(!wmapEl.hidden){ wmapSize(); wmapDraw(); } });
