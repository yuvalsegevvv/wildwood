//@ Cave method C on the server, Echo trial: stand on the plinth, an echo spawns a pack and sets a feat (no hit on floor 1; a set's own feat from its skill's `feat` field on the others)
/* Agent map. Numbers: shared/cave/method-c-echo.js; the feat: caveFeatOf(floor) (shared/cave-methods.js) = the floor's method-C skill's `feat`, else the general one. Feat kinds (data, so C4 only fills a skill's `feat`):
     {kind:'pack', n, time, noHit}                 beat n spawned monsters within `time` s (noHit: not hit once by anything)
     {kind:'holdTaunt', n, secs, time}             a pack of n+2; keep n of them taunted by you (ssTauntS) at once for `secs` seconds in a row
     {kind:'holdMark', mark, n, secs, time, r}     keep your mark `mark` (a set's stacks: ssMarkSum) at n or more for `secs` seconds in a row, on a pack of n+2
   State p.cm.C = {s 0 idle / 1 running, t0 (start), hold (seconds the hold has lasted), mons (the spawned ones), lock (no new start before), ok (dead), tot, why (HUD)}. The spawned monsters are ordinary temp monsters of the
   floor's kind number `kind` (they pay as usual and are removed when they die); they are anybody's to fight, only the starter's feat counts. Failing (hit, time, leaving, a knock-out) removes the rest. */
function caveFeatNeed(feat){ return feat.kind==='pack'?feat.n:feat.n+2; }
function caveMCClear(M,why){   // remove what the trial spawned (the trial is over or its owner left)
  const C=M.C; for(const m of C.mons) if(!m.dead&&!m.remove) removeMonS(m);
  const was=C.s; C.mons=[]; C.s=0; C.hold=0;
  return was;
}
function caveMCFail(p,M,why){ const was=caveMCClear(M,why); if(was){ M.C.lock=S.t+caveMethodDef('C').p.failLock; toastTo(p.id,'Echo trial failed: '+why,'bad'); } }
function caveMCTickP(p,M,dt){
  const D=caveMethodDef('C').p, C=M.C, W=caveAW(M.n), pl=W.C.plinth, F=caveFloorDef(M.n), feat=caveFeatOf(M.n);
  if(!C.s){
    if(caveCdLeft(p,M.n,'C')>0||S.t<C.lock){ C.hold=0; return; }
    if(caveMd(p,pl)<Math.min(D.reach,pl.r||D.reach)){ C.hold+=dt; if(C.hold>=D.hold) caveMCStart(p,M,W,F,feat,D); } else C.hold=0;
    return;
  }
  const left=Math.ceil(feat.time-(S.t-C.t0)); C.left=left;
  C.ok=C.mons.filter(m=>m.dead||m.remove).length;
  if(feat.kind==='pack'&&feat.noHit&&p.lastHit>=C.t0) return caveMCFail(p,M,'you were hit');
  if(caveMd(p,pl)>D.leash) return caveMCFail(p,M,'you left the plinth');
  if(left<=0) return caveMCFail(p,M,'time ran out');
  if(feat.kind==='pack'){
    C.why=C.ok+' of '+C.tot+' down, '+left+' s'+(feat.noHit?', do not get hit':'');
    if(C.ok>=C.tot){ caveMCClear(M,''); caveMDoneP(p,M,'C'); }
    return;
  }
  const live=C.mons.filter(m=>!m.dead&&!m.remove);
  const have=feat.kind==='holdTaunt'?live.filter(m=>m.taunt&&m.taunt.by===p.id&&m.taunt.until>S.t).length:ssMarkSum(p,feat.mark,feat.r||30);
  if(have>=feat.n) C.hold+=dt; else C.hold=0;
  C.why='hold '+have+'/'+feat.n+' for '+Math.max(0,Math.ceil(feat.secs-C.hold))+' s, '+left+' s left';
  if(C.hold>=feat.secs){ caveMCClear(M,''); caveMDoneP(p,M,'C'); }
  else if(!live.length) caveMCFail(p,M,'the pack is gone');
}
function caveMCStart(p,M,W,F,feat,D){
  const C=M.C, d=DEF_BY_ID[F.mobs[Math.max(0,Math.min(F.mobs.length-1,D.kind))]], pl=W.C.plinth, n=caveFeatNeed(feat); if(!d) return;
  C.mons=[]; const camp={x:pl.x,z:pl.z};
  for(let k=0;k<n;k++){
    let x=pl.x, z=pl.z; for(let t=0;t<16;t++){ const a=Math.random()*TAU, r=3+Math.random()*Math.max(1,(pl.r||6)-1), px=pl.x+Math.sin(a)*r, pz=pl.z+Math.cos(a)*r; if(caveFree(px,pz,d.rad)){ x=px; z=pz; break; } }
    const m=spawnMonS(d,x,z,camp,true); m.cave=M.n; m.cmT=p.id; m.aggro=true; m.tgt=p.id; C.mons.push(m);
  }
  C.s=1; C.t0=S.t; C.ok=0; C.tot=n; C.hold=0; C.why='';
  toastTo(p.id,'The echo wakes: '+(feat.kind==='pack'?'beat '+n+' of them'+(feat.noHit?' without being hit':''):feat.kind==='holdTaunt'?'keep '+feat.n+' taunted for '+feat.secs+' s':'keep '+feat.n+' '+feat.mark+' for '+feat.secs+' s')+'.','good');
}
