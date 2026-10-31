//@ Sun mirrors (the Sunscar's kind): turn the glass mirrors so the beam reaches every target; prisms split a beam, coloured beams light only their own targets. Seeded generator (the beam is laid first, the mirrors turned afterwards) and the checker
/* Agent map. definePuzzleKind 'mirrors'. Board {w, h, src: [{x,z,d,c}] (a beam source: direction d 0 right / 1 down / 2 left / 3 up, colour c 0 white / 1 red / 2 blue), mir: [{x,z,o}] (o 0 '/', 1 '\\': the START orientation, scrambled),
   prism: [{x,z}] (fixed: splits a beam into both turns), tgt: [{x,z,c}] (c 0 = any colour), sol: [o...] (the orientations that work)}. Answer: the orientation list in mir order.
   mrTrace(B,orient) -> {lit: Map cell -> colour bitmask, segs: [[x0,z0,x1,z1,c]]} is the shared rule, drawn by the client too. Won when every target cell is crossed by a beam of its colour (c 0: any).
   Generation: lay the beam from a source, dropping mirrors and prisms as it goes (MR_D), choose targets on the beam after its first turn, add decoy mirrors off the beam, then turn every mirror at random until the board is not already solved.
   Not unique by design (any turning that lights every target is a win). Test: tools/puzzles-smoke.js */
const MR_D=[null,
  {w:6,h:6,mir:2,pr:0,tgt:1,src:1,decoy:0},{w:7,h:7,mir:3,pr:0,tgt:2,src:1,decoy:1},{w:9,h:9,mir:6,pr:1,tgt:3,src:2,decoy:2},
  {w:10,h:10,mir:8,pr:3,tgt:5,src:2,decoy:4},{w:12,h:12,mir:11,pr:4,tgt:6,src:3,decoy:6}];
