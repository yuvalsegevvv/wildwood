//@ The Sunscar, the fifth land (levels 28-36, docs/areas/sunscar.md) on the atlas: Glasswell's Bowl at the Sunscar hub (carried by the heightmap), the River Pass, Redgate Canyon and the closed Amber link as gates on the atlas's gates, the borders held while a gate is shut, the arenas' and the door's places, keep-outs, colour patches. Pure.
/* Agent map: the ground is the atlas's (shared/world-atlas-ground.js: mesas and dunes, the borders as ranges with saddles); this file adds only the Bowl: sunBowlHook(x,z,h) is called by rawHeight
   (shared/terrain-height.js, one marked line) and lays the Bowl of Glasswell (gwRimH, gwCityCut, the city's frame in sunscar-shape.js / sunscar-city.js) at the Sunscar hub WA_HUBS.sun: the floor and the
   rim as the model draws them, a skirt at SUN_BASE and an apron that eases (SUN_FLAT, SUN_BLEND) into the atlas's ground, keeping off the atlas's water. The Bowl moves as one piece: never turned, never redrawn.
   Data and tests: SUN_CITY / SUN_BASE (the Bowl's centre, its floor and the skirt's level), SUN_PASS + sunPassX(z) (the River Pass: the atlas road from the Greyspine to the gate, x by z; z > 300: the Amber link's x),
   SUN_RED (Redgate Canyon, dir 'e') and SUN_AMBER (the planned link, dir 's', never opens) pushed to GREY_GATES with the River Pass's record (greyspine.js); sunWallHold / sunCrestHold (the borders while Redgate
   / the River Pass are shut, from the old frame's names: the callers are the client's worldBounds and the server's setPos), sunKeepOut (camps, nodes, plants), sunMesaH / sunDuneK / sunPanK / sunGlassK /
   sunGreenK (colour weights and plant rules read by game/world/ and professions.js), sunColorK (the Sunscar's share of a point's colour), sunWaterSurf / sunWet (the Bowl's own lake and river, the only water the
   Sunscar has: the border river is the atlas's), SUN_DG_DOOR (the Sandglass's door at WA_POIS), sunHook (an old name, a no-op). Used by glasswell.js (VIL5), sunzones.js, game/village/buildings-sunscar.js,
   terrain-color-sun.js, dungeons.js. Test: node tools/sunscar-smoke.js. Names: sun..., SUN_...
   Where it is (the atlas, shared/world-atlas.js): land id 4 'sun' south of the Greyspine and the Gloamhorn (the Glass River is the border with the Gloamhorn, no water of its own), west of the home forest's Sunwall,
   to the south coast; land 6 'amber' is the planned link south of it (a closed gate, nothing built behind it). Glasswell stands at the hub, zone s28 around it; the River Pass comes down from the north-east, Redgate
   Canyon from the south-east. */
