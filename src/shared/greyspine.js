//@ The Greyspine, the fourth land (levels 26-32, docs/WORLD.md) on the atlas: its places (GREY_HM, GREY_QUEEN, the glacier valley GLEN, the two rock falls GREY_GATES with gateHold), the one water function (waterSurf, greyWet), the old frame's ground kept for baseHeightRaw only. Pure.
/* ===================== THE GREYSPINE =====================
   The fourth land (levels 26-32), the most extreme ground of the world: a glacier-carved range north of the home forest, west of the Hoarfrost Reach, with Highmark on its hub and its zones, bosses, door and gates at the
   atlas's anchors (shared/world-atlas.js, docs/world-atlas.py). The ground, the rivers (born on its heights; no tarns, no fjord of its own) and the coast are the atlas's (world-atlas-ground.js: ridged
   mountains and deep glens, waForm case 3). What stays here:
     - the places: GREY_HM (Highmark), GREY_QUEEN (the Gryphon Queen's peak), GLEN (the glacier valley, the gate to the Reach, with its ice fall), GREY_GATES (the two rock falls: the river road to the Sunscar, the neck pass to the
       Gloamhorn: both stand at the atlas's gates, the River Pass and the Windswept Neck; the atlas has no gorge on the way that fits better), gateHold / inGate / inGlen;
     - waterSurf / greyWet: the one water-surface function the whole game asks (the atlas's lakes and rivers; a frozen lake is not water);
     - the OLD FRAME's ground (greyspineBase, GREY_VALLEYS, greyFloor, gnx, GDX): not the ground any more, kept only because baseHeightRaw (terrain.js) and the Greyfall's fall profile still read it, and sunland.js asks greyFloor.
       It is designed in a frame GDX metres east of the world's (docs/areas/greyspine.md speaks that frame). Retire it with the Greyfall's old fall profile.
   Agent map: GREY_HM, GREY_QUEEN, GLEN {z, w, x0, x1, ice, bx, h0, h1, floor}, inGlen, westBarX(z), GREY_GATES, gateHold, inGate, waterSurf, greyWet, greySnowAmt, greyTreeline, GREY_TARNS / GREY_FJORD (empty: ui/map.js still reads them).
   Used by: highmark.js, greyzones.js, roads.js, sunland.js, gloamhorn.js, the server (api.js, economy.js), the client (movement, map, buildings-grey, generation, chamois). Tests: tools/greyspine-smoke.js, atlas-smoke.js. */
/* The Greyspine's ground is rigid: it was moved, not redrawn. Its noise is sampled in the frame it was designed in (gnx: x minus GDX), so every ridge, trough and bench is where it was, shifted, and what was
   tuned on it (the slopes of Highmark's skirt, the Long Valley's floor, the roads, the zones) still holds; only what touches its neighbours (the walls, the coast) is computed in the world's frame. */
const gnx=x=>x-GDX;
const GREY_VALLEYS=[   // centre line (x,z), half-width of the flat floor (in), half-width where the mountain starts (out), how many metres the floor climbs to the valley's head (up)
  {name:'The Long Valley',in:24,out:104,up:0,pts:[[418,-742],[340,-722],[262,-696],[170,-684],[80,-670],[0,-652],[-90,-638],[-170,-620],[-250,-596],[-340,-574],[-418,-566]]},
  {name:'The North Fork',in:16,out:72,up:62,pts:[[262,-696],[256,-770],[286,-846],[322,-918]]},
  {name:'The Queen\'s Fork',in:16,out:74,up:92,pts:[[-60,-648],[-92,-736],[-150,-808],[-178,-858]]},
  {name:'The Neck',in:15,out:64,up:26,pts:[[-120,-700],[-230,-746],[-330,-770],[-418,-782]]},
  {name:'The Sink Valley',in:16,out:62,up:16,pts:[[190,-680],[196,-606],[150,-552],[96,-522]]}];
