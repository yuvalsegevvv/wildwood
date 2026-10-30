//@ Rope bridges (the Greyspine's Hashiwokakero kind): join the peaks with straight bridges so each peak's number is how many it carries, bridges never cross, and every peak is reachable. Seeded generator, one answer, checker
/* Agent map. definePuzzleKind 'bridges'. Board {w, h, isl: [{x,z,n}], sol: [[a,b,k]]} (island indices a<b, k = 1 or 2 bridges). Answer: the list of [a,b,k] the player built.
   Rules (brCheck): bridges join two islands in a straight line with no island between, 1 or 2 per pair, none cross, each island's number is met, one connected network.
   Generation: grow an island tree by shooting straight bridges from a peak into free ground, add a few extra bridges that cross nothing, number each peak by its bridges, keep the board when brSolve finds
   one answer. The solver bounds each pair's bridge count by the peaks' numbers, kills crossings and checks the network is connectable. Sizes BR_D: 3 peaks, 6, 15 on 7x7, 30 on 10x10, 60 on 15x15. Test: tools/puzzles-smoke.js */
const BR_D=[null,{w:5,h:5,isl:3,extra:0},{w:6,h:6,isl:6,extra:0.2},{w:7,h:7,isl:15,extra:0.3},{w:10,h:10,isl:30,extra:0.3},{w:15,h:15,isl:60,extra:0.3}];
// candidate pairs of an island list: each island with the nearest island to its right and below (line of sight); crossers[e] = the pairs a bridge on e would cross
function brPairs(isl){
  const at=new Map(isl.map((q,i)=>[q.x+','+q.z,i])), E=[];
  for(let i=0;i<isl.length;i++){
    const q=isl[i];
    for(const [dx,dz] of [[1,0],[0,1]]){ let x=q.x+dx, z=q.z+dz; for(;x<=40&&z<=40;x+=dx,z+=dz){ const j=at.get(x+','+z); if(j!==undefined){ if(x-q.x+z-q.z>=2) E.push({a:i,b:j,x0:q.x,z0:q.z,x1:x,z1:z,h:dz===0}); break; } } }
  }
  const cross=E.map(()=>[]);
  for(let i=0;i<E.length;i++) for(let j=i+1;j<E.length;j++){ const p=E[i], r=E[j]; if(p.h===r.h) continue; const H=p.h?p:r, V=p.h?r:p; if(V.x0>H.x0&&V.x0<H.x1&&H.z0>V.z0&&H.z0<V.z1){ cross[i].push(j); cross[j].push(i); } }
  return {E,cross};
}
function brSolve(isl,limit,cap,P){
  P=P||brPairs(isl); const {E,cross}=P, M=E.length, inc=isl.map(()=>[]); E.forEach((e,i)=>{ inc[e.a].push(i); inc[e.b].push(i); });
  let sols=0, nodes=0, aborted=false, first=null;
  function prop(lo,hi){
    for(let ch=true;ch;){ ch=false;
      for(let i=0;i<isl.length;i++){ const n=isl[i].n; let mn=0, mx=0; for(const e of inc[i]){ mn+=lo[e]; mx+=hi[e]; } if(mn>n||mx<n) return false;
        for(const e of inc[i]){ const nh=Math.min(hi[e],n-(mn-lo[e])), nl=Math.max(lo[e],n-(mx-hi[e])); if(nh<hi[e]){ hi[e]=nh; ch=true; } if(nl>lo[e]){ lo[e]=nl; ch=true; } if(lo[e]>hi[e]) return false; } }
      for(let e=0;e<M;e++) if(lo[e]>0) for(const c of cross[e]) if(hi[c]>0){ if(lo[c]>0) return false; hi[c]=0; ch=true; }
    }
    // the network of pairs that may still carry a bridge must join every island
    const seen=new Uint8Array(isl.length), st=[0]; seen[0]=1; let got=1;
    while(st.length){ const u=st.pop(); for(const e of inc[u]) if(hi[e]>0){ const v=E[e].a===u?E[e].b:E[e].a; if(!seen[v]){ seen[v]=1; got++; st.push(v); } } }
    return got===isl.length;
  }
  function rec(lo,hi){
    if(aborted||sols>=limit) return; if(++nodes>cap){ aborted=true; return; }
    if(!prop(lo,hi)) return;
    let pick=-1, pd=9; for(let e=0;e<M;e++){ const d=hi[e]-lo[e]; if(d>0&&d<pd){ pd=d; pick=e; } }
    if(pick<0){   // all fixed: connected over the pairs with a bridge?
      const seen=new Uint8Array(isl.length), st=[0]; seen[0]=1; let got=1;
      while(st.length){ const u=st.pop(); for(const e of inc[u]) if(lo[e]>0){ const v=E[e].a===u?E[e].b:E[e].a; if(!seen[v]){ seen[v]=1; got++; st.push(v); } } }
      if(got!==isl.length) return; sols++; if(!first) first=E.map((e,i)=>[e.a,e.b,lo[i]]).filter(t=>t[2]>0); return;
    }
    for(let v=hi[pick];v>=lo[pick];v--){ const l2=Int8Array.from(lo), h2=Int8Array.from(hi); l2[pick]=v; h2[pick]=v; rec(l2,h2); if(aborted||sols>=limit) return; }
  }
  rec(new Int8Array(M),new Int8Array(M).fill(2)); return {sols,first,nodes,aborted};
}
function brGen(seed,diff){
  const D=BR_D[diff], w=D.w, h=D.h, rng=mulberry32(seed|0), ri=n=>Math.floor(rng()*n);
  for(let tries=0;tries<400;tries++){
    const isl=[{x:ri(w),z:ri(h),n:0}], occ=new Map([[isl[0].x+','+isl[0].z,0]]), used=new Set();   // used: cells a bridge covers
    const pairs=[]; let guard=0;
    while(isl.length<D.isl&&guard++<D.isl*600){
      const a=ri(isl.length), [dx,dz]=[[1,0],[-1,0],[0,1],[0,-1]][ri(4)], len=2+(rng()<0.7?ri(2):ri(Math.max(1,Math.min(w,h)-2)));
      let ok=true; const cells=[]; for(let s=1;s<=len;s++){ const x=isl[a].x+dx*s, z=isl[a].z+dz*s; if(x<0||z<0||x>=w||z>=h||occ.has(x+','+z)||used.has(x+','+z)){ ok=false; break; } cells.push([x,z]); }
      if(!ok) continue;
      const end=cells[cells.length-1], nx=end[0], nz=end[1];
      // the new peak may not touch another peak (it would see it at distance 1)
      if([[1,0],[-1,0],[0,1],[0,-1]].some(([ax,az])=>(ax!==-dx||az!==-dz)&&occ.has((nx+ax)+','+(nz+az)))) continue;
      isl.push({x:nx,z:nz,n:0}); occ.set(nx+','+nz,isl.length-1); for(const c of cells.slice(0,-1)) used.add(c[0]+','+c[1]); pairs.push([a,isl.length-1,1+ri(2)]);
    }
    if(isl.length<D.isl) continue;
    // extra bridges between peaks in line of sight that cross nothing
    const P=brPairs(isl), has=new Set(pairs.map(p=>Math.min(p[0],p[1])+'_'+Math.max(p[0],p[1]))), taken=P.E.map(()=>false);
    P.E.forEach((e,i)=>{ const key=Math.min(e.a,e.b)+'_'+Math.max(e.a,e.b); const idx=pairs.findIndex(p=>Math.min(p[0],p[1])===Math.min(e.a,e.b)&&Math.max(p[0],p[1])===Math.max(e.a,e.b)); if(idx>=0) taken[i]=true; });
    P.E.forEach((e,i)=>{ if(taken[i]||rng()>D.extra) return; if(P.cross[i].some(c=>taken[c])) return; pairs.push([e.a,e.b,1+ri(2)]); taken[i]=true; });
    const sol=pairs.map(p=>[Math.min(p[0],p[1]),Math.max(p[0],p[1]),p[2]]); for(const p of sol){ isl[p[0]].n+=p[2]; isl[p[1]].n+=p[2]; }
    if(isl.some(q=>q.n<1||q.n>8)) continue;
    const r=brSolve(isl,2,diff>=4?40000:8000,P);
    if(r.aborted||r.sols!==1) continue;
    return {w,h,isl,sol};
  }
  return null;
}
function brCheck(B,ans){
  if(!B||!Array.isArray(ans)||ans.length>400) return false;
  const P=brPairs(B.isl), idx=new Map(P.E.map((e,i)=>[Math.min(e.a,e.b)+'_'+Math.max(e.a,e.b),i])), val=new Int8Array(P.E.length), cnt=B.isl.map(()=>0);
  for(const t of ans){ if(!Array.isArray(t)||t.length!==3) return false; const a=Math.min(t[0],t[1]), b=Math.max(t[0],t[1]), k=t[2], e=idx.get(a+'_'+b); if(e===undefined||(k!==1&&k!==2)||val[e]) return false; val[e]=k; cnt[a]+=k; cnt[b]+=k; }
  for(let e=0;e<val.length;e++) if(val[e]) for(const c of P.cross[e]) if(val[c]) return false;
  if(B.isl.some((q,i)=>cnt[i]!==q.n)) return false;
  const seen=new Uint8Array(B.isl.length), st=[0]; seen[0]=1; let got=1;
  while(st.length){ const u=st.pop(); P.E.forEach((e,i)=>{ if(!val[i]) return; const v=e.a===u?e.b:e.b===u?e.a:-1; if(v>=0&&!seen[v]){ seen[v]=1; got++; st.push(v); } }); }
  return got===B.isl.length;
}
definePuzzleKind({id:'bridges',name:'Rope bridges',land:'Greyspine',gen:brGen,check:brCheck,rate:B=>({size:B.w+'x'+B.h,peaks:B.isl.length,bridges:B.sol.length})});
