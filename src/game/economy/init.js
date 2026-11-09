//@ Inventory key and first-time gear setup
/* ----- keys ----- */
addEventListener('keydown',e=>{
  if(e.code==='Escape') closePanels();
  if(!started||customizing) return;
  if(kbIs(e.code,'inv')) toggleInv();
  if(kbIs(e.code,'mats')) toggleMats();
});
if(!ITEM[GEAR.eq.weapon]) GEAR.eq.weapon=WEAPON_OF[CLASSES[LOOK.cls]?LOOK.cls:'warrior']+'1';
LOOK.cls=clsOf();
rebuildHiker(0.3); hikerDraft=true; setActionBar(); renderInv();   // (draft detail now, the real hiker after Ready: a second of the start)
