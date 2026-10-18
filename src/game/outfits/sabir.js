//@ Sabir's outfit (a dune raider): a wrapped sand turban with a trailing crimson tail, a face veil and a bandit's kohl, a crossed bandolier and a single leather pauldron, baggy sarwal with a fringed crimson sash and a scabbard, buckled boots and the raider-rig weapon dressing
/* ---------- Sabir: risk DPS, fire. Design: docs/skillkits/looks/sabir.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: sand 0xd2b27a, crimson 0xa8322a, indigo 0x23233a, leather 0x5a3a24, brass 0xc89a3c, ember 0xff8a3a (the weapon charm's glow only). Silhouette: a wide wrapped head, a lean torso under crossed straps,
   baggy shorts over tall boots, a sash with long tails and a curved sheath at the hip. Every part has at least two colours (sand and crimson at the least); the emblem is a brass coin, never a crescent or a star. */
CHAR_MODELS.sabir={id:'sabir',name:'Sabir',signature:true, hairGrad:{mode:'tips',c2:0xb02a2a}, items:{hat:'Dune turban',hair:'Rope braid',face:'Veil & kohl',top:'Raider harness',bottom:'Sash sarwal',shoes:'Buckled boots',weapon:'Raider rig'},sexes:['male'],
  note:'The dune raider: lean, wide-shouldered and quick, built for a long-limbed man.',
  ranges:{height:[0.98,1.08],build:[0.9,1.08],chest:[0.8,1.15],waist:[0.82,1.05],hips:[0.88,1.1],legs:[1.0,1.14],neck:[0.9,1.15],arms:[0.95,1.2],head:[0.95,1.08],hairLength:[0.8,1.2],hairVolume:[0.9,1.15]},
  setups:[{id:'sabir',name:'Sabir',sex:'male',def:true,note:'The raider as drawn: lean, sharp-jawed, long in the leg.',v:{height:1.04,build:0.98,chest:0.95,shoulders:1.08,waist:0.92,torso:0.98,legs:1.08,thighs:0.95,arms:1.08,neck:1.0,hands:1.05,feet:1.0,jaw:1.08,chin:1.1,cheeks:0.9,noseSize:1.1,mouthSize:0.95,smile:0.35,hairLength:1.0,hairVolume:1.0}}]};

