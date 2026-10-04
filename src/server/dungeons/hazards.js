//@ Dungeon runs, the themes' hazards at run time: the Hollow Roots' root spikes, the Jade Springs' steam vents, the Bonefrost Barrow's rime prisons (legend cells with hz in B.props), warned with the bosses' own telegraphs, hurting a share of health, rooting or slowing
/* agent map
   exports: dgHazardsS(run,dt) (from dgFxTickS, fx.js: every tick of a run that is on), dgHazardsEndS(run) (the run ended: live warnings are taken back), dgHzBuildS(run), DG_HZ
   uses: B.props (shared/dungeons.js dgBake: {k, x, z, hz} for every legend cell; the themes' legends mark hz), dgHurtPctS, pfxS (server/boss-fx.js), nextTeleId
   test: tools/dungeon-missions-smoke.js (each kind warns, hurts, roots / slows, and stops when the run ends).   Design: docs/DUNGEON-THEMES.md section 3 (the hazards), docs/DUNGEONS.md section 9.
   EVENTS (to the run, the bosses' own, which the client already draws: game/combat/boss.js addTele / endTele): tele [id, kind, x, z, r, dur, 0, half] then tend [id, 1 went off |
   0 missed or taken back, x, z]; the player hit gets pfx [pid, 'root' | 'slow', seconds, 0, 0] (the client applies it to itself) and hurt as usual.
     spikes  'root' circle r 2.4, 1.6 s: under a member standing on (within 2 m of) a spike cell of the patch, else on a random spike cell while a member is within 14 m;
             10% of max health and rooted 1.2 s; a patch again after 7-11 s
     steam   'geyser' circle over the whole vent patch (r = its size + 1.4, at least 2.6), 1.1 s: 8% of max health and slowed 2.5 s; again after 6-9 s while a member is within 14 m
     prison  'prison' mark (half = the pid it follows) on a member who stands on rime (within one cell of an x cell), 1.7 s, at most every 7 s each: if they are STILL on rime when
             it closes, 6% of max health and rooted 2.4 s (step off the rime to break it), else it misses (tend 0)
   Damage is a share of max health with no armour (dgHurtPctS: the place, not a monster, so no level or zone tier). A patch is the cells of one hazard joined by their 8 neighbours.
   Not built: the barrow's gloom (client-only, docs/DUNGEON-THEMES.md section 3) and Haugbui's blackout (the boss kit's); no theme marks a spore hazard (Amanita's spores are her own). */
const DG_HZ={
  spikes:{tele:'root',r:2.4,dur:1.6,share:0.10,fx:'root',fxT:1.2,cd:[7,11]},
  steam:{tele:'geyser',r:2.6,dur:1.1,share:0.08,fx:'slow',fxT:2.5,cd:[6,9]},
  prison:{tele:'prison',r:2.1,dur:1.7,share:0.06,fx:'root',fxT:2.4,cd:[7,7]}};
