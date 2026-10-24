//@ The Deep Cave's four looks: the Glowworm Grotto (blue ceilings, stalactites, still pools), the Prism Hollows (geodes and split light), the Drowned Galleries (flooded halls, river, waterfalls) and the Magma Heart (lava, obsidian, embers)
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (the cave case builds all four), tools/cave-smoke.js.
   exports: CAVE_THEME_VIEW.grotto / prism / drowned / magma = {shine, spec, pre(C), floorTint(C, x, z, color, water), ceilTint(C, x, z, color)} (filled here, read by view.js caveViewBuild), cavevScatter(C, n, pred),
            cavevWaterSheet(C, mask, y, col, op, tex) -> mesh, cavevRipple() / cavevStreaks() (tiling textures), cavevCrystal(A, put, x, y, z, ...) -> void
   users: view.js. Floor look rows (shared/cave/floor-<n>-<id>.js: look.fx, look.hues, look.water, look.lava, look.glow) say what to switch on.
   pre(C) runs before the light is baked: it pushes emitters (C.emit: {x, z, col, i, r, skip, lamp}), whole-floor washes (C.fields: fn(cellIndex, x, z, out[r, g, b]) adds light), props (C.items: {x, z, fn(A, x, z, C)},
   drawn in the 16 x 16 chunk they stand in; A.lit is lit rock, A.glow unlit colours, A.soft additive haze) and the things to build once the rock is there (C.after: fn(C)), animations in C.ticks (fn(dt)).
   Coordinates in pre are floor-local metres; C.hAt(x, z) is the ground's height there, caveCeilAt(x, z) the ceiling's. Props are decoration: nothing here changes where a hiker can walk. */
const cavevPick=(C,a)=>a[Math.floor(C.rng()*a.length)];
// n random spots on cave air for which pred(cellIndex, x, z) holds (at most 8 tries each)
function cavevScatter(C,n,pred){
  const out=[], B=C.B, M=CAVE_CELL; for(let k=0;k<n*8&&out.length<n;k++){
    const gx=2+Math.floor(C.rng()*(C.W-4)), gz=2+Math.floor(C.rng()*(C.H-4)), i=gz*C.W+gx; if(!B.open[i]) continue;
    const x=(gx+0.2+C.rng()*0.6)*M, z=(gz+0.2+C.rng()*0.6)*M; if(!pred||pred(i,x,z)) out.push([x,z]); }
  return out;
}
function cavevTex(draw,size){
  try{ const c=document.createElement('canvas'); c.width=c.height=size||128; const x=c.getContext('2d'); if(!x) return null; draw(x,c.width);
    const tx=new THREE.CanvasTexture(c); tx.wrapS=tx.wrapT=THREE.RepeatWrapping; CAVE_VIEW.texs.push(tx); return tx; }catch(err){ return null; }
}
const cavevRipple=()=>cavevTex((x,s)=>{ x.fillStyle='#b8c4cc'; x.fillRect(0,0,s,s); for(let i=0;i<46;i++){ const a=Math.random(), px=Math.random()*s, py=Math.random()*s; x.fillStyle=a<0.5?'rgba(255,255,255,0.22)':'rgba(40,60,80,0.22)'; x.beginPath(); x.ellipse(px,py,6+Math.random()*16,2+Math.random()*5,Math.random()*3,0,6.3); x.fill(); } });
const cavevStreaks=(dark)=>cavevTex((x,s)=>{ x.fillStyle=dark||'#000'; x.fillRect(0,0,s,s); for(let i=0;i<34;i++){ const px=Math.random()*s, w=1+Math.random()*4; const gr=x.createLinearGradient(0,0,0,s); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.3+Math.random()*0.4,'rgba(255,255,255,'+(0.35+Math.random()*0.5)+')'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(px,0,w,s); } });
function cavevWaterSheet(C,mask,y,col,op,tex,k){
  const A=cavevSheet(C,mask,y,(x,z)=>C.litSmooth(col,x,z,k||1.2),0.1), mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:op,depthWrite:false,map:tex||null}); C.mats.push(mat);
  const m=cavevMesh(A,mat,'water'); if(m) m.renderOrder=1; if(tex) C.ticks.push(dt=>{ tex.offset.x+=dt*0.012; tex.offset.y+=dt*0.007; }); return m;
}
const cavevHexCol=(c,k)=>{ _cvC.setHex(c).multiplyScalar(k); return _cvC.getHex(); };
// a cluster of crystals (hexagonal shafts with a pointed tip, each leaning its own way, mostly out of the rock) rising from (x, y, z); (nx, nz): the way out of the rock; hue: hex
function cavevCrystals(C,A,x,y,z,nx,nz,hue,n,sz){
  for(let k=0;k<n;k++){
    const len=(1.0+C.rng()*1.9)*sz, r=(0.07+C.rng()*0.1)*sz, L=0.35+C.rng()*0.6, dx=nx*0.7+(C.rng()-0.5)*1.4, dz=nz*0.7+(C.rng()-0.5)*1.4;
    const rz=-Math.asin(Math.max(-0.95,Math.min(0.95,dx*L*0.7))), rx=Math.asin(Math.max(-0.95,Math.min(0.95,dz*L*0.7/Math.cos(rz)))), ax=-Math.sin(rz), ay=Math.cos(rz)*Math.cos(rx), az=Math.cos(rz)*Math.sin(rx);
    const bx=x+(C.rng()-0.5)*0.9, bz=z+(C.rng()-0.5)*0.9, c1=cavevHexCol(hue,0.55+C.rng()*0.3), c2=cavevHexCol(hue,1.5);
    dgvPut(A.glow,new THREE.CylinderGeometry(r*0.85,r,len,6,1),bx+ax*len/2,y+ay*len/2,bz+az*len/2,{rx,rz,col:c1,top:c2,h:len,va:0.1});
    dgvPut(A.glow,new THREE.ConeGeometry(r*0.85,len*0.35,6),bx+ax*len*1.17,y+ay*len*1.17,bz+az*len*1.17,{rx,rz,col:c2,va:0.06});
  }
}

