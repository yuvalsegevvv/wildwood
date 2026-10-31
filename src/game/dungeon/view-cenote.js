//@ Dungeon view, the Cenote of Hollow Stars' props: wet mossy limestone walls with hanging roots, carved pillars, star basins, jade offerings, fallen stairs, skull racks, star lamps, mossy rubble, shallow water and geyser vents, added to DG_PROP_KINDS
/* Agent map: exports dgvCenoteDeco, dgvCarvedPillar, dgvStarBasin, dgvJadeOffering, dgvFallenStair, dgvSkullRack, dgvStarLamp, dgvMossRubble, dgvShallowWater, dgvGeyserVent (builders in the shape of game/dungeon/view.js: A = {lit, glow, soft}
   accumulators, x z the middle, w d the footprint in metres, r a seeded random), and registers them in DG_PROP_KINDS (view.js, which must load first: this file comes right after view-termite.js in the manifest).
   Who draws them: dgViewBuild (view.js) for each legend cell of the theme 'cenote' (shared/dungeons/themes/cenote.js names the kinds; its guardian post is view.js's own `guardpost`). Test: tools/dungeon-client-smoke.js. */
function dgvCenoteDeco(A,fx,fz,dx,dz,r){   // a wall's face: a ridge of wet stone, now and then a hanging root or a pale glint of water
  if(r()>0.55) return;
  const s=(r()-0.5)*1.4, h=0.5+r()*3.6;
  dgvPut(A.lit,dgvBox(0.14,0.3+r()*0.5,0.7+r()*0.9),fx-dx*0.12-dz*s,h,fz-dz*0.12+dx*s,{ry:Math.atan2(dx,dz),col:0x6a8a74,va:0.12});
  if(r()<0.2){ dgvPut(A.lit,dgvBall(0.3,6,4),fx-dx*0.05-dz*s,h+0.8,fz-dz*0.05+dx*s,{sz:0.35,col:0x16241e,va:0.05}); dgvPut(A.glow,dgvBall(0.1,5,4),fx-dx*0.2-dz*s,h+0.8,fz-dz*0.2+dx*s,{col:0x7fe8ff,va:0.05}); }
}
function dgvCarvedPillar(A,x,z,w,d){   // a carved pillar that swells at the foot and the crown, banded like a stela
  const R0=Math.min(w,d)*0.26, H=DG_WALL_H;
  dgvPut(A.lit,dgvCyl(R0,R0*1.35,H,7),x,H/2,z,{col:0x5a7a66,top:0x3e5648,h:H,foot:0.25});
  for(const k of [0,1,2,3,4]){ const a=k*TAU/5+0.3; dgvPut(A.lit,dgvCyl(R0*0.3,R0*0.36,H*0.85,4),x+Math.sin(a)*R0*0.95,H*0.45,z+Math.cos(a)*R0*0.95,{col:0x6a8a74}); }
  dgvPut(A.lit,dgvBall(R0*1.6,7,4),x,H-0.2,z,{sy:0.4,col:0x3e5648});
}
function dgvStarBasin(A,x,z,w,d,r){   // a still pool in a stone ring, a pale reflection of stars in it, a cold light
  const bw=w*0.62;
  dgvPut(A.lit,dgvBox(bw,0.9,bw),x,0.45,z,{col:0x4a6656,top:0x34493e,h:0.9,foot:0.3});
  dgvPut(A.glow,dgvBall(bw*0.5,8,6),x,1.9,z,{sy:1.5,col:0x5ad0f0,va:0.08});
  dgvPut(A.glow,dgvBall(bw*0.3,6,4),x+(r()-0.5)*0.4,3.1,z+(r()-0.5)*0.4,{sy:1.2,col:0xa8f0ff,va:0.08});
  dgvPut(A.lit,dgvBall(0.22,5,4),x+0.05,1.9,z,{sx:1.6,sy:0.6,col:0x14202a});   // a drowned offering at the bottom
}
function dgvJadeOffering(A,x,z,w,d,r){   // a heap of jade beads in a stone bowl
  dgvPut(A.lit,dgvCyl(0.8,0.95,0.3,8),x,0.15,z,{col:0x3e5648,top:0x2e4638,h:0.3,foot:0.3});
  for(let i=0;i<7;i++){ const a=i*TAU/7+r(), rr=i?0.45+r()*0.2:0; dgvPut(A.glow,dgvBall(0.26+r()*0.1,6,5),x+Math.sin(a)*rr,0.45+(i?0:0.25),z+Math.cos(a)*rr,{sy:1.25,col:0x5ac8a0,va:0.08}); }
}
function dgvFallenStair(A,x,z,w,d,r){   // a broken flight of stairs, three steps tilted out of the floor
  const a=r()<0.5?0:Math.PI/2;
  dgvPut(A.lit,dgvBox(1.8,0.5,0.5),x,0.25,z,{ry:a,col:0x5a7a66,top:0x3e5648,h:0.5,foot:0.3,va:0.1});
  dgvPut(A.lit,dgvBox(1.3,0.9,0.4),x,0.9,z,{ry:a,col:0x547060,va:0.1});
  dgvPut(A.lit,dgvBox(0.8,0.5,0.3),x,1.55,z,{ry:a,col:0x4a6a58,va:0.1});
}
function dgvSkullRack(A,x,z,w,d,r){   // pale skulls stacked on a rack against the wall
  dgvPut(A.lit,dgvBox(1.3,0.9,1.1),x-0.4,0.45,z,{ry:r()*TAU,col:0xd8d4c0,va:0.1});
  dgvPut(A.lit,dgvBox(1.0,0.7,0.9),x+0.5,0.35,z+0.2,{ry:r()*TAU,col:0xc8c4b0,va:0.1});
  for(let i=0;i<4;i++) dgvPut(A.lit,dgvBall(0.12,4,3),x+(r()-0.5)*1.4,0.3+r()*0.5,z+(r()-0.5)*0.9,{sx:1.5,sy:0.6,col:0x14202a});
}
function dgvStarLamp(A,x,z){   // a stone stem holding a bowl of pale blue fire
  dgvPut(A.lit,dgvCyl(0.12,0.3,1.4,6),x,0.7,z,{col:0x4a6656,top:0x34493e,h:1.4,foot:0.3});
  dgvPut(A.glow,dgvBall(0.3,7,5),x,1.65,z,{sy:1.2,col:0x7fe8ff,va:0.05});
}
function dgvMossRubble(A,x,z,w,d,r){   // mossy stones and a little rubble
  for(let i=0;i<3;i++) dgvPut(A.lit,dgvRock(0.2+r()*0.2,0),x+(r()-0.5)*1.3,0.08,z+(r()-0.5)*1.3,{sy:0.5,ry:r()*TAU,col:0x5a7a66,va:0.12});
  dgvPut(A.lit,dgvBall(0.14,4,3),x+(r()-0.5)*1.2,0.07,z+(r()-0.5)*1.2,{sx:1.8,sy:0.5,col:0x24362c});
}
function dgvShallowWater(A,x,z,w,d,r){   // a film of clear water on the floor
  dgvPut(A.glow,dgvBox(2,0.03,1.4),x,0.04,z,{col:0x2a7a8a,va:0.06,ry:r()<0.5?0:Math.PI/2});
  dgvPut(A.glow,dgvBox(1.2,0.035,0.7),x+(r()-0.5)*0.5,0.05,z+(r()-0.5)*0.5,{col:0x4ab0c0,va:0.06});
}
function dgvGeyserVent(A,x,z,w,d,r){   // a round vent in the floor, a ring of stone round it, the jet shown by pale streaks
  dgvPut(A.lit,dgvCyl(0.85,0.95,0.14,8),x,0.07,z,{col:0x4a6656,top:0x34493e,h:0.14,foot:0.3});
  dgvPut(A.lit,dgvCyl(0.55,0.55,0.16,8),x,0.09,z,{col:0x04101a});
  for(let i=0;i<4;i++) dgvPut(A.glow,dgvBox(0.05,0.5+r()*0.4,0.05),x+(r()-0.5)*0.8,0.5,z+(r()-0.5)*0.8,{col:0xcff6ff,va:0.05});
}
Object.assign(DG_PROP_KINDS,{
  cenotewall:{wall:0x5a7a66,deco:dgvCenoteDeco}, carvedpillar:{build:dgvCarvedPillar}, starbasin:{build:dgvStarBasin,li:0.9,lr:9,lh:2.4,lc:0x7fe8ff}, jadeoffering:{build:dgvJadeOffering}, fallenstair:{build:dgvFallenStair}, skullrack:{build:dgvSkullRack,li:0.35,lr:5,lh:1,lc:0xffa840},
  starlamp:{build:dgvStarLamp,li:0.9,lr:10,lh:1.8,lc:0x7fe8ff}, mossrubble:{build:dgvMossRubble}, shallowwater:{build:dgvShallowWater}, geyservent:{build:dgvGeyserVent,li:0.12,lr:4,lc:0xcff6ff}});
DG_WOBBLE.cenote=0.12;   // the cenote's walls: wet limestone, worn and uneven
DG_AMB.cenote=0.5;      // a sunk temple lit by pale blue fire: a little dimmer than the spire
