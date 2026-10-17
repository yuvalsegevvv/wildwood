//@ Weapon shapes of the signature outfits: each set carries its own sword, bow and staff models (a katana, a crossbow, a lantern crook...) that replace the three plain weapons while its weapon style is worn
/* ---------- weapon shapes (version 3) ----------
   An outfit's `dress` may carry `shape:{sword:'katana', bow:'yumi', staff:'tassel'}`; weaponsOn (combat/weapons.js) then builds the named model instead of the plain sword, bow or wand
   (the shield stays and takes the dressing's colours). The class still picks WHICH of the three is held; the outfit picks what it looks like. A shape builder gets K = {c:{blade,guard,grip,wood,accent,glow}, tr, TR(col,u,part)}
   (the dressing's palette over the tier's colours, and its trim) and returns painted geometries; the three frames are the plain weapons':
   - sword: the pommel is the origin, the grip runs down -y to the guard at about y = -0.2 and the blade continues down (-y is "forward" when the arm is raised)
   - bow: the grip is the origin, the limbs span z (tips at +-z), the string lies at y > 0 (toward the archer) and the belly bulges to -y (forward)
   - staff: the hand holds y = 0, the shaft runs down to y = -L and the head sits at the end; a shape may return glow = [y, z, radius] for a lit orb
   `WPN_SHAPES.sword|bow|staff[id](K)`; an unknown id (or look data from another player) falls back to the plain weapon: wshHas checks own properties.
   used by: combat/weapons.js (weaponsOn), outfits' `dress.shape`. test: tools/editor-smoke.js (every shape builds), tools/model-preview.js --outfit id --weapon warrior|archer|mage */
const WPN_SHAPES={sword:{},bow:{},staff:{}};
const wshHas=(kind,id)=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(WPN_SHAPES[kind],id);
// a part painted in one palette colour (the trim lays its pattern on it: part names are the dressing's: blade, limb, shaft, grip, rim)
const wshP=(g,col,part,K,mul)=>pc(g,(x,y,z,c)=>{ c.set(col); if(mul) c.multiplyScalar(mul); if(part) K.TR(c,-y,part); });
// a flat blade swept along a curve in the y-z plane (a round tube squashed to a sheet in x); w(t) = full width at 0..1
function wshBlade(K,pts,w,o){
  o=o||{}; const g=sweepTube(pts,t=>Math.max(0.002,w(t)/2),6,{cap:o.cap||'point',rings:o.rings||12}); g.scale(o.thick||0.2,1,1);
  return pc(g,(x,y,z,c)=>{ c.set(o.col||K.c.blade).multiplyScalar(0.85+Math.abs(z)*1.5); K.TR(c,-y,o.part||'blade'); });
}
// points down -y from y0 to y0-len, bending toward +z by `bend` (a parabola)
const wshLine=(len,bend,y0,n)=>{ n=n||8; const p=[]; for(let i=0;i<=n;i++){ const t=i/n; p.push([0,y0-len*t,bend*len*t*t]); } return p; };
const wshGrip=(K,y0,y1,r)=>wshP(cyl(r,r,y0-y1,6).translate(0,(y0+y1)/2,0),K.c.grip,'grip',K);
const wshPommel=(K,r,y)=>wshP(csph(r||0.03,6,5).translate(0,y||0,0),K.c.guard,null,K);
const wshDisc=(K,r,y)=>wshP(cyl(r,r,0.012,14).translate(0,y,0),K.c.guard,null,K);
const wshBar=(K,w,y,th)=>wshP(vbox(w,th||0.025,0.03,0,y,0),K.c.guard,null,K);
const wshShaft=(K,L,r,part)=>wshP(cyl(r||0.016,(r||0.016)*1.3,L,7).translate(0,-L/2,0),K.c.wood,part||'shaft',K);
const wshRing=(K,R,tube,col,pos,rotY)=>{ const g=new THREE.TorusGeometry(R,tube,6,16); g.rotateY(rotY===undefined?Math.PI/2:rotY); g.translate(pos[0],pos[1],pos[2]); return wshP(g,col,null,K); };

