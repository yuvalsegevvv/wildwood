//@ The Deep Cave's method props in the floor, the shared kit: the build/frame/clear loop, painted-geometry helpers (rock, parts, glows, beams, rings, halos, label pills) and the server state normaliser; the eight methods' props are method-props-*.js
/* Agent map. Doc: docs/CAVE.md section 15. Test: tools/client-smoke.js (the cave case builds them on every floor). State comes from the server's cm message (methods.js caveMState): a (mural pieces you hold, bit mask), b (geodes 0 sealed / 1 cracked /
   2 charged), c (echo trial {s,k,n}), d (lantern {s,h}), e (silent chamber {s,z,w}), fv (vault {o,w}), g (mole id), h (vm / hm: veins and herbs you took; o / b: ore and herbs held; c: casting), cd. Places = the floor's anchors (caveBake(n).anchors, floor-local metres + R.ox / R.oz).
   exports: caveMPropsBuild(R), caveMPropsClear(), caveMPropsFrame(dt, s), CAVE_MP {g, upd, carry...}, caveMpState(s) (a message with every field present), the painters caveMpRockC / caveMpGradC, caveMpPart(geo, painter, x, y, z, {rx,ry,rz,s,sx,sy,sz}), caveMpRock(sx, sy, sz, jitter, detail).
   builders (one per method, each takes the kit X below): caveMpA/B (method-props-ab.js), caveMpC/D (-cd.js), caveMpE/F (-ef.js), caveMpG/H (-gh.js).
   Look: each prop is a few merged meshes of faceted rock / crystal with painted vertex colours (MeshBasicMaterial, no lights), plus additive glows (halo sprite, beam, ground ring) that say what can be used NOW: lit and pulsing = act on it, dim or changed = done. Phones: fewer facets (LOW), no particles (LITE).
   Everything is disposed in caveMPropsClear (geometries, materials, textures). The kit X: at(x,z,dy) a group on the ground, out(q,k), mesh(parts[,mat]), glow(parts,op), halo(col,size,op), beam(col,h,r,op), ring(col,inner,op), arcs(n,len,inner,col,op), text(w) -> {s,set(txt,col)}, add(fn(state,dt,t)), near(group,d). */
