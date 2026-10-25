//@ Zone dressing models, part 3: Amber Reach's props (thorn thickets, kopje stacks, reed clumps, termite spires and mounds, resin crystals, the anvil rock, smouldering ash, song posts, grey stones, mooring posts, red terraces)
/* Agent map: more zpDef kinds (helpers and fields: zone-props-models.js); the themes that place them are the a37..a45 rows and ZP_BOSS.aboss41 / aboss45 in zone-props.js. 'smolder' is also a fire for zone-fire.js
   (smoke and embers: ZPF_KIND.smolder, one marked line in `put` of genZoneProps). The song post is where the Kin carve a song into a post of baobab wood: bands of light notches. Every kind is a few
   hundred triangles. Used by: zone-props.js. Test: node tools/zoneprops-smoke.js. Names: zp... , kinds named without a prefix are registry keys (ZP_KIND). */
const zpEnd=(rz,ry,L)=>{ const x=-L*Math.sin(rz); return [x*Math.cos(ry),L*Math.cos(rz),-x*Math.sin(ry)]; };   // where a limb of length L (zpCyl with rz, ry) ends
zpDef('thornbush',{w:1.3,hgt:1.8,rad:0.6,gen:()=>{   // a dry thicket: eight grey-brown branches leaning out, each ending in a flat tuft of dead leaves
  const p=[]; for(let i=0;i<8;i++){ const ry=i*2.4, rz=0.45+0.4*((i*0.37)%1), L=1.1+0.6*((i*0.61)%1), e=zpEnd(rz,ry,L);
    p.push(zpCyl(0.025,0.055,L,4,0,0,0,0x5a4a34,{rz,ry}),zpBlob(0.3+0.07*(i%3),1,0.5,1,e[0],e[1]-0.05,e[2],i%2?0x8a8a4a:0x9a8a50,{d:0})); }
  return merge(p); }});
zpDef('kopje',{w:2.0,hgt:2.4,sink:0.3,rad:1.3,cast:true,gen:()=>merge([   // a granite outcrop: rounded boulders stacked, flat on top, straw-coloured moss where rain runs
  zpBlob(1.2,1,0.75,0.9,0,0.5,0,0x8c8070,{top:0xb0a070,k:0.5}),zpBlob(0.9,1,0.7,1,1.3,0.4,0.5,0x978a78,{top:0xb0a070,k:0.5}),zpBlob(0.8,1,0.8,1,-1.0,0.35,0.7,0x80766a,{top:0xb0a070,k:0.5}),zpBlob(0.7,1.1,0.55,0.9,0.1,1.25,-0.2,0x9a8e7c,{top:0xb8a878,k:0.5})])});
zpDef('reedclump',{mat:'flat',w:0.9,hgt:2.2,sink:0.05,gen:()=>{   // tall reeds by the water: sixteen blades, a few with a brown seed head
  const p=[]; for(let i=0;i<16;i++){ const ry=i*2.4, rz=0.05+0.28*((i*0.43)%1), L=1.2+1.0*((i*0.71)%1), c=i%3===0?0x9aa850:i%3===1?0x6f9a40:0x82a848;
    p.push(zpCyl(0.0,0.035,L,3,Math.sin(i*1.7)*0.25,0,Math.cos(i*1.7)*0.25,c,{rz,ry}));
    if(i%5===0){ const e=zpEnd(rz,ry,L*0.82); p.push(zpCyl(0.05,0.05,0.28,5,e[0]+Math.sin(i*1.7)*0.25,e[1],e[2]+Math.cos(i*1.7)*0.25,0x5a3a22,{rz,ry})); } }
  return merge(p); }});
zpDef('termitespire',{w:1.8,hgt:7.5,sink:0.3,rad:1.1,cast:true,gen:()=>{   // a clay cathedral: a ridged lathe tapering to a point, buttresses at the foot, dark vent slits
  const spire=zpLathe([[1.6,0],[1.5,1.2],[1.2,2.7],[0.95,4.1],[0.72,5.5],[0.45,6.6],[0.15,7.3],[0,7.5]],9,0xb4693c,{top:0xcf8c56});
  const p=[spire]; for(let i=0;i<4;i++){ const a=i*1.57+0.4; p.push(zpBlob(0.7,0.7,2.0,0.7,Math.sin(a)*1.25,1.5,Math.cos(a)*1.25,0xa85e34,{d:0})); }
  for(let i=0;i<5;i++){ const a=i*1.3, y=1.2+i*1.0, r=1.5-i*0.22; p.push(zpBox(0.16,0.5,0.1,Math.sin(a)*r,y,Math.cos(a)*r,0x3a2010,{ry:a})); }
  return merge(p); }});
