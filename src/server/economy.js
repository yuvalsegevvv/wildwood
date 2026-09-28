//@ Economy on the server: equip, shops (buy / sell), loot, quests (accept, progress, hand in), testing commands
function addItemP(p,id,quiet,monId){
  if(p.gear.inv.length>=BAG_MAX){ toastTo(p.id,'Your bag is full','bad'); return; }
  p.gear.inv.push(id); p.dirty=true;
  if(!quiet){ const it=ITEM[id]; ev('loot',p.id,id,monId==null?null:monId); toastTo(p.id,'Found: '+it.name,'loot r'+it.rar); }
}
const unwornCount=(p,id)=>p.gear.inv.filter(x=>x===id).length-Object.values(p.gear.eq).filter(x=>x===id).length;
// Greta's forge: three identical items (not the ones you wear) become one of the next rarity
function mergeP(p,id){
  const it=ITEM[id], nid=mergedId(id); if(!it||!nid) return;
  if(unwornCount(p,id)<MERGE_COUNT){ toastTo(p.id,'You need three '+it.name+' in your bag','bad'); return; }
  for(let k=0;k<MERGE_COUNT;k++) p.gear.inv.splice(p.gear.inv.lastIndexOf(id),1);
  p.gear.inv.push(nid); p.dirty=true;
  const n=ITEM[nid]; toastTo(p.id,'Forged: '+n.name,'loot r'+n.rar); ev('merge',p.id,nid);
}
function giveAllP(p){ for(const it of ITEM_LIST) if(!p.gear.inv.includes(it.id)&&p.gear.inv.length<BAG_MAX) p.gear.inv.push(it.id); p.dirty=true; }
function gearChangedP(p){ recalcP(p); p.dirty=true; ev('pgear',p.id,p.gear.eq); }
function equipP(p,id){
  const it=ITEM[id]; if(!it||!p.gear.inv.includes(id)) return;
  if(p.level<it.lv){ toastTo(p.id,it.name+' needs level '+it.lv,'bad'); return; }
  p.gear.eq[it.kind==='weapon'?'weapon':it.slot]=id; gearChangedP(p);
}
function unequipP(p,slot){ if(slot==='weapon'||!(slot in p.gear.eq)) return; p.gear.eq[slot]=null; gearChangedP(p); }
function equipClassP(p,cls){
  const slot=WEAPON_OF[cls]; if(!slot) return;
  let owned=p.gear.inv.filter(id=>ITEM[id].slot===slot&&ITEM[id].lv<=p.level).sort((a,b)=>ITEM[b].tier-ITEM[a].tier);
  if(!owned.length){ p.gear.inv.push(slot+'1'); owned=[slot+'1']; }
  p.gear.eq.weapon=owned[0]; gearChangedP(p);
}
function buyP(p,id){ const it=ITEM[id]; if(!it||it.rar>0) return;   // shops only sell common items, as many as you like
  const n=p.gear.bought[id]||0, price=shopPrice(it,n);
  if(p.gear.coins<price){ toastTo(p.id,'Not enough coins','bad'); return; } p.gear.coins-=price; p.gear.bought[id]=n+1; addItemP(p,id,true); toastTo(p.id,'Bought '+it.name+' for '+price+' coins','loot r0'); ev('loot',p.id,id); }
