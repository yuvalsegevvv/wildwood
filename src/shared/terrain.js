//@ Map size (SIZE, HALF, WATER), river (riverX), baseHeight, forestDensity, autumnAmt. Pure.
/* ---------- world shape ---------- */
const SIZE=880, HALF=SIZE/2, AREA=(SIZE/360)*(SIZE/360), WATER=0;
function riverBase(z){ return Math.sin(z*0.011+0.6)*34 + noise2(z*0.006,7.7)*24 + 28; }
const RIVER_SIDE=Math.sign(riverBase(0))||1;
// the river bends around the middle of the map so the village has room there
function riverX(z){ const b=riverBase(z), w=Math.exp(-Math.pow(z/75,2)); return b+RIVER_SIDE*Math.max(0,62-RIVER_SIDE*b)*w; }
// lakes: the still water by the village, a big lake in the far west and a pond out east
const LAKES=[{x:-75,z:65,r:36,name:'Still Water'},{x:-250,z:-180,r:48,name:'Greywater Lake'},{x:235,z:215,r:30,name:'Heron Pond'}];
function baseHeight(x,z){
  let h = fbm(x*0.0042+3.1, z*0.0042-1.7, 5)*26 + 8;
  const r = 1-Math.abs(noise2(x*0.011+40, z*0.011-17)); h += r*r*6 - 2;
  h += noise2(x*0.06, z*0.06)*0.45;
  const d = Math.abs(x - riverX(z));
  h = lerp(h, h*0.35 + 2.2, smoothstep(70, 12, d));
  h = lerp(h, -1.7, smoothstep(11, 2.5, d));
  for(const L of LAKES){ const lx=x-L.x, lz=z-L.z, ld=Math.sqrt(lx*lx+lz*lz) + noise2(x*0.05+L.x,z*0.05)*6;
    h = lerp(h, Math.min(h,-2.6), smoothstep(L.r, L.r*0.42, ld)); }
  const e = Math.max(Math.abs(x), Math.abs(z));
  const rim = smoothstep(HALF-62, HALF-4, e);
  h += rim*rim*48 + rim*(fbm(x*0.02,z*0.02,3)*0.5+0.5)*14;
  return h;
}
function forestDensity(x,z){ return clamp(fbm(x*0.0085+31, z*0.0085-12, 3)*1.5 + 0.5 + noise2(x*0.03,z*0.03)*0.15); }
function autumnAmt(x,z){ return smoothstep(0.3,0.65,noise2(x*0.013+90, z*0.013-40))*0.85; }
