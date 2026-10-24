//@ The Deep Cave's floors on the server: the camps and their monsters, walls for hikers and monsters (setPos, dashes, steering round corners, line of sight), the lift between the surface and the floors, waking on a floor after a knock-out
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/cave-smoke.js. Rules and maps: shared/cave-map.js, cave-gen.js; the charge and the slot: server/cave.js.
   exports: caveInitS() (api.js init: a pack at every camp of every floor that has monsters), caveSetPosS(p, v, from, to) (api.js setPos), caveDashS(p, L) (combat.js charge / dash), caveWallAtS(x, z) (a wall stops a projectile),
            caveHitOkS(m, p, fx, fz) (a hit needs a line of sight), caveMonStepS(m, ox, oz) (monsters slide along walls), caveSteerS(m, tx, tz) -> [x, z] (the next waypoint round a corner), caveFixS(m) (a respawn lands on floor),
            caveLiftP(p, to), caveReviveP(p), caveDevTp(p, v) (testing), MSG.lift {to: 0 surface | floor number}
   The floors are plain world coordinates (shared/cave-map.js): monsters are ordinary MONS with m.cave = the floor number, so snapshots (by distance), combat, drops and the boss rules need nothing else. What differs
   is only walking: getH is the baked floor (world.js), a hiker is held inside the walk grid like in a dungeon run (dgSlide), a monster slides along walls and, with no line of sight to where it wants to go,
   follows a breadth-first path from the goal (limited to CAVE_PATH_MAX cells, refreshed every CAVE_PATH_T s per monster, a few microseconds each). Camps are the floor's data: a pack of its level's kind (floor.mobs[lv - floor.lv[0]]). */
