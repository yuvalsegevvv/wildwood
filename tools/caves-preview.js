// A quick picture of one cave site without booting the game: its rock mesh (the real cvMesh, painted by cvColorAt), the carved ground around it, the sea and the tide-pool patches, lit like the game, drawn by three.js in headless Chromium.
// Usage: node tools/caves-preview.js out.png --site arches [--at x,y,z --look x,y,z] [--cell 1.2] [--size 800x480] [--fov 60] [--ground 90] [--dim 0.45]
//   --at / --look   camera and target in WORLD metres (default: in front of the site's middle, looking at it); --dim: hemisphere light scale (0.45 = the inside of a cave)
// Needs playwright + Chromium (node tools/doctor.js says) and the three package. Seconds, not minutes: only the site is drawn.
const fs=require('fs'), path=require('path'), {loadShared}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:d; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'caves.png', id=arg('--site','arches'), cell=+arg('--cell',1.2), [W,H]=arg('--size','800x480').split('x').map(Number), fov=+arg('--fov',60), dim=+arg('--dim',1), G=+arg('--ground',90);
const X=loadShared(['CV_SITES','CV_BAD','cvMesh','cvSdf','rawHeight','cvGroundTint','WATER']);
const S=X.CV_SITES.find(s=>s.id===id); if(!S){ console.error('no site',id,'(have',X.CV_SITES.map(s=>s.id).join(', ')+')',X.CV_BAD); process.exit(1); }
const t0=Date.now(), m=X.cvMesh(S,cell,X.rawHeight); console.log(id,'mesh',m.tris,'tris at',cell,'m in',Date.now()-t0,'ms');
const at=arg('--at',null), look=arg('--look',null);
const f=(S.bx0+S.bx1)/2, g=(S.bz0+S.bz1)/2, ux=Math.cos(S.yaw), uz=Math.sin(S.yaw);
const cam=at?at.split(',').map(Number):[S.x-ux*70,S.fy+16,S.z-uz*70], tgt=look?look.split(',').map(Number):[S.x+ux*6,S.fy+8,S.z+uz*6];
// the ground around the site: the game's rawHeight (carve included), 2 m cells
const x0=S.bx0-G, x1=S.bx1+G, z0=S.bz0-G, z1=S.bz1+G, step=2, nx=Math.floor((x1-x0)/step)+1, nz=Math.floor((z1-z0)/step)+1, hs=new Float32Array(nx*nz), cs=new Float32Array(nx*nz*3);
for(let j=0;j<nz;j++) for(let i=0;i<nx;i++) hs[j*nx+i]=X.rawHeight(x0+i*step,z0+j*step);
const col={r:0,g:0,b:0,set(a,b,c){ this.r=a; this.g=b; this.b=c; return this; }};
for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){
  const h=hs[j*nx+i], hx=hs[j*nx+Math.min(nx-1,i+1)]-hs[j*nx+Math.max(0,i-1)], hz=hs[Math.min(nz-1,j+1)*nx+i]-hs[Math.max(0,j-1)*nx+i], sl=Math.hypot(hx,hz)/(2*step);
  const c={r:0.80,g:0.69,b:0.47}; // desert ground
  if(h<1.2){ c.r=0.86; c.g=0.78; c.b=0.58; } if(sl>0.7){ c.r=0.58; c.g=0.43; c.b=0.30; } if(h<-0.3){ c.r=0.35; c.g=0.33; c.b=0.28; }
  X.cvGroundTint(x0+i*step,z0+j*step,h,c); cs.set([c.r,c.g,c.b],(j*nx+i)*3);
}
const b64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
const data={mesh:{pos:b64(m.pos),nor:b64(m.nor),col:b64(m.col),idx:b64(m.idx)},ground:{nx,nz,x0,z0,step,h:b64(hs),c:b64(cs)},pools:S.pools.map(p=>({x:p.wx,z:p.wz,r:p.r*0.8,y:S.fy-p.depth*0.45})),cam,tgt,fov,W,H,dim,fy:S.fy};
const three=fs.readFileSync(require.resolve('three/build/three.min.js'),'utf8');
const html=`<!doctype html><meta charset=utf8><body style="margin:0;background:#9fc3d6"><canvas id=c width=${W} height=${H}></canvas><script>${three}</script><script>
const D=${JSON.stringify(data)};
const f32=s=>new Float32Array(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer), u32=s=>new Uint32Array(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer);
const r=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true}); r.setSize(D.W,D.H,false);
const sc=new THREE.Scene(); sc.background=new THREE.Color(0xa9cde0); sc.fog=new THREE.Fog(0xcfd9d8,160,520);
const hemi=new THREE.HemisphereLight(0xc4d6e6,0x4d4a33,1.0*D.dim), sun=new THREE.DirectionalLight(0xfff0d0,0.9*(D.dim<0.7?0.0:1)); sun.position.set(-60,90,40); sc.add(hemi,sun);
let g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(f32(D.mesh.pos),3)); g.setAttribute('normal',new THREE.BufferAttribute(f32(D.mesh.nor),3)); g.setAttribute('color',new THREE.BufferAttribute(f32(D.mesh.col),3)); g.setIndex(new THREE.BufferAttribute(u32(D.mesh.idx),1));
sc.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true})));
{ const q=D.ground, H=f32(q.h), C=f32(q.c), n=q.nx*q.nz, P=new Float32Array(n*3), N=new Float32Array(n*3), idx=[];
  for(let j=0;j<q.nz;j++) for(let i=0;i<q.nx;i++){ const k=j*q.nx+i; P[k*3]=q.x0+i*q.step; P[k*3+1]=H[k]; P[k*3+2]=q.z0+j*q.step;
    const hx=H[j*q.nx+Math.min(q.nx-1,i+1)]-H[j*q.nx+Math.max(0,i-1)], hz=H[Math.min(q.nz-1,j+1)*q.nx+i]-H[Math.max(0,j-1)*q.nx+i], l=Math.hypot(hx,2*q.step,hz); N[k*3]=-hx/l; N[k*3+1]=2*q.step/l; N[k*3+2]=-hz/l; }
  for(let j=0;j<q.nz-1;j++) for(let i=0;i<q.nx-1;i++){ const a=j*q.nx+i, b=a+1, c=a+q.nx, d=c+1; idx.push(a,c,b,b,c,d); }
  const t=new THREE.BufferGeometry(); t.setAttribute('position',new THREE.BufferAttribute(P,3)); t.setAttribute('normal',new THREE.BufferAttribute(N,3)); t.setAttribute('color',new THREE.BufferAttribute(C,3)); t.setIndex(idx);
  sc.add(new THREE.Mesh(t,new THREE.MeshLambertMaterial({vertexColors:true}))); }
const sea=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshPhongMaterial({color:0x2c5560,transparent:true,opacity:0.84,shininess:140,specular:0x8fa4b4})); sea.rotation.x=-Math.PI/2; sc.add(sea);
for(const p of D.pools){ const m=new THREE.Mesh(new THREE.CircleGeometry(p.r,14),new THREE.MeshPhongMaterial({color:0x3f7568,transparent:true,opacity:0.8,shininess:90,specular:0x9ab8b4})); m.rotation.x=-Math.PI/2; m.position.set(p.x,p.y,p.z); sc.add(m); }
const cam=new THREE.PerspectiveCamera(D.fov,D.W/D.H,0.1,900); cam.position.set(...D.cam); cam.lookAt(...D.tgt); r.render(sc,cam); window.__done=true;
</script>`;
const tmp=path.join(require('os').tmpdir(),'caves-preview-'+process.pid+'.html'); fs.writeFileSync(tmp,html);
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(_){} }
if(!chromium){ console.error('caves-preview.js needs the playwright package (node tools/doctor.js)'); process.exit(2); }
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}), pg=await b.newPage({viewport:{width:W,height:H}}), errs=[];
  pg.on('pageerror',e=>errs.push(String(e).slice(0,200))); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,200)); });
  await pg.goto('file://'+tmp); await pg.waitForFunction('window.__done===true',null,{timeout:120000}).catch(()=>{});
  await pg.screenshot({path:out}); await b.close(); fs.unlinkSync(tmp); console.log('saved',out,errs.length?errs:'no page errors');
})();
