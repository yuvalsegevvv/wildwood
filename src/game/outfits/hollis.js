//@ Hollis's outfit (an undertaker's lamp-bearer): a tall black hat with a crape band and a trailing ribbon, slicked hair, a gaunt tired face, a long black frock coat with amber buttons and a white collar, striped dark trousers, polished boots with amber buckles, and the vigil-hook weapon dressing
/* ---------- Hollis: healer, dark. Design: docs/skillkits/looks/hollis.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: crape 0x2a2630, plum 0x3a3548, lamp amber 0xe8a84a, fog 0x9c9aa6, collar white 0xe8e4dc, brass 0xb08a3a. Silhouette: a tall hat over a narrow body, a long coat with tails to the knee, a lantern hook in the hand.
   Every part has at least two colours (crape and amber at the least); the emblem is a hooded lantern, never a skull or a coffin. */
CHAR_MODELS.hollis={id:'hollis',name:'Hollis',signature:true, hairGrad:{mode:'ombre',c2:0x8a8494}, items:{glove:'Mourning gloves',hat:'Crape top hat',hair:'Slicked hair',face:'Gaunt & tired',top:'Frock coat',bottom:'Striped trousers',shoes:'Amber boots',weapon:'Vigil rig'},sexes:['male'],
  note:'The lamp-bearer: tall, thin and quiet, built for a long, stooped man.',
  ranges:{height:[1.0,1.08],build:[0.88,1.0],chest:[0.7,1.05],waist:[0.82,1.0],hips:[0.88,1.05],legs:[1.0,1.14],neck:[1.0,1.2],arms:[0.9,1.15],head:[0.95,1.05],hairLength:[0.8,1.2],hairVolume:[0.9,1.1]},
  setups:[{id:'hollis',name:'Hollis',sex:'male',def:true,note:'The lamp-bearer as drawn: tall, gaunt and long-necked.',v:{height:1.06,build:0.9,chest:0.82,shoulders:0.94,waist:0.88,torso:1.02,legs:1.1,thighs:0.9,arms:1.05,neck:1.12,hands:1.1,feet:1.0,jaw:0.92,chin:1.0,cheeks:0.85,noseSize:1.1,mouthSize:0.9,smile:0.1,hairLength:1.0,hairVolume:0.95}}]};

