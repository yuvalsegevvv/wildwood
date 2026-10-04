//@ Level-30 dungeon gear as items: the 665 ITEM records (not in ITEM_LIST, so no shop, drop or "all items" sees them), their look, merging, a ring's attack for a gear, enhancement info and texts. Pure.
/* Agent map (the rules and the ids are dungeon-rewards.js; this file makes them items the rest of the game can hold)
   owns:    the loop that registers every dgAllIds() id as ITEM[id] (a dgItem record: kind weapon | armor | ring | pendant, slot, tier 6, lv 30, rar, atk | hp, def | pct | v, n, dg:true),
            DG_STONE_MAX (the count of Tempering Stones a save may hold), dgVisTier (the look, icon and model a level-30 piece borrows: the top tier's),
            dgMergedId, dgRingAtkOf (what a gear's ring adds, for a soul), dgRingStat / dgRingShare (texts), dgEnhInfo (the next step of a piece).
   uses:    dungeon-rewards.js (dgAllIds, dgItem, dgGearId, dgRingId, ringAtk, dgEnhance*, ENH_MAX), items.js (ITEM, RARITY), elements.js (ELEMS). Loads after dungeon-rewards.js.
   used by: hooks in items.js (mergedId, effectiveLookOf, itemStat), server/players.js (recalcP, sanitizeGear), server/dungeon-rewards.js, the client's economy/dungeon-gear.js,
            ui/item-icons.js, combat/weapons.js.
   test:    tools/rewards-smoke.js (server), tools/rewards-client-smoke.js (client). */
for(const id of dgAllIds()) ITEM[id]=dgItem(id);   // ITEM only, never ITEM_LIST or TOOL_LIST (like the tools): shops, drops, "give every item" and tierFor leave them alone
const DG_STONE_MAX=9999;
const DG_LOOK_TIER=5;   // the Shogun's (tier 5) look, icon and weapon model stand in for level 30 until it has art of its own
const dgVisTier=it=>Math.min(it.tier,DG_LOOK_TIER);
// the id three +0 copies merge into: the next rarity at +0 (a piece above +0 does not merge: the forge says so); null for a legendary or a tempered piece
function dgMergedId(it){
  if(!it||!it.dg||it.n||it.rar>=4) return null;
  return it.kind==='ring'?dgRingId(it.el,it.rar+1,0):it.kind==='pendant'?dgPendantId(it.stat,it.rar+1,0):dgGearId(it.slot,it.rar+1,0);
}
// the attack a worn ring adds to a gear for a soul ('basic' below level 15 or unbound): its share of the WEAPON's attack, only if the elements match
function dgRingAtkOf(gear,soul){
  const eq=gear&&gear.eq; if(!eq) return 0;
  const ring=ITEM[eq.ring], weapon=ITEM[eq.weapon];
  return ring&&ring.kind==='ring'&&weapon?ringAtk(ring,soul,weapon.atk||0):0;
}
const dgPct=v=>Math.round(v*1000)/10;
const dgSoulName=el=>el==='basic'?'unbound':ELEMS[el].name;
// one line about a ring (items' itemStat)
const dgRingStat=it=>'+'+dgPct(it.pct)+'% of your weapon\'s attack, for a '+dgSoulName(it.el)+' soul';
// a ring against a soul and a weapon: {atk, match, soul}; atk is what it would add now (0 when it does not match)
function dgRingShare(ring,soul,weapon){ soul=soul||'basic'; return {atk:ringAtk(ring,soul,(weapon&&weapon.atk)||0),match:ring.el===soul,soul}; }
// the next enhancement step of a piece: {it, next (the record after), nextId, n, max, stones}, or null when it is not a level-30 piece or at its limit
function dgEnhInfo(id){
  const it=ITEM[id]; if(!it||!it.dg) return null;
  const nextId=dgEnhanceNext(id);
  return {it,n:it.n,max:ENH_MAX[it.rar],nextId,next:nextId?ITEM[nextId]:null,stones:dgEnhanceStones(id)};
}
