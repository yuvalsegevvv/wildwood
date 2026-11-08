//@ Character portraits: small transparent WebP busts of the 24 skill-set characters in their signature outfits (baked by tools/portraits.js into portraits-data.js), shown in the Bond, orb, selection, voice and guide screens
/* Agent map. portHtml(id,cls) -> '<img>' markup or '' (no portrait: callers keep their own emblem); portRender(id) -> a WebP data URL drawn with the game's real renderer on a transparent
   background (what tools/portraits.js calls in headless Chromium; '' without GL). Data: PORT_DATA (ui/portraits-data.js, generated: `node tools/portraits.js` then `python3 build.py`; ~4 KB-10 KB each).
   Used by: bond/orbs.js (the orb stall), bond/popup.js (the orb pop-up), bond/panel.js (the Bondstone cards), awakening/panel.js (the character list), ui/character-editor.js (voice chips), ui/guide.js (All sets).
   Style: .port in 38-bonds.css. Test: tools/portraits-smoke.js (every set has a portrait). Size: the page is ~9.4 MB of the artifact's 16 MB. */
const PORT_W=192, PORT_H=240, PORT_SS=2;   // the stored size, and the oversampling the render is shrunk from (a render target has no antialiasing in r128)
let portRT=null, portSc=null, portCam=null, portBuf=null, portCv=null, portOut=null;
function portHtml(id,cls){
  const u=typeof id==='string'&&Object.prototype.hasOwnProperty.call(PORT_DATA,id)?PORT_DATA[id]:'';
  return u?'<img class="port'+(cls?' '+cls:'')+'" src="'+u+'" alt="" draggable="false" loading="lazy">':'';
}
function portRender(id){
  if(typeof renderer==='undefined'||!renderer||typeof cthLookFor!=='function'||!CHAR_MODELS[id]) return '';
  const W=PORT_W*PORT_SS, H=PORT_H*PORT_SS;
  if(!portRT){
    portRT=new THREE.WebGLRenderTarget(W,H,{format:THREE.RGBAFormat,depthBuffer:true}); portSc=new THREE.Scene();
    portSc.add(new THREE.HemisphereLight(0xeef2f8,0x5a5244,0.9)); const k1=new THREE.DirectionalLight(0xfff0d8,1.0); k1.position.set(-1.4,2.4,-2.6); portSc.add(k1);
    const k2=new THREE.DirectionalLight(0xb8ccff,0.45); k2.position.set(2.2,1.2,1.6); portSc.add(k2);
    portCam=new THREE.PerspectiveCamera(24,W/H,0.05,30); portBuf=new Uint8Array(W*H*4);
    portCv=document.createElement('canvas'); portCv.width=W; portCv.height=H; portOut=document.createElement('canvas'); portOut.width=PORT_W; portOut.height=PORT_H; }
  const {L}=cthLookFor({kind:'outfit',id}), rig=buildCharacter(L,{q:1}), root=rig.root; root.rotation.y=0.3; portSc.add(root);
  const hip=rig.hipY, top=hip+rig.dims.headY+0.34*rig.dims.hs, bot=hip-0.02, mid=(top+bot)/2, half=(top-bot)/2*1.08, dist=half/Math.tan(portCam.fov*Math.PI/360);   // head to just under the belt
  portCam.position.set(0,mid,-dist); portCam.lookAt(0,mid,0); portCam.updateMatrixWorld();
  const old=renderer.getRenderTarget(), oc=new THREE.Color(), oa=renderer.getClearAlpha(), osh=renderer.shadowMap.enabled; renderer.getClearColor(oc);
  try{ renderer.shadowMap.enabled=false; renderer.setClearColor(0x000000,0); renderer.setRenderTarget(portRT); renderer.clear(); renderer.render(portSc,portCam); renderer.readRenderTargetPixels(portRT,0,0,W,H,portBuf); }
  finally{ renderer.setRenderTarget(old); renderer.setClearColor(oc,oa); renderer.shadowMap.enabled=osh; portSc.remove(root); root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  const ctx=portCv.getContext('2d'), img=ctx.createImageData(W,H);
  for(let y=0;y<H;y++){ const s=(H-1-y)*W*4; img.data.set(portBuf.subarray(s,s+W*4),y*W*4); }
  ctx.putImageData(img,0,0);
  const o=portOut.getContext('2d'); o.clearRect(0,0,PORT_W,PORT_H); o.imageSmoothingQuality='high'; o.drawImage(portCv,0,0,PORT_W,PORT_H);
  return portOut.toDataURL('image/webp',0.8);
}
window.wwPortRender=portRender;   // the baking tool's handle (tools/portraits.js); nothing in the game calls it
