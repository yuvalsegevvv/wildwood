//@ Map size (SIZE, HALF, WATER; the whole world WX0..WX1 with the Sakura Vale east), river (riverX), baseHeight, forestDensity, autumnAmt. Pure.
/* ---------- world shape ---------- */
const SIZE=880, HALF=SIZE/2, AREA=(SIZE/360)*(SIZE/360), WATER=0;
/* The home forest is the square -HALF..HALF. East of its border mountains lies the Sakura Vale (EAST_W wide),
   reached through the tunnel in shared/vale.js. The whole world is the rectangle WX0..WX1 x WZ0..WZ1. */
const EAST_W=550, WX0=-HALF, WX1=HALF+EAST_W, WZ0=-HALF, WZ1=HALF, WW=WX1-WX0, WD=WZ1-WZ0;
const inVale=x=>x>HALF;
function riverBase(z){ return Math.sin(z*0.011+0.6)*34 + noise2(z*0.006,7.7)*24 + 28; }
const RIVER_SIDE=Math.sign(riverBase(0))||1;
// the river bends around the middle of the map so the village has room there
function riverX(z){ const b=riverBase(z), w=Math.exp(-Math.pow(z/75,2)); return b+RIVER_SIDE*Math.max(0,62-RIVER_SIDE*b)*w; }
// lakes: the still water by the village, a big lake in the far west and a pond out east
const LAKES=[{x:-75,z:65,r:36,name:'Still Water'},{x:-250,z:-180,r:48,name:'Greywater Lake'},{x:235,z:215,r:30,name:'Heron Pond'},
  {x:770,z:40,r:30,name:'Mirror Pond',vale:true},{x:860,z:-250,r:26,name:'Crane Lake',vale:true}];
function lakeCut(x,z,h){
  for(const L of LAKES){ const lx=x-L.x, lz=z-L.z; if(Math.abs(lx)>L.r+8||Math.abs(lz)>L.r+8) continue;
    const ld=Math.sqrt(lx*lx+lz*lz) + noise2(x*0.05+L.x,z*0.05)*6;
    h = lerp(h, Math.min(h,-2.6), smoothstep(L.r, L.r*0.42, ld)); }
  return h;
}
// the border mountains between the two lands are one range: the forest's rim rises to its crest at x = HALF,
// the vale's own rim climbs from the other side, and the two meet there
function baseHeight(x,z){
  if(x>=HALF+4) return valeHeight(x,z);
  if(x>HALF-4) return lerp(homeHeight(x,z),valeHeight(x,z),(x-HALF+4)/8);
  return homeHeight(x,z);
}
// the Sakura Vale: softer rolling hills and ponds, no river
function valeHeight(x,z){
  let h = fbm(x*0.0048-7.3, z*0.0048+2.9, 5)*20 + 9;
  const r = 1-Math.abs(noise2(x*0.013-21, z*0.013+33)); h += r*r*7 - 2;
  h += noise2(x*0.06, z*0.06)*0.4;
  h = lakeCut(x,z,h);
  const e = Math.min(x-HALF, WX1-x, z-WZ0, WZ1-z);
  const rim = smoothstep(62, 4, e);
  h += rim*rim*48 + rim*(fbm(x*0.02,z*0.02,3)*0.5+0.5)*14;
  return h;
}
function homeHeight(x,z){
  let h = fbm(x*0.0042+3.1, z*0.0042-1.7, 5)*26 + 8;
  const r = 1-Math.abs(noise2(x*0.011+40, z*0.011-17)); h += r*r*6 - 2;
  h += noise2(x*0.06, z*0.06)*0.45;
  const d = Math.abs(x - riverX(z));
  h = lerp(h, h*0.35 + 2.2, smoothstep(70, 12, d));
  h = lerp(h, -1.7, smoothstep(11, 2.5, d));
  h = lakeCut(x,z,h);
  const e = Math.max(Math.abs(x), Math.abs(z));
  const rim = smoothstep(HALF-62, HALF-4, e);
  h += rim*rim*48 + rim*(fbm(x*0.02,z*0.02,3)*0.5+0.5)*14;
  return h;
}
function forestDensity(x,z){ return clamp(fbm(x*0.0085+31, z*0.0085-12, 3)*1.5 + 0.5 + noise2(x*0.03,z*0.03)*0.15); }
function autumnAmt(x,z){ return smoothstep(0.3,0.65,noise2(x*0.013+90, z*0.013-40))*0.85; }
