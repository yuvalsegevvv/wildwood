//@ More tree species for variety: poplar, beech, willow, stone pine, cedar, ginkgo, larch, acacia and the gloom oak (G.trees / G.treesHi, a low-poly and a detailed model each)
/* Agent map: buildMoreTrees() (called by buildGeometries, generation-setup.js) adds the kinds to G.trees and, on the desktop, G.treesHi; treeVariety(type,x,z,h,land) (called by genChunk,
   generation-chunks.js) remaps a tree the old rules chose to one of these by a position hash, so the old random draws, and with them every tree's place, stay where they were.
   MORE_TREE lists the kinds (palettes PAL.<kind>, collision radii RAD.<kind>, generation-setup.js). The low-poly builders of plant-models.js draw from the global rand, so each
   runs inside withRng(seed): building these moves nothing in the world. Willow is the one custom shape (drooping strands); the others are makeBroadleaf / makeConifer with their own proportions.
   Look at them: node tools/zoneprops-preview.js is for props; for trees run a scratch page with buildGeometries or just walk the forest (docs/areas/render.md). Test: client-smoke. */
const MORE_TREE={poplar:1,beech:1,willow:1,umbrella:1,cedar:1,ginkgo:1,larch:1,acacia:1,gloomoak:1,rowan:1,fir:1,kuromatsu:1,krummholz:1,hawthorn:1,camphor:1,dragontree:1,yew:1};
const MORE_CONIFER={cedar:1,larch:1,fir:1,kuromatsu:1,krummholz:1};
// the three new conifers (rowan is a broadleaf): a 17 m fir, the vale's black pine (an S-bent trunk, five flat pads), the dwarf mountain pine of the Greyspine's treeline and the Reach
const CONI_NEW={fir:{trunkH:7, layers:10, r0:2.4, lh:2.4, spacing:1.5, start:5, taper:0.6, sag:0.3, lift:0.15},
  kuromatsu:Object.assign({},CONI.pine,{pads:5, bend:0.9, H:6.5, r0:1.7, tk:0.8}),
  krummholz:Object.assign({},CONI.pine,{pads:5, bend:0.5, H:2.4, r0:0.9, tk:0.45})};
