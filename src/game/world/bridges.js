//@ The river bridge's model (BRIDGES in shared/roads.js): plank deck following its arch, rails, posts and piers, one merged mesh
/* Walking on it is movement.js (the deck counts as ground: bridgeDeck). Planks every 0.55 m, a post every 2.5 m on both
   sides with a rail between, and two pairs of piers standing in the river. */
function buildBridges(){
  if(!BRIDGES.length) return;
  const parts=[], m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(0,0,0,'YXZ'), v=new THREE.Vector3(), one=new THREE.Vector3(1,1,1);
  const wood=[0x7a5634,0x6e4c2e,0x86603a], dark=0x4e3622;
  const box=(w,h,d,x,y,z,yaw,pitch,col)=>{
    const g=paint(new THREE.BoxGeometry(w,h,d),(px,py,pz,nx,ny,nz,c)=>c.set(col).multiplyScalar(0.9+h3(x,y+px,z+pz)*0.2));
    e.set(pitch,yaw,0); q.setFromEuler(e); m.compose(v.set(x,y,z),q,one); g.applyMatrix4(m); parts.push(g);
  };
  for(const B of BRIDGES){
    const yaw=Math.atan2(B.dx,B.dz), at=u=>[B.x+B.dx*u, B.z+B.dz*u], ax=B.dz, az=-B.dx;   // (ax, az): across the deck
    const slope=u=>(bridgeY(B,(u+0.3)/BRIDGE_LEN+0.5)-bridgeY(B,(u-0.3)/BRIDGE_LEN+0.5))/0.6;
    for(let u=-BRIDGE_LEN/2+0.3;u<=BRIDGE_LEN/2-0.2;u+=0.55){
      const [x,z]=at(u), y=bridgeY(B,u/BRIDGE_LEN+0.5)-0.07;
      box(BRIDGE_W*2+0.3,0.12,0.5,x,y,z,yaw,-Math.atan(slope(u)),wood[Math.floor(h3(x,1,z)*3)%3]);
    }
    for(const side of [-1,1]){
      for(let u=-BRIDGE_LEN/2+0.4;u<=BRIDGE_LEN/2;u+=2.5){
        const [x0,z0]=at(u), x=x0+ax*side*(BRIDGE_W+0.1), z=z0+az*side*(BRIDGE_W+0.1), y=bridgeY(B,u/BRIDGE_LEN+0.5);
        box(0.16,1.1,0.16,x,y+0.45,z,yaw,0,dark);
        if(u+2.5<=BRIDGE_LEN/2){ const u2=u+1.25, [xm,zm]=at(u2), ym=bridgeY(B,u2/BRIDGE_LEN+0.5);
          box(0.09,0.1,2.55,xm+ax*side*(BRIDGE_W+0.1),ym+0.95,zm+az*side*(BRIDGE_W+0.1),yaw,-Math.atan(slope(u2)),wood[0]); }
      }
      for(const u of [-BRIDGE_LEN*0.2,BRIDGE_LEN*0.2]){   // piers standing in the river
        const [x0,z0]=at(u), x=x0+ax*side*(BRIDGE_W-0.3), z=z0+az*side*(BRIDGE_W-0.3), top=bridgeY(B,u/BRIDGE_LEN+0.5)-0.1;
        box(0.34,top+3.2,0.34,x,(top-3.2)/2,z,yaw,0,dark);
      }
    }
  }
  const mesh=new THREE.Mesh(merge(parts),new THREE.MeshLambertMaterial({vertexColors:true}));
  mesh.castShadow=true; mesh.receiveShadow=true; mesh.matrixAutoUpdate=false; scene.add(mesh);
}
