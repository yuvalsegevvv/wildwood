//@ Weapon models in the hiker's hands (attachWeapons), aim helpers
/* weapons in the hiker's hands */
function attachWeapons(){
  const r=hiker.rig; if(!r) return;
  if(hiker.wpn) hiker.wpn.forEach(o=>{ if(o.parent) o.parent.remove(o); });
  const res=weaponsOn(r,GEAR&&GEAR.eq.weapon,LOOK.build); hiker.wpn=res.objs;
}
// builds the weapon models for a weapon item on a character rig; used for your hiker and for other players
function weaponsOn(r,weaponId,build){
  const objs=[], res={objs};
  const add=(parent,obj)=>{ parent.add(obj); objs.push(obj); obj.traverse(q=>{ if(q.isMesh) q.castShadow=true; }); return obj; };
  const w=ITEM[weaponId], c=w?CLASS_OF[w.slot]:'warrior', tr=w?dgVisTier(w):0;   // dungeons: a level-30 weapon is drawn as the top tier's
  if(c==='warrior'){
    const blade=[0x9c9288,0xc0c6cc,0xd9e2ea,0xf5dc8a,0xeef2f6,0xcfe4ff][tr], guard=[0x6a5030,0x5a5d62,0x8a7a4a,0xd4a83a,0x1a1414,0x2a2a40][tr], L=[0.6,0.7,0.8,0.9,0.95,1.0][tr], kat=tr>=4;
    const parts=[
      pc(vbox(kat?0.04:0.055+tr*0.006,L,0.014,0,-0.22-L/2,0),(x,y,z,col)=>col.set(blade).multiplyScalar(0.85+Math.abs(x)*3)),
      pc(new THREE.ConeGeometry(kat?0.02:0.03,0.1,4).rotateX(Math.PI).translate(0,-0.27-L,0),col=>col.set(blade)),
      kat?pc(cyl(0.065,0.065,0.02,12).translate(0,-0.2,0),col=>col.set(guard)):pc(vbox(0.22+tr*0.03,0.035,0.05,0,-0.2,0),col=>col.set(guard)),
      pc(cyl(0.02,0.02,kat?0.22:0.16,6).translate(0,kat?-0.08:-0.1,0),col=>col.set(kat?0x2a1e28:0x4a3020)),
      pc(csph(0.03,6,5),col=>col.set(guard))];
    if(tr===3||tr===5) parts.push(pc(vbox(0.012,L*0.8,0.016,0,-0.22-L*0.45,0),col=>col.set(tr===5?0x9fd8ff:0xffb040)));
    const sw=new THREE.Mesh(merge(parts),matChar);
    sw.position.set(0,-0.3,0); sw.rotation.x=0.35; add(r.elR,sw);
    const face=[0x7a4a2c,0x6a6e74,0x8a9aa8,0xd4a83a,0x8a2a26,0x24222a][tr], rim=[0x8a8f94,0x3a3c40,0x5a6a7a,0xf2eee4,0xd4a83a,0xf0cd45][tr];
    const sh=new THREE.Mesh(merge([
      pc(cyl(0.21+tr*0.015,0.21+tr*0.015,0.035,18).rotateZ(Math.PI/2),(x,y,z,col)=>{ col.set(Math.hypot(y,z)>0.18+tr*0.012?rim:face); }),
      pc(csph(0.05,8,6).scale(0.6,1,1).translate(-0.02,0,0),col=>col.set(rim))
    ]),matChar);
    sh.position.set(-0.07,-0.16,0); add(r.elL,sh);
  } else if(c==='archer'){
    const wood=[0x7a5236,0x6a4428,0x2e2622,0xe8e0c8,0x8a2a26,0x1e1c22][tr], tip=[0x7a5236,0x8a8f94,0xa8b4c0,0xd4a83a,0xe8c060,0x9fd8ff][tr];
    const R=[0.5,0.55,0.58,0.62,0.7,0.74][tr], arc=Math.PI*0.62;
    const bowG=new THREE.TorusGeometry(R,0.018+tr*0.003,5,24,arc).rotateZ(-Math.PI/2-arc/2).translate(0,R,0).rotateY(Math.PI/2);
    const half=R*Math.sin(arc/2), sy=R*(1-Math.cos(arc/2));
    const strG=cyl(0.003,0.003,half*2,3).rotateZ(Math.PI/2).translate(0,sy,0).rotateY(Math.PI/2);
    const ends=[-1,1].map(sd=>pc(csph(0.03,6,5).translate(0,sy,sd*half).rotateY(0),col=>col.set(tip)));
    const bow=new THREE.Mesh(merge([pc(bowG,(x,y,z,col)=>col.set(Math.abs(z)>half*0.85?tip:wood)),pc(strG,col=>col.set(tr===3?0xffe9a0:tr===5?0xcfe8ff:0xe8e4dc)),pc(cyl(0.028,0.028,0.12,6).rotateX(Math.PI/2),col=>col.set(0x3a2a1c)),...ends]),matChar);
    bow.position.set(0,-0.32,0); add(r.elL,bow);
    const quiver=new THREE.Mesh(merge([pc(cyl(0.07,0.06,0.55,10),col=>col.set([0x6b3a22,0x5a3a2a,0x2e2a36,0x8a2f2f,0x2a2830,0x6a2a26][tr])),...[-0.03,0,0.03].map((x,i)=>pc(vbox(0.012,0.12,0.04,x,0.32,(i-1)*0.02),col=>col.set(0xe8e4dc)))]),matChar);
    quiver.position.set(0.12,0.34,0.24*(build||1)); quiver.rotation.z=-0.35; add(r.spine,quiver);
  } else {
    const wood=[0x7a5236,0xcfd8e6,0x3a2a4a,0x2a1e14,0xf2c6d6,0x2a1e14][tr], glow=[0xc8f07a,0x9fd8ff,0xc59bff,0xffb040,0xff9ad5,0x6ab8ff][tr], L=[0.3,0.34,0.38,0.42,0.45,0.48][tr];
    const wand=new THREE.Group();
    wand.add(new THREE.Mesh(merge([pc(cyl(0.016,0.022,L,6).translate(0,-L/2,0),(x,y,z,col)=>col.set(wood).multiplyScalar(0.85+h3(0,Math.round(y*20),0)*0.3)),
      pc(cyl(0.03,0.02,0.05,6).translate(0,-L,0),col=>col.set(tr>=2?0xd4a83a:0x8a7a4a))]),matChar));
    const orb=new THREE.Mesh(tr===1?new THREE.OctahedronGeometry(0.05,0):new THREE.SphereGeometry(0.045,10,8),new THREE.MeshBasicMaterial({color:glow}));
    orb.position.set(0,-L-0.06,0); wand.add(orb);
    const halo=new THREE.Mesh(new THREE.SphereGeometry(0.09+tr*0.015,10,8),fxMat(glow,0.35)); halo.position.copy(orb.position); wand.add(halo);
    wand.position.set(0,-0.3,0); wand.rotation.x=0.3; add(r.elR,wand);
  }
  return res;
}
function aimDir(){ const v=new THREE.Vector3(); camera.getWorldDirection(v); if(thirdPerson) v.y=Math.max(v.y,-0.05)+0.04; return v.normalize(); }

