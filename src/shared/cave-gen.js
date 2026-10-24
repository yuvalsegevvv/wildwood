//@ The Deep Cave's map generator: a seeded layout per floor (chambers, winding tunnels, side tunnels, dead-end pockets, a sealed vault, pools / river / lava), its walk grid, heights and the named anchors of the eight methods and the monster camps. Pure.
/* Agent map. Doc: docs/CAVE.md section 14 (the choice of where the floors live, the grid, every anchor). Test: tools/cave-smoke.js.
   exports: CAVE_CELL (2 m, = DG_CELL, so dgFree / dgSlide / dgLos / dgFlow of shared/dungeons.js work on a baked floor), caveWallNormal(dw, w, h, x, z), caveGen(F) -> B (F: a floor row of defineCaveFloor, shared/cave-map.js).
   B = { w, h (cells), cells (Uint8Array, 1 = a hiker can stand there: the walk grid, lava and the vault's seal are 0), open (1 = cave air, lava included: what the view carves), water, lava (masks),
         hgt (Float32Array (w+1)*(h+1), the floor's height above the floor's base at the cell corners), dw (distance to the nearest rock in cells, per cell), dist (walking distance from the start in decimetres, per cell, 65535 = cut off),
         size [w*2, h*2], start {x,z,face}, lift {x,z,r}, chambers [{x,z,r,kind,depth,role}] (metres), dead [{x,z,len}] (dead-end pockets), pillars [{x,z}], pools [{x,z,r}], river [{x,z}] (the flow, start to deep end), sealed [cell index] (rock between the vault and the cave),
         anchors, camps [{x,z,lv,r}], maxDepth, seed }
   anchors (floor-local metres; wall points also have nx, nz = the unit vector into the open): start {x,z,face}, lift {x,z,r}, deep {x,z},
         A {wall, pieces[5]} (mural), B {geodes[3]}, C {plinth {x,z,r}}, D {crystal (the deepest gallery), altar (beside the start)}, E {entry, shrine, guard, exit} (the silent chamber),
         F {vault, seal} (a sealed pocket; seal = the middle of the rock that holds it shut), G {burrows[3], holes[6]}, H {veins[8], herbs[6], anvil}.
   Why no trig in the layout: the client rebuilds a floor from its seed and must get the very same cells as the server; only + - * / sqrt floor and the integer hash below touch a cell, so no engine can differ.
   How: chambers are placed by rejection, joined by a minimum spanning tree plus a few loops, each joint carved as a tunnel whose centre line is bent by 1D value noise; side tunnels grow from the rock
   side of the open air into solid rock (clearance checked) and end in a pocket; two passes of 3x3 majority smoothing round the edges; only the start's region is kept. */
