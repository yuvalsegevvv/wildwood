//@ Glowstones on the client: tap a floor tile to set or lift a crystal; lit tiles glow, crystals that see each other turn red
/* Agent map. PZV.akari.mount(host,B,api,saved). State = the crystal cells. Solved when akCheck passes. Test: client-smoke (loads), puzzles-smoke (rules). */
PZV.akari={mount(host,B,api,saved){
  const w=B.w, h=B.h, N=w*h, {cv,g,cs,px}=pzCanvas(host,w,h), isB=new Uint8Array(N); for(const c of B.black) isB[c]=1;
  let bulbs=new Set(saved&&Array.isArray(saved.bulbs)?saved.bulbs.filter(c=>Number.isInteger(c)&&c>=0&&c<N&&!isB[c]):[]), won=false;
  function lightOf(){ const lit=new Int16Array(N); for(const c of bulbs){ const x0=c%w, z0=(c/w)|0; lit[c]++; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ let x=x0+dx, z=z0+dz; while(x>=0&&z>=0&&x<w&&z<h&&!isB[z*w+x]){ lit[z*w+x]++; x+=dx; z+=dz; } } } return lit; }
  function draw(){
    const lit=lightOf(); g.clearRect(0,0,px,px);
    for(let c=0;c<N;c++){ const x=(c%w)*cs, z=((c/w)|0)*cs;
      if(isB[c]){ g.fillStyle='#2b3138'; g.fillRect(x,z,cs,cs); const k=B.num[c]; if(k!==undefined){ let have=0; for(const q of [c%w>0?c-1:-1,c%w<w-1?c+1:-1,c>=w?c-w:-1,c<N-w?c+w:-1]) if(q>=0&&bulbs.has(q)) have++; g.fillStyle=have>k?'#ff6b5e':have===k?'#7fe39a':'#e8eef4'; g.font='bold '+Math.floor(cs*0.55)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(k),x+cs/2,z+cs/2+1); } continue; }
      g.fillStyle=lit[c]?'#4a4320':'#141b22'; g.fillRect(x+1,z+1,cs-2,cs-2);
      if(bulbs.has(c)){ g.fillStyle=lit[c]>1?'#ff6b5e':'#ffe27a'; g.beginPath(); g.arc(x+cs/2,z+cs/2,cs*0.3,0,6.283); g.fill(); } }
  }
  cv.addEventListener('pointerdown',e=>{ if(won) return; const c=pzCell(cv,e,w,h); if(c<0||isB[c]) return; if(bulbs.has(c)) bulbs.delete(c); else bulbs.add(c); draw(); api.save({st:{bulbs:[...bulbs]},secs:0}); if(akCheck(B,[...bulbs])){ won=true; api.solved([...bulbs]); } });
  draw();
  return { reset(){ bulbs=new Set(); won=false; draw(); }, state(){ return {bulbs:[...bulbs]}; } };
}};
