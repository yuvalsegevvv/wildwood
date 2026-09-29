//@ Items (ITEM, ITEM_LIST): 7 pieces x 6 level tiers x 5 rarities, prices, drop tables, merging, armour looks, gear helpers. Pure.
/* 6 tiers (level 1, 5, 10, 15; the Sakura Vale's samurai gear at 20 and 25). Weapons: sword (Warrior), bow (Archer), wand (Mage): the weapon you hold is your class.
   Armor (any class): helmet, top, bottom, shoes. It adds health and defense and changes your outfit. */
const TIER_LV=[1,5,10,15,20,25], TIERS=TIER_LV.length;
/* Rarity: a second axis on top of the level tier. Three identical items merge into one of the next rarity at
   Greta's forge (same level needed). Rarer items have stronger stats and a coloured tile in the inventory. */
const RARITY=['Common','Rare','Epic','Unique','Legendary'], RAR_KEY=['','r','e','u','l'];
const RAR_MULT=[1,1.3,1.7,2.2,3], RAR_COL=['#d6d8cf','#5b9cf0','#b77cf5','#f0cd45','#62d66e'];
const MERGE_COUNT=3, BAG_MAX=240;
const SLOT_NAMES={
  sword:['Rusty Shortsword','Iron Longsword','Steel Warblade','Sunforged Blade','Sakura Katana','Raijin Katana'],
  bow:["Hunter's Shortbow",'Yew Longbow','Composite Warbow','Starwood Bow','Lacquered Yumi','Thunderbird Yumi'],
  wand:['Oak Wand','Crystal Wand','Arcane Wand','Emberstar Wand','Blossom Wand','Foxfire Wand'],
  helmet:['Leather Cap','Iron Helm','Steel Helm','Sunforged Helm','Samurai Kabuto','Shogun Kabuto'],
  top:['Leather Vest','Chainmail Hauberk','Steel Cuirass','Sunforged Cuirass','Samurai Do','Shogun Do'],
  bottom:['Leather Trousers','Chainmail Leggings','Steel Greaves','Sunforged Legplates','Samurai Haidate','Shogun Haidate'],
  shoes:['Leather Boots','Ironshod Boots','Steel Sabatons','Sunforged Sabatons','Samurai Suneate','Shogun Suneate']};
const WEAPON_SLOTS=['sword','bow','wand'], ARMOR_SLOTS=['helmet','top','bottom','shoes'], ALL_SLOTS=[...WEAPON_SLOTS,...ARMOR_SLOTS];
const CLASS_OF={sword:'warrior',bow:'archer',wand:'mage'}, WEAPON_OF={warrior:'sword',archer:'bow',mage:'wand'};
const SLOT_LABEL={weapon:'Weapon',helmet:'Helmet',top:'Top',bottom:'Bottom',shoes:'Shoes'};
const PRICE=[25,120,480,1600,4500,12000], SLOT_PRICE={sword:1.3,bow:1.3,wand:1.3,helmet:0.8,top:1.2,bottom:1,shoes:0.7};
// ids: 'sword2' is a common Iron Longsword, 'sword2-e' the epic one (r, e, u, l = rare, epic, unique, legendary)
const itemId=(slot,t,r)=>slot+(t+1)+(r?'-'+RAR_KEY[r]:'');
const ITEM={}, ITEM_LIST=[];
for(const slot of ALL_SLOTS) for(let t=0;t<TIERS;t++) for(let r=0;r<5;r++){
  const it={id:itemId(slot,t,r),base:slot+(t+1),slot,tier:t,rar:r,lv:TIER_LV[t],name:(r?RARITY[r]+' ':'')+SLOT_NAMES[slot][t],
    price:Math.round(PRICE[t]*SLOT_PRICE[slot]*Math.pow(3,r)),kind:WEAPON_SLOTS.includes(slot)?'weapon':'armor'};
  if(it.kind==='weapon') it.atk=Math.round(TIER_ATK[t]*RAR_MULT[r]);
  else { it.hp=Math.round(ARMOR_HP[slot][t]*RAR_MULT[r]); it.def=Math.max(ARMOR_DEF[slot][t]+r,Math.round(ARMOR_DEF[slot][t]*RAR_MULT[r])); }
  ITEM[it.id]=it; ITEM_LIST.push(it);
}
const sellPrice=it=>Math.round(it.price*0.4);
/* Shops have unlimited stock, but every one of an item you buy adds 20% of its base price (1st: 100%, 2nd: 120%,
   3rd: 140%...). Your purchase counts reset at sunrise. */
