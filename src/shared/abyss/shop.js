//@ The Abyss's pay and shop (B10): Abyssal Shards a round and the clear bonus, the AB_SHOP rows (common items with a daily stock, specials with a price that rises with each one bought today). Pure; loaded by both sides
/* agent map (docs/ABYSS.md section 4; plan section 7)
   exports: AB_SH_BASE / AB_SH_GROW / AB_SH_DIFF / AB_SH_KIND (the pay's numbers), abShardsOf(d,r,kind) (one won round), abClearBonus(d) (a finite clear: the last three rounds' pay again), AB_SHOP (rows) / AB_SHOP_BY (id -> row, no prototype) / abShopRow(id),
            AB_SPECIAL_GROWTH (x1.5 a special bought today), abShopPrice(row,bought,n) (the price of n more when `bought` were bought today), AB_BUY_MAX (99 a message), AB_ROUND_S (a rough round time, for the sim's shards-a-minute check)
   users: server/abyss/pay.js (credit, shop, buy), server/abyss.js (abSanitize: sh.n keys), game/abyss/abyss.js (the shop tab), tools/abyss-smoke.js, tools/abyss-sim.js
   A row: {id, name, kind:'common'|'special', price (shards), day (common: units a day), open (the gear.ab.top needed: 3 = Difficulty III beaten), give:{to,n}} (to: what server/abyss/pay.js abGiveS knows: rsw rsa rsr temper coins echo ess_<element>|ess_prime heart lock prism; n units a purchase)
   THE PAY. A round pays AB_SH_BASE x the difficulty's scale x AB_SH_GROW^(round-1) x the kind's share (fight 1, elite / trial 1.5, boss 2.5; an Event or Shrine pays nothing: no fight). Shards grow ~x1.2 a round while a round's time
   grows by a few seconds, so the shards a minute always rise with depth (checked by tools/abyss-smoke.js and abyss-sim.js): dying at round 15 pays far more than restarting. Test: tools/abyss-smoke.js */
const AB_SH_BASE=10, AB_SH_GROW=1.2, AB_SH_DIFF=[1,1.6,2.6,4.2,7,9], AB_SH_KIND={fight:1,elite:1.5,trial:1.5,boss:2.5,event:0,shrine:0}, AB_SH_MAX_R=60, AB_SPECIAL_GROWTH=1.5, AB_BUY_MAX=99;
const abShardsOf=(d,r,kind)=>{ d=d|0; r=Math.max(1,Math.min(AB_SH_MAX_R,r|0)); const k=Object.prototype.hasOwnProperty.call(AB_SH_KIND,kind)?AB_SH_KIND[kind]:1; return d<0||d>AB_INF?0:Math.round(AB_SH_BASE*AB_SH_DIFF[d]*Math.pow(AB_SH_GROW,r-1)*k); };
const abClearBonus=d=>{ const n=abRounds(d); if(!(n>0)) return 0; let s=0; for(let r=Math.max(1,n-2);r<=n;r++) s+=abShardsOf(d,r,'fight'); return s; };   // Infinite never ends: no bonus
const AB_ROUND_S=(r,kind)=>(45+3*Math.max(1,r|0))*(kind==='boss'?2.5:kind==='elite'||kind==='trial'?1.5:1);   // a rough round's time in seconds (a model, not a measurement)
const AB_SHOP=[
  {id:'rsw',name:'Weapon Reroll Stone',kind:'common',price:60,day:5,open:0,give:{to:'rsw',n:1}},
  {id:'rsa',name:'Armor Reroll Stone',kind:'common',price:60,day:5,open:0,give:{to:'rsa',n:1}},
  {id:'rsr',name:'Accessory Reroll Stone',kind:'common',price:80,day:5,open:0,give:{to:'rsr',n:1}},
  {id:'temper',name:'Tempering Stone',kind:'common',price:20,day:25,open:0,give:{to:'temper',n:1}},
  {id:'echo',name:'Echo Shard',kind:'common',price:25,day:10,open:0,give:{to:'echo',n:1}},
  {id:'coins',name:'50,000 coins',kind:'common',price:20,day:10,open:0,give:{to:'coins',n:50000}},
  {id:'ess_fire',name:'Fire Essence',kind:'common',price:40,day:5,open:0,give:{to:'ess_fire',n:1}},
  {id:'ess_water',name:'Water Essence',kind:'common',price:40,day:5,open:0,give:{to:'ess_water',n:1}},
  {id:'ess_air',name:'Air Essence',kind:'common',price:40,day:5,open:0,give:{to:'ess_air',n:1}},
  {id:'ess_earth',name:'Earth Essence',kind:'common',price:40,day:5,open:0,give:{to:'ess_earth',n:1}},
  {id:'ess_light',name:'Light Essence',kind:'common',price:40,day:5,open:0,give:{to:'ess_light',n:1}},
  {id:'ess_dark',name:'Dark Essence',kind:'common',price:40,day:5,open:0,give:{to:'ess_dark',n:1}},
  {id:'ess_prime',name:'Prime Essence',kind:'common',price:120,day:2,open:0,give:{to:'ess_prime',n:1}},
  // the specials: no daily limit, each one bought today costs AB_SPECIAL_GROWTH x the one before. First prices: a Difficulty V clear (about 19,600 shards) buys one Void Anchor or one Abyss Heart, a Prism costs three
  {id:'heart',name:'Abyss Heart',kind:'special',price:20000,open:3,give:{to:'heart',n:1}},
  {id:'lock',name:'Void Anchor',kind:'special',price:20000,open:4,give:{to:'lock',n:1}},
  {id:'prism',name:'Ascendant Prism',kind:'special',price:60000,open:5,give:{to:'prism',n:1}}];
const AB_SHOP_BY=Object.create(null); for(const r of AB_SHOP) AB_SHOP_BY[r.id]=r;
const abShopRow=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(AB_SHOP_BY,id)?AB_SHOP_BY[id]:null;
// the price of n more of a row when `bought` were bought today: a common row's is flat, a special's each copy x AB_SPECIAL_GROWTH (an astronomical sum is Infinity: never affordable)
function abShopPrice(row,bought,n){ bought=Math.max(0,bought|0); n=Math.max(1,n|0); if(row.kind!=='special') return row.price*n; let s=0; for(let i=0;i<n;i++) s+=Math.ceil(row.price*Math.pow(AB_SPECIAL_GROWTH,bought+i)); return s; }
