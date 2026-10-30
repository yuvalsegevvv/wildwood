//@ Sun mirrors on the client: tap a mirror to turn it; the beams are redrawn at once, targets glow when their colour reaches them
/* Agent map. PZV.mirrors.mount(host,B,api,saved). State = the orientation of each mirror (0 '/', 1 '\'). Beams come from mrTrace (shared/puzzles/mirrors.js). Solved when mrSolved. Test: client-smoke (loads), puzzles-smoke. */
const MR_COL=['#fff3c4','#ff7a6b','#6bb8ff'];
PZV.mirrors={mount(host,B,api,saved){
  const w=B.w, h=B.h, {cv,g,cs,px,py}=pzCanvas(host,w,h), orient=B.mir.map(m=>m.o);
  if(saved&&Array.isArray(saved.o)&&saved.o.length===orient.length) saved.o.forEach((v,i)=>{ if(v===0||v===1) orient[i]=v; });
  let won=false; const C=(x,z)=>[(x+0.5)*cs,(z+0.5)*cs];
  function draw(){
    g.clearRect(0,0,px,py); g.fillStyle='#121a21'; g.fillRect(0,0,px,py); g.strokeStyle='#1f2a33'; g.lineWidth=1;
    for(let x=0;x<=w;x++){ g.beginPath(); g.moveTo(x*cs,0); g.lineTo(x*cs,py); g.stroke(); } for(let z=0;z<=h;z++){ g.beginPath(); g.moveTo(0,z*cs); g.lineTo(px,z*cs); g.stroke(); }
    const T=mrTrace(B,orient);
    g.lineCap='round'; for(const [x0,z0,x1,z1,c] of T.segs){ if(x0<0) continue; const [a,b]=C(x0,z0), [d,e]=C(x1,z1); g.strokeStyle=MR_COL[c]; g.lineWidth=Math.max(3,cs*0.12); g.globalAlpha=0.85; g.beginPath(); g.moveTo(a,b); g.lineTo(d,e); g.stroke(); g.globalAlpha=1; }
    for(const s of B.src){ const [x,z]=C(s.x,s.z); g.fillStyle=MR_COL[s.c]; g.beginPath(); g.arc(x,z,cs*0.3,0,6.283); g.fill(); g.strokeStyle='#0b1218'; g.lineWidth=2; g.stroke(); }
    for(const p of B.prism){ const [x,z]=C(p.x,p.z), r=cs*0.34; g.fillStyle='#9ad8e8'; g.strokeStyle='#e8f8ff'; g.lineWidth=2; g.beginPath(); g.moveTo(x,z-r); g.lineTo(x+r,z); g.lineTo(x,z+r); g.lineTo(x-r,z); g.closePath(); g.fill(); g.stroke(); }
    B.mir.forEach((m,i)=>{ const [x,z]=C(m.x,m.z), r=cs*0.38, s=orient[i]===0?-1:1; g.strokeStyle='#e8eef4'; g.lineWidth=Math.max(4,cs*0.14); g.beginPath(); g.moveTo(x-r,z-s*r); g.lineTo(x+r,z+s*r); g.stroke(); });
    for(const t of B.tgt){ const [x,z]=C(t.x,t.z), m=T.lit.get(t.z*w+t.x)||0, ok=t.c===0?m>0:(m>>t.c&1)===1; g.strokeStyle=t.c?MR_COL[t.c]:'#fff3c4'; g.lineWidth=3; g.fillStyle=ok?(t.c?MR_COL[t.c]:'#fff3c4'):'#121a21'; g.beginPath(); g.arc(x,z,cs*0.22,0,6.283); g.fill(); g.stroke(); }
  }
  cv.addEventListener('pointerdown',e=>{ if(won) return; const c=pzCell(cv,e,w,h); if(c<0) return; const i=B.mir.findIndex(m=>m.z*w+m.x===c); if(i<0) return; orient[i]^=1; draw(); api.save({st:{o:orient.slice()},secs:0}); if(mrSolved(B,orient)){ won=true; api.solved(orient.slice()); } });
  draw();
  return { reset(){ B.mir.forEach((m,i)=>{ orient[i]=m.o; }); won=false; draw(); }, state(){ return {o:orient.slice()}; } };
}};
