//@ Dungeon view, the Termite Cathedral's props: ribbed red-brown clay walls with chewed gallery mouths, clay pillars, amber resin masses with an insect trapped in them, egg clusters, clay ribs, banked amber, resin lamps, crumbled clay, resin on the floor and ventilation shafts, added to DG_PROP_KINDS
/* Agent map: exports dgvTermiteDeco, dgvClayPillar, dgvResinMass, dgvEggCluster, dgvClayRib, dgvAmberBank, dgvResinLamp, dgvClayCrumb, dgvResinPool, dgvVentShaft (builders in the shape of game/dungeon/view.js: A = {lit, glow, soft}
   accumulators, x z the middle, w d the footprint in metres, r a seeded random), and registers them in DG_PROP_KINDS (view.js, which must load first: this file comes right after view-gloam.js in the manifest).
   Who draws them: dgViewBuild (view.js) for each legend cell of the theme 'termitecathedral' (shared/dungeons/themes/termitecathedral.js names the kinds; its guardian post is view.js's own `guardpost`). Test: tools/dungeon-client-smoke.js. */
function dgvTermiteDeco(A,fx,fz,dx,dz,r){   // a wall's face: a ridge of clay, now and then the mouth of a chewed gallery with an amber glint inside
  if(r()>0.55) return;
  const s=(r()-0.5)*1.4, h=0.5+r()*3.6;
  dgvPut(A.lit,dgvBox(0.14,0.3+r()*0.5,0.7+r()*0.9),fx-dx*0.12-dz*s,h,fz-dz*0.12+dx*s,{ry:Math.atan2(dx,dz),col:0x9a6a44,va:0.12});
  if(r()<0.2){ dgvPut(A.lit,dgvBall(0.3,6,4),fx-dx*0.05-dz*s,h+0.8,fz-dz*0.05+dx*s,{sz:0.35,col:0x2a1a10,va:0.05}); dgvPut(A.glow,dgvBall(0.1,5,4),fx-dx*0.2-dz*s,h+0.8,fz-dz*0.2+dx*s,{col:0xffb85a,va:0.05}); }
}
function dgvClayPillar(A,x,z,w,d){   // a fluted clay pillar that swells at the foot and the crown, like a termite's chimney
  const R0=Math.min(w,d)*0.26, H=DG_WALL_H;
  dgvPut(A.lit,dgvCyl(R0,R0*1.35,H,7),x,H/2,z,{col:0x8a5a3a,top:0x6a4026,h:H,foot:0.25});
  for(const k of [0,1,2,3,4]){ const a=k*TAU/5+0.3; dgvPut(A.lit,dgvCyl(R0*0.3,R0*0.36,H*0.85,4),x+Math.sin(a)*R0*0.95,H*0.45,z+Math.cos(a)*R0*0.95,{col:0x9a6a44}); }
  dgvPut(A.lit,dgvBall(R0*1.6,7,4),x,H-0.2,z,{sy:0.4,col:0x6a4026});
}
function dgvResinMass(A,x,z,w,d,r){   // a lump of amber resin on a clay base, a beetle caught in it, a warm light
  const bw=w*0.62;
  dgvPut(A.lit,dgvBox(bw,0.9,bw),x,0.45,z,{col:0x7a4e30,top:0x5a3820,h:0.9,foot:0.3});
  dgvPut(A.glow,dgvBall(bw*0.5,8,6),x,1.9,z,{sy:1.5,col:0xe0963a,va:0.08});
  dgvPut(A.glow,dgvBall(bw*0.3,6,4),x+(r()-0.5)*0.4,3.1,z+(r()-0.5)*0.4,{sy:1.2,col:0xf0b050,va:0.08});
  dgvPut(A.lit,dgvBall(0.22,5,4),x+0.05,1.9,z,{sx:1.6,sy:0.6,col:0x2a1a0e});   // the insect
}
function dgvEggCluster(A,x,z,w,d,r){   // a heap of pale, soft eggs in a clay cup
  dgvPut(A.lit,dgvCyl(0.8,0.95,0.3,8),x,0.15,z,{col:0x6a4026,top:0x4e2e1a,h:0.3,foot:0.3});
  for(let i=0;i<7;i++){ const a=i*TAU/7+r(), rr=i?0.45+r()*0.2:0; dgvPut(A.glow,dgvBall(0.26+r()*0.1,6,5),x+Math.sin(a)*rr,0.45+(i?0:0.25),z+Math.cos(a)*rr,{sy:1.25,col:0xe8c888,va:0.08}); }
}
function dgvClayRib(A,x,z,w,d,r){   // a buttress of clay, a ridge that rises out of the floor and bends over
  const a=r()<0.5?0:Math.PI/2;
  dgvPut(A.lit,dgvBox(1.8,0.5,0.5),x,0.25,z,{ry:a,col:0x8a5a3a,top:0x6a4026,h:0.5,foot:0.3,va:0.1});
  dgvPut(A.lit,dgvBox(1.3,0.9,0.4),x,0.9,z,{ry:a,col:0x7e5036,va:0.1});
  dgvPut(A.lit,dgvBox(0.8,0.5,0.3),x,1.55,z,{ry:a,col:0x724630,va:0.1});
}
function dgvAmberBank(A,x,z,w,d,r){   // amber banked against the wall, insects dark inside it
  dgvPut(A.glow,dgvBox(1.3,0.9,1.1),x-0.4,0.45,z,{ry:r()*TAU,col:0xd08830,va:0.1});
  dgvPut(A.glow,dgvBox(1.0,0.7,0.9),x+0.5,0.35,z+0.2,{ry:r()*TAU,col:0xe0a040,va:0.1});
  for(let i=0;i<4;i++) dgvPut(A.lit,dgvBall(0.12,4,3),x+(r()-0.5)*1.4,0.3+r()*0.5,z+(r()-0.5)*0.9,{sx:1.5,sy:0.6,col:0x2a1a0e});
}
function dgvResinLamp(A,x,z){   // a nub of clay holding a bead of resin that glows from inside
  dgvPut(A.lit,dgvCyl(0.12,0.3,1.4,6),x,0.7,z,{col:0x7a4e30,top:0x5a3820,h:1.4,foot:0.3});
  dgvPut(A.glow,dgvBall(0.3,7,5),x,1.65,z,{sy:1.2,col:0xffb85a,va:0.05});
}
function dgvClayCrumb(A,x,z,w,d,r){   // crumbs of clay and a husk or two
  for(let i=0;i<3;i++) dgvPut(A.lit,dgvRock(0.2+r()*0.2,0),x+(r()-0.5)*1.3,0.08,z+(r()-0.5)*1.3,{sy:0.5,ry:r()*TAU,col:0x8a5a3a,va:0.12});
  dgvPut(A.lit,dgvBall(0.14,4,3),x+(r()-0.5)*1.2,0.07,z+(r()-0.5)*1.2,{sx:1.8,sy:0.5,col:0x3a2616});
}
function dgvResinPool(A,x,z,w,d,r){   // a film of golden resin on the floor
  dgvPut(A.glow,dgvBox(2,0.03,1.4),x,0.04,z,{col:0x8a5a1c,va:0.06,ry:r()<0.5?0:Math.PI/2});
  dgvPut(A.glow,dgvBox(1.2,0.035,0.7),x+(r()-0.5)*0.5,0.05,z+(r()-0.5)*0.5,{col:0xb8802c,va:0.06});
}
function dgvVentShaft(A,x,z,w,d,r){   // a round shaft in the floor, a ring of clay round it, the draught shown by pale streaks
  dgvPut(A.lit,dgvCyl(0.85,0.95,0.14,8),x,0.07,z,{col:0x7a4e30,top:0x5a3820,h:0.14,foot:0.3});
  dgvPut(A.lit,dgvCyl(0.55,0.55,0.16,8),x,0.09,z,{col:0x14090a});
  for(let i=0;i<4;i++) dgvPut(A.glow,dgvBox(0.05,0.5+r()*0.4,0.05),x+(r()-0.5)*0.8,0.5,z+(r()-0.5)*0.8,{col:0xcfe6f0,va:0.05});
}
Object.assign(DG_PROP_KINDS,{
  claywall:{wall:0x8a5a3a,deco:dgvTermiteDeco}, claypillar:{build:dgvClayPillar}, resinmass:{build:dgvResinMass,li:0.9,lr:9,lh:2.4,lc:0xffb85a}, eggcluster:{build:dgvEggCluster}, clayrib:{build:dgvClayRib}, amberbank:{build:dgvAmberBank,li:0.35,lr:5,lh:1,lc:0xffa840},
  resinlamp:{build:dgvResinLamp,li:0.9,lr:10,lh:1.8,lc:0xffb85a}, claycrumb:{build:dgvClayCrumb}, resinpool:{build:dgvResinPool}, ventshaft:{build:dgvVentShaft,li:0.12,lr:4,lc:0xcfe6f0}});
DG_WOBBLE.termitecathedral=0.14;   // the spire's walls: baked clay, lumpy and uneven
DG_AMB.termitecathedral=0.55;      // a hollow spire lit by amber: a little more than the crypt, still dim
