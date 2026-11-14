//@ Per-land vegetation passes for genChunk: the home forest's autumn colours, more cherry trees, bamboo and flowers in the Sakura Vale, the Gloamhorn's dead trees, pumpkin patches and spider webs, and the Sunscar's thinning (ghost trees)
/* Post-passes over genChunk's lists; none draws from the chunk's rand (own mrng, pure position hashes), so what is placed after them does not move.
   lxAutumn(items): in the home forest (not the vale, the Reach, the Greyspine, the Sunscar, the Gloamhorn, the Amber Reach or the isles) about 78 % of the broadleaf trees turn autumn colours.
   lxVale(ci,items,trees): the vale's maples and pines become cherries, groves turn to bamboo (a lower threshold than the planting's), and extra cherries and bamboo are added.
   lxValeFlowers(ci,stem,head): drifts of the vale's flowers. lxGloam(ci,items,trees): spruces become dead snags, more snags, gnarled oaks and yews are added, 40 % of snags wear a spider web (lxSpots).
   lxGround(ci): the Gloamhorn's pumpkin patches and webs (own instanced meshes). lxUnCol: removes a collider (the Sunscar's ghost trees keep theirs while the loop runs so the stream does not move, and lose them after).
   Models: G.pumpkin, G.web (buildLandExtras, called from buildGeometries). Test: client-smoke. */
