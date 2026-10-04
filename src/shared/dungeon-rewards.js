//@ Dungeon rewards, setup only (nothing calls it yet): what a clear pays (level-30 weapons, armour, rings or pendants, one random item, 70 / 25 / 4 / 0.8 / 0.2% by rarity), the ring (7 types, adds to your weapon's attack when it matches your soul), the pendant (5 kinds: exp, drop, coin, crit rate, crit damage: pendants.js), enhancing up to 2 / 4 / 6 / 8 / 10 times, and the tempering stone that monsters of level 30 and above drop instead of equipment. Pure.
/* The owner's rules (docs/DUNGEON-THEMES.md section 7 has the numbers a designer would tune):
   - Clearing the Wildwood dungeon pays a level-30 WEAPON (sword, bow or wand), the Vale's a level-30 ARMOUR piece (helmet, top, bottom or shoes), the Reach's a RING, the Greyspine's a PENDANT.
     One random item a clear: the rarity from DG_REWARD_W, then one of the dungeon's pool with equal chance. Everyone in the party gets the same item (the all-loot rule).
   - The level-30 gear is a tier of its own above the six of items.js (TIER_LV stops at 25): it is NOT in TIER_LV / ITEM_LIST, so shops, tools, drops and `tierFor` are
     untouched; it is only ever paid by a dungeon. Its stats continue each table of balance.js by one more step, a small one (about x1.25 for a weapon and for armour health): most of a level-30 piece's power is meant to
     come from enhancing it (below: ENH_STEP, +10% of its own stats a step, so a legendary +10 is twice its +0), not from the tier it is.
   - The pendant is a second jewellery slot (eq.pendant, pendants.js): 5 kinds, each with ONE bonus (exp, drop chance, coins, crit chance, crit multiplier), one random kind a clear.
   - The ring is a new slot. 7 types: no element (`basic`) and the six elements. It ADDS a share of YOUR WEAPON'S attack to your attack, always: any ring on any soul (it used to work only for a
     matching soul; the owner made it additive). The element is only its look and name for now (docs/NOT-BUILT.md section 3b: a use for it is not decided).
   - Enhancing: a level-30 piece (weapon, armour or ring) can be raised +1, +2... up to ENH_MAX of its rarity (2 / 4 / 6 / 8 / 10). Each step costs the tempering stone
     (ENH_STONES) and adds ENH_STEP of the piece's own stats; it always works.
   - The stone drops from NORMAL monsters of level ENH_LV or more (the level you fight them at, so a zone tier counts) at ENH_DROP, which is exactly the chance of an
     equipment drop it replaces (2.6%: `rollMonsterRarity`). Those monsters no longer drop equipment. Bosses are unchanged.
   Ids carry the enhancement so a save stays a list of strings: 'sword7-e+3' is an epic level-30 sword at +3, 'ring-fire-l+10' a legendary fire ring at +10, 'pendant-xp-l+10' a legendary exp pendant at +10. */
