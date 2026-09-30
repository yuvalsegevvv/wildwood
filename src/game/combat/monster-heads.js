//@ Heads of the goblin family (monster-folk.js), one builder per body plan: goblin, oni, kappa, tengu, undead skull, yeti, troll, viking
/* Head space: the origin is the skull's centre, +y up, the face looks toward -z, r is the head's radius (FOLKS[form].hr). Each builder returns a list of painted geometries;
   monster-gear.js adds what is worn (helm, hat, horns). sk(x,y,z,c) paints the skin. */
const moDark=(sk,k)=>(x,y,z,c)=>{ sk(x,y,z,c); c.multiplyScalar(k); };
const moEyes=(r,x,y,z,col,size,slit)=>[-1,1].flatMap(sd=>[moEll(r*size,r*size*0.85,r*size*0.6,sd*x,y,z,col,null,8),
  slit?moEll(r*size*0.2,r*size*0.8,r*size*0.2,sd*x,y,z-r*size*0.5,0x111111,null,6):moEll(r*size*0.42,r*size*0.42,r*size*0.3,sd*x,y,z-r*size*0.5,0x111111,null,6)]);
const moBrows=(r,y,z,col,ang,len)=>[-1,1].map(sd=>moEll(r*len,r*0.09,r*0.14,sd*r*0.4,y,z,col,[0,0,sd*ang],7));   // brows slanting down toward the nose: anger
const MO_HEADS={
  goblin(r,p,sk){
    const dk=moDark(sk,0.72), pk=(x,y,z,c)=>{ sk(x,y,z,c); moTint(c,0xd08a8a,0.35); }, out=[
      moEll(r,r*0.9,r*1.02,0,0,0,sk,null,16), moEll(r*0.66,r*0.42,r*0.62,0,-r*0.5,-r*0.3,sk,null,12), moEll(r*0.85,r*0.16,r*0.3,0,r*0.2,-r*0.78,dk,[0.2,0,0],10),
      moTube([[0,r*0.05,-r*0.85],[0,-r*0.05,-r*1.22],[0,-r*0.3,-r*1.38]],r*0.22,r*0.1,dk,7,true),
      moEll(r*0.42,r*0.07,r*0.12,0,-r*0.52,-r*0.88,0x2a0f0f,null,8),
      ...moEyes(r,r*0.42,r*0.12,-r*0.84,p.eyes,0.2,true), ...moBrows(r,r*0.34,-r*0.86,dk,0.45,0.3)];
    for(const sd of [-1,1]){   // long leaf ears, swept back and up, with a pink inside
      const ear=(len,w,col,dz)=>{ const g=new THREE.ConeGeometry(r*w,r*len,6).scale(1,1,0.2); g.translate(0,r*len/2,0).rotateZ(-sd*1.2).rotateY(sd*0.5).translate(sd*r*0.86,r*0.05,r*0.1+dz); return pc(smoothN(g),col); };
      out.push(ear(1.9,0.34,sk,0),ear(1.6,0.2,pk,-r*0.02));
      out.push(moCone([sd*r*0.22,-r*0.5,-r*0.96],[sd*0.1,1,-0.3],r*0.32,r*0.07,0xf0ead6,4),moCone([sd*r*0.13,-r*0.47,-r*0.98],[0,-1,-0.1],r*0.14,r*0.045,0xf0ead6,4));
    }
    return out;
  },
  oni(r,p,sk){
    const dk=moDark(sk,0.7), out=[moEll(r*1.05,r*0.92,r*1.02,0,0,0,sk,null,16), moEll(r*0.88,r*0.5,r*0.75,0,-r*0.5,-r*0.36,sk,null,12), moEll(r*0.95,r*0.2,r*0.42,0,r*0.26,-r*0.72,dk,[0.25,0,0],10),
      moEll(r*0.22,r*0.22,r*0.22,0,-r*0.08,-r*1.0,dk,null,8), moEll(r*0.6,r*0.09,r*0.14,0,-r*0.55,-r*1.03,0x2a0a0a,null,8),
      ...moEyes(r,r*0.42,r*0.1,-r*0.86,p.eyes,0.2,true), ...moBrows(r,r*0.36,-r*0.88,dk,0.55,0.34)];
    for(const sd of [-1,1]){
      out.push(moHorn([sd*r*0.5,-r*0.5,-r*0.85],[sd*0.1,1,-0.25],r*0.62,r*0.13,0.6,p.horns||0xf2ead8,5,[0,0,-1]));   // lower tusks
      out.push(moCone([sd*r*0.2,-r*0.5,-r*1.05],[0,-1,-0.1],r*0.2,r*0.05,0xf0ead6,4));
      out.push(moEll(r*0.11,r*0.24,r*0.06,sd*r*1.02,r*0.05,r*0.05,sk,[0,0,sd*0.5],6));                        // small pointed ears
    }
    for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.4, hx=Math.sin(a)*r*0.95, hz=Math.cos(a)*r*0.95; out.push(moCone([hx,r*0.55,hz*0.7+r*0.1],[Math.sin(a)*0.5,0.8,Math.cos(a)*0.6+0.4],r*0.7,r*0.14,0x14100e,5)); }   // a wild dark mane
    return out;
  },
  kappa(r,p,sk){
    const dk=moDark(sk,0.75), beak=p.nose||0xe0b040, out=[moEll(r,r*0.9,r*1.0,0,0,0,sk,null,16), moEll(r*0.55,r*0.3,r*0.5,0,-r*0.45,-r*0.4,sk,null,10),
      moEll(r*0.42,r*0.17,r*0.5,0,-r*0.28,-r*1.05,beak,null,10), moHorn([0,-r*0.05,-r*0.85],[0,-0.2,-1],r*0.7,r*0.24,-0.4,beak,6,[0,-1,0]), moEll(r*0.36,r*0.09,r*0.42,0,-r*0.52,-r*0.98,beak,null,8),
      ...moEyes(r,r*0.4,r*0.3,-r*0.66,p.eyes,0.25,false)];
    out.push(pc(cyl(r*0.6,r*0.66,r*0.1,16).translate(0,r*0.9,0),c=>c.set(0x9ac8d8)),pc(cyl(r*0.52,r*0.52,r*0.03,16).translate(0,r*0.96,0),c=>c.set(0xd8f2ff)));   // the dish: a pool on the crown
    for(let i=0;i<12;i++){ const a=i/12*TAU; out.push(moEll(r*0.16,r*0.12,r*0.16,Math.cos(a)*r*0.78,r*0.82,Math.sin(a)*r*0.78,0x1c2a20,null,6)); }   // and the hair round it
    return out;
  },
  tengu(r,p,sk){
    const beak=p.nose||0xd8a030, out=[moEll(r,r*0.95,r*1.05,0,0,0,sk,null,14), moEll(r*0.6,r*0.34,r*0.55,0,-r*0.4,-r*0.35,sk,null,10),
      moHorn([0,-r*0.05,-r*0.85],[0,-0.12,-1],r*1.7,r*0.36,-0.9,beak,6,[0,1,0]), moHorn([0,-r*0.35,-r*0.8],[0,0.05,-1],r*1.2,r*0.22,0.2,beak,6,[0,1,0]),
      ...moEyes(r,r*0.62,r*0.16,-r*0.55,p.eyes,0.2,false)];
    for(let i=0;i<5;i++){ const a=(i-2)*0.28; out.push(moCone([Math.sin(a)*r*0.5,r*0.75,r*0.1],[Math.sin(a)*0.5,0.5,1],r*0.85,r*0.14,0x121218,5)); }   // crest feathers
    return out;
  },
  undead(r,p,sk){
    const dk=moDark(sk,0.55), out=[moEll(r,r*0.92,r*1.02,0,0,0,sk,null,16), moEll(r*0.55,r*0.34,r*0.52,0,-r*0.52,-r*0.42,sk,null,10),
      moEll(r*0.3,r*0.16,r*0.24,-r*0.55,-r*0.22,-r*0.72,sk,null,8), moEll(r*0.3,r*0.16,r*0.24,r*0.55,-r*0.22,-r*0.72,sk,null,8),
      moEll(r*0.09,r*0.15,r*0.06,0,-r*0.2,-r*0.98,0x0c0f14,null,6)];
    for(const sd of [-1,1]){ out.push(moEll(r*0.27,r*0.22,r*0.16,sd*r*0.4,r*0.08,-r*0.86,0x0c0f14,null,8),moEll(r*0.1,r*0.1,r*0.08,sd*r*0.4,r*0.08,-r*0.97,p.eyes,null,6)); }
    for(let i=-2;i<=2;i++){ out.push(moEll(r*0.07,r*0.09,r*0.05,i*r*0.13,-r*0.4,-r*(0.98-Math.abs(i)*0.05),0xe8e2cc,null,5),moEll(r*0.07,r*0.09,r*0.05,i*r*0.12,-r*0.54,-r*(0.9-Math.abs(i)*0.05),0xe8e2cc,null,5)); }
    return out;
  },
  yeti(r,p,sk){
    const fur=p.fur||0xf0f4f8, fk=(x,y,z,c)=>{ c.set(fur).multiplyScalar(0.8+0.3*moNoise(x,y,z,12)); }, face=moDark(sk,0.85), out=[moEll(r*1.1,r*1.0,r*1.05,0,0,0,fk,null,14),
      moEll(r*0.72,r*0.62,r*0.4,0,-r*0.12,-r*0.78,face,null,12), moEll(r*0.95,r*0.22,r*0.3,0,r*0.26,-r*0.74,fk,[0.2,0,0],10), moEll(r*0.62,r*0.36,r*0.5,0,-r*0.55,-r*0.45,fk,null,10),
      moEll(r*0.36,r*0.13,r*0.1,0,-r*0.45,-r*0.98,0x2a1418,null,8), moEll(r*0.16,r*0.14,r*0.12,0,-r*0.06,-r*1.02,moDark(sk,0.6),null,6),
      ...moEyes(r,r*0.36,r*0.12,-r*0.9,p.eyes,0.14,false)];
    for(const sd of [-1,1]) out.push(moCone([sd*r*0.2,-r*0.45,-r*1.0],[0,-1,-0.1],r*0.3,r*0.055,0xf4f0e0,4));
    for(let i=0;i<7;i++){ const a=(i/6-0.5)*2.2; out.push(moCone([Math.sin(a)*r*0.8,r*0.6,r*0.2],[Math.sin(a)*0.5,1,0.3],r*0.6,r*0.15,fk,5)); }   // a shaggy crest
    return out;
  },
  troll(r,p,sk){
    const dk=moDark(sk,0.72), out=[moEll(r*1.0,r*0.9,r*1.02,0,0,0,sk,null,14), moEll(r*0.85,r*0.5,r*0.7,0,-r*0.52,-r*0.35,sk,null,12), moEll(r*0.9,r*0.2,r*0.4,0,r*0.22,-r*0.74,dk,[0.2,0,0],10),
      moEll(r*0.26,r*0.3,r*0.3,0,-r*0.12,-r*1.02,dk,null,8), moEll(r*0.6,r*0.09,r*0.14,0,-r*0.55,-r*1.0,0x2a1414,null,8),
      ...moEyes(r,r*0.4,r*0.1,-r*0.86,p.eyes,0.14,false), ...moBrows(r,r*0.3,-r*0.88,dk,0.4,0.32)];
    for(const sd of [-1,1]){
      out.push(moHorn([sd*r*0.5,-r*0.55,-r*0.8],[sd*0.15,1,-0.3],r*0.75,r*0.15,0.5,0xe8e0c8,5,[0,0,-1]));
      out.push(moEll(r*0.1,r*0.3,r*0.06,sd*r*1.0,-r*0.05,r*0.1,sk,[0,0,sd*0.9],6));
      out.push(moEll(r*0.07,r*0.06,r*0.07,sd*r*0.5,r*0.5,-r*0.7,dk,null,5),moEll(r*0.06,r*0.06,r*0.06,-sd*r*0.3,-r*0.3,-r*0.95,dk,null,5));   // warts
    }
    return out;
  },
  viking(r,p,sk){
    const beard=p.fur||0xd8d0c0, bk=(x,y,z,c)=>{ c.set(beard).multiplyScalar(0.8+0.3*moNoise(x,y,z,10)); }, dk=moDark(sk,0.8);
    const out=[moEll(r,r*1.05,r*1.0,0,0,0,sk,null,16), moEll(r*0.62,r*0.4,r*0.55,0,-r*0.5,-r*0.4,sk,null,12), moEll(r*0.85,r*0.14,r*0.25,0,r*0.22,-r*0.78,dk,[0.25,0,0],8),
      moEll(r*0.15,r*0.28,r*0.2,0,-r*0.1,-r*0.98,dk,[0.4,0,0],8), ...moEyes(r,r*0.38,r*0.1,-r*0.86,p.eyes,0.14,false), ...moBrows(r,r*0.3,-r*0.9,bk,0.35,0.3),
      moEll(r*0.72,r*0.55,r*0.5,0,-r*0.72,-r*0.55,bk,null,10), moEll(r*0.4,r*0.09,r*0.12,0,-r*0.46,-r*0.98,bk,null,8)];   // the beard and the moustache
    for(let i=0;i<3;i++) out.push(moTube([[(i-1)*r*0.28,-r*0.9,-r*0.75],[(i-1)*r*0.3,-r*1.5,-r*0.85],[(i-1)*r*0.32,-r*2.1,-r*0.8]],r*0.13,r*0.07,bk,5,true));   // and its braids
    return out;
  }
};
function moFolkHead(F,p,sk){ return [...(MO_HEADS[p.form]||MO_HEADS.goblin)(F.hr,p,sk),...moFolkHeadgear(F,p,sk)]; }
