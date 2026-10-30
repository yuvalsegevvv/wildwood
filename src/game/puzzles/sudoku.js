//@ Shrine tiles on the client: a grid of buttons and a pad of blossom glyphs; pick a cell, pick a glyph
/* Agent map. PZV.sudoku.mount(host,B,api,saved). State = the n*n values. Digits 1..n are drawn as glyphs (SU_GLYPH) and also typed with the keyboard. Solved when suCheck passes. Test: client-smoke (loads), puzzles-smoke (rules). */
const SU_GLYPH=['','✿','❀','✾','❁','✦','❂','✧','❃','✺'];
PZV.sudoku={mount(host,B,api,saved){
  const n=B.n, vals=B.given.slice(); if(saved&&Array.isArray(saved.vals)&&saved.vals.length===n*n) for(let i=0;i<n*n;i++) if(!B.given[i]&&Number.isInteger(saved.vals[i])&&saved.vals[i]>=0&&saved.vals[i]<=n) vals[i]=saved.vals[i];
  let sel=-1, won=false;
  const grid=document.createElement('div'); grid.className='pz-su'; grid.style.gridTemplateColumns='repeat('+n+',1fr)'; host.append(grid);
  const pad=document.createElement('div'); pad.className='pz-su-pad'; host.append(pad);
  const cells=[];
  for(let i=0;i<n*n;i++){ const b=document.createElement('button'); b.className='pz-su-c'; const r=(i/n)|0, c=i%n;
    if(c%B.bw===B.bw-1&&c<n-1) b.classList.add('rb'); if(r%B.bh===B.bh-1&&r<n-1) b.classList.add('bb');
    b.addEventListener('click',()=>{ sel=i; paint(); }); grid.append(b); cells.push(b); }
  const mk=(label,v)=>{ const b=document.createElement('button'); b.className='chip'; b.textContent=label; b.addEventListener('click',()=>put(v)); pad.append(b); };
  for(let d=1;d<=n;d++) mk(SU_GLYPH[d]+' '+d,d); mk('Clear',0);
  function paint(){
    const peers=sel>=0?suPeers(n,B.bh,B.bw)[sel]:[];
    cells.forEach((b,i)=>{ const v=vals[i]; b.textContent=v?SU_GLYPH[v]+String(v):''; b.className=b.className.replace(/ ?(given|sel|peer|bad)/g,'');
      if(B.given[i]) b.classList.add('given'); if(i===sel) b.classList.add('sel'); else if(peers.includes(i)) b.classList.add('peer');
      if(v&&suPeers(n,B.bh,B.bw)[i].some(q=>vals[q]===v)) b.classList.add('bad'); });
  }
  function put(v){ if(sel<0||B.given[sel]||won) return; vals[sel]=v; paint(); api.save({st:{vals},secs:0}); if(vals.every(x=>x)&&suCheck(B,vals)){ won=true; api.solved(vals.slice()); } }
  window.addEventListener('keydown',e=>{ if(!grid.isConnected||$('#puzzle').hidden) return; const d=parseInt(e.key,10); if(d>=0&&d<=n){ put(d); e.stopPropagation(); } },true);
  paint();
  return { reset(){ for(let i=0;i<n*n;i++) vals[i]=B.given[i]; paint(); }, state(){ return {vals}; } };
}};