zpDef('termitemound',{w:1.5,hgt:2.0,sink:0.2,rad:0.9,cast:true,gen:()=>merge([zpDome(1.2,0.95,9,0,0,0,0xb4693c,{top:0xcf8c56}),zpCyl(0.0,0.35,1.1,6,0.5,0.8,0.2,0xa85e34),zpCyl(0.0,0.28,0.8,6,-0.45,0.9,-0.3,0xbf7442)])});
zpDef('resincrystal',{w:1.2,hgt:2.4,sink:0.2,rad:0.6,gen:()=>zpSpire(0xd8892a,0xffd070,5,2.2,0.42,true)});   // amber resin hardened into crystals at the foot of a spire
zpDef('anvilrock',{w:2.6,hgt:3.0,sink:0.3,rad:1.4,cast:true,gen:()=>merge([   // a pedestal of dark stone with a wide flat top, an anvil: a black streak where lightning runs down it
  zpLathe([[1.3,0],[0.95,0.9],[0.7,1.7],[0.85,2.1],[2.5,2.3],[2.7,2.7],[2.3,3.0],[0,3.0]],8,0x5a5048,{top:0x7a6e64}),
  zpBox(0.22,2.0,0.1,0.55,0.2,0.62,0x1e1a18,{ry:0.7,rz:0.08})])});
zpDef('smolder',{w:1.4,hgt:0.7,sink:0.1,rad:0,gen:()=>merge([zpDome(1.3,0.28,10,0,0,0,0x2a2624),zpBlob(0.5,1,0.4,1,-0.5,0.1,0.3,0x3a3430,{d:0})]),   // a smouldering heap of ash and char; glow() is the embers (unlit)
  glow:()=>merge([0,1,2,3,4,5].map(i=>zpBlob(0.09+0.03*(i%3),1,0.5,1,Math.sin(i*2.1)*0.75,0.3,Math.cos(i*2.1)*0.75,i%2?0xff7a30:0xffb040,{d:0})))});
zpDef('songpost',{w:0.8,hgt:3.6,sink:0.2,rad:0.3,gen:()=>merge([   // a post of baobab wood with three bands of notches: a song carved so that it is remembered
  zpCyl(0.2,0.3,3.2,7,0,0,0,0x7a5a3a),zpBlob(0.3,1,0.8,1,0,3.3,0,0x8a6a44,{d:0}),
  ...[0.9,1.7,2.5].flatMap((y,k)=>[0,1,2,3,4,5].map(i=>zpBox(0.09,0.16+0.04*((i+k)%3),0.07,Math.sin(i*1.05+k)*0.27,y,Math.cos(i*1.05+k)*0.27,0xe0c890,{ry:i*1.05+k})))])});
zpDef('greystone',{w:1.3,hgt:1.7,sink:0.25,rad:0.8,cast:true,gen:()=>merge([   // a grey stone, veined pale: the Hollowed carry them, the grey spreads from them
  zpBlob(1.0,1,0.85,0.9,0,0.45,0,0x5a5a62),zpBlob(0.45,1,0.8,1,0.85,0.25,0.3,0x66666e),zpBox(0.7,0.05,0.07,-0.1,0.95,0.3,0x9a9aa8,{ry:0.5,rz:0.3}),zpBox(0.5,0.05,0.07,0.3,0.6,-0.7,0x9a9aa8,{ry:2.0,rz:-0.4})])});
zpDef('mooringpost',{w:1.0,hgt:2.0,sink:0.2,rad:0.3,gen:()=>merge([   // three posts leaning together and a coil of rope: where the ferry ties up
  zpCyl(0.09,0.12,2.0,5,0,0,0,0x6e4c2e,{rz:0.1}),zpCyl(0.09,0.12,1.9,5,0.12,0,0.05,0x5e4226,{rz:-0.12,ry:2.0}),zpCyl(0.09,0.12,1.8,5,-0.05,0,-0.1,0x7a5632,{rz:0.1,ry:4.0}),
  paint(new THREE.TorusGeometry(0.2,0.04,4,8).rotateX(Math.PI/2).translate(0.02,1.2,0),zpShade(0xc8b080))])});
zpDef('terracestone',{w:2.2,hgt:1.6,sink:0.15,rad:1.4,cast:true,gen:()=>merge([   // a stack of red sandstone slabs, narrowing, the top one pale and polished by feet and wind
  zpBox(3.4,0.5,2.6,0,0,0,0xa85a3a,{ry:0.1}),zpBox(2.6,0.5,2.0,0.1,0.5,0.1,0xb2663e,{ry:0.25}),zpBox(1.8,0.45,1.4,0,1.0,0,0xbc7246,{ry:0.4}),zpBox(1.3,0.12,1.0,0,1.45,0,0xe4cba6,{ry:0.4})])});
