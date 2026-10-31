//@ Meleni's outfit (an Emberwake wayfinder-singer): a woven leaf crown with white shells, a hibiscus and trailing tapa ribbons, long dark hair with a shell-tied braid, turquoise wave tattoos, a tapa bandeau under a shell lei, a deep-blue pareu with a cream wave line, shell anklets on bare feet, and the paddle-staff weapon dressing
/* ---------- Meleni: buff support, water. Design: docs/skillkits/looks/meleni.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: lagoon turquoise 0x2fb4b0, shell cream 0xf2e6c8, deep sea 0x16607a, driftwood 0x8a6a48, hibiscus coral 0xe86a5a, sun gold 0xe8c060. Silhouette: a bare-shouldered figure in a long flared wrap skirt with a crown of leaves and a lei,
   hair to the hip with one braid over the shoulder, bare feet. Every part has at least two colours (turquoise and cream at the least); the emblem is a wave and a chevron, never a boat or an anchor. */
CHAR_MODELS.meleni={id:'meleni',name:'Meleni',signature:true, hairGrad:{mode:'tips',c2:0x2fb4b0}, items:{hat:'Shell leaf crown',hair:'Tide braid',face:'Wave marks',top:'Tapa bandeau & lei',bottom:'Wave pareu',shoes:'Shell anklets',weapon:'Paddle staff'},sexes:['female'],
  note:'The wayfinder: tall, broad in the shoulder from the paddle, long in the leg.',
  ranges:{height:[1.0,1.08],build:[0.92,1.08],chest:[0.7,1.2],waist:[0.82,1.0],hips:[0.9,1.15],legs:[1.0,1.14],neck:[0.95,1.15],arms:[0.95,1.15],head:[0.95,1.05],hairLength:[1.1,1.35],hairVolume:[0.95,1.2]},
  setups:[{id:'meleni',name:'Meleni',sex:'female',def:true,note:'The wayfinder as drawn: tall, strong-shouldered and long-haired.',v:{height:1.05,build:1.0,chest:0.95,shoulders:1.08,waist:0.9,torso:1.0,legs:1.08,thighs:1.0,arms:1.08,neck:1.04,hands:1.0,feet:1.0,jaw:0.95,chin:0.95,cheeks:1.05,noseSize:1.0,mouthSize:1.05,smile:0.55,hairLength:1.3,hairVolume:1.1}}]};

