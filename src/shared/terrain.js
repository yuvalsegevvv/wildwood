//@ Map size (SIZE, HALF, WATER; the whole world WX0..WX1 x WZ0..WZ1 with the Sakura Vale east and the Hoarfrost Reach north of it), river (riverX), the lands' edges (coast, the Sunwall and Redgate, snowy rims), baseHeight, forestDensity, autumnAmt. Pure.
/* ---------- world shape ---------- */
const SIZE=880, HALF=SIZE/2, WATER=0;
/* The home forest is the square -HALF..HALF. East of its border mountains lies the Sakura Vale (EAST_W wide),
   reached through the tunnel in shared/vale.js. North of the vale, over its crest at z = HZ0 (the old north edge of both lands),
   lies the Hoarfrost Reach, a high frozen plateau NORTH_D deep (shared/hoarfrost.js); what is left of the rectangle north of the
   home forest is the Greyspine's mountains, which nobody can walk to. The whole world is the rectangle WX0..WX1 x WZ0..WZ1. */
const NORTH_D=600, HZ0=-HALF;
const EAST_W=550, WX0=-HALF, WX1=HALF+EAST_W, WZ0=HZ0-NORTH_D, WZ1=HALF, WW=WX1-WX0, WD=WZ1-WZ0;
const inVale=x=>x>HALF;   // east of the border mountains: the Sakura Vale and, past its north crest, the Hoarfrost Reach
const inHoar=(x,z)=>x>HALF&&z<HZ0;
function riverBase(z){ return Math.sin(z*0.011+0.6)*34 + noise2(z*0.006,7.7)*24 + 28; }
const RIVER_SIDE=Math.sign(riverBase(0))||1;
// the river bends around the middle of the map so the village has room there
function riverX(z){ const b=riverBase(z), w=Math.exp(-Math.pow(z/75,2)); return b+RIVER_SIDE*Math.max(0,62-RIVER_SIDE*b)*w; }
// lakes: the still water by the village, a big lake in the far west and a pond out east
const LAKES=[{x:-75,z:65,r:36,name:'Still Water'},{x:-250,z:-180,r:48,name:'Mistmere'},{x:235,z:215,r:30,name:'Heron Pond'},
  {x:770,z:40,r:30,name:'Mirror Pond',vale:true},{x:860,z:-250,r:26,name:'Crane Lake',vale:true}];
function lakeCut(x,z,h){
  for(const L of LAKES){ const lx=x-L.x, lz=z-L.z; if(Math.abs(lx)>L.r+8||Math.abs(lz)>L.r+8) continue;
    const ld=Math.sqrt(lx*lx+lz*lz) + noise2(x*0.05+L.x,z*0.05)*6;
    h = lerp(h, Math.min(h,-2.6), smoothstep(L.r, L.r*0.42, ld)); }
  return h;
}
/* ---------- the edges of the two lands (docs/WORLD.md) ----------
   Each side of the playable rectangle faces its real neighbour on the map of Eldmere:
   home forest: north the Greyspine's foothills (snow on top), west the Sunwall (red cliffs up to the Sunscar plateau,
   broken only by Redgate Canyon, choked by a rock fall), south the Crownsea's shore, east the Vale Wall (the tunnel);
   the vale: west the Vale Wall, north the climb to the Hoarfrost Reach, south and east the Crownsea's shore.
   The lands beyond (low-poly placeholders) are drawn by game/world/far-lands.js.
   None of these lines is straight: the shore has bays up to ~28 m deep (and a rounded corner in the vale's south-east),
   the Sunwall's cliff line wanders +-22 m (sunwallLine), and the northern rims start up to 40 m early (rimWobble). */
