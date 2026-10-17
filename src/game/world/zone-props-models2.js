//@ Zone dressing models, part 2: the Hoarfrost Reach's, the Greyspine's, the Sunscar's and the Gloamhorn's props (ice, mines, tombs, wrecks, gravestones, lamps) and the ruins' pieces
/* Agent map: more zpDef kinds (see zone-props-models.js for the helpers and the kind fields). The ruin pieces (ruinwall, ruincol, ruincolfall, ruinarch, ruinslab, ruinblock, ruinbase) are painted
   pale and neutral: zone-props.js tints them per land with the instance colour (mossy green in the forest, white in the Reach, sandy in the Sunscar, near black in the Gloamhorn).
   Used by: zone-props.js. Test: node tools/zoneprops-smoke.js. */
/* ---- the Hoarfrost Reach ---- */
zpDef('iceshard',{w:1.2,hgt:2.8,sink:0.2,rad:0.6,cast:true,gen:()=>zpSpire(0xa8d4f0,0xeaf8ff,5,2.6,0.5,true)});
zpDef('iceshard_big',{w:2.0,hgt:5.0,sink:0.3,rad:1.0,cast:true,gen:()=>zpSpire(0x94c4e8,0xe8f6ff,5,4.8,0.9,true)});
zpDef('icepillar',{w:1.0,hgt:5.4,sink:0.3,rad:0.7,cast:true,gen:()=>merge([zpCyl(0.62,0.78,4.6,6,0,0,0,0xbcdcf0,{top:ZP_SNOW,k:0.4}),zpCyl(0.5,0.62,0.9,6,0.05,4.5,0,0xd4ecfa,{rz:0.35})])});
zpDef('frozenboat',{mat:'flat',w:1.8,hgt:1.2,sink:0.1,rad:0.7,gen:()=>merge([paint(new THREE.CylinderGeometry(0.7,0.7,3.2,8,1,true,0,Math.PI).rotateZ(Math.PI/2).scale(1,0.8,0.8),zpShade(0x5a4a3a,ZP_SNOW,0.6)),zpBox(3.3,0.1,0.14,0,0.02,0,ZP_DARK),zpBox(0.1,0.1,1.2,0.4,0.55,0,ZP_WOOD),zpBox(0.1,0.1,1.2,-0.7,0.5,0,ZP_WOOD)])});
zpDef('huntertent',{w:2.0,hgt:2.0,rad:1.3,cast:true,gen:()=>merge([zpPrism(1.5,2.8,0,0,0,0xc8b898,{top:ZP_SNOW,k:0.55}),zpBox(0.04,0.9,0.5,1.4,0,0,0x2a1e14),zpCyl(0.04,0.04,2.3,4,1.45,0,0,ZP_WOOD,{rz:0.25}),zpCyl(0.04,0.04,2.3,4,-1.45,0,0,ZP_WOOD,{rz:-0.25})])});
zpDef('dryrack',{w:1.5,hgt:2.0,rad:0.2,gen:()=>merge([zpCyl(0.05,0.06,1.9,5,-1.3,0,0,ZP_WOOD),zpCyl(0.05,0.06,1.9,5,1.3,0,0,ZP_WOOD),zpBox(2.8,0.08,0.08,0,1.6,0,ZP_DARK),...[-0.7,0,0.7].map(x=>zpBox(0.5,0.9,0.04,x,0.7,0,x?ZP_HIDE:0xa88a62))])});
zpDef('trophypole',{w:0.6,hgt:3.6,rad:0.2,gen:()=>merge([zpCyl(0.06,0.09,3.0,5,0,0,0,ZP_WOOD),zpBlob(0.17,1,0.9,1.2,0,3.15,0,ZP_BONE),zpCyl(0.025,0.04,0.6,4,0.15,3.2,0,ZP_BONE,{rz:-0.7}),zpCyl(0.025,0.04,0.6,4,-0.15,3.2,0,ZP_BONE,{rz:0.7}),zpCyl(0.02,0.03,0.4,4,0.4,3.6,0,ZP_BONE,{rz:-0.2})])});
zpDef('windpole',{w:0.8,hgt:3.2,rad:0.2,tilt:0.05,gen:()=>merge([zpCyl(0.07,0.1,3.0,5,0,0,0,ZP_WOOD,{rz:0.35}),zpBox(0.8,0.35,0.03,0.9,2.5,0,0x8a3a2a,{rz:-0.2})])});
zpDef('barrowmound',{w:3.2,hgt:3.0,sink:0.2,rad:2.4,cast:true,gen:()=>merge([zpDome(3.0,0.5,12,0,0,0,0x6a8a4a,{top:ZP_SNOW,k:0.4}),zpBox(0.4,1.5,0.5,-0.7,0,2.45,0x6a6a72),zpBox(0.4,1.5,0.5,0.7,0,2.45,0x6a6a72),zpBox(1.9,0.4,0.55,0,1.4,2.45,0x6a6a72,{top:ZP_SNOW,k:0.5}),zpBox(1.0,1.4,0.3,0,0,2.4,0x0c0a08)])});
zpDef('gravestone_frost',{w:0.6,hgt:1.2,rad:0.3,tilt:0.1,gen:()=>merge([zpBox(0.7,0.95,0.2,0,0,0,0x7d858c,{top:ZP_SNOW,k:0.6}),zpBlob(0.35,1,0.7,0.3,0,0.95,0,0x7d858c,{top:ZP_SNOW,k:0.6})])});
/* ---- the Greyspine ---- */
zpDef('drystone',{w:2.0,hgt:1.2,rad:0.5,gen:()=>merge([...[0,1,2,3,4,5,6].map(i=>zpBox(0.8,0.55+0.1*((i*5)%3),0.55,(i-3)*0.72,0,0,0x8a8680,{ry:Math.sin(i*2.3)*0.12,top:0x7a9a58,k:0.3})),...[1,3,5].map(i=>zpBox(0.7,0.3,0.5,(i-3)*0.72,0.6,0,0x9a968e,{top:0x7a9a58,k:0.3}))])});
zpDef('haystack',{w:1.3,hgt:2.2,rad:0.9,gen:()=>merge([zpCyl(1.0,1.2,1.1,8,0,0,0,ZP_STRAW),zpCyl(0.02,1.0,1.0,8,0,1.05,0,0xc4a860)])});
zpDef('sheepcote',{w:2.4,hgt:2.0,rad:1.4,cast:true,gen:()=>merge([zpBox(3.2,1.6,0.4,0,0,-1.0,0x8a867e),zpBox(0.4,1.3,2.2,-1.4,0,0,0x8a867e),zpBox(0.4,1.3,2.2,1.4,0,0,0x8a867e),zpBox(3.6,0.15,2.8,0,1.5,0,0x6a5a48,{rx:0.15,top:ZP_SNOW,k:0.3})])});
zpDef('crystal',{w:1.2,hgt:2.6,sink:0.2,rad:0.6,gen:()=>zpSpire(0x7aa8e8,0xe0e8ff,5,2.4,0.45,true)});
zpDef('quartz',{w:1.2,hgt:2.6,sink:0.2,rad:0.6,gen:()=>zpSpire(0xe0d0d8,0xffffff,5,2.4,0.45,true)});
zpDef('minecart',{w:1.6,hgt:1.4,rad:0.8,gen:()=>merge([zpBox(1.4,0.7,0.9,0,0.3,0,0x5a4a40),zpBox(1.2,0.05,0.7,0,1.02,0,0x1e1612),zpBlob(0.45,1.3,0.5,0.9,0,1.0,0,0x8a6038),...[[-0.5,-0.5],[0.5,-0.5],[-0.5,0.5],[0.5,0.5]].map(([a,b])=>zpCyl(0.18,0.18,0.08,8,a,0.15,b*0.9,ZP_IRON,{rx:Math.PI/2})),zpBox(0.1,0.08,4.2,-0.45,0,-0.4,0x4a3a30),zpBox(0.1,0.08,4.2,0.45,0,-0.4,0x4a3a30)])});
zpDef('mineframe',{w:1.8,hgt:2.8,rad:0.4,cast:true,gen:()=>merge([zpBox(0.28,2.5,0.28,-1.1,0,0,ZP_DARK),zpBox(0.28,2.5,0.28,1.1,0,0,ZP_DARK),zpBox(2.7,0.3,0.32,0,2.4,0,ZP_WOOD),zpBox(1.9,2.2,0.2,0,0,-0.2,0x0e0c0a),zpBlob(0.5,1.3,0.6,1,1.5,0.25,0.5,0x6a6460)])});
zpDef('orepile',{w:1.3,hgt:1.0,sink:0.1,rad:0.7,gen:()=>merge([zpBlob(0.8,1.3,0.7,1,0,0.3,0,0x6a6a70),zpBlob(0.5,1.2,0.7,1,0.9,0.2,0.4,0x76767c),...[0,1,2,3].map(i=>zpBlob(0.12,1,0.8,1,Math.sin(i*2)*0.5,0.55,Math.cos(i*2)*0.35,i%2?0xc87a40:0xe0b040))])});
zpDef('nest',{w:1.6,hgt:0.7,sink:0.05,gen:()=>merge([zpCyl(1.0,1.1,0.2,10,0,0,0,ZP_STRAW),...[0,1,2,3,4,5,6,7,8,9].map(i=>zpCyl(0.06,0.06,1.4,4,Math.sin(i*0.628)*1.15,0.15+0.05*(i%3),Math.cos(i*0.628)*1.15,0x7a5a3a,{rz:Math.PI/2,ry:i*0.628+Math.PI/2})),...[0,1,2].map(i=>zpBlob(0.28,0.85,1.15,0.85,Math.sin(i*2.1)*0.35,0.4,Math.cos(i*2.1)*0.35,0xe8e0c8)),zpBlob(0.14,1,0.5,2.2,0.8,0.25,0.6,ZP_BONE)])});
zpDef('menhir',{w:0.9,hgt:3.4,rad:0.55,cast:true,tilt:0.05,gen:()=>merge([zpBox(0.9,3.2,0.7,0,0,0,0x84807a,{top:0x7a9a58,k:0.35,rz:0.05}),zpBox(0.5,0.4,0.5,0.1,3.15,0.05,0x84807a,{rz:0.3})])});
zpDef('sinkhole',{w:2.6,hgt:0.4,sink:0.05,gen:()=>merge([zpCyl(2.0,2.4,0.06,12,0,0,0,0x16120e),...[0,1,2,3,4,5,6,7].map(i=>zpBlob(0.45,1.2,0.7,1,Math.sin(i*0.785)*2.3,0.15,Math.cos(i*0.785)*2.3,0x5a5a60))])});
zpDef('granitepile',{w:2.0,hgt:2.0,sink:0.3,rad:1.4,gen:()=>merge([zpBlob(1.4,1.2,0.85,1,0,0.7,0,0x6a6a70),zpBlob(0.9,1,0.8,1,1.5,0.4,0.4,0x76767c),zpBlob(0.7,1,0.8,1,-1.0,0.4,0.7,0x626268)])});
/* ---- the Sunscar ---- */
zpDef('waterjar',{w:0.6,hgt:1.3,rad:0.3,tilt:0.04,gen:()=>zpLathe([[0.01,0],[0.35,0],[0.55,0.3],[0.6,0.6],[0.4,0.95],[0.25,1.05],[0.3,1.2]],10,0xb8683a)});
zpDef('djinnjar',{w:1.0,hgt:2.2,rad:0.5,cast:true,tilt:0.04,gen:()=>merge([zpLathe([[0.01,0],[0.6,0],[0.95,0.5],[1.0,1.0],[0.7,1.6],[0.4,1.9],[0.45,2.05]],12,0x2e7a8a),zpCyl(0.5,0.5,0.14,10,0,2.02,0,0xd0a840),zpBlob(0.2,1,1,1,0,2.3,0,0xd0a840)])});
zpDef('reedhut',{w:2.0,hgt:3.0,rad:1.5,cast:true,gen:()=>zpHut(0xc8b070,0xa89050,0.9,'')});
zpDef('hoodoo',{w:1.5,hgt:4.0,sink:0.3,rad:1.0,cast:true,gen:()=>merge([zpCyl(0.8,1.1,1.2,8,0,0,0,0xc0764a),zpCyl(0.5,0.62,1.4,8,0,1.15,0,0xd89a62),zpCyl(0.7,0.5,0.5,8,0,2.5,0,0xc0764a),zpBlob(1.0,1.2,0.55,1.2,0,3.2,0,0x8a5a3a)])});
zpDef('saltcrust',{w:1.6,hgt:1.2,sink:0.05,gen:()=>merge([zpBlob(1.0,1.3,0.12,1,0,0.08,0,0xf0e8e0),zpBlob(0.7,1.2,0.12,1,1.1,0.06,0.5,0xe6dcd4),zpSpire(0xf0e8e0,0xffffff,3,0.9,0.18,true)])});
zpDef('sunskull',{w:1.0,hgt:1.2,gen:()=>merge([zpDome(1.0,0.2,8,0,0,0,0xd2a868),zpBlob(0.35,1,0.85,1.3,0,0.4,0,ZP_BONE),zpCyl(0.04,0.08,0.7,5,0.3,0.45,0,ZP_BONE,{rz:-1.0}),zpCyl(0.04,0.08,0.7,5,-0.3,0.45,0,ZP_BONE,{rz:1.0})])});
zpDef('raidertent',{w:2.4,hgt:2.4,rad:1.6,cast:true,gen:()=>merge([zpCyl(1.5,2.2,0.7,4,0,0,0,0xe0d0b0,{ry:Math.PI/4}),zpCyl(0.8,1.5,0.7,4,0,0.7,0,0x9a2a22,{ry:Math.PI/4}),zpCyl(0.02,0.8,0.8,4,0,1.4,0,0xe0d0b0,{ry:Math.PI/4}),zpBox(0.8,0.9,0.1,0,0,1.6,0x1e1612),zpCyl(0.03,0.03,0.7,4,0,2.2,0,ZP_DARK)])});
zpDef('sandlantern',{w:0.5,hgt:3.2,rad:0.2,gen:()=>zpLamp(0x6a4a30,0,3.0,true),glow:()=>zpLampGlow(0xffc060,3.0,true)});
zpDef('sarcophagus',{w:1.4,hgt:1.2,rad:0.8,cast:true,gen:()=>merge([zpBox(1.0,0.7,2.4,0,0,0,0xcbb48a),zpBox(0.92,0.3,2.3,0.04,0.7,0,0xd8c496,{ry:0.04}),zpBlob(0.3,1,0.8,1,0.04,1.0,0.8,0xd8c496),zpBox(1.02,0.08,0.6,0,0.55,0.4,0xe8c050)])});
zpDef('wormcrater',{w:3.4,hgt:0.7,sink:0.05,gen:()=>merge([zpCyl(1.6,3.6,0.5,12,0,0,0,0xd8b878),zpCyl(0.9,1.1,0.1,10,0,0.45,0,0x1e1810)])});
zpDef('glassspire',{w:1.3,hgt:3.6,sink:0.2,rad:0.6,cast:true,gen:()=>zpSpire(0x58c8c8,0xe8ffff,4,3.4,0.5,true)});
zpDef('glassshard',{w:0.8,hgt:1.2,sink:0.1,gen:()=>zpSpire(0x7ad8d0,0xf0ffff,3,1.1,0.25,true)});
zpDef('obelisk',{w:1.0,hgt:5.0,sink:0.3,rad:0.7,cast:true,gen:()=>merge([zpCyl(0.45,0.7,4.2,4,0,0,0,0xcbb48a,{ry:Math.PI/4}),zpCyl(0,0.45,0.6,4,0,4.2,0,0xe8c050,{ry:Math.PI/4}),zpBox(1.3,0.3,1.3,0,0,0,0xb89a68),...[0.8,1.6,2.4].map(y=>zpBox(0.34,0.05,0.04,0,y,0.5-0.1*y/2.4,0x6a4a30))])});
zpDef('brazier',{w:0.8,hgt:1.8,rad:0.3,gen:()=>merge([...[0,1,2].map(i=>zpCyl(0.03,0.05,1.2,4,Math.sin(i*2.1)*0.28,0,Math.cos(i*2.1)*0.28,0x5a4a30,{rz:Math.sin(i*2.1)*0.2,rx:-Math.cos(i*2.1)*0.2})),paint(new THREE.SphereGeometry(0.5,9,4,0,TAU,Math.PI/2,Math.PI/2).translate(0,1.3,0),zpShade(0x6a4a2a))]),
  glow:()=>merge([zpCyl(0,0.3,0.7,6,0,1.3,0,0xff8a20),zpCyl(0,0.16,0.9,6,0,1.3,0,0xffd060)])});
