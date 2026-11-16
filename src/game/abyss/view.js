//@ The Abyss's tile look (B7): a land patch or cave chunk floating in the rift's void: ground tinted per tile, rock under the rim, a handful of low-poly props of its land, the tears and the landing, the rift sky and shards around
/* agent map (docs/ABYSS.md section 3f)
   exports: abTileViewBuild(R) (dungeon/view.js dgViewBuild hook: a run with R.tile), abTileLookTune(L,R) (dungeon/look.js dgLookEnter hook, after riftLookTune), AB_PROP_DRAW (one drawer per AB_PROP_KINDS name)
   users: the hooks above (each marked `// abyss:`); everything goes into DG_VIEW (group, geos, mats) so dgViewClear takes it all down; the sky, the shards and their tick are the rift's (rift/view.js riftSkyBuild, riftShardsBuild, riftViewTick)
   test: tools/client-smoke.js (the Abyss tiles case: every tile builds, no throw, meshes are merged vertex-coloured geometry: no InstancedMesh, so no instanceColor to forget)
   Cheap on a phone: one merged mesh for the lit ground, rock and props, one for the glowing bits (pools, crystals, embers, tears), the sky sphere and one for the shards. Props are decoration only (the server never sees them): they stay
   8 m from the landing and 3 m from the rim, and there are 12 on a phone, 22 elsewhere. A pillar of the layout (a solid enclosed by open ground) is drawn as a rock stack. */
