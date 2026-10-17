//@ Map size (SIZE, HALF, WATER; the whole world WX0..WX1 x WZ0..WZ1 with the Sakura Vale east and the Hoarfrost Reach north of it), river (riverX), lakes, the lands' edges (coast, the Sunwall and Redgate, snowy rims), the hills' shape (hillShape: warped, eroded fbm; ridged mountains), baseHeight (where the Greyspine, shared/greyspine.js, meets the home forest's rim and the vale's wall), inGrey, forestDensity, autumnAmt. Pure.
/* ---------- world shape ---------- */
const SIZE=880, HALF=SIZE/2, WATER=0;
/* The home forest is the square -HALF..HALF. East of its border mountains lies the Sakura Vale (550 m wide: VALE_E),
   reached through the tunnel in shared/vale.js. North of the vale, over its crest at z = HZ0 (the old north edge of both lands),
   lies the Hoarfrost Reach, a high frozen plateau that runs on east and north past the vale's and the Greyspine's edges (shared/hoarfrost.js); the rest of the rectangle north of the
   home forest is the Greyspine, the fourth land (shared/greyspine.js: its terrain; no village, monsters or way in yet).
   The whole world is the rectangle WX0..WX1 x WZ0..WZ1. */
const NORTH_D=840, HZ0=-HALF;
/* The north is fitted to the planned map (docs/world-map.svg, docs/WORLD.md): there the Hoarfrost Reach lies over the east half of the home forest as well as over the vale, and the Greyspine
   is north-west of the forest, not over it. So the Greyspine (all of it: ground, Highmark, zones, the Queen, the glacier valley, the gates) was moved GDX metres west, as one piece, and the Greyspine | Reach
   wall with it (borderXN, GXJ: about x = -140, over the middle of the forest); the Reach's own places (Rimehold, its zones and arenas, the lakes, the barrow's door) moved RDX west to stand
   between that wall and Frostgate Pass. The world's rectangle grew west to hold the Greyspine's far end (WX0); the forest's own west edge, the Sunwall, stays at HX0, and beyond it, south
   of the Greyspine, lies the unbuilt Sunscar's plateau (the Sunwall's top goes on: homeHeight). The Reach's north-east corner (it ran 330 m east of the vale) is sea now. */
const GDX=-580, RDX=-390, GLX=720;   // GLX: the Gloamhorn (shared/gloamhorn.js) grew the rectangle this far west of the Greyspine's old edge GW0
/* THE WORLD FRAME is the atlas's canvas (shared/world-atlas.js, docs/world-atlas.py): x -1900..1650, z -1120..1180. Every constant above and below this line that is not WX0..WZ1 is the OLD frame,
   kept (HALF, HZ0, GDX, RDX, GLX, EAST_W, HX0, GW0, GXJ, VALE_E, GREY_N, borderX / borderXN / borderZ ...) only because the lands' content modules (villages, zones, arenas, doors, gates) are still placed in it
   until they are re-pointed to the atlas's anchors; the lands, the coast and the ground are the atlas's (landAt, inVale..., coastDist, baseHeight below). */
const EAST_W=880, HX0=-HALF, GW0=HX0+GDX, WX0=WA_META.x0, WX1=WA_META.x1, WZ0=WA_META.z0, WZ1=WA_META.z1, WW=WX1-WX0, WD=WZ1-WZ0;
const GXJ=HALF+GDX;   // the Greyspine | Reach wall's mean line (x), and where it meets the forest's north wall
/* The rectangle grew for the Hoarfrost Reach (it was 550 m east and 600 m north of the forest's corner, 244,000 m2 of land against the vale's 433,000): the vale's east edge and the
   Greyspine's north edge stay where they were (VALE_E, GREY_N), and the sea fills the rest of the rectangle; the coast (shared/coasts.js) is an outline drawn over it. */
const VALE_E=HALF+550, GREY_N=HZ0-600;
/* ---------- the borders between the lands (they used to be ruler-straight lines, x = HALF and z = HZ0) ----------
   Each border is a mountain range whose crest line wanders. borderX(z) is the x of the Vale Wall's crest (the home forest | the vale; it ends in the north wall at the junction),
   borderXN(z) the x of the Greyspine | Hoarfrost Reach wall's crest (north of the north wall, over the forest's middle: GXJ), borderZ(x) the z of the north wall's crest (the home forest | the Greyspine
   or the Reach to the west, the vale | the Reach to the east; for x west of the forest it is the Greyspine's south wall, with the Sunscar's plateau beyond). The lines lean away from the lands that have the least room (the Vale Wall may bulge 125 m east or 38 m
   west of x = HALF, the north wall 125 m south or 38 m north of z = HZ0) and are pinned straight where something is built across them (the tunnel,
   Frostgate Pass, the glacier valley) and where the two walls cross, so every gate and the junction of the four lands stay where they were.
   A point's land is which side of the two lines it is on: always ask inVale / inHoar / inGrey / landAt with both x and z. */
