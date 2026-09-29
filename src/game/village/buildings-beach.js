//@ The Tide King's beach (ARENA_TIDE): a ring of whale ribs on the landward side, driftwood, big shells and shallow tide pools
/* Small on purpose (a first version): pale rib arches stand round the north half of the arena (the sea is to the south), logs and shells lie about,
   and a few blue pools shine in the sand. Colliders only for the ribs. */
function buildTideBeach(){
  const A=ARENA_TIDE, bone=[], wood=[], shell=[], bonec=(x,y,z,nx,ny,nz,c)=>{ c.set(0xe8e0cc).multiplyScalar(0.86+h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))*0.16); },
    woodc=(x,y,z,nx,ny,nz,c)=>{ c.set(0x8a7a66).multiplyScalar(0.8+h3(Math.floor(x*5),Math.floor(y*5),Math.floor(z*5))*0.3); },
    shellc=(x,y,z,nx,ny,nz,c)=>{ c.set(0xf0c8b0).lerp(_tint.set(0xd88a8a),clamp(y*0.5)*0.6); };
  // rib arches round the landward half (angles pointing north, -z), each bending in over the arena
  for(let k=0;k<9;k++){
    const a=Math.PI+(k/8-0.5)*2.6, x=A.x+Math.sin(a)*(A.r+1.5), z=A.z+Math.cos(a)*(A.r+1.5), y=getH(x,z)-0.3, s=AR(0.85,1.2);
    const g=new THREE.TorusGeometry(3.2*s,0.34,6,14,Math.PI*0.62).rotateZ(Math.PI*0.19).rotateY(a+Math.PI/2).translate(x,y,z);
    bone.push(paint(g,bonec)); addCol(x,z,0.6);
  }
  // driftwood logs and big shells scattered near the edge
  for(let k=0;k<10;k++){ const a=AR(0,TAU), r=AR(A.r*0.6,A.r+6), x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r;
    wood.push(paint(new THREE.CylinderGeometry(0.16,0.22,AR(2,4.2),6).rotateZ(Math.PI/2).rotateY(AR(0,TAU)).translate(x,getH(x,z)+0.2,z),woodc)); }
  for(let k=0;k<7;k++){ const a=AR(0,TAU), r=AR(4,A.r+4), x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r;
    shell.push(paint(new THREE.ConeGeometry(AR(0.4,0.8),AR(0.9,1.7),8).rotateZ(AR(1.1,1.5)).rotateY(AR(0,TAU)).translate(x,getH(x,z)+0.3,z),shellc)); }
  for(const list of [bone,wood,shell]){ const mesh=new THREE.Mesh(merge(list),villageMat); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); }
  // shallow tide pools
  for(let k=0;k<4;k++){ const a=AR(0,TAU), r=AR(6,A.r-2), x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r;
    const pool=new THREE.Mesh(new THREE.CircleGeometry(AR(1.2,2.4),16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x2a8ab8,transparent:true,opacity:0.6,depthWrite:false}));
    pool.position.set(x,getH(x,z)+0.06,z); scene.add(pool); }
}
