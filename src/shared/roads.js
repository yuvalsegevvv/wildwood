//@ Roads (ROADS: the atlas's main roads, boss and door roads and zone trails, with the names the game uses), the bridges and plank causeways where a road meets water (BRIDGES): roadDist, roadAmt, nearRoad, roadAt, bridgeDeck, bridgeAt. Pure.
/* Agent map. ROADS come from WA_ROADS (shared/world-atlas.js, baked by docs/world-atlas.py): kind 'main' links two villages through a gate, 'road' runs to a boss or a dungeon door, 'trail' links zone
   entrances. A road is {name, kind, w, pts:[[x,z]...]} (pts ~3 m apart, already curved by the atlas); the dirt is solid within w of the line (2.1 m, a trail 1.4 m); trees, bushes and monster camps keep off (nearPath).
   Names: a role the old game had keeps its name (The East Road, The Tunnel Road, The North Road, The Frost Road, The Glacier Road, The Redgate Road, The Gate Road, The Hollow Road, The Hall Road, The Wyrm Road, The Circle Path,
   The Shore Road, The Proving Road: ROAD_NAMES), the others are called after the gate or the place they lead to.
   The Proving Road is not in the atlas's list: it is WA_PVP.bridge, the plank causeway from the south beach to the Proving Isle (shared/pvp.js reads its causeway by that road name: BRIDGES.find(road==='The Proving Road')).
   Water: where a road runs in a river (or a lake, or the sea) it gets a bridge: wet stretches are found on the road itself (rdWet: the atlas's water, the sea; ice is walkable and gets nothing). A river crossing up to 44 m long
   gets one arched 'bridge'; a lake, the sea, or a river the road follows gets 'causeway' pieces of at most 30 m (plank walkways a hand above the surface, kind 'causeway'). Each has wy0 / wy1, the water surface at its two ends (a river or lake stands above
   y = 0 in the high lands; the client draws it: game/world/atlas-water.js). A bridge on a gate carries gate: the gate's name.
   Used by: terrain colouring (roadAmt), village-helpers (nearPath), monsters / professions / plants (nearRoad), movement.js (bridgeDeck), game/world/bridges.js (models), pvp.js, main-quest.js, map.js. Test: atlas-smoke, client-smoke (bridgeDeck on the Greyfall crossing); the bridges list is checked by hand in the B4 report. */
const ROAD_W=2.1, ROAD_CELL=32;
// the point m metres outside an arena's ring, on the side facing (fx, fz)
function arenaGate(A,fx,fz,m){ const dx=fx-A.x, dz=fz-A.z, d=Math.hypot(dx,dz)||1; return [A.x+dx/d*(A.r+m), A.z+dz/d*(A.r+m)]; }
// the old game's names for the roles the atlas's roads play. 'main' roads come in pairs (one from each side's village) listed in order; 'road' roads by the name they have in the atlas
const ROAD_NAMES_MAIN={'The Greyfall Bridge':['The East Road','The Tunnel Road'],'Frostgate Pass':['The North Road','The Frost Road'],'The Glacier Valley':['The Glacier Road','The Glacier Road'],
  'The Windswept Neck':['The Neck Road','The Neck Road'],'The River Pass':['The River Road','The River Road'],'Redgate Canyon':['The Redgate Road','The Redgate Road']};
