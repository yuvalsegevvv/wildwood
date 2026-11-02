//@ The player shops in the overworld: a small market stall (counter, posts, striped awning, goods, a hanging sign with the owner's name) set down in front of every hiker whose shop is open
/* agent map
   exports: pshStallTick() (called every frame from main/loop.js), pshStallMake(name)
   the stall is anchored where its owner stood when the shop opened (the avatar may walk off; a moving owner does not drag it) and is removed when the shop closes or the hiker leaves.
   source of "open": the 10th field of a snapshot player row (remote.js remoteSnap -> r.shop), and pshState.mine.open for yourself (economy/pshop.js).   test: client-smoke */
const PSH_STALLS=new Map();   // key (player id) -> {g, name}
const PSH_AWN=[0xb4552f,0xeae3d2], PSH_BOARD={};
function pshSignTex(name){
  const c=document.createElement('canvas'); c.width=256; c.height=64; const x=c.getContext('2d');
  x.fillStyle='#5a3e28'; x.fillRect(0,0,256,64); x.strokeStyle='#d9b45a'; x.lineWidth=4; x.strokeRect(3,3,250,58);
  x.fillStyle='#f3e3b0'; x.font='600 26px Georgia, serif'; x.textAlign='center'; x.textBaseline='middle';
  let t=name+"'s Shop"; while(x.measureText(t).width>232&&t.length>6) t=t.slice(0,-2);
  x.fillText(t,128,34); const tex=new THREE.CanvasTexture(c); return tex;
}
function pshStallMake(name){
  const g=new THREE.Group(), box=(w,h,d,x,y,z,col)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col})); m.position.set(x,y,z); g.add(m); return m; };
  box(2.2,0.9,0.9,0,0.45,0,0x7a5a3a);                       // counter
  box(2.3,0.06,1,0,0.93,0,0x9a7a4a);                        // counter top
  for(const sx of [-1,1]) for(const sz of [-1,1]) box(0.08,sz<0?2.2:2.0,0.08,sx*1.05,(sz<0?2.2:2.0)/2,sz*0.4,0x5a3e28);
  for(let k=0;k<6;k++){ const m=box(0.4,0.05,1.3,-1+k*0.4,2.15,0,PSH_AWN[k%2]); m.rotation.x=0.18; }   // striped awning, tipped forward
  box(0.5,0.05,0.04,-0.5,1.02,0.05,0xc0c6cc); box(0.04,0.05,0.2,-0.75,1.02,0.05,0x8a7a4a);   // a sword
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.05,14),new THREE.MeshLambertMaterial({color:0x2f4a6b})); sh.rotation.x=Math.PI/2; sh.position.set(0.3,1.15,0.05); g.add(sh);   // a shield
  box(0.28,0.3,0.2,0.85,1.1,0.05,0x8a8f94);                // a helm
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.42),new THREE.MeshBasicMaterial({map:pshSignTex(name),side:THREE.DoubleSide})); sign.position.set(0,2.55,0.62); g.add(sign);
  g.userData.name=name; return g;
}
function pshStallDrop(k){ const s=PSH_STALLS.get(k); if(!s) return; scene.remove(s.g); s.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); PSH_STALLS.delete(k); }
function pshStallSet(k,name,on,x,y,z,face){
  let s=PSH_STALLS.get(k);
  if(!on){ if(s) pshStallDrop(k); return; }
  if(s&&s.name!==name){ pshStallDrop(k); s=null; }
  if(s) return;
  const g=pshStallMake(name); g.position.set(x+Math.sin(face)*1.7,y,z+Math.cos(face)*1.7); g.rotation.y=face; scene.add(g); PSH_STALLS.set(k,{g,name});
}
function pshStallTick(){
  const live=new Set();
  for(const r of REMOTES.values()){ if(r.tx===null) continue; if(r.shop){ live.add(r.id); pshStallSet(r.id,r.name,true,r.x,r.y,r.z,r.face); } }
  if(typeof pshState!=='undefined'&&pshState.mine.open&&started){ live.add('me'); pshStallSet('me',(typeof NET!=='undefined'&&NET.name)||'My',true,P.x,P.y,P.z,P.face||0); }
  for(const k of [...PSH_STALLS.keys()]) if(!live.has(k)) pshStallDrop(k);
}