/* ============ floor 1: the Glowworm Grotto ============ */
CAVE_THEME_VIEW.grotto={shine:26,spec:0x2c3238,
  floorTint(C,x,z,c,water){ if(water) c.multiplyScalar(0.7).lerp(_cvD.setHex(0x1c4660),0.35); },
  pre(C){
    const B=C.B, K=C.K, M=CAVE_CELL, col=new THREE.Color(K.light), low=C.low;
    C.fields.push((i,x,z,o)=>{ const n=noise2(x*0.07+11,z*0.07-5)*0.5+0.5, k=0.1+0.5*Math.max(0,n-0.4)*1.6; o[0]+=col.r*k*0.5; o[1]+=col.g*k*0.55; o[2]+=col.b*k*0.7; });
    for(const p of B.pools) C.emit.push({x:p.x,z:p.z,col:0x3a9ac8,i:0.45,r:p.r+7,skip:0});
    // stalactites from the ceiling, stalagmites near the walls, here and there a column where they met
    const nst=low?240:640, nsg=low?90:240;
    for(const [x,z] of cavevScatter(C,nst,i=>B.dw[i]>=0.8)) { const len=0.5+C.rng()*(B.dw[C.cellOf(x,z)]>3?3.2:1.6), r=0.1+C.rng()*0.22+len*0.06, sh=0.8+C.rng()*0.4;
      C.items.push({x,z,fn:(A,x,z,C)=>{ const top=caveCeilAt(x,z); dgvPut(A.lit,new THREE.ConeGeometry(r,len,5,1),x,top-len*0.5+0.1,z,{rx:Math.PI,col:C.lit(K.wall,x,z,2.6*sh),top:C.lit(K.wall2,x,z,1.8),h:len,va:0.1}); }}); }
    for(const [x,z] of cavevScatter(C,nsg,i=>B.dw[i]>=0.7&&B.dw[i]<=1.8&&!B.water[i])) { const len=0.4+C.rng()*1.4, r=0.14+C.rng()*0.24;
      C.items.push({x,z,fn:(A,x,z,C)=>{ dgvPut(A.lit,new THREE.ConeGeometry(r,len,5,1),x,C.hAt(x,z)+len*0.5-0.05,z,{col:C.lit(K.wall,x,z,2.6),va:0.12,foot:0.3}); }}); }
    for(const c of B.chambers) if(c.r>=9&&c.role!=='start') { const gx=c.x+(C.rng()-0.5)*c.r*0.8, gz=c.z+(C.rng()-0.5)*c.r*0.8; if(!B.open[C.cellOf(gx,gz)]||B.water[C.cellOf(gx,gz)]) continue;
      C.items.push({x:gx,z:gz,fn:(A,x,z,C)=>{ const top=caveCeilAt(x,z), y0=C.hAt(x,z), h=top-y0, r=0.55+C.rng()*0.35;
        dgvPut(A.lit,new THREE.CylinderGeometry(r*0.55,r,h,9,1),x,y0+h/2,z,{col:C.lit(K.wall,x,z,2.8),top:C.lit(K.wall2,x,z,2),h,va:0.1,foot:0.3}); dgvPut(A.lit,new THREE.CylinderGeometry(r*1.5,r*0.6,0.9,9),x,y0+0.35,z,{col:C.lit(K.wall,x,z,2.4)}); }}); }
    // the pools: still, dark glass
    C.after.push(C=>{
      if(B.pools.length||B.water.some(v=>v)) cavevWaterSheet(C,B.water,-0.06,0x2d7ea8,0.62,cavevRipple(),1.5);
      // glowworms: points on the ceiling in clusters, a few hanging threads
      const n=low?420:1300, pos=[], cl=[], pos2=[], cl2=[], th=[], thc=[];
      for(const [x,z] of cavevScatter(C,n*1.6,(i,x,z)=>noise2(x*0.09+3,z*0.09+8)>-0.15||C.rng()<0.12)){
        const y=caveCeilAt(x,z)-0.12-C.rng()*0.25, w=0.55+C.rng()*0.45, tgt=pos.length<n*3?[pos,cl]:[pos2,cl2];
        tgt[0].push(x,y,z); tgt[1].push(0.35*w,0.85*w,1.0*w);
        if(!low&&C.rng()<0.14){ const len=0.5+C.rng()*1.3; th.push(x,y,z,x,y-len,z); thc.push(0.3,0.8,1,0,0.05,0.1); } }
      const p1=cavevPoints(C,pos,cl,0.5,0.95), p2=cavevPoints(C,pos2,cl2,0.42,0.7);
      if(p1&&p2) C.ticks.push(()=>{ p1.material.opacity=0.8+0.2*Math.sin(t*1.3); p2.material.opacity=0.6+0.3*Math.sin(t*1.9+2); });
      if(th.length){ const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(th,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(thc,3)); geo.computeBoundingSphere();
        const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}); const ln=new THREE.LineSegments(geo,mat); C.g.add(ln); C.geos.push(geo); C.mats.push(mat); }
    });
  }};

