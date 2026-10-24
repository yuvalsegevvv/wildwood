//@ The Deep Cave's skill drawings for floor 3 (the +2 sets): Tidepool, Intermission, Sound the Charge, Eagle's Perch, Stopped Hour and Lamp in the Window
/* Agent map. Registry and routes: cave/vis.js; kit (cvbRun, cvbDef, the lift, helpers): cave/vis-floor2b.js. Each skill is drawn in its set's colours (docs/skillkits/VISUALS.md; the set's look is
   SSL.looks[set], server/cave-fx.js lists the events): a cast (cast), what lasts (zone for a ground zone, event for the cvfx events) and its end.
   Tidepool + Lamp: zones (zone(A)); Intermission: a bow, curtains and a spotlight on every ally ('next'); Sound the Charge: a horn and drum rings; Eagle's Perch: the gust that lifts the model ('perch');
   Stopped Hour: a dial and frozen sand on every ally ('hold', 'hold-end'). Test: client-smoke. */
const CVB_HAND=new THREE.PlaneGeometry(1,1).translate(0,0.5,0), CVB_PLANE=new THREE.PlaneGeometry(1,1), CVB_CONE=new THREE.CylinderGeometry(0.4,1,1,18,1,true), CVB_GUST=new THREE.CylinderGeometry(0.9,1.6,1,14,1,true);
const CVB_HOLD=new Map(), CVB_NEXT=new Map();
function cvbWaterGeo(rings,segs){   // a disc of 1 m radius made of rings, so its surface can be waved vertex by vertex
  const n=1+rings*segs, pos=new Float32Array(n*3), idx=[];
  for(let i=1;i<=rings;i++) for(let j=0;j<segs;j++){ const a=j/segs*TAU, v=1+(i-1)*segs+j; pos[v*3]=Math.sin(a)*i/rings; pos[v*3+2]=Math.cos(a)*i/rings; }
  for(let j=0;j<segs;j++) idx.push(0,1+j,1+(j+1)%segs);
  for(let i=2;i<=rings;i++) for(let j=0;j<segs;j++){ const a=1+(i-2)*segs+j, b=1+(i-2)*segs+(j+1)%segs, c=1+(i-1)*segs+j, d=1+(i-1)*segs+(j+1)%segs; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return g;
}
function cvbWaveWater(g,t,amp){ const a=g.attributes.position.array; for(let v=1;v<a.length/3;v++){ const x=a[v*3], z=a[v*3+2]; a[v*3+1]=amp*(Math.sin(x*5+t*2.4)+Math.cos(z*5.6-t*1.9))*(0.4+Math.hypot(x,z)*0.6); } g.attributes.position.needsUpdate=true; }
let cvbWinTex=null;
function cvbWindowTex(){   // a lit window laid on the floor: four panes in a frame
  if(cvbWinTex) return cvbWinTex;
  const c=document.createElement('canvas'); c.width=c.height=128;
  try{ const g=c.getContext('2d'); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(10,10,108,108); g.strokeStyle='#fff'; g.lineWidth=9; g.strokeRect(9,9,110,110); g.lineWidth=6; g.beginPath(); g.moveTo(64,9); g.lineTo(64,119); g.moveTo(9,64); g.lineTo(119,64); g.stroke();
    g.globalCompositeOperation='destination-out'; g.lineWidth=2; g.strokeStyle='#000'; g.beginPath(); g.moveTo(64,14); g.lineTo(64,114); g.moveTo(14,64); g.lineTo(114,64); g.stroke(); }catch(_){}
  return (cvbWinTex=new THREE.CanvasTexture(c));
}

/* ---- Ambrose's Tidepool (water): a pool of the cave's water with ripples, a wave-line rim and bubbles; it washes outward when it ends ---- */
cvbDef('tidepool',{
  cast(p,ab){
    const hd=cvbHand(p), cx=p.x-Math.sin(p.face)*3, cz=p.z-Math.cos(p.face)*3, gy=getH(cx,cz), T=0.38, L=cvbLook('ambrose');
    for(let i=0;i<fxpN(14);i++){   // a scoop of water thrown from the hand to where the pool opens
      const tx=cx+AR(-1.2,1.2), tz=cz+AR(-1.2,1.2), g=9, vy=(gy+0.1-hd.y+0.5*g*T*T)/T;
      fxpAdd(hd.x,hd.y,hd.z,(tx-hd.x)/T,vy,(tz-hd.z)/T,i%3?0x7fd0d8:0xe6ecea,AR(0.14,0.26),T+0.1,{g,grow:0.5,white:0.2}); }
    spawnRingAt(p.x,getH(p.x,p.z),p.z,1.8,0x7fd0d8); fxpFlare(hd.x,hd.y,hd.z,0x9fe8ee,1.3,0.3);
    fxpLater(T,()=>{ spawnRingAt(cx,gy,cz,2.4,0x9fe8ee); fxpSparks(cx,gy+0.3,cz,0x9fe8ee,12,4,{up:3,g:10}); if(L) sslBurst(L,cx,gy+0.4,cz,8,2.5); });
    cvbTone(cx,cz,{type:'sine',freq:420,freq2:180,dur:0.3,vol:0.06}); cvbNoise(cx,cz,{filter:'bandpass',ff:900,ff2:1800,dur:0.3,vol:0.06});
  },
  zone(A){
    const L=cvbLook('ambrose'), gy=getH(A.x,A.z), h=cvbRun(A.dur+1.5,null,null); h.area=A;
    const geo=cvbWaterGeo(LOW?3:5,LOW?16:28), water=cvbMesh(geo,new THREE.MeshBasicMaterial({color:0x2a9fb8,transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}));
    water.userData.geo=true; water.position.set(A.x,gy+0.09,A.z); cvbAdd(h,water);
    const sheen=cvbMesh(geo,new THREE.MeshBasicMaterial({color:0x9fe8ee,transparent:true,opacity:0.12,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,wireframe:true}));
    sheen.position.set(A.x,gy+0.12,A.z); cvbAdd(h,sheen);   // (the same surface, as a net of light that moves with it)
    const rim=fxdMesh('wave',0x9fe8ee,0.55); rim.userData.own=true; cvbAdd(h,rim);
    const edge=cvbRingMesh(0xcff6ff,0.8); cvbAdd(h,edge);
    h.data.rips=[]; h.data.nx=0.5;
    h.tick=(h,dt,k)=>{
      const r=A.dur-A.t, grow=Math.min(1,h.t/0.35)*Math.min(1,Math.max(0,r/0.5)+0.001), R=A.r*grow;
      water.scale.set(R,1,R); sheen.scale.set(R,1,R); cvbWaveWater(geo,h.t,0.05);
      rim.position.set(A.x,gy+0.14,A.z); rim.scale.setScalar(R*1.03); rim.rotation.y=h.t*0.4; cvbFlat(edge,A.x,A.z,R,0.15); edge.material.opacity=0.55+0.25*Math.sin(h.t*5);
      h.data.nx-=dt; if(h.data.nx<=0&&r>0.6){ h.data.nx=0.9; const m=cvbRingMesh(0xe6ffff,0.7); cvbFlat(m,A.x+AR(-1,1),A.z+AR(-1,1),0.3,0.16); cvbAdd(h,m); h.data.rips.push({m,t:0,x:m.position.x,z:m.position.z}); }
      for(let i=h.data.rips.length-1;i>=0;i--){ const q=h.data.rips[i]; q.t+=dt; const f=q.t/1.6;   // a ripple spreads to the rim and fades
        q.m.scale.setScalar(0.3+f*(R-0.3)); q.m.material.opacity=0.7*(1-f); if(f>=1){ h.objs.splice(h.objs.indexOf(q.m),1); cvbDrop(q.m); h.data.rips.splice(i,1); } }
      if(Math.random()<dt*7*FXP_K){ const a=AR(0,TAU), d=Math.sqrt(Math.random())*R; fxpAdd(A.x+Math.sin(a)*d,gy+0.15,A.z+Math.cos(a)*d,AR(-0.4,0.4),AR(2.5,4),AR(-0.4,0.4),0xbff3ff,0.14,0.55,{g:9,grow:0.5,white:0.4}); }   // droplets jump off it
    };
    h.end=h=>{   // the pool washes outward and heals the weakest ally
      spawnRingAt(A.x,gy,A.z,A.r+3.5,0x9fe8ee); spawnRingAt(A.x,gy+0.2,A.z,A.r*0.6,0xffffff); fxpSparks(A.x,gy+0.3,A.z,0x7fd0d8,22,6,{up:4,g:9}); fxpFlare(A.x,gy+0.6,A.z,0x9fe8ee,A.r*0.8,0.5);
      if(L) sslBurst(L,A.x,gy+0.5,A.z,16,3.2); cvbTone(A.x,A.z,{type:'sine',freq:300,freq2:700,dur:0.35,vol:0.06});
    };
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='cleanse') return;
    const o=cvbWho(e[1]), L=cvbLook('ambrose'); if(!o) return;   // the pool washes a slow off
    if(e[1]===NET.pid) PFX.slow=0;
    const y=cvbGy(o);
    if(L) for(let i=0;i<sslN(6);i++) ssEmit(L,o.x+AR(-0.5,0.5),y+AR(0.1,1.4),o.z+AR(-0.5,0.5),{sh:'bubble',c:1,v:[0,AR(0.8,1.8),0],life:AR(0.7,1.1),s:0.2});
    spawnRingAt(o.x,y,o.z,1.1,0x9fe8ee);
  }
});

