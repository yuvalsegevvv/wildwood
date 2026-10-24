//@ Kin features drawn on the hiker (version 3): ears, a tail and a muzzle (look.kinEars / kinTail / kinMuzzle), horns and a mane as decorations, the fur colour and the markings painted on the skin
/* The registry and the rules are shared/kin.js. Everything here is small merged meshes on the head and hips rigs plus vertex colours: no fur shells, no extra bones, under 600 triangles for a full set.
   FUR: look.furColor replaces the skin tone on the whole body (kinFur sets X.skin before the body is built, so the face, hands and every outfit's bare skin follow); look.furMark paints a marking in the second colour (look.furColor2, else the
   marking's own) over the skin-coloured vertices of the torso, head and limbs after they are built (kinMarks): only vertices that still carry the skin colour change, so clothes, eyes and hair keep theirs.
   PARTS: an ear builder returns geometries pointing up (+y) from the ear's base at the origin, flat across z, the inside facing the front (-z); kinDress puts it on the skull at KIN_EARS[id].a (the angle from the crown), tipped out and back.
   A tail builder works in the hips' frame from the tail's root (+z is behind), and swings with rig.anims; a muzzle builder works in the head's frame (the face looks along -z; the nose is at y -0.022, the mouth at -0.068).
   HATS: kinHatMode (shared/kin.js) decides whether the ears poke through, fold flat or hide. A MANE replaces the hair: kinLook.
   Look fields are untrusted: kinPart is an own-property check, colours and markings are validated here.
   owns: KIN_EARS, KIN_TAILS, KIN_MUZZLES, kinDress, kinFur, kinLook, kinMarks.   used by: model.js (kinLook at the top of buildCharacter, kinFur after the kit, kinDress before the shield and decorations), ui/character-thumbs.js.
   test: tools/cospieces-smoke.js, tools/character-smoke.js. See it: node tools/model-preview.js out.png --kin all */
