//@ Dungeon runs, the lifecycle: launching a run, the start prompt and joining in progress, the per-tick update (members, downs, respawns, the kit, the monsters), revives, won / lost and the results, closing, places held for 5 minutes, the save (gear.dg)
/* agent map
   exports: updateInstsS(dt) (the tick hook), dgLaunchS(p,T,mission,o) -> run, dgAskS(run,q,kind), dgJoinableS(run), dgSetupS(run), dgWinS(run), dgLoseS(run,why), dgCloseS(run),
            dgGoneP(p) (api.js leave), dgDownTickS(p,dt) (updatePlayersS hook), dgReviveP(p,id), dgReviveCastS(p,c) (updateCastsS hook), dgSanitizeSave(g) (sanitizeGear hook),
            dgSaveOf(p), dgThemeOf(id), dgMissionOk(id), DG_ACCEPT_S, DG_DOWN_S, DG_REVIVE_S, DG_REVIVE_R, DG_REVIVE_HP, DG_HOLD_S, DG_EMPTY_S, DG_END_S
   users: lobby.js (messages, the testing tool), the hooks listed in docs/DUNGEONS.md section 7
   uses: party.js (a run's party), the rewards (dgClearReward: shared/dungeon-rewards.js, dgGrantItemP: server/dungeon-gear.js) for the clear's piece, clearBossFxS (server/boss-fx.js)
   test: tools/dungeon-runs-smoke.js.   Design: docs/DUNGEONS.md sections 2 (how a run goes), 5 (down and revive, joining), 8 (the save).
   Lifecycle: launch (the leader is in at once) -> the other party members are prompted (dgi) and have DG_ACCEPT_S to accept -> when all answered or the time is up the
   kit's setup runs (so its monsters get the right head count) -> objectives -> the boss -> won (dge to each member, the clear saved) or lost -> DG_END_S later everyone
   is put back where they came from and the slot is freed. A run nobody is in closes after DG_EMPTY_S; a disconnected member's place is held DG_HOLD_S by account and he
   is put back at the entrance when he comes back online. A server restart ends every run (they live in memory); loot was banked as it dropped. */
