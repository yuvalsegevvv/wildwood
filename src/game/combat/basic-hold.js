//@ Skill 1 on the client: hold the attack button to charge (press = tap), the charge shown on the button, the attack speed / charge gain mirrors, the slower walk while charging
/* Agent map (rules and numbers: shared/basic-hold.js; server: server/basic-hold.js; docs/BASIC-HOLD.md; test: tools/basic-hold-smoke.js)
   owns:    BHC (the hold in progress {t0, cls} or null), bhDown / bhUp / bhCancel (the button, key and mouse call them), bhHudTick (the button's fill, called by combat-hud.js),
            bhSpeedUi / bhChargeUi (the multipliers of this loadout, mirrors of the server's), bhMoveK (walking speed while charging).
   used by: attacks.js (doAttack reads the speed and takes the strength), combat-hud.js (the inputs), movement.js (bhMoveK).
   The server times the hold itself: bhDown sends {t:'hold',on:1}, the release is the ordinary atk message (so a tap costs no extra delay: it is sent when the button comes up). */
let BHC=null;
const bhSpeedUi=()=>PVC.on?1:bhSpeedK(passiveSum(pvSkills(),pvLevel(),'aspd',clsOf()),rlUiSum('aspd'));
const bhChargeUi=()=>PVC.on?1:bhChargeK(passiveSum(pvSkills(),pvLevel(),'chg',clsOf()),rlUiSum('chg'));
const bhHeld=()=>BHC?Math.max(0,(performance.now()-BHC.t0)/1000):0;
function bhClearHud(){ abBasic.classList.remove('charging','charged'); abKey=''; }
function bhDown(){
  if(BHC||!started||!NET.ready||uiOpen()||PL.dead||customizing) return;
  BHC={t0:performance.now()+Math.max(0,CB.cd.basic)*1000,cls:clsOf()};   // (the charge starts when skill 1 is ready again) netSend({t:'hold',on:1});
}
function bhUp(){
  if(!BHC) return; const f=bhFrac(bhHeld(),BHC.cls,bhChargeUi()), same=BHC.cls===clsOf(); BHC=null; bhClearHud();
  if(!doAttack('basic',same?f:0)) netSend({t:'hold',on:0});
}
function bhCancel(){ if(!BHC) return; BHC=null; bhClearHud(); netSend({t:'hold',on:0}); }
// the button fills while charging; a different class (a weapon swap) or an open panel cancels it
function bhHudTick(){
  if(!BHC) return;
  if(uiOpen()||PL.dead||BHC.cls!==clsOf()){ bhCancel(); return; }
  const h=bhHeld(), f=Math.min(1,h*bhChargeUi()/(BH_FULL[BHC.cls]||1));
  abBasic.classList.toggle('charging',h>=BH_TAP); abBasic.classList.toggle('charged',f>=1&&h>=BH_TAP);
  if(h>=BH_TAP) abBasic.style.setProperty('--p',1-f);
}
const bhMoveK=()=>BHC&&bhHeld()>=BH_TAP?0.6:1;
addEventListener('blur',bhCancel);
// the swing of a charged release (the shapes are the server's: bhHoldAb is shared); a mage's blast is drawn where it lands
function bhVisuals(ab,x,y,z,face,sc){
  const f=ab.holdF, full=f>=1, col=elCol(elOf(ab));
  if(ab.holdAt){
    const T=CB.target, onT=T&&!T.dead&&Math.hypot(T.x-x,T.z-z)<=ab.range+2, cx=onT?T.x:x-Math.sin(face)*6, cz=onT?T.z:z-Math.cos(face)*6, R=ab.fx.ring.r, g=getH(cx,cz);
    for(let i=0;i<3;i++) spawnRingAt(cx,g,cz,R*(0.5+i*0.25),i?col:0xffffff);
    spawnBurst(new THREE.Vector3(cx,g+0.6,cz),col,0.8+R*0.18); if(full){ fxxDome(cx,g,cz,R,col); fxxScorch(cx,cz,R*0.7,col); }
    cSfx.boom({x:cx,z:cz}); camShake=Math.max(camShake,0.15+0.2*f);
  } else {
    fxVisuals(ab,x,y,z,face,sc,true);
    if(clsOf()==='warrior'){ fxxDust(x-Math.sin(face)*2,getH(x,z),z-Math.cos(face)*2,6+Math.round(8*f),2+2*f,0x9a8a70); camShake=Math.max(camShake,0.1+0.3*f); cSfx.boom({x,z}); }
    else if(full) fxpFlare(x-Math.sin(face)*0.8,y+1.2*sc,z-Math.cos(face)*0.8,col,3.5,0.35);
  }
}