const KIN_EARS=Object.create(null), KIN_TAILS=Object.create(null), KIN_MUZZLES=Object.create(null);
const _kinW=new THREE.Color(0xfff4e0);
const kinOk=v=>typeof v==='number'&&v>=0&&v<=0xffffff;
const kinS=(g,col)=>pc(g,c=>c.copy(col));   // a geometry in one colour (the usual faint variation on top)
// the second colour: the look's own, else the part's default
const kinAcc=(K,def)=>K.sec?K.sec.clone():new THREE.Color(def);
// a mane replaces the hair row: the look with no hair (a copy) while one is worn in any decoration field
function kinLook(L){
  if(L.deco1!=='mane'&&L.deco2!=='mane'&&L.deco3!=='mane') return L;
  return Object.assign({},L,{hair:'bald'});
}
// the fur colour is the skin tone of the whole body
function kinFur(X){
  const v=X.L.furColor; if(kinOk(v)) X.skin=new THREE.Color(Math.floor(v));
}
// ---------- markings ----------
const KIN_MARK_COL={stripes:0x2a1c14,spots:0x2a1c14,patches:0xf2e8d0,mask:0x2a2024,socks:0x2a1c14,belly:0xf2e8d0};
function kinMarks(rig,X){
  const mk=X.L.furMark; if(typeof mk!=='string'||!mk||!Object.prototype.hasOwnProperty.call(KIN_MARK_COL,mk)) return;
  const skin=X.skin, sr=skin.r, sg_=skin.g, sb=skin.b, ss=sr*sr+sg_*sg_+sb*sb||1e-6, mc=kinOk(X.L.furColor2)?new THREE.Color(Math.floor(X.L.furColor2)):new THREE.Color(KIN_MARK_COL[mk]);
  if(!kinOk(X.L.furColor2)&&(mk==='stripes'||mk==='spots'||mk==='socks')) mc.copy(skin).multiplyScalar(0.4);   // dark marks follow the fur: 40% of it
  // the strength 0..1 of the mark at a point of a mesh, by the part of the body (x, y, z in that mesh's own frame)
  const at=(role,x,y,z)=>{
    switch(mk){
      case 'stripes': {
        if(role==='arm'||role==='leg'||role==='low'){ const f=((y*16+0.7*noise2(x*7,z*7))%1+1)%1; return smoothstep(0.42,0.38,f); }
        const f=((Math.atan2(x,z)/TAU*9+0.35*Math.sin(y*34)+9)%1+1)%1; return smoothstep(0.3,0.24,f); }
      case 'spots': { const s=0.034, i=Math.floor(x/s), j=Math.floor(y/s), k=Math.floor(z/s), cx=(i+0.25+0.5*h3(i,j,k))*s, cy=(j+0.25+0.5*h3(j,k,i))*s, cz=(k+0.25+0.5*h3(k,i,j))*s;
        if(h3(k,j,i)<0.35) return 0; return smoothstep(0.0125,0.009,Math.hypot(x-cx,y-cy,z-cz)); }
      case 'patches': return smoothstep(0.22,0.3,noise2(x*10+3,y*10+z*9));
      case 'mask': return role==='head'?smoothstep(0.034,0.026,Math.abs(y-0.012))*smoothstep(-0.03,-0.06,z)*smoothstep(0.105,0.09,Math.abs(x))+smoothstep(0.014,0.009,Math.abs(x))*smoothstep(-0.025,-0.015,y)*smoothstep(0.052,0.046,y)*smoothstep(-0.03,-0.06,z):0;
      case 'socks': return role==='low'?smoothstep(-0.15,-0.19,y):0;
      case 'belly': return role==='torso'?(1-smoothstep(0.05,0.085,Math.abs(x)))*smoothstep(-0.005,-0.03,z)*smoothstep(0.02,0.07,y):0;
    }
    return 0;
  };
  const seen=new Set();
  const doMesh=(m,role)=>{
    if(!m.isMesh||seen.has(m)) return; seen.add(m);
    const g=m.geometry, col=g.attributes.color, pos=g.attributes.position; if(!col||!pos) return;
    for(let i=0;i<pos.count;i++){
      const r=col.getX(i), gg=col.getY(i), b=col.getZ(i), k=(r*sr+gg*sg_+b*sb)/ss;
      if(k<0.5||k>1.15||Math.abs(r-k*sr)+Math.abs(gg-k*sg_)+Math.abs(b-k*sb)>0.05) continue;   // not skin (clothes, eyes, hair, lips)
      const t=Math.min(1,at(role,pos.getX(i),pos.getY(i),pos.getZ(i))); if(t<=0.01) continue;
      col.setXYZ(i,r+(mc.r*k-r)*t,gg+(mc.g*k-gg)*t,b+(mc.b*k-b)*t);
    }
    col.needsUpdate=true;
  };
  const walk=(root,role)=>root.traverse(o=>doMesh(o,role));
  walk(rig.elL,'low'); walk(rig.elR,'low'); walk(rig.kneeL,'low'); walk(rig.kneeR,'low');   // forearms with the hands, shins with the feet
  walk(rig.shL,'arm'); walk(rig.shR,'arm'); walk(rig.hipL,'leg'); walk(rig.hipR,'leg');
  for(const o of rig.spine.children) if(o.isMesh) doMesh(o,'torso');
  for(const o of rig.head.children) if(o.isMesh) doMesh(o,'head');
}
// ---------- ears ----------
// a flat pointed ear standing on the origin: base half-width w, height len, thickness th; the inside (a smaller, paler cone) faces the front
function kinEarCone(K,w,len,th,tipAt,tipCol){
  const n=Math.max(5,K.sg(6)), out=new THREE.ConeGeometry(w,len,n,1,true).scale(1,1,th/w).translate(0,len/2,0), inn=new THREE.ConeGeometry(w*0.6,len*0.78,n,1,true).scale(1,1,th*0.55/w).translate(0,len*0.39,-th*0.5);
  const tip=tipCol||null;
  return [pc(out,(x,y,z,c)=>{ c.copy(K.fur); if(tip&&y>len*tipAt) c.copy(tip); }),kinS(inn,K.light)];
}
// [angle from the crown, tilt out, tilt back, builder(K) → geometries pointing up from the base]
function kinEar(id,a,out,back,fn){ KIN_EARS[id]={a,out,back,fn}; }
kinEar('cat',0.62,0.22,0.1,K=>kinEarCone(K,0.032,0.062,0.012));
kinEar('round',0.78,0.5,0.05,K=>[pc(csph(1,K.sg(6),K.sg(4)).scale(0.034,0.034,0.011).translate(0,0.028,0),(x,y,z,c)=>{ c.copy(K.fur); if(Math.hypot(x/0.034,(y-0.028)/0.034)>0.8) c.multiplyScalar(0.86); }),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.021,0.021,0.006).translate(0,0.028,-0.007),K.light)]);
kinEar('fox',0.6,0.18,0.12,K=>kinEarCone(K,0.03,0.092,0.012,0.6,kinAcc(K,0x2a2420)));
kinEar('hare',0.5,0.28,0.25,K=>[kinS(csph(1,K.sg(5),K.sg(4)).scale(0.02,0.105,0.008).translate(0,0.09,0),K.fur),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.011,0.085,0.005).translate(0,0.092,-0.006),new THREE.Color(0xe9a0a8).lerp(K.light,0.3))]);
kinEar('antelope',1.05,1.25,0.08,K=>{ const tip=kinAcc(K,0x2a2420);
  return [pc(csph(1,K.sg(5),K.sg(4)).scale(0.02,0.06,0.007).translate(0,0.05,0),(x,y,z,c)=>{ c.copy(K.fur); if(y>0.085) c.copy(tip); }),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.012,0.044,0.004).translate(0,0.05,-0.005),K.light)]; });