/* ---- swords (the warrior's weapon; the shield is kept) ---- */
WPN_SHAPES.sword.katana=K=>[wshBlade(K,wshLine(0.78,0.1,-0.22),t=>0.046*(1-0.3*t)),wshDisc(K,0.042,-0.21),wshGrip(K,-0.02,-0.2,0.019),wshPommel(K,0.022,0)];
WPN_SHAPES.sword.rapier=K=>[wshBlade(K,wshLine(0.88,0,-0.24),t=>0.016*(1-0.6*t),{thick:0.3}),wshP(csph(0.06,10,6).scale(1,0.45,1).translate(0,-0.21,0),K.c.guard,null,K),wshBar(K,0.2,-0.22,0.012),wshGrip(K,-0.02,-0.19,0.014),wshPommel(K,0.024,0)];
WPN_SHAPES.sword.cleaver=K=>[wshP(vbox(0.016,0.46,0.13,0,-0.46,0.02),K.c.blade,'blade',K),wshP(vbox(0.03,0.46,0.022,0,-0.46,0.075),K.c.blade,null,K,0.8),wshP(new THREE.ConeGeometry(0.04,0.06,4).rotateX(Math.PI).translate(0,-0.72,0.0),K.c.blade,null,K),wshGrip(K,-0.02,-0.22,0.02),wshPommel(K,0.026,0)];
WPN_SHAPES.sword.saber=K=>[wshBlade(K,wshLine(0.72,0.07,-0.22),t=>0.05*(1-0.5*t)),wshBar(K,0.12,-0.21,0.02),wshP(sweepTube([[0,-0.2,0],[0,-0.17,-0.07],[0,-0.08,-0.08],[0,0,-0.03]],[0.006,0.006,0.006,0.006],5,{cap:'round',rings:10}),K.c.guard,null,K),wshGrip(K,-0.02,-0.2,0.018),wshPommel(K,0.022,0)];
WPN_SHAPES.sword.scimitar=K=>[wshBlade(K,wshLine(0.7,0.15,-0.22),t=>0.04+0.045*Math.sin(Math.min(1,t*1.15)*Math.PI*0.62)*(1-0.4*t)),wshBar(K,0.1,-0.21,0.02),wshGrip(K,-0.02,-0.2,0.018),wshPommel(K,0.026,0)];
WPN_SHAPES.sword.khopesh=K=>[wshBlade(K,[[0,-0.22,0],[0,-0.48,0],[0,-0.64,0.03],[0,-0.7,0.11],[0,-0.66,0.2],[0,-0.58,0.23]],t=>0.05*(1-0.55*t),{rings:16}),wshDisc(K,0.04,-0.21),wshGrip(K,-0.02,-0.2,0.018),wshP(csph(0.032,8,6).scale(1,0.5,1).translate(0,0.005,0),K.c.accent,null,K)];
WPN_SHAPES.sword.sickle=K=>[wshShaft(K,0.26,0.017,'grip'),wshBlade(K,[[0,-0.25,0],[0,-0.36,0.01],[0,-0.47,0.07],[0,-0.52,0.18],[0,-0.47,0.28]],t=>0.06*(1-0.7*t),{rings:14}),wshP(vbox(0.03,0.02,0.04,0,-0.25,0),K.c.guard,null,K)];
WPN_SHAPES.sword.axe=K=>[wshShaft(K,0.7,0.017,'grip'),wshP(vbox(0.04,0.12,0.05,0,-0.62,0),K.c.guard,null,K),wshBlade(K,[[0,-0.5,-0.1],[0,-0.58,-0.14],[0,-0.7,-0.12],[0,-0.78,-0.05]],t=>0.012+0.07*Math.sin(t*Math.PI),{thick:0.18,rings:10}),wshP(new THREE.ConeGeometry(0.014,0.07,5).rotateX(-Math.PI/2).translate(0,-0.62,0.06),K.c.guard,null,K),wshP(csph(0.026,6,5).translate(0,0.01,0),K.c.guard,null,K)];
WPN_SHAPES.sword.pick=K=>[wshShaft(K,0.62,0.016,'grip'),wshBlade(K,[[0,-0.5,-0.2],[0,-0.56,-0.1],[0,-0.57,0.1],[0,-0.5,0.22]],t=>0.032*(1-0.75*Math.abs(2*t-1)*0.9+0.1),{thick:0.45,rings:12}),wshP(csph(0.03,6,5).translate(0,-0.58,0),K.c.guard,null,K),wshPommel(K,0.02,0.01)];
WPN_SHAPES.sword.spade=K=>[wshShaft(K,0.56,0.017,'grip'),wshP(vbox(0.014,0.014,0.13,0,0.005,0),K.c.wood,null,K),wshP(csph(0.1,10,8).scale(0.09,1.25,1).translate(0,-0.68,0),K.c.blade,'blade',K),wshP(vbox(0.025,0.04,0.05,0,-0.56,0),K.c.guard,null,K)];
WPN_SHAPES.sword.fan=K=>{ const mk=(rot)=>{ const g=new THREE.CircleGeometry(0.3,18,-Math.PI/2-0.95,1.9); g.rotateY(rot); g.translate(0,-0.2,0); return g; };
  const sheet=g=>pc(g,(x,y,z,c)=>{ const a=Math.atan2(z,-(y+0.2)); c.set(K.c.blade).multiplyScalar(0.9+0.1*Math.cos(a*9)); K.TR(c,Math.abs(a)*0.35+(-y-0.2)*0.08,'blade'); });
  const ribs=[-0.8,-0.4,0,0.4,0.8].map(a=>wshP(vbox(0.016,0.3,0.008,0,-0.15,0).rotateX(a).translate(0,-0.2,0),K.c.accent,null,K));
  return [sheet(mk(Math.PI/2)),sheet(mk(-Math.PI/2))].concat(ribs,[wshGrip(K,-0.02,-0.2,0.017),wshP(vbox(0.03,0.025,0.06,0,-0.2,0),K.c.guard,null,K),wshPommel(K,0.022,0)]); };
