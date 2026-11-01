//@ Silly hand items (version 3.3): cosmetic things held in the strong hand (look.strongItem: a frying pan, a rubber chicken) and the weak hand (look.weakItem: a pot lid, a rubber duck), crafted at a Lodge
/* A strong-hand item REPLACES the weapon you carry (the sword, bow with its quiver, or staff are not drawn) and a weak-hand item replaces the shield; neither changes a number, the real weapon still fights.
   Strong is the right hand and weak the left unless look.left (Settings > Left-handed) swaps them, and the arm animation follows (character/pose.js). Ids: SILLY.strong.<id> and SILLY.weak.<id>, cospieces slots 'v' (strong) and 'u' (weak).
   Colours: look.strongColor / strongTrim and weakColor / weakTrim (-1 = as designed): `col` is the main colour and `trim` the second, the other colours of a piece are fixed.
   A builder gets (C, T, sg) = the two colours as hex numbers and the segment scaler and returns the parts. STRONG items are built pointing down (-y) from the hand: the grip is around y = -0.1, like the sword in game/combat/weapons.js.
   WEAK items are built like a shield: in the plane x across, y up, z outward (the face is +z), about 0.3 across; sillyDress turns them onto the forearm.
   owns: SILLY, sillyDef, sillyId, sillyDress.   used by: model.js (buildCharacter), combat/weapons.js (weaponsOn skips the real weapon), model-shields.js (shieldDress skips the shield), ui/character-editor.js, ui/character-thumbs.js, shared/cospieces.js (the recipes).   test: tools/silly-smoke.js */
