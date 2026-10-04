//@ The dungeon's meshes: floor, walls and caps from the bake's cells (merged; the theme's light props baked into their vertex colours), the theme's props by kind, the portal, the hall's rune ring, the objective markers; built in the scene at the run's slot, disposed on leaving
/* agent map
   exports: dgViewBuild(R) (run.js, entering: R.B the bake, R.ox / R.oz its corner, R.y the floor, R.T the theme), dgViewClear() (leaving: every geometry and material disposed),
            dgViewTick(dt) (markers turn and pulse, the glow breathes), dgObjView(o, remove) (an objective's marker, made / recoloured / removed by its state), dgPalOf(T),
            DG_VIEW (what was built: g the group, geos, mats, anchors = the lights [{x, z, y, col, i, r, dyn}] in the bake's metres, meshes, tris, objs), DG_PROP_KINDS, DG_WALL_H
   users: dungeon/run.js, look.js (DG_VIEW.anchors: the point lights follow them), minimap.js
   test: tools/client-smoke.js (the dungeon case), tools/dungeon-client-smoke.js (every prop kind of the three themes builds; the meshes' count and cost)
   How: every cell is walkable (0), a solid prop (1: a legend cell with solid true whose kind is drawn as a prop) or wall (2: '#', a wall-like legend kind, or outside). The floor is one indexed
   grid over cells 0 / 1 and the walls next to them; walls are faces between 2 and the others, in three rows, wobbled by a noise field in the cave themes (the same field for a corner wherever it
   is used, so nothing gaps), with caps on top; props of the same kind in a filled block of up to 3 x 3 cells are one prop (the hall's 2 x 2 pillars), else one per cell. Light props (legend
   `light`), the portal and the boss's circle are anchors: their light is added into the vertex colours of the cells they see (dgLos-like test), and look.js moves a few point lights to
   the nearest. Four meshes (floor; walls and lit props; glowing parts, unlit; soft see-through parts) plus one small group per objective. A prop kind no builder knows draws a rock. */
const DG_WALL_H=6.5, DG_PAL_DEF={wall:0x4a4640,floor:0x3a352e,fog:0x0c0b0a,light:0xffd8a0};
const DG_WOBBLE={hollowroots:0.3,jadesprings:0.2,bonefrostbarrow:0.05};   // how far the walls bulge (m): roots and caves, a little in the barrow's masonry, none in the test set
const DG_AMB={bonefrostbarrow:0.45,blackseam:0.5};   // how bright the ambient light is where a theme is dark (the barrow's cold gloom, the mine's lamp-lit dark); else 0.66
const DG_VIEW={g:null,geos:[],mats:[],anchors:[],glowMat:null,og:null,meshes:0,tris:0,objs:0,kinds:{}};
const dgPalOf=T=>Object.assign({},DG_PAL_DEF,T&&T.pal||{});
const dgvHash=(x,z)=>{ const s=Math.sin(x*127.1+z*311.7)*43758.5453; return s-Math.floor(s); };
const dgvDim=(hex,k)=>new THREE.Color(hex).multiplyScalar(k).getHex();
const dgvAcc=()=>({p:[],n:[],c:[]});
const _dgvM=new THREE.Matrix4(), _dgvQ=new THREE.Quaternion(), _dgvE=new THREE.Euler(), _dgvP=new THREE.Vector3(), _dgvS=new THREE.Vector3(), _dgvC=new THREE.Color(), _dgvT=new THREE.Color();
/* put a primitive (consumed) into accumulator A at (x, y, z) (the bake's metres, floor at 0); o: rx ry rz turns, s or sx sy sz scale, col (hex), va (colour variation, 0.1), foot (darker
   toward the floor), top (hex) with h (the primitive's height: a gradient from col at its bottom to top) */
function dgvPut(A,g,x,y,z,o){
  o=o||{};
  const geo=g.index?g.toNonIndexed():g; if(geo!==g) g.dispose();
  _dgvE.set(o.rx||0,o.ry||0,o.rz||0); _dgvQ.setFromEuler(_dgvE); const s=o.s||1; _dgvS.set(o.sx||s,o.sy||s,o.sz||s); _dgvP.set(x,y,z);
  geo.applyMatrix4(_dgvM.compose(_dgvP,_dgvQ,_dgvS));
  const p=geo.attributes.position, n=geo.attributes.normal, va=o.va===undefined?0.1:o.va, h=o.h||1, grad=o.top!==undefined;
  _dgvC.setHex(o.col===undefined?0x808080:o.col); if(grad) _dgvT.setHex(o.top);
  for(let i=0;i<p.count;i++){
    const px=p.getX(i), py=p.getY(i), pz=p.getZ(i);
    A.p.push(px,py,pz); A.n.push(n.getX(i),n.getY(i),n.getZ(i));
    let k=1+(dgvHash(px*1.7+py*0.3,pz*1.3-py*0.7)-0.5)*2*va; if(o.foot) k*=1-o.foot*Math.max(0,1-py/1.4);
    let r=_dgvC.r, gg=_dgvC.g, b=_dgvC.b; if(grad){ const f=clamp((py-y)/h+0.5); r+=(_dgvT.r-r)*f; gg+=(_dgvT.g-gg)*f; b+=(_dgvT.b-b)*f; }
    A.c.push(r*k,gg*k,b*k);
  }
  geo.dispose();
}
function dgvMesh(A,mat,name){
  if(!A.p.length) return null;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));
  g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mat); m.name=name; DG_VIEW.g.add(m); DG_VIEW.geos.push(g); DG_VIEW.meshes++; DG_VIEW.tris+=A.p.length/9; return m;
}
const dgvCyl=(rt,rb,h,s)=>new THREE.CylinderGeometry(rt,rb,h,s||8,1);
const dgvBox=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const dgvBall=(r,ws,hs)=>new THREE.SphereGeometry(r,ws||8,hs||6);
const dgvDome=r=>new THREE.SphereGeometry(r,9,4,0,TAU,0,Math.PI/2);
const dgvRock=(r,d)=>new THREE.IcosahedronGeometry(r,d||0);
const dgvDisc=(r,s)=>new THREE.CircleGeometry(r,s||12).rotateX(-Math.PI/2);
const dgvRing=(a,b,s)=>new THREE.RingGeometry(a,b,s||20).rotateX(-Math.PI/2);

