//@ Ice slide (the Hoarfrost Reach's kind): a stone slides until it hits rock; stop it on the rune. Switches to light, twin stones and cracking tiles at the higher difficulties; a seeded generator and the move-replay checker
/* Agent map. definePuzzleKind 'iceslide'. Board {w,h,rock:[cells], start:[a] or [a,b] (twin stones move together), goal:[..] (same length), sw:[switch cells], cr:[cracking cells], best (the fewest moves), sol (a move string)}. Cell = z*w+x.
   Rules (icStep): one move slides every stone in a direction until the next cell is rock, a cracked tile or the edge; a switch is lit by a stone passing over it or stopping on it; a cracking tile breaks (becomes rock)
   once a stone has slid off it or over it; stones pass through each other. Won when every stone rests on its own rune (stone i on goal i) and every switch is lit. The answer is the move string ('U','D','L','R').
   Generation: scatter rock, switches and cracking tiles from the seed, breadth-first search every state, pick a winning state whose shortest solution lies in the difficulty's band [lo,hi]. Difficulty IC_D:
   1 trivial 5x5 / 2-3 moves, 2 easy 7x7 / 4-6, 3 normal 9x9 with two switches, 4 hard 12x12 with twin stones, 5 extreme 12x12 twin stones, a switch and cracking tiles.
   Not in this version (plan section 2): pushable blocks. Test: tools/puzzles-smoke.js */
const IC_D=[null,
  {w:5,h:5,rock:5,sw:0,cr:0,twin:0,lo:2,hi:3},
  {w:7,h:7,rock:10,sw:0,cr:0,twin:0,lo:4,hi:6},
  {w:9,h:9,rock:16,sw:2,cr:0,twin:0,lo:7,hi:10},
  {w:12,h:12,rock:26,sw:0,cr:0,twin:1,lo:9,hi:14},
  {w:12,h:12,rock:24,sw:1,cr:5,twin:1,lo:13,hi:20}];
