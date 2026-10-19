//@ The gem shop (the shop icon in the main menu): your gems, the free ways to earn them (daily quests, the placeholder ad, an icon grid of achievements), the public testing button (+1000 gems) and the outfit sets for sale
/* Agent map. Markup #gemShop / #bGems in index.html; messages gemtest / gembuy (server/amber.js); the purse is GEAR.gem and the bought sets GEAR.os (shared/amber.js).
   Free sources: shared/gem-sources.js (GS_ACH, GEM_*), server/gem-sources.js (adwatch). gemRefresh() is called from applyGear (economy/items.js). The editor's locked outfit tiles buy through the same gembuy message (ui/character-editor.js osTapLocked). Test: tools/amber-smoke.js */
const GS_ICON={   // one 24x24 stroke icon per achievement kind (GS_ACH[].ic)
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  crown:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  scroll:'<path d="M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V4"/><path d="M7 4a2 2 0 0 0-2 2v2h4"/><path d="M12 9h4M12 13h4"/>',
  book:'<path d="M4 5.5C6.5 4 9.5 4 12 5.5c2.5-1.5 5.5-1.5 8 0v13c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z"/><path d="M12 5.5v13"/>',
  road:'<path d="M9 20L10.5 4M15 20L13.5 4"/><path d="M12 6v2M12 11v2M12 16v2"/>',
  bolt:'<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  pick:'<path d="M4 20L14 10"/><path d="M8 4c5-1 11 2 12 8-3-3-6-4-10-3z"/>',
  hat:'<path d="M3 17h18"/><path d="M6 17c0-5 2-9 6-9s6 4 6 9"/>',
  sword:'<path d="M20 4l-9 9"/><path d="M14 4h6v6"/><path d="M6 14l4 4M4 20l3-3"/>',
  skull:'<path d="M5 12a7 7 0 0 1 14 0v3l-2 1v3H7v-3l-2-1z"/><circle cx="9.5" cy="12" r="1.2"/><circle cx="14.5" cy="12" r="1.2"/>',
  flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  shirt:'<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"/>',
  door:'<path d="M6 21V4h12v17"/><path d="M4 21h16"/><circle cx="15" cy="13" r=".8"/>',
  coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 10c0-1.5 5-1.5 5 0s-5 2-5 3.5 5 1.5 5 0"/>',
  flag:'<path d="M5 21V4"/><path d="M5 5h13l-3 4 3 4H5"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  wallet:'<path d="M4 7h15v13H4z"/><path d="M4 7l12-3v3"/><circle cx="15" cy="13" r="1"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  gem:'<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-2 5 5 11 5-11-2-5"/>',
  ring:'<circle cx="12" cy="15" r="6"/><path d="M9 6l3-3 3 3-3 3z"/>',
  ghost:'<path d="M5 20V10a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2z"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="11" r="1"/>'};
let achSel=null;
function gsAchDone(a){ return !!(GEAR.ach&&GEAR.ach.includes(a.id)); }
function gemFreeRefresh(){
  const D=GEAR.dq||{ids:[],got:[]}, A=GEAR.ad||{d:0,n:0}, left=Math.max(0,GEM_AD_DAY-(A.d===gsDayOf(Date.now())?A.n:0));
  const hrs=Math.ceil((86400000-Date.now()%86400000)/3600000);
  $('#gemFreeNote').textContent='Daily quests on the quest board: '+(D.got.length)+' / '+(D.ids.length||GEM_DQ_COUNT)+' handed in today (+'+GEM_DQ_EACH+' gems each, +'+GEM_DQ_ALL+' more for all). New ones in about '+hrs+' h (00:00 UTC). Main and side quest steps pay gems too.';
  const b=$('#gemAd'); b.textContent='Watch an ad (+'+GEM_AD+' gems) - '+left+' left today'; b.disabled=!left;
  const grid=$('#achGrid'); grid.innerHTML='';
  for(const a of GS_ACH){
    const t=document.createElement('button'); t.className='ach'+(gsAchDone(a)?' done':'')+(achSel===a.id?' sel':''); t.setAttribute('aria-label',a.name);
    t.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(GS_ICON[a.ic]||GS_ICON.star)+'</svg>'+(a.tier?'<span class="at">'+GS_ROMAN[a.tier]+'</span>':'')+'<span class="ag">'+a.gems+'</span>';
    t.addEventListener('click',()=>{ achSel=a.id; gemFreeRefresh(); });
    grid.append(t);
  }
  $('#achCount').textContent=GS_ACH.filter(gsAchDone).length+' / '+GS_ACH.length;
  const s=GS_ACH.find(a=>a.id===achSel); $('#achInfo').textContent=s?s.name+(s.tier?' '+GS_ROMAN[s.tier]:'')+': '+s.text+' ('+s.gems+' gems)'+(gsAchDone(s)?' - done':''):'Tap an icon to see what it asks. Each pays gems once, by itself.';
}
function gemRefresh(){
  const bal=(GEAR.gem||0)+' gems'; $('#gemBal').textContent=bal;
  if($('#gemShop').hidden) return;
  gemFreeRefresh();
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
$('#gemAd').addEventListener('click',()=>netSend({t:'adwatch'}));   // a PLACEHOLDER: no ad service yet
