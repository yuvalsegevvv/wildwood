//@ Bond Orbs on the client (minimal; step 16 builds the Bonds tab): the orb stall's panel (24 characters, buy 1 or 10, the pouch's pick), the hour's Stirrings picks, the orb and stir events
/* Agent map (skills revamp step 13-14; server half: server/bond-orbs.js, bond-stir.js; protocol: docs/PROTOCOL.md; test: client-smoke).
   Globals: BDC_STIR = the hour's picks {h, z: {land: zone key}, b: boss id, k: 'dg' | 'rd', id} (welcome and event stir; null before the first), bdcOpenStall(npc) (role 'orbs', talking.js openRolePanel),
   bdcRender() (the panel; re-drawn by applyYou while open), bdcOnOrb(set, stones, coins) (event orb: a toast), bdcOnStir(msg).
   Reads the gear mirror: GEAR.bd[<set>] {b, st, o}, GEAR.bd.pick, GEAR.bd.chg. Messages: bd {a:'orb', set, n}, bd {a:'pick', set}. */
var BDC_STIR=null;
function bdcOnStir(msg){ BDC_STIR=msg&&typeof msg==='object'?msg:null; }
function bdcOpenStall(n){ openPanel('orbs',n||null); bdcRender(); }
function bdcOnOrb(set,stones,coins){
  const S=bdOwnKey(SS_SETS,set)?SS_SETS[set]:null; if(!S) return;
  toast('Bond Orb opened: '+(+stones||0)+' '+S.char.name+' Bondstone'+(stones===1?'':'s')+(coins>0?' (+'+coins+' coins beyond Bond VI)':''),'loot r3');
  if(UI_SFX&&UI_SFX.success) UI_SFX.success(); if(!$('#orbs').hidden) bdcRender();
}
function bdcRender(){
  if($('#orbs').hidden) return;
  const g=GEAR||{}, B=g.bd||{}, coins=g.coins||0, chg=B.chg|0;
  $('#obCoins').textContent=coins+' coins';
  let h='<p class="lo-intro">Every character\'s Bond Orb costs '+BD_ORB_PRICE+' coin. Orbs are opened by playing the hour\'s Stirrings: every '+BD_STIR_CHARGE+' charge (a kill at the stirring spot of your land) opens one. The pouch opens your pick first, else the character you hold most orbs of. Charge: <b>'+chg+' / '+BD_STIR_CHARGE+'</b>.</p>';
  for(const k of SS_ORDER){
    if(!bdSetOk(k)) continue;
    const S=SS_SETS[k], e=bdOwnKey(B,k)&&typeof B[k]==='object'?B[k]:{b:-1,st:0}, o=e.o|0, pick=B.pick===k;
    h+='<div class="it"><div class="it-main"><b>'+S.char.name+'</b><span>Bond '+(e.b>=0?BD_ROMAN[e.b]:'locked')+' &middot; '+(e.st|0)+' Bondstones &middot; '+o+' orb'+(o===1?'':'s')+'</span></div>'+
      '<div class="br-btns"><button class="chip'+(pick?' on':'')+'" data-bdpick="'+k+'">'+(pick?'Picked':'Pick')+'</button><button class="chip buy" data-bdorb="'+k+'" data-n="1" '+(coins>=BD_ORB_PRICE?'':'disabled')+'>Buy</button><button class="chip" data-bdorb="'+k+'" data-n="10" '+(coins>=10*BD_ORB_PRICE?'':'disabled')+'>x10</button></div></div>';
  }
  const bd=$('#obBody'); bd.innerHTML=h;
  bd.querySelectorAll('[data-bdorb]').forEach(b=>b.onclick=()=>{ netSend({t:'bd',a:'orb',set:b.dataset.bdorb,n:+b.dataset.n}); UI_SFX.pickup(); });
  bd.querySelectorAll('[data-bdpick]').forEach(b=>b.onclick=()=>{ netSend({t:'bd',a:'pick',set:b.dataset.bdpick}); UI_SFX.click(); });
}
