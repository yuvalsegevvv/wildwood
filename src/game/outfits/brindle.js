//@ Brindle's outfit (a hyena-kin caravan tinker): hyena ears, a short bushy dark-tipped tail and a blunt dark muzzle of his own, a rust goggle cap, a dark nape ridge of hair, a soot-and-grin face, an amber vest with a bandolier of sun-glass vials, patched baggy trousers over a tool belt, dust boots, and the tinker's-wrench weapon dressing
/* ---------- Brindle: mixed safe DPS + support, fire. Design: docs/skillkits/looks/brindle.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: amber 0xd98a2b, rust 0x7a3b1c, cream 0xefe0bd, leather 0x5a3a22, brass 0xc9a24a, sun-glass 0xffd27a, sand cloth 0x8f7c58. Silhouette: short, wide and cheerful: a fat-eared head under a flat cap, a vest hung with glass, baggy legs, a thick bushy tail.
   Every part has at least two colours (amber and rust at the least); the emblem is a sun-glass lens, never a sun disc copied from a brand.
   KIN: his ears, tail and muzzle are set parts (shared/kin.js kinDefineSet; drawn here with the helpers of character/model-kin.js) and CHAR_MODELS.brindle.kin writes them, and his fur, onto the look when the whole set is worn (ofWear). */
kinDefineSet({slot:'e',id:'brindle',name:'Hyena Ears',text:'Big round ears, dark at the rim, set high on the head. Part of the Sun-Glass Belt outfit.',set:'brindle'});
kinDefineSet({slot:'k',id:'brindle',name:'Hyena Tail',text:'A short, thick tail that droops to a dark tip. Part of the Sun-Glass Belt outfit.',set:'brindle'});
kinDefineSet({slot:'m',id:'brindle',name:'Hyena Muzzle',text:'A broad blunt snout, dark at the front, with a big black nose. Part of the Sun-Glass Belt outfit.',set:'brindle'});
KIN_HAT_EARS.brindle='poke';   // (his cap has holes for them)
kinEar('brindle',0.68,0.38,0.1,K=>{ const dk=kinAcc(K,0x3a2414), cx=0.04, cy=0.05;
  return [pc(csph(1,K.sg(7),K.sg(5)).scale(cx,cy,0.012).translate(0,0.044,0),(x,y,z,c)=>{ c.copy(K.fur); if(y>0.08||Math.hypot(x/cx,(y-0.044)/cy)>0.86) c.copy(dk); }),kinS(csph(1,K.sg(6),K.sg(4)).scale(0.025,0.034,0.006).translate(0,0.04,-0.008),K.light)]; });
KIN_TAILS.brindle=K=>{ const dk=kinAcc(K,0x3a2414);   // (a short bushy brush that arcs up and back, widest in the middle and ending in a pointed dark tip; a tail that droops and ends in a rounded dark blob reads as the wrong thing)
  return [kinTube(K,[[0,0,0],[0,-0.01,0.09],[0,0.03,0.19],[0,0.1,0.26],[0,0.19,0.29]],[0.017,0.028,0.037,0.032,0.004],(c,s,x,y,z)=>{ if(s>0.3) c.copy(dk); else if(s>0.22) c.lerp(dk,smoothstep(0.22,0.3,s)); })]; };
KIN_MUZZLES.brindle=K=>{ const z=kinFace(K,0,-0.048), dk=new THREE.Color(0x2a1c14), n=K.sg(7);
  return [pc(csph(1,n,K.sg(5)).scale(0.04,0.032,0.05).translate(0,-0.048,z-0.02),(x,y,z2,c)=>{ c.copy(K.fur); if(z2<z-0.045) c.copy(dk); else if(y<-0.066) c.copy(K.light); }),
    kinS(csph(1,K.sg(6),K.sg(4)).scale(0.017,0.012,0.012).translate(0,-0.034,z-0.07),new THREE.Color(0x15100c)),
    kinS(sweepTube([[0,-0.058,z-0.066],[0,-0.066,z-0.034],[0,-0.066,z-0.004]],[0.0014,0.0014,0.0014],3,{cap:'round',rings:3}),dk)]; };

