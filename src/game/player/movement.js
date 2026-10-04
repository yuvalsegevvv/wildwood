//@ Player movement (with a boss's ice, shoves and whirlpools), a slope limit, collisions (the border river and its bridge with the barred gate, the vale's north wall with Frostgate Pass and its ice wall, the home forest's north rim above the Greyspine), camera
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
  if(P.ground&&!dgIn()) slopeBlock(ox,oz);   // too steep to climb: no way up (shared with the bridge's deck as ground)
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
/* Terrain steeper than SLOPE_MAX (rise over run: 1.2 is about 50 degrees) cannot be climbed: a move that would climb it is dropped, tried again along each axis alone so you
   slide along the slope, and otherwise stops you. Going down is always allowed. Only on the ground (a jump clears nothing: it is 1.5 m) and outside dungeons. */
const SLOPE_MAX=1.2;
function slopeBlock(ox,oz){
  const d=Math.hypot(P.x-ox,P.z-oz); if(d<1e-4||d>4) return;   // (a teleport or a respawn is not a step)
  const g0=Math.max(getH(ox,oz),bridgeDeck(ox,oz)), up=(x,z)=>(Math.max(getH(x,z),bridgeDeck(x,z))-g0)/Math.hypot(x-ox,z-oz);
  if(up(P.x,P.z)<=SLOPE_MAX) return;
  const nx=P.x, nz=P.z;
  if(Math.abs(nx-ox)>1e-4&&up(nx,oz)<=SLOPE_MAX){ P.x=nx; P.z=oz; P.vz*=0.3; return; }
  if(Math.abs(nz-oz)>1e-4&&up(ox,nz)<=SLOPE_MAX){ P.x=ox; P.z=nz; P.vx*=0.3; return; }
  P.x=ox; P.z=oz; P.vx=0; P.vz=0;
}
/* The home forest and the vale are walled off by the Greyfall River (too deep to wade: no deeper than the knees); the only way across is the bridge at z = TUN.z. On it you are
   kept between its parapets; its west gate stays barred until the Rootwarden falls (GEAR.east >= 1). o.inTun is set when you step onto the deck from either end.
   Once a land is open (for you) nothing but its ground, its water and the slope limit holds you: the clamps below act only while the land beyond is still locked.
   On the Crownsea's shore you can wade in to the knees (ground above WATER-0.8), no deeper (oz: the z before the move). */
const valeOpen=()=>!!(GEAR&&GEAR.east>=1);
const northOpen=()=>!!(GEAR&&GEAR.north>=1);
const westOpen=()=>!!(GEAR&&GEAR.west>=1);
function worldBounds(o,ox,rad,oz){
  if(dgIn()){ dgBounds(o,ox,rad,oz); return; }   // dungeons: a run's walls instead of the world's edges (dungeon/collide.js)
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
  if(o.x<borderX(o.z)){ greyWall(o,oz); for(const G of GREY_GATES) if(!gateOpen(G)&&o.z<borderZ(o.x)&&Math.abs(o.z-G.z)<40&&ox>=G.x&&o.x<G.x+0.8) o.x=G.x+0.8; }   // (the rock falls in the Greyspine's west wall)
  else frostWall(o,ox,oz,rad);
  if(oz!==undefined && coastDist(o.x,o.z)<34 && bridgeDeck(o.x,o.z)<WATER){ const h=getH(o.x,o.z); if(h<WATER-0.8 && h<getH(ox,oz)){ o.x=ox; o.z=oz; } }
  if(oz!==undefined && riverK(o.z)>0.15 && bridgeDeck(o.x,o.z)<WATER){ const h=getH(o.x,o.z); if(h<WATER-0.8 && h<getH(ox,oz)){ o.x=ox; o.z=oz; } }   // the border river (shared/terrain.js): wade to the knees, no deeper, so the water is a wall too
}
/* The vale's north wall (its crest line is z = borderZ(x), HZ0 at the pass) is climbable up to 14 m short of the crest from either side while the Reach is locked; the only way
   through is Frostgate Pass, and its ice wall stays shut until Akaoni falls (GEAR.north >= 1). In the pass you are kept between its walls near the crest. Once the Reach is open
   nothing but the ground holds you (slopeBlock). */
