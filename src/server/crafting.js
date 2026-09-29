//@ Crafting, brewing and potions on the server: making gear from ore and logs, brewing potions from herbs (both in a village, at the NPCs), drinking them (healing at once, might and guard for a while)
/* Messages: craft{slot,tier,rar} (rules and prices: shared/crafting.js), brew{id,n}, potion{k} (k: heal / might / guard; the strongest one you own is
   drunk). Events: craft [pid, item id], brew [pid, potion id, n], pot [pid, kind, tier, seconds] (a potion drunk: the client starts that kind's
   cooldown and shows the buff). Potion buffs live in p.potb {might|guard: {until, v}} and are read by rollDmgS (might) and hurtP (guard) through potBuffP. */
function potBuffP(p,kind){ const b=p.potb&&p.potb[kind]; return b&&S.t<b.until?b.v:0; }
function craftP(p,slot,t,r){
  t=clampInt(t,0,TIERS-1,-1); r=clampInt(r,0,CRAFT_MAX_RAR,-1);
  if(p.dead||!canCraft(slot,t,r)) return;
  if(!inVillage(p)){ toastTo(p.id,'Crafting is done at the weaponsmith\'s and the armourer\'s in a village','bad'); return; }
  const C=craftCost(slot,t,r), id=itemId(slot,t,r), it=ITEM[id];
  if((p.gear.res[C.res]||0)<C.n){ toastTo(p.id,'You need '+C.n+' '+RES[C.res].name,'bad'); return; }
  if(p.gear.coins<C.coins){ toastTo(p.id,'The fee is '+C.coins+' coins','bad'); return; }
  if(p.gear.inv.length>=BAG_MAX){ toastTo(p.id,'Your bag is full','bad'); return; }
  p.gear.res[C.res]-=C.n; if(!p.gear.res[C.res]) delete p.gear.res[C.res];
  p.gear.coins-=C.coins; addItemP(p,id,true);
  toastTo(p.id,'Crafted: '+it.name,'loot r'+it.rar); ev('craft',p.id,id); mqActP(p,'craft',1,{kind:it.kind,tier:t});
}
function brewP(p,id,n){
  const P=POTS[id]; if(!P||p.dead) return;
  if(!inVillage(p)){ toastTo(p.id,'Brewing is done at the healer\'s in a village','bad'); return; }
  const have=p.gear.pot[id]||0; n=Math.min(clampInt(n,1,20,1),POT_MAX-have);
  if(n<=0){ toastTo(p.id,'You cannot carry more '+P.name+'s','bad'); return; }
  for(const h of P.herbs) n=Math.min(n,Math.floor((p.gear.res[h.res]||0)/h.n));
  n=Math.min(n,Math.floor(p.gear.coins/P.coins));
  if(n<1){ toastTo(p.id,'You need '+P.herbs.map(h=>h.n+' '+RES[h.res].name).join(' and ')+' and '+P.coins+' coins for one '+P.name,'bad'); return; }
  for(const h of P.herbs){ p.gear.res[h.res]-=h.n*n; if(!p.gear.res[h.res]) delete p.gear.res[h.res]; }
  p.gear.coins-=P.coins*n; p.gear.pot[id]=have+n; p.dirty=true;
  toastTo(p.id,'Brewed '+n+' x '+P.name,'good'); ev('brew',p.id,id,n); mqActP(p,'brew',n,{kind:P.kind,tier:P.tier});
}
function drinkP(p,kind){
  const K=POT_KINDS[kind]; if(!K||p.dead) return;
  const P=potionToDrink(p.gear.pot,kind); if(!P){ toastTo(p.id,'You have no '+K.name,'bad'); return; }
  p.potCd=p.potCd||{}; if((p.potCd[kind]||0)>S.t) return;
  if(kind==='heal'&&p.hp>=p.maxHp){ toastTo(p.id,'You are not hurt','bad'); return; }
  p.gear.pot[P.id]--; if(!p.gear.pot[P.id]) delete p.gear.pot[P.id];
  p.potCd[kind]=S.t+K.cd;
  if(kind==='heal') healP(p,p.maxHp*POT_HEAL[P.tier]);
  else { p.potb=p.potb||{}; p.potb[kind]={until:S.t+POT_DUR,v:POT_BUFF[P.tier]}; }
  p.dirty=true; ev('pot',p.id,kind,P.tier,kind==='heal'?0:POT_DUR); mqActP(p,'potion',1,{kind});
}