/* ---- the props, by the kind a theme's legend names (B.props k). (A: {lit, glow, soft}; x, z the middle; w, d the footprint in metres; r a seeded random) ---- */
function dgvMushroom(A,x,z,h,r0,cap,stem,spots){
  dgvPut(A.lit,dgvCyl(r0*0.2,r0*0.28,h,7),x,h/2,z,{col:stem,foot:0.25});
  dgvPut(A.lit,dgvDome(r0),x,h-r0*0.12,z,{col:cap,sy:0.55});
  dgvPut(A.lit,new THREE.CircleGeometry(r0,9).rotateX(Math.PI/2),x,h-r0*0.12,z,{col:0x4a3a40,va:0.04});
  if(spots) for(let i=0;i<4;i++){ const a=i*1.7+x*3.1, rr=r0*0.55; dgvPut(A.glow,dgvBall(r0*0.09,5,3),x+Math.sin(a)*rr,h-r0*0.12+r0*0.42,z+Math.cos(a)*rr,{col:spots,va:0.04}); }
}
function dgvRootPillar(A,x,z,w,d,r){
  const R0=Math.min(w,d)*0.4, H=DG_WALL_H;
  dgvPut(A.lit,new THREE.CylinderGeometry(R0*0.85,R0*1.05,H,10,1),x,H/2,z,{col:0x5a3c26,top:0x3a2818,h:H,foot:0.3});
  for(let i=0;i<7;i++){ const a=i/7*TAU+r()*0.5; dgvPut(A.lit,dgvCyl(0.1,0.22,H*0.94,5),x+Math.sin(a)*R0*0.95,H*0.47,z+Math.cos(a)*R0*0.95,{rx:Math.cos(a)*0.1,rz:-Math.sin(a)*0.1,col:0x4a3020}); }
  dgvPut(A.lit,dgvCyl(R0*1.05,R0*1.55,0.9,10),x,0.45,z,{col:0x4a3220,foot:0.4});
  dgvPut(A.lit,dgvCyl(R0*1.7,R0*0.9,1.3,10),x,H-0.65,z,{col:0x3a2818});
}
function dgvTrunk(A,x,z,w,d,r){
  const R0=Math.min(w,d)*0.42, H=DG_WALL_H;
  dgvPut(A.lit,new THREE.CylinderGeometry(R0*0.9,R0*1.1,H,9,1),x,H/2,z,{col:0x4c3624,top:0x34241a,h:H,foot:0.35});
  for(let i=0;i<4;i++){ const a=i/4*TAU+r(); dgvPut(A.lit,dgvBox(0.32,1.3,R0*1.7),x+Math.sin(a)*R0*0.8,0.5,z+Math.cos(a)*R0*0.8,{ry:a,rx:0.5,col:0x3e2c1e}); }
}
function dgvMushrooms(A,x,z,w,d,r){
  const n=2+(r()<0.5?1:0), sz=Math.min(w,d)/2;
  for(let i=0;i<n;i++){ const a=i/n*TAU+r(), o=i?sz*0.45:0; dgvMushroom(A,x+Math.sin(a)*o,z+Math.cos(a)*o,(i?1.3:2.4)+r()*0.6,(i?0.45:0.85)*sz,r()<0.5?0x7a3a50:0x8a5a3a,0xcfc3a8,0xd8f08a); }
}
function dgvKnot(A,x,z,w,d,r){
  dgvPut(A.lit,dgvRock(1,1),x,1.2,z,{sx:w*0.48,sy:1.6,sz:d*0.48,ry:r()*TAU,col:0x6e3424,va:0.18,foot:0.3});
  dgvPut(A.lit,dgvRock(0.7,1),x+0.2,2.6,z-0.1,{sx:w*0.4,sy:1.2,sz:d*0.4,col:0x5e2c1e,va:0.18});
  dgvPut(A.glow,new THREE.TorusGeometry(Math.min(w,d)*0.44,0.06,4,18).rotateX(Math.PI/2),x,1.35,z,{col:0xb07a2a,va:0.05});
}
function dgvFungus(A,x,z,w,d,r){
  const n=3+Math.floor(r()*3);
  for(let i=0;i<n;i++){ const px=x+(r()-0.5)*1.4, pz=z+(r()-0.5)*1.4, h=0.12+r()*0.25, cr=0.07+r()*0.1;
    dgvPut(A.lit,dgvCyl(0.025,0.035,h,4),px,h/2,pz,{col:0xcfc3a8}); dgvPut(A.glow,new THREE.SphereGeometry(cr,6,3,0,TAU,0,Math.PI/2),px,h,pz,{col:0xb8f070,sy:0.6,va:0.15}); }
}
function dgvSap(A,x,z){ dgvPut(A.glow,dgvDisc(0.88,14),x,0.025,z,{col:0x7a4a10,va:0.08}); dgvPut(A.glow,dgvDisc(0.5,12),x,0.03,z,{col:0xc8841e,va:0.1}); }
function dgvPods(A,x,z,w,d,r){ for(let i=0;i<3;i++) dgvPut(A.lit,dgvBall(0.17,6,4),x+(r()-0.5)*1.2,0.11,z+(r()-0.5)*1.2,{sx:1,sy:0.7,sz:1.3,ry:r()*TAU,col:0x6a5232}); }
function dgvSpikes(A,x,z,w,d,r){ for(let i=0;i<5;i++) dgvPut(A.lit,new THREE.ConeGeometry(0.07,0.3+r()*0.3,4),x+(r()-0.5)*1.4,0.2,z+(r()-0.5)*1.4,{rx:(r()-0.5)*0.5,rz:(r()-0.5)*0.5,col:0x5a3424}); }
function dgvPost(A,x,z){ dgvPut(A.lit,dgvRing(0.8,0.95,18),x,0.02,z,{col:0x221a12,va:0.04}); }
function dgvColumn(A,x,z,w,d){
  const R0=Math.min(w,d)*0.38, H=DG_WALL_H;
  dgvPut(A.lit,new THREE.CylinderGeometry(R0,R0,H,8,1),x,H/2,z,{col:0x2f8064,top:0x3a9a78,h:H,foot:0.25});
  dgvPut(A.lit,dgvBox(R0*2.5,0.5,R0*2.5),x,0.25,z,{col:0x56665e}); dgvPut(A.lit,dgvBox(R0*2.4,0.4,R0*2.4),x,H-0.2,z,{col:0x56665e});
}
function dgvBamboo(A,x,z,w,d,r){
  const n=3+Math.floor(r()*3);
  for(let i=0;i<n;i++){ const px=x+(r()-0.5)*w*0.7, pz=z+(r()-0.5)*d*0.7, h=DG_WALL_H*(0.85+r()*0.2);
    dgvPut(A.lit,dgvCyl(0.08,0.1,h,6),px,h/2,pz,{col:0x5e8e34,top:0x8ab050,h,rx:(r()-0.5)*0.06,rz:(r()-0.5)*0.06});
    for(let j=0;j<2;j++) dgvPut(A.lit,new THREE.ConeGeometry(0.22,0.7,3),px+(r()-0.5)*0.4,h*(0.55+r()*0.4),pz+(r()-0.5)*0.4,{rx:1.2,ry:r()*TAU,col:0x4a7a2a}); }
}
function dgvLantern(A,x,z){
  dgvPut(A.lit,dgvBox(0.8,0.25,0.8),x,0.125,z,{col:0x6e6e66}); dgvPut(A.lit,dgvCyl(0.16,0.2,1.0,6),x,0.75,z,{col:0x7a7a70});
  dgvPut(A.lit,dgvBox(0.55,0.5,0.55),x,1.5,z,{col:0x7a7a70}); dgvPut(A.glow,dgvBox(0.6,0.3,0.42),x,1.5,z,{col:0xffd890,va:0.05}); dgvPut(A.glow,dgvBox(0.42,0.3,0.6),x,1.5,z,{col:0xffd890,va:0.05});
  dgvPut(A.lit,new THREE.ConeGeometry(0.62,0.42,4),x,1.96,z,{ry:Math.PI/4,col:0x6a6a62}); dgvPut(A.lit,dgvBall(0.08,6,4),x,2.22,z,{col:0x6a6a62});
}
function dgvBowl(A,x,z){ dgvPut(A.lit,dgvCyl(0.35,0.45,0.75,8),x,0.375,z,{col:0x6a6a62}); dgvPut(A.lit,dgvCyl(0.62,0.35,0.3,10),x,0.9,z,{col:0x5e5e58}); dgvPut(A.glow,dgvDisc(0.52,10),x,1.055,z,{col:0x3a9a80,va:0.05}); }
function dgvWater(A,x,z){ dgvPut(LITE?A.glow:A.soft,new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),x,0.06,z,{col:LITE?0x2a8a70:0x3cc8a0,va:0.08}); }
function dgvSteam(A,x,z,w,d,r){ if(LITE) return; for(let i=0;i<3;i++) dgvPut(A.soft,dgvBall(0.35+r()*0.3,7,5),x+(r()-0.5)*0.8,0.6+i*0.8+r()*0.3,z+(r()-0.5)*0.8,{col:0xcfe0da,va:0.05}); }
function dgvVent(A,x,z){ dgvPut(A.lit,new THREE.TorusGeometry(0.45,0.12,5,10).rotateX(Math.PI/2),x,0.06,z,{col:0x4a4a44}); dgvPut(A.lit,dgvDisc(0.36,10),x,0.04,z,{col:0x101010,va:0}); dgvPut(A.glow,dgvDisc(0.17,8),x,0.05,z,{col:0x4a9a90}); }
function dgvRunePillar(A,x,z,w,d){
  const H=DG_WALL_H, bw=w*0.72, bd=d*0.72;
  dgvPut(A.lit,dgvBox(bw,H,bd),x,H/2,z,{col:0x55555f,top:0x3c3c46,h:H,foot:0.3}); dgvPut(A.lit,dgvBox(bw*1.2,0.4,bd*1.2),x,0.2,z,{col:0x4a4a52});
  for(const [sx,sz,ry] of [[0,1,0],[0,-1,0],[1,0,Math.PI/2],[-1,0,Math.PI/2]]) dgvPut(A.glow,dgvBox(0.14,1.7,0.04),x+sx*(bw/2+0.01),2.3,z+sz*(bd/2+0.01),{ry,col:0x6a9ae0,va:0.1});
}
function dgvCairn(A,x,z,w,d,r){ let y=0.25; for(let i=0,s=Math.min(w,d)*0.38;i<5&&s>0.18;i++,s*=0.78){ dgvPut(A.lit,dgvRock(s,1),x+(r()-0.5)*0.15,y,z+(r()-0.5)*0.15,{sy:0.55,ry:r()*TAU,col:0x68686e,va:0.15}); y+=s*0.95; } }
function dgvUrn(A,x,z,w,d,r){
  const pts=[[0,0],[0.3,0.02],[0.42,0.3],[0.46,0.6],[0.36,0.95],[0.2,1.1],[0.27,1.2],[0.2,1.22],[0,1.22]].map(([a,b])=>new THREE.Vector2(a,b));
  dgvPut(A.lit,new THREE.LatheGeometry(pts,10),x,0,z,{s:Math.min(w,d)*0.55,col:r()<0.5?0x7a6650:0x6a6a72,top:0x5a4a3a,h:1.3,va:0.08});
}
function dgvBrazier(A,x,z){
  dgvPut(A.lit,dgvCyl(0.12,0.3,1.0,6),x,0.5,z,{col:0x34343a}); dgvPut(A.lit,dgvCyl(0.6,0.32,0.38,8),x,1.15,z,{col:0x2c2c32});
  dgvPut(A.glow,dgvDisc(0.52,10),x,1.35,z,{col:0x3a64a8}); dgvPut(A.glow,new THREE.ConeGeometry(0.32,0.85,6),x,1.76,z,{col:0x7aa8f0}); dgvPut(A.glow,new THREE.ConeGeometry(0.15,0.5,5),x,1.62,z,{col:0xe0f0ff});
}
function dgvSlab(A,x,z,w,d,r){ dgvPut(A.lit,dgvBox(1.6,0.14,0.95),x,0.07,z,{ry:r()<0.5?0:Math.PI/2,col:0x67676e}); }
function dgvBones(A,x,z,w,d,r){ for(let i=0;i<3;i++) dgvPut(A.lit,dgvCyl(0.035,0.035,0.4+r()*0.25,4),x+(r()-0.5)*1.2,0.04,z+(r()-0.5)*1.2,{rz:Math.PI/2,ry:r()*TAU,col:0xd8d2c0}); dgvPut(A.lit,dgvBall(0.13,7,5),x+(r()-0.5)*0.8,0.12,z+(r()-0.5)*0.8,{col:0xe0dccc}); }
function dgvRime(A,x,z){ dgvPut(A.glow,dgvDisc(0.95,9),x,0.015,z,{col:0x4e6478,va:0.1}); dgvPut(A.glow,dgvDisc(0.5,8),x,0.02,z,{col:0x8aa8c4,va:0.1}); }
function dgvRockProp(A,x,z,w,d,r,solid){ dgvPut(A.lit,dgvRock(solid?Math.min(w,d)*0.46:0.35,1),x,solid?0.6:0.2,z,{sy:solid?1.2:0.7,ry:r()*TAU,col:0x6a6660,va:0.15,foot:0.3}); }
// a wall-like kind's faces: a root running down the face, or a burial niche with a skull (fx, fz: the face's middle; dx, dz: from the floor into the wall)
function dgvRootDeco(A,fx,fz,dx,dz,r){ if(r()>0.45) return; const s=(r()-0.5)*1.2, h=4.4+r()*1.6; dgvPut(A.lit,dgvCyl(0.08,0.2,h,5),fx-dx*0.15-dz*s,h/2-0.1,fz-dz*0.15+dx*s,{rx:(r()-0.5)*0.3,rz:(r()-0.5)*0.3,col:0x3e2a1a}); }
function dgvNicheDeco(A,fx,fz,dx,dz,r){
  const ry=Math.atan2(-dx,-dz);
  dgvPut(A.lit,dgvBox(1.3,1.0,0.04),fx-dx*0.02,1.5,fz-dz*0.02,{ry,col:0x74747c}); dgvPut(A.lit,dgvBox(1.05,0.75,0.04),fx-dx*0.05,1.5,fz-dz*0.05,{ry,col:0x121216,va:0.02});
  if(r()<0.6) dgvPut(A.lit,dgvBall(0.13,7,5),fx-dx*0.16,1.25,fz-dz*0.16,{col:0xd8d4c4});
}
/* the builders by kind. wall: drawn as wall runs in that colour (deco: dressing on its faces); build: a prop; li / lr / lh / lc: a light prop's baked strength, reach (m), height and colour
   (else the legend's `light` colour; solid ones shine stronger and farther). A kind not listed here draws a rock (dgvRockProp). */
