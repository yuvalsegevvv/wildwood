//@ The crafted hats (version 3.2): the horned cap, the laurel wreath and the captain's tricorn, drawn for htBase (model-hats.js) in the head's frame
/* Same frame and helpers as htBase: the head's centre is the origin, the skull's radius 0.105, its top 0.105 * fs[1], the face looks along -z; look.hatColor is the main cloth or metal.
   HTX_HATS lists them for the editor: [id, name, a short line] (the recipes are in shared/cospieces.js CP_RECIPE 'h:<id>').
   owns: HTX_HATS, htxBuild.   used by: model-hats.js (htBase), ui/character-editor.js.   test: tools/cospieces-smoke.js, tools/cosmetic-items-smoke.js */
const HTX_HATS=CP_PIECES.filter(r=>r[0]==='h').map(r=>[r[1],r[2],r[4]]);
function htxBuild(X,F,parts,id,hc){
  const {L,sg}=X, {sculpt,fs}=F, scl=g=>g.scale(fs[0],fs[1],1), tone=(c,m)=>c.copy(hc).multiplyScalar(m), fr=x=>x-Math.floor(x), lerpHex=(c,h,k)=>c.lerp(ofCol(h),k);
  if(id==='viking'){
    // an iron cap with a riveted brow band, a nose guard and two curved horns
    parts.push(pc(scl(sculpt(shell(0.124,0,0.46*Math.PI,0,0.4,sg(34),sg(16)),false)),(x,y,z,c)=>{ tone(c,0.82+0.2*clamp(y*7)); const a=((Math.atan2(x,z)/TAU*8)%1+1)%1; if(a<0.03||a>0.97) tone(c,0.6); }));   // the bowl with eight seams
    parts.push(pc(scl(sculpt(shell(0.13,0.38*Math.PI,0.075*Math.PI,0,0.4,sg(34),sg(6)),false)),c=>tone(c,0.62)));   // the brow band
    for(let i=0;i<13;i++){ const a=(i/12-0.5)*2.5; parts.push(solid(csph(0.0048,sg(6),sg(5)).translate(Math.sin(a)*0.1325*fs[0],0.048*fs[1],-Math.cos(a)*0.1325),0xd8d4c8)); }
    parts.push(pc(vbox(0.016,0.075,0.012,0,0.03,-0.1345).rotateX(0.1),c=>tone(c,0.7)));   // the nose guard
    for(const sd of [-1,1]){
      parts.push(solid(sweepTube([[sd*0.118,0.05*fs[1],0.0],[sd*0.16,0.062*fs[1],0.0],[sd*0.2,0.1*fs[1],-0.004],[sd*0.215,0.16*fs[1],-0.012],[sd*0.2,0.215*fs[1],-0.02]],[0.019,0.0175,0.0135,0.0085,0.0015],sg(8),{cap:'point',rings:sg(16)}),0xe9e0c6));   // the horn
      parts.push(solid(gmRingAt([sd*0.126,0.05*fs[1],0],[1,0.1,0],0.02,0.005,sg(6)),0x8a8a90));   // the iron collar at its root
    }
  } else if(id==='laurel'){
    // a ring of paired leaves round the brow, a few berries and a knot of twig at the back
    const y0=0.052*fs[1], R=0.119, n=sg(26);
    parts.push(solid(gmRingAt([0,y0,-0.004],[0,1,0.12],R*fs[0],0.0034,sg(8)),0x5a4a2a));
    for(let i=0;i<n;i++){ const a=i/n*TAU, side=i%2?1:-1, ca=Math.cos(a), sa=Math.sin(a);
      if(Math.abs(a-Math.PI)<0.16) continue;   // (open at the very back, where the twigs are knotted)
      const lf=csph(1,sg(8),sg(6)).scale(0.016,0.0045,0.034).rotateZ(side*0.5).rotateY(-a+Math.PI/2+side*0.35).translate(sa*R*fs[0]*1.005,y0+side*0.006,-ca*R*0.99);
      parts.push(pc(lf,(x,y,z,c)=>{ tone(c,0.82+0.28*h3(i,0,1)); if(Math.abs(x-sa*R)<0.002) tone(c,0.7); })); }
    for(let i=0;i<6;i++){ const a=(0.18+i*0.32)*Math.PI*(i%2?1:-1)*0.5+Math.PI*(i%2?0.35:-0.35); parts.push(solid(csph(0.0058,sg(6),sg(5)).translate(Math.sin(a)*R*fs[0],y0-0.012,-Math.cos(a)*R),0xc23a3a)); }
    parts.push(solid(sweepTube([[0.01,y0,0.12],[0.022,y0-0.04,0.125],[0.012,y0-0.09,0.12]],[0.004,0.003,0.0015],4,{cap:'round',rings:6}),0x5a4a2a));   // the loose end
  } else if(id==='catphones'){
    // a padded band over the head from cup to cup, a cup with a glowing ring over each ear, and a pointed cat ear on each side of the crown
    const R=0.118, pts=[]; for(let i=0;i<=10;i++){ const a=-1.42+2.84*i/10; pts.push([Math.sin(a)*R*fs[0],Math.cos(a)*R*fs[1]*0.98-0.002,0.01-0.012*Math.cos(a)]); }
    parts.push(pc(sweepTube(pts,[0.0075,0.0085,0.0085,0.0085,0.0085,0.0085,0.0085,0.0085,0.0085,0.0085,0.0075],sg(8),{cap:'round',rings:sg(30)}),(x,y,z,c)=>tone(c,0.9+0.15*clamp(y*5))));
    for(const sd of [-1,1]){
      const cx=sd*(0.106*fs[0]+0.012), cy=-0.004, cz=0.012;
      parts.push(pc(new THREE.CylinderGeometry(0.03,0.03,0.022,sg(20)).rotateZ(Math.PI/2).translate(cx,cy,cz),(x,y,z,c)=>tone(c,0.78)));   // the cup
      parts.push(pc(new THREE.CylinderGeometry(0.0215,0.0215,0.0045,sg(20)).rotateZ(Math.PI/2).translate(cx+sd*0.0125,cy,cz),c=>c.set(0xff7aa8)));   // the glowing ring
      parts.push(pc(new THREE.CylinderGeometry(0.012,0.012,0.0055,sg(14)).rotateZ(Math.PI/2).translate(cx+sd*0.0145,cy,cz),c=>tone(c,0.55)));
      parts.push(pc(sweepTube([[sd*0.118*fs[0]*0.99,0.0,0.01],[cx,cy+0.03,cz],[cx,cy+0.008,cz]],[0.0075,0.0075,0.0075],4,{cap:'round',rings:6}),c=>tone(c,0.72)));   // the yoke
      const a=0.72, bx=Math.sin(a)*R*fs[0], by=Math.cos(a)*R*fs[1]*0.98-0.002;   // where the ear stands on the band
      const ear=new THREE.ConeGeometry(0.04,0.088,4).rotateY(Math.PI/4).scale(1,1,0.6).rotateZ(-sd*0.3).translate(sd*bx,by+0.03,0.01);
      parts.push(pc(ear,(x,y,z,c)=>{ tone(c,0.95); }));
      const inner=new THREE.ConeGeometry(0.026,0.062,4).rotateY(Math.PI/4).scale(1,1,0.35).rotateZ(-sd*0.3).translate(sd*(bx+0.001),by+0.024,0.0);
      parts.push(pc(inner,c=>c.set(0xf0a0b8)));
    }
    parts.push(pc(sweepTube([[-(0.106*fs[0]+0.014),-0.012,0.03],[-(0.1*fs[0]),-0.05,-0.03],[-0.04,-0.075,-0.092],[-0.015,-0.077,-0.1]],[0.0032,0.0032,0.0032,0.0032],4,{cap:'round',rings:8}),c=>tone(c,0.6)),pc(csph(0.0072,sg(8),sg(6)).translate(-0.013,-0.0775,-0.1),c=>c.set(0xff7aa8)));   // a small microphone boom
  } else if(id==='tricorn'){
    // a felt crown and a brim folded up along three sides: the points are at the front and the two back corners
    const rIn=0.108, rOut=0.188, mk=up=>{ const g=new THREE.RingGeometry(rIn,rOut,sg(48),4).rotateX(up?-Math.PI/2:Math.PI/2), p=g.attributes.position;
      for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), r=Math.hypot(x,z), t=clamp((r-rIn)/(rOut-rIn)), th=Math.atan2(x,-z), w=0.5-0.5*Math.cos(3*th);   // w: 0 at a point, 1 along a side
        const k=1+0.22*(1-w)*t, lift=0.058*w*Math.pow(t,1.2)-0.012*(1-w)*t*t;
        p.setXYZ(i,x*k,0.071+lift+(up?0:-0.004),z*k); }
      return smoothN(g); };
    parts.push(pc(mk(true),(x,y,z,c)=>{ tone(c,0.9+0.1*h3(Math.round(x*50),0,Math.round(z*50))); const r=Math.hypot(x,z), th=Math.atan2(x,-z), w=0.5-0.5*Math.cos(3*th); if(r>0.18+0.04*(1-w)) lerpHex(c,0xd8b84a,0.9); }),pc(mk(false),c=>tone(c,0.62)));
    parts.push(pc(scl(sculpt(shell(0.116,0,0.43*Math.PI,0,0.08,sg(34),sg(14)),false)).translate(0,0.05*fs[1],0),(x,y,z,c)=>tone(c,0.88+0.14*clamp((y-0.06)*5))));
    parts.push(pc(new THREE.CylinderGeometry(0.1215,0.1215,0.022,sg(30),1,true).translate(0,0.092,0),c=>c.set(0x2a2438)),solid(csph(0.0095,sg(8),sg(6)).translate(0,0.092,-0.1235),0xd8b84a));   // the band and the brass button at the front
    parts.push(pc(ofRibbon([[0.06,0.11,0.0],[0.1,0.15,0.03],[0.12,0.16,0.08],[0.1,0.14,0.13]],u=>0.034*(1-0.5*u),{up:[0,1,0.4],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(0xf4f0e6).multiplyScalar(0.9+0.12*h3(Math.round(z*90),Math.round(x*90),3)); }));   // the white plume
  }
}