const SUNWALL_H=52, REDGATE_Z=40;
// distance to this land's sea edge: bays, small wiggles, the vale's corner rounded (a soft minimum of its two shores)
function coastDist(x,z){
  let e=WZ1-z;
  if(x>HALF){ const a=WZ1-z, b=WX1-x, k=18; e=-k*Math.log(Math.exp(-a/k)+Math.exp(-b/k)); }
  return e+noise2(x*0.011+17,z*0.011-29)*10-(noise2(x*0.0045+5,z*0.0045-7)*0.5+0.5)*28;
}
// how far in from the west edge the Sunwall's cliff stands (its middle), and how much earlier a northern rim starts to rise
const sunwallLine=z=>52+noise2(z*0.006+1.3,3.3)*22;
const rimWobble=(x,s)=>(noise2(x*0.005+s,0.7)*0.5+0.5)*40;
/* the shore: land eases down to a ~20 m beach (c 22-40), then under the sea (the water line is near c = 21; you can wade to
   about c = 19). keep: how much a mountain rim resists it (the Vale Wall ends in sea cliffs) */
function shore(h,c,keep){
  const k=1-keep; if(k<=0||c>=80) return h;
  h=lerp(h,1.2+clamp((c-22)/40)*2.2,smoothstep(80,34,c)*k);
  return lerp(h,-5,smoothstep(28,6,c)*k);
}
/* the Sunwall: a scree slope, then a cliff (about 16 m wide) up to the flat plateau at SUNWALL_H, along sunwallLine.
   Redgate Canyon cuts through it at z = REDGATE_Z: a floor climbing west, blocked by a rock fall inside the wall */
const REDGATE_CL=sunwallLine(REDGATE_Z);
function sunwall(x,z,h,eW){
  const cl=sunwallLine(z); if(eW>=cl+70) return h;
  h+=smoothstep(cl+68,cl+8,eW)*5;
  const top=SUNWALL_H+noise2(x*0.03,z*0.03)*2.5, cliff=smoothstep(cl+8+noise2(z*0.02,3.3)*4,cl-8,eW);
  h=lerp(h,Math.max(h,top),cliff);
  const dz=Math.abs(z-REDGATE_Z), c0=REDGATE_CL;
  if(dz<16&&eW<c0+48){ const floor=4+Math.max(0,c0+38-eW)*0.22+13*Math.exp(-Math.pow((eW-c0+8)/6,2))*(0.8+0.4*(noise2(z*0.3,eW*0.3)*0.5+0.5)); h=lerp(h,Math.min(h,floor),smoothstep(16,7,dz)); }
  return h;
}
// no trees or bushes on the beach, on the Sunwall's face and plateau, or in Redgate Canyon
function bareGround(x,z){ return coastDist(x,z)<38 || (x<HALF && (x-WX0<sunwallLine(z)+10 || (x-WX0<REDGATE_CL+43&&Math.abs(z-REDGATE_Z)<14))); }
// the border mountains between the two lands are one range: the forest's rim rises to its crest at x = HALF,
// the vale's own rim climbs from the other side, and the two meet there
function baseHeight(x,z){
  if(z<HZ0-96&&x<HALF-4) return greyspineHeight(x,z);   // the mountains north of the home forest: cheap, nobody walks there
  if(x>=HALF+4) return valeHeight(x,z);
  if(x>HALF-4) return lerp(homeHeight(x,z),valeHeight(x,z),(x-HALF+4)/8);
  return z<HZ0-36?lerp(homeHeight(x,z),greyspineHeight(x,z),smoothstep(HZ0-36,HZ0-96,z)):homeHeight(x,z);
}
// the Greyspine north of the home forest: the forest's rim goes on as a ridge and climbs (z < HZ0 - 96 is only this)
function greyspineHeight(x,z){ return 70+fbm(x*0.0045+3.1,z*0.0045-1.7,3)*38+Math.max(0,noise2(x*0.011,z*0.011))*26; }
/* ---------- the Hoarfrost Reach: a high frozen plateau (docs/WORLD.md) ----------
   Its ground is ~50 m up (the vale's is 10-30 m), rolling in broad white domes, with frozen lakes (flat ice: walkable, no water). South,
   the vale's north rim goes on north of its crest at HZ0 and eases down to the plateau over ~60 m (only the pass through it is low,
   shared/hoarfrost.js); west the Vale Wall goes on; north a glacier wall; east the ice ends in sea cliffs (you stop 14 m short of the edge). */
