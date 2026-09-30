//@ The goblin family's bodies (model 'goblin': goblins, oni, kappa, tengu, undead, yeti, trolls, reavers, Akaoni, Ymrik): one rig, a body plan for each form (pal.form)
/* The rig has the player's node names (hips, spine, head, shL/elL, shR/elR, hipL/kneeL, hipR/kneeR), so poseRig (character/pose.js) animates it: walk, run, the overhead slash.
   poseRig turns spine, head and the limbs every frame, so a hunch is baked in a fixed group under the spine ('tilt') and the head's tilt in a fixed group under 'head'.
   A body plan (FOLKS) gives the leg and arm lengths, limb thickness, the torso as rings [y, half-width, half-depth, z shift] from the hip joint up, the shoulders, the hunch
   and the head; pal (the def) gives the form (pal.form: goblin, hob, oni, kappa, tengu, undead, yeti, troll, viking) and colours and gear: skin, eyes, top ('tshirt' tunic, 'jacket' jerkin,
   'hoodie' cloak, 'plate' armour; an oni is bare-chested) + topColor, bottom ('shorts' loincloth, 'trousers') + bottomColor, hat ('helm', 'ranger'), club (the weapon's colour), weapon, horns,
   kasa, shell, nose, wings, fur (a yeti is furred all over; a troll, reaver or Ymrik wears fur locks and a beard), embers (glowing cracks on the skin). Heads: monster-heads.js, weapons
   and gear: monster-gear.js, the bosses' extras: monster-boss.js. */