kinEar('rhino',0.85,0.55,0.08,K=>{ const rim=kinAcc(K,0x3a2c24);
  return [pc(csph(1,K.sg(5),K.sg(4)).scale(0.027,0.036,0.014).translate(0,0.03,0),(x,y,z,c)=>{ c.copy(K.fur); if(Math.hypot(x/0.027,(y-0.03)/0.036)>0.82) c.copy(rim); }),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.015,0.022,0.006).translate(0,0.028,-0.011),K.light)]; });
kinEar('crest',0.42,0,0,K=>{ const tip=kinAcc(K,0xf2e8d0), out=[];   // three swept feathers per side, the middle one longest
  for(let i=0;i<3;i++){ const L=0.05+0.018*(1-Math.abs(i-1)), s=(i-1);
    out.push(pc(sweepTube([[0,0,0],[s*0.007,0.03+0.01*i,0.012+0.01*i],[s*0.012,0.05+L*0.4,0.04+0.02*i]],[0.006,0.008,0.0012],4,{cap:'point',rings:4}),(x,y,z,c)=>{ c.copy(K.fur); if(y>0.04) c.lerp(tip,smoothstep(0.04,0.075,y)); })); }
  return out; });
// ---------- tails ----------
// a curve from the root (0,0,0) to the tip, behind (+z) and up (+y); radii along it; paint(s,c): s is the distance back plus the rise, a stand-in for the way along
const kinTube=(K,pts,rad,fn)=>pc(sweepTube(pts,rad,Math.max(5,K.sg(6)),{cap:'point',rings:Math.max(6,K.sg(9))}),(x,y,z,c)=>{ c.copy(K.fur); if(fn) fn(c,z+Math.max(0,y),x,y,z); });
KIN_TAILS.thin=K=>[kinTube(K,[[0,0,0],[0,-0.03,0.09],[0,-0.02,0.2],[0,0.04,0.28],[0,0.1,0.3]],[0.016,0.013,0.01,0.008,0.004])];
KIN_TAILS.puff=K=>[kinS(csph(1,K.sg(7),K.sg(5)).scale(0.042,0.042,0.042).translate(0,0.005,0.05),K.light),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.02,0.02,0.02).translate(0,0,0.012),K.fur)];
KIN_TAILS.bushy=K=>{ const tip=K.light; return [kinTube(K,[[0,0,0],[0,-0.05,0.1],[0,-0.07,0.22],[0,-0.03,0.34],[0,0.03,0.42]],[0.025,0.045,0.058,0.05,0.008],(c,s)=>{ if(s>0.3) c.lerp(tip,smoothstep(0.3,0.42,s)); })]; };
KIN_TAILS.tufted=K=>{ const tuft=kinAcc(K,0x4a2c18), pts=[[0,0,0],[0,-0.03,0.1],[0,-0.02,0.21],[0,0.03,0.3],[0,0.07,0.34]];
  return [kinTube(K,pts,[0.014,0.011,0.009,0.009,0.009]),kinS(sweepTube([[0,0.065,0.33],[0,0.1,0.37],[0,0.15,0.4],[0,0.2,0.41]],[0.012,0.03,0.026,0.002],Math.max(5,K.sg(6)),{cap:'point',rings:Math.max(5,K.sg(7))}),tuft)]; };
