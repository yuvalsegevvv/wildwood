//@ The coast of the Sakura Vale, the Hoarfrost Reach and the Greyspine: a closed outline of the continent (a base line bent by noise into bays and capes), its distance field, bay openness, offshore islets. Pure.
/* Agent map: exports csOuter(x,z) (called by coastDist in shared/terrain.js for every point outside the home forest; csMain is the same without the islets), CS_BASE (the designed outline), CS_ISLES
   (found at load), csWide(x,z,base) and csHold(x,z). Used by shore() in terrain.js (valeHeight for the vale and the Reach, greyspineBase for the Greyspine), movement (wading stops at the knees),
   bareGround, terrain-color.js (the beach), game/ui/map.js (edgeName). The home forest's own south shore stays in coastDist (the Tide King's beach, shared/beach.js, depends on it).
   The continent is no rectangle. CS_BASE is the rough outline, clockwise (x east, z south; land on the right): the Greyspine's north coast, a step north at the Greyspine | Reach wall, the Reach's north
   coast, its north-east corner and its east coast (the Reach grew: the world rectangle is 810 m east and 800 m north of the forest's corner, shared/terrain.js), the Reach's south coast along the
   foot of the vale | Reach wall, the vale's east coast and south-east corner, the vale's south coast; each point [x, z, amp] says how far bays and capes may bend the line there (m). The base is rounded
   (Chaikin), cut into 30 m pieces and pushed along its outward normal by three octaves of noise (bays and capes of 350, 130 and 50 m), then csBuild measures the distance to it on a 10 m grid:
   CS_SD (metres inland, negative at sea). c = distance + 21 (the waterline, as shore() reads it) + a small wobble: the beach is c 22-40, the sea below ~21, you can wade to c 19.
   csOpen is the share of sea within 110 m (more than half in a bay, less on a cape): csWide uses it to make the ground come down to the sea over a longer, gentler slope in a bay.
   CS_HOLD / csHold: where the coast leaves the ground alone (a boss arena 110 m from the sea). CS_ISLES: [x, z, radius] low islets in the sea, found at load on a grid in the sea band by a seeded
   rng, each kept only if the ring round it is all sea (an island, never a peninsula). They are not reachable: the water between is deeper than a hiker may wade.
   Test: tools/coasts-smoke.js. Names: cs..., CS_... */
