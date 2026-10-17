//@ The Greyspine, the fourth land (levels 26-32, docs/WORLD.md) on the atlas: its places (GREY_HM, GREY_QUEEN, the glacier valley GLEN, the two rock falls GREY_GATES with gateHold), the one water function (waterSurf, greyWet) Pure.
/* ===================== THE GREYSPINE =====================
   The fourth land (levels 26-32), the most extreme ground of the world: a glacier-carved range north of the home forest, west of the Hoarfrost Reach, with Highmark on its hub and its zones, bosses, door and gates at the
   atlas's anchors (shared/world-atlas.js, docs/world-atlas.py). The ground, the rivers (born on its heights; no tarns, no fjord of its own) and the coast are the atlas's (world-atlas-ground.js: ridged
   mountains and deep glens, waForm case 3). What stays here:
     - the places: GREY_HM (Highmark), GREY_QUEEN (the Gryphon Queen's peak), GLEN (the glacier valley, the gate to the Reach, with its ice fall), GREY_GATES (the two rock falls: the river road to the Sunscar, the neck pass to the
       Gloamhorn: both stand at the atlas's gates, the River Pass and the Windswept Neck; the atlas has no gorge on the way that fits better), gateHold / inGate / inGlen;
     - waterSurf / greyWet: the one water-surface function the whole game asks (the atlas's lakes and rivers; a frozen lake is not water);
   Agent map: GREY_HM, GREY_QUEEN, GLEN {z, w, x0, x1, ice, bx, h0, h1, floor}, inGlen, westBarX(z), GREY_GATES, gateHold, inGate, waterSurf, greyWet, greySnowAmt, greyTreeline.
   Used by: highmark.js, greyzones.js, roads.js, sunland.js, gloamhorn.js, the server (api.js, economy.js), the client (movement, map, buildings-grey, generation, chamois). Tests: tools/greyspine-smoke.js, atlas-smoke.js. */
// The places, at the atlas's anchors: Highmark on the Greyspine's hub (the village disc, moved as one piece; up: retired, the pad is the village's own), and the Gryphon Queen's peak (boss 29, the atlas's boss "The Gryphon Queen's Peak")
const GREY_HM=(()=>{ const [x,z]=WA_HUBS.grey; return {x,z,r:34,up:0}; })();
const GREY_QUEEN=(()=>{ const P=WA_POIS.find(p=>p.name==="The Gryphon Queen's Peak"); return {x:P.x,z:P.z,r:28,h:baseHeight(P.x,P.z)}; })();
const greyTreeline=(x,z)=>106+noise2(x*0.012+7,z*0.012-2)*14;   // no tree grows above it (the snowline is a little higher)
// Where rain turns to snow (the client's weather, game/world/weather.js), as a Minecraft biome does by temperature: the air cools with height and
// with the far north (10 m lower beyond z -860). Same noise and north shift as the white ground's line in terrain-color.js, so the flakes begin a
// little below where the ground whitens: 0 = rain below the line (Highmark's shelf, ~100 m, stays wet), 1 = snow 34 m above it (the peaks), sleet in between.
const greySnowAmt=(x,z,h)=>{ const sl=(z<-860?-10:0)+(noise2(x*0.02,z*0.02)*0.5+0.5)*18; return smoothstep(106+sl,136+sl,h); };
/* ---- the glacier valley: the atlas's Glacier Valley, the gate between the Hoarfrost Reach and the Greyspine (docs/WORLD.md section 5: opened when Ymrik, the Rimeking, falls; gear.west 0 shut, 1 open, 2 walked into
   Highmark). The way through is the atlas's own saddle in the range along the border (a road crosses it): nothing is carved. GLEN.z is the road's z at the gate, x0 / x1 the strip kept clear of trees and camps (the road runs
   along it), and a wall of broken ice (the ice fall, drawn by game/village/buildings-grey.js) stands across it at x = GLEN.ice, 15 m inside the Reach (GLEN.bx is the border's x there), until the gate opens.
   The clamps that stop you at it are player/movement.js (barStep) and server/api.js (setPos); westBarX(z) below is the line they should hold while it is shut. */
const GLEN=(()=>{
  const G=WA_GATES.find(g=>g.a==='hoar'&&g.b==='grey'); let bx=G.x; for(let x=G.x+150;x>G.x-150;x-=2) if(waLandId(x,G.z)!==2){ bx=x+2; break; }   // (going west from the Reach: where its land ends)
  const o={z:G.z,w:11,x0:G.x-92,x1:G.x+92,bx,ice:bx+15,gx:G.x};
  o.h0=baseHeight(o.x0,o.z); o.h1=baseHeight(o.x1,o.z); o.floor=x=>lerp(o.h0,o.h1,smoothstep(o.x0,o.x1,x)); return o;
})();
// the Reach's west edge per 8 m of z (the most western x of its land there, +15 m as the fall itself): the x a hiker coming from the Reach must stay east of while the ice fall stands; -1e9 where the Reach does not border the Greyspine
const WEST_Z0=Math.floor(WZ0/8)*8, WEST_BAR=(()=>{
  const n=Math.ceil((WZ1-WZ0)/8)+1, out=new Array(n).fill(null);
  for(let i=0;i<n;i++){ const z=WEST_Z0+i*8; for(let x=-700;x<GLEN.gx+400;x+=8) if(waLand(x,z)==='hoar'){ if(waLand(x-16,z)==='grey'||waLand(x-8,z)==='grey'){ let e=x; while(e>x-9&&waLand(e-1,z)==='hoar') e--; out[i]=e+15; } break; } }
  return out;
})();
function westBarX(z){ const i=Math.round((z-WEST_Z0)/8); return i>=0&&i<WEST_BAR.length&&WEST_BAR[i]!==null?WEST_BAR[i]:-1e9; }
// keep trees, rocks and camps out of the glen (m = extra margin)
const inGlen=(x,z,m)=>Math.abs(z-GLEN.z)<GLEN.w+8+(m||0)&&x>GLEN.x0-30&&x<GLEN.x1+30;
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
   The three old tarns, the stream and the fjord are gone with the old frame's ground. */
// the water surface under (x, z): a lake's or river's level, or the sea's (0 where there is none). greyWet: under it, by more than m (no plant grows, no camp is made)
function waterSurf(x,z){
  if(waWaterDist(x,z)<0&&!waIsSea(x,z)) return waWater(x,z)===WA_ICE?WATER:waWaterSurf(x,z);   // the atlas's lakes and rivers (a frozen lake is ice: ground, not water)
  if(inSun(x,z)&&typeof sunWaterSurf==='function'){ const w=sunWaterSurf(x,z); return w===null?WATER:w; }   // the Sunscar's old river and lakes (shared/sunland.js; go with it)
  return WATER;
}
const greyWet=(x,z,m)=>inGrey(x,z)&&getH(x,z)<waterSurf(x,z)-(m===undefined?-0.2:m);
