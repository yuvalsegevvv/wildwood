//@ Pell's outfit (a night-fisher): a wide conical reed hat with a cord, a tied-back crop and soot-smudged face, an oilskin jerkin with a draped net and a hip lantern, rolled waders and tall tarred boots, and the leister-and-torch weapon dressing
/* ---------- Pell: safe DPS, fire. Design: docs/skillkits/looks/pell.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: tar 0x2a2420, torch orange 0xe0762a, cream 0xe9dfc4, reed 0x8a7a44, rope 0x9a8a5c, brass 0xc89a3c. Silhouette: a wide cone hat over a narrow body, a net hanging from one shoulder, a lantern at the hip, tall dark boots.
   Every part has at least two colours (tar and cream at the least); the emblem is a hooked lantern pole, never a flame alone. */
CHAR_MODELS.pell={id:'pell',name:'Pell',signature:true, items:{hat:'Reed cone hat',hair:'Tied crop',face:'Soot & squint',top:'Oilskin & net',bottom:'Rolled waders',shoes:'Tarred boots',weapon:'Torch spear'},sexes:['male'],
  note:'The night-fisher: lean, patient and a little stooped, built for a long, narrow man.',
  ranges:{height:[0.96,1.08],build:[0.88,1.05],chest:[0.7,1.15],waist:[0.82,1.05],hips:[0.88,1.1],legs:[0.98,1.14],neck:[0.9,1.15],arms:[0.9,1.15],head:[0.95,1.08],hairLength:[0.8,1.2],hairVolume:[0.9,1.15]},
  setups:[{id:'pell',name:'Pell',sex:'male',def:true,note:'The night-fisher as drawn: lean, long-armed and squinting.',v:{height:1.03,build:0.94,chest:0.9,shoulders:0.98,waist:0.92,torso:1.0,legs:1.06,thighs:0.94,arms:1.08,neck:1.05,hands:1.08,feet:1.0,jaw:0.98,chin:1.0,cheeks:0.9,noseSize:1.08,mouthSize:0.95,smile:0.3,hairLength:1.0,hairVolume:1.0}}]};

