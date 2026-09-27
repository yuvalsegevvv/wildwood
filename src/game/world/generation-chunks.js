//@ Per-chunk vegetation placement (genChunk)
const NCH=CH*CH;
function chunkRect(ci,m){
  const cx=ci%CH, cz=Math.floor(ci/CH);
  return [Math.max(-HALF+cx*CS,-HALF+m), Math.min(-HALF+(cx+1)*CS,HALF-m), Math.max(-HALF+cz*CS,-HALF+m), Math.min(-HALF+(cz+1)*CS,HALF-m)];
}
function distToChunk(ci,x,z){
  const r=chunkRect(ci,0);
  const dx=Math.max(r[0]-x,0,x-r[1]), dz=Math.max(r[2]-z,0,z-r[3]);
  return Math.hypot(dx,dz);
}

function* genChunk(ci){
  const per=AREA/NCH;
  const pt=m=>{ const r=chunkRect(ci,m); return [R(r[0],r[1]),R(r[2],r[3])]; };

  // trees
  const items={}; for(const k in G.trees) items[k]=[];
  const trees=[];
  const MAXT=Math.round(2400*Q*per); let placed=0;
  for(let a=0;a<70000*per && placed<MAXT;a++){
    if((a&511)===511) yield;
    const [x,z]=pt(10);
    if(Math.hypot(x-spawn.x,z-spawn.z)<7) continue;
    if(vDist(x,z)<VIL.r+6 || nearPath(x,z,3.5) || Math.hypot(x-ARENA.x,z-ARENA.z)<ARENA.r+5) continue;
    const h=getH(x,z); if(h<0.8) continue;
    const g=grad(x,z); if(g>0.95) continue;
    const fd=forestDensity(x,z);
    if(rand()>fd*fd*1.15+0.015) continue;
    const alt=smoothstep(6,24,h)+noise2(x*0.03,z*0.03)*0.25;
    let type;
    if(rand()<alt*0.85+0.08) type=rand()<0.55?'pine':'spruce';
    else { const r2=rand(); type=r2<0.28?'oakA':r2<0.5?'oakB':r2<0.9?'birch':'snag'; }
    const young=rand()<0.14;
    let s=young?R(0.3,0.55):R(0.75,1.35);
    if(type==='snag') s=R(0.7,1.1);
    const spacing=young?1.6:(type.startsWith('oak')?4.2:2.6)*Math.min(s,1.1);
    if(!canPlace(x,z,spacing)) continue;
    addCol(x,z,RAD[type]*s);
    const m=mtx(x,h-0.15,z,rand()*TAU,s*R(0.92,1.08),s*R(0.9,1.15),s*R(0.92,1.08),R(-0.05,0.05),R(-0.05,0.05));
    let pal=PAL.pine;
    if(type==='spruce') pal=PAL.spruce;
    else if(type.startsWith('oak')) pal=rand()<autumnAmt(x,z)?PAL.autumn:PAL.oak;
    else if(type==='birch') pal=rand()<autumnAmt(x,z)?PAL.birchAutumn:PAL.birch;
    items[type].push({x,z,m,c:tint(pick(pal))});
    trees.push({x,z,s});
    placed++;
  }
  for(const k in G.trees){
    const list=items[k]; if(!list.length) continue;
    addInstanced(G.trees[k].trunk, matBark, list.map(i=>({x:i.x,z:i.z,m:i.m})), {cast:true,receive:true});
    if(G.trees[k].leaves) addInstanced(G.trees[k].leaves, k==='pine'||k==='spruce'?matConifer:matBroad, list, {cast:true,receive:true});
  }
  yield;

  // bushes
  const bushItems=[[],[]];
  for(let a=0,n=0;a<30000*per && n<(Q*(LOW?900:1400))*per;a++){
    if((a&511)===511) yield;
    const [x,z]=pt(8), h=getH(x,z);
    if(h<0.6 || grad(x,z)>0.8) continue;
    if(vDist(x,z)<VIL.r+2 || nearPath(x,z,2) || Math.hypot(x-ARENA.x,z-ARENA.z)<ARENA.r+2) continue;
    const fd=forestDensity(x,z);
    if(rand()>clamp(1-Math.abs(fd-0.55)*2)+0.08) continue;
    const s=R(0.6,1.5), bloom=rand()<0.1;
    bushItems[n%2].push({x,z,m:mtx(x,h-0.1,z,rand()*TAU,s*R(0.9,1.2),s*R(0.7,1.1),s*R(0.9,1.2)),c:tint(pick(bloom?PAL.shrubBloom:PAL.bush))});
    n++;
  }
  G.bush.forEach((g,i)=>{ if(bushItems[i].length) addInstanced(g,matBush,bushItems[i],{cast:true,receive:true,maxDist:170}); });
  yield;

  // ferns
  const fernItems=[];
  for(let a=0,n=0;a<30000*per && n<(Q*(LOW?2600:4200))*per;a++){
    if((a&511)===511) yield;
    const [x,z]=pt(8), h=getH(x,z);
    if(h<0.8 || grad(x,z)>0.75 || forestDensity(x,z)<0.45 || vDist(x,z)<VIL.r || Math.hypot(x-ARENA.x,z-ARENA.z)<ARENA.r) continue;
    const s=R(0.6,1.3);
    fernItems.push({x,z,m:mtx(x,h-0.03,z,rand()*TAU,s,s*R(0.8,1.2),s),c:tint(pick(PAL.fern))}); n++;
  }
  if(fernItems.length) addInstanced(G.fern,matFern,fernItems,{receive:true,maxDist:110});
  yield;

  // grass
  const grassItems=[], gc=new THREE.Color(), fresh=new THREE.Color(0x5f8f35);
  const GN=Math.round(56000*Q*Q*per*0.8);
  for(let a=0,n=0;a<GN*4 && n<GN;a++){
    if((a&511)===511) yield;
    const [x,z]=pt(4), h=getH(x,z);
    if(h<0.5) continue;
    const g=grad(x,z), fd=forestDensity(x,z);
    if(rand()>(1-smoothstep(0.55,0.95,fd)*0.75)*(1-smoothstep(0.6,0.95,g))) continue;
    if(vDist(x,z)<VIL.r+26){ if(plazaAmt(x,z)>0.3 || pathAmt(x,z)>0.35 || inBox(x,z,0.3)) continue; if(vDist(x,z)<VIL.r && rand()<0.4) continue; }
    const meadow=smoothstep(0.1,0.7,noise2(x*0.025+9,z*0.025-4))*(1-fd);
    const s=R(0.75,1.2);
    terrainColor(x,z,h,g,gc); gc.lerp(fresh,0.3).multiplyScalar(R(0.95,1.2));
    grassItems.push({x,z,m:mtx(x,h-0.02,z,rand()*TAU,s,s*R(0.8,1.15)*(1+meadow*0.9),s),c:gc.clone()}); n++;
  }
  if(grassItems.length) addInstanced(G.grass,matGrass,grassItems,{receive:true,maxDist:95});
  yield;

  // wildflowers
  const stemItems=[], headItems=[];
  for(let a=0,n=0;a<60000*per && n<(Q*(LOW?2600:4600))*per;a++){
    if((a&511)===511) yield;
    const [x,z]=pt(6), h=getH(x,z);
    if(h<0.8 || grad(x,z)>0.6 || forestDensity(x,z)>0.5 || vDist(x,z)<VIL.r+1) continue;
    if(noise2(x*0.04+11,z*0.04-3)<0.15) continue;
    const idx=rand()<0.8?Math.floor((noise2(x*0.02-50,z*0.02+50)*0.5+0.5)*PAL.flowers.length)%PAL.flowers.length:Math.floor(rand()*PAL.flowers.length);
    const s=R(0.7,1.35), m=mtx(x,h-0.02,z,rand()*TAU,s,s,s);
    stemItems.push({x,z,m}); headItems.push({x,z,m,c:tint(PAL.flowers[idx],0.08)}); n++;
  }
  if(stemItems.length){ addInstanced(G.stem,matFlower,stemItems,{maxDist:85}); addInstanced(G.head,matFlower,headItems,{maxDist:85}); }
  yield;

  // rocks
  const rockItems=[];
  for(let a=0,n=0;a<40000*per && n<(Q*(LOW?650:950))*per;a++){
    if((a&511)===511) yield;
    const [x,z]=pt(6), h=getH(x,z);
    if(h<-1 || vDist(x,z)<VIL.r+3 || nearPath(x,z,2) || Math.hypot(x-ARENA.x,z-ARENA.z)<ARENA.r+3) continue;
    if(rand()>0.12+smoothstep(0.5,1.2,grad(x,z))*0.7) continue;
    const big=rand()<0.2, b=big?R(0.9,2.3):R(0.2,0.65);
    const sx=b*R(0.8,1.4), sy=b*R(0.5,1.0), sz=b*R(0.8,1.3);
    if(big){ if(Math.hypot(x-spawn.x,z-spawn.z)<6) continue; addCol(x,z,Math.min(sx,sz)*0.9); }
    rockItems.push({x,z,m:mtx(x,h-sy*0.3,z,rand()*TAU,sx,sy,sz,R(-0.2,0.2),R(-0.2,0.2)),c:tint(0xffffff,0.1)}); n++;
  }
  if(rockItems.length) addInstanced(G.rock,matRock,rockItems,{cast:true,receive:true});

  // fallen logs
  const logItems=[];
  for(let a=0,n=0;a<20000*per && n<(Q*(LOW?110:160))*per;a++){
    const [x,z]=pt(10), h=getH(x,z);
    if(h<1 || grad(x,z)>0.3 || forestDensity(x,z)<0.4 || vDist(x,z)<VIL.r+4 || Math.hypot(x-ARENA.x,z-ARENA.z)<ARENA.r+3) continue;
    const s=R(0.8,1.2), l=R(0.7,1.4);
    logItems.push({x,z,m:mtx(x,h+0.18*s,z,rand()*TAU,l,s,s)}); n++;
  }
  if(logItems.length) addInstanced(G.log,matBark,logItems,{cast:true,receive:true});
  yield;

  // mushrooms around this area's trees
  const mushItems=[];
  for(let a=0;a<(Q*(LOW?260:420))*per*1.5 && trees.length;a++){
    const t=pick(trees); if(t.s<0.6) continue;
    const ang=rand()*TAU, d=R(0.7,1.8)*t.s, cx=t.x+Math.cos(ang)*d, cz=t.z+Math.sin(ang)*d;
    const brown=rand()<0.45, cnt=1+Math.floor(rand()*4);
    for(let k=0;k<cnt;k++){
      const x=cx+R(-0.3,0.3), z=cz+R(-0.3,0.3), h=getH(x,z); if(h<0.8) continue;
      const s=R(0.6,1.7);
      mushItems.push({x,z,m:mtx(x,h-0.02,z,rand()*TAU,s,s,s,R(-0.15,0.15),R(-0.15,0.15)),c:brown?new THREE.Color(1.35,1.05,0.75):tint(0xffffff,0.08)});
    }
  }
  if(mushItems.length) addInstanced(G.mush,matBark,mushItems,{receive:true,maxDist:70});

  // reeds on the shoreline
  const reedItems=[];
  for(let a=0,n=0;a<15000 && n<(Q*(LOW?1000:1700))/5;a++){
    if((a&1023)===1023) yield;
    const [x,z]=pt(6), h=getH(x,z);
    if(h<-0.6 || h>0.9) continue;
    const s=R(0.75,1.3);
    reedItems.push({x,z,m:mtx(x,h-0.05,z,rand()*TAU,s,s*R(0.85,1.2),s),c:tint(0xffffff,0.12)}); n++;
  }
  if(reedItems.length) addInstanced(G.reeds,matReed,reedItems,{receive:true,maxDist:130});

  // lily pads
  const lilyItems=[], lilyFlowers=[];
  for(let a=0,n=0;a<15000 && n<(Q*(LOW?260:420))/4;a++){
    if((a&1023)===1023) yield;
    const [x,z]=pt(6), h=getH(x,z);
    if(h<-1.6 || h>-0.4) continue;
    const s=R(0.6,1.3), ry=rand()*TAU;
    lilyItems.push({x,z,m:mtx(x,WATER+0.025,z,ry,s,1,s),c:tint(pick(PAL.lily))});
    if(rand()<0.18) lilyFlowers.push({x,z,m:mtx(x+R(-0.1,0.1),WATER+0.04,z+R(-0.1,0.1),ry,s,s,s),c:new THREE.Color(rand()<0.5?0xfaf6f0:0xf2a6c4)});
    n++;
  }
  if(lilyItems.length) addInstanced(G.lily,matFlat,lilyItems,{receive:true});
  if(lilyFlowers.length) addInstanced(G.lilyFlower,matFlat,lilyFlowers,{});
}

