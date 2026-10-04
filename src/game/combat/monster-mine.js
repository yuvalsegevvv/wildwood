//@ The powder keg model (model 'keg': Garrick's kegs in the Blackseam): a barrel of dark staves with two iron bands and a fuse that spits a spark
/* Agent map: fills MODELS.keg (registry and helpers in monster-parts.js). Used by the dungeon boss Garrick's prop (DG_BOSSES.garrick.prop in shared/dungeons/bosses.js; the family's numbers are FAM.keg).
   pal: wood (staves), band (the iron hoops), fuse (the spark's colour). A prop: it never attacks, so anim only rocks it a little. Test: tools/dungeon-boss-smoke.js (the models case builds it). */
MODELS.keg={
  geo(d,p){
    const wood=p.wood||0x6a4a2c, band=p.band||0x3a3a42, fuse=p.fuse||0xffa040, body=[];
    const stave=(x,y,z,c)=>{ const a=Math.atan2(z,x); c.set(wood).multiplyScalar(0.8+0.3*moNoise(Math.floor(a*5),y*2,0,3)); };
    body.push(moLoft([{y:0,rx:0.34,rz:0.34},{y:0.22,rx:0.42,rz:0.42},{y:0.55,rx:0.46,rz:0.46},{y:0.88,rx:0.42,rz:0.42},{y:1.0,rx:0.34,rz:0.34}],moQ(10),stave));
    body.push(pc(new THREE.CircleGeometry(0.34,10).rotateX(-Math.PI/2).translate(0,1.0,0),c=>c.set(wood).multiplyScalar(0.7)));
    for(const y of [0.2,0.82]) body.push(moLoft([{y:y-0.04,rx:0.44,rz:0.44},{y:y+0.04,rx:0.44,rz:0.44}],moQ(10),band));
    body.push(moTube([[0,1.0,0],[0.05,1.18,0.02],[0.16,1.28,0.04]],0.025,0.02,0x2a2018,5,true));   // the fuse
    body.push(moEll(0.06,0.06,0.06,0.16,1.3,0.04,fuse,null,6));                                       // its spark
    return {body:moMerge(body)};
  },
  build(d,G,M,g,P0){ P0.body=M(G.body); g.add(P0.body); },
  anim(m,dt){ const P0=m.parts; P0.body.rotation.z=Math.sin(t*7+m.ph)*0.025; }
};
