//@ Morrow's outfit (the hedge-witch of the Mushroom Hollow): a tall bent-tipped pointed hat with a plum band and tucked herbs, a loose dark plait with a grey streak, a tired sharp face, a lichen-green bodice under a patched mantle with a pouch belt, a layered ragged skirt, laced boots, and the herb-sickle weapon dressing
/* ---------- Morrow: healer, nature. Design: docs/skillkits/looks/morrow.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: lichen 0x6b7a5c, ink 0x2a2a34, plum 0x5a3a52, ember 0xc9763a, bone 0xe0d8c0, brass 0xb09040. Silhouette: a tall hat bent back at the tip over a narrow figure, a mantle with a ragged hem, a skirt in layers, a belt hung with pouches and herbs.
   Every part has at least two colours (lichen and ink at the least); the emblem is a hanging bundle of herbs, never a broom or a cauldron. A playable character AND the story's witch (docs/WILDWOOD-STORY.md). */
CHAR_MODELS.morrow={id:'morrow',name:'Morrow',signature:true, hairGrad:{mode:'streak',c2:0xcfcfd4}, items:{hat:'Bent witch hat',hair:'Grey-streak plait',face:'Sharp & tired',top:'Patched mantle',bottom:'Layered skirt',shoes:'Laced boots',weapon:'Herb sickle'},sexes:['female'],
  note:'The hedge-witch: tall, thin and sharp-boned, built for a long, wiry woman.',
  ranges:{height:[0.98,1.08],build:[0.88,1.02],chest:[0.6,1.1],waist:[0.82,1.02],hips:[0.88,1.1],legs:[0.98,1.14],neck:[0.95,1.2],arms:[0.9,1.1],head:[0.95,1.08],hairLength:[0.9,1.35],hairVolume:[0.9,1.2]},
  setups:[{id:'morrow',name:'Morrow',sex:'female',def:true,note:'The hedge-witch as drawn: tall, wiry and a little stooped.',v:{height:1.04,build:0.92,chest:0.8,shoulders:0.98,waist:0.9,torso:1.0,legs:1.06,thighs:0.92,arms:1.0,neck:1.08,hands:1.1,feet:1.0,jaw:0.94,chin:1.04,cheeks:0.86,noseSize:1.12,mouthSize:0.92,smile:0.12,hairLength:1.2,hairVolume:1.05}}]};

