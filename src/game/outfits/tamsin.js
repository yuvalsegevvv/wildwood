//@ Tamsin's outfit (a quarry-hand): an ochre dust-wrap headscarf, braids pinned up, dust-smudged cheeks, a sleeveless granite work shirt under a rope harness with a tool loop, heavy canvas trousers with stone knee pads and steel-toed boots, and the sledge weapon dressing
/* ---------- Tamsin: grind, earth. Design: docs/skillkits/looks/tamsin.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: granite 0x8a8f96, dust 0xd2b48a, rope 0x9a7a4a, ochre 0xc2823a, canvas 0x6a5a44, steel 0xc9ccd4. Silhouette: a wrapped head with a knot, strong bare arms, a rope harness across the chest, a belt of tools and thick knees over heavy boots.
   Every part has at least two colours (granite and ochre at the least); the emblem is a cairn, never a mountain copied from a brand. */
CHAR_MODELS.tamsin={id:'tamsin',name:'Tamsin',signature:true, hairGrad:{mode:'streak',c2:0xd89a4a}, items:{glove:'Quarry gloves',hat:'Dust wrap',hair:'Pinned braids',face:'Dust smudges',top:'Rope harness',bottom:'Knee-pad trousers',shoes:'Steel-toe boots',weapon:'Sledge rig'},sexes:['female'],
  note:'The quarry-hand: strong, short in the stride and steady, built for a sturdy woman.',
  ranges:{height:[0.92,1.04],build:[1.0,1.18],chest:[0.9,1.4],waist:[0.9,1.15],hips:[1.0,1.2],legs:[0.92,1.06],neck:[0.95,1.2],arms:[1.0,1.25],head:[0.95,1.1],hairLength:[0.8,1.2],hairVolume:[0.9,1.2]},
  setups:[{id:'tamsin',name:'Tamsin',sex:'female',def:true,note:'The quarry-hand as drawn: broad-shouldered, strong-armed and sturdy.',v:{height:0.98,build:1.1,chest:1.1,shoulders:1.1,waist:1.0,torso:0.98,legs:0.98,thighs:1.1,arms:1.15,neck:1.05,hands:1.12,feet:1.05,jaw:1.05,chin:1.0,cheeks:1.05,noseSize:1.0,mouthSize:1.0,smile:0.4,hairLength:1.0,hairVolume:1.1}}]};

