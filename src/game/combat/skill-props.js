//@ Props a skill puts into the world when its text says so: a doll, a bell, an anvil, a sandglass, a powder keg, a lantern, a spear, a hand out of the ground... small low-poly models that drop, rise, plant, hover or waltz
/* Agent map. Doc: docs/skillkits/VISUALS.md. A prop is a THREE.Group built at the origin (feet on y 0, about a metre tall, front = +z) by SKP_BUILD[kind](cols); skpSpawn places it and plays an animation:
     anim 'rise' (up out of the ground), 'drop' (falls from fall metres, thuds), 'plant' (falls tilted and stays stuck, wobbles), 'hover' (floats h metres up and turns), 'waltz' (circles a centre at radius orb, w rad/s, with hops and turns),
     'collapse' (stands in a ring and closes in on the centre). Options: size, life, cols (three colours), delay, h, fall, thud (default on for drop and plant), face (yaw), a0 (waltz start angle).
   skpSpawnSet(L,c,a,o) is the recipe verb `prop`: {kind, n, arr:'one'|'ring'|'line'|'arc'|'scatter', r, len, stagger, ...spawn options}. Geometry and materials are shared and cached (never disposed): a prop costs a few meshes;
   at most 40 are alive (18 on phones). Called from: skill-vis.js (recipes), looks. Test: client-smoke (every kind is built, placed and gone again). */
