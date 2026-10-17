//@ Ambient life for every land: falling leaves in the forest, ice glints in the Reach, wind-blown snow on the Greyspine, blown sand and tumbleweeds on the Sunscar, drifting spirit lights in the Gloamhorn
/* Agent map. updateAmbient(dt,t) (loop.js, beside updatePetals) moves a few small point clouds kept round the camera; each layer belongs to one land (waLandId: 0 home, 2 hoar, 3 grey, 4 sun, 5 gloam;
   the vale's petals are petals.js, its fireflies and pollen motes.js) and fades in with the distance from that land's border, like the petals. The Sunscar also has AMB_WEEDS: a few tumbleweeds rolling
   downwind along the ground (respawned upwind of you when they leave the land or get far). Layers are data rows in AMB_LAYERS: n (count), size, color, add (additive), spr ('leaf' 'soft' 'dot'), step (moves one point).
   Phones get fewer points (LITE / LOW). Nothing here is synced or saved. Test: client-smoke (the loop runs it). */
const AMB_N=LITE?0.35:(LOW?0.6:1);
const AMB_WIND=[0.93,0.37];   // the Sunscar's wind (x, z): the sand streams along it and the tumbleweeds roll with it
function ambSprite(kind){
  const c=document.createElement('canvas'); c.width=c.height=32; const g=c.getContext('2d');
  if(kind==='leaf'){ g.fillStyle='#fff'; g.beginPath(); g.ellipse(16,16,13,6,0.7,0,TAU); g.fill(); }
  else if(kind==='dot'){ g.fillStyle='#fff'; g.beginPath(); g.arc(16,16,6,0,TAU); g.fill(); }
  else { const r=g.createRadialGradient(16,16,0,16,16,16); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.4,'rgba(255,255,255,.5)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,32,32); }
  return new THREE.CanvasTexture(c);
}
// each step moves one point d ({x,z: offset from the camera, y: height over the ground, sp, ph}); a point that leaves the 60 m box wraps round
const AMB_LAYERS=[
  {land:0,n:90,size:0.2,color:0xd2b246,add:false,op:0.85,spr:'leaf',step(d,dt,t){ d.y-=dt*0.55*d.sp; d.x+=(Math.sin(t*0.8*d.sp+d.ph)*0.9+0.4)*dt; d.z+=Math.cos(t*0.6*d.sp+d.ph)*0.7*dt; if(d.y<0) d.y=AR(6,12); }},   // leaves, golden green
  {land:2,n:110,size:0.12,color:0xd8f0ff,add:true,op:0.7,spr:'soft',step(d,dt,t){ d.y+=Math.sin(t*0.7+d.ph)*0.25*dt; d.x+=Math.sin(t*0.3*d.sp+d.ph)*0.5*dt; d.z+=Math.cos(t*0.25*d.sp+d.ph)*0.5*dt; if(d.y<0.3) d.y=0.3; if(d.y>7) d.y=0.4; }},   // ice glints hanging in the cold air
  {land:3,n:120,size:0.1,color:0xf2f8ff,add:false,op:0.6,spr:'dot',step(d,dt,t){ d.x+=(7+4*d.sp)*dt; d.z+=Math.sin(t*0.5+d.ph)*1.2*dt; d.y+=Math.sin(t*1.3+d.ph)*0.4*dt-dt*0.2; if(d.y<0.4) d.y=AR(1,6); }},   // snow torn off the peaks by the wind
  {land:4,n:150,size:0.09,color:0xe6c78e,add:false,op:0.6,spr:'dot',step(d,dt,t){ const k=(5+4*d.sp)*dt; d.x+=AMB_WIND[0]*k; d.z+=AMB_WIND[1]*k+Math.sin(t*0.7+d.ph)*0.6*dt; d.y+=Math.sin(t*2+d.ph)*0.5*dt; if(d.y<0.15) d.y=0.15; if(d.y>2.8) d.y=0.3; }},   // sand streaming along the ground
  {land:5,n:55,size:0.5,color:0x9ad8ff,add:true,op:0.75,spr:'soft',step(d,dt,t){ d.x+=Math.sin(t*0.25*d.sp+d.ph)*0.9*dt; d.z+=Math.cos(t*0.21*d.sp+d.ph*1.3)*0.9*dt; d.y+=Math.sin(t*0.6+d.ph)*0.35*dt; if(d.y<0.7) d.y=0.7; if(d.y>4.5) d.y=4.5; }}   // spirit lights drifting over the heath
];
const AMB=[];
for(const L of AMB_LAYERS){
  const n=Math.max(8,Math.round(L.n*AMB_N)), pos=new Float32Array(n*3), geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({size:L.size,map:ambSprite(L.spr),transparent:true,depthWrite:false,color:L.color,opacity:0,alphaTest:0.02,blending:L.add?THREE.AdditiveBlending:THREE.NormalBlending});
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; pts.visible=false; scene.add(pts);
  const data=[]; for(let i=0;i<n;i++) data.push({x:AR(-30,30),z:AR(-30,30),y:AR(0.4,8),sp:AR(0.6,1.4),ph:AR(0,TAU)});
  AMB.push({L,n,pos,geo,mat,pts,data});
}
// tumbleweeds: two crossed wire spheres of dry twigs rolling downwind; AMB_WEEDS of them near you while you are on the Sunscar
const AMB_WEEDS=LITE?0:(LOW?3:6), ambWeeds=[];
for(let i=0;i<AMB_WEEDS;i++){
  const g=new THREE.Group(), m=new THREE.MeshBasicMaterial({color:0x8a6a3a,wireframe:true,transparent:true,opacity:0.9});
  const a=new THREE.Mesh(new THREE.IcosahedronGeometry(0.42,1),m), b=new THREE.Mesh(new THREE.IcosahedronGeometry(0.3,1),m); b.rotation.set(1,0.4,0.7); g.add(a,b); g.visible=false; scene.add(g);
  ambWeeds.push({g,x:0,z:0,sp:AR(2.5,4.5),ph:AR(0,TAU),on:false});
}
function ambWeedSpot(w,cx,cz){   // upwind of the camera, on the Sunscar's flatter ground
  for(let k=0;k<12;k++){ const side=AR(-45,45), x=cx-AMB_WIND[0]*AR(30,48)-AMB_WIND[1]*side, z=cz-AMB_WIND[1]*AR(30,48)+AMB_WIND[0]*side;
    if(waLandId(x,z)===4&&getH(x,z)>0.4&&grad(x,z)<0.5&&vDist(x,z)>40){ w.x=x; w.z=z; w.on=true; return; } }
  w.on=false;
}
function updateAmbient(dt,t){
  const cx=camera.position.x, cz=camera.position.z, land=waLandId(cx,cz), k=waLandBorderDist(cx,cz)>0?smoothstep(0,60,waLandBorderDist(cx,cz)):0;
  for(const A of AMB){
    const on=land===A.L.land&&!dgInSlots(cx), kk=on?k:0;   // (not inside a dungeon run)
    A.mat.opacity=kk*A.L.op*(A.L.land===2?0.75+0.25*Math.sin(t*2.3):1); A.pts.visible=kk>0.01; if(!A.pts.visible) continue;
    for(let i=0;i<A.n;i++){
      const d=A.data[i]; A.L.step(d,dt,t);
      if(d.x>30) d.x-=60; else if(d.x<-30) d.x+=60; if(d.z>30) d.z-=60; else if(d.z<-30) d.z+=60;
      const x=cx+d.x, z=cz+d.z; A.pos[i*3]=x; A.pos[i*3+1]=Math.max(getH(x,z),WATER)+d.y; A.pos[i*3+2]=z;
    }
    A.geo.attributes.position.needsUpdate=true;
  }
  const sun=land===4&&k>0.05&&!dgInSlots(cx);
  for(const w of ambWeeds){
    if(!sun){ w.g.visible=false; w.on=false; continue; }
    if(!w.on||Math.hypot(w.x-cx,w.z-cz)>70||waLandId(w.x,w.z)!==4){ ambWeedSpot(w,cx,cz); w.g.visible=w.on; continue; }
    w.x+=AMB_WIND[0]*w.sp*dt; w.z+=AMB_WIND[1]*w.sp*dt; const h=getH(w.x,w.z), bounce=Math.abs(Math.sin(t*3+w.ph))*0.35;
    w.g.visible=true; w.g.position.set(w.x,h+0.45+bounce,w.z); w.g.rotation.z-=dt*w.sp*2.4; w.g.rotation.x+=dt*0.6;
  }
}
