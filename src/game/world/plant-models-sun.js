//@ The Sunscar's plants: the date palm, the saguaro-like cactus and the flat-crowned thorn tree (G.trees.palm / cactus / thorn); the rest of the planting is the sun branch of genChunk (generation-chunks.js)
/* Agent map: makePalm(), makeCactus() return {trunk, leaves} like the other models in plant-models.js (trunk painted, leaves white-shaded and tinted per instance from PAL.palm /
   PAL.thorn); the thorn tree is makeBroadleaf with a flat crown (generation-setup.js buildGeometries). Each plant draws from its own mrng(seed), never the global rand (CLAUDE.md section 4).
   Used by: generation-setup.js (buildGeometries, RAD, PAL), generation-chunks.js (the sun branch). Test: client-smoke. */
function makePalm(){
  const Q=mrng(7101), qr=Q.R;
  const parts=[], H=qr(6.2,7.4), bend=qr(0.5,0.9), segs=7;
  let x=0, y=0;
  for(let i=0;i<segs;i++){   // a trunk that leans: seven short cones, each a little further over than the one below
    const h=H/segs, r0=0.3-0.16*i/segs, r1=0.3-0.16*(i+1)/segs, nx=x+bend*(((i+1)/segs)**2-(i/segs)**2);
    const g=cyl(r1,r0,h*1.05,7).translate(0,h/2,0); g.rotateZ(-Math.atan2(nx-x,h)).translate(x,y,0);
    parts.push(paint(g,(px,py,pz,nx2,ny,nz,c)=>c.set(0x8a6c4a).multiplyScalar(0.7+0.3*(Math.abs(((py-y)/h*3)%1-0.5)*2)+h3(px,py,pz)*0.15)));
    x=nx; y+=h;
  }
  const leaves=[], top=[x,y,0];
  for(let k=0;k<10;k++) {   // fronds: long flat blades drooping outward round the crown
    const a=k/10*TAU+qr(-0.2,0.2), len=qr(2.6,3.4), droop=qr(0.35,0.75);
    const g=new THREE.IcosahedronGeometry(1,1); g.scale(len*0.5,0.05,0.34); g.translate(len*0.5,0,0); g.rotateZ(-droop); g.rotateY(a); g.translate(top[0],top[1]+0.25,top[2]);
    leaves.push(paint(g,(px,py,pz,nx,ny,nz,c)=>{ const v=0.62+0.4*clamp((py-top[1]+1.6)/2.2); c.setRGB(v,v,v); }));
  }
  const dates=blob(0.35,top[0],top[1]-0.2,top[2],0.8,new THREE.Vector3(top[0],top[1],top[2]),0);
  parts.push(paint(dates,()=>_c.set(0x7a4a22)));
  return {trunk:merge(parts), leaves:merge(leaves)};
}
function makeCactus(){
  const Q=mrng(7102), qr=Q.R, parts=[];
  const rib=(hex)=>(px,py,pz,nx,ny,nz,c)=>{ const a=Math.atan2(pz,px), r=0.8+0.2*Math.abs(Math.sin(a*4.5)); c.set(hex).multiplyScalar(r*(0.85+h3(px,py,pz)*0.2)); };
  const H=qr(3.6,4.6);
  parts.push(paint(cyl(0.3,0.36,H,10,4).translate(0,H/2,0),rib(0x5a8a4a)));
  parts.push(paint(new THREE.SphereGeometry(0.3,10,6,0,TAU,0,Math.PI/2).translate(0,H,0),rib(0x5a8a4a)));
  for(const s of [-1,1]){   // two arms: out sideways, then up
    const y0=H*qr(0.35,0.6), L=qr(0.8,1.1), up=qr(1.0,1.8);
    parts.push(paint(cyl(0.2,0.2,L,8).rotateZ(Math.PI/2).translate(s*(0.3+L/2),y0,0),rib(0x5a8a4a)));
    parts.push(paint(cyl(0.2,0.2,up,8).translate(s*(0.3+L),y0+up/2,0),rib(0x5a8a4a)));
    parts.push(paint(new THREE.SphereGeometry(0.2,8,5,0,TAU,0,Math.PI/2).translate(s*(0.3+L),y0+up,0),rib(0x5a8a4a)));
  }
  return {trunk:merge(parts), leaves:null};
}