const MR_DX=[1,0,-1,0], MR_DZ=[0,1,0,-1];
const mrBounce=(d,o)=>o===0?[3,2,1,0][d]:[1,0,3,2][d];   // '/' sends right->up, down->left, left->down, up->right; '\' sends right->down, down->right, left->up, up->left
function mrTrace(B,orient){
  const w=B.w, h=B.h, grid=new Int8Array(w*h).fill(-1), lit=new Map(), segs=[], seen=new Set();   // grid: -1 empty, 0-1 mirror index+10 handled below
  const mirAt=new Map(B.mir.map((m,i)=>[m.z*w+m.x,i])), prAt=new Set(B.prism.map(p=>p.z*w+p.x)), srcAt=new Set(B.src.map(s=>s.z*w+s.x));
  const todo=B.src.map(s=>({x:s.x,z:s.z,d:s.d,c:s.c}));
  while(todo.length){
    let {x,z,d,c}=todo.pop(), x0=x, z0=z, steps=0;
    for(;;){
      x+=MR_DX[d]; z+=MR_DZ[d]; if(x<0||z<0||x>=w||z>=h||++steps>200) break;
      const k=z*w+x, key=k*16+d*4+c; if(seen.has(key)) break; seen.add(key);
      if(srcAt.has(k)) break;
      lit.set(k,(lit.get(k)||0)|(1<<c));
      if(mirAt.has(k)){ segs.push([x0,z0,x,z,c]); d=mrBounce(d,orient[mirAt.get(k)]); x0=x; z0=z; }
      else if(prAt.has(k)){ segs.push([x0,z0,x,z,c]); todo.push({x,z,d:(d+1)%4,c},{x,z,d:(d+3)%4,c}); x0=x; z0=z; x0=-9; break; }
    }
    if(x0!==-9) segs.push([x0,z0,Math.max(0,Math.min(w-1,x)),Math.max(0,Math.min(h-1,z)),c]);
  }
  return {lit,segs};
}
function mrSolved(B,orient){ const L=mrTrace(B,orient).lit; return B.tgt.every(t=>{ const m=L.get(t.z*B.w+t.x)||0; return t.c===0?m>0:(m>>t.c&1)===1; }); }
function mrGen(seed,diff){
  const D=MR_D[diff], w=D.w, h=D.h, rng=mulberry32(seed|0), ri=n=>Math.floor(rng()*n);
  for(let tries=0;tries<200;tries++){
    const src=[], used=new Set(), mir=[], prism=[], sol=[], path=[];   // path: cells a beam crossed after a turn, with its colour
    for(let s=0;s<D.src;s++){
      const side=ri(4), col=D.src>1?s+1:0; let x,z,d;
      if(side===0){ x=0; z=1+ri(h-2); d=0; } else if(side===1){ x=w-1; z=1+ri(h-2); d=2; } else if(side===2){ z=0; x=1+ri(w-2); d=1; } else { z=h-1; x=1+ri(w-2); d=3; }
      if(used.has(z*w+x)) { s--; if(++tries>180) break; continue; }
      used.add(z*w+x); src.push({x,z,d,c:col});
    }
    if(src.length<D.src) continue;
    const beams=src.map(s=>({x:s.x,z:s.z,d:s.d,c:s.c,turned:false})); let guard=0;
    while(beams.length&&guard++<4000){
      const b=beams.pop(); let steps=0;
      for(;;){
        const nx=b.x+MR_DX[b.d], nz=b.z+MR_DZ[b.d]; if(nx<0||nz<0||nx>=w||nz>=h||++steps>60) break;
        const k=nz*w+nx; b.x=nx; b.z=nz;
        if(used.has(k)){ if(mir.some(m=>m.z*w+m.x===k)){ const m=mir.find(q=>q.z*w+q.x===k); b.d=mrBounce(b.d,sol[mir.indexOf(m)]); b.turned=true; continue; } break; }
        const left=(D.mir-mir.length)+(D.pr-prism.length);
        if(left>0&&rng()<0.3&&steps>=1&&!(nx===0||nz===0||nx===w-1||nz===h-1)){
          const wantPrism=prism.length<D.pr&&(mir.length>=D.mir||rng()<0.4);
          used.add(k);
          if(wantPrism){ prism.push({x:nx,z:nz}); beams.push({x:nx,z:nz,d:(b.d+1)%4,c:b.c,turned:true},{x:nx,z:nz,d:(b.d+3)%4,c:b.c,turned:true}); break; }
          const o=ri(2); mir.push({x:nx,z:nz,o}); sol.push(o); b.d=mrBounce(b.d,o); b.turned=true; continue;
        }
        if(b.turned) path.push([k,b.c]);
      }
    }
    if(mir.length<D.mir||prism.length<D.pr) continue;
    // targets: distinct cells on the beam after a turn, off mirrors, prisms, sources
    const cand=path.filter(([k])=>!used.has(k)); const tgt=[], tk=new Set();
    while(tgt.length<D.tgt&&cand.length>tk.size){ const [k,c]=cand[ri(cand.length)]; if(tk.has(k)) continue; tk.add(k); tgt.push({x:k%w,z:(k/w)|0,c:D.src>1?c:0}); }
    if(tgt.length<D.tgt) continue;
    for(let i=0;i<D.decoy;i++){ for(let t=0;t<60;t++){ const x=1+ri(w-2), z=1+ri(h-2), k=z*w+x; if(used.has(k)||tk.has(k)) continue; const o=ri(2); used.add(k); mir.push({x,z,o}); sol.push(o); break; } }
    const B={w,h,src,mir:mir.map(m=>({x:m.x,z:m.z,o:m.o})),prism,tgt,sol:sol.slice()};
    if(!mrSolved(B,sol)) continue;
    // a decoy must not be on the working beam (it would not be a decoy): the solved trace is the proof
    let o2; for(let t=0;t<40;t++){ o2=sol.map(()=>ri(2)); if(!mrSolved(B,o2)&&o2.some((v,i)=>v!==sol[i])) break; o2=null; }
    if(!o2) continue;
    B.mir.forEach((m,i)=>{ m.o=o2[i]; });
    return B;
  }
  return null;
}
function mrCheck(B,ans){ return !!B&&Array.isArray(ans)&&ans.length===B.mir.length&&ans.every(v=>v===0||v===1)&&mrSolved(B,ans); }
definePuzzleKind({id:'mirrors',name:'Sun mirrors',land:'Sunscar',gen:mrGen,check:mrCheck,rate:B=>({size:B.w+'x'+B.h,mirrors:B.mir.length,prisms:B.prism.length,targets:B.tgt.length,sources:B.src.length})});
