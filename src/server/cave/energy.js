//@ The Deep Cave's energy on the server: kills feed it, time drains it (faster the fuller it is), a low bar blinds and burns, a full bar opens the next floor, shard nodes cost it
/* Agent map. Rules and numbers: shared/cave-energy.js; doc: docs/CAVE.md section 17; test: tools/cave-smoke.js (energy block). State: p.cave.en (not saved; undefined until the first step on a floor, then CAVE_EN_START),
   p.cm.N = {cast: {i, end, x, z} | null} (a shard node being mined). Saved: gear.cave.mx[n] = 1 once the bar reached the max on floor n (opens floor n + 1), gear.cave.sn['<floor>:<i>'] = epoch seconds the node is ready again.
   Nothing pauses the drain except standing within CAVE_EN_SAFE_R of the floor's lift (puzzles, methods and fights all keep draining it).
   exports: caveEnTickP(p, M, dt) (caveMTickP calls it on a floor), caveEnKillS(p, m) (caveDropS), caveEnSafeP(p, n), caveEnNodeLeft(p, n, i), caveEnSendP(p, M, v) adds en / sf / sn / mc to the cm message. */
function caveEnSafeP(p,n){ const W=caveAW(n); return Math.hypot(p.x-W.start.x,p.z-W.start.z)<CAVE_EN_SAFE_R; }
function caveEnNodeLeft(p,n,i){ const s=p.gear.cave.sn&&p.gear.cave.sn[n+':'+i]; return s>0?Math.max(0,s-caveNow()):0; }
function caveEnAddP(p,n,x){   // energy up to the max; the max opens the next floor, once
  const c=p.cave; c.en=Math.max(0,Math.min(CAVE_EN_MAX,(c.en===undefined?CAVE_EN_START:c.en)+x));
  const g=p.gear.cave; if(c.en>=CAVE_EN_MAX&&g&&!(g.mx&&g.mx[n])){ (g.mx||(g.mx=[0,0,0,0,0,0,0,0,0,0]))[n]=1; p.dirty=true;
    toastTo(p.id,caveFloorDef(n+1)?'Your energy is full: floor '+(n+1)+' is open!':'Your energy is full.','good'); }
}
function caveEnKillS(p,m){   // a monster of a floor died: everyone on that floor near it gets energy
  const n=m&&m.cave|0; if(!(n>=1)||m.temp) return; const x=caveEnGain(n);
  for(const q of S.players.values()){ if(q.dead||q.pv||!q.cave||q.level<CAVE_SLOT_LV||caveFloorAt(q.x,q.z)!==n) continue;
    if(q!==p&&Math.hypot(q.x-m.x,q.z-m.z)>CAVE_EN_SHARE_R) continue; caveEnAddP(q,n,x); }
}
function caveEnTickP(p,M,dt){
  const c=p.cave, n=M.n; if(!c) return;
  if(c.en===undefined) c.en=CAVE_EN_START;
  if(p.dead){ M.N.cast=null; return; }
  const safe=caveEnSafeP(p,n); M.N.safe=safe;
  if(!safe){
    c.en=Math.max(0,c.en-caveEnDrain(c.en)*dt);
    if(c.en<CAVE_EN_LOW){ caveMTell(p,M,'enlow','Your cave energy is fading: you are hurting. Kill monsters or return to the lift.','bad');
      p.hp=Math.max(1,p.hp-p.maxHp*CAVE_EN_DOT*dt); p.lastHit=S.t; }   // (lastHit: no regeneration while it burns)
  }
  // shard nodes: stand still near one, pay the energy, get Echo Shards
  const W=caveAW(n), cs=M.N.cast;
  if(cs){ if(Math.hypot(p.x-cs.x,p.z-cs.z)>1.5||c.en<CAVE_EN_MINE){ M.N.cast=null; return; }
    if(S.t>=cs.end){ M.N.cast=null; c.en-=CAVE_EN_MINE; const g=p.gear.cave, sn=g.sn||(g.sn={}); sn[n+':'+cs.i]=caveNow()+CAVE_EN_NODE_CD;
      const w=p.gear.awm||(p.gear.awm={}), k=(CAVE_SHARDS[n]|0)*CAVE_EN_SHARD_K; w.echo=Math.min(AWK_STORE_MAX,(w.echo|0)+k); p.dirty=true;
      toastTo(p.id,'You mine '+k+' Echo Shards · '+w.echo+' in all','good'); ev('caveshards',p.id,k,w.echo); }
    return; }
  W.S.nodes.forEach((q,i)=>{ if(M.N.cast||Math.hypot(p.x-q.x,p.z-q.z)>=CAVE_EN_NODE_REACH||caveEnNodeLeft(p,n,i)>0) return;
    if(c.en<CAVE_EN_NODE_NEED){ caveMTell(p,M,'ennode','An echo shard node needs '+CAVE_EN_NODE_NEED+' cave energy (and uses '+CAVE_EN_MINE+').','bad'); return; }
    M.N.cast={i,end:S.t+CAVE_EN_MINE_SECS,x:p.x,z:p.z}; });
}
function caveEnSendP(p,M,v){
  v.en=Math.round(p.cave.en===undefined?CAVE_EN_START:p.cave.en); v.sf=M.N.safe?1:0; v.mc=M.N.cast?1:0;
  let sn=0; caveAW(M.n).S.nodes.forEach((q,i)=>{ if(caveEnNodeLeft(p,M.n,i)>0) sn|=1<<i; }); v.sn=sn;
}
