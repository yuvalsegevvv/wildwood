//@ The Deep Cave's looks for floors 5 and 6: the Frostbound Vaults (ice pillars, icicles, snowdrifts, an aurora wash, falling snow, glassy frozen pools) and the Umbral Deep (giant violet mushrooms, hanging roots, rising spores, dark mist)
/* Agent map. Doc: docs/CAVE.md section 17. Same contract as view-themes.js (CAVE_THEME_VIEW.<theme> = {shine, spec, pre(C), floorTint}), and it uses that file's helpers (cavevScatter, cavevPoints, cavevWaterSheet, cavevHexCol).
   exports: CAVE_THEME_VIEW.frost, CAVE_THEME_VIEW.umbral. Floor rows: shared/cave/floor-5-frost.js, floor-6-umbral.js (theme 'frost' / 'umbral'). Test: tools/client-smoke.js (the cave case builds every floor).
   Falling snow and rising spores are one Points box that follows the hiker (cavevDrift): nothing is built far from you. */
// a box of drifting motes around the hiker: dy < 0 falls, dy > 0 rises; wraps inside the box (local metres, the floor group's frame)
function cavevDrift(C,n,col,size,op,dy){
  const pos=[], cl=[], W=26, Hh=9; for(let k=0;k<n;k++){ pos.push((C.rng()-0.5)*W,C.rng()*Hh,(C.rng()-0.5)*W); const w=0.6+C.rng()*0.4; cl.push(col[0]*w,col[1]*w,col[2]*w); }
  const p=cavevPoints(C,pos,cl,size,op); if(!p) return; const a=p.geometry.attributes.position;
  C.ticks.push(dt=>{ const R=CAVE_RUN; if(!R) return; p.position.set(P.x-R.ox,CAVE_FLOOR_Y+(caveGroundY(P.x,P.z)-CAVE_FLOOR_Y),P.z-R.oz);
    for(let i=0;i<n;i++){ let y=a.getY(i)+dy*dt*(0.6+0.8*((i*37)%10)/10), x=a.getX(i)+Math.sin(t*0.7+i)*dt*0.25; if(y<0) y+=Hh; if(y>Hh) y-=Hh; a.setXYZ(i,x,y,a.getZ(i)); } a.needsUpdate=true; });
}
/* ============ floor 5: the Frostbound Vaults ============ */
CAVE_THEME_VIEW.frost={shine:80,spec:0x8aa8c0,
  floorTint(C,x,z,c,water){ c.lerp(_cvD.setHex(0xcfe8f8),water?0.5:0.22); },
  pre(C){
    const B=C.B, K=C.K, low=C.low, aur=[new THREE.Color(0x3affc8),new THREE.Color(0x5a8aff),new THREE.Color(0xb06aff)];
    // an aurora wash: slow drifting bands of green, blue and violet over the whole floor
    C.fields.push((i,x,z,o)=>{ const n=noise2(x*0.03+4,z*0.03-9)*0.5+0.5, c=aur[Math.min(2,Math.floor(n*3))], k=0.07+0.06*Math.sin(x*0.05+z*0.04); o[0]+=c.r*k; o[1]+=c.g*k; o[2]+=c.b*k; });
    // ice pillars: floor to ceiling in the big chambers, pale and glowing from inside
    for(const c of B.chambers) if(c.r>=8&&c.role!=='start') for(let k=0;k<(c.r>11?3:2);k++){ const gx=c.x+(C.rng()-0.5)*c.r*0.9, gz=c.z+(C.rng()-0.5)*c.r*0.9, i=C.cellOf(gx,gz); if(!B.open[i]||B.water[i]) continue;
      C.emit.push({x:gx,z:gz,col:0x7ad0ff,i:0.5,r:8,skip:0});
      C.items.push({x:gx,z:gz,fn:(A,x,z,C)=>{ const top=caveCeilAt(x,z), y0=C.hAt(x,z), h=top-y0, r=0.5+C.rng()*0.35;
        dgvPut(A.glow,new THREE.CylinderGeometry(r*0.7,r,h,7,1),x,y0+h/2,z,{col:0x7ab8e0,top:0xe8faff,h,va:0.12}); dgvPut(A.glow,new THREE.ConeGeometry(r*1.6,1.1,7),x,y0+0.5,z,{col:0xa8d8f0,va:0.1}); }}); }
    // icicles from the ceiling and snowdrifts against the walls
    for(const [x,z] of cavevScatter(C,low?200:560,i=>B.dw[i]>=0.8)){ const len=0.6+C.rng()*2.2, r=0.07+C.rng()*0.12;
      C.items.push({x,z,fn:(A,x,z,C)=>{ const top=caveCeilAt(x,z); dgvPut(A.glow,new THREE.ConeGeometry(r,len,5,1),x,top-len*0.5+0.1,z,{rx:Math.PI,col:0xa8d8f0,top:0xf0fcff,h:len,va:0.08}); }}); }
    for(const [x,z] of cavevScatter(C,low?60:180,i=>B.dw[i]>=0.7&&B.dw[i]<=1.9&&!B.water[i])){ const s=0.6+C.rng()*1.1;
      C.items.push({x,z,fn:(A,x,z,C)=>{ dgvPut(A.lit,new THREE.IcosahedronGeometry(1,1),x,C.hAt(x,z)+0.05,z,{sx:s*1.4,sy:s*0.45,sz:s*1.2,col:C.lit(0xe8f2fa,x,z,2.4),va:0.06,foot:0.3}); }}); }
    // frozen pools: glass, no ripple; a few ice crystals on the chambers' walls
    for(const c of B.chambers){ if(c.role==='start'||C.rng()<0.4) continue; const a=C.rng()*6.28, x=c.x+Math.sin(a)*c.r*0.9, z=c.z+Math.cos(a)*c.r*0.9, i=C.cellOf(x,z); if(!B.open[i]||B.dw[i]<0.6||B.dw[i]>1.7) continue;
      const n=caveWallNormal(B.dw,B.w,B.h,x/CAVE_CELL,z/CAVE_CELL); C.emit.push({x,z,col:0x9fe8ff,i:0.45,r:7,skip:0}); C.items.push({x,z,fn:(A,x,z,C)=>cavevCrystals(C,A,x,C.hAt(x,z)+0.3,z,n[0],n[1],0x8ad8ff,5,1.1)}); }
    C.after.push(C=>{
      if(B.pools.length||B.water.some(v=>v)) cavevWaterSheet(C,B.water,-0.04,0xc0e8ff,0.8,null,1.6);
      cavevDrift(C,low?160:520,[0.9,0.95,1],0.16,0.85,-0.7);   // snow
    });
  }};
