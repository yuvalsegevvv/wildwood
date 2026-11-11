//@ Pip's outfit (the lost child of the Ancient Grove): a crown of woven fern fronds, a mop of leaf-tangled hair, a freckled earnest face, an oversized patched sack tunic with a rope belt and a grass-ribbon wrist band, rolled-up trousers, bare feet with a grass ankle-ribbon, and the whittled-stick weapon dressing
/* ---------- Pip: ranger, nature. Design: docs/skillkits/looks/pip.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: fern 0x4f8a4a, moss 0x7fb060, bark 0x8a6a48, sack 0xc9b48a, rust 0xb8603a, mud 0x3a2e24. Silhouette: a small figure in clothes a size too big, a fern crown, bare feet and a bright ribbon at the wrist.
   Every part has at least two colours (sack and bark at the least); the emblem is a single curled fern frond. A playable character AND the story's lost child (docs/WILDWOOD-STORY.md). */
CHAR_MODELS.pip={id:'pip',name:'Pip',signature:true, hairGrad:{mode:'tips',c2:0xd8b070}, items:{hat:'Fern crown',hair:'Leafy mop',face:'Freckles & mud',top:'Patched sack tunic',bottom:'Rolled trousers',shoes:'Bare feet & ribbon',weapon:'Whittled stick'},sexes:['male'],
  note:'The lost child: small, quick and wide-eyed, built for a short, slight boy.',
  ranges:{height:[0.92,0.98],build:[0.88,0.96],chest:[0.7,1.0],waist:[0.85,1.05],hips:[0.88,1.05],legs:[0.92,1.0],neck:[0.9,1.1],arms:[0.85,1.0],head:[1.04,1.12],hairLength:[0.8,1.2],hairVolume:[1.0,1.25]},
  setups:[{id:'pip',name:'Pip',sex:'male',def:true,note:'The lost child as drawn: small, big-headed and a little thin.',v:{height:0.93,build:0.9,chest:0.82,shoulders:0.94,waist:0.95,torso:0.96,legs:0.94,thighs:0.92,arms:0.92,neck:0.95,hands:1.05,feet:1.06,jaw:0.9,chin:0.92,cheeks:1.1,noseSize:0.9,mouthSize:0.95,smile:0.3,hairLength:1.0,hairVolume:1.15,muscle:-0.4,belly:0.2}}]};

