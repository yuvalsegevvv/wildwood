//@ Roads between the two villages and the key places (ROADS), the bridge over the river (BRIDGES): roadDist, roadAmt, nearRoad, roadAt, bridgeDeck. Pure.
/* Dirt roads that link each village to the places the story sends you (docs/MAIN-QUEST.md, docs/WORLD.md):
   home forest: the East Road (the village, over the river bridge, to the tunnel) with the Circle Path to the Stone Circle,
   the Redgate Road west to the sealed canyon, the Shore Road south to the beach;
   the vale: the Tunnel Road into Hanami, the Gate Road to the Demon Gate, the Shrine Road to the Foxfire Shrine,
   the Coast Road east to the shore and the North Road up towards the Hoarfrost.
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
  const e1=VIL.paths[VIL.paths.length-1], S=[e1[2],e1[3]], e2=VIL2.paths[VIL2.paths.length-1], S2=[e2[2],e2[3]];
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
    R('The North Road',[[560,-160],[600,-280],[636,WZ0+60]],9)];
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
/* bridges: where a road's line crosses the river, an arched deck BRIDGE_LEN long from bank to bank, BRIDGE_W wide.
   Its ends sit on the banks (baseHeight there) and its middle rises 0.9 m, at least 1.4 m above the water */
const BRIDGE_LEN=30, BRIDGE_W=2.4;
const BRIDGES=[];
for(const rd of ROADS) for(let i=1;i<rd.pts.length;i++){
  const [ax,az]=rd.pts[i-1], [bx,bz]=rd.pts[i];
  if(ax>HALF||bx>HALF) continue;
  const sa=ax-riverX(az), sb=bx-riverX(bz); if(sa*sb>0) continue;
  const t=sa/(sa-sb), x=ax+(bx-ax)*t, z=az+(bz-az)*t, L=Math.hypot(bx-ax,bz-az), dx=(bx-ax)/L, dz=(bz-az)/L;
  const h0=Math.max(baseHeight(x-dx*BRIDGE_LEN/2,z-dz*BRIDGE_LEN/2),WATER+0.6), h1=Math.max(baseHeight(x+dx*BRIDGE_LEN/2,z+dz*BRIDGE_LEN/2),WATER+0.6);
  BRIDGES.push({x,z,dx,dz,h0,h1,road:rd.name});
}
const bridgeY=(B,t)=>lerp(B.h0,B.h1,t)+Math.sin(t*Math.PI)*Math.max(0.9,WATER+1.4-(B.h0+B.h1)/2);
// the deck's height under (x, z), or -Infinity off every bridge
function bridgeDeck(x,z){
  for(const B of BRIDGES){ const px=x-B.x, pz=z-B.z, u=px*B.dx+pz*B.dz, v=-px*B.dz+pz*B.dx;
    if(Math.abs(u)<=BRIDGE_LEN/2 && Math.abs(v)<=BRIDGE_W) return bridgeY(B,u/BRIDGE_LEN+0.5); }
  return -Infinity;
}
