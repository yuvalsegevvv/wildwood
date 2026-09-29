//@ Monster views: models for every family (slime, shroom, beetle/spider/crab, boar, treant, goblin/oni/tengu/yeti, fox/wolf, wisp, wyrm, totem), animation
const MONS=[], MON_GEO={};
function monMat(glow){ const m=new THREE.MeshLambertMaterial({vertexColors:true, emissive:glow||0x000000}); m.userData.glow=new THREE.Color(glow||0); return m; }
function pivot(parent,x,y,z,mesh){ const g=new THREE.Group(); g.position.set(x,y,z); if(mesh) g.add(mesh); parent.add(g); return g; }
function rigOf(root){ const g=n=>root.getObjectByName(n); return {root,hips:g('hips'),spine:g('spine'),head:g('head'),shL:g('shL'),elL:g('elL'),shR:g('shR'),elR:g('elR'),hipL:g('hipL'),kneeL:g('kneeL'),hipR:g('hipR'),kneeR:g('kneeR'),hipY:0.92}; }
function monGeos(d){
  if(MON_GEO[d.id]) return MON_GEO[d.id];
  const p=d.pal, G={};
  if(d.model==='slime'){
    G.body=merge([
      pc(csph(0.45,16,12).scale(1,0.78,1).translate(0,0.35,0),(x,y,z,c)=>{ c.set(p.body); if(y>0.45) c.lerp(_tint.set(p.top),clamp((y-0.45)/0.25)*0.6); }),
      ...[-1,1].flatMap(sd=>[pc(csph(0.09,10,8).translate(sd*0.15,0.45,-0.35),c=>c.set(0xffffff)),pc(csph(0.045,8,6).translate(sd*0.15,0.45,-0.43),c=>c.set(0x111111))]),
      pc(vbox(0.14,0.025,0.03,0,0.3,-0.42),c=>c.set(p.mouth))
    ]);
  } else if(d.model==='shroom'){
    G.body=merge([
      pc(cyl(0.2,0.25,0.55,12).translate(0,0.4,0),c=>c.set(p.stem)),
      pc(new THREE.SphereGeometry(0.46,18,8,0,TAU,0,Math.PI/2).scale(1,0.7,1).translate(0,0.66,0),(x,y,z,c)=>{ c.set(p.cap); if(h3(Math.round(x*9),Math.round(y*9),Math.round(z*9))>0.8) c.set(p.spot); }),
      pc(cyl(0.45,0.45,0.03,18).translate(0,0.66,0),c=>c.set(p.gill)),
      ...[-1,1].flatMap(sd=>[pc(csph(0.055,8,6).translate(sd*0.08,0.5,-0.2),c=>c.set(0xffffff)),pc(csph(0.03,6,5).translate(sd*0.08,0.5,-0.245),c=>c.set(0x111111))]),
      pc(vbox(0.08,0.02,0.02,0,0.4,-0.23),c=>c.set(0x6a3a2a))
    ]);
    G.foot=pc(csph(0.1,8,6).scale(1,0.6,1.4).translate(0,0.06,0),c=>c.set(p.feet));
  } else if(d.model==='beetle' && p.spider){   // Jorogumo: a round banded abdomen, a small head, four long legs a side
    G.body=merge([
      pc(csph(0.5,18,12).scale(0.95,0.75,1.1).translate(0,0.62,0.35),(x,y,z,c)=>{ c.set(p.shell); if(Math.abs(Math.sin(z*9))<0.22&&y>0.5) c.set(p.seam); c.lerp(_tint.set(p.sheen),clamp((y-0.8)*2)*0.4); }),
      pc(csph(0.28,12,10).scale(1,0.8,1).translate(0,0.5,-0.3),c=>c.set(p.head)),
      ...[-1,1].flatMap(sd=>[0.06,0.13].map(ex=>pc(csph(0.035,6,5).translate(sd*ex,0.6,-0.53),c=>c.set(p.eye)))),
      ...[-1,1].map(sd=>pc(new THREE.ConeGeometry(0.03,0.18,5).rotateX(Math.PI).translate(sd*0.07,0.36,-0.52),c=>c.set(0x1a1414)))
    ]);
    for(const sd of [-1,1]){ const legs=[]; for(const lz of [-0.42,-0.14,0.14,0.42]){
      legs.push(pc(cyl(0.03,0.025,0.6,5).translate(0,0.3,0).rotateZ(-sd*0.9).translate(sd*0.22,0.52,lz*0.8),c=>c.set(p.legs)));
      legs.push(pc(cyl(0.025,0.015,0.9,5).translate(0,-0.45,0).rotateZ(sd*0.35).translate(sd*0.68,0.85,lz),c=>c.set(p.legs)));
    } G[sd<0?'lL':'lR']=merge(legs); }
  } else if(d.model==='beetle' && p.crab){   // Carapax and his hatchlings: a wide flat carapace with barnacles, eyes on stalks, four legs a side, two big claws of their own (cL, cR: they rear up and snap when it attacks)
    G.body=merge([
      pc(csph(0.55,18,12).scale(1.4,0.5,1.0).translate(0,0.5,0),(x,y,z,c)=>{ c.set(p.shell); if(h3(Math.round(x*7),Math.round(y*7),Math.round(z*7))>0.84) c.set(p.horn); if(y>0.62) c.lerp(_tint.set(p.sheen),clamp((y-0.62)*4)*0.4); }),
      pc(csph(0.24,10,8).scale(1.3,0.7,0.8).translate(0,0.4,-0.55),c=>c.set(p.head)),
      ...[-1,1].flatMap(sd=>[pc(cyl(0.025,0.025,0.26,5).translate(sd*0.16,0.78,-0.5),c=>c.set(p.head)),pc(csph(0.065,8,6).translate(sd*0.16,0.93,-0.5),c=>c.set(p.eye))])
    ]);
    for(const sd of [-1,1]){ const legs=[]; for(const lz of [-0.34,-0.12,0.12,0.34]){
      legs.push(pc(cyl(0.04,0.03,0.6,5).translate(0,0.3,0).rotateZ(-sd*1.15).translate(sd*0.5,0.5,lz*0.9),c=>c.set(p.legs)));
      legs.push(pc(cyl(0.03,0.02,0.85,5).translate(0,-0.425,0).rotateZ(sd*0.25).translate(sd*1.05,0.75,lz*0.9),c=>c.set(p.legs)));
    } G[sd<0?'lL':'lR']=merge(legs);
      G[sd<0?'cL':'cR']=merge([   // a claw, from its shoulder forward: the arm, the palm, two fingers
        pc(cyl(0.11,0.09,0.7,6).rotateX(-Math.PI/2+0.35).translate(sd*0.15,0.1,-0.35),c=>c.set(p.legs)),
        pc(csph(0.3,12,9).scale(0.8,0.6,1.15).translate(sd*0.15,0.22,-0.85),(x,y,z,c)=>{ c.set(p.shell); if(y>0.3) c.lerp(_tint.set(p.sheen),0.3); }),
        pc(new THREE.ConeGeometry(0.13,0.62,6).rotateX(-Math.PI/2).rotateY(sd*0.12).translate(sd*0.05,0.4,-1.3),c=>c.set(p.horn)),
        pc(new THREE.ConeGeometry(0.11,0.55,6).rotateX(-Math.PI/2).rotateY(-sd*0.12).translate(sd*0.26,0.06,-1.25),c=>c.set(p.horn))]); }
  } else if(d.model==='beetle'){
    G.body=merge([
      pc(csph(0.5,18,12).scale(0.8,0.5,1.2).translate(0,0.42,0),(x,y,z,c)=>{ c.set(p.shell); if(Math.abs(x)<0.025&&y>0.55) c.set(p.seam); c.lerp(_tint.set(p.sheen),clamp((y-0.55)*2)*0.35); }),
      pc(csph(0.22,12,10).translate(0,0.36,-0.62),c=>c.set(p.head)),
      pc(new THREE.ConeGeometry(0.06,0.42,8).rotateX(-1.1).translate(0,0.55,-0.8),c=>c.set(p.horn)),
      ...[-1,1].flatMap(sd=>[pc(new THREE.ConeGeometry(0.03,0.16,6).rotateX(-Math.PI/2).rotateY(sd*0.4).translate(sd*0.08,0.26,-0.8),c=>c.set(0x2a2018)),pc(csph(0.035,6,5).translate(sd*0.12,0.42,-0.78),c=>c.set(p.eye))])
    ]);
    for(const sd of [-1,1]){ const legs=[]; for(const lz of [-0.35,0,0.35]) legs.push(pc(cyl(0.025,0.02,0.55,5).translate(0,-0.275,0).rotateZ(sd*1.0).translate(sd*0.3,0.42,lz),c=>c.set(p.legs))); G[sd<0?'lL':'lR']=merge(legs); }
  } else if(d.model==='boar'){
    G.body=merge([
      pc(csph(0.45,16,12).scale(0.85,0.8,1.5).translate(0,0.62,0),(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.85+h3(Math.round(x*12),Math.round(y*12),Math.round(z*12))*0.3); if(y>0.9&&Math.abs(x)<0.12) c.set(p.ridge); }),
      pc(csph(0.26,12,10).scale(0.9,0.9,1.2).translate(0,0.62,-0.72),c=>c.set(p.head)),
      pc(cyl(0.11,0.12,0.14,10).rotateX(Math.PI/2).translate(0,0.55,-1.0),(x,y,z,c)=>{ c.set(p.snout); if(z<-1.05) c.set(0x3a2420); }),
      ...[-1,1].flatMap(sd=>[pc(new THREE.ConeGeometry(0.035,0.2,6).rotateX(-0.5).translate(sd*0.12,0.52,-0.93),c=>c.set(p.tusk)),
        pc(new THREE.ConeGeometry(0.06,0.16,5).rotateZ(-sd*0.4).translate(sd*0.15,0.86,-0.62),c=>c.set(p.ridge)),
        pc(csph(0.03,6,5).translate(sd*0.13,0.7,-0.9),c=>c.set(p.eye))])
    ]);
    G.leg=pc(cyl(0.065,0.05,0.42,6).translate(0,-0.21,0),(x,y,z,c)=>{ c.set(p.legs); if(y<-0.36) c.set(0x1a1410); });
  } else if(d.model==='treant'){
    G.body=merge([
      pc(cyl(0.34,0.5,2.0,10,6).translate(0,1.35,0),(x,y,z,c)=>{ c.set(p.bark).multiplyScalar(0.8+h3(Math.round(Math.atan2(z,x)*3),0,0)*0.35); }),
      pc(csph(0.95,14,10).translate(0,2.75,0.05),(x,y,z,c)=>c.set(p.c1).multiplyScalar(0.8+h3(Math.round(x*5),Math.round(y*5),Math.round(z*5))*0.35)),
      pc(csph(0.7,12,9).translate(0.55,2.45,0.25),c=>c.set(p.c2)),
      pc(csph(0.65,12,9).translate(-0.55,2.5,-0.1),c=>c.set(p.c3)),
      ...[-1,1].map(sd=>pc(csph(0.075,8,6).translate(sd*0.14,1.78,-0.4),c=>c.set(p.eyes))),
      pc(vbox(0.26,0.07,0.05,0,1.48,-0.44),c=>c.set(0x1a120c))
    ]);
    for(const sd of [-1,1]) G[sd<0?'aL':'aR']=merge([pc(cyl(0.07,0.12,1.15,6).translate(0,-0.57,0),c=>c.set(p.bark)),pc(cyl(0.03,0.05,0.45,5).translate(0,-0.22,0).rotateZ(sd*0.7).translate(0,-0.8,0),c=>c.set(p.bark)),pc(csph(0.22,8,6).translate(sd*0.12,-1.05,0),c=>c.set(p.c1))]);
    G.leg=merge([pc(cyl(0.16,0.22,0.62,7).translate(0,-0.31,0),c=>c.set(p.bark)),pc(new THREE.ConeGeometry(0.12,0.3,5).rotateX(-1.3).translate(0,-0.55,-0.18),c=>c.set(p.bark))]);
  } else if(d.model==='totem'){
    G.body=merge([
      pc(vbox(1.0,0.3,1.0,0,0.15,0),stoneC),
      pc(cyl(0.3,0.4,2.0,6,8).translate(0,1.3,0),(x,y,z,c)=>{ stoneC(x,y,z,c); if(((y*2.2)%1+1)%1<0.14) c.set(p.band||0x6af08a); }),
      pc(new THREE.OctahedronGeometry(0.3,0).scale(1,1.5,1).translate(0,2.6,0),c=>c.set(p.crystal||0x7af0a0))
    ]);
  } else if(d.model==='fox'){   // kitsune: slim body, long snout, tall ears, a fan of tails with pale tips; wolf (p.wolf): heavier, broad head, small ears, a thick ruff, one bushy tail
    const w=p.wolf?1:0;
    G.body=merge([
      pc(csph(0.4+0.05*w,16,12).scale(0.72+0.1*w,0.7+0.08*w,1.45+0.05*w).translate(0,0.66+0.04*w,0),(x,y,z,c)=>{ c.set(p.body); if(y<0.5) c.lerp(_tint.set(p.belly),0.7); }),
      pc(csph(0.24+0.04*w,12,10).scale(0.95+0.1*w,0.9,1.05).translate(0,0.9+0.02*w,-0.6),(x,y,z,c)=>{ c.set(p.body); if(y<0.84) c.lerp(_tint.set(p.belly),0.8); }),
      pc(new THREE.ConeGeometry(0.11+0.04*w,0.34+0.07*w,8).rotateX(-Math.PI/2).translate(0,0.84+0.02*w,-0.9-0.03*w),(x,y,z,c)=>{ c.set(p.belly); if(z<-1.03-0.04*w) c.set(0x1a1414); }),
      pc(csph(0.1,10,8).scale(1.6,1,1.1).translate(0,1.06+0.02*w,-0.58),c=>c.set(p.tip)),   // the white blaze
      ...(w?[pc(csph(0.32,10,8).scale(1.1,0.95,0.85).translate(0,0.86,-0.4),(x,y,z,c)=>{ c.set(p.belly).lerp(_tint.set(p.body),0.35); })]:[]),   // the wolf's ruff
      ...[-1,1].flatMap(sd=>[pc(new THREE.ConeGeometry(0.08-0.02*w,0.26-0.08*w,5).rotateZ(-sd*0.15).translate(sd*(0.12+0.02*w),1.2-0.05*w,-0.55),(x,y,z,c)=>{ c.set(p.body); if(y>1.25-0.05*w) c.set(0x1a1414); }),
        pc(csph(0.035,6,5).translate(sd*0.1,0.96+0.02*w,-0.78),c=>c.set(p.eye))])
    ]);
    const n=Math.max(1,Math.min(9,p.tails|0||1)), tails=[];
    for(let i=0;i<n;i++){ const a=n>1?(i/(n-1)-0.5)*Math.min(2.4,0.5*n):0;
      tails.push(pc(csph(0.17+0.04*w,10,8).scale(1,1,3.4-0.7*w).translate(0,0,0.52-0.06*w).rotateX(-0.55+0.4*w).rotateY(a),(x,y,z,c)=>{ c.set(p.body); if(Math.hypot(x,y,z)>0.85) c.set(p.tip); })); }
    G.tail=merge(tails);
    G.leg=pc(cyl(0.05,0.04,0.46,6).translate(0,-0.23,0),(x,y,z,c)=>{ c.set(p.legs); });
  } else if(d.model==='wisp'){   // onibi: a floating flame with a bright core; yurei (ghost): a pale figure with long hair and a trailing hem
    if(p.ghost){
      G.body=merge([
        pc(new THREE.ConeGeometry(0.36,1.2,12,4,true).rotateX(Math.PI).translate(0,0.95,0),(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.8+y*0.18); }),
        pc(csph(0.2,12,10).translate(0,1.62,0),c=>c.set(p.core)),
        pc(csph(0.23,12,10).scale(1,1.25,1).translate(0,1.55,0.05),(x,y,z,c)=>{ c.set(p.hair); if(z<-0.1&&y<1.72&&y>1.35) c.set(p.core); }),
        ...[-1,1].map(sd=>pc(cyl(0.05,0.07,0.6,6).rotateX(-1.2).translate(sd*0.24,1.3,-0.22),c=>c.set(p.body))),
        ...[-1,1].map(sd=>pc(csph(0.025,6,5).translate(sd*0.07,1.62,-0.19),c=>c.set(p.eye)))
      ]);
    } else {
      G.body=merge([
        pc(csph(0.42,16,12).scale(1,1.1,1).translate(0,0.95,0),(x,y,z,c)=>{ c.set(p.body).lerp(_tint.set(p.core),clamp(1-Math.hypot(x,z)*2.2)*0.5); }),
        pc(new THREE.ConeGeometry(0.34,0.9,12).translate(0,1.62,0.05),(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.9+(y-1.2)*0.5); }),
        ...[-1,1].map(sd=>pc(csph(0.07,8,6).scale(1,1.4,1).translate(sd*0.13,1.02,-0.37),c=>c.set(p.eye)))
      ]);
      G.flick=pc(new THREE.ConeGeometry(0.16,0.5,8).translate(0,0.25,0),(x,y,z,c)=>c.set(p.core));
    }
  } else if(d.model==='wyrm'){   // a frost wyrm: a horned head, six armoured body segments that undulate, two bat-like wings, four short clawed legs, a spiked tail
    const bone=(A,B,r,col)=>{ const dir=B.clone().sub(A), L=dir.length(), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
      return pc(cyl(r,r*0.6,L,5).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)).translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2),c=>c.set(col)); };
    G.segs=[0.62,0.6,0.52,0.44,0.35,0.25].map(r=>merge([
      pc(csph(r,12,9).scale(1,0.92,1.25),(x,y,z,c)=>{ c.set(p.body); if(y<-r*0.25) c.lerp(_tint.set(p.belly),0.85); if(Math.abs(Math.sin(z*7))<0.16&&y>0) c.multiplyScalar(0.82); }),
      ...[-0.25,0,0.25].map(dz=>pc(new THREE.ConeGeometry(r*0.2,r*0.65,5).translate(0,r*1.1,dz*r*2),c=>c.set(p.ridge)))
    ]));
    G.tailTip=merge([pc(new THREE.ConeGeometry(0.2,1.0,6).rotateX(Math.PI/2).translate(0,0,0.65),c=>c.set(p.ridge)),pc(csph(0.16,8,6),c=>c.set(p.body))]);
    G.head=merge([
      pc(csph(0.46,12,10).scale(0.95,0.8,1.3).translate(0,0,-0.35),(x,y,z,c)=>{ c.set(p.body); if(y<-0.12) c.lerp(_tint.set(p.belly),0.7); }),
      pc(new THREE.ConeGeometry(0.3,0.75,8).rotateX(-Math.PI/2).translate(0,-0.06,-1.05),c=>c.set(p.body)),   // the snout
      pc(vbox(0.34,0.1,0.6,0,-0.27,-0.9),c=>c.set(p.belly)),                                                     // the lower jaw
      ...[-1,1].flatMap(sd=>[
        pc(new THREE.ConeGeometry(0.09,0.75,6).rotateX(Math.PI/2-0.5).rotateZ(-sd*0.35).translate(sd*0.3,0.35,0.05),c=>c.set(p.horn)),   // horns sweep back and up
        pc(csph(0.075,8,6).translate(sd*0.24,0.14,-0.62),c=>c.set(p.eye)),
        pc(new THREE.ConeGeometry(0.03,0.16,5).rotateX(Math.PI).translate(sd*0.13,-0.24,-1.25),c=>c.set(0xf6f2e4))]),
      ...[0,1,2].map(k=>pc(new THREE.ConeGeometry(0.08,0.3,5).rotateX(0.4).translate(0,0.38,-0.15+k*0.28),c=>c.set(p.ridge)))   // a crest of spikes
    ]);
    { const V3=(x,y,z)=>new THREE.Vector3(x,y,z), S0=V3(0,0,0), T=[V3(2.4,0.35,-1.0),V3(2.9,0.1,0.3),V3(2.1,-0.05,1.5)], Bk=V3(0.3,-0.05,1.2), P=[];
      for(const [a,b,c] of [[S0,T[0],T[1]],[S0,T[1],T[2]],[S0,T[2],Bk]]) P.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z, a.x,a.y,a.z,c.x,c.y,c.z,b.x,b.y,b.z);   // the membrane, two-sided
      G.wing=merge([pc(trisGeo(P),(x,y,z,c)=>{ c.set(p.wing).multiplyScalar(0.8+clamp(x/3)*0.3); }),...T.map(t=>bone(S0,t,0.06,p.horn)),bone(S0,Bk,0.05,p.horn)]);
      G.wingL=G.wing.clone().scale(-1,1,1); }
    G.leg=merge([pc(cyl(0.13,0.1,0.7,6).translate(0,-0.35,0),c=>c.set(p.body)),pc(new THREE.ConeGeometry(0.13,0.3,5).rotateX(-1.4).translate(0,-0.72,-0.14),c=>c.set(p.horn))]);
  } else if(d.model==='goblin'){
    const look={sex:'male',height:1,build:0.9,skin:p.skin,face:'angular',eyes:p.eyes,facial:'none',hair:'bald',hairColor:0x1d1714,top:p.top,topColor:p.topColor,bottom:p.bottom,bottomColor:p.bottomColor,shoes:'boots',shoeColor:0x2b2420,hat:p.hat,hatColor:p.hatColor,pack:false};
    const rig=buildCharacter(look);
    for(const sd of [-1,1]) rig.head.add(new THREE.Mesh(pc(new THREE.ConeGeometry(0.035,0.16,5).rotateZ(-sd*(Math.PI/2-0.35)).translate(sd*0.15,0.03,0.01),c=>c.set(p.skin)),matChar));
    const W=p.weapon, wood=0x5a3e28;
    if(W==='kanabo') rig.elR.add(new THREE.Mesh(merge([pc(cyl(0.05,0.1,0.95,8).translate(0,-0.75,0),c=>c.set(p.club)),
      ...[0,1,2,3,4,5].map(k=>pc(new THREE.ConeGeometry(0.025,0.08,4).rotateZ(Math.PI/2).translate(0.1,-0.5-(k%3)*0.2,0).rotateY(k*1.05),c=>c.set(0xb8b0a0)))]),matChar));
    else if(W==='spear') rig.elR.add(new THREE.Mesh(merge([pc(cyl(0.02,0.02,1.9,6).translate(0,-0.55,0),c=>c.set(wood)),pc(new THREE.ConeGeometry(0.04,0.26,4).rotateX(Math.PI).translate(0,-1.62,0),c=>c.set(0xc0c6cc))]),matChar));
    else if(W==='axe') rig.elR.add(new THREE.Mesh(merge([pc(cyl(0.035,0.04,1.0,7).translate(0,-0.62,0),c=>c.set(wood)),pc(vbox(0.34,0.26,0.04,0.17,-1.02,0),c=>c.set(p.club)),pc(vbox(0.1,0.12,0.04,-0.08,-1.02,0),c=>c.set(0x4a4a50))]),matChar));
    else if(W==='katana') rig.elR.add(new THREE.Mesh(merge([pc(vbox(0.035,0.9,0.012,0,-0.72,0),(x,y,z,c)=>c.set(p.club).multiplyScalar(0.85+Math.abs(x)*4)),pc(cyl(0.06,0.06,0.02,10).translate(0,-0.26,0),c=>c.set(0x2a2420)),pc(cyl(0.02,0.02,0.22,6).translate(0,-0.13,0),c=>c.set(0x1a1414))]),matChar));
    else rig.elR.add(new THREE.Mesh(merge([pc(cyl(0.03,0.075,0.62,7).translate(0,-0.62,0),c=>c.set(p.club)),pc(csph(0.08,6,5).translate(0,-0.9,0),c=>c.set(p.club).multiplyScalar(0.8))]),matChar));
    // yokai extras on the head and back (head space: front is -z, the crown about 0.2 above the head pivot)
    if(p.horns) for(const sd of [-1,1]) rig.head.add(new THREE.Mesh(pc(new THREE.ConeGeometry(0.04,0.22,6).rotateZ(-sd*0.3).translate(sd*0.08,0.2,-0.02),c=>c.set(p.horns)),matChar));
    if(p.kasa) rig.head.add(new THREE.Mesh(pc(new THREE.ConeGeometry(0.36,0.2,14).translate(0,0.17,0),(x,y,z,c)=>c.set(p.kasa).multiplyScalar(0.85+h3(Math.round(Math.atan2(z,x)*6),0,3)*0.25)),matChar));
    if(p.nose){ rig.head.add(new THREE.Mesh(pc(new THREE.ConeGeometry(0.035,0.2,6).rotateX(-Math.PI/2).translate(0,0.0,-0.2),c=>c.set(p.nose)),matChar)); }
    if(p.shell){ rig.spine.add(new THREE.Mesh(pc(csph(0.22,12,9).scale(1.05,1.2,0.55).translate(0,0.3,0.16),(x,y,z,c)=>{ c.set(p.shell); if(Math.abs(Math.sin(x*14)*Math.sin(y*12))>0.8) c.multiplyScalar(0.7); }),matChar));
      rig.head.add(new THREE.Mesh(pc(cyl(0.1,0.1,0.02,12).translate(0,0.125,0),c=>c.set(0xd8e8e0)),matChar)); }
    if(p.fur){   // yeti / troll / reaver: a shaggy mane round the head and a fur mantle over the shoulders
      rig.head.add(new THREE.Mesh(merge([pc(csph(0.24,10,8).scale(1.15,1.05,0.9).translate(0,0.02,0.1),c=>c.set(p.fur)),...[-1,1].map(sd=>pc(csph(0.13,8,6).translate(sd*0.19,-0.1,-0.06),c=>c.set(p.fur))),pc(csph(0.13,8,6).scale(1.3,1,0.8).translate(0,-0.2,-0.14),c=>c.set(p.fur))]),matChar));
      rig.spine.add(new THREE.Mesh(merge([pc(csph(0.3,10,8).scale(1.75,0.55,1.1).translate(0,0.4,0.02),(x,y,z,c)=>c.set(p.fur).multiplyScalar(0.85+h3(Math.floor(x*9),Math.floor(y*9),Math.floor(z*9))*0.2))]),matChar)); }
    if(p.wings) for(const sd of [-1,1]) rig.spine.add(new THREE.Mesh(pc(new THREE.ConeGeometry(0.2,0.8,4).scale(0.4,1,1.6).rotateZ(-sd*0.7).translate(sd*0.34,0.45,0.2),c=>c.set(p.wings)),matChar));
    G.template=rig.root;
  }
  MON_GEO[d.id]=G; return G;
}
function buildMonster(d,mat){
  const G=monGeos(d), g=new THREE.Group(), P0={};
  const M=geo=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=true; return m; };
  if(d.model==='slime'){ P0.body=M(G.body); g.add(P0.body); }
  else if(d.model==='shroom'){ P0.body=M(G.body); g.add(P0.body); P0.fL=pivot(g,-0.13,0,0,M(G.foot)); P0.fR=pivot(g,0.13,0,0,M(G.foot)); }
  else if(d.model==='totem'){ P0.body=M(G.body); g.add(P0.body); }
  else if(d.model==='beetle'){ P0.body=M(G.body); g.add(P0.body); P0.lL=M(G.lL); P0.lR=M(G.lR); g.add(P0.lL,P0.lR); if(G.cL){ P0.cL=pivot(g,-0.7,0.55,-0.42,M(G.cL)); P0.cR=pivot(g,0.7,0.55,-0.42,M(G.cR)); } }
  else if(d.model==='fox'){ P0.body=M(G.body); g.add(P0.body); P0.tail=pivot(g,0,0.78,0.5,M(G.tail)); P0.legs=[[-0.15,-0.4],[0.15,-0.4],[-0.15,0.38],[0.15,0.38]].map(([x,z])=>pivot(g,x,0.46,z,M(G.leg))); }
  else if(d.model==='wyrm'){
    const zs=[0,0.85,0.8,0.7,0.6,0.5]; let par=g; P0.segs=G.segs.map((geo,i)=>{ const pv=pivot(par,0,i?0:1.15,zs[i],M(geo)); par=pv; return pv; });
    P0.tail=pivot(par,0,0,0.5,M(G.tailTip));
    P0.head=pivot(P0.segs[0],0,0.35,-0.75,M(G.head));
    P0.wR=pivot(P0.segs[0],0.45,0.5,-0.1,M(G.wing)); P0.wL=pivot(P0.segs[0],-0.45,0.5,-0.1,M(G.wingL));
    P0.legs=[[P0.segs[0],-0.5,-0.15],[P0.segs[0],0.5,-0.15],[P0.segs[2],-0.42,0],[P0.segs[2],0.42,0]].map(([s,x,z])=>pivot(s,x,-0.25,z,M(G.leg)));
  }
  else if(d.model==='wisp'){ P0.body=M(G.body); g.add(P0.body); if(G.flick){ P0.flick=pivot(g,0,1.9,0.05,M(G.flick)); P0.flick.children[0].castShadow=false; } }
  else if(d.model==='boar'){ P0.body=M(G.body); g.add(P0.body); P0.legs=[[-0.2,-0.4],[0.2,-0.4],[-0.2,0.4],[0.2,0.4]].map(([x,z])=>pivot(g,x,0.42,z,M(G.leg))); }
  else if(d.model==='treant'){
    P0.body=M(G.body); g.add(P0.body);
    P0.aL=pivot(g,-0.45,2.0,0,M(G.aL)); P0.aR=pivot(g,0.45,2.0,0,M(G.aR)); P0.aL.rotation.z=-0.45; P0.aR.rotation.z=0.45;
    P0.lL=pivot(g,-0.2,0.62,0,M(G.leg)); P0.lR=pivot(g,0.2,0.62,0,M(G.leg));
  } else if(d.model==='goblin'){
    const root=G.template.clone(true);
    root.traverse(o=>{ if(o.isMesh){ o.material=mat; o.castShadow=true; } });
    g.add(root); P0.rig=rigOf(root);
  }
  return {g,parts:P0};
}
/* Monsters are simulated by the world server; the client keeps a view of each one (MONS), created from the
   roster the server sends on join, moved smoothly toward the latest snapshot, and animated locally. */
