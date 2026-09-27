//@ Player movement, collisions, camera
/* ---------- simulation ---------- */
function updatePlayer(dt){
  let f=0,s=0;
  if(keys.KeyW||keys.ArrowUp) f+=1; if(keys.KeyS||keys.ArrowDown) f-=1;
  if(keys.KeyD||keys.ArrowRight) s+=1; if(keys.KeyA||keys.ArrowLeft) s-=1;
  f+=-joyY; s+=joyX;
  const len=Math.hypot(f,s); if(len>1){ f/=len; s/=len; }
  const run=keys.ShiftLeft||keys.ShiftRight||Math.hypot(joyX,joyY)>0.92;
  const inWater=getH(P.x,P.z)<WATER-0.35;
  let speed=run?9.5:4.2; if(inWater) speed*=0.5;
  if(CB.act && (CB.act.kind==='slash'||CB.act.kind==='nova'||CB.act.kind==='shoot'||CB.act.kind==='volley')) speed*=0.45;
  const sy=Math.sin(P.yaw), cy=Math.cos(P.yaw);
  const tx=(-sy*f+cy*s)*speed, tz=(-cy*f-sy*s)*speed;
  const k=1-Math.exp(-(P.ground?10:2.5)*dt);
  P.vx+=(tx-P.vx)*k; P.vz+=(tz-P.vz)*k;
  P.x+=P.vx*dt; P.z+=P.vz*dt;
  nearCols(P.x,P.z,(cx,cz,r)=>{ const dx=P.x-cx, dz=P.z-cz, d=Math.hypot(dx,dz), m=r+0.32; if(d<m && d>1e-4){ P.x=cx+dx/d*m; P.z=cz+dz/d*m; } });
  pushOutBoxes(P,0.32);
  for(const m of MONS){ if(m.dead||!m.g.visible) continue; const dx=P.x-m.x, dz=P.z-m.z, d=Math.hypot(dx,dz), mm=m.T.rad+0.32; if(d<mm && d>1e-4){ P.x=m.x+dx/d*mm; P.z=m.z+dz/d*mm; } }
  for(const n of NPCs){ if(n.inside) continue; const dx=P.x-n.x, dz=P.z-n.z, d=Math.hypot(dx,dz), m=0.62; if(d<m && d>1e-4){ P.x=n.x+dx/d*m; P.z=n.z+dz/d*m; } }
  const lim=HALF-14; P.x=clamp(P.x,-lim,lim); P.z=clamp(P.z,-lim,lim);
  const gnd=Math.max(getH(P.x,P.z),WATER-1.15);
  if(jumpReq && P.ground){ P.vy=inWater?4:6.2; P.ground=false; }
  jumpReq=false;
  P.vy-=19*dt; P.y+=P.vy*dt;
  if(P.y<=gnd){ P.y=gnd; P.vy=0; P.ground=true; }
  else if(P.ground && P.y-gnd<0.7 && P.vy<=0){ P.y=gnd; P.vy=0; }
  else P.ground=false;

  const sp=Math.hypot(P.vx,P.vz);
  P.walk+=Math.sqrt(sp)*dt*3.3;
  if(sp>0.3 && !CB.act) P.face=angLerp(P.face,Math.atan2(-P.vx,-P.vz),1-Math.exp(-10*dt));
}
function updateCamera(dt){
  if(customizing){ editorCamera(dt); return; }
  if(thirdPerson){
    const pt=clamp(0.28-P.pitch*0.9,-0.25,1.25), dist=4.6;
    const hx=P.x, hy=P.y+1.45*hiker.scale, hz=P.z;
    const cx=hx+Math.sin(P.yaw)*Math.cos(pt)*dist, cz=hz+Math.cos(P.yaw)*Math.cos(pt)*dist;
    const cyy=Math.max(hy+Math.sin(pt)*dist, Math.max(getH(cx,cz),WATER)+0.45);
    camera.position.set(cx+(Math.random()-0.5)*camShake*0.6,cyy+(Math.random()-0.5)*camShake*0.6,cz);
    camera.lookAt(hx,hy+0.2,hz);
  } else {
    const sp=Math.hypot(P.vx,P.vz), bob=P.ground?Math.sin(P.walk*2)*0.045*Math.min(sp/4,1.5):0;
    camera.position.set(P.x,P.y+1.62*hiker.scale+bob,P.z);
    camera.rotation.set(P.pitch,P.yaw,0,'YXZ');
  }
}
const shadowTarget=new THREE.Vector3();
function updateShadow(){
  const snap=(2*SHR)/SHM*4;
  shadowTarget.set(Math.round(P.x/snap)*snap, P.y, Math.round(P.z/snap)*snap);
  sun.target.position.copy(shadowTarget); sun.target.updateMatrixWorld();
  sun.position.copy(shadowTarget).addScaledVector(sunDir,140);
}