GREY_VALLEYS.forEach(v=>{ for(const p of v.pts) p[0]+=GDX; v.len=[0]; for(let i=1;i<v.pts.length;i++) v.len.push(v.len[i-1]+Math.hypot(v.pts[i][0]-v.pts[i-1][0],v.pts[i][1]-v.pts[i-1][1])); v.total=v.len[v.len.length-1]; });
// The places, at the atlas's anchors: Highmark on the Greyspine's hub (the village disc, moved as one piece; up: retired, the pad is the village's own), and the Gryphon Queen's peak (boss 29, the atlas's boss "The Gryphon Queen's Peak")
const GREY_HM=(()=>{ const [x,z]=WA_HUBS.grey; return {x,z,r:34,up:0}; })();
const GREY_QUEEN=(()=>{ const P=WA_POIS.find(p=>p.name==="The Gryphon Queen's Peak"); return {x:P.x,z:P.z,r:28,h:baseHeight(P.x,P.z)}; })();
const greyTreeline=(x,z)=>106+noise2(x*0.012+7,z*0.012-2)*14;   // no tree grows above it (the snowline is a little higher)
// Where rain turns to snow (the client's weather, game/world/weather.js), as a Minecraft biome does by temperature: the air cools with height and
// with the far north (10 m lower beyond z -860). Same noise and north shift as the white ground's line in terrain-color.js, so the flakes begin a
// little below where the ground whitens: 0 = rain below the line (Highmark's shelf, ~100 m, stays wet), 1 = snow 34 m above it (the peaks), sleet in between.
const greySnowAmt=(x,z,h)=>{ const sl=(z<-860?-10:0)+(noise2(x*0.02,z*0.02)*0.5+0.5)*18; return smoothstep(112+sl,146+sl,h); };
const GV={m:0,up:0,d:0};
/* how much of this point is valley floor: GV.m 1 on a trough's flat floor, 0 on the mountains; GV.up the floor's rise towards the head
   of a side valley, GV.d the distance to the nearest trough's centre line. The troughs wander (a domain warp of +-38 m), so they are not lines drawn with a ruler. */
function greyValley(x,z){
  const ox=gnx(x), qx=x+noise2(ox*0.007+11,z*0.007-4)*38, qz=z+noise2(ox*0.007-23,z*0.007+9)*38;
  let m=0, ws=0, wu=0, dm=1e9;
  for(const v of GREY_VALLEYS){
    const P=v.pts; let best=1e9, bt=0;
    for(let i=0;i<P.length-1;i++){
      const ax=P[i][0], az=P[i][1], dx=P[i+1][0]-ax, dz=P[i+1][1]-az, L2=dx*dx+dz*dz;
      const t=clamp(((qx-ax)*dx+(qz-az)*dz)/L2), ex=qx-ax-t*dx, ez=qz-az-t*dz, d2=ex*ex+ez*ez;
      if(d2<best){ best=d2; bt=(v.len[i]+t*Math.sqrt(L2))/v.total; }
    }
    const dd=Math.sqrt(best); if(dd<dm) dm=dd;
    const k=smoothstep(v.out,v.in,dd);
    if(k>m) m=k;
    const w=k*k*k; ws+=w; wu+=w*v.up*bt;
  }
  GV.m=m; GV.up=ws>0?wu/ws:0; GV.d=dm; return m;
}
// the floor of the troughs: it falls from the Hoarfrost side (east) towards the river's way out in the west
const greyFloor=(x,z)=>34+42*smoothstep(-420+GDX,300+GDX,x)+fbm(gnx(x)*0.006+2,z*0.006-9,2)*5+noise2(gnx(x)*0.03+4,z*0.03)*1.1;
/* ---- the glacier valley: the atlas's Glacier Valley, the gate between the Hoarfrost Reach and the Greyspine (docs/WORLD.md section 5: opened when Ymrik, the Rimeking, falls; gear.west 0 shut, 1 open, 2 walked into
   Highmark). The way through is the atlas's own saddle in the range along the border (a road crosses it): nothing is carved. GLEN.z is the road's z at the gate, x0 / x1 the strip kept clear of trees and camps (the road runs
   along it), and a wall of broken ice (the ice fall, drawn by game/village/buildings-grey.js) stands across it at x = GLEN.ice, 15 m inside the Reach (GLEN.bx is the border's x there), until the gate opens.
   The clamps that stop you at it are player/movement.js (glenWall) and server/api.js (setPos); westBarX(z) below is the line they should hold while it is shut. */