const pinK=(t,pins)=>{ let k=1; for(let i=0;i<pins.length;i++){ const p=pins[i]; k*=smoothstep(p[1],p[1]+p[2],Math.abs(t-p[0])); } return k; };
const BORDER_X_PINS=[[-100,42,80],[HZ0,96,80]];   // z, the river: the bridge, the junction (and the Greyfall, where the river is born: z -536..-344)
const BORDER_XN_PINS=[[HZ0,36,44],[-722,30,40]];  // z, the Greyspine | Reach wall: the junction, the glacier valley
const BORDER_Z_PINS=[[HALF,40,60],[636,40,40],[GXJ,40,60]];   // x: the junction of the forest, the vale and the Reach, Frostgate Pass, the junction of the forest, the Greyspine and the Reach
// the slow noise the lines are bent by, about -1..1 (broad bends of 300-400 m, a little of 100-150 m on them)
const bordNoise=(t,s)=>(noise2(t*0.0030+s,s*0.37+1.15)*0.82+noise2(t*0.0072+s*2.1,s+4.8)*0.18)/0.8;
/* How far each line may bulge, by what each land has to lose. The home forest is the one with room to spare (880 m square, its edges are only outer-ring
   camps), so the lines bulge into it: the north wall up to 210 m south of z = HZ0 and the Vale Wall's river up to 210 m west of x = HALF; the vale and the Greyspine
   own content close to the lines (the vale's zones begin at x = 570 and z = -300, Highmark and the Sink are 150 m from the Greyspine's edges), so they give 55 m at most
   (the Reach, east of the glacier valley and north of the vale, up to 120 m). A line never goes the other way, so the Greyspine keeps all of its ground. */
/* Each border is a function of ONE coordinate and the land tests (inVale, inHoar, vilAt, zoneAt, rawHeight, the map painter...) ask it again and again for the same
   point (a terrain sample makes about ten borderZ calls, nine in ten with the very argument of the call before), and each answer costs several noise2 calls: the last answer
   of each is kept (var: a call while the shared files load, before this line, must not meet a temporal dead zone). Pure functions, so this changes no value. */
var _bXz=NaN, _bXv=0, _bNz=NaN, _bNv=0, _bZx=NaN, _bZv=0;
function borderX(z){
  if(z===_bXz) return _bXv;
  let r=HALF;   // (north of the junction the Vale Wall is a stub that ends in the north wall's crest; the wall that goes on north is borderXN)
  if(z>HZ0){   // the river, a meander mostly west of x = HALF (-210..+40 m), with bends of 300, 240 and 115 m
    const m=0.62*Math.sin(z*0.0108+1.3+0.8*noise2(z*0.004+3.1,1.15))+0.26*Math.sin(z*0.0265+0.4)+0.12*Math.sin(z*0.055+2.2);
    r=HALF+(-85+125*m)*pinK(z,BORDER_X_PINS);
  }
  _bXz=z; return _bXv=r;
}
function borderXN(z){
  if(z===_bNz) return _bNv;
  const m=clamp(0.45*bordNoise(z,3.1)+0.55*Math.sin(z*0.0235+0.8+0.8*noise2(z*0.003,2.4)),-1,1);
  _bNz=z; return _bNv=GXJ+105*(0.5+0.5*m)*pinK(z,BORDER_XN_PINS);   // the Greyspine | Reach wall: 0..105 m east of GXJ, in bends of 150-300 m
}
function borderZ(x){
  if(x===_bZx) return _bZv;
  const k=pinK(x,BORDER_Z_PINS); let r;
  if(x<HALF){ const m=clamp(0.5*bordNoise(x,-9.3)+0.5*Math.sin(x*0.0245+1.7+0.9*noise2(x*0.004+2.2,5.5)),-1,1); r=HZ0+100*(1-0.68*Math.exp(-Math.pow((x+30)/150,2)))*(0.5+0.5*m)*k; }   // home | Greyspine: 0..100 m south (less in front of the north zone's camps, x -180..120), in bends of 200-300 m
  else{ const w=0.62*Math.sin(x*0.0125+2.2+0.7*noise2(x*0.004-9.3,2.9))+0.24*Math.sin(x*0.027+2.1)+0.14*Math.sin(x*0.058+0.9);   // vale | Reach: sinuous, 115 m north .. 45 m south
    r=HZ0+(-35+80*w)*k; }
  _bZx=x; return _bZv=r;
}
const borderXat=(x,z)=>z<borderZ(x)?borderXN(z):borderX(z);   // the wall on the west side of this point's land: the Vale Wall (south of the north wall), the Greyspine | Reach wall (north of it)
/* The land tests answer from the atlas (shared/world-atlas.js: waLandId is total, the sea and the islands take the nearest land). Their old meanings stay: inVale is the vale AND the Reach, inGrey the Greyspine AND the Gloamhorn
   (ask inGloam first), inSun the Sunscar (and the closed land link south of it, Amber Reach). */