OUTFITS.pip=(function(){
  const FERN=0x4f8a4a, MOSS=0x7fb060, BARK=0x8a6a48, SACK=0xc9b48a, SACK_D=0xa8946a, RUST=0xb8603a, MUD=0x3a2e24, ROPE=0x9a8458, HAIR=0x7a4a26;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a sack tunic with darker seams and a rust patch, bare arms below the sleeve, bark-brown trousers rolled at the knee, bare shins and feet with mud on the soles ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(SACK); if(fr(y*17+x*3)<0.07) c.set(SACK_D); if(x*sd>-1&&x>0.03&&y>0.2&&y<0.34&&z<0) c.set(RUST); if(y<0.1) c.set(SACK_D); if(y>0.545) c.set(BARK); return; }
        case 'upperArm': { const t=-y/D.upper; if(t<0.6) c.set(SACK); else skinPaint(c); return; }
        case 'foreArm': { skinPaint(c); const t=-y/D.fore; if(t>0.5&&t<0.62) c.set(MOSS); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(BARK); if(fr(t*6)<0.07) c.set(MUD); if(t>0.82) c.set(SACK_D); return; }
        case 'shin': { const t=-y/D.shin; if(t<0.15) c.set(SACK_D); else skinPaint(c); if(t>0.5&&t<0.58) c.set(MOSS); return; }
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.01) c.set(MUD); return; }
      }
      c.set(SACK); };

    /* ---- the crown: a ring of woven fern with six fronds standing up and leaning out, one curled frond over the brow ---- */
    const crown=F=>{ const out=[];
      out.push(pc(ofRingAt([0,0.07,0.002],[0,1,0],0.112,0.009,sg(7)),(x,y,z,c)=>{ c.set(FERN); if(fr(Math.atan2(x,z)*10/TAU)<0.3) c.set(MOSS); }));
      for(let i=0;i<7;i++){ const a=i/7*TAU+0.3, rr=0.11, x=Math.sin(a)*rr, z=Math.cos(a)*rr+0.002;
        out.push(solid(sweepTube([[x,0.075,z],[x*1.12,0.12,z*1.12],[x*1.3,0.15+0.02*(i%2),z*1.3]],[0.006,0.0055,0.0012],4,{cap:'point',rings:6}),i%2?MOSS:FERN));
        out.push(solid(csph(1,sg(7),sg(5)).scale(0.012,0.032,0.004).rotateZ(-Math.sin(a)*0.5).translate(x*1.18,0.115,z*1.18),i%2?FERN:MOSS)); }
      out.push(solid(sweepTube([[0.0,0.08,-0.108],[0.0,0.115,-0.12],[0.018,0.13,-0.118],[0.026,0.118,-0.114]],[0.005,0.0045,0.0035,0.0015],4,{cap:'round',rings:8}),MOSS));
      return out; };

    /* ---- the hair: a short tousled mop, a cowlick standing up and two leaves caught behind the ear ---- */
    const mop=(F,T)=>{ T.crown(0.114,0.55,0.3); T.fringe(7,0.9,0.1); T.sideLocks(0.03*T.hl); T.backLocks(sg(10),0,9);
      return [solid(new THREE.ConeGeometry(0.014,0.05,5).rotateZ(-0.3).translate(0.03,0.13,0.0),HAIR),
        solid(csph(1,sg(7),sg(5)).scale(0.01,0.026,0.004).rotateZ(0.8).translate(-0.1,-0.02,0.03),MOSS)]; };

    /* ---- the tunic's extras: a rope belt with a pebble pouch, and a hem torn in points ---- */
    const belt=()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.01, out=[];
      out.push(pc(ofLoft([{y:0.05*TK,rx:s.rx+0.01,rz},{y:0.047*TK,rx:s.rx+0.014,rz:rz+0.004},{y:0.0,rx:s.rx+0.012,rz:rz+0.004},{y:-0.003,rx:s.rx+0.01,rz}],sg(36),0,TAU),(x,y,z,c)=>{ c.set(ROPE); if(fr(Math.atan2(x,z)*14/TAU)<0.3) c.set(SACK_D); }));
      out.push(solid(sweepTube([[D.hx+0.04,0.0,-rz],[D.hx+0.05,-0.06,-rz-0.004],[D.hx+0.045,-0.1,-rz]],[0.005,0.005,0.0015],4,{cap:'point',rings:6}),ROPE));
      out.push(pc(vbox(0.04,0.04,0.028,-D.hx-0.05,-0.03,-rz-0.012),(x,y,z,c)=>{ c.set(BARK); if(y>-0.02) c.set(MUD); }));
      return out; };

    return {
      aura:{col:0x7fb060,col2:0xe8f6c8,style:'rise',ring:false,n:6,shape:'leaf',deco:'none'},
      main:{top:0xc9b48a,bottom:0x8a6a48,shoes:0xc9b48a,hat:0x4f8a4a}, bootTop:0.3, shinCut:0, boot:false, skinFrom:0.545, hairColor:HAIR, eyeColor:0x4f7a3a,
      eyes:{iris:1.15,hl:1,tilt:-0.05,lash:0.2,h:1.0,browLift:0.004,browThick:0.9},
      cuts:{torso:[0.1,0.545],upperArm:[0.6],foreArm:[0.5,0.62],thigh:[0.82],shin:[0.15,0.5,0.58]},
      paint,
      head:F=>crown(F),
      hair:(F,T)=>mop(F,T),
      mark:F=>{ const out=[]; for(const [x,y] of [[0.02,-0.03],[0.034,-0.036],[0.046,-0.028],[0.028,-0.044],[0.05,-0.042]]) for(const sd of [-1,1]) out.push(solid(F.place(csph(1,8,6).scale(0.0034,0.0034,0.0009),sd*x,y,0.0008),0xa8765a));
        out.push(solid(F.place(csph(1,8,6).scale(0.03,0.007,0.0009).rotateZ(-0.1),0.05,-0.064,0.0008),0x5a4a38)); return out; },
      hips:()=>belt(),
      shoulder:sd=>[solid(ofRingAt([0,-0.045,0],[0,1,0],0.048*aw+0.002,0.008,sg(6)),SACK_D)],
      forearm:sd=>[solid(ofRingAt([0,-D.fore*0.56,0],[0,1,0],0.0275*aw+0.002,0.0045,sg(6)),MOSS),solid(sweepTube([[0.0,-D.fore*0.56,0.03*aw],[0.01,-D.fore*0.56-0.05,0.04*aw],[0.02,-D.fore*0.56-0.09,0.036*aw]],[0.004,0.004,0.001],4,{cap:'point',rings:6}),FERN)],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.15,0],[0,1,0],0.05*D.cw+0.002,0.007,sg(6)),SACK_D),solid(ofRingAt([0,-D.shin*0.54,0],[0,1,0],0.04*D.cw+0.002,0.0042,sg(6)),MOSS)); return out; },
      dress:{ shape:{sword:'whittle',bow:'branch',staff:'fernstaff'}, grip:ROPE, metal:0xb8a888, wood:0x6a4e30, accent:MOSS,
        trim:(c,u,part)=>{ const f=((u/0.06)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(MOSS),0.8); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(RUST),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a curled fern frond on a grass loop with a speckled pebble
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),FERN));
          lit.push(solid(sweepTube([[0,-0.02,0.004],[0.012,-0.04,0.004],[0.02,-0.06,0.004],[0.014,-0.078,0.004],[0.004,-0.072,0.004]],[0.0042,0.0038,0.003,0.002,0.0012],4,{cap:'round',rings:8}),MOSS));
          lit.push(pc(new THREE.IcosahedronGeometry(0.008,0).translate(-0.01,-0.05,0.004),(x,y,z,c)=>{ c.set(0xcfc4a8); if(fr(x*300+y*200)<0.3) c.set(BARK); }));
          glow.push(pc(csph(0.0034,6,5).translate(0.012,-0.058,0.015),(x,y,z,c)=>c.set(0xd8f6a8)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.pip=oxPlus(OUTFITS.pip,(X,D)=>({   // round 2: a knotted rag scarf and a woven sling-bag across the body
  torso:()=>oxScarf(X,D,{col:0xb8603a,col2:0xc9b48a,len:0.5}),
  hips:()=>oxSash(X,D,{col:0x7fb060,col2:0x4f8a4a,len:0.6,side:-1}),
  cos:{cape:{col:0x4f8a4a,trim:0x7fb060,len:0.4,pat:'leaf',mantle:0}}}));
oxTune('pip',{head:1.08,jaw:0.9,chin:0.92,cheeks:1.1,brow:0.1,eyeSize:1.2,noseSize:0.9,lips:0.9,undertone:0.5,blush:0.6,earSize:1.2,smile:0.3});
OUTFITS.pip=oxPlus(OUTFITS.pip,(X,D)=>({   // face round 1: wind-pink cheeks and a smear of mud on the nose
  mark:F=>oxMarks(F,[{t:'cheek',col:0xe0a090}]),
  kit:{eyeColor:0x4f7a3a,eyes:{iris:1.2,lash:0.15}}}));
