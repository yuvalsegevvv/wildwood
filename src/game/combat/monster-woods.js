//@ Treant and totem models: gnarled walking trees with faces and hands of twigs; dead, mossy, snowy, blossoming, bamboo, rock and ice kinds; the Rootwarden; the totems
/* treant: body (trunk, face, canopy), two arm pivots (aL, aR, hanging from the shoulders) and two leg pivots (lL, lR: root legs). pal.kind picks the kind: 'dead' (bare boughs),
   'moss' (ancient: stone bark, runes), 'snow', 'blossom', 'bamboo' (canes), 'rock' and 'ice' (stacked boulders / crystal), 'thorn' (the Rootwarden's thornlings); the boss
   (d.id 'boss') adds a crown of antlers, glowing runes, hanging vines and roots. totem: a stone pillar with a floating crystal (the Rootwarden's totems, Vetrmaw's warm cores). */
const moBlob=(r,x,y,z,f,amp,seed)=>{ const g=csph(1,moQ(14),moQ(10)); moLump(g,amp||0.09,2.2,seed||1); return pc(smoothN(g.scale(r,r*0.92,r).translate(x,y,z)),moCol(f)); };
MODELS.treant={
  geo(d,p){
    const G={}, W=[-1,1], k=p.kind||'tree', boss=d.id==='boss', stone=k==='rock'||k==='ice', bam=k==='bamboo', thorn=k==='thorn';
    const bark=(x,y,z,c)=>{ c.set(p.bark).multiplyScalar(0.55+0.65*vn3(x*9,y*1.6,z*9)); if(y<0.9&&!stone) moTint(c,0x3a5a2a,0.25*(1-y/0.9)); if(boss&&Math.abs(moNoise(x,y,z,3.4)-0.5)<0.03) c.set(p.eyes); };   // (the boss) glowing rune veins
    const rock=(x,y,z,c)=>{ c.set(k==='ice'?p.c2:p.c1).multiplyScalar(0.7+0.5*vn3(x*6,y*6,z*6)); if(k==='rock'&&y<1.2) c.multiplyScalar(0.8); };
    const body=[];
    if(bam){   // a bundle of canes with nodes, leafy at the top
      const cane=(x,z,h,r,lean)=>{ for(let n=0;n<h/0.42;n++){ const y0=0.4+n*0.42; body.push(moBone([x+lean*n*0.05,y0,z],[x+lean*(n+1)*0.05,y0+0.4,z],r,r*0.95,(X,Y,Z,c)=>{ c.set(p.bark).multiplyScalar(0.85+0.2*moNoise(X,Y,Z,9)); },7),moBone([x+lean*(n+1)*0.05,y0+0.39,z],[x+lean*(n+1)*0.05,y0+0.43,z],r*1.18,r*1.18,0x5a7a30,7)); } };
      for(const [x,z,h,r,l] of [[0,0,2.1,0.2,0],[0.22,0.12,1.9,0.15,0.4],[-0.22,0.1,1.9,0.15,-0.4],[0.1,-0.2,1.7,0.13,0.2],[-0.12,-0.22,1.7,0.13,-0.2]]) cane(x,z,h,r,l);
      for(let i=0;i<7;i++){ const a=i*0.9; body.push(moBlob(0.4+0.1*(i%3),Math.cos(a)*0.5,2.5+0.15*(i%3),Math.sin(a)*0.5,[p.c1,p.c2,p.c3][i%3],0.16,i)); }
    } else if(stone){   // stacked, lichened boulders
      for(const [x,y,z,r,s] of [[0,0.95,0,0.62,1],[0.05,1.55,0.02,0.58,2],[0,2.1,0.03,0.5,3],[0.55,2.2,0,0.32,4],[-0.55,2.2,0,0.32,5]]) body.push(pc(smoothN(moLump(csph(1,moQ(12),moQ(9)),0.2,2.4,s).scale(r,r*0.85,r*0.9).translate(x,y,z)),rock));
      for(let i=0;i<10;i++){ const a=i*1.9; body.push(moPatch([Math.cos(a)*0.5,1+0.3*(i%4),Math.sin(a)*0.45-0.15],[Math.cos(a),0.3,Math.sin(a)-0.3],0.14,0.06,k==='ice'?0xeaf8ff:0x6a8a3a,6)); }
      if(k==='ice') for(let i=0;i<9;i++){ const a=i*1.1; body.push(moCone([Math.cos(a)*0.4,1.8+0.25*(i%3),Math.sin(a)*0.3],[Math.cos(a),1.2,Math.sin(a)],0.55+0.2*(i%3),0.09,(x,y,z,c)=>{ c.set(p.c2).multiplyScalar(0.85+0.3*clamp((y-1.7)*0.5)); },5)); }
    } else {
      const rings=[[0.45,0.44,0.42,0],[0.75,0.5,0.47,0],[1.1,0.44,0.42,-0.02],[1.5,0.38,0.36,-0.03],[1.9,0.42,0.4,-0.02],[2.25,0.34,0.32,0],[2.42,0.2,0.2,0]];
      body.push(moLoft(rings.map(([y,rx,rz,z])=>({y,rx:rx*(thorn?0.9:1),rz,z})),moQ(20),bark));
      for(let i=0;i<8;i++){ const a=i/8*TAU+0.4; body.push(moTube([[Math.cos(a)*0.35,0.9,Math.sin(a)*0.33],[Math.cos(a)*0.62,0.42,Math.sin(a)*0.58],[Math.cos(a)*0.95,0.06,Math.sin(a)*0.9],[Math.cos(a)*1.2,0.0,Math.sin(a)*1.14]],0.14,0.05,bark,6,true)); }   // roots gripping the ground
      for(let i=0;i<5;i++){ const a=i*2.3; body.push(moPatch([Math.cos(a)*0.42,1.0+0.25*i,Math.sin(a)*0.4],[Math.cos(a),0.2,Math.sin(a)],0.13,0.07,bark,6)); }   // burls
      if(k==='dead'){ for(let i=0;i<7;i++){ const a=i*0.9; body.push(moTube([[0,2.3,0],[Math.cos(a)*0.5,2.9+0.2*(i%3),Math.sin(a)*0.5],[Math.cos(a)*0.95,3.5+0.3*(i%2),Math.sin(a)*0.9]],0.11,0.02,bark,6,true),moTube([[Math.cos(a)*0.5,2.9,Math.sin(a)*0.5],[Math.cos(a+0.7)*0.95,3.2,Math.sin(a+0.7)*0.9]],0.05,0.015,bark,5,true)); }
        for(let i=0;i<10;i++){ const a=i*1.4; body.push(moPatch([Math.cos(a)*0.8,3.1+0.3*(i%3),Math.sin(a)*0.75],[0,1,0],0.14,0.03,i%2?p.c2:p.c3,6,0.6)); } }
      else if(!thorn){
        const B=[[0,2.75,0.05,0.95,p.c1],[0.55,2.45,0.25,0.7,p.c2],[-0.55,2.5,-0.1,0.65,p.c3],[0.1,3.15,0,0.55,p.c1],[-0.2,2.55,0.5,0.55,p.c2],[0.2,2.6,-0.5,0.5,p.c3]];
        B.forEach(([x,y,z,r,c],i)=>body.push(moBlob(r,x,y,z,(X,Y,Z,cc)=>{ cc.set(c).multiplyScalar(0.7+0.5*vn3(X*4,Y*4,Z*4)+0.3*clamp((Y-y)/r)); },0.1,i+1)));
        for(let i=0;i<26;i++){ const b=B[i%B.length], a=i*2.4, e=0.3+0.6*h3(i,1,1), x=b[0]+Math.cos(a)*b[3]*Math.cos(e), y=b[1]+Math.sin(e)*b[3], z=b[2]+Math.sin(a)*b[3]*Math.cos(e);
          body.push(moPatch([x,y,z],[x-b[0],y-b[1],z-b[2]],0.16,0.05,(X,Y,Z,c)=>{ c.set(b[4]).multiplyScalar(1.25); },6,0.6)); }
        if(k==='snow'){ for(const [x,y,z,r] of [[0,3.3,0,0.7],[0.5,2.95,0.2,0.5],[-0.5,3.0,-0.1,0.45]]) body.push(moEll(r,r*0.35,r,x,y,z,0xf4f8fb,null,10)); for(let i=0;i<8;i++){ const a=i*0.8; body.push(moCone([Math.cos(a)*0.8,2.35,Math.sin(a)*0.75],[0,-1,0],0.4,0.05,0xdff4ff,4)); } }
        if(k==='blossom') for(let i=0;i<16;i++){ const a=i*2.4; body.push(moPatch([Math.cos(a)*0.9,2.4+0.1*(i%5),Math.sin(a)*0.85],[Math.cos(a),0.3,Math.sin(a)],0.08,0.015,0xfff0f6,5,0.7)); }
        if(k==='moss') for(let i=0;i<5;i++){ const a=i*1.3; body.push(moTube([[Math.cos(a)*0.4,2.3,Math.sin(a)*0.4],[Math.cos(a)*0.55,1.7,Math.sin(a)*0.5],[Math.cos(a)*0.5,1.1,Math.sin(a)*0.45]],0.05,0.02,0x4a7a3a,5,true)); }
      } else for(let i=0;i<10;i++){ const a=i*0.63; body.push(moCone([Math.cos(a)*0.38,1.0+0.15*i,Math.sin(a)*0.36],[Math.cos(a),0.4,Math.sin(a)],0.3,0.05,p.c1,4)); }   // thorns
    }
    // the face: hollow eyes with a glow, a heavy brow, a knot of a nose, a ragged mouth
    for(const sd of W){ body.push(moEll(0.13,0.1,0.08,sd*0.15,1.78,-0.36,0x0d0a08,null,8),moEll(0.06,0.06,0.04,sd*0.15,1.78,-0.41,p.eyes,null,7),moEll(0.19,0.06,0.1,sd*0.15,1.92,-0.34,stone?rock:bark,[0.2,0,-sd*0.3],7)); }
    body.push(moEll(0.05,0.1,0.06,0,1.65,-0.4,bark,null,6),moEll(0.22,0.09,0.07,0,1.42,-0.4,0x0d0a08,null,8));
    for(let i=-2;i<=2;i++) body.push(moCone([i*0.08,1.47,-0.42],[0,-1,-0.1],0.09,0.02,bark,4),moCone([i*0.08+0.04,1.37,-0.42],[0,1,-0.1],0.07,0.02,bark,4));
    if(boss) bossTreant(body,p);
    G.body=moMerge(body);
    for(const sd of W){   // an arm hanging from the shoulder: an upper branch, a forearm forking into twig fingers, a clump of leaves
      const arm=[];
      if(stone){ arm.push(pc(smoothN(moLump(csph(1,10,8),0.2,2.4,sd+5).scale(0.28,0.3,0.28).translate(0,-0.3,0)),rock),pc(smoothN(moLump(csph(1,10,8),0.2,2.4,sd+6).scale(0.24,0.26,0.24).translate(sd*0.05,-0.75,0)),rock),pc(smoothN(moLump(csph(1,10,8),0.22,2.4,sd+7).scale(0.3,0.28,0.28).translate(sd*0.08,-1.15,0)),rock)); }
      else { arm.push(moTube([[0,0,0],[sd*0.1,-0.35,0.04],[sd*0.06,-0.75,0.0],[sd*0.12,-1.02,-0.05]],0.13,0.06,bark,7,false));
        for(let i=0;i<4;i++) arm.push(moTube([[sd*0.12,-1.02,-0.05],[sd*(0.12+(i-1.5)*0.07),-1.18,-0.1],[sd*(0.12+(i-1.5)*0.12),-1.34,-0.16]],0.035,0.01,bark,5,true));
        arm.push(moBlob(0.2,sd*0.12,-1.02,0,p.c1,0.1,sd+9),moBlob(0.14,sd*0.02,-0.35,0.05,p.c2,0.1,sd+4)); }
      G[sd<0?'aL':'aR']=moMerge(arm); }
    G.leg=moMerge([moTube([[0,0,0],[0,-0.3,-0.02],[0,-0.55,-0.05]],0.18,0.13,stone?rock:bark,7,false),...[-1,0,1].map(sd=>moTube([[0,-0.52,-0.05],[sd*0.12,-0.6,-0.24],[sd*0.16,-0.62,-0.42]],0.07,0.03,stone?rock:bark,5,true))]);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body);
    const nd=(x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); o.add(mesh); g.add(o); return o; };
    P0.aL=nd(-0.45,2.0,0,M(G.aL)); P0.aR=nd(0.45,2.0,0,M(G.aR)); P0.aL.rotation.z=-0.45; P0.aR.rotation.z=0.45;
    P0.lL=nd(-0.2,0.62,0,M(G.leg)); P0.lR=nd(0.2,0.62,0,M(G.leg));
  },
  anim(m,dt,sp){
    const P0=m.parts; m.ph+=dt*sp*2.2;
    const amp=Math.min(1,sp)*0.4;
    P0.lL.rotation.x=Math.sin(m.ph)*amp; P0.lR.rotation.x=-Math.sin(m.ph)*amp;
    const atk=m.act?clamp(m.act.t/m.act.dur):0, armA=m.act?(atk<0.5?2.4*atk*2:2.4-(atk-0.5)*2*2.6):0;
    P0.aL.rotation.x=m.act?armA:Math.sin(m.ph)*amp; P0.aR.rotation.x=m.act?armA:-Math.sin(m.ph)*amp;
    P0.body.rotation.z=Math.sin(t*0.8+m.ph)*0.03;
  }
};
// the Rootwarden: a crown of antlers, roots sprawled round its feet, vines and toadstools, a glowing heart in the chest
function bossTreant(body,p){
  const glow=(x,y,z,c)=>{ c.set(p.eyes).multiplyScalar(0.8+0.3*moNoise(x,y,z,6)); }, bk=(x,y,z,c)=>{ c.set(p.bark).multiplyScalar(0.6+0.6*vn3(x*9,y*1.6,z*9)); };
  for(let i=0;i<7;i++){ const a=(i-3)*0.5, up=3.1; body.push(moTube([[Math.sin(a)*0.3,up,0],[Math.sin(a)*0.7,up+0.6,0.05],[Math.sin(a)*1.0+Math.sign(a)*0.2,up+1.3+0.2*Math.cos(a),0.1]],0.13,0.03,bk,6,true),
    moTube([[Math.sin(a)*0.7,up+0.6,0.05],[Math.sin(a)*1.1,up+1.0,-0.2]],0.06,0.015,bk,5,true),moTube([[Math.sin(a)*0.7,up+0.6,0.05],[Math.sin(a)*1.1,up+0.95,0.35]],0.06,0.015,bk,5,true)); }
  for(let i=0;i<9;i++){ const a=i/9*TAU+0.3; body.push(moTube([[Math.cos(a)*0.6,0.25,Math.sin(a)*0.6],[Math.cos(a)*1.3,0.15,Math.sin(a)*1.3],[Math.cos(a+0.4)*2.1,0.04,Math.sin(a+0.4)*2.1]],0.13,0.03,bk,6,true)); }
  body.push(moEll(0.22,0.3,0.12,0,1.05,-0.38,0x08040c,null,10),moEll(0.12,0.18,0.08,0,1.05,-0.42,glow,null,9));   // the hollow in the chest and the heart in it
  for(const sd of [-1,1]){ body.push(moTube([[sd*0.5,2.2,-0.1],[sd*0.68,1.6,-0.2],[sd*0.6,1.0,-0.1],[sd*0.7,0.5,-0.15]],0.045,0.02,0x2a4a2a,5,true),moEll(0.16,0.1,0.16,sd*0.55,2.35,0.1,p.c2,null,8),moEll(0.1,0.1,0.1,sd*0.5,2.15,0.15,0xe8dcd0,null,5)); }
  for(let i=0;i<10;i++){ const a=i*0.75, y=1.0+0.13*i; body.push(moCone([Math.cos(a)*0.42,y,Math.sin(a)*0.4],[Math.cos(a),0.3,Math.sin(a)],0.35,0.06,glow,4)); }   // thorns lit from inside
}
const moStone=(x,y,z,c)=>{ c.set(0x807a70).multiplyScalar(0.72+0.4*h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))); };
MODELS.totem={
  geo(d,p){
    const G={}, gl=p.crystal||0x7af0a0, band=p.band||0x6af08a, body=[];
    body.push(pc(vbox(1.0,0.3,1.0,0,0.15,0),moStone),moLoft([{y:0.3,rx:0.42,rz:0.42},{y:0.9,rx:0.34,rz:0.34},{y:1.6,rx:0.3,rz:0.3},{y:2.1,rx:0.36,rz:0.36},{y:2.3,rx:0.3,rz:0.3}],moQ(8),(x,y,z,c)=>{ moStone(x,y,z,c); if(((y*2.2)%1+1)%1<0.14) c.set(band); }));
    body.push(moEll(0.26,0.28,0.06,0,1.75,-0.3,moStone,null,8),moEll(0.07,0.05,0.04,-0.1,1.85,-0.35,gl,null,6),moEll(0.07,0.05,0.04,0.1,1.85,-0.35,gl,null,6),moEll(0.12,0.04,0.03,0,1.6,-0.34,0x10160e,null,6));   // a carved face
    for(let i=0;i<6;i++){ const a=i/6*TAU; body.push(moTube([[Math.cos(a)*0.4,0.35,Math.sin(a)*0.4],[Math.cos(a)*0.62,0.22,Math.sin(a)*0.62],[Math.cos(a)*0.85,0.02,Math.sin(a)*0.85]],0.06,0.02,0x3a5a2a,5,true)); }   // roots
    body.push(pc(new THREE.OctahedronGeometry(0.3,0).scale(1,1.5,1).translate(0,2.9,0),c=>c.set(gl)));
    for(let i=0;i<4;i++){ const a=i/4*TAU; body.push(pc(new THREE.OctahedronGeometry(0.09,0).scale(1,1.6,1).translate(Math.cos(a)*0.55,2.75+0.15*Math.sin(i*2),Math.sin(a)*0.55),c=>c.set(band))); }
    G.body=moMerge(body); return G;
  },
  build(d,G,M,g,P0){ P0.body=M(G.body); g.add(P0.body); },
  anim(m,dt){ const P0=m.parts; P0.body.rotation.y+=dt*0.4; P0.body.position.y=Math.sin(t*1.5+m.ph)*0.04; }
};