WPN_SHAPES.sword.key=K=>[wshP(new THREE.TorusGeometry(0.05,0.014,6,14).rotateY(Math.PI/2).translate(0,0.02,0),K.c.guard,null,K),wshGrip(K,-0.03,-0.2,0.016),wshBar(K,0.07,-0.2,0.02),wshP(vbox(0.014,0.55,0.014,0,-0.48,0),K.c.blade,'blade',K),wshP(vbox(0.014,0.06,0.07,0,-0.72,0.035),K.c.blade,null,K),wshP(vbox(0.014,0.05,0.05,0,-0.64,0.03),K.c.blade,null,K),wshP(csph(0.018,6,5).translate(0,0.07,0),K.c.accent,null,K)];

/* ---- bows (the archer's weapon; the quiver is kept) ---- */
// one parametric bow: half = half the length, belly = how far the tips are drawn back (y), rec = tip recurve, asym = the upper limb's length factor (a yumi), wob = gnarl, tip = tip colour
function wshBow(K,o){
  const wood=o.wood||K.c.wood, tip=o.tip||K.c.accent, n=16, pts=[], up=o.asym||1;
  const Y=(s)=>o.belly*s*s-(o.rec||0)*Math.pow(Math.max(0,Math.abs(s)-0.7),2)*11+(o.wob||0)*Math.sin(s*9);
  for(let i=0;i<=n;i++){ const s=-1+2*i/n, z=s*o.half*(s>0?up:1); pts.push([0,Y(s),z]); }
  const th=o.thick||0.02, limb=sweepTube(pts,t=>th*(1-0.45*Math.abs(2*t-1)),6,{cap:'round',rings:n*2});
  const ends=[pts[0],pts[n]], parts=[pc(limb,(x,y,z,c)=>{ c.set(Math.abs(z)>o.half*0.86?tip:wood); K.TR(c,z,'limb'); })];
  for(const e of ends) parts.push(wshP(csph(th*1.5,6,5).translate(0,e[1],e[2]),tip,null,K));
  const strCol=o.string||0xe8e4dc; parts.push(pc(cyl(0.003,0.003,Math.hypot(pts[n][2]-pts[0][2],pts[n][1]-pts[0][1]),3).rotateZ(Math.PI/2).rotateY(Math.PI/2).translate(0,(pts[0][1]+pts[n][1])/2,(pts[0][2]+pts[n][2])/2),c=>c.set(strCol)));
  parts.push(wshP(cyl(0.028,0.028,0.12,6).rotateX(Math.PI/2),K.c.grip,'grip',K));
  for(const [px,py,pz,r,col] of (o.extra||[])) parts.push(wshP(csph(r,6,5).translate(px,py,pz),col,null,K));
  return parts;
}
WPN_SHAPES.bow.longbow=K=>wshBow(K,{half:0.5,belly:0.085,thick:0.017});
WPN_SHAPES.bow.horn=K=>wshBow(K,{half:0.34,belly:0.09,thick:0.03,rec:0.4,wood:K.c.grip,tip:K.c.guard});
WPN_SHAPES.bow.recurve=K=>wshBow(K,{half:0.34,belly:0.075,rec:1,thick:0.02,tip:K.c.guard});
WPN_SHAPES.bow.composite=K=>wshBow(K,{half:0.38,belly:0.13,rec:1.4,thick:0.022,tip:K.c.accent,extra:[[0,0.02,0.1,0.016,K.c.accent],[0,0.02,-0.1,0.016,K.c.accent]]});
WPN_SHAPES.bow.yumi=K=>wshBow(K,{half:0.4,belly:0.06,asym:1.5,thick:0.016,wood:K.c.wood,tip:K.c.accent});
WPN_SHAPES.bow.crescent=K=>wshBow(K,{half:0.26,belly:0.2,thick:0.026,tip:K.c.accent,wood:K.c.guard});
WPN_SHAPES.bow.branch=K=>wshBow(K,{half:0.36,belly:0.07,wob:0.02,thick:0.021,extra:[[0.02,0.05,0.2,0.026,K.c.accent],[-0.02,0.04,-0.14,0.022,K.c.accent],[0.02,0.02,0.05,0.02,K.c.accent]]});
WPN_SHAPES.bow.hoop=K=>{ const R=0.2, parts=[wshP(new THREE.TorusGeometry(R,0.014,6,26).rotateY(Math.PI/2).translate(0,R,0),K.c.wood,'limb',K)];
  for(const y of [0.14,0.24,0.34]){ const half=Math.sqrt(Math.max(0.0004,R*R-(y-R)*(y-R))); parts.push(pc(cyl(0.0025,0.0025,2*half,3).rotateZ(Math.PI/2).rotateY(Math.PI/2).translate(0,y,0),c=>c.set(0xf6e6c0))); }
  parts.push(wshP(cyl(0.03,0.03,0.12,6).rotateX(Math.PI/2),K.c.grip,'grip',K),wshP(csph(0.03,6,5).translate(0,R*2,0),K.c.accent,null,K)); return parts; };
