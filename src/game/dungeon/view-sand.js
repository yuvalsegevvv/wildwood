//@ Dungeon view, the Sandglass's props: banded sandstone walls with glints of black glass, columns, the hall's sun pillars, broken kilns, amphora stacks, braziers, sand drifts, glass inlays and glass spikes, added to DG_PROP_KINDS
/* Agent map: exports dgvSandDeco, dgvSunColumn, dgvSunPillar, dgvKiln, dgvAmphorae, dgvSunBrazier, dgvSandDrift, dgvGlassInlay, dgvGlassSpike (builders in the shape of game/dungeon/view.js: A = {lit, glow, soft}
   accumulators, x z the middle, w d the footprint in metres, r a seeded random), and registers them in DG_PROP_KINDS (view.js, which must load first: this file comes right after view-mine.js in the manifest).
   Who draws them: dgViewBuild (view.js) for each legend cell of the theme 'sandglass' (shared/dungeons/themes/sandglass.js names the kinds; its guardian post is view.js's own `guardpost`). Test: tools/dungeon-client-smoke.js. */
function dgvSandDeco(A,fx,fz,dx,dz,r){   // a wall's face: a band of darker stone and, now and then, a glint of black glass
  if(r()>0.55) return;
  const s=(r()-0.5)*1.4, h=0.8+r()*3.2;
  dgvPut(A.lit,dgvBox(0.1,0.3+r()*0.2,1.0+r()*0.8),fx-dx*0.1-dz*s,h,fz-dz*0.1+dx*s,{ry:Math.atan2(dx,dz),col:0x6a4e30,va:0.1});
  if(r()<0.3) dgvPut(A.glow,dgvBox(0.1,0.12,0.12),fx-dx*0.18-dz*s,h+0.2,fz-dz*0.18+dx*s,{ry:r()*TAU,col:0x7a5ab8,va:0.1});
}
function dgvSunColumn(A,x,z,w,d){   // a fluted sandstone column on a square foot, a capital on top
  const R0=Math.min(w,d)*0.3, H=DG_WALL_H;
  dgvPut(A.lit,dgvCyl(R0,R0*1.05,H,8),x,H/2,z,{col:0xb8905a,top:0x9a7648,h:H,foot:0.25});
  dgvPut(A.lit,dgvBox(R0*2.6,0.4,R0*2.6),x,0.2,z,{col:0x8a6a44}); dgvPut(A.lit,dgvBox(R0*2.5,0.4,R0*2.5),x,H-0.2,z,{col:0x8a6a44});
}
function dgvSunPillar(A,x,z,w,d){   // the hall's pillar: a thick shaft inlaid with a band of gold
  const H=DG_WALL_H, bw=w*0.72, bd=d*0.72;
  dgvPut(A.lit,dgvBox(bw,H,bd),x,H/2,z,{col:0xa88050,top:0x7a5c38,h:H,foot:0.3});
  for(const y of [1.2,3.2,5.2]) dgvPut(A.lit,dgvBox(bw*1.12,0.22,bd*1.12),x,y,z,{col:0x6a4e30,va:0.06});
  dgvPut(A.glow,dgvBox(bw*1.02,0.14,bd*1.02),x,4.2,z,{col:0xd8a830,va:0.05});
}
function dgvKiln(A,x,z,w,d,r){   // a glassmaker's kiln, its dome cracked open, black slag at its foot
  dgvPut(A.lit,dgvCyl(0.8,0.95,1.2,9),x,0.6,z,{col:0x8a5a3a,top:0x6a4a34,h:1.2,foot:0.3,va:0.1});
  dgvPut(A.lit,dgvRock(0.7,0),x,1.35,z,{sy:0.6,ry:r()*TAU,col:0x7a4e32,va:0.15});
  dgvPut(A.glow,dgvBox(0.5,0.3,0.1),x+0.2,0.5,z+0.86,{col:0xff9a40,va:0.05});
  dgvPut(A.lit,dgvRock(0.3,0),x-0.9,0.15,z+0.6,{sy:0.5,ry:r()*TAU,col:0x1a1822,va:0.2});
}
function dgvAmphorae(A,x,z,w,d,r){   // three clay jars, two below and one on top
  const jar=(px,py,pz)=>{ dgvPut(A.lit,dgvCyl(0.3,0.2,0.9,8),px,py,pz,{col:0xb06a3a,va:0.1,foot:py<0.5?0.3:0}); dgvPut(A.lit,dgvCyl(0.12,0.16,0.3,8),px,py+0.58,pz,{col:0x9a5a30}); };
  const a=r()*TAU, c=Math.cos(a), s=Math.sin(a);
  jar(x+c*0.4,0.45,z-s*0.4); jar(x-c*0.4,0.45,z+s*0.4); jar(x,1.2,z);
}
function dgvSunBrazier(A,x,z){   // a bronze bowl on a tall stand, burning: the temple's own light
  dgvPut(A.lit,dgvCyl(0.1,0.18,1.6,6),x,0.8,z,{col:0x6a4a28,top:0x5a3e20,h:1.6}); dgvPut(A.lit,dgvCyl(0.5,0.28,0.32,8),x,1.75,z,{col:0xa07030,va:0.06});
  dgvPut(A.glow,dgvBall(0.34,6,4),x,2.05,z,{col:0xffc860,va:0.08});
}
function dgvSandDrift(A,x,z,w,d,r){   // wind-blown sand piled on the flags
  for(let i=0;i<3;i++) dgvPut(A.lit,dgvRock(0.4+r()*0.3,0),x+(r()-0.5)*1.2,0.05,z+(r()-0.5)*1.2,{sy:0.3,ry:r()*TAU,col:0xd8b878,va:0.1});
}
function dgvGlassInlay(A,x,z){   // a line of black glass let into the flags, along x
  dgvPut(A.glow,dgvBox(2,0.03,0.16),x,0.05,z,{col:0x4a3a78,va:0.08});
  for(const k of [-0.7,0.7]) dgvPut(A.lit,dgvBox(0.12,0.05,0.5),x+k,0.04,z,{col:0xb8905a,va:0.08});
}
function dgvGlassSpike(A,x,z,w,d,r){   // a patch of black glass shards that thrust up when the hazard goes off
  for(let i=0;i<5;i++) dgvPut(A.glow,new THREE.ConeGeometry(0.08,0.35+r()*0.35,4),x+(r()-0.5)*1.4,0.22,z+(r()-0.5)*1.4,{rx:(r()-0.5)*0.5,rz:(r()-0.5)*0.5,col:0x5a3a98,va:0.1});
}
Object.assign(DG_PROP_KINDS,{
  sandwall:{wall:0xa07c4c,deco:dgvSandDeco}, suncolumn:{build:dgvSunColumn}, sunpillar:{build:dgvSunPillar}, brokenkiln:{build:dgvKiln}, amphorae:{build:dgvAmphorae},
  sunbrazier:{build:dgvSunBrazier,li:1.0,lr:10,lh:2.1}, sanddrift:{build:dgvSandDrift}, glassinlay:{build:dgvGlassInlay}, glassspike:{build:dgvGlassSpike,li:0.15,lr:4,lc:0x7a5ab8}});
DG_WOBBLE.sandglass=0.06;   // the temple's walls: dressed stone, a little worn
