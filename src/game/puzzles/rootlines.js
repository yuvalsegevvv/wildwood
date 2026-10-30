//@ Rootlines on the client: a canvas board where you drag roots from a seed to its partner until every cell is filled
/* Agent map. PZV.rootlines.mount(host,B,api,saved) (puzzles/panel.js). B is shared/puzzles/rootlines.js's board {w,h,k,ends}. State = paths[i] (cell lists as drawn; a path may start at either seed).
   Dragging from a seed starts (and clears) its root; from the end of a root continues it; from the middle cuts it back. Crossing another root cuts that one back; stepping back undoes a cell.
   Solved when every root joins its two seeds and every cell is used: the answer sent is the k paths oriented from ends[i][0] to ends[i][1] (rlCheck). Test: client-smoke (loads), tools/puzzles-smoke.js (rlCheck). */
const RL_COL=i=>`hsl(${Math.round((i*137.5+20)%360)} ${i%2?62:72}% ${i%3===0?58:i%3===1?50:64}%)`;
PZV.rootlines={mount(host,B,api,saved){
  const w=B.w, h=B.h, N=w*h, side=Math.min(host.clientWidth||360,Math.max(240,Math.floor((window.innerHeight||700)*0.55)),440), cs=Math.floor(side/w), px=cs*w;
  const cv=document.createElement('canvas'); cv.width=cv.height=px; cv.className='pz-canvas'; cv.style.touchAction='none'; host.append(cv); const g=cv.getContext('2d');
  const seedOf=new Map(); B.ends.forEach((e,i)=>{ seedOf.set(e[0],i); seedOf.set(e[1],i); });
  let paths=B.ends.map(()=>[]), act=-1, won=false;
  if(saved&&Array.isArray(saved.paths)&&saved.paths.length===B.k) paths=saved.paths.map(p=>Array.isArray(p)?p.filter(c=>Number.isInteger(c)&&c>=0&&c<N):[]);
  const owner=()=>{ const o=new Int16Array(N).fill(-1); paths.forEach((p,i)=>p.forEach(c=>o[c]=i)); return o; };
  const complete=i=>{ const p=paths[i]; if(p.length<2) return false; const a=B.ends[i][0], b=B.ends[i][1]; return (p[0]===a&&p[p.length-1]===b)||(p[0]===b&&p[p.length-1]===a); };
  function draw(){
    g.clearRect(0,0,px,px); g.fillStyle='#10161c'; g.fillRect(0,0,px,px);
    const o=owner();
    for(let c=0;c<N;c++){ const x=(c%w)*cs, z=Math.floor(c/w)*cs; g.fillStyle=o[c]>=0?RL_COL(o[c]).replace(')',' / .22)'):'#18212a'; g.fillRect(x+1,z+1,cs-2,cs-2); }
    g.lineCap='round'; g.lineJoin='round';
    paths.forEach((p,i)=>{ if(p.length<2) return; g.strokeStyle=RL_COL(i); g.lineWidth=cs*0.38; g.beginPath(); p.forEach((c,j)=>{ const x=(c%w+0.5)*cs, z=(Math.floor(c/w)+0.5)*cs; j?g.lineTo(x,z):g.moveTo(x,z); }); g.stroke(); });
    B.ends.forEach((e,i)=>{ for(const c of e){ const x=(c%w+0.5)*cs, z=(Math.floor(c/w)+0.5)*cs; g.fillStyle=RL_COL(i); g.beginPath(); g.arc(x,z,cs*0.3,0,6.283); g.fill(); if(complete(i)){ g.strokeStyle='#fff8'; g.lineWidth=2; g.stroke(); } } });
  }
  const cellAt=ev=>{ const r=cv.getBoundingClientRect(), x=Math.floor((ev.clientX-r.left)/r.width*w), z=Math.floor((ev.clientY-r.top)/r.height*h); return x<0||z<0||x>=w||z>=h?-1:z*w+x; };
  const adj=(a,b)=>(Math.abs(a%w-b%w)+Math.abs(Math.floor(a/w)-Math.floor(b/w)))===1;
  function down(ev){
    if(won) return; const c=cellAt(ev); if(c<0) return; cv.setPointerCapture(ev.pointerId); const o=owner();
    if(seedOf.has(c)){ act=seedOf.get(c); paths[act]=[c]; }
    else if(o[c]>=0){ const i=o[c], p=paths[i], at=p.indexOf(c); if(complete(i)&&at!==p.length-1&&at!==0){ act=-1; return; } act=i; if(p[0]===B.ends[i][0]||p[0]===B.ends[i][1]) paths[i]=p.slice(0,at+1); else paths[i]=p.slice(0,at+1); }
    draw();
  }
  function move(ev){
    if(act<0||won) return; const c=cellAt(ev); if(c<0) return; const p=paths[act]; if(!p.length) return; const last=p[p.length-1];
    if(c===last||!adj(last,c)) return;
    if(p.length>1&&c===p[p.length-2]){ p.pop(); draw(); save(); return; }
    if(complete(act)) return;
    const sIdx=seedOf.get(c); if(sIdx!==undefined&&sIdx!==act) return;   // another colour's seed
    if(sIdx===act&&c===p[0]) return;
    const at=p.indexOf(c); if(at>=0){ paths[act]=p.slice(0,at+1); draw(); save(); return; }
    const o=owner(); if(o[c]>=0&&o[c]!==act){ const q=paths[o[c]], k=q.indexOf(c); paths[o[c]]=q.slice(0,k); if(paths[o[c]].length<2&&!seedOf.has(paths[o[c]][0])) paths[o[c]]=[]; }
    p.push(c); draw(); save(); check();
  }
  function up(){ act=-1; check(); }
  function check(){
    if(won) return; if(!paths.every((_,i)=>complete(i))) return; if(owner().some(v=>v<0)) return;
    const ans=paths.map((p,i)=>p[0]===B.ends[i][0]?p.slice():p.slice().reverse());
    if(rlCheck(B,ans)){ won=true; draw(); api.solved(ans); }
  }
  const save=()=>api.save({st:{paths},secs:0});
  cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  draw();
  return { reset(){ paths=B.ends.map(()=>[]); won=false; draw(); }, state(){ return {paths}; } };
}};
