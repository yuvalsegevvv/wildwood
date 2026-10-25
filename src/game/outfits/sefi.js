//@ Sefi's outfit (a cheetah-kin plains courier): small black-backed ears, a long ringed-and-spotted tail and a short snout with black tear lines of her own, a sky headband with streaming tails, a high wind-swept ponytail, swept sky eyeliner, a gold crop top with a crossed sash and a message tube, a wrap skirt, wrapped calves and thong sandals, and the running-knife weapon dressing
/* ---------- Sefi: risk DPS, air. Design: docs/skillkits/looks/sefi.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: sand gold 0xe0b040, dark leather 0x3a2a1a, sky 0xbfe6ff, deep sky 0x5aa0d0, cream 0xf2e6c8, brass 0xc9a24a. Silhouette: the slimmest, longest figure of the Kin: bare midriff and legs, a streaming ponytail and headband tails, a tube across the back, a tail as long as the legs.
   Every part has at least two colours (gold and sky at the least); the emblem is a feather and a wind line, never a winged shoe.
   KIN: her ears, tail and muzzle (the tear lines are drawn in the muzzle) are set parts (shared/kin.js kinDefineSet; helpers of character/model-kin.js); CHAR_MODELS.sefi.kin writes them, and her fur, when the whole set is worn (ofWear). */
kinDefineSet({slot:'e',id:'sefi',name:'Cheetah Ears',text:'Small round ears with a black back and a white inside. Part of the Long Run outfit.',set:'sefi'});
kinDefineSet({slot:'k',id:'sefi',name:'Cheetah Tail',text:'A tail as long as the legs, spotted, ringed in black near the tip and ending in white. Part of the Long Run outfit.',set:'sefi'});
kinDefineSet({slot:'m',id:'sefi',name:'Cheetah Muzzle',text:'A short fine snout with a black nose and the two black tear lines from the eyes. Part of the Long Run outfit.',set:'sefi'});
KIN_HAT_EARS.sefi='poke';   // (the headband sits behind them)
kinEar('sefi',0.74,0.42,0.1,K=>{ const dk=kinAcc(K,0x15100c);
  return [pc(csph(1,K.sg(7),K.sg(5)).scale(0.027,0.034,0.01).translate(0,0.03,0),(x,y,z,c)=>{ c.copy(K.fur); if(y>0.056||Math.hypot(x/0.027,(y-0.03)/0.034)>0.8) c.copy(dk); }),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.015,0.022,0.005).translate(0,0.028,-0.007),new THREE.Color(0xf2e8d8))]; });
KIN_TAILS.sefi=K=>{ const dark=kinAcc(K,0x2a1c14); return [kinTube(K,[[0,0,0],[0,-0.05,0.12],[0,-0.05,0.26],[0,0.0,0.38],[0,0.1,0.44]],[0.014,0.017,0.017,0.014,0.007],(c,s,x,y,z)=>{
  const q=0.03, i=Math.floor(x/q), j=Math.floor(y/q), k=Math.floor(z/q);
  if(s>0.52) c.copy(K.light); else if(s>0.36&&Math.floor(s*34)%2===0) c.copy(dark); else if(s<0.36&&h3(i,j,k)<0.45&&Math.hypot(x-(i+0.5)*q,y-(j+0.5)*q,z-(k+0.5)*q)<0.011) c.copy(dark); })]; };
KIN_MUZZLES.sefi=K=>{ const z=kinFace(K,0,-0.045), dk=new THREE.Color(0x15100c), out=[];
  out.push(pc(csph(1,K.sg(7),K.sg(5)).scale(0.026,0.022,0.032).translate(0,-0.046,z-0.012),(x,y,z2,c)=>{ c.copy(K.fur); if(y<-0.058) c.copy(K.light); }));
  out.push(kinS(csph(1,K.sg(5),K.sg(4)).scale(0.009,0.0065,0.007).translate(0,-0.036,z-0.042),dk));
  out.push(kinS(sweepTube([[0,-0.05,z-0.04],[0,-0.062,z-0.024],[0,-0.064,z-0.006]],[0.0011,0.0011,0.0011],3,{cap:'round',rings:3}),dk));
  for(const sd of [-1,1]){ const p=[[0.03,-0.012],[0.037,-0.036],[0.032,-0.06]].map(([x,y])=>[sd*x,y,kinFace(K,sd*x,y)-0.004]);
    out.push(kinS(sweepTube(p,[0.0032,0.003,0.0014],4,{cap:'point',rings:5}),dk)); }
  return out; };

