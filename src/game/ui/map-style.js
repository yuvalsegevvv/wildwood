//@ The map's dressing, as Eldmere's map has it: a gold-lined frame with corner diamonds, a compass rose, the red pin, serif labels on a parchment halo and the land's title scroll
/* Agent map. What it owns: the pieces drawn over the painted ground (ui/map-paint.js) by the minimap and the land maps (ui/map.js), so they look like the world map (ui/world-map.js, which these borrow the scroll from).
   mapStFrame (a thin gold line inside the edge and a diamond on each corner), mapStCompass (a rose with the N above it), mapStPin (the red pin with the white eye and the way you face), mapStLabel (a label in
   Georgia, dark brown ink on a pale halo; the old light-on-dark colours of map.js's calls are mapped to inks in MAPST_INK, so dungeon/entrances.js's labels follow without a change), mapStRibbon (the land's name
   on the world map's scroll, in the top left corner). All sizes are in canvas pixels (the caller's DPR is in them). Used by: ui/map.js. Test: tools/client-smoke.js. Names: mapSt..., MAPST_. */
const MAPST_GOLD='#d6b25a', MAPST_BROWN='#3a2410', MAPST_HALO='rgba(247,238,214,.9)', MAPST_HALO_WATER='rgba(226,244,250,.88)';
// the colours map.js asks for (light, made for a dark picture) → [ink, italic, water halo]; any other colour gets plain brown ink
const MAPST_INK={'#f2f0e4':['#2c1c0c',0,0],'#fff4d0':['#2c1c0c',0,0],'#ffcf8a':['#6a3f12',1,0],'#e8b8ff':['#4a1a5e',0,0],'#ffe4a0':['#5a2a08',0,0],'#e8e0d0':['#3a2410',1,0],
  '#b4aea4':['#6a6258',1,0],'#cfe8f6':['#0f4a74',1,1],'#cfe6ff':['#143f78',1,1]};
function mapStFrame(x,W,H,dpr){
  const m=4*dpr, d=4.2*dpr;
  x.save(); x.strokeStyle=MAPST_GOLD; x.globalAlpha=0.9; x.lineWidth=Math.max(1,1.2*dpr); x.strokeRect(m,m,W-2*m,H-2*m); x.globalAlpha=1;
  x.fillStyle=MAPST_GOLD; x.strokeStyle=MAPST_BROWN; x.lineWidth=Math.max(1,dpr);
  for(const [cx,cy] of [[m,m],[W-m,m],[m,H-m],[W-m,H-m]]){ x.beginPath(); x.moveTo(cx,cy-d); x.lineTo(cx+d,cy); x.lineTo(cx,cy+d); x.lineTo(cx-d,cy); x.closePath(); x.fill(); x.stroke(); }
  x.restore();
}
// a four-point rose, the north point long and dark red, the others parchment and brown, the N above it
function mapStCompass(x,cx,cy,r){
  x.save(); x.translate(cx,cy); x.lineJoin='round'; x.lineWidth=Math.max(1,r*0.11);
  x.fillStyle='rgba(247,238,214,.88)'; x.strokeStyle=MAPST_BROWN; x.beginPath(); x.arc(0,0,r*0.78,0,TAU); x.fill(); x.stroke();
  const star=(len,wid,ang,fill)=>{ x.save(); x.rotate(ang); x.beginPath(); x.moveTo(0,-len); x.lineTo(wid,0); x.lineTo(0,len*0.18); x.lineTo(-wid,0); x.closePath(); x.fillStyle=fill; x.fill(); x.stroke(); x.restore(); };
  star(r*0.62,r*0.2,Math.PI/2,'#b9955a'); star(r*0.62,r*0.2,-Math.PI/2,'#b9955a'); star(r*0.62,r*0.2,Math.PI,'#8a6a3a'); star(r*1.02,r*0.24,0,'#b3342a');
  x.fillStyle=MAPST_BROWN; x.font=`bold ${Math.round(r*0.86)}px Georgia, "Palatino Linotype", serif`; x.textAlign='center'; x.textBaseline='alphabetic';
  x.lineWidth=Math.max(2,r*0.3); x.strokeStyle=MAPST_HALO; x.strokeText('N',0,-r*1.12); x.fillText('N',0,-r*1.12);
  x.restore();
}
// the pin of the world map as a dot on the ground: a red disc with a white eye and a small point the way you face (face: radians, 0 = north)
function mapStPin(x,cx,cy,r,face){
  x.save(); x.translate(cx,cy);
  x.fillStyle='rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(0,r*0.35,r*1.05,r*0.5,0,0,TAU); x.fill();
  x.rotate(face); x.beginPath(); x.moveTo(0,-r*2.05); x.lineTo(r*0.78,-r*0.6); x.lineTo(-r*0.78,-r*0.6); x.closePath(); x.fillStyle='#d8382c'; x.strokeStyle='#5a120d'; x.lineWidth=Math.max(1.4,r*0.3); x.lineJoin='round'; x.stroke(); x.fill();
  x.beginPath(); x.arc(0,0,r,0,TAU); x.stroke(); x.fill();
  x.fillStyle='#fff'; x.beginPath(); x.arc(0,0,r*0.42,0,TAU); x.fill();
  x.restore();
}
// a label: serif, dark ink, a pale halo (the world map's way); col is what map.js's calls pass
function mapStLabel(x,t,cx,cy,size,col,bold,dpr){
  const k=MAPST_INK[col]||[MAPST_BROWN,0,0];
  x.font=`${k[1]?'italic ':bold?'bold ':''}${Math.round(size)}px Georgia, "Palatino Linotype", serif`; x.lineJoin='round'; x.lineWidth=3.4*dpr;
  x.strokeStyle=k[2]?MAPST_HALO_WATER:MAPST_HALO; x.strokeText(t,cx,cy); x.fillStyle=k[0]; x.fillText(t,cx,cy);
}
// the land's name on the world map's scroll, top left, a little over the frame (the scroll is drawn in CSS pixels: the context is scaled by dpr)
function mapStRibbon(x,dpr,W,name,sub){
  const sc=clamp(W/dpr/640,0.72,1), w=wmapBannerW(name)*sc;
  x.save(); x.scale(dpr,dpr); wmapBanner(x,12+w/2,26*sc+4,name,sub,false,sc); x.restore();
}