var SUN_CITY=null, SUN_BASE=0, SUN_SKIRT=[];   // (var: sunBowlHook is called by rawHeight, which may run before this file has)
const SUN_FLAT=300, SUN_BLEND=150;   // the Bowl's own ground to SUN_FLAT - SUN_BLEND, easing into the atlas's by SUN_FLAT (a ridge rises 40 m north of the hub: the blend is wide so it never becomes a wall)
const SUN_HUB=WA_HUBS.sun;
{ // the skirt's level: the median of the atlas's ground round the Bowl; the floor lies skirtH below it
  const hs=[]; for(let k=0;k<24;k++){ const a=k/24*TAU, r=165+(k%3)*12; hs.push(baseHeight(SUN_HUB[0]+Math.sin(a)*r,SUN_HUB[1]+Math.cos(a)*r)); }
  for(let k=0;k<24;k++) SUN_SKIRT.push(hs[k]);   // (the ground at each bearing: the skirt follows it, so a ridge beside the Bowl does not meet a cliff)
  hs.sort((p,q)=>p-q); SUN_BASE=Math.round(hs[12]);
  SUN_CITY={x:SUN_HUB[0],z:SUN_HUB[1],h:SUN_BASE-GLASSWELL.skirtH,r:GLASSWELL.r};
}
// the Bowl in the heightmap: the floor, the rim, the cracks and the city's lake and river channel (gwRimH + gwCityCut), laid over the atlas's ground. Beyond the rim the Weir's gorge (it ran down to the Bight,
// there is no Bight now) is filled back up to the skirt, and the apron keeps off the atlas's water (the border river lies about 140 m north of the hub)
// the skirt's level at a bearing: the atlas's ground round the Bowl there (a ring of 24 samples, eased between them), never below the Bowl's own flat skirt
function sunSkirtAt(cx,cz){
  const a=(Math.atan2(cx,cz)/TAU+1)*24, i=Math.floor(a)%24, t=a-Math.floor(a), u=t*t*(3-2*t);
  return Math.max(SUN_BASE,lerp(SUN_SKIRT[i],SUN_SKIRT[(i+1)%24],u));
}
function sunBowlHook(x,z,h){
  if(SUN_CITY===null) return h;
  const cx=x-SUN_CITY.x; if(cx>SUN_FLAT||cx<-SUN_FLAT) return h;
  const cz=z-SUN_CITY.z, r2=cx*cx+cz*cz; if(r2>=SUN_FLAT*SUN_FLAT) return h;
  const r=Math.sqrt(r2); let t=smoothstep(SUN_FLAT,SUN_FLAT-SUN_BLEND,r);
  if(r>120){ const wd=waWaterDist(x,z); if(wd<70) t*=lerp(1,smoothstep(0,70,wd),smoothstep(120,240,r)); }   // (only the border river: the atlas's stray stream through the hub lies under the Bowl)
  if(t<=0) return h;
  let b=gwRimH(cx,cz); if(r>118) b=Math.max(b,lerp(-6,sunSkirtAt(cx,cz)-SUN_CITY.h,smoothstep(118,190,r)));
  return lerp(h,SUN_CITY.h+b+gwCityCut(cx,cz),t);
}
function sunHook(x,z,h){ return h; }   // (the old frame's ground hook, still named by baseHeightRaw in terrain.js: the atlas's ground needs none)
// ---- the gates (the atlas's gates: WA_GATES), as the rock falls of GREY_GATES (greyspine.js) the game already stops and draws ----
const waGateBetween=(a,b)=>WA_GATES.find(g=>g.a===a&&g.b===b);
const SUN_GATE_RIVER=waGateBetween('grey','sun'), SUN_GATE_RED=waGateBetween('home','sun'), SUN_GATE_AMBER=waGateBetween('sun','amber');
// the River Pass: the atlas road from the Greyspine down to the gate, [x, z] with z rising
const SUN_PASS=(()=>{ let best=null; for(const r of WA_ROADS) if(r.name==='The River Pass'&&(!best||r.pts.length>best.pts.length)) best=r;
  const p=best.pts.filter((q,i)=>i%6===0||i===best.pts.length-1); return {w:9,pts:p}; })();
const SUN_AMBER={id:'amber',dir:'s',x:SUN_GATE_AMBER.x,z:0,w:10,name:'The Dry Riverbed (to Amber Reach)',boss:null,planned:true};   // the planned link south: shut for good, nothing behind it (gear.amber stays 0)
function sunPassX(z){   // the x of the 's' gates' road at z: the River Pass (z < 300) or the Amber link's dry riverbed
  if(z>300) return SUN_AMBER.x;
  const P=SUN_PASS.pts; if(z<=P[0][1]) return P[0][0]; if(z>=P[P.length-1][1]) return P[P.length-1][0];
  for(let i=1;i<P.length;i++) if(z<=P[i][1]){ const t=(z-P[i-1][1])/(P[i][1]-P[i-1][1]); return lerp(P[i-1][0],P[i][0],t); }
  return P[P.length-1][0];
}
// where a column or a row turns into the Sunscar (the gates stand on the borders): scanning south from z0 / west from x0
function sunEdgeZ(x,z0,z1,land){ for(let z=z0;z<=z1;z+=2) if(waLandId(x,z)===(land||4)) return z; return z1; }
function sunEdgeX(z,x0,x1){ for(let x=x0;x>=x1;x-=2){ const l=waLandId(x,z); if(l===4||l===6) return x; } return x1; }
{ const G=GREY_GATES[0]; G.name=SUN_GATE_RIVER.name; G.z=sunEdgeZ(SUN_GATE_RIVER.x,SUN_GATE_RIVER.z-170,SUN_GATE_RIVER.z+120)-8; G.x=sunPassX(G.z); }   // the rock fall stands in the pass just short of the Sunscar's border (the border itself is held by sunCrestHold while it stands, along its whole length)
const SUN_RED={id:'redgate',dir:'e',x:sunEdgeX(SUN_GATE_RED.z,SUN_GATE_RED.x+60,SUN_GATE_RED.x-120)+6,z:SUN_GATE_RED.z,w:10,name:'Redgate Canyon',boss:'sandwyrm'};   // dir 'e': a plane x = const held from both sides (gateHold, shared/greyspine.js)
SUN_AMBER.z=sunEdgeZ(SUN_AMBER.x,SUN_GATE_AMBER.z-200,SUN_GATE_AMBER.z+200,6)-6;   // (the border between land 4 and land 6; the plane is held 6 m inside the Sunscar)
GREY_GATES.push(SUN_RED);   // the third rock fall: the same record, the same gear flag (gear.redgate), the same mesh builder (game/village/buildings-grey.js)
GREY_GATES.push(SUN_AMBER);   // the fourth: a shut gate to a land that is not built (gear.amber is never set: gateOpen is false)
/* While Redgate Canyon's rock fall stands (gear.redgate 0) nobody crosses the Sunscar's border with the home forest (or the Amber link's with it) except through the canyon itself, which its rock fall holds
   (gateHold): a step that changes land across that border goes back to where it started along x. o: the new position, ox: the old x. Used by the client's movement and the server's setPos. */