const inVale=(x,z)=>{ const l=waLandId(x,z); return l===1||l===2; };   // the Sakura Vale and the Hoarfrost Reach
const inHoar=(x,z)=>waLandId(x,z)===2;   // the Hoarfrost Reach
const inGrey=(x,z)=>{ const l=waLandId(x,z); return l===3||l===5; };   // the Greyspine and the Gloamhorn
const inGloam=(x,z)=>waLandId(x,z)===5;   // the Gloamhorn, the sixth land (check it BEFORE inGrey, which is true there too)
const inSun=(x,z)=>{ const l=waLandId(x,z); return l===4||l===6; };   // the Sunscar, the fifth land
/* A border range's profile. Its width (to where its foot starts) and its height vary along the line (t: z for the Vale Wall, k 1; x for the north wall,
   k 3), so a wall is broad massifs and narrow necks, with a low irregular skirt of foothills beyond its body. Both lands on either side of a crest add the
   very same terms (d: distance to the crest line, negative past it on the north wall, which goes on as a plateau), so they meet without a step. */
const wallW=(t,k)=>58+70*(noise2(t*0.0058+k*7.3,k*1.9)*0.5+0.5);   // the body: 58-128 m wide (62 before)
const wallK=(t,k)=>0.55+0.95*smoothstep(0.1,0.9,noise2(t*0.0046-k*3.1,k*0.7+4)*0.5+0.5);   // its height: x0.55 (a saddle) to x1.5 (a massif)
const wallP=(t,k)=>1.25+1.5*(noise2(t*0.0075+k*4.7,k*2.3+1)*0.5+0.5);   // its profile: 1.25 a long ramp .. 2.75 a steep wall
function wallAdd(d,t,k,A,F,B,f,cr){
  if(d>250) return 0;   // (far from the range: nothing, and no noise to sample)
  const W=wallW(t,k), u=smoothstep(W,4,d), s=smoothstep(W*1.7,W*0.6,d), fing=noise2(t*0.0085+k*2.3,d*0.004+k)*0.5+0.5;   // fing: ridges that run out of the range into the land (the foothills)
  return (Math.pow(u,wallP(t,k))*A*wallK(t,k)+u*f*F+u*u*u*cr*B+s*s*(4+16*fing*fing))*(k===1?1-riverK(t):1);   // (no mountain where the Vale Wall is a river)
}
/* The Vale Wall south of the junction is a river, not a mountain: it rises as a waterfall off the home forest's north rim (game/village/buildings-river.js)
   and runs south to the Crownsea along the border line, a gorge-less channel 30-60 m wide and 2.8 m deep at the middle (water is the sea's level) with a low flat
   flood plain either side. A stone bridge crosses it at z -100 (TUN, shared/vale.js); there is no mountain left between the home forest and the vale. riverK: 1 on the river,
   0 on the mountain (the Greyspine | Reach wall north of the junction). */
const riverK=z=>smoothstep(HZ0+20,HZ0+90,z);
const riverHalfW=z=>16+14*(noise2(z*0.0052+8.1,2.2)*0.5+0.5);
function riverCut(h,d,z){
  const rk=riverK(z); if(rk<=0||d>130) return h;
  const wr=riverHalfW(z);
  h=lerp(h,h*0.4+1.8,smoothstep(wr+75,wr+10,d)*rk);   // the flood plain: low and flat
  return lerp(h,-2.8,smoothstep(wr+4,wr-6,d)*rk);     // the channel
}
/* The Greyfall: the river is born at the foot of the home forest's north rim, where a waterfall drops off the Greyspine's high ground. A tarn sits on the
   rim's top (FALL.tl, a bowl in the rock: the water level waterSurf says), its outflow cuts a slot through the crest (the chute, FALL.w half-wide) and falls
   about 125 m down the rim's face to a plunge pool at its foot (the sea's level, 3.4 m deep), from which the river runs south along the border line. The fall's path
   (fallProfile) never rises and never floats above the ground; game/village/buildings-greyfall.js draws the water over it. Nobody walks up there: it is the mountain. */
