//@ Dungeon runs, the messages: the Delve board at a door (open), starting a run (checked against the door, the gate, the hourly offer and each member's level and tier), accepting / declining, leaving, reviving, using an objective; the testing tool's start
/* agent map
   message in: dg{a:'open'|'start'|'accept'|'decline'|'leave'|'revive'|'use', dungeon?, type?, id?}   (MSG.dg)
     open                     within DG_ENT_TALK of a door: the board for that door's dungeon (message dgboard, below)
     start {dungeon,type}     the leader (or a lone hiker) at that dungeon's door; type must be one of the two on offer this hour (else "the offer changed" and a fresh board)
     accept / decline         answer a dgi prompt; accept also joins your party's run in progress when it can still be joined (the boss has not appeared, fewer than 4 in)
     leave                    back to the world (the entrance portal; also when downed or out); loot stays
     revive {id}              start the 3 s revive channel on a downed member (runs.js)
     use {id}                 use objective id (the kit's onUse); without an id, the boss kit's use in the hall (B.kit.use: Haugbui's lamps)
   message out: dgboard {th, name, door, offer:[two mission ids], pool:[the missions built], left (seconds until the offer changes), L, tier, gate 0|1, ok 0|1, why, lead 0|1 (you may start)}
   exports: dgBoardP(p), dgStartP(p,msg), dgAcceptP(p), dgDeclineP(p), dgLeaveP(p), dgUseP(p,id), dgDevP(p,v) (devP hook: dev{cmd:'dg',v:'<theme>:<mission>[:seed]'}), DG_TXT_SHARED
   users: server/api.js receive (through MSG), server/economy.js devP
   test: tools/dungeon-runs-smoke.js.   Design: docs/DUNGEONS.md sections 2, 8, 9; the offer and the doors: docs/DUNGEON-THEMES.md sections 2 and 6. */
