//@ Ogden's outfit (a drowned gravedigger): a moth-eaten flat cap with a weed growing from it, straggling grey hair, stitched and blotched face, a burgundy waistcoat over a torn shirt and an open rib patch, ragged breeches, one split boot and the grave-spade weapon dressing with a rusted bell
/* ---------- Ogden: grinder, water. Design: docs/skillkits/looks/ogden.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: moss 0x6f8f6b, bone 0xe5e0c8, mud 0x5a4632, dirty linen 0xcfc7a8, black 0x24211f, burgundy 0x6a2c2c, drowned teal 0x4fd0c0 (the bell's drip only, an unlit glow). Silhouette: a slouch: a low flat cap, a long torn
   waistcoat, ragged breeches over bare green shins, a rope and a toe tag at the neck. The skin of the player stays (face, neck, hands); the arms and shins are painted moss green so the body reads dead. Two or more colours per part. */
CHAR_MODELS.ogden={id:'ogden',name:'Ogden',signature:true, hairGrad:{mode:'ombre',c2:0x5a7a50}, items:{hat:'Diggers cap',hair:'Straggle',face:'Stitches & blotches',top:'Grave waistcoat',bottom:'Torn breeches',shoes:'Split boots',weapon:'Grave spade'},sexes:['male'],
  note:'The gravedigger: heavy, stooped and long in the arm, built for a broad, tall man.',
  ranges:{height:[0.98,1.08],build:[1.0,1.18],chest:[0.9,1.2],waist:[0.95,1.15],hips:[0.9,1.15],legs:[0.92,1.06],neck:[0.9,1.15],arms:[1.0,1.25],head:[0.95,1.08],hairLength:[0.8,1.2],hairVolume:[0.9,1.1]},
  setups:[{id:'ogden',name:'Ogden',sex:'male',def:true,note:'The gravedigger as drawn: big, stooped, long-armed, a heavy jaw.',v:{height:1.04,build:1.1,chest:1.0,shoulders:1.05,waist:1.1,torso:1.0,legs:0.96,thighs:1.05,arms:1.15,neck:1.0,hands:1.15,feet:1.1,jaw:1.15,chin:1.1,cheeks:0.85,noseSize:1.1,mouthSize:1.05,smile:0.0,hairLength:0.9,hairVolume:0.92}}]};

