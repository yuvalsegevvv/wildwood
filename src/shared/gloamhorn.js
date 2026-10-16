//@ The Gloamhorn, the sixth land (levels 30-40, docs/areas/gloamhorn.md): a narrow hooked peninsula of sea cliffs west of the Greyspine, its ground (gloamGround), coast, sea stacks, wrecks, cave mouths, the lighthouse at the tip and the reserved dungeon door. Pure.
/* Agent map: gloamGround(x,z) is called by greyspineHeight (shared/greyspine.js) for every point west of the Greyspine's west wall (x < GW0); coastDist (terrain.js) asks gloamCoast; the land
   test is inGloam(x,z) (terrain.js: x < GW0 and north of the north wall). Data: GLOAM_PTS (the spine: x, z, half-width), GLOAM_STACKS, GLOAM_WRECKS, GLOAM_CAVES, GLOAM_LIGHT (the lighthouse),
   GLOAM_DG_DOOR (the door reserved for the dungeon 'gloamvault'), gloamKeepOut (camps, nodes, plants), gloamSpine(t) (a point along the horn). Used by wraithwick.js (VIL6), gloamzones.js (zones m30..m40, the
   two arenas), game/village/buildings-gloam.js (the meshes), game/world/terrain-color-gloam.js, game/ui/map.js. Test: node tools/gloamhorn-smoke.js. Names: gloam..., GLOAM_...
   The land (docs/WORLD.md, the old Stormhorn, renamed): the Greyspine's neck pass (the rock fall GREY_GATES[1], opened by the Mountain Golem) comes out of the west wall at x = GW0 into a funnel of heath
   about 100 m wide, where Wraithwick stands, and the horn goes on west and then north-west, hooking round to a rocky tip with the lighthouse: about 1,000 m of walking, level 30 at the neck to 40 at the tip.
   Its ground is a plateau about 38 m up, rolling gently (the slope limit and the server's 4 m grid allow nothing finer than 8-16 m), ending in sheer sea cliffs: from the waterline the ground rises to the top
   within 9 m of the edge, so nobody walks down to the sea. Sea stacks stand off the coast. West of x = GW0 - 40 everything but the horn is open sea (-5). */
const GLOAM_TOP=38;
// the spine: [x, z, half-width of the land at that point]; the first point is inside the neck pass, the last at the tip
const GLOAM_PTS=[[-1000,-776,40],[-1100,-790,92],[-1200,-770,84],[-1300,-800,66],[-1390,-850,62],[-1470,-800,60],[-1560,-830,60],[-1630,-900,62],[-1650,-990,64],[-1610,-1070,70],[-1560,-1140,84]];
const GLOAM_SEG=[]; let GLOAM_LEN=0;
for(let i=0;i<GLOAM_PTS.length-1;i++){ const a=GLOAM_PTS[i], b=GLOAM_PTS[i+1], dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz); GLOAM_SEG.push({ax:a[0],az:a[1],dx,dz,len,l2:len*len,L0:GLOAM_LEN,w0:a[2],w1:b[2]}); GLOAM_LEN+=len; }
// a point along the horn: t 0 (the neck) .. 1 (the tip) -> {x, z, dx, dz (the direction of travel), w}
function gloamSpine(t){
  const L=clamp(t)*GLOAM_LEN; let s=GLOAM_SEG[GLOAM_SEG.length-1];
  for(const q of GLOAM_SEG) if(L<=q.L0+q.len){ s=q; break; }
  const u=clamp((L-s.L0)/s.len);
  return {x:s.ax+s.dx*u,z:s.az+s.dz*u,dx:s.dx/s.len,dz:s.dz/s.len,w:lerp(s.w0,s.w1,u)};
}
// the nearest point of the spine: {d, t, w, px, pz, side (+1 right of the direction of travel)}; one answer is kept (the same spot is asked about many times)
const _ga={x:1e9,z:1e9,d:1e9,t:0,w:0,px:0,pz:0,side:1};
function gloamAt(x,z){
  if(x===_ga.x&&z===_ga.z) return _ga;
  _ga.x=x; _ga.z=z;
  if(x<-1780||x>-980||z<-1300||z>-680){ _ga.d=1e9; _ga.t=0; _ga.w=40; return _ga; }
  let best=1e18, bs=null, bu=0;
  for(const s of GLOAM_SEG){
    const u=clamp(((x-s.ax)*s.dx+(z-s.az)*s.dz)/s.l2), ex=x-s.ax-u*s.dx, ez=z-s.az-u*s.dz, d2=ex*ex+ez*ez;
    if(d2<best){ best=d2; bs=s; bu=u; }
  }
  const px=bs.ax+bs.dx*bu, pz=bs.az+bs.dz*bu;
  _ga.d=Math.sqrt(best); _ga.t=(bs.L0+bu*bs.len)/GLOAM_LEN; _ga.w=lerp(bs.w0,bs.w1,bu); _ga.px=px; _ga.pz=pz;
  _ga.side=((x-px)*bs.dz-(z-pz)*bs.dx)>=0?1:-1;
  return _ga;
}
// how far inside the cliff's edge a point is (metres; negative at sea): the horn's width, bent by bays and capes of 40-120 m
function gloamIn(x,z){
  const A=gloamAt(x,z); if(A.d>150) return -999;
  return A.w+noise2(x*0.018+3,z*0.018-5)*12+noise2(x*0.05,z*0.05+9)*4-A.d;
}
// the coast as coastDist (terrain.js) reads it: metres in from the waterline plus 21
// (a sea stack counts as land: its own waterline, like an islet's in shared/coasts.js)
function gloamCoast(x,z){
  const e=gloamIn(x,z); let c=e<-60?-40:e+21;
  if(e<14&&e>-70) for(const q of GLOAM_STACKS){ const dx=x-q[0], dz=z-q[1]; if(dx*dx+dz*dz<q[2]*q[2]*6) c=Math.max(c,22+q[2]*1.1-Math.hypot(dx,dz)); }
  return c;
}
/* sea stacks: pillars of rock off the cliffs ([x, z, radius, height]); wrecks: hulls on the sea floor under the cliffs ([x, z, heading]) with their ribs and masts above the water; cave mouths: dark arches in the
   cliff face ([x, z, facing]: the direction the opening looks, out to sea). All found at load from a seeded rng along the horn, on the sea side of the spine, off the land by 20-60 m. */