const DG_GEAR_LV=30, DG_TIER=6;   // DG_TIER: the tier index after the six of items.js (ids end in DG_TIER+1 = 7)
const DG_ATK=125, DG_HP={helmet:300,top:540,bottom:390,shoes:225}, DG_DEF={helmet:19,top:38,bottom:24,shoes:15};   // TIER_ATK / ARMOR_HP / ARMOR_DEF one step on (x1.25; it was x1.35-1.4 before enhancing was given more weight)
const DG_PRICE=30000, DG_RING_PRICE=1.2, DG_PENDANT_PRICE=1.2;   // like PRICE x SLOT_PRICE x 3^rarity in items.js (nothing sells it in a shop: this is the sell-back value)
const DG_NAMES={sword:'Elderwood Blade',bow:'Elderwood Longbow',wand:'Elderwood Wand',helmet:'Jadeplate Helm',top:'Jadeplate Cuirass',bottom:'Jadeplate Greaves',shoes:'Jadeplate Sabatons'};
const RING_ELS=['basic',...ELEM_LIST];   // the seven ring types: no element, then the six
const RING_NAMES={basic:'Plain Barrow Ring',fire:'Emberbound Ring',water:'Tidebound Ring',earth:'Rootbound Ring',air:'Windbound Ring',dark:'Duskbound Ring',light:'Dawnbound Ring'};
const RING_PCT=0.05;   // a common ring adds 5% of the weapon's attack, always; rarity multiplies it by RAR_MULT: 5 / 6.5 / 8.5 / 11 / 15%
// what each dungeon (a DG_THEMES id) pays: a kind and the pool one random piece comes from
const DG_REWARDS={
  hollowroots:    {kind:'weapon',pool:[...WEAPON_SLOTS]},
  jadesprings:    {kind:'armor', pool:[...ARMOR_SLOTS]},
  bonefrostbarrow:{kind:'ring',  pool:[...RING_ELS]},
  blackseam:      {kind:'pendant',pool:[...PENDANT_STATS]}};   // the Greyspine's dungeon (shared/dungeons/themes/blackseam.js)
const DG_REWARD_W=[700,250,40,8,2];   // out of 1000, Common..Legendary: 70 / 25 / 4 / 0.8 / 0.2%
const ENH_MAX=[2,4,6,8,10], ENH_STEP=0.10;   // steps by rarity, and what one step adds: 10% of the piece's own stats, so at its limit a common is x1.2, a rare x1.4, an epic x1.6, a unique x1.8 and a legendary x2.0 (it was 5%)
const ENH_STONES=n=>n, ENH_LV=30, ENH_DROP=0.026;   // the step to +n costs n stones; the stone's chance is the equipment chance it replaces
const ENH_NAME='Tempering Stone';

