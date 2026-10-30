//@ Shrouds (the Gloamhorn's Nonogram kind): fill the grid from the row and column clues to reveal a picture, a memory of the Crown War; a library of pictures drawn in code, a seeded picker that keeps only pictures the clues pin down, and the checker
/* Agent map. definePuzzleKind 'nonogram'. Board {n, rows: [[run lengths]], cols, pic (the picture's name), sol: n*n 0/1}. Answer: n*n 0/1 (1 = filled). Cell = r*n+c. Won when the filled cells' runs equal the clues.
   The picture library NG_PICS: name -> (u,v,t) => bool, shapes in a unit square (u across, v down) tested at each cell centre; t is a thickness jitter. A seeded draw flips, shifts and thickens a picture
   (ngRender); a candidate is kept only when ngSolve (line solving, then a short search) finds exactly one answer. Trivial and easy 5x5 boards also draw from NG_SIL, a symmetric-silhouette maker.
   Sizes NG_D: 5, 5, 10, 15, 20. Test: tools/puzzles-smoke.js */
const NG_D=[null,{n:5,pics:0},{n:5,pics:1},{n:10,pics:2},{n:15,pics:2},{n:20,pics:2}];
const ngR=(u,v,x0,y0,x1,y1)=>u>=x0&&u<=x1&&v>=y0&&v<=y1;
const ngC=(u,v,cx,cy,r)=>(u-cx)*(u-cx)+(v-cy)*(v-cy)<=r*r;
function ngP(u,v,pts){ let ins=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i],[xj,yj]=pts[j]; if(((yi>v)!==(yj>v))&&(u<(xj-xi)*(v-yi)/(yj-yi)+xi)) ins=!ins; } return ins; }
const NG_PICS={
  crown:(u,v,t)=>ngR(u,v,0.14,0.62,0.86,0.82)||ngP(u,v,[[0.14,0.62],[0.14,0.3],[0.32,0.5],[0.5,0.22],[0.68,0.5],[0.86,0.3],[0.86,0.62]])||ngC(u,v,0.14,0.26,0.05+t)||ngC(u,v,0.5,0.18,0.05+t)||ngC(u,v,0.86,0.26,0.05+t),
  lamp:(u,v,t)=>ngC(u,v,0.5,0.55,0.26+t)&&v>0.32||ngR(u,v,0.38,0.12,0.62,0.34)||ngR(u,v,0.3,0.8,0.7,0.9)||ngP(u,v,[[0.5,0.03],[0.56,0.12],[0.44,0.12]]),
  banner:(u,v,t)=>ngR(u,v,0.12,0.06,0.18+t,0.94)||ngP(u,v,[[0.18,0.12],[0.88,0.12],[0.88,0.62],[0.53,0.5],[0.18,0.62]])&&u>0.18,
  ship:(u,v,t)=>ngP(u,v,[[0.1,0.62],[0.9,0.62],[0.74,0.84],[0.26,0.84]])||ngR(u,v,0.48-t/2,0.1,0.54+t/2,0.62)||ngP(u,v,[[0.56,0.14],[0.56,0.56],[0.86,0.56]])||ngP(u,v,[[0.46,0.2],[0.46,0.56],[0.2,0.56]]),
  skull:(u,v,t)=>(ngC(u,v,0.5,0.42,0.34+t)||ngR(u,v,0.3,0.55,0.7,0.84))&&!ngC(u,v,0.36,0.42,0.09)&&!ngC(u,v,0.64,0.42,0.09)&&!ngP(u,v,[[0.5,0.52],[0.45,0.64],[0.55,0.64]])&&!ngR(u,v,0.4,0.72,0.43,0.84)&&!ngR(u,v,0.57,0.72,0.6,0.84),
  leaf:(u,v,t)=>(ngC(u,v,0.34,0.62,0.5+t)&&ngC(u,v,0.66,0.38,0.5+t))&&!(ngR(u,v,0,0,1,1)&&Math.abs(u-v)<0.02&&false)||ngR(u,v,0.1,0.85,0.5,0.9),
  key:(u,v,t)=>(ngC(u,v,0.28,0.5,0.2+t)&&!ngC(u,v,0.28,0.5,0.08))||ngR(u,v,0.46,0.46,0.92,0.56)||ngR(u,v,0.72,0.56,0.8,0.74)||ngR(u,v,0.84,0.56,0.92,0.7),
  sword:(u,v,t)=>ngP(u,v,[[0.5,0.02],[0.58,0.14],[0.58,0.66],[0.42,0.66],[0.42,0.14]])||ngR(u,v,0.26,0.66,0.74,0.74+t)||ngR(u,v,0.46,0.74,0.54,0.9)||ngC(u,v,0.5,0.92,0.06),
  tree:(u,v,t)=>ngP(u,v,[[0.5,0.04],[0.78,0.4],[0.62,0.4],[0.88,0.7],[0.12,0.7],[0.38,0.4],[0.22,0.4]])||ngR(u,v,0.44-t/2,0.7,0.56+t/2,0.94),
  star:(u,v)=>{ const pts=[]; for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, r=i%2?0.2:0.48; pts.push([0.5+Math.cos(a)*r,0.52+Math.sin(a)*r]); } return ngP(u,v,pts); },
  heart:(u,v,t)=>ngC(u,v,0.32,0.34,0.22+t)||ngC(u,v,0.68,0.34,0.22+t)||ngP(u,v,[[0.1,0.42],[0.9,0.42],[0.5,0.92]]),
  fish:(u,v,t)=>(ngC(u,v,0.42,0.5,0.3+t)&&ngR(u,v,0,0.15,0.8,0.85))&&!ngC(u,v,0.3,0.44,0.05)||ngP(u,v,[[0.68,0.5],[0.94,0.22],[0.94,0.78]]),
  tower:(u,v,t)=>ngR(u,v,0.28,0.3,0.72,0.94)&&!ngR(u,v,0.44,0.7,0.56,0.94)||ngR(u,v,0.22,0.12,0.34,0.3)||ngR(u,v,0.44,0.12,0.56,0.3)||ngR(u,v,0.66,0.12,0.78,0.3),
  flame:(u,v,t)=>ngP(u,v,[[0.5,0.04],[0.78,0.4],[0.84,0.7],[0.66,0.94],[0.34,0.94],[0.16,0.7],[0.24,0.42],[0.4,0.56]])&&!ngC(u,v,0.5,0.8,0.1),
  shield:(u,v,t)=>ngP(u,v,[[0.14,0.1],[0.86,0.1],[0.86,0.52],[0.5,0.94],[0.14,0.52]])&&!ngR(u,v,0.46,0.22,0.54,0.7)&&!ngR(u,v,0.3,0.34,0.7,0.42),
  anchor:(u,v,t)=>ngC(u,v,0.5,0.14,0.08+t/2)||ngR(u,v,0.46,0.2,0.54,0.86)||ngR(u,v,0.3,0.3,0.7,0.38)||((ngC(u,v,0.5,0.62,0.4)&&!ngC(u,v,0.5,0.62,0.31))&&v>0.62),
  moon:(u,v,t)=>ngC(u,v,0.5,0.5,0.42+t)&&!ngC(u,v,0.66,0.42,0.34),
  bell:(u,v,t)=>ngP(u,v,[[0.5,0.1],[0.7,0.3],[0.78,0.72],[0.9,0.8],[0.1,0.8],[0.22,0.72],[0.3,0.3]])||ngC(u,v,0.5,0.88,0.07)
};
const NG_NAMES=Object.keys(NG_PICS);
function ngRender(name,n,flip,du,dv,t){
  const f=NG_PICS[name], g=new Uint8Array(n*n);
  for(let r=0;r<n;r++) for(let c=0;c<n;c++){ let u=(c+0.5)/n, v=(r+0.5)/n; if(flip) u=1-u; u+=du; v+=dv; g[r*n+c]=f(u,v,t)?1:0; }
  return g;
}
function ngSil(n,rng){   // a symmetric silhouette: the left half drawn at random, mirrored
  const g=new Uint8Array(n*n), half=Math.ceil(n/2);
  for(let r=0;r<n;r++) for(let c=0;c<half;c++){ const v=rng()<0.55?1:0; g[r*n+c]=v; g[r*n+n-1-c]=v; }
  return g;
}
function ngClue(line){ const out=[]; let k=0; for(const v of line){ if(v) k++; else if(k){ out.push(k); k=0; } } if(k) out.push(k); return out; }
function ngClues(g,n){ const rows=[], cols=[]; for(let r=0;r<n;r++) rows.push(ngClue(Array.from(g.slice(r*n,r*n+n)))); for(let c=0;c<n;c++){ const l=[]; for(let r=0;r<n;r++) l.push(g[r*n+c]); cols.push(ngClue(l)); } return {rows,cols}; }
// line solver: given cells (-1 unknown, 0, 1) and a clue, narrow them; returns false on contradiction
function ngLine(cells,clue,n){
  const k=clue.length, canB=new Uint8Array(n), canW=new Uint8Array(n);
  // f[i][j]: first i cells hold the first j runs, with cell i-1 white or the run's last cell... standard DP over (pos, run index)
  const memo=new Map();
  function fit(i,j){   // can cells i.. hold runs j.. ?
    const key=i*(k+1)+j; if(memo.has(key)) return memo.get(key); let ok=false;
    if(j===k){ ok=true; for(let q=i;q<n;q++) if(cells[q]===1){ ok=false; break; } }
    else if(i>=n) ok=false;
    else {
      if(cells[i]!==1&&fit(i+1,j)) ok=true;   // cell i white
      if(!ok){ const L=clue[j]; if(i+L<=n){ let good=true; for(let q=i;q<i+L;q++) if(cells[q]===0){ good=false; break; } if(good&&(i+L===n||cells[i+L]!==1)&&fit(i+L+1>n?n:i+L+1,j+1)) ok=true; } }
    }
    memo.set(key,ok); return ok;
  }
  if(!fit(0,0)) return false;
  // mark what each cell can be, walking all consistent placements
  const seen=new Set();
  function walk(i,j){
    const key=i*(k+1)+j; if(seen.has(key)) return; seen.add(key);
    if(j===k){ for(let q=i;q<n;q++) canW[q]=1; return; }
    if(i>=n) return;
    if(cells[i]!==1&&fit(i+1,j)){ canW[i]=1; walk(i+1,j); }
    const L=clue[j]; if(i+L<=n){ let good=true; for(let q=i;q<i+L;q++) if(cells[q]===0){ good=false; break; } if(good&&(i+L===n||cells[i+L]!==1)&&fit(i+L+1>n?n:i+L+1,j+1)){ for(let q=i;q<i+L;q++) canB[q]=1; if(i+L<n) canW[i+L]=1; walk(i+L+1>n?n:i+L+1,j+1); } }
  }
  walk(0,0);
  for(let q=0;q<n;q++){ if(cells[q]===-1){ if(canB[q]&&!canW[q]) cells[q]=1; else if(canW[q]&&!canB[q]) cells[q]=0; else if(!canB[q]&&!canW[q]) return false; } }
  return true;
}
function ngSolve(n,rows,cols,limit,cap){
  let sols=0, nodes=0, aborted=false, first=null;
  function settle(g){   // line solving to a fixed point
    for(let ch=true;ch;){ ch=false;
      for(let r=0;r<n;r++){ const line=Array.from(g.slice(r*n,r*n+n)), before=line.join(); if(!ngLine(line,rows[r],n)) return false; if(line.join()!==before){ ch=true; for(let c=0;c<n;c++) g[r*n+c]=line[c]; } }
      for(let c=0;c<n;c++){ const line=[]; for(let r=0;r<n;r++) line.push(g[r*n+c]); const before=line.join(); if(!ngLine(line,cols[c],n)) return false; if(line.join()!==before){ ch=true; for(let r=0;r<n;r++) g[r*n+c]=line[r]; } }
    }
    return true;
  }
  function rec(g){
    if(aborted||sols>=limit) return; if(++nodes>cap){ aborted=true; return; }
    if(!settle(g)) return;
    let at=-1; for(let i=0;i<n*n;i++) if(g[i]===-1){ at=i; break; }
    if(at<0){ sols++; if(!first) first=Array.from(g); return; }
    for(const v of [1,0]){ const h=Int8Array.from(g); h[at]=v; rec(h); if(aborted||sols>=limit) return; }
  }
  rec(new Int8Array(n*n).fill(-1)); return {sols,first,nodes,aborted};
}
function ngGen(seed,diff){
  const D=NG_D[diff], n=D.n, rng=mulberry32(seed|0);
  for(let tries=0;tries<400;tries++){
    let g, name;
    if(D.pics===0||(D.pics===1&&rng()<0.5)){ g=ngSil(n,rng); name='silhouette'; }
    else { name=NG_NAMES[Math.floor(rng()*NG_NAMES.length)]; g=ngRender(name,n,rng()<0.5,(rng()-0.5)*0.06,(rng()-0.5)*0.06,(rng()-0.5)*0.06); }
    let filled=0; for(const v of g) filled+=v; if(filled<n*n*0.22||filled>n*n*0.75) continue;
    const {rows,cols}=ngClues(g,n); if(rows.every(r=>r.length===0)) continue;
    const r=ngSolve(n,rows,cols,2,n>=15?4000:1500); if(r.aborted||r.sols!==1) continue;
    return {n,rows,cols,pic:name,sol:Array.from(g)};
  }
  return null;
}
function ngCheck(B,ans){
  if(!B||!Array.isArray(ans)||ans.length!==B.n*B.n) return false;
  const n=B.n, g=ans.map(v=>v===1?1:v===0?0:-1); if(g.includes(-1)) return false;
  const {rows,cols}=ngClues(g,n);
  return JSON.stringify(rows)===JSON.stringify(B.rows)&&JSON.stringify(cols)===JSON.stringify(B.cols);
}
definePuzzleKind({id:'nonogram',name:'Shrouds',land:'Gloamhorn',gen:ngGen,check:ngCheck,rate:B=>({size:B.n+'x'+B.n,picture:B.pic,filled:B.sol.filter(Boolean).length})});