const GLOAM_STACKS=[], GLOAM_WRECKS=[], GLOAM_CAVES=[];
(function gloamScatter(){
  const rng=mulberry32(60606), rr=(a,b)=>a+(b-a)*rng(), clear=(x,z,m)=>gloamIn(x,z)<-m&&GLOAM_STACKS.every(q=>Math.hypot(q[0]-x,q[1]-z)>q[2]+m);
  for(let tries=0;tries<900&&GLOAM_STACKS.length<16;tries++){
    const t=rr(0.12,0.99), S=gloamSpine(t), side=rng()<0.5?1:-1, off=S.w+rr(26,64), x=S.x+S.dz*side*off, z=S.z-S.dx*side*off, r=rr(5,12);
    if(clear(x,z,r+14)&&x>WX0+40&&z>WZ0+30) GLOAM_STACKS.push([Math.round(x),Math.round(z),Math.round(r),Math.round(rr(14,30))]);
  }
  for(let tries=0;tries<900&&GLOAM_WRECKS.length<5;tries++){
    const t=rr(0.2,0.95), S=gloamSpine(t), side=rng()<0.5?1:-1, off=S.w+rr(20,34), x=S.x+S.dz*side*off, z=S.z-S.dx*side*off;
    if(gloamIn(x,z)<-16&&GLOAM_STACKS.every(q=>Math.hypot(q[0]-x,q[1]-z)>q[2]+22)&&GLOAM_WRECKS.every(q=>Math.hypot(q[0]-x,q[1]-z)>110)&&x>WX0+40&&z>WZ0+30) GLOAM_WRECKS.push([Math.round(x),Math.round(z),Math.round(rr(0,TAU)*100)/100]);
  }
  for(let tries=0;tries<900&&GLOAM_CAVES.length<6;tries++){
    const t=rr(0.2,0.95), S=gloamSpine(t), side=rng()<0.5?1:-1, off=S.w-2, x=S.x+S.dz*side*off, z=S.z-S.dx*side*off;
    if(gloamIn(x,z)>-4&&gloamIn(x,z)<4&&GLOAM_CAVES.every(q=>Math.hypot(q[0]-x,q[1]-z)>90)) GLOAM_CAVES.push([Math.round(x),Math.round(z),Math.round(Math.atan2(S.dz*side,-S.dx*side)*100)/100]);
  }
})();
/* the lighthouse: at the tip, on the rocks. The arena of the lighthouse's horror (ARENA_M40, gloamzones.js) is its forecourt, GLOAM_LIGHT.fore metres short of the tower. */
const GLOAM_LIGHT=(()=>{ const S=gloamSpine(1), x=S.x+S.dx*16, z=S.z+S.dz*16; return {x:Math.round(x),z:Math.round(z),r:5.6,hgt:34,dx:S.dx,dz:S.dz,fore:36,name:'The Gloam Light'}; })();
/* The Drowned Captain's hold (ARENA_M35, gloamzones.js): a flat of heath on the horn's right-hand (outer) side in the middle of the walk, 12 m short of the cliff, which has three cave mouths in its foot where
   the sea comes in. GLOAM_HOLD.caves are those mouths ([x, z, facing out to sea]); they join GLOAM_CAVES. */
