//@ poseRig (walk, run, sit, talk, attacks) and animateHiker
function poseRig(r,dt,o){
  const sp=o.sp||0, mv=Math.min(sp/4.2,1), run=clamp((sp-5)/4.5), air=!!o.air;
  const ph=o.ph||0, sw=Math.sin(ph), cw=Math.cos(ph), amp=0.55*mv+0.32*run, seed=o.seed||0;
  /* The gait (a walk is a cycle of two legs half a turn apart, ph is the left leg's phase; sw > 0 = the left leg is forward):
     the thigh swings, the knee bends twice (a small give when the heel lands, a big fold when the leg swings through: gaitKnee), the pelvis turns, rolls and
     slides over the standing leg, the shoulders turn against it, the elbows fold as the arm comes forward, the head stays level, and a standing hiker shifts weight and breathes. */
  const gaitKnee=p=>Math.pow(Math.max(0,Math.cos(p+0.45)),1.7)*1.25+Math.pow(Math.max(0,Math.cos(p-Math.PI/2-0.5)),3)*0.2;
  let tL=sw*amp*1.02, tR=-sw*amp*1.02, kL=-gaitKnee(ph)*amp*1.2-0.05*mv, kR=-gaitKnee(ph+Math.PI)*amp*1.2-0.05*mv;
  let hipsY=r.hipY+(Math.abs(cw)*0.04-0.034)*mv;
  const breathe=Math.sin(t*1.7+seed)*0.025*(1-mv), idle=Math.sin(t*0.45+seed*1.7)*(1-mv);
  let aL=-sw*amp*0.9+breathe, aR=sw*amp*0.9+breathe, e0=r.acl?ACL_REST_E:0.12, eL=e0+mv*(0.08+0.3*Math.max(0,-sw))+run*0.85, eR=e0+mv*(0.08+0.3*Math.max(0,sw))+run*0.85, wL=0, wR=0, lean=-(0.04*mv+0.17*run)+breathe*0.3;
  if(air){ tL=0.75; tR=-0.1; kL=-1.2; kR=-0.5; aL-=0.7; aR-=0.7; }
  if(o.sit){ tL=tR=1.5; kL=kR=-1.45; hipsY=o.sitH||0.5; aL=aR=-0.45; eL=eR=0.8; lean=0.12; }
  if(o.sit===1){ tL=tR=1.4; kL=kR=-0.22; aL=aR=-0.25; eL=eR=0.35; hipsY=o.sitH||0.14; }   // sitting on the ground (sit 1), legs out in front; 2 / true = on a seat
  if(o.talk){ aR=-0.5+Math.sin(t*2.6+seed)*0.28; eR=1.15+Math.sin(t*3.3)*0.25; if(!o.sit) aL=-0.15+Math.sin(t*2.1)*0.1; }
  const lf=!!(o.left||r.left);   // a left-handed hiker: the whole upper body acts mirrored (the arms, the twist, the hold), so the strong arm below is always "R" and the two swap back at the end
  if(lf){ let x=aL; aL=aR; aR=x; x=eL; eL=eR; eR=x; }
  let twist=null;   // (twist: the shoulders' turn; wL / wR: each forearm's own twist, the pronation: + turns the palm from the thigh toward the back, so a raised hand shows its palm forward)
  if(o.hold==='staff' && !o.act){ eR=Math.max(eR,1.25); aR+=0.12; }
  if(o.hold==='sword' && !o.act){ eR=Math.max(eR,0.35); }
  if(o.act){
    const a=o.act, p=clamp(a.t/a.dur);
    switch(a.kind){
      case 'slash': if(a.sw){ const q=(a.t-a.sw.start)/a.sw.gap+0.35, i=Math.floor(q), fl=(i%2)?-1:1;   // skillvis: a multi-hit skill swings again and again, each blow from the other side
          if(q<0||(q<a.sw.n&&q-i<0.35)){ aR=2.7; eR=0.45; twist=-0.35*fl; } else if(q<a.sw.n){ aR=0.15; eR=0.15; twist=0.45*fl; lean=-0.18; } else { aR=0.15; eR=0.15; twist=0.2; lean=-0.12; } break; }
        if(p<0.4){ aR=2.7; eR=0.45; twist=-0.35; } else { aR=0.15; eR=0.15; twist=0.45; lean=-0.18; } break;
      case 'spin': aR=1.5; eR=0.1; aL=1.2; eL=0.2; break;
      case 'shoot': case 'volley': aL=1.5; eL=0.05; aR=1.45; eR=p<(a.hitAt||0.6)?2.1:0.7; twist=-0.3; break;
      case 'cast': aR=p<0.45?0.9:1.7; eR=p<0.45?1.4:0.3; aL=0.5; break;
      case 'hammer': if(p<0.5){ aR=1.35; eR=1.7; lean=0.05; } else { aR=0.6; eR=0.55; lean=-0.12; } break;   // a smith's blow: hammer up, then down on the anvil (village/smith.js)
      case 'wave': aR=2.45; eR=0.85+Math.sin(t*10)*0.3; wR=1.3; break;   // the palm turned to the one waved at   // a villager waving as you come near (village/smith.js: villagerWave)
      case 'nova': if(p<0.45){ aL=aR=2.9; eL=eR=0.2; } else { aL=aR=0.5; eL=eR=0.2; tL=tR=0.45; kL=kR=-0.9; hipsY-=0.12; } break;
    }
  }
  if(lf){ let x=aL; aL=aR; aR=x; x=eL; eL=eR; eR=x; x=wL; wL=wR; wR=x; if(twist!==null) twist=-twist; }
  const k=Math.min(1,dt*(o.act?26:14)), L=(ob,v)=>{ ob.rotation.x+=(v-ob.rotation.x)*k; };
  if(r.acl){   // arm clearance (arm-clear.js): the hands pass beside the hips, the thighs, a belly, a bust, a skirt instead of through them (it only ever moves an arm out, so a slash or a cast keeps its shape)
    const A=r.acl, sit=o.sit&&!o.act&&!air, st=(o.act||air||o.sit)?0:1-mv; let yL=0, yR=0;
    if(sit){ const md=o.sit===1?1:2, pl=aclSit(A,md,-1), pr=aclSit(A,md,1), talkArm=o.talk?(lf?'L':'R'):'';   // seated: the hands rest on top of the thighs (a talking sitter still gestures with the strong hand)
      if(talkArm!=='L'){ aL=pl.a; eL=pl.e; yL=-pl.b; wL=pl.w||0; } if(talkArm!=='R'){ aR=pr.a; eR=pr.e; yR=pr.b; wR=pr.w||0; } }   // (palm down on the thigh: pl.w)
    else if(st>0){ const q0=A.rest[0], q1=A.rest[1]; aL+=q0.a*st; aR+=q1.a*st; eL+=Math.max(0,q0.e-eL)*st; eR+=Math.max(0,q1.e-eR)*st; }   // standing: the arm a very wide body (or a gown) asks to carry a little forward and bent
    let zL=-A.lean, zR=A.lean; const m=sit?0:mv+run, q=r.aclQ||(r.aclQ=[0,0]);
    if(!sit||(o.talk&&lf)){ aclLook(A,-1,aL,eL,m,q); zL-=q[0]; eL+=q[1]; }
    if(!sit||(o.talk&&!lf)){ aclLook(A,1,aR,eR,m,q); zR+=q[0]; eR+=q[1]; }
    r.shL.rotation.z+=(zL-r.shL.rotation.z)*k; r.shR.rotation.z+=(zR-r.shR.rotation.z)*k; r.shL.rotation.y+=(yL-r.shL.rotation.y)*k; r.shR.rotation.y+=(yR-r.shR.rotation.y)*k; }
  L(r.hipL,tL); L(r.hipR,tR); L(r.kneeL,kL); L(r.kneeR,kR);
  L(r.shL,aL); L(r.shR,aR); L(r.elL,eL); L(r.elR,eR); L(r.spine,lean);
  if(r.twL){ r.twL.rotation.y+=(-wL-r.twL.rotation.y)*k; r.twR.rotation.y+=(wR-r.twR.rotation.y)*k; }   // the forearms' twist (model-body.js buildArm: the hand and what it holds)
  if(r.acl){ r.elL.rotation.z=-aclCarry(r.acl,r.elL.rotation.x); r.elR.rotation.z=aclCarry(r.acl,r.elR.rotation.x); }   // the carrying angle, fading as the elbow bends (arm-clear.js)
  const walkTurn=(1-0.6*run)*mv;   // pelvis and shoulders turn against each other (the shoulders with the arm that is back)
  r.spine.rotation.y+=((twist!==null?twist:sw*0.17*walkTurn)-r.spine.rotation.y)*k; r.hips.rotation.y=-sw*0.08*walkTurn;
  r.hips.rotation.z=cw*0.045*mv+idle*0.02; r.spine.rotation.z=-cw*0.03*mv-idle*0.012; r.hips.position.x=cw*0.014*mv+idle*0.006;   // the hip drops on the swinging side, the trunk leans back over it, the weight slides over the standing leg
  r.hips.position.y+=(hipsY-r.hips.position.y)*(o.sit?k*0.5:1);
  r.head.rotation.y+=(((o.headYaw||0)-(o.act||o.sit?0:(r.spine.rotation.y+r.hips.rotation.y)*0.7))-r.head.rotation.y)*k;   // the head keeps looking ahead while the shoulders turn
  r.head.rotation.z=-(r.hips.rotation.z+r.spine.rotation.z)*0.9;
  r.head.rotation.x=0.05*mv+(o.talk?Math.sin(t*4.2)*0.05:0)+(o.headPitch||0);
  if(r.anims) for(const f of r.anims) f(t,dt,mv);
  if(r.srTick) r.srTick();   // a raised arm draws the shoulder's ball in (character/shoulder-raise.js; after the bust's jiggle, which moves the same torso)   // an outfit's own motion (a swinging charm, a turning ring of lanterns)
}
function animateHiker(dt){
  if(!hiker.rig) return;
  const act=weaponsReady&&!customizing?CB.act:null;
  hiker.g.position.set(P.x,P.y+cvbLift(NET.pid),P.z); hiker.g.rotation.y=P.face+(act&&act.kind==='spin'?clamp(act.t/act.dur)*TAU*2:0);   // cave: cvbLift(pid) is Eagle's Perch carrying the model up
  const sp=customizing?0:Math.hypot(P.vx,P.vz);
  poseRig(hiker.rig,dt,{sp,ph:P.walk,air:started&&!customizing&&!P.ground,headPitch:customizing?-0.04:0,act,hold:weaponsReady?{warrior:'sword'}[clsOf()]:null,sit:SIT.on,sitH:(SIT.on===2?0.58:0.14)/(hiker.rig.root.scale.y||1)});
}


