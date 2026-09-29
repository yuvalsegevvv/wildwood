//@ Crafting and brewing on the client: the Craft tab of the weaponsmiths' and armourers' shops (gear from ore and logs), and the brewing panel of the healers (potions from herbs)
/* The rules are in shared/crafting.js and the server (server/crafting.js) checks everything; this only draws the options and sends
   craft{slot,tier,rar} / brew{id,n}. A recipe is greyed out until you have the resources and the coins. */
let crTier=-1, crRar=0;   // the tier (-1: the best one you have the level for) and rarity shown in the Craft tab
const resOwn=id=>((GEAR&&GEAR.res)||{})[id]||0;
// the Craft tab's html (kind: 'weapon' at the weaponsmith's, 'armor' at the armourer's); bindCraft wires it up after it is in the page
function craftHtml(kind){
  const best=Math.min(TIERS-1,tierFor(PL.level)), tier=crTier<0?best:crTier;
  let h=`<p class="shop-note">${kind==='weapon'?'Bring ore and I will forge it into a weapon. Ore of each grade lies in the zones of its gear tier: copper in the inner woods, then iron, silverstone, sunstone, hagane and rime ore.':'Bring logs and I will build them into armour. Logs of each grade grow in the zones of its gear tier: pine, oak, yew, sunwood, cherry and frostpine.'} A rarer piece takes more, and a small fee in coins.</p>
    <div class="chips cr-tiers">${ORE_GRADES.map((_,t)=>`<button class="chip" data-crtier="${t}" aria-pressed="${t===tier}">${TOOL_MAT[t]}</button>`).join('')}</div>
    <div class="chips cr-rar">${RARITY.slice(0,CRAFT_MAX_RAR+1).map((r,i)=>`<button class="chip" data-crrar="${i}" aria-pressed="${i===crRar}"><i class="cr-dot" style="background:${RAR_COL[i]}"></i>${r}</button>`).join('')}</div>`;
  for(const slot of craftSlots(kind)){
    const it=ITEM[itemId(slot,tier,crRar)], C=craftCost(slot,tier,crRar), have=resOwn(C.res), enough=have>=C.n, can=enough&&(GEAR.coins||0)>=C.coins;
    h+=row(it,`<button class="chip buy" data-craft="${slot}" ${can?'':'disabled'}>Craft</button>`,
      `<span class="${enough?'':'cr-short'}"><i class="cr-dot" style="background:${RES[C.res].col}"></i>${C.n} ${RES[C.res].name} (you have ${have})</span> &middot; <span class="${(GEAR.coins||0)>=C.coins?'':'cr-short'}">${C.coins} coins</span>`);
  }
  return h;
}
function bindCraft(){
  const B=$('#shopBody'), tier=()=>crTier<0?Math.min(TIERS-1,tierFor(PL.level)):crTier;
  B.querySelectorAll('[data-crtier]').forEach(b=>b.onclick=()=>{ crTier=+b.dataset.crtier; renderShop(); UI_SFX.click(); });
  B.querySelectorAll('[data-crrar]').forEach(b=>b.onclick=()=>{ crRar=+b.dataset.crrar; renderShop(); UI_SFX.click(); });
  B.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>{ b.disabled=true; netSend({t:'craft',slot:b.dataset.craft,tier:tier(),rar:crRar}); UI_SFX.pickup(); });
}
/* ---- the brewing panel (role 'brew': the healers) ---- */
function openBrew(n){ openPanel('brew',n||null); renderBrew(); }
function renderBrew(){
  if($('#brew').hidden) return;
  const g=GEAR||{}, pot=g.pot||{}, coins=g.coins||0;
  $('#brTitle').textContent=panelNPC?panelNPC.def.name+'\'s kettle':'Brewing'; $('#brCoins').textContent=coins+' coins';
  let h=`<p class="lo-intro">Bring herbs and a few coins and I will brew them into potions. Drink them in a fight: <b>${kbName('pot1')||'Z'}</b> healing, <b>${kbName('pot2')||'X'}</b> might, <b>${kbName('pot3')||'C'}</b> guard (the strongest one you carry is used). Herbs are cut with a sickle (Gathering, learned at a Wayfarers' Lodge): each land has its own, and the stronger the potion the farther the herbs grow.</p>`;
  for(const k of POT_KIND_IDS){
    h+=`<div class="inv-h">${POT_KINDS[k].name}</div>`;
    for(let t=0;t<3;t++){
      const P=POTS[k+(t+1)], owned=pot[P.id]||0;
      let can=coins>=P.coins;
      const need=P.herbs.map(x=>{ const have=resOwn(x.res), ok=have>=x.n; if(!ok) can=false; return `<span class="${ok?'':'cr-short'}"><i class="cr-dot" style="background:${RES[x.res].col}"></i>${x.n} ${RES[x.res].name} (${have})</span>`; }).join(' + ');
      h+=`<div class="it"><span class="it-ico pot">${potIcon(k,t)}</span><div class="it-main"><b style="color:${POT_KINDS[k].col}">${P.name}</b><span>${P.text}</span><span class="req">${need} &middot; <span class="${coins>=P.coins?'':'cr-short'}">${P.coins} coins</span>${owned?' &nbsp; you carry '+owned:''}</span></div>
        <div class="br-btns"><button class="chip buy" data-brew="${P.id}" data-n="1" ${can?'':'disabled'}>Brew</button><button class="chip" data-brew="${P.id}" data-n="5" ${can?'':'disabled'}>x5</button></div></div>`;
    }
  }
  $('#brBody').innerHTML=h;
  $('#brBody').querySelectorAll('[data-brew]').forEach(b=>b.onclick=()=>{ netSend({t:'brew',id:b.dataset.brew,n:+b.dataset.n}); UI_SFX.pickup(); });
}
