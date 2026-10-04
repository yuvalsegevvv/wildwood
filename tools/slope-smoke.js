// Headless test of the slope limit (SLOPE_MAX in src/game/player/movement.js: a step that climbs more than 1.2 m a metre is refused): from the home village every village, boss arena, zone,
// resource node and dungeon door is still reachable on foot (a flood fill over the terrain on a 4 m grid, climbing only steps the limit allows, never wading deeper than the knees, crossing the
// Greyfall River by its bridge only), and nearly all of every land's ground is. Straight from src/, no build. One line per check; exits 1 on failure.
// Usage: node tools/slope-smoke.js
const fs=require('fs'), path=require('path');
const {loadShared}=require('./load');
const X=loadShared(['rawHeight','bridgeDeck','landAt','WX0','WX1','WZ0','WZ1','NODES','ARENAS','ZONES','VIL','VIL2','VIL3','VIL4','WATER','NODE_KEEPOUT']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const src=fs.readFileSync(path.join(__dirname,'../src/game/player/movement.js'),'utf8'), m=/const SLOPE_MAX=([0-9.]+);/.exec(src), LIM=m?+m[1]:NaN, C=4;
ok('the limit is in movement.js and is a sensible number (1.0-1.5: a 45-56 degree face)',LIM>=1&&LIM<=1.5,'SLOPE_MAX '+LIM);
const W=Math.floor((X.WX1-X.WX0)/C)+1, D=Math.floor((X.WZ1-X.WZ0)/C)+1, hh=new Float32Array(W*D), px=i=>X.WX0+i*C, pz=j=>X.WZ0+j*C;
for(let j=0;j<D;j++) for(let i=0;i<W;i++) hh[j*W+i]=Math.max(X.rawHeight(px(i),pz(j)),X.bridgeDeck(px(i),pz(j)));
const walk=k=>hh[k]>X.WATER-0.8, seen=new Uint8Array(W*D), q=new Int32Array(W*D); let qh=0, qt=0;
const s0=Math.round((X.VIL.z+8-X.WZ0)/C)*W+Math.round((X.VIL.x+8-X.WX0)/C); seen[s0]=1; q[qt++]=s0;
const nb=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
while(qh<qt){ const k=q[qh++], i=k%W, j=(k-i)/W; for(const [di,dj,r] of nb){ const a=i+di, b=j+dj; if(a<2||b<2||a>=W-2||b>=D-2) continue; const n=b*W+a; if(seen[n]||!walk(n)||(hh[n]-hh[k])/(C*r)>LIM) continue; seen[n]=1; q[qt++]=n; } }
const reach=(x,z,r)=>{ for(let dz=-r;dz<=r;dz+=C) for(let dx=-r;dx<=r;dx+=C){ const i=Math.round((x+dx-X.WX0)/C), j=Math.round((z+dz-X.WZ0)/C); if(i>=0&&j>=0&&i<W&&j<D&&seen[j*W+i]) return true; } return false; };
const lacks=(pts,r)=>pts.filter(p=>!reach(p[0],p[1],r)).map(p=>(p[2]||'')+Math.round(p[0])+','+Math.round(p[1]));
{ const bad=lacks([[X.VIL.x,X.VIL.z,'home '],[X.VIL2.x,X.VIL2.z,'Hanami '],[X.VIL3.x,X.VIL3.z,'Rimehold '],[X.VIL4.x,X.VIL4.z,'Highmark ']],10);
  ok('the four villages are reachable from the home village (the bridge, Frostgate Pass and the glacier valley open)',bad.length===0,bad.join(' | ')); }
{ const bad=lacks(X.ARENAS.map(a=>[a.x,a.z,a.key+' ']),24); ok('every boss arena is reachable',bad.length===0,X.ARENAS.length+' arenas'+(bad.length?'; not: '+bad.join(' | '):'')); }
{ const bad=lacks(X.ZONES.filter(z=>isFinite(z.x)&&isFinite(z.z)).map(z=>[z.x,z.z,z.key+' ']),16); ok('every zone with a centre is reachable',bad.length===0,bad.join(' | ')); }
{ const bad=lacks(X.NODES.map(n=>[n.x,n.z,n.kind+' ']),8); ok('every resource node is reachable',bad.length===0,X.NODES.length+' nodes'+(bad.length?'; not: '+bad.join(' | '):'')); }
{ const bad=lacks(X.NODE_KEEPOUT.map(d=>[d[0],d[1]]),8); ok('the four dungeon doors are reachable',bad.length===0,bad.join(' | ')); }
{ const by={}; for(let j=0;j<D;j++) for(let i=0;i<W;i++){ const k=j*W+i; if(hh[k]<1) continue; const l=X.landAt(px(i),pz(j)), o=by[l]=by[l]||[0,0]; o[0]++; if(seen[k]) o[1]++; }
  const share=l=>by[l][1]/by[l][0];
  ok('nearly all dry ground of every land can be walked to: 90% or more in each',['home','vale','hoar','grey'].every(l=>share(l)>=0.9),Object.keys(by).map(l=>l+' '+(100*share(l)).toFixed(0)+'%').join(', ')); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
