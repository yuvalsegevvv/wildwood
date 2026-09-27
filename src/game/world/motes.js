//@ Floating pollen by day, fireflies by night
/* ---------- drifting motes / fireflies ---------- */
const PN=LITE?120:(LOW?200:380);
const pPos=new Float32Array(PN*3), pData=[];
const pGeo=new THREE.BufferGeometry(); pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const spr=document.createElement('canvas'); spr.width=spr.height=64;
{ const x=spr.getContext('2d'), gr=x.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64); }
const pMat=new THREE.PointsMaterial({size:0.14, map:new THREE.CanvasTexture(spr), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, color:0xfff7d6, opacity:0.5});
const motes=new THREE.Points(pGeo,pMat); motes.frustumCulled=false; scene.add(motes);
function initMotes(){ for(let i=0;i<PN;i++) pData[i]={x:P.x+R(-35,35), z:P.z+R(-35,35), y:R(0.4,3.2), ph:R(0,TAU), sp:R(0.3,1)}; }
function updateMotes(dt,t){
  for(let i=0;i<PN;i++){
    const d=pData[i];
    d.x+=(Math.sin(t*0.3*d.sp+d.ph)*0.5+0.3)*dt; d.z+=Math.cos(t*0.27*d.sp+d.ph*1.3)*0.5*dt;
    if(d.x-P.x>35) d.x-=70; else if(d.x-P.x<-35) d.x+=70;
    if(d.z-P.z>35) d.z-=70; else if(d.z-P.z<-35) d.z+=70;
    const base=Math.max(getH(d.x,d.z),WATER);
    pPos[i*3]=d.x; pPos[i*3+1]=base+d.y+Math.sin(t*d.sp*1.5+d.ph)*0.35; pPos[i*3+2]=d.z;
  }
  pGeo.attributes.position.needsUpdate=true;
}