const FALL={x:441,tx:447,tz:-453,tr:11,tl:139.5,lipZ:-428,baseZ:-374,w:6,slope:2.6,pool:{z:-364,r:17}};
let _fallP=null;
function fallProfile(){   // [z, y] every 2 m from the tarn's outflow to the foot of the fall
  if(_fallP) return _fallP;
  const P=[]; let y=FALL.tl-0.4;
  for(let z=FALL.tz+FALL.tr-6;z<=FALL.baseZ+0.01;z+=2){
    let t=FALL.tl-0.4; if(z>FALL.lipZ) t-=(z-FALL.lipZ)*FALL.slope;
    y=Math.min(y,t,baseHeightRaw(FALL.x,z)-0.3); P.push([z,y]); }
  return _fallP=P;
}
function fallY(z){ const P=fallProfile(), i=clamp((z-P[0][0])/2,0,P.length-1.001), k=Math.floor(i); return lerp(P[k][1],P[k+1][1],i-k); }
function fallCut(h,x,z){
  if(x<FALL.x-45||x>FALL.x+50||z<FALL.tz-30||z>FALL.pool.z+30) return h;
  { const d=Math.hypot(x-FALL.tx,z-FALL.tz);   // the tarn: a bowl, with a low rim all round
    if(d<FALL.tr+8){ h=lerp(h,Math.max(h,FALL.tl+0.8),smoothstep(FALL.tr+7,FALL.tr+3,d)); h=lerp(h,FALL.tl-1.6,smoothstep(FALL.tr,FALL.tr*0.55,d)); } }
  if(z>FALL.tz+FALL.tr-8&&z<FALL.baseZ+6){ const dx=Math.abs(x-FALL.x), y=fallY(Math.min(z,FALL.baseZ));   // the chute: a slot cut to the fall's path
    h=lerp(h,Math.min(h,y-0.2),smoothstep(FALL.w+7,FALL.w,dx)); }
  { const d=Math.hypot(x-FALL.x,z-FALL.pool.z); if(d<FALL.pool.r+8) h=lerp(h,Math.min(h,-3.4),smoothstep(FALL.pool.r,FALL.pool.r*0.45,d)); }   // the plunge pool
  return h;
}
function baseHeight(x,z){ return pvpIsleCut(x,z,waGround(x,z)); }   // (pvp: the Proving Isle's moat and island over the atlas's ground)   // the atlas's ground (shared/world-atlas-ground.js); baseHeightRaw below is the old frame's ground, kept for the content modules that still read it (the Greyfall's fall profile)
function riverBase(z){ return Math.sin(z*0.011+0.6)*34 + noise2(z*0.006,7.7)*24 + noise2(z*0.021+3.7,2.9)*6 + 28; }
const RIVER_SIDE=Math.sign(riverBase(0))||1;
// the river bends around the middle of the map so the village has room there
function riverX(z){ const b=riverBase(z), w=Math.exp(-Math.pow(z/75,2)); return b+RIVER_SIDE*Math.max(0,62-RIVER_SIDE*b)*w; }
// lakes of the home forest and the vale: the atlas's (WA_LAKES; the Reach's frozen lakes are FROST_LAKES): Mistmere in the home forest's west (zone 10), the vale's Mirror Pond (zone 20, south) and Crane Lake (zone 22, east)
const LAKE_NAMES={10:'Mistmere',20:'Mirror Pond',22:'Crane Lake'};
const LAKES=WA_LAKES.filter(L=>L.land==='home'||L.land==='vale').map(L=>({x:L.x,z:L.z,r:L.r,name:LAKE_NAMES[L.zone]||'The lake',vale:L.land==='vale'}));
function lakeCut(x,z,h){
  for(const L of LAKES){ const lx=x-L.x, lz=z-L.z; if(Math.abs(lx)>L.r*2.6||Math.abs(lz)>L.r*2.6) continue;
    const ld=Math.sqrt(lx*lx+lz*lz) + noise2(x*0.05+L.x,z*0.05)*6;
    // a bowl: the ground round a lake may rise only gently from its shore (the eroded hills would otherwise leave a lake little more than a puddle)
    h = lerp(h, Math.min(h, 0.9+Math.max(0,ld-L.r*0.72)*0.32), smoothstep(L.r*2.6, L.r*1.2, ld));
    h = lerp(h, Math.min(h,-2.6), smoothstep(L.r, L.r*0.42, ld)); }
  return h;
}
/* The Proving Isle (docs/PVP.md): a round island offshore of the home forest's south beach (the atlas's WA_PVP: it sits in the sea, one plank bridge from the beach), where players fight each other with fixed stats
   (shared/pvp.js has the rules). It lives here because roads.js needs its ground at load. x, z: the island's centre (the atlas's); r: the island's grass, to where the beach starts; lakeR: the deep moat's outer edge
   (the water is -2.6 m from 0.82 lakeR in, so nobody wades across; the bridge crosses it); h: the top. baseHeight lays the island and its moat over the atlas's ground (pvpIsleCut). */
