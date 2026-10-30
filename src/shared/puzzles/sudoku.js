//@ Shrine tiles (the Sakura Vale's Sudoku kind): fill the grid with blossom glyphs so none repeats in a row, column or box; a seeded generator that keeps one answer, and the checker
/* Agent map. definePuzzleKind 'sudoku'. Board {n, bh, bw (box height and width), given: n*n digits (0 = blank), sol}. Answer: n*n digits 1..n. Cell = r*n+c.
   Generation: a random full grid (backtracking over shuffled digits), then clues are taken out in a random order while the solver (suCount) still finds exactly one answer. Difficulty SU_D: grid size and how many
   clues are taken out; the expert board must also NOT fall to naked / hidden singles alone (suSingles), so it needs real deduction; the hard one must fall to them.
   Test: tools/puzzles-smoke.js; the lab: tools/puzzle-lab.js. */
const SU_D=[null,{n:4,bh:2,bw:2,blank:3,singles:1},{n:4,bh:2,bw:2,blank:8,singles:1},{n:6,bh:2,bw:3,blank:18,singles:1},{n:9,bh:3,bw:3,blank:46,singles:1},{n:9,bh:3,bw:3,blank:58,singles:0}];
function suPeers(n,bh,bw){
  const P=[]; for(let r=0;r<n;r++) for(let c=0;c<n;c++){ const s=new Set(); for(let k=0;k<n;k++){ s.add(r*n+k); s.add(k*n+c); } const r0=r-r%bh, c0=c-c%bw; for(let i=0;i<bh;i++) for(let j=0;j<bw;j++) s.add((r0+i)*n+c0+j); s.delete(r*n+c); P.push([...s]); }
  return P;
}
// count solutions up to limit (cap on nodes); returns {sols, first, nodes, aborted}
function suCount(n,bh,bw,grid,limit,cap,peers){
  const N=n*n, g=Int8Array.from(grid), full=(1<<n)-1; let sols=0, nodes=0, first=null, aborted=false;
  const cand=c=>{ let m=full; for(const q of peers[c]) if(g[q]) m&=~(1<<(g[q]-1)); return m; };
  const pop=m=>{ let k=0; while(m){ m&=m-1; k++; } return k; };
  function rec(){
    if(aborted||sols>=limit) return; if(++nodes>cap){ aborted=true; return; }
    let best=-1, bm=0, bc=99;
    for(let c=0;c<N;c++) if(!g[c]){ const m=cand(c), k=pop(m); if(k===0) return; if(k<bc){ bc=k; best=c; bm=m; if(k===1) break; } }
    if(best<0){ sols++; if(!first) first=Array.from(g); return; }
    for(let d=0;d<n;d++) if(bm>>d&1){ g[best]=d+1; rec(); g[best]=0; if(aborted||sols>=limit) return; }
  }
  rec(); return {sols,first,nodes,aborted};
}
// solved by naked singles and hidden singles only?
function suSingles(n,bh,bw,grid,peers){
  const N=n*n, g=Int8Array.from(grid), full=(1<<n)-1, units=[];
  for(let r=0;r<n;r++){ const u=[]; for(let c=0;c<n;c++) u.push(r*n+c); units.push(u); }
  for(let c=0;c<n;c++){ const u=[]; for(let r=0;r<n;r++) u.push(r*n+c); units.push(u); }
  for(let r0=0;r0<n;r0+=bh) for(let c0=0;c0<n;c0+=bw){ const u=[]; for(let i=0;i<bh;i++) for(let j=0;j<bw;j++) u.push((r0+i)*n+c0+j); units.push(u); }
  const cand=c=>{ let m=full; for(const q of peers[c]) if(g[q]) m&=~(1<<(g[q]-1)); return m; };
  for(let ch=true;ch;){ ch=false;
    for(let c=0;c<N;c++) if(!g[c]){ const m=cand(c); if(m&&!(m&(m-1))){ g[c]=Math.log2(m)+1; ch=true; } }
    for(const u of units) for(let d=0;d<n;d++){ let at=-1, k=0; for(const c of u){ if(g[c]===d+1){ k=-9; break; } if(!g[c]&&(cand(c)>>d&1)){ k++; at=c; } } if(k===1){ g[at]=d+1; ch=true; } }
  }
  return g.every(v=>v>0);
}
function suFull(n,bh,bw,rng,peers){
  const g=new Int8Array(n*n);
  function rec(c){
    if(c===n*n) return true; const used=new Set(); for(const q of peers[c]) if(g[q]) used.add(g[q]);
    const ds=[]; for(let d=1;d<=n;d++) if(!used.has(d)) ds.push(d);
    for(let i=ds.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=ds[i]; ds[i]=ds[j]; ds[j]=t; }
    for(const d of ds){ g[c]=d; if(rec(c+1)) return true; } g[c]=0; return false;
  }
  rec(0); return Array.from(g);
}
function suGen(seed,diff){
  const D=SU_D[diff], n=D.n, N=n*n, rng=mulberry32(seed|0), peers=suPeers(n,D.bh,D.bw);
  for(let tries=0;tries<60;tries++){
    const sol=suFull(n,D.bh,D.bw,rng,peers), given=sol.slice(), order=[...Array(N).keys()];
    for(let i=N-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=order[i]; order[i]=order[j]; order[j]=t; }
    let blanks=0;
    for(const c of order){ if(blanks>=D.blank) break; const v=given[c]; given[c]=0; const r=suCount(n,D.bh,D.bw,given,2,20000,peers); if(r.sols===1&&!r.aborted) blanks++; else given[c]=v; }
    if(blanks<D.blank) continue;
    if(suSingles(n,D.bh,D.bw,given,peers)!==!!D.singles) continue;
    return {n,bh:D.bh,bw:D.bw,given,sol};
  }
  return null;
}
function suCheck(B,ans){
  if(!B||!Array.isArray(ans)||ans.length!==B.n*B.n) return false;
  const n=B.n, peers=suPeers(n,B.bh,B.bw);
  for(let c=0;c<n*n;c++){ const v=ans[c]; if(!Number.isInteger(v)||v<1||v>n) return false; if(B.given[c]&&B.given[c]!==v) return false; for(const q of peers[c]) if(ans[q]===v) return false; }
  return true;
}
definePuzzleKind({id:'sudoku',name:'Shrine tiles',land:'Sakura Vale',gen:suGen,check:suCheck,rate:B=>({size:B.n+'x'+B.n,clues:B.given.filter(Boolean).length})});
