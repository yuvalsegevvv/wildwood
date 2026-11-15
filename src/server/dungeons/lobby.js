//@ Dungeon runs, the messages: the Delve board at a door (open), starting a run (checked against the door, the gate, the hourly offer and each member's level and tier), accepting / declining, leaving, reviving, using an objective; the testing tool's start
/* agent map
   message in: dg{a:'open'|'start'|'door'|'accept'|'decline'|'leave'|'revive'|'use', dungeon?, type?, tier?, via?, id?}   (MSG.dg)
     open                     within DG_ENT_TALK of a door: the board for that door's dungeon (message dgboard, below). dgrev D8c: with via:'circle' and dungeon:<theme> from a teleport circle (or travel from anywhere, dgViaP) the board of that dungeon without a door (reply has via:1)
     start {dungeon,type}     the leader (or a lone hiker) at that dungeon's door; type must be one of the two on offer this hour (else "the offer changed" and a fresh board). D8c: via:'circle' replaces the door test; the run's members come back to the circle's spot (run.back)
     door {dungeon,via:'circle'}  D8c: warp to that dungeon's door (the land gate must be open; the same rules as warp)
     accept / decline         answer a dgi prompt; accept also joins your party's run in progress when it can still be joined (the boss has not appeared, fewer than 4 in)
     leave                    back to the world (the entrance portal; also when downed or out); loot stays
     revive {id}              start the 3 s revive channel on a downed member (runs.js)
     use {id}                 use objective id (the kit's onUse); without an id, the boss kit's use in the hall (B.kit.use: Haugbui's lamps)
   message out: dgboard {via 0|1 (D8c: opened from a circle), th, name, door, offer:[two mission ids], pool:[the missions built], left (seconds until the offer changes), L (tier I's), tier (the highest open: the picker's start), top (tiers cleared), gate 0|1, ok 0|1, why, lead 0|1 (you may start)}
   exports: dgBoardP(p,msg), dgViaP(p), dgDoorP(p,msg), dgStartP(p,msg), dgAcceptP(p), dgDeclineP(p), dgLeaveP(p), dgUseP(p,id), dgDevP(p,v) (devP hook: dev{cmd:'dg',v:'<theme>:<mission>[:seed]'}), DG_TXT_SHARED
   users: server/api.js receive (through MSG), server/economy.js devP
   test: tools/dungeon-runs-smoke.js.   Design: docs/DUNGEONS.md sections 2, 8, 9; the offer and the doors: docs/DUNGEON-THEMES.md sections 2 and 6. */
