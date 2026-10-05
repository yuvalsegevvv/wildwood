//@ The Sakura Vale's buildings: Hanami (tiled roofs, shoji, timber gates, stone lanterns), the border bridge (deck, piers, gatehouse, sealed door), teleport circles, the dressing of the two boss arenas
/* Hanami follows the home village's plan (VIL2 from shared/vale.js has the same houses, stalls, anchors and colliders),
   so only the look changes here. The bridge's deck is ground for the player (bridgeDeck, shared/roads.js); this file draws it in stone
   vault and a lid of mountain on top, frames both portals, and shuts the west portal with a door until GEAR.east >= 1. */
const VALE={door:null,doorOpen:0,circles:[],fx:[],lights:[]};
function faceTri(P,a,b,c,hx,hy,hz){   // a triangle wound so that its normal points toward the hint direction
  const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2], vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
  const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
  if(nx*hx+ny*hy+nz*hz>=0) P.push(...a,...b,...c); else P.push(...a,...c,...b);
}
// a hipped roof: eaves W x D at y 0, a ridge 2*rh long at height H, with an underside `th` below
function hipRoof(W,D,H,rh,th){
  const P=[], w=W/2, d=D/2, b=[[-w,0,-d],[w,0,-d],[w,0,d],[-w,0,d]], r0=[-rh,H,0], r1=[rh,H,0];
  const top=(a,bb,c,hx,hz)=>{ faceTri(P,a,bb,c,hx,1,hz); faceTri(P,[a[0],a[1]-th,a[2]],[bb[0],bb[1]-th,bb[2]],[c[0],c[1]-th,c[2]],-hx,-1,-hz); };
  top(b[0],b[1],r1,0,-1); top(b[0],r1,r0,0,-1); top(b[3],b[2],r1,0,1); top(b[3],r1,r0,0,1);
  top(b[0],b[3],r0,-1,0); top(b[1],b[2],r1,1,0);
  return trisGeo(P);
}
const tileC=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.8+0.14*((Math.floor(y*7+Math.abs(x)*0.4))&1)+h3(Math.floor(x*3),0,Math.floor(z*3))*0.08); };
function buildVale(){
  const out=[], win=[], V=VIL2, Y=V.h;
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), W:(g,col)=>win.push(pc(g,c=>c.set(col||0xf2ead8)).applyMatrix4(F))});
  const dark=woodC(0x2e2018), wood=woodC(0x6a4a30), red=woodC(0xa8281e), plaster=(x,y,z,c)=>c.set(0xeee8da).multiplyScalar(0.94+h3(x,y,z)*0.08);
  const lantern=(A,W,h)=>{   // a stone toro, h metres tall
    const s=h/1.9;
    A(cyl(0.34*s,0.4*s,0.16*s,6).translate(0,0.08*s,0),stoneC); A(cyl(0.1*s,0.13*s,0.8*s,8).translate(0,0.56*s,0),stoneC);
    A(cyl(0.3*s,0.24*s,0.12*s,6).translate(0,1.0*s,0),stoneC); W(vbox(0.34*s,0.34*s,0.34*s,0,1.24*s,0),0xf6e0b0);
    for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]]) A(vbox(0.06*s,0.36*s,0.06*s,x*0.17*s,1.24*s,z*0.17*s),stoneC);
    A(new THREE.ConeGeometry(0.44*s,0.3*s,6).translate(0,1.56*s,0),stoneC); A(csph(0.07*s,6,5).translate(0,1.76*s,0),stoneC);
  };
  // houses: stone footing, dark timber below and white plaster above, shoji windows, a deep tiled hip roof
  const roofs=[0x3a4048,0x44403e,0x363c46,0x4a4442,0x3e4650];
  for(const H of V.houses){
    const F=frameM(H.x,Y,H.z,H.rot), {A,W}=inF(F), {w,d,wh}=H, base=0.45, roof=roofs[H.i%5];
    A(vbox(w+0.35,0.95,d+0.35,0,base-0.47,0),stoneC);
    A(vbox(w,wh,d,0,base+wh/2,0),(x,y,z,c)=>{ if(y<base+wh*0.42) c.set(0x5a3a28).multiplyScalar(0.85+h3(Math.floor(x*4),0,Math.floor(z*4))*0.2); else plaster(x,y,z,c); });
    for(const sx of [-1,0,1]) for(const sz of [-1,1]) if(sx||w>5.6) A(vbox(0.22,wh+0.1,0.22,sx*w/2,base+wh/2,sz*d/2),dark);
    for(const sx of [-1,1]) A(vbox(0.22,wh+0.1,0.22,sx*w/2,base+wh/2,0),dark);
    for(const sz of [-1,1]) A(vbox(w+0.12,0.16,0.14,0,base+wh*0.42,sz*(d/2+0.02)),dark);
    for(const sx of [-1,1]) A(vbox(0.14,0.16,d+0.12,sx*(w/2+0.02),base+wh*0.42,0),dark);
    A(vbox(w+1.1,0.12,1.0,0,base+0.02,-d/2-0.55),wood);   // the veranda
    A(vbox(1.25,2.0,0.1,0,base+1.0,-d/2-0.04),woodC(0x4a3020));
    for(let k=0;k<3;k++) A(vbox(0.04,1.9,0.12,-0.4+k*0.4,base+1.0,-d/2-0.08),dark);
    const shoji=(px,py,pz,ry,ww)=>{ const M=new THREE.Matrix4().makeRotationY(ry).setPosition(px,py,pz);
      W(vbox(ww,0.8,0.06).applyMatrix4(M));
      for(let k=1;k<4;k++) A(vbox(0.03,0.82,0.1,-ww/2+k*ww/4,0,0).applyMatrix4(M),dark);
      A(vbox(ww+0.06,0.03,0.1,0,0.02,0).applyMatrix4(M),dark); A(vbox(ww+0.14,0.08,0.12,0,0.44,0).applyMatrix4(M),dark); A(vbox(ww+0.14,0.08,0.12,0,-0.44,0).applyMatrix4(M),dark); };
    const wy=base+wh*0.7;
    shoji(-w*0.3,wy,-d/2-0.06,0,1.1); shoji(w*0.3,wy,-d/2-0.06,0,1.1);
    shoji(-w/2-0.06,wy,0,Math.PI/2,1.3); shoji(w/2+0.06,wy,0,-Math.PI/2,1.3); shoji(0,wy,d/2+0.06,Math.PI,1.6);
    const rh=Math.max(0.3,(w-d)/2+0.4), top=base+wh;
    A(hipRoof(w+1.9,d+1.9,H.tavern?2.2:1.7,rh,0.18).translate(0,top-0.05,0),tileC(roof));
    A(vbox(rh*2+0.6,0.22,0.3,0,top+(H.tavern?2.2:1.7)-0.02,0),tileC(0x2a2e34));
    for(const sd of [-1,1]) A(new THREE.ConeGeometry(0.14,0.4,5).rotateZ(sd*0.6).translate(sd*(rh+0.35),top+(H.tavern?2.25:1.75),0),tileC(0x2a2e34));   // the ridge ends curl up
    if(H.tavern){   // the teahouse: a second storey with its own roof, red lanterns and a noren over the door
      const t2=top+0.9;
      A(vbox(w*0.62,1.7,d*0.62,0,t2+0.85,0),plaster);
      for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.2,1.8,0.2,sx*w*0.31,t2+0.9,sz*d*0.31),dark);
      shoji(0,t2+0.9,-d*0.31-0.06,0,1.6);
      A(hipRoof(w*0.62+1.5,d*0.62+1.5,1.4,Math.max(0.3,(w-d)*0.31+0.3),0.15).translate(0,t2+1.7,0),tileC(roof));
      for(const sx of [-1,1]){ W(csph(0.24,10,8).scale(1,1.25,1).translate(sx*1.6,base+2.25,-d/2-0.6),0xe8401e); A(cyl(0.02,0.02,0.4,4).translate(sx*1.6,base+2.75,-d/2-0.6),dark); }
      for(let k=0;k<3;k++) A(vbox(0.38,0.7,0.02,-0.42+k*0.42,base+1.8,-d/2-0.14),c=>c.set(0x2f3a6b));
    }
    if(H.flowers) for(const sx of [-1,1]) A(cyl(0.24,0.18,0.36,8).translate(sx*(w/2-0.5),base+0.2,-d/2-1.3),c=>c.set(0x6a5a4a));
  }
  // the well, with a small tiled roof
  { const {A}=inF(frameM(V.x,Y,V.z,V.ent));
    A(new THREE.CylinderGeometry(1.1,1.2,0.8,16).translate(0,0.4,0),(x,y,z,c)=>{ if(y>0.78 && Math.hypot(x,z)<0.95) c.set(0x1c2a36); else stoneC(x,y,z,c); });
    for(const sd of [-1,1]) A(vbox(0.16,2.3,0.16,sd*0.95,1.15,0),dark);
    A(cyl(0.06,0.06,2.1,8).rotateZ(Math.PI/2).translate(0,1.75,0),wood);
    A(hipRoof(2.9,1.9,0.7,0.6,0.1).translate(0,2.25,0),tileC(0x3a4048));
    A(cyl(0.16,0.13,0.28,10).translate(0,1.2,0),wood);
  }
  // stalls: a counter, a little tiled roof, noren curtains in each stall's colour
  const noren=[0x2f3a6b,0x8a2a26,0x3d5a3a];
  for(const st of V.stalls){
    const {A,W}=inF(frameM(st.x,Y,st.z,st.rot));
    A(vbox(2.6,0.9,1.1,0,0.45,0),wood);
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.12,2.6,0.12,sx*1.25,1.3,sz*0.5),dark);
    A(hipRoof(3.3,2.0,0.7,0.8,0.08).translate(0,2.55,0),tileC(0x3a4048));
    for(let k=0;k<5;k++) A(vbox(0.5,0.62,0.02,-1.0+k*0.5,2.2,-0.56),(x,y,z,c)=>{ c.set(noren[st.i]); if(y<2.0) c.multiplyScalar(0.85); });
    if(st.i===0){ for(let k=0;k<3;k++){ A(vbox(0.035,0.9,0.02,-0.8+k*0.3,0.93,-0.2).rotateZ(Math.PI/2),c=>c.set(0xd9e2ea)); A(vbox(0.26,0.035,0.035,-1.05+k*0.3+0.6,0.95,-0.2),c=>c.set(0x1a1414)); }
      A(new THREE.TorusGeometry(0.45,0.02,5,20,Math.PI*0.62).rotateX(Math.PI/2).translate(0.6,0.93,0.05),c=>c.set(0x2a1a14)); }
    else if(st.i===1){ for(let k=0;k<3;k++) A(new THREE.SphereGeometry(0.16,12,8,0,TAU,0,Math.PI/2).translate(-0.85+k*0.42,0.9,-0.15),c=>c.set([0x8a2a26,0x24222a,0xd4a83a][k]));
      A(vbox(0.5,0.6,0.22,0.75,1.2,0.05),(x,y,z,c)=>c.set(0x8a2a26).multiplyScalar(0.75+0.3*((Math.floor(y*14))&1))); }
    else { const iron=c=>c.set(0x3a3c40);
      A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),wood); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),iron);
      A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),iron);
      for(let j=0;j<7;j++) A(new THREE.DodecahedronGeometry(0.07,0).translate(-1.95+Math.sin(j*2.4)*0.18,0.54,0.5+Math.cos(j*2.4)*0.18),c=>c.set(0xff6a1a));
      for(let k=0;k<4;k++) A(new THREE.OctahedronGeometry(0.09,0).translate(-0.75+k*0.5,1.02,-0.1),c=>c.set([0x5b9cf0,0xb77cf5,0xf0cd45,0x62d66e][k]));
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m); }
  }
  // the quest board: red posts and a tiled cap
  { const B=V.board, {A}=inF(frameM(B.x,Y,B.z,B.rot));
    for(const sx of [-1,1]){ A(vbox(0.22,3.5,0.22,sx*1.9,1.75,0),red); A(vbox(0.42,0.3,0.42,sx*1.9,0.1,0),stoneC); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),(x,y,z,c)=>c.set(0x6a4a30).multiplyScalar(0.85+h3(x,y,z)*0.08));
    A(vbox(4.2,0.16,0.22,0,3.0,0),red); A(vbox(4.4,0.14,0.26,0,0.9,0),dark);
    A(hipRoof(4.8,1.2,0.5,1.8,0.08).translate(0,3.35,0),tileC(0x3a4048));
    [[-1.2,2.4],[-0.4,2.45],[0.45,2.4],[1.25,2.45],[-1.25,1.5],[-0.45,1.55],[0.4,1.5],[1.2,1.55]].forEach(([x,y],i)=>A(new THREE.BoxGeometry(0.56,0.7,0.012).rotateZ((h3(i,3,7)-0.5)*0.2).translate(x,y,0.062),c=>c.set([0xf2ead6,0xe6d6b0,0xefe4c8][i%3])));
    questSign(B,Y,{bg:'#6a1a14',line:'#e8c060',ink:'#fff4dc',font:60,w:2.2,h:0.48,y:3.02,z:0.13,glow:0x2a0a04});
  }
  // the brazier fire and stone benches
  { const fp=V.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));
    A(cyl(0.8,0.95,0.35,8).translate(0,0.17,0),stoneC); A(cyl(0.62,0.62,0.05,8).translate(0,0.36,0),c=>c.set(0x2a2220));
    for(let k=0;k<3;k++) A(cyl(0.08,0.08,1.0,6).rotateZ(Math.PI/2).rotateY(k*1.05).translate(0,0.42,0),woodC(0x3a2a1c));
    for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.3:0.18,k===0?1.0:0.65,7),flameMats[k===0?0:1]);
      m.position.set(fp.x+(k?Math.sin(k*2.1)*0.18:0),Y+0.8,fp.z+(k?Math.cos(k*2.1)*0.18:0)); scene.add(m); flames.push(m); }
  }
  for(const b of V.benches){ const {A}=inF(frameM(b.x,Y,b.z,b.rot)); A(vbox(1.8,0.14,0.5,0,0.42,0),stoneC); for(const sx of [-1,1]) A(vbox(0.3,0.36,0.4,sx*0.6,0.18,0),stoneC); }
  for(const l of V.lamps){ const {A,W}=inF(frameM(l.x,Y,l.z,l.rot)); lantern(A,W,1.9); }
  for(const [x,z] of V.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(cyl(0.36,0.36,0.8,12).translate(0,0.4,0),(px,py,pz,c)=>{ c.set(0xd8c8a0).multiplyScalar(0.9+h3(Math.floor(Math.atan2(pz,px)*6),0,0)*0.15); if(Math.abs(py-0.4)<0.14) c.set(0xb02a1e); }); }
  for(const [x,z,r] of V.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x8a6a44)); }
  // a raked-gravel garden with three stones and a low bamboo fence
  { const G=V.garden, {A}=inF(frameM(G.x,Y,G.z,G.rot));
    A(vbox(5.8,0.08,4.2,0,0.04,0),(x,y,z,c)=>{ c.set(0xd8d2c4); if(Math.abs(Math.sin(z*9))<0.3) c.multiplyScalar(0.86); });
    [[-1.4,-0.6,0.55],[0.9,0.7,0.4],[1.8,-0.9,0.3]].forEach(([x,z,r])=>A(new THREE.DodecahedronGeometry(r,0).scale(1,0.7,1).translate(x,r*0.5,z),stoneC));
    for(const sz of [-1,1]) A(cyl(0.035,0.035,6.2,5).rotateZ(Math.PI/2).translate(0,0.45,sz*2.2),c=>c.set(0x9ab86a));
    for(const sx of [-1,1]) A(cyl(0.035,0.035,4.4,5).rotateX(Math.PI/2).translate(sx*3.05,0.45,0),c=>c.set(0x9ab86a));
    for(let x=-3;x<=3.01;x+=1.5) for(const sz of [-1,1]) A(cyl(0.04,0.04,0.7,5).translate(x,0.35,sz*2.2),c=>c.set(0x7aa04a));
  }
  { const S=V.sign, {A}=inF(frameM(S.x,Y,S.z,S.rot)); A(vbox(0.14,2.3,0.14,0,1.15,0),dark); A(vbox(0.5,1.3,0.08,0,1.55,0.08),woodC(0x8a6a44)); A(hipRoof(0.8,0.4,0.18,0.2,0.04).translate(0,2.3,0.04),tileC(0x3a4048)); }
  // the village gate on the road in: two timber posts on stone footings, a heavy beam and a small tiled roof, a paper lantern hanging under it
  { const e=V.ent, p=[V.x+Math.sin(e)*(VR+9),V.z+Math.cos(e)*(VR+9)], {A,W}=inF(frameM(p[0],getH(p[0],p[1]),p[1],e)), post=woodC(0x4a3020), beam=woodC(0x2e2018);
    for(const sx of [-1,1]){ A(vbox(0.9,0.4,0.9,sx*2.5,0.2,0),stoneC); A(cyl(0.22,0.26,4.4,10).translate(sx*2.5,2.6,0),post);
      const c=Math.cos(e), s=Math.sin(e); V.circles.push([p[0]+sx*2.5*c,p[1]-sx*2.5*s,0.35]); }
    A(vbox(5.8,0.36,0.46,0,4.5,0),beam); A(vbox(5.0,0.22,0.36,0,3.7,0),beam);
    A(hipRoof(7.0,2.2,0.95,1.6,0.14).translate(0,4.68,0),tileC(0x3a4048));
    A(cyl(0.012,0.012,0.5,4).translate(0,3.45,0),c=>c.set(0x1a1414)); W(csph(0.24,10,8).scale(1,1.3,1).translate(0,3.05,0),0xf0c070);
  }
  // cherry trees behind the houses (the forest keeps its distance from the village)
  { const items=[], hA=V.houses.map(h=>h.a);
    for(let i=0;i<7;i++){ const a=(hA[i]+hA[i+1])/2, r=31, x=V.x+Math.sin(a)*r, z=V.z+Math.cos(a)*r, s=R(0.85,1.1);
      items.push({x,z,m:mtx(x,getH(x,z)-0.15,z,a,s,s,s),c:tint(pick(PAL.sakura))}); addCol(x,z,RAD.sakura*s); }
    addTreeKind('sakura',items);
  }
  buildBridge(inF);   // (the tunnel, once)
  for(const A of [ARENA20,ARENA25]) buildArenaDressing(A,inF);
  addVillageMeshes(out,win);
  for(const c of V.circles) addCol(c[0],c[1],c[2]);
  for(const VV of VILS) buildCircle(VV);
}
/* ---- the border bridge (it was the tunnel): a stone deck over the Greyfall River with parapets and piers, a gatehouse across its west end (two towers, a lintel, the rune-carved door
   that sinks when the Rootwarden has fallen), stone lanterns along the parapets and a timber gate at the east end ---- */