const FOLKS={
  goblin:{leg:[0.36,0.34],foot:0.06,hipX:0.085,lr:1.0,ar:0.95,arm:[0.28,0.3],shX:0.2,shY:0.44,hunch:0.4,headY:0.64,hr:0.15,neck:0.05,
    torso:[[-0.1,0.09,0.08,0],[-0.02,0.13,0.11,0],[0.08,0.15,0.16,-0.035],[0.2,0.145,0.165,-0.04],[0.32,0.15,0.12,-0.01],[0.42,0.17,0.1,0],[0.5,0.11,0.075,0.01],[0.55,0.05,0.045,0.01]]},
  hob:{leg:[0.42,0.4],foot:0.07,hipX:0.1,lr:1.2,ar:1.25,arm:[0.3,0.3],shX:0.25,shY:0.5,hunch:0.2,headY:0.7,hr:0.16,neck:0.06,
    torso:[[-0.11,0.11,0.09,0],[-0.03,0.16,0.12,0],[0.08,0.18,0.15,-0.02],[0.2,0.18,0.14,-0.01],[0.33,0.22,0.15,0],[0.44,0.25,0.14,0],[0.53,0.16,0.1,0.01],[0.58,0.06,0.05,0.01]]},
  oni:{leg:[0.42,0.4],foot:0.08,hipX:0.13,lr:1.9,ar:1.95,arm:[0.31,0.29],shX:0.3,shY:0.5,hunch:0.14,headY:0.68,hr:0.165,neck:0.05,
    torso:[[-0.11,0.14,0.11,0],[-0.03,0.19,0.14,0],[0.08,0.2,0.16,-0.01],[0.2,0.19,0.15,-0.01],[0.33,0.27,0.17,-0.01],[0.44,0.32,0.17,0],[0.52,0.22,0.12,0.01],[0.57,0.08,0.06,0.01]]},
  kappa:{leg:[0.36,0.34],foot:0.06,hipX:0.08,lr:0.95,ar:0.9,arm:[0.28,0.3],shX:0.19,shY:0.44,hunch:0.32,headY:0.62,hr:0.14,neck:0.05,
    torso:[[-0.1,0.09,0.08,0],[-0.02,0.12,0.1,0],[0.08,0.14,0.13,-0.02],[0.2,0.13,0.12,-0.01],[0.32,0.14,0.11,0],[0.42,0.16,0.1,0],[0.5,0.1,0.07,0.01],[0.55,0.05,0.045,0.01]]},
  tengu:{leg:[0.46,0.44],foot:0.07,hipX:0.08,lr:1.0,ar:1.0,arm:[0.31,0.3],shX:0.21,shY:0.5,hunch:0.05,headY:0.7,hr:0.125,neck:0.07,
    torso:[[-0.11,0.1,0.08,0],[-0.03,0.13,0.1,0],[0.08,0.14,0.1,0],[0.2,0.13,0.1,0],[0.33,0.17,0.11,0],[0.44,0.19,0.11,0],[0.53,0.13,0.08,0.01],[0.58,0.05,0.045,0.01]]},
  undead:{leg:[0.44,0.42],foot:0.07,hipX:0.09,lr:1.0,ar:1.0,arm:[0.3,0.3],shX:0.22,shY:0.5,hunch:0.12,headY:0.7,hr:0.125,neck:0.06,
    torso:[[-0.11,0.1,0.08,0],[-0.03,0.13,0.1,0],[0.08,0.14,0.1,0],[0.2,0.13,0.1,0],[0.33,0.17,0.11,0],[0.44,0.2,0.12,0],[0.53,0.14,0.09,0.01],[0.58,0.05,0.045,0.01]]},
  yeti:{leg:[0.4,0.38],foot:0.09,hipX:0.14,lr:1.9,ar:2.1,arm:[0.4,0.38],shX:0.36,shY:0.5,hunch:0.34,headY:0.7,hr:0.23,neck:0.04,
    torso:[[-0.11,0.16,0.13,0],[-0.03,0.22,0.17,0],[0.08,0.25,0.2,-0.02],[0.2,0.25,0.19,-0.02],[0.33,0.31,0.2,-0.01],[0.44,0.36,0.19,0],[0.52,0.26,0.13,0.01],[0.57,0.1,0.07,0.01]]},
  troll:{leg:[0.38,0.36],foot:0.09,hipX:0.14,lr:1.7,ar:1.9,arm:[0.36,0.34],shX:0.34,shY:0.5,hunch:0.32,headY:0.67,hr:0.17,neck:0.04,
    torso:[[-0.11,0.15,0.13,0],[-0.03,0.21,0.17,0],[0.08,0.24,0.24,-0.04],[0.2,0.24,0.24,-0.05],[0.33,0.28,0.19,-0.02],[0.44,0.32,0.17,0],[0.52,0.22,0.12,0.01],[0.57,0.09,0.06,0.01]]},
  viking:{leg:[0.44,0.42],foot:0.07,hipX:0.1,lr:1.3,ar:1.35,arm:[0.31,0.3],shX:0.27,shY:0.5,hunch:0.1,headY:0.7,hr:0.13,neck:0.06,
    torso:[[-0.11,0.12,0.09,0],[-0.03,0.16,0.12,0],[0.08,0.17,0.13,0],[0.2,0.17,0.13,0],[0.33,0.22,0.15,0],[0.44,0.26,0.15,0],[0.53,0.17,0.1,0.01],[0.58,0.06,0.05,0.01]]}
};
// a limb hanging from y=0 down to y=-len: prof [t, radius] (t 0..1 down its length), sx / sz squash its cross-section; the ends are rounded
function moLimb(prof,len,sx,sz,f,sides){
  const r0=prof[0][1], r1=prof[prof.length-1][1], rings=[{y:r0*0.45,rx:r0*0.55*sx,rz:r0*0.55*sz},{y:r0*0.15,rx:r0*0.9*sx,rz:r0*0.9*sz}];
  for(const [t,r] of prof) rings.push({y:-len*t,rx:r*sx,rz:r*sz});
  rings.push({y:-len-r1*0.15,rx:r1*0.9*sx,rz:r1*0.9*sz},{y:-len-r1*0.45,rx:r1*0.5*sx,rz:r1*0.5*sz});
  return moLoft(rings,sides||9,f);
}
// a hand at the end of a forearm (origin at the wrist): a palm and n curled fingers; claw colour cc (or none)
function moHand(s,f,n,cc,sd){
  const out=[moEll(0.032*s,0.038*s,0.022*s,0,-0.03*s,0,f,null,8)];
  for(let i=0;i<n;i++){ const x=(i-(n-1)/2)*0.024*s; out.push(moBone([x,-0.055*s,-0.006*s],[x*1.2,-0.11*s,-0.03*s],0.011*s,0.008*s,f,5)); if(cc!==undefined) out.push(moCone([x*1.2,-0.108*s,-0.03*s],[0,-0.5,-1],0.045*s,0.008*s,cc,4)); }
  out.push(moBone([-sd*0.03*s,-0.03*s,-0.01*s],[-sd*0.05*s,-0.07*s,-0.04*s],0.011*s,0.008*s,f,5));   // the thumb, on the inner side
  return out;
}
// a foot at the bottom of a shin (origin at the ankle, sole at y=-h): ball, heel and n toes; boot: a shaft up the shin instead
function moFoot(w,len,h,f,n,cc,boot,bc){
  const out=[];
  if(boot){ out.push(moBone([0,h*0.4,0],[0,-h*0.9,0],w*0.75,w*0.8,bc,8),moEll(w*0.8,h*0.5,len*0.55,0,-h*0.55,-len*0.35,bc,null,8)); return out; }
  out.push(moEll(w*0.75,h*0.55,len*0.5,0,-h*0.45,-len*0.3,f,null,8));
  for(let i=0;i<n;i++){ const x=(i-(n-1)/2)*w*0.55; out.push(moEll(w*0.24,h*0.3,w*0.34,x,-h*0.7,-len*0.78,f,null,6)); if(cc!==undefined) out.push(moCone([x,-h*0.7,-len*0.9],[0,-0.3,-1],len*0.22,w*0.12,cc,4)); }
  return out;
}
function folkGeo(d,p){
  const F=FOLKS[p.form]||FOLKS.goblin, G={F}, skin=p.skin, lr=F.lr, ar=F.ar, fur=p.form==='yeti'?p.fur:null, top=p.top||'tshirt', bot=p.bottom||'shorts', tc=p.topColor, bc=p.bottomColor;
  const furP=fur?moFurPaint(fur):null, skinF=(x,y,z,c)=>{ c.set(skin).multiplyScalar(0.9+0.2*moNoise(x,y,z,9)); if(p.embers&&Math.abs(moNoise(x,y,z,4)-0.5)<0.03) c.set(p.embers); if(p.form==='goblin'||p.form==='troll'){ if(moNoise(x+3,y,z,26)>0.78) c.multiplyScalar(0.72); } };   // blotches, warts
  F.hipY=F.leg[0]+F.leg[1]+F.foot; F.shZ=0; F.headZ=-0.01;
  const clothed=top==='jacket'||top==='hoodie'||top==='plate', hem=clothed?-0.05:0.14;
  const plate=(c,y)=>{ c.set(tc).multiplyScalar(0.8+0.3*(Math.floor((y+1)*13)&1)); };
  // the torso: rings, the garment painted over the skin, the neck, and the shoulders' padding
  const rings=F.torso.map(([y,rx,rz,z])=>({y,rx,rz,z})), B=d.boss?moBossFolk(d,F,p,skinF,rings):null;   // bosses add their own trimmings
  const tparts=[moLoft(rings,moQ(22),(x,y,z,c)=>{
    skinF(x,y,z,c);
    if(y>-0.02&&y<0.045){ c.set(0x2a1e14); return; }                                            // the belt
    if(y<=-0.02){ if(bot!=='none') c.set(bc).multiplyScalar(0.9+0.2*moNoise(x,y,z,12)); return; }   // loincloth / trousers
    if(fur){ furP(x,y,z,c); return; }
    const rag=0.05*moNoise(x,0,z,14);
    if(p.form==='oni'){ return; }
    if(y>hem+rag&&!(top==='tshirt'&&y>0.4&&Math.abs(x)>rings[5].rx*0.7)){ if(top==='plate') plate(c,y); else c.set(tc).multiplyScalar(0.85+0.3*moNoise(x,y,z,10)); }
  })];
  tparts.push(moBone([0,F.torso[F.torso.length-2][0]-0.03,0.01],[0,F.headY-0.03,F.headZ+0.02],F.hr*0.42+0.02,F.hr*0.36+0.015,skinF,8));   // the neck
  if(top==='jacket'||top==='plate'||top==='hoodie') for(const sd of [-1,1]) tparts.push(moEll(0.09*ar+0.03,0.06*ar+0.02,0.09*ar+0.03,sd*F.shX,F.shY+0.03,0,(x,y,z,c)=>{ if(top==='plate'){ c.set(tc).multiplyScalar(0.95+y*1.2); } else c.set(tc).multiplyScalar(0.8); },null,10));
  tparts.push(...moFolkTorsoExtras(F,p,rings),...(B?B.torso:[]));
  G.torso=moMerge(tparts);
  // a head, arms, legs; sides differ only in the thumb and the mirrored gear
  G.head=moMerge([...moFolkHead(F,p,skinF),...(B?B.head:[])]);
  const armP=[[0,0.056],[0.15,0.06],[0.4,0.05],[0.8,0.042],[1,0.038]], foreP=[[0,0.042],[0.2,0.046],[0.55,0.038],[1,0.028]];
  const thP=[[0,0.095],[0.15,0.098],[0.5,0.078],[0.85,0.06],[1,0.054]], shP=[[0,0.056],[0.15,0.062],[0.35,0.06],[0.6,0.046],[0.85,0.036],[1,0.036]];
  const sleeve=top==='jacket'||top==='plate'||top==='hoodie';
  const uaFur=fur?moFurLimb(F.arm[0],0.07*ar,0.045*ar,4,8,fur):[];
  G.ua=moMerge([moLimb(armP.map(([t,r])=>[t,r*ar]),F.arm[0],1,1.02,(x,y,z,c)=>{ if(fur) furP(x,y,z,c); else if(sleeve&&y>-F.arm[0]*0.55) c.set(tc).multiplyScalar(top==='plate'?1:0.85); else skinF(x,y,z,c); },moQ(9)),...uaFur]);
  const faFur=fur?moFurLimb(F.arm[1],0.05*ar,0.035*ar,3,8,fur):[], faSides=[-1,1].map(sd=>moMerge([...faFur,moLimb(foreP.map(([t,r])=>[t,r*ar]),F.arm[1],1.1,0.9,(x,y,z,c)=>{ if(p.form==='undead'&&y>-F.arm[1]*0.6&&top==='plate') c.set(tc).multiplyScalar(0.9); else skinF(x,y,z,c); },moQ(9)),
    ...moHand(ar*(p.form==='goblin'?1.1:1),skinF,p.form==='kappa'?3:(p.form==='yeti'||p.form==='troll'||p.form==='oni')?4:3,(p.form==='goblin'||p.form==='oni'||p.form==='yeti'||p.form==='troll'||p.form==='kappa')?0xd8cfa8:undefined,sd).map(g=>g.translate(0,-F.arm[1],0)),...(B?B.fa[sd]:[])]));
  G.faL=faSides[0]; G.faR=faSides[1];
  const legSk=(x,y,z,c,leg)=>{ if(fur) furP(x,y,z,c); else if(bot==='trousers') c.set(bc).multiplyScalar(0.9+0.2*moNoise(x,y,z,12)); else if(bot==='shorts'&&leg==='th'&&y>-F.leg[0]*0.45) c.set(bc).multiplyScalar(0.9+0.2*moNoise(x,y,z,12)); else skinF(x,y,z,c); };
  G.th=moMerge([moLimb(thP.map(([t,r])=>[t,r*lr]),F.leg[0],1,1.05,(x,y,z,c)=>legSk(x,y,z,c,'th'),moQ(9)),...(fur?moFurLimb(F.leg[0],0.1*lr,0.065*lr,3,9,fur):[])]);
  const boot=p.form==='viking'||p.form==='undead'||(top==='jacket'&&p.form==='goblin'), boc=0x2b2420;
  G.sn=moMerge([...(fur?moFurLimb(F.leg[1],0.07*lr,0.045*lr,3,8,fur):[]),moLimb(shP.map(([t,r])=>[t,r*lr]),F.leg[1],0.95,1.05,(x,y,z,c)=>legSk(x,y,z,c,'sn'),moQ(9)),
    ...moFoot(0.05*lr+0.02,0.17,F.foot,skinF,3,p.form==='goblin'||p.form==='oni'||p.form==='troll'||p.form==='yeti'||p.form==='kappa'?0xd8cfa8:undefined,boot,boc).map(g=>g.translate(0,-F.leg[1],0))]);
  G.weapon=moFolkWeapon(F,p);
  G.extras=moFolkExtras(F,p);
  return G;
}
function folkBuild(d,G,M,g,P0){
  const F=G.F, nd=(name,x,y,z,par)=>{ const o=new THREE.Group(); o.name=name; o.position.set(x,y,z); par.add(o); return o; };
  const root=nd('root',0,0,0,g), hips=nd('hips',0,F.hipY,0,root), spine=nd('spine',0,0,0,hips), tilt=nd('tilt',0,0,0,spine); tilt.rotation.x=-F.hunch;
  tilt.add(M(G.torso));
  const head=nd('head',0,F.headY,F.headZ,tilt), ht=nd('headTilt',0,0,0,head); ht.rotation.x=F.hunch*0.85; ht.add(M(G.head));
  const R={root,hips,spine,head,hipY:F.hipY};
  for(const sd of [-1,1]){
    const n=sd<0?'L':'R', sh=nd('sh'+n,sd*F.shX,F.shY,F.shZ,tilt), el=nd('el'+n,0,-F.arm[0],0,sh), hp=nd('hip'+n,sd*F.hipX,0,0,hips), kn=nd('knee'+n,0,-F.leg[0],0,hp);
    sh.rotation.z=sd*0.08; sh.add(M(G.ua)); el.add(M(sd<0?G.faL:G.faR)); hp.add(M(G.th)); kn.add(M(G.sn));
    R['sh'+n]=sh; R['el'+n]=el; R['hip'+n]=hp; R['knee'+n]=kn;
  }
  if(G.weapon){ const w=M(G.weapon); R.elR.add(w); }
  if(G.extras) for(const [where,geo] of G.extras) (where==='back'?tilt:where==='head'?head:hips).add(M(geo));
  P0.rig=R;
}
function folkAnim(m,dt,sp){
  m.ph+=Math.sqrt(sp)*dt*3.3;
  poseRig(m.parts.rig,dt,{sp,ph:m.ph,act:m.act,seed:m.s*10});
}
MODELS.goblin={geo:folkGeo,build:folkBuild,anim:folkAnim};
