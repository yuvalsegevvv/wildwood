//@ Shared helpers of the puzzle views: a square canvas sized to the panel, and a pointer position in cells
/* Agent map. pzCanvas(host,w,h,maxPx) -> {cv, g, cs (cell px), px, py}; pzCell(cv,ev,w,h) -> cell index or -1 for a pointer event. Used by puzzles/sudoku.js ... sokoban.js. Test: client-smoke (loads), tools/puzzles-smoke.js (the rules). */
function pzCanvas(host,w,h,frac){
  const side=Math.min(host.clientWidth||360,Math.max(240,Math.floor((window.innerHeight||700)*(frac||0.55))),460), cs=Math.floor(side/Math.max(w,h));
  const cv=document.createElement('canvas'); cv.width=cs*w; cv.height=cs*h; cv.className='pz-canvas'; cv.style.touchAction='none'; host.append(cv);
  return {cv,g:cv.getContext('2d'),cs,px:cs*w,py:cs*h};
}
function pzCell(cv,ev,w,h){ const r=cv.getBoundingClientRect(), x=Math.floor((ev.clientX-r.left)/r.width*w), z=Math.floor((ev.clientY-r.top)/r.height*h); return x<0||z<0||x>=w||z>=h?-1:z*w+x; }
// theme helpers (every kind draws in its zone's look): a stable 0..1 hash of two numbers, speckles, a rounded rectangle path
function pzHash(a,b){ let h=(a*374761393+b*668265263)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967296; }
function pzSpeckle(g,x,z,cs,col,n,seed){ g.fillStyle=col; for(let i=0;i<n;i++){ const px=x+pzHash(seed,i*2)*cs, pz=z+pzHash(seed,i*2+1)*cs, r=0.6+pzHash(i,seed)*cs*0.05; g.fillRect(px,pz,r,r); } }
function pzRound(g,x,z,w,h,r){ g.beginPath(); g.moveTo(x+r,z); g.arcTo(x+w,z,x+w,z+h,r); g.arcTo(x+w,z+h,x,z+h,r); g.arcTo(x,z+h,x,z,r); g.arcTo(x,z,x+w,z,r); g.closePath(); }