KIN_TAILS.spotted=K=>{ const dark=kinAcc(K,0x2a1c14); return [kinTube(K,[[0,0,0],[0,-0.04,0.1],[0,-0.03,0.22],[0,0.04,0.32],[0,0.12,0.36]],[0.022,0.028,0.026,0.022,0.011],(c,s,x,y,z)=>{
  const q=0.03, i=Math.floor(x/q), j=Math.floor(y/q), k=Math.floor(z/q); if(s>0.4&&Math.floor(s*34)%2===0) c.copy(dark); else if(h3(i,j,k)<0.45&&Math.hypot(x-(i+0.5)*q,y-(j+0.5)*q,z-(k+0.5)*q)<0.012) c.copy(dark); })]; };
KIN_TAILS.striped=K=>{ const dark=kinAcc(K,0x2a1c14); return [kinTube(K,[[0,0,0],[0,-0.04,0.1],[0,-0.03,0.23],[0,0.04,0.34],[0,0.12,0.38]],[0.02,0.026,0.026,0.022,0.012],(c,s)=>{ if(Math.floor(s*26)%2===0||s>0.43) c.copy(dark); })]; };
KIN_TAILS.plume=K=>{ const tip=kinAcc(K,0xf2e8d0), out=[];   // five feathers fanned up and back
  for(let i=0;i<5;i++){ const a=(i-2)/2, g=csph(1,5,4).scale(0.014,0.1-0.012*Math.abs(a)*2,0.005).translate(0,0.1,0).rotateZ(-a*0.7).rotateX(0.5+0.1*Math.abs(a));
    out.push(pc(g,(x,y,z,c)=>{ c.copy(K.fur); c.lerp(tip,smoothstep(0.1,0.19,Math.hypot(x,y))); })); }
  out.push(kinS(csph(1,6,4).scale(0.026,0.026,0.026),K.fur)); return out; };
// ---------- muzzles ----------
// the face's front surface (z) at a point of the head, approximated by the skull's ellipsoid
const kinFace=(K,x,y)=>-0.105*Math.sqrt(Math.max(0.08,1-Math.pow(x/(0.105*K.fs[0]),2)-Math.pow(y/(0.105*K.fs[1]),2)));
KIN_MUZZLES.nose=K=>{ const z=kinFace(K,0,-0.024), dk=0x2a2024;
  return [kinS(csph(1,K.sg(7),K.sg(5)).scale(0.013,0.0095,0.009).translate(0,-0.024,z-0.002),new THREE.Color(dk)),kinS(sweepTube([[0,-0.032,z],[0,-0.05,z],[0,-0.06,z+0.002]],[0.0012,0.0012,0.0012],3,{cap:'round',rings:3}),new THREE.Color(dk))]; };
KIN_MUZZLES.whiskers=K=>{ const out=[], z=kinFace(K,0.02,-0.042), col=K.sec?K.sec.clone():new THREE.Color(0xeee8dc);
  for(const sd of [-1,1]){ out.push(kinS(csph(1,K.sg(5),K.sg(4)).scale(0.014,0.011,0.007).translate(sd*0.02,-0.042,z-0.002),K.light));
    for(let i=0;i<3;i++){ const dy=(i-1)*0.014; out.push(kinS(sweepTube([[sd*0.022,-0.042+dy*0.3,z-0.003],[sd*0.06,-0.042+dy*0.9,z+0.002],[sd*0.1,-0.042+dy*1.5,z+0.03]],[0.0016,0.0012,0.0004],3,{cap:'point',rings:3}),col)); } }
  return out; };
