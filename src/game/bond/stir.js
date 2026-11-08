//@ The hour's Stirrings on the client: the picks made drawable once (zone outlines, the boss's arena, the door, the raid), their glow on the land map, the minimap and the world map, and the "Stirrings this hour" box
/* Agent map (skills revamp step 16; PLAN section 3b; the picks come from the server: BDC_STIR in bond/orbs.js, event stir, welcome.stir; protocol: docs/PROTOCOL.md; test: client-smoke, the stirrings block).
   bdcStirGet() -> BDC_ST {m (the message it was built from), zones [{land, zn, key, name, x, z, R, poly (flat [x, z, ...] world metres)}], byLand {land: zone}, boss {id, name, short, land, x, z, lv}, place {k: 'dg' | 'rd', name, land, x, z}}
          or null before the first pick. Built once per pick (the minimap draws ten times a second: nothing is worked out in a frame but the visible zones' outlines), cleared by bdcOnStir (orbs.js).
   bdcStirLeft() seconds to the next hour; bdcStirBoxHtml(open) the box's markup (the Bonds panel, panel.js).
   Drawing (called from map.js / world-map.js / dungeon/board.js / raids/hud.js, one line each marked // bond:): bdcMapGlow(x,at,land,DPR) (the zone under the labels), bdcMapMarks(x,at,land,fs,label,DPR) (rings and tags of the boss, the door, the raid),
          bdcMiniMarks(x,at,inside,DPR,W) (the glow in view, an edge star toward your land's spot out of view), bdcWorldMarks(x) / bdcWorldTip(sx,sy) (the boss on Eldmere's map), bdcZoneNote(zn), bdcDoorNote(theme), bdcRaidNote(id) (a sentence or '').
   Only function declarations and var: map code may call them while the page loads. */