const MON_BY_ID=new Map(), DEF_BY_ID={};
ALL_MON_DEFS.forEach(d=>{ DEF_BY_ID[d.id]=d; });
function addMonView(r){ // [id, defId, campX, campZ, scale, x, z, dead, temp]
  if(MON_BY_ID.has(r[0])) return MON_BY_ID.get(r[0]);
  const d=DEF_BY_ID[r[1]]; if(!d) return null;
  const mat=monMat(d.glow), {g,parts}=buildMonster(d,mat); scene.add(g);
  const m={id:r[0],def:d,model:d.model,T:d,camp:{x:r[2],z:r[3]},mat,g,parts,s:r[4],gs:r[4]*d.scale,maxHp:d.hp,hp:d.hp,
    x:r[5],z:r[6],y:getH(r[5],r[6]),tx:r[5],tz:r[6],face:0,tface:0,vx:0,vz:0,ph:AR(0,TAU),flash:0,slowT:0,
    dead:!!r[7],deadT:r[7]?9:0,aggro:false,immune:false,act:null,lunge:0,temp:!!r[8],spawnT:r[8]?0.6:0,boss:!!d.boss};
  g.visible=false; MONS.push(m); MON_BY_ID.set(m.id,m);
  if(m.boss) BOSS.list.push(m);
  return m;
}
function removeMonView(id){
  const m=MON_BY_ID.get(id); if(!m) return;
  scene.remove(m.g); m.mat.dispose(); MON_BY_ID.delete(id);
  const i=MONS.indexOf(m); if(i>=0) MONS.splice(i,1);
  if(CB.target===m) CB.target=null; BOSS.list=BOSS.list.filter(b=>b!==m); if(BOSS.m===m) BOSS.m=null;
}
function clearMonViews(){ [...MON_BY_ID.keys()].forEach(removeMonView); }
function applyMonSnap(a){ // [id, x, z, face, hp, flags: 1 aggro, 4 slowed, 8 immune]
  const m=MON_BY_ID.get(a[0]); if(!m) return;
  m.tx=a[1]; m.tz=a[2]; m.tface=a[3]; m.hp=a[4];
  m.aggro=!!(a[5]&1); m.slowT=(a[5]&4)?1:0; m.immune=!!(a[5]&8); m.burning=!!(a[5]&32);
  if(m.dead){ monRespawned(m,a[1],a[2]); }
}
function monRespawned(m,x,z){
  m.dead=false; m.deadT=0; m.hp=m.maxHp; m.x=m.tx=x; m.z=m.tz=z; m.y=getH(x,z);
  m.spawnT=0.6; m.g.rotation.set(0,m.face,0); m.act=null;
}
function monCenter(m){ return new THREE.Vector3(m.x,m.y+m.T.height*0.5*m.s,m.z); }
function updateMonsters(dt){
  for(const m of MONS){
    if(m.dead){
      m.deadT+=dt; const dur=m.boss?2:1.2;
      if(m.deadT<dur){ const f=m.deadT/dur; m.g.scale.setScalar(m.gs*(1-f*(m.boss?0.6:0.85))); m.g.position.y=m.y-f*(m.boss?1.5:0.3); m.g.rotation.z=f*(m.boss?0.5:0.9); }
      else m.g.visible=false;
      continue;
    }
    const dp=Math.hypot(m.x-P.x,m.z-P.z);
    if(dp>(m.boss?170:95)){ m.g.visible=false; m.x=m.tx; m.z=m.tz; continue; }
    m.g.visible=true;
    const ox=m.x, oz=m.z, k=1-Math.exp(-10*dt);
    m.x+=(m.tx-m.x)*k; m.z+=(m.tz-m.z)*k;
    if(Math.hypot(m.tx-m.x,m.tz-m.z)>12){ m.x=m.tx; m.z=m.tz; }
    const inv=1/Math.max(dt,1e-3); m.vx=(m.x-ox)*inv; m.vz=(m.z-oz)*inv;
    m.y=getH(m.x,m.z);
    m.face=angLerp(m.face,m.tface,1-Math.exp(-10*dt));
    animateMonster(m,dt,Math.min(Math.hypot(m.vx,m.vz),9));
    m.flash=Math.max(0,m.flash-dt*4);
    if(m.boss){ bossVisual(m,dt); continue; }
    const f=m.flash, sl=m.slowT>0?0.35:0, gl=m.mat.userData.glow, bn=m.burning?0.35+0.15*Math.sin(t*14):0;   // burning: an orange glow and sparks
    m.mat.emissive.setRGB(gl.r+f*0.9+bn,gl.g+f*0.35+sl*0.4+bn*0.4,gl.b+f*0.3+sl);
    if(m.burning&&m.g.visible&&Math.random()<dt*12){ const e=new THREE.Mesh(emberGeo,emberMat); e.position.set(m.x+AR(-0.35,0.35)*m.s,m.y+m.T.height*m.s*AR(0.2,1),m.z+AR(-0.35,0.35)*m.s); scene.add(e); CB.fx.push({mesh:e,life:0.5,max:0.5,shrink:true}); }
  }
  updateBossFx(dt);
}
function animateMonster(m,dt,sp){
  const P0=m.parts, g=m.g;
  m.lunge=Math.max(0,m.lunge-dt);
  const lunge=m.lunge>0?Math.sin((0.5-m.lunge)/0.5*Math.PI)*0.45*m.T.scale:0;
  let sc=m.gs; if(m.spawnT>0){ m.spawnT-=dt; sc=m.gs*(1-Math.max(0,m.spawnT)/0.6); }
  g.scale.setScalar(sc); g.rotation.set(0,m.face,0);
  g.position.set(m.x-Math.sin(m.face)*lunge,m.y,m.z-Math.cos(m.face)*lunge);
  if(m.model==='slime'){
    m.ph+=dt*(sp>0.1?7:2.5);
    const hop=sp>0.1?Math.max(0,Math.sin(m.ph))*0.45:0, sy=1+(sp>0.1?Math.sin(m.ph*2)*0.14:Math.sin(m.ph)*0.05)+lunge*0.3;
    P0.body.position.y=hop; P0.body.scale.set(1/Math.sqrt(sy),sy,1/Math.sqrt(sy));
  } else if(m.model==='shroom'){
    m.ph+=dt*(1+sp*6);
    P0.fL.position.z=Math.sin(m.ph)*0.12*Math.min(1,sp); P0.fR.position.z=-P0.fL.position.z;
    P0.body.rotation.z=Math.sin(m.ph)*0.09*Math.min(1,sp+0.2); P0.body.position.y=Math.abs(Math.cos(m.ph))*0.05*Math.min(1,sp);
  } else if(m.model==='beetle'){
    m.ph+=dt*(1+sp*10);
    P0.lL.position.z=Math.sin(m.ph)*0.07*Math.min(1,sp); P0.lR.position.z=-P0.lL.position.z;
    P0.body.position.y=Math.abs(Math.sin(m.ph))*0.02;
    if(P0.cL){   // a crab's claws: held up and swaying, they rear back and snap shut in its attack
      const atk=m.act?clamp(m.act.t/m.act.dur):0, up=m.act?Math.sin(atk*Math.PI)*0.7:0, snap=m.act?Math.sin(atk*Math.PI*4)*0.22:0, sw=Math.sin(t*1.7+m.ph)*0.06;
      P0.cL.rotation.set(-up+sw,-0.2+snap,0); P0.cR.rotation.set(-up-sw,0.2-snap,0);
    }
  } else if(m.model==='boar'){
    m.ph+=dt*sp*4;
    const amp=Math.min(1,sp/2)*0.6;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=lunge*-0.3;
  } else if(m.model==='treant'){
    m.ph+=dt*sp*2.2;
    const amp=Math.min(1,sp)*0.4;
    P0.lL.rotation.x=Math.sin(m.ph)*amp; P0.lR.rotation.x=-Math.sin(m.ph)*amp;
    const atk=m.act?clamp(m.act.t/m.act.dur):0;
    const armA=m.act?(atk<0.5?2.4*atk*2:2.4-(atk-0.5)*2*2.6):0;
    P0.aL.rotation.x=m.act?armA:Math.sin(m.ph)*amp; P0.aR.rotation.x=m.act?armA:-Math.sin(m.ph)*amp;
    P0.body.rotation.z=Math.sin(t*0.8+m.ph)*0.03;
  } else if(m.model==='fox'){
    m.ph+=dt*sp*4.5;
    const amp=Math.min(1,sp/2)*0.7;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=lunge*-0.3; P0.body.position.y=Math.abs(Math.sin(m.ph))*0.04*Math.min(1,sp);
    P0.tail.rotation.y=Math.sin(t*2.2+m.s*7)*0.25; P0.tail.rotation.x=-0.1+Math.sin(t*1.7+m.s*3)*0.08;
  } else if(m.model==='wyrm'){
    m.ph+=dt*(1.2+sp*1.3);
    const amp=0.12+Math.min(1,sp/2)*0.16, atk=m.act?clamp(m.act.t/m.act.dur):0;
    P0.segs.forEach((s,i)=>{ s.rotation.y=Math.sin(m.ph*2-i*0.75)*amp*(0.5+i*0.18); s.rotation.x=Math.sin(m.ph*1.3-i*0.6)*0.03; });
    P0.tail.rotation.y=Math.sin(m.ph*2-4.5)*amp*1.3;
    P0.head.rotation.x=m.act?(atk<0.45?-0.7*(atk/0.45):-0.7+(atk-0.45)/0.55*1.5):Math.sin(t*1.4+m.ph)*0.05+lunge*0.6;
    P0.head.rotation.y=Math.sin(m.ph*2+0.6)*0.1;
    const fl=Math.sin(t*(m.aggro?3.2:1.4)+m.s*5)*0.35+0.25; P0.wR.rotation.z=fl; P0.wL.rotation.z=-fl;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph*2+GAIT[k])*Math.min(1,sp/2)*0.5; });
  } else if(m.model==='wisp'){
    m.ph+=dt*(1.5+sp);
    P0.body.position.y=0.25+Math.sin(m.ph*1.3)*0.15; P0.body.rotation.x=Math.min(0.35,sp*0.08)+lunge*-0.4;
    if(P0.flick){ P0.flick.position.y=P0.body.position.y+1.9; P0.flick.scale.set(1,0.8+0.35*Math.sin(t*11+m.s*9),1); P0.flick.rotation.y=t*2; }
  } else if(m.model==='totem'){
    P0.body.rotation.y+=dt*0.4; P0.body.position.y=Math.sin(t*1.5+m.ph)*0.04;
  } else if(m.model==='goblin'){
    m.ph+=Math.sqrt(sp)*dt*3.3;
    poseRig(P0.rig,dt,{sp,ph:m.ph,act:m.act,seed:m.s*10});
  }
  if(m.act){ m.act.t+=dt; if(m.act.t>=m.act.dur) m.act=null; }
}

