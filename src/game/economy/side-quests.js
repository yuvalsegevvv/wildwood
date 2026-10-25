//@ Side quests on the client: what their givers say (sqTalk), the marks over them, the quest panel's Side quests tab, the tracked chain's row in the quest log and its map marker, a place's scene in the speech bubble
/* The server owns the progress (gear.sq, server/side-quests.js); this file only reads GEAR.sq. The lines come from the same shared sqTalk the server applies.
   hooks: village/talking.js (startTalk adds these lines after the main quest's; interact and the prompt step through a scene), village/npc-labels.js (the mark), economy/quests.js (the tab, the log row),
   ui/map.js (the marker), net/client.js (the sq and sqsay events). test: tools/client-smoke.js (the tab), tools/sidequests-smoke.js (the rules). */
const sqG=()=>(GEAR&&GEAR.sq)||null;
// what a villager says about the side quests now (null: nothing)
function sqLinesFor(n){ if(!sqHas(SQ_NPC_VIL,n.def.id)) return null; const T=sqTalk(sqG()||newSq(),n.def.id,PL.level,mqNight(dayClock)); return T.lines.length?T:null; }
// the mark over a villager: ! a chain step to take or a part to do with them, ? a step to hand in (the main quest's mark wins over it)
function sqMark(id){
  if(!sqHas(SQ_NPC_VIL,id)) return ''; const q=sqG()||newSq(); let mk='';
  for(const C of SQ){ const E=sqEntry(q,C.id), s=C.steps[E.s]; if(!s) continue;
    if(E.st===2&&s.to===id) return '?';
    if(E.st===0&&s.from===id&&(E.s>0||sqOpenFor(C,q,PL.level))) mk='!';
    if(E.st===1&&s.parts.some((pt,i)=>pt.talk===id&&mqOpen(s,E.n,i))) mk='!'; }
  return mk;
}
// where a person is: drawn, or their village's gate when you are elsewhere
function sqPersonSpot(id){ const T=npcSpot(id); if(T) return T; const V=VILS[SQ_NPC_VIL[id]-1]; return {x:V.anchors.gate.x,z:V.anchors.gate.z,name:SQ_VIL_NAMES[SQ_NPC_VIL[id]-1]}; }
function sqPartTarget(s,pt){
  if(pt.talk) return sqPersonSpot(pt.talk);
  if(pt.visit){ const P=SQ_PLACES[pt.visit]; return {x:P.x,z:P.z,name:P.name}; }
  return mqPartTarget(s,pt);   // (kills, quest drops, lore, bosses and nodes are found the main quest's way)
}
// the chain's marker: its giver, the first open part with a place, or whom to hand in to
function sqTarget(C){
  const q=sqG(); if(!q||!C) return null; const E=sqEntry(q,C.id), s=C.steps[E.s]; if(!s) return null;
  if(E.st===0) return s.from&&(E.s>0||sqOpenFor(C,q,PL.level))?sqPersonSpot(s.from):null;
  if(E.st===2) return sqPersonSpot(s.to);
  for(let i=0;i<s.parts.length;i++) if(mqOpen(s,E.n,i)){ const T=sqPartTarget(s,s.parts[i]); if(T) return T; }
  return null;
}
// the chain the quest log follows: the one you track, else the first that runs
function sqTracked(){ const q=sqG(); if(!q) return null; const t=sqChain(q.t); if(t&&sqEntry(q,t.id).s<t.steps.length&&(q.c[t.id])) return t; return SQ.find(C=>{ const E=sqEntry(q,C.id); return C.steps[E.s]&&(E.st||E.s); })||null; }
function sqLogRow(){
  const C=sqTracked(); if(!C) return '';
  const E=sqEntry(sqG(),C.id), s=C.steps[E.s];
  const what=E.st===0?'Talk to '+SQ_NAMES[s.from]:sqObjective(s,E.n), T=sqTarget(C), d=T?Math.hypot(T.x-P.x,T.z-P.z):0;
  return `<div class="ql sq${E.st===2?' ok':''}"><b>${C.name}</b><span>${s.title}: ${what}${T&&d>=12?' &middot; '+Math.round(d)+' m '+dirWord(T.x-P.x,T.z-P.z):''}</span></div>`;
}
// how many chains have a step to hand in (the tab's badge)
const sqReadyN=()=>{ const q=sqG(); if(!q) return 0; let k=0; for(const id in q.c) if(q.c[id].st===2) k++; return k; };
// the map: the tracked chain's marker
function sqMapTarget(){ const C=sqTracked(), T=C&&sqTarget(C); return T?{x:T.x,z:T.z,label:C.name+' (side quest)',side:true}:null; }
/* The Side quests tab of the quest panel: one card per chain, in level order. A running chain shows its step like the main quest tab (the giver's words, each part with a monster's
   picture and a bar, where to go), its pay and the cosmetic at its end; the others show how to start them, or that they are finished. Text only from shared data. */
