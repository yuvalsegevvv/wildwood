//@ The Deep Cave's skill drawings for floor 4 (the +3 sets): Night Line, Bell Echo, Black Ice, Landslide, Embalm and Night Shift
/* Agent map. Registry and routes: cave/vis.js; kit (cvbRun, cvbDef, helpers): cave/vis-floor2b.js. Each skill is drawn in its set's colours (docs/skillkits/VISUALS.md; the set's look is SSL.looks[set];
   the events are listed in server/cave-fx.js). Night Line + Black Ice: ground zones (zone(A)); Bell Echo: a bronze bell over the hiker that rings out per hit ('bell');
   Landslide: rubble sliding down the slope ('slide'); Embalm: linen wound round an ally ('embalm', 'embalm-end'); Night Shift: a ring round the caster and grave hands ('cvhand').
   Black Ice's 'lane' events also raise the walking speed (cvbSpeedK, hooked in player/movement.js). Test: client-smoke. */
const CVB_LANTERN=new THREE.CylinderGeometry(0.2,0.2,0.4,8), CVB_STRIP=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2), CVB_ORB=new THREE.SphereGeometry(0.1,7,5), CVB_BAND=new THREE.CylinderGeometry(1,1,1,16,1,true);
const CVB_BELL=new THREE.LatheGeometry([[0.54,0],[0.57,0.05],[0.47,0.22],[0.4,0.5],[0.3,0.72],[0.15,0.88],[0.0,0.93]].map(q=>new THREE.Vector2(q[0],q[1])),14);
const CVB_BELLS=new Map(), CVB_EMB=new Map(), CVB_SHIFT=new Map(), CVB_LANEFX=new Map();
const CVB_BOULDER=new THREE.IcosahedronGeometry(0.5,0), CVB_CRYSTAL=new THREE.OctahedronGeometry(0.5,0), CVB_GEM=new THREE.OctahedronGeometry(0.15,0);
const CVB_MATS={rock:[0x8a8f96,0xd2b48a,0x6a5a4a].map(c=>new THREE.MeshLambertMaterial({color:c})), bone:new THREE.MeshBasicMaterial({color:0xcfc7a8,side:THREE.DoubleSide}), mold:new THREE.MeshBasicMaterial({color:0x5f8a5c,side:THREE.DoubleSide}),
  ice:new THREE.MeshBasicMaterial({color:0xcdeaff,transparent:true,opacity:0.85}), gem:new THREE.MeshBasicMaterial({color:0xffe08a})};   // (shared: never disposed)
let cvbIceTx=null, cvbRubbleTx=null;
function cvbNoiseTex(draw,w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; try{ draw(c.getContext('2d'),w,h); }catch(_){} const t=new THREE.CanvasTexture(c); return t; }
function cvbIceTex(){   // black ice: a dark glassy sheet with pale cracks and long glints, soft at the edges
  if(cvbIceTx) return cvbIceTx; const rg=mrng(4177).R;
  return (cvbIceTx=cvbNoiseTex((g,w,h)=>{
    const k=g.createLinearGradient(0,0,w,0); k.addColorStop(0,'#0a1a2e'); k.addColorStop(0.5,'#10304c'); k.addColorStop(1,'#0a1a2e'); g.fillStyle=k; g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(190,230,255,0.75)'; g.lineWidth=1.2; for(let i=0;i<14;i++){ let x=rg(4,w-4), y=rg(0,h); g.beginPath(); g.moveTo(x,y); for(let s=0;s<6;s++){ x+=rg(-9,9); y+=rg(6,16); g.lineTo(x,y); } g.stroke(); }
    g.strokeStyle='rgba(255,255,255,0.5)'; g.lineWidth=2; for(let i=0;i<5;i++){ const x=rg(8,w-8), y=rg(0,h); g.beginPath(); g.moveTo(x,y); g.lineTo(x+rg(-2,2),y+rg(30,70)); g.stroke(); }
    g.globalCompositeOperation='destination-in'; const m=g.createLinearGradient(0,0,w,0); m.addColorStop(0,'rgba(0,0,0,0)'); m.addColorStop(0.18,'rgba(0,0,0,1)'); m.addColorStop(0.82,'rgba(0,0,0,1)'); m.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=m; g.fillRect(0,0,w,h);
  },64,256));
}
function cvbRubbleTex(){   // a slope of rubble seen from above: a dark tan bed with stones and cracks
  if(cvbRubbleTx) return cvbRubbleTx; const rg=mrng(9931).R;
  return (cvbRubbleTx=cvbNoiseTex((g,w,h)=>{
    g.fillStyle='#6a5a46'; g.fillRect(0,0,w,h);
    for(let i=0;i<150;i++){ const c=['#8a7a62','#a89478','#5a4c3a','#9a9aa0'][i%4]; g.fillStyle=c; g.beginPath(); g.ellipse(rg(0,w),rg(0,h),rg(2,7),rg(1.5,5),rg(0,3),0,TAU); g.fill(); }
    g.strokeStyle='rgba(20,14,8,0.6)'; g.lineWidth=1.3; for(let i=0;i<10;i++){ let x=rg(0,w), y=rg(0,h); g.beginPath(); g.moveTo(x,y); for(let s=0;s<5;s++){ x+=rg(-10,10); y+=rg(8,18); g.lineTo(x,y); } g.stroke(); }
    g.globalCompositeOperation='destination-in'; const m=g.createLinearGradient(0,0,w,0); m.addColorStop(0,'rgba(0,0,0,0)'); m.addColorStop(0.14,'rgba(0,0,0,1)'); m.addColorStop(0.86,'rgba(0,0,0,1)'); m.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=m; g.fillRect(0,0,w,h);
  },64,256));
}
const cvbDir=(A,o)=>{ const dx=o?A.x-o.x:0, dz=o?A.z-o.z:0, d=Math.hypot(dx,dz); return d>1?{x:dx/d,z:dz/d}:{x:-Math.sin(o?o.face:0),z:-Math.cos(o?o.face:0)}; };   // the way a zone lies: from its caster to its centre