zpDef('sunaltar',{w:1.8,hgt:1.2,rad:1.2,gen:()=>merge([zpBox(2.6,0.4,2.6,0,0,0,0xcbb48a),zpBox(1.8,0.4,1.8,0,0.4,0,0xd8c496),zpCyl(0.6,0.6,0.06,10,0,0.8,0,0xe0b040)]),glow:()=>zpCyl(0.4,0.4,0.03,10,0,0.86,0,0xffe080)});
/* ---- the Gloamhorn ---- */
zpDef('gravestone',{w:0.6,hgt:1.2,rad:0.3,tilt:0.1,gen:()=>merge([zpBox(0.7,0.95,0.2,0,0,0,0x50525a,{top:0x3a5040,k:0.6}),zpBlob(0.35,1,0.7,0.3,0,0.95,0,0x50525a,{top:0x3a5040,k:0.6})])});
zpDef('lamppost',{w:0.6,hgt:3.6,rad:0.2,gen:()=>zpLamp(0x2a2c32,0,3.2,true),glow:()=>zpLampGlow(0xffd890,3.2,true)});
zpDef('lamppost_green',{w:0.6,hgt:3.6,rad:0.2,gen:()=>zpLamp(0x2a2c32,0,3.2,true),glow:()=>zpLampGlow(0x80f0b0,3.2,true)});
zpDef('anchor',{w:1.2,hgt:1.8,sink:0.2,rad:0.3,gen:()=>merge([zpCyl(0.07,0.07,1.9,6,0,0.2,0,0x5a3a2a),zpBox(1.0,0.08,0.08,0,1.9,0,0x5a3a2a),paint(new THREE.TorusGeometry(0.6,0.07,5,10,Math.PI).rotateZ(Math.PI).translate(0,0.4,0),zpShade(0x5a3a2a)),paint(new THREE.TorusGeometry(0.12,0.03,4,8).translate(0,2.2,0),zpShade(0x6a4a3a))]).rotateZ(0.5)});
zpDef('hullribs',{w:2.6,hgt:2.2,sink:0.1,rad:0.8,gen:()=>zpRibs(6,1.8,0.1,0x3a2e26,0x2e241e)});
zpDef('ribs',{w:2.2,hgt:1.9,sink:0.1,rad:0.6,gen:()=>zpRibs(7,1.5,0.12,ZP_BONE)});
zpDef('wyrmribs',{w:3.4,hgt:3.2,sink:0.2,rad:1.0,cast:true,gen:()=>zpRibs(8,2.6,0.2,0xd8d0bc)});
zpDef('gallows',{w:1.6,hgt:3.8,rad:0.35,cast:true,gen:()=>merge([zpBox(0.26,3.6,0.26,-1.0,0,0,ZP_DARK),zpBox(2.6,0.22,0.22,0.2,3.4,0,ZP_DARK),zpCyl(0.05,0.05,1.2,4,-0.65,2.2,0,ZP_DARK,{rz:0.9}),zpCyl(0.025,0.025,1.0,4,0.9,2.4,0,0x8a7a58),paint(new THREE.TorusGeometry(0.16,0.03,4,8).rotateX(Math.PI/2).translate(0.9,2.35,0),zpShade(0x8a7a58)),zpBox(1.4,0.25,1.2,0.3,0,0,0x3a2e26)])});
zpDef('sunkenmast',{w:1.4,hgt:5.2,rad:0.3,tilt:0.04,gen:()=>merge([zpCyl(0.12,0.18,5,7,0,0,0,ZP_DARK,{rz:0.35}),zpBox(2.4,0.1,0.1,1.2,3.3,0,ZP_DARK,{rz:0.35}),zpBox(1.5,1.4,0.04,1.3,2.2,0,0x3a3a3e,{rz:0.35}),zpBlob(0.16,1,0.7,1,0.3,0.15,0.1,0x8a8a80)])});
zpDef('gargoyle',{w:1.0,hgt:3.0,rad:0.6,cast:true,gen:()=>merge([zpBox(1.0,0.8,1.0,0,0,0,0x6a6c72),zpBlob(0.45,1,1.2,0.8,0,1.4,0,0x56585e),zpBlob(0.28,1,0.9,1,0,2.0,0.3,0x56585e),zpCyl(0,0.07,0.3,4,0.14,2.3,0.25,0x3a3c42),zpCyl(0,0.07,0.3,4,-0.14,2.3,0.25,0x3a3c42),zpBox(1.3,0.9,0.08,0.9,1.4,-0.2,0x4a4c52,{rz:0.5}),zpBox(1.3,0.9,0.08,-0.9,1.4,-0.2,0x4a4c52,{rz:-0.5})])});
zpDef('crypt',{w:2.0,hgt:2.8,rad:1.6,cast:true,gen:()=>merge([zpBox(2.6,1.6,2.4,0,0,0,0x5a5c64,{top:0x3a5040,k:0.4}),zpCyl(0.02,2.0,0.9,4,0,1.6,0,0x3a3c44,{ry:Math.PI/4}),zpBox(0.8,1.2,0.2,0,0,1.15,0x0c0a0c),zpBox(1.4,0.18,0.5,0,0,1.4,0x6a6c74)])});
zpDef('weepingstatue',{w:0.8,hgt:2.6,rad:0.4,cast:true,gen:()=>merge([zpBox(0.9,0.5,0.9,0,0,0,0x7a7c82),zpCyl(0.18,0.5,1.5,8,0,0.5,0,0x9a9ca2),zpBlob(0.35,1,0.4,0.9,0,2.0,0,0x9a9ca2),zpBlob(0.2,1,1.1,1,0,2.3,0.05,0x9a9ca2),zpDome(0.27,0.9,8,0,2.25,-0.02,0x8a8c92),zpCyl(0.06,0.08,0.55,5,0.18,1.65,0.28,0x9a9ca2,{rz:-0.7,rx:-0.6})])});
zpDef('sirenrock',{w:1.5,hgt:3.2,sink:0.3,rad:0.8,cast:true,gen:()=>zpSpire(0x3a5a62,0x6a9aa0,3,3.0,0.8,false)});
/* ---- ruins: neutral pale stone, tinted per land ---- */
const ZP_RS=0x9c9a92, ZP_RT=0xd0d8c0;
zpDef('ruinwall',{w:2.4,hgt:2.8,sink:0.2,rad:0,cast:true,gen:()=>merge([...[[0,1.6],[0.7,2.4],[1.4,1.2],[2.1,2.8],[2.8,0.9],[3.5,1.5]].map(([x,hh],i)=>zpBox(0.72,hh,0.62,x-1.75,0,0,ZP_RS,{top:ZP_RT,k:0.6,ry:Math.sin(i*3.1)*0.06})),zpBlob(0.4,1.3,0.6,1,2.0,0.2,0.9,ZP_RS,{top:ZP_RT,k:0.5,d:0})])});
zpDef('ruincol',{w:0.9,hgt:3.4,sink:0.2,rad:0.5,cast:true,gen:()=>merge([zpBox(1.0,0.3,1.0,0,0,0,ZP_RS,{top:ZP_RT,k:0.5}),zpCyl(0.38,0.42,2.7,8,0,0.3,0,ZP_RS),zpBox(0.5,0.3,0.5,0.1,3.0,0,ZP_RS,{rz:0.35,top:ZP_RT,k:0.5})])});
zpDef('ruincolfall',{w:1.8,hgt:1.0,sink:0.1,rad:0.45,gen:()=>merge([paint(cyl(0.38,0.4,2.4,8).rotateZ(Math.PI/2).translate(0,0.4,0),zpShade(ZP_RS,ZP_RT,0.5)),paint(cyl(0.36,0.38,0.8,8).rotateZ(Math.PI/2).rotateY(0.3).translate(1.9,0.38,0.5),zpShade(ZP_RS,ZP_RT,0.5)),zpBox(0.6,0.4,0.5,-1.3,0,0.8,ZP_RS,{top:ZP_RT,k:0.5})])});
zpDef('ruinarch',{w:2.0,hgt:3.6,sink:0.2,rad:0.5,cast:true,gen:()=>merge([zpBox(0.7,3.2,0.7,-1.1,0,0,ZP_RS,{top:ZP_RT,k:0.5}),zpBox(0.7,2.4,0.7,1.1,0,0,ZP_RS,{top:ZP_RT,k:0.5,rz:0.03}),zpBox(2.0,0.55,0.7,-0.45,3.2,0,ZP_RS,{top:ZP_RT,k:0.5,rz:-0.06}),zpBlob(0.4,1.2,0.6,1,1.8,0.2,0.9,ZP_RS),zpBlob(0.35,1.2,0.6,1,-0.4,0.15,-1.2,ZP_RS)])});
zpDef('ruinslab',{w:1.8,hgt:0.3,sink:0.12,gen:()=>merge([zpBox(1.5,0.2,1.4,0,0,0,0x8c8a82,{ry:0.1,top:ZP_RT,k:0.5}),zpBox(1.3,0.2,1.5,1.6,0,0.3,0x94928a,{ry:-0.15,top:ZP_RT,k:0.5}),zpBox(1.2,0.2,1.3,-0.2,0,1.5,0x908e86,{ry:0.3,top:ZP_RT,k:0.5})])});
zpDef('ruinblock',{w:0.9,hgt:0.9,sink:0.1,rad:0.4,gen:()=>merge([zpBox(0.8,0.6,0.7,0,0,0,ZP_RS,{ry:0.4,top:ZP_RT,k:0.5}),zpBox(0.6,0.5,0.6,0.9,0,0.4,ZP_RS,{ry:-0.3,rz:0.1,top:ZP_RT,k:0.5})])});
zpDef('ruinbase',{w:3.4,hgt:2.4,sink:0.2,rad:0,cast:true,gen:()=>merge([...[0,1,2,3,4,5,6,7].filter(i=>i!==3).map(i=>zpBox(1.6,0.9+1.4*Math.abs(Math.sin(i*2.7)),0.6,Math.sin(i*0.785)*3,0,Math.cos(i*0.785)*3,ZP_RS,{ry:i*0.785,top:ZP_RT,k:0.6}))])});
