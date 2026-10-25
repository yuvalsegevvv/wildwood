//@ Dessa's outfit (a rhino-kin roadside smith): ringed rhino ears, a bristle-tufted tail and a wide-lipped muzzle with a nose horn of her own, a soot-grey smith's headwrap, a short braid, a soot-streaked face, a slate tunic under a long leather apron, iron-kneed work trousers, iron-toed boots, and the cross-peen hammer weapon dressing
/* ---------- Dessa: tank, earth. Design: docs/skillkits/looks/dessa.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: slate 0x6b6f78, forge orange 0xd9742a, iron 0x3a3d44, leather 0x6a4a30, ash cloth 0xb8b0a0, soot 0x24262b, horn 0x6b6358. Silhouette: the biggest figure in the game: broad shoulders, a long apron to the knee, a heavy horned snout under a knotted wrap.
   Every part has at least two colours (slate and orange at the least); the emblem is an anvil on a chain, never a hammer-and-sickle or a guild mark.
   KIN: her ears, tail and muzzle (with the horn drawn in the muzzle, so it follows the muzzle wherever it is worn) are set parts (shared/kin.js kinDefineSet; helpers of character/model-kin.js); CHAR_MODELS.dessa.kin writes them, and her fur, when the whole set is worn (ofWear). */
kinDefineSet({slot:'e',id:'dessa',name:'Smith\'s Rhino Ears',text:'Small thick rounded ears with a dark fringe and a forge-orange ring through each. Part of the Anvil in the Road outfit.',set:'dessa'});
kinDefineSet({slot:'k',id:'dessa',name:'Smith\'s Rhino Tail',text:'A short rope of a tail ending in a dark bristle brush. Part of the Anvil in the Road outfit.',set:'dessa'});
kinDefineSet({slot:'m',id:'dessa',name:'Horned Rhino Muzzle',text:'A broad square-lipped snout with a thick horn on the bridge and a small one behind it. Part of the Anvil in the Road outfit.',set:'dessa'});
KIN_HAT_EARS.dessa='poke';   // (the wrap is tied under them)
kinEar('dessa',0.95,0.62,0.06,K=>{ const rim=kinAcc(K,0x3a3a3f);
  return [pc(csph(1,K.sg(6),K.sg(4)).scale(0.03,0.04,0.015).translate(0,0.034,0),(x,y,z,c)=>{ c.copy(K.fur); if(Math.hypot(x/0.03,(y-0.034)/0.04)>0.84) c.copy(rim); }),kinS(csph(1,K.sg(5),K.sg(4)).scale(0.017,0.024,0.006).translate(0,0.032,-0.012),K.light),
    kinS(new THREE.TorusGeometry(0.013,0.0035,5,Math.max(8,K.sg(10))).translate(0,-0.004,0),new THREE.Color(0xd9742a))]; });
KIN_TAILS.dessa=K=>{ const tuft=kinAcc(K,0x3a3a3f), n=Math.max(5,K.sg(6));
  return [kinTube(K,[[0,0,0],[0,-0.03,0.07],[0,-0.04,0.15],[0,-0.02,0.22]],[0.022,0.016,0.013,0.012]),
    kinS(sweepTube([[0,-0.02,0.215],[0,0.0,0.25],[0,0.02,0.28],[0,0.04,0.3]],[0.01,0.026,0.024,0.002],n,{cap:'point',rings:Math.max(5,K.sg(7))}),tuft)]; };
KIN_MUZZLES.dessa=K=>{ const z=kinFace(K,0,-0.05), dk=new THREE.Color(0x3a3a3f), horn=new THREE.Color(0x6b6358), n=Math.max(6,K.sg(7)), out=[];
  out.push(pc(csph(1,n,K.sg(5)).scale(0.052,0.03,0.046).translate(0,-0.052,z-0.018),(x,y,z2,c)=>{ c.copy(K.fur); if(y<-0.072) c.copy(K.light); }));
  for(const sd of [-1,1]) out.push(kinS(csph(1,K.sg(5),K.sg(4)).scale(0.007,0.005,0.005).translate(sd*0.016,-0.046,z-0.062),dk));
  out.push(pc(new THREE.ConeGeometry(0.024,0.1,n,1,true).translate(0,0.05,0).rotateX(-1.1).translate(0,-0.03,z-0.05),(x,y,z2,c)=>{ c.copy(horn).multiplyScalar(0.78+0.4*clamp((y+0.03)*7)); }));
  out.push(pc(new THREE.ConeGeometry(0.014,0.045,n,1,true).translate(0,0.022,0).rotateX(-0.7).translate(0,0.0,z-0.02),(x,y,z2,c)=>{ c.copy(horn).multiplyScalar(0.8+0.3*clamp(y*14)); }));
  return out; };

