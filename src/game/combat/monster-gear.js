//@ What the goblin family carries and wears (monster-folk.js): weapons, helms, hats, horns, torso trimmings, fur, shells and wings
/* Weapons hang from the right forearm's pivot (hand at y = -arm[1]); heads' gear is in head space (monster-heads.js), torso trimmings in torso space (origin at the hip joint,
   rings from monster-folk.js), and moFolkExtras gives [where, geometry] pairs for the back ('back') or the head pivot ('head'). */
function moRingAt(rings,y){   // the torso's half-width, half-depth and z shift at height y (linear between rings)
  for(let i=1;i<rings.length;i++) if(y<=rings[i].y){ const a=rings[i-1], b=rings[i], f=clamp((y-a.y)/((b.y-a.y)||1)); return {rx:lerp(a.rx,b.rx,f),rz:lerp(a.rz,b.rz,f),z:lerp(a.z||0,b.z||0,f)}; }
  const l=rings[rings.length-1]; return {rx:l.rx,rz:l.rz,z:l.z||0};
}
// rows of fur locks hanging round a ring of the torso (y, radius scale s, n locks), the mantle and the kilt of yetis, trolls and reavers
function moFurLocks(rings,y,s,n,len,fur,rows){
  const out=[], at=moRingAt(rings,y);
  for(let r=0;r<(rows||1);r++) for(let i=0;i<n;i++){ const a=i/n*TAU+r*0.3, ca=Math.cos(a), sa=Math.sin(a), L=len*(0.75+0.5*h3(i,r,3));
    out.push(moCone([ca*at.rx*s,y-r*len*0.35,at.z+sa*at.rz*s],[ca*0.35,-1,sa*0.35],L,len*0.44,(x,yy,z,c)=>{ c.set(fur).multiplyScalar(0.7+0.45*moNoise(x,yy,z,9)+0.1*(yy-y+r*len*0.35)/len); },5)); }
  return out;
}
// shaggy locks down a hanging limb (origin at its top): rows of cones round it, the radius following r0 -> r1
function moFurLimb(len,r0,r1,rows,n,fur){
  const out=[];
  for(let j=0;j<rows;j++){ const t=(j+0.5)/rows, r=lerp(r0,r1,t), y=-len*t;
    for(let i=0;i<n;i++){ const a=i/n*TAU+j*0.9, ca=Math.cos(a), sa=Math.sin(a), L=len/rows*(1.3+0.5*h3(i,j,5));
      out.push(moCone([ca*r*0.85,y,sa*r*0.85],[ca*0.55,-1,sa*0.55],L,r*0.62,(x,yy,z,c)=>{ c.set(fur).multiplyScalar(0.7+0.4*vn3(x*20,yy*4,z*20)+0.15*clamp((yy-y)/-L+1)); },5)); } }
  return out;
}
const moFurPaint=fur=>(x,y,z,c)=>{ c.set(fur).multiplyScalar(0.6+0.62*vn3(x*20,y*3.5,z*20)); };   // streaks of shaggy fur
function moFolkTorsoExtras(F,p,rings){
  const out=[], form=p.form, bc=p.bottomColor, at=moRingAt(rings,0.01), tc=p.topColor;
  out.push(moEll(0.045,0.03,0.02,0,0.02,-at.rz-0.01+at.z,0xc9a13a,null,8));                                    // the belt buckle
  if(form==='goblin'||form==='kappa'||form==='hob'){                                                            // a ragged loincloth, front and back
    for(const sd of [-1,1]) out.push(moEll(0.09,0.14,0.018,0,-0.13,sd*(at.rz*0.95)+at.z,(x,y,z,c)=>{ c.set(bc).multiplyScalar(0.8+0.3*moNoise(x,y,z,12)); if(y<-0.2) c.multiplyScalar(0.8); },[0.06*sd,0,0],8));
    if(form==='goblin') for(let i=0;i<6;i++){ const a=i/6*TAU; out.push(moEll(0.022,0.022,0.022,Math.cos(a)*0.15,0.2+Math.sin(a*2)*0.02,Math.sin(a)*0.15-0.02,0xe8e2cc,null,5)); }   // a necklace of bones
  }
  if(form==='oni'){
    const stripe=(x,y,z,c)=>{ c.set(bc); if(Math.sin((x+z)*70+y*8)>0.35) c.set(0x1a1410); };                   // a tiger-skin kilt
    for(const sd of [-1,1]) out.push(moEll(0.16,0.15,0.02,0,-0.12,sd*(at.rz*1.05)+at.z,stripe,[0.1*sd,0,0],8));
    for(const sd of [-1,1]){ const c=(x,y,z,cc)=>{ cc.set(p.skin).multiplyScalar(0.92+0.15*moNoise(x,y,z,8)); }; out.push(moEll(0.11,0.075,0.05,sd*0.12,0.36,-moRingAt(rings,0.36).rz*0.9,c,null,8),   // pecs
      moEll(0.06,0.04,0.03,sd*0.05,0.16,-moRingAt(rings,0.16).rz*0.95,c,null,6),moEll(0.06,0.04,0.03,sd*0.05,0.25,-moRingAt(rings,0.25).rz*0.95,c,null,6)); }
    for(let i=0;i<10;i++){ const a=(i/10-0.5)*2.6+Math.PI/2; out.push(moEll(0.026,0.026,0.026,Math.cos(a)*0.2,0.46+Math.sin(i)*0.01,-Math.sin(a)*0.13-0.02,0xe8e2cc,null,5)); }   // a string of beads
  }
  if(form==='undead'&&p.top==='plate'){                                                                         // lamellar plates: a kilt and shoulder guards
    const lame=(x,y,z,c)=>{ c.set(p.topColor).multiplyScalar(0.85+0.2*Math.sin(y*90)); };
    for(let i=0;i<8;i++){ const a=i/8*TAU, r=0.17; out.push(moEll(0.06,0.12,0.012,Math.cos(a)*r,-0.09,Math.sin(a)*r*0.8,lame,[0,-a+Math.PI/2,0],6)); }
    for(const sd of [-1,1]) for(let k=0;k<3;k++) out.push(moEll(0.13-k*0.01,0.018,0.11,sd*(F.shX+0.02),F.shY+0.06-k*0.04,0,lame,[0,0,sd*(0.35+k*0.1)],8));
  }
  if(p.fur&&(form==='yeti'||form==='troll'||form==='viking')){
    out.push(...moFurLocks(rings,0.02,0.98,form==='yeti'?12:12,form==='yeti'?0.22:0.14,p.fur,2));
    out.push(...moFurLocks(rings,F.shY+0.02,0.9,form==='viking'?12:14,0.14,p.fur,1));
    if(form==='yeti') for(const y of [0.16,0.3,0.44]) out.push(...moFurLocks(rings,y,0.95,12,0.2,p.fur,1));   // the whole chest is shaggy
  }
  if(p.top==='hoodie') out.push(moEll(0.13,0.1,0.09,0,F.shY+0.05,0.09,(x,y,z,c)=>c.set(tc).multiplyScalar(0.85),null,10));   // a hood hanging behind the neck
  return out;
}
// worn on the head: horns, helms, hats
function moFolkHeadgear(F,p,sk){
  const r=F.hr, out=[], form=p.form, hc=p.hatColor, helm=p.hat==='helm', katana=p.weapon==='katana';
  if(p.horns&&form!=='goblin'){
    const hc2=p.horns;
    if(form==='oni'||form==='goblin') for(const sd of [-1,1]) out.push(moHorn([sd*r*0.45,r*0.75,-r*0.3],[sd*0.28,1,-0.15],r*1.7,r*0.2,0.7,hc2,6,[0,0,-1]));
    else if(form==='yeti') for(const sd of [-1,1]) out.push(moHorn([sd*r*0.8,r*0.45,-r*0.05],[sd*0.75,0.7,0],r*1.5,r*0.17,0.8,hc2,6,[0,1,0]));
    else if(form==='troll') for(const sd of [-1,1]) out.push(moHorn([sd*r*0.55,r*0.75,-r*0.2],[sd*0.4,1,-0.1],r*0.9,r*0.15,0.5,hc2,5,[0,0,-1]));
    else if(helm) for(const sd of [-1,1]) out.push(moHorn([sd*r*1.02,r*0.45,0],[sd,0.35,0],r*1.7,r*0.17,1.1,hc2,6,[0,1,0]));
  }
  if(helm){
    const met=(x,y,z,c)=>{ c.set(hc).multiplyScalar(0.8+0.3*clamp((y+r)/(2*r))); };
    out.push(pc(smoothN(new THREE.SphereGeometry(r*1.14,18,10,0,TAU,0,Math.PI*0.52).scale(1,1.02,1.05).translate(0,r*0.05,r*0.02)),met));
    out.push(moEll(r*1.2,r*0.07,r*1.22,0,r*0.02,0.02*r,(x,y,z,c)=>c.set(hc).multiplyScalar(0.62),null,16));                 // the rim
    if(katana){   // a kabuto: a flared neck guard of lames, and a gold crest of two horns
      for(let k=0;k<3;k++) out.push(pc(new THREE.CylinderGeometry(r*(1.2+k*0.18),r*(1.3+k*0.2),r*0.2,16,1,true,Math.PI*0.35,Math.PI*1.3).translate(0,-r*(0.05+k*0.2),r*0.1),(x,y,z,c)=>{ c.set(hc).multiplyScalar(0.78-k*0.07); if(k===2&&Math.abs(y+r*0.45)>r*0.08) c.set(0x8a2a26); }));
      for(const sd of [-1,1]) out.push(moHorn([sd*r*0.12,r*0.98,-r*0.85],[sd*0.5,1,-0.2],r*1.1,r*0.07,-0.6,0xc9a13a,5,[0,0,-1]));
    } else {      // a rounded iron helm with a nose guard and cheek plates
      out.push(moBone([0,r*0.35,-r*1.13],[0,-r*0.32,-r*1.06],r*0.07,r*0.09,met,5));
      for(const sd of [-1,1]) out.push(moEll(r*0.12,r*0.36,r*0.5,sd*r*1.08,-r*0.3,-r*0.1,(x,y,z,c)=>c.set(hc).multiplyScalar(0.7),null,8));
    }
  }
  if(p.hat==='ranger'){   // a floppy hat with a feather
    out.push(moEll(r*1.9,r*0.06,r*1.9,0,r*0.62,0,hc,null,16),moHorn([0,r*0.6,0],[0.1,1,0],r*1.5,r*0.75,0.9,hc,10,[0,0,1]),moHorn([r*0.6,r*0.8,-r*0.3],[0.7,0.6,0.3],r*1.6,r*0.06,-0.7,0xd8d2c0,4,[0,1,0]));
  }
  if(p.kasa) out.push(pc(new THREE.ConeGeometry(r*2.4,r*1.0,20).translate(0,r*1.15,0),(x,y,z,c)=>c.set(p.kasa).multiplyScalar(0.82+0.25*h3(Math.round(Math.atan2(z,x)*9),0,5))));
  return out;
}
const moIceBlade=(x,y,z,c)=>{ c.set(0xcfeaff).multiplyScalar(0.7+0.4*clamp(-z*3+0.5)); };
const MO_W={   // weapon builders: hand-space geometry lists hanging from y=0 (the hand), k the size
  kanabo:(k,p)=>{ const o=[moBone([0,0.03,0],[0,-1.05*k,0],0.045*k,0.13*k,p.club,8)], sil=0xb8b0a0;
    for(let r=0;r<5;r++) for(let i=0;i<6;i++){ const a=i/6*TAU+r*0.5, y=-(0.42+r*0.14)*k, R=(0.07+r*0.012)*k; o.push(moCone([Math.cos(a)*R,y,Math.sin(a)*R],[Math.cos(a),0.2,Math.sin(a)],0.1*k,0.03*k,sil,4)); }
    o.push(moBone([0,-1.02*k,0],[0,-1.09*k,0],0.13*k,0.1*k,0x2a2420,8)); return o; },
  spear:(k,p)=>[moBone([0,0.55*k,0],[0,-1.5*k,0],0.02*k,0.02*k,0x5a3e28,6),moCone([0,-1.5*k,0],[0,-1,0],0.3*k,0.045*k,0xc0c6cc,4),moEll(0.03*k,0.05*k,0.03*k,0,-1.46*k,0,0x8a2a26,null,6)],
  axe:(k,p)=>{ const o=[moBone([0,0.1*k,0],[0,-1.05*k,0],0.035*k,0.04*k,0x5a3e28,7)];   // a bearded axe: a curved blade on one side, a spike on the other
    o.push(moEll(0.02*k,0.16*k,0.13*k,0,-0.92*k,-0.12*k,(x,y,z,c)=>{ c.set(p.club).multiplyScalar(0.9+0.3*clamp(-z*3)); },[0,0,0],10),moCone([0,-0.9*k,0.03*k],[0,0,1],0.2*k,0.04*k,0x4a4a50,4)); return o; },
  katana:(k,p)=>[moBone([0,0.08*k,0],[0,-0.16*k,0],0.02*k,0.02*k,0x1a1414,6),moEll(0.07*k,0.012*k,0.07*k,0,-0.18*k,0,0x2a2420,null,8),
    moEll(0.012*k,0.44*k,0.05*k,0,-0.64*k,0,(x,y,z,c)=>{ c.set(p.club).multiplyScalar(0.8+0.5*clamp(z*9+0.5)); },null,6)],
  iceaxe:(k,p)=>{ const o=[moBone([0,0.25*k,0],[0,-1.5*k,0],0.04*k,0.045*k,0x4a3a2e,7),moEll(0.06*k,0.04*k,0.06*k,0,-1.5*k,0,moIce,null,8),moCone([0,-1.52*k,0],[0,-1,0],0.3*k,0.05*k,moIce,5)];   // the Rimeking's greataxe: a crescent of ice on a dark haft
    o.push(moEll(0.035*k,0.36*k,0.3*k,0,-1.15*k,-0.24*k,moIceBlade,null,12),moEll(0.03*k,0.2*k,0.16*k,0,-1.15*k,0.16*k,moIceBlade,null,8));
    for(let i=0;i<5;i++) o.push(moCone([0,-0.85*k-i*0.12*k,-0.42*k+Math.abs(i-2)*0.04*k],[0,-0.3,-1],0.22*k,0.04*k,moIce,4)); return o; },
  club:(k,p)=>[moBone([0,0.03,0],[0,-0.8*k,0],0.03*k,0.085*k,p.club,7),moEll(0.09*k,0.1*k,0.09*k,0,-0.85*k,0,(x,y,z,c)=>c.set(p.club).multiplyScalar(0.8),null,8),moCone([0.07*k,-0.7*k,0],[1,0.3,0],0.1*k,0.03*k,0xb8b0a0,4),moCone([-0.06*k,-0.6*k,0.03*k],[-1,0.3,0.3],0.1*k,0.03*k,0xb8b0a0,4)]
};
function moFolkWeapon(F,p){
  const k=F.ar>1.5?1.15:F.ar>1?1.0:0.85, W=MO_W[p.weapon]||MO_W.club, tilt={spear:1.15,katana:0.75,axe:0.8,kanabo:1.0}[p.weapon]||0.85;
  return moMerge(W(k,p)).rotateX(tilt).translate(0,-F.arm[1]-0.02,0);   // tilted forward from the hand, so it does not drag on the ground (the swing itself is poseRig's)
}
function moFolkExtras(F,p){
  const out=[];
  if(p.shell){   // a kappa's shell: a domed plate with hexagon lines
    const g=csph(1,14,10).scale(0.24,0.3,0.13).translate(0,0.27,0.17);
    out.push(['back',pc(smoothN(g),(x,y,z,c)=>{ c.set(p.shell); const u=Math.abs(Math.sin(x*16)*Math.sin((y+x*0.5)*14)); if(u>0.75) c.multiplyScalar(0.62); else c.multiplyScalar(0.92+0.15*moNoise(x,y,z,10)); })]);
  }
  if(p.wings){   // a crow's black wings: fans of long feathers
    for(const sd of [-1,1]){ const f=[];
      for(let i=0;i<9;i++){ const a=0.5+i*0.2, L=0.5+0.42*Math.sin((i/8)*Math.PI*0.85), dx=Math.sin(a)*sd, dy=Math.cos(a), o=[sd*0.12,0.42,0.13];
        f.push(moEll(0.03,L*0.5,0.008,o[0]+dx*L*0.5+sd*0.05,o[1]+dy*L*0.5,o[2]+i*0.006,(x,y,z,c)=>{ c.set(p.wings).multiplyScalar(0.8+0.6*clamp((y-0.3)*0.9)); if(i>3&&y>0.6) moTint(c,0x3a3a56,0.3); },[0,0,-sd*a],6)); }
      f.push(moEll(0.1,0.13,0.03,sd*0.14,0.42,0.13,p.wings,null,7));
      out.push(['back',moMerge(f)]); }
  }
  return out;
}
