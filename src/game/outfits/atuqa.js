//@ Atuqa's outfit (a highland terrace-keeper): a woven red ear-flap cap with gold and indigo bands and tassels, two long braids tied with gold thread, calm gold cheek stripes and steady eyes, a red woven tunic with a gold chest band and hem, a knotted-cord quipu at the belt, indigo-and-cream wool leggings, wool-wrapped calves over leather sandals, and the sling-and-stone weapon dressing
/* ---------- Atuqa: tank, light. Design: docs/skillkits/looks/atuqa.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: woven red 0xb83a2a, gold thread 0xe8c860, terrace stone 0x8e887a, wool cream 0xe8dcc0, indigo 0x2a3a6a, sun pale 0xfff0b0. Silhouette: the broadest, steadiest figure of the isles: a pointed cap with flaps, a square tunic to the thigh,
   a short stack of woven bands at the hem and a fall of knotted cords at the hip. Every part has at least two colours (red and gold at the least); the emblem is a stepped terrace, never a llama or a sun face. */
CHAR_MODELS.atuqa={id:'atuqa',name:'Atuqa',signature:true, hairGrad:{mode:'streaks',c2:0xe8c860}, items:{hat:'Woven flap cap',hair:'Twin braids',face:'Sun stripes',top:'Woven tunic & quipu',bottom:'Wool leggings',shoes:'Wrapped sandals',weapon:'Sling rig'},sexes:['male'],
  note:'The terrace-keeper: broad, deep-chested and square, built for a man who holds a wall.',
  ranges:{height:[0.95,1.05],build:[1.0,1.18],chest:[0.9,1.4],waist:[0.9,1.15],hips:[0.9,1.15],legs:[0.92,1.06],neck:[0.95,1.15],arms:[1.0,1.25],head:[0.95,1.1],hairLength:[0.9,1.3],hairVolume:[0.95,1.25]},
  setups:[{id:'atuqa',name:'Atuqa',sex:'male',def:true,note:'The keeper as drawn: broad, solid and a head shorter than the priests.',v:{height:0.98,build:1.1,chest:1.15,shoulders:1.1,waist:1.02,torso:0.97,legs:0.98,thighs:1.1,arms:1.14,neck:1.06,hands:1.12,feet:1.04,jaw:1.1,chin:1.1,cheeks:1.0,noseSize:1.1,mouthSize:1.0,smile:0.1,hairLength:1.1,hairVolume:1.05}}]};