CHAR_MODELS.dessa={id:'dessa',name:'Dessa',signature:true, kin:{ears:'dessa',tail:'dessa',muzzle:'dessa',fur:0x8d9097,fur2:0x3a3a3f}, hairGrad:{mode:'ombre',c2:0x6b6f78}, items:{glove:'Smith\'s gauntlets',hat:'Soot wrap',hair:'Short braid',face:'Soot streak',top:'Smith\'s tunic & apron',bottom:'Iron-kneed trousers',shoes:'Toecap boots',weapon:'Anvil rig'},sexes:['female'],
  note:'The smith: tall, broad and heavy-handed, built for the strongest woman on the road.',
  ranges:{height:[1.0,1.08],build:[1.05,1.18],chest:[0.9,1.9],waist:[0.95,1.15],hips:[0.95,1.2],legs:[0.95,1.1],neck:[1.0,1.2],arms:[1.05,1.25],head:[0.92,1.08],hairLength:[0.7,0.95],hairVolume:[0.9,1.1]},
  setups:[{id:'dessa',name:'Dessa',sex:'female',def:true,note:'The smith as drawn: tall, broad in the shoulder and strong in the arm.',v:{height:1.07,build:1.18,chest:1.3,shoulders:1.15,waist:1.1,torso:1.04,legs:1.0,thighs:1.2,arms:1.2,neck:1.1,hands:1.18,feet:1.15,jaw:1.2,chin:1.2,cheeks:0.9,noseSize:1.15,mouthSize:1.2,smile:0.0,hairLength:0.8,hairVolume:0.95}}]};

