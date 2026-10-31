//@ Glowstones on the client: tap a floor tile to set or lift a crystal; lit tiles glow, crystals that see each other turn red
/* Agent map. PZV.akari.mount(host,B,api,saved). State = the crystal cells. Solved when akCheck passes. Test: client-smoke (loads), puzzles-smoke (rules). */
PZV.akari={mount(host,B,api,saved){
  const w=B.w, h=B.h, N=w*h, {cv,g,cs,px}=pzCanvas(host,w,h), isB=new Uint8Array(N); for(const c of B.black) isB[c]=1;
  let bulbs=new Set(saved&&Array.isArray(saved.bulbs)?saved.bulbs.filter(c=>Number.isInteger(c)&&c>=0&&c<N&&!isB[c]):[]), won=false;
  function lightOf(){ const lit=new Int16Array(N); for(const c of bulbs){ const x0=c%w, z0=(c/w)|0; lit[c]++; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ let x=x0+dx, z=z0+dz; while(x>=0&&z>=0&&x<w&&z<h&&!isB[z*w+x]){ lit[z*w+x]++; x+=dx; z+=dz; } } } return lit; }
  function draw(){   // the Deep Cave: dark rock, rubble walls with stalagmites, glowstone crystals that light their row and column
    const lit=lightOf(); g.clearRect(0,0,px,px); g.fillStyle='#0b0e12'; g.fillRect(0,0,px,px);
    for(let c=0;c<N;c++){ const x=(c%w)*cs, z=((c/w)|0)*cs;
      if(isB[c]){ g.fillStyle='#3b4149'; pzRound(g,x+0.5,z+0.5,cs-1,cs-1,cs*0.14); g.fill(); g.fillStyle='#2a2f35'; g.beginPath(); g.moveTo(x+cs*0.1,z+cs*0.95); g.lineTo(x+cs*0.3,z+cs*0.62); g.lineTo(x+cs*0.5,z+cs*0.95); g.fill(); g.beginPath(); g.moveTo(x+cs*0.55,z+cs*0.95); g.lineTo(x+cs*0.75,z+cs*0.7); g.lineTo(x+cs*0.92,z+cs*0.95); g.fill(); pzSpeckle(g,x,z,cs,'#59616b',4,c+3);
        const k=B.num[c]; if(k!==undefined){ let have=0; for(const q of [c%w>0?c-1:-1,c%w<w-1?c+1:-1,c>=w?c-w:-1,c<N-w?c+w:-1]) if(q>=0&&bulbs.has(q)) have++; g.fillStyle=have>k?'#ff6b5e':have===k?'#7fe39a':'#e8eef4'; g.font='bold '+Math.floor(cs*0.5)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(k),x+cs/2,z+cs*0.42); } continue; }
      g.fillStyle=lit[c]?'#4d4220':'#151a20'; pzRound(g,x+1,z+1,cs-2,cs-2,cs*0.12); g.fill();
      if(lit[c]){ const gr=g.createRadialGradient(x+cs/2,z+cs/2,1,x+cs/2,z+cs/2,cs*0.7); gr.addColorStop(0,'#ffe27a66'); gr.addColorStop(1,'#ffe27a00'); g.fillStyle=gr; g.fillRect(x,z,cs,cs); } else pzSpeckle(g,x,z,cs,'#232a32',3,c+7);
      if(bulbs.has(c)){ const cx=x+cs/2, cz=z+cs/2, r=cs*0.3; g.fillStyle=lit[c]>1?'#ff6b5e':'#ffe27a'; g.shadowColor=lit[c]>1?'#ff6b5e':'#ffd24a'; g.shadowBlur=cs*0.5; g.beginPath(); g.moveTo(cx,cz-r*1.15); g.lineTo(cx+r*0.8,cz-r*0.1); g.lineTo(cx+r*0.45,cz+r*1.1); g.lineTo(cx-r*0.45,cz+r*1.1); g.lineTo(cx-r*0.8,cz-r*0.1); g.closePath(); g.fill(); g.shadowBlur=0; g.fillStyle='#ffffff80'; g.beginPath(); g.moveTo(cx-r*0.1,cz-r*0.8); g.lineTo(cx+r*0.3,cz-r*0.1); g.lineTo(cx-r*0.1,cz+r*0.2); g.closePath(); g.fill(); } }
  }
  cv.addEventListener('pointerdown',e=>{ if(won) return; const c=pzCell(cv,e,w,h); if(c<0||isB[c]) return; if(bulbs.has(c)) bulbs.delete(c); else bulbs.add(c); draw(); api.save({st:{bulbs:[...bulbs]},secs:0}); if(akCheck(B,[...bulbs])){ won=true; api.solved([...bulbs]); } });
  draw();
  return { reset(){ bulbs=new Set(); won=false; draw(); }, state(){ return {bulbs:[...bulbs]}; } };
}};
