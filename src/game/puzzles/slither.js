//@ Coastlines on the client: tap beside a cell side to draw or lift a shoreline segment; one closed loop, every number met
/* Agent map. PZV.slither.mount(host,B,api,saved). State = the drawn edge ids (see shared/puzzles/slither.js for the numbering). A tap picks the nearest side of the cell under it. Solved when slCheck passes. Test: client-smoke (loads), puzzles-smoke. */
PZV.slither={mount(host,B,api,saved){
  const w=B.w, h=B.h, G=slGeom(w,h), {cv,g,cs,px,py}=pzCanvas(host,w+1,h+1,0.55), m=cs/2, on=new Set(saved&&Array.isArray(saved.on)?saved.on.filter(e=>Number.isInteger(e)&&e>=0&&e<G.E):[]); let won=false;
  const vx=v=>m+(v%(w+1))*(cs*0.92), vz=v=>m+((v/(w+1))|0)*(cs*0.92), U=cs*0.92;
  function draw(){
    g.clearRect(0,0,px,py);
    for(let i=0;i<w*h;i++){ const k=B.clue[i]; if(k<0) continue; let have=0; for(const e of G.cellE[i]) if(on.has(e)) have++; const x=m+(i%w+0.5)*U, z=m+(((i/w)|0)+0.5)*U; g.fillStyle=have>k?'#ff6b5e':have===k?'#7fe39a':'#cfd8e0'; g.font='bold '+Math.floor(U*0.5)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(k),x,z+1); }
    g.strokeStyle='#5cc3d6'; g.lineWidth=Math.max(3,U*0.12); g.lineCap='round'; for(const e of on){ const [a,b]=G.ends[e]; g.beginPath(); g.moveTo(vx(a),vz(a)); g.lineTo(vx(b),vz(b)); g.stroke(); }
    g.fillStyle='#8896a3'; for(let v=0;v<(w+1)*(h+1);v++){ g.beginPath(); g.arc(vx(v),vz(v),Math.max(2,U*0.06),0,6.283); g.fill(); }
  }
  cv.addEventListener('pointerdown',e=>{
    if(won) return; const r=cv.getBoundingClientRect(), px0=(e.clientX-r.left)/r.width*cv.width, pz0=(e.clientY-r.top)/r.height*cv.height; let best=-1, bd=1e9;
    for(let ed=0;ed<G.E;ed++){ const [a,b]=G.ends[ed], cx=(vx(a)+vx(b))/2, cz=(vz(a)+vz(b))/2, d=(cx-px0)*(cx-px0)+(cz-pz0)*(cz-pz0); if(d<bd){ bd=d; best=ed; } }
    if(best<0||bd>U*U*0.3) return; if(on.has(best)) on.delete(best); else on.add(best); draw(); api.save({st:{on:[...on]},secs:0}); if(slCheck(B,[...on])){ won=true; api.solved([...on]); }
  });
  draw();
  return { reset(){ on.clear(); won=false; draw(); }, state(){ return {on:[...on]}; } };
}};
