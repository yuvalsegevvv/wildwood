//@ Rope bridges on the client: tap a peak, then a peak in line with it, to add a bridge; again for a second, again to remove
/* Agent map. PZV.bridges.mount(host,B,api,saved). State = bridge counts per candidate pair (brPairs). A bridge that would cross another is refused. Solved when brCheck passes. Test: client-smoke (loads), puzzles-smoke. */
PZV.bridges={mount(host,B,api,saved){
  const w=B.w, h=B.h, P=brPairs(B.isl), {cv,g,cs,px,py}=pzCanvas(host,w,h), val=new Int8Array(P.E.length);
  if(saved&&Array.isArray(saved.val)&&saved.val.length===val.length) saved.val.forEach((v,i)=>{ if(v===1||v===2) val[i]=v; });
  let sel=-1, won=false, bad=-1;
  const pos=q=>[(q.x+0.5)*cs,(q.z+0.5)*cs], inc=B.isl.map(()=>0);
  function draw(){   // the Greyspine: a misty chasm, granite peaks with snow caps, rope-and-plank bridges between them
    g.clearRect(0,0,px,py); const bg=g.createLinearGradient(0,0,0,py); bg.addColorStop(0,'#26323d'); bg.addColorStop(1,'#10171d'); g.fillStyle=bg; g.fillRect(0,0,px,py);
    for(let i=0;i<w*h;i++){ if(pzHash(i,4)<0.12){ g.fillStyle='#ffffff0c'; g.beginPath(); g.ellipse((i%w+0.5)*cs,((i/w)|0)*cs+cs*0.5,cs*0.7,cs*0.22,0,0,6.283); g.fill(); } }
    inc.fill(0);
    P.E.forEach((e,i)=>{ const v=val[i]; if(!v) return; inc[e.a]+=v; inc[e.b]+=v; const [x0,z0]=pos(B.isl[e.a]), [x1,z1]=pos(B.isl[e.b]), L=Math.hypot(x1-x0,z1-z0);
      for(let k=0;k<v;k++){ const off=v===2?(k?cs*0.17:-cs*0.17):0, ax=e.h?0:off, az=e.h?off:0;
        g.strokeStyle=i===bad?'#ff6b5e':'#6b4a2b'; g.lineWidth=cs*0.16; g.beginPath(); g.moveTo(x0+ax,z0+az); g.lineTo(x1+ax,z1+az); g.stroke();   // the plank deck
        g.strokeStyle=i===bad?'#ffb0a8':'#b78a54'; g.lineWidth=Math.max(1,cs*0.05); g.setLineDash([cs*0.1,cs*0.1]); g.beginPath(); g.moveTo(x0+ax,z0+az); g.lineTo(x1+ax,z1+az); g.stroke(); g.setLineDash([]);
        g.strokeStyle='#d8c28a'; g.lineWidth=1.2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(x0+ax+(e.h?0:s*cs*0.1),z0+az+(e.h?s*cs*0.1:0)); g.lineTo(x1+ax+(e.h?0:s*cs*0.1),z1+az+(e.h?s*cs*0.1:0)); g.stroke(); } } });
    B.isl.forEach((q,i)=>{ const [x,z]=pos(q), r=cs*0.4, ok=inc[i]===q.n?'#7fe39a':inc[i]>q.n?'#ff6b5e':'#8896a3';
      g.fillStyle=i===sel?'#5cc3d6':'#59616b'; g.strokeStyle=ok; g.lineWidth=2.5; g.beginPath(); g.moveTo(x-r,z+r*0.8); g.lineTo(x-r*0.55,z-r*0.1); g.lineTo(x-r*0.15,z-r*0.35); g.lineTo(x+r*0.2,z-r*0.9); g.lineTo(x+r*0.6,z-r*0.1); g.lineTo(x+r,z+r*0.8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle=i===sel?'#d9f3fa':'#e8eef4'; g.beginPath(); g.moveTo(x+r*0.2,z-r*0.9); g.lineTo(x+r*0.42,z-r*0.5); g.lineTo(x+r*0.12,z-r*0.42); g.lineTo(x-r*0.05,z-r*0.55); g.closePath(); g.fill();
      g.fillStyle=i===sel?'#0b1a1f':'#fff'; g.font='bold '+Math.floor(cs*0.4)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(q.n),x,z+r*0.32); });
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