OUTFITS.dessa=(function(){
  const SLATE=0x6b6f78, SLATE_D=0x4a4e56, ORANGE=0xd9742a, IRON=0x3a3d44, LEATHER=0x6a4a30, LEATHER_D=0x4a3220, ASH=0xb8b0a0, SOOT=0x24262b, HAIR=0x2e2e34;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a slate tunic with an ash collar and cap sleeves, bare fur arms, dark iron-grey work trousers, black boots with an orange lace stripe and an iron toe ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(SLATE); if(y>0.5) c.set(ASH); if(y<0.06) c.set(SLATE_D); return; }
        case 'upperArm': { if(-y<D.upper*0.28) c.set(SLATE); else skinPaint(c); return; }
        case 'foreArm': skinPaint(c); return;
        case 'thigh': { c.set(IRON); const t=-y/D.thigh; if(t>0.5&&t<0.53) c.set(SLATE_D); return; }
        case 'shin': { const t=-y/D.shin; if(t<0.1){ c.set(IRON); } else { c.set(SOOT); if(Math.abs(Math.atan2(z,x*sd))<0.14&&fr(t*14)<0.5) c.set(ORANGE); } return; }
        case 'foot': { c.set(SOOT); if(y<-D.ankleH+0.012) c.set(0x121316); else if(z<-0.1) c.set(IRON); return; }
      }
      c.set(SLATE); };

    /* ---- the headwrap: an ash-grey cloth over the crown, an orange band over the brow, a knot at the back with two tails, and four iron studs ---- */
    const wrap=F=>{ const out=[], R=0.134, H=0.15, y0=0.03, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.004}];
      for(let i=0;i<=8;i++){ const t=lerp(0.2,t1,i/8); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.06,zc:0.01}); }
      out.push(pc(ofLoft(rings,sg(30),0,TAU),(x,y,z,c)=>{ c.set(ASH); c.multiplyScalar(0.92+0.1*fr(x*50+z*50)); if(y<0.058) c.set(ORANGE); }));
      for(const sd of [-1,1]) out.push(solid(csph(0.007,sg(6),sg(5)).translate(sd*0.085,0.045,-0.095),IRON),solid(csph(0.007,sg(6),sg(5)).translate(sd*0.035,0.045,-0.125),IRON));
      out.push(solid(csph(0.03,sg(9),sg(7)).translate(0.015,0.05,0.14),ORANGE));
      for(const [i,sd] of [[0,1],[1,-1]]) out.push(pc(ofRibbon([[0.015,0.05,0.15],[0.015+sd*0.02,0.0,0.17+0.01*i],[0.015+sd*0.035,-0.07,0.17],[0.015+sd*0.045,-0.14-0.03*i,0.16]],u=>0.034*(1-0.3*u),{up:[0,0,1],seg:sg(10),th:0.004}),(x,y,z,c)=>{ c.set(ASH); if(y<-0.12) c.set(ORANGE); }));
      return out; };

    /* ---- the hair: cropped short under the wrap, with one thick braid down the back tied with an iron ring ---- */
    const braid=(F,T)=>{ T.crown(0.113,0.4,0.3); T.fringe(3,0.2,0.1); T.sideLocks(0.03); T.backLocks(sg(10),0,17);
      const P=[], len=0.34*T.hl; for(let i=0;i<=8;i++){ const t=i/8; P.push([0.0,-0.02-len*t,0.1+0.03*Math.sin(t*2.4)]); }
      T.add(sweepTube(P,[0.026,0.03,0.03,0.027,0.022,0.003],sg(8),{cap:'point',rings:sg(24)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.9+0.12*Math.sin(y*140)); });
      const p=P[7], q=P[8]; return [solid(ofRingAt(p,[q[0]-p[0],q[1]-p[1],q[2]-p[2]],0.029,0.006,sg(6)),IRON),solid(ofRingAt(P[2],[0,-1,0.3],0.032,0.006,sg(6)),ORANGE)]; };

    /* ---- the face: a streak of soot across the bridge of the nose and a short scar through the left brow ---- */
    const face=F=>{ const out=[]; out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.05,0.0075,0.0009).rotateZ(0.04),0.0,-0.012,0.0008),SOOT));
      out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.0028,0.02,0.0009).rotateZ(0.5),-0.046,0.03,0.0008),0xc8b8b0));
      return out; };

    /* ---- the apron: a long leather bib from the chest to the knee, with an iron-edged pocket and orange stitching; straps over the shoulders ---- */
    const bibPts=[0.47,0.36,0.24,0.12,0.03].map(yd=>[0,yd*TK,-(torsoSize(X,D,yd).rz+0.014)]);
    const bib=()=>{ const out=[pc(ofRibbon(bibPts,u=>0.15+0.11*u,{up:[0,0,-1],seg:sg(12),th:0.007}),(x,y,z,c)=>{ c.set(LEATHER); const u=clamp((0.47*TK-y)/(0.44*TK),0,1); if(Math.abs(x)>(0.15+0.11*u)/2-0.011) c.set(ORANGE); else if(y<0.05*TK) c.set(LEATHER_D); })];
      const pz=-(torsoSize(X,D,0.2).rz+0.022); out.push(solid(vbox(0.075,0.055,0.01,0,0.2*TK,pz),LEATHER_D),solid(vbox(0.079,0.012,0.012,0,0.2*TK+0.03,pz),IRON));
      for(const sd of [-1,1]){ const zb=torsoSize(X,D,0.4).rzBack;
        out.push(pc(ofRibbon([[sd*0.055,0.47*TK,bibPts[0][2]],[sd*0.07,0.55*TK,-0.02],[sd*0.062,0.5*TK,zb+0.01],[sd*0.04,0.34*TK,zb+0.016]],0.03,{up:[0,1,0],seg:sg(12),th:0.005}),(x,y,z,c)=>{ c.set(LEATHER); })); }
      return out; };
    const belt=()=>{ const s=torsoSize(X,D,0.03), rx=s.rx+0.016, rzm=(s.rz+s.rzBack)/2+0.016, zc=(s.rzBack-s.rz)/2, out=[];
      out.push(pc(ofLoft([{y:0.05,rx,rz:rzm,zc},{y:0.0,rx,rz:rzm,zc}],sg(28),0,TAU),(x,y,z,c)=>{ c.set(LEATHER_D); }));
      out.push(solid(vbox(0.036,0.04,0.012,0,0.025,-(s.rz+0.03)),IRON));
      const hx=s.rx*0.9, hz=-(s.rz*0.4);   // a hammer hung from the right hip by its loop
      out.push(solid(vbox(0.016,0.2,0.016,hx+0.02,-0.1,hz),LEATHER),solid(vbox(0.06,0.04,0.04,hx+0.02,-0.2,hz),IRON),solid(vbox(0.065,0.014,0.044,hx+0.02,-0.18,hz),ORANGE));
      return out; };

    const GLV={start:0.12,col:LEATHER_D,col2:IRON,trim:ORANGE,len:0.1,flare:0.016,fingers:'full',studs:true};
    return {
      main:{glove:LEATHER_D,top:SLATE,bottom:IRON,shoes:SOOT,hat:ASH}, bootTop:0.1, boot:true, hairColor:HAIR, eyeColor:0x4a3a30,
      eyes:{iris:1.0,hl:1,tilt:0.08,lash:0.6,h:0.8,browLift:-0.002,browThick:1.5,browAngle:0.1},
      cuts:{torso:[0.06,0.5],upperArm:[0.28],foreArm:[],thigh:[0.5,0.53],shin:[0.1]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:SLATE_D,trim:LEATHER,len:0.7,pat:'hide',mantle:1},aura:{col:ORANGE,col2:0xffb36b,style:'rise',ring:false,n:10,shape:'mote',deco:'none'}}),
      head:F=>wrap(F),
      hair:(F,T)=>braid(F,T),
      mark:F=>face(F),
      torso:()=>bib(),
      hips:()=>belt().concat(oxApron(X,D,{col:LEATHER,trim:ORANGE,len:0.4,w:0.24})),
      shoulder:sd=>[solid(ofRingAt([0,-0.075,0],[0,1,0],0.052*aw+0.003,0.007,sg(6)),sd>0?IRON:ORANGE)],
      forearm:sd=>[solid(ofRingAt([0,-0.1,0],[0,1,0],0.0295*aw+0.004,0.0095,sg(6)),IRON),solid(ofRingAt([0,-0.14,0],[0,1,0],0.0285*aw+0.004,0.0075,sg(6)),ORANGE)],
      shin:sd=>{ const out=[], kz=-(D.KR+0.009);   // an iron knee guard with two orange rivets, the boot's iron cuff, a heel plate
        out.push(solid(vbox(0.075,0.062,0.022,0,-0.024,kz),IRON),solid(csph(0.0065,sg(6),sg(5)).translate(-0.024,-0.024,kz-0.012),ORANGE),solid(csph(0.0065,sg(6),sg(5)).translate(0.024,-0.024,kz-0.012),ORANGE));
        out.push(solid(ofRingAt([0,-D.shin*0.11,0],[0,1,0],0.052*D.cw+0.004,0.0075,sg(6)),IRON));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.014,0.05,0,-D.shin-D.ankleH+0.007,0.045),IRON)); return out; },
      dress:{ shape:{sword:'anvilhammer',bow:'hornbow',staff:'tongs'}, grip:LEATHER_D, metal:IRON, wood:0x5a4030, accent:ORANGE, glow:0xffb36b,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(ORANGE),0.85); if(part==='grip'&&((u/0.013)%1+1)%1<0.4) c.lerp(ofCol(IRON),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a small iron anvil on a chain
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),IRON));
          lit.push(solid(vbox(0.03,0.012,0.014,0,-0.032,0.004),IRON),solid(vbox(0.016,0.014,0.01,0,-0.044,0.004),IRON),solid(vbox(0.034,0.008,0.016,0,-0.054,0.004),SLATE_D));
          glow.push(pc(csph(0.0044,6,5).translate(0.014,-0.03,0.014),(x,y,z,c)=>c.set(0xffb36b)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('dessa',{eyeSize:0.95,lips:1.1,undertone:-0.2,blush:0.1,cheeks:0.9,smile:0.0,earSize:1.0});
OUTFITS.dessa=oxPlus(OUTFITS.dessa,(X,D)=>({   // silhouette: heavy pauldron plates on both shoulders, one orange-trimmed
  shoulder:sd=>oxPauldron(X,D,{col:0x3a3d44,trim:sd>0?0xd9742a:0x6b6f78,side:sd})}));
