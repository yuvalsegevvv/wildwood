//@ The Void Anchor and the Ascendant Prism on the server (B11): abyss{a:'lock',id,i} locks one line of a 2-3 line piece, abyss{a:'prism',id} puts a prism on a rolled piece; both live inside the piece's roll code
/* agent map (docs/ABYSS.md section 5b; the code format: shared/rolls.js, docs/ROLLS.md)
   exports: abItemP(p,kind,id,i,worn) (kind 'lock' | 'prism'; abMsgP calls it)
   save:    gear.ab.lock / gear.ab.prism (counts, bought in the shop); the effect is in the piece's id
   rules:   the piece is in gear.inv (a worn one is meant with worn=true, or when no spare is in the bag, as rlRollP does); every check comes before the charge, then one item is spent, the id is rebuilt with dgIdOfQ,
            replaced in the bag (and the slot, and a carried weapon's slot), rlRefreshP through gearChangedP, and the `you` update goes out (p.dirty). Event reroll [pid,newId,oldId] so the forge redraws.
   test:    tools/abyss-smoke.js, tools/economy-fuzz.js */
function abItemP(p,kind,id,i,worn){
  const it=typeof id==='string'?ITEM[id]:null, g=p.gear.ab, key=kind==='prism'?'prism':'lock', name=kind==='prism'?AB_PRISM_NAME:AB_LOCK_NAME;
  if(!g||(g[key]|0)<1){ toastTo(p.id,'You have no '+name,'bad'); return; }
  if(!it||!p.gear.inv.includes(id)){ toastTo(p.id,'That piece is not in your bag','bad'); return; }
  const why=kind==='prism'?abPrismWhy(it):abLockWhy(it,i); if(why){ toastTo(p.id,why,'bad'); return; }
  const q=dgParse(id), code=kind==='prism'?rlPrismCode(q&&q.roll):rlLockCode(q&&q.roll,i); if(!code){ toastTo(p.id,'That cannot be used there','bad'); return; }
  const nid=dgIdOfQ(q,q.rar,q.n,code); if(!ITEM[nid]){ toastTo(p.id,'That cannot be used there','bad'); return; }
  const slot=Object.keys(p.gear.eq).find(s=>p.gear.eq[s]===id), wornCopy=!!slot&&(!!worn||unwornCount(p,id)<1);
  g[key]=(g[key]|0)-1;
  p.gear.inv[p.gear.inv.lastIndexOf(id)]=nid; wpnSwapG(p.gear,id,nid);
  if(wornCopy){ p.gear.eq[slot]=nid; gearChangedP(p); } else p.dirty=true;
  toastTo(p.id,(kind==='prism'?AB_PRISM_NAME+' used: ':'Line locked: ')+ITEM[nid].name,'loot r'+ITEM[nid].rar); ev('reroll',p.id,nid,id);
}
