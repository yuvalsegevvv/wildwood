//@ Rifts on the server: the energy (gear.rift, refilled by the clock), the tear's window, a solo run in a rift slot of the dungeon instance layer, the waves of glass monsters, what a rift pays (XP x3, or Essence), x2 with the Double, the clear bonus, one respawn, leaving
/* agent map (docs/RIFT.md; the numbers: shared/rift.js)
   exports: riftSanitize(g,out) (sanitizeGear hook), riftMsgP (MSG.rift), riftRewardS(run,m) (rewardAllS hook), riftDownTickS(run,p,dt) (dgDownTickS hook), riftLeaveP(run,p) (dgLeaveP hook),
            riftEnergyP(p), riftStartP(p,R,x2), riftRunNewS(p,R,x2), DG_KITS.rift (the wave kit, set directly: 'rift' is not a dungeon mission, so the Delve board never deals it)
   hooks marked `// rift:` (docs/RIFT.md section 4): players.js sanitizeGear, dungeons/mobs.js rewardAllS, dungeons/runs.js dgSetupS (no puzzle stones) and dgDownTickS, dungeons/lobby.js dgLeaveP,
            dungeons/instances.js (the slot range, the void lets hits and projectiles through), dungeon-slots.js (32 slots)
   messages in: rift{a:'open'} (within RIFT_TALK of a tear) -> {t:'rift',a:'info',id,e (energy, 1 decimal),full (seconds to full),L,best,lv (the entry level),cost}; rift{a:'go',x2:0|1} (at the tear) starts a run;
                leaving is the dungeons' dg{a:'leave'} (the HUD's Leave button and the results card).
   events: the dungeons' (tp with dg {m:'rift'...}, spawn, the snapshot's dg tuple = [phase, seconds, 0, wave, monsters, seconds to the next wave, x2, xp]), plus riftw [pid, wave] (the wave banner) and dge at the end.
   save: gear.rift = {e (0-100), at (ms of the server clock when e was last brought up to date; never in the future), best (fastest clear in seconds, 0 = none), clears}
   test: tools/rift-smoke.js */
