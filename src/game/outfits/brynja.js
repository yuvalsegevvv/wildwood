//@ Brynja's outfit (an ice-skater and frost-hunter): a fur-rimmed slate hood with ice-blue stitching, two long white braids and frost freckles, a quilted jacket with a fur collar, a short pleated skirt with a fur hem, leggings and skate boots with a blade under each sole, and the skate-blade weapon dressing
/* ---------- Brynja: risk DPS, water. Design: docs/skillkits/looks/brynja.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: ice 0x6fb4e0, snow 0xeaf4fb, slate 0x3c4a5a, fur 0xb8a890, steel 0xc9d4dc. Silhouette: a hooded head with two long braids, a fitted jacket, a short flared skirt, long slim legs ending in blades.
   Every part has at least two colours (slate and ice at the least); the emblem is a six-armed frost cross, never a snowflake copied from a brand. */
CHAR_MODELS.brynja={id:'brynja',name:'Brynja',signature:true, hairGrad:{mode:'ombre',c2:0x8ac4ee,c3:0xb9a8f0}, items:{glove:'Fur-cuff mittens',hat:'Fur-rim hood',hair:'Twin frost braids',face:'Frost freckles',top:'Quilted jacket',bottom:'Pleated skirt',shoes:'Skate boots',weapon:'Skate rig'},sexes:['female'],
  note:'The skater: long-legged, quick and light, built for a tall slim woman.',
  ranges:{height:[0.98,1.08],build:[0.88,1.02],chest:[0.7,1.2],waist:[0.82,1.0],hips:[0.9,1.15],legs:[1.02,1.14],neck:[0.95,1.2],arms:[0.85,1.1],head:[0.95,1.08],hairLength:[1.0,1.35],hairVolume:[0.9,1.2]},
  setups:[{id:'brynja',name:'Brynja',sex:'female',def:true,note:'The skater as drawn: tall, light and long in the leg.',v:{height:1.05,build:0.92,chest:0.92,shoulders:0.96,waist:0.88,torso:0.98,legs:1.1,thighs:0.94,arms:0.95,neck:1.05,hands:0.95,feet:0.95,jaw:0.95,chin:0.98,cheeks:1.0,noseSize:0.95,mouthSize:1.0,smile:0.4,hairLength:1.2,hairVolume:1.05}}]};

