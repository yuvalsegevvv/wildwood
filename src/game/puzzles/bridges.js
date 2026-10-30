//@ Rope bridges on the client: tap a peak, then a peak in line with it, to add a bridge; again for a second, again to remove
/* Agent map. PZV.bridges.mount(host,B,api,saved). State = bridge counts per candidate pair (brPairs). A bridge that would cross another is refused. Solved when brCheck passes. Test: client-smoke (loads), puzzles-smoke. */
PZV.bridges={mount(host,B,api,saved){
  const w=B.w, h=B.h, P=brPairs(B.isl), {cv,g,cs,px,py}=pzCanvas(host,w,h), val=new Int8Array(P.E.length);
  if(saved&&Array.isArray(saved.val)&&saved.val.length===val.length) saved.val.forEach((v,i)=>{ if(v===1||v===2) val[i]=v; });
  let sel=-1, won=false, bad=-1;
  const pos=q=>[(q.x+0.5)*cs,(q.z+0.5)*cs], inc=B.isl.map(()=>0);
  function draw(){
    g.clearRect(0,0,px,py); inc.fill(0);
    P.E.forEach((e,i)=>{ const v=val[i]; if(!v) return; inc[e.a]+=v; inc[e.b]+=v; const [x0,z0]=pos(B.isl[e.a]), [x1,z1]=pos(B.isl[e.b]); g.strokeStyle=i===bad?'#ff6b5e':'#d8c28a'; g.lineWidth=2.5;
      for(let k=0;k<v;k++){ const off=v===2?(k?3.5:-3.5):0; g.beginPath(); if(e.h){ g.moveTo(x0,z0+off); g.lineTo(x1,z1+off); } else { g.moveTo(x0+off,z0); g.lineTo(x1+off,z1); } g.stroke(); } });
    B.isl.forEach((q,i)=>{ const [x,z]=pos(q); g.fillStyle=i===sel?'#5cc3d6':'#1b252e'; g.strokeStyle=inc[i]===q.n?'#7fe39a':inc[i]>q.n?'#ff6b5e':'#8896a3'; g.lineWidth=2.5; g.beginPath(); g.arc(x,z,cs*0.36,0,6.283); g.fill(); g.stroke();
      g.fillStyle=i===sel?'#0b1a1f':'#e8eef4'; g.font='bold '+Math.floor(cs*0.46)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(q.n),x,z+1); });
  }
  cv.addEventListener('pointerdown',e=>{
    if(won) return; const r=cv.getBoundingClientRect(), x=Math.floor((e.clientX-r.left)/r.width*w), z=Math.floor((e.clientY-r.top)/r.height*h), i=B.isl.findIndex(q=>q.x===x&&q.z===z); bad=-1;
    if(i<0){ sel=-1; draw(); return; }
    if(sel<0||sel===i){ sel=sel===i?-1:i; draw(); return; }
    const ei=P.E.findIndex(q=>(q.a===sel&&q.b===i)||(q.a===i&&q.b===sel));
    if(ei<0){ sel=i; draw(); return; }
    const nv=(val[ei]+1)%3; if(nv>0&&P.cross[ei].some(c=>val[c])){ bad=ei; sel=-1; draw(); return; }
    val[ei]=nv; sel=-1; draw(); api.save({st:{val:Array.from(val)},secs:0});
    const ans=[]; P.E.forEach((q,k)=>{ if(val[k]) ans.push([Math.min(q.a,q.b),Math.max(q.a,q.b),val[k]]); }); if(brCheck(B,ans)){ won=true; api.solved(ans); }
  });
  draw();
  return { reset(){ val.fill(0); won=false; sel=-1; draw(); }, state(){ return {val:Array.from(val)}; } };
}};
