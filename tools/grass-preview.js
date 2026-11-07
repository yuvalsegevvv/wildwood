//@ Grass preview: a meadow patch of the game's grass tufts (grass-models.js, matGrass with its shader) on rolling ground, with a few detailed trees, as PNGs. Real WebGL in headless Chromium.
// Usage: node tools/grass-preview.js out-prefix [--views hiker,high,sun,close] [--size 1280x720] [--time 3.0] [--n 26000]
//   writes <out-prefix>-<view>.png per view: hiker (third-person eye, 2.6 m up), wide (5 m up: the wind waves), high (30 m up), sun (looking toward a low sun: the back-light), close (0.9 m, a few tufts)
//   --time: the shader clock (wind phase); two shots at different times show the travelling waves
// Needs playwright and a Chromium (node tools/doctor.js). Loads the same model, material and terrain-shader source the game does; the ground colour is a simplified
// home-forest landColor (lush / dry patches, dirt, a darker floor under the trees) and the tufts' instance colour follows genChunk (grassTint when it exists).
// Levels of detail as addInstanced does them: near tuft < 30 m, mid < 62 m (85 % kept), far < 100 m (60 % kept), in list order (grassSort when it exists).
const fs=require('fs'), path=require('path'), {SRC,strip}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:d; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'grass';
const [W,H]=arg('--size','1280x720').split('x').map(Number), VIEWS=arg('--views','hiker,high'), TIME=+arg('--time','3'), NT=+arg('--n','26000');
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(e){} }
if(!chromium){ console.error('needs the playwright package (node tools/doctor.js)'); process.exit(2); }
const read=(d,f)=>strip(fs.readFileSync(path.join(SRC,d,f),'utf8'));
const gs=read('game/world','generation-setup.js'), palSrc=gs.slice(gs.indexOf('const PAL={'),gs.indexOf('const RAD=')), terSrc=gs.slice(gs.indexOf('const TERRAIN_FS_HEAD'),gs.indexOf('// hollows'));
const gch=read('game/world','generation-chunks.js'), clumpSrc=gch.indexOf('const GRASS_BALD')<0?'':gch.slice(gch.indexOf('const GRASS_BALD'),gch.indexOf('function addGrass'));   // grassClump, when it exists
const page=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#9ec3e0}canvas{display:block}</style><body><script>${fs.readFileSync(path.join(SRC,'vendor/three.r128.min.js'),'utf8')}</script><script>
const LITE=false, LOW=false, LAKES=[]; const moss=new THREE.Color(0x56702f); const timeU={value:${TIME}};
${['math.js','noise.js'].map(f=>read('shared',f)).join('\n')}
${read('game/engine','materials.js')}
${read('game/world','plant-models.js')}
${read('game/world','plant-models-hi.js')}
${read('game/world','grass-models.js')}
${palSrc}
${terSrc}
const _e=new THREE.Euler(), _q=new THREE.Quaternion(); function mtx(x,y,z,ry,sx,sy,sz){ _e.set(0,ry,0); _q.setFromEuler(_e); return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),_q,new THREE.Vector3(sx,sy,sz)); } const nearTele=()=>false;
${clumpSrc}
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xa9c8e2); scene.fog=new THREE.Fog(0xcfd3c9,28,230);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); renderer.setSize(${W},${H}); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc4d6e6,0x4d4a33,0.6));
const sun=new THREE.DirectionalLight(0xfff4e0,1.2); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:320}); sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.04;
scene.add(sun); scene.add(sun.target);
// rolling ground, 220 m square
const HT=(x,z)=>noise2(x*0.012,z*0.012)*4+noise2(x*0.05+3,z*0.05)*0.8;
const TREES=[[-14,-26,'oakA'],[9,-34,'birch'],[22,-22,'pine'],[-30,-48,'oakB'],[-4,-58,'pine'],[34,-52,'birch'],[-42,-20,'pine'],[46,-30,'oakA'],[14,-80,'oakB'],[-24,-90,'pine']];
const fdAt=(x,z)=>{ let f=0; for(const t of TREES){ const d=Math.hypot(x-t[0],z-t[1]); f=Math.max(f,1-d/9); } return clamp(f); };
const COL={lush:new THREE.Color(0x4c7a2b),dry:new THREE.Color(0x8a8f42),floor:new THREE.Color(0x5b4a30),dirt:new THREE.Color(0x6e5738)};
function groundCol(x,z,out){ const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5;
  out.copy(COL.lush).lerp(COL.dry,smoothstep(0.45,0.85,n1)*0.8); out.lerp(COL.floor,smoothstep(0.45,0.9,fdAt(x,z))*0.75); out.lerp(COL.dirt,smoothstep(0.72,0.92,n2)*0.5); return out; }

{ const S=220, N=220, g=new THREE.PlaneGeometry(S,S,N,N).rotateX(-Math.PI/2), p=g.attributes.position, c=[], col=new THREE.Color();
  for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i); p.setY(i,HT(x,z)); groundCol(x,z,col); c.push(col.r,col.g,col.b); }
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3)); g.computeVertexNormals();
  const m=new THREE.Mesh(g,terrainMaterial()); m.receiveShadow=true; scene.add(m); }
// trees: the detailed models with the game's leaf materials, instanced with a tint like the game
const GT={pine:makeConiferHi({trunkH:4, layers:5, r0:2.3, lh:2.8, spacing:1.45, start:1.6},1),
  oakA:makeBroadleafHi({trunkH:4.2, tr:0.42, crownY:6.2, rMain:2.4, blobs:5, spread:1.9, sy:0.85, branches:3, bark:0x4f3c2a},3),
  oakB:makeBroadleafHi({trunkH:3.4, tr:0.36, crownY:5.0, rMain:2.0, blobs:6, spread:2.2, sy:0.75, branches:4, bark:0x5a4632},4),
  birch:makeBroadleafHi({trunkH:7.5, tr:0.16, crownY:7.6, rMain:1.2, blobs:4, spread:0.85, sy:1.6, branches:0, birch:true},5)};
