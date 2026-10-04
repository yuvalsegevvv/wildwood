//@ The main quest on the server: starting, progressing and handing in steps (MQ in shared/main-quest.js) from what the server sees (talks, kills, system uses, places), rewards, the grey monsters spawned for you
/* Progress lives in gear.mq (saved, sanitized by sanitizeMq). The client only asks: mq{a:'talk',id} (it talked to a villager),
   mq{a:'pick',i} (a heartleaf), mq{a:'read',id} (a lore spot); every one is checked here (you are there, the part is open).
   Everything else is counted where it happens: kills (rewardKill), system uses (mqActP from economy / players / combat), and
   the checks every half second (mqTickP: level, weapon tier, soul, the flags of old saves, the grey monsters). */
const mqOf=p=>p.gear.mq;
let mqHush=false;   // set while a talk that also hands the step in is applied
const mqStep=p=>MQ[mqOf(p).s]||null;
function mqToast(p,text,kind){ toastTo(p.id,text,kind||'mq'); }
function mqStartP(p){
  const M=mqOf(p), step=mqStep(p); if(!step) return;
  M.st=1; M.n=step.parts.map(()=>0); M.h=0; p.dirty=true;
  if(step.gift==='three'){ const id=randomItem(tierFor(p.level),0); for(let k=0;k<MERGE_COUNT;k++) addItemP(p,id,true); }
  mqToast(p,'Main quest: '+step.title+(step.tip?'. '+step.tip:''));
  ev('mq',p.id,step.id,1);
  mqAutoP(p);
}
function mqReadyP(p,quiet){   // quiet: handed in by the same talk, no need to say where to go
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==1||!mqAllDone(step,M.n)) return;
  M.st=2; p.dirty=true; if(!quiet&&!mqHush) mqToast(p,step.title+': done. Return to '+MQ_NAMES[step.to]+'.');
}
// part i moves on by add (a talk, a kill, a use...); a part that finishes may open the ones after it
function mqProgressP(p,i,add,quiet){
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==1||!mqOpen(step,M.n,i)) return false;
  const pt=step.parts[i], need=mqNeed(pt); M.n[i]=Math.min(need,(M.n[i]||0)+(add||1)); p.dirty=true;
  if(!quiet&&need>1) mqToast(p,(pt.collect||pt.text)+': '+M.n[i]+' / '+need);
  if(M.n[i]>=need){ mqAutoP(p); mqReadyP(p); }
  return true;
}
function mqCompleteP(p,chained){   // chained: the next step starts in the same talk (its own toast says so)
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==2) return;
  const r=mqReward(step); p.gear.coins+=r.coins; gainExpP(p,r.xp,null);
  mqToast(p,'Main quest done: '+step.title+'. '+r.xp+' XP and '+r.coins+' coins','good'); ev('mq',p.id,step.id,2);
  mqRemoveGreyP(p);
  M.s++; M.st=0; M.n=[]; M.h=0; p.dirty=true;
  const nx=mqStep(p);
  if(!nx){ mqToast(p,MQ_END); return; }
  M.n=nx.parts.map(()=>0);
  if(nx.from===null) mqStartP(p);
  else if(!chained) mqToast(p,'Next in the main quest: '+nx.title+', from '+MQ_NAMES[nx.from]+(p.level<nx.gate?' at level '+nx.gate:''));
}
function mqTalkP(p,npc){
  const vil=MQ_NPC_VIL[npc]; if(!vil||p.dead) return;
  const V=VILS[vil-1]; if(Math.hypot(p.x-V.x,p.z-V.z)>VR+22) return;   // quest villagers stay in (or at the gate of) their village
  const M=mqOf(p), T=mqTalk(M,npc,p.level,mqNight(S.day));
  if(T.start) mqStartP(p);
  mqHush=T.complete; for(const i of T.parts) mqProgressP(p,i,mqNeed(mqStep(p).parts[i]),true); mqHush=false;
  if(T.complete){ mqReadyP(p,true); mqCompleteP(p,T.next); if(T.next&&mqStep(p)&&mqStep(p).from===npc&&p.level>=mqStep(p).gate) mqStartP(p); }
}
function mqPickP(p,i){
  const M=mqOf(p), step=mqStep(p), H=HERBS[i]; if(!step||M.st!==1||!H||(M.h>>i)&1) return;
  if(Math.hypot(p.x-H[0],p.z-H[1])>HERB_R+2) return;
  const k=step.parts.findIndex((pt,j)=>pt.pick&&mqOpen(step,M.n,j)); if(k<0) return;
  M.h|=1<<i; mqProgressP(p,k,1);
}
function mqReadP(p,id){
  const L=LORE_BY_ID[id], M=mqOf(p), step=mqStep(p); if(!L||!step||M.st!==1||Math.hypot(p.x-L.x,p.z-L.z)>LORE_R+2) return;
  step.parts.forEach((pt,i)=>{ if(pt.read===id) mqProgressP(p,i,1); });
}
// a system use: class, buy, armor, skill, burst, board, sell, upskill, merge, soul, warp, hanami, rimehold, highmark, learn, tool, craft, brew, potion. at:'cart' = only beside Odran's cart.
// arg says which: {prof} for learn, {tool, tier} for tool, {kind, tier} for craft, brew and potion: a part that names one of those only counts a match
function mqActP(p,kind,n,arg){
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==1) return;
  step.parts.forEach((pt,i)=>{ if(pt.act!==kind) return;
    if(pt.prof&&!(arg&&arg.prof===pt.prof)) return;
    if(pt.tool&&!(arg&&arg.tool===pt.tool&&arg.tier>=(pt.tier||0))) return;
    if(pt.kind&&!(arg&&arg.kind===pt.kind&&(arg.tier===undefined||arg.tier>=(pt.minTier||0)))) return;
    if(pt.at==='cart'){ const V=VILS[MQ_NPC_VIL[step.from]-1]; if(Math.hypot(p.x-V.cart.x,p.z-V.cart.z)>14) return; }
    mqProgressP(p,i,n||1); });
}
// a resource node gathered (server/professions.js): gather parts count it by node kind
function mqGatherP(p,kind){
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==1) return;
  step.parts.forEach((pt,i)=>{ if(pt.gather===kind||pt.gather===NODE_KINDS[kind].prof) mqProgressP(p,i,1); });
}
// a monster you helped kill (rewardKill): kill and grey parts count it, collect parts roll for their drop, boss parts end
function mqKillP(p,m){
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==1) return;
  const id=m.def.id;
  step.parts.forEach((pt,i)=>{
    if(!mqOpen(step,M.n,i)) return;
    if(pt.kill===id||pt.grey===id) mqProgressP(p,i,1);
    else if(pt.collect&&pt.from.includes(id)&&Math.random()<pt.chance)mqProgressP(p,i,1);
    else if(pt.boss===id){ if(step.bossLine) mqToast(p,step.bossLine,'boss'); mqProgressP(p,i,1); }
  });
}
// parts that are about what you have, not what you do (old saves that already have them finish them at once)
function mqAutoP(p){
  const M=mqOf(p), step=mqStep(p); if(!step||M.st!==1) return;
  const g=p.gear, w=ITEM[g.eq.weapon];
  step.parts.forEach((pt,i)=>{
    if(!mqOpen(step,M.n,i)) return;
    const tool=pt.act==='tool'&&ITEM[g.eq[pt.tool]];
    const has=(pt.level&&p.level>=pt.level)||(pt.tier!==undefined&&!pt.act&&w&&w.tier>=pt.tier)||(pt.act==='soul'&&g.soul!=='basic')||(pt.act==='hanami'&&g.east>=2)||(pt.act==='rimehold'&&g.north>=2)||(pt.act==='highmark'&&g.west>=2)||(pt.act==='learn'&&!!g.prof[pt.prof||'gathering'])||(tool&&tool.tier>=(pt.tier||0))||(pt.boss==='boss'&&g.east>=1);
    if(has) mqProgressP(p,i,mqNeed(pt),true);
  });
}
/* the grey monsters: a few spawn for you at the part's spot while you are within 80 m (three at a time; only after dark when the part says night), and go away when you
   leave (160 m), finish the part, or log off. Anyone can fight them; they count for whoever's part it is */