/* ============ floor 2: the Prism Hollows ============ */
CAVE_THEME_VIEW.prism={shine:48,spec:0x4a4a5a,
  floorTint(C,x,z,c){ const n=noise2(x*0.05+2,z*0.05+9)*0.5+0.5, h=C.K.hues[Math.floor(n*C.K.hues.length*0.999)%C.K.hues.length]; c.lerp(_cvD.setHex(h),0.1); },
  pre(C){
    const B=C.B, K=C.K, hues=K.hues, M=CAVE_CELL, low=C.low, hue=k=>hues[((k%hues.length)+hues.length)%hues.length];
    C.fields.push((i,x,z,o)=>{ const n=noise2(x*0.04+5,z*0.04+1)*0.5+0.5, c=_cvD.setHex(hue(Math.floor(n*hues.length*3))); o[0]+=c.r*0.06; o[1]+=c.g*0.06; o[2]+=c.b*0.06; });
    // geodes on the chambers' walls: a dark shell split open on a cluster of crystals, in the colours in turn
    let hi=0;
    const geode=(x,z,n,big)=>{ const h=hue(hi++);
      C.emit.push({x,z,col:h,i:big?0.75:0.5,r:big?11:8,skip:0});
      C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z), k=big?1.6:1;
        dgvPut(A.lit,new THREE.IcosahedronGeometry(1,1),x-n[0]*0.4,y+0.6*k,z-n[1]*0.4,{sx:1.2*k,sy:0.9*k,sz:1.2*k,col:0x2e2c3a,va:0.2,foot:0.3});   // (dark rock: the crystals are what shine)
        cavevCrystals(C,A,x+n[0]*0.2,y+0.5*k,z+n[1]*0.2,n[0],n[1],h,big?10:6,k*1.15);
        }}); };
    for(const ch of B.chambers){ if(ch.role==='start') continue;
      const nG=Math.max(2,Math.round(ch.r/3.2));
      for(let k=0;k<nG;k++){ const a=C.rng()*6.28+k*6.28/nG; let found=null;
        for(let rr=ch.r*1.35;rr>ch.r*0.35&&!found;rr-=0.8){ const x=ch.x+Math.sin(a)*rr, z=ch.z+Math.cos(a)*rr, i=C.cellOf(x,z); if(B.open[i]&&B.dw[i]<1.6&&B.dw[i]>=0.6) found=[x,z,i]; }
        if(!found) continue; geode(found[0],found[1],caveWallNormal(B.dw,B.w,B.h,found[0]/M,found[1]/M),C.rng()<0.3); } }
    for(const g of B.anchors.B.geodes) geode(g.x+g.nx*0.7,g.z+g.nz*0.7,[g.nx,g.nz],true);   // the method B places are the biggest geodes
    // shafts of split light: a tall soft column in a colour from ceiling to floor, with a pool of that colour where it lands
    for(const ch of B.chambers){ if(ch.r<8) continue; const nb=ch.r>11?2:1;
      for(let k=0;k<nb;k++){ const x=ch.x+(C.rng()-0.5)*ch.r*0.9, z=ch.z+(C.rng()-0.5)*ch.r*0.9; if(!B.open[C.cellOf(x,z)]) continue; const h=hue(hi++);
        C.emit.push({x,z,col:h,i:0.8,r:10.5,skip:0,lamp:true});
        if(!low) C.items.push({x,z,fn:(A,x,z,C)=>{ const y0=C.hAt(x,z), top=caveCeilAt(x,z), r=1.1+C.rng()*0.8; dgvPut(A.soft,new THREE.CylinderGeometry(r*0.55,r,top-y0,10,1,true),x,(top+y0)/2,z,{col:cavevHexCol(h,0.2),va:0});
          dgvPut(A.glow,new THREE.CircleGeometry(r*1.5,14).rotateX(-Math.PI/2),x,y0+0.04,z,{col:cavevHexCol(h,0.28),va:0.05}); }}); } }
    C.after.push(C=>{   // sparkle: glints in the air and on the floor of the chambers
      const n=low?260:800, pos=[], cl=[];
      for(const [x,z] of cavevScatter(C,n,(i)=>B.dw[i]>=1)){ const y=C.hAt(x,z)+0.2+C.rng()*3.2, c=_cvD.setHex(hue(Math.floor(C.rng()*9))); const w=0.5+C.rng()*0.5; pos.push(x,y,z); cl.push(0.4+c.r*w,0.4+c.g*w,0.4+c.b*w); }
      const p=cavevPoints(C,pos,cl,0.2,0.9); if(p) C.ticks.push(()=>{ p.material.opacity=0.7+0.3*Math.sin(t*2.3); p.rotation.y=Math.sin(t*0.05)*0.02; });
    });
  }};

