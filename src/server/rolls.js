//@ Rolled stats of level-40 gear on the server: the sums the rest of the game reads (rlP), the reroll stones, sacrificing a level-30+ piece, rolling and rerolling, testing commands
/* Agent map (rules, ids and numbers: shared/rolls.js, shared/dungeon-rewards.js; design: docs/ROLLS.md)
   owns:    rlRefreshP (recalcP calls it: p.rl = the capped sums of the worn pieces' lines), rlP(p,stat), rlAddStonesP, rlSacrificeP + MSG.sac, rlRollP + MSG.reroll,
            MSG.rldev (testing: stones, one of every level-40 piece), rlSanitizeStones (sanitizeGear). A ring is rolled and sacrificed like gear, with its own stone.
   uses:    state.js (MSG, ev, toastTo), economy.js (gearChangedP, unwornCount), the ITEM Proxy (a rolled id is made on first use).
   gear:    gear.rsw / gear.rsa / gear.rsr = weapon / armour / ring reroll stones (counts, 0..RL_STONE_MAX, sanitized).
   hooks:   the lines marked `// rolls:` in players.js (recalcP, hurtP, sanitizeGear), combat.js (rollDmgS, damageMonsterS, applyBuffS, handleAttack, rewardKill), reactions.js (rxHitS), crafting.js (drinkP),
            skillsets.js (buff duration), economy.js (mergeP); listed in docs/ROLLS.md.
   test:    tools/rolls-smoke.js */
// the capped sums of the worn pieces' lines, kept on the player (recalcP runs whenever a piece or the level changes); a piece above your level counts for nothing
function rlRefreshP(p){
  const eq=p.gear.eq, items=[]; for(const k in eq){ const it=ITEM[eq[k]]; if(it&&it.roll) items.push(it); }
  const o={}; if(items.length) for(const s of RL_STATS) { const v=rlSumOf(items,s.id,p.level); if(v) o[s.id]=v; }
  p.rl=o;
}
const rlP=(p,stat)=>(!p.pv&&p.rl&&p.rl[stat])||0;   // pvp: nothing rolled counts on the island
function rlAddStonesP(p,kind,n){
  const have=p.gear[kind]||0, add=Math.min(n,RL_STONE_MAX-have); if(!(add>0)) return 0;
  p.gear[kind]=have+add; p.dirty=true; toastTo(p.id,'Gained: '+(add>1?add+' x ':'')+RL_STONE_NAME[kind],'loot r2'); return add;
}
const rlSanitizeStones=(g,out)=>{ out.rsw=clampInt(g.rsw,0,RL_STONE_MAX,0); out.rsa=clampInt(g.rsa,0,RL_STONE_MAX,0); out.rsr=clampInt(g.rsr,0,RL_STONE_MAX,0); };
// sac{id}: break one unworn level-30+ weapon, armour piece or ring (pendants cannot be sacrificed) into stones of its kind: 1 / 2 / 4 / 8 / 16 by rarity
function rlSacrificeP(p,id){
  const it=typeof id==='string'?ITEM[id]:null;
  if(!it||!it.dg||it.lv<30||!RL_STONE_KIND[it.kind]){ toastTo(p.id,'Only level-30 and level-40 weapons, armour and rings can be sacrificed','bad'); return; }
  if(unwornCount(p,id)<1){ toastTo(p.id,'Take it off first, or keep a spare in your bag','bad'); return; }
  const kind=RL_STONE_KIND[it.kind], n=RL_SAC[it.rar];
  p.gear.inv.splice(p.gear.inv.lastIndexOf(id),1);
  const add=rlAddStonesP(p,kind,n); p.dirty=true;
  if(!add) toastTo(p.id,'You hold the most stones there can be: '+it.name+' was still sacrificed','bad');
  ev('sac',p.id,id,kind,add);
}
MSG.sac=(p,msg)=>rlSacrificeP(p,msg.id);
// reroll{id[,worn]}: roll (or reroll) the three lines of a level-40 weapon, armour piece or ring; costs RL_COST stones of its kind and replaces all three lines. With several copies the one in the bag is rolled unless worn is set
function rlRollP(p,id,worn){
  const it=typeof id==='string'?ITEM[id]:null;
  if(!it||!it.dg||!it.roll0||!RL_STONE_KIND[it.kind]||!p.gear.inv.includes(id)){ toastTo(p.id,'Only level-40 weapons, armour and rings can be rolled','bad'); return; }
  const kind=RL_STONE_KIND[it.kind], have=p.gear[kind]||0;
  if(have<RL_COST){ toastTo(p.id,'You need '+RL_COST+' '+RL_STONE_NAME[kind]+' (you have '+have+')','bad'); return; }
  const slot=Object.keys(p.gear.eq).find(s=>p.gear.eq[s]===id), wornCopy=!!slot&&(!!worn||unwornCount(p,id)<1);
  const q=dgParse(id), nid=it.kind==='ring'?dgRingId40(q.el,q.rar,q.n,rlRoll()):dgGearId40(q.slot,q.rar,q.n,rlRoll());
  p.gear[kind]=have-RL_COST;
  p.gear.inv[p.gear.inv.lastIndexOf(id)]=nid;
  if(wornCopy){ p.gear.eq[slot]=nid; gearChangedP(p); } else p.dirty=true;
  toastTo(p.id,'Rolled: '+ITEM[nid].name,'loot r'+ITEM[nid].rar); ev('reroll',p.id,nid,id);
}
MSG.reroll=(p,msg)=>rlRollP(p,msg.id,!!msg.worn);
// testing tools (dev server only): rldev{cmd:'stones'|'all40'|'rolled'}
MSG.rldev=(p,msg)=>{
  if(!S.dev){ toastTo(p.id,'Testing tools are off on this server','bad'); return; }
  if(msg.cmd==='stones'){ for(const k of RL_STONE_ORDER) rlAddStonesP(p,k,30); }
  else if(msg.cmd==='all40'){ for(const s of ALL_SLOTS) if(p.gear.inv.length<BAG_MAX) p.gear.inv.push(dgGearId40(s,0,0)); for(const e of RING_ELS) if(p.gear.inv.length<BAG_MAX) p.gear.inv.push(dgRingId40(e,0,0)); p.dirty=true; toastTo(p.id,'A level-40 piece of every slot and every ring added (common, unrolled)','good'); }
  else if(msg.cmd==='rolled'){ for(const s of ALL_SLOTS) if(p.gear.inv.length<BAG_MAX) p.gear.inv.push(dgGearId40(s,4,0,rlRoll())); if(p.gear.inv.length<BAG_MAX) p.gear.inv.push(dgRingId40(RING_ELS[Math.floor(Math.random()*RING_ELS.length)],4,0,rlRoll())); p.dirty=true; toastTo(p.id,'A rolled legendary level-40 piece of every slot and a ring added','good'); }
};
// rewardKill: a world boss may drop Reroll Stones, chance and number by the zone tier it was fought at (rlBossStoneChance, shared/rolls.js); dungeon bosses pay through their clear instead
function rlBossStonesP(q,m,K){
  if(m.inst||isGuestP(q)) return;
  const t=monTierOf(q.gear,m); if(Math.random()>=rlBossStoneChance(t)) return;
  rlAddStonesP(q,RL_STONE_ORDER[Math.min(RL_STONE_ORDER.length-1,Math.floor(Math.random()*RL_STONE_ORDER.length))],rlBossStoneCount(t));   // one of the three kinds, equally likely
}