/* ---- Pell's Night Line (fire): a lantern is thrown; five float on a rope over the spot, and every two seconds they flare and draw an inward ring of embers (Lure) ---- */
cvbDef('nightline',{
  cast(p,ab,tgt){
    const foe=cvbFoe(p,ab.range,tgt), at=cvbAim(p,foe,ab.range,20), hd=cvbHand(p), gy=getH(at.x,at.z), d=Math.hypot(at.x-hd.x,at.z-hd.z), T=0.3+d*0.012, h=cvbRun(T+0.05,null,null);
    const lan=cvbMesh(CVB_LANTERN,new THREE.MeshBasicMaterial({color:0xffb45a})), gl=fxdBillboard('flash',0xffb45a,0.9); gl.userData.own=true; cvbAdd(h,lan); cvbAdd(h,gl);
    h.tick=(h,dt,k)=>{ const x=hd.x+(at.x-hd.x)*k, z=hd.z+(at.z-hd.z)*k, y=hd.y+(gy+3-hd.y)*k+Math.sin(k*Math.PI)*Math.min(4,d*0.18); lan.position.set(x,y,z); lan.rotation.y+=dt*6; gl.position.copy(lan.position); gl.quaternion.copy(camera.quaternion); gl.scale.setScalar(1.4);
      fxpTrail(x,y,z,0xffb45a,0.5,0.35); if(Math.random()<0.5*FXP_K) fxpAdd(x,y,z,AR(-1,1),AR(0,1.5),AR(-1,1),0xffd9a0,0.14,0.4,{g:3,grow:0.1}); };
    spawnRingAt(p.x,getH(p.x,p.z),p.z,1.8,0xffb45a); fxpFlare(hd.x,hd.y,hd.z,0xffb45a,1.5,0.3); cvbTone(p.x,p.z,{type:'triangle',freq:300,freq2:700,dur:0.25,vol:0.05});
  },
  zone(A){
    const L=cvbLook('pell'), gy=getH(A.x,A.z), o=cvbWho(A.owner), dir=cvbDir(A,o), px=dir.z, pz=-dir.x, h=cvbRun(A.dur+1.5,null,null); h.area=A;
    const N=5, lans=[], gls=[], ropes=[];
    for(let i=0;i<N;i++){ const m=cvbMesh(CVB_LANTERN,new THREE.MeshBasicMaterial({color:0xffb45a})), g=fxdBillboard('flash',0xffb45a,0.85); g.userData.own=true; cvbAdd(h,m); cvbAdd(h,g); lans.push(m); gls.push(g); }
    for(let i=0;i<N-1;i++){ const l=cvbLine(8,0xe9dfc4,0.7); cvbAdd(h,l); ropes.push(l); }
    const pool=cvbDiscMesh(0xffb45a,0.1); cvbAdd(h,pool); h.data.np=0.3; h.data.fl=0;
    const pos=i=>{ const f=(i/(N-1)*2-1)*A.r*0.85; return {x:A.x+px*f,z:A.z+pz*f}; };
    const pulse=()=>{ h.data.fl=1; spawnRingAt(A.x,gy,A.z,A.r,0xffb45a,true);   // the lure: embers are drawn in towards the line
      for(let i=0;i<fxpN(26);i++){ const a=AR(0,TAU), r=A.r*AR(0.7,1), x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r; fxpAdd(x,gy+AR(0.3,1.6),z,(A.x-x)/0.8,AR(0.5,2),(A.z-z)/0.8,i%2?0xffb45a:0xffd9a0,0.18,0.8,{grow:0.2,white:0.2}); }
      cvbTone(A.x,A.z,{type:'sine',freq:880,freq2:440,dur:0.35,vol:0.04}); };
    h.tick=(h,dt,k)=>{
      const rise=Math.min(1,h.t/0.5), e=rise*(2-rise), fade=Math.min(1,Math.max(0,(A.dur-A.t)/0.6)+0.001);
      if(A.t>=h.data.np){ h.data.np+=2; if(A.dur-A.t>0.5) pulse(); }
      h.data.fl=Math.max(0,h.data.fl-dt*2.2);
      for(let i=0;i<N;i++){ const q=pos(i), y=gy+0.3+(2.9+Math.sin(h.t*1.6+i*1.3)*0.18)*e; lans[i].position.set(q.x,y,q.z); lans[i].rotation.y=h.t*0.8+i; lans[i].scale.setScalar(fade+0.001);
        gls[i].position.set(q.x,y,q.z); gls[i].quaternion.copy(camera.quaternion); gls[i].scale.setScalar((1.3+h.data.fl*1.6+0.15*Math.sin(h.t*9+i))*fade+0.001);
        if(L&&Math.random()<dt*3*SSL_Q) ssEmit(L,q.x,y-0.1,q.z,{sh:'ember',c:2,v:[AR(-0.3,0.3),-AR(0.2,0.8),AR(-0.3,0.3)],life:AR(0.8,1.3),s:0.12,g:1}); }
      for(let i=0;i<N-1;i++){ const a=pos(i), b=pos(i+1), ya=lans[i].position.y, yb=lans[i+1].position.y; cvbSag(ropes[i],a.x,ya,a.z,b.x,yb,b.z,0.5,0,0); ropes[i].material.opacity=0.7*fade; }
      cvbFlat(pool,A.x,A.z,A.r*e*fade+0.01,0.1); pool.material.opacity=(0.1+h.data.fl*0.12)*fade;
    };
    h.end=h=>{ for(let i=0;i<N;i++){ const q=pos(i); fxpFlare(q.x,gy+3,q.z,0xffb45a,2,0.4); fxpSparks(q.x,gy+3,q.z,0xffd9a0,6,2.5,{up:1.5,g:-1}); } };
  }
});

