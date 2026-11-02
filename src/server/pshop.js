//@ Player shops: a registered hiker above level 10 lists equipment for coins and opens a stall; other registered hikers browse the open stalls and buy (equipment only, never materials, potions or tools)
/* agent map
   message in:  pshop{a:'mine'|'add'|'unlist'|'open'|'close'|'browse'|'view'|'buy', id, price, i, name}   (MSG.pshop; every action but 'mine' only in a village)
   events out (each to one player: e[1] is their pid):
     pshm [pid, open 0|1, items]            my stall: items = [[id, price], ...] (the escrow, gear.psh); sent on 'mine' and after every change
     pshl [pid, rows]                       open stalls: rows = [[name, level, itemCount], ...]
     pshv [pid, name, items]                one open stall's items [[id, price], ...] (items = null: it is closed)
   currency: coins (gear.coins), the game's only soft currency; no fee. A listed piece leaves the bag (escrow in gear.psh, saved) and comes back on unlist; a stall is open only while its owner is
   online (p.pshOpen is not saved), so a sale is always settled between two live players in one tick. A buy names the stall, the slot and the id AND price it saw: any mismatch is refused.
   rules:   PSHOP_MIN_LV 11 (above level 10), registered accounts only (isGuestP), tradeable = PSHOP_KINDS; tools, materials, potions, gems are not ITEM kinds in that list and cannot be listed.
   exports: pshopSanitize(g.psh) (players.js sanitizeGear)   test: tools/pshop-smoke.js   Panel: game/economy/pshop.js */
const PSHOP_MIN_LV=11, PSHOP_MAX=24, PSHOP_PRICE_MAX=1e9, PSHOP_KINDS=['weapon','armor','ring','pendant','talisman'];
const pshopTradeable=id=>{ const it=typeof id==='string'?ITEM[id]:null; return !!it&&PSHOP_KINDS.includes(it.kind); };
function pshopSanitize(a){
  const out=[]; if(!Array.isArray(a)) return out;
  for(const r of a){ if(!r||typeof r!=='object'||!pshopTradeable(r.id)) continue; const price=Math.floor(+r.price); if(!(price>=1)) continue; out.push({id:r.id,price:Math.min(PSHOP_PRICE_MAX,price)}); if(out.length>=PSHOP_MAX) break; }
  return out;
}
const pshopList=p=>p.gear.psh||(p.gear.psh=[]);
const pshopRows=p=>pshopList(p).map(r=>[r.id,r.price]);
function pshopMineP(p){ ev('pshm',p.id,p.pshOpen?1:0,pshopRows(p)).to=p.id; }
// who may trade at all: a registered account (a solo world has no accounts: everyone counts), level 11+, not in the public test world
function pshopOkP(p){
  if(io.test||isGuestP(p)){ toastTo(p.id,'Register an account to use player shops','bad'); return false; }
  if(p.level<PSHOP_MIN_LV){ toastTo(p.id,'Player shops open at level '+PSHOP_MIN_LV,'bad'); return false; }
  return true;
}
function pshopFind(name){ const n=String(name||'').trim().toLowerCase(); if(!n) return null; for(const q of S.players.values()) if(q.name.toLowerCase()===n) return q; return null; }
const pshopLive=q=>!!q&&q.pshOpen&&pshopList(q).length>0&&q.level>=PSHOP_MIN_LV&&!isGuestP(q);
function pshopMsgP(p,msg){
  const a=msg&&msg.a;
  if(a==='mine'){ pshopMineP(p); return; }
  if(!marketP(p)||!pshopOkP(p)) return;
  const L=pshopList(p);
  if(a==='add'){
    const id=msg.id, price=Math.floor(+msg.price);
    if(!pshopTradeable(id)){ toastTo(p.id,'Only equipment can be sold in a player shop','bad'); return; }
    if(!(price>=1)||price>PSHOP_PRICE_MAX){ toastTo(p.id,'Set a price from 1 to '+PSHOP_PRICE_MAX+' coins','bad'); return; }
    if(L.length>=PSHOP_MAX){ toastTo(p.id,'Your shop is full ('+PSHOP_MAX+' items)','bad'); return; }
    if(unwornCount(p,id)<1){ toastTo(p.id,'Take it off first, or keep a spare in your bag','bad'); return; }
    p.gear.inv.splice(p.gear.inv.lastIndexOf(id),1); L.push({id,price}); p.dirty=true; pshopMineP(p); return;
  }
  if(a==='unlist'){
    const i=msg.i|0; if(i<0||i>=L.length) return;
    if(p.gear.inv.length>=BAG_MAX){ toastTo(p.id,'Your bag is full','bad'); return; }
    p.gear.inv.push(L[i].id); L.splice(i,1); if(!L.length) p.pshOpen=false; p.dirty=true; pshopMineP(p); return;
  }
  if(a==='open'){ if(!L.length){ toastTo(p.id,'List something first','bad'); return; } p.pshOpen=true; toastTo(p.id,'Your shop is open','good'); pshopMineP(p); return; }
  if(a==='close'){ p.pshOpen=false; toastTo(p.id,'Your shop is closed','');  pshopMineP(p); return; }
  if(a==='browse'){
    const rows=[]; for(const q of S.players.values()) if(q!==p&&pshopLive(q)) rows.push([q.name,q.level,pshopList(q).length]);
    rows.sort((x,y)=>x[0].localeCompare(y[0])); ev('pshl',p.id,rows.slice(0,50)).to=p.id; return;
  }
  const q=pshopFind(msg.name);
  if(a==='view'){ ev('pshv',p.id,q?q.name:String(msg.name||'').slice(0,16),q&&q!==p&&pshopLive(q)?pshopRows(q):null).to=p.id; return; }
  if(a==='buy'){
    if(!q||q===p||!pshopLive(q)){ toastTo(p.id,'That shop is closed','bad'); return; }
    const QL=pshopList(q), i=msg.i|0, r=QL[i];
    if(!r||r.id!==msg.id||r.price!==Math.floor(+msg.price)){ toastTo(p.id,'That item is gone or its price changed','bad'); ev('pshv',p.id,q.name,pshopRows(q)).to=p.id; return; }
    if(p.gear.inv.length>=BAG_MAX){ toastTo(p.id,'Your bag is full','bad'); return; }
    if(p.gear.coins<r.price){ toastTo(p.id,'Not enough coins','bad'); return; }
    if(q.gear.coins+r.price>COINS_MAX){ toastTo(p.id,q.name+' cannot carry that many coins','bad'); return; }
    p.gear.coins-=r.price; q.gear.coins+=r.price; QL.splice(i,1); if(!QL.length) q.pshOpen=false;
    p.gear.inv.push(r.id); p.dirty=true; q.dirty=true;
    const it=ITEM[r.id]; toastTo(p.id,'Bought '+it.name+' from '+q.name+' for '+r.price+' coins','loot r'+it.rar); ev('loot',p.id,r.id);
    toastTo(q.id,p.name+' bought '+it.name+' for '+r.price+' coins','good');
    pshopMineP(q); ev('pshv',p.id,q.name,q.pshOpen?pshopRows(q):null).to=p.id;
  }
}
MSG.pshop=(p,msg)=>pshopMsgP(p,msg);