const DG_ACCEPT_S=15, DG_DOWN_S=30, DG_REVIVE_S=3, DG_REVIVE_R=2.5, DG_REVIVE_HP=0.35, DG_HOLD_S=300, DG_EMPTY_S=60, DG_END_S=20, DG_SAVE_MAX=999999;
let dgSecT=0;
const dgThemeOf=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(DG_THEMES,id)?DG_THEMES[id]:null;
const dgMissionOk=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(DG_MISSIONS,id);
// a new run with p in it at once; the rest of p's party is prompted. o: {tier, L, seed, dev, back}
function dgLaunchS(p,T,mission,o){
  const run=dgNewRunS(T,mission,o); if(!run){ toastTo(p.id,'Every dungeon is busy right now. Try again in a minute.','bad'); return null; }
  run.lead=p.id; const pa=partyOf(p); run.party=pa?pa.id:0;
  dgEnterS(run,p);
  if(pa) for(const q of partyMembersS(pa)) if(q!==p) dgAskS(run,q,0);
  if(!run.inv.size) dgSetupS(run);
  return run;
}
// prompt q to come (kind 0: the run is starting, 1: it is under way): dgi [pid, run id, kind, theme id, mission id, level, seconds to answer, the leader's name]
function dgAskS(run,q,kind){
  run.asked.add(q.id);
  if(q.inst) return false;
  if(!run.dev&&run.theme.land){ const U=dgUnlocked(q.gear,q.level,run.theme,run.tier); if(!U.ok){ toastTo(q.id,'Your party went into '+run.theme.name+', but you cannot follow: '+U.why,'bad'); return false; } }
  run.inv.set(q.id,S.t+DG_ACCEPT_S);
  const lead=S.players.get(run.lead);
  dgEvTo('dgi',q.id,run.id,kind,run.th,run.mission,run.L,DG_ACCEPT_S,lead?lead.name:'');
  return true;
}
const dgJoinableS=run=>!run.endT&&!run.boss&&run.phase==='objectives'&&dgPresentS(run).length<DG_MAX_PARTY;
function dgSetupS(run){
  if(run.ready||run.endT) return; run.ready=true; run.t=0;
  const kit=DG_KITS[run.mission], c0=S.ctx; S.ctx=run.id; if(kit) kit.setup(run); S.ctx=c0;
}
function updateInstsS(dt){
  dgSecT-=dt; const sec=dgSecT<=0; if(sec) dgSecT=1;
  for(const run of [...DG_RUNS.values()]){ S.ctx=run.id; dgRunTickS(run,dt,sec); }
  S.ctx=0;
}
function dgRunTickS(run,dt,sec){
  if(sec) dgMembersCheckS(run);
  dgFxTickS(run,dt);   // dungeons: the kits' channels, guardians and the theme's hazards (fx.js, hazards.js); after the end it takes the hazards' warnings back
  if(run.endT){ if(S.t-run.endT>=DG_END_S) dgCloseS(run); return; }
  const present=dgPresentS(run);
  if(!present.length){ run.emptyT+=dt; if(run.emptyT>=DG_EMPTY_S) dgCloseS(run); return; }
  run.emptyT=0;
  if(!run.ready){
    for(const [id,until] of [...run.inv]) if(until<S.t){ run.inv.delete(id); const q=S.players.get(id); toastTo(run.lead,(q?q.name:'A member')+' did not answer: the run starts without them.',''); }
    if(!run.inv.size) dgSetupS(run);
    return;
  }
  run.t+=dt;
  const kit=DG_KITS[run.mission];
  for(const p of present){
    const mb=dgMemberOf(run,p); if(!mb) continue;
    if(p.dead&&!mb.down){ mb.down=true; dgEv(run,'toast',null,p.name+' is down!','bad'); if(present.length===1) toastTo(p.id,'You are down: you wake at the entrance in '+DG_DOWN_S+' s.',''); if(kit&&kit.onDown) kit.onDown(run,p); }
    else if(!p.dead) mb.down=false;
  }
  if(dgWipedS(run,present)){ dgLoseS(run,present.length>1?'the whole party went down.':'you are out of respawns.'); return; }
  if(kit&&kit.tick) kit.tick(run,dt);
  if(run.endT) return;
  for(const m of [...run.mons]){ if(m.remove){ run.mons.delete(m); continue; } dgMonTickS(run,m,dt); if(run.endT) return; }
  if(sec) for(const [c,f] of run.flow) if(S.t-f.used>5) run.flow.delete(c);
}
// lost: nobody standing and nobody can come back (a party all down at once: nobody is left to revive; a lone hiker: out of respawns)
function dgWipedS(run,present){
  if(present.some(p=>!p.dead)) return false;
  if(present.length>1) return true;
  const mb=dgMemberOf(run,present[0]); return !!(mb&&mb.out);
}
function dgFindKeyS(key){
  if(key.startsWith('pid:')){ for(const q of S.players.values()) if('pid:'+q.id===key) return q; return null; }
  const pid=ACCT.get(key); return pid===undefined?null:S.players.get(pid)||null;
}
function dgGoneMbS(run,mb){ const pid=mb.pid; mb.gone=S.t; mb.p=null; mb.down=false; run.inv.delete(pid); for(const m of run.mons) if(m.tgt===pid){ m.tgt=null; m.pendingHit=-1; } }
// once a second: who went offline, who came back (put back at the entrance), whose held place ran out, who was moved out some other way, join prompts for the party
function dgMembersCheckS(run){
  for(const [key,mb] of [...run.members]){
    if(mb.p&&!mb.left&&!mb.gone){
      const p=mb.p;
      if(S.players.get(mb.pid)!==p){ dgGoneMbS(run,mb); continue; }
      if(p.inst!==run.id||!dgInSlots(p.x)){ mb.left=true; mb.p=null; if(p.inst===run.id) p.inst=0; }   // put back in the world another way (a testing tool's teleport)
    } else if(mb.gone){
      if(S.t-mb.gone>DG_HOLD_S){ run.members.delete(key); continue; }
      const q=dgFindKeyS(key);
      if(q&&!q.inst&&!q.dead&&!run.endT){ dgEnterS(run,q); toastTo(q.id,'Back in '+(run.theme.name||'the dungeon')+': your place was kept.','good'); }
    }
  }
  if(run.party&&run.ready&&dgJoinableS(run)){ const pa=PARTIES.get(run.party); if(pa) for(const q of partyMembersS(pa)) if(!run.asked.has(q.id)&&!q.inst) dgAskS(run,q,1); }
  if(run.ready) for(const [id,until] of [...run.inv]) if(until<S.t) run.inv.delete(id);
}
// a disconnect (api.js leave): the place is held, prompts to him are void
function dgGoneP(p){ const run=dgRunOf(p); if(run){ const mb=dgMemberOf(run,p); if(mb) dgGoneMbS(run,mb); } for(const r of DG_RUNS.values()) r.inv.delete(p.id); }
// downed in a run (the updatePlayersS hook, instead of the world's wake in a village after 3 s): DG_DOWN_S to be revived, then a respawn at the entrance, or out
function dgDownTickS(p,dt){
  const run=dgRunOf(p); if(!run){ p.inst=0; return; }
  const mb=dgMemberOf(run,p); if(!mb||mb.out||run.endT) return;
  p.deadT+=dt; if(p.deadT<DG_DOWN_S) return;
  if(mb.respawns>0){ mb.respawns--; dgRespawnS(run,p); toastTo(p.id,'You wake at the entrance ('+(mb.respawns?mb.respawns+(mb.respawns>1?' respawns':' respawn')+' left':'no respawns left')+').',''); }
  else { mb.out=true; toastTo(p.id,'You are out of this run (no respawns left). Wait for the others, or leave through the portal.','bad'); dgEv(run,'toast',null,p.name+' is out of the run.','bad'); }
}
function dgRespawnS(run,p){
  const sp=dgSpotS(run,0), mb=dgMemberOf(run,p);
  p.dead=false; p.deadT=0; p.hp=p.maxHp; p.lastHit=-99; p.x=run.ox+sp.x; p.z=run.oz+sp.z; p.y=DG_FLOOR_Y; p.dgX=p.x; p.dgZ=p.z; if(mb) mb.down=false;
  sendTo(p.id,{t:'tp',x:p.x,z:p.z,face:sp.face}); ev('up',p.id); p.dirty=true;
}
/* revive: dg{a:'revive',id} from a living member within DG_REVIVE_R of a downed one starts a DG_REVIVE_S channel on the professions' cast bar (p.cast with rev: the
   target; events cast [pid, -1, seconds, target pid], castx [pid] when it breaks: walking 1.5 m off or being downed, as a gather). It ends in dgReviveCastS
   (called by updateCastsS): the target stands up at DG_REVIVE_HP of his health; events up [target], dgr [reviver, target] to the run. */