/* ---- Marigold's Intermission (light): a bow before a stage curtain; every ally within 15 m gets a spotlight until its next skill ---- */
cvbDef('intermission',{
  cast(p,ab){
    const L=cvbLook('marigold'), gy=getH(p.x,p.z), fx=-Math.sin(p.face), fz=-Math.cos(p.face), cx=p.x+fx*1.5, cz=p.z+fz*1.5, h=cvbRun(0.8,null,null);
    for(const s of [-1,1]){   // two plum curtains with a gold hem part to either side
      const g=new THREE.Group(), cloth=cvbMesh(CVB_PLANE,new THREE.MeshBasicMaterial({color:0x7a3a62,transparent:true,opacity:0.85,depthWrite:false,side:THREE.DoubleSide})), hem=cvbMesh(CVB_PLANE,new THREE.MeshBasicMaterial({color:0xffd36b,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));
      cloth.scale.set(1.6,2.8,1); cloth.position.y=1.4; hem.scale.set(1.6,0.14,1); hem.position.y=0.1; g.add(cloth,hem); g.rotation.y=p.face; g.userData.s=s; cvbAdd(h,g); h.data[s]=g; }
    h.tick=(h,dt,k)=>{ const f=Math.min(1,h.t/0.4), e=f*(2-f), op=1-Math.max(0,(h.t-0.4)/0.4);
      for(const s of [-1,1]){ const g=h.data[s], off=(0.85+e*4.2)*s; g.position.set(cx+Math.cos(p.face)*off,gy,cz-Math.sin(p.face)*off); g.children.forEach(c=>{ c.material.opacity=0.9*op; }); } };
    if(L){ sslDecal(L,p.x,p.z,15,{life:1.0,r0:0.08,spin:0.5,op:0.75}); sslBurst(L,p.x,gy+1.2,p.z,26,5.5); sslFlash(L,p.x,gy+1.4,p.z,p.face,0.6,0.9,0xffd36b,0xfff2d6); }
    spawnRingAt(p.x,gy,p.z,15,0xffd36b); spawnRingAt(p.x,gy+0.2,p.z,9,0xfff2d6); fxpSparks(p.x,gy+1,p.z,0xffd36b,26,8,{up:5,size:0.24,life:0.9});
    for(const a of cvbAllies(cvbPid(p),15)){ const o=a.o, y=cvbGy(o); fxpFlare(o.x,y+2.4,o.z,0xffd36b,1.6,0.5); fxpSparks(o.x,y+2.2,o.z,0xfff2d6,8,3,{up:1}); }
    if(SND.ready){ const n=SND.ctx.currentTime; for(let i=0;i<4;i++) cvbNoise(p.x,p.z,{filter:'highpass',ff:2600,dur:0.06,vol:0.1,when:n+i*0.07}); cvbTone(p.x,p.z,{type:'triangle',freq:880,freq2:1320,dur:0.5,vol:0.05}); }
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='next') return;
    const pid=e[1], o=cvbWho(pid), v=+e[3]||0, L=cvbLook('marigold'); if(!o) return;
    const old=CVB_NEXT.get(pid); if(old) cvbStop(old);
    const h=cvbRun(10.5,null,()=>{ if(CVB_NEXT.get(pid)===h) CVB_NEXT.delete(pid); }); CVB_NEXT.set(pid,h);
    const cone=cvbMesh(CVB_CONE,fxMat(0xffd36b,v>0?0.16:0.07)); cvbAdd(h,cone);
    const star=v>0?fxdBillboard('star',0xffe08a,0.9):null; if(star){ star.userData.own=true; cvbAdd(h,star); }
    const ring=cvbRingMesh(0xffd36b,0.8); cvbAdd(h,ring);
    h.tick=(h,dt,k)=>{
      const q=cvbWho(pid); if(!q){ cvbStop(h); return; }
      const y=cvbGy(q)+cvbLift(pid), fade=Math.min(1,(h.dur-h.t)/1.0)*Math.min(1,h.t/0.3), r=0.75+0.07*Math.sin(h.t*4);
      cone.position.set(q.x,y+1.7,q.z); cone.scale.set(r*1.1,3.4,r*1.1); cone.material.opacity=(v>0?0.16:0.07)*fade; cone.rotation.y=h.t*0.5;
      cvbFlat(ring,q.x,q.z,r*1.2,0.1); ring.position.y=y+0.1; ring.material.opacity=0.8*fade;
      if(star){ star.position.set(q.x,y+2.35+0.08*Math.sin(h.t*3),q.z); star.quaternion.copy(camera.quaternion); star.rotateZ(h.t*1.4); star.scale.setScalar(0.55*fade+0.001); }
      if(L&&v>0&&Math.random()<dt*6) ssEmit(L,q.x+AR(-0.5,0.5),y+0.3,q.z+AR(-0.5,0.5),{sh:'spark',c:2,v:[0,AR(0.8,1.6),0],life:AR(0.8,1.2),s:0.2,g:0});
    };
    fxpFlare(o.x,cvbGy(o)+1,o.z,0xffd36b,2.2,0.4); spawnRingAt(o.x,cvbGy(o),o.z,1.8,0xffd36b);
  }
});

