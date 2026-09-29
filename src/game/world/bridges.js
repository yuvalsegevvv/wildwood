//@ The river bridge's and the plank causeways' models (BRIDGES in shared/roads.js): plank decks, rails, posts and piers, one merged mesh
/* Walking on it is movement.js (the deck counts as ground: bridgeDeck). Bridge: planks every 0.55 m, a post every 2.5 m on both
   sides with a rail between, and two pairs of piers standing in the river. Causeway: narrower, slightly crooked planks, low posts
   every 3 m going down to the drowned road, a rail on one side. */
function buildBridges(){
  if(!BRIDGES.length) return;
  const parts=[], m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(0,0,0,'YXZ'), v=new THREE.Vector3(), one=new THREE.Vector3(1,1,1);
  const wood=[0x7a5634,0x6e4c2e,0x86603a], dark=0x4e3622;
  const box=(w,h,d,x,y,z,yaw,pitch,col)=>{
    const g=paint(new THREE.BoxGeometry(w,h,d),(px,py,pz,nx,ny,nz,c)=>c.set(col).multiplyScalar(0.9+h3(x,y+px,z+pz)*0.2));
    e.set(pitch,yaw,0); q.setFromEuler(e); m.compose(v.set(x,y,z),q,one); g.applyMatrix4(m); parts.push(g);
  };
  for(const B of BRIDGES){
    const cw=B.kind==='causeway', L=B.len, W=B.w, yaw=Math.atan2(B.dx,B.dz), at=u=>[B.x+B.dx*u, B.z+B.dz*u], ax=B.dz, az=-B.dx;   // (ax, az): across the deck
    const Y=u=>bridgeY(B,u/L+0.5), slope=u=>(Y(u+0.3)-Y(u-0.3))/0.6;
    for(let u=-L/2+0.3;u<=L/2-0.2;u+=0.55){
      const [x,z]=at(u), y=Y(u)-0.07, sk=cw?(h3(x,2,z)-0.5)*0.12:0;   // causeway planks lie a little crooked
      box(W*2+(cw?0.1:0.3),0.12,cw?0.42:0.5,x,y,z,yaw+sk,-Math.atan(slope(u)),wood[Math.floor(h3(x,1,z)*3)%3]);
    }
    const step=cw?3:2.5, postH=cw?0.75:1.1;
    for(const side of [-1,1]){
      for(let u=-L/2+0.4;u<=L/2;u+=step){
        const [x0,z0]=at(u), x=x0+ax*side*(W+0.1), z=z0+az*side*(W+0.1), y=Y(u), deep=cw?Math.max(0,y-WATER)+1.2:0;   // causeway posts stand on the drowned road
        box(0.16,postH+deep,0.16,x,y+postH*0.4-deep/2,z,yaw,0,dark);
        if(u+step<=L/2&&(!cw||side>0)){ const u2=u+step/2, [xm,zm]=at(u2), ym=Y(u2);   // a causeway has a rail on one side only
          box(0.09,0.1,step+0.05,xm+ax*side*(W+0.1),ym+postH*0.86,zm+az*side*(W+0.1),yaw,-Math.atan(slope(u2)),wood[0]); }
      }
      if(!cw) for(const u of [-L*0.2,L*0.2]){   // piers standing in the river
        const [x0,z0]=at(u), x=x0+ax*side*(W-0.3), z=z0+az*side*(W-0.3), top=Y(u)-0.1;
        box(0.34,top+3.2,0.34,x,(top-3.2)/2,z,yaw,0,dark);
      }
    }
  }
  const mesh=new THREE.Mesh(merge(parts),new THREE.MeshLambertMaterial({vertexColors:true}));
  mesh.castShadow=true; mesh.receiveShadow=true; mesh.matrixAutoUpdate=false; scene.add(mesh);
}