const GLEN=(()=>{
  const G=WA_GATES.find(g=>g.a==='hoar'&&g.b==='grey'); let bx=G.x; for(let x=G.x+150;x>G.x-150;x-=2) if(waLandId(x,G.z)!==2){ bx=x+2; break; }   // (going west from the Reach: where its land ends)
  const o={z:G.z,w:11,x0:G.x-92,x1:G.x+92,bx,ice:bx+15,gx:G.x};
  o.h0=baseHeight(o.x0,o.z); o.h1=baseHeight(o.x1,o.z); o.floor=x=>lerp(o.h0,o.h1,smoothstep(o.x0,o.x1,x)); return o;
})();
// the Reach's west edge per 8 m of z (the most western x of its land there, +15 m as the fall itself): the x a hiker coming from the Reach must stay east of while the ice fall stands; -1e9 where the Reach does not border the Greyspine
const WEST_Z0=Math.floor(WZ0/8)*8, WEST_BAR=(()=>{
  const n=Math.ceil((WZ1-WZ0)/8)+1, out=new Array(n).fill(null);
  for(let i=0;i<n;i++){ const z=WEST_Z0+i*8; for(let x=-700;x<GLEN.gx+400;x+=8) if(waLand(x,z)==='hoar'){ if(waLand(x-16,z)==='grey'||waLand(x-8,z)==='grey') out[i]=x+15; break; } }
  return out;
})();
function westBarX(z){ const i=Math.round((z-WEST_Z0)/8); return i>=0&&i<WEST_BAR.length&&WEST_BAR[i]!==null?WEST_BAR[i]:-1e9; }
// keep trees, rocks and camps out of the glen (m = extra margin)
const inGlen=(x,z,m)=>Math.abs(z-GLEN.z)<GLEN.w+8+(m||0)&&x>GLEN.x0-30&&x<GLEN.x1+30;
function greyspineBase(x,z){
  const c=coastDist(x,z); if(c<-8&&borderXN(z)-x>46&&x-GW0>60) return -5;   // open sea: nothing else to compute (the north of the Greyspine's rectangle is this now)
  const f=greyFloor(x,z), vm=greyValley(x,z), up=GV.up, far=smoothstep(40,210,GV.d);   // far: the high ground is away from the troughs, their flanks are foothills
  const ox=gnx(x), wx=ox+noise2(ox*0.0031+3.7,z*0.0031-8.1)*46, wz=z+noise2(ox*0.0031-12.3,z*0.0031+4.9)*46;
  const amp=lerp(62,124,smoothstep(-690,-900,z))*(1-0.4*smoothstep(-940,-1030,z));   // the spine is highest at z -900 and lowers to the northern sea beyond
  const rg=ridged(wx*0.0042+3.1,wz*0.0042-1.7,3), sm=erodeFbm(wx*0.0046+5,wz*0.0046-3,5,0.22)*0.5+0.5;
  let h=lerp(f+26+amp*(0.55*sm+1.05*rg*(0.5+0.6*rg))*(0.28+0.72*far), f+up+noise2(ox*0.045,z*0.045)*0.5, vm);
  const fine=noise2(ox*0.06,z*0.06)*0.4+erodeFbm(ox*0.075+9,z*0.075-4,2,0.5)*0.55; h+=fine*(0.4+0.6*vm);
  // the walls: the east one is the Hoarfrost Reach's west wall seen from the other side (its ground blended into the Reach's and the same crest on
  // top, so the two lands meet at x = HALF without a step); the north and west ones are crests of their own
  const bx=borderXN(z), dxe=Math.abs(bx-x), f2=fbm(ox*0.02,z*0.02,3)*0.5+0.5, re=dxe<130?smoothstep(wallW(z,1),4,dxe):0, rw=smoothstep(62,4,x-GW0-rimWobble(z,41));
  const cr=(re>0||rw>0)?crest(ox,z):0;
  if(re>0){ h=lerp(h,hoarBase(x,z),re); h+=wallAdd(Math.abs(bx-x),z,1,46,14,20,fbm(x*0.02,z*0.02,3)*0.5+0.5,crest(x,z)); }   // (the east wall's crest and bumps are the Reach's own, in the world's frame: both sides must draw the same ones)
  if(rw>0) h+=rw*rw*40+rw*f2*14+rw*rw*rw*cr*20;
  // the northern sea: the ground comes down to a beach (shore, shared/terrain.js) except by the crests (the west wall, the Reach's wall), which end in headlands
  // (a crest running into the sea goes under it: its keep fades out over the last 64 m to the water)
  return shore(h,c,Math.max(Math.max(smoothstep(60,14,x-GW0),smoothstep(46,14,bx-x))*smoothstep(12,64,c),0),csWide(x,z,60));
}
/* ---- the legacy ground as a height function (the old frame's: baseHeightRaw in terrain.js asks it; the atlas's ground is waGround, world-atlas-ground.js) ---- */
const greyspineHeight=(x,z)=>{
  if(x<GW0-40) return gloamGround(x,z);
  const h=greyspineBase(x,z);
  return x<GW0+6?lerp(gloamGround(x,z),h,smoothstep(GW0-40,GW0+6,x)):h;
};
/* ---- the two rock falls: the river road (to the Sunscar, opened by the Gryphon Queen: gear.river) and the neck pass (to the Gloamhorn, opened by the mountain golem: gear.neck; Highmark's deep mine is not built).
   Each stands at the atlas's gate (WA_GATES: the River Pass grey | sun, the Windswept Neck grey | gloam): the atlas has no gorge on the way that fits better, and the gates are passes with a road through them. A shut rock fall
   holds the whole land border (gateHold: nobody crosses from the one land to the other, whoever tries, a testing teleport included; a hiker slides along it); the mesh (game/village/buildings-grey.js) is the heap in the pass.
   id is the gear flag; dir 's': the pass runs north-south (the heap spreads across x), none: east-west. h: the ground at the gate (gloamhorn.js and the mesh read it). sunland.js adds the third, Redgate (dir 'e'). */
