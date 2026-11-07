//@ The rift's void world on the client: frosted glass platforms and clear glass bridges with glowing rims, crystals hanging under them, the tears the waves come through, the hub's portal, an aura sky of drifting blue / purple / pink veils, floating shards, the light and fog, the music
/* agent map
   exports: riftViewBuild(R) (dungeon/view.js dgViewBuild hook: a run whose theme is a rift), riftViewTick(dt) (dgViewTick hook), riftLookTune(L,R) (dungeon/look.js dgLookEnter hook), RIFT_VIEW, THEMES.rift
   users: the hooks above (each marked `// rift:`); everything built goes into DG_VIEW (its group, geos, mats), so dgViewClear takes it all down on leaving
   test: tools/client-smoke.js (the rift case: the view builds, the sky follows the camera, everything is cleared on leaving)
   Bright, but still a void: nothing below or around but the aura. The sky is one sphere (fog off, drawn first) with a small shader: blue overhead, violet at the horizon, pink veils drifting through
   it, a deep violet below with slow points of light; it follows the camera. The platforms are opaque frosted glass (no sorting cost), the bridges see-through. Light: a bright blue-violet sky
   light over a pink ground light (the hemisphere), a lavender sun; fog fades only what is far into the aura's violet. Cheap on a phone: two draw calls for the platforms, one for the rims and
   tears, one for the hanging crystals, one for the shards, one for the sky. */
