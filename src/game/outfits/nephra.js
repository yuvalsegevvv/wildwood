//@ Nephra's outfit (a risen tomb-keeper of the Sunscar): a striped linen headcloth with a gold cobra, trailing bandage ends, a wrapped body under a gold-and-lapis broad collar, a ragged kilt, sandals with linen wraps and the ankh-bind weapon dressing
/* ---------- Nephra: healer, earth. Design: docs/skillkits/looks/nephra.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: old linen 0xe3d5b0, stain 0x9c8458, lapis 0x2f55a0, gold 0xd4a83a, turquoise 0x3fb0a8, kohl 0x1f1a22. Silhouette: a narrow wrapped column topped by a flaring striped headcloth with two lappets, a broad
   collar over the shoulders, loose bandage ends trailing from the shoulders and wrists. Every part has at least two colours (linen with a stained wrap line, lapis, gold); the emblem is an ankh, a gold loop and cross. */
CHAR_MODELS.nephra={id:'nephra',name:'Nephra',signature:true, items:{hat:'Striped headcloth',hair:'Kohl bob & strips',face:'Kohl wings & gold dots',top:'Wrapped collar',bottom:'Ragged kilt',shoes:'Wrapped sandals',weapon:'Ankh bind'},sexes:['female'],
  note:'The tomb-keeper: tall, slim and still, built for a long, narrow figure.',
  ranges:{height:[0.96,1.08],build:[0.88,1.02],chest:[0.6,1.1],waist:[0.82,1.05],hips:[0.88,1.12],legs:[1.0,1.14],neck:[1.0,1.2],arms:[0.82,1.05],head:[0.95,1.08],hairLength:[0.8,1.2],hairVolume:[0.9,1.15]},
  setups:[{id:'nephra',name:'Nephra',sex:'female',def:true,note:'The tomb-keeper as drawn: tall, narrow, long-necked and calm.',v:{height:1.05,build:0.9,chest:0.8,shoulders:1.0,waist:0.9,torso:1.02,legs:1.1,thighs:0.9,arms:0.88,neck:1.15,hands:0.92,feet:0.95,head:0.98,jaw:0.88,chin:0.95,cheeks:0.9,eyeSize:1.1,eyeTilt:0.15,brow:0.1,noseSize:0.9,mouthSize:0.85,lips:1.1,smile:0.25,hairLength:1.0,hairVolume:1.0}}]};