function frostWall(o,ox,oz,rad){
  if(oz===undefined) oz=o.z;
  const inC=Math.abs(o.x-PASS.x)<PASS.w-rad+0.2, bz=borderZ(o.x);
  if(!northOpen()&&Math.abs(o.z-bz)<14){
    if(!inC){ if(Math.abs(oz-bz)<14) o.x=clamp(o.x,PASS.x-PASS.w+rad,PASS.x+PASS.w-rad); else o.z=oz>=bz?bz+14:bz-14; }
  }
  if(!northOpen() && inC && oz>=PASS.ice && o.z<PASS.ice+0.8) o.z=PASS.ice+0.8;   // the ice wall
}
/* The glacier valley (shared/greyspine.js) is cut through the Vale Wall north of the home forest, at z = GLEN.z: the way between the Hoarfrost Reach and the
   Greyspine. Inside the cut you are kept between its walls near the crest, and an ice fall across it (x = GLEN.ice) stays shut until Ymrik falls (GEAR.west >= 1). */
function glenWall(o,ox,oz,rad){
  const cw=GLEN.w-rad, inNow=Math.abs(o.z-GLEN.z)<cw+0.2, was=oz!==undefined&&Math.abs(oz-GLEN.z)<cw+0.2;
  const bx=borderX(o.z);   // (the crest line wanders; it is straight at the cut)
  const free=o.z<borderZ(o.x)?westOpen():valeOpen();   // the land beyond is open (for you): nothing but the ground and the water holds you (slopeBlock, the river's depth)
  if(!free){
    if(o.z<borderZ(o.x)&&Math.abs(o.x-bx)<14&&(inNow||was)) o.z=clamp(o.z,GLEN.z-cw,GLEN.z+cw);   // inside the cut near the crest: between its walls
    else if(o.x<bx) o.x=Math.min(o.x,bx-14); else o.x=clamp(o.x,bx+14,WX1-14);      // anywhere else the Vale Wall holds
  }
  if(!westOpen()&&o.z<borderZ(o.x)&&ox>borderX(oz===undefined?o.z:oz)&&o.x<GLEN.ice+0.8) o.x=GLEN.ice+0.8;                 // the ice fall (it shuts the Reach's whole west edge, so you cannot climb round it)
}
/* The home forest's north rim (its crest is at z = HZ0) walls it off from the Greyspine beyond it (shared/greyspine.js): climbable up to 14 m short of
   the crest from either side and no further. The side you are on is the one you were on before the move (oz), so a teleport into the Greyspine stays
   there. There is no way over the rim: the Greyspine is reached through the Hoarfrost Reach's west wall, a gate that is not built yet. */
function greyWall(o,oz){ if(westOpen()) return; const bz=borderZ(o.x); if((oz===undefined?o.z:oz)<bz) o.z=Math.min(o.z,bz-14); else o.z=Math.max(o.z,bz+14); }
const inTunnelBore=(x,z)=>x>TUN.p0-1&&x<TUN.p1+1&&Math.abs(z-TUN.z)<TUN.w+0.5;   // (on the border bridge: the name stays from the tunnel it replaced)
function updateCamera(dt){
  if(customizing){ editorCamera(dt); return; }
  if(thirdPerson){
    const pt=clamp(0.28-P.pitch*0.9,-0.25,1.25), dist=4.6;
    const hx=P.x, hy=P.y+1.45*hiker.scale, hz=P.z;
    let cx=hx+Math.sin(P.yaw)*Math.cos(pt)*dist, cz=hz+Math.cos(P.yaw)*Math.cos(pt)*dist;
    let cyy=Math.max(hy+Math.sin(pt)*dist, Math.max(getH(cx,cz),waterSurf(cx,cz),bridgeDeck(cx,cz))+0.45);   // (above the river bridge's deck too)
    if(dgIn()){ const b=dgCamBoom(hx,hy,hz,cx,cyy,cz); cx=b[0]; cyy=b[1]; cz=b[2]; }   // dungeons: the camera's arm shortens in front of a run's walls (dungeon/collide.js)
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

