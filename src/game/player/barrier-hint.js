//@ Makes a shut gate visible: when barStep holds a hiker, a glowing wall fades in at the spot and a toast says which boss opens the way.
/* Agent map: bwBlocked(ox,oz,ix,iz) is called from worldBounds (movement.js) when barStep moved the hiker back from the intended spot (ix,iz); bwWhy(land) names the unlock.
   Client only, nothing synced. Test: client-smoke. Names: bw... */
var bwMesh=null, bwT=0, bwLast=0, bwRaf=0;
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
function bwBlocked(ox,oz,ix,iz){
  const now=performance.now();
  const a=waLandId(ox,oz), b=waLandId(ix,iz);
  const dx=ix-ox, dz=iz-oz, d=Math.hypot(dx,dz)||1;
  if(!bwMesh){
    const geo=new THREE.PlaneGeometry(16,8);
    bwMesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x8fd8ff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
    bwMesh.frustumCulled=false; bwMesh.renderOrder=9; scene.add(bwMesh);
  }
  const px=ox+dx/d*2.5, pz=oz+dz/d*2.5;
  bwMesh.position.set(px,getH(px,pz)+3.5,pz);
  bwMesh.rotation.set(0,Math.atan2(dx,dz),0);   // faces the hiker, across the way they tried to go
  bwMesh.visible=true; bwT=now;
  if(!bwRaf) bwRaf=requestAnimationFrame(bwFade);
  if(now-bwLast>6000){ bwLast=now; toast(bwWhy(a,b),'warn'); }
}
function bwFade(){
  bwRaf=0; if(!bwMesh) return;
  const age=(performance.now()-bwT)/1000, k=age<0.15?age/0.15:Math.max(0,1-(age-0.15)/2.4);
  bwMesh.material.opacity=0.45*k*(0.8+0.2*Math.sin(age*14));
  if(k<=0){ bwMesh.visible=false; return; }
  bwRaf=requestAnimationFrame(bwFade);
}
