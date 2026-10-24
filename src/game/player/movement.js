//@ Player movement (with a boss's ice, shoves and whirlpools), a slope limit, collisions (the border bridge with its barred gate; the shut gates are shared/barriers.js), the shore's knee-deep rule, camera
/* ---------- simulation ---------- */
var dashReq=false, dashT=0, dashCd=0, dashDx=0, dashDz=0;   // the dash (input.js sets dashReq)
function updatePlayer(dt){
  let f=0,s=0;
  if(kbHeld('fwd')) f+=1; if(kbHeld('back')) f-=1;
  if(kbHeld('right')) s+=1; if(kbHeld('left')) s-=1;
  f+=-joyY; s+=joyX;
  const len=Math.hypot(f,s); if(len>1){ f/=len; s/=len; }
  const wsf=waterSurf(P.x,P.z), inWater=getH(P.x,P.z)<wsf-0.35 && bridgeDeck(P.x,P.z)<wsf;   // (the sea's level, or a tarn's or the river's in the Greyspine)
  let speed=9.5*(1+(GEAR&&GEAR.skills?passiveSum(GEAR.skills,PL.level,'move',clsOf()):0)); if(inWater) speed*=0.5;   // sprint is the default pace; the Fleetfoot passive adds to it
  if(PFX.slow>0) speed*=0.5; if(PFX.root>0) speed=0;   // a boss's ice: frozen or slowed (combat/boss-fx.js)
  if(CB.act && (CB.act.kind==='slash'||CB.act.kind==='nova'||CB.act.kind==='shoot'||CB.act.kind==='volley')) speed*=0.45;
  const sy=Math.sin(P.yaw), cy=Math.cos(P.yaw);
  const tx=(-sy*f+cy*s)*speed, tz=(-cy*f-sy*s)*speed;
  const k=1-Math.exp(-(P.ground?10:2.5)*dt);
  P.vx+=(tx-P.vx)*k; P.vz+=(tz-P.vz)*k;
  if(dashCd>0) dashCd-=dt;
  if(dashReq){ dashReq=false;   // the dash key: a short burst along the move direction (or where the camera looks), then a cooldown
    if(dashCd<=0 && !PL.dead && PFX.root<=0 && !inWater){ const m=Math.hypot(tx,tz); dashDx=m>0.1?tx/m:-sy; dashDz=m>0.1?tz/m:-cy; dashT=0.2; dashCd=1.1; }
  }
  if(dashT>0){ dashT-=dt; P.vx=dashDx*24; P.vz=dashDz*24; }
  const ox=P.x, oz=P.z;
  P.x+=P.vx*dt; P.z+=P.vz*dt; pfxStep(dt);
  nearCols(P.x,P.z,(cx,cz,r)=>{ const dx=P.x-cx, dz=P.z-cz, d=Math.hypot(dx,dz), m=r+0.32; if(d<m && d>1e-4){ P.x=cx+dx/d*m; P.z=cz+dz/d*m; } });
  pushOutBoxes(P,0.32);
  for(const m of MONS){ if(m.dead||!m.g.visible) continue; const dx=P.x-m.x, dz=P.z-m.z, d=Math.hypot(dx,dz), mm=m.T.rad+0.32; if(d<mm && d>1e-4){ P.x=m.x+dx/d*mm; P.z=m.z+dz/d*mm; } }
  for(const n of NPCs){ if(n.inside) continue; const dx=P.x-n.x, dz=P.z-n.z, d=Math.hypot(dx,dz), m=0.62; if(d<m && d>1e-4){ P.x=n.x+dx/d*m; P.z=n.z+dz/d*m; } }
  worldBounds(P,ox,0.32,oz);
  if(!dgIn()&&!caveIn()) cvResolve(P,ox,oz,0.32,SLOPE_MAX);   // caves: walls and ledges of a cave's rock (shared/caves.js)
  if(P.ground&&!dgIn()&&!caveIn()) slopeBlock(ox,oz);   // too steep to climb: no way up (shared with the bridge's deck as ground)
  const gnd=Math.max(getH(P.x,P.z),wsf-1.15,bridgeDeck(P.x,P.z),cvGroundAt(P.x,P.z,P.y));   // the river bridge's deck is ground too; caves: so are an arch's top and a ledge (-Infinity away from a site)
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
/* Terrain steeper than SLOPE_MAX (rise over run: 1.2 is about 50 degrees) cannot be climbed: a move that would climb it is turned along the slope (20, 40 ... 80 degrees to
   the side that is flatter, shorter the more it turns, so you slide along a cliff face instead of sticking to it) and, if no turn works, dropped. Going down is always allowed.
   Only on the ground (a jump clears nothing: it is 1.5 m) and outside dungeons. */
const SLOPE_MAX=1.2;
function slopeBlock(ox,oz){
  const dx=P.x-ox, dz=P.z-oz, d=Math.hypot(dx,dz); if(d<1e-4||d>4) return;   // (a teleport or a respawn is not a step)
  const g0=Math.max(getH(ox,oz),bridgeDeck(ox,oz)), up=(x,z)=>(Math.max(getH(x,z),bridgeDeck(x,z))-g0)/Math.hypot(x-ox,z-oz);
  if(up(P.x,P.z)<=SLOPE_MAX) return;
  for(const a of [0.35,0.7,1.05,1.4]){
    const c=Math.cos(a), s=Math.sin(a); let best=null, bu=SLOPE_MAX;
    for(const sg of [1,-1]){ const rx=(dx*c-sg*dz*s)*c, rz=(sg*dx*s+dz*c)*c, u=up(ox+rx,oz+rz); if(u<=bu){ bu=u; best=[rx,rz,sg]; } }
    if(best){ P.x=ox+best[0]; P.z=oz+best[1]; const vx=P.vx, vz=P.vz, sg=best[2]; P.vx=(vx*c-sg*vz*s)*c; P.vz=(sg*vx*s+vz*c)*c; return; }
  }
  P.x=ox; P.z=oz; P.vx=0; P.vz=0;
}
/* Barriers: shared/barriers.js (barStep) holds every gate that is still shut: the bridge's door, Frostgate Pass's ice wall, the glacier valley's ice fall, the Sunscar's and the neck pass's rock falls and the
   borders behind them. Once a land is open (for you) nothing but its ground, its water and the slope limit holds you: no clamp of an open land remains here. Left: the bridge's parapets (o.inTun, set when you
   step onto the deck from either end, a mesh you can see), the knee-deep rule of the sea's shore (you wade in to the knees, no deeper: oz is the z before the move), the Proving Isle's lake, and the world's edge. */
const valeOpen=()=>!!(GEAR&&GEAR.east>=1);
const northOpen=()=>!!(GEAR&&GEAR.north>=1);
const westOpen=()=>!!(GEAR&&GEAR.west>=1);
function worldBounds(o,ox,rad,oz){
  if(caveIn()){ caveBounds(o,ox,rad,oz); return; }   // cave: a floor's walls instead of the world's edges (cave/collide.js)
  if(dgIn()){ dgBounds(o,ox,rad,oz); return; }   // dungeons: a run's walls instead of the world's edges (dungeon/collide.js)
  const T=TUN, dz=o.z-T.z, bore=Math.abs(dz)<T.w-rad+0.2, e0=T.p0-0.6, e1=T.p1+0.6;
  if(!o.inTun && bore && ((ox<=e0 && o.x>e0 && valeOpen()) || (ox>=e1 && o.x<e1))) o.inTun=true;
  if(o.inTun){
    if(o.x<e0-0.3||o.x>e1+0.3) o.inTun=false;
    else o.z=T.z+clamp(dz,-(T.w-rad),T.w-rad);
  }
  o.z=clamp(o.z,WZ0+14,WZ1-14); o.x=clamp(o.x,WX0+14,WX1-14);   // the one clamp that stays: the world's edge, far offshore
  if(!o.inTun) barStep(o,ox,oz===undefined?o.z:oz,GEAR||BAR_NONE);   // the gates that are still shut (shared/barriers.js)
  if(oz!==undefined && coastDist(o.x,o.z)<34 && bridgeDeck(o.x,o.z)<WATER){ const h=getH(o.x,o.z); if(h<WATER-0.8 && h<getH(ox,oz)){ o.x=ox; o.z=oz; } }
  pvWall(o,ox,oz);   // pvp: the Proving Isle's lake is a wall too, and its gate stays shut after a knock-out (game/pvp/state.js)
}
const inTunnelBore=(x,z)=>x>TUN.p0-1&&x<TUN.p1+1&&Math.abs(z-TUN.z)<TUN.w+0.5;   // (on the border bridge: the name stays from the tunnel it replaced)
function updateCamera(dt){
  if(customizing){ editorCamera(dt); return; }
  if(thirdPerson){
    const pt=clamp(0.28-P.pitch*0.9,-0.25,1.25), dist=4.6;
    const hx=P.x, hy=P.y+1.45*hiker.scale, hz=P.z;
    let cx=hx+Math.sin(P.yaw)*Math.cos(pt)*dist, cz=hz+Math.cos(P.yaw)*Math.cos(pt)*dist;
    let cyy=Math.max(hy+Math.sin(pt)*dist, Math.max(getH(cx,cz),waterSurf(cx,cz),bridgeDeck(cx,cz))+0.45);   // (above the river bridge's deck too)
    if(caveIn()){ const b=caveCamBoom(hx,hy,hz,cx,cyy,cz); cx=b[0]; cyy=b[1]; cz=b[2]; }   // cave: the arm shortens in front of rock and stays under the ceiling (cave/collide.js)
    else if(dgIn()){ const b=dgCamBoom(hx,hy,hz,cx,cyy,cz); cx=b[0]; cyy=b[1]; cz=b[2]; }
    else { const b=cvCamBoom(hx,hy,hz,cx,cyy,cz); cx=b[0]; cyy=b[1]; cz=b[2]; }   // caves: the camera's arm stops short of the rock   // dungeons: the camera's arm shortens in front of a run's walls (dungeon/collide.js)
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