const SKP={list:[],geo:Object.create(null),mat:Object.create(null)};
const skpG=(name,mk)=>SKP.geo[name]||(SKP.geo[name]=mk());
function skpM(c,o){   // a material per colour and kind: lit and flat-shaded, or a glow (additive), or a ghost (translucent)
  const k=c+(o?'|'+(o.glow?'g':'')+(o.op||''):''); let m=SKP.mat[k]; if(m) return m;
  m=o&&o.glow?new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o.op||0.8,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}):
    new THREE.MeshPhongMaterial({color:c,flatShading:true,shininess:o&&o.sh||16,transparent:!!(o&&o.op),opacity:o&&o.op||1,side:THREE.DoubleSide});
  return (SKP.mat[k]=m);
}
function skpMesh(g,geo,c,x,y,z,o){   // o: rx ry rz (rotation), sx sy sz (scale), glow, op
  const m=new THREE.Mesh(geo,skpM(c,o)); m.position.set(x||0,y||0,z||0);
  if(o){ m.rotation.set(o.rx||0,o.ry||0,o.rz||0); if(o.sx||o.sy||o.sz) m.scale.set(o.sx||1,o.sy||1,o.sz||1); }
  g.add(m); return m;
}
const skpLathe=(name,pts,seg)=>skpG(name,()=>new THREE.LatheGeometry(pts.map(q=>new THREE.Vector2(q[0],q[1])),seg||12));
const SKP_SKIN=0xf3e6d6, SKP_IRON=0x3a3d42, SKP_WOOD=0x6a4a2c, SKP_BRONZE=0xb88a3a, SKP_GOLD=0xe0b84a;
const SKP_BUILD={
  doll:cols=>{ const g=new THREE.Group(), [dress,hair,bow]=cols;   // a porcelain doll: round head, painted cheeks, a flared dress, bobbed hair and a bow
    skpMesh(g,skpG('dollSkirt',()=>new THREE.ConeGeometry(0.34,0.52,10)),dress,0,0.3,0);
    skpMesh(g,skpG('dollTorso',()=>new THREE.CylinderGeometry(0.1,0.15,0.24,8)),dress,0,0.64,0);
    skpMesh(g,skpG('dollNeck',()=>new THREE.CylinderGeometry(0.04,0.04,0.07,6)),SKP_SKIN,0,0.79,0);
    skpMesh(g,skpG('dollHead',()=>new THREE.SphereGeometry(0.17,12,10)),SKP_SKIN,0,0.93,0);
    skpMesh(g,skpG('dollHair',()=>new THREE.SphereGeometry(0.19,12,8,0,TAU,0,Math.PI*0.64)),hair,0,0.94,-0.02);
    skpMesh(g,skpG('dollBang',()=>new THREE.BoxGeometry(0.3,0.05,0.08)),hair,0,1.0,0.14);
    const arms=[]; for(const sx of [-1,1]){
      skpMesh(g,skpG('dollEye',()=>new THREE.SphereGeometry(0.026,6,5)),0x1a1418,sx*0.065,0.94,0.158);
      skpMesh(g,skpG('dollCheek',()=>new THREE.CircleGeometry(0.032,8)),0xe89a9a,sx*0.105,0.9,0.15,{ry:sx*0.5});
      skpMesh(g,skpG('dollBun',()=>new THREE.SphereGeometry(0.07,8,6)),hair,sx*0.17,1.0,-0.02);
      skpMesh(g,skpG('dollBow',()=>new THREE.ConeGeometry(0.055,0.11,5)),bow,sx*0.05,1.1,0.02,{rz:-sx*Math.PI/2});
      const a=skpMesh(g,skpG('dollArm',()=>new THREE.CylinderGeometry(0.03,0.028,0.3,6).translate(0,-0.15,0)),SKP_SKIN,sx*0.17,0.72,0.02,{rz:sx*0.7}); arms.push(a); }
    skpMesh(g,skpG('dollBowKnot',()=>new THREE.SphereGeometry(0.03,6,5)),bow,0,1.1,0.02);
    g.userData.tick=age=>{ arms[0].rotation.z=-0.7-Math.sin(age*6)*0.35; arms[1].rotation.z=0.7+Math.sin(age*6+1)*0.35; };   // the arms swing with the dance
    return g; },
  bell:cols=>{ const g=new THREE.Group(), body=new THREE.Group(); g.add(body);   // a great bronze bell on a crown; it swings and the clapper knocks
    skpMesh(body,skpLathe('bellBody',[[0.05,0.0],[0.5,0.02],[0.44,0.16],[0.32,0.5],[0.22,0.8],[0.1,0.95],[0.04,1.0]]),cols[0]||SKP_BRONZE,0,0.05,0);
    skpMesh(body,skpG('bellLip',()=>new THREE.TorusGeometry(0.5,0.035,5,16).rotateX(Math.PI/2)),cols[1]||SKP_GOLD,0,0.07,0);
    skpMesh(body,skpG('bellCrown',()=>new THREE.TorusGeometry(0.1,0.03,5,8)),SKP_IRON,0,1.08,0);
    const cl=skpMesh(body,skpG('bellClap',()=>new THREE.SphereGeometry(0.09,8,6)),SKP_IRON,0,0.1,0);
    g.userData.tick=(age)=>{ body.rotation.z=Math.sin(age*9)*0.22*Math.exp(-age*1.4); cl.position.x=Math.sin(age*9+1.3)*0.16*Math.exp(-age*1.2); };
    return g; },
  anvil:cols=>{ const g=new THREE.Group(), hot=cols[1]||0xff8a3a;   // an anvil with a hot face
    skpMesh(g,skpG('anvBase',()=>new THREE.BoxGeometry(0.8,0.22,0.46)),SKP_IRON,0,0.11,0);
    skpMesh(g,skpG('anvWaist',()=>new THREE.BoxGeometry(0.4,0.28,0.3)),SKP_IRON,0,0.36,0);
    skpMesh(g,skpG('anvFace',()=>new THREE.BoxGeometry(1.0,0.2,0.5)),0x50545a,0,0.6,0);
    skpMesh(g,skpG('anvHorn',()=>new THREE.ConeGeometry(0.25,0.55,8)),0x50545a,0.76,0.6,0,{rz:-Math.PI/2});
    const top=skpMesh(g,skpG('anvTop',()=>new THREE.PlaneGeometry(0.95,0.46).rotateX(-Math.PI/2)),hot,0,0.705,0,{glow:1,op:0.75});
    g.userData.tick=age=>{ top.material.opacity=0.55+Math.sin(age*5)*0.2; };
    return g; },
  sandglass:cols=>{ const g=new THREE.Group(), glass=0xbfe6f0, sand=cols[1]||0xe8c46a;   // a tall sandglass in a frame, the sand running down
    for(const y of [0.06,1.54]) skpMesh(g,skpG('sgCap',()=>new THREE.CylinderGeometry(0.55,0.55,0.12,12)),cols[0]||SKP_WOOD,0,y,0);
    for(let i=0;i<3;i++){ const a=i/3*TAU; skpMesh(g,skpG('sgPost',()=>new THREE.CylinderGeometry(0.04,0.04,1.5,5)),cols[0]||SKP_WOOD,Math.sin(a)*0.5,0.8,Math.cos(a)*0.5); }
    skpMesh(g,skpG('sgTop',()=>new THREE.ConeGeometry(0.44,0.7,12,1,true)),glass,0,1.15,0,{rx:Math.PI,glow:1,op:0.4});
    skpMesh(g,skpG('sgBot',()=>new THREE.ConeGeometry(0.44,0.7,12,1,true)),glass,0,0.45,0,{glow:1,op:0.4});
    const up=skpMesh(g,skpG('sgSandUp',()=>new THREE.ConeGeometry(0.36,0.55,10)),sand,0,1.1,0,{rx:Math.PI}), dn=skpMesh(g,skpG('sgSandDn',()=>new THREE.ConeGeometry(0.3,0.4,10)),sand,0,0.25,0,{sy:0.2});
    const grain=skpMesh(g,skpG('sgGrain',()=>new THREE.CylinderGeometry(0.012,0.012,0.7,4)),sand,0,0.8,0,{glow:1,op:0.9});
    g.userData.tick=(age,k)=>{ const f=Math.min(1,k); up.scale.y=Math.max(0.1,1-f*0.8); dn.scale.y=0.2+f*0.9; grain.visible=f<0.98; };
    return g; },
  keg:cols=>{ const g=new THREE.Group();   // a powder keg with iron bands and a lit fuse
    skpMesh(g,skpLathe('kegBody',[[0,0],[0.26,0.0],[0.31,0.12],[0.34,0.28],[0.31,0.44],[0.26,0.56],[0,0.56]]),cols[0]||SKP_WOOD,0,0,0);
    for(const y of [0.1,0.46]) skpMesh(g,skpG('kegBand',()=>new THREE.TorusGeometry(0.3,0.022,4,14).rotateX(Math.PI/2)),SKP_IRON,0,y,0,{sx:1.05,sz:1.05});
    skpMesh(g,skpG('kegFuse',()=>new THREE.CylinderGeometry(0.012,0.012,0.22,4)),0xd8cfa0,0.05,0.67,0,{rz:0.3});
    const sp=new THREE.Object3D(); sp.position.set(0.11,0.77,0); g.add(sp);
    g.userData.tick=age=>{ if(Math.random()<0.5){ const w=new THREE.Vector3(); sp.getWorldPosition(w); fxpAdd(w.x,w.y,w.z,AR(-0.6,0.6),AR(0.6,1.6),AR(-0.6,0.6),cols[1]||0xffb040,0.12,0.3,{g:4,white:0.4}); } };
    return g; },
  lantern:cols=>{ const g=new THREE.Group();   // a paper lantern: warm glow, dark caps, a tassel
    skpMesh(g,skpG('lanBody',()=>new THREE.CylinderGeometry(0.2,0.2,0.4,10)),cols[0]||0xffc070,0,0.4,0,{glow:1,op:0.85});
    skpMesh(g,skpG('lanCore',()=>new THREE.SphereGeometry(0.1,8,6)),0xffffff,0,0.4,0,{glow:1,op:0.9});
    for(const y of [0.2,0.6]) skpMesh(g,skpG('lanCap',()=>new THREE.CylinderGeometry(0.15,0.15,0.05,10)),cols[1]||0x2e2a2a,0,y,0);
    skpMesh(g,skpG('lanTassel',()=>new THREE.CylinderGeometry(0.01,0.025,0.2,4)),cols[2]||0xd4a83a,0,0.08,0);
    g.userData.tick=age=>{ g.children[1].scale.setScalar(1+Math.sin(age*8)*0.12); };
    return g; },
  shield:cols=>{ const g=new THREE.Group();   // a round ghost shield on edge, with a boss and a rim
    skpMesh(g,skpG('shDisc',()=>new THREE.CylinderGeometry(0.5,0.5,0.06,18).rotateX(Math.PI/2)),cols[0]||0xcdbf8a,0,0.55,0,{glow:1,op:0.55});
    skpMesh(g,skpG('shRim',()=>new THREE.TorusGeometry(0.5,0.035,5,20)),cols[1]||0xffffff,0,0.55,0,{glow:1,op:0.8});
    skpMesh(g,skpG('shBoss',()=>new THREE.SphereGeometry(0.11,8,6)),cols[1]||0xffffff,0,0.55,0.04,{glow:1,op:0.9});
    return g; },
  terrace:cols=>{ const g=new THREE.Group();   // a stepped wall of ghost stone, three tiers
    for(let i=0;i<3;i++) skpMesh(g,skpG('terStep'+i,()=>new THREE.BoxGeometry(1.8-i*0.45,0.36,0.6)),cols[i%2]||0xe8c46a,0,0.18+i*0.36,-i*0.12,{glow:1,op:0.5});
    for(let i=0;i<3;i++) skpMesh(g,skpG('terEdge'+i,()=>new THREE.BoxGeometry(1.8-i*0.45,0.03,0.62)),cols[2]||0xffffff,0,0.36+i*0.36,-i*0.12,{glow:1,op:0.8});
    return g; },
  sarcophagus:cols=>{ const g=new THREE.Group(), lid=new THREE.Group(); g.add(lid);   // a sarcophagus of sand and gold; the lid slams shut
    skpMesh(g,skpG('sarBox',()=>new THREE.BoxGeometry(0.8,0.46,1.9)),cols[0]||0xd8c28a,0,0.23,0);
    skpMesh(g,skpG('sarTrim',()=>new THREE.BoxGeometry(0.84,0.06,1.94)),cols[1]||SKP_GOLD,0,0.46,0);
    skpMesh(lid,skpG('sarLid',()=>new THREE.BoxGeometry(0.76,0.14,1.86)),cols[0]||0xd8c28a,0,0.07,0);
    skpMesh(lid,skpG('sarFace',()=>new THREE.SphereGeometry(0.2,8,6)),cols[1]||SKP_GOLD,0,0.16,-0.6,{sy:0.5,sz:1.3});
    skpMesh(lid,skpG('sarStripe',()=>new THREE.BoxGeometry(0.1,0.02,1.7)),cols[2]||0x2f55a0,0,0.15,0);
    lid.position.set(-0.4,0.46,0); const hing=lid.children; hing.forEach(m=>m.position.x+=0.4);
    g.userData.tick=age=>{ const open=age<0.45?1.1*(1-age/0.45):0; lid.rotation.z=open; };
    return g; },
  lens:cols=>{ const g=new THREE.Group();   // a huge lens in a brass ring on a handle
    skpMesh(g,skpG('lenGlass',()=>new THREE.CircleGeometry(0.9,24)),cols[0]||0xfff0b0,0,1.2,0,{glow:1,op:0.35});
    skpMesh(g,skpG('lenRing',()=>new THREE.TorusGeometry(0.9,0.07,6,28)),cols[1]||SKP_BRONZE,0,1.2,0);
    skpMesh(g,skpG('lenHandle',()=>new THREE.CylinderGeometry(0.05,0.06,0.9,6)),cols[1]||SKP_BRONZE,0,0.35,0);
    return g; },
  spear:cols=>{ const g=new THREE.Group();   // a long spear with a leaf head and a feather
    skpMesh(g,skpG('spShaft',()=>new THREE.CylinderGeometry(0.03,0.03,2.2,5)),cols[0]||SKP_WOOD,0,1.1,0);
    skpMesh(g,skpG('spHead',()=>new THREE.ConeGeometry(0.09,0.45,5)),cols[1]||0xd8dde0,0,2.4,0);
    skpMesh(g,skpG('spBind',()=>new THREE.CylinderGeometry(0.045,0.045,0.12,6)),cols[2]||0xb5532f,0,2.1,0);
    return g; },
  hand:cols=>{ const g=new THREE.Group(), c=cols[0]||0x5a4a3a;   // a hand and forearm reaching out of the ground, the fingers working
    skpMesh(g,skpG('hdArm',()=>new THREE.CylinderGeometry(0.1,0.16,1.0,7)),c,0,0.5,0);
    skpMesh(g,skpG('hdPalm',()=>new THREE.BoxGeometry(0.3,0.1,0.26)),c,0,1.05,0);
    const fs=[]; for(let i=0;i<4;i++){ const f=skpMesh(g,skpG('hdFinger',()=>new THREE.CylinderGeometry(0.03,0.025,0.3,5).translate(0,0.15,0)),c,-0.11+i*0.073,1.1,0.1); fs.push(f); }
    const th=skpMesh(g,skpG('hdThumb',()=>new THREE.CylinderGeometry(0.035,0.03,0.22,5).translate(0,0.11,0)),c,0.18,1.08,0.02,{rz:-0.9}); fs.push(th);
    g.userData.tick=age=>{ fs.forEach((f,i)=>{ f.rotation.x=0.5+Math.sin(age*7+i)*0.5; }); };
    return g; },
  sheaf:cols=>{ const g=new THREE.Group();   // a bound sheaf of straw
    skpMesh(g,skpG('shfBody',()=>new THREE.ConeGeometry(0.26,0.9,9)),cols[0]||0xe0b95a,0,0.45,0,{rx:Math.PI});
    skpMesh(g,skpG('shfTop',()=>new THREE.ConeGeometry(0.22,0.3,9)),cols[0]||0xe0b95a,0,1.0,0);
    skpMesh(g,skpG('shfBand',()=>new THREE.TorusGeometry(0.2,0.025,4,12).rotateX(Math.PI/2)),cols[1]||0xb5532f,0,0.55,0);
    return g; },
  geyser:cols=>{ const g=new THREE.Group();   // a column of water (or fire) that shoots up and falls back
    const col=skpMesh(g,skpG('gsCol',()=>new THREE.CylinderGeometry(0.4,0.6,1,10,1,true).translate(0,0.5,0)),cols[0]||0x9fe8ee,0,0,0,{glow:1,op:0.45});
    skpMesh(g,skpG('gsCore',()=>new THREE.CylinderGeometry(0.15,0.25,1,8,1,true).translate(0,0.5,0)),0xffffff,0,0,0,{glow:1,op:0.6});
    g.userData.tick=(age,k)=>{ const h=Math.max(0.05,Math.sin(Math.min(1,age/0.9)*Math.PI)*(g.userData.h||3.5)); g.children[0].scale.set(1,h,1); g.children[1].scale.set(1,h*0.9,1); if(Math.random()<0.6) fxpAdd(g.position.x+AR(-0.3,0.3),g.position.y+h,g.position.z+AR(-0.3,0.3),AR(-1,1),AR(1,3),AR(-1,1),cols[0]||0x9fe8ee,0.2,0.5,{g:7,white:0.4}); };
    return g; },
  banner:cols=>{ const g=new THREE.Group(), flag=new THREE.Group(); g.add(flag);   // a war banner on a pole
    skpMesh(g,skpG('bnPole',()=>new THREE.CylinderGeometry(0.05,0.07,3.6,6)),0x4a3a2c,0,1.8,0);
    skpMesh(flag,skpG('bnCloth',()=>new THREE.PlaneGeometry(1.5,1.1).translate(0.75,0,0)),cols[0]||0xb8432a,0,3.0,0);
    skpMesh(flag,skpG('bnTrim',()=>new THREE.PlaneGeometry(1.5,0.16).translate(0.75,0,0.01)),cols[1]||SKP_GOLD,0,2.5,0);
    g.userData.tick=age=>{ flag.rotation.y=Math.sin(age*4)*0.3; };
    return g; },
  spotlight:cols=>{ const g=new THREE.Group();   // a cone of light from above on a bright pool
    skpMesh(g,skpG('spCone',()=>new THREE.CylinderGeometry(0.35,2.2,9,16,1,true).translate(0,4.5,0)),cols[0]||0xfff0b0,0,0,0,{glow:1,op:0.2});
    skpMesh(g,skpG('spPool',()=>new THREE.CircleGeometry(2.2,24).rotateX(-Math.PI/2)),cols[0]||0xfff0b0,0,0.06,0,{glow:1,op:0.45});
    return g; },
  sun:cols=>{ const g=new THREE.Group();   // a small sun: a hot ball with spokes
    skpMesh(g,skpG('sunBall',()=>new THREE.SphereGeometry(0.7,14,10)),cols[0]||0xfff0b0,0,0,0,{glow:1,op:0.95});
    skpMesh(g,skpG('sunHalo',()=>new THREE.SphereGeometry(1.1,14,10)),cols[1]||0xffd36b,0,0,0,{glow:1,op:0.3});
    for(let i=0;i<8;i++) skpMesh(g,skpG('sunRay',()=>new THREE.ConeGeometry(0.08,1.0,4).translate(0,0.9,0)),cols[1]||0xffd36b,0,0,0,{rz:i/8*TAU,glow:1,op:0.6});
    g.userData.tick=age=>{ g.children[1].scale.setScalar(1+Math.sin(age*6)*0.1); g.rotation.z=age*0.6; };
    return g; },
  moon:cols=>{ const g=new THREE.Group();   // a pale crescent-lit moon
    skpMesh(g,skpG('mnBall',()=>new THREE.SphereGeometry(1.1,16,12)),cols[0]||0xf4efd8,0,0,0,{glow:1,op:0.9});
    skpMesh(g,skpG('mnHalo',()=>new THREE.SphereGeometry(1.6,14,10)),cols[1]||0xe0b95a,0,0,0,{glow:1,op:0.22});
    return g; },
  gate:cols=>{ const g=new THREE.Group();   // a tall dark gate: two pillars, a crossbar, and a glowing mouth
    for(const sx of [-1,1]) skpMesh(g,skpG('gtPost',()=>new THREE.BoxGeometry(0.34,3.2,0.34)),cols[0]||0x2a2230,sx*1.25,1.6,0);
    skpMesh(g,skpG('gtBar',()=>new THREE.BoxGeometry(3.4,0.34,0.4)),cols[0]||0x2a2230,0,3.3,0);
    skpMesh(g,skpG('gtCap',()=>new THREE.BoxGeometry(3.9,0.2,0.5)),cols[1]||0x7a2a3a,0,3.55,0);
    skpMesh(g,skpG('gtMouth',()=>new THREE.PlaneGeometry(2.2,3.1)),cols[2]||0xff4a6a,0,1.6,0,{glow:1,op:0.45});
    g.userData.tick=age=>{ g.children[3].material.opacity=0.35+0.15*Math.sin(age*9); };
    return g; },
  cloud:cols=>{ const g=new THREE.Group();   // a low thundercloud with a flickering belly
    for(const [x,y,z,r] of [[0,0,0,1.5],[1.3,-0.2,0.2,1.1],[-1.3,-0.15,-0.1,1.2],[0.4,0.45,-0.3,1.05],[-0.5,0.3,0.6,0.9]]) skpMesh(g,skpG('cdPuff'+r,()=>new THREE.SphereGeometry(r,10,8)),cols[0]||0x5a6070,x,y,z,{op:0.92});
    skpMesh(g,skpG('cdFlash',()=>new THREE.SphereGeometry(1.7,10,8).scale(1.6,0.45,1.1)),cols[1]||0xfff6b0,0,-0.7,0,{glow:1,op:0.2});
    g.userData.tick=age=>{ const f=Math.sin(age*13)*Math.sin(age*5.3); g.children[5].material.opacity=f>0.55?0.8:0.15; g.rotation.y=age*0.2; };
    return g; },
  mirror:cols=>{ const g=new THREE.Group();   // a standing oval mirror in a gold frame, throwing light
    skpMesh(g,skpG('mrGlass',()=>new THREE.CircleGeometry(0.55,20).scale(0.8,1.2,1)),cols[0]||0xfff0d0,0,1.1,0,{glow:1,op:0.5});
    skpMesh(g,skpG('mrFrame',()=>new THREE.TorusGeometry(0.55,0.05,5,22).scale(0.8,1.2,1)),cols[1]||SKP_GOLD,0,1.1,0);
    skpMesh(g,skpG('mrFoot',()=>new THREE.CylinderGeometry(0.04,0.08,0.4,5)),cols[1]||SKP_GOLD,0,0.2,0);
    return g; },
  icewall:cols=>{ const g=new THREE.Group();   // a jagged slab of ice
    skpMesh(g,skpG('iwSlab',()=>new THREE.OctahedronGeometry(0.5,0).scale(0.7,2.2,0.35)),cols[0]||0xcfeaff,0,1.0,0,{glow:1,op:0.55});
    skpMesh(g,skpG('iwCore',()=>new THREE.OctahedronGeometry(0.4,0).scale(0.45,1.8,0.2)),0xffffff,0,1.0,0,{glow:1,op:0.5});
    return g; },
  fissure:cols=>{ const g=new THREE.Group();   // a crack in the ground, glowing, that opens along its length
    const dark=skpMesh(g,skpG('fiDark',()=>new THREE.PlaneGeometry(0.7,1).rotateX(-Math.PI/2).translate(0,0.05,-0.5)),0x1a1410,0,0,0,{op:0.9});
    const glow=skpMesh(g,skpG('fiGlow',()=>new THREE.PlaneGeometry(0.3,1).rotateX(-Math.PI/2).translate(0,0.07,-0.5)),cols[0]||0xff8a3a,0,0,0,{glow:1,op:0.8});
    g.userData.tick=(age,k)=>{ const l=(g.userData.len||12)*Math.min(1,age/0.5); dark.scale.z=glow.scale.z=Math.max(0.1,l); glow.material.opacity=0.6+Math.sin(age*9)*0.2; };
    return g; }
};
const SKP_DEFAULT_COLS=[0xcfa860,0x2e2a2a,0xd4a83a];
function skpSpawn(kind,x,z,o){   // o: size, life, anim, cols, delay, h, fall, thud, face, y, cx cz orb w a0 bob collapse
  const mk=SKP_BUILD[kind]; if(!mk) return null; o=o||{};
  if(SKP.list.length>=(LOW?18:40)) skpDrop(SKP.list.shift());
  const g=mk(o.cols&&o.cols.length?o.cols:SKP_DEFAULT_COLS); g.scale.setScalar(o.size||1); if(o.h3!==undefined) g.userData.h=o.h3; if(o.len!==undefined) g.userData.len=o.len;
  g.rotation.y=o.face||0; g.visible=false; scene.add(g);
  const q={g,kind,o,x,z,age:-(o.delay||0),life:o.life||2.2,gy:getH(x,z)+(o.y||0),landed:false,anim:o.anim||'rise'}; SKP.list.push(q); return q;
}
function skpDrop(q){ if(q&&q.g.parent) q.g.parent.remove(q.g); }
function skpStep(dt){
  for(let i=SKP.list.length-1;i>=0;i--){
    const q=SKP.list[i], o=q.o, g=q.g; q.age+=dt; if(q.age<0) continue;
    if(q.age>=q.life){ skpDrop(q); SKP.list.splice(i,1); continue; }
    g.visible=true; const age=q.age, k=age/q.life, an=q.anim;
    let px=q.x, pz=q.z, py=q.gy;
    if(an==='waltz'||an==='collapse'){ const dir=(o.w||1)>=0?1:-1, ang=(o.a0||0)+age*(o.w||1), orb=an==='collapse'?o.orb*(1-Math.pow(Math.max(0,(k-0.55)/0.45),2)):o.orb;
      px=o.cx+Math.sin(ang)*orb; pz=o.cz+Math.cos(ang)*orb; py=getH(px,pz)+(o.bob===false?0:Math.abs(Math.sin(age*7+(o.a0||0)))*0.12)+(o.y||0);
      g.rotation.y=an==='collapse'?ang:Math.PI/2*dir+ang+Math.sin(age*3+(o.a0||0))*0.7; }
    else if(an==='rise'){ const e=Math.min(1,age/0.4); py=q.gy-1.5*(1-e*(2-e)); }
    else if(an==='drop'||an==='plant'){ const tf=o.fallT||0.28, H=o.fall||9;
      if(age<tf){ py=q.gy+H*(1-(age/tf)*(age/tf)); if(an==='plant') g.rotation.z=(o.tilt||0.5)*(1-age/tf); }
      else{ py=q.gy; if(!q.landed){ q.landed=true; if(o.thud!==false){ spawnRingAt(q.x,q.gy,q.z,(o.size||1)*2.4,0xffffff); fxxDust(q.x,q.gy,q.z,6,(o.size||1)*1.2,0x8a7a60); if(Math.hypot(P.x-q.x,P.z-q.z)<22) camShake=Math.max(camShake,0.18); if(typeof cSfx!=='undefined') cSfx.thunk({x:q.x,y:q.gy,z:q.z}); } }
        if(an==='plant') g.rotation.z=(o.tilt||0.5)*0.08*Math.sin((age-tf)*14)*Math.exp(-(age-tf)*3); } }
    else if(an==='hover'){ py=q.gy+(o.h||2)+Math.sin(age*2)*0.1; g.rotation.y+=dt*(o.spin||0.6); }
    g.position.set(px,py,pz);
    if(g.userData.tick) g.userData.tick(age,k);
    const out=Math.min(1,(q.life-age)/0.3), inn=Math.min(1,age/0.12+0.05), s=(o.size||1)*Math.max(0.01,out)*(an==='rise'||an==='hover'?inn:1); g.scale.setScalar(s);
  }
}
// the recipe verb `prop`: n of them in an arrangement round (or ahead of) the anchor a
function skpSpawnSet(L,c,a,o){
  const kind=o.kind, n=Math.max(1,o.n|0||1), arr=o.arr||(n>1?'ring':'one'), cols=(o.cols||[0,1,2]).map(q=>skvCol(L,q)), RR=o.r!==undefined?o.r:c.r?c.r*(o.rk||0.6):3;   // RR: the ring's radius (a share of the zone it belongs to)
  const base={size:o.size,life:o.life!==undefined?o.life:c.dur?Math.max(0.6,c.dur-0.1):undefined,anim:o.anim,cols,h:o.h,fall:o.fall,fallT:o.fallT,thud:o.thud,tilt:o.tilt,spin:o.spin,h3:o.h3,len:o.len,y:o.y};
  for(let i=0;i<n;i++){
    const d=Object.assign({},base,{delay:(o.delay||0)+i*(o.stagger||0)});
    if(arr==='one'){ d.face=c.face; skpSpawn(kind,a.x,a.z,d); continue; }
    if(arr==='ring'){ const ang=i/n*TAU, R=RR;
      if(o.anim==='waltz'||o.anim==='collapse'){ Object.assign(d,{cx:a.x,cz:a.z,orb:R,w:o.w||1.1,a0:ang}); skpSpawn(kind,a.x+Math.sin(ang)*R,a.z+Math.cos(ang)*R,d); }
      else{ d.face=ang+(o.inwards===false?0:Math.PI); skpSpawn(kind,a.x+Math.sin(ang)*R,a.z+Math.cos(ang)*R,d); } continue; }
    if(arr==='line'){ const len=o.len2||RR||8, f=n>1?i/(n-1):0.5; d.face=c.face; skpSpawn(kind,a.x+c.fx*len*f,a.z+c.fz*len*f,d); continue; }
    if(arr==='arc'){ const sp=o.arc||0.9, ang=Math.atan2(c.fx,c.fz)+(n>1?(i/(n-1)-0.5)*sp*2:0), R=RR; d.face=ang; skpSpawn(kind,a.x+Math.sin(ang)*R,a.z+Math.cos(ang)*R,d); continue; }
    const ang=AR(0,TAU), R=Math.sqrt(Math.random())*RR; d.face=AR(0,TAU); skpSpawn(kind,a.x+Math.sin(ang)*R,a.z+Math.cos(ang)*R,d);   // scatter
  }
}
