//@ What sets the bosses apart in the goblin and fox models: Akaoni's iron, skulls and flames, Ymrik's ice crown, cape and greataxe, Kyuubi's gold, beads, rope and marks
/* The other bosses are the family builders with a boss branch (the Rootwarden in monster-woods.js, Carapax in monster-bugs.js, Vetrmaw in monster-wyrm.js). These hooks return
   geometry lists for the parts of a goblin-family body ({torso, head, fa: {-1, 1}}: torso space, head space, each forearm's) or of the fox's body, each keyed by the boss's id.
   pal.embers paints glowing cracks on the skin (folk models). */
const moIron=(x,y,z,c)=>{ c.set(0x2c2a30).multiplyScalar(0.8+0.4*vn3(x*14,y*14,z*14)); };
const moIce=(x,y,z,c)=>{ c.set(0xd4f0ff).multiplyScalar(0.72+0.35*clamp(y*1.2)); };
const moBoneC=(x,y,z,c)=>{ c.set(0xe8e2cc).multiplyScalar(0.85+0.2*moNoise(x,y,z,12)); };
const moGold=(x,y,z,c)=>{ c.set(0xd8a838).multiplyScalar(0.8+0.4*clamp(y*2+0.5)); };
function moBossFolk(d,F,p,sk,rings){
  const B={torso:[],head:[],fa:{'-1':[],'1':[]}}, r=F.hr, W=[-1,1];
  if(d.id==='akaoni'){
    for(const sd of W){
      B.torso.push(moEll(0.2,0.13,0.18,sd*0.36,0.54,0,moIron,[0,0,sd*0.3],10));
      for(let i=0;i<5;i++){ const a=i/5*TAU; B.torso.push(moCone([sd*0.36+Math.cos(a)*0.11,0.6,Math.sin(a)*0.11],[Math.cos(a)*0.4+sd*0.3,1,Math.sin(a)*0.4],0.2,0.035,moIron,4)); }   // spiked iron pauldrons
      B.fa[sd].push(moEll(0.075,0.03,0.075,0,-F.arm[1]*0.88,0,moIron,null,10),moTube([[sd*0.06,-F.arm[1]*0.9,0],[sd*0.12,-F.arm[1]*0.9-0.1,0.03],[sd*0.1,-F.arm[1]*0.9-0.2,0.06]],0.012,0.012,moIron,4,false));   // a shackle with a broken chain
    }
    for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.3; B.torso.push(moEll(0.042,0.048,0.042,Math.sin(a)*0.21,0.46-0.02*Math.cos(a),-Math.cos(a)*0.15,moBoneC,null,7)); }   // a necklace of skulls
    B.torso.push(moTube([[-0.22,0.5,-0.12],[-0.06,0.32,-0.2],[0.1,0.16,-0.2],[0.22,0.02,-0.15]],0.024,0.024,moIron,5,false),moEll(0.075,0.085,0.045,0,0.02,-0.17,moBoneC,null,8));   // a chain across the chest, a skull buckle
    for(let i=0;i<3;i++) B.torso.push(moEll(0.06,0.18,0.012,(i-1)*0.1,-0.22,0.15,(x,y,z,c)=>{ c.set(0x7a1e14).multiplyScalar(0.8+0.3*moNoise(x,y,z,10)); },[0.1,0,0],6));
    for(let i=0;i<7;i++){ const a=(i-3)*0.3; B.head.push(moCone([Math.sin(a)*r*0.7,r*0.75,r*0.05],[Math.sin(a)*0.5,1,0.15],r*(1.5-Math.abs(i-3)*0.18),r*0.16,(x,y,z,c)=>{ c.set(0xff7a20).lerp(_tint.set(0xffe070),clamp((y-r*0.75)/(r*1.3))); },5)); }   // a mane of flame
    for(const sd of W){ B.head.push(moHorn([sd*r*0.85,r*0.5,-r*0.2],[sd*0.6,0.8,-0.2],r*0.85,r*0.1,0.6,p.horns,5,[0,0,-1]),moTube([[sd*r*1.0,r*0.0,r*0.05],[sd*r*1.12,-r*0.2,r*0.05],[sd*r*1.02,-r*0.4,r*0.05],[sd*r*0.9,-r*0.25,r*0.05]],0.014,0.014,moGold,5,false)); }   // more horns, gold rings in the ears
    B.head.push(moEll(r*0.09,r*0.11,r*0.05,0,r*0.5,-r*1.0,0xff2a10,null,7));
  }
  if(d.id==='ymrik'){
    B.torso.push(moLoft([{y:0.58,rx:0.34,rz:0.07,z:0.17},{y:0.3,rx:0.36,rz:0.06,z:0.2},{y:-0.1,rx:0.33,rz:0.06,z:0.23},{y:-0.5,rx:0.28,rz:0.05,z:0.25},{y:-0.64,rx:0.2,rz:0.03,z:0.25}],moQ(16),(x,y,z,c)=>{ c.set(0xf0f4f8).multiplyScalar(0.62+0.5*vn3(x*16,y*4,z*16)); if(y<-0.35) moTint(c,0xa8d8f0,0.4); }));   // a fur cape
    B.torso.push(...moFurLocks(rings,F.shY+0.03,1.0,14,0.2,0xf0f4f8,2));
    for(const sd of W){
      B.torso.push(moEll(0.2,0.12,0.18,sd*0.34,0.54,0,(x,y,z,c)=>{ c.set(0x6a8298).multiplyScalar(0.8+0.3*clamp(y*2)); },[0,0,sd*0.3],10));
      for(let i=0;i<4;i++){ const a=i/4*TAU; B.torso.push(moCone([sd*0.36+Math.cos(a)*0.09,0.58,Math.sin(a)*0.09],[Math.cos(a)*0.4+sd*0.5,1,Math.sin(a)*0.4],0.36+0.12*(i%2),0.06,moIce,5)); }   // crystals from the pauldrons
    }
    for(let i=0;i<9;i++){ const a=i/9*TAU; B.torso.push(moCone([Math.cos(a)*0.19,0.0,Math.sin(a)*0.14],[Math.cos(a)*0.2,-1,Math.sin(a)*0.2],0.16+0.08*h3(i,1,1),0.03,moIce,4)); }   // icicles round the belt
    B.torso.push(moEll(0.06,0.07,0.03,0,0.02,-0.16,moIce,null,8));
    for(let i=0;i<7;i++){ const a=(i-3)*0.34; B.head.push(moCone([Math.sin(a)*r*0.9,r*0.95,Math.cos(a)*r*0.15],[Math.sin(a)*0.35,1,-0.05],r*(1.4+0.5*Math.cos(a*1.6)),r*0.12,moIce,5)); }   // a crown of ice
    for(let i=0;i<7;i++) B.head.push(moCone([(i-3)*r*0.16,-r*1.3-Math.abs(i-3)*0.02,-r*0.75],[0,-1,-0.05],r*(0.55-Math.abs(i-3)*0.05),r*0.06,moIce,4));   // icicles in the beard
  }
  return B;
}
function moBossFox(d,p,body){
  if(d.id!=='kyuubi') return;
  const W=[-1,1];
  for(const sd of W){ body.push(moHorn([sd*0.06,1.08,-0.62],[sd*0.6,1,-0.1],0.3,0.03,-0.9*sd,moGold,5,[sd,0,0]),moEll(0.008,0.06,0.004,sd*0.12,0.97,-0.86,0xd03020,[0,0,sd*0.5],4),moEll(0.008,0.05,0.004,sd*0.14,0.92,-0.86,0xd03020,[0,0,sd*0.7],4)); }   // a crescent of gold on the brow, face marks
  body.push(moTube([[-0.12,1.02,-0.7],[0,1.07,-0.74],[0.12,1.02,-0.7]],0.012,0.012,moGold,5,false),moEll(0.03,0.04,0.02,0,1.05,-0.76,0xe03020,null,6));   // a circlet with a ruby
  for(let i=0;i<14;i++){ const a=i/14*TAU; body.push(moEll(i%5?0.028:0.04,i%5?0.028:0.04,i%5?0.028:0.05,Math.cos(a)*0.2,0.82+Math.sin(a)*0.22,-0.55,i%5?moGold:(x,y,z,c)=>{ c.set(0xd03a2a); },null,6)); }   // a collar of beads
  const rope=[]; for(let i=0;i<=8;i++){ const a=-0.25+i/8*(TAU+0.5)/1.0; rope.push([Math.cos(a)*0.29,0.72+Math.sin(a)*0.32,-0.3+0.02*Math.sin(i*3)]); }
  body.push(moTube(rope,0.032,0.032,(x,y,z,c)=>{ c.set(0xeae2c8).multiplyScalar(0.75+0.25*Math.sin((x+y)*90)); },5,false));   // a braided rope round the chest
  for(let i=0;i<5;i++){ const a=(i/4-0.5)*1.6; body.push(moEll(0.028,0.05,0.004,Math.sin(a)*0.28,0.5+0.03*Math.cos(a*2),-0.3-Math.cos(a)*0.03,0xd8a030,[0,0,0.3*Math.sin(a*3)],5)); }   // gold tassels hanging from the rope
  for(let i=0;i<8;i++) body.push(moCone([0,0.98-i*0.015,-0.5+i*0.13],[0,1,0.2],0.32-i*0.02,0.04,p.tip,4));   // a mane of foxfire down the spine
}
