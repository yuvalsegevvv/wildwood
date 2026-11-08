//@ Three weapons at once on the server: the class switch when the character played (or the Wanderer's path) changes, and the weapon an equip puts in its class's slot
/* Agent map (rules and the saved field: shared/wpn.js; test: tools/bond-smoke.js, the weapons block; hooks: grep -rn "// wpn:" src).
   wpnApplyP(p): re-sync gear.eq.wpn / eq.weapon to the active class (after bd {a:'play'}, a path change); when the class (the weapon in hand) changed: pgear event, recalcP, and the main quest's
   'class' act fires. wpnEquipP(p,it): a weapon item goes into its class's slot; it becomes eq.weapon only when no character is played or its class is the played one's.
   wpnSwapG(gear,old,new): an upgrade (temper, reroll, scroll) replaced the last bag copy of a carried weapon: its slot follows.
   wpnClassP(p,cls): the weapon of a class in hand (a path change).
   Used by: server/bond.js (bdPlayP), server/wanderer.js (wdPathP), server/economy.js (equipP, equipClassP). */
function wpnApplyP(p){
  const was=classOfGear(p.gear), changed=wpnSyncG(p.gear,p.level);
  if(changed){ gearChangedP(p); if(classOfGear(p.gear)!==was) mqActP(p,'class'); }
}
// put the weapon of a class in hand (the carried one, else the best owned, else the basic one): a path change while the Wanderer is the character in play or nobody is picked
function wpnClassP(p,cls){
  if(!WPN_CLS.includes(cls)||classOfGear(p.gear)===cls) return;
  const W=p.gear.eq.wpn||(p.gear.eq.wpn={}); if(!(typeof W[cls]==='string'&&p.gear.inv.includes(W[cls]))) W[cls]=wpnBestG(p.gear,cls,p.level);
  p.gear.eq.weapon=W[cls]; gearChangedP(p); mqActP(p,'class');
}
function wpnEquipP(p,it){
  const g=p.gear, c=CLASS_OF[it.slot], pc=wpnPlayCls(g), W=g.eq.wpn||(g.eq.wpn={});
  W[c]=it.id;
  if(!pc||pc===c) g.eq.weapon=it.id;
  else toastTo(p.id,it.name+' is carried: you use it when you play a '+CLASSES[c].name.toLowerCase(),'good');
}
function wpnSwapG(gear,oldId,newId){
  const W=gear.eq&&gear.eq.wpn; if(!W||gear.inv.includes(oldId)) return;
  for(const c of WPN_CLS) if(W[c]===oldId) W[c]=newId;
}
