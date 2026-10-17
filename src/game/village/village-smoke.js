//@ Chimney smoke for the villages after the home one (Rimehold, Highmark, Wraithwick): vsmAdd(point) from a house's chimney, updateVillageSmoke(dt) each frame
/* Agent map. The home village's own smoke is in buildings.js (updateVillage); every other village builds its houses in its own file and calls vsmAdd(world point of a chimney's top) when
   H.chimney is set (buildings-hoar.js, buildings-grey.js, buildings-gloam.js: one line each, marked "// smoke:"). The points are gathered into one THREE.Points with VSM_PER puffs a chimney;
   updateVillageSmoke (main/loop.js, beside updateAmbient) rises them, drifts them with the wind and tints them for the night, and only moves the chimneys within VSM_NEAR metres of the camera
   (the rest are parked out of sight), so a far village costs nothing. Phones (LITE / LOW) get fewer puffs. Nothing here is synced or saved. Test: client-smoke (the loop runs it). */
const VSM_PER=LITE?4:(LOW?6:9), VSM_NEAR=170;
const VSM={pts:[],mesh:null,data:null,pos:null,dirty:false};
function vsmAdd(v){ VSM.pts.push(v.clone()); VSM.dirty=true; }
function vsmBuild(){
  if(VSM.mesh){ scene.remove(VSM.mesh); VSM.mesh.geometry.dispose(); VSM.mesh.material.dispose(); VSM.mesh=null; }
  VSM.dirty=false; if(!VSM.pts.length) return;
  VSM.pos=new Float32Array(VSM.pts.length*VSM_PER*3); VSM.data=[];
  VSM.pts.forEach((p,i)=>{ for(let k=0;k<VSM_PER;k++) VSM.data.push({o:p,age:(k+h3(i,k,2))/VSM_PER,sp:0.8+0.4*h3(i,k,3)}); });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(VSM.pos,3));
  VSM.mesh=new THREE.Points(g,new THREE.PointsMaterial({size:1.7,map:ambSprite('soft'),transparent:true,depthWrite:false,opacity:0.24,color:0xc8c8c8}));
  VSM.mesh.frustumCulled=false; scene.add(VSM.mesh);
}
function updateVillageSmoke(dt){
  if(VSM.dirty) vsmBuild();
  if(!VSM.mesh) return;
  const d=VSM.data, p=VSM.pos, cx=camera.position.x, cz=camera.position.z;
  for(let i=0;i<d.length;i++){
    const s=d[i], o=s.o;
    if(Math.abs(o.x-cx)>VSM_NEAR||Math.abs(o.z-cz)>VSM_NEAR){ p[i*3+1]=-999; continue; }   // far chimneys rest, out of sight
    s.age+=dt*0.12*s.sp; if(s.age>1) s.age-=1;
    p[i*3]=o.x+s.age*3.2+Math.sin(t+i)*0.3; p[i*3+1]=o.y+s.age*7; p[i*3+2]=o.z+Math.sin(s.age*5+i)*0.4;
  }
  VSM.mesh.geometry.attributes.position.needsUpdate=true;
  VSM.mesh.material.color.set(0xc8c8c8).lerp(_tint.set(0x39404c),envCur.night);
}
