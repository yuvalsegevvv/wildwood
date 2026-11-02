//@ Weapon shapes of the two Wildwood-story signature outfits (Morrow, Pip): a short leaf-bladed herb knife and a bundle-of-herbs staff; a whittled stick with a notched blade and a curled-fern staff
/* ---------- weapon shapes (the Wildwood story's outfits) ----------
   Same contract as weapon-shapes.js (read its header for the frames and K = {c:{blade,guard,grip,wood,accent,glow}, tr, TR}); these register more ids in the same WPN_SHAPES tables with its helpers
   (wshP, wshBlade, wshShaft, wshRing, wshHead). Loaded right after weapon-shapes-isles.js. Used by: the outfits' `dress.shape` (game/outfits/morrow.js, pip.js).
   Test: tools/editor-smoke.js (every shape builds, swords and staves all different), tools/outfit-smoke.js. See it: node tools/model-preview.js out.png --outfit morrow --weapon warrior */

/* ---- swords ---- */
// Morrow: a herb knife, a short grip and a leaf-shaped curved blade
WPN_SHAPES.sword.herbknife=K=>[wshShaft(K,0.3,0.016,'grip'),wshBlade(K,[[0,-0.3,0],[0,-0.44,0.0],[0,-0.58,0.03],[0,-0.68,0.1]],t=>0.07*Math.sin(Math.PI*(0.15+0.85*t)),{rings:12}),wshP(vbox(0.03,0.016,0.045,0,-0.3,0),K.c.guard,null,K)];
// Pip: a whittled stick with a knot at the top and a short notched blade lashed on near the end
WPN_SHAPES.sword.whittle=K=>[wshShaft(K,0.62,0.02,'grip'),wshP(csph(0.026,8,6).translate(0,0.005,0),K.c.wood,null,K),wshBlade(K,[[0,-0.62,0],[0,-0.72,0.0],[0,-0.82,0.01]],t=>0.032*(1-0.6*t),{rings:8}),wshP(vbox(0.03,0.012,0.03,0,-0.62,0),K.c.accent,null,K)];

/* ---- staves ---- */
// Morrow: a stick topped with a hanging bundle of dried herbs on a cord
WPN_SHAPES.staff.herbbundle=K=>wshHead(K,0.62,[wshP(csph(0.1,8,6).scale(0.05,1.25,0.28).translate(0.035,-0.76,0.03).rotateZ(0.25),K.c.accent,null,K),wshP(csph(0.1,8,6).scale(0.05,1.25,0.28).translate(-0.035,-0.76,0.03).rotateZ(-0.25),K.c.glow,null,K),wshP(csph(0.1,8,6).scale(0.05,1.4,0.28).translate(0,-0.78,0.03),K.c.guard,null,K),wshRing(K,0.034,0.008,K.c.grip,[0,-0.68,0.03])],[0,-0.74,0.05]);
// Pip: a stick ending in a curled fern frond
WPN_SHAPES.staff.fernstaff=K=>wshHead(K,0.62,[wshP(sweepTube([[0,-0.62,0],[0,-0.7,0.0],[0,-0.78,0.03],[0,-0.82,0.09],[0,-0.78,0.14],[0,-0.72,0.12]],[0.016,0.014,0.013,0.011,0.008,0.004],6,{cap:'round',rings:16}),K.c.accent,'shaft',K),wshP(csph(0.012,6,5).translate(0,-0.72,0.12),K.c.glow,null,K)],[-0.72,0.12,0.03]);
