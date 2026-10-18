//@ Dunstan's outfit (a standard-bearer and drummer): a plumed shako, a copper braided queue, a tabard with a flame and a slung snare drum, striped breeches, marching boots, and the banner dressing for every weapon
/* ---------- Dunstan: support (buff), fire. Design: docs/skillkits/looks/dunstan.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: ember red 0xb8432a, gold 0xd4a83a, soot 0x2e2a2a, drum cream 0xeee2c0, copper 0xc47a45. The silhouette is a rallying column: a tall cap with a plume, a barrel chest
   under a red tabard, a drum at the hip, tall boots. Every part has at least two colours (red and gold at the least); the emblem is a flame, never a rayed sun. */
CHAR_MODELS.dunstan={id:'dunstan',name:'Dunstan',signature:true, hairGrad:{mode:'tips',c2:0xe8c050}, items:{hat:'Drum shako',hair:'Gold queue',face:'Stripes & handlebar',top:'Rally tabard',bottom:'Stripe breeches',shoes:'March boots',weapon:'Banner bind'},sexes:['male'],
  note:'The standard-bearer: a tall cap and long lines, built for a broad, tall man.',
  ranges:{height:[0.98,1.08],build:[1.02,1.18],chest:[0.9,1.2],waist:[0.95,1.15],hips:[0.9,1.15],legs:[0.92,1.06],neck:[1.0,1.2],arms:[0.95,1.25],head:[0.95,1.1],hairLength:[0.9,1.2],hairVolume:[1.0,1.2]},
  setups:[{id:'dunstan',name:'Dunstan',sex:'male',def:true,note:'The standard-bearer as drawn: tall, a barrel of a body, a big smile.',v:{height:1.04,build:1.12,chest:1.05,shoulders:1.1,waist:1.08,torso:1.02,legs:0.97,thighs:1.08,arms:1.12,neck:1.12,hands:1.1,feet:1.05,jaw:1.05,chin:1.05,cheeks:1.12,noseSize:1.1,mouthSize:1.15,smile:0.55,hairVolume:1.1,bangs:0.8}}]};

