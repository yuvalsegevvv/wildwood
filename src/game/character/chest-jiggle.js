//@ Chest jiggle: the bust (part of the torso mesh, so a worn top follows it) lags the body's bounce, trails a start and stop and sways with a turn; one spring set per character, a deformer on the torso mesh
/* Agent map. buildCharacter (model.js) calls cjSway(rig,torso,cjWeights(geo,X,D),amt) after the torso mesh exists. cjWeights gives each torso vertex a 0..1 weight: the two lobes of the bust
   (the same centre as the bust in model-body.js buildTorso: cy, chestGap and chestShape move it), front only. The springs are RELATIVE: they chase what the body does (the stride's up-down, speed, a turn)
   and what you see is the lag, so a steady walk settles and a start, a stop, a step or a turn makes the bust move. Semi-implicit Euler with a clamped step, finite at any frame time; at rest the vertices go
   back exactly to the cut. Size: more chest moves more (chestEff), the Chest jiggle slider scales it (0 = still); a man's chest moves a third as much.
   owns: cjWeights, cjSway, rig.cj (the offsets of this frame).   used by: model.js, shoulder-raise.js.   test: tools/chest-jiggle-smoke.js */
function cjWeights(geo,X,D){
  const p=geo.attributes.position, S=X.S, B=D.B, TK=D.TK, ch=S.chest, ce=chestEff(ch), cs=S.chestShape, w=new Float32Array(p.count);
  const cy=chestBand(S).cy*TK, wx=0.06*(0.8+0.22*ce), wy=0.085*TK*(0.8+0.3*ce), mid=0.056*B*(1-0.3*cs)*(1+0.5*S.chestGap);
  for(let i=0;i<p.count;i++){ const z=p.getZ(i); if(z>-0.02) continue;
    const dx=(Math.abs(p.getX(i))-mid)/wx, dy=(p.getY(i)-cy)/wy, f=Math.min(1,(-z-0.02)/0.04);
    w[i]=Math.exp(-dx*dx-dy*dy)*f*f*(3-2*f); }
  return w;
}
function cjSway(rig,mesh,w,amt,size){
  const pos=mesh&&mesh.geometry&&mesh.geometry.attributes.position; if(!pos||w.length!==pos.count||!rig.hipL||!rig.hipR||!rig.root) return;
  amt=typeof amt==='number'&&isFinite(amt)?Math.max(0,Math.min(2,amt)):1; if(amt<=0||!size) return;
  rig.anims=rig.anims||[];
  const idx=[]; for(let i=0;i<w.length;i++) if(w[i]>0.01) idx.push(i); if(!idx.length) return;
  const base=Float32Array.from(pos.array), k=amt*size;
  let sy=0,vy=0, sz=0,vz=0, sx=0,vx=0, yaw0=null, rest=true;
  const cj=rig.cj={w,k,ex:0,ey:0,ez:0,rest:true};   // this frame's offsets, for the shoulder's deformer that runs after this one (shoulder-raise.js)
  rig.anims.push((t,dt,mv)=>{
    dt=Math.min(0.05,Math.max(0.001,dt||0.016)); mv=mv||0;
    const yaw=rig.root.rotation.y; let dy=0; if(yaw0!==null){ dy=yaw-yaw0; dy-=Math.round(dy/6.283185307)*6.283185307; } yaw0=yaw;
    const turn=Math.max(-6,Math.min(6,dy/dt)), gait=Math.abs(rig.hipL.rotation.x-rig.hipR.rotation.x);
    const ty=0.5*gait*mv, tz=0.12*mv, tx=0.025*turn;   // what the body does: bounce with the stride, speed, a turn
    for(let s=0;s<2;s++){ const h=dt/2;   // underdamped springs: the bust overshoots and settles
      vy+=(-120*(sy-ty)-5*vy)*h; vz+=(-100*(sz-tz)-4.5*vz)*h; vx+=(-90*(sx-tx)-4.5*vx)*h; sy+=vy*h; sz+=vz*h; sx+=vx*h; }
    sy=Math.max(-1,Math.min(1,sy)); sz=Math.max(-1,Math.min(1,sz)); sx=Math.max(-1,Math.min(1,sx));
    const ey=sy-ty, ez=sz-tz, ex=sx-tx;   // the lag: how far the bust is behind the body
    const quiet=Math.abs(ey)+Math.abs(ez)+Math.abs(ex)+Math.abs(vy)+Math.abs(vz)+Math.abs(vx)<2e-4&&mv<0.01&&gait<1e-3;
    if(quiet&&rest) return;
    if(quiet){ pos.array.set(base); pos.needsUpdate=true; rest=true; cj.rest=true; sy=sz=sx=vy=vz=vx=0; return; }
    rest=false; cj.rest=false; cj.ex=ex; cj.ey=ey; cj.ez=ez; const a=pos.array;
    for(let n=0;n<idx.length;n++){ const i=idx[n], o=i*3, q=w[i]*k;
      a[o]=base[o]+Math.sign(base[o])*ex*0.021*q; a[o+1]=base[o+1]+ey*0.049*q; a[o+2]=base[o+2]-ez*0.049*q; }
    pos.needsUpdate=true;
  });
}