/* ---- Genzo's Bell Echo (air): a bronze bell hangs over the hiker with a golden bead for every hit it will ring out; each hit swings it, rings a ring and heals the party ---- */
function cvbBellNew(pid,left){
  const old=CVB_BELLS.get(pid); if(old) cvbStop(old.h);
  const L=cvbLook('genzo'), s={h:null,left,max:left,sw:1,dying:0};
  const h=cvbRun(21,null,()=>{ if(CVB_BELLS.get(pid)===s) CVB_BELLS.delete(pid); }); s.h=h; CVB_BELLS.set(pid,s);
  const g=new THREE.Group(), bell=cvbMesh(CVB_BELL,new THREE.MeshLambertMaterial({color:0xc69b3c,emissive:0x4a3010})), band=cvbMesh(CVB_BAND,new THREE.MeshBasicMaterial({color:0xb8452a,side:THREE.DoubleSide})), clap=cvbMesh(CVB_ORB,new THREE.MeshBasicMaterial({color:0xf3ead2}));
  bell.scale.setScalar(0.95); bell.position.y=-0.45; band.scale.set(0.5,0.09,0.5); band.position.y=-0.2; clap.position.y=-0.5; clap.scale.setScalar(1.2); g.add(bell,band,clap);
  const gl=fxdBillboard('flash',0xf3ead2,0.5); gl.userData.own=true; cvbAdd(h,g); cvbAdd(h,gl);
  const orbs=[]; for(let i=0;i<8;i++){ const m=cvbMesh(CVB_ORB,new THREE.MeshBasicMaterial({color:0xe2c27a})); m.scale.setScalar(1.3); cvbAdd(h,m); orbs.push(m); }
  const ring=cvbRingMesh(0xd2a24a,0.45); cvbAdd(h,ring);
  h.tick=(h,dt,k)=>{
    const q=cvbWho(pid); if(!q){ cvbStop(h); return; }
    const y=cvbGy(q)+cvbLift(pid), pop=Math.min(1,h.t/0.3), fade=s.dying?Math.max(0,1-(h.t-s.dying)/0.6):Math.min(1,(h.dur-h.t)/1.0);
    s.sw=Math.max(0,s.sw-dt*0.9); g.position.set(q.x,y+3.0+0.06*Math.sin(h.t*2.5),q.z); g.rotation.z=s.sw*Math.sin(h.t*14)*0.5; g.rotation.x=s.sw*Math.cos(h.t*11)*0.3; g.scale.setScalar(pop*fade+0.001);
    gl.position.set(q.x,y+2.9,q.z); gl.quaternion.copy(camera.quaternion); gl.scale.setScalar((1.2+s.sw*1.4)*fade+0.001);
    const n=Math.min(8,s.left); orbs.forEach((m,i)=>{ m.visible=i<n; const a=h.t*1.6+i/Math.max(1,n)*TAU; m.position.set(q.x+Math.sin(a)*0.72,y+2.3+Math.sin(h.t*3+i)*0.05,q.z+Math.cos(a)*0.72); m.scale.setScalar(1.3*fade+0.001); });
    cvbFlat(ring,q.x,q.z,1.1*pop*fade+0.01,0.1); ring.position.y=y+0.1;
    if(s.dying&&h.t-s.dying>0.6) cvbStop(h);
    if(L&&Math.random()<dt*4*SSL_Q) ssEmit(L,q.x+AR(-0.4,0.4),y+2.3,q.z+AR(-0.4,0.4),{sh:'wisp',c:2,v:[0,AR(0.3,0.8),0],life:AR(0.9,1.4),s:0.4,g:0});
  };
  return s;
}
cvbDef('bellecho',{
  cast(p,ab){
    const L=cvbLook('genzo'), gy=getH(p.x,p.z), hd=cvbHand(p);
    spawnRingAt(p.x,gy,p.z,2.6,0xd2a24a); fxpFlare(hd.x,hd.y,hd.z,0xf3ead2,1.8,0.4); fxpSparks(p.x,gy+2.4,p.z,0xe2c27a,10,3,{up:1});
    if(L) sslBurst(L,p.x,gy+2.4,p.z,10,2.6);
    cvbTone(p.x,p.z,{type:'sine',freq:330,freq2:660,dur:0.35,vol:0.04});
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='bell') return;
    const pid=e[1], left=e[3]|0, q=cvbWho(pid), L=cvbLook('genzo'); if(!q) return;
    const y=cvbGy(q), cur=CVB_BELLS.get(pid);
    if(!cur||left>cur.left){   // a new bell, struck as it appears
      cvbBellNew(pid,left); spawnRingAt(q.x,y,q.z,7,0xf3ead2); spawnRingAt(q.x,y+0.2,q.z,4,0xd2a24a); fxpFlare(q.x,y+2.6,q.z,0xf3ead2,3,0.45); if(L) sslBurst(L,q.x,y+2.6,q.z,12,3.4);
    } else {   // a hit rang out: it swings, a ring runs out (the reflected blow) and the party is mended
      cur.left=left; cur.sw=1; if(left<=0) cur.dying=cur.h.t+0.001;
      spawnRingAt(q.x,y,q.z,5,0xf3ead2); fxpRingSparks(q.x,y,q.z,4.5,0xd2a24a,18,0.5); fxpFlare(q.x,y+2.6,q.z,0xf3ead2,2.4,0.35);
      for(const a of cvbAllies(pid,12)){ const o=a.o, oy=cvbGy(o); fxpSparks(o.x,oy+0.6,o.z,0xe2c27a,6,2,{up:2.5,g:-1}); if(L) ssEmit(L,o.x,oy+0.4,o.z,{sh:'glint',c:1,v:[0,1.6,0],life:0.9,g:0}); }
    }
    cvbTone(q.x,q.z,{type:'sine',freq:523,freq2:500,dur:1.1,vol:0.08}); cvbTone(q.x,q.z,{type:'sine',freq:1046,freq2:990,dur:0.7,vol:0.035}); cvbTone(q.x,q.z,{type:'sine',freq:1570,freq2:1500,dur:0.4,vol:0.02});
  }
});

