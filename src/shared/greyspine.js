//@ The Greyspine, the fourth land (levels 26-32, docs/WORLD.md): its ground (greyspineHeight: U-shaped valleys between ridged peaks, walls on four sides, Highmark's shelf, the Gryphon Queen's peak), the glacier valley (GLEN) and the two canyons in the west wall (GREY_GATES), its tarns, river and fjord (waterSurf, greyWet). Pure.
/* ===================== THE GREYSPINE =====================
   A young alpine range: the rectangle WX0..HALF x WZ0..HZ0 north of the home forest and west of the Hoarfrost Reach (880 x 600 m). It is
   a glacier-carved country: a long trough, GREY_VALLEYS[0], runs west from where the Hoarfrost's glacier valley will come in (east wall)
   to where the river road to the Sunscar will leave (west wall), with side valleys going up into cirques under the high peaks of the
   spine in the north. Between the troughs the ground is ridged mountains. This file is only the shape of the ground; nothing is
   built on it yet (no village, zones, monsters, roads, gates). Where the land meets its neighbours:
     south  the home forest's northern rim goes on as a crest at z = HZ0 and eases down onto the Greyspine over ~66 m (baseHeight);
     east   the Vale Wall goes on along x = HALF as the Hoarfrost Reach's west wall (hoarHeight): the Greyspine rises to the very same
            crest, so the two lands meet without a seam. The glacier valley that will lead through it (the gate, opened by Ymrik) is not cut yet;
     north  the spine, the highest ground, ends in a crest like the Reach's glacier wall (the sea lies beyond);
     west   a wall too: the neck to the Stormhorn and the river road to the Sunscar will be cut through it later.
   Every wall is climbable up to 14 m short of its crest (player/movement.js) and no further. Nothing finer than 8-16 m wavelength goes in:
   the server samples this on a 4 m grid. Water is not part of it: the ground stays well above the sea (the fjords on the south-west coast
   and the tarns, waterfalls and the river need water at altitude: a later step). */
const GREY_VALLEYS=[   // centre line (x,z), half-width of the flat floor (in), half-width where the mountain starts (out), how many metres the floor climbs to the valley's head (up)
  {name:'The Long Valley',in:24,out:104,up:0,pts:[[418,-742],[340,-722],[262,-696],[170,-684],[80,-670],[0,-652],[-90,-638],[-170,-620],[-250,-596],[-340,-574],[-418,-566]]},
  {name:'The North Fork',in:16,out:72,up:62,pts:[[262,-696],[256,-770],[286,-846],[322,-918]]},
  {name:'The Queen\'s Fork',in:16,out:74,up:92,pts:[[-60,-648],[-92,-736],[-150,-808],[-178,-858]]},
  {name:'The Neck',in:15,out:64,up:26,pts:[[-120,-700],[-230,-746],[-330,-770],[-418,-782]]},
  {name:'The Sink Valley',in:16,out:62,up:16,pts:[[190,-680],[196,-606],[150,-552],[96,-522]]}];
GREY_VALLEYS.forEach(v=>{ v.len=[0]; for(let i=1;i<v.pts.length;i++) v.len.push(v.len[i-1]+Math.hypot(v.pts[i][0]-v.pts[i-1][0],v.pts[i][1]-v.pts[i-1][1])); v.total=v.len[v.len.length-1]; });
// Highmark's shelf (the village of the miners and monks goes here, on the Long Valley's north flank near the Hoarfrost side: a flattened bench) and
// the Gryphon Queen's peak (boss 29: a summit crown for her arena)
const GREY_HM={x:292,z:-792,r:34,up:26};   // up: the bench's height above the trough's floor
const GREY_QUEEN={x:-200,z:-960,r:28,h:232};
const greyTreeline=(x,z)=>106+noise2(x*0.012+7,z*0.012-2)*14;   // no tree grows above it (the snowline is a little higher)
// Where rain turns to snow (the client's weather, game/world/weather.js), as a Minecraft biome does by temperature: the air cools with height and
// with the far north (10 m lower beyond z -860). Same noise and north shift as the white ground's line in terrain-color.js, so the flakes begin a
// little below where the ground whitens: 0 = rain below the line (Highmark's shelf, ~100 m, stays wet), 1 = snow 34 m above it (the peaks), sleet in between.
const greySnowAmt=(x,z,h)=>{ const sl=(z<-860?-10:0)+(noise2(x*0.02,z*0.02)*0.5+0.5)*18; return smoothstep(112+sl,146+sl,h); };
const GV={m:0,up:0,d:0};
/* how much of this point is valley floor: GV.m 1 on a trough's flat floor, 0 on the mountains; GV.up the floor's rise towards the head
   of a side valley, GV.d the distance to the nearest trough's centre line. The troughs wander (a domain warp of +-38 m), so they are not lines drawn with a ruler. */