OUTFITS.ogden=(function(){
  const MOSS=0x6f8f6b, MOSS_D=0x516b50, BONE=0xe5e0c8, MUD=0x5a4632, LINEN=0xcfc7a8, BLACK=0x24211f, BURG=0x6a2c2c, RUST=0x7d6a58, ROPE=0x8a7048, GREY=0x6f6a5a;
  const fr=x=>x-Math.floor(x), cM=ofCol(MOSS), cMu=ofCol(MUD);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;
    // a torn edge: where a garment stops, a ragged line (angle-dependent), so the dead skin shows below it
    const torn=(t,a,k,amp)=>t>k+amp*Math.sin(a*7)+amp*0.6*Math.sin(a*3+1);
    const rot=(c,x,y,z)=>{ c.set(MOSS); const n=Math.sin(x*60+y*35)*Math.sin(z*50+y*20); if(n>0.45) c.set(MOSS_D); else if(n<-0.7) c.set(0x7a7f6a); };

    /* ---- the paint of the body: a dirty shirt with a torn rib patch under a waistcoat, rotten green arms, black breeches torn off above the knee, mud boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(LINEN); if(fr(x*9+y*7)<0.14) c.lerp(cMu,0.55); if(y>0.545) c.set(BLACK);
          if(z<0&&Math.hypot((x-0.045)/0.055,(y-0.23)/0.07)<1){ rot(c,x,y,z); if(fr(y*52)<0.28) c.set(BONE); }   // a torn hole in the shirt: the ribs show
          return; }
        case 'upperArm': { if(-y<D.upper*0.35) c.set(LINEN); else rot(c,x,y,z); if(-y>D.upper*0.8&&-y<D.upper*0.86) c.set(ROPE); return; }
        case 'foreArm': { if(y<-0.222){ rot(c,x,y,z); c.lerp(cM,0.3); } else if(y<-0.19) c.set(ROPE); else rot(c,x,y,z); if(y<-0.12&&y>-0.18&&Math.abs(x)<0.014&&z<0) c.set(BONE); return; }
        case 'thigh': { const t=-y/D.thigh, a=Math.atan2(z,x*sd); c.set(BLACK); if(fr(x*7+y*9)<0.1) c.set(MUD); if(torn(t,a,0.74,0.06)) rot(c,x,y,z); if(t<0.3&&fr(y*14+x*4)<0.1) c.set(0x3a3835); return; }
        case 'shin': { const t=-y/D.shin, a=Math.atan2(z,x*sd); c.set(MUD); c.lerp(ofCol(BLACK),0.5*Math.max(0,Math.sin(y*38+x*25))); if(t<0.05) c.set(ROPE); else if(t>0.7&&t<0.74) c.set(BLACK); if(torn(t,a,0.76,0.04)&&sd>0) rot(c,x,y,z); return; }
        case 'foot': { c.set(MUD); if(y<-D.ankleH+0.012) c.set(BLACK); if(sd>0&&z<-0.085){ rot(c,x,y,z); } return; }
      }
      c.set(LINEN); };

    /* ---- the waistcoat: two burgundy front panels with a gap, a back panel, a torn hem, bone buttons; a torn collar, a rope with a toe tag ---- */
    const vest=(a0,a1,front,side)=>{ const rings=[], s0=torsoSize(X,D,0.0); for(let i=0;i<=12;i++){ const f=i/12, yd=lerp(0.47,0.0,f), s=torsoSize(X,D,yd); rings.push({y:yd*TK,rx:s.rx+0.008,rz:(front?s.rz:s.rzBack)+0.008}); }
      for(const dy of [0.05,0.12,0.19]){ const k=dy/0.19; rings.push({y:-dy,rx:s0.rx+0.008+0.03*k,rz:(front?s0.rz:s0.rzBack)+0.008+0.03*k}); }
      const g=pc(ofLoft(rings,sg(14),a0,a1),(x,y,z,c)=>{ c.set(BURG); c.multiplyScalar(0.86+0.2*fr(x*20+y*11)); if(y<-0.15) c.lerp(cMu,0.5); if(Math.abs(x)<0.002) c.set(BLACK); if(fr(y*30)<0.05&&y<0.3*TK) c.lerp(cMu,0.5); });
      const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<-0.188){ const a=Math.atan2(p.getX(i),p.getZ(i)); p.setY(i,p.getY(i)-0.05*Math.pow(Math.abs(fr(a*4.5/TAU+side*0.31)*2-1),1.5)); } p.needsUpdate=true; return g; };
    const buttons=()=>{ const out=[]; for(let i=0;i<5;i++){ const yd=0.42-i*0.07, s=torsoSize(X,D,yd); out.push(solid(csph(0.0065,sg(7),sg(6)).translate(-0.02,yd*TK,-s.rz*Math.sqrt(Math.max(0.2,1-Math.pow(0.02/s.rx,2)))-0.012),BONE)); } return out; };
    const neck=()=>{ const out=[], R=D.neckR*1.6+0.004; out.push(solid(ofRingAt([0,0.585*TK,0],[0,1,0],R,0.0055,sg(6)),ROPE));
      out.push(solid(sweepTube([[0,0.585*TK,-R],[0,0.5*TK,-R-0.012],[0,0.42*TK,-R-0.016]],[0.0045,0.0042,0.004],sg(5),{cap:'round',rings:8}),ROPE));
      out.push(pc(vbox(0.034,0.05,0.004,0,0.38*TK,-torsoSize(X,D,0.38).rz-0.022).rotateZ(0.08),(x,y,z,c)=>{ c.set(BONE); if(y>0.38*TK+0.016) c.set(ROPE); }));
      const rc=torsoSize(X,D,0.56); out.push(pc(ofLoft([{y:0.6*TK,rx:D.neckR*1.5,rz:D.neckR*1.5},{y:0.565*TK,rx:rc.rx*0.7,rz:rc.rz*0.9},{y:0.54*TK,rx:rc.rx*0.95,rz:rc.rz*1.05}],sg(24),0,TAU),(x,y,z,c)=>{ c.set(LINEN); if(y<0.552*TK) c.set(BURG); }));
      return out; };
    const shred=(P,w,up,seg,col)=>pc(ofRibbon(P,u=>w*(1-0.6*u),{up,seg,th:0.002}),(x,y,z,c)=>{ c.set(col); c.lerp(cMu,0.4*clamp((P[0][1]-y)/0.3)); });

    /* ---- the cap: low and flat, mud brown with a black band, a moth-hole, a moss patch; a weed with a tiny white flower grows from the top ---- */
    const cap=F=>{ const out=[], rr=[[0.15,0.004],[0.147,0.07],[0.132,0.118],[0.105,0.137],[0.072,0.138],[0.04,0.126]]; const rings=rr.map(([y,r])=>({y:y,rx:r,rz:r*1.06,zc:0.01}));
      rings.reverse(); rings.sort((a,b)=>b.y-a.y);
      out.push(pc(ofLoft(rings,sg(34),0,TAU),(x,y,z,c)=>{ c.set(MUD); c.multiplyScalar(0.9+0.2*fr(x*25+z*18)); if(y<0.075) c.set(BLACK); if(Math.hypot(x-0.05,z+0.07)<0.022&&y>0.1) c.set(MOSS_D); if(Math.hypot(x+0.06,z-0.03)<0.012&&y>0.11) c.set(0x14110f); }));
      out.push(pc(new THREE.CylinderGeometry(0.115,0.115,0.007,sg(24),1,false,Math.PI/2,Math.PI).rotateX(0.18).translate(0,0.042,-0.02),(x,y,z,c)=>{ c.set(BLACK); if(z<-0.108) c.set(MUD); }));
      for(const [dx,dz,h] of [[0.0,0.0,0.07],[0.015,0.012,0.05],[-0.012,0.008,0.04]]){ out.push(solid(sweepTube([[dx*0.3,0.136,dz*0.3+0.01],[dx,0.136+h*0.5,dz+0.01],[dx*1.5,0.136+h,dz*1.6+0.01]],[0.0028,0.0024,0.0012],sg(4),{cap:'point',rings:8}),0x5f8a4a)); }
      out.push(solid(csph(0.008,sg(8),sg(6)).scale(1,0.5,1).translate(0.002,0.208,0.012),0xf2eee0),solid(csph(0.0035,5,4).translate(0.002,0.21,0.012),0xd8b83a));
      return out; };
    const straggle=(F,T)=>{ T.crown(0.113,0.42,0.3); T.sideLocks(0.04); T.backLocks(sg(7),0.06,23);
      const out=[]; for(let i=0;i<5;i++){ const x=(i-2)*0.034, L=0.12+0.09*((i*7)%4)/3; T.add(sweepTube([[x,0.02,0.1],[x*1.1,0.0,0.112],[x*1.2,-L*0.5,0.116],[x*1.2+0.01,-L,0.112]],[0.006,0.0065,0.005,0.002],sg(5),{cap:'point',rings:sg(10)}),(xx,yy,zz,c)=>{ T.hp(xx,yy,zz,c); }); }
      return out; };
    const mark=F=>{ const out=[]; const sc=csph(1,sg(8),sg(6)).scale(0.0016,0.048,0.0009).rotateZ(-0.42); out.push(solid(F.place(sc,-0.058,-0.02,0.0007),0xc9b8a0));
      for(let i=0;i<5;i++){ const t=i/4, cx=-0.058+(t-0.5)*-0.045, cy=-0.02+(0.5-t)*0.04+0.0; const st=csph(1,5,4).scale(0.012,0.0014,0.0008).rotateZ(-0.42+Math.PI/2); out.push(solid(F.place(st,cx,cy,0.0008),0x3a2c26)); }
      out.push(pc(F.place(csph(1,sg(8),sg(6)).scale(0.026,0.02,0.0009),0.056,-0.03,0.0006),(x,y,z,c)=>c.set(MOSS)));
      for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.026,0.0075,0.0008),sd*0.046,-0.018,0.0006),0x4a5a52));
      return out; };

    return {
      aura:{col:0x7fbf9a,col2:0xc8e8d0,style:'rise',ring:false,n:5,shape:'wisp',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x6a2c2c,bottom:0x24211f,shoes:0x5a4632,hat:0x5a4632}, bootTop:0.7, shinCut:0.7, boot:true, skinFrom:0.545, hairColor:GREY, eyeColor:0xd8d070,
      eyes:{iris:0.78,hl:1,tilt:-0.05,lash:0.2,h:0.92,browLift:-0.002,browThick:0.8},
      cuts:{torso:[0.545],upperArm:[0.35,0.8,0.86],foreArm:[0.19/D.fore,0.222/D.fore],thigh:[],shin:[0.05,0.7,0.74]},
      paint,
      head:F=>cap(F),
      hair:(F,T)=>straggle(F,T),
      mark,
      torso:()=>[vest(Math.PI-0.95,Math.PI-0.1,true,0),vest(Math.PI+0.1,Math.PI+0.95,true,1),vest(-0.95,0.95,false,2),...buttons(),...neck()],
      shoulder:sd=>{ const out=[], r=0.055*aw; if(sd<0){ for(let i=0;i<4;i++){ const a=-0.5+i*0.33; out.push(shred([[Math.sin(a)*r,-0.01,Math.cos(a)*r],[Math.sin(a)*r*1.15,-0.07-i*0.01,Math.cos(a)*r*1.1],[Math.sin(a)*r*1.2,-0.13-i*0.018,Math.cos(a)*r*1.1]],0.024,[Math.sin(a),0,Math.cos(a)],sg(8),LINEN)); } }
        else { out.push(solid(ofRingAt([0,-0.02,0],[0,1,0],r+0.0015,0.005,sg(6)),ROPE)); out.push(pc(csph(0.02,sg(8),sg(6)).scale(1.4,0.5,1).translate(0.02,0.045,0),(x,y,z,c)=>c.set(MOSS_D))); }
        return out; },
      forearm:sd=>[solid(ofRingAt([0,-0.2,0],[0,1,0],0.0275*aw+0.001,0.0034,sg(6)),ROPE),solid(ofRingAt([0,-0.0,0],[0,1,0],0.0345*aw+0.001,0.003,sg(5)),MUD)],
      hips:()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.01, out=[];
        out.push(pc(ofLoft([{y:0.06*TK,rx:s.rx+0.008,rz},{y:0.055*TK,rx:s.rx+0.011,rz:rz+0.003},{y:0.0,rx:s.rx+0.011,rz:rz+0.003},{y:-0.005,rx:s.rx+0.008,rz}],sg(34),0,TAU),(x,y,z,c)=>{ c.set(MUD); if(y>0.055*TK-0.005||y<0.003) c.set(BLACK); }));
        out.push(pc(vbox(0.044,0.036,0.008,0.0,0.03*TK,-rz-0.012),(x,y,z,c)=>{ c.set(RUST); if(Math.abs(x)<0.01&&Math.abs(y-0.03*TK)<0.009) c.set(BLACK); }));
        out.push(pc(vbox(0.05,0.06,0.03,D.hx+0.1,-0.02,0.0),(x,y,z,c)=>{ c.set(MUD); if(y>0.0) c.set(BLACK); }));
        for(const [dx,L] of [[0.07,0.22],[-0.09,0.16]]) out.push(shred([[dx,0.0,-rz-0.008],[dx,-L*0.5,-rz-0.016],[dx+0.012,-L,-rz-0.01]],0.05,[0,0,-1],sg(8),BLACK));
        return out; },
      thigh:sd=>[],
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.05,0],[0,1,0],0.053*D.cw+0.002,0.004,sg(6)),ROPE)); out.push(solid(ofRingAt([0,-D.shin*0.72,0],[0,1,0],0.044*D.cw+0.002,0.0042,sg(6)),RUST));
        out.push(solid(csph(0.012,sg(8),sg(6)).scale(1.2,0.7,1).translate(sd*0.03,-D.shin*0.76,-0.03*D.cw),MOSS_D));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.046,0,-D.shin-D.ankleH+0.006,0.045),0x14110f)); return out; },
      dress:{ shape:{sword:'spade',bow:'crossbow',staff:'bell'}, grip:ROPE, metal:RUST, wood:MUD, accent:MOSS,
        trim:(c,u,part)=>{ const f=((u/0.07)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.22) c.lerp(cMu,0.7); if(part==='grip'&&((u/0.012)%1+1)%1<0.4) c.lerp(ofCol(MUD),0.6); },
        charm:()=>{ const lit=[], glow=[];   // a rusted grave bell on a cord, its clapper dripping
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.022,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),ROPE));
          const pts=[[0,-0.03],[0.012,-0.034],[0.016,-0.05],[0.02,-0.066],[0.024,-0.072]].map(q=>new THREE.Vector2(q[0],q[1]));
          lit.push(pc(new THREE.LatheGeometry(pts,sg(10)).translate(0,0,0.004),(x,y,z,c)=>{ c.set(0x8a6a38); if(y<-0.064) c.set(RUST); }));
          lit.push(solid(csph(0.0045,6,5).translate(0,-0.074,0.004),RUST));
          glow.push(pc(new THREE.LatheGeometry([[0,-0.082],[0.0026,-0.085],[0.0032,-0.089],[0.002,-0.093],[0,-0.095]].map(q=>new THREE.Vector2(q[0],q[1])),6).translate(0,0,0.004),(x,y,z,c)=>c.set(0x4fd0c0)));
          return {lit,glow}; } },
    };
  };
})();
