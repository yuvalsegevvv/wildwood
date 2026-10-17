//@ Weapon shapes of version 3's second six signature outfits (Pell, Genzo, Brynja, Tamsin, Zahra, Hollis): a leister, a bell mallet, a skate blade, a sledge, a mirror, a vigil hook; reed, bamboo, ice, sling, sun and crape bows; a torch pole, a ringed staff, an icicle, a cairn, a sandglass, a vigil pole
/* ---------- weapon shapes (version 3, the second six) ----------
   Same contract as weapon-shapes.js (read its header: the frames of the three weapons, K = {c:{blade,guard,grip,wood,accent,glow}, tr, TR}); these register more ids in the same WPN_SHAPES tables and use its helpers
   (wshP, wshBlade, wshLine, wshGrip, wshPommel, wshDisc, wshBar, wshShaft, wshRing, wshBow, wshHead). Loaded right after weapon-shapes.js. Used by: the outfits' `dress.shape` (game/outfits/<id>.js). Test: tools/editor-smoke.js (every shape builds). */

/* ---- swords ---- */
WPN_SHAPES.sword.leister=K=>{ const parts=[wshShaft(K,0.68,0.016,'grip'),wshBar(K,0.12,-0.64,0.02)];
  for(const z of [-0.055,0,0.055]) parts.push(wshP(new THREE.ConeGeometry(0.014,0.2,5).rotateX(Math.PI).translate(0,-0.76,z),K.c.blade,'blade',K));
  for(const z of [-0.055,0.055]) parts.push(wshP(new THREE.ConeGeometry(0.008,0.05,4).translate(0,-0.68,z*1.25),K.c.blade,null,K));
  parts.push(wshP(csph(0.026,6,5).translate(0,0.01,0),K.c.accent,null,K)); return parts; };
WPN_SHAPES.sword.bellmallet=K=>[wshShaft(K,0.58,0.017,'grip'),wshP(cyl(0.05,0.05,0.2,10).rotateZ(Math.PI/2).translate(0,-0.62,0),K.c.accent,'blade',K),wshP(cyl(0.056,0.056,0.02,10).rotateZ(Math.PI/2).translate(0.07,-0.62,0),K.c.guard,null,K),wshP(cyl(0.056,0.056,0.02,10).rotateZ(Math.PI/2).translate(-0.07,-0.62,0),K.c.guard,null,K),wshP(csph(0.026,6,5).translate(0,0.01,0),K.c.guard,null,K)];
WPN_SHAPES.sword.skate=K=>[wshBlade(K,wshLine(0.74,-0.06,-0.2),t=>0.034*(1-0.5*t),{thick:0.16}),wshP(vbox(0.012,0.012,0.5,0,-0.58,-0.01),K.c.guard,null,K),wshBar(K,0.07,-0.2,0.016),wshGrip(K,-0.02,-0.2,0.017),wshPommel(K,0.02,0)];
WPN_SHAPES.sword.sledge=K=>[wshShaft(K,0.66,0.02,'grip'),wshP(vbox(0.1,0.15,0.2,0,-0.72,0),K.c.blade,'blade',K),wshP(vbox(0.104,0.03,0.204,0,-0.67,0),K.c.accent,null,K),wshP(vbox(0.104,0.03,0.204,0,-0.78,0),K.c.accent,null,K),wshP(csph(0.03,6,5).translate(0,0.01,0),K.c.guard,null,K)];
WPN_SHAPES.sword.mirror=K=>[wshGrip(K,-0.02,-0.26,0.017),wshP(cyl(0.17,0.17,0.014,22).rotateZ(Math.PI/2).translate(0,-0.46,0),K.c.blade,'blade',K),wshRing(K,0.17,0.014,K.c.accent,[0,-0.46,0]),wshP(csph(0.03,6,5).translate(0,-0.46,0),K.c.accent,null,K),wshBar(K,0.06,-0.27,0.02),wshPommel(K,0.022,0)];
WPN_SHAPES.sword.vigilhook=K=>{ const parts=[wshShaft(K,0.56,0.016,'grip'),wshP(sweepTube([[0,-0.56,0],[0,-0.62,0.0],[0,-0.68,0.05],[0,-0.64,0.12],[0,-0.57,0.12]],[0.016,0.014,0.013,0.012,0.011],6,{cap:'round',rings:14}),K.c.guard,null,K)];
  parts.push(wshP(cyl(0.032,0.026,0.07,6).translate(0,-0.6,0.12),K.c.accent,'blade',K),wshP(cyl(0.012,0.034,0.024,6).translate(0,-0.55,0.12),K.c.guard,null,K),wshPommel(K,0.022,0.01)); return parts; };