OUTFITS.sabir=(function(){
  const SAND=0xd2b27a, SAND_D=0xa88a52, CRIM=0xa8322a, INDIGO=0x23233a, LEATHER=0x5a3a24, BRASS=0xc89a3c, STEEL=0xc9ccd4, HAIR=0x2b2018;
  const cS=ofCol(SAND), cC=ofCol(CRIM), cB=ofCol(BRASS), cL=ofCol(LEATHER);
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;

    /* ---- the paint of the body: a sand shirt under a leather vest, indigo knee bands, tall leather boots with a crimson top ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(SAND); const ax=Math.abs(x); if(y>0.03&&y<0.54&&ax>0.034&&ax<0.2) c.set(LEATHER); if(y>0.03&&y<0.54&&ax>0.034&&ax<0.2&&fr(y*50)<0.06) c.set(SAND_D); if(y>0.545) c.set(INDIGO); return; }
        case 'upperArm': c.set(SAND); if(-y>D.upper*0.5&&-y<D.upper*0.56) c.set(CRIM); return;
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.12){ c.set(LEATHER); if(y<-0.128&&y>-0.138) c.set(BRASS); } else c.set(SAND); return; }
        case 'thigh': { const t=-y/D.thigh; c.set(SAND); if(t>0.86&&t<0.97) c.set(INDIGO); else if(Math.abs(Math.atan2(z,x*sd))<0.14) c.set(CRIM); return; }
        case 'shin': { const t=-y/D.shin; c.set(LEATHER); c.multiplyScalar(0.92+0.12*Math.max(0,-z*9)); if(t<0.04) c.set(INDIGO); else if(t<0.09) c.set(CRIM); else if(t>0.16&&t<0.19) c.set(BRASS); else if(t>0.5&&t<0.53) c.set(BRASS); return; }
        case 'foot': { c.set(LEATHER); if(y<-D.ankleH+0.012) c.set(0x211710); else if(z<-0.09) c.set(BRASS); return; }
      }
      c.set(SAND); };

    /* ---- the turban: a wide wrapped dome (sand, with crimson bands), a brass coin at the brow, a long crimson-and-sand tail ---- */
    const turban=F=>{ const out=[], R=0.138, H=0.156, y0=0.045, t1=Math.acos(y0/H), rings=[{y:H,rx:0.002,rz:0.002,zc:0.008}];
      for(let i=0;i<=9;i++){ const t=lerp(0.18,t1,i/9); rings.push({y:H*Math.cos(t),rx:R*Math.sin(t),rz:R*Math.sin(t)*1.05,zc:0.008}); }
      out.push(pc(ofLoft(rings,sg(36),0,TAU),(x,y,z,c)=>{ const a=Math.atan2(x,z+0.008); c.set(SAND); const w=fr(a/TAU*2+y*9); if(w<0.12) c.set(SAND_D); if(y<0.07) c.set(CRIM); }));
      for(const [y,k] of [[0.05,1.0],[0.09,0.9],[0.12,0.72]]){ const r=R*Math.sqrt(Math.max(0.05,1-Math.pow(y/H,2)))*k; out.push(solid(ofRingAt([0,y,0.008],[0,1,0],r*1.0+0.002,0.0075,sg(6)).scale(1,1,1.05),y<0.07?CRIM:SAND_D)); }
      out.push(pc(new THREE.CylinderGeometry(0.014,0.014,0.004,sg(14)).rotateX(Math.PI/2).translate(0,0.06,-0.148),(x,y,z,c)=>{ c.set(BRASS); if(Math.hypot(x,y-0.06)<0.007) c.set(0xe0b860); }));
      out.push(pc(ofRibbon([[0.05,0.03,0.135],[0.08,-0.06,0.15],[0.09,-0.16,0.14],[0.1,-0.27,0.12]],u=>0.07*(1-0.3*u),{up:[0.3,0,1],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(CRIM); if(fr(y*30)<0.18) c.set(SAND); if(y<-0.26) c.set(BRASS); }));
      return out; };

    /* ---- the hair: a dark crop with one long rope braid over the left shoulder, brass beads and a crimson tie ---- */
    const braid=(F,T)=>{ T.crown(0.113,0.5,0.3); T.fringe(7,0.9,0.1); T.sideLocks(0.05); T.backLocks(sg(14),0,17);
      const out=[], len=0.34*T.hl, P=[]; for(let i=0;i<=10;i++){ const t=i/10; P.push([-0.04-0.05*t,-0.03-len*t,0.09+0.05*Math.sin(t*2.4)]); }
      T.add(sweepTube(P,[0.02,0.024,0.024,0.021,0.016,0.003],sg(8),{cap:'point',rings:sg(30)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.9+0.12*Math.sin(y*160)); });
      for(const t of [0.18,0.5,0.86]){ const p=P[Math.round(t*10)], q=P[Math.min(10,Math.round(t*10)+1)]; out.push(solid(ofRingAt(p,[q[0]-p[0],q[1]-p[1],q[2]-p[2]],0.0235*(1-0.3*t),0.0045,sg(6)),t===0.5?BRASS:CRIM)); }
      return out; };

    /* ---- the veil: indigo cloth over nose and mouth, a brass pin at the cheek (a patch laid on the face, its edges curved) ---- */
    const veil=F=>{ const nx=sg(26), ny=sg(14), g=ofPatch(-0.066,0.066,0,1,nx,ny,()=>0,true), p=g.attributes.position;
      for(let i=0;i<p.count;i++){ const x=p.getX(i), v=p.getY(i), ax=Math.abs(x)/0.066, top=-0.03+0.034*ax*ax, bot=-0.098-0.008*ax, y=lerp(bot,top,v); p.setY(i,y); p.setZ(i,F.zAt(x,y)-0.0042); }
      g.computeVertexNormals();
      return [pc(g,(x,y,z,c)=>{ c.set(INDIGO); const ax=Math.abs(x)/0.066, top=-0.03+0.034*ax*ax; if(y>top-0.005) c.set(CRIM); c.multiplyScalar(0.92+0.12*Math.sin(x*140+y*40)*0.5+0.06); }),
        solid(csph(0.006,sg(8),sg(6)).translate(-0.066,-0.014,F.zAt(-0.066,-0.014)-0.007),BRASS)]; };
    const mark=F=>{ const out=[]; for(const sd of [-1,1]){ const g=csph(1,sg(8),sg(6)).scale(0.034,0.0042,0.0009).rotateZ(sd*0.1); out.push(solid(F.place(g,sd*0.052,-0.012,0.0008),0x17141c)); }
      const sc=csph(1,sg(8),sg(6)).scale(0.0012,0.02,0.0008).rotateZ(0.5); out.push(solid(F.place(sc,0.05,0.026,0.0008),0xe8c8b0)); return out; };

    /* ---- the harness: two crossed leather bandoliers with brass cartridges, an indigo neck scarf with a tail, a leather pauldron with brass studs on the right shoulder ---- */
    const bandolier=sd=>{ const out=[], P=[], P2=[]; for(let i=0;i<=8;i++){ const f=i/8, yd=lerp(0.5,0.02,f), s=torsoSize(X,D,yd), x=sd*lerp(0.1,-0.12,f)*D.B; P.push([x,yd*TK,-(s.rz+0.014)]); P2.push([x,yd*TK,s.rzBack+0.014]); }
      out.push(pc(ofRibbon(P,0.036,{up:[0,0,-1],seg:sg(20),th:0.004}),(x,y,z,c)=>{ c.set(LEATHER); }));
      out.push(pc(ofRibbon(P2,0.036,{up:[0,0,1],seg:sg(20),th:0.004}),(x,y,z,c)=>{ c.set(LEATHER); }));
      if(sd>0) for(let i=1;i<8;i++){ const p=P[i]; out.push(solid(cyl(0.0042,0.0042,0.028,sg(6)).translate(p[0],p[1],p[2]-0.006),i%2?BRASS:0xe0b860)); } else out.push(solid(vbox(0.03,0.026,0.012,P[4][0],P[4][1],P[4][2]-0.008),BRASS));
      return out; };
    const scarf=()=>{ const s=torsoSize(X,D,0.56), r=[]; for(const [yd,k] of [[0.62,1.0],[0.585,1.0],[0.555,1.0]]) r.push({y:yd*TK,rx:D.neckR*1.45+0.004,rz:D.neckR*1.45+0.004,zc:-0.002});
      const out=[pc(ofLoft(r,sg(24),0,TAU),(x,y,z,c)=>{ c.set(INDIGO); if(y>0.6*TK) c.set(CRIM); })];
      out.push(pc(ofRibbon([[0.02,0.54*TK,s.rzBack+0.012],[0.04,0.3*TK,s.rzBack+0.03],[0.05,0.08*TK,s.rzBack+0.05],[0.06,-0.1,s.rzBack+0.045]],0.06,{up:[0,0,1],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(INDIGO); if(fr(y*22)<0.16) c.set(CRIM); }));
      return out; };

    return {
      aura:{col:0xd8b070,col2:0xf0d9a0,style:'orbit',ring:false,n:8,shape:'grain',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0xd2b27a,bottom:0xd2b27a,shoes:0x5a3a24,hat:0xd2b27a}, bootTop:0.04, shinCut:0, boot:true, skinFrom:0.545, hairColor:HAIR, eyeColor:0xd09a30,
      eyes:{iris:0.95,hl:1,tilt:-0.15,lash:0.5,h:0.82,browLift:-0.002,browThick:1.3},
      cuts:{torso:[0.03,0.545],upperArm:[0.5,0.56],foreArm:[0.12/D.fore,0.128/D.fore,0.138/D.fore,0.222/D.fore],thigh:[0.86,0.97],shin:[0.04,0.09,0.16,0.19,0.5,0.53]},
      paint,
      head:F=>turban(F),
      hair:(F,T)=>braid(F,T),
      mark, facial:F=>veil(F),
      torso:()=>[...bandolier(1),...bandolier(-1),...scarf()],
      shoulder:sd=>{ const out=[]; if(sd>0){ const r=0.063*aw; out.push(pc(new THREE.SphereGeometry(r,sg(18),sg(10),0,TAU,0,Math.PI*0.6).scale(1.08,0.8,1.1).translate(0,0.005,0),(x,y,z,c)=>{ c.set(LEATHER); c.multiplyScalar(0.9+0.2*Math.max(0,y*14)); if(y<0.002) c.set(BRASS); }));
          for(let i=0;i<6;i++){ const a=-Math.PI*0.5+i*Math.PI/5; out.push(solid(csph(0.0055,sg(6),sg(5)).translate(Math.sin(a)*r*1.0,0.012,-Math.cos(a)*r*1.0),BRASS)); } }
        else out.push(solid(ofRingAt([0,-0.03,0],[0,1,0],0.052*aw+0.002,0.006,sg(6)),CRIM));
        return out; },
      forearm:sd=>[solid(ofRingAt([0,-0.133,0],[0,1,0],0.0285*aw+0.001,0.0035,sg(6)),BRASS),solid(csph(0.008,sg(7),sg(6)).translate(sd*0.026*aw,-0.13,0),BRASS),solid(ofRingAt([0,-0.056,0],[0,1,0],0.0288*aw+0.001,0.003,sg(5)),CRIM)],

      /* ---- the sash: a wide crimson band with a brass buckle and two long fringed tails at the left hip; a curved leather sheath at the right ---- */
      hips:()=>{ const s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.01, out=[];
        out.push(pc(ofLoft([{y:0.085*TK,rx:s.rx+0.01,rz},{y:0.08*TK,rx:s.rx+0.014,rz:rz+0.004},{y:-0.01,rx:s.rx+0.012,rz:rz+0.004},{y:-0.015,rx:s.rx+0.01,rz}],sg(40),0,TAU),(x,y,z,c)=>{ c.set(CRIM); if(y>0.085*TK-0.008||y<-0.007) c.set(SAND); c.multiplyScalar(0.92+0.1*Math.sin(Math.atan2(x,z)*9)); }));
        out.push(pc(vbox(0.05,0.045,0.01,0,0.036,-rz-0.014),(x,y,z,c)=>{ c.set(BRASS); if(Math.abs(x)<0.012&&Math.abs(y-0.036)<0.012) c.set(CRIM); }));
        for(const [dx,L] of [[-0.07,0.34],[-0.04,0.27]]) out.push(pc(ofRibbon([[dx,0.02,-rz-0.01],[dx-0.012,-0.1,-rz-0.02],[dx-0.02,-L*0.7,-rz-0.016],[dx-0.026,-L,-rz-0.004]],u=>0.045*(1-0.2*u),{up:[0,0,-1],seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(CRIM); if(y<-L+0.035) c.set(BRASS); else if(y<-L+0.05) c.set(SAND); }));
        const Pq=[[D.hx+0.12,0.02,0.02],[D.hx+0.14,-0.06,0.0],[D.hx+0.1,-0.18,-0.07],[D.hx+0.02,-0.27,-0.14]];
        out.push(pc(sweepTube(Pq,[0.021,0.021,0.019,0.014],sg(8),{cap:'round',rings:sg(18)}),(x,y,z,c)=>{ c.set(LEATHER); if(y<-0.22) c.set(BRASS); else if(y>0.0) c.set(BRASS); }));
        return out; },
      thigh:sd=>{ const tw=D.tw, st=[[0,0.1*tw,0.104*tw],[0.2,0.112*tw,0.113*tw],[0.5,0.114*tw,0.112*tw],[0.8,0.095*tw,0.094*tw],[1,D.KR*1.08,D.KR*1.1]];
        return [pc(limb(st,D.thigh,sg(18),sg(14),{cuts:[0.86,0.97],openTop:true,cap:2}),(x,y,z,c)=>{ paint('thigh',c,x,y,z,sd); })]; },
      shin:sd=>{ const out=[]; out.push(solid(ofRingAt([0,-D.shin*0.075,0],[0,1,0],0.055*D.cw+0.002,0.0045,sg(6)),BRASS));
        for(const t of [0.17,0.51]) out.push(solid(ofRingAt([0,-D.shin*t,0],[0,1,0],(t<0.3?0.05:0.043)*D.cw+0.002,0.0033,sg(6)),BRASS));
        out.push(solid(vbox(0.058*(0.55+0.45*S.feet),0.012,0.045,0,-D.shin-D.ankleH+0.006,0.045),0x2e2018)); return out; },
      dress:{ shape:{sword:'scimitar',bow:'recurve',staff:'crescent'}, grip:CRIM, metal:STEEL, wood:0x4a3020, accent:BRASS,
        trim:(c,u,part)=>{ const f=((u/0.06)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&f<0.14) c.lerp(cC,0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.35) c.lerp(cB,0.9); },
        charm:()=>{ const lit=[], glow=[];   // a coin purse on a cord: a leather bag, a brass coin, a spark of ember
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.025,0.004]],[0.0014,0.0014],4,{cap:'round',rings:4}),CRIM));
          lit.push(pc(csph(0.014,sg(10),sg(8)).scale(1,1.1,1).translate(0,-0.042,0.005),(x,y,z,c)=>{ c.set(LEATHER); if(y>-0.032) c.set(CRIM); }));
          lit.push(pc(new THREE.CylinderGeometry(0.011,0.011,0.003,sg(12)).rotateZ(Math.PI/2).translate(0.013,-0.07,0.005),(x,y,z,c)=>{ c.set(BRASS); }));
          glow.push(pc(csph(0.0045,6,5).translate(0.0,-0.062,0.02),(x,y,z,c)=>c.set(0xff8a3a)));
          return {lit,glow}; } },
    };
  };
})();
OUTFITS.sabir=oxPlus(OUTFITS.sabir,(X,D)=>({   // round 4: a wind-torn sand cloak with a crimson hem, knotted crimson sash tails
  hips:()=>oxSash(X,D,{col:0xb02a2a,col2:0x5a1a1a,len:1.15,side:1}),
  cos:{cape:{col:0xd2b27a,trim:0xb02a2a,len:0.9,pat:'dunes',mantle:0}}}));
