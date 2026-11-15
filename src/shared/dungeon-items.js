//@ Level-30 dungeon gear as items: the 665 ITEM records (not in ITEM_LIST, so no shop, drop or "all items" sees them), their look, merging, a ring's attack for a gear, enhancement info and texts. Pure.
/* Agent map (the rules and the ids are dungeon-rewards.js; this file makes them items the rest of the game can hold)
   owns:    the loop that registers every dgAllIds() id as ITEM[id] (a dgItem record: kind weapon | armor | ring | pendant, slot, tier 6, lv 30, rar, atk | hp, def | pct | v, n, dg:true),
            DG_STONE_MAX (the count of Tempering Stones a save may hold), dgVisTier (the look, icon and model a level-30 piece borrows: the top tier's),
            dgMergedId, dgRingAtkOf (what a gear's ring adds, flat), dgRingStat (its text), dgEnhInfo (the next step of a piece).
   uses:    dungeon-rewards.js (dgAllIds, dgItem, dgGearId, dgRingId, ringAtk, dgEnhance*, ENH_MAX), items.js (ITEM, RARITY), elements.js (ELEMS). Loads after dungeon-rewards.js.
   used by: hooks in items.js (mergedId, effectiveLookOf, itemStat), server/players.js (recalcP, sanitizeGear), server/dungeon-rewards.js, the client's economy/dungeon-gear.js,
            ui/item-icons.js, combat/weapons.js.
   test:    tools/rewards-smoke.js (server), tools/rewards-client-smoke.js (client). */
for(const id of dgAllIds()) ITEM[id]=dgItem(id);
for(const t of [8,9,10]) for(const id of [...dgAllRingIds40(t),...dgAllPendantIds40(t),...dgAllIds40(t)]) ITEM[id]=dgItem(id);   // rolls: the unrolled level-40 / 50 / 60 rings (245 each), pendants (175) and gear (245); the rolled ones are made on demand (ITEM's Proxy)
for(const t of [7,8,9,10]) for(const id of dgAllTalismanIds(t)) ITEM[id]=dgItem(id);   // the 175 unrolled talismans of each level (D4: 30 / 40 / 50 / 60; the Sandglass pays them)
// ITEM only, never ITEM_LIST or TOOL_LIST (like the tools): shops, drops, "give every item" and tierFor leave them alone
const DG_STONE_MAX=9999;
const DG_LOOK_TIER=5;   // the Shogun's (tier 5) look, icon and weapon model stand in for level 30 until it has art of its own
const dgVisTier=it=>Math.min(it.tier,DG_LOOK_TIER);
// the id three +0 copies merge into: the next rarity at +0 (a piece above +0 does not merge: the forge says so); null for a legendary or a tempered piece
function dgMergedId(it){
  if(!it||!it.dg||it.rar>=4||it.roll) return null;   // (a rolled level-40 piece does not merge); a tempered piece merges and keeps its +n
  return dgRaisedId(it,it.rar+1);
}
// the same piece at rarity r, keeping its tempering step (merge and upgrade scrolls); null when it is not a level-30/40 piece or the step is more than that rarity allows
function dgRaisedId(it,r){
  if(!it||!it.dg||it.roll||!(r>=0&&r<=4)) return null; const n=it.n|0; if(n>ENH_MAX[r]) return null;
  const q=dgParse(it.id); return q?dgIdOfQ(q,r,n,null):null;
}
// dgrev: a ring works only while its element is the kit's: the played set's element (SS_SETS[id].el, 'basic' = none) or, as the Wanderer, the active path's (WD_PATHS[id].el; 'basic' for fury, bulwark, wayfarer)
function dgKitEl(gear,main){
  const S=main&&main!==BD_WANDERER&&Object.prototype.hasOwnProperty.call(SS_SETS,main)?SS_SETS[main]:null; if(S) return S.el||'basic';
  const P=WD_PATHS[wdPathOf(gear)]; return P?P.el||'basic':'basic';
}
const dgRingOn=(ring,kitEl)=>!!ring&&ring.kind==='ring'&&ring.el===kitEl;
const dgRingNeedText=ring=>'Needs '+(ring.el==='basic'?'an element-less':'a '+ELEMS[ring.el].name.toLowerCase())+' kit or path';
// the attack a worn ring adds to a gear: its own flat number, 0 while the kit's element (kitEl, from dgKitEl) is not the ring's
function dgRingAtkOf(gear,kitEl){
  const eq=gear&&gear.eq; if(!eq) return 0;
  const ring=ITEM[eq.ring];
  return ring&&ring.kind==='ring'&&dgRingOn(ring,kitEl)?ringAtk(ring):0;
}
const dgPct=v=>Math.round(v*1000)/10;
// one line about a ring (items' itemStat)
const dgRingStat=it=>'+'+it.ratk+' attack';
// the next enhancement step of a piece: {it, next (the record after), nextId, n, max, stones}, or null when it is not a level-30 piece or at its limit
function dgEnhInfo(id){
  const it=ITEM[id]; if(!it||!it.dg) return null;
  const nextId=dgEnhanceNext(id);
  return {it,n:it.n,max:ENH_MAX[it.rar],nextId,next:nextId?ITEM[nextId]:null,stones:dgEnhanceStones(id)};
}