const DG_TXT_SHARED='Dungeons need Solo mode or a server: a shared room cannot keep a run apart from the world.';   // the room's one 4 KB message for everyone (io.broadcastSnaps) cannot be split per run
function dgBoardP(p){
  const E=dgEntranceNear(p.x,p.z), T=E&&dgThemeOf(E.theme); if(!T||p.inst) return;
  const tier=dgTierOf(p.gear,T.land), U=dgUnlocked(p.gear,p.level,T,tier), now=Date.now(), pool=dgPoolS(), pa=partyOf(p);
  sendTo(p.id,{t:'dgboard',th:T.id,name:T.name,door:E.name,offer:dgOffer(T.id,now,pool),pool,left:dgOfferLeft(now),L:dgLevel(T,tier),tier,gate:dgGateOpen(p.gear,T)?1:0,ok:U.ok?1:0,why:U.why||'',lead:!pa||pa.lead===p.id?1:0});
}
function dgStartP(p,msg){
  if(io.broadcastSnaps){ toastTo(p.id,DG_TXT_SHARED,'bad'); return; }
  if(p.dead||p.inst) return;
  const T=dgThemeOf(msg.dungeon); if(!T||T.dev||!T.land) return;
  const pa=partyOf(p); if(pa&&pa.lead!==p.id){ toastTo(p.id,'Only the party leader can start a run.','bad'); return; }
  const E=dgEntranceNear(p.x,p.z); if(!E||E.theme!==T.id){ toastTo(p.id,'Stand at the door of '+T.name+' to go in.','bad'); return; }
  if(!dgGateOpen(p.gear,T)){ toastTo(p.id,DG_LANDS[T.land].hint,'bad'); return; }
  const pool=dgPoolS(), offer=dgOffer(T.id,Date.now(),pool);
  if(!dgMissionOk(msg.type)||!offer.includes(msg.type)){ toastTo(p.id,'The offer changed: '+T.name+' offers '+offer.map(k=>DG_MISSIONS[k].name).join(' and ')+' now.','bad'); dgBoardP(p); return; }
  const tier=dgTierOf(p.gear,T.land), U=dgUnlocked(p.gear,p.level,T,tier); if(!U.ok){ toastTo(p.id,U.why,'bad'); return; }
  dgLaunchS(p,T,msg.type,{tier,L:U.level,back:dgApron(E),dev:false});
}
// the run p was prompted to (and may still answer), or else the party's run in progress
function dgAcceptP(p){
  if(p.inst||p.dead) return;
  let run=null; for(const r of DG_RUNS.values()) if((r.inv.get(p.id)||0)>=S.t&&!r.endT){ run=r; break; }
  if(!run&&p.party) for(const r of DG_RUNS.values()) if(r.party===p.party&&!r.endT){ run=r; break; }
  if(!run){ toastTo(p.id,'There is no run for you to join.','bad'); return; }
  if(run.boss||run.endT){ toastTo(p.id,'The boss has appeared: that run can no longer be joined.','bad'); return; }
  if(dgPresentS(run).length>=DG_MAX_PARTY){ toastTo(p.id,'That run is full.','bad'); return; }
  if(!run.dev&&run.theme.land){ const U=dgUnlocked(p.gear,p.level,run.theme,run.tier); if(!U.ok){ toastTo(p.id,U.why,'bad'); run.inv.delete(p.id); return; } }
  dgEnterS(run,p);
  if(!run.ready&&!run.inv.size) dgSetupS(run);
}
function dgDeclineP(p){
  for(const run of DG_RUNS.values()) if(run.inv.has(p.id)){
    run.inv.delete(p.id); toastTo(run.lead,p.name+' stays behind.','');
    if(!run.ready&&!run.inv.size) dgSetupS(run);
  }
}
function dgLeaveP(p){ const run=dgRunOf(p); if(run) dgExitS(run,p); else dgDeclineP(p); }
// use: an objective (by id), or, with no id, whatever the boss's kit lets you use in the hall (Haugbui's lamps: B.kit.use)
function dgUseP(p,id){
  const run=dgRunOf(p); if(!run||p.dead||!run.ready||run.endT) return;
  const c0=S.ctx; S.ctx=run.id;
  const ob=id?run.objs.find(o=>o.id===id):null, kit=DG_KITS[run.mission], B=run.boss;
  if(ob){ if(Math.hypot(ob.x-p.x,ob.z-p.z)<=ob.r+1.5&&kit&&kit.onUse) kit.onUse(run,p,ob); }
  else if(!id&&B&&!B.m.dead&&B.kit.use) B.kit.use(B,B.m,p);
  S.ctx=c0;
}
MSG.dg=(p,msg)=>{
  const a=msg.a;
  if(a==='open') dgBoardP(p);
  else if(a==='start') dgStartP(p,msg);
  else if(a==='accept') dgAcceptP(p);
  else if(a==='decline') dgDeclineP(p);
  else if(a==='leave') dgLeaveP(p);
  else if(a==='revive') dgReviveP(p,msg.id);
  else if(a==='use') dgUseP(p,msg.id);
};
// the testing tool (devP: S.dev only): a run for you (and your party, prompted as usual) without a door, a gate or the offer; you come back where you stood
function dgDevP(p,v){
  if(io.broadcastSnaps){ toastTo(p.id,DG_TXT_SHARED,'bad'); return; }
  if(p.inst){ toastTo(p.id,'You are in a run already: leave it first.','bad'); return; }
  if(p.dead) return;
  const parts=String(v||'').split(':'), T=dgThemeOf(parts[0]), mission=parts[1];
  if(!T||!dgMissionOk(mission)){ toastTo(p.id,'dg needs <theme>:<mission>[:seed], e.g. bare:purge or hollowroots:purge:7 (themes: '+Object.keys(DG_THEMES).join(', ')+').','bad'); return; }
  if(!DG_KITS[mission]){ toastTo(p.id,DG_MISSIONS[mission].name+' has no mission kit yet (built: '+dgPoolS().join(', ')+').','bad'); return; }
  const pa=partyOf(p); if(pa&&pa.lead!==p.id){ toastTo(p.id,'Only the party leader can start a run.','bad'); return; }
  const tier=T.land?Math.max(dgTierOf(p.gear,T.land),DG_LANDS[T.land].base):0, seed=parts[2]!==undefined&&parts[2]!==''&&isFinite(+parts[2])?parseInt(parts[2],10):undefined;
  const run=dgLaunchS(p,T,mission,{tier,L:T.land?dgLevel(T,tier):DG_LV,back:{x:p.x,z:p.z},dev:true,seed});
  if(run) toastTo(p.id,'Testing run: '+(T.name||T.id)+', '+DG_MISSIONS[mission].name+', seed '+run.seed+', level '+run.L+'.','good');
}
