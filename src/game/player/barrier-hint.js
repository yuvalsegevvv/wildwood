//@ Makes a shut gate visible: when barStep holds a hiker, a glowing wall fades in at the spot and a toast says which boss opens the way.
/* Agent map: bwNear(o,ox,oz) (probes 7 m ahead and shows the wall with its blue dots when a gate is close), bwBlocked(ox,oz,ix,iz) is called from worldBounds (movement.js) when barStep moved the hiker back from the intended spot (ix,iz); bwWhy(land) names the unlock.
   Client only, nothing synced. Test: client-smoke. Names: bw... */
var bwMesh=null, bwT=0, bwLast=0, bwRaf=0, bwStr=1, bwTex=null;
function bwWhy(a,b){   // a: land the hiker stands in, b: land the step aimed at (equal for walls inside a land)
  const g=GEAR||BAR_NONE;
  if(b===7) return 'The Tide Bridge is barred. Defeat Oldhorn, the Amber Reach\'s last boss, to lift the barrier.';
  if(b===6) return 'The Ashbed Gate is shut. Defeat the Sand Wyrm in the Sunscar to open the way south.';
  if(b===5||(a===5)) return 'A rock fall blocks the neck pass. Defeat the Mountain Golem in the Greyspine to open the Gloamhorn.';
  if(b===4||a===4){ if(!(g.river>=1)) return 'A rock fall blocks the way. Defeat the Glass Guardian to open the River Pass into the Sunscar.'; return 'Redgate Canyon is blocked. Defeat the Sand Wyrm to open it.'; }
  if(b===3||a===3||(a===2&&!(g.west>=1))) return 'The ice fall blocks the glacier valley. Defeat Ymrik to break it and open the road to the Greyspine.';
  if(b===2||a===2) return 'The ice wall holds Frostgate Pass. Defeat Akaoni in the Sakura Vale to crack it open.';
  if(a===1&&!(g.north>=1)) return 'The ice wall holds Frostgate Pass. Defeat Akaoni in the Sakura Vale to crack it open.';
  if(b===1||a===0) return 'The Greyfall Bridge gate is shut. Defeat the Rootwarden in the forest to open the way east.';
  return 'The way is shut. Defeat the nearby boss to open it.';
}
function bwDots(){   // a texture of soft blue dots on a faint blue sheet
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle='rgba(120,200,255,0.10)'; x.fillRect(0,0,256,256);
  for(let i=0;i<60;i++){ const px=Math.random()*256, py=Math.random()*256, r=3+Math.random()*5, g=x.createRadialGradient(px,py,0,px,py,r);
    g.addColorStop(0,'rgba(190,235,255,1)'); g.addColorStop(1,'rgba(90,170,255,0)'); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,1.5); return t;
}
function bwShow(px,pz,dx,dz,str){
  if(!bwMesh){
    bwTex=bwDots();
    bwMesh=new THREE.Mesh(new THREE.PlaneGeometry(16,8),new THREE.MeshBasicMaterial({map:bwTex,color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
    bwMesh.frustumCulled=false; bwMesh.renderOrder=9; scene.add(bwMesh);
  }
  bwMesh.position.set(px,getH(px,pz)+3.5,pz);
  bwMesh.rotation.set(0,Math.atan2(dx,dz),0);   // faces the hiker, across the way they are going
  bwMesh.visible=true; bwT=performance.now(); bwStr=str;
  if(!bwRaf) bwRaf=requestAnimationFrame(bwFade);
}
// a gate is within 7 m ahead of the hiker's last step: the wall shows (softly) with its dots
function bwNear(o,ox,oz){
  const dx=o.x-ox, dz=o.z-oz, d=Math.hypot(dx,dz); if(d<0.01) return;
  const q={x:o.x+dx/d*7,z:o.z+dz/d*7}, ix=q.x, iz=q.z;
  barStep(q,o.x,o.z,GEAR||BAR_NONE);
  if(Math.hypot(q.x-ix,q.z-iz)>0.02) bwShow(ix,iz,dx/d,dz/d,0.55);
}
function bwBlocked(ox,oz,ix,iz){
  const now=performance.now(), a=waLandId(ox,oz), b=waLandId(ix,iz);
  const dx=ix-ox, dz=iz-oz, d=Math.hypot(dx,dz)||1;
  bwShow(ox+dx/d*2.5,oz+dz/d*2.5,dx,dz,1);
  if(now-bwLast>6000){ bwLast=now; toast(bwWhy(a,b),'warn'); }
}
function bwFade(){
  bwRaf=0; if(!bwMesh) return;
  const age=(performance.now()-bwT)/1000, k=age<0.15?age/0.15:Math.max(0,1-(age-0.15)/1.2);
  bwMesh.material.opacity=0.9*bwStr*k*(0.85+0.15*Math.sin(age*14));
  bwTex.offset.y=(performance.now()/6000)%1; bwTex.offset.x=(performance.now()/17000)%1;   // the dots drift
  if(k<=0){ bwMesh.visible=false; return; }
  bwRaf=requestAnimationFrame(bwFade);
}