const AB_EDGE=2.4;   // how thick the island is at its rim (m)
const abpC=(h,k)=>new THREE.Color(h).multiplyScalar(k).getHex();
const AB_PROP_DRAW={
  tree(A,x,z,r,T){ const h=3+r()*2; dgvPut(A.lit,dgvCyl(0.18,0.3,h,6),x,h/2,z,{col:0x5a4028}); dgvPut(A.lit,dgvBall(1.5+r()*0.6,7,5),x,h+0.6,z,{sy:0.85,col:abpC(T.ground2,0.8),va:0.15}); },
  pine(A,x,z,r,T){ const h=3.5+r()*2.5; dgvPut(A.lit,dgvCyl(0.14,0.22,1,5),x,0.5,z,{col:0x4a3a2a}); for(let i=0;i<3;i++) dgvPut(A.lit,new THREE.ConeGeometry(1.5-i*0.4,h*0.45,7),x,1+i*h*0.27+h*0.2,z,{col:i?0xeef4f8:abpC(T.ground,0.35),va:0.1}); },
  palm(A,x,z,r,T){ const h=3.6+r()*1.6, a=r()*TAU; dgvPut(A.lit,dgvCyl(0.12,0.2,h,5),x,h/2,z,{rz:(r()-0.5)*0.25,col:0x8a6a40}); for(let i=0;i<5;i++) dgvPut(A.lit,dgvBox(2.2,0.06,0.5),x+Math.sin(a+i*1.26)*0.9,h,z+Math.cos(a+i*1.26)*0.9,{ry:a+i*1.26+Math.PI/2,rz:0.4,col:abpC(T.ground2,0.85)}); },
  bush(A,x,z,r,T){ for(let i=0;i<2;i++) dgvPut(A.lit,dgvBall(0.7+r()*0.4,6,4),x+(r()-0.5)*0.8,0.5,z+(r()-0.5)*0.8,{sy:0.8,col:abpC(i?T.ground2:T.ground,0.9),va:0.2}); },
  tuft(A,x,z,r,T){ for(let i=0;i<4;i++) dgvPut(A.lit,new THREE.ConeGeometry(0.1,0.7+r()*0.5,4),x+(r()-0.5)*0.6,0.4,z+(r()-0.5)*0.6,{rx:(r()-0.5)*0.4,rz:(r()-0.5)*0.4,col:abpC(T.ground2,0.9)}); },
  rock(A,x,z,r,T){ const s=0.7+r()*0.9; dgvPut(A.lit,dgvRock(s,1),x,s*0.4,z,{sy:0.7,ry:r()*TAU,col:abpC(T.rim,1.5),va:0.2,foot:0.3}); },
  crystal(A,x,z,r,T){ for(let i=0;i<3;i++){ const h=1.2+r()*1.6; dgvPut(A.glow,new THREE.ConeGeometry(0.28+r()*0.2,h,5),x+(r()-0.5)*1.1,h/2,z+(r()-0.5)*1.1,{rx:(r()-0.5)*0.4,rz:(r()-0.5)*0.4,col:T.chip,va:0.2}); } },
  cactus(A,x,z,r){ const h=1.8+r()*1.2; dgvPut(A.lit,dgvCyl(0.25,0.3,h,6),x,h/2,z,{col:0x4a7a3a}); dgvPut(A.lit,dgvCyl(0.15,0.15,0.9,5),x+0.5,h*0.6,z,{rz:Math.PI/2.6,col:0x4a7a3a}); dgvPut(A.lit,dgvBall(0.26,5,4),x,h,z,{col:0x5a8a48}); },
  stalagmite(A,x,z,r,T){ for(let i=0;i<3;i++){ const h=1+r()*2.2; dgvPut(A.lit,new THREE.ConeGeometry(0.4+r()*0.3,h,6),x+(r()-0.5)*1.4,h/2,z+(r()-0.5)*1.4,{col:abpC(T.rim,1.8),va:0.2}); } },
  mushroom(A,x,z,r,T){ const h=0.8+r()*0.9; dgvPut(A.lit,dgvCyl(0.1,0.14,h,5),x,h/2,z,{col:0xd8d0c0}); dgvPut(A.glow,dgvDome(0.5+r()*0.4),x,h,z,{col:T.chip,va:0.1}); },
  pool(A,x,z,r,T){ dgvPut(A.glow,dgvDisc(1.2+r()*1.2,14),x,0.04,z,{col:abpC(T.chip,0.55),va:0.06}); },
  ember(A,x,z,r){ dgvPut(A.glow,dgvDisc(0.9+r()*0.6,10),x,0.04,z,{col:0xa83a10,va:0.1}); for(let i=0;i<3;i++) dgvPut(A.glow,dgvBall(0.12,4,3),x+(r()-0.5)*1.2,0.2+r()*0.8,z+(r()-0.5)*1.2,{col:0xff9a30}); },
  grave(A,x,z,r,T){ const h=0.9+r()*0.5; dgvPut(A.lit,dgvBox(0.7,h,0.18),x,h/2,z,{ry:(r()-0.5)*0.5,rz:(r()-0.5)*0.15,col:abpC(T.ground2,1.7),va:0.12}); },
  pillar(A,x,z,r,T){ const h=1.5+r()*2.5; dgvPut(A.lit,dgvCyl(0.5,0.6,h,7),x,h/2,z,{rx:(r()-0.5)*0.12,col:abpC(T.ground2,1.4),va:0.12}); },
  shell(A,x,z,r){ dgvPut(A.lit,dgvBall(0.5+r()*0.3,7,4),x,0.22,z,{sy:0.45,ry:r()*TAU,col:0xf0d8c8,va:0.12}); },
  ice(A,x,z,r,T){ for(let i=0;i<3;i++){ const h=1.2+r()*2; dgvPut(A.glow,new THREE.ConeGeometry(0.3+r()*0.25,h,5),x+(r()-0.5)*1.2,h/2,z+(r()-0.5)*1.2,{rx:(r()-0.5)*0.3,rz:(r()-0.5)*0.3,col:abpC(T.chip,0.8),va:0.15}); } },
};
function abTileViewBuild(R){
  const TL=abTileOf(abTileBase(R.tile)), B=R.B; if(!TL||!B) return riftViewBuild(R);   // (B9: 'boss:<tile>' is the land's boss disc)   // (no tile: the rift's plain platforms)
  dgViewClear();
  const T=R.T, au=T.aura.map(h=>new THREE.Color(h)), W=B.w, H=B.h, tn=TL.tint, lay=R.lay||abLayout(R.tile,R.seed), mid=lay.mid;
  const g=new THREE.Group(); g.position.set(R.ox,R.y,R.oz); g.name='abtile'; scene.add(g); DG_VIEW.g=g;
  const open=(gx,gz)=>gx>=0&&gz>=0&&gx<W&&gz<H&&!!B.cells[gz*W+gx], rng=mulberry32((R.seed|0)^0x7a11), A={lit:dgvAcc(),glow:dgvAcc()};
  const c1=new THREE.Color(tn.ground), c2=new THREE.Color(tn.ground2), rim=new THREE.Color(tn.rim), cT=new THREE.Color();
  // the void is the closed cells you can reach from the grid's border; a closed cell inside the island is a pillar of the layout
  const vd=new Uint8Array(W*H), st=[]; for(let i=0;i<W;i++) st.push(i,(H-1)*W+i); for(let i=0;i<H;i++) st.push(i*W,i*W+W-1);
  while(st.length){ const i=st.pop(); if(B.cells[i]||vd[i]) continue; vd[i]=1; const x=i%W, z=(i-x)/W; if(x>0) st.push(i-1); if(x<W-1) st.push(i+1); if(z>0) st.push(i-W); if(z<H-1) st.push(i+W); }
  const isVoid=(gx,gz)=>gx<0||gz<0||gx>=W||gz>=H||!!vd[gz*W+gx];
  // the top: a quad per open cell, two ground colours in soft patches
  for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){
    if(!open(gx,gz)) continue; const x0=gx*DG_CELL, z0=gz*DG_CELL, x1=x0+DG_CELL, z1=z0+DG_CELL;
    for(const [x,z] of [[x0,z0],[x0,z1],[x1,z1],[x0,z0],[x1,z1],[x1,z0]]){
      const n=noise2(x*0.07,z*0.07), k=0.9+dgvHash(x,z)*0.2; cT.copy(c1).lerp(c2,clamp(0.5+n*1.1)); A.lit.p.push(x,0,z); A.lit.n.push(0,1,0); A.lit.c.push(cT.r*k,cT.g*k,cT.b*k);
    }
  }
  // the rim: a rock face going down along every edge over the void
  for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){
    if(!open(gx,gz)) continue;
    for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]){
      if(!isVoid(gx+dx,gz+dz)) continue;
      const ex=(gx+0.5)*DG_CELL+dx, ez=(gz+0.5)*DG_CELL+dz, ax=ex+dz, az=ez-dx, bx=ex-dz, bz=ez+dx;
      for(const [x,y,z,k] of [[ax,0,az,1],[bx,0,bz,1],[bx,-AB_EDGE,bz,0.5],[ax,0,az,1],[bx,-AB_EDGE,bz,0.5],[ax,-AB_EDGE,az,0.5]]){ A.lit.p.push(x,y,z); A.lit.n.push(dx,0,dz); A.lit.c.push(rim.r*k,rim.g*k,rim.b*k); }
    }
  }
  // under the island: hanging rock, the longest in the middle
  { const cx=lay.isles[0].x, cz=lay.isles[0].z, rr=lay.isles[0].r;
    for(let i=0;i<(LOW?5:8);i++){ const a=rng()*TAU, d=i?rng()*rr*0.7:0, len=(i?5+rng()*7:12+rng()*4)*(rr/36);
      dgvPut(A.lit,new THREE.ConeGeometry(1+rng()*1.8,len,6).rotateX(Math.PI),cx+Math.sin(a)*d,-AB_EDGE-len/2+0.3,cz+Math.cos(a)*d,{ry:rng()*TAU,col:abpC(tn.rim,0.9),va:0.15}); } }
  // the pillars of the layout: a rock stack on each enclosed solid
  { const seen=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++){ if(B.cells[i]||vd[i]||seen[i]) continue; const comp=[], q=[i]; seen[i]=1;
      while(q.length){ const j=q.pop(); comp.push(j); const x=j%W, z=(j-x)/W; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, nz=z+dz, k=nz*W+nx; if(nx>=0&&nz>=0&&nx<W&&nz<H&&!B.cells[k]&&!vd[k]&&!seen[k]){ seen[k]=1; q.push(k); } } }
      let sx=0, sz=0; for(const j of comp){ sx+=j%W; sz+=Math.floor(j/W); } sx=(sx/comp.length+0.5)*DG_CELL; sz=(sz/comp.length+0.5)*DG_CELL; const rr=Math.sqrt(comp.length)*DG_CELL*0.62;
      dgvPut(A.lit,dgvRock(rr,1),sx,rr*0.9,sz,{sy:1.5,ry:rng()*TAU,col:abpC(tn.rim,1.6),va:0.2,foot:0.3}); dgvPut(A.lit,dgvRock(rr*0.6,1),sx+rr*0.3,rr*1.9,sz,{sy:1.2,ry:rng()*TAU,col:abpC(tn.rim,1.9),va:0.2}); } }
  // the props of the tile's land: scattered on open ground away from the landing, the tears and the rim
  { const sp=B.start, tears=B.marks.S, n=LOW?12:22; let tries=0, done=0;
    while(done<n&&tries++<400){
      const gx=Math.floor(rng()*W), gz=Math.floor(rng()*H); if(!open(gx,gz)) continue; const x=(gx+0.5)*DG_CELL, z=(gz+0.5)*DG_CELL;
      if(sp&&Math.hypot(x-sp.x,z-sp.z)<8) continue; if(tears.some(s=>Math.hypot(x-s.x,z-s.z)<5)) continue;
      let ok=true; for(let dz=-2;dz<=2&&ok;dz++) for(let dx=-2;dx<=2;dx++) if(!open(gx+dx,gz+dz)){ ok=false; break; }   // 3 m of ground all round: nothing hangs over the rim or a pillar
      if(!ok) continue;
      AB_PROP_DRAW[TL.props[done%TL.props.length]](A,x,z,rng,tn); done++; }
  }
  // the tears the waves come through: a dark crack of light in a ring
  for(const s of B.marks.S){ const face=Math.atan2(s.x-mid.x,s.z-mid.z);
    dgvPut(A.glow,new THREE.TorusGeometry(1.4,0.12,5,18),s.x,2.2,s.z,{ry:face+Math.PI/2,sy:1.6,col:au[2].getHex(),va:0.05});
    dgvPut(A.glow,new THREE.PlaneGeometry(0.5,3.6),s.x,2.2,s.z,{ry:face+Math.PI/2,col:0xfff0ff,va:0.02});
    dgvPut(A.glow,dgvRing(1.3,1.6,20),s.x,0.02,s.z,{col:au[1].getHex(),va:0.05}); }
  // the landing: the dungeons' portal shape in the rift's colours
  const sp=B.start; if(sp){ dgvPut(A.glow,new THREE.TorusGeometry(1.7,0.17,6,20,Math.PI),sp.x,0.2,sp.z,{col:au[0].getHex(),va:0.05}); dgvPut(A.glow,dgvRing(2.0,2.3,28),sp.x,0.02,sp.z,{col:au[1].getHex(),va:0.02}); }
  DG_VIEW.anchors=[{x:sp?sp.x:mid.x,z:sp?sp.z:mid.z,y:2,col:0xb8c8ff,i:0.8,r:12,skip:0,dyn:true},...B.marks.S.map(s=>({x:s.x,z:s.z,y:2,col:T.aura[2],i:0.7,r:9,skip:0,dyn:true}))];
  DG_VIEW.surfMat=new THREE.MeshPhongMaterial({vertexColors:true,shininess:12,specular:0x222222,emissive:0x0c0818}); DG_VIEW.mats.push(DG_VIEW.surfMat); dgvMesh(A.lit,DG_VIEW.surfMat,'tile');
  DG_VIEW.glowMat=new THREE.MeshBasicMaterial({vertexColors:true}); DG_VIEW.mats.push(DG_VIEW.glowMat); dgvMesh(A.glow,DG_VIEW.glowMat,'tileglow');
  riftSkyBuild(g,au); riftShardsBuild(g,au,rng,mid);   // the rift's void around
}
// the light of a tile: the rift's, leaned toward the tile's own fog and ground colour (dgLookEnter, after riftLookTune)
function abTileLookTune(L,R){
  const TL=abTileOf(abTileBase(R.tile)); if(!TL) return; const cave=TL.kind==='cave';
  L.fog.lerp(new THREE.Color(TL.tint.fog),cave?0.55:0.35); L.hg.lerp(new THREE.Color(TL.tint.ground),0.3);
  if(cave){ L.hi=0.8; L.sunI=0.3; L.hs.multiplyScalar(0.8); }
}
