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
  guard:{name:'Ironbark Tonic',herbs:[0,3],cd:8,key:'pot3',col:'#5a9ae0'},
  // version 3, the brewing options: a heal over time, and two long buffs that pay in progress (exp) and in loot (coins and drops); dur: seconds the effect lasts (default POT_DUR)
  regen:{name:'Mossblood Draught',herbs:[2,1],cd:30,dur:20,key:'pot4',col:'#7ad06a'},
  scholar:{name:'Scholar\'s Brew',herbs:[1,3],cd:60,dur:300,key:'pot5',col:'#b88ae8'},
  fortune:{name:'Fortune Tea',herbs:[2,2],cd:60,dur:300,key:'pot6',col:'#e8c84a'}};
const POT_KIND_IDS=Object.keys(POT_KINDS), POT_TIER=['Minor ','','Greater '];
const POT_HEAL=[0.35,0.5,0.7], POT_BUFF=[0.2,0.3,0.4], POT_DUR=90, POT_FEE=[8,30,90], POT_MAX=99;
// the values of the version-3 potions by strength: regen heals this share of your health every second, scholar adds this much exp, fortune this much to coins and to the drop chances
const POT_REGEN=[0.012,0.018,0.025], POT_SCHOLAR=[0.10,0.15,0.20], POT_FORTUNE=[0.10,0.15,0.20];
const potDur=kind=>POT_KINDS[kind].dur||POT_DUR;
const potVal=(kind,t)=>kind==='regen'?POT_REGEN[t]:kind==='scholar'?POT_SCHOLAR[t]:kind==='fortune'?POT_FORTUNE[t]:POT_BUFF[t];
const POTS={};
for(const k of POT_KIND_IDS) for(let t=0;t<3;t++){
  const K=POT_KINDS[k], id=k+(t+1);
  POTS[id]={id,kind:k,tier:t,land:t,name:POT_TIER[t]+K.name,coins:POT_FEE[t],
    herbs:K.herbs.map((n,j)=>n?{res:HERB_LANDS[t][j][0],n}:null).filter(Boolean),
    text:k==='heal'?'Restores '+Math.round(POT_HEAL[t]*100)+'% of your health':k==='might'?'+'+Math.round(POT_BUFF[t]*100)+'% damage for '+POT_DUR+' s'
      :k==='guard'?'-'+Math.round(POT_BUFF[t]*100)+'% damage taken for '+POT_DUR+' s'
      :k==='regen'?'Heals '+(POT_REGEN[t]*100).toFixed(1).replace('.0','')+'% of your health every second for '+K.dur+' s'
      :k==='scholar'?'+'+Math.round(POT_SCHOLAR[t]*100)+'% exp from kills for '+K.dur/60+' min':'+'+Math.round(POT_FORTUNE[t]*100)+'% coins and drops for '+K.dur/60+' min'};
}
// the potion of this kind that a drink uses: the strongest one owned (or null)
function potionToDrink(pot,kind){ for(let t=2;t>=0;t--) if((pot[kind+(t+1)]||0)>0) return POTS[kind+(t+1)]; return null; }
function sanitizePots(g){
  const out={};
  if(g&&g.pot&&typeof g.pot==='object') for(const id in POTS){ const n=Math.max(0,Math.min(POT_MAX,Math.floor(+g.pot[id])||0)); if(n) out[id]=n; }
  return out;
}