const IC_DIRS={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]}, IC_KEYS=['U','D','L','R'];
// one move from state s = {pos:[..], lit:int mask, brk:int mask}; B is the board with rockSet / swIdx / crIdx made by icPrep; returns the next state (the same when nothing moves)
function icPrep(B){
  const P={rock:new Uint8Array(B.w*B.h),sw:new Int8Array(B.w*B.h).fill(-1),cr:new Int8Array(B.w*B.h).fill(-1)};
  for(const c of B.rock) P.rock[c]=1; B.sw.forEach((c,i)=>P.sw[c]=i); B.cr.forEach((c,i)=>P.cr[c]=i); return P;
}
function icStep(B,P,s,dir){
  const [dx,dz]=IC_DIRS[dir], pos=[]; let lit=s.lit, brk=s.brk;
  for(const a of s.pos){
    let x=a%B.w, z=(a/B.w)|0; const i0=a;
    if(P.sw[i0]>=0) lit|=1<<P.sw[i0];
    for(;;){
      const nx=x+dx, nz=z+dz; if(nx<0||nz<0||nx>=B.w||nz>=B.h) break;
      const n=nz*B.w+nx; if(P.rock[n]) break; if(P.cr[n]>=0&&(s.brk>>P.cr[n]&1)) break;
      if(P.cr[x+z*B.w]>=0&&(x+z*B.w)!==i0) brk|=1<<P.cr[x+z*B.w];   // a cracking tile slid over breaks behind the stone
      x=nx; z=nz; if(P.sw[n]>=0) lit|=1<<P.sw[n];
    }
    if(x+z*B.w!==i0&&P.cr[i0]>=0) brk|=1<<P.cr[i0];   // ...and the one the stone started on
    pos.push(z*B.w+x);
  }
  return {pos,lit,brk};
}
const icKey=(B,s)=>s.pos.join(',')+'|'+s.lit+'|'+s.brk;
const icWon=(B,s)=>s.pos.every((c,i)=>c===B.goal[i])&&s.lit===(1<<B.sw.length)-1;
function icCheck(B,ans){
  if(!B||typeof ans!=='string'||ans.length>400) return false;
  const P=icPrep(B); let s={pos:B.start.slice(),lit:0,brk:0};
  if(s.pos.some(c=>P.sw[c]>=0)) for(const c of s.pos) if(P.sw[c]>=0) s.lit|=1<<P.sw[c];
  for(const ch of ans){ if(!Object.prototype.hasOwnProperty.call(IC_DIRS,ch)) return false; s=icStep(B,P,s,ch); }
  return icWon(B,s);
}
// breadth-first search from the start over every state; dist keyed by icKey. Returns {order (states in discovery order), dist, from (parent key and move)}
function icSearch(B,cap){
  const P=icPrep(B), s0={pos:B.start.slice(),lit:0,brk:0}; for(const c of s0.pos) if(P.sw[c]>=0) s0.lit|=1<<P.sw[c];
  const dist=new Map(), from=new Map(), order=[s0], k0=icKey(B,s0); dist.set(k0,0);
  for(let i=0;i<order.length&&order.length<cap;i++){
    const s=order[i], d=dist.get(icKey(B,s));
    for(const dir of IC_KEYS){ const n=icStep(B,P,s,dir), k=icKey(B,n); if(dist.has(k)) continue; dist.set(k,d+1); from.set(k,[icKey(B,s),dir]); order.push(n); }
  }
  return {order,dist,from,k0};
}
function icPath(B,R,s){ let k=icKey(B,s), out=''; while(R.from.has(k)){ const [pk,dir]=R.from.get(k); out=dir+out; k=pk; } return out; }
function icGen(seed,diff){
  const D=IC_D[diff], w=D.w, h=D.h, N=w*h, rng=mulberry32(seed|0), ri=n=>Math.floor(rng()*n);
  for(let tries=1;tries<=400;tries++){
    const taken=new Set(), pick=()=>{ for(let t=0;t<200;t++){ const c=ri(N); if(!taken.has(c)){ taken.add(c); return c; } } return -1; };
    const start=[pick()]; if(D.twin) start.push(pick());
    const rock=[]; for(let i=0;i<D.rock;i++){ const c=pick(); if(c>=0) rock.push(c); }
    const sw=[], cr=[]; for(let i=0;i<D.sw;i++) sw.push(pick()); for(let i=0;i<D.cr;i++) cr.push(pick());
    const B={w,h,rock,start,goal:start.slice(),sw,cr};
    const R=icSearch(B,60000);
    // winning candidates: every switch lit, a resting spot per stone that is a goal in its own right; the goal is the state, so pick a state and make its positions the runes
    const cands=[]; for(const s of R.order){ if(s.lit!==(1<<sw.length)-1) continue; const d=R.dist.get(icKey(B,s)); if(d>=D.lo&&d<=D.hi&&s.pos.every((c,i)=>start.indexOf(c)<0||true)) cands.push(s); }
    if(!cands.length) continue;
    const s=cands[ri(cands.length)];
    // the runes must not be a place a stone merely passes: they are resting cells by construction (the state's positions). Rune cells must not be a start or a rock.
    if(s.pos.some(c=>start.includes(c))) continue;
    if(D.twin&&s.pos[0]===s.pos[1]) continue;
    B.goal=s.pos.slice();
    // the shortest solution to THIS goal (the same state or an earlier one with the goal positions and every switch lit)
    let best=1e9, bs=null; for(const t of R.order){ if(t.lit===(1<<sw.length)-1&&t.pos.every((c,i)=>c===B.goal[i])){ const d=R.dist.get(icKey(B,t)); if(d<best){ best=d; bs=t; } } }
    if(best<D.lo) continue;
    B.best=best; B.sol=icPath(B,R,bs); B.states=R.order.length;
    return B;
  }
  return null;
}
definePuzzleKind({id:'iceslide',name:'Ice slide',land:'Hoarfrost Reach',gen:icGen,check:icCheck,
  rate:B=>({size:B.w+'x'+B.h,stones:B.start.length,switches:B.sw.length,cracks:B.cr.length,best:B.best,states:B.states})});
