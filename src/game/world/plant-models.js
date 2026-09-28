//@ Geometry helpers (paint, merge, mkGeo, cyl, blob) and plant models (trees, grass, ferns...)
/* ---------- geometry helpers ---------- */
const _c = new THREE.Color();
const WHITE = new THREE.Color(1,1,1);
function paint(geo, fn){
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p=g.attributes.position, n=g.attributes.normal, cnt=p.count, col=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){
    fn(p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i),_c);
    col[i*3]=_c.r; col[i*3+1]=_c.g; col[i*3+2]=_c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col,3));
  return g;
}
function mkGeo(P,N,C){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C,3));
  return g;
}
function merge(list){
  let total=0; for(const g of list) total+=g.attributes.position.count;
  const pos=new Float32Array(total*3), nor=new Float32Array(total*3), col=new Float32Array(total*3);
  let o=0;
  for(const g of list){
    pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3); col.set(g.attributes.color.array,o*3);
    o+=g.attributes.position.count;
  }
  const m=new THREE.BufferGeometry();
  m.setAttribute('position',new THREE.BufferAttribute(pos,3));
  m.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  m.setAttribute('color',new THREE.BufferAttribute(col,3));
  return m;
}
const bark = hex => (x,y,z,nx,ny,nz,c) => c.set(hex).multiplyScalar(0.82+h3(x,y,z)*0.3);
const cyl = (rt,rb,h,seg,hs) => new THREE.CylinderGeometry(rt,rb,h,seg,hs||1);