OUTFITS.hollis=(function(){
  const CRAPE=0x2a2630, PLUM=0x3a3548, AMBER=0xe8a84a, FOG=0x9c9aa6, COLLAR=0xe8e4dc, BRASS=0xb08a3a, HAIR=0x18141a;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a black coat with a plum collar and amber buttons' trim line, white shirt front, trousers with a fog-grey side stripe, black boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(CRAPE); const ax=Math.abs(x); if(y>0.2&&ax<0.03&&z<0) c.set(COLLAR); if(ax<0.034&&z<0&&y>0.03&&y<0.54&&fr(y*22)<0.12) c.set(AMBER); if(y>0.5&&ax<0.06) c.set(COLLAR); if(y>0.545) c.set(COLLAR); return; }
        case 'upperArm': c.set(CRAPE); if(-y>D.upper*0.4&&-y<D.upper*0.47) c.set(PLUM); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.19) c.set(COLLAR); else { c.set(CRAPE); if(y>-0.12&&y<-0.11) c.set(AMBER); } return; }
        case 'thigh': { c.set(PLUM); if(Math.abs(Math.atan2(z,x*sd)-Math.PI*0.5*0)<0.12) c.set(FOG); return; }
        case 'shin': { const t=-y/D.shin; c.set(PLUM); if(Math.abs(Math.atan2(z,x*sd))<0.12) c.set(FOG); if(t<0.04) c.set(AMBER); else if(t>0.16&&t<0.19) c.set(BRASS); return; }
        case 'foot': { c.set(CRAPE); if(y<-D.ankleH+0.012) c.set(0x0d0b10); else if(z<-0.09) c.set(PLUM); return; }
      }
      c.set(CRAPE); };

    /* ---- the hat: a tall flat-topped crown (black with a plum band), a narrow curled brim, an amber buckle on a crape band and a ribbon trailing down the back ---- */
    const tophat=F=>{ const out=[];
      out.push(pc(new THREE.CylinderGeometry(0.1,0.108,0.22,sg(24)).translate(0,0.17,0.004),(x,y,z,c)=>{ c.set(CRAPE); if(y>0.27) c.set(PLUM); else if(y>0.08&&y<0.115) c.set(PLUM); }));
      out.push(pc(new THREE.CylinderGeometry(0.15,0.15,0.01,sg(28)).translate(0,0.062,0.004),(x,y,z,c)=>{ c.set(CRAPE); if(Math.hypot(x,z)>0.14) c.set(PLUM); }));
      out.push(solid(ofRingAt([0,0.105,0.004],[0,1,0],0.1085,0.0075,sg(6)).scale(1,1,1.0),AMBER));
      out.push(pc(vbox(0.03,0.032,0.008,0,0.105,-0.113),(x,y,z,c)=>{ c.set(BRASS); if(Math.abs(x)<0.008&&Math.abs(y-0.105)<0.009) c.set(CRAPE); }));
      out.push(pc(ofRibbon([[0.02,0.1,0.108],[0.04,0.0,0.14],[0.06,-0.12,0.16],[0.05,-0.24,0.15]],u=>0.04*(1-0.3*u),{up:[1,0,0.3],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(CRAPE); if(y<-0.22) c.set(AMBER); }));
      return out; };

    /* ---- the hair: slicked back and long over the collar, parted, with two loose locks ---- */
    const slick=(F,T)=>{ T.crown(0.114,0.6,0.3); T.fringe(4,0.3,0.2); T.sideLocks(0.05); T.backLocks(sg(14),0,21);
      const out=[]; for(const sd of [-1,1]){ const P=[[sd*0.09,0.0,-0.06],[sd*0.1,-0.05,-0.07],[sd*0.098,-0.1,-0.06]]; out.push(solid(sweepTube(P,[0.008,0.007,0.003],sg(5),{cap:'point',rings:sg(8)}),HAIR)); } return out; };

    /* ---- the coat: long tails to the knee, a white stock with a black bow, an arm band of crape, amber buttons ---- */
    const coat=()=>{ const out=[], s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.012;
      for(const sd of [-1,1]){ const rings=[], N=6; for(let i=0;i<=N;i++){ const t=i/N; rings.push({y:lerp(0.0,-0.34,t),rx:s.rx*0.46+0.026+0.03*t,rz:rz*0.7+0.01+0.02*t}); }
        out.push(pc(ofLoft(rings,sg(14),Math.PI*(sd>0?0.72:1.02),Math.PI*(sd>0?0.98:1.28)),(x,y,z,c)=>{ c.set(CRAPE); if(y<-0.32) c.set(PLUM); })); }
      for(let i=0;i<4;i++){ const yd=0.12+i*0.11, q=torsoSize(X,D,yd); out.push(solid(csph(0.0085,sg(7),sg(6)).translate(0.026,yd*TK,-(q.rz+0.008)),AMBER)); }
      out.push(pc(ofRibbon([[-0.02,0.57*TK,-(torsoSize(X,D,0.57).rz+0.012)],[0,0.555*TK,-(torsoSize(X,D,0.55).rz+0.02)],[0.02,0.57*TK,-(torsoSize(X,D,0.57).rz+0.012)]],0.026,{up:[0,0,-1],seg:sg(6),th:0.004}),(x,y,z,c)=>{ c.set(CRAPE); }));
      return out; };

    const GLV={start:0.18,col:0x1d1a22,col2:0x2a2630,trim:AMBER,len:0.1,flare:0.014,fingers:'full',ring:BRASS};
    const addOn=()=>{ const out=[], q=torsoSize(X,D,0.3), z=-(q.rz+0.016);   // a pocket-watch chain and a folded white handkerchief
      out.push(solid(sweepTube([[0.03,0.36*TK,z],[0.07,0.3*TK,z-0.004],[0.08,0.27*TK,z]],[0.0022,0.0022,0.0022],4,{cap:'round',rings:8}),BRASS),
        solid(csph(0.0155,sg(9),sg(7)).scale(1,1,0.45).translate(0.08,0.252*TK,z-0.002),BRASS), solid(csph(0.011,sg(8),sg(6)).scale(1,1,0.4).translate(0.08,0.252*TK,z-0.0075),COLLAR));
      const hz=-(torsoSize(X,D,0.37).rz+0.014);
      out.push(pc(ofRibbon([[-0.085,0.355*TK,hz],[-0.07,0.372*TK,hz-0.004],[-0.052,0.357*TK,hz]],0.03,{up:[0,0,-1],seg:sg(6),th:0.004}),(x,y,z2,c)=>c.set(COLLAR)));
      return out; };
    return {
      main:{glove:0x1d1a22,top:0x2a2630,bottom:0x3a3548,shoes:0x2a2630,hat:0x2a2630}, bootTop:0.04, shinCut:0, boot:true, skinFrom:0.545, hairColor:HAIR, eyeColor:0x7a8aa0,
      eyes:{iris:0.8,hl:1,tilt:-0.2,lash:0.4,h:0.78,browLift:-0.003,browThick:0.9,browAngle:-0.1},
      cuts:{torso:[0.03,0.545],upperArm:[0.4,0.47],foreArm:[0.11/D.fore,0.12/D.fore,0.19/D.fore,0.222/D.fore],thigh:[],shin:[0.04,0.16,0.19]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:CRAPE,trim:0x5a5070,len:0.95,pat:'stitch',mantle:1},aura:{col:AMBER,col2:0xffd9a0,style:'orbit',ring:false,n:6,shape:'mote',deco:'none'}}),
      head:F=>tophat(F),
      hair:(F,T)=>slick(F,T),
      mark:F=>{ const out=[]; for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.028,0.006,0.0009).rotateZ(sd*0.1),sd*0.052,-0.03,0.0008),0x5a5262)); out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.012,0.0036,0.0009),0.0,-0.098,0.0008),0x6a5a60)); return out; },
      torso:()=>coat().concat(addOn()),
      shoulder:sd=>[solid(ofRingAt([0,-0.1,0],[0,1,0],0.05*aw+0.003,0.0045,sg(6)),sd>0?PLUM:AMBER)],
      forearm:sd=>[solid(ofRingAt([0,-0.19,0],[0,1,0],0.0268*aw+0.002,0.003,sg(5)),COLLAR),solid(ofRingAt([0,-0.115,0],[0,1,0],0.0285*aw+0.002,0.0032,sg(5)),AMBER)],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.05,0],[0,1,0],0.056*D.cw+0.002,0.0045,sg(6)),AMBER),solid(vbox(0.014,0.02,0.01,0,-D.shin*0.18,-(0.05*D.cw+0.002)),BRASS));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),0x0d0b10)); return out; },
      dress:{ shape:{sword:'vigilhook',bow:'crapebow',staff:'vigilpole'}, grip:CRAPE, metal:BRASS, wood:0x3a2a22, accent:AMBER,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(AMBER),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.35) c.lerp(ofCol(FOG),0.7); },
        charm:()=>{ const lit=[], glow=[];   // a little hooded lantern on a black cord
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),CRAPE));
          lit.push(pc(cyl(0.012,0.012,0.026,6).translate(0,-0.046,0.004),(x,y,z,c)=>{ c.set(BRASS); }),solid(cyl(0.004,0.016,0.012,6).translate(0,-0.03,0.004),CRAPE),solid(cyl(0.016,0.012,0.006,6).translate(0,-0.062,0.004),CRAPE));
          glow.push(pc(csph(0.0072,6,5).translate(0,-0.046,0.004),(x,y,z,c)=>c.set(0xffcf7a)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.hollis=oxPlus(OUTFITS.hollis,(X,D)=>({   // round 4: a long jet-bead rosary with amber beads, black mourning ribbon tails at the belt
  torso:()=>oxBeads(X,D,{col:0x1d1a22,col2:0xe6a44a,n:24,r:0.014,drop:0.34}),
  hips:()=>oxSash(X,D,{col:0x2a2630,col2:0xe6a44a,len:1.3,side:1})}));
oxTune('hollis',{jaw:1.0,cheeks:0.72,eyeSize:0.92,brow:0.3,lips:0.75,undertone:-0.3,blush:0.0,smile:0.0,earSize:1.1});
OUTFITS.hollis=oxPlus(OUTFITS.hollis,(X,D)=>({   // face round 4: a mourner's hollow face: deep bags, one tear, an amber earring, long grey locks over the collar
  mark:F=>oxMarks(F,[{t:'bags',col:0x6a5a70},{t:'tear',side:1,col:0xbfc8d8}]),
  hair:()=>oxHairBits(X,[{t:'ring',side:1,col:0xe6a44a},{t:'locks',len:0.3,col:0x8a8494}]),
  kit:{eyeColor:0xe6a44a,eyes:{iris:0.85,lash:0.2}}}));
oxTune('hollis',{height:1.08,build:0.88,chest:0.62,shoulders:0.9,waist:0.84,torso:1.07,legs:1.12,thighs:0.86,arms:1.22,neck:1.2,head:0.92,hands:1.2,feet:1.1});
OUTFITS.hollis=oxPlus(OUTFITS.hollis,(X,D)=>({   // uniqueness round 1: a lanky stooped giant with a lamp pole strapped across his back and a long crape veil from the hat
  torso:()=>oxPole(X,D,{col:0x6a4a2a,frame:0xc59c39,glow:0xffc060,len:0.6}),
  head:()=>oxVeil(X,D,{col:0x1d1a22,col2:0x8a8494,len:0.9,w:0.11})}));