CHAR_MODELS.brindle={id:'brindle',name:'Brindle',signature:true, kin:{ears:'brindle',tail:'brindle',muzzle:'brindle',fur:0xc8a064,fur2:0x3a2414,mark:'spots'}, hairGrad:{mode:'tips',c2:0xd98a2b}, items:{glove:'Singed work gloves',hat:'Goggle cap',hair:'Nape ridge',face:'Soot & grin',top:'Tinker vest',bottom:'Patched baggies',shoes:'Dust boots',weapon:'Tinker rig'},sexes:['male'],
  note:'The tinker: short, broad and always laughing, built for a stocky man.',
  ranges:{height:[0.92,1.0],build:[1.0,1.18],chest:[0.9,1.5],waist:[0.9,1.15],hips:[0.95,1.2],legs:[0.92,1.02],neck:[0.85,1.05],arms:[0.95,1.2],head:[1.0,1.12],hairLength:[0.7,1.1],hairVolume:[1.0,1.25]},
  setups:[{id:'brindle',name:'Brindle',sex:'male',def:true,note:'The tinker as drawn: short, wide and loud, all chest and cheek.',v:{height:0.94,build:1.12,chest:1.2,shoulders:1.06,waist:1.08,torso:0.96,legs:0.94,thighs:1.15,arms:1.1,neck:0.92,hands:1.12,feet:1.1,jaw:1.1,chin:0.9,cheeks:1.1,noseSize:1.2,mouthSize:1.2,smile:0.8,hairLength:0.9,hairVolume:1.15}}]};

