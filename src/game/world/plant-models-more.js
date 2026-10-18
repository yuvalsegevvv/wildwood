//@ More tree species for variety: poplar, beech, willow, stone pine, cedar, ginkgo, larch, acacia and the gloom oak (G.trees / G.treesHi, a low-poly and a detailed model each)
/* Agent map: buildMoreTrees() (called by buildGeometries, generation-setup.js) adds the kinds to G.trees and, on the desktop, G.treesHi; treeVariety(type,x,z,h,land) (called by genChunk,
   generation-chunks.js) remaps a tree the old rules chose to one of these by a position hash, so the old random draws, and with them every tree's place, stay where they were.
   MORE_TREE lists the kinds (palettes PAL.<kind>, collision radii RAD.<kind>, generation-setup.js). The low-poly builders of plant-models.js draw from the global rand, so each
   runs inside withRng(seed): building these moves nothing in the world. Willow is the one custom shape (drooping strands); the others are makeBroadleaf / makeConifer with their own proportions.
   Look at them: node tools/zoneprops-preview.js is for props; for trees run a scratch page with buildGeometries or just walk the forest (docs/areas/render.md). Test: client-smoke. */
const MORE_TREE={poplar:1,beech:1,willow:1,umbrella:1,cedar:1,ginkgo:1,larch:1,acacia:1,gloomoak:1};
const MORE_CONIFER={cedar:1,larch:1};
const MORE_WIDE={beech:1,willow:1,umbrella:1,acacia:1,gloomoak:1};   // crowns that want the wide spacing of oaks
function withRng(seed,fn){ const keep=rand; rand=mulberry32(seed); try{ return fn(); } finally{ rand=keep; } }
function treeLean(t,k){   // a trunk and crown that bend over with height
  const f=g=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setX(i,p.getX(i)+y*y*k); } return g; };
  return {trunk:f(t.trunk),leaves:t.leaves?f(t.leaves):null};
}
// weeping willow, low-poly: a leaning trunk, a low dome and a curtain of hanging cones (tips down, darker at the bottom)
function makeWillow(){
  const {R:rr}=mrng(8101), C=new THREE.Vector3(0.4,4.3,0), tp=[], lp=[];
  tp.push(paint(cyl(0.2,0.44,3.6,7).rotateZ(-0.12).translate(0.2,1.75,0),bark(0x5a4a38)));
  for(let b=0;b<3;b++){ const g=cyl(0.07,0.15,1.8,5).translate(0,0.9,0); g.rotateZ(0.7+b*0.1); g.rotateY(b/3*TAU+0.4); g.translate(0.4,3.2,0); tp.push(paint(g,bark(0x5a4a38))); }
  lp.push(blob(2.0,0.4,4.4,0,0.62,C));
  for(let k=0;k<5;k++){ const a=k/5*TAU+rr(0,0.5); lp.push(blob(1.15,0.4+Math.cos(a)*1.5,4.2+rr(-0.2,0.3),Math.sin(a)*1.5,0.62,C)); }
  for(let i=0;i<16;i++){
    const a=i/16*TAU+rr(-0.15,0.15), rad=1.4+rr(0,0.8), len=rr(2.6,3.5), g=new THREE.ConeGeometry(0.34,len,5).rotateX(Math.PI);
    g.translate(0.4+Math.cos(a)*rad,4.2-len*0.5,Math.sin(a)*rad); lp.push(g);
  }
  const k=1.3, big=g=>g.scale(k,k,k);
  return {trunk:big(merge(tp)),leaves:big(merge(lp.map(g=>paint(g,shade(0.8,5.8)))))};
}
// weeping willow, detailed: forked limbs, a leafy dome and some 150 ribbons that arch out of it and hang nearly to the ground
function makeWillowHi(){
  const {r:rg,R:rr}=mrng(8201), parts=[], H=3.4, ln=0.5, tp=[], fr=furrow(81,0.09);
  for(let s=0;s<=9;s++){ const t=s/9; tp.push([ln*t*t,t*H,Math.sin(t*2.6)*0.08*t]); }
  parts.push(tube(tp,(t,a)=>lerp(0.4,0.2,t)*(1+1.2*Math.exp(-t*H*1.5))*fr(t,a,H),9,barkHi(0x5a4a38,81)));
  const top=tp[9], limbCol=barkHi(0x5a4a38,84);
  for(let l=0;l<5;l++){
    const az=l/5*TAU+rr(-0.3,0.3), len=rr(1.5,2.2), r0=0.14;
    parts.push(tube(limbPts(top[0],top[1]-0.35,top[2],az,rr(0.75,1.0),len,4,rg),(t,a)=>lerp(r0,r0*0.2,t),5,limbCol,true));
  }
  const cx=ln+0.2, cy=4.5, C=new THREE.Vector3(cx,cy,0), blobs=[{r:1.9,x:cx,y:cy,z:0,sy:0.6}];
  for(let k=0;k<5;k++){ const a=k/5*TAU+rg()*0.5; blobs.push({r:1.2,x:cx+Math.cos(a)*1.5,y:cy-0.2+rr(-0.2,0.4),z:Math.sin(a)*1.5,sy:0.6}); }
  const cw=crownHi(blobs,C,0.4,0.8,rg,2.5,5.4), F=flatAcc();
  for(let i=0;i<150;i++){
    const az=rg()*TAU, pol=rr(0.25,1.25), ca=Math.cos(az), sa=Math.sin(az), sx=cx+2.0*Math.sin(pol)*ca, sy=cy+1.05*Math.cos(pol), sz=2.0*Math.sin(pol)*sa;
    const len=Math.max(1.4,sy-rr(0.5,1.3)), seg=8, ph=rg()*TAU, w0=0.085*rr(0.8,1.2), nn=nrm3(ca*0.75,0.25,sa*0.75), tone=rr(0.85,1.15);
    let prev=null;
    for(let s=0;s<=seg;s++){
      const t=s/seg, out=0.55*Math.sin(Math.min(t*1.7,1)*Math.PI*0.6)+0.1*t, sway=0.12*Math.sin(t*4+ph)*t, w=w0*(1-0.75*t*t);
      const px=sx+ca*out-sa*sway, py=sy-len*t, pz=sz+sa*out+ca*sway, L=[px-(-sa)*w,py,pz-ca*w], Rt=[px+(-sa)*w,py,pz+ca*w], v=(0.58+0.55*t)*tone, col=[v,v,v];
      if(prev){ F.tri(prev[0],prev[1],L,nn,nn,nn,prev[2],prev[2],col); F.tri(prev[1],Rt,L,nn,nn,nn,prev[2],col,col); }
      prev=[L,Rt,col];
    }
  }
  const k=1.3, big=g=>g.scale(k,k,k);   // (a willow is a big tree)
  return {trunk:big(merge(parts)),leaves:big(merge(cw.core.concat([cw.leaves,F.done()])))};
}
function buildMoreTrees(){
  const T=G.trees;
  T.poplar=withRng(8301,()=>makeBroadleaf({trunkH:3.4, tr:0.22, crownY:7.6, rMain:1.3, blobs:5, spread:0.55, sy:2.2, branches:0, bark:0x6a5e48}));
  T.beech=withRng(8302,()=>makeBroadleaf({trunkH:3.8, tr:0.46, crownY:6.4, rMain:2.9, blobs:6, spread:2.1, sy:0.9, branches:4, bark:0x8a8478}));
  T.willow=makeWillow();
  T.umbrella=withRng(8304,()=>treeLean(makeBroadleaf({trunkH:6.6, tr:0.28, crownY:7.4, rMain:2.7, blobs:5, spread:2.4, sy:0.3, branches:4, bark:0x6a4a34}),0.012));
  T.cedar=withRng(8305,()=>makeConifer({trunkH:3.2, layers:11, r0:1.45, lh:2.1, spacing:1.0, start:1.5}));
  T.ginkgo=withRng(8306,()=>makeBroadleaf({trunkH:3.4, tr:0.28, crownY:6.2, rMain:1.8, blobs:5, spread:1.0, sy:1.35, branches:2, bark:0x6a5a48}));
  T.larch=withRng(8307,()=>makeConifer({trunkH:4, layers:9, r0:1.35, lh:1.5, spacing:1.05, start:1.6}));
  T.acacia=withRng(8308,()=>treeLean(makeBroadleaf({trunkH:3.8, tr:0.2, crownY:5.2, rMain:2.8, blobs:6, spread:2.7, sy:0.2, branches:3, bark:0x6a5a40}),0.03));
  T.gloomoak=withRng(8309,()=>treeLean(makeBroadleaf({trunkH:3.4, tr:0.4, crownY:5.0, rMain:2.2, blobs:5, spread:2.4, sy:0.5, branches:5, bark:0x2c2630}),0.05));
  if(!G.treesHi) return;
  const H=G.treesHi;
  H.poplar=makeBroadleafHi({trunkH:3.4, tr:0.22, crownY:7.6, rMain:1.3, blobs:5, spread:0.55, sy:2.2, branches:0, bark:0x6a5e48},12);
  H.beech=makeBroadleafHi({trunkH:3.8, tr:0.46, crownY:6.4, rMain:2.9, blobs:6, spread:2.1, sy:0.9, branches:4, bark:0x8a8478},13);
  H.willow=makeWillowHi();
  H.umbrella=treeLean(makeBroadleafHi({trunkH:6.6, tr:0.28, crownY:7.4, rMain:2.7, blobs:5, spread:2.4, sy:0.3, branches:4, bark:0x6a4a34},15),0.012);
  H.cedar=makeConiferHi({trunkH:3.2, layers:11, r0:1.45, lh:2.1, spacing:1.0, start:1.5},16);
  H.ginkgo=makeBroadleafHi({trunkH:3.4, tr:0.28, crownY:6.2, rMain:1.8, blobs:5, spread:1.0, sy:1.35, branches:2, bark:0x6a5a48},17);
  H.larch=makeConiferHi({trunkH:4, layers:9, r0:1.35, lh:1.5, spacing:1.05, start:1.6},18);
  H.acacia=treeLean(makeBroadleafHi({trunkH:3.8, tr:0.2, crownY:5.2, rMain:2.8, blobs:6, spread:2.7, sy:0.2, branches:3, bark:0x6a5a40},19),0.03);
  H.gloomoak=treeLean(makeBroadleafHi({trunkH:3.4, tr:0.4, crownY:5.0, rMain:2.2, blobs:5, spread:2.4, sy:0.5, branches:5, bark:0x2c2630},20),0.05);
}
/* Which species a tree becomes. type is what the old rules drew; k is a position hash, so the choice costs no random number. land: 'home' (the forest and the Greyspine), 'vale', 'hoar', 'gloam', 'sun'.
   Willows grow within 26 m of a lake's shore on low ground. */
