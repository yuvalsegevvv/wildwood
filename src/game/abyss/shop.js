//@ The Abyss shop on the client (B10): a Shop tab in the Abyss window (Descend / Shop), the shard balance, today's stock and prices, locked specials, the shards a won round paid
/* agent map (docs/ABYSS.md section 4; the server side: server/abyss/pay.js)
   exports: abTabsAdd(el) (the tab row at the top of the Abyss window, abRender calls it), abShopRender(el) (the shop's rows from AB_UI.shop, the server's `abyss{a:'shop'}` answer), EVH.abs (a round paid: abs [pid, round, shards, bonus, balance])
   text always through textContent (names come from the shared rows, but the habit is the rule). Styles 42-abyss.css (.ab-tabs, .ab-shop). Test: tools/client-smoke.js (the Abyss case) */
const abBalanceNow=()=>AB_UI.shop?AB_UI.shop.as|0:(typeof GEAR!=='undefined'&&GEAR&&GEAR.ab?GEAR.ab.as|0:0);
function abTabsAdd(el){
  const t=document.createElement('div'); t.className='ab-tabs';
  for(const [id,nm] of [['go','Descend'],['shop','Shop']]){
    const b=document.createElement('button'); b.type='button'; b.className='chip'+(AB_UI.tab===id?' on':''); b.textContent=nm;
    b.onclick=()=>{ if(AB_UI.tab===id) return; AB_UI.tab=id; UI_SFX.click(); if(id==='shop') netSend({t:'abyss',a:'shop'}); abRender(); }; t.append(b); }
  const sh=document.createElement('span'); sh.className='ab-shards'; sh.textContent=fmtCoins(abBalanceNow())+' Abyssal Shards'; t.append(sh); el.append(t);
}
function abShopRender(el){
  const S=AB_UI.shop; if(!S){ const w=document.createElement('p'); w.className='ab-line'; w.textContent='The stalls are opening...'; el.append(w); return; }
  const part=(title,note,rows)=>{
    const h=document.createElement('div'); h.className='ab-sh-h'; const b=document.createElement('b'); b.textContent=title; const n=document.createElement('span'); n.textContent=note; h.append(b,n); el.append(h);
    for(const r of rows){
      const row=document.createElement('div'); row.className='ab-row ab-sh'+(r.ok?'':' locked'); const t=document.createElement('div'); t.className='ab-t';
      const nm=document.createElement('b'); nm.textContent=r.name; const sub=document.createElement('span'); sub.className='ab-note';
      sub.textContent=!r.ok?'Locked: beat '+AB_DIFFS[Math.max(0,r.open-1)].name+' once':r.kind==='special'?'No limit, '+fmtCoins(r.price)+' shards now (dearer with each one bought today)':fmtCoins(r.price)+' shards · '+r.left+' left today';
      t.append(nm,sub); row.append(t);
      const bt=document.createElement('button'); bt.type='button'; bt.className='chip buy ab-go'; bt.textContent=!r.ok?'Locked':r.kind==='common'&&r.left<1?'Sold out':'Buy';
      bt.disabled=!r.ok||(r.kind==='common'&&r.left<1)||r.price>(S.as|0); bt.onclick=()=>{ if(bt.disabled) return; UI_SFX.click(); netSend({t:'abyss',a:'buy',id:r.id,n:1}); }; row.append(bt); el.append(row);
    }
  };
  part('Daily stock','Refills every day at 00:00 UTC',S.rows.filter(r=>r.kind==='common'));
  part('Special items','Open once you have beaten a difficulty',S.rows.filter(r=>r.kind==='special'));
}
// a round paid: abs [pid, round, shards, bonus, balance]; the bar between rounds shows the run's total
EVH.abs=e=>{ if(e[1]!==NET.pid) return; AB_UI.earned=(AB_UI.earned|0)+(e[3]|0); if(AB_UI.shop) AB_UI.shop.as=e[5]|0; if(AB_UI.won) abBar(true,AB_UI.br|0,AB_UI.bk); };