const FROST_LAKES=[{x:790,z:-742,r:46,name:'Frostmere'},{x:585,z:-850,r:30,name:'Mirrorice'},{x:905,z:-812,r:26,name:'Blue Tarn'}];
const hoarBase=(x,z)=>50+fbm(x*0.0055+13.7,z*0.0055-4.1,4)*15+Math.pow(1-Math.abs(noise2(x*0.011+61,z*0.011-9)),2)*5+noise2(x*0.06,z*0.06)*0.4;
function iceLevel(L){ return hoarBase(L.x,L.z)-1.6; }
// distance to the nearest frozen lake's edge (negative inside); the ice sheet itself is flat
function iceDist(x,z){ let m=1e9; for(const L of FROST_LAKES){ const d=Math.hypot(x-L.x,z-L.z)-L.r+noise2(x*0.05+L.x,z*0.05)*4; if(d<m) m=d; } return m; }
function hoarHeight(x,z){
  let h=hoarBase(x,z);
  for(const L of FROST_LAKES){ const lx=x-L.x, lz=z-L.z; if(Math.abs(lx)>L.r+14||Math.abs(lz)>L.r+14) continue;
    const ld=Math.sqrt(lx*lx+lz*lz)+noise2(x*0.05+L.x,z*0.05)*4; h=lerp(h,iceLevel(L),smoothstep(L.r+6,L.r-3,ld)); }
  const f=fbm(x*0.02,z*0.02,3)*0.5+0.5, rw=smoothstep(62,4,x-HALF), rn=smoothstep(62,4,z-WZ0-rimWobble(x,31));
  h+=rw*rw*46+rw*f*14;    // the Vale Wall goes on
  h+=rn*rn*46+rn*f*16;    // the glacier wall in the north
  return lerp(h,-9,smoothstep(18,-10,WX1-x+noise2(z*0.02,4.1)*5));   // the east: sea cliffs (flat until 18 m short of the edge, where you stop 14 m short)
}
// the Sakura Vale: softer rolling hills and ponds, no river
function valeHeight(x,z){
  let h = fbm(x*0.0048-7.3, z*0.0048+2.9, 5)*20 + 9;
  const r = 1-Math.abs(noise2(x*0.013-21, z*0.013+33)); h += r*r*7 - 2;
  h += noise2(x*0.06, z*0.06)*0.4;
  h = lakeCut(x,z,h);
  const f=fbm(x*0.02,z*0.02,3)*0.5+0.5, rw=smoothstep(62,4,x-HALF), rn=smoothstep(62,4,z-HZ0-rimWobble(x,23));
  h += rw*rw*48 + rw*f*14;   // the Vale Wall
  h += rn*rn*58 + rn*f*18;   // up to the crest at HZ0 (the Hoarfrost Reach's south wall)
  if(z<HZ0-2) return lerp(h,hoarHeight(x,z),smoothstep(HZ0-2,HZ0-62,z));   // past the crest it eases down onto the plateau
  return shore(h, coastDist(x,z), smoothstep(46,14,x-HALF));
}
function homeHeight(x,z){
  let h = fbm(x*0.0042+3.1, z*0.0042-1.7, 5)*26 + 8;
  const r = 1-Math.abs(noise2(x*0.011+40, z*0.011-17)); h += r*r*6 - 2;
  h += noise2(x*0.06, z*0.06)*0.45;
  const d = Math.abs(x - riverX(z));
  h = lerp(h, h*0.35 + 2.2, smoothstep(70, 12, d));
  h = lerp(h, -1.7, smoothstep(11, 2.5, d));
  h = lakeCut(x,z,h);
  const f=fbm(x*0.02,z*0.02,3)*0.5+0.5, re=smoothstep(62,4,HALF-x), rn=smoothstep(66,4,z-HZ0-rimWobble(x,11));
  h += re*re*48 + re*f*14;   // the Vale Wall
  h += rn*rn*62 + rn*f*18;   // the Greyspine's foothills
  h = sunwall(x,z,h,x-WX0);
  return shore(h, coastDist(x,z), smoothstep(46,14,HALF-x));
}
function forestDensity(x,z){ return clamp(fbm(x*0.0085+31, z*0.0085-12, 3)*1.5 + 0.5 + noise2(x*0.03,z*0.03)*0.15); }
function autumnAmt(x,z){ return smoothstep(0.3,0.65,noise2(x*0.013+90, z*0.013-40))*0.85; }