const CAVE_POS_JUMP=14, CAVE_LIFT_CD=2, CAVE_LIFT_REACH=1.5, CAVE_PATH_MAX=40, CAVE_PATH_T=0.35;
// ---- the camps ----
function caveInitS(){
  for(const n of CAVE_FLOOR_N){
    const F=caveFloorDef(n), B=caveBake(n); if(!F||!B||!F.mobs||!F.mobs.length) continue;
    const o=caveFloorOrigin(n), rng=mulberry32((F.seed|0)^0x51ed27), rr=(a,b)=>a+(b-a)*rng();
    for(const c of B.camps){
      const d=DEF_BY_ID[F.mobs[Math.max(0,Math.min(F.mobs.length-1,c.lv-F.lv[0]))]]; if(!d) continue;
      const camp={x:o.x+c.x,z:o.z+c.z,def:d,zone:null,cave:n}, pack=Math.max(2,Math.min(4,d.per||2));
      for(let k=0;k<pack;k++){
        let x=camp.x, z=camp.z; for(let t=0;t<12;t++){ const a=rr(0,TAU), r=rr(0.5,Math.max(1.5,Math.min(c.r,1.2+pack*0.9))), px=camp.x+Math.sin(a)*r, pz=camp.z+Math.cos(a)*r; if(caveFree(px,pz,d.rad)){ x=px; z=pz; break; } }
        const m=makeMon(d,x,z,camp,rr(0.92,1.08),false); m.cave=n;
      }
    }
  }
}
// ---- walls ----
function caveSetPosS(p,v,from,to){
  if(from<0||to!==from) return;   // a late message from the world (or another floor) after a lift: not a move
  const o=caveFloorOrigin(from), B=caveBake(from); if(!B) return;
  const ox=p.x-o.x, oz=p.z-o.z, lx=v[0]-o.x, lz=v[2]-o.z;
  if(Math.hypot(lx-ox,lz-oz)>CAVE_POS_JUMP) return;
  const s=dgSlide(B,ox,oz,lx,lz,CAVE_WALK_R); p.x=o.x+s[0]; p.z=o.z+s[1];
  const gy=caveGroundY(p.x,p.z); p.y=clamp(v[1],gy-1,gy+10); p.face=isFinite(v[3])?v[3]%(2*Math.PI):p.face; p.vx=clamp(v[4]||0,-POS_V,POS_V); p.vz=clamp(v[5]||0,-POS_V,POS_V);
}
// a charge or dash on a floor: from where the server has you toward the target, stopping short of the first wall
function caveDashS(p,L){
  const x0=p.x, z0=p.z, d=Math.hypot(L.x-x0,L.z-z0), n=Math.ceil(d/0.5); let x=x0, z=z0;
  for(let i=1;i<=n;i++){ const k=i/n, nx=x0+(L.x-x0)*k, nz=z0+(L.z-z0)*k; if(!caveFree(nx,nz,CAVE_WALK_R)) break; x=nx; z=nz; }
  p.x=x; p.z=z; p.y=caveGroundY(x,z);
}
const caveWallAtS=(x,z)=>caveWallAt(x,z);
function caveHitOkS(m,p,fx,fz){ return caveLos(fx,fz,m.x,m.z); }
function caveMonStepS(m,ox,oz){ const s=caveSlide(ox,oz,m.x,m.z,Math.min(m.T.rad,0.9)); m.x=s[0]; m.z=s[1]; }
function caveFixS(m){   // a respawn lands near its camp; make it a spot a monster can stand on
  if(caveFree(m.x,m.z,m.T.rad)) return;
  const c=m.camp; for(let t=0;t<12;t++){ const a=AR(0,TAU), r=AR(0.5,3), x=c.x+Math.sin(a)*r, z=c.z+Math.cos(a)*r; if(caveFree(x,z,m.T.rad)){ m.x=x; m.z=z; return; } }
  m.x=c.x; m.z=c.z;
}
// ---- steering round corners ----
const CAVE_SCR={n:0,stamp:null,dist:null,q:null,cur:0};
const CAVE_NB8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function caveNextCell(B,gx,gz,mx,mz){   // BFS from the goal cell to the monster's cell; returns the neighbour of the monster's cell nearest the goal, or null
  const W=B.w, N=W*B.h, S=CAVE_SCR; if(S.n!==N){ S.n=N; S.stamp=new Int32Array(N); S.dist=new Uint16Array(N); S.q=new Int32Array(N); S.cur=0; }
  const cur=++S.cur, st=S.stamp, di=S.dist, q=S.q, g=gz*W+gx, me=mz*W+mx; if(!B.cells[g]) return null;
  let qh=0, qt=0; q[qt++]=g; st[g]=cur; di[g]=0;
  while(qh<qt){ const c=q[qh++]; if(c===me) break; const cx=c%W, cz=(c-cx)/W, dc=di[c]; if(dc>=CAVE_PATH_MAX) continue;
    for(const [dx,dz] of CAVE_NB8){ const nx=cx+dx, nz=cz+dz; if(nx<0||nz<0||nx>=W||nz>=B.h) continue; const ni=nz*W+nx; if(!B.cells[ni]||st[ni]===cur) continue;
      if(dx&&dz&&(!B.cells[cz*W+nx]||!B.cells[nz*W+cx])) continue; st[ni]=cur; di[ni]=dc+1; q[qt++]=ni; } }
  if(st[me]!==cur) return null;
  let best=di[me], bx=-1, bz=-1; const mxc=me%W;
  for(const [dx,dz] of CAVE_NB8){ const nx=mxc+dx, nz=mz+dz; if(nx<0||nz<0||nx>=W||nz>=B.h) continue; const ni=nz*W+nx; if(st[ni]!==cur||di[ni]>=best) continue;
    if(dx&&dz&&(!B.cells[mz*W+nx]||!B.cells[nz*W+mxc])) continue; best=di[ni]; bx=nx; bz=nz; }
  return bx<0?null:[bx,bz];
}
function caveSteerS(m,tx,tz){
  if(!caveWallAt(tx,tz)&&caveLos(m.x,m.z,tx,tz)) return [tx,tz];
  const B=caveBake(m.cave), o=caveFloorOrigin(m.cave);
  if(m.cvW&&S.t-m.cvT<CAVE_PATH_T&&Math.hypot(m.cvG[0]-tx,m.cvG[1]-tz)<3) return m.cvW;   // the waypoint from a moment ago still serves
  const nx=caveNextCell(B,Math.floor((tx-o.x)/CAVE_CELL),Math.floor((tz-o.z)/CAVE_CELL),Math.floor((m.x-o.x)/CAVE_CELL),Math.floor((m.z-o.z)/CAVE_CELL));
  m.cvT=S.t; m.cvG=[tx,tz]; m.cvW=nx?[o.x+(nx[0]+0.5)*CAVE_CELL,o.z+(nx[1]+0.5)*CAVE_CELL]:[m.x,m.z];   // (no way found: stand still, a leash or the player's return frees it)
  return m.cvW;
}
// ---- the lift ----
function caveLiftP(p,to){
  if(p.dead||p.inst||p.pv||!Number.isInteger(to)||to<0||to>9) return;
  if(S.t-(p.liftT===undefined?-9:p.liftT)<CAVE_LIFT_CD) return;
  const here=caveFloorAt(p.x,p.z), L=here>=0?caveLiftOf(here):CAVE_LIFT_SURFACE;
  if(!L||Math.hypot(p.x-L.x,p.z-L.z)>L.r+CAVE_LIFT_REACH){ toastTo(p.id,'Stand on the lift first.','bad'); return; }
  if(here===to||(here<0&&to===0)) return;
  const why=caveLiftRefusal(p,to); if(why){ toastTo(p.id,why,'bad'); return; }
  const A=caveArrival(to); p.liftT=S.t;
  ev('warp',p.id,r1(p.x),r1(p.z),r1(A.x),r1(A.z));
  p.x=A.x; p.z=A.z; p.y=getH(A.x,A.z); p.vx=p.vz=0; p.act=null;
  for(const m of MONS) if(m.tgt===p.id){ m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; }
  sendTo(p.id,{t:'tp',x:A.x,z:A.z,face:A.face});
  toastTo(p.id,to===0?'The lift carries you up to the Wildwood.':'The lift carries you down to '+caveFloorDef(to).name+'.','good');
}
MSG.lift=(p,msg)=>{ if(typeof msg.to==='number') caveLiftP(p,msg.to); };   // (a number only: null would read as the surface)
// knocked out on a floor: you wake at its lift
function caveReviveP(p){
  const n=caveFloorAt(p.x,p.z), A=caveArrival(n>=0?n:1);
  p.x=A.x; p.z=A.z; p.y=getH(A.x,A.z); p.dead=false; p.hp=p.maxHp; p.lastHit=-99; p.vx=p.vz=0; sendTo(p.id,{t:'tp',x:A.x,z:A.z,face:A.face}); ev('up',p.id); p.dirty=true;
}
// testing (dev command 'tunnel' with v 'cave:...'): the mouth, a floor's lift, or a spot on a floor in floor-local metres
function caveDevTp(p,v){
  let x, z, face=0;
  if(v==='mouth'){ const q=caveMouthAt(-1,9); x=q[0]; z=q[1]; face=caveArrival(0).face; }   // (9 m out, facing the doorway)
  else { const m=/^(\d)(?:,(-?\d+),(-?\d+)(?:,(-?\d+))?)?$/.exec(v); if(!m||!caveFloorDef(+m[1])) return;
    if(m[2]===undefined){ const A=caveArrival(+m[1]); x=A.x; z=A.z; face=A.face; }
    else { const o=caveFloorOrigin(+m[1]); x=o.x+(+m[2]); z=o.z+(+m[3]); face=m[4]!==undefined?(+m[4])*Math.PI/180:0; } }
  p.x=x; p.z=z; p.y=getH(x,z); p.vx=p.vz=0; sendTo(p.id,{t:'tp',x,z,face});
}