const DG_HZ_NEAR=14;   // a patch stirs only while a living member is within its size + 14 m (no events for an empty corner of the map)
// the patches of every hazard kind the bake lists (B.props with hz), and the rime cells as a set for the prison check
function dgHzBuildS(run){
  const B=run.B, byCell=new Map(), list=[], rime=new Set();
  for(const pr of B.props){ if(!pr.hz||!DG_HZ[pr.hz]) continue; const c=Math.floor(pr.z/DG_CELL)*B.w+Math.floor(pr.x/DG_CELL); byCell.set(c,pr); if(pr.hz==='prison') rime.add(c); }
  const seen=new Set();
  for(const [c0,p0] of byCell){
    if(seen.has(c0)||p0.hz==='prison') continue;
    const cells=[], q=[c0]; seen.add(c0);
    for(let i=0;i<q.length;i++){ const c=q[i], pr=byCell.get(c); cells.push(pr); const cx=c%B.w, cz=(c-cx)/B.w;
      for(const [dx,dz] of DG_NB8){ const n=(cz+dz)*B.w+cx+dx, o=byCell.get(n); if(o&&o.hz===p0.hz&&!seen.has(n)&&cx+dx>=0&&cx+dx<B.w){ seen.add(n); q.push(n); } } }
    const x=cells.reduce((s,p)=>s+p.x,0)/cells.length, z=cells.reduce((s,p)=>s+p.z,0)/cells.length, r=Math.max(...cells.map(p=>Math.hypot(p.x-x,p.z-z)));
    const K=DG_HZ[p0.hz]; list.push({kind:p0.hz,x,z,r,cells,cd:AR(2,K.cd[1])});
  }
  return {list,rime,live:[],pcd:new Map()};
}
const dgOnRimeS=(run,H,lx,lz)=>{ const B=run.B, cx=Math.floor(lx/DG_CELL), cz=Math.floor(lz/DG_CELL); for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) if(H.rime.has((cz+dz)*B.w+cx+dx)) return true; return false; };
function dgHzWarnS(run,H,kind,lx,lz,r,half){
  const K=DG_HZ[kind], W=dgWorldS(run,lx,lz), e={id:nextTeleId++,kind,x:W.x,z:W.z,r,t:0,dur:K.dur,half:half||0};
  H.live.push(e); ev('tele',e.id,K.tele,r1(e.x),r1(e.z),r1(r),K.dur,0,e.half);
  return e;
}
function dgHzFireS(run,H,e){
  const K=DG_HZ[e.kind];
  if(e.kind==='prison'){
    const q=S.players.get(e.half), on=q&&!q.dead&&q.inst===run.id&&dgOnRimeS(run,H,q.x-run.ox,q.z-run.oz);
    if(on){ dgHurtPctS(q,K.share); pfxS(q,K.fx,K.fxT); ev('tend',e.id,1,r1(q.x),r1(q.z)); } else ev('tend',e.id,0);
    return;
  }
  for(const p of dgMembersS(run)) if(Math.hypot(p.x-e.x,p.z-e.z)<e.r+0.3){ dgHurtPctS(p,K.share); pfxS(p,K.fx,K.fxT); }
  ev('tend',e.id,1,r1(e.x),r1(e.z));
}
function dgHazardsS(run,dt){
  const F=dgFxOf(run); if(!F.hz) F.hz=dgHzBuildS(run);
  const H=F.hz; if(!H.list.length&&!H.rime.size) return;
  for(const e of [...H.live]){ e.t+=dt; if(e.t>=e.dur){ H.live.splice(H.live.indexOf(e),1); dgHzFireS(run,H,e); } }
  const ms=dgMembersS(run); if(!ms.length) return;
  const loc=ms.map(p=>({p,x:p.x-run.ox,z:p.z-run.oz}));
  for(const c of H.list){
    const near=loc.filter(q=>Math.hypot(q.x-c.x,q.z-c.z)<c.r+DG_HZ_NEAR); if(!near.length) continue;
    c.cd-=dt; if(c.cd>0) continue;
    const K=DG_HZ[c.kind]; c.cd=AR(K.cd[0],K.cd[1]);
    if(c.kind==='spikes'){
      const on=near.find(q=>c.cells.some(pr=>Math.hypot(pr.x-q.x,pr.z-q.z)<2)), pr=c.cells[Math.floor(Math.random()*c.cells.length)];
      dgHzWarnS(run,H,'spikes',on?on.x:pr.x,on?on.z:pr.z,K.r);
    } else dgHzWarnS(run,H,c.kind,c.x,c.z,Math.max(K.r,c.r+1.4));
  }
  if(H.rime.size) for(const q of loc){
    if((H.pcd.get(q.p.id)||0)>S.t||!dgOnRimeS(run,H,q.x,q.z)) continue;
    H.pcd.set(q.p.id,S.t+DG_HZ.prison.cd[0]); dgHzWarnS(run,H,'prison',q.x,q.z,DG_HZ.prison.r,q.p.id);
  }
}
// the run is over: whatever was still warning is taken back (an unfired tend), once
function dgHazardsEndS(run){ const H=run.fx&&run.fx.hz; if(!H||!H.live.length) return; for(const e of H.live) ev('tend',e.id,0); H.live=[]; }
