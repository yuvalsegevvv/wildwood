//@ Weapon shapes of the three Kin signature outfits (Brindle, Dessa, Sefi): a tinker's wrench, a cross-peen smith's hammer, a runner's curved knife; a sun-glass bow, a horn-and-iron bow, a wind bow; a lens staff, a tongs staff, a courier's pennant staff
/* ---------- weapon shapes (the Kin outfits) ----------
   Same contract as weapon-shapes.js (read its header for the frames and K = {c:{blade,guard,grip,wood,accent,glow}, tr, TR}); these register more ids in the same WPN_SHAPES tables with its helpers
   (wshP, wshBlade, wshLine, wshGrip, wshPommel, wshBar, wshShaft, wshRing, wshBow, wshHead). Loaded right after weapon-shapes-v3b.js. Used by: the outfits' `dress.shape` (game/outfits/brindle.js, dessa.js, sefi.js).
   Test: tools/editor-smoke.js (every shape builds), tools/outfit-smoke.js. See it: node tools/model-preview.js out.png --outfit dessa --weapon warrior */

/* ---- swords ---- */
// Brindle: a long-handled wrench, an open jaw at the end, a brass pommel
WPN_SHAPES.sword.wrench=K=>[wshShaft(K,0.52,0.017,'grip'),wshP(vbox(0.1,0.034,0.034,0,-0.54,0),K.c.blade,'blade',K),wshP(vbox(0.026,0.11,0.034,-0.037,-0.6,0),K.c.blade,'blade',K),wshP(vbox(0.026,0.08,0.034,0.037,-0.585,0),K.c.blade,'blade',K),wshP(csph(0.014,6,5).translate(0,-0.58,0),K.c.accent,null,K),wshP(csph(0.028,6,5).translate(0,0.01,0),K.c.accent,null,K),wshP(cyl(0.022,0.022,0.012,8).translate(0,-0.46,0),K.c.accent,null,K)];
// Dessa: a smith's cross-peen hammer on a long handle: a flat face one side, a wedge the other, two iron bands
WPN_SHAPES.sword.anvilhammer=K=>[wshShaft(K,0.7,0.02,'grip'),wshP(vbox(0.08,0.11,0.1,0,-0.75,-0.06),K.c.blade,'blade',K),wshP(new THREE.ConeGeometry(0.04,0.14,4).rotateX(Math.PI/2).translate(0,-0.75,0.06),K.c.blade,'blade',K),wshP(vbox(0.086,0.03,0.106,0,-0.68,-0.06),K.c.accent,null,K),wshP(vbox(0.086,0.03,0.106,0,-0.82,-0.06),K.c.accent,null,K),wshP(csph(0.03,6,5).translate(0,0.01,0),K.c.guard,null,K),wshP(cyl(0.026,0.026,0.04,8).translate(0,-0.5,0),K.c.accent,null,K)];
// Sefi: a curved running knife, long and light, a wrapped grip and a loop of cord at the pommel
WPN_SHAPES.sword.runnerblade=K=>[wshBlade(K,wshLine(0.62,0.3,-0.2),t=>0.036*Math.sin(Math.min(1,t*1.1+0.06)*Math.PI*0.8)+0.006,{thick:0.14}),wshBar(K,0.07,-0.2,0.016),wshGrip(K,-0.02,-0.2,0.015),wshRing(K,0.018,0.004,K.c.accent,[0,0.012,0.01],0),wshPommel(K,0.02,0)];

/* ---- bows ---- */
// Brindle: a glass-bellied bow with a brass lens at the grip that catches the light
WPN_SHAPES.bow.glassbow=K=>wshBow(K,{half:0.4,belly:0.09,rec:0.6,thick:0.02,tip:K.c.accent,extra:[[0,0.0,0,0.05,K.c.glow],[0,0.0,0.1,0.02,K.c.accent],[0,0.0,-0.1,0.02,K.c.accent]]});
// Dessa: a short, thick bow of horn plates banded in iron
WPN_SHAPES.bow.hornbow=K=>wshBow(K,{half:0.32,belly:0.13,rec:0.4,thick:0.03,wood:K.c.guard,tip:K.c.accent,extra:[[0,0.02,0.16,0.034,K.c.accent],[0,0.02,-0.16,0.034,K.c.accent],[0,0.01,0.0,0.03,K.c.blade]]});
// Sefi: a long swept bow, tips curling hard back, a streamer at the upper tip
WPN_SHAPES.bow.windbow=K=>wshBow(K,{half:0.46,belly:0.04,rec:1.5,asym:1.1,thick:0.016,tip:K.c.glow,extra:[[0,0.04,0.46,0.02,K.c.accent],[0,0.04,0.54,0.014,K.c.accent],[0,0.0,-0.2,0.018,K.c.accent]]});

/* ---- staves ---- */
// Brindle: a brass ring with a big sun-glass lens in it and short rays round the rim
WPN_SHAPES.staff.lensstaff=K=>{ const parts=[wshRing(K,0.075,0.012,K.c.guard,[0,-0.78,0]),wshP(cyl(0.07,0.07,0.012,16).rotateZ(Math.PI/2).translate(0,-0.78,0),K.c.glow,null,K)];
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; parts.push(wshP(new THREE.ConeGeometry(0.01,0.04,4).rotateX(a).translate(0,-0.78+Math.cos(a)*0.1,Math.sin(a)*0.1),K.c.accent,null,K)); }
  return wshHead(K,0.6,parts,[-0.78,0,0.06]); };
// Dessa: a pair of long tongs gripping a glowing ingot
WPN_SHAPES.staff.tongs=K=>wshHead(K,0.58,[wshP(new THREE.BoxGeometry(0.014,0.2,0.016).rotateZ(0.12).translate(0.026,-0.7,0),K.c.guard,null,K),wshP(new THREE.BoxGeometry(0.014,0.2,0.016).rotateZ(-0.12).translate(-0.026,-0.7,0),K.c.guard,null,K),wshP(vbox(0.05,0.02,0.02,0,-0.6,0),K.c.accent,null,K),wshP(vbox(0.034,0.07,0.034,0,-0.8,0),K.c.glow,null,K)],[-0.8,0,0.04]);
// Sefi: a courier's wand with a sky-blue pennant streaming from a ring at the top
WPN_SHAPES.staff.pennant=K=>wshHead(K,0.62,[wshRing(K,0.034,0.007,K.c.guard,[0,-0.68,0]),pc(ofRibbon([[0,-0.7,0.02],[0,-0.76,0.1],[0.01,-0.8,0.2],[0,-0.78,0.3]],0.07,{up:[1,0,0],seg:8,th:0.003}),(x,y,z,c)=>{ c.set(K.c.glow); if(z>0.22) c.set(K.c.accent); }),wshP(csph(0.02,6,5).translate(0,-0.64,0),K.c.accent,null,K)],[-0.68,0,0.03]);
