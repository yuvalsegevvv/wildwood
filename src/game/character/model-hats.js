//@ The base hats (version 3.1): ranger, beanie, cap, kasa and helm redrawn with the detail of the signature sets, and the new bandana, hood, circlet, wizard and straw hats
/* Called by buildHair (model-hair.js) after the hair: htBase(X, F, parts) pushes the painted geometries of the look's base hat (look.hat) in the head's frame (origin at the head's centre, the skull's radius is
   0.105 and its top 0.105 * F.fs[1], the face looks along -z). A hat is its own shape, a band, a trim and at least two colours; look.hatColor is the main cloth, the trim colours are the hat's own.
   An outfit's hat item (kit.head) is built by buildHair after this and replaces it (look.hat is then 'outfit'). Ids: HT_HATS (the editor's Hat row lists them, with the names).
   owns: HT_HATS, htBase, htBrim.   used by: model-hair.js, ui/character-editor.js.   test: tools/character-smoke.js, tools/cosmetic-items-smoke.js */
const HT_HATS=[['none','No hat'],['ranger','Ranger hat','A wide felt brim, a dented crown, a band with a buckle and a feather.'],['beanie','Beanie','Ribbed knit with a folded cuff and a fluffy pompom.'],['cap','Cap','Six panels, a button, a curved bill and a back strap.'],
  ['kasa','Kasa hat','A woven conical straw hat with a lacquered knob and a chin cord.'],['bandana','Bandana','A knotted cloth with a printed pattern and two tails.'],['hood','Hood','A deep cowl with a piped edge that falls to a point down the back.'],
  ['circlet','Circlet','A slim gold band with a gem and two small leaves.'],['wizard','Wizard hat','A tall bent cone with a wide brim, a buckled band and stars.'],['straw','Straw hat','A round woven hat with a wide brim and a ribbon.']];