/* ---- Dunstan's Sound the Charge (fire): a brass horn at the lips, three drum-beat rings out to 25 m, pennants and a rewinding ring on every ally ---- */
const CVB_HORN=new THREE.CylinderGeometry(0.3,0.05,1.0,10,1,true).rotateX(Math.PI/2);
cvbDef('soundcharge',{
  cast(p,ab){
    const L=cvbLook('dunstan'), gy=getH(p.x,p.z), hd=cvbHand(p), h=cvbRun(0.7,null,null), fx=-Math.sin(p.face), fz=-Math.cos(p.face);
    const horn=cvbMesh(CVB_HORN,new THREE.MeshBasicMaterial({color:0xd4a83a,transparent:true,opacity:1,side:THREE.DoubleSide})); horn.position.set(hd.x+fx*0.4,hd.y+0.2,hd.z+fz*0.4); horn.rotation.y=p.face+Math.PI; cvbAdd(h,horn);
    const glow=fxdBillboard('flash',0xffd36b,0.9); glow.userData.own=true; glow.position.set(hd.x+fx*0.95,hd.y+0.2,hd.z+fz*0.95); cvbAdd(h,glow);
    h.tick=(h,dt,k)=>{ const f=Math.min(1,h.t/0.12); horn.scale.setScalar(0.6+0.4*f); horn.material.opacity=1-Math.max(0,(h.t-0.4)/0.3); glow.scale.setScalar((0.8+0.5*Math.sin(h.t*30))*(1-k)+0.001); glow.quaternion.copy(camera.quaternion); };
    for(let i=0;i<3;i++) fxpLater(i*0.13,()=>{ spawnRingAt(p.x,gy,p.z,8+i*8.5,i===1?0xffd36b:0xff9a4a); camShake=Math.max(camShake,p===P?0.18:0); });   // three beats of the drum
    spawnArcAt(hd.x,hd.y,hd.z,p.face,0xffd36b,2.2);
    if(L){ sslDecal(L,p.x,p.z,25,{life:0.9,r0:0.06,spin:0.8,op:0.7}); sslBurst(L,hd.x,hd.y,hd.z,12,4,{sh:'pennant'}); sslRingMotes(L,p.x,p.z,12,36); }
    for(const a of cvbAllies(cvbPid(p),25)){ const o=a.o, y=cvbGy(o);   // the party: cooldowns rewind (a ring that closes in) and pennants lift off them
      spawnRingAt(o.x,y,o.z,2.6,0xffd36b,true); fxpFlare(o.x,y+1,o.z,0xff9a4a,2.2,0.4); fxpSparks(o.x,y+0.8,o.z,0xffd36b,10,3,{up:3});
      if(L) for(let i=0;i<sslN(3);i++) ssEmit(L,o.x+AR(-0.4,0.4),y+0.5,o.z+AR(-0.4,0.4),{sh:'pennant',c:i%2?0:1,v:[0,AR(2,3.4),0],life:1.0,g:-1}); }
    if(SND.ready){ cvbTone(p.x,p.z,{type:'sawtooth',freq:196,freq2:294,dur:0.55,vol:0.07,filter:'lowpass',ff:1400}); cvbTone(p.x,p.z,{type:'square',freq:392,freq2:588,dur:0.45,vol:0.03,filter:'lowpass',ff:1800});
      for(let i=0;i<3;i++) cvbTone(p.x,p.z,{type:'sine',freq:90,freq2:45,dur:0.25,vol:0.14,when:SND.ctx.currentTime+i*0.13}); }
  }
});

