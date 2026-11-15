//@ Dungeon rewards, setup only (nothing calls it yet): what a clear pays (level-30 weapons, armour, rings or pendants, one random item, 70 / 25 / 4 / 0.8 / 0.2% by rarity), the ring (7 types, adds flat attack), the pendant (5 kinds: exp, drop, coin, crit rate, crit damage: pendants.js), enhancing up to 2 / 4 / 6 / 8 / 10 times, and the tempering stone that monsters of level 30 and above drop instead of equipment. Pure.
/* The owner's rules (docs/DUNGEON-THEMES.md section 7 has the numbers a designer would tune):
   - Clearing the Wildwood dungeon pays a level-30 WEAPON (sword, bow or wand), the Vale's a level-30 ARMOUR piece (helmet, top, bottom or shoes), the Reach's a RING, the Greyspine's a PENDANT.
     One random item a clear: the rarity from DG_REWARD_W, then one of the dungeon's pool with equal chance. Everyone in the party gets the same item (the all-loot rule).
   - The level-30 gear is a tier of its own above the six of items.js (TIER_LV stops at 25): it is NOT in TIER_LV / ITEM_LIST, so shops, tools, drops and `tierFor` are
     untouched; it is only ever paid by a dungeon. Its stats continue each table of balance.js by one more step, a small one (about x1.25 for a weapon and for armour health): most of a level-30 piece's power is meant to
     come from enhancing it (below: ENH_STEP, +10% of its own stats a step, so a legendary +10 is twice its +0), not from the tier it is.
   - The pendant is a second jewellery slot (eq.pendant, pendants.js): 5 kinds, each with ONE bonus (exp, drop chance, coins, crit chance, crit multiplier), one random kind a clear.
   - The ring is a new slot. 7 types: no element (`basic`) and the six elements. It adds a FLAT number to your attack (weapon 90 + ring 20 = 110, before every other calculation: recalcP adds it to the gear's attack),
     whatever its element (the soul that used to gate it is gone: the element only names the ring). The number is the ring's own (`ratk`, not `atk`:
     gearStatsOf sums every worn item's `atk`, which would count it in the gear's attack twice) and does not depend on the weapon.
   - Enhancing: a level-30 piece (weapon, armour or ring) can be raised +1, +2... up to ENH_MAX of its rarity (2 / 4 / 6 / 8 / 10). Each step costs the tempering stone
     (ENH_STONES) and adds ENH_STEP of the piece's own stats; it always works.
   - The stone drops from NORMAL monsters of level ENH_LV or more (the level you fight them at, so a zone tier counts) at ENH_DROP, which is exactly the chance of an
     equipment drop it replaces (2.6%: `rollMonsterRarity`). Those monsters no longer drop equipment. Bosses are unchanged.
   Ids carry the enhancement so a save stays a list of strings: 'sword7-e+3' is an epic level-30 sword at +3, 'ring-fire-l+10' a legendary fire ring at +10, 'pendant-xp-l+10' a legendary exp pendant at +10. */