const LX_AUTUMN={oakA:1,oakB:1,beech:1,poplar:1,rowan:1,hawthorn:1,birch:1,ginkgo:1,maple:1};
function lxHome(x,z){ return !(inVale(x,z)||inHoar(x,z)||inGrey(x,z)||inSun(x,z)||inGloam(x,z)||inAmber(x,z)||inIsles(x,z)); }
function lxCol(P,x,z,k){ const c=new THREE.Color(P[Math.min(P.length-1,(h3(Math.floor(x*2.1),Math.floor(z*2.1),k)*P.length)|0)]); return c.multiplyScalar(0.92+0.16*h3(Math.floor(x*3.7),Math.floor(z*3.7),k+1)); }
function lxAutumn(items){
  for(const k in LX_AUTUMN){ const L=items[k]; if(!L) continue;
    for(const it of L){ if(!lxHome(it.x,it.z)||h3(Math.floor(it.x*1.1),Math.floor(it.z*1.1),71)>0.32) continue;
      it.c=lxCol(k==='birch'?PAL.birchAutumn:k==='ginkgo'?[0xe8c23a,0xf0d04a,0xd8b030]:PAL.autumn,it.x,it.z,72); } }
}
function lxUnCol(x,z){ const a=colGrid.get(ck(Math.floor(x/CG),Math.floor(z/CG))); if(!a) return; for(let i=0;i<a.length;i+=3) if(a[i]===x&&a[i+1]===z){ a.splice(i,3); return; } }
function lxTreeOk(x,z,h){ return h>=0.8&&grad(x,z)<0.95&&!bareGround(x,z)&&!storyClear(x,z)&&!dgEntClear(x,z)&&vDist(x,z)>=VR+6&&!nearPath(x,z,3.5)&&arenaDist(x,z)>=25&&!inTunnelCut(x,z,2)&&Math.hypot(x-spawn.x,z-spawn.z)>=7; }
function lxPlace(items,trees,type,x,z,h,s,rng,col){
  const m=mtx(x,h-0.15,z,rng()*TAU,s*(0.92+rng()*0.16),s*(0.9+rng()*0.25),s*(0.92+rng()*0.16),(rng()-0.5)*0.1,(rng()-0.5)*0.1);
  addCol(x,z,RAD[type]*s); items[type].push({x,z,m,c:col}); trees.push({x,z,s});
}
function lxVale(ci,items,trees){
  const r=chunkRect(ci,0), cx=(r[0]+r[1])/2, cz=(r[2]+r[3])/2; if(!inVale(cx,cz)&&!inVale(r[0],r[2])&&!inVale(r[1],r[3])) return;
  const move=[];
  for(const k of ['maple','pine','kuromatsu','cedar','sakura']){ const L=items[k]; if(!L) continue;
    for(let i=L.length-1;i>=0;i--){ const it=L[i]; if(!inVale(it.x,it.z)) continue; const hv=h3(Math.floor(it.x*1.1),Math.floor(it.z*1.1),73), grove=noise2(it.x*0.02-60,it.z*0.02+14);
      const to=(grove>0.2&&getH(it.x,it.z)<22&&hv<0.6)?'bamboo':(k==='maple'&&hv<0.65||(k==='pine'||k==='kuromatsu'||k==='cedar')&&hv<0.4)?'sakura':null;
      if(to&&to!==k){ L.splice(i,1); move.push([to,it]); } } }
  for(const [to,it] of move){ it.c=lxCol(PAL[to],it.x,it.z,74); items[to].push(it); }
  const {r:rg,R:rr}=mrng((ci*41+13)|0); let n=0;
  for(let a=0;a<44&&n<22;a++){
    const x=rr(r[0]+8,r[1]-8), z=rr(r[2]+8,r[3]-8); if(!inVale(x,z)) continue; const h=getH(x,z); if(!lxTreeOk(x,z,h)||greyWet(x,z,-1.2)) continue;
    const bam=noise2(x*0.02-60,z*0.02+14)>0.2&&h<22, type=bam?'bamboo':'sakura', s=bam?rr(0.8,1.15):rr(0.8,1.3);
    if(!canPlace(x,z,(bam?2.2:4.2)*Math.min(s,1.1))) continue;
    lxPlace(items,trees,type,x,z,h,s,rg,lxCol(PAL[type],x,z,75)); n++;
  }
}
function lxValeFlowers(ci,stem,head){
  const r=chunkRect(ci,0); if(!inVale((r[0]+r[1])/2,(r[2]+r[3])/2)) return;
  const {r:rg,R:rr}=mrng((ci*43+17)|0), FL=PAL.valeFlowers; let n=0;
  for(let c=0;c<26&&n<260;c++){
    const cx=rr(r[0]+6,r[1]-6), cz=rr(r[2]+6,r[3]-6), hex=FL[(rg()*FL.length)|0]; if(!inVale(cx,cz)) continue;
    for(let k=0;k<10;k++){ const a=rg()*TAU, d=rr(0,3.2), x=cx+Math.cos(a)*d, z=cz+Math.sin(a)*d, h=getH(x,z);
      if(h<0.8||grad(x,z)>0.6||forestDensity(x,z)>0.62||vDist(x,z)<VR+1||inTunnelCut(x,z)||bareGround(x,z)||greyWet(x,z,-0.5)) continue;
      const s=rr(0.8,1.4), m=mtx(x,h-0.02,z,rg()*TAU,s,s,s); stem.push({x,z,m}); head.push({x,z,m,c:new THREE.Color(hex).multiplyScalar(0.92+0.16*rg())}); n++; } }
}
let lxSpots=[];
function lxGloam(ci,items,trees){
  lxSpots=[]; const r=chunkRect(ci,0); if(!inGloam((r[0]+r[1])/2,(r[2]+r[3])/2)&&!inGloam(r[0],r[2])&&!inGloam(r[1],r[3])) return;
  const L=items.spruce; for(let i=L.length-1;i>=0;i--){ const it=L[i]; if(inGloam(it.x,it.z)&&h3(Math.floor(it.x*1.1),Math.floor(it.z*1.1),76)<0.75){ L.splice(i,1); it.c=new THREE.Color(0x3a3430); items.snag.push(it); } }
  const {r:rg,R:rr}=mrng((ci*47+19)|0); let n=0;
  for(let a=0;a<110&&n<46;a++){
    const x=rr(r[0]+6,r[1]-6), z=rr(r[2]+6,r[3]-6); if(!inGloam(x,z)) continue; const h=getH(x,z);
    if(h<1.5||grad(x,z)>0.6||gloamIn(x,z)<14||gloamKeepOut(x,z,3)||vDist(x,z)<VR+8||storyClear(x,z)||dgEntClear(x,z)) continue;
    const q=rg(), type=q<0.72?'snag':q<0.9?'gloomoak':'yew', s=type==='snag'?rr(0.7,1.4):rr(0.8,1.3);
    if(!canPlace(x,z,(type==='snag'?2.4:3.4)*Math.min(s,1.1))) continue;
    lxPlace(items,trees,type,x,z,h,s,rg,type==='snag'?new THREE.Color(0x3a3430):lxCol(type==='yew'?PAL.yew:PAL.gloomoak,x,z,77)); n++;
    if(type==='snag'&&rg()<0.45) lxSpots.push({x,z,h});
  }
  for(const it of items.snag) if(inGloam(it.x,it.z)&&h3(Math.floor(it.x*1.7),Math.floor(it.z*1.7),78)<0.3) lxSpots.push({x:it.x,z:it.z,h:getH(it.x,it.z)});
}
function lxGround(ci){
  const r=chunkRect(ci,0); if(!inGloam((r[0]+r[1])/2,(r[2]+r[3])/2)&&!inGloam(r[0],r[2])&&!inGloam(r[1],r[3])) return;
  const {r:rg,R:rr}=mrng((ci*53+23)|0), pump=[], webs=[], OR=[0xe07a1a,0xc8651a,0xd98a22,0xb8501a];
  for(let c=0;c<16;c++){   // patches of 3-8 pumpkins, a few giants
    const cx=rr(r[0]+6,r[1]-6), cz=rr(r[2]+6,r[3]-6), nn=3+((rg()*6)|0);
    for(let k=0;k<nn;k++){ const a=rg()*TAU, d=rr(0,2.6), x=cx+Math.cos(a)*d, z=cz+Math.sin(a)*d, h=getH(x,z);
      if(!inGloam(x,z)||h<1.2||grad(x,z)>0.5||gloamIn(x,z)<12||gloamKeepOut(x,z,2)||vDist(x,z)<VR+4||storyClear(x,z)||dgEntClear(x,z)||nearPath(x,z,1.5)) continue;
      const s=rg()<0.08?rr(1.3,1.8):rr(0.55,1.1);
      pump.push({x,z,m:mtx(x,h+0.12*s,z,rg()*TAU,s,s*rr(0.85,1.1),s,(rg()-0.5)*0.15,(rg()-0.5)*0.15),c:new THREE.Color(OR[(rg()*OR.length)|0]).multiplyScalar(0.85+0.3*rg())}); } }
  for(const p of lxSpots){ const a=rg()*TAU, s=rr(1.3,2.3), x=p.x+Math.cos(a)*0.7, z=p.z+Math.sin(a)*0.7, y=p.h+rr(1.0,2.4);
    webs.push({x,z,m:mtx(x,y,z,a+Math.PI/2,s,s,s,(rg()-0.5)*0.3,(rg()-0.5)*0.3),c:new THREE.Color(0.9,0.9,0.92)}); }
  for(let k=0;k<14;k++){ const x=rr(r[0]+6,r[1]-6), z=rr(r[2]+6,r[3]-6), h=getH(x,z), s=rr(1.2,2.0);   // webs strung low between rocks and brush
    if(!inGloam(x,z)||h<1.2||gloamIn(x,z)<12||gloamKeepOut(x,z,2)||vDist(x,z)<VR+4||nearPath(x,z,1.5)) continue; webs.push({x,z,m:mtx(x,h+rr(0.5,1.0),z,rg()*TAU,s,s,s),c:new THREE.Color(0.88,0.88,0.9)}); }
  if(pump.length) addInstanced(G.pumpkin,matBark,pump,{cast:true,receive:true,maxDist:90,hgt:1.4,rad:1.2});
  if(webs.length) addInstanced(G.web,matFlat,webs,{maxDist:110,hgt:3.2,rad:2.4});
}
function buildLandExtras(){
  // pumpkin: a ribbed, squashed sphere and a short curled stem (vertex colour: pale body shaded in the grooves, dark stem; the instance colour makes it orange)
  const body0=new THREE.SphereGeometry(0.5,12,9), P=body0.attributes.position;
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), a=Math.atan2(z,x), k=1+0.09*Math.cos(a*9); P.setXYZ(i,x*k,y*0.78,z*k); }
  body0.computeVertexNormals(); body0.translate(0,0.4,0);
  const body=paint(body0,(x,y,z,nx,ny,nz,c)=>{ const a=Math.atan2(z,x); const v=0.82+0.18*Math.cos(a*9)+(y<0.1?-0.2:0); c.setRGB(v,v*0.95,v*0.9); });
  const stem=paint(cyl(0.04,0.06,0.2,5).translate(0,0.86,0),()=>_c.setRGB(0.16,0.2,0.1));
  G.pumpkin=merge([body,stem]);
  // web: ten radial threads and three spiral rings as thin flat quads (a web hangs in the XY plane, facing +Z)
  const Pp=[],Nn=[],Cc=[], seg=(ax,ay,bx,by,w)=>{ const dx=bx-ax, dy=by-ay, l=Math.hypot(dx,dy)||1, px=-dy/l*w, py=dx/l*w; Pp.push(ax-px,ay-py,0,ax+px,ay+py,0,bx+px,by+py,0, ax-px,ay-py,0,bx+px,by+py,0,bx-px,by-py,0); for(let i=0;i<6;i++){ Nn.push(0,0,1); Cc.push(0.95,0.95,0.97); } };
  const R0=0.9;
  for(let i=0;i<10;i++){ const a=i/10*TAU+h3(i,3,9)*0.15; seg(0,0,Math.cos(a)*R0,Math.sin(a)*R0,0.012); }
  for(const rr of [0.3,0.55,0.8]) for(let i=0;i<10;i++){ const a0=i/10*TAU, a1=(i+1)/10*TAU, sag=0.94; seg(Math.cos(a0)*rr,Math.sin(a0)*rr,Math.cos((a0+a1)/2)*rr*sag,Math.sin((a0+a1)/2)*rr*sag,0.008); seg(Math.cos((a0+a1)/2)*rr*sag,Math.sin((a0+a1)/2)*rr*sag,Math.cos(a1)*rr,Math.sin(a1)*rr,0.008); }
  G.web=mkGeo(Pp,Nn,Cc);
}