const GLOAM_HOLD=(()=>{
  const S=gloamSpine(0.58), side=1, nx=S.dz*side, nz=-S.dx*side, H={x:Math.round(S.x+nx*(S.w-36)),z:Math.round(S.z+nz*(S.w-36)),caves:[]};
  for(const along of [-22,0,22]){
    const bx=S.x+S.dx*along, bz=S.z+S.dz*along;
    for(let off=S.w-16;off<S.w+30;off+=0.5){ const x=bx+nx*off, z=bz+nz*off; if(gloamIn(x,z)<=0){ H.caves.push([Math.round(x),Math.round(z),Math.round(Math.atan2(nx,nz)*100)/100]); break; } }
  }
  return H;
})();
for(const c of GLOAM_HOLD.caves) GLOAM_CAVES.push(c);
/* The door reserved for the later dungeon 'gloamvault' (The Gloamvault, a level-40 boss, level-40 armour): a position and a prop only, nothing opens it yet (docs/areas/gloamhorn.md); a vault in the heath
   on the horn's outer bend, in zone m38. */
const GLOAM_DG_DOOR=(()=>{ const S=gloamSpine(0.8), x=S.x+S.dz*18, z=S.z-S.dx*18; return {id:'gloamvault',name:'The Gloamvault',x:Math.round(x),z:Math.round(z),r:12,rot:Math.round(Math.atan2(S.dz,-S.dx)*100)/100}; })();
// no camp, node or plant here: the lighthouse, its forecourt, the reserved door, the cliff's last 12 m, Wraithwick's cairn ring (m: extra margin)
function gloamKeepOut(x,z,m){
  m=m||0;
  if(Math.hypot(x-GLOAM_LIGHT.x,z-GLOAM_LIGHT.z)<GLOAM_LIGHT.r+8+m) return true;
  if(Math.hypot(x-GLOAM_DG_DOOR.x,z-GLOAM_DG_DOOR.z)<GLOAM_DG_DOOR.r+6+m) return true;
  return gloamIn(x,z)<12+m;
}
/* the ground: the plateau (GLOAM_TOP, rolling +-5 m, a little higher at the neck so it meets the pass's floor) inside the cliff's edge, the sea floor outside it, stacks standing in the sea.
   The neck's floor is GREY_GATES[1].h; the plateau eases onto it over the first 120 m. */
function gloamGround(x,z){
  const A=gloamAt(x,z);
  if(A.d>260) return -5;
  const e=A.w+noise2(x*0.018+3,z*0.018-5)*12+noise2(x*0.05,z*0.05+9)*4-A.d;
  let h;
  if(e>0){
    const top=lerp(GREY_GATES[1].h,GLOAM_TOP+fbm(x*0.011+5,z*0.011-2,2)*7+noise2(x*0.04,z*0.04)*0.6,smoothstep(0.0,0.12,A.t)),
          face=smoothstep(0,9,e);   // the cliff: the waterline to the top in 9 m
    h=top*face+noise2(x*0.09,z*0.09)*1.6*face*(1-smoothstep(9,14,e));
  } else h=-5*smoothstep(0,-16,e);
  if(e<14&&e>-70) for(const q of GLOAM_STACKS){
    const dx=x-q[0]; if(dx>q[2]*1.9||dx<-q[2]*1.9) continue;
    const dz=z-q[1]; if(dz>q[2]*1.9||dz<-q[2]*1.9) continue;
    const d=Math.hypot(dx,dz)+noise2(x*0.07+q[0],z*0.07)*q[2]*0.18;
    if(d<q[2]*1.6) h=Math.max(h,lerp(-5,q[3],smoothstep(q[2]*1.6,q[2]*0.55,d)));
  }
  return h;
}