const PALK={pine:PAL.pine,oakA:PAL.oak,oakB:PAL.oak,birch:PAL.birch};
let tris=0;
const inst=(geo,mat,list,cast)=>{ const m=new THREE.InstancedMesh(geo,mat,list.length); list.forEach((it,i)=>{ m.setMatrixAt(i,it.m); m.setColorAt(i,it.c); }); m.castShadow=cast; m.receiveShadow=true; m.frustumCulled=false; scene.add(m); tris+=geo.attributes.position.count/3*list.length; return m; };
const _m=(x,y,z,ry,s)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(s,s,s));
for(const t of TREES){ const T=GT[t[2]], s=1+((t[0]*7+t[1]*3)%5)*0.05, m=_m(t[0],HT(t[0],t[1])-0.15,t[1],t[0]*0.3,s), conifer=t[2]==='pine';
  tris+=0; inst(T.trunk,matBark,[{m,c:new THREE.Color(1,1,1)}],true); inst(T.leaves,conifer?matConiferD:matBroadD,[{m,c:new THREE.Color(PALK[t[2]][0])}],true); }
// grass: random tufts like genChunk's loop (fewer under the trees), then levels of detail by distance to the eye, as addInstanced does it
const {r:rg}=mrng(777), fresh=new THREE.Color(0x5f8f35), gc=new THREE.Color();
const VIEW={hiker:{p:[0,2.6,7],t:[0,1.2,-12]},high:{p:[0,30,30],t:[0,0,-30]},sun:{p:[0,2.4,6],t:[0,1.6,-14]},close:{p:[0.4,0.95,1.6],t:[0,0.25,-1.6]},wide:{p:[0,5,10],t:[0,0,-35]}};
const TUFTS=buildGrassTufts(), items=[];
for(let a=0;a<${NT}*3&&items.length<${NT};a++){
  const x=(rg()-0.5)*200, z=-rg()*130+12, fd=fdAt(x,z);
  if(rg()>(1-smoothstep(0.55,0.95,fd)*0.75)) continue;
  const h=HT(x,z), s=(0.75+rg()*0.45), meadow=smoothstep(0.1,0.7,noise2(x*0.025+9,z*0.025-4))*(1-fd);
  groundCol(x,z,gc); if(typeof grassTint==='function') grassTint(gc,rg()); else gc.lerp(fresh,0.3).multiplyScalar(0.95+rg()*0.25);
  const gx=(HT(x+0.5,z)-HT(x-0.5,z)), gz=(HT(x,z+0.5)-HT(x,z-0.5));
  items.push({x,z,m:_m(x,h-0.02,z,rg()*TAU,s).multiply(new THREE.Matrix4().makeScale(1,0.8+rg()*0.35+meadow*0.9,1)),c:gc.clone(),g:Math.hypot(gx,gz),fd,ra:0,free:true});
}
let ITEMS=typeof grassClump==='function'?grassClump(items):items; if(typeof grassSort==='function') grassSort(ITEMS);
const LEV=[[0,1],[30,0.85],[62,0.6]], MAXD=100;
window.__render=(vn)=>{
  for(const o of scene.children.filter(o=>o.userData.grass)) scene.remove(o);
  const V=VIEW[vn], cam=new THREE.PerspectiveCamera(vn==='close'?55:68,${W}/${H},0.1,1200); cam.position.set(...V.p); cam.lookAt(...V.t);
  if(vn==='sun'){ sun.position.set(-8,22,-90); sun.target.position.set(0,0,0); } else { sun.position.set(55,70,30); sun.target.position.set(0,0,-20); }
  const per=LEV.map(()=>[]); const n=ITEMS.length; let gt=0;
  ITEMS.forEach((it,i)=>{ const d=Math.hypot(it.x-V.p[0],it.z-V.p[2]); if(d>=MAXD) return; let j=0; while(j<LEV.length-1&&d>=LEV[j+1][0]) j++; if(i>=Math.ceil(n*LEV[j][1])) return; per[j].push(it); });
  per.forEach((list,j)=>{ if(!list.length) return; const geo=TUFTS[Math.min(j,TUFTS.length-1)], m=inst(geo,matGrass,list,false); m.userData.grass=1; gt+=geo.attributes.position.count/3*list.length; });
  renderer.render(scene,cam); return {grassTris:gt, tufts:TUFTS.map(g=>g.attributes.position.count/3), shown:per.map(l=>l.length)};
};
window.__ready=true;
</script>`;
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}), pg=await b.newPage({viewport:{width:W,height:H}}), errs=[];
  pg.on('pageerror',e=>errs.push(String(e).slice(0,300))); pg.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.text().slice(0,300)); });
  await pg.setContent(page); await pg.waitForFunction(()=>window.__ready,null,{timeout:120000}).catch(()=>{}); if(errs.length){ console.error('page errors:',errs.slice(0,4)); await b.close(); process.exit(1); }
  for(const v of VIEWS.split(',')){
    const r=await pg.evaluate(v=>window.__render(v),v).catch(e=>{ errs.push(String(e).slice(0,300)); return null; });
    const f=out+'-'+v+'.png'; await pg.screenshot({path:f}); console.log('saved',f,r?JSON.stringify(r):'');
  }
  await b.close();
  if(errs.length){ console.error('page errors:',errs.slice(0,4)); process.exit(1); }
})();
