//@ Crafting and brewing rules: weapons from ore at the weaponsmiths', armour from logs at the armourers', potions (healing, might, guard) from herbs at the healers'. Neither is a profession: they are done at NPCs, and the professions supply the materials. Pure.
/* CRAFTING. A piece of gear of any tier can be made for resources of that tier's grade (shared/professions.js: ore for the three weapons, logs for
   helmet, top, bottom and shoes) and a small fee in coins. A common piece costs CRAFT_BASE[tier] x the piece's weight (SLOT_PRICE: a weapon 1.3, a
   helmet 0.8...); a rare one costs CRAFT_RAR[1] times as much and an epic one CRAFT_RAR[2] times (a little less than merging three or nine common
   ones at a forge would take). Unique and legendary pieces are not crafted: they come from drops and from merging.
   BREWING. A potion costs herbs of its land's grade and a fee. Three kinds, each in three strengths (minor / plain / greater, from the home forest's,
   the vale's and the Hoarfrost's herbs): healing (heals a share of your health at once), might (+damage for a while) and guard (-damage taken for a
   while). A potion is drunk with its key (server/crafting.js, game/ui/potions.js); the best strength you own is the one that is used. */
const CRAFT_BASE=[5,6,8,10,12,14], CRAFT_RAR=[1,2.5,6], CRAFT_MAX_RAR=2, CRAFT_FEE=0.1;
const craftSlots=kind=>kind==='weapon'?WEAPON_SLOTS:ARMOR_SLOTS;
// what making slot / tier t (0..5) / rarity r (0..2) costs: {res, n, coins} (res: the resource id)
function craftCost(slot,t,r){
  const it=ITEM[itemId(slot,t,r)], res=WEAPON_SLOTS.includes(slot)?ORE_GRADES[t][0]:LOG_GRADES[t][0];
  return {res,n:Math.max(2,Math.round(CRAFT_BASE[t]*SLOT_PRICE[slot]*CRAFT_RAR[r])),coins:Math.round(it.price*CRAFT_FEE)};
}
const canCraft=(slot,t,r)=>ALL_SLOTS.includes(slot)&&Number.isInteger(t)&&t>=0&&t<TIERS&&Number.isInteger(r)&&r>=0&&r<=CRAFT_MAX_RAR;
/* POTIONS. herbs: [heal herbs, strengthening herbs] of the land's grade; cd: seconds before the same kind can be drunk again */
const POT_KINDS={
  heal:{name:'Healing Potion',herbs:[3,0],cd:15,key:'pot1',col:'#e2506a'},
  might:{name:'Draught of Might',herbs:[1,2],cd:8,key:'pot2',col:'#e8963a'},
  guard:{name:'Ironbark Tonic',herbs:[0,3],cd:8,key:'pot3',col:'#5a9ae0'}};
const POT_KIND_IDS=Object.keys(POT_KINDS), POT_TIER=['Minor ','','Greater '];
const POT_HEAL=[0.35,0.5,0.7], POT_BUFF=[0.2,0.3,0.4], POT_DUR=90, POT_FEE=[8,30,90], POT_MAX=99;
const POTS={};
for(const k of POT_KIND_IDS) for(let t=0;t<3;t++){
  const K=POT_KINDS[k], id=k+(t+1);
  POTS[id]={id,kind:k,tier:t,land:t,name:POT_TIER[t]+K.name,coins:POT_FEE[t],
    herbs:K.herbs.map((n,j)=>n?{res:HERB_LANDS[t][j][0],n}:null).filter(Boolean),
    text:k==='heal'?'Restores '+Math.round(POT_HEAL[t]*100)+'% of your health':k==='might'?'+'+Math.round(POT_BUFF[t]*100)+'% damage for '+POT_DUR+' s':'-'+Math.round(POT_BUFF[t]*100)+'% damage taken for '+POT_DUR+' s'};
}
// the potion of this kind that a drink uses: the strongest one owned (or null)
function potionToDrink(pot,kind){ for(let t=2;t>=0;t--) if((pot[kind+(t+1)]||0)>0) return POTS[kind+(t+1)]; return null; }
function sanitizePots(g){
  const out={};
  if(g&&g.pot&&typeof g.pot==='object') for(const id in POTS){ const n=Math.max(0,Math.min(POT_MAX,Math.floor(+g.pot[id])||0)); if(n) out[id]=n; }
  return out;
}
