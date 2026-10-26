//@ Stateful fuzz of the village economy straight from src/: buying, selling, forging, crafting, brewing, learning, training, making cosmetics and buying outfits, with full bags and empty purses; nothing is paid for nothing and nothing is given free
// Usage: node tools/economy-fuzz.js [--steps 4000] [--seed 1] [--verbose]
// One hiker stands in the village with coins, resources and drops; every step is one valid-looking message of the shop, the forge, the lodge, the trainer or the gem shop, often with the bag nearly full or
// the purse nearly empty. After each step (the world is ticked first): coins stay whole numbers >= 0, the bag never holds more than BAG_MAX, and the two halves of a trade agree:
//   - paid-for-nothing: coins or gems went down, yet no item, potion, skill, skill level, profession, cosmetic or outfit arrived (the full bag that kept the price of an item was this bug);
//   - the save: every 20 steps what is held is run through the save sanitizer, and nothing may change (a cap that only a reload applies is a loss at the next login);
//   - free lunch: one of those arrived and no coins, gems, resources or drops were spent (a price that came out 0 or NaN).
// Test: this file (registered in tools/tests.json). The same checks, one by one: tools/server-smoke.js (shop), tools/revamp-smoke.js (cosmetics), tools/amber-smoke.js (gems).
const {loadServer}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; };
const STEPS=arg('--steps',4000), VERBOSE=process.argv.includes('--verbose');
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const pick=a=>a[Math.floor(rnd()*a.length)];
const {api:W,x}=loadServer({dev:true,send(){}},['VIL','getH','ITEM_LIST','BAG_MAX','ALL_SLOTS','TIERS','CRAFT_MAX_RAR','POTS','RES','MATS','SKILL_IDS','PASSIVE_IDS','PROF_IDS','CP_PIECE','ambOutfitIds','RES_MAX','sanitizeGear']);
W.join('e',{name:'Economist',look:{cls:'warrior'},save:{level:30}}); W.tick(0.05);
const p=W.players.get('e');
const home=()=>{ W.setPos('e',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); };
home(); W.tick(0.05);
W.receive('e',{t:'dev',cmd:'level',v:30}); W.receive('e',{t:'dev',cmd:'skills'}); W.receive('e',{t:'dev',cmd:'mats'});
const shop=x.ITEM_LIST.filter(it=>it.rar===0&&!it.dg).map(it=>it.id), potions=Object.keys(x.POTS), res=Object.keys(x.RES), cos=Object.keys(x.CP_PIECE), outfits=x.ambOutfitIds();
const skills=[...x.SKILL_IDS,...x.PASSIVE_IDS];
const sum=o=>Object.values(o||{}).reduce((a,b)=>a+(+b||0),0);
// what a trade may give: items, potions, skills and their levels, professions, cosmetics, outfits
const goods=g=>g.inv.length+sum(g.pot)+g.skills.owned.length+sum(g.skills.lv)+Object.keys(g.prof).length+g.cos.length+g.os.length;
// what a trade may take (each kind on its own: an achievement or a quest step that the trade finishes may pay gems or coins in the same step)
const price=g=>[g.coins,g.gem,sum(g.res),sum(g.mats)];
const took=(a,b)=>a.some((v,i)=>b[i]<v);
const TRADES=['buy','craft','brew','buyskill','upskill','learn','cosmake','gembuy'];   // (a sale or a merge may finish a main quest step, which pays out: only a trade that has a price is held to it)
const bad=[]; const note=s=>{ if(bad.length<20) bad.push(s); };
const MSGS=[
  ()=>({t:'buy',id:pick(shop)}), ()=>({t:'buy',id:pick(shop)}), ()=>({t:'sell',id:pick(p.gear.inv.length?p.gear.inv:shop)}), ()=>({t:'merge',id:pick(p.gear.inv.length?p.gear.inv:shop)}),
  ()=>({t:'craft',slot:pick(x.ALL_SLOTS),tier:Math.floor(rnd()*x.TIERS),rar:Math.floor(rnd()*(x.CRAFT_MAX_RAR+1))}), ()=>({t:'brew',id:pick(potions),n:1+Math.floor(rnd()*20)}),
  ()=>({t:'buyskill',id:pick(skills)}), ()=>({t:'upskill',id:pick(p.gear.skills.owned.length?p.gear.skills.owned:skills)}), ()=>({t:'learn',id:pick(x.PROF_IDS)}),
  ()=>{ const k=pick(cos).split(':'); return {t:'cosmake',type:k[0],id:k[1]}; }, ()=>({t:'gembuy',v:pick(outfits),b:rnd()<0.4?1:0}), ()=>({t:'gemtest'}),
  ()=>({t:'sellres',id:pick(res),n:Math.floor(rnd()*30)}),
];
const refill=()=>{   // purses and bags at their edges
  const r=rnd();
  if(r<0.12) p.gear.coins=Math.floor(rnd()*3000); else if(r<0.2) p.gear.coins=50000+Math.floor(rnd()*500000);
  if(r>0.7&&r<0.8) while(p.gear.inv.length<x.BAG_MAX-Math.floor(rnd()*3)) p.gear.inv.push(pick(shop));
  if(r>0.85&&r<0.9){ p.gear.inv.length=Math.min(p.gear.inv.length,Math.floor(rnd()*20)); for(const id of Object.values(p.gear.eq)) if(id&&!p.gear.inv.includes(id)) p.gear.inv.push(id); }   // (what is worn is always in the bag)
  if(r>0.9) for(const id of res) p.gear.res[id]=Math.floor(rnd()*60);
  if(r>0.95) for(const id of Object.keys(x.MATS)) p.gear.mats[id]=Math.floor(rnd()*40);
};
for(let step=0;step<STEPS&&bad.length<5;step++){
  refill(); if(rnd()<0.1) home();
  const g=p.gear, before={coins:g.coins,gem:g.gem,goods:goods(g),price:price(g)};
  const m=pick(MSGS)();
  try{ W.receive('e',m); W.tick(0.05); }catch(e){ note('step '+step+' '+JSON.stringify(m)+' threw '+e.message); continue; }
  const a=p.gear, after={coins:a.coins,gem:a.gem,goods:goods(a),price:price(a)};
  if(VERBOSE) console.log(step,JSON.stringify(m),'coins',before.coins,'->',after.coins,'goods',before.goods,'->',after.goods);
  if(!Number.isInteger(a.coins)||a.coins<0) note('step '+step+' '+JSON.stringify(m)+': coins = '+a.coins);
  if(a.inv.length>x.BAG_MAX) note('step '+step+' '+JSON.stringify(m)+': the bag holds '+a.inv.length);
  if(step%20===0){   // what is in memory must survive a save and a login: nothing here may be above a cap that the sanitizer cuts
    const r=x.sanitizeGear(JSON.parse(JSON.stringify(a)),'warrior'), nz=o=>JSON.stringify(Object.entries(o||{}).filter(e=>e[1]).sort());
    const mine={coins:a.coins,inv:[...a.inv].sort(),res:nz(a.res),mats:nz(a.mats),pot:nz(a.pot),own:[...a.skills.owned].sort(),lv:nz(a.skills.lv),prof:Object.keys(a.prof).sort(),cos:[...a.cos].sort(),os:[...a.os].sort(),gem:a.gem};
    const kept={coins:r.coins,inv:[...r.inv].sort(),res:nz(r.res),mats:nz(r.mats),pot:nz(r.pot),own:[...r.skills.owned].sort(),lv:nz(r.skills.lv),prof:Object.keys(r.prof).sort(),cos:[...r.cos].sort(),os:[...r.os].sort(),gem:r.gem};
    for(const k of Object.keys(mine)) if(JSON.stringify(mine[k])!==JSON.stringify(kept[k])) note('step '+step+' '+JSON.stringify(m)+': '+k+' would change on the next login: '+JSON.stringify(mine[k]).slice(0,120)+' -> '+JSON.stringify(kept[k]).slice(0,120));
  }
  const paid=after.coins<before.coins||after.gem<before.gem;
  if(paid&&after.goods<=before.goods) note('step '+step+' '+JSON.stringify(m)+': paid (coins '+before.coins+' -> '+after.coins+', gems '+before.gem+' -> '+after.gem+') and got nothing');
  if(TRADES.includes(m.t)&&after.goods>before.goods&&!took(before.price,after.price)) note('step '+step+' '+JSON.stringify(m)+': got something and paid nothing');
}
if(bad.length){ console.log('FAIL economy fuzz:\n  '+bad.join('\n  ')); process.exit(1); }
console.log('PASS '+STEPS+' random shop, forge, lodge, trainer and gem shop messages: nothing paid for nothing, nothing free');
