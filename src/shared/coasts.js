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
  const P=[[-1500,-1060,0],[-700,-1060,0],[-440,-1060,40],   // the Greyspine's north coast: a bay, the Queen's cape (her mountain runs on into the sea), a bay, a cape, a bay
    [-350,-1080,45],[-250,-1180,50],[-170,-1200,50],[-90,-1120,50],[0,-1050,50],[100,-1070,50],[200,-1160,50],[300,-1110,50],[385,-1060,45],
    [440,-1090,50],[520,-1110,60],[580,-1170,60],                                                                                                  // the step north at the Greyspine | Reach wall
    [700,-1190,50],[800,-1130,50],[900,-1175,50],[1010,-1195,50],[1120,-1150,50],[1215,-1110,50],                                                    // the Reach's north coast
    [1238,-1010,50],[1150,-900,50],[1128,-820,45],[1245,-745,50],[1235,-670,45],[1100,-600,45],[1190,-520,45],[1205,-470,50]];                        // the Reach's east coast: capes and bays, one long cape out to the east
  for(let x=1180;x>=1010;x-=42) P.push([x,borderZ(x)+55,34]);   // the Reach's south coast, 55 m south of the wall's crest
  P.push([VALE_E,-370,45],[1015,-260,50],[945,-140,50],[1000,0,50],[940,130,50],[995,255,50],[VALE_E-6,390,45],   // the vale's east coast
    [VALE_E-55,425,40],[900,405,40],[820,432,45],[740,385,45],[660,432,45],[560,425,40],[470,420,35],[300,418,0],[-1500,418,0]);   // its south-east corner and south coast, then the home forest's (not used)
  return P;
})();
// the outline: Chaikin-rounded, cut into pieces of at most 30 m, each pushed along its outward normal by noise times the local amp
const csBend=(x,z)=>0.55*noise2(x*0.0029+3.7,z*0.0029-1.9)+0.3*noise2(x*0.0077-8.1,z*0.0077+5.3)+0.15*noise2(x*0.02+2.2,z*0.02-6.6);
const CS_POLY=(()=>{
  let P=CS_BASE.map(p=>p.slice());
  for(let it=0;it<2;it++){ const Q=[P[0]]; for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1]; Q.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25,a[2]*0.75+b[2]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75,a[2]*0.25+b[2]*0.75]); } Q.push(P[P.length-1]); P=Q; }
  const L=[];   // cut
  for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(Math.abs(a[0])>900||Math.abs(b[0])>900?400:30))); for(let k=0;k<n;k++){ const t=k/n; L.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]); } }
  L.push(P[P.length-1]);
  const out=[];
  for(let i=0;i<L.length;i++){ const a=L[Math.max(0,i-1)], b=L[Math.min(L.length-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz)||1, nx=dz/len, nz=-dx/len, d=L[i][2]*csBend(L[i][0],L[i][1]);
    out.push([L[i][0]+nx*d,L[i][1]+nz*d]); }
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
const csWide=(x,z,base)=>base+110*smoothstep(0.56,0.8,csSample(CS_OPEN,x,z));
// the coast without the islets: c, the sea's distance as shore() reads it (land above about 21), for a point of the vale, the Reach or the Greyspine
function csMain(x,z){
  const c=csSample(CS_SD,x,z)+21+noise2(x*0.011+17,z*0.011-29)*8, hk=csHold(x,z);
  return hk>0?Math.max(c,52*hk):c;   // (near a hold the sea keeps off)
}
const CS_ISLES=(()=>{
  const out=[], rng=mulberry32(7741), isSea=(x,z,r,m)=>{ for(let k=0;k<12;k++){ const a=k/12*TAU, rr=r+m; if(csMain(x+Math.sin(a)*rr,z+Math.cos(a)*rr)>6) return false; } return true; };
  for(let z=WZ0+20;z<=WZ1-20;z+=16) for(let x=WX0+20;x<=WX1-20;x+=16){
    if(out.length>=22) return out;
    if(!(x>borderX(z)||z<borderZ(x))) continue;
    const c=csMain(x,z); if(c>-8||c<-140) continue;
    if(rng()>0.14) continue;
    const r=9+rng()*17, edge=Math.min(x-WX0,WX1-x,z-WZ0,WZ1-z); if(edge<r+14||out.some(o=>Math.hypot(o[0]-x,o[1]-z)<95)) continue;
    if(isSea(x,z,r,24)) out.push([Math.round(x),Math.round(z),Math.round(r)]);
  }
  return out;
})();
// an islet's own distance in from its waterline (about 22 at the waterline, as for the main coast): negative far from every islet
function csIsle(x,z){
  let c=-1e9;
  for(const I of CS_ISLES){ const dx=x-I[0], dz=z-I[1]; if(dx*dx+dz*dz>I[2]*I[2]*4) continue;
    const d=Math.hypot(dx,dz)+noise2(x*0.05+I[0],z*0.05+I[1])*I[2]*0.3; c=Math.max(c,22+I[2]-d); }
  return c;
}
// distance to the sea for a point of the vale, the Reach or the Greyspine
function csOuter(x,z){ return Math.max(csMain(x,z),csIsle(x,z)); }
