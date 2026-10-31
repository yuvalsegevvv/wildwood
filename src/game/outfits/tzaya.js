//@ Tzaya's outfit (a jungle-city calendar-priest): a gold headband with a jade disc under a fan of green and red feathers, close-cropped black hair with jade ear spools, red glyph marks and narrow ember eyes, a wide jade collar over a bare chest with a red sash, a cotton loin-wrap with long front and back flaps, jade-cuffed sandals, and the obsidian-blade weapon dressing
/* ---------- Tzaya: grinder, fire. Design: docs/skillkits/looks/tzaya.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: jade 0x2f8a5a, calendar gold 0xd8b040, cinder red 0xb83a28, ember 0xff7a3a, cotton 0xe8dcc0, obsidian 0x15131a. Silhouette: a bare-chested priest under a tall back-swept feather fan, a broad jade collar at the shoulders
   and two long flaps at the hips. Every part has at least two colours (jade and gold at the least); the emblem is a count-ring and a flame, never a skull or a heart. */
CHAR_MODELS.tzaya={id:'tzaya',name:'Tzaya',signature:true, hairGrad:{mode:'roots',c2:0x4a2a1a}, items:{hat:'Feather fan crown',hair:'Priest crop',face:'Glyph marks',top:'Jade collar & red sash',bottom:'Flap loin-wrap',shoes:'Jade sandals',weapon:'Obsidian rig'},sexes:['male'],
  note:'The calendar-priest: tall, lean-muscled and upright, built for a man who stands through a long ceremony.',
  ranges:{height:[1.0,1.08],build:[0.95,1.1],chest:[0.8,1.2],waist:[0.82,1.0],hips:[0.9,1.1],legs:[1.0,1.14],neck:[0.95,1.15],arms:[0.95,1.15],head:[0.95,1.05],hairLength:[0.8,1.1],hairVolume:[0.9,1.1]},
  setups:[{id:'tzaya',name:'Tzaya',sex:'male',def:true,note:'The priest as drawn: tall, lean and straight-backed.',v:{height:1.06,build:1.0,chest:1.0,shoulders:1.02,waist:0.88,torso:1.04,legs:1.06,thighs:0.96,arms:1.06,neck:1.1,hands:1.04,feet:1.0,jaw:1.08,chin:1.05,cheeks:0.9,noseSize:1.15,mouthSize:0.95,smile:0.0,hairLength:0.9,hairVolume:0.95}}]};

