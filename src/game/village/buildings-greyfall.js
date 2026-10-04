//@ The Greyfall, the waterfall that gives the border river its birth: a tarn on the home forest's north rim, a streaked sheet of water over the chute (shared/terrain.js, fallProfile), foam and spray at the plunge pool, and its roar
/* Agent map: exports GF (state), buildGreyfall() (called from generation-setup.js after buildGreyspine) and updateGreyfall(dt) (every frame from game/main/loop.js).
   The shape comes from shared/terrain.js (FALL, fallProfile, fallCut: the terrain already holds the slot, the tarn's bowl and the pool); this file only draws water over it:
   - the tarn: a disc of the shared water material at FALL.tl (waterSurf in shared/greyspine.js says the same level for wading and the map),
   - the sheet: a ribbon over the chute's floor, 10-14 m wide, a canvas texture of white streaks that runs down it (texture.offset.y falls with time),
   - the base: a foam ring that breathes and a cloud of soft spray points that rise from the pool (fewer on phones; nothing is updated more than 320 m away),
   - the roar: two noise loops (a hiss and a low rumble) whose volume follows the distance to the pool (audible from about 420 m), none in a dungeon.
   Test: tools/client-smoke.js (the mesh, its place, the sound's reach) and tools/greyfall-smoke.js (the shape). Names: GF, gf... */
const GF={built:false,sheet:null,tex:null,foam:null,spray:null,sprayPos:null,sprayLife:null,snd:null,t:0,base:null};
function gfStreakTex(){   // white streaks on a pale blue, longer than wide: the sheet's water
  const c=document.createElement('canvas'); c.width=64; c.height=256; const x=c.getContext('2d');
  x.fillStyle='#bfe0ee'; x.fillRect(0,0,64,256);
  for(let i=0;i<46;i++){ const px=Math.random()*64, w=1+Math.random()*3.2, y0=Math.random()*256, len=40+Math.random()*150, a=0.25+Math.random()*0.6;
    const g=x.createLinearGradient(0,y0,0,y0+len); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.3,'rgba(255,255,255,'+a+')'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.fillRect(px,y0,w,len); x.fillRect(px,y0-256,w,len); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
function gfDiscTex(){   // a soft round puff for the spray
  const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,0.9)'); g.addColorStop(0.5,'rgba(235,246,255,0.35)'); g.addColorStop(1,'rgba(235,246,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
function buildGreyfall(){
  if(GF.built) return; GF.built=true;
  const P=fallProfile();
  { const m=new THREE.Mesh(new THREE.CircleGeometry(FALL.tr*1.08,28).rotateX(-Math.PI/2),waterMat); m.position.set(FALL.tx,FALL.tl,FALL.tz); m.receiveShadow=true; scene.add(m); }   // the tarn
  { const pos=[], uv=[], idx=[]; let v=0;   // the sheet: a ribbon of two vertices a row, over the chute's floor
    for(let i=0;i<P.length;i++){
      const z=P[i][0], y=P[i][1]+0.3, hw=4.6+Math.min(3,Math.max(0,(z-FALL.lipZ)/22))+Math.sin(z*0.31)*0.5;
      if(i>0) v+=Math.hypot(2,P[i][1]-P[i-1][1])/9;
      pos.push(FALL.x-hw,y,z,FALL.x+hw,y,z); uv.push(0,v,1,v); if(i>0){ const k=i*2; idx.push(k-2,k,k-1,k-1,k,k+1); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    GF.tex=gfStreakTex();
    const mat=new THREE.MeshBasicMaterial({map:GF.tex,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide});
    GF.sheet=new THREE.Mesh(g,mat); GF.sheet.frustumCulled=false; scene.add(GF.sheet); }
  GF.base={x:FALL.x,z:FALL.pool.z+4,r:FALL.pool.r};
  { const t=gfDiscTex(), m=new THREE.Mesh(new THREE.CircleGeometry(15,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:0.5,depthWrite:false}));
    m.position.set(GF.base.x,0.12,GF.base.z); GF.foam=m; scene.add(m);   // the foam where it lands
    const N=LITE?50:(LOW?90:150), pp=new Float32Array(N*3); GF.sprayLife=new Float32Array(N); GF.sprayPos=pp;
    for(let i=0;i<N;i++){ GF.sprayLife[i]=Math.random()*3; gfSprayReset(i); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pp,3));
    GF.spray=new THREE.Points(g,new THREE.PointsMaterial({size:7,map:t,color:0xeaf6ff,transparent:true,opacity:0.32,depthWrite:false,sizeAttenuation:true}));
    GF.spray.frustumCulled=false; scene.add(GF.spray); }
}
function gfSprayReset(i){ const a=Math.random()*TAU, r=2+Math.random()*9; GF.sprayPos[i*3]=GF.base.x+Math.sin(a)*r; GF.sprayPos[i*3+1]=0.4+Math.random()*1.5; GF.sprayPos[i*3+2]=GF.base.z+Math.cos(a)*r; GF.sprayLife[i]=2+Math.random()*3; }
function updateGreyfall(dt){
  if(!GF.built) return;
  const dx=camera.position.x-GF.base.x, dz=camera.position.z-GF.base.z, d=Math.hypot(dx,dz), inDg=dgIn(), near=d<650&&!inDg;
  GF.sheet.visible=near; GF.foam.visible=near&&d<340; GF.spray.visible=near&&d<340;
  if(near){
    GF.t+=dt; GF.tex.offset.y-=dt*1.1;
    const k=0.4+0.6*(1-clamp(envCur.night));   // (a pale sheet by night, not a lamp)
    GF.sheet.material.color.setScalar(k); GF.foam.material.opacity=(0.4+0.12*Math.sin(GF.t*2.1))*k; GF.spray.material.opacity=0.32*k;
    if(GF.spray.visible){ const pp=GF.sprayPos, L=GF.sprayLife;
      for(let i=0;i<L.length;i++){ L[i]-=dt; if(L[i]<=0){ gfSprayReset(i); continue; } pp[i*3]+=Math.sin(i*7.3+GF.t*0.4)*1.1*dt; pp[i*3+1]+=(2.2+Math.sin(i*3.1)*0.8)*dt; pp[i*3+2]+=Math.cos(i*5.9+GF.t*0.3)*1.1*dt; }
      GF.spray.geometry.attributes.position.needsUpdate=true; } }
  // the roar: audible from about 420 m, loud at the pool
  if(!SND.ready) return;
  if(!GF.snd){ if(d>430||inDg) return; GF.snd={hiss:noiseLoop('lowpass',1500,0.5,'ambient'),rumble:noiseLoop('lowpass',190,0.6,'ambient')}; }
  const tc=SND.ctx.currentTime, a=inDg?0:Math.pow(1-clamp((d-40)/380),2);
  GF.snd.hiss.g.gain.setTargetAtTime(0.1*a,tc,0.6); GF.snd.rumble.g.gain.setTargetAtTime(0.07*a,tc,0.6);
}