function greyValley(x,z){
  const qx=x+noise2(x*0.007+11,z*0.007-4)*38, qz=z+noise2(x*0.007-23,z*0.007+9)*38;
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
const greyFloor=(x,z)=>34+42*smoothstep(-420,300,x)+fbm(x*0.006+2,z*0.006-9,2)*5+noise2(x*0.03+4,z*0.03)*1.1;
/* ---- the glacier valley: the one place where the Hoarfrost Reach's west wall and the Greyspine's east wall are cut through, at the same z (the gate of
   docs/WORLD.md section 5: opened when Ymrik, the Rimeking, falls; gear.west 0 shut, 1 open, 2 walked into Highmark). A canyon with a floor GLEN.w x 2 wide
   that climbs from the Reach's plateau (GLEN.h1, about 50 m) to the Long Valley's floor (GLEN.h0, about 75 m) between walls 40-60 m above it. A wall of
   broken ice (the ice fall, drawn by game/village/buildings-grey.js) stands across it at x = GLEN.ice until the gate opens: stopped by player/movement.js
   and server/api.js like the ice wall in Frostgate Pass. glenCarve is called by rawHeight. */
const GLEN={z:-722,w:11,x0:HALF-92,x1:HALF+92,ice:HALF+22};
GLEN.h0=greyFloor(GLEN.x0,GLEN.z); GLEN.h1=hoarBase(GLEN.x1,GLEN.z);
GLEN.floor=x=>lerp(GLEN.h0,GLEN.h1,smoothstep(GLEN.x0,GLEN.x1,x));
function glenCarve(x,z,h){
  const dz=Math.abs(z-GLEN.z); if(dz>GLEN.w+26||x<GLEN.x0-34||x>GLEN.x1+34) return h;
  return lerp(h,GLEN.floor(x),smoothstep(GLEN.w+24,GLEN.w+1,dz)*smoothstep(GLEN.x0-34,GLEN.x0,x)*smoothstep(GLEN.x1+34,GLEN.x1,x));
}
// keep trees, rocks and camps out of the glen (m = extra margin)
const inGlen=(x,z,m)=>Math.abs(z-GLEN.z)<GLEN.w+8+(m||0)&&x>GLEN.x0-30&&x<GLEN.x1+30;
function greyspineBase(x,z){
  const f=greyFloor(x,z), vm=greyValley(x,z), up=GV.up, far=smoothstep(40,210,GV.d);   // far: the high ground is away from the troughs, their flanks are foothills
  const wx=x+noise2(x*0.0031+3.7,z*0.0031-8.1)*46, wz=z+noise2(x*0.0031-12.3,z*0.0031+4.9)*46;
  const amp=lerp(62,124,smoothstep(-690,-960,z));   // the spine in the north is the highest
  const rg=ridged(wx*0.0042+3.1,wz*0.0042-1.7,3), sm=erodeFbm(wx*0.0046+5,wz*0.0046-3,5,0.22)*0.5+0.5;
  let h=lerp(f+26+amp*(0.55*sm+1.05*rg*(0.5+0.6*rg))*(0.28+0.72*far), f+up+noise2(x*0.045,z*0.045)*0.5, vm);
  const fine=noise2(x*0.06,z*0.06)*0.4+erodeFbm(x*0.075+9,z*0.075-4,2,0.5)*0.55; h+=fine*(0.4+0.6*vm);
  // the walls: the east one is the Hoarfrost Reach's west wall seen from the other side (its ground blended into the Reach's and the same crest on
  // top, so the two lands meet at x = HALF without a step); the north and west ones are crests of their own
  const f2=fbm(x*0.02,z*0.02,3)*0.5+0.5, re=smoothstep(62,4,HALF-x), rn=smoothstep(62,4,z-WZ0-rimWobble(x,31)), rw=smoothstep(62,4,x-WX0-rimWobble(z,41));
  const cr=(re>0||rn>0||rw>0)?crest(x,z):0;
  if(re>0){ h=lerp(h,hoarBase(x,z),re); h+=re*re*46+re*f2*14+re*re*re*cr*20; }
  if(rn>0) h+=rn*rn*46+rn*f2*16+rn*rn*rn*cr*22;
  if(rw>0) h+=rw*rw*40+rw*f2*14+rw*rw*rw*cr*20;
  // (after the walls, so a bench and a crown stay flat)
  { const d=Math.hypot(x-GREY_HM.x,z-GREY_HM.z); if(d<GREY_HM.r+24) h=lerp(h,greyFloor(GREY_HM.x,GREY_HM.z)+GREY_HM.up,smoothstep(GREY_HM.r+24,GREY_HM.r+3,d)); }
  { const Q=GREY_QUEEN, d=Math.hypot(x-Q.x,z-Q.z);   // her mountain: a cone of about 48 degrees (its outline wobbles, ribs run down it) standing out of the ground round it, with a flat crown on top
    if(d<Q.r+190){ const dw=Math.hypot(x-Q.x+noise2(x*0.011+2,z*0.011)*34,z-Q.z+noise2(x*0.011-6,z*0.011+8)*34), c=Q.h-Math.max(0,dw-Q.r)*1.15-ridged(x*0.017+9,z*0.017-4,3)*26*smoothstep(Q.r+20,Q.r+90,dw);
      h=0.5*(h+c+Math.sqrt((h-c)*(h-c)+196)); }
    if(d<Q.r+22) h=lerp(h,Q.h,smoothstep(Q.r+22,Q.r,d)); }
  return h;
}
/* ---- water (docs/WORLD.md: tarns, a river that leaves the range, a fjord on the south-west coast) ----
   Altitude water cannot be the sea's single plane at y = 0, so each piece has its own surface (game/village/buildings-grey.js): three tarns, flat shelves of
   ground with a bowl in them (GREY_TARNS: x, z, radius, and l, the water level, a hand below the ground the shelf was cut from); a stream, GREY_RIVER, that
   leaves the Mirrortarn and runs west down the Long Valley in a channel of its own, a hand deep (waterSurf says where it is wading); and the fjord, a flooded
   gorge 9 m below the sea in the south-west corner whose water is the sea's own level (a darker, colder surface is drawn over the sea's there). The river
   ends in the Long Valley's west end, short of the fjord's bank (it runs on underground, as the doc has it: the river road to the Sunscar follows it). greyspineHeight = greyspineBase (the ground) with these cut into it. */
const GREY_TARNS=[{x:72,z:-640,r:26,name:'Mirrortarn'},{x:-172,z:-846,r:22,name:"Queen's Tarn"},{x:318,z:-912,r:20,name:'Highmark Tarn'}];   // (the Mirrortarn is moved onto the river's head below)
const GREY_RIVER_W=3.2, GREY_RIVER=(()=>{   // [x, z, bed height] every ~8 m, from the tarn west
  const raw=[[50,-664],[0,-652],[-90,-638],[-170,-620],[-250,-596],[-330,-576]], pts=[];
  const wox=(x,z)=>noise2(x*0.007+11,z*0.007-4)*38, woz=(x,z)=>noise2(x*0.007-23,z*0.007+9)*38;   // (the troughs are drawn through a domain warp: undo it to find the floor's real centre line)
  const mid=raw.map(([qx,qz])=>{ let x=qx,z=qz; for(let k=0;k<4;k++){ x=qx-wox(x,z); z=qz-woz(x,z); } return [x,z]; });
  for(let i=0;i<mid.length-1;i++){ const [ax,az]=mid[i], [bx,bz]=mid[i+1], n=Math.max(1,Math.round(Math.hypot(bx-ax,bz-az)/8)); for(let k=0;k<n;k++){ const t=k/n; pts.push([lerp(ax,bx,t),lerp(az,bz,t)+Math.sin((i+t)*2.1)*9+noise2((i+t)*0.9+4,2.2)*6]); } }
  pts.push(mid[mid.length-1]);
  let bed=1e9; return pts.map(([x,z])=>{ bed=Math.min(bed,greyspineBase(x,z)-0.9); return [x,z,bed]; });   // (it only ever runs downhill)
})();
{ const h=GREY_RIVER[0]; GREY_TARNS[0].x=h[0]+12; GREY_TARNS[0].z=h[1]; }
for(const T of GREY_TARNS) T.l=greyspineBase(T.x,T.z)-0.2;
// the nearest point of the river: {d, y: the water's surface there}
const GRV={d:1e9,y:0};
function greyRiverAt(x,z){
  GRV.d=1e9; if(x>100||x<-410||z<-700||z>-520) return GRV;
  for(let i=1;i<GREY_RIVER.length;i++){
    const a=GREY_RIVER[i-1], b=GREY_RIVER[i], vx=b[0]-a[0], vz=b[1]-a[1], l2=vx*vx+vz*vz, t=clamp(((x-a[0])*vx+(z-a[1])*vz)/l2), d=Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);
    if(d<GRV.d){ GRV.d=d; GRV.y=lerp(a[2],b[2],t)+0.65; }
  }
  return GRV;
}
const GREY_FJORD={pts:[[-452,-512],[-400,-508],[-352,-500],[-308,-490]],w:21,floor:-9};   // the gorge's centre line, its half-width and floor
function fjordDist(x,z){ if(x>-240||z<-580||z>-420) return 1e9; let m=1e9; for(let i=1;i<GREY_FJORD.pts.length;i++){ const a=GREY_FJORD.pts[i-1], b=GREY_FJORD.pts[i], vx=b[0]-a[0], vz=b[1]-a[1], t=clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz)); m=Math.min(m,Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t)); } return m; }
function greyWaterCut(x,z,h){
  for(const T of GREY_TARNS){ const d=Math.hypot(x-T.x,z-T.z); if(d>T.r*2.5) continue;
    h=lerp(h,T.l+0.4,smoothstep(T.r*2.5,T.r*1.45,d)); h=lerp(h,T.l-1.5,smoothstep(T.r*1.15,T.r*0.55,d)); }
  { const r=greyRiverAt(x,z); if(r.d<GREY_RIVER_W*3.8){ const bed=r.y-0.65, prof=bed+1.7*Math.pow(r.d/(GREY_RIVER_W+0.9),2); h=lerp(h,Math.min(h,prof),smoothstep(GREY_RIVER_W*3.8,GREY_RIVER_W*1.5,r.d)); } }
  { const d=fjordDist(x,z), F=GREY_FJORD; if(d<F.w+30) h=lerp(h,F.floor,smoothstep(F.w+26,F.w*0.75,d)); }
  return h;
}
/* ---- the two gates in the west wall: the river road (the Long Valley's west end; to the Sunscar) and the neck pass (the Neck valley's; to the Stormhorn).
   Each is a canyon cut through the wall to the world's edge, shut by a rock fall at x = GATE.x until a boss falls: the river road opens with the Gryphon
   Queen (gear.river), the neck pass (and Highmark's deep mine, not built) with the mountain golem (gear.neck). Stopped by player/movement.js and
   server/api.js like the ice fall; drawn by game/village/buildings-grey.js. The lands beyond are not built: both canyons end at the edge of the world. */