const HAWTHORN_O={trunkH:1.9, tr:0.2, crownY:3.3, rMain:1.6, blobs:6, spread:1.7, sy:0.6, branches:4, bark:0x5c5248,leaf:'small'};   // 4.5 m, forked and wide (home, low ground)
const CAMPHOR_O={trunkH:4.5, tr:0.7, crownY:8.5, rMain:3.6, blobs:7, spread:3.0, sy:0.8, branches:5, bark:0x6a5a4a,leaf:'oval'};   // the vale's 12 m giant: a broad dome on a thick trunk
const YEW_O={trunkH:1.6, tr:0.45, crownY:3.2, rMain:2.2, blobs:6, spread:1.8, sy:0.75, branches:4, bark:0x4a2e2a,leaf:'fine'};   // the Gloamhorn's squat, dark yew
/* The dragon tree (the Sunscar): a short trunk forking into upswept limbs, each tipped with a rosette of sword leaves that together make one flat umbrella. lo: fewer blades. */
function makeDragonTree(seed,lo){
  const {r:rg,R:rr}=mrng(seed), parts=[], leaves=[], nb=lo?7:14, trunk=new THREE.Color(0x8a7a66);
  parts.push(paint(cyl(0.2,0.36,2.2,7).translate(0,1.1,0),(x,y,z,nx,ny,nz,c)=>c.copy(trunk).multiplyScalar(0.7+0.3*h3(Math.floor(y*3),Math.floor(Math.atan2(z,x)*2),3))));
  const nL=lo?4:6;
  for(let i=0;i<nL;i++){
    const a=i/nL*TAU+rr(-0.3,0.3), tilt=rr(0.7,1.0), len=rr(1.8,2.4), tx=Math.cos(a)*Math.sin(tilt)*len, ty=2.1+Math.cos(tilt)*len, tz=Math.sin(a)*Math.sin(tilt)*len;
    const g=cyl(0.07,0.16,len,5); g.translate(0,len/2,0); g.rotateZ(-tilt); g.rotateY(-a); g.translate(0,2.1,0); parts.push(paint(g,(x,y,z,nx,ny,nz,c)=>c.copy(trunk).multiplyScalar(0.62+0.3*h3(x*4,y*4,z*4))));
    for(let k=0;k<nb;k++){   // the rosette: sword blades spread in a fan, the lower ones drooping a little
      const b=k/nb*TAU+rr(-0.2,0.2), up=rr(0.25,0.95), L=rr(1.0,1.5), g2=new THREE.IcosahedronGeometry(1,0); g2.scale(L*0.5,0.035,0.09); g2.translate(L*0.5,0,0); g2.rotateZ(up); g2.rotateY(b); g2.translate(tx,ty,tz);
      leaves.push(paint(g2,(x,y,z,nx,ny,nz,c)=>{ const v=0.7+0.4*clamp((Math.hypot(x-tx,z-tz))/1.4); c.setRGB(v,v,v); }));
    }
  }
  return {trunk:merge(parts), leaves:merge(leaves)};
}
const ROWAN_O={trunkH:2.6, tr:0.14, crownY:4.2, rMain:1.5, blobs:5, spread:1.2, sy:0.8, branches:3, bark:0x6a6258,leaf:'oval'};
const MORE_WIDE={beech:1,willow:1,umbrella:1,acacia:1,gloomoak:1,fir:1,camphor:1,yew:1};   // crowns that want the wide spacing of oaks
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
// weeping willow, detailed: a flared, rooted trunk, forked limbs, a dome of leaf clusters (treeCrown) and some 150 ribbons that arch out of it and hang nearly to the ground
function makeWillowHi(){
  const {r:rg,R:rr}=mrng(8201), parts=[], H=3.4, ln=0.5, tp=[], fr=furrow(81,0.09);
  for(let s=0;s<=9;s++){ const t=Math.pow(s/9,1.3); tp.push([ln*t*t,-0.25+t*(H+0.25),Math.sin(t*2.6)*0.08*t]); }
  parts.push(tube(tp,(t,a)=>{ const y=-0.25+Math.pow(t,1.3)*(H+0.25); return lerp(0.4,0.2,clamp(y/H))*rootFlare(y,a,1.1,5,0.4)*fr(t,a,H); },10,barkHi(0x5a4a38,81)));
  rootsHi(parts,4,0.4,5,0.4,rg,rr,barkHi(0x5a4a38,81),[0,0,0]);
  const top=tp[9], limbCol=barkHi(0x5a4a38,84);
  for(let l=0;l<5;l++){
    const az=l/5*TAU+rr(-0.3,0.3), len=rr(1.5,2.2), r0=0.14;
    parts.push(tube(limbPts(top[0],top[1]-0.35,top[2],az,rr(0.75,1.0),len,4,rg),(t,a)=>lerp(r0,r0*0.2,t),5,limbCol,true));
  }
  const cx=ln+0.2, cy=4.5, C=new THREE.Vector3(cx,cy,0), blobs=[{r:1.9,x:cx,y:cy,z:0,sy:0.6}];
  for(let k=0;k<5;k++){ const a=k/5*TAU+rg()*0.5; blobs.push({r:1.2,x:cx+Math.cos(a)*1.5,y:cy-0.2+rr(-0.2,0.4),z:Math.sin(a)*1.5,sy:0.6}); }
  const cw=treeCrown(blobs.map((b,i)=>({x:b.x,y:b.y,z:b.z,r:b.r,sy:b.sy,core:i<3})),C,0.3,420,rg,rr), F=flatAcc();
  for(let i=0;i<260;i++){
    const az=rg()*TAU, pol=rr(0.25,1.25), ca=Math.cos(az), sa=Math.sin(az), sx=cx+2.0*Math.sin(pol)*ca, sy=cy+1.05*Math.cos(pol), sz=2.0*Math.sin(pol)*sa;
    const len=Math.max(1.4,sy-rr(0.5,1.3)), seg=4, ph=rg()*TAU, w0=0.045*rr(0.8,1.2), nn=nrm3(ca*0.75,0.25,sa*0.75), tone=rr(0.85,1.15);
    let prev=null;
    for(let s=0;s<=seg;s++){
      const t=s/seg, out=0.55*Math.sin(Math.min(t*1.7,1)*Math.PI*0.6)+0.1*t, sway=0.12*Math.sin(t*4+ph)*t, w=w0*(1-0.75*t*t);
      const px=sx+ca*out-sa*sway, py=sy-len*t, pz=sz+sa*out+ca*sway, L=[px-(-sa)*w,py,pz-ca*w], Rt=[px+(-sa)*w,py,pz+ca*w], v=(0.5+0.62*t)*tone, col=[v*(0.94+0.1*t),v,v*(1.08-0.2*t)];   // (dark and cool where a strand leaves the dome, light and warm at its tip)
      if(prev){ F.tri(prev[0],prev[1],L,nn,nn,nn,prev[2],prev[2],col); F.tri(prev[1],Rt,L,nn,nn,nn,prev[2],col,col); }
      prev=[L,Rt,col];
    }
  }
  const k=1.3, big=g=>g.scale(k,k,k);   // (a willow is a big tree)
  return {trunk:big(merge(parts)),leaves:big(merge(cw.core.concat([cw.leaves,F.done()])))};
}
function buildMoreTrees(){
  const T=G.trees;
  T.poplar=withRng(8301,()=>makeBroadleaf({trunkH:3.4, tr:0.22, crownY:7.6, rMain:1.3, blobs:5, spread:0.55, sy:2.2, branches:0, bark:0x6a5e48,leaf:'small'}));
  T.beech=withRng(8302,()=>makeBroadleaf({trunkH:3.8, tr:0.46, crownY:6.4, rMain:2.9, blobs:6, spread:2.1, sy:0.9, branches:4, bark:0x8a8478,leaf:'oval'}));
  T.willow=makeWillow();
  T.umbrella=withRng(8304,()=>treeLean(makeBroadleaf({trunkH:6.6, tr:0.28, crownY:7.4, rMain:2.7, blobs:5, spread:2.4, sy:0.3, branches:4, bark:0x6a4a34,leaf:'fine'}),0.012));
  T.cedar=withRng(8305,()=>makeConifer(CONI.cedar));
  T.ginkgo=withRng(8306,()=>makeBroadleaf({trunkH:3.4, tr:0.28, crownY:6.2, rMain:1.8, blobs:5, spread:1.0, sy:1.35, branches:2, bark:0x6a5a48,leaf:'fan'}));
  T.larch=withRng(8307,()=>makeConifer(CONI.larch));
  T.acacia=withRng(8308,()=>treeLean(makeBroadleaf({trunkH:3.8, tr:0.2, crownY:5.2, rMain:2.8, blobs:6, spread:2.7, sy:0.2, branches:3, bark:0x6a5a40,leaf:'fine'}),0.03));
  T.gloomoak=withRng(8309,()=>treeLean(makeBroadleaf({trunkH:3.4, tr:0.4, crownY:5.0, rMain:2.2, blobs:5, spread:2.4, sy:0.5, branches:5, bark:0x2c2630,leaf:'oval'}),0.05));
  T.rowan=withRng(8310,()=>makeBroadleaf(ROWAN_O));
  T.hawthorn=withRng(8314,()=>makeBroadleaf(HAWTHORN_O));
  T.camphor=withRng(8315,()=>makeBroadleaf(CAMPHOR_O));
  T.dragontree=withRng(8316,()=>makeDragonTree(8316,true));
  T.yew=withRng(8317,()=>makeBroadleaf(YEW_O));
  T.fir=withRng(8311,()=>makeConifer(CONI_NEW.fir));
  T.kuromatsu=withRng(8312,()=>treeLean(makeConifer(CONI_NEW.kuromatsu),0.06));
  T.krummholz=withRng(8313,()=>makeConifer(CONI_NEW.krummholz));
  if(!G.treesHi) return;
  const H=G.treesHi;
  H.rowan=makeBroadleafHi(ROWAN_O,23);
  H.hawthorn=makeBroadleafHi(HAWTHORN_O,25);
  H.camphor=makeBroadleafHi(CAMPHOR_O,26);
  H.dragontree=makeDragonTree(27,false);
  H.yew=makeBroadleafHi(YEW_O,28);
  H.fir=makeConiferHi(CONI_NEW.fir,21);
  H.kuromatsu=treeLean(makeConiferHi(CONI_NEW.kuromatsu,22),0.06);
  H.krummholz=makeConiferHi(CONI_NEW.krummholz,24);
  H.poplar=makeBroadleafHi({trunkH:3.4, tr:0.22, crownY:7.6, rMain:1.3, blobs:5, spread:0.55, sy:2.2, branches:0, bark:0x6a5e48,leaf:'small'},12);
  H.beech=makeBroadleafHi({trunkH:3.8, tr:0.46, crownY:6.4, rMain:2.9, blobs:6, spread:2.1, sy:0.9, branches:4, bark:0x8a8478,leaf:'oval'},13);
  H.willow=makeWillowHi();
  H.umbrella=treeLean(makeBroadleafHi({trunkH:6.6, tr:0.28, crownY:7.4, rMain:2.7, blobs:5, spread:2.4, sy:0.3, branches:4, bark:0x6a4a34,leaf:'fine'},15),0.012);
  H.cedar=makeConiferHi(CONI.cedar,16);
  H.ginkgo=makeBroadleafHi({trunkH:3.4, tr:0.28, crownY:6.2, rMain:1.8, blobs:5, spread:1.0, sy:1.35, branches:2, bark:0x6a5a48,leaf:'fan'},17);
  H.larch=makeConiferHi(CONI.larch,18);
  H.acacia=treeLean(makeBroadleafHi({trunkH:3.8, tr:0.2, crownY:5.2, rMain:2.8, blobs:6, spread:2.7, sy:0.2, branches:3, bark:0x6a5a40,leaf:'fine'},19),0.03);
  H.gloomoak=treeLean(makeBroadleafHi({trunkH:3.4, tr:0.4, crownY:5.0, rMain:2.2, blobs:5, spread:2.4, sy:0.5, branches:5, bark:0x2c2630,leaf:'oval'},20),0.05);
}
/* Which species a tree becomes. type is what the old rules drew; k is a position hash, so the choice costs no random number. land: 'home' (the forest and the Greyspine), 'vale', 'hoar', 'gloam', 'sun'.
   Willows grow within 26 m of a lake's shore on low ground. */
