//@ Stands, veteran trees and road verges for genChunk's post-passes: species grow in ~60 m patches, one giant oak or beech per ~200 m with a court of ferns and mushrooms, and flowers along the roads; none of it draws from the chunk's rand
/* All three work on the lists genChunk has already built, from pure position hashes (h3, noise2) and their own mrng, so the chunk's rand stream and everything placed after
   it stay where they were. skStandApply: trees of one size class (oaks and beech, the slim broadleaves, the conifers) move to the patch's dominant species (70 % of them; the
   rest stay as strays); the colliders keep the old kind's radius (the differences are under 0.3 m); not in the Gloamhorn, the Sunscar or the Hoarfrost. skVeterans: the nearest
   oak or beech to a jittered point in each 200 m cell grows 1.7 times, gets a second collider and returns its place for the court (skCourt: ferns and mushrooms round its foot).
   skVerge: flowers 4-9 m off every road, in clusters about every 6 m, never in forest, villages or on bare ground. Used by: genChunk (generation-chunks.js). Test: client-smoke. */
const SK_CLASSES=[['oakA','oakB','beech'],['birch','poplar','rowan'],['pine','spruce','larch']];
function skStandApply(items){
  const pal={oakA:PAL.oak,oakB:PAL.oak,beech:PAL.beech,birch:PAL.birch,poplar:PAL.poplar,rowan:PAL.rowan,pine:PAL.pine,spruce:PAL.spruce,larch:PAL.larch};
  SK_CLASSES.forEach((cls,ci)=>{
    const move=[];
    for(const k of cls){ const L=items[k]; if(!L) continue;
      for(let i=L.length-1;i>=0;i--){ const it=L[i];
        if(inGloam(it.x,it.z)||inSun(it.x,it.z)||inHoar(it.x,it.z)) continue;
        const dom=cls[Math.max(0,Math.min(cls.length-1,Math.floor((noise2(it.x*0.017+ci*13.1,it.z*0.017-5.3)*0.5+0.5)*cls.length)))];
        if(dom!==k&&h3(Math.floor(it.x*1.3),Math.floor(it.z*1.3),47)<0.7){ L.splice(i,1); move.push([dom,it]); } } }
    for(const [dom,it] of move){ const P=pal[dom], t=h3(Math.floor(it.x*2.1),Math.floor(it.z*2.1),48);
      it.c=new THREE.Color(P[Math.min(P.length-1,(t*P.length)|0)]).multiplyScalar(0.92+0.16*h3(Math.floor(it.x*3.7),Math.floor(it.z*3.7),49)); items[dom].push(it); }
  });
}
const SK_VET=['oakA','oakB','beech'], SK_VS=new THREE.Matrix4().makeScale(1.7,1.7,1.7);
function skVeterans(ci,items){   // returns [{x,z}]: the giants' places
  const r=chunkRect(ci,0), out=[];
  for(let cx=Math.floor(r[0]/200)-1;cx<=Math.floor(r[1]/200);cx++) for(let cz=Math.floor(r[2]/200)-1;cz<=Math.floor(r[3]/200);cz++){
    const px=(cx+0.15+0.7*h3(cx,cz,51))*200, pz=(cz+0.15+0.7*h3(cx,cz,52))*200;
    if(px<r[0]||px>=r[1]||pz<r[2]||pz>=r[3]) continue;
    let best=null, bd=25*25, bk=null;
    for(const k of SK_VET) for(const it of items[k]||[]){ const d=(it.x-px)*(it.x-px)+(it.z-pz)*(it.z-pz); if(d<bd){ bd=d; best=it; bk=k; } }
    if(!best||best.vet) continue;
    best.m=best.m.clone().multiply(SK_VS); best.vet=1; addCol(best.x,best.z,RAD[bk]*1.2); out.push({x:best.x,z:best.z});
  }
  return out;
}
function skCourt(ci,vets,fernItems,mushItems){
  if(!vets.length) return;
  const {r:rg,R:rr}=mrng((ci*31+7)|0);
  for(const v of vets){
    for(let i=0;i<7;i++){ const a=rg()*TAU, d=rr(2.6,6), x=v.x+Math.cos(a)*d, z=v.z+Math.sin(a)*d, h=getH(x,z); if(h<0.8) continue; const s=rr(0.8,1.4);
      fernItems.push({x,z,m:mtx(x,h-0.03,z,rg()*TAU,s,s*rr(0.8,1.2),s),c:new THREE.Color(PAL.fern[(rg()*PAL.fern.length)|0]).multiplyScalar(0.9+0.2*rg())}); }
    for(let i=0;i<6;i++){ const a=rg()*TAU, d=rr(2.2,4.5), x=v.x+Math.cos(a)*d, z=v.z+Math.sin(a)*d, h=getH(x,z); if(h<0.8) continue; const s=rr(0.7,1.6);
      mushItems.push({x,z,m:mtx(x,h-0.02,z,rg()*TAU,s,s,s),c:rg()<0.45?new THREE.Color(1.35,1.05,0.75):new THREE.Color(1,1,1)}); }
  }
}
function skVerge(ci,stemItems,headItems){
  const r=chunkRect(ci,0), {r:rg,R:rr}=mrng((ci*37+11)|0), FL=PAL.flowers; let n=0;
  for(const road of ROADS){ const P=road.pts;
    for(let i=1;i<P.length-1&&n<150;i+=2){
      const p=P[i]; if(p[0]<r[0]||p[0]>=r[1]||p[1]<r[2]||p[1]>=r[3]||rg()>0.7) continue;
      const q=P[i+1], dx=q[0]-P[i-1][0], dz=q[1]-P[i-1][1], l=Math.hypot(dx,dz)||1, side=rg()<0.5?1:-1, off=rr(4,9)*side, cx=p[0]-dz/l*off, cz=p[1]+dx/l*off, hex=FL[(h3(Math.floor(cx/9),Math.floor(cz/9),53)*FL.length)|0];
      for(let k=0;k<3;k++){
        const x=cx+rr(-1.4,1.4), z=cz+rr(-1.4,1.4), h=getH(x,z);
        if(h<0.8||grad(x,z)>0.6||forestDensity(x,z)>0.55||vDist(x,z)<VR+1||inTunnelCut(x,z)||bareGround(x,z)||inHoar(x,z)||inSun(x,z)||inGloam(x,z)||inAmber(x,z)||greyWet(x,z,-0.5)||roadAmt(x,z)>0.05) continue;
        const s=rr(0.8,1.3), m=mtx(x,h-0.02,z,rg()*TAU,s,s,s);
        stemItems.push({x,z,m}); headItems.push({x,z,m,c:new THREE.Color(hex).multiplyScalar(0.92+0.16*rg())}); n++;
      }
    }
  }
}