/* ---- Brynja's Black Ice (water): a dark glassy lane with a moving glint, crystals grown on its edges and wind streaks; the hikers on it run 40% faster ---- */
cvbDef('blackice',{
  cast(p,ab){
    const L=cvbLook('brynja'), gy=getH(p.x,p.z), fx=-Math.sin(p.face), fz=-Math.cos(p.face);
    spawnRingAt(p.x,gy,p.z,2.4,0xb8e6ff); for(let i=-2;i<=2;i++){ const a=p.face+i*0.12; fxpLine(p.x,gy+0.2,p.z,p.x-Math.sin(a)*12,gy+0.2,p.z-Math.cos(a)*12,i%2?0xeaf4fb:0xb8e6ff,6,0.26); }   // the frost runs out ahead of the hiker
    if(L) sslSector(L,p.x,gy+0.4,p.z,p.face,0.35,11,16); fxxDust(p.x+fx*2,gy,p.z+fz*2,5,2,0xcfe8f8);
    cvbNoise(p.x,p.z,{filter:'highpass',ff:3200,dur:0.35,vol:0.09}); cvbTone(p.x,p.z,{type:'sine',freq:1400,freq2:700,dur:0.3,vol:0.03});
  },
  zone(A){
    const L=cvbLook('brynja'), gy=getH(A.x,A.z), o=cvbWho(A.owner), dir=cvbDir(A,o), len=A.r*2, wid=5, h=cvbRun(A.dur+1.5,null,null); h.area=A;
    const ang=Math.atan2(dir.x,dir.z), px=dir.z, pz=-dir.x;
    const tex=cvbIceTex(), sheet=cvbMesh(CVB_STRIP,new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0.88,depthWrite:false,side:THREE.DoubleSide})), glint=cvbMesh(CVB_STRIP,new THREE.MeshBasicMaterial({color:0xb8e6ff,transparent:true,opacity:0.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    sheet.rotation.y=glint.rotation.y=ang; sheet.position.set(A.x,gy+0.1,A.z); glint.position.set(A.x,gy+0.13,A.z); cvbAdd(h,sheet); cvbAdd(h,glint);
    const cr=[], n=LOW?5:8;
    for(let s=-1;s<=1;s+=2) for(let i=0;i<n;i++){ const f=(i+0.5)/n*2-1, m=new THREE.Mesh(CVB_CRYSTAL,CVB_MATS.ice); const hh=AR(0.5,1.1); m.userData.hh=hh; m.userData.delay=i/n*0.4;
      m.position.set(A.x+dir.x*f*len*0.48+px*s*(wid*0.5+AR(-0.15,0.2)),gy,A.z+dir.z*f*len*0.48+pz*s*(wid*0.5+AR(-0.15,0.2))); m.rotation.set(AR(-0.3,0.3),AR(0,TAU),AR(-0.3,0.3)); cvbAdd(h,m); cr.push(m); }
    h.tick=(h,dt,k)=>{
      const rem=A.dur-A.t, fade=Math.min(1,Math.max(0,rem/0.7)+0.001), grow=Math.min(1,h.t/0.35), e=grow*(2-grow);
      sheet.scale.set(wid*e*fade+0.01,1,len*e*fade+0.01); glint.scale.copy(sheet.scale); glint.material.opacity=0.12+0.08*Math.sin(h.t*6);
      for(const m of cr){ const f=Math.min(1,Math.max(0,(h.t-m.userData.delay)/0.3)), hh=m.userData.hh*f*fade; m.scale.set(0.45*(f*fade)+0.001,hh+0.001,0.45*(f*fade)+0.001); m.position.y=gy+hh*0.45; }
      if(Math.random()<dt*34*FXP_K){ const f=AR(-0.5,0.5), s=AR(-0.5,0.5); fxpAdd(A.x+dir.x*f*len+px*s*wid,gy+AR(0.1,0.6),A.z+dir.z*f*len+pz*s*wid,dir.x*11,AR(0,0.5),dir.z*11,0xeaf4fb,0.16,0.35,{grow:0.2,a:0.8}); }   // the glints race along the lane
      if(L&&Math.random()<dt*6*SSL_Q) ssEmit(L,A.x+dir.x*AR(-0.5,0.5)*len+px*AR(-1,1)*wid*0.5,gy+0.2,A.z+dir.z*AR(-0.5,0.5)*len+pz*AR(-1,1)*wid*0.5,{sh:'chaff',c:1,v:[0,AR(0.6,1.4),0],life:AR(0.7,1.1),g:-0.5});
    };
    h.end=h=>{ for(const m of cr){ fxpSparks(m.position.x,gy+0.4,m.position.z,0xcdeaff,5,3.5,{up:2,size:0.16}); }   // the crystals shatter
      spawnRingAt(A.x,gy,A.z,A.r,0xb8e6ff); cvbNoise(A.x,A.z,{filter:'highpass',ff:2600,dur:0.3,vol:0.08}); };
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='lane') return;
    const pid=e[1], secs=+e[3]||1.5;
    if(pid===NET.pid){ CVB_LANE.until=performance.now()+(secs+0.2)*1000; CVB_LANE.k=Math.min(0.6,+e[4]||0.4); }   // the lane is ice: you run faster on it
    const old=CVB_LANEFX.get(pid);
    if(old){ old.dur=Math.max(old.dur,old.t+secs); return; }
    const h=cvbRun(secs,null,()=>{ if(CVB_LANEFX.get(pid)===h) CVB_LANEFX.delete(pid); }); CVB_LANEFX.set(pid,h);
    h.tick=(h,dt,k)=>{ const q=cvbWho(pid); if(!q){ cvbStop(h); return; } if(Math.random()<dt*28*FXP_K){ const y=cvbGy(q); fxpAdd(q.x+AR(-0.3,0.3),y+0.1,q.z+AR(-0.3,0.3),Math.sin(q.face)*3+AR(-1,1),AR(0.4,1.4),Math.cos(q.face)*3+AR(-1,1),0xeaf4fb,0.17,0.45,{g:2,grow:0.1,white:0.3}); } };   // frost spray behind the runner
  }
});

