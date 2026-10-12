//@ version2 testing: the settings popover's "Skill sets and outfits" (unlock any set, put it on, wear its outfit) for every player; REMOVE when the real sources (M3) and the wardrobe (M4 / M5) land
/* Agent map. Server side: server/skillsets-free.js (message ft; its header lists everything to remove). Markup: #tFree in index.html. Outfits are a client choice here: the editor's own row (setLook('model', id), character-editor.js)
   does the wearing, so the look is saved and sent to the other players like any look change. Wearing an outfit also switches the hiker to the body the outfit was drawn for (its character's sex). Test: tools/client-smoke.js. */
function ssFreeWear(id){   // version2 testing: remove when M4 / M5 land
  const M=id==='base'?null:CHAR_MODELS[id];
  if(id!=='base'&&!(M&&OUTFITS[id])) return;
  if(M&&M.sexes&&M.sexes.length===1&&M.sexes[0]!==LOOK.sex) setLook('sex',M.sexes[0]);   // an outfit is drawn for its character's body
  setLook('model',id);
  toast(M?M.name+'\'s outfit is on':'Outfit taken off','good');
}
{ const sel=$('#tFreeSet');
  sel.innerHTML=SS_ORDER.map(id=>`<option value="${id}">${SS_SETS[id].char.name} - ${SS_SETS[id].name}</option>`).join('');
  $('#tFreeGet').addEventListener('click',()=>netSend({t:'ft',cmd:'set',v:sel.value}));
  $('#tFreeTry').addEventListener('click',()=>{ netSend({t:'ft',cmd:'try',v:sel.value}); ssFreeWear(SS_SETS[sel.value].outfit||'base'); });
  $('#tFreeOut').addEventListener('click',()=>ssFreeWear(SS_SETS[sel.value].outfit||'base'));
  $('#tFreeNone').addEventListener('click',()=>ssFreeWear('base'));
  $('#tFreeAll').addEventListener('click',()=>netSend({t:'ft',cmd:'all'}));
}
