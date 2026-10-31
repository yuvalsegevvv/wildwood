//@ Glowstones (the Deep Cave's Akari kind): place glow crystals so every floor tile is lit and no two crystals see each other; numbered rocks say how many crystals touch them. Seeded generator, one answer, checker
/* Agent map. definePuzzleKind 'akari'. Board {w, h, black: [cells] (rocks), num: {cell: 0..4} (the numbered rocks), sol: [bulb cells]}. Answer: the list of crystal cells. Cell = z*w+x.
   A crystal lights its row and column up to the next rock. Rules (akCheck): every non-rock cell lit, no crystal lit by another, each numbered rock has exactly that many crystals on its 4 neighbours.
   Generation: scatter rocks, find a lighting with a randomised search (akSolve), number every rock from it, then drop numbers while the answer stays unique (akSolve counts to 2). Sizes AK_D: 5, 6, 8, 10, 14.
   Test: tools/puzzles-smoke.js */
const AK_D=[null,{w:5,h:5,rock:0.16},{w:6,h:6,rock:0.17},{w:7,h:7,rock:0.18},{w:9,h:9,rock:0.18},{w:12,h:12,rock:0.18}];
// solve: count solutions up to limit; rng makes the first one random; cap = nodes
function akSolve(w,h,black,num,limit,cap,rng){
  const N=w*h, lit=new Int16Array(N), bulb=new Uint8Array(N), isB=new Uint8Array(N), ban=new Uint8Array(N); for(const c of black) isB[c]=1;
  const nbrs=c=>{ const x=c%w, z=(c/w)|0, o=[]; if(x>0)o.push(c-1); if(x<w-1)o.push(c+1); if(z>0)o.push(c-w); if(z<h-1)o.push(c+w); return o; };
  const NB=Array.from({length:N},(_,c)=>nbrs(c));
  const rays=Array.from({length:N},(_,c)=>{ if(isB[c]) return []; const out=[c], x0=c%w, z0=(c/w)|0; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ let x=x0+dx, z=z0+dz; while(x>=0&&z>=0&&x<w&&z<h&&!isB[z*w+x]){ out.push(z*w+x); x+=dx; z+=dz; } } return out; });
  const numCells=Object.keys(num).map(Number), cnt={}, room={};
  const bulbsAround=new Int8Array(N);
  let sols=0, nodes=0, aborted=false, first=null, second=null;
  const numOk=()=>{ for(const b of numCells){ const need=num[b]; let have=0, free=0; for(const q of NB[b]){ if(bulb[q]) have++; else if(!isB[q]&&lit[q]===0) free++; } if(have>need||have+free<need) return false; } return true; };
  function put(c,d){ bulb[c]=d>0?1:0; for(const q of rays[c]) lit[q]+=d; }
  function rec(){
    if(aborted||sols>=limit) return; if(++nodes>cap){ aborted=true; return; }
    let best=-1, bo=null;
    for(let c=0;c<N;c++) if(!isB[c]&&lit[c]===0){ const o=rays[c].filter(q=>lit[q]===0&&!ban[q]); if(!o.length) return; if(!bo||o.length<bo.length){ bo=o; best=c; if(o.length===1) break; } }
    if(best<0){ for(const b of numCells){ let have=0; for(const q of NB[b]) if(bulb[q]) have++; if(have!==num[b]) return; } sols++; const cur=[...Array(N).keys()].filter(c=>bulb[c]); if(!first) first=cur; else second=cur; return; }
    if(rng) for(let i=bo.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=bo[i]; bo[i]=bo[j]; bo[j]=t; }
    let k=0;   // a cell tried and left is banned for the later branches, so no answer is counted twice
    for(const c of bo){ put(c,1); if(numOk()) rec(); put(c,-1); ban[c]=1; k++; if(aborted||sols>=limit) break; }
    for(let i=0;i<k;i++) ban[bo[i]]=0;
  }
  rec(); return {sols,first,second,nodes,aborted};
}
function akGen(seed,diff){
  const D=AK_D[diff], w=D.w, h=D.h, N=w*h, rng=mulberry32(seed|0);
  for(let tries=0;tries<12;tries++){
    const black=[]; for(let c=0;c<N;c++) if(rng()<D.rock) black.push(c);
    // while the fully numbered board has two answers, wall off a cell the second answer uses (the planted answer is found again each round)
    let planted=null;
    for(let round=0;round<120&&black.length>=2;round++){
      if(!planted||!akCheck({w,h,black,num:{}},planted)){ const q=akSolve(w,h,black,{},1,8000,rng); if(!q.first){ black.pop(); planted=null; continue; } planted=q.first; }
      const s={first:planted};
      const isBulb=new Set(s.first), num={};
      for(const b of black){ let k=0; for(const q of [b-1,b+1,b-w,b+w]){ if(q<0||q>=N) continue; if((q===b-1&&b%w===0)||(q===b+1&&b%w===w-1)) continue; if(isBulb.has(q)) k++; } num[b]=k; }
      let r=akSolve(w,h,black,num,2,200000,null);
      if(r.aborted) break;
      if(r.sols===2){ const other=(r.second||[]).filter(c=>!isBulb.has(c)&&!black.includes(c)); const pick=other.length?other[Math.floor(rng()*other.length)]:-1; if(pick<0) break; black.push(pick); continue; }
      const order=black.slice(); for(let i=order.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=order[i]; order[i]=order[j]; order[j]=t; }
      for(const b of order){ const v=num[b]; delete num[b]; r=akSolve(w,h,black,num,2,200000,null); if(r.aborted||r.sols!==1) num[b]=v; }
      return {w,h,black,num,sol:s.first.slice()};
    }
  }
  return null;
}
function akCheck(B,ans){
  if(!B||!Array.isArray(ans)||ans.length>B.w*B.h) return false;
  const w=B.w, h=B.h, N=w*h, isB=new Uint8Array(N), bulb=new Uint8Array(N), lit=new Int16Array(N); for(const c of B.black) isB[c]=1;
  for(const c of ans){ if(!Number.isInteger(c)||c<0||c>=N||isB[c]||bulb[c]) return false; bulb[c]=1; }
  for(const c of ans){ const x0=c%w, z0=(c/w)|0; lit[c]++; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ let x=x0+dx, z=z0+dz; while(x>=0&&z>=0&&x<w&&z<h&&!isB[z*w+x]){ lit[z*w+x]++; x+=dx; z+=dz; } } }
  for(let c=0;c<N;c++){ if(isB[c]) continue; if(lit[c]===0) return false; if(bulb[c]&&lit[c]>1) return false; }
  for(const k in B.num){ const b=+k; let have=0; if(b%w>0&&bulb[b-1]) have++; if(b%w<w-1&&bulb[b+1]) have++; if(b>=w&&bulb[b-w]) have++; if(b<N-w&&bulb[b+w]) have++; if(have!==B.num[k]) return false; }
  return true;
}
definePuzzleKind({id:'akari',name:'Glowstones',land:'The Deep Cave',gen:akGen,check:akCheck,rate:B=>({size:B.w+'x'+B.h,rocks:B.black.length,numbers:Object.keys(B.num).length,crystals:B.sol.length})});