const DG_GEAR_LV=30, DG_TIER=6;   // DG_TIER: the tier index after the six of items.js (ids end in DG_TIER+1 = 7)
const DG_ATK=125, DG_HP={helmet:300,top:540,bottom:390,shoes:225}, DG_DEF={helmet:19,top:38,bottom:24,shoes:15};   // TIER_ATK / ARMOR_HP / ARMOR_DEF one step on (x1.25; it was x1.35-1.4 before enhancing was given more weight)
// level-40 gear (version 3: the Sunscar dungeon pays weapons, the Gloamhorn's pays armour): one more step of x1.25 on the level-30 numbers, ids end in 8, and a piece may carry a roll (rolls.js)
const DG40_LV=40, DG40_TIER=7, DG40_ATK=156, DG40_HP={helmet:375,top:675,bottom:488,shoes:281}, DG40_DEF={helmet:24,top:48,bottom:30,shoes:19}, DG40_PRICE=60000;
const DG40_RING_ATK=25;   // a common +0 level-40 ring: RING_ATK x1.25 like the gear (25 / 32 / 42 / 55 / 75); it carries three rolled lines like a weapon or armour piece
const RING40_NAMES={basic:'Plain Amber Band',fire:'Emberamber Band',water:'Tideamber Band',earth:'Rootamber Band',air:'Windamber Band',dark:'Duskamber Band',light:'Dawnamber Band'};
const DG40_NAMES={sword:'Sunglass Scimitar',bow:'Mirage Recurve',wand:'Djinnlamp Wand',helmet:'Gloamwrought Helm',top:'Gloamwrought Cuirass',bottom:'Gloamwrought Greaves',shoes:'Gloamwrought Sabatons'};
const DG_PRICE=30000, DG_RING_PRICE=1.2, DG_PENDANT_PRICE=1.2;   // like PRICE x SLOT_PRICE x 3^rarity in items.js (nothing sells it in a shop: this is the sell-back value)
const DG_NAMES={sword:'Elderwood Blade',bow:'Elderwood Longbow',wand:'Elderwood Wand',helmet:'Jadeplate Helm',top:'Jadeplate Cuirass',bottom:'Jadeplate Greaves',shoes:'Jadeplate Sabatons'};
const RING_ELS=['basic',...ELEM_LIST];   // the seven ring types: no element, then the six
const RING_NAMES={basic:'Plain Barrow Ring',fire:'Emberbound Ring',water:'Tidebound Ring',earth:'Rootbound Ring',air:'Windbound Ring',dark:'Duskbound Ring',light:'Dawnbound Ring'};
const RING_ATK=20;   // a common +0 ring adds 20 attack; rarity multiplies it by RAR_MULT: 20 / 26 / 34 / 44 / 60, and each tempering step adds ENH_STEP of it (a legendary +10: 120)
// what each dungeon (a DG_THEMES id) pays: a kind and the pool one random piece comes from
const DG_REWARDS={
  hollowroots:    {kind:'weapon',pool:[...WEAPON_SLOTS]},
  jadesprings:    {kind:'armor', pool:[...ARMOR_SLOTS]},
  bonefrostbarrow:{kind:'ring',  pool:[...RING_ELS]},
  blackseam:      {kind:'pendant',pool:[...PENDANT_STATS]},
  sandglass:      {kind:'talisman',pool:[...TAL_STATS],   t:8},   // D4: the Sunscar's dungeon pays a talisman of one of the five kinds at the rolled level (was a level-40 weapon)
  gloamvault:     {kind:'cape',   pool:[...CAPE_IDS],     t:8},   // D5: the Gloamhorn's pays a cape of one of the eight combos at the rolled level (was a level-40 armour piece)
  termitecathedral:{kind:'ring',  pool:[...RING_ELS],     t:8},
  cenote:         {kind:'pendant',pool:[...PENDANT_STATS], t:8}};   // the Emberwake Isles' pays a level-40 pendant of one of the five kinds (ids pendant8-..., never rolled)   // the Amber Reach's pays a level-40 ring of one of the seven types (three rolled lines once a Ring Reroll Stone rolls it, docs/ROLLS.md)
const DG_REWARD_W=[650,250,70,25,5];   // out of 1000, Common..Legendary: 65 / 25 / 7 / 2.5 / 0.5%, the same at every tier (dungeon revamp D2; the luck per difficulty step is gone)
const ENH_MAX=[2,4,6,8,10], ENH_STEP=0.10;   // steps by rarity, and what one step adds: 10% of the piece's own stats, so at its limit a common is x1.2, a rare x1.4, an epic x1.6, a unique x1.8 and a legendary x2.0 (it was 5%)
const ENH_STONES=n=>n, ENH_LV=30, ENH_DROP=0.026;   // the step to +n costs n stones; the stone's chance is the equipment chance it replaces
const ENH_NAME='Tempering Stone';