KIN_MUZZLES.snout=K=>{ const z=kinFace(K,0,-0.045);
  return [pc(csph(1,K.sg(7),K.sg(5)).scale(0.034,0.03,0.046).translate(0,-0.045,z-0.02),(x,y,z2,c)=>{ c.copy(K.fur); if(y<-0.058) c.copy(K.light); }),
    kinS(csph(1,K.sg(5),K.sg(4)).scale(0.014,0.01,0.01).translate(0,-0.031,z-0.064),new THREE.Color(0x2a2024)),
    kinS(sweepTube([[0,-0.06,z-0.058],[0,-0.063,z-0.03],[0,-0.063,z-0.004]],[0.0012,0.0012,0.0012],3,{cap:'round',rings:3}),new THREE.Color(0x2a2024))]; };
KIN_MUZZLES.tusks=K=>{ const out=[], z=kinFace(K,0.024,-0.07), ivory=K.sec?K.sec.clone():new THREE.Color(0xf0e8d0);
  for(const sd of [-1,1]) out.push(kinS(sweepTube([[sd*0.025,-0.072,z+0.004],[sd*0.042,-0.082,z-0.012],[sd*0.056,-0.07,z-0.034],[sd*0.054,-0.044,z-0.048]],[0.0085,0.0075,0.005,0.0012],Math.max(5,K.sg(5)),{cap:'point',rings:Math.max(5,K.sg(6))}),ivory));
  return out; };
KIN_MUZZLES.beak=K=>{ const z=kinFace(K,0,-0.03), col=kinAcc(K,0xe0b030), dk=col.clone().multiplyScalar(0.7), n=Math.max(5,K.sg(5));
  return [pc(sweepTube([[0,-0.024,z+0.01],[0,-0.03,z-0.034],[0,-0.048,z-0.066]],[0.026,0.017,0.0025],n,{cap:'point',rings:Math.max(5,K.sg(6))}).scale(1,0.78,1),(x,y,zz,c)=>{ c.copy(col); if(zz<z-0.05) c.copy(dk); }),
    kinS(sweepTube([[0,-0.064,z+0.006],[0,-0.068,z-0.028],[0,-0.063,z-0.046]],[0.014,0.01,0.0025],n,{cap:'point',rings:Math.max(4,K.sg(5))}).scale(1,0.7,1),dk)]; };
// ---------- the drawing ----------
function kinDress(rig,X){
  const L=X.L, ear=kinPartOf('e',L.kinEars), tail=kinPartOf('k',L.kinTail), muz=kinPartOf('m',L.kinMuzzle);
  kinMarks(rig,X);
  if(!ear&&!tail&&!muz) return;
  const fs=rig.dims.faceScale, sec=kinOk(L.furColor2)?new THREE.Color(Math.floor(L.furColor2)):null, fur=X.skin.clone();
  const K={sg:v=>Math.min(v,X.sg(v)),fs,fur,light:fur.clone().lerp(_kinW,0.55),sec};
  if(ear){
    const mode=kinHatMode(L.hat);
    if(mode!=='hide'){ const E=KIN_EARS[ear.id], flat=mode==='flat', parts=[];
      for(const sd of [-1,1]){
        const a=flat?1.12:E.a, base=[sd*Math.sin(a)*0.103*fs[0],Math.cos(a)*0.103*fs[1],-0.004];
        const g=merge(E.fn(K)); g.scale(flat?0.9:1.3,flat?0.9:1.3,flat?0.9:1.3);   // (every builder is symmetric about x = 0: the same shape serves both sides)
        parts.push(g.rotateX(flat?0.1:E.back).rotateZ(-sd*(flat?1.25:E.out)).translate(base[0],base[1],base[2]));
      }
      const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=false; rig.head.add(m);
    }
  }
  if(muz&&KIN_MUZZLES[muz.id]){ const m=new THREE.Mesh(merge(KIN_MUZZLES[muz.id](K)),matChar); m.castShadow=false; rig.head.add(m); }
  if(tail&&KIN_TAILS[tail.id]){
    const grp=new THREE.Group(); grp.position.set(0,0.015,0.085); const m=new THREE.Mesh(merge(KIN_TAILS[tail.id](K)),matChar); m.castShadow=false; grp.add(m);
    (rig.anchors.waist||rig.hips).add(grp);
    rig.anims=rig.anims||[]; rig.anims.push((t,dt,mv)=>{ grp.rotation.y=Math.sin(t*1.6)*0.14+Math.sin(t*5)*0.04*mv; grp.rotation.x=0.05*Math.sin(t*1.1)-0.12*mv; });
  }
}
const kinPartOf=(slot,id)=>kinPart(slot,id)&&((slot==='e'&&KIN_EARS[id])||(slot==='k'&&KIN_TAILS[id])||(slot==='m'&&KIN_MUZZLES[id]))?kinPart(slot,id):null;
// ---------- horns and a mane (decorations: shared/kin.js, slot d) ----------
decoReg('lyrehorns','headTop',F=>{ const {c,sg}=F, p=[];   // two long ridged horns sweeping up and curving back in
  for(const s of [-1,1]) p.push(pc(sweepTube([[s*0.04,0.07,-0.012],[s*0.075,0.11,-0.014],[s*0.085,0.18,-0.012],[s*0.07,0.26,-0.004],[s*0.05,0.315,0.004]],[0.015,0.013,0.01,0.0065,0.0012],Math.max(5,sg(6)),{cap:'point',rings:Math.max(10,sg(12))}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(Math.floor(y*58)%2?0.82:1); if(y<0.1) cc.multiplyScalar(0.8); }));
  return {parts:p}; });