const PVP_ISLE={x:WA_PVP.x,z:WA_PVP.z,r:33,lakeR:62,h:2.3,name:'The Proving Isle'};
// the lake and the island: banks that ease down to the water, a flat floor, and the island with a beach (d: distance from the centre, with a wobbling shore)
function pvpIsleCut(x,z,h){
  const I=PVP_ISLE, lx=x-I.x, lz=z-I.z; if(Math.abs(lx)>I.lakeR+32||Math.abs(lz)>I.lakeR+32) return h;
  const d=Math.sqrt(lx*lx+lz*lz)+noise2(x*0.05+I.x,z*0.05)*3;
  h=lerp(h,Math.min(h,0.7+Math.max(0,d-I.lakeR)*0.3),smoothstep(I.lakeR+30,I.lakeR+2,d));
  h=lerp(h,Math.min(h,-2.6),smoothstep(I.lakeR,I.lakeR*0.82,d));
  return lerp(h,I.h-Math.pow(d/I.r,2)*0.9+noise2(x*0.09,z*0.09)*0.2,smoothstep(I.r+11,I.r-5,d));   // (the top is a little dome with a faint ripple; below ~0.3 m it is beach, then the lake floor)
}
/* ---------- the edges of the two lands (docs/WORLD.md) ----------
   Each side of the playable rectangle faces its real neighbour on the map of Eldmere:
   home forest: north the Greyspine's foothills (snow on top; the Greyspine itself lies beyond their crest), west the Sunwall (red cliffs up to the Sunscar plateau,
   broken only by Redgate Canyon, choked by a rock fall), south the Crownsea's shore, east the Vale Wall (the tunnel);
   the vale: west the Vale Wall, north the climb to the Hoarfrost Reach, south and east the Crownsea's shore.
   The lands beyond (low-poly placeholders) are drawn by game/world/far-lands.js.
   None of these lines is straight: the shore has bays up to ~28 m deep (and a rounded corner in the vale's south-east),
   the Sunwall's cliff line wanders +-22 m (sunwallLine), and the northern rims start up to 40 m early (rimWobble). */
const SUNWALL_H=52, REDGATE_Z=40;
// distance to this land's sea edge: bays, small wiggles, the vale's corner rounded (a soft minimum of its two shores)
function coastDist(x,z){ return waCoast(x,z)+21; }   // the atlas's coast: metres inland of the waterline + 21 (the water line is near c = 21, as shore() and everything that reads c expects)
// how far in from the forest's west edge (HX0) the Sunwall's cliff stands (its middle), and how much earlier a northern rim starts to rise
const sunwallLine=z=>52+noise2(z*0.006+1.3,3.3)*22;
const rimWobble=(x,s)=>(noise2(x*0.005+s,0.7)*0.5+0.5)*40;
/* the shore: land eases down to a ~20 m beach (c 22-40), then under the sea (the water line is near c = 21; you can wade to
   about c = 19). keep: how much a mountain rim resists it (a crest on the coast stays a headland). wide: metres added to the 46 m
   the ground takes to come down to the beach, for the high lands whose coast would be a cliff otherwise (the Reach's 50 m plateau, the Greyspine) */
