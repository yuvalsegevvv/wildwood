//@ Look presets, save/load, buildCharacter (all outfits and armour looks), hiker, rebuildHiker
/* ---------- the hiker: a customisable character ---------- */
const SKINS=[0xf3d3bd,0xe6b894,0xc98e66,0xa56c45,0x7a4a2c,0x4f2f1d];
const HAIRC=[0x1d1714,0x3b2619,0x6a4428,0x9a4a24,0xd8b56e,0xb9b3aa,0x2f6f73];
const EYEC=[0x4a2e1c,0x6b5a2e,0x3f6b3a,0x3b6a9e,0x7a8288];
const CLOTH=[0xb4552f,0x3d5a3a,0x2f4a6b,0xd8c9a3,0x6b3a5b,0xc9a13a,0x2b2b2e,0xe8e4dc,0x8a2f2f,0x5c7f9c];
const SHOEC=[0x4a3526,0x2b2420,0x7a5a3a,0xe8e4dc,0x2f4a6b,0x8a2f2f];
const HATC=[0x7a6142,0x3d5a3a,0x8a2f2f,0x2f4a6b,0xc9a13a,0xe8e4dc,0x2b2b2e];
const LOOK_M={sex:'male',height:1,build:1,skin:SKINS[1],face:'angular',eyes:EYEC[0],facial:'stubble',hair:'short',hairColor:HAIRC[1],top:'jacket',topColor:CLOTH[0],bottom:'trousers',bottomColor:CLOTH[6],shoes:'boots',shoeColor:SHOEC[0],hat:'ranger',hatColor:HATC[0],pack:true,custom:false,cls:'warrior'};
const LOOK_F={sex:'female',height:1,build:1,skin:SKINS[1],face:'oval',eyes:EYEC[2],facial:'none',hair:'ponytail',hairColor:HAIRC[3],top:'flannel',topColor:CLOTH[8],bottom:'trousers',bottomColor:CLOTH[9],shoes:'boots',shoeColor:SHOEC[0],hat:'none',hatColor:HATC[1],pack:true,custom:false,cls:'warrior'};
function loadLook(){
  try{ const s=JSON.parse(localStorage.getItem('wildwood-look-v1')||'null'); if(s && (s.sex==='male'||s.sex==='female')) return Object.assign({}, s.sex==='female'?LOOK_F:LOOK_M, s); }catch(_){}
  return Object.assign({},LOOK_M);
}
function saveLookLocal(){ try{ localStorage.setItem('wildwood-look-v1',JSON.stringify(LOOK)); }catch(_){} }
function saveLook(){ saveLookLocal(); if(typeof netLookChanged==='function') netLookChanged(); }
let LOOK=loadLook();

const csph=(r,w,h)=>new THREE.SphereGeometry(r,w||10,h||8);
const matChar=new THREE.MeshLambertMaterial({vertexColors:true});
const _cc=new THREE.Color(), _tint=new THREE.Color();
function plaid(c,base,u,v){
  c.set(base);
  const a=((u*15)%1+1)%1<0.32, b=((v*15)%1+1)%1<0.32;
  if(a) c.multiplyScalar(0.6); if(b) c.multiplyScalar(0.6);
  if((((u*15+0.5)%1+1)%1<0.08)||(((v*15+0.5)%1+1)%1<0.08)) c.lerp(_tint.set(0xeadfc4),0.35);
}
// a rounded, tapered limb hanging from its joint (0,0,0) down to -len
function limbGeo(r1,r2,len,seg){
  const pts=[], n=5, mid=8;
  for(let i=0;i<=n;i++){ const a=-Math.PI/2+(i/n)*Math.PI/2; pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*r2), -len+Math.sin(a)*r2)); }
  for(let i=1;i<mid;i++){ const f=i/mid; pts.push(new THREE.Vector2(lerp(r2,r1,f), -len+len*f)); }
  for(let i=0;i<=n;i++){ const a=(i/n)*Math.PI/2; pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*r1), Math.sin(a)*r1)); }
  return new THREE.LatheGeometry(pts, seg||12);
}
function densify(prof,k){ const out=[]; for(let i=0;i<prof.length-1;i++){ for(let j=0;j<k;j++){ const f=j/k; out.push([lerp(prof[i][0],prof[i+1][0],f), lerp(prof[i][1],prof[i+1][1],f)]); } } out.push(prof[prof.length-1]); return out; }
function pc(g,fn){ const one=fn.length===1; return paint(g,(x,y,z,nx,ny,nz,c)=>{ if(one) fn(c); else fn(x,y,z,c); c.multiplyScalar(0.95+h3(x,y,z)*0.08); }); }
function solid(g,hex){ return pc(g,(x,y,z,c)=>c.set(hex)); }
function shell(r,t0,tl,gap,tilt){
  const g=new THREE.SphereGeometry(r,22,12, gap?1.5*Math.PI+gap/2:0, gap?TAU-gap:TAU, t0, tl);
  if(tilt) g.rotateX(tilt);
  return g;
}

