//@ Monster pictures for the quest panel: each monster a quest asks you to defeat, drawn once from its own model on a small off-screen target and kept as an image
/* Agent map: mpPic(defId) returns the HTML of a picture frame (an empty <img> marked data-mp); mpFill(root) fills every one under root, one render per timer tick,
   from a cache that lasts the session. The render borrows the editor thumbnails' target, scene and lights (cthInit, ui/character-thumbs.js) and the monsters'
   own builder (buildMonster / monMat, combat/monsters.js); the geometry is the shared per-def cache, so only the material is disposed. Models face -z.
   used by: economy/quests.js (the notices), economy/main-quest.js (the main quest tab). test: client-smoke (the headless build has no GL: frames stay empty). */
const MP_CACHE={}, MP_PENDING={}, MP_QUEUE=[], MP_YAW=-0.6;
let mpTimer=0;
// a quest target's def: a monster, a grey-veined one or a boss (DEF_BY_ID holds them all)
const mpDef=id=>Object.prototype.hasOwnProperty.call(DEF_BY_ID,id)?DEF_BY_ID[id]:null;
function mpRender(id){
  const d=mpDef(id); if(!d||!MODELS[d.model]||!cthInit()) return '';
  const g=new THREE.Group(), mat=monMat(d.glow); buildMonster(d,mat,g);
  cthScene.add(g); g.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(g), c=box.getCenter(new THREE.Vector3()), sz=box.getSize(new THREE.Vector3());
  // frame the whole body from the front, a little to the side the editor's key light comes from, and above: the wider of its height and its breadth fills the picture
  const half=Math.max(sz.y,Math.max(sz.x,sz.z)*0.8)*0.56, dist=half/Math.tan(cthCam.fov*Math.PI/360)+Math.max(sz.x,sz.z)*0.2;
  cthCam.position.set(c.x+Math.sin(MP_YAW)*dist,c.y+sz.y*0.22,c.z-Math.cos(MP_YAW)*dist); cthCam.lookAt(c.x,c.y,c.z); cthCam.updateMatrixWorld();
  const old=renderer.getRenderTarget(), oc=new THREE.Color(), oa=renderer.getClearAlpha(), ot=renderer.shadowMap.enabled;
  renderer.getClearColor(oc); renderer.shadowMap.enabled=false;
  renderer.setRenderTarget(cthRT); renderer.setClearColor(0x000000,0); renderer.clear(); renderer.render(cthScene,cthCam);
  renderer.readRenderTargetPixels(cthRT,0,0,CTH_W,CTH_H,cthBuf);
  renderer.setRenderTarget(old); renderer.setClearColor(oc,oa); renderer.shadowMap.enabled=ot;
  cthScene.remove(g); mat.dispose();
  const ctx=cthCv.getContext('2d'), img=ctx.createImageData(CTH_W,CTH_H);
  for(let y=0;y<CTH_H;y++){ const s=(CTH_H-1-y)*CTH_W*4; img.data.set(cthBuf.subarray(s,s+CTH_W*4),y*CTH_W*4); }
  ctx.putImageData(img,0,0); return cthCv.toDataURL('image/png');
}
function mpPump(){
  mpTimer=0; const id=MP_QUEUE.shift(); if(id===undefined) return;
  let url=''; try{ url=mpRender(id); }catch(e){ url=''; }
  MP_CACHE[id]=url; const cbs=MP_PENDING[id]||[]; delete MP_PENDING[id];
  for(const f of cbs){ try{ f(url); }catch(e){} }
  if(MP_QUEUE.length) mpTimer=setTimeout(mpPump,12);
}
function mpGet(id,cb){
  if(MP_CACHE[id]!==undefined){ cb(MP_CACHE[id]); return; }
  if(MP_PENDING[id]){ MP_PENDING[id].push(cb); return; }
  MP_PENDING[id]=[cb]; MP_QUEUE.push(id); if(!mpTimer) mpTimer=setTimeout(mpPump,12);
}
// the frame of a monster's picture (ids are shared data, never a player's text); big: the main quest tab's larger size
function mpPic(id,big){ const d=mpDef(id); if(!d) return ''; return `<span class="mp-pic${big?' big':''}" title="${d.name}"><img alt="" data-mp="${id}" draggable="false"></span>`; }
function mpFill(root){
  root.querySelectorAll('img[data-mp]').forEach(im=>{ const id=im.dataset.mp, fr=im.parentNode;
    if(MP_CACHE[id]){ im.src=MP_CACHE[id]; return; }
    fr.classList.add('wait'); mpGet(id,url=>{ fr.classList.remove('wait'); if(url) im.src=url; else fr.classList.add('nopic'); }); });
}
