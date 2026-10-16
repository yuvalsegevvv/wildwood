//@ The Sunscar, the fifth land (levels 28-36, docs/areas/sunscar.md): its ground (a red-rock plateau with mesas, dunes, salt pans, glass fields, the north wall and the River Pass, the Bowl of Glasswell, the Glass River). Pure.
/* Agent map: sunHook(x,z,h,wN) is called by homeHeight (shared/terrain.js) for every point west of the Sunwall's plateau; everything else here is data and small land tests
   (SUN_CITY, SUN_PASS, SUN_MESAS, SUN_PANS, SUN_GLASS, SUN_RIVER, sunPassCarve, sunRiverAt, waterSurf's river branch in greyspine.js, sunKeepOut for camps / plants, the colour weights sunPanK /
   sunGlassK / sunDuneK / sunRockK / sunGreenK for game/world/terrain-color.js). Used by shared/glasswell.js (VIL5), zones (sunzones.js), the client's meshes (game/village/buildings-sunscar.js), the map.
   Test: node tools/sunscar-smoke.js. Names: sun..., SUN_...
   Where it is: west of the Sunwall (x < HX0 = -440), south of the north wall's crest (z >= borderZ(x), the Greyspine's south side), west to the Bight (x = WX0 = -1020), south to the Crownsea's western shore (z 440).
   The plateau is SUN_BASE (52 m, the Sunwall's top, so the Redgate Road runs onto it level). Features, each local and cheap to ask: the north wall (wallAdd, the same as the forest's), the River Pass
   (a canyon through it, the Greyspine's river road), the mesas (flat-topped, flanks under 1.0 so they can be climbed), the salt pans and the glass fields (flat, a little low), the dunes (long waves
   of 90-130 m), the Bowl (gwRimH carried by the heightmap, so the city's rim is real ground and the collision is the slope limit), and the river: born at the Springhead where the pass opens
   (the Greyspine's river runs on underground, shared/greyspine.js), through the River Gate, the lake and the Weir, and down the Bight Gorge to the sea. */
const SUN_BASE=SUNWALL_H;
const SUN_CITY={x:-700,z:20,h:SUN_BASE-GLASSWELL.skirtH,r:80};   // the Bowl's centre (the Old Citadel) and its floor
const SUN_FLAT=190;                                              // the city's flat apron: the heightmap is the Bowl's shape to here, the plateau's beyond
// The River Pass: the Greyspine's river road. A canyon from the Long Valley's southern flank (z -575) south through the north wall to the plateau; floor w wide, walls climbing beyond.
const SUN_PASS={w:9,ramp:26,gateZ:-540,pts:[[-797,-574],[-795,-548],[-791,-530],[-793,-470],[-799,-410],[-806,-350],[-803,-290],[-798,-235]]};
function sunPassX(z){
  const P=SUN_PASS.pts; if(z<=P[0][1]) return P[0][0]; if(z>=P[P.length-1][1]) return P[P.length-1][0];
  for(let i=1;i<P.length;i++) if(z<=P[i][1]){ const t=(z-P[i-1][1])/(P[i][1]-P[i-1][1]); return lerp(P[i-1][0],P[i][0],t)+Math.sin(z*0.045)*3; }
  return P[P.length-1][0];
}
{ const G=GREY_GATES[0]; G.x=sunPassX(-392); G.z=Math.round(borderZ(G.x)-10); G.x=sunPassX(G.z); }   // the rock fall stands in the canyon just short of the north wall's crest, shared/greyspine.js
const SUN_PASS_FLOOR0=greyFloor(SUN_PASS.pts[0][0],SUN_PASS.pts[0][1]);
const sunPassFloor=z=>lerp(SUN_PASS_FLOOR0,SUN_BASE+0.4,smoothstep(-570,-300,z));
GREY_GATES[0].h=sunPassFloor(GREY_GATES[0].z);
// Redgate Canyon (the forest's way onto the plateau, shared/terrain.js: sunwall) is shut by a rock fall until the sand wyrm falls (gear.redgate); it stands in the canyon, halfway up the cliff's ramp
const SUN_RED={id:'redgate',dir:'e',x:HX0+REDGATE_CL-6,z:REDGATE_Z,w:10,name:'Redgate Canyon',boss:'sandwyrm'};   // dir 'e': a plane x = const held from both sides (gateHold, shared/greyspine.js)
GREY_GATES.push(SUN_RED);   // the third rock fall: the same record, the same gear flag (gear.redgate), the same mesh builder (game/village/buildings-grey.js)
const sunRedBeyond=(x,z)=>x<SUN_RED.x&&Math.abs(z-SUN_RED.z)<40;   // west of the rock fall (the Sunscar's side)
/* While Redgate Canyon's rock fall stands (gear.redgate 0) the Sunwall's crest is a wall: nobody crosses the line L(z) = HX0 + sunwallLine(z) - 8, the cliff's top edge, from either side
   (the canyon's own band is held by its rock fall, gateHold). The cliff is climbable here and there on its own (a diagonal climb under SLOPE_MAX), so the ground alone does not keep the land shut.
   o: the new position, ox: the old x. Used by the client's movement and the server's setPos. */