function treeLakeD(x,z){ let d=1e9; for(const L of LAKES){ const e=Math.hypot(x-L.x,z-L.z)-L.r; if(e<d) d=e; } return d; }
function treeVariety(type,x,z,h,land){
  const k=h3(Math.floor(x*1.3),Math.floor(z*1.3),23);
  if(land==='home'){
    if((type==='pine'||type==='spruce')&&k<0.7&&inGrey(x,z)&&h>greyTreeline(x,z)-14) return 'krummholz';
    if((type==='pine'||type==='spruce')&&inGrey(x,z)&&h>greyTreeline(x,z)-36) return 'frostspruce';   // the Greyspine's snowy slopes: snow-laden spruce   // the Greyspine's treeline: dwarf mountain pines
    if(type==='birch'&&k>=0.3&&k<0.42) return 'rowan';
    if(type==='oakB'&&k>=0.4&&k<0.54&&h<12) return 'hawthorn';   // low ground: a forked, wide hawthorn
    if(type==='spruce'&&k>=0.28&&k<0.42&&h>12) return 'fir';   // the forest's giants on the higher ground
    if(h<7&&k<0.6&&(type==='oakA'||type==='oakB'||type==='birch')&&treeLakeD(x,z)<26) return 'willow';
    if(type==='oakB'&&k<0.4||type==='oakA'&&k<0.18) return 'beech';
    if(type==='birch'&&k<0.3) return 'poplar';
    if(type==='pine'&&k<0.3) return 'umbrella';
    if(type==='spruce'&&k<0.28) return 'larch';
  } else if(land==='vale'){
    if(type==='pine'&&k<0.4) return 'cedar';
    if(type==='pine'&&k>=0.4&&k<0.62&&h<12) return 'kuromatsu';
    if(type==='sakura'&&k>=0.93&&h<16) return 'camphor';   // the vale's giant
    if(type==='sakura'&&k<0.1||type==='maple'&&k<0.3) return 'ginkgo';
    if(h<7&&type==='sakura'&&k<0.35&&treeLakeD(x,z)<26) return 'willow';
  } else if(land==='hoar'){
    if(type==='dwarfbirch'&&k<0.25) return 'krummholz';
  } else if(land==='gloam'){
    if(type==='spruce'&&k<0.45) return 'gloomoak';
    if(type==='snag'&&k<0.25) return 'yew';
  } else if(land==='sun'){
    if(type==='thorn'&&k<0.45) return 'acacia';
    if(type==='cactus'&&k<0.22) return 'dragontree';
  }
  return type;
}
