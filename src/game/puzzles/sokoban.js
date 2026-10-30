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
  function draw(){
    const s=hist[hist.length-1]; g.clearRect(0,0,px,py);
    for(let c=0;c<w*h;c++){ const x=(c%w)*cs, z=((c/w)|0)*cs;
      if(S.wallSet.has(c)){ g.fillStyle='#3a434c'; g.fillRect(x,z,cs,cs); g.fillStyle='#4b5661'; g.fillRect(x+2,z+2,cs-4,cs-4); continue; }
      g.fillStyle='#1d2a24'; g.fillRect(x+1,z+1,cs-2,cs-2);
      if(goal.has(c)){ g.strokeStyle='#d8c28a'; g.lineWidth=3; g.strokeRect(x+cs*0.2,z+cs*0.2,cs*0.6,cs*0.6); } }
    for(const b of s.box){ const x=(b%w+0.5)*cs, z=(((b/w)|0)+0.5)*cs; g.fillStyle=goal.has(b)?'#7fe39a':'#c98a4b'; g.strokeStyle='#0b1218'; g.lineWidth=2; g.beginPath(); g.arc(x,z,cs*0.33,0,6.283); g.fill(); g.stroke(); }
    const px0=(s.p%w+0.5)*cs, pz0=(((s.p/w)|0)+0.5)*cs; g.fillStyle='#5cc3d6'; g.beginPath(); g.arc(px0,pz0,cs*0.24,0,6.283); g.fill();
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
