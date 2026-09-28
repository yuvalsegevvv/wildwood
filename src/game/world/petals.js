//@ Cherry petals drifting down around you in the Sakura Vale
/* A small cloud of petals kept around the camera, falling and swaying; they fade in as you come through the tunnel. */
const PET_N=LITE?90:(LOW?150:260), petPos=new Float32Array(PET_N*3), petData=[];
const petGeo=new THREE.BufferGeometry(); petGeo.setAttribute('position',new THREE.BufferAttribute(petPos,3));
const petSpr=document.createElement('canvas'); petSpr.width=petSpr.height=32;
{ const x=petSpr.getContext('2d'); x.fillStyle='#fff'; x.beginPath(); x.ellipse(16,16,13,7,0.6,0,TAU); x.fill(); }
const petMat=new THREE.PointsMaterial({size:0.16,map:new THREE.CanvasTexture(petSpr),transparent:true,depthWrite:false,color:0xffc4d8,opacity:0,alphaTest:0.05});
const petals=new THREE.Points(petGeo,petMat); petals.frustumCulled=false; petals.visible=false; scene.add(petals);
for(let i=0;i<PET_N;i++) petData.push({x:AR(-30,30),z:AR(-30,30),y:AR(0,14),sp:AR(0.5,1.1),ph:AR(0,TAU)});
function updatePetals(dt,t){
  const cx=camera.position.x, cz=camera.position.z, k=smoothstep(TUN.p1-10,TUN.p1+30,cx);
  petMat.opacity=k*0.9; petals.visible=k>0.01; if(!petals.visible) return;
  for(let i=0;i<PET_N;i++){
    const d=petData[i];
    d.y-=dt*0.7*d.sp; d.x+=(Math.sin(t*0.9*d.sp+d.ph)*0.6+0.35)*dt; d.z+=Math.cos(t*0.7*d.sp+d.ph)*0.5*dt;
    if(d.y<0){ d.y=AR(10,14); d.x=AR(-30,30); d.z=AR(-30,30); }
    if(d.x>30) d.x-=60; else if(d.x<-30) d.x+=60;
    petPos[i*3]=cx+d.x; petPos[i*3+1]=Math.max(getH(cx+d.x,cz+d.z),WATER)+d.y; petPos[i*3+2]=cz+d.z;
  }
  petGeo.attributes.position.needsUpdate=true;
}