/* ---- Tamsin's Landslide (earth): a wedge of rubble slides down the slope with boulders tumbling ahead of a wall of dust, and heaps at its end ---- */
cvbDef('landslide',{
  cast(p,ab){
    const L=cvbLook('tamsin'), gy=getH(p.x,p.z), fx=-Math.sin(p.face), fz=-Math.cos(p.face);
    spawnRingAt(p.x,gy,p.z,2.8,0xd2b48a); fxxDust(p.x,gy,p.z,8,2.6,0x8a7a60); for(let i=0;i<4;i++){ const d=2+i*2.5; fxxScorch(p.x+fx*d,p.z+fz*d,0.9,0x3a2c1e); }   // the ground is struck and splits ahead
    if(L) sslRingMotes(L,p.x,p.z,3,10); cvbNoise(p.x,p.z,{filter:'lowpass',ff:500,dur:0.35,vol:0.16}); cvbTone(p.x,p.z,{type:'sine',freq:110,freq2:50,dur:0.35,vol:0.12});
  },
  event(e){
    if(e[0]!=='cvfx'||e[2]!=='slide') return;
    const x0=+e[3], z0=+e[4], x1=+e[5], z1=+e[6], L=cvbLook('tamsin'), len=Math.hypot(x1-x0,z1-z0)||14, ux=(x1-x0)/len, uz=(z1-z0)/len, px=uz, pz=-ux, gy=getH(x0,z0), W=4;
    const h=cvbRun(2.2,null,null), ang=Math.atan2(ux,uz);
    const slab=cvbMesh(CVB_STRIP,new THREE.MeshBasicMaterial({map:cvbRubbleTex(),transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide})); slab.rotation.y=ang; slab.position.set((x0+x1)/2,getH((x0+x1)/2,(z0+z1)/2)+0.1,(z0+z1)/2); cvbAdd(h,slab);
    const N=LOW?8:15, bs=[]; for(let i=0;i<N;i++){ const m=new THREE.Mesh(CVB_BOULDER,CVB_MATS.rock[i%3]); const sz=AR(0.5,1.2); m.userData={s0:AR(-1.5,len*0.45),lat:AR(-W,W)*0.9,v:len/AR(0.75,1.05),sz,ph:AR(0,TAU),rx:AR(2,6),stop:len+AR(-1,2.5)}; m.scale.set(sz,sz*AR(0.7,1),sz*AR(0.8,1.2)); cvbAdd(h,m); bs.push(m); }
    h.data.dust=0; h.data.arr=false;
    h.tick=(h,dt,k)=>{
      const f=Math.min(1,h.t/0.85), front=len*f*(2-f), fade=Math.min(1,Math.max(0,(h.dur-h.t)/0.6)+0.001), grow=Math.min(1,h.t/0.2);
      slab.scale.set(W*2*grow*fade+0.01,1,Math.max(0.01,front+2)*fade); slab.position.set(x0+ux*(front+2)/2,gy+0.1,z0+uz*(front+2)/2); slab.material.opacity=0.9*fade;
      for(const m of bs){ const u=m.userData, tt=Math.max(0,h.t-0.05), s=Math.min(u.stop,u.s0+u.v*tt*(0.4+0.6*Math.min(1,tt/0.5))), moving=s<u.stop-0.05, x=x0+ux*s+px*u.lat, z=z0+uz*s+pz*u.lat, gh=getH(x,z);
        m.position.set(x,gh+u.sz*0.4+(moving?Math.abs(Math.sin(tt*9+u.ph))*0.6:0),z); if(moving){ m.rotation.x+=u.rx*dt; m.rotation.z+=u.rx*0.6*dt; } m.scale.y=m.scale.x*0.85*fade+0.001; m.visible=s>=0||tt>0.05; }
      h.data.dust-=dt; if(h.data.dust<=0&&h.t<1.0){ h.data.dust=0.08; fxxDust(x0+ux*front,getH(x0+ux*front,z0+uz*front),z0+uz*front,2,W*0.9,0x8a7a60); fxpSmoke(x0+ux*front+px*AR(-W,W),gy+0.4,z0+uz*front+pz*AR(-W,W),AR(-0.5,0.5),AR(0.6,1.4),AR(-0.5,0.5),0x7a6a54,0.8,1.2,{grow:3}); }
      if(!h.data.arr&&f>=1){ h.data.arr=true; fxxDebris(x1,getH(x1,z1),z1,LOW?10:18,7,0x6a5030); fxxDust(x1,getH(x1,z1),z1,10,W,0x8a7a60); spawnRingAt(x1,getH(x1,z1),z1,3.5,0xd2b48a); camShake=Math.max(camShake,Math.hypot(P.x-x1,P.z-z1)<30?0.4:0);
        cvbNoise(x1,z1,{filter:'lowpass',ff:420,dur:0.6,vol:0.2}); cvbTone(x1,z1,{type:'sine',freq:90,freq2:36,dur:0.6,vol:0.16}); }
    };
    if(L) sslSector(L,x0,gy+0.5,z0,Math.atan2(-ux,-uz),0.4,len,22);
    cvbNoise(x0,z0,{filter:'lowpass',ff:600,dur:0.9,vol:0.15}); camShake=Math.max(camShake,Math.hypot(P.x-x0,P.z-z0)<30?0.25:0);
  }
});

