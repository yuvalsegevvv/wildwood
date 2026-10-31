//@ The Emberwake Isles' tropical plants: the ceiba (a 30 m emergent with buttress roots and an umbrella crown hung with lianas), two canopy trees, two tall coconut palms, the banana plant and the tree fern (G.trees.ceiba / jtree / jtree2 / tpalm / tpalm2 / banana / treefern)
/* Agent map: makeCeiba(), makeJungleTree(seed,o), makeTallPalm(seed,o), makeBananaPlant(), makeTreeFern() return {trunk, leaves} like plant-models-savanna.js (trunk painted with its own colours, leaves white-shaded by shade()
   and tinted per instance from PAL.<kind>; each draws from its own mrng(seed), never the global rand, so building them moves nothing else). Heights at scale 1: ceiba about 34 m, canopy trees 20 m, palms 12-13 m, banana 3 m, tree fern 3 m: the
   jungle has layers (emergents over a canopy over palms over an understory) which the home forest never had. Placement is the isles branch of genChunk (generation-chunks.js: a part-by-part mix; chunks of the isles grow up to
   twice the tree budget); the kinds are registered in buildGeometries (generation-setup.js: PAL, RAD, G.trees). One level of detail only (under 1,300 triangles each).
   Used by: generation-setup.js, generation-chunks.js. Test: client-smoke (it builds the geometries). Names: makeCeiba, makeJungleTree, makeTallPalm, makeBananaPlant, makeTreeFern, isl... */
