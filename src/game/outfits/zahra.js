//@ Zahra's outfit (a glass-bearer of the desert noon): a gold circlet with a lapis headcloth and a veil of hanging gold beads, a long braid strung with gold, gold dot marks, a lapis-and-gold cropped robe with wide sleeves, a split white skirt with gold borders and gold sandals, and the mirror weapon dressing
/* ---------- Zahra: buff support, light. Design: docs/skillkits/looks/zahra.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: gold 0xe8c050, lapis 0x2b6aa8, white 0xf4efe0, sand 0xd6b87a, bronze 0xb08a3a. Silhouette: a crowned veiled head, a short robe with wide sleeves over a long split skirt, a sandglass on the hip.
   Every part has at least two colours (lapis and gold at the least); the emblem is a sandglass, never a crescent or a rayed sun. */
CHAR_MODELS.zahra={id:'zahra',name:'Zahra',signature:true, hairGrad:{mode:'tips',c2:0xe0b840,c3:0x2f55a0}, items:{hat:'Beaded circlet',hair:'Gold-strung braid',face:'Gold dots',top:'Wide-sleeve robe',bottom:'Split noon skirt',shoes:'Gold sandals',weapon:'Mirror rig'},sexes:['female'],
  note:'The glass-bearer: tall, composed and graceful, built for a long-limbed woman.',
  ranges:{height:[0.98,1.08],build:[0.88,1.05],chest:[0.7,1.2],waist:[0.82,1.02],hips:[0.9,1.15],legs:[1.0,1.14],neck:[1.0,1.2],arms:[0.85,1.1],head:[0.95,1.08],hairLength:[1.0,1.35],hairVolume:[0.9,1.2]},
  setups:[{id:'zahra',name:'Zahra',sex:'female',def:true,note:'The glass-bearer as drawn: tall, poised and long-necked.',v:{height:1.05,build:0.94,chest:0.95,shoulders:0.98,waist:0.9,torso:1.0,legs:1.08,thighs:0.96,arms:0.95,neck:1.12,hands:0.95,feet:0.96,jaw:0.95,chin:1.0,cheeks:1.0,noseSize:1.0,mouthSize:0.98,smile:0.35,hairLength:1.25,hairVolume:1.05}}]};