/* ---- Nephra's Embalm (earth): linen winds round the ally band by band under a gold dial; it shimmers while they cannot fall, then unwinds as the heal lands ---- */
cvbDef('embalm',{
  cast(p,ab){
    const L=cvbLook('nephra'), gy=getH(p.x,p.z), hd=cvbHand(p);
    Object.assign(CVB_LAST,{pid:cvbPid(p),x:hd.x,y:hd.y,z:hd.z,at:performance.now(),id:'embalm'});
    spawnRingAt(p.x,gy,p.z,2.4,0xe3d5b0); fxpFlare(hd.x,hd.y,hd.z,0xd4a83a,1.6,0.35); if(L) sslBurst(L,hd.x,hd.y,hd.z,10,2.6);
    cvbTone(p.x,p.z,{type:'triangle',freq:300,freq2:500,dur:0.3,vol:0.04});
  },
  event(e){
    if(e[0]!=='cvfx') return;
    const pid=e[1], o=cvbWho(pid), L=cvbLook('nephra');
    if(e[2]==='embalm'&&o){
      const dur=+e[3]||5, old=CVB_EMB.get(pid); if(old) cvbStop(old);
      if(CVB_LAST.id==='embalm'&&performance.now()-CVB_LAST.at<800&&CVB_LAST.pid!==pid){   // a strip of linen flies from the caster to the one who needed it
        const c=cvbRun(0.4,null,null), l=cvbAdd(c,cvbLine(12,0xe3d5b0,0.95)), ax=CVB_LAST.x, ay=CVB_LAST.y, az=CVB_LAST.z;
        c.tick=(c,dt,k)=>{ const q=cvbWho(pid); if(!q) return; const f=Math.min(1,c.t/0.25), y=cvbGy(q)+1; cvbSag(l,ax,ay,az,ax+(q.x-ax)*f,ay+(y-ay)*f,az+(q.z-az)*f,0.6*(1-f),0.3*(1-f),c.t*9); l.material.opacity=0.95*(1-k*k); fxpTrail(ax+(q.x-ax)*f,ay+(y-ay)*f,az+(q.z-az)*f,0xd4a83a,0.3,0.3); };
      }
      const h=cvbRun(dur+1.3,null,()=>{ if(CVB_EMB.get(pid)===h) CVB_EMB.delete(pid); }); CVB_EMB.set(pid,h); h.data.un=0;
      const bands=[], NB=LOW?5:7;
      for(let i=0;i<NB;i++){ const m=cvbMesh(CVB_BAND,new THREE.MeshBasicMaterial({color:i%3===1?0x2f55a0:0xe3d5b0,transparent:true,opacity:0.88,depthWrite:false,side:THREE.DoubleSide})); m.rotation.set(AR(-0.15,0.15),AR(0,TAU),AR(-0.15,0.15)); m.userData.r=i===3?0.5:i<2?0.36:0.42; cvbAdd(h,m); bands.push(m); }
      const shell=cvbMesh(new THREE.SphereGeometry(1,14,10),fxMat(0x6fd6c8,0.12)); shell.userData.geo=true; cvbAdd(h,shell);
      const gem=new THREE.Mesh(CVB_GEM,CVB_MATS.gem); cvbAdd(h,gem);
      if(L) sslDecal(L,o.x,o.z,2.0,{life:dur,keep:true,r0:1,op:0.8,spin:0.5,follow:()=>cvbWho(pid)});
      spawnRingAt(o.x,cvbGy(o),o.z,2.2,0xd4a83a); cvbTone(o.x,o.z,{type:'triangle',freq:392,freq2:588,dur:0.4,vol:0.05});
      h.tick=(h,dt,k)=>{
        const q=cvbWho(pid); if(!q){ cvbStop(h); return; }
        const y=cvbGy(q)+cvbLift(pid), u=h.data.un?Math.min(1,(h.t-h.data.un)/0.8):0;
        bands.forEach((m,i)=>{ const f=Math.min(1,Math.max(0,(h.t-i*0.07)/0.3)), e2=f*(2-f), r=m.userData.r*(1+(1-e2)*1.6+u*1.9), hh=0.2;
          m.position.set(q.x,y+0.14+i*(1.62/Math.max(1,bands.length-1))+(1-e2)*0.9+u*(0.5+i*0.18),q.z); m.scale.set(r,hh,r); m.rotation.y+=dt*(i%2?1.4:-1.1)*(1+u*6); m.material.opacity=0.88*e2*(1-u); });
        shell.position.set(q.x,y+0.95,q.z); shell.scale.set(0.75,1.15,0.75); shell.material.opacity=(0.1+0.05*Math.sin(h.t*5))*(1-u)*Math.min(1,h.t/0.5);
        gem.position.set(q.x,y+2.3+0.08*Math.sin(h.t*3),q.z); gem.rotation.y+=dt*2.5; gem.scale.setScalar((1-u)*Math.min(1,h.t/0.4)+0.001);
        if(u>=1) cvbStop(h);
      };
    } else if(e[2]==='embalm-end'){
      const h=CVB_EMB.get(pid); if(h&&!h.data.un) h.data.un=h.t;   // the linen unwinds as the heal lands
      if(o){ const y=cvbGy(o); spawnRingAt(o.x,y,o.z,3.2,0x6fd6c8); fxpFlare(o.x,y+1,o.z,0x6fd6c8,3,0.45); fxpSparks(o.x,y+0.6,o.z,0xd4a83a,14,3,{up:3,g:-1});
        if(L) for(let i=0;i<sslN(8);i++) ssEmit(L,o.x+AR(-0.5,0.5),y+0.3,o.z+AR(-0.5,0.5),{sh:'glint',c:3,v:[0,AR(1,2.4),0],life:1.1,g:0});
        cvbTone(o.x,o.z,{type:'sine',freq:660,freq2:990,dur:0.5,vol:0.06}); }
    }
  }
});