OUTFITS.brindle=(function(){
  const AMBER=0xd98a2b, RUST=0x7a3b1c, RUST_D=0x4e2512, CREAM=0xefe0bd, LEATHER=0x5a3a22, BRASS=0xc9a24a, GLASS=0xffd27a, SAND=0x8f7c58, SOOT=0x2a2018, HAIR=0x4a2c18;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: an amber vest over a cream shirt (rolled sleeves, bare forearms), sand baggies with a rust patch, leather boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(AMBER); const ax=Math.abs(x); if(y>0.5) c.set(CREAM); else if(ax<0.032&&z<0&&y>0.03) c.set(CREAM); if(y<0.075) c.set(RUST); if(ax<0.034&&z<0&&y>0.1&&y<0.5&&fr(y*20)<0.1) c.set(BRASS); return; }
        case 'upperArm': c.set(CREAM); return;
        case 'foreArm': { if(y>-0.07) c.set(CREAM); else skinPaint(c); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(SAND); if(t>0.3&&t<0.5&&Math.abs(Math.atan2(z,x*sd)-0.9)<0.4) c.set(RUST); return; }
        case 'shin': { const t=-y/D.shin; if(t<0.5){ c.set(SAND); if(t>0.44) c.set(RUST); } else { c.set(LEATHER); if(t>0.5&&t<0.545) c.set(BRASS); } return; }
        case 'foot': { c.set(LEATHER); if(y<-D.ankleH+0.012) c.set(SOOT); else if(z<-0.09) c.set(RUST); return; }
      }
      c.set(AMBER); };

    /* ---- the cap: a flat rust dome with a short brim and a strap, and a pair of brass goggles pushed up on the front ---- */
    const cap=F=>{ const out=[], R=0.133, H=0.15, y0=0.045, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.006}];
      for(let i=0;i<=8;i++){ const t=lerp(0.2,t1,i/8); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.05,zc:0.008}); }
      out.push(pc(ofLoft(rings,sg(30),0,TAU),(x,y,z,c)=>{ c.set(RUST); if(y<0.058) c.set(RUST_D); else if(y>0.07&&fr(Math.atan2(x,z)*3/TAU*2)<0.03) c.set(AMBER); }));
      out.push(pc(new THREE.CylinderGeometry(0.12,0.12,0.008,sg(18),1,false,Math.PI-1.0,2.0).scale(1,1,1.25).translate(0,0.05,-0.012),(x,y,z,c)=>{ c.set(RUST); if(Math.hypot(x,z+0.012)>0.165) c.set(RUST_D); }));
      out.push(solid(ofRingAt([0,0.064,0.006],[0,1,0],0.128,0.0055,sg(8)),LEATHER));
      for(const sd of [-1,1]){ const gx=sd*0.04, gy=0.075, gz=-0.12;
        out.push(solid(new THREE.TorusGeometry(0.026,0.0058,sg(6),sg(14)).rotateX(-0.2).translate(gx,gy,gz),BRASS));
        out.push(pc(cyl(0.0245,0.0245,0.006,sg(14)).rotateX(Math.PI/2-0.2).translate(gx,gy,gz+0.001),(x,y,z,c)=>{ c.set(GLASS); }));
        out.push(solid(vbox(0.014,0.006,0.006,0,gy,gz),BRASS)); }
      return out; };

    /* ---- the hair: short and messy over the brow, and a ridge of dark spikes with amber tips from the crown down the nape ---- */
    const ridge=(F,T)=>{ T.crown(0.112,0.5,0.3); T.fringe(5,0.5,0.2); T.sideLocks(0.04); T.backLocks(sg(12),0,19);
      const out=[]; for(let i=0;i<7;i++){ const ph=0.5+i*0.24, L=0.05-0.003*i;
        out.push(pc(new THREE.ConeGeometry(0.0125,L,5).translate(0,L/2,0).rotateX(ph).translate(0,0.106*Math.cos(ph),0.106*Math.sin(ph)),(x,y,z,c)=>{ c.set(HAIR); if(Math.hypot(y,z)>0.106+L*0.55) c.set(AMBER); })); }
      return out; };

    /* ---- the face: two smudges of soot on the cheeks and a deep laugh line each side ---- */
    const face=F=>{ const out=[]; for(const sd of [-1,1]){
        out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.02,0.011,0.0009).rotateZ(sd*0.3),sd*0.056,-0.032,0.0008),SOOT));
        out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.0035,0.016,0.0009).rotateZ(sd*0.5),sd*0.042,-0.068,0.0008),0x6a4a3a)); }
      return out; };

    /* ---- the bandolier: a leather strap from the right shoulder to the left hip hung with six sun-glass vials in brass caps ---- */
    const pts=[[0.075,0.53],[0.04,0.42],[0.0,0.31],[-0.04,0.2],[-0.078,0.1]].map(([x,yd])=>[x,yd*TK,-(torsoSize(X,D,yd).rz+0.012)]);
    const at=t=>{ const f=t*(pts.length-1), i=Math.min(pts.length-2,Math.floor(f)), u=f-i; return pts[i].map((v,k)=>lerp(v,pts[i+1][k],u)); };
    const bandolier=()=>{ const out=[pc(ofRibbon(pts,0.036,{up:[0,0,-1],seg:sg(14),th:0.006}),(x,y,z,c)=>{ c.set(LEATHER); }) ];
      for(let i=0;i<6;i++){ const p=at(0.1+i*0.15);
        out.push(pc(cyl(0.0095,0.0095,0.046,sg(6)).translate(p[0],p[1]-0.02,p[2]-0.014),(x,y,z,c)=>{ c.set(GLASS); c.multiplyScalar(0.85+0.3*fr(y*60)); }),solid(cyl(0.0108,0.0108,0.012,sg(6)).translate(p[0],p[1]+0.008,p[2]-0.014),BRASS)); }
      out.push(solid(vbox(0.03,0.034,0.01,0.075,0.53*TK,pts[0][2]-0.004),BRASS));
      return out; };

    /* ---- the tool belt: a wide leather band at the hips with three pouches and a brass buckle ---- */
    const belt=()=>{ const s=torsoSize(X,D,0.03), rx=s.rx+0.014, rzm=(s.rz+s.rzBack)/2+0.014, zc=(s.rzBack-s.rz)/2, out=[];
      out.push(pc(ofLoft([{y:0.05,rx,rz:rzm,zc},{y:0.0,rx,rz:rzm,zc}],sg(28),0,TAU),(x,y,z,c)=>{ c.set(LEATHER); }));
      out.push(solid(vbox(0.034,0.04,0.012,0,0.025,-(s.rz+0.02)),BRASS));
      for(const [x,w] of [[-0.1,0.05],[0.1,0.052],[0.15,0.04]]){ const xx=clamp(x,-s.rx*0.92,s.rx*0.92); out.push(solid(vbox(w,0.058,0.034,xx,-0.025,-(s.rz+0.02)),RUST),solid(vbox(w+0.004,0.016,0.038,xx,-0.002,-(s.rz+0.02)),LEATHER)); }
      return out; };

    const GLV={start:0.17,col:LEATHER,col2:0x3e2815,trim:BRASS,len:0.07,flare:0.012,fingers:'full'};
    return {
      main:{glove:LEATHER,top:AMBER,bottom:SAND,shoes:LEATHER,hat:RUST}, bootTop:0.5, shinCut:0, boot:true, hairColor:HAIR, eyeColor:0x8a5a2a,
      eyes:{iris:0.95,hl:2,tilt:-0.15,lash:0.3,h:0.9,browLift:0.003,browThick:1.2,browAngle:-0.15},
      cuts:{torso:[0.03,0.075,0.5],upperArm:[],foreArm:[0.07/D.fore],thigh:[],shin:[0.44,0.5,0.545]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:RUST,trim:AMBER,len:0.5,pat:'flames',mantle:0},aura:{col:GLASS,col2:AMBER,style:'rise',ring:false,n:9,shape:'mote',deco:'none'}}),
      head:F=>cap(F),
      hair:(F,T)=>ridge(F,T),
      mark:F=>face(F),
      torso:()=>bandolier(),
      hips:()=>belt(),
      thigh:sd=>[pc(csph(1,sg(14),sg(10)).scale(0.088*D.tw,D.thigh*0.5,0.088*D.tw).translate(0,-D.thigh*0.47,0),(x,y,z,c)=>{ c.set(SAND); const t=-y/D.thigh; if(t>0.3&&t<0.5&&Math.abs(Math.atan2(z,x*sd)-0.9)<0.4) c.set(RUST); })],
      forearm:sd=>[solid(ofRingAt([0,-0.07,0],[0,1,0],0.0305*aw+0.003,0.0055,sg(6)),LEATHER)],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.5,0],[0,1,0],0.058*D.cw+0.003,0.006,sg(6)),LEATHER),solid(vbox(0.018,0.022,0.01,0,-D.shin*0.52,-(0.056*D.cw+0.006)),BRASS));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),SOOT)); return out; },
      dress:{ shape:{sword:'wrench',bow:'glassbow',staff:'lensstaff'}, grip:LEATHER, metal:BRASS, wood:0x5a3a22, accent:AMBER, glow:GLASS,
        trim:(c,u,part)=>{ const f=((u/0.08)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(AMBER),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(RUST),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a little sun-glass vial on a cord
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),LEATHER));
          lit.push(pc(cyl(0.008,0.008,0.03,6).translate(0,-0.045,0.004),(x,y,z,c)=>{ c.set(BRASS); }),solid(cyl(0.009,0.009,0.008,6).translate(0,-0.027,0.004),BRASS));
          glow.push(pc(cyl(0.0058,0.0058,0.022,6).translate(0,-0.047,0.004),(x,y,z,c)=>c.set(GLASS)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('brindle',{eyeSize:1.15,lips:1.2,undertone:0.2,blush:0.3,cheeks:1.12,smile:0.85,earSize:1.0});
OUTFITS.brindle=oxPlus(OUTFITS.brindle,(X,D)=>({   // silhouette: a heavy ruff of fur at the neck and two fat tool pouches on the hips
  torso:()=>oxRuff(X,D,{col:0xc8a064,col2:0xe3c58a,r:0.125,n:3}),
  hips:()=>oxPannier(X,D,{col:0x7a3b1c,col2:0xc9a24a,w:0.07,h:0.075})}));
