//@ WebGL renderer, scene, camera, lights, sun shadow, timeU
/* ---------- renderer / scene ---------- */
const canvas = $('#c');
let renderer;
try{
  renderer = new THREE.WebGLRenderer({canvas, antialias:!LOW, powerPreference:LOW?'default':'high-performance'});
}catch(e){
  showFatal('This device or browser could not start 3D graphics (WebGL). Try opening the link in Safari or Chrome instead of inside the app.');
  return;
}
canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  try{ localStorage.setItem('wildwood-lite','1'); }catch(_){}
  showFatal(LITE ? 'Your phone ran out of graphics memory, even in light mode. Close other apps and reload.' : 'Your phone ran out of graphics memory. Reload and the forest will use a lighter mode.', true);
});
const MAXPR = Math.min(window.devicePixelRatio||1, LITE?1:(LOW?1.25:2));
let pr = MAXPR;
renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !LITE;
renderer.shadowMap.type = LOW ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfd3c9, 28, 230);
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, 0.1, 1200);

const hemi = new THREE.HemisphereLight(0xc4d6e6, 0x4d4a33, 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.castShadow = true;
const SHM = LOW?1024:2048, SHR = LOW?42:58;
sun.shadow.mapSize.set(SHM,SHM);
Object.assign(sun.shadow.camera, {left:-SHR,right:SHR,top:SHR,bottom:-SHR,near:1,far:320});
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
const sunDir = new THREE.Vector3(0.5,0.5,0.5).normalize();

const timeU = {value:0};