OUTFITS.pell=(function(){
  const TAR=0x2a2420, TAR_L=0x4a3e34, TORCH=0xe0762a, CREAM=0xe9dfc4, CREAM_D=0xc8bc9a, REED=0x8a7a44, ROPE=0x9a8a5c, BRASS=0xc89a3c, STEEL=0xbfc4c8, HAIR=0x3a2c20;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a cream shirt under a tar oilskin vest, orange cuffs, cream waders rolled over tar boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(CREAM); const ax=Math.abs(x); if(y>0.03&&y<0.54&&ax>0.03) c.set(TAR); if(y>0.03&&y<0.54&&ax>0.03&&fr(y*40)<0.05) c.set(TAR_L); if(y>0.545) c.set(CREAM_D); return; }
        case 'upperArm': c.set(CREAM); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.17) c.set(TORCH); else c.set(CREAM); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(CREAM); if(t>0.9) c.set(TAR); else if(fr(t*9)<0.08) c.set(CREAM_D); return; }
        case 'shin': { const t=-y/D.shin; c.set(TAR); if(t<0.1) c.set(CREAM); else if(t<0.14) c.set(TORCH); else c.multiplyScalar(0.92+0.12*Math.max(0,-z*9)); return; }
        case 'foot': { c.set(TAR); if(y<-D.ankleH+0.012) c.set(0x15110f); else if(z<-0.09) c.set(TAR_L); return; }
      }
      c.set(CREAM); };

    /* ---- the hat: a wide reed cone (woven lines), a cord under the chin, a cream band and a torch-orange feather ---- */
    const hat=F=>{ const out=[], R=0.2, H=0.13, rings=[{y:0.12,rx:0.004,rz:0.004,zc:0.004}];
      for(let i=0;i<=8;i++){ const t=i/8; rings.push({y:lerp(0.115,0.035,t),rx:lerp(0.03,R,Math.pow(t,0.8)),rz:lerp(0.03,R*1.02,Math.pow(t,0.8)),zc:0.006}); }
      out.push(pc(ofLoft(rings,sg(36),0,TAU),(x,y,z,c)=>{ c.set(REED); const a=Math.atan2(x,z); if(fr(a*7/TAU*2+y*30)<0.14) c.set(ROPE); if(y<0.045) c.multiplyScalar(0.9); }));
      out.push(solid(ofRingAt([0,0.052,0.006],[0,1,0],0.118,0.006,sg(6)),CREAM));
      out.push(pc(ofRibbon([[0.1,0.06,0.04],[0.16,0.11,0.0],[0.18,0.19,-0.07],[0.14,0.25,-0.14]],u=>0.04*(1-0.5*u),{up:[0,1,0.4],seg:sg(10),th:0.003}),(x,y,z,c)=>{ c.set(TORCH); if(fr(y*30)<0.2) c.set(CREAM); }));
      for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.11,0.05,0.03],[sd*0.1,-0.04,0.07],[sd*0.05,-0.12,0.1]],[0.0025,0.0025,0.0025],4,{cap:'round',rings:6}),ROPE));
      return out; };

    /* ---- the hair: a dark crop with a short tail tied at the nape with an orange cord ---- */
    const tail=(F,T)=>{ T.crown(0.112,0.5,0.28); T.fringe(6,0.8,0.1); T.sideLocks(0.04); T.backLocks(sg(12),0,13);
      const P=[]; for(let i=0;i<=7;i++){ const t=i/7; P.push([0,-0.02-0.2*T.hl*t,0.1+0.02*Math.sin(t*2)]); }
      T.add(sweepTube(P,[0.022,0.024,0.02,0.015,0.003],sg(8),{cap:'point',rings:sg(20)}),(x,y,z,c)=>{ T.hp(x,y,z,c); });
      return [solid(ofRingAt(P[1],[0,-1,0.1],0.025,0.0045,sg(6)),TORCH)]; };

    /* ---- the net: a rope grid draped from the right shoulder across the chest to the left hip, with cork floats ---- */
    const net=()=>{ const out=[], P=[], Q=[]; for(let i=0;i<=8;i++){ const f=i/8, yd=lerp(0.52,0.04,f), s=torsoSize(X,D,yd), x=lerp(0.11,-0.13,f)*D.B; P.push([x,yd*TK,-(s.rz+0.016)]); Q.push([x*0.9,yd*TK,s.rzBack+0.016]); }
      out.push(pc(ofRibbon(P,0.07,{up:[0,0,-1],seg:sg(18),th:0.003}),(x,y,z,c)=>{ c.set(ROPE); const a=fr(y*60+x*40), b=fr(y*60-x*40); if(a>0.15&&b>0.15) c.set(CREAM_D); }));
      out.push(pc(ofRibbon(Q,0.05,{up:[0,0,1],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(ROPE); }));
      for(const i of [2,4,6]) out.push(solid(csph(0.012,sg(7),sg(6)).translate(P[i][0],P[i][1],P[i][2]-0.01),i===4?TORCH:CREAM));
      return out; };
    const lantern=()=>[solid(cyl(0.026,0.022,0.05,sg(8)).translate(0,0,0),BRASS),pc(cyl(0.02,0.02,0.04,sg(8)).translate(0,0.002,0),(x,y,z,c)=>c.set(0xffd9a0)),solid(cyl(0.01,0.026,0.012,sg(8)).translate(0,0.03,0),BRASS),solid(sweepTube([[0,0.034,0],[0.012,0.05,0],[0.03,0.05,0]],[0.0018,0.0018,0.0018],4,{cap:'round',rings:4}),TAR)];

    return {
      aura:{col:0x6ab0d8,col2:0xcfeaf5,style:'fall',ring:false,n:7,shape:'drop',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x2a2420,bottom:0xe9dfc4,shoes:0x2a2420,hat:0x8a7a44}, bootTop:0.04, shinCut:0, boot:true, skinFrom:0.545, hairColor:HAIR, eyeColor:0x8a5a28,
      eyes:{iris:0.9,hl:1,tilt:-0.1,lash:0.5,h:0.7,browLift:-0.002,browThick:1.15},
      cuts:{torso:[0.03,0.545],upperArm:[],foreArm:[0.17/D.fore,0.222/D.fore],thigh:[0.9],shin:[0.04,0.1,0.14]},
      paint,
      head:F=>hat(F),
      hair:(F,T)=>tail(F,T),
      mark:F=>{ const out=[]; for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.026,0.005,0.0009).rotateZ(sd*0.35),sd*0.052,-0.034,0.0008),0x2a2018)); out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.04,0.006,0.0009),0.0,-0.075,0.0008),0x3a3028)); return out; },
      torso:()=>net(),
      shoulder:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-0.045,0],[0,1,0],0.05*aw+0.002,0.007,sg(6)),sd>0?TORCH:ROPE)); return out; },
      forearm:sd=>[solid(ofRingAt([0,-0.17,0],[0,1,0],0.0285*aw+0.002,0.0035,sg(6)),ROPE)],
      hips:()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.01, out=[];
        out.push(pc(ofLoft([{y:0.07*TK,rx:s.rx+0.01,rz},{y:0.065*TK,rx:s.rx+0.014,rz:rz+0.004},{y:-0.005,rx:s.rx+0.012,rz:rz+0.004},{y:-0.01,rx:s.rx+0.01,rz}],sg(36),0,TAU),(x,y,z,c)=>{ c.set(TAR); if(y>0.065*TK-0.008) c.set(ROPE); }));
        const L=lantern(); for(const g of L) out.push(g.translate(D.hx+0.1,-0.05,-rz+0.02)); return out; },
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.07,0],[0,1,0],0.056*D.cw+0.002,0.0045,sg(6)),TORCH),solid(ofRingAt([0,-D.shin*0.5,0],[0,1,0],0.044*D.cw+0.002,0.003,sg(6)),TAR_L));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),0x15110f)); return out; },
      dress:{ shape:{sword:'leister',bow:'reedbow',staff:'torchpole'}, grip:ROPE, metal:STEEL, wood:0x4a3a28, accent:TORCH,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.13) c.lerp(ofCol(TORCH),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.35) c.lerp(ofCol(CREAM),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a fish hook and a cork float on a cord, with a spark of torch light
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.025,0.004]],[0.0014,0.0014],4,{cap:'round',rings:4}),ROPE));
          lit.push(pc(csph(0.013,sg(9),sg(7)).scale(1,1.3,1).translate(0,-0.042,0.005),(x,y,z,c)=>{ c.set(CREAM); if(y>-0.04) c.set(TORCH); }));
          lit.push(solid(sweepTube([[0.012,-0.06,0.004],[0.012,-0.085,0.004],[0.002,-0.095,0.004],[-0.004,-0.083,0.004]],[0.0013,0.0013,0.0013,0.0013],4,{cap:'round',rings:6}),STEEL));
          glow.push(pc(csph(0.0042,6,5).translate(0,-0.058,0.02),(x,y,z,c)=>c.set(0xffb45a)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // round 4: a long oilskin cloak with wave stitching over the net, a rope coil, a knotted rag sash
  torso:()=>oxCoil(X,D,{col:0x8a7a44,col2:0x2a2420,dir:-1}),
  hips:()=>oxSash(X,D,{col:0xb8a258,col2:0x2a2420,len:1.0,side:1}),
  cos:{cape:{col:0x3f5a52,trim:0xd8c070,len:0.85,pat:'waves',mantle:0}}}));
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // round 5: a woven creel on the back with a rope strap
  torso:()=>oxPack(X,D,{col:0x8a7a44,trim:0x2a2420,w:0.1,h:0.11})}));
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // round 6: a yellow oilskin scarf, two silver fish hanging at the belt
  torso:()=>oxScarf(X,D,{col:0xe0b030,col2:0x2a2420,len:0.7}),
  hips:()=>oxFish(X,D,{col:0xb8c4cc,fin:0x5a6a74,side:-1})}));
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // round 3: a string of green glass net-floats across the chest, an oilskin plate on the right shoulder
  torso:()=>oxBeads(X,D,{col:0x7fd6c8,col2:0xe0b030,n:14,r:0.021,drop:0.3}),
  shoulder:sd=>sd>0?oxPauldron(X,D,{col:0x3f5a52,trim:0xd8c070,r:0.068}):[]}));
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // round 4: a yellow oilskin apron, a harpoon rod across the back
  torso:()=>oxTube(X,D,{col:0x5a4632,cap:0xc9ccd4,strap:0x2a2420}),
  hips:()=>oxApron(X,D,{col:0xb8a258,trim:0x2a2420,len:0.3,w:0.2})}));
