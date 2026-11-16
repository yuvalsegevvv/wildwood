//@ The Abyss's run (B2, kinds B8): a round is a fresh run object in an Abyss slot: a Fight / Elite (three waves through the void's tears), a Trial (a rift mode on its platforms), an Event or a Shrine (no fight); go, next, out, death, leaving; no world rewards
/* agent map (docs/ABYSS.md; numbers: shared/abyss.js)
   exports: abRunOf(p), abRunNewS(p,d,r,dropRun,tileId,kind,mode,bossId), abStartRoundS(p,run), abGoP(p,d), abNextP(p), abOutP(p), abSpawnS(run,defId,lx,lz), abWaveStepS(run), abRoundWonS(run), abDownTickS(run,p,dt) (dgDownTickS hook),
            abLeaveP(run,p) (dgLeaveP hook), abCloseS(run) (dgCloseS hook), abDevP(p,msg) (devP 'abyss'), DG_KITS.abyss
   artifacts: abyss/arts.js (offers after a won round: abOfferP; the bar travels in gear.ab.run).
   hooks marked `// abyss:` (docs/ABYSS.md section 3): dungeons/runs.js dgSetupS, dgDownTickS, dgCloseS; dungeons/lobby.js dgLeaveP; dungeons/mobs.js rewardAllS; economy.js devP; game/dungeon/run.js (the client's layout)
   save: gear.ab.run = {d, r, at (ms)} while a run is on (cleared at its end; a saved run with no live instance is cleaned up by the next abyss message, never resumed)
   events: abr [pid, round, of, lv] when a round starts, abw [pid, round] when a (not the last) round is won, plus the dungeons' tp (dg {m:'abyss', th:AB_THEME, seed}), spawn, dge at the end; the snapshot's dg tuple: run.hud (shared/abyss.js DG_HUD.abyss)
   B9: run.abKind 'boss' (abyss/boss.js: run.abBoss = the boss's id, run.abTile 'boss:<land tile>', run.B.boss = the disc's circle)
   B8: run.abKind ('fight' | 'elite' | 'trial' | 'event' | 'shrine'), run.abMode (a Trial's mode), run.rdef (a Trial's rift def: the mode's rift with the tile's kinds and reward 'abyss', read by riftDefOf), run.abTile = the string the client rebuilds the layout from
   ('' plain platforms, a tile id, 'rift:<id>'), run.tile = the tile row whose kinds the monsters are; the Trial's kit and hooks: abyss/trial.js, the Event / Shrine: abyss/events.js.
   test: tools/abyss-smoke.js.   A run: run.ab=true, run.mission='abyss', run.abD (difficulty index), run.abR (round), run.L = abRoundLv, run.back = where the hiker entered; run.abWon between rounds (the hiker waits in it for next / out). */
