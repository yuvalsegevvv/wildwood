//@ The Abyss's run (B2): a Fight round is a fresh run object in an Abyss slot, three waves through the void's tears, plain monsters at the round's level; go, next, out, death, leaving; no world rewards
/* agent map (docs/ABYSS.md; numbers: shared/abyss.js)
   exports: abRunOf(p), abRunNewS(p,d,r,dropRun), abStartRoundS(p,run), abGoP(p,d), abNextP(p), abOutP(p), abSpawnS(run,defId,lx,lz), abWaveStepS(run), abRoundWonS(run), abDownTickS(run,p,dt) (dgDownTickS hook),
            abLeaveP(run,p) (dgLeaveP hook), abCloseS(run) (dgCloseS hook), abDevP(p,msg) (devP 'abyss'), DG_KITS.abyss
   artifacts: abyss/arts.js (offers after a won round: abOfferP; the bar travels in gear.ab.run).
   hooks marked `// abyss:` (docs/ABYSS.md section 3): dungeons/runs.js dgSetupS, dgDownTickS, dgCloseS; dungeons/lobby.js dgLeaveP; dungeons/mobs.js rewardAllS; economy.js devP; game/dungeon/run.js (the client's layout)
   save: gear.ab.run = {d, r, at (ms)} while a run is on (cleared at its end; a saved run with no live instance is cleaned up by the next abyss message, never resumed)
   events: abr [pid, round, of, lv] when a round starts, abw [pid, round] when a (not the last) round is won, plus the dungeons' tp (dg {m:'abyss', th:AB_THEME, seed}), spawn, dge at the end; the snapshot's dg tuple: run.hud (shared/abyss.js DG_HUD.abyss)
   test: tools/abyss-smoke.js.   A run: run.ab=true, run.mission='abyss', run.abD (difficulty index), run.abR (round), run.L = abRoundLv, run.back = where the hiker entered; run.abWon between rounds (the hiker waits in it for next / out). */
