//@ Economy on the server: equip, shops (buy / sell), loot and monster drops, quests (accept, progress, hand in), skills (learn, equip, upgrade), the soul shrine, testing commands
function addItemP(p,id,quiet,monId){
  if(p.gear.inv.length>=BAG_MAX){ toastTo(p.id,'Your bag is full','bad'); return; }
  p.gear.inv.push(id); p.dirty=true;
  if(!quiet){ const it=ITEM[id]; ev('loot',p.id,id,monId==null?null:monId); toastTo(p.id,'Found: '+it.name,'loot r'+it.rar); }
}
// a monster's material (drops.js): kept in gear.mats, only used to upgrade skills
function addMatP(p,id,n,monId){
  if(!MATS[id]||!(n>0)) return;
  const have=p.gear.mats[id]||0, add=Math.min(n,MAT_MAX-have); if(add<=0) return;
  p.gear.mats[id]=have+add; p.dirty=true; ev('drop',p.id,id,add,monId==null?null:monId);
}
const unwornCount=(p,id)=>p.gear.inv.filter(x=>x===id).length-Object.values(p.gear.eq).filter(x=>x===id).length;
// Greta's forge: three identical items (not the ones you wear) become one of the next rarity
function mergeP(p,id){
  const it=ITEM[id], nid=mergedId(id); if(!it||!nid) return;
  if(unwornCount(p,id)<MERGE_COUNT){ toastTo(p.id,'You need three '+it.name+' in your bag','bad'); return; }
  for(let k=0;k<MERGE_COUNT;k++) p.gear.inv.splice(p.gear.inv.lastIndexOf(id),1);
  p.gear.inv.push(nid); p.dirty=true; mqActP(p,'merge');
  const n=ITEM[nid]; toastTo(p.id,'Forged: '+n.name,'loot r'+n.rar); ev('merge',p.id,nid);
}
function giveAllP(p){ for(const it of ITEM_LIST) if(!p.gear.inv.includes(it.id)&&p.gear.inv.length<BAG_MAX) p.gear.inv.push(it.id); p.dirty=true; }
// testing: one of every kind and rarity of a dungeon tier (-1: every tier), as many as the bag holds
function givePendantsP(p,tier){ let n=0; for(const it of PENDANT_LIST) if((tier<0||it.tier===tier)&&p.gear.inv.length<BAG_MAX){ p.gear.inv.push(it.id); n++; } p.dirty=true; return n; }
function gearChangedP(p){ recalcP(p); p.dirty=true; ev('pgear',p.id,p.gear.eq); }
function equipP(p,id){
  const it=ITEM[id]; if(!it||!p.gear.inv.includes(id)) return;
  if(p.level<it.lv){ toastTo(p.id,it.name+' needs level '+it.lv,'bad'); return; }
  const cls=clsOfP(p); p.gear.eq[it.kind==='weapon'?'weapon':it.slot]=id; gearChangedP(p);
  if(it.kind==='armor') mqActP(p,'armor'); else if(it.kind==='tool') mqActP(p,'tool',1,{tool:it.slot,tier:it.tier}); else if(clsOfP(p)!==cls) mqActP(p,'class');
}
function unequipP(p,slot){ if(slot==='weapon'||!(slot in p.gear.eq)) return; p.gear.eq[slot]=null; gearChangedP(p); }
function equipClassP(p,cls){
  const slot=WEAPON_OF[cls]; if(!slot) return;
  let owned=p.gear.inv.filter(id=>ITEM[id].slot===slot&&ITEM[id].lv<=p.level).sort((a,b)=>ITEM[b].tier-ITEM[a].tier);
  if(!owned.length){ p.gear.inv.push(slot+'1'); owned=[slot+'1']; }
  const was=clsOfP(p); p.gear.eq.weapon=owned[0]; gearChangedP(p); if(clsOfP(p)!==was) mqActP(p,'class');
}
function buyP(p,id){ const it=ITEM[id]; if(!it||it.rar>0||it.kind==='pendant') return;   // shops only sell common items, as many as you like
  if(it.kind==='tool'&&!inVillage(p)){ toastTo(p.id,'Tools are sold at a Wayfarers\' Lodge, in a village','bad'); return; }
  const n=p.gear.bought[id]||0, price=shopPrice(it,n);
  if(p.gear.coins<price){ toastTo(p.id,'Not enough coins','bad'); return; } p.gear.coins-=price; p.gear.bought[id]=n+1; addItemP(p,id,true); toastTo(p.id,'Bought '+it.name+' for '+price+' coins','loot r0'); ev('loot',p.id,id); if(it.kind!=='tool') mqActP(p,'buy'); }
