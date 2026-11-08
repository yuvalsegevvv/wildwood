//@ The orb pop-up: a small card in the character's colour when stones arrive (the stones, the next Bond step's progress), stacked and merged while orbs keep opening
/* Agent map (skills revamp step 16; the event: orb [pid, set, stones, coins], bdcOnOrb in bond/orbs.js calls bdcPop; markup #bdcPops in index.html; styles/38-bonds.css; test: client-smoke).
   bdcPop(set, stones, coins): a card for the character; the same character's card still on screen takes the stones (and a count of orbs) instead of a second card; at most BDC_POP_MAX cards, the oldest goes first.
   bdcPopRefresh(): every `you` update (economy/items.js) re-words the progress line from the new gear (the orb event arrives before the gear that holds the stones).
   State: BDC_POPS = [{set, orbs, stones, coins, t (when it goes), el}]. A card lasts BDC_POP_SECS and the timer restarts when it merges. Pop-ups never take a tap (pointer-events none). */
var BDC_POPS=[];
const BDC_POP_MAX=3, BDC_POP_SECS=4.5;
function bdcPopProgress(set){   // "Bond III: 4 / 6 stones" or "Bond VI reached" for the card's second line
  const E=bdcEntry(set), S=SS_SETS[set]; if(!S) return '';
  if(E.b>=BD_TOP) return 'Bond VI: every step bought';
  const to=E.b+1, need=BD_COST[to], ready=E.st>=need, t=bdTierOk(GEAR||{},S,to);
  return 'Bond '+BD_ROMAN[to]+': '+Math.min(E.st,need)+' / '+need+' stones'+(ready?(t?' &middot; ready to buy':' &middot; needs zone tier '+ZTIER_ROMAN[bdTierNeed(S,to)]):'');
}
function bdcPopHtml(P0){
  const S=SS_SETS[P0.set], col=bdcCol(S), E=bdcEntry(P0.set), to=Math.min(BD_TOP,E.b+1), need=BD_COST[to]||1, pct=E.b>=BD_TOP?100:Math.round(100*Math.min(E.st,need)/need);
  const what=P0.stones>0?'+'+P0.stones+' Bondstone'+(P0.stones===1?'':'s'):'', coins=P0.coins>0?(what?', ':'')+'+'+P0.coins+' coins (beyond Bond VI)':'';
  return '<i class="bdc-pop-ico" style="--c:'+col+'"><svg '+SS_ICON_ATTR+'>'+(S.emblem?S.emblem.glyph:'')+'</svg></i><div class="bdc-pop-t"><b>'+S.char.name+' '+what+coins+'</b><span>'+(P0.orbs>1?P0.orbs+' orbs opened &middot; ':'')+bdcPopProgress(P0.set)+'</span><i class="bdc-pop-bar"><u style="width:'+pct+'%;background:'+col+'"></u></i></div>';
}
function bdcPopPaint(P0){ if(P0.el) P0.el.innerHTML=bdcPopHtml(P0); }
function bdcPop(set,stones,coins){
  const host=$('#bdcPops'); if(!host||!bdOwnKey(SS_SETS,set)) return;
  const now=performance.now(); let P0=BDC_POPS.find(q=>q.set===set&&q.t>now);
  if(P0){ P0.orbs++; P0.stones+=stones|0; P0.coins+=coins|0; }
  else { P0={set,orbs:1,stones:stones|0,coins:coins|0,t:0,el:null}; BDC_POPS.push(P0);
    const S=SS_SETS[set]; P0.el=document.createElement('div'); P0.el.className='bdc-pop'; P0.el.style.setProperty('--c',bdcCol(S)); host.appendChild(P0.el);
    while(BDC_POPS.length>BDC_POP_MAX){ const o=BDC_POPS.shift(); if(o.el&&o.el.remove) o.el.remove(); } }
  P0.t=now+BDC_POP_SECS*1000; bdcPopPaint(P0); if(P0.el.classList) P0.el.classList.remove('out');
  clearTimeout(bdcPopPaint.tm); bdcPopPaint.tm=setTimeout(bdcPopSweep,BDC_POP_SECS*1000+50);
}
function bdcPopSweep(){   // fade the cards whose time is up, drop them half a second later; look again when the next one is due
  const now=performance.now(); let next=0;
  for(let i=BDC_POPS.length-1;i>=0;i--){ const q=BDC_POPS[i];
    if(q.t<=now){ BDC_POPS.splice(i,1); if(q.el){ if(q.el.classList) q.el.classList.add('out'); const e=q.el; setTimeout(()=>{ if(e.remove) e.remove(); },600); } }
    else next=next?Math.min(next,q.t):q.t; }
  if(next) bdcPopPaint.tm=setTimeout(bdcPopSweep,Math.max(50,next-now+50));
}
function bdcPopRefresh(){ for(const q of BDC_POPS) bdcPopPaint(q); }