const ROAD_NAMES={'Demon Gate':'The Gate Road','Foxfire Hollow':'The Hollow Road',"The Rimeking's Hall":'The Hall Road',"The Wyrm's Nest":'The Wyrm Road','The Stone Circle':'The Circle Path',"Carapax's Beach (20)":'The Shore Road'};
const ROADS=(()=>{
  const out=[], seen={};
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  for(const r of WA_ROADS){
    let name;
    if(r.kind==='main'){ const k=seen[r.name]||0; seen[r.name]=k+1; name=(ROAD_NAMES_MAIN[r.name]||[r.name,r.name])[k]||r.name; }
    else if(r.kind==='road') name=ROAD_NAMES[r.name]||(/ door$/.test(r.name)?'The '+cap(r.name.slice(0,-5))+' Door Road':'The '+cap(r.name).replace(/^The /,'')+' Road');
    else name='A footpath';
    out.push({name,kind:r.kind,w:r.kind==='trail'?1.4:ROAD_W,pts:r.pts});
  }
  // pvp: the Proving Road, from the beach out over the sea to the island (the atlas's WA_PVP.bridge, a few metres longer at both ends so the planks reach the sand and the island's ground)
  { const [a,b]=WA_PVP.bridge, L=Math.hypot(b[0]-a[0],b[1]-a[1])||1, ux=(b[0]-a[0])/L, uz=(b[1]-a[1])/L;
    out.push({name:'The Proving Road',kind:'road',w:ROAD_W,pts:[[a[0]-ux*40,a[1]-uz*40],[a[0]-ux*3,a[1]-uz*3],[a[0],a[1]],[b[0],b[1]],[b[0]+ux*7,b[1]+uz*7]]}); }
  return out;
})();
// segments bucketed on a ROAD_CELL grid (with a margin) so a lookup only checks the few nearby ones
const ROAD_GRID=new Map();
for(const rd of ROADS) for(let i=1;i<rd.pts.length;i++){
  const [ax,az]=rd.pts[i-1], [bx,bz]=rd.pts[i], s=[ax,az,bx,bz,rd], m=14;
  for(let gx=Math.floor((Math.min(ax,bx)-m)/ROAD_CELL);gx<=Math.floor((Math.max(ax,bx)+m)/ROAD_CELL);gx++)
    for(let gz=Math.floor((Math.min(az,bz)-m)/ROAD_CELL);gz<=Math.floor((Math.max(az,bz)+m)/ROAD_CELL);gz++){ const k=gx*4096+gz; if(!ROAD_GRID.has(k)) ROAD_GRID.set(k,[]); ROAD_GRID.get(k).push(s); }
}
// distance to the nearest road's centre line (1e9 beyond ~14 m); roadAt: that road
let roadHit=null;
function roadDist(x,z){
  const L=ROAD_GRID.get(Math.floor(x/ROAD_CELL)*4096+Math.floor(z/ROAD_CELL)); roadHit=null; if(!L) return 1e9;
  let m=1e9; for(const s of L){ const d=segDist(x,z,s); if(d<m){ m=d; roadHit=s[4]; } } return m;
}
function roadAt(x,z,m){ return roadDist(x,z)<ROAD_W+(m||0)?roadHit:null; }
const nearRoad=(x,z,m)=>roadDist(x,z)<ROAD_W+m;
function roadAmt(x,z){ const d=roadDist(x,z), w=roadHit?roadHit.w:ROAD_W; return smoothstep(w+1.4,w*0.5,d); }
/* bridges and causeways: found by walking each road every 2 m and asking rdWet. A bridge is an arched deck from bank to bank (half-width w): its ends sit on the banks (baseHeight there, at least wy + 0.6) and its middle
   rises at least 0.9 m, to at least wy + 1.4. Causeways (kind 'causeway'): plank walkways on posts a hand above the surface of the water the road runs through (the drowned roads of docs/STORY.md: the old paving goes on under
   the water, older than anyone's memory); CAUSEWAY_NAMES names the known ones. */