function sellP(p,id){
  const i=p.gear.inv.lastIndexOf(id); if(i<0) return;
  const copies=p.gear.inv.filter(x=>x===id).length; if(Object.values(p.gear.eq).includes(id)&&copies<2) return;
  p.gear.inv.splice(i,1); p.gear.coins+=sellPrice(ITEM[id]); p.dirty=true;
}
/* ---- the quest board ---- */
// a fresh notice, avoiding a monster or place already on the board or in your log when it can
function newOfferP(p){
  const Q=p.gear.q, key=q=>q.kind==='scout'?'@'+q.place:q.target, taken=new Set([...Q.offers,...Object.values(Q.defs)].map(key));
  let q; for(let i=0;i<10;i++){ q=genQuest(p.level,'g'+Q.next); if(!taken.has(key(q))) break; }
  Q.next++; return q;
}
function fillOffersP(p){ const Q=p.gear.q; while(Q.offers.length<QUEST_OFFERS) Q.offers.push(newOfferP(p)); p.dirty=true; }
function refreshOffersP(p){ p.gear.q.offers=[]; fillOffersP(p); }
function questReadyP(p,q){ if(p.gear.q.ready.includes(q.id)) return; p.gear.q.ready.push(q.id); p.dirty=true; toastTo(p.id,'Quest done: '+q.title+'. Return to the quest board.','good'); ev('qdone',p.id,q.id); }
function questKillP(p,defId){
  const Q=p.gear.q;
  for(const qid in Q.active){ const q=Q.defs[qid]; if(q&&q.type==='kill'&&q.target===defId&&!Q.ready.includes(qid)){ Q.active[qid]=Math.min(q.count,Q.active[qid]+1); p.dirty=true; if(Q.active[qid]>=q.count) questReadyP(p,q); } }
}
function questTravelP(p){
  const Q=p.gear.q;
  for(const qid in Q.active){ const q=Q.defs[qid]; if(!q||Q.ready.includes(qid)||q.type!=='visit') continue; if(Math.hypot(p.x-q.at.x,p.z-q.at.z)<q.r){ Q.active[qid]=1; questReadyP(p,q); } }
}
function acceptP(p,id){
  const Q=p.gear.q, i=Q.offers.findIndex(o=>o.id===id); if(i<0) return;
  if(Object.keys(Q.active).length>=QUEST_MAX_ACTIVE){ toastTo(p.id,'You can carry five quests at a time','bad'); return; }
  const q=Q.offers[i]; Q.offers.splice(i,1,newOfferP(p)); Q.defs[q.id]=q; Q.active[q.id]=0; p.dirty=true;
}
function abandonP(p,id){ const Q=p.gear.q; if(!(id in Q.active)) return; delete Q.active[id]; delete Q.defs[id]; Q.ready=Q.ready.filter(x=>x!==id); p.dirty=true; }
function turnInP(p,id){
  const Q=p.gear.q, q=Q.defs[id]; if(!q||!Q.ready.includes(id)) return;
  const r=questRewardFor(q);
  delete Q.active[id]; delete Q.defs[id]; Q.ready=Q.ready.filter(x=>x!==id); Q.done++;
  p.gear.coins+=r.coins; gainExpP(p,r.xp,null); toastTo(p.id,'Reward: '+r.xp+' XP and '+r.coins+' coins','good');
  const rar=rollQuestItemRarity(r.item); if(rar>=0) addItemP(p,randomItem(tierFor(q.level),rar));
  ev('qturn',p.id,id); p.dirty=true;
}
/* ---- skills: bought from Aldric the trainer, equipped per class ---- */
function buySkillP(p,id){
  const s=SKILLS[id]; if(!s||p.gear.skills.owned.includes(id)) return;
  if(p.level<s.lv){ toastTo(p.id,s.name+' needs level '+s.lv,'bad'); return; }
  if(p.gear.coins<s.price){ toastTo(p.id,'Not enough coins','bad'); return; }
  p.gear.coins-=s.price; p.gear.skills.owned.push(id); p.dirty=true; toastTo(p.id,'Learned '+s.name+'!','good'); ev('skillbuy',p.id,id);
}
function equipSkillP(p,id){
  const s=SKILLS[id]; if(!s||!p.gear.skills.owned.includes(id)||!canSwap(s.cls,s.slot)) return;
  const need=Math.max(slotLv(s.slot),s.lv); if(p.level<need){ toastTo(p.id,s.name+' needs level '+need,'bad'); return; }
  p.gear.skills.eq[s.cls][s.slot]=id; p.dirty=true;
}
function unequipSkillP(p,cls,slot){ const e=p.gear.skills.eq[cls]; if(e&&(slot==='skill'||slot==='burst')){ e[slot]=null; p.dirty=true; } }
/* ---- chat and names ---- */
// chat: up to 160 characters, at most one message every 0.7 s per player; everyone in the world hears it
function chatP(p,text){
  text=String(text||'').replace(/[\u0000-\u001f\u007f-\u009f]/g,'').replace(/\s+/g,' ').trim().slice(0,160); if(!text) return;
  if(S.t-(p.chatT||-9)<0.7){ toastTo(p.id,'Slow down a little','bad'); return; }
  p.chatT=S.t; ev('chat',p.id,p.name,text);
}
function renameP(p,name){
  const n=cleanName(name); if(n===p.name) return;
  if(S.t-(p.renameT||-9)<3){ toastTo(p.id,'Wait a moment before changing your name again','bad'); return; }
  const old=p.name; p.name=n; p.renameT=S.t; p.saveDirty=true; ev('pname',p.id,n,old);
}
// testing tools (settings panel); allowed when the server runs in dev mode (solo, shared room, or node --dev)
function devP(p,msg){
  if(!S.dev){ toastTo(p.id,'Testing tools are off on this server','bad'); return; }
  const c=msg.cmd;
  if(c==='level'){ const was=p.level; p.level=clampInt(msg.v,1,50,1); p.exp=0; recalcP(p); p.hp=p.maxHp; refreshOffersP(p); if(was<SKILL_SLOT_LV&&p.level>=SKILL_SLOT_LV) unlockSkillsP(p,'skill'); if(was<BURST_SLOT_LV&&p.level>=BURST_SLOT_LV) unlockSkillsP(p,'burst'); p.dirty=true; ev('lvset',p.id,p.level); }
  else if(c==='giveAll'){ giveAllP(p); toastTo(p.id,'Every item added to your bag','good'); }
  else if(c==='startAll'){ p.gear.startAll=!!msg.v; if(p.gear.startAll) giveAllP(p); p.dirty=true; }
  else if(c==='skills'){ for(const id of SKILL_IDS) if(!p.gear.skills.owned.includes(id)) p.gear.skills.owned.push(id); p.dirty=true; toastTo(p.id,'Every skill learned','good'); }
  else if(c==='weather'){ const k={clear:0,rain:1,storm:2}[msg.v]; if(k===0){ W.kind=0; W.t=0; W.dur=0; ev('weather',0); } else if(k) startWeatherS(k); }
  else if(c==='coins'){ p.gear.coins+=1000; p.dirty=true; }
  else if(c==='three'){ const id=randomItem(tierFor(p.level),0); for(let k=0;k<MERGE_COUNT;k++) addItemP(p,id,true); toastTo(p.id,'Three '+ITEM[id].name+' added for the forge','good'); }
  else if(c==='lucky'){ const r=clampInt(msg.v,2,4,2); addItemP(p,randomItem(tierFor(p.level),r)); }
  else if(c==='reset'){ const keep=p.gear.startAll; p.gear=newGearFor(clsOfP(p)); p.gear.startAll=keep; if(keep) giveAllP(p); p.level=1; fillOffersP(p); p.exp=0; p.dead=false; recalcP(p); p.hp=p.maxHp; gearChangedP(p); toastTo(p.id,'Progress reset','good'); }
  else if(c==='skip'){ const stops=[0.045,0.25,0.47,0.62], from=S.ff!==null?S.ff:S.day; S.ff=stops.find(s=>s>from+0.01); if(S.ff===undefined) S.ff=stops[0]; }
}