const SQ_LAND_NAMES={home:'The home forest',vale:'The Sakura Vale',hoar:'The Hoarfrost Reach',sun:'The Sunscar',gloam:'The Gloamhorn',amber:'The Amber Reach'};
function sqCosName(key){ const m=/^([ac]):(.+)$/.exec(key||''), D=m&&cpDef(m[1],m[2]); return D?D.name+' ('+CP_SLOTS[m[1]][2].toLowerCase()+')':''; }
function sqResText(r){ return r.res.map(([id,n])=>n+' '+RES[id].name).join(', ')+' and '+numC(r.xp)+' XP'; }
function sqCardHtml(C){
  const q=sqG()||newSq(), E=sqEntry(q,C.id), s=C.steps[E.s], N=C.steps.length, tracked=sqTracked()===C;
  const head=`<div class="sq-head"><div><b>${C.name}</b><span>${SQ_LAND_NAMES[C.land]} &middot; level ${C.lv}+</span></div>`;
  if(!s) return `<div class="sq-card done">${head}<em class="sq-tag ok">Finished</em></div><p class="sq-note">You earned the ${sqCosName(C.cos)}.</p></div>`;
  const open=E.s>0||E.st>0||sqOpenFor(C,q,PL.level);
  if(!open){ const why=C.after&&!sqDone(q,C.after)?'After '+SQ_BY_ID[C.after].name:'From level '+C.lv;
    return `<div class="sq-card locked">${head}<em class="sq-tag">${why}</em></div><p class="sq-note">${sqWho(C.steps[0].from)} starts it. At its end: ${sqCosName(C.cos)}.</p></div>`; }
  let h=`<div class="sq-card${tracked?' tracked':''}">${head}${E.s||E.st?(tracked?'<em class="sq-tag on">Tracked</em>':`<button class="chip sq-track" data-sqt="${C.id}">Track</button>`):'<em class="sq-tag new">New</em>'}</div>`;
  h+=`<div class="jq-act"><span>${s.title}</span><span>Step ${E.s+1} of ${N}</span></div><div class="jq-actbar"><i style="width:${Math.max(4,Math.round(E.s/N*100))}%"></i></div>`;
  if(E.st===0) h+=`<div class="jq-obj"><span class="jq-dot">!</span><div><b>Talk to ${SQ_NAMES[s.from]}</b><span class="jq-n">${mqWhere(sqPersonSpot(s.from))}</span></div></div>`;
  else {
    if(s.offer&&s.offer.length) h+=`<p class="jq-say">“${s.offer[s.offer.length-1]}” <span>${s.from?SQ_NAMES[s.from]:''}</span></p>`;
    s.parts.forEach((pt,i)=>{
      const need=mqNeed(pt), got=Math.min(need,E.n[i]||0), done=got>=need, op=mqOpen(s,E.n,i), mon=mqPartMon(pt);
      h+=`<div class="jq-obj${done?' done':''}${!done&&!op?' later':''}">${mon?mpPic(mon):`<span class="jq-dot">${done?'&#10003;':''}</span>`}<div><b>${pt.text}${pt.night&&!done?' <i class="sq-night">after dark</i>':''}</b>`
        +(need>1?`<div class="jq-prog"><div class="jq-bar"><i style="width:${Math.max(got?6:0,Math.round(got/need*100))}%"></i></div><span class="jq-cnt">${got} / ${need}</span></div>`:'')
        +`<span class="jq-n">${done?'Done':!op?'After the step before it':mqWhere(sqPartTarget(s,pt))}</span></div></div>`;
    });
    if(E.st===2) h+=`<div class="jq-obj ready"><span class="jq-dot">?</span><div><b>Return to ${SQ_NAMES[s.to]}</b><span class="jq-n">${mqWhere(sqPersonSpot(s.to))}</span></div></div>`;
  }
  h+=`<div class="jq-rw">This step: <b>${sqResText(sqReward(C,E.s))}</b></div><div class="jq-rw sq-cos">At the end: <b>${sqCosName(C.cos)}</b></div>`;
  return h+'</div>';
}
function sqJournalHtml(){
  const q=sqG()||newSq(), run=SQ.filter(C=>{ const E=sqEntry(q,C.id); return C.steps[E.s]&&(E.s||E.st); }), rest=SQ.filter(C=>!run.includes(C));
  return `<p class="sq-intro">Side quests are chains of small stories, one after another, each ending at a great beast. They pay in ore, logs and herbs, and the last step of each gives a cape or an aura you cannot make.</p>`
    +run.concat(rest).map(sqCardHtml).join('');
}
// a place's scene (a visit part's say lines): in the speech bubble in the middle of the screen, one line per talk key press; walking away closes it
let sqScene=null;
function sqShowScene(name,lines){
  if(talkNPC) endTalk(); if(!Array.isArray(lines)||!lines.length) return;
  sqScene={x:P.x,z:P.z,lines:lines.map(String)}; loreOpen=sqScene;
  bName.textContent=String(name); bText.textContent=sqScene.lines.shift(); bubble.classList.remove('mq'); bubble.classList.add('lore'); UI_SFX.talk();
}
function sqSceneNext(){
  if(!sqScene||loreOpen!==sqScene){ sqScene=null; return false; }
  if(!sqScene.lines.length){ loreOpen=null; sqScene=null; return true; }
  bText.textContent=sqScene.lines.shift(); UI_SFX.talk(); return true;
}
const sqSceneOn=()=>!!sqScene&&loreOpen===sqScene;
