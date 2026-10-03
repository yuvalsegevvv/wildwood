//@ Zone tiers on the server: the saved tiers, choosing one in a village, opening the next one with a land's second boss, and how a tier changes one player's fights
/* Rules, names and numbers: shared/tiers.js. A monster exists once, with one health pool in its def's own units (m.hp / m.maxHp = def.hp): each
   player fights it at their own tier for its land, so a hit from p lowers m.hp by damage / K.hp, a hit on p is multiplied by K.dmg, and the kill
   pays p the XP, coins and gear of the tiered level (K = monK(m,p)). Two players at different tiers can share a monster; the client shows its
   health in the viewer's own units (game/economy/tiers.js). */
// a save's tiers, checked: the unlocked tier 0-ZTIER_MAX, the tier you play at 0-that
function sanitizeZt(g){
  const out=newZt(); if(!g||typeof g!=='object') return out;
  for(const l of ZTIER_LANDS){ const s=g[l]; if(!s||typeof s!=='object') continue; const max=clampInt(s.max,0,ZTIER_MAX,0); out[l]={on:clampInt(s.on,0,max,0),max}; }
  return out;
}
// the tier's numbers (level, health / damage / XP multipliers) for player p against monster m
const monK=(m,p)=>m.dgK||zoneTierK(m.T,monTierOf(p.gear,m));   // dungeons: a run's monster has its run's level and numbers (m.dgK), never the zone tier of the land its slot's x would read as
// zt{land,n}: play a land at tier n (0 to your highest unlocked one). Only in a village: a fight cannot be made easier halfway
function setZoneTierP(p,land,n){
  if(!ZTIER_LANDS.includes(land)) return;
  const z=p.gear.zt[land], to=clampInt(n,0,z.max,-1);
  if(to<0||to===z.on) return;
  if(!zoneTierVillage(p.x,p.z)){ toastTo(p.id,'Zone tiers can only be changed in a village.','bad'); return; }
  z.on=to; p.dirty=true;
  toastTo(p.id,to?'Tier '+ZTIER_ROMAN[to]+' in '+ZTIER_NAMES[land]+': enemies there are '+ZTIER_STEP*to+' levels higher.':'Tier 0 in '+ZTIER_NAMES[land]+': enemies are at their usual levels.','');
}
// a kill of a land's second boss while you play that land at your highest unlocked tier opens the next one (and grows your symbol)
function zoneTierKillP(q,m){
  const land=ZTIER_LANDS.find(l=>ZTIER_BOSS[l]===m.def.id); if(!land) return;
  const z=q.gear.zt[land]; if(z.on<z.max||z.max>=ZTIER_MAX) return;
  z.max++; q.dirty=true; recalcP(q);
  toastTo(q.id,'Tier '+ZTIER_ROMAN[z.max]+' unlocked in '+ZTIER_NAMES[land]+'! Choose it in a village (the map): its enemies are '+ZTIER_STEP*z.max+' levels higher. Your symbol grows: +'+Math.round(symbolBonus(q.gear)*100)+'% attack and health.','good');
}
