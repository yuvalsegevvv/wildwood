//@ Shoulder raise: when an arm is lifted high (a slash, a wave, a nova) the arm's ball and the torso's deltoid under it are drawn in toward the joint, so no ball stands out of the shoulder
/* Agent map. The torso (with its deltoid, model-body.js trsDelt: a filler below the joint, shaped for the arm hanging at armLean(D)) and the upper arm (its top is a ball round the joint,
   limb's cap, that makes the shoulder's round top at rest) are rigid meshes. Lifted past ~45 deg the ball turned out of the shoulder and stood out over a notch behind, and the filler
   hung on as a shelf. srBuild(rig,torso,D) runs once in buildCharacter (model.js) and sets rig.srTick (poseRig calls it each frame, after rig.anims) that, while an arm is raised (its angle from
   hanging SR_K0..SR_K1, the amount growing with the turn up to SR_TH):
   - draws the upper arm's top in toward the joint (the shoulder's frame: the joint is the origin) by up to SR_SH, fully at the ball's top, nothing from SR_C0 down the arm;
   - draws the torso's deltoid filler (beside and below the joint, within SR_D1 beyond the arm's radius) in toward the joint by up to SR_TSH.
   Moving points toward the joint (not turning them with the arm: tried, the trunk's skin folded and swirled round a 150 deg swing) keeps both surfaces smooth; normals are kept.
   (Not one of rig.anims: those are an outfit's own motion, counted per slot by outfit-smoke.) Cost: nothing while both arms are below SR_K0 (walking, holding, sitting); while raised, the few hundred vertices round each joint. The torso's array is shared with the bust's jiggle
   (chest-jiggle.js, run before this): a vertex both touch starts from the jiggle's offset (rig.cj).
   owns: sr*, SR_*, rig.srTick.   used by: model.js, pose.js.   test: tools/character-smoke.js (a raised arm moves the shoulder, no NaN, lowered it is back) */
const SR_K0=0.75, SR_K1=1.6, SR_TH=2.4, SR_SH=0.55, SR_C0=0.05, SR_C1=-0.045, SR_TSH=0.6, SR_D0=-0.01, SR_D1=0.06;
// the weights of one mesh's vertices for side sd: the arm's (the shoulder's frame, y down the arm) or the torso's (the spine's frame, the joint at J)
function srWeights(pos,sd,D,isArm){
  const p=pos.array, n=pos.count, jx=sd*D.shX, jy=D.shY, ra=0.055*D.aw, lean=armLean(D), ax=sd*Math.sin(lean), ay=-Math.cos(lean), idx=[], w=[];
  for(let i=0;i<n;i++){ const x=p[i*3], y=p[i*3+1], z=p[i*3+2]; let v;
    if(isArm){ if(-y>SR_C0) continue; v=1-faceSm(SR_C1,SR_C0,-y); }
    else { if(x*sd<D.shX*0.5) continue; const d=Math.hypot(x-jx,y-jy,z); if(d>ra+SR_D1) continue; const s=(x-jx)*ax+(y-jy)*ay;   // s: down the hanging arm's axis
      v=(1-faceSm(ra+SR_D0,ra+SR_D1,d))*faceSm(-0.01,0.03,s)*faceSm(0.5*D.shX,0.9*D.shX,x*sd); }   // the filler beside and below the joint, not the trapezius above it
    if(v>0.002){ idx.push(i); w.push(v); } }
  return {idx:Int32Array.from(idx),w:Float32Array.from(w)};
}
function srBuild(rig,torso,D){
  if(!torso||!rig.shL||!rig.shR) return;
  const tp=torso.geometry.attributes.position, sides=[];
  for(const [sd,sh] of [[-1,rig.shL],[1,rig.shR]]){
    const T=srWeights(tp,sd,D,false), arms=[];
    for(const m of sh.children) if(m.isMesh){ const pa=m.geometry.attributes.position, W=srWeights(pa,sd,D,true); if(W.idx.length) arms.push({pa,W,p0:srTake(pa.array,W.idx)}); }
    sides.push({sh,J:[sd*D.shX,D.shY,0],rest:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,sd*armLean(D))),T,p0:srTake(tp.array,T.idx),arms,on:false});
  }
  const q=new THREE.Quaternion(), qi=new THREE.Quaternion(), down=new THREE.Vector3();
  rig.srTick=()=>{
    let dirty=false;
    for(const S of sides){
      down.set(0,-1,0).applyQuaternion(S.sh.quaternion); const k=faceSm(SR_K0,SR_K1,Math.acos(clamp(-down.y,-1,1)));
      if(k<=0&&!S.on) continue;
      q.copy(S.sh.quaternion).multiply(qi.copy(S.rest).invert()); const th=2*Math.acos(clamp(Math.abs(q.w),0,1)), f=k*clamp(th/SR_TH);   // how far the arm turned from its rest
      srShrinkAt(tp,S.T.idx,S.T.w,S.p0,S.J,f*SR_TSH,rig);
      for(const A of S.arms){ srShrinkAt(A.pa,A.W.idx,A.W.w,A.p0,null,f*SR_SH,null); A.pa.needsUpdate=true; }
      S.on=k>0; dirty=true;
    }
    if(dirty) tp.needsUpdate=true;
  };
}
const srTake=(a,idx)=>{ const o=new Float32Array(idx.length*3); for(let j=0;j<idx.length;j++){ const i=idx[j]*3; o[j*3]=a[i]; o[j*3+1]=a[i+1]; o[j*3+2]=a[i+2]; } return o; };
// the jiggle's offset of torso vertex i this frame (chest-jiggle.js keeps it in rig.cj), so the two deformers add up
const _srj=[0,0,0];
function srJig(rig,i,bx,o){ const c=rig&&rig.cj; o[0]=o[1]=o[2]=0; if(!c||c.rest) return o; const q=c.w[i]*c.k; if(q<=0) return o; o[0]=Math.sign(bx)*c.ex*0.021*q; o[1]=c.ey*0.049*q; o[2]=-c.ez*0.049*q; return o; }
// each listed vertex drawn toward J (null: the origin) by f x its weight (f 0 puts it back where it was built)
function srShrinkAt(pa,idx,w,p0,J,f,rig){
  const p=pa.array, jx=J?J[0]:0, jy=J?J[1]:0, jz=J?J[2]:0;
  for(let j=0;j<idx.length;j++){ const i=idx[j]*3, m=1-f*w[j], o=srJig(rig,idx[j],p0[j*3],_srj);
    p[i]=jx+(p0[j*3]+o[0]-jx)*m; p[i+1]=jy+(p0[j*3+1]+o[1]-jy)*m; p[i+2]=jz+(p0[j*3+2]+o[2]-jz)*m; }
}
