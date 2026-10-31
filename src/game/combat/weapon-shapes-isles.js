//@ Weapon shapes of the three Emberwake Isles signature outfits (Meleni, Tzaya, Atuqa): a paddle-bladed sword, a wave bow and a paddle staff; an obsidian-toothed club, a reed bow and a copal-brazier staff; a half-moon tumi knife, a tasselled bow and a quipu staff
/* ---------- weapon shapes (the Isles outfits) ----------
   Same contract as weapon-shapes.js (read its header for the frames and K = {c:{blade,guard,grip,wood,accent,glow}, tr, TR}); these register more ids in the same WPN_SHAPES tables with its helpers
   (wshP, wshBlade, wshLine, wshGrip, wshPommel, wshBar, wshShaft, wshRing, wshBow, wshHead). Loaded right after weapon-shapes-kin.js. Used by: the outfits' `dress.shape` (game/outfits/meleni.js, tzaya.js, atuqa.js).
   Test: tools/editor-smoke.js (every shape builds), tools/outfit-smoke.js. See it: node tools/model-preview.js out.png --outfit tzaya --weapon warrior */

/* ---- swords ---- */
// Meleni: a wayfinder's paddle: a long shaft opening into a leaf-shaped blade, a cream shell pommel and a turquoise band
WPN_SHAPES.sword.paddleblade=K=>[wshBlade(K,wshLine(0.66,0.04,-0.16),t=>t<0.3?0.026:0.026+0.1*Math.pow(Math.sin(Math.PI*(t-0.3)/0.7),0.7),{thick:0.16}),wshGrip(K,-0.02,-0.18,0.015),wshBar(K,0.05,-0.18,0.016),wshRing(K,0.019,0.004,K.c.accent,[0,-0.1,0],0),wshPommel(K,0.026,0.01)];
// Tzaya: a macuahuitl: a flat wooden club set along both edges with black obsidian teeth, a gold-capped grip
WPN_SHAPES.sword.macuahuitl=K=>{ const parts=[wshGrip(K,-0.02,-0.2,0.016),wshP(vbox(0.03,0.52,0.1,0,-0.46,0),K.c.wood,'shaft',K),wshBar(K,0.06,-0.2,0.02),wshPommel(K,0.024,0.01)];
  for(let i=0;i<8;i++) for(const s of [-1,1]) parts.push(wshP(new THREE.ConeGeometry(0.014,0.045,4).rotateX(s*Math.PI/2).translate(0,-0.27-i*0.058,s*0.065),K.c.blade,'blade',K));
  parts.push(wshP(csph(0.02,6,5).translate(0,-0.72,0),K.c.accent,null,K)); return parts; };
// Atuqa: a tumi, the highland ceremonial knife: a flat half-moon blade on a short shaft under a gold crossbar
WPN_SHAPES.sword.tumi=K=>[wshBlade(K,wshLine(0.34,0,-0.24),t=>0.016+0.22*Math.sqrt(Math.max(0,1-t*t)),{thick:0.14}),wshGrip(K,-0.02,-0.22,0.015),wshP(vbox(0.03,0.022,0.26,0,-0.24,0),K.c.guard,null,K),wshRing(K,0.018,0.004,K.c.accent,[0,-0.1,0],0),wshPommel(K,0.026,0.01)];

/* ---- bows ---- */
// Meleni: a swept wave bow, its tips curling back, a conch shell at the grip
WPN_SHAPES.bow.wavebow=K=>wshBow(K,{half:0.42,belly:0.07,rec:0.9,thick:0.018,tip:K.c.accent,extra:[[0,0.0,0.0,0.03,K.c.glow],[0,0.04,0.3,0.015,K.c.accent],[0,0.04,-0.3,0.015,K.c.accent]]});
// Tzaya: a plain reed bow with a jade bead at the grip and a feather at each tip
WPN_SHAPES.bow.reedbow=K=>wshBow(K,{half:0.4,belly:0.05,rec:0.5,thick:0.017,tip:K.c.accent,extra:[[0,0.0,0.0,0.026,K.c.accent],[0,0.03,0.43,0.016,K.c.glow],[0,0.03,-0.43,0.016,K.c.glow]]});
// Atuqa: a stout wood bow with woollen tassels hanging from both tips
WPN_SHAPES.bow.tasselbow=K=>wshBow(K,{half:0.36,belly:0.1,rec:0.3,thick:0.023,tip:K.c.accent,extra:[[0,-0.03,0.34,0.014,K.c.guard],[0,-0.06,0.34,0.012,K.c.accent],[0,-0.03,-0.34,0.014,K.c.guard],[0,-0.06,-0.34,0.012,K.c.accent],[0,0.0,0.0,0.024,K.c.glow]]});

/* ---- staves ---- */
// Meleni: a short paddle head on the staff, a ring of turquoise at its neck and a shell at the tip
WPN_SHAPES.staff.paddlestaff=K=>wshHead(K,0.56,[wshBlade(K,wshLine(0.3,0,-0.5),t=>0.02+0.1*Math.pow(Math.sin(Math.PI*Math.min(1,t*0.9+0.08)),0.7),{thick:0.16}),wshRing(K,0.03,0.006,K.c.accent,[0,-0.54,0]),wshP(csph(0.022,6,5).translate(0,-0.82,0),K.c.accent,null,K)],[-0.7,0,0.03]);
// Tzaya: a copal brazier on a staff: a bowl with a jade ring, three small flames of gold and a live ember
WPN_SHAPES.staff.copalstaff=K=>{ const parts=[wshP(cyl(0.05,0.03,0.045,8).translate(0,-0.66,0),K.c.guard,null,K),wshRing(K,0.052,0.007,K.c.accent,[0,-0.645,0],Math.PI/2)];
  for(let i=0;i<3;i++){ const a=i/3*Math.PI*2; parts.push(wshP(new THREE.ConeGeometry(0.014,0.07,4).translate(Math.sin(a)*0.02,-0.72-0.01*i,Math.cos(a)*0.02),K.c.accent,null,K)); }
  return wshHead(K,0.6,parts,[-0.72,0,0.04]); };
// Atuqa: a quipu staff: a crossbar under the head with knotted cords of two colours hanging from it
WPN_SHAPES.staff.quipustaff=K=>{ const parts=[wshP(vbox(0.022,0.022,0.16,0,-0.6,0),K.c.guard,null,K)];
  for(let i=0;i<5;i++){ const z=-0.064+i*0.032, L=0.14+(i%3)*0.03; parts.push(wshP(cyl(0.003,0.003,L,3).translate(0,-0.6-L/2,z),i%2?K.c.accent:K.c.grip,null,K),wshP(csph(0.007,5,4).translate(0,-0.6-L*0.6,z),K.c.accent,null,K)); }
  return wshHead(K,0.56,parts,[-0.62,0,0.03]); };