/* ============ floor 6: the Umbral Deep ============ */
CAVE_THEME_VIEW.umbral={shine:20,spec:0x24203a,
  floorTint(C,x,z,c,water){ c.multiplyScalar(0.8).lerp(_cvD.setHex(0x2a1a4a),water?0.5:0.25); },
  pre(C){
    const B=C.B, K=C.K, low=C.low, M=CAVE_CELL, col=new THREE.Color(K.light);
    // a dark mist with violet pulses drifting through it
    C.fields.push((i,x,z,o)=>{ const n=noise2(x*0.06+7,z*0.06+2)*0.5+0.5, k=0.04+0.26*Math.max(0,n-0.45); o[0]+=col.r*k*0.6; o[1]+=col.g*k*0.3; o[2]+=col.b*k*0.8; });
    // giant mushrooms: a pale stem and a glowing violet cap, each lighting its patch of floor
    const cap=[0x9a5aff,0xc06aff,0x6a6aff,0xff6ad0];
    let ci=0; for(const [x,z] of cavevScatter(C,low?40:110,i=>B.dw[i]>=1.0&&!B.water[i])){ const h=1.2+C.rng()*3.4, r=0.5+C.rng()*1.3, cc=cap[ci++%cap.length];
      C.emit.push({x,z,col:cc,i:0.5,r:r*4+4,skip:0});
      C.items.push({x,z,fn:(A,x,z,C)=>{ const y0=C.hAt(x,z);
        dgvPut(A.lit,new THREE.CylinderGeometry(r*0.2,r*0.3,h,7,1),x,y0+h/2,z,{col:C.lit(0xc8bce0,x,z,2.4),va:0.1,foot:0.3});
        dgvPut(A.glow,new THREE.SphereGeometry(r,10,6,0,6.283,0,1.5),x,y0+h,z,{sy:0.55,col:cavevHexCol(cc,0.7),top:cc,h:r*0.6,va:0.1});
        dgvPut(A.soft,new THREE.CircleGeometry(r*2.2,12).rotateX(-Math.PI/2),x,y0+0.05,z,{col:cavevHexCol(cc,0.3),va:0}); }}); }
    for(const [x,z] of cavevScatter(C,low?60:200,i=>B.dw[i]>=0.7&&B.dw[i]<=1.7&&!B.water[i])){ const s=0.15+C.rng()*0.25, cc=cap[Math.floor(C.rng()*4)];   // small caps along the walls
      C.items.push({x,z,fn:(A,x,z,C)=>{ dgvPut(A.glow,new THREE.SphereGeometry(s,7,4,0,6.283,0,1.5),x,C.hAt(x,z)+s*0.6,z,{sy:0.6,col:cavevHexCol(cc,0.8),top:cc,h:s,va:0.1}); }}); }
    // pools: ink-dark glass
    C.after.push(C=>{
      if(B.pools.length||B.water.some(v=>v)) cavevWaterSheet(C,B.water,-0.06,0x1a1040,0.75,cavevRipple(),1.2);
      // hanging roots: dark threads from the ceiling with a violet tip
      const th=[], thc=[]; for(const [x,z] of cavevScatter(C,low?90:300,i=>B.dw[i]>=0.8)){ const y=caveCeilAt(x,z), len=1+C.rng()*3.5; th.push(x,y,z,x+(C.rng()-0.5)*0.4,y-len,z+(C.rng()-0.5)*0.4); thc.push(0.1,0.05,0.2,0.55,0.3,1); }
      if(th.length){ const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(th,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(thc,3)); geo.computeBoundingSphere();
        const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false}); const ln=new THREE.LineSegments(geo,mat); C.g.add(ln); C.geos.push(geo); C.mats.push(mat); }
      cavevDrift(C,low?120:400,[0.7,0.4,1],0.18,0.8,0.5);   // spores drifting up
    });
  }};
