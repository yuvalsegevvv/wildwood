//@ Dungeon gear on the server: the ring's attack (the pendant's bonuses are read by pendP in players.js), Tempering Stones (the drop that replaces equipment at level 30+, and the `temper` message), the forge's merge rule, a clear's item, testing commands
/* Agent map (rules and ids: shared/dungeon-rewards.js; the items: shared/dungeon-items.js; the design: docs/DUNGEON-THEMES.md section 7)
   owns:    dgRingAtkP (recalcP adds it), dgRollDropP (rewardKill: a stone instead of equipment), dgAddStonesP, dgTemperP + MSG.temper, dgMergeRefusedP (mergeP),
            dgGrantItemP (a clear's item for one player: the integration step calls it once for every member), MSG.rwdev (testing tools: stones, every level-30 piece, three for the forge)
   uses:    state.js (MSG, ev, toastTo), players.js (soulOfP), economy.js (addItemP, unwornCount, gearChangedP).
   events:  stone [pid,n,monId] (a stone dropped), temper [pid,newId,oldId] (a piece was tempered); the toasts carry the words.
   gear:    gear.temper = the count of stones (0..DG_STONE_MAX, sanitized in sanitizeGear), gear.eq.ring = the worn ring.
   hooks:   the lines marked `// dungeons:` in players.js (recalcP, sanitizeGear), economy.js (mergeP, buyP, bindSoulP) and combat.js (rewardKill); listed in docs/DUNGEON-THEMES.md section 7.
   test:    tools/rewards-smoke.js */
const dgRingAtkP=p=>dgRingAtkOf(p.gear,soulOfP(p));   // what the worn ring adds to p's attack right now (0 without a ring, with another soul)
// stones: a count in the save, not items in the bag
function dgAddStonesP(p,n,monId){
  const have=p.gear.temper||0, add=Math.min(n,DG_STONE_MAX-have); if(!(add>0)) return 0;
  p.gear.temper=have+add; p.dirty=true; ev('stone',p.id,add,monId==null?null:monId);
  toastTo(p.id,'Found: '+(add>1?add+' x ':'')+ENH_NAME,'loot r2');
  return add;
}
// rewardKill's equipment roll r: a normal monster fought at level ENH_LV or more (K.lv: your zone tier counts) rolls the stone at ENH_DROP instead and never drops
// equipment (-1); bosses and lower levels keep r
function dgRollDropP(q,m,K,r){
  if(dgDropKind(K.lv,!!m.def.boss)!=='stone') return r;
  if(dgRollStone(K.lv,false)) dgAddStonesP(q,1,m.id);
  return -1;
}
// temper{id[,worn]}: raise one dungeon piece in your bag (or worn) one step; it costs the stones of that step and always works. With several copies, the one in the bag is
// raised unless worn is set (or the worn one is the only copy)
function dgTemperP(p,id,worn){
  if(typeof id!=='string') return;
  const info=dgEnhInfo(id); if(!info||!p.gear.inv.includes(id)){ if(ITEM[id]&&!ITEM[id].dg) toastTo(p.id,'Only dungeon gear can be tempered','bad'); return; }
  const it=info.it;
  if(!info.nextId){ toastTo(p.id,it.name+' cannot be tempered any further','bad'); return; }
  const have=p.gear.temper||0;
  if(have<info.stones){ toastTo(p.id,'You need '+info.stones+' '+ENH_NAME+(info.stones>1?'s':'')+' (you have '+have+')','bad'); return; }
  const slot=Object.keys(p.gear.eq).find(s=>p.gear.eq[s]===id), wornCopy=!!slot&&(!!worn||unwornCount(p,id)<1);
  p.gear.temper=have-info.stones;
  p.gear.inv[p.gear.inv.lastIndexOf(id)]=info.nextId;   // one copy; the others stay as they were
  if(wornCopy){ p.gear.eq[slot]=info.nextId; gearChangedP(p); } else p.dirty=true;
  toastTo(p.id,'Tempered: '+info.next.name,'loot r'+info.next.rar); ev('temper',p.id,info.nextId,id);
}
MSG.temper=(p,msg)=>dgTemperP(p,msg.id,!!msg.worn);
// the forge merges only +0 pieces: say why a tempered one is refused (mergeP returns when this is true)
function dgMergeRefusedP(p,id){
  const it=ITEM[id]; if(!it||!it.dg||!it.n) return false;
  toastTo(p.id,it.name+' has been tempered: only +0 pieces can be merged','bad'); return true;
}
// a clear's item for one player (the integration step rolls dgClearReward(theme) once and hands the id to every member); false when the bag is full
function dgGrantItemP(p,id){
  const it=ITEM[id]; if(!it||!it.dg) return false;
  if(p.gear.inv.length>=BAG_MAX){ toastTo(p.id,'Your bag is full: '+it.name+' was lost','bad'); return false; }
  addItemP(p,id,true); ev('loot',p.id,id,null); toastTo(p.id,it.name+' from the dungeon','loot r'+it.rar);
  return true;
}
// testing tools (settings panel; only when the server runs in dev mode): rwdev{cmd:'stones'|'dgall'|'dgthree'}
MSG.rwdev=(p,msg)=>{
  if(!S.dev){ toastTo(p.id,'Testing tools are off on this server','bad'); return; }
  if(msg.cmd==='stones'){ if(!dgAddStonesP(p,20)) toastTo(p.id,'You hold the most stones there can be','bad'); }
  else if(msg.cmd==='dgall'){
    const ids=[...ALL_SLOTS.map(s=>dgGearId(s,0,0)),...RING_ELS.map(e=>dgRingId(e,0,0)),...PENDANT_STATS.map(t=>dgPendantId(t,0,0))];
    for(const id of ids) if(p.gear.inv.length<BAG_MAX) p.gear.inv.push(id);
    p.dirty=true; toastTo(p.id,'A level-30 piece of every kind added (common, '+ids.length+' pieces)','good');
  } else if(msg.cmd==='dgthree'){
    const ids=[...ALL_SLOTS.map(s=>dgGearId(s,0,0)),...RING_ELS.map(e=>dgRingId(e,0,0)),...PENDANT_STATS.map(t=>dgPendantId(t,0,0))], id=ids[Math.floor(Math.random()*ids.length)];
    for(let k=0;k<MERGE_COUNT;k++) if(p.gear.inv.length<BAG_MAX) p.gear.inv.push(id);
    p.dirty=true; toastTo(p.id,'Three '+ITEM[id].name+' added for the forge','good');
  }
};
