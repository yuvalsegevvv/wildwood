//@ Weapon and armour shops
/* ----- shops (Tomas: weapons, Ilse: armor) ----- */
let shopTab='buy';
function openShop(n){ openPanel('shop',n); shopTab='buy'; renderShop(); }
function renderShop(){
  const n=panelNPC; if(!n) return;
  const kind=n.def.role==='weaponsmith'?'weapon':'armor';
  $('#shopTitle').textContent=n.def.name+(kind==='weapon'?"'s weapons":"'s armor");
  $('#shopCoins').textContent=GEAR.coins+' coins';
  document.querySelectorAll('[data-shoptab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.shoptab===shopTab));
  let h='';
  if(shopTab==='buy'){
    const mins=Math.max(1,Math.round((1-dayClock)*DAY_SECONDS/60));
    h+=`<p class="shop-note">Unlimited stock. Each one you buy costs 20% more than the last, until sunrise (in about ${mins} min).</p>`;
    for(const it of ITEM_LIST.filter(i=>i.kind===kind&&i.rar===0).sort((a,b)=>a.tier-b.tier||a.slot.localeCompare(b.slot))){
      const own=GEAR.inv.filter(x=>x===it.id).length, n=(GEAR.bought||{})[it.id]||0, price=shopPrice(it,n);
      const note=[own?'owned x'+own:'',n?`<span class="up-price">bought ${n} today (+${Math.round(n*SHOP_STEP*100)}%)</span>`:''].filter(Boolean).join(' &middot; ');
      h+=row(it,`<button class="chip buy" data-buy="${it.id}" ${GEAR.coins<price?'disabled':''}>${price} coins</button>`,note);
    }
  } else {
    const counts={}; GEAR.inv.forEach(id=>{ if(ITEM[id].kind===kind) counts[id]=(counts[id]||0)+1; });
    const ids=Object.keys(counts).sort((a,b)=>ITEM[a].tier-ITEM[b].tier||ITEM[a].rar-ITEM[b].rar);
    if(!ids.length) h='<p class="muted">Nothing to sell here.</p>';
    for(const id of ids){
      const it=ITEM[id], locked=Object.values(GEAR.eq).includes(id)&&counts[id]<2, val=sellPrice(it);
      h+=row(it,locked?'<span class="tag on">Equipped</span>':`<button class="chip" data-sell="${id}">Sell ${val}</button>`,'x'+counts[id]);
    }
  }
  $('#shopBody').innerHTML=h;
  $('#shopBody').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const it=ITEM[b.dataset.buy]; if(GEAR.coins<shopPrice(it,(GEAR.bought||{})[it.id]||0)) return; netSend({t:'buy',id:it.id}); UI_SFX.pickup(); });
  $('#shopBody').querySelectorAll('[data-buy]').forEach(b=>{ const it=ITEM[b.dataset.buy]; if(GEAR.coins<shopPrice(it,(GEAR.bought||{})[it.id]||0)) b.disabled=true; });
  $('#shopBody').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{ netSend({t:'sell',id:b.dataset.sell}); UI_SFX.click(); });
}
document.querySelectorAll('[data-shoptab]').forEach(b=>b.addEventListener('click',()=>{ shopTab=b.dataset.shoptab; renderShop(); }));

