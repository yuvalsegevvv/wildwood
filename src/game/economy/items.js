//@ Your gear as told by the server (GEAR), saved in this browser; equip / unequip requests
/* ===================== EQUIPMENT, COINS, SHOPS, QUESTS =====================
   6 tiers (level 1, 5, 10, 15, 20, 25). Weapons: sword (Warrior), bow (Archer), wand (Mage): the weapon you hold is your class.
   Armor (any class): helmet, top, bottom, shoes. It adds health and defense and changes your outfit. */
var GEAR=null;
function newGear(){ return newGearFor(CLASSES[LOOK.cls]?LOOK.cls:'warrior'); }
try{ const s=JSON.parse(localStorage.getItem('wildwood-gear-v1')||'null'); if(s&&Array.isArray(s.inv)){ GEAR=Object.assign(newGear(),s); GEAR.inv=GEAR.inv.filter(id=>ITEM[id]); } }catch(_){}
if(!GEAR) GEAR=newGear();
GEAR.q=Object.assign({active:{},ready:[],done:[]},GEAR.q||{});
function saveGear(){ if(NET&&NET.user) return; try{ localStorage.setItem('wildwood-gear-v1',JSON.stringify(GEAR)); }catch(_){} }
function gearStats(){ return gearStatsOf(GEAR); }
function effectiveLook(){ return effectiveLookOf(LOOK,GEAR); }
// the server sends your gear in every "you" update; apply it and redraw whatever changed
function applyGear(g){
  if(!g) return;
  const prevW=GEAR&&GEAR.eq.weapon, prevEq=JSON.stringify(GEAR&&GEAR.eq);
  GEAR=g; saveGear();
  if(GEAR.eq.weapon!==prevW){ LOOK.cls=clsOf(); saveLookLocal(); attachWeapons(); setActionBar(); if(customizing) renderEditor(); }
  if(JSON.stringify(GEAR.eq)!==prevEq) rebuildHiker();
  $('#plCoins').textContent=GEAR.coins;
  renderInv(); if(!$('#shop').hidden) renderShop(); if(!$('#forge').hidden) renderForge(); if(!$('#skills').hidden) renderSkills(); if(!$('#soul').hidden) renderSoul(); if(!$('#lodge').hidden) renderLodge(); if(!$('#travel').hidden) renderTravel(); if(!$('#quests').hidden) renderQuests(); renderQlog(); syncStartAll();
}
function equip(id){
  const it=ITEM[id]; if(!it) return;
  if(PL.level<it.lv){ toast(it.name+' needs level '+it.lv,'bad'); UI_SFX.error(); return; }
  netSend({t:'equip',id}); UI_SFX.pickup();
}
function unequip(slot){ if(slot!=='weapon') netSend({t:'unequip',slot}); }
function equipClass(cls){ netSend({t:'cls',cls}); }
function giveAll(){ netSend({t:'dev',cmd:'giveAll'}); }
