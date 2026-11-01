//@ The aura's extra effects (the fx field of COS_AURAS): ground patterns (heart, pentagram, lotus, ripples, sun rays), a pillar of light and a glowing outline hugging the body; cosAuraFx builds them, the aura's own animation calls the returned function
/* fx is a space-separated list in the aura row's 12th field: 'g:heart' 'g:pent' 'g:lotus' 'g:ripple' 'g:rays' (one flat pattern on the ground), 'pillar', 'outline'. They combine with any particle style
   (cosmetics.js cosBuildAura: orbit, rise, fall, spiral, swirl, burst, drift). All are additive unlit meshes; the outline is a second copy of each body mesh pushed out along its normals (BackSide),
   so it follows every pose; it and the pillar are skipped on a phone (LOW / LITE). used by: cosmetics.js (cosBuildAura). test: tools/revamp-smoke.js */
const COS_OUT_MATS={};
// a closed outline strip (a ring of width 2*w) through the points pts [[x,z],...]
function cosStrip(pts,w){ const pos=[], n=pts.length;
  for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n];
    const ao=[a[0]*(1+w),a[1]*(1+w)], ai=[a[0]*(1-w),a[1]*(1-w)], bo=[b[0]*(1+w),b[1]*(1+w)], bi=[b[0]*(1-w),b[1]*(1-w)];
    pos.push(ao[0],0,ao[1],ai[0],0,ai[1],bo[0],0,bo[1], ai[0],0,ai[1],bi[0],0,bi[1],bo[0],0,bo[1]); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); return g; }
// a flat thin bar from (x0,z0) to (x1,z1)
function cosBar(x0,z0,x1,z1,w){ const dx=x1-x0, dz=z1-z0, L=Math.hypot(dx,dz)||1, nx=-dz/L*w, nz=dx/L*w;
  return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([x0+nx,0,z0+nz,x0-nx,0,z0-nz,x1+nx,0,z1+nz, x0-nx,0,z0-nz,x1-nx,0,z1-nz,x1+nx,0,z1+nz],3)); }
function cosGroundGeo(kind){
  const key='g_'+kind; if(COS_GEO[key]) return COS_GEO[key];
  let g;
  if(kind==='heart'){ const pts=[]; for(let i=0;i<72;i++){ const t=i/72*TAU; pts.push([16*Math.pow(Math.sin(t),3)/17*0.8, -(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)+6)/17*0.8]); }   // (z up = the heart's point faces forward)
    g=cosStrip(pts,0.07); }
  else if(kind==='pent'){ const v=[]; for(let i=0;i<5;i++){ const a=i/5*TAU; v.push([Math.sin(a)*0.85,Math.cos(a)*0.85]); }
    const q=[]; for(let i=0;i<5;i++){ const a=v[i], b=v[(i+2)%5]; q.push(cosBar(a[0],a[1],b[0],b[1],0.012)); }
    const c=[]; for(let i=0;i<48;i++){ const t=i/48*TAU; c.push([Math.sin(t)*0.85,Math.cos(t)*0.85]); } q.push(cosStrip(c,0.04));
    g=cosJoin(q); }
  else if(kind==='lotus'){ const q=[]; for(let ring=0;ring<2;ring++) for(let i=0;i<8;i++){ const a=i/8*TAU+ring*TAU/16, r=ring?0.4:0.6, L=ring?0.28:0.42;
      const p=new THREE.CircleGeometry(1,10).scale(0.13,L,1).rotateX(-Math.PI/2).translate(0,0,r).rotateY(a); q.push(p); }
    g=cosJoin(q); }
  else if(kind==='rays'){ const q=[]; for(let i=0;i<14;i++){ const a=i/14*TAU, r0=0.5, r1=i%2?0.85:1.05, w=0.05;
      q.push(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([Math.sin(a-w)*r0,0,Math.cos(a-w)*r0, Math.sin(a+w)*r0,0,Math.cos(a+w)*r0, Math.sin(a)*r1,0,Math.cos(a)*r1],3))); }
    g=cosJoin(q); }
  else g=new THREE.RingGeometry(0.97,1,40).rotateX(-Math.PI/2);   // ripple
  return COS_GEO[key]=g;
}
// the pillar: ten thin vertical bars round the body, bright at the foot and fading to nothing at the top (vertex colours on an additive material)
function cosPillarGeo(){
  if(COS_GEO.pillar) return COS_GEO.pillar;
  const pos=[], col=[], H=2.6; for(let i=0;i<10;i++){ const a=i/10*TAU, x=Math.sin(a)*0.62, z=Math.cos(a)*0.62, dx=Math.cos(a)*0.035, dz=-Math.sin(a)*0.035;
    pos.push(x-dx,0,z-dz, x+dx,0,z+dz, x-dx,H,z-dz, x+dx,0,z+dz, x+dx,H,z+dz, x-dx,H,z-dz); col.push(1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); return COS_GEO.pillar=g;
}
// the outline material: a BackSide copy pushed out along the normal (a fixed 2.2 cm), additive and pulsing; one per colour
function cosOutMat(col){
  if(COS_OUT_MATS[col]) return COS_OUT_MATS[col];
  const m=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.55,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide});
  m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed += normalize(normal)*0.022;'); };
  return COS_OUT_MATS[col]=m;
}
// builds the fx of one aura into group g; returns f(t) for the aura's animation (or null)
function cosAuraFx(rig,X,def,g,cheap){
  const fx=(def.fx||'').split(' ').filter(Boolean), subs=[];
  for(const f of fx){
    if(f.indexOf('g:')===0){ const kind=f.slice(2);
      if(kind==='ripple'){ const ms=[0,1,2].map(i=>{ const m=new THREE.Mesh(cosGroundGeo('ripple'),cosMat(def.col).clone()); m.position.y=0.03; m.frustumCulled=false; g.add(m); return m; });
        subs.push(t=>{ ms.forEach((m,i)=>{ const u=(t*0.28+i/3)%1; m.scale.setScalar(0.3+0.85*u); m.material.opacity=0.8*(1-u); }); }); }
      else { const m=new THREE.Mesh(cosGroundGeo(kind),cosMat(kind==='rays'?def.col2:def.col)); m.position.y=0.035; m.frustumCulled=false; g.add(m);
        subs.push(t=>{ if(kind==='heart'){ const b=1+0.07*Math.pow(Math.max(0,Math.sin(t*3.2)),3); m.scale.set(b,1,b); } else m.rotation.y=t*(kind==='lotus'?-0.3:kind==='rays'?0.25:0.4); if(kind==='pent'||kind==='rays') m.scale.setScalar(1+0.04*Math.sin(t*2)); }); } }
    else if(f==='pillar'&&!cheap){ const m=new THREE.Mesh(cosPillarGeo(),new THREE.MeshBasicMaterial({vertexColors:true,color:def.col,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); m.frustumCulled=false; g.add(m);
      subs.push(t=>{ m.rotation.y=t*0.5; m.material.opacity=0.38+0.14*Math.sin(t*1.7); }); }
    else if(f==='outline'&&!cheap){ const mat=cosOutMat(def.col), meshes=[]; rig.root.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.normal&&!o.isInstancedMesh&&o.material&&!o.material.transparent&&o.parent!==g) meshes.push(o); });
      for(const o of meshes){ const c=new THREE.Mesh(o.geometry,mat); c.frustumCulled=false; c.renderOrder=2; o.add(c); }
      subs.push(t=>{ mat.opacity=0.45+0.2*Math.sin(t*2.4); }); }
  }
  return subs.length?t=>{ for(const f of subs) f(t); }:null;
}