OUTFITS.atuqa=(function(){
  const RED=0xb83a2a, GOLD=0xe8c860, STONE=0x8e887a, WOOL=0xe8dcc0, INDIGO=0x2a3a6a, SUN=0xfff0b0, LEATHER=0x5a4028, HAIR=0x1c1612;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;
    const zig=(a,n)=>Math.abs(fr(a*n)-0.5)*2;   // 0..1 triangle wave round the body: the woven zigzag

    /* ---- the paint: a red tunic with a gold-and-indigo zigzag band at the chest and a gold hem, bare arms, indigo-and-cream leggings to the knee, wool-wrapped calves, dark sandal soles ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { if(y<0.03){ c.set(INDIGO); return; } if(y>0.52){ skinPaint(c); return; } c.set(RED); const a=Math.atan2(x,z);
          if(y>0.34&&y<0.42){ c.set(GOLD); if(y<0.34+0.05*zig(a,6)) c.set(INDIGO); } else if(y>0.31&&y<0.34) c.set(WOOL); else if(y<0.09){ c.set(GOLD); if(y>0.05&&y<0.09&&zig(a,10)>0.5) c.set(INDIGO); } return; }
        case 'upperArm': skinPaint(c); return;
        case 'foreArm': { skinPaint(c); const t=-y/D.fore; if(t>0.74){ c.set(WOOL); if(fr(t*30)<0.3) c.set(RED); } return; }
        case 'thigh': { c.set(INDIGO); const t=-y/D.thigh, a=Math.atan2(z,x*sd); if(Math.abs(a)<0.14||Math.abs(Math.abs(a)-Math.PI)<0.14) c.set(WOOL); if(t>0.9) c.set(WOOL); return; }
        case 'shin': { const t=-y/D.shin; if(t<0.5){ c.set(INDIGO); if(Math.abs(Math.atan2(z,x*sd))<0.14) c.set(WOOL); } else if(t<0.56) c.set(WOOL); else if(t<0.7) skinPaint(c); else { c.set(WOOL); if(fr(t*18+Math.atan2(z,x*sd)*0.4)<0.3) c.set(RED); } return; }
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.012) c.set(LEATHER); else if(fr(z*14)<0.16&&z<0.02&&z>-0.12) c.set(LEATHER); return; }
      }
      c.set(RED); };

    /* ---- the cap: a woven dome with a gold-and-indigo zigzag band, a gold pompom, two ear flaps with braided cords and tassels ---- */
    const chullo=F=>{ const out=[];
      out.push(pc(new THREE.SphereGeometry(0.15,sg(20),sg(12),0,TAU,0,Math.PI*0.425).translate(0,0,0.004),(x,y,z,c)=>{ c.set(RED); const a=Math.atan2(x,z); if(y>0.035&&y<0.06){ c.set(GOLD); if(y<0.035+0.025*zig(a,8)) c.set(INDIGO); } else if(y>0.062&&y<0.074) c.set(WOOL); else if(y>0.1&&y<0.118&&fr(a*5)<0.5) c.set(WOOL); }));
      out.push(solid(csph(0.018,sg(8),sg(6)).translate(0,0.156,0.004),GOLD));
      for(const sd of [-1,1]){
        out.push(pc(ofRibbon([[sd*0.138,0.03,-0.015],[sd*0.145,-0.02,-0.01],[sd*0.147,-0.07,0.0],[sd*0.14,-0.115,0.002]],u=>0.056*(1-0.35*u),{up:[0,0,1],seg:sg(10),th:0.005}),(x,y,z,c)=>{ c.set(RED); if(y<-0.04&&y>-0.055) c.set(GOLD); if(y<-0.1) c.set(INDIGO); }));
        for(const dz of [-0.014,0.014]) out.push(solid(sweepTube([[sd*0.141,-0.11,0.002+dz],[sd*0.143,-0.14,0.002+dz],[sd*0.141,-0.17,0.002+dz]],[0.003,0.003,0.002],4,{cap:'round',rings:6}),GOLD),solid(csph(0.0075,sg(6),sg(5)).translate(sd*0.141,-0.175,0.002+dz),RED)); }
      return out; };

    /* ---- the hair: parted and drawn back under the cap, two long braids over the shoulders tied with gold thread ---- */
    const braids=(F,T)=>{ T.crown(0.113,0.5,0.3); T.fringe(3,0.3,0.2); T.sideLocks(0.03); T.backLocks(sg(12),0,15);
      const out=[]; for(const sd of [-1,1]){ const P=[[sd*0.1,-0.12,-0.02],[sd*0.114,-0.2,-0.05],[sd*0.12,-0.3,-0.065],[sd*0.112,-0.4,-0.06],[sd*0.104,-0.48,-0.05]];
        T.add(sweepTube(P,[0.017,0.019,0.018,0.014,0.004],sg(7),{cap:'point',rings:sg(28)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.88+0.14*Math.sin(y*170)); });
        out.push(solid(ofRingAt(P[3],[0,1,0],0.0165,0.0045,sg(6)),GOLD),solid(csph(0.008,sg(7),sg(5)).translate(P[3][0],P[3][1]-0.018,P[3][2]),RED)); }
      return out; };

    /* ---- the face: two gold stripes across each cheekbone, a cream one below ---- */
    const face=F=>{ const out=[];
      for(const sd of [-1,1]){ out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.03,0.0035,0.0009).rotateZ(sd*-0.06),sd*0.052,-0.028,0.0008),GOLD),solid(F.place(csph(1,sg(8),sg(6)).scale(0.03,0.0035,0.0009).rotateZ(sd*-0.06),sd*0.052,-0.038,0.0008),WOOL)); }
      return out; };

    /* ---- the tunic's skirt: a square-hemmed wool panel front and back to the thigh, and a quipu at the belt: a main cord, six hanging cords, each knotted twice ---- */
    const skirt=()=>oxTabard(X,D,{col:RED,col2:GOLD,len:0.26,flare:0.12,half:1.15});
    const quipu=()=>{ const out=[], s=torsoSize(X,D,0.04), rz=s.rz+0.022, x0=s.rx*0.55;
      out.push(solid(ofRingAt([0,0.04*TK,0],[0,1,0],Math.max(s.rx,rz)+0.01,0.007,sg(8)),GOLD));
      for(let i=0;i<7;i++){ const x=-x0*1.5+i*0.019, L=0.1+0.05*fr(i*0.37+0.2), col=i%2?RED:WOOL;
        out.push(solid(sweepTube([[x,0.04*TK,-rz],[x+0.002,0.04*TK-L*0.5,-rz-0.012],[x,0.04*TK-L,-rz-0.012]],[0.0024,0.0024,0.0018],4,{cap:'round',rings:6}),col));
        for(const k of [0.45,0.85]) out.push(solid(csph(0.0055,sg(6),sg(5)).translate(x+0.001,0.04*TK-L*k,-rz-0.012),i%3===0?GOLD:col)); }
      return out; };

    const GLV={start:0.2,col:WOOL,col2:RED,trim:GOLD,len:0.07,flare:0.008,fingers:'full'};
    return {
      main:{glove:WOOL,top:RED,bottom:INDIGO,shoes:WOOL,hat:RED}, bootTop:0.7, shinCut:0.7, boot:false, skinFrom:0.52, hairColor:HAIR, eyeColor:0x4a3a2a, own:{hips:'top'},
      eyes:{iris:0.85,hl:1,tilt:0.0,lash:0.4,h:0.7,browLift:0.0,browThick:1.2,browAngle:0.0},
      cuts:{torso:[0.03,0.05,0.09,0.31,0.34,0.42,0.52],upperArm:[],foreArm:[0.74],thigh:[],shin:[0.5,0.56,0.7]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:RED,trim:GOLD,len:0.5,pat:'rays',mantle:0},aura:{col:SUN,col2:GOLD,style:'orbit',ring:false,n:8,shape:'star',deco:'none'}}),
      head:F=>chullo(F),
      hair:(F,T)=>braids(F,T),
      mark:F=>face(F),
      torso:()=>quipu(),
      hips:()=>skirt(),
      shoulder:sd=>[solid(ofRingAt([0,-0.1,0],[0,1,0],0.052*aw+0.003,0.0055,sg(6)),INDIGO),solid(ofRingAt([0,-0.115,0],[0,1,0],0.052*aw+0.003,0.003,sg(6)),GOLD)],
      forearm:sd=>[solid(ofRingAt([0,-0.15,0],[0,1,0],0.0275*aw+0.002,0.003,sg(5)),GOLD)],
      shin:sd=>{ const out=[]; for(const [t,col] of [[0.72,RED],[0.82,GOLD],[0.92,RED]]) out.push(solid(ofRingAt([0,-D.shin*t,0],[0,1,0],0.044*D.cw+0.003,0.0035,sg(6)),col));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),LEATHER)); return out; },
      dress:{ shape:{sword:'tumi',bow:'tasselbow',staff:'quipustaff'}, grip:RED, metal:STONE, wood:0x4a3624, accent:GOLD, glow:SUN,
        trim:(c,u,part)=>{ const f=((u/0.06)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.18) c.lerp(ofCol(f<0.09?GOLD:INDIGO),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(GOLD),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a little quipu: a cord with three hanging strings and a knot on each
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),RED));
          for(const [i,x] of [[0,-0.008],[1,0],[2,0.008]]){ lit.push(solid(sweepTube([[x,-0.02,0.003],[x,-0.05-0.008*i,0.004]],[0.0012,0.0012],3,{cap:'round',rings:4}),i%2?WOOL:RED),solid(csph(0.0042,5,4).translate(x,-0.04-0.008*i,0.004),GOLD)); }
          glow.push(pc(csph(1,6,5).scale(0.0045,0.0045,0.0045).translate(0,-0.066,0.004),(x,y,z,c)=>c.set(SUN)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('atuqa',{jaw:1.1,cheeks:1.0,eyeSize:0.85,brow:0.9,lips:0.9,undertone:0.2,blush:0.1,smile:0.1,earSize:1.0});
OUTFITS.atuqa=oxPlus(OUTFITS.atuqa,(X,D)=>({   // silhouette: a round stone-grey terrace shield on the back, rimmed in gold with a red boss
  torso:()=>oxDisc(X,D,{col:0x8e887a,rim:0xe8c860,boss:0xb83a2a,R:0.13,y:0.34,rays:0,ray:0xe8c860})}));