const CAVE_MP={g:null,geos:[],mats:[],texs:[],upd:[],carry:null,R:null,haloTex:null,raw:null,ns:null};
const CAVEMP_NIL={a:0,b:[],c:{},d:{},e:{},fv:{},g:0,h:{},cd:{}};
const CAVEMP_T=new THREE.Color(), CAVEMP_E=new THREE.Euler(), CAVEMP_Q=new THREE.Quaternion(), CAVEMP_V=new THREE.Vector3(), CAVEMP_S=new THREE.Vector3(), CAVEMP_M=new THREE.Matrix4();
function caveMpState(s){   // (the message may be missing fields: the test sends a short one)
  if(!s) return CAVEMP_NIL; if(s===CAVE_MP.raw) return CAVE_MP.ns;
  CAVE_MP.raw=s; return CAVE_MP.ns={a:s.a|0,b:s.b||[],c:s.c||{},d:s.d||{},e:s.e||{},fv:s.fv||{},g:s.g||0,h:s.h||{},cd:s.cd||{}};
}
// painters for paint(geo, fn): faceted rock (lit from above, speckled) and a vertical colour gradient
const caveMpRockC=(hex,v)=>{ v=v===undefined?0.3:v; return (x,y,z,nx,ny,nz,c)=>{ c.set(hex).multiplyScalar((0.5+0.5*(ny*0.5+0.5))*(1-v+h3(x*1.7,y*1.7,z*1.7)*v*2)); }; };
const caveMpGradC=(lo,hi,y0,y1,v)=>(x,y,z,nx,ny,nz,c)=>{ c.set(lo).lerp(CAVEMP_T.set(hi),Math.max(0,Math.min(1,(y-y0)/(y1-y0)))).multiplyScalar((0.82+0.18*(ny*0.5+0.5))*(1-(v||0.1)+h3(x*2.3,y*2.3,z*2.3)*(v||0.1)*2)); };
function caveMpPart(geo,painter,x,y,z,o){   // move the geometry (scale, then rotate, then translate) and paint it
  o=o||{}; CAVEMP_E.set(o.rx||0,o.ry||0,o.rz||0); CAVEMP_Q.setFromEuler(CAVEMP_E); const s=o.s===undefined?1:o.s; CAVEMP_S.set(o.sx||s,o.sy||s,o.sz||s); CAVEMP_V.set(x,y,z);
  geo.applyMatrix4(CAVEMP_M.compose(CAVEMP_V,CAVEMP_Q,CAVEMP_S)); const g=paint(geo,painter); if(g!==geo) geo.dispose(); return g;
}
function caveMpRock(sx,sy,sz,j,d){   // a lumpy faceted boulder (the same vertex always moves the same way, so it stays watertight)
  const g=new THREE.IcosahedronGeometry(1,d===undefined?1:d), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), k=1+(h3(x*3.1,y*3.1,z*3.1)-0.5)*(j||0.4); p.setXYZ(i,x*k*sx,y*k*sy,z*k*sz); }
  g.computeVertexNormals(); return g;
}
function caveMPropsBuild(R){
  caveMPropsClear();
  const MP=CAVE_MP, g=new THREE.Group(); g.name='caveMethodProps'; MP.g=g; MP.R=R; scene.add(g);
  const X={R,g,A:R.B.anchors,MD:caveMethodDef,accent:R.K.light||0x66ccff,fx:!LITE,rd:LOW?0:1,col:new THREE.Color()};
  const keep=(o,list)=>{ list.push(o); return o; };
  X.vc=keep(new THREE.MeshBasicMaterial({vertexColors:true}),MP.mats); X.vcDim=keep(new THREE.MeshBasicMaterial({vertexColors:true,color:0x4a4a4a}),MP.mats);
  const addMat=(o)=>keep(new THREE.MeshBasicMaterial(Object.assign({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false},o)),MP.mats);
  X.addMat=addMat; X.sol=c=>keep(new THREE.MeshBasicMaterial({color:c}),MP.mats);
  X.at=(x,z,dy)=>{ const o=new THREE.Group(); o.position.set(R.ox+x,caveGroundY(R.ox+x,R.oz+z)+(dy||0),R.oz+z); g.add(o); return o; };
  X.out=(q,k)=>[q.x+(q.nx||0)*k,q.z+(q.nz||0)*k];   // a wall point, moved k m off the rock
  X.near=(o,d)=>Math.hypot(P.x-o.position.x,P.z-o.position.z)<d;
  X.mesh=(parts,mat)=>{ const geo=keep(merge(parts),MP.geos); for(const p of parts) p.dispose(); return new THREE.Mesh(geo,mat||X.vc); };
  X.glow=(parts,op)=>X.mesh(parts,addMat({vertexColors:true,opacity:op===undefined?1:op}));
  X.add=fn=>MP.upd.push((s,dt,tt)=>fn(caveMpState(s),dt,tt));
  X.halo=(col,size,op)=>{   // a soft glow sprite (one shared radial texture)
    if(!MP.haloTex){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), gr=x.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.3,'rgba(255,255,255,.45)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64); MP.haloTex=keep(new THREE.CanvasTexture(c),MP.texs); }
    const m=keep(new THREE.SpriteMaterial({map:MP.haloTex,color:col,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}),MP.mats), s=new THREE.Sprite(m); s.scale.set(size,size,1); return s; };
  X.beam=(col,h,r,op)=>{   // a column of light that fades upward (additive, so black = nothing)
    const geo=keep(new THREE.CylinderGeometry(r*0.35,r,h,8,1,true).translate(0,h/2,0),MP.geos), p=geo.attributes.position, c=new THREE.Color(col), a=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){ const k=1-p.getY(i)/h; a[i*3]=c.r*k*k; a[i*3+1]=c.g*k*k; a[i*3+2]=c.b*k*k; }
    geo.setAttribute('color',new THREE.BufferAttribute(a,3)); return new THREE.Mesh(geo,addMat({vertexColors:true,opacity:op,side:THREE.DoubleSide})); };
  X.ring=(col,inner,op)=>{ const geo=keep(new THREE.RingGeometry(inner,1,32).rotateX(-Math.PI/2),MP.geos); return new THREE.Mesh(geo,addMat({color:col,opacity:op})); };   // radius 1, scale it
  X.arcs=(n,len,inner,col,op)=>{ const parts=[]; for(let k=0;k<n;k++) parts.push(paint(new THREE.RingGeometry(inner,1,10,1,k/n*Math.PI*2,len).rotateX(-Math.PI/2),(x,y,z,nx,ny,nz,c)=>c.set(col))); return X.glow(parts,op); };   // dashes of a ring, radius 1
  X.text=(w)=>{   // a small label pill (a canvas redrawn only when the text changes)
    const cv=document.createElement('canvas'); cv.width=256; cv.height=64; const tex=keep(new THREE.CanvasTexture(cv),MP.texs), m=keep(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false}),MP.mats), s=new THREE.Sprite(m); s.scale.set(w,w/4,1);
    let last=''; return {s,set(txt,col){ if(last===txt+col) return; last=txt+col; const x=cv.getContext('2d'); x.clearRect(0,0,256,64); x.fillStyle='rgba(10,10,14,.72)'; x.beginPath(); x.moveTo(30,8); x.arcTo(250,8,250,56,24); x.arcTo(250,56,6,56,24); x.arcTo(6,56,6,8,24); x.arcTo(6,8,250,8,24); x.fill();
      x.strokeStyle=col; x.lineWidth=3; x.stroke(); x.font='bold 27px sans-serif'; x.textAlign='center'; x.fillStyle='#f4efe4'; x.fillText(txt,128,42); tex.needsUpdate=true; }}; };
  for(const [k,f] of [['A',caveMpA],['B',caveMpB],['C',caveMpC],['D',caveMpD],['E',caveMpE],['F',caveMpF],['G',caveMpG],['H',caveMpH]]) try{ f(X); }catch(err){ console.error('cave props '+k+':',err); }
}
function caveMPropsFrame(dt,s){
  const MP=CAVE_MP; if(!MP.g) return; const tt=performance.now()/1000;
  for(const f of MP.upd) try{ f(s,dt,tt); }catch(err){ console.error('cave props:',err); MP.upd.length=0; break; }
}
function caveMPropsClear(){
  const MP=CAVE_MP; if(MP.g){ scene.remove(MP.g); }
  for(const o of MP.geos) o.dispose(); for(const o of MP.mats) o.dispose(); for(const o of MP.texs) o.dispose();
  MP.g=null; MP.geos=[]; MP.mats=[]; MP.texs=[]; MP.upd=[]; MP.carry=null; MP.R=null; MP.haloTex=null; MP.raw=null; MP.ns=null;
}
