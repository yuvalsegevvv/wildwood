//@ The outer coasts of the Sakura Vale (south, east), the Hoarfrost Reach (north, east) and the Greyspine (north): csOuter (distance to the sea with rounded corners, bays and capes) and the offshore islets. Pure.
/* Agent map: exports csOuter(x,z) (called by coastDist in shared/terrain.js for every point outside the home forest; csMain is the same without the islets), CS_BAYS (the table) and CS_ISLES (found at load).
   Used by shore() in terrain.js (valeHeight for the vale and the Reach, greyspineBase for the Greyspine), movement (wading stops at the knees), bareGround, terrain-color.js (the beach),
   game/ui/map.js (edgeName). The home forest's own south shore stays in coastDist (the Tide King's beach, shared/beach.js, depends on it).
   The coast is c = distance in from the world's edge (a corner is a soft minimum of its two sides) minus the bays, plus a slow wobble; land where c is above about 21 (the waterline), the
   beach between 22 and 40 (shore()). No edge of the world is a mountain wall any more (docs/WORLD.md rule 3: the sea is the world's edge): the Reach's glacier wall and east cliffs and the Greyspine's
   north crest are gone, their ground comes down to the water instead.
   CS_BAYS: [x, z, radius, depth] - a bay centred on the world's edge at (x, z) that bites `depth` metres into the land (depth at the centre, fading to nothing at `radius`).
   Keep a bay off the camps and resource nodes of the zones: nodes lie as near as 47 m to the east edge and 81 m to the north one, so the bays there are shallow or stay clear.
   CS_ISLES: [x, z, radius] - low islets standing in the sea (found at load by csMain: a candidate grid in the sea band, thinned by a seeded rng). They are not reachable: the water between is deeper than a hiker may wade.
   CS_HOLD / csHold: where the coast leaves the ground alone; csWide: how long the slope down to the beach is. Test: tools/coasts-smoke.js. Names: cs..., CS_... */
const CS_BAYS=[
  [720,-1040,130,62],[500,-1040,85,42],[995,-1045,165,105],   // the Reach's north coast and its north-east corner
  [990,-560,120,58],[990,-805,60,26],                          // the Reach's east coast
  [990,-175,75,30],[990,30,95,38],[990,235,85,42],             // the vale's east coast, between the camps' resource nodes
  [995,445,200,112],[700,440,110,48],[535,440,70,34],          // the vale's south-east corner and south coast
  [-345,-1040,110,52],[55,-1040,140,66],[305,-1040,120,54]     // the Greyspine's north coast
];
// places the coast must not touch (a boss arena or a dungeon door 75-90 m from the sea): shore() lets them keep their height, and the sea keeps 50 m off, so the arena stays flat and high
const CS_HOLD=[[915,-875,115],[575,330,100],[688,-950,85]];   // the Reach's boss arena, the vale's, and the Reach's dungeon door (shared/dungeons.js)
function csHold(x,z){ let k=0; for(const H of CS_HOLD){ const d=Math.hypot(x-H[0],z-H[1]); if(d<H[2]) k=Math.max(k,smoothstep(H[2],H[2]*0.5,d)); } return k; }
// how much longer than the usual 46 m a coast takes to bring the ground down to its beach: by `base`, and by 0.9 m per metre of bay, so a bay has a long gentle beach (a wall of cliffs elsewhere)
const csWide=(x,z,base)=>base+0.9*csBite(x,z);
const csSoftMin=(a,b,k)=>-k*Math.log(Math.exp(-a/k)+Math.exp(-b/k));
// how far the sea comes in at (x, z): the bays' bites, each a rounded dent whose outline is wobbled a little
function csBite(x,z){
  let b=0;
  for(const B of CS_BAYS){ const dx=x-B[0], dz=z-B[1]; if(dx*dx+dz*dz>B[2]*B[2]*1.6) continue;
    const d=Math.hypot(dx,dz)+noise2(x*0.018+B[0],z*0.018+B[1])*B[2]*0.16; b=Math.max(b,B[3]*smoothstep(B[2],B[2]*0.28,d)); }
  return b;
}
// the slow sway of a side of the world along its length: 0..45 m of sea coming in, a bay or a cape every 300-500 m (s tells the sides apart)
const csSway=(t,s)=>45*smoothstep(-0.25,0.6,noise2(t*0.0058+s,s*0.71+3.3));
// the coast without the islets: the sea's distance, in metres, from a point of the vale, the Reach or the Greyspine (land above about 21)
function csMain(x,z){
  const hk=csHold(x,z), ks=1-0.7*hk, bx=borderX(z), south=WZ1-z-csSway(x,11.5)*ks, east=WX1-x-csSway(z,23.1)*ks, north=z-WZ0-csSway(x,37.7)*ks;   // (near a hold the coast sways less and has no bays)
  let e;
  if(x>bx&&z>borderZ(x)) e=csSoftMin(south,east,30);     // the vale: the Crownsea to the south and the east
  else if(x>bx) e=csSoftMin(north,east,40);              // the Reach: the northern sea and the east
  else e=north;                                          // the Greyspine: the northern sea (its west is a wall, its south the home forest's rim)
  e+=noise2(x*0.011+17,z*0.011-29)*10-(noise2(x*0.0045+5,z*0.0045-7)*0.5+0.5)*28-csBite(x,z)*(1-hk);
  return hk>0?Math.max(e,52*hk):e;   // (and the sea keeps off the hold itself)
}
/* CS_ISLES: [x, z, radius] - low sandy islets standing in the sea. Found once at load, the same on the client and the server: a grid of candidate spots in the sea band
   along the vale's, the Reach's and the Greyspine's edges, thinned by a seeded rng, each kept only if the ring 24 m beyond its edge is all sea (so it is an island, never a
   peninsula), it is 14 m clear of the world's edge, 52 m from the last one and in no more than 30 of them. The sea between is deeper than a hiker may wade: unreachable. */
const CS_ISLE_SITES=[[960,-1005,14],[975,-1030,8],[905,-1012,12],[28,-1004,14],[-52,-1004,12]];   // by hand: the Reach's north-east bay, the Greyspine's north (each is kept only if it passes the ring test)
const CS_ISLES=(()=>{
  const out=[], rng=mulberry32(7741), isSea=(x,z,r,m)=>{ for(let k=0;k<12;k++){ const a=k/12*TAU, rr=r+m; if(csMain(x+Math.sin(a)*rr,z+Math.cos(a)*rr)>6) return false; } return true; };
  for(const I of CS_ISLE_SITES) if(csMain(I[0],I[1])<-8&&isSea(I[0],I[1],I[2],16)) out.push(I.slice());
  for(let z=WZ0+20;z<=WZ1-20;z+=16) for(let x=WX0+20;x<=WX1-20;x+=16){
    if(out.length>=30) return out;
    const edge=Math.min(x-WX0,WX1-x,z-WZ0,WZ1-z); if(edge>150||edge<30) continue;
    if(!(x>borderX(z)||z<borderZ(x))||csMain(x,z)>-8) continue;
    if(rng()>0.5) continue;
    const r=9+rng()*17; if(edge<r+14||out.some(o=>Math.hypot(o[0]-x,o[1]-z)<52)) continue;
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
