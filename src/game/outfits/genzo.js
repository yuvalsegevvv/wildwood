//@ Genzo's outfit (a temple gate-keeper): a white headband with a bronze plate, a cropped head with a knot, bushy brows and a scar, a vermilion robe with a white collar, a rope belt with a bronze bell and bronze shoulder guards, wide dark trousers and straw sandals, and the bell-mallet weapon dressing
/* ---------- Genzo: tank, air. Design: docs/skillkits/looks/genzo.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: vermilion 0xb8452a, bronze 0xd2a24a, cloud white 0xf3ead2, ink 0x2a2020, straw 0xc8a860. Silhouette: a broad body in a straight robe, a heavy belt with a bell, wide trouser legs over flat sandals, a plain bound head.
   Every part has at least two colours (vermilion and white at the least); the emblem is a bell, never a wheel or a lotus. */
CHAR_MODELS.genzo={id:'genzo',name:'Genzo',signature:true, items:{glove:'Bound fists',hat:'Bronze headband',hair:'Cropped knot',face:'Bushy brows & scar',top:'Gate robe',bottom:'Wide trousers',shoes:'Straw sandals',weapon:'Bell rig'},sexes:['male'],
  note:'The gate-keeper: broad, steady and unhurried, built for a heavy-shouldered man.',
  ranges:{height:[0.98,1.08],build:[1.0,1.18],chest:[0.9,1.35],waist:[0.9,1.15],hips:[0.92,1.2],legs:[0.92,1.08],neck:[0.95,1.2],arms:[0.95,1.25],head:[0.95,1.1],hairLength:[0.7,1.1],hairVolume:[0.9,1.15]},
  setups:[{id:'genzo',name:'Genzo',sex:'male',def:true,note:'The gate-keeper as drawn: broad, thick-necked and calm.',v:{height:1.04,build:1.1,chest:1.15,shoulders:1.12,waist:1.02,torso:1.0,legs:0.98,thighs:1.1,arms:1.12,neck:1.1,hands:1.1,feet:1.05,jaw:1.1,chin:1.05,cheeks:1.0,noseSize:1.05,mouthSize:1.0,smile:0.3,hairLength:0.85,hairVolume:1.0}}]};

