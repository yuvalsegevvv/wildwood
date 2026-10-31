//@ Rootlines (the Flow Free kind, the home forest's): join same-coloured seeds with roots that fill the board; a seeded generator that keeps only boards with ONE solution, and the checker
/* Agent map. definePuzzleKind 'rootlines'. Board {w,h,k,ends:[[a,b],...] (cell = z*w+x), sol: the k paths}. Answer: an array of k paths (cell indices, path i from ends[i][0] to ends[i][1]).
   Generation: cut the board into k paths by randomly joining the ends of one-cell paths (rlPartition), then count solutions with rlSolve (a depth-first search that always extends the colour with the fewest moves,
   pruned by dead cells and by a head that can no longer reach its seed); a board is kept when it has exactly one. Only integer maths and mulberry32: the client and the server build the same board.
   Difficulty table RL_D: [w,h,k, min path length]. Test: tools/puzzles-smoke.js; the lab: tools/puzzle-lab.js. */
const RL_D=[null,{w:4,h:4,k:2,min:2,kmax:4,cap:3000,merge:200,round:20000},{w:5,h:5,k:3,min:2,kmax:6,cap:5000,merge:200,round:20000},{w:7,h:7,k:4,min:3,kmax:9,cap:20000,merge:200,round:20000},{w:9,h:9,k:5,min:3,kmax:24,cap:30000,merge:30,round:2500},{w:12,h:12,k:7,min:3,kmax:36,cap:30000,merge:14,round:2500}];
function rlNb(w,h){ const nb=[]; for(let z=0;z<h;z++) for(let x=0;x<w;x++){ const a=[]; if(x>0)a.push(z*w+x-1); if(x<w-1)a.push(z*w+x+1); if(z>0)a.push((z-1)*w+x); if(z<h-1)a.push((z+1)*w+x); nb.push(a); } return nb; }
// k paths that tile the board: a random Hamiltonian path (the "backbite" walk: snake first, then reversing a stretch whenever an end touches another cell of the path), cut into k pieces of at least minLen cells
function rlPartition(w,h,k,rng,nb,minLen){
  const N=w*h, path=[]; for(let z=0;z<h;z++) for(let x=0;x<w;x++) path.push(z%2?z*w+(w-1-x):z*w+x);
  for(let it=0;it<N*30;it++){
    const front=rng()<0.5; if(!front) path.reverse();
    const end=path[0], cands=nb[end].filter(q=>q!==path[1]); if(!cands.length){ if(!front) path.reverse(); continue; }
    const q=cands[Math.floor(rng()*cands.length)], j=path.indexOf(q);
    const head=path.slice(0,j).reverse(); for(let t=0;t<head.length;t++) path[t]=head[t];   // reverse the stretch before q, so q's old neighbour becomes the new first cell
    if(!front) path.reverse();
  }
  // cut points: k-1 of the N-1 gaps, each piece at least minLen long
  for(let tries=0;tries<200;tries++){
    const cuts=new Set(); while(cuts.size<k-1) cuts.add(1+Math.floor(rng()*(N-1)));
    const c=[0,...[...cuts].sort((a,b)=>a-b),N]; let ok=true; for(let i=1;i<c.length;i++) if(c[i]-c[i-1]<minLen){ ok=false; break; }
    if(ok){ const out=[]; for(let i=1;i<c.length;i++) out.push(path.slice(c[i-1],c[i])); return out; }
  }
  return null;
}
// Count the solutions (up to limit) of a board of seeds. Edge by edge: every cell wants two roots (a seed one), no root may close a loop or join two colours; those rules are pushed to a fixpoint
// (a cell with only as many open edges as it still needs takes them all), then the search branches on an open edge. nodes is capped; `aborted` says the cap was hit.
function rlSolve(w,h,ends,limit,cap,nb){
  const N=w*h, k=ends.length, E=[], eAt=[]; for(let c=0;c<N;c++) eAt.push([]);
  for(let c=0;c<N;c++) for(const q of nb[c]) if(q>c){ eAt[c].push(E.length); eAt[q].push(E.length); E.push([c,q]); }
  const seedCol=new Int8Array(N).fill(-1); ends.forEach((e,i)=>{ seedCol[e[0]]=i; seedCol[e[1]]=i; });
  let sols=0, nodes=0, aborted=false, first=null, second=null;
  const par=new Int16Array(N), ccol=new Int8Array(N);
  const find=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; };
  // returns false on a contradiction; ed is changed in place
  function propagate(ed){
    for(;;){
      for(let c=0;c<N;c++){ par[c]=c; ccol[c]=seedCol[c]; }
      for(let e=0;e<E.length;e++) if(ed[e]===1){
        const a=find(E[e][0]), b=find(E[e][1]); if(a===b) return false;
        if(ccol[a]>=0&&ccol[b]>=0&&ccol[a]!==ccol[b]) return false;
        par[a]=b; if(ccol[b]<0) ccol[b]=ccol[a];
      }
      let changed=false;
      for(let e=0;e<E.length;e++) if(ed[e]===-1){
        const a=find(E[e][0]), b=find(E[e][1]);
        if(a===b||(ccol[a]>=0&&ccol[b]>=0&&ccol[a]!==ccol[b])){ ed[e]=0; changed=true; }
      }
      for(let c=0;c<N;c++){
        const need=seedCol[c]>=0?1:2; let inc=0, open=0; for(const e of eAt[c]){ if(ed[e]===1) inc++; else if(ed[e]===-1) open++; }
        if(inc>need||inc+open<need) return false;
        if(open&&inc===need){ for(const e of eAt[c]) if(ed[e]===-1) ed[e]=0; changed=true; }
        else if(open&&inc+open===need){ for(const e of eAt[c]) if(ed[e]===-1) ed[e]=1; changed=true; }
      }
      if(!changed) return true;
    }
  }
  function cellColours(ed){ for(let c=0;c<N;c++){ par[c]=c; ccol[c]=seedCol[c]; } for(let e=0;e<E.length;e++) if(ed[e]===1){ const a=find(E[e][0]), b=find(E[e][1]); par[a]=b; if(ccol[b]<0) ccol[b]=ccol[a]; } return Array.from({length:N},(_,c)=>ccol[find(c)]+1); }
  function rec(ed){
    if(aborted||sols>=limit) return;
    if(++nodes>cap){ aborted=true; return; }
    if(!propagate(ed)) return;
    let pick=-1, best=9;
    for(let c=0;c<N;c++){ let open=0, inc=0; for(const e of eAt[c]){ if(ed[e]===-1) open++; else if(ed[e]===1) inc++; } if(open&&open<best){ best=open; pick=c; } }
    if(pick<0){   // every cell has its roots: all that is left to ask is that each colour's two seeds meet (the colour rule above already forbids a mixed path)
      for(let c=0;c<N;c++) if(seedCol[c]>=0&&ccol[find(c)]<0) return;
      const cc=cellColours(ed); for(let i=0;i<k;i++){ if(find(ends[i][0])!==find(ends[i][1])) return; }
      if(first&&cc.join()===first.join()) return;   // the same colouring routed differently inside a colour is the same answer for the player
      sols++; if(!first) first=cc; else second=cc; return;
    }
    const e=eAt[pick].find(x=>ed[x]===-1), a=Int8Array.from(ed), b=Int8Array.from(ed); a[e]=1; b[e]=0;
    rec(a); rec(b);
  }
  rec(new Int8Array(E.length).fill(-1));
  return {sols,nodes,aborted,first,second};
}
// fewer seeds, longer roots: join two paths whose ends touch whenever the board still has exactly one answer (the old answer stays valid, so only a second one can appear)
function rlMinimise(parts,w,h,nb,rng,cap,budget){   // budget: at most this many solver runs (the big boards would take seconds otherwise)
  for(let again=true;again&&budget>0;){
    again=false; const cand=[];
    for(let i=0;i<parts.length;i++) for(let j=i+1;j<parts.length;j++) for(const ei of [0,1]) for(const ej of [0,1]){
      const a=parts[i], b=parts[j], u=ei?a[a.length-1]:a[0], v=ej?b[b.length-1]:b[0]; if(nb[u].includes(v)) cand.push([i,j,ei,ej]);
    }
    for(let t=cand.length-1;t>0;t--){ const q=Math.floor(rng()*(t+1)), x=cand[t]; cand[t]=cand[q]; cand[q]=x; }
    for(const [i,j,ei,ej] of cand){
      if(--budget<0) break;
      const a=ei?parts[i].slice():parts[i].slice().reverse(), b=ej?parts[j].slice().reverse():parts[j].slice(), m=a.concat(b);
      const next=parts.filter((_,x)=>x!==i&&x!==j).concat([m]), r=rlSolve(w,h,next.map(p=>[p[0],p[p.length-1]]),2,cap,nb);
      if(!r.aborted&&r.sols===1){ parts=next; again=true; break; }
    }
  }
  return parts;
}
// Start from a few long paths and, while the board has more than one answer, cut a path in two where the two answers differ (the cut adds two seeds, so the old answer stays valid and the other one dies): ends on a board with exactly one answer
function rlGen(seed,diff){
  const D=RL_D[diff], w=D.w, h=D.h, nb=rlNb(w,h), rng=mulberry32(seed|0), cap=D.cap;
  for(let tries=1;tries<=40;tries++){
    let parts=rlPartition(w,h,D.k,rng,nb,D.min); if(!parts) continue;
    for(let round=0;round<60&&parts.length<=D.kmax;round++){
      const ends=parts.map(p=>[p[0],p[p.length-1]]), r=rlSolve(w,h,ends,2,Math.min(cap,D.round),nb);   // (a cheap cap while the board still has many answers: an aborted round just cuts again)
      if(!r.aborted&&r.sols===1){ parts=rlMinimise(parts,w,h,nb,rng,cap,D.merge); const e2=parts.map(p=>[p[0],p[p.length-1]]); return {w,h,k:parts.length,ends:e2,sol:parts,nodes:rlSolve(w,h,e2,2,cap,nb).nodes,tries,rounds:round}; }
      const diffCell=new Set(); if(r.second) for(let c=0;c<w*h;c++) if(r.first[c]!==r.second[c]) diffCell.add(c);
      const opts=[]; parts.forEach((p,pi)=>{ for(let t=D.min-1;t<=p.length-D.min;t++) if(!diffCell.size||diffCell.has(p[t])||diffCell.has(p[t-1])) opts.push([pi,t]); });
      const any=opts.length?opts:(()=>{ const o=[]; parts.forEach((p,pi)=>{ for(let t=D.min-1;t<=p.length-D.min;t++) o.push([pi,t]); }); return o; })();
      if(!any.length) break;
      const [pi,t]=any[Math.floor(rng()*any.length)], p=parts[pi]; parts.splice(pi,1,p.slice(0,t),p.slice(t));
    }
  }
  return null;   // the caller treats null as "could not generate": tools/puzzles-smoke.js fails the kind and difficulty
}
function rlCheck(B,ans){
  if(!B||!Array.isArray(ans)||ans.length!==B.k) return false;
  const nb=rlNb(B.w,B.h), N=B.w*B.h, used=new Uint8Array(N);
  for(let i=0;i<B.k;i++){
    const P=ans[i]; if(!Array.isArray(P)||P.length<2||P.length>N) return false;
    if(P[0]!==B.ends[i][0]||P[P.length-1]!==B.ends[i][1]) return false;
    for(let j=0;j<P.length;j++){ const c=P[j]; if(!Number.isInteger(c)||c<0||c>=N||used[c]) return false; used[c]=1; if(j&&!nb[P[j-1]].includes(c)) return false; }
  }
  for(let c=0;c<N;c++) if(!used[c]) return false;
  return true;
}
definePuzzleKind({id:'rootlines',name:'Rootlines',land:'Wildwood',
  gen:rlGen, check:rlCheck,
  rate:B=>({size:B.w+'x'+B.h,pairs:B.k,nodes:B.nodes,tries:B.tries})});