function shore(h,c,keep,wide){
  const k=1-keep, w=wide||0; if(k<=0||c>=80+w) return h;
  h=lerp(h,1.2+clamp((c-22)/40)*2.2,smoothstep(80+w,34,c)*k);
  return lerp(h,-5,smoothstep(28,6,c)*k);
}
/* the Sunwall: a scree slope, then a cliff (about 16 m wide) up to the flat plateau at SUNWALL_H, along sunwallLine.
   Redgate Canyon cuts through it at z = REDGATE_Z: a floor climbing west to the Sunscar's plateau, shut by a rock fall (SUN_RED) until the sand wyrm falls */
const REDGATE_CL=sunwallLine(REDGATE_Z);
function sunwall(x,z,h,eW){
  const cl=sunwallLine(z); if(eW>=cl+70) return h;
  h+=smoothstep(cl+68,cl+8,eW)*5;
  const top=SUNWALL_H+noise2(x*0.03,z*0.03)*2.5, cliff=smoothstep(cl+8+noise2(z*0.02,3.3)*4,cl-8,eW);
  h=lerp(h,lerp(Math.max(h,top),top,smoothstep(-4,-60,eW)),cliff);   // (west of the forest's edge the plateau goes on, and flattens: the Sunscar's, not built)
  const dz=Math.abs(z-REDGATE_Z), c0=REDGATE_CL;
  if(dz<16&&eW<c0+48){ const floor=4+Math.max(0,c0+38-eW)*0.22; h=lerp(h,Math.min(h,floor),smoothstep(16,7,dz)); }   // (the rock fall that choked it is a thing of its own now: SUN_RED, shared/sunland.js, opened by the sand wyrm)
  return h;
}
// no trees or bushes on the beach, on the Sunwall's face and plateau, or in Redgate Canyon
function bareGround(x,z){ return coastDist(x,z)<38 || (x<HALF && (x-HX0<sunwallLine(z)+10 || (x-HX0<REDGATE_CL+43&&Math.abs(z-REDGATE_Z)<14))); }
// the border mountains between the two lands are one range: the forest's rim rises to its crest at x = HALF,
// the vale's own rim climbs from the other side, and the two meet there
function baseHeightRaw(x,z){
  const bz=borderZ(x);
  if(x<GW0-70&&z>=bz-4) return -5;   // gloamhorn: the sea west of the Sunscar's coast (the world grew west for the peninsula, and its south is open water)
  if(z>=bz-4){   // south of the north wall's crest (and 4 m over it): the home forest, the vale east of the river, and the Sunscar's plateau west of the Sunwall
    const bx=borderX(z);
    if(x>=bx+4) return valeHeight(x,z);
    return x>bx-4?lerp(homeHeight(x,z),valeHeight(x,z),(x-bx+4)/8):homeHeight(x,z);
  }
  // north of the crest: the Greyspine (shared/greyspine.js) west of the Greyspine | Reach wall (borderXN), the Hoarfrost Reach east of it. Over the forest the rim goes on as a crest at borderZ and eases
  // down onto the Greyspine or the Reach over ~66 m; over the vale the vale's own ground (valeHeight) does it; beside the wall (x within 4 m of the crest line) the two lands are blended
  const bn=borderXN(z), reach=x>bn-4&&(x>borderX(z)+4||z<bz-70)?valeHeight(x,z):x>bn-4?lerp(homeHeight(x,z),valeHeight(x,z),smoothstep(bz-4,bz-70,z)):0;
  if(x>=bn+4) return reach;
  if(z<bz-70) return x>bn-4?lerp(greyspineHeight(x,z),reach,(x-bn+4)/8):greyspineHeight(x,z);
  if(x>bn-4) return lerp(lerp(homeHeight(x,z),greyspineHeight(x,z),smoothstep(bz-4,bz-70,z)),reach,(x-bn+4)/8);
  return lerp(homeHeight(x,z),greyspineHeight(x,z),smoothstep(bz-4,bz-70,z));
}
/* ---------- the Hoarfrost Reach: a high frozen plateau (docs/WORLD.md) ----------
   Its ground is ~50 m up (the vale's is 10-30 m), rolling in broad white domes, with frozen lakes (flat ice: walkable, no water). South,
   the vale's north rim goes on north of its crest at HZ0 and eases down to the plateau over ~60 m (only the pass through it is low,
   shared/hoarfrost.js); west the Vale Wall goes on; north and east it comes down to the sea (a coast with bays and islets, shared/coasts.js). */