function sunWallHold(o,ox){
  if(Math.abs(o.z-SUN_RED.z)<SUN_RED.w+30||o.x>HX0+90||ox>HX0+90) return;
  const L=HX0+sunwallLine(o.z)-8;
  if(ox>=L&&o.x<L) o.x=L; else if(ox<L&&o.x>=L) o.x=L-0.01;
}
/* The north wall's crest is a wall of its own while the River Pass is shut (gear.river, the Gryphon Queen): nobody climbs over it from either side. The pass itself is left to its
   rock fall (GREY_GATES[0]), which stands north of the crest. o: the new position, oz: the old z. Used by the client's movement and the server's setPos. */
function sunCrestHold(o,oz){
  if(o.x>=HX0) return; const bz=borderZ(o.x), a=Math.abs(o.z-bz); if(a>=14&&Math.abs(oz-bz)>=14) return;
  if(Math.abs(o.x-sunPassX(o.z))<SUN_PASS.w+2) return;
  if(oz<bz) o.z=Math.min(o.z,bz-14); else o.z=Math.max(o.z,bz+14);
}
function sunPassCarve(x,z,h){
  if(z<-580||z>-205||x<-880||x>-715) return h;
  const dx=Math.abs(x-sunPassX(z)), P=SUN_PASS; if(dx>P.w+P.ramp) return h;
  const m=smoothstep(P.w+P.ramp,P.w+1,dx)*smoothstep(-578,-556,z)*smoothstep(-205,-262,z);
  return lerp(h,sunPassFloor(z)+noise2(x*0.09,z*0.09)*0.25,m);
}
// features: mesas (flat tops, red flanks), salt pans, glass fields (the black glass sand the old war left)
const SUN_MESAS=[
  {x:-560,z:-215,rt:34,rf:74,h:24,name:'Redstone Mesa'},{x:-958,z:-52,rt:26,rf:66,h:20,name:'Anvil Rock'},{x:-905,z:352,rt:22,rf:60,h:22,name:'Twin Buttes'},
  {x:-548,z:262,rt:40,rf:86,h:28,name:'Bellrock'},{x:-478,z:150,rt:28,rf:68,h:22,name:'Ember Mesa'},{x:-720,z:-232,rt:20,rf:54,h:16,name:'The Lantern'}];
