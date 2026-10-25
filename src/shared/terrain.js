//@ Map size (SIZE, HALF, WATER; the whole world WX0..WX1 x WZ0..WZ1 with the Sakura Vale east and the Hoarfrost Reach north of it), river (riverX), lakes, the lands' edges (coast, the Sunwall and Redgate, snowy rims), the hills' shape (hillShape: warped, eroded fbm; ridged mountains), baseHeight (where the Greyspine, shared/greyspine.js, meets the home forest's rim and the vale's wall), inGrey, forestDensity, autumnAmt. Pure.
/* ---------- world shape ---------- */
const SIZE=880, HALF=SIZE/2, WATER=0;
/* The home forest is the square -HALF..HALF. East of its border mountains lies the Sakura Vale (550 m wide: VALE_E),
   reached through the tunnel in shared/vale.js. North of the vale, over its crest at z = HZ0 (the old north edge of both lands),
   lies the Hoarfrost Reach, a high frozen plateau that runs on east and north past the vale's and the Greyspine's edges (shared/hoarfrost.js); the rest of the rectangle north of the
   home forest is the Greyspine, the fourth land (shared/greyspine.js: its terrain; no village, monsters or way in yet).
   The whole world is the rectangle WX0..WX1 x WZ0..WZ1. */
const HZ0=-HALF;
/* The north is fitted to the planned map (docs/world-map.svg, docs/WORLD.md): there the Hoarfrost Reach lies over the east half of the home forest as well as over the vale, and the Greyspine
   is north-west of the forest, not over it. So the Greyspine (all of it: ground, Highmark, zones, the Queen, the glacier valley, the gates) was moved GDX metres west, as one piece, and the Greyspine | Reach
   wall with it (borderXN, GXJ: about x = -140, over the middle of the forest); the Reach's own places (Rimehold, its zones and arenas, the lakes, the barrow's door) moved RDX west to stand
   between that wall and Frostgate Pass. The world's rectangle grew west to hold the Greyspine's far end (WX0); the forest's own west edge, the Sunwall, stays at HX0, and beyond it, south
   of the Greyspine, lies the unbuilt Sunscar's plateau (the Sunwall's top goes on: homeHeight). The Reach's north-east corner (it ran 330 m east of the vale) is sea now. */
const GDX=-580;   // (the old frame: the Greyspine was moved this far west)
/* THE WORLD FRAME is the atlas's canvas (shared/world-atlas.js, docs/world-atlas.py): x -1900..1650, z -1120..1180. Every constant above and below this line that is not WX0..WZ1 is the OLD frame,
   kept (HALF, HZ0, GDX, RDX, GLX, EAST_W, HX0, GW0, GXJ, VALE_E, GREY_N, borderX / borderXN / borderZ ...) only because the lands' content modules (villages, zones, arenas, doors, gates) are still placed in it
   until they are re-pointed to the atlas's anchors; the lands, the coast and the ground are the atlas's (landAt, inVale..., coastDist, baseHeight below). */
const HX0=-HALF, GW0=HX0+GDX, WX0=WA_META.x0, WX1=WA_META.x1, WZ0=WA_META.z0, WZ1=WA_META.z1, WW=WX1-WX0, WD=WZ1-WZ0;
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
   (ask inGloam first), inSun the Sunscar (and Amber Reach, the seventh land south of it: ask inAmber BEFORE inSun, as inGloam before inGrey). */
const inVale=(x,z)=>{ const l=waLandId(x,z); return l===1||l===2; };   // the Sakura Vale and the Hoarfrost Reach
const inHoar=(x,z)=>waLandId(x,z)===2;   // the Hoarfrost Reach
const inGrey=(x,z)=>{ const l=waLandId(x,z); return l===3||l===5; };   // the Greyspine and the Gloamhorn
const inGloam=(x,z)=>waLandId(x,z)===5;   // the Gloamhorn, the sixth land (check it BEFORE inGrey, which is true there too)
const inSun=(x,z)=>{ const l=waLandId(x,z); return l===4||l===6; };   // the Sunscar, the fifth land (and Amber Reach until the code of the Reach asks inAmber first)
const inAmber=(x,z)=>waLandId(x,z)===6;   // savanna: Amber Reach, the seventh land (shared/savanna.js; check it BEFORE inSun, which is true there too)
function baseHeight(x,z){ return pvpIsleCut(x,z,waGround(x,z)); }   // (pvp: the Proving Isle's moat and island over the atlas's ground)   // the atlas's ground (shared/world-atlas-ground.js); baseHeightRaw below is the old frame's ground, kept for the content modules that still read it (the Greyfall's fall profile)
// lakes of the home forest and the vale: the atlas's (WA_LAKES; the Reach's frozen lakes are FROST_LAKES): Mistmere in the home forest's west (zone 10), the vale's Mirror Pond (zone 20, south) and Crane Lake (zone 22, east)
const LAKE_NAMES={10:'Mistmere',20:'Mirror Pond',22:'Crane Lake'};
const LAKES=WA_LAKES.filter(L=>L.land==='home'||L.land==='vale').map(L=>({x:L.x,z:L.z,r:L.r,name:LAKE_NAMES[L.zone]||'The lake',vale:L.land==='vale'}));
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
/* ---------- the lands' edges: the atlas's coast (shared/world-atlas.js) ---------- */
function coastDist(x,z){ return waCoast(x,z)+21; }   // the atlas's coast: metres inland of the waterline + 21 (the water line is near c = 21, as shore() and everything that reads c expects)
// no trees or bushes on the beach (the atlas's coast)
function bareGround(x,z){ return coastDist(x,z)<38; }
/* ---------- the Hoarfrost Reach: a high frozen plateau (docs/WORLD.md) ----------
   Its ground is ~50 m up (the vale's is 10-30 m), rolling in broad white domes, with frozen lakes (flat ice: walkable, no water). South,
   the vale's north rim goes on north of its crest at HZ0 and eases down to the plateau over ~60 m (only the pass through it is low,
   shared/hoarfrost.js); west the Vale Wall goes on; north and east it comes down to the sea (the atlas's coast). */
const FROST_LAKES=WA_LAKES.filter(L=>L.frozen).map(L=>({x:L.x,z:L.z,r:L.r,name:L.zone===24?'Frostmere':L.zone===28?'Mirrorice':'Frozen lake'}));   // the Reach's frozen lakes, the atlas's (the first, zone 24, is the one with the hull plate)
// distance to the nearest frozen lake's edge (negative inside); the ice sheet itself is flat (the atlas bakes it, shared/world-atlas-ground.js)
function iceDist(x,z){ return waLandId(x,z)===2&&!waIsSea(x,z)?waWaterDist(x,z):1e9; }   // (the atlas's bank distance: the Reach's water is all ice; 1e9 elsewhere)
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
function forestDensity(x,z){ return clamp(fbm(x*0.0085+31, z*0.0085-12, 3)*1.5 + 0.5 + noise2(x*0.03,z*0.03)*0.15); }
function autumnAmt(x,z){ return smoothstep(0.3,0.65,noise2(x*0.013+90, z*0.013-40))*0.85; }