oxTune('pell',{jaw:1.0,chin:1.05,cheeks:0.88,brow:0.2,eyeSize:0.95,noseSize:1.12,lips:0.8,undertone:0.4,blush:0.5,earSize:1.15,smile:0.1});
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // face round 1: wind-reddened cheeks and nose, salt crow's feet, grey-blue sea eyes, a hook ring in the ear
  mark:F=>oxMarks(F,[{t:'crow',col:0x8a6a50},{t:'cheek',col:0xd08878}]),
  hair:()=>oxHairBits(X,[{t:'ring',side:-1,col:0xc9ccd4}]),
  kit:{eyeColor:0x4a90a8,eyes:{iris:1.0,lash:0.3}}}));
oxTune('pell',{jaw:1.12,chin:1.15,cheeks:0.8,brow:0.5,eyeTilt:-0.2,lips:0.7,smile:0.0});
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // face round 2: a weathered, hollow-cheeked old fisher with tired eyes and salt-grey streaks in the hair
  mark:F=>oxMarks(F,[{t:'bags',col:0x7a6a5a}])}));
Object.assign(CHAR_MODELS.pell,{hairGrad:{mode:'streak',c2:0xcfd8dc}});
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // face round 3: a gull feather tucked behind the ear
  hair:()=>oxHairBits(X,[{t:'feather',side:1,col:0xdfe4e8,col2:0x4a5560}])}));
oxTune('pell',{height:0.93,build:1.12,chest:1.15,shoulders:1.0,waist:1.12,torso:0.96,legs:0.92,thighs:0.95,arms:1.2,neck:0.88,head:1.05,hands:1.18,feet:1.15});
Object.assign(CHAR_MODELS.pell.setups[0],{note:'The night-fisher as drawn: short, barrel-chested and long in the arm, a little stooped.'});
OUTFITS.pell=oxPlus(OUTFITS.pell,(X,D)=>({   // uniqueness round 2: a squat barrel-chested old hand under a rope casting net draped over the right shoulder
  torso:()=>oxNet(X,D,{col:0xb89a62,side:-1,rows:6,cols:8})}));
