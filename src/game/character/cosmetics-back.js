//@ Back attachments worn in the cape slot: angel wings, demon wings, a devil tail, butterfly wings, three fox tails and a peacock fan (capes whose pattern is 'back:<kind>'), each flapping or swaying with the walk
/* Agent map. cosBuildBack(rig,X,def) is called by cosDress (cosmetics.js) for a cape whose def.pat starts with 'back:'; the rows are in shared/cosmetics.js COS_CAPES (col = the main colour, trim = the second).
   They hang on rig.spine like the cape (+z is the back, y up from the waist, the shoulders at D.shY) and push one animation. Kinds: angel, demon, devtail, butterfly, foxtails, peacock.
   Used by: game/character/cosmetics.js. Test: tools/cosmetic-items-smoke.js (every cape builds and looks different), see them with tools/model-preview.js --looks '[{"cape":"angelwings"}]'. */
const COSB_MAT=cosCapeMat;
// a feather: an elongated blob from the origin up (+y), then bent by `fan` radians about z and `back` about x
function cosbFeather(len,wid,col,fan,back,tip){ const g=csph(1,8,6).scale(wid,len*0.5,wid*0.22).translate(0,len*0.5,0).rotateZ(fan).rotateX(back);
  return pc(g,(x,y,z,c)=>{ c.set(col); if(tip&&y>len*0.7) c.lerp(_cA.set(tip),0.55); c.multiplyScalar(0.88+0.14*Math.sin(y*40)); }); }
