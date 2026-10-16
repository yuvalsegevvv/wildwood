// Renders the zone dressing's props (src/game/world/zone-props-models*.js) as a gallery PNG, without building the game: real WebGL in headless Chromium, lit like the game (a hemisphere light and a sun).
// Usage: node tools/zoneprops-preview.js out.png [--kinds gobhut,web,toro] [--cols 6] [--size 1280x800] [--cam 0.9]
//   no --kinds: every kind, in definition order (the console lists the order, left to right, back to front); --cam scales the camera distance. Needs playwright and a Chromium (node tools/doctor.js).
const fs=require('fs'), path=require('path'), {SRC,strip}=require('./load');
const arg=n=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:null; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'zoneprops.png';
const [W,H]=(arg('--size')||'1280x800').split('x').map(Number), COLS=+(arg('--cols')||6), CAMK=+(arg('--cam')||1), KINDS=arg('--kinds');
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(e){} }
if(!chromium){ console.error('needs the playwright package (node tools/doctor.js)'); process.exit(2); }
const read=(d,f)=>strip(fs.readFileSync(path.join(SRC,d,f),'utf8'));
const pm=read('game/world','plant-models.js'), helpers=pm.slice(pm.indexOf('const _c'),pm.indexOf('\n',pm.indexOf('const cyl'))+1);   // _c, WHITE, paint, mkGeo, merge, bark, cyl
const page=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#9ec3e0}canvas{display:block}</style><body><script>${fs.readFileSync(path.join(SRC,'vendor/three.r128.min.js'),'utf8')}</script><script>
${['math.js','noise.js'].map(f=>read('shared',f)).join('\n')}
${helpers}
${read('game/world','zone-props-models.js')}
${read('game/world','zone-props-models2.js')}
const ids=${KINDS?JSON.stringify(KINDS.split(',')):'Object.keys(ZP_KIND)'}, COLS=${COLS}, SP=9, rows=Math.ceil(ids.length/COLS);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9ec3e0);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); renderer.setSize(${W},${H}); renderer.shadowMap.enabled=true; document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc4d6e6,0x4d4a33,0.7));
const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(-40,70,50); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-90; sc.right=90; sc.top=90; sc.bottom=-90; sc.far=300; scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(COLS*SP+20,rows*SP+20).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x5b7a3a})); ground.receiveShadow=true; scene.add(ground);
const mats={rock:new THREE.MeshLambertMaterial({vertexColors:true}),flat:new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),glow:new THREE.MeshBasicMaterial({vertexColors:true})};
let tris=0; const order=[];
ids.forEach((id,i)=>{ const K=ZP_KIND[id]; if(!K){ order.push('?'+id); return; } const G=zpGeo(id), x=(i%COLS-(COLS-1)/2)*SP, z=(Math.floor(i/COLS)-(rows-1)/2)*SP;
  for(const [g,m] of [[G.geo,mats[K.mat]],[G.glow,mats.glow]]){ if(!g) continue; const mesh=new THREE.Mesh(g,m); mesh.position.set(x,-K.sink,z); mesh.castShadow=m!==mats.glow; mesh.receiveShadow=true; scene.add(mesh); tris+=g.attributes.position.count/3; } order.push(id); });
const cam=new THREE.PerspectiveCamera(38,${W}/${H},1,600), span=Math.max(COLS*SP,rows*SP*1.6)*${CAMK}; cam.position.set(0,span*0.62,span*0.95); cam.lookAt(0,1.5,rows>1?2:0);
renderer.render(scene,cam); window.__done={tris,order};
</script>`;
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}), pg=await b.newPage({viewport:{width:W,height:H}}), errs=[];
  pg.on('pageerror',e=>errs.push(String(e).slice(0,300))); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,300)); });
  await pg.setContent(page); await pg.waitForFunction(()=>window.__done,null,{timeout:60000}).catch(()=>{});
  const r=await pg.evaluate(()=>window.__done); await pg.screenshot({path:out}); await b.close();
  if(errs.length){ console.error('page errors:',errs.slice(0,4)); process.exit(1); }
  console.log('saved',out,r.tris+' triangles; order:',r.order.join(' '));
})();
