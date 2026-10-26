//@ The totems' own bodies (pal.style): the Heartwood carved wood, the Warm Core's frosted furnace, the Iron Joint, the Black Mirror, the Soul Lantern, and the raids' Warding Stone, War Banner and Barricade
/* Agent map. MODELS.totem (monster-woods.js) calls moTotemBody(style,p,gl,band) and merges what it returns; each builder gives a list of geometries around the y axis
   (the model turns slowly, so nothing has a front), about 3 m tall with the crystal floating above. Defs: TOTEM_DEF, CORE_DEF, JOINT_DEF, MIRROR_DEF, LANTERN_DEF
   (shared/monster-defs.js; `pal.style`, `pal.crystal`, `pal.band`); the raids' RD_WARD_DEF / RD_SPAWNER_DEF / RD_BARRICADE_DEF use the styles ward, banner, barricade. Look at them: node tools/monster-preview.js out.png --ids totem,warmcore,ironjoint,blackmirror,soullantern,rdward,rdspawner,rdbarricade */
const moTotemIron=(x,y,z,c)=>{ c.set(0x50545c).multiplyScalar(0.7+0.5*moNoise(x,y,z,10)+0.1*clamp(y*0.4)); };
const moTotemRing=(a,n,r,y)=>{ const pts=[]; for(let i=0;i<=n;i++){ const t=i/n*TAU; pts.push([Math.cos(t)*r*a[0],y+Math.sin(t)*r*a[1],0]); } return pts; };
function moTotemCrystal(gl,band,y){
  const out=[pc(new THREE.OctahedronGeometry(0.3,0).scale(1,1.5,1).translate(0,y,0),c=>c.set(gl))];
  for(let i=0;i<4;i++){ const a=i/4*TAU; out.push(pc(new THREE.OctahedronGeometry(0.09,0).scale(1,1.6,1).translate(Math.cos(a)*0.55,y-0.15+0.15*Math.sin(i*2),Math.sin(a)*0.55),c=>c.set(band))); }
  return out;
}
function moTotemHeart(gl,band){   // carved heartwood: a gnarled trunk with glowing rune rings, a spiral of vine and leaves, antler boughs, roots splayed round the foot
  const wood=(x,y,z,c)=>{ c.set(0x5a4430).multiplyScalar(0.62+0.75*vn3(x*14,y*1.6,z*14)); }, out=[];
  const rings=[{y:0.05,rx:0.78,rz:0.78},{y:0.3,rx:0.5,rz:0.5},{y:0.9,rx:0.38,rz:0.4},{y:1.5,rx:0.34,rz:0.33},{y:2.0,rx:0.42,rz:0.4},{y:2.3,rx:0.36,rz:0.36},{y:2.4,rx:0.2,rz:0.2}];
  out.push(moLoft(rings,moQ(10),(x,y,z,c)=>{ wood(x,y,z,c); const f=((y*2.4)%1+1)%1; if((y>0.8&&y<1.9)&&f<0.07) c.set(band); }));
  for(let i=0;i<7;i++){ const a=i/7*TAU+0.3; out.push(moTube([[Math.cos(a)*0.4,0.4,Math.sin(a)*0.4],[Math.cos(a)*0.72,0.18,Math.sin(a)*0.72],[Math.cos(a+0.25)*1.0,0.02,Math.sin(a+0.25)*1.0]],0.1,0.025,wood,5,true)); }
  const vine=[]; for(let i=0;i<=10;i++){ const t=i/10, a=t*TAU*1.6, r=lerp(0.46,0.37,t); vine.push([Math.cos(a)*r,0.45+t*1.6,Math.sin(a)*r]); }
  out.push(moTube(vine,0.035,0.025,0x3c6a2c,5,true));
  for(let i=0;i<9;i++){ const p=vine[i+1], a=i*1.7; out.push(moEll(0.09,0.03,0.05,p[0]*1.08,p[1],p[2]*1.08,(x,y,z,c)=>{ c.set(0x4f8a3a).multiplyScalar(0.8+0.4*moNoise(x,y,z,20)); },[0.3,a,0.4],5)); }
  for(let i=0;i<4;i++){ const a=i/4*TAU+0.6, d=[Math.cos(a),Math.sin(a)]; out.push(moTube([[d[0]*0.25,2.2,d[1]*0.25],[d[0]*0.55,2.45,d[1]*0.55],[d[0]*0.7,2.8,d[1]*0.7]],0.07,0.015,wood,5,true),moTube([[d[0]*0.55,2.45,d[1]*0.55],[d[0]*0.9,2.6,d[1]*0.9]],0.04,0.012,wood,4,true));
    out.push(moEll(0.13,0.05,0.1,d[0]*0.9,2.62,d[1]*0.9,0x4f7a3a,[0,a,0.2],5)); }
  for(let i=0;i<3;i++){ const a=i/3*TAU+1.2; out.push(moEll(0.15,0.17,0.06,Math.cos(a)*0.34,1.55,Math.sin(a)*0.34,wood,[0,-a+Math.PI/2,0],7),moEll(0.07,0.04,0.03,Math.cos(a)*0.37,1.62,Math.sin(a)*0.37,gl,[0,-a+Math.PI/2,0],5),moEll(0.07,0.04,0.03,Math.cos(a)*0.37,1.56,Math.sin(a)*0.37,gl,[0,-a+Math.PI/2,0.0],5)); }   // three carved faces
  out.push(...moTotemCrystal(gl,band,3.0));
  return out;
}
function moTotemCore(gl,band){   // a frosted stone chimney with a furnace burning in it, icicles hanging from its rim and fire above
  const frost=(x,y,z,c)=>{ moStone(x,y,z,c); const f=moNoise(x,y,z,6); if(f>0.58-0.25*clamp(1.4-y*0.6)) c.lerp(_tint.set(0xdff0f8),0.7); }, out=[];
  out.push(pc(vbox(1.1,0.3,1.1,0,0.15,0),frost),moLoft([{y:0.3,rx:0.5,rz:0.5},{y:0.9,rx:0.4,rz:0.4},{y:1.5,rx:0.36,rz:0.36},{y:2.1,rx:0.46,rz:0.46},{y:2.35,rx:0.42,rz:0.42}],moQ(10),frost));
  for(let i=0;i<3;i++){ const a=i/3*TAU+0.4, x=Math.cos(a)*0.37, z=Math.sin(a)*0.37; out.push(moEll(0.2,0.26,0.06,x,1.15,z,0x2a1008,[0,-a+Math.PI/2,0],8),moEll(0.14,0.2,0.05,x*1.03,1.12,z*1.03,(xx,yy,zz,c)=>{ c.set(gl).multiplyScalar(0.8+0.5*clamp((1.35-yy)*2.5)); },[0,-a+Math.PI/2,0],8)); }   // furnace doors
  for(let i=0;i<14;i++){ const a=i/14*TAU+0.2*h3(i,1,1), L=0.18+0.28*h3(i,2,3); out.push(moCone([Math.cos(a)*0.44,2.15+0.02*h3(i,3,3),Math.sin(a)*0.44],[0,-1,0],L,0.035,(x,y,z,c)=>{ c.set(0xcfe8f6).multiplyScalar(0.8+0.3*clamp((y-1.7)*2)); },5)); }   // icicles
  for(let i=0;i<5;i++){ const a=i/5*TAU, L=0.4+0.25*h3(i,5,2); out.push(moCone([Math.cos(a)*0.2,2.3,Math.sin(a)*0.2],[Math.cos(a)*0.2,1,Math.sin(a)*0.2],L,0.1,(x,y,z,c)=>{ c.set(gl).lerp(_tint.set(0xfff0b0),clamp((y-2.3)*2.2)); },5)); }   // flames
  for(let i=0;i<6;i++){ const a=i/6*TAU+0.5; out.push(moEll(0.2,0.09,0.2,Math.cos(a)*0.7,0.1,Math.sin(a)*0.7,0xe8f4fa,null,6)); }   // snow drifted round the foot
  out.push(...moTotemCrystal(gl,band,3.05));
  return out;
}
function moTotemJoint(gl,band){   // an iron post: a riveted plinth, a cog, a great ball joint in its fork, pistons and a crown of bolts
  const rust=(x,y,z,c)=>{ moTotemIron(x,y,z,c); if(moNoise(x+4,y,z,8)>0.72) c.set(0x8a4a24).multiplyScalar(0.8+0.3*moNoise(x,y,z,24)); }, bright=(x,y,z,c)=>{ c.set(0x9a9ea6).multiplyScalar(0.75+0.4*moNoise(x,y,z,12)); }, out=[];
  out.push(pc(vbox(1.1,0.28,1.1,0,0.14,0),rust),pc(vbox(0.84,0.12,0.84,0,0.34,0),moTotemIron));
  for(let i=0;i<8;i++){ const a=i/8*TAU+TAU/16; out.push(moPatch([Math.cos(a)*0.66,0.29,Math.sin(a)*0.66],[0,1,0],0.05,0.03,bright,6)); }
  out.push(moLoft([{y:0.4,rx:0.36,rz:0.36},{y:0.7,rx:0.3,rz:0.3},{y:1.0,rx:0.3,rz:0.3},{y:1.1,rx:0.36,rz:0.36}],moQ(10),rust));
  out.push(moEll(0.46,0.46,0.46,0,1.55,0,bright,null,12),moLoft([{y:1.5,rx:0.5,rz:0.5},{y:1.6,rx:0.5,rz:0.5}],moQ(12),rust));   // the ball and its seam
  for(const sd of [-1,1]) out.push(moBone([sd*0.55,1.1,0],[sd*0.55,2.15,0],0.07,0.07,rust,6),moBone([sd*0.55,1.55,0],[sd*0.42,1.55,0],0.12,0.12,bright,8));   // the fork's arms and the pins
  out.push(moBone([-0.55,2.12,0],[0.55,2.12,0],0.075,0.075,rust,6));
  for(let i=0;i<14;i++){ const a=i/14*TAU; out.push(moCone([Math.cos(a)*0.4,0.8,Math.sin(a)*0.4],[Math.cos(a)*0.55,0.5,Math.sin(a)*0.55],0.14,0.045,bright,5)); }   // a ring of teeth on the shaft
  for(let i=0;i<3;i++){ const a=i/3*TAU+0.5; out.push(moBone([Math.cos(a)*0.5,0.45,Math.sin(a)*0.5],[Math.cos(a)*0.3,1.35,Math.sin(a)*0.3],0.05,0.035,bright,5)); }   // pistons
  out.push(moEll(0.14,0.5,0.14,0,2.2,0,moTotemIron,null,8));
  out.push(...moTotemCrystal(gl,band,3.0));
  return out;
}
function moTotemMirror(gl,band){   // an upright black mirror in a gold frame on a pedestal, sun rays round it, the crystal in its reflection above
  const gold=(x,y,z,c)=>{ c.set(0xd9a032).multiplyScalar(0.75+0.4*clamp((y-1)*0.6)+0.1*moNoise(x,y,z,14)); }, glass=(x,y,z,c)=>{ c.set(0x0a0e18).lerp(_tint.set(0x3a5a88),clamp((y-1.0)*0.4+0.2*(x*2))*0.6); }, out=[];
  out.push(pc(vbox(1.0,0.26,1.0,0,0.13,0),moStone),moLoft([{y:0.26,rx:0.4,rz:0.4},{y:0.6,rx:0.26,rz:0.26},{y:1.0,rx:0.22,rz:0.22},{y:1.12,rx:0.3,rz:0.3}],moQ(10),moStone));
  out.push(moEll(0.6,0.88,0.05,0,2.0,0,glass,null,16),moTube(moTotemRing([0.66,0.94],24,1,2.0),0.065,0.065,gold,6,false));
  for(let i=0;i<10;i++){ const a=i/10*TAU+0.15, ca=Math.cos(a), sa=Math.sin(a); out.push(moCone([ca*0.7,2.0+sa*1.0,0],[ca*0.9,sa*1.1,0],i&1?0.3:0.2,0.05,gold,5)); }
  for(let i=0;i<4;i++){ const a=i/4*TAU+0.8; out.push(moEll(0.06,0.06,0.06,Math.cos(a)*0.66,2.0+Math.sin(a)*0.94,0,0xc83a2a,null,6)); }
  out.push(...moTotemCrystal(gl,band,3.15));
  return out;
}
function moTotemLantern(gl,band){   // an iron lamp-post with a caged soul-flame, chains, and wisps wound round the pole
  const out=[], cage=0x2a2630;
  out.push(pc(vbox(1.0,0.22,1.0,0,0.11,0),moStone),moLoft([{y:0.22,rx:0.36,rz:0.36},{y:0.5,rx:0.2,rz:0.2},{y:0.6,rx:0.16,rz:0.16}],moQ(10),moStone));
  out.push(moBone([0,0.55,0],[0,2.0,0],0.07,0.05,moTotemIron,7));
  const hook=[[0,1.95,0],[0.15,2.4,0],[0.5,2.6,0],[0.7,2.4,0]]; out.push(moTube(hook,0.05,0.035,moTotemIron,6,true));
  const lx=0.7, ly=1.6;
  out.push(moBone([lx,2.4,0],[lx,2.1,0],0.02,0.02,cage,4),moCone([lx,2.12,0],[0,1,0],0.26,0.28,cage,8),moEll(0.12,0.12,0.12,lx,2.45,0,cage,null,6));   // chain and roof
  out.push(moEll(0.2,0.3,0.2,lx,ly+0.35,0,(x,y,z,c)=>{ c.set(gl).multiplyScalar(0.8+0.5*clamp((y-1.7)*1.2)); },null,10),moEll(0.1,0.15,0.1,lx,ly+0.35,0,0xffffff,null,7));   // the flame
  for(let i=0;i<6;i++){ const a=i/6*TAU; out.push(moBone([lx+Math.cos(a)*0.27,ly+0.05,Math.sin(a)*0.27],[lx+Math.cos(a)*0.27,ly+0.7,Math.sin(a)*0.27],0.016,0.016,cage,4)); }   // the cage bars
  out.push(moLoft([{y:ly,rx:0.3,rz:0.3},{y:ly+0.06,rx:0.3,rz:0.3}],moQ(8),cage),moLoft([{y:ly+0.66,rx:0.3,rz:0.3},{y:ly+0.72,rx:0.3,rz:0.3}],moQ(8),cage));
  const sp=[]; for(let i=0;i<=8;i++){ const t=i/8, a=t*TAU*1.4; sp.push([Math.cos(a)*0.2,0.7+t*1.2,Math.sin(a)*0.2]); } out.push(moTube(sp,0.045,0.015,(x,y,z,c)=>{ c.set(band).multiplyScalar(0.8+0.5*clamp((y-0.7)*0.6)); },5,true));   // a wisp wound round the pole
  for(let i=0;i<4;i++){ const a=i/4*TAU+0.4; out.push(moEll(0.04,0.09,0.04,-0.3+Math.cos(a)*0.3,2.1+0.2*Math.sin(i*2),Math.sin(a)*0.3,gl,[0.2,0,0.3],5)); }
  out.push(...moTotemCrystal(gl,band,3.15).slice(0,1).map(g=>g.translate(-0.55,-0.1,0)));
  return out;
}
function moTotemWard(gl,band){   // a warding stone: a squared rune obelisk with glowing bands, a broken cap and a crystal turning above it
  const out=[];
  out.push(pc(vbox(1.2,0.3,1.2,0,0.15,0),moStone),moLoft([{y:0.3,rx:0.5,rz:0.5},{y:1.0,rx:0.4,rz:0.4},{y:1.9,rx:0.34,rz:0.34},{y:2.3,rx:0.3,rz:0.3}],moQ(4),moStone));
  for(let i=0;i<3;i++) out.push(moLoft([{y:0.75+i*0.5,rx:0.43-i*0.04,rz:0.43-i*0.04},{y:0.83+i*0.5,rx:0.43-i*0.04,rz:0.43-i*0.04}],moQ(4),c=>c.set(band)));   // rune bands
  for(let i=0;i<4;i++){ const a=i/4*TAU+0.8; out.push(moCone([Math.cos(a)*0.28,2.3,Math.sin(a)*0.28],[Math.cos(a)*0.4,1,Math.sin(a)*0.4],0.35,0.07,moStone,4)); }   // the broken cap's teeth
  out.push(...moTotemCrystal(gl,band,3.0));
  return out;
}
function moTotemBanner(gl,band){   // a war banner: a horned pole on a cairn with a ragged cloth, a skull-and-horn crest and a brazier flame
  const out=[], cloth=(x,y,z,c)=>{ c.set(band).multiplyScalar(0.55+0.5*clamp((y-0.9)*0.8)+0.1*moNoise(x,y,z,8)); };
  out.push(pc(vbox(1.3,0.35,1.3,0,0.17,0),moStone),pc(vbox(0.9,0.3,0.9,0.1,0.5,0.05),moStone));
  out.push(moBone([0,0.5,0],[0,2.9,0],0.08,0.06,moTotemIron,6),moBone([-0.7,2.5,0],[0.7,2.5,0],0.05,0.05,moTotemIron,5));
  out.push(pc(vbox(1.3,1.5,0.05,0,1.7,0.04),cloth));
  for(let i=0;i<5;i++) out.push(pc(vbox(0.2,0.3+0.12*(i%3),0.05,-0.55+i*0.275,0.8,0.04),cloth));   // the ragged hem
  out.push(moEll(0.2,0.2,0.2,0,3.0,0,0xd8d0c0,null,8));
  for(const sd of [-1,1]) out.push(moTube([[sd*0.18,3.0,0],[sd*0.45,3.1,0],[sd*0.55,3.4,0]],0.05,0.02,0xd8d0c0,5,true));   // horns
  out.push(moEll(0.16,0.28,0.16,0,3.5,0,(x,y,z,c)=>{ c.set(gl).multiplyScalar(0.8+0.5*clamp((y-3.3)*2)); },null,8));
  return out;
}
function moTotemBarricade(gl,band){   // a barricade: sharpened stakes leaning out of a lashed log, sandbags at the foot
  const out=[], wood=(x,y,z,c)=>{ c.set(0x5a4430).multiplyScalar(0.62+0.75*vn3(x*14,y*1.6,z*14)); };
  for(let i=0;i<9;i++){ const x=-1.6+i*0.4, lean=(i%2?0.35:-0.35); out.push(moBone([x,0,0.3*Math.sign(lean)],[x+lean*0.3,1.9+0.15*h3(i,1,2),0],0.09,0.02,wood,5)); }
  out.push(moBone([-1.9,0.9,0],[1.9,0.9,0],0.1,0.1,wood,6),moBone([-1.9,1.4,0],[1.9,1.4,0],0.1,0.1,wood,6));
  for(let i=0;i<5;i++) out.push(moEll(0.42,0.22,0.3,-1.6+i*0.8,0.18,0.55*(i%2?1:-1),(x,y,z,c)=>{ c.set(0x9a8e6c).multiplyScalar(0.8+0.3*moNoise(x,y,z,9)); },null,7));   // sandbags
  out.push(pc(vbox(0.1,0.5,0.04,0,2.0,0),c=>c.set(band)));
  return out;
}
function moTotemScarecrow(gl,band){   // the test room's scarecrow: a post with a crossbar, a stuffed burlap shirt and head with a stitched face, a battered hat, straw sticking out of the cuffs, a red target patch on the chest
  const out=[], wood=(x,y,z,c)=>{ c.set(0x6a5238).multiplyScalar(0.62+0.7*vn3(x*14,y*1.6,z*14)); }, sack=(x,y,z,c)=>{ c.set(0xc4a572).multiplyScalar(0.8+0.35*moNoise(x,y,z,9)); }, straw=(x,y,z,c)=>{ c.set(0xe0c258).multiplyScalar(0.8+0.3*moNoise(x,y,z,12)); };
  out.push(pc(vbox(0.9,0.14,0.9,0,0.07,0),moStone),moBone([0,0.1,0],[0,2.5,0],0.1,0.08,wood,6),moBone([-1.05,1.85,0],[1.05,1.85,0],0.07,0.07,wood,6));
  out.push(moEll(0.42,0.6,0.28,0,1.6,0,sack,null,9),moEll(0.3,0.3,0.28,0,2.3,0,sack,null,9));
  out.push(moEll(0.09,0.09,0.04,-0.1,2.34,0.26,0x1a1208,null,5),moEll(0.09,0.09,0.04,0.1,2.34,0.26,0x1a1208,null,5),pc(vbox(0.26,0.035,0.03,0,2.17,0.27),c=>c.set(0x1a1208)));
  out.push(moEll(0.2,0.2,0.04,0,1.7,0.28,(x,y,z,c)=>{ c.set(band).multiplyScalar(0.8+0.3*moNoise(x,y,z,6)); },null,10),moEll(0.1,0.1,0.045,0,1.7,0.285,0xf2eadc,null,8),moEll(0.04,0.04,0.05,0,1.7,0.29,gl,null,6));
  for(const sd of [-1,1]){ out.push(moBone([sd*0.35,1.85,0],[sd*0.95,1.85,0],0.11,0.09,sack,6),moEll(0.12,0.12,0.12,sd*1.08,1.85,0,straw,null,6),moEll(0.06,0.2,0.05,sd*1.1,1.68,0,straw,[0,0,sd*0.3],5),moEll(0.06,0.2,0.05,sd*1.05,1.7,0.07,straw,[0.3,0,sd*0.2],5)); }
  for(let i=0;i<5;i++){ const a=i/5*TAU; out.push(moEll(0.05,0.18,0.05,Math.cos(a)*0.2,1.05,Math.sin(a)*0.15,straw,[Math.sin(a)*0.3,0,-Math.cos(a)*0.3],5)); }
  out.push(moEll(0.5,0.06,0.5,0,2.52,0,0x5a4a32,[0.08,0,0.05],10),moEll(0.26,0.2,0.26,0,2.68,0,0x5a4a32,[0.08,0,0.05],9),pc(vbox(0.28,0.05,0.28,0,2.58,0),c=>c.set(band)));
  return out;
}
function moTotemBody(style,gl,band){
  if(style==='heart') return moTotemHeart(gl,band);
  if(style==='core') return moTotemCore(gl,band);
  if(style==='joint') return moTotemJoint(gl,band);
  if(style==='mirror') return moTotemMirror(gl,band);
  if(style==='lantern') return moTotemLantern(gl,band);
  if(style==='ward') return moTotemWard(gl,band);
  if(style==='banner') return moTotemBanner(gl,band);
  if(style==='barricade') return moTotemBarricade(gl,band);
  if(style==='scarecrow') return moTotemScarecrow(gl,band);
  return null;
}