const CAVE_CELL=2;
function caveHash(a,b,s){ let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(s|0,1274126177))|0; h=Math.imul(h^(h>>>13),1103515245)|0; h^=h>>>16; return (h>>>0)/4294967296; }
function caveVn(x,z,s){ const ix=Math.floor(x), iz=Math.floor(z), fx=x-ix, fz=z-iz, u=fx*fx*(3-2*fx), v=fz*fz*(3-2*fz), a=caveHash(ix,iz,s), b=caveHash(ix+1,iz,s), c=caveHash(ix,iz+1,s), d=caveHash(ix+1,iz+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
const CAVE_DIRS8=[[1,0],[0.7071,0.7071],[0,1],[-0.7071,0.7071],[-1,0],[-0.7071,-0.7071],[0,-1],[0.7071,-0.7071]];
// the unit vector from the rock into the open at a cell-unit point (the gradient of the distance to rock)
function caveWallNormal(dw,W,H,x,z){ const xi=Math.floor(x), zi=Math.floor(z), g=(a,b)=>dw[Math.min(H-1,Math.max(0,b))*W+Math.min(W-1,Math.max(0,a))]; const gx=g(xi+1,zi)-g(xi-1,zi), gz=g(xi,zi+1)-g(xi,zi-1), l=Math.sqrt(gx*gx+gz*gz); return l<0.05?[0,1]:[gx/l,gz/l]; }
const CAVE_NB4=[[1,0],[-1,0],[0,1],[0,-1]];
function caveGen(F){
  const G=Object.assign({cells:168,chambers:13,rMin:5,rMax:11,rStart:7,tw:2.2,wind:6,side:9,loops:3,gap:4,style:'cavern',camps:24,start:[0.11,0.5],deep:[0.89,0.5],pools:2,river:false,lava:0,flood:false,pillars:false},F.gen||{});
  const W=G.cells|0, H=W, N=W*H, rng=mulberry32(F.seed|0), rr=(a,b)=>a+(b-a)*rng(), ri=(a,b)=>Math.floor(rr(a,b+1)), at=(x,z)=>z*W+x, SEED=F.seed|0;
  const open=new Uint8Array(N), water=new Uint8Array(N), lava=new Uint8Array(N), pocketMark=new Uint8Array(N);
  const inb=(x,z,m)=>x>=m&&z>=m&&x<W-m&&z<H-m;
  function stamp(cx,cz,r,arr,v){ const x0=Math.max(2,Math.floor(cx-r)), x1=Math.min(W-3,Math.ceil(cx+r)), z0=Math.max(2,Math.floor(cz-r)), z1=Math.min(H-3,Math.ceil(cz+r)); const r2=r*r;
    for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++){ const dx=x+0.5-cx, dz=z+0.5-cz; if(dx*dx+dz*dz<=r2) (arr||open)[at(x,z)]=v===undefined?1:v; } }
  function stampRect(cx,cz,hx,hz,k){ const x0=Math.max(2,Math.floor(cx-hx)), x1=Math.min(W-3,Math.ceil(cx+hx)), z0=Math.max(2,Math.floor(cz-hz)), z1=Math.min(H-3,Math.ceil(cz+hz));
    for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++){ const dx=Math.abs(x+0.5-cx)-(hx-k), dz=Math.abs(z+0.5-cz)-(hz-k); if(dx<=0||dz<=0||dx*dx+dz*dz<=k*k) open[at(x,z)]=1; } }
  // ---- chambers ----
  const ch=[], dirTo=(a,b)=>{ const dx=b.x-a.x, dz=b.z-a.z, l=Math.sqrt(dx*dx+dz*dz)||1; return [dx/l,dz/l]; };
  ch.push({x:W*G.start[0],z:H*G.start[1],r:G.rStart,role:'start'});
  ch.push({x:W*G.deep[0],z:H*G.deep[1],r:G.rMax,role:'deep'});
  const mg=G.rMax+3;
  for(let guard=0;guard<G.chambers*4&&ch.length<G.chambers;guard++){   // best candidate of 40: the one farthest from the chambers so far, so they spread over the whole map
    let best=null;
    for(let k=0;k<40;k++){ const r=rr(G.rMin,G.rMax), x=rr(mg,W-mg), z=rr(mg,H-mg); let md=1e9; for(const c of ch){ const dx=c.x-x, dz=c.z-z, d=Math.sqrt(dx*dx+dz*dz)-c.r-r; if(d<md) md=d; }
      if(md>=G.gap&&(!best||md>best.md)) best={x,z,r,md}; }
    if(best) ch.push({x:best.x,z:best.z,r:best.r,role:'room'});
  }
  // joints: a minimum spanning tree (Prim), then the nearest unlinked pairs as loops
  const edges=[], inT=new Array(ch.length).fill(false), link=new Set(), key=(i,j)=>i<j?i*64+j:j*64+i; inT[0]=true;
  const dist2=(i,j)=>{ const dx=ch[i].x-ch[j].x, dz=ch[i].z-ch[j].z; return Math.sqrt(dx*dx+dz*dz); };
  for(let k=1;k<ch.length;k++){ let bi=-1,bj=-1,bd=1e9; for(let i=0;i<ch.length;i++) if(inT[i]) for(let j=0;j<ch.length;j++) if(!inT[j]){ const d=dist2(i,j); if(d<bd){ bd=d; bi=i; bj=j; } }
    inT[bj]=true; edges.push([bi,bj]); link.add(key(bi,bj)); }
  const cand=[]; for(let i=0;i<ch.length;i++) for(let j=i+1;j<ch.length;j++) if(!link.has(key(i,j))) cand.push([dist2(i,j),i,j]);
  cand.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
  for(let k=0,n=0;k<cand.length&&n<G.loops;k++){ if(cand[k][0]>60) break; edges.push([cand[k][1],cand[k][2]]); link.add(key(cand[k][1],cand[k][2])); n++; }
  // ---- carving ----
  function carveChamber(c,i){
    const r=c.r, st=c.role==='start'?'cavern':G.style;
    if(st==='geode'){ stamp(c.x,c.z,r); const n=ri(3,5); for(let k=0;k<n;k++){ const d=CAVE_DIRS8[(k*2+ri(0,1))%8]; stamp(c.x+d[0]*r*0.95,c.z+d[1]*r*0.95,r*rr(0.25,0.38)); } c.kind='geode'; }
    else if(st==='hall'&&c.role!=='start'){ const hx=r*rr(1.0,1.3), hz=r*rr(0.7,0.95); stampRect(c.x,c.z,hx,hz,2); c.kind='hall'; c.hx=hx; c.hz=hz; }
    else if(st==='tube'&&c.role!=='start'){ let dx=rr(-1,1), dz=rr(-1,1); const l=Math.sqrt(dx*dx+dz*dz)||1; dx/=l; dz/=l; const len=r*1.6, n=Math.ceil(len*2); for(let k=0;k<=n;k++){ const t=k/n*2-1; stamp(c.x+dx*len*t,c.z+dz*len*t,r*(0.5+0.12*caveVn(k*0.5,0.3,SEED+i))); } c.kind='tube'; }
    else { const n=ri(4,6); stamp(c.x,c.z,r*0.7); for(let k=0;k<n;k++){ const a=rr(0,1)*8, d=CAVE_DIRS8[Math.floor(a)%8], o=r*rr(0.3,0.62); stamp(c.x+d[0]*o,c.z+d[1]*o,r*rr(0.5,0.78)); } c.kind='cavern'; }
  }
  ch.forEach(carveChamber);
  function path(ax,az,bx,bz,rad,wind,seed,steps0){   // a winding line a -> b stamped with discs; returns the centre points
    const dx=bx-ax, dz=bz-az, len=Math.sqrt(dx*dx+dz*dz)||1, nx=-dz/len, nz=dx/len, steps=steps0||Math.ceil(len*1.5), pts=[];
    for(let i=0;i<=steps;i++){ const t=i/steps, env=Math.min(1,Math.min(t,1-t)*5);
      const o=((caveVn(t*len/18,0.5,seed)*2-1)*wind+(caveVn(t*len/7,0.5,seed+1)*2-1)*wind*0.35)*env, r=rad*(0.7+0.8*caveVn(t*len/6,0.5,seed+2));
      const x=Math.min(W-5,Math.max(4,ax+dx*t+nx*o)), z=Math.min(H-5,Math.max(4,az+dz*t+nz*o)); stamp(x,z,r); pts.push([x,z]); }
    return pts;
  }
  edges.forEach((e,i)=>path(ch[e[0]].x,ch[e[0]].z,ch[e[1]].x,ch[e[1]].z,G.tw,G.wind,SEED+i*7+11));
  // ---- distance to rock (chamfer, cells) ----
  const dw=new Float32Array(N);
  function distToRock(){ const B=9999; for(let i=0;i<N;i++) dw[i]=open[i]?B:0;
    for(let z=1;z<H-1;z++) for(let x=1;x<W-1;x++){ const i=at(x,z); if(!open[i]) continue; dw[i]=Math.min(dw[i],dw[i-1]+1,dw[i-W]+1,dw[i-W-1]+1.4142,dw[i-W+1]+1.4142); }
    for(let z=H-2;z>=1;z--) for(let x=W-2;x>=1;x--){ const i=at(x,z); if(!open[i]) continue; dw[i]=Math.min(dw[i],dw[i+1]+1,dw[i+W]+1,dw[i+W+1]+1.4142,dw[i+W-1]+1.4142); } }
  // ---- side tunnels: grow from the open air into solid rock ----
  const dead=[];
  function rockClear(x,z,r,m){ const x0=Math.max(1,Math.floor(x-r-m)), x1=Math.min(W-2,Math.ceil(x+r+m)), z0=Math.max(1,Math.floor(z-r-m)), z1=Math.min(H-2,Math.ceil(z+r+m)), R=r+m;
    for(let zz=z0;zz<=z1;zz++) for(let xx=x0;xx<=x1;xx++){ const dx=xx+0.5-x, dz=zz+0.5-z; if(dx*dx+dz*dz<=R*R&&open[at(xx,zz)]) return false; } return inb(Math.floor(x),Math.floor(z),5); }
  function sideTunnel(len,rad,free,apply,rock){   // tries once; returns {pts,ex,ez} or null. free: the first steps may touch the open air
    distToRock();
    let sx=0,sz=0,found=false; for(let k=0;k<60&&!found;k++){ const x=ri(6,W-7), z=ri(6,H-7), i=at(x,z); if(open[i]&&dw[i]>=1.4&&dw[i]<=2.6){ sx=x; sz=z; found=true; } }
    if(!found) return null;
    let gx=dw[at(sx+1,sz)]-dw[at(sx-1,sz)], gz=dw[at(sx,sz+1)]-dw[at(sx,sz-1)], gl=Math.sqrt(gx*gx+gz*gz);
    let hx,hz; if(gl<0.2){ const d=CAVE_DIRS8[ri(0,7)]; hx=d[0]; hz=d[1]; } else { hx=-gx/gl; hz=-gz/gl; }   // toward the nearest rock
    let x=sx+0.5, z=sz+0.5; const pts=[]; const wob=rr(0.25,0.5);
    for(let i=0;i<len;i++){
      const n=caveVn(i*0.18,i*0.07,SEED+len*13+sx)*2-1; const px=-hz, pz=hx; hx+=px*n*wob; hz+=pz*n*wob; const l=Math.sqrt(hx*hx+hz*hz)||1; hx/=l; hz/=l;
      x+=hx; z+=hz; if(!inb(Math.floor(x),Math.floor(z),5)) return null;
      if(i>=free&&!rockClear(x,z,rad,rock)) return null;
      pts.push([x,z]);
    }
    return {pts,sx,sz};
  }
  const wantSide=G.side;
  for(let tries=0;tries<500&&dead.length<wantSide;tries++){
    const len=ri(16,30), t=sideTunnel(len,1.55,7,false,2.2); if(!t) continue;
    for(const p of t.pts) stamp(p[0],p[1],1.55); const e=t.pts[t.pts.length-1]; stamp(e[0],e[1],2.7); dead.push({x:e[0],z:e[1],len,sx:t.sx,sz:t.sz});
  }
  // ---- rough, then smooth the edges, keep the start's region ----
  { const flip=new Uint8Array(N); for(let z=2;z<H-2;z++) for(let x=2;x<W-2;x++){ const i=at(x,z), s=open[i-1]+open[i+1]+open[i-W]+open[i+W]; if(s>0&&s<4&&caveHash(x,z,SEED+5)<0.5) flip[i]=1; }
    for(let i=0;i<N;i++) if(flip[i]) open[i]=1-open[i]; }
  for(let pass=0;pass<2;pass++){ const nx=new Uint8Array(N); for(let z=2;z<H-2;z++) for(let x=2;x<W-2;x++){ let c=0; for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) c+=open[at(x+dx,z+dz)]; nx[at(x,z)]=c>=5?1:0; } open.set(nx); }
  const c0=ch[0], sc=at(Math.floor(c0.x),Math.floor(c0.z));
  { const keep=new Uint8Array(N), q=[sc]; keep[sc]=1; open[sc]=1; for(let h=0;h<q.length;h++){ const c=q[h], cx=c%W, cz=(c-cx)/W; for(const [dx,dz] of CAVE_NB4){ const nx=cx+dx, nz=cz+dz, ni=at(nx,nz); if(inb(nx,nz,1)&&open[ni]&&!keep[ni]){ keep[ni]=1; q.push(ni); } } }
    for(let i=0;i<N;i++) open[i]=keep[i]; }
  distToRock();
  // dead ends that survived the smoothing and are still pockets
  const deadOk=dead.filter(d=>{ const i=at(Math.floor(d.x),Math.floor(d.z)); return open[i]&&dw[i]>=1.4; });
  // ---- water, lava, hall pillars ----
  distToRock();
  const pools=[]; let pillars=[];
  const bigRooms=ch.filter(c=>c.role==='room').sort((a,b)=>b.r-a.r);
  if(G.pools>0){ let n=0; for(const c of bigRooms){ if(n>=G.pools) break; const i=at(Math.floor(c.x),Math.floor(c.z)); if(!open[i]||dw[i]<4) continue; const pr=Math.min(dw[i]-2,c.r*rr(0.32,0.45)); if(pr<1.8) continue; stamp(c.x,c.z,pr,water,1); pools.push({x:c.x,z:c.z,r:pr}); n++; } }
  if(G.flood){ for(const c of ch) if(c.kind==='hall'||c.role==='deep') for(let z=Math.floor(c.z-c.r*1.4);z<=Math.ceil(c.z+c.r*1.4);z++) for(let x=Math.floor(c.x-c.r*1.5);x<=Math.ceil(c.x+c.r*1.5);x++) if(inb(x,z,2)&&open[at(x,z)]&&Math.abs(x+0.5-c.x)<=(c.hx||c.r)+0.5&&Math.abs(z+0.5-c.z)<=(c.hz||c.r)+0.5) water[at(x,z)]=1; }
  if(G.pillars){ for(const c of ch) if(c.kind==='hall'){ for(let px=c.x-c.hx+4;px<=c.x+c.hx-3;px+=5.5) for(let pz=c.z-c.hz+4;pz<=c.z+c.hz-3;pz+=5.5){ const i=at(Math.floor(px),Math.floor(pz));
      if(dw[i]>=4&&!(Math.abs(px-c.x)<2.2&&Math.abs(pz-c.z)<2.2)) pillars.push({x:px,z:pz}); } }
    for(const p of pillars) stamp(p.x,p.z,1.05,open,0); }
  // ---- walking distance from the start ----
  function walkField(cellsOk){ const d=new Uint16Array(N).fill(65535), q=[sc]; d[sc]=0; const inQ=new Uint8Array(N); inQ[sc]=1;
    for(let h=0;h<q.length;h++){ const c=q[h]; inQ[c]=0; const cx=c%W, cz=(c-cx)/W;
      for(let k=0;k<8;k++){ const dd=CAVE_DIRS8[k], nx=cx+(dd[0]>0.5?1:dd[0]<-0.5?-1:0), nz=cz+(dd[1]>0.5?1:dd[1]<-0.5?-1:0), ni=at(nx,nz); if(!cellsOk[ni]) continue;
        const diag=k&1; if(diag&&(!cellsOk[at(nx,cz)]||!cellsOk[at(cx,nz)])) continue;
        const nd=d[c]+(diag?28:20); if(nd<d[ni]){ d[ni]=nd; if(!inQ[ni]){ inQ[ni]=1; q.push(ni); } } } if(q.length>4*N) break; }
    return d; }
  if(G.lava>0){   // lava pools and streaks anywhere the cave is wide enough: only where the rest of the cave stays one piece
    let n=0; const walk0=()=>{ const w=new Uint8Array(N); for(let i=0;i<N;i++) w[i]=open[i]&&!lava[i]?1:0; return w; };
    for(let tries=0;tries<600&&n<G.lava*2;tries++){ const x=ri(8,W-9), z=ri(8,H-9), i=at(x,z); if(!open[i]||lava[i]||dw[i]<2.3) continue;
      if((x-c0.x)*(x-c0.x)+(z-c0.z)*(z-c0.z)<(c0.r+10)*(c0.r+10)) continue;
      const lr=Math.min(dw[i]-0.9,rr(1.7,3.4)); if(lr<1.3) continue; const bak=lava.slice(), dd=CAVE_DIRS8[ri(0,7)], len=rr(1.5,4.5);
      for(let k=0;k<=3;k++) stamp(x+0.5+dd[0]*len*k/3,z+0.5+dd[1]*len*k/3,lr*(k===0||k===3?0.8:1),lava,1);
      const w=walk0(), d=walkField(w); let bad=false, total=0; for(let k=0;k<N;k++) if(w[k]){ total++; if(d[k]===65535){ bad=true; break; } }
      if(bad||total<50){ lava.set(bak); continue; } n++; }
  }
  // ---- the vault: a pocket in solid rock, shut by a short stretch of rock (the seal) ----
  let vault=null;
  for(let tries=0;tries<120&&!vault;tries++){
    const t=sideTunnel(ri(17,21),1.55,7,true,2.4); if(!t) continue;
    const seal=[], tmp=[]; t.pts.forEach((p,i)=>{ const r=1.55; const x0=Math.floor(p[0]-r), x1=Math.ceil(p[0]+r), z0=Math.floor(p[1]-r), z1=Math.ceil(p[1]+r);
      for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++){ const dx=x+0.5-p[0], dz=z+0.5-p[1]; if(dx*dx+dz*dz<=r*r){ const k=at(x,z); if(i<6){ if(!open[k]) seal.push(k); } else tmp.push(k); } } });
    if(seal.length<6) continue;
    const e=t.pts[t.pts.length-1]; if(!rockClear(e[0],e[1],2.7,2.0)) continue;
    for(const k of tmp) open[k]=1; stamp(e[0],e[1],2.7);
    vault={pocket:{x:e[0],z:e[1]},seal:[...new Set(seal)],sealAt:t.pts[2]};
  }
  const cells=new Uint8Array(N); for(let i=0;i<N;i++) cells[i]=open[i]&&!lava[i]?1:0;
  const dist=walkField(cells); let maxD=0; for(let i=0;i<N;i++) if(dist[i]!==65535&&dist[i]>maxD) maxD=dist[i];
  let river=[];
  if(G.river){   // follows the walking-distance field from the deepest chamber back toward the start, so it runs along the main way and is always wadeable
    let cx=Math.floor(ch[1].x), cz=Math.floor(ch[1].z); const riv=[];
    for(let k=0;k<4000;k++){ let best=dist[at(cx,cz)], bx=cx, bz=cz; for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++){ const v=dist[at(cx+dx,cz+dz)]; if(v<best){ best=v; bx=cx+dx; bz=cz+dz; } } if(bx===cx&&bz===cz) break; cx=bx; cz=bz; riv.push([cx+0.5,cz+0.5]); }
    riv.forEach((p,i)=>{ if(i>riv.length*0.12&&i<riv.length*0.92){ stamp(p[0],p[1],1.4,water,1); river.push({x:p[0]*CAVE_CELL,z:p[1]*CAVE_CELL}); } });
    river.reverse();   // from the start's side toward the deep end: the way it flows
  }
  // ---- heights at the cell corners ----
  const hgt=new Float32Array((W+1)*(H+1)), amp=F.gen&&F.gen.relief!==undefined?F.gen.relief:0.5;
  for(let j=0;j<=H;j++) for(let i=0;i<=W;i++){
    let wa=0, la=0; for(const [dx,dz] of [[-1,-1],[0,-1],[-1,0],[0,0]]){ const x=i+dx, z=j+dz; if(x>=0&&z>=0&&x<W&&z<H){ wa+=water[at(x,z)]; la+=lava[at(x,z)]; } }
    let h=(noise2(i*2*0.035,j*2*0.035)*0.6+noise2(i*2*0.11+7,j*2*0.11-3)*0.25)*amp;
    h-=wa/4*(F.gen&&F.gen.waterDepth!==undefined?F.gen.waterDepth:0.45); h-=la/4*1.1;
    hgt[j*(W+1)+i]=h;
  }
  const flat=(cx,cz,r,y)=>{ for(let j=Math.floor(cz-r-2);j<=Math.ceil(cz+r+2);j++) for(let i=Math.floor(cx-r-2);i<=Math.ceil(cx+r+2);i++){ if(i<0||j<0||i>W||j>H) continue; const d=Math.sqrt((i-cx)*(i-cx)+(j-cz)*(j-cz)); if(d>r+2) continue; const k=j*(W+1)+i, t=d<=r?1:1-(d-r)/2; hgt[k]+=(y-hgt[k])*t; } };
  flat(c0.x,c0.z,4.5,0);
  // ---- anchors ----
  const M=CAVE_CELL, m=v=>v*M, used=[];
  const cellAt=(x,z)=>at(Math.max(0,Math.min(W-1,Math.floor(x))),Math.max(0,Math.min(H-1,Math.floor(z))));
  const far=(x,z,d,list)=>{ for(const u of (list||used)){ const dx=u[0]-x, dz=u[1]-z; if(dx*dx+dz*dz<d*d) return false; } return true; };
  const normalAt=(x,z)=>caveWallNormal(dw,W,H,x,z);
  const pt=(x,z)=>({x:m(x),z:m(z)}), mark=(x,z)=>{ used.push([x,z]); };
  // chambers' depth, then roles
  const nb=ch.map(()=>[]); for(const e of edges){ nb[e[0]].push(e[1]); nb[e[1]].push(e[0]); }
  const depthAt=(x,z)=>{ let b=65535; for(let dz=-5;dz<=5;dz++) for(let dx=-5;dx<=5;dx++){ const v=dist[cellAt(x+dx,z+dz)]; if(v<b) b=v; } return b; };
  ch.forEach(c=>{ c.depth=depthAt(c.x,c.z)/10; c.deg=0; }); ch.forEach((c,i)=>{ c.deg=nb[i].length; c.id=i; });
  const startDir=nb[0].length?dirTo(c0,ch[nb[0][0]]):[1,0];
  const lift={x:m(c0.x),z:m(c0.z),r:2.2};
  const face=Math.atan2(startDir[0],startDir[1]);
  mark(c0.x,c0.z);
  const spotIn=(c,fr,dwMin,d0)=>{ for(let k=0;k<8;k++){ const d=CAVE_DIRS8[(d0+k)%8], x=c.x+d[0]*c.r*fr, z=c.z+d[1]*c.r*fr; if(cells[cellAt(x,z)]&&dw[cellAt(x,z)]>=dwMin&&water[cellAt(x,z)]===0&&far(x,z,4)) return [x,z]; } return null; };   // (cells, not open: lava is open air nobody can stand on)
  let sd=0; CAVE_DIRS8.forEach((d,k)=>{ if(d[0]*startDir[0]+d[1]*startDir[1]>CAVE_DIRS8[sd][0]*startDir[0]+CAVE_DIRS8[sd][1]*startDir[1]) sd=k; });
  const altarP=spotIn(c0,0.62,2,(sd+4)%8)||[c0.x,c0.z], anvilP=spotIn(c0,0.62,2,(sd+2)%8)||spotIn(c0,0.62,2,(sd+6)%8)||[c0.x+3,c0.z];
  mark(altarP[0],altarP[1]); mark(anvilP[0],anvilP[1]);
  const deepC=ch[1]; mark(deepC.x,deepC.z);
  const rooms=ch.filter(c=>c.role==='room');
  // the silent chamber: a leaf room, big enough to cross
  let eC=rooms.filter(c=>c.deg===1&&c.r>=6.5).sort((a,b)=>b.depth-a.depth)[0]||rooms.filter(c=>c.deg<=2).sort((a,b)=>b.r-a.r)[0]||rooms[0];
  const ePrev=nb[eC.id].length?ch[nb[eC.id][0]]:c0, eDir=dirTo(eC,ePrev);
  const eEntry=[eC.x+eDir[0]*eC.r*0.78,eC.z+eDir[1]*eC.r*0.78];
  const eShrine=[eC.x-eDir[0]*eC.r*0.55,eC.z-eDir[1]*eC.r*0.55], eExit=[eC.x+eDir[0]*(eC.r+4),eC.z+eDir[1]*(eC.r+4)];
  [[eC.x,eC.z],eEntry,eShrine].forEach(p=>mark(p[0],p[1]));
  // the echo trial: a mid-depth room with space
  const taken=new Set([eC.id]);
  let cC=rooms.filter(c=>!taken.has(c.id)&&c.r>=7).sort((a,b)=>Math.abs(a.depth-maxD/20)-Math.abs(b.depth-maxD/20))[0]||rooms.filter(c=>!taken.has(c.id))[0]; taken.add(cC.id); mark(cC.x,cC.z);
  // wall points
  const wallPool=[]; for(let z=2;z<H-2;z++) for(let x=2;x<W-2;x++){ const i=at(x,z); if(open[i]&&cells[i]&&!water[i]&&dw[i]>=1&&dw[i]<=1.5){ const cc=ch.reduce((b,c)=>{ const d=(c.x-x)*(c.x-x)+(c.z-z)*(c.z-z); return !b||d<b.d?{d,c}:b; },null); wallPool.push([x+0.5,z+0.5,cc.c.id]); } }
  const takeWall=(roomIds,minD,avoidStart)=>{   // a random wall point in one of these chambers, far from everything placed
    const list=wallPool.filter(w=>(!roomIds||roomIds.includes(w[2]))&&(!avoidStart||(w[0]-c0.x)*(w[0]-c0.x)+(w[1]-c0.z)*(w[1]-c0.z)>(c0.r+4)*(c0.r+4))&&far(w[0],w[1],minD));
    if(!list.length) return null; const w=list[Math.floor(rng()*list.length)], n=normalAt(w[0],w[1]); mark(w[0],w[1]); return {x:m(w[0]),z:m(w[1]),nx:n[0],nz:n[1]}; };
  const wallAny=(minD)=>takeWall(null,minD,true)||takeWall(null,minD/2,true)||{x:m(c0.x+3),z:m(c0.z),nx:-1,nz:0};
  const midRooms=rooms.filter(c=>!taken.has(c.id)).sort((a,b)=>a.depth-b.depth);
  const aRoom=midRooms.find(c=>c.depth>maxD/50&&c.depth<maxD*0.7/10)||midRooms[0]||cC;
  const A_wall=takeWall([aRoom.id],4,true)||wallAny(6);
  // mural pieces: five dead ends, spread out
  const dd=deadOk.slice(); const pieces=[];
  while(pieces.length<5&&dd.length){ let bi=0,bd=-1; dd.forEach((d,i)=>{ const md=pieces.length?Math.min(...pieces.map(p=>(p.x-d.x)*(p.x-d.x)+(p.z-d.z)*(p.z-d.z))):rng()*100; if(md>bd){ bd=md; bi=i; } }); const d=dd.splice(bi,1)[0]; pieces.push(d); mark(d.x,d.z); }
  while(pieces.length<5){ const w=wallAny(10); pieces.push({x:w.x/M,z:w.z/M}); }   // (a layout with too few dead ends still gets five places: on a wall)
  const B_geodes=[]; for(let k=0;k<3;k++){ const ids=rooms.filter(c=>c.id!==eC.id).sort((a,b)=>b.r-a.r).slice(0,Math.max(4,rooms.length-2)).map(c=>c.id); const w=takeWall(ids,16,true)||wallAny(8); B_geodes.push(w); }
  const burrows=[]; for(let k=0;k<3;k++){ const c=rooms.filter(r=>r.id!==eC.id&&r.id!==cC.id&&r.role==='room')[(k*3+1)%Math.max(1,rooms.length-2)]||rooms[k%rooms.length]; const p=spotIn(c,0.3,3,k*3)||[c.x,c.z]; mark(p[0],p[1]); burrows.push(pt(p[0],p[1])); }
  const holes=[]; for(let k=0;k<6;k++) holes.push(wallAny(18));
  const veins=[]; for(let k=0;k<8;k++) veins.push(wallAny(14));
  const herbs=[]; for(let tries=0;tries<400&&herbs.length<6;tries++){ const x=rr(8,W-8), z=rr(8,H-8), i=cellAt(x,z); if(cells[i]&&dw[i]>=2&&far(x,z,9)&&(x-c0.x)*(x-c0.x)+(z-c0.z)*(z-c0.z)>(c0.r+3)*(c0.r+3)){ mark(x,z); herbs.push(pt(x,z)); } }
  // camps: spread over the walkable cave, a level by walking distance
  const camps=[], lv=F.lv||[25,34], campPts=[];
  for(let tries=0;tries<3000&&camps.length<G.camps;tries++){
    const x=rr(6,W-6), z=rr(6,H-6), i=cellAt(x,z);
    if(!cells[i]||dw[i]<2.2||water[i]&&dw[i]<3) continue;
    if((x-c0.x)*(x-c0.x)+(z-c0.z)*(z-c0.z)<(c0.r+8)*(c0.r+8)) continue;
    if(!far(x,z,5)||!far(x,z,11,campPts)) continue;
    camps.push({x:m(x),z:m(z),lv:0,d:dist[i],r:Math.min(7,dw[i]*M*0.8)}); campPts.push([x,z]);
  }
  camps.sort((a,b)=>a.d-b.d||a.x-b.x||a.z-b.z);   // the level follows the walk from the start: the camps in order, each level of the band getting its share
  camps.forEach((c,k)=>{ c.lv=Math.min(lv[1],lv[0]+Math.floor(k/camps.length*(lv[1]-lv[0]+1))); delete c.d; });
  const sealCells=vault?vault.seal:[], vp=vault?pt(vault.pocket.x,vault.pocket.z):pt(c0.x,c0.z), sa=vault?pt(vault.sealAt[0],vault.sealAt[1]):pt(c0.x,c0.z);
  if(vault) for(const k of vault.seal){ cells[k]=0; open[k]=0; }
  const anchors={ start:{x:m(c0.x),z:m(c0.z),face}, lift, deep:pt(deepC.x,deepC.z),
    A:{wall:A_wall,pieces:pieces.map(p=>pt(p.x,p.z))}, B:{geodes:B_geodes}, C:{plinth:{x:m(cC.x),z:m(cC.z),r:m(cC.r*0.6)}},
    D:{crystal:pt(deepC.x,deepC.z),altar:pt(altarP[0],altarP[1])}, E:{entry:pt(eEntry[0],eEntry[1]),shrine:pt(eShrine[0],eShrine[1]),guard:pt(eC.x,eC.z),exit:pt(eExit[0],eExit[1])},
    F:{vault:vp,seal:sa}, G:{burrows,holes}, H:{veins,herbs,anvil:pt(anvilP[0],anvilP[1])} };
  const chambers=ch.map(c=>({x:m(c.x),z:m(c.z),r:m(c.r),kind:c.kind||'cavern',depth:c.depth,role:c.id===eC.id?'silent':c.id===cC.id?'echo':c.role,hx:c.hx?m(c.hx):0,hz:c.hz?m(c.hz):0}));
  return {n:F.n,w:W,h:H,cells,open,water,lava,hgt,dw,dist,size:[W*M,H*M],start:{x:anchors.start.x,z:anchors.start.z,face},lift,chambers,dead:deadOk.map(d=>pt(d.x,d.z)),pillars:pillars.map(p=>pt(p.x,p.z)),pools:pools.map(p=>({x:m(p.x),z:m(p.z),r:m(p.r)})),
    river,sealed:sealCells,anchors,camps,maxDepth:maxD/10,seed:SEED,style:G.style};
}