function riftSanitize(g,out){
  const s=g&&g.rift&&typeof g.rift==='object'&&!Array.isArray(g.rift)?g.rift:null, now=Date.now();
  if(!s){ out.rift={e:RIFT_E_MAX,at:now,best:0,clears:0,tier:0}; return; }   // a new save (or one from before rifts): full
  const at=isFinite(s.at)&&s.at>0?Math.min(now,+s.at):now;
  out.rift={e:isFinite(s.e)?Math.round(clamp(+s.e,0,RIFT_E_MAX)*1000)/1000:RIFT_E_MAX,at,best:clampInt(s.best,0,999999,0),clears:clampInt(s.clears,0,999999,0),tier:RIFT_TIERS.includes(s.tier|0)?s.tier|0:0};   // tier: the highest elemental tier cleared (0 = none)
}
const riftSaveOf=p=>p.gear.rift||(p.gear.rift={e:RIFT_E_MAX,at:Date.now(),best:0,clears:0,tier:0});
const riftEnergyP=p=>riftEnergyAt(riftSaveOf(p),Date.now());
// bring the save up to date and add v (negative to spend); the refill keeps counting from now
function riftEnergyAddP(p,v){ const g=riftSaveOf(p), now=Date.now(); g.e=Math.round(clamp(riftEnergyAt(g,now)+v,0,RIFT_E_MAX)*1000)/1000; g.at=now; p.dirty=true; }
function riftInfoP(p,R){
  const g=riftSaveOf(p), now=Date.now();
  sendTo(p.id,{t:'rift',a:'info',id:R.id,e:Math.floor(riftEnergyAt(g,now)*10)/10,full:riftFullIn(g,now),L:Math.max(RIFT_LV,p.level|0),best:g.best|0,clears:g.clears|0,lv:R.lv,cost:RIFT_E_DOUBLE,mode:R.mode,tiers:R.tiers||[],tier:g.tier|0});
}
const RIFT_TXT_SHARED='Rifts need Solo mode or a server: a shared room cannot keep a run apart from the world.';
function riftStartP(p,R,x2,lv){
  if(io.broadcastSnaps){ toastTo(p.id,RIFT_TXT_SHARED,'bad'); return; }
  if(p.dead||p.inst||p.pv) return;
  if((p.level|0)<R.lv){ toastTo(p.id,'The rift will not let you in: it is for hikers of level '+R.lv+' and up.','bad'); return; }   // (R.lv: RIFT_LV, or RIFT_ELEM_LV for an elemental rift)
  if(R.tiers){ if(!R.tiers.includes(lv)) lv=R.tiers[0]; if(!riftTierOpen(lv,riftSaveOf(p).tier)){ toastTo(p.id,'Level '+lv+' opens with a clear of level '+(lv-10)+' in any elemental rift.','bad'); return; } } else lv=0;
  if(x2&&riftEnergyP(p)<RIFT_E_DOUBLE){ toastTo(p.id,'A doubled run needs '+RIFT_E_DOUBLE+' energy.','bad'); return; }
  const run=riftRunNewS(p,R,x2,lv); if(!run){ toastTo(p.id,'Every rift is busy right now. Try again in a minute.','bad'); return; }
  if(x2) riftEnergyAddP(p,-RIFT_E_DOUBLE);
  dgEnterS(run,p); dgSetupS(run);
}
// a run object of the dungeons' shape (server/dungeons/instances.js dgNewRunS) in the first free rift slot, its layout riftLayout, one member, no party; lv: the tier picked (0: the XP rift, at your level)
function riftRunNewS(p,R,x2,lv){
  let slot=-1; for(let i=RIFT_SLOT0;i<DG_MAX_INST;i++) if(!DG_SLOT_RUN[i]){ slot=i; break; }
  if(slot<0) return null;
  const L=riftLayout(R), B=dgBake(L); B.open=true; lv=lv|0;
  const O=dgSlotOrigin(slot), run={id:dgNextRun++,slot,ox:O.x,oz:O.z,theme:R,th:R.id,mission:'rift',seed:0,L:lv||Math.max(RIFT_LV,p.level|0),tier:0,rtier:lv,lay:L,B,
    phase:'objectives',ready:false,t:0,endT:0,members:new Map(),mons:new Set(),objs:[],boss:null,k:{},hud:[],party:0,lead:p.id,dev:false,back:{x:p.x,z:p.z},
    inv:new Map(),asked:new Set(),emptyT:0,flow:new Map(),nextObj:0,rift:R.id,x2:!!x2};
  DG_SLOT_RUN[slot]=run.id; DG_RUNS.set(run.id,run); return run;
}
// a glass monster at local (lx, lz): the run's level, brittle (RIFT_HP_K, RIFT_DMG_K), coming for you at once; the Herald x RIFT_HERALD_HP and bigger
function riftSpawnS(run,defId,lx,lz,herald){
  const d=DEF_BY_ID[defId]; if(!d||run.endT) return null;
  const W=dgWorldS(run,lx,lz), c0=S.ctx; S.ctx=run.id;
  const m=makeMon(d,W.x,W.z,{x:W.x,z:W.z},herald?1.3:1,true);
  if(m.inst!==run.id) dgAdoptS(m);
  const k=dgKOf(d,run.L); m.dgK={lv:k.lv,hp:k.hp,dmg:k.dmg*RIFT_DMG_K,xp:k.xp};
  m.maxHp=m.hp=Math.max(1,m.maxHp*RIFT_HP_K*(herald?RIFT_HERALD_HP:1)); m.dgHunt=true; if(herald){ m.elite=true; m.dgRole='herald'; }
  ev('spawn',monRoster(m)); S.ctx=c0; return m;
}
/* WHAT A RIFT PAYS: one entry per reward mode (R.reward, shared/rift.js RIFT_REWARDS), kill(run,m,q,mb) for each kill, clear(run,p,mb) for the clear bonus. The engine only calls riftPayOf(run).
   xp: x3 a same-level world kill with every XP bonus the world counts (rewardKill's list), x2 when doubled; the clear is 75 same-level world kills' worth; no coins, items, materials or board hunts.
   essence (the elemental rifts, step 17a): no XP, no coins, no kill pays; Essence (R.essence: an element's or Prime, gear.awm via awkEssenceP) by the waves reached, riftEssFor, x2 when doubled: wave w - 1 is paid
   when wave w begins (wave(run,p,mb,w), only to a hiker who has killed something in the run), the last wave at the clear: a full run pays RIFT_ESS_FULL (12), a lost one what it got through. mb.got.mats counts it (the results card, the HUD) */
