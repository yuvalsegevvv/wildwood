//@ Three weapons at once (gear.eq.wpn = {warrior, archer, mage}): the active class (the character played), keeping eq.weapon (the one in use) in step with it; pure rules
/* Agent map (the owner: "three weapons equipped at once, only the active one counts"; server half: server/wpn.js; test: tools/bond-smoke.js (the weapons block)).
   gear.eq.wpn[cls] = the weapon item of that class you carry (a sword, a bow, a wand), may be null (an old save carries only the weapon in hand); a class switch fills it with the best owned weapon of that class, else the basic one (wpnBestG).
   gear.eq.weapon = the ACTIVE one, which all stat code and the client already read; wpnSyncG keeps it equal to wpn[active class].
   THE ACTIVE CLASS: wpnPlayCls(gear) = the class of the character in play (gear.bd.play: a set's class = SKILLS[pos[1].ids[0]].cls, or the Wanderer's active path's class); with no play pick (or an
   unknown one) the class of eq.weapon as before, so an old save and a new hiker behave as they did.
   Exports: WPN_CLS, wpnClsOfId(id), wpnPlayCls(gear), wpnInactive(gear) (the ids of the two carried and not in use), wpnSyncG(gear[,level]) (true when eq.weapon changed).
   Used by: server/wpn.js, server/economy.js (equipP, unwornCount, sellP), server/players.js (sanitizeGear, recalcP), server/presets.js, game/economy/inventory.js. */
const WPN_CLS=['warrior','archer','mage'];
const wpnClsOfId=id=>{ const it=typeof id==='string'?ITEM[id]:null; return it&&it.kind==='weapon'?(CLASS_OF[it.slot]||null):null; };
function wpnPlayCls(gear){
  const B=gear&&gear.bd, k=B&&typeof B==='object'?B.play:null; if(typeof k!=='string') return null;
  if(k===BD_WANDERER){ const P=WD_PATHS[wdPathOf(gear)]; return P&&WPN_CLS.includes(P.cls)?P.cls:null; }
  if(!bdSetOk(k)||!Object.prototype.hasOwnProperty.call(B,k)||!B[k]||!(B[k].b>=0)) return null;
  const s=SKILLS[SS_SETS[k].pos[1].ids[0]]; return s&&WPN_CLS.includes(s.cls)?s.cls:null;
}
// the best weapon of a class in the bag (level allowing), else the basic one (put in the bag)
function wpnBestG(gear,cls,level){
  const slot=WEAPON_OF[cls], own=gear.inv.filter(id=>wpnClsOfId(id)===cls&&(level===undefined||ITEM[id].lv<=level)).sort((a,b)=>ITEM[b].tier-ITEM[a].tier);
  if(own.length) return own[0];
  const base=slot+'1'; if(!gear.inv.includes(base)) gear.inv.push(base); return base;
}
function wpnSyncG(gear,level){
  if(!gear||!gear.eq||!Array.isArray(gear.inv)) return false;
  const eq=gear.eq, old=eq.wpn&&typeof eq.wpn==='object'?eq.wpn:{}, W={}, was=eq.weapon;
  for(const c of WPN_CLS){ const id=Object.prototype.hasOwnProperty.call(old,c)?old[c]:null; W[c]=typeof id==='string'&&gear.inv.includes(id)&&wpnClsOfId(id)===c?id:null; }
  eq.wpn=W;
  const cur=wpnClsOfId(eq.weapon), act=wpnPlayCls(gear)||cur||'warrior';
  if(cur===act) W[act]=eq.weapon; else eq.weapon=W[act]||wpnBestG(gear,act,level);
  W[act]=eq.weapon;
  return eq.weapon!==was;
}
const wpnPubEq=eq=>{ const o=Object.assign({},eq); delete o.wpn; return o; };   // what other hikers are told of your gear: not the carried weapons (snapshots stay small)
function wpnInactive(gear){
  const eq=gear&&gear.eq, W=eq&&eq.wpn, out=[]; if(!W||typeof W!=='object') return out;
  const act=wpnClsOfId(eq.weapon); for(const c of WPN_CLS) if(c!==act&&typeof W[c]==='string') out.push(W[c]);
  return out;
}
