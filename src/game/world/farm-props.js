//@ The prologue's places: Tansy's farm (barn with a loft, Old Hob the scarecrow, barley rows, hay, a fence), the fallen log and the hedge on the road to it
/* Agent map. buildFarmProps() (called from generation-setup.js beside buildLoreProps) merges everything into one static mesh. Places come from shared/main-quest.js
   (MQ_FARM, MQ_PLACES). Client only, no colliders (the barn is a backdrop; Tansy's loft is a visit point, not a climb). Test: client-smoke. */
function buildFarmProps(){
  const out=[], m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(0,0,0,'YXZ'), v=new THREE.Vector3(), one=new THREE.Vector3(1,1,1);
  const put=(g,col,x,y,z,yaw,pitch,roll)=>{ const p=paint(g,(px,py,pz,nx,ny,nz,c)=>c.set(col).multiplyScalar(0.86+h3(x+px*3,y+py*3,z+pz*3)*0.26));
    e.set(pitch||0,yaw||0,roll||0); q.setFromEuler(e); m.compose(v.set(x,y,z),q,one); p.applyMatrix4(m); out.push(p); };
  const F=MQ_FARM, gy=(x,z)=>getH(x,z), wood=0x7a5836, dark=0x4e3622, straw=0xd8b45a, barn=0x8a3a2a, roof=0x5a4636;
  /* the barn: red boards, a pitched roof, a door facing the road (east), a loft hatch above it */
  { const bx=F.x-10, bz=F.z-4, y=gy(bx,bz);
    put(new THREE.BoxGeometry(7,4.4,5),barn,bx,y+2.2,bz,0);
    put(new THREE.BoxGeometry(0.15,3,2.2),dark,bx+3.55,y+1.5,bz,0);            // the door
    put(new THREE.BoxGeometry(0.15,1.0,1.2),dark,bx+3.55,y+3.5,bz,0);          // the loft hatch
    for(const s of [-1,1]) put(new THREE.BoxGeometry(7.4,0.2,3.3),roof,bx,y+5.4,bz+s*1.35,0,s*0.0,s*0.62);   // two roof slopes
    put(new THREE.BoxGeometry(0.1,3.4,0.1),dark,bx+3.9,y+1.7,bz+2.4,0); put(new THREE.BoxGeometry(0.1,0.1,1.2),dark,bx+3.9,y+2.6,bz+2.4,0);   // a ladder post
    // the rack by the door: a bow, a wand and a sword leaning on a rail
    { const rx=bx+4.3, rz=bz+2.6; put(new THREE.BoxGeometry(0.1,1.2,1.0),dark,rx,y+0.6,rz,0);
      put(new THREE.BoxGeometry(0.05,1.0,0.05),0x6a4a2a,rx+0.1,y+0.95,rz-0.3,0,0,0.1); put(new THREE.BoxGeometry(0.04,0.9,0.04),0xc0b0d0,rx+0.1,y+0.9,rz,0,0,-0.1); put(new THREE.BoxGeometry(0.05,1.0,0.05),0x9a9aa4,rx+0.1,y+0.95,rz+0.3,0,0,0.05); }
  }
  /* Old Hob: a post, a crosspole, a sack head and a battered hat, in the yard */
  { const hx=F.x+4, hz=F.z+6, y=gy(hx,hz);
    put(new THREE.BoxGeometry(0.12,2.2,0.12),dark,hx,y+1.1,hz,0); put(new THREE.BoxGeometry(1.6,0.1,0.1),dark,hx,y+1.6,hz,0,0,0.05);
    put(new THREE.SphereGeometry(0.3,8,6),0xc8b890,hx,y+2.3,hz,0); put(new THREE.CylinderGeometry(0.34,0.34,0.05,10),0x4a3a2a,hx,y+2.55,hz,0); put(new THREE.CylinderGeometry(0.2,0.24,0.28,10),0x4a3a2a,hx,y+2.7,hz,0);
    put(new THREE.BoxGeometry(0.5,0.7,0.3),0xa8884a,hx,y+1.3,hz,0); }
  /* barley rows (the south corner thin and grey-yellow), hay bales, a fence on the road side */
  for(let r=0;r<5;r++) for(let k=0;k<7;k++){ const x=F.x-6+k*1.5, z=F.z+3+r*1.4, y=gy(x,z), poor=r>=3;
    put(new THREE.BoxGeometry(0.14,poor?0.5:0.95,0.14),poor?0xb8a468:0xd8b45a,x,y+(poor?0.25:0.47),z,r*0.3+k,0,0.06); }
  for(const [dx,dz,s] of [[-3,1.5,1],[-1.6,2.3,0.9],[1.2,-3.2,1.1]]){ const x=F.x+dx, z=F.z+dz, y=gy(x,z); put(new THREE.BoxGeometry(1.2*s,0.8*s,0.8*s),straw,x,y+0.4*s,z,dx); }
  for(let k=-4;k<=4;k++){ const x=F.x+8, z=F.z+k*1.6, y=gy(x,z); put(new THREE.BoxGeometry(0.12,1.1,0.12),wood,x,y+0.55,z,0); if(k<4) put(new THREE.BoxGeometry(0.08,0.1,1.6),wood,x,y+0.85,z+0.8,0); }
  /* the fallen log across the path (road2) and the hedge (road3) */
  { const L=MQ_PLACES.road2, y=gy(L.x,L.z); put(new THREE.CylinderGeometry(0.38,0.42,5.2,9),0x6a4e32,L.x,y+0.35,L.z,0,0,Math.PI/2); }
  { const H=MQ_PLACES.road3; for(let k=-5;k<=5;k++){ if(Math.abs(k)<=1) continue; const x=H.x+k*0.9, z=H.z+4, y=gy(x,z);   // a gap for the path
      put(new THREE.SphereGeometry(0.7+((k*7)&1)*0.15,7,5),0x3f6a34,x,y+0.6,z,k); } }
  const mesh=new THREE.Mesh(merge(out),new THREE.MeshLambertMaterial({vertexColors:true}));
  mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
}