const MQ_GREY_AT={};
function mqGreyAt(key){ return MQ_GREY_AT[key]||(MQ_GREY_AT[key]=mqGreySpot(key)); }
function mqRemoveGreyP(p){ for(const m of MONS) if(m.owner===p.id&&!m.remove&&!m.dead) removeMonS(m); }
function mqTickP(p){
  const M=mqOf(p), step=mqStep(p);
  if(step&&M.st===0&&step.from===null) mqStartP(p);
  if(!step||M.st!==1){ return; }
  mqAutoP(p);
  const i=step.parts.findIndex((pt,k)=>pt.grey&&mqOpen(step,M.n,k)), mine=MONS.filter(m=>m.owner===p.id&&!m.remove&&!m.dead);
  if(i<0){ if(mine.length) mqRemoveGreyP(p); return; }
  const pt=step.parts[i], [gx,gz]=mqGreyAt(pt.zone), d=Math.hypot(p.x-gx,p.z-gz);
  if(d>160||(pt.night&&!mqNight(S.day))){ for(const m of mine) if(!m.aggro) removeMonS(m); return; }   // (a night part: nothing comes by day)
  if(d>80||S.t<(p.mqSpawnT||0)) return;
  const want=Math.min(3,mqNeed(pt)-M.n[i])-mine.length; if(want<=0) return;
  const def=GREY_DEFS.find(x=>x.id===pt.grey);
  for(let k=0;k<want;k++){
    for(let t=0;t<12;t++){ const a=AR(0,TAU), r=AR(4,16), x=gx+Math.sin(a)*r, z=gz+Math.cos(a)*r; if(getH(x,z)<0.8) continue;
      const m=spawnMonS(def,x,z,{x:gx,z:gz},true); m.owner=p.id; break; }
  }
  p.mqSpawnT=S.t+6;
}
function mqMsgP(p,msg){
  if(msg.a==='talk'&&typeof msg.id==='string') mqTalkP(p,msg.id);
  else if(msg.a==='pick') mqPickP(p,clampInt(msg.i,0,HERBS.length-1,-1));
  else if(msg.a==='read'&&typeof msg.id==='string') mqReadP(p,msg.id);
}