OUTFITS.morrow=(function(){
  const LICHEN=0x6b7a5c, LICHEN_D=0x4a5642, INK=0x2a2a34, PLUM=0x5a3a52, EMBER=0xc9763a, BONE=0xe0d8c0, BRASS=0xb09040, MOSS=0x8fa66a, HAIR=0x2c2630;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a lichen bodice laced with bone cord, ink sleeves with an ember patch, bare lower arms, ink leggings and laced dark boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(LICHEN); if(fr(y*22+x*5)<0.08) c.set(LICHEN_D); if(Math.abs(x)<0.014&&z<0&&fr(y*34)<0.5) c.set(BONE); if(y>0.545) c.set(INK); return; }
        case 'upperArm': { const t=-y/D.upper; c.set(INK); if(t>0.4&&t<0.62&&sd>0&&Math.abs(Math.atan2(z,x*sd))<0.9) c.set(EMBER); return; }
        case 'foreArm': { if(y<-0.2) skinPaint(c); else if(y<-0.15) c.set(BONE); else c.set(INK); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(INK); if(fr(t*7+x*2)<0.06) c.set(PLUM); return; }
        case 'shin': { const t=-y/D.shin; c.set(INK); if(t>0.2&&t<0.7&&Math.abs(x*sd)<0.012&&z<0&&fr(t*14)<0.5) c.set(BONE); if(t<0.1) c.set(PLUM); return; }
        case 'foot': { c.set(INK); if(y<-D.ankleH+0.012) c.set(0x15131a); else if(z<-0.09) c.set(PLUM); return; }
      }
      c.set(LICHEN); };

    /* ---- the hat: a tall cone bent back at the tip, a wide drooping brim, a plum band with a brass buckle, a sprig of herbs tucked under the band ---- */
    const hat=F=>{ const out=[], rings=[];
      for(let i=0;i<=8;i++){ const t=i/8; rings.push({y:lerp(0.31,0.06,t),rx:lerp(0.004,0.118,Math.pow(t,0.85)),rz:lerp(0.004,0.122,Math.pow(t,0.85)),zc:0.006+0.1*Math.pow(1-t,2.2)}); }
      rings.push({y:0.052,rx:0.17,rz:0.175,zc:0.006},{y:0.04,rx:0.225,rz:0.23,zc:0.006});
      out.push(pc(ofLoft(rings,sg(36),0,TAU),(x,y,z,c)=>{ c.set(INK); const a=Math.atan2(x,z); if(fr(a*2/TAU*3+y*9)<0.05) c.set(LICHEN_D); if(y>0.2&&fr(y*40+a)<0.07) c.set(PLUM); if(y<0.044) c.multiplyScalar(0.85); }));
      out.push(solid(ofRingAt([0,0.083,0.006],[0,1,0],0.119,0.0085,sg(6)),PLUM));
      out.push(solid(vbox(0.03,0.026,0.008,0,0.083,-0.12),BRASS),solid(vbox(0.016,0.014,0.01,0,0.083,-0.122),INK));
      for(const [dx,rot] of [[0.05,0.5],[0.075,0.9],[0.095,1.3]]) out.push(solid(csph(1,sg(7),sg(5)).scale(0.006,0.024,0.004).rotateZ(-rot).translate(-dx,0.1,-0.118),MOSS));
      out.push(solid(csph(0.012,sg(7),sg(5)).translate(-0.108,0.11,-0.117),EMBER));
      return out; };

    /* ---- the hair: a part in the middle, a long loose fall with a plait over one shoulder tied with an ember cord ---- */
    const plait=(F,T)=>{ T.crown(0.112,0.45,0.22); T.fringe(7,0.7,0.1); T.sideLocks(0.05*T.hl); T.backLocks(sg(14),0,13);
      const P=[]; for(let i=0;i<=8;i++){ const t=i/8; P.push([0.07,-0.04-0.3*T.hl*t,-0.07-0.02*Math.sin(t*3)]); }
      const out=[]; T.add(sweepTube(P,[0.024,0.026,0.024,0.021,0.016,0.011,0.003],sg(8),{cap:'point',rings:sg(22)}),(x,y,z,c)=>{ T.hp(x,y,z,c); });
      out.push(solid(ofRingAt(P[6],[0,-1,0],0.02,0.005,sg(6)),EMBER));
      return out; };

    /* ---- the mantle: a short shoulder cape of patches over the bodice, with a ragged hem and a bone clasp ---- */
    const mantle=()=>{ const out=oxMantle(X,D,{cols:[LICHEN_D,LICHEN,0x7c8a66],drop:0.34,out:0.07,trim:EMBER,trimR:0.008}); const s=torsoSize(X,D,0.52); out.push(solid(csph(0.014,sg(8),sg(6)).translate(0,0.52*TK,-(s.rz+0.05)),BONE)); return out; };

    /* ---- the belt: an ink band with a brass buckle, three little pouches and a bundle of dried herbs hung by a cord ---- */
    const belt=()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.01, out=[];
      out.push(pc(ofLoft([{y:0.07*TK,rx:s.rx+0.01,rz},{y:0.066*TK,rx:s.rx+0.014,rz:rz+0.004},{y:-0.004,rx:s.rx+0.012,rz:rz+0.004},{y:-0.008,rx:s.rx+0.01,rz}],sg(36),0,TAU),(x,y,z,c)=>{ c.set(INK); if(y>0.066*TK-0.007) c.set(PLUM); }));
      out.push(solid(vbox(0.034,0.03,0.008,0,0.03,-rz-0.008),BRASS));
      for(const [dx,col] of [[-0.09,PLUM],[0.07,LICHEN_D],[0.12,PLUM]]) out.push(pc(vbox(0.04,0.045,0.03,D.hx*Math.sign(dx)*0.7+dx*0.4,-0.035,-rz-0.012),(x,y,z,c)=>{ c.set(col); if(y>-0.025) c.set(INK); }));
      const hx=-D.hx-0.09; out.push(solid(sweepTube([[hx,0.02,-rz+0.01],[hx,-0.06,-rz+0.012]],[0.003,0.003],4,{cap:'round',rings:4}),BONE));
      for(const [dx,len,col] of [[-0.012,0.1,MOSS],[0,0.12,LICHEN],[0.012,0.09,EMBER]]) out.push(solid(sweepTube([[hx+dx,-0.06,-rz+0.012],[hx+dx*2,-0.06-len*0.5,-rz+0.016],[hx+dx*3,-0.06-len,-rz+0.012]],[0.007,0.009,0.003],5,{cap:'point',rings:8}),col));
      return out; };

    return {
      aura:{col:0x8fa66a,col2:0xe6efc8,style:'rise',ring:false,n:7,shape:'leaf',deco:'none'},
      main:{top:0x6b7a5c,bottom:0x2a2a34,shoes:0x2a2a34,hat:0x2a2a34}, bootTop:0.05, shinCut:0, boot:true, skinFrom:0.545, hairColor:HAIR, eyeColor:0xc89a30,
      eyes:{iris:1.0,hl:1,tilt:0.18,lash:0.6,h:0.8,browLift:0.003,browThick:1.1},
      cuts:{torso:[0.545],upperArm:[],foreArm:[0.15/D.fore,0.2/D.fore],thigh:[],shin:[0.1,0.2]},
      paint,
      head:F=>hat(F),
      hair:(F,T)=>plait(F,T),
      mark:F=>{ const out=[]; for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.026,0.005,0.0009).rotateZ(sd*0.3),sd*0.05,-0.033,0.0008),0x6a5a66)); out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.006,0.03,0.0009).rotateZ(0.18),-0.03,-0.07,0.0008),0xb89090)); return out; },
      torso:()=>mantle(),
      hips:()=>belt(),
      shoulder:sd=>[solid(ofRingAt([0,-0.05,0],[0,1,0],0.05*aw+0.002,0.006,sg(6)),sd>0?EMBER:BONE)],
      forearm:sd=>[solid(ofRingAt([0,-0.15,0],[0,1,0],0.0285*aw+0.002,0.004,sg(6)),BONE)],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.08,0],[0,1,0],0.056*D.cw+0.002,0.004,sg(6)),PLUM),solid(ofRingAt([0,-D.shin*0.7,0],[0,1,0],0.044*D.cw+0.002,0.003,sg(6)),BONE));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.05,0,-D.shin-D.ankleH+0.006,0.05),0x15131a)); return out; },
      dress:{ shape:{sword:'herbknife',bow:'branch',staff:'herbbundle'}, grip:BONE, metal:0xb4b8b0, wood:0x4a3a2e, accent:MOSS,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(MOSS),0.8); if(part==='grip'&&((u/0.012)%1+1)%1<0.35) c.lerp(ofCol(PLUM),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a little bundle of dried herbs tied with an ember thread, a moon-pale seed
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),BONE));
          for(const [dx,col] of [[-0.007,MOSS],[0,LICHEN],[0.007,EMBER]]) lit.push(solid(sweepTube([[dx*0.3,-0.022,0.004],[dx,-0.05,0.004],[dx*1.6,-0.075,0.004]],[0.005,0.0065,0.0015],5,{cap:'point',rings:6}),col));
          lit.push(solid(ofRingAt([0,-0.03,0.004],[0,1,0],0.0075,0.0017,6),EMBER));
          glow.push(pc(csph(0.0038,6,5).translate(0,-0.06,0.015),(x,y,z,c)=>c.set(0xd8f0b0)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.morrow=oxPlus(OUTFITS.morrow,(X,D)=>({   // round 2: a ragged layered skirt (ink over lichen), a bone-bead string, a stained shoulder cloak
  hips:()=>oxSkirt(X,D,{col:0x2a2a34,col2:0x5a3a52,len:0.36,flare:0.55}).concat(oxSkirt(X,D,{col:0x6b7a5c,col2:0x4a5642,len:0.24,flare:0.4,rise:0.04})),
  torso:()=>oxBeads(X,D,{col:0xe0d8c0,col2:0xc9763a,n:12,r:0.016,drop:0.25}),
  cos:{cape:{col:0x3a3a2e,trim:0xc9763a,len:0.7,pat:'ash',mantle:0}}}));
oxTune('morrow',{jaw:0.94,chin:1.04,cheeks:0.86,brow:0.45,eyeSize:1.0,noseSize:1.12,lips:0.8,undertone:0.3,blush:0.2,earSize:1.1,smile:0.12});
OUTFITS.morrow=oxPlus(OUTFITS.morrow,(X,D)=>({   // face round 1: bags under tired eyes, a thin scar through one brow, a bone pin and a sprig behind the ear
  mark:F=>oxMarks(F,[{t:'bags',col:0x6a5a66},{t:'scar',side:-1,col:0xb89090}]),
  hair:()=>oxHairBits(X,[{t:'pin',side:-1,col:0xe0d8c0,col2:0xc9763a},{t:'sprig',side:1,col:0x8fa66a,col2:0xc9763a}]),
  kit:{eyeColor:0xc89a30,eyes:{iris:1.05,lash:0.4}}}));
OUTFITS.morrow=oxPlus(OUTFITS.morrow,(X,D)=>({   // round 3: a basket of cuttings on the back
  torso:()=>oxPack(X,D,{col:0x4a3a2e,trim:0xb09040,w:0.1,h:0.1})}));