const enhMult=n=>1+ENH_STEP*n;
// the rarity of one clear's piece, from x in [0,1)
function dgRewardRarity(x){ let t=x*1000; for(let r=0;r<DG_REWARD_W.length;r++){ if(t<DG_REWARD_W[r]) return r; t-=DG_REWARD_W[r]; } return DG_REWARD_W.length-1; }
const dgSuffix=(r,n)=>(r?'-'+RAR_KEY[r]:'')+(n?'+'+n:'');
const dgGearId=(slot,r,n)=>slot+(DG_TIER+1)+dgSuffix(r,n), dgGearId40=(slot,r,n,roll,t)=>slot+(t||DG40_TIER+1)+dgSuffix(r,n)+(roll||''), dgRingId=(el,r,n)=>'ring-'+el+dgSuffix(r,n), dgRingId40=(el,r,n,roll,t)=>'ring'+(t||8)+'-'+el+dgSuffix(r,n)+(roll||''), dgPendantId=(stat,r,n)=>'pendant-'+stat+dgSuffix(r,n), dgPendantId40=(stat,r,n,roll,t)=>'pendant'+(t||8)+'-'+stat+dgSuffix(r,n)+(roll||''), dgTalismanId=(stat,r,n,roll,t)=>'talisman'+(t||8)+'-'+stat+dgSuffix(r,n)+(roll||''), dgCapeId=(combo,r,n,roll,t)=>'cape'+(t||8)+'-'+combo+dgSuffix(r,n)+(roll||'');   // t: the level digit 7 / 8 (default) / 9 / 10 (D4)
// an id back into its parts, or null when it is not a level-30 piece (or asks for more enhancement than its rarity allows)
function dgParse(id){
  const m=/^(?:(sword|bow|wand|helmet|top|bottom|shoes)(7|8|9|10)|ring(8|9|10)?-(basic|fire|water|earth|air|dark|light)|pendant(8|9|10)?-(xp|drop|coin|crit|critdmg)|talisman(7|8|9|10)-(aspd|buffdur|chg|cdr|atk)|cape(7|8|9|10)-(al|ai|la|gh|hg|ia|mi|ml))(?:-([reul]))?(?:\+(\d{1,2}))?(~(?:[a-m]\d\d){1,3})?$/.exec(String(id));
  if(!m) return null;
  const rar=m[11]?RAR_KEY.indexOf(m[11]):0, n=m[12]===undefined?0:+m[12], t=m[2]?+m[2]:m[3]?+m[3]:m[5]?+m[5]:m[7]?+m[7]:m[9]?+m[9]:7, roll=m[13]||null;   // ring8-... is a level-40 ring, pendant8-... a level-40 pendant, talisman7- / 8- / 9- / 10- a level-30 / 40 / 50 / 60 talisman (D4; the old talisman8- ids are level 40)
  if(m[12]!==undefined&&(n<1||String(n)!==m[12])||n>ENH_MAX[rar]) return null;
  if(roll&&(rlLinesFor(t)<1||!rlParseCode(roll,rlLinesFor(t)))) return null;   // only a level-40+ piece carries a roll, of exactly its level's count of different stats (40: 1, 50: 2, 60: 3)
  return {slot:m[1]||(m[6]?'pendant':m[8]?'talisman':m[10]?'cape':'ring'),el:m[4]||null,stat:m[6]||m[8]||null,combo:m[10]||null,rar,n,t,roll};   // cape7- / 8- / 9- / 10-<combo> (D5): a cape of level 30 / 40 / 50 / 60
}
// the record the piece would have in ITEM (stats of its rarity, then x enhMult). Level table (D2): digit t 7 = level 30, 8 = 40, 9 = 50, 10 = 60; every step above 40 is x DG_EQ_STEP on the level-40 numbers
const DG_EQ_STEP=1.25, dgEqLv=t=>t<=7?30:(t-4)*10, dgEqK=t=>t>8?Math.pow(DG_EQ_STEP,t-8):1;   // (level of a digit; the stat factor on level 40)
function dgItem(id){
  const q=dgParse(id); if(!q) return null;
  const {slot,el,stat,rar,n,t}=q, k=enhMult(n), tag=n?' +'+n:'', hi=t>=8, f=dgEqK(t), lv=dgEqLv(t), lvTag=lv>40?' Lv'+lv:'', pk=Math.pow(3,Math.max(0,t-8));   // pk: the sell-back price x3 a level step above 40
  const it={id,slot,tier:hi||slot==='talisman'||slot==='cape'?DG40_TIER:DG_TIER,rar,lv,n,dg:true,t};
  if(el){ Object.assign(it,{kind:'ring',el,name:(rar?RARITY[rar]+' ':'')+(hi?RING40_NAMES:RING_NAMES)[el]+lvTag+tag,ratk:Math.round((hi?DG40_RING_ATK*f:RING_ATK)*RAR_MULT[rar]*k),price:Math.round((hi?DG40_PRICE*pk:DG_PRICE)*DG_RING_PRICE*Math.pow(3,rar))});
    if(hi){ it.roll0=true; if(q.roll){ it.rcode=q.roll; it.roll=rlLinesOf(q.roll,'ring',rlLinesFor(t)); } } }   // rolls: a level-40+ ring is unrolled until a Ring Reroll Stone rolls it
  else if(slot==='cape'){ const cv=capeVals(q.combo,rar,n,t); Object.assign(it,{kind:'cape',combo:q.combo,name:(rar?RARITY[rar]+' ':'')+CAPE_BY_ID[q.combo].name+lvTag+tag,plus:cv.plus,minus:cv.minus,price:Math.round(DG40_PRICE*pk*DG_PENDANT_PRICE*Math.pow(3,rar))});
    it.roll0=true; if(q.roll){ it.rcode=q.roll; it.roll=rlLinesOf(q.roll,'cape',rlLinesFor(t)); } }   // a cape has a fixed plus and minus and rlLinesFor(t) rolled lines (level 30: none) (Accessory Reroll Stone)
  else if(stat&&slot==='talisman'){ Object.assign(it,{kind:'talisman',stat,name:(rar?RARITY[rar]+' ':'')+TAL_NAMES[stat]+lvTag+tag,v:Math.round(TAL_BASE[stat]*(t<8?1/DG_EQ_STEP:f)*RAR_MULT[rar]*k*10000)/10000,price:Math.round(DG40_PRICE*pk*DG_PENDANT_PRICE*Math.pow(3,rar))});   // level 30 = level 40 / 1.25, 50 / 60 x1.25 per step like the other kinds
    it.roll0=true; if(q.roll){ it.rcode=q.roll; it.roll=rlLinesOf(q.roll,'talisman',rlLinesFor(t)); } }   // a talisman has a fixed bonus and rlLinesFor(t) rolled lines (level 30: none) (Accessory Reroll Stone)
  else if(stat){ Object.assign(it,{kind:'pendant',stat,name:(rar?RARITY[rar]+' ':'')+(hi?PENDANT40_NAMES:PENDANT_NAMES)[stat]+lvTag+tag,v:Math.round((hi?PENDANT40_BASE[stat]*f:PENDANT_BASE[stat])*RAR_MULT[rar]*k*10000)/10000,price:Math.round((hi?DG40_PRICE*pk:DG_PRICE)*DG_PENDANT_PRICE*Math.pow(3,rar))});   // (v rounded to 4 places: 0.066 and not 0.06600000000000002)
    if(hi){ it.roll0=true; if(q.roll){ it.rcode=q.roll; it.roll=rlLinesOf(q.roll,'pendant',rlLinesFor(t)); } } }   // a level-40+ pendant carries rolled lines too
  else {
    const NM=hi?DG40_NAMES:DG_NAMES, PR=hi?DG40_PRICE*pk:DG_PRICE;
    if(WEAPON_SLOTS.includes(slot)) Object.assign(it,{kind:'weapon',name:(rar?RARITY[rar]+' ':'')+NM[slot]+lvTag+tag,atk:Math.round((hi?DG40_ATK*f:DG_ATK)*RAR_MULT[rar]*k),price:Math.round(PR*SLOT_PRICE[slot]*Math.pow(3,rar))});
    else { const HP=hi?DG40_HP:DG_HP, DF=hi?DG40_DEF:DG_DEF, df=Math.round(DF[slot]*f); Object.assign(it,{kind:'armor',name:(rar?RARITY[rar]+' ':'')+NM[slot]+lvTag+tag,hp:Math.round(HP[slot]*f*RAR_MULT[rar]*k),
      def:Math.round(Math.max((hi?df:DF[slot])+rar,Math.round((hi?df:DF[slot])*RAR_MULT[rar]))*k),price:Math.round(PR*SLOT_PRICE[slot]*Math.pow(3,rar))}); }
    if(hi){ it.roll0=true; if(q.roll){ it.rcode=q.roll; it.roll=rlLinesOf(q.roll,it.kind,rlLinesFor(t)); } }   // an unrolled piece (roll0) is waiting for a Reroll Stone; a rolled one lists its lines (rolls.js)
  }
  return it;
}
// the id of a parsed piece q (dgParse) at rarity r, tempering n and roll code: the one place that picks the id maker by kind and level digit
function dgIdOfQ(q,r,n,roll){
  const hi=q.t>=8; return q.el?(hi?dgRingId40(q.el,r,n,roll,q.t):dgRingId(q.el,r,n)):q.slot==='talisman'?dgTalismanId(q.stat,r,n,roll,q.t):q.slot==='cape'?dgCapeId(q.combo,r,n,roll,q.t):q.stat?(hi?dgPendantId40(q.stat,r,n,roll,q.t):dgPendantId(q.stat,r,n)):hi?dgGearId40(q.slot,r,n,roll,q.t):dgGearId(q.slot,r,n);
}
// the id of one dungeon piece: kind ('weapon'|'armor'|'ring'|'pendant'), its pick (slot / element / stat), level digit t, rarity r, tempering n
function dgPieceId(kind,pick,t,r,n){
  const hi=t>=8; return kind==='cape'?dgCapeId(pick,r,n,null,t):kind==='talisman'?dgTalismanId(pick,r,n,null,t):kind==='ring'?(hi?dgRingId40(pick,r,n,null,t):dgRingId(pick,r,n)):kind==='pendant'?(hi?dgPendantId40(pick,r,n,null,t):dgPendantId(pick,r,n)):hi?dgGearId40(pick,r,n,null,t):dgGearId(pick,r,n);
}
// one piece for a dungeon (rnd: a function returning [0,1), Math.random when the server rolls it); null for a theme with no reward. eq: the equipment level index 0-3 (30 / 40 / 50 / 60), default the dungeon's own
// (a 't:8' theme: level 40). Every kind exists at every level, so dungeons 5-8 pay their current kinds at the rolled level until D4-D7 change them.
function dgClearReward(theme,rnd,eq){
  const R=DG_REWARDS[theme]; if(!R) return null; rnd=rnd||Math.random;
  const rar=dgRewardRarity(rnd()), pick=R.pool[Math.min(R.pool.length-1,Math.floor(rnd()*R.pool.length))];
  return dgPieceId(R.kind,pick,7+(eq===undefined?(R.t===8?1:0):Math.max(0,Math.min(3,eq|0))),rar,0);
}
// the equipment level index (0-3) of one piece from DG_TIERS[tier].eq (percent): x in [0,1)
function dgEqPick(tier,x){ const W=DG_TIERS[Math.max(0,Math.min(DG_TIERS.length-1,tier|0))].eq; let t=x*100; for(let e=0;e<W.length;e++){ if(t<W[e]) return e; t-=W[e]; } for(let e=W.length-1;e>=0;e--) if(W[e]>0) return e; return 0; }
// everything a clear at a tier pays (D2): a piece count drawn evenly from DG_TIERS[tier].n, each piece with its own equipment level (DG_TIERS[tier].eq) and its own rarity; an array of ids (empty for a theme with no reward)
function dgClearRewards(theme,rnd,tier){
  if(!DG_REWARDS[theme]) return []; rnd=rnd||Math.random;
  const T=DG_TIERS[Math.max(0,Math.min(DG_TIERS.length-1,tier|0))], cnt=T.n[0]+Math.min(T.n[1]-T.n[0],Math.floor(rnd()*(T.n[1]-T.n[0]+1))), out=[];
  for(let i=0;i<cnt;i++) out.push(dgClearReward(theme,rnd,dgEqPick(T.t,rnd())));
  return out;
}
// every id the setup can make: 19 kinds (7 pieces, 7 rings, 5 pendants) x the steps each rarity allows (3 + 5 + 7 + 9 + 11 = 35)
function dgAllIds(){
  const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++){ for(const s of ALL_SLOTS) out.push(dgGearId(s,r,n)); for(const e of RING_ELS) out.push(dgRingId(e,r,n)); for(const t of PENDANT_STATS) out.push(dgPendantId(t,r,n)); }
  return out;
}
// the flat attack a ring adds: its own number (dgRingAtkOf, dungeon-items.js, says whether the kit lets it count)
function ringAtk(ring){
  const it=typeof ring==='string'?dgItem(ring):ring;
  return it&&it.kind==='ring'?it.ratk:0;
}
// enhancing a piece one step: the id after, or null (not a level-30 piece, or already at its rarity's limit); the stones that step costs
function dgEnhanceNext(id){ const q=dgParse(id); if(!q||q.n>=ENH_MAX[q.rar]) return null; return dgIdOfQ(q,q.rar,q.n+1,q.roll); }   // (a level-40+ piece keeps its roll)
const dgEnhanceStones=id=>{ const q=dgParse(id); return q&&q.n<ENH_MAX[q.rar]?ENH_STONES(q.n+1):0; };
// every unrolled level-40 id: 7 pieces x the 35 (rarity, enhancement) pairs = 245 (the rolled ones are made on demand: ITEM's Proxy, rolls.js)
function dgAllIds40(t){ t=t||8; const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++) for(const s of ALL_SLOTS) out.push(dgGearId40(s,r,n,null,t)); return out; }   // t: the level digit 8 (default) / 9 / 10
// every unrolled level-40 ring: 7 elements x the same 35 pairs = 245 (kept apart from dgAllIds40: rings are not a slot of ALL_SLOTS)
function dgAllRingIds40(t){ t=t||8; const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++) for(const e of RING_ELS) out.push(dgRingId40(e,r,n,null,t)); return out; }
// every level-40 pendant: 5 kinds x the same 35 pairs = 175 (the Cenote's reward; no rolls)
function dgAllTalismanIds(t){ t=t||8; const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++) for(const st of TAL_STATS) out.push(dgTalismanId(st,r,n,null,t)); return out; }   // t: the level digit (default 8)
function dgAllCapeIds(t){ t=t||8; const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++) for(const c of CAPE_IDS) out.push(dgCapeId(c,r,n,null,t)); return out; }   // 8 combos x the 35 pairs = 280 a level (D5)
function dgAllPendantIds40(t){ t=t||8; const out=[]; for(let r=0;r<5;r++) for(let n=0;n<=ENH_MAX[r];n++) for(const st of PENDANT_STATS) out.push(dgPendantId40(st,r,n,null,t)); return out; }
// all the stones from +0 to a rarity's limit
const dgEnhanceTotal=rar=>{ let s=0; for(let n=1;n<=ENH_MAX[rar];n++) s+=ENH_STONES(n); return s; };
// what a kill drops at the level you fight it at: bosses and monsters below ENH_LV keep rolling equipment, the others the stone instead
const dgDropKind=(lv,boss)=>boss||lv<ENH_LV?'equipment':'stone';
const dgRollStone=(lv,boss,rnd)=>dgDropKind(lv,boss)==='stone'&&(rnd||Math.random)()<ENH_DROP?1:0;