OUTFITS.nephra=(function(){
  const LINEN=0xe3d5b0, LINEN_D=0xc8b68a, STAIN=0x9c8458, LAPIS=0x2f55a0, GOLD=0xd4a83a, TURQ=0x3fb0a8, KOHL=0x1f1a22, BRONZE=0xc79a55, ACACIA=0x8a6a40, HAIR=0x2a2230;
  const cL=ofCol(LINEN), cD=ofCol(LINEN_D), cS=ofCol(STAIN), cLa=ofCol(LAPIS), cG=ofCol(GOLD), cT=ofCol(TURQ);
  const fr=x=>x-Math.floor(x);
  // the ankh (the emblem): u across, v up from the loop's centre, metres; 1 inside
  const ankh=(u,v)=>{ const e=Math.hypot(u/0.0125,(v-0.02)/0.0165); if(e>0.62&&e<1.0) return 1; if(Math.abs(u)<0.0042&&v<0.0045&&v>-0.046) return 1; if(Math.abs(v+0.0095)<0.0042&&Math.abs(u)<0.022) return 1; return 0; };
  // a linen strip hanging from a point: stain-dyed toward its end
  const strip=(P,w,up,sg)=>pc(ofRibbon(P,u=>w*(u>0.9?1-(u-0.9)*5:1),{up,seg:sg,th:0.0018}),(x,y,z,c)=>{ c.set(LINEN); const t=fr(y*23); if(t<0.1) c.set(LINEN_D); const k=clamp((P[0][1]-y)/(P[0][1]-P[P.length-1][1])); c.lerp(cS,0.5*k*k); });

  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;
    // jag the lowest row of a loft: the hem of old cloth is torn into points
    const ragged=(g,yb,depth,N,ph)=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ if(p.getY(i)<yb+0.0015){ const a=Math.atan2(p.getX(i),p.getZ(i)), t=Math.abs(fr(a*N/TAU+ph)*2-1); p.setY(i,p.getY(i)-depth*t*t); } } p.needsUpdate=true; return g; };

    /* ---- the paint of the body: linen wrapped round and round (a diagonal stained line between wraps), a gold armlet and a gold wrist ring, wrapped calves, gold sandal soles ---- */
    const wrap=(c,k,w)=>{ const f=fr(k); c.set(LINEN); if(f<w) c.set(STAIN); else if(((Math.floor(k)*7)&3)===0) c.set(LINEN_D); };
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': wrap(c,y*34+x*16,0.1); return;
        case 'upperArm': { const t=-y/D.upper; if(t<0.3) skinPaint(c); else if(t<0.36){ c.set(GOLD); } else wrap(c,y*34,0.12); return; }
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.188){ c.set(GOLD); } else wrap(c,y*30+z*8,0.12); return; }
        case 'thigh': { const t=-y/D.thigh; if(t>0.8) skinPaint(c); else wrap(c,y*30+x*10,0.12); return; }
        case 'shin': { const t=-y/D.shin; if(t<0.04) skinPaint(c); else if(t<0.82) wrap(c,y*36+z*9,0.12); else if(t<0.86) c.set(GOLD); else skinPaint(c); return; }
        case 'foot': { skinPaint(c); if(y<-D.ankleH+0.012) c.set(0x8a6a28); else if(z<-0.075) c.set(GOLD); return; }
      }
      c.set(LINEN); };

    /* ---- the broad collar: five bands (gold, lapis, turquoise, lapis, gold) laid over the shoulders and the chest; a gold belt with a lapis centre; a linen sash tail ---- */
    const collar=()=>{ const sN=torsoSize(X,D,0.45), rings=[]; const N=10;
      for(let i=0;i<=N;i++){ const t=i/N, yd=lerp(0.592,0.446,t), s=Math.pow(t,0.9); rings.push({y:yd*TK,rx:lerp(D.neckR*1.6,sN.rx*1.0,s)+0.008*s+0.004,rz:lerp(D.neckR*1.6,Math.max(sN.rz,sN.rzBack)*1.0,s)+0.008*s+0.004}); }
      const g=ofLoft(rings,sg(40),0,TAU);
      return pc(g,(x,y,z,c)=>{ const t=clamp((0.592*TK-y)/(0.146*TK)); c.set(GOLD); if(t>0.17&&t<0.4) c.set(LAPIS); else if(t>=0.4&&t<0.55) c.set(TURQ); else if(t>=0.55&&t<0.78) c.set(LAPIS); if(fr(Math.atan2(x,z)*14/TAU)<0.1&&t>0.17&&t<0.78) c.lerp(cG,0.7); }); };
    const belt=()=>{ const s=torsoSize(X,D,0.04), r=[]; for(const [yd,k] of [[0.075,0.0],[0.07,1],[0.015,1],[0.01,0.0]]) r.push({y:yd*TK,rx:s.rx+0.006,rz:Math.max(s.rz,s.rzBack)+0.006});
      const g=ofLoft(r,sg(40),0,TAU);
      const out=[pc(g,(x,y,z,c)=>{ c.set(LAPIS); if(y>0.07*TK-0.006||y<0.015*TK+0.006) c.set(GOLD); })];
      out.push(pc(vbox(0.05,0.04,0.012,0,0.043*TK,-Math.max(s.rz,0)-0.012),(x,y,z,c)=>{ c.set(GOLD); if(Math.abs(x)<0.012&&Math.abs(y-0.043*TK)<0.011) c.set(TURQ); }));
      return out; };
    const sashTail=()=>{ const s=torsoSize(X,D,0.03), z0=-s.rz-0.016; return [strip([[0.05,0.03*TK,z0],[0.055,-0.1,z0-0.012],[0.05,-0.25,z0-0.02],[0.058,-0.34,z0-0.01]],0.05,[0,0,-1],sg(14))]; };

    /* ---- the kilt: a front panel and a back panel hung from the belt to above the knee, torn at the hem into points, a gold-and-lapis border above the tear ---- */
    const kiltPanel=front=>{ const s0=torsoSize(X,D,0.02), rings=[]; for(let i=0;i<=8;i++){ const f=i/8, y=lerp(0.02*TK,-0.25,f); rings.push({y,rx:s0.rx+0.012+0.075*f*f,rz:(front?s0.rz:s0.rzBack)+0.012+0.05*f}); }
      const g=ofLoft(rings,sg(30),front?Math.PI-0.95:-0.95,front?Math.PI+0.95:0.95);
      const pg=pc(g,(x,y,z,c)=>{ wrap(c,y*26+x*6,0.1); const h=y+0.25; if(h<0.05) c.set(STAIN); else if(h<0.07) c.set(GOLD); else if(h<0.09) c.set(LAPIS); });
      return ragged(pg,-0.25,0.035,7,front?0:0.3); };

    /* ---- the headcloth: a striped dome (linen and lapis) with a gold brow band, a gold cobra, two lappets ---- */
    const headcloth=F=>{ const out=[], fs=F.fs, R=0.138, H=0.158, y0=0.025, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.01}];
      for(let i=0;i<=9;i++){ const t=lerp(0.18,t1,i/9); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.04,zc:0.01}); }
      const dome=ofLoft(rings,sg(36),0,TAU);
      out.push(pc(dome,(x,y,z,c)=>{ const a=Math.atan2(x,z+0.01); c.set(LINEN); if(fr(a*9/TAU)<0.5) c.set(LAPIS); if(y<y0+0.008) c.set(GOLD); }));
      out.push(solid(ofRingAt([0,y0+0.003,0.01],[0,1,0],R*0.985,0.0048,sg(6)).scale(1,1,1.04),GOLD));
      out.push(pc(ofRibbon([[0,0.02,0.13],[0,-0.06,0.158],[0,-0.14,0.168],[0,-0.22,0.17]],u=>0.07*(1-0.2*u),{up:[0,0,1],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(LINEN); if(fr(y*28)<0.5) c.set(LAPIS); if(y<-0.2) c.set(GOLD); }));
      for(const sd of [-1,1]){ const P=[[sd*0.128,0.03,0.012],[sd*0.13,-0.04,0.018],[sd*0.128,-0.11,0.026],[sd*0.127,-0.16,0.03]];
        out.push(pc(ofRibbon(P,u=>0.052*(1-0.1*u),{up:[sd,0,0],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(LINEN); if(fr(y*28)<0.5) c.set(LAPIS); if(y<-0.146) c.set(GOLD); }));
        out.push(solid(ofRingAt([sd*0.1285,0.034,0.012],[sd,0,0],0.012,0.003,sg(4)),GOLD)); }
      // the cobra: a rearing gold body, a flared hood, a turquoise eye
      out.push(solid(sweepTube([[0,0.035,-0.134],[0,0.05,-0.138],[0,0.066,-0.134],[0,0.078,-0.128]],[0.0062,0.0068,0.0078,0.0055],sg(7),{cap:'round',rings:sg(14)}),GOLD));
      out.push(solid(csph(0.0105,sg(9),sg(7)).scale(1.15,1.25,0.6).translate(0,0.07,-0.137),GOLD),solid(csph(0.0028,5,4).translate(0.004,0.075,-0.14),TURQ),solid(csph(0.0028,5,4).translate(-0.004,0.075,-0.14),TURQ));
      return out; };

    /* ---- the hair: a kohl-black bob with a straight fringe, and four loose bandage strips from the nape that hang down the back ---- */
    const hairItem=(F,T)=>{ T.crown(0.113,0.5,0.3); T.fringe(8,1.0,0.0); T.sideLocks(0.07*T.hl); T.backLocks(sg(14),0.01,31);
      const out=[]; for(let i=0;i<4;i++){ const x=(i-1.5)*0.032, L=0.2+0.05*i;
        out.push(strip([[x,-0.03,0.1],[x*1.2,-0.03-L*0.4,0.118],[x*1.3+0.01,-0.03-L*0.8,0.124],[x*1.2+(i%2?0.012:-0.012),-0.03-L,0.122]],0.026,[0,0,1],sg(10))); }
      return out; };

    return {
      main:{top:0xe3d5b0,bottom:0xe3d5b0,shoes:0xe3d5b0,hat:0x2f55a0}, bootTop:0.3, shinCut:0, boot:false, skinFrom:0.592, hairColor:HAIR, eyeColor:0x39b8a8,
      eyes:{iris:1.1,hl:2,tilt:0.2,lash:1.4,browLift:0.003,browThick:1.0,h:0.9},
      cuts:{torso:[],upperArm:[0.3,0.36],foreArm:[0.188/D.fore,0.222/D.fore],thigh:[0.8],shin:[0.04,0.82,0.86]},
      paint,
      head:F=>headcloth(F),
      hair:(F,T)=>hairItem(F,T),
      mark:F=>{ const out=[]; for(const sd of [-1,1]){ const g=csph(1,sg(8),sg(6)).scale(0.03,0.0026,0.0009).rotateZ(sd*-0.3); out.push(solid(F.place(g,sd*0.07,-0.002,0.0008),KOHL)); }
        for(let i=0;i<3;i++) out.push(solid(F.place(csph(0.0032,sg(6),sg(5)),-0.055-i*0.004,-0.036-i*0.011,0.0008),GOLD)); return out; },
      torso:()=>[collar()],
      hips:()=>[...belt(),...sashTail(),kiltPanel(true),kiltPanel(false)],
      shoulder:sd=>{ const out=[]; for(let i=0;i<3;i++) out.push(solid(ofRingAt([0,-0.05-i*0.022,0],[0,1,0],0.05*aw+0.002+i*0.0006,0.0036,sg(5)),i===1?STAIN:LINEN_D));
        out.push(strip([[sd*0.01,-0.07,0.035],[sd*0.02,-0.2,0.075],[sd*0.03,-0.36,0.1],[sd*0.03,-0.5,0.09]],0.034,[sd,0,0.3],sg(12))); return out; },
      forearm:sd=>[solid(ofRingAt([0,-0.1987,0],[0,1,0],0.0268*aw+0.001,0.0028,sg(5)),GOLD),solid(ofRingAt([0,-0.2125,0],[0,1,0],0.0248*aw+0.0008,0.0024,sg(5)),LAPIS),
        strip([[sd*0.012,-0.19,0.012],[sd*0.03,-0.34,0.03],[sd*0.04,-0.5,0.04]],0.022,[sd,0,0.3],sg(10))],
      thigh:sd=>[],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.84,0],[0,1,0],0.0405*D.cw+0.0025,0.0026,sg(6)),GOLD),solid(csph(0.0058,6,5).translate(sd*(0.0405*D.cw+0.004),-D.shin*0.84,0),TURQ));
        out.push(solid(vbox(0.052*(0.55+0.45*S.feet),0.006,0.05,0,-D.shin-D.ankleH+0.003,0.04),0x8a6a28)); return out; },
      dress:{ shape:{sword:'khopesh',bow:'composite',staff:'ankh'}, grip:LINEN_D, metal:BRONZE, wood:ACACIA, accent:LAPIS,
        trim:(c,u,part)=>{ const f=((u/0.05)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.16) c.lerp(cG,0.9); if(part==='grip'&&((u/0.011)%1+1)%1<0.4) c.lerp(cS,0.8); },
        charm:()=>{ const lit=[], glow=[];
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),LINEN_D));
          lit.push(solid(ofRingAt([0,-0.043,0.004],[1,0,0],0.0105,0.0022,6),GOLD));
          lit.push(solid(vbox(0.0042,0.034,0.0042,0,-0.077,0.004),GOLD), solid(vbox(0.026,0.0042,0.0042,0,-0.066,0.004),GOLD));
          glow.push(pc(csph(0.0034,6,5).translate(0,-0.043,0.004),(x,y,z,c)=>c.set(0x6fd6c8)));
          return {lit,glow}; } },
    };
  };
})();
