//@ poseRig (walk, run, sit, talk, attacks) and animateHiker
function poseRig(r,dt,o){
  const sp=o.sp||0, mv=Math.min(sp/4.2,1), run=clamp((sp-5)/4.5), air=!!o.air;
  const ph=o.ph||0, sw=Math.sin(ph), cw=Math.cos(ph), amp=0.55*mv+0.32*run;
  let tL=sw*amp, tR=-sw*amp, kL=-Math.max(0,cw)*amp*1.5-0.05*mv, kR=-Math.max(0,-cw)*amp*1.5-0.05*mv;
  let hipsY=r.hipY+(Math.abs(cw)*0.035-0.03)*mv;
  const breathe=Math.sin(t*1.7+(o.seed||0))*0.025*(1-mv);
  let aL=-sw*amp*0.9+breathe, aR=sw*amp*0.9+breathe, eL=0.12+mv*0.35+run*0.85, eR=eL, lean=-(0.04*mv+0.17*run)+breathe*0.3;
  if(air){ tL=0.75; tR=-0.1; kL=-1.2; kR=-0.5; aL-=0.7; aR-=0.7; }
  if(o.sit){ tL=tR=1.5; kL=kR=-1.45; hipsY=o.sitH||0.5; aL=aR=-0.45; eL=eR=0.8; lean=0.12; }
  if(o.talk){ aR=-0.5+Math.sin(t*2.6+(o.seed||0))*0.28; eR=1.15+Math.sin(t*3.3)*0.25; if(!o.sit) aL=-0.15+Math.sin(t*2.1)*0.1; }
  let twist=null;
  if(o.hold==='staff' && !o.act){ eR=Math.max(eR,1.25); aR+=0.12; }
  if(o.hold==='sword' && !o.act){ eR=Math.max(eR,0.35); }
  if(o.act){
    const a=o.act, p=clamp(a.t/a.dur);
    switch(a.kind){
      case 'slash': if(p<0.4){ aR=2.7; eR=0.45; twist=-0.35; } else { aR=0.15; eR=0.15; twist=0.45; lean=-0.18; } break;
      case 'spin': aR=1.5; eR=0.1; aL=1.2; eL=0.2; break;
      case 'shoot': case 'volley': aL=1.5; eL=0.05; aR=1.45; eR=p<(a.hitAt||0.6)?2.1:0.7; twist=-0.3; break;
      case 'cast': aR=p<0.45?0.9:1.7; eR=p<0.45?1.4:0.3; aL=0.5; break;
      case 'nova': if(p<0.45){ aL=aR=2.9; eL=eR=0.2; } else { aL=aR=0.5; eL=eR=0.2; tL=tR=0.45; kL=kR=-0.9; hipsY-=0.12; } break;
    }
  }
  const k=Math.min(1,dt*(o.act?26:14)), L=(ob,v)=>{ ob.rotation.x+=(v-ob.rotation.x)*k; };
  L(r.hipL,tL); L(r.hipR,tR); L(r.kneeL,kL); L(r.kneeR,kR);
  L(r.shL,aL); L(r.shR,aR); L(r.elL,eL); L(r.elR,eR); L(r.spine,lean);
  r.spine.rotation.y+=((twist!==null?twist:-sw*0.1*mv)-r.spine.rotation.y)*k; r.hips.rotation.y=sw*0.07*mv;
  r.hips.position.y+=(hipsY-r.hips.position.y)*(o.sit?k*0.5:1);
  r.head.rotation.y+=((o.headYaw||0)-r.head.rotation.y)*k;
  r.head.rotation.x=0.05*mv+(o.talk?Math.sin(t*4.2)*0.05:0)+(o.headPitch||0);
}
function animateHiker(dt){
  if(!hiker.rig) return;
  const act=weaponsReady&&!customizing?CB.act:null;
  hiker.g.position.set(P.x,P.y,P.z); hiker.g.rotation.y=P.face+(act&&act.kind==='spin'?clamp(act.t/act.dur)*TAU*2:0);
  const sp=customizing?0:Math.hypot(P.vx,P.vz);
  poseRig(hiker.rig,dt,{sp,ph:P.walk,air:started&&!customizing&&!P.ground,headPitch:customizing?-0.04:0,act,hold:weaponsReady?{warrior:'sword'}[clsOf()]:null});
}