const GREY_GATES=[{id:'river',z:-586,x:-384,w:10,name:'The river road',boss:'gryphonqueen'},{id:'neck',z:-776,x:-384,w:10,name:'The neck pass',boss:'mountaingolem'}];
for(const G of GREY_GATES) G.h=Math.min(greyspineBase(-340,G.z),greyFloor(-340,G.z)+4);
function westCarve(x,z,h){
  if(x>-320) return h;
  for(const G of GREY_GATES){ const dz=Math.abs(z-G.z); if(dz<G.w+26) h=lerp(h,G.h,smoothstep(G.w+24,G.w+1,dz)*smoothstep(-320,-372,x)); }
  return h;
}
const greyspineHeight=(x,z)=>westCarve(x,z,greyWaterCut(x,z,greyspineBase(x,z)));
// keep camps, trees and rocks out of the gates' canyons (m = extra margin)
const inGate=(x,z,m)=>x<-310&&GREY_GATES.some(G=>Math.abs(z-G.z)<G.w+8+(m||0));
// the water surface under (x, z): a tarn's level, the river's, or the sea's. greyWet: under it, by more than m (no plant grows, no camp is made)
function waterSurf(x,z){
  if(x<HALF&&z<HZ0){
    for(const T of GREY_TARNS) if(Math.hypot(x-T.x,z-T.z)<T.r*1.2) return T.l;
    const r=greyRiverAt(x,z); if(r.d<2.6) return r.y;
  }
  return WATER;
}
const greyWet=(x,z,m)=>inGrey(x,z)&&getH(x,z)<waterSurf(x,z)-(m===undefined?-0.2:m);
