//@ Pendants: the necklace slot (eq.pendant) and its five kinds (exp, drop, coin, crit rate, crit damage) in 4 dungeon tiers x 5 rarities, plus the crit constants and caps. Pure.
/* A pendant carries ONE bonus. They are items (in ITEM, like the tools) but not in ITEM_LIST, so shops, random drops and "all items" never produce them;
   they come from dungeons (docs/DUNGEONS.md, not built yet) and the testing tools. The rarity multiplies the value as for every item (RAR_MULT, so three
   identical pendants merge at the forge: mergedId works from `base`), the dungeon tier adds PENDANT_TIER_STEP of the base per step (tier 0 = a boss of
   level 30, I / II / III = 40 / 50 / 60). Every pendant needs level PENDANT_LV to wear, whatever its tier (the highest level is 50).
   What each kind does (the server reads the worn item's id, never a number from the client: pendP in server/players.js):
     xp      +v to the XP multiplier of a kill          (rewardKill, added to the Scholar passive)
     drop    +v to the chance of a material drop         (rollDropCount, added to the Scavenger passive)
     coin    +v to the coins of a kill                   (rewardKill)
     crit    +v to the crit chance, in points            (rollDmgS, with the Precision passive; total capped at CRIT_CAP)
     critdmg +v to the crit multiplier                   (rollDmgS; the multiplier is capped at CRIT_MULT_CAP)
   Ids: pd-<stat><tier+1>[-<rarity key>], e.g. pd-xp1 (common) and pd-critdmg4-l (tier III, legendary). */
const PENDANT_STATS=['xp','drop','coin','crit','critdmg'];
const PENDANT_LV=30, PENDANT_TIERS=4, PENDANT_TIER_STEP=0.25, PENDANT_PRICE=500;
const PENDANT_BASE={xp:0.06,drop:0.10,coin:0.10,crit:0.02,critdmg:0.10};   // a common tier-0 pendant; x RAR_MULT x (1 + 0.25 tier)
const PENDANT_OF={xp:'Learning',drop:'Plenty',coin:'Fortune',crit:'Precision',critdmg:'Ruin'};
const PENDANT_GRADE=['Slate','Silver','Gilt','Obsidian'];   // the metal of the chain, by dungeon tier
const CRIT_BASE=0.12, CRIT_MULT=1.7, CRIT_CAP=0.6, CRIT_MULT_CAP=2.5;   // the numbers rollDmgS used to hold as literals; the caps are what stacking passives, potions and a pendant may reach
const pendantValue=(stat,t,r)=>Math.round(PENDANT_BASE[stat]*RAR_MULT[r]*(1+PENDANT_TIER_STEP*t)*10000)/10000;
const pendantId=(stat,t,r)=>'pd-'+stat+(t+1)+(r?'-'+RAR_KEY[r]:'');
const PENDANT_LIST=[];
for(const stat of PENDANT_STATS) for(let t=0;t<PENDANT_TIERS;t++) for(let r=0;r<5;r++){
  const it={id:pendantId(stat,t,r),base:'pd-'+stat+(t+1),slot:'pendant',tier:t,rar:r,lv:PENDANT_LV,kind:'pendant',stat,v:pendantValue(stat,t,r),
    name:(r?RARITY[r]+' ':'')+PENDANT_GRADE[t]+' Pendant of '+PENDANT_OF[stat],price:Math.round(PENDANT_PRICE*(1+t)*Math.pow(3,r))};
  ITEM[it.id]=it; PENDANT_LIST.push(it);
}
const pendantPct=v=>String(Math.round(v*1000)/10);   // 0.078 -> "7.8", 0.06 -> "6"
function pendantText(it){
  return it.stat==='xp'?'+'+pendantPct(it.v)+'% XP from kills':it.stat==='drop'?'+'+pendantPct(it.v)+'% chance of monster drops':it.stat==='coin'?'+'+pendantPct(it.v)+'% coins from kills'
    :it.stat==='crit'?'+'+pendantPct(it.v)+'% critical hit chance':'Critical hits deal x'+(CRIT_MULT+it.v).toFixed(2)+' (instead of x'+CRIT_MULT+')';
}
