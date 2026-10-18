//@ Cosmetics on the character (version 3, reworked in 3.1): the cape (a curved, rippled cloth in four hinged panels with a pattern, a collar, a clasp and sometimes a shoulder cape) and the aura (shaped additive particles and a decorated ring), added to a rig by buildCharacter
/* look.cape and look.aura are ids of shared/cosmetics.js (COS_CAPE / COS_AURA); an unknown id (or a remote player's look.cape = 'constructor') draws nothing: cosDef checks own properties.
   Both are loose meshes added to the rig and moved by rig.anims (the same hook the signature outfits use: pose.js calls every function with (t, dt, mv)), so the merged body meshes are untouched.
   - the cape: four stacked panels hinged one under another. Each is a strip of cloth curved round the back (its edges come forward over the shoulders), rippled by folds, painted by cosPattern (the cape's `pat`:
     stitched leather hem, flames, stars, rays, petals, fur, ermine and crests, moss, ash, waves, dunes, gloam) with a trim band at the collar and the hem. Fixed to the body: a collar (a roll of cloth, or a fur ruff), a clasp
     with a chain at the throat, and, for the capes whose `mantle` is 1, a short shoulder cape. The hinges lean back with speed and wave a little.
   - the aura: COS_AURAS[].n particles (fewer on a phone: LOW / LITE) of the aura's `shape` that orbit the body ('orbit'), climb ('rise') or drift down ('fall'), and an optional ring on the ground with its decoration (`deco`).
   Shared geometry and one material per colour: nothing here allocates per frame. used by: model.js (buildCharacter), the editor's Cosmetics tab (ui/character-editor.js). test: tools/revamp-smoke.js */
