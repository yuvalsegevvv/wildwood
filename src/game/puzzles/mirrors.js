//@ Sun mirrors on the client: tap a mirror to turn it; the beams are redrawn at once, targets glow when their colour reaches them
/* Agent map. PZV.mirrors.mount(host,B,api,saved). State = the orientation of each mirror (0 '/', 1 '\'). Beams come from mrTrace (shared/puzzles/mirrors.js). Solved when mrSolved. Test: client-smoke (loads), puzzles-smoke. */
const MR_COL=['#fff3c4','#ff7a6b','#6bb8ff'];
PZV.mirrors={mount(host,B,api,saved){
  const w=B.w, h=B.h, {cv,g,cs,px,py}=pzCanvas(host,w,h), orient=B.mir.map(m=>m.o);
  if(saved&&Array.isArray(saved.o)&&saved.o.length===orient.length) saved.o.forEach((v,i)=>{ if(v===0||v===1) orient[i]=v; });
  let won=false; const C=(x,z)=>[(x+0.5)*cs,(z+0.5)*cs];
  function draw(){   // the Sunscar: baked sand with dune ripples, a sun disc throwing the beams, brass mirrors on posts, crystal prisms, sun-stone targets
    g.clearRect(0,0,px,py); g.fillStyle='#4a3522'; g.fillRect(0,0,px,py);
    for(let z=0;z<h;z++) for(let x=0;x<w;x++){ g.fillStyle=(x+z)%2?'#543c26':'#4f3824'; g.fillRect(x*cs,z*cs,cs,cs); pzSpeckle(g,x*cs,z*cs,cs,'#6b4f33',4,z*w+x); if(pzHash(x,z)<0.2){ g.strokeStyle='#5f452c'; g.lineWidth=1; g.beginPath(); g.moveTo(x*cs+cs*0.15,z*cs+cs*0.7); g.quadraticCurveTo(x*cs+cs*0.5,z*cs+cs*0.55,x*cs+cs*0.85,z*cs+cs*0.7); g.stroke(); } }
    const T=mrTrace(B,orient);
    g.lineCap='round'; for(const pass of [0,1]) for(const [x0,z0,x1,z1,c] of T.segs){ if(x0<0) continue; const [a,b]=C(x0,z0), [d,e]=C(x1,z1); g.strokeStyle=pass?'#ffffffcc':MR_COL[c]; g.lineWidth=pass?Math.max(1.5,cs*0.05):Math.max(4,cs*0.2); g.globalAlpha=pass?1:0.55; g.beginPath(); g.moveTo(a,b); g.lineTo(d,e); g.stroke(); }
    g.globalAlpha=1;
    for(const s of B.src){ const [x,z]=C(s.x,s.z); g.strokeStyle=MR_COL[s.c]; g.lineWidth=2; for(let k=0;k<8;k++){ const a=k*0.785; g.beginPath(); g.moveTo(x+Math.cos(a)*cs*0.32,z+Math.sin(a)*cs*0.32); g.lineTo(x+Math.cos(a)*cs*0.46,z+Math.sin(a)*cs*0.46); g.stroke(); } g.fillStyle=MR_COL[s.c]; g.shadowColor=MR_COL[s.c]; g.shadowBlur=cs*0.4; g.beginPath(); g.arc(x,z,cs*0.27,0,6.283); g.fill(); g.shadowBlur=0; }
    for(const p of B.prism){ const [x,z]=C(p.x,p.z), r=cs*0.34; g.fillStyle='#9ad8e8aa'; g.strokeStyle='#e8f8ff'; g.lineWidth=2; g.beginPath(); g.moveTo(x,z-r); g.lineTo(x+r*0.8,z+r*0.5); g.lineTo(x-r*0.8,z+r*0.5); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x,z-r); g.lineTo(x,z+r*0.5); g.stroke(); }
    B.mir.forEach((m,i)=>{ const [x,z]=C(m.x,m.z), r=cs*0.38, s=orient[i]===0?-1:1; g.fillStyle='#2a1d12'; g.beginPath(); g.arc(x,z,cs*0.12,0,6.283); g.fill(); g.strokeStyle='#7a5a24'; g.lineWidth=Math.max(5,cs*0.18); g.lineCap='round'; g.beginPath(); g.moveTo(x-r,z-s*r); g.lineTo(x+r,z+s*r); g.stroke(); g.strokeStyle='#f0d27a'; g.lineWidth=Math.max(3,cs*0.1); g.beginPath(); g.moveTo(x-r,z-s*r); g.lineTo(x+r,z+s*r); g.stroke(); g.strokeStyle='#fffbe0'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x-r*0.8,z-s*r*0.8); g.lineTo(x-r*0.2,z-s*r*0.2); g.stroke(); });
    for(const t of B.tgt){ const [x,z]=C(t.x,t.z), m=T.lit.get(t.z*w+t.x)||0, ok=t.c===0?m>0:(m>>t.c&1)===1, col=t.c?MR_COL[t.c]:'#fff3c4'; g.strokeStyle=col; g.lineWidth=3; g.fillStyle=ok?col:'#2a1d12'; if(ok){ g.shadowColor=col; g.shadowBlur=cs*0.4; } pzRound(g,x-cs*0.24,z-cs*0.24,cs*0.48,cs*0.48,cs*0.12); g.fill(); g.stroke(); g.shadowBlur=0; }
  }
  cv.addEventListener('pointerdown',e=>{ if(won) return; const c=pzCell(cv,e,w,h); if(c<0) return; const i=B.mir.findIndex(m=>m.z*w+m.x===c); if(i<0) return; orient[i]^=1; draw(); api.save({st:{o:orient.slice()},secs:0}); if(mrSolved(B,orient)){ won=true; api.solved(orient.slice()); } });
  draw();
  return { reset(){ B.mir.forEach((m,i)=>{ orient[i]=m.o; }); won=false; draw(); }, state(){ return {o:orient.slice()}; } };
}};
