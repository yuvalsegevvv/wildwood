//@ Awakening panel, the rules half: which characters are listed, a node's state (own / buy / open / tier / req), its name and effect in words, its price against what you hold (awcStatus, awcCostLines, awcTierInfo)
/* Agent map (skills revamp step 15; PLAN section 4; the server's version of every rule: server/awakening.js awkNodeP / awkTierP / awkPlanP, which has the last word; the panel: panel.js; the drawing: tree.js).
   Reads the gear mirror: GEAR.awk[<set id | 'wanderer'>] {t, n:{node id: 1}}, GEAR.awm (echo, trophy_<boss>), GEAR.mats (monster drops), GEAR.rd.mat[land] (raid material), GEAR.coins, GEAR.bd[<set>].b (Bond >= 0 owns a
   character), GEAR.skills.bdx.main (the character you play), and PL.level. The shared rules: awkShapeOf, awkNode, awkNodeCost, awkTierCost, awkStatOf, awkDropKinds, AWK_TIERS, btOf (a trophy's name and colour).
   exports: AWC_STAT_NAME, AWC_LIMB_NAME, awcChars() ([{k, name, col, initial, set}] the Wanderer first, then every character with Bond 0 or more), awcMain(), awcEntry(k), awcSkillName(k,limb), awcLimbLevel(k,limb),
            awcNodeName(k,n), awcStatText(k,n), awcEffect(k,n), awcStatus(k,n) -> {st, why, miss, cost, lines, afford}, awcStates(k) ({node id: state} for the canvas), awcCostLines(c), awcTierInfo(k),
            awcMatName(id), awcHaveOf(id,c), awcLandName(land).
   PAYING (what the server does, mirrored so the panel can say "you can pay"): coins; `drops` from the monster kinds awkDropKinds(land, tier) (all that you hold of them count); 'echo' from gear.awm; 'rd_<land>' from the
   raid material of that land ('rd_any': any land's); 'trophy_<boss>' from gear.awm ('trophy_any': any boss's); Essence ('ess_*', ESSENCE in shared/essence.js) from gear.awm, paid by the elemental rifts (step 17a); an id nothing can hold shows as "cannot be earned yet" and never as payable.
   Test: client-smoke (the awakening block). */