function treeLakeD(x,z){ let d=1e9; for(const L of LAKES){ const e=Math.hypot(x-L.x,z-L.z)-L.r; if(e<d) d=e; } return d; }
function treeVariety(type,x,z,h,land){
  const k=h3(Math.floor(x*1.3),Math.floor(z*1.3),23);
  if(land==='home'){
    if(h<7&&k<0.6&&(type==='oakA'||type==='oakB'||type==='birch')&&treeLakeD(x,z)<26) return 'willow';
    if(type==='oakB'&&k<0.4||type==='oakA'&&k<0.18) return 'beech';
    if(type==='birch'&&k<0.3) return 'poplar';
    if(type==='pine'&&k<0.3) return 'umbrella';
    if(type==='spruce'&&k<0.28) return 'larch';
  } else if(land==='vale'){
    if(type==='pine'&&k<0.4) return 'cedar';
    if(type==='sakura'&&k<0.1||type==='maple'&&k<0.3) return 'ginkgo';
    if(h<7&&type==='sakura'&&k<0.35&&treeLakeD(x,z)<26) return 'willow';
  } else if(land==='hoar'){
    if(type==='frostspruce'&&k<0.14) return 'larch';
  } else if(land==='gloam'){
    if(type==='spruce'&&k<0.45) return 'gloomoak';
  } else if(land==='sun'){
    if(type==='thorn'&&k<0.45) return 'acacia';
  }
  return type;
}