OUTFITS.dunstan=(function(){
  const EMBER=0xb8432a, GOLD=0xd4a83a, SOOT=0x2e2a2a, CREAM=0xeee2c0, COPPER=0xc47a45, LEATHER=0x5a3c26, WHITE=0xf2eee4, BRASS=0xb89a4a, WAX=0x8a4a28;
  const cE=ofCol(EMBER), cG=ofCol(GOLD), cS=ofCol(SOOT), cC=ofCol(CREAM), cL=ofCol(LEATHER), cW=ofCol(WHITE);
  // a three-tongued flame (the emblem): u across, v up, both in metres from the flame's base centre; 1 inside, 0 outside
  const flame=(u,v,k)=>{ k=k||1; u/=k; v/=k; if(v<-0.007||v>0.095) return 0; if(v<0.004&&Math.abs(u)<0.05) return 1;
    for(const i of [-1,0,1]){ const h=i===0?0.092:0.068, w0=0.0175, t=v/h; if(t<0||t>1) continue; if(Math.abs(u-i*0.026-i*0.009*t*t-0.0045*Math.sin(t*5.2+i))<w0*Math.pow(1-t,0.8)) return 1; } return 0; };
  const mix=(c,col,t)=>c.lerp(col,t);

  return function(X,D){
    const {S,sg,skin,skinPaint}=X, TK=D.TK, aw=D.aw, rim=ofCol(0xe0c060);
    const tabY=yd=>yd*TK;

    /* ---- the paint of the body: a soot jerkin, a leather belt with a gold buckle, soot breeches with a gold stripe down each leg, tall soot boots with a gold rim ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso':   // y is the design height
          if(y>0.012&&y<0.07){ c.set(LEATHER); if(Math.abs(x)<0.03&&z<0) c.set(GOLD); }               // the belt
          else if(y>0.56){ c.set(SOOT); if(y>0.598) c.set(GOLD); }                                       // a stand collar: soot with a gold edge
          else c.set(SOOT);
          return;
        case 'upperArm': { c.set(SOOT); const a=-y;                                                // rank stripes: a red band between two gold lines, above the elbow
          if(a>0.15&&a<0.22){ c.set(EMBER); if(a<0.158||a>0.212) c.set(GOLD); } return; }
        case 'foreArm':
          if(y<-0.222) skinPaint(c); else if(y<-0.188){ c.set(GOLD); if(y>-0.197||y<-0.213) c.multiplyScalar(0.78); } else c.set(SOOT); return;
        case 'thigh': case 'shin': {
          c.set(SOOT);
          const ang=Math.atan2(z,x*sd);                                                               // 0 on the outer side of the leg: a gold stripe down the outer seam
          if(part==='thigh'){ if(Math.abs(ang)<0.13) c.set(GOLD); if(y<-D.thigh*0.9&&y>-D.thigh*0.98) c.set(GOLD); }   // and a gold band just above the knee
          else { if(y>-D.shin*0.12){ if(Math.abs(ang)<0.13) c.set(GOLD); }
            if(y<-D.shin*0.04&&y>-D.shin*0.12) c.set(GOLD);                                           // the boot's top rim
            else if(y<-D.shin*0.12){ c.set(SOOT); c.multiplyScalar(0.92+0.1*Math.max(0,-z*8)); if((Math.round(y*60)&1)===0 && Math.abs(x*sd+0.0)<0.011*D.cw && z<0) c.set(GOLD); } }   // riveted
          return; }
        case 'foot': { c.set(SOOT); if(y<-D.ankleH+0.012) c.set(0x1a1612); if(z<-0.088) c.set(GOLD); return; }   // a gold toe cap, a dark sole
      }
      c.set(SOOT);
    };

    /* ---- the tabard: a red front and back panel hung from the shoulders, edged in gold, a gold flame on the chest, flaring to the thigh ---- */
    const ARC=0.78, panelRings=back=>{ const out=[], N=22;
      for(let i=0;i<=N;i++){ const yd=lerp(0.5,0.0,i/N), s=torsoSize(X,D,yd); out.push({yd,y:yd*TK,rx:s.rx*(yd>0.47?0.93:1)+0.007,rz:(back?s.rzBack:s.rz)+0.007}); }
      for(const dy of [0.04,0.1,0.15,0.2]){ const k=dy/0.2, s=torsoSize(X,D,0.0); out.push({yd:-dy/TK,y:-dy,rx:s.rx+0.007+0.08*k,rz:(back?s.rzBack:s.rz)+0.007+0.07*k}); }
      return out; };
    const FRONT=panelRings(false), BACK=panelRings(true);
    const ringAt=(R,y)=>{ for(let i=1;i<R.length;i++) if(y>=R[i].y){ const a=R[i-1], b=R[i], f=(y-a.y)/((b.y-a.y)||1); return {rx:lerp(a.rx,b.rx,f),rz:lerp(a.rz,b.rz,f)}; } return R[R.length-1]; };
    const tabardPanel=front=>{
      const R=front?FRONT:BACK, g=ofLoft(R.map(r=>({y:r.y,rx:r.rx,rz:r.rz,zc:0})),sg(44),front?Math.PI-ARC:-ARC,front?Math.PI+ARC:ARC);
      return pc(g,(x,y,z,c)=>{ const r=ringAt(R,y), ang=Math.abs(Math.asin(clamp(x/r.rx,-1,1)));
        c.set(EMBER);
        if(ang>ARC*0.84) c.set(GOLD);                                      // gold side borders
        if(y<-0.17) c.set(GOLD); else if(y<-0.125&&y>-0.142) c.set(GOLD);  // a gold hem and a gold line above it
        if(!front&&Math.abs(x)<0.0075) c.set(GOLD);                        // a gold seam down the back
        if(y>0.5*TK-0.014) c.set(GOLD); });                                // the neckline
    };
    // the emblem: a fine grid on the front panel with the flame painted on it (the panel's own mesh is too coarse for a crisp edge)
    const emblem=()=>{ const by=0.27*TK, surf=(x,y)=>{ const r=ringAt(FRONT,y); return -r.rz*Math.sqrt(Math.max(0,1-Math.pow(x/r.rx,2)))-0.0012; };
      return pc(ofPatch(-0.062,0.062,by-0.012,by+0.108,sg(34),sg(34),surf,true),(x,y,z,c)=>{ c.set(EMBER); const f=flame(x,y-by,1.0); if(f) c.set(GOLD);
        else { const g=flame(x,y-by,1.0), e=Math.min(flame(x+0.0035,y-by,1),flame(x-0.0035,y-by,1),flame(x,y-by+0.0035,1),flame(x,y-by-0.0035,1)); } }); };

    /* ---- the shako: a tall red cap with a gold braid band, a front flame badge, a black visor, a chin cord and a white-and-ember plume ---- */
    const shako=F=>{
      const fs=F.fs, y0=0.058, H=0.16, out=[];
      const body=new THREE.CylinderGeometry(0.104,0.134,H,sg(36),sg(10),false).scale(1,1,1.04).translate(0,y0+H/2,0.006);
      out.push(pc(body,(x,y,z,c)=>{ const v=(y-y0)/H; c.set(EMBER); c.multiplyScalar(0.93+0.1*v);
        if(v<0.16){ c.set(GOLD); if(v>0.065&&v<0.1) c.set(EMBER); }                              // the braid band (a red thread in it)
        if(v>0.945) c.set(GOLD); }));                                                             // the top rim
      out.push(pc(ofPatch(-0.04,0.04,y0+0.03,y0+0.125,sg(26),sg(30),(x,y)=>-(0.134-0.03*((y-y0)/H))*1.04*Math.sqrt(Math.max(0,1-Math.pow(x/(0.134-0.03*((y-y0)/H)),2)))+0.006-0.0015,true),(x,y,z,c)=>{ c.set(EMBER);
        const u=x, v=y-(y0+0.036); if(flame(u,v,0.82)) c.set(GOLD); else if(Math.hypot(u/0.034,(v-0.035)/0.052)>0.93&&Math.hypot(u/0.034,(v-0.035)/0.052)<1.04) c.set(GOLD); }));   // the badge: a gold flame in a gold ring
      out.push(pc(new THREE.CylinderGeometry(0.104,0.104,0.01,sg(36)).scale(1,1,1.04).translate(0,y0+H+0.005,0.006),(x,y,z,c)=>c.set(GOLD)));   // the top disc
      out.push(pc(new THREE.CylinderGeometry(0.128,0.128,0.008,sg(30),1,false,Math.PI/2,Math.PI).scale(1,1,1.0).rotateX(-0.22).translate(0,y0-0.004,-0.026),(x,y,z,c)=>{ c.set(0x1b1716); if(z<-0.145) c.set(GOLD); }));   // the visor, a gold edge
      // chin cord: a gold loop from the cap's sides under the chin, a button where it meets the cap
      const zc=(x,y)=>F.zAt(x,y)-0.004, cy=-0.098*fs[1];
      out.push(solid(sweepTube([[-0.118,y0+0.014,-0.01],[-0.114,-0.02,-0.012],[-0.076,cy*0.9,-0.05],[-0.03,cy,zc(-0.03,cy)],[0.03,cy,zc(0.03,cy)],[0.076,cy*0.9,-0.05],[0.114,-0.02,-0.012],[0.118,y0+0.014,-0.01]],[0.0034,0.0034,0.0034,0.0034,0.0034,0.0034,0.0034,0.0034],sg(6),{cap:'round',rings:sg(30)}),GOLD));
      for(const sd of [-1,1]) out.push(solid(csph(0.0095,sg(10),sg(8)).scale(0.6,1,1).translate(sd*0.12,y0+0.014,-0.01),GOLD));
      // the plume: a gold socket and six feathers fanning up and back, white with ember tips
      const px=0.0, py=y0+H+0.01, pz=-0.02;
      out.push(solid(new THREE.CylinderGeometry(0.014,0.019,0.024,sg(10)).translate(px,py+0.008,pz),GOLD));
      const fe=[[-0.7,0.15,0.05],[-0.5,0.185,0.04],[-0.3,0.21,0.02],[-0.1,0.225,0.0],[0.1,0.225,0.0],[0.3,0.21,0.02],[0.5,0.185,0.04],[0.7,0.15,0.05]];
      for(const [lean,h,curl] of fe){ const P=[[px,py+0.012,pz],[px+lean*0.03,py+h*0.45,pz+0.012+curl],[px+lean*0.075,py+h*0.85,pz+0.03+curl*2],[px+lean*0.1,py+h,pz+0.07+curl*3]];
        out.push(pc(ofRibbon(P,u=>0.034*Math.sin(Math.PI*Math.pow(Math.min(1,u*1.02),0.65))+0.002,{up:[0.5*Math.sign(lean),0,-1],seg:sg(10)}),(x,y,z,c)=>{ const t=(y-py)/h; c.copy(cW); if(t>0.6) mix(c,cE,Math.min(1,(t-0.6)*4)); }));
        out.push(solid(sweepTube(P,[0.0016,0.0014,0.0011,0.0007],sg(4),{cap:'point',rings:8}),0xd8d0c0)); }
      return out;
    };

    /* ---- the queue: a thick copper braid of three strands from under the cap, bound with gold cord at three places; a short fringe and side locks ---- */
    const queue=(F,T)=>{
      T.crown(0.113,0.5,0.3); T.fringe(5,0.9,0.1); T.sideLocks(0.06); T.backLocks(sg(14),0,13);
      const len=0.4*T.hl, out=[], path=t=>[0,-0.012-len*t,0.112+0.034*Math.sin(t*2.6)];
      for(let s=0;s<3;s++){ const ph=s*TAU/3, P=[];
        for(let i=0;i<=14;i++){ const t=i/14, a=t*15+ph, r=0.024*(0.55+0.45*Math.min(1,t*3))*(1-0.35*t), pp=path(t); P.push([r*Math.sin(a),pp[1],pp[2]+r*0.9*Math.cos(a)]); }
        T.add(sweepTube(P,[0.016,0.02,0.02,0.018,0.013,0.003],sg(8),{cap:'point',rings:sg(32)}),(x,y,z,c)=>{ T.hp(x,y,z,c); mix(c,ofCol(0xf0a050),0.1*Math.sin(y*90+s*2)+0.1); }); }
      for(const t of [0.14,0.5,0.86]){ const p=path(t), q=path(t+0.02), tg=[q[0]-p[0],q[1]-p[1],q[2]-p[2]]; out.push(solid(ofRingAt(p,tg,0.0225*(1-0.3*t),0.0048,sg(6)),GOLD)); }
      out.push(solid(csph(0.011,sg(8),sg(6)).translate(...path(1.0)),GOLD));
      return out;
    };

    return {
      aura:{col:0xff8a3a,col2:0xffd070,style:'rise',ring:false,n:6,shape:'flame',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0xb8432a,bottom:0x2e2a2a,shoes:0x2e2a2a,hat:0xb8432a}, /* the main colour of each piece, for the player's recolouring (outfit-tools.js: ofTinter) */ bootTop:0.04, shinCut:0, boot:true, skinFrom:0.605, hairColor:COPPER, eyeColor:0x4a2e1c,
      eyes:{iris:1.05,hl:2,browLift:0.003,browThick:1.2},           // the "hearty" style: a wide bright iris, brows lifted and thick
      cuts:{torso:[0.012,0.07,0.56,0.598],upperArm:[0.15/D.upper*1,0.158/D.upper,0.212/D.upper,0.22/D.upper],foreArm:[0.188/D.fore,0.197/D.fore,0.213/D.fore,0.222/D.fore],thigh:[0.9,0.98],shin:[0.04,0.12]},
      paint,
      head:F=>shako(F),
      hair:(F,T)=>queue(F,T),
      mark:F=>{ const out=[]; for(let i=0;i<3;i++){ const g=csph(1,sg(8),sg(6)).scale(0.0016,0.0125,0.0006).rotateZ(0.5); out.push(solid(F.place(g,0.049+i*0.0062,-0.032,0.0006),EMBER)); } return out; },   // three finger stripes, like drumbeat tallies
      facial:F=>{ const out=[], my=-0.052;
        for(const sd of [-1,1]){ const z=x=>F.zAt(x,my)-0.0032;
          const P=[[sd*0.003,my,z(0.003)-0.001],[sd*0.014,my-0.0045,z(0.014)],[sd*0.027,my-0.005,z(0.027)-0.0008],[sd*0.038,my-0.0015,z(0.038)-0.0035],[sd*0.044,my+0.0075,z(0.044)-0.005],[sd*0.04,my+0.0145,z(0.04)-0.0075],[sd*0.0325,my+0.0125,z(0.0325)-0.0085]];
          out.push(pc(sweepTube(P,[0.0048,0.0056,0.0046,0.0034,0.0027,0.0021,0.0012],sg(7),{cap:'round',rings:sg(22)}),(x,y,z2,c)=>{ c.set(WAX); mix(c,ofCol(0xd8a060),0.35*Math.abs(x)/0.044); }));   // a waxed handlebar: tapered, the tips curled up
        } return out; },

      /* ---- the torso: tabard panels, collar, buckle, sling straps ---- */
      torso:()=>{ const out=[tabardPanel(true),tabardPanel(false),emblem()];
        // the belt's buckle: a gold plate with a red centre
        const sb=torsoSize(X,D,0.045);
        out.push(pc(vbox(0.058,0.044,0.012,0,0.045*TK,-sb.rz-0.012),(x,y,z,c)=>{ c.set(GOLD); if(Math.abs(x)<0.014&&Math.abs(y-0.045*TK)<0.011) c.set(EMBER); }));
        // the drum's sling: a leather strap from the right shoulder across the chest to the left hip, and its twin across the back, a gold line down each edge
        for(const side of [-1,1]){ const P=[]; for(let i=0;i<=8;i++){ const f=i/8, yd=lerp(0.5,-0.01,f), s=torsoSize(X,D,Math.max(yd,0.0)), x=lerp(0.1,-0.135,f)*D.B; P.push([x*1.0,yd*TK,side*(s.rz+0.016)*(yd>0.4?1.0:1)+0]); }
          for(const p of P){ p[2]=side>0?Math.abs(p[2]):-Math.abs(p[2]); }
          out.push(pc(ofRibbon(P,0.04,{up:[0,0,side],seg:sg(20),th:0.004}),(x,y,z,c)=>{ c.set(LEATHER); const cross=Math.abs(x-lerp(0.1,-0.135,(0.5*TK-y)/(0.51*TK))*D.B)*1.0; if(cross<0.0 ) c.set(GOLD); c.multiplyScalar(0.95); })); }
        return out; },

      /* ---- the shoulders: a gold epaulet with a red edge and a fringe of gold tubes ---- */
      shoulder:sd=>{ const out=[], r=0.059*aw;
        out.push(pc(new THREE.SphereGeometry(r,sg(18),sg(10),0,TAU,0,Math.PI*0.62).scale(1.05,0.78,1.1).translate(0,0.004,0),(x,y,z,c)=>{ c.set(GOLD); c.multiplyScalar(0.9+0.2*Math.max(0,y*14)); if(y<0.001+0.0){ mix(c,cE,0.75); } if(Math.abs(x)<0.004) mix(c,cE,0.6); }));
        for(let i=0;i<9;i++){ const a=-Math.PI*0.55+i*(Math.PI*1.1/8), px=Math.sin(a)*r*1.04, pz=Math.cos(a)*r*1.1*0+(-Math.cos(a))*r*1.06; out.push(solid(sweepTube([[px,-0.022,pz],[px*1.05,-0.04,pz*1.05],[px*1.08,-0.062,pz*1.08]],[0.0034,0.0031,0.0022],sg(4),{cap:'round',rings:6}),i%3===1?EMBER:GOLD)); }
        return out; },
      // a gold band and a red edge at the cuff
      forearm:sd=>[solid(ofRingAt([0,-0.1987,0],[0,1,0],0.0265*aw+0.001,0.0028,sg(5)),0xf0d070),solid(ofRingAt([0,-0.2125,0],[0,1,0],0.0245*aw+0.0008,0.0024,sg(5)),EMBER)],

      /* ---- the breeches: flared at the thigh, with a gold knee band ---- */
      thigh:sd=>{ const tw=D.tw, st=[[0,0.1*tw,0.104*tw],[0.14,0.103*tw,0.107*tw],[0.42,0.089*tw,0.093*tw],[0.76,0.066*tw,0.07*tw],[1,D.KR*1.05,D.KR*1.09]];
        const g=limb(st,D.thigh,sg(18),sg(14),{cuts:[0.9,0.98],openTop:true,cap:2}); return [pc(g,(x,y,z,c)=>{ paint('thigh',c,x,y,z,sd); c.multiplyScalar(0.98); })].map(m=>m); },

      /* ---- the boots: a flat heel plate; the gold rim and the rivets are painted ---- */
      shin:sd=>{ const out=[], A=D.ankleH;
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-A+0.006,0.045),0x8a6a28));            // the heel plate
        out.push(pc(ofRingAt([0,-D.shin*0.07,0],[0,1,0],0.055*D.cw+0.002,0.004,sg(6)),(x,y,z,c)=>c.set(0xe0c060)));    // a turned top: a thick gold ring at the rim
        return out; },

      /* ---- the drum: loose from the body so it can half-follow the left thigh; the weapon dressing ---- */
      extras:(rig,Xx,has)=>{   // has(slot): this outfit's item for the slot is worn: the drum is slung from the tabard
        if(!has('top')) return;
        const drum=new THREE.Group(), parts=[], R=0.105, Hh=0.1;
        parts.push(pc(new THREE.CylinderGeometry(R,R,Hh,sg(28),1,true),(x,y,z,c)=>{ c.set(CREAM); mix(c,ofCol(0xd8caa0),0.3*Math.abs(Math.sin(Math.atan2(z,x)*6))); }));          // the shell: cream
        parts.push(pc(new THREE.CylinderGeometry(R*0.985,R*0.985,0.004,sg(28)).translate(0,Hh/2,0),(x,y,z,c)=>{ c.set(0xf4ecd4); }));                                         // the head
        parts.push(pc(new THREE.CylinderGeometry(R*0.985,R*0.985,0.004,sg(28)).translate(0,-Hh/2,0),(x,y,z,c)=>{ c.set(0xe4d8b8); }));
        for(const yy of [Hh/2,-Hh/2]) parts.push(solid(ofRingAt([0,yy,0],[0,1,0],R+0.002,0.0075,sg(6)).rotateX(0),EMBER));                                                 // two red hoops
        for(let i=0;i<8;i++){ const a=i*TAU/8; parts.push(solid(cyl(0.0035,0.0035,Hh+0.012,5).translate(Math.sin(a)*(R+0.009),0,Math.cos(a)*(R+0.009)),0xc8a850)); }       // brass tension rods
        parts.push(solid(csph(0.012,6,5).translate(0,Hh/2+0.002,0),GOLD));
        const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=true; drum.add(m);
        for(const sx of [-1,1]) { const st=new THREE.Mesh(merge([solid(cyl(0.006,0.0045,0.2,6).translate(0,0,0),0xd8c8a0),solid(csph(0.0085,6,5).translate(0,0.1,0),0xd8c8a0)]),matChar); st.position.set(sx*0.03,0.07,0.115); st.rotation.set(0.5,0,sx*0.4); drum.add(st); }
        drum.position.set(-(D.hx+0.1),-0.11,-0.2); drum.rotation.set(-0.5,0.2,0.42);
        rig.hips.add(drum);
        rig.anims.push(()=>{ drum.rotation.x=-0.5+rig.hipL.rotation.x*0.55; });
      },

      /* ---- the weapon dressing: red leather and gold wire, steel with gold fittings, dark ash, flame notches, a pennant and a tiny drum ---- */
      dress:{ shape:{sword:'saber',bow:'crescent',staff:'banner'}, grip:EMBER, metal:0xd9e2ea, wood:0x4a3a2c, accent:GOLD,
        trim:(c,u,part)=>{ const f=((u/0.04)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.3) c.lerp(cG,0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.35) c.lerp(cG,0.9); },
        charm:()=>{ const lit=[], glow=[];
          const P=[[0,-0.02,0.004],[0,-0.06,0.012],[0,-0.1,0.014],[0.005,-0.14,0.026]];
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.02,0.004]],[0.0016,0.0016],4,{cap:'round',rings:4}),GOLD));
          lit.push(pc(ofRibbon(P,u=>0.032*(1-0.15*u),{up:[1,0,0],seg:10}),(x,y,z,c)=>{ c.set(EMBER); if(y<-0.12) c.set(GOLD); if(Math.abs(x)<0.001&&y<-0.1) c.set(EMBER); }));
          // a swallow-tail: a notch in the lower edge is made by two little gold tips
          glow.push(pc(ofRibbon([[0.0,-0.14,0.022],[0.0,-0.155,0.03]],0.006,{up:[1,0,0],seg:3}),(x,y,z,c)=>c.set(0xff7a3a)));
          lit.push(pc(new THREE.CylinderGeometry(0.0095,0.0095,0.011,10).translate(0.0,-0.02,-0.026),(x,y,z,c)=>{ c.set(CREAM); if(Math.abs(y+0.02)>0.004) c.set(EMBER); }));   // the tiny drum
          return {lit,glow}; } },
    };
  };
})();