const AWC_STAT_NAME={dmg:'damage',crit:'crit chance',cd:'cooldowns',hp:'health',red:'damage taken',move:'move speed',drop:'drop rate',xp:'experience',heal:'healing done',eff:'buff strength'};
const AWC_LIMB_NAME={ba:'Basic',sk:'Skill',po:'Power',pa:'Passive',ch:'Charge',bu:'Burst'};
const AWC_COIN_COL='#f2cf5a', AWC_ECHO_COL='#6fd6d0', AWC_RAID_COL='#e8b84a', AWC_DROP_COL='#a9c97a';
const awcHas=(o,k)=>!!o&&typeof o==='object'&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const awcLandName=land=>land==='any'?'any land':(typeof LANDS!=='undefined'&&awcHas(LANDS,land)?LANDS[land].name:land);
// the characters you may open: the Wanderer and every set with Bond 0 or more (the server refuses an unowned one)
function awcChars(){
  const B=(GEAR&&GEAR.bd)||{}, out=[{k:'wanderer',name:'The Wanderer',col:'#d9b26a',initial:'W',set:null}];
  for(const k of SS_ORDER){ if(!bdSetOk(k)||!awkShapeOf(k)) continue; const e=awcHas(B,k)&&typeof B[k]==='object'?B[k]:null; if(!e||!(e.b>=0)) continue;
    const S=SS_SETS[k]; out.push({k,name:S.char.name,col:'#'+('000000'+S.pal.main.toString(16)).slice(-6),initial:S.char.name[0],set:S}); }
  return out;
}
function awcMain(){   // the character you play now (the server writes it into bdx), if you can open it
  const X=GEAR&&GEAR.skills&&GEAR.skills.bdx, m=X&&typeof X.main==='string'?X.main:'wanderer';
  return awcChars().some(c=>c.k===m)?m:'wanderer';
}
const awcEntry=k=>{ const e=GEAR&&awcHas(GEAR.awk,k)?GEAR.awk[k]:null; return {t:e&&e.t>0?Math.min(AWK_TIERS.length-1,e.t|0):0, n:e&&e.n&&typeof e.n==='object'?e.n:{}}; };
// the skill a limb carries: a character's own (the one of your class for the three actives) or, for the Wanderer, the slot's general name
function awcSkillName(k,limb){
  if(k==='wanderer'){ const W=GEAR?WD_PATHS[wdPathOf(GEAR)]:null, u=W&&ultDef(W.ult);   // wanderer: the active path's passive and burst
    return limb==='pa'?(W?PASSIVES[W.passive].name:AWC_LIMB_NAME[limb]):limb==='bu'?(u?u.name:AWC_LIMB_NAME[limb]):AWC_LIMB_NAME[limb]+' skill'; }
  const S=awcHas(SS_SETS,k)?SS_SETS[k]:null; if(!S) return AWC_LIMB_NAME[limb];
  if(limb==='pa') return S.keptPassive&&PASSIVES[S.keptPassive]?PASSIVES[S.keptPassive].name:'Passive';
  if(limb==='bu'){ const u=ultDef(k); return u?u.name:'Burst'; }
  if(limb==='ch'){ const id=CAVE_SKILL_IDS.find(i=>CAVE_SKILLS[i].set===k); return id?CAVE_SKILLS[id].name:'Charge skill'; }
  const ids=S.pos[limb==='ba'?1:limb==='sk'?2:3].ids, cls=clsOf(), id=ids.find(i=>SKILLS[i].cls===cls)||ids.find(i=>SKILLS[i].cls==='any')||ids[0];
  return id&&SKILLS[id]?SKILLS[id].name:AWC_LIMB_NAME[limb];
}
// the level a limb has reached: its deepest upgrade node in an unbroken row (the same count as the server's awkBranchLv, before the tier's cap)
function awcLimbLevel(k,limb){
  const sh=awkShapeOf(k), e=awcEntry(k); if(!sh) return 0; const first=AWK_LIMBS[limb].first; let L=first-1;
  for(let lv=first;lv<=AWK_TOP;lv++){ if(e.n[awkUpId(limb,lv)]===1) L=lv; else break; }
  return L;
}
const awcPct=v=>{ const t=Math.round(Math.abs(v*100)*10)/10; return (v<0?'-':'+')+String(t).replace(/\.0$/,'')+'%'; };
const awcPathOf=k=>k==='wanderer'&&GEAR?wdPathOf(GEAR):null;   // wanderer: the stat nodes follow the active path's table (shared/awakening-cost.js AWK_PATH_KIT)
function awcStatText(k,n){ const s=awkStatOf(k,n.id,awcPathOf(k)); return s?awcPct(s.v)+' '+AWC_STAT_NAME[s.stat]:''; }
// "Torch Arrow level 5", "Steady Hand unlock", "+1% crit chance (Torch Arrow)", "Burst buff 1": a node named for a sentence
function awcNodeName(k,n){
  if(n.kind==='star') return 'Burst buff '+n.n;
  const sk=awcSkillName(k,n.limb);
  if(n.kind==='stat') return awcStatText(k,n)+' ('+sk+')';
  return n.lv<=1?sk+' unlock':sk+' level '+n.lv;
}
// what buying a node does, in a line (the curves are shared/awakening.js: damage x1.17 a level, cooldown -3% / -1%, healing x1.10, a passive +8% of its base)
function awcEffect(k,n){
  if(n.kind==='star'){ const u=ultDef(k==='wanderer'?(GEAR?wdUltId(wdPathOf(GEAR)):''):k), b=u&&u.boost&&u.boost[n.n-1]; return b?ultPieceName(k,b.piece)+' for '+b.secs+' s while the burst lasts: '+ultModText(b.mod):'The burst\'s buff number '+n.n+' (a character\'s own burst)'; }
  if(n.kind==='stat'){ const s=awkStatOf(k,n.id,awcPathOf(k)); return s?awcStatText(k,n)+' while '+(k==='wanderer'?'the Wanderer':SS_SETS[k].char.name)+' is the character you play (the '+s.band+' band of the '+AWC_LIMB_NAME[n.limb].toLowerCase()+' branch)':''; }
  const sk=awcSkillName(k,n.limb), L=n.lv;
  if(L<=1) return n.limb==='pa'?'Makes '+sk+' yours: wear it in the passive slot.':n.limb==='ch'?(k==='wanderer'?'Makes the general charge skills yours: wear one in the charge slot.':'Makes '+sk+' yours: wear it in the charge slot.'):'Makes the burst usable: wear it in the burst slot.';
  const dmg=Math.round((awkCurve('dmg',L)/awkCurve('dmg',L-1)-1)*1000)/10, cd=Math.round((1-awkCurve('cd',L)/awkCurve('cd',L-1))*1000)/10;
  if(n.limb==='pa') return sk+' works at +'+Math.round(awkCurve('pass',L)*100-100)+'% of its first-level value (+8% a level).';
  if(n.limb==='ba') return sk+': +'+dmg+'% damage.';
  if(n.limb==='ch') return sk+': +'+dmg+'% damage, +10% healing, +6% strength, +3% duration; its cost stays.';
  if(n.limb==='bu') return sk+': +'+dmg+'% damage. Its 5 s stun and 60 s cooldown never change.';
  return sk+': +'+dmg+'% damage, '+cd+'% shorter cooldown.';
}
// ---- what you hold against a price ----
function awcMatName(id){
  if(id==='echo') return 'Echo Shards';
  if(id==='trophy_any') return 'Boss trophies (any boss)';
  if(btOf(id)) return btOf(id).name;
  if(id.startsWith('rd_')){ const l=id.slice(3), r=l==='any'?null:rdOfLand(l); return r?r.mat:l==='any'?'Raid material (any land)':'Raid material'; }
  if(essOf(id)) return essOf(id).name;
  return id;
}
const awcMatCol=id=>id==='echo'?AWC_ECHO_COL:btOf(id)?btOf(id).col:id==='trophy_any'?'#d9b26a':id.startsWith('rd_')?AWC_RAID_COL:essOf(id)?essCol(id):'#cccccc';
// how many of a price's material you hold (null: an id nothing can hold)
function awcHaveOf(id){
  const W=(GEAR&&GEAR.awm)||{}, R=(GEAR&&GEAR.rd&&GEAR.rd.mat)||{};
  if(id==='echo') return awcHas(W,'echo')?W.echo|0:0;
  if(id.startsWith('rd_')){ const l=id.slice(3); if(l==='any') return Object.keys(R).reduce((a,x)=>a+(R[x]|0),0); return awcHas(R,l)?R[l]|0:0; }
  if(id==='trophy_any') return BT_ORDER.reduce((a,t)=>a+(awcHas(W,t)?W[t]|0:0),0);
  if(btOf(id)||essOf(id)) return awcHas(W,id)?W[id]|0:0;   // trophies and Essence (step 17a) live in gear.awm
  return null;
}
// a price as lines [{name, col, have, need, ok, note}]: coins, monster drops of the character's land at the price's tier, then every material
function awcCostLines(c){
  const g=GEAR||{}, M=g.mats||{}, out=[];
  out.push({name:'Coins',col:AWC_COIN_COL,have:g.coins|0,need:c.coins,ok:(g.coins|0)>=c.coins});
  if(c.drops>0){ const kinds=awkDropKinds(c.land,c.tier), have=kinds.reduce((a,id)=>a+(awcHas(M,id)?M[id]|0:0),0);
    const lv=kinds.length?Math.min(...kinds.map(id=>(MON_DEFS.find(d=>d.id===id)||{level:1}).level)):0;
    out.push({name:'Monster drops',col:AWC_DROP_COL,have,need:c.drops,ok:have>=c.drops,note:(c.land==='any'?'any land':awcLandName(c.land))+(lv?', level '+lv+' and above':'')}); }
  for(const id of Object.keys(c.mats)){ const need=c.mats[id], have=awcHaveOf(id);
    out.push({name:awcMatName(id),col:awcMatCol(id),have:have===null?0:have,need,ok:have!==null&&have>=need,note:have===null?'cannot be earned yet':''}); }
  return out;
}
const awcCan=lines=>lines.every(l=>l.ok);
// ---- a node's state, as the server judges a purchase (own, tier, hiker level, every req, then the price) ----
function awcStatus(k,n){
  const e=awcEntry(k), sh=awkShapeOf(k); if(e.n[n.id]===1) return {st:'own'};
  const T=AWK_TIERS[n.tier];
  if(e.t<n.tier) return {st:'tier',why:'Needs Awakening A'+n.tier+' (hiker level '+T.lv+')'};
  if(PL.level<T.lv) return {st:'tier',why:'Needs hiker level '+T.lv};
  const miss=n.req.filter(r=>e.n[r]!==1);
  if(miss.length) return {st:'req',miss,why:'Buy first: '+miss.map(r=>awcNodeName(k,sh.byId[r])).join(', ')};
  const cost=awkNodeCost(k,n.id), lines=cost?awcCostLines(cost):[], afford=awcCan(lines);
  return {st:afford?'buy':'open',cost,lines,afford};
}
// the states of a whole tree for the canvas: {node id: state}
function awcStates(k){ const sh=awkShapeOf(k), out={}; if(!sh) return out; for(const n of sh.nodes) out[n.id]=awcStatus(k,n).st; return out; }
// the tier strip's facts: the tier, its cap, the next tier's needs and price
function awcTierInfo(k){
  const e=awcEntry(k), t=e.t, cap=AWK_TIERS[t].cap, last=t>=AWK_TIERS.length-1, info={t,cap,last,next:null};
  if(!last){ const nx=AWK_TIERS[t+1], cost=awkTierCost(k,t+1), lines=cost?awcCostLines(cost):[], lvOk=PL.level>=nx.lv;
    info.next={t:t+1,lv:nx.lv,cap:nx.cap,opens:AWC_TIER_OPENS[t+1],lvOk,lines,afford:awcCan(lines),can:lvOk&&awcCan(lines)}; }
  return info;
}
const AWC_TIER_OPENS=['the basic skill, the skill and the power','the passive','the charge skill','the burst','the burst\'s first buff (the first star)','the burst\'s second buff (the second star)'];
