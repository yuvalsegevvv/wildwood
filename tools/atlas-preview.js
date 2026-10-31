//@ node tools/atlas-preview.js out.png [--step 3] [--region x0,z0,x1,z1] [--plain]: the game's own rawHeight drawn as a map (hillshade, sea, rivers and lakes, zone and land borders, roads, anchors).
/* Agent map. Renders what the game computes (shared/terrain-height.js rawHeight, via tools/load.js), not the atlas's baked terraces, so the ground can be judged without a browser.
   Colours: hypsometric tint (a hue per land), blue sea / water, light-blue ice, thin dark lines the zone borders, thick black the land borders, brown the roads, then the anchors:
   red square = a village (hub), yellow diamond = a gate, white dot = a boss, magenta = a dungeon door, small white = a zone entrance, cyan = the Proving Isle.
   --plain: no borders, roads or anchors (the ground alone). --step: metres per pixel (default 3; 2 for a close-up region). Needs only node (a PNG writer is built in).
   Test: tools/atlas-smoke.js. Used from: docs/world-atlas.py's workflow (judge a re-bake). */
const fs=require('fs'), zlib=require('zlib');
const {loadShared}=require('./load.js');
const args=process.argv.slice(2), out=args.find(a=>a.endsWith('.png'));
const opt=(n,d)=>{ const i=args.indexOf('--'+n); return i<0?d:args[i+1]; };
if(!out){ console.error('usage: node tools/atlas-preview.js out.png [--step 3] [--region x0,z0,x1,z1] [--plain]'); process.exit(1); }
const S=loadShared(['rawHeight','WX0','WX1','WZ0','WZ1','waLandId','waZoneId','waWater','waIsSea','waWaterDist','WA_HUBS','WA_GATES','WA_POIS','WA_ENTRANCES','WA_ROADS','WA_PVP','WA_RIVERS','WA_ISLANDS','waWaterSurf']);
const step=+opt('step',3), plain=args.includes('--plain');
const reg=opt('region',null)?opt('region').split(',').map(Number):[S.WX0,S.WZ0,S.WX1,S.WZ1];
const [rx0,rz0,rx1,rz1]=reg, W=Math.ceil((rx1-rx0)/step), H=Math.ceil((rz1-rz0)/step);
const hs=new Float32Array((W+2)*(H+2)), wat=new Uint8Array(W*H), land=new Uint8Array(W*H), zone=new Int16Array(W*H), sea=new Uint8Array(W*H);
for(let j=-1;j<=H;j++) for(let i=-1;i<=W;i++) hs[(j+1)*(W+2)+i+1]=S.rawHeight(rx0+(i+0.5)*step,rz0+(j+0.5)*step);
for(let j=0;j<H;j++) for(let i=0;i<W;i++){ const x=rx0+(i+0.5)*step, z=rz0+(j+0.5)*step, k=j*W+i;
  land[k]=S.waLandId(x,z); zone[k]=S.waZoneId(x,z); sea[k]=S.waIsSea(x,z)?1:0; wat[k]=sea[k]?0:S.waWater(x,z); }
