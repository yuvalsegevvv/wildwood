//@ Roads between the four villages and the key places (ROADS), the river bridge and the plank causeways over the drowned stretches (BRIDGES): roadDist, roadAmt, nearRoad, roadAt, bridgeDeck, bridgeAt. Pure.
/* Dirt roads that link each village to the places the story sends you (docs/MAIN-QUEST.md, docs/WORLD.md):
   home forest: the East Road (the village, over the river bridge, to the tunnel) with the Circle Path to the Stone Circle,
   the Redgate Road west to the sealed canyon, the Shore Road south to the beach;
   the vale: the Tunnel Road into Hanami, the Gate Road to the Demon Gate, the Shrine Road to the Foxfire Shrine,
   the Coast Road east to the shore and the North Road up to the ice wall in Frostgate Pass;
   the Hoarfrost Reach: the Frost Road from the wall through the pass to Rimehold, the Hall Road to the Rimeking's hall, the Wyrm Road on to the wyrm's nest;
   the Glacier Road from Rimehold west through the glacier valley (and its ice fall) to Highmark in the Greyspine.
   A road is a list of waypoints, cut into ~12 m steps with a gentle noise bend. The dirt is solid within ROAD_W of the line;
   zone ridges are cut away where a road crosses them (rawHeight), and trees, bushes and monster camps keep off (nearPath).
   Where a road crosses the river a bridge is built (BRIDGES): an arched deck from bank to bank that you walk on (bridgeDeck). */
