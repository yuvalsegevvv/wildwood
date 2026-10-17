// Renders the tree species (src/game/world/plant-models*.js) side by side as a PNG: the detailed model and the low-poly one of each, tinted with its palette. Real WebGL in headless Chromium.
// Usage: node tools/tree-preview.js out.png [--kinds willow,beech,pine] [--size 1600x700] [--lo]   (--lo: only the low-poly models; no --kinds: every species)
// Needs playwright and a Chromium (node tools/doctor.js). The page loads the same model files the game does; the materials are plain double-sided Lambert with the palette's first colour.
const fs=require('fs'), path=require('path'), {SRC,strip}=require('./load');
const arg=n=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:null; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'trees.png';
const [W,H]=(arg('--size')||'1600x700').split('x').map(Number), KINDS=arg('--kinds'), LO=process.argv.includes('--lo');
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(e){} }
if(!chromium){ console.error('needs the playwright package (node tools/doctor.js)'); process.exit(2); }
const read=(d,f)=>strip(fs.readFileSync(path.join(SRC,d,f),'utf8'));
const gs=read('game/world','generation-setup.js'), palSrc=gs.slice(gs.indexOf('const PAL={'),gs.indexOf('const RAD='));
const page=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#9ec3e0}canvas{display:block}</style><body><script>${fs.readFileSync(path.join(SRC,'vendor/three.r128.min.js'),'utf8')}</script><script>
const LITE=false, LOW=false, LAKES=[]; const moss=new THREE.Color(0x56702f);
${['math.js','noise.js'].map(f=>read('shared',f)).join('\n')}
${read('game/world','plant-models.js')}
${read('game/world','plant-models-hi.js')}
${read('game/world','plant-models-more.js')}
${palSrc}
const G={trees:{},treesHi:{}};
G.trees.pine=makeConifer({trunkH:4, layers:5, r0:2.3, lh:2.8, spacing:1.45, start:1.6}); G.treesHi.pine=makeConiferHi({trunkH:4, layers:5, r0:2.3, lh:2.8, spacing:1.45, start:1.6},1);
G.trees.oakA=makeBroadleaf({trunkH:4.2, tr:0.42, crownY:6.2, rMain:2.4, blobs:5, spread:1.9, sy:0.85, branches:3, bark:0x4f3c2a}); G.treesHi.oakA=makeBroadleafHi({trunkH:4.2, tr:0.42, crownY:6.2, rMain:2.4, blobs:5, spread:1.9, sy:0.85, branches:3, bark:0x4f3c2a},3);
G.trees.birch=makeBroadleaf({trunkH:7.5, tr:0.16, crownY:7.6, rMain:1.2, blobs:4, spread:0.85, sy:1.6, branches:0, birch:true}); G.treesHi.birch=makeBroadleafHi({trunkH:7.5, tr:0.16, crownY:7.6, rMain:1.2, blobs:4, spread:0.85, sy:1.6, branches:0, birch:true},5);
buildMoreTrees();
const PALK={pine:PAL.pine,oakA:PAL.oak,birch:PAL.birch}; for(const k in MORE_TREE) PALK[k]=PAL[k];
const ids=${KINDS?JSON.stringify(KINDS.split(',')):'Object.keys(G.trees)'}, SP=11, lo=${LO};
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9ec3e0);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); renderer.setSize(${W},${H}); renderer.shadowMap.enabled=true; document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc4d6e6,0x4d4a33,0.75));
const sun=new THREE.DirectionalLight(0xffffff,0.95); sun.position.set(-30,60,50); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-80; sc.right=80; sc.top=40; sc.bottom=-40; sc.far=300; scene.add(sun);
const n=ids.length*(lo?1:2), ground=new THREE.Mesh(new THREE.PlaneGeometry(n*SP+30,40).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x5b7a3a})); ground.receiveShadow=true; scene.add(ground);
const bm=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}); let tris=0, slot=0; const order=[];
for(const id of ids){ for(const hi of (lo?[false]:[true,false])){
  const T=(hi?G.treesHi:G.trees)[id]; if(!T){ order.push('?'+id); continue; }
  const lm=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,color:new THREE.Color((PALK[id]||[0x5a8a3a])[0])});
  const x=(slot-(n-1)/2)*SP; slot++;
  for(const [g,m] of [[T.trunk,bm],[T.leaves,lm]]){ if(!g) continue; const mesh=new THREE.Mesh(g,m); mesh.position.set(x,0,0); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); tris+=g.attributes.position.count/3; }
  order.push(id+(hi?'(hi)':'(lo)')); } }
const cam=new THREE.PerspectiveCamera(30,${W}/${H},1,600), span=n*SP; cam.position.set(0,6,Math.max(60,span*0.9)); cam.lookAt(0,5,0);
renderer.render(scene,cam); window.__done={tris,order};
</script>`;
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}), pg=await b.newPage({viewport:{width:W,height:H}}), errs=[];
  pg.on('pageerror',e=>errs.push(String(e).slice(0,300))); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,300)); });
  await pg.setContent(page); await pg.waitForFunction(()=>window.__done,null,{timeout:60000}).catch(()=>{});
  const r=await pg.evaluate(()=>window.__done); await pg.screenshot({path:out}); await b.close();
  if(errs.length){ console.error('page errors:',errs.slice(0,4)); process.exit(1); }
  console.log('saved',out,r.tris+' triangles; order (left to right):',r.order.join(' '));
})();