/* ---- bows ---- */
WPN_SHAPES.bow.reedbow=K=>wshBow(K,{half:0.42,belly:0.07,thick:0.015,wob:0.012,tip:K.c.accent,extra:[[0,0.05,0.4,0.022,K.c.blade]]});
WPN_SHAPES.bow.bamboo=K=>wshBow(K,{half:0.46,belly:0.05,asym:1.2,thick:0.02,tip:K.c.guard,extra:[[0,0.05,0.18,0.02,K.c.accent],[0,0.05,-0.18,0.02,K.c.accent],[0,0.0,0.34,0.019,K.c.accent]]});
WPN_SHAPES.bow.icebow=K=>wshBow(K,{half:0.34,belly:0.11,rec:0.8,thick:0.02,wood:K.c.blade,tip:K.c.guard,string:0xcfe8f8});
WPN_SHAPES.bow.slingbow=K=>wshBow(K,{half:0.3,belly:0.16,rec:0.2,thick:0.028,wood:K.c.guard,tip:K.c.grip,extra:[[0,0.02,0.12,0.024,K.c.accent],[0,0.02,-0.12,0.024,K.c.accent]]});
WPN_SHAPES.bow.sunbow=K=>wshBow(K,{half:0.36,belly:0.1,rec:1.2,thick:0.02,tip:K.c.accent,extra:[[0,0.0,0,0.045,K.c.accent],[0,0.0,0.08,0.02,K.c.guard],[0,0.0,-0.08,0.02,K.c.guard]]});
WPN_SHAPES.bow.crapebow=K=>wshBow(K,{half:0.4,belly:0.07,asym:1.3,thick:0.017,wood:K.c.wood,tip:K.c.accent,extra:[[0,-0.02,-0.4,0.03,K.c.accent],[0,0.02,-0.4,0.02,K.c.guard]]});

/* ---- staves ---- */
WPN_SHAPES.staff.torchpole=K=>wshHead(K,0.62,[wshP(cyl(0.032,0.022,0.1,7).translate(0,-0.67,0),K.c.guard,null,K),wshP(csph(0.058,8,6).scale(1,1.3,1).translate(0,-0.78,0),K.c.accent,null,K),wshP(vbox(0.008,0.1,0.008,0,-0.6,0.025),K.c.grip,null,K)],[-0.78,0,0.05]);
WPN_SHAPES.staff.shakujo=K=>wshHead(K,0.64,[wshRing(K,0.062,0.01,K.c.guard,[0,-0.72,0]),wshRing(K,0.03,0.008,K.c.accent,[0,-0.72,0.074]),wshRing(K,0.03,0.008,K.c.accent,[0,-0.72,-0.074]),wshP(csph(0.016,6,5).translate(0,-0.8,0),K.c.accent,null,K)],[-0.72,0,0.02]);
WPN_SHAPES.staff.icicle=K=>wshHead(K,0.5,[wshP(new THREE.ConeGeometry(0.04,0.3,6).rotateX(Math.PI).translate(0,-0.68,0),K.c.blade,null,K),wshP(new THREE.ConeGeometry(0.02,0.16,5).rotateX(Math.PI).translate(0.04,-0.6,0.03).rotateZ(-0.3),K.c.blade,null,K),wshP(new THREE.ConeGeometry(0.018,0.14,5).rotateX(Math.PI).translate(-0.04,-0.58,-0.03).rotateZ(0.3),K.c.blade,null,K)],[-0.7,0,0.03]);
WPN_SHAPES.staff.cairn=K=>wshHead(K,0.5,[wshP(new THREE.IcosahedronGeometry(0.06,0).scale(1.2,0.8,1.1).translate(0,-0.58,0),K.c.guard,null,K),wshP(new THREE.IcosahedronGeometry(0.045,0).translate(0.01,-0.67,0.005),K.c.blade,null,K),wshP(new THREE.IcosahedronGeometry(0.03,0).translate(-0.005,-0.74,0),K.c.accent,null,K)],null);
WPN_SHAPES.staff.sandglass=K=>wshHead(K,0.52,[wshP(new THREE.ConeGeometry(0.05,0.1,8).translate(0,-0.64,0),K.c.blade,null,K),wshP(new THREE.ConeGeometry(0.05,0.1,8).rotateX(Math.PI).translate(0,-0.74,0),K.c.blade,null,K),wshP(cyl(0.062,0.062,0.014,8).translate(0,-0.58,0),K.c.accent,null,K),wshP(cyl(0.062,0.062,0.014,8).translate(0,-0.8,0),K.c.accent,null,K)],[-0.69,0,0.03]);
WPN_SHAPES.staff.vigilpole=K=>wshHead(K,0.66,[wshP(sweepTube([[0,-0.66,0],[0,-0.72,0.0],[0,-0.78,0.05],[0,-0.77,0.12]],[0.016,0.014,0.013,0.012],5,{cap:'round',rings:10}),K.c.guard,null,K),wshP(cyl(0.034,0.034,0.07,6).translate(0,-0.85,0.12),K.c.accent,null,K),wshP(cyl(0.012,0.04,0.025,6).translate(0,-0.79,0.12),K.c.guard,null,K),pc(ofRibbon([[0,-0.62,0.02],[0.01,-0.74,0.03],[0.02,-0.86,0.02]],0.03,{up:[1,0,0],seg:6,th:0.002}),(x,y,z,c)=>{ c.set(K.c.wood); })],[-0.85,0.12,0.03]);
