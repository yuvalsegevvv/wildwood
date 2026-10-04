//@ Weapon and armour shops, and Odran the peddler (a bit of everything, and curiosities he will not sell)
/* ----- shops (Tomas: weapons, Ilse: armor; Odran, role 'peddler': both, and he buys anything) ----- */
let shopTab='buy';
// Odran's curiosities (docs/STORY.md: hints, and he takes them back if you look too long)
const ODRAN_CURIOS=['a coin with a sun inside a ring, far too round and far too even; a spoon with a hole in it; a bottle of something that smells of nothing at all.','a lantern with no flame, wrapped in cloth; a folded map of the coast with no villages on it; a very small, very old key.','a slab of grey plate that a hunter swore was a dragon scale; a glass bulb, small and warm to the touch; a map of the north with a ring and a small sun drawn in its corner.'];
function openShop(n){ openPanel('shop',n); shopTab='buy'; renderShop(); }
function renderShop(){
  const n=panelNPC; if(!n) return;
  const ped=n.def.role==='peddler', kind=ped?null:n.def.role==='weaponsmith'?'weapon':'armor', ofKind=i=>!kind||i.kind===kind||(kind==='armor'&&(i.kind==='ring'||i.kind==='pendant'));   // dungeons: the armourer also buys rings and pendants
  $('#shopTitle').textContent=n.def.name+(ped?"'s cart":kind==='weapon'?"'s weapons":"'s armor");
  $('#shopCoins').textContent=GEAR.coins+' coins';
  document.querySelectorAll('[data-shoptab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.shoptab===shopTab));
  document.querySelector('[data-shoptab="craft"]').hidden=ped;   // the smiths and armourers craft; Odran only trades
  let h='';
  if(shopTab==='craft') h=craftHtml(kind);
  else if(shopTab==='buy'){
    const mins=Math.max(1,Math.round((1-dayClock)*DAY_SECONDS/60));
    h+=`<p class="shop-note">Unlimited stock. Each one you buy costs 20% more than the last, until sunrise (in about ${mins} min).</p>`;
    if(ped) h+=`<p class="shop-note">On the cart's top shelf, not for sale: ${ODRAN_CURIOS[(n.def.vil||1)-1]}</p>`;
    for(const it of ITEM_LIST.filter(i=>ofKind(i)&&i.rar===0&&(!ped||i.tier<=tierFor(PL.level))).sort((a,b)=>a.tier-b.tier||a.slot.localeCompare(b.slot))){
      const own=GEAR.inv.filter(x=>x===it.id).length, n=(GEAR.bought||{})[it.id]||0, price=shopPrice(it,n);
      const note=[own?'owned x'+own:'',n?`<span class="up-price">bought ${n} today (+${Math.round(n*SHOP_STEP*100)}%)</span>`:''].filter(Boolean).join(' &middot; ');
      h+=row(it,`<button class="chip buy" data-buy="${it.id}" ${GEAR.coins<price?'disabled':''}>${price} coins</button>`,note);
    }
  } else {
    const counts={}; GEAR.inv.forEach(id=>{ if(ofKind(ITEM[id])) counts[id]=(counts[id]||0)+1; });
    const ids=Object.keys(counts).sort((a,b)=>ITEM[a].tier-ITEM[b].tier||ITEM[a].rar-ITEM[b].rar);
    if(!ids.length) h='<p class="muted">Nothing to sell here.</p>';
    for(const id of ids){
      const it=ITEM[id], locked=Object.values(GEAR.eq).includes(id)&&counts[id]<2, val=sellPrice(it);
      h+=row(it,locked?'<span class="tag on">Equipped</span>':`<button class="chip" data-sell="${id}">Sell ${val}</button>`,'x'+counts[id]);
    }
  }
  $('#shopBody').innerHTML=h;
  if(shopTab==='craft') bindCraft();
  $('#shopBody').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const it=ITEM[b.dataset.buy]; if(GEAR.coins<shopPrice(it,(GEAR.bought||{})[it.id]||0)) return; netSend({t:'buy',id:it.id}); UI_SFX.pickup(); });
  $('#shopBody').querySelectorAll('[data-buy]').forEach(b=>{ const it=ITEM[b.dataset.buy]; if(GEAR.coins<shopPrice(it,(GEAR.bought||{})[it.id]||0)) b.disabled=true; });
  $('#shopBody').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{ netSend({t:'sell',id:b.dataset.sell}); UI_SFX.click(); });
}
document.querySelectorAll('[data-shoptab]').forEach(b=>b.addEventListener('click',()=>{ shopTab=b.dataset.shoptab; renderShop(); }));