const DG_PROP_KINDS={
  rootwall:{wall:0x4a3626,deco:dgvRootDeco}, stonerim:{wall:0x3c5850}, burialniche:{wall:0x56565e,deco:dgvNicheDeco},
  rootpillar:{build:dgvRootPillar}, roottrunk:{build:dgvTrunk}, mushrooms:{build:dgvMushrooms}, heartknot:{build:dgvKnot},
  glowfungus:{build:dgvFungus,li:0.55,lr:7}, sappool:{build:dgvSap,li:0.45,lr:6}, seedpods:{build:dgvPods}, rootspikes:{build:dgvSpikes}, guardpost:{build:dgvPost},
  jadecolumn:{build:dgvColumn}, bamboo:{build:dgvBamboo}, stonelantern:{build:dgvLantern,li:0.95,lr:10,lh:1.6}, offeringbowl:{build:dgvBowl},
  springwater:{build:dgvWater,li:0.16,lr:5}, steam:{build:dgvSteam}, steamvent:{build:dgvVent},
  runepillar:{build:dgvRunePillar,li:0.3,lr:6,lc:0x6a9ae0,lh:2.3}, cairn:{build:dgvCairn}, urn:{build:dgvUrn}, brazier:{build:dgvBrazier,li:1,lr:11,lh:1.7}, graveslab:{build:dgvSlab}, bones:{build:dgvBones}, rime:{build:dgvRime}};