const BRIDGE_MAX=44, BRIDGE_MIN=14, BRIDGE_W=2.4, CAUSE_W=1.5, CAUSE_PIECE=30, CAUSE_SEA=64, RD_EXT=4, RD_GAP=8;
const BRIDGES=[];
// 0 dry, 1 river, 2 lake, 3 the sea (frozen water is ice you walk on: 0)
function rdWet(x,z){
  if(waIsSea(x,z)) return 3;
  if(waWaterDist(x,z)>-0.5) return 0;
  const t=waWater(x,z); return t===WA_RIVER?1:t===WA_LAKE?2:0;
}
// the known causeways, by road (the first on that road gets the name)
const CAUSEWAY_NAMES={'The Redgate Road':'The Drowned Road','The Proving Road':'The Proving Bridge'};
{ const named=new Set();
  for(const rd of ROADS){
    // the road as points 2 m apart: x, z, the metres from its start, what is wet there
    const P=[]; let acc=0;
    for(let i=1;i<rd.pts.length;i++){ const [ax,az]=rd.pts[i-1], [bx,bz]=rd.pts[i], L=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.ceil(L/2));
      for(let k=i===1?0:1;k<=n;k++){ const t=k/n, x=ax+(bx-ax)*t, z=az+(bz-az)*t; P.push({x,z,s:acc+L*t,w:rdWet(x,z)}); } acc+=L; }
    const at=s=>{ let lo=0,hi=P.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(P[m].s<=s) lo=m; else hi=m; } const a=P[lo], b=P[hi], t=b.s>a.s?Math.min(1,Math.max(0,(s-a.s)/(b.s-a.s))):0; return [a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t]; };
    for(let i=0;i<P.length;i++){
      if(!P[i].w) continue;
      let j=i; for(let k=i+1;k<P.length&&P[k].s-P[j].s<=RD_GAP;k++) if(P[k].w) j=k;   // (a dry gap under RD_GAP is the same water)
      const cnt={}; let kind=0; for(let k=i;k<=j;k++){ const w=P[k].w; if(w){ cnt[w]=(cnt[w]||0)+1; if(!kind||cnt[w]>cnt[kind]) kind=w; } }
      let a=Math.max(0,P[i].s-RD_EXT), b=Math.min(acc,P[j].s+RD_EXT);
      if(b-a<4){ i=j; continue; }   // (a toe in the water: a ford)
      const pieces=[];
      if(kind===1&&b-a<=BRIDGE_MAX){ const len=Math.max(BRIDGE_MIN,b-a), m=(a+b)/2; pieces.push([m-len/2,m+len/2,'bridge']); }
      else { const n=Math.ceil((b-a)/(kind===3?CAUSE_SEA:CAUSE_PIECE));   // (the sea: one walkway, the Proving Road's causeway is one piece)
         for(let q=0;q<n;q++) pieces.push([a+(b-a)*q/n,a+(b-a)*(q+1)/n,'causeway']); }
      for(const [pa,pb,pk] of pieces){
        const [x0,z0]=at(pa), [x1,z1]=at(pb), L=Math.hypot(x1-x0,z1-z0); if(L<3) continue;
        const x=(x0+x1)/2, z=(z0+z1)/2, br=pk==='bridge';
        if(bridgeAt(x,z,2)) continue;   // (where two roads meet in the water, one walkway)
        const wy0=kind===3?WATER:waWaterSurf(x0,z0), wy1=kind===3?WATER:waWaterSurf(x1,z1), up=br?0.6:0.5, h0=Math.max(baseHeight(x0,z0),wy0+up), h1=Math.max(baseHeight(x1,z1),wy1+up);   // (the surface at each end: a river falls, so the pieces of a long causeway meet at one height)
        let gate=null; for(const G of WA_GATES) if(Math.hypot(G.x-x,G.z-z)<60){ gate=G.name; break; }
        if(gate==='The Greyfall Bridge') continue;   // (that crossing is TUN's stone bridge: bridgeDeck)
        let nm=br?'a river bridge':'a plank causeway';
        if(!br&&!named.has(rd.name)&&CAUSEWAY_NAMES[rd.name]){ nm=CAUSEWAY_NAMES[rd.name]; named.add(rd.name); }
        BRIDGES.push({x,z,dx:(x1-x0)/L,dz:(z1-z0)/L,h0,h1,len:L,w:br?BRIDGE_W:CAUSE_W,wy0,wy1,kind:pk,road:rd.name,name:nm,gate,r:L/2+(br?BRIDGE_W:CAUSE_W)+1});   // (r: a quick reject for bridgeDeck / bridgeAt)
      }
      i=j;
    }
  }
}
// a bridge arches over the river; a causeway ramps down from each bank (0.3 m per m) and runs a hand above the water between
const bridgeWy=(B,t)=>B.wy0+(B.wy1-B.wy0)*t;   // the water surface under the deck at t (0..1)
const bridgeY=(B,t)=>B.kind==='causeway'?Math.max(bridgeWy(B,t)+0.5,B.h0-t*B.len*0.3,B.h1-(1-t)*B.len*0.3):lerp(B.h0,B.h1,t)+Math.sin(t*Math.PI)*Math.max(0.9,bridgeWy(B,0.5)+1.4-(B.h0+B.h1)/2);
// the deck's height under (x, z), or -Infinity off every bridge
function bridgeDeck(x,z){
  if(x>=TUN.p0&&x<=TUN.p1&&Math.abs(z-TUN.z)<=TUN.w) return TUN.floor(x);   // the Greyfall Bridge's own deck (shared/vale.js: TUN, drawn by buildings-vale.js)
  for(const B of BRIDGES){ const px=x-B.x, pz=z-B.z; if(px*px+pz*pz>B.r*B.r) continue; const u=px*B.dx+pz*B.dz, v=-px*B.dz+pz*B.dx;
    if(Math.abs(u)<=B.len/2 && Math.abs(v)<=B.w) return bridgeY(B,u/B.len+0.5); }
  return -Infinity;
}
// the bridge or causeway at (x, z) (m: margin), or null
function bridgeAt(x,z,m){ m=m||0; for(const B of BRIDGES){ const px=x-B.x, pz=z-B.z; if(px*px+pz*pz>(B.r+m)*(B.r+m)) continue; const u=px*B.dx+pz*B.dz, v=-px*B.dz+pz*B.dx; if(Math.abs(u)<=B.len/2+m&&Math.abs(v)<=B.w+m) return B; } return null; }
