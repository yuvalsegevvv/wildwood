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
      // the wing as rings scaled from the root out to its outline (the shape is star-shaped from the root), so the veins, the dark border with its white dots and the eye ring are painted on a real grid
      const B=sh.getPoints(cheap?10:22), NR=cheap?4:9, pos=[], idx=[], FK=new Map();
      for(let r=0;r<=NR;r++){ const f=r/NR; for(let i=0;i<B.length;i++){ pos.push(B[i].x*f*sd,B[i].y*f,0.004*Math.sin(f*Math.PI)); FK.set((B[i].x*f*sd).toFixed(4)+','+(B[i].y*f).toFixed(4),f); } }
      for(let r=0;r<NR;r++) for(let i=0;i<B.length-1;i++){ const a=r*B.length+i, b=a+1, c2=a+B.length, d=c2+1; idx.push(a,c2,b,b,c2,d); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
      const gn=g.toNonIndexed(), ex=low?[0.13,-0.12]:[0.24,0.17];
      const P=[pc(gn,(x,y,z,c)=>{ const ax=x*sd, ang=Math.atan2(y,ax), f=FK.get(x.toFixed(4)+','+y.toFixed(4))||0;
        c.set(col).lerp(_cA.set(tr),Math.min(1,f*0.95));
        if(f>0.86){ c.set(0x2a1a2a); if(f<0.95&&((ang*30)%1+1)%1<0.3) c.set(0xffffff); }   // the dark border with a row of white dots
        else if(Math.abs(((ang*7)%1+1)%1-0.5)<0.04&&f>0.15) c.multiplyScalar(0.55);   // veins fanning from the root
        const e=Math.hypot(ax-ex[0],y-ex[1]); if(e<0.045){ c.set(e<0.02?0x1a1a2a:e<0.032?tr:0xffffff); } })];
      const h=mk(P,[sd*0.03,shy-0.02,z0]); h.userData.sd=sd; hinges.push(h); }
    { const bd=[]; for(let i=0;i<4;i++) bd.push(S(csph(0.022-0.003*i,sg(8),sg(6)).scale(1,1.2,1).translate(0,shy+0.02-i*0.04,z0+0.012),i%2?0x2a2228:0x3a3038));   // the butterfly's body between the wings, two curled antennae
      for(const sd of [-1,1]) bd.push(S(sweepTube([[sd*0.006,shy+0.04,z0+0.014],[sd*0.03,shy+0.1,z0+0.02],[sd*0.05,shy+0.12,z0+0.016]],[0.0025,0.002,0.0015],4,{cap:'round',rings:6}),0x2a2228),S(csph(0.007,5,4).translate(sd*0.05,shy+0.12,z0+0.016),0x2a2228));
      const m=new THREE.Mesh(merge(bd),COSB_MAT); root.add(m); }
    rig.anims.push((t,dt,mv)=>{ for(const h of hinges){ const f=Math.sin(t*(2.6+mv*4)); h.rotation.y=h.userData.sd*(0.45+f*0.3); } });
  } else if(kind==='devtail'||kind==='foxtails'){
    const tails=kind==='foxtails'?[[-0.05,0.0,-0.7],[0.0,0.0,0.0],[0.05,0.0,0.7]]:[[0,0,0]], fox=kind==='foxtails';
    for(const tl of tails){ const sp=tl[2];
      const P=fox?[[0,0,0],[sp*0.08,0.06,0.1],[sp*0.2,0.2,0.2],[sp*0.3,0.36,0.22],[sp*0.34,0.5,0.16]]:[[0,0,0],[0,-0.04,0.09],[0.06,-0.14,0.17],[0.09,-0.27,0.19],[0.02,-0.38,0.16],[-0.07,-0.44,0.17],[-0.1,-0.5,0.22],[-0.08,-0.54,0.27]];   // the devil's tail: an S that curls out and up at the end
      const rad=fox?[0.022,0.045,0.06,0.04,0.004]:[0.026,0.021,0.018,0.015,0.013,0.011,0.009,0.007], parts=[pc(sweepTube(P,rad,sg(9),{cap:fox?'point':'round',rings:sg(fox?14:22)}),(x,y,z,c)=>{ c.set(col); if(fox&&y>0.38) c.set(tr); if(!fox){ c.lerp(_cA.set(tr),Math.min(1,Math.max(0,(-y-0.3)/0.25))); c.multiplyScalar(0.9+0.1*Math.sin(y*120)); } })];
      if(!fox){ const e=P[P.length-1], sh=new THREE.Shape(); sh.moveTo(0,-0.07); sh.bezierCurveTo(-0.025,-0.04,-0.06,-0.01,-0.045,0.02); sh.bezierCurveTo(-0.03,0.04,-0.01,0.03,0,0.012); sh.bezierCurveTo(0.01,0.03,0.03,0.04,0.045,0.02); sh.bezierCurveTo(0.06,-0.01,0.025,-0.04,0,-0.07);   // the spade: a heart turned point-out, thick at its spine
        const sp2=new THREE.ExtrudeGeometry(sh,{depth:0.012,bevelEnabled:true,bevelThickness:0.004,bevelSize:0.004,bevelSegments:1,curveSegments:sg(6)}).translate(0,0,-0.006).rotateZ(Math.PI*0.8).rotateY(0.5).translate(e[0]-0.03,e[1]+0.04,e[2]+0.035);
        parts.push(pc(sp2,(x,y,z,c)=>{ c.set(tr); c.multiplyScalar(0.85+0.2*Math.abs(Math.sin((x+y)*90))); }));
        parts.push(S(gmRingAt(P[1],[0,-0.4,1],0.024,0.005,6),0x2a2a2e),S(csph(0.007,5,4).translate(P[1][0],P[1][1]-0.024,P[1][2]-0.004),0xc9a13a)); }   // a dark band with a gold bead near the root
      const h=mk(parts,[tl[0],fox?0.02:0.01,z0-0.02]); h.userData.k=sp; hinges.push(h); }
    rig.anims.push((t,dt,mv)=>{ for(const h of hinges){ const k=h.userData.k||0; h.rotation.z=Math.sin(t*1.3+k)*(0.08+mv*0.1)+k*0.15; h.rotation.x=0.15+Math.sin(t*1.7+k)*0.05+mv*0.2; } });
  } else if(kind==='peacock'){
    const P=[]; const n=cheap?7:11;
    for(let i=0;i<n;i++){ const f=i/(n-1)*2-1, fan=f*1.05, len=0.5-0.1*Math.abs(f);
      P.push(cosbFeather(len,0.028,col,fan,-0.35,0)); P.push(S(csph(0.034,sg(8),sg(6)).scale(0.9,1.3,0.4).translate(0,len,0).rotateZ(fan).rotateX(-0.35),tr),S(csph(0.017,sg(8),sg(6)).scale(0.9,1.3,0.5).translate(0,len+0.002,0.004).rotateZ(fan).rotateX(-0.35),0x1a3a8a)); }
    const h=mk(P,[0,shy-0.12,z0]); hinges.push(h);
    rig.anims.push((t,dt,mv)=>{ h.rotation.x=Math.sin(t*1.5)*0.04+mv*0.12; h.rotation.z=Math.sin(t*0.9)*0.03; });
  }
}
