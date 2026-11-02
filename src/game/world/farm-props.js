//@ The story's places: the fallen log and the hedge on the road to Tansy's farm, Morrow's grey stump (the farm and the hut themselves are story-houses.js), Pip's hollow, the grave in Deathcap Dell, the Ribbon Row, the Whisper Stump
/* Agent map. buildFarmProps() (called from generation-setup.js beside buildLoreProps) merges everything into one static mesh. Places come from shared/main-quest.js
   (MQ_FARM, MQ_PLACES). Client only, no colliders (the barn is a backdrop; Tansy's loft is a visit point, not a climb). Test: client-smoke. */
function buildFarmProps(){
  const out=[], m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(0,0,0,'YXZ'), v=new THREE.Vector3(), one=new THREE.Vector3(1,1,1);
  const put=(g,col,x,y,z,yaw,pitch,roll)=>{ const p=paint(g,(px,py,pz,nx,ny,nz,c)=>c.set(col).multiplyScalar(0.86+h3(x+px*3,y+py*3,z+pz*3)*0.26));
    e.set(pitch||0,yaw||0,roll||0); q.setFromEuler(e); m.compose(v.set(x,y,z),q,one); p.applyMatrix4(m); out.push(p); };
  const F=MQ_FARM, gy=(x,z)=>getH(x,z), wood=0x7a5836, dark=0x4e3622, straw=0xd8b45a, barn=0x8a3a2a, roof=0x5a4636;
  buildStoryHouses();   // the barn, the coop, the field, Old Hob, the fence and Morrow's hut with its garden: story-houses.js
  /* the fallen log across the path (road2) and the hedge (road3) */
  { const L=MQ_PLACES.road2, y=gy(L.x,L.z); put(new THREE.CylinderGeometry(0.38,0.42,5.2,9),0x6a4e32,L.x,y+0.35,L.z,0,0,Math.PI/2); }
  { const H=MQ_PLACES.road3; for(let k=-5;k<=5;k++){ if(Math.abs(k)<=1) continue; const x=H.x+k*0.9, z=H.z+4, y=gy(x,z);   // a gap for the path
      put(new THREE.SphereGeometry(0.7+((k*7)&1)*0.15,7,5),0x3f6a34,x,y+0.6,z,k); } }
  /* the grey stump by Morrow's door (the Power skill's target) */
  { const H=MQ_PLACES.hut, sx=H.x-0.5, sz=H.z+3, sy=gy(sx,sz); put(new THREE.CylinderGeometry(0.6,0.75,0.9,9),0x8a8a8e,sx,sy+0.45,sz,0); put(new THREE.CylinderGeometry(0.15,0.4,0.5,7),0x6a6a70,sx+0.2,sy+1.1,sz,0,0,0.3); }
  /* Pip's hollow: a ring of green in a grey place, a fallen trunk to sit on, a few ferns */
  { const P=MQ_PLACES.pip, y=gy(P.x,P.z); put(new THREE.CylinderGeometry(0.4,0.45,3.4,8),0x5a4a38,P.x-2.2,y+0.4,P.z+1,0.6,0,Math.PI/2);
    for(let k=0;k<9;k++){ const a=k/9*TAU, x=P.x+Math.sin(a)*2.6, z=P.z+Math.cos(a)*2.6, yy=gy(x,z); put(new THREE.BoxGeometry(0.1,0.7,0.5),0x5ab04a,x,yy+0.35,z,a,0,0.3); put(new THREE.BoxGeometry(0.1,0.6,0.4),0x4a9a3e,x+0.2,yy+0.3,z,a+1,0,-0.3); } }
  /* the grave in Deathcap Dell: a low mound, a plain stone, a little wooden marker */
  { const G=MQ_PLACES.grave, y=gy(G.x,G.z); put(new THREE.BoxGeometry(2.0,0.3,1.0),0x4e4034,G.x,y+0.15,G.z,0.3); put(new THREE.BoxGeometry(0.7,1.0,0.2),0x8a8a86,G.x+0.2,y+0.7,G.z-0.7,0.3); put(new THREE.BoxGeometry(0.06,0.5,0.06),dark,G.x-0.7,y+0.55,G.z+0.5,0.3); }
  /* the Ribbon Row: nine posts with ribbons and a bare white tenth */
  { const R=MQ_PLACES.ribbonrow, cols=[0xe0c040,0xc03a3a,0x4a9a4a,0x4a7ac0,0xc07ac0,0xe08a3a,0x3aa8a8,0xe0c040,0xc03a3a];
    for(let k=0;k<10;k++){ const x=R.x+k*1.8-8, z=R.z, y=gy(x,z); put(new THREE.BoxGeometry(0.14,1.6,0.14),k===9?0xe8e4dc:wood,x,y+0.8,z,0);
      if(k<9) put(new THREE.BoxGeometry(0.08,0.5,0.3),cols[k],x+0.1,y+1.35,z,0,0,0.25); else put(new THREE.BoxGeometry(0.16,0.06,0.16),0xe8e4dc,x+0.15,y+1.4,z,0); } }
  /* the Whisper Stump in the Bog: a great hollow stump that hums */
  { const S=MQ_PLACES.stump, y=gy(S.x,S.z); put(new THREE.CylinderGeometry(1.3,1.7,2.2,10),0x4a3e34,S.x,y+1.1,S.z,0); put(new THREE.CylinderGeometry(0.8,0.8,0.1,10),0x1a1a18,S.x,y+2.22,S.z,0); }
  /* Ironshell Ridge: the fitted stone slabs under the ore */
  { const R=MQ_PLACES.ridge, y=gy(R.x,R.z); for(let a=0;a<3;a++) for(let b=0;b<3;b++) put(new THREE.BoxGeometry(1.4,0.12,1.4),0x8a8884,R.x+a*1.42-1.4,y+0.06,R.z+b*1.42-1.4,0); }
  const mesh=new THREE.Mesh(merge(out),new THREE.MeshLambertMaterial({vertexColors:true}));
  mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
}