oxTune('sabir',{jaw:0.95,chin:1.1,cheeks:0.95,brow:0.75,eyeSize:1.12,eyeHeight:0.3,eyeTilt:0.4,noseSize:1.2,undertone:0.85,blush:0,lips:0.9,head:0.98,earSize:1.1});
OUTFITS.sabir=oxPlus(OUTFITS.sabir,(X,D)=>({   // face round 1: sun-bronzed skin, a sharp-eyed amber stare, a brow scar, gold beads on the braid, a ring in the ear
  mark:F=>oxMarks(F,[{t:'scar',side:1,col:0x8a4a3a},{t:'freckles',col:0x9a6a3a}]),
  hair:()=>oxHairBits(X,[{t:'ring',both:true,col:0xe8c050},{t:'beads',side:-1,col:0xe8c050,col2:0xb02a2a}]),
  kit:{eyeColor:0xd8a030,eyes:{iris:1.05,lash:0.7}}}));
Object.assign(CHAR_MODELS.sabir,{hairGrad:{mode:'ombre',c2:0xd8a030,c3:0xb02a2a}});   // face round 2: black to gold to crimson ends
OUTFITS.sabir=oxPlus(OUTFITS.sabir,(X,D)=>({   // face round 3: a gold-tied tail under the turban
  hair:()=>oxHairBits(X,[{t:'tail',len:0.3,col:0xe8c050}])}));