/* ---- Ogden's Night Shift (water): a grave-water ring marks how far a kill raises a hand; wisps count the hands left; each hand claws up from where the foe fell and drags the nearest enemy down ---- */
function cvbGraveHand(x,z,tid,owner){
  const L=cvbLook('ogden'), m=MON_BY_ID.get(tid), gy=getH(x,z), h=cvbRun(1.7,null,null), NS=9, segs=[];
  for(let i=0;i<NS;i++){ const s=new THREE.Mesh(CVB_TUBE,i%3===2?CVB_MATS.mold:CVB_MATS.bone); cvbAdd(h,s); segs.push(s); }
  const palm=new THREE.Mesh(CVB_ORB,CVB_MATS.bone); palm.scale.setScalar(2.4); cvbAdd(h,palm);
  const fing=[]; for(let i=0;i<4;i++){ const s=new THREE.Mesh(CVB_TUBE,CVB_MATS.bone); cvbAdd(h,s); fing.push(s); }
  const mound=cvbDiscMesh(0x3a2c1e,0.8); mound.material.blending=THREE.NormalBlending; cvbAdd(h,mound); const glow=cvbRingMesh(0x4fd0c0,0.8); cvbAdd(h,glow);
  fxxDust(x,gy,z,6,1.6,0x4a3a2a); spawnRingAt(x,gy,z,1.8,0x4fd0c0); if(L) sslBurst(L,x,gy+0.4,z,8,2.4); cvbNoise(x,z,{filter:'lowpass',ff:500,dur:0.3,vol:0.1}); cvbTone(x,z,{type:'sawtooth',freq:90,freq2:140,dur:0.45,vol:0.05,filter:'lowpass',ff:500});
  h.tick=(h,dt,k)=>{
    const tx=m&&!m.dead?m.x:x+1, tz=m&&!m.dead?m.z:z, ty=m&&!m.dead?m.y+m.T.height*m.s*0.2+0.3:gy+0.5;
    const rise=Math.min(1,h.t/0.5), grip=Math.min(1,Math.max(0,(h.t-0.5)/0.25)), pull=Math.max(0,(h.t-1.05)/0.6), er=rise*(2-rise), g=1-pull*pull;
    const tipx=x+(tx-x)*er*g, tipz=z+(tz-z)*er*g, tipy=gy+0.1+(ty-gy-0.1)*er*g+Math.sin(er*Math.PI)*2.1*(1-grip*0.6);
    const dist=Math.hypot(tipx-x,tipz-z), bulge=Math.min(1.6,0.5+dist*0.18);
    let px=x, py=gy+0.05, pz=z;
    for(let i=0;i<NS;i++){ const u=(i+1)/NS, qx=x+(tipx-x)*u+Math.sin(h.t*5+i)*0.05, qz=z+(tipz-z)*u, qy=gy+0.05+(tipy-gy-0.05)*u+Math.sin(u*Math.PI)*bulge*(1-grip*0.5)*(0.3+0.7*er);
      cvbSeg(segs[i],px,py,pz,qx,qy,qz,0.13-0.05*u); px=qx; py=qy; pz=qz; }
    palm.position.set(tipx,tipy,tipz);
    fing.forEach((s,i)=>{ const a=i/4*TAU+h.t*0.3, curl=1-grip*0.75; cvbSeg(s,tipx,tipy,tipz,tipx+Math.cos(a)*0.4*curl,tipy-0.08-0.3*grip+Math.sin(h.t*8+i)*0.04*(1-grip),tipz+Math.sin(a)*0.4*curl,0.045); });
    mound.position.set(x,gy+0.09,z); mound.scale.setScalar(0.9*Math.min(1,h.t/0.2)*Math.max(0.01,1-pull)); cvbFlat(glow,x,z,1.0+0.5*Math.sin(h.t*7),0.1); glow.material.opacity=0.8*(1-k);
    if(grip>0&&grip<1&&!h.data.g){ h.data.g=1; if(m){ spawnRingAt(m.x,m.y,m.z,m.T.rad*m.s+1,0x4fd0c0); fxpFlare(tipx,tipy,tipz,0x4fd0c0,2.2,0.35); } cvbTone(tx,tz,{type:'square',freq:140,freq2:60,dur:0.2,vol:0.05,filter:'lowpass',ff:700}); }
    if(L&&grip>=1&&pull<1&&Math.random()<dt*14*SSL_Q) ssEmit(L,tx+AR(-0.4,0.4),ty+AR(0,1.2),tz+AR(-0.4,0.4),{sh:Math.random()<0.5?'drop':'chaff',c:Math.random()<0.5?2:0,v:[0,AR(0.5,1.4),0],life:AR(0.7,1.1),g:-0.2});   // rot rises off the one it holds
  };
}
cvbDef('nightshift',{
  cast(p,ab){
    const L=cvbLook('ogden'), pid=cvbPid(p), gy=getH(p.x,p.z), S=ab.fx.shift, R=S.r, old=CVB_SHIFT.get(pid); if(old) cvbStop(old.h);
    const s={h:null,left:S.max}, h=cvbRun(S.dur+0.2,null,()=>{ if(CVB_SHIFT.get(pid)===s) CVB_SHIFT.delete(pid); }); s.h=h; CVB_SHIFT.set(pid,s);
    const ring=cvbRingMesh(0x4fd0c0,0.6), ring2=cvbRingMesh(0xe5e0c8,0.3), orbs=[]; cvbAdd(h,ring); cvbAdd(h,ring2);
    for(let i=0;i<S.max;i++){ const m=cvbMesh(CVB_ORB,new THREE.MeshBasicMaterial({color:0x4fd0c0,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false})); m.scale.setScalar(1.6); cvbAdd(h,m); orbs.push(m); }
    if(L) sslDecal(L,p.x,p.z,R,{life:S.dur,keep:true,r0:0.1,op:0.5,spin:0.3,follow:()=>cvbWho(pid)});
    spawnRingAt(p.x,gy,p.z,R*0.7,0x4fd0c0); spawnRingAt(p.x,gy+0.2,p.z,R*0.4,0xe5e0c8); if(L) sslBurst(L,p.x,gy+0.8,p.z,14,3);
    h.tick=(h,dt,k)=>{ const q=cvbWho(pid); if(!q){ cvbStop(h); return; } const y=cvbGy(q), grow=Math.min(1,h.t/0.4), fade=Math.min(1,(h.dur-h.t)/0.6);
      cvbFlat(ring,q.x,q.z,R*grow*fade+0.01,0.1); ring.material.opacity=(0.4+0.2*Math.sin(h.t*3))*fade; cvbFlat(ring2,q.x,q.z,R*0.97*grow*fade+0.01,0.11);
      orbs.forEach((m,i)=>{ m.visible=i<s.left; const a=h.t*1.5+i/orbs.length*TAU; m.position.set(q.x+Math.sin(a)*0.9,y+1.2+Math.sin(h.t*2+i)*0.12,q.z+Math.cos(a)*0.9); });
      if(L&&Math.random()<dt*5*SSL_Q){ const a=AR(0,TAU); ssEmit(L,q.x+Math.sin(a)*R,y+0.2,q.z+Math.cos(a)*R,{sh:'bubble',c:4,v:[0,AR(0.6,1.4),0],life:AR(0.9,1.4),g:0}); } };
    cvbTone(p.x,p.z,{type:'sawtooth',freq:110,freq2:80,dur:0.7,vol:0.05,filter:'lowpass',ff:600}); cvbNoise(p.x,p.z,{filter:'bandpass',ff:500,dur:0.5,vol:0.07});
  },
  event(e){
    if(e[0]!=='cvhand') return;
    const s=CVB_SHIFT.get(e[4]); if(s&&s.left>0){ s.left--; const q=cvbWho(e[4]); if(q) fxpFlare(q.x,cvbGy(q)+1.2,q.z,0x4fd0c0,1.6,0.3); }   // one of the caster's wisps is spent
    cvbGraveHand(+e[1],+e[2],e[3],e[4]);
  }
});