OUTFITS.meleni=(function(){
  const TURQ=0x2fb4b0, CREAM=0xf2e6c8, DEEP=0x16607a, WOOD=0x8a6a48, CORAL=0xe86a5a, GOLD=0xe8c060, HAIR=0x241822;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a tapa bandeau (cream, two turquoise bands and a zigzag edge), bare midriff, a turquoise armband on each arm, the pareu's deep blue below the waist, bare legs ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { if(y<0.03){ c.set(DEEP); return; } if(y>0.47){ skinPaint(c); return; } if(y>0.3){ c.set(CREAM); if((y>0.435&&y<0.455)||(y>0.31&&y<0.33)) c.set(TURQ); else if(y>0.455&&y<0.47&&fr((Math.atan2(x,z))*5)<0.5) c.set(TURQ); return; } skinPaint(c); return; }
        case 'upperArm': { skinPaint(c); const t=-y/D.upper; if(t>0.3&&t<0.4){ c.set(TURQ); if(t>0.335&&t<0.365) c.set(CREAM); } return; }
        case 'foreArm': skinPaint(c); return;
        case 'thigh': { const t=-y/D.thigh; if(t<0.06) c.set(DEEP); else skinPaint(c); return; }
        case 'shin': skinPaint(c); return;
        case 'foot': skinPaint(c); return;
      }
      c.set(CREAM); };

    /* ---- the crown: a woven leaf band with seven white shells across the front, a coral hibiscus over the left ear and two tapa ribbons trailing down the back ---- */
    const crown=F=>{ const out=[];
      out.push(solid(ofRingAt([0,0.054,0.006],[0,1,0],0.124,0.0105,sg(10)),TURQ),solid(ofRingAt([0,0.044,0.006],[0,1,0],0.123,0.0045,sg(8)),CREAM));
      for(let i=0;i<7;i++){ const a=(i-3)/3*1.15, x=Math.sin(a)*0.127, z=-Math.cos(a)*0.127+0.006; out.push(solid(csph(1,sg(8),sg(6)).scale(0.0125,0.0105,0.006).rotateY(-a).translate(x,0.066,z),CREAM)); }
      const fx=-0.116, fy=0.07, fz=-0.04;
      for(let i=0;i<5;i++){ const q=i/5*TAU; out.push(solid(csph(1,sg(7),sg(5)).scale(0.0055,0.017,0.014).translate(fx,fy+Math.sin(q)*0.016,fz+Math.cos(q)*0.016).rotateX(0),CORAL)); }
      out.push(solid(csph(0.008,sg(7),sg(5)).translate(fx-0.004,fy,fz),GOLD));
      for(const [i,dz] of [[0,0.0],[1,0.035]]) out.push(pc(ofRibbon([[0.05+0.02*i,0.04,0.115+dz],[0.06+0.02*i,-0.02,0.15+dz],[0.07+0.02*i,-0.11,0.16+dz],[0.06+0.02*i,-0.22-0.03*i,0.15+dz]],u=>0.034*(1-0.3*u),{up:[1,0,0.2],seg:sg(12),th:0.004}),(x,y,z,c)=>{ c.set(TURQ); if(y<-0.15+0.0*i) c.set(CREAM); }));
      return out; };

    /* ---- the hair: loose and long, with one braid over the left shoulder tied with a cream shell ---- */
    const tide=(F,T)=>{ T.crown(0.113,0.5,0.3); T.fringe(4,0.5,0.3); T.sideLocks(0.04); T.backLocks(sg(14),0,21);
      const P=[[-0.082,0.0,-0.06],[-0.1,-0.08,-0.08],[-0.112,-0.17,-0.085],[-0.1,-0.27,-0.075],[-0.092,-0.34,-0.07]];
      T.add(sweepTube(P,[0.016,0.0175,0.016,0.013,0.004],sg(7),{cap:'point',rings:sg(26)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.9+0.12*Math.sin(y*150)); });
      return [solid(ofRingAt(P[3],[0,1,0],0.015,0.0045,sg(6)),CREAM),solid(csph(0.011,sg(7),sg(5)).scale(1,0.8,0.6).translate(P[3][0],P[3][1]-0.012,P[3][2]-0.016),CREAM)]; };

    /* ---- the face: three turquoise dots along each cheekbone and a short row of dots on the chin, like the marks a navigator's family gives ---- */
    const face=F=>{ const out=[];
      for(const sd of [-1,1]){ for(const [x,y] of [[0.05,-0.026],[0.058,-0.034],[0.066,-0.042]]) out.push(solid(F.place(csph(0.0035,sg(6),sg(5)),sd*x,y,0.0008),DEEP)); }
      for(const x of [-0.012,0,0.012]) out.push(solid(F.place(csph(0.0028,sg(6),sg(5)),x,-0.1+Math.abs(x)*0.4,0.0008),TURQ));
      return out; };

    /* ---- the bandeau's knot at the back, a woven belt cord with a shell, and a driftwood-and-shell collar ---- */
    const upper=()=>{ const out=[], s=torsoSize(X,D,0.3), zb=s.rzBack+0.012;
      out.push(solid(csph(0.02,sg(8),sg(6)).translate(0,0.37*TK,zb),TURQ),pc(ofRibbon([[0,0.37*TK,zb],[0.03,0.3*TK,zb+0.012],[0.04,0.22*TK,zb+0.012]],0.026,{up:[0,0,1],seg:sg(8),th:0.004}),(x,y,z,c)=>c.set(CREAM)));
      const w=torsoSize(X,D,0.03), rz=Math.max(w.rz,w.rzBack)+0.01;
      out.push(solid(ofRingAt([0,0.03*TK,0],[0,1,0],Math.max(w.rx,rz)+0.008,0.007,sg(8)),CREAM));
      out.push(solid(csph(1,sg(8),sg(6)).scale(0.018,0.014,0.007).translate(0.0,0.025*TK,-(rz+0.008)),CREAM));
      return out; };

    return {
      main:{top:CREAM,bottom:DEEP,shoes:CREAM,hat:TURQ}, bootTop:1.1, shinCut:0, boot:false, skinFrom:0.47, hairColor:HAIR, eyeColor:0x6a4a2a,
      eyes:{iris:1.12,hl:2,tilt:0.18,lash:0.8,h:1.0,browLift:0.006,browThick:0.8,browAngle:0.12},
      cuts:{torso:[0.03,0.3,0.31,0.33,0.435,0.455,0.47],upperArm:[0.3,0.335,0.365,0.4],foreArm:[],thigh:[0.06],shin:[]},
      paint,
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:TURQ,trim:CREAM,len:0.55,pat:'waves',mantle:0},aura:{col:0x7fe8ff,col2:CREAM,style:'orbit',ring:false,n:8,shape:'drop',deco:'none'}}),
      head:F=>crown(F),
      hair:(F,T)=>tide(F,T),
      mark:F=>face(F),
      torso:()=>upper().concat(oxBeads(X,D,{col:CREAM,col2:TURQ,n:24,r:0.0125,drop:0.2}),oxBeads(X,D,{col:CORAL,col2:GOLD,n:14,r:0.016,drop:0.3})),
      hips:()=>{ const s=torsoSize(X,D,0.03), R=Math.max(s.rx,s.rz)+0.018, L=0.34, n=14, rings=[];
        for(let i=0;i<=n;i++){ const t=i/n, r=R*(1+0.55*Math.pow(t,1.35)); rings.push({y:-L*t+0.01,rx:r,rz:r}); }
        const out=[pc(ofLoft(rings,sg(26),0,TAU),(x,y,z,c)=>{ c.set(DEEP); const a=Math.atan2(x,z), w=-0.13+0.02*Math.sin(a*7); if(Math.abs(y-w)<0.016) c.set(CREAM); if(y<-L+0.04) c.set(TURQ); })];
        out.push(solid(ofRingAt([0,-L+0.008,0],[0,1,0],rings[n].rx,0.0075,sg(8)),CREAM)); return out; },
      shoulder:sd=>[solid(ofRingAt([0,-0.09,0],[0,1,0],0.049*aw+0.003,0.004,sg(6)),CREAM)],
      forearm:sd=>[solid(ofRingAt([0,-0.19,0],[0,1,0],0.0268*aw+0.002,0.0032,sg(5)),TURQ),solid(csph(0.008,sg(6),sg(5)).translate(0.02*aw,-0.19,0),CREAM)],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.9,0],[0,1,0],0.04*D.cw+0.003,0.0035,sg(6)),CREAM));
        for(const a of [0.4,1.2,2.0,2.8,3.6,4.4,5.2]) out.push(solid(csph(0.0055,sg(5),sg(4)).translate(Math.sin(a)*(0.04*D.cw+0.004),-D.shin*0.9-0.006,Math.cos(a)*(0.04*D.cw+0.004)),a>3?TURQ:CREAM));
        return out; },
      dress:{ shape:{sword:'paddleblade',bow:'wavebow',staff:'paddlestaff'}, grip:CREAM, metal:0xe8f0ec, wood:WOOD, accent:TURQ, glow:0x7fe8ff,
        trim:(c,u,part)=>{ const f=((u/0.08)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.14) c.lerp(ofCol(TURQ),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(DEEP),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a small conch shell on a cord, with a turquoise spark
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),WOOD));
          lit.push(solid(new THREE.ConeGeometry(0.012,0.034,7).rotateX(Math.PI).translate(0,-0.05,0.004),CREAM),solid(csph(0.012,sg(7),sg(5)).scale(1,0.8,1).translate(0,-0.034,0.004),CORAL));
          glow.push(pc(csph(1,6,5).scale(0.004,0.004,0.004).translate(0.014,-0.062,0.006),(x,y,z,c)=>c.set(0x7fe8ff)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('meleni',{eyeSize:1.1,lips:1.0,undertone:0.2,blush:0.25,cheeks:1.05,smile:0.55,earSize:1.0});
OUTFITS.meleni=oxPlus(OUTFITS.meleni,(X,D)=>({   // silhouette: shell-tipped tapa ties at both hips, longer than the skirt's hem on one side
  hips:()=>oxSash(X,D,{col:0x2fb4b0,col2:0xf2e6c8,len:1.2,side:-1}).concat(oxSash(X,D,{col:0xf2e6c8,col2:0x2fb4b0,len:0.9,side:1}))}));
OUTFITS.meleni=oxPlus(OUTFITS.meleni,(X,D)=>({   // hair bits: a pearl earring and a coral hair pin
  hair:()=>oxHairBits(X,[{t:'ring',side:1,col:0xf2e6c8},{t:'pin',side:1,col:0xe86a5a,col2:0xf2e6c8}])}));