/* ---- Sorrel's Eagle's Perch (air): a gust lifts the hiker 4 m for the whole window; feathers circle it, the ground shows a lens and a gust ---- */
cvbDef('eagleperch',{
  cast(p,ab){
    const L=cvbLook('sorrel'), gy=getH(p.x,p.z);
    spawnRingAt(p.x,gy,p.z,3.4,0xbfe3ff); spawnRingAt(p.x,gy+0.2,p.z,2,0xffffff); fxpSparks(p.x,gy+0.4,p.z,0xeaf6ff,14,5,{up:3,g:3}); if(L) sslBurst(L,p.x,gy+0.8,p.z,16,3.4);
    cvbNoise(p.x,p.z,{filter:'bandpass',ff:700,ff2:2400,dur:0.55,vol:0.12}); cvbTone(p.x,p.z,{type:'sine',freq:260,freq2:620,dur:0.4,vol:0.04});
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='perch') return;
    const pid=e[1], dur=+e[3]||5, o=cvbWho(pid), L=cvbLook('sorrel'); if(!o) return;
    CVB_LIFT.set(pid,{t:0,dur});
    const h=cvbRun(dur+0.2,null,null), cols=[0xdff1ff,0xbfe3ff], cones=[];
    for(let i=0;i<2;i++){ const c=cvbMesh(CVB_GUST,fxMat(cols[i],0.13)); cvbAdd(h,c); cones.push(c); }
    const swirl=fxdMesh('gust',0xbfe3ff,0.7); swirl.userData.own=true; cvbAdd(h,swirl);
    if(L) sslDecal(L,o.x,o.z,2.4,{life:dur,keep:true,r0:1,op:0.7,spin:-1.2,follow:()=>cvbWho(pid)});
    h.data.dust=0;
    h.tick=(h,dt,k)=>{
      const q=cvbWho(pid); if(!q){ cvbStop(h); return; }
      const gy=cvbGy(q), rem=dur-h.t, sh=Math.min(1,Math.min(h.t/0.3,rem/0.5)+0.001);
      cones.forEach((c,i)=>{ c.position.set(q.x,gy+2.4,q.z); c.scale.set((i?0.7:1)*sh,4.8,(i?0.7:1)*sh); c.rotation.y=h.t*(i?-4:3); c.material.opacity=0.13*sh; });
      swirl.position.set(q.x,gy+0.12,q.z); swirl.scale.setScalar(1.9*sh+0.01); swirl.rotation.y=h.t*5;
      if(L&&Math.random()<dt*16*SSL_Q){ const a=AR(0,TAU), r=AR(0.9,1.7); ssEmit(L,q.x+Math.sin(a)*r,gy+AR(0,4.2),q.z+Math.cos(a)*r,{v:[Math.cos(a)*3.4,AR(0.6,1.6),-Math.sin(a)*3.4],life:AR(0.7,1.1),g:-0.2}); }
      h.data.dust-=dt; if(h.data.dust<=0){ h.data.dust=0.25; fxxDust(q.x,gy,q.z,3,1.6,0xcfd8e0); }
    };
    h.end=h=>{ const q=cvbWho(pid); if(q){ spawnRingAt(q.x,cvbGy(q),q.z,3,0xbfe3ff); fxxDust(q.x,cvbGy(q),q.z,8,2.4,0xcfd8e0); } };
  }
});

