//@ Cave props of methods G and H: the mole's wall holes and dirt burrows (they glint and a gold diamond floats over them while a mole runs) and the crafting props (ore veins, herb tufts, the iron anvil with its progress gems)
/* Agent map. Doc: docs/CAVE.md section 15. Kit and conventions: method-props.js. Test: tools/client-smoke.js (the cave case).
   exports: caveMpG(X) (mole), caveMpH(X) (crafting).
   G: a hole is a dark arch at the foot of the wall with a ring of stones, a dirt heap and a gem glinting inside; a burrow is a dirt mound with a dark crater and gems stuck in its sides. Idle = dull; while a mole runs on the floor (s.g) every hole and burrow
      glints, glows gold, puffs dust (the burrows shake) and a gold diamond bobs over each hole, so you know where to look.
   H: a vein is a rock outcrop with faceted nuggets in the ore's colour and a glint; taken = the nuggets are gone and scorched rubble is left (a burst of sparks as you take it). A herb is a tuft of leaves with glowing buds in the herb's colour; taken = a short
      stump. The anvil is an iron anvil on a stump with two rows of gems above it (ore, herbs: lit as you hold them), a pill with the counts, and a hot glow, beam and sparks once you hold enough. A ring under you shows the cast. */
function caveMpG(X){
  const MP=CAVE_MP, rd=X.rd, dirt=caveMpRockC(0x6a5a46,0.35), dark=(x,y,z,nx,ny,nz,c)=>c.set(0x080706), GL=0xffd25a, glintMat=X.sol(GL), dia=new THREE.OctahedronGeometry(1); MP.geos.push(dia);
  const rim=[0,1,2,3,4,5,6];
  const holes=X.A.G.holes.map(q=>{
    const [x,z]=X.out(q,0.55), G=X.at(x,z); G.rotation.y=Math.atan2(q.nx||0,q.nz||1);
    const p=[caveMpPart(new THREE.CircleGeometry(0.5,12),dark,0,0.5,-0.42,{sy:1.0}), caveMpPart(new THREE.CylinderGeometry(0.55,0.55,0.04,12),dark,0,0.03,0.05), caveMpPart(caveMpRock(0.75,0.3,0.6,0.4,rd),dirt,0,0.12,0.95)];
    for(let k=0;k<7;k++){ const a=k/6*Math.PI; p.push(caveMpPart(caveMpRock(0.17,0.2,0.16,0.4,rd),dirt,-Math.cos(a)*0.58,0.5+Math.sin(a)*0.58,-0.4)); }   // an arch of stones round the mouth
    for(const s of [-1,1]) p.push(caveMpPart(caveMpRock(0.2,0.12,0.2,0.4,rd),dirt,s*0.5,0.08,0.35));
    G.add(X.mesh(p));
    const gl=new THREE.Mesh(dia,glintMat); gl.position.set(0.05,0.32,-0.25); gl.scale.set(0.07,0.1,0.07); G.add(gl);
    const h=X.halo(GL,2,0), mk=new THREE.Mesh(dia,glintMat); h.position.set(0,0.5,0); mk.position.set(0,1.9,0.2); mk.scale.set(0.15,0.25,0.15); G.add(h,mk); return {G,gl,h,mk,t:0};
  });
  const burrows=X.A.G.burrows.map(q=>{
    const G=X.at(q.x,q.z), p=[caveMpPart(caveMpRock(1.5,0.62,1.5,0.35,rd),dirt,0,0.2,0), caveMpPart(new THREE.CylinderGeometry(0.46,0.5,0.06,12),dark,0,0.8,0)];
    for(const k of [0,1,2,3,4,5]){ const a=k/6*Math.PI*2; p.push(caveMpPart(caveMpRock(0.2,0.16,0.2,0.4,rd),dirt,Math.sin(a)*0.58,0.8,Math.cos(a)*0.58)); }
    G.add(X.mesh(p)); const gems=[0,1,2].map(k=>{ const a=k*2.1+0.5, m=new THREE.Mesh(dia,glintMat); m.position.set(Math.sin(a)*1.0,0.5,Math.cos(a)*1.0); m.scale.set(0.1,0.18,0.1); m.rotation.z=0.3; G.add(m); return m; });
    const h=X.halo(GL,3,0); h.position.y=0.9; G.add(h); return {G,gems,h,base:G.position.clone(),t:0};
  });
  X.add((s,dt,tt)=>{
    const on=s.g!==0, sc=on?1.4+0.5*Math.sin(tt*6):0.7; glintMat.color.setHex(on?GL:0x8a6a2a);
    holes.forEach((o,i)=>{ o.gl.scale.set(0.07*sc,0.1*sc,0.07*sc); o.gl.rotation.y=tt*2; o.h.material.opacity=on?0.45+0.2*Math.sin(tt*5+i):0; o.mk.visible=on; if(on){ o.mk.position.y=1.9+0.15*Math.sin(tt*3+i); o.mk.rotation.y=tt*2.5; }
      if(on&&X.fx&&X.near(o.G,26)){ o.t+=dt; if(o.t>0.7){ o.t=0; fxpSmoke(o.G.position.x,o.G.position.y+0.3,o.G.position.z,AR(-0.1,0.1),0.4,AR(-0.1,0.1),0x8a7a62,0.5,1.2,{grow:2,a:0.35}); } } });
    burrows.forEach((o,i)=>{ o.h.material.opacity=on?0.4+0.15*Math.sin(tt*5+i):0; o.G.position.x=o.base.x+(on?0.03*Math.sin(tt*41+i):0); o.G.position.z=o.base.z+(on?0.03*Math.cos(tt*37+i):0);
      if(on&&X.fx&&X.near(o.G,26)){ o.t+=dt; if(o.t>0.5){ o.t=0; fxpSmoke(o.base.x,o.base.y+0.9,o.base.z,AR(-0.2,0.2),0.7,AR(-0.2,0.2),0x8a7a62,0.6,1.3,{grow:2.2,a:0.4}); } } });
  });
}
function caveMpH(X){
  const MP=CAVE_MP, H=X.MD('H').p, rd=X.rd, n=X.R.n, hex=k=>RES[k]?parseInt(RES[k].col.slice(1),16):0, oc=hex(H.ore_kind[n])||X.accent, hc=hex(H.herb_kind[n])||0x7ab86a, A=X.A.H;
  const lite=c=>new THREE.Color(c).lerp(new THREE.Color(0xffffff),0.45).getHex(), dk=c=>new THREE.Color(c).multiplyScalar(0.4).getHex(), stone=caveMpRockC(0x4d4a46,0.35), scorch=caveMpRockC(0x2c2a28,0.3);
  // veins: one outcrop built once, shared by every vein (a clone shares geometry and material)
  const baseM=X.mesh([caveMpPart(caveMpRock(0.8,0.95,0.55,0.4,rd),stone,0,0.8,-0.1), caveMpPart(caveMpRock(0.45,0.5,0.4,0.4,rd),stone,0.65,0.4,0.05)]);
  const oreM=X.mesh([[-0.3,0.9,0.4,0.2],[0.1,1.3,0.38,0.17],[0.3,0.65,0.42,0.24],[-0.15,0.5,0.4,0.15],[0.45,1.05,0.36,0.14]].map(([x,y,z,r],k)=>caveMpPart(new THREE.OctahedronGeometry(r),caveMpGradC(dk(oc),lite(oc),y-r*1.4,y+r*1.4,0.08),x,y,z,{sy:1.4,ry:k,rz:(k-2)*0.2})));
  const spentM=X.mesh([caveMpPart(new THREE.CylinderGeometry(0.5,0.55,0.03,9),scorch,0,0.02,0.45), caveMpPart(caveMpRock(0.2,0.12,0.18,0.4,rd),scorch,-0.25,0.08,0.5), caveMpPart(caveMpRock(0.16,0.1,0.15,0.4,rd),scorch,0.2,0.07,0.6), caveMpPart(caveMpRock(0.14,0.09,0.14,0.4,rd),scorch,0.05,0.06,0.35)]);
  const veins=A.veins.map((q,i)=>{ const [x,z]=X.out(q,0.5), G=X.at(x,z); G.rotation.y=Math.atan2(q.nx||0,q.nz||1); G.scale.y=0.9+0.2*h3(i,1,2);
    const ore=oreM.clone(), spent=spentM.clone(), h=X.halo(lite(oc),1.7,0.35); h.position.set(0,1.0,0.6); G.add(baseM.clone(),ore,spent,h); return {G,ore,spent,h,had:false}; });
  // herbs: a tuft with glowing buds, and the stump left behind
  const leaf=[]; for(let k=0;k<8;k++){ const len=0.55+0.25*((k*5)%3)/2; leaf.push(caveMpPart(new THREE.ConeGeometry(0.09,len,4).translate(0,len/2,0).rotateZ(0.25+0.15*(k%3)).rotateY(k*0.8),caveMpGradC(dk(hc),hc,0,len,0.12),0,0,0)); }
  for(let k=0;k<3;k++){ const a=k*2.1, hh=0.85+0.12*k; leaf.push(caveMpPart(new THREE.CylinderGeometry(0.015,0.02,hh,4).translate(0,hh/2,0),caveMpRockC(dk(hc),0.1),Math.sin(a)*0.12,0,Math.cos(a)*0.12), caveMpPart(new THREE.SphereGeometry(0.095,7,5),caveMpGradC(hc,lite(hc),hh-0.1,hh+0.1,0.05),Math.sin(a)*0.12,hh,Math.cos(a)*0.12)); }
  const fullM=X.mesh(leaf), stumpM=X.mesh([0,1,2].map(k=>caveMpPart(new THREE.ConeGeometry(0.07,0.2,4).translate(0,0.1,0).rotateZ(0.5),caveMpGradC(dk(hc),hc,0,0.2),0,0,0,{ry:k*2.1})));
  const herbs=A.herbs.map((q,i)=>{ const G=X.at(q.x,q.z), full=fullM.clone(), stump=stumpM.clone(), h=X.halo(lite(hc),1.3,0.4); h.position.y=0.85; G.rotation.y=i*1.7; G.add(full,stump,h); return {G,full,stump,h,had:false}; });
  // the anvil
  const an=A.anvil, Ga=X.at(an.x,an.z), iron=caveMpRockC(0x4a4f56,0.15), top=caveMpRockC(0x6b7078,0.12), wood=(x,y,z,nx,ny,nz,c)=>{ c.set(0x6a4a2c).multiplyScalar(0.6+0.4*(ny*0.5+0.5)); if(ny>0.8&&Math.abs(Math.hypot(x,z)%0.18-0.09)<0.025) c.multiplyScalar(0.6); };
  Ga.add(X.mesh([caveMpPart(new THREE.CylinderGeometry(0.55,0.65,0.6,10),wood,0,0.3,0), caveMpPart(new THREE.BoxGeometry(0.85,0.14,0.5),iron,0,0.67,0), caveMpPart(new THREE.BoxGeometry(0.4,0.32,0.36),iron,0,0.9,0), caveMpPart(new THREE.BoxGeometry(1.3,0.2,0.56),top,0,1.16,0),
    caveMpPart(new THREE.ConeGeometry(0.28,0.7,6).rotateZ(Math.PI/2),iron,-0.95,1.16,0), caveMpPart(new THREE.BoxGeometry(0.1,0.03,0.1),caveMpRockC(0x14161a,0.05),0.3,1.27,0)]));
  const hotMat=X.addMat({color:0xff8a3a,opacity:0}), hot=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.03,0.5),hotMat); MP.geos.push(hot.geometry); hot.position.y=1.28; Ga.add(hot);
  const ah=X.halo(0xff9a4a,3,0), ab=X.beam(0xffb060,5,0.35,0); ah.position.y=1.5; Ga.add(ah,ab);
  const oreL=X.sol(oc), herbL=X.sol(hc), dimM=X.sol(0x2a2e32), pg=new THREE.OctahedronGeometry(1); MP.geos.push(pg);
  const pip=(mat,x,sy)=>{ const m=new THREE.Mesh(pg,dimM); m.scale.set(0.11,0.16*sy,0.11); m.position.set(x,2.0,0); Ga.add(m); return m; };
  const orePips=Array.from({length:H.ore},(_,k)=>pip(oreL,-0.9+k*0.3,1)), herbPips=Array.from({length:H.herb},(_,k)=>pip(herbL,0.5+k*0.3,0.8)), lb=X.text(3.5); lb.s.position.y=2.6; Ga.add(lb.s);
  const cast=X.ring(oc,0.8,0); cast.visible=false; X.g.add(cast); let gt=0, et=0;
  X.add((s,dt,tt)=>{
    const vm=s.h.vm|0, hm=s.h.hm|0, ore=s.h.o|0, herb=s.h.b|0, ready=ore>=H.ore&&herb>=H.herb;
    veins.forEach((o,i)=>{ const got=!!(vm>>i&1); if(got&&!o.had&&X.fx) fxpSparks(o.G.position.x,o.G.position.y+0.8,o.G.position.z,lite(oc),12,3,{up:1.5}); o.had=got; o.ore.visible=!got; o.spent.visible=got; o.h.visible=!got; if(!got) o.h.material.opacity=0.28+0.18*Math.sin(tt*2.4+i*1.7); });
    herbs.forEach((o,i)=>{ const got=!!(hm>>i&1); if(got&&!o.had&&X.fx) fxpSparks(o.G.position.x,o.G.position.y+0.5,o.G.position.z,lite(hc),10,2.4,{up:1.2}); o.had=got; o.full.visible=!got; o.stump.visible=got; o.h.visible=!got; if(!got){ o.h.material.opacity=0.3+0.2*Math.sin(tt*2+i); if(!LOW) o.G.children[0].rotation.z=0.04*Math.sin(tt*1.5+i); } });
    orePips.forEach((m,k)=>{ m.material=k<ore?oreL:dimM; m.rotation.y=tt*1.5; m.visible=X.near(Ga,34); }); herbPips.forEach((m,k)=>{ m.material=k<herb?herbL:dimM; m.rotation.y=tt*1.5; m.visible=X.near(Ga,34); });
    hotMat.opacity=ready?0.5+0.3*Math.sin(tt*4):0; ah.material.opacity=ready?0.6+0.2*Math.sin(tt*4):0; ab.visible=ready; ab.material.opacity=0.45; lb.s.visible=X.near(Ga,24);
    lb.set(ready?'Anvil ready: carve here':'Anvil: ore '+ore+'/'+H.ore+' herbs '+herb+'/'+H.herb,ready?'#ffb060':'#9aa4ac');
    cast.visible=!!s.h.c; if(cast.visible){ cast.position.set(P.x,P.y+0.12,P.z); const k2=1.0+0.15*Math.sin(tt*8); cast.scale.set(k2,1,k2); cast.material.opacity=0.45+0.25*Math.sin(tt*8); }
    if(X.fx){ gt+=dt; if(gt>0.6){ gt=0; const i=Math.floor(Math.random()*veins.length), o=veins[i]; if(o&&!o.had&&X.near(o.G,16)) fxpAdd(o.G.position.x+AR(-0.4,0.4),o.G.position.y+AR(0.5,1.4),o.G.position.z+AR(-0.4,0.4),0,AR(0.1,0.3),0,lite(oc),0.13,AR(0.5,0.9),{white:0.6,grow:0.2,a:0.95}); }
      if(ready&&X.near(Ga,26)){ et+=dt; if(et>0.22){ et=0; fxpAdd(Ga.position.x+AR(-0.5,0.5),Ga.position.y+1.3,Ga.position.z+AR(-0.2,0.2),AR(-0.3,0.3),AR(1,2),0,0xff9a3a,0.12,AR(0.6,1.1),{g:2,white:0.2,grow:0.1,a:0.95}); } } }
  });
}