/* A closed border keeps a strip of 6 m either side: a step that ends within 6 m of it (along x or z) is pushed back out of the strip, so no step, diagonal ones and the test's 4 m grid included, can jump it.
   pair(n,m): are the lands n (here) and m (there) the closed border's two sides. */
function sunBufPush(o,pair){
  const n=waLandId(o.x,o.z);
  for(const d of [2,-2,4,-4,6,-6]){
    if(pair(n,waLandId(o.x,o.z+d))){ o.z+=d>0?d-7:7+d; return true; }
    if(pair(n,waLandId(o.x+d,o.z))){ o.x+=d>0?d-7:7+d; return true; }
  }
  return false;
}
function sunPairWall(n,m){ return (n===0&&(m===4||m===6))||((n===4||n===6)&&m===0); }
function sunPairCrest(n,m){ return (n===4&&(m===3||m===5))||((n===3||n===5)&&m===4); }
function sunWallHold(o,ox){
  if(ox===undefined||Math.abs(o.x-ox)>30) return;   // (a jump over 30 m is a teleport, not a step)
  if(sunBufPush(o,sunPairWall)) return;
  const a=waLandId(ox,o.z), b=waLandId(o.x,o.z);
  if((a===0&&(b===4||b===6))||(b===0&&(a===4||a===6))) o.x=ox;
}

/* The Sunscar's north border (with the Greyspine and, across the Glass River, the Gloamhorn) is a wall of its own while the River Pass is shut (gear.river, the Gryphon Queen): a step that changes land across
   it goes back along z, except in the pass, which its rock fall holds; the 6 m strip (sunBufPush) catches the stretches that run north-south. o: the new position, oz: the old z. Used by the client's movement and the server's setPos. */