function buildBridge(inF){
  const T=TUN, W=T.w+0.6, R0=T.w+0.25, x0=T.p0-0.5, x1=T.p1+0.5, step=2, bx=borderX(T.z), P=[], C=[], col=new THREE.Color();
  const quad=(a,b,c,d,k)=>{ P.push(...a,...b,...c, ...a,...c,...d); for(let v=0;v<6;v++) C.push(k.r,k.g,k.b); };
  for(let x=x0;x<x1-0.01;x+=step){ const xb=Math.min(x1,x+step), ya=T.floor(x), yb=T.floor(xb), block=Math.floor(x/1.2)&1, m=0.62+0.2*block+h3(Math.floor(x),1,3)*0.1;
    col.set(0x8a847a).multiplyScalar(m); quad([x,ya,T.z-W],[xb,yb,T.z-W],[xb,yb,T.z+W],[x,ya,T.z+W],col);   // the deck's top
    col.set(0x6a645a).multiplyScalar(m);
    for(const sz of [-1,1]) quad([x,ya-1.1,T.z+sz*W],[xb,yb-1.1,T.z+sz*W],[xb,yb,T.z+sz*W],[x,ya,T.z+sz*W],col);   // the sides
    col.set(0x56524a); quad([x,ya-1.1,T.z-W],[xb,yb-1.1,T.z-W],[xb,yb-1.1,T.z+W],[x,ya-1.1,T.z+W],col);            // the underside
    col.set(0x7a746a).multiplyScalar(m);
    for(const sz of [-1,1]){ const zo=T.z+sz*W, zi=T.z+sz*(W-0.5);   // the parapet: a low wall, 1 m high, 0.5 m thick
      quad([x,ya,zo],[xb,yb,zo],[xb,yb+1,zo],[x,ya+1,zo],col); quad([x,ya,zi],[xb,yb,zi],[xb,yb+1,zi],[x,ya+1,zi],col); quad([x,ya+1,zi],[xb,yb+1,zi],[xb,yb+1,zo],[x,ya+1,zo],col); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); g.computeVertexNormals();
  const deck=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})); deck.castShadow=true; deck.receiveShadow=true; scene.add(deck);
  // piers standing in the river, one at the middle and one a third of the way to each bank
  for(const u of [-0.3,0,0.3]){ const px=bx+u*(T.p1-T.p0), top=T.floor(px)-1.1, {A}=inF(frameM(px,0,T.z,0));
    A(vbox(2.6,top+5,W*2-0.8,0,(top-5)/2,0),stoneC); A(vbox(3.2,0.4,W*2+0.2,0,top-0.2,0),stoneC); }
  // the gatehouse across the west end: two towers, a lintel over the road, violet runes like the stone circle's
  { const f=T.floor(x0), {A}=inF(frameM(x0,0,T.z,0)), th=T.roof+3.2;
    for(const sz of [-1,1]){ const zc=sz*(W+1.1);
      A(vbox(3.2,th,2.8,-0.4,f+th/2-0.4,zc),(x,y,z,c)=>{ stoneC(x,y,z,c); if(Math.abs(y-f-3)<0.12) c.set(0xb07ae0); });
      A(vbox(3.8,0.5,3.4,-0.4,f+th-0.2,zc),stoneC);
      for(const k of [-1,1]) A(vbox(0.7,0.7,0.7,-0.4+k*1.5,f+th+0.35,zc+k*1.2*sz),stoneC);   // a merlon at each corner
      addCol(x0-0.4,T.z+zc,1.9); }
    A(vbox(2.6,0.9,W*2+1.0,-0.4,f+T.roof+0.3,0),(x,y,z,c)=>{ stoneC(x,y,z,c); if(Math.abs(y-f-T.roof-0.3)<0.1) c.set(0xb07ae0); });   // the lintel
  }
  // the timber gate at the east end
  { const px=x1+7, f=T.floor(Math.min(px,T.x1)), {A}=inF(frameM(px,f,T.z,Math.PI/2)), post=woodC(0x4a3020);
    for(const sx of [-1,1]){ A(vbox(0.8,0.36,0.8,sx*3.2,0.18,0),stoneC); A(cyl(0.2,0.24,4.0,10).translate(sx*3.2,2.36,0),post); addCol(px,T.z-sx*3.2,0.3); }
    A(vbox(7.0,0.32,0.44,0,4.1,0),woodC(0x2e2018)); A(hipRoof(8.2,2.0,0.9,2.2,0.12).translate(0,4.26,0),tileC(0x3a4048)); }
  // stone lanterns on the parapets every 12 m (lit)
  { const lw=[], la=[];
    for(let x=T.p0+6;x<T.p1-3;x+=12) for(const sz of [-1,1]){ const y=T.floor(x)+1.0, z=T.z+sz*(W-0.25);
      la.push(pc(cyl(0.16,0.2,0.5,6).translate(x,y+0.25,z),c=>c.set(0x6a645a)));
      lw.push(pc(csph(0.26,10,8).scale(1,1.2,1).translate(x,y+0.85,z),c=>c.set(0xf0c070))); }
    if(lw.length){ scene.add(new THREE.Mesh(merge(lw),windowMat)); scene.add(new THREE.Mesh(merge(la),villageMat)); } }
  // the door: a slab of runed stone across the west end, open once the Rootwarden has fallen (for you)
  { const f=T.floor(x0), g2=merge([pc(vbox(0.8,T.roof-0.1,R0*2-0.1,0,(T.roof-0.1)/2,0),(x,y,z,c)=>{ stoneC(x,y,z,c); c.multiplyScalar(0.8); }),
      pc(new THREE.TorusGeometry(1.1,0.07,6,24).rotateY(Math.PI/2).translate(-0.42,T.roof*0.5,0),c=>c.set(0xb07ae0)),
      pc(new THREE.OctahedronGeometry(0.35,0).rotateY(Math.PI/2).translate(-0.44,T.roof*0.5,0),c=>c.set(0xd8a8ff))]);
    VALE.door=new THREE.Mesh(g2,new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x1a0828})); VALE.door.position.set(x0+0.7,f,T.z); VALE.door.castShadow=true; scene.add(VALE.door);
    VALE.doorOpen=valeOpen()?1:0; VALE.door.visible=!VALE.doorOpen; }
}
/* ---- the dressing of the vale's two boss arenas: the Demon Gate's red pillars and its great stone gate, the Foxfire Hollow's lanterns and standing stones ---- */
function buildArenaDressing(A,inF){
  const red=woodC(0xa8281e);
  if(A.key==='boss20'){   // the Demon Gate: red pillars round the ring, a great gate of dark stone on the far side (docs/STORY.md: the stone that cannot be cut)
    for(let k=0;k<10;k++){ const a=k/10*TAU+0.3, x=A.x+Math.sin(a)*(A.r+1.6), z=A.z+Math.cos(a)*(A.r+1.6), h=AR(3,4), {A:B}=inF(frameM(x,A.h-0.3,z,a));
      B(cyl(0.3,0.36,h,8).translate(0,h/2,0),red); B(vbox(0.9,0.28,0.9,0,h+0.1,0),c=>c.set(0x1a1414)); addCol(x,z,0.5); }
    const a=Math.atan2(A.x-VIL2.x,A.z-VIL2.z)+Math.PI, x=A.x-Math.sin(a)*(A.r+5), z=A.z-Math.cos(a)*(A.r+5), {A:B}=inF(frameM(x,A.h-0.3,z,a));
    const dark=(px,py,pz,c)=>{ stoneC(px,py,pz,c); c.multiplyScalar(0.72); };
    const seam=c=>c.set(0xd8502a);   // ember seams inlaid in the dark stone
    for(const sx of [-1,1]){ B(vbox(1.9,8.4,1.7,sx*4.7,4.2,0),dark); addCol(x+sx*4.7*Math.cos(a),z-sx*4.7*Math.sin(a),1.1); }
    B(vbox(13.4,1.4,2.1,0,9.1,0),dark); B(vbox(11.4,0.5,1.7,0,8.45,0),dark);
    for(const sz of [-1,1]){ for(const sx of [-1,1]) B(vbox(0.16,6.4,0.06,sx*4.7,4.6,sz*0.88),seam); B(vbox(11.6,0.16,0.06,0,9.1,sz*1.08),seam); }
  } else {   // the Foxfire Hollow: white stone lanterns round the ring, two tall standing stones at the way in, each with a foxfire light on top
    for(let k=0;k<9;k++){ const a=k/9*TAU+0.2, x=A.x+Math.sin(a)*(A.r+1.5), z=A.z+Math.cos(a)*(A.r+1.5), {A:B,W}=inF(frameM(x,A.h-0.3,z,a)), s=1.3;
      const wc=(px,py,pz,c)=>c.set(0xe8e4dc).multiplyScalar(0.8+h3(Math.floor(px*3),Math.floor(py*3),Math.floor(pz*3))*0.2);
      B(cyl(0.34*s,0.4*s,0.16*s,6).translate(0,0.08*s,0),wc); B(cyl(0.1*s,0.13*s,0.8*s,8).translate(0,0.56*s,0),wc); W(vbox(0.34*s,0.34*s,0.34*s,0,1.24*s,0),0xbfe0ff);
      B(new THREE.ConeGeometry(0.44*s,0.3*s,6).translate(0,1.56*s,0),wc); addCol(x,z,0.45); }
    const a0=Math.atan2(VIL2.x-A.x,VIL2.z-A.z);
    for(const sd of [-1,1]){ const a=a0+sd*0.22, x=A.x+Math.sin(a)*(A.r+4), z=A.z+Math.cos(a)*(A.r+4), {A:B,W}=inF(frameM(x,A.h-0.3,z,a0+Math.PI));
      const wc=(px,py,pz,c)=>c.set(0xe8e4dc).multiplyScalar(0.82+h3(Math.floor(px*4),Math.floor(py*4),Math.floor(pz*4))*0.18);
      B(vbox(1.5,0.6,1.5,0,0.3,0),stoneC); B(vbox(0.95,3.8,0.55,0,2.5,0),wc); B(new THREE.ConeGeometry(0.42,0.8,4).rotateY(Math.PI/4).translate(0,4.8,0),wc); W(new THREE.OctahedronGeometry(0.28,0).translate(0,5.5,0),0xbfe0ff); addCol(x,z,0.9); }
  }
}
/* ---- teleport circles: a low stone disc with a glowing ring and four standing stones, bright when attuned ---- */
function buildCircle(V){
  const T=V.tele, y=getH(T.x,T.z), out=[];
  out.push(pc(cyl(T.r+0.4,T.r+0.6,0.3,28).translate(T.x,y-0.1,T.z),(x,yy,z,c)=>{ stoneC(x,yy,z,c); if(yy>y+0.04&&Math.abs(Math.hypot(x-T.x,z-T.z)-T.r*0.7)<0.14) c.set(0x3a4a5a); }));
  for(let k=0;k<4;k++){ const a=k/4*TAU+0.4, x=T.x+Math.sin(a)*(T.r+1.1), z=T.z+Math.cos(a)*(T.r+1.1), h=1.3+0.2*(k%2);
    out.push(pc(vbox(0.5,h,0.34,0,h/2,0).rotateY(a).translate(x,getH(x,z)-0.1,z),(px,py,pz,c)=>{ stoneC(px,py,pz,c); })); addCol(x,z,0.35); }
  const base=new THREE.Mesh(merge(out),villageMat); base.receiveShadow=true; base.castShadow=true; scene.add(base);
  const ring=new THREE.Mesh(new THREE.RingGeometry(T.r*0.55,T.r*0.85,40).rotateX(-Math.PI/2),fxMat(0x7fe0ff,0.5)); ring.position.set(T.x,y+0.07,T.z); scene.add(ring);
  const glyph=new THREE.Mesh(new THREE.RingGeometry(T.r*0.18,T.r*0.3,6).rotateX(-Math.PI/2),fxMat(0xff9ad5,0.5)); glyph.position.set(T.x,y+0.08,T.z); scene.add(glyph);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(T.r*0.8,T.r*0.85,3.2,24,1,true),fxMat(0x9fd8ff,0.1)); beam.position.set(T.x,y+1.6,T.z); scene.add(beam);
  VALE.circles.push({V,ring,glyph,beam});
}
// a flash at both ends of a teleport (anyone's), and a chime for your own
function onWarp(pid,fx,fz,tx,tz){
  for(const [x,z] of [[fx,fz],[tx,tz]]){ if(Math.hypot(x-P.x,z-P.z)>90) continue;
    const m=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,9,20,1,true),fxMat(0xbfe8ff,0.7)); m.position.set(x,getH(x,z)+4.5,z); scene.add(m); VALE.fx.push({m,t:0,life:0.9}); }
  if(pid===NET.pid&&SND.ready){ [660,880,1320].forEach((f,i)=>tone({bus:'ui',freq:f,freq2:f*1.5,dur:0.5,vol:0.05,when:SND.ctx.currentTime+i*0.08})); camShake=Math.max(camShake,0.2); }
}
// the server tells you when the tunnel opens (1: the door sinks with a rumble) and when you reach Hanami (2)
function onValeStep(k){
  if(k===1&&VALE.door&&!VALE.doorOpen){ VALE.opening=0.001; if(SND.ready) noiseHit({bus:'ui',filter:'lowpass',ff:180,dur:2.8,vol:0.35}); camShake=Math.max(camShake,0.5); }
  if(k>=2) UI_SFX.success();
}
function updateVale(dt){
  if(VALE.door){
    const open=valeOpen();
    if(!open){ VALE.doorOpen=0; VALE.opening=0; VALE.door.visible=true; VALE.door.position.y=TUN.floor(TUN.p0-0.1); }
    else if(VALE.opening>0){ VALE.opening=Math.min(1,VALE.opening+dt/3); VALE.door.position.y=TUN.floor(TUN.p0-0.1)-VALE.opening*(TUN.roof+0.2); if(VALE.opening>=1){ VALE.opening=0; VALE.doorOpen=1; VALE.door.visible=false; } }
    else if(!VALE.doorOpen){ VALE.doorOpen=1; VALE.door.visible=false; }
  }
  const on=GEAR&&GEAR.east>=2;
  for(const c of VALE.circles){ const near=Math.hypot(c.V.tele.x-P.x,c.V.tele.z-P.z)<120; c.ring.visible=c.glyph.visible=c.beam.visible=near; if(!near) continue;
    const k=0.5+0.5*Math.sin(t*2.2);
    c.ring.material.opacity=on?0.45+0.3*k:0.08; c.glyph.material.opacity=on?0.4+0.3*k:0.05; c.beam.material.opacity=on?0.06+0.05*k:0; c.glyph.rotation.y=t*0.4; }
  for(let i=VALE.fx.length-1;i>=0;i--){ const f=VALE.fx[i]; f.t+=dt; const k=f.t/f.life; f.m.material.opacity=0.7*(1-k); f.m.scale.set(1-k*0.6,1+k*0.5,1-k*0.6);
    if(f.t>=f.life){ scene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); VALE.fx.splice(i,1); } }
}
