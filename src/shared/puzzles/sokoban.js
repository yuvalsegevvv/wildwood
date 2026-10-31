//@ Herding (the Amber Reach's Sokoban kind): push the calves into the kraal; the rooms are generated, the calves are pulled backwards out of the kraal so every board can be solved, and a push solver rejects dull ones
/* Agent map. definePuzzleKind 'sokoban'. Board {w, h, wall: [cells], goal: [cells], box: [cells], player, sol: a move string 'UDLR' (the generator's own solution), best: fewest pushes the solver proved or null}. Cell = z*w+x.
   Answer: the move string; skCheck replays it (a move into a box pushes it one cell if the next cell is free floor; won when every calf stands on the kraal).
   Generation: carve a room out of rectangles, add inner rocks that keep it connected, put the calves on the kraal, then pull them backwards SK_D.pulls times (a pull is a push in reverse, so the board is solvable);
   skSolve (breadth-first over calf positions with the player's reachable area folded in) measures the fewest pushes when it can finish, and the board must need at least SK_D.lo of them. Test: tools/puzzles-smoke.js */
const SK_D=[null,
  {w:7,h:6,box:1,pulls:6,lo:3,rects:2,rocks:1},{w:8,h:7,box:2,pulls:12,lo:5,rects:3,rocks:2},{w:9,h:8,box:3,pulls:22,lo:10,rects:3,rocks:3},
  {w:10,h:9,box:5,pulls:34,lo:20,rects:4,rocks:4},{w:12,h:11,box:8,pulls:110,lo:30,rects:4,rocks:9,far:24}];
