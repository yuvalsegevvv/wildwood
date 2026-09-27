//@ Greta's forge: merge three identical items into one of the next rarity (common > rare > epic > unique > legendary)
function openForge(n){ openPanel('forge',n); renderForge(); }
const ARROW='<svg class="fg-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
function renderForge(){
  if($('#forge').hidden) return;
  $('#forgeCoins').textContent=GEAR.coins+' coins';
  const counts=bagCounts(), worn={}; for(const s in GEAR.eq){ const id=GEAR.eq[s]; if(id) worn[id]=(worn[id]||0)+1; }
  const ids=Object.keys(counts).filter(id=>ITEM[id].rar<4&&counts[id]>=2)
    .sort((a,b)=>(counts[b]>=MERGE_COUNT)-(counts[a]>=MERGE_COUNT)||ITEM[b].rar-ITEM[a].rar||ITEM[b].tier-ITEM[a].tier||a.localeCompare(b));
  let h=`<p class="fg-intro">Bring me three of the same piece (same name, level and rarity) and I will forge them into one of the next rarity. It still needs the same level to wear, but it is a good deal stronger. I don't touch what you're wearing.</p>
    <div class="fg-ladder">${RARITY.map((r,i)=>`<span style="color:${RAR_COL[i]}">${r}</span>`).join(ARROW)}</div>`;
  if(!ids.length) h+=`<p class="muted">You don't have two of anything yet. Monsters drop items now and then, and the shops sell common ones.</p>`;
  for(const id of ids){
    const it=ITEM[id], nx=ITEM[mergedId(id)], n=counts[id], ready=n>=MERGE_COUNT;
    h+=`<div class="fg-row${ready?' ready':''}"><div class="fg-in">${[0,1,2].map(k=>`<span class="it-ico r${it.rar}${k<n?'':' miss'}">${itemIcon(it)}</span>`).join('')}</div>${ARROW}
      <span class="it-ico big r${nx.rar}">${itemIcon(nx)}</span>
      <div class="fg-main"><b style="color:${RAR_COL[nx.rar]}">${nx.name}</b><span>Level ${nx.lv} &middot; ${itemStat(nx)} <span class="up">(was ${itemStat(it).replace(/^\+/,'')})</span></span><span class="muted">You have ${n} in your bag${worn[id]?', plus one you are wearing':''}</span></div>
      <button class="chip forge" data-merge="${id}" ${ready?'':'disabled'}>${ready?'Merge 3':'Need '+(MERGE_COUNT-n)+' more'}</button></div>`;
  }
  $('#forgeBody').innerHTML=h;
  $('#forgeBody').querySelectorAll('[data-merge]').forEach(b=>b.onclick=()=>{ b.disabled=true; b.textContent='Forging…'; netSend({t:'merge',id:b.dataset.merge}); });
}
