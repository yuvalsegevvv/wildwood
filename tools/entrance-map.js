// Draws docs/dungeon-entrances.png: the four dungeon entrances (shared/dungeons.js, DG_ENTRANCES) on the real terrain, one panel for each land: a hillshaded map with
// the zone borders (white), roads (brown), village walls (orange), boss arenas (magenta), each door as a red ring with its number and the way it faces (a yellow tick),
// its signpost on the nearest road (a white ring) and the dotted route from the signpost to the apron. Pure node (zlib writes the PNG): no packages.
// Usage: node tools/entrance-map.js [out.png]      (default docs/dungeon-entrances.png; run it again if an entrance moves)
const fs=require('fs'), zlib=require('zlib'), path=require('path');
const {loadShared}=require('./load');
const X=loadShared(['rawHeight','zoneAt','ROADS','VIL','VIL2','VIL3','VIL4','VR','ARENAS','WATER','DG_ENTRANCES','dgApron']);
const FONT={'1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001'};   // 3 x 5 digits: the doors' numbers
function png(w,h,rgb){
  const raw=Buffer.alloc((w*3+1)*h); for(let y=0;y<h;y++){ raw[y*(w*3+1)]=0; rgb.copy(raw,y*(w*3+1)+1,y*w*3,(y+1)*w*3); }
  const chunk=(t,d)=>{ const len=Buffer.alloc(4); len.writeUInt32BE(d.length); const td=Buffer.concat([Buffer.from(t),d]), crc=Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td)>>>0); return Buffer.concat([len,td,crc]); };
  const ih=Buffer.alloc(13); ih.writeUInt32BE(w,0); ih.writeUInt32BE(h,4); ih[8]=8; ih[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function panel({x0,z0,x1,z1,ppm},E,num){
  const W=Math.round((x1-x0)*ppm), H=Math.round((z1-z0)*ppm), img=Buffer.alloc(W*H*3), hs=new Float32Array(W*H), step=1/ppm;
  for(let j=0;j<H;j++) for(let i=0;i<W;i++) hs[j*W+i]=X.rawHeight(x0+i*step,z0+j*step);
  const put=(i,j,c)=>{ if(i<0||j<0||i>=W||j>=H) return; const k=(j*W+i)*3; img[k]=c[0]; img[k+1]=c[1]; img[k+2]=c[2]; };
  for(let j=0;j<H;j++) for(let i=0;i<W;i++){
    const h=hs[j*W+i], hx=hs[j*W+Math.min(W-1,i+1)]-hs[j*W+Math.max(0,i-1)], hz=hs[Math.min(H-1,j+1)*W+i]-hs[Math.max(0,j-1)*W+i];
    const shade=Math.max(0.45,Math.min(1.4,1+(-hx*0.7-hz*0.7)/(2*step)*0.5)), t=Math.max(0,Math.min(1,h/90));
    put(i,j,h<X.WATER+0.15?[70,110,160]:[90+120*t,130+80*t,70+130*t].map(v=>Math.max(0,Math.min(255,(v*shade)|0))));
  }
  const zone=(i,j)=>{ const q=X.zoneAt(x0+i*step,z0+j*step); return q?q.name:''; };
  for(let j=0;j<H-1;j++) for(let i=0;i<W-1;i++){ const a=zone(i,j); if(a!==zone(i+1,j)||a!==zone(i,j+1)) put(i,j,[255,255,255]); }
  for(const rd of X.ROADS) for(let k=1;k<rd.pts.length;k++){ const [ax,az]=rd.pts[k-1],[bx,bz]=rd.pts[k], n=Math.ceil(Math.hypot(bx-ax,bz-az)*ppm*1.5); for(let q=0;q<=n;q++){ const t=q/n; put(Math.round((ax+(bx-ax)*t-x0)*ppm),Math.round((az+(bz-az)*t-z0)*ppm),[150,100,50]); } }
  const ring=(cx,cz,r,c,th)=>{ const n=Math.max(24,Math.round(r*ppm*7)); for(let q=0;q<n;q++){ const a=q/n*Math.PI*2; for(let d=0;d<th;d++) put(Math.round((cx+Math.sin(a)*(r+d/ppm)-x0)*ppm),Math.round((cz+Math.cos(a)*(r+d/ppm)-z0)*ppm),c); } };
  for(const V of [X.VIL,X.VIL2,X.VIL3,X.VIL4]) ring(V.x,V.z,X.VR,[255,160,30],2);
  for(const A of X.ARENAS) ring(A.x,A.z,A.r,[200,60,200],2);
  // the route (dotted), the signpost, the door
  const A=X.dgApron(E), n=Math.ceil(Math.hypot(A.x-E.sign.x,A.z-E.sign.z)*ppm/4);
  for(let q=0;q<=n;q+=2){ const t=q/n, i=Math.round((E.sign.x+(A.x-E.sign.x)*t-x0)*ppm), j=Math.round((E.sign.z+(A.z-E.sign.z)*t-z0)*ppm); for(let a=0;a<2;a++) for(let b=0;b<2;b++) put(i+a,j+b,[255,240,60]); }
  ring(E.sign.x,E.sign.z,3,[255,255,255],2); ring(E.x,E.z,6,[255,30,30],2);
  const px=Math.round((E.x-x0)*ppm), pz=Math.round((E.z-z0)*ppm);
  for(let q=0;q<=14;q++) put(px+Math.round(Math.sin(E.a)*q),pz+Math.round(Math.cos(E.a)*q),[255,255,0]);
  const g=FONT[num]; for(let r=0;r<5;r++) for(let q=0;q<3;q++) if(g[r*3+q]==='1') for(let a=0;a<2;a++) for(let b=0;b<2;b++) put(px+9+q*2+a,pz-13+r*2+b,[255,255,255]);
  return {W,H,img};
}
// the four panels: Wildwood (with the village in the corner), the Sakura Vale's Jade Falls, the Reach's Barrow, the Greyspine's Highmark Pastures
const PANELS=[['hollowroots','1',{x0:-60,z0:-60,x1:400,z1:400,ppm:1}],['jadesprings','2',{x0:740,z0:-60,x1:990,z1:240,ppm:1.7}],['bonefrostbarrow','3',{x0:230,z0:-1020,x1:440,z1:-780,ppm:1.8}],['blackseam','4',{x0:-330,z0:-780,x1:-160,z1:-630,ppm:2}]];
const parts=PANELS.map(([id,num,box])=>panel(box,X.DG_ENTRANCES[id],num)), gap=12;
const W=parts.reduce((a,p)=>a+p.W,0)+gap*(parts.length-1), H=Math.max(...parts.map(p=>p.H)), out=Buffer.alloc(W*H*3,24);
let ox=0; for(const p of parts){ for(let y=0;y<p.H;y++) p.img.copy(out,(y*W+ox)*3,y*p.W*3,(y+1)*p.W*3); ox+=p.W+gap; }
const file=process.argv[2]||path.join(__dirname,'..','docs','dungeon-entrances.png');
fs.writeFileSync(file,png(W,H,out)); console.log('wrote '+file+' ('+W+' x '+H+')');