var BDC_ST=null;
function bdcStirPoly(zn){   // a zone's outline as flat world coordinates: its 64 rays out to the border (a circle of R for a zone without rays)
  const out=[], n=zn.rays?zn.rays.length:40;
  for(let k=0;k<n;k++){ const a=k/n*TAU, r=zn.rays?zn.rays[k]:zn.R; out.push(zn.x+Math.sin(a)*r,zn.z+Math.cos(a)*r); }
  return out;
}
function bdcStirGet(){
  const m=BDC_STIR; if(!m||typeof m!=='object'||!m.z||typeof m.z!=='object') return null;
  if(BDC_ST&&BDC_ST.m===m) return BDC_ST;
  const S={m,zones:[],byLand:{},boss:null,place:null};
  for(const land of Object.keys(m.z)){
    const key=String(m.z[land]), zn=ZONES.find(q=>String(q.key)===key); if(!zn) continue;
    const Z={land,zn,key,name:zn.name,x:zn.x,z:zn.z,R:zn.R||0,poly:bdcStirPoly(zn)}; S.zones.push(Z); S.byLand[land]=Z;
  }
  const bd=BOSS_DEFS.find(b=>b.def.id===m.b), A=bd&&ARENAS.find(a=>a.key===bd.arena);
  if(bd&&A){ const land=landAt(A.x,A.z); S.boss={id:m.b,name:bd.def.name,short:bd.short,land,x:A.x,z:A.z,lv:bossLvIn(bd.def,land)}; }
  if(m.k==='dg'&&bdOwnKey(DG_ENTRANCES,m.id)){ const E=DG_ENTRANCES[m.id], T=DG_THEMES[m.id]; S.place={k:'dg',name:T?T.name:E.name,land:landAt(E.x,E.z),x:E.x,z:E.z}; }
  else if(m.k==='rd'&&bdOwnKey(RDS,m.id)){ const R=RDS[m.id]; S.place={k:'rd',name:R.name,land:R.land,x:R.x,z:R.z}; }
  BDC_ST=S; return S;
}
function bdcStirLeft(){ const m=BDC_STIR; return m&&Number.isFinite(m.h)?Math.max(0,Math.round((m.h+1)*BD_STIR_SECS-Date.now()/1000)):0; }
const bdcLeftText=s=>s>=3600?'1 hour':s>=90?Math.ceil(s/60)+' minutes':s>0?'under a minute':'now';
function bdcStar(x,cx,cy,r,fill){   // a five-point star in gold with a dark edge (the glow's mark)
  x.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, q=i%2?r*0.45:r; x.lineTo(cx+Math.cos(a)*q,cy+Math.sin(a)*q); } x.closePath();
  x.fillStyle=fill||'#ffd24a'; x.strokeStyle='#4a2f05'; x.lineWidth=Math.max(1,r*0.2); x.stroke(); x.fill();
}
const bdcPulse=()=>0.5+0.5*Math.sin(performance.now()/450);
function bdcGlowPath(x,Z,at){ x.beginPath(); for(let i=0;i<Z.poly.length;i+=2){ const p=at(Z.poly[i],Z.poly[i+1]); if(i) x.lineTo(p[0],p[1]); else x.moveTo(p[0],p[1]); } x.closePath(); }
function bdcGlowDraw(x,Z,at,DPR,wide){
  const u=bdcPulse(); bdcGlowPath(x,Z,at);
  x.fillStyle='rgba(255,214,90,'+(0.2+0.12*u).toFixed(3)+')'; x.fill(); x.lineJoin='round';
  x.strokeStyle='rgba(255,210,80,'+(0.3+0.25*u).toFixed(3)+')'; x.lineWidth=wide*DPR; x.stroke();
  x.strokeStyle='rgba(255,240,175,1)'; x.lineWidth=(wide>6?2:2.4)*DPR; x.stroke();
}
// ---- the land map: the zone's glow goes under the labels, the rings and tags over them ----
function bdcMapGlow(x,at,land,DPR){ const S=bdcStirGet(), Z=S&&S.byLand[land]; if(Z){ x.save(); bdcGlowDraw(x,Z,at,DPR,7); x.restore(); } }
function bdcMapMarks(x,at,land,fs,label,DPR){
  const S=bdcStirGet(); if(!S) return; const u=bdcPulse();
  const ring=(wx,wz,r,tag)=>{ const [cx,cy]=at(wx,wz); x.save(); x.strokeStyle='rgba(255,224,110,'+(0.55+0.4*u).toFixed(3)+')'; x.lineWidth=2.2*DPR; x.beginPath(); x.arc(cx,cy,(r+u*2)*DPR,0,TAU); x.stroke(); x.restore(); bdcStar(x,cx+(r+3)*DPR,cy-(r+3)*DPR,5*DPR); label(tag,cx,cy+fs*2.5,fs*0.85,'#ffe28a',true); };
  const Z=S.byLand[land]; if(Z){ const [cx,cy]=at(Z.x,Z.z); bdcStar(x,cx,cy-fs*2.4,fs*0.62); label('Stirring spot',cx,cy+fs*2.05,fs*0.85,'#ffe28a',true); }
  if(S.boss&&S.boss.land===land) ring(S.boss.x,S.boss.z,11,'Stirring boss');
  if(S.place&&S.place.land===land) ring(S.place.x,S.place.z,S.place.k==='dg'?9:12,S.place.k==='dg'?'Stirring dungeon':'Stirring raid');
}
// ---- the minimap: the outline of a zone in view; out of view, a star at the edge toward the spot of your land ----
function bdcMiniMarks(x,at,inside,DPR,W){   // W: the canvas's width
  const S=bdcStirGet(); if(!S) return; const u=bdcPulse();
  let shown=false;
  for(const Z of S.zones){ if(Math.abs(Z.x-P.x)>Z.R+MM_R||Math.abs(Z.z-P.z)>Z.R+MM_R) continue; x.save(); bdcGlowDraw(x,Z,at,DPR,6); x.restore(); shown=true; }
  if(!shown){ const Z=S.byLand[landHere()]; if(Z&&Math.hypot(Z.x-P.x,Z.z-P.z)<900){ const ang=Math.atan2(Z.x-P.x,-(Z.z-P.z)), rr=W/2-9*DPR; bdcStar(x,W/2+Math.sin(ang)*rr,W/2-Math.cos(ang)*rr,(5+u)*DPR); } }
  for(const T of [S.boss,S.place]) if(T&&inside(T.x,T.z)){ const [cx,cy]=at(T.x,T.z); x.strokeStyle='rgba(255,224,110,'+(0.6+0.35*u).toFixed(3)+')'; x.lineWidth=2*DPR; x.beginPath(); x.arc(cx,cy,(7+u*1.5)*DPR,0,TAU); x.stroke(); }
}
// ---- Eldmere's map: the boss ----
function bdcWorldAt(){   // the boss's place in screen pixels, or null (an unopened land or a fogged one has none)
  const S=bdcStirGet(), B=S&&S.boss; if(!B||!landOpen(B.land)) return null;
  const a=B.land==='home'?1:1-clamp(WM.fade[B.land]*1.6); if(a<=0.02) return null;
  const p=wmapArt(B.x,B.z); return {x:wmapSx(p[0]),y:wmapSy(p[1]),a,B};
}
function bdcWorldMarks(x){
  const T=bdcWorldAt(); if(!T) return; const u=bdcPulse(), r=11+u*3;
  x.save(); x.globalAlpha=T.a; x.strokeStyle='rgba(255,224,110,'+(0.5+0.45*u).toFixed(3)+')'; x.lineWidth=2.4; x.beginPath(); x.arc(T.x,T.y,r,0,TAU); x.stroke();
  x.fillStyle='rgba(255,214,90,.2)'; x.fill(); bdcStar(x,T.x,T.y,7);
  x.font='italic 11.5px Georgia, serif'; x.textAlign='center'; x.textBaseline='middle'; x.lineWidth=3.4; x.lineJoin='round'; x.strokeStyle='rgba(247,238,214,.95)'; x.fillStyle='#6a4300';
  x.strokeText('Stirring: '+T.B.short,T.x,T.y+r+9); x.fillText('Stirring: '+T.B.short,T.x,T.y+r+9); x.restore();
}
function bdcWorldTip(sx,sy){ const T=bdcWorldAt(); return T&&Math.hypot(sx-T.x,sy-T.y)<18?'Stirring boss: '+T.B.name+' (level '+T.B.lv+') opens Bond Orbs for every helper, more at every tier':''; }
// ---- a sentence on the tooltip of the land map and the Delve board ----
function bdcZoneNote(zn){ const S=bdcStirGet(); return S&&zn&&S.zones.some(Z=>Z.zn===zn)?' · Stirring this hour: 60 kills open a Bond Orb':''; }
function bdcDoorNote(theme){ const m=BDC_STIR; return m&&m.k==='dg'&&m.id===theme?'Stirring this hour: a clear opens '+BD_STIR_DG+' Bond Orbs':''; }
function bdcRaidNote(id){ const m=BDC_STIR; return m&&m.k==='rd'&&m.id===id?'Stirring this hour: a clear opens '+BD_STIR_RD+' Bond Orbs':''; }
// ---- the box in the Bonds panel ----
function bdcStirBoxHtml(open){   // open: the whole list; false: the header and one line (a phone's default, the header toggles it)
  const S=bdcStirGet(), here=landHere();
  if(!S) return '<div class="bdc-sh"><b>Stirrings this hour</b></div><p class="bdc-note">The server has not named this hour\'s Stirrings yet.</p>';
  const left=bdcLeftText(bdcStirLeft()), rows=[], head='<button class="bdc-sh bdc-sht" type="button" data-bdcstir="1" aria-expanded="'+!!open+'"><b>Stirrings this hour</b><span>changes in '+left+' <i class="bdc-chev"></i></span></button>';
  if(!open){ const mine=S.byLand[here], bits=[mine?mine.name+' (your land)':'', S.boss?S.boss.short:'', S.place?S.place.name:''].filter(Boolean); return head+'<div class="bdc-line"><i class="bdc-stars"></i>'+bits.join(' <i class="bdc-stars"></i> ')+'</div>'; }
  for(const Z of S.zones){ const mine=Z.land===here; rows.push('<li'+(mine?' class="mine"':'')+'><i class="bdc-stars"></i><span><b>'+Z.name+'</b> <em>level '+zoneLvText(Z.zn)+', '+(LANDS[Z.land]?LANDS[Z.land].name:Z.land)+(mine?' &middot; your land':'')+'</em></span></li>'); }
  const b=S.boss, pl=S.place;
  return head
    +'<div class="bdc-sg"><div class="bdc-sk">Spots <small>'+BD_STIR_CHARGE+' kills open an orb, an elite counts '+BD_STIR_ELITE+'; glowing on the map</small></div><ul class="bdc-spots">'+rows.join('')+'</ul></div>'
    +(b?'<div class="bdc-sg"><div class="bdc-sk">Boss <small>orbs a kill for every helper, more at every tier</small></div><ul class="bdc-spots"><li><i class="bdc-stars"></i><span><b>'+b.name+'</b> <em>level '+b.lv+', '+(LANDS[b.land]?LANDS[b.land].name:b.land)+'</em></span></li></ul></div>':'')
    +(pl?'<div class="bdc-sg"><div class="bdc-sk">'+(pl.k==='dg'?'Dungeon':'Raid')+' <small>a clear opens '+(pl.k==='dg'?BD_STIR_DG:BD_STIR_RD)+' orbs</small></div><ul class="bdc-spots"><li><i class="bdc-stars"></i><span><b>'+pl.name+'</b> <em>'+(LANDS[pl.land]?LANDS[pl.land].name:pl.land)+'</em></span></li></ul></div>':'');
}
