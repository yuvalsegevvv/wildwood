//@ The Abyss's pay and shop (B10): Abyssal Shards credited as each round is won, the clear bonus, the Abyss shop (daily stock of common items, specials whose price rises with each one bought today) and the buy checks
/* agent map (docs/ABYSS.md section 4; numbers: shared/abyss/shop.js)
   exports: abDayS() (the UTC day number, gsDayOf: the daily quest set's reset), abPayRoundP(p,run,last) (rounds.js abRoundWonS hook), abShopP(p) (abyss{a:'shop'}), abBuyP(p,id,n) (abyss{a:'buy'}), abGiveS(p,to,n,dry) (what a row hands over)
   save: gear.ab.as (the shards), gear.ab.sh = {d: the UTC day, n: {shop id: bought today}} (a new day empties it), gear.ab.lock / .prism (counts), gear.awm.abyss (the Abyss Heart), and the common items' own saves (gear.rsw / rsa / rsr, temper, coins, awm.echo, awm.ess_*)
   events: abs [pid, round, shards (this round, bonus included), bonus, balance] after a won round; messages out: {t:'abyss',a:'shop',as,top,d,rows:[{id,name,kind,price,left,open,ok}]} (price = the next one's; left = the daily stock left of a common row, -1 for a special)
   rules: a guest (isGuestP) earns no shards; the whole check comes before the charge (id an own row, n an integer 1..AB_BUY_MAX, opened, stock, enough shards, room for the goods), then charge, then grant; refused inside a run
   test: tools/abyss-smoke.js, tools/economy-fuzz.js */
const abDayS=()=>gsDayOf(Date.now());
// today's purchases: a new day starts them from nothing (stock back, specials back to the base price)
function abShDayP(p){ const g=abSaveOf(p), d=abDayS(); if(g.sh.d!==d){ g.sh={d,n:{}}; p.dirty=true; } return g.sh; }
const abBoughtS=(sh,id)=>Object.prototype.hasOwnProperty.call(sh.n,id)?sh.n[id]|0:0;
// shards for a won round; the last round of a finite difficulty adds the clear bonus
function abPayRoundP(p,run,last){
  const g=abSaveOf(p);
  if(isGuestP(p)){ if(run.abR===1&&run.abKind!=='event'&&run.abKind!=='shrine') toastTo(p.id,'Register an account to earn Abyssal Shards.','bad'); return; }
  const bonus=last?abClearBonus(run.abD):0, n=abShardsOf(run.abD,run.abR,run.abKind)+bonus; if(!(n>0)) return;
  const before=g.as|0; g.as=Math.min(AB_AS_MAX,before+n); const add=g.as-before; if(add<=0) return;
  dgEvTo('abs',p.id,run.abR,add,bonus,g.as); toastTo(p.id,'+'+add+' Abyssal Shards'+(bonus?' (clear bonus '+bonus+')':''),'good'); p.dirty=true;
}
// where a row's goods go: the amount held, the cap and a setter. null = not a known item
function abSlotS(p,to){
  const g=p.gear, a=abSaveOf(p), aw=()=>g.awm||(g.awm={});
  if(to==='rsw'||to==='rsa'||to==='rsr') return {have:g[to]|0,cap:RL_STONE_MAX,set:v=>{ g[to]=v; }};
  if(to==='temper') return {have:g.temper|0,cap:DG_STONE_MAX,set:v=>{ g.temper=v; }};
  if(to==='coins') return {have:Math.floor(+g.coins||0),cap:COINS_MAX,set:v=>{ g.coins=v; }};
  if(to==='echo'||to==='heart'||essOf(to)){ const k=to==='heart'?'abyss':to, w=aw(), cap=to==='echo'?AWK_STORE_MAX:to==='heart'?AB_HEART_MAX:MAT_MAX; return {have:awkOwn(w,k)?w[k]|0:0,cap,set:v=>{ w[k]=v; }}; }
  if(to==='lock') return {have:a.lock|0,cap:AB_LOCK_MAX,set:v=>{ a.lock=v; }};
  if(to==='prism') return {have:a.prism|0,cap:AB_PRISM_MAX,set:v=>{ a.prism=v; }};
  return null;
}
// is there room for n units of a row (dry) / hand them over
function abGiveS(p,row,n,dry){ const s=abSlotS(p,row.give.to), q=row.give.n*n; if(!s||s.have+q>s.cap) return false; if(!dry) s.set(s.have+q); return true; }
const abOpenTxt=row=>'Beat '+AB_DIFFS[Math.max(0,row.open-1)].name+' once to open this.';
function abShopRowsP(p){
  const g=abSaveOf(p), sh=abShDayP(p);
  return AB_SHOP.map(r=>{ const b=abBoughtS(sh,r.id); return {id:r.id,name:r.name,kind:r.kind,price:Math.min(1e15,abShopPrice(r,b,1)),left:r.kind==='special'?-1:Math.max(0,r.day-b),open:r.open|0,ok:(g.top|0)>=r.open?1:0}; });
}
function abShopP(p){
  if(!abOnS()) return;
  if((p.level|0)<AB_ENTRY_LV){ toastTo(p.id,'The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
  const g=abSaveOf(p); sendTo(p.id,{t:'abyss',a:'shop',as:g.as|0,top:g.top|0,d:abDayS(),rows:abShopRowsP(p)});
}
function abBuyP(p,id,n){
  if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>AB_BUY_MAX) return;
  const row=abShopRow(id); if(!row||p.inst||p.dead) return;
  if((p.level|0)<AB_ENTRY_LV){ toastTo(p.id,'The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
  const g=abSaveOf(p), sh=abShDayP(p), b=abBoughtS(sh,row.id);
  if((g.top|0)<row.open){ toastTo(p.id,abOpenTxt(row),'bad'); return; }
  if(row.kind!=='special'&&n>row.day-b){ toastTo(p.id,row.day-b>0?'Only '+(row.day-b)+' left today.':'Sold out for today. The stock comes back at 00:00 UTC.','bad'); return; }
  const price=abShopPrice(row,b,n); if(!(price<=(g.as|0))){ toastTo(p.id,'You need '+(price>=1e15?'far more':price)+' Abyssal Shards.','bad'); abShopP(p); return; }
  if(!abGiveS(p,row,n,true)){ toastTo(p.id,'You cannot hold any more of that.','bad'); return; }
  g.as-=price; abGiveS(p,row,n,false); sh.n[row.id]=Math.min(9999,b+n); p.dirty=true;   // charge first, then grant (the room was checked above)
  toastTo(p.id,'Bought '+(n>1?n+' x ':'')+row.name+' for '+price+' shards.','loot r2');
  abShopP(p);
}