const SILLY_C=(g,hex)=>pc(g,(x,y,z,c)=>c.set(hex));   // one flat colour
const SILLY={
  strong:{
    pan:{name:'Frying Pan',col:0x3b3f45,trim:0x7a4a2c,text:'A cast-iron pan with a wooden handle. It rings when it hits something.',build:(C,T,sg)=>{
      // a cast-iron pan: flared walls with a rolled lip and two pouring spouts, a seasoned cooking face with a sheen, a ridged base; a riveted iron tang into a turned wooden handle with a leather hanging loop
      const V=(r,y)=>new THREE.Vector2(r,y), pan=new THREE.LatheGeometry([V(0.001,-0.016),V(0.08,-0.016),V(0.088,-0.012),V(0.105,0.016),V(0.11,0.019),V(0.108,0.021),V(0.098,0.017),V(0.083,-0.008),V(0.001,-0.008)],sg(28)).rotateX(-Math.PI/2).translate(0,-0.34,0);
      smoothN(pan); const o=[pc(pan,(x,y,z,c)=>{ const r=Math.hypot(x,y+0.34); c.set(C); if(z<-0.012) c.multiplyScalar(0.85+0.15*Math.sin(r*300)); else if(r<0.085){ c.multiplyScalar(0.55); const hl=Math.max(0,1-Math.hypot(x+0.03,y+0.31)/0.04); c.lerp(new THREE.Color(0x8a9098),hl*0.6); } else if(r>0.102) c.multiplyScalar(1.3); })];
      o.push(SILLY_C(vbox(0.026,0.05,0.008,0,-0.225,-0.002),C)); for(const sx of [-1,1]) o.push(SILLY_C(csph(0.004,5,4).translate(sx*0.007,-0.238,0.003),0x9aa0a8));
      const hd=new THREE.LatheGeometry([V(0.001,0),V(0.014,0),V(0.018,0.02),V(0.016,0.08),V(0.019,0.15),V(0.021,0.18),V(0.016,0.195),V(0.001,0.197)],sg(10)).rotateX(Math.PI).translate(0,-0.012,0); smoothN(hd);
      o.push(pc(hd,(x,y,z,c)=>{ c.set(T).multiplyScalar(0.9+0.1*Math.sin(y*120+Math.atan2(x,z)*2)); if(Math.abs(y+0.03)<0.006) c.multiplyScalar(0.7); }), SILLY_C(new THREE.TorusGeometry(0.012,0.003,5,10).translate(0,0.004,0),0x5a3a22));
      return o; }},
    chicken:{name:'Rubber Chicken',col:0xf2d34a,trim:0xd9482b,text:'A floppy yellow chicken held by its feet. Nobody knows why it is so effective.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.007,0.007,0.2,5).translate(-0.016,-0.1,0),0xe8963a), SILLY_C(cyl(0.007,0.007,0.2,5).translate(0.016,-0.1,0),0xe8963a),
      SILLY_C(vbox(0.075,0.012,0.04,0,-0.02,-0.012),0xe8963a),
      SILLY_C(csph(0.088,sg(14),sg(10)).scale(0.9,1.18,1).translate(0,-0.31,0),C), SILLY_C(csph(0.04,sg(8),sg(6)).scale(0.5,1.5,1).translate(-0.085,-0.3,0.01),C), SILLY_C(csph(0.04,sg(8),sg(6)).scale(0.5,1.5,1).translate(0.085,-0.3,0.01),C),
      SILLY_C(new THREE.ConeGeometry(0.04,0.12,5).rotateX(-Math.PI/2).rotateX(0.5).translate(0,-0.28,0.1),C),
      SILLY_C(cyl(0.022,0.03,0.07,6).translate(0,-0.42,-0.005),C), SILLY_C(csph(0.043,sg(10),sg(8)).translate(0,-0.47,-0.01),C),
      SILLY_C(new THREE.ConeGeometry(0.016,0.05,5).rotateX(-Math.PI/2).rotateY(Math.PI).translate(0,-0.485,-0.06),0xe8963a), SILLY_C(csph(0.016,5,4).scale(0.6,1.3,1.4).translate(0,-0.445,0.03),T), SILLY_C(csph(0.012,5,4).translate(0,-0.52,-0.05),T),
      SILLY_C(csph(0.006,5,4).translate(-0.028,-0.465,-0.03),0x222222), SILLY_C(csph(0.006,5,4).translate(0.028,-0.465,-0.03),0x222222)]},
    fish:{name:'Giant Trout',col:0x6f9fb8,trim:0xd9e4ea,text:'A very large, very fresh trout, swung by the tail.',build:(C,T,sg)=>{
      // held by the tail: a spindle of a body from the tail stalk (the grip) down to the head, flat across (its broad side faces front), a forked tail fin above the hand,
      // a dorsal and two belly fins, a pink stripe and dark spots on the back, a pale belly, an open mouth and an eye on each side
      const prof=[[0.0,0.012],[0.06,0.018],[0.16,0.045],[0.3,0.07],[0.42,0.076],[0.52,0.068],[0.58,0.05],[0.62,0.022],[0.63,0.0]];
      const body=new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(q[1],-0.06-q[0])),sg(14),0,Math.PI*2).scale(1,1,0.5), pk=new THREE.Color(0xe88a9a), sp=new THREE.Color(0x2a3a3a);
      smoothN(body);
      const o=[pc(body,(x,y,z,c)=>{ const t=(-0.06-y)/-0.63*-1, r=Math.hypot(x,z*2)||1, sx=x/r;
        c.set(C); if(sx<-0.25) c.set(T); else if(Math.abs(sx-0.05)<0.16) c.lerp(pk,0.55);   // belly, the pink stripe along the flank, back
        if(sx>0.3&&h3(Math.round(y*90),Math.round(z*90),1)>0.78) c.copy(sp);   // spots on the back
        if(y<-0.64&&Math.abs(sx)<0.12) c.set(0x3a1a1e); })];   // the open mouth
      o.push(pc(ofRibbon([[0,-0.07,0],[0.05,-0.015,0],[0.085,0.03,0]],u=>0.012+0.05*u,{up:[0,0,1],seg:6,th:0.004}),(x,y,z,c)=>{ c.set(C).multiplyScalar(0.85); }),pc(ofRibbon([[0,-0.07,0],[-0.05,-0.015,0],[-0.085,0.03,0]],u=>0.012+0.05*u,{up:[0,0,1],seg:6,th:0.004}),(x,y,z,c)=>{ c.set(C).multiplyScalar(0.85); }));   // the forked tail
      o.push(pc(ofRibbon([[0.07,-0.3,0],[0.11,-0.36,0],[0.075,-0.42,0]],0.03,{up:[0,0,1],seg:5,th:0.004}),c=>c.set(C).multiplyScalar(0.8)));   // the dorsal fin
      for(const sz of [-1,1]) o.push(SILLY_C(csph(0.03,6,5).scale(1.4,0.6,0.15).rotateZ(-0.6).translate(-0.06,-0.55,sz*0.02),T));   // the pectoral fins
      for(const sz of [-1,1]) o.push(SILLY_C(csph(0.011,6,5).translate(-0.01,-0.6,sz*0.028),0xf2f2ea),SILLY_C(csph(0.0065,5,4).translate(-0.01,-0.6,sz*0.035),0x14181c));   // the eyes
      o.push(SILLY_C(vbox(0.03,0.05,0.028,0,-0.09,0),0x6a4a2c)); return o; }},   // a twist of string round the tail stalk where it is held
    baguette:{name:'Baguette',col:0xd9a24f,trim:0xf4e2b2,text:'A long crusty loaf. Best when still warm.',build:(C,T,sg)=>{
      // a gently bent loaf that tapers to rounded points, a darker crust on top, five diagonal scores that burst open in pale crumb, a flour dusting, a paper sleeve where it is held
      const L=sweepTube([[0,0.03,0],[0.004,-0.12,-0.004],[0.01,-0.3,-0.01],[0.006,-0.48,-0.006],[0,-0.66,0]],[0.012,0.031,0.036,0.031,0.01],sg(12),{cap:'round',rings:sg(24)}), o=[];
      o.push(pc(L,(x,y,z,c)=>{ c.set(C).multiplyScalar(z<0?0.86:1.0); if(h3(Math.floor(x*400),Math.floor(y*400),Math.floor(z*400))<0.08) c.lerp(new THREE.Color(0xfaf4e6),0.6); }));
      for(let i=0;i<5;i++){ const y=-0.1-0.11*i; o.push(pc(csph(1,sg(8),5).scale(0.011,0.045,0.008).rotateZ(0.55).translate(0.008,y,-0.033+0.002*Math.abs(i-2)),(x,yy,z,c)=>{ c.set(T); if(z>-0.036) c.lerp(new THREE.Color(C),0.4).multiplyScalar(0.8); })); }
      o.push(pc(cyl(0.041,0.038,0.13,sg(12)).translate(0.002,-0.06,0),(x,y,z,c)=>{ c.set(0xe8dcc0); if(Math.abs(y+0.03)<0.012) c.set(0xc0392b); if(y>-0.003) c.multiplyScalar(0.9); }));
      return o; }},
    mallet:{name:'Squeaky Mallet',col:0xe8b830,trim:0xd94a4a,text:'A huge toy hammer that squeaks on every swing.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.017,0.019,0.34,sg(8)).translate(0,-0.17,0),0x8a5a34),
      pc(cyl(0.068,0.068,0.2,sg(14)).rotateZ(Math.PI/2).translate(0,-0.4,0),(x,y,z,c)=>{ c.set(C); if(Math.abs(x)>0.085) c.set(T); }),
      SILLY_C(csph(0.02,6,5).translate(0,-0.01,0),T)]},
    carrot:{name:'Giant Carrot',col:0xe8812a,trim:0x4f9a3a,text:'A carrot the size of a sword. Rabbits keep their distance.',build:(C,T,sg)=>{ const ls=[[-0.02,0.04,0.1],[0.03,0.03,-0.1],[0,0.045,-0.02]].map(([x,h,rz])=>SILLY_C(new THREE.ConeGeometry(0.014,0.11,5).rotateZ(rz).translate(x,0.02+h,0),T)); return ls.concat([
      pc(cyl(0.048,0.004,0.5,sg(10)).translate(0,-0.37,0),(x,y,z,c)=>{ c.set(C); if(Math.abs(Math.sin(y*55))>0.9) c.multiplyScalar(0.8); }), SILLY_C(csph(0.05,sg(8),sg(6)).scale(1,0.4,1).translate(0,-0.12,0),T)]); }},
    lollipop:{name:'Giant Lollipop',col:0xe9568c,trim:0xf6f0e0,text:'A spiral lollipop as wide as a shield. Sticky.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.008,0.008,0.5,5).translate(0,-0.25,0),0xf2efe8),
      pc(cyl(0.1,0.1,0.03,sg(24)).rotateX(Math.PI/2).translate(0,-0.48,0),(x,y,z,c)=>{ const a=Math.atan2(y+0.48,x), r=Math.hypot(x,y+0.48); c.set(((a/(Math.PI*2)+r*7)%1+1)%1<0.5?C:T); })]},
    umbrella:{name:'Umbrella',col:0x3a5fb0,trim:0x6b4a2a,text:'A closed umbrella with a hooked handle. Always ready for rain.',build:(C,T,sg)=>{
      // a J-hook handle at the hand, a ferrule ring, eight furled gores wound round the shaft and held by a strap with a press stud, ribs' tips peeking out, a brass tip
      const o=[SILLY_C(cyl(0.015,0.015,0.2,sg(7)).translate(0,-0.1,0),T), SILLY_C(new THREE.TorusGeometry(0.034,0.014,sg(6),sg(12),Math.PI*1.15).rotateZ(Math.PI*0.92).translate(-0.034,0.0,0),T), SILLY_C(csph(0.015,6,5).translate(-0.072,-0.012,0),T)];
      o.push(SILLY_C(cyl(0.019,0.019,0.02,sg(8)).translate(0,-0.205,0),0xc9a13a), SILLY_C(cyl(0.007,0.007,0.06,5).translate(0,-0.24,0),0x9aa0a8));
      const g=cyl(0.056,0.012,0.4,sg(16),8).translate(0,-0.47,0), p=g.attributes.position;
      for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), a=Math.atan2(x,z)+(y+0.27)*9, k=1+0.16*Math.pow(Math.abs(Math.sin(a*4)),3); p.setX(i,x*k); p.setZ(i,z*k); }   // the furled cloth: eight gores wound in a spiral
      smoothN(g); o.push(pc(g,(x,y,z,c)=>{ const a=Math.atan2(x,z)+(y+0.27)*9; c.set(C).multiplyScalar(0.78+0.3*Math.abs(Math.sin(a*4))); if(y>-0.3) c.multiplyScalar(0.85); }));
      o.push(pc(cyl(0.05,0.047,0.03,sg(12)).translate(0,-0.46,0),c=>c.set(C).multiplyScalar(0.62)), SILLY_C(csph(0.008,5,4).translate(0,-0.46,-0.05),0xc9a13a));   // the strap with its press stud
      for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; o.push(SILLY_C(csph(0.004,4,3).translate(Math.sin(a)*0.016,-0.66,Math.cos(a)*0.016),0xd8d4c8)); }   // the ribs' tips
      o.push(SILLY_C(new THREE.ConeGeometry(0.011,0.07,sg(6)).rotateX(Math.PI).translate(0,-0.7,0),0xc9a13a)); return o; }},
    rollingpin:{name:'Rolling Pin',col:0xd8b078,trim:0x8a5a34,text:'A baker\'s rolling pin. Flattens dough and doubters.',build:(C,T,sg)=>{
      // a turned barrel with chamfered ends and wood grain, flour on its middle and a smear of dough, turned handles with a bead, a neck and a round knob
      const V=(r,y)=>new THREE.Vector2(r,y), bar=new THREE.LatheGeometry([V(0.001,-0.205),V(0.04,-0.205),V(0.048,-0.196),V(0.05,-0.17),V(0.051,0),V(0.05,0.17),V(0.048,0.196),V(0.04,0.205),V(0.001,0.205)],sg(16)).translate(0,-0.38,0);
      smoothN(bar); const o=[pc(bar,(x,y,z,c)=>{ c.set(C).multiplyScalar(0.92+0.08*Math.sin(Math.atan2(x,z)*3+y*40+Math.sin(y*90)*0.6)); const fl=noise2(Math.atan2(x,z)*3,y*30); if(Math.abs(y+0.38)<0.12&&fl>0.1) c.lerp(new THREE.Color(0xfbf7ee),0.75); })];
      o.push(pc(csph(1,sg(8),5).scale(0.03,0.05,0.014).translate(0.012,-0.42,-0.044),c=>c.set(0xf2e4c4)));
      const hd=(y0,down)=>{ const g=new THREE.LatheGeometry([V(0.001,0),V(0.012,0),V(0.013,0.012),V(0.018,0.022),V(0.013,0.032),V(0.016,0.06),V(0.017,0.1),V(0.015,0.13),V(0.019,0.15),V(0.012,0.17),V(0.001,0.172)],sg(10)); if(down) g.rotateX(Math.PI); smoothN(g); return pc(g.translate(0,y0,0),(x,y,z,c)=>{ c.set(T).multiplyScalar(0.9+0.1*Math.sin(y*160)); }); };
      o.push(hd(-0.175,false), hd(-0.585,true)); return o; }},
    swatter:{name:'Fly Swatter',col:0xd94a4a,trim:0xf2d34a,text:'A plastic swatter. The flies have been warned.',build:(C,T,sg)=>{ const o=[SILLY_C(cyl(0.011,0.013,0.3,sg(6)).translate(0,-0.15,0),T)], fr=0.012, w=0.17, h=0.21, cy=-0.43;
      o.push(SILLY_C(vbox(w,fr,0.01,0,cy+h/2,0),C),SILLY_C(vbox(w,fr,0.01,0,cy-h/2,0),C),SILLY_C(vbox(fr,h,0.01,-w/2,cy,0),C),SILLY_C(vbox(fr,h,0.01,w/2,cy,0),C));
      for(let i=1;i<5;i++){ o.push(SILLY_C(vbox(w,0.004,0.006,0,cy-h/2+h*i/5,0),0xf6e8e8)); o.push(SILLY_C(vbox(0.004,h,0.006,-w/2+w*i/5,cy,0),0xf6e8e8)); } return o; }}
  },
  weak:{
    potlid:{name:'Pot Lid',col:0x9aa2aa,trim:0x2a2a2e,text:'A steel pot lid with a black knob. Surprisingly good at stopping things.',build:(C,T,sg)=>{
      // a shallow steel dome with brushed rings and a highlight, a rolled rim, a steam vent, a black knob on a steel collar with its screw
      const R=0.2, th=Math.asin(0.14/R), dz=R*Math.cos(th), dome=new THREE.SphereGeometry(R,sg(28),sg(8),0,TAU,0,th).rotateX(Math.PI/2).translate(0,0,-dz);
      const o=[pc(dome,(x,y,z,c)=>{ const r=Math.hypot(x,y); c.set(C).multiplyScalar(0.9+0.08*Math.sin(r*520)); const hl=Math.max(0,1-Math.hypot(x+0.05,y-0.05)/0.06); c.lerp(new THREE.Color(0xffffff),hl*0.5); if(Math.abs(r-0.1)<0.003) c.multiplyScalar(0.75); })];
      o.push(SILLY_C(new THREE.TorusGeometry(0.14,0.008,sg(6),sg(28)),new THREE.Color(C).multiplyScalar(1.15).getHex()));
      o.push(SILLY_C(cyl(0.008,0.008,0.004,8).rotateX(Math.PI/2).translate(0.075,0.06,0.035),0x1a1c20));
      const top=R-dz; o.push(SILLY_C(cyl(0.022,0.026,0.008,sg(12)).rotateX(Math.PI/2).translate(0,0,top+0.003),C));
      o.push(pc(new THREE.LatheGeometry([new THREE.Vector2(0.001,0),new THREE.Vector2(0.013,0),new THREE.Vector2(0.012,0.012),new THREE.Vector2(0.03,0.022),new THREE.Vector2(0.032,0.03),new THREE.Vector2(0.025,0.037),new THREE.Vector2(0.001,0.039)],sg(14)).rotateX(Math.PI/2).translate(0,0,top+0.006),(x,y,z,c)=>{ c.set(T); if(Math.hypot(x,y)<0.006) c.set(0x9aa0a8); }));
      return o; }},
    tray:{name:'Dinner Tray',col:0xc9ced3,trim:0xe8e4dc,text:'A silver serving tray with a domed cover. What is under it? Nobody asks.',build:(C,T,sg)=>{
      // an oval silver tray with a raised gallery rim and two handles, engraved scrolls round the edge; a polished cloche with a bead at its foot, a reflection, and a loop handle on a rosette
      const V=(r,y)=>new THREE.Vector2(r,y), tr=new THREE.LatheGeometry([V(0.001,0),V(0.13,0),V(0.142,0.006),V(0.15,0.02),V(0.146,0.022),V(0.136,0.009),V(0.001,0.009)],sg(30)).rotateX(-Math.PI/2).scale(0.92,1.15,1).translate(0,0,-0.01);
      smoothN(tr); const o=[pc(tr,(x,y,z,c)=>{ const r=Math.hypot(x/0.92,y/1.15), a=Math.atan2(y,x); c.set(C); if(r>0.134) c.multiplyScalar(1.2); else if(r>0.112&&r<0.126&&Math.sin(a*18+Math.sin(r*600)*1.5)>0.4) c.multiplyScalar(0.78); })];
      for(const sy of [-1,1]) o.push(SILLY_C(new THREE.TorusGeometry(0.03,0.006,6,12,Math.PI).rotateZ(sy>0?0:Math.PI).translate(0,sy*0.168,0.0),C));
      const dome=new THREE.SphereGeometry(0.095,sg(18),sg(10),0,TAU,0,Math.PI/2).rotateX(Math.PI/2).scale(1,1,0.9);
      o.push(pc(dome,(x,y,z,c)=>{ c.set(T); const hl=Math.max(0,1-Math.hypot(x+0.035,y-0.04)/0.035); c.lerp(new THREE.Color(0xffffff),hl*0.7); c.multiplyScalar(0.85+0.15*z/0.085); }));
      o.push(SILLY_C(new THREE.TorusGeometry(0.095,0.004,5,sg(24)),C), SILLY_C(cyl(0.016,0.022,0.006,sg(10)).rotateX(Math.PI/2).translate(0,0,0.087),C), SILLY_C(new THREE.TorusGeometry(0.014,0.0045,6,12,Math.PI).rotateX(Math.PI/2).translate(0,0,0.09),C));
      return o; }},
    duck:{name:'Rubber Duck',col:0xf6d84a,trim:0xf0902a,text:'A squeaky yellow duck, held out like a shield.',build:(C,T,sg)=>[
      SILLY_C(csph(0.105,sg(14),sg(10)).scale(1,0.8,1.15).translate(0,-0.03,0.07),C), SILLY_C(new THREE.ConeGeometry(0.05,0.1,6).rotateX(-Math.PI/2).rotateX(0.6).translate(0,0.0,-0.02),C),
      SILLY_C(csph(0.062,sg(12),sg(8)).translate(0,0.1,0.1),C), SILLY_C(vbox(0.06,0.015,0.05,0,0.09,0.17),T), SILLY_C(vbox(0.05,0.012,0.045,0,0.07,0.165),T),
      SILLY_C(csph(0.008,5,4).translate(-0.032,0.12,0.15),0x1a1a1a), SILLY_C(csph(0.008,5,4).translate(0.032,0.12,0.15),0x1a1a1a),
      SILLY_C(csph(0.045,sg(8),sg(6)).scale(0.5,1.2,1).translate(-0.095,-0.03,0.08),C), SILLY_C(csph(0.045,sg(8),sg(6)).scale(0.5,1.2,1).translate(0.095,-0.03,0.08),C)]},
    pillow:{name:'Pillow',col:0xe8c0d4,trim:0xf6f0e0,text:'A big soft pillow with tassels. Hits like a very polite cloud.',build:(C,T,sg)=>{
      // a square pillow puffed in the middle and pinched to the corners, piping round the seam, a tufted button in the middle with creases running to it, a tassel at each corner
      const g=csph(1,sg(24),sg(16)), p=g.attributes.position, A=0.15, B=0.12;
      for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), sx=Math.sign(x)*Math.pow(Math.abs(x),0.35), sy=Math.sign(y)*Math.pow(Math.abs(y),0.35);
        const X=sx*A, Y=sy*B, puff=Math.max(0.12,(1-sx*sx*0.85)*(1-sy*sy*0.85)), dip=Math.exp(-(X*X+Y*Y)/0.0006)*0.35; p.setXYZ(i,X,Y,z*0.06*puff*(1-dip)+0.03); }
      smoothN(g); const o=[pc(g,(x,y,z,c)=>{ c.set(C); if(Math.abs(z-0.03)<0.004) c.set(T); const a=Math.atan2(y,x), r=Math.hypot(x,y); if(r>0.015&&Math.abs(Math.sin(a*4))<0.08*r*12&&r<0.08) c.multiplyScalar(0.86); })];
      for(const sd of [-1,1]) o.push(SILLY_C(csph(0.009,6,5).scale(1,1,0.6).translate(0,0,0.03+sd*0.04),T));
      for(const sx of [-1,1]) for(const sy of [-1,1]){ const x=sx*A*0.96, y=sy*B*0.96, l=Math.hypot(A,B), dx=sx*A/l, dy=sy*B/l, th=Math.atan2(dx,-dy);   // the tassel hangs out along the corner's diagonal
        o.push(SILLY_C(csph(0.009,6,5).translate(x,y,0.03),T), pc(new THREE.ConeGeometry(0.013,0.045,sg(8),1,true).rotateZ(th).translate(x+dx*0.026,y+dy*0.026,0.03),(px,py,pz,c)=>{ c.set(T).multiplyScalar(0.85+0.15*Math.sin((px*dy-py*dx)*900)); })); }
      return o; }},
    teddy:{name:'Teddy Bear',col:0x9a6a3f,trim:0xd9b07a,text:'A brown teddy with a button nose. It holds on tight.',build:(C,T,sg)=>[
      SILLY_C(csph(0.09,sg(12),sg(8)).scale(0.95,1.1,0.9).translate(0,-0.04,0.07),C), SILLY_C(csph(0.075,sg(12),sg(8)).translate(0,0.1,0.075),C),
      SILLY_C(csph(0.03,sg(8),sg(6)).translate(-0.06,0.16,0.07),C), SILLY_C(csph(0.03,sg(8),sg(6)).translate(0.06,0.16,0.07),C),
      SILLY_C(csph(0.032,sg(8),sg(6)).scale(1,0.8,0.9).translate(0,0.085,0.14),T), SILLY_C(csph(0.012,5,4).translate(0,0.095,0.168),0x1a1a1a),
      SILLY_C(csph(0.008,5,4).translate(-0.03,0.12,0.14),0x1a1a1a), SILLY_C(csph(0.008,5,4).translate(0.03,0.12,0.14),0x1a1a1a),
      SILLY_C(csph(0.034,sg(8),sg(6)).scale(1,1.4,1).translate(-0.1,-0.02,0.1),C), SILLY_C(csph(0.034,sg(8),sg(6)).scale(1,1.4,1).translate(0.1,-0.02,0.1),C),
      SILLY_C(csph(0.04,sg(8),sg(6)).scale(1,1,1.2).translate(-0.05,-0.13,0.12),T), SILLY_C(csph(0.04,sg(8),sg(6)).scale(1,1,1.2).translate(0.05,-0.13,0.12),T)]},
    pizza:{name:'Whole Pizza',col:0xe8b04a,trim:0xc0392b,text:'A whole pizza, extra pepperoni. Still hot.',build:(C,T,sg)=>{
      // a puffy crust ring round a cheese top cut into eight slices (one already gone), cheese melting over the edge, pepperoni with curled edges, basil, black olives
      const miss=a=>{ const k=((a+Math.PI*2)%(Math.PI*2)); return k>0.15&&k<0.15+Math.PI/4; }, o=[];
      const base=new THREE.CylinderGeometry(0.125,0.125,0.02,sg(28),1,false,0.15+Math.PI/4,Math.PI*2-Math.PI/4).rotateX(Math.PI/2);
      o.push(pc(base,(x,y,z,c)=>{ c.set(C); const a=Math.atan2(y,x); if(Math.abs(((a/(Math.PI/4))%1+1)%1-0.5)>0.485&&z>0.005) c.multiplyScalar(0.72); else c.multiplyScalar(0.95+0.08*Math.sin(x*140)*Math.sin(y*120)); if(z<0) c.set(0xc98a3a); }));
      const crust=new THREE.TorusGeometry(0.128,0.016,sg(6),sg(28),Math.PI*2-Math.PI/4).rotateZ(0.15+Math.PI/4); o.push(pc(crust,(x,y,z,c)=>{ c.set(0xd99a4a).multiplyScalar(0.85+0.2*h3(Math.round(x*200),Math.round(y*200),1)); if(z>0.01) c.multiplyScalar(0.85); }));
      for(const [r,a] of [[0.0,0],[0.07,0.9],[0.07,2.2],[0.075,3.3],[0.07,4.4],[0.075,5.5],[0.04,1.6],[0.04,3.9],[0.04,5.0],[0.1,2.7],[0.1,4.0],[0.1,5.9],[0.1,1.4]]){ if(r>0&&miss(a)) continue;
        o.push(pc(cyl(0.02,0.022,0.007,sg(10)).rotateX(Math.PI/2).translate(Math.cos(a)*r,Math.sin(a)*r,0.014),(x,y,z,c)=>{ c.set(T); if(z>0.016) c.multiplyScalar(1.05); if(Math.hypot(x-Math.cos(a)*r,y-Math.sin(a)*r)>0.017) c.multiplyScalar(0.7); })); }
      for(const a of [1.1,2.6,3.6,4.8,5.8]) o.push(SILLY_C(csph(0.012,5,4).scale(1.4,0.7,0.3).rotateZ(a).translate(Math.cos(a)*0.055,Math.sin(a)*0.055,0.016),0x3a6a2a));   // basil leaves
      for(const a of [0.6,2.0,3.1,4.2,5.3]) o.push(SILLY_C(gmRingAt([Math.cos(a)*0.088,Math.sin(a)*0.088,0.015],[0,0,1],0.006,0.003,5),0x1a1a1e));   // olive rings
      for(const a of [1.8,3.0,4.6,5.7]) o.push(SILLY_C(csph(0.012,5,4).scale(1,1.6,0.6).translate(Math.cos(a)*0.128,Math.sin(a)*0.128-0.012,0.016),0xf2d06a));   // cheese dripping over the crust
      return o; }},
    cookie:{name:'Giant Cookie',col:0xd9a463,trim:0x4a2c1e,text:'A cookie as big as a shield, with chocolate chips. Someone has taken a bite.',build:(C,T,sg)=>{
      // a domed, cracked top over a golden rim, a big bite out of one edge (three round scallops), chocolate chips half sunk in, a few sticking out of the rim
      const g=new THREE.CylinderGeometry(0.135,0.14,0.036,sg(30),3).rotateX(Math.PI/2), p=g.attributes.position, bites=[[0.11,0.08],[0.135,0.035],[0.08,0.115]];
      for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i); const r=Math.hypot(x,y);
        for(const [bx,by] of bites){ const d=Math.hypot(x-bx,y-by); if(d<0.045&&r>0.001){ const k=(0.045-d)/0.045; x-=(bx/0.14)*0.045*k; y-=(by/0.14)*0.045*k; } }   // the bite pushes the edge in
        if(z>0) z+=0.012*(1-Math.min(1,r/0.14))+0.003*Math.sin(x*90)*Math.sin(y*80); p.setXYZ(i,x,y,z); }
      smoothN(g); const o=[pc(g,(x,y,z,c)=>{ const r=Math.hypot(x,y); c.set(C); if(r>0.115) c.multiplyScalar(0.82); if(z>0.018&&Math.abs(noise2(x*30,y*30))<0.06) c.multiplyScalar(0.72); else c.multiplyScalar(0.94+0.1*h3(Math.round(x*300),Math.round(y*300),0)); })];
      for(const [x,y] of [[0.03,0.05],[-0.06,0.03],[0.06,-0.03],[-0.02,-0.06],[0.0,0.0],[-0.08,-0.07],[0.02,0.09],[-0.1,0.02],[0.05,-0.09],[-0.04,0.1],[0.09,-0.06]]) o.push(SILLY_C(new THREE.ConeGeometry(0.014,0.016,6).rotateX(Math.PI/2).translate(x,y,0.026-0.06*Math.hypot(x,y)),T));   // chips, a point up like a dropped chip
      for(const a of [2.2,3.5,4.6,5.6]) o.push(SILLY_C(csph(0.012,5,4).scale(1.2,1,0.8).translate(Math.cos(a)*0.138,Math.sin(a)*0.138,0.004),T));   // and a few in the rim
      return o; }},
    icecream:{name:'Ice-cream Cone',col:0xf4a0c0,trim:0xf6f0e0,text:'Two scoops on a waffle cone, a cherry on top. Do not let it melt.',build:(C,T,sg)=>[
      pc(cyl(0.062,0.004,0.24,sg(10)).translate(0,-0.1,0.05),(x,y,z,c)=>{ c.set(0xd8a45a); if(Math.abs(Math.sin((x+y)*60))>0.9) c.multiplyScalar(0.8); }),
      SILLY_C(csph(0.07,sg(12),sg(8)).translate(0,0.04,0.05),C), SILLY_C(csph(0.06,sg(12),sg(8)).translate(0,0.13,0.05),T), SILLY_C(csph(0.018,6,5).translate(0,0.2,0.05),0xd92b2b)]}
  }
};
const sillyDef=(kind,id)=>typeof id==='string'&&id&&Object.prototype.hasOwnProperty.call(SILLY,kind)&&Object.prototype.hasOwnProperty.call(SILLY[kind],id)?SILLY[kind][id]:null;
// the item id a look wears in a hand ('' = none); `left` is the look's handedness, kept on the rig for the weapons and the pose
const sillyId=(L,kind)=>sillyDef(kind,L[kind==='strong'?'strongItem':'weakItem'])?L[kind==='strong'?'strongItem':'weakItem']:'';
function sillyDress(rig,X){
  const L=X.L, left=!!L.left, fc=v=>typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):null;
  for(const kind of ['strong','weak']){
    const id=sillyId(L,kind), D=sillyDef(kind,id); if(!D) continue;
    const col=fc(L[kind+'Color']), trim=fc(L[kind+'Trim']), parts=D.build(col===null?D.col:col,trim===null?D.trim:trim,X.sg);
    const strongEl=left?rig.elL:rig.elR, weakEl=left?rig.elR:rig.elL;
    if(kind==='strong'){ const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=true; m.position.set(0,-0.3,0); m.rotation.x=0.35; strongEl.add(m); }
    else { const sd=left?1:-1, g=merge(parts).rotateY(left?Math.PI/2:-Math.PI/2).translate(sd*0.036,-0.17,0), m=new THREE.Mesh(g,matChar); m.castShadow=true; weakEl.add(m);
      // a grip: the hand closes on a short bar between the forearm and the item, so the item is held, not floating beside the arm
      const gm=new THREE.Mesh(merge([pc(new THREE.BoxGeometry(0.07,0.034,0.03).translate(sd*0.02,-0.255,0),c=>c.set(0x2a2622)),pc(new THREE.BoxGeometry(0.014,0.05,0.036).translate(sd*0.052,-0.23,0),c=>c.set(0x2a2622))]),matChar); gm.castShadow=true; weakEl.add(gm); }
  }
}