/* ---- Zahra's Stopped Hour (light): a gold dial sweeps out; every ally within 15 m stands in a stopped clock with sand hanging in the air, which shatters when time runs again ---- */
cvbDef('stoppedhour',{
  cast(p,ab){
    const L=cvbLook('zahra'), gy=getH(p.x,p.z), hd=cvbHand(p);
    if(L){ sslDecal(L,p.x,p.z,15,{life:1.3,r0:0.05,spin:-0.7,op:0.8}); sslRays(L,p.x,gy+1.2,p.z,0,Math.PI,12,5,0xfff0b0); sslBurst(L,p.x,gy+1,p.z,14,3); }
    spawnRingAt(p.x,gy,p.z,15,0xe8c050); spawnRingAt(p.x,gy+0.3,p.z,10,0xfff0b0,true); fxpFlare(hd.x,hd.y,hd.z,0xfff0b0,2,0.4);
    for(let i=0;i<12;i++){ const a=i/12*TAU; fxpLine(p.x,gy+0.3,p.z,p.x+Math.sin(a)*7,gy+0.3,p.z+Math.cos(a)*7,0xe8c050,3,0.22); }   // twelve hour marks
    if(SND.ready){ for(const [i,f] of [[0,330],[1,247]]) cvbTone(p.x,p.z,{type:'sine',freq:f,freq2:f*0.5,dur:0.9,vol:0.08,when:SND.ctx.currentTime+i*0.25}); cvbNoise(p.x,p.z,{filter:'highpass',ff:3200,dur:0.1,vol:0.1}); }
  },
  event(e){
    if(e[0]!=='cvfx') return;
    const pid=e[1], o=cvbWho(pid), L=cvbLook('zahra'); if(!o) return;
    if(e[2]==='hold'){
      const dur=+e[3]||3, old=CVB_HOLD.get(pid); if(old) cvbStop(old);
      const h=cvbRun(dur+0.15,null,null); CVB_HOLD.set(pid,h);
      const halo=cvbMesh(new THREE.RingGeometry(0.86,0.94,48),new THREE.MeshBasicMaterial({color:0xe8c050,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      halo.userData.geo=true; cvbAdd(h,halo);
      const hand=cvbMesh(CVB_HAND,new THREE.MeshBasicMaterial({color:0xfff0b0,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); cvbAdd(h,hand);
      if(L) sslDecal(L,o.x,o.z,2.2,{life:dur,keep:true,r0:1,op:0.85,spin:-0.6,follow:()=>cvbWho(pid)});
      const y0=cvbGy(o); for(let i=0;i<fxpN(10);i++){ const a=AR(0,TAU), r=AR(0.7,1.5); fxpAdd(o.x+Math.sin(a)*r,y0+AR(0.1,2.2),o.z+Math.cos(a)*r,AR(-0.03,0.03),AR(-0.02,0.04),AR(-0.03,0.03),i%3?0xe8c050:0xfff0b0,AR(0.12,0.2),dur,{grow:1,a:0.9}); }   // sand hanging in the air
      fxpFlare(o.x,y0+1,o.z,0xfff0b0,2.6,0.5); spawnRingAt(o.x,y0,o.z,2.2,0xe8c050);
      h.tick=(h,dt,k)=>{ const q=cvbWho(pid); if(!q){ cvbStop(h); return; } const y=cvbGy(q)+cvbLift(pid), f=Math.min(1,h.t/0.25)*Math.min(1,(h.dur-h.t)/0.2+0.001);
        halo.position.set(q.x,y+1.05,q.z); halo.rotation.y=h.t*0.6; halo.scale.setScalar(f);
        hand.position.set(q.x,y+1.05,q.z); hand.scale.set(0.06,0.8*f,1); hand.rotation.y=halo.rotation.y; hand.rotation.z=-h.t*1.8; };
    } else if(e[2]==='hold-end'){
      const h=CVB_HOLD.get(pid); if(h) cvbStop(h); CVB_HOLD.delete(pid);
      const y=cvbGy(o); spawnRingAt(o.x,y,o.z,3.2,0xfff0b0); fxpSparks(o.x,y+1,o.z,0xe8c050,18,5,{up:2,g:4}); fxpFlare(o.x,y+1,o.z,0xfff0b0,3,0.35); if(L) sslBurst(L,o.x,y+1,o.z,12,3.4);
      cvbTone(o.x,o.z,{type:'triangle',freq:1320,freq2:660,dur:0.3,vol:0.05});
    }
  }
});

/* ---- Hollis's Lamp in the Window (dark): a lamp on a post, its window of light laid on the floor, warm for allies and a damper for enemies; it snuffs out when it ends ---- */
const CVB_LAMP_BOX=new THREE.BoxGeometry(0.34,0.46,0.34), CVB_LAMP_POST=new THREE.CylinderGeometry(0.04,0.06,1,6);
const CVB_LAMPS=[];
cvbDef('lampwindow',{
  cast(p,ab){
    const L=cvbLook('hollis'), gy=getH(p.x,p.z), hd=cvbHand(p);
    spawnRingAt(p.x,gy,p.z,3,0xffcf7a); if(L) sslBurst(L,p.x,gy+0.4,p.z,10,2.4); fxpFlare(hd.x,hd.y,hd.z,0xffcf7a,1.6,0.35);
    const h=cvbRun(0.35,null,null), l=cvbMesh(CVB_LAMP_BOX,new THREE.MeshBasicMaterial({color:0xffcf7a})); cvbAdd(h,l);   // the lantern is set down at your feet
    h.tick=(h,dt,k)=>{ const f=k*k; l.position.set(hd.x+(p.x-hd.x)*f,hd.y+(gy+1.7-hd.y)*f,hd.z+(p.z-hd.z)*f); l.scale.setScalar(1-0.3*f); };
    cvbTone(p.x,p.z,{type:'triangle',freq:700,freq2:500,dur:0.15,vol:0.05});
  },
  zone(A){
    const L=cvbLook('hollis'), gy=getH(A.x,A.z), o=cvbWho(A.owner), face=o?o.face:0, h=cvbRun(A.dur+1.5,null,null), lx=A.x+Math.cos(face)*1.5, lz=A.z-Math.sin(face)*1.5; h.area=A;   // (the lamp is set down beside you, not under your feet)
    const post=cvbMesh(CVB_LAMP_POST,new THREE.MeshBasicMaterial({color:0x4a4458})), box=cvbMesh(CVB_LAMP_BOX,new THREE.MeshBasicMaterial({color:0xffe09a}));
    const glow=fxdBillboard('flash',0xffcf7a,0.95); glow.userData.own=true;
    const win=cvbMesh(CVB_PLANE,new THREE.MeshBasicMaterial({map:cvbWindowTex(),color:0xffcf7a,transparent:true,opacity:0.45,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); win.rotation.x=-Math.PI/2; win.userData.own=true;
    const pool=cvbDiscMesh(0xffcf7a,0.12), ring=cvbRingMesh(0xffcf7a,0.8);
    for(const o2 of [post,box,glow,win,pool,ring]) cvbAdd(h,o2);
    h.data.snuff=false; CVB_LAMPS.push(h);
    h.tick=(h,dt,k)=>{
      const rem=A.dur-A.t, rise=Math.min(1,h.t/0.4), fade=Math.min(1,Math.max(0,rem/0.6)+0.001), fl=0.85+0.15*Math.sin(h.t*13)+0.08*Math.sin(h.t*31);
      post.position.set(lx,gy+0.5*rise*1.7,lz); post.scale.set(1,1.7*rise,1);
      box.position.set(lx,gy+1.7*rise+0.2,lz); box.scale.setScalar(rise*fade+0.001);
      glow.position.set(lx,gy+1.9*rise,lz); glow.quaternion.copy(camera.quaternion); glow.scale.setScalar((2.6+0.3*fl)*rise*fade+0.001);
      win.position.set(A.x,gy+0.11,A.z); win.scale.set(A.r*1.35*rise*fade+0.01,A.r*1.35*rise*fade+0.01,1); win.rotation.z=face; win.material.opacity=0.38*fl*fade;
      pool.position.set(A.x,gy+0.1,A.z); pool.scale.setScalar(A.r*rise*fade+0.01); cvbFlat(ring,A.x,A.z,A.r*rise*fade+0.01,0.12); ring.material.opacity=0.6*fade;
      if(L&&Math.random()<dt*6*SSL_Q){ const a=AR(0,TAU), r=AR(1,A.r); ssEmit(L,A.x+Math.sin(a)*r,gy+0.2,A.z+Math.cos(a)*r,{sh:'wisp',c:2,v:[AR(-0.3,0.3),AR(0.4,0.9),AR(-0.3,0.3)],life:AR(1.2,2),s:0.55,g:0}); }
    };
    h.end=h=>{ const i=CVB_LAMPS.indexOf(h); if(i>=0) CVB_LAMPS.splice(i,1);   // the flame is snuffed: a curl of smoke
      fxpFlare(lx,gy+1.9,lz,0xffcf7a,2.4,0.3); for(let n=0;n<fxpN(6);n++) fxpSmoke(lx+AR(-0.2,0.2),gy+1.8,lz+AR(-0.2,0.2),AR(-0.2,0.2),AR(0.8,1.4),AR(-0.2,0.2),0x5a566a,0.5,1.4,{grow:3}); spawnRingAt(A.x,gy,A.z,A.r*0.6,0xe8a84a,true); };
    cvbTone(A.x,A.z,{type:'sine',freq:196,freq2:392,dur:0.5,vol:0.05});
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='lamp') return;
    const o=cvbWho(e[1]); if(!o) return; const y=cvbGy(o);   // an ally under 30% inside the lamp's light is lifted once: a beam from the lamp and a warm bloom
    let near=null, nd=1e9; for(const h of CVB_LAMPS){ const a=h.area, d=Math.hypot(a.x-o.x,a.z-o.z); if(d<nd){ nd=d; near=a; } }
    if(near) fxpLine(near.x,getH(near.x,near.z)+1.8,near.z,o.x,y+1,o.z,0xffcf7a,22,0.34);
    spawnRingAt(o.x,y,o.z,2,0xffcf7a); fxpFlare(o.x,y+1,o.z,0xffe09a,3,0.5); fxpSparks(o.x,y+0.8,o.z,0xffcf7a,14,3,{up:3});
    const L=cvbLook('hollis'); if(L) for(let i=0;i<sslN(6);i++) ssEmit(L,o.x+AR(-0.4,0.4),y+0.3,o.z+AR(-0.4,0.4),{sh:'spark',c:3,v:[0,AR(1,2.4),0],life:1,g:0});
    cvbTone(o.x,o.z,{type:'sine',freq:523,freq2:784,dur:0.45,vol:0.05});
  }
});
