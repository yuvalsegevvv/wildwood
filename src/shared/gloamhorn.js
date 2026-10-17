//@ The Gloamhorn, the sixth land (levels 30-40, docs/areas/gloamhorn.md) on the atlas: its anchors (Wraithwick's hub, the Windswept Neck, the bosses' places, the door), the sea around it (wrecks, cave mouths, the lighthouse), keep-outs. Pure.
/* Agent map: the ground is the atlas's (shared/world-atlas-ground.js: land id 5 'gloam', crags and cliffs); this file holds only places. gloamIn(x,z) (metres inland of the waterline: the atlas's waCoast), gloamCoast(x,z)
   (coastDist's reading of it), gloamGround(x,z) (the atlas's height, an old name), gloamSeaDir(x,z) (the unit direction towards the nearest sea), GLOAM_LIGHT (the lighthouse, on the cape of the Gloam Light's
   atlas boss: its forecourt is ARENA_M40), GLOAM_HOLD (the Drowned Captain's arena at the atlas's Sea Caves boss, with the cave mouths on the nearest shore: they join GLOAM_CAVES), GLOAM_WRECKS (hulls in the shallows),
   GLOAM_CAVES (cave mouths in the shore), GLOAM_STACKS (empty: the atlas's own sea stacks are islands now), GLOAM_DG_DOOR (the Gloamvault's door at the atlas's door of the Gloamhorn), gloamKeepOut (camps, nodes,
   plants), GREY_GATES[1] (the neck: its rock fall at the atlas's Windswept Neck, dir 'e', plus gloamNeckHold for the whole border). Used by wraithwick.js (VIL6), gloamzones.js (zones m30..m40, the two arenas),
   game/village/buildings-gloam.js (the meshes), game/world/terrain-color-gloam.js, gloam-sky.js, game/ui/map.js, dungeons.js. Test: node tools/gloamhorn-smoke.js. Names: gloam..., GLOAM_...
   The land (docs/WORLD.md, the old Stormhorn, renamed): the atlas's land 5, north-west of the Greyspine and north of the Glass River (the border with the Sunscar), reached by the Windswept Neck, a pass in the
   Greyspine's western flank (the rock fall GREY_GATES[1], opened by the Mountain Golem). Wraithwick stands at the hub, level 30 round it; the levels climb west and north to the sea caves (35, the Drowned Captain)
   and the cape of the Gloam Light (40). Its coast is broad cliffs: hills falling to the sea over 75 m or more, sheer nowhere. */
const GLOAM_HUB=WA_HUBS.gloam;
const gloamIn=(x,z)=>waCoast(x,z);
const gloamCoast=(x,z)=>coastDist(x,z);
const gloamGround=(x,z)=>baseHeight(x,z);
function gloamSeaDir(x,z){   // the unit direction towards the nearest sea: down the slope of the distance to the coast
  const gx=waCoast(x+16,z)-waCoast(x-16,z), gz=waCoast(x,z+16)-waCoast(x,z-16), l=Math.hypot(gx,gz);
  return l<1e-6?[-1,0]:[-gx/l,-gz/l];
}
const gloamPoi=zone=>WA_POIS.find(q=>q.land==='gloam'&&q.zone===zone);
const r2=v=>Math.round(v*100)/100;
/* the lighthouse: on the cape of the Gloam Light's boss, GLOAM_LIGHT.fore metres seaward of its arena (ARENA_M40, gloamzones.js: the forecourt), as far as the rocks allow (14 m of land under its foot) */
const GLOAM_LIGHT=(()=>{ const P=gloamPoi(40), d=gloamSeaDir(P.x,P.z); let fore=36; while(fore>12&&waCoast(P.x+d[0]*fore,P.z+d[1]*fore)<14) fore-=2;
  return {x:Math.round(P.x+d[0]*fore),z:Math.round(P.z+d[1]*fore),r:5.6,hgt:34,dx:d[0],dz:d[1],fore,name:'The Gloam Light'}; })();
const GLOAM_STACKS=[];   // (the sea stacks are the atlas's islands now: islands of kind 5)
const GLOAM_WRECKS=[], GLOAM_CAVES=[];
/* The Drowned Captain's hold (ARENA_M35, gloamzones.js): the arena at the atlas's Sea Caves boss; GLOAM_HOLD.caves are three mouths ([x, z, facing out to sea]) in the nearest shore, side by side; they join GLOAM_CAVES. */
const GLOAM_HOLD=(()=>{
  const P=gloamPoi(35), d=gloamSeaDir(P.x,P.z), H={x:P.x,z:P.z,caves:[]}, face=r2(Math.atan2(d[0],d[1]));
  for(const along of [-22,0,22]){ const bx=P.x+d[1]*along, bz=P.z-d[0]*along;
    for(let off=0;off<500;off+=2){ const x=bx+d[0]*off, z=bz+d[1]*off; if(waCoast(x,z)<=6){ H.caves.push([Math.round(x),Math.round(z),face]); break; } } }
  if(!H.caves.length) H.caves.push([Math.round(P.x+d[0]*60),Math.round(P.z+d[1]*60),face]);
  return H;
})();
/* wrecks: hulls in the shallows 16-45 m off the shore; cave mouths: dark arches in the foot of a hillside that meets the sea ([x, z, facing]: the direction the opening looks, out to sea). Found at load from a seeded rng
   along the Gloamhorn's coast. */