CHAR_MODELS.sefi={id:'sefi',name:'Sefi',signature:true, kin:{ears:'sefi',tail:'sefi',muzzle:'sefi',fur:0xe0a830,fur2:0x2a1c14,mark:'spots'}, hairGrad:{mode:'tips',c2:0x5aa0d0}, items:{glove:'Wrapped hands',hat:'Wind headband',hair:'Wind ponytail',face:'Sky liner',top:'Courier\'s crop & sash',bottom:'Wrap skirt',shoes:'Wrapped sandals',weapon:'Runner rig'},sexes:['female'],
  note:'The courier: tall, lean and long in the leg, built for a woman who runs.',
  ranges:{height:[1.0,1.08],build:[0.88,1.0],chest:[0.6,1.0],waist:[0.82,1.0],hips:[0.85,1.05],legs:[1.06,1.14],neck:[1.0,1.2],arms:[0.9,1.1],head:[0.92,1.05],hairLength:[1.1,1.35],hairVolume:[0.9,1.1]},
  setups:[{id:'sefi',name:'Sefi',sex:'female',def:true,note:'The courier as drawn: tall, light-boned and all leg.',v:{height:1.06,build:0.88,chest:0.8,shoulders:0.94,waist:0.86,torso:0.96,legs:1.14,thighs:0.9,arms:1.04,neck:1.1,hands:0.92,feet:1.1,jaw:0.85,chin:0.85,cheeks:0.85,noseSize:0.85,mouthSize:0.9,smile:0.5,hairLength:1.25,hairVolume:1.0}}]};