// a flat membrane fanned from the origin over the points `tips` (x out, y up): scalloped between the tips
function cosbMembrane(tips,col,col2){ const pos=[], P=[[0,0],...tips.map(t=>[t[0],t[1]])];
  for(let i=1;i<P.length-1;i++){ const a=P[i], b=P[i+1], m=[(a[0]+b[0])/2*0.82,(a[1]+b[1])/2*0.82]; pos.push(0,0,0,a[0],a[1],0,m[0],m[1],0, 0,0,0,m[0],m[1],0,b[0],b[1],0); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals();
  return pc(g,(x,y,z,c)=>{ const r=Math.hypot(x,y)/0.38; c.set(col).lerp(_cA.set(col2),Math.min(1,r*0.8)); }); }
function cosBuildBack(rig,X,def){
  const D=X.D, sg=X.sg, kind=def.pat.slice(5), col=def.col, tr=def.trim, z0=0.11*D.B+0.03, shy=D.shY-0.03, cheap=(typeof LITE!=='undefined'&&LITE)||(typeof LOW!=='undefined'&&LOW);
  const S=(g,hex)=>pc(g,(x,y,z,c)=>c.set(hex)), hinges=[], root=new THREE.Group(); rig.spine.add(root); rig.anims=rig.anims||[];
  const mk=(parts,pos)=>{ const h=new THREE.Group(); h.position.set(pos[0],pos[1],pos[2]); const m=new THREE.Mesh(merge(parts),COSB_MAT); m.castShadow=false; h.add(m); root.add(h); return h; };
  if(kind==='angel'){
    for(const sd of [-1,1]){ const P=[]; const rows=[[9,0.2,0.05],[8,0.17,0.07],[7,0.14,0.09]];
      for(let r=0;r<3;r++) for(let i=0;i<rows[r][0];i++){ const f=i/(rows[r][0]-1); P.push(cosbFeather(rows[r][1]+0.16*(1-Math.abs(f-0.45)*0.9)+(r?0:0.06),0.036-0.004*r,r===2?tr:col,-sd*(0.35+f*1.5),-0.28+r*0.03,r===0?tr:0)); }
      P.push(S(csph(0.022,sg(8),sg(6)).scale(1,1.5,0.7),tr));
      const h=mk(P,[sd*0.04,shy,z0]); h.userData.sd=sd; hinges.push(h); }
    rig.anims.push((t,dt,mv)=>{ for(const h of hinges){ const f=Math.sin(t*(1.6+mv*3))*(0.12+mv*0.14); h.rotation.y=h.userData.sd*(0.38+f); h.rotation.z=h.userData.sd*-0.06; } });
  } else if(kind==='demon'){
    for(const sd of [-1,1]){ const tips=[[0.1,0.3],[0.28,0.34],[0.4,0.18],[0.38,-0.02],[0.24,-0.12]].map(p=>[p[0]*sd,p[1]]);
      const P=[cosbMembrane(tips,col,tr)]; for(const t of tips) P.push(S(sweepTube([[0,0,0],[t[0]*0.5,t[1]*0.6+0.02,0.004],[t[0],t[1],0]],[0.009,0.007,0.003],5,{cap:'point',rings:6}),0x2a1418));
      P.push(S(sweepTube([[0,0,0],[sd*0.1,0.16,0],[sd*0.2,0.3,0]],[0.013,0.009,0.005],5,{cap:'point',rings:6}),0x2a1418));
      const h=mk(P,[sd*0.04,shy,z0]); h.userData.sd=sd; hinges.push(h); }
    rig.anims.push((t,dt,mv)=>{ for(const h of hinges){ const f=Math.sin(t*(1.4+mv*3))*(0.1+mv*0.14); h.rotation.y=h.userData.sd*(0.5+f); h.rotation.z=h.userData.sd*(-0.1+f*0.3); } });
  } else if(kind==='butterfly'){
    for(const sd of [-1,1]) for(const low of [0,1]){
      const sh=new THREE.Shape(); if(!low){ sh.moveTo(0,0); sh.bezierCurveTo(0.08,0.2,0.3,0.34,0.4,0.2); sh.bezierCurveTo(0.44,0.08,0.24,-0.02,0,0); } else { sh.moveTo(0,0); sh.bezierCurveTo(0.2,-0.02,0.34,-0.1,0.26,-0.22); sh.bezierCurveTo(0.16,-0.3,0.04,-0.14,0,0); }
      const g=new THREE.ShapeGeometry(sh,8); if(sd<0) g.scale(-1,1,1);
      const P=[pc(g,(x,y,z,c)=>{ const r=Math.hypot(x,y-(low?-0.1:0.12))/0.28; c.set(col).lerp(_cA.set(tr),Math.min(1,r*0.9)); if(Math.abs(Math.hypot(x*sd,y-(low?-0.1:0.14))-0.07)<0.018) c.set(0xffffff); })];
      const h=mk(P,[sd*0.03,shy-0.02,z0]); h.userData.sd=sd; hinges.push(h); }
    rig.anims.push((t,dt,mv)=>{ for(const h of hinges){ const f=Math.sin(t*(2.6+mv*4)); h.rotation.y=h.userData.sd*(0.45+f*0.3); } });
  } else if(kind==='devtail'||kind==='foxtails'){
    const tails=kind==='foxtails'?[[-0.05,0.0,-0.7],[0.0,0.0,0.0],[0.05,0.0,0.7]]:[[0,0,0]], fox=kind==='foxtails';
    for(const tl of tails){ const sp=tl[2];
      const P=fox?[[0,0,0],[sp*0.08,0.06,0.1],[sp*0.2,0.2,0.2],[sp*0.3,0.36,0.22],[sp*0.34,0.5,0.16]]:[[0,0,0],[0,-0.05,0.1],[0.05,-0.18,0.16],[-0.03,-0.3,0.14],[0.02,-0.4,0.06]];
      const rad=fox?[0.022,0.045,0.06,0.04,0.004]:[0.017,0.015,0.012,0.009,0.005], parts=[pc(sweepTube(P,rad,sg(9),{cap:'point',rings:sg(14)}),(x,y,z,c)=>{ c.set(col); if(fox&&y>0.38) c.set(tr); })];
      if(!fox){ const e=P[4]; parts.push(S(new THREE.ConeGeometry(0.03,0.06,3).rotateZ(Math.PI).scale(1.4,1,0.3).translate(e[0],e[1]-0.05,e[2]),tr),S(new THREE.ConeGeometry(0.03,0.05,3).scale(1.4,1,0.3).translate(e[0],e[1]-0.01,e[2]),tr)); }
      const h=mk(parts,[tl[0],fox?0.02:0.01,z0-0.02]); h.userData.k=sp; hinges.push(h); }
    rig.anims.push((t,dt,mv)=>{ for(const h of hinges){ const k=h.userData.k||0; h.rotation.z=Math.sin(t*1.3+k)*(0.08+mv*0.1)+k*0.15; h.rotation.x=0.15+Math.sin(t*1.7+k)*0.05+mv*0.2; } });
  } else if(kind==='lute'||kind==='blades'||kind==='banner'||kind==='shell'||kind==='lantern'){
    // made back pieces: things carried on the back. zb is the back's surface at mid-back (the shoulder blades and the seat are the body's own: torsoSize), ym that height
    const zb=Math.max(torsoSize(X,D,0.34).rzBack,torsoSize(X,D,0.44).rzBack)+0.012, ym=0.34*D.TK, dk=new THREE.Color(col).multiplyScalar(0.6).getHex();
    const tilt=(g,a,cx,cy)=>g.translate(-cx,-cy,0).rotateZ(a).translate(cx,cy,0);
    if(kind==='lute'){
      const P=[pc(csph(0.09,sg(14),sg(10)).scale(1,1.22,0.5),(x,y,z,c)=>{ c.set(col).multiplyScalar(0.82+0.18*Math.abs(Math.sin(Math.atan2(x,y)*5))); }),   // the ribbed bowl
        S(new THREE.CylinderGeometry(0.074,0.074,0.006,sg(18)).rotateX(Math.PI/2).scale(1,1.2,1).translate(0,0,0.04),tr),S(new THREE.CylinderGeometry(0.024,0.024,0.008,sg(12)).rotateX(Math.PI/2).translate(0,0.02,0.042),dk),   // the soundboard and its rose
        S(vbox(0.03,0.26,0.016,0,0.22,0.03),dk),S(vbox(0.04,0.07,0.016,0,0.37,0.018).rotateX(-0.0),col),S(vbox(0.05,0.008,0.012,0,-0.06,0.046),dk)];   // neck, pegbox, bridge
      for(const sx of [-1,1]) for(let i=0;i<2;i++) P.push(S(cyl(0.005,0.005,0.03,5).rotateZ(Math.PI/2).translate(sx*0.03,0.35+i*0.03,0.018),tr));   // pegs
      for(let i=0;i<4;i++) P.push(S(vbox(0.0016,0.4,0.0016,-0.009+i*0.006,0.14,0.047),0xe8e4dc));   // strings
      mk(P.map(g=>tilt(g,-0.6,0,0)),[0.02,ym-0.02,zb+0.012]);
      mk([pc(gfitRibbon(X,D,[[-0.12,0.5],[-0.02,0.36],[0.1,0.2]],0.022,{lift:0.006,th:0.004}),(x,y,z,c)=>c.set(dk))],[0,0,0]);   // the strap across the chest
    } else if(kind==='blades'){
      const P=[]; for(const sd of [-1,1]){ const B=[S(vbox(0.034,0.5,0.008,0,-0.16,0),tr),S(new THREE.ConeGeometry(0.017,0.06,4).rotateX(Math.PI).translate(0,-0.44,0).scale(1,1,0.3),tr),S(vbox(0.13,0.022,0.026,0,0.1,0),col),S(cyl(0.013,0.013,0.13,6).translate(0,0.175,0),dk),S(csph(0.02,sg(8),sg(6)).translate(0,0.25,0),col)];
        for(const g of B) P.push(tilt(g,sd*0.62,0,0).translate(0,0,sd*0.012)); }
      mk(P,[0,ym+0.04,zb+0.012]);
      mk([pc(gfitRibbon(X,D,[[-0.12,0.5],[0,0.36],[0.12,0.5]],0.02,{lift:0.006,th:0.004}),(x,y,z,c)=>c.set(dk))],[0,0,0]);   // the harness' chest strap
    } else if(kind==='banner'){
      const top=D.shY+0.62, fw=0.24, fh=0.36;
      mk([S(cyl(0.009,0.011,top-ym+0.2,6).translate(0,(top+ym-0.2)/2,zb+0.02),dk),S(csph(0.018,sg(8),sg(6)).translate(0,top+0.01,zb+0.02),tr),S(cyl(0.006,0.006,fw+0.03,5).rotateZ(Math.PI/2).translate(0,top-0.03,zb+0.02),dk),
        S(vbox(0.07,0.1,0.03,0,ym-0.1,zb+0.012),dk)],[0,0,0]);   // pole, finial, cross bar, the socket on the belt
      const fg=new THREE.PlaneGeometry(fw,fh,cheap?2:4,cheap?3:6).translate(0,-fh/2,0);
      const flag=mk([pc(fg,(x,y,z,c)=>{ c.set(col); if(Math.abs(x)>fw/2-0.022||y<-fh+0.03) c.set(tr); if(Math.hypot(x,y+fh*0.42)<0.06) c.set(tr); if(Math.hypot(x,y+fh*0.42)<0.036) c.set(dk); c.multiplyScalar(0.9+0.1*Math.sin(y*40)); })],[0,top-0.03,zb+0.024]);
      rig.anims.push((t,dt,mv)=>{ flag.rotation.x=0.06+Math.sin(t*2.2)*0.05+mv*0.3; flag.rotation.y=Math.sin(t*1.4)*0.1*(1+mv); });
    } else if(kind==='shell'){
      mk([pc(csph(0.2,sg(18),sg(12)).scale(0.95,1.18,0.42),(x,y,z,c)=>{ const u=x*17, v=y*15+(Math.round(u)&1)*0.5, e=Math.max(Math.abs(u-Math.round(u)),Math.abs(v-Math.round(v))); c.set(e>0.4?dk:col).multiplyScalar(0.85+0.3*clamp(z/0.08)); if(z<0.012) c.set(tr); }),   // plates, dark seams, a pale rim
        S(gmRingAt([0,0,0.004],[0,0,1],0.19,0.014,sg(8)).scale(1,1.2,1),tr)],[0,ym,zb-0.004]);
      for(const sd of [-1,1]) mk([pc(gfitRibbon(X,D,[[sd*0.09,0.53],[sd*0.1,0.4],[sd*0.11,0.26]],0.02,{lift:0.006,th:0.004}),(x,y,z,c)=>c.set(dk))],[0,0,0]);   // shoulder straps
    } else {
      const tipY=D.shY+0.5, tip=[0.21,tipY-0.04,-0.05];   // the hook ends beside the head, so the lantern hangs clear of the face
      mk([S(sweepTube([[0.07,ym-0.18,zb+0.02],[0.07,D.shY+0.1,zb+0.03],[0.07,tipY-0.06,zb-0.02],[0.12,tipY+0.01,zb-0.1],tip],[0.011,0.01,0.009,0.008,0.007],sg(7),{cap:'round',rings:sg(14)}),col),S(vbox(0.06,0.09,0.03,0.07,ym-0.12,zb+0.012),dk)],[0,0,0]);
      const lan=mk([S(cyl(0.0025,0.0025,0.07,4).translate(0,-0.035,0),dk),S(new THREE.ConeGeometry(0.045,0.035,6).translate(0,-0.08,0),col),pc(cyl(0.034,0.034,0.075,6).translate(0,-0.135,0),(x,y,z,c)=>c.set(tr).multiplyScalar(1.25)),S(cyl(0.04,0.04,0.012,6).translate(0,-0.178,0),col)].concat([0,1,2,3,4,5].map(i=>S(cyl(0.0035,0.0035,0.08,4).translate(Math.sin(i*TAU/6)*0.036,-0.135,Math.cos(i*TAU/6)*0.036),col))),tip);
      rig.anims.push((t,dt,mv)=>{ lan.rotation.x=Math.sin(t*2.1)*(0.06+mv*0.22); lan.rotation.z=Math.sin(t*1.6+1)*(0.04+mv*0.1); });
    }
  } else if(kind==='peacock'){
    const P=[]; const n=cheap?7:11;
    for(let i=0;i<n;i++){ const f=i/(n-1)*2-1, fan=f*1.05, len=0.5-0.1*Math.abs(f);
      P.push(cosbFeather(len,0.028,col,fan,-0.35,0)); P.push(S(csph(0.034,sg(8),sg(6)).scale(0.9,1.3,0.4).translate(0,len,0).rotateZ(fan).rotateX(-0.35),tr),S(csph(0.017,sg(8),sg(6)).scale(0.9,1.3,0.5).translate(0,len+0.002,0.004).rotateZ(fan).rotateX(-0.35),0x1a3a8a)); }
    const h=mk(P,[0,shy-0.12,z0]); hinges.push(h);
    rig.anims.push((t,dt,mv)=>{ h.rotation.x=Math.sin(t*1.5)*0.04+mv*0.12; h.rotation.z=Math.sin(t*0.9)*0.03; });
  }
}