function sunCrestHold(o,oz){
  if(oz===undefined||Math.abs(o.z-oz)>30) return;
  if(sunBufPush(o,sunPairCrest)) return;
  const a=waLandId(o.x,oz), b=waLandId(o.x,o.z); if(a===b) return;
  if(sunPairCrest(a,b)) o.z=oz;
}
// ---- the door of the Sandglass (the dungeon's, shared/dungeons.js DG_ENTRANCES.sandglass) at the atlas's door of the Sunscar, in zone s34 ----
const SUN_DG_DOOR={id:'sandglass',name:'The Sandglass',x:-1045,z:365,r:12,rot:1.571};   // the atlas's door (WA_POIS 'sun door', -1003, 311) moved 70 m to flat ground 24 m off the Sun Door Road, clear of the Arches cave's rock (its ground tint would hide the door's patch) and the Bowl's apron
function sunKeepOut(x,z,m,early){   // early: asked while this file loads (ARENAS does not exist yet)   // water (the border river), the Bowl and its apron, the dungeon door: no camp, node or plant here (m: extra margin)
  m=m||0; if(Math.hypot(x-SUN_DG_DOOR.x,z-SUN_DG_DOOR.z)<SUN_DG_DOOR.r+m+6) return true;
  if(Math.hypot(x-SUN_CITY.x,z-SUN_CITY.z)<SUN_CITY.r+80+m) return true;
  if(!early) for(const A of ARENAS) if(A.sun&&Math.hypot(x-A.x,z-A.z)<A.r+6+m) return true;
  return waWaterDist(x,z)<2+m;
}
// ---- how the ground reads (colour weights and plant rules): the atlas's own mesas and dunes (waForm, world-atlas-ground.js: the same noise), patches of salt pan and black glass in the zones they belong to ----
function sunMesaH(x,z){ return smoothstep(0.5,0.63,noise2(x*0.0035+21,z*0.0035-8)*0.5+0.5)*24; }   // 0..24: how much of a mesa's height the ground has here
function sunDuneK(x,z){   // 0..1 how much of the point is dune sand: the ground between the mesas
  const k=smoothstep(-0.05,0.42,noise2(x*0.0042+5.1,z*0.0042-2.7)+0.12*noise2(x*0.011,z*0.011));
  return k*(1-sunMesaH(x,z)/24);
}
function sunFlatSpot(x0,z0,rad,keep){   // the flattest dry spot within rad of (x0, z0): a patch of pan or glass lies on level ground
  let best=null, bs=1e9;
  for(let dz=-rad;dz<=rad;dz+=20) for(let dx=-rad;dx<=rad;dx+=20){
    const x=x0+dx, z=z0+dz; if(dx*dx+dz*dz>rad*rad||waLandId(x,z)!==4||waWaterDist(x,z)<40||waCoast(x,z)<90||sunKeepOut(x,z,50,true)) continue;
    const h=baseHeight(x,z), s=Math.abs(baseHeight(x+14,z)-h)+Math.abs(baseHeight(x-14,z)-h)+Math.abs(baseHeight(x,z+14)-h)+Math.abs(baseHeight(x,z-14)-h);
    if(s<bs&&!(keep&&keep.some(k=>Math.hypot(k.x-x,k.z-z)<k.r))){ bs=s; best=[x,z]; }
  }
  return best||[x0,z0];
}
const sunZoneRec=k=>waZoneOfKey('sun',k);
const SUN_PANS=[], SUN_GLASS=[];
{ const pan=(k,name,rx,rz,rad)=>{ const Z=sunZoneRec(k), p=sunFlatSpot(Z.x,Z.z,rad,SUN_PANS.map(q=>({x:q.x,z:q.z,r:150}))); SUN_PANS.push({x:p[0],z:p[1],rx,rz,name}); };
  pan(29,'The Weeping Pan',76,46,110); pan(34,'The Whitefloor',84,50,110); pan(31,'Gull Pan',38,28,110);
  const Z32=sunZoneRec(32), Z35=sunZoneRec(35), A=WA_POIS.find(q=>q.land==='sun'&&q.zone===32), vx=Z32.x-A.x, vz=Z32.z-A.z, vl=Math.hypot(vx,vz)||1;
  SUN_GLASS.push({x:Math.round(A.x+vx/vl*65),z:Math.round(A.z+vz/vl*65),r:100,name:'The Glass Fields'});   // the Guardian's Court lies in its northern part
  { const p=sunFlatSpot(Z35.x,Z35.z,90); SUN_GLASS.push({x:p[0],z:p[1],r:56,name:'The Cinder Glass'}); } }
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
function sunRockK(x,z,g){ return Math.max(smoothstep(0.35,0.9,g),0)*0.9; }
function sunGreenK(x,z){   // scrub and palms on the banks of the border river (the one water the land has)
  const wd=waWaterDist(x,z); return wd<40&&wd>-1?smoothstep(40,2,wd)*0.9:0;
}
// the Sunscar's share of a point's colour and look: 1 inside the land (land 4, and 6 behind the closed gate), easing out over the last 40 m of the border (game/world/terrain-color.js blends sunColor with it)
function sunColorK(x,z){ const l=waLandId(x,z), k=smoothstep(0,40,waLandBorderDist(x,z)); return (l===4||l===6)?0.5+0.5*k:0.5*(1-k); }
// the water under (x, z): only the Bowl's own lake and river (the model's, gwCityWaterAt); null on dry ground (waterSurf, greyspine.js, asks the atlas's water first and falls back to the sea's level)
function sunWaterSurf(x,z){
  const dc=Math.hypot(x-SUN_CITY.x,z-SUN_CITY.z);
  if(dc<176){ const w=gwCityWaterAt(x-SUN_CITY.x,z-SUN_CITY.z); return w===null?null:SUN_CITY.h+w; }
  return null;
}
const sunWet=(x,z,m)=>{ if(!inSun(x,z)) return false; const w=sunWaterSurf(x,z); return w!==null&&getH(x,z)<w-(m===undefined?-0.2:m); };
const SUN_SPRING={x:SUN_GATE_RIVER.x,z:GREY_GATES[0].z+40,r:13};   // (no spring now: the testing tools' "spring" teleport (server/economy.js devP) lands here, just inside the River Pass's mouth)
