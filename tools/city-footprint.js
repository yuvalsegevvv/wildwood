//@ Glasswell's collision check: draws the model's walls at head height next to the colliders (VIL5's boxes and circles) and lists what is solid but walkable or blocked but empty
// Usage: node tools/city-footprint.js [outDir] [--size 1400]  -> outDir/footprint.png (green = model wall, red outline = collider; a red-only area is an invisible wall, a green-only one can be walked through) and a summary.
// Needs playwright + Chromium (like city-preview.js, whose page it reuses). Exit 1 when more than a few cells disagree. Test: glasswell-smoke covers the data, this one the model.
const fs=require('fs'), path=require('path'), os=require('os'), cp=require('child_process'), {loadShared}=require('./load');
const outDir=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:path.join(os.tmpdir(),'city-footprint');
const S=loadShared(['VIL5','SUN_CITY','GLASSWELL']), C=S.SUN_CITY, V=S.VIL5, GL=S.GLASSWELL;
cp.execFileSync('node',[path.join(__dirname,'city-preview.js'),outDir,'--views','top'],{stdio:'pipe'});
const names=[...Array(GL.homes.length).keys()].map(i=>'home'+i).concat(GL.places.filter(p=>p.w>0).map(p=>p.id),['gates']);
const data={names,boxes:V.boxes.map(b=>({x:b.x-C.x,z:b.z-C.z,rot:b.rot,hw:b.hw,hd:b.hd})),circles:V.circles.map(c=>[c[0]-C.x,c[1]-C.z,c[2]])};
(async()=>{
  const {chromium}=require('playwright'), b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage(); await pg.goto('file://'+path.join(outDir,'city-preview.html')); await pg.waitForFunction('window.ready===true',null,{timeout:60000});
  const res=await pg.evaluate(D=>{
    const R=110, CELL=0.5, N=Math.round(2*R/CELL), solid=new Uint8Array(N*N), col=new Uint8Array(N*N);
    const mark=(x,z)=>{ const i=Math.floor((x+R)/CELL), j=Math.floor((z+R)/CELL); if(i>=0&&j>=0&&i<N&&j<N) solid[j*N+i]=1; };
    city.updateMatrixWorld(true); const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
    city.traverse(o=>{ if(!o.isMesh||o.material===gwWaterMat) return; const g=o.geometry, pos=g.attributes.position, idx=g.index; const n=(idx?idx.count:pos.count)/3;
      if(o.geometry.attributes.color&&o.geometry.boundingBox===null) g.computeBoundingBox();
      for(let t=0;t<n;t++){ for(let k=0;k<3;k++){ const ii=idx?idx.getX(t*3+k):t*3+k; v[k].fromBufferAttribute(pos,ii).applyMatrix4(o.matrixWorld); }
        for(const y of [0.9,1.5]){ const pts=[]; for(let k=0;k<3;k++){ const a=v[k], b2=v[(k+1)%3]; if((a.y-y)*(b2.y-y)<0){ const u=(y-a.y)/(b2.y-a.y); pts.push([a.x+(b2.x-a.x)*u,a.z+(b2.z-a.z)*u]); } }
          if(pts.length===2){ const L=Math.hypot(pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]), m=Math.max(1,Math.ceil(L/(CELL*0.5))); for(let s=0;s<=m;s++) mark(pts[0][0]+(pts[1][0]-pts[0][0])*s/m,pts[0][1]+(pts[1][1]-pts[0][1])*s/m); } } } });
    const hit=(x,z)=>{ for(const b of D.boxes){ const dx=x-b.x, dz=z-b.z, c=Math.cos(b.rot), s=Math.sin(b.rot), lx=dx*c-dz*s, lz=dx*s+dz*c; if(Math.abs(lx)<b.hw&&Math.abs(lz)<b.hd) return true; } for(const c of D.circles) if(Math.hypot(x-c[0],z-c[1])<c[2]) return true; return false; };
    for(let j=0;j<N;j++) for(let i=0;i<N;i++) col[j*N+i]=hit(-R+(i+0.5)*CELL,-R+(j+0.5)*CELL)?1:0;
    // a wall cell is "covered" if a collider lies within 0.6 m; a collider cell is "backed" if a wall lies within 1.2 m (margins are 0.2-0.5 m by design)
    const near=(arr,i,j,r)=>{ for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const a=i+di,b2=j+dj; if(a>=0&&b2>=0&&a<N&&b2<N&&arr[b2*N+a]) return true; } return false; };
    const open=[], ghost=[]; const cv=document.createElement('canvas'); const PX=3; cv.width=cv.height=N*PX/ (CELL*2) ; const SC=cv.width/N; const g=cv.getContext('2d'); g.fillStyle='#222'; g.fillRect(0,0,cv.width,cv.height);
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const s=solid[j*N+i], c=col[j*N+i]; let colr=null;
      if(s&&!near(col,i,j,1)){ open.push([-R+(i+0.5)*CELL,-R+(j+0.5)*CELL]); colr='#3f3'; } else if(s) colr='#7a7';
      else if(c&&!near(solid,i,j,3)){ ghost.push([-R+(i+0.5)*CELL,-R+(j+0.5)*CELL]); colr='#f33'; } else if(c) colr='#a55';
      if(colr){ g.fillStyle=colr; g.fillRect(i*SC,j*SC,SC,SC); } }
    const cluster=(pts)=>{ const cl=[]; for(const p of pts){ let f=cl.find(c=>Math.hypot(c.x-p[0],c.z-p[1])<4); if(f){ f.n++; f.x+=(p[0]-f.x)/f.n; f.z+=(p[1]-f.z)/f.n; } else cl.push({x:p[0],z:p[1],n:1}); } return cl.filter(c=>c.n>=3).sort((a,b2)=>b2.n-a.n).map(c=>[Math.round(c.x),Math.round(c.z),c.n]); };
    // per box: how much of its inside is empty (no wall within 2 m): a court or a hollow shell is walkable in the model and blocked by the box
    const hollow=[]; D.boxes.forEach((bx,k)=>{ let tot=0, emp=0; for(let a=-bx.hw+0.25;a<bx.hw;a+=0.5) for(let c2=-bx.hd+0.25;c2<bx.hd;c2+=0.5){ const co=Math.cos(bx.rot), si=Math.sin(bx.rot), x=bx.x+a*co+c2*si, z=bx.z-a*si+c2*co, i=Math.floor((x+R)/CELL), j=Math.floor((z+R)/CELL); tot++; if(!near(solid,i,j,4)) emp++; } if(emp/tot>0.25&&D.names[k]) hollow.push(D.names[k]+' '+Math.round(100*emp/tot)+'%'); });
    return {hollow,open:cluster(open),ghost:cluster(ghost),img:cv.toDataURL('image/png')};
  },data);
  fs.writeFileSync(path.join(outDir,'footprint.png'),Buffer.from(res.img.split(',')[1],'base64'));
  console.log('boxes with an empty inside:',res.hollow.join(', '));
  console.log('walkable but solid in the model (x,z in the city frame, cells):',JSON.stringify(res.open.slice(0,40)));
  console.log('blocked but empty:',JSON.stringify(res.ghost.slice(0,40)));
  console.log('wrote',path.join(outDir,'footprint.png')); await b.close(); process.exit(res.open.length+res.ghost.length>6?1:0);
})().catch(e=>{ console.error(e.message); process.exit(1); });