OUTFITS.brynja=(function(){
  const ICE=0x6fb4e0, ICE_D=0x4a86b0, SNOW=0xeaf4fb, SLATE=0x3c4a5a, SLATE_D=0x2a3440, FUR=0xb8a890, STEEL=0xc9d4dc, HAIR=0xe8e2d4;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a slate quilted jacket (ice diamond stitching, snow cuffs), slate leggings with an ice stripe, white-trimmed boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(SLATE); const d=Math.abs(fr(x*30+y*30)-0.5)+Math.abs(fr(x*30-y*30)-0.5); if(d<0.14&&y>0.07&&y<0.52) c.set(SLATE_D); if(y>0.03&&y<0.07) c.set(ICE); if(y>0.545) c.set(FUR); return; }
        case 'upperArm': c.set(SLATE); if(fr(y*22)<0.08) c.set(ICE); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.15) c.set(SNOW); else { c.set(SLATE); if(y>-0.148&&y<-0.138) c.set(ICE); } return; }
        case 'thigh': { const t=-y/D.thigh; c.set(SLATE); if(t>0.85) c.set(FUR); else if(Math.abs(Math.atan2(z,x*sd))<0.12) c.set(ICE); return; }
        case 'shin': { const t=-y/D.shin; c.set(SLATE); if(Math.abs(Math.atan2(z,x*sd))<0.12) c.set(ICE); if(t<0.04) c.set(FUR); else if(t>0.5&&t<0.54) c.set(SNOW); return; }
        case 'foot': { c.set(SNOW); if(y<-D.ankleH+0.012) c.set(SLATE_D); else if(z<-0.09) c.set(ICE); return; }
      }
      c.set(SLATE); };

    /* ---- the hood: a slate dome with ice stitching, a thick fur rim round the face and a pointed tail at the back ---- */
    const hood=F=>{ const out=[], R=0.134, H=0.15, y0=0.04, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.01}];
      for(let i=0;i<=9;i++){ const t=lerp(0.2,t1,i/9); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.06,zc:0.012}); }
      out.push(pc(ofLoft(rings,sg(36),0,TAU),(x,y,z,c)=>{ c.set(SLATE); const a=Math.atan2(x,z+0.012); if(Math.abs(fr(a*5/TAU*2)-0.5)<0.03) c.set(ICE); if(y<0.005) c.set(ICE_D); }));
      out.push(pc(new THREE.TorusGeometry(0.118,0.026,sg(8),sg(28),Math.PI*1.5).rotateZ(Math.PI*0.75).translate(0,0.0,-0.05),(x,y,z,c)=>{ c.set(FUR); c.multiplyScalar(0.88+0.2*fr(x*90+y*70)); }));
      out.push(pc(new THREE.ConeGeometry(0.05,0.2,sg(8)).rotateX(Math.PI*0.6).translate(0,0.02,0.16),(x,y,z,c)=>{ c.set(SLATE); if(z>0.2) c.set(FUR); }));
      return out; };

    /* ---- the hair: two long white braids over the shoulders, tied with ice-blue ribbons ---- */
    const braids=(F,T)=>{ T.crown(0.113,0.55,0.3); T.fringe(7,0.9,0.1); T.sideLocks(0.03); T.backLocks(sg(10),0,17); const out=[];
      for(const sd of [-1,1]){ const P=[], len=0.36*T.hl; for(let i=0;i<=10;i++){ const t=i/10; P.push([sd*(0.085-0.02*t),-0.04-len*t,0.045+0.045*Math.sin(t*2.2)]); }
        T.add(sweepTube(P,[0.02,0.024,0.024,0.021,0.016,0.003],sg(8),{cap:'point',rings:sg(30)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.92+0.1*Math.sin(y*150)); });
        for(const t of [0.1,0.9]){ const p=P[Math.round(t*10)], q=P[Math.min(10,Math.round(t*10)+1)]; out.push(solid(ofRingAt(p,[q[0]-p[0],q[1]-p[1],q[2]-p[2]],0.0235*(1-0.3*t),0.0045,sg(6)),ICE)); } }
      return out; };

    /* ---- the collar, a silver pin, and a quilted fur shoulder cape on the right ---- */
    const collar=()=>{ const r=[]; for(const [yd,k] of [[0.6,1.0],[0.57,1.05],[0.54,1.12]]) r.push({y:yd*TK,rx:D.neckR*1.55*k+0.006,rz:D.neckR*1.55*k+0.006,zc:-0.002});
      return [pc(ofLoft(r,sg(24),0,TAU),(x,y,z,c)=>{ c.set(FUR); c.multiplyScalar(0.88+0.2*fr(x*80+z*60+y*40)); })]; };

    const GLV={start:0.16,col:SNOW,col2:ICE,trim:FUR,len:0.08,flare:0.016,fingers:'mitt'};
    return {
      main:{glove:0xeaf4fb,top:0x3c4a5a,bottom:0x6fb4e0,shoes:0xeaf4fb,hat:0x3c4a5a}, bootTop:0.04, shinCut:0, boot:true, skinFrom:0.6, hairColor:HAIR, eyeColor:0x4aa0d8,
      eyes:{iris:1.1,hl:2,tilt:0.15,lash:1.1,browLift:0.002,browThick:0.8,h:0.95},
      cuts:{torso:[0.03,0.07,0.545],upperArm:[],foreArm:[0.15/D.fore,0.222/D.fore],thigh:[0.85],shin:[0.04,0.5,0.54]},
      paint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      extras:(rig,XX,has)=>ofCosmetics(rig,XX,has,{cape:{col:SLATE,trim:FUR,len:0.7,pat:'fur',mantle:1},aura:{col:0xbfe3f5,col2:0xffffff,style:'orbit',ring:false,n:10,shape:'flake',deco:'none'}}),
      head:F=>hood(F),
      hair:(F,T)=>braids(F,T),
      mark:F=>{ const out=[]; for(let i=0;i<5;i++){ const sd=i%2?1:-1; out.push(solid(F.place(csph(0.0032,sg(6),sg(5)),sd*(0.04+0.006*i),-0.026-0.004*(i%3),0.0008),0xbfe3f5)); } return out; },
      torso:()=>collar(),
      shoulder:sd=>[solid(ofRingAt([0,-0.045,0],[0,1,0],0.05*aw+0.002,0.006,sg(6)),sd>0?FUR:ICE)],
      forearm:sd=>[solid(ofRingAt([0,-0.15,0],[0,1,0],0.0285*aw+0.002,0.004,sg(6)),FUR)],
      hips:()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.012, rings=[], N=7;
        for(let i=0;i<=N;i++){ const t=i/N; rings.push({y:lerp(0.04,-0.17,t),rx:s.rx+0.012+0.075*t,rz:rz+0.01+0.07*t}); }
        return [pc(ofLoft(rings,sg(44),0,TAU),(x,y,z,c)=>{ c.set(SLATE); const a=Math.atan2(x,z); if(fr(a*16/TAU)<0.12) c.set(SLATE_D); if(y<-0.15) c.set(FUR); else if(y>0.03) c.set(ICE); })]; },
      shin:sd=>{ const out=[]; const L=0.2*(0.55+0.45*S.feet); out.push(solid(ofRingAt([0,-D.shin*0.05,0],[0,1,0],0.055*D.cw+0.002,0.005,sg(6)),FUR));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),SLATE_D));
        out.push(solid(vbox(0.01,0.026,L*1.25,0,-D.shin-D.ankleH-0.012,0.03),STEEL)); out.push(solid(vbox(0.006,0.016,0.012,0,-D.shin-D.ankleH-0.002,0.03-L*0.55),STEEL),solid(vbox(0.006,0.016,0.012,0,-D.shin-D.ankleH-0.002,0.03+L*0.55),STEEL)); return out; },
      dress:{ shape:{sword:'skate',bow:'icebow',staff:'icicle'}, grip:SLATE_D, metal:STEEL, wood:0x5a6a7a, accent:ICE,
        trim:(c,u,part)=>{ const f=((u/0.06)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.13) c.lerp(ofCol(SNOW),0.85); if(part==='grip'&&((u/0.011)%1+1)%1<0.4) c.lerp(ofCol(ICE),0.85); },
        charm:()=>{ const lit=[], glow=[];   // an ice crystal on a fur-tied cord
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),FUR));
          lit.push(pc(new THREE.OctahedronGeometry(0.014,0).scale(0.7,1.5,0.7).translate(0,-0.045,0.004),(x,y,z,c)=>{ c.set(ICE); if(y>-0.04) c.set(SNOW); }));
          lit.push(solid(csph(0.007,6,5).translate(0.012,-0.07,0.004),SNOW));
          glow.push(pc(csph(0.0036,6,5).translate(0,-0.045,0.016),(x,y,z,c)=>c.set(0xb8e6ff)));
          return {lit,glow}; } },
    };
  };
})();
oxTune('brynja',{eyeSize:1.12,lips:0.95,undertone:-0.4,blush:0.7,cheeks:1.05,smile:0.3,earSize:1.0});
OUTFITS.brynja=oxPlus(OUTFITS.brynja,(X,D)=>({   // face round 5: frost-pale skin with cold-pinched cheeks and snow freckles, ice beads and two long pale locks under the hood
  mark:F=>oxMarks(F,[{t:'cheek',col:0xe8a0b0},{t:'freckles',col:0xa8b8d0}]),
  hair:()=>oxHairBits(X,[{t:'beads',both:true,col:0xeaf4fb,col2:0x6fb4e0}]),
  kit:{eyes:{iris:1.15,lash:1.1,hl:2}}}));