// a ring of brim (inner radius rIn, outer rOut, at height y0) as two sheets, the top and the underside: the sides lift by `side` (x^2), the front dips by `dip`, the rim curls up by `rim`; fn(x,y,z,c) paints a sheet
function htBrim(sg,rIn,rOut,y0,o,fn,fnUnder){
  const mk=up=>{ const g=new THREE.RingGeometry(rIn,rOut,sg(32),3).rotateX(up?-Math.PI/2:Math.PI/2), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), r=Math.hypot(x,z)/rOut; p.setY(i,y0+(o.side||0)*(x/rOut)*(x/rOut)*r-(o.dip||0)*Math.max(0,-z/rOut)*r+(o.rim||0)*Math.pow(r,6)+(up?0:-0.004)); }
    return smoothN(g); };
  return [pc(mk(true),fn),pc(mk(false),fnUnder||((x,y,z,c)=>{ fn(x,y,z,c); c.multiplyScalar(0.72); }))];
}
const htRing=(sg,y,r,t,hex,tilt)=>solid(gmRingAt([0,y,0],[0,1,tilt||0],r,t,sg(6)),hex);
function htBase(X,F,parts){
  const {L,sg}=X, {sculpt,fs}=F, hc=new THREE.Color(L.hatColor), scl=g=>g.scale(fs[0],fs[1],1), top=0.105*fs[1], fr=x=>x-Math.floor(x);
  const col=(m)=>c=>c.copy(hc).multiplyScalar(m), id=L.hat;
  const tone=(c,m)=>c.copy(hc).multiplyScalar(m), lerpHex=(c,h,k)=>c.lerp(ofCol(h),k);
  if(id==='ranger'){
    parts.push(...htBrim(sg,0.108,0.215,0.074,{side:0.05,dip:0.012,rim:0.012},(x,y,z,c)=>{ tone(c,0.95+0.1*h3(Math.round(x*50),0,Math.round(z*50))); if(Math.hypot(x,z)>0.205) tone(c,0.7); }));   // the felt brim, curled up at the sides and dipping in front
    const crown=new THREE.LatheGeometry([[0.119,0.075],[0.113,0.115],[0.098,0.165],[0.082,0.197],[0.05,0.203],[0.0001,0.2]].map(p=>new THREE.Vector2(p[0],p[1])),sg(30)), q=crown.attributes.position;
    for(let i=0;i<q.count;i++){ const x=q.getX(i), y=q.getY(i); if(y>0.19) q.setY(i,y-0.016*Math.exp(-Math.pow(x/0.032,2))); const f=1+0.06*Math.exp(-Math.pow((y-0.18)/0.03,2))*Math.sign(q.getZ(i)||1)*0; q.setX(i,x*f); }   // the dent along the top
    parts.push(pc(smoothN(crown),(x,y,z,c)=>tone(c,0.92+0.12*Math.min(1,(y-0.07)*6))));
    parts.push(pc(new THREE.CylinderGeometry(0.1215,0.1215,0.027,sg(30),1,true).translate(0,0.097,0),c=>tone(c,0.5)),htRing(sg,0.11,0.1195,0.0035,0xc9a86a),htRing(sg,0.084,0.1215,0.0035,0xc9a86a));   // the band, with piping
    parts.push(pc(vbox(0.03,0.026,0.008,0,0.097,-0.121),c=>c.set(0xc9a13a)),pc(vbox(0.017,0.014,0.01,0,0.097,-0.1235),c=>c.set(0x2a2a2a)));   // the buckle
    parts.push(pc(ofRibbon([[0.1,0.1,-0.06],[0.13,0.14,-0.04],[0.15,0.2,0.0],[0.12,0.27,0.07]],u=>0.034*(1-0.6*u),{up:[0,1,0.2],seg:sg(10),th:0.003}),(x,y,z,c)=>{ c.set(0x8aa05a); if(fr(y*30)<0.14) c.set(0xe9dfc4); }));   // a feather
  } else if(id==='beanie'){
    parts.push(pc(scl(sculpt(shell(0.123,0,0.46*Math.PI,0,0.415,sg(34),sg(16)),false)),(x,y,z,c)=>{ tone(c,0.94+0.1*(fr(Math.atan2(x,z)/TAU*20)<0.5?1:0)); }));   // the knit, in ribs
    parts.push(pc(scl(sculpt(shell(0.129,0.355*Math.PI,0.11*Math.PI,0,0.415,sg(34),sg(7)),false)),(x,y,z,c)=>{ tone(c,0.78+0.12*(fr(Math.atan2(x,z)/TAU*26)<0.5?1:0)); }));   // the folded cuff, with finer ribs
    parts.push(pc(csph(0.03,sg(12),sg(10)).translate(0,0.126*fs[1]+0.012,0.052),c=>c.set(0xf2eee4)));
    const rg=mulberry32(5); for(let i=0;i<14;i++){ const a=rg()*TAU, b=rg()*Math.PI; parts.push(solid(csph(0.011,sg(6),sg(5)).translate(Math.sin(a)*Math.sin(b)*0.036,0.126*fs[1]+0.012+Math.cos(b)*0.036,0.052+Math.cos(a)*Math.sin(b)*0.036),i%3?0xf7f4ec:0xdcd6c8)); }   // the fluff of the pompom
  } else if(id==='helm'){
    parts.push(pc(scl(sculpt(shell(0.128,0,0.475*Math.PI,0,0.4,sg(34),sg(16)),false)),(x,y,z,c)=>tone(c,0.88+0.18*clamp(y*6))));
    parts.push(pc(scl(sculpt(shell(0.133,0.385*Math.PI,0.09*Math.PI,0,0.4,sg(34),sg(6)),false)),c=>tone(c,0.7)));
    parts.push(pc(vbox(0.018,0.062,0.016,0,0.03,-0.116).rotateX(0.14),c=>tone(c,0.8)));
    for(let i=0;i<11;i++){ const a=(i/11-0.5)*2.3; parts.push(solid(csph(0.0045,sg(6),sg(5)).translate(Math.sin(a)*0.1325*fs[0],0.043*fs[1],-Math.cos(a)*0.1325),0xd8d4c8)); }   // rivets along the brow band
    if(L.plume) parts.push(pc(new THREE.CylinderGeometry(0.13,0.13,0.024,sg(24),1,false,Math.PI,Math.PI).rotateZ(-Math.PI/2).scale(1,0.8,1.05).translate(0,0.03,0).rotateX(0.4).translate(0,0.02*fs[1],0.0),(x,y,z,c)=>c.set(L.plume).multiplyScalar(0.8+0.35*clamp((y-0.1)*8))));
  } else if(id==='kasa'){
    const g=new THREE.ConeGeometry(0.31,0.16,sg(40),6,true).translate(0,0.14*fs[1],0), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const r=Math.hypot(p.getX(i),p.getZ(i)); p.setY(i,p.getY(i)-0.012*Math.pow(r/0.31,2)); }   // the brim sags a little
    parts.push(pc(smoothN(g),(x,y,z,c)=>{ tone(c,0.86+0.2*h3(Math.round(Math.atan2(z,x)*10),0,5)); const r=Math.hypot(x,z); if(fr(r*42)<0.14) tone(c,0.68); }));   // woven rings and radial strands
    parts.push(pc(new THREE.CylinderGeometry(0.103,0.112,0.05,sg(22)).translate(0,0.088*fs[1],0),(x,y,z,c)=>tone(c,0.55+0.1*fr(y*40))),pc(csph(0.016,sg(8),sg(6)).translate(0,0.22*fs[1],0),c=>c.set(0x2a1f18)),htRing(sg,0.075*fs[1]+0.025,0.108,0.0035,0x2a1f18));   // the head-ring inside, a lacquered knob and a band
    for(const sd of [-1,1]) parts.push(solid(sweepTube([[sd*0.125,0.09,-0.02],[sd*0.115,-0.03,-0.04],[sd*0.06,-0.13,-0.085],[0,-0.138,-0.1]],[0.0028,0.0028,0.0028,0.0028],4,{cap:'round',rings:8}),0x7a1f1f));   // the chin cord
  } else if(id==='cap'){
    parts.push(pc(scl(sculpt(shell(0.119,0,0.435*Math.PI,0,0.33,sg(34),sg(16)),false)),(x,y,z,c)=>{ tone(c,1); const a=((Math.atan2(x,z)/TAU*6)%1+1)%1; if(a<0.035||a>0.965) tone(c,0.72); }));   // six panels with seams
    parts.push(pc(csph(0.011,sg(8),sg(6)).translate(0,0.1195*fs[1]-0.004,0.0),c=>tone(c,0.8)));   // the button
    { const mk=up=>{ const g=new THREE.RingGeometry(0.0001,0.105,sg(24),4,0,Math.PI).rotateX(up?-Math.PI/2:Math.PI/2), p=g.attributes.position;
        for(let k=0;k<p.count;k++){ const r=Math.hypot(p.getX(k),p.getZ(k))/0.105; p.setY(k,0.056*fs[1]-0.05*r*r+(up?0:-0.004)); } g.translate(0,0,-0.075); return smoothN(g); };
      parts.push(pc(mk(true),(x,y,z,c)=>{ tone(c,0.85); if(z<-0.172) c.set(0xf0ede4).multiplyScalar(0.9); }),pc(mk(false),c=>tone(c,0.6))); }   // the curved bill, with a light stitched edge
    parts.push(pc(vbox(0.03,0.013,0.008,0,0.05*fs[1],0.118),c=>c.set(0xd8d4c8)),pc(vbox(0.02,0.005,0.009,0,0.05*fs[1],0.1185),c=>c.set(0x2a2a2a)));   // the back strap's adjuster
  } else if(id==='bandana'){
    parts.push(pc(scl(sculpt(shell(0.119,0,0.43*Math.PI,0,0.3,sg(34),sg(12)),false)),(x,y,z,c)=>{ tone(c,1); const d=h3(Math.round(x*70),Math.round(y*70),Math.round(z*70)); if(d>0.84) lerpHex(c,0xf6f0e0,0.9); }));   // printed dots
    parts.push(pc(scl(sculpt(shell(0.123,0.36*Math.PI,0.07*Math.PI,0,0.3,sg(34),sg(5)),false)),c=>tone(c,0.78)));   // the folded edge
    parts.push(solid(csph(0.02,sg(8),sg(6)).translate(0,0.015,0.122),hc.getHex()),...[-1,1].map(sd=>pc(ofRibbon([[sd*0.01,0.01,0.125],[sd*0.04,-0.05,0.14],[sd*0.06,-0.12,0.14],[sd*0.08,-0.17,0.12]],u=>0.034*(1+0.4*u),{up:[0,0.2,1],seg:sg(10),th:0.003}),(x,y,z,c)=>{ tone(c,0.95); if(fr(y*22)<0.14) lerpHex(c,0xf6f0e0,0.8); })));   // the knot and two tails
  } else if(id==='hood'){
    parts.push(pc(scl(sculpt(shell(0.14,0,0.585*Math.PI,0,0.55,sg(36),sg(18)),false)),(x,y,z,c)=>{ tone(c,0.9+0.1*clamp(y*6)); }));
    parts.push(pc(scl(sculpt(shell(0.144,0.5*Math.PI,0.085*Math.PI,0,0.55,sg(36),sg(7)),false)),c=>tone(c,0.65)));   // the piped edge round the face
    const rings=[{y:0.0,rx:0.125,rz:0.13,zc:0.04},{y:-0.07,rx:0.12,rz:0.12,zc:0.06},{y:-0.15,rx:0.085,rz:0.07,zc:0.08},{y:-0.24,rx:0.03,rz:0.025,zc:0.09}];
    parts.push(pc(ofLoft(rings,sg(26),-1.9,1.9),(x,y,z,c)=>tone(c,0.82+0.2*(1+y*4))));   // the point that falls down the back
    parts.push(solid(gmRingAt([0,-0.255,0.092],[0,1,0.2],0.016,0.007,sg(6)),0x7a5a3a));   // a tassel
  } else if(id==='circlet'){
    parts.push(solid(gmRingAt([0,0.045*fs[1],-0.006],[0,1,0.18],0.114,0.0055,sg(8)),0xd8b84a),solid(gmRingAt([0,0.052*fs[1],-0.006],[0,1,0.18],0.113,0.0022,sg(6)),0xfff0b0));
    parts.push(solid(new THREE.OctahedronGeometry(0.016,0).scale(0.8,1.3,0.7).translate(0,0.062*fs[1],-0.117),L.hatColor===0xe8e4dc?0xd23a4a:0x2f9a7a),solid(new THREE.ConeGeometry(0.012,0.034,4).translate(0,0.086*fs[1],-0.113),0xd8b84a));
    for(const sd of [-1,1]) parts.push(pc(ofRibbon([[sd*0.04,0.054*fs[1],-0.113],[sd*0.075,0.062*fs[1],-0.1],[sd*0.1,0.078*fs[1],-0.07]],u=>0.016*(1-0.5*u),{up:[0,1,0],seg:sg(6),th:0.003}),(x,y,z,c)=>c.set(0xd8b84a)));   // two small leaves
  } else if(id==='wizard'){
    parts.push(...htBrim(sg,0.1,0.2,0.07,{side:0.03,dip:-0.01,rim:0.02},(x,y,z,c)=>{ tone(c,0.95); if(Math.hypot(x,z)>0.19) tone(c,0.75); }));
    const cone=sweepTube([[0,0.065,0],[0,0.15,0.0],[0,0.25,0.012],[0,0.34,0.05],[0,0.38,0.115]],[0.118,0.093,0.06,0.03,0.006],sg(24),{cap:'point',rings:sg(16)});
    parts.push(pc(cone,(x,y,z,c)=>{ tone(c,0.9+0.12*clamp((y-0.07)*4)); const d=h3(Math.round(x*60),Math.round(y*60),Math.round(z*60)); if(d>0.93) c.set(0xf4e08a); }));   // stars among the folds
    parts.push(pc(new THREE.CylinderGeometry(0.123,0.123,0.03,sg(30),1,true).translate(0,0.092,0),c=>c.set(0x2a2438)),pc(vbox(0.034,0.032,0.008,0,0.092,-0.125),c=>c.set(0xd8b84a)),pc(vbox(0.02,0.018,0.01,0,0.092,-0.1275),c=>c.set(0x2a2438)));
  } else if(id==='straw'){
    const w=(x,y,z,c)=>{ tone(c,0.92); const r=Math.hypot(x,z); if(fr(r*38)<0.2) tone(c,0.74); if(fr(Math.atan2(z,x)/TAU*16)<0.1) tone(c,0.82); };
    parts.push(...htBrim(sg,0.105,0.23,0.072,{side:0.026,dip:0.01,rim:0.01},(x,y,z,c)=>{ tone(c,0.92); const r=Math.hypot(x,z); if(fr(r*38)<0.2) tone(c,0.74); if(r>0.222) tone(c,0.62); }));
    parts.push(pc(scl(sculpt(shell(0.116,0,0.43*Math.PI,0,0.05,sg(34),sg(14)),false)).translate(0,0.056*fs[1],0),w));
    parts.push(pc(new THREE.CylinderGeometry(0.1215,0.1215,0.024,sg(30),1,true).translate(0,0.09,0),c=>c.set(0xb8452e)),pc(ofRibbon([[0.1,0.09,0.07],[0.14,0.05,0.095],[0.17,-0.02,0.09],[0.18,-0.09,0.07]],u=>0.032*(1+0.3*u),{up:[0,1,0.3],seg:sg(10),th:0.003}),(x,y,z,c)=>c.set(0xb8452e)));
  } else htxBuild(X,F,parts,id,hc);   // the crafted hats (model-hats-more.js)
}