function sellP(p,id){
  const i=p.gear.inv.lastIndexOf(id); if(i<0) return;
  const copies=p.gear.inv.filter(x=>x===id).length; if(Object.values(p.gear.eq).includes(id)&&copies<2) return;
  p.gear.inv.splice(i,1); p.gear.coins+=sellPrice(ITEM[id]); p.dirty=true; mqActP(p,'sell');
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
  ev('qturn',p.id,id); p.dirty=true; mqActP(p,'board');
}
/* ---- skills: bought from Aldric the trainer, equipped per class (passives: one loadout for every class), upgraded with coins and drops ---- */
function buySkillP(p,id){
  const s=skillDef(id); if(!s||p.gear.skills.owned.includes(id)) return;
  if(s.drop){ toastTo(p.id,s.name+' is not for sale: '+BOSS_DEFS.find(b=>b.def.id===s.drop).short+' drops it','bad'); return; }
  if(p.level<s.lv){ toastTo(p.id,s.name+' needs level '+s.lv,'bad'); return; }
  if(p.gear.coins<s.price){ toastTo(p.id,'Not enough coins','bad'); return; }
  p.gear.coins-=s.price; p.gear.skills.owned.push(id); p.dirty=true; toastTo(p.id,'Learned '+s.name+'!','good'); ev('skillbuy',p.id,id);
}
// a passive goes into slot idx of the passive loadout (or the first free open one, or nowhere when they are all full); slots from PASSIVE_OPEN on are locked for now
function equipPassiveP(p,id,idx){
  const P=p.gear.skills.pass, need=Math.max(PASSIVE_LV,PASSIVES[id].lv);
  if(p.level<need){ toastTo(p.id,PASSIVES[id].name+' needs level '+need,'bad'); return; }
  if(idx>=PASSIVE_OPEN){ toastTo(p.id,'Passive slot '+(idx+1)+' is locked for now','bad'); return; }
  const at=idx>=0?idx:P.slice(0,PASSIVE_OPEN).indexOf(null); if(at<0){ toastTo(p.id,'The passive slot is full: drop it onto the slot to replace it','bad'); return; }
  const was=P.indexOf(id); if(was>=0) P[was]=null; P[at]=id; recalcP(p); p.dirty=true;
}
function equipSkillP(p,id,idx){
  const s=skillDef(id); if(!s||!p.gear.skills.owned.includes(id)) return;
  if(s.slot==='passive'){ equipPassiveP(p,id,clampInt(idx,0,PASSIVE_SLOTS-1,-1)); return; }
  if(!canSwap(s.cls,s.slot)) return;
  const need=Math.max(slotLv(s.slot),s.lv); if(p.level<need){ toastTo(p.id,s.name+' needs level '+need,'bad'); return; }
  p.gear.skills.eq[s.cls][s.slot]=id; p.dirty=true;
}
function unequipSkillP(p,cls,slot,idx){
  if(slot==='pass'){ const P=p.gear.skills.pass, i=clampInt(idx,0,PASSIVE_SLOTS-1,-1); if(i>=0&&P[i]){ P[i]=null; recalcP(p); p.dirty=true; } return; }
  const e=p.gear.skills.eq[cls]; if(e&&(slot==='skill'||slot==='burst')){ e[slot]=null; p.dirty=true; }
}
// level up a skill or passive you own: coins and monster drops (upgradeNeeds), at the trainer in either village
function upgradeSkillP(p,id){
  const s=skillDef(id), S=p.gear.skills; if(!s||!S.owned.includes(id)) return;
  if(s.drop){ toastTo(p.id,s.name+' cannot be upgraded yet','bad'); return; }
  if(!inVillage(p)){ toastTo(p.id,'Skills are upgraded by a trainer: Aldric at the well (or Master Ryu in Hanami)','bad'); return; }
  const to=skillLvOf(S,id)+1; if(to>SKILL_MAX_LV){ toastTo(p.id,s.name+' is already at its highest level','bad'); return; }
  const need=upgradeNeeds(id,to), lack=need.mats.find(m=>(p.gear.mats[m.id]||0)<m.n);
  if(p.gear.coins<need.coins){ toastTo(p.id,'Not enough coins','bad'); return; }
  if(lack){ toastTo(p.id,'You need '+lack.n+' '+MATS[lack.id].name,'bad'); return; }
  p.gear.coins-=need.coins;
  for(const m of need.mats){ const left=(p.gear.mats[m.id]||0)-m.n; if(left>0) p.gear.mats[m.id]=left; else delete p.gear.mats[m.id]; }
  S.lv[id]=to; recalcP(p); p.dirty=true; toastTo(p.id,s.name+' is now level '+to,'good'); ev('skillup',p.id,id,to); mqActP(p,'upskill');
}
// the soul shrine in Hanami (level SOUL_LV): bind your soul to an element, free and as often as you like ('basic' unbinds it)
function bindSoulP(p,el){
  if(!ELEMS[el]||p.dead) return;
  if(p.level<SOUL_LV){ toastTo(p.id,'The shrine answers only hikers of level '+SOUL_LV+' and above','bad'); return; }
  if(Math.hypot(p.x-VIL2.x,p.z-VIL2.z)>VIL2.r+14){ toastTo(p.id,'The soul shrine is in Hanami, beyond the eastern mountains','bad'); return; }
  if(p.gear.soul===el) return;
  p.gear.soul=el; p.dirty=true; if(el!=='basic') mqActP(p,'soul'); toastTo(p.id,el==='basic'?'Your soul is unbound':'Your soul is bound to '+ELEMS[el].name,'good'); ev('soul',p.id,el);
}
/* ---- chat and names ---- */
// chat: up to 160 characters, at most one message every 0.7 s per player; everyone in the world hears it
function chatP(p,text){
  text=String(text||'').replace(/[\u0000-\u001f\u007f-\u009f]/g,'').replace(/\s+/g,' ').trim().slice(0,160); if(!text) return;
  if(S.t-(p.chatT||-9)<0.7){ toastTo(p.id,'Slow down a little','bad'); return; }
  p.chatT=S.t; ev('chat',p.id,p.name,text);
}
function renameP(p,name){
  const n=cleanName(name); if(n===p.name) return;
  if(p.user){ toastTo(p.id,'Your name is your account name and cannot be changed','bad'); return; }
  if(nameTaken(n,p)){ toastTo(p.id,'Someone already has the name '+n,'bad'); return; }
  if(S.t-(p.renameT||-9)<3){ toastTo(p.id,'Wait a moment before changing your name again','bad'); return; }
  const old=p.name; p.name=n; p.renameT=S.t; p.saveDirty=true; ev('pname',p.id,n,old);
}
// jump straight to a level (testing tools, account gifts): opens the skill slots passed on the way
function setLevelP(p,lv){
  const was=p.level; p.level=clampInt(lv,1,50,1); p.exp=0; recalcP(p); p.hp=p.maxHp; refreshOffersP(p);
  if(was<SKILL_SLOT_LV&&p.level>=SKILL_SLOT_LV) unlockSkillsP(p,'skill'); if(was<BURST_SLOT_LV&&p.level>=BURST_SLOT_LV) unlockSkillsP(p,'burst'); if(was<PASSIVE_LV&&p.level>=PASSIVE_LV) unlockPassivesP(p);
  p.dirty=true; ev('lvset',p.id,p.level);
}
// testing tools (settings panel); allowed when the server runs in dev mode (solo, shared room, or node --dev)
function devP(p,msg){
  if(!S.dev){ toastTo(p.id,'Testing tools are off on this server','bad'); return; }
  const c=msg.cmd;
  if(c==='level') setLevelP(p,msg.v);
  else if(c==='giveAll'){ giveAllP(p); toastTo(p.id,'Every item added to your bag','good'); }
  else if(c==='givePendants'){ const t=msg.v==null?-1:clampInt(msg.v,0,PENDANT_TIERS-1,0), got=givePendantsP(p,t); toastTo(p.id,got+' pendants added to your bag'+(t>=0?' (dungeon tier '+t+')':''),'good'); }
  else if(c==='startAll'){ p.gear.startAll=!!msg.v; if(p.gear.startAll) giveAllP(p); p.dirty=true; }
  else if(c==='skills'){ for(const id of [...SKILL_IDS,...PASSIVE_IDS]) if(!p.gear.skills.owned.includes(id)) p.gear.skills.owned.push(id); p.dirty=true; toastTo(p.id,'Every skill and passive learned','good'); }
  else if(c==='mats'){ for(const id of MAT_IDS) addMatP(p,id,20); toastTo(p.id,'20 of every monster drop added','good'); }
  else if(c==='weather'){ const k={clear:0,rain:1,storm:2}[msg.v]; if(k===0){ W.kind=0; W.t=0; W.dur=0; ev('weather',0); } else if(k) startWeatherS(k); }
  else if(c==='coins'){ p.gear.coins+=1000; p.dirty=true; }
  else if(c==='prof'){   // every profession, and a common tool of each tier for each (the best one you have the level for is worn)
    for(const id of PROF_IDS){ if(!p.gear.prof[id]) p.gear.prof[id]={xp:0}; mqActP(p,'learn',1,{prof:id}); }
    for(const t of TOOL_LIST) if(t.rar===0&&!p.gear.inv.includes(t.id)&&p.gear.inv.length<BAG_MAX) p.gear.inv.push(t.id);
    for(const slot of TOOL_SLOTS){ const best=TOOL_LIST.filter(t=>t.slot===slot&&t.rar===0&&t.lv<=p.level).pop(); if(best){ p.gear.eq[slot]=best.id; mqActP(p,'tool',1,{tool:slot,tier:best.tier}); } }
    gearChangedP(p); toastTo(p.id,'Mining, woodcutting and gathering learned, with their tools','good'); }
  else if(c==='res'){ for(const id in RES) p.gear.res[id]=Math.min(RES_MAX,(p.gear.res[id]||0)+60); p.dirty=true; toastTo(p.id,'60 of every resource added','good'); }
  else if(c==='pots'){ for(const id in POTS) p.gear.pot[id]=Math.min(POT_MAX,(p.gear.pot[id]||0)+5); p.dirty=true; toastTo(p.id,'5 of every potion added','good'); }
  else if(c==='vale'){ const v=clampInt(msg.v,0,2,1); if(v>=1) openValeP(p); if(v>=2){ p.gear.east=2; ev('vale',p.id,2); } if(v===0) p.gear.east=0; p.dirty=true; }
  else if(c==='west'){ const v=clampInt(msg.v,0,2,1); if(v>=1&&p.gear.west<1){ p.gear.west=1; ev('west',p.id,1); } if(v>=2){ p.gear.west=2; ev('west',p.id,2); } if(v===0) p.gear.west=0; p.dirty=true; }
  else if(c==='gate'){ const G=GREY_GATES.find(g=>g.id===msg.v); if(!G) return; p.gear[G.id]=msg.n===0?0:1; if(msg.n!==0) ev('gate',p.id,G.id); p.dirty=true; }   // v: 'river' / 'neck', n: 0 shut, 1 open
  else if(c==='north'){ const v=clampInt(msg.v,0,2,1); if(v>=1&&p.gear.north<1){ p.gear.north=1; ev('north',p.id,1); } if(v>=2){ p.gear.north=2; ev('north',p.id,2); } if(v===0) p.gear.north=0; p.dirty=true; }
  else if(c==='tunnel'){   // v: 'in' (halfway through), 'east' (the east portal), 'hanami' (its gate), 'pass' / 'north' (either side of the ice wall), 'rimehold' (its gate), 'hall' / 'nest' / 'gate' / 'shrine' / 'tide' / 'circle' (the boss arenas), 'glen' / 'glenw' (either side of the ice fall in the glacier valley), 'highmark' (its gate), 'cavern' (the golem's), 'riverfall' / 'neckfall' (the rock falls in the west wall), 'grey' / 'queen' (the Greyspine: Highmark's shelf, the Gryphon Queen's peak); default the west portal
    const xy=/^-?\d+,-?\d+(,-?\d+)?$/.test(msg.v||'')?msg.v.split(',').map(Number):null;   // or 'x,z[,facing in degrees: 0 north, 90 west]' anywhere (testing)
    const N={pass:[PASS.x,PASS.ice+14],north:[PASS.x,PASS.ice-14],rimehold:[VIL3.anchors.gate.x,VIL3.anchors.gate.z],hall:[ARENA26.x,ARENA26.z+ARENA26.r+8],nest:[ARENA30.x,ARENA30.z+ARENA30.r+8],tide:[ARENA_TIDE.x,ARENA_TIDE.z-ARENA_TIDE.r-8],circle:[ARENA.x,ARENA.z+ARENA.r+8],gate:[ARENA20.x,ARENA20.z+ARENA20.r+8],shrine:[ARENA25.x,ARENA25.z+ARENA25.r+8],highmark:[VIL4.anchors.gate.x,VIL4.anchors.gate.z],cavern:[ARENA32.x,ARENA32.z+ARENA32.r+8],riverfall:[GREY_GATES[0].x+14,GREY_GATES[0].z],neckfall:[GREY_GATES[1].x+14,GREY_GATES[1].z],glen:[GLEN.ice+14,GLEN.z],glenw:[GLEN.ice-14,GLEN.z],grey:[GREY_HM.x,GREY_HM.z],queen:[GREY_QUEEN.x,GREY_QUEEN.z+GREY_QUEEN.r*0.5]}[msg.v];   // the Hoarfrost Reach's places, the Greyspine's and the boss arenas
    const x=xy?clamp(xy[0],WX0+14,WX1-14):N?N[0]:msg.v==='in'?(TUN.p0+TUN.p1)/2:msg.v==='east'?TUN.x1+12:msg.v==='hanami'?VIL2.anchors.gate.x:TUN.x0-14, z=xy?clamp(xy[1],WZ0+14,WZ1-14):N?N[1]:msg.v==='hanami'?VIL2.anchors.gate.z:TUN.z;
    if(x>TUN.p0&&p.gear.east<1) return; if(x>HALF&&z<PASS.ice&&p.gear.north<1) return; if(z<HZ0&&x<GLEN.ice&&p.gear.west<1) return; p.x=x; p.z=z; p.y=getH(x,z); sendTo(p.id,{t:'tp',x,z,face:N?0:xy&&xy.length>2?xy[2]*Math.PI/180:-Math.PI/2}); }
  else if(c==='zt'){   // unlock the zone tiers of every land: up to v, or one more than the lowest (back to 0 after the last)
    const lo=Math.min(...ZTIER_LANDS.map(l=>p.gear.zt[l].max)), to=msg.v===undefined?(lo>=ZTIER_MAX?0:lo+1):clampInt(msg.v,0,ZTIER_MAX,0);
    for(const l of ZTIER_LANDS){ const z=p.gear.zt[l]; z.max=to; z.on=Math.min(z.on,to); }
    recalcP(p); p.dirty=true; toastTo(p.id,'Zone tiers unlocked up to '+ZTIER_ROMAN[to]+' in every land','good'); }
  else if(c==='three'){ const id=randomItem(tierFor(p.level),0); for(let k=0;k<MERGE_COUNT;k++) addItemP(p,id,true); toastTo(p.id,'Three '+ITEM[id].name+' added for the forge','good'); }
  else if(c==='lucky'){ const r=clampInt(msg.v,2,4,2); addItemP(p,randomItem(tierFor(p.level),r)); }
  else if(c==='mq'){ const s=MQ_BY_ID[msg.v]; if(!s) return; mqRemoveGreyP(p); p.gear.mq={s:s.i,st:0,n:s.parts.map(()=>0),h:0,ver:MQ_VER}; if(s.from===null) mqStartP(p); p.dirty=true; toastTo(p.id,'Main quest set to '+s.id+': '+s.title,'good'); }
  else if(c==='reset'){ const keep=p.gear.startAll; p.gear=newGearFor(clsOfP(p)); p.gear.startAll=keep; if(keep) giveAllP(p); p.level=1; fillOffersP(p); p.exp=0; p.dead=false; recalcP(p); p.hp=p.maxHp; gearChangedP(p); toastTo(p.id,'Progress reset','good'); }
  else if(c==='skip'){ const stops=[0.045,0.25,0.47,0.62], from=S.ff!==null?S.ff:S.day; S.ff=stops.find(s=>s>from+0.01); if(S.ff===undefined) S.ff=stops[0]; }
}
