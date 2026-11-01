//@ Hair sway: the hanging locks (tails, braids, long hair, side locks, strands) lag behind a turn, trail back and bounce with the stride, as one spring per head and one deformer per hair mesh
/* Agent map. buildHair (model-hair.js) marks every geometry made through `swing` with hairHang; buildCharacter (model.js) merges those into a second mesh on the head and calls
   hwSway(rig,mesh,hwReach(parts)) after rig.anims exists. A vertex's reach is how far below its lock's root it hangs (metres, times 0..1 of how long the lock is: short locks hardly move), and it is what the
   swing is multiplied by: the root stays on the scalp, the tip moves most. One spring per axis (fore-aft: trailing back with speed and bouncing with the stride; sideways: lagging a turn of the body or
   the head), semi-implicit Euler with a clamped step so a hitch cannot blow it up; at rest the vertices go back to the cut of the hair and nothing is recomputed. Runs for the hiker, remote players and villagers
   (all through poseRig's rig.anims). Signature outfits' own hair can opt in with T.swing (the kit's hair tools). Not for spikes, buns or the cap (they use hang / fit and stay stiff).
   owns: hwReach, hwSway.   used by: model.js, model-hair.js (the mark).   test: tools/hair-smoke.js */
function hwReach(parts){
  const out=[];
  for(const g of parts){ const p=g.attributes.position; let top=-1e9, bot=1e9; for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y>top) top=y; if(y<bot) bot=y; }
    const E=Math.max(0.01,top-bot), sc=Math.min(1,E/0.12);
    for(let i=0;i<p.count;i++) out.push(Math.pow(Math.min(1,Math.max(0,(top-p.getY(i))/E)),1.25)*E*sc); }
  return Float32Array.from(out);
}
function hwSway(rig,mesh,reach){
  const pos=mesh&&mesh.geometry&&mesh.geometry.attributes.position; if(!pos||reach.length!==pos.count||!rig.head||!rig.root) return;
  rig.anims=rig.anims||[];
  const n=pos.count, base=Float32Array.from(pos.array); mesh.frustumCulled=false;
  let ax=0, az=0, vx=0, vz=0, yaw0=null, rest=true;
  rig.anims.push((t,dt,mv)=>{
    dt=Math.min(0.05,Math.max(0.001,dt||0.016));
    const yaw=rig.root.rotation.y+rig.head.rotation.y; let dy=0; if(yaw0!==null){ dy=yaw-yaw0; dy-=Math.round(dy/6.283185307)*6.283185307; } yaw0=yaw;
    const turn=Math.max(-6,Math.min(6,dy/dt)), gait=Math.abs(rig.hipL.rotation.x-rig.hipR.rotation.x);
    const tx=0.16*mv+0.1*gait, tz=-0.03*turn;   // trail back with speed and bounce with the stride; lag a turn
    for(let s=0;s<2;s++){ const h=dt/2;   // two substeps: stiff enough to be crisp, stable at 20 fps
      vx+=(-55*(ax-tx)-5.5*vx)*h; vz+=(-55*(az-tz)-5.5*vz)*h; ax+=vx*h; az+=vz*h; }
    ax=Math.max(-0.7,Math.min(0.7,ax)); az=Math.max(-0.7,Math.min(0.7,az));
    const quiet=Math.abs(ax)+Math.abs(az)+Math.abs(vx)+Math.abs(vz)<2e-4&&mv<0.01&&Math.abs(tx)+Math.abs(tz)<1e-3;
    if(quiet&&rest) return;
    if(quiet){ pos.array.set(base); pos.needsUpdate=true; rest=true; ax=az=vx=vz=0; return; }
    rest=false;
    const a=pos.array, lift=-0.5*(ax*ax+az*az), fl=0.004*mv;
    for(let i=0;i<n;i++){ const r=reach[i], o=i*3; if(r<1e-5) continue;
      const f=Math.sin(t*6.5+base[o+1]*40+base[o]*25)*fl*Math.min(1,r*8);   // a small flutter along the strands
      a[o]=base[o]+az*r+f; a[o+1]=base[o+1]+lift*r; a[o+2]=base[o+2]+ax*r; }
    pos.needsUpdate=true;
  });
}