const SHOP_STEP=0.2, shopPrice=(it,n)=>Math.round(it.price*(1+SHOP_STEP*(n||0)));
const mergedId=id=>{ const it=ITEM[id]; return it&&it.rar<4?itemId(it.slot,it.tier,it.rar+1):null; };
/* Drops. Monsters: 2% common, 0.5% rare, 0.1% epic. The boss: 50% common, 10% rare, 3% epic, 1% unique,
   0.1% legendary. The rarity is rolled first, then one of the 7 pieces with equal chance. -1 = nothing. */
function rollMonsterRarity(){ const x=Math.random(); return x<0.001?2:x<0.006?1:x<0.026?0:-1; }
function rollBossRarity(){ const x=Math.random(); return x<0.001?4:x<0.011?3:x<0.041?2:x<0.141?1:x<0.641?0:-1; }
// what each armor piece looks like on the character
const ARMOR_LOOK={
  helmet:[{hat:'cap',hatColor:0x7a5236},{hat:'helm',hatColor:0x8a8f94},{hat:'helm',hatColor:0xa8b4c0,plume:0x8a2f2f},{hat:'helm',hatColor:0xd4a83a,plume:0xf2eee4},{hat:'helm',hatColor:0x8a2a26,plume:0xd4a83a},{hat:'helm',hatColor:0x24222a,plume:0xf0cd45}],
  top:[{top:'jacket',topColor:0x7a5236},{top:'mail',topColor:0x8a8f94},{top:'plate',topColor:0xa8b4c0},{top:'plate',topColor:0xd4a83a},{top:'plate',topColor:0x9a2e2a},{top:'plate',topColor:0x2a2830}],
  bottom:[{bottom:'trousers',bottomColor:0x5a3e28,bottomStyle:''},{bottom:'trousers',bottomColor:0x7a7f84,bottomStyle:'mail'},{bottom:'trousers',bottomColor:0x9aa6b2,bottomStyle:'plate'},{bottom:'trousers',bottomColor:0xc9a13a,bottomStyle:'plate'},{bottom:'trousers',bottomColor:0x8a2a26,bottomStyle:'plate'},{bottom:'trousers',bottomColor:0x2a2830,bottomStyle:'plate'}],
  shoes:[{shoes:'boots',shoeColor:0x5a3e28},{shoes:'boots',shoeColor:0x55595e},{shoes:'boots',shoeColor:0x9aa6b2},{shoes:'boots',shoeColor:0xd4a83a},{shoes:'boots',shoeColor:0x7a2622},{shoes:'boots',shoeColor:0x1e1c22}]};
// east: the Sakura Vale (0 sealed, 1 tunnel open after the Rootwarden, 2 walked to Hanami: teleport circles attuned); north: the Hoarfrost Reach (0 ice wall shut, 1 open after Akaoni, 2 walked to Rimehold); soul: the element you are bound to (elements.js); mats: monster drops {id:count}; prof: learned professions {id:{xp}}, res: gathered resources {id:count} (professions.js)
function newGearFor(cls){ return {inv:['sword1','bow1','wand1'],eq:{weapon:(WEAPON_OF[cls]||'sword')+'1',helmet:null,top:null,bottom:null,shoes:null},coins:0,q:{offers:[],active:{},defs:{},ready:[],done:0,next:1},startAll:false,bought:{},skills:newSkills(),east:0,north:0,soul:'basic',mats:{},prof:{},res:{},mq:newMq()}; }
function gearStatsOf(gear){ let hp=0,atk=0,def=0; if(gear&&gear.eq) for(const k in gear.eq){ const it=ITEM[gear.eq[k]]; if(!it) continue; hp+=it.hp||0; atk+=it.atk||0; def+=it.def||0; } return {hp,atk,def}; }
function effectiveLookOf(look,gear){
  const L=Object.assign({},look||{});
  if(L.armor==='hide') return L;   // the player chose to show their own clothes over their armour (stats still count)
  if(gear&&gear.eq) for(const s of ARMOR_SLOTS){ const it=ITEM[gear.eq[s]]; if(it) Object.assign(L,ARMOR_LOOK[s][it.tier]); }
  return L;
}
function classOfGear(gear,fallback){ const w=gear&&gear.eq&&ITEM[gear.eq.weapon]; return w?CLASS_OF[w.slot]:(fallback||'warrior'); }
function itemStat(it){ return it.kind==='weapon'?'+'+it.atk+' attack':'+'+it.hp+' health, +'+it.def+' defense'; }
function randomItem(t,r){ return itemId(ALL_SLOTS[Math.floor(Math.random()*ALL_SLOTS.length)],t,r||0); }