const SK_DX={U:0,D:0,L:-1,R:1}, SK_DZ={U:-1,D:1,L:0,R:0}, SK_DIRS=['U','D','L','R'], SK_BACK={U:'D',D:'U',L:'R',R:'L'};
function skRoom(D,rng){
  const w=D.w, h=D.h, ri=n=>Math.floor(rng()*n), floor=new Uint8Array(w*h);
  for(let k=0;k<D.rects;k++){ const rw=3+ri(Math.max(1,w-5)), rh=3+ri(Math.max(1,h-5)), x0=1+ri(w-1-rw), z0=1+ri(h-1-rh); for(let z=z0;z<z0+rh&&z<h-1;z++) for(let x=x0;x<x0+rw&&x<w-1;x++) floor[z*w+x]=1; }
  const conn=()=>{ const cells=[]; floor.forEach((v,i)=>{ if(v) cells.push(i); }); if(!cells.length) return false; const seen=new Set([cells[0]]), st=[cells[0]]; while(st.length){ const u=st.pop(); for(const q of [u-1,u+1,u-w,u+w]) if(floor[q]&&!seen.has(q)){ seen.add(q); st.push(q); } } return seen.size===cells.length; };
  if(!conn()) return null;
  for(let k=0;k<D.rocks;k++){ for(let t=0;t<30;t++){ const x=1+ri(w-2), z=1+ri(h-2), i=z*w+x; if(!floor[i]) continue; floor[i]=0; if(conn()) break; floor[i]=1; } }
  let n=0; floor.forEach(v=>{ n+=v; }); return n>=D.box*3+6?floor:null;
}
function skStep(B,state,mv){   // state {p, box:Set-like array}; returns the new state or null when blocked; pushed = true when a calf moved
  const w=B.w, x=state.p%w+SK_DX[mv], z=((state.p/w)|0)+SK_DZ[mv];
  if(x<0||z<0||x>=w||z>=B.h) return null; const q=z*w+x; if(B.wallSet.has(q)) return null;
  const bi=state.box.indexOf(q);
  if(bi<0) return {p:q,box:state.box,pushed:false};
  const x2=x+SK_DX[mv], z2=z+SK_DZ[mv]; if(x2<0||z2<0||x2>=w||z2>=B.h) return null; const q2=z2*w+x2;
  if(B.wallSet.has(q2)||state.box.includes(q2)) return null;
  const nb=state.box.slice(); nb[bi]=q2; return {p:q,box:nb,pushed:true};
}
function skCheck(B,ans){
  if(!B||typeof ans!=='string'||ans.length>3000) return false;
  const S={w:B.w,h:B.h,wallSet:new Set(B.wall)}; let st={p:B.player,box:B.box.slice()};
  for(const mv of ans){ if(!Object.prototype.hasOwnProperty.call(SK_DX,mv)) return false; const n=skStep(S,st,mv); if(n) st=n; }
  return st.box.every(b=>B.goal.includes(b));
}
// fewest pushes (or null if the cap is hit): states are the calf set plus the lowest cell the player can reach
function skSolve(B,cap){
  const w=B.w, wall=new Set(B.wall), goal=new Set(B.goal);
  const reach=(p,box)=>{ const seen=new Set([p]), st=[p]; let low=p; while(st.length){ const u=st.pop(); for(const q of [u-1,u+1,u-w,u+w]) if(!wall.has(q)&&!seen.has(q)&&!box.includes(q)){ seen.add(q); st.push(q); if(q<low) low=q; } } return {seen,low}; };
  const key=(box,low)=>box.slice().sort((a,b)=>a-b).join(',')+'|'+low;
  const r0=reach(B.player,B.box), seen=new Set([key(B.box,r0.low)]); let front=[{box:B.box.slice(),seen:r0.seen}], depth=0, total=0;
  while(front.length){
    if(front.some(f=>f.box.every(b=>goal.has(b)))) return depth;
    const next=[]; depth++;
    for(const f of front){
      for(let bi=0;bi<f.box.length;bi++) for(const mv of SK_DIRS){
        const b=f.box[bi], from=b-SK_DX[mv]-SK_DZ[mv]*w, to=b+SK_DX[mv]+SK_DZ[mv]*w;
        if(!f.seen.has(from)||wall.has(to)||f.box.includes(to)) continue;
        const nb=f.box.slice(); nb[bi]=to; const r=reach(b,nb), k=key(nb,r.low); if(seen.has(k)) continue; seen.add(k); next.push({box:nb,seen:r.seen}); if(++total>cap) return null;
      }
    }
    front=next;
  }
  return -1;
}
function skGen(seed,diff){
  const D=SK_D[diff], w=D.w, h=D.h, rng=mulberry32(seed|0), ri=n=>Math.floor(rng()*n);
  for(let tries=0;tries<800;tries++){
    const floor=skRoom(D,rng); if(!floor) continue;
    const cells=[]; floor.forEach((v,i)=>{ if(v) cells.push(i); });
    const wall=[]; for(let i=0;i<w*h;i++) if(!floor[i]) wall.push(i);
    const wallSet=new Set(wall), pick=new Set(); while(pick.size<D.box) pick.add(cells[ri(cells.length)]);
    const goal=[...pick]; let box=goal.slice(), P=cells[ri(cells.length)]; while(box.includes(P)) P=cells[ri(cells.length)];
    const rev=[];   // reverse actions: [dir, pulled]
    const walk=(from,to)=>{   // shortest walk avoiding calves; returns the dirs or null
      if(from===to) return []; const prev=new Map([[from,null]]), q=[from];
      for(let i=0;i<q.length;i++){ const u=q[i]; for(const m of SK_DIRS){ const v=u+SK_DX[m]+SK_DZ[m]*w; if(wallSet.has(v)||box.includes(v)||prev.has(v)) continue; prev.set(v,[u,m]); if(v===to){ const out=[]; let c=v; while(prev.get(c)){ out.push(prev.get(c)[1]); c=prev.get(c)[0]; } return out.reverse(); } q.push(v); } }
      return null;
    };
    let done=0;
    for(let k=0;k<D.pulls*3&&done<D.pulls;k++){
      const bi=ri(box.length), e=SK_DIRS[ri(4)], b=box[bi], p=b+SK_DX[e]+SK_DZ[e]*w, p2=p+SK_DX[e]+SK_DZ[e]*w;   // player stands at b+e, steps to b+2e dragging the calf to b+e
      if(wallSet.has(p)||wallSet.has(p2)||box.includes(p)||box.includes(p2)) continue;
      const path=walk(P,p); if(!path) continue;
      for(const m of path) rev.push([m,0]); rev.push([e,1]); box[bi]=p; P=p2; done++;
    }
    if(done<D.pulls) continue;
    // every calf must have left its kraal cell, and not all of them by one step
    if(box.some((b,i)=>goal.includes(b))) continue;
    if(D.far){ let far=0; box.forEach((b,i)=>{ far+=Math.abs(b%w-goal[i]%w)+Math.abs(((b/w)|0)-((goal[i]/w)|0)); }); if(far<D.far) continue; }   // the calves must start far from their kraal cells (a calf pulled back and forth ends near home and is easy)
    const sol=rev.slice().reverse().map(([m])=>SK_BACK[m]).join('');
    const B={w,h,wall,goal,box,player:P,sol,best:null};
    if(!skCheck(B,sol)) continue;
    B.wallSet=new Set(wall); const best=skSolve(B,diff<=3?15000:6000); delete B.wallSet;
    if(best!==null&&best>=0){ if(best<D.lo) continue; B.best=best; }
    return B;
  }
  return null;
}
definePuzzleKind({id:'sokoban',name:'Herding',land:'Amber Reach',gen:skGen,check:skCheck,rate:B=>({size:B.w+'x'+B.h,calves:B.box.length,bestPushes:B.best,pathMoves:B.sol.length})});