const riftXpBonus=q=>1+psP(q,'xp')+pendP(q,'xp')+rlP(q,'exp')+potBuffP(q,'scholar');
const RIFT_PAY={
  xp:{
    kill(run,m,q,mb){ const K=m.dgK||dgKOf(m.def,run.L), xp=m.T.xp*K.xp*RIFT_XP_K*(run.x2?2:1)*riftXpBonus(q); gainExpP(q,xp,m.id); if(mb) mb.got.xp+=xp; },
    clear(run,p,mb){ const xp=xpFor(run.L)*RIFT_BONUS_KILLS*(run.x2?2:1)*riftXpBonus(p); gainExpP(p,xp,null); if(mb) mb.got.xp+=xp; },
  },
  essence:{
    kill(){},
    stage(run,p,mb,st){ if(mb&&mb.got.kills>0) riftEssenceP(run,p,mb,riftEssAt(st,run.rtier)-riftEssAt(st-1,run.rtier)); },
    clear(run,p,mb){ const R=RIFT_DEFS[run.rift], e=R&&essOf(essIdOf(R.essence)), g=riftSaveOf(p); if(run.rtier>(g.tier|0)){ g.tier=run.rtier; const nx=RIFT_TIERS[RIFT_TIERS.indexOf(run.rtier)+1]; if(nx) toastTo(p.id,'Level '+nx+' rifts are open to you now.','good'); }
      if(e&&mb) toastTo(p.id,'The rift paid '+mb.got.mats+' '+e.name+'.','good'); },
  },
};
function riftEssenceP(run,p,mb,n){
  const R=RIFT_DEFS[run.rift], id=R&&essIdOf(R.essence); n=Math.max(0,n|0)*(run.x2?2:1); if(!id||!n) return;
  const add=awkEssenceP(p,id,n); if(mb) mb.got.mats+=add;
}
// a stage reached (every mode counts 10): each stage not yet paid is paid now (essence: by the tier; xp: nothing, kills pay)
function riftStageS(run,st){ const k=run.k, pay=riftPayOf(run); st=Math.min(RIFT_WAVES,st|0);
  while((k.st|0)<st){ k.st=(k.st|0)+1; if(pay.stage) for(const p of dgPresentS(run)) pay.stage(run,p,dgMemberOf(run,p),k.st); } }
const riftPayOf=run=>{ const R=RIFT_DEFS[run.rift]; return RIFT_PAY[R&&R.reward]||RIFT_PAY.xp; };
function riftRewardS(run,m){
  const pay=riftPayOf(run);
  for(const q of dgPresentS(run)){ const mb=dgMemberOf(run,q); pay.kill(run,m,q,mb); q.dirty=true; if(mb) mb.got.kills++; }
}
// downed in a rift (instead of the dungeons' 30 s and two respawns): one wake on the hub after RIFT_RESPAWN_S, a second knock-out ends the run
function riftDownTickS(run,p,dt){
  const mb=dgMemberOf(run,p); if(!mb||mb.out||run.endT) return;
  p.deadT+=dt; if(p.deadT<RIFT_RESPAWN_S) return;
  if(mb.respawns>0){ mb.respawns=0; dgRespawnS(run,p); toastTo(p.id,'The rift spits you back onto the hub. One more knock-out ends the run.',''); }
  else { mb.out=true; dgLoseS(run,'the glass got you twice.'); }
}
// leaving (the portal, the Leave button, the results card): out at once, the run closes; a run left before its first kill gives its energy back
function riftLeaveP(run,p){
  const mb=dgMemberOf(run,p);
  if(!run.endT&&run.x2&&!(run.k.kills>0)){ riftEnergyAddP(p,RIFT_E_DOUBLE); toastTo(p.id,'No kill yet: your '+RIFT_E_DOUBLE+' energy is back.',''); }
  if(!run.endT&&mb&&mb.got.kills) dgEndEvS(run,p,0,'you left the rift.');
  dgExitS(run,p); dgCloseS(run);
}
function riftWonS(run){
  if(run.endT) return; run.phase='won'; run.endT=S.t;
  const secs=Math.max(1,Math.round(run.t));
  riftStageS(run,RIFT_WAVES);   // (the last stage, paid before the clear)
  for(const p of dgPresentS(run)){
    const mb=dgMemberOf(run,p), g=riftSaveOf(p);
    if(p.dead){ p.dead=false; p.deadT=0; p.hp=p.maxHp; p.lastHit=S.t; ev('up',p.id); }
    riftPayOf(run).clear(run,p,mb);   // the clear bonus (xp: 75 same-level world kills' worth)
    g.clears=Math.min(999999,(g.clears|0)+1); if(!g.best||secs<g.best) g.best=secs; p.dirty=true;
    dgEndEvS(run,p,1,'');
  }
  DG_KITS.rift.hud(run);   // (the HUD's paid number includes the clear)
  toastTo(null,'The rift collapses! Cleared in '+dgClock(secs)+'. Back at the tear in '+DG_END_S+' s.','good');
}
/* THE RIFT KIT (DG_KITS.rift): the dungeons call it, it hands each step to the rift's mode (RIFT_MODE_KITS[R.mode], one file each in server/rift/: setup, tick, onKill, onUse).
   Shared by the modes: run.k = {st (stages paid, 0-10), q (spawns waiting: [def id, herald, not before run.t, stage, role]), kills, ti (the next tear), ...the mode's own}, the pour
   (riftQueueS / riftPourS: monsters through the tears, at most RIFT_ALIVE_MAX alive), the wave step (riftWaveStepS: Waves, Heartwood and Gale), riftHudS (the snapshot's numbers). */
