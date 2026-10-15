//@ The Proving Isle's dressing: a gate of two posts and a lintel with a banner on the bridge where the island begins, and red banner poles round the rim
/* agent map
   What: small on purpose (a first version). The gate stands at PVP.gate (shared/pvp.js) across the Proving Bridge; the poles stand round the island at PVP.r - 3, none by the bridge.
   Called by genTerrain's villages line in world/generation-setup.js. Colliders only for the gate's posts. Test: tools/client-smoke.js. */
function buildProvingIsle(){
  const G=PVP.gate, B=PVP.bridge; if(!G||!B) return;
  const wood=[], cloth=[], gold=[],
    woodc=(x,y,z,nx,ny,nz,c)=>{ c.set(0x5a3e28).multiplyScalar(0.85+h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))*0.25); },
    clothc=(x,y,z,nx,ny,nz,c)=>{ c.set(0xa83232).multiplyScalar(0.9+Math.sin(y*6)*0.06); },
    goldc=(x,y,z,nx,ny,nz,c)=>{ c.set(0xd4a83a); };
  const deck=bridgeDeck(B.x+B.dx*(B.len/2-4),B.z+B.dz*(B.len/2-4)), baseY=deck>-1e8?deck:getH(G.x,G.z);   // (the planks' height at the island end, where the gate stands)
  const px=-B.dz, pz=B.dx, ang=Math.atan2(B.dx,B.dz);   // the bridge's side direction and its heading
  for(const s of [-1,1]){   // the two posts, standing beside the planks (2.3 m from the middle), from the lake floor up to 4.4 m over the deck, each with a gold cap
    const x=G.x+px*s*2.3, z=G.z+pz*s*2.3, y0=getH(x,z)-0.3, top=baseY+4.4;
    wood.push(paint(new THREE.CylinderGeometry(0.22,0.28,top-y0,8).translate(x,(y0+top)/2,z),woodc));
    gold.push(paint(new THREE.CylinderGeometry(0.34,0.3,0.28,8).translate(x,top+0.1,z),goldc));
    addCol(x,z,0.4);
  }
  wood.push(paint(new THREE.BoxGeometry(5.2,0.3,0.3).rotateY(ang+Math.PI/2).translate(G.x,baseY+4.2,G.z),woodc));   // the lintel
  cloth.push(paint(new THREE.BoxGeometry(2.2,1.8,0.05).rotateY(ang+Math.PI/2).translate(G.x,baseY+3.1,G.z),clothc));   // a banner hanging from it, facing along the bridge
  gold.push(paint(new THREE.BoxGeometry(1.6,0.14,0.07).rotateY(ang+Math.PI/2).translate(G.x,baseY+3.65,G.z),goldc));
  // the rim: a pole with a banner every 36 degrees, left out within 30 degrees of the bridge
  const a0=Math.atan2(G.x-PVP.x,G.z-PVP.z);
  for(let k=0;k<10;k++){
    const a=k/10*TAU; if(Math.abs(angDiff(a,a0))<0.52) continue;
    const x=PVP.x+Math.sin(a)*(PVP.r-3), z=PVP.z+Math.cos(a)*(PVP.r-3), y=getH(x,z);
    wood.push(paint(new THREE.CylinderGeometry(0.1,0.14,5.2,6).translate(x,y+2.6,z),woodc));
    cloth.push(paint(new THREE.BoxGeometry(0.05,1.5,0.9).rotateY(a).translate(x+Math.sin(a+Math.PI/2)*0.5,y+4.1,z+Math.cos(a+Math.PI/2)*0.5),clothc));
    gold.push(paint(new THREE.SphereGeometry(0.2,6,5).translate(x,y+5.3,z),goldc));
  }
  for(const list of [wood,cloth,gold]){ const mesh=new THREE.Mesh(merge(list),villageMat); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); }
}