const CS_BASE=(()=>{
  const P=[[-1500,-1060,0],[-700,-1060,0],[-440,-1045,60],   // the Greyspine's north coast: bays at x -370, 10 and 370, the Queen's long cape (her mountain runs on into the sea) and a second cape at x 190
    [-370,-1030,70],[-300,-1130,75],[-210,-1170,75],[-120,-1150,75],[-60,-1050,75],[10,-1030,80],[90,-1090,80],[190,-1165,80],[290,-1120,70],[370,-1040,70],
    [440,-1085,60],[520,-1105,70],[580,-1180,75],                                                                                                  // the step north at the Greyspine | Reach wall
    [680,-1220,80],[790,-1135,100],[900,-1225,80],[1010,-1105,100],[1120,-1225,75],[1245,-1180,70],                                                 // the Reach's north coast: two capes, two deep bays, the corner
    [1255,-1040,80],[1185,-925,110],[1110,-850,100],[1185,-770,95],[1260,-745,75],[1200,-650,100],[1245,-550,70],[1240,-480,55]];                   // the Reach's east coast: a deep bay at z -830, the long cape at z -735, a second bay, the corner
  for(let x=1230;x>=1010;x-=42) P.push([x,borderZ(x)+55,34]);   // the Reach's south coast, 55 m south of the wall's crest
  P.push([VALE_E,-370,50],[1090,-300,75],[975,-190,75],[1115,-70,75],[960,40,70],[1075,150,65],      // the vale's east coast: capes at z -300 and -70 stand out 100 m, bays between
    [960,185,50],[890,228,50],[852,272,45],[840,335,40],[846,395,40],[812,428,45],                      // the south-east corner is gone: the coast turns west at z 190 and runs down the west side of a bay 150-300 m wide (the Warlord Isles lie in it)
    [740,392,50],[660,436,45],[560,425,40],[470,420,35],[300,418,0],[-1500,418,0]);                      // the vale's south coast, then the home forest's (not used)
  return P;
})();
// the outline: Chaikin-rounded, cut into pieces of at most 30 m, each pushed along its outward normal by noise times the local amp
const csBend=(x,z)=>0.62*noise2(x*0.0029+3.7,z*0.0029-1.9)+0.28*noise2(x*0.0077-8.1,z*0.0077+5.3)+0.10*noise2(x*0.02+2.2,z*0.02-6.6);
const CS_POLY=(()=>{
  let P=CS_BASE.map(p=>p.slice());
  for(let it=0;it<2;it++){ const Q=[P[0]]; for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1]; Q.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25,a[2]*0.75+b[2]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75,a[2]*0.25+b[2]*0.75]); } Q.push(P[P.length-1]); P=Q; }
  const L=[];   // cut
  for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(a[0]<-700||b[0]<-700?400:30))); for(let k=0;k<n;k++){ const t=k/n; L.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]); } }
  L.push(P[P.length-1]);
  const out=[];
  for(let i=0;i<L.length;i++){ const a=L[Math.max(0,i-1)], b=L[Math.min(L.length-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz)||1, nx=dz/len, nz=-dx/len, d=L[i][2]*csBend(L[i][0],L[i][1]);
    out.push([Math.min(L[i][0]+nx*d,WX1-35),Math.max(L[i][1]+nz*d,WZ0+35)]); }   // (a cape never reaches the world's edge: the sea is the last thing at it)
  return out;
})();
// distance from a point to the outline, signed: positive inside (land)
function csDist(x,z){
  const P=CS_POLY; let inside=false, dm=1e18;
  for(let i=0,j=P.length-1;i<P.length;j=i++){
    const x1=P[i][0], z1=P[i][1], x2=P[j][0], z2=P[j][1];
    if((z1>z)!==(z2>z)&&x<x1+(z-z1)*(x2-x1)/(z2-z1)) inside=!inside;
    const dx=x2-x1, dz=z2-z1, l2=dx*dx+dz*dz, t=l2>0?Math.max(0,Math.min(1,((x-x1)*dx+(z-z1)*dz)/l2)):0, ex=x-x1-t*dx, ez=z-z1-t*dz, d=ex*ex+ez*ez;
    if(d<dm) dm=d;
  }
  return (inside?1:-1)*Math.sqrt(dm);
}
// the field on a 10 m grid over the world and 200 m beyond it, and the share of sea within 110 m of each cell (a box blur of the sea mask)
const CS_CELL=10, CS_X0=WX0-200, CS_Z0=WZ0-200, CS_NX=Math.ceil((WW+400)/CS_CELL)+1, CS_NZ=Math.ceil((WD+400)/CS_CELL)+1;
const CS_SD=new Float32Array(CS_NX*CS_NZ), CS_OPEN=new Float32Array(CS_NX*CS_NZ);
(function csBuild(){
  for(let j=0;j<CS_NZ;j++) for(let i=0;i<CS_NX;i++) CS_SD[j*CS_NX+i]=csDist(CS_X0+i*CS_CELL,CS_Z0+j*CS_CELL);
  const S=new Int32Array((CS_NX+1)*(CS_NZ+1)), W=CS_NX+1;   // integral image of the sea cells
  for(let j=0;j<CS_NZ;j++){ let row=0; for(let i=0;i<CS_NX;i++){ row+=CS_SD[j*CS_NX+i]<0?1:0; S[(j+1)*W+i+1]=S[j*W+i+1]+row; } }
  const R=11;
  for(let j=0;j<CS_NZ;j++) for(let i=0;i<CS_NX;i++){ const i0=Math.max(0,i-R), i1=Math.min(CS_NX,i+R+1), j0=Math.max(0,j-R), j1=Math.min(CS_NZ,j+R+1);
    CS_OPEN[j*CS_NX+i]=(S[j1*W+i1]-S[j0*W+i1]-S[j1*W+i0]+S[j0*W+i0])/((i1-i0)*(j1-j0)); }
})();
function csSample(F,x,z){
  const gx=clamp((x-CS_X0)/CS_CELL,0,CS_NX-1.001), gz=clamp((z-CS_Z0)/CS_CELL,0,CS_NZ-1.001), i=Math.floor(gx), j=Math.floor(gz), fx=gx-i, fz=gz-j, k=j*CS_NX+i;
  return lerp(lerp(F[k],F[k+1],fx),lerp(F[k+CS_NX],F[k+CS_NX+1],fx),fz);
}
// places the coast must not touch (a boss arena 110 m from the sea): shore() lets them keep their height, and the sea keeps 50 m off, so the arena stays flat and high
const CS_HOLD=[[575,330,100]];   // the vale's boss arena
function csHold(x,z){ let k=0; for(const H of CS_HOLD){ const d=Math.hypot(x-H[0],z-H[1]); if(d<H[2]) k=Math.max(k,smoothstep(H[2],H[2]*0.5,d)); } return k; }
// how much longer than the usual 46 m a coast takes to bring the ground down to its beach: `base` metres, and up to 110 more in a bay (where more than half of the 110 m round is sea), so a bay has a long gentle beach and a cape a bluff
const csWide=(x,z,base)=>(base+110*smoothstep(0.56,0.8,csSample(CS_OPEN,x,z)))*(1-smoothstep(20,60,csIslandMax(x,z)));   // (a big island keeps its hills: the slope runs short there)
// the coast without the islets: c, the sea's distance as shore() reads it (land above about 21), for a point of the vale, the Reach or the Greyspine
function csMain(x,z){
  const c=csSample(CS_SD,x,z)+21+noise2(x*0.011+17,z*0.011-29)*8, hk=csHold(x,z);
  return hk>0?Math.max(c,52*hk):c;   // (near a hold the sea keeps off)
}
/* CS_ISLANDS: [x, z, radius, stretch east-west]: the islands that carry content, drawn by hand. The Warlord Isles lie where the vale's south-east corner was (it is sea now: zone 24, Warlord Ruins, moved
   onto the first of them, shared/vale.js, and The Isle Road reaches it over a plank causeway from the mainland, shared/roads.js); the two small ones beside it are only land. csIsle(x,z) is the distance
   in from an island's waterline plus 22, like the main coast; the shore wears the island down to a beach all round and leaves its middle as hills (coastDist, shore in terrain.js). */