WPN_SHAPES.bow.crossbow=K=>{ const parts=[wshP(vbox(0.045,0.5,0.05,0,-0.04,0),K.c.wood,'shaft',K),wshP(vbox(0.03,0.3,0.03,0,-0.1,0).translate(0,0,-0.03),K.c.grip,null,K),
    wshP(vbox(0.03,0.04,0.5,0,-0.27,0),K.c.guard,'limb',K),wshP(new THREE.ConeGeometry(0.012,0.06,4).rotateX(Math.PI).translate(0,-0.3,0),K.c.blade,null,K)];
  parts.push(pc(cyl(0.003,0.003,0.5,3).rotateX(Math.PI/2).translate(0,-0.02,0),c=>c.set(0xe8e4dc)));
  parts.push(wshP(vbox(0.025,0.04,0.05,0,0.09,0),K.c.accent,null,K)); return parts; };

/* ---- staves (the mage's weapon): the shaft is y 0..-L, the head at the end; glow = [y, z, radius] draws a lit orb ---- */
const wshHead=(K,L,parts,glow)=>({parts:[wshShaft(K,L,0.017)].concat(parts,[wshP(cyl(0.022,0.02,0.04,7).translate(0,-L,0),K.c.guard,null,K)]),glow:glow||null});
WPN_SHAPES.staff.crook=K=>wshHead(K,0.62,[wshP(sweepTube([[0,-0.62,0],[0,-0.68,0.0],[0,-0.74,0.04],[0,-0.73,0.11],[0,-0.67,0.13]],[0.017,0.015,0.014,0.013,0.012],6,{cap:'round',rings:14}),K.c.wood,'shaft',K),wshP(vbox(0.004,0.04,0.004,0,-0.7,0.13),K.c.grip,null,K)],[-0.74,0.13,0.035]);
WPN_SHAPES.staff.sheaf=K=>{ const parts=[]; for(let i=0;i<9;i++){ const a=i/8*2-1; parts.push(wshP(sweepTube([[0,-0.52,0],[a*0.03,-0.62,a*0.02],[a*0.08,-0.76,a*0.05]],[0.006,0.008,0.003],4,{cap:'round',rings:6}),i%2?K.c.grip:K.c.accent,null,K)); }
  parts.push(wshP(cyl(0.032,0.026,0.04,8).translate(0,-0.56,0),K.c.grip,'grip',K)); return wshHead(K,0.52,parts,null); };
