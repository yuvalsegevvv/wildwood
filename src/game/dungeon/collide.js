//@ Walking and the camera in a run: the run's walls stop you (dgSlide on the bake, like the server's setPos) and the third-person camera's arm shortens in front of a wall (first person is not touched)
/* agent map
   exports: dgBounds(o, ox, rad, oz) (player/movement.js worldBounds, in a run instead of the world's edges), dgCamBoom(hx, hy, hz, cx, cy, cz) -> [x, y, z] (movement.js updateCamera), DG_CAM
   users: the two hooks above; reads DG_RUN (run.js)
   test: tools/client-smoke.js (a wall stops you, the arm shortens), tools/dungeon-client-smoke.js
   The floor is getH's (world/heightmap.js: DG_FLOOR_Y anywhere in the slots, the server's getH does the same), so jumping and falling need nothing here.
   The server clamps too (dgSetPosS: from where it has you, never into a wall, no jump over 12 m): this only has to feel right. The arm: tested in 0.2 m steps from the head toward the
   camera against dgFree with DG_CAM.pad (0.3 m) of room; it snaps in at once and eases back out (DG_CAM.out: in about a third of a second), so a pillar passing behind you does not make it flicker. */
const DG_CAM={k:1,out:3,pad:0.3,t:0};
function dgBounds(o,ox,rad,oz){
  const R=DG_RUN, B=R&&R.B; if(!B) return;
  if(oz===undefined) oz=o.z;
  const lx=ox-R.ox, lz=oz-R.oz;
  if(!dgFree(B,lx,lz,rad)) return;   // already in a wall (a tp, a shove): let him walk out
  const s=dgSlide(B,lx,lz,o.x-R.ox,o.z-R.oz,rad); o.x=s[0]+R.ox; o.z=s[1]+R.oz;
}
function dgCamBoom(hx,hy,hz,cx,cy,cz){
  const R=DG_RUN, B=R&&R.B; if(!B) return [cx,cy,cz];
  const dx=cx-hx, dz=cz-hz, len=Math.hypot(dx,dz), now=performance.now()/1000, dt=Math.min(0.1,Math.max(0,now-DG_CAM.t)); DG_CAM.t=now;
  let k=1;
  if(len>1e-3){ const n=Math.ceil(len/0.2);
    for(let i=1;i<=n;i++){ const f=i/n; if(!dgFree(B,hx-R.ox+dx*f,hz-R.oz+dz*f,DG_CAM.pad)){ k=Math.max(0.06,(i-1)/n); break; } } }
  DG_CAM.k=k<DG_CAM.k?k:Math.min(k,DG_CAM.k+dt*DG_CAM.out);
  return [hx+dx*DG_CAM.k,hy+(cy-hy)*DG_CAM.k,hz+dz*DG_CAM.k];
}