decoReg('rhinohorn','face',F=>{ const {c,sg}=F, n=Math.max(6,sg(8));   // a thick horn on the bridge of the nose and a smaller one behind it
  const big=new THREE.ConeGeometry(0.022,0.1,n,1,true).translate(0,0.05,0).rotateX(-0.6).translate(0,-0.012,-0.004), small=new THREE.ConeGeometry(0.014,0.05,n,1,true).translate(0,0.025,0).rotateX(-0.3).translate(0,0.03,0.0);
  return {parts:[pc(big,(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.78+0.3*clamp((y+0.01)*8)); }),pc(small,(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.8+0.25*clamp((y-0.03)*14)); })]}; });
decoReg('mane','headTop',F=>{ const {c,sg}=F, kc=new THREE.Color(F.k), lc=new THREE.Color(F.l), p=[];   // a full mane: a hood of fur round the back and sides of the head, and tufts that frame the face and hang down the neck
  const hood=new THREE.SphereGeometry(0.138,Math.max(10,sg(16)),Math.max(7,sg(10)),-0.12*Math.PI,1.24*Math.PI,0.08*Math.PI,0.8*Math.PI).scale(1.02,1.02,1.0).translate(0,-0.01,0.012);
  p.push(pc(hood,(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.8+0.3*clamp((y+0.1)*4)+0.08*Math.sin(Math.atan2(x,z)*9+y*30)); }));
  const tuft=(x,y,z,len,w,lean)=>{ const g=new THREE.ConeGeometry(w,len,5,1,true).rotateX(Math.PI).translate(0,-len/2,0).rotateZ(lean[0]).rotateX(lean[1]).translate(x,y,z); return pc(g,(gx,gy,gz,cc)=>{ cc.set(c).lerp(gy<y-len*0.5?kc:lc,0.35); }); };   // (the wide end at the head, the point hanging)
  for(let i=0;i<9;i++){ const a=0.5*Math.PI+i/8*Math.PI, r=0.128, sd=Math.sin(a), cs=Math.cos(a); p.push(tuft(sd*r,-0.04-0.02*Math.abs(Math.sin(a*1.3)),-cs*r*0.9+0.01,0.1+0.03*(i%3),0.026,[-sd*0.25,cs*0.2])); }
  for(const s of [-1,1]) for(let j=0;j<2;j++) p.push(tuft(s*0.108,-0.012-0.04*j,-0.03,0.06+0.02*j,0.016,[-s*0.1,-0.05]));   // short sideburns that frame the face
  return {parts:p}; });
DECO_COL.lyrehorns=0x4a3626; DECO_COL.rhinohorn=0x6b6358; DECO_COL.mane=0x9a5a22;
