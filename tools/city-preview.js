// Renders Glasswell's model (src/game/village/sun-*.js and buildings-sun.js) to PNGs from several cameras, without building the game.
// Real WebGL in headless Chromium (SwiftShader), lit like the game (a hemisphere light and a sun), so what you see is what the game draws.
// Usage: node tools/city-preview.js [outDir] [--views overview,top,street,...] [--size 1280x800] [--cam x,y,z,tx,ty,tz] [--stats]
//   views: overview top gate weir street bazaar citadel statue well lake hall inn archive physician reserved homes   (--cam adds one of your own; coordinates are metres in the city's frame)
// Needs: the `playwright` package and a Chromium (the cloud sessions have both: PLAYWRIGHT_BROWSERS_PATH). Then open the PNGs (in Claude: the Read tool).
const fs=require('fs'), path=require('path'), os=require('os'), {SRC,manifest,strip}=require('./load');
const arg=n=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:null; };
const outDir=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:path.join(os.tmpdir(),'city-preview');
const [W,H]=(arg('--size')||'1280x800').split('x').map(Number);
const VIEWS={   // eye, target (the city's frame: +x east, +z south, y up from the floor)
  overview:[[150,125,175],[0,0,0]], top:[[0,330,1],[0,0,0],45], gate:[[40,16,-168],[30,10,-60]], weir:[[-96,9,36],[-72,3,28]],
  street:[[68,2.1,13],[20,3,28]], bazaar:[[34,9,16],[48,2,24]], citadel:[[-26,9,-26],[2,3,2]], statue:[[7,3.2,9],[0,3.2,0]],
  lake:[[-12,7,26],[-52,0,10]], well:[[-8,7,20],[-26,2,6]], hall:[[22,11,-22],[4,6,-49]], inn:[[24,12,-34],[37,3,-52]], archive:[[4,8,10],[17,3,-4]], physician:[[24,9,-16],[42,2,-34]], reserved:[[20,13,62],[44,3,48]], homes:[[-20,24,64],[10,3,56]]};
const read=(d,f)=>strip(fs.readFileSync(path.join(SRC,d,f),'utf8'));
const pm=read('game/world','plant-models.js'), helpers=pm.slice(pm.indexOf('const _c'),pm.indexOf('\n',pm.indexOf('const cyl'))+1);   // _c, WHITE, paint, mkGeo, merge, bark, cyl
const bd=read('game/village','buildings.js'), village=bd.slice(bd.indexOf('const villageMat'),bd.indexOf('function addVillageMeshes'))+bd.slice(bd.indexOf('function prism'),bd.indexOf('function buildVillage'));
const pcFn=/^function pc\(.*$/m.exec(read('game/character','model.js'))[0];
const m=manifest(), sun=m.game.filter(f=>/^village\/(sun-|buildings-sun)/.test(f));
if(!sun.length){ console.error('no village/sun-*.js in src/manifest.json yet'); process.exit(1); }
const page=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#bcd4e6}canvas{display:block}</style><body><script>${fs.readFileSync(path.join(SRC,'vendor/three.r128.min.js'),'utf8')}</script><script>
${['math.js','noise.js','sunscar.js','sunscar-shape.js'].map(f=>read('shared',f)).join('\n')}
${helpers}
const scene=new THREE.Scene(), matBroadD=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});   // stand-ins for what the game's other files define
${pcFn}
${village}
${sun.map(f=>read('game',f)).join('\n')}
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); renderer.setSize(${W},${H}); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc4d6e6,0x4d4a33,0.6));
const sunL=new THREE.DirectionalLight(0xffffff,1.05); sunL.position.set(-90,100,70); sunL.castShadow=true; sunL.shadow.mapSize.set(4096,4096); const sc=sunL.shadow.camera; sc.left=-190; sc.right=190; sc.top=190; sc.bottom=-190; sc.near=10; sc.far=500; sunL.shadow.bias=-0.0006; scene.add(sunL);
scene.background=new THREE.Color(0x9ec3e0); const t0=performance.now(); const city=buildGlasswell({x:0,z:0,h:0}); scene.add(city); const buildMs=performance.now()-t0;
const cam=new THREE.PerspectiveCamera(55,${W}/${H},0.3,1500);
window.shoot=(eye,look,fov)=>{ cam.fov=fov||55; cam.updateProjectionMatrix(); cam.position.set(...eye); cam.lookAt(...look); renderer.render(scene,cam); return renderer.domElement.toDataURL('image/png'); };
window.stats=()=>{ let tris=0,meshes=0; const parts=[]; city.traverse(o=>{ if(o.isMesh){ meshes++; const g=o.geometry, t=(g.index?g.index.count:g.attributes.position.count)/3; tris+=t; if(t>2000) parts.push(Math.round(t)); } }); return {tris:Math.round(tris),meshes,buildMs:Math.round(buildMs),calls:renderer.info.render.calls,big:parts.sort((a,b)=>b-a).join(' ')}; };
window.ready=true;
</script>`;
(async()=>{
  fs.mkdirSync(outDir,{recursive:true}); const html=path.join(outDir,'city-preview.html'); fs.writeFileSync(html,page);
  const {chromium}=require('playwright'), fsx=p=>fs.existsSync(p)?p:undefined;
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:W,height:H}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',c=>{ if(c.type()==='error') errs.push(c.text()); });
  await pg.goto('file://'+html); await pg.waitForFunction('window.ready===true',null,{timeout:60000}).catch(()=>{});
  if(errs.length){ console.error('page errors:\n'+errs.slice(0,6).join('\n')); await b.close(); process.exit(1); }
  const names=(arg('--views')||'overview,top,street,citadel').split(',').filter(Boolean), todo=names.map(n=>[n,...(VIEWS[n]||(()=>{ throw new Error('unknown view '+n); })())]);
  if(arg('--cam')){ const v=arg('--cam').split(',').map(Number); todo.push(['cam',v.slice(0,3),v.slice(3,6)]); }
  for(const [n,eye,look,fov] of todo){ const url=await pg.evaluate(([e,l,f])=>window.shoot(e,l,f),[eye,look,fov||null]); fs.writeFileSync(path.join(outDir,n+'.png'),Buffer.from(url.split(',')[1],'base64')); console.log('wrote',path.join(outDir,n+'.png')); }
  if(process.argv.includes('--stats')||true) console.log('model:',JSON.stringify(await pg.evaluate('window.stats()')));
  if(errs.length) console.error('page errors:\n'+errs.slice(0,6).join('\n'));
  await b.close();
})().catch(e=>{ console.error(e.message); process.exit(1); });
