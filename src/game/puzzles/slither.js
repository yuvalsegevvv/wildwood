//@ Coastlines on the client: tap beside a cell side to draw or lift a shoreline segment; one closed loop, every number met
/* Agent map. PZV.slither.mount(host,B,api,saved). State = the drawn edge ids (see shared/puzzles/slither.js for the numbering). A tap picks the nearest side of the cell under it. Solved when slCheck passes. Test: client-smoke (loads), puzzles-smoke. */
PZV.slither={mount(host,B,api,saved){
  const w=B.w, h=B.h, G=slGeom(w,h), {cv,g,cs,px,py}=pzCanvas(host,w+1,h+1,0.55), m=cs/2, on=new Set(saved&&Array.isArray(saved.on)?saved.on.filter(e=>Number.isInteger(e)&&e>=0&&e<G.E):[]); let won=false;
  const vx=v=>m+(v%(w+1))*(cs*0.92), vz=v=>m+((v/(w+1))|0)*(cs*0.92), U=cs*0.92;
  function draw(){   // the Emberwake Isles: a dark sea, the loop is the shore of an island (sand inside, foam on the line), buoys at the corners
    g.clearRect(0,0,px,py); g.fillStyle='#0f2a3a'; g.fillRect(0,0,px,py);
    for(let i=0;i<w*h;i++){ const x=m+(i%w)*U, z=m+((i/w)|0)*U; g.strokeStyle='#17445a'; g.lineWidth=1; g.beginPath(); g.moveTo(x+U*0.2,z+U*0.55); g.quadraticCurveTo(x+U*0.35,z+U*0.4,x+U*0.5,z+U*0.55); g.quadraticCurveTo(x+U*0.65,z+U*0.7,x+U*0.8,z+U*0.55); g.stroke(); }
    // sand: cells inside the drawn loop (even-odd along the row, counting the vertical edges crossed)
    for(let r=0;r<h;r++){ let inside=false; for(let c=0;c<w;c++){ const ve=G.hN+r*(w+1)+c; if(on.has(ve)) inside=!inside; if(inside){ g.fillStyle='#d9b873'; g.fillRect(m+c*U,m+r*U,U,U); pzSpeckle(g,m+c*U,m+r*U,U,'#b89850',4,r*w+c); } } }
    for(let i=0;i<w*h;i++){ const k=B.clue[i]; if(k<0) continue; let have=0; for(const e of G.cellE[i]) if(on.has(e)) have++; const x=m+(i%w+0.5)*U, z=m+(((i/w)|0)+0.5)*U; g.fillStyle=have>k?'#ff6b5e':have===k?'#7fe39a':'#e7f2f7'; g.font='bold '+Math.floor(U*0.5)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(k),x,z+1); }
    g.lineCap='round'; for(const [col,lw] of [['#ffffffb0',Math.max(5,U*0.2)],['#2e8fa6',Math.max(3,U*0.1)]]){ g.strokeStyle=col; g.lineWidth=lw; for(const e of on){ const [a,b]=G.ends[e]; g.beginPath(); g.moveTo(vx(a),vz(a)); g.lineTo(vx(b),vz(b)); g.stroke(); } }
    for(let v=0;v<(w+1)*(h+1);v++){ g.fillStyle='#e8553f'; g.beginPath(); g.arc(vx(v),vz(v),Math.max(2.5,U*0.075),0,6.283); g.fill(); g.fillStyle='#ffffffa0'; g.fillRect(vx(v)-U*0.02,vz(v)-U*0.05,U*0.04,U*0.04); }
  }
  cv.addEventListener('pointerdown',e=>{
    if(won) return; const r=cv.getBoundingClientRect(), px0=(e.clientX-r.left)/r.width*cv.width, pz0=(e.clientY-r.top)/r.height*cv.height; let best=-1, bd=1e9;
    for(let ed=0;ed<G.E;ed++){ const [a,b]=G.ends[ed], cx=(vx(a)+vx(b))/2, cz=(vz(a)+vz(b))/2, d=(cx-px0)*(cx-px0)+(cz-pz0)*(cz-pz0); if(d<bd){ bd=d; best=ed; } }
    if(best<0||bd>U*U*0.3) return; if(on.has(best)) on.delete(best); else on.add(best); draw(); api.save({st:{on:[...on]},secs:0}); if(slCheck(B,[...on])){ won=true; api.solved([...on]); }
  });
  draw();
  return { reset(){ on.clear(); won=false; draw(); }, state(){ return {on:[...on]}; } };
}};
