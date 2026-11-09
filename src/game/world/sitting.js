//@ Sitting: the sit key (.) or /sit sits you on the nearest bench or on the ground; wild benches along the roads; looks only
/* Agent map. SIT.on is 0 standing, 1 on the ground, 2 on a bench; others see it through the 10th field of the player rows (server/sitting.js, net/remote.js) and poseRig's `sit`.
   buildWildBenches() (called after buildLoreProps in generation-setup.js) puts a bench beside the main and boss roads about every WB_STEP metres, off water, off steep ground and
   away from the villages; SIT_SPOTS holds those and the villages' own benches (VIL*.benches). sitUpdate() (loop.js) stands you up on any move, jump, attack, hit or knock-out.
   Test: tools/sitting-smoke.js */
var SIT={on:0};
const SIT_SPOTS=[], WB_STEP=260, WB_OFF=4.2;
function buildWildBenches(){
  const vils=[VIL,typeof VIL2!=='undefined'&&VIL2,typeof VIL3!=='undefined'&&VIL3,typeof VIL4!=='undefined'&&VIL4,typeof VIL5!=='undefined'&&VIL5,typeof VIL6!=='undefined'&&VIL6,typeof VIL7!=='undefined'&&VIL7,typeof VIL8!=='undefined'&&VIL8].filter(Boolean);
  for(const V of vils) for(const b of (V.benches||[])) SIT_SPOTS.push({x:b.x,z:b.z,rot:b.rot});
  const out=[], wood=0x6e4c2e, dark=0x4e3622;
  const part=(g,col,x,y,z,yaw)=>{ g.rotateY(yaw).translate(x,y,z); out.push(paint(g,(px,py,pz,nx,ny,nz,c)=>c.set(col).multiplyScalar(0.86+h3(x+px*3,y+py*3,z+pz*3)*0.26))); };
  let n=0;
  for(const rd of ROADS){
    if(rd.kind==='trail'||rd.name==='The Proving Road') continue;
    let acc=WB_STEP*0.5;
    for(let i=1;i<rd.pts.length;i++){
      const [ax,az]=rd.pts[i-1], [bx,bz]=rd.pts[i], L=Math.hypot(bx-ax,bz-az); if(L<1e-3) continue;
      const ux=(bx-ax)/L, uz=(bz-az)/L;
      for(let d=0;d<L;d+=2){
        acc+=2; if(acc<WB_STEP) continue;
        const side=(n%2?1:-1), x=ax+ux*d-uz*WB_OFF*side, z=az+uz*d+ux*WB_OFF*side;
        if(x<WX0+30||x>WX1-30||z<WZ0+30||z>WZ1-30) continue;
        if(rdWet(x,z)||waIsSea(x,z)) continue;
        if(vils.some(V=>Math.hypot(V.x-x,V.z-z)>0&&Math.hypot(V.x-x,V.z-z)<60)) continue;
        const y=getH(x,z); if(y<WATER+0.6) continue;
        const hs=[getH(x+1,z),getH(x-1,z),getH(x,z+1),getH(x,z-1)]; if(Math.max(...hs)-Math.min(...hs)>0.7) continue;
        if(roadDist(x,z)<2.4) continue;
        const rot=Math.atan2(-uz*side,ux*side);   // the sitter's face is rot (see sitToggle): they look at the road, the backrest is on the local +z side behind them
        acc=0; n++;
        const sx=Math.sin(rot), cz=Math.cos(rot), at=(lx,lz)=>[x+lx*cz+lz*sx, z-lx*sx+lz*cz];
        part(new THREE.BoxGeometry(1.7,0.12,0.5),wood,x,y+0.5,z,rot);
        for(const s of [-1,1]){ const [px,pz]=at(s*0.7,0); part(new THREE.BoxGeometry(0.14,0.5,0.4),dark,px,y+0.25,pz,rot); }
        part(new THREE.BoxGeometry(1.7,0.4,0.08),wood,...(()=>{ const [px,pz]=at(0,0.22); return [px,y+0.82,pz]; })(),rot);
        SIT_SPOTS.push({x,z,rot});
      }
    }
  }
  if(out.length){ const m=new THREE.Mesh(merge(out),new THREE.MeshLambertMaterial({vertexColors:true})); m.castShadow=true; m.receiveShadow=true; m.matrixAutoUpdate=false; scene.add(m); }
}
function sitSpotNear(){
  let best=null, bd=2.6*2.6;
  for(const s of SIT_SPOTS){ const d=(s.x-P.x)**2+(s.z-P.z)**2; if(d<bd){ bd=d; best=s; } }
  return best;
}
function sitSet(on){
  if(SIT.on===on) return; SIT.on=on; netSend({t:'sit',s:on});
}
function sitToggle(){
  if(SIT.on){ sitSet(0); return; }
  if(!started||customizing||PL.dead||P.vy>0.5||!P.ground||(typeof dgIn==='function'&&dgIn())||(typeof caveIn==='function'&&caveIn())) return;
  const s=sitSpotNear();
  if(s){ P.x=s.x; P.z=s.z; P.y=getH(s.x,s.z); P.vx=P.vz=0; P.face=s.rot; sitSet(2); }   // a model looks along (-sin face, -cos face): face = rot looks against rot's own direction, i.e. at the road from a wild bench (its backrest is on the +rot side) and at the fire from a log bench
  else { P.vx=P.vz=0; sitSet(1); }
}
function sitUpdate(){
  if(!SIT.on) return;
  if(!started||customizing||PL.dead||!P.ground||kbHeld('fwd')||kbHeld('back')||kbHeld('left')||kbHeld('right')||joyX||joyY||CB.act){ sitSet(0); }
}
addEventListener('keydown',e=>{ if(started&&!e.repeat&&kbIs(e.code,'sit')&&!CHAT.open) sitToggle(); });