const AB_TXT_SHARED='The Abyss needs Solo mode or a server: a shared room cannot keep a run apart from the world.';
const abRunOf=p=>{ const r=dgRunOf(p); return r&&r.ab?r:null; };
const abSaveOf=p=>p.gear.ab||(p.gear.ab={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,sh:{d:0,n:{}},run:null});
// a run left over in the save (a restart, a pulled plug that closed the run) with no live instance ends cleanly: nothing is resumed in B2
function abStaleP(p){ const g=abSaveOf(p); if(g.run&&!abRunOf(p)){ g.run=null; p.dirty=true; } }
// a run object of the dungeons' shape in the first free Abyss slot (dropRun: a run of this hiker's whose slot counts as free), the layout abLayout, one member, no party
function abRunNewS(p,d,r,dropRun){
  let slot=-1; for(let i=AB_SLOT0;i<DG_MAX_INST;i++) if(!DG_SLOT_RUN[i]||(dropRun&&DG_SLOT_RUN[i]===dropRun.id)){ slot=i; break; }
  if(slot<0) return null;
  const T=RIFT_DEFS[AB_THEME], seed=Math.floor(Math.random()*1e9), L=abLayout(seed), B=dgBake(L); B.open=true;
  const O=dgSlotOrigin(slot), run={id:dgNextRun++,slot,ox:O.x,oz:O.z,theme:T,th:T.id,mission:'abyss',seed,L:abRoundLv(d,r),tier:0,lay:L,B,
    phase:'objectives',ready:false,t:0,endT:0,members:new Map(),mons:new Set(),objs:[],boss:null,k:{},hud:[],party:0,lead:p.id,dev:false,back:dropRun&&dropRun.back?{x:dropRun.back.x,z:dropRun.back.z}:{x:p.x,z:p.z},
    inv:new Map(),asked:new Set(),emptyT:0,flow:new Map(),nextObj:0,ab:true,abD:d,abR:r,abWon:false};
  DG_SLOT_RUN[slot]=run.id; DG_RUNS.set(run.id,run); return run;
}
// the hiker walks in, the kit's setup starts the waves, abr tells the client the round
function abStartRoundS(p,run){
  const g=abSaveOf(p), old=g.run; g.run={d:run.abD,r:run.abR,at:Date.now(),arts:old&&old.arts||[],curses:old&&old.curses||[],offer:null}; p.dirty=true;   // the bar goes on from round to round
  dgEnterS(run,p); abArtsDirtyP(p); recalcP(p); dgSetupS(run);   // abyss: the bar's health counts from the moment the hiker is in the run
  dgEvTo('abr',p.id,run.abR,abRounds(run.abD),run.L);
  toastTo(p.id,'Round '+run.abR+(abRounds(run.abD)?' of '+abRounds(run.abD):'')+': level '+run.L+'.','');
}
function abGoP(p,d){
  if(io.broadcastSnaps){ toastTo(p.id,AB_TXT_SHARED,'bad'); return; }
  if(p.dead||p.inst||p.pv) return;
  const g=abSaveOf(p); abStaleP(p);
  if(typeof d!=='number'||!Number.isInteger(d)||d<0||d>AB_INF) return;
  if((p.level|0)<AB_ENTRY_LV){ toastTo(p.id,'The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
  if(d>(g.top|0)){ toastTo(p.id,'Clear the difficulty before it first.','bad'); return; }
  const run=abRunNewS(p,d,1); if(!run){ toastTo(p.id,'The Abyss is full right now. Try again in a minute.','bad'); return; }
  abStartRoundS(p,run);
}
// the next round of a won one: a fresh run object (the old one's slot is reused), the hiker is carried over without a trip through the world
function abNextP(p){
  const old=abRunOf(p); if(!old||!old.abWon||old.endT||p.dead) return;
  if(abSaveOf(p).run&&abSaveOf(p).run.offer){ toastTo(p.id,'Pick an artifact or skip the offer first.','bad'); return; }
  const d=old.abD, r=old.abR+1; if(abRounds(d)&&r>abRounds(d)) return;
  const c0=S.ctx; S.ctx=old.id;
  for(const m of [...old.mons]) dgRemoveS(old,m);
  DG_SLOT_RUN[old.slot]=0; DG_RUNS.delete(old.id); S.ctx=c0;
  const run=abRunNewS(p,d,r,old); abStartRoundS(p,run);
}
// leave between rounds: everything is kept
function abOutP(p){
  const run=abRunOf(p); if(!run) return;
  if(!run.abWon||run.endT){ if(!run.endT) toastTo(p.id,'Finish the round first: leaving in a fight counts as a fall.','bad'); return; }
  abEndRunS(run,p,'You leave the Abyss with everything you earned.','good');
}
// the run is over for this hiker (out, fell, left): the save's run is cleared, the hiker is back in the world, the slot is free
function abEndRunS(run,p,txt,kind){
  const g=abSaveOf(p); g.run=null; p.dirty=true; abArtsDirtyP(p);
  if(txt) toastTo(p.id,txt,kind||'');
  dgExitS(run,p); dgCloseS(run); recalcP(p);   // abyss: the bar's maximum health goes with the run
}
function abFellS(run,p){ dgEndEvS(run,p,0,'the Abyss took you.'); abEndRunS(run,p,'The Abyss took you. Nothing you earned is lost.','bad'); }
function abDownTickS(run,p,dt){ if(run.endT&&!run.abWon) return; p.deadT+=dt; if(p.deadT>=AB_DEATH_S) abFellS(run,p); }
// leaving: between rounds it is "out", in a fight it is a fall
function abLeaveP(run,p){ if(run.abWon&&!run.endT) abOutP(p); else if(run.endT){ abEndRunS(run,p,'','' ); } else abFellS(run,p); }
// the run closes (dgCloseS: the empty timer, the end of a won run, any of the above): whoever is still online has no run in the save now. A fight round closed here with its hiker gone was a fall.
function abCloseS(run){ for(const mb of run.members.values()){ const q=mb.p&&S.players.get(mb.pid)===mb.p?mb.p:dgFindKeyS(mb.key); if(q&&q.gear&&q.gear.ab&&q.gear.ab.run){ q.gear.ab.run=null; q.dirty=true; abArtsDirtyP(q); recalcP(q); } } }
// a monster of the round at local (lx, lz): the run's level and its plain numbers (no brittle glass K's), coming for you at once
function abSpawnS(run,defId,lx,lz){
  const d=DEF_BY_ID[defId]; if(!d||run.endT) return null;
  const W=dgWorldS(run,lx,lz), c0=S.ctx; S.ctx=run.id;
  const m=makeMon(d,W.x,W.z,{x:W.x,z:W.z},1,true);
  if(m.inst!==run.id) dgAdoptS(m);
  m.dgK=dgKOf(d,run.L); m.dgHunt=true;
  ev('spawn',monRoster(m)); S.ctx=c0; return m;
}
function abPickS(run){ const kinds=run.theme.kinds, tw=kinds.reduce((s,c)=>s+c.w,0); let r=Math.random()*tw; for(const c of kinds){ r-=c.w; if(r<=0) return c.id; } return kinds[0].id; }
// the wave step: AB_COUNT_S, then AB_WAVES waves (the next at AB_NEXT_PCT dead or AB_WAVE_S); 'won' when the last wave is dead
function abWaveStepS(run){
  const k=run.k, S0=run.B.marks.S;
  const go=()=>{ k.w++; k.start=run.t; k.size=abWaveSize(run.abR,k.w); k.dead=0;
    for(let i=0;i<k.size;i++) k.q.push([abPickS(run),run.t+AB_RELEASE_S*i/k.size,k.w]); };
  if(!k.w){ if(run.t>=AB_COUNT_S) go(); }
  else if(k.w<AB_WAVES&&(k.dead>=k.size*AB_NEXT_PCT||run.t-k.start>=AB_WAVE_S)) go();
  let alive=riftAliveS(run);
  while(k.q.length&&k.q[0][1]<=run.t&&alive<AB_ALIVE_MAX&&S0.length){
    const [id,,w]=k.q.shift(), s=S0[(k.ti++)%S0.length], a=Math.random()*TAU, rr=Math.random()*2.5, m=abSpawnS(run,id,s.x+Math.sin(a)*rr,s.z+Math.cos(a)*rr);
    if(m){ m.abW=w; alive++; }
  }
  return k.w>=AB_WAVES&&!k.q.length&&!alive?'won':'';
}
function abHudS(run){ const k=run.k, clk=!k.w?Math.max(0,Math.ceil(AB_COUNT_S-run.t)):k.w>=AB_WAVES?0:Math.max(0,Math.ceil(AB_WAVE_S-(run.t-k.start)));
  run.hud=[run.abR,abRounds(run.abD),riftAliveS(run)+k.q.length,k.w|0,AB_WAVES,clk]; }
// the round is won: the hiker waits in the run for next / out; the last round of a finite difficulty wins the run (opens the next difficulty, counts a clear) and the run closes after DG_END_S
function abRoundWonS(run){
  if(run.abWon||run.endT) return; run.abWon=true; run.phase='won'; abHudS(run);
  const d=run.abD, n=abRounds(d), last=n&&run.abR>=n;
  for(const p of dgPresentS(run)){
    if(p.dead){ p.dead=false; p.deadT=0; p.hp=p.maxHp; p.lastHit=S.t; ev('up',p.id); }
    const g=abSaveOf(p);
    if(d===AB_INF) g.best=Math.max(g.best|0,Math.min(999999,run.abR));
    if(last){ g.top=Math.max(g.top|0,Math.min(5,d+1)); g.clears[d]=Math.min(999999,(g.clears[d]|0)+1); g.run=null; dgEndEvS(run,p,1,''); toastTo(p.id,AB_DIFFS[d].name+' cleared! '+AB_DIFFS[d+1].name+' is open.','good'); }
    else { dgEvTo('abw',p.id,run.abR); abOfferP(run,p); toastTo(p.id,'Round '+run.abR+' won. Go on to the next round, or leave with everything you earned.','good'); }
    p.dirty=true;
  }
  if(last) run.endT=S.t;   // the dungeons' end timer closes the run (dgRunTickS) and puts everyone back
}
DG_KITS.abyss={
  setup(run){ run.k={q:[],kills:0,ti:0,w:0,start:0,size:0,dead:0}; abHudS(run); },
  tick(run,dt){ if(run.endT||run.abWon) return; if(abWaveStepS(run)==='won'){ abRoundWonS(run); return; } abHudS(run); },
  onKill(run,m){ run.k.kills++; if(m.abW===run.k.w) run.k.dead++; },
  hud(run){ abHudS(run); },
};
// testing tool (devP 'abyss', v: the top difficulty 0-5, r: skip to round r of difficulty d now: needs no run, leaves one)
function abDevP(p,msg){
  const g=abSaveOf(p);
  if(msg.v!==undefined){ g.top=clampInt(msg.v,0,5,0); p.dirty=true; toastTo(p.id,'Abyss: difficulty '+g.top+' open.','good'); }
  if(msg.r!==undefined&&abRunOf(p)){ const old=abRunOf(p); if(g.run) g.run.offer=null; old.abR=clampInt(msg.r,1,Math.max(1,abRounds(old.abD)||99),1)-1; old.abWon=true; old.endT=0; abNextP(p); }
}