OUTFITS.genzo=(function(){
  const VERM=0xb8452a, VERM_D=0x8a3220, BRONZE=0xd2a24a, BRONZE_D=0x9a7430, WHITE=0xf3ead2, INK=0x2a2020, STRAW=0xc8a860, STEEL=0xc9ccd4, HAIR=0x1d1816;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a vermilion robe with a white crossed collar and dark seams, white wrist wraps, dark trousers with white cuffs, bare feet ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(VERM); if(y>0.5&&Math.abs(x+z*0.35*(x>0?1:-1))<0.17&&y<0.585) { const e=Math.abs(Math.abs(x)-(0.57-y)*0.9); if(e<0.022) c.set(WHITE); } if(y>0.03&&y<0.07) c.set(INK); if(fr(y*28)<0.04) c.multiplyScalar(0.9); return; }
        case 'upperArm': c.set(VERM); if(-y>D.upper*0.78) c.set(WHITE); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.12){ c.set(WHITE); if(fr(y*40)<0.12) c.set(0xd8cfb4); } else c.set(VERM); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(INK); if(fr(t*5+Math.atan2(z,x*sd)*1.2)<0.05) c.set(0x3a3030); return; }
        case 'shin': { const t=-y/D.shin; c.set(INK); if(t>0.78&&t<0.86) c.set(WHITE); else if(t>=0.86) skinPaint(c); return; }
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.012) c.set(STRAW); else if(z<-0.08&&z>-0.1) c.set(VERM); return; }
      }
      c.set(VERM); };

    /* ---- the headband: a white cloth round the brow with a bronze plate and two trailing ends ---- */
    const headband=F=>{ const out=[]; out.push(solid(ofRingAt([0,0.045,0.006],[0,1,0.12],0.112,0.0085,sg(8)).scale(1,1,1.04),WHITE));
      out.push(pc(new THREE.BoxGeometry(0.06,0.032,0.006).translate(0,0.045,-0.118),(x,y,z,c)=>{ c.set(BRONZE); if(Math.abs(x)>0.024||Math.abs(y-0.045)>0.011) c.set(BRONZE_D); }));
      for(const sd of [-1,1]) out.push(pc(ofRibbon([[sd*0.016,0.03,0.113],[sd*0.03,-0.04,0.13],[sd*0.04,-0.13,0.13],[sd*0.05,-0.22,0.12]],u=>0.045*(1-0.3*u),{up:[sd,0,0.4],seg:sg(12),th:0.003}),(x,y,z,c)=>{ c.set(WHITE); if(y<-0.2) c.set(VERM); }));
      return out; };

    /* ---- the hair: a close crop with a small knot on top bound with a bronze ring ---- */
    const knot=(F,T)=>{ T.crown(0.108,0.4,0.2); T.fringe(5,0.5,0.1); T.sideLocks(0.02); T.backLocks(sg(10),0,11);
      T.add(csph(0.034,sg(10),sg(8)).scale(1,1.15,1).translate(0,0.126*F.fs[1]/1,0.005),(x,y,z,c)=>{ T.hp(x,y,z,c); });
      return [solid(ofRingAt([0,0.108,0.005],[0,1,0],0.03,0.0042,sg(6)),BRONZE)]; };

    /* ---- the belt: a thick rope belt (ink and white strands) with a bronze bell and a tail, bronze shoulder guards ---- */
    const belt=()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.012, out=[];
      out.push(pc(ofLoft([{y:0.07*TK,rx:s.rx+0.012,rz},{y:0.065*TK,rx:s.rx+0.018,rz:rz+0.006},{y:0.0,rx:s.rx+0.016,rz:rz+0.006},{y:-0.005,rx:s.rx+0.012,rz}],sg(36),0,TAU),(x,y,z,c)=>{ c.set(INK); const a=Math.atan2(x,z); if(fr(a*14/TAU*2+y*30)<0.3) c.set(WHITE); }));
      out.push(pc(new THREE.LatheGeometry([[0,0.0],[0.012,0.0],[0.022,-0.018],[0.034,-0.046],[0.038,-0.06]].map(p=>new THREE.Vector2(p[0],p[1])),sg(10)).translate(0,0.0,0),(x,y,z,c)=>{ c.set(BRONZE); if(y<-0.054) c.set(BRONZE_D); }).translate(-0.05,-0.005,-rz-0.03));
      out.push(solid(csph(0.008,6,5).translate(-0.05,-0.068,-rz-0.03),BRONZE_D));
      out.push(pc(ofRibbon([[0.06,0.02,-rz-0.01],[0.07,-0.1,-rz-0.016],[0.075,-0.24,-rz-0.01]],0.03,{up:[0,0,-1],seg:sg(10),th:0.004}),(x,y,z,c)=>{ c.set(WHITE); if(y<-0.22) c.set(VERM); }));
      return out; };

    const GLV={start:0.17,col:WHITE,col2:0xe0d4b4,trim:BRONZE,len:0.07,flare:0.002,studs:true,fingers:'bare'};
    const addOn=()=>{ const out=[], q=torsoSize(X,D,0.36), z=-(q.rz+0.012);   // a white crest on the chest and a zigzag of paper hung from the belt
      out.push(pc(new THREE.CylinderGeometry(0.034,0.034,0.004,sg(18)).rotateX(Math.PI/2).translate(0.0,0.37*TK,z-0.002),(x,y,z2,c)=>{ c.set(WHITE); const r=Math.hypot(x,y-0.37*TK); if(r>0.026) c.set(BRONZE); }),
        solid(new THREE.BoxGeometry(0.008,0.034,0.005).translate(0,0.37*TK,z-0.0045),VERM_D),solid(new THREE.BoxGeometry(0.034,0.008,0.005).translate(0,0.378*TK,z-0.0045),VERM_D));
      const bz=-(torsoSize(X,D,0.03).rz+0.03);
      for(let i=0;i<4;i++) out.push(pc(new THREE.BoxGeometry(0.03,0.022,0.003).translate(-0.12+(i%2?0.012:-0.004),-0.01-i*0.022,bz),(x,y,z2,c)=>c.set(WHITE)));
      return out; };
    return {
      aura:{col:0xd24a3a,col2:0xf3ead2,style:'fall',ring:false,n:6,shape:'petal',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{glove:0xf3ead2,top:0xb8452a,bottom:0x2a2020,shoes:0xc8a860,hat:0xf3ead2}, bootTop:1.1, shinCut:9, boot:false, skinFrom:0.585, hairColor:HAIR, eyeColor:0x4a3020,
      eyes:{iris:0.95,hl:1,tilt:0.05,lash:0.4,h:0.85,browLift:0.0,browThick:1.7,browAngle:0.1},
      cuts:{torso:[0.03,0.07],upperArm:[0.78],foreArm:[0.12/D.fore,0.222/D.fore],thigh:[],shin:[0.78,0.86]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      head:F=>headband(F),
      hair:(F,T)=>knot(F,T),
      mark:F=>{ const out=[]; out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.0014,0.034,0.0008).rotateZ(-0.35),-0.05,0.01,0.0008),0xe0b8a0)); return out; },
      torso:()=>belt().concat(addOn()),
      shoulder:sd=>{ const out=[], r=0.062*aw; out.push(pc(new THREE.SphereGeometry(r,sg(16),sg(9),0,TAU,0,Math.PI*0.55).scale(1.1,0.75,1.1).translate(0,0.004,0),(x,y,z,c)=>{ c.set(BRONZE); c.multiplyScalar(0.9+0.2*Math.max(0,y*12)); if(y<0.004) c.set(BRONZE_D); }));
        out.push(solid(ofRingAt([0,-0.03,0],[0,1,0],r*0.95,0.005,sg(6)),VERM)); return out; },
      forearm:sd=>[solid(ofRingAt([0,-0.12,0],[0,1,0],0.0295*aw+0.001,0.0035,sg(6)),BRONZE)],
      thigh:sd=>{ const tw=D.tw, st=[[0,0.105*tw,0.108*tw],[0.3,0.125*tw,0.125*tw],[0.7,0.13*tw,0.13*tw],[1,0.12*tw,0.12*tw]];
        return [pc(limb(st,D.thigh,sg(18),sg(14),{cuts:[],openTop:true,cap:2}),(x,y,z,c)=>{ paint('thigh',c,x,y,z,sd); })]; },
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.82,0],[0,1,0],0.05*D.cw+0.004,0.004,sg(6)),VERM));
        out.push(solid(vbox(0.06*(0.55+0.45*S.feet),0.01,0.12,0,-D.shin-D.ankleH+0.005,0.02),STRAW)); out.push(solid(ofRingAt([0,-D.shin-D.ankleH+0.012,0.02],[0,1,0],0.032*D.cw+0.004,0.003,sg(5)),VERM)); return out; },
      dress:{ shape:{sword:'bellmallet',bow:'bamboo',staff:'shakujo'}, grip:VERM_D, metal:BRONZE, wood:0x6a4a2a, accent:BRONZE,
        trim:(c,u,part)=>{ const f=((u/0.08)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.12) c.lerp(ofCol(WHITE),0.85); if(part==='grip'&&((u/0.014)%1+1)%1<0.4) c.lerp(ofCol(INK),0.7); },
        charm:()=>{ const lit=[], glow=[];   // a small bronze bell on a red cord
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),VERM));
          lit.push(pc(new THREE.LatheGeometry([[0,0],[0.006,0],[0.012,-0.012],[0.018,-0.028],[0.02,-0.034]].map(p=>new THREE.Vector2(p[0],p[1])),8).translate(0,-0.022,0.004),(x,y,z,c)=>{ c.set(BRONZE); if(y<-0.05) c.set(BRONZE_D); }));
          lit.push(solid(csph(0.004,5,4).translate(0,-0.06,0.004),BRONZE_D));
          glow.push(pc(csph(0.0034,6,5).translate(0.004,-0.05,0.018),(x,y,z,c)=>c.set(0xf3ead2)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.genzo=oxPlus(OUTFITS.genzo,(X,D)=>({   // round 5: a heavy bronze prayer-bead necklace, a gate-keeper's wind mantle (vermilion with white rays), a bronze plate on the left shoulder
  torso:()=>oxBeads(X,D,{col:0xd2a24a,col2:0xb8452a,n:22,r:0.017,drop:0.26}),
  shoulder:sd=>sd<0?oxPauldron(X,D,{col:0xd2a24a,trim:0xf3ead2,r:0.075}):[],
  cos:{cape:{col:0xb8452a,trim:0xf3ead2,len:0.5,pat:'rays',mantle:1}}}));
oxTune('genzo',{jaw:1.2,chin:1.15,brow:0.9,eyeSize:0.95,eyeTilt:-0.1,noseSize:1.15,lips:0.9,smile:-0.2,earSize:1.15,undertone:0.3});
OUTFITS.genzo=oxPlus(OUTFITS.genzo,(X,D)=>({   // face round 2: a stern square jaw, gold earrings, dark amber eyes, a white streak in the hair
  mark:F=>oxMarks(F,[{t:'crow',col:0x8a6a50}]),
  hair:()=>oxHairBits(X,[{t:'ring',both:true,col:0xd2a24a}]),
  kit:{eyeColor:0x8a5a28}}));
Object.assign(CHAR_MODELS.genzo,{hairGrad:{mode:'streak',c2:0xe8e2d4}});
