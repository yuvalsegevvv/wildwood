//@ Herding on the client: arrow keys, WASD, a swipe or the pad walk the herder and push the calves into the kraal; undo and start over
/* Agent map. PZV.sokoban.mount(host,B,api,saved). State = the move string (resume replays it; a move into a wall does nothing and is not kept). Rules from skStep (shared/puzzles/sokoban.js). Solved when every calf stands on the kraal. Test: client-smoke (loads), puzzles-smoke. */
const SK_KEY={go:null,keys:null};
window.addEventListener('keydown',e=>{ if(!SK_KEY.go||$('#puzzle').hidden) return; const d=SK_KEY.keys[e.code]; if(d){ e.preventDefault(); e.stopPropagation(); SK_KEY.go(d); } },true);
PZV.sokoban={mount(host,B,api,saved){
  const w=B.w, h=B.h, {cv,g,cs,px,py}=pzCanvas(host,w,h,0.5), S={w,h,wallSet:new Set(B.wall)}, goal=new Set(B.goal);
  const pad=document.createElement('div'); pad.className='pz-pad'; pad.innerHTML='<button data-d="U" aria-label="Up">▲</button><button data-d="L" aria-label="Left">◀</button><button data-d="D" aria-label="Down">▼</button><button data-d="R" aria-label="Right">▶</button>'; host.append(pad);
  let hist=[{p:B.player,box:B.box.slice()}], moves='', won=false;
  const redo=s=>{ hist=[{p:B.player,box:B.box.slice()}]; moves=''; for(const ch of s){ const n=SK_DX[ch]!==undefined?skStep(S,hist[hist.length-1],ch):null; if(n){ hist.push(n); moves+=ch; } } };
  if(saved&&typeof saved.moves==='string') redo(saved.moves.slice(0,3000));
  function draw(){   // the Amber Reach: dry savanna grass, thorn-bush and rock walls, a fenced kraal, calves and the herder
    const s=hist[hist.length-1]; g.clearRect(0,0,px,py); g.fillStyle='#6b5a2e'; g.fillRect(0,0,px,py);
    for(let c=0;c<w*h;c++){ const x=(c%w)*cs, z=((c/w)|0)*cs;
      if(S.wallSet.has(c)){ g.fillStyle='#4a3a1c'; g.fillRect(x,z,cs,cs); if(pzHash(c,2)<0.5){ g.fillStyle='#3d5a2a'; g.beginPath(); g.arc(x+cs*0.5,z+cs*0.55,cs*0.42,0,6.283); g.fill(); g.strokeStyle='#2a3d1c'; g.lineWidth=1.5; for(let k=0;k<5;k++){ const a=k*1.3+pzHash(c,k)*2; g.beginPath(); g.moveTo(x+cs*0.5,z+cs*0.55); g.lineTo(x+cs*0.5+Math.cos(a)*cs*0.4,z+cs*0.55+Math.sin(a)*cs*0.4); g.stroke(); } } else { g.fillStyle='#8a7a5a'; g.beginPath(); g.moveTo(x+cs*0.1,z+cs*0.9); g.lineTo(x+cs*0.25,z+cs*0.3); g.lineTo(x+cs*0.6,z+cs*0.15); g.lineTo(x+cs*0.9,z+cs*0.9); g.fill(); g.fillStyle='#a89a78'; g.fillRect(x+cs*0.3,z+cs*0.3,cs*0.2,cs*0.1); } continue; }
      g.fillStyle=(c+((c/w)|0))%2?'#8a7640':'#85703a'; g.fillRect(x+0.5,z+0.5,cs-1,cs-1); pzSpeckle(g,x,z,cs,'#a8934f',4,c+11); g.strokeStyle='#a8934f'; g.lineWidth=1; if(pzHash(c,6)<0.35){ g.beginPath(); g.moveTo(x+cs*0.3,z+cs*0.9); g.lineTo(x+cs*0.34,z+cs*0.6); g.moveTo(x+cs*0.4,z+cs*0.9); g.lineTo(x+cs*0.42,z+cs*0.55); g.stroke(); }
      if(goal.has(c)){ g.fillStyle='#5a4524'; g.fillRect(x+cs*0.08,z+cs*0.08,cs*0.84,cs*0.84); g.strokeStyle='#d8c28a'; g.lineWidth=2.5; for(let k=0;k<4;k++){ const sx=x+cs*(0.14+k*0.24); g.beginPath(); g.moveTo(sx,z+cs*0.1); g.lineTo(sx,z+cs*0.9); g.stroke(); } g.beginPath(); g.moveTo(x+cs*0.08,z+cs*0.3); g.lineTo(x+cs*0.92,z+cs*0.3); g.moveTo(x+cs*0.08,z+cs*0.7); g.lineTo(x+cs*0.92,z+cs*0.7); g.stroke(); } }
    for(const b of s.box){ const x=(b%w+0.5)*cs, z=(((b/w)|0)+0.5)*cs, ok=goal.has(b); g.strokeStyle='#0b1218'; g.lineWidth=1.5; g.fillStyle=ok?'#e6b25a':'#c98a4b'; g.beginPath(); g.ellipse(x,z+cs*0.05,cs*0.3,cs*0.2,0,0,6.283); g.fill(); g.stroke(); g.beginPath(); g.arc(x+cs*0.22,z-cs*0.12,cs*0.14,0,6.283); g.fill(); g.stroke(); g.fillStyle='#5a3a1c'; g.beginPath(); g.ellipse(x+cs*0.3,z-cs*0.26,cs*0.05,cs*0.09,0.4,0,6.283); g.fill(); g.beginPath(); g.ellipse(x+cs*0.12,z-cs*0.26,cs*0.05,cs*0.09,-0.4,0,6.283); g.fill(); g.fillRect(x-cs*0.2,z+cs*0.16,cs*0.06,cs*0.14); g.fillRect(x+cs*0.1,z+cs*0.16,cs*0.06,cs*0.14); g.fillStyle='#0b1218'; g.fillRect(x+cs*0.25,z-cs*0.14,cs*0.04,cs*0.04); if(ok){ g.strokeStyle='#7fe39a'; g.lineWidth=2; g.beginPath(); g.arc(x,z,cs*0.4,0,6.283); g.stroke(); } }
    const px0=(s.p%w+0.5)*cs, pz0=(((s.p/w)|0)+0.5)*cs; g.fillStyle='#3b6ea5'; g.beginPath(); g.moveTo(px0-cs*0.18,pz0+cs*0.3); g.lineTo(px0,pz0-cs*0.05); g.lineTo(px0+cs*0.18,pz0+cs*0.3); g.fill(); g.fillStyle='#e0b48a'; g.beginPath(); g.arc(px0,pz0-cs*0.15,cs*0.11,0,6.283); g.fill(); g.fillStyle='#c0392b'; g.beginPath(); g.ellipse(px0,pz0-cs*0.23,cs*0.2,cs*0.06,0,0,6.283); g.fill(); g.fillRect(px0-cs*0.1,pz0-cs*0.32,cs*0.2,cs*0.09);
  }
  const finish=()=>{ if(!won&&hist[hist.length-1].box.every(b=>goal.has(b))){ won=true; draw(); api.solved(moves); } };
  const go=d=>{ if(won) return; const n=skStep(S,hist[hist.length-1],d); if(!n) return; hist.push(n); moves+=d; draw(); api.save({st:{moves},secs:0}); finish(); };
  SK_KEY.go=go; SK_KEY.keys={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',KeyW:'U',KeyS:'D',KeyA:'L',KeyD:'R'};
  pad.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.d)));
  let sx=0, sz=0; cv.addEventListener('pointerdown',e=>{ sx=e.clientX; sz=e.clientY; });
  cv.addEventListener('pointerup',e=>{ const dx=e.clientX-sx, dz=e.clientY-sz; if(Math.max(Math.abs(dx),Math.abs(dz))<cs*0.4) return; go(Math.abs(dx)>Math.abs(dz)?(dx>0?'R':'L'):(dz>0?'D':'U')); });
  draw();
  return { undo(){ if(hist.length>1&&!won){ hist.pop(); moves=moves.slice(0,-1); draw(); api.save({st:{moves},secs:0}); } }, reset(){ if(won) return; redo(''); draw(); api.save({st:{moves},secs:0}); }, state(){ return {moves}; } };
}};
