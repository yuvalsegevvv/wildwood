//@ Ice slide on the client: arrow keys, WASD, a swipe or the pad slide the stone (or the twin stones) over the ice; undo and reset
/* Agent map. PZV.iceslide.mount(host,B,api,saved) (puzzles/panel.js). B is shared/puzzles/ice.js's board; icStep/icWon are the shared rules, so what you see is what the server replays (icCheck on the move string).
   State = the move string; the history of states is rebuilt from it (resume = replay). Test: client-smoke (loads), tools/puzzles-smoke.js (icCheck). */
const IC_KEY={go:null,keys:null};
window.addEventListener('keydown',e=>{ if(!IC_KEY.go||$('#puzzle').hidden||!IC_KEY.keys) return; const d=IC_KEY.keys[e.code]; if(d){ e.preventDefault(); e.stopPropagation(); IC_KEY.go(d); } },true);
PZV.iceslide={mount(host,B,api,saved){
  const w=B.w, h=B.h, side=Math.min(host.clientWidth||360,Math.max(240,Math.floor((window.innerHeight||700)*0.5)),440), cs=Math.floor(side/w), px=cs*w, P=icPrep(B);
  const cv=document.createElement('canvas'); cv.width=cv.height=px; cv.className='pz-canvas'; cv.style.touchAction='none'; host.append(cv); const g=cv.getContext('2d');
  const pad=document.createElement('div'); pad.className='pz-pad'; pad.innerHTML='<button data-d="U" aria-label="Up">▲</button><button data-d="L" aria-label="Left">◀</button><button data-d="D" aria-label="Down">▼</button><button data-d="R" aria-label="Right">▶</button>'; host.append(pad);
  const start=()=>{ const s={pos:B.start.slice(),lit:0,brk:0}; for(const c of s.pos) if(P.sw[c]>=0) s.lit|=1<<P.sw[c]; return s; };
  let hist=[start()], moves='', won=false;
  const redo=str=>{ hist=[start()]; moves=''; for(const ch of str) if(IC_DIRS[ch]){ const n=icStep(B,P,hist[hist.length-1],ch); hist.push(n); moves+=ch; } };
  if(saved&&typeof saved.moves==='string') redo(saved.moves.slice(0,400));
  const COL=['#7fd0ff','#ffb35a'];
  function draw(){
    const s=hist[hist.length-1]; g.clearRect(0,0,px,px);
    for(let c=0;c<w*h;c++){ const x=(c%w)*cs, z=Math.floor(c/w)*cs;
      if(P.rock[c]){ g.fillStyle='#2f3d4a'; g.fillRect(x,z,cs,cs); g.fillStyle='#5b6a78'; g.beginPath(); g.arc(x+cs*0.5,z+cs*0.55,cs*0.38,0,6.283); g.fill(); g.fillStyle='#eef7fc'; g.beginPath(); g.ellipse(x+cs*0.5,z+cs*0.3,cs*0.3,cs*0.15,0,0,6.283); g.fill(); continue; }   // a boulder under a snow cap
      const broken=P.cr[c]>=0&&(s.brk>>P.cr[c]&1);
      g.fillStyle=broken?'#232a33':'#cfeaf7'; g.fillRect(x+1,z+1,cs-2,cs-2); if(!broken){ pzSpeckle(g,x,z,cs,'#ffffffb0',3,c+5); g.strokeStyle='#ffffff90'; g.lineWidth=1; g.beginPath(); g.moveTo(x+cs*0.12,z+cs*0.2); g.lineTo(x+cs*0.38,z+cs*0.12); g.stroke(); }
      if(P.cr[c]>=0&&!broken){ g.strokeStyle='#6d8fa5'; g.lineWidth=2; g.beginPath(); g.moveTo(x+cs*0.2,z+cs*0.3); g.lineTo(x+cs*0.5,z+cs*0.55); g.lineTo(x+cs*0.4,z+cs*0.85); g.moveTo(x+cs*0.5,z+cs*0.55); g.lineTo(x+cs*0.85,z+cs*0.4); g.stroke(); }
      if(P.sw[c]>=0){ const on=s.lit>>P.sw[c]&1; g.fillStyle=on?'#ffe27a':'#7a8a99'; g.beginPath(); g.arc(x+cs/2,z+cs/2,cs*0.2,0,6.283); g.fill(); }
    }
    B.goal.forEach((c,i)=>{ const x=(c%w+0.5)*cs, z=(Math.floor(c/w)+0.5)*cs; g.strokeStyle=COL[i]; g.lineWidth=3; g.beginPath(); g.moveTo(x,z-cs*0.34); g.lineTo(x+cs*0.3,z); g.lineTo(x,z+cs*0.34); g.lineTo(x-cs*0.3,z); g.closePath(); g.stroke(); });
    s.pos.forEach((c,i)=>{ const x=(c%w+0.5)*cs, z=(Math.floor(c/w)+0.5)*cs; g.fillStyle=COL[i]; g.strokeStyle='#0b1218'; g.lineWidth=2; g.beginPath(); g.arc(x,z,cs*0.3,0,6.283); g.fill(); g.stroke(); });
  }
  // a dead end (a cracked tile walled the way off, a stone slid past its rune for good): search every state reachable from here; if none wins, say so
  const note=document.createElement('p'); note.className='muted'; host.append(note);
  const stuck=s0=>{ const seen=new Set([icKey(B,s0)]), q=[s0]; for(let i=0;i<q.length;i++){ if(icWon(B,q[i])) return false; if(q.length>40000) return false; for(const d of ['U','D','L','R']){ const n=icStep(B,P,q[i],d), k=icKey(B,n); if(!seen.has(k)){ seen.add(k); q.push(n); } } } return true; };
  const refresh=()=>{ note.textContent=!won&&stuck(hist[hist.length-1])?'No way to the runes from here. Undo a move or start over.':''; };
  const finish=()=>{ if(!won&&icWon(B,hist[hist.length-1])){ won=true; draw(); api.solved(moves); } refresh(); };
  const go=d=>{ if(won) return; const n=icStep(B,P,hist[hist.length-1],d); if(icKey(B,n)===icKey(B,hist[hist.length-1])) return; hist.push(n); moves+=d; draw(); api.save({st:{moves},secs:0}); finish(); };
  const keys={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',KeyW:'U',KeyS:'D',KeyA:'L',KeyD:'R'};
  IC_KEY.go=go; IC_KEY.keys=keys;   // the one key listener below drives whichever board is open
  pad.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.d)));
  let sx=0, sz=0; cv.addEventListener('pointerdown',e=>{ sx=e.clientX; sz=e.clientY; });
  cv.addEventListener('pointerup',e=>{ const dx=e.clientX-sx, dz=e.clientY-sz; if(Math.max(Math.abs(dx),Math.abs(dz))<cs*0.4) return; go(Math.abs(dx)>Math.abs(dz)?(dx>0?'R':'L'):(dz>0?'D':'U')); });
  draw(); refresh();
  return { undo(){ if(hist.length>1&&!won){ hist.pop(); moves=moves.slice(0,-1); draw(); api.save({st:{moves},secs:0}); refresh(); } }, reset(){ if(won) return; hist=[start()]; moves=''; draw(); api.save({st:{moves},secs:0}); refresh(); }, state(){ return {moves}; } };
}};