function dgReviveP(p,id){
  const run=dgRunOf(p); if(!run||p.dead||p.cast||run.endT) return;
  const q=S.players.get(id); if(!q||q===p||q.inst!==run.id||!q.dead) return;
  const mb=dgMemberOf(run,q); if(!mb||mb.out){ toastTo(p.id,q.name+' is out of this run: nobody can bring them back.','bad'); return; }
  if(Math.hypot(q.x-p.x,q.z-p.z)>DG_REVIVE_R){ toastTo(p.id,'Get closer to '+q.name+' to revive them.','bad'); return; }
  p.cast={i:-1,rev:q.id,end:S.t+DG_REVIVE_S,x:p.x,z:p.z}; ev('cast',p.id,-1,DG_REVIVE_S,q.id);
}
function dgReviveCastS(p,c){
  if(S.t<c.end) return;
  const c0=S.ctx; S.ctx=p.inst|0; p.cast=null;
  const run=dgRunOf(p), q=S.players.get(c.rev), mb=run&&q?dgMemberOf(run,q):null;
  if(!run||!q||q.inst!==run.id||!q.dead||!mb||mb.out||run.endT||Math.hypot(q.x-p.x,q.z-p.z)>DG_REVIVE_R+1) ev('castx',p.id);
  else { q.dead=false; q.deadT=0; q.hp=Math.max(1,Math.round(q.maxHp*DG_REVIVE_HP)); q.lastHit=S.t; q.dirty=true; mb.down=false; ev('up',q.id); ev('dgr',p.id,q.id); toastTo(q.id,p.name+' got you back on your feet.','good'); }
  S.ctx=c0;
}
// won (the boss fell): the rest of the place goes quiet, the downed stand up, each member's clear and best time are saved, the clear's piece is handed out, dge tells each what they got
function dgWinS(run){
  if(run.endT) return; run.phase='won'; run.endT=S.t;
  const c0=S.ctx; S.ctx=run.id;
  for(const m of [...run.mons]) if(!(run.boss&&m===run.boss.m)) dgRemoveS(run,m);
  const key=run.th+':'+run.mission, secs=Math.max(1,Math.round(run.t)), saved=dgSaveKeyOk(key);
  const prize=dgClearReward(run.th);   // the clear's own reward (docs/DUNGEON-THEMES.md section 7): one level-30 piece rolled once, handed to every member present (null for the test set)
  for(const p of dgPresentS(run)){
    const mb=dgMemberOf(run,p);
    if(p.dead){ p.dead=false; p.deadT=0; p.hp=Math.max(1,Math.round(p.maxHp*DG_REVIVE_HP)); p.lastHit=S.t; ev('up',p.id); }
    if(saved){ const g=dgSaveOf(p); g.clear[key]=Math.min(DG_SAVE_MAX,(g.clear[key]|0)+1); if(!g.best[key]||secs<g.best[key]) g.best[key]=secs; p.dirty=true; }
    if(prize&&dgGrantItemP(p,prize)&&mb) mb.got.items.push(prize);   // (a full bag loses it: dgGrantItemP says so)
    dgEndEvS(run,p,1,'');
  }
  toastTo(null,(run.theme.name||'The dungeon')+' cleared in '+dgClock(secs)+'! Back at the door in '+DG_END_S+' s.','good');
  S.ctx=c0;
}
function dgLoseS(run,why){
  if(run.endT) return; run.phase='lost'; run.endT=S.t;
  const c0=S.ctx; S.ctx=run.id;
  if(run.boss&&!run.boss.m.dead) clearBossFxS(run.boss);
  for(const m of [...run.mons]) dgRemoveS(run,m);
  for(const p of dgPresentS(run)) dgEndEvS(run,p,0,why||'');
  toastTo(null,'The run is lost'+(why?': '+why:'.')+' Back at the door in '+DG_END_S+' s.','bad');
  S.ctx=c0;
}
// dge [pid, 1 won | 0 lost, seconds, xp, coins, [item ids, the last 40], materials, why]: what this member got in the run (banked as it dropped)
function dgEndEvS(run,p,won,why){ const mb=dgMemberOf(run,p), g=mb?mb.got:{xp:0,coins:0,items:[],mats:0}; dgEvTo('dge',p.id,won,Math.max(0,Math.round(run.t)),Math.round(g.xp),g.coins,g.items.slice(-40),g.mats,why); }
// the end: everyone present goes back, every monster goes, the slot is free
function dgCloseS(run){
  const c0=S.ctx; S.ctx=run.id;
  for(const p of dgPresentS(run)) dgExitS(run,p);
  if(run.boss) clearBossFxS(run.boss);
  for(const m of [...run.mons]) dgRemoveS(run,m);
  if(DG_SLOT_RUN[run.slot]===run.id) DG_SLOT_RUN[run.slot]=0;
  DG_RUNS.delete(run.id);
  S.ctx=c0;
}
const dgClock=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
/* the save: gear.dg = {clear: {'<theme>:<mission>': times cleared}, best: {'<theme>:<mission>': the fastest clear in seconds}}; unknown keys dropped, counts clamped,
   an old save gets {} of each (sanitizeGear). A brand-new player's gear may not have it until the first clear (dgSaveOf makes it). */
const dgSaveKeyOk=k=>{ const s=String(k), i=s.indexOf(':'), T=i>0?dgThemeOf(s.slice(0,i)):null; return !!T&&!T.dev&&dgMissionOk(s.slice(i+1)); };
function dgSanCounts(s,lo){ const out={}; if(s&&typeof s==='object') for(const k of Object.keys(s)) if(dgSaveKeyOk(k)){ const n=clampInt(s[k],lo,DG_SAVE_MAX,0); if(n) out[k]=n; } return out; }
function dgSanitizeSave(g){ return g&&typeof g==='object'?{clear:dgSanCounts(g.clear,0),best:dgSanCounts(g.best,1)}:{clear:{},best:{}}; }
const dgSaveOf=p=>p.gear.dg||(p.gear.dg={clear:{},best:{}});