(function gloamScatter(){
  const rng=mulberry32(60606), rr=(a,b)=>a+(b-a)*rng();
  for(let tries=0;tries<6000&&GLOAM_WRECKS.length<5;tries++){
    const x=rr(-1750,-540), z=rr(-1100,-120); if(waLandId(x,z)!==5||!waIsSea(x,z)) continue;
    const c=waCoast(x,z); if(c>-16||c<-45||x<WX0+40||z<WZ0+30) continue;
    if(GLOAM_WRECKS.every(q=>Math.hypot(q[0]-x,q[1]-z)>110)) GLOAM_WRECKS.push([Math.round(x),Math.round(z),r2(rr(0,TAU))]);
  }
  for(let tries=0;tries<9000&&GLOAM_CAVES.length<6;tries++){
    const x=rr(-1750,-540), z=rr(-1100,-120); if(waLandId(x,z)!==5||waIsSea(x,z)) continue;
    const c=waCoast(x,z); if(c<2||c>7||waWaterDist(x,z)<10) continue;
    const d=gloamSeaDir(x,z); if(baseHeight(x-d[0]*24,z-d[1]*24)<8) continue;   // a hillside, not a beach
    if(GLOAM_CAVES.every(q=>Math.hypot(q[0]-x,q[1]-z)>90)) GLOAM_CAVES.push([Math.round(x),Math.round(z),r2(Math.atan2(d[0],d[1]))]);
  }
})();
for(const c of GLOAM_HOLD.caves) GLOAM_CAVES.push(c);
/* The Gloamvault's door (dungeons.js DG_ENTRANCES.gloamvault, the dungeon's: docs/DUNGEON-THEMES.md section 12) at the atlas's door of the Gloamhorn, in zone m38; it faces the road that comes to it */
const GLOAM_DG_DOOR={id:'gloamvault',name:'The Gloamvault',x:-1215,z:-845,r:12,rot:3.927};   // the atlas's door (WA_POIS 'gloam door', -1195, -823) moved 30 m to the nearest ground with a level apron and 14 m off the Gloam Door Road, which ends at the poi
// no camp, node or plant here: the lighthouse, its forecourt, the door, Wraithwick, the arenas, the water (the Glass River and the lakes) (m: extra margin)
function gloamKeepOut(x,z,m){
  m=m||0;
  if(Math.hypot(x-GLOAM_LIGHT.x,z-GLOAM_LIGHT.z)<GLOAM_LIGHT.r+8+m) return true;
  if(Math.hypot(x-GLOAM_DG_DOOR.x,z-GLOAM_DG_DOOR.z)<GLOAM_DG_DOOR.r+6+m) return true;
  if(Math.hypot(x-VIL6.x,z-VIL6.z)<VR+10+m) return true;
  for(const A of ARENAS) if(A.gloam&&Math.hypot(x-A.x,z-A.z)<A.r+6+m) return true;
  return waWaterDist(x,z)<2+m;
}
/* The neck: the rock fall of GREY_GATES[1] stands at the atlas's Windswept Neck (the Greyspine | Gloamhorn border runs diagonally here, so the plane the old frame held would cut the Greyspine in two: the record
   is dir 'e', a band round the pass). Its hold along the whole border is gloamNeckHold(o,ox,oz), while gear.neck is 0: a step that changes land across the border goes back; G.hold is the same function for a
   caller that holds a gate through its record. Not called by the client's worldBounds nor the server's setPos yet (task D: both need `if(gear.neck<1) gloamNeckHold(o,ox,oz)`). */
const GLOAM_GATE=waGateBetween('grey','gloam');
{ const G=GREY_GATES[1]; G.dir='e'; G.x=GLOAM_GATE.x; G.z=GLOAM_GATE.z; G.name=GLOAM_GATE.name; G.hold=(o,ox,oz)=>gloamNeckHold(o,ox,oz); }
function gloamNeckHold(o,ox,oz){
  if(ox===undefined||oz===undefined||Math.hypot(o.x-ox,o.z-oz)>30) return;
  const G=GREY_GATES[1]; if(Math.abs(o.z-G.z)<G.w+30&&Math.abs(o.x-G.x)<60) return;   // the pass itself: its rock fall (gateHold)
  const a=waLandId(ox,oz), b=waLandId(o.x,o.z); if(a===b) return;
  if((a===3&&b===5)||(a===5&&b===3)){ o.x=ox; o.z=oz; }
}
