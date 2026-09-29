//@ Inventory key and first-time gear setup
/* ----- keys ----- */
addEventListener('keydown',e=>{
  if(e.code==='Escape') closePanels();
  if(!started||customizing) return;
  if(kbIs(e.code,'inv')) toggleInv();
});
if(!ITEM[GEAR.eq.weapon]) GEAR.eq.weapon=WEAPON_OF[CLASSES[LOOK.cls]?LOOK.cls:'warrior']+'1';
LOOK.cls=clsOf();
rebuildHiker(); setActionBar(); renderInv();