/* ============ floor 3: the Drowned Galleries ============ */
CAVE_THEME_VIEW.drowned={shine:30,spec:0x203030,
  floorTint(C,x,z,c,water){ const m=noise2(x*0.1+1,z*0.1+4); if(water) c.multiplyScalar(0.75).lerp(_cvD.setHex(0x1c4c48),0.3); else if(m>0.1) c.lerp(_cvD.setHex(0x3a5a2c),Math.min(0.5,(m-0.1)*1.1)); },
  pre(C){
    const B=C.B, K=C.K, M=CAVE_CELL, low=C.low, tc=new THREE.Color(K.light);
    C.fields.push((i,x,z,o)=>{ if(B.water[i]){ const k=0.04+0.05*Math.sin(x*0.6+z*0.4); o[0]+=tc.r*k; o[1]+=tc.g*k; o[2]+=tc.b*k; } });
    let wn=0; for(let i=0;i<C.N;i++) if(B.water[i]&&B.open[i]&&(i*7919)%11===0&&wn++<(low?60:150)){ const gx=i%C.W, gz=(i-gx)/C.W; C.emit.push({x:(gx+0.5)*M,z:(gz+0.5)*M,col:K.light,i:0.18,r:7,skip:0}); }
    // waterfalls: pour from the ceiling's lip down a wall that has water at its foot; a sheet, mist and a light at the bottom
    const falls=[], wcells=[]; for(let gz=3;gz<C.H-3;gz++) for(let gx=3;gx<C.W-3;gx++){ const i=gz*C.W+gx; if(!B.open[i]||!B.water[i]) continue;
      for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]) if(!B.open[(gz+dz)*C.W+gx+dx]) wcells.push([gx,gz,dx,dz]); }
    const taken=[]; for(let k=0;k<wcells.length*3&&falls.length<(low?3:6);k++){ const w=cavevPick(C,wcells), x=(w[0]+0.5)*M+w[2]*(M/2-0.1), z=(w[1]+0.5)*M+w[3]*(M/2-0.1);
      if(taken.some(q=>Math.hypot(q[0]-x,q[1]-z)<22)||Math.hypot(x-B.start.x,z-B.start.z)<18) continue; taken.push([x,z]); falls.push({x,z,dx:w[2],dz:w[3]}); }
    for(const f of falls){ const ix=f.x-f.dx*0.9, iz=f.z-f.dz*0.9; C.emit.push({x:ix,z:iz,col:0x9af0e0,i:0.7,r:9,skip:0}); }
    C.after.push(C=>{
      const rip=cavevRipple();
      cavevWaterSheet(C,B.water,-0.02,K.water,0.58,rip,1.4);
      // the river: a ribbon of streaks along its course, scrolling downstream
      if(B.river&&B.river.length>3){ const stk=cavevStreaks('#101818'), A={p:[],n:[],c:[],uv:[]}; let u=0;
        for(let k=0;k<B.river.length-1;k++){ const a=B.river[k], b=B.river[k+1], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz)||1, nx=-dz/l*2.4, nz=dx/l*2.4, u1=u+l/6;
          const P0=[a.x+nx,a.z+nz,0,u], P1=[a.x-nx,a.z-nz,1,u], P2=[b.x-nx,b.z-nz,1,u1], P3=[b.x+nx,b.z+nz,0,u1];
          for(const q of [P0,P1,P2,P0,P2,P3]){ A.p.push(q[0],0.02,q[1]); A.n.push(0,1,0); const cc=_cvD.setHex(C.litSmooth(0xa8f4e8,q[0],q[1],1.2)); A.c.push(cc.r,cc.g,cc.b); A.uv.push(q[3],q[2]); } u=u1; }
        const mat=new THREE.MeshBasicMaterial({vertexColors:true,map:stk,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}); C.mats.push(mat); const m=cavevMesh(A,mat,'river'); if(m) m.renderOrder=2;
        if(stk) C.ticks.push(dt=>{ stk.offset.x-=dt*0.5; }); }
      // the falls
      const fs=cavevStreaks('#000'); const mist=[], mc=[];
      for(const f of falls){ const top=caveCeilAt(f.x,f.z)-0.2, y0=-0.05, wd=1.5+C.rng()*1.2, px=f.x-f.dx*0.45, pz=f.z-f.dz*0.45, sx=f.dz?1:0, sz=f.dx?1:0, A={p:[],n:[],c:[],uv:[]};
        const cc=_cvD.setHex(C.lit(0xcff8ee,px,pz,1.8));
        for(const q of [[-1,0],[1,0],[1,1],[-1,0],[1,1],[-1,1]]){ A.p.push(px+sx*wd*q[0],y0+(top-y0)*q[1],pz+sz*wd*q[0]); A.n.push(-f.dx,0,-f.dz); A.c.push(cc.r,cc.g,cc.b); A.uv.push(q[0]*0.5+0.5,q[1]*((top-y0)/6)); }
        const mat=new THREE.MeshBasicMaterial({vertexColors:true,map:fs,transparent:true,opacity:0.8,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}); C.mats.push(mat); const m=cavevMesh(A,mat,'fall'); if(m) m.renderOrder=2;
        if(fs) C.ticks.push(dt=>{ fs.offset.y-=dt*0.9; });
        for(let k=0;k<(low?14:40);k++){ mist.push(f.x-f.dx*(0.4+C.rng()*1.8)+(C.rng()-0.5)*wd*2*sx,y0+0.2+C.rng()*1.4,f.z-f.dz*(0.4+C.rng()*1.8)+(C.rng()-0.5)*wd*2*sz); mc.push(0.5,0.7,0.7); } }
      cavevPoints(C,mist,mc,0.7,0.35);
    });
  }};

