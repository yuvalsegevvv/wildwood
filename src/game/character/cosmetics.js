//@ Cosmetics on the character (version 3): the cape (a hinged cloth on the back that sways with the walk) and the aura (additive particles and a ground ring), added to a rig by buildCharacter
/* look.cape and look.aura are ids of shared/cosmetics.js (COS_CAPE / COS_AURA); an unknown id (or a remote player's look.cape = 'constructor') draws nothing: cosDef checks own properties.
   Both are loose meshes added to the rig and moved by rig.anims (the same hook the signature outfits use: pose.js calls every function with (t, dt, mv)), so the merged body meshes are untouched.
   - the cape: three stacked trapezoids hinged one under another, vertex-coloured (cloth, a trim band at the collar and at the hem); the hinges lean back with speed and wave a little.
   - the aura: COS_AURAS[].n small additive octahedra (fewer on a phone: LOW / LITE) that orbit the body ('orbit'), climb ('rise') or drift down ('fall'), and an optional glowing ring on the ground.
   Shared geometry and one material per colour: nothing here allocates per frame. used by: model.js (buildCharacter), the editor's Cosmetics tab (ui/character-editor.js). test: tools/revamp-smoke.js */
const COS_GEO={}, COS_MATS={};
const cosMat=col=>COS_MATS[col]||(COS_MATS[col]=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
const cosCapeMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
// a flat quad from (-w0/2, y0) / (w0/2, y0) up to (-w1/2, y1) / (w1/2, y1) in one colour (y0 is the top: the cloth hangs down, so y1 < y0), facing +z (the back of the character)
function cosQuad(w0,w1,y0,y1,col){
  const g=new THREE.BufferGeometry(), c=new THREE.Color(col);
  g.setAttribute('position',new THREE.Float32BufferAttribute([-w0/2,y0,0, w0/2,y0,0, w1/2,y1,0, -w1/2,y1,0],3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1, 0,0,1, 0,0,1, 0,0,1],3));
  g.setAttribute('color',new THREE.Float32BufferAttribute([c.r,c.g,c.b, c.r,c.g,c.b, c.r,c.g,c.b, c.r,c.g,c.b],3));
  g.setIndex([0,1,2, 0,2,3]); return g;
}
// the cape on a rig: hinges at the back of the shoulders, three segments down to a hem near the knees
function cosBuildCape(rig,X,def){
  const D=X.D, H=Math.min((D.shY+0.26)*def.len,D.hipY+D.shY-0.1), w0=2*D.shX+0.06, w1=w0*1.55, z0=0.11*D.B+0.025, top=D.shY+0.02;
  const w=y=>w0+(w1-w0)*y/H, cut=[0,0.34,0.67,1].map(f=>f*H), trim=0.12*H, collar=0.07*H;
  const hinge=new THREE.Group(); hinge.position.set(0,top,z0); rig.spine.add(hinge);
  const hinges=[hinge]; let parent=hinge;
  for(let s=0;s<3;s++){
    const a=cut[s], b=cut[s+1], parts=[], grp=new THREE.Group();
    // each segment is drawn in its own frame (its top at y = 0), so the next hinge hangs at its bottom
    parts.push(cosQuad(w(a),w(b),0,-(b-a),def.col));
    if(s===0) parts.push(cosQuad(w(a),w(a+collar),0,-collar,def.trim));
    if(s===2) parts.push(cosQuad(w(b-trim),w(b),-(b-a-trim),-(b-a),def.trim));
    parts.forEach((g,i)=>{ const m=new THREE.Mesh(g,cosCapeMat); m.castShadow=false; m.position.z=i?0.004:0; grp.add(m); });   // (a trim lies 4 mm out: no z-fighting with the cloth)
    // the bottom of segment s is where the next hinge is
    if(s>0){ grp.position.y=-(cut[s]-cut[s-1]); }
    parent.add(grp); hinges.push(grp); parent=grp;
  }
  const segs=hinges.slice(1);
  rig.anims=rig.anims||[];
  rig.anims.push((t,dt,mv)=>{
    for(let i=0;i<segs.length;i++){
      const lean=0.05+i*0.05+mv*(0.16+i*0.14), wave=Math.sin(t*(2.4+mv*3)-i*0.9)*(0.02+mv*0.07);
      const want=-(lean+wave); segs[i].rotation.x+=(want-segs[i].rotation.x)*Math.min(1,dt*10);
      segs[i].rotation.z=Math.sin(t*1.7-i)*0.02*(1+mv*2);
    }
  });
}
// the aura: particles around the body and an optional ring on the ground
function cosBuildAura(rig,X,def){
  const D=X.D, hgt=D.hipY+D.shY+0.2, cheap=(typeof LITE!=='undefined'&&LITE)||(typeof LOW!=='undefined'&&LOW);
  const n=Math.max(3,Math.round(def.n*(cheap?0.5:1))), g=new THREE.Group(); rig.root.add(g);
  const geo=COS_GEO.mote||(COS_GEO.mote=new THREE.OctahedronGeometry(0.035,0)), geo2=COS_GEO.petal||(COS_GEO.petal=new THREE.PlaneGeometry(0.07,0.045));
  const ps=[];
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(def.style==='fall'?geo2:geo,cosMat(i%3===0?def.col2:def.col)); m.frustumCulled=false; g.add(m);
    ps.push({m,ph:i/n,r:0.38+0.14*((i*7)%5)/4,sp:0.5+0.35*((i*3)%4)/3,off:(i*2.399)%TAU});   // (fixed pseudo-random spread: the same every build)
  }
  let ring=null;
  if(def.ring){ ring=new THREE.Mesh(COS_GEO.ring||(COS_GEO.ring=new THREE.RingGeometry(0.55,0.72,40).rotateX(-Math.PI/2)),cosMat(def.col)); ring.position.y=0.03; g.add(ring); }
  const base=rig.hipY?0:0;   // (the rig's root stands on the ground: y = 0 is the feet)
  rig.anims=rig.anims||[];
  rig.anims.push((t,dt,mv)=>{
    for(const p of ps){
      const u=(t*0.18*p.sp+p.ph)%1, a=p.off+t*(def.style==='orbit'?0.9:0.35)*p.sp;
      let y, r=p.r;
      if(def.style==='orbit'){ y=hgt*(0.12+0.78*((p.ph+0.3*Math.sin(t*0.6+p.off)+1)%1))+base; r=0.5+0.1*Math.sin(t*1.3+p.off); }
      else if(def.style==='rise'){ y=u*hgt*1.1; r=p.r*(1-0.4*u); }
      else { y=hgt*1.15*(1-u); r=p.r+0.1*Math.sin(t*1.5+p.off); }   // fall: petals, tumbling
      p.m.position.set(Math.sin(a)*r,y,Math.cos(a)*r);
      const fade=def.style==='orbit'?1:Math.sin(Math.min(1,u)*Math.PI); p.m.scale.setScalar(0.4+1.1*fade);
      if(def.style==='fall'){ p.m.rotation.set(t*2+p.off,t*1.3,0); } else p.m.rotation.y=t*3+p.off;
    }
    if(ring){ const k=1+0.08*Math.sin(t*2.2); ring.scale.set(k,1,k); }
  });
}
// called at the end of buildCharacter
function cosDress(rig,X){
  const L=X.L;
  const cape=cosDef('c',L.cape), aura=cosDef('a',L.aura);
  if(cape) cosBuildCape(rig,X,cape);
  if(aura) cosBuildAura(rig,X,aura);
}
