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
    pan:{name:'Frying Pan',col:0x3b3f45,trim:0x7a4a2c,text:'A cast-iron pan with a wooden handle. It rings when it hits something.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.017,0.02,0.22,sg(8)).translate(0,-0.11,0),T), SILLY_C(csph(0.02,6,5).translate(0,-0.22,0),T),
      pc(cyl(0.105,0.105,0.032,sg(22)).rotateX(Math.PI/2).translate(0,-0.34,0),(x,y,z,c)=>{ const r=Math.hypot(x,y+0.34); c.set(C); if(z>0.012&&r<0.088) c.multiplyScalar(0.62); else if(r>0.096) c.multiplyScalar(1.35); }),
      SILLY_C(vbox(0.03,0.04,0.026,0,-0.235,0),C)]},
    chicken:{name:'Rubber Chicken',col:0xf2d34a,trim:0xd9482b,text:'A floppy yellow chicken held by its feet. Nobody knows why it is so effective.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.007,0.007,0.2,5).translate(-0.016,-0.1,0),0xe8963a), SILLY_C(cyl(0.007,0.007,0.2,5).translate(0.016,-0.1,0),0xe8963a),
      SILLY_C(vbox(0.075,0.012,0.04,0,-0.02,-0.012),0xe8963a),
      SILLY_C(csph(0.088,sg(14),sg(10)).scale(0.9,1.18,1).translate(0,-0.31,0),C), SILLY_C(csph(0.04,sg(8),sg(6)).scale(0.5,1.5,1).translate(-0.085,-0.3,0.01),C), SILLY_C(csph(0.04,sg(8),sg(6)).scale(0.5,1.5,1).translate(0.085,-0.3,0.01),C),
      SILLY_C(new THREE.ConeGeometry(0.04,0.12,5).rotateX(-Math.PI/2).rotateX(0.5).translate(0,-0.28,0.1),C),
      SILLY_C(cyl(0.022,0.03,0.07,6).translate(0,-0.42,-0.005),C), SILLY_C(csph(0.043,sg(10),sg(8)).translate(0,-0.47,-0.01),C),
      SILLY_C(new THREE.ConeGeometry(0.016,0.05,5).rotateX(-Math.PI/2).rotateY(Math.PI).translate(0,-0.485,-0.06),0xe8963a), SILLY_C(csph(0.016,5,4).scale(0.6,1.3,1.4).translate(0,-0.445,0.03),T), SILLY_C(csph(0.012,5,4).translate(0,-0.52,-0.05),T),
      SILLY_C(csph(0.006,5,4).translate(-0.028,-0.465,-0.03),0x222222), SILLY_C(csph(0.006,5,4).translate(0.028,-0.465,-0.03),0x222222)]},
    fish:{name:'Giant Trout',col:0x6f9fb8,trim:0xd9e4ea,text:'A very large, very fresh trout, swung by the tail.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.012,0.02,0.14,6).translate(0,-0.1,0),C), SILLY_C(vbox(0.012,0.1,0.08,0,-0.03,0),C),
      pc(csph(0.075,sg(14),sg(10)).scale(0.55,2.5,1).translate(0,-0.38,0),(x,y,z,c)=>{ c.set(C); if(z>0.02) c.set(T); else if(Math.abs(Math.sin(y*70))>0.8&&z<0) c.multiplyScalar(0.8); }),
      SILLY_C(vbox(0.01,0.1,0.05,0,-0.34,-0.07),C), SILLY_C(vbox(0.06,0.03,0.014,0.04,-0.45,0.01).rotateZ(-0.4),C),
      SILLY_C(csph(0.012,5,4).translate(-0.03,-0.52,-0.015),0x14181c), SILLY_C(csph(0.012,5,4).translate(0.03,-0.52,-0.015),0x14181c)]},
    baguette:{name:'Baguette',col:0xd9a24f,trim:0xf4e2b2,text:'A long crusty loaf. Best when still warm.',build:(C,T,sg)=>[
      pc(cyl(0.034,0.034,0.6,sg(10)).translate(0,-0.32,0),(x,y,z,c)=>{ c.set(C); const f=((y*17)%1+1)%1; if(f<0.3&&z<0.01) c.lerp(new THREE.Color(T),0.7); }),
      SILLY_C(csph(0.034,sg(8),sg(6)).translate(0,-0.02,0),C), SILLY_C(csph(0.034,sg(8),sg(6)).translate(0,-0.62,0),C)]},
    mallet:{name:'Squeaky Mallet',col:0xe8b830,trim:0xd94a4a,text:'A huge toy hammer that squeaks on every swing.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.017,0.019,0.34,sg(8)).translate(0,-0.17,0),0x8a5a34),
      pc(cyl(0.068,0.068,0.2,sg(14)).rotateZ(Math.PI/2).translate(0,-0.4,0),(x,y,z,c)=>{ c.set(C); if(Math.abs(x)>0.085) c.set(T); }),
      SILLY_C(csph(0.02,6,5).translate(0,-0.01,0),T)]},
    carrot:{name:'Giant Carrot',col:0xe8812a,trim:0x4f9a3a,text:'A carrot the size of a sword. Rabbits keep their distance.',build:(C,T,sg)=>{ const ls=[[-0.02,0.04,0.1],[0.03,0.03,-0.1],[0,0.045,-0.02]].map(([x,h,rz])=>SILLY_C(new THREE.ConeGeometry(0.014,0.11,5).rotateZ(rz).translate(x,0.02+h,0),T)); return ls.concat([
      pc(cyl(0.048,0.004,0.5,sg(10)).translate(0,-0.37,0),(x,y,z,c)=>{ c.set(C); if(Math.abs(Math.sin(y*55))>0.9) c.multiplyScalar(0.8); }), SILLY_C(csph(0.05,sg(8),sg(6)).scale(1,0.4,1).translate(0,-0.12,0),T)]); }},
    lollipop:{name:'Giant Lollipop',col:0xe9568c,trim:0xf6f0e0,text:'A spiral lollipop as wide as a shield. Sticky.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.008,0.008,0.5,5).translate(0,-0.25,0),0xf2efe8),
      pc(cyl(0.1,0.1,0.03,sg(24)).rotateX(Math.PI/2).translate(0,-0.48,0),(x,y,z,c)=>{ const a=Math.atan2(y+0.48,x), r=Math.hypot(x,y+0.48); c.set(((a/(Math.PI*2)+r*7)%1+1)%1<0.5?C:T); })]},
    umbrella:{name:'Umbrella',col:0x3a5fb0,trim:0x6b4a2a,text:'A closed umbrella with a hooked handle. Always ready for rain.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.014,0.014,0.24,sg(7)).translate(0,-0.12,0),T), SILLY_C(new THREE.TorusGeometry(0.03,0.012,5,10,Math.PI*1.2).rotateZ(Math.PI*0.9).translate(-0.03,0.0,0),T),
      SILLY_C(cyl(0.007,0.007,0.5,5).translate(0,-0.45,0),0x9aa0a8),
      pc(cyl(0.05,0.01,0.36,sg(8)).translate(0,-0.42,0),(x,y,z,c)=>{ c.set(C); if(Math.floor(((Math.atan2(x,z)/(Math.PI*2)+1)%1)*8)%2) c.multiplyScalar(0.78); }),
      SILLY_C(new THREE.ConeGeometry(0.01,0.06,5).rotateX(Math.PI).translate(0,-0.7,0),0xc9a13a)]},
    rollingpin:{name:'Rolling Pin',col:0xd8b078,trim:0x8a5a34,text:'A baker\'s rolling pin. Flattens dough and doubters.',build:(C,T,sg)=>[
      SILLY_C(cyl(0.016,0.016,0.2,sg(8)).translate(0,-0.1,0),T), pc(cyl(0.05,0.05,0.34,sg(14)).translate(0,-0.37,0),(x,y,z,c)=>{ c.set(C); if(Math.abs(Math.sin(y*30))>0.97) c.multiplyScalar(0.88); }), SILLY_C(cyl(0.016,0.016,0.1,sg(8)).translate(0,-0.59,0),T)]},
    swatter:{name:'Fly Swatter',col:0xd94a4a,trim:0xf2d34a,text:'A plastic swatter. The flies have been warned.',build:(C,T,sg)=>{ const o=[SILLY_C(cyl(0.011,0.013,0.3,sg(6)).translate(0,-0.15,0),T)], fr=0.012, w=0.17, h=0.21, cy=-0.43;
      o.push(SILLY_C(vbox(w,fr,0.01,0,cy+h/2,0),C),SILLY_C(vbox(w,fr,0.01,0,cy-h/2,0),C),SILLY_C(vbox(fr,h,0.01,-w/2,cy,0),C),SILLY_C(vbox(fr,h,0.01,w/2,cy,0),C));
      for(let i=1;i<5;i++){ o.push(SILLY_C(vbox(w,0.004,0.006,0,cy-h/2+h*i/5,0),0xf6e8e8)); o.push(SILLY_C(vbox(0.004,h,0.006,-w/2+w*i/5,cy,0),0xf6e8e8)); } return o; }}
  },
  weak:{
    potlid:{name:'Pot Lid',col:0x9aa2aa,trim:0x2a2a2e,text:'A steel pot lid with a black knob. Surprisingly good at stopping things.',build:(C,T,sg)=>[
      pc(cyl(0.14,0.14,0.026,sg(26)).rotateX(Math.PI/2),(x,y,z,c)=>{ const r=Math.hypot(x,y); c.set(C); if(r>0.125) c.multiplyScalar(1.3); else if(r>0.1&&r<0.108) c.multiplyScalar(0.8); }),
      SILLY_C(csph(0.032,sg(10),sg(8)).scale(1,1,0.8).translate(0,0,0.03),T), SILLY_C(cyl(0.012,0.012,0.04,sg(6)).rotateX(Math.PI/2).translate(0,0,0.02),T)]},
    tray:{name:'Dinner Tray',col:0xc9ced3,trim:0xe8e4dc,text:'A silver serving tray with a domed cover. What is under it? Nobody asks.',build:(C,T,sg)=>[
      pc(cyl(0.15,0.15,0.018,sg(26)).rotateX(Math.PI/2).scale(0.92,1.15,1),(x,y,z,c)=>{ c.set(C); const r=Math.hypot(x/0.92,y/1.15); if(r>0.138) c.multiplyScalar(1.25); }),
      SILLY_C(new THREE.SphereGeometry(0.095,sg(14),sg(8),0,Math.PI*2,0,Math.PI/2).rotateX(Math.PI/2).scale(1,1,0.9),T), SILLY_C(csph(0.016,6,5).translate(0,0,0.095),C)]},
    duck:{name:'Rubber Duck',col:0xf6d84a,trim:0xf0902a,text:'A squeaky yellow duck, held out like a shield.',build:(C,T,sg)=>[
      SILLY_C(csph(0.105,sg(14),sg(10)).scale(1,0.8,1.15).translate(0,-0.03,0.07),C), SILLY_C(new THREE.ConeGeometry(0.05,0.1,6).rotateX(-Math.PI/2).rotateX(0.6).translate(0,0.0,-0.02),C),
      SILLY_C(csph(0.062,sg(12),sg(8)).translate(0,0.1,0.1),C), SILLY_C(vbox(0.06,0.015,0.05,0,0.09,0.17),T), SILLY_C(vbox(0.05,0.012,0.045,0,0.07,0.165),T),
      SILLY_C(csph(0.008,5,4).translate(-0.032,0.12,0.15),0x1a1a1a), SILLY_C(csph(0.008,5,4).translate(0.032,0.12,0.15),0x1a1a1a),
      SILLY_C(csph(0.045,sg(8),sg(6)).scale(0.5,1.2,1).translate(-0.095,-0.03,0.08),C), SILLY_C(csph(0.045,sg(8),sg(6)).scale(0.5,1.2,1).translate(0.095,-0.03,0.08),C)]},
    pillow:{name:'Pillow',col:0xe8c0d4,trim:0xf6f0e0,text:'A big soft pillow with tassels. Hits like a very polite cloud.',build:(C,T,sg)=>{ const o=[pc(csph(0.16,sg(16),sg(10)).scale(0.95,0.85,0.3).translate(0,0,0.03),(x,y,z,c)=>{ c.set(C); if(Math.abs(Math.hypot(x/0.95,y/0.85)-0.14)<0.007) c.set(T); })];
      for(const sx of [-1,1]) for(const sy of [-1,1]) o.push(SILLY_C(csph(0.017,6,5).translate(sx*0.14,sy*0.105,0.03),T)); return o; }},
    teddy:{name:'Teddy Bear',col:0x9a6a3f,trim:0xd9b07a,text:'A brown teddy with a button nose. It holds on tight.',build:(C,T,sg)=>[
      SILLY_C(csph(0.09,sg(12),sg(8)).scale(0.95,1.1,0.9).translate(0,-0.04,0.07),C), SILLY_C(csph(0.075,sg(12),sg(8)).translate(0,0.1,0.075),C),
      SILLY_C(csph(0.03,sg(8),sg(6)).translate(-0.06,0.16,0.07),C), SILLY_C(csph(0.03,sg(8),sg(6)).translate(0.06,0.16,0.07),C),
      SILLY_C(csph(0.032,sg(8),sg(6)).scale(1,0.8,0.9).translate(0,0.085,0.14),T), SILLY_C(csph(0.012,5,4).translate(0,0.095,0.168),0x1a1a1a),
      SILLY_C(csph(0.008,5,4).translate(-0.03,0.12,0.14),0x1a1a1a), SILLY_C(csph(0.008,5,4).translate(0.03,0.12,0.14),0x1a1a1a),
      SILLY_C(csph(0.034,sg(8),sg(6)).scale(1,1.4,1).translate(-0.1,-0.02,0.1),C), SILLY_C(csph(0.034,sg(8),sg(6)).scale(1,1.4,1).translate(0.1,-0.02,0.1),C),
      SILLY_C(csph(0.04,sg(8),sg(6)).scale(1,1,1.2).translate(-0.05,-0.13,0.12),T), SILLY_C(csph(0.04,sg(8),sg(6)).scale(1,1,1.2).translate(0.05,-0.13,0.12),T)]},
    pizza:{name:'Whole Pizza',col:0xe8b04a,trim:0xc0392b,text:'A whole pizza, extra pepperoni. Still hot.',build:(C,T,sg)=>{ const o=[pc(cyl(0.14,0.14,0.024,sg(26)).rotateX(Math.PI/2),(x,y,z,c)=>{ c.set(C); if(Math.hypot(x,y)>0.12) c.set(0xc98a3a); })];
      for(const [x,y] of [[0,0],[0.06,0.05],[-0.06,0.05],[0.05,-0.06],[-0.05,-0.06],[0,0.09],[0,-0.09],[0.09,0],[-0.09,0]]) o.push(SILLY_C(cyl(0.022,0.022,0.008,sg(8)).rotateX(Math.PI/2).translate(x,y,0.015),T));
      for(const [x,y] of [[0.03,0.025],[-0.03,-0.03],[0.07,-0.02]]) o.push(SILLY_C(csph(0.007,5,4).translate(x,y,0.02),0x3a4a2a)); return o; }},
    cookie:{name:'Giant Cookie',col:0xd9a463,trim:0x4a2c1e,text:'A cookie as big as a shield, with chocolate chips.',build:(C,T,sg)=>{ const o=[pc(cyl(0.135,0.14,0.036,sg(22)).rotateX(Math.PI/2),(x,y,z,c)=>{ c.set(C); if(Math.hypot(x,y)>0.12) c.multiplyScalar(0.85); })];
      for(const [x,y] of [[0.03,0.05],[-0.06,0.03],[0.06,-0.03],[-0.02,-0.06],[0.0,0.0],[-0.08,-0.07],[0.08,0.07],[0.02,0.09]]) o.push(SILLY_C(csph(0.014,5,4).scale(1,1,0.6).translate(x,y,0.019),T)); return o; }},
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