const FROST_LAKES=[{x:790+RDX,z:-742,r:46,name:'Frostmere'},{x:585+RDX,z:-850,r:30,name:'Mirrorice'},{x:905+RDX,z:-812,r:26,name:'Blue Tarn'}];
const hoarBase=(x,z)=>50+erodeFbm(x*0.0055+13.7,z*0.0055-4.1,5,0.2)*19+Math.pow(1-Math.abs(noise2(x*0.011+61,z*0.011-9)),2)*5+noise2(x*0.06,z*0.06)*0.4;
function iceLevel(L){ return hoarBase(L.x,L.z)-1.6; }
// distance to the nearest frozen lake's edge (negative inside); the ice sheet itself is flat
function iceDist(x,z){ let m=1e9; for(const L of FROST_LAKES){ const d=Math.hypot(x-L.x,z-L.z)-L.r+noise2(x*0.05+L.x,z*0.05)*4; if(d<m) m=d; } return m; }
function hoarHeight(x,z){
  let h=hoarBase(x,z);
  for(const L of FROST_LAKES){ const lx=x-L.x, lz=z-L.z; if(Math.abs(lx)>L.r+14||Math.abs(lz)>L.r+14) continue;
    const ld=Math.sqrt(lx*lx+lz*lz)+noise2(x*0.05+L.x,z*0.05)*4; h=lerp(h,iceLevel(L),smoothstep(L.r+6,L.r-3,ld)); }
  const bx=borderXN(z), dxw=Math.abs(x-bx), f=dxw<250?fbm(x*0.02,z*0.02,3)*0.5+0.5:0, cr=dxw<130?crest(x,z):0;
  h+=wallAdd(dxw,z,1,46,14,20,f,cr);    // the Greyspine | Reach wall
  return h;   // (north and east the plateau runs down to the sea: valeHeight puts the shore on it)
}
// the Sakura Vale: softer rolling hills and ponds, no river. It is also the ground of the Hoarfrost Reach's south edge and, past the north wall's crest, of the Reach itself (eased onto the plateau)
function valeHeight(x,z){
  const bz=borderZ(x), bs=borderX(z), c=coastDist(x,z);
  if(c<-8&&(z<bz||x-bs>46)&&csHold(x,z)===0) return -5;   // open sea, away from the river's mouth: shore() would say -5 after all the work below (most of the world's rectangle east and north of the lands is this)
  let h = hillShape(x,z,HILL_VALE);
  h = lakeCut(x,z,h);
  const bn=borderXN(z), dxw=Math.abs(x-bs), dxn=Math.abs(x-bn), dnv=z-bz-rimWobble(x,23), nearW=dxw<250||dxn<250||dnv<250, f=nearW?fbm(x*0.02,z*0.02,3)*0.5+0.5:0, cr=(dxw<130||dxn<130||dnv<134)?crest(x,z):0;
  h += wallAdd(dxw,z,1,48,14,20,f,cr)*smoothstep(bz-60,bz+10,z);   // the Vale Wall (it ends in the north wall's crest)
  h += wallAdd(dxn,z,1,48,14,20,f,cr)*smoothstep(bz+10,bz-60,z);   // the Greyspine | Reach wall's east side (north of the north wall's crest only)
  h += wallAdd(dnv,x,3,58,18,22,f,cr);   // up to the crest along borderZ (the Hoarfrost Reach's south wall)
  h = riverCut(h,dxw,z);   // (the Vale Wall is a river along most of its length)
  { const ci=csIslandMax(x,z); if(ci>30) h=Math.max(h,lerp(1.6,7,smoothstep(30,80,ci))); }   // (a big island has no ponds: its ground is at least a beach, 7 m in the middle)
  if(z<bz-2) h=lerp(h,hoarHeight(x,z),smoothstep(bz-2,bz-62,z));   // past the crest it eases down onto the plateau
  const nth=smoothstep(bz+10,bz-30,z), bw=z<bz?bn:bs;   // (nth: in the Reach, where a crest running into the sea goes under it: its keep fades out over the last 64 m to the water; bw: the wall beside this ground, the Greyspine's in the Reach)
  return shore(h, c, Math.max(smoothstep(46,14,x-bw)*lerp(1,smoothstep(12,64,c),nth),csHold(x,z)), csWide(x,z,lerp(24,60,smoothstep(70,0,x-bw))*smoothstep(bz,bz-120,z)));   // (the Reach, 50 m up, takes a little longer to come down to its coast, and much longer in a bay; by its west wall the Greyspine's 60 m, so the two lands meet without a step)
}
/* the hills' shape, shared by the home forest and the vale: fbm bent by a slow domain warp (so ridges and valleys meander instead of sitting
   in round blobs) and eroded (erodeFbm: smooth flanks, detail kept in the hollows), a ridged term for crests, and a fine relief of 8-16 m
   wavelength that is strongest on the flats (the server's grid is 4 m, the client's 2 m: nothing finer than this is put in the shared height) */
