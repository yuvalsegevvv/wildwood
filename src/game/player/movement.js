//@ Player movement (with a boss's ice, shoves and whirlpools), collisions (the border mountains, the tunnel and its sealed door, the vale's north wall with Frostgate Pass and its ice wall, the home forest's north rim above the Greyspine), camera
/* ---------- simulation ---------- */
function updatePlayer(dt){
  let f=0,s=0;
  if(kbHeld('fwd')) f+=1; if(kbHeld('back')) f-=1;
  if(kbHeld('right')) s+=1; if(kbHeld('left')) s-=1;
  f+=-joyY; s+=joyX;
  const len=Math.hypot(f,s); if(len>1){ f/=len; s/=len; }
  const run=kbHeld('run')||Math.hypot(joyX,joyY)>0.92;
  const wsf=waterSurf(P.x,P.z), inWater=getH(P.x,P.z)<wsf-0.35 && bridgeDeck(P.x,P.z)<wsf;   // (the sea's level, or a tarn's or the river's in the Greyspine)
  let speed=run?9.5:4.2; if(inWater) speed*=0.5;
  if(PFX.slow>0) speed*=0.5; if(PFX.root>0) speed=0;   // a boss's ice: frozen or slowed (combat/boss-fx.js)
  if(CB.act && (CB.act.kind==='slash'||CB.act.kind==='nova'||CB.act.kind==='shoot'||CB.act.kind==='volley')) speed*=0.45;
  const sy=Math.sin(P.yaw), cy=Math.cos(P.yaw);
  const tx=(-sy*f+cy*s)*speed, tz=(-cy*f-sy*s)*speed;
  const k=1-Math.exp(-(P.ground?10:2.5)*dt);
  P.vx+=(tx-P.vx)*k; P.vz+=(tz-P.vz)*k;
  const ox=P.x, oz=P.z;
  P.x+=P.vx*dt; P.z+=P.vz*dt; pfxStep(dt);
  nearCols(P.x,P.z,(cx,cz,r)=>{ const dx=P.x-cx, dz=P.z-cz, d=Math.hypot(dx,dz), m=r+0.32; if(d<m && d>1e-4){ P.x=cx+dx/d*m; P.z=cz+dz/d*m; } });
  pushOutBoxes(P,0.32);
  for(const m of MONS){ if(m.dead||!m.g.visible) continue; const dx=P.x-m.x, dz=P.z-m.z, d=Math.hypot(dx,dz), mm=m.T.rad+0.32; if(d<mm && d>1e-4){ P.x=m.x+dx/d*mm; P.z=m.z+dz/d*mm; } }
  for(const n of NPCs){ if(n.inside) continue; const dx=P.x-n.x, dz=P.z-n.z, d=Math.hypot(dx,dz), m=0.62; if(d<m && d>1e-4){ P.x=n.x+dx/d*m; P.z=n.z+dz/d*m; } }
  worldBounds(P,ox,0.32,oz);
  const gnd=Math.max(getH(P.x,P.z),wsf-1.15,bridgeDeck(P.x,P.z));   // the river bridge's deck is ground too
  if(jumpReq && P.ground && PFX.root<=0){ P.vy=inWater?4:6.2; P.ground=false; }
  jumpReq=false;
  P.vy-=19*dt; P.y+=P.vy*dt;
  if(P.y<=gnd){ P.y=gnd; P.vy=0; P.ground=true; }
  else if(P.ground && P.y-gnd<0.7 && P.vy<=0){ P.y=gnd; P.vy=0; }
  else P.ground=false;

  const sp=Math.hypot(P.vx,P.vz);
  P.walk+=Math.sqrt(sp)*dt*3.3;
  if(sp>0.3 && !CB.act) P.face=angLerp(P.face,Math.atan2(-P.vx,-P.vz),1-Math.exp(-10*dt));
}
/* The two lands are walled off by the border mountains (you can climb up to 14 m short of the crest from either side);
   the only way through is the tunnel. Inside it you are kept between its walls; its west door stays shut until the
   Rootwarden falls (GEAR.east >= 1). o.inTun is set when you walk in through either portal.
   On the Crownsea's shore you can wade in to the knees (ground above WATER-0.8), no deeper (oz: the z before the move). */
