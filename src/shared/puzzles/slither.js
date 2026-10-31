//@ Coastlines (Slitherlink, the Emberwake Isles' kind; testing tools only until the isles exist): draw one closed shoreline round the grid so each number has that many of its four sides on it. Seeded generator, one answer, checker
/* Agent map. definePuzzleKind 'slither'. Board {w, h, clue: w*h numbers (-1 = none, else 0..3), sol: [edge ids]}. Edge ids: horizontal edges first, id = r*w+c (r 0..h, c 0..w-1), then vertical, id = hN + r*(w+1)+c (r 0..h-1, c 0..w), hN=(h+1)*w.
   Answer: the list of edge ids of the loop. Rules (slCheck): every corner has 0 or 2 edges, the edges form one single loop, every clue matches.
   Generation: grow a random region of cells with no holes and no pinched corners; its outline is the loop; number every cell, then take numbers out while slSolve (edge propagation + search) still finds one loop. Sizes SL_D: 5, 6, 8, 10, 15.
   Test: tools/puzzles-smoke.js */
const SL_D=[null,{w:5,h:5,fill:0.55,keep:0.55},{w:6,h:6,fill:0.55,keep:0.5},{w:7,h:7,fill:0.55,keep:0.5},{w:9,h:9,fill:0.55,keep:0.5},{w:12,h:12,fill:0.5,keep:0.5}];
function slGeom(w,h){
  const hN=(h+1)*w, E=hN+h*(w+1), vert=[], cellE=[];
  for(let r=0;r<=h;r++) for(let c=0;c<=w;c++){ const a=[]; if(c>0)a.push(r*w+c-1); if(c<w)a.push(r*w+c); if(r>0)a.push(hN+(r-1)*(w+1)+c); if(r<h)a.push(hN+r*(w+1)+c); vert.push(a); }
  const ends=new Array(E);
  for(let r=0;r<=h;r++) for(let c=0;c<w;c++) ends[r*w+c]=[r*(w+1)+c,r*(w+1)+c+1];
  for(let r=0;r<h;r++) for(let c=0;c<=w;c++) ends[hN+r*(w+1)+c]=[r*(w+1)+c,(r+1)*(w+1)+c];
  for(let r=0;r<h;r++) for(let c=0;c<w;c++) cellE.push([r*w+c,(r+1)*w+c,hN+r*(w+1)+c,hN+r*(w+1)+c+1]);
  return {hN,E,vert,ends,cellE};
}
function slSolve(w,h,clue,limit,cap,G){
  const {E,vert,ends,cellE}=G, V=vert.length; let sols=0, nodes=0, aborted=false, first=null;
  const par=new Int32Array(V), sz=new Int32Array(V), find=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; };
  const cl=[]; clue.forEach((k,i)=>{ if(k>=0) cl.push(i); });
  function propagate(ed){
    for(;;){
      let ch=false;
      for(const i of cl){ let inc=0, u=0; for(const e of cellE[i]){ if(ed[e]===1) inc++; else if(ed[e]===-1) u++; } const k=clue[i];
        if(inc>k||inc+u<k) return false;
        if(u&&inc===k){ for(const e of cellE[i]) if(ed[e]===-1) ed[e]=0; ch=true; } else if(u&&inc+u===k){ for(const e of cellE[i]) if(ed[e]===-1) ed[e]=1; ch=true; } }
      for(let v=0;v<V;v++){ let inc=0, u=0; for(const e of vert[v]){ if(ed[e]===1) inc++; else if(ed[e]===-1) u++; }
        if(inc>2) return false;
        if(inc===2&&u){ for(const e of vert[v]) if(ed[e]===-1) ed[e]=0; ch=true; }
        else if(inc===1){ if(u===0) return false; if(u===1){ for(const e of vert[v]) if(ed[e]===-1) ed[e]=1; ch=true; } }
        else if(inc===0&&u===1){ for(const e of vert[v]) if(ed[e]===-1) ed[e]=0; ch=true; } }
      // loops: a closed loop must hold every included edge, and then nothing else is added
      for(let v=0;v<V;v++){ par[v]=v; sz[v]=1; }
      let inc=0, closed=-1;
      for(let e=0;e<E;e++) if(ed[e]===1){ inc++; const a=find(ends[e][0]), b=find(ends[e][1]); if(a===b){ closed=a; } else { par[a]=b; sz[b]+=sz[a]; } }
      if(closed>=0){ const root=find(closed); let inComp=0; for(let e=0;e<E;e++) if(ed[e]===1&&find(ends[e][0])===root) inComp++; if(inComp!==inc) return false; for(let e=0;e<E;e++) if(ed[e]===-1){ ed[e]=0; ch=true; } }
      if(!ch) return true;
    }
  }
  function rec(ed){
    if(aborted||sols>=limit) return; if(++nodes>cap){ aborted=true; return; }
    if(!propagate(ed)) return;
    let pick=-1;
    for(let v=0;v<V&&pick<0;v++){ let inc=0, ue=-1; for(const e of vert[v]){ if(ed[e]===1) inc++; else if(ed[e]===-1) ue=e; } if(inc===1&&ue>=0) pick=ue; }
    if(pick<0) for(let e=0;e<E;e++) if(ed[e]===-1){ pick=e; break; }
    if(pick<0){   // everything decided: one loop, clues satisfied by propagation
      let inc=0; for(let e=0;e<E;e++) if(ed[e]===1) inc++; if(!inc) return;
      for(let v=0;v<V;v++){ par[v]=v; } let comps=0; const seen=new Set();
      for(let e=0;e<E;e++) if(ed[e]===1){ const a=find(ends[e][0]), b=find(ends[e][1]); if(a!==b) par[a]=b; }
      for(let e=0;e<E;e++) if(ed[e]===1) seen.add(find(ends[e][0]));
      if(seen.size!==1) return; sols++; if(!first) first=[...Array(E).keys()].filter(e=>ed[e]===1); return;
    }
    const a=Int8Array.from(ed), b=Int8Array.from(ed); a[pick]=1; b[pick]=0; rec(a); rec(b);
  }
  rec(new Int8Array(E).fill(-1)); return {sols,first,nodes,aborted};
}
function slRegion(w,h,fill,rng){
  const N=w*h, inR=new Uint8Array(N), target=Math.round(N*fill); let n=0;
  const ok=()=>{   // corners not pinched, outside (with the frame) in one piece
    for(let r=1;r<h;r++) for(let c=1;c<w;c++){ const a=inR[(r-1)*w+c-1], b=inR[(r-1)*w+c], d=inR[r*w+c-1], e=inR[r*w+c]; if(a===e&&b===d&&a!==b) return false; }
    const seen=new Uint8Array(N); let outN=0; for(let i=0;i<N;i++) if(!inR[i]) outN++;
    const st=[]; for(let i=0;i<N;i++){ const x=i%w, z=(i/w)|0; if(!inR[i]&&(x===0||z===0||x===w-1||z===h-1)){ seen[i]=1; st.push(i); } }
    let got=st.length; while(st.length){ const u=st.pop(), x=u%w, z=(u/w)|0; for(const q of [x>0?u-1:-1,x<w-1?u+1:-1,z>0?u-w:-1,z<h-1?u+w:-1]) if(q>=0&&!inR[q]&&!seen[q]){ seen[q]=1; got++; st.push(q); } }
    return got===outN;
  };
  const s=Math.floor(rng()*N); inR[s]=1; n=1;
  for(let tries=0;n<target&&tries<N*40;tries++){
    const c=Math.floor(rng()*N); if(inR[c]) continue; const x=c%w, z=(c/w)|0;
    if(!((x>0&&inR[c-1])||(x<w-1&&inR[c+1])||(z>0&&inR[c-w])||(z<h-1&&inR[c+w]))) continue;
    inR[c]=1; if(ok()) n++; else inR[c]=0;
  }
  return n>=target*0.8?inR:null;
}
function slGen(seed,diff){
  const D=SL_D[diff], w=D.w, h=D.h, N=w*h, rng=mulberry32(seed|0), G=slGeom(w,h);
  for(let tries=0;tries<30;tries++){
    const inR=slRegion(w,h,D.fill,rng); if(!inR) continue;
    const sol=[]; const inside=(r,c)=>r>=0&&c>=0&&r<h&&c<w&&inR[r*w+c]===1;
    for(let r=0;r<=h;r++) for(let c=0;c<w;c++) if(inside(r-1,c)!==inside(r,c)) sol.push(r*w+c);
    for(let r=0;r<h;r++) for(let c=0;c<=w;c++) if(inside(r,c-1)!==inside(r,c)) sol.push(G.hN+r*(w+1)+c);
    const on=new Set(sol), clue=G.cellE.map(es=>es.filter(e=>on.has(e)).length);
    let r=slSolve(w,h,clue,2,diff>=5?300000:60000,G); if(r.aborted||r.sols!==1) continue;
    const order=[...Array(N).keys()]; for(let i=N-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=order[i]; order[i]=order[j]; order[j]=t; }
    let left=N; const want=Math.round(N*D.keep);   // stop taking numbers out at a share of the board: the last few numbers cost the most search and add little difficulty
    for(const i of order){ if(left<=want) break; const v=clue[i]; clue[i]=-1; r=slSolve(w,h,clue,2,diff>=5?300000:60000,G); if(r.aborted||r.sols!==1) clue[i]=v; else left--; }
    return {w,h,clue,sol};
  }
  return null;
}
function slCheck(B,ans){
  if(!B||!Array.isArray(ans)) return false;
  const G=slGeom(B.w,B.h), on=new Uint8Array(G.E); if(ans.length>G.E) return false; for(const e of ans){ if(!Number.isInteger(e)||e<0||e>=G.E||on[e]) return false; on[e]=1; }
  if(!ans.length) return false;
  for(const vs of G.vert){ let k=0; for(const e of vs) if(on[e]) k++; if(k!==0&&k!==2) return false; }
  for(let i=0;i<B.clue.length;i++) if(B.clue[i]>=0){ let k=0; for(const e of G.cellE[i]) if(on[e]) k++; if(k!==B.clue[i]) return false; }
  const par=G.vert.map((_,i)=>i), find=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; };
  for(const e of ans){ const a=find(G.ends[e][0]), b=find(G.ends[e][1]); if(a!==b) par[a]=b; }
  return new Set(ans.map(e=>find(G.ends[e][0]))).size===1;
}
definePuzzleKind({id:'slither',name:'Coastlines',land:'Emberwake Isles',gen:slGen,check:slCheck,rate:B=>({size:B.w+'x'+B.h,clues:B.clue.filter(k=>k>=0).length,loop:B.sol.length})});