function buildCharacter(L){
  const fem=L.sex==='female', B=L.build, lr=Math.pow(B,0.9);
  const skin=new THREE.Color(L.skin);
  const longSleeve=L.top!=='tshirt';
  const topPaint=(c,u,v)=>{
    if(L.top==='flannel') plaid(c,L.topColor,u,v);
    else if(L.top==='mail'){ c.set(L.topColor).multiplyScalar(0.72+0.38*((Math.floor(u*70)+Math.floor(v*70))&1)); }
    else if(L.top==='plate'){ c.set(L.topColor).multiplyScalar(0.82+0.3*(Math.floor(v*13)&1)); }
    else c.set(L.topColor);
  };
  const botPaint=(c,u,v)=>{
    c.set(L.bottomColor);
    if(L.bottomStyle==='mail') c.multiplyScalar(0.72+0.38*((Math.floor((u||0)*70)+Math.floor((v||0)*70))&1));
    else if(L.bottomStyle==='plate') c.multiplyScalar(0.82+0.3*(Math.floor((v||0)*11)&1));
  };
  const skinPaint=c=>c.copy(skin);
  const hem=(L.top==='jacket'||L.top==='hoodie'||L.top==='mail'||L.top==='plate')?-0.035:0.03;

  const root=new THREE.Group();
  const hipY=0.92;
  const hips=new THREE.Group(); hips.name='hips'; hips.position.y=hipY; root.add(hips);
  const spine=new THREE.Group(); spine.name='spine'; hips.add(spine);

  /* torso */
  const prof=fem
    ? [[0.001,-0.1],[0.14,-0.09],[0.178,-0.01],[0.165,0.08],[0.127,0.2],[0.138,0.3],[0.148,0.38],[0.146,0.44],[0.12,0.5],[0.06,0.535],[0.048,0.545]]
    : [[0.001,-0.1],[0.13,-0.09],[0.16,-0.01],[0.152,0.08],[0.148,0.18],[0.168,0.3],[0.182,0.4],[0.175,0.46],[0.13,0.515],[0.062,0.545],[0.05,0.555]];
  const tg=new THREE.LatheGeometry(densify(prof,3).map(p=>new THREE.Vector2(p[0],p[1])),26);
  { const p=tg.attributes.position;
    for(let i=0;i<p.count;i++){
      const y=p.getY(i), belly=Math.exp(-Math.pow((y-0.1)/0.13,2))*(B-1)*1.4;
      p.setX(i,p.getX(i)*B*(fem?1:1.04));
      p.setZ(i,p.getZ(i)*0.64*B*(1+(p.getZ(i)<0?belly:belly*0.3)));
    }
    tg.computeVertexNormals();
  }
  const tparts=[pc(tg,(x,y,z,c)=>{
    if(y>hem) topPaint(c,x,y);
    else if(y>hem-0.035 && L.bottom!=='skirt' && hem>0) c.set(0x3a2a1c);
    else botPaint(c,x,y);
    if((L.top==='jacket'||L.top==='hoodie'||L.top==='mail') && y<hem+0.03 && y>hem) c.multiplyScalar(0.8);
    if(L.top==='plate' && y>0.02 && y<0.07) c.set(0x3a2a1c);
  })];
  const neckR=fem?0.042:0.049;
  tparts.push(pc(cyl(neckR,neckR*1.1,0.2,10).translate(0,0.57,0),c=>skinPaint(c)));
  if(fem){
    for(const sd of [-1,1]) tparts.push(pc(csph(0.066*lr,12,10).scale(1,0.88,0.8).translate(sd*0.062*B,0.325,-0.068*B),(x,y,z,c)=>topPaint(c,x,y)));
  }
  if(L.top==='jacket'){
    tparts.push(pc(new THREE.CylinderGeometry(0.068,0.088,0.07,16,1,true).scale(B,1,B*0.8).translate(0,0.545,0),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.8); }));
    tparts.push(solid(new THREE.BoxGeometry(0.01,0.5,0.01).translate(0,0.24,-0.104*B),0x2a2a2a));
  }
  if(L.top==='hoodie'){
    tparts.push(pc(csph(0.1,14,10).scale(1.25*B,0.75,1.0).translate(0,0.545,0.075*B),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.88); }));
    tparts.push(pc(new THREE.BoxGeometry(0.19*B,0.09,0.02).translate(0,0.1,-0.1*B*(1+(B-1)*1.3)),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.85); }));
    for(const sd of [-1,1]) tparts.push(solid(new THREE.BoxGeometry(0.006,0.11,0.006).translate(sd*0.03,0.44,-0.1*B),0xe8e4dc));
  }
  if(L.pack){
    const bz=0.112*B+0.075;
    tparts.push(pc(new THREE.BoxGeometry(0.3,0.42,0.15).translate(0,0.28,bz),c=>c.set(0x566437)));
    tparts.push(pc(new THREE.BoxGeometry(0.22,0.14,0.05).translate(0,0.17,bz+0.095),c=>c.set(0x4a5630)));
    tparts.push(pc(new THREE.CylinderGeometry(0.065,0.065,0.36,12).rotateZ(Math.PI/2).translate(0,0.535,bz),c=>c.set(0x8a3b2c)));
    for(const sd of [-1,1]) tparts.push(pc(new THREE.BoxGeometry(0.035,0.34,0.012).translate(sd*0.085*B,0.33,-0.112*B-(fem?0.02:0)),c=>c.set(0x3b4228)));
  }
  const torso=new THREE.Mesh(merge(tparts),matChar); torso.castShadow=true; spine.add(torso);

  if(L.bottom==='skirt'){
    const sg=pc(new THREE.CylinderGeometry(0.165,0.255,0.4,20,4,true).scale(B,1,B*0.78).translate(0,-0.16,0),(x,y,z,c)=>{ botPaint(c); if(y<-0.33) c.multiplyScalar(0.85); });
    const skirt=new THREE.Mesh(sg,matFlat); skirt.castShadow=true; hips.add(skirt);
  }

  /* head */
  const head=new THREE.Group(); head.name='head'; head.position.y=0.745; spine.add(head);
  const fs=L.face==='oval'?[0.92,1.1]:L.face==='round'?[1.02,0.98]:[0.97,1.04];
  const hparts=[];
  const hairCol=new THREE.Color(L.hairColor);
  hparts.push(pc(csph(0.105,22,16).scale(fs[0],fs[1],1),(x,y,z,c)=>{
    skinPaint(c);
    if(L.facial==='stubble' && y<-0.018 && z<-0.02) c.lerp(hairCol,0.32);
  }));
  if(L.face==='angular') hparts.push(pc(csph(0.05,12,8).scale(1.3*fs[0],0.62,0.85).translate(0,-0.078,-0.055),(x,y,z,c)=>{ skinPaint(c); if(L.facial==='stubble'&&z<-0.02) c.lerp(hairCol,0.32); }));
  const ex=0.037*fs[0], fz=-0.1;
  for(const sd of [-1,1]){
    hparts.push(solid(csph(0.019,10,8).scale(1,0.85,0.5).translate(sd*ex,0.012,fz+0.012),0xf4f1ea));
    hparts.push(solid(csph(0.0105,8,6).scale(1,1,0.5).translate(sd*ex,0.012,fz+0.004),L.eyes));
    hparts.push(solid(csph(0.005,6,4).translate(sd*ex,0.012,fz+0.0005),0x111111));
    const brow=new THREE.BoxGeometry(0.032,fem?0.006:0.009,0.008).rotateZ(sd*(fem?-0.12:-0.06)).translate(sd*ex,0.044,fz+0.004);
    hparts.push(pc(brow,c=>c.copy(hairCol).multiplyScalar(0.75)));
    hparts.push(pc(csph(0.023,8,6).scale(0.45,1,0.8).translate(sd*0.104*fs[0],-0.005,0.008),c=>skinPaint(c)));
  }
  hparts.push(pc(new THREE.ConeGeometry(0.015,0.042,6).rotateX(-Math.PI/2).translate(0,-0.012,fz-0.012),c=>{ skinPaint(c); c.multiplyScalar(0.94); }));
  const lips=skin.clone().lerp(_tint.set(0x9c4a48),fem?0.55:0.35);
  hparts.push(pc(new THREE.BoxGeometry(0.036,fem?0.009:0.007,0.012).translate(0,-0.048,fz+0.005),c=>c.copy(lips)));
  if(L.facial==='beard'){
    hparts.push(pc(new THREE.SphereGeometry(0.112,18,10,Math.PI,Math.PI,0.5*Math.PI,0.42*Math.PI).scale(fs[0],1.12,1).translate(0,-0.006,-0.004),c=>c.copy(hairCol).multiplyScalar(0.9)));
  }
  if(L.facial==='beard'||L.facial==='mustache'){
    hparts.push(pc(csph(0.02,10,6).scale(1.9,0.5,0.7).translate(0,-0.034,fz-0.002),c=>c.copy(hairCol).multiplyScalar(0.9)));
  }
  // hair
  const hat=L.hat!=='none';
  const hg=[];
  const H=L.hair;
  const cap=(r,tl,tilt)=>shell(r,0,tl*Math.PI,0,tilt);
  if(H==='buzz') hg.push(cap(0.108,0.42,0.38));
  if(H==='short'){ hg.push(cap(0.114,0.5,0.32)); hg.push(csph(0.05,10,8).scale(1.7,0.55,0.9).translate(0.012,0.08,-0.07)); hg.push(shell(0.111,0.38*Math.PI,0.2*Math.PI,1.9)); }
  if(H==='curly'){ const r=hat?(L.hat==='helm'?0.11:0.118):0.138; const g=cap(r,0.56,0.3); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=1+(h3(x*3,y*3,z*3)-0.5)*0.12; p.setXYZ(i,x*j,y*j,z*j);} g.computeVertexNormals(); hg.push(g); hg.push(shell(r*0.95,0.4*Math.PI,0.22*Math.PI,1.9)); }
  if(H==='bob'||H==='long'){ hg.push(cap(0.116,0.5,0.3)); hg.push(shell(0.121,0.34*Math.PI,0.36*Math.PI,1.55)); }
  if(H==='long'){ hg.push(csph(0.11,12,10).scale(1.02,2.3,0.42).translate(0,-0.14,0.072)); for(const sd of [-1,1]) hg.push(csph(0.034,8,8).scale(1,3.4,1).translate(sd*0.098,-0.1,-0.015)); }
  if(H==='ponytail'||H==='bun'){ hg.push(cap(0.113,0.52,0.24)); }
  if(H==='ponytail'){ hg.push(csph(0.022,8,6).translate(0,0.015,0.115)); hg.push(csph(0.046,10,8).scale(0.8,2.7,0.8).rotateX(0.3).translate(0,-0.09,0.145)); }
  if(H==='bun'){ hg.push(csph(0.052,12,10).translate(0,0.085,0.085)); }
  hg.forEach(g=>{ g.scale(fs[0],fs[1],1); hparts.push(pc(g,c=>c.copy(hairCol))); });
  // hats
  const hc=L.hatColor;
  if(L.hat==='ranger'){
    hparts.push(pc(new THREE.CylinderGeometry(0.205,0.205,0.012,28).translate(0,0.078,0),c=>c.set(hc)));
    hparts.push(pc(new THREE.CylinderGeometry(0.09,0.118,0.105,22).translate(0,0.135,0),c=>c.set(hc)));
    hparts.push(pc(new THREE.CylinderGeometry(0.119,0.119,0.024,22).translate(0,0.095,0),c=>c.set(hc).multiplyScalar(0.55)));
  } else if(L.hat==='beanie'){
    hparts.push(pc(shell(0.123,0,0.56*Math.PI,0,0.2).scale(fs[0],fs[1],1),c=>c.set(hc)));
    hparts.push(pc(shell(0.128,0.44*Math.PI,0.12*Math.PI,0,0.2).scale(fs[0],fs[1],1),c=>c.set(hc).multiplyScalar(0.82)));
    hparts.push(pc(csph(0.032,10,8).translate(0,0.135*fs[1],0.03),c=>c.set(0xf2eee4)));
  } else if(L.hat==='helm'){
    hparts.push(pc(shell(0.128,0,0.54*Math.PI,0,0.12).scale(fs[0],fs[1],1),(x,y,z,c)=>c.set(hc).multiplyScalar(0.88+0.18*clamp(y*6))));
    hparts.push(pc(shell(0.133,0.44*Math.PI,0.09*Math.PI,0,0.12).scale(fs[0],fs[1],1),c=>c.set(hc).multiplyScalar(0.7)));
    hparts.push(pc(vbox(0.022,0.075,0.02,0,0.005,-0.128),c=>c.set(hc).multiplyScalar(0.8)));
    if(L.plume) hparts.push(pc(vbox(0.03,0.09,0.24,0,0.16*fs[1],0.02).rotateX(-0.25),c=>c.set(L.plume)));
  } else if(L.hat==='cap'){
    hparts.push(pc(shell(0.119,0,0.5*Math.PI,0,0.18).scale(fs[0],fs[1],1),c=>c.set(hc)));
    hparts.push(pc(new THREE.CylinderGeometry(0.1,0.1,0.01,18,1,false,Math.PI/2,Math.PI).scale(1,1,1.15).rotateX(-0.12).translate(0,0.045*fs[1],-0.088),c=>c.set(hc).multiplyScalar(0.85)));
  }
  const headMesh=new THREE.Mesh(merge(hparts),matChar); headMesh.castShadow=true; head.add(headMesh);
  if(fem) head.scale.setScalar(0.96);

  /* arms */
  const shR=(fem?0.148:0.175)*B*(fem?1:1.04)+0.012;
  const mkArm=sd=>{
    const sh=new THREE.Group(); sh.name=sd<0?'shL':'shR'; sh.position.set(sd*shR,0.455,0); sh.rotation.z=sd*(0.1+(B-1)*0.35); spine.add(sh);
    const ua=pc(limbGeo(0.047*lr,0.04*lr,0.28,12),(x,y,z,c)=>{ if(longSleeve||y>-0.13) topPaint(c,x+sd*0.3,y); else skinPaint(c); });
    const m1=new THREE.Mesh(ua,matChar); m1.castShadow=true; sh.add(m1);
    const el=new THREE.Group(); el.name=sd<0?'elL':'elR'; el.position.y=-0.28; sh.add(el);
    const fa=merge([
      pc(limbGeo(0.04*lr,0.031*lr,0.25,12),(x,y,z,c)=>{ if(longSleeve && y>-0.225){ topPaint(c,x+sd*0.3,y-0.28); if(y<-0.2) c.multiplyScalar(0.8); } else skinPaint(c); }),
      pc(csph(0.038,10,8).scale(0.75,1.3,0.55).translate(0,-0.3,0),c=>skinPaint(c))
    ]);
    const m2=new THREE.Mesh(fa,matChar); m2.castShadow=true; el.add(m2);
    return [sh,el];
  };
  const [shL,elL]=mkArm(-1), [shR2,elR]=mkArm(1);
  if(L.top==='plate'){ const pm=new THREE.Mesh(merge([-1,1].map(sd=>pc(csph(0.1*lr,12,8).scale(1.25,0.75,1.15).translate(sd*shR,0.48,0),(x,y,z,c)=>c.set(L.topColor).multiplyScalar(0.9+clamp(y-0.48)*4)))),matChar); pm.castShadow=true; spine.add(pm); }

  /* legs */
  const hx=(fem?0.092:0.085)*B;
  const mkLeg=sd=>{
    const hp=new THREE.Group(); hp.name=sd<0?'hipL':'hipR'; hp.position.set(sd*hx,0,0); hips.add(hp);
    const th=pc(limbGeo((fem?0.09:0.085)*lr,0.058*lr,0.43,12),(x,y,z,c)=>{
      if(L.bottom==='trousers'||(L.bottom==='shorts'&&y>-0.23)) botPaint(c,x,y); else skinPaint(c);
      if(L.bottom==='shorts'&&y>-0.23&&y<-0.2) c.multiplyScalar(0.85);
    });
    const m1=new THREE.Mesh(th,matChar); m1.castShadow=true; hp.add(m1);
    const kn=new THREE.Group(); kn.name=sd<0?'kneeL':'kneeR'; kn.position.y=-0.43; hp.add(kn);
    const sparts=[pc(limbGeo(0.056*lr,0.04,0.42,12),(x,y,z,c)=>{ if(L.bottom==='trousers') botPaint(c,x,y); else skinPaint(c); })];
    if(L.bottomStyle==='plate') sparts.push(pc(csph(0.068*lr,10,8).scale(1,0.9,0.8).translate(0,0,-0.03),c=>c.set(L.bottomColor).multiplyScalar(1.1)));
    const boot=L.shoes==='boots';
    sparts.push(pc(csph(0.05,12,8).scale(0.95,0.62,2.15).translate(0,-0.452,-0.045),(x,y,z,c)=>{ c.set(L.shoeColor); if(y<-0.472) c.set(boot?0x221a14:0xf2efe8); }));
    if(boot) sparts.push(pc(new THREE.CylinderGeometry(0.05,0.052,0.12,12).translate(0,-0.39,0),c=>c.set(L.shoeColor)));
    const m2=new THREE.Mesh(merge(sparts),matChar); m2.castShadow=true; kn.add(m2);
    return [hp,kn];
  };
  const [hipL,kneeL]=mkLeg(-1), [hipR,kneeR]=mkLeg(1);
  return {root,hips,spine,head,hipY,shL,elL,shR:shR2,elR,hipL,kneeL,hipR,kneeR};
}

const hiker={g:new THREE.Group(),rig:null,scale:1};
let weaponsReady=false;
scene.add(hiker.g);
function rebuildHiker(){
  if(hiker.rig){ hiker.g.remove(hiker.rig.root); hiker.rig.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  hiker.rig=buildCharacter(GEAR?effectiveLook():LOOK);
  hiker.scale=LOOK.height*(LOOK.sex==='female'?0.95:1);
  hiker.rig.root.scale.setScalar(hiker.scale);
  hiker.g.add(hiker.rig.root);
  if(weaponsReady) attachWeapons();
}
rebuildHiker();