const RIFT_MODE_KITS=Object.create(null);
const riftModeOf=run=>{ const R=RIFT_DEFS[run.rift]; return RIFT_MODE_KITS[R&&R.mode]||RIFT_MODE_KITS.waves; };
const riftAliveS=run=>{ let n=0; for(const m of run.mons) if(!m.dead&&!m.remove) n++; return n; };
// one kind of the rift by its plan (kinds join at their stage, by weight)
function riftPickS(run,stage){ const R=RIFT_DEFS[run.rift], kinds=R.kinds.filter(c=>c.from<=Math.max(1,stage)), tw=kinds.reduce((s,c)=>s+c.w,0); let r=Math.random()*tw;
  for(const c of kinds){ r-=c.w; if(r<=0) return c.id; } return kinds[0].id; }
// n monsters through the tears over `over` seconds from now (role 'breaker': it goes for run.k.heart), herald true: the rift's Herald
function riftQueueS(run,n,over,stage,role){ const k=run.k; for(let i=0;i<n;i++) k.q.push([riftPickS(run,stage),false,run.t+over*i/Math.max(1,n),stage,role||'']); k.q.sort((a,b)=>a[2]-b[2]); }
function riftQueueHeraldS(run,at,stage){ const k=run.k, R=RIFT_DEFS[run.rift]; k.q.push([R.herald,true,at,stage,'']); k.q.sort((a,b)=>a[2]-b[2]); }
function riftPourS(run){
  const k=run.k, S0=run.B.marks.S; let alive=riftAliveS(run);
  while(k.q.length&&k.q[0][2]<=run.t&&alive<RIFT_ALIVE_MAX&&S0.length){
    const [id,herald,,w,role]=k.q.shift(), s=S0[(k.ti++)%S0.length], a=Math.random()*TAU, r=Math.random()*2.5;
    const m=riftSpawnS(run,id,s.x+Math.sin(a)*r,s.z+Math.cos(a)*r,herald); if(!m) continue;
    m.riftW=w; alive++; if(role==='breaker'){ m.dgRole='breaker'; m.dgOwn=true; m.dgHunt=false; }
  }
  return alive;
}
/* THE WAVE STEP (Waves, Heartwood, Gale): RIFT_COUNT_S, then 10 waves of riftWaveSize(n) (a share `breakers` of them breakers), the next at RIFT_NEXT_PCT dead or RIFT_WAVE_S, the Herald on
   waves 5 and 10; wave w beginning pays stage w - 1; returns 'won' when the last wave is dead (the caller calls riftWonS) */
function riftWaveStepS(run,breakers,onWave){
  const k=run.k;
  const go=()=>{ k.w++; k.start=run.t; k.size=riftWaveSize(k.w); k.dead=0; const nb=Math.round(k.size*(breakers||0));
    riftQueueS(run,k.size-nb,RIFT_RELEASE_S,k.w,''); if(nb) riftQueueS(run,nb,RIFT_RELEASE_S,k.w,'breaker');
    if(k.w%5===0){ riftQueueHeraldS(run,run.t+RIFT_RELEASE_S*0.5,k.w); k.size++; }
    for(const p of dgPresentS(run)) dgEvTo('riftw',p.id,k.w);
    riftStageS(run,k.w-1); if(onWave) onWave(k.w); };
  if(!k.w){ if(run.t>=RIFT_COUNT_S) go(); }
  else if(k.w<RIFT_WAVES&&(k.dead>=k.size*RIFT_NEXT_PCT||run.t-k.start>=RIFT_WAVE_S)) go();
  const alive=riftPourS(run);
  return k.w>=RIFT_WAVES&&!k.q.length&&!alive?'won':'';
}
const riftWaveClockS=run=>{ const k=run.k; return !k.w?Math.max(0,Math.ceil(RIFT_COUNT_S-run.t)):k.w>=RIFT_WAVES?0:Math.max(0,Math.ceil(RIFT_WAVE_S-(run.t-k.start))); };
// the snapshot's numbers (shared/rift.js DG_HUD.rift): [stage, monsters, clock, x2, paid, tier, a, b]
function riftHudS(run,stage,clock,a,b){ const k=run.k, R=RIFT_DEFS[run.rift], gk=R&&R.reward==='essence'?'mats':'xp'; let got=0; for(const mb of run.members.values()) got=Math.max(got,mb.got[gk]);
  run.hud=[stage|0,riftAliveS(run)+k.q.length,Math.max(0,Math.ceil(clock||0)),run.x2?1:0,Math.round(got),run.rtier|0,Math.round(a||0),Math.round(b||0)]; }
