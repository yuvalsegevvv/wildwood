//@ Side quests on the server: starting, progressing and handing in the steps of the side quest chains (SQ in shared/side-quests.js) from talks, kills, quest drops, lore, gathering and places walked to; their rewards (resources, a little XP, the chain's cosmetic)
/* Progress lives in gear.sq (saved, sanitizeSq). The client only asks: sq{a:'talk',id} (it talked to a villager; the server applies the same sqTalk), sq{a:'track',c} (the chain the quest
   log follows). Everything else is counted where it happens, through one-line hooks marked `// sidequests:`: kills (rewardKill, combat.js), lore read (mqMsgP, main-quest.js), nodes gathered
   (professions.js), places walked to (sqTickP, every half second from players.js). Events: sq [pid, chain id, step index, 1 started / 2 handed in], sqsay [pid, place name, lines]
   (a visit part's scene, shown in the speech bubble). test: tools/sidequests-smoke.js */
const sqOf=p=>p.gear.sq||(p.gear.sq=newSq());
const sqE=(p,c)=>{ const q=sqOf(p); return q.c[c]||(q.c[c]={s:0,st:0,n:[]}); };
const sqStepOf=(p,C)=>C.steps[sqE(p,C.id).s]||null;
function sqToast(p,text,kind){ toastTo(p.id,text,kind||'sq'); }
function sqStartP(p,C){
  const E=sqE(p,C.id), step=sqStepOf(p,C); if(!step) return;
  E.st=1; E.n=step.parts.map(()=>0); p.dirty=true; sqOf(p).t=C.id;
  sqToast(p,C.name+': '+step.title); ev('sq',p.id,C.id,E.s,1);
}
function sqProgressP(p,C,i,add,quiet){
  const E=sqE(p,C.id), step=sqStepOf(p,C); if(!step||E.st!==1||!mqOpen(step,E.n,i)) return false;
  const pt=step.parts[i], need=mqNeed(pt); E.n[i]=Math.min(need,(E.n[i]||0)+(add||1)); p.dirty=true;
  if(!quiet&&need>1&&pt.collect) sqToast(p,pt.collect+': '+E.n[i]+' / '+need);
  if(mqAllDone(step,E.n)){ if(step.to===null) sqCompleteP(p,C); else { E.st=2; if(!quiet) sqToast(p,step.title+': done. Return to '+SQ_NAMES[step.to]+'.'); } }
  return true;
}
// a step handed in (or done where you stand): its pay, then the next step (one that starts by itself starts now)
function sqCompleteP(p,C){
  const E=sqE(p,C.id), step=sqStepOf(p,C); if(!step) return;
  const r=sqReward(C,E.s), g=p.gear;
  for(const [id,n] of r.res) g.res[id]=Math.min(RES_MAX,(g.res[id]||0)+n);
  gainExpP(p,r.xp,null);
  sqToast(p,C.name+': '+step.title+' done. '+r.res.map(([id,n])=>n+' '+RES[id].name).join(', ')+', '+r.xp+' XP','good');
  if(step.doneLine) sqToast(p,step.doneLine);
  ev('sq',p.id,C.id,E.s,2); gsGemP(p,GEM_SQ_STEP,'side quest');   // gems
  E.s++; E.st=0; E.n=[]; p.dirty=true;
  const nx=sqStepOf(p,C);
  if(!nx){
    gsGemP(p,GEM_SQ_CHAIN,C.name+' finished');   // gems
    if(!Array.isArray(g.cos)) g.cos=[];   // (a brand-new hiker's gear has no list yet)
    if(r.cos&&!g.cos.includes(r.cos)&&g.cos.length<COS_MAX) g.cos.push(r.cos);
    const m=/^([ac]):(.+)$/.exec(r.cos||''), D=m&&cpDef(m[1],m[2]);
    sqToast(p,C.name+' is finished. Reward: '+(D?D.name+' ('+CP_SLOTS[m[1]][2].toLowerCase()+'), wear it in the character editor':'')+'.','loot r4');
    if(sqOf(p).t===C.id) sqOf(p).t='';
    return;
  }
  E.n=nx.parts.map(()=>0);
  if(nx.from===null) sqStartP(p,C);
}
function sqTalkP(p,npc){
  const vil=sqHas(SQ_NPC_VIL,npc)?SQ_NPC_VIL[npc]:0; if(!vil||p.dead) return;
  const V=VILS[vil-1]; if(Math.hypot(p.x-V.x,p.z-V.z)>VR+22) return;   // (each giver stays in, or at the gate of, their village)
  const T=sqTalk(sqOf(p),npc,p.level,mqNight(S.day));
  for(const a of T.acts){
    const C=SQ_BY_ID[a.c];
    if(a.start) sqStartP(p,C);
    for(const i of a.parts) sqProgressP(p,C,i,mqNeed(sqStepOf(p,C).parts[i]),true);
    if(a.complete){ const E=sqE(p,C.id); if(E.st===1&&mqAllDone(sqStepOf(p,C),E.n)) E.st=2; if(E.st===2){ sqCompleteP(p,C); if(a.next&&sqE(p,C.id).st===0) sqStartP(p,C); } }
  }
}
// every open part of every running chain that matches f(part) moves on by one
function sqEachOpen(p,f){
  const q=sqOf(p);
  for(const id in q.c){ const C=sqChain(id); if(!C) continue; const E=q.c[id], step=C.steps[E.s]; if(!step||E.st!==1) continue;
    step.parts.forEach((pt,i)=>{ if(mqOpen(step,E.n,i)) f(C,step,pt,i); }); }
}
function sqKillP(p,m){
  const id=m.def.id;
  sqEachOpen(p,(C,step,pt,i)=>{
    if(pt.kill===id) sqProgressP(p,C,i,1);
    else if(pt.collect&&pt.from.includes(id)&&Math.random()<pt.chance) sqProgressP(p,C,i,1);
    else if(pt.boss===id){ if(step.bossLine) sqToast(p,step.bossLine,'boss'); sqProgressP(p,C,i,1); }
  });
}
function sqReadP(p,id){
  const L=LORE_BY_ID[id]; if(!L||Math.hypot(p.x-L.x,p.z-L.z)>LORE_R+2) return;
  sqEachOpen(p,(C,step,pt,i)=>{ if(pt.read===id) sqProgressP(p,C,i,1); });
}
function sqGatherP(p,kind){ sqEachOpen(p,(C,step,pt,i)=>{ if(pt.gather===kind||pt.gather===NODE_KINDS[kind].prof) sqProgressP(p,C,i,1); }); }
// the places: a visit part counts when you stand within its radius (after dark if it says night); its scene goes to the speech bubble
function sqTickP(p){
  if(p.dead||p.inst) return;
  sqEachOpen(p,(C,step,pt,i)=>{
    if(!pt.visit) return; const P=SQ_PLACES[pt.visit];
    if(Math.hypot(p.x-P.x,p.z-P.z)>P.r||(pt.night&&!mqNight(S.day))) return;
    if(pt.say) ev('sqsay',p.id,P.name,pt.say);
    sqProgressP(p,C,i,1);
  });
}
function sqMsgP(p,msg){
  if(msg.a==='talk'&&typeof msg.id==='string') sqTalkP(p,msg.id);
  else if(msg.a==='track'){ const q=sqOf(p); q.t=sqChain(msg.c)&&q.c[msg.c]?msg.c:''; p.dirty=true; }
}
MSG.sq=(p,msg)=>sqMsgP(p,msg);