function islVine(x,y,z,len,r){ return new THREE.ConeGeometry(r||0.1,len,4).rotateX(Math.PI).translate(x,y-len/2,z); }   // a liana: a thin cone, base at the branch, tip down
function islFin(az,H,Lo,th){   // a buttress root: a thin board that rises from the ground beside the trunk and slopes back into it
  const g=new THREE.BoxGeometry(th,H,Lo,1,4,1).translate(0,H/2,Lo/2+0.5), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setZ(i,0.4+(p.getZ(i)-0.4)*(1-0.9*Math.pow(y/H,0.8))); }
  g.computeVertexNormals(); return g.rotateY(az);
}
function makeCeiba(){
  const Q=mrng(8401), qr=Q.R, tp=[], lp=[], H=34, C=new THREE.Vector3(0,H-3,0);
  const prof=[[1.7,0],[1.2,1.4],[1.0,3],[0.92,9],[0.82,17],[0.74,24],[0.7,28],[0,28.2]].map(p=>new THREE.Vector2(p[0],p[1]));
  tp.push(paint(new THREE.LatheGeometry(prof,10),(x,y,z,nx,ny,nz,c)=>{ const a=Math.atan2(z,x); c.set(0x8a8478).multiplyScalar(0.78+0.2*Math.abs(Math.sin(a*5+y*0.15))+0.1*h3(x,y,z)); if(y<2.2) c.lerp(_c.set(0x5a5a3a),0.35); }));
  for(let i=0;i<5;i++){ const az=i/5*TAU+qr(-0.25,0.25); tp.push(paint(islFin(az,qr(4.2,5.6),qr(2.4,3.4),0.34),bark(0x7e786a))); }
  const ends=[];
  for(let i=0;i<6;i++){   // the limbs: out and up from the top of the trunk
    const az=i/6*TAU+qr(-0.3,0.3), tilt=qr(0.95,1.25), L=qr(7.5,10), y0=qr(24.5,27.5), g=cyl(0.18,0.46,L,5).translate(0,L/2,0);
    g.rotateZ(-tilt); g.rotateY(az); g.translate(0,y0,0); tp.push(paint(g,bark(0x6e685a)));
    ends.push([Math.sin(tilt)*L*Math.cos(az),y0+Math.cos(tilt)*L,-Math.sin(tilt)*L*Math.sin(az)]);
  }
  lp.push(blob(qr(5.2,6),0,H-2.4,0,0.36,C,1));
  for(const e of ends){ lp.push(blob(qr(3.8,4.8),e[0],e[1]+0.8,e[2],0.38,C,1)); lp.push(blob(qr(2.2,3),e[0]*0.55,e[1]+2.2,e[2]*0.55,0.4,C,0)); }
  for(let i=0;i<9;i++){ const e=ends[i%6], a=qr(0,TAU), d=qr(0,2.4); lp.push(islVine(e[0]+Math.cos(a)*d,e[1]-0.5,e[2]+Math.sin(a)*d,qr(8,14),0.09)); }
  return {trunk:merge(tp),leaves:merge(lp.map(g=>paint(g,shade(20,H+1))))};
}
function makeJungleTree(seed,o){   // o: {H (trunk height), crown (crown radius), flat (crown flatness), lean}
  o=o||{}; const Q=mrng(seed), qr=Q.R, tp=[], lp=[], H0=o.H||13, Rc=o.crown||3.2, fl=o.flat||0.7, C=new THREE.Vector3(0,H0+3.4,0), lean=o.lean||0.012;
  const prof=[[0.62,0],[0.4,0.9],[0.3,3],[0.27,H0*0.6],[0.22,H0],[0,H0+0.1]].map(p=>new THREE.Vector2(p[0],p[1]));
  tp.push(paint(new THREE.LatheGeometry(prof,8),(x,y,z,nx,ny,nz,c)=>{ c.set(0x6a5a46).multiplyScalar(0.8+0.25*h3(x,y,z)); if(y<1.4) c.multiplyScalar(0.85); }));
  for(let i=0;i<3;i++) tp.push(paint(islFin(i/3*TAU+qr(0,1),qr(1.4,2),qr(1.1,1.6),0.2),bark(0x62523f)));
  const ends=[];
  for(let i=0;i<4;i++){ const az=i/4*TAU+qr(-0.4,0.4), tilt=qr(0.6,0.95), L=qr(3,4.2), y0=H0-qr(0.2,1.4), g=cyl(0.08,0.2,L,5).translate(0,L/2,0);
    g.rotateZ(-tilt); g.rotateY(az); g.translate(0,y0,0); tp.push(paint(g,bark(0x5e4e3a))); ends.push([Math.sin(tilt)*L*Math.cos(az),y0+Math.cos(tilt)*L,-Math.sin(tilt)*L*Math.sin(az)]); }
  lp.push(blob(Rc*1.05,0,H0+3.4,0,fl,C,1));
  for(const e of ends) lp.push(blob(Rc*qr(0.65,0.85),e[0],e[1]+0.9,e[2],fl,C,1));
  lp.push(blob(Rc*0.55,qr(-0.8,0.8),H0+3.4+Rc*fl+0.3,qr(-0.8,0.8),fl*0.9,C,0));
  for(let i=0;i<4;i++){ const e=ends[i]; lp.push(islVine(e[0]+qr(-0.6,0.6),e[1]-0.2,e[2]+qr(-0.6,0.6),qr(3.5,6),0.07)); }
  const bend=g=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setX(i,p.getX(i)+y*y*lean); } return g; };
  return {trunk:bend(merge(tp)),leaves:bend(merge(lp.map(g=>paint(g,shade(H0-1,H0+3.4+Rc*fl+1)))))};
}
function makeTallPalm(seed,o){   // a coconut palm: a slender ringed trunk bending over, ten to twelve long fronds drooping from the crown, a cluster of nuts under it
  o=o||{}; const Q=mrng(seed), qr=Q.R, parts=[], H=o.H||qr(11,13), bend=o.bend||qr(1.2,2.2), segs=10;
  let x=0, y=0;
  for(let i=0;i<segs;i++){
    const h=H/segs, r0=0.26-0.1*i/segs, r1=0.26-0.1*(i+1)/segs, nx=x+bend*(((i+1)/segs)**2-(i/segs)**2);
    const g=cyl(r1,r0,h*1.04,7).translate(0,h/2,0); g.rotateZ(-Math.atan2(nx-x,h)).translate(x,y,0);
    parts.push(paint(g,(px,py,pz,nx2,ny,nz,c)=>c.set(0x9a8260).multiplyScalar(0.62+0.38*Math.abs(((py-y)/h*4)%1-0.5)*2+h3(px,py,pz)*0.1)));
    x=nx; y+=h;
  }
  const leaves=[], top=[x,y,0], n=o.fronds||11;
  for(let k=0;k<n;k++){
    const a=k/n*TAU+qr(-0.2,0.2), len=qr(3.8,4.8), droop=qr(0.3,0.95);
    const g=new THREE.IcosahedronGeometry(1,1); g.scale(len*0.5,0.05,0.4); g.translate(len*0.5,0,0); g.rotateZ(-droop); g.rotateY(a); g.translate(top[0],top[1]+0.3,top[2]);
    leaves.push(paint(g,(px,py,pz,nx,ny,nz,c)=>{ const v=0.6+0.42*clamp((py-top[1]+2.4)/3); c.setRGB(v,v,v); }));
  }
  for(let k=0;k<4;k++){ const a=k/4*TAU+qr(0,1), g=blob(0.2,top[0]+Math.cos(a)*0.28,top[1]-0.35,Math.sin(a)*0.28,0.9,new THREE.Vector3(top[0],top[1],top[2]),0); parts.push(paint(g,()=>_c.set(0x6a7a2a))); }
  return {trunk:merge(parts),leaves:merge(leaves)};
}
function makeBananaPlant(){   // a pseudo-stem and seven big arching leaves, a purple flower bud and a hand of fruit
  const Q=mrng(8403), qr=Q.R, tp=[], lp=[], H=2.3;
  tp.push(paint(cyl(0.11,0.19,H,7).translate(0,H/2,0),(x,y,z,nx,ny,nz,c)=>c.set(0x9ac060).multiplyScalar(0.8+0.2*h3(x,y,z))));
  tp.push(paint(blob(0.12,0.2,H-0.55,0,1.7,new THREE.Vector3(0,H,0),0),()=>_c.set(0xe0c040)));
  tp.push(paint(blob(0.1,0.12,H-0.1,0.1,1.5,new THREE.Vector3(0,H,0),0),()=>_c.set(0x7a2a5a)));
  for(let k=0;k<7;k++){
    const a=k/7*TAU+qr(-0.25,0.25), len=qr(1.9,2.5), droop=qr(0.3,1.0), g=new THREE.IcosahedronGeometry(1,1);
    g.scale(len*0.5,0.03,0.38); g.translate(len*0.5,0,0); g.rotateZ(-droop); g.rotateY(a); g.translate(0,H,0);
    lp.push(paint(g,(px,py,pz,nx,ny,nz,c)=>{ const v=0.66+0.4*clamp((py-0.9)/2.6); c.setRGB(v,v,v); }));
  }
  return {trunk:merge(tp),leaves:merge(lp)};
}
function makeTreeFern(){   // a dark, hairy trunk and a ring of arching fronds
  const Q=mrng(8404), qr=Q.R, tp=[], lp=[], H=2.7;
  tp.push(paint(cyl(0.1,0.2,H,6).translate(0,H/2,0).rotateZ(-0.05),(x,y,z,nx,ny,nz,c)=>c.set(0x4a3a2a).multiplyScalar(0.7+0.5*h3(x*3,y*3,z*3))));
  for(let k=0;k<12;k++){
    const a=k/12*TAU+qr(-0.15,0.15), len=qr(2,2.7), droop=qr(0.2,0.9), g=new THREE.ConeGeometry(0.3,len,4).scale(1,1,0.28).translate(0,len/2,0);
    g.rotateZ(-(Math.PI/2-droop)); g.rotateY(a); g.translate(0,H-0.05,0);
    lp.push(paint(g,(px,py,pz,nx,ny,nz,c)=>{ const v=0.62+0.42*clamp((py-1.2)/2.4); c.setRGB(v,v,v); }));
  }
  return {trunk:merge(tp),leaves:merge(lp)};
}