const DG_TXT_SHARED='Dungeons need Solo mode or a server: a shared room cannot keep a run apart from the world.';   // the room's one 4 KB message for everyone (io.broadcastSnaps) cannot be split per run
// dgrev D8c: the circle path. A hiker on a teleport circle (the check warpP makes) or using travel-from-anywhere (warp{any:1}: not in a run, not on the Proving Isle, not on a cave floor, WARP_IDLE out of a fight) may open a
// dungeon's board and start its run without standing at the door. Returns {back} (where the run's members return: the circle's spot, as warpP puts a traveller, else where the hiker stands) or null (refused, with a toast).
function dgViaP(p,quiet){
  const from=CIRCLES.find(C=>Math.hypot(p.x-C.V.tele.x,p.z-C.V.tele.z)<C.V.tele.r+1.5);
  if(from){
    if(!from.open(p.gear)){ if(!quiet) toastTo(p.id,'The circle hums but will not wake.','bad'); return null; }
    const V=from.V, T=V.tele, a=Math.atan2(V.x-T.x,V.z-T.z); return {back:{x:T.x+Math.sin(a)*3.2,z:T.z+Math.cos(a)*3.2}};
  }
  if(p.inst||p.pv||caveFloorAt(p.x,p.z)>=0){ if(!quiet) toastTo(p.id,'You cannot travel from here','bad'); return null; }
  if(S.t-p.lastHit<WARP_IDLE){ if(!quiet) toastTo(p.id,'Wait '+WARP_IDLE+' seconds out of combat to travel','bad'); return null; }
  return {back:{x:p.x,z:p.z}};
}
function dgBoardP(p,msg){
  const via=msg&&msg.via==='circle'&&!p.dead&&!p.inst?dgViaP(p):null;
  const E=via?DG_ENTRANCES[msg.dungeon]:dgEntranceNear(p.x,p.z), T=E&&dgThemeOf(E.theme); if(!T||T.dev||!T.land||p.inst) return;
  if(msg&&msg.via==='circle'&&!via) return;
  if(via&&isGuestP(p)&&!guestLandOk(E.x,E.z)){ guestGateP(p,'travel'); return; }   // accounts: a guest stays in the first lands, from a circle too
  const tier=Math.min(DG_TIER_MAX,dgtTop(p.gear)), U=dgUnlocked(p.gear,p.level,T,0), now=Date.now(), pool=dgPoolS(), pa=partyOf(p);
  sendTo(p.id,{t:'dgboard',via:via?1:0,th:T.id,name:T.name,door:E.name,offer:dgOffer(T.id,now,pool),pool,left:dgOfferLeft(now),L:dgLevel(T,0),tier,top:dgtTop(p.gear),gate:dgGateOpen(p.gear,T)?1:0,ok:U.ok?1:0,why:U.why||'',lead:!pa||pa.lead===p.id?1:0});
}
function dgStartP(p,msg){
  if(io.broadcastSnaps){ toastTo(p.id,DG_TXT_SHARED,'bad'); return; }
  if(p.dead||p.inst) return;
  const T=dgThemeOf(msg.dungeon); if(!T||T.dev||!T.land) return;
  const pa=partyOf(p); if(pa&&pa.lead!==p.id){ toastTo(p.id,'Only the party leader can start a run.','bad'); return; }
  const via=msg.via==='circle'?dgViaP(p):null; if(msg.via==='circle'&&!via) return;   // dgrev D8c: from a circle (or anywhere) instead of at the door
  const E=via?DG_ENTRANCES[T.id]:dgEntranceNear(p.x,p.z); if(!E||E.theme!==T.id){ toastTo(p.id,'Stand at the door of '+T.name+' to go in.','bad'); return; }
  if(via&&isGuestP(p)&&!guestLandOk(E.x,E.z)){ guestGateP(p,'travel'); return; }
  if(!dgGateOpen(p.gear,T)){ toastTo(p.id,DG_LANDS[T.land].hint,'bad'); return; }
  const pool=dgPoolS(), offer=dgOffer(T.id,Date.now(),pool);
  if(!dgMissionOk(msg.type)||!offer.includes(msg.type)){ toastTo(p.id,'The offer changed: '+T.name+' offers '+offer.map(k=>DG_MISSIONS[k].name).join(' and ')+' now.','bad'); dgBoardP(p,via?{via:'circle',dungeon:T.id}:null); return; }
  const tier=dgtClamp(msg.tier), U=dgUnlocked(p.gear,p.level,T,tier); if(!U.ok){ toastTo(p.id,U.why,'bad'); return; }   // dgrev: the leader's picked tier, clamped 0-10; each party member is checked again in dgAskS
  dgLaunchS(p,T,msg.type,{tier,L:U.level,back:via?via.back:dgApron(E),dev:false});
}
// dgrev D8c: "Go to the door": the same rules as a warp from a circle / anywhere, the land gate open; you arrive on the door's apron facing it
function dgDoorP(p,msg){
  if(p.dead||p.inst||S.t-(p.warpT||-9)<2) return;
  const T=dgThemeOf(msg.dungeon), E=T&&DG_ENTRANCES[T.id]; if(!T||T.dev||!T.land||!E) return;
  if(!dgViaP(p)) return;
  if(!dgGateOpen(p.gear,T)){ toastTo(p.id,DG_LANDS[T.land].hint,'bad'); return; }
  const A=dgApron(E);
  if(isGuestP(p)&&!guestLandOk(A.x,A.z)){ guestGateP(p,'travel'); return; }
  p.warpT=S.t; ev('warp',p.id,r1(p.x),r1(p.z),r1(A.x),r1(A.z));
  p.x=A.x; p.z=A.z; p.y=getH(A.x,A.z); sendTo(p.id,{t:'tp',x:A.x,z:A.z,face:Math.atan2(-(E.x-A.x),-(E.z-A.z))});
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
function dgLeaveP(p){ const run=dgRunOf(p); if(run&&run.ab) return abLeaveP(run,p); /* abyss: out between rounds, a fall in a fight */ if(run&&run.rift) return riftLeaveP(run,p); if(run) dgExitS(run,p); else dgDeclineP(p); }   // rift: leaving ends the run
// use: an objective (by id), or, with no id, whatever the boss's kit lets you use in the hall (Haugbui's lamps: B.kit.use)
function dgUseP(p,id){
  const run=dgRunOf(p); if(!run||p.dead||!run.ready) return;
  const c0=S.ctx; S.ctx=run.id;
  const ob=id?run.objs.find(o=>o.id===id):null, kit=DG_KITS[run.mission], B=run.boss;
  if(run.endT&&!(run.phase==='won'&&ob&&ob.kind==='chest')){ S.ctx=c0; return; }   // after the end only a won run's chests can still be opened
  if(ob&&ob.kind==='pzstone'){ if(Math.hypot(ob.x-p.x,ob.z-p.z)<=ob.r+1.5) pzDgUseP(run,p,ob); }   // puzzles: a run's stone
  else if(ob){ if(Math.hypot(ob.x-p.x,ob.z-p.z)<=ob.r+1.5&&kit&&kit.onUse) kit.onUse(run,p,ob); }
  else if(!id&&B&&!B.m.dead&&B.kit.use) B.kit.use(B,B.m,p);
  S.ctx=c0;
}
MSG.dg=(p,msg)=>{
  const a=msg.a;
  if(a==='open') dgBoardP(p,msg);
  else if(a==='door') dgDoorP(p,msg);
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
  const tier=dgtClamp(parts[3]), seed=parts[2]!==undefined&&parts[2]!==''&&isFinite(+parts[2])?parseInt(parts[2],10):undefined;
  const run=dgLaunchS(p,T,mission,{tier,L:T.land?dgLevel(T,tier):DG_LV,back:{x:p.x,z:p.z},dev:true,seed});
  if(run) toastTo(p.id,'Testing run: '+(T.name||T.id)+', '+DG_MISSIONS[mission].name+', seed '+run.seed+', level '+run.L+'.','good');
}
