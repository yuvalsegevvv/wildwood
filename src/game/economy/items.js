//@ Your gear as told by the server (GEAR), saved in this browser; equip / unequip requests
/* ===================== EQUIPMENT, COINS, SHOPS, QUESTS =====================
   6 tiers (level 1, 5, 10, 15, 20, 25). Weapons: sword (Warrior), bow (Archer), wand (Mage): the weapon you hold is your class.
   Armor (any class): helmet, top, bottom, shoes. It adds health and defense and changes your outfit. */
var GEAR=null;
function newGear(){ return newGearFor(CLASSES[LOOK.cls]?LOOK.cls:'warrior'); }
try{ const s=JSON.parse(localStorage.getItem('wildwood-gear-v1')||'null'); if(s&&Array.isArray(s.inv)){ GEAR=Object.assign(newGear(),s); GEAR.inv=GEAR.inv.filter(id=>ITEM[id]); } }catch(_){}
if(!GEAR) GEAR=newGear();
GEAR.q=Object.assign({active:{},ready:[],done:[]},GEAR.q||{});
let gearSaveT=null;   // the save waits a beat: loot and crafting land in bursts, and every write stringifies the whole inventory
function saveGear(){ if(NET&&(NET.user||NET.test)) return; if(gearSaveT!==null) return; gearSaveT=setTimeout(gearSaveFlush,400); }
function gearSaveFlush(){ gearSaveT=null; if(NET&&(NET.user||NET.test)) return; try{ localStorage.setItem('wildwood-gear-v1',JSON.stringify(GEAR)); }catch(_){} }
addEventListener('pagehide',()=>{ if(gearSaveT!==null){ clearTimeout(gearSaveT); gearSaveFlush(); } });   // the last change is not lost when the tab closes
addEventListener('visibilitychange',()=>{ if(document.hidden&&gearSaveT!==null){ clearTimeout(gearSaveT); gearSaveFlush(); } });   // (a phone killed in the background never fires pagehide)
const fmtCoins=n=>Math.floor(n||0).toLocaleString('en-US');   // 12345 -> "12,345" (coin displays)
function gearStats(){ return gearStatsOf(GEAR); }
function effectiveLook(){ return effectiveLookOf(LOOK,GEAR); }
// the server sends your gear in every "you" update; apply it and redraw whatever changed
let gearApplied=null, gearSig='';   // what the last one held: most repeat the gear unchanged (every hit, every quest tick), and only a real change should redraw anything
function applyGear(g){
  if(!g) return;
  const sig=JSON.stringify(g);
  if(gearApplied===GEAR&&sig===gearSig) return;
  gearApplied=g; gearSig=sig;
  const prevW=GEAR&&GEAR.eq.weapon, prevEq=JSON.stringify(GEAR&&GEAR.eq);
  GEAR=g; saveGear();
  if(GEAR.eq.weapon!==prevW){ LOOK.cls=clsOf(); saveLookLocal(); attachWeapons(); setActionBar(); if(customizing) renderEditor(); }
  if(customizing){ renderEditor(); if(!edTrying()) saveLook(); }   // (a piece made at a lodge while its try-on is open: the look can be kept now)
  else if(cosLocked(LOOK,GEAR.cos).length||premLocked(LOOK,GEAR.pc).length){ LOOK=premCleanLook(cosCleanLook(LOOK,GEAR.cos),GEAR.pc); LOOK_SAVED=Object.assign({},LOOK); saveLookLocal(); rebuildHiker(); }   // a look saved before the pieces were crafted: what you do not own comes off
  if(JSON.stringify(GEAR.eq)!==prevEq) rebuildHiker();
  $('#plCoins').textContent=fmtCoins(GEAR.coins); tiersRefresh();
  gemRefresh(); renderInv(); if(!$('#shop').hidden) renderShop(); if(!$('#forge').hidden) renderForge(); if(!$('#skills').hidden) renderSkills(); if(!$('#presets').hidden) renderPresets(); if(!$('#lodge').hidden) renderLodge(); if(!$('#brew').hidden) renderBrew(); if(!$('#orbs').hidden) bdcRender(); if(!$('#bdc').hidden) bdcBondsRender(); bdcPopRefresh(); chrLookCheck(); /*bond:*/ if(!$('#awc').hidden) awcRender(); /*awakening:*/ updatePotBar(true); if(!$('#travel').hidden) renderTravel(); if(!$('#quests').hidden) renderQuests(); renderQlog(); syncStartAll(); syncCaveFull();
}
function equip(id){
  const it=ITEM[id]; if(!it) return;
  if(PL.level<it.lv){ toast(it.name+' needs level '+it.lv,'bad'); UI_SFX.error(); return; }
  netSend({t:'equip',id}); UI_SFX.pickup();
}
function unequip(slot){ if(slot!=='weapon') netSend({t:'unequip',slot}); }
function giveAll(){ netSend({t:'dev',cmd:'giveAll'}); }