const COS_GEO={}, COS_MATS={}, COS_HALOS={};
const cosMat=col=>COS_MATS[col]||(COS_MATS[col]=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
const cosHaloMat=col=>COS_HALOS[col]||(COS_HALOS[col]=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.22,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
const cosCapeMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
// ---- geometry helpers: plain position-only meshes for the unlit particles ----
// one geometry from several (non-indexed, positions only)
function cosJoin(list){ const parts=list.map(g=>g.index?g.toNonIndexed():g); let n=0; for(const g of parts) n+=g.attributes.position.count;
  const pos=new Float32Array(n*3); let o=0; for(const g of parts){ pos.set(g.attributes.position.array,o); o+=g.attributes.position.array.length; }
  const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); return out; }
// a flat n-pointed star in the XY plane: points at r1, valleys at r0
function cosStar(n,r0,r1){ const v=[]; for(let i=0;i<2*n;i++){ const a=i/(2*n)*TAU, r=i%2?r0:r1; v.push([Math.sin(a)*r,Math.cos(a)*r]); }
  const pos=[]; for(let i=0;i<2*n;i++){ const a=v[i], b=v[(i+1)%(2*n)]; pos.push(0,0,0,a[0],a[1],0,b[0],b[1],0); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); return g; }
// the shape of one particle of an aura (cached), pointing up (+y); its tail, if any, along +x
function cosShape(name){
  if(COS_GEO[name]) return COS_GEO[name];
  let g;
  if(name==='mote') g=new THREE.OctahedronGeometry(0.03,0);
  else if(name==='grain') g=new THREE.OctahedronGeometry(0.02,0).scale(1.4,0.8,1);
  else if(name==='drop') g=new THREE.OctahedronGeometry(0.028,0).scale(0.7,1.8,0.7);
  else if(name==='flame') g=cosJoin([new THREE.ConeGeometry(0.03,0.13,5).translate(0,0.065,0), new THREE.ConeGeometry(0.018,0.08,4).translate(0.022,0.04,0)]);
  else if(name==='leaf') g=new THREE.CircleGeometry(0.035,8).scale(0.6,1.6,1);
  else if(name==='petal') g=cosStar(5,0.02,0.045);
  else if(name==='flake') g=cosJoin([cosStar(6,0.012,0.055), new THREE.RingGeometry(0.02,0.026,6)]);
  else if(name==='star') g=cosJoin([cosStar(4,0.011,0.06), cosStar(4,0.02,0.032).rotateZ(Math.PI/4)]);
  else if(name==='wisp') g=cosJoin([new THREE.OctahedronGeometry(0.022,1), new THREE.ConeGeometry(0.02,0.17,6).rotateZ(-Math.PI/2).translate(0.085,0,0)]);
  else if(name==='bubble') g=cosJoin([new THREE.RingGeometry(0.026,0.036,12), new THREE.CircleGeometry(0.012,6).translate(-0.01,0.012,0)]);
  else g=new THREE.OctahedronGeometry(0.035,0);
  return COS_GEO[name]=g;
}
// the ring on the ground and its decoration: [{geo, y, spin}] (ring meshes turn at `spin` radians a second)
function cosRings(def){
  const out=[], base=COS_GEO.ring||(COS_GEO.ring=new THREE.RingGeometry(0.55,0.72,48).rotateX(-Math.PI/2));
  out.push({geo:base,y:0.03,spin:0,pulse:true});
  if(def.deco==='runes'){ const q=[]; for(let i=0;i<14;i++){ const a=i/14*TAU, g=new THREE.PlaneGeometry(0.035,i%2?0.11:0.07).rotateX(-Math.PI/2).rotateY(a); g.translate(Math.sin(a)*0.635,0.034,Math.cos(a)*0.635); q.push(g); }
    out.push({geo:COS_GEO.runes||(COS_GEO.runes=cosJoin(q)),y:0,spin:0.35}); }
  if(def.deco==='spikes'){ const q=[]; for(let i=0;i<12;i++){ const a=i/12*TAU, g=new THREE.ConeGeometry(0.03,i%2?0.16:0.1,4); g.translate(Math.sin(a)*0.64,(i%2?0.08:0.05),Math.cos(a)*0.64); q.push(g); }
    out.push({geo:COS_GEO.spikes||(COS_GEO.spikes=cosJoin(q)),y:0.03,spin:-0.2}); }
  if(def.deco==='double') out.push({geo:COS_GEO.ring2||(COS_GEO.ring2=new THREE.RingGeometry(0.84,0.9,48).rotateX(-Math.PI/2)),y:0.03,spin:0,pulse:true,phase:1.7});
  return out;
}
// ---- the cape ----
const cosHash=(a,b)=>{ const h=Math.sin(a*127.1+b*311.7)*43758.5453; return h-Math.floor(h); };
const _cA=new THREE.Color(), _cB=new THREE.Color();
// the colour of the cloth at (u, v): u -1..1 across the width, v 0..1 from the collar to the hem; the pattern of the cape (shared/cosmetics.js COS_CAPES[].pat)
function cosPattern(def,c,u,v){
  c.set(def.col); const trim=_cA.set(def.trim), au=Math.abs(u), cell=(k,m)=>cosHash(Math.floor(u*k+20),Math.floor(v*m)+(Math.floor(u*k+20)%2)*0.5);
  c.multiplyScalar(0.94+0.06*Math.sin(v*90+u*14)*Math.sin(u*40-v*7));   // the weave
  switch(def.pat){
    case 'stitch': if(v>0.9) c.copy(trim).multiplyScalar(0.85); if(v>0.84&&v<0.855&&((u*16+20)%1)<0.55) c.copy(trim); if(au>0.35&&au<0.55&&v>0.4&&v<0.58) c.multiplyScalar(1.22); break;
    case 'flames': { const h=0.2*(0.45+0.55*Math.abs(Math.sin(u*9.5))); if(v>0.95-h) c.copy(trim).multiplyScalar(0.7+0.5*(v-(0.95-h))/h); break; }
    case 'stars': { const d=Math.hypot(((u*9+20)%1)-0.5,((v*12)%1)-0.5); if(cell(9,12)>0.8&&d<0.12) c.copy(trim).lerp(_cB.set(0xffffff),0.4); if(v>0.9) c.multiplyScalar(0.8); break; }
    case 'rays': { const a=Math.atan2(u*0.55,v+0.05); if(((a*8)%1+1)%1<0.22) c.lerp(trim,0.45); break; }
    case 'petals': { const d=Math.hypot(((u*7+20)%1)-0.5,((v*9+(Math.floor(u*7+20)%2)*0.5)%1)-0.5); if(cell(7,9)>0.55&&d<0.2) c.copy(trim).lerp(_cB.set(0xffc0d8),0.4); break; }
    case 'fur': if(v<0.09) c.copy(trim).lerp(_cB.set(0xffffff),0.6); if(v>0.9) c.set(0xf4f8fc).multiplyScalar(0.92+0.1*cosHash(Math.floor(u*60),Math.floor(v*90))); else if(v>0.82) c.lerp(trim,0.35); break;
    case 'ermine': if(v>0.88){ c.set(0xf6f6f2); if(((u*7+20)%1)<0.16&&v>0.92&&v<0.985) c.set(0x15151a); }
      if(au<0.14&&Math.abs(v-0.44)<0.14-au) c.copy(trim); if(au>0.5&&au<0.53) c.copy(trim); if(v>0.84&&v<0.875) c.copy(trim); break;
    case 'moss': { const n=noise2(u*5,v*6); if(n>0.1) c.lerp(_cB.set(0x86a850),Math.min(1,(n-0.1)*2)); if(v>0.9) c.copy(trim).multiplyScalar(0.8+0.3*cosHash(Math.floor(u*14),1)); break; }
    case 'ash': { const n=noise2(u*6,v*4); c.multiplyScalar(0.8+0.5*(n+0.5)); const tear=0.18*(0.35+0.65*Math.abs(Math.sin(u*7.3+n*3))); if(v>0.96-tear){ c.copy(trim).multiplyScalar(0.5+1.0*(v-(0.96-tear))/tear); } break; }
    case 'waves': { const f=((v*7+0.18*Math.sin(u*8))%1+1)%1; if(Math.abs(f-0.5)<0.07) c.copy(trim); break; }
    case 'dunes': { const f=((v*5+0.12*Math.sin(u*5+v*3))%1+1)%1; if(Math.abs(f-0.5)<0.045) c.copy(trim); if(v>0.9) c.copy(trim).multiplyScalar(0.9); break; }
    case 'hide': { const n=noise2(u*7,v*5); c.multiplyScalar(0.8+0.32*(n+0.5)); if(v<0.1) c.copy(trim).multiplyScalar(0.88+0.14*cosHash(Math.floor(u*50),Math.floor(v*80)));
      if(v>0.9) c.multiplyScalar(0.78); if(v>0.84&&v<0.86&&((u*15+20)%1)<0.5) c.copy(trim).multiplyScalar(0.85); break; }
    case 'scales': { const row=Math.floor(v*17), fu=((u*9+20+(row%2)*0.5)%1), fv=((v*17)%1), d=Math.hypot(fu-0.5,(fv-0.15)*1.1);
      c.multiplyScalar(0.78+0.4*Math.max(0,1-d*1.5)); if(d>0.5||fv<0.06) c.copy(trim).multiplyScalar(0.5); else if(fv>0.8) c.lerp(trim,0.25); break; }
    case 'leaves': { const row=Math.floor(v*10), fu=((u*7+20+(row%2)*0.5)%1)-0.5, fv=((v*10)%1), k=cosHash(Math.floor(u*7+20+(row%2)*0.5),row);
      c.multiplyScalar(0.8+0.35*k); if(Math.abs(fu)<0.025&&fv>0.1&&fv<0.9) c.copy(trim).multiplyScalar(0.7); else if(Math.abs(fu)>0.4*(1-0.5*Math.abs(fv-0.5))) c.multiplyScalar(0.7); if(k>0.8) c.lerp(trim,0.45); break; }
    case 'gloam': { c.multiplyScalar(1-0.35*v); const d=Math.hypot(((u*10+20)%1)-0.5,((v*13)%1)-0.5); if(cell(10,13)>0.86&&d<0.1) c.copy(trim); break; }
  }
  // the collar and hem bands: every cape
  if(v<0.045) c.copy(trim).multiplyScalar(0.92);
  else if(v>0.955&&def.pat!=='fur'&&def.pat!=='ermine'&&def.pat!=='ash') c.copy(trim);
  return c;
}
// a cape's or an aura's colours with the look's own on top (look.capeColor / capeTrim, look.auraColor / auraColor2; -1 or missing = as designed). Quantised to 4 bits a channel: a remote look is not trusted, and the colour caches stay small.
function cosQ(v){ return Number.isFinite(v)&&v>=0?(Math.floor(v)&0xf8f8f8)|0x040404:-1; }
function cosTint(def,L,kind){
  if(!def) return def;
  const a=cosQ(kind==='cape'?L.capeColor:L.auraColor), b=cosQ(kind==='cape'?L.capeTrim:L.auraColor2);
  if(a<0&&b<0) return def;
  const o=Object.assign({},def); if(a>=0) o.col=a; if(b>=0){ if(kind==='cape') o.trim=b; else o.col2=b; } return o;
}
// the cape on a rig: hinges at the back of the shoulders, four panels down to a hem near the knees, a collar, a clasp and, for some, a shoulder cape
function cosBuildCape(rig,X,def){
  const D=X.D, sg=X.sg, cheap=(typeof LITE!=='undefined'&&LITE)||(typeof LOW!=='undefined'&&LOW);
  const H=Math.min((D.shY+0.3)*def.len,D.hipY+D.shY-0.1), w0=2*D.shX+0.06, w1=w0*1.55, z0=0.11*D.B+0.025, top=D.shY+0.02, A=0.95, NS=4, NC=cheap?9:16;
  const w=y=>w0+(w1-w0)*y/H, cut=[0,0.25,0.5,0.75,1].map(f=>f*H);
  // one panel: the rows ya..yb (distance below the hinge line), curved round the back and rippled; drawn in its own frame (its top at y = 0)
  const panel=(ya,yb)=>{
    const nr=cheap?2:4, pos=[], idx=[];
    for(let i=0;i<=nr;i++){ const y=ya+(yb-ya)*i/nr, R=w(y)/(2*Math.sin(A)), rip=0.014*(0.3+0.7*y/H);
      for(let j=0;j<=NC;j++){ const a=-A+2*A*j/NC; pos.push(Math.sin(a)*R,-(y-ya),(Math.cos(a)-1)*R+rip*Math.sin(a*7+y*4)*(0.4+0.6*Math.abs(a)/A)); } }
    for(let i=0;i<nr;i++) for(let j=0;j<NC;j++){ const a=i*(NC+1)+j, b=a+1, c=a+NC+1, d=c+1; idx.push(a,b,c,b,d,c); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); smoothN(g);
    return pc(g,(x,y,z,c)=>{ const yy=ya-y; cosPattern(def,c,x/(w(yy)/2),yy/H); });
  };
  const hinge=new THREE.Group(); hinge.position.set(0,top,z0); rig.spine.add(hinge);
  const segs=[]; let parent=hinge;
  for(let s=0;s<NS;s++){
    const grp=new THREE.Group(), m=new THREE.Mesh(panel(cut[s],cut[s+1]+(s<NS-1?0.016:0)),cosCapeMat); m.castShadow=false; grp.add(m);
    if(s>0) grp.position.y=-(cut[s]-cut[s-1]);
    parent.add(grp); segs.push(grp); parent=grp;
  }
  // fixed to the body: a rolled collar (fur, for the furred capes), the clasp with its chain, and the shoulder cape
  const fixed=[], ts=yd=>torsoSize(X,D,yd), TK=D.TK, nr=D.neckR, furry=def.pat==='fur'||def.pat==='ermine', ruff=furry||def.pat==='hide';
  const cy=0.56*TK, fur=furry?0xf4f8fc:def.trim, rollR=nr*1.75;
  if(ruff){ for(let i=0;i<14;i++){ const a=i/14*TAU; fixed.push(solid(csph(0.021,sg(7),sg(6)).translate(Math.sin(a)*rollR*1.05,cy,Math.cos(a)*rollR),i%3?fur:0xdfe8f0)); } }
  else fixed.push(solid(gmRingAt([0,cy-0.004,0],[0,1,0],rollR,0.0125,sg(8)),def.col),solid(gmRingAt([0,cy+0.006,0],[0,1,0],rollR*0.98,0.004,sg(6)),def.trim));
  const cs=ts(0.52), cz=-(cs.rz+0.014), cyy=0.52*TK;
  for(const sd of [-1,1]) fixed.push(solid(csph(0.0115,sg(8),sg(6)).translate(sd*nr*1.5,cyy+0.004,cz),def.trim));
  fixed.push(solid(sweepTube([[-nr*1.5,cyy,cz],[-nr*0.6,cyy-0.026,cz-0.004],[nr*0.6,cyy-0.026,cz-0.004],[nr*1.5,cyy,cz]],[0.0024,0.0024,0.0024,0.0024],4,{cap:'round',rings:8}),def.trim),
    solid(csph(0.012,sg(8),sg(6)).scale(1,1.2,0.7).translate(0,cyy-0.036,cz-0.006),def.trim));   // a pendant on the chain
  if(def.mantle){
    const rows=[[0.53,0.014],[0.47,0.016]].map(([yd,m])=>{ const t=ts(yd), r=Math.max(t.rz,t.rzBack)+m; return {y:yd*TK,rx:t.rx+m,rz:r}; }), t4=ts(0.4), rz4=Math.max(t4.rz,t4.rzBack,0.1*D.B);
    rows.push({y:D.shY-0.02,rx:D.shX+0.07,rz:rz4+0.03},{y:D.shY-0.12,rx:D.shX+0.082,rz:rz4+0.034});
    const mh=D.shY-0.12;
    fixed.push(pc(ofLoft(rows,sg(36),0,TAU),(x,y,z,c)=>{ c.set(def.col); const t=(y-mh)/(rows[0].y-mh); if(furry){ if(t<0.2) c.set(0xf4f8fc).multiplyScalar(0.92+0.1*cosHash(Math.floor(x*70),Math.floor(z*70))); }
      else { if(t<0.1) c.copy(_cA.set(def.trim)); else if(def.pat==='petals'&&cosHash(Math.floor(x*40),Math.floor(z*40))>0.9) c.set(def.trim); } c.multiplyScalar(0.94+0.06*Math.sin(Math.atan2(x,z)*10)); }));
  }
  const fm=new THREE.Mesh(merge(fixed),cosCapeMat); fm.castShadow=false; rig.spine.add(fm);
  rig.anims=rig.anims||[];
  rig.anims.push((t,dt,mv)=>{
    for(let i=0;i<segs.length;i++){
      const lean=0.04+i*0.04+mv*(0.13+i*0.1), wave=Math.sin(t*(2.4+mv*3)-i*0.9)*(0.015+mv*0.05);
      const want=-(lean+wave); segs[i].rotation.x+=(want-segs[i].rotation.x)*Math.min(1,dt*10);
      segs[i].rotation.z=Math.sin(t*1.7-i)*0.018*(1+mv*2);
    }
  });
}
// ---- the aura ----
function cosBuildAura(rig,X,def){
  const D=X.D, hgt=D.hipY+D.shY+0.2, cheap=(typeof LITE!=='undefined'&&LITE)||(typeof LOW!=='undefined'&&LOW);
  const n=Math.max(3,Math.round(def.n*(cheap?0.5:1))), g=new THREE.Group(); rig.root.add(g);
  const geo=cosShape(def.shape||'mote'), shape=def.shape||'mote', halo=shape==='mote'||shape==='star'||shape==='wisp', upright=shape==='flame'||shape==='drop', spinny=shape==='petal'||shape==='flake'||shape==='star'||shape==='leaf'||shape==='grain';
  const ps=[];
  for(let i=0;i<n;i++){
    const col=i%3===0?def.col2:def.col, m=new THREE.Mesh(geo,cosMat(col)); m.frustumCulled=false; m.position.set(0,hgt*0.5,0.5); g.add(m);   // (a resting place until the first frame: never under the ground)
    let h=null; if(halo&&!cheap){ h=new THREE.Mesh(geo,cosHaloMat(col)); h.frustumCulled=false; h.position.set(0,hgt*0.5,0.5); g.add(h); }
    ps.push({m,h,ph:i/n,r:0.38+0.14*((i*7)%5)/4,sp:0.5+0.35*((i*3)%4)/3,off:(i*2.399)%TAU});   // (fixed pseudo-random spread: the same every build)
  }
  const rings=def.ring?cosRings(def).map(r=>{ const m=new THREE.Mesh(r.geo,cosMat(def.col)); m.position.y=r.y; m.frustumCulled=false; g.add(m); return Object.assign({m},r); }):[];
  let halo2=null; if(def.ring&&def.deco==='halo'){ halo2=new THREE.Mesh(COS_GEO.halo||(COS_GEO.halo=new THREE.RingGeometry(0.2,0.25,32).rotateX(-Math.PI/2)),cosMat(def.col2)); halo2.position.y=D.hipY+D.headY+0.2; halo2.frustumCulled=false; g.add(halo2); }
  rig.anims=rig.anims||[];
  rig.anims.push((t,dt,mv)=>{
    for(const p of ps){
      const u=(t*0.18*p.sp+p.ph)%1, a=p.off+t*(def.style==='orbit'?0.9:0.35)*p.sp;
      let y, r=p.r;
      if(def.style==='orbit'){ y=hgt*(0.12+0.78*((p.ph+0.3*Math.sin(t*0.6+p.off)+1)%1)); r=0.5+0.1*Math.sin(t*1.3+p.off); }
      else if(def.style==='rise'){ y=u*hgt*1.1; r=p.r*(1-0.4*u); }
      else { y=hgt*1.15*(1-u); r=p.r+0.1*Math.sin(t*1.5+p.off); }   // fall
      p.m.position.set(Math.sin(a)*r,y,Math.cos(a)*r);
      const fade=def.style==='orbit'?1:Math.sin(Math.min(1,u)*Math.PI), sc=0.4+1.1*fade; p.m.scale.setScalar(sc);
      if(shape==='wisp') p.m.rotation.set(0,a+Math.PI,0);
      else if(upright) p.m.rotation.set(0,a,0);
      else if(spinny) p.m.rotation.set(t*(shape==='grain'?4:1.6)+p.off,t*1.3+p.off,shape==='flake'?t*0.8:0);
      else p.m.rotation.y=t*3+p.off;
      if(p.h){ p.h.position.copy(p.m.position); p.h.rotation.copy(p.m.rotation); p.h.scale.setScalar(sc*1.8); }
    }
    for(const r of rings){ if(r.spin) r.m.rotation.y=t*r.spin; if(r.pulse){ const k=1+0.08*Math.sin(t*2.2+(r.phase||0)); r.m.scale.set(k,1,k); } }
    if(halo2){ halo2.rotation.y=t*1.1; halo2.position.y=D.hipY+D.headY+0.2+0.012*Math.sin(t*2); }
  });
}
// called at the end of buildCharacter
function cosDress(rig,X){
  const L=X.L;
  const cape=cosTint(cosDef('c',L.cape),L,'cape'), aura=cosTint(cosDef('a',L.aura),L,'aura');
  if(cape&&cape.pat!=='pack') cosBuildCape(rig,X,cape);   // (the backpack is drawn on the torso: model-body.js buildTorso)
  if(aura) cosBuildAura(rig,X,aura);
}
