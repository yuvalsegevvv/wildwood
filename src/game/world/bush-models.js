//@ Bush kinds beyond the leafy shrub: berry bush, hazel, juniper (frost juniper in the Reach), thorny thicket and dry scrub, a detailed and a low-poly model each, and bshKind / bshAdd that place them in genChunk's bush loop without drawing a random number
/* One mesh per kind per chunk. The leafy shrub stays G.bush / G.bushHi (plant-models*.js). Each kind is {hi, lo}: hi is drawn near the eye on desktops, lo beyond 65 m
   and alone on phones. Models draw from their own mrng(seed); bshKind picks the kind from position hashes only, so genChunk's rand stream does not move (the loop keeps
   every rand() call it always made). Agent map: buildBushKinds() fills G.bushK; bshKind(x,z,h,fd,land,bloom); bshColor(kind,x,z); bshAdd(items,addInstancedFn) draws the lists.
   Tests: client-smoke; preview: node tools/veg-sample.js out --bushes berry,hazel,juniper,thicket,scrub --views bushes */
const BSH_PAL={
  berry:[0x4f7d32,0x58863a,0x467228], hazel:[0x5a8a34,0x669a3c,0x4f7c30], juniper:[0x3a5f4a,0x33564a,0x44684f], frostjuniper:[0x5a7a72,0x4f6c66,0x668a80],
  thicket:[0x8a7a66,0x94846e,0x7a6e5e], scrub:[0x9a9460,0x8a8a5a,0xa89a5c], scrubAmber:[0xb0a050,0xa08c48,0xbca85a]
};
function bshColor(kind,x,z){ const P=BSH_PAL[kind], c=new THREE.Color(P[(h3(Math.floor(x*0.9),Math.floor(z*0.9),43)*P.length)|0]); return c.multiplyScalar(0.9+0.2*h3(Math.floor(x*2),Math.floor(z*2),5)); }
function bshKind(x,z,h,fd,land,bloom){
  if(bloom||land==='isles') return 'leafy';
  const kb=h3(Math.floor(x*0.9),Math.floor(z*0.9),41), c=noise2(x*0.05+7,z*0.05-3)*0.5+0.5;
  if(land==='sun'||land==='amber') return 'scrub';
  if(land==='gloam') return 'thicket';
  if(land==='hoar') return kb<0.5?'frostjuniper':'leafy';
  if(land==='grey') return kb<0.6?'juniper':'leafy';
  if(h>16&&kb<0.4) return 'juniper';
  if(fd>0.8&&kb>0.85) return 'thicket';
  if(c>0.55&&fd>0.35&&fd<0.7&&kb<0.5) return 'berry';
  if(fd>0.5&&kb<0.3) return 'hazel';
  return 'leafy';
}
function bshLo(parts,bot,top){ return merge(parts.map(g=>paint(g,shade(bot,top)))); }
function bshStems(rg,rr,n,reach,height,sides){   // woody stems from the root, fanned out
  const parts=[];
  for(let i=0;i<n;i++){ const a=rg()*TAU, d=reach*rr(0.5,1), E=[Math.cos(a)*d,height*rr(0.6,1),Math.sin(a)*d];
    parts.push(tube(archPts([Math.cos(a)*0.05,0,Math.sin(a)*0.05],E,2,0.08,rg),(t)=>lerp(0.045,0.015,t),sides,(x,y,z,c)=>c.set(0x4a3c2c).multiplyScalar(0.8+0.4*h3(x*9,y*9,z*9)),true)); }
  return parts;
}
function bshBerryHi(seed){   // the leafy shrub with red and blue berry bunches on its surface (the green tint turns the vertex colours red / blue)
  const {r:rg,R:rr}=mrng(seed), C=new THREE.Vector3(0,0.3,0), blobs=[];
  for(let k=0;k<6;k++){ const a=k/6*TAU+rg()*0.6, d=k===0?0:0.6*rr(0.5,1); blobs.push({r:k===0?rr(0.55,0.7):rr(0.32,0.45),x:Math.cos(a)*d,y:k===0?rr(0.7,0.9):rr(0.3,0.5),z:Math.sin(a)*d,sy:0.8}); }
  const cw=crownHi(blobs,C,0.18,1.1,rg,0,1.4), F=flatAcc();
  for(let q=0;q<26;q++){ const b=blobs[(rg()*blobs.length)|0], a=rg()*TAU, el=rr(0.15,1.1), rr0=b.r*0.97, cx=b.x+Math.cos(a)*Math.cos(el)*rr0, cy=b.y+Math.sin(el)*rr0*b.sy, cz=b.z+Math.sin(a)*Math.cos(el)*rr0, blue=(q%3===0), col=blue?[0.5,0.5,2.6]:[2.4,0.25,0.5], nn=nrm3(cx-b.x,cy-b.y,cz-b.z), w=0.035;
    const A=[cx,cy+w*1.6,cz], B1=[cx-w,cy-w*0.5,cz-w*0.6], B2=[cx+w,cy-w*0.5,cz-w*0.6], B3=[cx,cy-w*0.5,cz+w*0.8];
    F.tri(A,B1,B2,nn,nn,nn,col,col,col); F.tri(A,B2,B3,nn,nn,nn,col,col,col); F.tri(A,B3,B1,nn,nn,nn,col,col,col); }
  return merge(cw.core.concat([cw.leaves,F.done()],bshStems(rg,rr,5,0.5,0.5,3)));
}
function bshHazelHi(seed){   // 2.6 m tall and open below: stems fan out, leaf clusters at 1.4-2.5 m
  const {r:rg,R:rr}=mrng(seed), C=new THREE.Vector3(0,1.7,0), blobs=[], parts=[];
  for(let k=0;k<8;k++){ const a=k/8*TAU+rg()*0.5, d=rr(0.35,0.85)*(0.5+0.5*k%2), y=rr(1.4,2.5), E=[Math.cos(a)*d,y,Math.sin(a)*d];
    blobs.push({r:rr(0.35,0.5),x:E[0],y:E[1],z:E[2],sy:0.85});
    parts.push(tube(archPts([Math.cos(a)*0.06,0,Math.sin(a)*0.06],[E[0],y-0.3,E[2]],3,0.06,rg),(t)=>lerp(0.05,0.018,t),4,(x,y,z,c)=>c.set(0x5a4a34).multiplyScalar(0.8+0.4*h3(x*9,y*9,z*9)),true)); }
  const cw=crownHi(blobs,C,0.2,1,rg,0.8,2.9);
  return merge(cw.core.concat([cw.leaves],parts));
}
function bshJuniperHi(seed,o){ const t=makeConiferHi(Object.assign({trunkH:0.3,layers:6,r0:0.55,lh:0.55,spacing:0.28,start:0.15,taper:0.9,frondW:0.4,core:0.4,sag:0.2,lift:0.2},o||{}),seed); return merge([t.trunk,t.leaves]); }
function bshThicketHi(seed){   // arching dark canes with thorns and small leaf tufts
  const {r:rg,R:rr}=mrng(seed), parts=[], F=flatAcc();
  for(let i=0;i<9;i++){ const a=i/9*TAU+rg()*0.5, d=rr(0.5,0.9), E=[Math.cos(a)*d,rr(0.9,1.4),Math.sin(a)*d], pts=archPts([Math.cos(a)*0.06,0,Math.sin(a)*0.06],E,4,0.25,rg);
    parts.push(tube(pts,(t)=>lerp(0.03,0.01,t),3,(x,y,z,c)=>c.set(0x3a2c30).multiplyScalar(0.8+0.4*h3(x*9,y*9,z*9)),true));
    for(let q=0;q<9;q++){ const p=pts[1+(q%4)], u=rg()*TAU, nn=nrm3(Math.cos(u),0.3,Math.sin(u)), L=0.07;
      if(q<5){ const t=[p[0]+Math.cos(u)*L,p[1]+0.02,p[2]+Math.sin(u)*L], b1=[p[0],p[1]-0.012,p[2]], b2=[p[0],p[1]+0.012,p[2]]; F.tri(b1,b2,t,nn,nn,nn,[0.3,0.3,0.3],[0.3,0.3,0.3],[0.55,0.55,0.55]); }
      else { const c0=[0.5,0.55,0.3], t1=[p[0]+Math.cos(u)*0.12,p[1]+0.05,p[2]+Math.sin(u)*0.12], t2=[p[0]+Math.cos(u+0.7)*0.1,p[1]+0.02,p[2]+Math.sin(u+0.7)*0.1], nu=[0,1,0]; F.tri(p,t1,t2,nu,nu,nu,c0,[1.1,1.15,0.8],[1.0,1.05,0.7]); } } }
  return merge(parts.concat([F.done()]));
}
function bshScrubHi(seed){   // a sage cushion: upright twig blades fanned from five woody stems, grey at the base and straw at the tips
  const {r:rg,R:rr}=mrng(seed), F=flatAcc(), nn=[0,1,0];
  for(let q=0;q<70;q++){ const a=rg()*TAU, d=Math.sqrt(rg())*0.3, bx=Math.cos(a)*d, bz=Math.sin(a)*d, hgt=rr(0.45,0.95)*(1-d*0.6), lean=rr(0.15,0.5), w=0.025, ox=Math.cos(a)*lean*0.5, oz=Math.sin(a)*lean*0.5;
    F.tri([bx-Math.sin(a)*w,0.05,bz+Math.cos(a)*w],[bx+Math.sin(a)*w,0.05,bz-Math.cos(a)*w],[bx+ox,hgt,bz+oz],nn,nn,nn,[0.5,0.5,0.5],[0.5,0.5,0.5],[1.3,1.25,1.1]); }
  return merge([F.done()].concat(bshStems(rg,rr,5,0.2,0.4,3)));
}
function buildBushKinds(){
  const hiOn=!!G.bushHi, ball=(n,spread,rb,h0,h1)=>{ const C=new THREE.Vector3(0,0.3,0), parts=[]; for(let k=0;k<n;k++){ const a=k/n*TAU+rand(), d=k===0?0:spread*R(0.5,1); parts.push(blob(R(rb[0],rb[1]),Math.cos(a)*d,R(h0,h1),Math.sin(a)*d,0.8,C)); } return bshLo(parts,0,1.4); };
  const K={};
  K.berry={hi:hiOn?bshBerryHi(101):null, lo:G.bush[0]};
  K.hazel={hi:hiOn?bshHazelHi(102):null, lo:merge([0,1,2].map(i=>paint(blob(0.5,Math.cos(i*2.1)*0.45,1.5+i*0.3,Math.sin(i*2.1)*0.45,0.9,new THREE.Vector3(0,1.7,0)),shade(0.8,2.9))))};
  K.juniper={hi:hiOn?bshJuniperHi(103):null, lo:(t=>merge([t.trunk,t.leaves]))(makeConifer({trunkH:0.3,layers:4,r0:0.55,lh:0.6,spacing:0.35,start:0.15,taper:0.9}))};
  K.frostjuniper=K.juniper;   // the Reach's: same shapes, drawn with snow (matBushDSnow)
  K.thicket={hi:hiOn?bshThicketHi(104):null, lo:ball(2,0.3,[0.45,0.6],0.4,0.6)};
  K.scrub={hi:hiOn?bshScrubHi(105):null, lo:ball(2,0.2,[0.3,0.4],0.25,0.4)};
  G.bushK=K;
}
const BSH_SNOW={frostjuniper:1};
function bshAdd(items,add){   // items: {kind:[{x,z,m,c}]}; add: addInstanced
  for(const k in items){ const list=items[k], K=G.bushK[k]; if(!list.length||!K) continue;
    const snow=!!BSH_SNOW[k];
    if(K.hi) add(K.hi,snow?matBushDSnow:matBushD,list,{cast:true,receive:true,maxDist:170,hgt:2.8,rad:2,lods:[{geo:K.lo,from:65,cast:true}]});
    else add(K.lo,snow?matBushSnow:matBush,list,{cast:true,receive:true,maxDist:170,hgt:2.8,rad:2}); }
}
