//@ clSway: skirts, tunic flares and hems in the hips' frame follow the legs, trail behind a walking hiker and ripple (one deformer per mesh, run through rig.anims)
/* Agent map. clSway(rig,mesh) is called by buildCharacter (model.js) for the base skirt, the base tunic flare / belt mesh and a signature outfit's hips mesh, after rig.anims exists.
   It copies the mesh's vertices once and, each frame the hiker moves (and once more to settle), moves them from those copies: the further a vertex is below the waist the more it
   follows (depth 0 at the waist, 1 at the hem), the front is pushed forward by a forward leg and the back backward by a back leg, the hem trails behind with speed and ripples.
   Tested by tools/character-smoke.js (the sway moves a skirt and leaves the waist alone). Garments in other frames (the torso's coat tails, capes) do not use this. */
function clSway(rig,mesh,loose){
  const pos=mesh&&mesh.geometry&&mesh.geometry.attributes.position; if(!pos) return;
  rig.anims=rig.anims||[];
  const n=pos.count, base=Float32Array.from(pos.array), dep=new Float32Array(n), hw=Math.max(0.05,(rig.dims&&rig.dims.hx)||0.1);   // the hip joints' distance from the middle
  let minY=0; for(let i=0;i<n;i++) minY=Math.min(minY,base[i*3+1]);
  const H=-minY; if(H<0.08) return;   // nothing hangs below the waist: a belt
  for(let i=0;i<n;i++){ const y=base[i*3+1]; dep[i]=y>=0?0:Math.pow(Math.min(1,-y/H),1.35); }
  mesh.frustumCulled=false;   // the vertices move away from the bounds computed at the start
  let rest=false;
  rig.anims.push((t,dt,mv)=>{
    const l=rig.hipL.rotation.x, r=rig.hipR.rotation.x, w=Math.min(1,(Math.abs(l)+Math.abs(r))*3+mv), still=w<0.002;   // w: how much of the motion shows (none at rest, so nothing pops when a walk starts or ends)
    if(still&&rest) return; rest=still;
    if(still){ pos.array.set(base); pos.needsUpdate=true; return; }   // standing: back to the cut of the garment
    const a=pos.array, trail=mv*H*0.14, rip=mv*0.012+0.002, sl=Math.sin(l), sr=Math.sin(r);
    for(let i=0;i<n;i++){
      const o=i*3, x=base[o], y=base[o+1], z=base[o+2], d=dep[i];
      if(d===0){ a[o]=x; a[o+1]=y; a[o+2]=z; continue; }
      let px=x+Math.sin(t*4.1+z*15)*d*d*rip*0.6, pz=z+trail*d+Math.sin(t*5.5+x*18+y*7)*d*d*rip, lift=0;   // the hem trails behind with speed and ripples ...
      const rad=0.098-0.026*d, rad2=rad*1.5;
      if(loose){ for(let k=0;k<2;k++){   // a dress: a wide skirt does not squeeze round a leg, it is pushed ahead of a forward leg and behind a back one, a smooth bump (no slit for the leg to poke through)
        const cx=k?hw:-hw, zc=-(k?sr:sl)*-y*1.04, wx=Math.max(0,1-Math.pow((px-cx)/(rad*2.4),2)), wx2=wx*wx;
        if(z<0){ const tz=zc-rad*1.3-0.07*d, wz=Math.min(1,-z/0.05); if(pz>tz) pz+=(tz-pz)*wx2*wz; }
        else { const tz=zc+rad*1.3+0.05*d, wz=Math.min(1,z/0.05); if(pz<tz) pz+=(tz-pz)*wx2*wz; } }
        a[o]=x+(px-x)*w; a[o+1]=y; a[o+2]=z+(pz-z)*w; continue; }   // ... then each leg, a circle on the ground plane that swings forward and back with its angle, pushes the cloth out of its way: the cloth inside the wider circle is squeezed into the ring outside the leg (smooth: no tears)
      for(let k=0;k<2;k++){
        const cx=k?hw:-hw, zc=-(k?sr:sl)*-y*1.04, dx=px-cx, dz=pz-zc, dd=dx*dx+dz*dz;
        if(dd<rad2*rad2){ const q=Math.sqrt(dd)||1e-6, nq=rad+(q/rad2)*(rad2-rad); px=cx+dx*nq/q; pz=zc+dz*nq/q; lift+=(1-q/rad2)*0.05*d; }
      }
      a[o]=x+(px-x)*w; a[o+1]=y+Math.min(0.04,lift)*w; a[o+2]=z+(pz-z)*w;
    }
    pos.needsUpdate=true;
  });
}