const valeOpen=()=>!!(GEAR&&GEAR.east>=1);
const northOpen=()=>!!(GEAR&&GEAR.north>=1);
const westOpen=()=>!!(GEAR&&GEAR.west>=1);
function worldBounds(o,ox,rad,oz){
  const T=TUN, dz=o.z-T.z, bore=Math.abs(dz)<T.w-rad+0.2, e0=T.p0-0.6, e1=T.p1+0.6;
  if(!o.inTun && bore && ((ox<=e0 && o.x>e0 && valeOpen()) || (ox>=e1 && o.x<e1))) o.inTun=true;
  if(o.inTun){
    if(o.x<e0-0.3||o.x>e1+0.3) o.inTun=false;
    else o.z=T.z+clamp(dz,-(T.w-rad),T.w-rad);
  }
  if(!o.inTun){
    if(o.x>e0 && o.x<e1 && Math.abs(dz)<T.w+6){   // against the mountain face, the sealed door, or over the tunnel
      if(ox<=e0) o.x=e0; else if(ox>=e1) o.x=e1; else o.z=T.z+Math.sign(dz||1)*(T.w+6);
    }
    glenWall(o,ox,oz,rad);   // the Vale Wall, with the glacier valley the one way across it in the north
  }
  o.z=clamp(o.z,WZ0+14,WZ1-14); if(o.x<WX0+14) o.x=WX0+14;
  if(o.x<HALF){ greyWall(o,oz); for(const G of GREY_GATES) if(!gateOpen(G)&&o.z<HZ0&&Math.abs(o.z-G.z)<40&&ox>=G.x&&o.x<G.x+0.8) o.x=G.x+0.8; }   // (the rock falls in the Greyspine's west wall)
  else frostWall(o,ox,oz,rad);
  if(oz!==undefined && coastDist(o.x,o.z)<34){ const h=getH(o.x,o.z); if(h<WATER-0.8 && h<getH(ox,oz)){ o.x=ox; o.z=oz; } }
}
/* The vale's north wall (its crest is at z = HZ0) is climbable up to 14 m short of the crest from either side; the only way through is Frostgate
   Pass, and its ice wall stays shut until Akaoni falls (GEAR.north >= 1). In the pass you are kept between its walls near the crest. */
function frostWall(o,ox,oz,rad){
  if(oz===undefined) oz=o.z;
  const inC=Math.abs(o.x-PASS.x)<PASS.w-rad+0.2;
  if(Math.abs(o.z-HZ0)<14){
    if(!inC){ if(Math.abs(oz-HZ0)<14) o.x=clamp(o.x,PASS.x-PASS.w+rad,PASS.x+PASS.w-rad); else o.z=oz>=HZ0?HZ0+14:HZ0-14; }
  }
  if(!northOpen() && inC && oz>=PASS.ice && o.z<PASS.ice+0.8) o.z=PASS.ice+0.8;   // the ice wall
}
/* The glacier valley (shared/greyspine.js) is cut through the Vale Wall north of the home forest, at z = GLEN.z: the way between the Hoarfrost Reach and the
   Greyspine. Inside the cut you are kept between its walls near the crest, and an ice fall across it (x = GLEN.ice) stays shut until Ymrik falls (GEAR.west >= 1). */
function glenWall(o,ox,oz,rad){
  const cw=GLEN.w-rad, inNow=Math.abs(o.z-GLEN.z)<cw+0.2, was=oz!==undefined&&Math.abs(oz-GLEN.z)<cw+0.2;
  if(o.z<HZ0&&Math.abs(o.x-HALF)<14&&(inNow||was)) o.z=clamp(o.z,GLEN.z-cw,GLEN.z+cw);   // inside the cut near the crest: between its walls
  else if(o.x<HALF) o.x=Math.min(o.x,HALF-14); else o.x=clamp(o.x,HALF+14,WX1-14);      // anywhere else the Vale Wall holds
  if(!westOpen()&&o.z<HZ0&&ox>HALF&&o.x<GLEN.ice+0.8) o.x=GLEN.ice+0.8;                 // the ice fall (it shuts the Reach's whole west edge, so you cannot climb round it)
}
/* The home forest's north rim (its crest is at z = HZ0) walls it off from the Greyspine beyond it (shared/greyspine.js): climbable up to 14 m short of
   the crest from either side and no further. The side you are on is the one you were on before the move (oz), so a teleport into the Greyspine stays
   there. There is no way over the rim: the Greyspine is reached through the Hoarfrost Reach's west wall, a gate that is not built yet. */
function greyWall(o,oz){ if((oz===undefined?o.z:oz)<HZ0) o.z=Math.min(o.z,HZ0-14); else o.z=Math.max(o.z,HZ0+14); }
const inTunnelBore=(x,z)=>x>TUN.p0-1&&x<TUN.p1+1&&Math.abs(z-TUN.z)<TUN.w+0.5;
function updateCamera(dt){
  if(customizing){ editorCamera(dt); return; }
  if(thirdPerson){
    const pt=clamp(0.28-P.pitch*0.9,-0.25,1.25), dist=4.6;
    const hx=P.x, hy=P.y+1.45*hiker.scale, hz=P.z;
    let cx=hx+Math.sin(P.yaw)*Math.cos(pt)*dist, cz=hz+Math.cos(P.yaw)*Math.cos(pt)*dist;
    let cyy=Math.max(hy+Math.sin(pt)*dist, Math.max(getH(cx,cz),waterSurf(cx,cz))+0.45);
    if(P.inTun||inTunnelBore(P.x,P.z)){   // stay under the tunnel's roof and between its walls
      cz=TUN.z+clamp(cz-TUN.z,-(TUN.w-0.4),TUN.w-0.4); cx=clamp(cx,TUN.p0-8,TUN.p1+8);
      if(cx>TUN.p0-1&&cx<TUN.p1+1) cyy=Math.min(cyy,TUN.floor(cx)+TUN.roof-1.2);
    }
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