OUTFITS.zahra=(function(){
  const GOLD=0xe8c050, GOLD_D=0xb08a3a, LAPIS=0x2b6aa8, LAPIS_D=0x1d4a78, WHITE=0xf4efe0, SAND=0xd6b87a, HAIR=0x241a18;
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint: a lapis cropped robe with a gold hem and a gold band under the bust, bare midriff, white skirt with gold borders, gold sandal soles ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { if(y<=0.03){ c.set(WHITE); return; } if(y<0.2&&y>0.03) { skinPaint(c); if(y<0.06) c.set(GOLD); return; } c.set(LAPIS); if(y>0.2&&y<0.235) c.set(GOLD); const d=Math.abs(fr(x*26+y*26)-0.5)+Math.abs(fr(x*26-y*26)-0.5); if(d<0.1) c.set(LAPIS_D); if(y>0.545) c.set(GOLD); return; }
        case 'upperArm': c.set(LAPIS); if(-y>D.upper*0.7&&-y<D.upper*0.78) c.set(GOLD); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.19) c.set(GOLD); else c.set(LAPIS); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(WHITE); if(t>0.9) c.set(GOLD); return; }
        case 'shin': { const t=-y/D.shin; skinPaint(c); if(t>0.82&&t<0.88) c.set(GOLD); return; }
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.012) c.set(GOLD_D); else if(z<-0.08) c.set(GOLD); return; }
      }
      c.set(LAPIS); };

    /* ---- the circlet: a lapis headcloth over the hair, a gold band with a centre drop, and a veil of gold bead strands hanging to the shoulders ---- */
    const circlet=F=>{ const out=[], R=0.135, H=0.15, y0=0.04, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.008}];
      for(let i=0;i<=8;i++){ const t=lerp(0.22,t1,i/8); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.04,zc:0.008}); }
      out.push(pc(ofLoft(rings,sg(34),0,TAU),(x,y,z,c)=>{ c.set(LAPIS); const a=Math.atan2(x,z+0.008); if(fr(a*6/TAU*2)<0.07) c.set(GOLD); if(y<0.06) c.set(LAPIS_D); }));
      out.push(solid(ofRingAt([0,0.06,0.008],[0,1,0.1],0.126,0.0065,sg(8)).scale(1,1,1.04),GOLD));
      out.push(pc(new THREE.OctahedronGeometry(0.016,0).scale(0.8,1.4,0.5).translate(0,0.036,-0.132),(x,y,z,c)=>{ c.set(WHITE); if(y<0.03) c.set(GOLD); }));
      for(let i=0;i<9;i++){ const a=lerp(-0.55,0.55,i/8)*Math.PI, x=Math.sin(a)*0.115, z=-Math.cos(a)*0.115, L=0.1+0.03*(i%2);
        out.push(solid(sweepTube([[x,0.06,z],[x*1.02,0.06-L*0.5,z*1.03],[x*1.03,0.06-L,z*1.04]],[0.0016,0.0016,0.0016],4,{cap:'round',rings:6}),GOLD_D));
        for(const t of [0.4,0.8]) out.push(solid(csph(0.0045,5,4).translate(x*(1+0.03*t),0.06-L*t,z*(1+0.04*t)),i%2?GOLD:WHITE)); }
      return out; };

    /* ---- the hair: a long braid down the back strung with gold rings ---- */
    const braid=(F,T)=>{ T.crown(0.113,0.55,0.3); T.fringe(7,0.9,0.1); T.sideLocks(0.04); T.backLocks(sg(12),0,13); const out=[], len=0.42*T.hl, P=[];
      for(let i=0;i<=11;i++){ const t=i/11; P.push([0.0,-0.04-len*t,0.1+0.03*Math.sin(t*2)]); }
      T.add(sweepTube(P,[0.024,0.028,0.028,0.024,0.018,0.003],sg(8),{cap:'point',rings:sg(30)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.9+0.12*Math.sin(y*160)); });
      for(const t of [0.15,0.45,0.75,0.95]){ const p=P[Math.round(t*11)], q=P[Math.min(11,Math.round(t*11)+1)]; out.push(solid(ofRingAt(p,[q[0]-p[0],q[1]-p[1],q[2]-p[2]],0.026*(1-0.3*t),0.005,sg(6)),t>0.9?LAPIS:GOLD)); }
      return out; };

    /* ---- the robe's sleeves and a gold collar, a gold waist chain with a sandglass charm ---- */
    const torsoGear=()=>{ const out=[], sN=torsoSize(X,D,0.45), r=[]; for(let i=0;i<=5;i++){ const t=i/5, yd=lerp(0.592,0.5,t); r.push({y:yd*TK,rx:lerp(D.neckR*1.5,sN.rx,t)+0.006,rz:lerp(D.neckR*1.5,Math.max(sN.rz,sN.rzBack),t)+0.006}); }
      out.push(pc(ofLoft(r,sg(30),0,TAU),(x,y,z,c)=>{ c.set(GOLD); if(fr(Math.atan2(x,z)*10/TAU)<0.3) c.set(WHITE); if(y<0.52*TK) c.set(GOLD_D); }));
      const s=torsoSize(X,D,0.12), rz=Math.max(s.rz,s.rzBack)+0.008;
      out.push(solid(ofRingAt([0,0.12*TK,0],[0,1,0],s.rx+0.008,0.004,sg(5)).scale(1,1,rz/Math.max(0.001,s.rx+0.008)),GOLD));
      out.push(pc(new THREE.OctahedronGeometry(0.012,0).scale(0.8,1.3,0.8).translate(-D.hx*0.5,0.1*TK,-rz-0.008),(x,y,z,c)=>{ c.set(WHITE); if(y>0.1*TK+0.004||y<0.1*TK-0.012) c.set(GOLD); }));
      return out; };

    return {
      aura:{col:0xffd24a,col2:0x6aa0e8,style:'orbit',ring:false,n:8,shape:'mote',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x2b6aa8,bottom:0xf4efe0,shoes:0xe8c050,hat:0x2b6aa8}, bootTop:1.1, shinCut:9, boot:false, skinFrom:0.592, hairColor:HAIR, eyeColor:0xc89a30,
      eyes:{iris:1.1,hl:2,tilt:0.18,lash:1.3,browLift:0.003,browThick:0.9,h:0.95},
      cuts:{torso:[0.03,0.06,0.2,0.235,0.545],upperArm:[0.7,0.78],foreArm:[0.19/D.fore,0.222/D.fore],thigh:[0.9],shin:[0.82,0.88]},
      paint,
      head:F=>circlet(F),
      hair:(F,T)=>braid(F,T),
      mark:F=>{ const out=[]; for(let i=0;i<3;i++) out.push(solid(F.place(csph(0.0034,sg(6),sg(5)),0.0,0.045-i*0.012,0.0008),GOLD)); for(const sd of [-1,1]) out.push(solid(F.place(csph(0.0032,sg(6),sg(5)),sd*0.062,-0.02,0.0008),GOLD)); return out; },
      torso:()=>torsoGear(),
      shoulder:sd=>{ const out=[]; out.push(pc(ofLoft([{y:-0.02,rx:0.058*aw,rz:0.058*aw},{y:-0.12,rx:0.068*aw,rz:0.068*aw},{y:-0.24,rx:0.085*aw,rz:0.085*aw},{y:-0.3,rx:0.09*aw,rz:0.09*aw}],sg(20),0,TAU),(x,y,z,c)=>{ c.set(LAPIS); if(y<-0.27) c.set(GOLD); else if(fr(y*14)<0.06) c.set(LAPIS_D); })); return out; },
      hips:()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.012, out=[];
        for(const [dx,k] of [[0,1]]){ const rings=[], N=8; for(let i=0;i<=N;i++){ const t=i/N; rings.push({y:lerp(0.035,-0.62,t),rx:s.rx+0.014+0.12*t,rz:rz+0.012+0.1*t}); }
          out.push(pc(ofLoft(rings,sg(44),Math.PI*0.12,Math.PI*0.88),(x,y,z,c)=>{ c.set(WHITE); if(y<-0.58) c.set(GOLD); else if(y>0.02) c.set(GOLD); else if(fr(x*20)<0.06) c.set(SAND); }));
          out.push(pc(ofLoft(rings,sg(44),Math.PI*1.12,Math.PI*1.88),(x,y,z,c)=>{ c.set(WHITE); if(y<-0.58) c.set(GOLD); else if(y>0.02) c.set(GOLD); else if(fr(x*20)<0.06) c.set(SAND); })); }
        return out; },
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.85,0],[0,1,0],0.04*D.cw+0.003,0.004,sg(6)),GOLD),solid(csph(0.006,6,5).translate(sd*(0.04*D.cw+0.005),-D.shin*0.85,0),LAPIS));
        out.push(solid(vbox(0.052*(0.55+0.45*S.feet),0.006,0.05,0,-D.shin-D.ankleH+0.003,0.04),GOLD_D)); return out; },
      dress:{ shape:{sword:'mirror',bow:'sunbow',staff:'sandglass'}, grip:LAPIS_D, metal:0xf4efe0, wood:0x6a4a28, accent:GOLD,
        trim:(c,u,part)=>{ const f=((u/0.06)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.13) c.lerp(ofCol(LAPIS),0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(GOLD),0.9); },
        charm:()=>{ const lit=[], glow=[];   // a small sandglass on a gold cord
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),GOLD));
          lit.push(pc(new THREE.ConeGeometry(0.012,0.022,6).translate(0,-0.04,0.004),(x,y,z,c)=>{ c.set(WHITE); }),pc(new THREE.ConeGeometry(0.012,0.022,6).rotateX(Math.PI).translate(0,-0.062,0.004),(x,y,z,c)=>{ c.set(SAND); }));
          lit.push(solid(cyl(0.014,0.014,0.004,6).translate(0,-0.027,0.004),GOLD),solid(cyl(0.014,0.014,0.004,6).translate(0,-0.075,0.004),GOLD));
          glow.push(pc(csph(0.0034,6,5).translate(0,-0.051,0.016),(x,y,z,c)=>c.set(0xfff0b0)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.zahra=oxPlus(OUTFITS.zahra,(X,D)=>({   // round 5: a layered gold bead collar, gold shoulder plates, a lapis cloak with sun rays, gold sash tails
  torso:()=>oxBeads(X,D,{col:0xffd24a,col2:0x2b6aa8,n:24,r:0.0135,drop:0.22}),
  shoulder:sd=>oxPauldron(X,D,{col:0xe8c050,trim:0x2b6aa8,r:0.068}),
  hips:()=>oxSash(X,D,{col:0xe8c050,col2:0x2b6aa8,len:1.05,side:-1}),
  cos:{cape:{col:0x2b6aa8,trim:0xffd24a,len:0.95,pat:'rays',mantle:0}}}));
oxTune('zahra',{lips:1.15,eyeSize:1.12,eyeTilt:0.22,brow:-0.1,undertone:0.5,blush:0.25,cheeks:1.05,earSize:0.95});
OUTFITS.zahra=oxPlus(OUTFITS.zahra,(X,D)=>({   // face round 4: gilded cheekbones, a beauty mark, gold beads at both temples
  mark:F=>oxMarks(F,[{t:'stripe',col:0xe0b840},{t:'mole',side:-1,col:0x3a2a20}]),
  hair:()=>oxHairBits(X,[{t:'beads',both:true,col:0xe8c050,col2:0x2b6aa8}])}));
