//@ The puzzle stones on the maps: a small rune on the minimap and the land map (lit while the stone is ready, grey while it renews), a dot on the world map; nothing while PZ_ON is off
/* Agent map. pzMapMarks(x,at,inside,DPR,full) is called by game/ui/map.js (drawMinimap, drawFullMap); pzWorldMarks(x) by game/ui/world-map.js (wmapDraw). Colour by difficulty (PZ_MAP_COL), size too; a dim stone shows the 2-hour timer on the land map only.
   Hooks: marked `// puzzles:` in ui/map.js and ui/world-map.js. Test: client-smoke (loads). */
const PZ_MAP_COL=[null,'#bfe9f5','#8fd8ff','#7fe39a','#ffd24a','#ff9ad0'];
function pzMapMarks(x,at,inside,DPR,full){
  if(!PZ_ON||!GEAR) return; const now=Date.now();
  for(const S of PZ_SITES){
    if(!inside(S.x,S.z)) continue; const [a,b]=at(S.x,S.z), R=GEAR.pz&&GEAR.pz[S.id], dim=!!(R&&R.t>now), r=(full?3.2:2.6)*DPR+S.diff*0.5*DPR;
    x.save(); x.translate(a,b); x.rotate(0.785); x.fillStyle=dim?'#5d6772':PZ_MAP_COL[S.diff]; x.strokeStyle='#0b1218'; x.lineWidth=1.2*DPR;
    x.fillRect(-r*0.7,-r*0.7,r*1.4,r*1.4); x.strokeRect(-r*0.7,-r*0.7,r*1.4,r*1.4);
    if(S.diff===5&&!dim){ x.strokeStyle='#fff3c4'; x.lineWidth=1.4*DPR; x.strokeRect(-r,-r,r*2,r*2); }
    x.restore();
  }
}
function pzWorldMarks(x){
  if(!PZ_ON||!GEAR) return;
  for(const S of PZ_SITES){ const land=landAt(S.x,S.z); if(!landOpen(land)||WM.fade[land]>0.5) continue; const A=wmapArt(S.x,S.z); x.fillStyle=PZ_MAP_COL[S.diff]; x.strokeStyle='#0b1218'; x.lineWidth=0.8; x.beginPath(); x.arc(wmapSx(A[0]),wmapSy(A[1]),S.diff>=4?2.2:1.5,0,TAU); x.fill(); x.stroke(); }
}
