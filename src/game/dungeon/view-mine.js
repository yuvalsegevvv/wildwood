//@ Dungeon view, the Blackseam's props: coal seam walls, pit props and buttresses, ore carts, keg stacks, mine lamps, coal heaps, rails and slag vents, added to DG_PROP_KINDS
/* Agent map: exports dgvCoalDeco, dgvPitProp, dgvPitPillar, dgvOreCart, dgvKegStack, dgvMineLamp, dgvCoalHeap, dgvRails, dgvSlagVent (builders in the shape of game/dungeon/view.js: A = {lit, glow, soft}
   accumulators, x z the middle, w d the footprint in metres, r a seeded random), and registers them in DG_PROP_KINDS (view.js, which must load first: this file comes right after it in the manifest).
   Who draws them: dgViewBuild (view.js) for each legend cell of the theme 'blackseam' (shared/dungeons/themes/blackseam.js names the kinds). Test: tools/dungeon-client-smoke.js (the run's client)
   builds a Blackseam and counts the kinds. Garrick's powder keg is a monster model (combat/monster-mine.js), not one of these; the kegstack here is dressing only. */
function dgvCoalDeco(A,fx,fz,dx,dz,r){   // a coal seam's face: a few black lumps and, now and then, a glint of blue in the coal
  if(r()>0.6) return;
  const s=(r()-0.5)*1.4, h=0.7+r()*3.4;
  dgvPut(A.lit,dgvRock(0.28+r()*0.14,0),fx-dx*0.12-dz*s,h,fz-dz*0.12+dx*s,{sy:0.7,ry:r()*TAU,col:0x15161b,va:0.3});
  if(r()<0.35) dgvPut(A.glow,dgvBox(0.12,0.1,0.12),fx-dx*0.2-dz*s,h+0.1,fz-dz*0.2+dx*s,{ry:r()*TAU,col:0x4a5c80,va:0.1});
}
function dgvPitProp(A,x,z,w,d,r){   // two timbers and a cap beam, braced
  const H=DG_WALL_H, a=r()<0.5?0:Math.PI/2, ca=Math.cos(a), sa=Math.sin(a), o=Math.min(w,d)*0.28;
  for(const s of [-1,1]) dgvPut(A.lit,dgvCyl(0.17,0.21,H,6),x+ca*o*s,H/2,z-sa*o*s,{col:0x5a4128,top:0x3a2a1a,h:H,foot:0.3,va:0.12});
  dgvPut(A.lit,dgvBox(o*2+0.9,0.34,0.42),x,H-0.3,z,{ry:a,col:0x4a3420,va:0.1});
  dgvPut(A.lit,dgvBox(0.12,o*1.5,0.12),x+ca*o*0.5,H-1.3,z-sa*o*0.5,{ry:a,rz:0.75,col:0x4e3822});
}
function dgvPitPillar(A,x,z,w,d){   // the hall's buttress: a stone core clad in timber, banded with iron
  const H=DG_WALL_H, bw=w*0.7, bd=d*0.7;
  dgvPut(A.lit,dgvBox(bw,H,bd),x,H/2,z,{col:0x4a4a52,top:0x34343c,h:H,foot:0.3});
  for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]) dgvPut(A.lit,dgvCyl(0.2,0.22,H,6),x+sx*bw*0.5,H/2,z+sz*bd*0.5,{col:0x5a4128,top:0x3a2a1a,h:H,va:0.12});
  for(const y of [1.4,3.4,5.4]) dgvPut(A.lit,dgvBox(bw*1.18,0.2,bd*1.18),x,y,z,{col:0x32323a,va:0.06});
}
function dgvOreCart(A,x,z,w,d,r){   // a mine cart of coal on four wheels
  const a=r()<0.5?0:Math.PI/2;
  dgvPut(A.lit,dgvBox(1.6,0.8,1.1),x,0.8,z,{ry:a,col:0x4e4036,top:0x3a3028,h:0.8,va:0.08});
  dgvPut(A.lit,dgvRock(0.62,0),x,1.25,z,{sy:0.5,sx:1.2,ry:a,col:0x18181d,va:0.25});
  for(const [sx,sz] of [[-0.55,-0.6],[0.55,-0.6],[-0.55,0.6],[0.55,0.6]]) dgvPut(A.lit,dgvCyl(0.24,0.24,0.1,8),x+Math.cos(a)*sx+Math.sin(a)*sz,0.26,z-Math.sin(a)*sx+Math.cos(a)*sz,{rx:Math.PI/2,ry:a,col:0x2a2a30,va:0.05});
}
function dgvKegStack(A,x,z,w,d,r){   // the foreman's powder: kegs banded with iron, two below and one on top
  const keg=(px,py,pz,tilt)=>{ dgvPut(A.lit,dgvCyl(0.34,0.34,0.8,9),px,py,pz,{rz:tilt,col:0x6a4a2c,va:0.1,foot:py<0.5?0.3:0});
    for(const k of [-0.22,0.22]) dgvPut(A.lit,dgvCyl(0.36,0.36,0.06,9),px,py+k,pz,{rz:tilt,col:0x34343c,va:0.04}); };
  const a=r()*TAU, c=Math.cos(a), s=Math.sin(a);
  keg(x+c*0.4,0.4,z-s*0.4,0); keg(x-c*0.4,0.4,z+s*0.4,0); keg(x,1.15,z,0);
  dgvPut(A.glow,dgvBox(0.04,0.04,0.3),x+0.3,1.62,z,{ry:a,col:0xffa040,va:0.05});   // a fuse end: a spark of orange
}
function dgvMineLamp(A,x,z){   // a post with an arm and a hanging lamp: the mine's own light
  dgvPut(A.lit,dgvBox(0.8,0.25,0.8),x,0.125,z,{col:0x4a4a52}); dgvPut(A.lit,dgvBox(0.2,2.3,0.2),x,1.4,z,{col:0x5a4128,top:0x4a3420,h:2.3});
  dgvPut(A.lit,dgvBox(0.8,0.14,0.14),x+0.4,2.5,z,{col:0x4a3420});
  dgvPut(A.lit,dgvBox(0.34,0.4,0.34),x+0.75,2.2,z,{col:0x3a3a42}); dgvPut(A.glow,dgvBox(0.26,0.28,0.26),x+0.75,2.2,z,{col:0xffb870,va:0.05});
}
function dgvCoalHeap(A,x,z,w,d,r){
  for(let i=0;i<4;i++) dgvPut(A.lit,dgvRock(0.28+r()*0.22,0),x+(r()-0.5)*1.2,0.18,z+(r()-0.5)*1.2,{sy:0.6,ry:r()*TAU,col:0x1a1a20,va:0.3});
  if(r()<0.5) dgvPut(A.glow,dgvBox(0.1,0.08,0.1),x+(r()-0.5)*0.8,0.34,z+(r()-0.5)*0.8,{col:0x4a5c80,va:0.1});
}
function dgvRails(A,x,z){   // two rails and their sleepers, along x (a run of cells is one long track)
  for(const s of [-0.4,0.4]) dgvPut(A.lit,dgvBox(2,0.07,0.08),x,0.09,z+s,{col:0x6a6a74,va:0.04});
  for(const k of [-0.75,-0.25,0.25,0.75]) dgvPut(A.lit,dgvBox(0.18,0.06,1.1),x+k,0.04,z,{col:0x4a3820,va:0.1});
}
function dgvSlagVent(A,x,z,w,d,r){   // a crack that breathes scalding slag steam (the hazard 'steam' fires its geyser warning here)
  dgvPut(A.lit,new THREE.TorusGeometry(0.5,0.14,5,10).rotateX(Math.PI/2),x,0.07,z,{col:0x3a2a22});
  dgvPut(A.glow,dgvDisc(0.4,10),x,0.05,z,{col:0xe85a1a,va:0.15});
  if(!LITE) dgvPut(A.soft,dgvBall(0.3+r()*0.1,6,4),x,0.7,z,{col:0xc8b0a0,va:0.05});
}
Object.assign(DG_PROP_KINDS,{
  coalseam:{wall:0x1e1f26,deco:dgvCoalDeco}, pitprop:{build:dgvPitProp}, pitpillar:{build:dgvPitPillar}, orecart:{build:dgvOreCart}, kegstack:{build:dgvKegStack},
  minelamp:{build:dgvMineLamp,li:0.95,lr:10,lh:2.2}, coalheap:{build:dgvCoalHeap}, rails:{build:dgvRails}, slagvent:{build:dgvSlagVent,li:0.2,lr:4,lc:0xe85a1a}});
DG_WOBBLE.blackseam=0.08;   // the seam's walls: rough, but cut (a mine, not a cave)