const enhMult=n=>1+ENH_STEP*n;
// the rarity of one clear's item, from x in [0,1)
function dgRewardRarity(x){ let t=x*1000; for(let r=0;r<DG_REWARD_W.length;r++){ if(t<DG_REWARD_W[r]) return r; t-=DG_REWARD_W[r]; } return DG_REWARD_W.length-1; }
const dgSuffix=(r,n)=>(r?'-'+RAR_KEY[r]:'')+(n?'+'+n:'');
const dgGearId=(slot,r,n)=>slot+(DG_TIER+1)+dgSuffix(r,n), dgRingId=(el,r,n)=>'ring-'+el+dgSuffix(r,n), dgPendantId=(stat,r,n)=>'pendant-'+stat+dgSuffix(r,n);
// an id back into its parts, or null when it is not a level-30 piece (or asks for more enhancement than its rarity allows)
function dgParse(id){
  const m=/^(?:(sword|bow|wand|helmet|top|bottom|shoes)7|ring-(basic|fire|water|earth|air|dark|light)|pendant-(xp|drop|coin|crit|critdmg))(?:-([reul]))?(?:\+(\d{1,2}))?$/.exec(String(id));
  if(!m) return null;
  const rar=m[4]?RAR_KEY.indexOf(m[4]):0, n=m[5]===undefined?0:+m[5];
  if(m[5]!==undefined&&(n<1||String(n)!==m[5])||n>ENH_MAX[rar]) return null;
  return {slot:m[1]||(m[3]?'pendant':'ring'),el:m[2]||null,stat:m[3]||null,rar,n};
}
// the record the piece would have in ITEM (stats of its rarity, then x enhMult)
function dgItem(id){
  const q=dgParse(id); if(!q) return null;
  const {slot,el,stat,rar,n}=q, k=enhMult(n), tag=n?' +'+n:'';
  const it={id,slot,tier:DG_TIER,rar,lv:DG_GEAR_LV,n,dg:true};
  if(el){ Object.assign(it,{kind:'ring',el,name:(rar?RARITY[rar]+' ':'')+RING_NAMES[el]+tag,pct:RING_PCT*RAR_MULT[rar]*k,price:Math.round(DG_PRICE*DG_RING_PRICE*Math.pow(3,rar))}); }
  else if(stat){ Object.assign(it,{kind:'pendant',stat,name:(rar?RARITY[rar]+' ':'')+PENDANT_NAMES[stat]+tag,v:Math.round(PENDANT_BASE[stat]*RAR_MULT[rar]*k*10000)/10000,price:Math.round(DG_PRICE*DG_PENDANT_PRICE*Math.pow(3,rar))}); }   // (v rounded to 4 places: 0.066 and not 0.06600000000000002)
  else if(WEAPON_SLOTS.includes(slot)) Object.assign(it,{kind:'weapon',name:(rar?RARITY[rar]+' ':'')+DG_NAMES[slot]+tag,atk:Math.round(DG_ATK*RAR_MULT[rar]*k),price:Math.round(DG_PRICE*SLOT_PRICE[slot]*Math.pow(3,rar))});
  else Object.assign(it,{kind:'armor',name:(rar?RARITY[rar]+' ':'')+DG_NAMES[slot]+tag,hp:Math.round(DG_HP[slot]*RAR_MULT[rar]*k),
    def:Math.round(Math.max(DG_DEF[slot]+rar,Math.round(DG_DEF[slot]*RAR_MULT[rar]))*k),price:Math.round(DG_PRICE*SLOT_PRICE[slot]*Math.pow(3,rar))});
  return it;
}
// one clear's item for a dungeon (rnd: a function returning [0,1), Math.random when the server rolls it); null for a theme with no reward
function dgClearReward(theme,rnd){
  const R=DG_REWARDS[theme]; if(!R) return null; rnd=rnd||Math.random;
  const rar=dgRewardRarity(rnd()), pick=R.pool[Math.min(R.pool.length-1,Math.floor(rnd()*R.pool.length))];
  return R.kind==='ring'?dgRingId(pick,rar):R.kind==='pendant'?dgPendantId(pick,rar):dgGearId(pick,rar);
}
// every id the setup can make: 19 kinds (7 pieces, 7 rings, 5 pendants) x the steps each rarity allows (3 + 5 + 7 + 9 + 11 = 35)
function dgAllIds(){
  const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++){ for(const s of ALL_SLOTS) out.push(dgGearId(s,r,n)); for(const e of RING_ELS) out.push(dgRingId(e,r,n)); for(const t of PENDANT_STATS) out.push(dgPendantId(t,r,n)); }
  return out;
}
// the attack a ring adds: its share of the weapon's attack, whatever the ring's element and your soul (additive: it is simply added to your attack)
function ringAtk(ring,weaponAtk){
  const it=typeof ring==='string'?dgItem(ring):ring;
  return it&&it.kind==='ring'?Math.round(weaponAtk*it.pct):0;
}
// enhancing a piece one step: the id after, or null (not a level-30 piece, or already at its rarity's limit); the stones that step costs
function dgEnhanceNext(id){ const q=dgParse(id); if(!q||q.n>=ENH_MAX[q.rar]) return null; return q.el?dgRingId(q.el,q.rar,q.n+1):q.stat?dgPendantId(q.stat,q.rar,q.n+1):dgGearId(q.slot,q.rar,q.n+1); }
const dgEnhanceStones=id=>{ const q=dgParse(id); return q&&q.n<ENH_MAX[q.rar]?ENH_STONES(q.n+1):0; };
// all the stones from +0 to a rarity's limit
const dgEnhanceTotal=rar=>{ let s=0; for(let n=1;n<=ENH_MAX[rar];n++) s+=ENH_STONES(n); return s; };
// what a kill drops at the level you fight it at: bosses and monsters below ENH_LV keep rolling equipment, the others the stone instead
const dgDropKind=(lv,boss)=>boss||lv<ENH_LV?'equipment':'stone';
const dgRollStone=(lv,boss,rnd)=>dgDropKind(lv,boss)==='stone'&&(rnd||Math.random)()<ENH_DROP?1:0;