OUTFITS.tzaya=(function(){
  const JADE=0x2f8a5a, TEAL=0x3ac0a0, GOLD=0xd8b040, CINDER=0xb83a28, EMBER=0xff7a3a, COTTON=0xe8dcc0, OBS=0x15131a, HAIR=0x100c0c;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a bare chest, a red sash band at the belly with a gold edge, a red hip band on each thigh, bare shins, sandals' dark cords on the foot ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { if(y<0.03){ c.set(COTTON); return; } skinPaint(c); if(y<0.1){ c.set(CINDER); if(y>0.085) c.set(GOLD); } return; }
        case 'upperArm': skinPaint(c); return;
        case 'foreArm': { skinPaint(c); const t=-y/D.fore; if(t>0.78&&t<0.9){ c.set(COTTON); if(t>0.83&&t<0.85) c.set(CINDER); } return; }
        case 'thigh': { const t=-y/D.thigh; if(t<0.09){ c.set(CINDER); if(t>0.07) c.set(GOLD); } else skinPaint(c); return; }
        case 'shin': skinPaint(c); return;
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.012) c.set(OBS); else if(fr(z*16)<0.16&&z<0.02&&z>-0.12) c.set(OBS); return; }
      }
      c.set(COTTON); };

    /* ---- the crown: a gold band with a jade disc over the brow, a fan of nine green feathers tipped red rising back and up ---- */
    const crown=F=>{ const out=[];
      out.push(solid(ofRingAt([0,0.052,0.006],[0,1,0],0.125,0.0095,sg(10)),GOLD),solid(ofRingAt([0,0.04,0.006],[0,1,0],0.124,0.0042,sg(8)),CINDER));
      out.push(solid(csph(1,sg(10),sg(7)).scale(0.026,0.026,0.008).translate(0,0.056,-0.12),JADE),solid(csph(1,sg(8),sg(6)).scale(0.011,0.011,0.009).translate(0,0.056,-0.126),CINDER),solid(ofRingAt([0,0.056,-0.121],[0,0,1],0.027,0.0035,sg(8)),GOLD));
      for(let i=0;i<9;i++){ const ang=(i-4)/4*0.95, len=0.15+0.09*(1-Math.abs(ang)/0.95), g=pc(csph(1,sg(8),sg(6)).scale(0.0125,len*0.5,0.004).translate(0,len*0.5,0),(x,y,z,c)=>{ c.set(i%2?TEAL:JADE); if(y>len*0.78) c.set(CINDER); if(Math.abs(x)<0.002) c.multiplyScalar(1.25); });
        g.rotateZ(ang); g.rotateX(0.5); g.translate(0,0.07,0.085); out.push(g); }
      return out; };

    /* ---- the hair: cropped close and black, a short tail at the nape, the temples shaved a little ---- */
    const crop=(F,T)=>{ T.crown(0.113,0.55,0.25); T.fringe(3,0.3,0.15); T.sideLocks(0.03); T.backLocks(sg(10),0,13);
      const out=[]; for(const sd of [-1,1]){ out.push(solid(cyl(0.0175,0.0175,0.012,sg(10)).rotateZ(Math.PI/2).translate(sd*0.107,-0.034,0.004),JADE),solid(cyl(0.008,0.008,0.014,sg(8)).rotateZ(Math.PI/2).translate(sd*0.109,-0.034,0.004),GOLD)); }   // the jade ear spools
      return out; };

    /* ---- the face: a red bar under each eye, a ring of four red dots on the right cheek (the count) and a gold brow line ---- */
    const face=F=>{ const out=[];
      for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.03,0.0042,0.0009).rotateZ(sd*0.1),sd*0.05,-0.032,0.0008),CINDER));
      for(const [x,y] of [[0.058,-0.052],[0.066,-0.058],[0.074,-0.052],[0.066,-0.046]]) out.push(solid(F.place(csph(0.0034,sg(6),sg(5)),x,y,0.0008),CINDER));
      out.push(solid(F.place(csph(0.0034,sg(6),sg(5)),0.066,-0.052,0.0008),GOLD));
      for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.02,0.0028,0.0009).rotateZ(sd*-0.15),sd*0.044,0.021,0.0008),GOLD));
      return out; };

    /* ---- the chest: a wide jade collar's gold clasp and a knotted red sash end hanging from the belly ---- */
    const sashEnd=()=>{ const out=[], s=torsoSize(X,D,0.07), rz=Math.max(s.rz,s.rzBack)+0.012;
      out.push(solid(csph(0.022,sg(8),sg(6)).translate(0.07,0.07*TK,-(s.rz+0.012)),CINDER));
      for(const [i,dx] of [[0,0.012],[1,-0.012]]) out.push(pc(ofRibbon([[0.07+dx,0.07*TK,-(s.rz+0.02)],[0.075+dx,0.0,-(s.rz+0.026)],[0.08+dx,-0.14-0.03*i,-(s.rz+0.03)]],0.034,{up:[0,0,-1],seg:sg(8),th:0.004}),(x,y,z,c)=>{ c.set(CINDER); if(y<-0.1-0.03*i) c.set(GOLD); }));
      out.push(solid(ofRingAt([0,0.03*TK,0],[0,1,0],Math.max(torsoSize(X,D,0.03).rx,rz)+0.008,0.006,sg(8)),GOLD));
      return out; };

    const GLV={start:0.2,col:COTTON,col2:CINDER,trim:GOLD,len:0.08,flare:0.008,fingers:'full'};
    return {
      main:{glove:COTTON,top:JADE,bottom:COTTON,shoes:OBS,hat:JADE}, bootTop:1.1, shinCut:0, boot:false, skinFrom:0.5, hairColor:HAIR, eyeColor:0xd89030,
      eyes:{iris:0.9,hl:1,tilt:-0.15,lash:0.5,h:0.8,browLift:-0.002,browThick:1.1,browAngle:-0.2},
      cuts:{torso:[0.03,0.085,0.1],upperArm:[],foreArm:[0.78,0.83,0.85,0.9],thigh:[0.07,0.09],shin:[]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:JADE,trim:GOLD,len:0.75,pat:'flames',mantle:0},aura:{col:EMBER,col2:GOLD,style:'rise',ring:false,n:10,shape:'flame',deco:'none'}}),
      head:F=>crown(F),
      hair:(F,T)=>crop(F,T),
      mark:F=>face(F),
      torso:()=>sashEnd().concat(oxMantle(X,D,{cols:[JADE,TEAL,GOLD,CINDER],flat:true,out:0.07,trim:GOLD})),
      hips:()=>oxTabard(X,D,{col:COTTON,col2:CINDER,len:0.44,flare:0.12,half:0.4}),
      shoulder:sd=>[solid(ofRingAt([0,-0.1,0],[0,1,0],0.05*aw+0.003,0.0055,sg(6)),GOLD),solid(csph(0.008,sg(6),sg(5)).translate(sd*0.05*aw,-0.1,0),JADE)],
      forearm:sd=>[solid(ofRingAt([0,-0.19,0],[0,1,0],0.0268*aw+0.002,0.0035,sg(5)),CINDER),solid(ofRingAt([0,-0.17,0],[0,1,0],0.0275*aw+0.002,0.0028,sg(5)),GOLD)],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.88,0],[0,1,0],0.043*D.cw+0.003,0.0055,sg(6)),JADE),solid(ofRingAt([0,-D.shin*0.8,0],[0,1,0],0.045*D.cw+0.003,0.0035,sg(6)),GOLD));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),OBS)); return out; },
      dress:{ shape:{sword:'macuahuitl',bow:'reedbow',staff:'copalstaff'}, grip:CINDER, metal:0x1a1820, wood:0x3a2a22, accent:JADE, glow:EMBER,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(GOLD),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(GOLD),0.8); },
        charm:()=>{ const lit=[], glow=[];   // a little copal burner on a cord: a gold bowl with a jade rim and a live ember
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),CINDER));
          lit.push(solid(cyl(0.016,0.009,0.016,8).translate(0,-0.038,0.004),GOLD),solid(ofRingAt([0,-0.03,0.004],[0,1,0],0.016,0.0025,6),JADE));
          glow.push(pc(csph(0.0085,6,5).translate(0,-0.034,0.004),(x,y,z,c)=>c.set(EMBER)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('tzaya',{jaw:1.08,cheeks:0.9,eyeSize:0.9,brow:0.8,lips:0.8,undertone:0.3,blush:0.0,smile:0.0,earSize:1.0});
OUTFITS.tzaya=oxPlus(OUTFITS.tzaya,(X,D)=>({   // silhouette: a gold calendar wheel on the back with ten rays, a red rim and a jade boss
  torso:()=>oxDisc(X,D,{col:0xd8b040,rim:0xb83a28,boss:0x2f8a5a,R:0.15,y:0.34,rays:10,ray:0xd8b040})}));