WPN_SHAPES.staff.banner=K=>wshHead(K,0.72,[wshP(vbox(0.012,0.012,0.26,0,-0.66,0),K.c.guard,null,K),wshP(vbox(0.006,0.2,0.2,0,-0.78,0.12),K.c.accent,'rim',K),wshP(new THREE.ConeGeometry(0.022,0.05,4).rotateX(Math.PI).translate(0,-0.76,0),K.c.guard,null,K)],[-0.8,0,0.025]);
WPN_SHAPES.staff.lantern=K=>wshHead(K,0.6,[wshP(sweepTube([[0,-0.6,0],[0,-0.66,0.03],[0,-0.68,0.09]],[0.014,0.013,0.012],5,{cap:'round',rings:8}),K.c.guard,null,K),
  wshP(cyl(0.05,0.04,0.02,6).translate(0,-0.75,0.1),K.c.guard,null,K),wshP(cyl(0.012,0.05,0.04,6).translate(0,-0.69,0.1),K.c.guard,null,K),wshP(cyl(0.04,0.05,0.02,6).translate(0,-0.84,0.1),K.c.guard,null,K)],[-0.8,0.1,0.034]);
WPN_SHAPES.staff.star=K=>wshHead(K,0.42,[wshP(new THREE.OctahedronGeometry(0.1,0).scale(0.22,1,0.55).translate(0,-0.52,0),K.c.accent,null,K),wshP(new THREE.OctahedronGeometry(0.1,0).scale(0.22,0.55,1).translate(0,-0.52,0),K.c.accent,null,K),wshP(new THREE.OctahedronGeometry(0.1,0).scale(0.22,0.8,0.8).rotateX(0.78).translate(0,-0.52,0),K.c.guard,null,K)],[-0.52,0,0.03]);
WPN_SHAPES.staff.ankh=K=>wshHead(K,0.6,[wshRing(K,0.045,0.011,K.c.guard,[0,-0.74,0]),wshP(vbox(0.012,0.1,0.012,0,-0.67,0),K.c.guard,null,K),wshP(vbox(0.012,0.012,0.12,0,-0.66,0),K.c.guard,null,K)],[-0.74,0,0.022]);
WPN_SHAPES.staff.bell=K=>wshHead(K,0.64,[wshP(new THREE.LatheGeometry([[0,0],[0.02,0.0],[0.03,-0.03],[0.05,-0.07],[0.06,-0.1]].map(p=>new THREE.Vector2(p[0],p[1])),10).translate(0,-0.64,0),K.c.accent,null,K),wshP(csph(0.012,6,5).translate(0,-0.76,0),K.c.guard,null,K)],[-0.78,0,0.02]);
WPN_SHAPES.staff.key=K=>wshHead(K,0.62,[wshP(new THREE.TorusGeometry(0.055,0.012,6,14).rotateY(Math.PI/2).translate(0,-0.7,0),K.c.guard,null,K),wshP(vbox(0.012,0.05,0.012,0,-0.64,0),K.c.guard,null,K),wshP(vbox(0.012,0.012,0.06,0,-0.62,0.03),K.c.guard,null,K)],[-0.7,0,0.028]);
WPN_SHAPES.staff.crescent=K=>wshHead(K,0.62,[wshP(new THREE.TorusGeometry(0.075,0.014,6,16,Math.PI*1.5).rotateZ(Math.PI*0.25).rotateY(Math.PI/2).translate(0,-0.74,0),K.c.guard,null,K)],[-0.74,0,0.036]);
WPN_SHAPES.staff.tassel=K=>{ const parts=[wshP(new THREE.ConeGeometry(0.024,0.06,6).rotateX(Math.PI).translate(0,-0.66,0),K.c.guard,null,K)]; for(let i=0;i<5;i++){ const a=i/4*2-1; parts.push(wshP(sweepTube([[0,-0.7,0],[a*0.02,-0.76,a*0.02],[a*0.03,-0.84,a*0.028]],[0.004,0.004,0.003],4,{cap:'round',rings:5}),K.c.accent,null,K)); }
  return wshHead(K,0.62,parts,[-0.66,0,0.024]); };
WPN_SHAPES.staff.feather=K=>wshHead(K,0.62,[wshP(csph(0.1,8,6).scale(0.06,1.4,0.32).translate(0,-0.74,0.04).rotateX(0.2),K.c.accent,null,K),wshRing(K,0.04,0.008,K.c.guard,[0,-0.68,-0.02])],[-0.68,-0.02,0.03]);
WPN_SHAPES.staff.rune=K=>wshHead(K,0.6,[wshP(new THREE.IcosahedronGeometry(0.075,0).scale(0.8,1.15,0.8).translate(0,-0.7,0),K.c.accent,null,K),wshP(vbox(0.012,0.1,0.012,0,-0.7,-0.058),K.c.guard,null,K)],[-0.7,-0.06,0.02]);