/* ---- building ---- */
// can light from (x0, z0) reach (x1, z1)? like dgLos, but steps over the first `skip` metres (a lantern stands in its own solid cell)
function dgvSees(B,x0,z0,x1,z1,skip){ const d=Math.hypot(x1-x0,z1-z0), n=Math.ceil(d/0.9); for(let i=1;i<n;i++){ const k=i/n; if(k*d<skip) continue; if(dgSolid(B,x0+(x1-x0)*k,z0+(z1-z0)*k)) return false; } return true; }
function dgViewBuild(R){
  dgViewClear(); const B=R.B; if(!B) return;
  const T=R.T, pal=dgPalOf(T), W=B.w, H=B.h, N=W*H, wob=T?DG_WOBBLE[T.id]||0.12:0, amb=(T&&DG_AMB[T.id])||0.66;
  const g=new THREE.Group(); g.position.set(R.ox,R.y,R.oz); g.name='dungeon'; scene.add(g); DG_VIEW.g=g;
  const kOf=new Array(N), kind=new Uint8Array(N), lg=B.legend||{}, lightOf={};
  for(const ch in lg){ const e=lg[ch]; if(e&&e.light!==undefined) lightOf[e.prop]=e.light; }
  for(const pr of B.props) kOf[Math.floor(pr.z/DG_CELL)*W+Math.floor(pr.x/DG_CELL)]=pr.k;
  for(let i=0;i<N;i++){ if(B.cells[i]) continue; const k=kOf[i], D=k&&DG_PROP_KINDS[k]; kind[i]=k&&!(D&&D.wall)?1:2; }
  const at=(gx,gz)=>gx<0||gz<0||gx>=W||gz>=H?2:kind[gz*W+gx];
  // the lights: light props (a block of solid ones is one light), the portal, the boss's circle
  const A={lit:dgvAcc(),glow:dgvAcc(),soft:dgvAcc()}, anchors=[], done=new Uint8Array(N), blocks=[];
  for(const pr of B.props){
    const gx=Math.floor(pr.x/DG_CELL), gz=Math.floor(pr.z/DG_CELL), i=gz*W+gx; if(kind[i]===2||done[i]) continue;
    if(kind[i]===0){ blocks.push({k:pr.k,x:pr.x,z:pr.z,w:2,d:2,solid:false,i}); done[i]=1; continue; }
    const q=[i], cells=[]; done[i]=1;   // a block of the same solid kind
    while(q.length){ const c=q.pop(); cells.push(c); const cx=c%W, cz=(c-cx)/W; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, nz=cz+dz, ni=nz*W+nx; if(nx>=0&&nz>=0&&nx<W&&nz<H&&!done[ni]&&kind[ni]===1&&kOf[ni]===pr.k){ done[ni]=1; q.push(ni); } } }
    let x0=W,x1=0,z0=H,z1=0; for(const c of cells){ const cx=c%W, cz=(c-cx)/W; x0=Math.min(x0,cx); x1=Math.max(x1,cx); z0=Math.min(z0,cz); z1=Math.max(z1,cz); }
    const bw=x1-x0+1, bh=z1-z0+1;
    if(bw<=3&&bh<=3&&cells.length===bw*bh) blocks.push({k:pr.k,x:(x0+bw/2)*DG_CELL,z:(z0+bh/2)*DG_CELL,w:bw*DG_CELL,d:bh*DG_CELL,solid:true,i});
    else for(const c of cells){ const cx=c%W, cz=(c-cx)/W; blocks.push({k:pr.k,x:(cx+0.5)*DG_CELL,z:(cz+0.5)*DG_CELL,w:2,d:2,solid:true,i:c}); }
  }
  for(const b of blocks){ const D=DG_PROP_KINDS[b.k]||{}, col=D.lc!==undefined?D.lc:lightOf[b.k]; if(col===undefined) continue;
    anchors.push({x:b.x,z:b.z,y:D.lh||(b.solid?1.6:0.4),col,i:D.li||(b.solid?0.9:0.5),r:D.lr||(b.solid?10:7),skip:b.solid?Math.max(b.w,b.d)*0.5+0.3:0,dyn:(D.li||(b.solid?0.9:0.5))>=0.45}); }
  const st=B.start, sc=R.lay&&R.lay.cells.find(c=>c.x===R.lay.start[0]&&c.z===R.lay.start[1]), dir=DG_STEP.find(s=>sc&&(sc.mask&s[0]))||DG_STEP[0];
  if(st) anchors.push({x:st.x,z:st.z,y:1.4,col:pal.light,i:0.8,r:9,skip:0,dyn:true});
  if(B.boss) anchors.push({x:B.boss.x,z:B.boss.z,y:3,col:pal.light,i:0.35,r:16,skip:0,dyn:false});
  DG_VIEW.anchors=anchors;
  // the light each open cell gets (rgb), from every anchor it can see
  const L=new Float32Array(N*3);
  for(const a of anchors){
    _dgvC.setHex(a.col); const gx0=Math.max(0,Math.floor((a.x-a.r)/DG_CELL)), gx1=Math.min(W-1,Math.floor((a.x+a.r)/DG_CELL)), gz0=Math.max(0,Math.floor((a.z-a.r)/DG_CELL)), gz1=Math.min(H-1,Math.floor((a.z+a.r)/DG_CELL));
    for(let gz=gz0;gz<=gz1;gz++) for(let gx=gx0;gx<=gx1;gx++){
      const i=gz*W+gx; if(kind[i]===2) continue;
      const px=(gx+0.5)*DG_CELL, pz=(gz+0.5)*DG_CELL, dd=Math.hypot(px-a.x,pz-a.z); if(dd>=a.r) continue;
      if(dd>1.5&&!dgvSees(B,a.x,a.z,px,pz,a.skip)) continue;
      const f=a.i*(1-dd/a.r)*(1-dd/a.r); L[i*3]+=_dgvC.r*f; L[i*3+1]+=_dgvC.g*f; L[i*3+2]+=_dgvC.b*f;
    }
  }
  const lit=(i,ch)=>Math.min(1.1,L[i*3+ch]);
  // the floor: one grid over open cells, solid props and the walls beside them; darker in corners (how many of the 4 cells round a corner are open), the light averaged from them
  { const NV=(W+1)*(H+1), pos=new Float32Array(NV*3), nor=new Float32Array(NV*3), col=new Float32Array(NV*3), idx=[], base=new THREE.Color(pal.floor).multiplyScalar(2.8), moss=new THREE.Color(0x2c3a1c).multiplyScalar(2.8), roots=T&&T.id==='hollowroots';
    for(let j=0;j<=H;j++) for(let i=0;i<=W;i++){
      const v=j*(W+1)+i; pos[v*3]=i*DG_CELL; pos[v*3+2]=j*DG_CELL; nor[v*3+1]=1;
      let n=0, lr=0, lgg=0, lb=0;
      for(const [di,dj] of [[-1,-1],[0,-1],[-1,0],[0,0]]){ const ci=i+di, cj=j+dj; if(ci<0||cj<0||ci>=W||cj>=H) continue; const c=cj*W+ci; if(kind[c]<2){ n++; lr+=lit(c,0); lgg+=lit(c,1); lb+=lit(c,2); } }
      const m=n?1/n:0, ao=[0.5,0.68,0.8,0.92,1][n]*(1+noise2(i*0.35,j*0.35)*0.12+(dgvHash(i,j)-0.5)*0.08);
      _dgvT.copy(base); if(roots) _dgvT.lerp(moss,clamp(noise2(i*0.11+7,j*0.11-3)*0.9+0.2));
      col[v*3]=_dgvT.r*ao*(amb+lr*m); col[v*3+1]=_dgvT.g*ao*(amb+lgg*m); col[v*3+2]=_dgvT.b*ao*(amb+lb*m);
    }
    for(let j=0;j<H;j++) for(let i=0;i<W;i++){
      if(at(i,j)===2){ let near=false; for(let dj=-1;dj<=1&&!near;dj++) for(let di=-1;di<=1;di++) if(at(i+di,j+dj)<2){ near=true; break; } if(!near) continue; }
      const v00=j*(W+1)+i, v10=v00+1, v01=v00+W+1, v11=v01+1; idx.push(v00,v01,v11,v00,v11,v10);
    }
    const fg=new THREE.BufferGeometry(); fg.setAttribute('position',new THREE.BufferAttribute(pos,3)); fg.setAttribute('normal',new THREE.BufferAttribute(nor,3)); fg.setAttribute('color',new THREE.BufferAttribute(col,3));
    fg.setIndex(NV>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1)); fg.computeBoundingSphere();
    DG_VIEW.surfMat=dgvSurfMat(); const fm=new THREE.Mesh(fg,DG_VIEW.surfMat); fm.name='floor'; g.add(fm); DG_VIEW.geos.push(fg); DG_VIEW.meshes++; DG_VIEW.tris+=idx.length/3; }
  // the walls: a face wherever a wall meets anything else, in three rows; the same wobble for a corner wherever it is used (walls and caps), so nothing gaps
  { const top=(x,z)=>DG_WALL_H+(wob?noise2(x*0.21,z*0.21)*0.7:0), Ap=A.lit.p, An=A.lit.n, Ac=A.lit.c, cw=new THREE.Color();
    const vx=(x,y,z)=>{ if(!wob) return [x,y,z]; const s=y<0.01?0.4:1; return [x+noise2(x*0.31+y*0.17,z*0.29)*wob*s,y,z+noise2(x*0.27+50,z*0.33-y*0.13)*wob*s]; };
    const rows=[0,2.2,null], rowK=[0.6,1,0.78], rngD=mulberry32((R.seed|0)^0x6d2b79f5);
    for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){
      const ci=gz*W+gx; if(kind[ci]===2) continue;
      for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]){
        if(at(gx+dx,gz+dz)!==2) continue;
        const nx=gx+dx, nz=gz+dz, nk=nx>=0&&nz>=0&&nx<W&&nz<H?kOf[nz*W+nx]:null, D=nk&&DG_PROP_KINDS[nk];
        cw.setHex(D&&D.wall?D.wall:pal.wall).multiplyScalar(2.2);
        const ex=(gx+0.5)*DG_CELL+dx, ez=(gz+0.5)*DG_CELL+dz, ax=ex+dz, az=ez-dx, bx=ex-dz, bz=ez+dx;   // a / b: the face's left and right ends seen from the open cell
        const l=[lit(ci,0),lit(ci,1),lit(ci,2)];
        for(let r=0;r<2;r++){
          const y0=rows[r], y1a=rows[r+1]===null?top(ax,az):rows[r+1], y1b=rows[r+1]===null?top(bx,bz):rows[r+1];
          const a=vx(ax,y0,az), b=vx(bx,y0,bz), c=vx(bx,y1b,bz), d=vx(ax,y1a,az), k0=rowK[r], k1=rowK[r+1];
          for(const [P3,k] of [[a,k0],[b,k0],[c,k1],[a,k0],[c,k1],[d,k1]]){
            Ap.push(P3[0],P3[1],P3[2]); An.push(-dx,0,-dz);
            const v=k*(1+(dgvHash(P3[0]*0.7,P3[2]*0.7+P3[1]*0.4)-0.5)*0.22+noise2(P3[0]*0.4+P3[1]*0.5,P3[2]*0.4)*0.1);
            Ac.push(cw.r*v*(amb+l[0]),cw.g*v*(amb+l[1]),cw.b*v*(amb+l[2]));
          }
        }
        if(D&&D.deco) D.deco(A,ex,ez,dx,dz,rngD);
      }
    }
    for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){   // the caps on walls beside the open
      if(kind[gz*W+gx]!==2) continue; let near=false; for(let dj=-1;dj<=1&&!near;dj++) for(let di=-1;di<=1;di++) if(at(gx+di,gz+dj)<2){ near=true; break; } if(!near) continue;
      const nk=kOf[gz*W+gx], D=nk&&DG_PROP_KINDS[nk]; cw.setHex(D&&D.wall?D.wall:pal.wall).multiplyScalar(0.9);
      const x0=gx*DG_CELL, z0=gz*DG_CELL, x1=x0+DG_CELL, z1=z0+DG_CELL, q=[[x0,z0],[x0,z1],[x1,z1],[x0,z0],[x1,z1],[x1,z0]];
      for(const [x,z] of q){ const P3=vx(x,top(x,z),z); Ap.push(P3[0],P3[1],P3[2]); An.push(0,1,0); const v=amb*(0.9+dgvHash(x,z)*0.2); Ac.push(cw.r*v,cw.g*v,cw.b*v); }
    }
  }
  // the props
  const rng=mulberry32((R.seed|0)^0x2545f491);
  for(const b of blocks){ const D=DG_PROP_KINDS[b.k]; DG_VIEW.kinds[b.k]=(DG_VIEW.kinds[b.k]||0)+1;
    try{ if(D&&D.build) D.build(A,b.x,b.z,b.w,b.d,rng); else dgvRockProp(A,b.x,b.z,b.w,b.d,rng,b.solid); }catch(err){ console.warn('dungeon prop '+b.k+':',err); } }
  // the marks: the portal at the entrance (facing the tile's door), the boss's circle, the monster mouths
  if(st){ const fx=dir[1], fz=dir[2], ry=Math.atan2(fx,fz), lc=pal.light;
    dgvPut(A.glow,new THREE.TorusGeometry(1.7,0.17,6,20,Math.PI),st.x,0.2,st.z,{ry,col:dgvDim(lc,0.95),va:0.05});
    if(!LITE) dgvPut(A.soft,new THREE.CircleGeometry(1.6,20,0,Math.PI),st.x,0.2,st.z,{ry,col:dgvDim(lc,0.55),va:0.02});
    for(const s of [-1,1]) dgvPut(A.lit,dgvBox(0.4,0.5,0.4),st.x+Math.cos(ry)*1.7*s,0.25,st.z-Math.sin(ry)*1.7*s,{ry,col:0x6a6a66});
    dgvPut(A.glow,dgvRing(2.0,2.25,28),st.x,0.02,st.z,{col:dgvDim(lc,0.45),va:0.02}); }
  if(B.boss){ const lc=dgvDim(pal.light,0.4);
    dgvPut(A.glow,dgvRing(4.3,4.6,40),B.boss.x,0.02,B.boss.z,{col:lc,va:0.02}); dgvPut(A.glow,dgvRing(2.9,3.05,32),B.boss.x,0.021,B.boss.z,{col:lc,va:0.02});
    for(let i=0;i<8;i++){ const a=i/8*TAU; dgvPut(A.glow,dgvDisc(0.22,6),B.boss.x+Math.sin(a)*3.7,0.022,B.boss.z+Math.cos(a)*3.7,{col:lc,va:0.02}); } }
  for(const s of B.marks.S){ dgvPut(A.lit,dgvDisc(0.85,10),s.x,0.012,s.z,{col:0x0c0a08,va:0.02}); for(let i=0;i<3;i++){ const a=rng()*TAU; dgvPut(A.lit,dgvRock(0.16,0),s.x+Math.sin(a)*0.9,0.08,s.z+Math.cos(a)*0.9,{col:0x4a4640}); } }
  dgvMesh(A.lit,DG_VIEW.surfMat,'walls');
  DG_VIEW.glowMat=new THREE.MeshBasicMaterial({vertexColors:true}); DG_VIEW.mats.push(DG_VIEW.glowMat); dgvMesh(A.glow,DG_VIEW.glowMat,'glow');
  if(A.soft.p.length){ const sm=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}); DG_VIEW.mats.push(sm); const m=dgvMesh(A.soft,sm,'soft'); if(m) m.renderOrder=2; }
}
// walls, floor and lit props: per-pixel light on a desktop (the torches' pools look round), per-vertex on phones
function dgvSurfMat(){ const m=LOW||LITE?new THREE.MeshLambertMaterial({vertexColors:true}):new THREE.MeshPhongMaterial({vertexColors:true,shininess:8,specular:0x141414}); DG_VIEW.mats.push(m); return m; }
function dgViewClear(){
  const V=DG_VIEW;
  if(V.g){ scene.remove(V.g); V.g.traverse(o=>{ if(o.userData.dgObj) o.userData.dgObj.forEach(m=>m.dispose()); }); }
  for(const geo of V.geos) geo.dispose(); for(const m of V.mats) m.dispose();
  if(V.og) for(const k in V.og) V.og[k].dispose();
  Object.assign(V,{g:null,geos:[],mats:[],anchors:[],glowMat:null,surfMat:null,og:null,meshes:0,tris:0,objs:0,kinds:{}});
}
/* an objective (dgo): a ring on the floor, a turning crystal and a beam of light in its kind's colour (DG_OBJ_KINDS[kind].col: shared/dungeon-hud.js); done: green, no beam; removed: gone */
function dgObjView(o,remove){
  const V=DG_VIEW, R=DG_RUN;
  if(remove||!V.g||!R){ if(o.view){ if(V.g) V.g.remove(o.view); o.view.userData.dgObj.forEach(m=>m.dispose()); o.view=null; V.objs--; } return; }
  if(!V.og) V.og={ring:dgvRing(1.25,1.6,32),oct:new THREE.OctahedronGeometry(0.45,0),beam:new THREE.CylinderGeometry(0.28,0.5,9,12,1,true)};
  if(!o.view){
    const mk=op=>new THREE.MeshBasicMaterial(Object.assign({color:0xffffff,transparent:true,depthWrite:false},op)), ms=[mk({opacity:0.85}),mk({opacity:0.95}),mk({opacity:0.22,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})];
    const g=new THREE.Group(), ring=new THREE.Mesh(V.og.ring,ms[0]), oct=new THREE.Mesh(V.og.oct,ms[1]), beam=new THREE.Mesh(V.og.beam,ms[2]);
    ring.position.y=0.04; oct.position.y=1.6; beam.position.y=4.5; g.add(ring,oct,beam); g.userData.dgObj=ms; g.userData.oct=oct; g.userData.beam=beam; o.view=g; V.g.add(g); V.objs++;
  }
  const K=DG_OBJ_KINDS[o.kind]||{}, col=new THREE.Color(o.st===2?'#9fe08a':K.col||'#ffd27a');
  o.view.userData.dgObj.forEach(m=>m.color.copy(col)); o.view.userData.beam.visible=o.st===1; o.view.position.set(o.x-R.ox,0,o.z-R.oz);
  o.view.children[0].scale.setScalar(Math.max(0.6,(K.r||1.6)/1.6));   // the ring: the kind's circle (an altar's 5 m to stand in, a sighting's area)
}
function dgViewTick(dt){
  const V=DG_VIEW; if(!V.g) return;
  if(V.glowMat){ const k=0.92+0.08*Math.sin(t*1.7); V.glowMat.color.setRGB(k,k,k); }
  if(DG_RUN) for(const o of DG_RUN.objs.values()){ const v=o.view; if(!v) continue; v.userData.oct.rotation.y+=dt*1.4; v.userData.oct.position.y=1.6+Math.sin(t*2+o.id)*0.15; v.userData.beam.material.opacity=0.16+0.08*Math.sin(t*3+o.id); }
}
