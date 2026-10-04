//@ Chamois: small harmless herds of mountain goats on the Greyspine's alpine slopes (client-only dressing, built the first time you stand in the Greyspine; they graze, look up and bolt from you)
/* Agent map: exports CHAM (state), CHAM_KIND (speeds, legs), chamoisOK (where one may stand), chamoisUpdate(dt) (called every frame from game/main/loop.js; a no-op outside the
   Greyspine, builds its meshes on the first frame inside it). Uses the helpers of animals.js (col, sph, baseM, partM, animMesh, matAnimal, GAIT, cream, ZERO).
   Like the deer they are not synced: every player sees his own herds, and nothing can hit or hunt them. The Greyspine's hostile goat-like monster is the Ibex Ram (zone g30);
   these are named chamois so the two are not mixed up, and they are smaller, tan, with short black hooks for horns. Hook: loop.js "// chamois:". Test: tools/client-smoke.js. */
const CHAM_KIND={walk:1.1, run:9.5, flee:16, alert:30, stride:3.4, legY:0.6, legs:[[-0.12,-0.34],[0.12,-0.34],[-0.12,0.34],[0.12,0.34]], graze:-1.45};
const CHAM_HERDS=LITE?2:3, CHAM_MAX=5;   // herds and goats per herd at most (the meshes are sized for the most)
const CHAM={ready:false, shown:false, list:[], herds:[], mT:null, mH:null, mL:null};
// where a chamois may stand: the high slopes and meadows above the trees (steep is fine: they climb), not the water, Highmark, the boss arenas or the glacier valley
function chamoisOK(x,z){
  if(!inGrey(x,z)||x<WX0+40||z<WZ0+40||z>borderZ(x)-90||x>borderX(z)-30) return false;
  const h=getH(x,z); if(h<88||h>205||grad(x,z)>1.15) return false;
  return !greyWet(x,z,-1)&&vDist(x,z)>VIL4.r+30&&Math.hypot(x-ARENA29.x,z-ARENA29.z)>55&&Math.hypot(x-ARENA32.x,z-ARENA32.z)>55&&!inGlen(x,z,12);
}
function chamoisSpot(cx,cz,rmin,rmax){
  for(let i=0;i<40;i++){ const a=AR(0,TAU), r=AR(rmin,rmax), x=cx+Math.sin(a)*r, z=cz+Math.cos(a)*r; if(chamoisOK(x,z)) return [x,z]; }
  return null;
}
function chamoisSeg(a,b,r0,r1,hex){   // a tapering cylinder from point a to point b (the horns)
  const d=new THREE.Vector3().subVectors(b,a), L=d.length(), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  const g=cyl(r1,r0,L,5).translate(0,L/2,0).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)).translate(a.x,a.y,a.z);
  return col(g,hex);
}
function chamoisGeos(){   // facing -z, feet at y=0; the head turns about the withers (0,0.84,-0.38)
  const tan=0xa98e66, dark=0x2e2620, V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const torso=merge([
    col(sph(0.3,12,8).scale(0.7,0.8,1.55).translate(0,0.68,0),tan,(x,y,z,c)=>{ if(y<0.55) c.lerp(cream,0.7); if(y>0.88&&Math.abs(x)<0.07) c.set(dark); }),   // pale belly, a dark stripe down the spine
    col(sph(0.11,8,6).scale(1,1,0.8).translate(0,0.72,0.42),0xe8dfd0),                                                                                         // the pale rump
    col(new THREE.ConeGeometry(0.03,0.1,5).rotateX(2.4).translate(0,0.86,0.52),dark)                                                                          // a stub of a tail
  ]);
  const head=[
    col(cyl(0.065,0.1,0.32,7).rotateX(-0.7).translate(0,0.13,-0.1),0x8c7452),
    col(sph(0.115,10,8).scale(0.85,0.9,1.5).translate(0,0.3,-0.3),0xece4d4,(x,y,z,c)=>{ if(Math.abs(y-0.315)<0.035&&Math.abs(x)>0.05) c.set(dark); }),   // a pale face with the dark stripe through the eye
    col(sph(0.06,8,6).scale(0.9,0.8,1.2).translate(0,0.25,-0.46),0x2a2420),
    col(new THREE.ConeGeometry(0.04,0.14,5).rotateZ(1.25).translate(-0.12,0.4,-0.24),0x8c7452),
    col(new THREE.ConeGeometry(0.04,0.14,5).rotateZ(-1.25).translate(0.12,0.4,-0.24),0x8c7452)
  ];
  for(const sd of [-1,1]){   // the horns: straight up, then hooked back
    head.push(chamoisSeg(V(sd*0.045,0.4,-0.3),V(sd*0.055,0.6,-0.31),0.03,0.02,dark));
    head.push(chamoisSeg(V(sd*0.055,0.6,-0.31),V(sd*0.06,0.62,-0.2),0.02,0.009,dark));
  }
  const leg=col(cyl(0.062,0.04,0.6,6).translate(0,-0.3,0),0x7a6446,(x,y,z,c)=>{ if(y<-0.52) c.set(dark); else if(y<-0.26) c.lerp(cream,0.5); });
  return {torso,head:merge(head),leg};
}
function chamoisBuild(){
  const G=chamoisGeos(), C=CHAM;
  for(let h=0;h<CHAM_HERDS;h++){
    const herd={on:false,wait:0,cx:0,cz:0,list:[]}, n=3+Math.floor(Math.random()*(CHAM_MAX-2));
    for(let k=0;k<n;k++){
      const kid=k===n-1&&Math.random()<0.5, a={herd,x:0,z:0,y:0,heading:AR(0,TAU),goal:0,speed:0,state:'idle',timer:AR(0,3),phase:AR(0,TAU),ph0:AR(0,TAU),hp:0,hy:0,pitch:0,s:kid?AR(0.6,0.7):AR(0.92,1.08)};
      herd.list.push(a); C.list.push(a);
    }
    C.herds.push(herd);
  }
  C.mT=animMesh(G.torso,matAnimal,C.list.length,true); C.mH=animMesh(G.head,matAnimal,C.list.length,true); C.mL=animMesh(G.leg,matAnimal,C.list.length*4,true);
  C.ready=true;
}
function chamoisPlace(herd,dt){   // put a herd on the slopes 50-110 m from you (when it is lost behind you, or at the start)
  herd.wait-=dt; if(herd.wait>0) return;
  herd.wait=1.5;   // looking for ground costs a few height samples a try: not every frame
  const base=chamoisSpot(P.x,P.z,50,110); if(!base) return;
  for(const a of herd.list){ const p=chamoisSpot(base[0],base[1],0,7)||base; a.x=p[0]; a.z=p[1]; a.y=getH(a.x,a.z); a.state='idle'; a.timer=AR(0,2); a.speed=0; }
  herd.on=true;
}
function chamoisPick(a){
  const r=Math.random();
  if(r<0.5){ a.state='graze'; a.timer=AR(4,9); }
  else if(r<0.85){ a.state='walk'; a.timer=AR(3,7); a.goal=a.heading+AR(-1.2,1.2); }
  else { a.state='idle'; a.timer=AR(2,4); }
  if(a.state==='walk'){ const hx=a.herd.cx-a.x, hz=a.herd.cz-a.z; if(Math.hypot(hx,hz)>8) a.goal=Math.atan2(-hx,-hz); }   // stay with the herd
}
function chamoisStep(a,dt){
  const K=CHAM_KIND, dx=a.x-P.x, dz=a.z-P.z, d=Math.hypot(dx,dz)||1;
  a.timer-=dt;
  if(d<K.flee*(a.s<0.8?1.2:1)){ a.state='flee'; a.timer=AR(2,3.5); }
  if(a.state==='flee'){ a.goal=Math.atan2(-dx,-dz); if(a.timer<=0){ a.state='idle'; a.timer=AR(1,3); } }   // straight away from you
  else if(d<K.alert){ if(a.state!=='alert'){ a.state='alert'; a.timer=AR(2,5); } }
  else if(a.timer<=0) chamoisPick(a);
  const moving=a.state==='walk'||a.state==='flee';
  if(moving&&!chamoisOK(a.x-Math.sin(a.heading)*2,a.z-Math.cos(a.heading)*2)) a.goal=a.heading+Math.PI*AR(0.7,1.3);   // turn back at water, a cliff or an arena
  a.speed+=((a.state==='walk'?K.walk:a.state==='flee'?K.run:0)-a.speed)*Math.min(1,dt*(a.state==='flee'?5:3));
  if(moving){ const rate=(a.state==='flee'?5:2)*dt; a.heading+=clamp(angDiff(a.goal,a.heading),-rate,rate); }
  const px=a.x, pz=a.z;
  a.x-=Math.sin(a.heading)*a.speed*dt; a.z-=Math.cos(a.heading)*a.speed*dt;
  if(moving&&!chamoisOK(a.x,a.z)){ a.x=px; a.z=pz; a.heading+=Math.PI*AR(0.6,1.4); a.goal=a.heading; }   // never off the allowed ground, whatever the look-ahead missed
  a.y=getH(a.x,a.z);
  const l=0.6*a.s, hf=getH(a.x-Math.sin(a.heading)*l,a.z-Math.cos(a.heading)*l), hb=getH(a.x+Math.sin(a.heading)*l,a.z+Math.cos(a.heading)*l);
  a.pitch=clamp(Math.atan2(hf-hb,2*l),-0.8,0.8);
  a.phase+=a.speed*dt*K.stride;
  let hp=-0.2, hy=0;
  if(a.state==='graze') hp=K.graze+Math.sin(t*3+a.ph0)*0.05;
  else if(a.state==='alert'){ hp=0.18; hy=clamp(angDiff(Math.atan2(dx,dz),a.heading),-1.1,1.1); }
  else if(a.state==='idle'){ hp=0.05; hy=Math.sin(t*0.6+a.ph0)*0.6; }
  else if(a.state==='flee') hp=0.05;
  a.hp+=(hp-a.hp)*Math.min(1,dt*4); a.hy+=(hy-a.hy)*Math.min(1,dt*4);
}
function chamoisUpdate(dt){
  const C=CHAM, here=started&&inGrey(P.x,P.z);
  if(!here&&!C.shown) return;   // nothing built, nothing to hide: costs nothing outside the Greyspine
  if(here&&!C.ready) chamoisBuild();
  if(!here){ C.list.forEach((a,i)=>{ C.mT.setMatrixAt(i,ZERO); C.mH.setMatrixAt(i,ZERO); for(let k=0;k<4;k++) C.mL.setMatrixAt(i*4+k,ZERO); a.herd.on=false; }); C.shown=false; for(const m of [C.mT,C.mH,C.mL]) m.instanceMatrix.needsUpdate=true; return; }
  C.shown=true;
  for(const h of C.herds){
    if(h.on){ h.cx=0; h.cz=0; for(const a of h.list){ h.cx+=a.x; h.cz+=a.z; } h.cx/=h.list.length; h.cz/=h.list.length; if(Math.hypot(h.cx-P.x,h.cz-P.z)>150) h.on=false; }
    if(!h.on) chamoisPlace(h,dt);
  }
  C.list.forEach((a,i)=>{
    if(!a.herd.on){ C.mT.setMatrixAt(i,ZERO); C.mH.setMatrixAt(i,ZERO); for(let k=0;k<4;k++) C.mL.setMatrixAt(i*4+k,ZERO); return; }
    chamoisStep(a,dt);
    baseM(_am,a.x,a.y,a.z,a.heading,a.pitch,0,a.s); C.mT.setMatrixAt(i,_am);
    partM(_bm,_am,0,0.84,-0.38,a.hp,a.hy,0); C.mH.setMatrixAt(i,_bm);
    const amp=Math.min(a.speed/CHAM_KIND.walk,1)*0.45+(a.state==='flee'?0.3:0);
    CHAM_KIND.legs.forEach((lg,k)=>{ partM(_bm,_am,lg[0],CHAM_KIND.legY,lg[1],Math.sin(a.phase+GAIT[k])*amp,0,0); C.mL.setMatrixAt(i*4+k,_bm); });
  });
  for(const m of [C.mT,C.mH,C.mL]) m.instanceMatrix.needsUpdate=true;
}