const ROAD_W=2.1, ROAD_CELL=32;
function roadPts(wps,seed){
  const out=[wps[0]];
  for(let i=1;i<wps.length;i++){
    const [ax,az]=wps[i-1], [bx,bz]=wps[i], L=Math.hypot(bx-ax,bz-az)||1, n=Math.max(1,Math.round(L/12)), nx=-(bz-az)/L, nz=(bx-ax)/L;
    for(let k=1;k<=n;k++){ const t=k/n, w=k<n?noise2(ax*0.01+t*3+seed,az*0.01)*Math.sin(t*Math.PI)*Math.min(8,L*0.05):0; out.push([ax+(bx-ax)*t+nx*w, az+(bz-az)*t+nz*w]); }
  }
  return out;
}
// the point m metres outside an arena's ring, on the side facing (fx, fz)
function arenaGate(A,fx,fz,m){ const dx=fx-A.x, dz=fz-A.z, d=Math.hypot(dx,dz)||1; return [A.x+dx/d*(A.r+m), A.z+dz/d*(A.r+m)]; }
const ROADS=(()=>{
  const e1=VIL.paths[VIL.paths.length-1], S=[e1[2],e1[3]], e2=VIL2.paths[VIL2.paths.length-1], S2=[e2[2],e2[3]], e3=VIL3.paths[VIL3.paths.length-1], S3=[e3[2],e3[3]], e4=VIL4.paths[VIL4.paths.length-1], S4=[e4[2],e4[3]];
  const R=(name,wps,seed)=>({name,pts:roadPts(wps,seed)});
  return [
    R('The East Road',[S,[0,64],[38,52],[82,46],[150,-10],[230,-92],[300,-120],[TUN.x0-4,TUN.z]],1),
    R('The Circle Path',[[230,-92],arenaGate(ARENA,230,-92,3)],2),
    R('The Redgate Road',[S,[-70,14],[-105,16],[-160,20],[-240,32],[-320,40],[WX0+REDGATE_CL+30,REDGATE_Z]],3),
    R('The Shore Road',[[-105,16],[-122,110],[-110,220],[-92,330],[-84,WZ1-40]],4),
    R('The Tunnel Road',[S2,[TUN.x1+4,TUN.z]],5),
    R('The Gate Road',[S2,[560,-160],[650,-195],[760,-240],[850,-300],arenaGate(ARENA20,850,-300,3)],6),
    R('The Shrine Road',[S2,[560,-40],[600,80],[592,200],arenaGate(ARENA25,592,200,3)],7),
    R('The Coast Road',[[560,-40],[680,-22],[800,-52],[900,-22],[WX1-46,-12]],8),
    R('The North Road',[[560,-160],[600,-280],[PASS.x,-350],[PASS.x,-380],[PASS.x,PASS.ice+8]],9),
    // beyond the ice wall: through Frostgate Pass onto the plateau and into Rimehold, then to the two boss halls
    R('The Frost Road',[[PASS.x,PASS.ice-8],[PASS.x,-450],[PASS.x,-490],[PASS.x,PASS.z1],S3],10),
    R('The Hall Road',[S3,[700,-680],[722,-735],arenaGate(ARENA26,722,-735,3)],11),
    R('The Wyrm Road',[arenaGate(ARENA26,790,-835,3),[825,-860],arenaGate(ARENA30,825,-860,3)],12),
    // beyond the second gate: from Rimehold west through the glacier valley to Highmark
    R('The Glacier Road',[S3,[615,-605],[580,-668],[545,-714],[GLEN.x1,GLEN.z],[GLEN.ice+6,GLEN.z],[HALF-30,GLEN.z],[GLEN.x0,GLEN.z],S4],13)];
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
const roadAmt=(x,z)=>smoothstep(ROAD_W+1.4,ROAD_W*0.5,roadDist(x,z));
/* bridges: where a road's line crosses the river, an arched deck BRIDGE_LEN long from bank to bank (half-width w).
   Its ends sit on the banks (baseHeight there) and its middle rises 0.9 m, at least 1.4 m above the water.
   Causeways (kind 'causeway'): where a road runs under still water (the drowned roads, docs/STORY.md: the old paving goes on
   under the water, older than anyone's memory), the villages laid plank walkways on posts from dry bank to dry bank,
   a hand's width above the water. Every wet stretch of a road gets one; CAUSEWAY_NAMES names the known ones. */
const BRIDGE_LEN=30, BRIDGE_W=2.4, CAUSE_W=1.5;
const BRIDGES=[];
for(const rd of ROADS) for(let i=1;i<rd.pts.length;i++){
  const [ax,az]=rd.pts[i-1], [bx,bz]=rd.pts[i];
  if(inVale(ax,az)||inVale(bx,bz)) continue;
  const sa=ax-riverX(az), sb=bx-riverX(bz); if(sa*sb>0) continue;
  const t=sa/(sa-sb), x=ax+(bx-ax)*t, z=az+(bz-az)*t, L=Math.hypot(bx-ax,bz-az), dx=(bx-ax)/L, dz=(bz-az)/L;
  const h0=Math.max(baseHeight(x-dx*BRIDGE_LEN/2,z-dz*BRIDGE_LEN/2),WATER+0.6), h1=Math.max(baseHeight(x+dx*BRIDGE_LEN/2,z+dz*BRIDGE_LEN/2),WATER+0.6);
  BRIDGES.push({x,z,dx,dz,h0,h1,len:BRIDGE_LEN,w:BRIDGE_W,kind:'bridge',road:rd.name,name:'the river bridge'});
}
// the drowned stretches, by road (the first causeway on that road gets the name)
const CAUSEWAY_NAMES={'The Redgate Road':'The Drowned Road','The Shore Road':'The Long Planks','The East Road':'The Heron Steps'};
{ const wet=(x,z)=>baseHeight(x,z)<WATER+0.35, named=new Set();
  for(const rd of ROADS){
    const S=[]; for(let i=1;i<rd.pts.length;i++){ const [ax,az]=rd.pts[i-1], [bx,bz]=rd.pts[i], n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/2)); for(let k=i===1?0:1;k<=n;k++) S.push([ax+(bx-ax)*k/n, az+(bz-az)*k/n]); }
    for(let i=0;i<S.length;i++){
      if(!wet(...S[i])) continue;
      let j=i; while(j+1<S.length&&(wet(...S[j+1])||wet(...S[Math.min(S.length-1,j+2)])||wet(...S[Math.min(S.length-1,j+3)]))) j++;
      const [ax,az]=S[Math.max(0,i-3)], [bx,bz]=S[Math.min(S.length-1,j+3)];
      if(!inVale(ax,az)&&BRIDGES.some(B=>B.kind==='bridge'&&Math.hypot((ax+bx)/2-B.x,(az+bz)/2-B.z)<BRIDGE_LEN)){ i=j; continue; }   // the river: its bridge already spans it
      const L=Math.hypot(bx-ax,bz-az); if(L<4||bridgeAt((ax+bx)/2,(az+bz)/2,2)){ i=j; continue; }   // (where two roads meet in the water, one walkway)
      const nm=!named.has(rd.name)&&CAUSEWAY_NAMES[rd.name]; if(nm) named.add(rd.name);
      BRIDGES.push({x:(ax+bx)/2,z:(az+bz)/2,dx:(bx-ax)/L,dz:(bz-az)/L,h0:Math.max(baseHeight(ax,az),WATER+0.5),h1:Math.max(baseHeight(bx,bz),WATER+0.5),len:L,w:CAUSE_W,kind:'causeway',road:rd.name,name:nm||'a plank causeway'});
      i=j;
    }
  }
}
// a bridge arches over the river; a causeway ramps down from each bank (0.3 m per m) and runs a hand above the water between
const bridgeY=(B,t)=>B.kind==='causeway'?Math.max(WATER+0.5,B.h0-t*B.len*0.3,B.h1-(1-t)*B.len*0.3):lerp(B.h0,B.h1,t)+Math.sin(t*Math.PI)*Math.max(0.9,WATER+1.4-(B.h0+B.h1)/2);
// the deck's height under (x, z), or -Infinity off every bridge
function bridgeDeck(x,z){
  for(const B of BRIDGES){ const px=x-B.x, pz=z-B.z, u=px*B.dx+pz*B.dz, v=-px*B.dz+pz*B.dx;
    if(Math.abs(u)<=B.len/2 && Math.abs(v)<=B.w) return bridgeY(B,u/B.len+0.5); }
  return -Infinity;
}
// the bridge or causeway at (x, z) (m: margin), or null
function bridgeAt(x,z,m){ m=m||0; for(const B of BRIDGES){ const px=x-B.x, pz=z-B.z, u=px*B.dx+pz*B.dz, v=-px*B.dz+pz*B.dx; if(Math.abs(u)<=B.len/2+m&&Math.abs(v)<=B.w+m) return B; } return null; }