OUTFITS.tamsin=(function(){
  const GRANITE=0x8a8f96, GRANITE_D=0x5a5f66, DUST=0xd2b48a, ROPE=0x9a7a4a, OCHRE=0xc2823a, CANVAS=0x6a5a44, CANVAS_D=0x4a3e30, STEEL=0xc9ccd4, HAIR=0x4a2e20;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a granite sleeveless shirt with dust streaks, bare arms with ochre wraps, canvas trousers with seams, stone knee patches, dark boots with a steel toe ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(GRANITE); if(fr(x*50+y*20)<0.07) c.set(GRANITE_D); if(y<0.2&&fr(y*9)<0.4) c.lerp(ofCol(DUST),0.25); if(y>0.545) c.set(DUST); return; }
        case 'upperArm': { const t=-y/D.upper; if(t>0.74) c.set(OCHRE); else skinPaint(c); return; }
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.14){ c.set(OCHRE); if(fr(y*60)<0.2) c.set(DUST); } else skinPaint(c); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(CANVAS); if(Math.abs(Math.atan2(z,x*sd))<0.1) c.set(CANVAS_D); if(t>0.88) c.set(GRANITE_D); return; }
        case 'shin': { const t=-y/D.shin; c.set(CANVAS); if(t<0.16&&Math.abs(Math.atan2(z,x*sd))<1.2) c.set(GRANITE); else if(t>0.6&&t<0.66) c.set(OCHRE); else if(t>0.66) { c.set(0x3a3028); } return; }
        case 'foot': { c.set(0x3a3028); if(y<-D.ankleH+0.012) c.set(0x15110f); else if(z<-0.085) c.set(STEEL); return; }
      }
      c.set(GRANITE); };

    /* ---- the dust wrap: an ochre scarf wound over the crown with a dust-coloured band and a knot at the back with two short tails ---- */
    const wrap=F=>{ const out=[], R=0.133, H=0.14, y0=0.03, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.006}];
      for(let i=0;i<=8;i++){ const t=lerp(0.2,t1,i/8); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.04,zc:0.006}); }
      out.push(pc(ofLoft(rings,sg(34),0,TAU),(x,y,z,c)=>{ c.set(OCHRE); const a=Math.atan2(x,z+0.006); if(fr(a/TAU*3+y*12)<0.14) c.set(DUST); if(y<0.05) c.set(GRANITE_D); }));
      out.push(solid(ofRingAt([0,0.048,0.006],[0,1,0],0.128,0.007,sg(6)),DUST),solid(csph(0.03,sg(9),sg(7)).translate(0,0.05,0.14),OCHRE));
      for(const sd of [-1,1]) out.push(pc(ofRibbon([[sd*0.01,0.045,0.15],[sd*0.03,-0.02,0.165],[sd*0.04,-0.1,0.16]],0.04,{up:[sd,0,0.4],seg:sg(8),th:0.003}),(x,y,z,c)=>{ c.set(OCHRE); if(y<-0.08) c.set(DUST); }));
      return out; };

    /* ---- the hair: two braids pinned up into the wrap, a few loose strands at the temples ---- */
    const braids=(F,T)=>{ T.crown(0.108,0.35,0.15); T.fringe(5,0.5,0.1); T.sideLocks(0.04*T.hl); T.backLocks(sg(10),0,9); const out=[];
      for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.1,-0.01,0.07],[sd*0.115,0.02,0.1],[sd*0.1,0.05,0.13]],[0.016,0.018,0.014],sg(6),{cap:'round',rings:sg(12)}),HAIR));
      return out; };

    /* ---- the harness: two rope straps crossed over the chest with a ring, a belt with a hammer loop and a pouch ---- */
    const harness=()=>{ const out=[]; for(const sd of [-1,1]){ const P=[]; for(let i=0;i<=8;i++){ const f=i/8, yd=lerp(0.53,0.05,f), s=torsoSize(X,D,yd), x=sd*lerp(0.1,-0.1,f)*D.B; P.push([x,yd*TK,-(s.rz+0.014)]); }
        out.push(pc(ofRibbon(P,0.032,{up:[0,0,-1],seg:sg(16),th:0.005}),(x,y,z,c)=>{ c.set(ROPE); if(fr(y*80)<0.2) c.set(CANVAS_D); })); }
      out.push(solid(ofRingAt([0,0.29*TK,-(torsoSize(X,D,0.29).rz+0.02)],[0,0,1],0.022,0.0055,sg(8)),STEEL));
      const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.01;
      out.push(pc(ofLoft([{y:0.06*TK,rx:s.rx+0.01,rz},{y:0.056*TK,rx:s.rx+0.015,rz:rz+0.005},{y:0.0,rx:s.rx+0.014,rz:rz+0.005},{y:-0.004,rx:s.rx+0.01,rz}],sg(36),0,TAU),(x,y,z,c)=>{ c.set(CANVAS_D); if(y>0.056*TK-0.006) c.set(ROPE); }));
      out.push(pc(vbox(0.05,0.06,0.03,D.hx+0.07,-0.01,-rz-0.014),(x,y,z,c)=>{ c.set(ROPE); if(y>0.01) c.set(CANVAS_D); }));
      return out; };

    const GLV={start:0.18,col:CANVAS,col2:CANVAS_D,trim:ROPE,len:0.08,flare:0.006,studs:true,fingers:'full'};
    const addOn=()=>{ const out=[], zb=torsoSize(X,D,0.3).rzBack+0.034;   // a pick slung on the back
      out.push(solid(sweepTube([[0.07,0.01*TK,zb],[0.03,0.3*TK,zb+0.008],[-0.03,0.6*TK,zb]],[0.011,0.011,0.011],5,{cap:'round',rings:10}),ROPE),
        solid(sweepTube([[-0.13,0.62*TK,zb+0.01],[-0.07,0.665*TK,zb+0.004],[-0.02,0.675*TK,zb],[0.04,0.665*TK,zb+0.004],[0.09,0.63*TK,zb+0.01]],[0.003,0.014,0.016,0.014,0.003],6,{cap:'point',rings:14}),STEEL),
        solid(ofRingAt([0.03,0.3*TK,zb+0.008],[0.15,1,0.1],0.015,0.004,sg(5)),OCHRE));
      return out; };
    return {
      main:{glove:0x6a5a44,top:0x8a8f96,bottom:0x6a5a44,shoes:0x3a3028,hat:0xc2823a}, bootTop:0.04, shinCut:0, boot:true, skinFrom:0.545, hairColor:HAIR, eyeColor:0x6a8a4a,
      eyes:{iris:1.0,hl:1,tilt:0.0,lash:0.7,browLift:0.0,browThick:1.3,h:0.9},
      cuts:{torso:[0.545],upperArm:[0.74],foreArm:[0.14/D.fore,0.222/D.fore],thigh:[0.88],shin:[0.04,0.16,0.6,0.66]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{aura:{col:DUST,col2:0xfff0d0,style:'rise',ring:false,n:8,shape:'grain',deco:'none'}}),
      head:F=>wrap(F),
      hair:(F,T)=>braids(F,T),
      mark:F=>{ const out=[]; for(const sd of [-1,1]){ out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.03,0.007,0.0009).rotateZ(sd*-0.1),sd*0.058,-0.03,0.0008),0x9a8466)); out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.02,0.005,0.0009).rotateZ(sd*0.2),sd*0.05,-0.048,0.0008),0xb89a70)); } return out; },
      torso:()=>harness().concat(addOn()),
      shoulder:sd=>[solid(ofRingAt([0,-0.1,0],[0,1,0],0.05*aw+0.002,0.007,sg(6)),OCHRE)],
      forearm:sd=>[solid(ofRingAt([0,-0.14,0],[0,1,0],0.0295*aw+0.002,0.004,sg(6)),ROPE)],
      thigh:sd=>{ const tw=D.tw, st=[[0,0.105*tw,0.108*tw],[0.4,0.123*tw,0.123*tw],[0.8,0.115*tw,0.115*tw],[1,D.KR*1.12,D.KR*1.12]];
        return [pc(limb(st,D.thigh,sg(18),sg(14),{cuts:[0.88],openTop:true,cap:2}),(x,y,z,c)=>{ paint('thigh',c,x,y,z,sd); })]; },
      shin:sd=>{ const out=[]; out.push(pc(csph(1,sg(9),sg(7)).scale(0.052*D.cw,0.05,0.034).translate(0,-D.shin*0.04,-0.032),(x,y,z,c)=>{ c.set(GRANITE); if(y>-D.shin*0.04) c.set(GRANITE_D); }));
        out.push(solid(ofRingAt([0,-D.shin*0.63,0],[0,1,0],0.046*D.cw+0.002,0.004,sg(6)),OCHRE));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),0x15110f)); return out; },
      dress:{ shape:{sword:'sledge',bow:'slingbow',staff:'cairn'}, grip:ROPE, metal:GRANITE, wood:0x5a4632, accent:OCHRE,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.14) c.lerp(ofCol(OCHRE),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(DUST),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a polished pebble on a rope loop with a steel chisel tip
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.022,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),ROPE));
          lit.push(pc(new THREE.IcosahedronGeometry(0.013,0).scale(1.1,0.9,1).translate(0,-0.04,0.004),(x,y,z,c)=>{ c.set(GRANITE); if(y>-0.04) c.set(DUST); }));
          lit.push(solid(new THREE.ConeGeometry(0.004,0.03,5).rotateX(Math.PI).translate(0.012,-0.07,0.004),STEEL));
          glow.push(pc(csph(0.0034,6,5).translate(0,-0.04,0.016),(x,y,z,c)=>c.set(0xe8d9b8)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.tamsin=oxPlus(OUTFITS.tamsin,(X,D)=>({   // round 4: a canvas apron with chisel loops, a granite plate on one shoulder, a rope coil, a dusty ochre cloak
  torso:()=>oxCoil(X,D,{col:0x9a7a4a,col2:0xd2b48a,dir:-1}),
  shoulder:sd=>sd<0?oxPauldron(X,D,{col:0x8a8f96,trim:0xc2823a,r:0.068}):[],
  hips:()=>oxApron(X,D,{col:0x4a3e30,trim:0xd2b48a,len:0.2,w:0.15}),
  cos:{cape:{col:0xc2823a,trim:0xd2b48a,len:0.5,pat:'ash',mantle:1}}}));
oxTune('tamsin',{jaw:1.12,chin:1.05,cheeks:1.12,brow:0.45,eyeSize:1.02,noseSize:1.05,lips:1.1,undertone:0.5,blush:0.45,smile:0.2,earSize:1.05});
OUTFITS.tamsin=oxPlus(OUTFITS.tamsin,(X,D)=>({   // face round 1: sun-warm skin, freckles and a beauty mark, chalk-white hair tips, steel studs in the ear
  mark:F=>oxMarks(F,[{t:'freckles',col:0xb08060},{t:'mole',side:1,col:0x5a3a2a}]),
  hair:()=>oxHairBits(X,[{t:'ring',both:true,col:0xc9ccd4},{t:'pin',side:1,col:0x9a7a4a,col2:0xc2823a}])}));
Object.assign(CHAR_MODELS.tamsin,{hairGrad:{mode:'tips',c2:0xe8e2d4}});
