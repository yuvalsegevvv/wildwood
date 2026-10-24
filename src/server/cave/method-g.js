//@ Cave method G on the server, The gem mole: a rare mole spawns at a burrow, runs for a hole and digs out unless it is brought down first; slows and stuns work on it, everyone who hurt it is paid
/* Agent map. Numbers: shared/cave/method-g-mole.js (first mole `first` s after someone arrives, then every `every` s after the last one ends; speed, dig time, hp share `hpK` of a same-level monster x (1 + 0.9 per floor
   deeper), the run is `minRun`..`maxRun` m of walking from burrow to hole: caveMPathS finds the way over the walk grid once, at spawn). The mole is the 'gemmole' cave monster (a real monster the client already draws), temp, scripted: m.cmo = 1 makes updateMonstersS hand it
   to caveMoleS(m, dt) instead of the AI. m.mole = {path (waypoints), i, tx, tz (the dig spot beside its hole), dig (seconds of digging left, 0 = running), hit (copy of the hitters while alive: killMonsterS clears them), paid}.
   A stun stops it (and its digging), a slow makes it 40% as fast, a burn ticks as always. The floor's state caveMFl(n).mole is the live mole. Reaching the dig spot starts the dig; finishing it removes the mole.
   Paid on its death: every player who hit it in the last `credit` s and is on the floor and not resting (the method's 10-minute cooldown) gets the method. */
function caveMPathS(n,from,to){   // the way from one point to another over the floor's walk grid: a list of world points (cell centres), or null. A breadth-first field from the goal, then downhill from the start
  const B=caveBake(n), o=caveFloorOrigin(n), W=B.w, H=B.h, cx=p=>Math.floor((p.x-o.x)/CAVE_CELL), cz=p=>Math.floor((p.z-o.z)/CAVE_CELL);
  const g=cz(to)*W+cx(to), s=cz(from)*W+cx(from); if(!B.cells[g]||!B.cells[s]) return null;
  const dist=new Int32Array(W*H).fill(-1), q=[g]; dist[g]=0;
  for(let h=0;h<q.length;h++){ const c=q[h], x=c%W, z=(c-x)/W;
    for(const [dx,dz] of CAVE_NB8){ const nx=x+dx, nz=z+dz; if(nx<0||nz<0||nx>=W||nz>=H) continue; const ni=nz*W+nx; if(!B.cells[ni]||dist[ni]>=0) continue;
      if(dx&&dz&&(!B.cells[z*W+nx]||!B.cells[nz*W+x])) continue; dist[ni]=dist[c]+1; q.push(ni); } }
  if(dist[s]<0) return null;
  const path=[]; let c=s;
  while(c!==g){ const x=c%W, z=(c-x)/W; let best=c;
    for(const [dx,dz] of CAVE_NB8){ const nx=x+dx, nz=z+dz; if(nx<0||nz<0||nx>=W||nz>=H) continue; const ni=nz*W+nx; if(dist[ni]<0||dist[ni]>=dist[best]) continue;
      if(dx&&dz&&(!B.cells[z*W+nx]||!B.cells[nz*W+x])) continue; best=ni; }
    if(best===c) return null; c=best; path.push({x:o.x+((c%W)+0.5)*CAVE_CELL,z:o.z+(Math.floor(c/W)+0.5)*CAVE_CELL}); }
  return path;
}
function caveMGTickS(n,G){
  if(G.mole) return;
  if(S.t<G.moleNext) return;
  const D=caveMethodDef('G').p, W=caveAW(n), d=DEF_BY_ID.gemmole; if(!d) return;
  const b=W.G.burrows[Math.floor(Math.random()*W.G.burrows.length)], routes=[];
  for(const h of W.G.holes){ const spot={x:h.x+(h.nx||0)*1.2,z:h.z+(h.nz||0)*1.2}, path=caveMPathS(n,b,spot); if(path&&path.length) routes.push({spot,path,len:path.length*CAVE_CELL}); }
  if(!routes.length) return;
  const fit=routes.filter(r=>r.len>=D.minRun&&r.len<=D.maxRun), R=(fit.length?fit:routes.sort((a,c)=>c.len-a.len).slice(0,1))[0|Math.random()*(fit.length||1)];
  const m=spawnMonS(d,b.x,b.z,{x:b.x,z:b.z},true); m.cave=n; m.cmo=1; m.awake=true;
  m.maxHp=m.hp=Math.max(1,Math.round(d.hp*D.hpK*(1+0.9*(n-1)))); m.mole={path:R.path,i:0,tx:R.spot.x,tz:R.spot.z,dig:0,hit:new Map(),paid:false};
  G.mole=m; caveMToFloorS(n,'A gem mole bursts out of its burrow and runs for the walls! Catch it before it digs out.','good');
}
function caveMoleS(m,dt){
  const G=caveMFl(m.cave), D=caveMethodDef('G').p, mo=m.mole;
  if(m.dead){
    if(!mo.paid){ mo.paid=true; caveMolePayS(m,D); if(G.mole===m){ G.mole=null; G.moleNext=S.t+D.every[0]+Math.random()*(D.every[1]-D.every[0]); } }
    m.deadT+=dt; if(m.deadT>1.2) removeMonS(m); return;
  }
  for(const [k,v] of m.hitters) mo.hit.set(k,v);
  m.awake=true;
  if(m.stunT>0){ m.stunT-=dt; m.vx=m.vz=0; m.pendingHit=-1; return; }
  let sp=D.speed; if(m.slowT>0){ m.slowT-=dt; sp*=0.4; }
  if(mo.dig>0){ mo.dig-=dt; m.vx=m.vz=0; if(mo.dig<=0){ caveMToFloorS(m.cave,'The gem mole dug out and got away.','bad'); if(G.mole===m){ G.mole=null; G.moleNext=S.t+D.every[0]+Math.random()*(D.every[1]-D.every[0]); } removeMonS(m); } return; }
  let wp=mo.path[mo.i]||{x:mo.tx,z:mo.tz}; while(mo.i<mo.path.length-1&&Math.hypot(wp.x-m.x,wp.z-m.z)<0.9){ mo.i++; wp=mo.path[mo.i]; }
  const ox=m.x, oz=m.z, ex=wp.x-m.x, ez=wp.z-m.z, e=Math.hypot(ex,ez);
  if(e>0.05){ m.vx=ex/e*sp; m.vz=ez/e*sp; m.faceGoal=Math.atan2(-ex,-ez); m.x+=m.vx*dt+m.kbx*dt; m.z+=m.vz*dt+m.kbz*dt; const kd=Math.exp(-7*dt); m.kbx*=kd; m.kbz*=kd; }
  caveMonStepS(m,ox,oz);
  m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-8*dt));
  if(Math.hypot(mo.tx-m.x,mo.tz-m.z)<1.1) mo.dig=D.dig;
}
function caveMolePayS(m,D){
  for(const [pid,t] of m.mole.hit){ const q=S.players.get(pid), M=q&&q.cm;
    if(!q||!M||M.n!==m.cave||S.t-t>D.credit||caveCdLeft(q,M.n,'G')>0) continue;
    caveMDoneP(q,M,'G'); }
}