OUTFITS.sefi=(function(){
  const GOLD=0xe0b040, DARK=0x3a2a1a, SKY=0xbfe6ff, SKY_D=0x5aa0d0, CREAM=0xf2e6c8, BRASS=0xc9a24a, HAIR=0x6a4a28, TIP=0xf0d8a0;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a gold crop top with a dark hem and a sky neck scarf, a bare midriff, wrist wraps, gold wrap skirt stripes on the thigh, calf wraps in cream and dark, thong sandals ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { if(y>0.5){ c.set(SKY); return; } if(y>0.2){ c.set(GOLD); if(y<0.228) c.set(DARK); return; } skinPaint(c); if(y<0.06) c.set(GOLD); if(y>0.03&&y<0.06) c.set(DARK); return; }
        case 'upperArm': skinPaint(c); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.12) { c.set(CREAM); if(fr(y*60)<0.3) c.set(DARK); } else skinPaint(c); return; }
        case 'thigh': { const t=-y/D.thigh; if(t<0.14){ c.set(GOLD); if(Math.abs(Math.atan2(z,x*sd))<0.14) c.set(DARK); } else skinPaint(c); return; }
        case 'shin': { const t=-y/D.shin; if(t<0.4) skinPaint(c); else { c.set(CREAM); if(fr(t*16+Math.atan2(z,x*sd)*0.5)<0.28) c.set(DARK); } return; }
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.012) c.set(DARK); else if(fr(z*14)<0.18&&z<0.02&&z>-0.12) c.set(DARK); return; }
      }
      c.set(GOLD); };

    /* ---- the headband: a sky band over the brow with a gold stripe, a knot on one side and two long tails streaming back ---- */
    const band=F=>{ const out=[];
      out.push(solid(ofRingAt([0,0.05,0.008],[0,1,0],0.127,0.0095,sg(10)),SKY),solid(ofRingAt([0,0.05,0.008],[0,1,0],0.127,0.0045,sg(8)).translate(0,0.011,0),GOLD));
      out.push(solid(csph(0.02,sg(8),sg(6)).translate(-0.118,0.044,0.03),SKY_D));
      for(const [i,dz] of [[0,0.0],[1,0.03]]) out.push(pc(ofRibbon([[-0.12,0.044,0.034+dz],[-0.13,0.03,0.09+dz],[-0.15-0.01*i,0.0,0.17+dz],[-0.14,-0.04-0.02*i,0.26+dz]],u=>0.036*(1-0.25*u),{up:[0,1,0],seg:sg(12),th:0.004}),(x,y,z,c)=>{ c.set(SKY); if(z>0.2+dz) c.set(GOLD); }));
      return out; };

    /* ---- the hair: swept back from a high point, the fringe blown sideways, and one long ponytail streaming behind ---- */
    const pony=(F,T)=>{ T.crown(0.112,0.55,0.3); T.fringe(5,0.6,0.3); T.sideLocks(0.04); T.backLocks(sg(10),0,17);
      const P=[[0,0.085,0.075],[0,0.1,0.13],[0,0.07,0.21],[0,0.0,0.29],[0,-0.1,0.33],[0,-0.22,0.33]]; T.add(sweepTube(P,[0.03,0.034,0.03,0.024,0.016,0.003],sg(8),{cap:'point',rings:sg(26)}),(x,y,z,c)=>{ T.hp(x,y,z,c); if(y<-0.06) c.set(TIP); c.multiplyScalar(0.92+0.1*Math.sin(z*120)); });
      return [solid(ofRingAt(P[0],[0,0.3,1],0.034,0.0065,sg(6)),SKY_D)]; };

    /* ---- the face: a swept sky line from each eye corner and three spots on each cheek ---- */
    const face=F=>{ const out=[];
      for(const sd of [-1,1]){ out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.03,0.0042,0.0009).rotateZ(sd*0.35),sd*0.052,0.002,0.0008),SKY_D));
        for(const [x,y] of [[0.058,-0.03],[0.048,-0.038],[0.064,-0.042]]) out.push(solid(F.place(csph(0.0035,sg(6),sg(5)),sd*x,y,0.0008),DARK)); }
      return out; };

    /* ---- the sash: a sky sash from the right shoulder across the chest to the left hip, a brass clasp, and the courier's message tube across the back ---- */
    const sashPts=[[0.075,0.53],[0.04,0.42],[0.0,0.31],[-0.04,0.2],[-0.08,0.1]].map(([x,yd])=>[x,yd*TK,-(torsoSize(X,D,yd).rz+0.012)]);
    const sash=()=>{ const out=[pc(ofRibbon(sashPts,0.045,{up:[0,0,-1],seg:sg(14),th:0.006}),(x,y,z,c)=>{ c.set(SKY); if(Math.abs(fr(y*40)-0.5)<0.05) c.set(GOLD); })];
      out.push(solid(vbox(0.032,0.036,0.01,0.075,0.53*TK,sashPts[0][2]-0.004),BRASS)); return out.concat(oxTube(X,D,{col:DARK,cap:BRASS,strap:SKY_D})); };

    const GLV={start:0.14,col:CREAM,col2:DARK,trim:SKY_D,len:0.06,flare:0.01,fingers:'full'};
    return {
      main:{glove:CREAM,top:GOLD,bottom:GOLD,shoes:DARK,hat:SKY}, bootTop:0.4, shinCut:0, boot:true, skinFrom:0.5, hairColor:HAIR, eyeColor:0xcfc060,
      eyes:{iris:1.15,hl:2,tilt:0.3,lash:0.9,h:0.9,browLift:0.004,browThick:0.7,browAngle:0.15},
      cuts:{torso:[0.03,0.06,0.2,0.228,0.5],upperArm:[],foreArm:[0.12/D.fore,0.222/D.fore],thigh:[0.14],shin:[0.4]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:SKY,trim:GOLD,len:0.62,pat:'stars',mantle:0},aura:{col:SKY,col2:CREAM,style:'orbit',ring:false,n:8,shape:'wisp',deco:'none'}}),
      head:F=>band(F),
      hair:(F,T)=>pony(F,T),
      mark:F=>face(F),
      torso:()=>sash(),
      hips:()=>oxSkirt(X,D,{len:0.15,flare:0.55,col:GOLD,col2:DARK}),
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.4,0],[0,1,0],0.05*D.cw+0.003,0.0055,sg(6)),DARK));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),DARK)); return out; },
      dress:{ shape:{sword:'runnerblade',bow:'windbow',staff:'pennant'}, grip:DARK, metal:0xdfe8ee, wood:0x8a6a3a, accent:SKY_D, glow:SKY,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(SKY),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(GOLD),0.85); },
        charm:()=>{ const lit=[], glow=[];   // a small brass message tube and a sky feather on a cord
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),DARK));
          lit.push(solid(cyl(0.007,0.007,0.034,6).translate(0,-0.045,0.004),BRASS),solid(cyl(0.0085,0.0085,0.007,6).translate(0,-0.028,0.004),DARK));
          glow.push(pc(csph(1,6,5).scale(0.004,0.02,0.002).translate(0.012,-0.06,0.006).rotateZ(0.3),(x,y,z,c)=>c.set(SKY)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('sefi',{eyeSize:1.2,lips:0.9,undertone:0.1,blush:0.2,cheeks:0.85,smile:0.5,earSize:1.0});
OUTFITS.sefi=oxPlus(OUTFITS.sefi,(X,D)=>({   // silhouette: two long sky streamers from the hips, one on each side, longer than the skirt
  hips:()=>oxSash(X,D,{col:0xbfe6ff,col2:0xe0b040,len:1.5,side:1}).concat(oxSash(X,D,{col:0x5aa0d0,col2:0xf2e6c8,len:1.2,side:-1}))}));