// the breakers (Heartwood): walk to the objective and swing at it; true when it breaks
function riftBreakersS(run,ob,dt){
  const L=dgLocalS(run,ob.x,ob.z);
  for(const m of run.mons){ if(m.dgRole!=='breaker'||m.dead||m.remove) continue;
    const reach=m.T.rad+2.2, d=dgWalkS(run,m,L.x,L.z,dt,m.T.speed,reach);
    if(dgSwingS(m,dt,d<=reach+0.6)&&dgObjHurtS(run,ob,dgObjHitS(m))) return true; }
  return false;
}
// n platforms of the shape (local metres: {x, z, r}) for a mode's beacons, cores and pylons: the big ones (O) first, farthest from the hub first, then stepping stones; never the hub
function riftBigIslesS(run,n){ const st=run.B.start||{x:0,z:0}, far=c=>Math.hypot(c.x-st.x,c.z-st.z);
  return run.lay.isles.filter(c=>far(c)>8).sort((a,b)=>(b.r>=12)-(a.r>=12)||far(b)-far(a)).slice(0,n); }
// n guards round objective ob (wait there until you come near; twice the health); their deaths count down ob.v (Lanterns)
function riftGuardsS(run,ob,n,hpK){ const L=dgLocalS(run,ob.x,ob.z);
  for(let i=0;i<n;i++){ const a=i/n*TAU+Math.random()*0.5, m=riftSpawnS(run,riftPickS(run,3),L.x+Math.sin(a)*4,L.z+Math.cos(a)*4,false); if(!m) continue;
    m.dgHunt=false; m.riftGuard=ob.id; if(hpK&&hpK!==1) m.maxHp=m.hp=m.maxHp*hpK; } }
// an objective's health in hits of the rift's average monster at the run's level (its brittle damage)
const riftObjHpS=(run,hits)=>{ const R=RIFT_DEFS[run.rift], ds=R.kinds.map(c=>defAt(DEF_BY_ID[c.id],run.L).dmg*RIFT_DMG_K); return Math.max(1,Math.round(hits*ds.reduce((s,v)=>s+v,0)/Math.max(1,ds.length))); };
DG_KITS.rift={
  setup(run){ run.k={st:0,q:[],kills:0,ti:0}; const R=RIFT_DEFS[run.rift], M=RIFT_MODES[R.mode]||RIFT_MODES.waves;
    toastTo(null,R.mode==='waves'?'Glass is forming. Hold the platforms: '+RIFT_WAVES+' waves.':M.name+': '+M.how,''); riftModeOf(run).setup(run); },
  tick(run,dt){ if(run.endT) return; riftModeOf(run).tick(run,dt); },
  onKill(run,m){ run.k.kills++; const K=riftModeOf(run); if(K.onKill) K.onKill(run,m); },
  onUse(run,p,ob){ const K=riftModeOf(run); if(K.onUse) K.onUse(run,p,ob); },
  hud(run){ const K=riftModeOf(run); if(K.hud) K.hud(run); },
};
function riftMsgP(p,msg){
  const a=msg&&msg.a, R=riftDoorNear(p.x,p.z,RIFT_TALK+2);
  if(a==='open'){ if(R) riftInfoP(p,R); return; }
  if(a==='go'){ if(!R){ toastTo(p.id,'Stand at the rift\'s tear to go in.','bad'); return; } riftStartP(p,R,msg.x2===1||msg.x2===true,msg.lv|0); }
}
MSG.rift=riftMsgP;
