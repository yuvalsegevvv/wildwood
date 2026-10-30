//@ Shared helpers of the puzzle views: a square canvas sized to the panel, and a pointer position in cells
/* Agent map. pzCanvas(host,w,h,maxPx) -> {cv, g, cs (cell px), px, py}; pzCell(cv,ev,w,h) -> cell index or -1 for a pointer event. Used by puzzles/sudoku.js ... sokoban.js. Test: client-smoke (loads), tools/puzzles-smoke.js (the rules). */
function pzCanvas(host,w,h,frac){
  const side=Math.min(host.clientWidth||360,Math.max(240,Math.floor((window.innerHeight||700)*(frac||0.55))),460), cs=Math.floor(side/Math.max(w,h));
  const cv=document.createElement('canvas'); cv.width=cs*w; cv.height=cs*h; cv.className='pz-canvas'; cv.style.touchAction='none'; host.append(cv);
  return {cv,g:cv.getContext('2d'),cs,px:cs*w,py:cs*h};
}
function pzCell(cv,ev,w,h){ const r=cv.getBoundingClientRect(), x=Math.floor((ev.clientX-r.left)/r.width*w), z=Math.floor((ev.clientY-r.top)/r.height*h); return x<0||z<0||x>=w||z>=h?-1:z*w+x; }