const AB_ELITE_K=0.5, AB_ELITE_SHARE=0.5, AB_ELITE_HP=2, AB_CHAMP_HP=4, AB_ELITE_S=1.15, AB_CHAMP_S=1.5;   // an Elite round: half the monsters of a Fight, half of them elites (x2 health), a champion (x4, scale 1.5) in wave 2 and a second in wave 3 half of the time
const AB_TXT_SHARED='The Abyss needs Solo mode or a server: a shared room cannot keep a run apart from the world.';
const abRunOf=p=>{ const r=dgRunOf(p); return r&&r.ab?r:null; };
const abSaveOf=p=>p.gear.ab||(p.gear.ab={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,prism:0,sh:{d:0,n:{}},run:null});
// a run left over in the save (a restart, a pulled plug that closed the run) with no live instance ends cleanly: nothing is resumed in B2
function abStaleP(p){ const g=abSaveOf(p); if(g.run&&!abRunOf(p)){ g.run=null; p.dirty=true; } }
// a run object of the dungeons' shape in the first free Abyss slot (dropRun: a run of this hiker's whose slot counts as free), the layout abLayout, one member, no party
function abRunNewS(p,d,r,dropRun,tileId,kind,mode,bossId){
  let slot=-1; for(let i=AB_SLOT0;i<DG_MAX_INST;i++) if(!DG_SLOT_RUN[i]||(dropRun&&DG_SLOT_RUN[i]===dropRun.id)){ slot=i; break; }
  if(slot<0) return null;
  kind=abIsKind(kind)&&AB_KIND_W[kind]>0?kind:'fight'; if(kind==='boss'){ if(!abBossOk(bossId)) bossId=abBossDrawS(); if(!bossId) kind='fight'; }   // B9: a boss card names its boss; a bad name is a random one of the whitelist
  const boss=kind==='boss', enc=abIsEncKind(kind), trial=kind==='trial'&&AB_TRIAL_MODES[mode]&&RIFT_DEFS[AB_TRIAL_MODES[mode]]?RIFT_DEFS[AB_TRIAL_MODES[mode]]:null; if(kind==='trial'&&!trial) kind='fight';
  const T=trial||RIFT_DEFS[AB_THEME], TL=enc?null:abTileOf(boss?AB_BOSS_LAND[bossId]:tileId), tl=trial?'rift:'+trial.id:boss?'boss:'+TL.id:TL?TL.id:'', seed=Math.floor(Math.random()*1e9), L=abLayout(tl,seed), B=dgBake(L); B.open=true; if(boss) B.boss={x:L.mid.x,z:L.mid.z,r:DG_BOSS_R};   // B9: the boss disc's circle (r = 20) at its middle   // B7: the tile's island (no tile: the rift's plain platforms); B8: a Trial plays on its mode's rift platforms
  const O=dgSlotOrigin(slot), run={id:dgNextRun++,slot,ox:O.x,oz:O.z,theme:T,th:T.id,mission:'abyss',seed,L:abRoundLv(d,r),tier:0,lay:L,B,
    phase:'objectives',ready:false,t:0,endT:0,members:new Map(),mons:new Set(),objs:[],boss:null,k:{},hud:[],party:0,lead:p.id,dev:false,back:dropRun&&dropRun.back?{x:dropRun.back.x,z:dropRun.back.z}:{x:p.x,z:p.z},
    inv:new Map(),asked:new Set(),emptyT:0,flow:new Map(),nextObj:0,ab:true,abD:d,abR:r,abWon:false,abTile:tl,tile:TL,abKind:kind,abMode:trial?mode:'',abBoss:boss?bossId:''};
  if(trial) abTrialDefS(run,trial,TL);   // abyss/trial.js: the rift def the mode kit reads
  DG_SLOT_RUN[slot]=run.id; DG_RUNS.set(run.id,run); return run;
}
// the hiker walks in, the kit's setup starts the waves, abr tells the client the round
function abStartRoundS(p,run){
  const g=abSaveOf(p), old=g.run; g.run={d:run.abD,r:run.abR,at:Date.now(),arts:old&&old.arts||[],curses:old&&old.curses||[],offer:null,es:abIsEncKind(run.abKind)?run.abR:old&&old.es|0,pk:0}; p.dirty=true;   // the bar goes on from round to round
  dgEnterS(run,p); abArtsDirtyP(p); recalcP(p); dgSetupS(run);   // abyss: the bar's health counts from the moment the hiker is in the run
  run.abCK=abCurseKS(p); abShieldS(p);   // abyss: the curses' monster factors for this round and the bar's round-start shield (abyss/combat.js)
  dgEvTo('abr',p.id,run.abR,abRounds(run.abD),run.L,run.abTile,run.abKind,run.abMode);
  toastTo(p.id,'Round '+run.abR+(abRounds(run.abD)?' of '+abRounds(run.abD):'')+': '+AB_KIND_INFO[run.abKind].name+(abIsEncKind(run.abKind)?'':', level '+run.L+(run.tile?', '+run.tile.name:'')+(run.abBoss?': '+abBossRowOf(run.abBoss).short:''))+'.','');
}
function abGoP(p,d){
  if(io.broadcastSnaps){ toastTo(p.id,AB_TXT_SHARED,'bad'); return; }
  if(p.dead||p.inst||p.pv) return;
  const g=abSaveOf(p); abStaleP(p);
  if(typeof d!=='number'||!Number.isInteger(d)||d<0||d>AB_INF) return;
  if((p.level|0)<AB_ENTRY_LV){ toastTo(p.id,'The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
  if(d>(g.top|0)){ toastTo(p.id,'Clear the difficulty before it first.','bad'); return; }
  const run=abRunNewS(p,d,1,undefined,abRandTileS()); if(!run){ toastTo(p.id,'The Abyss is full right now. Try again in a minute.','bad'); return; }
  abStartRoundS(p,run);
}
// the next round of a won one: a fresh run object (the old one's slot is reused), the hiker is carried over without a trip through the world
function abNextP(p,i){
  const old=abRunOf(p); if(!old||!old.abWon||old.endT||p.dead) return;
  const card=abTilePickP(p,i); if(card===null) return;   // B7: a pending tile offer is answered by next,i (a pending artifact offer or a bad i is refused); no offer pending: a random tile as before
  const d=old.abD, r=old.abR+1; if(abRounds(d)&&r>abRounds(d)) return;
  const c0=S.ctx; S.ctx=old.id;
  if(old.boss) clearBossFxS(old.boss);   // B9: a boss's telegraphs and zones go with its round
  for(const m of [...old.mons]) dgRemoveS(old,m);
  DG_SLOT_RUN[old.slot]=0; DG_RUNS.delete(old.id); S.ctx=c0;
  const run=card?abRunNewS(p,d,r,old,card.tile,card.kind,card.mode,card.boss):abRunNewS(p,d,r,old,abRandTileS(old.tile?old.tile.id:''),abKindDev.force||(abIsBossRound(d,r)&&AB_BOSS_OK.length?'boss':'fight'),abKindDev.mode||'heart',abKindDev.boss); abStartRoundS(p,run);   // B8: the card's kind; no offer: a Fight (dev: abKindDev.force), B9: or the boss of a boss round
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
function abSpawnS(run,defId,lx,lz,tier){
  const d=DEF_BY_ID[defId]; if(!d||run.endT) return null;
  const W=dgWorldS(run,lx,lz), c0=S.ctx; S.ctx=run.id;
  const m=makeMon(d,W.x,W.z,{x:W.x,z:W.z},tier==='c'?AB_CHAMP_S:tier==='e'?AB_ELITE_S:1,true);
  if(m.inst!==run.id) dgAdoptS(m);
  m.dgK=dgKOf(d,run.L); m.dgHunt=true;
  if(tier){ m.maxHp=m.hp=m.maxHp*(tier==='c'?AB_CHAMP_HP:AB_ELITE_HP); m.elite=true; m.abTier=tier; }   // B8: an Elite round's elites (x2 health) and champions (x4, bigger)
  const ck=run.abCK; if(ck&&(ck.mhp!==1||ck.mdmg!==1)){ const k=m.dgK; m.dgK={lv:k.lv,hp:k.hp*ck.mhp,dmg:k.dmg*ck.mdmg,xp:k.xp}; }   // abyss: the curses (a copy: dgKOf's answers are cached)
  ev('spawn',monRoster(m)); S.ctx=c0; return m;
}
function abPickS(run){ if(run.tile) return run.tile.pool[Math.floor(Math.random()*run.tile.pool.length)];   // B7: the tile's own kinds, all of them at the round's level
  const kinds=run.theme.kinds, tw=kinds.reduce((s,c)=>s+c.w,0); let r=Math.random()*tw; for(const c of kinds){ r-=c.w; if(r<=0) return c.id; } return kinds[0].id; }
// the wave step: AB_COUNT_S, then AB_WAVES waves (the next at AB_NEXT_PCT dead or AB_WAVE_S); 'won' when the last wave is dead
function abWaveStepS(run){
  const k=run.k, S0=run.B.marks.S;
  const el=run.abKind==='elite';
  const go=()=>{ k.w++; k.start=run.t; k.size=el?Math.max(2,Math.round(abWaveSize(run.abR,k.w)*AB_ELITE_K)):abWaveSize(run.abR,k.w); k.dead=0;
    const champs=el?(k.w===2?1:k.w===3&&Math.random()<0.5?1:0):0;
    for(let i=0;i<k.size;i++) k.q.push([abPickS(run),run.t+AB_RELEASE_S*i/k.size,k.w,i<champs?'c':el&&Math.random()<AB_ELITE_SHARE?'e':'']); };
  if(!k.w){ if(run.t>=AB_COUNT_S) go(); }
  else if(k.w<AB_WAVES&&(k.dead>=k.size*AB_NEXT_PCT||run.t-k.start>=AB_WAVE_S)) go();
  let alive=riftAliveS(run);
  while(k.q.length&&k.q[0][1]<=run.t&&alive<AB_ALIVE_MAX&&S0.length){
    const [id,,w,tier]=k.q.shift(), s=S0[(k.ti++)%S0.length], a=Math.random()*TAU, rr=Math.random()*2.5, m=abSpawnS(run,id,s.x+Math.sin(a)*rr,s.z+Math.cos(a)*rr,tier);
    if(m){ m.abW=w; alive++; }
  }
  return k.w>=AB_WAVES&&!k.q.length&&!alive?'won':'';
}
function abHudS(run){ const k=run.k||{q:[],w:0}, clk=!k.w?Math.max(0,Math.ceil(AB_COUNT_S-run.t)):k.w>=AB_WAVES?0:Math.max(0,Math.ceil(AB_WAVE_S-(run.t-k.start)));
  run.hud=[run.abR,abRounds(run.abD),riftAliveS(run)+k.q.length,k.w|0,AB_WAVES,clk,AB_KIND_IDS.indexOf(run.abKind)]; }
// the round is won: the hiker waits in the run for next / out; the last round of a finite difficulty wins the run (opens the next difficulty, counts a clear) and the run closes after DG_END_S
function abRoundWonS(run){
  if(run.abWon||run.endT) return; run.abWon=true; run.phase='won'; DG_KITS.abyss.hud(run);
  const d=run.abD, n=abRounds(d), last=n&&run.abR>=n;
  for(const p of dgPresentS(run)){
    if(p.dead){ p.dead=false; p.deadT=0; p.hp=p.maxHp; p.lastHit=S.t; ev('up',p.id); }
    const g=abSaveOf(p);
    if(d===AB_INF) g.best=Math.max(g.best|0,Math.min(999999,run.abR));
    if(last){ g.top=Math.max(g.top|0,Math.min(5,d+1)); g.clears[d]=Math.min(999999,(g.clears[d]|0)+1); g.run=null; dgEndEvS(run,p,1,''); toastTo(p.id,AB_DIFFS[d].name+' cleared! '+AB_DIFFS[d+1].name+' is open.','good'); }
    else { dgEvTo('abw',p.id,run.abR,run.abKind); abOfferP(run,p); if(g.run&&g.run.offer) g.run.pk=Math.max(0,(AB_KIND_PICKS[run.abKind]||1)-1); else abTileOfferP(p); toastTo(p.id,'Round '+run.abR+' won. Go on to the next round, or leave with everything you earned.','good'); }   // B8: an Elite / Trial pays 2 picks one after another (abAfterPickP)
    abPayRoundP(p,run,last);   // abyss: the round's Abyssal Shards, credited now (a fall keeps them): abyss/pay.js
    p.dirty=true;
  }
  if(last) run.endT=S.t;   // the dungeons' end timer closes the run (dgRunTickS) and puts everyone back
}
DG_KITS.abyss={
  setup(run){
    if(run.abKind==='trial') return abTrialSetupS(run);   // abyss/trial.js: the rift mode's kit
    if(run.abKind==='boss') return abBossSetupS(run);   // abyss/boss.js: the boss waits on its disc
    run.k={q:[],kills:0,ti:0,w:0,start:0,size:0,dead:0}; abHudS(run); if(abIsEncKind(run.abKind)) abEncounterS(run);   // abyss/events.js: no fight, a card
  },
  tick(run,dt){ if(run.endT||run.abWon) return; if(run.abKind==='trial') return abTrialTickS(run,dt); if(run.abKind==='boss') return abBossTickS(run,dt); if(abWaveStepS(run)==='won'){ abRoundWonS(run); return; } abHudS(run); },
  onKill(run,m){ if(run.abKind==='trial') return abTrialKillS(run,m); if(run.abKind==='boss') return; run.k.kills++; if(m.abW===run.k.w) run.k.dead++; },
  onBossDead(run){ abRoundWonS(run); },   // B9: the boss's death wins the round (3 picks; a finite difficulty's last round wins the run)
  onUse(run,p,ob){ if(run.abKind==='trial') abTrialUseS(run,p,ob); },
  hud(run){ if(run.abKind==='trial') abTrialHudS(run); else abHudS(run); },
};
// testing tool (devP 'abyss', v: the top difficulty 0-5, r: skip to round r of difficulty d now: needs no run, leaves one; art: an artifact id onto the bar, curse: a curse id, both in a live run)
function abDevP(p,msg){
  const g=abSaveOf(p);
  if(msg.v!==undefined){ g.top=clampInt(msg.v,0,5,0); p.dirty=true; toastTo(p.id,'Abyss: difficulty '+g.top+' open.','good'); }
  if(typeof msg.art==='string'&&abGiveArtP(p,msg.art)) toastTo(p.id,'Abyss: '+AB_ARTS[msg.art].name+' on the bar.','good');   // abyss/combat.js
  if(typeof msg.curse==='string') abCurseAddP(p,msg.curse);
  if(msg.kind!==undefined){ abKindDev.force=abIsKind(msg.kind)&&AB_KIND_W[msg.kind]>0?msg.kind:''; abKindDev.mode=typeof msg.mode==='string'&&AB_TRIAL_MODES[msg.mode]?msg.mode:''; abKindDev.boss=abBossOk(msg.boss)?msg.boss:''; toastTo(p.id,'Abyss: every offered round is a '+(abKindDev.force||'random kind')+'.','good'); }   // B8: pin the kind of every offered round (dev)
  if(msg.r!==undefined&&abRunOf(p)){ const old=abRunOf(p); if(g.run) g.run.offer=null; old.abR=clampInt(msg.r,1,Math.max(1,abRounds(old.abD)||99),1)-1; old.abWon=true; old.endT=0; abNextP(p); }
}
