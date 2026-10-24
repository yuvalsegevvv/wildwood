//@ The Deep Cave's ambient life: particles near you (drips and glow motes, sparkles, mist and fish glints, embers and heat haze) through the spark pool, and small static props (rubble, bones, mushrooms, crystals) set into each chamber
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (the cave case builds every floor and ticks it).
   exports: caveLifeTick(dt) (zone.js caveFrame: spawns a few particles a second around you, by the floor's theme; none on LITE, fewer on LOW), caveLifeProps(C) (view.js caveViewBuild, after the theme's pre(C): pushes C.items
            into the chambers), CAVE_LIFE (spawn clocks)
   users: zone.js, view.js; draws through fxpAdd / fxpSmoke (combat/fx-pool.js: one draw call each, so no extra cost), props through dgvPut (dungeon/view.js) into the chunk's lit / glow meshes.
   All client-only and cosmetic: nothing is synced and nothing changes where a hiker can walk. */
const CAVE_LIFE={acc:{a:0,b:0,c:0,d:0}};
function caveLifeTick(dt){
  const R=CAVE_RUN; if(!R||LITE||!CAVE_VIEW.g) return;
  const B=R.B, th=R.F.theme, M=CAVE_CELL, A=CAVE_LIFE.acc, k=(LOW?0.45:1)*dt, lx=P.x-R.ox, lz=P.z-R.oz;
  const spot=(a,b)=>{ const ang=AR(0,TAU), d=AR(a,b), x=lx+Math.sin(ang)*d, z=lz+Math.cos(ang)*d, gx=Math.floor(x/M), gz=Math.floor(z/M);
    if(gx<0||gz<0||gx>=B.w||gz>=B.h||!B.open[gz*B.w+gx]) return null; return [x,z,gz*B.w+gx]; };
  const W=(x,z)=>[x+R.ox,z+R.oz], gy=(x,z)=>caveGroundY(x+R.ox,z+R.oz);
  if(th==='grotto'){
    A.a+=k*3; while(A.a>1){ A.a--; const s=spot(2,16); if(!s) continue; const top=R.y+caveCeilAt(s[0],s[1])-0.3, w=W(s[0],s[1]);   // a drip from the ceiling
      fxpAdd(w[0],top,w[1],0,0,0,0x9adcff,0.09,AR(0.7,1.1),{g:11,white:0.5,grow:0.6,a:0.9}); }
    A.b+=k*3.5; while(A.b>1){ A.b--; const s=spot(2,15); if(!s) continue; const w=W(s[0],s[1]), y=gy(s[0],s[1])+AR(0.4,3.2);   // a glow mote drifting
      fxpAdd(w[0],y,w[1],AR(-0.2,0.2),AR(-0.05,0.25),AR(-0.2,0.2),0x5ad0ff,0.2,AR(2.5,4.5),{drag:0.3,white:0.2,grow:1.1,a:0.7}); }
  } else if(th==='prism'){
    A.a+=k*6; while(A.a>1){ A.a--; const s=spot(2,16); if(!s) continue; const w=W(s[0],s[1]), h=R.K.hues[Math.floor(Math.random()*R.K.hues.length)];   // a sparkle
      fxpAdd(w[0],gy(s[0],s[1])+AR(0.3,3.5),w[1],0,0,0,h,0.17,AR(0.35,0.8),{white:0.6,grow:0.2,a:0.95}); }
    A.b+=k*2; while(A.b>1){ A.b--; const s=spot(3,16); if(!s) continue; const w=W(s[0],s[1]), h=R.K.hues[Math.floor(Math.random()*R.K.hues.length)];   // a slow mote
      fxpAdd(w[0],gy(s[0],s[1])+AR(0.5,2.5),w[1],AR(-0.15,0.15),AR(0.05,0.3),AR(-0.15,0.15),h,0.28,AR(3,5),{drag:0.2,white:0.3,grow:1.2,a:0.55}); }
  } else if(th==='drowned'){
    A.a+=k*2.5; while(A.a>1){ A.a--; const s=spot(2,18); if(!s||!B.water[s[2]]) continue; const w=W(s[0],s[1]);   // mist over the water
      fxpSmoke(w[0],gy(s[0],s[1])+0.2,w[1],AR(-0.1,0.1),AR(0.1,0.3),AR(-0.1,0.1),0x4a7a76,1.6,AR(3,5),{grow:2.2,a:0.28}); }
    A.b+=k*2.5; while(A.b>1){ A.b--; const s=spot(2,16); if(!s) continue; const top=R.y+caveCeilAt(s[0],s[1])-0.3, w=W(s[0],s[1]);   // falling droplets
      fxpAdd(w[0],top,w[1],0,0,0,0x9affe0,0.09,AR(0.8,1.3),{g:10,white:0.5,grow:0.6,a:0.9}); }
    A.c+=k*0.8; while(A.c>1){ A.c--; const s=spot(3,16); if(!s||!B.water[s[2]]) continue; const w=W(s[0],s[1]), y=gy(s[0],s[1])+0.12;   // a fish: a glint that slides and goes
      const a=AR(0,TAU); fxpAdd(w[0],y,w[1],Math.sin(a)*0.9,0,Math.cos(a)*0.9,0xd0fff4,0.2,AR(0.5,0.9),{white:0.5,grow:0.3,a:0.85}); }
  } else if(th==='magma'){
    A.a+=k*5; while(A.a>1){ A.a--; const s=spot(2,16); if(!s) continue; const w=W(s[0],s[1]);   // an ember rising
      fxpAdd(w[0],gy(s[0],s[1])+AR(0.1,1.2),w[1],AR(-0.3,0.3),AR(0.8,2),AR(-0.3,0.3),0xff7a2a,0.15,AR(1.6,3),{drag:0.3,white:0.2,grow:0.1,a:0.95}); }
    A.b+=k*1.4; while(A.b>1){ A.b--; const s=spot(3,15); if(!s) continue; const w=W(s[0],s[1]);   // a puff of heat haze
      fxpSmoke(w[0],gy(s[0],s[1])+0.5,w[1],AR(-0.15,0.15),AR(0.5,1),AR(-0.15,0.15),0x6a3a2a,1.4,AR(2.5,4),{grow:2.4,a:0.2}); }
  }
}
// small props where a chamber is bare: placed with the floor's rng, so every hiker sees the same ones
function caveLifeProps(C){
  const B=C.B, M=CAVE_CELL, th=C.F.theme, K=C.K, per=C.low?0.6:1;
  const rubble=(x,z)=>C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z), n=2+Math.floor(C.rng()*3);
    for(let q=0;q<n;q++){ const r=0.12+C.rng()*0.3; dgvPut(A.lit,new THREE.IcosahedronGeometry(r,0),x+(C.rng()-0.5)*1.1,y+r*0.45,z+(C.rng()-0.5)*1.1,{sx:1.2,sy:0.7,sz:1,ry:C.rng()*3,col:C.lit(K.wall2===undefined?K.wall:K.wall2,x,z,2.6),va:0.25,foot:0.2}); } }});
  const bones=(x,z)=>C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z), bc=C.lit(0xd8d0b8,x,z,1.6);
    dgvPut(A.lit,new THREE.SphereGeometry(0.2,7,5),x,y+0.16,z,{sy:0.85,col:bc,va:0.08});   // a skull
    for(let q=0;q<3;q++){ const l=0.5+C.rng()*0.4; dgvPut(A.lit,new THREE.CylinderGeometry(0.035,0.035,l,5),x+(C.rng()-0.5)*0.9,y+0.04,z+(C.rng()-0.5)*0.9,{rz:Math.PI/2,ry:C.rng()*3,col:bc,va:0.08}); } }});
  const shroom=(x,z,hue)=>C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z), n=2+Math.floor(C.rng()*4);
    for(let q=0;q<n;q++){ const h=0.18+C.rng()*0.4, r=0.1+C.rng()*0.12, px=x+(C.rng()-0.5)*0.8, pz=z+(C.rng()-0.5)*0.8;
      dgvPut(A.lit,new THREE.CylinderGeometry(r*0.3,r*0.4,h,5),px,y+h/2,pz,{col:C.lit(0xc8c8b0,px,pz,1.6),va:0.05});
      dgvPut(A.glow,new THREE.SphereGeometry(r*1.5,7,4),px,y+h,pz,{sy:0.55,col:cavevHexCol(hue,0.7+C.rng()*0.5),va:0.1}); } }});
  const column=(x,z)=>C.items.push({x,z,fn:(A,x,z,C)=>{ const y=C.hAt(x,z), r=0.5+C.rng()*0.3, h=0.3+C.rng()*0.7;   // a broken pillar drum
    dgvPut(A.lit,new THREE.CylinderGeometry(r,r*1.05,h,8),x,y+h/2-0.05,z,{rx:(C.rng()-0.5)*0.3,col:C.lit(K.wall,x,z,2.4),va:0.12,foot:0.2}); }});
  const crystals=(x,z,hue)=>C.items.push({x,z,fn:(A,x,z,C)=>{ cavevCrystals(C,A,x,C.hAt(x,z)+0.05,z,0,0,hue,3+Math.floor(C.rng()*3),0.55); }});
  for(const ch of B.chambers){ if(ch.r<6) continue;
    const n=Math.max(2,Math.round(ch.r/2.6*per));
    for(let q=0;q<n;q++){ const a=C.rng()*6.28, d=C.rng()*ch.r*0.85, x=ch.x+Math.sin(a)*d, z=ch.z+Math.cos(a)*d, i=C.cellOf(x,z);
      if(!B.open[i]||B.water[i]||B.lava[i]||B.dw[i]<1.2) continue; const pick=C.rng();
      if(th==='grotto') (pick<0.45?shroom(x,z,0x5ad0ff):pick<0.8?rubble(x,z):bones(x,z));
      else if(th==='prism') (pick<0.55?crystals(x,z,K.hues[Math.floor(C.rng()*K.hues.length)]):pick<0.85?rubble(x,z):bones(x,z));
      else if(th==='drowned') (pick<0.3?column(x,z):pick<0.55?shroom(x,z,0x9affc8):pick<0.8?rubble(x,z):bones(x,z));
      else (pick<0.5?rubble(x,z):pick<0.75?bones(x,z):crystals(x,z,0xff6a20)); } }
}