const CS_ISLANDS=[[1045,312,115,1.2],[1190,198,50,1.05],[1175,425,38,1.15]];
/* CS_ISLES: [x, z, radius] - low sandy islets standing in the sea. Found once at load, the same on the client and the server: a grid of candidate spots in the sea band near the coast, thinned by a seeded
   rng, each kept only if the ring round it is all sea (an island, never a peninsula) and it keeps clear of the big islands. They are not reachable: the water between is deeper than a hiker may wade. */
const csIslandC=(I,x,z)=>{ const dx=(x-I[0])/(I[3]||1), dz=z-I[1]; if(dx*dx+dz*dz>I[2]*I[2]*4) return -1e9; return 22+I[2]-(Math.hypot(dx,dz)+noise2(x*0.011+I[0],z*0.011+I[1])*I[2]*0.22+noise2(x*0.035+I[1],z*0.035-I[0])*3); };
function csIslandMax(x,z){ let c=-1e9; for(const I of CS_ISLANDS) c=Math.max(c,csIslandC(I,x,z)); return c; }   // (how far in from the nearest big island's waterline, plus 22)
const CS_ISLES=(()=>{
  const out=[], rng=mulberry32(7741), isSea=(x,z,r,m)=>{ for(let k=0;k<12;k++){ const a=k/12*TAU, rr=r+m; if(csMain(x+Math.sin(a)*rr,z+Math.cos(a)*rr)>6) return false; } return true; };
  for(let z=WZ0+20;z<=WZ1-20;z+=16) for(let x=WX0+20;x<=WX1-20;x+=16){
    if(out.length>=14) return out;
    if(!(x>borderX(z)||z<borderZ(x))) continue;
    const c=csMain(x,z); if(c>-8||c<-110) continue;
    if(CS_ISLANDS.some(I=>csIslandC(I,x,z)>-60||Math.hypot((x-I[0])/(I[3]||1),z-I[1])<I[2]+90)) continue;
    if(rng()>0.12) continue;
    const r=9+rng()*17, edge=Math.min(x-WX0,WX1-x,z-WZ0,WZ1-z); if(edge<r+14||out.some(o=>Math.hypot(o[0]-x,o[1]-z)<120)) continue;
    if(isSea(x,z,r,24)) out.push([Math.round(x),Math.round(z),Math.round(r)]);
  }
  return out;
})();
// an islet's or island's own distance in from its waterline (about 22 at the waterline, as for the main coast): negative far from every one
function csIsle(x,z){
  let c=-1e9;
  for(const I of CS_ISLANDS) c=Math.max(c,csIslandC(I,x,z));
  for(const I of CS_ISLES){ const dx=x-I[0], dz=z-I[1]; if(dx*dx+dz*dz>I[2]*I[2]*4) continue;
    const d=Math.hypot(dx,dz)+noise2(x*0.05+I[0],z*0.05+I[1])*I[2]*0.3; c=Math.max(c,22+I[2]-d); }
  return c;
}
// distance to the sea for a point of the vale, the Reach or the Greyspine
function csOuter(x,z){ return Math.max(csMain(x,z),csIsle(x,z)); }