function blob(r,cx,cy,cz,sy,C,detail){
  const g=new THREE.IcosahedronGeometry(r, detail===undefined?1:detail);
  const p=g.attributes.position, nrm=g.attributes.normal;
  const v=new THREE.Vector3(), w=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const j=1+(h3(x+cx*7.1, y+cy*3.3, z+cz*5.7)-0.5)*0.42;
    const nx=x*j, ny=y*j*sy, nz=z*j;
    p.setXYZ(i, nx+cx, ny+cy, nz+cz);
    v.set(nx, ny/sy, nz).normalize();
    w.set(nx+cx-C.x, ny+cy-C.y, nz+cz-C.z).normalize();
    v.add(w).normalize();
    nrm.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
function shade(bot,top){ return (x,y,z,nx,ny,nz,c)=>{ const v=(0.5+0.58*clamp((y-bot)/(top-bot)))*(0.88+h3(x,y,z)*0.24); c.setRGB(v,v,v); }; }

function makeConifer(o){
  const trunk = paint(cyl(0.1,0.27,o.trunkH,6).translate(0,o.trunkH/2,0), bark(0x4a3524));
  const parts=[]; let top=0;
  for(let i=0;i<o.layers;i++){
    const t=i/o.layers, r=o.r0*(1-t*0.85)+0.15, lh=o.lh*(1-t*0.25);
    const g=new THREE.ConeGeometry(r, lh, 9, 1);
    const p=g.attributes.position;
    for(let k=0;k<p.count;k++){
      const y=p.getY(k);
      if(y<0){ const x=p.getX(k), z=p.getZ(k), j=1+(h3(x,i,z)-0.5)*0.32; p.setX(k,x*j); p.setZ(k,z*j); p.setY(k,y-h3(z,i+1,x)*0.3); }
    }
    g.computeVertexNormals();
    g.rotateY(rand()*TAU);
    const y0=o.start+i*o.spacing+lh*0.5;
    g.translate(0,y0,0);
    parts.push(g); top=y0+lh*0.5;
  }
  const leaves = merge(parts.map(g=>paint(g, shade(o.start, top))));
  return {trunk, leaves};
}
function makeBroadleaf(o){
  const tparts=[];
  if(o.birch){
    tparts.push(paint(cyl(o.tr*0.6,o.tr,o.trunkH,6,14).translate(0,o.trunkH/2,0),(x,y,z,nx,ny,nz,c)=>{
      const band=Math.floor(y*3.3), ang=Math.floor((Math.atan2(z,x)+Math.PI)*1.6);
      if(y<0.5) c.set(0x3a3630);
      else if(h3(band,ang,7)>0.76) c.set(0x2e2b27);
      else c.set(0xe6e1d6).multiplyScalar(0.88+h3(band,1,2)*0.14);
    }));
  } else {
    tparts.push(paint(cyl(o.tr*0.55,o.tr,o.trunkH,7).translate(0,o.trunkH/2,0), bark(o.bark)));
    for(let b=0;b<o.branches;b++){
      const len=o.trunkH*0.6;
      const g=cyl(o.tr*0.18,o.tr*0.38,len,5).translate(0,len/2,0);
      g.rotateZ(0.6+rand()*0.35); g.rotateY(b/o.branches*TAU+rand()*0.5); g.translate(0,o.trunkH*0.72,0);
      tparts.push(paint(g,bark(o.bark)));
    }
  }
  const C=new THREE.Vector3(0,o.crownY,0), lparts=[];
  lparts.push(blob(o.rMain,0,o.crownY,0,o.sy,C));
  for(let k=0;k<o.blobs;k++){
    const a=k/o.blobs*TAU+rand()*0.6, d=o.spread*(0.7+rand()*0.45);
    lparts.push(blob(o.rMain*R(0.55,0.8), Math.cos(a)*d, o.crownY+R(-0.6,0.9)*o.sy, Math.sin(a)*d, o.sy, C));
  }
  const bot=o.crownY-o.rMain*o.sy*1.2, top=o.crownY+o.rMain*o.sy*1.2;
  return {trunk:merge(tparts), leaves:merge(lparts.map(g=>paint(g,shade(bot,top))))};
}
function makeSnag(){
  const parts=[paint(cyl(0.1,0.3,6.5,6).translate(0,3.25,0), bark(0x6b6254))];
  for(let b=0;b<5;b++){
    const len=R(1.2,2.4), g=cyl(0.03,0.08,len,4).translate(0,len/2,0);
    g.rotateZ(R(0.5,1.1)); g.rotateY(rand()*TAU); g.translate(0,R(2.8,5.8),0);
    parts.push(paint(g,bark(0x6b6254)));
  }
  return {trunk:merge(parts), leaves:null};
}
function makeBush(n,spread){
  const C=new THREE.Vector3(0,0.3,0), parts=[];
  for(let k=0;k<n;k++){ const a=k/n*TAU+rand(), d=k===0?0:spread*R(0.5,1); parts.push(blob(R(0.5,0.8),Math.cos(a)*d,R(0.45,0.75),Math.sin(a)*d,0.8,C)); }
  return merge(parts.map(g=>paint(g,shade(0,1.4))));
}
function makeGrass(blades){
  const P=[],N=[],C=[];
  for(let b=0;b<blades;b++){
    const a=rand()*TAU, r=rand()*0.14, bx=Math.cos(a)*r, bz=Math.sin(a)*r;
    const h=R(0.35,0.75), w=R(0.035,0.06), la=rand()*TAU, lean=R(0.05,0.25);
    const ox=Math.cos(la)*lean, oz=Math.sin(la)*lean, pa=rand()*TAU, px=Math.cos(pa)*w, pz=Math.sin(pa)*w;
    P.push(bx-px,0,bz-pz, bx+px,0,bz+pz, bx+ox,h,bz+oz);
    N.push(0,1,0, 0,1,0, 0,1,0);
    C.push(0.42,0.42,0.42, 0.46,0.46,0.46, 1.15,1.15,1.15);
  }
  return mkGeo(P,N,C);
}
function makeFern(){
  const P=[],N=[],C=[], n=8, seg=5;
  for(let f=0;f<n;f++){
    const ang=f/n*TAU+R(-0.2,0.2), L=R(0.9,1.35), dx=Math.cos(ang), dz=Math.sin(ang), px=-dz, pz=dx;
    const pt=t=>[dx*t*L, t*L*0.95 - t*t*L*0.8, dz*t*L, 0.02+0.2*Math.sin(Math.min(t*1.15,1)*Math.PI)*(1-t*0.3)];
    for(let s=0;s<seg;s++){
      const a=pt(s/seg), b=pt((s+1)/seg), ca=0.4+0.6*(s/seg), cb=0.4+0.6*((s+1)/seg);
      const A1=[a[0]-px*a[3],a[1],a[2]-pz*a[3]], A2=[a[0]+px*a[3],a[1],a[2]+pz*a[3]];
      const B1=[b[0]-px*b[3],b[1],b[2]-pz*b[3]], B2=[b[0]+px*b[3],b[1],b[2]+pz*b[3]];
      P.push(...A1,...A2,...B2, ...A1,...B2,...B1);
      for(let k=0;k<6;k++) N.push(0,1,0);
      C.push(ca,ca,ca, ca,ca,ca, cb,cb,cb, ca,ca,ca, cb,cb,cb, cb,cb,cb);
    }
  }
  return mkGeo(P,N,C);
}
function makeStem(h,green){
  const P=[],N=[],C=[];
  for(let k=0;k<2;k++){
    const a=k*Math.PI/2, px=Math.cos(a)*0.012, pz=Math.sin(a)*0.012;
    P.push(-px,0,-pz, px,0,pz, 0,h,0); N.push(0,1,0,0,1,0,0,1,0);
    C.push(green[0]*0.7,green[1]*0.7,green[2]*0.7, green[0]*0.7,green[1]*0.7,green[2]*0.7, ...green);
  }
  return mkGeo(P,N,C);
}
function makeReeds(){
  const P=[],N=[],C=[];
  for(let b=0;b<6;b++){
    const a=rand()*TAU, r=rand()*0.12, bx=Math.cos(a)*r, bz=Math.sin(a)*r, h=R(0.9,1.5), w=0.03;
    const la=rand()*TAU, lean=R(0.05,0.2), pa=rand()*TAU;
    P.push(bx-Math.cos(pa)*w,0,bz-Math.sin(pa)*w, bx+Math.cos(pa)*w,0,bz+Math.sin(pa)*w, bx+Math.cos(la)*lean,h,bz+Math.sin(la)*lean);
    N.push(0,1,0,0,1,0,0,1,0);
    C.push(0.22,0.33,0.14, 0.24,0.35,0.15, 0.55,0.66,0.32);
  }
  const g=mkGeo(P,N,C), parts=[g];
  for(let k=0;k<2;k++){
    const x=R(-0.08,0.08), z=R(-0.08,0.08);
    parts.push(makeStem(1.25,[0.35,0.5,0.2]).translate(x,0,z));
    parts.push(paint(cyl(0.035,0.035,0.22,6).translate(x,1.3,z),()=>_c.set(0x5a3a22)));
  }
  return merge(parts);
}

/* the Sakura Vale's plants: a wide, flat-crowned cherry on a leaning trunk; a clump of bamboo */
function makeSakura(){
  const t=makeBroadleaf({trunkH:3.0, tr:0.34, crownY:4.6, rMain:2.1, blobs:7, spread:2.5, sy:0.55, branches:5, bark:0x4a3434});
  // lean the whole tree a little and flatten the underside of the crown
  const lean=g=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setX(i,p.getX(i)+y*y*0.018); } return g; };
  return {trunk:lean(t.trunk), leaves:lean(t.leaves)};
}
function makeBamboo(){
  const parts=[], leaves=[], C=new THREE.Vector3(0,7,0);
  for(let k=0;k<7;k++){
    const a=k/7*TAU+rand(), r=k?R(0.25,0.7):0, x=Math.cos(a)*r, z=Math.sin(a)*r, h=R(6.5,10), rr=R(0.055,0.08), tilt=R(-0.06,0.06);
    const g=cyl(rr*0.8,rr,h,6,Math.round(h/0.9)).translate(0,h/2,0).rotateZ(tilt).translate(x,0,z);
    parts.push(paint(g,(px,py,pz,nx,ny,nz,c)=>{ const node=Math.abs(((py/0.9)%1)-0.5)>0.44; c.set(node?0x9ab86a:0x6f9a3a).multiplyScalar(0.85+h3(k,Math.floor(py/0.9),1)*0.25); }));
    for(let j=0;j<3;j++) leaves.push(blob(R(0.55,0.85),x+Math.sin(tilt)*-h*0.8+R(-0.4,0.4),h*R(0.72,0.98),z+R(-0.4,0.4),0.5,C,0));
  }
  return {trunk:merge(parts), leaves:merge(leaves.map(g=>paint(g,shade(4,10))))};
}
