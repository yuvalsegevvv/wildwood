//@ Dragonflies that hover and dart low over ponds, rivers and tarns by day: a few pooled meshes with humming wings
/* Agent map. updateDragonflies(dt) (main/loop.js, after updateFish) keeps up to DFL_N dragonflies over open water 7-30 m from the camera, only by day, not in rain and only in the lands
   with fresh water and warmth (home forest, Sakura Vale, Greyspine: waLandId 0, 1, 3). Each one hovers a second or two (a small figure-of-eight, wings a blur) and then darts to another spot of water a few
   metres away; one that falls behind is put over a new pond near you. The meshes are built with the monster helpers (moEll, moBone: combat/monster-parts.js) and the wings are a second,
   see-through mesh on a pivot per side that beats; the head is +z (they use lookAt). Nothing is synced or saved; phones get fewer.
   Test: client-smoke (the loop runs it). */
const DFL_N=LITE?2:(LOW?4:7);
const DFL_COLS=[0x4a9ae8,0x38c8a0,0xe0503a,0xe8b838,0x9a6ae0];   // the bodies' tints: blue, teal, red, amber, violet
const DFL={list:[],body:null,wing:null,wmat:null,wait:2};
function dflGeo(){
  if(DFL.body) return;
  const ring=(x,y,z,c)=>{ c.set(0xffffff).multiplyScalar(Math.sin(z*150)>0.2?0.45:1); };   // the abdomen's dark rings (the tint is the material's colour)
  DFL.body=moMerge([moBone([0,0,0.02],[0,-0.004,-0.24],0.0075,0.0035,ring,5),moEll(0.02,0.021,0.034,0,0.004,0.035,0xf0f0f0,null,6),moEll(0.016,0.016,0.016,0,0.002,0.085,0xf8f8f8,null,6),
    moEll(0.012,0.014,0.012,0.013,0.008,0.09,0x1a1c20,null,5),moEll(0.012,0.014,0.012,-0.013,0.008,0.09,0x1a1c20,null,5)]);   // abdomen, thorax, head and two big eyes
  const wg=s=>moMerge([moEll(0.075,0.0018,0.016,s*0.08,0,0.017,0xe8f4f8,[0,s*0.12,0],6),moEll(0.07,0.0018,0.018,s*0.075,0,-0.017,0xe8f4f8,[0,-s*0.14,0],6)]);   // a forewing and a hindwing, rooted at the pivot
  DFL.wing=[wg(-1),wg(1)];
  DFL.wmat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.38,side:THREE.DoubleSide,depthWrite:false});
}
function dflSpot(){   // open water in sight (any depth over a hand: the pools and the reeds' edge count), not a bridge, not a dungeon's far-off slot
  for(let i=0;i<12;i++){
    const a=AR(0,TAU), r=AR(7,30), x=camera.position.x+Math.sin(a)*r, z=camera.position.z+Math.cos(a)*r, w=waterSurf(x,z);
    if(!dgInSlots(x)&&getH(x,z)<w-0.15&&bridgeDeck(x,z)<w) return [x,w,z];
  }
  return null;
}
function dflNear(f){   // a new place to hover: a few metres on, over water too (stays put when there is none)
  for(let i=0;i<8;i++){
    const a=AR(0,TAU), r=AR(1.5,6), x=f.x+Math.sin(a)*r, z=f.z+Math.cos(a)*r, w=waterSurf(x,z);
    if(getH(x,z)<w-0.1&&bridgeDeck(x,z)<w){ f.tx=x; f.tz=z; f.ty=w+AR(0.35,1.5); return true; }
  }
  return false;
}
function updateDragonflies(dt){
  if(!started||customizing||dgIn()) return;
  const land=waLandId(camera.position.x,camera.position.z), on=envCur.night<0.45&&WX.inten<0.25&&(land===0||land===1||land===3);
  if(!DFL.list.length){
    dflGeo();
    for(let i=0;i<DFL_N;i++){
      const g=new THREE.Group(), mat=new THREE.MeshLambertMaterial({vertexColors:true,color:DFL_COLS[i%DFL_COLS.length]}), wl=new THREE.Group(), wr=new THREE.Group();
      g.add(new THREE.Mesh(DFL.body,mat)); wl.add(new THREE.Mesh(DFL.wing[0],DFL.wmat)); wr.add(new THREE.Mesh(DFL.wing[1],DFL.wmat)); wl.position.set(0,0.016,0.035); wr.position.set(0,0.016,0.035);   // (the pivots sit on the thorax)
      g.add(wl,wr); g.visible=false; g.scale.setScalar(1.4); scene.add(g);
      DFL.list.push({g,wl,wr,live:false,x:0,y:0,z:0,tx:0,ty:0,tz:0,hov:0,ph:AR(0,TAU),yaw:0});
    }
  }
  DFL.wait-=dt;
  for(const f of DFL.list){
    if(!f.live){
      if(on&&DFL.wait<=0){ const s=dflSpot(); if(s){ f.live=true; f.x=f.tx=s[0]; f.z=f.tz=s[2]; f.y=f.ty=s[1]+AR(0.4,1.2); f.hov=AR(0.3,1.6); f.yaw=AR(0,TAU); f.g.visible=true; DFL.wait=AR(0.4,1.5); } }
      continue;
    }
    const dx=camera.position.x-f.x, dz=camera.position.z-f.z;
    if(!on||dx*dx+dz*dz>42*42){ f.live=false; f.g.visible=false; continue; }
    const ex=f.tx-f.x, ey=f.ty-f.y, ez=f.tz-f.z, d=Math.hypot(ex,ey,ez);
    if(d>0.25){   // darting: fast, then easing in
      const v=Math.min(d*4,5.5)*dt, k=v/d; f.x+=ex*k; f.y+=ey*k; f.z+=ez*k; f.yaw+=((Math.atan2(ex,ez)-f.yaw+Math.PI*3)%TAU-Math.PI)*Math.min(1,dt*10);
    } else {      // hovering: a small figure of eight, the head turning slowly
      f.hov-=dt; f.yaw+=Math.sin(t*0.7+f.ph)*dt*0.8;
      f.x+=Math.sin(t*2.1+f.ph)*dt*0.12; f.z+=Math.cos(t*1.7+f.ph)*dt*0.12; f.y+=Math.sin(t*3.3+f.ph)*dt*0.08;
      if(f.hov<=0){ f.hov=AR(0.5,2.6); if(!dflNear(f)) f.hov=1.5; }
    }
    const m=f.g; m.position.set(f.x,f.y,f.z); m.rotation.set(d>0.25?0.15:-0.2,f.yaw,0,'YXZ');
    const beat=Math.sin(t*75+f.ph)*0.55; f.wl.rotation.z=-beat; f.wr.rotation.z=beat;
  }
}
