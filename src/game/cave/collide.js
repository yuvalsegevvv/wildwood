//@ Walking and the camera on a cave floor: the walls stop you (dgSlide on the floor's bake, like the server's caveSetPosS) and the third-person camera's arm shortens in front of rock and stays under the ceiling
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (the cave case), tools/cave-smoke.js (server side clamping).
   exports: caveBounds(o, ox, rad, oz) (player/movement.js worldBounds, on a floor instead of the world's edges), caveCamBoom(hx, hy, hz, cx, cy, cz) -> [x, y, z] (movement.js updateCamera), CAVE_CAM
   users: the two hooks above; reads CAVE_RUN (zone.js), caveCeilAt (view.js)
   The floor's height is getH's (world/heightmap.js: caveGroundY on a floor, the server's getH the same), so jumping and falling need nothing here. The radius CAVE_WALK_R is the server's too (shared/cave-map.js),
   so what you see is what is held. The arm: tested in 0.2 m steps from the head toward the camera against dgFree with CAVE_CAM.pad of room, snaps in at once and eases back out (like the dungeons'); the camera's
   height is kept CAVE_CAM.under below the ceiling above it, so a low roof at a chamber's lip does not put the lens in the rock. */
const CAVE_CAM={k:1,out:3,pad:0.3,t:0,under:0.5};
function caveBounds(o,ox,rad,oz){
  const R=CAVE_RUN, B=R&&R.B; if(!B) return;
  if(oz===undefined) oz=o.z;
  const lx=ox-R.ox, lz=oz-R.oz;
  if(!dgFree(B,lx,lz,CAVE_WALK_R)) return;   // already in a wall (a tp, a shove): let him walk out
  const s=dgSlide(B,lx,lz,o.x-R.ox,o.z-R.oz,CAVE_WALK_R); o.x=s[0]+R.ox; o.z=s[1]+R.oz;
}
function caveCamBoom(hx,hy,hz,cx,cy,cz){
  const R=CAVE_RUN, B=R&&R.B; if(!B) return [cx,cy,cz];
  const dx=cx-hx, dz=cz-hz, len=Math.hypot(dx,dz), now=performance.now()/1000, dt=Math.min(0.1,Math.max(0,now-CAVE_CAM.t)); CAVE_CAM.t=now;
  let k=1;
  if(len>1e-3){ const n=Math.ceil(len/0.2);
    for(let i=1;i<=n;i++){ const f=i/n; if(!dgFree(B,hx-R.ox+dx*f,hz-R.oz+dz*f,CAVE_CAM.pad)){ k=Math.max(0.06,(i-1)/n); break; } } }
  CAVE_CAM.k=k<CAVE_CAM.k?k:Math.min(k,CAVE_CAM.k+dt*CAVE_CAM.out);
  const x=hx+dx*CAVE_CAM.k, z=hz+dz*CAVE_CAM.k;
  let y=hy+(cy-hy)*CAVE_CAM.k; const top=R.y+caveCeilAt(x-R.ox,z-R.oz)-CAVE_CAM.under; if(y>top) y=top; y=Math.max(y,getH(x,z)+0.5);
  return [x,y,z];
}
