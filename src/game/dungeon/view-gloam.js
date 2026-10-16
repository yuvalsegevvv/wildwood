//@ Dungeon view, the Gloamvault's props: damp black limestone walls with salt streaks and the odd niche, slender columns, the nave's saint statues, sarcophagi, pews, wreckers' crates and kegs, candelabra, rubble and bones, seawater on the flags and brine grates, added to DG_PROP_KINDS
/* Agent map: exports dgvGloamDeco, dgvGothColumn, dgvSaintStatue, dgvSarcophagus, dgvPew, dgvWreckCrates, dgvCandelabra, dgvRubbleBones, dgvBrinePool, dgvBrineGrate (builders in the shape of game/dungeon/view.js: A = {lit, glow, soft}
   accumulators, x z the middle, w d the footprint in metres, r a seeded random), and registers them in DG_PROP_KINDS (view.js, which must load first: this file comes right after view-sand.js in the manifest).
   Who draws them: dgViewBuild (view.js) for each legend cell of the theme 'gloamvault' (shared/dungeons/themes/gloamvault.js names the kinds; its guardian post is view.js's own `guardpost`). Test: tools/dungeon-client-smoke.js. */
function dgvGloamDeco(A,fx,fz,dx,dz,r){   // a wall's face: a pale streak of salt, now and then a shallow niche with a small violet flame
  if(r()>0.5) return;
  const s=(r()-0.5)*1.4, h=0.6+r()*3.4;
  dgvPut(A.lit,dgvBox(0.1,0.5+r()*1.2,0.3+r()*0.3),fx-dx*0.1-dz*s,h,fz-dz*0.1+dx*s,{ry:Math.atan2(dx,dz),col:0x7a7a86,va:0.1});
  if(r()<0.22) dgvPut(A.glow,dgvBall(0.12,5,4),fx-dx*0.2-dz*s,h+0.5,fz-dz*0.2+dx*s,{col:0xb8a0f0,va:0.05});
}
function dgvGothColumn(A,x,z,w,d){   // a slender column of clustered shafts, a pointed capital
  const R0=Math.min(w,d)*0.24, H=DG_WALL_H;
  dgvPut(A.lit,dgvCyl(R0,R0*1.15,H,6),x,H/2,z,{col:0x5a5868,top:0x46444e,h:H,foot:0.25});
  for(const k of [0,1,2,3]){ const a=k*TAU/4+0.4; dgvPut(A.lit,dgvCyl(R0*0.35,R0*0.4,H*0.9,5),x+Math.sin(a)*R0*1.1,H*0.46,z+Math.cos(a)*R0*1.1,{col:0x626070}); }
  dgvPut(A.lit,dgvBox(R0*2.8,0.35,R0*2.8),x,0.18,z,{col:0x3e3c48}); dgvPut(A.lit,new THREE.ConeGeometry(R0*1.6,0.7,6),x,H-0.3,z,{ry:0.5,col:0x3e3c48});
}
function dgvSaintStatue(A,x,z,w,d){   // a saint on a plinth, hooded, hands folded, the face worn away
  const H=DG_WALL_H, bw=w*0.6, bd=d*0.6;
  dgvPut(A.lit,dgvBox(bw,1.4,bd),x,0.7,z,{col:0x4a4858,top:0x3a3844,h:1.4,foot:0.3});
  dgvPut(A.lit,dgvCyl(bw*0.26,bw*0.34,2.6,7),x,2.7,z,{col:0x6a6a76,va:0.06});
  dgvPut(A.lit,dgvBall(bw*0.2,7,5),x,4.2,z,{sy:1.15,col:0x72727e,va:0.05});
  dgvPut(A.lit,dgvCyl(0.1,0.1,H-4.6,5),x,4.6+(H-4.6)/2,z,{col:0x34323c});   // the stub of a lamp chain over it
  dgvPut(A.glow,dgvBox(bw*0.5,0.1,0.1),x,3.6,z+bd*0.2,{col:0x9a88d8,va:0.05});   // a hint of light at its folded hands
}
function dgvSarcophagus(A,x,z,w,d,r){   // a stone coffin with a carved lid, one corner of the lid slipped
  const a=r()<0.5?0:Math.PI/2;
  dgvPut(A.lit,dgvBox(2.1,0.8,1.0),x,0.4,z,{ry:a,col:0x5a5868,top:0x46444e,h:0.8,foot:0.3,va:0.08});
  dgvPut(A.lit,dgvBox(2.2,0.28,1.1),x+(r()-0.5)*0.2,0.94,z,{ry:a+(r()-0.5)*0.2,col:0x6a6876,va:0.08});
  dgvPut(A.lit,dgvBox(0.5,0.1,0.14),x,1.13,z,{ry:a,col:0x4a4858});
}
function dgvPew(A,x,z,w,d,r){   // a rotted oak pew: a seat, a back and two ends (local x runs along the pew)
  const a=r()<0.5?0:Math.PI/2, c=Math.cos(a), s=Math.sin(a);
  dgvPut(A.lit,dgvBox(1.9,0.14,0.55),x,0.5,z,{ry:a,col:0x3a2c22,top:0x2a2018,h:0.5,foot:0.3,va:0.1});
  dgvPut(A.lit,dgvBox(1.9,0.7,0.1),x-s*0.25,0.95,z-c*0.25,{ry:a,col:0x30241c,va:0.1});
  for(const k of [-0.8,0.8]) dgvPut(A.lit,dgvBox(0.1,0.5,0.5),x+c*k,0.25,z-s*k,{ry:a,col:0x2a2018});
}
function dgvWreckCrates(A,x,z,w,d,r){   // salvage: two crates, a keg on top, a coil of rope
  const a=r()*TAU;
  dgvPut(A.lit,dgvBox(1.1,0.9,1.1),x-0.45,0.45,z,{ry:a,col:0x5a4630,top:0x46341f,h:0.9,foot:0.3,va:0.1});
  dgvPut(A.lit,dgvBox(0.9,0.8,1.0),x+0.55,0.4,z+0.2,{ry:a+0.4,col:0x4e3c28,top:0x3e2e1c,h:0.8,foot:0.3,va:0.1});
  dgvPut(A.lit,dgvCyl(0.34,0.34,0.7,8),x-0.4,1.25,z,{col:0x6a4a2a,va:0.08});
  dgvPut(A.lit,new THREE.TorusGeometry(0.3,0.08,5,9),x+0.5,0.9,z+0.2,{rx:Math.PI/2,col:0x8a7a58});
}
function dgvCandelabra(A,x,z){   // a tall iron stand with three arms, three cold violet flames
  dgvPut(A.lit,dgvCyl(0.06,0.14,1.9,6),x,0.95,z,{col:0x2c2c34,top:0x24242a,h:1.9,foot:0.3});
  dgvPut(A.lit,dgvBox(1.1,0.07,0.07),x,1.95,z,{col:0x34343c});
  for(const k of [-0.5,0,0.5]){ dgvPut(A.lit,dgvCyl(0.05,0.05,0.28,5),x+k,2.15,z,{col:0xcfc8b8}); dgvPut(A.glow,dgvBall(0.11,5,4),x+k,2.38,z,{col:0xc8b0ff,va:0.06}); }
}
function dgvRubbleBones(A,x,z,w,d,r){   // fallen stone and a scatter of bones
  for(let i=0;i<3;i++) dgvPut(A.lit,dgvRock(0.25+r()*0.25,0),x+(r()-0.5)*1.3,0.1,z+(r()-0.5)*1.3,{sy:0.55,ry:r()*TAU,col:0x5a5864,va:0.12});
  for(let i=0;i<3;i++) dgvPut(A.lit,dgvCyl(0.03,0.03,0.4+r()*0.3,4),x+(r()-0.5)*1.4,0.05,z+(r()-0.5)*1.4,{rz:Math.PI/2,ry:r()*TAU,col:0xcfc8b4});
}
function dgvBrinePool(A,x,z,w,d,r){   // a film of seawater on the flags, a pale sheen
  dgvPut(A.glow,dgvBox(2,0.03,1.4),x,0.04,z,{col:0x1c3e4a,va:0.06,ry:r()<0.5?0:Math.PI/2});
  dgvPut(A.glow,dgvBox(1.2,0.035,0.7),x+(r()-0.5)*0.5,0.05,z+(r()-0.5)*0.5,{col:0x2c5a68,va:0.06});
}
function dgvBrineGrate(A,x,z,w,d,r){   // an iron grate over a vent, a green crust of salt and weed round it
  dgvPut(A.lit,dgvBox(1.7,0.07,1.7),x,0.04,z,{col:0x2c2c32,va:0.05});
  for(let i=-2;i<=2;i++) dgvPut(A.lit,dgvBox(0.07,0.1,1.7),x+i*0.34,0.1,z,{col:0x3a3a42});
  for(let i=0;i<4;i++) dgvPut(A.glow,new THREE.ConeGeometry(0.07,0.3+r()*0.3,4),x+(r()-0.5)*1.8,0.2,z+(r()-0.5)*1.8,{rx:(r()-0.5)*0.4,col:0x3a7a62,va:0.1});
}
Object.assign(DG_PROP_KINDS,{
  cryptwall:{wall:0x5a5868,deco:dgvGloamDeco}, gothcolumn:{build:dgvGothColumn}, saintstatue:{build:dgvSaintStatue}, sarcophagus:{build:dgvSarcophagus}, pew:{build:dgvPew}, wreckcrates:{build:dgvWreckCrates},
  candelabra:{build:dgvCandelabra,li:0.9,lr:10,lh:2.3,lc:0xb8a0f0}, rubblebones:{build:dgvRubbleBones}, brinepool:{build:dgvBrinePool}, brinegrate:{build:dgvBrineGrate,li:0.12,lr:4,lc:0x5ab89a}});
DG_WOBBLE.gloamvault=0.05;   // the vault's walls: dressed stone, damp and a little shifted
DG_AMB.gloamvault=0.5;       // a drowned chapel in the dark: only the candelabra
