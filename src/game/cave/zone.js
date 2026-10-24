//@ The Deep Cave on the client: which floor you are on (CAVE_RUN), entering and leaving it on the server's tp or by where you stand, the explored cells for the maps, and the cave's frame (view, light, lift panel)
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/cave-smoke.js, tools/client-smoke.js (the cave case).
   exports: CAVE_RUN (null on the surface; on a floor: {n, F (the floor row), B (caveBake), K (F.look), ox, oz (the floor's corner in the world), y (CAVE_FLOOR_Y), seen (Uint8Array w*h: cells you have been near), seenN, away}),
            caveIn() (any file may ask at any time: CAVE_RUN is a var), caveOnTp(msg) (net/client.js tp hook: builds or tears down before the move), caveRunEnter(n) / caveRunLeave(),
            caveFrame(dt) (main/loop.js, after dgFrame), caveSeeAround() (marks the cells in sight as explored)
   users: every hook marked "// cave:" in the client asks caveIn(); view.js, look.js, collide.js, minimap.js, lift.js read CAVE_RUN
   The floors are plain world coordinates (shared/cave-map.js caveFloorAt), so the server needs no "enter" message: the lift's tp (server/cave-zone.js) carries the new position, caveOnTp sees which floor it
   is in and builds it before the move; caveFrame is the fallback (a reconnect, a respawn) and tears the view down when you are back in the world. Never throws: a failed build must not stop a tp. */
var CAVE_RUN=null;   // (a var: hooks in files loaded earlier may ask before this line has run)
function caveIn(){ return !!CAVE_RUN; }
function caveOnTp(msg){
  try{
    const n=msg&&isFinite(msg.x)&&isFinite(msg.z)?caveFloorAt(+msg.x,+msg.z):-1;
    if(n>=0){ if(!CAVE_RUN||CAVE_RUN.n!==n){ if(CAVE_RUN) caveRunLeave(); caveRunEnter(n); } }
    else if(CAVE_RUN) caveRunLeave();
  }catch(err){ console.error('cave view:',err); }
}
function caveRunEnter(n){
  const F=caveFloorDef(n), B=F&&caveBake(n); if(!B) return;
  const o=caveFloorOrigin(n);
  CAVE_RUN={n,F,B,K:F.look,ox:o.x,oz:o.z,y:CAVE_FLOOR_Y,seen:new Uint8Array(B.w*B.h),seenN:0,away:0,seeT:0};
  CB.target=null; hideCast(); PANELS.forEach(p=>{ $('#'+p).hidden=true; });
  for(const step of [caveViewBuild,caveLookEnter,caveMiniEnter]) try{ step(CAVE_RUN); }catch(err){ console.error('cave view:',err); }
  caveSeeAround();
}
function caveRunLeave(){
  for(const step of [caveMiniLeave,caveViewClear,caveLookLeave]) try{ step(); }catch(err){ console.error('cave view:',err); }
  CAVE_RUN=null;
}
// cells within sight of you (12 m, a clear line) are explored for the maps
function caveSeeAround(){
  const R=CAVE_RUN; if(!R) return;
  const B=R.B, cx=Math.floor((P.x-R.ox)/CAVE_CELL), cz=Math.floor((P.z-R.oz)/CAVE_CELL), rc=6; let added=0;
  for(let dz=-rc;dz<=rc;dz++) for(let dx=-rc;dx<=rc;dx++){
    const gx=cx+dx, gz=cz+dz; if(gx<0||gz<0||gx>=B.w||gz>=B.h||dx*dx+dz*dz>rc*rc) continue;
    const i=gz*B.w+gx; if(R.seen[i]||!B.open[i]) continue;
    if(dx*dx+dz*dz>2&&!dgLos(B,P.x-R.ox,P.z-R.oz,(gx+0.5)*CAVE_CELL,(gz+0.5)*CAVE_CELL)) continue;
    R.seen[i]=1; R.seenN++; added++; caveMiniMark(i);
  }
  if(added) caveMiniFlush();
}
function caveFrame(dt){
  caveLiftTick(dt); caveMouthUpdate(dt);
  const n=caveFloorAt(P.x,P.z), R=CAVE_RUN;
  if(n<0){ if(R&&(R.away+=dt)>1.5) caveRunLeave(); return; }   // (a reconnect or a lost message left the view up while you are back in the world)
  if(!R||R.n!==n){ caveOnTp({x:P.x,z:P.z}); return; }
  R.away=0;
  if((R.seeT-=dt)<=0){ R.seeT=0.3; caveSeeAround(); }
  for(const step of [caveViewTick,caveLookTick,caveLifeTick]) try{ step(dt); }catch(err){ console.error('cave frame:',err); }
}