const HILL_HOME={f:0.0042,ox:3.1,oz:-1.7,amp:32,base:8,rf:0.011,rox:40,roz:-17,ramp:6,mic:0.45};
const HILL_VALE={f:0.0048,ox:-7.3,oz:2.9,amp:25,base:9,rf:0.013,rox:-21,roz:33,ramp:7,mic:0.4};
function hillShape(x,z,o){
  const wx=x+noise2(x*0.0029+7.1,z*0.0029-3.7)*42, wz=z+noise2(x*0.0029-11.3,z*0.0029+5.3)*42;
  let h=erodeFbm(wx*o.f+o.ox,wz*o.f+o.oz,6,0.22)*o.amp+o.base;
  const r=1-Math.abs(noise2(wx*o.rf+o.rox,wz*o.rf+o.roz)); h+=r*r*o.ramp-2;
  h+=noise2(x*0.06,z*0.06)*o.mic+erodeFbm(x*0.075+9,z*0.075-4,2,0.5)*0.55;
  return h;
}
// ridged multifractal (0..~1): sharp crests with valleys between, for mountain walls and the Greyspine
function ridged(x,z,oct){
  let v=0, a=0.5, f=1, w=1;
  for(let k=0;k<oct;k++){ let n=1-Math.abs(noise2(x*f+k*5.3,z*f-k*3.1)); n*=n; n*=w; w=clamp(n*2,0,1); v+=n*a; a*=0.5; f*=2.03; }
  return v;
}
const crest=(x,z)=>ridged(x*0.021+5,z*0.021-8,3);   // the jagged top of the border mountains
function homeHeight(x,z){
  let h = hillShape(x,z,HILL_HOME);
  const d = Math.abs(x - riverX(z)) + noise2(x*0.05+3.3,z*0.05-1.9)*2.2;   // (the banks are not straight)
  h = lerp(h, h*0.35 + 2.2, smoothstep(70, 12, d));
  h = lerp(h, -1.7, smoothstep(11, 2.5, d));
  h = lakeCut(x,z,h);
  h = pvpIsleCut(x,z,h);   // pvp: the Proving Isle's lake and island
  const bx=borderX(z), bz=borderZ(x), dn=z-bz-rimWobble(x,11), f=(Math.abs(bx-x)<250||dn<250)?fbm(x*0.02,z*0.02,3)*0.5+0.5:0;
  const cr=(Math.abs(bx-x)<130||dn<134)?crest(x,z):0;
  h += wallAdd(Math.abs(bx-x),z,1,48,14,20,f,cr)*smoothstep(bz-60,bz+10,z);   // the Vale Wall (it ends in the north wall's crest)
  const wN=wallAdd(dn,x,3,62,18,22,f,cr); h += wN;   // the foothills of the Greyspine and the Reach (wN: the Sunscar's north wall is this term on its plateau)
  h = riverCut(h,Math.abs(bx-x),z);   // (the Vale Wall is a river along most of its length)
  h = sunwall(x,z,h,x-HX0);   // (west of HX0 the Sunwall's top goes on: the Sunscar's plateau)
  if(x<HX0-12) h = sunHook(x,z,h,wN);   // sunscar: the fifth land's ground (shared/sunland.js: mesas, dunes, pans, glass, the Bowl, the river)
  h = lerp(h,-4,smoothstep(GW0+80,GW0+12,x));
  return shore(h, coastDist(x,z), Math.max(smoothstep(46,14,bx-x), smoothstep(PVP_ISLE.lakeR+14,PVP_ISLE.lakeR-2,Math.hypot(x-PVP_ISLE.x,z-PVP_ISLE.z))), x<HX0?60*smoothstep(HX0-12,HX0-72,x):0);   // (the Sunscar's coast eases down over a longer slope: wide)   // (the Proving Isle's lake lies on the south beach: shore() must not level its bowl)
}
function forestDensity(x,z){ return clamp(fbm(x*0.0085+31, z*0.0085-12, 3)*1.5 + 0.5 + noise2(x*0.03,z*0.03)*0.15); }
function autumnAmt(x,z){ return smoothstep(0.3,0.65,noise2(x*0.013+90, z*0.013-40))*0.85; }