const SUN_PANS=[{x:-930,z:-172,rx:76,rz:46,name:'The Weeping Pan'},{x:-642,z:338,rx:84,rz:50,name:'The Whitefloor'},{x:-775,z:236,rx:38,rz:28,name:'Gull Pan'}];
const SUN_GLASS=[{x:-852,z:262,r:100,name:'The Glass Fields'},{x:-515,z:352,r:56,name:'The Cinder Glass'}];
function sunBlob(d,r,w){ return smoothstep(r+w,r-w,d); }
// 0..1 how much of the point is dune sand (long waves, strongest in the south-east and the north-centre)
function sunDuneK(x,z){
  if(x>-475) return 0;
  const k=smoothstep(-0.05,0.42,noise2(x*0.0042+5.1,z*0.0042-2.7)+0.12*noise2(x*0.011,z*0.011));
  return k*smoothstep(-470,-540,x);
}
function sunDuneH(x,z,k){
  const ph=(x*0.6+z*0.8)*0.05+noise2(x*0.009+2,z*0.009-5)*3.4, s=0.5+0.5*Math.sin(ph);
  return k*(Math.pow(s,1.7)*7.5+noise2(x*0.05,z*0.05)*0.5);
}
function sunMesaH(x,z){
  let m=0;
  for(const M of SUN_MESAS){ const dx=x-M.x; if(dx>M.rf+14||dx<-M.rf-14) continue; const dz=z-M.z; if(dz>M.rf+14||dz<-M.rf-14) continue;
    const d=Math.hypot(dx,dz)+noise2(x*0.03+M.x,z*0.03)*6; if(d<M.rf) m=Math.max(m,M.h*smoothstep(M.rf,M.rt,d)+noise2(x*0.06,z*0.06+M.z)*0.5*smoothstep(M.rf,M.rt,d)); }
  return m;
}
function sunPanK(x,z){
  let k=0;
  for(const P of SUN_PANS){ const dx=(x-P.x)/P.rx, dz=(z-P.z)/P.rz; if(dx>1.4||dx<-1.4||dz>1.4||dz<-1.4) continue; const e=Math.hypot(dx,dz)+noise2(x*0.025+P.x,z*0.025)*0.14; k=Math.max(k,smoothstep(1,0.78,e)); }
  return k;
}
function sunGlassK(x,z){
  let k=0;
  for(const G of SUN_GLASS){ const dx=x-G.x; if(dx>G.r+24||dx<-G.r-24) continue; const dz=z-G.z; if(dz>G.r+24||dz<-G.r-24) continue; k=Math.max(k,smoothstep(G.r+8,G.r-14,Math.hypot(dx,dz)+noise2(x*0.02+G.x,z*0.02)*14)); }
  return k;
}
// ---- the river: born at the Springhead (the pass's south mouth), through the city (the Bowl's own channel, glasswell.js) and down the Bight Gorge to the sea ----
const SUN_SPRING={x:-798,z:-228,r:13};
// upstream of the River Gate (world frame); the city's own part and the way out are added below from GLASSWELL
const SUN_RIVER_UP=[[-798,-228],[-794,-205],[-781,-178],[-762,-153],[-740,-134],[-716,-120],[-690,-112],[-660,-110]];   // (the River Gate's mouth is at city-frame [40.98,-144.33] = (-659,-124))
var SUN_RIVER=null, SUN_RIVER_UPN=0;   // [x,z,y surface,half-width] every ~8 m, filled by sunBuildRiver below
var _sunNoRiver=false;
function sunRiverAt(x,z){ // nearest point of the river outside the Bowl: {d, y}
  const R=SUN_RIVER, o=sunRiverAt.o||(sunRiverAt.o={d:1e9,y:0,w:3}); o.d=1e9; if(!R) return o;
  if(x<-1010||x>-640||z<-240||z>130) return o;
  for(let i=1;i<R.length;i++){ if(i===SUN_RIVER_UPN) continue; const a=R[i-1], b=R[i], vx=b[0]-a[0], vz=b[1]-a[1];
    if(x<Math.min(a[0],b[0])-24||x>Math.max(a[0],b[0])+24||z<Math.min(a[1],b[1])-24||z>Math.max(a[1],b[1])+24) continue;
    const l2=vx*vx+vz*vz, t=clamp(((x-a[0])*vx+(z-a[1])*vz)/l2), d=Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);
    if(d<o.d){ o.d=d; o.y=lerp(a[2],b[2],t); o.w=lerp(a[3],b[3],t); } }
  return o;
}
function sunRiverCut(x,z,h){
  const r=sunRiverAt(x,z); if(r.d>r.w*4) return h;
  const bed=r.y-0.65, prof=bed+1.7*Math.pow(r.d/(r.w+0.9),2);
  return lerp(h,Math.min(h,prof),smoothstep(r.w*4,r.w*1.5,r.d));
}
function sunSpringCut(x,z,h){
  const S=SUN_SPRING, d=Math.hypot(x-S.x,z-S.z); if(d>S.r*2.6) return h;
  h=lerp(h,Math.max(h,SUN_BASE+0.4),smoothstep(S.r*2.6,S.r*1.5,d)*0.7);   // a low bank round the pool
  return lerp(h,SUN_BASE-1.7,smoothstep(S.r*1.05,S.r*0.5,d));
}
// ---- the whole ground ----
// the door reserved for the later 'sandglass' dungeon (level-40 weapons): a position and a prop only, nothing opens it yet (docs/areas/sunscar.md); 230 m south of Glasswell's centre, on flat dune ground in zone s34
const SUN_DG_DOOR={id:'sandglass',name:'The Sandglass',x:-700,z:250,r:12,rot:Math.PI};
function sunKeepOut(x,z,m){   // water, the Springhead, the Bowl's rim, the reserved dungeon door: no camp, node or plant here (m: extra margin)
  m=m||0; if(Math.hypot(x-SUN_DG_DOOR.x,z-SUN_DG_DOOR.z)<SUN_DG_DOOR.r+m+6) return true; const dc=Math.hypot(x-SUN_CITY.x,z-SUN_CITY.z); if(dc<SUN_FLAT-30+m) return true;
  if(Math.hypot(x-SUN_SPRING.x,z-SUN_SPRING.z)<SUN_SPRING.r+4+m) return true;
  const r=sunRiverAt(x,z); return r.d<r.w+2+m;
}
// the plateau before the city and the river: wN is the north wall's term from homeHeight (the same wallAdd the forest's north rim has)
function sunBare(x,z,wN){
  let h=SUN_BASE+wN;
  const dk=sunDuneK(x,z); if(dk>0) h+=sunDuneH(x,z,dk);
  h+=sunMesaH(x,z);
  const pk=sunPanK(x,z); if(pk>0) h-=3.2*pk;
  const gk=sunGlassK(x,z); if(gk>0) h=lerp(h,SUN_BASE-1.6+noise2(x*0.11,z*0.11)*0.28+noise2(x*0.4,z*0.4)*0.08,gk);
  return h;
}
function sunGround(x,z,wN){
  let h=sunBare(x,z,wN);
  const rs=Math.hypot(x-SUN_SPRING.x,z-SUN_SPRING.z); if(rs<300) h+=2.0*smoothstep(300,40,rs)*(1-smoothstep(-300,-230,z));   // the aquifer's gentle rise round the Springhead
  const cx=x-SUN_CITY.x, cz=z-SUN_CITY.z, r2=cx*cx+cz*cz;
  if(r2<SUN_FLAT*SUN_FLAT){ const r=Math.sqrt(r2), t=smoothstep(SUN_FLAT,SUN_FLAT-42,r);   // the Bowl, its skirt and a flat apron (gwRimH is skirtH, the plateau, beyond 142 m)
    h=lerp(h,SUN_CITY.h+gwRimH(cx,cz)+gwCityCut(cx,cz),t); }
  if(!_sunNoRiver){ h=sunSpringCut(x,z,h); h=sunRiverCut(x,z,h); }
  return h;
}
// the shore: west to the Bight and south to the Crownsea; coastDist's Sunscar part
function sunCoast(x,z){ return Math.min((WZ1-z)+noise2(x*0.011+17,z*0.011-29)*10-(noise2(x*0.0045+5,z*0.0045-7)*0.5+0.5)*28, (x-WX0)+noise2(x*0.009+3,z*0.009-11)*14-(noise2(x*0.0042-4,z*0.0042+6)*0.5+0.5)*30+8); }
// called by homeHeight for the points west of the Sunwall's plateau (ks eases it in over the plateau's first 60 m)
function sunHook(x,z,h,wN){
  const ks=smoothstep(HX0-12,HX0-72,x); if(ks<=0) return h;
  return lerp(h,sunGround(x,z,wN),ks);
}
// colour weights for terrain-color.js: red rock on the mesas and the wall, the dunes, the pans and the glass; green on the river's banks and round the Springhead
function sunRockK(x,z,g){ return Math.max(smoothstep(0.35,0.9,g),0)*0.9; }
function sunGreenK(x,z){
  const r=sunRiverAt(x,z), a=r.d<40?smoothstep(40,r.w+2,r.d):0, S=SUN_SPRING, ds=Math.hypot(x-S.x,z-S.z), b=ds<70?smoothstep(70,S.r,ds):0;
  return Math.max(a,b)*0.9;
}
// ---- the river's points: [x, z, surface, half width] every ~8 m. It runs from the Springhead to the River Gate's mouth, and again from the Weir's mouth to the sea; the surface only ever falls
// (the ground it follows ignores the river itself), meets the model's water at both mouths, and the gorge below the Weir gets wider the further it goes ----
(function sunBuildRiver(){
  const G=GLASSWELL, C=SUN_CITY, wp=p=>[C.x+p[0],C.z+p[1]];
  const upPts=[...SUN_RIVER_UP.slice(0,-1),wp(G.river[0])], dnPts=[wp(G.riverOut[G.riverOut.length-1]),[-880,92],[-925,98],[-960,103],[-997,110]];
  const dense=P=>{ const o=[]; for(let i=0;i<P.length-1;i++){ const A=P[i], B=P[i+1], n=Math.max(1,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/8)); for(let k=0;k<n;k++){ const t=k/n; o.push([lerp(A[0],B[0],t),lerp(A[1],B[1],t)]); } } o.push(P[P.length-1]); return o; };
  _sunNoRiver=true;
  const up=dense(upPts), dn=dense(dnPts), gate=C.h+G.skirtH+0.07, wy=C.h-6+0.07, R=[];
  let y=homeHeight(up[0][0],up[0][1])-0.35;
  up.forEach(([x,z])=>{ y=Math.min(y,homeHeight(x,z)-0.35); R.push([x,z,y,3.0]); });
  for(let i=0;i<R.length;i++){ const t=smoothstep(0.6,1,i/(R.length-1)); R[i][2]=lerp(R[i][2],gate,t); }   // (the last stretch eases onto the model's water)
  let yd=wy; const D=[];
  dn.forEach(([x,z])=>{ yd=Math.min(yd,homeHeight(x,z)-0.35); D.push([x,z,yd,Math.min(6,3+Math.hypot(x-dn[0][0],z-dn[0][1])*0.02)]); });
  _sunNoRiver=false;
  SUN_RIVER=R.concat(D); SUN_RIVER_UPN=R.length;
})();
// the water under (x, z) in the Sunscar: the Bowl's lake and river, the Springhead, the river outside; null on dry ground (waterSurf, greyspine.js, falls back to the sea's level)
function sunWaterSurf(x,z){
  const S=SUN_SPRING; if(Math.hypot(x-S.x,z-S.z)<S.r*1.1) return SUN_BASE-0.6;
  const dc=Math.hypot(x-SUN_CITY.x,z-SUN_CITY.z);
  if(dc<176){ const w=gwCityWaterAt(x-SUN_CITY.x,z-SUN_CITY.z); return w===null?null:SUN_CITY.h+w; }
  const r=sunRiverAt(x,z); return r.d<2.6?r.y:null;
}
const sunWet=(x,z,m)=>{ if(!inSun(x,z)) return false; const w=sunWaterSurf(x,z); return w!==null&&getH(x,z)<w-(m===undefined?-0.2:m); };
