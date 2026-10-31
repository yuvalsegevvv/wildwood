//@ Shrouds on the client: drag over the grid to fill cells (or mark them empty), with the clues on the top and left
/* Agent map. PZV.nonogram.mount(host,B,api,saved). State = per cell 0 empty, 1 filled, 2 marked empty. The Fill / Mark buttons set what a drag paints; a drag starting on a painted cell erases. Solved when ngCheck passes on the filled cells. Test: client-smoke (loads), puzzles-smoke. */
PZV.nonogram={mount(host,B,api,saved){
  const n=B.n, N=n*n, maxR=Math.max(...B.rows.map(r=>r.length),1), maxC=Math.max(...B.cols.map(c=>c.length),1), gw=n+maxR, gh=n+maxC, {cv,g,cs,px,py}=pzCanvas(host,gw,gh,0.6);
  const st=saved&&Array.isArray(saved.g)&&saved.g.length===N?saved.g.map(v=>v===1||v===2?v:0):new Array(N).fill(0); let mode=1, paint=-1, won=false;
  const bar=document.createElement('div'); bar.className='chips'; host.append(bar);
  const bF=document.createElement('button'), bM=document.createElement('button'); bF.className=bM.className='chip'; bF.textContent='Fill'; bM.textContent='Mark empty'; bar.append(bF,bM);
  const setMode=m=>{ mode=m; bF.classList.toggle('buy',m===1); bM.classList.toggle('buy',m===2); }; bF.onclick=()=>setMode(1); bM.onclick=()=>setMode(2); setMode(1);
  const ox=maxR*cs, oz=maxC*cs;
  function draw(){   // the Gloamhorn's dusk: violet gloom, clues in pale mist, a filled cell is a grey shroud with a fold, a marked one a faint wisp
    g.clearRect(0,0,px,py); g.fillStyle='#1b1626'; g.fillRect(0,0,px,py); g.font='bold '+Math.floor(cs*0.5)+'px system-ui'; g.textAlign='center'; g.textBaseline='middle';
    const line=(r)=>{ const row=[]; for(let c=0;c<n;c++) row.push(st[r*n+c]===1?1:0); return ngClue(row); }, colL=(c)=>{ const col=[]; for(let r=0;r<n;r++) col.push(st[r*n+c]===1?1:0); return ngClue(col); };
    for(let r=0;r<n;r++){ const done=JSON.stringify(line(r))===JSON.stringify(B.rows[r]); g.fillStyle=done?'#6f6486':'#e3dcf2'; B.rows[r].slice().reverse().forEach((k,i)=>g.fillText(String(k),ox-(i+0.5)*cs,oz+(r+0.5)*cs)); }
    for(let c=0;c<n;c++){ const done=JSON.stringify(colL(c))===JSON.stringify(B.cols[c]); g.fillStyle=done?'#6f6486':'#e3dcf2'; B.cols[c].slice().reverse().forEach((k,i)=>g.fillText(String(k),ox+(c+0.5)*cs,oz-(i+0.5)*cs)); }
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){ const x=ox+c*cs, z=oz+r*cs, v=st[r*n+c];
      g.fillStyle='#272037'; g.fillRect(x+1,z+1,cs-2,cs-2); pzSpeckle(g,x,z,cs,'#322946',3,r*n+c+1);
      if(v===1){ g.fillStyle='#a9a4b8'; pzRound(g,x+1.5,z+1.5,cs-3,cs-3,cs*0.2); g.fill(); g.fillStyle='#8a849d'; g.beginPath(); g.moveTo(x+cs*0.2,z+cs*0.25); g.quadraticCurveTo(x+cs*0.5,z+cs*0.5,x+cs*0.8,z+cs*0.3); g.lineTo(x+cs*0.8,z+cs*0.42); g.quadraticCurveTo(x+cs*0.5,z+cs*0.65,x+cs*0.2,z+cs*0.4); g.fill(); g.fillStyle='#d9d4e8'; g.fillRect(x+cs*0.18,z+cs*0.12,cs*0.3,2); }
      else if(v===2){ g.strokeStyle='#8f7fc0'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x+cs*0.3,z+cs*0.7); g.bezierCurveTo(x+cs*0.2,z+cs*0.4,x+cs*0.8,z+cs*0.5,x+cs*0.65,z+cs*0.25); g.stroke(); } }
    g.strokeStyle='#4a3f66'; g.lineWidth=2; for(let k=5;k<n;k+=5){ g.beginPath(); g.moveTo(ox+k*cs,oz); g.lineTo(ox+k*cs,py); g.moveTo(ox,oz+k*cs); g.lineTo(px,oz+k*cs); g.stroke(); }
  }
  const at=e=>{ const r=cv.getBoundingClientRect(), x=Math.floor((e.clientX-r.left)/r.width*gw)-maxR, z=Math.floor((e.clientY-r.top)/r.height*gh)-maxC; return x<0||z<0||x>=n||z>=n?-1:z*n+x; };
  const apply=e=>{ const c=at(e); if(c<0||won||st[c]===paint) return; st[c]=paint; draw(); };
  cv.addEventListener('pointerdown',e=>{ const c=at(e); if(c<0||won) return; cv.setPointerCapture(e.pointerId); paint=st[c]===mode?0:mode; apply(e); });
  cv.addEventListener('pointermove',e=>{ if(paint>=0&&e.buttons) apply(e); });
  const end=()=>{ if(paint<0) return; paint=-1; api.save({st:{g:st.slice()},secs:0}); const ans=st.map(v=>v===1?1:0); if(ngCheck(B,ans)){ won=true; api.solved(ans); } };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
  draw();
  return { reset(){ st.fill(0); won=false; draw(); }, state(){ return {g:st.slice()}; } };
}};