const stops=[[-30,.10,.22,.40],[-0.01,.20,.42,.62],[0,.80,.76,.58],[4,.50,.66,.36],[25,.42,.58,.30],[50,.62,.62,.40],[90,.62,.52,.38],[140,.55,.48,.44],[190,.80,.78,.78],[240,.97,.97,.98]];
const tint=h=>{ if(h<=stops[0][0]) return stops[0].slice(1); for(let i=1;i<stops.length;i++) if(h<=stops[i][0]){ const a=stops[i-1], b=stops[i], t=(h-a[0])/(b[0]-a[0]); return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t]; } return stops[stops.length-1].slice(1); };
const HUE=[[.25,.55,.30],[.95,.60,.75],[.60,.75,.95],[.75,.70,.80],[.95,.78,.45],[.55,.45,.70],[.9,.6,.3],[.25,.75,.7]];   // home, vale, hoar, grey, sun, gloam, amber, isles
const buf=Buffer.alloc(W*H*3);
for(let j=0;j<H;j++) for(let i=0;i<W;i++){
  const k=j*W+i, hk=(j+1)*(W+2)+i+1, h=hs[hk];
  let c=tint(h);
  if(!sea[k]){ const hc=HUE[land[k]]; c=c.map((v,q)=>v*0.8+hc[q]*0.2); }
  const gx=(hs[hk+1]-hs[hk-1])/(2*step), gz=(hs[hk+W+2]-hs[hk-W-2])/(2*step);
  const sh=Math.max(0.35,Math.min(1.3,0.85+(-gx*0.7-gz*0.7)*1.6));   // light from the north-west
  c=c.map(v=>v*sh);
  if(wat[k]===2||wat[k]===3) c=[0.22,0.45,0.70]; else if(wat[k]===4) c=[0.78,0.88,0.95];
  if(!plain&&i>0&&j>0){ const l=land[k], lw=land[k-1], lu=land[k-W]; if(!sea[k]&&((l!==lw&&!sea[k-1])||(l!==lu&&!sea[k-W]))) c=[0.05,0.04,0.04];
    else if(!sea[k]&&zone[k]>=0&&((zone[k]!==zone[k-1]&&zone[k-1]>=0)||(zone[k]!==zone[k-W]&&zone[k-W]>=0))) c=c.map(v=>v*0.6); }
  buf[k*3]=Math.max(0,Math.min(255,c[0]*255)); buf[k*3+1]=Math.max(0,Math.min(255,c[1]*255)); buf[k*3+2]=Math.max(0,Math.min(255,c[2]*255));
}
const px=(x,z,col)=>{ const i=Math.round((x-rx0)/step), j=Math.round((z-rz0)/step); if(i<0||j<0||i>=W||j>=H) return; const k=(j*W+i)*3; buf[k]=col[0]; buf[k+1]=col[1]; buf[k+2]=col[2]; };
const mark=(x,z,r,col,shape)=>{ const R=Math.max(1,Math.round(r/step)); for(let dj=-R;dj<=R;dj++) for(let di=-R;di<=R;di++){ if(shape==='d'&&Math.abs(di)+Math.abs(dj)>R) continue; if(shape==='o'&&di*di+dj*dj>R*R) continue; px(x+di*step,z+dj*step,col); } };
if(!plain){
  for(const r of S.WA_ROADS) for(let i=1;i<r.pts.length;i++){ const a=r.pts[i-1], b=r.pts[i], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step)); for(let q=0;q<=n;q++) px(a[0]+(b[0]-a[0])*q/n,a[1]+(b[1]-a[1])*q/n,[140,95,50]); }
  for(const e of S.WA_ENTRANCES) mark(e.x,e.z,4,[255,255,255],'o');
  for(const p of S.WA_POIS) mark(p.x,p.z,10,p.kind==='boss'?[255,255,255]:[230,40,230],'o');
  for(const g of S.WA_GATES) mark(g.x,g.z,14,[255,215,0],'d');
  for(const k in S.WA_HUBS) mark(S.WA_HUBS[k][0],S.WA_HUBS[k][1],14,[230,30,30],'s');
  mark(S.WA_PVP.x,S.WA_PVP.z,10,[0,230,230],'o');
}
// PNG
const crcT=new Int32Array(256).map((_,n)=>{ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; return c; });
const crc=b=>{ let c=-1; for(const v of b) c=crcT[(c^v)&255]^(c>>>8); return (c^-1)>>>0; };
const chunk=(t,d)=>{ const l=Buffer.alloc(4); l.writeUInt32BE(d.length); const td=Buffer.concat([Buffer.from(t),d]), cc=Buffer.alloc(4); cc.writeUInt32BE(crc(td)); return Buffer.concat([l,td,cc]); };
const raw=Buffer.alloc((W*3+1)*H); for(let j=0;j<H;j++){ raw[j*(W*3+1)]=0; buf.copy(raw,j*(W*3+1)+1,j*W*3,(j+1)*W*3); }
const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4); ihdr[8]=8; ihdr[9]=2;
fs.writeFileSync(out,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))]));
console.log('wrote',out,W+'x'+H,'px, step',step,'m');
