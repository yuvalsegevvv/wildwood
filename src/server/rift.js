//@ Rifts on the server: the energy (gear.rift, refilled by the clock), the tear's window, a solo run in a rift slot of the dungeon instance layer, the waves of glass monsters, XP only (x3, x2 with the Double), the clear bonus, one respawn, leaving
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
  if(!s){ out.rift={e:RIFT_E_MAX,at:now,best:0,clears:0}; return; }   // a new save (or one from before rifts): full
  const at=isFinite(s.at)&&s.at>0?Math.min(now,+s.at):now;
  out.rift={e:isFinite(s.e)?Math.round(clamp(+s.e,0,RIFT_E_MAX)*1000)/1000:RIFT_E_MAX,at,best:clampInt(s.best,0,999999,0),clears:clampInt(s.clears,0,999999,0)};
}
const riftSaveOf=p=>p.gear.rift||(p.gear.rift={e:RIFT_E_MAX,at:Date.now(),best:0,clears:0});
const riftEnergyP=p=>riftEnergyAt(riftSaveOf(p),Date.now());
// bring the save up to date and add v (negative to spend); the refill keeps counting from now
function riftEnergyAddP(p,v){ const g=riftSaveOf(p), now=Date.now(); g.e=Math.round(clamp(riftEnergyAt(g,now)+v,0,RIFT_E_MAX)*1000)/1000; g.at=now; p.dirty=true; }
function riftInfoP(p,R){
  const g=riftSaveOf(p), now=Date.now();
  sendTo(p.id,{t:'rift',a:'info',id:R.id,e:Math.floor(riftEnergyAt(g,now)*10)/10,full:riftFullIn(g,now),L:Math.max(RIFT_LV,p.level|0),best:g.best|0,clears:g.clears|0,lv:RIFT_LV,cost:RIFT_E_DOUBLE});
}
const RIFT_TXT_SHARED='Rifts need Solo mode or a server: a shared room cannot keep a run apart from the world.';
function riftStartP(p,R,x2){
  if(io.broadcastSnaps){ toastTo(p.id,RIFT_TXT_SHARED,'bad'); return; }
  if(p.dead||p.inst||p.pv) return;
  if((p.level|0)<RIFT_LV){ toastTo(p.id,'The rift will not let you in: it is for hikers of level '+RIFT_LV+' and up.','bad'); return; }
  if(x2&&riftEnergyP(p)<RIFT_E_DOUBLE){ toastTo(p.id,'A doubled run needs '+RIFT_E_DOUBLE+' energy.','bad'); return; }
  const run=riftRunNewS(p,R,x2); if(!run){ toastTo(p.id,'Every rift is busy right now. Try again in a minute.','bad'); return; }
  if(x2) riftEnergyAddP(p,-RIFT_E_DOUBLE);
  dgEnterS(run,p); dgSetupS(run);
}
// a run object of the dungeons' shape (server/dungeons/instances.js dgNewRunS) in the first free rift slot, its layout riftLayout, one member, no party
function riftRunNewS(p,R,x2){
  let slot=-1; for(let i=RIFT_SLOT0;i<DG_MAX_INST;i++) if(!DG_SLOT_RUN[i]){ slot=i; break; }
  if(slot<0) return null;
  const L=riftLayout(R), B=dgBake(L); B.open=true;
  const O=dgSlotOrigin(slot), run={id:dgNextRun++,slot,ox:O.x,oz:O.z,theme:R,th:R.id,mission:'rift',seed:0,L:Math.max(RIFT_LV,p.level|0),tier:0,B,
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
   xp: x3 a same-level world kill with every XP bonus the world counts (rewardKill's list), x2 when doubled; the clear is 75 same-level world kills' worth; no coins, items, materials or board hunts */
const riftXpBonus=q=>1+psP(q,'xp')+pendP(q,'xp')+rlP(q,'exp')+potBuffP(q,'scholar');
const RIFT_PAY={
  xp:{
    kill(run,m,q,mb){ const K=m.dgK||dgKOf(m.def,run.L), xp=m.T.xp*K.xp*RIFT_XP_K*(run.x2?2:1)*riftXpBonus(q); gainExpP(q,xp,m.id); if(mb) mb.got.xp+=xp; },
    clear(run,p,mb){ const xp=xpFor(run.L)*RIFT_BONUS_KILLS*(run.x2?2:1)*riftXpBonus(p); gainExpP(p,xp,null); if(mb) mb.got.xp+=xp; },
  },
};
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
  for(const p of dgPresentS(run)){
    const mb=dgMemberOf(run,p), g=riftSaveOf(p);
    if(p.dead){ p.dead=false; p.deadT=0; p.hp=p.maxHp; p.lastHit=S.t; ev('up',p.id); }
    riftPayOf(run).clear(run,p,mb);   // the clear bonus (xp: 75 same-level world kills' worth)
    g.clears=Math.min(999999,(g.clears|0)+1); if(!g.best||secs<g.best) g.best=secs; p.dirty=true;
    dgEndEvS(run,p,1,'');
  }
  toastTo(null,'The rift collapses! Cleared in '+dgClock(secs)+'. Back at the tear in '+DG_END_S+' s.','good');
}
// THE WAVE KIT. run.k = {w (the wave now, 0 = the count-down), start (run.t the wave began), size, dead (of this wave), q (spawns waiting: [def id, herald, not before run.t]), kills, ti (the next tear)}
DG_KITS.rift={
  setup(run){ run.k={w:0,start:0,size:0,dead:0,q:[],kills:0,ti:0}; toastTo(null,'Glass is forming. Hold the platforms: '+RIFT_WAVES+' waves.',''); DG_KITS.rift.hud(run); },
  wave(run){
    const k=run.k, R=RIFT_DEFS[run.rift]; k.w++; k.start=run.t; k.size=riftWaveSize(k.w); k.dead=0;
    const kinds=R.kinds.filter(c=>c.from<=k.w), tw=kinds.reduce((s,c)=>s+c.w,0), herald=k.w%5===0;
    for(let i=0;i<k.size;i++){ let r=Math.random()*tw, pick=kinds[0]; for(const c of kinds){ r-=c.w; if(r<=0){ pick=c; break; } } k.q.push([pick.id,false,run.t+RIFT_RELEASE_S*i/k.size,k.w]); }
    if(herald) k.q.push([R.herald,true,run.t+RIFT_RELEASE_S*0.5,k.w]);
    if(herald){ k.size++; k.q.sort((a,b)=>a[2]-b[2]); }   // (the Herald comes halfway through the wave's release)
    for(const p of dgPresentS(run)) dgEvTo('riftw',p.id,k.w);
  },
  tick(run,dt){
    const k=run.k, V=DG_KITS.rift;
    if(!k.w){ if(run.t>=RIFT_COUNT_S) V.wave(run); }
    else if(k.w<RIFT_WAVES&&(k.dead>=k.size*RIFT_NEXT_PCT||run.t-k.start>=RIFT_WAVE_S)) V.wave(run);
    const S0=run.B.marks.S; let alive=0; for(const m of run.mons) if(!m.dead&&!m.remove) alive++;
    while(k.q.length&&k.q[0][2]<=run.t&&alive<RIFT_ALIVE_MAX&&S0.length){
      const [id,herald,,w]=k.q.shift(), s=S0[(k.ti++)%S0.length], a=Math.random()*TAU, r=Math.random()*2.5;
      const m=riftSpawnS(run,id,s.x+Math.sin(a)*r,s.z+Math.cos(a)*r,herald); if(m){ m.riftW=w; alive++; }
    }
    if(k.w>=RIFT_WAVES&&!k.q.length&&!alive){ riftWonS(run); return; }
    V.hud(run);
  },
  onKill(run,m){ const k=run.k; k.kills++; if(m.riftW===k.w) k.dead++; },
  hud(run){ const k=run.k; let alive=0; for(const m of run.mons) if(!m.dead&&!m.remove) alive++;
    const next=!k.w?Math.max(0,Math.ceil(RIFT_COUNT_S-run.t)):k.w>=RIFT_WAVES?0:Math.max(0,Math.ceil(RIFT_WAVE_S-(run.t-k.start)));
    let xp=0; for(const mb of run.members.values()) xp=Math.max(xp,mb.got.xp);
    run.hud=[k.w,alive+k.q.length,next,run.x2?1:0,Math.round(xp)]; }
};
function riftMsgP(p,msg){
  const a=msg&&msg.a, R=riftDoorNear(p.x,p.z,RIFT_TALK+2);
  if(a==='open'){ if(R) riftInfoP(p,R); return; }
  if(a==='go'){ if(!R){ toastTo(p.id,'Stand at the rift\'s tear to go in.','bad'); return; } riftStartP(p,R,msg.x2===1||msg.x2===true); }
}
MSG.rift=riftMsgP;