const GREY_GATES=(()=>{
  const gt=(a,b)=>WA_GATES.find(g=>g.a===a&&g.b===b), R=gt('grey','sun'), N=gt('grey','gloam');
  return [{id:'river',dir:'s',x:R.x,z:R.z,w:9,name:'The river road',boss:'gryphonqueen'},{id:'neck',x:N.x,z:N.z,w:10,name:'The neck pass',boss:'mountaingolem'}];
})();
for(const G of GREY_GATES) G.h=baseHeight(G.x,G.z);
// 0: on the Greyspine's side of a rock fall, 1: beyond it (the Sunscar, Amber Reach / the Gloamhorn), -1: elsewhere
function gateSide(id,x,z){ const l=waLandId(x,z); return l===3?0:id==='river'?(l===4||l===6?1:-1):(l===5?1:-1); }
// keep camps, trees and rocks out of the rock falls (m = extra margin)
const inGate=(x,z,m)=>GREY_GATES.some(G=>Math.hypot(x-G.x,z-G.z)<G.w+16+(m||0));
/* A shut rock fall stops whoever tries to cross it. o: the new position, ox / oz: the old one. Used by the client's movement (worldBounds) and the server's setPos.
   The river road and the neck pass hold the land border itself (the atlas's, both ways); Redgate Canyon (dir 'e', sunland.js) is a plane at G.x, from either side. */
function gateHold(G,o,ox,oz){
  if(G.id==='river'||G.id==='neck'){
    const s0=gateSide(G.id,ox,oz), s1=gateSide(G.id,o.x,o.z); if(s0<0||s1<0||s0===s1) return;
    if(gateSide(G.id,o.x,oz)===s0) o.z=oz; else if(gateSide(G.id,ox,o.z)===s0) o.x=ox; else { o.x=ox; o.z=oz; }   // (the part of the step that crosses is dropped; the rest slides along the border)
  }
  else if(G.dir==='e'){ if(Math.abs(o.z-G.z)<G.w+30){ if(ox>=G.x&&o.x<G.x+0.8) o.x=G.x+0.8; else if(ox<G.x&&o.x>G.x-0.8) o.x=G.x-0.8; } }   // (Redgate Canyon: from either side)
}
/* ---- water: the atlas's (shared/world-atlas.js: rivers born on the Greyspine's heights, lakes, the sea) ----
   The sea is the plane y = 0; a river or lake that stands higher is a carved bed whose surface only waterSurf knows (the client draws no mesh for it yet). The Reach's lakes are ice: flat, walkable, not water.
   The three old tarns, the stream and the fjord are gone (their old-frame beds were carved into the ground that is no longer drawn); GREY_TARNS / GREY_FJORD stay as empty records because ui/map.js still reads them. */
const GREY_TARNS=[], GREY_FJORD={pts:[[-9999,-9999],[-9999,-9999]],w:0,floor:0};
// the water surface under (x, z): a lake's or river's level, or the sea's (0 where there is none). greyWet: under it, by more than m (no plant grows, no camp is made)
function waterSurf(x,z){
  if(waWaterDist(x,z)<0&&!waIsSea(x,z)) return waWater(x,z)===WA_ICE?WATER:waWaterSurf(x,z);   // the atlas's lakes and rivers (a frozen lake is ice: ground, not water)
  if(typeof FALL!=='undefined'&&Math.hypot(x-FALL.tx,z-FALL.tz)<FALL.tr*1.15) return FALL.tl;   // the Greyfall's old tarn (shared/terrain.js; goes with it)
  if(inSun(x,z)&&typeof sunWaterSurf==='function'){ const w=sunWaterSurf(x,z); return w===null?WATER:w; }   // the Sunscar's old river and lakes (shared/sunland.js; go with it)
  return WATER;
}
const greyWet=(x,z,m)=>inGrey(x,z)&&getH(x,z)<waterSurf(x,z)-(m===undefined?-0.2:m);
