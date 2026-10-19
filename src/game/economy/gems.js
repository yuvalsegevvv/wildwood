//@ The gem shop (the shop icon in the main menu): your gems, the one public testing button (+1000 gems) and the outfit sets for sale
/* Agent map. Markup #gemShop / #bGems in index.html; messages gemtest / gembuy (server/amber.js); the purse is GEAR.gem and the bought sets GEAR.os (shared/amber.js).
   gemRefresh() is called from applyGear (economy/items.js). The editor's locked outfit tiles buy through the same gembuy message (ui/character-editor.js osTapLocked). Test: tools/amber-smoke.js */
function gemRefresh(){
  const bal=(GEAR.gem||0)+' gems'; $('#gemBal').textContent=bal;
  if($('#gemShop').hidden) return;
  $('#gemPrice').textContent=GEM_SET_PRICE+' gems each';
  const box=$('#gemList'); box.innerHTML='';
  for(const sid of SS_ORDER){
    const T=SS_SETS[sid], id=T.outfit, M=id&&CHAR_MODELS[id]; if(!M) continue;
    const row=document.createElement('div'); row.className='gem-row';
    const nm=document.createElement('span'); nm.textContent=M.name+' - '+T.name; row.append(nm);
    const b=document.createElement('button'); b.className='chip';
    if(osOwned(id)){ b.textContent='Owned'; b.disabled=true; }
    else { b.textContent='Buy for '+GEM_SET_PRICE; b.disabled=(GEAR.gem||0)<GEM_SET_PRICE; b.addEventListener('click',()=>netSend({t:'gembuy',v:id})); }
    row.append(b); box.append(row);
  }
}
$('#bGems').addEventListener('click',e=>{ e.currentTarget.blur(); if($('#gemShop').hidden){ openPanel('gemShop'); gemRefresh(); } else closePanels(); });
$('#gemFree').addEventListener('click',()=>netSend({t:'gemtest'}));