/* ============ floor 4: the Magma Heart ============ */
CAVE_THEME_VIEW.magma={shine:70,spec:0x6a5a56,
  floorTint(C,x,z,c){ const n=noise2(x*0.2+1,z*0.2-3); if(n>0.3) c.lerp(_cvD.setHex(0x5a2a1a),Math.min(0.5,(n-0.3)*1.2)); },
  pre(C){
    const B=C.B, K=C.K, M=CAVE_CELL, low=C.low, lc=new THREE.Color(K.lava);
    const lavaCells=[]; for(let i=0;i<C.N;i++) if(B.lava[i]) lavaCells.push(i);
    lavaCells.forEach((i,k)=>{ if(k%(low?7:4)) return; const gx=i%C.W, gz=(i-gx)/C.W; C.emit.push({x:(gx+0.5)*M,z:(gz+0.5)*M,col:K.lava,i:1.0,r:12,skip:0,lamp:k%12===0}); });
    C.fields.push((i,x,z,o)=>{ const n=noise2(x*0.12+7,z*0.12-1)*0.5+0.5; o[0]+=lc.r*0.06*n; o[1]+=lc.g*0.03*n; });
    // vents: small cones of glowing rock on the floor, with a plume of heat
    const vents=cavevScatter(C,low?10:22,i=>B.dw[i]>=1.5&&!B.water[i]&&!B.lava[i]);
    for(const [x,z] of vents){ C.emit.push({x,z,col:K.glow,i:0.7,r:7.5,skip:0});
      C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z); dgvPut(A.lit,new THREE.ConeGeometry(0.9,0.9,7,1,true),x,y+0.3,z,{col:C.lit(0x2a2220,x,z,2.2),va:0.1}); dgvPut(A.glow,new THREE.CircleGeometry(0.38,8).rotateX(-Math.PI/2),x,y+0.7,z,{col:cavevHexCol(K.lava,1.1)});
        if(!C.low) dgvPut(A.soft,new THREE.ConeGeometry(0.9,3.4,8,1,true),x,y+2.4,z,{rx:Math.PI,col:cavevHexCol(K.glow,0.1),va:0}); }}); }
    // obsidian shards: black glass, dark red at the foot
    for(const [x,z] of cavevScatter(C,low?100:300,i=>B.dw[i]>=0.7&&B.dw[i]<=2.2&&!B.lava[i])){ const len=0.5+C.rng()*1.6, r=0.1+C.rng()*0.16, tilt=(C.rng()-0.5)*0.5;
      C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z); dgvPut(A.lit,new THREE.ConeGeometry(r,len,4,1),x,y+len*0.45,z,{rx:tilt,rz:tilt*0.7,ry:C.rng()*3,col:C.lit(0x1a1618,x,z,3.4),va:0.15,foot:0.5}); }}); }
    for(const [x,z] of cavevScatter(C,low?140:420,i=>B.dw[i]>=0.7)){ const len=0.4+C.rng()*2.2, r=0.1+C.rng()*0.2;
      C.items.push({x,z,fn:(A,x,z,C)=>{ const top=caveCeilAt(x,z); dgvPut(A.lit,new THREE.ConeGeometry(r,len,4,1),x,top-len*0.5+0.1,z,{rx:Math.PI,col:C.lit(0x1e1a1a,x,z,3),va:0.15}); }}); }
    C.after.push(C=>{
      // lava: a glowing sheet with slowly moving cracks
      const crack=cavevTex((x,s)=>{ x.fillStyle='#ffb050'; x.fillRect(0,0,s,s); for(let k=0;k<70;k++){ x.fillStyle='rgba(60,10,0,'+(0.25+Math.random()*0.5)+')'; x.beginPath(); x.ellipse(Math.random()*s,Math.random()*s,4+Math.random()*16,3+Math.random()*9,Math.random()*3,0,6.3); x.fill(); } });
      if(lavaCells.length){ const A=cavevSheet(C,B.lava,-0.42,()=>K.lava,0.1,0.15), mat=new THREE.MeshBasicMaterial({vertexColors:true,map:crack}); C.mats.push(mat); const m=cavevMesh(A,mat,'lava');
        C.ticks.push(dt=>{ if(crack){ crack.offset.x+=dt*0.02; crack.offset.y+=dt*0.011; } const k=0.88+0.12*Math.sin(t*1.7)*Math.sin(t*0.9); mat.color.setRGB(k,k*0.95,k*0.9); }); }
      // embers rising from the lava and the vents
      const src=[]; lavaCells.forEach((i,k)=>{ if(k%5===0){ const gx=i%C.W, gz=(i-gx)/C.W; src.push([(gx+0.5)*M,-0.4,(gz+0.5)*M]); } }); for(const v of vents) src.push([v[0],0.7,v[1]]);
      if(src.length){ const n=low?90:260, pos=[], cl=[], vy=[]; for(let k=0;k<n;k++){ const s=cavevPick(C,src); pos.push(s[0]+(C.rng()-0.5)*2.5,s[1]+C.rng()*6,s[2]+(C.rng()-0.5)*2.5); vy.push(0.5+C.rng()*1.2); const w=0.6+C.rng()*0.4; cl.push(1*w,0.45*w,0.12*w); }
        const p=cavevPoints(C,pos,cl,0.26,0.95); if(p){ p.frustumCulled=false; const arr=p.geometry.attributes.position.array;
          C.ticks.push(dt=>{ for(let k=0;k<n;k++){ arr[k*3+1]+=vy[k]*dt; arr[k*3]+=Math.sin(t*1.3+k)*0.25*dt; if(arr[k*3+1]>7.5){ const s=src[(k*7+Math.floor(t))%src.length]; arr[k*3]=s[0]+(Math.random()-0.5)*2.5; arr[k*3+1]=s[1]; arr[k*3+2]=s[2]+(Math.random()-0.5)*2.5; } } p.geometry.attributes.position.needsUpdate=true; }); } }
    });
  }};