const RIFT_VIEW={sky:null,shards:null,t:0};
const RIFT_EDGE=1.6;   // how thick the platforms are at their rims (m)
function riftViewBuild(R){
  dgViewClear(); const B=R.B; if(!B) return;
  const T=R.T, au=T.aura.map(h=>new THREE.Color(h)), W=B.w, H=B.h;
  const g=new THREE.Group(); g.position.set(R.ox,R.y,R.oz); g.name='rift'; scene.add(g); DG_VIEW.g=g;
  const open=(gx,gz)=>gx>=0&&gz>=0&&gx<W&&gz<H&&!!B.cells[gz*W+gx];
  const C=DG_TILE/2, centres=[[1,1,16],[1,0,12],[2,1,12],[1,2,12],[0,1,12]].map(([tx,tz,r])=>({x:tx*DG_TILE+C,z:tz*DG_TILE+C,r}));
  const onIsle=(x,z)=>centres.some(c=>Math.hypot(x-c.x,z-c.z)<=c.r+0.6);   // a platform cell, not a bridge
  const A={lit:dgvAcc(),glow:dgvAcc(),soft:dgvAcc(),bridge:dgvAcc()}, rng=mulberry32(0x51f7);
  const pale=new THREE.Color(0xe6dcff), pale2=new THREE.Color(0xcfe0ff), pink=new THREE.Color(0xffd6f0), side=au[1].clone().lerp(new THREE.Color(0x30205a),0.35), cTmp=new THREE.Color();
  // the tops: a quad per open cell, frosted glass with soft patches of blue and pink and a few brighter cracked cells
  for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){
    if(!open(gx,gz)) continue;
    const x0=gx*DG_CELL, z0=gz*DG_CELL, x1=x0+DG_CELL, z1=z0+DG_CELL, isle=onIsle(x0+1,z0+1), Acc=isle?A.lit:A.bridge;
    for(const [x,z] of [[x0,z0],[x0,z1],[x1,z1],[x0,z0],[x1,z1],[x1,z0]]){
      const n=noise2(x*0.06,z*0.06), n2=noise2(x*0.05+40,z*0.05-17);
      cTmp.copy(pale).lerp(pale2,clamp(0.5+n*0.9)).lerp(pink,clamp(n2*0.8)); const k=(0.92+dgvHash(x,z)*0.12)*0.58;   // (pale glass under a bright light: the colours are kept low so it does not burn out to white)
      Acc.p.push(x,0,z); Acc.n.push(0,1,0); Acc.c.push(cTmp.r*k,cTmp.g*k,cTmp.b*k);
    }
    if(isle&&rng()<0.05){ const a=rng()*Math.PI, l=0.8+rng()*1.4, cx=x0+1, cz=z0+1;   // a hairline crack that glows
      dgvPut(A.glow,dgvBox(l,0.02,0.06),cx,0.012,cz,{ry:a,col:au[rng()*3|0].getHex(),va:0.05}); }
  }
  // the rims: a glowing strip along every edge over the void and a frosted face going down
  for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){
    if(!open(gx,gz)) continue;
    for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]){
      if(open(gx+dx,gz+dz)) continue;
      const ex=(gx+0.5)*DG_CELL+dx, ez=(gz+0.5)*DG_CELL+dz, ax=ex+dz, az=ez-dx, bx=ex-dz, bz=ez+dx, Acc=onIsle(ex,ez)?A.lit:A.bridge;
      for(const [x,y,z,k] of [[ax,0,az,0.9],[bx,0,bz,0.9],[bx,-RIFT_EDGE,bz,0.45],[ax,0,az,0.9],[bx,-RIFT_EDGE,bz,0.45],[ax,-RIFT_EDGE,az,0.45]]){
        Acc.p.push(x,y,z); Acc.n.push(dx,0,dz); Acc.c.push(side.r*k*1.4,side.g*k*1.4,side.b*k*1.4); }
      const col=au[(gx+gz)%3].getHex();
      dgvPut(A.glow,dgvBox(dz?DG_CELL:0.14,0.1,dx?DG_CELL:0.14),ex,0.03,ez,{col,va:0.05});
    }
  }
  // under each platform: a cluster of hanging crystals, the longest in the middle
  for(const c of centres){ const n=c.r>12?9:6;
    for(let i=0;i<n;i++){ const a=rng()*TAU, d=i?rng()*c.r*0.7:0, len=(i?4+rng()*6:10+rng()*4)*(c.r/14);
      dgvPut(A.soft,new THREE.ConeGeometry(0.8+rng()*1.6,len,5).rotateX(Math.PI),c.x+Math.sin(a)*d,-RIFT_EDGE-len/2+0.2,c.z+Math.cos(a)*d,{ry:rng()*TAU,col:au[i%3].clone().lerp(new THREE.Color(0xffffff),0.25).getHex(),va:0.12}); } }
  // the tears the waves come through: an upright crack of light in a ring of shards
  for(const s of B.marks.S){ const face=Math.atan2(s.x-72,s.z-72);
    dgvPut(A.glow,new THREE.TorusGeometry(1.4,0.12,5,18),s.x,2.2,s.z,{ry:face+Math.PI/2,sy:1.6,col:au[2].getHex(),va:0.05});
    dgvPut(A.glow,new THREE.PlaneGeometry(0.5,3.6),s.x,2.2,s.z,{ry:face+Math.PI/2,col:0xfff0ff,va:0.02});
    dgvPut(A.glow,dgvRing(1.3,1.6,20),s.x,0.02,s.z,{col:au[1].getHex(),va:0.05});
    for(let i=0;i<5;i++){ const a=rng()*TAU; dgvPut(A.soft,new THREE.OctahedronGeometry(0.25+rng()*0.25,0),s.x+Math.sin(a)*1.9,0.3+rng()*0.4,s.z+Math.cos(a)*1.9,{sy:1.8,ry:rng()*TAU,col:au[i%3].getHex()}); } }
  // the hub's way out: the dungeons' portal shape, in the rift's colours
  const st=B.start; if(st){ dgvPut(A.glow,new THREE.TorusGeometry(1.7,0.17,6,20,Math.PI),st.x,0.2,st.z,{col:au[0].getHex(),va:0.05});
    if(!LITE) dgvPut(A.soft,new THREE.CircleGeometry(1.6,20,0,Math.PI),st.x,0.2,st.z,{col:0xe8e0ff,va:0.02});
    dgvPut(A.glow,dgvRing(2.0,2.3,28),st.x,0.02,st.z,{col:au[1].getHex(),va:0.02}); dgvPut(A.glow,dgvRing(5.6,5.8,40),st.x,0.02,st.z,{col:au[2].getHex(),va:0.02}); }
  DG_VIEW.anchors=[{x:st?st.x:72,z:st?st.z:72,y:2,col:0xb8c8ff,i:0.8,r:12,skip:0,dyn:true},...B.marks.S.map(s=>({x:s.x,z:s.z,y:2,col:T.aura[2],i:0.7,r:9,skip:0,dyn:true}))];
  // the meshes
  DG_VIEW.surfMat=new THREE.MeshPhongMaterial({vertexColors:true,shininess:70,specular:0x8a7aa8,emissive:0x140e26}); DG_VIEW.mats.push(DG_VIEW.surfMat);
  dgvMesh(A.lit,DG_VIEW.surfMat,'glass');
  const bm=new THREE.MeshPhongMaterial({vertexColors:true,shininess:90,specular:0xffffff,emissive:0x302060,transparent:true,opacity:LOW?0.85:0.62,side:THREE.DoubleSide,depthWrite:false}); DG_VIEW.mats.push(bm);
  { const m=dgvMesh(A.bridge,bm,'bridges'); if(m) m.renderOrder=2; }
  DG_VIEW.glowMat=new THREE.MeshBasicMaterial({vertexColors:true}); DG_VIEW.mats.push(DG_VIEW.glowMat); dgvMesh(A.glow,DG_VIEW.glowMat,'rims');
  const sm=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.72,depthWrite:false}); DG_VIEW.mats.push(sm); { const m=dgvMesh(A.soft,sm,'crystals'); if(m) m.renderOrder=1; }
  riftSkyBuild(g,au); riftShardsBuild(g,au,rng);
}
// the aura sky: blue overhead, violet round the horizon, pink veils drifting, a deep violet void below with slow points of light
function riftSkyBuild(g,au){
  const geo=new THREE.SphereGeometry(118,32,16), mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{uT:{value:0},uA:{value:au[0]},uB:{value:au[1]},uC:{value:au[2]}},
    vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform float uT; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; varying vec3 vD;\n'+
      'float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }\n'+
      'void main(){ vec3 d=normalize(vD); float y=d.y;\n'+
      ' vec3 top=mix(uB,uA,smoothstep(0.0,0.75,y))*1.15+vec3(0.08);\n'+
      ' vec3 low=mix(uB*0.55,vec3(0.10,0.05,0.22),smoothstep(0.0,-0.8,y));\n'+
      ' vec3 c=y>0.0?top:low;\n'+
      ' float v=sin(d.x*3.1+uT*0.07+sin(d.z*2.3-uT*0.05)*1.7)*sin(d.z*2.7-uT*0.06+d.y*3.0)*0.5+0.5;\n'+
      ' float w=sin(d.x*5.3-uT*0.11+d.y*4.0)*sin(d.z*4.1+uT*0.09)*0.5+0.5;\n'+
      ' float band=exp(-pow((y-0.15+sin(d.x*2.0+uT*0.03)*0.18)*3.2,2.0));\n'+
      ' c=mix(c,uC*1.2+vec3(0.06),pow(v,3.0)*0.75*band); c=mix(c,uA*1.25,pow(w,4.0)*0.45*(1.0-band*0.5));\n'+
      ' vec3 q=floor(d*140.0); float s=step(0.9965,h(q))*(0.6+0.4*sin(uT*1.3+h(q+1.0)*40.0)); c+=vec3(1.0,0.92,1.0)*s*(y<0.3?0.9:0.35);\n'+
      ' gl_FragColor=vec4(c,1.0); }'});
  const sky=new THREE.Mesh(geo,mat); sky.renderOrder=-10; sky.frustumCulled=false; sky.name='riftSky'; g.add(sky);
  DG_VIEW.geos.push(geo); DG_VIEW.mats.push(mat); RIFT_VIEW.sky=sky; RIFT_VIEW.t=0;
}
// glass shards drifting round the platforms at different depths (one merged mesh, the group turns slowly)
function riftShardsBuild(g,au,rng){
  const A=dgvAcc(), n=LOW?26:54;
  for(let i=0;i<n;i++){ const a=rng()*TAU, d=55+rng()*55, y=-45+rng()*75, s=0.6+rng()*2.6;
    dgvPut(A,new THREE.OctahedronGeometry(s,0),Math.sin(a)*d,y,Math.cos(a)*d,{sy:1.6+rng(),rx:rng()*3,ry:rng()*3,col:au[i%3].clone().lerp(new THREE.Color(0xffffff),0.3+rng()*0.3).getHex(),va:0.15}); }
  const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.8,depthWrite:false}); DG_VIEW.mats.push(mat);
  const sg=new THREE.Group(); sg.position.set(72,0,72); g.add(sg);
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));
  const m=new THREE.Mesh(geo,mat); m.renderOrder=1; sg.add(m); DG_VIEW.geos.push(geo); RIFT_VIEW.shards=sg;
}
function riftViewTick(dt){
  const V=RIFT_VIEW, g=DG_VIEW.g; if(!g) return; V.t+=dt;
  if(V.sky){ V.sky.position.set(camera.position.x-g.position.x,camera.position.y-g.position.y,camera.position.z-g.position.z); V.sky.material.uniforms.uT.value=V.t; }
  if(V.shards){ V.shards.rotation.y=V.t*0.012; V.shards.position.y=Math.sin(V.t*0.2)*1.5; }
}
// the light and fog of a rift (dgLookEnter: after the dungeons' own setup)
function riftLookTune(L,R){
  const au=R.T.aura;
  L.fog.setHex(au[1]).lerp(new THREE.Color(0xffffff),0.15); L.hs.setHex(au[0]).lerp(new THREE.Color(0xffffff),0.45); L.hg.setHex(au[2]).multiplyScalar(0.9); L.sun.setHex(0xf2e8ff);
  L.hi=0.95; L.sunI=0.42; L.far=L.farNow=160; L.near=30; L.gloom=false;
  if(L.torch) L.torch.color.setHex(0xe0d0ff);
}
// the rift's music: E minor, slow and glassy, a bell-like arpeggio over a soft pad; light drums from a pulse
THEMES.rift={beat:0.36,chordBars:2,chords:[[40,47,52,55,59],[36,43,48,52,55],[43,50,55,59,62],[38,45,50,54,57]],scale:[64,66,67,69,71,72,74,76,79],
  pad:{type:'triangle',vol:0.016,ff:900},drone:40,bass:'x.......',bassType:'sine',arp:{pat:'x.x.x.x.',inst:'pluck',vol:0.018,ff:2400},lead:{inst:'flute',p:0.12,oct:0},
  drums:{kick:'x...x...',snare:'........',hat:'.o.o.o.o'}};
